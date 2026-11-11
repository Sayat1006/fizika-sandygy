import { describe, expect, it } from 'vitest';
import { G, PhysicsError } from './core';
import { electricity, electromagnetism, fluids, mechanics, modern, optics, thermo, waves } from './formulas';
import {
  INSTRUMENTS,
  fitLinear,
  fitThroughOrigin,
  meanAbsDeviation,
  percentDeviation,
  read,
  relativeErrorOfProduct,
  roundWithError,
} from './uncertainty';
import { BuoyancySim, BODIES, VESSEL } from '../simulation/buoyancy';
import { PullSim } from '../simulation/pull';
import { SpringSim } from '../simulation/spring';
import { TrackSim } from '../simulation/track';
import { FIXED_DT, type Params, type Simulation } from '../simulation/types';

const run = (sim: Simulation, p: Params, seconds: number) => {
  for (let i = 0; i < seconds / FIXED_DT; i++) Object.assign(p, sim.step(FIXED_DT, p) ?? {});
};

describe('механика формулалары', () => {
  it('v = s/t, a = (v−v0)/t, F = ma', () => {
    expect(mechanics.velocity(100, 20)).toBe(5);
    expect(mechanics.acceleration(20, 5, 3)).toBe(5);
    expect(mechanics.force(2, 3)).toBe(6);
    expect(mechanics.accelerationFromRest(1, 2)).toBe(0.5);
    expect(mechanics.displacement(2, 4, 3)).toBe(24);
  });
  it('үйкеліс, серпімділік, жұмыс, қуат, энергия', () => {
    expect(mechanics.friction(0.3, 10)).toBeCloseTo(3);
    expect(mechanics.frictionCoefficient(3, 10)).toBeCloseTo(0.3);
    expect(mechanics.spring(40, 0.05)).toBeCloseTo(2);
    expect(mechanics.stiffness(2, 0.05)).toBeCloseTo(40);
    expect(mechanics.work(5, 2)).toBe(10);
    expect(mechanics.power(100, 4)).toBe(25);
    expect(mechanics.kineticEnergy(2, 3)).toBe(9);
    expect(mechanics.potentialEnergy(1, 10, 10)).toBe(100);
    expect(mechanics.efficiency(75, 100)).toBe(75);
  });
  it('көлбеу жазықтық ПӘК-і: 30°, μ = 0,2 → 74,27 %', () => {
    expect(mechanics.inclineEfficiency(Math.PI / 6, 0.2)).toBeCloseTo(74.27, 2);
    expect(mechanics.inclineEfficiency(Math.PI / 6, 0)).toBeCloseTo(100);
  });
  it('арбаша үдеуі: Атвуд тәрізді жүйе және көлбеу трек', () => {
    // M = 0,45 кг, m = 0,05 кг, үйкеліссіз: a = mg/(M+m) = g/10
    expect(mechanics.cartAcceleration(0.45, 0.05, 0, 0)).toBeCloseTo(G / 10, 10);
    expect(mechanics.cartAcceleration(0.5, 0, Math.PI / 6, 0)).toBeCloseTo(G / 2, 10);
    expect(mechanics.cartAcceleration(1, 0.001, 0, 0.5)).toBe(0); // қозғалмайды
  });
  it('қате кіріс мәндерін қабылдамайды', () => {
    expect(() => mechanics.velocity(1, 0)).toThrow(PhysicsError);
    expect(() => mechanics.force(-1, 2)).toThrow(PhysicsError);
    expect(() => mechanics.stiffness(1, 0)).toThrow(PhysicsError);
    expect(() => mechanics.efficiency(120, 100)).toThrow(PhysicsError);
    expect(() => mechanics.velocity(NaN, 1)).toThrow(PhysicsError);
  });
});

