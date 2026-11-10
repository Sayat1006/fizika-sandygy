import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { G, clamp, deg2rad } from '../../engines/physics/core';
import { fmt } from '../../engines/physics/uncertainty';
import { TRACK, type TrackSim } from '../../engines/simulation/track';
import { useLab } from '../../lib/store';
import type { ParamDef } from '../../data/types';
import { Arrow, Link, N2M, Ruler, Tag, Weight, useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const trackView: StageView = { camera: [0.05, 0.45, 1.75], target: [-0.06, 0.04, 0], table: [-0.82, 0.55] };

const PIVOT = new THREE.Vector2(0.5, 0.06); // тректің төменгі ұшы
const GATE = -0.1; // мәре (фотоқақпа) жергілікті x координатасы
const CART = { l: 0.12, h: 0.03, d: 0.06, wheel: 0.011 };
const PULLEY = { x: 0.578, r: 0.022 };
const params = () => useLab.getState().params;
const theta = () => deg2rad(params().angle);
const world = (x: number, y: number, z = 0): [number, number, number] => {
  const t = -theta();
  return [PIVOT.x + x * Math.cos(t) - y * Math.sin(t), PIVOT.y + x * Math.sin(t) + y * Math.cos(t), z];
};
const localX = (pt: THREE.Vector3) => (pt.x - PIVOT.x) * Math.cos(theta()) - (pt.y - PIVOT.y) * Math.sin(theta());

export default function TrackScene({ sim, startDef }: { sim: TrackSim; startDef: ParamDef }) {
  const M = useLab((s) => s.params.M);
  const mh = useLab((s) => s.params.mh ?? 0);
  const vectors = useLab((s) => s.vectors);
  const root = useRef<THREE.Group>(null);
  const cart = useRef<THREE.Group>(null);
  const hang = useRef<THREE.Group>(null);
  const off = useRef(0);
  const hasWeight = mh > 0;

  const front = () => GATE - params().start + sim.s;
  const stringY = CART.wheel * 2 + CART.h / 2;
  const pulleyY = PIVOT.y + stringY - PULLEY.r;
  const hangTop = () => pulleyY - 0.08 - sim.s;

  const bind = useDrag({
    disabled: false,
    onStart: (pt) => {
      if (sim.phase === 'running') return;
      sim.reset();
      off.current = localX(pt) - front();
    },
    onDrag: (pt) => {
      if (sim.phase === 'running') return;
      const s = GATE - (localX(pt) - off.current);
      useLab.getState().setParam('start', clamp(Math.round(s * 100) / 100, startDef.min, startDef.max));
    },
  });

  useFrame(() => {
    if (root.current) root.current.rotation.z = -theta();
    if (cart.current) cart.current.position.x = front() - CART.l / 2;
    if (hang.current) hang.current.position.y = hangTop() - 0.034;
  });

  const loads = Math.round((M - 0.2) / 0.2);
  const cartCenter = () => world(front() - CART.l / 2, stringY);
  const dir = (): [number, number] => [Math.cos(theta()), -Math.sin(theta())];

  return (
    <group>
      <group ref={root} position={[PIVOT.x, PIVOT.y, 0]}>
        <mesh position={[-TRACK.length / 2, -0.01, 0]} castShadow receiveShadow>
          <boxGeometry args={[TRACK.length, 0.02, 0.1]} />
          <meshStandardMaterial color="#c3c8d2" metalness={0.7} roughness={0.35} />
        </mesh>
        {[-0.022, 0.022].map((z) => (
          <mesh key={z} position={[-TRACK.length / 2, 0.001, z]}>
            <boxGeometry args={[TRACK.length, 0.002, 0.006]} />
            <meshStandardMaterial color="#5f6675" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        <group position={[GATE, 0, 0.0508]} rotation={[0, 0, -Math.PI / 2]}>
          <Ruler length={1.05} width={0.02} minor={0.5} major={10} />
        </group>
        {/* мәредегі фотоқақпа */}
        <group position={[GATE, 0, 0]}>
          {[-0.058, 0.058].map((z) => (
            <mesh key={z} position={[0, 0.045, z]}>
              <boxGeometry args={[0.012, 0.09, 0.012]} />
              <meshStandardMaterial color="#17191F" roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 0.094, 0]}>
            <boxGeometry args={[0.014, 0.012, 0.128]} />
            <meshStandardMaterial color="#17191F" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.0008, 0.0008, 0.11, 6]} />
            <meshBasicMaterial color="#dc3545" />
          </mesh>
        </group>
        {/* арбаша */}
        <group ref={cart} {...bind}>
          <mesh position={[0, CART.wheel * 2 + CART.h / 2 - 0.004, 0]} castShadow>
            <boxGeometry args={[CART.l, CART.h, CART.d]} />
            <meshStandardMaterial color="#4263EB" roughness={0.4} metalness={0.15} />
          </mesh>
          {[-0.04, 0.04].flatMap((x) =>
            [-0.034, 0.034].map((z) => (
              <mesh key={`${x}${z}`} position={[x, CART.wheel, z]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[CART.wheel, CART.wheel, 0.008, 20]} />
                <meshStandardMaterial color="#17191F" roughness={0.6} />
              </mesh>
            )),
          )}
          {Array.from({ length: loads }, (_, i) => (
            <mesh key={i} position={[-0.036 + (i % 4) * 0.024, CART.wheel * 2 + CART.h + 0.006 + Math.floor(i / 4) * 0.018, 0]} castShadow>
              <boxGeometry args={[0.02, 0.016, 0.045]} />
              <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, 0.04, 0]} visible={false}>
            <boxGeometry args={[0.16, 0.1, 0.1]} />
          </mesh>
        </group>
      </group>
      {/* тректің жоғарғы ұшының тірегі */}
      <Link r={0.007} color="#b9bec8" get={() => { const [x, y] = world(-TRACK.length + 0.05, -0.02); return [[x, 0, 0], [x, Math.max(y, 0.001), 0]]; }} />
      <mesh position={[PIVOT.x - 0.03, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.04, 0.1]} />
        <meshStandardMaterial color="#2b2f3a" />
      </mesh>
      <Tag className="scene-tag clock" position={[PIVOT.x + GATE, PIVOT.y + 0.17, 0]} text={() => `⏱ ${fmt(sim.phase === 'done' ? sim.tFinish : sim.t, 2)} с`} />
      {!hasWeight && <Tag position={[PIVOT.x - 0.02, 0.2, 0.06]} text={() => `α = ${fmt(params().angle, 0)}°`} />}
      {hasWeight && (
        <>
          <mesh position={[PULLEY.x, pulleyY, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[PULLEY.r, PULLEY.r, 0.008, 32]} />
            <meshStandardMaterial color="#e8ecf2" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[(PIVOT.x + PULLEY.x) / 2, pulleyY - 0.004, -0.012]}>
            <boxGeometry args={[PULLEY.x - PIVOT.x + 0.02, 0.012, 0.006]} />
            <meshStandardMaterial color="#2b2f3a" />
          </mesh>
          <Link get={() => [world(front(), stringY), [PULLEY.x, pulleyY + PULLEY.r, 0]]} />
          <Link get={() => [[PULLEY.x + PULLEY.r, pulleyY, 0], [PULLEY.x + PULLEY.r, hangTop(), 0]]} />
          <group ref={hang} position={[PULLEY.x + PULLEY.r, 0, 0]} scale={Math.cbrt(mh / 0.1) * 1.05}>
            <Weight />
          </group>
        </>
      )}
      {vectors && (
        <>
          <Arrow name="Жылдамдық" color="#4263EB" get={() => {
            const [dx, dy] = dir();
            const L = sim.v * 0.1;
            return sim.v > 0.02 ? { o: cartCenter(), v: [dx * L, dy * L + 0.0001, 0], text: `v = ${fmt(sim.v, 2)} м/с` } : null;
          }} />
          <Arrow name="Үдеу" color="#7957D5" get={() => {
            if (sim.phase !== 'running') return null;
            const [x, y] = cartCenter();
            const [dx, dy] = dir();
            const L = sim.a * 0.12;
            return { o: [x, y + 0.05, 0], v: [dx * L, dy * L, 0], text: `a = ${fmt(sim.a, 2)} м/с²` };
          }} />
          {hasWeight && (
            <>
              <Arrow name="Жіптің керілу күші" color="#20A477" get={() => {
                const T = sim.tension(params());
                return { o: [PULLEY.x + PULLEY.r, hangTop() - 0.02, 0], v: [0, T * N2M * 2, 0], text: `T = ${fmt(T, 2)} Н` };
              }} />
              <Arrow name="Жүктің ауырлық күші" color="#DC5353" get={() => {
                const P = params().mh * G;
                return { o: [PULLEY.x + PULLEY.r, hangTop() - 0.02, 0], v: [0, -P * N2M * 2, 0], text: `mg = ${fmt(P, 2)} Н` };
              }} />
            </>
          )}
        </>
      )}
    </group>
  );
}
