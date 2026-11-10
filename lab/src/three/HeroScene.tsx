import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { waves } from '../engines/physics/formulas';
import { StudioEnvironment } from './LabStage';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Математикалық маятник: θ(t) = θ₀·cos(2πt/T), T = 2π√(l/g) — нақты период. */
function Pendulum() {
  const g = useRef<THREE.Group>(null);
  const l = 1.5;
  const T = waves.pendulumPeriod(l);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = 0.42 * Math.cos((2 * Math.PI * clock.elapsedTime) / T);
  });
  return (
    <group position={[-2.9, 1.7, -0.6]}>
      <mesh>
        <boxGeometry args={[0.7, 0.05, 0.05]} />
        <meshStandardMaterial color="#b9bec8" metalness={0.8} roughness={0.3} />
      </mesh>
      <group ref={g}>
        <mesh position={[0, -l / 2, 0]}>
          <cylinderGeometry args={[0.006, 0.006, l, 6]} />
          <meshStandardMaterial color="#737782" />
        </mesh>
        <mesh position={[0, -l, 0]} castShadow>
          <sphereGeometry args={[0.16, 40, 28]} />
          <meshStandardMaterial color="#4263EB" metalness={0.5} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/** Атом моделі — иллюстрациялық (планетарлық бейне, масштабсыз). */
function Atom() {
  const g = useRef<THREE.Group>(null);
  const electrons = useRef<(THREE.Mesh | null)[]>([]);
  const tilts: [number, number][] = [[0.4, 0], [1.4, 0.9], [1.4, -0.9]];
  useFrame(({ clock }, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.15;
    electrons.current.forEach((e, i) => {
      const a = clock.elapsedTime * (1.3 + i * 0.25) + i * 2;
      e?.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
    });
  });
  return (
    <group ref={g} position={[2.75, 0.9, -0.4]}>
      <mesh>
        <sphereGeometry args={[0.17, 40, 28]} />
        <meshStandardMaterial color="#7957D5" roughness={0.25} metalness={0.3} />
      </mesh>
      {tilts.map(([rx, rz], i) => (
        <group key={i} rotation={[rx, 0, rz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.62, 0.005, 8, 96]} />
            <meshBasicMaterial color="#9aa3b5" transparent opacity={0.7} />
          </mesh>
          <mesh ref={(m) => { electrons.current[i] = m; }}>
            <sphereGeometry args={[0.045, 20, 14]} />
            <meshStandardMaterial color="#4263EB" emissive="#4263EB" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Floating({ position, children, speed = 1 }: { position: [number, number, number]; children: React.ReactNode; speed?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime * speed;
    g.current.position.y = position[1] + Math.sin(t) * 0.09;
    g.current.rotation.x = t * 0.25;
    g.current.rotation.y = t * 0.35;
  });
  return <group ref={g} position={position}>{children}</group>;
}

/** Броундық қозғалысты еске салатын бөлшектер өрісі (instanced). */
function Particles({ count = 260 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () => Array.from({ length: count }, () => ({
      p: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5 + 0.4, (Math.random() - 0.5) * 5 - 1.5),
      v: new THREE.Vector3((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12),
      s: 0.012 + Math.random() * 0.02,
    })),
    [count],
  );
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    if (!mesh.current) return;
    data.forEach((d, i) => {
      d.p.addScaledVector(d.v, dt);
      if (Math.abs(d.p.x) > 4.5) d.v.x *= -1;
      if (Math.abs(d.p.y - 0.4) > 2.5) d.v.y *= -1;
      if (Math.abs(d.p.z + 1.5) > 2.5) d.v.z *= -1;
      o.position.copy(d.p);
      o.scale.setScalar(d.s);
      o.updateMatrix();
      mesh.current!.setMatrixAt(i, o.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial color="#8fa2f5" transparent opacity={0.55} />
    </instancedMesh>
  );
}

function Rig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.04;
    camera.position.y += (0.5 + pointer.y * 0.25 - camera.position.y) * 0.04;
    camera.lookAt(0, 0.45, 0);
  });
  return null;
}

export default function HeroScene() {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0.5, 5.2], fov: 38 }} frameloop={reduced() ? 'demand' : 'always'} aria-hidden>
      <StudioEnvironment intensity={0.7} />
      <hemisphereLight args={['#ffffff', '#c9cfdb', 0.8]} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <directionalLight position={[-4, 1, -2]} intensity={0.6} color="#7957D5" />
      <Pendulum />
      <Atom />
      <Floating position={[-1.9, -1.0, 0.4]} speed={0.7}>
        <mesh>
          <icosahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#8fa2f5" roughness={0.15} metalness={0.35} flatShading />
        </mesh>
      </Floating>
      <Floating position={[3.3, -0.9, -1]} speed={0.5}>
        <mesh>
          <torusGeometry args={[0.32, 0.1, 24, 64]} />
          <meshStandardMaterial color="#20A477" roughness={0.3} metalness={0.4} />
        </mesh>
      </Floating>
      <Floating position={[-3.2, -0.6, -1.2]} speed={0.6}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.32, 40]} />
          <meshStandardMaterial color="#c79a3b" roughness={0.3} metalness={0.8} />
        </mesh>
      </Floating>
      <Particles />
      <Rig />
    </Canvas>
  );
}
