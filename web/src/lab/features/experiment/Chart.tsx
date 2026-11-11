import { fmt, type Fit } from '../../engines/physics/uncertainty';

interface Pt {
  x: number;
  y: number;
}

function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (!(hi > lo)) hi = lo + 1;
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(lo / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= hi + step * 0.999; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

const tickText = (v: number, step: number) => fmt(v, Math.max(0, -Math.floor(Math.log10(step) + 1e-9)));

/**
 * Жеңіл SVG график: нүктелер, қосатын сызық немесе ең кіші квадраттар түзуі.
 * Деректер тек оқушының нақты өлшеулерінен/симуляция күйінен алынады.
 */
export default function Chart({
  points,
  fit,
  xLabel,
  yLabel,
  title,
  mode = 'scatter',
  height = 300,
  color = 'var(--accent)',
  fromZero = true,
}: {
  points: Pt[];
  fit?: Fit | null;
  xLabel: string;
  yLabel: string;
  title?: string;
  mode?: 'scatter' | 'line' | 'scatter-line';
  height?: number;
  color?: string;
  fromZero?: boolean;
}) {
  const W = 560;
  const H = height;
  const m = { l: 56, r: 16, t: title ? 30 : 12, b: 42 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = fromZero ? Math.min(0, ...xs) : Math.min(...xs);
  const yMin = fromZero ? Math.min(0, ...ys) : Math.min(...ys);
  const xMax = points.length ? Math.max(...xs) * 1.08 : 1;
  const yMax = points.length ? Math.max(...ys) * 1.12 : 1;
  const xt = niceTicks(Number.isFinite(xMin) ? xMin : 0, xMax > xMin ? xMax : xMin + 1);
  const yt = niceTicks(Number.isFinite(yMin) ? yMin : 0, yMax > yMin ? yMax : yMin + 1);
  const x0 = xt[0];
  const x1 = xt[xt.length - 1];
  const y0 = yt[0];
  const y1 = yt[yt.length - 1];
  const sx = (x: number) => m.l + ((x - x0) / (x1 - x0)) * (W - m.l - m.r);
  const sy = (y: number) => H - m.b - ((y - y0) / (y1 - y0)) * (H - m.t - m.b);
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const path = sorted.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('');
  const clampY = (y: number) => Math.min(y1, Math.max(y0, y));
  const fitLine = fit && {
    a: { x: x0, y: fit.slope * x0 + fit.intercept },
    b: { x: x1, y: fit.slope * x1 + fit.intercept },
  };
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title ?? `${yLabel} — ${xLabel} графигі`}>
      {title && (
        <text x={m.l} y={18} className="chart-title">
          {title}
        </text>
      )}
      {xt.map((v) => (
        <g key={`x${v}`}>
          <line x1={sx(v)} x2={sx(v)} y1={m.t} y2={H - m.b} className="chart-grid" />
          <text x={sx(v)} y={H - m.b + 16} textAnchor="middle" className="chart-tick">
            {tickText(v, xt[1] - xt[0])}
          </text>
        </g>
      ))}
      {yt.map((v) => (
        <g key={`y${v}`}>
          <line x1={m.l} x2={W - m.r} y1={sy(v)} y2={sy(v)} className="chart-grid" />
          <text x={m.l - 8} y={sy(v) + 4} textAnchor="end" className="chart-tick">
            {tickText(v, yt[1] - yt[0])}
          </text>
        </g>
      ))}
      <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} className="chart-axis" />
      <line x1={m.l} x2={m.l} y1={m.t} y2={H - m.b} className="chart-axis" />
      <text x={(m.l + W - m.r) / 2} y={H - 6} textAnchor="middle" className="chart-label">
        {xLabel}
      </text>
      <text transform={`translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)`} textAnchor="middle" className="chart-label">
        {yLabel}
      </text>
      {fitLine && (
        <line
          x1={sx(fitLine.a.x)}
          y1={sy(clampY(fitLine.a.y))}
          x2={sx(fit.slope > 0 ? Math.min(x1, (y1 - fit.intercept) / fit.slope) : x1)}
          y2={sy(clampY(fitLine.b.y))}
          stroke="var(--violet)"
          strokeWidth={2}
          strokeDasharray="6 5"
        />
      )}
      {mode !== 'scatter' && points.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />}
      {mode !== 'line' &&
        points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4.5} fill={color} stroke="var(--surface)" strokeWidth={1.5}>
            <title>{`${fmt(p.x, 3)}; ${fmt(p.y, 3)}`}</title>
          </circle>
        ))}
      {points.length === 0 && (
        <text x={(m.l + W - m.r) / 2} y={(m.t + H - m.b) / 2} textAnchor="middle" className="chart-empty">
          Өлшеу деректері әлі жоқ
        </text>
      )}
    </svg>
  );
}

/** SVG графикті файл ретінде жүктеу. */
export function downloadSvg(container: HTMLElement | null, name: string) {
  const svg = container?.querySelector('svg.chart');
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const css = getComputedStyle(document.documentElement);
  const vars = ['--accent', '--violet', '--surface', '--text', '--muted', '--line'];
  let xml = new XMLSerializer().serializeToString(clone);
  for (const v of vars) xml = xml.replaceAll(`var(${v})`, css.getPropertyValue(v).trim());
  const style = `<style>text{font-family:Inter,Arial,sans-serif;font-size:12px;fill:#17191F}.chart-grid{stroke:#e3e6ec}.chart-axis{stroke:#17191F}.chart-title{font-weight:600;font-size:13px}</style>`;
  xml = xml.replace(/(<svg[^>]*>)/, `$1${style}`);
  download(new Blob([xml], { type: 'image/svg+xml' }), name);
}

export function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
