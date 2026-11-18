// Сөзсіз 3D видеолардың ортақ бөлшектері (three.js).
// Әр сахна: import { ... } from './kit.js' → өз құбылысын жазады → window.renderFrame = (t) => { ...; return st.render(); }; ready();
// Стиль: ашық сұр фон, ағаш үстел (беті y = 0), 1280×720, 18 с; мәтін жоқ — тек белгілер (mg, F_A, l₁ ...) мен өлшеуіш мәні.
import * as THREE from 'three';
export { THREE };
export const W = 1280, H = 720, DUR = 18;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export { V };

// ── уақыт сызығы ──
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
/** a→b аралығында 0→1 (тегіс) */
export const seg = (t, a, b) => ease((t - a) / (b - a));
/** a→b пайда болады, c→d жоғалады */
export const win = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d));
export const lerp = (a, b, k) => a + (b - a) * k;
/** физиканы бір рет алдын ала есептеу: step(state, t, dt) → кез келген t үшін күйді алу */
export function simulate(state, step, { dt = 1 / 600, T = DUR } = {}) {
  const out = [], every = Math.round(1 / 120 / dt);
  for (let i = 0, t = 0; t <= T + 0.05; i++, t += dt) { if (i % every === 0) out.push({ ...state }); step(state, t, dt); }
  return (t) => out[Math.min(out.length - 1, Math.max(0, Math.round(t * 120)))];
}

// ── материалдар ──
export const mat = {
  metal: new THREE.MeshStandardMaterial({ color: '#7c8796', metalness: 0.7, roughness: 0.35 }),
  dark: new THREE.MeshStandardMaterial({ color: '#3a3f4a', roughness: 0.6 }),
  brass: new THREE.MeshStandardMaterial({ color: '#c08a3e', metalness: 0.8, roughness: 0.3 }),
  wood: new THREE.MeshStandardMaterial({ color: '#c99d6b', roughness: 0.7 }),
  woodDark: new THREE.MeshStandardMaterial({ color: '#a77f52', roughness: 0.8 }),
  white: new THREE.MeshStandardMaterial({ color: '#f4f6f9', roughness: 0.4 }),
  glass: () => new THREE.MeshPhysicalMaterial({ color: '#dfefff', transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
  water: () => new THREE.MeshPhysicalMaterial({ color: '#2f8fe0', transparent: true, opacity: 0.5, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
  waterTop: () => new THREE.MeshPhysicalMaterial({ color: '#7cc4ff', transparent: true, opacity: 0.55, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
};
export function mesh(geo, m, { shadow = true, parent, pos, rot } = {}) {
  const o = new THREE.Mesh(geo, m); o.castShadow = shadow; o.receiveShadow = true;
  if (pos) o.position.set(...pos); if (rot) o.rotation.set(...rot); if (parent) parent.add(o); return o;
}

// ── сахна: жарық, еден, ағаш үстел, HUD ──
export function stage({ table = [5.2, 2.6], fog = [12, 22], shadow = 4, bg = '#eef2f7' } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H); renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg); scene.fog = new THREE.Fog(bg, fog[0], fog[1]);
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.05, 60);
  scene.add(new THREE.HemisphereLight('#ffffff', '#c9d3e0', 1.1));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.position.set(3, 6, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -shadow, right: shadow, top: shadow, bottom: -shadow, near: 1, far: 15 });
  sun.shadow.radius = 4; sun.shadow.bias = -0.0005; scene.add(sun);
  const fill = new THREE.DirectionalLight('#dbe8ff', 0.6); fill.position.set(-4, 3, -2); scene.add(fill);
  let floor = null, top = null;
  if (table) { // table: false — үстелсіз (ғарыш т.б.)
    floor = mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#e4e9f0', roughness: 1 }), { shadow: false, parent: scene, pos: [0, -0.9, 0], rot: [-Math.PI / 2, 0, 0] });
    const [tw, td] = table;
    top = mesh(new THREE.BoxGeometry(tw, 0.16, td), mat.wood, { parent: scene, pos: [0, -0.08, 0] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.12, 0.74, 0.12), mat.woodDark, { parent: scene, pos: [sx * (tw / 2 - 0.2), -0.53, sz * (td / 2 - 0.2)] });
  }
  // HUD: пиксель координатасы (0,0 — сол жақ төменгі бұрыш)
  const hud = new THREE.Scene(), hudCam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
  return {
    renderer, scene, camera, hud, sun, floor, top,
    render() {
      renderer.autoClear = true; renderer.render(scene, camera);
      if (hud.children.length) { renderer.autoClear = false; renderer.clearDepth(); renderer.render(hud, hudCam); }
      return renderer.domElement.toDataURL('image/jpeg', 0.93);
    },
  };
}

// ── камера: баяу айналу ──
/** ang — орташа бұрыш (рад, 0 = алдынан), swing — тербелу амплитудасы, rad — қашықтық, y — биіктік, look — қарайтын нүкте */
export function orbit(camera, t, { ang = -0.5, swing = 0.3, rad = 8.6, y = 2.8, look = [0, 1, 0], cx = 0, cz = 0 } = {}) {
  const a = ang + swing * Math.sin((t / DUR) * Math.PI * 2);
  camera.position.set(cx + Math.sin(a) * rad, y, cz + Math.cos(a) * rad);
  camera.lookAt(...look);
}

// ── штатив: табан, тірек, жылжымалы иін ──
export function stand(scene, { x = -1.35, z = -0.2, h = 3.9, arm = 1.4, dir = 1 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, h, 24), mat.metal, { parent: g, pos: [0, h / 2, 0] });
  mesh(new THREE.BoxGeometry(0.7, 0.06, 0.5), mat.metal, { parent: g, pos: [0, 0.03, 0] });
  const a = new THREE.Group(); g.add(a);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, arm, 16), mat.metal, { parent: a, pos: [dir * arm / 2, 0, 0], rot: [0, 0, Math.PI / 2] });
  mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), mat.metal, { parent: a });
  const tip = mesh(new THREE.TorusGeometry(0.035, 0.01, 8, 20), mat.metal, { parent: a, pos: [dir * (arm - 0.05), -0.04, 0] });
  return { g, arm: a, setArmY(y) { a.position.y = y; }, tipWorld: () => V(x + dir * (arm - 0.05), a.position.y - 0.075, z) };
}

