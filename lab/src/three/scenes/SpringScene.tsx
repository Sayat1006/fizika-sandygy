import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { G } from '../../engines/physics/core';
import { fmt } from '../../engines/physics/uncertainty';
import type { SpringSim } from '../../engines/simulation/spring';
import { WEIGHT_MASS } from '../../engines/simulation/types';
import { useLab } from '../../lib/store';
import { Arrow, Dynamometer, Helix, N2M, Ruler, Stand, WEIGHT_H, Weight, dynLength, useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const springView: StageView = { camera: [0.34, 0.42, 1.18], target: [0.08, 0.3, 0] };

const TOP = 0.62;
const HOOK = TOP - dynLength(0);
const L0 = 0.08;
const MAX = 4;
const params = () => useLab.getState().params;

function HangWeight({ i, sim }: { i: number; sim: SpringSim }) {
  const g = useRef<THREE.Group>(null);
  const drag = useRef<THREE.Vector3 | null>(null);
  const bind = useDrag({
    onStart: (pt) => (drag.current = pt.clone()),
    onDrag: (pt) => drag.current?.copy(pt),
    onEnd: (pt) => {
      drag.current = null;
      const n = params().n;
      const attached = i < n;
      const nearHook = Math.abs(pt.x) < 0.07 && pt.y > 0.03;
      if (!attached && nearHook && n < MAX) useLab.getState().setParam('n', n + 1);
      if (attached && !nearHook) useLab.getState().setParam('n', n - 1);
    },
  });
  useFrame(() => {
    if (!g.current) return;
    const p = g.current.position;
    if (drag.current) {
      p.set(drag.current.x, drag.current.y - 0.015, 0);
      return;
    }
    const n = params().n;
    if (i < n) {
      const y = HOOK - L0 - sim.x - (i + 1) * WEIGHT_H - 0.004;
      if (Math.hypot(p.x, p.y - y) > 0.004) p.lerp(new THREE.Vector3(0, y, 0), 0.3);
      else p.set(0, y, 0);
    } else {
      p.lerp(new THREE.Vector3(0.24 + (i - n) * 0.055, 0, 0.02), 0.25);
    }
  });
  return (
    <group ref={g} position={[0.24 + i * 0.055, 0, 0.02]}>
      <Weight {...bind} />
    </group>
  );
}

export default function SpringScene({ sim }: { sim: SpringSim }) {
  const k = useLab((s) => s.params.k);
  const vectors = useLab((s) => s.vectors);
  const marker = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (marker.current) marker.current.position.y = HOOK - L0 - sim.x;
  });
  const color = k <= 25 ? '#b9bec8' : k <= 40 ? '#8f97a6' : '#5f6675';
  return (
    <group>
      <Stand x={-0.13} height={0.72} armY={() => TOP + 0.002} />
      <group position={[0, TOP, 0]}>
        <Dynamometer force={() => params().k * sim.x} stretch={false} />
      </group>
      <group position={[0, HOOK, 0]}>
        <Helix key={k} length={() => L0 + sim.x} color={color} wire={k <= 25 ? 0.0009 : k <= 40 ? 0.0011 : 0.0014} />
      </group>
      {/* серіппе ұшындағы көрсеткіш */}
      <mesh ref={marker} position={[0.022, HOOK - L0, 0]}>
        <boxGeometry args={[0.044, 0.0014, 0.002]} />
        <meshBasicMaterial color="#dc3545" />
      </mesh>
      <group position={[0.036, HOOK - L0, -0.004]}>
        <Ruler length={0.3} />
      </group>
      {Array.from({ length: MAX }, (_, i) => (
        <HangWeight key={i} i={i} sim={sim} />
      ))}
      {vectors && (
        <>
          <Arrow
            name="Серпімділік күші"
            color="#20A477"
            get={() => {
              const F = params().k * sim.x;
              return F > 0.02 ? { o: [-0.04, HOOK - L0 - sim.x, 0], v: [0, F * N2M, 0], text: `F серп = ${fmt(F, 2)} Н` } : null;
            }}
          />
          <Arrow
            name="Ауырлық күші"
            color="#DC5353"
            get={() => {
              const P = params().n * WEIGHT_MASS * G;
              return P > 0 ? { o: [-0.04, HOOK - L0 - sim.x, 0], v: [0, -P * N2M, 0], text: `mg = ${fmt(P, 2)} Н` } : null;
            }}
          />
        </>
      )}
    </group>
  );
}
