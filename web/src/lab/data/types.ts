export type SceneKind = 'spring' | 'surface' | 'archimedes' | 'track';

export interface ParamDef {
  key: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  def: number;
  /** Көрсету көбейткіші (мыс. кг → г үшін 1000) */
  scale?: number;
  digits?: number;
  /** Тізімнен таңдау: мәндер мен атаулар */
  options?: { value: number; label: string }[];
  /** Тек «Кеңейтілген» режимде көрсетіледі */
  advanced?: boolean;
  /** 3D көріністе қолмен жылжытылатын шама (пернетақта/2D балама ретінде сырғытпа) */
  manip?: boolean;
}

export interface ColumnDef {
  key: string;
  label: string;
  unit: string;
  scale?: number;
  digits: number;
  kind: 'measured' | 'computed';
}

export interface GraphDef {
  x: string;
  y: string;
  xLabel: string;
  yLabel: string;
  xScale?: number;
  yScale?: number;
  fit: 'origin' | 'linear' | 'none';
  /** Түзудің көлбеулігі нені білдіреді */
  slopeNote?: string;
  /** Көлбеулікті SI бірлігіне келтіру көбейткіші және бірлігі */
  slopeScale?: number;
  slopeUnit?: string;
  title: string;
}

export interface ExperimentDef {
  id: string;
  labId: string;
  grade: number;
  /** Үлгілік бағдарламадағы ресми нөмір; қосымша тәжірибе болса null */
  number: number | null;
  title: string;
  topic: string;
  objective: string;
  equipment: string[];
  duration: number;
  theory: { paragraphs: string[]; formulas: { expr: string; note: string }[] };
  hypothesis: { question: string; options: string[]; correct: number; explain: string };
  guide: string[];
  scene: SceneKind;
  params: ParamDef[];
  actions?: { id: string; label: string }[];
  columns: ColumnDef[];
  /** Өлшенген мәндерден есептелетін шамалар; `value` — жолдың негізгі нәтижесі */
  derive: (v: Record<string, number>) => Record<string, number>;
  /** Негізгі нәтиженің құралдық салыстырмалы қателігі */
  relError: (v: Record<string, number>, e: Record<string, number>) => number;
  /** Бір жол үшін есептеу қадамдары (формула → сандар → нәтиже) */
  calcSteps: (v: Record<string, number>, d: Record<string, number>) => string[];
  errorFormula: string;
  result: { symbol: string; name: string; unit: string; scale?: number; refLabel: string };
  graph: GraphDef;
  minRows: number;
  errorSources: string[];
}

export interface Lab {
  id: string;
  no: string;
  title: string;
  grades: string;
  summary: string;
  topics: string[];
  equipment: string[];
  hue: string;
}

export interface CurriculumItem {
  grade: number;
  number: number;
  title: string;
  labId: string;
  /** Іске асырылған тәжірибенің идентификаторы */
  expId?: string;
}
