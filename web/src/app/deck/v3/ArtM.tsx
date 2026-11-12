/* 7, 9–11-сынып суреттері: өлшеу, қозғалыс, күштер, қысым, жұмыс пен энергия, астрономия, тербеліс, толқын,
   кванттық және ядролық физика, газ заңдары (900×700 сахна). */
import type { ReactNode } from 'react';
import { Flow, Label, Sun } from './parts';

const BG = ({ c = 'var(--a3-bg2)' }: { c?: string }) => <rect width="900" height="700" fill={c} />;
const Sky = () => <rect width="900" height="700" fill="url(#a3-sky)" />;
const Night = ({ n = 40 }: { n?: number }) => (
  <g><rect width="900" height="700" fill="url(#a3-night)" />{Array.from({ length: n }, (_, i) => <circle key={i} cx={(i * 137) % 900} cy={(i * 89) % 700} r={i % 4 ? 2 : 3.5} fill="#fff" opacity={0.4 + (i % 3) * 0.2} />)}</g>
);
const Ground = ({ y = 600, c = '#7fb35a' }: { y?: number; c?: string }) => <rect y={y} width="900" height={700 - y} fill={c} />;
const Arrow = ({ x1, y1, x2, y2, c = 'var(--a3-hot)', w = 12, label, lx, ly }: { x1: number; y1: number; x2: number; y2: number; c?: string; w?: number; label?: string; lx?: number; ly?: number }) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = w * 2.6;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - Math.cos(a) * h * 0.8} y2={y2 - Math.sin(a) * h * 0.8} stroke={c} strokeWidth={w} strokeLinecap="round" />
      <path d={`M${x2} ${y2} L${x2 - Math.cos(a - 0.45) * h} ${y2 - Math.sin(a - 0.45) * h} L${x2 - Math.cos(a + 0.45) * h} ${y2 - Math.sin(a + 0.45) * h}Z`} fill={c} />
      {label && <text x={lx ?? x2 + 14} y={ly ?? y2 - 14} fontSize="38" fontWeight="800" fontStyle="italic" fill={c} fontFamily="Georgia, serif">{label}</text>}
    </g>
  );
};
const Car = ({ x, y, c = '#e5483a', s = 1 }: { x: number; y: number; c?: string; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-110" y="-60" width="220" height="60" rx="18" fill={c} /><path d="M-70 -60 l30 -42 h90 l30 42z" fill={c} /><path d="M-52 -64 l22 -30 h34 v30z M14 -64 v-30 h30 l22 30z" fill="#cfe6ff" />
    <circle cx="-62" cy="0" r="26" fill="#2b3245" /><circle cx="62" cy="0" r="26" fill="#2b3245" /><circle cx="-62" cy="0" r="10" fill="#9aa4b2" /><circle cx="62" cy="0" r="10" fill="#9aa4b2" />
  </g>
);
const Water = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => <rect x={x} y={y} width={w} height={h} fill="#4fa6ff" opacity=".75" />;
const Beaker = ({ x, y, w = 220, h = 300, lvl = 0.6 }: { x: number; y: number; w?: number; h?: number; lvl?: number }) => (
  <g><Water x={x + 6} y={y + h * (1 - lvl)} w={w - 12} h={h * lvl - 6} /><path d={`M${x} ${y} v${h} h${w} v${-h}`} fill="none" stroke="var(--a3-line)" strokeWidth="7" strokeLinejoin="round" /></g>
);
const Ball = ({ x, y, r = 30, c = '#e5483a', cls }: { x: number; y: number; r?: number; c?: string; cls?: string }) => (
  <g className={cls}><circle cx={x} cy={y} r={r} fill={c} /><circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#fff" opacity=".45" /></g>
);
const Atom = ({ x, y, r = 120 }: { x: number; y: number; r?: number }) => (
  <g>{[0, 60, 120].map((a) => <ellipse key={a} cx={x} cy={y} rx={r} ry={r * 0.36} fill="none" stroke="#1f8bff" strokeWidth="5" transform={`rotate(${a} ${x} ${y})`} />)}
    <circle cx={x} cy={y} r={r * 0.16} fill="#e5483a" />{[0, 60, 120].map((a, i) => <circle key={i} className="a3-orbit" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${-i}s`, rotate: `${a}deg` }} cx={x + r} cy={y} r={r * 0.07} fill="#1f8bff" />)}</g>
);

/* ───── 7-сынып: өлшеу, қозғалыс, масса, тығыздық ───── */
const Science = () => (
  <g><BG />
    <path d="M330 150 h80 v160 l120 220 a30 30 0 0 1 -26 44 h-268 a30 30 0 0 1 -26 -44 l120 -220z" fill="#e8f3ff" stroke="var(--a3-line)" strokeWidth="7" />
    <path d="M250 450 l-46 84 a20 20 0 0 0 18 30 h268 a20 20 0 0 0 18 -30 l-46 -84z" fill="#8b5cf6" opacity=".7" />
    {[0, 1, 2].map((i) => <circle key={i} cx={330 + i * 40} cy={500} r={12} fill="#fff" className="a3-bubble" style={{ animationDelay: `${i * 0.5}s` }} />)}
    <g transform="translate(640 330)"><circle r="110" fill="#cfe6ff" opacity=".6" stroke="#5b6478" strokeWidth="16" /><rect x="70" y="70" width="40" height="160" rx="16" fill="#5b6478" transform="rotate(-45 90 150)" /></g>
    <Atom x={170} y={190} r={90} />
    <Label x={450} y={660} size={30}>бақылау → болжам → тәжірибе → қорытынды</Label>
  </g>
);
const Measure = () => (
  <g><BG />
    <rect x="80" y="380" width="740" height="110" rx="10" fill="#ffd966" stroke="#b8901f" strokeWidth="4" />
    {Array.from({ length: 31 }, (_, i) => <line key={i} x1={100 + i * 23.3} y1="380" x2={100 + i * 23.3} y2={i % 5 ? 410 : 430} stroke="#5b4a1f" strokeWidth="3" />)}
    {Array.from({ length: 7 }, (_, i) => <text key={i} x={100 + i * 116.5} y="470" textAnchor="middle" fontSize="28" fontWeight="700" fill="#5b4a1f">{i * 5}</text>)}
    <rect x="200" y="240" width="330" height="130" rx="20" fill="#1f8bff" /><Label x={365} y={320} c="#fff" size={34}>дене</Label>
    <path d="M200 225 V 200 M530 225 V 200 M200 212 H 530" stroke="var(--a3-hot)" strokeWidth="6" />
    <Label x={365} y={180} size={34} c="var(--a3-hot)">l = 14,0 см</Label>
    <Label x={450} y={600} size={30} bg>бөлік құны = 1 см · қателік ± 0,5 см</Label>
  </g>
);
const SI = () => (
  <g><BG />
    {[['м', 'метр', '#1f8bff'], ['кг', 'килограмм', '#e5483a'], ['с', 'секунд', '#17a05d'], ['А', 'ампер', '#ff8a1f'], ['К', 'кельвин', '#8b5cf6'], ['моль', 'моль', '#0ea5a5'], ['кд', 'кандела', '#d6336c']].map(([u, n, c], i) => (
      <g key={u} transform={`translate(${130 + (i % 4) * 210} ${170 + Math.floor(i / 4) * 260})`}><circle r="80" fill={c} /><text y="18" textAnchor="middle" fontSize={u.length > 2 ? 40 : 56} fontWeight="800" fill="#fff">{u}</text><text y="125" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--a3-ink)">{n}</text></g>))}
    <Label x={760} y={490} size={30}>7 негізгі бірлік</Label>
  </g>
);
const Vectors = () => (
  <g><BG />
    {Array.from({ length: 13 }, (_, i) => <line key={i} x1={i * 70 + 30} y1="0" x2={i * 70 + 30} y2="700" stroke="var(--a3-line)" strokeWidth="1.5" opacity=".3" />)}
    {Array.from({ length: 10 }, (_, i) => <line key={i} x1="0" y1={i * 70 + 30} x2="900" y2={i * 70 + 30} stroke="var(--a3-line)" strokeWidth="1.5" opacity=".3" />)}
    <Arrow x1={170} y1={520} x2={520} y2={520} c="#1f8bff" label="a" ly={570} />
    <Arrow x1={520} y1={520} x2={520} y2={240} c="#17a05d" label="b" lx={540} ly={390} />
    <Arrow x1={170} y1={520} x2={520} y2={240} c="var(--a3-hot)" w={14} label="c = a + b" lx={180} ly={330} />
    <Label x={450} y={110} size={30} bg>масса — скаляр, күш — вектор</Label>
  </g>
);
const CarMotion = () => (
  <g><Sky /><Ground y={520} c="#6b7280" />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 110} y="596" width="60" height="10" fill="#fff" />)}
    <g className="a3-drive"><Car x={200} y={570} /></g>
    {[0, 1, 2, 3].map((i) => <g key={i}><line x1={100 + i * 220} y1="640" x2={100 + i * 220} y2="680" stroke="#fff" strokeWidth="4" /><text x={100 + i * 220} y="672" dx="10" fontSize="24" fill="#fff" fontWeight="700">{i * 20} м</text></g>)}
    <Label x={450} y={140} size={40} bg>υ = s / t</Label>
  </g>
);
const Relativity = () => (
  <g><Sky /><Ground y={560} />
    <rect y="540" width="900" height="16" fill="#5b4a3a" />
    <g className="a3-drive2"><rect x="180" y="330" width="520" height="200" rx="26" fill="#1f8bff" />{[0, 1, 2, 3].map((i) => <rect key={i} x={220 + i * 120} y="370" width="90" height="70" rx="10" fill="#cfe6ff" />)}
      <circle cx="400" cy="395" r="20" fill="#c98b5e" /><rect x="385" y="415" width="30" height="25" fill="#e5483a" /><circle cx="260" cy="540" r="26" fill="#2b3245" /><circle cx="620" cy="540" r="26" fill="#2b3245" /></g>
    <g transform="translate(780 470)"><circle r="22" fill="#c98b5e" /><rect x="-18" y="22" width="36" height="70" rx="12" fill="#17a05d" /></g>
    <Label x={300} y={260} size={28} bg>жолаушыға қатысты — тыныштықта</Label>
    <Label x={700} y={330} size={28} bg>жерге қатысты — қозғалыста</Label>
  </g>
);
const GraphXT = () => (
  <g><BG />
    <path d="M120 600 h680 M120 600 v-520" stroke="var(--a3-line)" strokeWidth="6" />
    <path d="M120 600 L740 150" stroke="#1f8bff" strokeWidth="11" strokeDasharray="1400" className="a3-draw" />
    <path d="M120 600 L740 420" stroke="#17a05d" strokeWidth="11" strokeDasharray="1400" className="a3-draw" />
    <path d="M120 600 Q 450 590 740 120" fill="none" stroke="var(--a3-hot)" strokeWidth="11" strokeDasharray="1400" className="a3-draw" />
    <Label x={140} y={70} size={32} anchor="start">s, м</Label><Label x={800} y={650} size={32} anchor="end">t, с</Label>
    <Label x={680} y={120} size={28} c="var(--a3-hot)">үдемелі</Label><Label x={790} y={180} size={28} c="#1f8bff">жылдам</Label><Label x={790} y={410} size={28} c="#17a05d">баяу</Label>
  </g>
);
const Balance = () => (
  <g><BG />
    <path d="M450 160 V 560 M320 600 h260" stroke="var(--a3-line)" strokeWidth="14" strokeLinecap="round" />
    <g className="a3-tilt" style={{ transformOrigin: '450px 180px' }}><path d="M180 180 H 720" stroke="var(--a3-line)" strokeWidth="12" strokeLinecap="round" />
      <path d="M180 180 l-70 200 h140z M720 180 l-70 200 h140z" fill="none" stroke="var(--a3-line)" strokeWidth="4" />
      <path d="M90 380 h180 a20 20 0 0 1 -20 24 h-140 a20 20 0 0 1 -20 -24z M630 380 h180 a20 20 0 0 1 -20 24 h-140 a20 20 0 0 1 -20 -24z" fill="#9aa4b2" />
      <circle cx="180" cy="335" r="45" fill="#ff8a1f" /><path d="M175 290 q10 -20 25 -15" stroke="#3a7a2a" strokeWidth="6" fill="none" />
      {[0, 1, 2].map((i) => <rect key={i} x={660 + i * 40} y={330 - (i === 1 ? 20 : 0)} width="34" height={50 + (i === 1 ? 20 : 0)} rx="6" fill="#b8901f" />)}</g>
    <Label x={450} y={670} size={34} bg>масса — кг</Label>
  </g>
);
const Volume = () => (
  <g><BG />
    {[0, 1].map((k) => <g key={k} transform={`translate(${170 + k * 340} 0)`}>
      <path d="M0 140 v440 a20 20 0 0 0 20 20 h140 a20 20 0 0 0 20 -20 v-440" fill="none" stroke="var(--a3-line)" strokeWidth="7" />
      <rect x="8" y={k ? 300 : 360} width="164" height={k ? 290 : 230} fill="#4fa6ff" opacity=".7" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1="0" y1={560 - i * 50} x2="40" y2={560 - i * 50} stroke="var(--a3-line)" strokeWidth="4" />)}
      {k === 1 && <path d="M50 520 l40 -40 l50 20 l10 60 l-60 20z" fill="#7a6a5a" />}
    </g>)}
    <text x="430" y="400" fontSize="60" fontWeight="800" fill="var(--a3-ink)">→</text>
    <Label x={260} y={110} size={30}>V₁ = 50 мл</Label><Label x={600} y={110} size={30}>V₂ = 62 мл</Label>
    <Label x={450} y={670} size={34} bg>V = V₂ − V₁</Label>
  </g>
);
const Density = () => (
  <g><BG />
    {[['#c9a26b', 'ағаш', 220], ['#b8c0cc', 'алюминий', 450], ['#7a7f8a', 'болат', 680]].map(([c, n, x], i) => (
      <g key={n as string}><rect x={(x as number) - 80} y="230" width="160" height="160" rx="10" fill={c as string} /><path d={`M${(x as number) - 80} 230 l40 -40 h160 l-40 40z`} fill={c as string} opacity=".7" />
        <rect x={(x as number) - 90} y={480} width="180" height={30 + i * 40} rx="8" fill="#ff8a1f" opacity=".8" /><Label x={x as number} y={460} size={28}>{n}</Label></g>))}
    <Label x={450} y={130} size={30}>көлемі бірдей — массасы әртүрлі</Label>
    <Label x={450} y={660} size={42} bg>ρ = m / V</Label>
  </g>
);

/* ───── күштер ───── */
const Inertia = () => (
  <g><Sky /><Ground y={560} c="#6b7280" />
    <rect x="160" y="300" width="560" height="240" rx="30" fill="#ffb020" />{[0, 1, 2].map((i) => <rect key={i} x={200 + i * 160} y="330" width="130" height="90" rx="10" fill="#cfe6ff" />)}
    <g transform="rotate(18 450 470)"><circle cx="450" cy="390" r="22" fill="#c98b5e" /><rect x="434" y="410" width="32" height="70" rx="12" fill="#1f8bff" /></g>
    <circle cx="260" cy="545" r="30" fill="#2b3245" /><circle cx="620" cy="545" r="30" fill="#2b3245" />
    <Arrow x1={560} y1={240} x2={760} y2={240} c="#17a05d" label="инерция" lx={560} ly={215} />
    <Label x={300} y={240} size={28} bg>автобус кенет тежелді</Label>
  </g>
);
const Forces = () => (
  <g><BG />
    <rect x="60" y="500" width="780" height="40" fill="#b98a5a" />
    <rect x="330" y="330" width="240" height="170" rx="14" fill="#1f8bff" />
    <Arrow x1={570} y1={415} x2={790} y2={415} c="var(--a3-hot)" label="F" />
    <Arrow x1={330} y1={470} x2={190} y2={470} c="#8b5cf6" label="Fүйк" lx={110} ly={450} />
    <Arrow x1={450} y1={415} x2={450} y2={640} c="#17a05d" label="mg" lx={470} ly={630} />
    <Arrow x1={450} y1={330} x2={450} y2={150} c="#ff8a1f" label="N" lx={470} ly={170} />
    <Label x={700} y={110} size={34} bg>F = ma</Label>
  </g>
);
const Gravity = () => (
  <g><Sky /><Ground y={580} />
    <path d="M200 580 V 300" stroke="#7a4b2a" strokeWidth="40" /><circle cx="200" cy="250" r="140" fill="#3a8a3a" /><circle cx="270" cy="230" r="16" fill="#e5483a" />
    <g className="a3-fall"><Ball x={480} y={180} r={34} /></g>
    <Arrow x1={560} y1={220} x2={560} y2={440} c="var(--a3-hot)" label="mg" />
    <Label x={680} y={120} size={36} bg>F = mg</Label><Label x={680} y={180} size={28}>g ≈ 9,8 Н/кг</Label>
  </g>
);
const SpringScene = () => (
  <g><BG />
    <rect x="200" y="60" width="500" height="30" rx="8" fill="var(--a3-line)" />
    {[0, 1].map((k) => <g key={k} transform={`translate(${320 + k * 260} 90)`}>
      <path d={`M0 0 ${Array.from({ length: 10 }, (_, i) => `L${i % 2 ? 30 : -30} ${(i + 1) * (k ? 26 : 16)}`).join(' ')} L0 ${(k ? 26 : 16) * 11}`} fill="none" stroke="#5b6478" strokeWidth="7" />
      <rect x="-50" y={(k ? 26 : 16) * 11} width="100" height={k ? 100 : 60} rx="10" fill="#e5483a" /></g>)}
    <path d="M660 266 v120" stroke="var(--a3-hot)" strokeWidth="5" strokeDasharray="10 8" /><Label x={720} y={330} size={32} anchor="start">Δl</Label>
    <Label x={450} y={620} size={42} bg>Fсерп = kΔl</Label>
  </g>
);
const FrictionForce = () => (
  <g><BG />
    <path d="M60 520 h780" stroke="#b98a5a" strokeWidth="40" /><path d="M60 500 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10 l20 -10 l20 10" fill="none" stroke="#8a5a3a" strokeWidth="4" />
    <g className="a3-slide"><rect x="350" y="360" width="200" height="140" rx="12" fill="#1f8bff" /></g>
    <Arrow x1={560} y1={430} x2={760} y2={430} c="var(--a3-hot)" label="F" /><Arrow x1={340} y1={470} x2={180} y2={470} c="#8b5cf6" label="Fүйк" lx={90} ly={450} />
    <Label x={450} y={640} size={40} bg>Fүйк = μN</Label>
  </g>
);

/* ───── қысым ───── */
const PressureBricks = () => (
  <g><BG />
    <rect x="60" y="480" width="780" height="160" fill="#e9c27a" />
    <rect x="140" y="250" width="110" height="230" fill="#c4533a" stroke="#8a2f1f" strokeWidth="4" /><path d="M150 480 q45 26 90 0" fill="#c9a060" />
    <rect x="460" y="380" width="330" height="100" fill="#c4533a" stroke="#8a2f1f" strokeWidth="4" />
    <path d="M140 482 h110 v40 h-110z" fill="#b8904f" opacity=".7" /><path d="M460 482 h330 v12 h-330z" fill="#b8904f" opacity=".7" />
    <Label x={195} y={210} size={28}>S аз — p көп</Label><Label x={625} y={350} size={28}>S көп — p аз</Label>
    <Label x={450} y={110} size={44} bg>p = F / S</Label>
  </g>
);
const Pascal = () => (
  <g><BG />
    <circle cx="450" cy="400" r="170" fill="#4fa6ff" opacity=".75" stroke="var(--a3-line)" strokeWidth="6" />
    <rect x="420" y="70" width="60" height="170" fill="#c9d1dc" stroke="var(--a3-line)" strokeWidth="6" /><rect x="400" y="160" width="100" height="30" fill="#5b6478" className="a3-push" />
    {Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI * 1.4 + Math.PI * 0.8; return <path key={i} d={`M${450 + Math.cos(a) * 170} ${400 + Math.sin(a) * 170} q ${Math.cos(a) * 60} ${Math.sin(a) * 60 - 10} ${Math.cos(a) * 120} ${Math.sin(a) * 120 + 30}`} fill="none" stroke="#1f8bff" strokeWidth="8" strokeDasharray="14 12" className="a3-flow" />; })}
    <Label x={450} y={660} size={30} bg>қысым барлық бағытта бірдей беріледі</Label>
  </g>
);
const Hydrostatic = () => (
  <g><BG />
    <rect x="300" y="100" width="220" height="500" fill="none" stroke="var(--a3-line)" strokeWidth="8" /><Water x={304} y={130} w={212} h={466} />
    {[0, 1, 2].map((i) => <path key={i} d={`M520 ${230 + i * 140} q ${80 + i * 60} 0 ${120 + i * 90} ${180 - i * 30}`} fill="none" stroke="#1f8bff" strokeWidth={8 + i * 3} strokeDasharray="18 12" className="a3-flow" />)}
    <Label x={200} y={240} size={30}>h аз</Label><Label x={200} y={520} size={30}>h көп</Label>
    <Label x={450} y={660} size={42} bg>p = ρgh</Label>
  </g>
);
const Vessels = () => (
  <g><BG />
    <path d="M140 120 v420 h620 v-420 M260 120 v300 h120 v-300 M500 120 v300 h140 v-300" fill="none" stroke="var(--a3-line)" strokeWidth="8" />
    <path d="M146 260 h108 v166 h132 v-166 h108 v166 h152 v-166 h108 v274 h-608z" fill="#4fa6ff" opacity=".75" />
    <path d="M100 260 h700" stroke="var(--a3-hot)" strokeWidth="4" strokeDasharray="16 12" />
    <Label x={450} y={640} size={32} bg>деңгейлер бірдей орнайды</Label>
  </g>
);
const Torricelli = () => (
  <g><BG />
    <path d="M200 520 h500 v120 h-500z" fill="#9aa4b2" /><path d="M210 540 h480 v90 h-480z" fill="#5b6478" />
    <rect x="420" y="80" width="60" height="520" fill="none" stroke="var(--a3-line)" strokeWidth="6" /><rect x="425" y="200" width="50" height="400" fill="#5b6478" />
    <path d="M520 200 V 540 M505 200 h30 M505 540 h30" stroke="var(--a3-hot)" strokeWidth="5" /><Label x={560} y={380} size={32} anchor="start">760 мм</Label>
    {[0, 1, 2, 3].map((i) => <Arrow key={i} x1={150 + i * 160 + (i > 1 ? 280 : 0)} y1={380} x2={150 + i * 160 + (i > 1 ? 280 : 0)} y2={505} c="#1f8bff" w={8} />)}
    <Label x={450} y={60} size={30}>вакуум</Label>
  </g>
);
const Hydraulic = () => (
  <g><BG />
    <path d="M120 300 v260 h660 v-360 M240 300 v140 h360 v-240" fill="none" stroke="var(--a3-line)" strokeWidth="8" />
    <path d="M126 330 h108 v116 h372 v-206 h168 v314 h-648z" fill="#4fa6ff" opacity=".75" />
    <rect x="126" y="300" width="108" height="30" fill="#5b6478" /><rect x="606" y="210" width="168" height="30" fill="#5b6478" />
    <Arrow x1={180} y1={130} x2={180} y2={290} c="var(--a3-hot)" label="F₁" /><Car x={690} y={205} s={0.6} />
    <Label x={450} y={650} size={40} bg>F₂/F₁ = S₂/S₁</Label>
  </g>
);
const ArchimedesScene = () => (
  <g><BG />
    <Beaker x={260} y={240} w={380} h={360} lvl={0.7} />
    <line x1="450" y1="60" x2="450" y2="360" stroke="var(--a3-line)" strokeWidth="4" />
    <rect x="390" y="360" width="120" height="120" rx="10" fill="#7a6a5a" />
    <Arrow x1={450} y1={360} x2={450} y2={200} c="#17a05d" label="FA" lx={470} ly={230} />
    <Arrow x1={450} y1={480} x2={450} y2={600} c="var(--a3-hot)" label="mg" lx={470} ly={600} />
    <Label x={720} y={130} size={40} bg>FA = ρgV</Label>
  </g>
);
const Floating = () => (
  <g><Sky /><rect y="380" width="900" height="320" fill="#3aa0e8" />
    <g className="a3-bob"><path d="M120 380 h300 l-40 70 h-220z" fill="#e5483a" /><rect x="200" y="300" width="140" height="80" fill="#f3efe6" /><rect x="260" y="230" width="20" height="70" fill="#5b6478" /></g>
    <path d="M560 340 l80 -60 l90 50 l20 50 l-30 210 l-140 -10 z" fill="#e8f6ff" stroke="#9ec9ea" strokeWidth="4" /><path d="M560 380 h205" stroke="#3aa0e8" strokeWidth="4" />
    <Ball x={330} y={600} r={34} c="#5b6478" />
    <Label x={660} y={250} size={28} bg>мұз: 9/10 бөлігі суда</Label><Label x={330} y={680} size={26} c="#fff">ρдене &gt; ρсұйық — батады</Label>
  </g>
);

/* ───── жұмыс, энергия, механизмдер ───── */
const Work = () => (
  <g><BG />
    <rect x="60" y="540" width="780" height="40" fill="#b98a5a" />
    <g className="a3-slide"><rect x="380" y="400" width="180" height="140" rx="10" fill="#c49a5c" /><path d="M380 470 h180 M470 400 v140" stroke="#8a6a3a" strokeWidth="5" /></g>
    <g transform="translate(300 400)"><circle cx="0" cy="-40" r="26" fill="#c98b5e" /><rect x="-20" y="-14" width="40" height="90" rx="14" fill="#1f8bff" /><path d="M10 0 l70 20" stroke="#c98b5e" strokeWidth="14" strokeLinecap="round" /><path d="M-10 76 l-30 64 M10 76 l20 64" stroke="#2b3245" strokeWidth="14" strokeLinecap="round" /></g>
    <Arrow x1={600} y1={470} x2={780} y2={470} c="var(--a3-hot)" label="F" />
    <path d="M380 620 H 700" stroke="var(--a3-ink)" strokeWidth="4" /><Label x={540} y={660} size={30}>s</Label>
    <Label x={450} y={130} size={42} bg>A = Fs · N = A/t</Label>
  </g>
);
const Skate = () => (
  <g><Sky />
    <path d="M60 140 Q 120 600 450 600 Q 780 600 840 140" fill="none" stroke="#5b6478" strokeWidth="20" /><path d="M60 140 Q 120 600 450 600 Q 780 600 840 140 V700 H60Z" fill="#9aa4b2" opacity=".35" />
    <g className="a3-swing" style={{ transformOrigin: '450px -300px' }}><Ball x={450} y={560} r={30} c="#ff8a1f" /></g>
    <Label x={160} y={110} size={30}>Eп max</Label><Label x={450} y={660} size={30}>Eк max</Label>
    <Label x={450} y={120} size={36} bg>Eп + Eк = const</Label>
  </g>
);
const Lever = () => (
  <g><BG />
    <path d="M450 470 l-60 120 h120z" fill="#5b6478" />
    <g className="a3-tilt2" style={{ transformOrigin: '450px 465px' }}><rect x="90" y="450" width="720" height="26" rx="10" fill="#c49a5c" />
      <rect x="130" y="350" width="100" height="100" rx="10" fill="#e5483a" /><rect x="640" y="400" width="60" height="50" rx="8" fill="#1f8bff" /></g>
    <path d="M180 520 H 450 M450 520 H 670" stroke="var(--a3-ink)" strokeWidth="4" /><Label x={315} y={560} size={32}>l₁</Label><Label x={560} y={560} size={32}>l₂</Label>
    <Label x={450} y={150} size={42} bg>F₁l₁ = F₂l₂</Label>
  </g>
);
const Pulley = () => (
  <g><BG />
    <rect x="200" y="60" width="500" height="26" fill="var(--a3-line)" />
    <circle cx="450" cy="190" r="70" fill="#9aa4b2" stroke="var(--a3-line)" strokeWidth="6" /><circle cx="450" cy="190" r="12" fill="var(--a3-line)" /><path d="M450 86 v34" stroke="var(--a3-line)" strokeWidth="8" />
    <path d="M380 190 V 470 M520 190 V 560" stroke="#8a6a3a" strokeWidth="6" />
    <rect x="320" y="470" width="120" height="110" rx="10" fill="#e5483a" />
    <Arrow x1={520} y1={480} x2={520} y2={640} c="var(--a3-hot)" label="F" />
    <Label x={710} y={300} size={30} bg>күштен ұтыс жоқ — бағыт өзгереді</Label>
  </g>
);
const Incline = () => (
  <g><Sky /><path d="M80 600 L820 600 L820 220 Z" fill="#9c8b6e" />
    <g transform="rotate(-27.2 500 440)"><rect x="440" y="360" width="140" height="90" rx="10" fill="#1f8bff" /></g>
    <Arrow x1={560} y1={400} x2={720} y2={318} c="var(--a3-hot)" label="F" />
    <Label x={300} y={180} size={36} bg>η = Aп / Aт · 100%</Label><Label x={860} y={420} size={30} anchor="end">h</Label><Label x={450} y={650} size={30}>l</Label>
  </g>
);
const CenterMass = () => (
  <g><BG />
    <path d="M250 520 L 450 140 L 680 560 Z" fill="#ffb020" opacity=".85" />
    <path d="M450 140 L 465 540 M250 520 L 572 350 M680 560 L 350 330" stroke="var(--a3-line)" strokeWidth="4" strokeDasharray="12 10" />
    <circle cx="460" cy="406" r="18" fill="var(--a3-hot)" /><path d="M460 425 V 640" stroke="var(--a3-ink)" strokeWidth="4" /><path d="M430 640 h60 l-30 -40z" fill="var(--a3-ink)" />
    <Label x={640} y={120} size={30} bg>массалар центрі — медианалар қиылысы</Label>
  </g>
);

/* ───── астрономия ───── */
const SkyScene = () => (
  <g><Night n={60} />
    {[[180, 200], [260, 170], [340, 190], [410, 240], [480, 230], [520, 300], [430, 320]].map(([x, y], i, a) => <g key={i}>{i > 0 && <line x1={a[i - 1][0]} y1={a[i - 1][1]} x2={x} y2={y} stroke="#9cc9ef" strokeWidth="3" opacity=".7" />}<circle cx={x} cy={y} r="9" fill="#fff" /></g>)}
    <circle cx="720" cy="150" r="14" fill="#fff" /><Label x={720} y={110} size={26} c="#fff">Темірқазық</Label>
    <path d="M0 620 Q 200 560 450 610 T 900 600 V700 H0Z" fill="#141a2e" />
    <Label x={350} y={380} size={28} c="#cfe6ff">Жетіқарақшы</Label>
  </g>
);
const SolarSystem = () => (
  <g><Night n={30} />
    <Sun x={130} y={350} r={90} />
    {[[230, 8, '#b8b8b8'], [300, 13, '#e8c27a'], [380, 14, '#2f7fd4'], [455, 10, '#d0603a'], [580, 34, '#d9a066'], [700, 28, '#e3cf8f'], [790, 20, '#8ad0e8'], [860, 19, '#3f6fd4']].map(([r, s, c], i) => (
      <g key={i}><path d={`M${130 + (r as number)} 120 A ${r} ${(r as number) * 1.4} 0 0 1 ${130 + (r as number)} 580`} fill="none" stroke="#fff" strokeOpacity=".15" strokeWidth="2" /><circle cx={130 + (r as number) - 0} cy={350} r={s as number} fill={c as string} />{i === 5 && <ellipse cx={830} cy={350} rx="48" ry="10" fill="none" stroke="#e3cf8f" strokeWidth="5" />}</g>))}
    <Label x={510} y={640} size={28} c="#fff">8 ғаламшар Күнді айнала қозғалады</Label>
  </g>
);
const Seasons = () => (
  <g><Night n={24} />
    <ellipse cx="450" cy="360" rx="330" ry="160" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="3" strokeDasharray="10 10" />
    <Sun x={450} y={360} r={70} />
    {[[120, 360, 'қыс'], [450, 200, 'көктем'], [780, 360, 'жаз'], [450, 520, 'күз']].map(([x, y, n]) => <g key={n as string}><circle cx={x as number} cy={y as number} r="34" fill="#2f7fd4" /><line x1={(x as number) - 14} y1={(y as number) - 44} x2={(x as number) + 14} y2={(y as number) + 44} stroke="#fff" strokeWidth="3" /><Label x={x as number} y={(y as number) + 75} size={26} c="#fff">{n}</Label></g>)}
    <Label x={450} y={660} size={28} c="#cfe6ff">жыл — 365 тәулік, тәулік — 24 сағ</Label>
  </g>
);
const Moon = () => (
  <g><Night n={30} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const x = 110 + i * 97; const f = Math.cos((i / 8) * Math.PI * 2); return (
      <g key={i}><circle cx={x} cy={350} r="40" fill="#2a3352" /><path d={`M${x} 310 A 40 40 0 0 ${i < 4 ? 1 : 0} ${x} 390 A ${Math.abs(f) * 40} 40 0 0 ${(i < 4) === (f > 0) ? 0 : 1} ${x} 310`} fill="#f4f1d0" /></g>); })}
    <Label x={450} y={500} size={28} c="#fff">Ай фазалары — 29,5 тәулік</Label>
  </g>
);
const CelestialSphere = () => (
  <g><Night n={30} />
    <circle cx="450" cy="360" r="260" fill="#24325e" opacity=".5" stroke="#9cc9ef" strokeWidth="3" />
    <ellipse cx="450" cy="360" rx="260" ry="70" fill="none" stroke="#ffd23f" strokeWidth="4" />
    <ellipse cx="450" cy="360" rx="260" ry="70" fill="none" stroke="#7fb8ff" strokeWidth="3" transform="rotate(-23.5 450 360)" />
    <line x1="450" y1="80" x2="450" y2="640" stroke="#fff" strokeWidth="3" strokeDasharray="10 8" />
    <circle cx="450" cy="360" r="20" fill="#2f7fd4" /><Label x={450} y={70} size={26} c="#fff">әлем полюсі</Label><Label x={760} y={330} size={26} c="#ffd23f">экватор</Label>
  </g>
);
const Kepler = () => (
  <g><Night n={24} />
    <ellipse cx="450" cy="360" rx="330" ry="210" fill="none" stroke="#9cc9ef" strokeWidth="4" />
    <Sun x={280} y={360} r={50} />
    <path d="M280 360 L 700 230 A 330 210 0 0 1 760 400 Z" fill="#ffd23f" opacity=".25" /><path d="M280 360 L 170 190 A 330 210 0 0 0 130 330 Z" fill="#ffd23f" opacity=".25" />
    <circle cx="450" cy="150" r="22" fill="#2f7fd4" className="a3-orbit2" style={{ transformOrigin: '450px 360px' }} />
    <Label x={450} y={640} size={28} c="#fff">тең уақытта — тең аудандар</Label>
  </g>
);
const Stars = () => (
  <g><Night n={60} />
    {[[180, 220, 70, '#9cc9ff'], [420, 400, 44, '#ffffff'], [640, 250, 56, '#ffd23f'], [760, 480, 90, '#ff7a4d'], [300, 540, 26, '#ff5a2e']].map(([x, y, r, c], i) => <g key={i}><circle cx={x as number} cy={y as number} r={(r as number) * 1.8} fill={c as string} opacity=".18" className="a3-pulse" style={{ transformOrigin: `${x}px ${y}px` }} /><circle cx={x as number} cy={y as number} r={r as number} fill={c as string} /></g>)}
    <Label x={450} y={660} size={28} c="#fff">түсі — температурасы: көк ыстық, қызыл суық</Label>
  </g>
);
const Galaxy = () => (
  <g><rect width="900" height="700" fill="#05070f" />
    {Array.from({ length: 220 }, (_, i) => { const t = i * 0.12, r = 18 + t * 30, k = i % 2 ? Math.PI : 0; return <circle key={i} cx={450 + Math.cos(t + k) * r} cy={350 + Math.sin(t + k) * r * 0.5} r={i % 7 ? 2 : 4} fill={i % 5 ? '#cfe6ff' : '#ffd9a0'} opacity={0.9 - t / 40} />; })}
    <circle cx="450" cy="350" r="40" fill="#fff4d6" opacity=".9" />
    {[0, 1, 2].map((i) => <path key={i} d={`M${120 + i * 30} ${600 - i * 20} l${80 + i * 20} -${30 + i * 10}`} stroke={['#ff5a2e', '#ff8a1f', '#ffd23f'][i]} strokeWidth="6" className="a3-flow" strokeDasharray="20 12" />)}
    <Label x={450} y={660} size={28} c="#fff">Әлем ұлғаюда — галактикалар алыстайды</Label>
  </g>
);

/* ───── 9-сынып: кинематика, динамика, импульс ───── */
const Accel = () => (
  <g><Sky /><Ground y={540} c="#6b7280" />
    {[0, 1, 2, 3].map((i) => <g key={i} opacity={0.3 + i * 0.23}><Car x={120 + i * i * 55 + i * 60} y={530} s={0.55} /></g>)}
    {[0, 1, 2].map((i) => <Arrow key={i} x1={150 + i * i * 55 + i * 80} y1={420} x2={150 + i * i * 55 + i * 80 + 60 + i * 40} y2={420} c="var(--a3-hot)" w={8} />)}
    <Label x={450} y={140} size={42} bg>a = (υ − υ₀) / t</Label><Label x={450} y={640} size={28} c="#fff">жылдамдық бірдей артады</Label>
  </g>
);
const FreeFall = () => (
  <g><BG />
    {[0, 1, 2, 3, 4, 5].map((i) => <Ball key={i} x={360} y={80 + i * i * 17 + 20} r={24} c={`rgba(229,72,58,${0.25 + i * 0.15})`} />)}
    <path d="M200 80 V 640" stroke="var(--a3-line)" strokeWidth="4" />{Array.from({ length: 12 }, (_, i) => <line key={i} x1="200" y1={80 + i * 50} x2="230" y2={80 + i * 50} stroke="var(--a3-line)" strokeWidth="3" />)}
    <path d="M560 120 l40 0 l-15 -20 M600 120 l-15 20" fill="none" /><g transform="translate(600 120)"><path d="M-20 0 q20 -30 40 0 q-20 10 -40 0" fill="#ddd" /></g>
    <Label x={640} y={300} size={38} bg>g ≈ 9,8 м/с²</Label><Label x={640} y={380} size={30}>h = gt²/2</Label>
  </g>
);
const Projectile = () => (
  <g><Sky /><Ground y={600} />
    <rect x="40" y="250" width="140" height="350" fill="#9c8b6e" />
    <path d="M180 250 Q 520 250 760 600" fill="none" stroke="var(--a3-hot)" strokeWidth="6" strokeDasharray="16 12" className="a3-flow" />
    {[0, 1, 2, 3, 4].map((i) => <Ball key={i} x={180 + i * 130} y={250 + i * i * 22} r={18} c="#5b6478" />)}
    <Arrow x1={180} y1={220} x2={320} y2={220} c="#1f8bff" label="υ₀" />
    <Label x={600} y={120} size={34} bg>траектория — парабола</Label>
  </g>
);
const Circle = () => (
  <g><BG />
    <circle cx="450" cy="360" r="230" fill="none" stroke="var(--a3-line)" strokeWidth="4" strokeDasharray="14 12" />
    <g className="a3-spin2" style={{ transformOrigin: '450px 360px' }}><line x1="450" y1="360" x2="680" y2="360" stroke="#8a6a3a" strokeWidth="5" /><Ball x={680} y={360} r={30} />
      <Arrow x1={680} y1={360} x2={680} y2={200} c="#1f8bff" label="υ" /><Arrow x1={650} y1={360} x2={530} y2={360} c="var(--a3-hot)" label="a" ly={340} lx={540} /></g>
    <circle cx="450" cy="360" r="10" fill="var(--a3-ink)" />
    <Label x={450} y={660} size={38} bg>a = υ² / R</Label>
  </g>
);
const Newton3 = () => (
  <g><BG />
    {[0, 1].map((k) => <g key={k} transform={`translate(${k ? 560 : 340} 380) scale(${k ? -1 : 1} 1)`}><circle cy="-120" r="34" fill="#c98b5e" /><rect x="-30" y="-86" width="60" height="140" rx="24" fill={k ? '#e5483a' : '#1f8bff'} /><path d="M20 -50 l90 10" stroke="#c98b5e" strokeWidth="16" strokeLinecap="round" /><path d="M-15 54 l-25 120 M15 54 l20 120" stroke="#2b3245" strokeWidth="16" strokeLinecap="round" /><rect x="-60" y="174" width="120" height="16" rx="8" fill="#5b6478" /></g>)}
    <Arrow x1={440} y1={240} x2={250} y2={240} c="#1f8bff" label="F₂₁" lx={230} ly={210} /><Arrow x1={460} y1={240} x2={650} y2={240} c="#e5483a" label="F₁₂" lx={600} ly={210} />
    <Label x={450} y={120} size={40} bg>F₁₂ = −F₂₁</Label>
  </g>
);
const Gravitation = () => (
  <g><Night n={30} />
    <circle cx="250" cy="360" r="130" fill="#2f7fd4" /><path d="M170 300 q60 30 90 -10 q40 40 90 10 q-10 80 -80 90 q-70 10 -100 -40z" fill="#5cb85c" />
    <circle cx="700" cy="360" r="50" fill="#d6d3c4" />
    <Arrow x1={390} y1={360} x2={500} y2={360} c="#ffd23f" w={10} /><Arrow x1={640} y1={360} x2={530} y2={360} c="#ffd23f" w={10} />
    <Label x={450} y={130} size={40} bg>F = G m₁m₂ / r²</Label>
  </g>
);
const Weightless = () => (
  <g><Night n={40} />
    <rect x="160" y="200" width="580" height="300" rx="80" fill="#e8edf3" /><rect x="180" y="220" width="540" height="260" rx="70" fill="#cfd6e0" />
    <g className="a3-float"><circle cx="450" cy="300" r="40" fill="#fff" stroke="#9aa4b2" strokeWidth="5" /><rect x="420" y="340" width="60" height="90" rx="22" fill="#fff" stroke="#9aa4b2" strokeWidth="5" /><path d="M420 360 l-60 -30 M480 360 l60 -40 M435 430 l-30 50 M465 430 l40 40" stroke="#fff" strokeWidth="20" strokeLinecap="round" /><circle cx="450" cy="300" r="26" fill="#2b3245" opacity=".8" /></g>
    <g className="a3-float2"><rect x="300" y="250" width="50" height="34" rx="8" fill="#ffb020" /><circle cx="610" cy="390" r="16" fill="#4fa6ff" /></g>
    <Label x={450} y={600} size={30} c="#fff">еркін түсуде салмақ P = 0</Label>
  </g>
);
const Orbit = () => (
  <g><Night n={40} />
    <circle cx="450" cy="380" r="150" fill="#2f7fd4" /><path d="M370 310 q60 30 90 -10 q40 40 90 10 q-10 80 -80 90 q-70 10 -100 -40z" fill="#5cb85c" />
    <circle cx="450" cy="380" r="270" fill="none" stroke="#9cc9ef" strokeWidth="3" strokeDasharray="12 10" />
    <g className="a3-spin2" style={{ transformOrigin: '450px 380px', animationDuration: '8s' }}><g transform="translate(720 380)"><rect x="-16" y="-14" width="32" height="28" fill="#c9d1dc" /><rect x="-70" y="-8" width="50" height="16" fill="#1f6fd0" /><rect x="20" y="-8" width="50" height="16" fill="#1f6fd0" /></g></g>
    <Label x={450} y={70} size={34} bg>υ₁ ≈ 7,9 км/с</Label>
  </g>
);
const Collision = () => (
  <g><BG />
    <rect x="60" y="460" width="780" height="20" fill="var(--a3-line)" opacity=".5" />
    <g className="a3-hit1"><Ball x={220} y={410} r={50} c="#1f8bff" /></g><g className="a3-hit2"><Ball x={560} y={420} r={40} c="#e5483a" /></g>
    <Arrow x1={220} y1={300} x2={360} y2={300} c="#1f8bff" label="p₁" /><Arrow x1={560} y1={300} x2={620} y2={300} c="#e5483a" label="p₂" />
    <Label x={450} y={140} size={40} bg>p = mυ</Label><Label x={450} y={600} size={30}>m₁υ₁ + m₂υ₂ = const</Label>
  </g>
);
const Rocket = () => (
  <g><Night n={40} />
    <g className="a3-launch"><path d="M450 80 C 500 140 510 260 500 400 H 400 C 390 260 400 140 450 80Z" fill="#e8edf3" /><circle cx="450" cy="220" r="26" fill="#4fa6ff" stroke="#9aa4b2" strokeWidth="5" />
      <path d="M400 330 l-50 90 h50z M500 330 l50 90 h-50z" fill="#e5483a" />
      <path d="M410 400 C 420 470 440 520 450 600 C 460 520 480 470 490 400Z" fill="#ffb020" className="a3-flick" /></g>
    <Arrow x1={620} y1={350} x2={620} y2={160} c="#17a05d" label="υ ракета" lx={640} ly={180} /><Arrow x1={620} y1={420} x2={620} y2={600} c="var(--a3-hot)" label="υ газ" lx={640} ly={600} />
  </g>
);

/* ───── тербеліс, толқын, дыбыс ───── */
const Swing = () => (
  <g><Sky /><Ground y={600} />
    <path d="M200 600 L 320 120 L 580 120 L 700 600" fill="none" stroke="#7a4b2a" strokeWidth="18" />
    <g className="a3-pend" style={{ transformOrigin: '450px 120px' }}><path d="M400 120 V 470 M500 120 V 470" stroke="#5b6478" strokeWidth="6" /><rect x="380" y="470" width="140" height="22" rx="8" fill="#e5483a" /><circle cx="450" cy="400" r="30" fill="#c98b5e" /><rect x="425" y="430" width="50" height="40" fill="#1f8bff" /></g>
    <Label x={450} y={660} size={30} c="#fff">резонанс: сырттан итеру уақытпен сәйкес</Label>
  </g>
);
const StringWave = () => (
  <g><BG />
    <path d="M60 350 c 60 -160 120 -160 180 0 s 120 160 180 0 s 120 -160 180 0 s 120 160 180 0 s 120 -160 180 0 s 120 160 180 0" fill="none" stroke="#1f8bff" strokeWidth="10" className="a3-wave" />
    <path d="M60 350 H 840" stroke="var(--a3-line)" strokeWidth="2" strokeDasharray="10 10" />
    <path d="M150 140 H 510" stroke="var(--a3-hot)" strokeWidth="5" /><path d="M150 125 v30 M510 125 v30" stroke="var(--a3-hot)" strokeWidth="5" /><Label x={330} y={120} size={34} c="var(--a3-hot)">λ</Label>
    <path d="M780 350 V 210" stroke="#17a05d" strokeWidth="5" /><Label x={800} y={290} size={32} c="#17a05d" anchor="start">A</Label>
    <Label x={450} y={640} size={40} bg>υ = λν</Label>
  </g>
);
const Sound = () => (
  <g><BG />
    <g transform="translate(160 350)"><rect x="-60" y="-90" width="80" height="180" rx="10" fill="#2b3245" /><path d="M20 -90 L 110 -170 V 170 L 20 90Z" fill="#5b6478" /></g>
    {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${320 + i * 100} 160 Q ${370 + i * 100} 350 ${320 + i * 100} 540`} fill="none" stroke="#1f8bff" strokeWidth="8" opacity={1 - i * 0.16} className="a3-ring" style={{ animationDelay: `${i * 0.3}s` }} />)}
    <g transform="translate(800 350)"><path d="M-30 -60 q60 -20 60 40 q0 40 -40 50 q-10 30 -40 20" fill="none" stroke="#c98b5e" strokeWidth="14" /></g>
    <Label x={450} y={640} size={30} bg>дыбыс — ауадағы бойлық толқын, 340 м/с</Label>
  </g>
);
const Spectrum = () => (
  <g><BG />
    <defs><linearGradient id="a3-rb" x1="0" x2="1"><stop offset="0" stopColor="#8b00ff" /><stop offset=".2" stopColor="#0040ff" /><stop offset=".4" stopColor="#00c853" /><stop offset=".6" stopColor="#ffe000" /><stop offset=".8" stopColor="#ff8a00" /><stop offset="1" stopColor="#ff1f1f" /></linearGradient></defs>
    {['гамма', 'рентген', 'УК', '', 'ИҚ', 'радио'].map((n, i) => <g key={i}>{n && <rect x={60 + i * 130} y="250" width="120" height="120" rx="12" fill="#5b6478" opacity={0.35 + i * 0.1} />}{n && <Label x={120 + i * 130} y={325} size={26} c="#fff">{n}</Label>}</g>)}
    <rect x="450" y="250" width="120" height="120" rx="12" fill="url(#a3-rb)" /><Label x={510} y={410} size={26}>көрінетін</Label>
    <path d="M60 520 q 15 -60 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 q 30 -60 60 0 t 60 0 t 60 0 q 60 -60 120 0 t 120 0 t 120 0" fill="none" stroke="var(--a3-hot)" strokeWidth="6" />
    <Label x={160} y={170} size={28}>λ кіші, энергия көп</Label><Label x={720} y={170} size={28}>λ үлкен</Label>
  </g>
);

