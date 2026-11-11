#!/usr/bin/env python3
"""ҚМЖ (.docx) файлдарынан сабақ кезеңдерін шығарады → materials/plans.json.

Әр сабақ: [{stage, min, sub, teacher, student}], ҚМЖ кестесінің «Сабақтың кезеңі / уақыт»
жолдарынан алынады. Тақта (/board) осыны кезеңдер жолағы, таймер және мұғалім жазбасы үшін
қолданады. Файл materials/ ішінде — тек жазылымы бар мұғалімге api/download (kind=plan) арқылы беріледі.

Іске қосу (репозиторий түбірінен):  python3 tools/board/make_plans.py
"""
import html, json, re, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAT = ROOT / 'materials'

T = re.compile(r'<w:t[^>]*>([^<]*)</w:t>')
P = re.compile(r'<w:p[ >].*?</w:p>', re.S)
TC = re.compile(r'<w:tc>.*?</w:tc>', re.S)
TR = re.compile(r'<w:tr[ >].*?</w:tr>', re.S)
MIN = re.compile(r'^(\d+)\s*минут')


def cell(tc):
    out = []
    for p in P.findall(tc):
        t = html.unescape(''.join(T.findall(p))).strip()
        if t:
            out.append(t)
    return out


def stages(path):
    xml = zipfile.ZipFile(path).read('word/document.xml').decode('utf8')
    res = []
    for tr in TR.findall(xml):
        cells = [cell(tc) for tc in TC.findall(tr)]
        if len(cells) < 3 or len(cells[0]) < 2:
            continue
        m = MIN.match(cells[0][1])
        if not m:
            continue
        res.append({
            'stage': cells[0][0],
            'min': int(m.group(1)),
            'sub': ' '.join(cells[0][2:]),
            'teacher': cells[1],
            'student': cells[2],
        })
    return res


def main():
    man = json.loads((MAT / 'manifest.json').read_text('utf8'))
    plans, bad = {}, []
    for key, item in man.items():
        k = item.get('kmzh')
        if not k:
            continue
        st = stages(MAT / k['path'])
        if st:
            plans[key] = st
        else:
            bad.append(key)
    (MAT / 'plans.json').write_text(json.dumps(plans, ensure_ascii=False, separators=(',', ':')), 'utf8')
    total = sum(sum(s['min'] for s in v) for v in plans.values())
    print(f'{len(plans)} сабақ, орташа {total / max(1, len(plans)):.1f} мин; кезеңсіз: {len(bad)} {bad[:10]}')
    return 0 if not bad else 1


if __name__ == '__main__':
    sys.exit(main())