// ── спираль серіппе ──
export function spring(parent, { turns = 14, r = 0.07, tube = 0.012, m = mat.brass } = {}) {
  const o = new THREE.Mesh(new THREE.BufferGeometry(), m); o.castShadow = true; parent.add(o);
  let last = -1;
  o.setLength = (len) => {
    if (Math.abs(len - last) < 1e-4) return; last = len;
    const pts = [];
    for (let i = 0; i <= 400; i++) { const a = i / 400; pts.push(V(Math.cos(a * turns * 2 * Math.PI) * r, -a * len, Math.sin(a * turns * 2 * Math.PI) * r)); }
    o.geometry.dispose(); o.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, tube, 8, false);
  };
  return o;
}

// ── ілгегі бар жүк (100 г), бас жағы = ілгек ұшы (0), денесі төмен ──
export function hookMass(parent, { r = 0.085, h = 0.16, color = '#5d6675' } = {}) {
  const g = new THREE.Group(); parent.add(g);
  const m = new THREE.MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.35 });
  mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 20), mat.metal, { parent: g, pos: [0, -0.03, 0] });
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8), mat.metal, { parent: g, pos: [0, -0.07, 0] });
  mesh(new THREE.CylinderGeometry(r, r, h, 32), m, { parent: g, pos: [0, -0.095 - h / 2, 0] });
  const hk = mesh(new THREE.TorusGeometry(0.028, 0.008, 8, 20, Math.PI * 1.3), mat.metal, { parent: g, pos: [0, -0.095 - h - 0.03, 0], rot: [0, 0, Math.PI * 0.85] });
  g.userData.len = 0.095 + h + 0.06; // келесі жүк ілінетін нүктеге дейінгі ұзындық
  return g;
}

// ── шыны тікбұрышты ыдыс пен су (су деңгейі, толқын) ──
export function tank(scene, { w = 1.5, h = 1.45, d = 1.0, x = 0, z = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.glass()); glass.position.y = h / 2; glass.renderOrder = 3; g.add(glass);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), new THREE.LineBasicMaterial({ color: '#9fb6cf' })); e.position.y = h / 2; g.add(e);
  mesh(new THREE.BoxGeometry(w + 0.04, 0.05, d + 0.04), new THREE.MeshStandardMaterial({ color: '#b8c7d8', roughness: 0.3 }), { parent: g, pos: [0, 0.025, 0] });
  const water = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 1, d - 0.04), mat.water()); water.renderOrder = 2; g.add(water);
  const surf = waterSurface(g, w - 0.04, d - 0.04);
  return { g, water, surf, setLevel(level, t, amp = 0.003) { water.scale.y = level; water.position.y = 0.05 + level / 2 - 0.025; surf.set(0.025 + level, t, amp); } };
}
/** тікбұрышты су беті: set(y, t, amp) — шеңбер толқыны ортадан */
export function waterSurface(parent, w, d, { cx = 0, cz = 0 } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, 40, 28), base = geo.attributes.position.array.slice();
  const s = new THREE.Mesh(geo, mat.waterTop()); s.rotation.x = -Math.PI / 2; s.renderOrder = 2; parent.add(s);
  s.set = (y, t, amp = 0.003) => {
    s.position.set(cx, y, cz); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const a = base[i * 3], b = base[i * 3 + 1], r = Math.hypot(a, b); p.setZ(i, amp * Math.sin(r * 22 - t * 7) / (1 + r * 5) + 0.003 * Math.sin(a * 9 + t * 1.3) * Math.cos(b * 7 + t)); }
    p.needsUpdate = true; geo.computeVertexNormals();
  };
  return s;
}

