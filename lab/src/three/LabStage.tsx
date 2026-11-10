import { OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useApp } from '../lib/store';

export interface StageView {
  camera: [number, number, number];
  target: [number, number, number];
  /** үстелдің x бойынша шектері */
  table?: [number, number];
}

/** Желіден ештеңе жүктемей, процедуралық студия жарығын (шағылысулар үшін) жасайды. */
export function StudioEnvironment({ intensity = 0.55 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = tex;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      tex.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, intensity]);
  return null;
}

/** Тек әзірлеу режимінде: автоматты сынақтар 3D нүктенің экрандағы орнын біле алуы үшін. */
function DevProbe() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__project = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      const r = gl.domElement.getBoundingClientRect();
      return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
    };
  }, [camera, gl]);
  return null;
}

/** Тар (портрет) экранда қондырғы толық сыюы үшін камераны алыстатады. */
function FitCamera({ view }: { view: StageView }) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const narrow = aspect < 1.5;
  useEffect(() => {
    const k = Math.min(2, Math.max(1, (1.5 / aspect) ** 0.75));
    const [tx, ty, tz] = view.target;
    const [cx, cy, cz] = view.camera;
    camera.position.set(tx + (cx - tx) * k, ty + (cy - ty) * k, tz + (cz - tz) * k);
    camera.lookAt(tx, ty, tz);
    // тек экран пішіні айтарлықтай өзгергенде қайта орналастырамыз
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrow, camera, view]);
  return null;
}

/** Ортақ зертхана сахнасы: жарық, үстел, еден, орбиталық камера, бейімделгіш сапа. */
export default function LabStage({ view, children }: { view: StageView; children: ReactNode }) {
  const dark = useApp((s) => s.theme === 'dark');
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio, 1.75));
  const [x0, x1] = view.table ?? [-0.9, 0.9];
  const w = x1 - x0;
  const cx = (x0 + x1) / 2;
  const bg = dark ? '#101218' : '#eef0f4';
  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ position: view.camera, fov: 36, near: 0.03, far: 30 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="3D зертхана көрінісі"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(window.devicePixelRatio, 1.75))} />
      {import.meta.env.DEV && <DevProbe />}
      <FitCamera view={view} />
      <StudioEnvironment intensity={dark ? 0.35 : 0.55} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 4, 9]} />
      <hemisphereLight args={['#ffffff', dark ? '#1a1d26' : '#c9cfdb', dark ? 0.45 : 0.7]} />
      <directionalLight
        position={[0.9, 1.9, 1.4]}
        intensity={dark ? 1.3 : 1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-1.3}
        shadow-camera-right={1.3}
        shadow-camera-top={1.3}
        shadow-camera-bottom={-1.3}
        shadow-camera-near={0.1}
        shadow-camera-far={6}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-1.2, 0.8, -0.6]} intensity={0.45} />
      {/* үстел */}
      <mesh position={[cx, -0.02, 0]} receiveShadow castShadow>
        <boxGeometry args={[w, 0.04, 0.7]} />
        <meshStandardMaterial color={dark ? '#2a2e39' : '#f4f2ee'} roughness={0.7} />
      </mesh>
      {[x0 + 0.06, x1 - 0.06].flatMap((x) =>
        [-0.29, 0.29].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -0.47, z]} castShadow>
            <boxGeometry args={[0.04, 0.86, 0.04]} />
            <meshStandardMaterial color={dark ? '#1c1f28' : '#d5d9e2'} roughness={0.6} />
          </mesh>
        )),
      )}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={dark ? '#14161d' : '#d9dde6'} roughness={0.95} />
      </mesh>
      {children}
      <OrbitControls
        makeDefault
        target={view.target}
        enableDamping
        dampingFactor={0.12}
        minDistance={0.35}
        maxDistance={4}
        maxPolarAngle={Math.PI / 2 + 0.25}
      />
    </Canvas>
  );
}
