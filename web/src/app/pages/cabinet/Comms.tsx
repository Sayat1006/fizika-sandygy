import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../lib/account';
import { NOTICE_KIND, SUBSCRIBE_CTA, dayLabel, hm, loadThread, markNoticeSeen, markRead, pingUnread, sendMsg, unseenNotices, type Msg, type Notice } from '../../lib/comms';
import { Sheet, useToast } from '../../ui/kit';

/** Хабарландыру карточкасы (кабинетте де, әкімшінің алдын ала қарауында да) */
export function NoticeCard({ n, onCta, onClose }: { n: Pick<Notice, 'kind' | 'title' | 'body' | 'cta_label' | 'cta_url'>; onCta?: () => void; onClose?: () => void }) {
  const k = NOTICE_KIND[n.kind];
  return (
    <div className={`notice notice--${n.kind}`}>
      <div className="notice__art" aria-hidden><span className="notice__ic">{k.icon}</span><i /><i /><i /></div>
      <div className="notice__b">
        <span className="notice__k">{k.label}</span>
        <h2 className="notice__t">{n.title || 'Тақырып'}</h2>
        {n.body && <p className="notice__p">{n.body}</p>}
        <div className="notice__acts">
          {n.cta_label && n.cta_url && <button className="btn btn--lg btn--primary" type="button" onClick={onCta}>{n.cta_label}</button>}
          {onClose && <button className="btn btn--lg notice__ok" type="button" onClick={onClose}>{n.cta_label && n.cta_url ? 'Кейін' : 'Түсінікті'}</button>}
        </div>
      </div>
    </div>
  );
}

/** Басты бетте әр хабарландыру бір рет шығады (көрсе — announcement_reads-қа жазылады) */
export function NoticePopup({ onSubscribe }: { onSubscribe: () => void }) {
  const { session } = useAccount();
  const nav = useNavigate();
  const [queue, setQueue] = useState<Notice[]>([]);
  const ref = useRef<HTMLDialogElement>(null);
  const uid = session?.user.id;
  useEffect(() => { if (!uid) return; const t = setTimeout(() => unseenNotices(uid).then(setQueue), 700); return () => clearTimeout(t); }, [uid]);
  const cur = queue[0];
  useEffect(() => { const d = ref.current; if (!d) return; if (cur && !d.open) d.showModal(); if (!cur && d.open) d.close(); }, [cur]);
  if (!cur) return <dialog ref={ref} className="sheet notice-dlg" />;
  const done = () => { void markNoticeSeen(cur.id); setQueue((q) => q.slice(1)); };
  const cta = () => {
    const u = cur.cta_url || ''; done();
    if (u === SUBSCRIBE_CTA) onSubscribe();
    else if (u.startsWith('/')) nav(u);
    else if (u) window.open(u, '_blank', 'noopener');
  };
  return (
    <dialog ref={ref} className="sheet notice-dlg" aria-label={cur.title} onCancel={(e) => { e.preventDefault(); done(); }} onClick={(e) => { if (e.target === ref.current) done(); }}>
      <NoticeCard n={cur} onCta={cta} onClose={done} />
      {queue.length > 1 && <div className="notice__more">тағы {queue.length - 1} хабарландыру</div>}
    </dialog>
  );
}

/** Хат алмасу терезесі (мұғалім мен әкімші екеуі қолданады) */
export function ChatView({ uid, admin, peer }: { uid: string; admin?: boolean; peer?: string }) {
  const toast = useToast();
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const load = async () => { const m = await loadThread(uid); setMsgs(m); if (m.some((x) => x.from_admin !== !!admin && !x.read_at)) { await markRead(admin ? uid : undefined); if (!admin) pingUnread(); } };
  useEffect(() => { setMsgs(null); void load(); const t = setInterval(() => void load(), 8000); return () => clearInterval(t); }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs?.length]);
  const send = async (e: FormEvent) => {
    e.preventDefault(); const b = text.trim(); if (!b || busy) return;
    setBusy(true); const { error } = await sendMsg(uid, b, admin); setBusy(false);
    if (error) return toast('Жіберу мүмкін болмады: ' + error.message);
    setText(''); void load();
  };
  let lastDay = '';
  return (
    <div className="chat">
      <div className="chat__list" aria-live="polite">
        {msgs === null ? <div className="skel" style={{ height: 120 }} />
          : msgs.length === 0 ? (
            <div className="chat__empty">
              <span aria-hidden>💬</span>
              <b>{admin ? 'Хат жоқ' : 'Сұрағыңызды жазыңыз'}</b>
              {!admin && <p>Төлем, материалдар, тақта немесе ұсыныс — кез келген сұрақ бойынша жазыңыз. Жауап осы жерге және Telegram-ға келеді.</p>}
            </div>
          ) : msgs.map((m) => {
            const d = dayLabel(m.created_at), mine = m.from_admin === !!admin, show = d !== lastDay; lastDay = d;
            return (
              <Fragment key={m.id}>
                {show && <div className="chat__day">{d}</div>}
                <div className={`bubble${mine ? ' bubble--me' : ''}`}>
                  {!mine && <span className="bubble__who">{admin ? peer || 'Мұғалім' : 'Әкімші'}</span>}
                  <span className="bubble__t">{m.body}</span>
                  <span className="bubble__m">{hm(m.created_at)}{mine && <> · {m.read_at ? 'оқылды' : 'жіберілді'}</>}</span>
                </div>
              </Fragment>
            );
          })}
        <div ref={end} />
      </div>
      <form className="chat__form" onSubmit={send}>
        <textarea className="input chat__in" rows={1} maxLength={4000} placeholder="Хат жазыңыз…" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(e as unknown as FormEvent); } }} aria-label="Хат" />
        <button className="chat__send" type="submit" disabled={!text.trim() || busy} aria-label="Жіберу">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
        </button>
      </form>
    </div>
  );
}

/** Мұғалімнің «Әкімшіге жазу» парақшасы */
export function ChatSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session } = useAccount();
  return (
    <Sheet open={open} onClose={onClose} title="Әкімшіге жазу" sub="Қолдау қызметі">
      <div className="sheet__body">{open && session && <ChatView uid={session.user.id} />}</div>
    </Sheet>
  );
}
