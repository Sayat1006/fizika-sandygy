# -*- coding: utf-8 -*-
"""Usage: python3 make.py GRADE [from-to]  -> builds docx for lessons that have specs."""
import json, os, re, sys, subprocess, importlib, qrcode
sys.path.insert(0, os.path.dirname(__file__))
import figs
from methods import *

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'img')
KTZH = json.load(open(os.path.join(ROOT, 'gen', 'ktzh.json')))
KTZH.update(json.load(open(os.path.join(ROOT, 'gen', 'ktzh2.json'))))
TEACHER = os.environ.get('FS_TEACHER', 'Айтбаев С.Б.')
ZAM = os.environ.get('FS_ZAM', 'Г. Жылкайдарова')
NODATE = os.environ.get('FS_NODATE') == '1'
OUTROOT = os.environ.get('FS_OUT')
PHET = 'https://phet.colorado.edu/en/simulations/'
EXTRA_QR = [('Bilimland', 'https://bilimland.kz/', 'qr_bilimland.png'), ('OPIQ', 'https://www.opiq.kz/', 'qr_opiq.png')]


def qr(name, url):
    p = os.path.join(IMG, name)
    if not os.path.exists(p): qrcode.make(url, box_size=6, border=2).save(p)
    return name


def clean_bolim(b):
    b = re.sub(r'\s*\d+(\s*\+\s*\d+)?\s*сағ.*$', '', b).strip()
    b = re.sub(r'^\d{1,2}(\.\d+)+\.?\s*[А-ЯA-ZӘ]?\.?\s*', '', b).strip()
    b = re.sub(r'(?<=[а-яәіңғүұқөһ])-(?=[а-яәіңғүұқөһ])', '', b)
    b = b[:1].upper() + b[1:]
    return b.replace('  ', ' ')


def clean_topic(t):
    return re.sub(r'\s+', ' ', t.replace('\n', ' ')).strip().lstrip('.')


def kind_of(t):
    tl = t.lower()
    if 'тоқсандық жиынтық' in tl: return 'tjb'
    if 'зертханалық' in tl: return 'lab'
    if tl.startswith('қайталау') or 'бөлімін қайталау' in tl or tl.startswith('жарық құбылыстарын қайталау') or 'тоқсандық қайталау' in tl or 'тақырыпты қайталау' in tl or 'жылдық қорытынды' in tl or 'қорытынды сабақ' in tl: return 'review'
    return 'new'


def strip_end(s):
    return s.rstrip(' ;.,')


def L(x):
    return x if isinstance(x, list) else [x]


