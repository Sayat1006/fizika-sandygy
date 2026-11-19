import { describe, expect, it } from 'vitest';
import { G } from '../physics/core';
import { CircuitSim } from './circuit';
import { LensSim } from './lens';
import { LeverSim } from './lever';
import { PendulumSim } from './pendulum';
import { RefractionSim } from './refraction';
import { FIXED_DT } from './types';

const run = (sim: { step: (dt: number, p: Record<string, number>) => unknown }, p: Record<string, number>, sec: number) => {
  for (let i = 0; i < sec / FIXED_DT; i++) sim.step(FIXED_DT, p);
};

describe('математикалық маятник', () => {
  it('кіші бұрышта период 2π√(L/g)', () => {
    const s = new PendulumSim(), p = { L: 0.5, N: 10 };
    s.th = 0.08; // ≈ 4,6°
    run(s, p, 0.3);
    s.action('count');
    run(s, p, 16);
    expect(s.phase).toBe('done');
    const T = 2 * Math.PI * Math.sqrt(p.L / G);
    expect(Math.abs(s.measured - 10 * T)).toBeLessThan(0.12); // реакция қателігі ±0,08 с
  });
});

describe('иіндік', () => {
  it('моменттер тең болса көлденең тұрады', () => {
    const s = new LeverSim(), p = { nL: 2, lL: 0.1, nR: 1, lR: 0.2 };
    s.phi = 0.15;
    run(s, p, 6);
    expect(Math.abs(s.phi)).toBeLessThan(0.01);
    expect(s.readings(p).canRecord).toBe(true);
  });
  it('теңсіз болса басым жаққа ауады', () => {
    const s = new LeverSim(), p = { nL: 2, lL: 0.15, nR: 1, lR: 0.2 };
    run(s, p, 3);
    expect(s.phi).toBeGreaterThan(0.1);
    expect(s.readings(p).canRecord).toBe(false);
  });
});

describe('тұрақты ток тізбегі', () => {
  const base = { sw: 1, rh: 0.5, U0: 4.5, R1: 4, R2: 6, t: 60, pos: 1 };
  const s = new CircuitSim();
  it('Ом заңы: U/I = R', () => {
    const st = s.state({ ...base, cfg: 1 });
    expect(st.U / st.I).toBeCloseTo(4, 6);
    expect(st.I).toBeCloseTo(4.5 / (4 + 5 + 0.5), 6);
  });
  it('тізбектей: U₁ + U₂ = U, R = R₁ + R₂', () => {
    const st = s.state({ ...base, cfg: 2 });
    expect(st.U1 + st.U2).toBeCloseTo(st.U, 9);
    expect(st.U / st.I).toBeCloseTo(10, 6);
  });
  it('параллель: I₁ + I₂ = I, R = R₁R₂/(R₁+R₂)', () => {
    const st = s.state({ ...base, cfg: 3 });
    expect(st.I1 + st.I2).toBeCloseTo(st.I, 9);
    expect(st.U / st.I).toBeCloseTo(2.4, 6);
  });
  it('кілт ажыратулы — ток жоқ', () => {
    expect(s.state({ ...base, cfg: 1, sw: 0 }).I).toBe(0);
    expect(s.readings({ ...base, cfg: 1, sw: 0 }).canRecord).toBe(false);
  });
  it('шамның қуаты P = UI', () => {
    const st = s.state({ ...base, cfg: 4 });
    expect(st.P).toBeCloseTo(st.Ulamp * st.I, 9);
    expect(st.P).toBeGreaterThan(0);
  });
});

describe('жұқа линза', () => {
  it('1/d + 1/f = 1/F болғанда кескін анық', () => {
    const s = new LensSim(), d = 0.25, F = 0.1, f = (d * F) / (d - F);
    expect(s.readings({ d, f, F }).canRecord).toBe(true);
    expect(s.readings({ d, f: f + 0.02, F }).canRecord).toBe(false);
    expect(s.image({ d: 0.08, f: 0.3, F }).real).toBe(false);
  });
});

describe('жарықтың сынуы', () => {
  it('sin α / sin β = n', () => {
    const s = new RefractionSim(), p = { alpha: 40, n: 1.52 };
    const b = s.beta(p);
    expect(Math.sin((40 * Math.PI) / 180) / Math.sin((b * Math.PI) / 180)).toBeCloseTo(1.52, 9);
    expect(b).toBeLessThan(40);
  });
});
