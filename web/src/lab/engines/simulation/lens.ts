import { fmt, instrumentError, read, INSTRUMENTS } from '../physics/uncertainty';
import type { Params, Readings, Simulation } from './types';

/** Оптикалық орындық: шам (нәрсе) — линза — экран. Линзаның орны x = 0. */
export const BENCH = { dMin: 0.05, dMax: 0.42, fMin: 0.05, fMax: 0.62, sharp: 0.004, objH: 0.03 };

/** Жұқа линза: 1/d + 1/f = 1/F. Экрандағы кескіннің анықтығы экранның f_кескін нүктесінен ауытқуымен анықталады. */
export class LensSim implements Simulation {
  reset() {}
  step() {}

  image(p: Params) {
    const F = p.F, d = p.d;
    if (d <= F + 1e-4) return { real: false, fi: Infinity, k: Infinity, blur: 1 };
    const fi = (d * F) / (d - F); // кескінге дейінгі қашықтық
    const k = fi / d; // үлкейту
    const blur = Math.abs(p.f - fi) * (0.03 / fi); // шашырау дағының радиусы (линза апертурасы 3 см)
    return { real: true, fi, k, blur };
  }

  readings(p: Params): Readings {
    const im = this.image(p);
    const dr = read(INSTRUMENTS.ruler, p.d), fr = read(INSTRUMENTS.ruler, p.f);
    const sharp = im.real && Math.abs(p.f - im.fi) < BENCH.sharp;
    return {
      values: { d: dr, f: fr },
      errors: { d: instrumentError(INSTRUMENTS.ruler) + 0.001, f: instrumentError(INSTRUMENTS.ruler) + 0.002 },
      ref: p.F,
      canRecord: sharp,
      hint: !im.real ? 'Шам фокус аралығының ішінде — экранда кескін шықпайды. Шамды линзадан алыстатыңыз'
        : im.fi > BENCH.fMax ? 'Кескін орындықтан тыс — шамды линзадан сәл алыстатыңыз'
        : sharp ? 'Кескін анық — кестеге жазыңыз. Шамның орнын өзгертіп, қайталаңыз'
        : 'Экранды жылжытып, жалынның анық кескінін алыңыз',
      display: [
        { label: 'Нәрсеге дейін d', text: `${fmt(dr * 100, 1)} см`, instrument: 'Орындық шкаласы' },
        { label: 'Экранға дейін f', text: `${fmt(fr * 100, 1)} см`, instrument: 'Орындық шкаласы' },
        { label: 'Кескін', text: !im.real ? 'жоқ' : sharp ? `анық, ${fmt(im.k, 1)}× ${im.k > 1 ? 'үлкейген' : 'кішірейген'}` : 'бұлыңғыр', instrument: 'Экран' },
      ],
    };
  }
}
