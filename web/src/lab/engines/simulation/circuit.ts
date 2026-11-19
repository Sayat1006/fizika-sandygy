import { fmt, instrumentError, read, type Instrument } from '../physics/uncertainty';
import type { DisplayReading, Params, Readings, Simulation } from './types';

/** Мектеп амперметрі мен вольтметрі */
export const AMMETER: Instrument = { name: 'Амперметр', unit: 'А', division: 0.05, max: 2 };
export const VOLTMETER: Instrument = { name: 'Вольтметр', unit: 'В', division: 0.1, max: 6 };
export const CIRCUIT = { rhMax: 10, rInt: 0.5 };

/** Тізбек түрі: 1 — бір резистор (Ом заңы), 2 — тізбектей, 3 — параллель, 4 — шам (жұмыс пен қуат), 5 — шам мен резистор (ток күші әр жерде) */
export type Cfg = 1 | 2 | 3 | 4 | 5;
/** Шамның қызу кезінде кедергісі артады: R = R₀ + k·I */
const lampR = (I: number) => 2 + 5 * I;

export interface CircuitState { on: boolean; I: number; U: number; I1: number; I2: number; U1: number; U2: number; Ulamp: number; P: number }

/**
 * Тұрақты ток тізбегі: Кирхгоф ережелері бойынша лезде есептеледі (өтпелі процестер ескерілмейді).
 * Ток көзінің ішкі кедергісі 0,5 Ом, реостат 0–10 Ом.
 */
export class CircuitSim implements Simulation {
  reset() {}
  step() {}

  state(p: Params): CircuitState {
    const cfg = p.cfg as Cfg, on = p.sw > 0.5, Rx = p.rh * CIRCUIT.rhMax + CIRCUIT.rInt;
    const z: CircuitState = { on, I: 0, U: 0, I1: 0, I2: 0, U1: 0, U2: 0, Ulamp: 0, P: 0 };
    if (!on) return z;
    if (cfg === 1) { const I = p.U0 / (p.R1 + Rx); return { ...z, I, U: I * p.R1, I1: I, U1: I * p.R1 }; }
    if (cfg === 2) { const I = p.U0 / (p.R1 + p.R2 + Rx); return { ...z, I, I1: I, I2: I, U1: I * p.R1, U2: I * p.R2, U: I * (p.R1 + p.R2) }; }
    if (cfg === 3) {
      const Rp = (p.R1 * p.R2) / (p.R1 + p.R2), I = p.U0 / (Rp + Rx), U = I * Rp;
      return { ...z, I, U, I1: U / p.R1, I2: U / p.R2, U1: U, U2: U };
    }
    // шам бар тізбек: I = U₀ / (R_шам(I) + R₁ + R_x) — итерация
    const Rs = cfg === 5 ? p.R1 : 0;
    let I = 0.3;
    for (let k = 0; k < 40; k++) I = 0.5 * I + 0.5 * (p.U0 / (lampR(I) + Rs + Rx));
    const Ul = I * lampR(I);
    return { ...z, I, U: Ul, Ulamp: Ul, I1: I, U1: I * Rs, P: Ul * I };
  }

  readings(p: Params): Readings {
    const s = this.state(p), cfg = p.cfg as Cfg;
    const A = (x: number) => read(AMMETER, x), V = (x: number) => read(VOLTMETER, x);
    const eA = instrumentError(AMMETER), eV = instrumentError(VOLTMETER);
    const dA = (label: string, x: number): DisplayReading => ({ label, text: `${fmt(A(x), 2)} А`, instrument: 'Амперметр' });
    const dV = (label: string, x: number): DisplayReading => ({ label, text: `${fmt(V(x), 1)} В`, instrument: 'Вольтметр' });
    const off = !s.on;
    const base = { canRecord: s.on && s.I > 0.02, hint: off ? 'Кілтті басып, тізбекті тұйықтаңыз' : 'Реостат жүгіртпесін жылжытып, ток күшін өзгертіңіз. Әр күйде өлшеуді жазыңыз' };
    if (cfg === 1) return { ...base, values: { U: V(s.U), I: A(s.I) }, errors: { U: eV, I: eA }, ref: p.R1, display: [dV('Кернеу U', s.U), dA('Ток күші I', s.I)] };
    if (cfg === 2) return { ...base, values: { I: A(s.I), U1: V(s.U1), U2: V(s.U2) }, errors: { I: eA, U1: eV, U2: eV }, ref: p.R1 + p.R2, display: [dA('Ток күші I', s.I), dV('R₁ кернеуі U₁', s.U1), dV('R₂ кернеуі U₂', s.U2)] };
    if (cfg === 3) return { ...base, values: { U: V(s.U), I1: A(s.I1), I2: A(s.I2), I: A(s.I) }, errors: { U: eV, I1: eA, I2: eA, I: eA }, ref: (p.R1 * p.R2) / (p.R1 + p.R2), display: [dV('Кернеу U', s.U), dA('R₁ тармағы I₁', s.I1), dA('R₂ тармағы I₂', s.I2), dA('Жалпы ток I', s.I)] };
    if (cfg === 4) return { ...base, values: { U: V(s.Ulamp), I: A(s.I), t: p.t }, errors: { U: eV, I: eA, t: 0.5 }, ref: s.P, display: [dV('Шамдағы кернеу U', s.Ulamp), dA('Ток күші I', s.I), { label: 'Уақыт t', text: `${fmt(p.t, 0)} с`, instrument: 'Секундомер' }] };
    return {
      ...base,
      hint: off ? 'Кілтті басып, тізбекті тұйықтаңыз' : 'Амперметрді тізбектің әр бөлігіне қосып (1, 2, 3), ток күшін жазыңыз',
      values: { pos: p.pos, I: A(s.I) }, errors: { pos: 0, I: eA }, ref: s.I,
      display: [dA(`Ток күші (${p.pos}-нүкте)`, s.I), { label: 'Амперметр орны', text: `${p.pos}-нүкте`, instrument: p.pos === 1 ? 'шамға дейін' : p.pos === 2 ? 'шам мен резистор арасы' : 'резистордан кейін' }],
    };
  }
}