/* ───── кванттық, атом, ядро ───── */
const Glow = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    {[['#ff3a1f', 220], ['#ffb020', 450], ['#fff4d6', 680]].map(([c, x], i) => <g key={i}><circle cx={x as number} cy={330} r={110} fill={c as string} opacity=".2" className="a3-pulse" style={{ transformOrigin: `${x}px 330px` }} /><rect x={(x as number) - 60} y={290} width="120" height="80" rx="12" fill={c as string} /><Label x={x as number} y={470} size={30} c="#fff">{['~1000 K', '~3000 K', '~6000 K'][i]}</Label></g>)}
    <Label x={450} y={140} size={40} bg>E = hν</Label>
  </g>
);
const Photo = () => (
  <g><BG />
    <rect x="160" y="420" width="580" height="80" fill="#9aa4b2" /><Label x={450} y={545} size={28}>металл</Label>
    {[0, 1, 2].map((i) => <path key={i} d={`M${120 + i * 90} 80 q 20 -15 40 0 t 40 0 t 40 0 t 40 0 L ${300 + i * 90} 410`} fill="none" stroke="#8b5cf6" strokeWidth="6" />)}
    {[0, 1, 2].map((i) => <g key={i} className="a3-eject" style={{ animationDelay: `${i * 0.5}s` }}><circle cx={500 + i * 70} cy={400} r="16" fill="#1f8bff" /><text x={500 + i * 70} y={408} textAnchor="middle" fontSize="22" fill="#fff" fontWeight="800">−</text></g>)}
    <Label x={640} y={130} size={36} bg>hν = A + mυ²/2</Label>
  </g>
);
const Xray = () => (
  <g><rect width="900" height="700" fill="#0b1430" />
    <rect x="200" y="80" width="500" height="540" rx="20" fill="#14204a" stroke="#3a5aa0" strokeWidth="6" />
    <path d="M360 600 V 380 Q 330 300 360 220 M400 600 V 330 Q 400 200 410 150 M450 600 V 320 Q 455 180 460 120 M500 600 V 330 Q 510 210 520 160 M540 600 V 400 Q 570 330 600 300" stroke="#e8f3ff" strokeWidth="18" strokeLinecap="round" fill="none" opacity=".9" />
    <path d="M330 600 h240" stroke="#e8f3ff" strokeWidth="30" opacity=".6" />
    <Label x={450} y={670} size={28} c="#cfe6ff">рентген сәулесі жұмсақ ұлпадан өтеді</Label>
  </g>
);
const Penetration = () => (
  <g><BG /><g transform="translate(60 35) scale(.88)">
    <circle cx="120" cy="350" r="50" fill="#ffd23f" /><text x="120" y="365" textAnchor="middle" fontSize="40">☢</text>
    {[['α', '#e5483a', 300, 240], ['β', '#1f8bff', 520, 350], ['γ', '#17a05d', 860, 460]].map(([n, c, x2, y]) => <g key={n as string}><Flow d={`M170 ${y} H ${x2}`} c={c as string} w={10} head={false} /><Label x={220} y={(y as number) - 16} size={32} c={c as string}>{n}</Label></g>)}
    <rect x="300" y="180" width="16" height="360" fill="#e8dcc4" /><Label x={308} y={590} size={24}>қағаз</Label>
    <rect x="520" y="180" width="30" height="360" fill="#b8c0cc" /><Label x={535} y={590} size={24}>алюминий</Label>
    <rect x="740" y="180" width="70" height="360" fill="#5b6478" /><Label x={775} y={590} size={24}>қорғасын</Label></g>
  </g>
);
const Rutherford = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    <rect x="560" y="120" width="20" height="460" fill="#ffd23f" opacity=".85" />
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <path key={i} d={i === 3 ? 'M80 350 H 560 L 200 300' : i === 1 ? 'M80 250 H 560 L 760 120' : `M80 ${170 + i * 60} H 860`} fill="none" stroke="#ff5a2e" strokeWidth="5" strokeDasharray="16 10" className="a3-flow" />)}
    <Label x={300} y={110} size={30} c="#fff">α-бөлшектер алтын жапырақшада</Label>
    <Label x={450} y={640} size={28} c="#cfe6ff">көбі өтеді, аздары кері шағылады → ядро</Label>
  </g>
);
const Nucleus = () => (
  <g><BG />
    {Array.from({ length: 19 }, (_, i) => { const a = i * 2.4, r = Math.sqrt(i) * 34; return <circle key={i} cx={450 + Math.cos(a) * r} cy={350 + Math.sin(a) * r} r="32" fill={i % 2 ? '#e5483a' : '#9aa4b2'} stroke="#fff" strokeWidth="3" />; })}
    <circle cx="160" cy="590" r="22" fill="#e5483a" /><Label x={200} y={600} size={28} anchor="start">протон (+)</Label>
    <circle cx="560" cy="590" r="22" fill="#9aa4b2" /><Label x={600} y={600} size={28} anchor="start">нейтрон</Label>
    <Label x={450} y={110} size={40} bg>A = Z + N</Label>
  </g>
);
const Fission = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    <circle cx="90" cy="350" r="16" fill="#9aa4b2" /><Flow d="M110 350 H 250" c="#9aa4b2" w={6} />
    <circle cx="330" cy="350" r="70" fill="#17a05d" opacity=".9" /><Label x={330} y={362} size={30} c="#fff">²³⁵U</Label>
    <circle cx="600" cy="220" r="48" fill="#ffb020" /><circle cx="620" cy="490" r="44" fill="#ff8a1f" />
    {[[700, 330], [740, 400], [690, 610]].map(([x, y], i) => <g key={i}><Flow d={`M420 350 L ${x} ${y}`} c="#9aa4b2" w={4} /><circle cx={x} cy={y} r="14" fill="#9aa4b2" /></g>)}
    <circle cx="460" cy="350" r="60" fill="#ffd23f" opacity=".5" className="a3-pulse" style={{ transformOrigin: '460px 350px' }} />
    <Label x={450} y={90} size={30} c="#fff">тізбекті реакция + энергия</Label>
  </g>
);
const Fusion = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    <Sun x={450} y={350} r={210} />
    <circle cx="380" cy="330" r="30" fill="#e5483a" /><circle cx="520" cy="330" r="30" fill="#e5483a" /><Flow d="M410 330 H 440" c="#fff" w={6} /><Flow d="M490 330 H 460" c="#fff" w={6} />
    <Label x={450} y={630} size={30} c="#fff">жеңіл ядролар бірігеді → Күн энергиясы</Label>
  </g>
);
const Reactor = () => (
  <g><BG />
    <rect x="120" y="200" width="300" height="380" rx="40" fill="#5b6478" /><rect x="150" y="230" width="240" height="320" rx="24" fill="#3aa0e8" opacity=".6" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={175 + i * 55} y="250" width="24" height="280" fill="#17a05d" className="a3-glow" />)}
    <path d="M420 300 H 560 V 260 M420 500 H 560" stroke="#e5483a" strokeWidth="18" fill="none" />
    <circle cx="640" cy="350" r="80" fill="#9aa4b2" className="a3-spin" style={{ transformOrigin: '640px 350px' }} /><rect x="560" y="440" width="160" height="90" rx="16" fill="#ffb020" />
    <Label x={640} y={495} size={26}>генератор</Label><Label x={270} y={630} size={28}>реактор</Label>
    <path d="M760 250 q-20 -40 0 -80 q20 -40 0 -80" stroke="#c7ccd4" strokeWidth="18" fill="none" className="a3-steam" />
  </g>
);
const Particles = () => (
  <g><BG />
    {[['e', '#1f8bff', 'электрон'], ['p', '#e5483a', 'протон'], ['n', '#9aa4b2', 'нейтрон'], ['γ', '#ffb020', 'фотон'], ['ν', '#17a05d', 'нейтрино'], ['q', '#8b5cf6', 'кварк']].map(([s, c, n], i) => (
      <g key={s} transform={`translate(${180 + (i % 3) * 270} ${220 + Math.floor(i / 3) * 260})`}><circle r="80" fill={c} /><text y="22" textAnchor="middle" fontSize="64" fontWeight="800" fontStyle="italic" fill="#fff" fontFamily="Georgia, serif">{s}</text><text y="125" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--a3-ink)">{n}</text></g>))}
  </g>
);

/* ───── 10–11: газ, электрондар, толқын оптикасы, кванттар ───── */
const GasLaws = () => (
  <g><BG />
    {[0, 1].map((k) => <g key={k} transform={`translate(${130 + k * 380} 0)`}>
      <rect x="0" y="150" width="260" height="420" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="7" />
      <rect x="6" y={k ? 300 : 200} width="248" height="30" fill="#5b6478" />
      {Array.from({ length: k ? 12 : 12 }, (_, i) => <circle key={i} className="a3-jit" cx={30 + (i * 53) % 200} cy={(k ? 360 : 260) + ((i * 71) % (k ? 190 : 290))} r="11" fill="#ff5a2e" style={{ animationDuration: `${0.6 + (i % 3) * 0.3}s` }} />)}
    </g>)}
    <Label x={450} y={100} size={40} bg>pV = νRT</Label>
    <Label x={260} y={620} size={28}>V көп — p аз</Label><Label x={640} y={620} size={28}>V аз — p көп</Label>
  </g>
);
const Diode = () => (
  <g><BG />
    <rect x="150" y="250" width="300" height="200" fill="#ff8a8a" /><rect x="450" y="250" width="300" height="200" fill="#8ab8ff" />
    {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={190 + (i % 5) * 50} cy={290 + Math.floor(i / 5) * 90} r="16" fill="none" stroke="#e5483a" strokeWidth="5" />)}
    {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={490 + (i % 5) * 50} cy={290 + Math.floor(i / 5) * 90} r="12" fill="#1f6fd0" />)}
    <Label x={300} y={230} size={34}>p</Label><Label x={600} y={230} size={34}>n</Label>
    <path d="M330 590 h90 M480 590 h90 M420 550 v80 l60 -40z M480 550 v80" stroke="var(--a3-ink)" strokeWidth="7" fill="var(--a3-ink)" />
    <Label x={450} y={130} size={30} bg>p–n ауысу: ток бір бағытта</Label>
  </g>
);
const Transformer = () => (
  <g><BG />
    <path d="M250 160 h400 v380 h-400z M330 240 h240 v220 h-240z" fill="#9aa4b2" fillRule="evenodd" />
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x="225" y={250 + i * 34} width="130" height="18" rx="9" fill="#b87333" />)}
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x="545" y={245 + i * 18} width="130" height="10" rx="5" fill="#b87333" />)}
    <Label x={160} y={350} size={34}>U₁</Label><Label x={760} y={350} size={34}>U₂</Label>
    <Label x={450} y={630} size={40} bg>U₁/U₂ = N₁/N₂</Label>
  </g>
);
const Radio = () => (
  <g><Sky /><Ground y={600} />
    <path d="M200 600 L 250 180 L 300 600 M220 430 h60 M232 320 h36" stroke="#5b6478" strokeWidth="10" fill="none" /><circle cx="250" cy="170" r="16" fill="#e5483a" />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${320 + i * 80} ${110 - i * 10} Q ${380 + i * 90} 180 ${320 + i * 80} ${250 + i * 10}`} fill="none" stroke="#1f8bff" strokeWidth="8" className="a3-ring" style={{ animationDelay: `${i * 0.3}s` }} />)}
    <g transform="translate(720 470)"><rect x="-90" y="-60" width="180" height="120" rx="20" fill="#e5483a" /><circle cx="-30" cy="0" r="34" fill="#2b3245" /><rect x="20" y="-30" width="50" height="16" rx="6" fill="#fff" /><path d="M60 -60 l40 -90" stroke="#5b6478" strokeWidth="6" /></g>
    <Label x={600} y={130} size={30} bg>c = 3·10⁸ м/с</Label>
  </g>
);
const Interference = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    {[260, 440].map((y) => [1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={`${y}${i}`} cx="160" cy={y} r={i * 70} fill="none" stroke="#3fe0ff" strokeWidth="3" opacity={0.6 - i * 0.06} />))}
    <rect x="140" y="100" width="20" height="500" fill="#5b6478" />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x="760" y={110 + i * 56} width="60" height="30" rx="6" fill="#3fe0ff" opacity={i % 2 ? 0.15 : 0.9 - Math.abs(i - 4) * 0.15} />)}
    <Label x={450} y={660} size={28} c="#fff">жарық + жарық = күшею немесе әлсіреу</Label>
  </g>
);
const Polarize = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    {[0, 45, 90, 135].map((a) => <line key={a} x1="120" y1="350" x2="120" y2="210" stroke="#ffd23f" strokeWidth="6" transform={`rotate(${a} 120 350)`} />)}
    <rect x="300" y="170" width="40" height="360" rx="10" fill="#9cc9ef" opacity=".6" />{Array.from({ length: 9 }, (_, i) => <line key={i} x1="305" y1={190 + i * 38} x2="335" y2={190 + i * 38} stroke="#fff" strokeWidth="3" />)}
    <path d="M360 350 h80 M420 350 v-120 M420 350 v120" stroke="#ffd23f" strokeWidth="6" /><path d="M440 350 h300" stroke="#ffd23f" strokeWidth="4" strokeDasharray="14 10" className="a3-flow" />
    <rect x="620" y="170" width="40" height="360" rx="10" fill="#9cc9ef" opacity=".6" />
    <Label x={450} y={650} size={28} c="#fff">поляризатор бір бағыттағы тербелісті өткізеді</Label>
  </g>
);
const Laser = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    <rect x="80" y="290" width="340" height="120" rx="20" fill="#5b6478" /><rect x="400" y="320" width="30" height="60" fill="#9aa4b2" />
    <path d="M430 350 H 880" stroke="#ff2a2a" strokeWidth="10" className="a3-glow" /><path d="M430 350 H 880" stroke="#ff8a8a" strokeWidth="3" />
    <Label x={250} y={360} size={30} c="#fff">лазер</Label>
    <Label x={600} y={250} size={28} c="#fff">когерентті, монохромат, жіңішке шоқ</Label>
  </g>
);
const HR = () => (
  <g><Night n={0} />
    <path d="M120 600 h700 M120 600 v-520" stroke="#cfd6e0" strokeWidth="5" />
    {Array.from({ length: 40 }, (_, i) => { const t = i / 39; return <circle key={i} cx={160 + t * 620} cy={140 + t * 400 + Math.sin(i) * 20} r={14 - t * 9} fill={`hsl(${210 - t * 200}, 90%, ${70 - t * 10}%)`} />; })}
    {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={560 + i * 45} cy={170 + i * 10} r="22" fill="#ff7a4d" />)}
    {[0, 1, 2].map((i) => <circle key={i} cx={240 + i * 40} cy={520 + i * 12} r="7" fill="#fff" />)}
    <Label x={480} y={650} size={26} c="#fff">температура ←</Label><Label x={100} y={60} size={26} c="#fff" anchor="start">жарқырауы ↑</Label>
    <Label x={420} y={300} size={24} c="#cfe6ff">бас тізбек</Label><Label x={690} y={120} size={24} c="#ff9a7a">алыптар</Label><Label x={280} y={580} size={24} c="#fff">ақ ергежейлілер</Label>
  </g>
);
const Nano = () => (
  <g><BG />
    {Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, c) => { const x = 130 + c * 90 + (r % 2) * 45, y = 150 + r * 78; return <g key={`${r}${c}`}><circle cx={x} cy={y} r="16" fill="#2b3245" />{c < 7 && <line x1={x + 16} y1={y} x2={x + 74} y2={y} stroke="#5b6478" strokeWidth="5" />}</g>; }))}
    <Label x={450} y={660} size={30} bg>1 нм = 10⁻⁹ м</Label>
  </g>
);

/* ───── 10–11: сұйық/қатты дене, гидродинамика, айнымалы ток, дисперсия ───── */
const Capillary = () => (
  <g><BG />
    <rect x="80" y="420" width="740" height="200" fill="#4fa6ff" opacity=".7" /><path d="M80 420 h740" stroke="var(--a3-line)" strokeWidth="4" />
    {[[200, 18, 160], [380, 30, 90], [560, 48, 50]].map(([x, w, up]) => <g key={x}><rect x={x} y={120} width={w} height={420} fill="none" stroke="var(--a3-line)" strokeWidth="5" /><rect x={x + 3} y={420 - up} width={w - 6} height={120 + up} fill="#1f6fd0" opacity=".85" /><path d={`M${x + 3} ${420 - up} q ${(w - 6) / 2} 12 ${w - 6} 0`} fill="#4fa6ff" /></g>)}
    <g transform="translate(720 410)"><ellipse rx="34" ry="12" fill="#5b3a29" /><path d="M-30 0 l-50 14 M30 0 l50 14 M-20 6 l-40 30 M20 6 l40 30" stroke="#5b3a29" strokeWidth="5" /></g>
    <Label x={430} y={90} size={36} bg>h = 2σ / (ρgr)</Label><Label x={720} y={370} size={24}>су өлшегіш</Label>
  </g>
);
const Humidity = () => (
  <g><Sky /><Ground y={560} c="#7fb35a" />
    {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${60 + i * 60} 560 q 10 -50 20 -70`} stroke="#3a8a3a" strokeWidth="8" fill="none" />)}
    {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={75 + i * 70} cy={500 + (i % 3) * 8} r="9" fill="#cfe9ff" stroke="#7fb8ff" strokeWidth="3" />)}
    <g transform="translate(640 120)"><rect x="0" y="0" width="200" height="300" rx="20" fill="#fff" stroke="#8a93a3" strokeWidth="5" /><rect x="40" y="40" width="20" height="200" rx="10" fill="#e5483a" /><rect x="140" y="40" width="20" height="200" rx="10" fill="#e5483a" /><rect x="140" y="250" width="20" height="30" fill="#4fa6ff" /><text x="100" y="290" textAnchor="middle" fontSize="22" fill="#2b3245">психрометр</text></g>
    <Label x={300} y={160} size={36} bg>φ = p / p₀ · 100%</Label><Label x={300} y={230} size={28}>шық — ауа салқындағанда</Label>
  </g>
);
const Phase = () => (
  <g><BG />
    <path d="M120 600 h680 M120 600 v-520" stroke="var(--a3-line)" strokeWidth="5" />
    <path d="M150 580 Q 300 470 420 380 Q 600 260 760 140" fill="none" stroke="#1f8bff" strokeWidth="8" />
    <path d="M420 380 L 360 100" fill="none" stroke="#17a05d" strokeWidth="8" /><path d="M150 580 Q 280 520 420 380" fill="none" stroke="#8b5cf6" strokeWidth="8" />
    <circle cx="420" cy="380" r="14" fill="var(--a3-hot)" /><circle cx="760" cy="140" r="14" fill="#ffb020" />
    <Label x={230} y={260} size={34}>қатты</Label><Label x={560} y={240} size={34}>сұйық</Label><Label x={600} y={500} size={34}>газ</Label>
    <Label x={470} y={420} size={26} anchor="start">үштік нүкте</Label><Label x={760} y={110} size={26}>кризистік</Label>
    <Label x={140} y={70} size={28} anchor="start">p</Label><Label x={800} y={640} size={28}>T</Label>
  </g>
);
const Crystal = () => (
  <g><BG />
    {Array.from({ length: 5 }, (_, r) => Array.from({ length: 6 }, (_, c) => { const x = 180 + c * 110, y = 140 + r * 100; return <g key={`${r}${c}`}>{c < 5 && <line x1={x} y1={y} x2={x + 110} y2={y} stroke="#9aa4b2" strokeWidth="5" />}{r < 4 && <line x1={x} y1={y} x2={x} y2={y + 100} stroke="#9aa4b2" strokeWidth="5" />}<circle cx={x} cy={y} r="22" fill="#1f8bff" className="a3-jit" style={{ animationDuration: '.9s' }} /></g>; }))}
    <Label x={450} y={660} size={32} bg>σ = Eε — Гук заңы</Label>
  </g>
);
const Flow2 = () => (
  <g><Sky />
    {[0, 1, 2, 3].map((i) => <Flow key={i} d={`M40 ${180 + i * 50} H 860`} c="#1f8bff" w={6} head={false} />)}
    <path d="M300 420 C 400 330 620 330 720 420 C 620 440 400 440 300 420Z" fill="#5b6478" />
    {[0, 1, 2].map((i) => <Flow key={i} d={`M40 ${360 + i * 40} C 300 ${360 + i * 40}, 320 ${330 + i * 20}, 500 ${325 + i * 20} S 760 ${400 + i * 40}, 860 ${370 + i * 50}`} c="#1f8bff" w={5} head={false} />)}
    {[0, 1, 2].map((i) => <path key={i} d={`M${760 + i * 30} ${470 + i * 20} q 20 -30 40 0 t 40 0`} fill="none" stroke="#e5483a" strokeWidth="5" />)}
    <Arrow x1={510} y1={340} x2={510} y2={200} c="#17a05d" label="Fкөт" lx={530} ly={230} />
    <Label x={250} y={620} size={28} bg>ламинарлы → турбулентті</Label>
  </g>
);
const Prism = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    <path d="M60 380 L 360 330" stroke="#fff" strokeWidth="10" />
    <path d="M450 160 L 600 460 L 300 460 Z" fill="#cfe6ff" opacity=".35" stroke="#fff" strokeWidth="4" />
    {['#ff1f1f', '#ff8a00', '#ffe000', '#00c853', '#00b0ff', '#2a5cff', '#8b00ff'].map((c, i) => <path key={c} d={`M520 ${360 + i * 4} L 880 ${360 + i * 38}`} stroke={c} strokeWidth="12" />)}
    <Label x={450} y={620} size={30} c="#fff">ақ жарық = 7 түс (дисперсия)</Label>
  </g>
);
const Lenz = () => (
  <g><BG />
    {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx={520 + i * 30} cy="350" rx="20" ry="120" fill="none" stroke="#b87333" strokeWidth="10" />)}
    <g className="a3-push2"><g transform="translate(-60 0)"><rect x="160" y="310" width="120" height="80" fill="#e5483a" /><rect x="280" y="310" width="120" height="80" fill="#1f8bff" /><text x="220" y="365" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff">S</text><text x="340" y="365" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff">N</text></g></g>
    <path d="M760 470 v80 h-280 v-80" fill="none" stroke="var(--a3-line)" strokeWidth="6" /><circle cx="620" cy="550" r="40" fill="#fff" stroke="var(--a3-line)" strokeWidth="6" /><path d="M620 550 l20 -26" stroke="#e5483a" strokeWidth="6" className="a3-needle" style={{ transformOrigin: '620px 550px' }} />
    <Label x={450} y={130} size={30} bg>индукциялық ток өзін тудырған өзгеріске қарсы</Label>
  </g>
);
const Kirchhoff = () => (
  <g><BG />
    <circle cx="450" cy="350" r="22" fill="var(--a3-ink)" />
    <Arrow x1={130} y1={200} x2={430} y2={340} c="#1f8bff" label="I₁" lx={220} ly={210} /><Arrow x1={130} y1={500} x2={430} y2={360} c="#1f8bff" label="I₂" lx={220} ly={520} />
    <Arrow x1={470} y1={350} x2={800} y2={350} c="var(--a3-hot)" w={16} label="I₃" lx={700} ly={320} />
    <Label x={450} y={620} size={40} bg>I₁ + I₂ = I₃</Label>
  </g>
);
const ACWave = () => (
  <g><BG />
    <path d="M90 350 h740 M90 120 v460" stroke="var(--a3-line)" strokeWidth="5" />
    <path d="M90 350 C 140 150 220 150 270 350 S 400 550 450 350 S 580 150 630 350 S 760 550 810 350" fill="none" stroke="var(--a3-hot)" strokeWidth="10" strokeDasharray="1400" className="a3-draw" />
    <path d="M90 350 C 140 230 220 230 270 350 S 400 470 450 350 S 580 230 630 350 S 760 470 810 350" fill="none" stroke="#1f8bff" strokeWidth="8" strokeDasharray="1400" className="a3-draw" transform="translate(40 0)" />
    <Label x={110} y={110} size={30} anchor="start">u, i</Label><Label x={830} y={400} size={30}>t</Label>
    <Label x={450} y={640} size={36} bg>u = Um sin ωt</Label>
  </g>
);
const PowerPlant = () => (
  <g><Sky /><Ground y={560} />
    <path d="M140 560 L 170 300 H 260 L 290 560Z" fill="#c9d1dc" /><path d="M215 300 q-20 -50 0 -100 q20 -50 0 -100" stroke="#e8edf3" strokeWidth="30" fill="none" className="a3-steam" />
    <rect x="330" y="420" width="180" height="140" fill="#8a93a3" />
    {[0, 1].map((i) => <g key={i} transform={`translate(${620 + i * 160} 260)`}><rect x="-6" y="0" width="12" height="300" fill="#e8edf3" /><g className="a3-spin2" style={{ transformOrigin: '0px 0px', animationDuration: '3s' }}>{[0, 120, 240].map((a) => <rect key={a} x="-8" y="-120" width="16" height="120" rx="8" fill="#fff" transform={`rotate(${a})`} />)}</g></g>)}
    <path d="M520 470 L 600 470 L 600 380 L 880 380" stroke="#ffb020" strokeWidth="5" fill="none" strokeDasharray="14 10" className="a3-flow" />
    <Label x={450} y={640} size={28} c="#fff">ЖЭС · ГЭС · АЭС · ЖЭС (жел) · КЭС</Label>
  </g>
);

