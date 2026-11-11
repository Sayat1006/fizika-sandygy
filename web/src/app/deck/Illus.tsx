import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/* Тақырыптық интерактивті модельдер (тақтаға). Әрқайсысы — физика формулаларымен есептелетін, қозғалатын сызба
   және саусақпен өзгертілетін параметрлер. Сызба өлшемі: viewBox 900×560; басқару тақтасы — астында.
   .pptx-те бұл сабақтарда статикалық сызба (PNG) қалады. */

export type IllusSpec = { k: string; a?: unknown[] };
export const ILLUS = new Set(['circuit', 'solenoid', 'field_lines', 'charges', 'block_forces', 'waves', 'oscillation', 'pendulum', 'spring',
  'lens', 'eye', 'mirror', 'refraction', 'reflection', 'archimedes', 'floating', 'particles', 'projectile', 'lever', 'hydraulic', 'decay', 'induction']);

export default function Illus({ s }: { s: IllusSpec }) {
  const a = s.a || [];
  switch (s.k) {
    case 'circuit': return <Circuit kind={(a[0] as string) || 'simple'} />;
    case 'solenoid': return <Solenoid />;
    case 'field_lines': return <Field kind={(a[0] as string) || 'point'} />;
    case 'charges': return <Coulomb />;
    case 'block_forces': return <Forces forces={(a[0] as [string, string, number][]) || [['F', 'right', 3], ['F_үйк', 'left', 1]]} />;
    case 'waves': return <Waves />;
    case 'spring': return <Osc spring />;
    case 'oscillation': case 'pendulum': return <Osc />;
    case 'lens': case 'eye': return <Optics mirror={false} />;
    case 'mirror': return <Optics mirror />;
    case 'refraction': return <Refraction />;
    case 'reflection': return <Refraction reflectOnly />;
    case 'archimedes': case 'floating': return <Archimedes />;
    case 'particles': return <Particles />;
    case 'projectile': return <Projectile />;
    case 'lever': return <Lever />;
    case 'hydraulic': return <Hydraulic />;
    case 'decay': return <Decay />;
    case 'induction': return <Induction />;
  }
  return null;
}

/* ───────── ортақ бөліктер ───────── */
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** секундпен уақыт (requestAnimationFrame); run=false болса тоқтайды */
function useTime(run = true) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!run || reduce) return;
    let raf = 0, last = performance.now();
    const f = (now: number) => { setT((x) => x + Math.min(0.05, (now - last) / 1000)); last = now; raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }, [run]);
  return t;
}
const fmt = (v: number, d = 2) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(d)).replace('.', ',');

function Frame({ children, ctl, out }: { children: ReactNode; ctl: ReactNode; out?: ReactNode }) {
  return (
    <div className="dk-ill" onPointerDown={(e) => e.stopPropagation()}>
      <svg viewBox="0 0 900 560" className="dk-ill__svg">{children}</svg>
      {out && <div className="dk-ill__out">{out}</div>}
      <div className="dk-ctl">{ctl}</div>
    </div>
  );
}
function Ctl({ label, v, min, max, step = 1, unit, on }: { label: string; v: number; min: number; max: number; step?: number; unit?: string; on: (x: number) => void }) {
  return (
    <label className="dk-ctl__s"><span>{label} <b>{fmt(v, step < 1 ? (step < 0.1 ? 2 : 1) : 0)}{unit ? ' ' + unit : ''}</b></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(+e.target.value)} /></label>
  );
}
function Seg<T extends string | number | boolean>({ v, items, on }: { v: T; items: [T, string][]; on: (x: T) => void }) {
  return <div className="dk-ctl__seg">{items.map(([x, l]) => <button key={String(x)} type="button" aria-pressed={x === v} onClick={() => on(x)}>{l}</button>)}</div>;
}
const Out = ({ k, v, c }: { k: string; v: string; c?: string }) => <div className={`dk-out${c ? ' dk-out--' + c : ''}`}><small>{k}</small><b>{v}</b></div>;
/** стрелка (сызық + ұш) */
function Arr({ x1, y1, x2, y2, cls = 'dk-sv', w = 7, head = 22 }: { x1: number; y1: number; x2: number; y2: number; cls?: string; w?: number; head?: number }) {
  const L = Math.hypot(x2 - x1, y2 - y1); if (L < 2) return null;
  const ux = (x2 - x1) / L, uy = (y2 - y1) / L, h = Math.min(head, L * 0.6);
  const bx = x2 - ux * h, by = y2 - uy * h;
  return <g><line x1={x1} y1={y1} x2={bx} y2={by} className={cls} strokeWidth={w} strokeLinecap="round" />
    <polygon points={`${x2},${y2} ${bx - uy * h * 0.5},${by + ux * h * 0.5} ${bx + uy * h * 0.5},${by - ux * h * 0.5}`} className={cls.replace('dk-s', 'dk-f')} /></g>;
}
/** жол бойымен жүретін нүктелер (ток, электрондар) */
function Flow({ d, speed, t, n = 14, cls = 'dk-fa', r = 7 }: { d: string; speed: number; t: number; n?: number; cls?: string; r?: number }) {
  const ref = useRef<SVGPathElement>(null);
  const [L, setL] = useState(0);
  useEffect(() => { if (ref.current) setL(ref.current.getTotalLength()); }, [d]);
  const pts = [];
  if (ref.current && L) for (let i = 0; i < n; i++) { const s = (((i / n) * L + t * speed) % L + L) % L; pts.push(ref.current.getPointAtLength(s)); }
  return <g><path ref={ref} d={d} fill="none" />{pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={r} className={cls} />)}</g>;
}

