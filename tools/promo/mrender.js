// node mrender.js h [t0 t1 ...] — кадрларды салу. t берілмесе — бүкіл видео → work/mfr/%05d.jpg
const { chromium } = require('playwright'); const fs = require('fs');
const fmt = process.argv[2] || 'h'; const only = process.argv.slice(3).map(Number);
const TL = JSON.parse(fs.readFileSync(`work/timeline_${fmt}.json`, 'utf8')); let t = 0;
for (const s of TL) { s.start = t; t += s.D; s.n = fs.readdirSync('work/fr/' + s.id).length; if (s.phone) s.phn = fs.readdirSync('work/fr/ph').length; }
const TOTAL = t, FPS = 30, N = Math.round(TOTAL * FPS); const SUBS = JSON.parse(fs.readFileSync('subs.json', 'utf8'))[fmt];
const W = fmt === 'h' ? 1920 : 1080, H = fmt === 'h' ? 1080 : 1920;
(async () => {
  const b = await chromium.launch(); fs.mkdirSync('work/mfr', { recursive: true });
  const page = async () => { const p = await b.newPage({ viewport: { width: W, height: H } }); await p.addInitScript(([tl, su]) => { window.TL = tl; window.SUBS = su; }, [TL, SUBS]);
    p.on('pageerror', (e) => console.log('ERR', e.message)); await p.goto('http://127.0.0.1:8790/comp.html'); await p.waitForFunction(() => window.ready); await p.evaluate(() => document.fonts.ready); return p; };
  if (only.length) { const p = await page(); for (const x of only) { await p.evaluate((x) => window.renderFrame(x), x); await p.screenshot({ path: `work/test_${x}.jpg`, type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: W, height: H } }); } await b.close(); return; }
  const K = 4, t0 = Date.now(); let done = 0;
  await Promise.all([...Array(K)].map(async (_, w) => { const p = await page();
    for (let f = w; f < N; f += K) { await p.evaluate((x) => window.renderFrame(x), f / FPS); await p.screenshot({ path: `work/mfr/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: W, height: H } }); if (++done % 300 === 0) console.log(done, '/', N, ((Date.now() - t0) / 1000).toFixed(0) + 's'); } }));
  console.log('frames', N, 'total', TOTAL.toFixed(2)); fs.writeFileSync(`work/mtotal_${fmt}.txt`, String(TOTAL)); await b.close();
})();