export const SCENES_M: Record<string, () => ReactNode> = {
  science: () => <Science />, measure: () => <Measure />, si: () => <SI />, vectors: () => <Vectors />, car_motion: () => <CarMotion />, relativity: () => <Relativity />,
  graph_xt: () => <GraphXT />, balance: () => <Balance />, volume: () => <Volume />, density: () => <Density />, inertia: () => <Inertia />, forces: () => <Forces />,
  gravity: () => <Gravity />, spring_scene: () => <SpringScene />, friction_force: () => <FrictionForce />, pressure: () => <PressureBricks />, pascal: () => <Pascal />,
  hydrostatic: () => <Hydrostatic />, vessels: () => <Vessels />, torricelli: () => <Torricelli />, hydraulic: () => <Hydraulic />, archimedes: () => <ArchimedesScene />,
  floating: () => <Floating />, work: () => <Work />, skate: () => <Skate />, lever: () => <Lever />, pulley: () => <Pulley />, incline: () => <Incline />,
  center_mass: () => <CenterMass />, sky: () => <SkyScene />, solar: () => <SolarSystem />, seasons: () => <Seasons />, moon: () => <Moon />,
  celestial: () => <CelestialSphere />, kepler: () => <Kepler />, stars: () => <Stars />, galaxy: () => <Galaxy />, accel: () => <Accel />, free_fall: () => <FreeFall />,
  projectile: () => <Projectile />, circle: () => <Circle />, newton3: () => <Newton3 />, gravitation: () => <Gravitation />, weightless: () => <Weightless />,
  orbit: () => <Orbit />, collision: () => <Collision />, rocket: () => <Rocket />, swing: () => <Swing />, string_wave: () => <StringWave />, sound: () => <Sound />,
  spectrum: () => <Spectrum />, glow: () => <Glow />, photo: () => <Photo />, xray: () => <Xray />, penetration: () => <Penetration />, rutherford: () => <Rutherford />,
  nucleus: () => <Nucleus />, fission: () => <Fission />, fusion: () => <Fusion />, reactor: () => <Reactor />, particles: () => <Particles />, gas_laws: () => <GasLaws />,
  diode: () => <Diode />, transformer: () => <Transformer />, radio: () => <Radio />, interference: () => <Interference />, polarize: () => <Polarize />, laser: () => <Laser />,
  hr: () => <HR />, nano: () => <Nano />, capillary: () => <Capillary />, humidity: () => <Humidity />, phase: () => <Phase />, crystal: () => <Crystal />,
  flow: () => <Flow2 />, prism: () => <Prism />, lenz: () => <Lenz />, kirchhoff: () => <Kirchhoff />, ac_wave: () => <ACWave />, power_plant: () => <PowerPlant />,
};
