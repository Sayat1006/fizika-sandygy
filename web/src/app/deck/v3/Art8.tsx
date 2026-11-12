/* 8-сынып суреттері: жылу, электр, магнетизм, оптика (900×700 сахна). Art.tsx ішіндегі ортақ бөліктерді қолданады. */
import type { ReactNode } from 'react';
import { Flow, Label, Sun } from './parts';

const BG = ({ c = 'var(--a3-bg2)' }: { c?: string }) => <rect width="900" height="700" fill={c} />;
const rnd = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
const Dots = ({ n, x, y, w, h, c, r = 12, cls = 'a3-jit', seed = 1 }: { n: number; x: number; y: number; w: number; h: number; c: string; r?: number; cls?: string; seed?: number }) => (
  <g>{Array.from({ length: n }, (_, i) => <circle key={i} className={cls} cx={x + rnd(i, seed) * w} cy={y + rnd(i, seed + 7) * h} r={r} fill={c} style={{ animationDelay: `${-rnd(i, seed + 3) * 3}s`, animationDuration: `${1.2 + rnd(i, seed + 5) * 1.6}s` }} />)}</g>
);
const Flame = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className="a3-flick">
    <path d="M0 0 C -50 -30 -40 -90 0 -150 C 10 -100 50 -80 40 -30 C 35 -5 15 0 0 0Z" fill="#ff7a1f" />
    <path d="M0 -5 C -22 -20 -18 -60 2 -95 C 8 -60 28 -50 22 -25 C 18 -8 8 -5 0 -5Z" fill="#ffd23f" />
  </g>
);
const Bulb = ({ x, y, on = true, s = 1 }: { x: number; y: number; on?: boolean; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {on && <circle r="110" fill="#ffd23f" opacity=".35" className="a3-pulse" />}
    <circle r="60" fill={on ? '#ffe270' : '#e8edf3'} stroke="#8a93a3" strokeWidth="5" />
    <path d="M-20 0 q10 -25 20 0 q10 25 20 0" fill="none" stroke={on ? '#ff8a1f' : '#8a93a3'} strokeWidth="5" />
    <rect x="-28" y="52" width="56" height="44" rx="6" fill="#9aa4b2" />
  </g>
);
const Cell = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="-90" y="-40" width="180" height="80" rx="16" fill="#2b3245" /><rect x="-90" y="-40" width="70" height="80" rx="16" fill="#e5483a" />
    <rect x="90" y="-16" width="16" height="32" rx="4" fill="#2b3245" />
    <text x="-55" y="14" textAnchor="middle" fontSize="40" fontWeight="800" fill="#fff">+</text><text x="40" y="14" textAnchor="middle" fontSize="40" fontWeight="800" fill="#fff">−</text>
  </g>
);
const Magnet = ({ x, y, w = 360, h = 90 }: { x: number; y: number; w?: number; h?: number }) => (
  <g transform={`translate(${x - w / 2} ${y - h / 2})`}>
    <rect width={w / 2} height={h} rx="10" fill="#e5483a" /><rect x={w / 2} width={w / 2} height={h} rx="10" fill="#1f8bff" />
    <text x={w / 4} y={h / 2 + 18} textAnchor="middle" fontSize="50" fontWeight="800" fill="#fff">N</text>
    <text x={(3 * w) / 4} y={h / 2 + 18} textAnchor="middle" fontSize="50" fontWeight="800" fill="#fff">S</text>
  </g>
);
const Ray = ({ d, c = '#ffb800', w = 7 }: { d: string; c?: string; w?: number }) => <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray="30 16" className="a3-flow" />;

