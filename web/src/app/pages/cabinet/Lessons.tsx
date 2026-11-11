import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from '../../lib/account';
import { GRADES, VARIANT, labOf, week } from '../../lib/config';
import { dm, type Lesson } from '../../lib/data';
import { IcLab, IcLock, IcSearch } from '../../ui/icons';
import { Segmented } from '../../ui/kit';
import LessonActions from './LessonActions';

const DOW = ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'];
const addDays = (s: string, n: number) => new Date(Date.parse(s) + n * 864e5).toISOString().slice(0, 10);
const dowOf = (d: string) => DOW[((Date.parse(d) / 864e5 + 3) % 7 + 7) % 7];
const store = { get: (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* жеке режим */ } } };

/** Сабақтар: «Осы апта» (күндер жолағы + карточкалар) және «Тақырыптар» (бүкіл ҚТЖ, іздеу, зертханалық жұмыстар) */
export default function Lessons({ lessons, onView, onLock, onClasses, sel, onSelect }: {
  lessons: Lesson[]; onView: (l: Lesson) => void; onLock: (g: number) => void; onClasses: () => void;
  /** кең экран: таңдалған сабақ оң жақта ашылады */ sel?: string | null; onSelect?: (l: Lesson | null, auto?: boolean) => void;
}) {
  const { profile, subOf } = useAccount();
  const ready = useMemo(() => new Set(lessons.map((l) => l.v)), [lessons]);
  const mine = profile?.variants || [];
  const teaches = (g: number) => mine.some((v) => v === String(g) || v.startsWith(g + '-'));
  const myVariants = (g: number) => mine.filter((v) => VARIANT[v]?.grade === g && ready.has(v));
  const grades = GRADES.filter(teaches);

  const [mode, setMode] = useState<'week' | 'all'>(() => (store.get('fs-mode', 'week') === 'all' ? 'all' : 'week'));
  const [grade, setGrade] = useState<number>(() => +store.get('fs-g', '0'));
  const [day, setDay] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [labOnly, setLabOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const g = grades.includes(grade as never) ? grade : grades[0];
  const w = week();

  if (!grades.length) {
    return (
      <div className="need rise">
        <h3>Сыныптарыңызды бекітіңіз</h3>
        <p>Қай сыныптарда сабақ беретініңізді белгілесеңіз, кабинетте тек солардың сабақтары шығады.</p>
        <button className="btn btn--primary" type="button" onClick={onClasses}>Сыныптарды таңдау</button>
      </div>
    );
  }
  const vs = myVariants(g), sub = subOf(g);
  const pick = (x: number) => { setGrade(x); store.set('fs-g', String(x)); setDay(null); setOpen(null); };
  const switchMode = (m: 'week' | 'all') => { setMode(m); store.set('fs-mode', m); setDay(null); };

  return (
    <section className="lessons">
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'week'} onClick={() => switchMode('week')}>Осы апта</button>
        <button type="button" role="tab" aria-selected={mode === 'all'} onClick={() => switchMode('all')}>Тақырыптар</button>
      </div>
      <div className="lessons__bar">
        <Segmented label="Сынып" value={g} onChange={pick} items={grades.map((x) => ({ value: x, label: `${x}-сынып` }))} />
      </div>
      <div className="lessons__meta">
        <span>{g}-сынып{vs.length === 1 && g >= 10 ? ` · ${VARIANT[vs[0]].short}` : ''}</span>
        {sub
          ? <span className="lessons__sub">{sub.trial ? 'Тегін сынақ' : 'Жазылым'} · {dm(sub.paid_until)} дейін</span>
          : <button className="link lessons__lock" type="button" onClick={() => onLock(g)}><IcLock width={13} height={13} />Жазылым жоқ</button>}
      </div>

      {!vs.length ? (
        <div className="empty">Бұл бағыттың материалдары әзірленуде. <button className="link" type="button" onClick={onClasses}>Сыныптарым</button></div>
      ) : mode === 'week' ? (
        <WeekView key={g} lessons={lessons} vs={vs} g={g} w={w} day={day} setDay={setDay} onView={onView} onLock={onLock} onAll={() => switchMode('all')} sel={sel} onSelect={onSelect} />
      ) : (
        <AllView key={g} lessons={lessons} vs={vs} g={g} w={w} query={query} setQuery={setQuery} labOnly={labOnly} setLabOnly={setLabOnly} open={open} setOpen={(k) => { setOpen(k); const l = k && lessons.find((x) => `${x.v}|${x.n}` === k); if (l) onSelect?.(l); }} onView={onView} onLock={onLock} sel={sel} onSelect={onSelect}
          others={grades.filter((x) => x !== g).flatMap((x) => myVariants(x))} onOther={(l) => { const x = VARIANT[l.v]?.grade || l.grade; setGrade(x); store.set('fs-g', String(x)); const k = `${l.v}|${l.n}`; setOpen(k); onSelect?.(l); }} />
      )}
    </section>
  );
}

