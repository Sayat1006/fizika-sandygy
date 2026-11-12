# -*- coding: utf-8 -*-
"""ҚМЖ v2 generator.
Usage: python3 make2.py VARIANT [from-to]
VARIANT: 7, 8, 9, 10, 11 (existing КТЖ in ktzh*.json) or any key in ktzh_v2.json (e.g. 10-zhmb-3, 10-kgb-2, 11-kgb-2, 11-kgb-1).
Content: S[n] base specs (g{G}[a-d].py) + V[n] v2 fields (v{VARIANT}.py):
  d  – design override; ex – (title, [steps], answer); m – [misconceptions]; l – life link text;
  x  – [(task, answer)] extra handout tasks; f2/fc2 – second figure; base – (grade, n) to borrow a spec.
"""
import json, os, re, sys, subprocess, importlib, qrcode, textwrap
sys.path.insert(0, os.path.dirname(__file__))
import figs
from methods import OPENERS, PRACTICE, ENERGIZERS, CONSOLIDATE, REFLECT, SEN, VALUES, month_of
from make import clean_bolim, clean_topic, kind_of, strip_end, L as LL, slug

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'img', 'v2')
os.makedirs(IMG, exist_ok=True)
KTZH = json.load(open(os.path.join(ROOT, 'gen', 'ktzh.json')))
KTZH.update(json.load(open(os.path.join(ROOT, 'gen', 'ktzh2.json'))))
if os.path.exists(os.path.join(ROOT, 'gen', 'ktzh_v2.json')):
    KTZH.update(json.load(open(os.path.join(ROOT, 'gen', 'ktzh_v2.json'))))
PH = 'https://phet.colorado.edu/en/simulations/'
OUTROOT = os.environ.get('FS_OUT', os.path.join(ROOT, 'final_v2'))

# PhET slugs that were moved/renamed (HTML5 pages); unknown slugs are dropped
PH_OK = json.load(open(os.path.join(ROOT, 'gen', 'phet_ok.json'))) if os.path.exists(os.path.join(ROOT, 'gen', 'phet_ok.json')) else None


def qr(name, url):
    p = os.path.join(IMG, name)
    if not os.path.exists(p): qrcode.make(url, box_size=6, border=2).save(p)
    return name


def figure(spec, name, cap):
    if not spec: return []
    try:
        w, h = figs.draw(spec, os.path.join(IMG, name))
    except Exception as e:
        print('  fig fail', name, e); return []
    w2 = 290 if w >= 300 else w; h2 = round(h * w2 / w)
    return [f'img:{name}:{w2}:{h2}', f'> *{cap}*']


def concept_cards(t, topic):
    items = []
    for line in t:
        m = re.match(r'\*\*(.+?)\*\*\s*[–:—-]?\s*(.*)', line)
        if m and m.group(2):
            body = re.sub(r'\*\*|\$', '', m.group(2))
            items.append((m.group(1)[:26], textwrap.fill(body[:110], 26)))
    if len(items) < 2: return None
    return ('cards', 'Негізгі ұғымдар', items[:6])


def bul(xs): return [f'- {x}' for x in xs]


# ------------------------------------------------------------------ designs
DESIGNS_NEW = ['poe', 'jigsaw', 'case', 'pairs', 'flipped', 'gallery']
DESIGN_NAMES = {
    'poe': '«Болжа – бақыла – түсіндір»', 'jigsaw': '«Джигсо» (сарапшылар топтары)', 'case': 'Кейс-стади',
    'pairs': '«Сен – мен» жұптық оқыту', 'flipped': '«Төңкерілген сынып»', 'gallery': '«Галереяға саяхат»',
    'stations': '«Станциялар»', 'quest': 'Квест-ойын', 'lab': 'Зертханалық-зерттеу', 'tjb': 'Тоқсандық жиынтық бағалау',
}


def pick_design(kind, topic, idx, spec, v):
    if v.get('d'): return v['d']
    if kind == 'tjb': return 'tjb'
    if kind == 'lab' or spec.get('e'): return 'lab'
    if kind == 'review': return 'quest'
    tl = topic.lower()
    if 'есеп' in tl: return 'stations'
    d = DESIGNS_NEW[idx % len(DESIGNS_NEW)]
    if d == 'poe' and not spec.get('ph') and not v.get('demo'): d = 'case'
    return d


def st(stage, minutes, sub, teacher, student, assess, res):
    return {'stage': [f'**{stage}**', f'**{minutes} минут**'] + ([f'*{sub}*'] if sub else []),
            'teacher': teacher, 'student': student, 'assess': assess, 'res': res}


NTOT = 68
HIST = []  # (тақырып, кодтар) — коды жоқ сабаққа жақын тақырыпты табу үшін
QCODES = []  # тоқсанда өткен оқу мақсаттары (ТЖБ мен кодсыз қайталау сабақтарына)


def norm_code(c):
    """Оқу мақсатының коды: бос орындарды алып тастау, кодтан кейін «–»"""
    c = re.sub(r'^\s*(\d+)\s*\.\s*(\d+)\s*\.\s*(\d+)\s*\.\s*(\d+)\s*\.?', r'\1.\2.\3.\4', c.strip())
    c = re.sub(r'^(\d+\.\d+\.\d+\.\d+)\s*[-–—:]?\s*', r'\1 – ', c)
    return c