describe('басқа бөлімдердің формулалары', () => {
  it('тығыздық және Архимед күші', () => {
    expect(fluids.density(0.27, 1e-4)).toBeCloseTo(2700);
    expect(fluids.buoyancy(1000, 1e-4)).toBeCloseTo(0.980665, 6);
    expect(fluids.floats(900, 1000)).toBe(true);
    expect(() => fluids.density(1, 0)).toThrow(PhysicsError);
  });
  it('жылу', () => {
    expect(thermo.heat(4200, 0.5, 20)).toBe(42000);
    expect(thermo.latent(3.3e5, 0.1)).toBeCloseTo(33000);
    expect(thermo.mixTemperature(4200, 0.1, 80, 4200, 0.1, 20)).toBeCloseTo(50);
    expect(thermo.idealGasPressure(1, 273.15, 0.022414)).toBeCloseTo(101325, -3);
  });
  it('электр', () => {
    expect(electricity.current(12, 4)).toBe(3);
    expect(electricity.voltage(2, 5)).toBe(10);
    expect(electricity.series([1, 2, 3])).toBe(6);
    expect(electricity.parallel([6, 3])).toBeCloseTo(2);
    expect(electricity.parallel([5, 0])).toBe(0);
    expect(electricity.power(12, 2)).toBe(24);
    expect(electricity.energy(12, 2, 60)).toBe(1440);
    expect(electricity.fullCircuitCurrent(4.5, 8, 1)).toBeCloseTo(0.5);
    expect(() => electricity.current(1, 0)).toThrow(PhysicsError);
    expect(() => electricity.fullCircuitCurrent(1, 0, 0)).toThrow(PhysicsError);
  });
  it('оптика', () => {
    expect(optics.refractiveIndex(2e8)).toBeCloseTo(1.499, 3);
    expect(optics.snellIndex(Math.PI / 3, Math.asin(Math.sin(Math.PI / 3) / 1.5))).toBeCloseTo(1.5);
    expect(optics.focalLength(0.3, 0.15)).toBeCloseTo(0.1);
    expect(optics.opticalPower(0.1)).toBeCloseTo(10);
    expect(() => optics.refractiveIndex(4e8)).toThrow(PhysicsError);
  });
  it('тербелістер, электромагнетизм, кванттық физика', () => {
    expect(waves.pendulumPeriod(1)).toBeCloseTo(2.00641, 4);
    expect(waves.gravityFromPendulum(1, waves.pendulumPeriod(1))).toBeCloseTo(G, 8);
    expect(waves.frequency(0.5)).toBe(2);
    expect(waves.waveSpeed(0.5, 4)).toBe(2);
    expect(electromagnetism.inducedEmf(0.02, 0.1)).toBeCloseTo(-0.2);
    expect(electromagnetism.transformerSecondary(220, 1000, 50)).toBeCloseTo(11);
    expect(modern.photonEnergy(5e14)).toBeCloseTo(3.313e-19, 22);
    expect(modern.decay(1000, 20, 10)).toBeCloseTo(250);
  });
});

describe('өлшеу және қателік', () => {
  it('құрал бөлік құнына дейін дөңгелектейді', () => {
    expect(read(INSTRUMENTS.dynamometer, 0.9807)).toBe(1.0);
    expect(read(INSTRUMENTS.ruler, 0.02452)).toBe(0.025);
    expect(read(INSTRUMENTS.stopwatch, 1.2349)).toBe(1.23);
  });
  it('салыстырмалы қателіктер қосылады', () => {
    expect(relativeErrorOfProduct([{ value: 2, abs: 0.05 }, { value: 0.05, abs: 0.0005 }])).toBeCloseTo(0.035);
    expect(relativeErrorOfProduct([{ value: 2, abs: 0.01, power: 2 }])).toBeCloseTo(0.01);
  });
  it('орташа абсолют ауытқу және пайыздық ауытқу', () => {
    expect(meanAbsDeviation([9, 10, 11])).toBeCloseTo(2 / 3);
    expect(percentDeviation(9.5, 10)).toBeCloseTo(5);
  });
  it('нәтижені қателікпен дөңгелектеу', () => {
    expect(roundWithError(39.8734, 1.37).text).toBe('39,9 ± 1,4');
    expect(roundWithError(39.8734, 2.6).text).toBe('40 ± 3');
    expect(roundWithError(0.25349, 0.0123).text).toBe('0,253 ± 0,012');
    expect(roundWithError(1234.5, 96).text).toBe('1230 ± 100');
  });
  it('регрессия', () => {
    const o = fitThroughOrigin([1, 2, 3], [2, 4, 6]);
    expect(o.slope).toBeCloseTo(2);
    expect(o.r2).toBeCloseTo(1);
    const l = fitLinear([0, 1, 2], [1, 3, 5]);
    expect(l.slope).toBeCloseTo(2);
    expect(l.intercept).toBeCloseTo(1);
    expect(() => fitLinear([1, 1], [1, 2])).toThrow(PhysicsError);
  });
});

