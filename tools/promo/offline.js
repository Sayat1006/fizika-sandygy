const R = require('./rec'); const { SITE, sleep, move, ctxOf, finish } = R; const fs = require('fs');
(async () => {
  const b = await R.chromium.launch(); const T0 = Date.now(); const marks = {}; const mark = (k) => (marks[k] = +((Date.now() - T0) / 1000).toFixed(2));
  const ctx = await ctxOf(b, 'offline'); const p = await ctx.newPage();
  await p.goto(SITE + '/app'); await p.waitForLoadState('networkidle'); await sleep(1500);
  await p.getByText('Сабақ барысы', { exact: true }).first().click();
  for (let k = 0; k < 40; k++) { if (await p.getByText('офлайн дайын').count()) break; await sleep(1500); }
  await p.reload(); await p.waitForLoadState('networkidle'); await sleep(2500); mark('ready');
  await move(p, 1150, 740, 900); await sleep(2500);
  await ctx.setOffline(true); await sleep(400);
  await p.goto(SITE + '/board?v=7&n=21'); await sleep(2500); mark('board');
  await p.mouse.move(900, 500); await p.mouse.move(950, 520); await sleep(3500);
  for (let k = 0; k < 3; k++) { await p.keyboard.press('PageDown'); await sleep(1500); } mark('end');
  await finish(ctx, 'offline');
  const old = JSON.parse(fs.readFileSync('marks.json', 'utf8')); old.offline = marks; fs.writeFileSync('marks.json', JSON.stringify(old, null, 1)); console.log(JSON.stringify(marks));
  await b.close();
})();
