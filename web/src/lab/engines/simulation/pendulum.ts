import { G, clamp } from '../physics/core';
import { INSTRUMENTS, fmt, instrumentError, read } from '../physics/uncertainty';
import type { Params, Readings, Simulation } from './types';

/** Секундомерді қолмен басқандағы реакция қателігі (с) */
export const REACTION = 0.1;

/**
 * Математикалық маятник: θ̈ = −(g/L)·sin θ − c·θ̇ (сызықтандырылмаған, үлкен бұрышта период ұзарады).
 * «Санау» әрекеті: N толық тербелістің уақытын секундомер өлшейді (бастау/тоқтату — тепе-теңдік нүктесінен өткенде),
 * қолмен басудың кездейсоқ реакция қателігі қосылады.
 */
export class PendulumSim implements Simulation {
  th = 0;
  w = 0;
  /** сүйреп тұрғанда бұрыш осы мәнге бекітіледі */
  hold: number | null = null;
  t = 0;
  phase: 'idle' | 'armed' | 'running' | 'done' = 'idle';
  count = 0;
  tStart = 0;
  measured = 0;
  private jitter = 0;

  reset() {
    this.th = this.w = 0;
    this.hold = null;
    this.phase = 'idle';
    this.count = 0;
    this.measured = 0;
  }

  action(id: string) {
    if (id !== 'count') return;
    if (Math.abs(this.th) < 0.01 && Math.abs(this.w) < 0.01) return; // маятник қозғалмайды
    this.phase = 'armed';
    this.count = 0;
    this.measured = 0;
    this.jitter = (Math.random() * 2 - 1) * REACTION * 0.8;
  }

  step(dt: number, p: Params) {
    this.t += dt;
    if (this.hold !== null) {
      this.th = this.hold;
      this.w = 0;
      if (this.phase !== 'idle') this.phase = 'idle';
      return;
    }
    const prev = this.th;
    this.w += (-(G / p.L) * Math.sin(this.th) - 0.012 * this.w) * dt;
    this.th += this.w * dt;
    // тепе-теңдік нүктесінен оңға қарай өту — бір толық тербелістің басы/соңы
    if (prev < 0 && this.th >= 0) {
      if (this.phase === 'armed') { this.phase = 'running'; this.tStart = this.t; this.count = 0; }
      else if (this.phase === 'running') {
        this.count++;
        if (this.count >= p.N) { this.phase = 'done'; this.measured = this.t - this.tStart + this.jitter; }
      }
    }
  }

  amplitude(p: Params) {
    // энергиядан амплитуданы бағалау
    const E = (this.w * this.w * p.L) / (2 * G) + (1 - Math.cos(this.th));
    return Math.acos(clamp(1 - E, -1, 1));
  }

  readings(p: Params): Readings {
    const Lr = read(INSTRUMENTS.ruler, p.L);
    const shown = this.phase === 'running' ? this.t - this.tStart : this.measured;
    const tr = read(INSTRUMENTS.stopwatch, Math.max(0, shown));
    const ampDeg = (this.amplitude(p) * 180) / Math.PI;
    const done = this.phase === 'done';
    return {
      values: { L: Lr, N: p.N, t: tr },
      errors: { L: instrumentError(INSTRUMENTS.ruler), t: instrumentError(INSTRUMENTS.stopwatch) + REACTION },
      ref: G,
      canRecord: done && this.measured > 0,
      hint: this.hold !== null ? 'Шарды жіберіңіз — маятник тербеле бастайды'
        : ampDeg < 1 ? 'Шарды тышқанмен бір жаққа ауытқытып (5–10°), жіберіңіз'
        : ampDeg > 15 && this.phase === 'idle' ? 'Ауытқу бұрышы кіші болсын (10°-тан аз) — әйтпесе период ұзарады'
        : this.phase === 'idle' ? `«${p.N} тербелісті санау» батырмасын басыңыз`
        : this.phase === 'armed' ? 'Секундомер шар тепе-теңдік нүктесінен өткенде қосылады…'
        : this.phase === 'running' ? `Санап жатыр: ${this.count} / ${p.N}`
        : 'Уақыт өлшенді — кестеге жазыңыз. Жіп ұзындығын өзгертіп, қайталаңыз',
      display: [
        { label: 'Жіп ұзындығы L', text: `${fmt(Lr * 100, 1)} см`, instrument: 'Сызғыш' },
        { label: `${p.N} тербеліс уақыты t`, text: `${fmt(tr, 2)} с`, instrument: 'Секундомер' },
        { label: 'Тербелістер', text: `${this.phase === 'running' ? this.count : done ? p.N : 0} / ${p.N}`, instrument: 'Санау' },
        { label: 'Ауытқу бұрышы', text: `${fmt(ampDeg, 0)}°`, instrument: 'Транспортир' },
      ],
    };
  }
}
