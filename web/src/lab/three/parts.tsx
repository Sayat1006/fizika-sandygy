/* Қайта қолданылатын 3D құрал-жабдықтар мен әрекеттесу құралдары. Бірлік — метр. */
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';

// ───────────── Сүйреу (drag) ─────────────
const Z_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

interface DragOpts {
  onStart?: (pt: THREE.Vector3) => void;
  onDrag: (pt: THREE.Vector3) => void;
  onEnd?: (pt: THREE.Vector3) => void;
  disabled?: boolean;
}

/** Нысанды z = 0 тік жазықтығында тышқан/саусақпен сүйреу. Сүйреу кезінде камера басқаруы өшіріледі. */
export function useDrag({ onStart, onDrag, onEnd, disabled }: DragOpts) {
  const controls = useThree((s) => s.controls) as { enabled: boolean } | null;
  const active = useRef(false);
  const pt = useRef(new THREE.Vector3());
  const hit = (e: ThreeEvent<PointerEvent>) => e.ray.intersectPlane(Z_PLANE, pt.current);
  return {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (disabled) return;
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      active.current = true;
      if (controls) controls.enabled = false;
      document.body.style.cursor = 'grabbing';
      if (hit(e)) onStart?.(pt.current);
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      if (!active.current) return;
      e.stopPropagation();
      if (hit(e)) onDrag(pt.current);
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      if (!active.current) return;
      active.current = false;
      (e.target as Element).releasePointerCapture(e.pointerId);
      if (controls) controls.enabled = true;
      document.body.style.cursor = 'grab';
      onEnd?.(pt.current);
    },
    onPointerOver: () => {
      if (!disabled && !active.current) document.body.style.cursor = 'grab';
    },
    onPointerOut: () => {
      if (!active.current) document.body.style.cursor = '';
    },
  };
}

// ───────────── DOM белгілері (3D нүктеге бекітілген мәтін) ─────────────
/** Кенептің үстіне DOM элементін қойып, оны әр кадрда 3D нүктеге проекциялайды. */
export function useDomLabel(className: string) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const el = useRef<HTMLDivElement | null>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    const d = document.createElement('div');
    d.className = `scene-label ${className}`;
    d.style.display = 'none';
    gl.domElement.parentElement?.appendChild(d);
    el.current = d;
    return () => {
      d.remove();
      el.current = null;
    };
  }, [gl, className]);
  return useCallback(
    (pos: [number, number, number] | null, text = '', color?: string) => {
      const d = el.current;
      if (!d) return;
      if (!pos) {
        d.style.display = 'none';
        return;
      }
      v.set(...pos).project(camera);
      d.style.display = v.z < 1 ? '' : 'none';
      d.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
      if (color) d.style.color = color;
      if (d.textContent !== text) d.textContent = text;
    },
    [camera, size, v],
  );
}