def stage_form(stages):
    """130-бұйрық нысаны: «Сабақтың кезеңі» бағанында — басы / ортасы / соңы; әдіс атауы — астында"""
    for x in stages:
        name = re.sub(r'\*', '', x['stage'][0])
        if name in ('Сабақтың басы', 'Сабақтың ортасы', 'Сабақтың соңы'):
            continue
        sub_ = re.sub(r'\*', '', x['stage'][2]) if len(x['stage']) > 2 else ''
        if name == 'Бөлім бойынша жиынтық бағалау':
            name = 'Бөлім бойынша жиынтық бағалау (БЖБ)'
        x['stage'] = ['**Сабақтың ортасы**', x['stage'][1], f'*{name}' + (f'. {sub_}' if sub_ else '') + '*']
    return stages


def build(variant, item, spec, v, idx, prev_topic, kgb=False):
    g = variant.split('-')[0]
    n = item['n']; topic = clean_topic(item['topic']); kind = spec.get('kind') or kind_of(topic)
    disp = item.get('disp', n)
    dm = re.match(r'^(\d{1,2})\.(\d{2})', item.get('date', '') or '')
    mon = int(dm.group(2)) if dm and 1 <= int(dm.group(2)) <= 12 else None
    datestr = ''  # күнді мұғалім өз кестесі бойынша қояды
    wk = (idx + 0.5) / max(1, NTOT) * 33
    mon = next(mm for lim, mm in [(4, 9), (8, 10), (12, 11), (16, 12), (19.5, 1), (23.5, 2), (26.5, 3), (30.5, 4), (99, 5)] if wk < lim)
    bjb = re.search(r'БЖБ\s*№?\s*(\d+)', topic)
    r = idx + int(g) * 5 + (7 if kgb else 0)
    op = OPENERS[r % len(OPENERS)]; pr = PRACTICE[(r * 3 + 1) % len(PRACTICE)]; en = ENERGIZERS[(r * 3) % len(ENERGIZERS)]
    co = CONSOLIDATE[(r * 3 + 2) % len(CONSOLIDATE)]; rf = REFLECT[(r * 7 + 5) % len(REFLECT)]
    sen1, sen2 = SEN[r % len(SEN)], SEN[(r + 3) % len(SEN)]
    val, quote = VALUES[mon]
    s = spec.get('s', []) or (['тоқсан бойы өткен бөлімдер бойынша негізгі ұғымдар мен заңдарды қолданады',
                               'есептерді шығаруда формулалар мен өлшем бірліктерін дұрыс пайдаланады',
                               'тапсырмаларды берілген уақытта өз бетінше орындайды'] if kind == 'tjb' else ['тоқсан бойынша меңгерген білімін көрсетеді'])
    d = pick_design(kind, topic, idx, spec, v)
    tag = variant.replace('-', '_')
    f1 = figure(spec.get('f'), f'{tag}_{n:03d}.png', '1-сурет. ' + spec.get('fc', topic)) if spec.get('f') else []
    cc = v.get('f2') or (concept_cards(spec.get('t', []), topic) if not kgb or not f1 else None)
    f2 = figure(cc, f'{tag}_{n:03d}b.png', '2-сурет. ' + (v.get('fc2') or 'Негізгі ұғымдар')) if cc else []
    ph = {'magnets-and-electromagnets': 'faradays-electromagnetic-lab'}.get(spec.get('ph'), spec.get('ph'))
    ph = ph if (PH_OK is None or ph in PH_OK) else None
    phl = [f'link:PhET:|{PH}{ph}'] if ph else []
    book = f'Физика {g}-сынып оқулығы'
    T = [f'- {x}' for x in spec.get('t', []) + v.get('deep', [])]
    A, B, C = LL(spec.get('a', [])), LL(spec.get('b', [])), LL(spec.get('c', []))
    K = spec.get('k', ['', '', ''])
    X = v.get('x', [])
    ex = v.get('ex')
    exl = ([f'**Үлгі есеп / мысал. {ex[0]}**'] + [f'{i}) {x}' for i, x in enumerate(ex[1], 1)] + [f'**Жауабы:** {ex[2]}']) if ex else LL(spec.get('p', []))
    sen_line = f'**ЕББҚ оқушыларына:** {sen1}; {sen2}.'
    sen_line2 = f'**ЕББҚ оқушыларына:** {SEN[(r + 5) % len(SEN)]}; {SEN[(r + 6) % len(SEN)]}.'
    stages = []
    hw = spec.get('hw', ['Оқулықтағы параграфты оқу.', 'Жаттығудан 2 есеп.', 'Қосымша материал дайындау.'])

    def opening(minutes, extra=None):
        return st('Сабақтың басы', minutes, 'Ұйымдастыру, қызығушылықты ояту, мақсат қою',
                  ['**Ұйымдастыру кезеңі.** Сәлемдесу, түгендеу, бағалау парағын тарату.'] + op[1](prev_topic) +
                  [f'**Проблемалық сұрақ:** {spec.get("h", "Бүгінгі сабақта қандай сұраққа жауап іздейміз?")}'] + (extra or []) +
                  ['Оқушылардың болжамдары тыңдалып, сабақтың тақырыбы мен мақсаты бірге анықталады.'],
                  op[2] + ['Болжам айтып, мақсатты анықтауға қатысады.'],
                  ['**ҚБ:** ауызша кері байланыс, «Бас бармақ».'], ['Слайд', 'Бағалау парағы'])

    def levels(minutes, label='Деңгейлік тапсырмалар (жеке жұмыс)'):
        return st('Сабақтың ортасы', minutes, label,
                  ['Оқушы деңгейін өзі таңдайды; А деңгейін орындаған оқушы В деңгейіне өтеді (тапсырмалар Қосымша 1-де).',
                   '**А деңгейі (білу, қолдану):**'] + A + ['**В деңгейі (талдау):**'] + B + ([] if kgb else ['**С деңгейі (жинақтау, бағалау):**'] + C) + [sen_line2],
                  ['Деңгейін таңдап, жеке орындайды.', 'Жауап кілтімен өзін-өзі тексереді.'],
                  ['**Дескриптор:**', f'**А:** {strip_end(s[1] if len(s) > 1 else s[0])} – **2 балл**', f'**В:** {strip_end(s[2] if len(s) > 2 else s[-1])} – **3 балл**'] +
                  ([] if kgb else [f'**С:** {strip_end(s[-1])} – **4 балл**']),
                  ['Деңгейлік карточкалар', 'Жауап кілті'])

    def closing(minutes):
        return st('Сабақтың соңы', minutes, 'Бекіту, рефлексия, үй тапсырмасы',
                  [f'**Бекіту: {co[0]} викторинасы** (мұғалім алдын ала дайындайды). Сұрақтар:'] + bul(spec.get('q', [])) +
                  [f'link:{co[0]}:|{co[1]}', f'**Рефлексия {rf[0]}:** {rf[1]}', '**Үй тапсырмасы (таңдау бойынша):**',
                   f'- **А:** {hw[0]}', f'- **В:** {hw[1]}'] + ([] if kgb else [f'- **С:** {hw[2]}']),
                  ['Викторинаға жауап береді.', 'Балын қосып, өзін-өзі бағалайды.', 'Рефлексия жасайды.'],
                  ['**Дескриптор:** викторина сұрақтарының 80%-ына дұрыс жауап береді – **1 балл**', '**Шкала:** 90–100% «өте жақсы», 70–89% «жақсы», 50–69% «қанағаттанарлық»'],
                  [f'{co[0]} (QR)', 'Kundelik.kz'])

    def energizer():
        return st('Сергіту сәті', 1 if kgb else 2, None, [en], ['Қимылмен орындайды.'], ['Бағаланбайды: белсенділік пен көңіл-күй бақыланады'], ['Тақтадағы нұсқаулық', 'Музыка (қалауынша)'])

    def bjb_stage(minutes):
        return st('Бөлім бойынша жиынтық бағалау', minutes, None,
                  [f'**БЖБ №{bjb.group(1)}** «{clean_bolim(item["bolim"])}» бөлімі бойынша спецификацияға сәйкес өткізіледі.', 'Нұсқаулық беріледі, уақыт қадағаланады, жұмыстар жиналады.', sen_line],
                  ['БЖБ тапсырмаларын өз бетінше орындайды.'], ['Балл қою кестесі (спецификация бойынша)'], ['БЖБ тапсырма парақтары'])

    theory_assess = ['**Дескриптор:**', f'- {strip_end(s[0])};', '- топта/жұпта белсенді жұмыс істейді.', '**2 балл**']
    short = bool(bjb)

    if d == 'tjb':
        stages = [st('Сабақтың басы', 3, None, ['Сәлемдесу, түгендеу, оқушыларды жеке отырғызу.', '**Нұсқаулық:** ТЖБ уақыты, тапсырмалар саны, балл қою тәртібі. Құндылық: адалдық, өз бетінше жұмыс.'],
                     ['Нұсқаулықты тыңдап, сұрақ қояды.'], ['Нұсқаулықты түсінгенін ауызша тексеру'], ['ТЖБ спецификациясы']),
                  st('Сабақтың ортасы', 34 if not kgb else 35, 'Тоқсандық жиынтық бағалау',
                     [f'**ТЖБ** ҚР ОАМ «Бағалау шараларының спецификациясы» негізінде өткізіледі. Тоқсан бөлімдері: {spec.get("quarter_topics", "тоқсанда өткен бөлімдер")}.',
                      '- Тапсырмалар 2 нұсқада беріледі; түрлері: көп таңдаулы, қысқа жауапты, құрылымдық, есептер.', '- Уақыт 10 және 5 минут қалғанда ескертіледі.', sen_line + ' Спецификацияға сәйкес бейімделген нұсқа.'] + f1,
                     ['ТЖБ тапсырмаларын өз бетінше орындайды.'], ['**Дескриптор:** спецификациядағы әр тапсырманың дескрипторы бойынша', 'Балл қою кестесі (спецификация бойынша)'], ['ТЖБ тапсырма парақтары', 'Таймер']),
                  st('Сабақтың соңы', 3 if not kgb else 2, None, ['Жұмыстарды жинау.', f'**Рефлексия {rf[0]}:** {rf[1]}', '**Үй тапсырмасы:** ТЖБ-да қиын болған тапсырма түрлерін оқулықтан қайталау; келесі бөлімнің кіріспе тақырыбын оқып келу.', 'ТЖБ нәтижесі мен талдауы келесі сабақта хабарланады.'],
                     ['Жұмысын тапсырады, рефлексия жасайды.'], ['Өзін-өзі бағалау'], ['Стикерлер'])]
    elif d == 'lab':
        stages = [opening(4 if not short else 3, ['**Қауіпсіздік техникасы:** зертханалық жұмыс ережелері қайталанады; топта «қауіпсіздік жауаптысы» тағайындалады.']),
                  st('Теориялық дайындық', 6 if not short else 4, 'Теория, гипотеза',
                     ['**Теориялық негіз.**'] + T + f1 + ['**Гипотеза:** оқушылар тәжірибенің нәтижесін болжап, жұмыс парағына жазады.'] + phl,
                     ['Теорияны қайталайды, гипотеза жазады.'], ['**Дескриптор:**', f'- {strip_end(s[0])}.', '**1 балл**'], [book, 'Жұмыс парағы']),
                  st('Зертханалық жұмыс', 15 if not short else 10, 'Топпен тәжірибе жүргізу',
                     ['**Құрал-жабдықтар:** ' + ', '.join(spec.get('e', ['зертханалық жиынтық'])) + '.', '**Жұмыс барысы:**'] +
                     [f'{i}) {x}' for i, x in enumerate(spec.get('st', []), 1)] + [f'**Өлшеу нәтижелерінің кестесі:** {spec.get("tb", "Қосымша 1-дегі кесте")}',
                     'Мұғалім топтарды аралап, аспаптан дұрыс оқуды және қауіпсіздікті қадағалайды.', sen_line],
                     ['Құралдарды жинап, өлшеу жүргізеді.', 'Кестені толтырып, есептейді.'],
                     ['**Дескриптор:**', '- құралдарды дұрыс жинайды, қауіпсіздікті сақтайды – 1;', '- өлшеулерді жүргізіп, кестеге енгізеді – 1;',
                      f'- {strip_end(s[1] if len(s) > 1 else s[0])} – 1;', '**3 балл**'], spec.get('e', ['Жиынтық'])[:4] + ['Жұмыс парағы']),
                  st('Нәтижені өңдеу', 8 if not short else 5, 'Талдау, қорытынды, қателік',
                     ['**Талдау сұрақтары (деңгейлік):**', '**А:**'] + A + ['**В:**'] + B + ([] if kgb else ['**С:**'] + C) + exl[:1] + f2 +
                     ['**Қорытынды:** гипотеза нәтижемен салыстырылады; өлшеу қателігінің себептері аталады.'],
                     ['Нәтижені талдап, қорытынды жазады.'], ['**Дескриптор:**', f'- {strip_end(s[-1])};', '- қателік себептерін атайды.', '**2 балл**'],
                     ['Калькулятор', 'Миллиметрлік қағаз'])]
        if bjb: stages.append(bjb_stage(12))
        stages.append(closing(7 if not short else 6))
    elif d == 'quest':
        tasks = A + B + C + [t for t, _ in X]
        keys = ['«Формулалар кілті»', '«Бірліктер кілті»', '«График кілті»', '«Өмір кілті»', '«Шебер кілті»']
        stages = [opening(4),
                  st('Білімді жүйелеу', 8, 'Ақыл-ой картасы', ['**Ақыл-ой картасы (топпен).** Бөлімнің негізгі ұғымдары, формулалары мен бірліктері бір картаға жинақталады:'] + T + f1,
                     ['Топпен ақыл-ой картасын құрып, қорғайды.'], theory_assess, ['А3 қағаз, маркерлер', book]),
                  st('Квест-ойын', 18 if not short else 10, '«Сейфті аш»: 5 кілт',
                     ['**Квест «Сейфті аш».** Әр топ 5 «кілтті» (тапсырманы) реті бойынша орындайды; дұрыс жауап – келесі кілтке рұқсат. Бірінші ашқан топ – жеңімпаз.'] +
                     [f'**{keys[i]}:** {t}' for i, t in enumerate(tasks[:5])] + exl + [sen_line],
                     ['Топпен кілттерді кезекпен ашады.', 'Шешімдерін тексертіп, келесі кілтке өтеді.'],
                     ['**Дескриптор:** әр дұрыс кілт – 1 балл.', '**5 балл**'], ['Кілт карточкалары', 'Таймер']),
                  energizer()]
        if bjb: stages.append(bjb_stage(15))
        stages.append(closing(6 if not short else 4))
        stages = [x for x in stages if x]
    else:
        # ---- new knowledge / problem-solving designs
        if d == 'stations':
            sts = (A + B + C + [t for t, _ in X])[:4]
            mid = [st('Үлгі есеп', 7 if not short else 5, '«Мен көрсетемін – бірге шығарамыз»', exl + T[:2] + f1,
                      ['Алгоритм бойынша мұғаліммен бірге шығарады.'], ['**Дескриптор:**', f'- {strip_end(s[0])}.', '**1 балл**'], [book, 'Слайд']),
                   st('Станциялар', 16 if not short else 10, f'Топтық айналым: {len(sts)} станция',
                      ['**«Станциялар» әдісі.** Топтар белгі бойынша сағат тілімен ауысады, әр станцияда тапсырма карточкасы бар (Қосымша 1). Рөлдер: есептеуші, тексеруші, хатшы, спикер.'] +
                      [f'**{i}-станция.** {t}' for i, t in enumerate(sts, 1)] + f2 + [sen_line],
                      ['Рөлдер бойынша тапсырманы орындайды.', 'Жауапты топтық жауап парағына жазады.'],
                      ['**Дескриптор (әр станция):** формуланы дұрыс таңдайды, бірлікті аударады – 1; дұрыс жауап табады – 1.', f'**{2 * len(sts)} балл**', 'Станциядағы кілтпен **өзара бағалау**.'],
                      ['Станция карточкалары', 'Калькулятор'])]
        elif d == 'poe':
            mid = [st('Болжа – бақыла – түсіндір', 12 if not short else 9, DESIGN_NAMES['poe'],
                      ['**1. Болжа.** Мұғалім тәжірибенің шартын айтады, оқушылар нәтижені жеке болжап, дәптерге жазады.',
                       f'**2. Бақыла.** {v.get("demo") or "Демонстрациялық тәжірибе немесе PhET симуляциясы интерактивті тақтада көрсетіледі; оқушылар параметрлерді өзгертуді ұсынады."}',
                       '**3. Түсіндір.** Болжам мен нәтиже салыстырылып, ғылыми түсіндірме бірге құрылады:'] + T + f1 + phl,
                      ['Болжам жасайды, бақылайды, болжаммен салыстырып түсіндіреді.'], theory_assess, [book, 'Демонстрациялық құрал', 'PhET (QR)']),
                   st('Жұппен жаттығу', 7, pr[0], [f'**{pr[0]}.** {pr[1]}'] + exl + f2, ['Жұппен есеп шығарып, бір-бірін тексереді.'],
                      ['**Дескриптор:** шешімді қадамдап, дұрыс рәсімдейді.', '**1 балл**'], ['Жұмыс дәптері'])]
        elif d == 'jigsaw':
            parts = T if len(T) >= 3 else T + ['- Оқулықтағы мысалдар мен суреттер.']
            mid = [st('Джигсо', 14 if not short else 10, DESIGN_NAMES['jigsaw'],
                      ['**«Джигсо».** Әр «үй» тобынан бір оқушы сарапшылар тобына барады (5 минут), мәтін бөлігін меңгеріп, үй тобына оралып түсіндіреді (6 минут).'] +
                      [f'**{i}-сарапшылар:** {p[2:]}' for i, p in enumerate(parts[:4], 1)] + f1 + [sen_line],
                      ['Сарапшылар тобында бөлімді меңгереді.', 'Үй тобына түсіндіреді, сұрақ қояды.'],
                      ['**Дескриптор:**', '- өз бөлімін нақты түсіндіреді – 1;', f'- {strip_end(s[0])} – 1.', '**2 балл**'], [book, 'Сарапшылық мәтін карточкалары']),
                   st('Бекіту', 6, 'Үлгі есеп / талдау', exl + f2, ['Үлгіні талдап, ұқсас тапсырманы орындайды.'], ['**Дескриптор:** үлгі бойынша шешеді.', '**1 балл**'], ['Слайд'])]
        elif d == 'case':
            mid = [st('Кейс-стади', 13 if not short else 9, 'Өмірлік жағдаятты зерттеу',
                      [f'**Кейс.** {v.get("l") or spec.get("h", "")}', 'Топтарға 3 сұрақ: 1) Мұнда қандай физикалық құбылыс бар? 2) Оны қандай шамалар сипаттайды? 3) Мәселені қалай шешуге болады?',
                       '**Кейсті шешуге қажетті теория** (мұғалім слайдпен қысқа түсіндіреді, оқушылар Т-кесте толтырады):'] + T + f1,
                      ['Кейсті талдап, сұрақтарға топпен жауап береді.', 'Т-кесте толтырады.'], theory_assess, [book, 'Кейс карточкасы']),
                   st('Кейсті шешу', 7, 'Есептеу және дәлелдеу', exl + f2 + [sen_line], ['Есептеп, кейске негізделген шешім ұсынады.'],
                      ['**Дескриптор:** шешімді есептеумен дәлелдейді.', '**1 балл**'], ['Жұмыс дәптері'])]
        elif d == 'pairs':
            mid = [st('Жаңа білім', 9 if not short else 7, 'Түсіндірмелі әңгіме + концептуалды карта',
                      ['Мұғалім негізгі ұғымдарды слайд пен сызба арқылы түсіндіреді; оқушылар концептуалды карта құрады:'] + T + f1 + phl,
                      ['Тыңдап, концептуалды карта құрады.'], theory_assess, [book, 'Слайд']),
                   st('«Сен – мен» жұптық оқыту', 10, 'Өзара оқыту',
                      ['**«Сен – мен».** 1-оқушы үлгі есепті шығарып, әр қадамын дауыстап түсіндіреді, 2-оқушы тексереді; келесі есепте рөлдер ауысады.'] + exl + f2 + [sen_line],
                      ['Кезекпен шығарып, бір-біріне түсіндіреді.'], ['**Дескриптор:** шешім қадамдарын түсіндіреді.', '**2 балл**'], ['Жұмыс дәптері'])]
        elif d == 'flipped':
            mid = [st('Үй тапсырмасын тексеру', 7, DESIGN_NAMES['flipped'],
                      ['Оқушылар үйде тақырып бойынша бейнесабақты (Bilimland) көріп келген. Түсінікті тексеру сұрақтары:'] + bul(spec.get('q', [])) +
                      ['Жауаптары бойынша сынып «түсінді» / «қайталау керек» топтарына бөлінеді.'],
                      ['Сұрақтарға жауап береді, түсініксіз тұстарды атайды.'], ['**ҚБ:** «Бағдаршам» карточкалары.'], ['Bilimland (QR)']),
                   st('Терең түсіндіру', 8 if not short else 6, 'Күрделі тұстар',
                      ['Мұғалім «қайталау керек» тобымен күрделі тұстарды талдайды, «түсінді» тобы үлгі есепті өз бетінше шығарады:'] + T + f1 + exl,
                      ['Топтарға бөлініп, деңгейіне сай жұмыс істейді.'], theory_assess, [book, 'Слайд']),
                   st('Бекіту', 5, pr[0], [f'**{pr[0]}.** {pr[1]}'] + LL(spec.get('p', [])) + f2, ['Тапсырманы орындайды.'], ['**Дескриптор:** шешімді дұрыс рәсімдейді.', '**1 балл**'], ['Карточка'])]
        else:  # gallery
            parts = T if len(T) >= 3 else T + ['- Оқулықтағы мысалдар.']
            mid = [st('Галереяға саяхат', 12 if not short else 9, DESIGN_NAMES['gallery'],
                      ['**«Галереяға саяхат».** Қабырғаға тақырыптың 4 бөлігі бойынша плакат ілінген; топтар 2,5 минуттан әр «экспонатта» болып, негізгі ойды жазады:'] +
                      [f'**{i}-экспонат:** {p[2:]}' for i, p in enumerate(parts[:4], 1)] + f1,
                      ['Топпен плакаттардан ақпарат жинап, түйіндейді.'], theory_assess, ['4 плакат', 'Стикерлер']),
                   st('Бекіту', 8, pr[0], [f'**{pr[0]}.** {pr[1]}'] + exl + f2 + [sen_line], ['Тапсырманы орындап, талқылайды.'],
                      ['**Дескриптор:** үлгі бойынша дұрыс шешеді.', '**1 балл**'], ['Жұмыс дәптері'])]
        stages = [opening(5 if not short else 4)] + mid
        if not short: stages.append(energizer())
        if d != 'stations' or short: stages.append(levels(9 if not short else 6))
        else: stages.append(levels(6, '«Шығу билеті» (деңгейлік)'))
        if bjb: stages.append(bjb_stage(15 if d != 'stations' else 12))
        stages.append(closing(5 if not short else 4))
    # ---------------- timing: 45-minute lesson; БЖБ = 20 мин сабақ + 25 мин БЖБ; ТЖБ = 2 + 40 + 3
    def mins(x): return int(re.search(r'(\d+)', x['stage'][1]).group(1))
    def setm(x, m): x['stage'][1] = f'**{m} минут**'
    if d == 'tjb':
        for x, m in zip(stages, (2, 40, 3)): setm(x, m)
    else:
        bj = [x for x in stages if x['stage'][0].startswith('**Бөлім бойынша')]
        if bj:
            setm(bj[0], 25)
            body = [x for x in stages if x is not bj[0] and not x['stage'][0].startswith('**Сергіту')]
            if len(body) > 4: body = [body[0], body[1], body[-1]] if d not in ('lab',) else [body[0], body[2], body[-1]]
            target, keep = 20, body
        else:
            target, keep = 45, stages
        tot = sum(mins(x) for x in keep)
        for x in keep: setm(x, max(1, round(mins(x) * target / tot)))
        diff = target - sum(mins(x) for x in keep)
        big = max(keep[1:-1] or keep, key=mins); setm(big, mins(big) + diff)
        stages = [x for x in stages if x in keep or (bj and x is bj[0])]
        if bj:  # БЖБ – сабақтың соңында, қорытындыдан бұрын
            stages = [x for x in stages if x is not bj[0]]; stages.insert(len(stages) - 1, bj[0])

    # ---------------- sections after the lesson table
    stages = stage_form(stages)
    sections = []
    if v.get('m'):
        sections.append({'title': 'Мұғалімге ескерту: оқушылар жиі жіберетін қателер', 'type': 'text', 'lines': bul(v['m'])})
    if v.get('l'):
        sections.append({'title': 'Өмірмен байланыс', 'type': 'text', 'lines': [v['l']]})
    if d not in ('tjb',):
        krows = [['**А**', K[0] if len(K) > 0 else ''], ['**В**', K[1] if len(K) > 1 else '']] + ([] if kgb else [['**С**', K[2] if len(K) > 2 else '']])
        krows += [[f'**Қосымша {i}**', a] for i, (_, a) in enumerate(X, 1)]
        if ex: krows.append(['**Үлгі есеп**', ex[2]])
        sections.append({'title': 'Тапсырмалардың жауап кілті', 'cols': ['Тапсырма', 'Жауабы'], 'widths': [2200, 13200], 'rows': krows})
        hand = ['**Аты-жөні:** ______________________  **Сынып:** ______  **Күні:** ________', '']
        line = '_' * 92
        hand += ['**А деңгейі**'] + A + [line, line] + ['', '**В деңгейі**'] + B + [line, line, line]
        if not kgb: hand += ['', '**С деңгейі**'] + C + [line, line, line]
        if X:
            hand += ['', '**Қосымша тапсырмалар**']
            for i, (t, _) in enumerate(X, 1): hand += [f'{i}) {t}', line]
        if d == 'lab' and spec.get('tb'): hand += ['', f'**Өлшеу кестесі:** {spec["tb"]}', '', '**Қорытынды:** ________________________________________________']
        sections.append({'title': 'Қосымша 1. Оқушыға арналған тапсырмалар парағы (басып шығаруға)', 'type': 'text', 'lines': hand, 'newPage': True})
        # тірек-конспект: негізгі терминдер бос қалдырылады (оқушы сабақ барысында толтырады)
        notes = []
        for line in spec.get('t', []) + v.get('deep', []):
            blanked = re.sub(r'\*\*(.+?)\*\*', lambda m_: '_' * max(8, min(22, len(m_.group(1)) + 4)), line)
            notes.append('• ' + blanked)
        if notes and d not in ('tjb',):
            sections.append({'title': 'Қосымша 3. Тірек-конспект (бос орындарды сабақ барысында толтыр)', 'type': 'text',
                             'lines': [f'**Тақырып:** {topic}', ''] + notes + ['', '**Есімде қалған формула / ереже:** ' + '_' * 60, '_' * 92]})
    if d not in ('tjb',):
        rows, total = [], 0
        for x in stages:
            m = [re.search(r'\*\*(\d+)(?:–\d+)? балл\*\*', a) for a in x['assess']]
            pts = [int(mm.group(1)) for mm in m if mm]
            if not pts: continue
            p_ = max(pts) if any('**А:**' in a for a in x['assess']) else sum(pts)
            if any('**А:**' in a for a in x['assess']): p_ = sum(pts)
            name = re.sub(r'\*', '', x['stage'][2] if len(x['stage']) > 2 else x['stage'][0])
            rows.append([name, ' '.join(re.sub(r'\*\*', '', a) for a in x['assess'] if not re.match(r'\*\*\d', a))[:160], str(p_), '']); total += p_
        if rows:
            rows.append(['**Барлығы**', f'{round(total * 0.85)}–{total} «өте жақсы», {round(total * 0.65)}–{round(total * 0.85) - 1} «жақсы», {round(total * 0.45)}–{round(total * 0.65) - 1} «қанағаттанарлық»', f'**{total}**', ''])
            sections.append({'title': 'Қосымша 2. Бағалау парағы (әр оқушыға)', 'cols': ['Кезең', 'Дескриптор', 'Балл', 'Менің балым'], 'widths': [3000, 9200, 1400, 1800], 'rows': rows})
    big = []
    for fl in (f1, f2):
        if fl:
            _, nm, w, h = fl[0].split(':'); k = min(560 / int(w), 330 / int(h))
            big += [f'img:{nm}:{round(int(w) * k)}:{round(int(h) * k)}', fl[1], '']
    if big and d not in ('tjb',):
        big += ['**Суретпен жұмыс (сұрақтар):** 1) Суретте қандай құбылыс/құрылғы бейнеленген? 2) Қандай физикалық шамалар көрсетілген және олар қалай байланысқан? 3) Суретке сүйеніп, өмірден бір мысал келтір.']
        sections.append({'title': 'Қосымша 4. Көрнекілік (интерактивті тақтаға немесе басып шығаруға)', 'type': 'text', 'lines': big, 'newPage': True})
    items = []
    if ph: items.append(('PhET', 'симуляция', PH + ph, qr(f'qr_phet_{ph}.png', PH + ph)))
    if d != 'tjb': items.append((co[0], 'викторина', co[1], qr(co[2], co[1])))
    items += [('Bilimland', 'видеосабақ', 'https://bilimland.kz/', qr('qr_bilimland.png', 'https://bilimland.kz/')),
              ('OPIQ', 'цифрлық оқулық', 'https://www.opiq.kz/', qr('qr_opiq.png', 'https://www.opiq.kz/'))]
    sections.append({'title': 'Сандық ресурстар (QR-кодтар)', 'type': 'qr', 'items': items[:4]})
    hdr_val = [f'«Адал азамат» бағдарламасы бойынша: **{val}**.', f'*{quote}*',
               spec.get('v', 'Құндылық топтық жұмыстағы жауапкершілік пен өзара құрмет арқылы жүзеге асады.')]
    codes = [norm_code(c) for c in (item.get('codes') or spec.get('codes') or [])] or (['Тоқсанда өткен оқу мақсаттары (ТЖБ спецификациясы бойынша)'] if kind == 'tjb' else ['Бөлімде өткен оқу мақсаттарын қайталау және жүйелеу'])
    return {'no': str(disp), 'zam': '____________________', 'teacher': '', 'date': datestr, 'grade': item.get('gradeLabel', g),
            'bolim': clean_bolim(item['bolim']), 'topic': topic, 'objectives': codes, 'smart': bul(s),
            'extraHeader': [['Құндылықтарға баулу:', hdr_val]], 'stages': stages, 'sections': sections}, disp, d