def build_lesson(g, item, spec, idx, prev_topic):
    n = item['n']; topic = clean_topic(item['topic']); kind = spec.get('kind') or kind_of(topic)
    if 'disp' in item: disp = item['disp']
    else: disp = n if (g == '7' or n <= 52) else ('52а' if n == 53 else n - 1)
    dm = re.match(r'^(\d{1,2})\.(\d{2})', item.get('date', '') or '')
    mon = int(dm.group(2)) if dm and 1 <= int(dm.group(2)) <= 12 else None
    datestr = f'{int(dm.group(1)):02d}.{mon:02d}.{2026 if mon >= 9 else 2027} ж.' if (mon and not NODATE) else '«___» ____________ 20___ ж.'
    bjb = re.search(r'БЖБ\s*№\s*(\d+)', topic)
    r = idx + int(g) * 5  # rotation seed, unique per grade
    op = OPENERS[r % len(OPENERS)]
    nw = NEW[(r * 5 + 3) % len(NEW)]
    if spec.get('ph') and kind == 'new' and (r % 3 == 0): nw = NEW[2]
    if not spec.get('ph') and nw[0].startswith('PhET'): nw = NEW[(r * 5 + 4) % len(NEW)]
    pr = PRACTICE[(r * 3 + 1) % len(PRACTICE)]
    en = ENERGIZERS[(r * 3) % len(ENERGIZERS)]
    co = CONSOLIDATE[(r * 3 + 2) % len(CONSOLIDATE)]
    rf = REFLECT[(r * 7 + 5) % len(REFLECT)]
    sen1, sen2 = SEN[r % len(SEN)], SEN[(r + 3) % len(SEN)]
    val, quote = VALUES[mon if mon in VALUES else month_of(n)]
    s = spec.get('s', [])
    fig_name = f'g{g}_{n:02d}.png'
    fw, fh = figs.draw(spec['f'], os.path.join(IMG, fig_name)) if spec.get('f') else (0, 0)
    figlines = [f'img:{fig_name}:{fw}:{fh}', f'> *Сурет. {spec.get("fc", "")}*'] if spec.get('f') else []
    phl = [f'link:PhET:|{PHET}{spec["ph"]}'] if spec.get('ph') else []
    book = f'Физика {g}-сынып оқулығы'

    hdr_val = [f'«Адал азамат» бағдарламасы бойынша: **{val}**.', f'*{quote}*',
               spec.get('v', 'Құндылық топтық жұмыстағы жауапкершілік пен өзара құрмет арқылы жүзеге асады.')]
    stages = []
    if kind == 'tjb':
        q = spec.get('quarter_topics', '')
        stages.append({'stage': ['**Сабақтың басы**', '**3 минут**'],
                       'teacher': ['**Ұйымдастыру кезеңі.** Сәлемдесу, түгендеу, оқушыларды жеке отырғызу.',
                                   '**Нұсқаулық:** ТЖБ уақыты (40 минут), тапсырмалар саны, балл қою тәртібі, жауапты рәсімдеу талаптары түсіндіріледі. Құндылық: адалдық, өз бетінше жұмыс.'],
                       'student': ['Нұсқаулықты тыңдап, сұрақтарын қояды.'], 'assess': ['–'], 'res': ['ТЖБ спецификациясы', 'Тапсырма нұсқалары (I, II)']})
        stages.append({'stage': ['**Сабақтың ортасы**', '**40 минут**'],
                       'teacher': [f'**Тоқсандық жиынтық бағалауды өткізу.** ТЖБ тапсырмалары ҚР БҒМ/ОАМ «Бағалау шараларының спецификациясы» негізінде, {g}-сынып, тоқсан бөлімдері бойынша беріледі: {q}.',
                                   '- Тапсырмалар 2 нұсқада (I және II нұсқа) беріледі.', '- Тапсырма түрлері: көп таңдаулы, қысқа жауапты, құрылымдық және есептер.',
                                   '- Мұғалім жұмыс барысын бақылайды, уақытты 10 минут және 5 минут қалғанда ескертеді.',
                                   f'**ЕББҚ оқушыларына:** {sen1}; спецификацияға сәйкес бейімделген нұсқа, қосымша уақыт (қажет болса).'] + figlines,
                       'student': ['ТЖБ тапсырмаларын өз бетінше орындайды.', 'Жауаптарын тексеріп, уақытында тапсырады.'],
                       'assess': ['**Балл қою кестесі** (спецификация бойынша).', 'Дескрипторлар мен балл ТЖБ спецификациясына сәйкес.'],
                       'res': ['ТЖБ тапсырма парақтары', 'Балл қою кестесі', 'Сағат/таймер']})
        stages.append({'stage': ['**Сабақтың соңы**', '**2 минут**'],
                       'teacher': ['Жұмыстарды жинау.', f'**Рефлексия: {rf[0]}** – {rf[1]}', 'Нәтижелер мен талдау келесі сабақта (Қайталау) хабарланады.'],
                       'student': ['Жұмысын тапсырады, рефлексия жасайды.'], 'assess': ['Өзін-өзі бағалау'], 'res': ['Стикерлер']})
        sections = [{'title': 'Бағалау, ЕББҚ қолдау және қауіпсіздік', 'cols': ['Бағалау', 'ЕББҚ оқушыларына қолдау', 'Денсаулық және қауіпсіздік'], 'widths': [5200, 5200, 4998],
                     'rows': [[['ТЖБ нәтижесі балл қою кестесі бойынша; нәтижелерді талдау (ТЖБ талдау кестесі) және жеке кері байланыс.'],
                               [f'{sen1}; {sen2}; ПМПК ұсынымына сәйкес бейімделген тапсырмалар.'],
                               ['Отырысты дұрыс ұстау, жұмыс орнының жарықтандырылуы, сыныпты алдын ала желдету.']]]}]
    else:
        # ---- Сабақтың басы
        stages.append({'stage': ['**Сабақтың басы**', '**6 минут**' if kind != 'lab' else '**5 минут**', '*Ұйымдастыру, қызығушылықты ояту, мақсат қою*'],
                       'teacher': ['**Ұйымдастыру кезеңі.** Сәлемдесу, түгендеу, бағалау парағын тарату.'] + op[1](prev_topic) +
                                  [f'**Құндылыққа баулу:** {quote}', f'**Проблемалық жағдаят:** {spec["h"]}',
                                   'Оқушылардың болжамдары тыңдалып, сабақтың тақырыбы мен мақсаты бірге анықталады.'] +
                                  (['**Қауіпсіздік техникасы:** зертханалық жұмыс ережелері қайталанады, оқушылар нұсқаулықпен танысады.'] if kind == 'lab' else []),
                       'student': op[2] + ['Болжам айтып, тақырып пен мақсатты анықтауға қатысады.'],
                       'assess': ['**Қалыптастырушы бағалау:** ауызша кері байланыс, «Бас бармақ» әдісі.'],
                       'res': ['Презентация', 'Бағалау парағы'] + (['Қауіпсіздік нұсқаулығы'] if kind == 'lab' else [])})
        if kind == 'lab':
            stages.append({'stage': ['**Сабақтың ортасы**', '**7 минут**' if not bjb else '**5 минут**', '*Теориялық негіз, гипотеза*'],
                           'teacher': [f'**Теориялық негіз ({nw[0]}).** {nw[1]}'] + [f'- {x}' for x in spec['t']] + figlines +
                                      ['**Гипотеза:** оқушылар тәжірибенің нәтижесін болжап жазады.'],
                           'student': [nw[2], 'Гипотезасын дәптерге жазады.'],
                           'assess': ['**Дескриптор:**', f'- {strip_end(s[0])};', '**2 балл**'],
                           'res': [book, 'Презентация'] + phl})
            stages.append({'stage': ['**Сабақтың ортасы**', '**18 минут**' if not bjb else '**12 минут**', '*Зертханалық жұмысты орындау (топпен)*'],
                           'teacher': ['**Құрал-жабдықтар:** ' + ', '.join(spec['e']) + '.', '**Жұмыс барысы:**'] +
                                      [f'{i}) {x}' for i, x in enumerate(spec['st'], 1)] + [f'**Өлшеу нәтижелерінің кестесі:** {spec["tb"]}',
                                      'Мұғалім топтарды аралап, кеңес береді, қауіпсіздікті қадағалайды.',
                                      f'**ЕББҚ оқушыларына:** {sen1}.'],
                           'student': ['Топпен құралдарды жинайды, өлшеу жүргізеді.', 'Нәтижелерді кестеге енгізіп, есептеу жасайды.', 'Қателікті бағалап, қорытынды жазады.'],
                           'assess': ['**Дескриптор:**', '- құралдарды дұрыс жинайды, қауіпсіздікті сақтайды – 1 балл;', '- өлшеулерді дұрыс жүргізіп, кестеге енгізеді – 1 балл;',
                                      f'- {strip_end(s[1] if len(s) > 1 else s[0])} – 1 балл;', '- қорытынды жасайды – 1 балл.', '**4 балл**'],
                           'res': spec['e'][:4] + ['Жұмыс парағы (кесте)']})
            stages.append({'stage': ['**Сабақтың ортасы**', '**8 минут**' if not bjb else '**5 минут**', '*Деңгейлік талдау тапсырмалары*'],
                           'teacher': ['**Нәтижені талдау: деңгейлік сұрақтар** (оқушы деңгейін таңдайды).', '**А деңгейі (білу, түсіну):**'] + L(spec['a']) +
                                      ['**В деңгейі (қолдану):**'] + L(spec['b']) + ['**С деңгейі (талдау, бағалау):**'] + L(spec['c']),
                           'student': ['Таңдаған деңгейдегі сұрақтарға жазбаша жауап береді.'],
                           'assess': ['**Дескриптор:**', '**А:** сұрақтарға дұрыс жауап береді – 1 балл', '**В:** нәтижеге сүйеніп есептеу/түсіндіру жасайды – 2 балл', f'**С:** {strip_end(s[-1])} – 3 балл'],
                           'res': ['Деңгейлік карточкалар (А – жасыл, В – сары, С – қызыл)']})
        else:
            tnew = '**12 минут**' if not bjb else '**10 минут**'
            title = 'Жаңа білімді меңгеру' if kind == 'new' else 'Білімді жүйелеу'
            stages.append({'stage': ['**Сабақтың ортасы**', tnew, f'*{title}*'],
                           'teacher': [f'**{title}: {nw[0]}.** {nw[1]}'] + [f'- {x}' for x in spec['t']] + figlines,
                           'student': [nw[2]],
                           'assess': ['**Дескриптор:**', f'- {strip_end(s[0])};', '- топта/жұпта белсенді жұмыс істейді.', '**2 балл**' if not bjb else '**3 балл**'],
                           'res': [book, 'Презентация'] + phl})
            if not bjb:
                stages.append({'stage': ['**Сабақтың ортасы**', '**7 минут**', '*Бекіту, жаттығу*'],
                               'teacher': [f'**{pr[0]}.** {pr[1]}'] + L(spec.get('p', ['**Тапсырма:** тақырыптың негізгі формулаларын «Формула – шама – бірлік – мысал» кестесіне жүйелеп, бір үлгі есепті жұппен шығарыңдар.'])),
                               'student': ['Тапсырманы орындап, шешімін талқылайды.'],
                               'assess': ['**Дескриптор:**', '- тапсырманың шешімін қадамдап, дұрыс рәсімдейді.', '**1 балл**'],
                               'res': ['Жұмыс дәптері', 'Тапсырма карточкасы']})
                stages.append({'stage': ['**Сергіту сәті**', '**2 минут**'], 'teacher': [en], 'student': ['Қимыл арқылы орындайды.'], 'assess': ['–'], 'res': ['–']})
            stages.append({'stage': ['**Сабақтың ортасы**', '**11 минут**' if not bjb else '**8 минут**', '*Деңгейлік тапсырмалар (жеке жұмыс)*'],
                           'teacher': ['**Саралау «Таңдау» арқылы:** оқушылар деңгейін өздері таңдайды; А деңгейін орындаған оқушы В деңгейіне өтеді.', '**А деңгейі (білу, түсіну) – жасыл карта.**'] + L(spec['a']) +
                                      ['**В деңгейі (қолдану) – сары карта.**'] + L(spec['b']) + ['**С деңгейі (талдау, жинақтау) – қызыл карта.**'] + L(spec['c']) +
                                      [f'**ЕББҚ оқушыларына:** {sen1}; {sen2}.'],
                           'student': ['Деңгейін таңдап, тапсырманы жеке орындайды.', 'Жауап кілтімен өзін-өзі тексереді.'],
                           'assess': ['**Дескриптор:**', f'**А:** {strip_end(s[1] if len(s) > 1 else s[0])} – **2 балл**', f'**В:** {strip_end(s[2] if len(s) > 2 else s[-1])} – **3 балл**', f'**С:** {strip_end(s[-1])} – **4 балл**'],
                           'res': ['Деңгейлік карточкалар (А – жасыл, В – сары, С – қызыл)', 'Жауап кілті']})
        if bjb:
                stages.append({'stage': ['**Бөлім бойынша жиынтық бағалау**', '**17 минут**' if kind != 'lab' else '**15 минут**'],
                               'teacher': [f'**БЖБ №{bjb.group(1)}** «{clean_bolim(item["bolim"])}» бөлімі бойынша спецификацияға сәйкес өткізіледі.', 'Нұсқаулық беріледі, уақыт қадағаланады, жұмыстар жиналады.'],
                               'student': ['БЖБ тапсырмаларын өз бетінше орындайды.'],
                               'assess': ['Балл қою кестесі (БЖБ спецификациясы бойынша)'],
                               'res': ['БЖБ тапсырма парақтары', 'Балл қою кестесі']})
        # ---- Сабақтың соңы
        qlines = [f'- {x}' for x in spec['q']]
        stages.append({'stage': ['**Сабақтың соңы**', '**7 минут**' if not bjb else ('**5 минут**' if kind != 'lab' else '**3 минут**'), '*Бекіту, рефлексия, үй тапсырмасы*'],
                       'teacher': [f'**Бекіту: {co[0]} онлайн-викторинасы** (мұғалім алдын ала дайындайды). Сұрақ үлгілері:'] + qlines +
                                  [f'link:{co[0]}:|{co[1]}', '*Құрылғы жетіспесе – қағаз нұсқасы.*', f'**Рефлексия: {rf[0]}** – {rf[1]}',
                                   '**Үй тапсырмасы (сараланған):**', f'- **А:** {spec["hw"][0]}', f'- **В:** {spec["hw"][1]}', f'- **С:** {spec["hw"][2]}'],
                       'student': ['Викторинаға жауап береді.', 'Бағалау парағындағы балын қосып, өзін-өзі бағалайды.', 'Рефлексия жасайды, үй тапсырмасының деңгейін таңдайды.'],
                       'assess': ['**Дескриптор:**', '- викторина сұрақтарының кемінде 80%-ына дұрыс жауап береді – **3 балл**',
                                  '**Шкала (10 балл):** 9–10 «Өте жақсы», 7–8 «Жақсы», 5–6 «Қанағаттанарлық», 0–4 «Қолдау қажет»'],
                       'res': [f'{co[0]} (QR-код)', 'Рефлексия материалдары', 'Kundelik.kz – үй тапсырмасы']})
        safety = ('Зертханалық құралдармен жұмыс ережелерін сақтау, шыны/электр құралдарымен абай болу, жұмыстан кейін орынды жинау.' if kind == 'lab'
                  else 'Сергіту сәті, көзге арналған үзіліс, интерактивті тақтамен жұмыс уақытын шектеу, сыныпты желдету.')
        sections = [{'title': 'Саралау, ЕББҚ қолдау, бағалау және қауіпсіздік', 'cols': ['Саралау', 'ЕББҚ оқушыларына қолдау', 'Бағалау', 'Денсаулық және қауіпсіздік'],
                     'widths': [4000, 4400, 3500, 3498],
                     'rows': [[['**Тапсырма арқылы:** А, В, С деңгейлік карталар.', '**Таңдау арқылы:** оқушы деңгейін өзі таңдайды.', f'**Қолдау арқылы:** {nw[0] if kind != "lab" else "топтағы рөлдер"}, жұп-тьютор.', '**Қабілетті оқушыларға:** С деңгейі, PhET/қосымша зерттеу.'],
                               [f'**Оқу қиындығы:** {sen1}.', f'**Көру/есту қабілеті:** {SEN[(r + 5) % len(SEN)]}.', f'**Зейін тапшылығы:** {SEN[6]}.'],
                               ['Бағалау парағы (10 балл), дескрипторлар, өзін-өзі және өзара бағалау, онлайн-викторина, рефлексия.'],
                               [safety]]]}]
        if spec.get('k'):
            sections.append({'title': 'Деңгейлік тапсырмалардың жауап кілті', 'cols': ['Деңгей', 'Дұрыс жауап'], 'widths': [1200, 14198],
                             'rows': [['**А**', spec['k'][0]], ['**В**', spec['k'][1]], ['**С**', spec['k'][2]]]})
    items = []
    if spec.get('ph'): items.append(('PhET', 'симуляция', PHET + spec['ph'], qr(f'qr_phet_{spec["ph"]}.png', PHET + spec['ph'])))
    if kind != 'tjb': items.append((co[0], 'викторина', co[1], qr(co[2], co[1])))
    for nm, u, f in EXTRA_QR: items.append((nm, 'видеосабақ' if nm == 'Bilimland' else 'цифрлық оқулық', u, qr(f, u)))
    sections.append({'title': 'Сандық ресурстар (QR-кодтар)', 'type': 'qr', 'items': items})
    return {
        'no': str(disp), 'zam': ZAM, 'teacher': TEACHER, 'date': datestr, 'grade': g,
        'bolim': clean_bolim(item['bolim']), 'topic': topic,
        'objectives': spec.get('codes') or item['codes'] or (['Тоқсан бойынша оқу мақсаттары (ТЖБ спецификациясы бойынша)'] if kind == 'tjb' else ['Тоқсанда өткен оқу мақсаттарын қайталау және жүйелеу']),
        'smart': [f'- {x}' for x in s] if s else ['- тоқсан бойынша меңгерген білімін ТЖБ тапсырмаларын орындау арқылы көрсетеді.'],
        'extraHeader': [['Құндылықтарға баулу:', hdr_val]], 'stages': stages, 'sections': sections,
    }, disp