/* ───────── 1. Электр тізбегі ───────── */
function Resistor({ x, y, vert, label, lamp, glow = 0 }: { x: number; y: number; vert?: boolean; label: string; lamp?: boolean; glow?: number }) {
  return (
    <g transform={`translate(${x} ${y})${vert ? ' rotate(90)' : ''}`}>
      {lamp ? <>
        <circle r="46" className="dk-glow" style={{ opacity: Math.min(1, glow) }} />
        <circle r="30" className="dk-fbg dk-si" strokeWidth="5" />
        <line x1="-21" y1="-21" x2="21" y2="21" className="dk-si" strokeWidth="5" /><line x1="-21" y1="21" x2="21" y2="-21" className="dk-si" strokeWidth="5" />
      </> : <rect x="-55" y="-20" width="110" height="40" rx="6" className="dk-fbg dk-si" strokeWidth="5" />}
      <text y={vert ? 70 : 80} x={0} transform={vert ? 'rotate(-90)' : undefined} textAnchor="middle" className="dk-lbl dk-fi" fontSize="26">{label}</text>
    </g>
  );
}
function Meter({ x, y, k, v }: { x: number; y: number; k: string; v: string }) {
  return <g transform={`translate(${x} ${y})`}><circle r="30" className="dk-fbg dk-sa" strokeWidth="5" /><text y="10" textAnchor="middle" className="dk-lbl dk-fa" fontSize="30">{k}</text>
    <text y="62" textAnchor="middle" className="dk-lbl dk-fi" fontSize="24">{v}</text></g>;
}
function Circuit({ kind }: { kind: string }) {
  const par = kind === 'parallel', ser = kind === 'series';
  const [U, setU] = useState(6), [R1, setR1] = useState(4), [R2, setR2] = useState(8), [on, setOn] = useState(true);
  const t = useTime(on);
  const I1 = on ? (par ? U / R1 : U / (R1 + (ser ? R2 : 0))) : 0, I2 = on ? (par ? U / R2 : I1) : 0, I = par ? I1 + I2 : I1;
  const loop = 'M150 330 V100 H750 V440 H150 Z';
  return (
    <Frame
      ctl={<>
        <Ctl label="Кернеу U" v={U} min={1} max={12} step={0.5} unit="В" on={setU} />
        <Ctl label="R₁" v={R1} min={1} max={20} unit="Ом" on={setR1} />
        {(ser || par) && <Ctl label="R₂" v={R2} min={1} max={20} unit="Ом" on={setR2} />}
        <button type="button" className={`dk-ctl__btn${on ? ' on' : ''}`} onClick={() => setOn(!on)}>{on ? 'Кілт тұйық' : 'Кілт ашық'}</button>
      </>}
      out={<>
        <Out k="Ток I" v={`${fmt(I)} А`} c="a" />
        {par ? <><Out k="I₁ = U/R₁" v={`${fmt(I1)} А`} /><Out k="I₂ = U/R₂" v={`${fmt(I2)} А`} /><Out k="R жалпы" v={`${fmt((R1 * R2) / (R1 + R2))} Ом`} /></>
          : ser ? <><Out k="U₁ = IR₁" v={`${fmt(I * R1)} В`} /><Out k="U₂ = IR₂" v={`${fmt(I * R2)} В`} /><Out k="R = R₁ + R₂" v={`${R1 + R2} Ом`} /></>
            : <Out k="Қуат P = UI" v={`${fmt(U * I)} Вт`} />}
      </>}>
      {/* сымдар */}
      {par ? <path d="M150 330 V100 H760 V440 H150 Z M600 100 V440" fill="none" className="dk-si" strokeWidth="6" />
        : <path d={loop} fill="none" className="dk-si" strokeWidth="6" />}
      {/* ток көзі */}
      <g transform="translate(150 270)"><rect x="-40" y="-30" width="80" height="60" className="dk-fbg" />
        <line x1="-40" y1="-12" x2="40" y2="-12" className="dk-si" strokeWidth="6" /><line x1="-22" y1="12" x2="22" y2="12" className="dk-si" strokeWidth="12" />
        <text x="-60" y="-4" textAnchor="end" className="dk-lbl dk-fi" fontSize="26">+</text><text x="-60" y="30" textAnchor="end" className="dk-lbl dk-fi" fontSize="26">−</text>
        <text x="-60" y="70" textAnchor="end" className="dk-lbl dk-fa" fontSize="26">{fmt(U, 1)} В</text></g>
      {/* кілт */}
      <g transform="translate(300 100)"><rect x="-50" y="-14" width="100" height="28" className="dk-fbg" /><circle cx="-40" r="7" className="dk-fi" /><circle cx="40" r="7" className="dk-fi" />
        <line x1="-40" y1="0" x2={on ? 40 : 28} y2={on ? 0 : -40} className="dk-si" strokeWidth="6" strokeLinecap="round" style={{ transition: 'all .3s' }} /></g>
      {par ? <>
        <Resistor x={600} y={270} vert label={`R₁ = ${R1} Ом`} lamp glow={(I1 * I1 * R1) / 20} />
        <Resistor x={760} y={270} vert label={`R₂ = ${R2} Ом`} lamp glow={(I2 * I2 * R2) / 20} />
        <Meter x={430} y={440} k="A" v={`${fmt(I)} А`} />
        {on && <><Flow d="M150 330 V100 H600" speed={I * 22} t={t} n={9} /><Flow d="M600 100 V440 H150 V330" speed={I1 * 22} t={t} n={8} /><Flow d="M600 100 H760 V440 H600" speed={I2 * 22} t={t} n={8} /></>}
      </> : <>
        <Resistor x={520} y={100} label={`R₁ = ${R1} Ом`} lamp glow={(I * I * R1) / 20} />
        {ser && <Resistor x={750} y={270} vert label={`R₂ = ${R2} Ом`} lamp glow={(I * I * R2) / 20} />}
        <Meter x={450} y={440} k="A" v={`${fmt(I)} А`} />
        <path d="M440 100 V30 H600 V100" fill="none" className="dk-sa" strokeWidth="3" strokeDasharray="8 8" /><Meter x={520} y={30} k="V" v="" />
        <text x="620" y="40" className="dk-lbl dk-fa" fontSize="24">{fmt(I * R1)} В</text>
        {on && <Flow d={loop} speed={I * 25} t={t} n={20} />}
      </>}
      <text x="880" y="540" textAnchor="end" className="dk-lbl dk-fi" fontSize="22" opacity=".6">Нүктелер — ток бағыты (+ → −)</text>
    </Frame>
  );
}

/* ───────── 2. Соленоид ───────── */
function Solenoid() {
  const [I, setI] = useState(2), [N, setN] = useState(400), [dir, setDir] = useState(1);
  const t = useTime(I > 0);
  const B = (4 * Math.PI * 1e-7 * N * I) / 0.2; // l = 0,2 м
  const turns = Math.round(6 + N / 100);
  const op = Math.min(1, 0.25 + B * 60);
  return (
    <Frame
      ctl={<><Ctl label="Ток I" v={I} min={0} max={5} step={0.5} unit="А" on={setI} /><Ctl label="Орам саны N" v={N} min={100} max={1000} step={50} on={setN} />
        <button type="button" className="dk-ctl__btn" onClick={() => setDir(-dir)}>Ток бағытын ауыстыру</button></>}
      out={<><Out k="B = μ₀NI/l" v={`${fmt(B * 1000)} мТл`} c="a" /><Out k="l" v="0,2 м" /></>}>
      {/* өріс сызықтары */}
      {[-60, -30, 0, 30, 60].map((dy, i) => (
        <g key={i} style={{ opacity: I ? op : 0.12 }}>
          <path d={`M150 ${280 + dy} H750`} className="dk-sv" strokeWidth="4" strokeDasharray="18 16" fill="none" style={{ strokeDashoffset: -t * 60 * dir * (I / 2) }} />
          {Math.abs(dy) >= 30 && <path d={`M750 ${280 + dy} C ${880} ${280 + dy * 3.4}, ${20} ${280 + dy * 3.4}, 150 ${280 + dy}`} fill="none" className="dk-sv" strokeWidth="3" strokeDasharray="14 14" opacity=".55" style={{ strokeDashoffset: -t * 60 * dir * (I / 2) }} />}
        </g>
      ))}
      {/* орамдар */}
      {Array.from({ length: turns }, (_, i) => { const x = 190 + (i * 520) / (turns - 1); return <ellipse key={i} cx={x} cy={280} rx="16" ry="92" fill="none" className="dk-ss" strokeWidth="7" />; })}
      <Arr x1={450} y1={400} x2={450 + 120 * dir} y2={400} cls="dk-sa" w={6} />
      <text x="450" y="450" textAnchor="middle" className="dk-lbl dk-fa" fontSize="26">B бағыты</text>
      <text x={dir > 0 ? 790 : 110} y="290" textAnchor="middle" className="dk-lbl dk-fv" fontSize="44">N</text>
      <text x={dir > 0 ? 110 : 790} y="290" textAnchor="middle" className="dk-lbl dk-fs" fontSize="44">S</text>
      {/* компас */}
      <g transform={`translate(840 120) rotate(${dir > 0 ? 0 : 180})`} style={{ transition: 'transform .6s' }}>
        <circle r="36" className="dk-fbg dk-si" strokeWidth="4" /><polygon points="30,0 -4,-9 -4,9" className="dk-fv" /><polygon points="-30,0 4,-9 4,9" className="dk-fi" opacity=".5" /></g>
    </Frame>
  );
}