/* ───── жылу ───── */
const Diffusion = () => (
  <g><BG />
    <rect x="120" y="120" width="660" height="460" rx="30" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="6" />
    <Dots n={40} x={150} y={150} w={380} h={400} c="#1f8bff" cls="a3-drift" seed={1} />
    <Dots n={40} x={370} y={150} w={380} h={400} c="#ff5a2e" cls="a3-drift2" seed={9} />
    <Label x={450} y={650} size={34}>бөлшектер өздігінен араласады</Label>
  </g>
);
const Brownian = () => (
  <g><BG />
    <circle cx="450" cy="350" r="290" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="6" />
    <Dots n={60} x={200} y={110} w={500} h={480} c="#7fb8ff" r={9} seed={4} />
    <g className="a3-brown"><circle cx="450" cy="350" r="56" fill="#c8662b" /><circle cx="432" cy="332" r="14" fill="#fff" opacity=".4" /></g>
    <path d="M300 520 l60 -40 l-20 -60 l70 10 l40 -70 l50 40" fill="none" stroke="#c8662b" strokeWidth="5" strokeDasharray="10 10" opacity=".6" />
    <Label x={450} y={670} size={30}>тозаң түйіршігі — соққылардан ретсіз қозғалады</Label>
  </g>
);
const Thermometer = () => (
  <g><BG />
    <rect x="390" y="70" width="120" height="480" rx="60" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="8" />
    <circle cx="450" cy="580" r="80" fill="#e5483a" stroke="var(--a3-line)" strokeWidth="8" />
    <rect x="430" y="140" width="40" height="440" rx="20" fill="#e5483a" className="a3-rise" />
    {[0, 1, 2, 3, 4, 5].map((i) => <g key={i}><path d={`M520 ${520 - i * 76} h40`} stroke="var(--a3-line)" strokeWidth="5" /><text x="580" y={530 - i * 76} fontSize="30" fontWeight="700" fill="var(--a3-ink)">{i * 20} °C</text><path d={`M340 ${520 - i * 76} h40`} stroke="var(--a3-line)" strokeWidth="5" /><text x="330" y={530 - i * 76} fontSize="30" fontWeight="700" textAnchor="end" fill="var(--a3-ink2)">{273 + i * 20} K</text></g>)}
  </g>
);
const Friction = () => (
  <g><BG />
    <rect x="80" y="470" width="740" height="60" rx="10" fill="#b98a5a" />
    <g className="a3-slide"><rect x="300" y="330" width="260" height="140" rx="16" fill="#1f8bff" /><path d="M350 400 h160" stroke="#fff" strokeWidth="10" /></g>
    {[0, 1, 2].map((i) => <path key={i} d={`M${360 + i * 70} 460 q-15 -30 0 -60 q15 -30 0 -60`} stroke="#ff5a2e" strokeWidth="9" fill="none" strokeLinecap="round" className="a3-steam" style={{ animationDelay: `${i * 0.5}s` }} />)}
    <Label x={450} y={620} size={34}>жұмыс → ішкі энергия артады</Label>
  </g>
);
const Kettle = () => (
  <g><BG />
    <rect x="200" y="560" width="500" height="60" rx="12" fill="#3b4458" />
    <Flame x={380} y={565} s={0.55} /><Flame x={450} y={565} s={0.7} /><Flame x={520} y={565} s={0.55} />
    <path d="M280 300 h340 l-30 240 h-280z" fill="#c9d1dc" stroke="var(--a3-line)" strokeWidth="6" />
    <path d="M620 340 q90 -10 110 -90" fill="none" stroke="#c9d1dc" strokeWidth="26" strokeLinecap="round" />
    <path d="M330 300 q120 -90 240 0" fill="none" stroke="var(--a3-line)" strokeWidth="12" />
    <path d="M300 380 h300 l-18 150 h-264z" fill="#4fa6ff" opacity=".7" />
    {[0, 1].map((i) => <path key={i} d={`M${730 + i * 20} 220 q-20 -40 0 -80 q20 -40 0 -80`} stroke="#c7ccd4" strokeWidth="12" fill="none" strokeLinecap="round" className="a3-steam" style={{ animationDelay: `${i * 0.7}s` }} />)}
    <Label x={250} y={230} size={40} anchor="start" bg>Q = cmΔt</Label>
  </g>
);
const Fuel = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    <circle cx="450" cy="460" r="260" fill="#ff7a1f" opacity=".14" className="a3-pulse" />
    <Flame x={450} y={540} s={1.9} />
    <rect x="270" y="540" width="360" height="44" rx="22" fill="#7a4b2a" transform="rotate(-12 450 560)" /><rect x="270" y="540" width="360" height="44" rx="22" fill="#8a5a3a" transform="rotate(12 450 560)" />
    <Label x={450} y={130} size={40} c="#fff">Q = qm</Label>
    <Label x={450} y={660} size={28} c="#cfd6e0">отын жанғанда химиялық энергия → жылу</Label>
  </g>
);
const Mix = () => (
  <g><BG />
    {[[160, '#ff5a2e', '80 °C'], [380, '#1f8bff', '20 °C']].map(([x, c, t]) => <g key={t as string}><path d={`M${x} 250 h160 l-14 200 h-132z`} fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="6" /><path d={`M${(x as number) + 6} 300 h148 l-10 144 h-128z`} fill={c as string} opacity=".75" /><Label x={(x as number) + 80} y={220} size={34}>{t}</Label></g>)}
    <text x="580" y="380" fontSize="70" fontWeight="800" fill="var(--a3-ink)">→</text>
    <path d="M660 220 h180 l-16 250 h-148z" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="6" /><path d="M666 270 h168 l-12 194 h-144z" fill="#a35bd6" opacity=".7" />
    <Label x={750} y={190} size={34}>θ</Label>
    <Label x={450} y={600} size={36} bg>Q₁ (берген) = Q₂ (алған)</Label>
  </g>
);
const Melting = () => (
  <g><BG />
    <path d="M120 600 h660" stroke="var(--a3-line)" strokeWidth="6" /><path d="M120 600 v-500" stroke="var(--a3-line)" strokeWidth="6" />
    <path d="M120 560 L300 400 L560 400 L760 200" fill="none" stroke="var(--a3-hot)" strokeWidth="12" strokeLinejoin="round" strokeDasharray="1400" className="a3-draw" />
    <Label x={430} y={380} size={30}>балқу: t = const</Label>
    <g transform="translate(200 470)" className="a3-melt"><rect x="-50" y="-50" width="100" height="100" rx="14" fill="#bfe3ff" stroke="#7fb8ff" strokeWidth="5" /></g>
    <Label x={140} y={90} size={28} anchor="start">t, °C</Label><Label x={790} y={650} size={28} anchor="end">уақыт</Label>
  </g>
);
const Evaporation = () => (
  <g><rect width="900" height="700" fill="url(#a3-sky)" />
    <Sun x={720} y={120} r={60} />
    <rect y="520" width="900" height="180" fill="#9c8b6e" />
    <ellipse cx="400" cy="530" rx="260" ry="40" fill="#4fa6ff" />
    {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={220 + i * 50} cy={500} r="12" fill="#1f6fd0" className="a3-rise2" style={{ animationDelay: `${i * 0.35}s` }} />)}
    <Label x={400} y={640} size={32} c="#fff">ең шапшаң молекулалар ұшып шығады</Label>
  </g>
);
const Boiling = () => (
  <g><BG />
    <Flame x={380} y={640} s={0.6} /><Flame x={450} y={640} s={0.75} /><Flame x={520} y={640} s={0.6} />
    <path d="M230 260 h440 v300 a30 30 0 0 1 -30 30 h-380 a30 30 0 0 1 -30 -30z" fill="#c9d1dc" stroke="var(--a3-line)" strokeWidth="6" />
    <rect x="240" y="320" width="420" height="260" rx="20" fill="#4fa6ff" opacity=".8" />
    {Array.from({ length: 10 }, (_, i) => <circle key={i} cx={270 + (i * 41) % 380} cy={560} r={10 + (i % 3) * 6} fill="none" stroke="#fff" strokeWidth="5" className="a3-bubble" style={{ animationDelay: `${i * 0.28}s` }} />)}
    <Label x={450} y={210} size={36} bg>Q = Lm · 100 °C</Label>
  </g>
);
const Piston = () => (
  <g><BG />
    <rect x="280" y="120" width="340" height="460" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="8" />
    <g className="a3-piston"><rect x="288" y="250" width="324" height="40" fill="#5b6478" /><rect x="430" y="90" width="40" height="160" fill="#5b6478" /></g>
    <Dots n={26} x={300} y={320} w={300} h={240} c="#ff5a2e" r={10} seed={2} />
    <Flame x={450} y={680} s={0.6} />
    <Label x={700} y={250} size={34} anchor="start">A = pΔV</Label>
    <Label x={700} y={420} size={30} anchor="start">Q = ΔU + A</Label>
  </g>
);
const Engine = () => (
  <g><BG />
    <rect x="250" y="50" width="400" height="120" rx="24" fill="#ff5a2e" /><Label x={450} y={125} c="#fff" size={34}>Қыздырғыш T₁</Label>
    <circle cx="450" cy="350" r="110" fill="#5b6478" /><Label x={450} y={360} c="#fff" size={26}>қозғалтқыш</Label>
    <rect x="250" y="530" width="400" height="120" rx="24" fill="#1f8bff" /><Label x={450} y={605} c="#fff" size={30}>Салқындатқыш T₂</Label>
    <Flow d="M450 175 V 232" c="var(--a3-hot)" w={18} /><Label x={480} y={220} size={32} anchor="start">Q₁</Label>
    <Flow d="M450 465 V 522" c="var(--a3-cold)" w={14} /><Label x={480} y={505} size={32} anchor="start">Q₂</Label>
    <Flow d="M565 350 H 790" c="#17a05d" w={16} /><Label x={700} y={320} size={34}>A</Label>
    <Label x={160} y={360} size={34} bg>η = A/Q₁</Label>
  </g>
);
const Efficiency = () => (
  <g><BG />
    <path d="M80 250 H 420 C 520 250 520 200 600 200 H 820 V 330 H 600 C 540 330 520 380 420 380 Z" fill="#17a05d" opacity=".85" />
    <path d="M80 380 H 420 C 520 380 540 440 600 520 L 650 620 L 520 620 L 470 520 C 450 480 440 470 420 470 H 80Z" fill="#ff5a2e" opacity=".75" />
    <Label x={200} y={330} size={40} c="#fff">100%</Label>
    <Label x={710} y={280} size={34} c="#fff">пайдалы ~30%</Label>
    <Label x={590} y={670} size={30}>шығын (жылу) ~70%</Label>
  </g>
);
const Ecology = () => (
  <g><rect width="900" height="700" fill="url(#a3-sky)" />
    <circle cx="450" cy="980" r="560" fill="#5cb85c" />
    <g className="a3-bob"><rect x="200" y="440" width="300" height="90" rx="30" fill="#e5483a" /><path d="M250 440 l40 -60 h140 l40 60z" fill="#e5483a" /><circle cx="270" cy="535" r="32" fill="#2b3245" /><circle cx="430" cy="535" r="32" fill="#2b3245" /></g>
    {[0, 1, 2].map((i) => <circle key={i} cx={140 - i * 30} cy={490 - i * 50} r={30 + i * 18} fill="#6b7280" opacity=".55" className="a3-steam" style={{ animationDelay: `${i * 0.6}s` }} />)}
    <rect x="600" y="210" width="80" height="330" fill="#8a93a3" /><rect x="700" y="270" width="70" height="270" fill="#8a93a3" />
    {[0, 1].map((i) => <circle key={i} cx={640 + i * 95} cy={170 + i * 60} r={50} fill="#4b5563" opacity=".6" className="a3-steam" style={{ animationDelay: `${i * 0.8}s` }} />)}
    <Label x={450} y={110} size={34} bg>CO₂ → парниктік әсер</Label>
  </g>
);
const Organism = () => (
  <g><rect width="900" height="700" fill="url(#a3-sky)" /><Sun x={760} y={110} r={60} />
    <rect y="560" width="900" height="140" fill="#e9c27a" />
    <g transform="translate(300 250)"><circle cx="0" cy="0" r="60" fill="#c98b5e" /><rect x="-60" y="70" width="120" height="200" rx="50" fill="#1f8bff" /><rect x="-30" y="270" width="24" height="60" fill="#2b3245" /><rect x="6" y="270" width="24" height="60" fill="#2b3245" />
      {[0, 1, 2].map((i) => <path key={i} d={`M${40 + i * 14} ${-10 + i * 30} q8 14 0 24 q-8 -10 0 -24z`} fill="#4fa6ff" className="a3-drop" style={{ animationDelay: `${i * 0.5}s` }} />)}</g>
    <g transform="translate(620 470)"><ellipse cx="0" cy="0" rx="110" ry="60" fill="#c49a5c" /><path d="M-40 -55 q30 -60 60 0" fill="#c49a5c" /><path d="M70 -20 l60 -70 l20 10 l-40 80" fill="#c49a5c" /><rect x="-70" y="40" width="18" height="80" fill="#a77d45" /><rect x="50" y="40" width="18" height="80" fill="#a77d45" /></g>
    <Label x={300} y={130} size={28} bg>тер буланып салқындатады</Label>
    <Label x={640} y={340} size={28} bg>түйе — жылуды сақтайды</Label>
  </g>
);

