import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { VARIANT } from '../../lib/config';
import { dm, lessonDeck, viewPages, type Lesson, type ViewPages } from '../../lib/data';
import { useAccount } from '../../lib/account';
import { stepsOf, type DeckData, type Slide } from '../../deck/types';
import { markSeen } from '../../lib/seen';
import { IcLock } from '../../ui/icons';
import { Segmented } from '../../ui/kit';
import LessonActions from './LessonActions';

const Deck = lazy(() => import('../../deck/Deck'));

/** Morph ауысуы (PowerPoint «Morph» сияқты): бірдей атаулы элементтер бір күйден екіншісіне жылжиды.
 *  View Transitions API жоқ браузерде — бірден ауысады. */
export function morph(fn: () => void) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (d.startViewTransition && !calm) d.startViewTransition(() => flushSync(fn)); else fn();
}

/** Кең экранда тақырып таңдалса — оң жақта ҚМЖ мен анимациялы презентация */
export function useWide(q = '(min-width: 1100px)') {
  const [on, setOn] = useState(() => typeof matchMedia === 'function' && matchMedia(q).matches);
  useEffect(() => { const m = matchMedia(q); const f = () => setOn(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f); }, [q]);
  return on;
}

type Tab = 'pres' | 'kmzh';
const deckCache = new Map<string, DeckData | null>();
const pageCache = new Map<string, ViewPages | string>();
const theme = () => { try { const t = localStorage.getItem('fs-deck-theme'); return (t === 'b' || t === 'c' ? t : 'a') as 'a' | 'b' | 'c'; } catch { return 'a'; } };
const titleOf = (s: Slide) => ('title' in s && s.title) || ('kicker' in s && s.kicker) || ('q' in s && s.q) || ('text' in s && s.text) || '';

