import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useAccount } from '../../lib/account';
import { CONFIG, week } from '../../lib/config';
import { dayPart, firstName, loadLessons, type Lesson } from '../../lib/data';
import { IcCard, IcList, IcSend, IcUser } from '../../ui/icons';
import { useToast } from '../../ui/kit';
import { AccountNav, Footer } from '../../ui/Layout';
import { AuthView, RecoverView } from '../Auth';
import Lessons from './Lessons';
import { useMode } from '../../lib/mode';
import ClassMode from './ClassMode';
import LessonPane, { morph, useWide } from './LessonPane';
import { ClassesSheet, ProfileSheet, SubscribeSheet, TelegramSheet, ViewerSheet } from './Sheets';

const Logo3D = lazy(() => import('../../ui/Logo3D'));

/** /app — мұғалім кабинеті. Кірмеген болса — кіру/тіркелу. */
export default function Cabinet() {
  const { ready, session, recovering } = useAccount();
  return (
    <div className="shell">
      <AccountNav />
      <main className="container">
        {!ready ? <Skeleton /> : recovering ? <RecoverView /> : !session ? <AuthView /> : <Teacher />}
      </main>
      <Footer />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="cab" aria-label="Жүктелуде">
      <div className="skel" style={{ width: 88, height: 88, borderRadius: 24, margin: '28px auto 12px' }} />
      <div className="skel" style={{ height: 44, maxWidth: 420, margin: '0 auto 40px' }} />
      <div className="skel" style={{ height: 44, marginBottom: 12 }} />
      <div className="skel" style={{ height: 140, marginBottom: 12 }} />
      <div className="skel" style={{ height: 140 }} />
    </div>
  );
}

type SheetId = 'subscribe' | 'classes' | 'tg' | 'profile' | null;

