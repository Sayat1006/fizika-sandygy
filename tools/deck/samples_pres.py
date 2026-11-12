"""Тегін үлгілердегі (public/samples) презентацияны және басты беттің демо-тақтасын жаңарту.

    python3 tools/deck/samples_pres.py

public/samples/samples.json-дағы әр үлгі үшін: materials-тегі .pptx → public/samples/{g}/pres.pptx,
беттері → pres_NN.jpg (1067×600). Басты бет: materials/decks/7-5.json → public/demo/deck.json.
"""
import glob, json, os, shutil, subprocess, tempfile
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    sp = os.path.join(REPO, 'public/samples/samples.json')
    S = json.load(open(sp, encoding='utf-8'))
    man = json.load(open(os.path.join(REPO, 'materials/manifest.json'), encoding='utf-8'))
    for x in S:
        e = man.get(f"{x['v']}:{x['n']}", {}).get('pres')
        if not e or not x.get('pres'):
            continue
        d = os.path.join(REPO, 'public/samples', str(x['grade']))
        src = os.path.join(REPO, 'materials', e['path'])
        dst = os.path.join(d, x['pres']['file'])
        shutil.copyfile(src, dst)
        for f in glob.glob(os.path.join(d, 'pres_*.jpg')):
            os.remove(f)
        pages = []
        with tempfile.TemporaryDirectory() as t:
            subprocess.run(['soffice', f'-env:UserInstallation=file://{t}/lo', '--headless', '--convert-to', 'pdf', '--outdir', t, dst], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(['pdftoppm', '-scale-to-x', '1067', '-scale-to-y', '-1', '-png', os.path.join(t, os.path.basename(dst)[:-5] + '.pdf'), os.path.join(t, 'p')], check=True, stderr=subprocess.DEVNULL)
            for i, p in enumerate(sorted(glob.glob(os.path.join(t, 'p*.png'))), 1):
                im = Image.open(p).convert('RGB')
                fn = f'pres_{i:02d}.jpg'
                im.save(os.path.join(d, fn), 'JPEG', quality=82, optimize=True, progressive=True)
                pages.append([fn, im.width, im.height])
        x['pres'].update(size=os.path.getsize(dst), pages=pages)
        print(x['grade'], x['n'], len(pages), 'бет')
    json.dump(S, open(sp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    shutil.copyfile(os.path.join(REPO, 'materials/decks/7-5.json'), os.path.join(REPO, 'public/demo/deck.json'))
    print('демо: public/demo/deck.json')


if __name__ == '__main__':
    main()
