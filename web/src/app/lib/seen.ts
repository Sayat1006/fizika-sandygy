/* Мұғалім қай сабақтың ҚМЖ-сын қарап шыққанын белгілеу (құрылғыда) — «Келесі сабақтарға дайындық» үшін */
const KEY = 'fs-seen';
let seen: Set<string> = (() => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } })();
export const isSeen = (v: string, n: number) => seen.has(`${v}|${n}`);
export function markSeen(v: string, n: number) {
  const k = `${v}|${n}`; if (seen.has(k)) return;
  seen = new Set(seen).add(k);
  try { localStorage.setItem(KEY, JSON.stringify([...seen].slice(-800))); } catch { /* */ }
  window.dispatchEvent(new Event('fs-seen'));
}
