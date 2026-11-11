"""ҚМЖ генераторының деректерінен (tools/kmzh) анимациялы презентацияның мазмұнын жасау.

    cd tools/kmzh/gen && python3 export_pres.py 7 8 9     # → tools/kmzh/pres_json/*.json
    python3 tools/deck/from_kmzh.py 7 8 9                 # → materials/decks/{g}-{n}.json, tools/deck/fig/*.png

Сызбалар: «cards», «flow», «graph» — дерек ретінде (тақтада да, .pptx-те де өз пішіндерімен салынады);
қалған сызбалар matplotlib-пен қайта салынады: тақтаға SVG (векторлық), .pptx-ке 300 dpi PNG.
"custom": true бар қолмен жазылған файлдар (мысалы 7-5) өзгертілмейді.
"""
import base64, io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
GEN = os.path.join(REPO, 'tools', 'kmzh', 'gen')
PJ = os.path.join(REPO, 'tools', 'kmzh', 'pres_json')
IMG = os.path.join(REPO, 'tools', 'kmzh', 'img')
OUT = os.path.join(REPO, 'materials', 'decks')
FIG = os.path.join(HERE, 'fig')
sys.argv, ARGS = ['x'], sys.argv[1:]
sys.path.insert(0, GEN)
import importlib  # noqa: E402
import matplotlib  # noqa: E402
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402
import figs  # noqa: E402
import export_pres  # noqa: E402  (argv бос — өзі ештеңе жасамайды)

plt.rcParams['svg.fonttype'] = 'path'
os.makedirs(OUT, exist_ok=True); os.makedirs(FIG, exist_ok=True)


# генератордағы сынып → сайттағы курс нұсқасы
SITE = {'10': '10-zhmb-2', '11': '11-zhmb-3'}


def specs_of(g):
    S = {}
    for f in sorted(os.listdir(GEN)):
        if re.match(rf'g{g}[a-z]?\.py$', f):
            S.update(importlib.import_module(f[:-3]).S)
    return S


def draw(spec, base):
    """Сызбаны SVG (тақтаға) және PNG (pptx-ке) етіп салу. Қайтарады: {svg, png, w, h}"""
    kind, *args = spec
    if kind == 'formula': fig = figs.formula(*args)
    elif kind == 'graph': fig = figs.graph(*args)
    elif kind == 'cards': fig = figs.cards(*args)
    elif kind == 'flow': fig = figs.flow(*args)
    else: fig = figs.CUSTOM[kind](*args)
    buf = io.BytesIO(); fig.savefig(buf, format='svg', facecolor='white'); svg = buf.getvalue()
    fig.savefig(base + '.png', dpi=300, facecolor='white')
    w, h = fig.get_size_inches(); plt.close(fig)
    return {'svg': 'data:image/svg+xml;base64,' + base64.b64encode(svg).decode(), 'png': os.path.relpath(base + '.png', REPO), 'w': round(w * 100), 'h': round(h * 100)}


ILLUS = {'circuit', 'solenoid', 'field_lines', 'charges', 'block_forces', 'waves', 'oscillation', 'pendulum', 'spring', 'lens', 'eye', 'mirror',
         'refraction', 'reflection', 'archimedes', 'floating', 'particles', 'projectile', 'lever', 'hydraulic', 'decay', 'induction'}


def visual(spec, base):
    """Дерекпен салынатын сызбалар — өз пішіндерімен; қалғаны — сурет"""
    if not spec or spec[0] == 'tjb':
        return None
    k = spec[0]
    if k == 'cards':
        return {'cards': {'title': spec[1], 'items': [[a, b] for a, b in spec[2]]}}
    if k == 'flow':
        return {'flow': {'title': spec[1], 'items': list(spec[2])}}
    if k == 'graph':
        title, xl, yl, ser = spec[1:5]
        bars = len(spec) > 6 and spec[6]
        xs = ser[0][1]
        return {'chart': {'type': 'bar' if bars else 'line', 'title': title, 'xl': xl, 'yl': yl, 'labels': [f'{x:g}' if isinstance(x, (int, float)) else str(x) for x in xs],
                          'series': [{'name': s[0] or yl, 'values': [float(v) for v in s[2]]} for s in ser if len(s[1]) == len(xs)]}}
    out = {'img': draw(spec, base)}
    if k in ILLUS:  # тақтада интерактивті модель (Illus.tsx), .pptx-те — сурет
        out['illus'] = {'k': k, 'a': json.loads(json.dumps(list(spec[1:])))}
    return out


def answer_split(q):
    """«Сұрақ? (жауап)» → (сұрақ, жауап); соңғы теңгерілген жақша"""
    q = q.strip()
    if not q.endswith(')'):
        return q, ''
    depth = 0
    for i in range(len(q) - 1, -1, -1):
        depth += q[i] == ')'
        depth -= q[i] == '('
        if depth == 0:
            return q[:i].strip(), q[i + 1:-1].strip()
    return q, ''


def qr_uri(name):
    p = os.path.join(IMG, name) if name else None
    return 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode() if p and os.path.exists(p) else None


def T(tag, time):
    return {'tag': tag, 'time': time}


