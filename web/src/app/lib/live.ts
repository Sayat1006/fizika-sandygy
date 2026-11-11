import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Slide } from '../deck/types';
import { sb } from './data';

/* Сабақ кезінде оқушылардың телефоннан қосылуы (Supabase: live_sessions / live_participants / live_answers).
   Мұғалім тақтадан сұрақ жібереді → оқушылар /s бетінде жауап береді → тақтада нәтиже бірден көрінеді. */

export type QKind = 'choice' | 'text' | 'number';
export interface LiveQuestion {
  id: string; kind: QKind; text: string; options?: string[];
  correct?: string;      // дұрыс жауап (оқушыға тек reveal кезінде көрінеді)
  open: boolean;         // жауап қабылданады ма
  reveal: boolean;       // дұрыс жауап көрсетілді ме
}
export interface LiveSession { id: string; code: string; title: string; question: LiveQuestion | null; created_at: string; ended_at: string | null }
export interface Participant { id: string; name: string; joined_at: string }
export interface Answer { participant_id: string; qid: string; answer: string }

export const joinUrl = (code: string) => `${location.origin}/s?c=${code}`;
const rid = () => Math.random().toString(36).slice(2, 10);

/** Жауапты салыстыру үшін қалыпқа келтіру: кіші әріп, бос орын, үтір/нүкте, бірлік алдындағы бос орын */
export const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/,/g, '.').replace(/[«»"'()]/g, '').replace(/\s+/g, ' ').trim().replace(/\.$/, '');
/** Мәтіндік жауап дұрыс па: толық сәйкестік немесе дұрыс жауаптың негізгі бөлігі (сан/сөз) бар */
export function isCorrect(q: LiveQuestion, a: string) {
  if (!q.correct) return null;
  const x = norm(a), c = norm(q.correct);
  if (q.kind === 'choice') return x === c;
  if (x === c) return true;
  const num = (s: string) => (s.match(/-?\d+(\.\d+)?/) || [null])[0];
  if (q.kind === 'number' || (num(c) && c.replace(/[^a-zа-яәғқңөұүһі]/g, '').length < 6)) return num(x) !== null && num(x) === num(c);
  return c.length >= 3 && (x.includes(c) || (x.length >= 3 && c.includes(x)));
}

/* ───────── жылдам сұрақтар және слайдтан сұрақ ───────── */
export const QUICK: { label: string; make: () => Omit<LiveQuestion, 'open' | 'reveal'> }[] = [
  { label: 'A / B / C / D', make: () => ({ id: rid(), kind: 'choice', text: 'Дұрыс жауапты таңда', options: ['A', 'B', 'C', 'D'] }) },
  { label: 'Иә / Жоқ', make: () => ({ id: rid(), kind: 'choice', text: 'Тұжырым дұрыс па?', options: ['Иә', 'Жоқ'] }) },
  { label: 'Түсіндің бе?', make: () => ({ id: rid(), kind: 'choice', text: 'Тақырып саған түсінікті ме?', options: ['Түсіндім', 'Жартылай', 'Түсінбедім'] }) },
  { label: 'Сан', make: () => ({ id: rid(), kind: 'number', text: 'Жауабыңды сан түрінде жаз' }) },
  { label: 'Мәтін', make: () => ({ id: rid(), kind: 'text', text: 'Жауабыңды жаз' }) },
];

/** Ағымдағы слайдтан жіберуге болатын сұрақтар (викторина, иә–жоқ, сұрыптау, деңгейлік тапсырма) */
export function fromSlide(s: Slide | null): Omit<LiveQuestion, 'open' | 'reveal'>[] {
  if (!s) return [];
  const strip = (t: string) => t.replace(/\*\*/g, '');
  switch (s.t) {
    case 'qa': return s.items.map(([q, a]) => ({ id: rid(), kind: 'text' as const, text: strip(q), correct: a }));
    case 'yesno': return s.items.map(([q, ok]) => ({ id: rid(), kind: 'choice' as const, text: strip(q), options: ['Иә', 'Жоқ'], correct: ok ? 'Иә' : 'Жоқ' }));
    case 'sort': return s.items.map(([w, k]) => ({ id: rid(), kind: 'choice' as const, text: `«${w}» — қандай шама?`, options: ['Скаляр', 'Векторлық'], correct: k === 's' ? 'Скаляр' : 'Векторлық' }));
    case 'task': return [{ id: rid(), kind: /\d/.test(s.answer) && s.answer.length < 60 ? 'number' as const : 'text' as const, text: strip(s.q), correct: s.answer }];
    case 'compare': case 'goals': case 'theory': return [];
    default: return [];
  }
}

/* ───────── мұғалім ───────── */
export async function myOpenSession(): Promise<LiveSession | null> {
  const { data } = await sb.from('live_sessions').select('*').is('ended_at', null).gt('created_at', new Date(Date.now() - 4 * 3600e3).toISOString()).order('created_at', { ascending: false }).limit(1);
  return (data?.[0] as LiveSession) || null;
}
export async function startSession(title: string): Promise<LiveSession> {
  const { data, error } = await sb.rpc('live_start', { p_title: title });
  if (error) throw error;
  return data as LiveSession;
}
export async function endSession(id: string) { await sb.from('live_sessions').update({ ended_at: new Date().toISOString() }).eq('id', id); }
export async function setQuestion(s: LiveSession, q: LiveQuestion | null, ch?: RealtimeChannel | null) {
  const { error } = await sb.from('live_sessions').update({ question: q }).eq('id', s.id);
  if (error) throw error;
  ch?.send({ type: 'broadcast', event: 'q', payload: { t: Date.now() } });
}
export async function loadRoom(id: string) {
  const [p, a] = await Promise.all([
    sb.from('live_participants').select('id,name,joined_at').eq('session_id', id).order('joined_at'),
    sb.from('live_answers').select('participant_id,qid,answer').eq('session_id', id),
  ]);
  return { people: (p.data as Participant[]) || [], answers: (a.data as Answer[]) || [] };
}
/** Мұғалімнің арнасы: оқушыларға «сұрақ өзгерді» хабары + қатысушылар мен жауаптардың өзгерісі */
export function teacherChannel(s: LiveSession, onChange: () => void) {
  const ch = sb.channel(`live:${s.code}`, { config: { broadcast: { self: false } } })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_answers', filter: `session_id=eq.${s.id}` }, onChange)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_participants', filter: `session_id=eq.${s.id}` }, onChange)
    .on('broadcast', { event: 'a' }, onChange)
    .subscribe();
  return ch;
}