/* ───────── 3. Өріс сызықтары ───────── */
function Field({ kind }: { kind: string }) {
  const magnet = kind === 'magnet', dip = kind === 'dipole' || magnet;
  const [q2, setQ2] = useState(dip ? -1 : 0), [q1, setQ1] = useState(1);
  const t = useTime();
  const Q = useMemo(() => (q2 ? [{ x: 330, y: 280, q: q1 }, { x: 570, y: 280, q: q2 }] : [{ x: 450, y: 280, q: q1 }]), [q1, q2]);
  const lines = useMemo(() => {
    const E = (x: number, y: number) => { let ex = 0, ey = 0; for (const c of Q) { const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy + 1, r = Math.sqrt(r2); ex += (c.q * dx) / (r2 * r); ey += (c.q * dy) / (r2 * r); } return [ex, ey]; };
    const out: string[] = [];
    for (const c of Q) {
      if (c.q === 0) continue;
      const n = 14;
      for (let k = 0; k < n; k++) {
        const a = (2 * Math.PI * (k + 0.5)) / n; let x = c.x + 24 * Math.cos(a), y = c.y + 24 * Math.sin(a), d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
        const sgn = c.q > 0 ? 1 : -1;
        if (sgn < 0 && Q.some((o) => o.q > 0)) continue; // теріс зарядтан басталатынды оң заряд сызып береді
        for (let s = 0; s < 260; s++) {
          const [ex, ey] = E(x, y), L = Math.hypot(ex, ey) || 1; x += (sgn * 5 * ex) / L; y += (sgn * 5 * ey) / L;
          d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
          if (x < -20 || x > 920 || y < -20 || y > 580 || Q.some((o) => o !== c && Math.hypot(x - o.x, y - o.y) < 22)) break;
        }
        out.push(d);
      }
    }
    return out;
  }, [Q]);
  return (
    <Frame
      ctl={<>{!magnet && <Seg v={q1} items={[[1, 'q₁ +'], [-1, 'q₁ −']]} on={setQ1} />}
        {!magnet && <Seg v={q2} items={[[0, 'Бір заряд'], [1, 'q₂ +'], [-1, 'q₂ −']]} on={setQ2} />}</>}
      out={<Out k={magnet ? 'Магнит' : 'Сызық бағыты'} v={magnet ? 'N → S (сыртында)' : '+ зарядтан → − зарядқа'} />}>
      {lines.map((d, i) => <path key={i} d={d} fill="none" className="dk-sv" strokeWidth="3" strokeDasharray="14 12" style={{ strokeDashoffset: -t * 40 }} opacity=".75" />)}
      {magnet ? <g><rect x="330" y="250" width="120" height="60" className="dk-fv" /><rect x="450" y="250" width="120" height="60" className="dk-fs" />
        <text x="390" y="292" textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="36">N</text><text x="510" y="292" textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="36">S</text></g>
        : Q.map((c, i) => <g key={i}><circle cx={c.x} cy={c.y} r="26" className={c.q > 0 ? 'dk-ferr' : 'dk-fv'} /><text x={c.x} y={c.y + 12} textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="36">{c.q > 0 ? '+' : '−'}</text></g>)}
    </Frame>
  );
}

/* ───────── 4. Кулон заңы ───────── */
function Coulomb() {
  const [q1, setQ1] = useState(2), [q2, setQ2] = useState(-3), [r, setR] = useState(6);
  const F = (9e9 * Math.abs(q1 * q2) * 1e-12) / (r * r * 1e-4);
  const att = q1 * q2 < 0, x1 = 450 - r * 30, x2 = 450 + r * 30, L = Math.min(170, 30 + 45 * Math.log10(1 + F * 10));
  const C = (x: number, q: number) => <g><circle cx={x} cy={300} r={20 + Math.abs(q) * 5} className={q > 0 ? 'dk-ferr' : 'dk-fv'} /><text x={x} y={312} textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="34">{q > 0 ? '+' : '−'}</text>
    <text x={x} y={225} textAnchor="middle" className="dk-lbl dk-fi" fontSize="26">{q > 0 ? '+' : '−'}{Math.abs(q)} мкКл</text></g>;
  return (
    <Frame
      ctl={<><Ctl label="q₁" v={q1} min={-5} max={5} unit="мкКл" on={(x) => setQ1(x || 1)} /><Ctl label="q₂" v={q2} min={-5} max={5} unit="мкКл" on={(x) => setQ2(x || -1)} /><Ctl label="r" v={r} min={2} max={12} unit="см" on={setR} /></>}
      out={<><Out k="F = k|q₁q₂|/r²" v={`${fmt(F)} Н`} c="a" /><Out k="Әрекеттесу" v={att ? 'тартылу' : 'тебілу'} /></>}>
      <line x1={x1} y1={420} x2={x2} y2={420} className="dk-si" strokeWidth="3" /><line x1={x1} y1={405} x2={x1} y2={435} className="dk-si" strokeWidth="3" /><line x1={x2} y1={405} x2={x2} y2={435} className="dk-si" strokeWidth="3" />
      <text x="450" y="465" textAnchor="middle" className="dk-lbl dk-fi" fontSize="28">r = {r} см</text>
      <Arr x1={x1} y1={300} x2={x1 + (att ? L : -L)} y2={300} cls="dk-sa" w={8} />
      <Arr x1={x2} y1={300} x2={x2 + (att ? -L : L)} y2={300} cls="dk-sa" w={8} />
      {C(x1, q1)}{C(x2, q2)}
    </Frame>
  );
}

