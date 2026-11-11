import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAccount } from '../lib/account';
import { CONFIG, VARIANT, week } from '../lib/config';
import { KIND_LABEL, accountFn, dmy, money, sb, type DownloadRow, type Lesson, type PayRequest, type Profile, type Sub, loadLessons } from '../lib/data';
import { Note, PasswordInput, Segmented, useToast } from '../ui/kit';
import { AccountNav, Footer } from '../ui/Layout';

const tm = (s: string) => new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
type Row = DownloadRow & { user_id: string; created_at: string };

/** /admin — төлемдерді растау, мұғалімдер, есеп, Telegram бот, жүктеулер */
export default function Admin() {
  const { ready, session, profile } = useAccount();
  return (
    <div className="shell">
      <AccountNav />
      <main className="container adm">
        {!ready || (session && !profile) ? <div className="skel" style={{ height: 300, marginTop: 48 }} />
          : !session ? <AdminLogin />
          : !profile?.is_admin ? <div className="empty" style={{ marginTop: 48 }}>Бұл аккаунтта әкімші құқығы жоқ.</div>
          : <Dashboard />}
      </main>
      <Footer />
    </div>
  );
}

function AdminLogin() {
  const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setMsg('');
    const f = new FormData(e.currentTarget), u = String(f.get('u')).trim().toLowerCase();
    const { error } = await sb.auth.signInWithPassword({ email: u.includes('@') ? u : u + CONFIG.loginDomain, password: String(f.get('p')) });
    if (error) setMsg(/Invalid login/i.test(error.message) ? 'Логин немесе құпиясөз қате.' : 'Қате: ' + error.message);
  };
  return (
    <section className="auth page-enter">
      <div className="auth__head"><h1 className="t-title">Әкімші панелі</h1></div>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Логин</span><input className="input" name="u" autoComplete="username" autoCapitalize="off" spellCheck={false} required /></label>
        <label className="field"><span>Құпиясөз</span><PasswordInput name="p" autoComplete="current-password" required /></label>
        <Note>{msg}</Note>
        <button className="btn btn--lg btn--primary btn--block" type="submit">Кіру</button>
      </form>
    </section>
  );
}

