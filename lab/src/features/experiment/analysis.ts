import type { ExperimentDef } from '../../data/types';
import {
  combineErrors,
  fitLinear,
  fitThroughOrigin,
  mean,
  meanAbsDeviation,
  percentDeviation,
  roundWithError,
  type Fit,
  type Rounded,
} from '../../engines/physics/uncertainty';

export interface Row {
  id: string;
  values: Record<string, number>;
  errors: Record<string, number>;
  ref: number;
}

export interface RowCalc {
  row: Row;
  /** өлшенген + есептелген шамалар */
  all: Record<string, number>;
  value: number;
  relErr: number;
  deviation: number;
  valid: boolean;
}

export interface Analysis {
  rows: RowCalc[];
  valid: RowCalc[];
  /** Барлық жолдың анықтамалық мәні бірдей ме (орташа мән мағыналы ма) */
  refConstant: boolean;
  ref: number | null;
  mean: number | null;
  random: number;
  instrumental: number;
  abs: number;
  rel: number;
  rounded: Rounded | null;
  /** Анықтамалық мәннен орташа пайыздық ауытқу */
  deviation: number | null;
  points: { x: number; y: number }[];
  fit: Fit | null;
}

export function analyze(def: ExperimentDef, rows: Row[]): Analysis {
  const calcs: RowCalc[] = rows.map((row) => {
    const d = def.derive(row.values);
    const all = { ...row.values, ...d };
    const value = d.value;
    const relErr = def.relError(row.values, row.errors);
    const valid = Number.isFinite(value) && value > 0;
    return {
      row,
      all,
      value,
      relErr: Number.isFinite(relErr) && relErr >= 0 ? relErr : NaN,
      deviation: valid && row.ref > 0 ? percentDeviation(value, row.ref) : NaN,
      valid,
    };
  });
  const valid = calcs.filter((c) => c.valid);
  const refs = valid.map((c) => c.row.ref);
  const refConstant = refs.length > 0 && refs.every((r) => Math.abs(r - refs[0]) <= 1e-9 * Math.max(1, Math.abs(refs[0])));

  let m: number | null = null;
  let random = 0;
  let instrumental = 0;
  let rounded: Rounded | null = null;
  if (valid.length > 0 && refConstant) {
    const vals = valid.map((c) => c.value);
    m = mean(vals);
    random = meanAbsDeviation(vals);
    const rels = valid.map((c) => c.relErr).filter((r) => Number.isFinite(r));
    instrumental = rels.length ? m * mean(rels) : 0;
    rounded = roundWithError(m, combineErrors(random, instrumental));
  }
  const abs = combineErrors(random, instrumental);
  const devs = valid.map((c) => c.deviation).filter((d) => Number.isFinite(d));

  const g = def.graph;
  const points = valid
    .map((c) => ({ x: c.all[g.x] * (g.xScale ?? 1), y: c.all[g.y] * (g.yScale ?? 1) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  let fit: Fit | null = null;
  try {
    if (g.fit === 'origin' && points.length >= 1) fit = fitThroughOrigin(points.map((p) => p.x), points.map((p) => p.y));
    if (g.fit === 'linear' && points.length >= 2) fit = fitLinear(points.map((p) => p.x), points.map((p) => p.y));
  } catch {
    fit = null; // нүктелер түзу жүргізуге жеткіліксіз
  }

  return {
    rows: calcs,
    valid,
    refConstant,
    ref: refConstant ? refs[0] : null,
    mean: m,
    random,
    instrumental,
    abs,
    rel: m ? abs / m : 0,
    rounded,
    deviation: devs.length ? mean(devs) : null,
    points,
    fit,
  };
}

export interface Score {
  total: number;
  max: number;
  items: { label: string; got: number; max: number; note: string }[];
}

/** Ашық бағалау рубрикасы (10 балл). */
export function score(def: ExperimentDef, a: Analysis, hypothesis: number | null, conclusion: string[]): Score {
  const n = a.valid.length;
  const meas = Math.min(3, Math.round((3 * Math.min(n, def.minRows)) / def.minRows));
  const dev = a.deviation;
  const acc = dev === null || n < 2 ? 0 : dev <= 5 ? 3 : dev <= 10 ? 2 : dev <= 20 ? 1 : 0;
  const answered = conclusion.filter((c) => c.trim().length >= 15).length;
  const concl = Math.round((3 * answered) / 5);
  const items = [
    { label: 'Болжам', got: hypothesis !== null ? 1 : 0, max: 1, note: 'Тәжірибе алдында болжам жасалды' },
    { label: 'Өлшеулер', got: meas, max: 3, note: `${n} / ${def.minRows} өлшеу` },
    { label: 'Дәлдік', got: acc, max: 3, note: dev === null ? 'Дерек жоқ' : `Теориядан ауытқу ${dev.toFixed(1).replace('.', ',')} %` },
    { label: 'Қорытынды', got: concl, max: 3, note: `${answered} / 5 сұраққа жауап берілді` },
  ];
  return { total: items.reduce((s, i) => s + i.got, 0), max: 10, items };
}

export const STEPS = ['Кіріспе', 'Теория', 'Болжам', 'Тәжірибе', 'Өлшеулер', 'Есептеулер', 'График', 'Қателік', 'Қорытынды', 'Есеп'];

export const CONCLUSION_PROMPTS = [
  'Не зерттелді?',
  'Қандай шамалар өлшенді?',
  'Қандай нәтиже алынды?',
  'Болжам расталды ма? Неліктен?',
  'Нәтижеге қандай қателік көздері әсер етті?',
];

