import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from '../../lib/account';
import { GRADES, VARIANT, week } from '../../lib/config';
import { dm, type Lesson } from '../../lib/data';
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
  const w = week();
  const ready = useMemo(() => new Set(lessons.map((l) => l.v)), [lessons]);
  const mine = (profile?.variants || []).filter((v) => ready.has(v));
  const my = useMemo(() => lessons.filter((l) => mine.includes(l.v)), [lessons, mine.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = my.filter((l) => l.date === w.today);
  const nextDay = today.length ? null : my.map((l) => l.date).filter((d) => d > w.today).sort()[0] || null;
  const shown = today.length ? today : my.filter((l) => l.date === nextDay);
  const gradeOf = (l: Lesson) => VARIANT[l.v]?.grade || l.grade;

  if (pick) return <Picker lessons={my} onBack={() => setPick(false)} onLock={onLock} />;
  return (
    <section className="cm">
      <header className="cm__head">
        <div><small>Бүгін</small><h1>{longDate(w.today)}</h1></div>
        <b className="cm__clock tabular">{clock}</b>
      </header>
      <p className="cm__sub">{today.length ? `Бүгінгі сабақтар · ${today.length}` : nextDay ? `Бүгін сабақ жоқ. Келесі сабақтар — ${longDate(nextDay)}` : 'Жақын күндері сабақ жоқ.'}</p>
      <div className="cm__tiles">
        {shown.map((l, i) => {
          const g = gradeOf(l), ok = !!subOf(g);
          const body = (<>
            <span className="cm__g">{g}<small>-сынып</small></span>
            <span className="cm__t"><small>№{l.disp}{g >= 10 && VARIANT[l.v] ? ` · ${VARIANT[l.v].short}` : ''}{!today.length ? ` · ${dm(l.date)}` : ''}</small><b>{l.topic}</b></span>
            <span className="cm__go">{ok ? <><IcBoard />Тақтада ашу</> : <><IcLock />Жазылым керек</>}</span>
          </>);
          return ok
            ? <Link key={l.v + l.n} to={boardUrl(l)} className="cm__tile rise" style={{ animationDelay: `${i * 0.06}s` }}>{body}</Link>
            : <button key={l.v + l.n} type="button" className="cm__tile cm__tile--lock rise" onClick={() => onLock(g)}>{body}</button>;
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
