import { useEffect, useState } from 'react';
import { downloadLab, fetchManifest, offlineSupported, persist, putAll, savedVersion } from '../../shared/labOffline';
import { labOf } from './config';
import { lessonDeck, lessonPlan, viewPages, type Lesson } from './data';
import { videosOf } from './videos';

/* Сыныпта интернет үзілсе де тақта ашылуы үшін: сервис-воркер (public/sw.js) жауаптарды сақтайды,
   ал бұл жерде бүгінгі сабақтардың материалдарын алдын ала жүктеп қоямыз. */
export function registerSW() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
export const swReady = () => 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;

const done = new Set<string>();
/** Сабақтың тақтаға керек бәрін (презентация, сценарий, слайд пен парақ суреттері) кэшке жүктеу */
export async function prepareLesson(l: Lesson): Promise<boolean> {
  const k = `${l.v}|${l.n}`;
  if (done.has(k)) return true;
  try {
    const [, , pres, ws] = await Promise.all([
      lessonDeck(l.v, l.n), lessonPlan(l.v, l.n),
      l.pres ? viewPages(l.v, l.n, 'pres').catch(() => null) : null,
      l.ws ? viewPages(l.v, l.n, 'ws').catch(() => null) : null,
    ]);
    const imgs = [...(pres?.pages || []), ...(ws?.pages || [])];
    for (let i = 0; i < imgs.length; i += 4) await Promise.all(imgs.slice(i, i + 4).map((u) => fetch(u).catch(() => null)));
    done.add(k);
    return true;
  } catch { return false; }
}

/** Желі бар ма */
export function useOnline() {
  const [on, setOn] = useState(() => navigator.onLine);
  useEffect(() => { const a = () => setOn(true), b = () => setOn(false); addEventListener('online', a); addEventListener('offline', b); return () => { removeEventListener('online', a); removeEventListener('offline', b); }; }, []);
  return on;
}

/* ───────── Сабақты интернетсіз ашу үшін жеке-жеке сақтау ─────────
   Бір сабаққа керектің бәрі: анимациялы презентация, сценарий, слайд пен парақ суреттері, сабақтың видеолары,
   3D тәжірибе (зертхана) және сайттың өзі (кабинет пен тақта). Тізім localStorage-та: 'sbq-off-lessons'. */

const LKEY = 'sbq-off-lessons';
export interface SavedLesson { at: string; bytes: number; topic: string }
export const lessonKey = (l: Pick<Lesson, 'v' | 'n'>) => `${l.v}|${l.n}`;
export function savedLessons(): Record<string, SavedLesson> { try { return JSON.parse(localStorage.getItem(LKEY) || '{}') || {}; } catch { return {}; } }
export const isLessonSaved = (l: Pick<Lesson, 'v' | 'n'>) => lessonKey(l) in savedLessons();
const writeSaved = (m: Record<string, SavedLesson>) => { try { localStorage.setItem(LKEY, JSON.stringify(m)); } catch { /* */ } window.dispatchEvent(new Event('sbq-off')); };
export const lessonOfflineSupported = () => offlineSupported() && import.meta.env.PROD;

