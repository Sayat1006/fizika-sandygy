const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + __dirname + '/assets/still.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  for (const id of ['hook', 'end', 'end_v']) { if (id === 'end_v') await p.setViewportSize({ width: 1080, height: 1920 }); await p.locator('#' + id).screenshot({ path: 'assets/' + id + '.png' }); }
  await b.close(); console.log('ok'); })();
