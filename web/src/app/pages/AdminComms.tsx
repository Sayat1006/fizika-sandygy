import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { NOTICE_KIND, SUBSCRIBE_CTA, dayLabel, hm, type Msg, type Notice, type NoticeKind } from '../lib/comms';
import { dmy, sb, type Profile } from '../lib/data';
import { Segmented, useToast } from '../ui/kit';
import { ChatView, NoticeCard } from './cabinet/Comms';

const KINDS = Object.keys(NOTICE_KIND) as NoticeKind[];
const CTA_PRESETS: { label: string; url: string }[] = [
  { label: 'Жоқ', url: '' }, { label: 'Жазылым терезесі', url: SUBSCRIBE_CTA }, { label: 'Сілтеме', url: 'https://' },
];

/** Әкімші: барлық мұғалімге хабарландыру (мерекелік құттықтау, жеңілдік, жаңарту, хабар) */
export function AdminNotices({ users }: { users: number }) {
  const toast = useToast();
  const [list, setList] = useState<Notice[]>([]);
  const [reads, setReads] = useState<Record<string, number>>({});
  const [kind, setKind] = useState<NoticeKind>('holiday');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ctaMode, setCtaMode] = useState(0);
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [until, setUntil] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const [a, r] = await Promise.all([sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(50), sb.from('announcement_reads').select('announcement_id').limit(20000)]);
    setList((a.data as Notice[]) || []);
    const c: Record<string, number> = {}; ((r.data as { announcement_id: string }[]) || []).forEach((x) => { c[x.announcement_id] = (c[x.announcement_id] || 0) + 1; }); setReads(c);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const url = ctaMode === 1 ? SUBSCRIBE_CTA : ctaMode === 2 ? ctaUrl.trim() : '';
  const label = ctaMode ? (ctaLabel.trim() || (ctaMode === 1 ? 'Жазылуды рәсімдеу' : 'Толығырақ')) : '';
  const draft = { kind, title: title.trim(), body: body.trim(), cta_label: label || null, cta_url: url || null };
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!draft.title) return;
    if (ctaMode === 2 && !/^(https?:\/\/[^\s]+|\/[^\s]*)$/.test(url)) return toast('Сілтеме https://… немесе /… түрінде болсын');
    setBusy(true);
    const { error } = await sb.from('announcements').insert({ ...draft, ends_at: until ? new Date(until + 'T23:59:59+05:00').toISOString() : null });
    setBusy(false);
    if (error) return toast('Қате: ' + error.message);
    toast('Жіберілді: мұғалімдер кабинетке кіргенде бір рет көреді'); setTitle(''); setBody(''); setCtaMode(0); setCtaLabel(''); setCtaUrl(''); setUntil(''); void load();
  };
  const toggle = async (n: Notice) => { const { error } = await sb.from('announcements').update({ active: !n.active }).eq('id', n.id); if (error) toast(error.message); else void load(); };
  const del = async (n: Notice) => { if (!confirm(`«${n.title}» өшірілсін бе?`)) return; const { error } = await sb.from('announcements').delete().eq('id', n.id); if (error) toast(error.message); else void load(); };
  const now = new Date().toISOString();

  return (
    <section className="adm__sec">
      <h2 className="t-headline">Хабарландырулар</h2>
      <p className="hint">Барлық мұғалімге кабинеттің басты бетінде бір рет шығады. Мерзімі өткен соң (немесе өшірсеңіз) жаңа кірген мұғалімдерге көрінбейді.</p>
      <div className="annc">
        <form className="form annc__form" onSubmit={submit}>
          <div className="annc__kinds" role="radiogroup" aria-label="Түрі">
            {KINDS.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} className={`annc__kind${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}><span aria-hidden>{NOTICE_KIND[k].icon}</span>{NOTICE_KIND[k].label}</button>
            ))}
          </div>
          <label className="field"><span>Тақырып</span><input className="input" value={title} maxLength={120} required onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'holiday' ? 'Наурыз мерекесімен!' : kind === 'sale' ? 'Жылдық жазылымға −30%' : kind === 'update' ? 'Жаңа 3D видеолар қосылды' : 'Маңызды хабар'} /></label>
          <label className="field"><span>Мәтін</span><textarea className="input" rows={4} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Қысқа әрі жылы сөздер…" /></label>
          <Segmented label="Түйме" value={ctaMode} onChange={setCtaMode} items={CTA_PRESETS.map((c, i) => ({ value: i, label: c.label }))} />
          {ctaMode > 0 && (
            <div className="annc__cta">
              <label className="field"><span>Түйме мәтіні</span><input className="input" value={ctaLabel} maxLength={40} onChange={(e) => setCtaLabel(e.target.value)} placeholder={ctaMode === 1 ? 'Жазылуды рәсімдеу' : 'Толығырақ'} /></label>
              {ctaMode === 2 && <label className="field"><span>Сілтеме</span><input className="input" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://… немесе /samples" /></label>}
            </div>
          )}
          <label className="field"><span>Көрсету мерзімі (бос болса — шектеусіз)</span><input className="input" type="date" value={until} onChange={(e) => setUntil(e.target.value)} /></label>
          <button className="btn btn--lg btn--primary btn--block" type="submit" disabled={busy || !draft.title}>Барлық мұғалімге жіберу</button>
        </form>
        <div className="annc__pv">
          <span className="t-small">Алдын ала көрініс</span>
          <div className="annc__frame"><NoticeCard n={draft} onClose={() => {}} /></div>
        </div>
      </div>

      {list.length > 0 && (
        <div className="group annc__list">
          {list.map((n) => {
            const live = n.active && n.starts_at <= now && (!n.ends_at || n.ends_at > now);
            return (
              <div key={n.id} className="group__row group__row--static">
                <span className="annc__ic" aria-hidden>{NOTICE_KIND[n.kind].icon}</span>
                <span className="group__t"><b>{n.title}</b><br /><span className="t-small">{dmy(n.created_at)}{n.ends_at ? ` → ${dmy(n.ends_at)}` : ''} · көрді: {reads[n.id] || 0} / {users}</span></span>
                <span className={`chip chip--${live ? 'ok' : 'warn'}`}>{live ? 'Белсенді' : n.active ? 'Мерзімі өтті' : 'Тоқтатылған'}</span>
                <div className="adm__acts"><button className="btn btn--sm" type="button" onClick={() => toggle(n)}>{n.active ? 'Тоқтату' : 'Қосу'}</button><button className="btn btn--sm btn--danger" type="button" onClick={() => del(n)}>Өшіру</button></div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Әкімші: мұғалімдермен хат алмасу */
export function AdminInbox({ profiles }: { profiles: Profile[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const load = useCallback(async () => { const { data } = await sb.from('messages').select('*').order('created_at', { ascending: false }).limit(2000); setMsgs((data as Msg[]) || []); }, []);
  useEffect(() => { void load(); const t = setInterval(() => void load(), 20000); return () => clearInterval(t); }, [load]);
  const pmap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const threads = useMemo(() => {
    const m = new Map<string, { uid: string; last: Msg; unread: number }>();
    for (const x of msgs) { const t = m.get(x.user_id) || { uid: x.user_id, last: x, unread: 0 }; if (!x.from_admin && !x.read_at) t.unread++; m.set(x.user_id, t); }
    return [...m.values()].sort((a, b) => (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0) || b.last.created_at.localeCompare(a.last.created_at));
  }, [msgs]);
  const total = threads.reduce((s, t) => s + t.unread, 0);
  const p = sel ? pmap.get(sel) : undefined;
  return (
    <section className="adm__sec">
      <h2 className="t-headline">Хаттар{total > 0 && <span className="umenu__badge" style={{ marginLeft: 10 }}>{total}</span>}</h2>
      {threads.length === 0 ? <div className="empty">Әзірге хат жоқ. Мұғалімдер кабинеттегі «Әкімшіге жазу» арқылы жаза алады.</div> : (
        <div className="inbox">
          <div className="inbox__list group">
            {threads.map((t) => { const u = pmap.get(t.uid); return (
              <button key={t.uid} type="button" className={`group__row inbox__row${sel === t.uid ? ' on' : ''}`} onClick={() => { setSel(t.uid); setTimeout(() => void load(), 600); }}>
                <span className="umenu__av" aria-hidden>{(u?.full_name || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()}</span>
                <span className="group__t"><b>{u?.full_name || 'Мұғалім'}</b><br /><span className="t-small inbox__prev">{t.last.from_admin ? 'Сіз: ' : ''}{t.last.body}</span></span>
                <span className="inbox__meta"><span className="t-small">{dayLabel(t.last.created_at) === 'Бүгін' ? hm(t.last.created_at) : dayLabel(t.last.created_at)}</span>{t.unread > 0 && <span className="umenu__badge">{t.unread}</span>}</span>
              </button>
            ); })}
          </div>
          <div className="inbox__chat">
            {sel ? <>
              <div className="inbox__head"><b>{p?.full_name || 'Мұғалім'}</b><span className="t-small">{[p?.phone, p?.school].filter(Boolean).join(' · ')}</span></div>
              <ChatView uid={sel} admin peer={p?.full_name} />
            </> : <div className="empty">Сол жақтан хатты таңдаңыз</div>}
          </div>
        </div>
      )}
    </section>
  );
}