// ── күш бағыттамасы: set(from, dir, len, opacity) ──
const UP = V(0, 1, 0);
export function arrow(scene, color, { r = 0.03 } = {}) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, transparent: true, depthTest: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 16), m), head = new THREE.Mesh(new THREE.ConeGeometry(r * 2.5, r * 6, 20), m);
  shaft.renderOrder = head.renderOrder = 9; g.add(shaft, head); scene.add(g);
  const hl = r * 6;
  g.set = (from, dir, len, op = 1) => {
    g.visible = op > 0.01 && len > 0.02; m.opacity = op; if (!g.visible) return;
    const L = Math.max(0.01, len - hl);
    shaft.scale.y = L; shaft.position.y = L / 2; head.position.y = L + hl / 2;
    g.position.copy(from); g.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
  };
  return g;
}

// ── белгі: mg, F_A, l₁ (курсив, астыңғы индекс) ──
export function label(scene, txt, sub = '', color = '#1b2230', { size = 0.5, parent } = {}) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.font = 'italic bold 84px Georgia'; const w = x.measureText(txt).width; x.font = 'italic bold 48px Georgia'; const ws = sub ? x.measureText(sub).width : 0;
  const x0 = Math.max(4, (256 - w - ws) / 2);
  x.lineJoin = 'round'; x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 10;
  x.font = 'italic bold 84px Georgia'; x.strokeText(txt, x0, 92); x.fillStyle = color; x.fillText(txt, x0, 92);
  if (sub) { x.font = 'italic bold 48px Georgia'; x.strokeText(sub, x0 + w + 2, 112); x.fillText(sub, x0 + w + 2, 112); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(size, size / 2, 1); s.renderOrder = 10;
  (parent || scene).add(s);
  s.show = (pos, op = 1) => { s.position.copy(pos); s.material.opacity = op; s.visible = op > 0.01; };
  return s;
}

// ── өлшеуіштің мәні (мысалы «2,4 Н», «3 см»): set(text) ──
export function readout(scene, { color = '#1f6fd0', w = 0.95 } = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(w, w * 0.3125, 1); s.renderOrder = 11; scene.add(s);
  let last = null;
  s.set = (txt, op = 1) => {
    s.material.opacity = op; s.visible = op > 0.01;
    if (txt === last) return; last = txt;
    x.clearRect(0, 0, 512, 160); x.fillStyle = 'rgba(255,255,255,0.92)'; x.beginPath(); x.roundRect(8, 8, 496, 144, 36); x.fill();
    x.strokeStyle = color; x.lineWidth = 6; x.stroke();
    x.fillStyle = '#1b2230'; x.font = 'bold 96px Arial'; x.textAlign = 'center'; x.fillText(txt, 256, 112); t.needsUpdate = true;
  };
  return s;
}
export const num = (v, d = 1) => v.toFixed(d).replace('.', ',');

// ── динамометр: корпус + шкала + серіппе + ілгек; set(F) → ілгектің төменгі нүктесі (жергілікті y) ──
export function dynamometer(parent, { max = 8, K = 0.055 } = {}) {
  const g = new THREE.Group(); parent.add(g);
  mesh(new THREE.BoxGeometry(0.3, 1.0, 0.08), mat.white, { parent: g });
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 512; const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.96), new THREE.MeshBasicMaterial({ map: tex })); face.position.z = 0.041; g.add(face);
  const sp = spring(g); sp.position.y = -0.5;
  const hook = mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 24, Math.PI * 1.4), mat.metal, { parent: g });
  let last = null;
  g.set = (F) => {
    const step = 448 / (max * 10);
    if (F !== last) {
      last = F; cx.fillStyle = '#fff'; cx.fillRect(0, 0, 128, 512);
      cx.strokeStyle = cx.fillStyle = '#1b2230'; cx.font = 'bold 26px Arial'; cx.textAlign = 'right';
      for (let i = 0; i <= max * 10; i++) { const y = 30 + i * step; cx.lineWidth = i % 10 ? 1.5 : 3; cx.beginPath(); cx.moveTo(78, y); cx.lineTo(i % 10 ? 100 : 112, y); cx.stroke(); if (i % 10 === 0) cx.fillText(String(i / 10), 70, y + 9); }
      const y = 30 + F * step * 10; cx.fillStyle = '#e5483a'; cx.beginPath(); cx.moveTo(114, y); cx.lineTo(126, y - 9); cx.lineTo(126, y + 9); cx.fill(); cx.fillRect(76, y - 2, 40, 4);
      tex.needsUpdate = true;
    }
    const sl = 0.25 + K * F; sp.setLength(sl); hook.position.y = -0.5 - sl - 0.04; return -0.5 - sl - 0.09;
  };
  return g;
}

