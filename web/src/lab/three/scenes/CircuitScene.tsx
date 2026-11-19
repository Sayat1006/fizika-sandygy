import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clamp } from '../../engines/physics/core';
import { AMMETER, VOLTMETER, type CircuitSim, type CircuitState, type Cfg } from '../../engines/simulation/circuit';
import { useLab } from '../../lib/store';
import { useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const circuitView: StageView = { camera: [0.0, 0.72, 0.92], target: [0, 0.0, 0.01] };

type V3 = [number, number, number];
const params = () => useLab.getState().params;
const set = (k: string, v: number) => useLab.getState().setParam(k, v);

// ───────────── Сымдар ─────────────
const WIRE_COLORS = ['#d63b3b', '#2f6fd6', '#2b2f3a', '#e0a526', '#2a9d6a'];
function Wire({ a, b, color, lift = 0.035 }: { a: V3; b: V3; color: string; lift?: number }) {
  const geo = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const d = A.distanceTo(B);
    const m1 = A.clone().lerp(B, 0.25).setY(Math.max(A.y, B.y) + lift + d * 0.08);
    const m2 = A.clone().lerp(B, 0.75).setY(Math.max(A.y, B.y) + lift + d * 0.08);
    const c = new THREE.CatmullRomCurve3([A, A.clone().setY(A.y + 0.012), m1, m2, B.clone().setY(B.y + 0.012), B]);
    return new THREE.TubeGeometry(c, 48, 0.0018, 6, false);
  }, [a, b, lift]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={0.45} />
    </mesh>
  );
}
function Terminal({ p, color = '#c9a227' }: { p: V3; color?: string }) {
  return (
    <mesh position={p}>
      <cylinderGeometry args={[0.0045, 0.0045, 0.008, 14]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
    </mesh>
  );
}

// ───────────── Аспаптар ─────────────
function Battery({ at, U }: { at: V3; U: number }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.028, 0]} castShadow>
        <boxGeometry args={[0.12, 0.056, 0.065]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.0565, 0]}>
        <boxGeometry args={[0.12, 0.002, 0.065]} />
        <meshStandardMaterial color="#e8703a" roughness={0.6} />
      </mesh>
      <Label at={[0, 0.058, 0.0]} text={`${String(U).replace('.', ',')} В`} w={0.05} rot />
      <Terminal p={[-0.04, 0.062, 0.02]} color="#d63b3b" />
      <Terminal p={[0.04, 0.062, 0.02]} color="#1b1d23" />
      <Label at={[-0.04, 0.058, -0.012]} text="+" w={0.014} rot />
      <Label at={[0.04, 0.058, -0.012]} text="−" w={0.014} rot />
    </group>
  );
}
const batT = (at: V3): [V3, V3] => [[at[0] - 0.04, at[1] + 0.066, at[2] + 0.02], [at[0] + 0.04, at[1] + 0.066, at[2] + 0.02]];

function Switch({ at }: { at: V3 }) {
  const arm = useRef<THREE.Group>(null);
  useFrame(() => {
    const on = params().sw > 0.5;
    if (arm.current) arm.current.rotation.z = THREE.MathUtils.lerp(arm.current.rotation.z, on ? 0 : 0.55, 0.25);
  });
  const toggle = (e: { stopPropagation: () => void }) => { e.stopPropagation(); set('sw', params().sw > 0.5 ? 0 : 1); };
  return (
    <group position={at}>
      <mesh position={[0, 0.006, 0]} castShadow receiveShadow onClick={toggle} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        <boxGeometry args={[0.09, 0.012, 0.04]} />
        <meshStandardMaterial color="#e9e4d8" roughness={0.6} />
      </mesh>
      <Terminal p={[-0.03, 0.016, 0]} />
      <Terminal p={[0.03, 0.016, 0]} />
      <group ref={arm} position={[-0.03, 0.022, 0]} rotation={[0, 0, 0.55]}>
        <mesh position={[0.03, 0, 0]} castShadow onClick={toggle}>
          <boxGeometry args={[0.064, 0.004, 0.008]} />
          <meshStandardMaterial color="#b9bec8" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0.066, 0.006, 0]} onClick={toggle}>
          <sphereGeometry args={[0.007, 14, 10]} />
          <meshStandardMaterial color="#1b1d23" roughness={0.4} />
        </mesh>
        {/* ұстауға жеңіл аймақ */}
        <mesh position={[0.03, 0, 0]} visible={false} onClick={toggle}><boxGeometry args={[0.09, 0.04, 0.05]} /></mesh>
      </group>
    </group>
  );
}
const swT = (at: V3): [V3, V3] => [[at[0] - 0.03, at[1] + 0.02, at[2]], [at[0] + 0.03, at[1] + 0.02, at[2]]];

