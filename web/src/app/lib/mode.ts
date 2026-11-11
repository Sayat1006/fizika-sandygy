import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

/* Сайттың екі режимі:
   prep  — «Сабақтан тыс»: материалдарды қарау, жүктеу, сабаққа дайындық;
   class — «Сабақ барысы»: интерактивті тақтаға арналған қарапайым, қараңғы көрініс.
   Режим құрылғыда есте қалады; <html data-mode> арқылы бүкіл сайттың түрі өзгереді. */
export type Mode = 'prep' | 'class';
const KEY = 'fs-app-mode';
const subs = new Set<() => void>();
let mode: Mode = (() => { try { return localStorage.getItem(KEY) === 'class' ? 'class' : 'prep'; } catch { return 'prep'; } })();
const apply = () => { document.documentElement.dataset.mode = mode; };
apply();

export const getMode = () => mode;
export function useMode() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, getMode, getMode);
}

/** Режимді ауыстыру: жаңа көрініс батырмадан шеңбер болып жайылады (morph), ауыстырғыштың белгісі жылжиды */
export function setMode(m: Mode, from?: { x: number; y: number }, after?: () => void) {
  if (m === mode) { after?.(); return; }
  const run = () => { mode = m; apply(); try { localStorage.setItem(KEY, m); } catch { /* */ } subs.forEach((f) => f()); after?.(); };
  const d = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!d.startViewTransition || calm) return run();
  const root = document.documentElement;
  root.style.setProperty('--mx', `${from?.x ?? innerWidth / 2}px`);
  root.style.setProperty('--my', `${from?.y ?? 0}px`);
  root.classList.add('mode-tr');
  d.startViewTransition(() => flushSync(run)).finished.finally(() => root.classList.remove('mode-tr'));
}
