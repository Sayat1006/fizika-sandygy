// Файлды тек жазылымы бар мұғалімге және тек осы аптаның сабағы болса ғана береді.
const fs = require('fs');
const path = require('path');

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

module.exports = async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return fail(res, 401, 'Кабинетке кіріңіз.');

    const url = new URL(req.url, 'http://x');
    const grade = parseInt(url.searchParams.get('grade'), 10);
    const n = parseInt(url.searchParams.get('n'), 10);
    const kind = url.searchParams.get('kind');
    if (!(grade >= 7 && grade <= 11) || !(n > 0) || !['kmzh', 'pres'].includes(kind)) return fail(res, 400, 'Сұраныс қате.');

    const u = await sb('/auth/v1/user', token);
    if (!u.ok) return fail(res, 401, 'Сессия аяқталды. Қайта кіріңіз.');
    const user = await u.json();

    const lesson = manifest()[`${grade}-${n}`];
    const file = lesson && lesson[kind];
    if (!file) return fail(res, 404, 'Бұл сабаққа мұндай файл жоқ.');

    const w = week(Date.now());
    if (lesson.date < w.from || lesson.date > w.to) return fail(res, 403, 'Бұл сабақ өз аптасында ашылады: ' + lesson.date.split('-').reverse().join('.'));

    const s = await sb(`/rest/v1/subscriptions?select=paid_until&user_id=eq.${user.id}&grade=eq.${grade}`, token);
    const subs = s.ok ? await s.json() : [];
    if (!subs.length || subs[0].paid_until < w.today) return fail(res, 402, `${grade}-сыныпқа жазылым белсенді емес.`);

    const c = await sb(`/rest/v1/downloads?select=id&user_id=eq.${user.id}&grade=eq.${grade}&n=eq.${n}&kind=eq.${kind}`, token);
    const prev = c.ok ? await c.json() : [];
    if (prev.length >= MAX_PER_FILE) return fail(res, 429, 'Бұл файлды жүктеу шегі бітті. Қажет болса, бізге жазыңыз.');

    const ins = await sb('/rest/v1/downloads', token, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: user.id, grade, n, kind }) });
    if (!ins.ok) return fail(res, 500, 'Жүктеуді тіркеу мүмкін болмады. Кейінірек қайталап көріңіз.');

    const data = fs.readFileSync(path.join(ROOT, file.path));
    res.statusCode = 200;
    res.setHeader('Content-Type', kind === 'kmzh'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${kind}_${grade}_${n}${path.extname(file.path)}"; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Content-Length', data.length);
    res.end(data);
  } catch (e) {
    console.error(e);
    fail(res, 500, 'Сервер қатесі. Кейінірек қайталап көріңіз.');
  }
};