const RH = { len: 0.17 };
function Rheostat({ at }: { at: V3 }) {
  const slider = useRef<THREE.Group>(null);
  const x0 = at[0] - RH.len / 2;
  const bind = useDrag({ onDrag: (pt) => set('rh', Math.round(clamp((pt.x - x0) / RH.len, 0, 1) * 50) / 50) });
  const coil = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 32;
    const g = c.getContext('2d')!; g.fillStyle = '#a8703f'; g.fillRect(0, 0, 512, 32);
    for (let i = 0; i < 512; i += 4) { g.fillStyle = '#d8b07a'; g.fillRect(i, 0, 2, 32); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  useFrame(() => { if (slider.current) slider.current.position.x = -RH.len / 2 + params().rh * RH.len; });
  return (
    <group position={at}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (RH.len / 2 + 0.012), 0.03, 0]} castShadow>
          <boxGeometry args={[0.014, 0.06, 0.04]} />
          <meshStandardMaterial color="#2b2f3a" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.032, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, RH.len, 28]} />
        <meshStandardMaterial map={coil} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0035, 0.0035, RH.len + 0.03, 10]} />
        <meshStandardMaterial color="#b9bec8" metalness={0.9} roughness={0.25} />
      </mesh>
      <group ref={slider}>
        <group {...bind}>
          <mesh position={[0, 0.07, 0]} castShadow>
            <boxGeometry args={[0.018, 0.016, 0.02]} />
            <meshStandardMaterial color="#1b1d23" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.052, 0]}>
            <boxGeometry args={[0.004, 0.024, 0.012]} />
            <meshStandardMaterial color="#b9bec8" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh visible={false} position={[0, 0.06, 0]}><boxGeometry args={[0.05, 0.06, 0.06]} /></mesh>
        </group>
      </group>
      <Terminal p={[-RH.len / 2 - 0.012, 0.064, 0.012]} />
      <Terminal p={[RH.len / 2 + 0.012, 0.081, 0]} />
    </group>
  );
}
const rhT = (at: V3): [V3, V3] => [[at[0] - RH.len / 2 - 0.012, at[1] + 0.068, at[2] + 0.012], [at[0] + RH.len / 2 + 0.012, at[1] + 0.085, at[2]]];

function Resistor({ at, R, name }: { at: V3; R: number; name: string }) {
  const bands = { 2: ['#d63b3b', '#1b1d23', '#c9a227'], 4: ['#e8a23a', '#1b1d23', '#c9a227'], 6: ['#2f6fd6', '#1b1d23', '#c9a227'], 8: ['#8a8f99', '#1b1d23', '#c9a227'] }[R] || ['#1b1d23'];
  return (
    <group position={at}>
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[0.1, 0.01, 0.04]} />
        <meshStandardMaterial color="#e9e4d8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.022, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0012, 0.0012, 0.07, 8]} />
        <meshStandardMaterial color="#b9bec8" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.022, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.034, 20]} />
        <meshStandardMaterial color="#e6d3a8" roughness={0.5} />
      </mesh>
      {bands.map((c, i) => (
        <mesh key={i} position={[-0.01 + i * 0.008, 0.022, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0083, 0.0083, 0.003, 20]} />
          <meshStandardMaterial color={c} roughness={0.5} />
        </mesh>
      ))}
      <Terminal p={[-0.038, 0.014, 0]} />
      <Terminal p={[0.038, 0.014, 0]} />
      <Label at={[0, 0.0105, 0.014]} text={`${name} = ${R} Ом`} w={0.06} rot />
    </group>
  );
}
const resT = (at: V3): [V3, V3] => [[at[0] - 0.038, at[1] + 0.018, at[2]], [at[0] + 0.038, at[1] + 0.018, at[2]]];

