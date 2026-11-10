export type Params = Record<string, number>;

export interface DisplayReading {
  label: string;
  text: string;
  /** құрал атауы */
  instrument: string;
}

export interface Readings {
  /** Құралдардан оқылған мәндер (SI, бөлік құнына дейін дөңгелектенген) */
  values: Record<string, number>;
  /** Құралдық абсолют қателіктер (SI) */
  errors: Record<string, number>;
  /** Осы қондырғы күйіне сәйкес теориялық/анықтамалық мән */
  ref: number;
  canRecord: boolean;
  hint: string;
  display: DisplayReading[];
}

export interface Sample {
  t: number;
  x: number;
  v: number;
  a: number;
}

/**
 * Нақты уақыттағы физикалық модель. Тұрақты қадаммен (FIXED_DT) интегралданады,
 * сондықтан нәтиже кадр жиілігіне тәуелсіз.
 */
export interface Simulation {
  reset(p: Params): void;
  /** Бір тұрақты қадам. Параметрлерге түзету қайтаруы мүмкін. */
  step(dt: number, p: Params): Partial<Params> | void;
  readings(p: Params): Readings;
  action?(id: string, p: Params): void;
  /** Тірі графиктерге арналған уақыттық қатар */
  series?: Sample[];
}

export const FIXED_DT = 1 / 600;
export const WEIGHT_MASS = 0.1; // кг — бір жүктің массасы