/* ───────── 5. Денеге әсер ететін күштер ───────── */
function Forces({ forces }: { forces: [string, string, number][] }) {
  const [mag, setMag] = useState(forces.map((f) => f[2]));
  const [m, setM] = useState(2), [go, setGo] = useState(false);
  const t = useTime(go);
  const sum = forces.reduce((s, f, i) => { const d = f[1], v = mag[i]; return { x: s.x + (d === 'right' ? v : d === 'left' ? -v : 0), y: s.y + (d === 'up' ? v : d === 'down' ? -v : 0) }; }, { x: 0, y: 0 });
  const R = Math.hypot(sum.x, sum.y), a = R / m, K = 40;
  const dx = go ? Math.max(-300, Math.min(300, 0.5 * (sum.x / m) * t * t * 25)) : 0;
  useEffect(() => { if (go && Math.abs(dx) >= 300) setGo(false); }, [dx, go]);
  const cx = 450 + dx, cy = 300;
  const vec = (d: string, v: number): [number, number] => [d === 'right' ? v * K : d === 'left' ? -v * K : 0, d === 'up' ? -v * K : d === 'down' ? v * K : 0];
  const name = (n: string) => n.replace('_', ' ');
  const Lbl = ({ n, ...p }: { n: string } & React.SVGProps<SVGTextElement>) => { const [b, sub] = n.split('_'); return <text {...p}>{b}{sub && <tspan dy="8" fontSize="20">{sub}</tspan>}</text>; };
  return (
    <Frame
      ctl={<>{forces.slice(0, 3).map((f, i) => <Ctl key={i} label={name(f[0])} v={mag[i]} min={0} max={6} step={0.5} unit="Н" on={(x) => setMag(mag.map((y, j) => (j === i ? x : y)))} />)}
        <Ctl label="Масса m" v={m} min={0.5} max={5} step={0.5} unit="кг" on={setM} />
        <button type="button" className={`dk-ctl__btn${go ? ' on' : ''}`} onClick={() => { setGo(!go); }}>{go ? 'Тоқтату' : 'Қозғалту'}</button></>}
      out={<><Out k="Тең әсерлі R" v={`${fmt(R)} Н`} c="a" /><Out k="a = R/m" v={`${fmt(a)} м/с²`} /></>}>
      <line x1="40" y1="350" x2="860" y2="350" className="dk-si" strokeWidth="5" />
      {Array.from({ length: 20 }, (_, i) => <line key={i} x1={50 + i * 42} y1="350" x2={30 + i * 42} y2="372" className="dk-si" strokeWidth="3" opacity=".5" />)}
      <rect x={cx - 70} y={cy - 50} width="140" height="100" rx="10" className="dk-fs" opacity=".85" />
      {forces.map((f, i) => { const [vx, vy] = vec(f[1], mag[i]); const ox = vx ? (vx > 0 ? 70 : -70) : 0, oy = vy ? (vy > 0 ? 50 : -50) : 0; return mag[i] > 0 && <g key={i}><Arr x1={cx + ox} y1={cy + oy} x2={cx + ox + vx} y2={cy + oy + vy} cls={i % 2 ? 'dk-sa' : 'dk-sv'} />
        <Lbl n={f[0]} x={cx + ox + vx + (vx ? Math.sign(vx) * 12 : 18)} y={cy + oy + vy + (vy ? Math.sign(vy) * 30 : -12)} textAnchor={vx < 0 ? 'end' : 'start'} className={`dk-lbl ${i % 2 ? 'dk-fa' : 'dk-fv'}`} fontSize="28" /></g>; })}
      {R > 0.01 && <Arr x1={cx} y1={cy} x2={cx + sum.x * K} y2={cy - sum.y * K} cls="dk-serr" w={5} />}
    </Frame>
  );
}

/* ───────── 6. Толқын ───────── */
function Waves() {
  const [A, setA] = useState(60), [lam, setLam] = useState(300), [f, setF] = useState(0.5), [lon, setLon] = useState(false);
  const t = useTime();
  const k = (2 * Math.PI) / lam, w = 2 * Math.PI * f;
  const pts = Array.from({ length: 91 }, (_, i) => { const x = 40 + i * 9.1; return [x, 280 - A * Math.sin(k * x - w * t)]; });
  return (
    <Frame
      ctl={<><Ctl label="Амплитуда" v={A} min={10} max={120} step={5} unit="px" on={setA} /><Ctl label="Толқын ұзындығы λ" v={lam} min={120} max={600} step={20} unit="px" on={setLam} />
        <Ctl label="Жиілік ν" v={f} min={0.1} max={2} step={0.1} unit="Гц" on={setF} /><Seg v={lon} items={[[false, 'Көлденең'], [true, 'Бойлық']]} on={setLon} /></>}
      out={<><Out k="υ = λν" v={`${fmt((lam / 100) * f)} м/с`} c="a" /><Out k="Период T" v={`${fmt(1 / f)} с`} /></>}>
      {lon ? Array.from({ length: 60 }, (_, i) => { const x0 = 40 + i * 14, x = x0 + (A / 3) * Math.sin(k * x0 - w * t); return <line key={i} x1={x} y1={180} x2={x} y2={380} className={i === 30 ? 'dk-sa' : 'dk-sv'} strokeWidth={i === 30 ? 7 : 4} />; })
        : <>
          <line x1="40" y1="280" x2="860" y2="280" className="dk-sg" strokeWidth="3" />
          <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" className="dk-sv" strokeWidth="6" />
          {pts.filter((_, i) => i % 6 === 0).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 7 ? 14 : 7} className={i === 7 ? 'dk-fa' : 'dk-fv'} />)}
          <line x1={40 + lam * 0} y1="440" x2={40 + lam} y2="440" className="dk-sa" strokeWidth="4" /><text x={40 + lam / 2} y="480" textAnchor="middle" className="dk-lbl dk-fa" fontSize="28">λ</text>
        </>}
      <text x="880" y="540" textAnchor="end" className="dk-lbl dk-fi" fontSize="22" opacity=".6">{lon ? 'Бөлшектер толқын бойымен тербеледі' : 'Сары нүкте — бір бөлшек: тек жоғары-төмен тербеледі'}</text>
    </Frame>
  );
}