function Lamp({ at, sim }: { at: V3; sim: CircuitSim }) {
  const glass = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const fil = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const P = sim.state(params()).P, k = clamp(P / 2.2, 0, 1.2);
    if (glass.current) { glass.current.emissiveIntensity = k * 2.2; }
    if (light.current) light.current.intensity = k * 0.35;
    if (fil.current) fil.current.color.setRGB(0.3 + k, 0.25 + k * 0.7, 0.2 + k * 0.3);
  });
  return (
    <group position={at}>
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[0.08, 0.01, 0.05]} />
        <meshStandardMaterial color="#e9e4d8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.022, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.014, 0.024, 20]} />
        <meshStandardMaterial color="#b9bec8" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.02, 28, 20]} />
        <meshStandardMaterial ref={glass} color="#fff6d8" emissive="#ffcf6b" emissiveIntensity={0} transparent opacity={0.55} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[0.006, 0.0008, 6, 16]} />
        <meshBasicMaterial ref={fil} color="#5a4a3a" toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.06, 0]} color="#ffcf6b" intensity={0} distance={0.6} />
      <Terminal p={[-0.03, 0.014, 0]} />
      <Terminal p={[0.03, 0.014, 0]} />
    </group>
  );
}
const lampT = (at: V3): [V3, V3] => [[at[0] - 0.03, at[1] + 0.018, at[2]], [at[0] + 0.03, at[1] + 0.018, at[2]]];

/** Тілді аспап (амперметр/вольтметр): шкала, тіл, белгі */
function Meter({ at, kind, name, value }: { at: V3; kind: 'A' | 'V'; name: string; value: () => number }) {
  const needle = useRef<THREE.Group>(null);
  const max = kind === 'A' ? AMMETER.max : VOLTMETER.max;
  const tex = useMemo(() => meterFace(kind, name), [kind, name]);
  useEffect(() => () => tex.dispose(), [tex]);
  const A0 = 0.85; // ±50° шамасы
  useFrame(() => {
    if (!needle.current) return;
    const k = clamp(value() / max, 0, 1.04);
    const target = A0 - 2 * A0 * k;
    needle.current.rotation.z = THREE.MathUtils.lerp(needle.current.rotation.z, target, 0.18);
  });
  return (
    <group position={at} rotation={[-0.32, 0, 0]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.11, 0.1, 0.04]} />
        <meshStandardMaterial color={kind === 'A' ? '#3d59d9' : '#20A477'} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.055, 0.0202]}>
        <planeGeometry args={[0.096, 0.08]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <group ref={needle} position={[0, 0.026, 0.0215]} rotation={[0, 0, A0]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.0012, 0.06, 0.0006]} />
          <meshBasicMaterial color="#d6332f" />
        </mesh>
      </group>
      <mesh position={[0, 0.026, 0.0215]}>
        <circleGeometry args={[0.004, 16]} />
        <meshBasicMaterial color="#1b1d23" />
      </mesh>
      <Terminal p={[-0.035, 0.004, 0.026]} color="#d63b3b" />
      <Terminal p={[0.035, 0.004, 0.026]} color="#1b1d23" />
      <mesh position={[0, 0.002, 0.026]}>
        <boxGeometry args={[0.11, 0.004, 0.016]} />
        <meshStandardMaterial color="#2b2f3a" />
      </mesh>
    </group>
  );
}
/** Аспап қысқыштарының әлемдік координаталары (аспап X осінен −0,32 рад еңкейтілген) */
const meterT = (at: V3): [V3, V3] => {
  const y = 0.004, z = 0.026, c = Math.cos(-0.32), s = Math.sin(-0.32);
  const ry = y * c - z * s, rz = y * s + z * c;
  return [[at[0] - 0.035, at[1] + ry + 0.004, at[2] + rz], [at[0] + 0.035, at[1] + ry + 0.004, at[2] + rz]];
};

