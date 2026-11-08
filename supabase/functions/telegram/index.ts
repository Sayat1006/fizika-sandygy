// Сабақтас: Telegram бот.
// 1) Telegram webhook: /start <код> мұғалімнің аккаунтын чатпен байланыстырады, /stop ажыратады.
// 2) {type:'request', id}: жаңа өтінім туралы әкімшілерге хабар (дерекқор триггерінен).
// 3) {type:'decided', id}: төлем расталғанын мұғалімге хабарлау (дерекқор триггерінен).
// 4) {type:'weekly'}: дүйсенбі сайын осы аптаның сабақтары (pg_cron-нан).
// 5) GET ?setup=1: webhook-ты осы функцияға бағыттау.
import { createClient } from 'jsr:@supabase/supabase-js@2';

let TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const SITE = Deno.env.get('SITE_URL') ?? 'https://sabaqtas-kz.vercel.app';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const esc = (s: unknown) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' ₸';
const dm = (iso: string) => iso.slice(8, 10) + '.' + iso.slice(5, 7);

async function secret(): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('fs-webhook:' + TOKEN));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}
async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
const send = (chat_id: number, text: string, button?: { text: string; url: string }) =>
  tg('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...(button ? { reply_markup: { inline_keyboard: [[button]] } } : {}) });

function week(now = Date.now()) {
  const t = new Date(now + 5 * 3600 * 1000);
  const dow = (t.getUTCDay() + 6) % 7;
  const mon = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - dow));
  const sun = new Date(mon.getTime() + 6 * 86400000);
  return { today: t.toISOString().slice(0, 10), from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
}
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

async function onUpdate(u: any) {
  const m = u.message;
  if (!m?.chat?.id || typeof m.text !== 'string') return;
  const chat = m.chat.id as number;
  const [cmd, arg] = m.text.trim().split(/\s+/, 2);
  if (cmd === '/start' && arg && /^[0-9a-f]{12,40}$/.test(arg)) {
    const { data: p } = await db.from('profiles').select('id,full_name,is_admin').eq('tg_code', arg).maybeSingle();
    if (!p) return send(chat, 'Сілтеменің мерзімі өткен. Кабинеттегі «Telegram-ды қосу» батырмасын қайта басыңыз.', { text: 'Кабинетті ашу', url: SITE + '/app' });
    await db.from('profiles').update({ tg_chat_id: null }).eq('tg_chat_id', chat);
    await db.from('profiles').update({ tg_chat_id: chat, tg_code: null }).eq('id', p.id);
    return send(chat, p.is_admin
      ? `Сәлеметсіз бе, ${esc(p.full_name)}! Әкімші хабарламалары қосылды: жаңа өтінім түскенде осы жерге хабар келеді.`
      : `Сәлеметсіз бе, ${esc(p.full_name)}! Telegram қосылды. Дүйсенбі сайын осы аптаның сабақтары туралы хабар аласыз. Ажырату үшін /stop деп жазыңыз.`);
  }
  if (cmd === '/stop') {
    await db.from('profiles').update({ tg_chat_id: null }).eq('tg_chat_id', chat);
    return send(chat, 'Хабарламалар өшірілді. Қайта қосу үшін кабинеттегі «Telegram-ды қосу» батырмасын басыңыз.');
  }
  return send(chat, 'Бұл — Сабақтас боты. Хабарламаларды қосу үшін кабинетке кіріп, «Telegram-ды қосу» батырмасын басыңыз.', { text: 'Кабинетті ашу', url: SITE + '/app' });
}

async function onRequest(id: string) {
  const { data: r } = await db.from('payment_requests').select('*').eq('id', id).maybeSingle();
  if (!r || r.notified || r.status !== 'pending') return { skipped: true };
  await db.from('payment_requests').update({ notified: true }).eq('id', id);
  const { data: u } = await db.from('profiles').select('full_name,phone,email,school').eq('id', r.user_id).maybeSingle();
  const { data: admins } = await db.from('profiles').select('tg_chat_id').eq('is_admin', true).not('tg_chat_id', 'is', null);
  const text = `🆕 <b>Жаңа өтінім</b> №${id.slice(0, 8).toUpperCase()}\n${esc(u?.full_name)} · ${esc(u?.phone)}\n${esc(u?.school)}\n` +
    `${r.grades.join(', ')}-сынып · ${r.plan === 'month' ? '1 ай' : '1 жыл'} · <b>${fmt(r.amount)}</b>\n\nKaspi-де ақша түскенін тексеріп, әкімші бетінде растаңыз.`;
  for (const a of admins ?? []) await send(a.tg_chat_id, text, { text: 'Әкімші беті', url: SITE + '/admin' });
  return { sent: admins?.length ?? 0 };
}

