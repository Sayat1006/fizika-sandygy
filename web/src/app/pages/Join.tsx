import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { answer, isCorrect, join, loadMe, saveMe, state, studentChannel, type Me, type StudentState } from '../lib/live';
import { Mark } from '../ui/icons';
import { Note } from '../ui/kit';

/** /s — оқушы телефоннан сабаққа қосылады (тіркелусіз): код + аты → мұғалімнің сұрақтарына жауап */
export default function Join() {
  const [code, setCode] = useState(() => (new URLSearchParams(location.search).get('c') || '').replace(/\D/g, '').slice(0, 6));
  const [me, setMe] = useState<Me | null>(() => (code.length === 6 ? loadMe(code) : null));
  const [title, setTitle] = useState('');
  useEffect(() => { document.title = 'Сабаққа қосылу · Сабақтас'; }, []);
  return (
    <div className="join">
      <header className="join__top"><Mark /><span>Сабақтас</span>{me && <b>{me.name}</b>}</header>
      <main className="join__main">
        {me ? <Room code={code} me={me} title={title} onLeave={() => { setMe(null); }} />
          : <Enter code={code} setCode={setCode} onJoined={(m, t) => { saveMe(code, m); setMe(m); setTitle(t); }} />}
      </main>
    </div>
  );
}

function Enter({ code, setCode, onJoined }: { code: string; setCode: (c: string) => void; onJoined: (m: Me, title: string) => void }) {
  const [name, setName] = useState(() => { try { return localStorage.getItem('fs-live-name') || ''; } catch { return ''; } });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await join(code, name.trim());
      try { localStorage.setItem('fs-live-name', name.trim()); } catch { /* */ }
      onJoined({ pid: r.pid, secret: r.secret, name: name.trim() }, r.title);
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };
  return (
    <form className="join__card form" onSubmit={submit}>
      <h1>Сабаққа қосылу</h1>
      <p className="t-muted">Тақтадағы кодты және атыңды жаз.</p>
      <label className="field"><span>Код</span>
        <input className="input join__code" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required pattern="[0-9]{6}" /></label>
      <label className="field"><span>Атың және тегің</span>
        <input className="input" autoComplete="name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Айгүл С." /></label>
      <Note>{err}</Note>
      <button className="btn btn--lg btn--primary btn--block" type="submit" disabled={busy || code.length !== 6 || !name.trim()}>Қосылу</button>
    </form>
  );
}

function Room({ code, me, title, onLeave }: { code: string; me: Me; title: string; onLeave: () => void }) {
  const [st, setSt] = useState<StudentState | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const ch = useRef<RealtimeChannel | null>(null);
  const qid = st?.question?.id;

  const refresh = useCallback(async () => {
    try { const s = await state(code, me); setSt(s); if (!s.ended && !s.joined) onLeave(); } catch { /* желі — келесі жолы */ }
  }, [code, me, onLeave]);
  useEffect(() => {
    void refresh();
    ch.current = studentChannel(code, () => void refresh());
    const t = setInterval(() => { if (!document.hidden) void refresh(); }, 4000); // хабар келмей қалса
    const v = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', v);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', v); void ch.current?.unsubscribe(); };
  }, [code, refresh]);
  useEffect(() => { setDraft(''); setErr(''); }, [qid]);

  const send = async (a: string) => {
    if (!st?.question) return;
    setSending(true); setErr('');
    try {
      const ok = await answer(code, me, st.question.id, a, ch.current);
      if (ok) { setSt({ ...st, mine: a }); if ('vibrate' in navigator) navigator.vibrate?.(30); }
      else { setErr('Жауап қабылданбады: сұрақ жабылған болуы мүмкін.'); void refresh(); }
    } catch { setErr('Желі қатесі. Қайталап көр.'); }
    setSending(false);
  };

  if (!st) return <div className="join__card join__wait"><div className="join__spin" /><p>Қосылып жатыр…</p></div>;
  if (st.ended) return <div className="join__card join__wait"><h2>Сабақ аяқталды</h2><p className="t-muted">Қатысқаның үшін рахмет!</p></div>;
  const q = st.question;
  if (!q) return <div className="join__card join__wait"><div className="join__pulse" /><h2>Сен сабақтасың!</h2><p className="t-muted">{st.title || title ? `«${st.title || title}». ` : ''}Мұғалім сұрақ жібергенше күт.</p></div>;

  const ok = q.reveal && st.mine ? isCorrect(q, st.mine) : null;
  return (
    <div className="join__card join__q">
      <p className="join__qtext">{q.text}</p>
      {q.kind === 'choice' ? (
        <div className={`join__opts${(q.options?.length || 0) > 3 ? ' join__opts--grid' : ''}`}>
          {q.options?.map((o) => {
            const picked = st.mine === o, right = q.reveal && q.correct === o;
            return <button key={o} type="button" disabled={!q.open || sending} aria-pressed={picked}
              className={`join__opt${picked ? ' join__opt--on' : ''}${right ? ' join__opt--ok' : ''}${q.reveal && picked && !right ? ' join__opt--bad' : ''}`} onClick={() => send(o)}>{o}</button>;
          })}
        </div>
      ) : (
        <form className="form" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) void send(draft.trim()); }}>
          <input className="input join__text" inputMode={q.kind === 'number' ? 'decimal' : 'text'} maxLength={200} value={draft} disabled={!q.open}
            onChange={(e) => setDraft(e.target.value)} placeholder={st.mine ? `Жауабың: ${st.mine}` : q.kind === 'number' ? 'Мысалы: 2,5' : 'Жауабың'} />
          <button className="btn btn--lg btn--primary btn--block" type="submit" disabled={!q.open || sending || !draft.trim()}>{st.mine ? 'Жаңарту' : 'Жіберу'}</button>
        </form>
      )}
      <Note>{err}</Note>
      {st.mine && !q.reveal && <p className="join__sent">✓ Жауабың қабылданды{q.open ? '. Өзгертуге болады.' : '.'}</p>}
      {q.reveal && (
        <div className={`join__res${ok === true ? ' join__res--ok' : ok === false ? ' join__res--bad' : ''}`}>
          {ok === true ? 'Дұрыс! Жарайсың!' : ok === false ? 'Қате.' : st.mine ? 'Жауабың жіберілді.' : 'Сен жауап бермедің.'}
          {q.correct && <span>Дұрыс жауап: <b>{q.correct}</b></span>}
        </div>
      )}
      {!q.open && !q.reveal && <p className="t-muted">Жауап қабылдау жабылды.</p>}
    </div>
  );
}
