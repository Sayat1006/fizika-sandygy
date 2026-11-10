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