/* ───────── 7. Маятник / серіппе ───────── */
function Osc({ spring }: { spring?: boolean }) {
  const [l, setL] = useState(1), [g, setG] = useState(9.8), [m, setM] = useState(0.5), [kk, setK] = useState(20);
  const t = useTime();
  const T = spring ? 2 * Math.PI * Math.sqrt(m / kk) : 2 * Math.PI * Math.sqrt(l / g);
  const ph = Math.cos((2 * Math.PI * t) / T);
  const hist = Array.from({ length: 120 }, (_, i) => { const tt = t - (119 - i) * 0.05; return `${560 + i * 2.7},${280 - 90 * Math.cos((2 * Math.PI * tt) / T)}`; }).join(' ');
  return (
    <Frame
      ctl={spring ? <><Ctl label="Масса m" v={m} min={0.1} max={2} step={0.1} unit="кг" on={setM} /><Ctl label="Қатаңдық k" v={kk} min={5} max={100} step={5} unit="Н/м" on={setK} /></>
        : <><Ctl label="Ұзындық l" v={l} min={0.2} max={2.5} step={0.1} unit="м" on={setL} /><Seg v={g} items={[[9.8, 'Жер'], [1.6, 'Ай'], [24.8, 'Юпитер']]} on={setG} /></>}
      out={<><Out k={spring ? 'T = 2π√(m/k)' : 'T = 2π√(l/g)'} v={`${fmt(T)} с`} c="a" /><Out k="Жиілік ν" v={`${fmt(1 / T)} Гц`} /></>}>
      {spring ? <g>
        <line x1="120" y1="60" x2="380" y2="60" className="dk-si" strokeWidth="8" />
        {(() => { const y2 = 260 + 80 * ph; const n = 14, seg = (y2 - 60) / n; let d = 'M250 60'; for (let i = 1; i < n; i++) d += ` L${250 + (i % 2 ? 30 : -30)} ${60 + i * seg}`; d += ` L250 ${y2}`; return <><path d={d} fill="none" className="dk-sv" strokeWidth="5" /><rect x="190" y={y2} width="120" height={60 + m * 30} rx="10" className="dk-fs" /><text x="250" y={y2 + 45 + m * 15} textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="28">{fmt(m, 1)} кг</text></>; })()}
        <line x1="150" y1="290" x2="350" y2="290" className="dk-sa" strokeWidth="3" strokeDasharray="10 8" />
      </g> : <g>
        <line x1="150" y1="60" x2="350" y2="60" className="dk-si" strokeWidth="8" />
        {(() => { const L = 100 + l * 120, a = (25 * Math.PI) / 180 * ph, x = 250 + L * Math.sin(a), y = 60 + L * Math.cos(a); return <><line x1="250" y1="60" x2={x} y2={y} className="dk-si" strokeWidth="4" /><circle cx={x} cy={y} r="28" className="dk-fs" />
          <line x1="250" y1="60" x2="250" y2={60 + L + 30} className="dk-sg" strokeWidth="3" strokeDasharray="8 8" /></>; })()}
      </g>}
      <rect x="550" y="170" width="330" height="220" rx="16" className="dk-fbg dk-sg" strokeWidth="3" />
      <line x1="560" y1="280" x2="870" y2="280" className="dk-sg" strokeWidth="2" />
      <polyline points={hist} fill="none" className="dk-sv" strokeWidth="5" />
      <text x="715" y="420" textAnchor="middle" className="dk-lbl dk-fi" fontSize="24">x(t) графигі</text>
    </Frame>
  );
}

/* ───────── 8. Линза / айна ───────── */
function Optics({ mirror }: { mirror: boolean }) {
  const [F, setF] = useState(100), [d, setD] = useState(250), [div, setDiv] = useState(false);
  const f = div ? -F : F, X = 470, Y = 290, h = 70;
  const fi = Math.abs(d - f) < 1e-6 ? Infinity : (f * d) / (d - f); // 1/F = 1/d + 1/f
  const m = -fi / d, virt = fi < 0, G = Math.abs(m);
  const ox = X - d, top: [number, number] = [ox, Y - h];
  // кескін нүктесі: линзада оң жақта (нақты), айнада сол жақта (нақты)
  const ix = mirror ? X - fi : X + fi, iy = Y - m * h;
  const edge = (x0: number, y0: number, dx: number, dy: number) => { const xe = dx > 0 ? 890 : 10, k = (xe - x0) / dx; return [xe, y0 + dy * k]; };
  // 1) оске параллель сәуле → линзадан кейін фокус арқылы; 2) оптикалық центр арқылы түзу
  const r1: [number, number] = mirror ? [-f, h] : [Math.sign(f) * f, Math.sign(f) * h];
  const r2: [number, number] = mirror ? [-d, h] : [d, h];
  const e1 = edge(X, Y - h, r1[0], r1[1]), e2 = edge(X, Y, r2[0], r2[1]);
  const ok = isFinite(fi) && Math.abs(ix) < 3000 && Math.abs(iy) < 3000;
  return (
    <Frame
      ctl={<><Ctl label="Фокус аралығы F" v={F} min={60} max={180} step={10} unit="мм" on={setF} /><Ctl label="Заттан қашықтық d" v={d} min={40} max={420} step={10} unit="мм" on={setD} />
        {!mirror && <Seg v={div} items={[[false, 'Жинағыш'], [true, 'Шашыратқыш']]} on={setDiv} />}</>}
      out={<><Out k={mirror ? '1/F = 1/d + 1/f (ойыс айна)' : '1/F = 1/d + 1/f'} v={isFinite(fi) ? `f = ${fmt(Math.abs(fi))} мм` : 'кескін жоқ (d = F)'} c="a" />
        <Out k="Үлкейту Γ" v={isFinite(fi) ? fmt(G) : '∞'} /><Out k="Кескін" v={!isFinite(fi) ? '—' : `${virt ? 'жалған' : 'нақты'}, ${m < 0 ? 'төңкерілген' : 'тура'}, ${G > 1 ? 'үлкейген' : 'кішірейген'}`} /></>}>
      <line x1="10" y1={Y} x2="890" y2={Y} className="dk-sg" strokeWidth="3" />
      {mirror ? <path d={`M${X + 24} ${Y - 180} Q ${X - 24} ${Y} ${X + 24} ${Y + 180}`} fill="none" className="dk-sv" strokeWidth="9" />
        : div ? <path d={`M${X - 18} ${Y - 180} Q ${X} ${Y} ${X - 18} ${Y + 180} L${X + 18} ${Y + 180} Q ${X} ${Y} ${X + 18} ${Y - 180} Z`} className="dk-fv" opacity=".35" />
          : <ellipse cx={X} cy={Y} rx="22" ry="180" className="dk-fv" opacity=".35" />}
      {(mirror ? [-1] : [-1, 1]).map((k) => <g key={k}><circle cx={X + k * F} cy={Y} r="7" className="dk-fi" /><text x={X + k * F} y={Y + 40} textAnchor="middle" className="dk-lbl dk-fi" fontSize="24">F</text></g>)}
      {mirror && <g><circle cx={X - 2 * F} cy={Y} r="6" className="dk-fi" /><text x={X - 2 * F} y={Y + 40} textAnchor="middle" className="dk-lbl dk-fi" fontSize="24">2F</text></g>}
      {/* сәулелер */}
      <line x1={top[0]} y1={top[1]} x2={X} y2={Y - h} className="dk-sa" strokeWidth="4" />
      <line x1={X} y1={Y - h} x2={e1[0]} y2={e1[1]} className="dk-sa" strokeWidth="4" />
      <line x1={top[0]} y1={top[1]} x2={X} y2={Y} className="dk-sv" strokeWidth="4" />
      <line x1={X} y1={Y} x2={e2[0]} y2={e2[1]} className="dk-sv" strokeWidth="4" />
      {ok && virt && <g strokeDasharray="10 10" strokeWidth="3"><line x1={X} y1={Y - h} x2={ix} y2={iy} className="dk-sa" /><line x1={X} y1={Y} x2={ix} y2={iy} className="dk-sv" /></g>}
      <Arr x1={ox} y1={Y} x2={ox} y2={Y - h} cls="dk-ss" w={7} />
      <text x={ox} y={Y + 40} textAnchor="middle" className="dk-lbl dk-fs" fontSize="24">зат</text>
      {ok && <g opacity={virt ? 0.65 : 1}><Arr x1={ix} y1={Y} x2={ix} y2={iy} cls="dk-serr" w={7} />
        <text x={ix} y={iy > Y ? iy + 36 : iy - 14} textAnchor="middle" className="dk-lbl dk-ferr" fontSize="24">кескін</text></g>}
    </Frame>
  );
}

