import { deg2rad, rad2deg } from '../physics/core';
import { INSTRUMENTS, fmt, instrumentError, read } from '../physics/uncertainty';
import type { Params, Readings, Simulation } from './types';

/**
 * Оптикалық шайба: жарты цилиндр шыныға жалпақ жағынан түскен жарық сәулесі.
 * Снеллиус заңы: sin α = n·sin β. Шығарда сәуле радиус бойымен өтеді — бағыты өзгермейді.
 */
export class RefractionSim implements Simulation {
  reset() {}
  step() {}
  beta(p: Params) { return rad2deg(Math.asin(Math.sin(deg2rad(p.alpha)) / p.n)); }
  readings(p: Params): Readings {
    const a = read(INSTRUMENTS.protractor, p.alpha), b = read(INSTRUMENTS.protractor, this.beta(p));
    return {
      values: { alpha: a, beta: b },
      errors: { alpha: instrumentError(INSTRUMENTS.protractor), beta: instrumentError(INSTRUMENTS.protractor) },
      ref: p.n,
      canRecord: a >= 10 && b > 0,
      hint: a < 10 ? 'Жарық көзін шайба шеңбері бойымен жылжытып, түсу бұрышын 10°-тан үлкен етіңіз' : 'Түсу және сыну бұрыштарын шкаладан оқып, жазыңыз. Бұрышты өзгертіп, қайталаңыз',
      display: [
        { label: 'Түсу бұрышы α', text: `${fmt(a, 0)}°`, instrument: 'Шайба шкаласы' },
        { label: 'Сыну бұрышы β', text: `${fmt(b, 0)}°`, instrument: 'Шайба шкаласы' },
      ],
    };
  }
}
