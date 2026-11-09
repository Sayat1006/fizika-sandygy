// node ws_render.js jobs.json  — jobs: [[html, pdf, footerLabel], ...]
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [html, pdf, label] of jobs) {
    await p.goto('file://' + html, { waitUntil: 'load' });
    await p.pdf({
      path: pdf, format: 'A4', printBackground: true,
      margin: { top: '13mm', bottom: '15mm', left: '12mm', right: '12mm' },
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font:9px 'Times New Roman',serif;color:#888;padding:0 12mm;display:flex;justify-content:space-between"><span>${label}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    });
  }
  await b.close();
})();
