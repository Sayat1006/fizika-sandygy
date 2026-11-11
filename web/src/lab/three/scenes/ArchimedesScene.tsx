import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clamp } from '../../engines/physics/core';
import { fmt } from '../../engines/physics/uncertainty';
import { BODIES, LIQUIDS, VESSEL, bodyHeight, type BuoyancySim } from '../../engines/simulation/buoyancy';
import { useLab } from '../../lib/store';
import { Arrow, DYN, Dynamometer, Link, N2M, Stand, dynLength, scaleTexture, useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const archimedesView: StageView = { camera: [0.4, 0.5, 1.36], target: [0, 0.36, 0] };

const FLOOR = 0.005;
const R_IN = Math.sqrt(VESSEL.area / Math.PI);
const THREAD = 0.03;
const params = () => useLab.getState().params;

export default function ArchimedesScene({ sim }: { sim: BuoyancySim }) {
  const bodyIdx = useLab((s) => s.params.body);
  const liquidIdx = useLab((s) => s.params.liquid);
  const vectors = useLab((s) => s.vectors);
  const body = BODIES[bodyIdx] ?? BODIES[0];
  const liquid = LIQUIDS[liquidIdx] ?? LIQUIDS[0];
  const H = bodyHeight(body);
  const bodyRef = useRef<THREE.Mesh>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const dynRef = useRef<THREE.Group>(null);
  const off = useRef(0);

  const scale = useMemo(
    () => scaleTexture({ w: 128, h: 1024, from: 600, to: 0, minor: -5, major: 100, label: (v) => v.toFixed(0), bg: '#ffffff' }),
    [],
  );
  useEffect(() => () => scale.dispose(), [scale]);

  const bind = useDrag({
    onStart: (pt) => (off.current = pt.y - params().holder),
    onDrag: (pt) => useLab.getState().setParam('holder', clamp(pt.y - off.current, VESSEL.holderMin, VESSEL.holderMax)),
  });

  const st = () => sim.state(params());
  const bodyTop = () => FLOOR + sim.y + H;
  const ext = () => (clamp(st().F, 0, DYN.max) / DYN.max) * DYN.scaleLen;
  const dynTop = () => bodyTop() + THREAD + dynLength(ext());

  useFrame(() => {
    const s = st();
    if (bodyRef.current) bodyRef.current.position.y = FLOOR + sim.y + H / 2;
    if (liquidRef.current) {
      liquidRef.current.scale.y = s.level;
      liquidRef.current.position.y = FLOOR + s.level / 2;
    }
    if (dynRef.current) dynRef.current.position.y = dynTop();
  });

  const cy = () => FLOOR + sim.y + H / 2;
  return (
    <group>
      <Stand x={-0.14} height={0.8} armY={() => dynTop() + 0.002} />
      <group ref={dynRef}>
        <Dynamometer force={() => st().F} {...bind} />
      </group>
      <Link get={() => [[0, bodyTop(), 0], [0, bodyTop() + THREAD + 0.006, 0]]} />
      <mesh ref={bodyRef} castShadow {...bind}>
        <cylinderGeometry args={[VESSEL.bodyRadius, VESSEL.bodyRadius, H, 40]} />
        <meshStandardMaterial color={body.color} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* өлшеуіш ыдыс */}
      <mesh position={[0, FLOOR / 2, 0]} receiveShadow>
        <cylinderGeometry args={[R_IN + 0.003, R_IN + 0.003, FLOOR, 48]} />
        <meshStandardMaterial color="#cfe3f5" transparent opacity={0.6} />
      </mesh>
      <mesh ref={liquidRef} renderOrder={1}>
        <cylinderGeometry args={[R_IN - 0.0005, R_IN - 0.0005, 1, 48]} />
        <meshStandardMaterial color={liquid.color} transparent opacity={0.5} roughness={0.1} depthWrite={false} />
      </mesh>
      <mesh position={[0, FLOOR + VESSEL.height / 2, 0]} renderOrder={2}>
        <cylinderGeometry args={[R_IN + 0.002, R_IN + 0.002, VESSEL.height, 48, 1, true]} />
        <meshStandardMaterial color="#dfeefa" transparent opacity={0.16} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* мл шкаласы: 600 мл ↔ ыдыс биіктігі 20 см */}
      <mesh position={[R_IN + 0.012, FLOOR + VESSEL.height / 2, 0.006]} rotation={[0, 0.35, 0]} renderOrder={3}>
        <planeGeometry args={[0.02, VESSEL.height / 0.93]} />
        <meshBasicMaterial map={scale} transparent opacity={0.92} toneMapped={false} />
      </mesh>
      {vectors && (
        <>
          <Arrow name="Ауырлық күші" color="#DC5353" get={() => {
            const s = st();
            return { o: [0, cy(), 0], v: [0, -s.weight * N2M, 0], text: `mg = ${fmt(s.weight, 2)} Н` };
          }} />
          <Arrow name="Архимед күші" color="#2F9BD6" get={() => {
            const s = st();
            return s.FA > 0.02 ? { o: [-0.014, cy(), 0], v: [0, s.FA * N2M, 0], text: `F Арх = ${fmt(s.FA, 2)} Н` } : null;
          }} />
          <Arrow name="Жіптің керілу күші" color="#20A477" get={() => {
            const s = st();
            return { o: [0.014, cy(), 0], v: [0, s.F * N2M, 0], text: `T = ${fmt(s.F, 2)} Н` };
          }} />
        </>
      )}
    </group>
  );
}
