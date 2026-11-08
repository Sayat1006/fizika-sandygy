// ҚМЖ: кабинетке кірген кез келген мұғалімге тегін, кез келген тақырып.
// Презентация мен жұмыс парағы: тек сол сыныпқа жазылымы бар мұғалімге.
// ҚМЖ-ға мұғалімнің аты-жөні мен сабақ күні жазылады. kind=week — осы аптаның бәрі бір ZIP-пен.
const fs = require('fs');
const path = require('path');
const { personalizeKmzh } = require('./_kmzh');
const { writeZip } = require('./_zip');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rumnyvcgpswdxjheaeif.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_l7Xeu0foTUzNVh_-w258nw_42HAgAaw';
const MAX_PER_FILE = 5; // бір файлды бір мұғалім ең көбі неше рет жүктей алады

const ROOT = path.join(process.cwd(), 'materials');
let MANIFEST;
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

// Осы аптаның (сенбі–жексенбіде келесі аптаның да) файлдары бір ZIP-пен.
async function weekZip(res, { v, grade, user, token, me }) {
  const w = week(Date.now());
  const lessons = Object.entries(manifest()).filter(([k, l]) => k.startsWith(v + ':') && l.date >= w.from && l.date <= w.to)
    .map(([k, l]) => ({ n: +k.split(':')[1], ...l })).sort((a, b) => a.date.localeCompare(b.date) || a.n - b.n);
  if (!lessons.length) return fail(res, 404, 'Бұл аптада сабақ жоқ.');
  const s = await sb(`/rest/v1/subscriptions?select=paid_until&user_id=eq.${user.id}&grade=eq.${grade}`, token);
  const subs = s.ok ? await s.json() : [];
  const paid = subs.length && subs[0].paid_until >= w.today;
  const c = await sb(`/rest/v1/downloads?select=n,kind&user_id=eq.${user.id}&grade=eq.${grade}&variant=eq.${encodeURIComponent(v)}`, token);
  const prev = c.ok ? await c.json() : [];
  const used = (n, k) => prev.filter((x) => x.n === n && x.kind === k).length;
  const files = [], log = [];
  for (const l of lessons) for (const k of paid ? ['kmzh', 'pres', 'ws'] : ['kmzh']) {
    if (!l[k] || used(l.n, k) >= MAX_PER_FILE) continue;
    let data = fs.readFileSync(path.join(ROOT, l[k].path));
    if (k === 'kmzh') data = personalizeKmzh(data, { teacher: me, date: dmy(l.date) });
    files.push({ name: `${dmy(l.date)}_${l[k].name}`, data, store: true });
    log.push({ user_id: user.id, grade, n: l.n, kind: k, variant: v });
  }
  if (!files.length) return fail(res, 429, 'Бұл аптаның файлдарын жүктеу шегі бітті.');
  const ins = await sb('/rest/v1/downloads', token, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(log) });
  if (!ins.ok) return fail(res, 500, 'Жүктеуді тіркеу мүмкін болмады. Кейінірек қайталап көріңіз.');
  const zip = writeZip(files);
  const name = `Сабақтас_${v}_${dmy(w.from).slice(0, 5)}-${dmy(w.to).slice(0, 5)}${paid ? '' : '_ҚМЖ'}.zip`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="week_${v}.zip"; filename*=UTF-8''${encodeURIComponent(name)}`);
  res.setHeader('X-Files', String(files.length));
  res.setHeader('X-Paid', paid ? '1' : '0');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Length', zip.length);
  res.end(zip);
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
    if (!/^(7|8|9|10|11)(-(zhmb|kgb)-[123])?$/.test(v) || !((n > 0 && ['kmzh', 'pres', 'ws'].includes(kind)) || kind === 'week')) return fail(res, 400, 'Сұраныс қате.');
    const grade = parseInt(v, 10);

    const u = await sb('/auth/v1/user', token);
    if (!u.ok) return fail(res, 401, 'Сессия аяқталды. Қайта кіріңіз.');
    const user = await u.json();

    const me = await profileName(user.id, token);
    if (kind === 'week') return weekZip(res, { v, grade, user, token, me });

    const lesson = manifest()[`${v}:${n}`] || (grade < 10 ? manifest()[`${grade}:${n}`] : null);
    const file = lesson && lesson[kind];
    if (!file) return fail(res, 404, 'Бұл сабаққа мұндай файл жоқ.');

    const w = week(Date.now());
    if (kind !== 'kmzh') {
      const s = await sb(`/rest/v1/subscriptions?select=paid_until&user_id=eq.${user.id}&grade=eq.${grade}`, token);
      const subs = s.ok ? await s.json() : [];
      if (!subs.length || subs[0].paid_until < w.today) return fail(res, 402, `Презентация мен жұмыс парағы жазылыммен ашылады: ${grade}-сынып.`);
    }

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
