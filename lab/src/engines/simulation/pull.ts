import { G, clamp, deg2rad } from '../physics/core';
import { mechanics } from '../physics/formulas';
import { INSTRUMENTS, fmt, instrumentError, read } from '../physics/uncertainty';
import { WEIGHT_MASS, type Params, type Readings, type Simulation } from './types';

export const PULL = {
  blockMass: 0.1, // кг
  kDyn: 100, // Н/м — динамометр серіппесінің қатаңдығы (5 Н ↔ 5 см)
  sMin: 0.1,
  sMax: 0.62,
  handMax: 0.7,
  maxExt: 0.058,
  path: 0.5, // м — ПӘК есептелетін жол ұзындығы (тақтайдағы белгілер арасы)
  autoSpeed: 0.05, // м/с
  staticRatio: 1.05, // μ_тыныштық / μ_сырғанау
};

/**
 * Динамометр арқылы тартылатын білеуше (горизонталь немесе көлбеу тақтай).
 * Динамометр — қол мен дене арасындағы серіппе: F = k_д·e + c·(v_қол − v).
 * Үйкеліс: тыныштықта |F_қозғ| ≤ μ_т·N болса дене қозғалмайды, әйтпесе μ·N сырғанау үйкелісі.
 * Интегралдау: жартылай айқын емес Эйлер, қадамы 1/600 с.
 */
export class PullSim implements Simulation {
  s = PULL.sMin; // білеушенің тақтай бойындағы орны
  v = 0;
  a = 0;
  h = PULL.sMin; // қолдың (динамометр ілгегінің бастапқы нүктесі) тегістелген орны
  vh = 0;
  F = 0;
  auto = false;
  /** бірқалыпты қозғалыс соңғы рет байқалғаннан бергі «ұстап тұру» уақыты, с */
  private hold = 0;

  reset(p: Params) {
    this.s = PULL.sMin;
    this.h = PULL.sMin;
    this.v = this.a = this.vh = this.F = 0;
    this.auto = false;
    this.hold = 0;
    p.hand = PULL.sMin;
  }

  action(id: string) {
    if (id === 'auto') this.auto = !this.auto;
  }

  mass(p: Params) {
    return PULL.blockMass + p.n * WEIGHT_MASS;
  }

  step(dt: number, p: Params) {
    const theta = deg2rad(p.angle);
    const m = this.mass(p);
    const N = m * G * Math.cos(theta);
    const target = p.hand;
    let patch: Partial<Params> | undefined;
    if (this.auto) {
      if (this.h >= PULL.handMax - 1e-4 || this.s >= PULL.sMax - 1e-4) {
        this.auto = false;
      }
      patch = { hand: clamp(this.h, PULL.sMin, PULL.handMax) };
    }
    // Қол қозғалысы: шектелген жылдамдықпен нысанаға ұмтылады
    // (автоматты режимде — тұрақты жылдамдықпен жылжиды)
    const want = this.auto ? PULL.autoSpeed : clamp((target - this.h) * 12, -0.35, 0.35);
    this.vh += (want - this.vh) * Math.min(1, dt * 3); // қолдың инерциясы тышқан дірілін тегістейді
    let h = this.h + this.vh * dt;
    h = clamp(h, this.s, Math.min(PULL.handMax, this.s + PULL.maxExt));
    this.vh = (h - this.h) / dt;
    this.h = h;

    const e = this.h - this.s;
    const c = 2 * 0.8 * Math.sqrt(PULL.kDyn * m);
    this.F = e > 0 ? Math.max(0, PULL.kDyn * e + c * (this.vh - this.v)) : 0;

    const drive = this.F - m * G * Math.sin(theta);
    const muS = p.mu * PULL.staticRatio;
    if (Math.abs(this.v) < 1e-5) {
      if (Math.abs(drive) <= muS * N) {
        this.a = 0;
        this.v = 0;
      } else {
        this.a = (drive - Math.sign(drive) * p.mu * N) / m;
        this.v = this.a * dt;
      }
    } else {
      const dir = Math.sign(this.v);
      this.a = (drive - dir * p.mu * N) / m;
      const nv = this.v + this.a * dt;
      this.v = Math.sign(nv) !== dir ? 0 : nv;
    }
    this.s += this.v * dt;
    this.hold = this.v > 0.005 && Math.abs(this.a) < 0.1 ? 0.25 : Math.max(0, this.hold - dt);
    if (this.s <= PULL.sMin) {
      this.s = PULL.sMin;
      if (this.v < 0) this.v = 0;
    }
    if (this.s >= PULL.sMax) {
      this.s = PULL.sMax;
      if (this.v > 0) this.v = 0;
    }
    return patch;
  }

  readings(p: Params): Readings {
    const theta = deg2rad(p.angle);
    const m = this.mass(p);
    const dyn = INSTRUMENTS.dynamometer;
    const Fr = read(dyn, this.F);
    const P = read(dyn, m * G);
    const l = PULL.path;
    const h = read(INSTRUMENTS.ruler, l * Math.sin(theta));
    const inclined = p.angle > 0.5;
    const moving = this.v > 0.005 || this.hold > 0;
    const steady = this.hold > 0;
    const overload = this.F > dyn.max;
    const display = [
      { label: 'Тарту күші F', text: `${fmt(Fr, 1)} Н`, instrument: 'Динамометр' },
      { label: 'Дененің салмағы P', text: `${fmt(P, 1)} Н`, instrument: 'Динамометр (алдын ала өлшенген)' },
    ];
    if (inclined) {
      display.push(
        { label: 'Биіктік h', text: `${fmt(h * 100, 1)} см`, instrument: 'Сызғыш' },
        { label: 'Жол l', text: `${fmt(l * 100, 1)} см`, instrument: 'Сызғыш' },
        { label: 'Бұрыш α', text: `${fmt(p.angle, 0)}°`, instrument: 'Транспортир' },
      );
    }
    return {
      values: { P, F: Fr, h, l, angle: p.angle, mu: p.mu },
      errors: {
        P: instrumentError(dyn),
        F: instrumentError(dyn),
        h: instrumentError(INSTRUMENTS.ruler),
        l: instrumentError(INSTRUMENTS.ruler),
      },
      ref: inclined ? mechanics.inclineEfficiency(theta, p.mu) : p.mu,
      canRecord: steady && !overload,
      hint: overload
        ? 'Динамометрдің өлшеу шегінен асып кетті (5 Н)!'
        : steady
          ? 'Дене бірқалыпты қозғалып келеді — көрсетуді жазыңыз'
          : moving
            ? 'Жылдамдық өзгеруде — бірқалыпты тартыңыз'
            : 'Динамометрді тартып, денені бірқалыпты қозғалтыңыз',
      display,
    };
  }
}
