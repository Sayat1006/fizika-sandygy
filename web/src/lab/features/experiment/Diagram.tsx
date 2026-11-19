import type { SceneKind } from '../../data/types';

const Arrow = ({ x1, y1, x2, y2, c, label, lx, ly }: { x1: number; y1: number; x2: number; y2: number; c: string; label: string; lx?: number; ly?: number }) => (
  <g stroke={c} fill={c}>
    <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2.5} markerEnd={`url(#ah-${c.replace(/\W/g, '')})`} />
    <text x={lx ?? x2 + 8} y={ly ?? y2 + 4} stroke="none" fontSize={14} fontStyle="italic">{label}</text>
  </g>
);

const COLORS = ['#DC5353', '#20A477', '#4263EB', '#E8703A', '#2F9BD6', '#7957D5'];

/** Қондырғының сұлбасы және денеге әрекет ететін күштер (иллюстрациялық сызба). */
export default function Diagram({ kind }: { kind: SceneKind }) {
  return (
    <figure className="diagram">
      <svg viewBox="0 0 360 220" role="img" aria-label="Тәжірибе қондырғысының сұлбасы">
        <defs>
          {COLORS.map((c) => (
            <marker key={c} id={`ah-${c.replace(/\W/g, '')}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0L10,5L0,10z" fill={c} />
            </marker>
          ))}
        </defs>
        <g stroke="var(--text)" fill="none" strokeWidth={1.5}>
          {kind === 'spring' && (
            <>
              <line x1={110} y1={20} x2={250} y2={20} strokeWidth={4} />
              <polyline points="180,20 180,34 168,40 192,50 168,60 192,70 168,80 192,90 180,96 180,110" />
              <rect x={162} y={110} width={36} height={34} rx={4} fill="var(--surface-2)" />
              <line x1={225} y1={96} x2={225} y2={128} strokeDasharray="3 3" />
              <text x={232} y={116} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">x</text>
            </>
          )}
          {kind === 'surface' && (
            <>
              <line x1={30} y1={150} x2={330} y2={150} strokeWidth={3} />
              <rect x={110} y={110} width={70} height={40} rx={3} fill="var(--surface-2)" />
              <rect x={215} y={122} width={70} height={16} rx={4} />
              <line x1={180} y1={130} x2={215} y2={130} />
            </>
          )}
          {kind === 'archimedes' && (
            <>
              <path d="M120,70 V195 H240 V70" strokeWidth={2} />
              <rect x={121} y={105} width={118} height={89} fill="#6fb6f2" opacity={0.35} stroke="none" />
              <line x1={180} y1={10} x2={180} y2={120} />
              <rect x={170} y={18} width={20} height={44} rx={4} fill="var(--surface)" />
              <rect x={160} y={120} width={40} height={50} rx={3} fill="var(--surface-2)" />
            </>
          )}
          {kind === 'track' && (
            <>
              <line x1={30} y1={80} x2={330} y2={160} strokeWidth={3} />
              <g transform="translate(120 104) rotate(15)">
                <rect x={-30} y={-26} width={60} height={20} rx={3} fill="var(--surface-2)" />
                <circle cx={-18} cy={-3} r={5} />
                <circle cx={18} cy={-3} r={5} />
              </g>
              <path d="M290,160 A40,40 0 0 0 291,149" />
              <text x={262} y={158} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">α</text>
            </>
          )}
          {kind === 'pendulum' && (
            <>
              <line x1={120} y1={20} x2={240} y2={20} strokeWidth={4} />
              <line x1={180} y1={20} x2={180} y2={170} strokeDasharray="4 4" />
              <line x1={180} y1={20} x2={222} y2={162} />
              <circle cx={224} cy={168} r={9} fill="var(--surface-2)" />
              <path d="M180,60 A40,40 0 0 0 192,58" />
              <text x={190} y={80} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">α</text>
              <text x={160} y={110} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">L</text>
            </>
          )}
          {kind === 'lever' && (
            <>
              <line x1={60} y1={90} x2={300} y2={90} strokeWidth={5} />
              <path d="M170,200 L180,92 L190,200" />
              <line x1={120} y1={90} x2={120} y2={130} />
              <rect x={108} y={130} width={24} height={30} rx={3} fill="var(--surface-2)" />
              <line x1={270} y1={90} x2={270} y2={120} />
              <rect x={258} y={120} width={24} height={20} rx={3} fill="var(--surface-2)" />
              <line x1={120} y1={74} x2={180} y2={74} strokeDasharray="3 3" />
              <line x1={180} y1={74} x2={270} y2={74} strokeDasharray="3 3" />
              <text x={142} y={68} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">l₁</text>
              <text x={220} y={68} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">l₂</text>
            </>
          )}
          {kind === 'circuit' && (
            <>
              <path d="M60,60 H300 V170 H60 Z" />
              <line x1={52} y1={104} x2={68} y2={104} strokeWidth={3} />
              <line x1={56} y1={116} x2={64} y2={116} strokeWidth={3} />
              <rect x={150} y={50} width={60} height={20} fill="var(--surface)" />
              <circle cx={300} cy={115} r={16} fill="var(--surface)" />
              <text x={294} y={120} fontSize={15} stroke="none" fill="var(--text)">A</text>
              <path d="M150,60 V20 H210 V60" strokeDasharray="0" />
              <circle cx={180} cy={20} r={14} fill="var(--surface)" />
              <text x={175} y={25} fontSize={15} stroke="none" fill="var(--text)">V</text>
              <rect x={150} y={160} width={60} height={20} fill="var(--surface)" />
              <line x1={200} y1={190} x2={160} y2={150} />
              <text x={168} y={210} fontSize={13} stroke="none" fill="var(--text)">реостат</text>
              <text x={168} y={88} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">R</text>
            </>
          )}
          {kind === 'lens' && (
            <>
              <line x1={20} y1={120} x2={340} y2={120} strokeDasharray="5 4" />
              <path d="M180,50 Q195,120 180,190 Q165,120 180,50 Z" fill="#cfe9f7" />
              <line x1={80} y1={120} x2={80} y2={86} strokeWidth={3} />
              <line x1={290} y1={120} x2={290} y2={150} strokeWidth={3} />
              <line x1={80} y1={86} x2={290} y2={150} stroke="#DC5353" />
              <path d="M80,86 H180 L290,150" stroke="#E8703A" />
              <circle cx={130} cy={120} r={3} fill="var(--text)" />
              <circle cx={230} cy={120} r={3} fill="var(--text)" />
              <text x={124} y={140} fontSize={13} fontStyle="italic" stroke="none" fill="var(--text)">F</text>
              <text x={224} y={140} fontSize={13} fontStyle="italic" stroke="none" fill="var(--text)">F</text>
              <text x={124} y={208} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">d</text>
              <text x={230} y={208} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">f</text>
              <line x1={80} y1={196} x2={180} y2={196} />
              <line x1={180} y1={196} x2={290} y2={196} />
            </>
          )}
          {kind === 'refraction' && (
            <>
              <line x1={60} y1={110} x2={300} y2={110} strokeWidth={2} />
              <rect x={60} y={110} width={240} height={95} fill="#cfe9f7" opacity={0.5} stroke="none" />
              <line x1={180} y1={20} x2={180} y2={205} strokeDasharray="4 4" />
              <line x1={110} y1={30} x2={180} y2={110} stroke="#DC5353" strokeWidth={2.5} />
              <line x1={180} y1={110} x2={214} y2={200} stroke="#DC5353" strokeWidth={2.5} />
              <path d="M180,70 A40,40 0 0 0 155,80" />
              <path d="M180,150 A40,40 0 0 0 195,147" />
              <text x={160} y={64} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">α</text>
              <text x={192} y={168} fontSize={14} fontStyle="italic" stroke="none" fill="var(--text)">β</text>
              <text x={70} y={100} fontSize={13} stroke="none" fill="var(--text)">ауа</text>
              <text x={70} y={130} fontSize={13} stroke="none" fill="var(--text)">шыны</text>
            </>
          )}
        </g>
        {kind === 'spring' && (
          <>
            <Arrow x1={180} y1={127} x2={180} y2={62} c="#20A477" label="F серп" lx={110} ly={70} />
            <Arrow x1={180} y1={127} x2={180} y2={200} c="#DC5353" label="mg" />
          </>
        )}
        {kind === 'surface' && (
          <>
            <Arrow x1={285} y1={130} x2={335} y2={130} c="#4263EB" label="F" lx={318} ly={118} />
            <Arrow x1={110} y1={145} x2={56} y2={145} c="#E8703A" label="F үйк" lx={44} ly={132} />
            <Arrow x1={145} y1={130} x2={145} y2={62} c="#20A477" label="N" />
            <Arrow x1={145} y1={130} x2={145} y2={205} c="#DC5353" label="mg" />
          </>
        )}
        {kind === 'archimedes' && (
          <>
            <Arrow x1={172} y1={145} x2={172} y2={88} c="#2F9BD6" label="F_A" lx={128} ly={96} />
            <Arrow x1={188} y1={145} x2={188} y2={96} c="#20A477" label="T" lx={196} ly={104} />
            <Arrow x1={180} y1={145} x2={180} y2={212} c="#DC5353" label="mg" />
          </>
        )}
        {kind === 'track' && (
          <>
            <Arrow x1={120} y1={88} x2={186} y2={106} c="#7957D5" label="a" lx={190} ly={98} />
            <Arrow x1={120} y1={88} x2={120} y2={150} c="#DC5353" label="mg" />
            <Arrow x1={120} y1={88} x2={134} y2={36} c="#20A477" label="N" />
          </>
        )}
      </svg>
      <figcaption>Иллюстрациялық сұлба (масштабсыз). Нақты мәндер 3D зертханада есептеледі.</figcaption>
    </figure>
  );
}