// ── сызғыш/шкала (canvas текстура): vertical ұзындығы len, n бөлік, every сайын сан ──
export function ruler(parent, { len = 1, n = 10, every = 1, vertical = true, width = 0.12, color = '#fbf3d9', from = 0, flip = false, text } = {}) {
  const L = 1024, S = 128, c = document.createElement('canvas'); c.width = vertical ? S : L; c.height = vertical ? L : S; const x = c.getContext('2d');
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); x.strokeStyle = x.fillStyle = '#1b2230'; x.font = 'bold ' + (vertical ? 46 : 40) + 'px Arial'; x.textAlign = 'center';
  for (let i = 0; i <= n; i++) {
    const p = 12 + (i / n) * (L - 24), big = i % every === 0; x.lineWidth = big ? 5 : 2.5; x.beginPath();
    if (vertical) { x.moveTo(0, p); x.lineTo(big ? 52 : 30, p); x.stroke(); if (big) x.fillText(text ? text(i) : String(from + (flip ? n - i : i)), 92, p + 14); }
    else { x.moveTo(p, 0); x.lineTo(p, big ? 52 : 30); x.stroke(); if (big) x.fillText(text ? text(i) : String(from + i), p, 100); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const geo = vertical ? new THREE.BoxGeometry(width, len * (L / (L - 24)), 0.015) : new THREE.BoxGeometry(len * (L / (L - 24)), width, 0.015);
  const side = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const m = new THREE.Mesh(geo, [side, side, side, side, new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), side]); m.castShadow = true; parent.add(m);
  return m;
}

/** HUD-тағы кішкене график: points [[x,y]...] (0..1), осьтер белгісі ax, ay */
export function hudGraph(hud, { x = 960, y = 420, w = 280, h = 230, ax = ['x', ''], ay = ['F', ''], color = '#1f6fd0' } = {}) {
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); s.position.set(x + w / 2, y + h / 2, 0); hud.add(s);
  let last = '';
  s.draw = (pts, lineK = 0, op = 1) => {
    s.material.opacity = op; s.visible = op > 0.01;
    const key = JSON.stringify(pts) + lineK; if (key === last) return; last = key;
    const X0 = 70, Y0 = h * 2 - 60, PW = w * 2 - 110, PH = h * 2 - 110;
    g.clearRect(0, 0, c.width, c.height); g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.roundRect(4, 4, c.width - 8, c.height - 8, 28); g.fill();
    g.strokeStyle = '#1b2230'; g.lineWidth = 4; g.beginPath(); g.moveTo(X0, 40); g.lineTo(X0, Y0); g.lineTo(X0 + PW + 20, Y0); g.stroke();
    g.fillStyle = '#1b2230'; g.beginPath(); g.moveTo(X0, 26); g.lineTo(X0 - 10, 50); g.lineTo(X0 + 10, 50); g.fill();
    g.beginPath(); g.moveTo(X0 + PW + 34, Y0); g.lineTo(X0 + PW + 10, Y0 - 10); g.lineTo(X0 + PW + 10, Y0 + 10); g.fill();
    g.font = 'italic bold 44px Georgia'; g.fillText(ay[0], X0 - 52, 60); g.font = 'italic bold 26px Georgia'; g.fillText(ay[1], X0 - 24, 72);
    g.font = 'italic bold 44px Georgia'; g.fillText(ax[0], X0 + PW - 10, Y0 + 50); g.font = 'italic bold 26px Georgia'; g.fillText(ax[1], X0 + PW + 26, Y0 + 56);
    if (lineK > 0) { g.strokeStyle = color; g.globalAlpha = 0.6; g.lineWidth = 5; g.beginPath(); g.moveTo(X0, Y0); g.lineTo(X0 + PW * lineK, Y0 - PH * lineK); g.stroke(); g.globalAlpha = 1; }
    g.fillStyle = color; for (const [a, b] of pts) { g.beginPath(); g.arc(X0 + PW * a, Y0 - PH * b, 12, 0, 7); g.fill(); }
    t.needsUpdate = true;
  };
  return s;
}


