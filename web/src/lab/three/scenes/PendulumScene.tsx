import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { G, clamp } from '../../engines/physics/core';
import { fmt } from '../../engines/physics/uncertainty';
import type { PendulumSim } from '../../engines/simulation/pendulum';
import { useLab } from '../../lib/store';
import { Arrow, Link, Ruler, Stand, Tag, useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const pendulumView: StageView = { camera: [0.3, 0.52, 1.6], target: [0.02, 0.45, 0] };

const P = 0.86; // ілу нүктесінің биіктігі
const BOB = 0.014;
const params = () => useLab.getState().params;

export default function PendulumScene({ sim }: { sim: PendulumSim }) {
  const bob = useRef<THREE.Group>(null);
  const L = useLab((s) => s.params.L);
  const vectors = useLab((s) => s.vectors);
  const pos = (): [number, number, number] => { const l = params().L; return [l * Math.sin(sim.th), P - l * Math.cos(sim.th), 0]; };
  const bind = useDrag({
    onDrag: (pt) => { sim.hold = clamp(Math.atan2(pt.x, P - pt.y), -0.6, 0.6); },
    onEnd: () => { sim.hold = null; },
  });
  useFrame(() => { if (bob.current) bob.current.position.set(...pos()); });
  return (
    <group>
      <Stand x={-0.16} height={0.92} armY={() => P} armTo={0.02} />
      {/* ілгек */}
      <mesh position={[0, P - 0.004, 0]}>
        <boxGeometry args={[0.014, 0.008, 0.014]} />
        <meshStandardMaterial color="#2b2f3a" metalness={0.4} roughness={0.5} />
      </mesh>
      <Link get={() => [[0, P, 0], pos()]} r={0.0006} color="#e8e4da" />
      <group ref={bob}>
        <mesh castShadow {...bind}>
          <sphereGeometry args={[BOB, 32, 20]} />
          <meshStandardMaterial color="#c0392b" metalness={0.35} roughness={0.3} />
        </mesh>
        <mesh visible={false} {...bind}><sphereGeometry args={[0.04, 8, 8]} /></mesh>
      </group>
      {/* тік сызғыш: жіп ұзындығын көрсетеді */}
      <group position={[0.05, P, -0.03]}>
        <Ruler length={0.8} />
      </group>
      {/* тепе-теңдік сызығы (бос) және L белгісі */}
      <mesh position={[0.045, P - L, -0.028]}>
        <boxGeometry args={[0.04, 0.0014, 0.001]} />
        <meshBasicMaterial color="#dc3545" />
      </mesh>
      {/* секундомер */}
      <group position={[0.3, 0.035, 0.12]} rotation={[-0.5, -0.35, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.014, 32]} />
          <meshStandardMaterial color="#2b2f3a" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.042, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.014, 12]} />
          <meshStandardMaterial color="#b9bec8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <Tag position={[0.3, 0.1, 0.12]} className="scene-tag" text={() => {
        const shown = sim.phase === 'running' ? sim.t - sim.tStart : sim.measured;
        return `⏱ ${fmt(Math.max(0, shown), 2)} с${sim.phase === 'running' ? ` · ${sim.count}/${params().N}` : ''}`;
      }} />
      {vectors && (
        <>
          <Arrow name="Ауырлық күші" color="#DC5353" get={() => { const [x, y] = pos(); return { o: [x, y, 0.02], v: [0, -0.06, 0], text: 'mg' }; }} />
          <Arrow name="Керілу күші" color="#20A477" get={() => {
            const [x, y] = pos(), l = params().L, Tn = Math.cos(sim.th) + (sim.w * sim.w * l) / G; // T/mg
            return { o: [x, y, 0.02], v: [(-x / l) * 0.06 * Tn, ((P - y) / l) * 0.06 * Tn, 0], text: 'T' };
          }} />
        </>
      )}
    </group>
  );
}
