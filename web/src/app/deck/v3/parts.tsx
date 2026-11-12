/* v3 суреттерінің ортақ бөліктері */
import type { ReactNode } from 'react';

export const Flow = ({ d, w = 10, c = 'var(--a3-hot)', dur = 2.4, head = true }: { d: string; w?: number; c?: string; dur?: number; head?: boolean }) => (
  <g>
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeDasharray="26 22" className="a3-flow" style={{ animationDuration: `${dur}s` }} markerEnd={head ? `url(#a3-head-${c.includes('cold') ? 'c' : 'h'})` : undefined} />
  </g>
);
export const Defs = () => (
  <defs>
    <marker id="a3-head-h" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--a3-hot)" /></marker>
    <marker id="a3-head-c" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--a3-cold)" /></marker>
    <linearGradient id="a3-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--a3-sky1)" /><stop offset="1" stopColor="var(--a3-sky2)" /></linearGradient>
    <linearGradient id="a3-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1430" /><stop offset="1" stopColor="#24325e" /></linearGradient>
    <linearGradient id="a3-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3aa0e8" /><stop offset="1" stopColor="#1d5fae" /></linearGradient>
    <linearGradient id="a3-heat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff4d2e" /><stop offset=".55" stopColor="#ffb02e" /><stop offset="1" stopColor="#ffe9b0" /></linearGradient>
    <radialGradient id="a3-sun" cx=".5" cy=".5" r=".5"><stop offset=".55" stopColor="#ffd23f" /><stop offset="1" stopColor="#ffd23f" stopOpacity="0" /></radialGradient>
  </defs>
);
export const Sun = ({ x, y, r = 60 }: { x: number; y: number; r?: number }) => (
  <g className="a3-pulse" style={{ transformOrigin: `${x}px ${y}px` }}>
    <circle cx={x} cy={y} r={r * 1.9} fill="url(#a3-sun)" opacity=".55" />
    <circle cx={x} cy={y} r={r} fill="#ffcc1f" />
  </g>
);
export const Label = ({ x, y, children, c = 'var(--a3-ink)', size = 30, anchor = 'middle', bg }: { x: number; y: number; children: ReactNode; c?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; bg?: boolean }) => (
  <g>
    {bg && (() => { const w = String(children).length * size * 0.56 + 44; return <rect x={anchor === 'middle' ? x - w / 2 : anchor === 'start' ? x - 22 : x - w + 22} y={y - size - 8} width={w} height={size + 26} rx="14" fill="var(--a3-card)" opacity=".94" />; })()}
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight="700" fill={c} fontFamily="var(--d-body)">{children}</text>
  </g>
);

