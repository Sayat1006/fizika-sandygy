import { useMemo } from 'react';
import type { ExperimentDef } from '../../data/types';
import { fmt } from '../../engines/physics/uncertainty';
import { sub } from '../../lib/format';
import { useApp, type Session } from '../../lib/store';
import { analyze } from './analysis';

/** Өлшеу кестесі: өлшенген және есептелген бағандар бөлек белгіленеді. */
export default function DataTable({ def, session, compact, readOnly }: { def: ExperimentDef; session: Session; compact?: boolean; readOnly?: boolean }) {
  const patch = useApp((s) => s.patchSession);
  const a = useMemo(() => analyze(def, session.rows), [def, session.rows]);
  const cols = compact ? def.columns.filter((c) => c.kind === 'measured' || c.key === 'value') : def.columns;
  if (session.rows.length === 0) return <p className="empty">Кесте бос. Тәжірибе жүргізіп, «Өлшеуді жазу» батырмасын басыңыз.</p>;
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>№</th>
            {cols.map((c) => (
              <th key={c.key} className={c.kind}>
                {sub(c.label)}
                {c.unit && <span>, {c.unit}</span>}
              </th>
            ))}
            {!readOnly && <th aria-label="Әрекет" />}
          </tr>
        </thead>
        <tbody>
          {a.rows.map((r, i) => (
            <tr key={r.row.id}>
              <td>{i + 1}</td>
              {cols.map((c) => {
                const v = r.all[c.key];
                return (
                  <td key={c.key} className={c.kind}>
                    {Number.isFinite(v) ? fmt(v * (c.scale ?? 1), c.digits) : '—'}
                  </td>
                );
              })}
              {!readOnly && (
                <td>
                  <button className="icon-btn" aria-label={`${i + 1}-өлшеуді өшіру`} onClick={() => patch(def.id, { rows: session.rows.filter((x) => x.id !== r.row.id) })}>
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!compact && (
        <p className="legend">
          <span className="dot measured" /> құралдан оқылған мән <span className="dot computed" /> формуламен есептелген мән
        </p>
      )}
    </div>
  );
}

export function toCsv(def: ExperimentDef, session: Session): string {
  const a = analyze(def, session.rows);
  const head = ['№', ...def.columns.map((c) => `${c.label}${c.unit ? `, ${c.unit}` : ''}`)].join(';');
  const lines = a.rows.map((r, i) => [i + 1, ...def.columns.map((c) => fmt(r.all[c.key] * (c.scale ?? 1), c.digits))].join(';'));
  return '﻿' + [head, ...lines].join('\n');
}