def quote_of(s):
    m = re.match(r'^«(.+?)»\s*[–—-]\s*(.+?)\.?$', s.strip())
    return {'text': m.group(1).rstrip('.'), 'by': m.group(2)} if m else {'text': s.strip('«»'), 'by': ''}


def false_kw(kw, tl):
    """кілт сөздің жалған сәйкестігі: «ток көзі» ≠ көз, «магнит индукциясы» ≠ электромагниттік индукция"""
    if kw == 'көз' and re.search(r'ток\s+көз|көзде', tl):
        return True
    if kw == 'индукция' and 'магнит индукция' in tl and 'электромагнит' not in tl:
        return True
    return False


def build(g, n, S):
    d = json.load(open(os.path.join(PJ, f'{g}_{n:02d}.json'), encoding='utf-8'))
    spec = S[n] if S is not None else {'f': tuple(d['f_spec']) if d.get('f_spec') else None}
    v = SITE.get(g, g)
    kgb = '-kgb-' in g
    disp = d['disp'].lstrip('0') or '0'
    main = visual(spec.get('f'), os.path.join(FIG, f'{g}-{n}-main'))
    ex_spec = None
    tl = d['topic'].lower().replace('i', 'і')
    for kw, sp in export_pres.EXTRA:
        if kw in tl and not false_kw(kw, tl):
            ex_spec = sp; break
    extra = None
    if ex_spec and not (spec.get('f') and ex_spec[0] == spec['f'][0] and tuple(ex_spec[1:]) == tuple(spec['f'][1:])):
        extra = visual(ex_spec, os.path.join(FIG, f'{g}-{n}-extra'))
    lab = d['kind'] == 'lab'
    slides = []
    slides.append({'t': 'title', 'kicker': f'Физика · {g}-сынып · {disp}-сабақ', 'title': d['topic'], 'sub': f"Бөлім: {d['bolim']}", 'foot': f"Құндылық: {d['value']}"})
    slides.append({'t': 'goals', **T('Сабақтың мақсаты', 'Сабақтың басы · 6 мин'), 'title': 'Сабақ соңында біз:', 'code': ' · '.join(d['codes'])[:220], 'items': d['smart'][:4]})
    slides.append({'t': 'text', **T('Білімді өзектендіру', 'Сабақтың басы · 6 мин'), 'title': d['opener'], 'sub': f"Өткен тақырып: {d['prev']}", 'paras': [d['opener_text']], 'quote': quote_of(d['quote'])})
    slides.append({'t': 'hook', **T('Проблемалық жағдаят', 'Сабақтың басы · 5 мин'), 'text': d['hook'], 'ask': 'Болжамдарыңды айтыңдар! Бүгінгі сабақтың тақырыбы қандай болуы мүмкін?'})
    th = {'t': 'theory', **T('Білімді жүйелеу' if d['kind'] == 'review' else ('Теориялық негіз' if lab else 'Жаңа білім'), 'Сабақтың ортасы · 12 мин'), 'title': d['topic'] if len(d['topic']) <= 45 and not lab else 'Негізгі ұғымдар', 'items': d['theory'][:5]}
    pic = None
    if main and 'img' in main:
        th['img'] = main['img']; th['caption'] = d.get('fc') or ''
        pic = extra
    else:
        if main: th.update(main)
        pic = extra
    slides.append(th)
    if len(d['formulas']) >= 2:
        slides.append({'t': 'formulas', **T('Негізгі формулалар мен ұғымдар', 'Сабақтың ортасы · 12 мин'), 'title': 'Есте сақта', 'items': d['formulas']})
    if lab:
        if d.get('equip'):
            slides.append({'t': 'equip', **T('Құрал-жабдықтар', 'Сабақтың ортасы · 18 мин'), 'title': 'Бізге не керек?', 'items': d['equip']})
        if d.get('steps'):
            slides.append({'t': 'procedure', **T('Жұмыс барысы', 'Сабақтың ортасы · 18 мин'), 'title': 'Қадам-қадаммен орында', 'items': d['steps']})
        if d.get('table'):
            slides.append({'t': 'table', **T('Өлшеу нәтижелерінің кестесі', 'Сабақтың ортасы · 18 мин'), 'title': 'Кестені дәптерге сыз', 'head': [h.strip() for h in d['table'].split('|')], 'rows': 4,
                           'note': 'Өлшеу нәтижелерін енгізіп, есептеп, қорытынды жазыңдар.'})
    if d.get('chart') and not (main and 'chart' in main):
        slides.append({'t': 'chart', **T('Графикпен жұмыс', 'Сабақтың ортасы · 12 мин'), 'title': d['chart']['title'], 'chart': d['chart'],
                       'items': ['Осьтерде қандай шамалар және бірліктер берілген?', 'Шамалар қалай тәуелді?', 'Графиктен бір мәнді оқып, формуламен тексер.']})
    if pic:
        if pic.get('illus'):
            slides.append({'t': 'picture', **T('Модельмен жұмыс', 'Сабақтың ортасы · 12 мин'), 'title': 'Интерактивті модель', **pic,
                           'items': ['Параметрлерді өзгертіп көр: не өзгереді?', 'Қандай заңдылықты байқадың?', 'Нәтижені формуламен тексер.']})
        else:
            slides.append({'t': 'picture', **T('Суретпен жұмыс', 'Сабақтың ортасы · 12 мин'), 'title': 'Суретте не бейнеленген?', **pic,
                           'items': ['Қандай физикалық шамалар көрсетілген?', 'Олар қалай байланысқан?', 'Өз сөзіңмен түсіндір.']})
    if d.get('ph'):
        slides.append({'t': 'link', **T('Виртуалды зертхана', 'Сабақтың ортасы · 12 мин'), 'title': 'PhET симуляциясы',
                       'items': ['Симуляцияны QR-код арқылы ашыңдар', 'Параметрлерді өзгертіп, нәтижені бақылаңдар', 'Қандай шама қалай өзгереді? Қорытындыны дәптерге жазыңдар'],
                       'url': d['ph_url'], 'qr': qr_uri(d.get('ph_qr'))})
    if d.get('bjb'):
        slides.append({'t': 'text', **T(f"Бөлім бойынша жиынтық бағалау №{d['bjb']}", 'Сабақтың ортасы · 15 мин'), 'title': 'Жиынтық бағалау', 'sub': f"«{d['bolim']}» бөлімі бойынша",
                       'paras': ['Тапсырмаларды өз бетіңше орында', 'Уақытты қадағала, жауабыңды таза жаз', 'Жұмысты уақытында тапсыр']})
    slides.append({'t': 'text', **T('Бекіту: ' + d['prm'], 'Сабақтың ортасы · 7 мин'), 'title': d['prm'].strip('«»'), 'paras': [d['prm_text']], 'task': ' '.join(d['practice'])})
    if d.get('energizer'):
        slides.append({'t': 'break', **T('Сергіту сәті', 'Сабақтың ортасы · 2 мин'), 'title': 'Сергіп алайық', 'text': d['energizer']})
    lv = [('A', 'білу, түсіну'), ('B', 'қолдану'), ('C', 'талдау, бағалау' if lab else 'талдау, жинақтау')]
    if kgb:  # ҚГБ: ҚМЖ-дағыдай C деңгейі жоқ
        lv = lv[:2]
    slides.append({'t': 'levels', **T('Нәтижені талдау: деңгейлік сұрақтар' if lab else 'Деңгейлік тапсырмалар', 'Сабақтың ортасы · 11 мин'), 'title': 'Деңгейіңді таңда', 'items': [list(x) for x in lv],
                   'note': 'А деңгейін орындасаң — В деңгейіне өт!'})
    names = {'A': 'А деңгейі: білу, түсіну', 'B': 'В деңгейі: қолдану', 'C': 'С деңгейі: ' + ('талдау, бағалау' if lab else 'талдау, жинақтау')}
    for i, (k, _) in enumerate(lv):
        task = ' '.join(d[k.lower()])
        if not task.strip():
            continue
        slides.append({'t': 'task', 'level': k, **T(names[k], 'Сабақтың ортасы · 11 мин'), 'q': task, 'answer': (d['key'] + ['', '', ''])[i] or 'Жауаптарды сыныппен бірге талқылаңдар.'})
    qa = [list(answer_split(x)) for x in d['quiz']]
    slides.append({'t': 'qa', **T('Бекіту: ' + d['cons'] + ' викторинасы', 'Сабақтың соңы · 7 мин'), 'title': 'Тез жауап бер', 'items': qa, 'qr': qr_uri(d.get('cons_qr')), 'qrLabel': d['cons']})
    slides.append({'t': 'reflect', **T('Рефлексия', 'Сабақтың соңы · 7 мин'), 'title': d['refl'], 'text': d['refl_text'],
                   'scale': [['9–10', 'Өте жақсы'], ['7–8', 'Жақсы'], ['5–6', 'Қанағаттанарлық'], ['0–4', 'Қолдау қажет']]})
    slides.append({'t': 'homework', **T('Үй тапсырмасы', 'Сабақтың соңы'), 'title': 'Үйде орында', 'items': [[k, t] for k, t in zip('AB' if kgb else 'ABC', d['hw'])]})
    slides.append({'t': 'end', 'title': 'Сабаққа белсенді қатысқандарыңа рахмет!', 'quote': quote_of(d['quote'])})
    return {'v': v, 'n': n, 'grade': int(g.split('-')[0]), 'topic': d['topic'], 'slides': slides}


def main():
    done = 0
    for g in ARGS:
        S = specs_of(g) if '-' not in g else None
        for f in sorted(os.listdir(PJ)):
            m = re.match(rf'^{g}_(\d+)\.json$', f)
            if not m:
                continue
            n = int(m.group(1))
            out = os.path.join(OUT, f'{SITE.get(g, g)}-{n}.json')
            if os.path.exists(out) and json.load(open(out, encoding='utf-8')).get('custom'):
                continue
            D = build(g, n, S)
            json.dump(D, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
            done += 1
        print(g, 'ok')
    print('жасалды:', done)


if __name__ == '__main__':
    main()