/* ───────── 9. Сыну / шағылу ───────── */
function Refraction({ reflectOnly }: { reflectOnly?: boolean }) {
  const [a, setA] = useState(40), [m, setM] = useState<'w' | 'g' | 'gi'>('w');
  const [n1, n2] = m === 'w' ? [1, 1.33] : m === 'g' ? [1, 1.5] : [1.5, 1];
  const s = (n1 / n2) * Math.sin((a * Math.PI) / 180), tir = !reflectOnly && s > 1, b = tir ? 0 : (Math.asin(Math.min(1, s)) * 180) / Math.PI;
  const X = 450, Y = 280, R = 240, rad = (x: number) => (x * Math.PI) / 180;
  const crit = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;
  return (
    <Frame
      ctl={<><Ctl label="Түсу бұрышы α" v={a} min={0} max={85} unit="°" on={setA} />
        {!reflectOnly && <Seg v={m} items={[['w', 'Ауа → су'], ['g', 'Ауа → шыны'], ['gi', 'Шыны → ауа']]} on={setM} />}</>}
      out={reflectOnly ? <><Out k="Шағылу бұрышы" v={`${a}°`} c="a" /><Out k="Заңы" v="α = γ" /></>
        : <><Out k="n₁ sin α = n₂ sin β" v={tir ? 'толық ішкі шағылу' : `β = ${fmt(b, 1)}°`} c="a" />{crit && <Out k="Шекті бұрыш" v={`${fmt(crit, 1)}°`} />}</>}>
      {!reflectOnly && <rect x="0" y={Y} width="900" height="280" className={m === 'gi' ? 'dk-fbg' : 'dk-fv'} opacity=".14" />}
      {!reflectOnly && m === 'gi' && <rect x="0" y="0" width="900" height={Y} className="dk-fv" opacity=".14" />}
      <line x1="0" y1={Y} x2="900" y2={Y} className="dk-si" strokeWidth={reflectOnly ? 10 : 3} />
      <line x1={X} y1="20" x2={X} y2="540" className="dk-sg" strokeWidth="3" strokeDasharray="10 10" />
      <Arr x1={X - R * Math.sin(rad(a))} y1={Y - R * Math.cos(rad(a))} x2={X} y2={Y} cls="dk-ss" w={7} />
      <Arr x1={X} y1={Y} x2={X + R * Math.sin(rad(a))} y2={Y - R * Math.cos(rad(a))} cls="dk-ss" w={tir || reflectOnly ? 7 : 3} />
      {!reflectOnly && !tir && <Arr x1={X} y1={Y} x2={X + R * Math.sin(rad(b))} y2={Y + R * Math.cos(rad(b))} cls="dk-sa" w={7} />}
      <text x="40" y="60" className="dk-lbl dk-fi" fontSize="28">{reflectOnly ? 'Айна' : m === 'gi' ? 'Шыны, n = 1,5' : 'Ауа, n = 1'}</text>
      {!reflectOnly && <text x="40" y={Y + 60} className="dk-lbl dk-fi" fontSize="28">{m === 'w' ? 'Су, n = 1,33' : m === 'g' ? 'Шыны, n = 1,5' : 'Ауа, n = 1'}</text>}
      <text x={X - 60} y={Y - 90} textAnchor="end" className="dk-lbl dk-fs" fontSize="28">α</text>
      {!reflectOnly && !tir && <text x={X + 40} y={Y + 110} className="dk-lbl dk-fa" fontSize="28">β</text>}
    </Frame>
  );
}

/* ───────── 10. Архимед күші ───────── */
function Archimedes() {
  const [rl, setRl] = useState(1000), [rb, setRb] = useState(2700), [dep, setDep] = useState(100);
  const V = 0.0004, g = 9.8, P = rb * V * g; // дене: 400 см³
  const floatFrac = rb < rl ? rb / rl : 1;
  const imm = Math.min(dep / 100, rb < rl ? floatFrac : 1);
  const Fa = rl * g * V * imm, read = Math.max(0, P - Fa);
  const H = 120, tankY = 260, surf = tankY + 30, bodyY = surf - H + imm * H;
  return (
    <Frame
      ctl={<><Ctl label="Батыру" v={dep} min={0} max={100} step={5} unit="%" on={setDep} />
        <Seg v={rl} items={[[800, 'Керосин'], [1000, 'Су'], [1240, 'Өлі теңіз суы']]} on={setRl} />
        <Seg v={rb} items={[[2700, 'Алюминий'], [7800, 'Темір'], [700, 'Ағаш']]} on={setRb} /></>}
      out={<><Out k="Fa = ρgV_бат" v={`${fmt(Fa)} Н`} c="a" /><Out k="Ауадағы салмақ P" v={`${fmt(P)} Н`} /><Out k={rb < rl && imm >= floatFrac ? 'Дене жүзеді' : 'Динамометр'} v={rb < rl && imm >= floatFrac ? `${fmt(floatFrac * 100, 0)}% батады` : `${fmt(read)} Н`} /></>}>
      <rect x="250" y={surf} width="400" height={tankY + 270 - surf} className="dk-fv" opacity=".2" />
      <rect x="250" y={tankY} width="400" height="270" rx="10" fill="none" className="dk-si" strokeWidth="5" />
      <line x1="450" y1="20" x2="450" y2={bodyY} className="dk-si" strokeWidth="3" style={{ opacity: rb < rl && imm >= floatFrac ? 0.15 : 1 }} />
      <rect x="420" y="20" width="60" height="90" rx="8" className="dk-fbg dk-si" strokeWidth="4" /><text x="490" y="70" className="dk-lbl dk-fi" fontSize="24">{fmt(read)} Н</text>
      <rect x="390" y={bodyY} width="120" height={H} rx="8" className={rb > 3000 ? 'dk-fi' : rb < 1000 ? 'dk-fs' : 'dk-fa'} opacity=".85" style={{ transition: 'y .3s' }} />
      <Arr x1={450} y1={bodyY + H + 10} x2={450} y2={bodyY + H + 10 - Fa * 25} cls="dk-sv" w={7} />
      <text x="525" y={bodyY + H - 10} className="dk-lbl dk-fv" fontSize="28">Fa</text>
      <text x="270" y="545" className="dk-lbl dk-fi" fontSize="22" opacity=".7">ρ_с = {rl} кг/м³, ρ_д = {rb} кг/м³, V = 400 см³</text>
    </Frame>
  );
}