function meterFace(kind: 'A' | 'V', name: string) {
  const W = 480, H = 400, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.86, r = H * 0.66, A0 = 0.85;
  const max = kind === 'A' ? 2 : 6, minor = kind === 'A' ? 0.05 : 0.1, major = kind === 'A' ? 0.5 : 1;
  g.strokeStyle = g.fillStyle = '#1b1d23'; g.lineCap = 'round';
  g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2 - A0, -Math.PI / 2 + A0); g.stroke();
  g.font = '600 34px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const n = Math.round(max / minor);
  for (let i = 0; i <= n; i++) {
    const v = i * minor, a = -Math.PI / 2 - A0 + (2 * A0 * v) / max;
    const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6, isMid = Math.abs(v / (major / 2) - Math.round(v / (major / 2))) < 1e-6;
    const L = isMaj ? 30 : isMid ? 20 : 12;
    g.lineWidth = isMaj ? 3.5 : 2;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * (r - L), cy + Math.sin(a) * (r - L)); g.stroke();
    if (isMaj) g.fillText(String(v).replace('.', ','), cx + Math.cos(a) * (r - 56), cy + Math.sin(a) * (r - 56));
  }
  g.font = '800 64px Inter, system-ui, sans-serif'; g.fillStyle = kind === 'A' ? '#3d59d9' : '#20A477';
  g.fillText(kind, cx, cy - r * 0.42);
  if (name !== kind) { g.font = '700 32px Inter, system-ui, sans-serif'; g.fillText(name.slice(1), cx + 34, cy - r * 0.42 + 18); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Жазық мәтін белгісі (үстелге жатқызылған немесе тік) */
function Label({ at, text, w, rot }: { at: V3; text: string; w: number; rot?: boolean }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const g = c.getContext('2d')!; g.fillStyle = '#1b1d23'; g.font = '700 40px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = rot && /^[+−]$/.test(text) ? '#ffffff' : '#1b1d23';
    if (rot && /В$/.test(text)) g.fillStyle = '#ffffff';
    g.fillText(text, 128, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [text, rot]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={at} rotation={rot ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <planeGeometry args={[w, w / 4]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}
function Node({ p }: { p: V3 }) {
  return (
    <mesh position={p}>
      <sphereGeometry args={[0.005, 12, 10]} />
      <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.3} />
    </mesh>
  );
}

/** Тізбектің сұлбасы: аспаптардың орны мен сымдар (cfg бойынша) */
function useLayout(cfg: Cfg, pos: number) {
  return useMemo(() => {
    const BAT: V3 = [-0.38, 0, 0.12], SW: V3 = [-0.22, 0, 0.19], RHs: V3 = [0.3, 0, 0.16];
    const [bp, bm] = batT(BAT), [s1, s2] = swT(SW), [r1, r2] = rhT(RHs);
    const parts: { kind: 'R1' | 'R2' | 'lamp' | 'node'; at: V3 }[] = [];
    const meters: { kind: 'A' | 'V'; name: string; at: V3; key: keyof CircuitState }[] = [];
    const w: [V3, V3][] = [[bp, s1]];
    const row = -0.17;
    if (cfg === 1) {
      const R1: V3 = [0.08, 0, 0.0], A: V3 = [-0.16, 0, row], Vm: V3 = [0.1, 0, row];
      parts.push({ kind: 'R1', at: R1 }); meters.push({ kind: 'A', name: 'A', at: A, key: 'I' }, { kind: 'V', name: 'V', at: Vm, key: 'U' });
      const [a1, a2] = meterT(A), [x1, x2] = resT(R1), [v1, v2] = meterT(Vm);
      w.push([s2, a1], [a2, x1], [x2, r1], [r2, bm], [v1, x1], [v2, x2]);
    } else if (cfg === 2) {
      const R1: V3 = [-0.02, 0, 0.0], R2: V3 = [0.14, 0, 0.0], A: V3 = [-0.22, 0, row], V1: V3 = [-0.03, 0, row], V2: V3 = [0.15, 0, row];
      parts.push({ kind: 'R1', at: R1 }, { kind: 'R2', at: R2 });
      meters.push({ kind: 'A', name: 'A', at: A, key: 'I' }, { kind: 'V', name: 'V1', at: V1, key: 'U1' }, { kind: 'V', name: 'V2', at: V2, key: 'U2' });
      const [a1, a2] = meterT(A), [x1, x2] = resT(R1), [y1, y2] = resT(R2), [p1, p2] = meterT(V1), [q1, q2] = meterT(V2);
      w.push([s2, a1], [a2, x1], [x2, y1], [y2, r1], [r2, bm], [p1, x1], [p2, x2], [q1, y1], [q2, y2]);
    } else if (cfg === 3) {
      const R1: V3 = [0.06, 0, -0.03], R2: V3 = [0.06, 0, 0.07], N1: V3 = [-0.06, 0.006, 0.02], N2: V3 = [0.18, 0.006, 0.02];
      const A: V3 = [-0.27, 0, row], A1: V3 = [-0.1, 0, row], A2: V3 = [0.06, 0, row], Vm: V3 = [0.23, 0, row];
      parts.push({ kind: 'R1', at: R1 }, { kind: 'R2', at: R2 }, { kind: 'node', at: N1 }, { kind: 'node', at: N2 });
      meters.push({ kind: 'A', name: 'A', at: A, key: 'I' }, { kind: 'A', name: 'A1', at: A1, key: 'I1' }, { kind: 'A', name: 'A2', at: A2, key: 'I2' }, { kind: 'V', name: 'V', at: Vm, key: 'U' });
      const [a1, a2] = meterT(A), [b1, b2] = meterT(A1), [c1, c2] = meterT(A2), [v1, v2] = meterT(Vm), [x1, x2] = resT(R1), [y1, y2] = resT(R2);
      w.push([s2, a1], [a2, N1], [N1, b1], [b2, x1], [x2, N2], [N1, c1], [c2, y1], [y2, N2], [N2, r1], [r2, bm], [v1, N1], [v2, N2]);
    } else if (cfg === 4) {
      const L: V3 = [0.06, 0, 0.0], A: V3 = [-0.16, 0, row], Vm: V3 = [0.1, 0, row];
      parts.push({ kind: 'lamp', at: L }); meters.push({ kind: 'A', name: 'A', at: A, key: 'I' }, { kind: 'V', name: 'V', at: Vm, key: 'Ulamp' });
      const [a1, a2] = meterT(A), [l1, l2] = lampT(L), [v1, v2] = meterT(Vm);
      w.push([s2, a1], [a2, l1], [l2, r1], [r2, bm], [v1, l1], [v2, l2]);
    } else {
      // шам мен резистор тізбектей; амперметр 1, 2 немесе 3-нүктеде
      const L: V3 = [-0.06, 0, 0.0], R1: V3 = [0.13, 0, 0.0];
      const A: V3 = [pos === 1 ? -0.17 : pos === 2 ? 0.03 : 0.22, 0, row];
      parts.push({ kind: 'lamp', at: L }, { kind: 'R1', at: R1 }); meters.push({ kind: 'A', name: 'A', at: A, key: 'I' });
      const [a1, a2] = meterT(A), [l1, l2] = lampT(L), [x1, x2] = resT(R1);
      const chain: V3[][] = [[s2], [l1, l2], [x1, x2], [r1]];
      // амперметрді pos-тағы үзіліске қосамыз
      for (let i = 0; i < chain.length - 1; i++) {
        const from = chain[i][chain[i].length - 1], to = chain[i + 1][0];
        if (i === pos - 1) w.push([from, a1], [a2, to]); else w.push([from, to]);
      }
      w.push([r2, bm]);
    }
    return { BAT, SW, RHs, parts, meters, wires: w };
  }, [cfg, pos]);
}

export default function CircuitScene({ sim }: { sim: CircuitSim }) {
  const cfg = useLab((s) => s.params.cfg) as Cfg;
  const pos = useLab((s) => s.params.pos);
  const R1 = useLab((s) => s.params.R1);
  const R2 = useLab((s) => s.params.R2);
  const U0 = useLab((s) => s.params.U0);
  const L = useLayout(cfg, pos);
  return (
    <group>
      {/* монтаж тақтасы */}
      <mesh position={[0, 0.002, 0]} receiveShadow>
        <boxGeometry args={[0.92, 0.004, 0.52]} />
        <meshStandardMaterial color="#d9cfb8" roughness={0.8} />
      </mesh>
      <Battery at={L.BAT} U={U0} />
      <Switch at={L.SW} />
      <Rheostat at={L.RHs} />
      {L.parts.map((p, i) => p.kind === 'lamp' ? <Lamp key={i} at={p.at} sim={sim} />
        : p.kind === 'node' ? <Node key={i} p={p.at} />
        : <Resistor key={i} at={p.at} R={p.kind === 'R1' ? R1 : R2} name={cfg === 5 ? 'R' : p.kind === 'R1' ? 'R₁' : 'R₂'} />)}
      {L.meters.map((m) => <Meter key={m.name} at={m.at} kind={m.kind} name={m.name} value={() => sim.state(params())[m.key] as number} />)}
      {L.wires.map(([a, b], i) => <Wire key={`${cfg}-${pos}-${i}`} a={a} b={b} color={WIRE_COLORS[i % WIRE_COLORS.length]} />)}
    </group>
  );
}
