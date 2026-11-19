/* 3D зертхананы (/lab) интернетсіз ашу үшін алдын ала жүктеу.
   Құрастыру кезінде vite.config.ts → /lab-precache.json: зертхананың барлық файлдары (жалқау бөліктерімен).
   Файлдар сервис-воркердің кэшіне (public/sw.js → 'sbq-v1') салынады; сервис-воркер оларды интернет жоқта береді. */
const CACHE = 'sbq-v1';
const KEY = 'sbq-lab-offline'; // сәтті жүктелген нұсқа
export interface LabPack { version: string; bytes?: number; files: string[] }

export const offlineSupported = () => typeof caches !== 'undefined' && 'serviceWorker' in navigator;
export const savedVersion = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

export async function fetchManifest(): Promise<LabPack | null> {
  try { const r = await fetch('/lab-precache.json', { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; }
}

/** Барлық файл кэште бар ма */
export async function isCached(pack: LabPack) {
  const c = await caches.open(CACHE);
  for (const f of pack.files) if (!(await c.match(f, { ignoreVary: true }))) return false;
  return true;
}

/** Жүктеу: onProgress(0..1). Сәтті болса — true */
export async function downloadLab(pack: LabPack, onProgress?: (k: number) => void): Promise<boolean> {
  const c = await caches.open(CACHE);
  let done = 0, ok = true;
  const one = async (f: string) => {
    try {
      const r = await fetch(f, { cache: 'reload' });
      if (!r.ok) throw new Error(String(r.status));
      await c.put(f, r);
    } catch { ok = false; }
    onProgress?.(++done / pack.files.length);
  };
  for (let i = 0; i < pack.files.length; i += 4) await Promise.all(pack.files.slice(i, i + 4).map(one));
  if (ok) { try { localStorage.setItem(KEY, pack.version); } catch { /* */ } }
  return ok;
}

/** Бұрын жүктелген болса және сайт жаңарса — фонда жаңа нұсқаны жүктеп қою */
export async function refreshIfNeeded() {
  if (!offlineSupported() || !navigator.onLine) return;
  const v = savedVersion(); if (!v) return;
  const pack = await fetchManifest(); if (!pack || pack.version === v) return;
  await downloadLab(pack);
}
