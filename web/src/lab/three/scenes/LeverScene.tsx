import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { G } from '../../engines/physics/core';
import { fmt } from '../../engines/physics/uncertainty';
import { LEVER, type LeverSim } from '../../engines/simulation/lever';
import { WEIGHT_MASS } from '../../engines/simulation/types';
import { useLab } from '../../lib/store';
import { Arrow, N2M, WEIGHT_H, Weight, useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const leverView: StageView = { camera: [0.05, 0.42, 1.05], target: [0, 0.3, 0] };

const PIV = 0.42; // тірек осінің биіктігі
const MAX = 4; // әр жаққа
const HOLES = [0.05, 0.1, 0.15, 0.2];
const params = () => useLab.getState().params;
const set = (k: string, v: number) => useLab.getState().setParam(k, v);

function HangWeight({ i, sim }: { i: number; sim: LeverSim }) {
  const g = useRef<THREE.Group>(null);
  const drag = useRef<THREE.Vector3 | null>(null);
  // i < 4 — сол жақтың жүктері, i ≥ 4 — оң жақтың
  const side = i < MAX ? 'L' : 'R', k = i % MAX;
  const bind = useDrag({
    onStart: (pt) => (drag.current = pt.clone()),
    onDrag: (pt) => drag.current?.copy(pt),
    onEnd: (pt) => {
      drag.current = null;
      const p = params();
      const n = side === 'L' ? p.nL : p.nR;
      const attached = k < n;
      // ең жақын тесік
      const hole = HOLES.reduce((a, h) => (Math.abs(Math.abs(pt.x) - h) < Math.abs(Math.abs(pt.x) - a) ? h : a), HOLES[0]);
      const near = pt.y > PIV - 0.2 && pt.y < PIV + 0.08 && Math.abs(Math.abs(pt.x) - hole) < 0.03;
      const target = pt.x < 0 ? 'L' : 'R';
      if (attached) set(side === 'L' ? 'nL' : 'nR', n - 1);
      if (near) {
        const cur = params();
        const tn = target === 'L' ? cur.nL : cur.nR;
        if (tn < MAX) { set(target === 'L' ? 'nL' : 'nR', tn + 1); set(target === 'L' ? 'lL' : 'lR', hole); }
      }
    },
  });
  useFrame(() => {
    if (!g.current) return;
    const p = g.current.position;
    if (drag.current) { p.set(drag.current.x, drag.current.y - 0.03, 0); return; }
    const pr = params();
    const n = side === 'L' ? pr.nL : pr.nR, l = side === 'L' ? pr.lL : pr.lR;
    let to: THREE.Vector3;
    if (k < n) {
      const x = side === 'L' ? -l : l;
      const top = barPoint(sim.phi, x);
      to = new THREE.Vector3(top.x, top.y - 0.03 - (k + 1) * WEIGHT_H, 0);
    } else {
      // үстелдегі қор: сол жақтікі солда, оң жақтікі оңда
      const order = k - n;
      to = new THREE.Vector3((side === 'L' ? -1 : 1) * (0.25 + order * 0.042), 0, 0.15);
    }
    if (p.distanceTo(to) > 0.003) p.lerp(to, 0.3); else p.copy(to);
  });
  return (
    <group ref={g} position={[(side === 'L' ? -1 : 1) * (0.25 + k * 0.042), 0, 0.15]}>
      <Weight {...bind} color={side === 'L' ? '#c79a3b' : '#b0883a'} />
    </group>
  );
}

/** Иіндік бойындағы нүкте (x — тіректен, оң жақ оң) */
function barPoint(phi: number, x: number) {
  // φ > 0 — сол жақ төмен: оң жақ көтеріледі
  return new THREE.Vector3(x * Math.cos(phi), PIV + x * Math.sin(phi), 0);
}

export default function LeverScene({ sim }: { sim: LeverSim }) {
  const bar = useRef<THREE.Group>(null);
  const vectors = useLab((s) => s.vectors);
  const hooks = useRef<THREE.Group>(null);
  useFrame(() => { if (bar.current) bar.current.rotation.z = sim.phi; });
  return (
    <group>
      {/* штатив: табан және тірек */}
      <mesh position={[0, 0.008, -0.04]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.016, 0.12]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, PIV / 2, -0.04]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, PIV + 0.02, 16]} />
        <meshStandardMaterial color="#b9bec8" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, PIV, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.05, 12]} />
        <meshStandardMaterial color="#8a8f99" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* иіндік */}
      <group ref={bar} position={[0, PIV, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2 * LEVER.half + 0.04, 0.026, 0.01]} />
          <meshStandardMaterial color="#e2c58f" roughness={0.55} />
        </mesh>
        {/* тепе-теңдік көрсеткіші */}
        <mesh position={[0, 0.045, 0]}>
          <coneGeometry args={[0.006, 0.05, 12]} />
          <meshStandardMaterial color="#dc3545" />
        </mesh>
        <group ref={hooks}>
          {[...HOLES.map((h) => -h), ...HOLES].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0, 0.0055]}>
                <circleGeometry args={[0.0035, 16]} />
                <meshBasicMaterial color="#3a3d45" />
              </mesh>
              <mesh position={[0, -0.022, 0.006]}>
                <torusGeometry args={[0.004, 0.001, 6, 12]} />
                <meshStandardMaterial color="#8a8f99" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}
          {[-0.2, -0.15, -0.1, -0.05, 0.05, 0.1, 0.15, 0.2].map((x) => <TagNum key={x} x={x} />)}
        </group>
      </group>
      {/* тепе-теңдік деңгейі (тірекке бекітілген шкала) */}
      <mesh position={[0, PIV + 0.075, -0.035]}>
        <boxGeometry args={[0.06, 0.03, 0.004]} />
        <meshStandardMaterial color="#f4f2ee" />
      </mesh>
      <mesh position={[0, PIV + 0.075, -0.032]}>
        <boxGeometry args={[0.0015, 0.03, 0.001]} />
        <meshBasicMaterial color="#20A477" />
      </mesh>
      {Array.from({ length: MAX * 2 }, (_, i) => <HangWeight key={i} i={i} sim={sim} />)}
      {vectors && (
        <>
          <Arrow name="F₁" color="#DC5353" get={() => { const p = params(); if (!p.nL) return null; const a = barPoint(sim.phi, -p.lL); const F = p.nL * WEIGHT_MASS * G; return { o: [a.x, a.y, 0.03], v: [0, -F * N2M, 0], text: `F₁ = ${fmt(F, 2)} Н` }; }} />
          <Arrow name="F₂" color="#4263EB" get={() => { const p = params(); if (!p.nR) return null; const a = barPoint(sim.phi, p.lR); const F = p.nR * WEIGHT_MASS * G; return { o: [a.x, a.y, 0.03], v: [0, -F * N2M, 0], text: `F₂ = ${fmt(F, 2)} Н` }; }} />
        </>
      )}
    </group>
  );
}

function TagNum({ x }: { x: number }) {
  return (
    <mesh position={[x, 0.008, 0.0056]}>
      <planeGeometry args={[0.016, 0.009]} />
      <meshBasicMaterial map={numTex(Math.round(Math.abs(x) * 100))} transparent toneMapped={false} />
    </mesh>
  );
}
const TEX = new Map<number, THREE.CanvasTexture>();
function numTex(n: number) {
  if (TEX.has(n)) return TEX.get(n)!;
  const c = document.createElement('canvas'); c.width = 64; c.height = 36;
  const g = c.getContext('2d')!; g.fillStyle = '#1b1d23'; g.font = '700 28px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 32, 19);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TEX.set(n, t); return t;
}
