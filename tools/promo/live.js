// Сынып режимі: мұғалім тақтасы (1920×1080) + бір оқушы телефоны (жазба) + қалған оқушылар (жазбасыз)
const R = require('./rec'); const { SITE, sleep, move, click, ctxOf, finish } = R; const fs = require('fs');
const NAMES = ['Айгерім', 'Нұрсұлтан', 'Дана', 'Арман', 'Әсем', 'Ерлан', 'Аружан', 'Данияр', 'Мадина', 'Алихан', 'Жансая', 'Темірлан'];
(async () => {
  const b = await R.chromium.launch(); const T0 = Date.now(); const marks = {}; const mark = (k) => (marks[k] = +((Date.now() - T0) / 1000).toFixed(2));
  const ctx = await ctxOf(b, 'live'); const p = await ctx.newPage();
  await p.goto(SITE + '/board?v=7&n=44'); await p.waitForLoadState('networkidle'); await sleep(4000);
  for (let k = 0; k < 19; k++) { await p.keyboard.press('PageDown'); await sleep(120); }
  await sleep(1500); await move(p, 1200, 500, 600); mark('start');
  console.log(await p.$$eval('button[aria-label]', (bs) => bs.map((b) => b.getAttribute('aria-label')).join(' | ')));
  await click(p, p.getByRole('button', { name: /^Сынып/ }).first(), 900); await sleep(1200);
  const st = p.getByRole('button', { name: 'Сабақты бастау' }); if (await st.count() && await st.isVisible()) { await click(p, st, 800); } await sleep(3500);
  const txt = await p.locator('.bd-live').innerText(); const mm = txt.match(/(\d{3})\s?(\d{3})/); const code = mm ? mm[1] + mm[2] : undefined; console.log('code', code);
  const big = p.getByRole('button', { name: 'Үлкейтіп көрсету' }); if (await big.count()) { await click(p, big, 800); } mark('qr'); await sleep(2500);
  // оқушы телефоны (жазба)
  fs.mkdirSync('rec/tmp_phone', { recursive: true });
  const ph = await b.newContext({ ...R.devices['iPhone 13'], locale: 'kk-KZ', recordVideo: { dir: 'rec/tmp_phone', size: { width: 390, height: 844 } } });
  await ph.addInitScript(`(() => { addEventListener('DOMContentLoaded', () => { const r = document.createElement('div'); r.id='__tap'; Object.assign(r.style,{position:'fixed',width:'54px',height:'54px',marginLeft:'-27px',marginTop:'-27px',borderRadius:'50%',background:'rgba(10,132,255,.35)',zIndex:2147483647,pointerEvents:'none',opacity:0,transition:'opacity .5s'}); document.documentElement.append(r); addEventListener('pointerdown', (e)=>{ r.style.left=e.clientX+'px'; r.style.top=e.clientY+'px'; r.style.transition='none'; r.style.opacity=1; requestAnimationFrame(()=>{ r.style.transition='opacity .6s'; r.style.opacity=0; }); }, true); }); })();`);
  const pp = await ph.newPage(); const PT0 = Date.now(); const pm = {}; const pmark = (k) => (pm[k] = +((Date.now() - PT0) / 1000).toFixed(2));
  await pp.goto(SITE + '/s?c=' + code); await pp.waitForLoadState('networkidle'); await sleep(1500); pmark('start');
  const nm = pp.locator('input[autocomplete=name]'); await nm.tap(); await sleep(300); await nm.pressSequentially('Айгерім', { delay: 110 }); await sleep(500);
  await pp.getByRole('button', { name: 'Қосылу' }).tap(); await sleep(2500); pmark('joined');
  // қалған оқушылар
  const others = [];
  for (const n of NAMES.slice(1)) { const c = await b.newContext({ ...R.devices['iPhone 13'] }); const q = await c.newPage(); await q.goto(SITE + '/s?c=' + code); await q.locator('input[autocomplete=name]').fill(n); await q.getByRole('button', { name: 'Қосылу' }).click(); others.push(q); await sleep(400); }
  await sleep(2500); mark('joined');
  // мұғалім: үлкен QR-ды жабу, слайдтағы сұрақты жіберу
  await p.mouse.click(300, 300); await sleep(1200);
  const fromSlide = p.locator('.bd-live button').filter({ hasText: 'Теңіз суында' }).first();
  if (await fromSlide.count()) await click(p, fromSlide, 900); else console.log('no slide q');
  mark('sent'); await sleep(2500); pmark('q');
  await pp.getByRole('button', { name: /Жеңіл жүзеді/ }).tap(); await sleep(1000); pmark('answered');
  const pick = ['Жеңіл жүзеді', 'Жеңіл жүзеді', 'Бірдей', 'Жеңіл жүзеді', 'Жеңіл жүзеді', 'Ауыр батады', 'Жеңіл жүзеді', 'Жеңіл жүзеді', 'Жеңіл жүзеді', 'Бірдей', 'Жеңіл жүзеді'];
  for (let i = 0; i < others.length; i++) { await others[i].getByRole('button', { name: new RegExp(pick[i]) }).click().catch((e) => console.log('ans', e.message.slice(0, 80))); await sleep(350); }
  await sleep(4000); mark('answers');
  const rev = p.getByRole('button', { name: 'Жауапты көрсету' }); if (await rev.count()) { await click(p, rev, 900); } await sleep(2500); mark('reveal'); pmark('reveal');
  const res = p.locator('.bd-live').getByRole('button', { name: /Нәтиже|Тақтаға/ }).first(); if (await res.count()) { await click(p, res, 900); await sleep(4000); }
  mark('end'); await sleep(1500);
  await p.screenshot({ path: 'live_end.png' });
  // тазалау: сабақты аяқтау
  await p.mouse.click(300, 300); await sleep(800);
  const end = p.getByRole('button', { name: 'Сабақты аяқтау' }); if (await end.count()) await end.click().catch(() => {}); await sleep(1500);
  const v = pp.video(); await ph.close(); fs.renameSync(await v.path(), 'rec/phone.webm'); fs.rmSync('rec/tmp_phone', { recursive: true, force: true });
  await finish(ctx, 'live');
  const old = JSON.parse(fs.readFileSync('marks.json', 'utf8')); old.live = marks; old.phone = pm; fs.writeFileSync('marks.json', JSON.stringify(old, null, 1)); console.log(JSON.stringify({ marks, pm }));
  await b.close();
})();
