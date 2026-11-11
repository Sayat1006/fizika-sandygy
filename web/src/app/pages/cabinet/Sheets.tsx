import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAccount } from '../../lib/account';
import { CONFIG, GRADES, VARIANT, VARIANTS, week } from '../../lib/config';
import { KIND_LABEL, dm, dmy, money, sb, tgPayLink, viewPages, type Kind, type Lesson, type ViewPages } from '../../lib/data';
import { IcLock } from '../../ui/icons';
import { Note, Segmented, Sheet, useToast } from '../../ui/kit';
import { DownloadAct } from './LessonActions';
import { deleteReview, myReview, sendReview, type Review } from '../../lib/reviews';
import { markSeen } from '../../lib/seen';

/* ───────── Қарау: ҚМЖ, слайд, парақ беттері ───────── */
export function ViewerSheet({ lesson, onClose, onLock }: { lesson: Lesson | null; onClose: () => void; onLock: (g: number) => void }) {
  const { subOf } = useAccount();
  const kinds = lesson ? (['kmzh', 'pres', 'ws'] as Kind[]).filter((k) => lesson[k]) : [];
  const [kind, setKind] = useState<Kind>('kmzh');
  const [cache, setCache] = useState<Partial<Record<Kind, ViewPages | string>>>({});
  useEffect(() => { setCache({}); if (lesson) setKind(kinds[0]); }, [lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!lesson || cache[kind] !== undefined) return;
    viewPages(lesson.v, lesson.n, kind).then((j) => setCache((c) => ({ ...c, [kind]: j }))).catch((e) => setCache((c) => ({ ...c, [kind]: (e as Error).message })));
  }, [lesson, kind, cache]);
  useEffect(() => { if (lesson && kind === 'kmzh' && cache.kmzh && typeof cache.kmzh !== 'string') markSeen(lesson.v, lesson.n); }, [lesson, kind, cache]);
  if (!lesson) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const g = VARIANT[lesson.v]?.grade || lesson.grade, ok = !!subOf(g), data = cache[kind];
  return (
    <Sheet open wide onClose={onClose} title={lesson.topic} sub={`${g}-сынып · №${lesson.disp} · ${dm(lesson.date)}`}
      foot={ok ? <DownloadAct l={lesson} kind={kind} big /> : <><p className="hint" style={{ flex: 1 }}>Толық нұсқасы жазылыммен ашылады.</p><button className="btn btn--primary" type="button" onClick={() => onLock(g)}>Жазылу</button></>}>
      <div style={{ padding: '0 22px 12px' }}>
        <Segmented label="Материал" value={kind} onChange={setKind} items={kinds.map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
      </div>
      <div className="sheet__body viewer">
        {data === undefined ? <div className="viewer__msg">Жүктелуде…</div>
          : typeof data === 'string' ? <div className="viewer__msg">{data}</div>
          : <>
              {data.pages.map((src, i) => (
                <figure key={src} className={`viewer__pg${data.w > data.h ? ' viewer__pg--wide' : ''}`}>
                  <img src={src} alt={`${KIND_LABEL[kind]}, ${i + 1}-бет`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" width={data.w} height={data.h} />
                  <i>{i + 1}/{data.total}</i>
                </figure>
              ))}
              {data.locked && (
                <div className="viewer__lock"><IcLock /><b>Тағы {data.total - data.pages.length} {kind === 'pres' ? 'слайд' : 'бет'}</b><p>Толық нұсқасы {g}-сыныпқа жазылыммен ашылады.</p><button className="btn btn--primary" type="button" onClick={() => onLock(g)}>Жазылу</button></div>
              )}
            </>}
      </div>
    </Sheet>
  );
}

/* ───────── Жазылым: сыныптардың күйі, өтінімдер, жаңа өтінім, төлем ───────── */
export function SubscribeSheet({ open, onClose, preset }: { open: boolean; onClose: () => void; preset: number | null }) {
  const { profile, session, subs, reqs, reload } = useAccount();
  const today = week().today;
  const teaches = (g: number) => (profile?.variants || []).some((v) => v === String(g) || v.startsWith(g + '-'));
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [plan, setPlan] = useState<'month' | 'year'>('month');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pay, setPay] = useState<{ id: string; amount: number; grades: number[]; plan: 'month' | 'year' } | null>(null);
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    setPay(null); setErr('');
    setPicked(new Set(preset ? [preset] : GRADES.filter((g) => profile?.classes_set && teaches(g))));
  }, [open, preset]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = picked.size * CONFIG.prices[plan];
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!picked.size) return;
    setBusy(true); setErr('');
    const grades = [...picked].sort((a, b) => a - b);
    const { data: id, error } = await sb.rpc('request_subscription', { p_grades: grades, p_plan: plan });
    setBusy(false);
    if (error) return setErr('Өтінімді жіберу мүмкін болмады: ' + error.message);
    await reload();
    setPay({ id: String(id), amount: total, grades, plan });
  };
  const status = { pending: ['warn', 'Төлем күтілуде'], approved: ['ok', 'Расталды'], rejected: ['err', 'Қабылданбады'] } as const;
  const waText = pay && `Сәлеметсіз бе! Сабақтас, өтінім №${pay.id.slice(0, 8).toUpperCase()}: ${pay.grades.join(', ')}-сынып, ${pay.plan === 'month' ? '1 ай' : '1 жыл'}, ${money(pay.amount)}. Аты-жөні: ${profile?.full_name}. Email: ${session?.user.email}. Kaspi чегін қоса жіберемін.`;

  return (
    <Sheet open={open} onClose={onClose} title="Жазылым">
      <div className="sheet__body subsheet">
        <div className="group">
          {GRADES.map((g) => {
            const s = subs.find((x) => x.grade === g);
            const chip = s && s.paid_until >= today ? <span className={`chip chip--${s.trial ? 'warn' : 'ok'}`}>{s.trial ? 'Тегін сынақ, ' : ''}{dmy(s.paid_until)} дейін</span>
              : s ? <span className="chip chip--err">Мерзімі өтті</span> : <span className="chip">Жазылым жоқ</span>;
            return <div key={g} className="group__row group__row--static"><span className="group__t">{g}-сынып</span>{chip}</div>;
          })}
        </div>

        {pay ? (
          <div className="pay rise">
            <h3>Төлем</h3>
            <p className="t-muted">1. Сомасын Kaspi Gold-қа аударыңыз. 2. Kaspi чегін Telegram ботқа жіберіңіз. Төлем расталған сәтте жазылым өзі ашылады.</p>
            <div className="group">
              <div className="group__row group__row--static"><span className="group__t">Сомасы</span><b className="tabular">{money(pay.amount)}</b></div>
              <div className="group__row group__row--static"><span className="group__t">Kaspi Gold</span><b className="tabular">{CONFIG.kaspi}</b>
                <button className="link" type="button" onClick={async () => { try { await navigator.clipboard.writeText(CONFIG.kaspi); toast('Көшірілді'); } catch { toast(CONFIG.kaspi); } }}>Көшіру</button></div>
            </div>
            {CONFIG.telegramBot && <a className="btn btn--lg btn--primary btn--block" href={tgPayLink(pay.id)} target="_blank" rel="noopener">Чекті Telegram-ға жіберу</a>}
            <a className="link" style={{ justifySelf: 'center' }} href={`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(waText || '')}`} target="_blank" rel="noopener">Telegram жоқ па? WhatsApp-қа жіберу</a>
            <button className="link" style={{ justifySelf: 'center' }} type="button" onClick={() => setPay(null)}>Жаңа өтінім</button>
          </div>
        ) : (
          <form className="form buy" onSubmit={submit}>
            <h3>Жаңа жазылым</h3>
            <div className="picks">
              {GRADES.map((g) => (
                <label key={g} className="pick"><input type="checkbox" checked={picked.has(g)} onChange={(e) => { const p = new Set(picked); if (e.target.checked) p.add(g); else p.delete(g); setPicked(p); }} /><span>{g}-сынып</span></label>
              ))}
            </div>
            <Segmented label="Мерзімі" large value={plan} onChange={setPlan} items={[
              { value: 'month', label: <>1 ай · {money(CONFIG.prices.month)}</> },
              { value: 'year', label: <>1 жыл · {money(CONFIG.prices.year)}</> },
            ]} />
            <p className="hint">Баға бір сыныпқа көрсетілген.</p>
            <div className="sum"><span>Барлығы</span><b className="tabular">{money(total)}</b></div>
            <Note>{err}</Note>
            <button className="btn btn--lg btn--primary btn--block" type="submit" disabled={!picked.size || busy}>Өтінім жіберу</button>
          </form>
        )}

        {reqs.length > 0 && (
          <div className="reqs">
            <h3>Өтінімдер</h3>
            <div className="group">
              {reqs.map((r) => (
                <div key={r.id} className="group__row group__row--static">
                  <span className="group__t"><span className="t-small">{dmy(r.created_at)}</span><br />{r.grades.join(', ')}-сынып · {r.plan === 'month' ? '1 ай' : '1 жыл'} · {money(r.amount)}</span>
                  {r.status === 'pending' && CONFIG.telegramBot ? <a className="link" href={tgPayLink(r.id)} target="_blank" rel="noopener">Чек жіберу</a>
                    : <span className={`chip chip--${status[r.status][0]}`}>{status[r.status][1]}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/* ───────── Менің сыныптарым: 7–9 бір нұсқа; 10–11 бағыт пен сағат ───────── */
export function ClassesSheet({ open, onClose, ready }: { open: boolean; onClose: () => void; ready: Set<string> }) {
  const { profile, session, patchProfile } = useAccount();
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => { if (open) { setDraft(new Set(profile?.variants || [])); setErr(''); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const on = (g: number) => [...draft].some((v) => v === String(g) || v.startsWith(g + '-'));
  const toggleGrade = (g: number, val: boolean) => {
    const d = new Set(draft);
    if (g < 10) { if (val) d.add(String(g)); else d.delete(String(g)); }
    else if (val) { const pick = VARIANTS.find((x) => x.grade === g && ready.has(x.id)); d.add(pick ? pick.id : `${g}-zhmb-2`); }
    else [...d].filter((x) => x.startsWith(g + '-')).forEach((x) => d.delete(x));
    setDraft(d); setErr('');
  };
  const save = async () => {
    const order = VARIANTS.map((x) => x.id), vs = [...draft].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    if (!vs.length) return setErr('Кемінде бір сыныпты таңдаңыз.');
    setBusy(true);
    const { error } = await sb.from('profiles').update({ variants: vs, classes_set: true }).eq('id', session!.user.id);
    setBusy(false);
    if (error) return setErr('Сақтау мүмкін болмады: ' + error.message);
    patchProfile({ variants: vs, classes_set: true }); toast('Сақталды'); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Менің сыныптарым" foot={<button className="btn btn--lg btn--primary btn--block" type="button" onClick={save} disabled={busy}>Бекіту</button>}>
      <div className="sheet__body">
        <p className="t-muted" style={{ marginBottom: 16 }}>Сабақ беретін сыныптарыңызды белгілеңіз. Кабинет пен Telegram хабарламаларында тек солардың сабақтары шығады.</p>
        <div className="classes">
          {GRADES.map((g) => {
            const sel = [...draft].filter((v) => v.startsWith(g + '-')).map((v) => VARIANT[v]?.short).filter(Boolean);
            return (
              <div key={g} className={`cls${on(g) ? ' cls--on' : ''}`}>
                <label className="cls__head">
                  <span className="cls__n">{g}</span>
                  <span className="cls__t"><b>{g}-сынып</b><small>{g < 10 ? 'Аптасына 2 сағат' : sel.length ? sel.join(', ') : 'Бағыт пен сағатты таңдаңыз'}</small></span>
                  <input type="checkbox" className="switch" checked={on(g)} onChange={(e) => toggleGrade(g, e.target.checked)} />
                </label>
                {g >= 10 && on(g) && (
                  <div className="cls__opts">
                    {(['zhmb', 'kgb'] as const).map((d) => (
                      <div key={d} className="cls__row">
                        <span>{d === 'zhmb' ? 'ЖМБ' : 'ҚГБ'}</span>
                        {[1, 2, 3].map((h) => {
                          const id = `${g}-${d}-${h}`;
                          return (
                            <label key={id} className="pill-check"><input type="checkbox" checked={draft.has(id)} onChange={(e) => { const x = new Set(draft); if (e.target.checked) x.add(id); else x.delete(id); setDraft(x); }} />
                              <span>{h} сағ.{ready.has(id) ? '' : <small> жақында</small>}</span></label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Note>{err}</Note>
      </div>
    </Sheet>
  );
}

/* ───────── Telegram ───────── */
export function TelegramSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, patchProfile } = useAccount();
  const toast = useToast();
  const link = async () => {
    const w = window.open('', '_blank');
    const { data: code, error } = await sb.rpc('tg_link_code');
    if (error) { w?.close(); return toast('Қате: ' + error.message); }
    const url = `https://t.me/${CONFIG.telegramBot}?start=${code}`;
    if (w) w.location.href = url; else location.href = url;
    toast('Telegram-да «Start» батырмасын басыңыз, содан соң осы бетті жаңартыңыз.');
  };
  const unlink = async () => {
    const { error } = await sb.rpc('tg_unlink');
    if (error) return toast('Қате: ' + error.message);
    patchProfile({ tg_chat_id: null }); toast('Telegram ажыратылды');
  };
  return (
    <Sheet open={open} onClose={onClose} title="Telegram">
      <div className="sheet__body form">
        <p className="t-muted">{profile?.tg_chat_id ? 'Қосылған. Дүйсенбі сайын осы аптаның сабақтары туралы хабарлама келеді.' : 'Telegram-ды қоссаңыз, дүйсенбі сайын осы аптаның сабақтары туралы хабарлама аласыз. Төлем расталғанда да хабар келеді.'}</p>
        {profile?.tg_chat_id ? <button className="btn btn--outline" type="button" onClick={unlink}>Ажырату</button> : <button className="btn btn--lg btn--primary" type="button" onClick={link}>Telegram-ды қосу</button>}
      </div>
    </Sheet>
  );
}

/* ───────── Профиль ───────── */
export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, session, patchProfile } = useAccount();
  const toast = useToast();
  const initial = useMemo(() => ({ full_name: profile?.full_name || '', phone: profile?.phone || '', school: profile?.school || '' }), [profile, open]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const upd = { full_name: String(f.get('full_name')).trim(), phone: String(f.get('phone')).trim(), school: String(f.get('school')).trim() };
    const { error } = await sb.from('profiles').update(upd).eq('id', session!.user.id);
    if (error) return toast('Сақтау мүмкін болмады: ' + error.message);
    patchProfile(upd); toast('Сақталды'); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Профиль">
      <form className="sheet__body form" onSubmit={submit} key={String(open)}>
        <label className="field"><span>Аты-жөні</span><input className="input" name="full_name" defaultValue={initial.full_name} required /></label>
        <label className="field"><span>Телефон</span><input className="input" name="phone" type="tel" defaultValue={initial.phone} /></label>
        <label className="field"><span>Мектеп, қала</span><input className="input" name="school" defaultValue={initial.school} /></label>
        <button className="btn btn--lg btn--primary" type="submit">Сақтау</button>
      </form>
    </Sheet>
  );
}

/* ───────── Пікір: басты бетте (әкімші бекіткен соң) жарияланады ───────── */
export function ReviewSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, session } = useAccount();
  const toast = useToast();
  const [mine, setMine] = useState<Review | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (open && session) { setErr(''); myReview(session.user.id).then(setMine); } }, [open, session]);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr('');
    const f = new FormData(e.currentTarget);
    if (!f.get('consent')) return setErr('Жариялауға келісім белгіленбеген.');
    setBusy(true);
    try { await sendReview({ name: String(f.get('name')).trim(), school: String(f.get('school')).trim(), text: String(f.get('text')).trim() }); toast('Рахмет! Пікіріңіз тексерілгеннен кейін басты бетте шығады.'); onClose(); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Пікір қалдыру" sub="Сабақтас сабағыңызға көмектесті ме? Әріптестеріңізге айтыңыз.">
      {mine === undefined ? <div className="sheet__body"><div className="skel" style={{ height: 160 }} /></div>
        : mine ? (
          <div className="sheet__body">
            <blockquote className="rv-mine">«{mine.text}»<small>— {mine.name}{mine.school ? `, ${mine.school}` : ''}</small></blockquote>
            <p className="hint">{mine.approved ? 'Пікіріңіз басты бетте жарияланған. Рахмет!' : 'Пікіріңіз тексерілуде. Бекітілген соң басты бетте шығады.'}</p>
            <button className="btn btn--outline" type="button" onClick={async () => { await deleteReview(mine.id); setMine(null); }}>Пікірді өшіру</button>
          </div>
        ) : (
          <form className="sheet__body form" onSubmit={submit}>
            <label className="field"><span>Пікіріңіз</span><textarea className="input rv-text" name="text" required minLength={20} maxLength={600} rows={5} placeholder="Мысалы: сабаққа дайындалу уақытым қысқарды, оқушылар телефоннан жауап бергенді ұнатады…" /></label>
            <label className="field"><span>Аты-жөні</span><input className="input" name="name" required minLength={2} maxLength={80} defaultValue={profile?.full_name || ''} /></label>
            <label className="field"><span>Мектеп, қала</span><input className="input" name="school" maxLength={120} defaultValue={profile?.school || ''} /></label>
            <label className="check"><input type="checkbox" name="consent" /> <span>Пікірім аты-жөнім және мектебіммен бірге сайттың басты бетінде жариялануына келісемін</span></label>
            <Note>{err}</Note>
            <button className="btn btn--lg btn--primary" type="submit" disabled={busy}>Жіберу</button>
          </form>
        )}
    </Sheet>
  );
}
