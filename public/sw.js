/* Сабақтас — сыныптағы интернет үзілсе де тақта жұмыс істеуі үшін.
   - Бет (HTML) және API (презентация, сценарий, бет суреттері тізімі): алдымен желі, болмаса — сақталған нұсқа.
   - /assets/* (атауында хэш бар) және /pv/* (бет суреттері), қаріптер: алдымен кэш.
   - Файл жүктеу (ҚМЖ, pptx) кэштелмейді. Supabase сұраныстары — тек желі. */
const V = 'sbq-v1';
const SHELL = ['/', '/lessons.json', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const cacheable = (u) => {
  if (u.origin !== location.origin) return null;
  if (u.pathname.startsWith('/assets/') || u.pathname.startsWith('/pv/') || u.pathname.startsWith('/fonts/')) return 'cache';
  if (u.pathname === '/api/download') {
    const k = u.searchParams.get('kind');
    return k === 'deck' || k === 'plan' || u.searchParams.get('view') === '1' ? 'net' : null;
  }
  if (u.pathname === '/lessons.json') return 'net';
  return null;
};

async function netFirst(req, key) {
  const c = await caches.open(V);
  try {
    const r = await fetch(req);
    if (r.ok) c.put(key, r.clone());
    return r;
  } catch (err) {
    const hit = await c.match(key);
    if (hit) return hit;
    throw err;
  }
}
async function cacheFirst(req) {
  const c = await caches.open(V);
  const hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok) c.put(req, r.clone());
  return r;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (req.mode === 'navigate' && u.origin === location.origin && !u.pathname.startsWith('/lab') && !u.pathname.startsWith('/api')) {
    e.respondWith(netFirst(req, '/'));
    return;
  }
  const how = cacheable(u);
  if (how === 'cache') e.respondWith(cacheFirst(req));
  else if (how === 'net') e.respondWith(netFirst(req, u.pathname + u.search));
});