function Teacher() {
  const { profile, subs } = useAccount();
  const toast = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [preset, setPreset] = useState<number | null>(null);
  const [viewing, setViewing] = useState<Lesson | null>(null);
  const wide = useWide();
  const mode = useMode(); // «Сабақтан тыс» / «Сабақ барысы» — жоғарғы жолақтағы ауыстырғыш
  const [sel, setSel] = useState<Lesson | null>(null);
  const [tab, setTab] = useState<'pres' | 'kmzh'>('pres');
  const select = (l: Lesson | null, auto?: boolean) => { if (auto || !sel) setSel(l); else if (l && (l.v !== sel.v || l.n !== sel.n)) morph(() => setSel(l)); };
  const view = (l: Lesson) => { if (!wide) return setViewing(l); morph(() => { setSel(l); setTab('kmzh'); }); };
  useEffect(() => { loadLessons().then(setLessons); }, []);
  const ready = useMemo(() => new Set(lessons.map((l) => l.v)), [lessons]);

  // Сыныптар бекітілмеген болса, бір рет ұсынамыз
  useEffect(() => {
    if (!profile || profile.classes_set) return;
    let asked = false; try { asked = !!sessionStorage.getItem('fs-cls-asked'); sessionStorage.setItem('fs-cls-asked', '1'); } catch { /* */ }
    if (!asked) { const t = setTimeout(() => setSheet('classes'), 900); return () => clearTimeout(t); }
  }, [profile?.classes_set]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return <Skeleton />;
  const today = week().today;
  const paid = subs.filter((x) => !x.trial && x.paid_until >= today);
  const trial = subs.filter((x) => x.trial && x.paid_until >= today);
  const left = trial.length && !paid.length ? Math.max(0, Math.round((Date.parse(trial[0].paid_until) - Date.parse(today)) / 864e5)) : null;
  const name = firstName(profile.full_name);
  const lock = (g: number) => { setViewing(null); setPreset(g); setSheet('subscribe'); toast('Материалдар жазылыммен ашылады'); };
  const open = (id: SheetId) => { setPreset(null); setSheet(id); };
  const okS = subs.filter((x) => x.paid_until >= today);
  const DIRN: Record<string, string> = { zhmb: 'ЖМБ', kgb: 'ҚГБ' };
  const vs = profile.variants || [];
  const clsSum = [[7, 8, 9].filter((g) => vs.includes(String(g))).join(', ') + ([7, 8, 9].some((g) => vs.includes(String(g))) ? '-сынып' : ''),
    ...vs.filter((v) => v.includes('-')).map((v) => { const [g, d, h] = v.split('-'); return `${g} ${DIRN[d]} ${h} сағ.`; })].filter(Boolean).join(' · ');

  if (mode === 'class') return (
    <div className="cab cab--class">
      <ClassMode lessons={lessons} onLock={lock} />
      <SubscribeSheet open={sheet === 'subscribe'} onClose={() => setSheet(null)} preset={preset} />
    </div>
  );
  return (
    <div className={`cab${wide ? ' cab--split' : ''}`}>
      <div className="cab__main">
      <header className="hello">
        <Suspense fallback={<div style={{ width: 88, height: 88 }} />}><Logo3D /></Suspense>
        <h1 className="t-title rise rise-1">Қайырлы {dayPart()}{name ? `, ${name}` : ''}!</h1>
        {left !== null && (
          <div className="hello__trial rise rise-2">
            <span className="chip chip--warn"><i className="dot" />{left > 0 ? `Тегін сынақ: тағы ${left} күн` : 'Тегін сынақ бүгін аяқталады'}</span>
            <button className="btn btn--sm btn--primary" type="button" onClick={() => open('subscribe')}>Жазылу</button>
          </div>
        )}
        {!(profile.phone || '').trim() && (
          <div className="note note--info hello__nudge">Телефон нөміріңізді жазыңыз. <button className="link" type="button" onClick={() => open('profile')}>Толтыру</button></div>
        )}
      </header>

      <Lessons lessons={lessons} onView={view} onLock={lock} onClasses={() => open('classes')} sel={wide && sel ? `${sel.v}|${sel.n}` : null} onSelect={wide ? select : undefined} />

      <section className="settings">
        <h2 className="t-headline">Басқару</h2>
        <div className="group">
          <button className="group__row" type="button" onClick={() => open('subscribe')}><span className="group__ic" style={{ background: '#0071E3' }}><IcCard /></span><span className="group__t">Жазылым</span><span className="group__v">{okS.length ? (okS.some((x) => !x.trial) ? `${okS.filter((x) => !x.trial).length} сынып белсенді` : 'Тегін сынақ') : 'Жазылым жоқ'}</span></button>
          <button className="group__row" type="button" onClick={() => open('classes')}><span className="group__ic" style={{ background: '#5E5CE6' }}><IcList /></span><span className="group__t">Менің сыныптарым</span><span className="group__v">{profile.classes_set ? clsSum || 'Таңдалмаған' : 'Бекітілмеген'}</span></button>
          {CONFIG.telegramBot && <button className="group__row" type="button" onClick={() => open('tg')}><span className="group__ic" style={{ background: '#229ED9' }}><IcSend /></span><span className="group__t">Telegram</span><span className="group__v">{profile.tg_chat_id ? 'Қосылған' : 'Қосылмаған'}</span></button>}
          <button className="group__row" type="button" onClick={() => open('profile')}><span className="group__ic" style={{ background: '#8E8E93' }}><IcUser /></span><span className="group__t">Профиль</span><span className="group__v">{profile.full_name}</span></button>
        </div>
      </section>
      </div>
      {wide && <LessonPane lesson={sel} onLock={lock} tab={tab} setTab={setTab} />}

      <ViewerSheet lesson={viewing} onClose={() => setViewing(null)} onLock={lock} />
      <SubscribeSheet open={sheet === 'subscribe'} onClose={() => setSheet(null)} preset={preset} />
      <ClassesSheet open={sheet === 'classes'} onClose={() => setSheet(null)} ready={ready} />
      <TelegramSheet open={sheet === 'tg'} onClose={() => setSheet(null)} />
      <ProfileSheet open={sheet === 'profile'} onClose={() => setSheet(null)} />
    </div>
  );
}
