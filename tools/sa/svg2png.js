// node svg2png.js <dir> — dir/*.svg → dir/*.png (3× сапа, баспаға)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const dir = process.argv[2]; const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 3 });
  for (const f of files) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8'); const w = +s.match(/width='(\d+)'/)[1], h = +s.match(/height='(\d+)'/)[1];
    await p.setViewportSize({ width: w, height: h }); await p.setContent(`<html><body style="margin:0">${s}</body></html>`);
    await p.locator('svg').screenshot({ path: path.join(dir, f.replace(/\.svg$/, '.png')) });
  }
  await b.close(); console.log('png', files.length);
})();
