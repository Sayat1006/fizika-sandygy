import { G, deg2rad } from '../physics/core';
import { mechanics } from '../physics/formulas';
import { INSTRUMENTS, fmt, instrumentError, read } from '../physics/uncertainty';
import type { Params, Readings, Sample, Simulation } from './types';

export const TRACK = { length: 1.2, startMin: 0.2, startMax: 1.0 };

/**
 * Трек бойымен қозғалатын арбаша (көлбеу трек және/немесе блок арқылы асылған жүк).
 * Үдеу аналитикалық формуладан (mechanics.cartAcceleration) алынады; қозғалыс
 * жылдамдықтық Верле схемасымен интегралданады (тұрақты үдеу үшін дәл):
 *   s += v·dt + a·dt²/2;  v += a·dt.
 * Мәреден өту уақыты қадам ішінде сызықтық интерполяциямен нақтыланады.
 */
export class TrackSim implements Simulation {
  phase: 'ready' | 'running' | 'done' | 'stuck' = 'ready';
  s = 0; // жүрілген жол
  v = 0;
  a = 0;
  t = 0;
  tFinish = 0;
  series: Sample[] = [];
  private nextSample = 0;

  reset() {
    this.phase = 'ready';
    this.s = this.v = this.a = this.t = this.tFinish = 0;
    this.series = [];
    this.nextSample = 0;
  }

  action(id: string, p: Params) {
    if (id !== 'release') return;
    this.reset();
    const a = this.accel(p);
    this.phase = a > 0 ? 'running' : 'stuck';
  }

  accel(p: Params) {
    return mechanics.cartAcceleration(p.M, p.mh ?? 0, deg2rad(p.angle), p.mu);
  }

  /** Жіптің керілу күші: T = m·(g − a) */
  tension(p: Params) {
    return (p.mh ?? 0) * (G - (this.phase === 'running' ? this.a : 0));
  }

  step(dt: number, p: Params) {
    if (this.phase !== 'running') return;
    this.a = this.accel(p);
    const s1 = this.s + this.v * dt + (this.a * dt * dt) / 2;
    const v1 = this.v + this.a * dt;
    if (this.t >= this.nextSample) {
      this.series.push({ t: this.t, x: this.s, v: this.v, a: this.a });
      this.nextSample += 0.02;
    }
    if (s1 >= p.start) {
      // s(τ) = s + vτ + aτ²/2 = start теңдеуін шешеміз
      const ds = p.start - this.s;
      const tau = this.a > 1e-12 ? (-this.v + Math.sqrt(this.v * this.v + 2 * this.a * ds)) / this.a : ds / this.v;
      this.t += tau;
      this.v += this.a * tau;
      this.s = p.start;
      this.tFinish = this.t;
      this.series.push({ t: this.t, x: this.s, v: this.v, a: this.a });
      this.a = 0;
      this.phase = 'done';
      return;
    }
    this.s = s1;
    this.v = v1;
    this.t += dt;
  }

  readings(p: Params): Readings {
    const sw = INSTRUMENTS.stopwatch;
    const s = read(INSTRUMENTS.ruler, p.start);
    const t = read(sw, this.phase === 'done' ? this.tFinish : this.t);
    const hasWeight = (p.mh ?? 0) > 0;
    const display = [
      { label: 'Уақыт t', text: `${fmt(t, 2)} с`, instrument: 'Секундомер (фотоқақпа)' },
      { label: 'Жол s', text: `${fmt(s * 100, 1)} см`, instrument: 'Сызғыш' },
      { label: 'Арбаша массасы M', text: `${fmt(p.M * 1000, 0)} г`, instrument: 'Таразы' },
    ];
    if (hasWeight) display.push({ label: 'Асылған жүк m', text: `${fmt(p.mh * 1000, 0)} г`, instrument: 'Таңбаланған жүк' });
    else display.push({ label: 'Бұрыш α', text: `${fmt(p.angle, 0)}°`, instrument: 'Транспортир' });
    return {
      values: { s, t, M: p.M, mh: p.mh ?? 0, angle: p.angle },
      errors: { s: instrumentError(INSTRUMENTS.ruler), t: instrumentError(sw) },
      ref: this.accel(p),
      canRecord: this.phase === 'done',
      hint:
        this.phase === 'done'
          ? 'Арбаша мәреге жетті — уақытты жазыңыз'
          : this.phase === 'running'
            ? 'Арбаша қозғалып келеді…'
            : this.phase === 'stuck'
              ? 'Арбаша қозғалмады: қозғаушы күш кедергі күшінен аспайды'
              : 'Арбашаны бастапқы орынға қойып, «Жіберу» батырмасын басыңыз',
      display,
    };
  }
}
