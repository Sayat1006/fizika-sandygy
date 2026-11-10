import type { ExperimentDef } from '../../data/types';
import { fmt, formatSig } from '../../engines/physics/uncertainty';
import { dateKk, sub } from '../../lib/format';
import { useApp, type Session } from '../../lib/store';
import { CONCLUSION_PROMPTS, type Analysis, type Score } from './analysis';
import Chart, { download } from './Chart';
import DataTable, { toCsv } from './DataTable';


/** Зертханалық жұмыстың толық есебі. «Басып шығару» арқылы PDF ретінде сақталады. */
export default function Report({ def, session, a, sc, onFinish }: { def: ExperimentDef; session: Session; a: Analysis; sc: Score; onFinish: () => void }) {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const r = def.result;
  const k = r.scale ?? 1;
  const g = def.graph;
  const exportJson = () =>
    download(
      new Blob([JSON.stringify({ experiment: def.id, title: def.title, profile, session, result: { mean: a.mean, abs: a.abs, rel: a.rel, deviation: a.deviation }, score: sc }, null, 2)], { type: 'application/json' }),
      `${def.id}-natizhe.json`,
    );
  return (
    <div className="report-wrap">
      <div className="report-tools no-print">
        <div className="form-row">
          <label className="field"><span>Мектеп</span><input value={profile.school} onChange={(e) => setProfile({ school: e.target.value })} placeholder="№ … орта мектеп" /></label>
          <label className="field"><span>Оқушының аты-жөні</span><input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="Аты Тегі" /></label>
          <label className="field"><span>Сыныбы</span><input value={profile.klass} onChange={(e) => setProfile({ klass: e.target.value })} placeholder="7 «А»" /></label>
        </div>
        <div className="row">
          <button className="btn primary" onClick={() => window.print()}>PDF ретінде сақтау / Басып шығару</button>
          <button className="btn" onClick={() => download(new Blob([toCsv(def, session)], { type: 'text/csv;charset=utf-8' }), `${def.id}-olsheuler.csv`)} disabled={!session.rows.length}>Өлшеулер (CSV)</button>
          <button className="btn" onClick={exportJson}>Нәтижелер (JSON)</button>
          <button className="btn success" onClick={onFinish} disabled={a.valid.length === 0}>
            {session.completedAt ? 'Нәтижені жаңарту' : 'Жұмысты аяқтау және сақтау'}
          </button>
        </div>
        {session.completedAt && <p className="note ok">Жұмыс сақталды — «Нәтижелерім» бөлімінен табасыз.</p>}
        <div className="score">
          <b>{sc.total} / {sc.max}</b>
          <ul>
            {sc.items.map((i) => (
              <li key={i.label}><span>{i.label}</span><em>{i.got} / {i.max}</em><small>{i.note}</small></li>
            ))}
          </ul>
        </div>
      </div>

      <article className="report" id="report">
        <header>
          <p>{profile.school || '________________________'}</p>
          <h2>{def.number ? `№${def.number} зертханалық жұмыс` : 'Зертханалық жұмыс'}</h2>
          <h1>{def.title}</h1>
          <p>
            Орындаған: <b>{profile.name || '________________'}</b>, сыныбы: <b>{profile.klass || `${def.grade}-сынып`}</b> · Күні: {dateKk(session.completedAt ?? new Date().toISOString())}
          </p>
        </header>
        <section>
          <h3>Жұмыстың мақсаты</h3>
          <p>{def.objective}</p>
        </section>
        <section>
          <h3>Құрал-жабдықтар</h3>
          <p>{def.equipment.join(', ')}.</p>
        </section>
        <section>
          <h3>Қысқаша теория</h3>
          <p>{def.theory.paragraphs[1] ?? def.theory.paragraphs[0]}</p>
          <p className="formula-line">{def.theory.formulas.map((f) => <code key={f.expr}>{sub(f.expr)}</code>)}</p>
        </section>
        <section>
          <h3>Тәжірибе қондырғысы және барысы</h3>
          <p>Жұмыс PHYSICS LAB 3D виртуалды зертханасында орындалды. Қондырғының қозғалысы физикалық теңдеулерді нақты уақытта шешу арқылы есептелді; мәндер құралдардың бөлік құнына дейін дөңгелектеліп оқылды.</p>
          {session.hypothesis !== null && (
            <p><b>Болжам.</b> {def.hypothesis.question} — «{def.hypothesis.options[session.hypothesis]}».</p>
          )}
        </section>
        <section>
          <h3>Өлшеу кестесі</h3>
          <DataTable def={def} session={session} readOnly />
        </section>
        {a.valid.length > 0 && (
          <>
            <section>
              <h3>Есептеулер</h3>
              <p className="formula-line">{def.calcSteps(a.valid[0].row.values, a.valid[0].all).map((s) => <code key={s}>{sub(s)}</code>)}</p>
              {a.mean !== null && <p>Орташа мән: {sub(r.symbol)}<sub> орт</sub> = {formatSig(a.mean * k, 4)} {r.unit}.</p>}
            </section>
            <section className="avoid-break">
              <h3>График</h3>
              <Chart points={a.points} fit={a.fit} xLabel={g.xLabel} yLabel={g.yLabel} title={g.title} mode={g.fit === 'none' ? 'scatter-line' : 'scatter'} height={280} />
              {a.fit && a.points.length >= 2 && <p>Түзудің көлбеулігі {formatSig(a.fit.slope * (g.slopeScale ?? 1), 4)} {g.slopeUnit ?? ''}, R² = {fmt(a.fit.r2, 3)}. {g.slopeNote}</p>}
            </section>
            <section>
              <h3>Қателікті бағалау</h3>
              <p><code>{sub(def.errorFormula)}</code></p>
              {a.rounded && a.mean !== null ? (
                <p>
                  Абсолют қателік Δ = {formatSig(a.abs * k, 2)} {r.unit}, салыстырмалы қателік ε = {fmt(a.rel * 100, 1)} %. Нәтиже: <b>{sub(r.symbol)} = ({a.rounded.text}) {r.unit}</b>.
                </p>
              ) : (
                <p>Өлшеулер әртүрлі шарттарда жасалғандықтан әр өлшеу теориялық мәнмен жеке салыстырылды.</p>
              )}
              {a.deviation !== null && (
                <p>{r.refLabel}{a.ref !== null && ` — ${formatSig(a.ref * k, 4)} ${r.unit}`}. Теориялық мәннен орташа ауытқу: {fmt(a.deviation, 1)} %.</p>
              )}
            </section>
          </>
        )}
        <section>
          <h3>Қорытынды</h3>
          {CONCLUSION_PROMPTS.map((q, i) => (
            <p key={q}><b>{q}</b> {session.conclusion[i]?.trim() || '—'}</p>
          ))}
        </section>
        <footer>
          <span>Бағалау: {sc.total} / {sc.max} балл</span>
          <span>PHYSICS LAB 3D</span>
        </footer>
      </article>
    </div>
  );
}