/* ───────── 11. Зат күйлері ───────── */
function Particles() {
  const [T, setT] = useState(20);
  const t = useTime();
  const state = T < 0 ? 'Қатты' : T < 100 ? 'Сұйық' : 'Газ';
  const seeds = useMemo(() => { let x = 20261111; const r = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648; return Array.from({ length: 48 }, () => [r(), r(), r()]); }, []);
  const sp = 0.2 + (T + 40) / 60;
  return (
    <Frame ctl={<Ctl label="Температура" v={T} min={-40} max={160} step={5} unit="°C" on={setT} />}
      out={<><Out k="Күйі (су)" v={state} c="a" /><Out k="Бөлшектер" v={state === 'Қатты' ? 'орнында тербеледі' : state === 'Сұйық' ? 'бір-бірінің үстімен жылжиды' : 'еркін, ретсіз қозғалады'} /></>}>
      <rect x="150" y="40" width="600" height="480" rx="20" fill="none" className="dk-si" strokeWidth="5" />
      {seeds.map(([u, v], i) => {
        let x, y;
        if (state === 'Қатты') { x = 270 + (i % 8) * 52 + 4 * Math.sin(t * 9 + i); y = 200 + Math.floor(i / 8) * 52 + 4 * Math.cos(t * 8 + i * 2); }
        else if (state === 'Сұйық') { x = 200 + ((u * 500 + t * 30 * sp * (v - 0.5)) % 500 + 500) % 500; y = 260 + ((v * 230 + Math.sin(t * sp + i) * 30) % 230 + 230) % 230; }
        else { const w = seeds[i][2], px = u * 560 + t * 160 * sp * (w - 0.5) * 2, py = v * 440 + t * 140 * sp * (seeds[(i + 7) % 48][2] - 0.5) * 2; const bx = ((px % 1120) + 1120) % 1120, by = ((py % 880) + 880) % 880; x = 175 + (bx > 560 ? 1120 - bx : bx); y = 65 + (by > 440 ? 880 - by : by); }
        return <circle key={i} cx={x} cy={y} r="18" className={state === 'Газ' ? 'dk-ferr' : state === 'Сұйық' ? 'dk-fv' : 'dk-fs'} opacity=".85" />;
      })}
    </Frame>
  );
}

/* ───────── 12. Көкжиекке бұрыш жасай лақтыру ───────── */
function Projectile() {
  const [v0, setV] = useState(20), [al, setAl] = useState(45), [run, setRun] = useState(true);
  const g = 9.8, a = (al * Math.PI) / 180, T = (2 * v0 * Math.sin(a)) / g, L = (v0 * v0 * Math.sin(2 * a)) / g, Hm = (v0 * v0 * Math.sin(a) ** 2) / (2 * g);
  const t = useTime(run), tt = T ? (t % (T + 0.8)) : 0, tc = Math.min(tt, T);
  const K = 780 / 45; // 45 м → 780 px
  const X = (s: number) => 60 + s * K, Y = (h: number) => 480 - h * K;
  const path = Array.from({ length: 41 }, (_, i) => { const s = (T * i) / 40; return `${X(v0 * Math.cos(a) * s)},${Y(v0 * Math.sin(a) * s - (g * s * s) / 2)}`; }).join(' ');
  return (
    <Frame
      ctl={<><Ctl label="Бастапқы жылдамдық υ₀" v={v0} min={5} max={21} unit="м/с" on={setV} /><Ctl label="Бұрыш α" v={al} min={5} max={85} unit="°" on={setAl} />
        <button type="button" className={`dk-ctl__btn${run ? ' on' : ''}`} onClick={() => setRun(!run)}>{run ? 'Тоқтату' : 'Лақтыру'}</button></>}
      out={<><Out k="L = υ₀² sin2α / g" v={`${fmt(L)} м`} c="a" /><Out k="H = υ₀² sin²α / 2g" v={`${fmt(Hm)} м`} /><Out k="t ұшу" v={`${fmt(T)} с`} /></>}>
      <line x1="40" y1="480" x2="880" y2="480" className="dk-si" strokeWidth="5" />
      {[10, 20, 30, 40].map((m) => <g key={m}><line x1={X(m)} y1="480" x2={X(m)} y2="495" className="dk-si" strokeWidth="3" /><text x={X(m)} y="525" textAnchor="middle" className="dk-ax">{m} м</text></g>)}
      <polyline points={path} fill="none" className="dk-sv" strokeWidth="4" strokeDasharray="10 10" />
      <circle cx={X(v0 * Math.cos(a) * tc)} cy={Y(v0 * Math.sin(a) * tc - (g * tc * tc) / 2)} r="16" className="dk-fs" />
      <Arr x1={60} y1={480} x2={60 + 6 * v0 * Math.cos(a)} y2={480 - 6 * v0 * Math.sin(a)} cls="dk-sa" w={6} />
    </Frame>
  );
}

/* ───────── 13. Иінтірек ───────── */
function Lever() {
  const [m1, setM1] = useState(3), [x1, setX1] = useState(2), [m2, setM2] = useState(2), [x2, setX2] = useState(3);
  const M1 = m1 * 9.8 * x1, M2 = m2 * 9.8 * x2, ang = Math.max(-12, Math.min(12, (M1 - M2) * 0.5)), ok = Math.abs(M1 - M2) < 0.01;
  const S = 60, cx = 450, cy = 300;
  const P = (d: number) => [cx + d * S * Math.cos((ang * Math.PI) / 180), cy - d * S * Math.sin((ang * Math.PI) / 180)];
  const W = (d: number, m: number, cls: string) => { const [x, y] = P(d); return <g><line x1={x} y1={y} x2={x} y2={y + 40} className="dk-si" strokeWidth="3" /><rect x={x - 22 - m * 3} y={y + 40} width={44 + m * 6} height={30 + m * 8} rx="6" className={cls} /><text x={x} y={y + 70 + m * 4} textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="22">{m} кг</text></g>; };
  return (
    <Frame
      ctl={<><Ctl label="m₁" v={m1} min={1} max={6} unit="кг" on={setM1} /><Ctl label="l₁" v={x1} min={1} max={6} unit="бөлік" on={setX1} /><Ctl label="m₂" v={m2} min={1} max={6} unit="кг" on={setM2} /><Ctl label="l₂" v={x2} min={1} max={6} unit="бөлік" on={setX2} /></>}
      out={<><Out k="M₁ = F₁l₁" v={fmt(M1)} /><Out k="M₂ = F₂l₂" v={fmt(M2)} /><Out k="Тепе-теңдік" v={ok ? 'иә: M₁ = M₂' : M1 > M2 ? 'жоқ: сол жақ ауыр' : 'жоқ: оң жақ ауыр'} c="a" /></>}>
      <polygon points={`${cx},${cy} ${cx - 40},${cy + 120} ${cx + 40},${cy + 120}`} className="dk-fi" opacity=".7" />
      <line x1={P(-6.5)[0]} y1={P(-6.5)[1]} x2={P(6.5)[0]} y2={P(6.5)[1]} className="dk-ss" strokeWidth="14" strokeLinecap="round" style={{ transition: 'all .4s' }} />
      {Array.from({ length: 13 }, (_, i) => { const [x, y] = P(i - 6); return <circle key={i} cx={x} cy={y} r="4" className="dk-fbg" />; })}
      {W(-x1, m1, 'dk-fv')}{W(x2, m2, 'dk-fa')}
    </Frame>
  );
}

