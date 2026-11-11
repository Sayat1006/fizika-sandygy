import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from '../lib/account';
import { labOf } from '../lib/config';
import { lessonDeck, lessonPlan, loadLessons, viewPages, type Lesson, type Stage } from '../lib/data';
import Deck, { THEMES, type Theme } from '../deck/Deck';
import LivePanel from './board/LivePanel';
import { stepsOf, type DeckData } from '../deck/types';
import { IcChevronL, IcChevronR } from '../ui/icons';

/* Тақта: интерактивті панельге арналған толық экранды сабақ режимі.
   Слайд / жұмыс парағы / ақ тақта / 3D тәжірибе, қалам қабаты, сабақ кезеңдері мен уақыт, кездейсоқ оқушы, таймер. */

type Src = 'pres' | 'ws' | 'board' | 'lab';
type Tool = 'hand' | 'pen' | 'hl' | 'erase';
interface Stroke { t: Tool; c: string; w: number; p: [number, number][] }

const mmss = (s: number) => { const a = Math.abs(Math.round(s)); return (s < 0 ? '+' : '') + Math.floor(a / 60) + ':' + String(a % 60).padStart(2, '0'); };
const store = { get: (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* */ } } };
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const S = (d: string, fill = false) => <svg viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
const PENS = [['#111111', 'Қара'], ['#0A84FF', 'Көк'], ['#FF3B30', 'Қызыл']] as const;

