/* Жаңа презентациялардың суреттері: тақырыпқа сай анимациялы SVG сахналар (900×700).
   Әр сахна — бір құбылыс; қозғалыс CSS арқылы (stroke-dashoffset, translate), «азырақ қозғалыс» баптауында тоқтайды.
   Түстер: --a3-* айнымалылары (deck3.css), сондықтан үш стильде де жұмыс істейді. */
import type { ReactNode } from 'react';
import { Defs, Flow, Label, Sun } from './parts';
import { SCENES8 } from './Art8';
import { SCENES_M } from './ArtM';


export type ArtId = string;
export type ArtBase =
  | 'house' | 'breeze_day' | 'breeze_night' | 'conduction' | 'convection_room' | 'radiation_sun'
  | 'solar_collector' | 'house_loss' | 'thermos' | 'window_double' | 'trio_cond' | 'trio_conv' | 'trio_rad';

function BreezeScene({ night }: { night?: boolean }) {
  // күндіз құрлық тез қызады → жылы ауа көтеріледі, теңізден салқын ауа ағады; түнде керісінше
  const land = night ? '#6d7f5c' : '#e9a245';
  return (
    <g>
      <rect width="900" height="700" fill={night ? 'url(#a3-night)' : 'url(#a3-sky)'} />
      {night ? <g><circle cx="740" cy="110" r="44" fill="#f4f1d0" /><circle cx="760" cy="96" r="40" fill="#0f1a3c" /></g> : <Sun x={720} y={110} />}
      <path d="M0 470 Q120 455 230 470 T450 470 L450 700 L0 700Z" fill="url(#a3-sea)" />
      <path d="M450 470 L520 440 L900 430 L900 700 L450 700Z" fill={land} />
      <g className="a3-bob"><path d="M150 455 l40 -50 l40 50z" fill="#fff" /><rect x="185" y="400" width="6" height="58" fill="#5b4a3a" /><path d="M120 458 h140 l-18 18 h-104z" fill="#7a4b2a" /></g>
      <rect x="640" y="340" width="120" height="92" fill="#f3efe6" /><path d="M625 345 l75 -60 l75 60z" fill="#c4533a" /><rect x="688" y="384" width="26" height="48" fill="#7a4b2a" />
      <Label x={225} y={545} c="#fff" size={34}>{night ? 'Теңіз жылырақ' : 'Теңіз салқын'}</Label>
      <Label x={660} y={540} c="#fff" size={34}>{night ? 'Құрлық салқын' : 'Құрлық ыстық'}</Label>
      {night ? (
        <g>
          <Flow d="M690 410 C 560 405, 420 420, 300 430" c="var(--a3-cold)" dur={2.2} />
          <Flow d="M240 420 C 230 330, 240 260, 250 210" c="var(--a3-hot)" dur={2.6} />
          <Flow d="M290 190 C 420 175, 560 180, 680 200" c="var(--a3-hot)" w={7} dur={3} />
        </g>
      ) : (
        <g>
          <Flow d="M240 425 C 380 420, 520 415, 620 410" c="var(--a3-cold)" dur={2.2} />
          <Flow d="M700 400 C 710 320, 700 250, 690 200" c="var(--a3-hot)" dur={2.6} />
          <Flow d="M650 185 C 520 175, 380 180, 260 200" c="var(--a3-hot)" w={7} dur={3} />
        </g>
      )}
      <Label x={450} y={night ? 395 : 470 - 70} size={30} c="#fff">{night ? 'түнгі бриз' : 'күндізгі бриз'}</Label>
    </g>
  );
}

