import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { G, clamp, deg2rad, rad2deg } from '../../engines/physics/core';
import { fmt } from '../../engines/physics/uncertainty';
import { PULL, type PullSim } from '../../engines/simulation/pull';
import { useLab } from '../../lib/store';
import type { ParamDef } from '../../data/types';
import { Arrow, Dynamometer, Link, N2M, Tag, Weight, dynLength, useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const surfaceView = (tilt: boolean): StageView =>
  tilt ? { camera: [0, 0.5, 1.3], target: [0, 0.2, 0] } : { camera: [0, 0.38, 1.12], target: [0, 0.06, 0] };

const PIVOT = new THREE.Vector2(-0.42, 0.032);
const LEN = 0.84;
const BLOCK = { l: 0.08, h: 0.04, d: 0.06 };
const params = () => useLab.getState().params;
const theta = () => deg2rad(params().angle);
/** Тақтайдың жергілікті (s, n) координатасын әлемдік координатаға айналдыру */
const world = (s: number, n: number): [number, number, number] => {
  const t = theta();
  return [PIVOT.x + s * Math.cos(t) - n * Math.sin(t), PIVOT.y + s * Math.sin(t) + n * Math.cos(t), 0];
};
const localS = (pt: THREE.Vector3) => (pt.x - PIVOT.x) * Math.cos(theta()) + (pt.y - PIVOT.y) * Math.sin(theta());

function BlockWeight({ i, sim }: { i: number; sim: PullSim }) {
  const g = useRef<THREE.Group>(null);
  const drag = useRef<THREE.Vector3 | null>(null);
  const bind = useDrag({
    onStart: (pt) => (drag.current = pt.clone()),
    onDrag: (pt) => drag.current?.copy(pt),
    onEnd: (pt) => {
      drag.current = null;
      const n = params().n;
      const [bx, by] = world(sim.s - BLOCK.l / 2, BLOCK.h);
      const near = Math.hypot(pt.x - bx, pt.y - by) < 0.1;
      if (i >= n && near && n < 3) useLab.getState().setParam('n', n + 1);
      if (i < n && !near) useLab.getState().setParam('n', n - 1);
    },
  });
  useFrame(() => {
    if (!g.current) return;
    const p = g.current.position;
    if (drag.current) {
      p.set(drag.current.x, drag.current.y - 0.015, 0);
      g.current.rotation.z = 0;
      return;
    }
    const n = params().n;
    if (i < n) {
      p.set(...world(sim.s - BLOCK.l / 2, BLOCK.h + i * 0.027));
      g.current.rotation.z = theta();
    } else {
      p.lerp(new THREE.Vector3(-0.56 - (i - n) * 0.06, 0, 0.02), 0.25);
      g.current.rotation.z = 0;
    }
  });
  return (
    <group ref={g} position={[-0.56 - i * 0.06, 0, 0.02]}>
      <Weight {...bind} />
    </group>
  );
}

export default function SurfaceScene({ sim, angleDef }: { sim: PullSim; angleDef?: ParamDef }) {
  const mu = useLab((s) => s.params.mu);
  const vectors = useLab((s) => s.vectors);
  const tilt = !!angleDef && angleDef.max > angleDef.min;
  const plank = useRef<THREE.Group>(null);
  const block = useRef<THREE.Mesh>(null);
  const dyn = useRef<THREE.Group>(null);
  const off = useRef(0);

  const dragDyn = useDrag({
    onStart: (pt) => (off.current = localS(pt) - sim.h),
    onDrag: (pt) => {
      sim.auto = false;
      useLab.getState().setParam('hand', clamp(localS(pt) - off.current, PULL.sMin, PULL.handMax));
    },
  });
  const dragAngle = useDrag({
    onDrag: (pt) => {
      if (!angleDef) return;
      const a = rad2deg(Math.atan2(pt.y - PIVOT.y, pt.x - PIVOT.x));
      useLab.getState().setParam('angle', clamp(Math.round(a), angleDef.min, angleDef.max));
    },
  });

  useFrame(() => {
    if (plank.current) plank.current.rotation.z = theta();
    if (block.current) block.current.position.set(sim.s - BLOCK.l / 2, BLOCK.h / 2, 0);
    if (dyn.current) dyn.current.position.set(sim.h + dynLength(0), BLOCK.h / 2, 0);
  });

  const surfaceColor = mu <= 0.2 ? '#e8ecf2' : mu <= 0.3 ? '#c9a06a' : '#3b3f48';
  const forces = () => {
    const t = theta();
    const m = sim.mass(params());
    const N = m * G * Math.cos(t);
    const drive = sim.F - m * G * Math.sin(t);
    const moving = Math.abs(sim.v) > 1e-4;
    const fr = moving ? params().mu * N * -Math.sign(sim.v) : -clamp(drive, -params().mu * PULL.staticRatio * N, params().mu * PULL.staticRatio * N);
    return { t, m, N, fr };
  };
  const center = () => world(sim.s - BLOCK.l / 2, BLOCK.h / 2);

  return (
    <group>
      <group ref={plank} position={[PIVOT.x, PIVOT.y, 0]}>
        <mesh position={[LEN / 2 - 0.02, -0.008, 0]} castShadow receiveShadow>
          <boxGeometry args={[LEN, 0.016, 0.13]} />
          <meshStandardMaterial color={surfaceColor} roughness={mu > 0.3 ? 0.95 : 0.6} />
        </mesh>
        {/* l = 50 см жол белгілері */}
        {[PULL.sMin, PULL.sMin + PULL.path].map((s) => (
          <mesh key={s} position={[s, 0.0004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.003, 0.13]} />
            <meshBasicMaterial color="#4263EB" />
          </mesh>
        ))}
        <mesh ref={block} castShadow>
          <boxGeometry args={[BLOCK.l, BLOCK.h, BLOCK.d]} />
          <meshStandardMaterial color="#b98b52" roughness={0.7} />
        </mesh>
        <group ref={dyn} rotation={[0, 0, -Math.PI / 2]}>
          <Dynamometer force={() => sim.F} {...dragDyn}>
            {/* ұстауға арналған тұтқа */}
            <mesh position={[0, 0.012, 0]} {...dragDyn}>
              <sphereGeometry args={[0.014, 20, 14]} />
              <meshStandardMaterial color="#E8A23A" roughness={0.4} />
            </mesh>
          </Dynamometer>
        </group>
        {tilt && (
          <mesh position={[LEN - 0.02, -0.008, 0.08]} {...dragAngle}>
            <sphereGeometry args={[0.02, 24, 16]} />
            <meshStandardMaterial color="#7957D5" roughness={0.35} />
          </mesh>
        )}
      </group>
      {tilt && (
        <>
          <Link r={0.006} color="#b9bec8" get={() => { const [x, y] = world(LEN - 0.06, -0.016); return [[x, 0, -0.04], [x, y, -0.04]]; }} />
          <Tag position={[PIVOT.x + 0.14, 0.035, 0.08]} text={() => `α = ${fmt(params().angle, 0)}°`} />
        </>
      )}
      {/* тірек призма */}
      <mesh position={[PIVOT.x, 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.13, 3]} />
        <meshStandardMaterial color="#2b2f3a" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <BlockWeight key={i} i={i} sim={sim} />
      ))}
      {vectors && (
        <>
          <Arrow name="Тарту күші" color="#4263EB" get={() => {
            const { t } = forces();
            const L = sim.F * N2M;
            return sim.F > 0.03 ? { o: world(sim.s, BLOCK.h * 0.75), v: [L * Math.cos(t), L * Math.sin(t), 0], text: `F = ${fmt(sim.F, 2)} Н` } : null;
          }} />
          <Arrow name="Үйкеліс күші" color="#E8703A" get={() => {
            const { t, fr } = forces();
            const L = fr * N2M;
            return Math.abs(fr) > 0.03 ? { o: world(sim.s - BLOCK.l / 2 - Math.sign(fr) * BLOCK.l / 2, 0.006), v: [L * Math.cos(t), L * Math.sin(t), 0], text: `F үйк = ${fmt(Math.abs(fr), 2)} Н` } : null;
          }} />
          <Arrow name="Тірек реакциясы" color="#20A477" get={() => {
            const { t, N } = forces();
            const L = N * N2M;
            return { o: center(), v: [-L * Math.sin(t), L * Math.cos(t), 0], text: `N = ${fmt(N, 2)} Н` };
          }} />
          <Arrow name="Ауырлық күші" color="#DC5353" get={() => {
            const { m } = forces();
            return { o: center(), v: [0, -m * G * N2M, 0], text: `mg = ${fmt(m * G, 2)} Н` };
          }} />
        </>
      )}
    </group>
  );
}
