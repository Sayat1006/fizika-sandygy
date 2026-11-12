"""v3 суреттерін PNG-ге түсіру (.pptx үшін): tools/deck/art/{id}.png, tools/deck/art/model_{k}.png

    python3 tools/deck/art_png.py

web/art/ бетін бөлек жинап (сайтқа кірмейді), Playwright-пен әр суретті 1350×1050 px етіп түсіреді.
"""
import functools, http.server, os, subprocess, tempfile, threading

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'art')

JS = r"""
const { chromium } = require('playwright');
(async () => {
  const [url, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 1100 } });
  await p.goto(url); await p.waitForSelector('[data-art]'); await p.waitForTimeout(800);
  for (const el of await p.$$('[data-art]')) { const id = await el.getAttribute('data-art'); await el.screenshot({ path: `${out}/${id}.png` }); }
  for (const el of await p.$$('[data-model]')) { const id = await el.getAttribute('data-model'); const s = await el.$('svg'); if (s) await s.screenshot({ path: `${out}/model_${id}.png` }); }
  await b.close();
})();
"""


def main():
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        env = dict(os.environ, ART_OUT=os.path.join(t, 'site'))
        subprocess.run(['npx', 'vite', 'build', '--config', 'art/vite.config.ts'], cwd=os.path.join(REPO, 'web'), env=env, check=True, stdout=subprocess.DEVNULL)
        h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.path.join(t, 'site'))
        srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        js = os.path.join(t, 'shot.js')
        open(js, 'w').write(JS)
        subprocess.run(['node', js, f'http://127.0.0.1:{srv.server_address[1]}/index.html', OUT], check=True, stderr=subprocess.DEVNULL)
        srv.shutdown()
    # .pptx көлемін азайту: 1080 px, 160 түсті палитра (жалпақ түсті суреттерде көзге білінбейді)
    from PIL import Image
    for f in os.listdir(OUT):
        p = os.path.join(OUT, f)
        im = Image.open(p).convert('RGB')
        im.thumbnail((1080, 1080), Image.LANCZOS)
        im.quantize(colors=160, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(p, optimize=True)
    print(len(os.listdir(OUT)), 'сурет →', os.path.relpath(OUT, REPO))


if __name__ == '__main__':
    main()