function Conduction() {
  // қасықтың ұшы бірте-бірте қызады: түстің градиенті жылжиды
  return (
    <g>
      <rect width="900" height="700" fill="var(--a3-bg2)" />
      <g transform="rotate(-28 450 380)">
        <rect x="260" y="350" width="560" height="34" rx="17" fill="#b8c0cc" />
        <rect x="260" y="350" width="560" height="34" rx="17" fill="url(#a3-heat)" className="a3-heatfill" />
        <ellipse cx="250" cy="367" rx="70" ry="44" fill="#b8c0cc" /><ellipse cx="250" cy="367" rx="70" ry="44" fill="#ff5a35" opacity=".85" />
      </g>
      <path d="M140 400 h300 l-30 220 h-240z" fill="#e8eef6" stroke="var(--a3-ink)" strokeWidth="6" strokeLinejoin="round" />
      <path d="M150 440 h280 l-24 172 h-232z" fill="#c8662b" opacity=".85" />
      {[0, 1, 2].map((i) => <path key={i} d={`M${220 + i * 50} 380 q-20 -40 0 -80 q20 -40 0 -80`} fill="none" stroke="#cfd6e0" strokeWidth="8" strokeLinecap="round" className="a3-steam" style={{ animationDelay: `${i * 0.5}s` }} />)}
      <g className="a3-dots">{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={330 + i * 52} cy={330 - i * 27} r="9" fill="#ff7a2e" style={{ animationDelay: `${i * 0.18}s` }} />)}</g>
      <Label x={650} y={170} size={34} bg>Ыстық → салқын</Label>
    </g>
  );
}

function ConvectionRoom() {
  return (
    <g>
      <rect width="900" height="700" fill="var(--a3-bg2)" />
      <rect x="70" y="60" width="760" height="560" rx="20" fill="var(--a3-card)" stroke="var(--a3-line)" strokeWidth="6" />
      <rect x="620" y="140" width="150" height="210" rx="8" fill="#cfe6ff" stroke="var(--a3-line)" strokeWidth="6" /><path d="M695 140 v210 M620 245 h150" stroke="var(--a3-line)" strokeWidth="5" />
      <g transform="translate(110 470)">{Array.from({ length: 7 }, (_, i) => <rect key={i} x={i * 30} y="0" width="22" height="120" rx="8" fill="#f1f3f6" stroke="#9aa4b2" strokeWidth="4" />)}<rect x="-6" y="118" width="220" height="10" rx="5" fill="#9aa4b2" /></g>
      <Flow d="M210 450 C 200 300, 230 180, 380 140" c="var(--a3-hot)" w={12} dur={2.4} />
      <Flow d="M420 130 C 600 120, 700 170, 700 300" c="var(--a3-hot)" w={10} dur={2.8} />
      <Flow d="M690 420 C 640 560, 420 590, 330 570" c="var(--a3-cold)" w={12} dur={2.6} />
      <Label x={330} y={240} size={30} c="var(--a3-hot)">жылы ауа ↑</Label>
      <Label x={520} y={540} size={30} c="var(--a3-cold)">салқын ауа ↓</Label>
      <Label x={220} y={445} size={26}>радиатор</Label>
    </g>
  );
}

function RadiationSun() {
  return (
    <g>
      <rect width="900" height="700" fill="url(#a3-night)" />
      {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 137) % 900} cy={(i * 89) % 700} r={i % 3 ? 2 : 3} fill="#fff" opacity=".6" />)}
      <Sun x={150} y={350} r={110} />
      {[-1, 0, 1].map((k) => <path key={k} d={`M290 ${350 + k * 70} q 40 -26 80 0 t 80 0 t 80 0 t 80 0 t 80 0`} fill="none" stroke="#ffd23f" strokeWidth="8" strokeLinecap="round" strokeDasharray="30 20" className="a3-flow" />)}
      <circle cx="760" cy="350" r="95" fill="#2f7fd4" /><path d="M700 300 q40 20 60 -10 q30 30 70 10 q-10 60 -60 70 q-50 10 -80 -20z" fill="#5cb85c" />
      <Label x={540} y={520} size={30} c="#fff">вакуумда да таралады</Label>
    </g>
  );
}

