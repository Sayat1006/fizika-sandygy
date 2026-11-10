import { Link } from 'react-router-dom';
import { EXPERIMENTS } from '../data/experiments';
import { getLab } from '../data/labs';
import type { ExperimentDef } from '../data/types';
import { STEPS } from '../features/experiment/analysis';
import { useApp } from '../lib/store';

export function ExperimentCard({ def }: { def: ExperimentDef }) {
  const s = useApp((st) => st.sessions[def.id]);
  const lab = getLab(def.labId);
  const status = s?.completedAt ? 'Аяқталды' : s && (s.rows.length > 0 || s.step > 0) ? `Жалғасуда · ${s.step + 1}/${STEPS.length}` : null;
  return (
    <Link to={`/experiments/${def.id}`} className="xcard" style={{ '--hue': lab?.hue } as React.CSSProperties}>
      <span className="xcard-meta">
        {def.grade}-сынып{def.number ? ` · №${def.number}` : ' · қосымша'}
        {status && <em className={s?.completedAt ? 'ok' : ''}>{status}</em>}
      </span>
      <strong>{def.title}</strong>
      <span className="xcard-sub">{def.topic}</span>
      <span className="xcard-foot">
        <span>{lab?.title}</span>
        <span>≈ {def.duration} мин →</span>
      </span>
    </Link>
  );
}

export const available = (labId: string) => EXPERIMENTS.filter((e) => e.labId === labId);

export { dateKk } from '../lib/format';

export const ACHIEVEMENTS = [
  { id: 'first', title: 'Алғашқы тәжірибе', text: 'Бір зертханалық жұмысты аяқтау' },
  { id: 'accurate', title: 'Дәл өлшеу', text: 'Теориядан ауытқуы 5 %-дан аз нәтиже алу' },
  { id: 'explorer', title: 'Физика зерттеушісі', text: 'Үш түрлі жұмысты аяқтау' },
  { id: 'graph', title: 'График шебері', text: 'Бір жұмыста 6 және одан көп өлшеу жасау' },
  { id: 'scientist', title: 'Тәжірибеші ғалым', text: 'Барлық қолжетімді жұмысты аяқтау' },
];

export function useProgress() {
  const sessions = useApp((s) => s.sessions);
  const all = Object.values(sessions).filter((s) => EXPERIMENTS.some((e) => e.id === s.expId));
  const done = all.filter((s) => s.completedAt);
  const active = all.filter((s) => !s.completedAt && (s.rows.length > 0 || s.step > 0));
  const avg = done.length ? done.reduce((a, s) => a + (s.score ?? 0), 0) / done.length : null;
  const measurements = all.reduce((a, s) => a + s.rows.length, 0);
  const earned = new Set<string>();
  if (done.length >= 1) earned.add('first');
  if (done.some((s) => s.deviation !== null && s.deviation < 5)) earned.add('accurate');
  if (done.length >= 3) earned.add('explorer');
  if (all.some((s) => s.rows.length >= 6)) earned.add('graph');
  if (done.length >= EXPERIMENTS.length) earned.add('scientist');
  return { all, done, active, avg, measurements, earned };
}