describe('симуляциялар тәуелсіз есептелген мәндермен сәйкес келеді', () => {
  it('серіппе: тепе-теңдікте x = mg/k', () => {
    const sim = new SpringSim();
    const p = { k: 40, n: 3 };
    run(sim, p, 12);
    expect(sim.x).toBeCloseTo((0.3 * G) / 40, 4);
    const r = sim.readings(p);
    expect(r.canRecord).toBe(true);
    expect(r.values.F).toBe(2.9);
    expect(r.values.x).toBe(0.074);
  });
  it('үйкеліс: бірқалыпты тартқанда F = μ·m·g', () => {
    const sim = new PullSim();
    const p: Params = { mu: 0.3, n: 2, angle: 0, hand: 0.1 };
    sim.reset(p);
    sim.action('auto');
    run(sim, p, 5);
    expect(sim.v).toBeCloseTo(0.05, 2);
    expect(sim.F).toBeCloseTo(0.3 * 0.3 * G, 1);
    expect(sim.readings(p).canRecord).toBe(true);
    expect(sim.readings(p).values.F).toBe(0.9);
  });
  it('үйкеліс: тыныштық үйкелісі денені ұстап тұрады', () => {
    const sim = new PullSim();
    const p: Params = { mu: 0.4, n: 1, angle: 0, hand: 0.1 };
    sim.reset(p);
    p.hand = 0.105; // F = 0,5 Н < μ_т·N = 0,82 Н
    run(sim, p, 6);
    expect(sim.s).toBe(0.1);
    expect(sim.F).toBeCloseTo(0.5, 2);
  });
  it('көлбеу жазықтық: F = mg(sinθ + μcosθ)', () => {
    const sim = new PullSim();
    const p: Params = { mu: 0.2, n: 2, angle: 30, hand: 0.1 };
    sim.reset(p);
    sim.action('auto');
    run(sim, p, 5);
    const th = Math.PI / 6;
    expect(sim.F).toBeCloseTo(0.3 * G * (Math.sin(th) + 0.2 * Math.cos(th)), 1);
    expect(sim.readings(p).ref).toBeCloseTo(74.27, 2);
  });
  it('Архимед: толық батқанда F_A = ρgV және деңгей V-ға көтеріледі', () => {
    const sim = new BuoyancySim();
    const p: Params = { body: 0, liquid: 0, holder: 0.3 };
    sim.reset(p);
    run(sim, p, 1);
    expect(sim.P0).toBe(2.6); // 2700·1e-4·g = 2,648 Н → 2,6
    p.holder = 0.01;
    run(sim, p, 4);
    const st = sim.state(p);
    expect(st.Vsub).toBeCloseTo(BODIES[0].V, 9);
    expect(st.FA).toBeCloseTo(1000 * G * 1e-4, 6);
    expect(st.level * VESSEL.area).toBeCloseTo(VESSEL.V0 + 1e-4, 9);
    const r = sim.readings(p);
    expect(r.values.V).toBeCloseTo(100e-6, 9);
    expect(r.values.P1).toBe(1.7);
    expect(r.canRecord).toBe(true);
  });
  it('Архимед: жартылай батқанда көлем сақталады', () => {
    const sim = new BuoyancySim();
    const p: Params = { body: 1, liquid: 2, holder: 0.07 };
    sim.y = 0.07;
    const st = sim.state(p);
    // сұйық көлемі + батқан бөлік = деңгей · аудан
    expect(st.level * VESSEL.area).toBeCloseTo(VESSEL.V0 + st.Vsub, 12);
    expect(st.level - 0.07).toBeCloseTo(st.d, 12);
  });
  it('арбаша: t = √(2s/a), масса өзгерсе үдеу өзгереді', () => {
    const sim = new TrackSim();
    const p: Params = { M: 0.45, mh: 0.05, angle: 0, mu: 0, start: 0.8 };
    sim.action('release', p);
    run(sim, p, 3);
    const a = G / 10;
    expect(sim.phase).toBe('done');
    expect(sim.tFinish).toBeCloseTo(Math.sqrt((2 * 0.8) / a), 6);
    expect(sim.v).toBeCloseTo(Math.sqrt(2 * a * 0.8), 6);
    const heavy: Params = { ...p, M: 0.95 };
    const sim2 = new TrackSim();
    sim2.action('release', heavy);
    run(sim2, heavy, 4);
    expect(sim2.tFinish).toBeCloseTo(Math.sqrt((2 * 0.8) / (G / 20)), 6);
    expect(sim2.tFinish).toBeGreaterThan(sim.tFinish);
  });
});

describe('қолмен тарту (тышқан қозғалысы біркелкі емес)', () => {
  it('секірмелі нысана кезінде де көрсету μN маңында тұрақталады', () => {
    const sim = new PullSim();
    const p: Params = { mu: 0.3, n: 1, angle: 0, hand: 0.1 };
    sim.reset(p);
    let ok = 0;
    let total = 0;
    let sumF = 0;
    for (let i = 0; i < 6 / FIXED_DT; i++) {
      if (i % 24 === 0) p.hand = Math.min(0.7, p.hand + 0.003 * (1 + 0.6 * Math.sin(i))); // ≈25 Гц, біркелкі емес қадам
      sim.step(FIXED_DT, p);
      if (i > 2 / FIXED_DT && sim.s < 0.6) {
        total++;
        sumF += sim.F;
        if (sim.readings(p).canRecord) ok++;
      }
    }
    expect(sumF / total).toBeCloseTo(0.3 * 0.2 * G, 1);
    expect(ok / total).toBeGreaterThan(0.8);
  });
});
