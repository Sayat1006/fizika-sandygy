// node render.js <port> <html> <outdir> [fps] [from] [to] — әр кадрды JPEG етіп сақтау (WebGL, детерминирленген уақыт)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [port, html, out, fps = '30', from = '0', to = '18'] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', (e) => console.log('ERR', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto(`http://127.0.0.1:${port}/${html}`); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
  const F = +fps, a = Math.round(+from * F), z = Math.round(+to * F);
  const t0 = Date.now();
  for (let i = a; i < z; i++) {
    const data = await p.evaluate((t) => window.renderFrame(t), i / F);
    fs.writeFileSync(`${out}/f${String(i).padStart(4, '0')}.jpg`, Buffer.from(data.split(',')[1], 'base64'));
    if (i === a) console.log('first frame ms', Date.now() - t0);
  }
  console.log('frames', z - a, 'sec', ((Date.now() - t0) / 1000).toFixed(1));
  await b.close();
})();
