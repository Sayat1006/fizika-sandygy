/* ===== Сайттың баптаулары: байланыс деректері мен бағаларды осы жерде өзгертіңіз ===== */
export const CONFIG = {
  supabaseUrl: 'https://rumnyvcgpswdxjheaeif.supabase.co',
  supabaseKey: 'sb_publishable_l7Xeu0foTUzNVh_-w258nw_42HAgAaw',
  kaspi: '+7 776 870 75 00', // Kaspi Gold номері
  whatsapp: '77768707500', // WhatsApp: тек цифрлар
  whatsappShow: '+7 776 870 75 00',
  telegram: 'ca9m_cc', // Telegram логині, @ белгісіз
  telegramBot: 'impulse_edu_bot', // хабарлама боты (@ белгісіз)
  /** бір сынып үшін, ₸ — дерекқордағы plan_price функциясымен бірдей болуы керек */
  prices: { month: 1490, year: 9990 } as Record<'month' | 'year', number>,
  googleLogin: false, // Supabase-те Google провайдері қосылған соң true етіңіз
  siteUrl: 'https://sabaqtas-kz.vercel.app',
  /** «admin» логині admin@fizika-sandygy.kz аккаунтына сәйкес келеді */
  loginDomain: '@fizika-sandygy.kz',
};

export const GRADES = [7, 8, 9, 10, 11] as const;

/* Сабақтың ашылу ережесі: ҚТЖ бойынша осы аптаның сабақтары (дүйсенбі–жексенбі).
   Сенбі мен жексенбіде келесі аптаның сабақтары да ашылады (алдын ала дайындалу үшін).
   api/download.js ішіндегі ережемен бірдей. */
export function week(now = Date.now()) {
  const t = new Date(now + 5 * 3600 * 1000); // Қазақстан уақыты, UTC+5
  const today = t.toISOString().slice(0, 10);
  const dow = (t.getUTCDay() + 6) % 7; // 0 = дүйсенбі
  const mon = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - dow));
  const end = new Date(mon.getTime() + (dow >= 5 ? 13 : 6) * 86400000);
  return { today, from: mon.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

/* Курс нұсқалары. 7–9: бір нұсқа (аптасына 2 сағат). 10–11: бағыт (ЖМБ/ҚГБ) × аптасына 1/2/3 сағат. */
export interface Variant { id: string; grade: number; dir: '' | 'zhmb' | 'kgb'; hours: number; dirName: string; short: string; label: string }
const DIR = { zhmb: 'ЖМБ', kgb: 'ҚГБ' } as const;
export const VARIANTS: Variant[] = (() => {
  const list: Variant[] = [];
  for (const g of [7, 8, 9]) list.push({ id: String(g), grade: g, dir: '', hours: 2, dirName: '', short: '', label: `${g}-сынып` });
  for (const g of [10, 11]) for (const d of ['zhmb', 'kgb'] as const) for (const h of [1, 2, 3]) {
    const short = `${DIR[d]} · ${h} сағ.`;
    list.push({ id: `${g}-${d}-${h}`, grade: g, dir: d, hours: h, dirName: DIR[d], short, label: `${g}-сынып · ${short}` });
  }
  return list;
})();
export const VARIANT = Object.fromEntries(VARIANTS.map((v) => [v.id, v])) as Record<string, Variant>;

/* 3D зертханада (/lab) дайын тұрған тәжірибелер: сынып → ҚТЖ-дағы зертханалық жұмыс нөмірі → тәжірибе id. */
export const LAB3D: Record<number, Record<number, string>> = { 7: { 4: 'g7-4', 5: 'g7-5', 6: 'g7-6', 10: 'g7-10' }, 9: { 1: 'g9-1' } };
/** Зертханалық жұмыс ҚТЖ тақырыбындағы «№ N зертханалық жұмыс» жазуынан анықталады. */
export function labOf(l: { topic: string; v: string }) {
  const m = /№\s*(\d+)[\s.\-–]*зертханалық\s+жұмыс/i.exec(l.topic || '');
  if (!m) return null;
  const no = +m[1];
  return { no, exp: (LAB3D[parseInt(l.v, 10)] || {})[no] || null };
}
