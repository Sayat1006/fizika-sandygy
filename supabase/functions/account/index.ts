// Сабақтас: аккаунт әрекеттері.
// {action:'signup', ...}: email растаусыз тіркелу (хат жіберілмейді, шектеу жоқ).
// {action:'reset_password', user_id}: әкімші мұғалімге жаңа құпиясөз береді.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
const clean = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

async function signup(b: any) {
  const email = clean(b.email, 120).toLowerCase();
  const password = String(b.password ?? '');
  const full_name = clean(b.full_name, 120), phone = clean(b.phone, 40), school = clean(b.school, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'Email дұрыс емес.' }, 400);
  if (password.length < 6 || password.length > 72) return json({ error: 'Құпиясөз кемінде 6 таңба болуы керек.' }, 400);
  if (full_name.length < 3) return json({ error: 'Аты-жөніңізді жазыңыз.' }, 400);
  if (phone.replace(/\D/g, '').length < 10) return json({ error: 'Телефон нөмірін толық жазыңыз.' }, 400);
  if (b.consent !== true) return json({ error: 'Оферта мен құпиялылық саясатына келісім қажет.' }, 400);
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since);
  if ((count ?? 0) > 200) return json({ error: 'Қазір тіркелу көп. Бірнеше минуттан соң қайталаңыз.' }, 429);
  const { error } = await db.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name, phone, school, consent: 'true' },
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return json({ error: 'Бұл email тіркелген. «Кіру» бөлімін қолданыңыз.' }, 409);
    console.error(error);
    return json({ error: 'Тіркелу мүмкін болмады. Кейінірек қайталаңыз.' }, 500);
  }
  return json({ ok: true });
}

function newPassword() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const r = crypto.getRandomValues(new Uint8Array(8));
  return [...r].map((x) => abc[x % abc.length]).join('');
}

async function resetPassword(req: Request, b: any) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  const { data: me } = await db.auth.getUser(token);
  if (!me?.user) return json({ error: 'Қайта кіріңіз.' }, 401);
  const { data: p } = await db.from('profiles').select('is_admin').eq('id', me.user.id).maybeSingle();
  if (!p?.is_admin) return json({ error: 'Тек әкімшіге рұқсат.' }, 403);
  if (typeof b.user_id !== 'string') return json({ error: 'Мұғалім таңдалмаған.' }, 400);
  const pw = newPassword();
  const { error } = await db.auth.admin.updateUserById(b.user_id, { password: pw });
  if (error) return json({ error: 'Құпиясөзді өзгерту мүмкін болмады.' }, 500);
  return json({ ok: true, password: pw });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const b = await req.json();
    if (b?.action === 'signup') return await signup(b);
    if (b?.action === 'reset_password') return await resetPassword(req, b);
    return json({ error: 'unknown' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: 'Сервер қатесі.' }, 500);
  }
});
