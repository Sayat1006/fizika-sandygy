import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clamp, deg2rad, rad2deg } from '../../engines/physics/core';
import type { RefractionSim } from '../../engines/simulation/refraction';
import { useLab } from '../../lib/store';
import { useDrag } from '../parts';
import type { StageView } from '../LabStage';

export const refractionView: StageView = { camera: [0.0, 0.33, 0.95], target: [0, 0.3, 0] };

const C = new THREE.Vector3(0, 0.31, 0.012); // шайба центрі (беттің алдында)
const RD = 0.22; // шайба радиусы
const RG = 0.14; // шыны жарты цилиндр радиусы
const params = () => useLab.getState().params;

function diskTexture() {
  const S = 1400, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d')!, o = S / 2, r = S * 0.47;
  g.fillStyle = '#fbfaf5'; g.beginPath(); g.arc(o, o, S / 2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = g.fillStyle = '#1b1d23'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 34px Inter, system-ui, sans-serif';
  for (let d = 0; d < 360; d++) {
    const a = deg2rad(d) - Math.PI / 2; // 0° — жоғары (нормаль)
    const major = d % 10 === 0, mid = d % 5 === 0, L = major ? 38 : mid ? 26 : 14;
    g.lineWidth = major ? 3 : 1.5;
    g.beginPath(); g.moveTo(o + Math.cos(a) * r, o + Math.sin(a) * r); g.lineTo(o + Math.cos(a) * (r - L), o + Math.sin(a) * (r - L)); g.stroke();
    if (major) { const v = d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d; g.fillText(String(v), o + Math.cos(a) * (r - 62), o + Math.sin(a) * (r - 62)); }
  }
  // нормаль мен шекара
  g.setLineDash([14, 10]); g.lineWidth = 2; g.strokeStyle = '#8a8f99';
  g.beginPath(); g.moveTo(o, o - r); g.lineTo(o, o + r); g.stroke();
  g.setLineDash([]); g.lineWidth = 3; g.strokeStyle = '#1b1d23';
  g.beginPath(); g.moveTo(o - r, o); g.lineTo(o + r, o); g.stroke();
  g.font = '700 30px Inter, system-ui, sans-serif'; g.fillStyle = '#4263EB';
  g.fillText('ауа', o - r * 0.55, o - 40); g.fillText('шыны', o - r * 0.55, o + 44);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Жарық сәулесі: екі нүкте арасындағы жалпақ жарқын жолақ */
function Beam({ get, opacity = 1 }: { get: () => [THREE.Vector3, THREE.Vector3] | null; opacity?: number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const r = get(); if (!m.current) return;
    m.current.visible = !!r; if (!r) return;
    const [a, b] = r, len = a.distanceTo(b);
    m.current.position.copy(a).add(b).multiplyScalar(0.5);
    m.current.scale.set(len, 1, 1);
    m.current.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
  });
  return (
    <mesh ref={m} renderOrder={5}>
      <planeGeometry args={[1, 0.0045]} />
      <meshBasicMaterial color="#ff3b30" transparent opacity={opacity} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

export default function RefractionScene({ sim }: { sim: RefractionSim }) {
  const tex = useMemo(diskTexture, []);
  useEffect(() => () => tex.dispose(), [tex]);
  const src = useRef<THREE.Group>(null);
  const vectors = useLab((s) => s.vectors);
  const bind = useDrag({
    onDrag: (pt) => {
      const a = rad2deg(Math.atan2(-(pt.x - C.x), pt.y - C.y));
      useLab.getState().setParam('alpha', Math.round(clamp(a, 0, 80)));
    },
  });
  const dir = (deg: number, up: boolean, side: number) => new THREE.Vector3(side * Math.sin(deg2rad(deg)), (up ? 1 : -1) * Math.cos(deg2rad(deg)), 0);
  useFrame(() => {
    const a = params().alpha;
    if (src.current) {
      const p = C.clone().add(dir(a, true, -1).multiplyScalar(RD + 0.03));
      src.current.position.set(p.x, p.y, 0.02);
      src.current.rotation.z = deg2rad(a);
    }
  });
  return (
    <group>
      {/* тірек */}
      <mesh position={[0, 0.01, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.26, 0.02, 0.12]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.05, -0.02]} castShadow>
        <boxGeometry args={[0.03, 0.08, 0.02]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* шайба */}
      <mesh position={[C.x, C.y, -0.004]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[RD + 0.012, RD + 0.012, 0.012, 96]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} />
      </mesh>
      <mesh position={[C.x, C.y, 0.0025]}>
        <circleGeometry args={[RD + 0.004, 96]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* жарты цилиндр шыны (төменгі жартысы) */}
      <mesh position={[C.x, C.y, 0.018]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[RG, RG, 0.03, 64, 1, false, -Math.PI / 2, Math.PI]} />
        <meshPhysicalMaterial color="#cfe9f7" transmission={0.6} roughness={0.08} transparent opacity={0.45} thickness={0.03} />
      </mesh>
      {/* жарық көзі */}
      <group ref={src}>
        <group {...bind}>
          <mesh castShadow>
            <boxGeometry args={[0.03, 0.06, 0.03]} />
            <meshStandardMaterial color="#3d59d9" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.032, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.006, 12]} />
            <meshBasicMaterial color="#ff6b5e" toneMapped={false} />
          </mesh>
          <mesh visible={false}><boxGeometry args={[0.08, 0.1, 0.06]} /></mesh>
        </group>
      </group>
      {/* сәулелер */}
      <Beam get={() => { const a = params().alpha; return [C.clone().add(dir(a, true, -1).multiplyScalar(RD)).setZ(0.034), C.clone().setZ(0.034)]; }} />
      <Beam get={() => { const b = sim.beta(params()); return [C.clone().setZ(0.034), C.clone().add(dir(b, false, 1).multiplyScalar(RD)).setZ(0.034)]; }} />
      <Beam opacity={0.28} get={() => { const a = params().alpha; return [C.clone().setZ(0.033), C.clone().add(dir(a, true, 1).multiplyScalar(RD * 0.9)).setZ(0.033)]; }} />
      {vectors && <AngleTags sim={sim} />}
    </group>
  );
}

function AngleTags({ sim }: { sim: RefractionSim }) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const p = params(), al = deg2rad(p.alpha), be = deg2rad(sim.beta(p));
    // доғалар: нормальдан сәулеге дейін
    if (a.current) { a.current.geometry.dispose(); a.current.geometry = new THREE.RingGeometry(0.05, 0.054, 32, 1, Math.PI / 2, al); }
    if (b.current) { b.current.geometry.dispose(); b.current.geometry = new THREE.RingGeometry(0.06, 0.064, 32, 1, -Math.PI / 2, be); }
  });
  return (
    <>
      <mesh ref={a} position={[C.x, C.y, 0.036]}><ringGeometry args={[0.05, 0.054, 8]} /><meshBasicMaterial color="#4263EB" /></mesh>
      <mesh ref={b} position={[C.x, C.y, 0.036]}><ringGeometry args={[0.06, 0.064, 8]} /><meshBasicMaterial color="#20A477" /></mesh>
    </>
  );
}