/* ───── электр ───── */
const Balloon = () => (
  <g><BG />
    <g transform="translate(300 360)"><circle r="130" fill="#f2c9a0" />{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${-110 + i * 20} -90 Q ${-60 + i * 22} -200 ${200 + i * 4} ${-150 + i * 6}`} stroke="#5b3a29" strokeWidth="6" fill="none" className="a3-hair" />)}<circle cx="-40" cy="10" r="10" fill="#2b3245" /><circle cx="40" cy="10" r="10" fill="#2b3245" /><path d="M-40 60 q40 30 80 0" stroke="#2b3245" strokeWidth="7" fill="none" /></g>
    <g className="a3-bob" style={{ transformOrigin: '640px 280px' }}><ellipse cx="640" cy="260" rx="130" ry="160" fill="#e5483a" /><path d="M640 420 q-20 80 10 160" stroke="var(--a3-line)" strokeWidth="4" fill="none" />
      {[[580, 200], [650, 160], [700, 240], [600, 300], [680, 320]].map(([x, y], i) => <text key={i} x={x} y={y} fontSize="46" fontWeight="800" fill="#fff">−</text>)}</g>
    {[[260, 220], [330, 200], [380, 250]].map(([x, y], i) => <text key={i} x={x} y={y} fontSize="46" fontWeight="800" fill="#e5483a">+</text>)}
    <Label x={450} y={650} size={32}>үйкелгенде зарядталады</Label>
  </g>
);
const Lightning = () => (
  <g><rect width="900" height="700" fill="url(#a3-night)" />
    <g fill="#4b5578"><circle cx="300" cy="160" r="100" /><circle cx="430" cy="130" r="120" /><circle cx="570" cy="170" r="100" /><rect x="220" y="160" width="440" height="100" rx="50" /></g>
    {Array.from({ length: 8 }, (_, i) => <text key={i} x={260 + i * 50} y={240} fontSize="36" fontWeight="800" fill="#ff8a8a">−</text>)}
    <path d="M460 270 l-60 140 h60 l-50 160 l140 -200 h-70 l50 -100z" fill="#ffe270" className="a3-flash" />
    <rect y="600" width="900" height="100" fill="#2f3a2a" />
    {Array.from({ length: 8 }, (_, i) => <text key={i} x={240 + i * 60} y={650} fontSize="36" fontWeight="800" fill="#8ad0ff">+</text>)}
  </g>
);
const Capacitor = () => (
  <g><BG />
    <rect x="300" y="120" width="40" height="420" rx="8" fill="#e5483a" /><rect x="560" y="120" width="40" height="420" rx="8" fill="#1f8bff" />
    {Array.from({ length: 6 }, (_, i) => <g key={i}><text x="255" y={170 + i * 70} fontSize="40" fontWeight="800" fill="#e5483a">+</text><text x="615" y={170 + i * 70} fontSize="40" fontWeight="800" fill="#1f8bff">−</text><Flow d={`M350 ${158 + i * 70} H 545`} c="var(--a3-ink2)" w={5} /></g>)}
    <Label x={450} y={630} size={36} bg>C = q/U</Label>
  </g>
);
const Battery = () => (
  <g><BG />
    <path d="M200 520 V 200 H 700 V 520 H 560" fill="none" stroke="var(--a3-line)" strokeWidth="12" strokeLinejoin="round" />
    <path d="M340 520 H 200" fill="none" stroke="var(--a3-line)" strokeWidth="12" />
    <path d="M200 520 V 200 H 700 V 520" fill="none" stroke="#ffb800" strokeWidth="6" strokeDasharray="14 30" className="a3-flow" />
    <Cell x={450} y={520} />
    <Bulb x={450} y={170} s={0.8} />
    <Label x={450} y={640} size={32}>ток көзі зарядтарды қозғалысқа келтіреді</Label>
  </g>
);
const BulbScene = () => (
  <g><rect width="900" height="700" fill="#141a2e" /><Bulb x={450} y={300} s={2} />
    <Label x={450} y={620} size={36} c="#fff">Q = I²Rt</Label>
  </g>
);
const OhmGraph = () => (
  <g><BG />
    <path d="M140 600 h660 M140 600 v-500" stroke="var(--a3-line)" strokeWidth="6" />
    <path d="M140 600 L760 160" stroke="#1f8bff" strokeWidth="12" strokeDasharray="1400" className="a3-draw" />
    <path d="M140 600 L760 380" stroke="#ff8a1f" strokeWidth="12" strokeDasharray="1400" className="a3-draw" />
    <Label x={160} y={90} size={34} anchor="start">I, A</Label><Label x={800} y={650} size={34} anchor="end">U, В</Label>
    <Label x={700} y={140} size={30} c="#1f8bff">R₁</Label><Label x={770} y={360} size={30} c="#ff8a1f">R₂ &gt; R₁</Label>
    <Label x={420} y={130} size={42} bg>I = U/R</Label>
  </g>
);
const Resistance = () => (
  <g><BG />
    <rect x="80" y="260" width="740" height="180" rx="90" fill="#d8a35a" opacity=".55" />
    {Array.from({ length: 7 }, (_, i) => Array.from({ length: 3 }, (_, j) => <circle key={`${i}${j}`} cx={150 + i * 100} cy={300 + j * 50} r="18" fill="#c8662b" className="a3-jit" style={{ animationDuration: '.6s' }} />))}
    <Dots n={14} x={110} y={280} w={700} h={140} c="#1f8bff" r={9} cls="a3-electron" seed={5} />
    <Label x={450} y={540} size={40} bg>R = ρl/S</Label>
  </g>
);
const SeriesParallel = () => (
  <g><BG />
    <Label x={225} y={90} size={34}>тізбектей</Label><Label x={675} y={90} size={34}>параллель</Label>
    <path d="M60 300 h80 M310 300 h80" stroke="var(--a3-line)" strokeWidth="8" /><rect x="140" y="270" width="80" height="60" fill="none" stroke="var(--a3-line)" strokeWidth="8" /><rect x="230" y="270" width="80" height="60" fill="none" stroke="var(--a3-line)" strokeWidth="8" />
    <Flow d="M60 300 H 390" c="#ffb800" w={5} />
    <path d="M500 300 h60 M790 300 h60 M560 220 v160 M790 220 v160 M560 220 h80 M720 220 h70 M560 380 h80 M720 380 h70" stroke="var(--a3-line)" strokeWidth="8" fill="none" />
    <rect x="640" y="190" width="80" height="60" fill="none" stroke="var(--a3-line)" strokeWidth="8" /><rect x="640" y="350" width="80" height="60" fill="none" stroke="var(--a3-line)" strokeWidth="8" />
    <Flow d="M500 300 H 560 V 220 H 790 V 300 H 850" c="#ffb800" w={5} /><Flow d="M560 300 V 380 H 790 V 300" c="#ffb800" w={5} head={false} />
    <Label x={225} y={480} size={30}>I бірдей</Label><Label x={225} y={530} size={30}>R = R₁ + R₂</Label>
    <Label x={675} y={480} size={30}>U бірдей</Label><Label x={675} y={530} size={30}>1/R = 1/R₁ + 1/R₂</Label>
  </g>
);
const Fuse = () => (
  <g><BG />
    <rect x="160" y="200" width="580" height="200" rx="30" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="6" />
    <rect x="120" y="240" width="60" height="120" rx="10" fill="#9aa4b2" /><rect x="720" y="240" width="60" height="120" rx="10" fill="#9aa4b2" />
    <path d="M180 300 C 300 260 380 340 430 300 M470 300 C 520 260 600 340 720 300" stroke="#ff5a2e" strokeWidth="10" fill="none" className="a3-glow" />
    <circle cx="450" cy="300" r="28" fill="#ffd23f" className="a3-flash" />
    <Label x={450} y={500} size={34} bg>ток шектен асса — сым балқиды</Label>
  </g>
);
const Electrolysis = () => (
  <g><BG />
    <path d="M200 220 h500 v360 a20 20 0 0 1 -20 20 h-460 a20 20 0 0 1 -20 -20z" fill="#cfe6ff" stroke="var(--a3-line)" strokeWidth="6" />
    <rect x="290" y="150" width="40" height="380" fill="#b87333" /><rect x="570" y="150" width="40" height="380" fill="#5b6478" />
    <path d="M310 150 V 90 H 590 V 150" fill="none" stroke="var(--a3-line)" strokeWidth="8" /><Cell x={450} y={90} />
    {Array.from({ length: 6 }, (_, i) => <g key={i}><circle cx={480} cy={280 + i * 45} r="14" fill="#1f8bff" className="a3-ionL" style={{ animationDelay: `${i * 0.4}s` }} /><circle cx={420} cy={300 + i * 45} r="14" fill="#e5483a" className="a3-ionR" style={{ animationDelay: `${i * 0.4}s` }} /></g>)}
    <Label x={450} y={660} size={36} bg>m = kIt</Label>
  </g>
);

/* ───── магнетизм ───── */
const MagnetField = () => (
  <g><BG />
    {[60, 120, 190, 270].map((h, i) => <g key={i}><path d={`M260 350 C 260 ${350 - h * 1.4}, 640 ${350 - h * 1.4}, 640 350`} fill="none" stroke="var(--a3-ink2)" strokeWidth="5" strokeDasharray="20 14" className="a3-flow" /><path d={`M260 350 C 260 ${350 + h * 1.4}, 640 ${350 + h * 1.4}, 640 350`} fill="none" stroke="var(--a3-ink2)" strokeWidth="5" strokeDasharray="20 14" className="a3-flow" /></g>)}
    <Magnet x={450} y={350} />
    <Label x={450} y={660} size={30}>сызықтар N-нан шығып, S-ке кіреді</Label>
  </g>
);
const WireField = () => (
  <g><BG />
    <ellipse cx="450" cy="420" rx="330" ry="110" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="4" />
    {[90, 170, 250].map((r) => <ellipse key={r} cx="450" cy="420" rx={r} ry={r / 3} fill="none" stroke="#1f8bff" strokeWidth="6" strokeDasharray="22 14" className="a3-flow" />)}
    <rect x="435" y="60" width="30" height="600" fill="#b87333" />
    <Flow d="M500 600 V 120" c="var(--a3-hot)" w={10} /><Label x={540} y={140} size={34} anchor="start">I</Label>
    <Label x={160} y={140} size={30} anchor="start" bg>оң бұранда ережесі</Label>
  </g>
);
const Crane = () => (
  <g><rect width="900" height="700" fill="url(#a3-sky)" />
    <path d="M120 640 V 120 H 700" stroke="#f0a500" strokeWidth="30" fill="none" /><path d="M600 120 V 260" stroke="var(--a3-line)" strokeWidth="6" />
    <g className="a3-lift"><rect x="510" y="260" width="180" height="60" rx="12" fill="#5b6478" /><path d="M520 320 v20 h160 v-20" stroke="#b87333" strokeWidth="10" fill="none" />
      {[[530, 350], [580, 360], [630, 350], [560, 400], [610, 405]].map(([x, y], i) => <rect key={i} x={x} y={y} width="50" height="36" rx="6" fill="#8a93a3" transform={`rotate(${i * 13 - 20} ${x + 25} ${y + 18})`} />)}</g>
    <rect y="600" width="900" height="100" fill="#8a7a5a" />
    <Label x={300} y={250} size={30} bg>ток бар — тартады</Label>
  </g>
);
const Motor = () => (
  <g><BG />
    <rect x="80" y="220" width="180" height="260" rx="20" fill="#e5483a" /><text x="170" y="370" textAnchor="middle" fontSize="70" fontWeight="800" fill="#fff">N</text>
    <rect x="640" y="220" width="180" height="260" rx="20" fill="#1f8bff" /><text x="730" y="370" textAnchor="middle" fontSize="70" fontWeight="800" fill="#fff">S</text>
    <g className="a3-spin" style={{ transformOrigin: '450px 350px' }}><rect x="330" y="300" width="240" height="100" fill="none" stroke="#b87333" strokeWidth="16" rx="8" /><circle cx="450" cy="350" r="16" fill="var(--a3-line)" /></g>
    <Flow d="M300 600 C 400 650, 500 650, 600 600" c="#ffb800" w={8} />
    <Label x={450} y={130} size={34} bg>электр энергиясы → механикалық</Label>
  </g>
);

/* ───── оптика ───── */
const Shadow = () => (
  <g><BG />
    <rect x="760" y="60" width="40" height="580" fill="var(--a3-line)" opacity=".4" />
    <circle cx="140" cy="350" r="40" fill="#ffd23f" className="a3-pulse" />
    <Ray d="M140 350 L 760 120" /><Ray d="M140 350 L 760 580" /><Ray d="M140 350 L 420 270" /><Ray d="M140 350 L 420 430" />
    <circle cx="430" cy="350" r="90" fill="#5b6478" />
    <path d="M760 160 L 760 540" stroke="#141a2e" strokeWidth="36" opacity=".8" />
    <Label x={430} y={520} size={28}>дене</Label><Label x={690} y={660} size={28}>көлеңке</Label>
  </g>
);
const SphMirror = () => (
  <g><BG />
    <path d="M700 80 Q 560 350 700 620" fill="none" stroke="#8a93a3" strokeWidth="18" />
    {[160, 260, 350, 440, 540].map((y, i) => <Ray key={i} d={`M80 ${y} L ${640 - Math.abs(y - 350) * 0.15} ${y} L 420 350`} />)}
    <circle cx="420" cy="350" r="14" fill="var(--a3-hot)" /><Label x={420} y={410} size={34}>F</Label>
    <Label x={250} y={640} size={30}>ойыс айна сәулені жинайды</Label>
  </g>
);
const Fiber = () => (
  <g><rect width="900" height="700" fill="#141a2e" />
    <path d="M40 300 C 300 300, 500 420, 860 420" stroke="#3b4a6e" strokeWidth="120" fill="none" />
    <path d="M40 300 C 300 300, 500 420, 860 420" stroke="#5b6f9e" strokeWidth="80" fill="none" opacity=".6" />
    <path d="M40 280 L 160 330 L 280 270 L 400 360 L 520 340 L 640 440 L 760 390 L 860 430" fill="none" stroke="#3fe0ff" strokeWidth="8" strokeDasharray="26 14" className="a3-flow" />
    <Label x={450} y={150} size={34} c="#fff">толық ішкі шағылу</Label>
    <Label x={450} y={620} size={28} c="#cfd6e0">сәуле талшықтан шықпай, мыңдаған км жүреді</Label>
  </g>
);
const Telescope = () => (
  <g><rect width="900" height="700" fill="url(#a3-night)" />
    {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 137) % 900} cy={(i * 59) % 360} r={i % 3 ? 2 : 4} fill="#fff" opacity=".8" />)}
    <circle cx="760" cy="110" r="60" fill="#f4f1d0" />
    <g transform="rotate(-25 450 450)"><rect x="200" y="400" width="480" height="100" rx="20" fill="#e8edf3" /><rect x="660" y="385" width="50" height="130" rx="10" fill="#9aa4b2" /><rect x="150" y="420" width="60" height="60" rx="8" fill="#5b6478" /></g>
    <path d="M430 520 L 340 660 M470 520 L 560 660 M450 520 V 660" stroke="#9aa4b2" strokeWidth="12" />
  </g>
);


const Refraction = () => (
  <g><rect width="900" height="700" fill="url(#a3-sky)" />
    <rect y="330" width="900" height="370" fill="#3aa0e8" opacity=".85" />
    <path d="M450 40 V 660" stroke="var(--a3-line)" strokeWidth="4" strokeDasharray="14 12" />
    <Ray d="M150 60 L 450 330" w={10} /><Ray d="M450 330 L 600 660" w={10} /><path d="M450 330 L 750 600" stroke="#ffb800" strokeWidth="5" opacity=".35" strokeDasharray="12 12" />
    <path d="M450 180 A 150 150 0 0 0 360 210" fill="none" stroke="var(--a3-ink)" strokeWidth="4" /><Label x={385} y={170} size={34}>α</Label>
    <path d="M450 480 A 150 150 0 0 0 510 470" fill="none" stroke="var(--a3-ink)" strokeWidth="4" /><Label x={490} y={530} size={34} c="#fff">γ</Label>
    <Label x={180} y={300} size={30}>ауа</Label><Label x={180} y={420} size={30} c="#fff">су</Label>
    <Label x={680} y={140} size={34} bg>n = sin α / sin γ</Label>
  </g>
);
const MirrorFlat = () => (
  <g><BG />
    <rect x="120" y="520" width="660" height="30" fill="#9fc6e8" stroke="#6b8bb0" strokeWidth="4" />
    {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${130 + i * 48} 552 l-24 30`} stroke="#6b8bb0" strokeWidth="4" />)}
    <path d="M450 520 V 120" stroke="var(--a3-line)" strokeWidth="4" strokeDasharray="14 12" />
    <Ray d="M180 160 L 450 520" w={10} /><Ray d="M450 520 L 720 160" w={10} />
    <path d="M450 380 A 140 140 0 0 0 366 408" fill="none" stroke="var(--a3-ink)" strokeWidth="4" /><Label x={395} y={360} size={34}>α</Label>
    <path d="M450 380 A 140 140 0 0 1 534 408" fill="none" stroke="var(--a3-ink)" strokeWidth="4" /><Label x={505} y={360} size={34}>β</Label>
    <Label x={450} y={650} size={38} bg>α = β</Label>
  </g>
);
const LensConv = () => (
  <g><BG />
    <path d="M60 350 H 840" stroke="var(--a3-line)" strokeWidth="4" />
    <path d="M450 90 Q 520 350 450 610 Q 380 350 450 90Z" fill="#bfe3ff" stroke="#6b8bb0" strokeWidth="5" opacity=".9" />
    {[180, 260, 440, 520].map((y, i) => <Ray key={i} d={`M60 ${y} L 450 ${y} L 650 350 L 840 ${350 + (350 - y) * 0.95}`} />)}
    <circle cx="650" cy="350" r="12" fill="var(--a3-hot)" /><Label x={650} y={410} size={34}>F</Label><circle cx="250" cy="350" r="12" fill="var(--a3-hot)" /><Label x={250} y={410} size={34}>F</Label>
    <Label x={450} y={660} size={36} bg>D = 1/F</Label>
  </g>
);
const Eye = () => (
  <g><BG />
    <circle cx="520" cy="350" r="230" fill="#fff" stroke="var(--a3-line)" strokeWidth="6" />
    <path d="M520 120 A 230 230 0 0 1 520 580" fill="none" stroke="#e5483a" strokeWidth="14" opacity=".6" />
    <path d="M300 250 Q 270 350 300 450" fill="none" stroke="#7fb8ff" strokeWidth="10" />
    <ellipse cx="340" cy="350" rx="26" ry="80" fill="#bfe3ff" stroke="#6b8bb0" strokeWidth="5" />
    <rect x="318" y="230" width="20" height="60" fill="#5b3a29" /><rect x="318" y="410" width="20" height="60" fill="#5b3a29" />
    <Ray d="M60 290 L 340 300 L 745 360" /><Ray d="M60 410 L 340 400 L 745 340" />
    <circle cx="748" cy="350" r="14" fill="var(--a3-hot)" />
    <Label x={340} y={520} size={28} bg>көз бұршағы</Label><Label x={700} y={630} size={28} bg>торлы қабық</Label>
  </g>
);

