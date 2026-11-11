/**
 * Мектеп физикасының орталықтандырылған формулалары (SI).
 * Әр функция кіріс мәндерін тексереді және физикалық мүмкін емес күйге жол бермейді.
 */
import { C_LIGHT, G, H_PLANCK, PhysicsError, R_GAS, divide, finite, nonNegative, positive } from './core';

// ───────────── Механика ─────────────
export const mechanics = {
  /** v = s / t */
  velocity: (s: number, t: number) => divide(finite(s, 's'), positive(t, 't'), 't'),
  /** a = (v − v0) / t */
  acceleration: (v: number, v0: number, t: number) => divide(finite(v, 'v') - finite(v0, 'v0'), positive(t, 't'), 't'),
  /** Тыныштықтан бірқалыпты үдемелі қозғалыс: a = 2s / t² */
  accelerationFromRest: (s: number, t: number) => (2 * nonNegative(s, 's')) / positive(t, 't') ** 2,
  /** s = v0·t + a·t²/2 */
  displacement: (v0: number, a: number, t: number) => finite(v0, 'v0') * nonNegative(t, 't') + (finite(a, 'a') * t * t) / 2,
  /** F = m·a */
  force: (m: number, a: number) => positive(m, 'm') * finite(a, 'a'),
  /** P = m·g */
  weight: (m: number, g = G) => nonNegative(m, 'm') * positive(g, 'g'),
  /** F_үйк = μ·N */
  friction: (mu: number, N: number) => nonNegative(mu, 'μ') * nonNegative(N, 'N'),
  /** μ = F_үйк / N */
  frictionCoefficient: (F: number, N: number) => divide(nonNegative(F, 'F'), positive(N, 'N'), 'N'),
  /** F_серп = k·x */
  spring: (k: number, x: number) => positive(k, 'k') * finite(x, 'x'),
  /** k = F / x */
  stiffness: (F: number, x: number) => divide(nonNegative(F, 'F'), positive(x, 'x'), 'x'),
  /** A = F·s */
  work: (F: number, s: number) => finite(F, 'F') * finite(s, 's'),
  /** P = A / t */
  power: (A: number, t: number) => divide(finite(A, 'A'), positive(t, 't'), 't'),
  /** Ek = m·v²/2 */
  kineticEnergy: (m: number, v: number) => (positive(m, 'm') * finite(v, 'v') ** 2) / 2,
  /** Ep = m·g·h */
  potentialEnergy: (m: number, h: number, g = G) => positive(m, 'm') * g * finite(h, 'h'),
  /** η = A_пайдалы / A_толық · 100% */
  efficiency: (useful: number, total: number) => {
    nonNegative(useful, 'A_пайдалы');
    positive(total, 'A_толық');
    if (useful > total * (1 + 1e-9)) throw new PhysicsError('Пайдалы жұмыс толық жұмыстан артық бола алмайды');
    return (useful / total) * 100;
  },
  /** Көлбеу жазықтықтың теориялық ПӘК-і: η = sinθ / (sinθ + μ·cosθ) · 100% */
  inclineEfficiency: (theta: number, mu: number) => {
    if (!(theta > 0 && theta < Math.PI / 2)) throw new PhysicsError('Көлбеулік бұрышы 0° пен 90° аралығында болуы керек');
    nonNegative(mu, 'μ');
    return (Math.sin(theta) / (Math.sin(theta) + mu * Math.cos(theta))) * 100;
  },
  /**
   * Көлбеу трек + блок арқылы асылған жүк жүйесінің үдеуі (треk бойымен төмен/блокқа қарай оң).
   * a = (M·g·sinθ + m·g − μ·M·g·cosθ) / (M + m); қозғаушы күш кедергіден аспаса a = 0.
   */
  cartAcceleration: (M: number, mHang: number, theta: number, mu: number, g = G) => {
    positive(M, 'M');
    nonNegative(mHang, 'm');
    nonNegative(mu, 'μ');
    const drive = M * g * Math.sin(theta) + mHang * g;
    const resist = mu * M * g * Math.cos(theta);
    return drive <= resist ? 0 : (drive - resist) / (M + mHang);
  },
};

// ───────────── Тығыздық және сұйықтар ─────────────
export const fluids = {
  /** ρ = m / V */
  density: (m: number, V: number) => divide(positive(m, 'm'), positive(V, 'V'), 'V'),
  /** F_A = ρ_с · g · V_ығ */
  buoyancy: (rhoLiquid: number, Vdisplaced: number, g = G) => positive(rhoLiquid, 'ρ') * g * nonNegative(Vdisplaced, 'V'),
  /** Дененің жүзу шарты: ρ_дене < ρ_сұйық */
  floats: (rhoBody: number, rhoLiquid: number) => positive(rhoBody, 'ρ_д') < positive(rhoLiquid, 'ρ_с'),
};

