import { Link, useSearchParams } from 'react-router-dom';
import { CURRICULUM, TRACKS, getLab, type Track } from '../data/labs';
import { useApp } from '../lib/store';

export default function Topics() {
  const [sp, setSp] = useSearchParams();
  const grade = Number(sp.get('grade')) || 7;
  const custom = useApp((s) => s.custom);
  const items = CURRICULUM.filter((c) => c.grade === grade);
  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Оқу бағдарламасы</p>
        <h1>Пән тақырыптары</h1>
        <p className="lead">7–9 сыныптар үшін үлгілік оқу бағдарламасындағы зертханалық жұмыстар тізімі. 10–11 сыныптардың тізімі бағыт бойынша мұғалім кабинетінде бапталады.</p>
      </header>
      <div className="seg big" role="tablist" aria-label="Сынып">
        {[7, 8, 9, 10, 11].map((g) => (
          <button key={g} role="tab" aria-selected={g === grade} className={g === grade ? 'on' : ''} onClick={() => setSp({ grade: String(g) })}>
            {g}-сынып
          </button>
        ))}
      </div>
      {grade <= 9 ? (
        <ul className="list numbered">
          {items.map((c) => (
            <li key={c.number}>
              <i>{c.number}</i>
              <div>
                {c.expId ? <Link to={`/experiments/${c.expId}`}>{c.title}</Link> : <span>{c.title}</span>}
                <small>{getLab(c.labId)?.title}</small>
              </div>
              {c.expId ? <Link className="btn sm primary" to={`/experiments/${c.expId}`}>Ашу</Link> : <em>Әзірленуде</em>}
            </li>
          ))}
        </ul>
      ) : (
        (Object.keys(TRACKS) as Track[]).map((tr) => {
          const list = custom.filter((c) => c.grade === grade && c.track === tr);
          return (
            <section key={tr}>
              <h2>{TRACKS[tr]}</h2>
              {list.length ? (
                <ul className="list numbered">
                  {list.map((c, i) => (
                    <li key={c.id}><i>{i + 1}</i><div><span>{c.title}</span><small>Мұғалім қосқан жұмыс</small></div></li>
                  ))}
                </ul>
              ) : (
                <p className="empty">
                  Бұл бағыт бойынша жұмыстар тізімі әлі енгізілмеген. Ресми нөмірлеу ойдан құрастырылмайды — тізімді <Link to="/teacher">мұғалім кабинетінде</Link> бекітілген бағдарламаға сәйкес қосыңыз.
                </p>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
