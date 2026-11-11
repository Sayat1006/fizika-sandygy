import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import type { DeckData } from '../../deck/types';
import {
  QUICK, endSession, fromDeck, fromSlide, quizOf, isCorrect, joinUrl, loadRoom, myOpenSession, norm, setQuestion, startSession, teacherChannel,
  type Answer, type LiveQuestion, type LiveSession, type Participant, type SlideQ,
} from '../../lib/live';
import { IcChevronD, IcClose } from '../../ui/icons';

/** Тақтадағы «Сынып» панелі: оқушылар телефоннан қосылады, мұғалім сұрақ жібереді, нәтиже бірден көрінеді */
export default function LivePanel({ open, onClose, deck, at, title, onNames }: {
  open: boolean; onClose: () => void; deck: DeckData | null; at: number; title: string; onNames: (n: string[]) => void;
}) {
  const [all, setAll] = useState(false);
  const [s, setS] = useState<LiveSession | null>(null);
  const [people, setPeople] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [big, setBig] = useState(false);
  const [wall, setWall] = useState<'res' | 'top' | null>(null); // тақтаға толық экран: нәтиже немесе үздіктер
  // Жауабы ашылған сұрақтар (үздіктер тізімі үшін), сессия бойынша құрылғыда сақталады
  const [hist, setHist] = useState<LiveQuestion[]>([]);
  useEffect(() => { try { setHist(s ? JSON.parse(localStorage.getItem('fs-live-hist-' + s.id) || '[]') : []); } catch { setHist([]); } }, [s?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [qr, setQr] = useState('');
  const ch = useRef<RealtimeChannel | null>(null);
  const timer = useRef(0);

  useEffect(() => { myOpenSession().then((x) => x && setS(x)).catch(() => {}); }, []);
  const refresh = useCallback(() => {
    if (!s) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => { const r = await loadRoom(s.id); setPeople(r.people); setAnswers(r.answers); }, 150);
  }, [s]);
  useEffect(() => {
    if (!s) return;
    refresh();
    ch.current = teacherChannel(s, refresh);
    QRCode.toDataURL(joinUrl(s.code), { margin: 1, width: 640, color: { dark: '#0b0b0c', light: '#ffffff' } }).then(setQr).catch(() => {});
    const t = setInterval(() => { if (!document.hidden) refresh(); }, 5000);
    return () => { clearInterval(t); void ch.current?.unsubscribe(); ch.current = null; };
  }, [s?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onNames(people.map((p) => p.name)); }, [people]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setBusy(true); setErr('');
    try { setS(await startSession(title)); } catch { setErr('Сабақты бастау мүмкін болмады. Интернетті тексеріңіз.'); }
    setBusy(false);
  };
  const stop = async () => { if (!s) return; await endSession(s.id); setS(null); setPeople([]); setAnswers([]); setBig(false); setWall(null); };
  const put = async (q: LiveQuestion | null) => {
    if (!s) return;
    setErr('');
    const prev = s; setS({ ...s, question: q });
    if (q?.reveal && q.correct && !hist.some((h) => h.id === q.id)) {
      const h = [...hist, q]; setHist(h); try { localStorage.setItem('fs-live-hist-' + s.id, JSON.stringify(h)); } catch { /* */ }
    }
    try { await setQuestion(s, q, ch.current); } catch { setS(prev); setErr('Сұрақты жіберу мүмкін болмады.'); }
  };
  const q = s?.question || null;
  const mine = useMemo(() => (q ? answers.filter((a) => a.qid === q.id) : []), [answers, q]);
  const slides = deck?.slides || null;
  const items = useMemo(() => fromSlide(slides?.[at] || null), [slides, at]);
  const lesson = useMemo(() => (slides ? fromDeck(slides).filter((x) => x.at !== at) : []), [slides, at]);
  const quiz = useMemo(() => quizOf(deck), [deck]);
  const showAll = all || (items.length === 0 && quiz.length === 0);
  const send = ({ tag: _t, ...x }: SlideQ) => put({ ...x, open: true, reveal: false });

  return (
    <>
      <aside className={`bd-live${open ? ' bd-live--open' : ''}`} aria-label="Сынып панелі" aria-hidden={!open}>
        <div className="bd-live__head"><b>Сынып</b><button className="bd-x" type="button" onClick={onClose} aria-label="Жабу"><IcClose /></button></div>
        {!s ? (
          <div className="bd-live__intro">
            <p>Оқушылар телефоннан қосылып, сұрақтарға жауап береді. Тіркелу керек емес — тақтадағы кодты енгізсе болғаны.</p>
            <button className="bd-pill" type="button" onClick={start} disabled={busy}>Сабақты бастау</button>
            {err && <p className="bd-live__err">{err}</p>}
          </div>
        ) : <>
          <div className="bd-live__code">
            <button type="button" className="bd-live__qr" onClick={() => setBig(true)} aria-label="Кодты үлкейту">{qr && <img src={qr} alt="QR-код" />}</button>
            <div><small>{location.host}/s</small><b>{s.code.slice(0, 3)} {s.code.slice(3)}</b>
              <button type="button" className="bd-link" onClick={() => setBig(true)}>Үлкейтіп көрсету</button></div>
          </div>
          <div className="bd-live__people">
            <small>Қосылды: <b>{people.length}</b>{q ? <> · жауап берді: <b>{mine.length}</b></> : null}</small>
            <div>{people.map((p) => <span key={p.id} className={q && mine.some((a) => a.participant_id === p.id) ? 'on' : ''}>{p.name}</span>)}</div>
          </div>
          {hist.length > 0 && <button type="button" className="bd-live__top" onClick={() => setWall('top')}>Үздіктер · {hist.length} сұрақ</button>}
          {q ? <Results q={q} answers={mine} people={people} onPut={put} onWall={() => setWall('res')} />
            : <div className="bd-live__ask">
              {items.length > 0 && <><small>Осы слайдтан</small>
                <div className="bd-live__list">{items.map((x, k) => <QBtn key={k} q={x} n={k + 1} onSend={send} />)}</div></>}
              {quiz.length > 0 && <><small>Сабақтың тесті · A / B / C / D</small>
                <div className="bd-live__list">{quiz.map((x, k) => <QBtn key={k} q={x} n={k + 1} onSend={send} />)}</div></>}
              {lesson.length > 0 && <>
                <button type="button" className="bd-live__more" aria-expanded={showAll} onClick={() => setAll(!showAll)}>Сабақтың барлық сұрақтары ({lesson.length}) <IcChevronD className={showAll ? 'up' : ''} /></button>
                {showAll && <div className="bd-live__list">{lesson.map((x, k) => <QBtn key={k} q={x.q} n={x.at + 1} slide onSend={send} />)}</div>}
              </>}
              <small>Жылдам сұрақ</small>
              <div className="bd-live__quick">{QUICK.map((x) => <button key={x.label} type="button" onClick={() => put({ ...x.make(), open: true, reveal: false })}>{x.label}</button>)}</div>
            </div>}
          {err && <p className="bd-live__err">{err}</p>}
          <button type="button" className="bd-link bd-live__end" onClick={stop}>Сабақты аяқтау</button>
        </>}
      </aside>
      {wall && s && (
        <div className="bd-wall" onClick={() => setWall(null)} role="dialog" aria-label={wall === 'res' ? 'Нәтиже' : 'Үздіктер'}>
          {wall === 'res' && q ? <WallResults q={q} answers={mine} total={people.length} /> : <Leaders hist={hist} answers={answers} people={people} />}
          <small className="bd-wall__x">Жабу үшін басыңыз</small>
        </div>
      )}
      {big && s && (
        <div className="bd-joinbig" onClick={() => setBig(false)}>
          {qr && <img src={qr} alt="QR-код" />}
          <div><p>Телефоннан ашыңдар:</p><b className="bd-joinbig__url">{location.host}/s</b><p>Код:</p><b className="bd-joinbig__code">{s.code.slice(0, 3)} {s.code.slice(3)}</b>
            <p className="bd-joinbig__n">Қосылды: {people.length}</p></div>
        </div>
      )}
    </>
  );
}

function QBtn({ q, n, slide, onSend }: { q: SlideQ; n: number; slide?: boolean; onSend: (q: SlideQ) => void }) {
  const lvl = q.tag && /^[ABC]$/.test(q.tag) ? q.tag : '';
  return (
    <button type="button" onClick={() => onSend(q)} title={q.correct ? `Жауабы: ${q.correct}` : undefined}>
      <i className={slide ? 'bd-live__sn' : ''}>{slide ? n : lvl || n}</i>
      <span>{q.text}{q.tag !== 'T' && q.options && <em> · {q.options.join(' / ')}</em>}{slide && lvl && <em> · {lvl} деңгей</em>}</span>
    </button>
  );
}

function Results({ q, answers, people, onPut, onWall }: { q: LiveQuestion; answers: Answer[]; people: Participant[]; onPut: (q: LiveQuestion | null) => void; onWall: () => void }) {
  const total = answers.length;
  const name = (pid: string) => people.find((p) => p.id === pid)?.name || '';
  const groups = useMemo(() => {
    if (q.kind === 'choice') return (q.options || []).map((o) => ({ key: o, label: o, n: answers.filter((a) => a.answer === o).length, ok: q.correct ? q.correct === o : null, who: [] as string[] }));
    const m = new Map<string, { key: string; label: string; n: number; ok: boolean | null; who: string[] }>();
    for (const a of answers) {
      const k = norm(a.answer), g = m.get(k) || { key: k, label: a.answer, n: 0, ok: isCorrect(q, a.answer), who: [] };
      g.n++; g.who.push(name(a.participant_id)); m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [q, answers, people]); // eslint-disable-line react-hooks/exhaustive-deps
  const right = q.correct ? answers.filter((a) => isCorrect(q, a.answer)).length : null;
  const max = Math.max(1, ...groups.map((g) => g.n));
  return (
    <div className="bd-live__res">
      <p className="bd-live__qtext">{q.text}</p>
      <div className="bd-live__bars">
        {groups.length === 0 && <p className="bd-live__muted">Жауаптар күтілуде…</p>}
        {groups.slice(0, 8).map((g) => (
          <div key={g.key} className={`bd-bar${q.reveal && g.ok ? ' bd-bar--ok' : ''}${q.reveal && g.ok === false ? ' bd-bar--bad' : ''}`}>
            <span className="bd-bar__l" title={g.who.join(', ')}>{g.label}{!q.correct && (q.kind === 'choice' || g.n > 0) && <button type="button" className="bd-link" onClick={() => onPut({ ...q, correct: g.label })}>дұрыс</button>}</span>
            <span className="bd-bar__t"><i style={{ width: `${(g.n / max) * 100}%` }} /></span>
            <b>{g.n}</b>
          </div>
        ))}
      </div>
      {q.reveal && right !== null && total > 0 && <p className="bd-live__score">Дұрыс: <b>{right}</b> / {total} ({Math.round((right / total) * 100)}%)</p>}
      {q.correct && !q.reveal && <p className="bd-live__muted">Дұрыс жауап: оқушыларға әлі көрсетілмеген.</p>}
      <div className="bd-live__btns">
        <button type="button" className="bd-pill" onClick={onWall}>Тақтаға шығару</button>
        {q.open ? <button type="button" className="bd-pill bd-pill--ghost" onClick={() => onPut({ ...q, open: false })}>Жауап қабылдауды жабу</button>
          : <button type="button" className="bd-pill bd-pill--ghost" onClick={() => onPut({ ...q, open: true })}>Қайта ашу</button>}
        {!q.reveal && <button type="button" className="bd-pill" disabled={!q.correct} onClick={() => onPut({ ...q, open: false, reveal: true })}>{q.correct ? 'Жауапты көрсету' : 'Дұрыс жауапты белгілеңіз'}</button>}
        <button type="button" className="bd-pill bd-pill--ghost" onClick={() => onPut(null)}>Жаңа сұрақ</button>
      </div>
    </div>
  );
}

/** Нәтиже тақтада толық экранда: сынып алыстан көреді */
function WallResults({ q, answers, total }: { q: LiveQuestion; answers: Answer[]; total: number }) {
  const groups = useMemo(() => {
    if (q.kind === 'choice') return (q.options || []).map((o) => ({ label: o, n: answers.filter((a) => a.answer === o).length, ok: q.correct ? q.correct === o : null }));
    const m = new Map<string, { label: string; n: number; ok: boolean | null }>();
    for (const a of answers) { const k = norm(a.answer), g = m.get(k) || { label: a.answer, n: 0, ok: isCorrect(q, a.answer) }; g.n++; m.set(k, g); }
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 6);
  }, [q, answers]);
  const max = Math.max(1, ...groups.map((g) => g.n));
  const right = q.correct ? answers.filter((a) => isCorrect(q, a.answer)).length : null;
  return (
    <div className="bd-wall__in">
      <p className="bd-wall__q">{q.text}</p>
      <div className="bd-wall__bars">
        {groups.map((g, k) => (
          <div key={k} className={`bd-wbar${q.reveal && g.ok ? ' bd-wbar--ok' : ''}${q.reveal && g.ok === false ? ' bd-wbar--bad' : ''}`}>
            <span className="bd-wbar__l">{q.kind === 'choice' && (q.options?.length || 0) > 2 ? <b>{'ABCDEF'[k]}</b> : null}{g.label}</span>
            <span className="bd-wbar__t"><i style={{ width: `${(g.n / max) * 100}%` }} /></span>
            <em className="tabular">{g.n}</em>
          </div>
        ))}
        {!groups.length && <p className="bd-wall__wait">Жауаптар күтілуде…</p>}
      </div>
      <p className="bd-wall__foot">Жауап берді: <b>{answers.length}</b> / {total}{q.reveal && right !== null && answers.length > 0 ? <> · Дұрыс: <b>{Math.round((right / answers.length) * 100)}%</b></> : null}</p>
    </div>
  );
}

/** Үздіктер: жауабы ашылған сұрақтар бойынша дұрыс жауап саны */
function Leaders({ hist, answers, people }: { hist: LiveQuestion[]; answers: Answer[]; people: Participant[] }) {
  const rows = people.map((p) => {
    const n = hist.filter((h) => answers.some((a) => a.participant_id === p.id && a.qid === h.id && isCorrect(h, a.answer))).length;
    return { name: p.name, n };
  }).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)).slice(0, 10);
  return (
    <div className="bd-wall__in">
      <p className="bd-wall__q">Үздіктер · {hist.length} сұрақ</p>
      <ol className="bd-lead">
        {rows.map((r, k) => <li key={r.name + k} className={k < 3 && r.n > 0 ? `bd-lead--${k + 1}` : ''}><b className="tabular">{k + 1}</b><span>{r.name}</span><em className="tabular">{r.n} / {hist.length}</em></li>)}
        {!rows.length && <p className="bd-wall__wait">Әзірге ешкім жоқ.</p>}
      </ol>
    </div>
  );
}
