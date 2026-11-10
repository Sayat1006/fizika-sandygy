import { Link } from 'react-router-dom';
import { EXPERIMENTS } from '../data/experiments';
import { fmt } from '../engines/physics/uncertainty';
import { useApp } from '../lib/store';
import { dateKk, useProgress } from './shared';

export default function Results() {
  const { done } = useProgress();
  const patch = useApp((s) => s.patchSession);
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Оқушы кабинеті</p>
        <h1>Нәтижелерім</h1>
        <p className="lead">Аяқталған зертханалық жұмыстар, бағалары және есептері.</p>
      </header>
      {done.length === 0 ? (
        <p className="empty">Әзірге аяқталған жұмыс жоқ. Жұмыстың соңғы — «Есеп» қадамында «Жұмысты аяқтау және сақтау» батырмасын басыңыз. <Link to="/labs/mechanics">Тәжірибе таңдау →</Link></p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Жұмыс</th><th>Күні</th><th>Өлшеулер</th><th>Теориядан ауытқу</th><th>Балл</th><th>Есеп</th></tr>
            </thead>
            <tbody>
              {[...done].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')).map((s) => {
                const def = EXPERIMENTS.find((e) => e.id === s.expId)!;
                return (
                  <tr key={s.expId}>
                    <td className="left"><Link to={`/experiments/${s.expId}`}>{def.title}</Link></td>
                    <td>{dateKk(s.completedAt!)}</td>
                    <td>{s.rows.length}</td>
                    <td>{s.deviation === null ? '—' : `${fmt(s.deviation, 1)} %`}</td>
                    <td><b>{s.score} / 10</b></td>
                    <td><Link className="btn sm" to={`/experiments/${s.expId}`} onClick={() => patch(s.expId, { step: 9 })}>Есепті ашу</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
