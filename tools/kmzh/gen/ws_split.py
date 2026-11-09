# -*- coding: utf-8 -*-
"""Әр сабаққа жеке жұмыс парағы (PDF): ең көбі 2 бет + мұғалімге жауап беті.
usage: python3 ws_split.py OUTDIR 7 8 9"""
import sys, os, re, json, glob, subprocess
sys.path.insert(0, os.path.dirname(__file__))
import workbook as W

OUT = sys.argv[1]
GRADES = sys.argv[2:]
RENDER = os.path.join(os.path.dirname(__file__), 'ws_render.js')


def sheet_html(g, d, idx, comp):
    main, soft = W.GC[g]
    h, keys = W.build_sheet(d, idx, main, comp)
    key = ''
    if keys:
        key = ('<section class="keys" style="break-before:page"><h2>Мұғалімге: жауаптар</h2><div class="k">'
               f'<b>{W.esc(d["topic"])}</b><br>' + '<br>'.join(W.esc(x) for x in keys) + '</div></section>')
    return (f'<!doctype html><html lang="kk"><head><meta charset="utf-8"><style>:root{{--main:{main};--soft:{soft};}}{W.CSS}</style></head>'
            f'<body>{h}{key}</body></html>', bool(keys))


def pages(pdf):
    out = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout
    return int(re.search(r'Pages:\s+(\d+)', out).group(1))


for g in GRADES:
    FT = W.spec_types(g)
    files = sorted(glob.glob(os.path.join(W.ROOT, 'pres_json', f'{g}_*.json')), key=lambda f: int(re.search(r'_(\d+)\.json', f).group(1)))
    od = os.path.join(OUT, g); os.makedirs(od, exist_ok=True)
    todo = []
    for i, f in enumerate(files, 1):
        d = json.load(open(f))
        if d.get('chart') and FT.get(d['n']) == 'graph': d = dict(d, fig=None)
        todo.append((i, d, 0))
    report = {}
    for it in range(4):
        jobs = []
        for i, d, c in todo:
            html, has_key = sheet_html(g, d, i, c)
            hp = os.path.join(od, f'ws_{d["n"]:03d}.html'); open(hp, 'w').write(html)
            jobs.append((hp, os.path.join(od, f'ws_{d["n"]:03d}.pdf'), f'Сабақтас · Физика · {g}-сынып · Жұмыс парағы', i, d, c, has_key))
        json.dump([[a, b, c] for a, b, c, *_ in jobs], open(os.path.join(od, 'jobs.json'), 'w'), ensure_ascii=False)
        subprocess.run(['node', RENDER, os.path.join(od, 'jobs.json')], check=True)
        nxt = []
        for hp, pdf, _, i, d, c, has_key in jobs:
            n = pages(pdf) - (1 if has_key else 0)
            report[d['n']] = n
            if n > 2 and c < 3: nxt.append((i, d, c + 1))
        print(g, 'pass', it, 'over:', [d['n'] for _, d, _ in nxt], flush=True)
        if not nxt: break
        todo = nxt
    for f in glob.glob(os.path.join(od, '*.html')) + [os.path.join(od, 'jobs.json')]: os.remove(f)
    print(g, 'sheets', len(report), 'max pages', max(report.values()))