const EarthMagnet = () => (
  <g><rect width="900" height="700" fill="url(#a3-night)" />
    {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={(i * 137) % 900} cy={(i * 89) % 700} r="2" fill="#fff" opacity=".6" />)}
    {[150, 220, 290].map((r, i) => <g key={i}><path d={`M450 ${350 - 150} C ${450 - r * 1.6} ${350 - r * 1.2}, ${450 - r * 1.6} ${350 + r * 1.2}, 450 ${350 + 150}`} fill="none" stroke="#7fb8ff" strokeWidth="5" strokeDasharray="18 14" className="a3-flow" /><path d={`M450 ${350 - 150} C ${450 + r * 1.6} ${350 - r * 1.2}, ${450 + r * 1.6} ${350 + r * 1.2}, 450 ${350 + 150}`} fill="none" stroke="#7fb8ff" strokeWidth="5" strokeDasharray="18 14" className="a3-flow" /></g>)}
    <circle cx="450" cy="350" r="150" fill="#2f7fd4" /><path d="M360 280 q60 30 90 -10 q40 40 90 10 q-10 80 -80 90 q-70 10 -100 -40z" fill="#5cb85c" />
    <Label x={450} y={170} size={30} c="#fff">S</Label><Label x={450} y={560} size={30} c="#fff">N</Label>
    <g transform="translate(760 560)"><circle r="70" fill="#fff" stroke="#8a93a3" strokeWidth="6" /><path d="M0 -55 L14 0 L-14 0Z" fill="#e5483a" /><path d="M0 55 L14 0 L-14 0Z" fill="#1f8bff" /></g>
    <Label x={760} y={665} size={26} c="#fff">компас</Label>
  </g>
);
const TwoMagnets = () => (
  <g><BG />
    <g className="a3-attract"><Magnet x={250} y={220} w={300} h={80} /></g><g><Magnet x={650} y={220} w={300} h={80} /></g>
    <Flow d="M420 220 H 470" c="#17a05d" w={10} /><Label x={450} y={150} size={30} c="#17a05d">тартылады</Label>
    <Magnet x={250} y={480} w={300} h={80} />
    <g transform="translate(1300 0) scale(-1 1)"><Magnet x={650} y={480} w={300} h={80} /></g>
    <Flow d="M440 480 H 380" c="#e5483a" w={10} /><Flow d="M460 480 H 520" c="#e5483a" w={10} /><Label x={450} y={410} size={30} c="#e5483a">тебіледі</Label>
    <Label x={450} y={640} size={30} bg>әр аттас полюстер тартылады</Label>
  </g>
);

