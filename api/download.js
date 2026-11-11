// ҚМЖ, презентация және жұмыс парағы: сол сыныпқа белсенді жазылымы бар мұғалімге
// (тіркелгенде барлық сыныпқа берілетін 3 күндік тегін сынақ та жазылым болып есептеледі).
// ҚМЖ-ға мұғалімнің аты-жөні мен сабақ күні жазылады.
const fs = require('fs');
const path = require('path');
const { personalizeKmzh } = require('./_kmzh');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rumnyvcgpswdxjheaeif.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_l7Xeu0foTUzNVh_-w258nw_42HAgAaw';
const MAX_PER_FILE = 5; // бір файлды бір мұғалім ең көбі неше рет жүктей алады

const ROOT = path.join(process.cwd(), 'materials');
let MANIFEST, PREVIEWS, PLANS;
const DECKS = {};
// Анимациялы презентация (тақтаға): materials/decks/{нұсқа}-{n}.json
function deck(v, n, grade) {
  for (const k of [`${v}-${n}`, grade < 10 ? `${grade}-${n}` : null]) {
    if (!k) continue;
    if (!(k in DECKS)) { try { DECKS[k] = fs.readFileSync(path.join(ROOT, 'decks', k + '.json'), 'utf8'); } catch (_) { DECKS[k] = null; } }
    if (DECKS[k]) return DECKS[k];
  }
  return null;
}
const FREE_PAGES = { kmzh: 1, pres: 3, ws: 1 }; // жазылымсыз қарауға болатын бет саны
function previews() {
  if (!PREVIEWS) { try { PREVIEWS = JSON.parse(fs.readFileSync(path.join(ROOT, 'previews.json'), 'utf8')); } catch (_) { PREVIEWS = {}; } }
  return PREVIEWS;
}
function plans() {
  if (!PLANS) { try { PLANS = JSON.parse(fs.readFileSync(path.join(ROOT, 'plans.json'), 'utf8')); } catch (_) { PLANS = {}; } }
  return PLANS;
}
async function activeSub(uid, grade, token) {
  const s = await sb(`/rest/v1/subscriptions?select=paid_until&user_id=eq.${uid}&grade=eq.${grade}`, token);
  const subs = s.ok ? await s.json() : [];
  return !!subs.length && subs[0].paid_until >= week(Date.now()).today;
}
function manifest() {
  if (!MANIFEST) MANIFEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  return MANIFEST;
}

function week(now) {
  const t = new Date(now + 5 * 3600 * 1000);
  const dow = (t.getUTCDay() + 6) % 7;
  const mon = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - dow));
  const end = new Date(mon.getTime() + (dow >= 5 ? 13 : 6) * 86400000);
  return { today: t.toISOString().slice(0, 10), from: mon.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

async function sb(pathname, token, init = {}) {
  const res = await fetch(SUPABASE_URL + pathname, {
    ...init,
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  return res;
}

function fail(res, code, message) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ error: message }));
}

const dmy = (iso) => iso.split('-').reverse().join('.');
async function profileName(uid, token) {
  try { const r = await sb(`/rest/v1/profiles?select=full_name&id=eq.${uid}`, token); const j = r.ok ? await r.json() : []; return (j[0] && j[0].full_name || '').trim(); } catch (_) { return ''; }
}

module.exports = async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return fail(res, 401, 'Кабинетке кіріңіз.');

    const url = new URL(req.url, 'http://x');
    const v = String(url.searchParams.get('v') || url.searchParams.get('grade') || '');
    const n = parseInt(url.searchParams.get('n'), 10);
    const kind = url.searchParams.get('kind');
    if (!/^(7|8|9|10|11)(-(zhmb|kgb)-[123])?$/.test(v) || !(n > 0) || !['kmzh', 'pres', 'ws', 'plan', 'deck'].includes(kind)) return fail(res, 400, 'Сұраныс қате.');
    const grade = parseInt(v, 10);

    const u = await sb('/auth/v1/user', token);
    if (!u.ok) return fail(res, 401, 'Сессия аяқталды. Қайта кіріңіз.');
    const user = await u.json();

    // Тақтаға арналған сабақ сценарийі (кезеңдер, минуттар, мұғалім жазбасы) — тек жазылыммен
    if (kind === 'plan') {
      const st = plans()[`${v}:${n}`] || (grade < 10 ? plans()[`${grade}:${n}`] : null);
      if (!st) return fail(res, 404, 'Бұл сабақтың сценарийі әзірге жоқ.');
      if (!(await activeSub(user.id, grade, token))) return fail(res, 402, `Тақта жазылыммен ашылады: ${grade}-сынып.`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.end(JSON.stringify({ stages: st }));
    }

    if (kind === 'deck') {
      const d = deck(v, n, grade);
      if (!d) return fail(res, 404, 'Бұл сабақтың анимациялы презентациясы әзірге жоқ.');
      if (!(await activeSub(user.id, grade, token))) return fail(res, 402, `Тақта жазылыммен ашылады: ${grade}-сынып.`);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.end(d);
    }

    const me = await profileName(user.id, token);

    const lesson = manifest()[`${v}:${n}`] || (grade < 10 ? manifest()[`${grade}:${n}`] : null);
    const file = lesson && lesson[kind];
    if (!file) return fail(res, 404, 'Бұл сабаққа мұндай файл жоқ.');

    if (url.searchParams.get('view') === '1') {
      const pv = previews()[`${v}:${n}:${kind}`] || (grade < 10 ? previews()[`${grade}:${n}:${kind}`] : null);
      if (!pv) return fail(res, 404, 'Бұл файлдың алдын ала көрінісі әзірге жоқ.');
      const total = pv.files.length;
      let open = total;
      if (!(await activeSub(user.id, grade, token))) open = Math.min(total, FREE_PAGES[kind]);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.end(JSON.stringify({ total, locked: open < total, w: pv.w, h: pv.h,
        pages: pv.files.slice(0, open).map((f) => `/pv/${pv.dir}/${f}`) }));
    }

    if (!(await activeSub(user.id, grade, token))) return fail(res, 402, `Материалдар жазылыммен ашылады: ${grade}-сынып.`);

    const c = await sb(`/rest/v1/downloads?select=id&user_id=eq.${user.id}&grade=eq.${grade}&n=eq.${n}&kind=eq.${kind}&variant=eq.${encodeURIComponent(v)}`, token);
    const prev = c.ok ? await c.json() : [];
    if (prev.length >= MAX_PER_FILE) return fail(res, 429, 'Бұл файлды жүктеу шегі бітті. Қажет болса, бізге жазыңыз.');

    const ins = await sb('/rest/v1/downloads', token, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: user.id, grade, n, kind, variant: v }) });
    if (!ins.ok) return fail(res, 500, 'Жүктеуді тіркеу мүмкін болмады. Кейінірек қайталап көріңіз.');

    let data = fs.readFileSync(path.join(ROOT, file.path));
    if (kind === 'kmzh') data = personalizeKmzh(data, { teacher: me, date: dmy(lesson.date) });
    res.statusCode = 200;
    res.setHeader('Content-Type', {
      kmzh: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pres: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ws: 'application/pdf',
    }[kind]);
    res.setHeader('Content-Disposition', `attachment; filename="${kind}_${v}_${n}${path.extname(file.path)}"; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Length', data.length);
    res.end(data);
  } catch (e) {
    console.error(e);
    fail(res, 500, 'Сервер қатесі. Кейінірек қайталап көріңіз.');
  }
};
