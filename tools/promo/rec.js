// node rec.js <scene> — әр сахнаның экран жазбасы (webm, 1920×1080) → rec/<scene>.webm
const { chromium, devices } = require('playwright'); const fs = require('fs');
const SITE = 'https://sabaqtas-kz.vercel.app', W = 1920, H = 1080;
const CURSOR = `(() => { if (window.__cur) return; window.__cur = 1;
  const mk = () => { const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2l15 10-7 1.4L8.4 21z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-200px,-200px)' });
    const r = document.createElement('div'); r.id = '__ring'; Object.assign(r.style, { position: 'fixed', width: '44px', height: '44px', marginLeft: '-22px', marginTop: '-22px', borderRadius: '50%', border: '3px solid #0a84ff', zIndex: 2147483646, pointerEvents: 'none', opacity: '0', transition: 'opacity .4s, transform .4s', transform: 'scale(.4)' });
    document.documentElement.append(c, r);
    addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + (e.clientX - 3) + 'px,' + (e.clientY - 2) + 'px)'; }, true);
    addEventListener('mousedown', (e) => { r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; r.style.transition = 'none'; r.style.opacity = '1'; r.style.transform = 'scale(.4)'; requestAnimationFrame(() => { r.style.transition = 'opacity .5s, transform .5s'; r.style.opacity = '0'; r.style.transform = 'scale(1.3)'; }); }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mk); else mk(); })();`;
let mx = W / 2, my = H / 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function move(p, x, y, ms = 700) { const n = Math.max(8, Math.round(ms / 16)); for (let i = 1; i <= n; i++) { const k = i / n, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; await p.mouse.move(mx + (x - mx) * e, my + (y - my) * e); await sleep(ms / n); } mx = x; my = y; }
async function to(p, loc, ms) { const bb = await loc.boundingBox(); await move(p, bb.x + bb.width / 2, bb.y + bb.height / 2, ms); return bb; }
async function click(p, loc, ms = 700) { await loc.evaluate((e) => e.scrollIntoView({ block: 'nearest' })).catch(() => {}); await to(p, loc, ms); await sleep(150); await loc.click({ timeout: 8000 }); }
async function ctxOf(b, name, opt = {}) {
  fs.mkdirSync('rec/tmp_' + name, { recursive: true });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, locale: 'kk-KZ', serviceWorkers: 'allow', recordVideo: { dir: 'rec/tmp_' + name, size: { width: W, height: H } }, storageState: fs.existsSync('state.json') ? 'state.json' : undefined, ...opt });
  await ctx.addInitScript(CURSOR); return ctx;
}
async function finish(ctx, name) { const p = ctx.pages()[0]; const v = p.video(); await ctx.close(); fs.renameSync(await v.path(), 'rec/' + name + '.webm'); fs.rmSync('rec/tmp_' + name, { recursive: true, force: true }); console.log('rec/' + name + '.webm'); }
async function loginState(b) {
  const ctx = await b.newContext({ viewport: { width: W, height: H } }); const p = await ctx.newPage();
  await p.goto(SITE + '/app'); await sleep(2500);
  if (await p.locator('input[name=login]').count()) { await p.fill('input[name=login]', process.env.DEMO_LOGIN); await p.fill('input[name=password]', process.env.DEMO_PASS); await p.locator('input[name=password]').press('Enter'); await sleep(4000); }
  await ctx.storageState({ path: 'state.json' }); await ctx.close();
}
module.exports = { SITE, W, H, sleep, move, to, click, ctxOf, finish, loginState, CURSOR, chromium, devices, pos: () => [mx, my], setPos: (x, y) => { mx = x; my = y; } };
