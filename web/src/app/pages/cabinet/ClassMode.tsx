import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from '../../lib/account';
import { GRADES, VARIANT, week } from '../../lib/config';
import { dm, type Lesson } from '../../lib/data';
import { prepareLesson, swReady, useOnline } from '../../lib/offline';
import { IcBoard, IcLock, IcSearch } from '../../ui/icons';
import { Segmented } from '../../ui/kit';

/* «Сабақ барысы» режимі: интерактивті тақтаға арналған қарапайым экран.
   Тек бүгінгі (не келесі) сабақтар — үлкен тақталар, бір басқанда тақта ашылады.
   Жүктеу, жазылым, баптаулар көрінбейді. */

const DOW_FULL = ['дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі', 'жексенбі'];
const MON = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
const dowOf = (d: string) => DOW_FULL[((Date.parse(d) / 864e5 + 3) % 7 + 7) % 7];
const longDate = (d: string) => `${+d.slice(8)} ${MON[+d.slice(5, 7) - 1]}, ${dowOf(d)}`;
const boardUrl = (l: Lesson) => `/board?v=${encodeURIComponent(l.v)}&n=${l.n}`;

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 15000); return () => clearInterval(i); }, []);
  return t.toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Almaty' });
}

export default function ClassMode({ lessons, onLock }: { lessons: Lesson[]; onLock: (g: number) => void }) {
  const { profile, subOf } = useAccount();
  const clock = useClock();
  const [pick, setPickS] = useState(false);
  const setPick = (b: boolean) => { setPickS(b); window.scrollTo(0, 0); };
  const [only, setOnly] = useState<number | null>(() => { try { return +(localStorage.getItem('fs-cm-g') || '') || null; } catch { return null; } });
  const w = week();
  const ready = useMemo(() => new Set(lessons.map((l) => l.v)), [lessons]);
  const mine = (profile?.variants || []).filter((v) => ready.has(v));
  const my = useMemo(() => lessons.filter((l) => mine.includes(l.v)), [lessons, mine.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const gradeOf = (l: Lesson) => VARIANT[l.v]?.grade || l.grade;
  const today = my.filter((l) => l.date === w.today);
  const nextDay = today.length ? null : my.map((l) => l.date).filter((d) => d > w.today).sort()[0] || null;
  const day = (today.length ? today : my.filter((l) => l.date === nextDay)).sort((x, y) => gradeOf(x) - gradeOf(y) || x.v.localeCompare(y.v) || x.n - y.n);
  const grades = [...new Set(day.map(gradeOf))];
  const g = only && grades.includes(only) ? only : null;
  const shown = g ? day.filter((l) => gradeOf(l) === g) : day;
  // Интернет үзілсе де ашылуы үшін: көрсетілген сабақтардың материалдарын алдын ала жүктеп қоямыз
  const online = useOnline();
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const dayKey = day.map((l) => l.v + l.n).join();
  useEffect(() => {
    if (!online) return;
    let off = false;
    void import('../Board'); // тақтаның коды мен стилі де кэшке түссін (интернет үзілсе де ашылуы үшін)
    (async () => { for (const l of day) { if (off) return; if (subOf(gradeOf(l)) && await prepareLesson(l) && !off) setSaved((s) => new Set(s).add(l.v + '|' + l.n)); } })();
    return () => { off = true; };
  }, [dayKey, online]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (x: number | null) => { setOnly(x); try { localStorage.setItem('fs-cm-g', x ? String(x) : ''); } catch { /* */ } };

  if (pick) return <Picker lessons={my} onBack={() => setPick(false)} onLock={onLock} />;
  return (
    <section className="cm">
      <header className="cm__head">
        <div><small>Бүгін</small><h1>{longDate(w.today)}</h1></div>
        <b className="cm__clock tabular">{clock}</b>
      </header>
      {!online && <p className="cm__net">Интернет жоқ. Алдын ала жүктелген сабақтар ашылады.</p>}
      {!today.length && <p className="cm__none">Бүгін сабақ жоқ.</p>}
      {day.length > 0 && (
        <div className="cm__bar">
          <h2>{today.length ? 'Бүгінгі сабақтар' : `Келесі сабақтар · ${longDate(nextDay!)}`}</h2>
          {grades.length > 1 && (
            <div className="cm__chips" role="group" aria-label="Сынып">
              <button type="button" aria-pressed={!g} onClick={() => choose(null)}>Барлығы</button>
              {grades.map((x) => <button key={x} type="button" aria-pressed={g === x} onClick={() => choose(x)}>{x} сынып</button>)}
            </div>
          )}
        </div>
      )}
      {!day.length && <p className="cm__sub">Жақын күндері сабақ жоқ.</p>}
      <div className="cm__tiles">
        {shown.map((l, i) => {
          const gr = gradeOf(l), ok = !!subOf(gr), first = i === 0;
          const body = (<>
            <span className="cm__g"><b>{gr}</b><small>сынып</small></span>
            <span className="cm__t"><small>№{l.disp}{gr >= 10 && VARIANT[l.v] ? ` · ${VARIANT[l.v].short}` : ''}{saved.has(l.v + '|' + l.n) && swReady() && <em className="cm__off" title="Интернет үзілсе де ашылады">✓ офлайн дайын</em>}</small><b>{l.topic}</b></span>
            <span className="cm__go">{ok ? <><IcBoard />Тақтада ашу</> : <><IcLock />Жазылым керек</>}</span>
          </>);
          const cls = `cm__tile rise${first ? ' cm__tile--first' : ''}${ok ? '' : ' cm__tile--lock'}`;
          return ok
            ? <Link key={l.v + l.n} to={boardUrl(l)} className={cls} style={{ animationDelay: `${i * 0.05}s` }}>{body}</Link>
            : <button key={l.v + l.n} type="button" className={cls} onClick={() => onLock(gr)}>{body}</button>;
        })}
      </div>
      <button type="button" className="cm__other" onClick={() => setPick(true)}><IcSearch />Басқа тақырыпты ашу</button>
    </section>
  );
}

/** Кез келген тақырыпты тақтада ашу: сынып → іздеу → тізім */
function Picker({ lessons, onBack, onLock }: { lessons: Lesson[]; onBack: () => void; onLock: (g: number) => void }) {
  const { subOf } = useAccount();
  const nav = useNavigate();
  const gradeOf = (l: Lesson) => VARIANT[l.v]?.grade || l.grade;
  const grades = GRADES.filter((g) => lessons.some((l) => gradeOf(l) === g));
  const [g, setG] = useState(grades[0]);
  const [q, setQ] = useState('');
  const s = q.trim().toLowerCase();
  const rows = lessons.filter((l) => gradeOf(l) === g && (!s || (l.disp + ' ' + l.topic).toLowerCase().includes(s)));
  const vs = [...new Set(rows.map((l) => l.v))];
  return (
    <section className="cm">
      <header className="cm__head"><div><small>Сабақ барысы</small><h1>Басқа тақырып</h1></div><button type="button" className="cm__back" onClick={onBack}>‹ Бүгінгі сабақтар</button></header>
      {grades.length > 1 && <Segmented label="Сынып" value={g} onChange={setG} items={grades.map((x) => ({ value: x, label: `${x}-сынып` }))} />}
      <label className="search cm__search"><IcSearch /><input type="search" placeholder="Тақырып немесе нөмір" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" aria-label="Іздеу" /></label>
      <div className="cm__list">
        {vs.map((v) => (
          <div key={v}>
            {vs.length > 1 && <h3 className="topics__variant">{VARIANT[v]?.short}</h3>}
            {rows.filter((l) => l.v === v).map((l) => (
              <button key={l.v + l.n} type="button" className="cm__row" onClick={() => (subOf(g) ? nav(boardUrl(l)) : onLock(g))}>
                <span className="tabular">{l.disp}</span><b>{l.topic}</b><small>{dm(l.date)}</small>
              </button>
            ))}
          </div>
        ))}
        {!rows.length && <div className="empty">Ештеңе табылмады.</div>}
      </div>
    </section>
  );
}
