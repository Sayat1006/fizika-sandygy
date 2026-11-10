import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { defaultParams } from '../../data/experiments';
import type { ExperimentDef, ParamDef } from '../../data/types';
import { fmt } from '../../engines/physics/uncertainty';
import { BuoyancySim } from '../../engines/simulation/buoyancy';
import { PullSim } from '../../engines/simulation/pull';
import { SpringSim } from '../../engines/simulation/spring';
import { TrackSim } from '../../engines/simulation/track';
import { FIXED_DT, type Sample, type Simulation } from '../../engines/simulation/types';
import { rowId, useApp, useLab, type Session } from '../../lib/store';
import { webglAvailable } from '../../lib/webgl';
import Chart from './Chart';
import DataTable from './DataTable';

const SceneHost = lazy(() => import('../../three/SceneHost'));

const createSim = (def: ExperimentDef): Simulation =>
  def.scene === 'spring' ? new SpringSim() : def.scene === 'surface' ? new PullSim() : def.scene === 'archimedes' ? new BuoyancySim() : new TrackSim();

/** Симуляцияны тұрақты қадаммен жүргізіп, құрал көрсетулерін 10 Гц жиілікпен жариялайды. */
function useSimulation(def: ExperimentDef) {
  const sim = useMemo(() => createSim(def), [def]);
  const [series, setSeries] = useState<Sample[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const p = defaultParams(def);
    sim.reset(p);
    useLab.setState({ params: p, readings: sim.readings(p), paused: false });
    setReady(true);
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__sim = sim;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastPub = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const st = useLab.getState();
      const dt = Math.min(0.1, (now - last) / 1000); // баяу құрылғыда да нақты уақытқа жақын
      last = now;
      if (!st.paused) {
        acc += dt;
        let patch: Record<string, number | undefined> | undefined;
        while (acc >= FIXED_DT) {
          const r = sim.step(FIXED_DT, st.params);
          if (r) patch = r;
          acc -= FIXED_DT;
        }
        if (patch) for (const [k, v] of Object.entries(patch)) if (v !== undefined && Math.abs(v - st.params[k]) > 5e-4) st.setParam(k, v);
      }
      if (now - lastPub > 100) {
        lastPub = now;
        useLab.setState({ readings: sim.readings(useLab.getState().params) });
        if (sim.series) setSeries((prev) => (prev.length === sim.series!.length ? prev : sim.series!.slice()));
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [def, sim]);
  return { sim, series, ready };
}

function ParamControl({ p, disabled }: { p: ParamDef; disabled?: boolean }) {
  const value = useLab((s) => s.params[p.key] ?? p.def);
  const set = useLab((s) => s.setParam);
  if (p.options) {
    return (
      <div className="param">
        <span className="param-label">{p.label}</span>
        <div className="seg" role="radiogroup" aria-label={p.label}>
          {p.options.map((o) => (
            <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} disabled={disabled} onClick={() => set(p.key, o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const id = `param-${p.key}`;
  return (
    <div className="param">
      <label htmlFor={id} className="param-label">
        {p.label}
        <output>
          {fmt(value * (p.scale ?? 1), p.digits ?? 2)} {p.unit ?? ''}
        </output>
      </label>
      <input id={id} type="range" min={p.min} max={p.max} step={p.step} value={value} disabled={disabled} onChange={(e) => set(p.key, Number(e.target.value))} />
    </div>
  );
}

export default function LabView({ def, session }: { def: ExperimentDef; session: Session }) {
  const { sim, series, ready } = useSimulation(def);
  const readings = useLab((s) => s.readings);
  const paused = useLab((s) => s.paused);
  const vectors = useLab((s) => s.vectors);
  const patch = useApp((s) => s.patchSession);
  const [use3d, setUse3d] = useState(() => webglAvailable());
  const [flash, setFlash] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const advanced = session.mode === 'advanced';
  const running = def.scene === 'track' && (sim as TrackSim).phase === 'running';

  const record = () => {
    const r = sim.readings(useLab.getState().params);
    if (!r.canRecord) return;
    patch(def.id, { rows: [...session.rows, { id: rowId(), values: r.values, errors: r.errors, ref: r.ref }] });
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  };
  const reset = () => {
    const cur = useLab.getState().params;
    const p = { ...cur };
    for (const d of def.params) if (d.manip && d.key !== 'n' && d.key !== 'angle' && d.key !== 'start') p[d.key] = d.def;
    sim.reset(p);
    useLab.setState({ params: p, paused: false });
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen?.();
  };

  const visible = def.params.filter((p) => p.max > p.min && (advanced || !p.advanced));

  return (
    <div className="lab" ref={root}>
      <div className="lab-view">
        {ready && use3d ? (
          <Suspense fallback={<div className="lab-loading">3D зертхана жүктелуде…</div>}>
            <SceneHost def={def} sim={sim} />
          </Suspense>
        ) : (
          <div className="lab-fallback">
            <strong>2D жеңілдетілген режим</strong>
            <p>3D көрініс өшірулі немесе құрылғыда қолжетімсіз. Физикалық модель дәл сол күйінде жұмыс істейді: оң жақтағы сырғытпалармен қондырғыны басқарып, құрал көрсетулерін жазыңыз.</p>
            <div className="fallback-readings">
              {readings?.display.map((d) => (
                <div key={d.label}>
                  <span>{d.label}</span>
                  <b>{d.text}</b>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="lab-toolbar">
          <span className="sim-badge" title="Қозғалыс физикалық теңдеулерді нақты уақытта шешу арқылы есептеледі">
            <i /> Нақты уақыттағы физикалық симуляция
          </span>
          <div className="spacer" />
          <button className={`chip ${vectors ? 'on' : ''}`} aria-pressed={vectors} onClick={() => useLab.setState({ vectors: !vectors })}>Векторлар</button>
          <button className={`chip ${use3d ? 'on' : ''}`} aria-pressed={use3d} onClick={() => setUse3d((v) => (v ? false : webglAvailable()))}>3D</button>
          <button className="chip" onClick={fullscreen}>Толық экран</button>
        </div>
        <div className="lab-hint" role="status">{readings?.hint}</div>
      </div>

      <aside className="lab-panel" aria-label="Параметрлер">
        <div className="seg mode" role="radiogroup" aria-label="Режим">
          <button role="radio" aria-checked={!advanced} className={!advanced ? 'on' : ''} onClick={() => patch(def.id, { mode: 'basic' })}>Негізгі</button>
          <button role="radio" aria-checked={advanced} className={advanced ? 'on' : ''} onClick={() => patch(def.id, { mode: 'advanced' })}>Кеңейтілген</button>
        </div>
        <h3>Параметрлер</h3>
        {visible.map((p) => (
          <ParamControl key={p.key} p={p} disabled={running} />
        ))}
        {!advanced && (
          <details className="guide" open>
            <summary>Қадамдық нұсқау</summary>
            <ol>
              {def.guide.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ol>
          </details>
        )}
        <div className="lab-actions">
          {def.actions?.map((a) => (
            <button key={a.id} className="btn primary" disabled={running} onClick={() => { useLab.setState({ paused: false }); sim.action?.(a.id, useLab.getState().params); }}>
              {a.label}
            </button>
          ))}
          <button className="btn" onClick={() => useLab.setState({ paused: !paused })}>{paused ? 'Жалғастыру' : 'Кідірту'}</button>
          <button className="btn" onClick={reset}>Қайта орнату</button>
        </div>
      </aside>

      <section className={`lab-console ${flash ? 'flash' : ''}`} aria-label="Өлшеу консолі">
        <div className="readings">
          {readings?.display.map((d) => (
            <div className="reading" key={d.label}>
              <span>{d.label}</span>
              <b>{d.text}</b>
              <small>{d.instrument}</small>
            </div>
          ))}
          <button className="btn primary record" disabled={!readings?.canRecord} onClick={record}>
            Өлшеуді жазу
            <small>{session.rows.length} / {def.minRows}</small>
          </button>
        </div>
        {def.scene === 'track' && (
          <div className="live-charts">
            <Chart points={series.map((s) => ({ x: s.t, y: s.x * 100 }))} mode="line" xLabel="t, с" yLabel="x, см" height={190} />
            <Chart points={series.map((s) => ({ x: s.t, y: s.v }))} mode="line" xLabel="t, с" yLabel="v, м/с" height={190} color="var(--violet)" />
            <Chart points={series.map((s) => ({ x: s.t, y: s.a }))} mode="line" xLabel="t, с" yLabel="a, м/с²" height={190} color="var(--success)" />
          </div>
        )}
        <DataTable def={def} session={session} compact />
      </section>
    </div>
  );
}
