import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getExperiment } from '../../data/experiments';
import { getLab } from '../../data/labs';
import type { ExperimentDef } from '../../data/types';
import { INSTRUMENTS, fmt, formatSig } from '../../engines/physics/uncertainty';
import { sub } from '../../lib/format';
import { newSession, useApp, type Session } from '../../lib/store';
import { CONCLUSION_PROMPTS, STEPS, analyze, score, type Analysis } from './analysis';
import Chart, { download, downloadSvg } from './Chart';
import DataTable, { toCsv } from './DataTable';
import Diagram from './Diagram';
import LabView from './LabView';
import Report from './Report';

const pct = (x: number) => `${fmt(x, 1)} %`;

function Intro({ def }: { def: ExperimentDef }) {
  return (
    <div className="prose">
      <p className="lead">{def.objective}</p>
      <dl className="facts">
        <div><dt>Сынып</dt><dd>{def.grade}</dd></div>
        <div><dt>Тақырып</dt><dd>{def.topic}</dd></div>
        <div><dt>Ұзақтығы</dt><dd>≈ {def.duration} мин</dd></div>
        <div><dt>Зертхана</dt><dd>{getLab(def.labId)?.title}</dd></div>
      </dl>
      <h3>Құрал-жабдықтар</h3>
      <ul className="tags">{def.equipment.map((e) => <li key={e}>{e}</li>)}</ul>
    </div>
  );
}

function Theory({ def }: { def: ExperimentDef }) {
  return (
    <div className="split">
      <div className="prose">
        {def.theory.paragraphs.map((p) => <p key={p}>{p}</p>)}
        <div className="formulas">
          {def.theory.formulas.map((f) => (
            <div key={f.expr} className="formula"><code>{sub(f.expr)}</code><span>{f.note}</span></div>
          ))}
        </div>
      </div>
      <Diagram kind={def.scene} />
    </div>
  );
}

function Hypothesis({ def, session, done }: { def: ExperimentDef; session: Session; done: boolean }) {
  const patch = useApp((s) => s.patchSession);
  return (
    <div className="prose">
      <p className="lead">{def.hypothesis.question}</p>
      <div className="options" role="radiogroup" aria-label="Болжам">
        {def.hypothesis.options.map((o, i) => (
          <button key={o} role="radio" aria-checked={session.hypothesis === i} className={session.hypothesis === i ? 'on' : ''} onClick={() => patch(def.id, { hypothesis: i })}>
            {o}
          </button>
        ))}
      </div>
      <p className="note">
        {done
          ? session.hypothesis === def.hypothesis.correct
            ? `Болжамыңыз теориямен сәйкес келеді. ${def.hypothesis.explain}`
            : `Теория бойынша: «${def.hypothesis.options[def.hypothesis.correct]}». ${def.hypothesis.explain}`
          : 'Дұрыс жауап тәжірибеден кейін ғана көрсетіледі — алдымен өз болжамыңызды жасаңыз.'}
      </p>
    </div>
  );
}

function Calculations({ def, a }: { def: ExperimentDef; a: Analysis }) {
  if (a.valid.length === 0) return <p className="empty">Есептеу үшін алдымен өлшеулер жазыңыз.</p>;
  const r = def.result;
  return (
    <div className="prose">
      <div className="calc-grid">
        {a.valid.map((c, i) => (
          <div className="calc" key={c.row.id}>
            <h4>{i + 1}-өлшеу</h4>
            {def.calcSteps(c.row.values, c.all).map((s) => <code key={s}>{sub(s)}</code>)}
          </div>
        ))}
      </div>
      {a.mean !== null && (
        <div className="result-box">
          <span>Орташа мән ({a.valid.length} өлшеу бойынша)</span>
          <b>{sub(r.symbol)}<sub> орт</sub> = {formatSig(a.mean * (r.scale ?? 1), 4)} {r.unit}</b>
        </div>
      )}
      {!a.refConstant && <p className="note">Өлшеулер әртүрлі шарттарда жасалды, сондықтан әр жол жеке қарастырылады — орташа мән есептелмейді.</p>}
    </div>
  );
}