/** Сабақты сақтау. onProgress(0..1). Сәтті болса — сақталған көлемі (байт), әйтпесе қате мәтіні */
export async function saveLessonOffline(l: Lesson, onProgress?: (k: number) => void): Promise<{ ok: true; bytes: number } | { ok: false; error: string }> {
  if (!navigator.onLine) return { ok: false, error: 'Интернет жоқ. Сабақты интернет бар кезде сақтаңыз.' };
  void persist();
  const grade = l.grade, parts: { w: number; run: (p: (k: number) => void) => Promise<boolean> }[] = [];
  let bytes = 0;
  // 1) материалдар: сервис-воркер API жауаптарын өзі сақтайды (public/sw.js → netFirst)
  const [plan, deck, pres, ws, vids, app, lab] = await Promise.all([
    lessonPlan(l.v, l.n), lessonDeck(l.v, l.n),
    l.pres ? viewPages(l.v, l.n, 'pres').catch(() => null) : null,
    l.ws ? viewPages(l.v, l.n, 'ws').catch(() => null) : null,
    videosOf(l.v, l.n, grade).catch(() => []),
    fetchManifest('app'), labOf(l)?.exp ? fetchManifest('lab') : null,
  ]);
  if (plan.status === 402) return { ok: false, error: 'Бұл сабақ жазылыммен ашылады.' };
  if (plan.status === 401) return { ok: false, error: 'Сессия аяқталды. Кабинетке қайта кіріңіз.' };
  if (plan.status >= 400 || !deck && !pres && !ws) return { ok: false, error: 'Материалдарды алу мүмкін болмады. Қайталап көріңіз.' };
  const imgs = [...(pres?.pages || []), ...(ws?.pages || [])];
  // 2) сайттың қабығы мен тақтаның коды, сабақтар тізімі
  if (app) { bytes += savedVersion('app') === app.version ? 0 : app.bytes || 0; parts.push({ w: 3, run: (p) => downloadLab(app, p, 'app') }); }
  parts.push({ w: 0.2, run: (p) => putAll(['/lessons.json', '/videos.json'], p) });
  // 3) слайд пен парақ суреттері (/pv/* — кэш бірінші)
  if (imgs.length) parts.push({ w: imgs.length * 0.3, run: (p) => putAll(imgs, p, { skip: true }) });
  // 4) видеолар (толық файл 'sbq-vid-v1' кэшіне, сервис-воркер Range сұранысына одан береді)
  const vfiles = vids.map((v) => v.src), posters = vids.map((v) => v.poster).filter(Boolean) as string[];
  if (vfiles.length) parts.push({ w: vfiles.length * 2, run: (p) => putAll(vfiles, p, { cache: 'sbq-vid-v1', skip: true }) });
  if (posters.length) parts.push({ w: 0.2, run: (p) => putAll(posters, p, { skip: true }) });
  // 5) 3D тәжірибе: зертхананың барлық файлы (бір рет, барлық сабаққа ортақ)
  if (lab) { bytes += savedVersion('lab') === lab.version ? 0 : lab.bytes || 0; parts.push({ w: 3, run: (p) => downloadLab(lab, p, 'lab') }); }
  const total = parts.reduce((s, x) => s + x.w, 0) + 1;
  let base = 1; onProgress?.(base / total);
  let ok = true;
  for (const x of parts) { const b0 = base; ok = (await x.run((k) => onProgress?.((b0 + k * x.w) / total))) && ok; base += x.w; onProgress?.(base / total); }
  if (!ok) return { ok: false, error: 'Кейбір файлдар жүктелмеді. Интернетті тексеріп, қайталаңыз.' };
  // нақты көлем (видео мен суреттер)
  try {
    const sum = async (cache: string, list: string[]) => { const c = await caches.open(cache); let s = 0; for (const f of list) { const r = await c.match(f); if (r) s += +(r.headers.get('Content-Length') || 0) || (await r.clone().blob()).size; } return s; };
    bytes += await sum('sbq-vid-v1', vfiles) + await sum('sbq-v1', [...imgs, ...posters]);
  } catch { /* */ }
  const m = savedLessons(); m[lessonKey(l)] = { at: new Date().toISOString(), bytes, topic: l.topic }; writeSaved(m);
  return { ok: true, bytes };
}

/** Сабақты тізімнен алып тастау (ортақ файлдар — сайт пен зертхана — қалады) */
export async function removeLessonOffline(l: Lesson) {
  const m = savedLessons(); delete m[lessonKey(l)]; writeSaved(m);
  try {
    const vids = await videosOf(l.v, l.n, l.grade);
    const vc = await caches.open('sbq-vid-v1'); await Promise.all(vids.map((v) => vc.delete(v.src)));
  } catch { /* */ }
}

/** Сақталған сабақтар өзгергенде қайта сызу */
export function useSavedLessons() {
  const [m, setM] = useState(savedLessons);
  useEffect(() => { const f = () => setM(savedLessons()); addEventListener('sbq-off', f); addEventListener('storage', f); return () => { removeEventListener('sbq-off', f); removeEventListener('storage', f); }; }, []);
  return m;
}

/** Сайт жаңарғанда сақталған сабақтар интернетсіз ашыла беруі үшін қабықты фонда жаңарту */
export async function refreshAppPack() {
  if (!lessonOfflineSupported() || !navigator.onLine || !Object.keys(savedLessons()).length) return;
  const app = await fetchManifest('app'); if (app && app.version !== savedVersion('app')) await downloadLab(app, undefined, 'app');
  const lab = savedVersion('lab') ? await fetchManifest('lab') : null; if (lab && lab.version !== savedVersion('lab')) await downloadLab(lab, undefined, 'lab');
}
export const mb = (b: number) => (b / 1048576).toFixed(1).replace('.', ',') + ' МБ';