export default function LessonPane({ lesson, onLock, tab, setTab }: { lesson: Lesson | null; onLock: (g: number) => void; tab: Tab; setTab: (t: Tab) => void }) {
  const { subOf } = useAccount();
  const key = lesson ? `${lesson.v}|${lesson.n}` : '';
  const [deck, setDeck] = useState<DeckData | null | undefined>(undefined);
  const [pages, setPages] = useState<Partial<Record<Tab, ViewPages | string>>>({});

  useEffect(() => {
    if (!lesson) return;
    let off = false;
    setDeck(deckCache.get(key)); setPages({ pres: pageCache.get(key + '|pres'), kmzh: pageCache.get(key + '|kmzh') });
    if (!deckCache.has(key)) lessonDeck(lesson.v, lesson.n).then((d) => { deckCache.set(key, d); if (!off) setDeck(d); });
    return () => { off = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  // Суреттер: ҚМЖ беттері әрқашан, слайд суреттері — анимациялы презентация жоқ болса
  const need: Tab | null = !lesson ? null : tab === 'kmzh' ? 'kmzh' : deck === null ? 'pres' : null;
  useEffect(() => {
    if (!lesson || !need || pages[need] !== undefined || !lesson[need]) return;
    let off = false;
    const k = `${key}|${need}`;
    viewPages(lesson.v, lesson.n, need).then((j) => j, (e) => (e as Error).message).then((j) => { pageCache.set(k, j); if (!off) setPages((p) => ({ ...p, [need]: j })); });
    return () => { off = true; };
  }, [key, need, pages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (lesson && tab === 'kmzh' && pages.kmzh && typeof pages.kmzh !== 'string') markSeen(lesson.v, lesson.n); }, [lesson, tab, pages.kmzh]);
  if (!lesson) return <aside className="pane pane--empty"><p>Сабақты таңдаңыз — мұнда ҚМЖ мен презентация көрінеді.</p></aside>;
  const g = VARIANT[lesson.v]?.grade || lesson.grade, ok = !!subOf(g);
  return (
    <aside className="pane" aria-label="Сабақ материалдары">
      <header className="pane__head">
        <small>{g}-сынып · №{lesson.disp}{g >= 10 && VARIANT[lesson.v] ? ` · ${VARIANT[lesson.v].short}` : ''} · {dm(lesson.date)}</small>
        <h2 className="pane__title">{lesson.topic}</h2>
      </header>
      <div className="pane__tabs">
        <Segmented label="Материал" value={tab} onChange={(t) => morph(() => setTab(t))} items={[{ value: 'pres' as Tab, label: 'Презентация' }, { value: 'kmzh' as Tab, label: 'ҚМЖ' }]} />
      </div>
      <div className="pane__body">
        {tab === 'pres'
          ? deck === undefined ? <div className="pane__stage pane__stage--wait"><i className="pane__spin" /></div>
            : deck ? <DeckPlayer key={key} deck={deck} />
            : <Pages data={pages.pres} wide lock={() => onLock(g)} unit="слайд" g={g} />
          : <Pages data={pages.kmzh} lock={() => onLock(g)} unit="бет" g={g} />}
      </div>
      <footer className="pane__foot">
        {ok ? <LessonActions l={lesson} grade={g} onView={() => {}} onLock={onLock} layout="row" noView />
          : <><p className="hint">Толық нұсқасы жазылыммен ашылады.</p><button className="btn btn--primary" type="button" onClick={() => onLock(g)}>Жазылу</button></>}
      </footer>
    </aside>
  );
}

/** Анимациялы презентация: элементтер өздігінен шығады, слайдтар morph-пен ауысады */
function DeckPlayer({ deck }: { deck: DeckData }) {
  // Алдын ала қарау: әр слайд толық күйінде (бос слайд көрінбеуі үшін), слайдтар morph-пен ауысады
  const [at, setAt] = useState(0);
  const [play, setPlay] = useState(true);
  const list = useRef<HTMLOListElement>(null);
  const n = deck.slides.length;
  const go = (i: number) => morph(() => setAt((i + n) % n));
  useEffect(() => {
    if (!play) return;
    const t = setTimeout(() => { if (!document.hidden) go(at + 1); }, 4500);
    return () => clearTimeout(t);
  }, [play, at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { list.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [at]);
  const th = theme();
  return (
    <div className="player">
      <div className={`pane__stage pane__stage--${th}`} onClick={() => { setPlay(false); go(at + 1); }} title="Келесі слайд">
        <Suspense fallback={<i className="pane__spin" />}><Deck data={deck} index={at} step={stepsOf(deck.slides[at])} theme={th} /></Suspense>
      </div>
      <div className="player__bar">
        <button type="button" className="player__b" onClick={() => { setPlay(false); go(at - 1); }} aria-label="Алдыңғы слайд">‹</button>
        <button type="button" className="player__b player__b--play" onClick={() => setPlay(!play)} aria-label={play ? 'Тоқтату' : 'Ойнату'}>{play ? '❚❚' : '▶'}</button>
        <button type="button" className="player__b" onClick={() => { setPlay(false); go(at + 1); }} aria-label="Келесі слайд">›</button>
        <span className="player__n tabular">{at + 1} / {n}</span>
        <i className="player__prog"><em style={{ width: `${((at + 1) / n) * 100}%` }} /></i>
      </div>
      <ol className="player__list" ref={list}>
        {deck.slides.map((s, i) => (
          <li key={i}><button type="button" aria-current={i === at} onClick={() => { setPlay(false); go(i); }}><b className="tabular">{i + 1}</b><span>{String(titleOf(s)).replace(/\*\*/g, '') || '—'}</span></button></li>
        ))}
      </ol>
    </div>
  );
}

/** Беттердің суреттері (ҚМЖ — парақтар тізімі, слайд — бір-бірден morph-пен) */
function Pages({ data, wide, lock, unit, g }: { data: ViewPages | string | undefined; wide?: boolean; lock: () => void; unit: string; g: number }) {
  const [at, setAt] = useState(0);
  useEffect(() => { setAt(0); }, [data]);
  useEffect(() => {
    if (!wide || !data || typeof data === 'string' || data.pages.length < 2) return;
    const t = setInterval(() => { if (!document.hidden) morph(() => setAt((x) => (x + 1) % data.pages.length)); }, 4000);
    return () => clearInterval(t);
  }, [wide, data]);
  if (data === undefined) return <div className={`pane__stage pane__stage--wait${wide ? '' : ' pane__stage--doc'}`}><i className="pane__spin" /></div>;
  if (typeof data === 'string') return <div className="pane__msg">{data}</div>;
  const more = data.locked && (
    <div className="viewer__lock"><IcLock /><b>Тағы {data.total - data.pages.length} {unit}</b><p>Толық нұсқасы {g}-сыныпқа жазылыммен ашылады.</p><button className="btn btn--primary" type="button" onClick={lock}>Жазылу</button></div>
  );
  if (wide) {
    return (
      <div className="player">
        <div className="pane__stage pane__stage--img"><img key={at} src={data.pages[at]} alt={`${at + 1}-слайд`} width={data.w} height={data.h} /></div>
        <div className="player__thumbs">{data.pages.map((p, i) => <button key={p} type="button" aria-current={i === at} onClick={() => morph(() => setAt(i))}><img src={p} alt="" loading="lazy" /></button>)}</div>
        {more}
      </div>
    );
  }
  return (
    <div className="pane__doc">
      {data.pages.map((src, i) => (
        <figure key={src} className="pane__pg"><img src={src} alt={`ҚМЖ, ${i + 1}-бет`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" width={data.w} height={data.h} /><i>{i + 1}/{data.total}</i></figure>
      ))}
      {more}
    </div>
  );
}
