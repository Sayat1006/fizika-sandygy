import { Link, useParams } from 'react-router-dom';
import { CURRICULUM, LABS, getLab } from '../data/labs';
import { ExperimentCard, available } from './shared';

export function Labs() {
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Каталог</p>
        <h1>Зертханалар</h1>
        <p className="lead">Он бірыңғай зертханалық орта. Алдымен механика зертханасы толық іске қосылды — қалғандары сол ортақ қозғалтқыш негізінде кезең-кезеңімен қосылады.</p>
      </header>
      <div className="lab-list">
        {LABS.map((l) => {
          const n = available(l.id).length;
          return (
            <Link key={l.id} to={`/labs/${l.id}`} className="lab-row" style={{ '--hue': l.hue } as React.CSSProperties}>
              <span className="lab-no">{l.no}</span>
              <div>
                <strong>{l.title}</strong>
                <span>{l.summary}</span>
              </div>
              <span className="muted">{l.grades} сынып</span>
              <em className={n ? 'ok' : ''}>{n ? `${n} тәжірибе` : 'Әзірленуде'}</em>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function LabDetail() {
  const { id = '' } = useParams();
  const lab = getLab(id);
  if (!lab) {
    return (
      <div className="page narrow">
        <h1>Зертхана табылмады</h1>
        <p><Link to="/labs">Каталогқа оралу</Link></p>
      </div>
    );
  }
  const ready = available(lab.id);
  const planned = CURRICULUM.filter((c) => c.labId === lab.id && !c.expId);
  return (
    <div className="page" style={{ '--hue': lab.hue } as React.CSSProperties}>
      <header className="page-head">
        <p className="eyebrow"><Link to="/labs">Зертханалар</Link> · {lab.no}</p>
        <h1>{lab.title}</h1>
        <p className="lead">{lab.summary} Сыныптар: {lab.grades}.</p>
      </header>
      <section className="two">
        <div>
          <h3>Тақырыптар</h3>
          <ul className="tags">{lab.topics.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div>
          <h3>3D құрал-жабдықтар</h3>
          <ul className="tags">{lab.equipment.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </section>
      <section>
        <h2>Қолжетімді тәжірибелер</h2>
        {ready.length ? (
          <div className="xgrid">{ready.map((e) => <ExperimentCard key={e.id} def={e} />)}</div>
        ) : (
          <p className="empty">Бұл зертхананың тәжірибелері әзірленуде. Қазір механика зертханасындағы жұмыстарды орындауға болады: <Link to="/labs/mechanics">Механика зертханасы →</Link></p>
        )}
      </section>
      {planned.length > 0 && (
        <section>
          <h2>Келесі кезеңде қосылатын жұмыстар</h2>
          <ul className="list">
            {planned.map((c) => (
              <li key={`${c.grade}-${c.number}`}>
                <span>{c.title}</span>
                <span>{c.grade}-сынып · №{c.number}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
