/* Анимациялы презентацияның мазмұны (materials/decks/{v}-{n}.json).
   Бір файлдан екі нәрсе жасалады: тақтадағы анимациялы слайдтар (Deck.tsx) және
   жүктеп алатын .pptx (tools/deck/build_pptx.py). Қадам саны екеуінде бірдей — stepsOf(). */

export type Dir = 'right' | 'left' | 'up' | 'down';
export interface Vec { name: string; mag: number; dir: Dir }
interface Head { tag?: string; time?: string }

export type Slide =
  | { t: 'title'; kicker: string; title: string; sub: string; foot?: string }
  | (Head & { t: 'goals'; title: string; code?: string; items: string[] })
  | (Head & { t: 'yesno'; title: string; sub?: string; items: [string, boolean][]; quote?: Quote })
  | (Head & { t: 'problem'; lead: string; twist: string; ask: string; note?: string })
  | (Head & { t: 'compare'; title: string; left: Col; right: Col; note?: string })
  | (Head & Visual & { t: 'picture'; title: string; items: string[]; note?: string })
  | (Head & { t: 'link'; title: string; items: string[]; url: string; qr?: string | null })
  | (Head & { t: 'vectors'; title: string; chain?: string[]; scale: Scale; vectors: Vec[]; task: string })
  | (Head & { t: 'break'; title: string; rules?: [string, string][]; items?: string[]; text?: string })
  | (Head & { t: 'levels'; title: string; items: [string, string][]; note?: string })
  | (Head & { t: 'sort'; level: string; title: string; items: [string, 's' | 'v'][] })
  | (Head & { t: 'task'; level: string; q: string; answer: string; scale?: Scale; vectors?: Vec[]; illus?: 'track' })
  | (Head & { t: 'qa'; title: string; items: [string, string][]; qr?: string | null; qrLabel?: string })
  | (Head & { t: 'reflect'; title: string; fingers?: [string, string][]; text?: string; scale: [string, string][] })
  | (Head & { t: 'homework'; title: string; items: [string, string][] })
  | { t: 'end'; title: string; quote?: Quote }
  | (Head & { t: 'text'; title: string; sub?: string; paras: string[]; quote?: Quote; task?: string })
  | (Head & { t: 'hook'; text: string; ask: string })
  | (Head & Visual & { t: 'theory'; title: string; items: string[]; caption?: string })
  | (Head & { t: 'formulas'; title: string; items: string[] })
  | (Head & { t: 'equip'; title: string; items: string[] })
  | (Head & { t: 'procedure'; title: string; items: string[] })
  | (Head & { t: 'table'; title: string; head: string[]; rows: number; note?: string })
  | (Head & { t: 'chart'; title: string; chart: Chart; items: string[] });

/** Сызба: сурет (SVG) немесе дерекпен салынатын карточкалар / схема / график */
export interface Visual { img?: { svg: string; png?: string; w: number; h: number }; cards?: { title: string; items: [string, string][] }; flow?: { title: string; items: string[] }; chart?: Chart }
export interface Chart { type: 'line' | 'bar'; title: string; xl: string; yl: string; labels: string[]; series: { name: string; values: number[] }[] }

export interface Quote { text: string; by: string }
export interface Col { name: string; def: string; ex: (string | number)[][] }
export interface Scale { cell: number; unit: string }
export interface DeckData { v: string; n: number; grade: number; topic: string; slides: Slide[]; custom?: boolean }

/** Слайдтағы «басу» саны: әр басу келесі элементті көрсетеді. build_pptx.py-дағы steps_of() осымен бірдей. */
export function stepsOf(s: Slide): number {
  switch (s.t) {
    case 'goals': case 'picture': case 'yesno': case 'sort': case 'qa': case 'theory': case 'formulas': case 'procedure': return s.items.length;
    case 'problem': return 2;
    case 'hook': return 1;
    case 'compare': return s.note ? 3 : 2;
    case 'vectors': return s.vectors.length;
    case 'levels': return s.items.length;
    case 'task': return 1;
    default: return 0;
  }
}
