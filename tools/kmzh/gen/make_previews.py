# Usage: python3 make_previews.py ws|pres
# Renders PDFs to WebP pages under public/pv/<hash>/<i>.webp and records them in materials/previews.json
import json, os, sys, hashlib, subprocess, tempfile, glob
from PIL import Image
ROOT = '/home/claude/fizika-sandygy'
PDF = '/tmp/claude-0/-home-claude/9cd33916-1c07-578a-8ca8-15d1a161d2ab/scratchpad/pv/pdf'
SECRET = 'sabaqtas-pv-7f3a91'
kind = sys.argv[1]
man = json.load(open(f'{ROOT}/materials/manifest.json'))
pj = f'{ROOT}/materials/previews.json'
prev = json.load(open(pj)) if os.path.exists(pj) else {}
width = {'pres': 1000, 'ws': 900, 'kmzh': 820}[kind]
done = 0
for key, l in man.items():
    if kind not in l: continue
    path = l[kind]['path']
    base = os.path.splitext(os.path.basename(path))[0]
    src = f'{ROOT}/materials/{path}' if kind == 'ws' else f'{PDF}/{os.path.dirname(path)}/{base}.pdf' if kind == 'pres' else f'{PDF}/k{os.path.dirname(path)}/{base}.pdf'
    if not os.path.exists(src): print('missing', src); continue
    h = hashlib.sha256((SECRET + path).encode()).hexdigest()[:20]
    out = f'{ROOT}/public/pv/{h}'
    os.makedirs(out, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        subprocess.run(['pdftoppm', '-r', {'pres': '110', 'ws': '100', 'kmzh': '100'}[kind], '-png', src, f'{t}/p'], check=True)
        pages = sorted(glob.glob(f'{t}/p*.png'))
        for i, p in enumerate(pages, 1):
            im = Image.open(p).convert('RGB')
            if im.width > width: im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
            fn = f"{i}-{hashlib.sha256((SECRET + path + str(i)).encode()).hexdigest()[:10]}.webp"
            im.save(f'{out}/{fn}', 'WEBP', quality={'pres': 68, 'ws': 62, 'kmzh': 58}[kind], method=5)
    prev[f'{key}:{kind}'] = {'dir': h, 'files': [f"{i}-{hashlib.sha256((SECRET + path + str(i)).encode()).hexdigest()[:10]}.webp" for i in range(1, len(pages) + 1)], 'w': im.width, 'h': im.height}
    done += 1
json.dump(prev, open(pj, 'w'), ensure_ascii=False, separators=(',', ':'))
print(kind, done)