// ── электрондық таразы: беті y = 0.09 (жергілікті), set(text) — дисплейдегі мән ──
export function scaleLCD(parent, { w = 0.6, d = 0.5 } = {}) {
  const g = new THREE.Group(); parent.add(g);
  mesh(new THREE.BoxGeometry(w, 0.07, d), new THREE.MeshStandardMaterial({ color: '#e9edf2', roughness: 0.5 }), { parent: g, pos: [0, 0.035, 0] });
  mesh(new THREE.CylinderGeometry(w * 0.36, w * 0.36, 0.02, 40), new THREE.MeshStandardMaterial({ color: '#c3cad3', metalness: 0.3, roughness: 0.35 }), { parent: g, pos: [0, 0.08, -0.03] });
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.55, w * 0.2), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
  lcd.position.set(0, 0.04, d / 2 + 0.002); g.add(lcd);
  let last = null;
  g.set = (txt) => { if (txt === last) return; last = txt; x.fillStyle = '#c9dcc0'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#1b2a1b'; x.font = 'bold 64px Arial'; x.textAlign = 'right'; x.fillText(txt, 240, 72); t.needsUpdate = true; };
  g.set('0 г'); g.top = 0.09; return g;
}
/** өлшеуіш цилиндр (мензурка): r, h, ml — шкаланың жоғарғы мәні, step — сызық аралығы (мл); setLevel(мл, t, amp) */
export function cylinder(parent, { r = 0.2, h = 1.4, ml = 100, step = 10, x = 0, z = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const H0 = 0.06, per = (h - 0.16) / ml; // 1 мл биіктігі
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true), mat.glass()); glass.position.y = h / 2 + H0; glass.renderOrder = 3; g.add(glass);
  mesh(new THREE.CylinderGeometry(r * 1.6, r * 1.7, H0, 40), new THREE.MeshStandardMaterial({ color: '#b8c7d8', roughness: 0.3 }), { parent: g, pos: [0, H0 / 2, 0] });
  mesh(new THREE.TorusGeometry(r, 0.006, 8, 48), new THREE.MeshStandardMaterial({ color: '#9fb6cf' }), { parent: g, pos: [0, h + H0, 0], rot: [Math.PI / 2, 0, 0], shadow: false });
  // шкала: алдыңғы бетінде сызықтар мен сандар (canvas → иілген жолақ)
  const c = document.createElement('canvas'); c.width = 128; c.height = 1024; const x2 = c.getContext('2d');
  x2.strokeStyle = x2.fillStyle = '#1b2a3a'; x2.font = 'bold 34px Arial'; x2.textAlign = 'left';
  const n = ml / step * 2, yOf = (v) => 1024 - (v / ml) * 1024 * (ml * per) / (h - 0.06);
  for (let i = 0; i <= n; i++) { const v = (i / n) * ml, y = yOf(v); x2.lineWidth = i % 2 ? 2 : 4; x2.beginPath(); x2.moveTo(0, y); x2.lineTo(i % 2 ? 26 : 46, y); x2.stroke(); if (i % 2 === 0 && v > 0) x2.fillText(String(v), 52, y + 12); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.003, r + 0.003, h - 0.06, 32, 1, true, -0.35, 0.7), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  sc.position.y = H0 + (h - 0.06) / 2; sc.renderOrder = 5; g.add(sc);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.008, r - 0.008, 1, 40), mat.water()); water.renderOrder = 2; g.add(water);
  const top = new THREE.Mesh(new THREE.CircleGeometry(r - 0.008, 40), mat.waterTop()); top.rotation.x = -Math.PI / 2; top.renderOrder = 2; g.add(top);
  g.yOf = (v) => H0 + v * per;
  g.setLevel = (v, t2 = 0, amp = 0) => { const y = v * per; water.scale.y = Math.max(0.001, y); water.position.y = H0 + y / 2; top.position.y = H0 + y + amp * Math.sin(t2 * 9); };
  return g;
}


