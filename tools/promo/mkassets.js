// монитор/телефон рамкасы (тесігі мөлдір) және субтитрлер → assets/*.png
const { chromium } = require('playwright'); const fs = require('fs');
const L = JSON.parse(fs.readFileSync('layout.json', 'utf8'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const shot = async (name, k, w, h, g, t = '') => {
    await p.setViewportSize({ width: w, height: h });
    await p.goto('file://' + __dirname + '/assets/a.html?k=' + k + '&w=' + w + '&h=' + h + '&g=' + encodeURIComponent(JSON.stringify(g)) + '&t=' + encodeURIComponent(t));
    await p.waitForFunction(() => window.ready); await p.evaluate(() => document.fonts.ready);
    await p.locator('#c').screenshot({ path: 'assets/' + name + '.png', omitBackground: true });
  };
  for (const [fmt, l] of Object.entries(L)) {
    await shot(fmt + '_frame', 'frame', l.W, l.H, l);
    // монитор рамкасы: тесікті мөлдір ету үшін — фон + рамка, сосын тесікті ffmpeg-те емес, мұнда кесеміз
    await shot(fmt + '_phone', 'phone', l.W, l.H, { s: l.phone });
    for (const [id, t] of Object.entries(JSON.parse(fs.readFileSync('subs.json', 'utf8'))[fmt])) await shot(fmt + '_sub_' + id, 'sub', l.W, l.H, { y: l.subY, fs: l.subFs }, t);
  }
  await b.close(); console.log('ok');
})();
