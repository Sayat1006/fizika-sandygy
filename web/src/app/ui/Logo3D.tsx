/* «Сабақтас» белгісі 3D-де: екі бөлігі жиналып келеді, кейін баяу тербеледі, тышқанға ілеседі.
   Ақ фонда қара бет пен көк жиек, қараңғы режимде ақ бет. */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const P: [number, number][][] = [
  [[495, 244], [313, 155], [131, 244], [131, 277], [313, 370], [313, 345], [153, 262], [313, 183], [495, 272]],
  [[131, 381], [313, 470], [495, 381], [495, 348], [313, 255], [313, 280], [473, 363], [313, 442], [131, 353]],
];

export default function Logo3D({ size = 88 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let r: THREE.WebGLRenderer;
    try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch { return; }
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.setSize(size, size, false);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    cam.position.set(0, 0, 15);
    const face = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 });
    const side = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.15 });
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const tint = () => { face.color.set(mq.matches ? 0xf5f5f7 : 0x1d1d1f); side.color.set(mq.matches ? 0x2997ff : 0x0071e3); };
    tint(); mq.addEventListener('change', tint);
    const root = new THREE.Group(); scene.add(root);
    const parts = P.map((pts) => {
      const sh = new THREE.Shape();
      pts.forEach(([x, y], i) => { const X = (x - 313) / 52, Y = -(y - 312.5) / 52; if (i) sh.lineTo(X, Y); else sh.moveTo(X, Y); });
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3 });
      geo.translate(0, 0, -0.35);
      const m = new THREE.Mesh(geo, [face, side]); root.add(m); return m;
    });
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const k = new THREE.DirectionalLight(0xffffff, 2.6); k.position.set(4, 6, 8); scene.add(k);
    const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(-6, -2, -4); scene.add(rim);

    let px = 0, py = 0, tx = 0, ty = 0, raf = 0, visible = true;
    const move = (e: PointerEvent) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; };
    addEventListener('pointermove', move, { passive: true });
    const t0 = performance.now();
    const ease = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2); // аздап «серпілетін» шығу
    const pose = (now: number) => {
      const t = reduce ? 1 : Math.min(1, (now - t0) / 1400), e = ease(t);
      parts[0].position.y = (1 - e) * 3.2; parts[1].position.y = -(1 - e) * 3.2;
      parts[0].rotation.z = (1 - e) * 0.5; parts[1].rotation.z = -(1 - e) * 0.5;
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      const idle = reduce ? 0 : Math.sin(now / 2400) * 0.45;
      root.rotation.set(-0.32 + py * 0.5, 0.55 + idle + px * 0.9 - (1 - e) * 1.2, 0);
      r.render(scene, cam);
    };
    const loop = (now: number) => { if (!visible || document.hidden) return; pose(now); if (!reduce) raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) raf = requestAnimationFrame(loop); });
    io.observe(cv);
    const vis = () => { if (!document.hidden && visible) raf = requestAnimationFrame(loop); };
    document.addEventListener('visibilitychange', vis);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', vis); mq.removeEventListener('change', tint);
      parts.forEach((m) => m.geometry.dispose()); face.dispose(); side.dispose(); r.dispose();
    };
  }, [size]);
  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size }} aria-hidden />;
}
