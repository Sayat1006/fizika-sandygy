import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import type { Slide } from '../../deck/types';
import {
  QUICK, endSession, fromSlide, isCorrect, joinUrl, loadRoom, myOpenSession, norm, setQuestion, startSession, teacherChannel,
  type Answer, type LiveQuestion, type LiveSession, type Participant,
} from '../../lib/live';

/** Тақтадағы «Сынып» панелі: оқушылар телефоннан қосылады, мұғалім сұрақ жібереді, нәтиже бірден көрінеді */
export default function LivePanel({ open, onClose, slide, title, onNames }: {
  open: boolean; onClose: () => void; slide: Slide | null; title: string; onNames: (n: string[]) => void;
}) {
  const [s, setS] = useState<LiveSession | null>(null);
  const [people, setPeople] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [big, setBig] = useState(false);
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
  const stop = async () => { if (!s) return; await endSession(s.id); setS(null); setPeople([]); setAnswers([]); setBig(false); };
  const put = async (q: LiveQuestion | null) => {
    if (!s) return;
    setErr('');
    const prev = s; setS({ ...s, question: q });
    try { await setQuestion(s, q, ch.current); } catch { setS(prev); setErr('Сұрақты жіберу мүмкін болмады.'); }
  };
  const q = s?.question || null;
  const mine = useMemo(() => (q ? answers.filter((a) => a.qid === q.id) : []), [answers, q]);
  const items = useMemo(() => fromSlide(slide), [slide]);

  return (
    <>
      <aside className={`bd-live${open ? ' bd-live--open' : ''}`} aria-label="Сынып панелі" aria-hidden={!open}>
        <div className="bd-live__head"><b>Сынып</b><button className="bd-x" type="button" onClick={onClose} aria-label="Жабу">×</button></div>
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
          {q ? <Results q={q} answers={mine} people={people} onPut={put} />
            : <div className="bd-live__ask">
              {items.length > 0 && <><small>Осы слайдтан</small>
                <div className="bd-live__list">{items.map((x, k) => <button key={k} type="button" onClick={() => put({ ...x, open: true, reveal: false })}><i>{k + 1}</i>{x.text}</button>)}</div></>}
              <small>Жылдам сұрақ</small>
              <div className="bd-live__quick">{QUICK.map((x) => <button key={x.label} type="button" onClick={() => put({ ...x.make(), open: true, reveal: false })}>{x.label}</button>)}</div>
            </div>}
          {err && <p className="bd-live__err">{err}</p>}
          <button type="button" className="bd-link bd-live__end" onClick={stop}>Сабақты аяқтау</button>
        </>}
      </aside>
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

function Results({ q, answers, people, onPut }: { q: LiveQuestion; answers: Answer[]; people: Participant[]; onPut: (q: LiveQuestion | null) => void }) {
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
        {q.open ? <button type="button" className="bd-pill bd-pill--ghost" onClick={() => onPut({ ...q, open: false })}>Жауап қабылдауды жабу</button>
          : <button type="button" className="bd-pill bd-pill--ghost" onClick={() => onPut({ ...q, open: true })}>Қайта ашу</button>}
        {!q.reveal && <button type="button" className="bd-pill" disabled={!q.correct} onClick={() => onPut({ ...q, open: false, reveal: true })}>{q.correct ? 'Жауапты көрсету' : 'Дұрыс жауапты белгілеңіз'}</button>}
        <button type="button" className="bd-pill bd-pill--ghost" onClick={() => onPut(null)}>Жаңа сұрақ</button>
      </div>
    </div>
  );
}
