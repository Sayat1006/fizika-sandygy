/* Сабақтас — сыныптағы интернет үзілсе де тақта жұмыс істеуі үшін.
   - Бет (HTML) және API (презентация, сценарий, бет суреттері тізімі): алдымен желі, болмаса — сақталған нұсқа.
   - /assets/* (атауында хэш бар) және /pv/* (бет суреттері), қаріптер: алдымен кэш.
   - /vid/* (сабақтың видеолары): бір рет толық жүктеліп сақталады, кейін интернетсіз де ойнайды (Range сұранысына 206).
   - /lab/* (3D зертхана): бет алдымен желіден, болмаса сақталған '/lab'; зертхананың барлық файлын «Офлайн режимге жүктеу»
     батырмасы алдын ала кэшке салады (web/src/shared/labOffline.ts, /lab-precache.json).
   - Файл жүктеу (ҚМЖ, pptx) кэштелмейді. Supabase сұраныстары — тек желі. */
const V = 'sbq-v1';
const VID = 'sbq-vid-v1'; // видеолар бөлек кэште: нұсқа ауысқанда қайта жүктелмейді
const SHELL = ['/', '/lessons.json', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k !== VID).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const cacheable = (u) => {
  if (u.origin !== location.origin) return null;
  if (u.pathname.startsWith('/assets/') || u.pathname.startsWith('/pv/') || u.pathname.startsWith('/fonts/')) return 'cache';
  if (u.pathname === '/api/download') {
    const k = u.searchParams.get('kind');
    return k === 'deck' || k === 'plan' || u.searchParams.get('view') === '1' ? 'net' : null;
  }
  if (u.pathname === '/lessons.json' || u.pathname === '/videos.json') return 'net';
  if (u.pathname.startsWith('/vid/') && u.pathname.endsWith('.mp4')) return 'video';
  if (u.pathname.startsWith('/vid/')) return 'cache';
  return null;
};

async function netFirst(req, key) {
  const c = await caches.open(V);
  try {
    const r = await fetch(req);
    if (r.ok) c.put(key, r.clone());
    return r;
  } catch (err) {
    const hit = await c.match(key, { ignoreVary: true });
    if (hit) return hit;
    throw err;
  }
}
async function cacheFirst(req) {
  const c = await caches.open(V);
  const hit = await c.match(req, { ignoreVary: true });
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok) c.put(req, r.clone());
  return r;
}

// видео: толық файлды кэштеп, Range сұранысына кесіндісін (206) береміз — Safari мен Chrome екеуі де ойнатады
async function videoFirst(req, u) {
  const c = await caches.open(VID);
  let full = await c.match(u.pathname);
  if (!full) {
    try {
      const r = await fetch(u.pathname); // Range-сіз толық сұраныс
      if (!r.ok) return r;
      await c.put(u.pathname, r.clone());
      full = r;
    } catch (err) { return fetch(req); }
  }
  const range = req.headers.get('range');
  if (!range) return full;
  const buf = await full.clone().arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (req.mode === 'navigate' && u.origin === location.origin && (u.pathname === '/lab' || u.pathname.startsWith('/lab/'))) {
    e.respondWith(netFirst(req, '/lab'));
    return;
  }
  if (req.mode === 'navigate' && u.origin === location.origin && !u.pathname.startsWith('/lab') && !u.pathname.startsWith('/api')) {
    e.respondWith(netFirst(req, '/'));
    return;
  }
  const how = cacheable(u);
  if (how === 'cache') e.respondWith(cacheFirst(req));
  else if (how === 'video') e.respondWith(videoFirst(req, u));
  else if (how === 'net') e.respondWith(netFirst(req, u.pathname + u.search));
});
