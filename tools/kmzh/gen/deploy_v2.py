# -*- coding: utf-8 -*-
"""Copy generated ҚМЖ v2 for a variant into the site, convert to PDF, regenerate WebP previews.
Usage: python3 deploy_v2.py VARIANT
  VARIANT: generator key (7, 8, 9, 10, 11, 10-zhmb-3, 10-kgb-2, 11-kgb-2, 11-kgb-1)
"""
import json, os, sys, shutil, subprocess, hashlib, glob, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
GEN = os.environ.get('FS_OUT', os.path.join(os.path.dirname(HERE), 'final_v2'))
SECRET = 'sabaqtas-pv-7f3a91'
SITEV = {'10': '10-zhmb-2', '11': '11-zhmb-3'}

variant = sys.argv[1]
sv = SITEV.get(variant, variant)
src = os.path.join(GEN, variant)
index = json.load(open(os.path.join(src, 'index.json')))
man = json.load(open(f'{SITE}/materials/manifest.json'))
prev = json.load(open(f'{SITE}/materials/previews.json'))
folder = sv if '-' in sv and sv not in ('10-zhmb-2', '11-zhmb-3') else sv.split('-')[0]
os.makedirs(f'{SITE}/materials/{folder}', exist_ok=True)

pdfdir = tempfile.mkdtemp(prefix='kpdf_')
copied = []
for n, fname in sorted(index.items(), key=lambda x: int(x[0])):
    key = f'{sv}:{n}'
    entry = man.setdefault(key, {})
    path = entry.get('kmzh', {}).get('path') or f'{folder}/kmzh_{int(n):03d}.docx'
    shutil.copyfile(os.path.join(src, fname), f'{SITE}/materials/{path}')
    entry['kmzh'] = {'path': path, 'name': fname}
    copied.append((key, path))
print('copied', len(copied))

# PDF in one soffice run
subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', pdfdir] + [f'{SITE}/materials/{p}' for _, p in copied],
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=3600)

for key, path in copied:
    pdf = os.path.join(pdfdir, os.path.splitext(os.path.basename(path))[0] + '.pdf')
    if not os.path.exists(pdf): print('no pdf', key); continue
    h = hashlib.sha256((SECRET + path).encode()).hexdigest()[:20]
    out = f'{SITE}/public/pv/{h}'
    old = prev.get(f'{key}:kmzh')
    if old:
        for f in old.get('files', []):
            fp = f'{SITE}/public/pv/{old["dir"]}/{f}'
            if os.path.exists(fp): os.remove(fp)
    os.makedirs(out, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        subprocess.run(['pdftoppm', '-r', '100', '-png', pdf, f'{t}/p'], check=True)
        files = []
        for i, p in enumerate(sorted(glob.glob(f'{t}/p*.png')), 1):
            im = Image.open(p).convert('RGB')
            if im.width > 820: im = im.resize((820, round(im.height * 820 / im.width)), Image.LANCZOS)
            fn = f"{i}-{hashlib.sha256((SECRET + path + 'v3' + str(i)).encode()).hexdigest()[:10]}.webp"
            im.save(f'{out}/{fn}', 'WEBP', quality=58, method=5); files.append(fn)
    prev[f'{key}:kmzh'] = {'dir': h, 'files': files, 'w': im.width, 'h': im.height}

# Жаңа нұсқа: сабақтар тізіміне (public/lessons.json) қосу; күндер – сағат саны бірдей нұсқаның кестесінен
lp = f'{SITE}/public/lessons.json'
L = json.load(open(lp, encoding='utf-8'))
have = {(x['v'], x['n']) for x in L}
KV2 = json.load(open(os.path.join(HERE, 'ktzh_v2.json'), encoding='utf-8')).get(variant)
if KV2:
    hours = int(variant.rsplit('-', 1)[1])
    ref = '11-zhmb-3' if hours == 3 else '10-zhmb-2'
    dates = [x['date'] for x in sorted((x for x in L if x['v'] == ref), key=lambda x: x['n'])]
    if hours == 1: dates = dates[::2]
    while len(dates) < len(KV2): dates.append(dates[-1])
    for i, it in enumerate(KV2):
        if (sv, it['n']) in have or str(it['n']) not in index: continue
        L.append({'grade': int(variant.split('-')[0]), 'n': it['n'], 'disp': str(it['disp']), 'topic': it['topic'], 'bolim': it['bolim'],
                  'date': dates[i], 'kmzh': True, 'pres': False, 'ws': False, 'v': sv})
        man[f'{sv}:{it["n"]}']['date'] = dates[i]
    json.dump(L, open(lp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
json.dump(man, open(f'{SITE}/materials/manifest.json', 'w'), ensure_ascii=False, indent=1)
json.dump(prev, open(f'{SITE}/materials/previews.json', 'w'), ensure_ascii=False, separators=(',', ':'))
shutil.rmtree(pdfdir, ignore_errors=True)
print('done', variant)
