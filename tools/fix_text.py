"""Материалдардағы мәтін қателерін түзету (қайта іске қосуға болады — түзетілгенге тиіспейді).

    python3 tools/fix_text.py          # түзету
    python3 tools/fix_text.py --check  # тек санау (CI / тексеріс үшін)

1. Қазақ сөзінің ішіндегі латын «i/I» → кирилл «і/І» (ҚТЖ көзінде латын әрпімен терілген:
   «күшi», «еркiн»). Көзге бірдей, бірақ іздеу, сұрыптау, экран оқу бағдарламасы мен емле
   тексерісі қате істейді.
2. Тақырыптағы артық бос орын мен тыныс: «шығару .Гидравликалық» → «шығару. Гидравликалық»,
   «..», «Астрономия ,астрофизика».

Қамтитыны: public/lessons.json, materials/{plans,manifest}.json, materials/decks/*.json,
tools/kmzh/gen/ktzh*.json, tools/kmzh/pres_json/*.json, ҚМЖ (docx) және презентация (pptx) мәтіні.
Жұмыс парағының PDF-і мен алдын ала қарау суреттерінде әріптер көзге бірдей, оларға тиіспейді.
"""
import glob, io, json, os, re, sys, zipfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CYR = 'А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІіЁё'
LAT_I = re.compile(rf'(?<=[{CYR}])[iI]|[iI](?=[{CYR}])')


def fix_i(s: str) -> str:
    return LAT_I.sub(lambda m: 'і' if m.group(0) == 'i' else 'І', s)


def fix_topic(t: str) -> str:
    t = fix_i(t)
    t = re.sub(r'\s+([.,;:])', r'\1', t)            # «шығару .» → «шығару.»
    t = re.sub(r'([.,;:])(?=[А-ЯӘҒҚҢӨҰҮҺІA-Za-zа-яәғқңөұүһі«])', r'\1 ', t)  # «.Гидравл» → «. Гидравл»
    t = re.sub(r'\.{2,}', '.', t)
    t = re.sub(r'\s{2,}', ' ', t).strip()
    return t


def walk(o, topic_keys=('topic',)):
    """JSON ішіндегі барлық жолдарды түзету; тақырып өрістеріне — толық түзету"""
    if isinstance(o, dict):
        return {k: (fix_topic(v) if k in topic_keys and isinstance(v, str) else walk(v, topic_keys)) for k, v in o.items()}
    if isinstance(o, list):
        return [walk(x, topic_keys) for x in o]
    if isinstance(o, str):
        return fix_i(o) if not o.startswith('data:') else o
    return o


def json_files():
    fs = [os.path.join(REPO, 'public', 'lessons.json'), os.path.join(REPO, 'materials', 'plans.json'), os.path.join(REPO, 'materials', 'manifest.json')]
    fs += glob.glob(os.path.join(REPO, 'materials', 'decks', '*.json'))
    fs += glob.glob(os.path.join(REPO, 'tools', 'kmzh', 'gen', 'ktzh*.json'))
    fs += glob.glob(os.path.join(REPO, 'tools', 'kmzh', 'pres_json', '*.json'))
    return [f for f in fs if os.path.exists(f)]


def fix_json(path, check):
    raw = open(path, encoding='utf-8').read()
    data = json.loads(raw)
    new = walk(data)
    if new == data:
        return 0
    if not check:
        compact = '\n' not in raw.strip()
        with open(path, 'w', encoding='utf-8') as f:
            sep = (', ', ': ') if '", "' in raw[:400] else (',', ':')
            json.dump(new, f, ensure_ascii=False, separators=sep if compact else None, indent=None if compact else 1)
    return 1


def fix_office(path, check):
    """docx/pptx: тек мәтін түйіндері (<w:t>, <a:t>) ішінде түзетеміз"""
    zin = zipfile.ZipFile(path)
    parts = [n for n in zin.namelist() if n.endswith('.xml') and (n.startswith('word/') or n.startswith('ppt/slides/') or n.startswith('ppt/notesSlides/'))]
    changed = {}
    for n in parts:
        x = zin.read(n).decode('utf-8')
        y = re.sub(r'(<(?:w|a):t(?:\s[^>]*)?>)([^<]*)(</(?:w|a):t>)', lambda m: m.group(1) + fix_i(m.group(2)) + m.group(3), x)
        if y != x:
            changed[n] = y.encode('utf-8')
    if not changed:
        return 0
    if not check:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as zout:
            for it in zin.infolist():
                zout.writestr(it, changed.get(it.filename, zin.read(it.filename)), compress_type=it.compress_type)
        zin.close()
        open(path, 'wb').write(buf.getvalue())
    return 1


def main():
    check = '--check' in sys.argv
    nj = sum(fix_json(f, check) for f in json_files())
    office = glob.glob(os.path.join(REPO, 'materials', '**', '*.docx'), recursive=True) + glob.glob(os.path.join(REPO, 'materials', '**', '*.pptx'), recursive=True)
    no = sum(fix_office(f, check) for f in office)
    print(('табылды' if check else 'түзетілді') + f': JSON {nj} файл, docx/pptx {no} файл')
    if check and (nj or no):
        sys.exit(1)


if __name__ == '__main__':
    main()