def load_specs(g):
    specs = {}
    for part in sorted(f for f in os.listdir(os.path.join(ROOT, 'gen')) if re.match(rf'g{g}[a-z]?\.py$', f)):
        specs.update(importlib.import_module(part[:-3]).S)
    return specs


def main():
    variant = sys.argv[1]; rng = sys.argv[2] if len(sys.argv) > 2 else None
    g = variant.split('-')[0]; kgb = '-kgb-' in variant
    vmod = f'v{variant.replace("-", "_")}'
    V = importlib.import_module(vmod).V if os.path.exists(os.path.join(ROOT, 'gen', vmod + '.py')) else {}
    base_specs = {gg: None for gg in ['7', '8', '9', '10', '11']}
    def spec_of(gg, n):
        if base_specs[gg] is None: base_specs[gg] = load_specs(gg)
        return base_specs[gg].get(n)
    items = [dict(x) for x in KTZH[variant]]
    site = {'7': '7', '8': '8', '9': '9', '10': '10-zhmb-2', '11': '11-zhmb-3'}.get(variant, variant)
    try:
        LS = {l['n']: l for l in json.load(open(os.path.join(os.path.dirname(os.path.dirname(ROOT)), 'public', 'lessons.json'))) if l['v'] == site}
    except Exception: LS = {}
    for it in items:
        l = LS.get(it['n'])
        if l:
            it.setdefault('disp', l.get('disp', it['n']))
            if not it.get('date') and l.get('date'): it['date'] = f"{l['date'][8:10]}.{l['date'][5:7]}"
    lo, hi = (map(int, rng.split('-')) if rng else (1, 10 ** 6))
    outdir = os.path.join(OUTROOT, variant); os.makedirs(outdir, exist_ok=True)
    jdir = os.path.join(ROOT, 'json_v2'); os.makedirs(jdir, exist_ok=True)
    stats = {}; index = {}
    QCODES.clear(); HIST.clear()
    global NTOT; NTOT = len(items)
    for i, item in enumerate(items):
        n = item['n']
        if not (lo <= n <= hi): continue
        v = V.get(n, {})
        bg, bn = v.get('base', (g, n)) if variant in ('7', '8', '9', '10', '11') or v.get('base') else (None, None)
        spec = dict(spec_of(bg, bn) or {}) if bg else {}
        spec.update(v.get('spec', {}))
        if not spec and kind_of(clean_topic(item['topic'])) != 'tjb': print('  no spec', variant, n); continue
        prev = clean_topic(items[i - 1]['topic']) if i else 'Физика пәніне кіріспе'
        own = item.get('codes') or spec.get('codes') or []
        if own and not any(re.search(r'\d+\.\s*\d+\.\s*\d+', c) for c in own) and kind_of(clean_topic(item['topic'])) != 'tjb':
            # КТЖ-да код жоқ (мыс. қорытынды физикалық практикум): тақырыбы ең жақын өткен сабақтың нақты коды
            STOP = {'анықт', 'жұмыс', 'зертт', 'зерде', 'қолда', 'есепт', 'практ', 'сабақ', 'құрыл', 'принц', 'танысу', 'таныс', 'жинау', 'тәжір', 'бойын', 'зертх', 'өлшеу', 'шығар', 'негіз', 'көмег', 'арқыл'}
            stems = lambda t: {w[:5].lower() for w in re.findall(r'[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]{5,}', t)} - STOP
            mine = stems(clean_topic(item['topic']))
            # мағынасы жақын, бірақ сөзі басқа тақырыптар (практикум → бағдарламадағы негізгі сабақ)
            ALIAS = {'толқындарының ұзынд': 'Дифракциялық тор', 'индуктивт': 'активті және реактивті кедергі', 'сыйымдылығын': 'активті және реактивті кедергі',
                     'Астрономиялық карта': 'Жұлдыздар әлемі', 'сциллограф': 'тербелмелі контур'}
            alias = next((v_ for k_, v_ in ALIAS.items() if k_ in item['topic']), None)
            pick = [h for h in HIST if alias and alias in h[0]]
            best = pick[-1] if pick else max(HIST, key=lambda h: len(mine & stems(h[0])), default=None)
            if pick: mine = stems(best[0])
            if best and mine & stems(best[0]):
                item = {**item, 'codes': best[1] + [own[0].split(':')[0] + ': ' + own[0].split(':', 1)[-1].strip()]}
                if os.environ.get('FS_DEBUG'): print('  код:', clean_topic(item['topic'])[:40], '←', best[0][:40], '|', best[1][0][:30])
                own = item['codes']
        if any(re.search(r'\d+\.\s*\d+\.\s*\d+', c) for c in own):
            HIST.append((clean_topic(item['topic']), [c for c in own if re.search(r'\d+\.\s*\d+\.\s*\d+', c)][:2]))
        if own and kind_of(clean_topic(item['topic'])) != 'tjb':
            QCODES.extend(c for c in own if c not in QCODES)
        elif QCODES:
            item = {**item, 'codes': QCODES[-8:]}
        if kind_of(clean_topic(item['topic'])) == 'tjb':
            QCODES.clear()
        data, disp, d = build(variant, item, spec, v, i, prev, kgb)
        stats[d] = stats.get(d, 0) + 1
        jp = os.path.join(jdir, f'{variant}_{n:03d}.json'); json.dump(data, open(jp, 'w'), ensure_ascii=False)
        dd = f'{disp:02d}' if isinstance(disp, int) else str(disp).zfill(2)
        out = os.path.join(outdir, f'ҚМЖ_{variant}_{dd}_{slug(data["topic"])}.docx')
        r = subprocess.run(['node', os.path.join(ROOT, 'build2.js'), jp, out], capture_output=True, text=True, env={**os.environ, 'FS_IMG': IMG})
        if r.returncode: print('  build fail', n, r.stderr[-300:])
        index[n] = os.path.basename(out)
    ip = os.path.join(outdir, 'index.json'); old = json.load(open(ip)) if os.path.exists(ip) else {}
    old.update({str(k): v_ for k, v_ in index.items()}); json.dump(old, open(ip, 'w'), ensure_ascii=False, indent=0)
    print(variant, stats)


if __name__ == '__main__':
    main()