function Graph({ def, a }: { def: ExperimentDef; a: Analysis }) {
  const ref = useRef<HTMLDivElement>(null);
  const g = def.graph;
  return (
    <div className="prose" ref={ref}>
      <div className="chart-card">
        <Chart points={a.points} fit={a.fit} xLabel={g.xLabel} yLabel={g.yLabel} title={g.title} mode={g.fit === 'none' ? 'scatter-line' : 'scatter'} height={340} />
      </div>
      {a.fit && a.points.length >= 2 && (
        <p className="note">
          Ең кіші квадраттар түзуі: көлбеулігі <b>{formatSig(a.fit.slope * (g.slopeScale ?? 1), 4)} {g.slopeUnit ?? ''}</b>, R² = {fmt(a.fit.r2, 3)}. {g.slopeNote}
        </p>
      )}
      <div className="row">
        <button className="btn" onClick={() => downloadSvg(ref.current, `${def.id}-grafik.svg`)} disabled={a.points.length === 0}>Графикті жүктеу (SVG)</button>
      </div>
    </div>
  );
}

function Errors({ def, a }: { def: ExperimentDef; a: Analysis }) {
  const r = def.result;
  const k = r.scale ?? 1;
  if (a.valid.length === 0) return <p className="empty">Қателікті бағалау үшін алдымен өлшеулер жазыңыз.</p>;
  return (
    <div className="prose">
      <h3>Құралдық қателіктер</h3>
      <p>Құралдық абсолют қателік бөлік құнының жартысына тең деп алынады: динамометр ±{fmt(INSTRUMENTS.dynamometer.division / 2, 2)} Н, сызғыш ±0,5 мм, секундомер ±0,005 с, өлшеуіш ыдыс ±2,5 мл.</p>
      <div className="formula"><code>{sub(def.errorFormula)}</code><span>салыстырмалы құралдық қателік</span></div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>№</th><th>{sub(r.symbol)}{r.unit && `, ${r.unit}`}</th><th>ε құр, %</th><th>Теориялық мән</th><th>Ауытқу, %</th></tr>
          </thead>
          <tbody>
            {a.valid.map((c, i) => (
              <tr key={c.row.id}>
                <td>{i + 1}</td>
                <td>{formatSig(c.value * k, 4)}</td>
                <td>{Number.isFinite(c.relErr) ? fmt(c.relErr * 100, 1) : '—'}</td>
                <td>{formatSig(c.row.ref * k, 4)}</td>
                <td>{Number.isFinite(c.deviation) ? fmt(c.deviation, 1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {a.mean !== null && a.rounded && (
        <>
          <h3>Қорытынды нәтиже</h3>
          <dl className="facts">
            <div><dt>Кездейсоқ қателік</dt><dd>{formatSig(a.random * k, 2)} {r.unit}</dd></div>
            <div><dt>Құралдық қателік</dt><dd>{formatSig(a.instrumental * k, 2)} {r.unit}</dd></div>
            <div><dt>Абсолют қателік Δ</dt><dd>{formatSig(a.abs * k, 2)} {r.unit}</dd></div>
            <div><dt>Салыстырмалы қателік ε</dt><dd>{pct(a.rel * 100)}</dd></div>
          </dl>
          <div className="result-box">
            <span>{r.name}</span>
            <b>{sub(r.symbol)} = ({a.rounded.text}) {r.unit}</b>
          </div>
          <p className="note">
            Дөңгелектеу ережесі: қателік бір мәнді цифрға дейін (бірінші цифры 1 болса — екі цифрға), ал нәтиже қателіктің соңғы разрядына дейін дөңгелектенеді. Δ = √(Δ<sub>кезд</sub>² + Δ<sub>құр</sub>²).
          </p>
        </>
      )}
      {a.deviation !== null && (
        <p>
          {r.refLabel}{a.ref !== null && <>: <b>{formatSig(a.ref * k, 4)} {r.unit}</b></>}. Тәжірибелік мәннің теориялық мәннен орташа ауытқуы — <b>{pct(a.deviation)}</b>.
        </p>
      )}
      <h3>Қателік көздері</h3>
      <ul>{def.errorSources.map((s) => <li key={s}>{s}</li>)}</ul>
    </div>
  );
}

function Conclusion({ def, session }: { def: ExperimentDef; session: Session }) {
  const patch = useApp((s) => s.patchSession);
  return (
    <div className="prose">
      <p>Қорытындыны өз сөзіңізбен жазыңыз. Әр сұраққа толық сөйлеммен жауап беріңіз.</p>
      {CONCLUSION_PROMPTS.map((q, i) => (
        <label className="field" key={q}>
          <span>{i + 1}. {q}</span>
          <textarea
            rows={2}
            value={session.conclusion[i] ?? ''}
            onChange={(e) => {
              const c = [...session.conclusion];
              c[i] = e.target.value;
              patch(def.id, { conclusion: c });
            }}
          />
        </label>
      ))}
    </div>
  );
}

export default function ExperimentPage() {
  const { id = '' } = useParams();
  const def = getExperiment(id);
  const stored = useApp((s) => s.sessions[id]);
  const patch = useApp((s) => s.patchSession);
  const resetSession = useApp((s) => s.resetSession);
  const session = useMemo(() => stored ?? newSession(id), [stored, id]);
  const a = useMemo(() => (def ? analyze(def, session.rows) : null), [def, session.rows]);
  const step = Math.min(session.step, STEPS.length - 1);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, id]);

  if (!def || !a) {
    return (
      <div className="page narrow">
        <h1>Тәжірибе табылмады</h1>
        <p><Link to="/labs">Зертханалар каталогына оралу</Link></p>
      </div>
    );
  }
  const sc = score(def, a, session.hypothesis, session.conclusion);
  const go = (n: number) => patch(def.id, { step: Math.max(0, Math.min(STEPS.length - 1, n)) });
  const measured = a.valid.length > 0;
  const finish = () => patch(def.id, { completedAt: new Date().toISOString(), score: sc.total, deviation: a.deviation });

  return (
    <div className={`exp ${step === 3 ? 'wide' : ''}`}>
      <header className="exp-head">
        <div>
          <p className="eyebrow">
            <Link to={`/labs/${def.labId}`}>{getLab(def.labId)?.title}</Link> · {def.grade}-сынып{def.number ? ` · №${def.number} зертханалық жұмыс` : ' · қосымша тәжірибе'}
          </p>
          <h1>{def.title}</h1>
        </div>
        <button className="btn ghost" onClick={() => { if (confirm('Барлық өлшеулер мен жауаптар өшіріледі. Жалғастырасыз ба?')) resetSession(def.id); }}>
          Жұмысты басынан бастау
        </button>
      </header>

      <nav className="stepper" aria-label="Жұмыс барысы">
        {STEPS.map((s, i) => (
          <button key={s} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined} onClick={() => go(i)}>
            <i>{i + 1}</i>
            <span>{s}</span>
          </button>
        ))}
      </nav>

      <section className="exp-body" aria-live="polite">
        {step !== 3 && <h2>{step + 1}. {STEPS[step]}</h2>}
        {step === 0 && <Intro def={def} />}
        {step === 1 && <Theory def={def} />}
        {step === 2 && <Hypothesis def={def} session={session} done={measured && session.completedAt !== null} />}
        {step === 3 && <LabView key={def.id} def={def} session={session} />}
        {step === 4 && (
          <div className="prose">
            <p>Кестеде құралдардан оқылған мәндер сақталған. Қате өлшеуді өшіріп, тәжірибені қайталауға болады. Ұсынылатын өлшеу саны — кемінде {def.minRows}.</p>
            <DataTable def={def} session={session} />
            <div className="row">
              <button className="btn" onClick={() => go(3)}>Тағы өлшеу жасау</button>
              <button className="btn" disabled={!session.rows.length} onClick={() => download(new Blob([toCsv(def, session)], { type: 'text/csv;charset=utf-8' }), `${def.id}-olsheuler.csv`)}>
                Кестені жүктеу (CSV)
              </button>
            </div>
          </div>
        )}
        {step === 5 && <Calculations def={def} a={a} />}
        {step === 6 && <Graph def={def} a={a} />}
        {step === 7 && <Errors def={def} a={a} />}
        {step === 8 && <Conclusion def={def} session={session} />}
        {step === 9 && <Report def={def} session={session} a={a} sc={sc} onFinish={finish} />}
      </section>

      <footer className="exp-nav">
        <button className="btn" onClick={() => go(step - 1)} disabled={step === 0}>← Артқа</button>
        <span>{step + 1} / {STEPS.length}</span>
        <button className="btn primary" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1}>
          {step === 2 ? 'Зертханаға өту' : 'Келесі'} →
        </button>
      </footer>
    </div>
  );
}