/** HUD-тағы график (бірнеше қисық): plot.draw([{pts:[[x,y]...] (0..1), color, label}], op) */
export function hudPlot(hud, { x = 940, y = 380, w = 300, h = 260, ax = ['t', ''], ay = ['s', ''] } = {}) {
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); s.position.set(x + w / 2, y + h / 2, 0); hud.add(s);
  let last = '';
  s.draw = (series, op = 1) => {
    s.material.opacity = op; s.visible = op > 0.01;
    const key = JSON.stringify(series); if (key === last) return; last = key;
    const X0 = 70, Y0 = h * 2 - 60, PW = w * 2 - 110, PH = h * 2 - 110;
    g.clearRect(0, 0, c.width, c.height); g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.roundRect(4, 4, c.width - 8, c.height - 8, 28); g.fill();
    g.strokeStyle = '#1b2230'; g.lineWidth = 4; g.beginPath(); g.moveTo(X0, 40); g.lineTo(X0, Y0); g.lineTo(X0 + PW + 20, Y0); g.stroke();
    g.fillStyle = '#1b2230'; g.beginPath(); g.moveTo(X0, 26); g.lineTo(X0 - 10, 50); g.lineTo(X0 + 10, 50); g.fill();
    g.beginPath(); g.moveTo(X0 + PW + 34, Y0); g.lineTo(X0 + PW + 10, Y0 - 10); g.lineTo(X0 + PW + 10, Y0 + 10); g.fill();
    g.font = 'italic bold 44px Georgia'; g.fillText(ay[0], X0 - 52, 60); g.fillText(ax[0], X0 + PW - 4, Y0 + 50);
    g.font = 'italic bold 26px Georgia'; if (ay[1]) g.fillText(ay[1], X0 - 24, 72); if (ax[1]) g.fillText(ax[1], X0 + PW + 22, Y0 + 56);
    for (const sr of series) {
      if (!sr.pts.length) continue;
      g.strokeStyle = sr.color; g.lineWidth = 7; g.lineJoin = g.lineCap = 'round'; g.beginPath();
      sr.pts.forEach(([a, b], i) => (i ? g.lineTo : g.moveTo).call(g, X0 + PW * a, Y0 - PH * b)); g.stroke();
      if (sr.label) { const [a, b] = sr.pts[sr.pts.length - 1]; g.fillStyle = sr.color; g.font = 'italic bold 36px Georgia'; g.fillText(sr.label, X0 + PW * a + 10, Y0 - PH * b - 8); }
    }
    t.needsUpdate = true;
  };
  return s;
}
/** HUD-тағы бағандар (энергия): bars.draw([{v (0..1), color, label, sub}], op) */
export function hudBars(hud, { x = 980, y = 380, w = 260, h = 300 } = {}) {
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); s.position.set(x + w / 2, y + h / 2, 0); hud.add(s);
  s.draw = (bars, op = 1) => {
    s.material.opacity = op; s.visible = op > 0.01;
    g.clearRect(0, 0, c.width, c.height); g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.roundRect(4, 4, c.width - 8, c.height - 8, 28); g.fill();
    const n = bars.length, bw = (c.width - 80) / n, base = c.height - 90, top = 40;
    bars.forEach((b, i) => {
      const x0 = 40 + i * bw + bw * 0.18, ww = bw * 0.64, hh = (base - top) * Math.max(0, Math.min(1, b.v));
      g.fillStyle = '#eef1f5'; g.fillRect(x0, top, ww, base - top); g.fillStyle = b.color; g.fillRect(x0, base - hh, ww, hh);
      g.fillStyle = b.color; g.font = 'italic bold 46px Georgia'; g.textAlign = 'center'; g.fillText(b.label, x0 + ww / 2 - 8, base + 56);
      if (b.sub) { g.font = 'italic bold 28px Georgia'; g.fillText(b.sub, x0 + ww / 2 + 22, base + 68); }
    });
    g.strokeStyle = '#1b2230'; g.lineWidth = 3; g.beginPath(); g.moveTo(30, base); g.lineTo(c.width - 30, base); g.stroke(); g.textAlign = 'left';
    t.needsUpdate = true;
  };
  return s;
}

