/* Интернетсіз ашу үшін алдын ала жүктеу.
   Құрастыру кезінде vite.config.ts → /lab-precache.json (3D зертхананың барлық файлы) және /app-precache.json (сайт қабығы, кабинет, тақта).
   Файлдар сервис-воркердің кэшіне (public/sw.js → 'sbq-v1') салынады; сервис-воркер оларды интернет жоқта береді. */
const CACHE = 'sbq-v1';
const KEY = 'sbq-lab-offline'; // сәтті жүктелген нұсқа
export interface LabPack { version: string; bytes?: number; files: string[] }
export type PackName = 'lab' | 'app';
const keyOf = (name: PackName) => (name === 'lab' ? KEY : 'sbq-app-offline');

export const offlineSupported = () => typeof caches !== 'undefined' && 'serviceWorker' in navigator;
export const savedVersion = (name: PackName = 'lab') => { try { return localStorage.getItem(keyOf(name)); } catch { return null; } };

export async function fetchManifest(name: PackName = 'lab'): Promise<LabPack | null> {
  try { const r = await fetch(`/${name}-precache.json`, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; }
}

/** Барлық файл кэште бар ма */
export async function isCached(pack: LabPack) {
  const c = await caches.open(CACHE);
  for (const f of pack.files) if (!(await c.match(f, { ignoreVary: true }))) return false;
  return true;
}

/** URL тізімін кэшке салу (4-тен қатар). skip — бұрын сақталғанын қайта жүктемеу. Сәтті болса — true */
export async function putAll(files: string[], onProgress?: (k: number) => void, opt: { cache?: string; skip?: boolean } = {}): Promise<boolean> {
  const c = await caches.open(opt.cache || CACHE);
  let done = 0, ok = true;
  const one = async (f: string) => {
    try {
      if (!(opt.skip && await c.match(f, { ignoreVary: true }))) {
        const r = await fetch(f, { cache: 'reload' });
        if (!r.ok) throw new Error(String(r.status));
        await c.put(f, r);
      }
    } catch { ok = false; }
    onProgress?.(++done / Math.max(1, files.length));
  };
  for (let i = 0; i < files.length; i += 4) await Promise.all(files.slice(i, i + 4).map(one));
  return ok;
}

/** Жинақты жүктеу: onProgress(0..1). Сәтті болса — true */
export async function downloadLab(pack: LabPack, onProgress?: (k: number) => void, name: PackName = 'lab'): Promise<boolean> {
  // атауында хэш бар файлдар өзгермейді — бұрын сақталғанын қайта жүктемейміз, ал бет пен манифест әрдайым жаңартылады
  const fixed = pack.files.filter((f) => f.startsWith('/assets/') && f !== '/assets/fonts.css');
  const live = pack.files.filter((f) => !fixed.includes(f));
  let a = 0, b = 0;
  const all = pack.files.length || 1, tick = () => onProgress?.((a * fixed.length + b * live.length) / all);
  const ok = (await Promise.all([putAll(fixed, (k) => { a = k; tick(); }, { skip: true }), putAll(live, (k) => { b = k; tick(); })])).every(Boolean);
  if (ok) { try { localStorage.setItem(keyOf(name), pack.version); } catch { /* */ } }
  return ok;
}

/** Бұрын жүктелген болса және сайт жаңарса — фонда жаңа нұсқаны жүктеп қою */
export async function refreshIfNeeded(name: PackName = 'lab') {
  if (!offlineSupported() || !navigator.onLine) return;
  const v = savedVersion(name); if (!v) return;
  const pack = await fetchManifest(name); if (!pack || pack.version === v) return;
  await downloadLab(pack, undefined, name);
}

/** Браузер кэшті өзі тазаламауы үшін (орын тапшы болғанда) */
export async function persist() { try { await navigator.storage?.persist?.(); } catch { /* */ } }
