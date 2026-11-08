// Сабақтас: Telegram бот.
// 1) Telegram webhook: /start <код> мұғалімнің аккаунтын чатпен байланыстырады, /stop ажыратады.
// 2) {type:'request', id}: жаңа өтінім туралы әкімшілерге хабар (дерекқор триггерінен).
// 3) {type:'decided', id}: төлем расталғанын мұғалімге хабарлау (дерекқор триггерінен).
// 4) {type:'weekly'}: дүйсенбі сайын осы аптаның сабақтары (pg_cron-нан).
// 5) GET ?setup=1: webhook-ты осы функцияға бағыттау.
// 6) /start p<өтінім>: мұғалім Kaspi чегін ботқа жібереді → әкімшіге «Растау / Бас тарту» батырмаларымен келеді.
import { createClient } from 'jsr:@supabase/supabase-js@2';

let TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const SITE = Deno.env.get('SITE_URL') ?? 'https://sabaqtas-kz.vercel.app';
const KASPI = Deno.env.get('KASPI_PHONE') ?? '+7 776 870 75 00';
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
const send = (chat_id: number, text: string, button?: { text: string; url: string } | { inline_keyboard: unknown[] }) =>
  tg('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true,
    ...(button ? { reply_markup: 'inline_keyboard' in button ? button : { inline_keyboard: [[button]] } } : {}) });
const decideKb = (id: string) => ({ inline_keyboard: [[{ text: '✅ Растау', callback_data: 'ok:' + id }, { text: '❌ Бас тарту', callback_data: 'no:' + id }]] });
const code = (id: string) => id.slice(0, 8).toUpperCase();
const uuidOf = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
const planTxt = (r: any) => `${r.grades.join(', ')}-сынып · ${r.plan === 'month' ? '1 ай' : '1 жыл'} · <b>${fmt(r.amount)}</b>`;
async function summary(r: any) {
  const { data: u } = await db.from('profiles').select('full_name,phone,school').eq('id', r.user_id).maybeSingle();
  return `Өтінім №${code(r.id)}\n${esc(u?.full_name)} · ${esc(u?.phone)}\n${esc(u?.school)}\n${planTxt(r)}`;
}
async function adminChats(): Promise<number[]> {
  const { data } = await db.from('profiles').select('tg_chat_id').eq('is_admin', true).not('tg_chat_id', 'is', null);
  return (data ?? []).map((a) => a.tg_chat_id);
}

function week(now = Date.now()) {
  const t = new Date(now + 5 * 3600 * 1000);
  const dow = (t.getUTCDay() + 6) % 7;
  const mon = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - dow));
  const sun = new Date(mon.getTime() + 6 * 86400000);
  return { today: t.toISOString().slice(0, 10), from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
}
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

async function onCallback(q: any) {
  const [act, id] = String(q.data ?? '').split(':');
  const answer = (text: string) => tg('answerCallbackQuery', { callback_query_id: q.id, text });
  if (!['ok', 'no'].includes(act) || !id) return answer('Белгісіз әрекет');
  const { data: adm } = await db.from('profiles').select('full_name').eq('tg_chat_id', q.from.id).eq('is_admin', true).maybeSingle();
  if (!adm) return answer('Тек әкімші раста алады');
  const { error } = await db.rpc('decide_request', { p_id: id, p_approve: act === 'ok' });
  const { data: r } = await db.from('payment_requests').select('*').eq('id', id).maybeSingle();
  if (!r) return answer('Өтінім табылмады');
  const done = r.status === 'approved' ? '✅ <b>Расталды</b>, жазылым ашылды' : r.status === 'rejected' ? '❌ <b>Бас тартылды</b>' : '';
  const text = (await summary(r)) + (done ? `\n\n${done}` : '');
  const m = q.message;
  if (m) {
    const base = { chat_id: m.chat.id, message_id: m.message_id, parse_mode: 'HTML', reply_markup: done ? { inline_keyboard: [] } : decideKb(id) };
    if (m.caption !== undefined || m.photo || m.document) await tg('editMessageCaption', { ...base, caption: text });
    else await tg('editMessageText', { ...base, text, disable_web_page_preview: true });
  }
  if (error) return answer(/not pending/.test(error.message) ? 'Бұл өтінім бұрын қаралған' : 'Қате: ' + error.message);
  return answer(act === 'ok' ? 'Расталды. Мұғалімге хабар кетті.' : 'Бас тартылды');
}

async function onPayStart(chat: number, hex: string) {
  const { data: r } = await db.from('payment_requests').select('*').eq('id', uuidOf(hex)).maybeSingle();
  if (!r) return send(chat, 'Өтінім табылмады. Кабинеттен қайта ашып көріңіз.', { text: 'Кабинетті ашу', url: SITE + '/app' });
  if (r.status !== 'pending') return send(chat, `Өтінім №${code(r.id)} бұрын қаралған: ${r.status === 'approved' ? 'расталды ✅' : 'расталмады'}.`, { text: 'Кабинетті ашу', url: SITE + '/app' });
  await db.from('payment_requests').update({ payer_chat: chat }).eq('id', r.id);
  const { data: p } = await db.from('profiles').select('tg_chat_id').eq('id', r.user_id).maybeSingle();
  if (p && !p.tg_chat_id) {
    const { data: taken } = await db.from('profiles').select('id').eq('tg_chat_id', chat).maybeSingle();
    if (!taken) await db.from('profiles').update({ tg_chat_id: chat }).eq('id', r.user_id);
  }
  return send(chat, `🧾 <b>Өтінім №${code(r.id)}</b>\n${planTxt(r)}\n\n1. Сомасын Kaspi Gold-қа аударыңыз: <b>${KASPI}</b>\n2. Kaspi чегін (PDF немесе скриншот) <b>осы чатқа</b> жіберіңіз.\n\nТөлем расталған соң жазылым өзі ашылады, осы жерге хабар келеді.`);
}