/** Химиялық стақан: beaker(scene,{r,h,x,z}).setLevel(y, color?) — сұйық биіктігі (м-бірлік) */
export function beaker(parent, { r = 0.22, h = 0.5, x = 0, z = 0, y = 0, color = '#2f8fe0', op = 0.45 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, h, 48, 1, true), mat.glass()); glass.position.y = h / 2; glass.renderOrder = 4; g.add(glass);
  const bot = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 48), mat.glass()); bot.rotation.x = -Math.PI / 2; bot.position.y = 0.004; g.add(bot);
  mesh(new THREE.TorusGeometry(r, 0.006, 8, 48), new THREE.MeshStandardMaterial({ color: '#cfe0f0' }), { parent: g, pos: [0, h, 0], rot: [Math.PI / 2, 0, 0], shadow: false });
  const lm = new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: op, roughness: 0.1, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.008, r * 0.97 - 0.008, 1, 40), lm); liq.renderOrder = 2; g.add(liq);
  const tm = new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: Math.min(1, op + 0.15), roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
  const top = new THREE.Mesh(new THREE.CircleGeometry(r - 0.008, 40), tm); top.rotation.x = -Math.PI / 2; top.renderOrder = 2; g.add(top);
  g.liq = liq; g.lm = lm; g.tm = tm; g.r = r; g.h = h;
  g.setLevel = (lv, col) => { liq.scale.y = Math.max(0.001, lv); liq.position.y = lv / 2 + 0.004; top.position.y = lv + 0.005; liq.visible = top.visible = lv > 0.003; if (col) { lm.color.set(col); tm.color.set(col); } };
  g.setLevel(h * 0.7);
  return g;
}
/** Термометр: thermometer(parent,{min,max,len}).set(T) — қызыл бағана; шкала 10° сайын */
export function thermometer(parent, { min = -20, max = 110, len = 0.8, every = 10, x = 0, y = 0, z = 0 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 16, 1, true), mat.glass()); tube.position.y = len / 2; tube.renderOrder = 6; g.add(tube);
  mesh(new THREE.SphereGeometry(0.028, 20, 14), new THREE.MeshStandardMaterial({ color: '#e5322d', roughness: 0.3 }), { parent: g, shadow: false });
  const col = mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 10), new THREE.MeshStandardMaterial({ color: '#e5322d', roughness: 0.3, emissive: '#7a0d0a', emissiveIntensity: 0.3 }), { parent: g, shadow: false });
  const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x2 = c.getContext('2d'); x2.fillStyle = 'rgba(255,255,255,0.92)'; x2.fillRect(0, 0, 64, 512);
  x2.strokeStyle = x2.fillStyle = '#1b2230'; x2.font = 'bold 18px Arial'; x2.textAlign = 'right';
  const lo = 0.06, hi = len - 0.03, yOfT = (T) => lo + (T - min) / (max - min) * (hi - lo);
  for (let T = Math.ceil(min / 5) * 5; T <= max; T += 5) { const yy = 512 - yOfT(T) / len * 512; const big = T % every === 0; x2.lineWidth = big ? 3 : 1.5; x2.beginPath(); x2.moveTo(64, yy); x2.lineTo(big ? 40 : 50, yy); x2.stroke(); if (big && T % (every * 2) === 0) x2.fillText(String(T), 38, yy + 6); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.06, len), new THREE.MeshBasicMaterial({ map: tx })); sc.position.set(-0.05, len / 2, 0); g.add(sc);
  g.set = (T) => { const yy = yOfT(Math.max(min, Math.min(max, T))); col.scale.y = yy; col.position.y = yy / 2; };
  g.set(20); return g;
}
/** Электр плитасы: hotplate(scene,{x,z}).set(k) — 0..1 қызу (спираль қызарады) */
export function hotplate(parent, { x = 0, z = 0, w = 0.5 } = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  mesh(new THREE.BoxGeometry(w, 0.1, w), new THREE.MeshStandardMaterial({ color: '#e9edf2', roughness: 0.5 }), { parent: g, pos: [0, 0.05, 0] });
  const hm = new THREE.MeshStandardMaterial({ color: '#3a3f4a', roughness: 0.5, emissive: '#ff3b1a', emissiveIntensity: 0 });
  mesh(new THREE.CylinderGeometry(w * 0.38, w * 0.38, 0.02, 40), hm, { parent: g, pos: [0, 0.11, 0] });
  const ring = mesh(new THREE.TorusGeometry(w * 0.26, 0.012, 8, 40), new THREE.MeshStandardMaterial({ color: '#552', emissive: '#ff5a1f', emissiveIntensity: 0 }), { parent: g, pos: [0, 0.122, 0], rot: [Math.PI / 2, 0, 0], shadow: false });
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), mat.dark, { parent: g, pos: [w * 0.38, 0.05, w / 2 + 0.01], rot: [Math.PI / 2, 0, 0] });
  g.top = 0.12;
  g.set = (k) => { hm.emissiveIntensity = 0.5 * k; ring.material.emissiveIntensity = 1.6 * k; };
  return g;
}

