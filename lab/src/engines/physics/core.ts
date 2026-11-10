/**
 * Физикалық есептеу қозғалтқышының өзегі.
 * Барлық шамалар ішкі есептеуде SI бірліктерінде сақталады.
 */

export const G = 9.80665; // м/с² — еркін түсу үдеуінің стандарт мәні
export const R_GAS = 8.314462618; // Дж/(моль·К)
export const C_LIGHT = 299_792_458; // м/с
export const H_PLANCK = 6.62607015e-34; // Дж·с

export class PhysicsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhysicsError';
  }
}

/** Шама шекті сан екенін тексереді. */
export function finite(value: number, name: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new PhysicsError(`«${name}» шамасы шекті сан болуы керек`);
  }
  return value;
}

/** Қатаң оң шама (масса, уақыт, кедергі ...). */
export function positive(value: number, name: string): number {
  finite(value, name);
  if (value <= 0) throw new PhysicsError(`«${name}» шамасы нөлден үлкен болуы керек`);
  return value;
}

/** Теріс емес шама. */
export function nonNegative(value: number, name: string): number {
  finite(value, name);
  if (value < 0) throw new PhysicsError(`«${name}» шамасы теріс болмауы керек`);
  return value;
}

/** Нөлге бөлуден қорғалған бөлу. */
export function divide(a: number, b: number, name: string): number {
  finite(a, 'алымы');
  finite(b, name);
  if (Math.abs(b) < 1e-300) throw new PhysicsError(`«${name}» нөлге тең — бөлу мүмкін емес`);
  return a / b;
}

export const EPS = 1e-9;

/** Сандық төзімділікпен салыстыру. */
export function approx(a: number, b: number, relTol = 1e-9, absTol = 1e-12): boolean {
  return Math.abs(a - b) <= Math.max(absTol, relTol * Math.max(Math.abs(a), Math.abs(b)));
}

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
export const deg2rad = (d: number) => (d * Math.PI) / 180;
export const rad2deg = (r: number) => (r * 180) / Math.PI;
