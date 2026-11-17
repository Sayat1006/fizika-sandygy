/* Әкімші: бағалар (жеңілдігімен) және промокодтар. Дерекқор: prices, promo_codes (тек әкімші өзгерте алады). */
import { useEffect, useState, type FormEvent } from 'react';
import { GRADES, week } from '../lib/config';
import { dmy, money, sb } from '../lib/data';
import { loadPrices, rowNow, type Plan, type PriceRow } from '../lib/pricing';
import { useToast } from '../ui/kit';

const PLANS: [Plan, string][] = [['month', '1 ай'], ['year', '1 жыл']];
const ROWS: [number, string][] = [...GRADES.map((g) => [g, `${g}-сынып`] as [number, string]), [0, 'Барлық сынып (7–11) бірге']];
const num = (v: string) => (v.trim() === '' ? null : Math.max(0, Math.round(Number(v.replace(/\s/g, '')) || 0)));

/* ───────── Бағалар ───────── */
export function AdminPrices() {
  const toast = useToast();
  const [rows, setRows] = useState<PriceRow[] | null>(null);
  const [edit, setEdit] = useState<Record<string, { price: string; sale_price: string; sale_until: string }>>({});
  const [busy, setBusy] = useState(false);
  const key = (p: Plan, g: number) => `${p}:${g}`;
  const load = async () => {
    const r = await loadPrices(true);
    setRows(r);
    setEdit(Object.fromEntries(r.map((x) => [key(x.plan, x.grade), { price: x.price?.toString() ?? '', sale_price: x.sale_price?.toString() ?? '', sale_until: x.sale_until ?? '' }])));
  };
  useEffect(() => { void load(); }, []);
  const set = (k: string, f: 'price' | 'sale_price' | 'sale_until', v: string) => setEdit((e) => ({ ...e, [k]: { ...(e[k] || { price: '', sale_price: '', sale_until: '' }), [f]: v } }));

  const save = async () => {
    const out = PLANS.flatMap(([p]) => ROWS.map(([g]) => {
      const e = edit[key(p, g)] || { price: '', sale_price: '', sale_until: '' };
      return { plan: p, grade: g, price: num(e.price), sale_price: num(e.sale_price), sale_until: e.sale_until || null, updated_at: new Date().toISOString() };
    }));
    const bad = out.find((x) => x.grade !== 0 && x.price == null);
    if (bad) return toast(`${bad.grade}-сыныптың бағасын жазыңыз (${bad.plan === 'month' ? '1 ай' : '1 жыл'})`);
    const wrong = out.find((x) => x.sale_price != null && x.price != null && x.sale_price >= x.price);
    if (wrong) return toast('Жеңілдік бағасы негізгі бағадан төмен болуы керек');
    setBusy(true);
    const { error } = await sb.from('prices').upsert(out);
    setBusy(false);
    if (error) return toast('Сақталмады: ' + error.message);
    toast('Бағалар сақталды'); void load();
  };
  const today = week().today;

  return (
    <section className="adm__sec">
      <div className="adm__row"><h2 className="t-headline">Бағалар</h2><button className="btn btn--sm btn--primary" type="button" disabled={busy || !rows} onClick={() => void save()}>Сақтау</button></div>
      <p className="hint">Баға ₸-мен. «Жеңілдік бағасы» толтырылса, сайтта ескі баға сызылып, жаңасы көрсетіледі; «дейін» күні өткен соң негізгі баға өзі қайтады (бос — мерзімсіз).
        «Барлық сынып бірге» — мұғалім бес сыныпты бірге таңдағанда (бос қалса, сыныптар жеке есептеледі).</p>
      {!rows ? <div className="skel" style={{ height: 160 }} /> : PLANS.map(([p, pn]) => (
        <div key={p} className="tbl" style={{ marginTop: 12 }}><table className="adm__prices">
          <thead><tr><th>{pn}</th><th>Негізгі баға</th><th>Жеңілдік бағасы</th><th>Жеңілдік … дейін</th><th>Қазір</th></tr></thead>
          <tbody>{ROWS.map(([g, gn]) => {
            const k = key(p, g), e = edit[k] || { price: '', sale_price: '', sale_until: '' };
            const now = rowNow({ plan: p, grade: g, price: num(e.price), sale_price: num(e.sale_price), sale_until: e.sale_until || null });
            const pct = now.old && now.now != null ? Math.round((1 - now.now / now.old) * 100) : 0;
            return (
              <tr key={k}>
                <td>{gn}</td>
                <td><input className="input input--sm tabular" inputMode="numeric" value={e.price} placeholder={g ? '' : 'жоқ'} onChange={(x) => set(k, 'price', x.target.value)} /></td>
                <td><input className="input input--sm tabular" inputMode="numeric" value={e.sale_price} placeholder="—" onChange={(x) => set(k, 'sale_price', x.target.value)} /></td>
                <td><input className="input input--sm" type="date" min={today} value={e.sale_until} onChange={(x) => set(k, 'sale_until', x.target.value)} /></td>
                <td className="tabular">{now.now == null ? '—' : <><b>{money(now.now)}</b>{pct > 0 && <small style={{ color: 'var(--ok, #17a05d)' }}>−{pct}%</small>}</>}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      ))}
    </section>
  );
}

/* ───────── Промокодтар ───────── */
interface Promo { code: string; kind: 'pct' | 'sum'; value: number; plan: Plan | null; max_uses: number | null; used: number; valid_until: string | null; active: boolean; note: string | null; created_at: string }

export function AdminPromos() {
  const toast = useToast();
  const [list, setList] = useState<Promo[] | null>(null);
  const [kind, setKind] = useState<'pct' | 'sum'>('pct');
  const load = async () => {
    const { data, error } = await sb.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (error) { toast('Промокодтар жүктелмеді: ' + error.message); setList([]); return; }
    setList(data as Promo[]);
  };
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget), form = e.currentTarget;
    const code = String(f.get('code') || '').trim().toUpperCase().replace(/\s+/g, '');
    const value = num(String(f.get('value') || '')) || 0;
    if (!/^[A-Z0-9А-ЯӘҒҚҢӨҰҮҺІ_-]{3,32}$/.test(code)) return toast('Код: 3–32 әріп/сан (бос орынсыз)');
    if (!value || (kind === 'pct' && value > 100)) return toast(kind === 'pct' ? 'Пайыз: 1–100' : 'Соманы жазыңыз');
    const row = { code, kind, value, plan: (String(f.get('plan')) || null) as Plan | null, max_uses: num(String(f.get('max') || '')) || null,
      valid_until: String(f.get('until') || '') || null, note: String(f.get('note') || '').trim() || null, active: true };
    const { error } = await sb.from('promo_codes').insert(row);
    if (error) return toast(error.code === '23505' ? 'Мұндай код бар' : 'Қосылмады: ' + error.message);
    form.reset(); setKind('pct'); toast(`${code} қосылды`); void load();
  };
  const toggle = async (p: Promo) => { const { error } = await sb.from('promo_codes').update({ active: !p.active }).eq('code', p.code); if (error) toast(error.message); void load(); };
  const del = async (p: Promo) => {
    if (!confirm(`${p.code} промокодын өшіру керек пе?`)) return;
    const { error } = await sb.from('promo_codes').delete().eq('code', p.code); if (error) toast(error.message); else toast('Өшірілді'); void load();
  };
  const today = week().today;
  const state = (p: Promo) => !p.active ? ['', 'Өшірулі'] : p.valid_until && p.valid_until < today ? ['err', 'Мерзімі өтті'] : p.max_uses && p.used >= p.max_uses ? ['err', 'Таусылды'] : ['ok', 'Белсенді'];

  return (
    <section className="adm__sec">
      <h2 className="t-headline">Промокодтар</h2>
      <p className="hint">Мұғалім жазылым терезесінде кодты енгізеді, сома бірден азаяды. «Қолданылды» — төлемі расталған өтінімдер саны.</p>
      <form className="adm__promo" onSubmit={add}>
        <input className="input input--sm" name="code" placeholder="КОД (мыс. MUGALIM10)" maxLength={32} style={{ textTransform: 'uppercase' }} required />
        <select className="input input--sm" value={kind} onChange={(e) => setKind(e.target.value as 'pct' | 'sum')} aria-label="Түрі">
          <option value="pct">Пайыз, %</option><option value="sum">Сома, ₸</option>
        </select>
        <input className="input input--sm tabular" name="value" inputMode="numeric" placeholder={kind === 'pct' ? 'Мөлшері, %' : 'Мөлшері, ₸'} required />
        <select className="input input--sm" name="plan" defaultValue="" aria-label="Жазылым"><option value="">Кез келген жазылым</option><option value="month">Тек 1 ай</option><option value="year">Тек 1 жыл</option></select>
        <input className="input input--sm tabular" name="max" inputMode="numeric" placeholder="Неше рет (бос — шексіз)" />
        <label className="adm__promo-d"><span>дейін</span><input className="input input--sm" name="until" type="date" min={today} /></label>
        <input className="input input--sm" name="note" placeholder="Ескертпе (кімге, не үшін)" />
        <button className="btn btn--sm btn--primary" type="submit">Қосу</button>
      </form>
      {!list ? <div className="skel" style={{ height: 80 }} /> : list.length ? (
        <div className="tbl"><table>
          <thead><tr><th>Код</th><th>Мөлшері</th><th>Жазылым</th><th>Қолданылды</th><th>Дейін</th><th>Күйі</th><th /></tr></thead>
          <tbody>{list.map((p) => { const [c, t] = state(p); return (
            <tr key={p.code}>
              <td><b className="tabular">{p.code}</b>{p.note && <small>{p.note}</small>}</td>
              <td className="tabular">{p.kind === 'pct' ? `−${p.value}%` : `−${money(p.value)}`}</td>
              <td>{p.plan === 'month' ? '1 ай' : p.plan === 'year' ? '1 жыл' : 'кез келген'}</td>
              <td className="tabular">{p.used}{p.max_uses ? ` / ${p.max_uses}` : ''}</td>
              <td className="tabular">{p.valid_until ? dmy(p.valid_until) : '—'}</td>
              <td><span className={`chip${c ? ' chip--' + c : ''}`}>{t}</span></td>
              <td><div className="adm__acts">
                <button className="btn btn--sm" type="button" onClick={() => void toggle(p)}>{p.active ? 'Тоқтату' : 'Қосу'}</button>
                <button className="btn btn--sm btn--danger" type="button" onClick={() => void del(p)}>Өшіру</button>
              </div></td>
            </tr>); })}</tbody>
        </table></div>
      ) : <div className="empty">Промокод әлі жоқ.</div>}
    </section>
  );
}