/** Өлшеуіш аспап (амперметр/вольтметр): meter(parent,{max,sym}).set(v) — тілше */
export function meter(parent, { max = 1, sym = 'A', step, x = 0, y = 0, z = 0, size = 0.36, color = '#1f6fd0' } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  mesh(new THREE.BoxGeometry(size, size * 0.8, 0.1), new THREE.MeshStandardMaterial({ color: '#f4f6f9', roughness: 0.4 }), { parent: g, pos: [0, size * 0.4, 0] });
  const c = document.createElement('canvas'); c.width = 256; c.height = 200; const x2 = c.getContext('2d');
  x2.fillStyle = '#fffdf6'; x2.fillRect(0, 0, 256, 200); x2.strokeStyle = x2.fillStyle = '#1b2230'; x2.lineWidth = 3;
  const cx = 128, cy = 170, R = 120, A0 = Math.PI * 1.17, A1 = Math.PI * 1.83, st2 = step || max / 5;
  x2.beginPath(); x2.arc(cx, cy, R - 10, A0, A1); x2.stroke(); x2.font = 'bold 20px Arial'; x2.textAlign = 'center';
  for (let v = 0, i = 0; v <= max + 1e-9; v += st2 / 2, i++) { const a = A0 + (A1 - A0) * v / max, big = i % 2 === 0; x2.lineWidth = big ? 3 : 1.5;
    x2.beginPath(); x2.moveTo(cx + Math.cos(a) * (R - 10), cy + Math.sin(a) * (R - 10)); x2.lineTo(cx + Math.cos(a) * (R - (big ? 26 : 20)), cy + Math.sin(a) * (R - (big ? 26 : 20))); x2.stroke();
    if (big) x2.fillText(String(Math.round(v * 100) / 100).replace('.', ','), cx + Math.cos(a) * (R - 44), cy + Math.sin(a) * (R - 44) + 7); }
  x2.font = 'bold 44px Georgia'; x2.fillStyle = color; x2.fillText(sym, cx, cy - 10);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.9, size * 0.7), new THREE.MeshBasicMaterial({ map: tx })); face.position.set(0, size * 0.42, 0.051); g.add(face);
  const nd = new THREE.Group(); nd.position.set(0, size * 0.42 - size * 0.35 + size * 0.7 * (30 / 200), 0.055); g.add(nd);
  mesh(new THREE.BoxGeometry(0.006, size * 0.5, 0.004), new THREE.MeshBasicMaterial({ color: '#e5322d' }), { parent: nd, pos: [0, size * 0.25, 0], shadow: false });
  for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 12), new THREE.MeshStandardMaterial({ color: sx < 0 ? '#1b2230' : '#e5322d' }), { parent: g, pos: [sx * size * 0.32, size * 0.8 + 0.02, 0] });
  g.set = (v) => { const k = Math.max(0, Math.min(1.02, v / max)); nd.rotation.z = (0.33 - 0.66 * k) * Math.PI; };
  g.term = (sx) => V(g.position.x + sx * size * 0.32, g.position.y + size * 0.8 + 0.04, g.position.z);
  g.set(0); return g;
}
/** Сым: wire(scene, [V...], {r, color}) → .flow(n, color) электрондар; .set(offset, op) */
export function wire(parent, pts, { r = 0.008, color = '#c46a2c' } = {}) {
  const curve = new THREE.CurvePath(); for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  const g = new THREE.Group(); parent.add(g);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.4 });
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], d = b.clone().sub(a), L = d.length(); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), m); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(UP, d.normalize()); g.add(c);
    const j = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m); j.position.copy(b); g.add(j); }
  g.curve = curve; g.len = curve.getLength();
  g.flow = (n, col = '#ffd23f', every = 0.06) => { const k = n || Math.max(4, Math.round(g.len / every)); const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r * 1.5, 8, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true }), k); im.renderOrder = 7; parent.add(im);
    const o = new THREE.Object3D(); im.set = (off, op = 1) => { im.material.opacity = op; im.visible = op > 0.01; for (let i = 0; i < k; i++) { const u = (((i / k + off / g.len) % 1) + 1) % 1; o.position.copy(curve.getPointAt(u)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } im.instanceMatrix.needsUpdate = true; }; return im; };
  return g;
}
/** Шам: lamp(scene,{x,y,z}).set(k) — 0..1 жарықтығы */
export function lamp(parent, { x = 0, y = 0, z = 0, s = 1 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.06, 20), mat.dark, { parent: g, pos: [0, 0.03, 0] });
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), mat.metal, { parent: g, pos: [0, 0.09, 0] });
  const gm = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, roughness: 0.05, emissive: '#ffd25a', emissiveIntensity: 0, depthWrite: false });
  const bulb = mesh(new THREE.SphereGeometry(0.06, 24, 18), gm, { parent: g, pos: [0, 0.17, 0], shadow: false }); bulb.renderOrder = 4;
  const fm = new THREE.MeshBasicMaterial({ color: '#5a4a3a' }); const fil = mesh(new THREE.TorusGeometry(0.015, 0.003, 6, 16, Math.PI), fm, { parent: g, pos: [0, 0.16, 0], shadow: false });
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 128; { const q = glowC.getContext('2d'), gr = q.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,230,140,1)'); gr.addColorStop(0.35, 'rgba(255,200,80,0.45)'); gr.addColorStop(1, 'rgba(255,180,60,0)'); q.fillStyle = gr; q.fillRect(0, 0, 128, 128); }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowC), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending })); glow.position.y = 0.17; glow.renderOrder = 8; g.add(glow);
  g.set = (k) => { k = Math.max(0, Math.min(1, k)); gm.emissiveIntensity = 1.6 * k; gm.opacity = 0.35 + 0.4 * k; fm.color.set(k > 0.05 ? '#fff2b0' : '#5a4a3a'); glow.material.opacity = k; glow.scale.setScalar(0.12 + 0.4 * k); glow.visible = k > 0.02; };
  g.term = (sx) => V(g.position.x + sx * 0.06 * s, g.position.y + 0.03 * s, g.position.z);
  g.set(0); return g;
}
/** Ток көзі (батарея): battery(scene,{x,z}) — қысқыштары: .term(-1|1) */
export function battery(parent, { x = 0, y = 0, z = 0, w = 0.34 } = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  mesh(new THREE.BoxGeometry(w, 0.16, 0.16), new THREE.MeshStandardMaterial({ color: '#2d3340', roughness: 0.5 }), { parent: g, pos: [0, 0.08, 0] });
  mesh(new THREE.BoxGeometry(w * 0.4, 0.162, 0.162), new THREE.MeshStandardMaterial({ color: '#e5a823', roughness: 0.5 }), { parent: g, pos: [w * 0.3, 0.08, 0] });
  for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 12), new THREE.MeshStandardMaterial({ color: sx < 0 ? '#1b2230' : '#e5322d', metalness: 0.4 }), { parent: g, pos: [sx * w * 0.36, 0.185, 0] });
  g.term = (sx) => V(g.position.x + sx * w * 0.36, g.position.y + 0.21, g.position.z);
  return g;
}

export const ready = () => { window.ready = true; };
