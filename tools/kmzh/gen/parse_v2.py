"""Жаңа курс нұсқаларының КТЖ-сын талдау → gen/ktzh_v2.json

    python3 parse_v2.py

Кілттер: 10-zhmb-3 (102), 10-kgb-2 (68), 11-kgb-2 (68), 11-kgb-1 (34).
Әр сабақ: {n, disp, bolim, topic, codes, date}.
"""
import json, os, re
import docx

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(HERE), 'ktzh_src')


def rows(path, ti):
    for r in docx.Document(os.path.join(SRC, path)).tables[ti].rows:
        out, prev = [], None
        for c in r.cells:
            if c._tc is prev:
                continue
            prev = c._tc
            out.append(c.text.strip())
        yield out


def clean(s):
    return re.sub(r'\s+', ' ', s.replace('-\n', '').replace('\n', ' ')).strip(' ;')


def codes_of(s):
    out = []
    for x in re.split(r'\n|(?<=;)\s+(?=1[01]\.\s?\d)', s or ''):
        x = re.sub(r'\s+', ' ', x).strip()
        if not x:
            continue
        if out and not re.match(r'^\d', x):
            out[-1] += ' ' + x
        else:
            out.append(x)
    seen = []
    [seen.append(c) for c in out if c not in seen]
    return seen


QUARTER = re.compile(r'тоқсан', re.I)
ATTACH = re.compile(r'^(Практикалық|БЖБ|Есеп|№\s*\d+\s*Зертх|«)', re.I)


LABEL = re.compile(r'^(Практикалық жұмыс\s*\d*|БЖБ\s*№?\s*\d*)\.?(\.?\s*Есептер шығару)?$', re.I)
SERVICE = re.compile(r'^(Практикалық жұмыс|БЖБ|ТЖБ|Тоқсандық|Қатемен|\d+\s*-?\s*тоқсандық|Есептер шығару|Еесптер)', re.I)


def finish(out):
    """бос тақырып → алдыңғы тақырып бойынша есептер; жеке «Практикалық жұмыс N»/«БЖБ N» → алдыңғы тақырып + белгі; нөмірлеу"""
    real = None
    for o in out:
        t = re.sub(r'\.{2,}', '.', re.sub(r'\s*\.\s*\.', '.', o['topic'])).replace('Еесптер', 'Есептер').strip(' .')
        m = LABEL.match(t)
        if m and real:
            lab = re.sub(r'\s+', ' ', m.group(1)).strip()
            t = f"{real['topic'].split('. Есептер')[0]}. {lab}" + ('. Есептер шығару' if m.group(2) else '')
            o['codes'] = o['codes'] or real['codes']
        elif t in ('Есептер шығару',) and real:
            t = f"{real['topic'].split('. Есептер')[0]}. Есептер шығару"
            o['codes'] = o['codes'] or real['codes']
        o['topic'] = t
        if t and not SERVICE.match(t) and not LABEL.match(t):
            real = o
    last = None
    for o in out:
        if not o['topic']:
            o['topic'] = (last['topic'].split('. Есептер')[0] + '. Есептер шығару') if last else 'Есептер шығару'
            o['codes'] = o['codes'] or (last['codes'] if last else [])
        if not o['bolim'] and last:
            o['bolim'] = last['bolim']
        last = o
    for i, o in enumerate(out, 1):
        o['n'] = i
        o.setdefault('disp', str(i))
    return out


def zhmb3():
    """10-сынып ЖМБ 3 сағ.: бір жолда бірнеше сабақ — күндер бойынша бөлінеді"""
    out, bolim = [], ''
    for c in rows('723b505b-____10_____3.docx', 0):
        if len(c) < 5 or QUARTER.search(c[0]) or c[0].startswith('Ұзақ') or c[0].startswith('Білім'):
            continue
        if c[0]:
            bolim = clean(c[0])
        parts = [clean(p) for p in c[1].split('\n') if clean(p)]
        dates = [d.strip() for d in c[4].split('\n') if d.strip()]
        n = max(1, len(dates))
        # «Практикалық жұмыс», «БЖБ» сияқты бөліктерді алдыңғы тақырыпқа қосамыз
        merged = []
        for p in parts:
            if merged and ATTACH.match(p) and len(merged) >= n:
                merged[-1] += '. ' + p
            else:
                merged.append(p)
        while len(merged) > n:
            x = merged.pop(); merged[-1] += '. ' + x
        while len(merged) < n:
            merged.append(merged[-1].split('. Есептер')[0] + '. Есептер шығару')
        cs = codes_of(c[2])
        for k in range(n):
            t = merged[k]
            out.append({'bolim': bolim, 'topic': t, 'codes': [] if re.match(r'^ТЖБ', t) else cs, 'date': dates[k] if k < len(dates) else ''})
    return finish(out)


