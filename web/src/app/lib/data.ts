import { createClient, type Session } from '@supabase/supabase-js';
import { CONFIG } from './config';

export const sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

/* ───────── дерекқор жолдары ───────── */
export interface Profile {
  id: string; full_name: string; phone: string; school: string; email?: string;
  is_admin?: boolean; classes_set?: boolean; variants?: string[] | null; tg_chat_id?: number | null; created_at?: string;
}
export interface Sub { user_id?: string; grade: number; paid_until: string; trial: boolean }
export interface PayRequest { id: string; user_id: string; grades: number[]; plan: 'month' | 'year'; amount: number; status: 'pending' | 'approved' | 'rejected'; created_at: string; decided_at?: string | null }
export interface DownloadRow { user_id?: string; variant: string | null; grade: number; n: number; kind: Kind; created_at?: string }
export type Kind = 'kmzh' | 'pres' | 'ws';
export const KIND_LABEL: Record<Kind, string> = { kmzh: 'ҚМЖ', pres: 'Слайд', ws: 'Парақ' };

export interface Lesson { grade: number; n: number; disp: string; topic: string; bolim: string; date: string; kmzh: boolean; pres: boolean; ws: boolean; v: string }

let lessonsP: Promise<Lesson[]> | null = null;
/** ҚТЖ: барлық нұсқаның сабақтары (бір рет жүктеледі) */
export function loadLessons() {
  if (!lessonsP) lessonsP = fetch('/lessons.json').then((r) => r.json()).then((a: Lesson[]) => a.map((l) => ({ ...l, topic: l.topic.replace(/[.\s]+$/, '') }))).catch(() => { lessonsP = null; return []; });
  return lessonsP;
}

/* ───────── формат ───────── */
export const money = (n: number) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₸';
export const dmy = (s: string) => s.slice(0, 10).split('-').reverse().join('.');
export const dm = (s: string) => s.slice(0, 10).split('-').reverse().slice(0, 2).join('.');
/** Құрылғының жергілікті уақыты бойынша: 05–11 таң, 11–18 күн, 18–23 кеш, 23–05 түн */
export function dayPart(h = new Date().getHours()) { return h < 5 ? 'түн' : h < 11 ? 'таң' : h < 18 ? 'күн' : h < 23 ? 'кеш' : 'түн'; }
export function firstName(full = '') { const p = full.split(' ').filter(Boolean); return p[1] || p[0] || ''; }

export function authError(e: { message?: string } | null) {
  const m = (e && e.message) || '';
  if (/Invalid login/i.test(m)) return 'Логин немесе құпиясөз қате.';
  if (/not confirmed/i.test(m)) return 'Email расталмаған. Поштаңыздағы хатты ашып, сілтемені басыңыз.';
  if (/already registered/i.test(m)) return 'Бұл email тіркелген. «Кіру» бөлімін қолданыңыз.';
  if (/rate limit/i.test(m)) return 'Тым көп әрекет. Бірнеше минуттан соң қайталаңыз.';
  return 'Қате: ' + m;
}

/* ───────── материалдар API (api/download.js) ───────── */
async function token() { const { data } = await sb.auth.getSession(); return data.session?.access_token || ''; }
function url(v: string, n: number, kind: string, view = false) { return `/api/download?v=${encodeURIComponent(v)}&n=${n}&kind=${kind}${view ? '&view=1' : ''}`; }

export interface ViewPages { total: number; locked: boolean; w: number; h: number; pages: string[] }
/** Беттердің суреттері (жазылымсыз — алғашқы беттері ғана) */
export async function viewPages(v: string, n: number, kind: Kind): Promise<ViewPages> {
  const r = await fetch(url(v, n, kind, true), { headers: { Authorization: 'Bearer ' + (await token()) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Қарау мүмкін болмады.');
  return j;
}
export interface Stage { stage: string; min: number; sub: string; teacher: string[]; student: string[] }
/** Тақтаға арналған сабақ сценарийі (тек жазылыммен) */
export async function lessonPlan(v: string, n: number): Promise<{ status: number; stages: Stage[] }> {
  const r = await fetch(url(v, n, 'plan'), { headers: { Authorization: 'Bearer ' + (await token()) } });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, stages: r.ok ? j.stages : [] };
}
/** Файлды жүктеп, браузерде сақтау */
export async function downloadFile(v: string, n: number, kind: Kind) {
  const r = await fetch(url(v, n, kind), { headers: { Authorization: 'Bearer ' + (await token()) } });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Жүктеу мүмкін болмады.'); }
  const m = (r.headers.get('Content-Disposition') || '').match(/filename\*=UTF-8''([^;]+)/);
  const name = m ? decodeURIComponent(m[1]) : `${kind}_${v}_${n}`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(await r.blob()); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ───────── Edge Function: account (тіркелу, құпиясөзді жаңарту) ───────── */
export async function accountFn(body: Record<string, unknown>, session?: Session | null) {
  const r = await fetch(CONFIG.supabaseUrl + '/functions/v1/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: 'Bearer ' + session.access_token } : {}) },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Сұраныс орындалмады.');
  return j;
}

export const tgPayLink = (id: string) => `https://t.me/${CONFIG.telegramBot}?start=p${String(id).replace(/-/g, '')}`;

/** Анимациялы презентация (бар болса). Жоқ болса — null, тақта слайд суреттерін көрсетеді. */
export async function lessonDeck(v: string, n: number): Promise<import('../deck/types').DeckData | null> {
  try {
    const r = await fetch(url(v, n, 'deck'), { headers: { Authorization: 'Bearer ' + (await token()) } });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
