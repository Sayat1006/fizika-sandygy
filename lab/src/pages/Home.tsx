import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { EXPERIMENTS } from '../data/experiments';
import { LABS } from '../data/labs';
import { useT } from '../lib/i18n';
import { webglAvailable } from '../lib/webgl';
import { ExperimentCard, available, dateKk, useProgress } from './shared';

const HeroScene = lazy(() => import('../three/HeroScene'));

const HOW = [
  ['Таңда', 'Сыныбыңды, тақырыпты және зертханалық жұмысты таңда.'],
  ['Болжа', 'Теориямен танысып, тәжірибе нәтижесін алдын ала болжа.'],
  ['Тәжірибе жаса', '3D құралдарды қолыңмен жылжыт, параметрлерді өзгерт, өлше.'],
  ['Талда', 'Кесте, график және қателікті есептеп, қорытынды жаз.'],
  ['Есеп ал', 'Толық зертханалық есепті PDF ретінде сақта.'],
];

export default function Home() {
  const t = useT();
  const { done, active, avg, measurements } = useProgress();
  const recent = [...done].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')).slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="hero-scene" aria-hidden>
          {webglAvailable() && (
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
          )}
        </div>
        <div className="hero-copy">
          <p className="eyebrow">PHYSICS LAB 3D · {t('tagline')}</p>
          <h1>{t('hero.title')}</h1>
          <p className="lead">{t('hero.text')}</p>
          <div className="row">
            <Link className="btn primary lg" to="/labs/mechanics">{t('cta.start')}</Link>
            <a className="btn lg" href="#features">{t('cta.features')}</a>
          </div>
        </div>
      </section>

      <div className="page">
        <section>
          <h2>Сыныбыңды таңда</h2>
          <div className="grades">
            {[7, 8, 9, 10, 11].map((g) => (
              <Link key={g} to={`/topics?grade=${g}`} className="grade">
                <b>{g}</b>
                <span>сынып</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2>Зертханалар</h2>
            <Link to="/labs">Барлығын көру →</Link>
          </div>
          <div className="lab-grid">
            {LABS.map((l) => {
              const n = available(l.id).length;
              return (
                <Link key={l.id} to={`/labs/${l.id}`} className="lab-card" style={{ '--hue': l.hue } as React.CSSProperties}>
                  <span className="lab-no">{l.no}</span>
                  <strong>{l.title}</strong>
                  <span>{l.summary}</span>
                  <em className={n ? 'ok' : ''}>{n ? `${n} тәжірибе қолжетімді` : 'Әзірленуде'}</em>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2>Таңдаулы тәжірибелер</h2>
          <div className="xgrid">
            {EXPERIMENTS.map((e) => (
              <ExperimentCard key={e.id} def={e} />
            ))}
          </div>
        </section>

        <section className="two">
          <div>
            <h2>Соңғы аяқталған жұмыстар</h2>
            {recent.length === 0 ? (
              <p className="empty">Әзірге аяқталған жұмыс жоқ. Алғашқы тәжірибеңді бастап көр!</p>
            ) : (
              <ul className="list">
                {recent.map((s) => {
                  const def = EXPERIMENTS.find((e) => e.id === s.expId)!;
                  return (
                    <li key={s.expId}>
                      <Link to={`/experiments/${s.expId}`}>{def.title}</Link>
                      <span>{dateKk(s.completedAt!)} · {s.score}/10</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <h2>Оқу статистикасы</h2>
            <dl className="stats">
              <div><dd>{done.length}</dd><dt>аяқталған жұмыс</dt></div>
              <div><dd>{active.length}</dd><dt>жалғасуда</dt></div>
              <div><dd>{measurements}</dd><dt>жасалған өлшеу</dt></div>
              <div><dd>{avg === null ? '—' : avg.toFixed(1).replace('.', ',')}</dd><dt>орташа балл / 10</dt></div>
            </dl>
          </div>
        </section>

        <section id="features">
          <h2>Виртуалды зертхана қалай жұмыс істейді</h2>
          <ol className="how">
            {HOW.map(([title, text], i) => (
              <li key={title}>
                <i>{i + 1}</i>
                <strong>{title}</strong>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <div className="principles">
            <div><strong>Бір құрал — бірнеше тәжірибе</strong><span>Динамометр серпімділік, үйкеліс, Архимед күші және ПӘК жұмыстарында қайта қолданылады.</span></div>
            <div><strong>Нақты физикалық есептеу</strong><span>Массаны өзгертсең — күш, үдеу және график те соған сәйкес өзгереді. Дайын жауап жоқ.</span></div>
            <div><strong>3D — декорация емес</strong><span>Жүкті ұстап іл, динамометрді тарт, тақтайды бұр, денені сұйыққа батыр.</span></div>
            <div><strong>Аяқталған жұмыс</strong><span>Кесте, график, есептеу, қателік және қорытынды — толық зертханалық есеп.</span></div>
          </div>
        </section>
      </div>
    </>
  );
}