async function onReceipt(m: any) {
  const chat = m.chat.id as number;
  let { data: r } = await db.from('payment_requests').select('*').eq('payer_chat', chat).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!r) {
    const { data: p } = await db.from('profiles').select('id').eq('tg_chat_id', chat).maybeSingle();
    if (p) ({ data: r } = await db.from('payment_requests').select('*').eq('user_id', p.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle());
  }
  if (!r) return send(chat, 'Төлем күтіп тұрған өтінім табылмады. Алдымен кабинетте «Жазылым» бөлімінен өтінім жіберіңіз.', { text: 'Кабинетті ашу', url: SITE + '/app' });
  const caption = `🧾 <b>Чек келді</b>\n${await summary(r)}\n\nKaspi-де ақша түскенін тексеріп, растаңыз.`;
  const admins = await adminChats();
  for (const a of admins) await tg('copyMessage', { chat_id: a, from_chat_id: chat, message_id: m.message_id, caption, parse_mode: 'HTML', reply_markup: decideKb(r.id) });
  await db.from('payment_requests').update({ receipt_at: new Date().toISOString(), payer_chat: chat }).eq('id', r.id);
  return send(chat, admins.length ? `Чек қабылданды ✅\nТөлем расталған соң жазылым ашылады, осы жерге хабар келеді.` : 'Чек қабылданды. Әкімші жақын арада тексереді.');
}

async function onUpdate(u: any) {
  if (u.callback_query) return onCallback(u.callback_query);
  const m = u.message;
  if (m?.chat?.id && (m.photo || m.document)) return onReceipt(m);
  if (!m?.chat?.id || typeof m.text !== 'string') return;
  const chat = m.chat.id as number;
  const [cmd, arg] = m.text.trim().split(/\s+/, 2);
  if (cmd === '/start' && arg && /^p[0-9a-f]{32}$/.test(arg)) return onPayStart(chat, arg.slice(1));
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
  const admins = await adminChats();
  const text = `🆕 <b>Жаңа өтінім</b>\n${await summary(r)}\n\nЧек ботқа келгенде бөлек хабар түседі. Ақша түскенін көрсеңіз, осы жерден де растай аласыз.`;
  for (const a of admins) await send(a, text, decideKb(r.id));
  return { sent: admins.length };
}

async function onDecided(id: string) {
  const { data: r } = await db.from('payment_requests').select('*').eq('id', id).maybeSingle();
  if (!r || r.notified_decision || r.status === 'pending') return { skipped: true };
  await db.from('payment_requests').update({ notified_decision: true }).eq('id', id);
  const { data: u } = await db.from('profiles').select('tg_chat_id').eq('id', r.user_id).maybeSingle();
  const to = u?.tg_chat_id ?? r.payer_chat;
  if (!to) return { sent: 0 };
  if (r.status === 'approved') {
    const { data: subs } = await db.from('subscriptions').select('grade,paid_until').eq('user_id', r.user_id).in('grade', r.grades);
    const lines = (subs ?? []).map((s) => `${s.grade}-сынып: ${s.paid_until.split('-').reverse().join('.')} дейін`).join('\n');
    await send(to, `✅ Төлем расталды. Жазылым ашылды:\n${lines}`, { text: 'Сабақтарды ашу', url: SITE + '/app' });
  } else {
    await send(to, `Өтінім №${id.slice(0, 8).toUpperCase()} расталмады. Сұрағыңыз болса, WhatsApp арқылы жазыңыз.`);
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
  const { data: people } = await db.from('profiles').select('id,full_name,tg_chat_id,variants').in('id', [...byUser.keys()]).not('tg_chat_id', 'is', null);
  const DIR: Record<string, string> = { zhmb: 'ЖМБ', kgb: 'ҚГБ' };
  let sent = 0;
  for (const p of people ?? []) {
    const ss = byUser.get(p.id)!.sort((a, b) => a.grade - b.grade);
    const paid = ss.filter((s) => !s.trial);
    const use = paid.length ? paid : ss;
    const blocks = use.flatMap((s) => {
      const mine: string[] = p.variants ?? [];
      const vs: string[] = mine.filter((v: string) => (v === String(s.grade) || v.startsWith(s.grade + '-')) && lessons.some((l) => l.v === v));
      return vs.map((v) => {
        const [, d, h] = v.split('-');
        const title = `<b>${s.grade}-сынып${d ? ` · ${DIR[d]} · ${h} сағ.` : ''}</b>`;
        const ls = lessons.filter((l) => l.v === v && l.date >= w.from && l.date <= w.to);
        if (!ls.length) return `${title}\nБұл аптада сабақ жоқ.`;
        return `${title}\n` + ls.map((l) => `• ${dm(l.date)} — ${esc(l.topic)}`).join('\n');
      });
    }).join('\n\n');
    if (!blocks) continue;
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
    const r = await tg('setWebhook', { url: hook, secret_token: await secret(), allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
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
