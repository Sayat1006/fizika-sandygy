import type { ReactNode } from 'react';

const MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];

/** Қазақша күн пішімі (браузер локаліне тәуелсіз): «10 қараша 2026 ж.» */
export function dateKk(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ж.`;
}

/** «F_серп», «ρ_с» түріндегі жазуды төменгі индекспен шығарады. */
export function sub(text: string): ReactNode {
  const parts = text.split(/_([\p{L}\p{N}]+)/u);
  return parts.map((p, i) => (i % 2 ? <sub key={i}>{p}</sub> : p));
}