function Dashboard() {
  const { session } = useAccount();
  const toast = useToast();
  const [P, setP] = useState<Profile[]>([]);
  const [S, setS] = useState<(Sub & { user_id: string })[]>([]);
  const [R, setR] = useState<PayRequest[]>([]);
  const [D30, setD30] = useState<Row[]>([]);
  const [L, setL] = useState<Record<string, Lesson>>({});
  const [days, setDays] = useState<7 | 30>(7);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [pw, setPw] = useState<Record<string, string>>({});
  const [bot, setBot] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, s, r, d, b] = await Promise.all([
        sb.from('profiles').select('*').order('created_at', { ascending: false }),
        sb.from('subscriptions').select('*'),
        sb.from('payment_requests').select('*').order('created_at', { ascending: true }),
        sb.from('downloads').select('*').gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString()).order('created_at', { ascending: false }).limit(5000),
        sb.rpc('bot_token_set'),
      ]);
      if (p.error) throw p.error;
      setP(p.data as Profile[]); setS((s.data as never) || []); setR((r.data as PayRequest[]) || []); setD30((d.data as Row[]) || []); setBot(!!b.data);
    } catch (e) { toast('Жүктеу қатесі: ' + (e as Error).message); }
  }, [toast]);
  useEffect(() => { void load(); loadLessons().then((ls) => setL(Object.fromEntries(ls.map((x) => [x.v + ':' + x.n, x])))); }, [load]);

  const prof = useMemo(() => { const m = new Map(P.map((x) => [x.id, x])); return (id: string) => m.get(id) || ({} as Profile); }, [P]);
  const today = week().today;
  const since7 = new Date(Date.now() - 7 * 864e5).toISOString();
  const D = D30.filter((x) => x.created_at >= since7);
  const pend = R.filter((x) => x.status === 'pending');
  const active = new Set(S.filter((x) => !x.trial && x.paid_until >= today).map((x) => x.user_id));
  const me = P.find((x) => x.id === session?.user.id);

  // есеп
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const dl = D30.filter((x) => x.created_at >= since && !prof(x.user_id).is_admin);
  const appr = R.filter((x) => x.status === 'approved' && x.decided_at && x.decided_at >= since);
  const funnel: [string, number][] = [
    ['Жаңа тіркелген', P.filter((x) => !x.is_admin && (x.created_at || '') >= since).length],
    ['ҚМЖ жүктегендер', new Set(dl.filter((x) => x.kind === 'kmzh').map((x) => x.user_id)).size],
    ['Слайд / парақ жүктегендер', new Set(dl.filter((x) => x.kind !== 'kmzh').map((x) => x.user_id)).size],
    ['Төлеп жазылғандар', new Set(appr.map((x) => x.user_id)).size],
  ];
  const max = Math.max(1, ...funnel.map((x) => x[1]));

  const decide = async (id: string, ok: boolean) => {
    setBusy(id);
    const { error } = await sb.rpc('decide_request', { p_id: id, p_approve: ok });
    setBusy(null);
    if (error) return toast('Қате: ' + error.message);
    toast(ok ? 'Жазылым ашылды' : 'Өтінім жабылды'); void load();
  };
  const resetPw = async (u: Profile) => {
    setBusy(u.id);
    try { const j = await accountFn({ action: 'reset_password', user_id: u.id }, session); setPw((x) => ({ ...x, [u.id]: j.password })); }
    catch (e) { toast((e as Error).message); }
    setBusy(null);
  };
  const tgLink = async () => {
    const w = window.open('', '_blank');
    const { data: code, error } = await sb.rpc('tg_link_code');
    if (error) { w?.close(); return toast('Қате: ' + error.message); }
    const url = `https://t.me/${CONFIG.telegramBot}?start=${code}`;
    if (w) w.location.href = url; else location.href = url;
    toast('Telegram-да «Start» басыңыз, сосын «Жаңарту» батырмасын басыңыз.');
  };
  const saveBot = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget, tok = String(new FormData(form).get('tok')).trim(); if (!tok) return toast('Токенді енгізіңіз');
    const { error } = await sb.rpc('set_bot_token', { p_token: tok });
    if (error) return toast('Қате: ' + error.message);
    form.reset();
    try {
      const j = await fetch(CONFIG.supabaseUrl + '/functions/v1/telegram?setup=1').then((r) => r.json());
      toast(j.webhook?.ok ? `Бот қосылды: @${j.bot}` : 'Токен сақталды, бірақ бот жауап бермеді. Токенді тексеріңіз.');
    } catch { toast('Токен сақталды. Ботты тексеру мүмкін болмады.'); }
    void load();
  };

  const ql = q.trim().toLowerCase();
  const users = P.filter((u) => !ql || [u.full_name, u.phone, u.email, u.school].join(' ').toLowerCase().includes(ql));
  const per: Record<string, number> = {}; D.forEach((x) => { per[x.user_id] = (per[x.user_id] || 0) + 1; });

  return (
    <div className="page-enter">
      <div className="adm__head"><h1 className="t-title">Әкімші</h1><button className="btn btn--sm" type="button" onClick={() => void load()}>Жаңарту</button></div>
      <div className="kpis">
        <div className="kpi"><b>{pend.length}</b><span>төлем күтілуде</span></div>
        <div className="kpi"><b>{active.size}</b><span>төлеген мұғалім</span></div>
        <div className="kpi"><b>{P.length}</b><span>тіркелген</span></div>
        <div className="kpi"><b>{D.length}</b><span>жүктеу, 7 күн</span></div>
      </div>

      <section className="adm__sec">
        <div className="adm__row"><h2 className="t-headline">Есеп</h2><Segmented label="Кезең" value={days} onChange={setDays} items={[{ value: 7, label: '7 күн' }, { value: 30, label: '30 күн' }]} /></div>
        <div className="funnel">
          {funnel.map(([t, n]) => <div key={t} className="fr"><span>{t}</span><div className="fr__bar"><i style={{ width: `${Math.round(n / max * 100)}%` }} /></div><b className="tabular">{n}</b></div>)}
          <div className="fr fr--money"><span>Түскен ақша</span><b className="tabular">{money(appr.reduce((a, x) => a + x.amount, 0))}</b></div>
          <p className="hint">ҚМЖ жүктеу саны: {dl.filter((x) => x.kind === 'kmzh').length}, слайд мен парақ: {dl.filter((x) => x.kind !== 'kmzh').length}.</p>
        </div>
      </section>

      <section className="adm__sec">
        <h2 className="t-headline">Төлем күтіп тұрған өтінімдер</h2>
        <p className="hint">Kaspi-де ақша түскенін тексеріп, «Растау» басыңыз. Жазылым бірден ашылады (бар жазылымға мерзім қосылады).</p>
        {pend.length ? (
          <div className="tbl"><table>
            <thead><tr><th>Күні</th><th>Мұғалім</th><th>Сынып</th><th>Мерзім</th><th>Сома</th><th>Код</th><th /></tr></thead>
            <tbody>{pend.map((r) => { const u = prof(r.user_id); return (
              <tr key={r.id}>
                <td className="tabular">{tm(r.created_at)}</td>
                <td>{u.full_name || '—'}<small>{u.phone} · {u.email}</small><small>{u.school}</small></td>
                <td>{r.grades.join(', ')}</td><td>{r.plan === 'month' ? '1 ай' : '1 жыл'}</td><td className="tabular"><b>{money(r.amount)}</b></td>
                <td className="tabular">{r.id.slice(0, 8).toUpperCase()}</td>
                <td><div className="adm__acts"><button className="btn btn--sm btn--primary" type="button" disabled={busy === r.id} onClick={() => decide(r.id, true)}>Растау</button><button className="btn btn--sm btn--danger" type="button" disabled={busy === r.id} onClick={() => decide(r.id, false)}>Бас тарту</button></div></td>
              </tr>); })}</tbody>
          </table></div>
        ) : <div className="empty">Күтіп тұрған өтінім жоқ.</div>}
      </section>

      <section className="adm__sec">
        <h2 className="t-headline">Мұғалімдер</h2>
        <p className="hint">Мұғалім құпиясөзін ұмытса, «Жаңа құпиясөз» басыңыз: жаңа құпиясөз шығады және оны WhatsApp арқылы жіберу сілтемесі пайда болады.</p>
        <label className="search"><input type="search" placeholder="Аты, телефон, email бойынша іздеу" aria-label="Іздеу" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        {users.length ? (
          <div className="tbl"><table>
            <thead><tr><th>Мұғалім</th><th>Мектеп</th><th>Жазылым</th><th>Тіркелген</th><th /></tr></thead>
            <tbody>{users.map((u) => {
              const ss = S.filter((x) => x.user_id === u.id).sort((a, b) => a.grade - b.grade), paid = ss.filter((x) => !x.trial), trial = ss.filter((x) => x.trial);
              const phone = (u.phone || '').replace(/\D/g, '').replace(/^8/, '7');
              const text = pw[u.id] && `Сәлеметсіз бе! Сабақтас кабинетіне кіру: ${CONFIG.siteUrl}/app\nEmail: ${u.email}\nЖаңа құпиясөз: ${pw[u.id]}\nКіргеннен кейін құпиясөзді сақтап қойыңыз.`;
              return (
                <tr key={u.id}>
                  <td>{u.full_name || '—'}{u.is_admin && <> <span className="chip">әкімші</span></>}{u.tg_chat_id ? <> <span className="chip">Telegram</span></> : null}<small>{u.phone} · {u.email}</small></td>
                  <td>{u.school}</td>
                  <td><div className="adm__chips">
                    {paid.map((x) => <span key={x.grade} className={`chip chip--${x.paid_until >= today ? 'ok' : 'err'}`}>{x.grade}: {dmy(x.paid_until)}</span>)}
                    {trial.length > 0 && <span className={`chip${trial[0].paid_until >= today ? ' chip--warn' : ''}`}>сынақ {trial.map((x) => x.grade).join(',')}: {dmy(trial[0].paid_until)}</span>}
                    {!ss.length && <span className="chip">жоқ</span>}
                  </div></td>
                  <td className="tabular">{u.created_at ? dmy(u.created_at) : ''}</td>
                  <td>{!u.is_admin && (pw[u.id]
                    ? <div className="adm__acts"><span className="chip chip--warn" style={{ userSelect: 'all' }}>{pw[u.id]}</span>{phone && <a className="link" target="_blank" rel="noopener" href={`https://wa.me/${phone}?text=${encodeURIComponent(text || '')}`}>WhatsApp-қа жіберу</a>}</div>
                    : <button className="link" type="button" disabled={busy === u.id} onClick={() => resetPw(u)}>Жаңа құпиясөз</button>)}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <div className="empty">Мұғалім табылмады.</div>}
      </section>

      <section className="adm__sec">
        <h2 className="t-headline">Telegram бот</h2>
        <div className="group adm__bot">
          <p className="hint">{bot === null ? '…' : bot ? 'Бот қосылған. Токенді ауыстыру үшін ғана жаңасын енгізіңіз.' : 'Бот әлі қосылмаған.'}</p>
          {bot && <div className="adm__acts"><button className="btn btn--sm" type="button" onClick={tgLink}>{me?.tg_chat_id ? 'Қайта байланыстыру' : 'Telegram-ымды байланыстыру'}</button><span className="hint">{me?.tg_chat_id ? 'Байланыстырылған: жаңа өтінім түскенде хабар келеді.' : 'Байланыстырылмаған.'}</span></div>}
          <form className="form" onSubmit={saveBot}>
            <label className="field"><span>BotFather берген токен</span><input className="input" name="tok" type="password" autoComplete="off" placeholder="123456789:AA..." /></label>
            <button className="btn btn--sm btn--primary" type="submit" style={{ justifySelf: 'start' }}>Сақтап, ботты қосу</button>
          </form>
          <p className="hint">Токен жабық сақталады, оны сайт пен бот қана оқиды.</p>
        </div>
      </section>

      <section className="adm__sec">
        <h2 className="t-headline">Соңғы жүктеулер</h2>
        <p className="hint">Сары жол: бір мұғалім 7 күнде 40-тан көп файл жүктеген. Бұл материалды таратып жүргенін білдіруі мүмкін.</p>
        {D.length ? (
          <div className="tbl"><table>
            <thead><tr><th>Уақыт</th><th>Мұғалім</th><th>Сабақ</th><th>Файл</th><th>7 күнде</th></tr></thead>
            <tbody>{D.slice(0, 200).map((x, k) => { const u = prof(x.user_id), vk = x.variant || String(x.grade), l = L[vk + ':' + x.n], vv = VARIANT[vk]; return (
              <tr key={k} className={per[x.user_id] > 40 ? 'flag' : ''}>
                <td className="tabular">{tm(x.created_at)}</td><td>{u.full_name || '—'}<small>{u.phone}</small></td>
                <td>{x.grade}-сынып{vv?.dir ? ' · ' + vv.short : ''}, №{l?.disp || x.n}<small>{l?.topic}</small></td>
                <td>{KIND_LABEL[x.kind]}</td><td className="tabular">{per[x.user_id]}</td>
              </tr>); })}</tbody>
          </table></div>
        ) : <div className="empty">Соңғы 7 күнде жүктеу болмады.</div>}
      </section>
    </div>
  );
}