type W = ReturnType<typeof week>;

function WeekView({ lessons, vs, g, w, day, setDay, onView, onLock, onAll, sel, onSelect }: {
  lessons: Lesson[]; vs: string[]; g: number; w: W; day: string | null; setDay: (d: string | null) => void; onView: (l: Lesson) => void; onLock: (g: number) => void; onAll: () => void;
  sel?: string | null; onSelect?: (l: Lesson | null, auto?: boolean) => void;
}) {
  const all = useMemo(() => lessons.filter((l) => vs.includes(l.v) && l.date >= w.from && l.date <= w.to), [lessons, vs, w.from, w.to]);
  const days: string[] = []; for (let d = w.from; d <= w.to; d = addDays(d, 1)) days.push(d);
  const shown = day ? all.filter((l) => l.date === day) : all;
  const strip = useRef<HTMLDivElement>(null);
  const keyOf = (l: Lesson) => `${l.v}|${l.n}`;
  // кең экранда: көрсетілген сабақтардың бірі әрқашан таңдаулы (бүгінгісі не біріншісі)
  useEffect(() => {
    if (!onSelect || shown.some((l) => keyOf(l) === sel)) return;
    onSelect(shown.find((l) => l.date >= w.today) || shown[0] || null, true);
  }, [shown.map(keyOf).join()]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = strip.current?.querySelector<HTMLElement>('.day--today'); if (t && strip.current) strip.current.scrollLeft = Math.max(0, t.offsetLeft - 120); }, []);
  return (
    <>
      <div className="days" ref={strip} role="group" aria-label="Апта күндері">
        {days.map((d) => {
          const c = all.filter((l) => l.date === d).length;
          return (
            <button key={d} type="button" className={`day${d === w.today ? ' day--today' : ''}${c ? '' : ' day--off'}`} aria-pressed={d === day} onClick={() => setDay(d === day ? null : d)}>
              <span>{dowOf(d)}</span><b>{+d.slice(8)}</b><i>{Array.from({ length: Math.min(c, 3) }, (_, k) => <em key={k} />)}</i>
            </button>
          );
        })}
      </div>
      <p className="lessons__count">{day ? `${dowOf(day)}, ${dm(day)}` : 'Осы апта'} · {shown.length} сабақ</p>
      {!shown.length ? (
        <div className="empty">{day ? 'Бұл күні сабақ жоқ.' : 'Бұл аптада сабақ жоқ.'} <button className="link" type="button" onClick={onAll}>Тақырыптар</button></div>
      ) : (
        <div className="cards">
          {shown.map((l, i) => (
            <article key={l.v + l.n} className={`card rise${l.date === w.today ? ' card--today' : ''}${onSelect ? ' card--pick' : ''}${sel === keyOf(l) ? ' card--sel' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}
              onClick={onSelect ? (e) => { if (!(e.target as HTMLElement).closest('a, button')) onSelect(l); } : undefined}>
              <div className="card__date"><b>{+l.date.slice(8)}</b><span>{dowOf(l.date)}</span></div>
              <div className="card__body">
                <small>№{l.disp}{g >= 10 ? ` · ${VARIANT[l.v].short}` : ''}</small>
                <h3>{l.topic}</h3>
                <LessonActions l={l} grade={g} onView={onView} onLock={onLock} layout="row" compact={!!onSelect} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function AllView({ lessons, vs, g, w, query, setQuery, labOnly, setLabOnly, open, setOpen, onView, onLock, sel, others, onOther, onSelect }: {
  lessons: Lesson[]; vs: string[]; g: number; w: W; query: string; setQuery: (s: string) => void; labOnly: boolean; setLabOnly: (b: boolean) => void;
  open: string | null; setOpen: (k: string | null) => void; onView: (l: Lesson) => void; onLock: (g: number) => void; sel?: string | null;
  others: string[]; onOther: (l: Lesson) => void; onSelect?: (l: Lesson | null, auto?: boolean) => void;
}) {
  const q = query.trim().toLowerCase();
  const labCount = lessons.filter((l) => vs.includes(l.v) && labOf(l)).length;
  const now = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!q && !labOnly) now.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const firstNow = lessons.find((l) => vs.includes(l.v) && l.date >= w.from && l.date <= w.to);
  // кең экранда «Тақырыптар» ашылғанда да панель бос тұрмасын — осы аптаның сабағы
  useEffect(() => { if (onSelect && !sel && firstNow) onSelect(firstNow, true); }, [firstNow?.v, firstNow?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  let hits = 0;
  const lists = vs.map((v) => {
    const rows = lessons.filter((l) => l.v === v && (!q || (l.disp + ' ' + l.topic).toLowerCase().includes(q)) && (!labOnly || labOf(l)));
    hits += rows.length;
    let bol = '';
    return (
      <div key={v}>
        {vs.length > 1 && <h3 className="topics__variant">{VARIANT[v].short}</h3>}
        {rows.map((l) => {
          const head = !q && l.bolim !== bol ? (bol = l.bolim) : null;
          const k = `${l.v}|${l.n}`, isNow = l.date >= w.from && l.date <= w.to, lab = labOf(l), isOpen = open === k;
          return (
            <div key={k}>
              {head && <h4 className="topics__bol">{head}</h4>}
              <div className={`topic${isOpen ? ' topic--open' : ''}${isNow ? ' topic--now' : ''}${sel === k ? ' topic--sel' : ''}`} ref={firstNow === l ? now : undefined}>
                <button className="topic__head" type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : k)}>
                  <span className="topic__n tabular">{l.disp}</span>
                  <span className="topic__t">{l.topic}{lab?.exp && <small><IcLab width={14} height={14} />3D тәжірибе бар</small>}</span>
                  <span className="topic__d tabular">{isNow ? 'осы апта' : dm(l.date)}</span>
                  <i className="topic__chev" aria-hidden />
                </button>
                <div className="topic__body"><div>{isOpen && <LessonActions l={l} grade={g} onView={onView} onLock={onLock} />}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  });
  return (
    <>
      <label className="search"><IcSearch /><input type="search" placeholder="Тақырыпты немесе нөмірін іздеу" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" aria-label="Іздеу" /></label>
      {labCount > 0 && (
        <button className="filter" type="button" aria-pressed={labOnly} onClick={() => setLabOnly(!labOnly)}><IcLab />Зертханалық жұмыстар <b>{labCount}</b></button>
      )}
      <div className="topics">{lists}</div>
      {q && (() => {
        const more = lessons.filter((l) => others.includes(l.v) && (l.disp + ' ' + l.topic).toLowerCase().includes(q)).slice(0, 12);
        return more.length > 0 && (
          <div className="topics topics--other">
            <h4 className="topics__bol">Басқа сыныптарда · {more.length}</h4>
            {more.map((l) => (
              <button key={l.v + l.n} type="button" className="topic__head topic__head--other" onClick={() => onOther(l)}>
                <span className="topic__n tabular">{VARIANT[l.v]?.grade || l.grade}·{l.disp}</span><span className="topic__t">{l.topic}</span><span className="topic__d tabular">{VARIANT[l.v]?.short || ''}</span>
              </button>
            ))}
          </div>
        );
      })()}
      {!hits && !q && <div className="empty">Ештеңе табылмады.</div>}
      {!hits && q && <div className="empty">Бұл сыныпта табылмады.</div>}
    </>
  );
}