async function onDecided(id: string) {
  const { data: r } = await db.from('payment_requests').select('*').eq('id', id).maybeSingle();
  if (!r || r.notified_decision || r.status === 'pending') return { skipped: true };
  await db.from('payment_requests').update({ notified_decision: true }).eq('id', id);
  const { data: u } = await db.from('profiles').select('tg_chat_id').eq('id', r.user_id).maybeSingle();
  if (!u?.tg_chat_id) return { sent: 0 };
  if (r.status === 'approved') {
    const { data: subs } = await db.from('subscriptions').select('grade,paid_until').eq('user_id', r.user_id).in('grade', r.grades);
    const lines = (subs ?? []).map((s) => `${s.grade}-сынып: ${s.paid_until.split('-').reverse().join('.')} дейін`).join('\n');
    await send(u.tg_chat_id, `✅ Төлем расталды. Жазылым ашылды:\n${lines}`, { text: 'Сабақтарды ашу', url: SITE + '/app' });
  } else {
    await send(u.tg_chat_id, `Өтінім №${id.slice(0, 8).toUpperCase()} расталмады. Сұрағыңыз болса, WhatsApp арқылы жазыңыз.`);
  }
  return { sent: 1 };
}

async function onWeekly() {
  const w = week();
  const { error: dup } = await db.from('tg_weekly_log').insert({ week: w.from });
  if (dup) return { skipped: 'already sent this week' };
  const lessons: any[] = await (await fetch(SITE + '/lessons.json')).json();
  const { data: subs } = await db.from('subscriptions').select('user_id,grade,paid_until,trial').gte('paid_until', w.today);
  const byUser = new Map<string, any[]>();
  for (const s of subs ?? []) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);
  if (!byUser.size) return { sent: 0 };
  const { data: people } = await db.from('profiles').select('id,full_name,tg_chat_id').in('id', [...byUser.keys()]).not('tg_chat_id', 'is', null);
  let sent = 0;
  for (const p of people ?? []) {
    const ss = byUser.get(p.id)!.sort((a, b) => a.grade - b.grade);
    const paid = ss.filter((s) => !s.trial);
    const use = paid.length ? paid : ss;
    const blocks = use.map((s) => {
      const ls = lessons.filter((l) => l.grade === s.grade && l.date >= w.from && l.date <= w.to);
      if (!ls.length) return `<b>${s.grade}-сынып</b>\nБұл аптада сабақ жоқ.`;
      return `<b>${s.grade}-сынып</b>\n` + ls.map((l) => `• ${dm(l.date)} — ${esc(l.topic)}`).join('\n');
    }).join('\n\n');
    const head = `📚 <b>Осы аптаның сабақтары</b> (${dm(w.from)}–${dm(w.to)})\nҚМЖ, презентация мен жұмыс парағы кабинетте ашық.\n\n`;
    const tail = paid.length ? '' : '\n\nТегін сынақ мерзімі аяқталған соң сабақтар жабылады. Ұнаса, керек сыныптарға жазылыңыз.';
    await send(p.tg_chat_id, head + blocks + tail, { text: 'Кабинетті ашу', url: SITE + '/app' });
    sent++;
    await new Promise((r) => setTimeout(r, 60));
  }
  await db.from('tg_weekly_log').update({ sent }).eq('week', w.from);
  return { sent };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (!Deno.env.get('TELEGRAM_BOT_TOKEN')) {
    const { data } = await db.from('app_secrets').select('value').eq('name', 'TELEGRAM_BOT_TOKEN').maybeSingle();
    TOKEN = data?.value ?? '';
  }
  if (!TOKEN) return json({ error: 'TELEGRAM_BOT_TOKEN орнатылмаған' }, 503);
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('setup') === '1') {
    const hook = `${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram`;
    const r = await tg('setWebhook', { url: hook, secret_token: await secret(), allowed_updates: ['message'], drop_pending_updates: true });
    const me = await tg('getMe', {});
    return json({ webhook: r, bot: me?.result?.username });
  }
  if (req.method !== 'POST') return json({ ok: true });
  try {
    if (req.headers.get('x-telegram-bot-api-secret-token')) {
      if (req.headers.get('x-telegram-bot-api-secret-token') !== await secret()) return json({ error: 'forbidden' }, 403);
      await onUpdate(await req.json());
      return json({ ok: true });
    }
    const b = await req.json();
    if (b?.type === 'request' && typeof b.id === 'string') return json(await onRequest(b.id));
    if (b?.type === 'decided' && typeof b.id === 'string') return json(await onDecided(b.id));
    if (b?.type === 'weekly') return json(await onWeekly());
    return json({ error: 'unknown' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: 'server' }, 500);
  }
});
