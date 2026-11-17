/* Бағалар: дерекқордағы prices кестесінен (әкімші панельден өзгертіледі). Есептеу ережесі дерекқордағы
   plan_price() функциясымен бірдей — бірақ төленетін соманы әрдайым дерекқор есептейді (request_subscription),
   мұнда тек көрсету үшін. Кесте жүктелмесе — CONFIG.prices бастапқы мәндері. */
import { useEffect, useState } from 'react';
import { CONFIG, GRADES, week } from './config';
import { sb } from './data';

export type Plan = 'month' | 'year';
export interface PriceRow { plan: Plan; grade: number; price: number | null; sale_price: number | null; sale_until: string | null }

const DEFAULT: PriceRow[] = [
  ...GRADES.map((g) => ({ plan: 'month' as Plan, grade: g, price: CONFIG.prices.month, sale_price: null, sale_until: null })),
  { plan: 'month', grade: 0, price: null, sale_price: null, sale_until: null },
  ...GRADES.map((g) => ({ plan: 'year' as Plan, grade: g, price: CONFIG.prices.year[g], sale_price: null, sale_until: null })),
  { plan: 'year', grade: 0, price: CONFIG.prices.all, sale_price: null, sale_until: null },
];

let cache: Promise<PriceRow[]> | null = null;
export function loadPrices(force = false) {
  if (!cache || force) {
    cache = Promise.resolve(sb.from('prices').select('plan,grade,price,sale_price,sale_until')).then(({ data, error }) => {
      if (error || !data?.length) return DEFAULT;
      return data as PriceRow[];
    }).catch(() => DEFAULT);
  }
  return cache;
}

/** бағалар (жүктелгенше — бастапқы мәндер) */
export function usePrices() {
  const [rows, setRows] = useState<PriceRow[]>(DEFAULT);
  useEffect(() => { let on = true; void loadPrices().then((r) => on && setRows(r)); return () => { on = false; }; }, []);
  return rows;
}

/** бағаның нақты мәні: жеңілдік әрекет етсе — жеңілдік бағасы */
export function rowNow(r?: PriceRow): { now: number | null; old: number | null; until: string | null } {
  if (!r) return { now: null, old: null, until: null };
  const sale = r.sale_price != null && (!r.sale_until || r.sale_until >= week().today);
  return sale ? { now: r.sale_price, old: r.price, until: r.sale_until } : { now: r.price, old: null, until: null };
}
export const findRow = (rows: PriceRow[], plan: Plan, grade: number) => rows.find((r) => r.plan === plan && r.grade === grade);

/** таңдалған сыныптардың бағасы (бесеуі бірге болса — жиынтық баға, бар болса) */
export function priceOf(rows: PriceRow[], plan: Plan, grades: number[]) {
  const gs = [...new Set(grades)];
  if (GRADES.every((g) => gs.includes(g))) {
    const b = rowNow(findRow(rows, plan, 0)).now;
    if (b != null) return b;
  }
  return gs.reduce((s, g) => s + (rowNow(findRow(rows, plan, g)).now || 0), 0);
}
/** бес сыныпты жеке алғандағы баға (жиынтық бағаның үнемін көрсету үшін) */
export const separateSum = (rows: PriceRow[], plan: Plan) => GRADES.reduce((s, g) => s + (rowNow(findRow(rows, plan, g)).now || 0), 0);
/** «5 000 ₸» немесе «4 000–5 000 ₸» — сыныптар бойынша ең кіші және ең үлкен баға */
export function range(rows: PriceRow[], plan: Plan, grades: readonly number[]) {
  const v = grades.map((g) => rowNow(findRow(rows, plan, g)).now || 0);
  return { min: Math.min(...v), max: Math.max(...v) };
}
