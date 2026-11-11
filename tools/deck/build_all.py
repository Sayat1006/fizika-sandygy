"""Барлық анимациялы презентациядан .pptx жасап, «Қарау» превьюлерін жаңарту.

    python3 tools/deck/build_all.py            # барлығы
    python3 tools/deck/build_all.py 7-11 8-3   # тек осылар

Әр materials/decks/{v}-{n}.json → manifest-тегі pres жолы (materials/{g}/pres_NNN.pptx)
→ LibreOffice арқылы PDF → public/pv/<hash>/ ішіне 1000 px WebP (бұрынғы атаулар сақталады).
"""
import glob, hashlib, json, os, re, subprocess, sys, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import build_pptx  # noqa: E402

SECRET = 'sabaqtas-pv-7f3a91'


def main(only):
    man = json.load(open(os.path.join(REPO, 'materials/manifest.json'), encoding='utf-8'))
    pj = os.path.join(REPO, 'materials/previews.json')
    prev = json.load(open(pj, encoding='utf-8'))
    decks = sorted(glob.glob(os.path.join(REPO, 'materials/decks/*.json')))
    done = 0
    added = set()
    for dp in decks:
        key = os.path.basename(dp)[:-5]
        if only and key not in only:
            continue
        v, n = key.rsplit('-', 1)
        entry = man.get(f'{v}:{n}')
        if not entry:
            print('manifest-те жоқ:', key); continue
        if 'pres' not in entry:
            # бұрын презентациясы жоқ сабақ (10–11-сынып): жаңа файл тіркейміз
            D = json.load(open(dp, encoding='utf-8')); g = v.split('-')[0]
            slug = re.sub(r'[^\w]+', '_', D['topic']).strip('_')[:60]
            folder = os.path.dirname(entry['kmzh']['path']) if entry.get('kmzh') else g  # нұсқаның өз папкасы (10-kgb-2/…)
            entry['pres'] = {'path': f'{folder}/pres_{int(n):03d}.pptx', 'name': f'Презентация_{g}-сынып_{int(n):02d}_{slug}.pptx'}
            added.add((v, int(n)))
        path = entry['pres']['path']
        out = os.path.join(REPO, 'materials', path)
        build_pptx.build(dp, out)
        with tempfile.TemporaryDirectory() as t:
            subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', t, out], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            pdf = os.path.join(t, os.path.basename(out)[:-5] + '.pdf')
            subprocess.run(['pdftoppm', '-r', '150', '-png', pdf, os.path.join(t, 'p')], check=True)
            pages = sorted(glob.glob(os.path.join(t, 'p*.png')))
            h = hashlib.sha256((SECRET + path).encode()).hexdigest()[:20]
            d = os.path.join(REPO, 'public/pv', h)
            os.makedirs(d, exist_ok=True)
            for f in glob.glob(os.path.join(d, '*.webp')):
                os.remove(f)
            files = []
            for i, p in enumerate(pages, 1):
                im = Image.open(p).convert('RGB')
                im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
                fn = f"{i}-{hashlib.sha256((SECRET + path + str(i)).encode()).hexdigest()[:10]}.webp"
                im.save(os.path.join(d, fn), 'WEBP', quality=80, method=6)
                files.append(fn)
            prev[f'{v}:{n}:pres'] = {'dir': h, 'files': files, 'w': im.width, 'h': im.height}
        done += 1
    json.dump(prev, open(pj, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    if added:
        json.dump(man, open(os.path.join(REPO, 'materials/manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        lp = os.path.join(REPO, 'public/lessons.json')
        L = json.load(open(lp, encoding='utf-8'))
        for x in L:
            if (x['v'], x['n']) in added:
                x['pres'] = True
        json.dump(L, open(lp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print('жаңа презентация тіркелді:', len(added))
    print('дайын:', done)


if __name__ == '__main__':
    main(set(sys.argv[1:]))
