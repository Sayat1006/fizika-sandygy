import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from '../lib/account';
import { CONFIG } from '../lib/config';
import { accountFn, authError, sb } from '../lib/data';
import { Note, PasswordInput, Segmented } from '../ui/kit';

const toEmail = (login: string) => { const l = login.trim().toLowerCase(); return l.includes('@') ? l : l + CONFIG.loginDomain; };

/** Кіру және тіркелу (кабинетке кірмеген мұғалім /app бетінде осыны көреді) */
export function AuthView() {
  const [tab, setTab] = useState<'login' | 'signup'>(() => (/[?&]signup/.test(location.search) ? 'signup' : 'login'));
  return (
    <section className="auth page-enter">
      <div className="auth__head">
        <h1 className="t-title">Мұғалім кабинеті</h1>
        <p>ҚМЖ, презентация, жұмыс парағы және интерактивті тақта. Тіркелгеннен кейін 3 күн бәрі тегін.</p>
      </div>
      {CONFIG.googleLogin && <Google />}
      <Segmented label="Кіру немесе тіркелу" large value={tab} onChange={setTab} items={[{ value: 'login', label: 'Кіру' }, { value: 'signup', label: 'Тіркелу' }]} />
      {tab === 'login' ? <Login /> : <Signup />}
    </section>
  );
}

function Login() {
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: React.ReactNode } | null>(null);
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setMsg(null); setBusy(true);
    const f = new FormData(e.currentTarget);
    const { error } = await sb.auth.signInWithPassword({ email: toEmail(String(f.get('login'))), password: String(f.get('password')) });
    setBusy(false);
    if (error) setMsg({ kind: 'err', text: authError(error) });
  };
  const forgot = () => {
    const t = `Сәлеметсіз бе! Сабақтас кабинетінің құпиясөзін ұмытып қалдым. Email: ${login.trim()}`;
    setMsg({ kind: 'ok', text: <>Жаңа құпиясөз алу үшін WhatsApp-қа жазыңыз: <a href={`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`} target="_blank" rel="noopener">{CONFIG.whatsappShow}</a></> });
  };
  return (
    <form className="form" onSubmit={submit}>
      <label className="field"><span>Email немесе логин</span><input className="input" name="login" autoComplete="username" autoCapitalize="off" spellCheck={false} required value={login} onChange={(e) => setLogin(e.target.value)} /></label>
      <label className="field"><span>Құпиясөз</span><PasswordInput name="password" autoComplete="current-password" required minLength={6} /></label>
      {msg && <Note kind={msg.kind}>{msg.text}</Note>}
      <button className="btn btn--lg btn--primary btn--block" type="submit" disabled={busy}>Кіру</button>
      <button className="link" type="button" style={{ justifySelf: 'center' }} onClick={forgot}>Құпиясөзді ұмыттым</button>
    </form>
  );
}

function Signup() {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setMsg(''); setBusy(true);
    const f = new FormData(e.currentTarget), email = String(f.get('email')).trim(), password = String(f.get('password'));
    try {
      await accountFn({ action: 'signup', email, password, full_name: String(f.get('name')).trim(), phone: String(f.get('phone')).trim(), school: String(f.get('school')).trim(), consent: f.get('consent') === 'on' });
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setMsg(authError(error));
    } catch (err) { setMsg((err as Error).message || 'Желі қатесі. Қайталап көріңіз.'); }
    setBusy(false);
  };
  return (
    <form className="form" onSubmit={submit}>
      <label className="field"><span>Аты-жөні</span><input className="input" name="name" autoComplete="name" required /></label>
      <label className="field"><span>Телефон (WhatsApp)</span><input className="input" name="phone" type="tel" autoComplete="tel" placeholder="+7 7__ ___ __ __" required /></label>
      <label className="field"><span>Мектеп, қала</span><input className="input" name="school" placeholder="№12 мектеп-гимназия, Шымкент" /></label>
      <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Құпиясөз</span><PasswordInput name="password" autoComplete="new-password" required minLength={6} /><span className="hint">Кемінде 6 таңба</span></label>
      <label className="check"><input type="checkbox" name="consent" required /><span><Link to="/oferta" target="_blank">Оферта</Link> шарттарымен келісемін және дербес деректерімді <Link to="/privacy" target="_blank">құпиялылық саясатына</Link> сәйкес өңдеуге келісім беремін.</span></label>
      <Note>{msg}</Note>
      <button className="btn btn--lg btn--primary btn--block" type="submit" disabled={busy}>Тіркелу</button>
    </form>
  );
}

function Google() {
  const [msg, setMsg] = useState('');
  const go = async () => {
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/app' } });
    if (error) setMsg('Google арқылы кіру әзірге қосылмаған. Email арқылы кіріңіз.');
  };
  return (
    <>
      <button className="gbtn" type="button" onClick={go}>
        <svg viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
        Google арқылы кіру
      </button>
      <p className="hint" style={{ textAlign: 'center' }}>Кіру арқылы <Link to="/oferta" target="_blank">офертамен</Link> және <Link to="/privacy" target="_blank">құпиялылық саясатымен</Link> келісесіз.</p>
      <Note>{msg}</Note>
      <div className="or">немесе</div>
    </>
  );
}

/** «Құпиясөзді жаңарту» сілтемесімен келгенде */
export function RecoverView() {
  const { endRecovery } = useAccount();
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string } | null>(null);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await sb.auth.updateUser({ password: String(new FormData(e.currentTarget).get('password')) });
    if (error) return setMsg({ kind: 'err', text: authError(error) });
    setMsg({ kind: 'ok', text: 'Құпиясөз жаңартылды.' });
    setTimeout(endRecovery, 900);
  };
  return (
    <section className="auth page-enter">
      <div className="auth__head"><h1 className="t-title">Жаңа құпиясөз</h1></div>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Жаңа құпиясөз</span><PasswordInput name="password" autoComplete="new-password" required minLength={6} /></label>
        {msg && <Note kind={msg.kind}>{msg.text}</Note>}
        <button className="btn btn--lg btn--primary btn--block" type="submit">Сақтау</button>
      </form>
    </section>
  );
}
