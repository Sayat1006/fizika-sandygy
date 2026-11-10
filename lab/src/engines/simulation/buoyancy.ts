import { G, clamp } from '../physics/core';
import { INSTRUMENTS, fmt, instrumentError, read } from '../physics/uncertainty';
import type { Params, Readings, Simulation } from './types';

export interface Body {
  name: string;
  rho: number; // кг/м³
  V: number; // м³
  color: string;
}
export interface Liquid {
  name: string;
  rho: number;
  color: string;
}

export const BODIES: Body[] = [
  { name: 'Алюминий цилиндр, 100 см³', rho: 2700, V: 100e-6, color: '#c9ced6' },
  { name: 'Алюминий цилиндр, 150 см³', rho: 2700, V: 150e-6, color: '#c9ced6' },
  { name: 'Болат цилиндр, 50 см³', rho: 7800, V: 50e-6, color: '#7d8590' },
  { name: 'Жез цилиндр, 50 см³', rho: 8500, V: 50e-6, color: '#c9a24a' },
];
export const LIQUIDS: Liquid[] = [
  { name: 'Су (1000 кг/м³)', rho: 1000, color: '#6fb6f2' },
  { name: 'Тұз ерітіндісі (1180 кг/м³)', rho: 1180, color: '#8fc7d9' },
  { name: 'Керосин (800 кг/м³)', rho: 800, color: '#e6cf7a' },
];

export const VESSEL = {
  area: 30e-4, // м²
  height: 0.2,
  V0: 300e-6, // м³ — құйылған сұйық көлемі
  bodyRadius: 0.02,
  holderMin: 0.006,
  holderMax: 0.3,
};

export const bodyHeight = (b: Body) => b.V / (Math.PI * VESSEL.bodyRadius ** 2);

/**
 * Архимед күші: дене сұйыққа батқан сайын деңгей көтеріледі.
 * Бату тереңдігі d мен деңгей h өзара байланысты:
 *   h = h0 + A_д·d / A_ыд,   d = clamp((h0 − y) / (1 − A_д/A_ыд), 0, H)
 * Динамометр: F = ρ_д·V·g − ρ_с·g·A_д·d. Квазистатикалық модель (аналитикалық).
 */
export class BuoyancySim implements Simulation {
  y = VESSEL.holderMax; // дененің төменгі жағының ыдыс түбінен биіктігі
  vy = 0;
  P0: number | null = null;
  V0read: number | null = null;
  private key = '';

  reset(p: Params) {
    this.y = VESSEL.holderMax;
    this.vy = 0;
    this.P0 = null;
    this.V0read = null;
    p.holder = VESSEL.holderMax;
  }

  state(p: Params) {
    const body = BODIES[p.body] ?? BODIES[0];
    const liquid = LIQUIDS[p.liquid] ?? LIQUIDS[0];
    const Ab = Math.PI * VESSEL.bodyRadius ** 2;
    const H = bodyHeight(body);
    const h0 = VESSEL.V0 / VESSEL.area;
    const d = clamp((h0 - this.y) / (1 - Ab / VESSEL.area), 0, H);
    const Vsub = Ab * d;
    const level = h0 + Vsub / VESSEL.area;
    const weight = body.rho * body.V * G;
    const FA = liquid.rho * G * Vsub;
    return { body, liquid, H, d, Vsub, level, weight, FA, F: weight - FA };
  }

  step(dt: number, p: Params) {
    const key = `${p.body}|${p.liquid}`;
    if (key !== this.key) {
      this.key = key;
      this.P0 = null;
      this.V0read = null;
    }
    const target = clamp(p.holder, VESSEL.holderMin, VESSEL.holderMax);
    this.vy = clamp((target - this.y) * 10, -0.25, 0.25);
    this.y += this.vy * dt;
    const st = this.state(p);
    if (st.d === 0 && Math.abs(this.vy) < 0.002 && this.P0 === null) {
      this.P0 = read(INSTRUMENTS.dynamometer, st.F);
      this.V0read = read(INSTRUMENTS.cylinder, st.level * VESSEL.area);
    }
  }

  readings(p: Params): Readings {
    const st = this.state(p);
    const dyn = INSTRUMENTS.dynamometer;
    const cyl = INSTRUMENTS.cylinder;
    const P1 = read(dyn, st.F);
    const V1 = read(cyl, st.level * VESSEL.area);
    const settled = Math.abs(this.vy) < 0.002;
    const latched = this.P0 !== null && this.V0read !== null;
    const V = latched ? Number((V1 - this.V0read!).toFixed(9)) : 0;
    const ml = (v: number) => fmt(v * 1e6, 0);
    return {
      values: { P: this.P0 ?? 0, P1, V, rho: st.liquid.rho, body: p.body, liquid: p.liquid },
      errors: { P: instrumentError(dyn), P1: instrumentError(dyn), V: 2 * instrumentError(cyl) },
      ref: st.liquid.rho,
      canRecord: latched && settled && st.d > 0 && V > 0,
      hint: !latched
        ? 'Денені сұйықтан толық шығарып, ауадағы салмағын өлшеңіз'
        : st.d === 0
          ? 'Денені төмен түсіріп, сұйыққа батырыңыз'
          : !settled
            ? 'Көрсеткіштер тұрақталғанын күтіңіз'
            : V <= 0
              ? 'Денені тереңірек батырыңыз — көлем өзгерісі бөлік құнынан аз'
              : st.d >= st.H - 1e-9
                ? 'Дене толық батты — көрсетуді жазыңыз'
                : 'Дене жартылай батқан — көрсетуді жазуға болады',
      display: [
        { label: 'Динамометр көрсетуі', text: `${fmt(P1, 1)} Н`, instrument: 'Динамометр' },
        { label: 'Ауадағы салмақ P', text: this.P0 === null ? '—' : `${fmt(this.P0, 1)} Н`, instrument: 'Динамометр (бекітілген)' },
        { label: 'Сұйық деңгейі V₁', text: `${ml(V1)} мл`, instrument: 'Өлшеуіш ыдыс' },
        { label: 'Бастапқы деңгей V₀', text: this.V0read === null ? '—' : `${ml(this.V0read)} мл`, instrument: 'Өлшеуіш ыдыс (бекітілген)' },
      ],
    };
  }
}
