const { chromium } = require('playwright');
(async () => {
  const [inp, out, label] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + inp, { waitUntil: 'networkidle' });
  await p.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="font-family:'Liberation Serif',serif;font-size:9px;color:#6b7785;width:100%;padding:0 12mm;display:flex;justify-content:space-between"><span>${label}</span><span><span class="pageNumber"></span></span></div>`,
    margin: { top: '13mm', bottom: '15mm', left: '12mm', right: '12mm' } });
  await b.close();
})();