// ───────────── Шкала текстурасы ─────────────
export function scaleTexture(opts: { w: number; h: number; from: number; to: number; minor: number; major: number; label: (v: number) => string; flip?: boolean; bg?: string }) {
  const { w, h, from, to, minor, major, label, bg = '#fbfaf5' } = opts;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = g.strokeStyle = '#1b1d23';
  g.font = `600 ${Math.round(w * 0.2)}px Inter, system-ui, sans-serif`;
  g.textBaseline = 'middle';
  const pad = h * 0.035;
  const n = Math.round((to - from) / minor);
  for (let i = 0; i <= n; i++) {
    const v = from + i * minor;
    const y = pad + ((h - 2 * pad) * i) / n;
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const isMid = Math.abs(v / (major / 2) - Math.round(v / (major / 2))) < 1e-6;
    g.lineWidth = isMajor ? 3 : 1.5;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w * (isMajor ? 0.42 : isMid ? 0.3 : 0.2), y);
    g.stroke();
    if (isMajor) g.fillText(label(v), w * 0.5, y);
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ───────────── Динамометр ─────────────
export const DYN = { body: 0.15, scaleLen: 0.05, rod: 0.035, max: 5 };
/** Динамометрдің жоғарғы ілмегінен төменгі ілгегіне дейінгі ұзындық (ext — серіппе ұзаруы). */
export const dynLength = (ext = 0) => DYN.body + DYN.rod + ext;

/**
 * Түтікті мектеп динамометрі (0–5 Н, бөлік құны 0,1 Н).
 * Жергілікті координата: бас нүкте — жоғарғы ілмек, құрал −Y бағытында ілінеді.
 * Көрсеткіш орны нақты күшке сәйкес; `stretch` болса ілгек өзегі де сол шамаға ұзарады.
 */
export function Dynamometer({ force, stretch = true, children, ...drag }: { force: () => number; stretch?: boolean; children?: ReactNode } & Partial<ReturnType<typeof useDrag>>) {
  const pointer = useRef<THREE.Group>(null);
  const rod = useRef<THREE.Group>(null);
  const tex = useMemo(
    () => scaleTexture({ w: 128, h: 512, from: 0, to: 5, minor: 0.1, major: 1, label: (v) => v.toFixed(0) }),
    [],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  const scaleH = DYN.scaleLen / 0.93; // текстураның екі шетінде 3,5 % бос орын бар
  const zeroY = -0.062;
  useFrame(() => {
    const ext = (Math.min(Math.max(force(), 0), DYN.max * 1.15) / DYN.max) * DYN.scaleLen;
    if (pointer.current) pointer.current.position.y = zeroY - ext;
    if (rod.current) rod.current.position.y = stretch ? -ext : 0;
  });
  return (
    <group>
      <group {...drag}>
        <mesh position={[0, -0.006, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.007, 0.0016, 8, 20]} />
          <meshStandardMaterial color="#8a8f99" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.015 - (DYN.body - 0.015) / 2, 0]} castShadow>
          <boxGeometry args={[0.044, DYN.body - 0.015, 0.016]} />
          <meshStandardMaterial color="#3d59d9" roughness={0.45} metalness={0.1} />
        </mesh>
        <mesh position={[0.004, zeroY - DYN.scaleLen / 2, 0.0082]}>
          <planeGeometry args={[0.03, scaleH]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      <group ref={pointer}>
        <mesh position={[-0.002, 0, 0.0092]}>
          <boxGeometry args={[0.022, 0.0014, 0.0008]} />
          <meshBasicMaterial color="#dc3545" />
        </mesh>
      </group>
      <group ref={rod}>
        <mesh position={[0, -DYN.body - DYN.rod / 2 + 0.012, 0]}>
          <cylinderGeometry args={[0.0013, 0.0013, DYN.rod + 0.02, 8]} />
          <meshStandardMaterial color="#8a8f99" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -DYN.body - DYN.rod + 0.004, 0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.005, 0.0013, 8, 16, Math.PI * 1.5]} />
          <meshStandardMaterial color="#8a8f99" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      {children}
    </group>
  );
}

// ───────────── Жүк (100 г) ─────────────
export const WEIGHT_H = 0.034;
export function Weight(props: { color?: string } & Partial<ReturnType<typeof useDrag>>) {
  const { color = '#c79a3b', ...drag } = props;
  return (
    <group {...drag}>
      <mesh position={[0, 0.013, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.026, 28]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <torusGeometry args={[0.004, 0.0012, 8, 16]} />
        <meshStandardMaterial color="#8a8f99" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* ұстауды жеңілдететін көрінбейтін аймақ */}
      <mesh position={[0, 0.017, 0]} visible={false}>
        <cylinderGeometry args={[0.026, 0.026, 0.05, 12]} />
      </mesh>
    </group>
  );
}

// ───────────── Серіппе (геометриясы нақты деформацияланады) ─────────────
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  L = 0.1;
  constructor(private radius: number, private turns: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    // ұштарында орам радиусы осьтік ілгекке жиналады
    const r = this.radius * Math.min(1, t * 14, (1 - t) * 14);
    return target.set(Math.cos(a) * r, -t * this.L, Math.sin(a) * r);
  }
}
export function Helix({ length, radius = 0.009, turns = 14, color = '#9aa1ad', wire = 0.0011 }: { length: () => number; radius?: number; turns?: number; color?: string; wire?: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const last = useRef(-1);
  const curve = useMemo(() => new HelixCurve(radius, turns), [radius, turns]);
  useFrame(() => {
    const L = length();
    if (!mesh.current || Math.abs(L - last.current) < 0.0002) return;
    last.current = L;
    curve.L = L;
    mesh.current.geometry.dispose();
    mesh.current.geometry = new THREE.TubeGeometry(curve, turns * 14, wire, 6, false);
  });
  useEffect(() => () => mesh.current?.geometry.dispose(), []);
  return (
    <mesh ref={mesh} castShadow>
      <bufferGeometry />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.28} />
    </mesh>
  );
}