/* ───────── 14. Гидравликалық пресс ───────── */
function Hydraulic() {
  const [S1, setS1] = useState(10), [S2, setS2] = useState(200), [F1, setF1] = useState(100), [p, setP] = useState(0);
  const F2 = (F1 * S2) / S1, d1 = p * 80, d2 = (d1 * S1) / S2;
  const w1 = 40 + S1 * 2, w2 = 60 + S2 * 0.9;
  return (
    <Frame
      ctl={<><Ctl label="S₁" v={S1} min={5} max={30} unit="см²" on={setS1} /><Ctl label="S₂" v={S2} min={50} max={400} step={10} unit="см²" on={setS2} />
        <Ctl label="F₁" v={F1} min={10} max={300} step={10} unit="Н" on={setF1} /><Ctl label="Басу" v={p} min={0} max={1} step={0.05} on={setP} /></>}
      out={<><Out k="F₂ = F₁·S₂/S₁" v={`${fmt(F2)} Н`} c="a" /><Out k="Күштен ұтыс" v={`${fmt(S2 / S1)} есе`} /><Out k="h₂ = h₁·S₁/S₂" v="жолдан ұтыламыз" /></>}>
      <path d={`M${200 - w1 / 2} 160 V460 H${640 + w2 / 2} V160`} fill="none" className="dk-si" strokeWidth="6" />
      <rect x={200 - w1 / 2} y={200 + d1} width={w1} height={260 - d1} className="dk-fv" opacity=".25" />
      <rect x={200 + w1 / 2} y="400" width={440 - w1 / 2 - w2 / 2} height="60" className="dk-fv" opacity=".25" />
      <rect x={640 - w2 / 2} y={200 - d2} width={w2} height={260 + d2} className="dk-fv" opacity=".25" />
      <rect x={200 - w1 / 2} y={180 + d1} width={w1} height="20" className="dk-fi" /><rect x={640 - w2 / 2} y={180 - d2} width={w2} height="20" className="dk-fi" />
      <Arr x1={200} y1={60 + d1} x2={200} y2={175 + d1} cls="dk-ss" w={7} /><text x={230} y={100 + d1} className="dk-lbl dk-fs" fontSize="28">F₁</text>
      <Arr x1={640} y1={175 - d2} x2={640} y2={175 - d2 - Math.min(140, 30 + F2 / 40)} cls="dk-sa" w={9} /><text x={640 + w2 / 2 + 10} y={90 - d2} className="dk-lbl dk-fa" fontSize="28">F₂</text>
    </Frame>
  );
}

/* ───────── 15. Радиоактивті ыдырау ───────── */
function Decay() {
  const [Th, setTh] = useState(4), [run, setRun] = useState(true);
  const t = useTime(run);
  const life = useMemo(() => Array.from({ length: 200 }, (_, i) => -Math.log(1 - Math.abs((Math.sin(i * 91.7) * 9301.13) % 1) * 0.999)), []);
  const tau = Th / Math.LN2, alive = life.filter((x) => x * tau > t).length;
  const pts = Array.from({ length: 61 }, (_, i) => { const tt = (i / 60) * 5 * Th; return `${520 + i * 5.6},${430 - 280 * Math.pow(2, -tt / Th)}`; }).join(' ');
  return (
    <Frame
      ctl={<><Ctl label="Жартылай ыдырау периоды T" v={Th} min={1} max={10} unit="с" on={setTh} />
        <button type="button" className="dk-ctl__btn" onClick={() => { setRun(false); setTimeout(() => setRun(true), 30); }}>Қайта бастау</button></>}
      out={<><Out k="N = N₀·2^(−t/T)" v={`${alive} / 200`} c="a" /><Out k="Уақыт t" v={`${fmt(t, 1)} с`} /></>}>
      {life.map((x, i) => <circle key={`${i}-${run}`} cx={60 + (i % 20) * 21} cy={90 + Math.floor(i / 20) * 40} r="8" className={x * tau > t ? 'dk-fv' : 'dk-fbg dk-sg'} strokeWidth="2" />)}
      <line x1="520" y1="430" x2="860" y2="430" className="dk-si" strokeWidth="3" /><line x1="520" y1="130" x2="520" y2="430" className="dk-si" strokeWidth="3" />
      <polyline points={pts} fill="none" className="dk-sv" strokeWidth="5" />
      {[1, 2, 3, 4].map((k) => <g key={k}><line x1={520 + (k * 336) / 5} y1="430" x2={520 + (k * 336) / 5} y2="442" className="dk-si" strokeWidth="3" /><text x={520 + (k * 336) / 5} y="470" textAnchor="middle" className="dk-ax">{k}T</text></g>)}
      <circle cx={520 + Math.min(336, (t / (5 * Th)) * 336)} cy={430 - 280 * Math.pow(2, -t / Th)} r="11" className="dk-fa" />
      <text x="520" y="115" className="dk-ax">N</text>
    </Frame>
  );
}

/* ───────── 16. Электромагниттік индукция ───────── */
function Induction() {
  const [N, setN] = useState(200), [sp, setSp] = useState(1);
  const t = useTime();
  const x = 120 + 230 * (1 - Math.cos(t * sp * 1.6)) / 2; // магниттің орны
  const v = 230 * 0.8 * sp * Math.sin(t * sp * 1.6); // жылдамдық
  const inside = Math.max(0, 1 - Math.abs(x + 90 - 560) / 260);
  const emf = (v * N * inside) / 4000;
  return (
    <Frame
      ctl={<><Ctl label="Орам саны N" v={N} min={50} max={500} step={50} on={setN} /><Ctl label="Магнит жылдамдығы" v={sp} min={0.3} max={3} step={0.1} unit="×" on={setSp} /></>}
      out={<><Out k="ℰ = −N·ΔΦ/Δt" v={`${fmt(emf, 1)} (шартты)`} c="a" /><Out k="Ленц ережесі" v="индукциялық ток өзгеріске қарсы" /></>}>
      {Array.from({ length: Math.round(4 + N / 50) }, (_, i) => <ellipse key={i} cx={460 + (i * 220) / (Math.round(4 + N / 50) - 1)} cy="260" rx="14" ry="80" fill="none" className="dk-ss" strokeWidth="6" />)}
      <rect x={x} y="230" width="90" height="30" className="dk-fv" /><rect x={x + 90} y="230" width="90" height="30" className="dk-ferr" />
      <text x={x + 45} y="254" textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="22">S</text><text x={x + 135} y="254" textAnchor="middle" className="dk-lbl" fill="#fff" fontSize="22">N</text>
      <path d="M460 340 V430 H600 M680 430 H780 V340" fill="none" className="dk-si" strokeWidth="5" />
      <g transform="translate(640 430)"><circle r="44" className="dk-fbg dk-si" strokeWidth="4" /><text y="30" textAnchor="middle" className="dk-lbl dk-fi" fontSize="20">G</text>
        <line x1="0" y1="10" x2={36 * Math.sin(Math.max(-1.2, Math.min(1.2, emf / 3)))} y2={10 - 36 * Math.cos(Math.max(-1.2, Math.min(1.2, emf / 3)))} className="dk-serr" strokeWidth="4" strokeLinecap="round" /></g>
    </Frame>
  );
}
