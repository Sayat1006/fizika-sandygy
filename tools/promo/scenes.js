const R = require('./rec'); const { SITE, sleep, move, click, to, ctxOf, finish } = R; const fs = require('fs');
let T0 = 0; const marks = {}; const mark = (s, k) => { marks[s] = marks[s] || {}; marks[s][k] = +((Date.now() - T0) / 1000).toFixed(2); };
const S = {
  async landing(b) {
    const ctx = await ctxOf(b, 'landing', { storageState: undefined }); T0 = Date.now(); const p = await ctx.newPage();
    await p.goto(SITE + '/'); await p.waitForLoadState('networkidle'); await sleep(1200); mark('landing', 'start');
    await move(p, 700, 600, 900); await sleep(2200);
    await p.evaluate(() => window.scrollTo({ top: 520, behavior: 'smooth' })); await sleep(2500); mark('landing', 'stats');
    await sleep(2500);
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await sleep(1500); mark('landing', 'cta');
    await R.to(p, p.getByText('3 күн тегін бастау').first(), 900); await sleep(3000); mark('landing', 'end');
    await finish(ctx, 'landing');
  },
  async cabinet(b) {
    const ctx = await ctxOf(b, 'cabinet'); T0 = Date.now(); const p = await ctx.newPage();
    await p.goto(SITE + '/app'); await p.waitForLoadState('networkidle'); await sleep(3000); mark('cabinet', 'start');
    for (const g of ['8-сынып', '9-сынып', '7-сынып']) { await click(p, p.getByText(g, { exact: true }).first(), 800); await sleep(1300); }
    await click(p, p.getByText('Тығыздықты есептеу. БЖБ №3').first(), 800); await sleep(3500); mark('cabinet', 'bjb');
    const sa = p.getByText('БЖБ/ТЖБ', { exact: true }).first(); if (await sa.count()) { await to(p, sa, 900); await sleep(2200); }
    mark('cabinet', 'end'); await finish(ctx, 'cabinet');
  },
  async lesson(b) {
    const ctx = await ctxOf(b, 'lesson'); T0 = Date.now(); const p = await ctx.newPage();
    await p.goto(SITE + '/app'); await p.waitForLoadState('networkidle'); await sleep(2500);
    await click(p, p.getByText('Тақырыптар', { exact: true }).first(), 600); await sleep(1500); mark('lesson', 'start');
    const t = p.getByText('Архимед күші', { exact: true }).first(); await t.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'smooth' })); await sleep(1600);
    await R.to(p, t, 900); await t.click(); await sleep(1200);
    const see = p.getByRole('button', { name: /Қарау/ }).first(); if (await see.count()) { await click(p, see, 700); } await sleep(4500); mark('lesson', 'pres');
    const nx = p.locator('button[aria-label="Келесі"]').first(); for (let k = 0; k < 3; k++) { if (await nx.count()) { await click(p, nx, 500); await sleep(1500); } }
    await click(p, p.getByText('ҚМЖ', { exact: true }).nth(1), 800); await sleep(4000); mark('lesson', 'kmzh');
    await move(p, 1250, 700, 700); await p.mouse.wheel(0, 500); await sleep(2500); await p.mouse.wheel(0, 500); await sleep(2000);
    const dl = p.getByRole('button', { name: /^ҚМЖ$/ }).last(); if (await dl.count()) { await to(p, dl, 900); await sleep(1500); }
    mark('lesson', 'end'); await finish(ctx, 'lesson');
  },
  async board(b) {
    const ctx = await ctxOf(b, 'board'); T0 = Date.now(); const p = await ctx.newPage();
    await p.goto(SITE + '/board?v=7&n=44'); await p.waitForLoadState('networkidle'); await sleep(4500); mark('board', 'start');
    await move(p, 1700, 600, 800); await sleep(3200); mark('board', 'idle');
    for (let k = 0; k < 6; k++) { await p.mouse.down(); await p.mouse.up(); await sleep(1700); }   // слайдты басу — келесі қадам
    mark('board', 'pen');
    await move(p, 960, 1040, 700); await sleep(500);
    await click(p, p.locator('button[aria-label="Қызыл қалам"]'), 700); await sleep(500);
    // слайдтың үстіне шеңбер сызу
    const cx = 1300, cy = 520; await move(p, cx + 160, cy, 500); await p.mouse.down();
    for (let a = 0; a <= 6.4; a += 0.12) { await p.mouse.move(cx + 160 * Math.cos(a), cy + 110 * Math.sin(a)); await sleep(14); }
    await p.mouse.up(); R.setPos(cx + 160, cy); await sleep(1800); mark('board', 'white');
    await click(p, p.getByRole('button', { name: 'Ақ тақта' }), 800); await sleep(700);
    await click(p, p.locator('button[aria-label="Көк қалам"]'), 600);
    const line = async (pts, st = 16) => { await move(p, pts[0][0], pts[0][1], 350); await p.mouse.down(); for (const [x, y] of pts.slice(1)) await p.mouse.move(x, y, { steps: st }); await p.mouse.up(); R.setPos(...pts[pts.length - 1]); };
    await line([[860, 470], [1060, 470], [1060, 610], [860, 610], [860, 470]]);           // дене
    await line([[960, 470], [960, 290]], 20); await line([[930, 330], [960, 290], [990, 330]], 10);  // F_A
    await click(p, p.locator('button[aria-label="Қызыл қалам"]'), 500);
    await line([[960, 610], [960, 800]], 20); await line([[930, 760], [960, 800], [990, 760]], 10);   // mg
    await sleep(1500); mark('board', 'tools');
    await click(p, p.getByRole('button', { name: 'Слайд' }), 800); await sleep(800);
    await click(p, p.locator('button[aria-label="Басқару (сызбау)"]'), 600);
    await click(p, p.locator('button[aria-label="Таймер"]'), 800); await sleep(1200);
    await click(p, p.getByRole('button', { name: '3 мин' }), 700); await sleep(3000); mark('board', 'timer');
    await p.keyboard.press('Escape'); await sleep(800);
    const close = p.getByRole('button', { name: 'Жабу' }); for (let k = 0; k < (await close.count()); k++) { if (await close.nth(k).isVisible()) { await click(p, close.nth(k), 600); break; } }
    await sleep(800);
    await click(p, p.locator('button[aria-label="Кездейсоқ оқушы"]'), 800); await sleep(1000);
    const pick = p.getByRole('button', { name: 'Таңдау' }); if (await pick.count()) { await click(p, pick.first(), 700); await sleep(3500); }
    mark('board', 'end'); await finish(ctx, 'board');
  },
  async video(b) {
    const ctx = await ctxOf(b, 'video'); T0 = Date.now(); const p = await ctx.newPage();
    await p.goto(SITE + '/board?v=7&n=26'); await p.waitForLoadState('networkidle'); await sleep(4000);
    await move(p, 800, 700, 500); await click(p, p.getByRole('button', { name: 'Видео' }), 900); await sleep(1000); mark('video', 'start');
    await move(p, 1850, 300, 900); await sleep(9000); mark('video', 'lab');
    await p.goto(SITE + '/board?v=7&n=46'); await p.waitForLoadState('networkidle'); await sleep(4000);
    await click(p, p.getByRole('button', { name: '3D тәжірибе' }), 900); await sleep(6000); mark('video', 'labopen');
    const th = await p.frameLocator('iframe').locator('input[type=range]').first().boundingBox();
    const ty = th.y + th.height / 2; await move(p, th.x + th.width - 8, ty, 1000); await sleep(400); await p.mouse.down();
    await move(p, th.x + th.width * 0.25, ty, 4000); await p.mouse.up(); await sleep(4000); mark('video', 'end');
    await finish(ctx, 'video');
  },
};
(async () => {
  const b = await R.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  if (!fs.existsSync('state.json')) await R.loginState(b);
  for (const s of process.argv.slice(2)) { try { await S[s](b); } catch (e) { console.log('FAIL', s, e.message.split('\n')[0]); } }
  const old = fs.existsSync('marks.json') ? JSON.parse(fs.readFileSync('marks.json', 'utf8')) : {};
  fs.writeFileSync('marks.json', JSON.stringify({ ...old, ...marks }, null, 1)); console.log(JSON.stringify(marks));
  await b.close();
})();
