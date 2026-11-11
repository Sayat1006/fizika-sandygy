/**
 * Өлшеу құралдары мен қателіктерді талдау.
 *
 * Қабылданған ережелер (мектеп зертханалық практикасы):
 *  • Құралдың көрсетуі бөлік құнына дейін дөңгелектенеді.
 *  • Құралдық абсолют қателік — бөлік құнының жартысы.
 *  • Көбейтінді/бөлінді үшін салыстырмалы қателіктер қосылады.
 *  • Кездейсоқ қателік — орташа мәннен орташа абсолют ауытқу.
 *  • Толық қателік: Δ = √(Δ_кезд² + Δ_құр²).
 *  • Қателік 1 мәнді цифрға дейін (бірінші цифры 1 болса — 2 цифрға) дөңгелектенеді,
 *    нәтиже қателіктің соңғы разрядына дейін дөңгелектенеді.
 */
import { PhysicsError, divide, positive } from './core';

export interface Instrument {
  name: string;
  unit: string;
  /** бөлік құны (SI) */
  division: number;
  /** өлшеу шегі (SI) */
  max: number;
}

export const INSTRUMENTS = {
  dynamometer: { name: 'Динамометр', unit: 'Н', division: 0.1, max: 5 },
  ruler: { name: 'Сызғыш', unit: 'м', division: 0.001, max: 1 },
  stopwatch: { name: 'Секундомер', unit: 'с', division: 0.01, max: 600 },
  cylinder: { name: 'Өлшеуіш цилиндр', unit: 'м³', division: 5e-6, max: 500e-6 },
  protractor: { name: 'Транспортир', unit: '°', division: 1, max: 90 },
} satisfies Record<string, Instrument>;

/** Нақты мәнді құралдың бөлік құнына дейін дөңгелектеп «оқиды». */
export function read(instr: Instrument, trueValue: number): number {
  const q = Math.round(trueValue / instr.division) * instr.division;
  // қалқымалы нүкте қалдығын тазарту
  const digits = Math.max(0, Math.ceil(-Math.log10(instr.division)) + 2);
  return Number(q.toFixed(digits));
}

/** Құралдық абсолют қателік — бөлік құнының жартысы. */
export const instrumentError = (instr: Instrument) => instr.division / 2;

export const mean = (xs: number[]) => {
  if (xs.length === 0) throw new PhysicsError('Орташа мән үшін кемінде бір өлшеу қажет');
  return xs.reduce((a, b) => a + b, 0) / xs.length;
};

/** Кездейсоқ қателік: орташа абсолют ауытқу. */
export const meanAbsDeviation = (xs: number[]) => {
  const m = mean(xs);
  return mean(xs.map((x) => Math.abs(x - m)));
};

/** Көбейтінді/бөлінді түріндегі шаманың салыстырмалы қателігі: ε = Σ nᵢ·Δxᵢ/|xᵢ| */
export function relativeErrorOfProduct(terms: { value: number; abs: number; power?: number }[]): number {
  return terms.reduce((sum, t) => sum + Math.abs(t.power ?? 1) * divide(t.abs, Math.abs(t.value), 'өлшенген шама'), 0);
}

export const combineErrors = (random: number, instrumental: number) => Math.hypot(random, instrumental);

/** Теориялық (анықтамалық) мәннен пайыздық ауытқу. */
export const percentDeviation = (measured: number, reference: number) =>
  (Math.abs(measured - reference) / Math.abs(positive(Math.abs(reference), 'анықтамалық мән'))) * 100;

export interface Rounded {
  value: number;
  error: number;
  /** ондық таңбалар саны (теріс болса — ондықтар, жүздіктер …) */
  decimals: number;
  text: string;
}

/** Нәтижені қателікпен бірге дөңгелектеу ережесі. */
export function roundWithError(value: number, error: number): Rounded {
  if (!(error > 0) || !Number.isFinite(error)) {
    const text = formatSig(value, 3);
    return { value: Number(text.replace(',', '.')), error: 0, decimals: 3, text };
  }
  let exp = Math.floor(Math.log10(error));
  const lead = Math.floor(error / 10 ** exp + 1e-9);
  let sig = lead === 1 ? 2 : 1;
  let decimals = sig - 1 - exp;
  let e = roundTo(error, decimals);
  // дөңгелектеуден кейін разряд өзгеруі мүмкін (мыс. 0.96 → 1.0)
  const exp2 = Math.floor(Math.log10(e));
  if (exp2 !== exp) {
    exp = exp2;
    sig = 2;
    decimals = sig - 1 - exp;
    e = roundTo(error, decimals);
  }
  const v = roundTo(value, decimals);
  const d = Math.max(0, decimals);
  return { value: v, error: e, decimals, text: `${fmt(v, d)} ± ${fmt(e, d)}` };
}

export const roundTo = (x: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
};

/** Қазақша ондық үтірмен пішімдеу. */
export const fmt = (x: number, decimals: number) => x.toFixed(Math.max(0, decimals)).replace('.', ',').replace(/^-0(,0*)?$/, '0$1');

export function formatSig(x: number, sig = 3): string {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(x)));
  return fmt(x, Math.max(0, sig - 1 - exp));
}

// ───────────── Регрессия ─────────────
export interface Fit {
  slope: number;
  intercept: number;
  r2: number;
}

/** y = k·x (координата басы арқылы өтетін ең кіші квадраттар түзуі). */
export function fitThroughOrigin(xs: number[], ys: number[]): Fit {
  if (xs.length !== ys.length || xs.length < 1) throw new PhysicsError('Нүктелер саны жеткіліксіз');
  const sxx = xs.reduce((s, x) => s + x * x, 0);
  const sxy = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const slope = divide(sxy, sxx, 'Σx²');
  return { slope, intercept: 0, r2: r2(xs, ys, slope, 0) };
}

/** y = k·x + b (ең кіші квадраттар әдісі). */
export function fitLinear(xs: number[], ys: number[]): Fit {
  if (xs.length !== ys.length || xs.length < 2) throw new PhysicsError('Түзу жүргізу үшін кемінде екі нүкте қажет');
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  const slope = divide(sxy, sxx, 'x шашырауы');
  const intercept = my - slope * mx;
  return { slope, intercept, r2: r2(xs, ys, slope, intercept) };
}

function r2(xs: number[], ys: number[], k: number, b: number): number {
  const my = mean(ys);
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < xs.length; i++) {
    ssRes += (ys[i] - (k * xs[i] + b)) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  return ssTot < 1e-300 ? 1 : 1 - ssRes / ssTot;
}
