import { G } from '../physics/core';
import { INSTRUMENTS, fmt, instrumentError, read } from '../physics/uncertainty';
import { WEIGHT_MASS, type Params, type Readings, type Simulation } from './types';

/**
 * Серіппеге ілінген жүк: m·ẍ = m·g − k·x − c·ẋ.
 * Жартылай айқын емес (симплектикалық) Эйлер әдісі, қадамы 1/600 с.
 * Ілгек пен серіппенің өз массасы (20 г) тек инерцияға қосылады — жуықтау.
 */
export class SpringSim implements Simulation {
  x = 0; // серіппенің ұзаруы, м
  v = 0;
  a = 0;

  reset() {
    this.x = 0;
    this.v = 0;
    this.a = 0;
  }

  step(dt: number, p: Params) {
    const m = p.n * WEIGHT_MASS;
    const inertia = m + 0.02;
    const c = 2 * 0.16 * Math.sqrt(p.k * inertia);
    this.a = (m * G - p.k * this.x - c * this.v) / inertia;
    this.v += this.a * dt;
    this.x += this.v * dt;
  }

  readings(p: Params): Readings {
    const F = Math.max(0, p.k * this.x);
    const settled = Math.abs(this.v) < 0.002 && Math.abs(this.a) < 0.02;
    const Fr = read(INSTRUMENTS.dynamometer, F);
    const xr = read(INSTRUMENTS.ruler, Math.max(0, this.x));
    return {
      values: { m: p.n * WEIGHT_MASS, F: Fr, x: xr },
      errors: { F: instrumentError(INSTRUMENTS.dynamometer), x: instrumentError(INSTRUMENTS.ruler) },
      ref: p.k,
      canRecord: p.n > 0 && settled,
      hint: p.n === 0 ? 'Серіппеге жүк іліңіз' : settled ? 'Көрсеткіштер тұрақталды — жазуға болады' : 'Тербеліс басылғанын күтіңіз',
      display: [
        { label: 'Күш F', text: `${fmt(Fr, 1)} Н`, instrument: 'Динамометр' },
        { label: 'Ұзару x', text: `${fmt(xr * 1000, 0)} мм`, instrument: 'Сызғыш' },
        { label: 'Жүктер массасы m', text: `${fmt(p.n * WEIGHT_MASS * 1000, 0)} г`, instrument: 'Таңбаланған жүктер' },
      ],
    };
  }
}