function SolarCollector() {
  return (
    <g>
      <rect width="900" height="700" fill="url(#a3-sky)" />
      <Sun x={150} y={130} r={70} />
      {[0, 1, 2].map((k) => <path key={k} d={`M${230 + k * 60} ${170 + k * 30} L ${430 + k * 70} ${330 + k * 30}`} stroke="#ffcc1f" strokeWidth="8" strokeDasharray="22 16" className="a3-flow" />)}
      <path d="M320 560 L760 560 L840 330 L420 330Z" fill="#1d2433" stroke="#8a93a3" strokeWidth="8" />
      {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${440 + i * 62} 345 L ${370 + i * 66} 548`} stroke="#3b4458" strokeWidth="10" />)}
      <path d="M760 560 v70 h-420 v-70" fill="none" stroke="var(--a3-hot)" strokeWidth="14" strokeDasharray="26 18" className="a3-flow" />
      <Label x={600} y={300} size={30}>қара бет — сәулені жұтады</Label>
      <Label x={550} y={665} size={28} c="var(--a3-hot)">ыстық су → үйге</Label>
    </g>
  );
}

function HouseLoss() {
  // жылу шығыны (шамамен, жылу оқшауланбаған үй): шатыр, қабырға, терезе, еден
  const parts = [['Шатыр', '25%', 450, 150], ['Қабырға', '35%', 600, 520], ['Терезе', '25%', 305, 490], ['Еден', '15%', 450, 600]] as const;
  return (
    <g>
      <rect width="900" height="700" fill="#141a2e" />
      <path d="M170 300 L450 110 L730 300Z" fill="#ff5a2e" className="a3-glow" />
      <rect x="200" y="300" width="500" height="270" fill="#ff8a2e" />
      <rect x="250" y="350" width="110" height="100" fill="#ffd23f" className="a3-glow" /><rect x="540" y="350" width="110" height="100" fill="#ffd23f" className="a3-glow" />
      <rect x="410" y="440" width="80" height="130" fill="#ff5a2e" />
      <rect x="180" y="570" width="540" height="22" fill="#ff7a2e" />
      {parts.map(([n, p, x, y]) => <Label key={n} x={x} y={y} size={30} bg>{`${n} ${p}`}</Label>)}
    </g>
  );
}

function Thermos() {
  return (
    <g>
      <rect width="900" height="700" fill="var(--a3-bg2)" />
      <rect x="330" y="90" width="240" height="520" rx="60" fill="#c9d1dc" stroke="var(--a3-ink)" strokeWidth="6" />
      <rect x="360" y="120" width="180" height="460" rx="44" fill="var(--a3-card)" />
      <rect x="380" y="140" width="140" height="420" rx="34" fill="#ffffff" stroke="#9aa4b2" strokeWidth="5" />
      <rect x="392" y="250" width="116" height="300" rx="26" fill="#c8662b" />
      <rect x="400" y="60" width="100" height="50" rx="12" fill="var(--a3-ink)" />
      <Label x={710} y={200} size={28} anchor="start" bg>вакуум</Label><path d="M600 190 h-40" stroke="var(--a3-ink)" strokeWidth="4" />
      <Label x={710} y={330} size={28} anchor="start" bg>айна бет</Label><path d="M600 320 h-80" stroke="var(--a3-ink)" strokeWidth="4" />
      <Label x={230} y={95} size={28} bg>тығын</Label><path d="M350 85 h50" stroke="var(--a3-ink)" strokeWidth="4" />
    </g>
  );
}

function WindowDouble() {
  return (
    <g>
      <rect width="900" height="700" fill="var(--a3-bg2)" />
      <rect x="0" y="0" width="330" height="700" fill="#ffe2c4" /><rect x="570" y="0" width="330" height="700" fill="#d7ecff" />
      <rect x="340" y="80" width="40" height="540" fill="#cfe6ff" stroke="var(--a3-line)" strokeWidth="5" />
      <rect x="520" y="80" width="40" height="540" fill="#cfe6ff" stroke="var(--a3-line)" strokeWidth="5" />
      <rect x="380" y="80" width="140" height="540" fill="#f4f8fc" />
      <Label x={450} y={360} size={34} c="#1d2433">ауа</Label><Label x={450} y={400} size={22} c="#44506e">нашар өткізгіш</Label>
      <Label x={160} y={120} size={34} c="#1d2433">+20 °C</Label><Label x={740} y={120} size={34} c="#1d2433">−25 °C</Label>
      <Flow d="M120 360 H 300" c="var(--a3-hot)" w={12} />
      <Flow d="M600 360 H 700" c="var(--a3-hot)" w={4} dur={4} />
    </g>
  );
}

function House() {
  return (
    <g>
      <rect width="900" height="700" fill="url(#a3-sky)" />
      <Sun x={740} y={120} r={70} />
      <path d="M140 640 Q450 600 900 640 V700 H0V640Z" fill="#7fb35a" />
      <path d="M210 330 L430 170 L650 330Z" fill="#c4533a" /><rect x="240" y="330" width="380" height="290" fill="#f3efe6" />
      <rect x="290" y="380" width="100" height="90" fill="#cfe6ff" stroke="#9aa4b2" strokeWidth="5" />
      <g transform="translate(455 520)">{Array.from({ length: 4 }, (_, i) => <rect key={i} x={i * 24} y="0" width="18" height="70" rx="6" fill="#fff" stroke="#9aa4b2" strokeWidth="3" />)}</g>
      <Flow d="M480 510 C 470 440, 500 400, 560 395" c="var(--a3-hot)" w={8} />
      <path d="M560 210 q-12 -30 0 -60 q12 -30 0 -60" stroke="#c7ccd4" strokeWidth="12" fill="none" strokeLinecap="round" className="a3-steam" />
      <rect x="540" y="200" width="44" height="80" fill="#8a5a3a" />
      {[0, 1].map((k) => <path key={k} d={`M${680 - k * 40} ${180 + k * 30} L ${560 - k * 40} ${300 + k * 30}`} stroke="#ffcc1f" strokeWidth="8" strokeDasharray="22 16" className="a3-flow" />)}
    </g>
  );
}

function Trio({ k }: { k: 'cond' | 'conv' | 'rad' }) {
  return (
    <g>
      <rect width="900" height="700" rx="40" fill="var(--a3-bg2)" />
      {k === 'cond' && <g><rect x="120" y="300" width="660" height="100" rx="50" fill="#c9d1dc" /><rect x="120" y="300" width="660" height="100" rx="50" fill="url(#a3-heat)" className="a3-heatfill" />{[0, 1, 2].map((j) => <path key={j} d={`M${110 + j * 50} 560 q-30 -50 0 -100 q30 -50 0 -90`} stroke="#ff5a2e" strokeWidth="18" fill="none" strokeLinecap="round" className="a3-steam" style={{ animationDelay: `${j * 0.4}s` }} />)}<g className="a3-dots">{Array.from({ length: 8 }, (_, i) => <circle key={i} cx={170 + i * 80} cy="350" r="16" fill="#fff" opacity=".85" style={{ animationDelay: `${i * 0.15}s` }} />)}</g></g>}
      {k === 'conv' && <g><rect x="200" y="560" width="500" height="50" rx="12" fill="#ff5a2e" className="a3-glow" /><Flow d="M450 540 C 430 400, 440 250, 450 150" c="var(--a3-hot)" w={22} /><Flow d="M400 140 C 220 160, 170 300, 250 520" c="var(--a3-cold)" w={18} /><Flow d="M500 140 C 680 160, 730 300, 650 520" c="var(--a3-cold)" w={18} /></g>}
      {k === 'rad' && <g><Sun x={230} y={350} r={130} />{[-1, 0, 1].map((j) => <path key={j} d={`M400 ${350 + j * 110} q 40 -40 80 0 t 80 0 t 80 0 t 80 0`} fill="none" stroke="#ffb800" strokeWidth="18" strokeLinecap="round" strokeDasharray="34 22" className="a3-flow" />)}</g>}
    </g>
  );
}

export const SCENES: Record<string, () => ReactNode> = {
  ...SCENES8,
  ...SCENES_M,
  house: () => <House />, breeze_day: () => <BreezeScene />, breeze_night: () => <BreezeScene night />, conduction: () => <Conduction />,
  convection_room: () => <ConvectionRoom />, radiation_sun: () => <RadiationSun />, solar_collector: () => <SolarCollector />, house_loss: () => <HouseLoss />,
  thermos: () => <Thermos />, window_double: () => <WindowDouble />, trio_cond: () => <Trio k="cond" />, trio_conv: () => <Trio k="conv" />, trio_rad: () => <Trio k="rad" />,
};

export default function Art({ id, className = '', meet }: { id: ArtId; className?: string; meet?: boolean }) {
  const S = SCENES[id];
  if (!S) return null;
  return (
    <svg className={`a3 ${className}`} viewBox="0 0 900 700" preserveAspectRatio={meet ? 'xMidYMid meet' : 'xMidYMid slice'} aria-hidden>
      <Defs />
      {S()}
    </svg>
  );
}
