import { useEffect, useState } from 'react';
import { lessonDeck, lessonPlan, viewPages, type Lesson } from './data';

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
