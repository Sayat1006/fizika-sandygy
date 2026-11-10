/* Сабақтас — 3D бөлшектер морфы.
 * Бір бөлшектер бұлты физикалық бейнелер арасында құйылып ауысады:
 * атом → толқын → серіппе → магнит өрісі → ғаламшар.
 * Морф шынайы: әр бөлшектің екі күйі (aFrom, aTo) шейдерде интерполяцияланады.
 * Тәуелділік: THREE (r128+) — window.THREE немесе opts.THREE. Қолдану: FSMorph.mount(canvas, { onShape }).
 * Зертхана (lab/) осы файлды тікелей импорттайды — пішіндер бір жерде ғана сипатталған.
 */
(function () {
  'use strict';
  var TAU = Math.PI * 2;

  // ───────── Детерминді кездейсоқ сан (әр жүктеуде бірдей сурет) ─────────
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ───────── Пішіндер: әрқайсысы n нүктенің (x, y, z) координатасын толтырады ─────────
  var SHAPES = {
    // Ядро және үш электрон орбитасы
    atom: function (n, out, r) {
      var core = Math.floor(n * 0.14), per = Math.floor((n - core) / 3), i = 0, k, j;
      for (j = 0; j < core; j++, i++) {
        var u = r() * 2 - 1, a = r() * TAU, rad = 0.5 * Math.cbrt(r()), s = Math.sqrt(1 - u * u);
        set(out, i, rad * s * Math.cos(a), rad * u, rad * s * Math.sin(a));
      }
      for (k = 0; k < 3; k++) {
        var tilt = k * Math.PI / 3, cnt = k === 2 ? n - i : per;
        for (j = 0; j < cnt; j++, i++) {
          var t = (j / cnt) * TAU, R = 2.55 + (r() - 0.5) * 0.05;
          var x = Math.cos(t) * R, y = Math.sin(t) * R * 0.36, z = Math.sin(t) * R * 0.93;
          set(out, i, x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt), z);
        }
      }
    },
    // Көлденең толқын беті
    wave: function (n, out) {
      var cols = Math.ceil(Math.sqrt(n * 2.4)), rows = Math.ceil(n / cols);
      for (var i = 0; i < n; i++) {
        var c = i % cols, w = Math.floor(i / cols);
        var x = (c / (cols - 1) - 0.5) * 6.2, z = (w / Math.max(1, rows - 1) - 0.5) * 2.6;
        set(out, i, x, Math.sin(x * 1.9) * 0.62 * Math.cos(z * 0.55), z);
      }
    },
    // Серіппе және оған ілінген жүк
    spring: function (n, out, r) {
      var coil = Math.floor(n * 0.74), i = 0, j;
      for (j = 0; j < coil; j++, i++) {
        var t = j / coil, a = t * TAU * 9, R = 0.78 + (r() - 0.5) * 0.05;
        set(out, i, Math.cos(a) * R, 2.5 - t * 3.4, Math.sin(a) * R);
      }
      for (; i < n; i++) {
        var u = r() * 2 - 1, b = r() * TAU, s = Math.sqrt(1 - u * u), rad = 0.72;
        set(out, i, rad * s * Math.cos(b), -1.62 + rad * u, rad * s * Math.sin(b));
      }
    },
    // Магнит дипольінің күш сызықтары: r = L·sin²θ
    field: function (n, out) {
      var shells = [0.9, 1.45, 2.05, 2.7], planes = 8, per = Math.floor(n / (shells.length * planes)), i = 0;
      for (var p = 0; p < planes; p++) {
        var phi = (p / planes) * TAU;
        for (var s = 0; s < shells.length; s++) {
          var cnt = (p === planes - 1 && s === shells.length - 1) ? n - i : per;
          for (var j = 0; j < cnt; j++, i++) {
            var th = 0.16 + (j / Math.max(1, cnt - 1)) * (Math.PI - 0.32);
            var rad = shells[s] * Math.sin(th) * Math.sin(th);
            var rho = rad * Math.sin(th);
            set(out, i, rho * Math.cos(phi), rad * Math.cos(th) * 1.15, rho * Math.sin(phi));
          }
        }
      }
    },
    // Сақинасы бар ғаламшар (Фибоначчи сферасы)
    planet: function (n, out, r) {
      var body = Math.floor(n * 0.64), i = 0, g = Math.PI * (3 - Math.sqrt(5));
      for (; i < body; i++) {
        var y = 1 - (i / (body - 1)) * 2, rad = Math.sqrt(1 - y * y), a = i * g;
        set(out, i, Math.cos(a) * rad * 1.5, y * 1.5, Math.sin(a) * rad * 1.5);
      }
      for (; i < n; i++) {
        var t = r() * TAU, R = 2.1 + r() * 0.75;
        set(out, i, Math.cos(t) * R, (r() - 0.5) * 0.04, Math.sin(t) * R);
      }
    }
  };
  var ORDER = ['atom', 'wave', 'spring', 'field', 'planet'];

  function set(out, i, x, y, z) { out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z; }

  function build(n) {
    return ORDER.map(function (name, k) {
      var a = new Float32Array(n * 3);
      SHAPES[name](n, a, rng(1000 + k));
      return a;
    });
  }

  var VERT = [
    'attribute vec3 aFrom; attribute vec3 aTo; attribute float aRand;',
    'uniform float uT; uniform float uTime; uniform float uSize; uniform float uPx;',
    'varying float vRand; varying float vDepth;',
    'void main() {',
    '  float d = aRand * 0.55;',                              // әр бөлшек сәл кешігіп қозғалады
    '  float t = clamp((uT - d) / 0.45, 0.0, 1.0);',
    '  t = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);',        // smootherstep
    '  vec3 p = mix(aFrom, aTo, t);',
    '  float arc = sin(t * 3.14159265);',                      // жол ортасында сәл шашырайды
    '  p += normalize(p + vec3(0.001)) * arc * (0.25 + aRand * 0.55);',
    '  p.y += sin(uTime * 0.9 + aRand * 6.2831) * 0.018;',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  gl_Position = projectionMatrix * mv;',
    '  vDepth = clamp((-mv.z - 7.0) / 7.0, 0.0, 1.0);',
    '  gl_PointSize = uSize * uPx * (0.7 + aRand * 0.7) * (10.0 / -mv.z);',
    '  vRand = aRand;',
    '}'
  ].join('\n');
  var FRAG = [
    'uniform vec3 uAccent; uniform vec3 uInk; uniform float uAlpha;',
    'varying float vRand; varying float vDepth;',
    'void main() {',
    '  float r = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.32, r);',
    '  if (a < 0.02) discard;',
    '  vec3 c = mix(uInk, uAccent, step(0.62, vRand));',
    '  gl_FragColor = vec4(c, a * uAlpha * (1.0 - vDepth * 0.65));',
    '}'
  ].join('\n');

  function cssColor(THREE, el, name, fallback) {
    var v = getComputedStyle(el).getPropertyValue(name).trim();
    try { return new THREE.Color(v || fallback); } catch (_) { return new THREE.Color(fallback); }
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ onShape?: (name: string, index: number) => void, hold?: number, morph?: number, THREE?: object, alpha?: number, inkVar?: string, distance?: number }} opts
   * @returns {{ next: () => void, dispose: () => void } | null}  null — WebGL жоқ
   */
  function mount(canvas, opts) {
    opts = opts || {};
    var THREE = opts.THREE || window.THREE;
    if (!THREE) return null;
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (_) { return null; }
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var small = Math.min(innerWidth, innerHeight) < 700;
    var N = small ? 1700 : 2800;
    var HOLD = opts.hold || 3.4, MORPH = opts.morph || 1.9;
    var px = Math.min(devicePixelRatio || 1, small ? 1.5 : 2);
    renderer.setPixelRatio(px);

    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    cam.position.set(0, 0, opts.distance || 11.5);
    var shapes = build(N);
    var rand = new Float32Array(N), r = rng(7);
    for (var i = 0; i < N; i++) rand[i] = r();

    var geo = new THREE.BufferGeometry();
    var from = new THREE.BufferAttribute(new Float32Array(shapes[0]), 3);
    var to = new THREE.BufferAttribute(new Float32Array(shapes[0]), 3);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); // тек шекара есебі үшін
    geo.setAttribute('aFrom', from);
    geo.setAttribute('aTo', to);
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
    var mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
      uniforms: {
        uT: { value: 1 }, uTime: { value: 0 }, uSize: { value: small ? 5.2 : 4.6 }, uPx: { value: px },
        uAccent: { value: new THREE.Color('#0071E3') }, uInk: { value: new THREE.Color('#1D1D1F') }, uAlpha: { value: opts.alpha || 0.9 }
      }
    });
    var points = new THREE.Points(geo, mat);
    var group = new THREE.Group();
    group.add(points);
    group.rotation.set(0.28, -0.4, 0);
    scene.add(group);

    // Жаңа three.js түсті сызықтық кеңістікте сақтайды; шейдер sRGB мәнін тікелей шығаратындықтан кері түрлендіреміз
    var managed = !!(THREE.ColorManagement && THREE.ColorManagement.enabled);
    function col(name, fallback) {
      var c = cssColor(THREE, canvas, name, fallback);
      return managed && c.convertLinearToSRGB ? c.convertLinearToSRGB() : c;
    }
    function theme() {
      mat.uniforms.uAccent.value.copy(col('--accent', '#0071E3'));
      mat.uniforms.uInk.value.copy(col(opts.inkVar || '--fg-3', '#86868B'));
    }
    theme();
    var mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', theme);
    // data-theme ауысқанда да түстерді жаңарту
    var mo = new MutationObserver(theme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function size() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    size();
    addEventListener('resize', size);

    var idx = 0, phase = 'hold', clock = 0, time = 0;
    function go(nextIdx) {
      from.array.set(shapes[idx]); from.needsUpdate = true;
      idx = nextIdx;
      to.array.set(shapes[idx]); to.needsUpdate = true;
      mat.uniforms.uT.value = 0;
      phase = 'morph'; clock = 0;
      if (opts.onShape) opts.onShape(ORDER[idx], idx);
    }
    function next() { if (phase === 'hold') go((idx + 1) % ORDER.length); }
    if (opts.onShape) opts.onShape(ORDER[0], 0);

    var tx = 0, ty = 0, mx = 0, my = 0;
    function onMove(e) { tx = (e.clientX / innerWidth - 0.5) * 0.5; ty = (e.clientY / innerHeight - 0.5) * 0.35; }
    addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('click', next);

    var visible = true, running = false, last = performance.now(), raf = 0, dead = false;
    function frame(dt) {
      time += dt; clock += dt;
      if (phase === 'hold' && clock > HOLD) go((idx + 1) % ORDER.length);
      if (phase === 'morph') {
        var t = Math.min(1, clock / MORPH);
        mat.uniforms.uT.value = t;
        if (t >= 1) { phase = 'hold'; clock = 0; }
      }
      mat.uniforms.uTime.value = time;
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      group.rotation.y = -0.4 + time * 0.16 + mx;
      group.rotation.x = 0.28 + my;
      renderer.render(scene, cam);
    }
    function loop() {
      if (dead || !visible || document.hidden) { running = false; return; }
      running = true;
      var now = performance.now();
      frame(Math.min((now - last) / 1000, 0.05));
      last = now;
      raf = requestAnimationFrame(loop);
    }
    function wake() { if (!running && !reduce && !dead) { last = performance.now(); loop(); } }
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); });
    io.observe(canvas);
    document.addEventListener('visibilitychange', wake);
    frame(0.016);
    if (!reduce) loop();

    return {
      next: function () { if (reduce) { go((idx + 1) % ORDER.length); mat.uniforms.uT.value = 1; phase = 'hold'; frame(0); } else next(); },
      dispose: function () {
        dead = true; cancelAnimationFrame(raf); io.disconnect(); mo.disconnect();
        removeEventListener('resize', size); removeEventListener('pointermove', onMove);
        geo.dispose(); mat.dispose(); renderer.dispose();
      }
    };
  }

  window.FSMorph = { mount: mount, order: ORDER, shapes: SHAPES, rng: rng };
})();
