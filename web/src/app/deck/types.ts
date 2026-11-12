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
  | (Head & { t: 'chart'; title: string; chart: Chart; items: string[] })
  /* ── v3: көрнекі слайдтар — бір слайд = бір ой, үлкен сурет, аз мәтін ── */
  | (N & { t: 'cover'; kicker: string; title: string; art: string; sub?: string })
  | (N & { t: 'ask'; q: string; art: string; answer?: string })
  | (N & { t: 'aims'; title: string; items: string[] })
  | (N & { t: 'trio'; title: string; items: { name: string; art: string; text: string }[] })
  | (N & { t: 'idea'; kicker?: string; title: string; text?: string; list?: string[]; art: string; chips?: string[]; flip?: boolean })
  | (N & { t: 'model'; kicker?: string; title: string; text?: string; illus: { k: string; a?: unknown[] } })
  | (N & { t: 'bigf'; title: string; f: string; parts: [string, string, string][]; art?: string })
  | (N & { t: 'poll'; q: string; opts: string[]; ok: number; art?: string })
  | (N & { t: 'myth'; wrong: string; right: string; why: string; art?: string })
  | (N & { t: 'job'; level: 'A' | 'B' | 'C'; q: string; answer: string; art?: string })
  | (N & { t: 'sum'; title: string; items: { art: string; text: string }[] })
  | (N & { t: 'home'; title: string; items: [string, string][] })
  | (N & { t: 'stars'; title: string; items: (string | [string, string])[] })
  | (N & { t: 'bye'; title: string; art: string; quote?: Quote });
/** v3 слайдының мұғалімге арналған жазбасы (әдіс нұсқаулығы — экранда емес, жазбада) */
interface N { notes?: string; tag?: string }

/** Сызба: сурет (SVG) немесе дерекпен салынатын карточкалар / схема / график */
export interface Visual { illus?: { k: string; a?: unknown[] }; img?: { svg: string; png?: string; w: number; h: number }; cards?: { title: string; items: [string, string][] }; flow?: { title: string; items: string[] }; chart?: Chart }
export interface Chart { type: 'line' | 'bar'; title: string; xl: string; yl: string; labels: string[]; series: { name: string; values: number[] }[] }

export interface Quote { text: string; by: string }
export interface Col { name: string; def: string; ex: (string | number)[][] }
export interface Scale { cell: number; unit: string }
export interface DeckData { v: string; n: number; grade: number; topic: string; slides: Slide[]; custom?: boolean;
  /** Сабақтың тесті: [сұрақ, нұсқалар, дұрыс жауап] (tools/quiz/add_quiz.py) */
  quiz?: [string, string[], string][] }

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
    case 'ask': return s.answer ? 1 : 0;
    case 'aims': return s.items.length;
    case 'trio': case 'sum': return s.items.length;
    case 'idea': return (s.list?.length || 0) + (s.chips?.length ? 1 : 0);
    case 'bigf': return s.parts.length;
    case 'poll': case 'job': return 1;
    case 'myth': return 2;
    default: return 0;
  }
}
