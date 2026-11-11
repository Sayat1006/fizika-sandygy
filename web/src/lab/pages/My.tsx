import { Link } from 'react-router-dom';
import { EXPERIMENTS } from '../data/experiments';
import { STEPS } from '../features/experiment/analysis';
import { useApp } from '../lib/store';
import { ACHIEVEMENTS, dateKk, useProgress } from './shared';

export default function My() {
  const profile = useApp((s) => s.profile);
  const setProfile = useApp((s) => s.setProfile);
  const assignments = useApp((s) => s.assignments);
  const { done, active, avg, measurements, earned, all } = useProgress();
  const title = (id: string) => EXPERIMENTS.find((e) => e.id === id)?.title ?? id;
  const skills = [
    ['Өлшеу', Math.min(1, measurements / 24)],
    ['Дәлдік', done.length ? done.filter((s) => (s.deviation ?? 100) < 10).length / done.length : 0],
    ['Талдау және қорытынды', done.length ? done.filter((s) => s.conclusion.filter((c) => c.trim().length >= 15).length >= 4).length / done.length : 0],
    ['Бағдарламаны орындау', done.length / EXPERIMENTS.length],
  ] as const;
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Оқушы кабинеті</p>
        <h1>Менің тәжірибелерім</h1>
      </header>
      <section className="form-row card">
        <label className="field"><span>Аты-жөні</span><input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} placeholder="Аты Тегі" /></label>
        <label className="field"><span>Мектеп</span><input value={profile.school} onChange={(e) => setProfile({ school: e.target.value })} placeholder="№ … орта мектеп" /></label>
        <label className="field"><span>Сыныбы</span><input value={profile.klass} onChange={(e) => setProfile({ klass: e.target.value })} placeholder="7 «А»" /></label>
      </section>

      <dl className="stats">
        <div><dd>{done.length}</dd><dt>аяқталған</dt></div>
        <div><dd>{active.length}</dd><dt>жалғасуда</dt></div>
        <div><dd>{avg === null ? '—' : avg.toFixed(1).replace('.', ',')}</dd><dt>орташа балл / 10</dt></div>
        <div><dd>{measurements}</dd><dt>өлшеу</dt></div>
      </dl>

      {assignments.length > 0 && (
        <section>
          <h2>Мұғалім тапсырмалары</h2>
          <ul className="list">
            {assignments.map((a) => (
              <li key={a.id}>
                <Link to={`/experiments/${a.expId}`}>{title(a.expId)}</Link>
                <span>{a.klass && `${a.klass} · `}{a.due ? `мерзімі: ${dateKk(a.due)}` : 'мерзімсіз'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="two">
        <div>
          <h2>Жалғасып жатқан жұмыстар</h2>
          {active.length === 0 ? <p className="empty">Жалғасып жатқан жұмыс жоқ. <Link to="/labs/mechanics">Жаңа тәжірибе бастау →</Link></p> : (
            <ul className="list">
              {active.map((s) => (
                <li key={s.expId}>
                  <Link to={`/experiments/${s.expId}`}>{title(s.expId)}</Link>
                  <span>{STEPS[s.step]} · {s.rows.length} өлшеу</span>
                </li>
              ))}
            </ul>
          )}
          <h2>Тарих</h2>
          {all.length === 0 ? <p className="empty">Тарих бос.</p> : (
            <ul className="list">
              {[...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((s) => (
                <li key={s.expId}>
                  <Link to={`/experiments/${s.expId}`}>{title(s.expId)}</Link>
                  <span>{dateKk(s.updatedAt)} · {s.completedAt ? `аяқталды, ${s.score}/10` : 'аяқталмаған'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2>Ғылыми дағдылар</h2>
          <div className="skills">
            {skills.map(([name, v]) => (
              <div key={name}>
                <span>{name}<b>{Math.round(v * 100)} %</b></span>
                <div className="bar" role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={name}><i style={{ width: `${v * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <h2>Жетістіктер</h2>
          <ul className="badges">
            {ACHIEVEMENTS.map((a) => (
              <li key={a.id} className={earned.has(a.id) ? 'on' : ''}>
                <strong>{a.title}</strong>
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