// ───────────── Жылу ─────────────
export const thermo = {
  /** Q = c·m·ΔT */
  heat: (c: number, m: number, dT: number) => positive(c, 'c') * positive(m, 'm') * finite(dT, 'ΔT'),
  /** Q = λ·m (балқу) немесе Q = L·m (булану) */
  latent: (lambda: number, m: number) => positive(lambda, 'λ') * nonNegative(m, 'm'),
  /** Жылулық тепе-теңдік температурасы (жылу шығыны жоқ): θ = (c1m1t1 + c2m2t2)/(c1m1 + c2m2) */
  mixTemperature: (c1: number, m1: number, t1: number, c2: number, m2: number, t2: number) =>
    (positive(c1, 'c1') * positive(m1, 'm1') * finite(t1, 't1') + positive(c2, 'c2') * positive(m2, 'm2') * finite(t2, 't2')) /
    (c1 * m1 + c2 * m2),
  /** pV = nRT  →  p */
  idealGasPressure: (n: number, T: number, V: number) => (positive(n, 'n') * R_GAS * positive(T, 'T')) / positive(V, 'V'),
};

// ───────────── Электр ─────────────
export const electricity = {
  /** I = U / R */
  current: (U: number, R: number) => divide(finite(U, 'U'), positive(R, 'R'), 'R'),
  /** U = I·R */
  voltage: (I: number, R: number) => finite(I, 'I') * nonNegative(R, 'R'),
  /** R = R1 + R2 + … */
  series: (rs: number[]) => {
    if (rs.length === 0) throw new PhysicsError('Кемінде бір кедергі қажет');
    return rs.reduce((sum, r) => sum + nonNegative(r, 'R'), 0);
  },
  /** 1/R = 1/R1 + 1/R2 + … */
  parallel: (rs: number[]) => {
    if (rs.length === 0) throw new PhysicsError('Кемінде бір кедергі қажет');
    if (rs.some((r) => nonNegative(r, 'R') === 0)) return 0; // қысқа тұйықталу
    return 1 / rs.reduce((sum, r) => sum + 1 / r, 0);
  },
  /** P = U·I */
  power: (U: number, I: number) => finite(U, 'U') * finite(I, 'I'),
  /** A = U·I·t */
  energy: (U: number, I: number, t: number) => finite(U, 'U') * finite(I, 'I') * nonNegative(t, 't'),
  /** Толық тізбек үшін Ом заңы: I = ε / (R + r) */
  fullCircuitCurrent: (emf: number, R: number, r: number) => divide(finite(emf, 'ε'), nonNegative(R, 'R') + nonNegative(r, 'r'), 'R + r'),
};

// ───────────── Оптика ─────────────
export const optics = {
  /** n = c / v */
  refractiveIndex: (v: number) => {
    positive(v, 'v');
    if (v > C_LIGHT) throw new PhysicsError('Ортадағы жарық жылдамдығы c-дан аспайды');
    return C_LIGHT / v;
  },
  /** Снеллиус заңы: n = sin α / sin β */
  snellIndex: (alpha: number, beta: number) => divide(Math.sin(finite(alpha, 'α')), Math.sin(positive(beta, 'β')), 'sin β'),
  /** 1/f = 1/d + 1/f'  →  f */
  focalLength: (dObject: number, dImage: number) => {
    const inv = 1 / positive(dObject, 'd') + divide(1, finite(dImage, "f'"), "f'");
    return divide(1, inv, '1/d + 1/f\'');
  },
  /** D = 1 / F */
  opticalPower: (f: number) => divide(1, finite(f, 'F'), 'F'),
};

// ───────────── Тербелістер мен толқындар ─────────────
export const waves = {
  /** T = 2π√(l/g) */
  pendulumPeriod: (l: number, g = G) => 2 * Math.PI * Math.sqrt(positive(l, 'l') / positive(g, 'g')),
  /** g = 4π²l / T² */
  gravityFromPendulum: (l: number, T: number) => (4 * Math.PI ** 2 * positive(l, 'l')) / positive(T, 'T') ** 2,
  /** ν = 1 / T */
  frequency: (T: number) => 1 / positive(T, 'T'),
  /** v = λ·ν */
  waveSpeed: (lambda: number, f: number) => positive(lambda, 'λ') * positive(f, 'ν'),
};

// ───────────── Электромагнетизм ─────────────
export const electromagnetism = {
  /** ε_инд = −ΔΦ / Δt */
  inducedEmf: (dPhi: number, dt: number) => -divide(finite(dPhi, 'ΔΦ'), positive(dt, 'Δt'), 'Δt'),
  /** U1/U2 = N1/N2  →  U2 */
  transformerSecondary: (U1: number, N1: number, N2: number) => (finite(U1, 'U1') * positive(N2, 'N2')) / positive(N1, 'N1'),
};

// ───────────── Қазіргі заман физикасы ─────────────
export const modern = {
  /** E = h·ν */
  photonEnergy: (f: number) => H_PLANCK * positive(f, 'ν'),
  /** N(t) = N0 · 2^(−t/T½) */
  decay: (N0: number, t: number, halfLife: number) => nonNegative(N0, 'N0') * 2 ** (-nonNegative(t, 't') / positive(halfLife, 'T½')),
};