export const SCENES8: Record<string, () => ReactNode> = {
  diffusion: () => <Diffusion />, brownian: () => <Brownian />, thermometer: () => <Thermometer />, friction_heat: () => <Friction />, kettle: () => <Kettle />,
  fuel: () => <Fuel />, mix: () => <Mix />, melting: () => <Melting />, evaporation: () => <Evaporation />, boiling: () => <Boiling />, piston: () => <Piston />,
  engine: () => <Engine />, efficiency: () => <Efficiency />, ecology: () => <Ecology />, organism: () => <Organism />,
  balloon: () => <Balloon />, lightning: () => <Lightning />, capacitor: () => <Capacitor />, battery: () => <Battery />, bulb: () => <BulbScene />,
  ohm_graph: () => <OhmGraph />, resistance: () => <Resistance />, series_parallel: () => <SeriesParallel />, fuse: () => <Fuse />, electrolysis: () => <Electrolysis />,
  magnet: () => <MagnetField />, earth_magnet: () => <EarthMagnet />, two_magnets: () => <TwoMagnets />, wire_field: () => <WireField />, crane: () => <Crane />, motor: () => <Motor />,
  refraction: () => <Refraction />, mirror_flat: () => <MirrorFlat />, lens_conv: () => <LensConv />, eye: () => <Eye />,
  shadow: () => <Shadow />, sph_mirror: () => <SphMirror />, fiber: () => <Fiber />, telescope: () => <Telescope />,
};
