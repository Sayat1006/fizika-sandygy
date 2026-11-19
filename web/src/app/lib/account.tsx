import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { week } from './config';
import { sb, type PayRequest, type Profile, type Sub } from './data';

/** Кірген мұғалімнің деректері: профиль, жазылымдар, өтінімдер, бұрын жүктелген файлдар */
interface Account {
  ready: boolean;
  session: Session | null;
  /** «Құпиясөзді жаңарту» сілтемесімен келгенде true */
  recovering: boolean;
  profile: Profile | null;
  subs: Sub[];
  reqs: PayRequest[];
  got: Set<string>;
  reload: () => Promise<void>;
  patchProfile: (p: Partial<Profile>) => void;
  markGot: (key: string) => void;
  endRecovery: () => void;
  /** Сыныптың белсенді жазылымы (тегін сынақ та есептеледі) */
  subOf: (grade: number) => Sub | undefined;
}

/** Интернет жоқта токен жаңартылмай, сессия бос келуі мүмкін — сақталған сабақтарды ашу үшін соңғы сессияны оқимыз */
function offlineSession(): Session | null {
  if (navigator.onLine) return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (/^sb-.*-auth-token$/.test(k)) { const j = JSON.parse(localStorage.getItem(k) || 'null'); const s = j?.currentSession || j; if (s?.user?.id) return s as Session; }
    }
  } catch { /* */ }
  return null;
}

const Ctx = createContext<Account | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [recovering, setRecovering] = useState(() => /type=recovery/.test(location.hash));
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [reqs, setReqs] = useState<PayRequest[]>([]);
  const [got, setGot] = useState<Set<string>>(new Set());

  const load = useCallback(async (s: Session | null) => {
    if (!s) { setProfile(null); setSubs([]); setReqs([]); setGot(new Set()); return; }
    const uid = s.user.id;
    const [p, su, r, d] = await Promise.all([
      sb.from('profiles').select('*').eq('id', uid).single(),
      sb.from('subscriptions').select('grade,paid_until,trial').eq('user_id', uid),
      sb.from('payment_requests').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
      sb.from('downloads').select('variant,grade,n,kind').eq('user_id', uid).limit(2000),
    ]);
    // интернет жоқта (сыныптағы тақта) — соңғы сақталған профиль мен жазылымдар
    const ck = 'sbq-acct-' + uid, net = !p.error && !su.error;
    let old: { p?: Profile; s?: Sub[] } = {};
    try { if (net) localStorage.setItem(ck, JSON.stringify({ p: p.data, s: su.data })); else old = JSON.parse(localStorage.getItem(ck) || '{}'); } catch { /* */ }
    setProfile((p.data as Profile) || old.p || { id: uid, full_name: '', phone: '', school: '' });
    setSubs((su.data as Sub[]) || old.s || []);
    setReqs((r.data as PayRequest[]) || []);
    setGot(new Set(((d.data as { variant: string | null; grade: number; n: number; kind: string }[]) || []).map((x) => `${x.variant || x.grade}|${x.n}|${x.kind}`)));
  }, []);

  useEffect(() => {
    let alive = true;
    sb.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      const s = data.session || offlineSession();
      setSession(s);
      try { await load(s); } finally { if (alive) setReady(true); }
    });
    const { data } = sb.auth.onAuthStateChange((ev, s) => {
      if (ev === 'PASSWORD_RECOVERY') setRecovering(true);
      if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT' || ev === 'USER_UPDATED') {
        setSession(s);
        void load(s);
      }
      if (ev === 'TOKEN_REFRESHED') setSession(s);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [load]);

  const value = useMemo<Account>(() => {
    const today = week().today;
    return {
      ready, session, recovering, profile, subs, reqs, got,
      reload: () => load(session),
      patchProfile: (x) => setProfile((p) => (p ? { ...p, ...x } : p)),
      markGot: (k) => setGot((g) => new Set(g).add(k)),
      endRecovery: () => { setRecovering(false); history.replaceState(null, '', '/app'); },
      subOf: (g) => subs.find((s) => s.grade === g && s.paid_until >= today),
    };
  }, [ready, session, recovering, profile, subs, reqs, got, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AccountProvider жоқ');
  return v;
}
