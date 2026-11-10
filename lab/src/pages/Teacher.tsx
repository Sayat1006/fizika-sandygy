import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EXPERIMENTS } from '../data/experiments';
import { TRACKS, type Track } from '../data/labs';
import { fmt } from '../engines/physics/uncertainty';
import { useApp } from '../lib/store';
import { dateKk, useProgress } from './shared';

export default function Teacher() {
  const { assignments, addAssignment, removeAssignment, custom, addCustom, removeCustom, patchSession, profile } = useApp();
  const { done } = useProgress();
  const [grade, setGrade] = useState(7);
  const list = EXPERIMENTS.filter((e) => e.grade === grade);
  const [expId, setExpId] = useState('g7-4');
  const [klass, setKlass] = useState('');
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');
  const [cGrade, setCGrade] = useState<10 | 11>(10);
  const [cTrack, setCTrack] = useState<Track>('nm');
  const [cTitle, setCTitle] = useState('');
  const title = (id: string) => EXPERIMENTS.find((e) => e.id === id)?.title ?? id;
  const selected = list.some((e) => e.id === expId) ? expId : (list[0]?.id ?? '');

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Мұғалім кабинеті</p>
        <h1>Сынып тапсырмалары және бағдарлама</h1>
        <p className="lead">Жергілікті демо режим: тапсырмалар мен жұмыстар осы құрылғыда сақталады. Сыныптар арасында синхрондау (Supabase) келесі кезеңде қосылады.</p>
      </header>

      <section className="card">
        <h2>Тапсырма беру</h2>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!selected) return;
            addAssignment({ expId: selected, klass, due, note });
            setNote('');
          }}
        >
          <label className="field"><span>Сынып</span>
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
              {[7, 8, 9, 10, 11].map((g) => <option key={g} value={g}>{g}-сынып</option>)}
            </select>
          </label>
          <label className="field grow"><span>Зертханалық жұмыс</span>
            <select value={selected} onChange={(e) => setExpId(e.target.value)} disabled={!list.length}>
              {list.length ? list.map((e) => <option key={e.id} value={e.id}>{e.number ? `№${e.number}. ` : ''}{e.title}</option>) : <option>Бұл сыныпқа қолжетімді жұмыс әзірге жоқ</option>}
            </select>
          </label>
          <label className="field"><span>Сынып литері</span><input value={klass} onChange={(e) => setKlass(e.target.value)} placeholder="7 «А»" /></label>
          <label className="field"><span>Мерзімі</span><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
          <label className="field grow"><span>Ескертпе</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Мысалы: кемінде 5 өлшеу жасаңыз" /></label>
          <button className="btn primary" disabled={!selected}>Тапсырма беру</button>
        </form>
        {assignments.length === 0 ? <p className="empty">Берілген тапсырма жоқ.</p> : (
          <ul className="list">
            {assignments.map((a) => (
              <li key={a.id}>
                <div><Link to={`/experiments/${a.expId}`}>{title(a.expId)}</Link>{a.note && <small>{a.note}</small>}</div>
                <span>{a.klass || 'барлық сынып'} · {a.due ? dateKk(a.due) : 'мерзімсіз'}</span>
                <button className="icon-btn" aria-label="Тапсырманы өшіру" onClick={() => removeAssignment(a.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Тапсырылған жұмыстар</h2>
        {done.length === 0 ? <p className="empty">Осы құрылғыда аяқталған жұмыс әлі жоқ.</p> : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Оқушы</th><th>Жұмыс</th><th>Күні</th><th>Өлшеулер</th><th>Ауытқу</th><th>Балл</th><th>Есеп</th></tr></thead>
              <tbody>
                {done.map((s) => (
                  <tr key={s.expId}>
                    <td className="left">{profile.name || 'Аты көрсетілмеген'}{profile.klass && `, ${profile.klass}`}</td>
                    <td className="left">{title(s.expId)}</td>
                    <td>{dateKk(s.completedAt!)}</td>
                    <td>{s.rows.length}</td>
                    <td>{s.deviation === null ? '—' : `${fmt(s.deviation, 1)} %`}</td>
                    <td><b>{s.score} / 10</b></td>
                    <td><Link className="btn sm" to={`/experiments/${s.expId}`} onClick={() => patchSession(s.expId, { step: 9 })}>Қарау</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>10–11 сынып бағдарламасын баптау</h2>
        <p className="note">Ресми нөмірлеу автоматты түрде ойдан құрастырылмайды. Бекітілген бағдарламадағы жұмыс атауларын бағыт бойынша өзіңіз енгізіңіз — олар «Пән тақырыптары» бөлімінде көрсетіледі.</p>
        <form
          className="form-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!cTitle.trim()) return;
            addCustom({ grade: cGrade, track: cTrack, title: cTitle.trim() });
            setCTitle('');
          }}
        >
          <label className="field"><span>Сынып</span>
            <select value={cGrade} onChange={(e) => setCGrade(Number(e.target.value) as 10 | 11)}><option value={10}>10-сынып</option><option value={11}>11-сынып</option></select>
          </label>
          <label className="field"><span>Бағыт</span>
            <select value={cTrack} onChange={(e) => setCTrack(e.target.value as Track)}>
              {(Object.keys(TRACKS) as Track[]).map((t) => <option key={t} value={t}>{TRACKS[t]}</option>)}
            </select>
          </label>
          <label className="field grow"><span>Жұмыстың атауы</span><input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Зертханалық жұмыстың атауы" /></label>
          <button className="btn primary" disabled={!cTitle.trim()}>Қосу</button>
        </form>
        {custom.length > 0 && (
          <ul className="list">
            {custom.map((c) => (
              <li key={c.id}>
                <span>{c.title}</span>
                <span>{c.grade}-сынып · {TRACKS[c.track]}</span>
                <button className="icon-btn" aria-label="Жұмысты өшіру" onClick={() => removeCustom(c.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
