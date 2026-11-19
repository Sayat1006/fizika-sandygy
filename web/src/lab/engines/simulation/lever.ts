import { G, clamp } from '../physics/core';
import { INSTRUMENTS, fmt, instrumentError, read } from '../physics/uncertainty';
import { WEIGHT_MASS, type Params, type Readings, type Simulation } from './types';

export const LEVER = { half: 0.2, hole: 0.05, maxTilt: 0.18, inertia: 0.004 };

/**
 * Иіндік (рычаг): ортасынан бекітілген біліктің айналуы I·φ̈ = M_сол − M_оң − M_өз − c·φ̇, бұрыш тіреумен шектелген.
 * Сол жақ: nL жүк lL қашықтықта, оң жақ: nR жүк lR қашықтықта. φ > 0 — сол жақ төмен.
 */
export class LeverSim implements Simulation {
  phi = 0;
  w = 0;

  reset() { this.phi = 0; this.w = 0; }

  moments(p: Params) {
    const c = Math.cos(this.phi);
    return { M1: p.nL * WEIGHT_MASS * G * p.lL * c, M2: p.nR * WEIGHT_MASS * G * p.lR * c };
  }

  step(dt: number, p: Params) {
    const { M1, M2 } = this.moments(p);
    const I = LEVER.inertia + (p.nL * p.lL * p.lL + p.nR * p.lR * p.lR) * WEIGHT_MASS;
    // иіндіктің өз ауырлық центрі тіректен 3 см төмен — тепе-теңдікте көлденең қалпына оралады; өшу — критикалыққа жақын
    const kr = 0.1 * 9.81 * 0.03, c = 1.4 * Math.sqrt(kr * I);
    this.w += ((M1 - M2 - kr * Math.sin(this.phi) - c * this.w) / I) * dt;
    this.phi += this.w * dt;
    if (Math.abs(this.phi) > LEVER.maxTilt) { this.phi = clamp(this.phi, -LEVER.maxTilt, LEVER.maxTilt); this.w = 0; }
  }

  readings(p: Params): Readings {
    const F1 = p.nL * WEIGHT_MASS * G, F2 = p.nR * WEIGHT_MASS * G;
    const l1 = read(INSTRUMENTS.ruler, p.lL), l2 = read(INSTRUMENTS.ruler, p.lR);
    const balanced = Math.abs(F1 * p.lL - F2 * p.lR) < 1e-6;
    const level = Math.abs(this.phi) < 0.01 && Math.abs(this.w) < 0.02;
    const both = p.nL > 0 && p.nR > 0;
    return {
      values: { F1: Number(F1.toFixed(3)), l1, F2: Number(F2.toFixed(3)), l2 },
      errors: { F1: 0.005 * Math.max(1, p.nL), l1: instrumentError(INSTRUMENTS.ruler), F2: 0.005 * Math.max(1, p.nR), l2: instrumentError(INSTRUMENTS.ruler) },
      ref: 1,
      canRecord: both && balanced && level,
      hint: !both ? 'Жүктерді тышқанмен иіндіктің екі жағындағы ілгектерге іліңіз'
        : !balanced ? (this.phi > 0 ? 'Сол жақ басым — жүкті немесе иінді өзгертіңіз' : 'Оң жақ басым — жүкті немесе иінді өзгертіңіз')
        : !level ? 'Иіндік тұрақталуын күтіңіз'
        : 'Иіндік тепе-теңдікте — кестеге жазыңыз',
      display: [
        { label: 'Сол жақ: F₁', text: `${fmt(F1, 2)} Н`, instrument: `${p.nL} жүк × 100 г` },
        { label: 'Иін l₁', text: `${fmt(l1 * 100, 0)} см`, instrument: 'Иіндік шкаласы' },
        { label: 'Оң жақ: F₂', text: `${fmt(F2, 2)} Н`, instrument: `${p.nR} жүк × 100 г` },
        { label: 'Иін l₂', text: `${fmt(l2 * 100, 0)} см`, instrument: 'Иіндік шкаласы' },
      ],
    };
  }
}