/* ───────── оқушы ───────── */
export interface Me { pid: string; secret: string; name: string }
const meKey = (code: string) => `fs-live-${code}`;
export const loadMe = (code: string): Me | null => { try { return JSON.parse(localStorage.getItem(meKey(code)) || 'null'); } catch { return null; } };
export const forgetMe = (code: string) => { try { localStorage.removeItem(meKey(code)); } catch { /* */ } };
export const saveMe = (code: string, me: Me) => { try { localStorage.setItem(meKey(code), JSON.stringify(me)); } catch { /* жеке режим */ } };

export async function join(code: string, name: string): Promise<Me & { title: string }> {
  const { data, error } = await sb.rpc('live_join', { p_code: code, p_name: name });
  if (error) throw new Error(/not found/.test(error.message) ? 'Мұндай код жоқ немесе сабақ аяқталған.' : /full/.test(error.message) ? 'Сабаққа қосылғандар саны шегіне жетті.' : /bad name/.test(error.message) ? 'Атыңды жаз (40 таңбаға дейін).' : 'Қосылу мүмкін болмады. Қайталап көр.');
  return { pid: data.pid, secret: data.secret, name, title: data.title };
}
export interface StudentState { ended: boolean; title?: string; question: LiveQuestion | null; mine: string | null; joined: boolean }
export async function state(code: string, me: Me | null): Promise<StudentState> {
  const { data, error } = await sb.rpc('live_state', { p_code: code, p_pid: me?.pid ?? null, p_secret: me?.secret ?? null });
  if (error) throw error;
  return data as StudentState;
}
export async function answer(code: string, me: Me, qid: string, a: string, ch?: RealtimeChannel | null) {
  const { data, error } = await sb.rpc('live_answer', { p_code: code, p_pid: me.pid, p_secret: me.secret, p_qid: qid, p_answer: a });
  if (error) throw error;
  if (data) ch?.send({ type: 'broadcast', event: 'a', payload: { t: Date.now() } });
  return !!data;
}
export function studentChannel(code: string, onQuestion: () => void) {
  return sb.channel(`live:${code}`, { config: { broadcast: { self: false } } }).on('broadcast', { event: 'q' }, onQuestion).subscribe();
}