export default function Board() {
  const { ready, session } = useAccount();
  const qs = new URLSearchParams(location.search), V = qs.get('v') || '', N = parseInt(qs.get('n') || '', 10), grade = parseInt(V, 10);

  const [fatal, setFatal] = useState<{ title: string; text: string; to: string; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [pages, setPages] = useState<{ pres: string[]; ws: string[] }>({ pres: [], ws: [] });
  const [src, setSrc] = useState<Src>('pres');
  const [idx, setIdx] = useState({ pres: 0, ws: 0 });
  const [tool, setToolS] = useState<Tool>('hand');
  const [color, setColor] = useState('#111111');
  const [stages, setStages] = useState<Stage[]>([]);
  const [cur, setCur] = useState(0);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(0);
  const [notes, setNotes] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [fs, setFs] = useState(false);
  const [pop, setPop] = useState<'pick' | 'timer' | null>(null);
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState<Theme>(() => (['a', 'b', 'c'].includes(store.get('fs-deck-theme', 'a')) ? store.get('fs-deck-theme', 'a') : 'a') as Theme);
  const lab = lesson ? labOf(lesson) : null;

  /* ───────── жүктеу ───────── */
  useEffect(() => {
    if (!ready) return;
    const fail = (title: string, text: string, label = 'Кабинетке') => { setFatal({ title, text, to: '/app', label }); setLoading(false); };
    if (!V || !(N > 0)) return fail('Сабақ таңдалмаған', 'Кабинеттен тақырыпты ашып, «Тақтада ашу» батырмасын басыңыз.');
    if (!session) return fail('Кабинетке кіріңіз', 'Тақта кабинетке кірген мұғалімге ашылады.', 'Кіру');
    let off = false;
    (async () => {
      const all = await loadLessons();
      const l = all.find((x) => x.v === V && x.n === N) || all.find((x) => grade < 10 && x.grade === grade && x.n === N);
      if (!l) return fail('Сабақ табылмады', 'Кабинетке оралып, тақырыпты қайта таңдаңыз.');
      const lv = { ...l, v: V };
      const [plan, pres, ws, dk] = await Promise.all([
        lessonPlan(V, N),
        l.pres ? viewPages(V, N, 'pres').catch(() => null) : null,
        l.ws ? viewPages(V, N, 'ws').catch(() => null) : null,
        lessonDeck(V, N),
      ]);
      if (off) return;
      if (plan.status === 402) return fail('Тақта жазылыммен ашылады', `${grade}-сыныпқа жазылым немесе тегін сынақ мерзімі керек.`, 'Жазылымды рәсімдеу');
      if (plan.status === 401) return fail('Сессия аяқталды', 'Кабинетке қайта кіріңіз.', 'Кіру');
      const p = { pres: pres?.pages || [], ws: ws?.pages || [] };
      // интернет нашар болса да слайдтар кідірмеуі үшін бәрін алдын ала жүктеп қоямыз
      [...p.pres, ...p.ws].forEach((u) => { const i = new Image(); i.decoding = 'async'; i.src = u; });
      // анимациялы презентация болса, «Слайд» соны көрсетеді
      if (dk?.slides?.length) { setDeck(dk); p.pres = dk.slides.map((_, k) => `deck:${k}`); }
      setLesson(lv); setPages(p); setStages(plan.stages || []); setSrc(p.pres.length ? 'pres' : 'board');
      setCur(0); setLeft((plan.stages?.[0]?.min || 0) * 60);
      document.title = `${l.topic} · Тақта`;
      setLoading(false);
      try { await (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<unknown> } }).wakeLock?.request('screen'); } catch { /* тақтаның экраны сөніп қалмасын */ }
    })().catch(() => { if (!off) fail('Қате орын алды', 'Бетті жаңартып көріңіз.'); });
    return () => { off = true; };
  }, [ready, session?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ───────── беттер ───────── */
  const paged = src === 'pres' || src === 'ws';
  const list = paged ? pages[src] : [];
  const i = paged ? idx[src] : 0;
  const onDeck = src === 'pres' && !!deck;
  const live = useRef({ src, i, tool, color, step, deck });
  live.current = { src, i, tool, color, step, deck };
  const go = useCallback((d: number) => {
    const { src: s, i: at, step: st, deck: dk } = live.current;
    if (s !== 'pres' && s !== 'ws') return;
    if (s === 'pres' && dk) {
      // анимациялы презентация: алдымен слайдтағы қадамдар, сосын келесі слайд
      const max = stepsOf(dk.slides[at]);
      if (d > 0) { if (st < max) return setStep(st + 1); if (at < dk.slides.length - 1) { setIdx((x) => ({ ...x, pres: at + 1 })); setStep(0); } }
      else { if (st > 0) return setStep(st - 1); if (at > 0) { setIdx((x) => ({ ...x, pres: at - 1 })); setStep(stepsOf(dk.slides[at - 1])); } }
      return;
    }
    setIdx((x) => ({ ...x, [s]: Math.max(0, Math.min(pages[s].length - 1, x[s] + d)) }));
  }, [pages]);

  /* ───────── қалам қабаты ───────── */
  const stageRef = useRef<HTMLElement>(null), cvRef = useRef<HTMLCanvasElement>(null), imgRef = useRef<HTMLImageElement>(null), deckRef = useRef<HTMLDivElement>(null);
  const ink = useRef(new Map<string, Stroke[]>());
  const drawing = useRef<Stroke | null>(null);
  const pointers = useRef(new Set<number>());
  const keyOf = () => `${live.current.src}:${live.current.i}`;

  // Сызық беттің өзіне (слайд суретіне) байланады: object-fit: contain — суреттің нақты көрінетін бөлігі
  const box = useCallback(() => {
    const st = stageRef.current!.getBoundingClientRect(), img = imgRef.current;
    if (live.current.src === 'pres' && live.current.deck && deckRef.current) {
      const r = deckRef.current.getBoundingClientRect();
      if (r.width) return { x: r.left - st.left, y: r.top - st.top, w: r.width, h: r.height };
    }
    if (img && img.naturalWidth && (live.current.src === 'pres' || live.current.src === 'ws')) {
      const r = img.getBoundingClientRect(), k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
      const w = img.naturalWidth * k, h = img.naturalHeight * k;
      return { x: r.left - st.left + (r.width - w) / 2, y: r.top - st.top + (r.height - h) / 2, w, h };
    }
    return { x: 0, y: 0, w: st.width, h: st.height };
  }, []);
  const redraw = useCallback(() => {
    const cv = cvRef.current, st = stageRef.current; if (!cv || !st) return;
    const ctx = cv.getContext('2d')!, r = st.getBoundingClientRect(), b = box();
    ctx.clearRect(0, 0, r.width, r.height);
    const paint = (s: Stroke) => {
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = s.t === 'hl' ? 'multiply' : 'source-over';
      ctx.globalAlpha = s.t === 'hl' ? 0.35 : 1;
      ctx.strokeStyle = s.c; ctx.lineWidth = s.w * b.w;
      const p = s.p; if (!p.length) return;
      const X = (q: [number, number]) => b.x + q[0] * b.w, Y = (q: [number, number]) => b.y + q[1] * b.h;
      ctx.beginPath(); ctx.moveTo(X(p[0]), Y(p[0]));
      if (p.length === 1) ctx.lineTo(X(p[0]) + 0.1, Y(p[0]));
      for (let k = 1; k < p.length - 1; k++) { // тегіс сызық: нүктелер арасындағы орта нүкте арқылы
        ctx.quadraticCurveTo(X(p[k]), Y(p[k]), b.x + (p[k][0] + p[k + 1][0]) / 2 * b.w, b.y + (p[k][1] + p[k + 1][1]) / 2 * b.h);
      }
      if (p.length > 1) ctx.lineTo(X(p[p.length - 1]), Y(p[p.length - 1]));
      ctx.stroke();
    };
    for (const s of ink.current.get(keyOf()) || []) paint(s);
    if (drawing.current) paint(drawing.current);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }, [box]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const st = stageRef.current, cv = cvRef.current; if (!st || !cv) return;
    const fit = () => { const r = st.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); cv.getContext('2d')!.setTransform(d, 0, 0, d, 0, 0); redraw(); };
    const ro = new ResizeObserver(fit); ro.observe(st);
    return () => ro.disconnect();
  }, [loading, redraw]);
  useEffect(redraw, [src, i, redraw]);

  const at = (e: { clientX: number; clientY: number }): [number, number] => { const st = stageRef.current!.getBoundingClientRect(), b = box(); return [(e.clientX - st.left - b.x) / b.w, (e.clientY - st.top - b.y) / b.h]; };
  const eraseAt = (pt: [number, number]) => {
    const l = ink.current.get(keyOf()); if (!l) return;
    const b = box(), R = 18 / b.w;
    const keep = l.filter((s) => !s.p.some((q) => Math.hypot(q[0] - pt[0], (q[1] - pt[1]) * b.h / b.w) < R + s.w / 2));
    if (keep.length !== l.length) { ink.current.set(keyOf(), keep); redraw(); }
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.add(e.pointerId);
    if (pointers.current.size > 1) { drawing.current = null; redraw(); return; } // екі саусақ — сызбаймыз
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = at(e), t = live.current.tool;
    if (t === 'erase') return eraseAt(pt);
    drawing.current = { t, c: t === 'hl' ? '#FFD60A' : live.current.color, w: (t === 'hl' ? 22 : 3.2) / box().w, p: [pt] };
    redraw();
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(e.pointerId) || pointers.current.size > 1) return;
    const evs = e.nativeEvent.getCoalescedEvents?.() || [e.nativeEvent];
    if (live.current.tool === 'erase') return evs.forEach((x) => eraseAt(at(x)));
    if (!drawing.current) return;
    evs.forEach((x) => drawing.current!.p.push(at(x)));
    redraw();
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (!drawing.current) return;
    const k = keyOf(); ink.current.set(k, [...(ink.current.get(k) || []), drawing.current]); drawing.current = null; redraw();
  };
  const undo = () => { const l = ink.current.get(keyOf()); if (l?.length) { l.pop(); redraw(); } };
  const clear = () => { ink.current.delete(keyOf()); redraw(); };
  const setTool = (t: Tool, c?: string) => {
    if (src === 'lab' && t !== 'hand') setSrc('board'); // 3D тәжірибенің үстінен сызбаймыз — ақ тақтаға ауысады
    setToolS(t); if (c) setColor(c);
  };

  // «Басқару» режимінде слайдты саусақпен сырғыту
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const stDown = (e: React.PointerEvent) => { if (tool === 'hand' && !(e.target as HTMLElement).closest('button, iframe, input, select, .bd-notes, .bd-live, .bd-joinbig, .dk-ill, .dk-cardf')) swipe.current = { x: e.clientX, y: e.clientY }; };
  const stUp = (e: React.PointerEvent) => {
    const s = swipe.current; if (!s) return; swipe.current = null;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
    else if (onDeck && Math.abs(dx) < 12 && Math.abs(dy) < 12) go(1); // слайдты басу — келесі қадам
  };
  const cycleTheme = () => { const t = THEMES[(THEMES.findIndex((x) => x.id === theme) + 1) % THEMES.length].id; setTheme(t); store.set('fs-deck-theme', t); };
  const maxStep = deck && onDeck ? stepsOf(deck.slides[i]) : 0;

  /* ───────── пернетақта, толық экран ───────── */
  const toggleFs = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.().catch(() => {}); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, dialog')) return;
      // пульттер мен пернетақта: → / PageDown / бос орын — келесі, ← / PageUp — алдыңғы
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === 'f') toggleFs();
    };
    const f = () => setFs(!!document.fullscreenElement);
    addEventListener('keydown', k); document.addEventListener('fullscreenchange', f);
    return () => { removeEventListener('keydown', k); document.removeEventListener('fullscreenchange', f); };
  }, [go]);

  /* ───────── сабақ кезеңдері және уақыт ───────── */
  const pickStage = (n: number) => { setCur(n); setLeft((stages[n]?.min || 0) * 60); };
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const t = setInterval(() => { const now = performance.now(); setLeft((x) => x - (now - last) / 1000); last = now; }, 250);
    return () => clearInterval(t);
  }, [running]);
  const stagesRef = useRef<HTMLElement>(null);
  useEffect(() => { stagesRef.current?.querySelector('.bd-st--on')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); }, [cur, stages.length]);
  const st = stages[cur];

  if (fatal || loading) {
    return (
      <div className="bd bd--msg">
        {loading && !fatal ? <p>Сабақ жүктелуде…</p> : fatal && (
          <div className="bd-msg"><b>{fatal.title}</b><span>{fatal.text}</span><Link className="bd-pill" to={fatal.to}>{fatal.label}</Link></div>
        )}
      </div>
    );
  }

  const srcBtn = (s: Src, label: string, d: string, show = true) => show && (
    <button type="button" aria-pressed={src === s} onClick={() => { if (s !== src) { setSrc(s); if (s === 'lab') setToolS('hand'); } }}>{S(d)}<span>{label}</span></button>
  );

  return (
    <div className="bd">
      <header className="bd-top">
        <Link className="bd-ib" to="/app" aria-label="Кабинетке оралу"><IcChevronL /></Link>
        <div className="bd-ttl"><small>{grade}-сынып · №{lesson!.disp}</small><b>{lesson!.topic}</b></div>
        <div className={`bd-clock${st && left < 0 ? ' bd-clock--over' : ''}`}>
          <span>{st ? st.sub || st.stage : 'Сабақ'}</span><b>{mmss(st ? left : 0)}</b>
          <button className="bd-ib" type="button" onClick={() => setRunning(!running)} aria-label={running ? 'Уақытты тоқтату' : 'Уақытты бастау'}>
            {running ? S('M7 5h4v14H7zM13 5h4v14h-4z', true) : S('M8 5v14l11-7z', true)}
          </button>
        </div>
        <button className="bd-ib" type="button" aria-pressed={fs} onClick={toggleFs} aria-label="Толық экран">{S('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5')}</button>
      </header>

      <main className="bd-stage" ref={stageRef} onPointerDown={stDown} onPointerUp={stUp}>
        <div className={`bd-view${src === 'board' ? ' bd-view--white' : ''}`}>
          {onDeck && <Deck data={deck!} index={i} step={step} theme={theme} stageRef={deckRef} />}
          {paged && !onDeck && list[i] && <img ref={imgRef} src={list[i]} alt={`${src === 'pres' ? 'Слайд' : 'Бет'} ${i + 1}`} draggable={false} onLoad={redraw} />}
          {src === 'lab' && lab?.exp && <iframe src={`/lab/experiments/${lab.exp}?embed=1`} title="3D тәжірибе" allow="fullscreen" />}
        </div>
        <canvas ref={cvRef} className={`bd-ink${tool === 'hand' ? ' bd-ink--off' : ''}`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
        {paged && <>
          <button className="bd-nav bd-nav--prev" type="button" aria-label="Алдыңғы" disabled={i === 0 && (!onDeck || step === 0)} onClick={() => go(-1)}><IcChevronL /></button>
          <button className="bd-nav bd-nav--next" type="button" aria-label="Келесі" disabled={i >= list.length - 1 && (!onDeck || step >= maxStep)} onClick={() => go(1)}><IcChevronR /></button>
          <div className="bd-pno">{i + 1} / {list.length}{onDeck && maxStep > 0 && <span className="bd-steps">{Array.from({ length: maxStep }, (_, k) => <i key={k} className={k < step ? 'on' : ''} />)}</span>}</div>
        </>}
        <aside className={`bd-notes${notes ? ' bd-notes--open' : ''}`} aria-label="Сабақ сценарийі">
          {st ? <>
            <h3>{st.stage} · {st.min} мин</h3><p><b>{st.sub}</b></p>
            <h3>Мұғалімнің әрекеті</h3>{st.teacher.map((t, k) => <p key={k}>{t}</p>)}
            <h3>Оқушының әрекеті</h3>{st.student.map((t, k) => <p key={k}>{t}</p>)}
          </> : <p>Бұл сабақтың сценарийі жоқ.</p>}
        </aside>
        <LivePanel open={liveOpen} onClose={() => setLiveOpen(false)} slide={onDeck && deck ? deck.slides[i] : null} title={lesson?.topic || ''} onNames={setNames} />
      </main>

      <div className="bd-tools">
        <div className="bd-grp bd-src" role="group" aria-label="Не көрсету">
          {srcBtn('pres', 'Слайд', 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 16v4M8 20h8', pages.pres.length > 0)}
          {srcBtn('ws', 'Парақ', 'M9 4h6v3H9zM6 6h12v15H6zM9 13l2 2 4-4', pages.ws.length > 0)}
          {srcBtn('board', 'Ақ тақта', 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM7 14l3-4 3 3 4-5')}
          {srcBtn('lab', '3D тәжірибе', 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3', !!lab?.exp)}
        </div>
        <div className="bd-grp bd-pen" role="group" aria-label="Қалам">
          <button className="bd-ib" type="button" aria-pressed={tool === 'hand'} onClick={() => setTool('hand')} aria-label="Басқару (сызбау)">{S('M5 3l14 8-6 2-3 6z')}</button>
          {PENS.map(([c, n]) => (
            <button key={c} className="bd-ib bd-col" type="button" aria-pressed={tool === 'pen' && color === c} onClick={() => setTool('pen', c)} aria-label={`${n} қалам`}><span className="bd-dot" style={{ background: c }} /></button>
          ))}
          <button className="bd-ib" type="button" aria-pressed={tool === 'hl'} onClick={() => setTool('hl')} aria-label="Маркер">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 4l5 5-9 9H6v-5z" /><path d="M4 21h16" stroke="#FFD60A" strokeWidth="3" /></svg>
          </button>
          <button className="bd-ib" type="button" aria-pressed={tool === 'erase'} onClick={() => setTool('erase')} aria-label="Өшіргіш">{S('M16 3l5 5-11 11H5l-2-2zM9 21h12')}</button>
          <button className="bd-ib" type="button" onClick={undo} aria-label="Болдырмау">{S('M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3')}</button>
          <button className="bd-ib" type="button" onClick={clear} aria-label="Бетті тазалау">{S('M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3')}</button>
        </div>
        <div className="bd-grp" role="group" aria-label="Сынып құралдары">
          {deck && src === 'pres' && <button className="bd-ib bd-theme" type="button" onClick={cycleTheme} aria-label={`Слайд стилі: ${THEMES.find((x) => x.id === theme)!.name}`} title={THEMES.find((x) => x.id === theme)!.name}><b>{theme.toUpperCase()}</b></button>}
          <button className="bd-ib bd-ib--badge" type="button" aria-pressed={liveOpen} onClick={() => { setLiveOpen(!liveOpen); setNotes(false); }} aria-label="Сынып: оқушылардың телефоны" title="Оқушылар телефоннан қосылады">
            {S('M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2')}{names.length > 0 && <em>{names.length}</em>}</button>
          <button className="bd-ib" type="button" aria-pressed={notes} onClick={() => { setNotes(!notes); setLiveOpen(false); }} aria-label="Мұғалім жазбасы">{S('M5 4h14v16H5zM9 8h6M9 12h6M9 16h4')}</button>
          <button className="bd-ib" type="button" onClick={() => setPop('pick')} aria-label="Кездейсоқ оқушы">{S('M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM8.5 8.5h.01M15.5 15.5h.01M12 12h.01')}</button>
          <button className="bd-ib" type="button" onClick={() => setPop('timer')} aria-label="Таймер">{S('M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2.5M9 2h6')}</button>
        </div>
      </div>

      {stages.length > 0 && (
        <nav className="bd-stages" ref={stagesRef} aria-label="Сабақ кезеңдері">
          {stages.map((s, k) => (
            <button key={k} type="button" className={`bd-st${k === cur ? ' bd-st--on' : ''}${k < cur ? ' bd-st--done' : ''}`} onClick={() => pickStage(k)}>
              <i style={k === cur && s.min ? { width: Math.min(100, (1 - left / (s.min * 60)) * 100) + '%' } : undefined} />
              <b>{s.sub || s.stage}</b><small>{s.stage} · {s.min} мин</small>
            </button>
          ))}
        </nav>
      )}

      <Picker open={pop === 'pick'} onClose={() => setPop(null)} grade={grade} names={names} />
      <Timer open={pop === 'timer'} onClose={() => setPop(null)} />
    </div>
  );
}

function Pop({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  return (
    <dialog ref={ref} className="bd-pop" onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <h2>{title}</h2>{children}
    </dialog>
  );
}

/* кездейсоқ оқушы: барлығы шыққанша қайталанбайды */
function Picker({ open, onClose, grade, names }: { open: boolean; onClose: () => void; grade: number; names: string[] }) {
  if (names.length >= 2) return <NamePicker open={open} onClose={onClose} names={names} />;
  return <NumberPicker open={open} onClose={onClose} grade={grade} />;
}

/* сабаққа телефоннан қосылған оқушылардың аты бойынша: барлығы шыққанша қайталанбайды */
function NamePicker({ open, onClose, names }: { open: boolean; onClose: () => void; names: string[] }) {
  const [bag, setBag] = useState<string[]>([]);
  const [shown, setShown] = useState('?');
  const [rolling, setRolling] = useState(false);
  const pick = () => {
    const b = bag.length ? [...bag] : [...names];
    const p = b.splice(Math.floor(Math.random() * b.length), 1)[0];
    setBag(b);
    if (reduce) return setShown(p);
    setRolling(true); let k = 0;
    const t = setInterval(() => { setShown(names[Math.floor(Math.random() * names.length)]); if (++k > 12) { clearInterval(t); setRolling(false); setShown(p); } }, 80);
  };
  return (
    <Pop open={open} onClose={onClose} title="Кездейсоқ оқушы">
      <div className={`bd-big bd-big--name${rolling ? ' bd-big--roll' : ''}`}>{shown}</div>
      <small>Қалды: {bag.length || names.length} · сабаққа қосылғандар ішінен</small>
      <div className="bd-row"><button className="bd-pill" type="button" onClick={pick} disabled={rolling}>Таңдау</button><button className="bd-pill bd-pill--ghost" type="button" onClick={onClose}>Жабу</button></div>
    </Pop>
  );
}

function NumberPicker({ open, onClose, grade }: { open: boolean; onClose: () => void; grade: number }) {
  const key = `fs-pick-${grade}`;
  const [size, setSize] = useState(() => +store.get(key, '25') || 25);
  const [bag, setBag] = useState<number[]>([]);
  const [shown, setShown] = useState<string>('?');
  const [rolling, setRolling] = useState(false);
  const fresh = (n: number) => Array.from({ length: n }, (_, k) => k + 1);
  useEffect(() => { if (open && !bag.length) setBag(fresh(size)); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const resize = (v: number) => { const n = Math.max(2, Math.min(45, v || 25)); setSize(n); store.set(key, String(n)); setBag(fresh(n)); setShown('?'); };
  const pick = () => {
    const b = bag.length ? [...bag] : fresh(size);
    const p = b.splice(Math.floor(Math.random() * b.length), 1)[0];
    setBag(b);
    if (reduce) return setShown(String(p));
    setRolling(true); let k = 0;
    const t = setInterval(() => { setShown(String(1 + Math.floor(Math.random() * size))); if (++k > 12) { clearInterval(t); setRolling(false); setShown(String(p)); } }, 70);
  };
  return (
    <Pop open={open} onClose={onClose} title="Кездейсоқ оқушы">
      <div className={`bd-big${rolling ? ' bd-big--roll' : ''}`}>{shown}</div>
      <small>Қалды: {bag.length}</small>
      <div className="bd-row"><label>Сыныпта <input type="number" min={2} max={45} inputMode="numeric" defaultValue={size} onChange={(e) => resize(+e.target.value)} /> оқушы</label></div>
      <div className="bd-row"><button className="bd-pill" type="button" onClick={pick} disabled={rolling}>Таңдау</button><button className="bd-pill bd-pill--ghost" type="button" onClick={onClose}>Жабу</button></div>
    </Pop>
  );
}

function Timer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [end, setEnd] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!end) return; const t = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(t); }, [end]);
  const l = (end - now) / 1000, over = !!end && l <= 0;
  const start = (sec: number) => { setNow(Date.now()); setEnd(Date.now() + sec * 1000); };
  return (
    <>
      <Pop open={open} onClose={onClose} title="Таймер">
        <div className="bd-chips">{[1, 2, 3, 5, 10].map((m) => <button key={m} type="button" onClick={() => { onClose(); start(m * 60); }}>{m} мин</button>)}</div>
        <div className="bd-row"><button className="bd-pill bd-pill--ghost" type="button" onClick={onClose}>Жабу</button></div>
      </Pop>
      {end > 0 && (
        <div className={`bd-tbig${over ? ' bd-tbig--end' : ''}`}>
          <div className="bd-big">{mmss(Math.max(0, Math.ceil(l)))}</div>
          <div className="bd-row">
            <button className="bd-pill bd-pill--ghost" type="button" onClick={() => (over ? start(60) : setEnd(end + 60000))}>+1 мин</button>
            <button className="bd-pill" type="button" onClick={() => setEnd(0)}>Жабу</button>
          </div>
        </div>
      )}
    </>
  );
}