// ───────────── Сызғыш ─────────────
/** Ұзындығы `length` м сызғыш; шкала жергілікті −Y бағытында 0-ден өседі (см). */
export function Ruler({ length, width = 0.028, minor = 0.1, major = 1 }: { length: number; width?: number; minor?: number; major?: number }) {
  const tex = useMemo(
    () => scaleTexture({ w: 96, h: 2048, from: 0, to: length * 100, minor, major, label: (v) => v.toFixed(0), bg: '#f4e7b8' }),
    [length, minor, major],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  const H = length / 0.93;
  return (
    <group>
      <mesh position={[width / 2, -length / 2, -0.0016]}>
        <boxGeometry args={[width, H, 0.003]} />
        <meshStandardMaterial color="#e9d79a" roughness={0.6} />
      </mesh>
      <mesh position={[width / 2, -length / 2, 0.0001]}>
        <planeGeometry args={[width, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ───────────── Вектор ─────────────
const UP = new THREE.Vector3(0, 1, 0);
/** Күш/жылдамдық векторы. `get` әр кадрда [бас нүкте, вектор (метрмен), белгі мәтіні] қайтарады. */
export function Arrow({ get, color }: { get: () => { o: [number, number, number]; v: [number, number, number]; text: string } | null; color: string; name?: string }) {
  const g = useRef<THREE.Group>(null);
  const shaft = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  const label = useDomLabel('vec-label');
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const d = get();
    if (!g.current) return;
    const len = d ? Math.hypot(...d.v) : 0;
    const show = !!d && len > 0.004;
    g.current.visible = show;
    if (!d || !show) {
      label(null);
      return;
    }
    g.current.position.set(...d.o);
    dir.set(...d.v).normalize();
    g.current.quaternion.setFromUnitVectors(UP, dir);
    const hl = Math.min(0.02, len * 0.45);
    shaft.current!.scale.y = len - hl;
    shaft.current!.position.y = (len - hl) / 2;
    head.current!.position.y = len - hl / 2;
    head.current!.scale.setScalar(hl / 0.02);
    const k = len + 0.022;
    label([d.o[0] + dir.x * k, d.o[1] + dir.y * k, d.o[2] + dir.z * k], d.text, color);
  });
  return (
    <group ref={g} visible={false}>
      <mesh ref={shaft} renderOrder={10}>
        <cylinderGeometry args={[0.0022, 0.0022, 1, 10]} />
        <meshBasicMaterial color={color} depthTest={false} transparent />
      </mesh>
      <mesh ref={head} renderOrder={10}>
        <coneGeometry args={[0.0065, 0.02, 14]} />
        <meshBasicMaterial color={color} depthTest={false} transparent />
      </mesh>
    </group>
  );
}

/** Күш векторының ұзындық масштабы: 1 Н ↔ 4 см */
export const N2M = 0.04;

// ───────────── Жіп / өзек: екі нүкте арасындағы жіңішке цилиндр ─────────────
export function Link({ get, r = 0.0007, color = '#3a3d45' }: { get: () => [THREE.Vector3Tuple, THREE.Vector3Tuple]; r?: number; color?: string }) {
  const m = useRef<THREE.Mesh>(null);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const [p, q] = get();
    a.set(...p);
    b.set(...q);
    const len = a.distanceTo(b);
    if (!m.current) return;
    m.current.visible = len > 1e-4;
    m.current.position.copy(a).add(b).multiplyScalar(0.5);
    m.current.scale.set(1, Math.max(len, 1e-4), 1);
    m.current.quaternion.setFromUnitVectors(UP, b.sub(a).normalize());
  });
  return (
    <mesh ref={m}>
      <cylinderGeometry args={[r, r, 1, 6]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

// ───────────── Штатив ─────────────
export function Stand({ x = -0.12, height = 0.7, armY, armTo = 0 }: { x?: number; height?: number; armY: () => number; armTo?: number }) {
  const arm = useRef<THREE.Group>(null);
  useFrame(() => {
    if (arm.current) arm.current.position.y = armY();
  });
  const armLen = armTo - x + 0.01;
  return (
    <group>
      <mesh position={[x + 0.04, 0.008, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.016, 0.13]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[x, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.005, height, 16]} />
        <meshStandardMaterial color="#b9bec8" metalness={0.9} roughness={0.25} />
      </mesh>
      <group ref={arm}>
        <mesh position={[x, 0, 0]}>
          <boxGeometry args={[0.022, 0.022, 0.022]} />
          <meshStandardMaterial color="#2b2f3a" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[x + armLen / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.0035, 0.0035, armLen, 12]} />
          <meshStandardMaterial color="#b9bec8" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/** 3D нүктеге бекітілген мәтіндік белгі. */
export function Tag({ position, text, className = 'scene-tag' }: { position: [number, number, number]; text: () => string; className?: string }) {
  const label = useDomLabel(className);
  useFrame(() => label(position, text()));
  return null;
}
