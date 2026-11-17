// node sheet.js <port> <out.jpg> <a.html,b.html> [уақыттар 1,5,9,13,17] — бірнеше сахнаны бір суретке жинап тексеру
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [port, out, list, times = '1,5,9,13,17'] = process.argv.slice(2);
  const scenes = list.split(','), ts = times.split(',').map(Number);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const imgs = [];
  for (const s of scenes) {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    p.on('pageerror', (e) => console.log('ERR', s, e.message));
    await p.goto(`http://127.0.0.1:${port}/${s}`); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
    const row = []; for (const t of ts) row.push(await p.evaluate((t) => window.renderFrame(t), t)); imgs.push(row); await p.close();
  }
  const p = await b.newPage();
  const data = await p.evaluate(async ({ imgs, ts, TW }) => {
    const w = TW, h = TW * 9 / 16, c = document.createElement('canvas'); c.width = w * ts.length; c.height = h * imgs.length; const x = c.getContext('2d');
    for (let r = 0; r < imgs.length; r++) for (let k = 0; k < ts.length; k++) {
      const im = new Image(); im.src = imgs[r][k]; await im.decode(); x.drawImage(im, k * w, r * h, w, h);
      x.fillStyle = '#000a'; x.fillRect(k * w, r * h, 56, 26); x.fillStyle = '#fff'; x.font = '18px Arial'; x.fillText(ts[k] + ' с', k * w + 6, r * h + 19);
    }
    return c.toDataURL('image/jpeg', 0.85);
  }, { imgs, ts, TW: +(process.env.TW || 480) });
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64')); await b.close(); console.log('ok', out);
})();
