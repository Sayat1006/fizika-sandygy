import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clamp } from '../../engines/physics/core';
import { BENCH, type LensSim } from '../../engines/simulation/lens';
import { useLab } from '../../lib/store';
import { Link, useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const lensView: StageView = { camera: [0.05, 0.42, 1.05], target: [-0.02, 0.12, 0], table: [-0.9, 0.9] };

const LX = -0.12; // линзаның орны
const AX = 0.15; // оптикалық осьтің биіктігі
const SCR = 0.18; // экранның өлшемі
const PX = 256 / SCR;
const params = () => useLab.getState().params;
const set = (k: string, v: number) => useLab.getState().setParam(k, v);

function benchTexture() {
  const W = 4096, H = 96, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!; g.fillStyle = '#f4e7b8'; g.fillRect(0, 0, W, H);
  g.fillStyle = g.strokeStyle = '#1b1d23'; g.font = '600 30px Inter, system-ui, sans-serif'; g.textAlign = 'center';
  const x0 = -0.6, x1 = 0.58, px = (x: number) => ((x - x0) / (x1 - x0)) * W;
  for (let mm = Math.ceil((x0 - LX) * 1000); mm <= (x1 - LX) * 1000; mm += 5) {
    const x = px(LX + mm / 1000), major = mm % 50 === 0, mid = mm % 10 === 0;
    g.lineWidth = major ? 3 : 1.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, major ? 40 : mid ? 26 : 14); g.stroke();
    if (major) g.fillText(String(Math.abs(mm / 10)), x, 74);
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function Holder({ x, h = AX - 0.015 }: { x: number; h?: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.03, 0.02, 0.07]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, (h + 0.04) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.004, 0.004, h - 0.04, 12]} />
        <meshStandardMaterial color="#b9bec8" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

export default function LensScene({ sim }: { sim: LensSim }) {
  const candle = useRef<THREE.Group>(null);
  const screen = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  const vectors = useLab((s) => s.vectors);
  const bench = useMemo(benchTexture, []);
  useEffect(() => () => bench.dispose(), [bench]);
  const canvas = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 256; return c; }, []);
  const img = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t; }, [canvas]);
  useEffect(() => () => img.dispose(), [img]);
  const last = useRef('');

  const dragC = useDrag({ onDrag: (pt) => set('d', Math.round(clamp(LX - pt.x, BENCH.dMin, BENCH.dMax) * 1000) / 1000) });
  const dragS = useDrag({ onDrag: (pt) => set('f', Math.round(clamp(pt.x - LX, BENCH.fMin, BENCH.fMax) * 1000) / 1000) });

  useFrame(({ clock }) => {
    const p = params();
    if (candle.current) candle.current.position.x = LX - p.d;
    if (screen.current) screen.current.position.x = LX + p.f;
    const flick = 1 + Math.sin(clock.elapsedTime * 13) * 0.04 + Math.sin(clock.elapsedTime * 7.3) * 0.03;
    if (flame.current) flame.current.scale.set(1, flick, 1);
    // экрандағы кескін: параметрлер өзгергенде ғана қайта сызамыз
    const key = `${p.d}|${p.f}|${p.F}|${Math.round(flick * 20)}`;
    if (key === last.current) return;
    last.current = key;
    const im = sim.image(p), g = canvas.getContext('2d')!;
    g.filter = 'none'; g.fillStyle = '#f7f5ef'; g.fillRect(0, 0, 256, 256);
    if (im.real && isFinite(im.fi)) {
      // кескін төңкерілген: осьтен төмен қарай өседі
      const h = BENCH.objH * im.k * PX * flick, w = h * 0.42, cy = 128;
      const blurPx = Math.min(40, im.blur * PX);
      const alpha = clamp(1 / (1 + blurPx * 0.08), 0.15, 1) * clamp(1.6 / Math.max(im.k, 0.4), 0.35, 1);
      g.filter = `blur(${blurPx.toFixed(1)}px)`;
      g.globalAlpha = alpha;
      const grd = g.createRadialGradient(128, cy + h * 0.65, 1, 128, cy + h * 0.55, h * 0.6);
      grd.addColorStop(0, '#fffbe6'); grd.addColorStop(0.35, '#ffd25e'); grd.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = grd;
      g.beginPath(); g.moveTo(128, cy + h); g.quadraticCurveTo(128 + w, cy + h * 0.45, 128, cy + h * 0.05); g.quadraticCurveTo(128 - w, cy + h * 0.45, 128, cy + h); g.fill();
      g.globalAlpha = 1; g.filter = 'none';
    } else {
      const grd = g.createRadialGradient(128, 128, 4, 128, 128, 120);
      grd.addColorStop(0, 'rgba(255,214,120,0.35)'); grd.addColorStop(1, 'rgba(255,214,120,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    }
    img.needsUpdate = true;
  });

  const ray = (k: 0 | 1): [THREE.Vector3Tuple, THREE.Vector3Tuple][] => {
    const p = params(), top: THREE.Vector3Tuple = [LX - p.d, AX + BENCH.objH, 0.001];
    const im = sim.image(p);
    if (!im.real) return [];
    const imgPt: THREE.Vector3Tuple = [LX + im.fi, AX - BENCH.objH * im.k, 0.001];
    if (k === 0) return [[top, [LX, AX, 0.001]], [[LX, AX, 0.001], imgPt]];
    return [[top, [LX, AX + BENCH.objH, 0.001]], [[LX, AX + BENCH.objH, 0.001], imgPt]];
  };

  return (
    <group>
      {/* оптикалық орындық */}
      <mesh position={[-0.01, 0.012, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.18, 0.024, 0.06]} />
        <meshStandardMaterial color="#3a3f4c" roughness={0.45} metalness={0.5} />
      </mesh>
      <mesh position={[-0.01, 0.0125, 0.0305]}>
        <planeGeometry args={[1.18, 0.024]} />
        <meshBasicMaterial map={bench} toneMapped={false} />
      </mesh>
      {/* шам */}
      <group ref={candle} position={[LX - 0.25, 0, 0]}>
        <group {...dragC}>
          <Holder x={0} h={AX - 0.04} />
          <mesh position={[0, AX - 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.009, 0.009, 0.04, 20]} />
            <meshStandardMaterial color="#f3efe4" roughness={0.6} />
          </mesh>
          <mesh visible={false} position={[0, AX / 2, 0]}><boxGeometry args={[0.06, AX + 0.04, 0.08]} /></mesh>
        </group>
        <mesh ref={flame} position={[0, AX + 0.013, 0]}>
          <sphereGeometry args={[0.0075, 16, 12]} />
          <meshBasicMaterial color="#ffd25e" toneMapped={false} />
        </mesh>
        <mesh position={[0, AX + 0.02, 0]} scale={[0.7, 1.8, 0.7]}>
          <sphereGeometry args={[0.006, 14, 10]} />
          <meshBasicMaterial color="#fff3c4" toneMapped={false} transparent opacity={0.9} />
        </mesh>
        <pointLight position={[0, AX + 0.02, 0]} color="#ffbe55" intensity={0.25} distance={0.5} />
      </group>
      {/* линза */}
      <Holder x={LX} />
      <mesh position={[LX, AX, 0]} scale={[0.12, 1, 1]}>
        <sphereGeometry args={[0.045, 40, 24]} />
        <meshPhysicalMaterial color="#d8eefc" transmission={0.85} roughness={0.05} thickness={0.01} transparent opacity={0.55} />
      </mesh>
      <mesh position={[LX, AX, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.046, 0.003, 10, 40]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* экран */}
      <group ref={screen} position={[LX + 0.3, 0, 0]}>
        <group {...dragS}>
          <Holder x={0} h={AX - SCR / 2 + 0.01} />
          {/* экран оқушыға көрінуі үшін сәл бұрылған */}
          <group position={[0, AX, 0]} rotation={[0, 0.6, 0]}>
            <mesh position={[0.004, 0, 0]} castShadow>
              <boxGeometry args={[0.006, SCR + 0.012, SCR + 0.012]} />
              <meshStandardMaterial color="#2b2f3a" roughness={0.5} />
            </mesh>
            <mesh rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[SCR, SCR]} />
              <meshBasicMaterial map={img} toneMapped={false} />
            </mesh>
          </group>
          <mesh visible={false} position={[0, AX, 0]}><boxGeometry args={[0.06, SCR + 0.1, SCR + 0.04]} /></mesh>
        </group>
      </group>
      {vectors && (
        <>
          {[0, 1].flatMap((k) => [0, 1].map((j) => (
            <Link key={`${k}${j}`} r={0.0009} color={k ? '#E8703A' : '#DC5353'} get={() => { const r = ray(k as 0 | 1); return r[j] || [[0, 0, 0], [0, 0, 0]]; }} />
          )))}
          {/* фокустар */}
          {[-1, 1].map((s) => <FocusMark key={s} s={s} />)}
        </>
      )}
    </group>
  );
}

function FocusMark({ s }: { s: number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(() => { if (m.current) m.current.position.x = LX + s * params().F; });
  return (
    <mesh ref={m} position={[LX, AX, 0.002]}>
      <sphereGeometry args={[0.004, 12, 10]} />
      <meshBasicMaterial color="#4263EB" />
    </mesh>
  );
}