def numbered(path, ti, ci):
    """№ бағаны бар КТЖ (ҚГБ): ci = (бөлім, тақырып, мақсат, сағат)"""
    out, bolim = [], ''
    bi, tpi, oi, hi = ci
    for c in rows(path, ti):
        if len(c) <= hi or c[0] == '№' or (QUARTER.search(' '.join(c[:2])) and not c[tpi].strip()):
            continue
        if not (c[0].strip() or c[tpi].strip()):
            continue
        if c[bi].strip():
            bolim = clean(c[bi])
        try:
            h = int(re.sub(r'\D', '', c[hi]) or 1)
        except ValueError:
            h = 1
        t = clean(c[tpi].replace('\n', '. '))
        for _ in range(h):
            out.append({'bolim': bolim, 'topic': t, 'codes': codes_of(c[oi]), 'date': ''})
    return finish(out)


def kgb1():
    out, bolim = [], ''
    for c in rows('13dbccc7-____11_34____.docx', 0):
        if len(c) < 4 or c[0].startswith('Ұзақ') or c[0].startswith('Барлығы') or (QUARTER.search(c[0]) and not c[1]):
            continue
        if c[0].strip():
            bolim = clean(c[0])
        out.append({'bolim': bolim, 'topic': clean(c[1].replace('\n', '. ')), 'codes': codes_of(c[2]), 'date': ''})
    return finish(out)


if __name__ == '__main__':
    res = {
        '10-zhmb-3': zhmb3(),
        '10-kgb-2': numbered('3dd70955-____10-11_____2.docx', 0, (1, 2, 3, 4)),
        '11-kgb-2': numbered('3dd70955-____10-11_____2.docx', 1, (1, 3, 4, 5)),
        '11-kgb-1': kgb1(),
    }
    # КТЖ-дағы қайталанған жолдар (жалпы сағат 68 / 34 болуы керек)
    k2 = res['11-kgb-2']; dup = [i for i in range(1, len(k2)) if k2[i]['topic'] == k2[i - 1]['topic'] and 'Жұлдыз' in k2[i]['topic']]
    if len(k2) == 69 and dup: del k2[dup[0]]
    k1 = res['11-kgb-1']; dup = [i for i, o in enumerate(k1) if not o['codes'] and 'Трансформатор' in o['topic']]
    if len(k1) == 35 and dup: del k1[dup[0]]
    FIX = {'Жұлдыздыздар': 'Жұлдыздар', 'Жұлдыздардыың': 'Жұлдыздардың', 'Күштердіқосу': 'Күштерді қосу', 'Бүкіләлемдіктартылыс': 'Бүкіләлемдік тартылыс',
           'Радияциядан': 'Радиациядан', 'детектрлеу': 'детекторлеу', 'турбуленнтік': 'турбуленттік', 'Үзіліссіздік': 'Үзіліссіздік', 'Қарақұрдым': 'Қара құрдым',
           'жиындық': 'жиынтық', 'Хаблл': 'Хаббл'}
    for v in res.values():
        for i, o in enumerate(v, 1):
            o['n'] = i; o['disp'] = str(i)
            t = o['topic']
            for a, b in FIX.items():
                t = t.replace(a, b)
            if 'Есептер шығару' in t:  # есеп сабағында БЖБ белгісі қайталанбайды
                t = re.sub(r'\.?\s*БЖБ\s*№?\s*\d+', '', t)
            t = re.sub(r'\s*\.\s*', '. ', t).replace(' .', '.').strip()
            t = re.sub(r'(\S)\.(?=[А-ЯӘҒҚҢӨҰҮҺІ])', r'\1. ', t)
            o['topic'] = re.sub(r'\s+', ' ', t).strip(' .')
    z = res['10-zhmb-3']
    z[-1]['topic'] = 'Электромагнетизм бойынша сандық және сапалы есептер шығару (қорытынды)'
    z[-2]['topic'] = 'Электромагнетизм бойынша сандық және сапалы есептер шығару'
    json.dump(res, open(os.path.join(HERE, 'ktzh_v2.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for k, v in res.items():
        print(k, len(v))