def slug(t):
    t = re.sub(r'[«»"\'./\\:№]', '', t); t = re.sub(r'\s+', '_', t.strip())
    return t[:45].rstrip('_')


def main():
    g = sys.argv[1]
    rng = sys.argv[2] if len(sys.argv) > 2 else None
    specs = {}
    for part in sorted(f for f in os.listdir(os.path.join(ROOT, 'gen')) if re.match(rf'g{g}[a-z]?\.py$', f)):
        specs.update(importlib.import_module(part[:-3]).S)
    items = KTZH[g]
    lo, hi = (map(int, rng.split('-')) if rng else (1, len(items)))
    outdir = os.path.join(OUTROOT or os.path.join(ROOT, 'final'), f'{g}-сынып'); os.makedirs(outdir, exist_ok=True)
    jdir = os.path.join(ROOT, 'json_sale' if OUTROOT else 'json'); os.makedirs(jdir, exist_ok=True)
    for i, item in enumerate(items):
        n = item['n']
        if not (lo <= n <= hi) or n not in specs: continue
        prev = clean_topic(items[i - 1]['topic']) if i else 'Физика пәніне кіріспе'
        if kind_of(prev) == 'tjb' and i > 1: prev = clean_topic(items[i - 2]['topic'])
        data, disp = build_lesson(g, item, specs[n], i, prev)
        jp = os.path.join(jdir, f'{g}_{n:02d}.json'); json.dump(data, open(jp, 'w'), ensure_ascii=False)
        d = f'{disp:02d}' if isinstance(disp, int) else (disp.zfill(2) if disp[:1].isdigit() and not disp[1:2].isdigit() else disp)
        out = os.path.join(outdir, f'ҚМЖ_{g}-сынып_{d}_{slug(data["topic"])}.docx')
        subprocess.run(['node', os.path.join(ROOT, 'build.js'), jp, out], check=True, capture_output=True)
        print('ok', n, out.split('/')[-1])


if __name__ == '__main__':
    main()
