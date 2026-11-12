"""Көрнекі (v3) презентация: ҚМЖ деректерінен (tools/kmzh/pres_json) «бір слайд — бір ой» үлгісіндегі слайдтар.

    python3 tools/deck/v3.py 8            # 8-сыныптың барлық сабағы → materials/decks/8-*.json
    python3 tools/deck/v3.py 8 5 7        # тек 8-5 және 8-7

Құрылымы: мұқаба → сұрақ (ой қозғау) → мақсаттар → әр ұғымға бір слайд (тақырыпқа сай анимациялы сурет)
→ формула → интерактивті модель → жылдам сұрақтар → A/B/C тапсырмалары → есте сақта → үй тапсырмасы → рефлексия.
Мұғалімге арналған әдіс сипаттамасы экранға емес, slide.notes ішіне жазылады.
Ескі файлдан сақталатыны: тест (quiz), PhET сілтемесі, зертханалық жұмыс слайдтары, интерактивті модель.
"hand": true бар файлдар (қолмен жазылған) өзгертілмейді.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
PJ = os.path.join(REPO, 'tools', 'kmzh', 'pres_json')
OUT = os.path.join(REPO, 'materials', 'decks')

# ── сурет таңдау: кілт сөз → сахна (ретімен тексеріледі) ──
ART = [
    (r'\bІЖК|\bіштен жану|\bтакт|\bцилиндр', 'piston'), (r'\bтурбина|\bбу машина|\bжылу қозғалтқыш|\bжылу машина', 'engine'),
    (r'\bэлектроқозғалтқыш|\bэлектр қозғалтқыш', 'motor'),
    (r'\bброун', 'brownian'), (r'\bдиффуз', 'diffusion'), (r'\bМКТ|\bмолекулалар.*қозғал|\bжылулық қозғал', 'diffusion'),
    (r'\bтермометр|\bшкала|\bКельвин|\bЦельсий|\bабсолют нөл', 'thermometer'),
    (r'\bбриз|\bмуссон', 'breeze_day'), (r'\bтермос', 'thermos'), (r'\bқос әйнек|\bоқшаула', 'window_double'),
    (r'\bжылуөткізгіштік', 'conduction'), (r'\bконвекция', 'convection_room'), (r'\bсәуле шығару', 'radiation_sun'),
    (r'\bүйкеліс|\bысқыла', 'friction_heat'),
    (r'\bжану жылуы|\bотын', 'fuel'), (r'\bараластыр|\bжылу балансы', 'mix'),
    (r'\bменшікті жылу сыйымдылы|\bжылу мөлшері|Q\s*=\s*cm', 'kettle'),
    (r'\bбалқу|\bбалқи|\bқатаю|\bкристал', 'melting'), (r'\bқайна', 'boiling'), (r'\bбулан|\bконденсац|\bқаныққан', 'evaporation'),
    (r'\bгаздың жұмысы|\bбудың жұмысы|\bбірінші заң|pΔV|\bпоршень', 'piston'),
    (r'\bПӘК|\bпайдалы әрекет', 'efficiency'), (r'\bжылу қозғалтқыш|\bқыздырғыш|\bсалқындатқыш|\bекінші заң|\bқайтымсыз|\bіштен жану|\bтурбина', 'engine'),
    (r'\bэколог|\bпарник|\bластан|CO₂', 'ecology'), (r'\bағза|\bтірі\b|\bорганизм|\bтерле|\bдене температура', 'organism'),
    (r'\bнайзағай|\bжайтартқыш', 'lightning'), (r'\bэлектрлен|\bзарядтал|\bэлектроскоп|\bзаряд', 'balloon'),
    (r'\bконденсатор|\bсыйымдылы', 'capacitor'), (r'\bкернеулі|\bэлектр өрісі|\bпотенциал', 'capacitor'),
    (r'\bОм заңы|\bвольт-ампер|I\s*=\s*U', 'ohm_graph'), (r'\bменшікті кедерг|\bкедергі|\bреостат|\bасқын өткізгіш', 'resistance'),
    (r'\bтізбектей|\bпараллель (жалға|қос)', 'series_parallel'), (r'\bсақтандырғыш|\bқысқа тұйықтал|\bбалқымалы', 'fuse'),
    (r'\bДжоуль|\bжылулық әсер|\bқыздыру шам|\bқуат', 'bulb'), (r'\bэлектролиз|\bхимиялық әсер|\bФарадей', 'electrolysis'),
    (r'\bэлектромагнит\b|\bэлектромагниттер', 'crane'), (r'\bрамка|\bтогы бар өткізгішке', 'motor'), (r'\bэлектромагниттік индукция|\bгенератор', 'motor'),
    (r'\bтүзу өткізгіш|\bбұранда|\bшарғы', 'wire_field'), (r'\bЖер\w*\s+магнит|\bкомпас|\bмагнитосфера|\bгеографиялық', 'earth_magnet'),
    (r'\bполюс', 'two_magnets'), (r'\bмагнит', 'magnet'),
    (r'\bталшық|\bтолық ішкі|\bтолық іштей', 'fiber'), (r'\bсфералық|\bойыс айна|\bдөңес айна', 'sph_mirror'),
    (r'\bкөз\b|\bкөздің|\bкөзілдірік|\bалыстан көрмейтін|\bжақыннан', 'eye'),
    (r'\bлинза', 'lens_conv'), (r'\bсыну|\bсынады', 'refraction'), (r'\bшағылу|\bжазық айна|\bайна\b|\bайнада|\bайнаның|\bайналар\b', 'mirror_flat'),
    (r'\bтелескоп|\bмикроскоп|\bаспап|\bфотоаппарат|\bпроектор', 'telescope'), (r'\bкөлеңке|\bтүзу сызықты таралу|\bтұтылу|\bжарық көзі', 'shadow'),
    (r'\bэлектр тогы|\bток көзі|\bгальвани|\bаккумулятор|\bток күші|\bтізбек|\bкернеу', 'battery'),
    (r'\bжылу беріл', 'trio_conv'),
]
# интерактивті модельге (Illus) апаратын кілт сөздер
MODEL = [(r'\bлинза|\bкескін', 'lens'), (r'\bкөз\b|\bкөздің', 'eye'), (r'\bжазық айна|\bшағылу', 'reflection'), (r'\bсыну', 'refraction'),
         (r'\bКулон', 'charges'), (r'\bкернеулік|\bөріс сызық', 'field_lines'), (r'\bтізбек|\bОм заңы', 'circuit'),
         (r'\bшарғы|\bсоленоид', 'solenoid'), (r'\bиндукция', 'induction'), (r'\bагрегат|\bмолекула', 'particles')]
SECTION_ART = [(r'жылу|температур|энерги|балқ', 'thermometer'), (r'электр|ток|заряд', 'battery'), (r'магнит', 'magnet'), (r'жарық|оптик|линза|айна', 'shadow')]

OPT = {'c': ('жарық жылдамдығы', 'м/с'), 'υ': ('ортадағы жарық жылдамдығы', 'м/с'), 'v': ('ортадағы жарық жылдамдығы', 'м/с'), 'F': ('фокус аралығы', 'м')}

REFL = [  # рефлексия әдісі → [белгіше, мәтін]
    ('жұлдыз', [['star', 'Бүгін жақсы түсіндім…'], ['star', 'Маған ұнағаны…'], ['wish', 'Келесіде үйренгім келеді…']]),
    ('ағаш', [['leaf-g', 'Бәрін түсіндім'], ['leaf-y', 'Сұрағым бар'], ['leaf-r', 'Көмек керек']]),
    ('баспалдақ', [['step-1', 'Әлі түсінбедім'], ['step-2', 'Түсіндім, бірақ қателесемін'], ['step-3', 'Өзім түсіндіре аламын']]),
    ('pmi', [['plus', 'Плюс — пайдалы болғаны'], ['minus', 'Минус — қиын болғаны'], ['idea', 'Қызықты — тағы білгім келетіні']]),
    ('аяқталмаған', [['note', 'Бүгін мен білдім…'], ['note', 'Маған қиын болды…'], ['note', 'Енді мен … аламын']]),
    ('бес саусақ', [['num-1', 'Бас бармақ — не ұнады?'], ['num-2', 'Балан үйрек — не үйрендім?'], ['num-3', 'Ортан терек — не қиын болды?'], ['num-4', 'Шылдыр шүмек — көңіл күйім'], ['num-5', 'Кішкентай бөбек — менің үлесім']]),
    ('нысана', [['target-1', 'Ортасы — бәрін түсіндім'], ['target-2', 'Ортаңғы шеңбер — сұрағым бар'], ['target-3', 'Сыртқы шеңбер — көмек керек']]),
    ('синквейн', [['num-1', '1 зат есім — тақырып'], ['num-2', '2 сын есім'], ['num-3', '3 етістік'], ['num-4', '4 сөзді сөйлем'], ['num-5', '1 сөз — синоним']]),
    ('3 – 2 – 1', [['num-3', '3 жаңа ұғым'], ['num-2', '2 қызықты дерек'], ['num-1', '1 сұрақ']]),
    ('смайлик', [['face-g', 'Бәрі түсінікті'], ['face-y', 'Сұрағым бар'], ['face-r', 'Түсінбедім']]),
    ('бағдаршам', [['light-g', 'Бәрін түсіндім'], ['light-y', 'Сұрағым бар'], ['light-r', 'Көмек керек']]),
    ('шығу парағы', [['note', 'Бүгін не білдім?'], ['idea', 'Не түсініксіз қалды?'], ['wish', 'Мұғалімге сұрағым']]),
]

SYM = {  # формуладағы белгі → (атауы, бірлігі)
    'Q': ('жылу мөлшері', 'Дж'), 'c': ('меншікті жылу сыйымдылығы', 'Дж/(кг·°C)'), 'm': ('масса', 'кг'), 'Δt': ('температура өзгерісі', '°C'),
    'q': ('меншікті жану жылуы', 'Дж/кг'), 'λ': ('меншікті балқу жылуы', 'Дж/кг'), 'L': ('меншікті булану жылуы', 'Дж/кг'), 'r': ('меншікті булану жылуы', 'Дж/кг'),
    'T': ('абсолют температура', 'К'), 't': ('температура', '°C'), 'ΔU': ('ішкі энергия өзгерісі', 'Дж'), 'U': ('кернеу', 'В'), 'A': ('жұмыс', 'Дж'),
    'p': ('қысым', 'Па'), 'ΔV': ('көлем өзгерісі', 'м³'), 'η': ('ПӘК', '%'), 'Q₁': ('алынған жылу', 'Дж'), 'Q₂': ('берілген жылу', 'Дж'),
    'T₁': ('қыздырғыш температурасы', 'К'), 'T₂': ('салқындатқыш температурасы', 'К'),
    'I': ('ток күші', 'А'), 'R': ('кедергі', 'Ом'), 'ρ': ('меншікті кедергі', 'Ом·мм²/м'), 'l': ('ұзындық', 'м'), 'S': ('көлденең қима ауданы', 'мм²'),
    'P': ('қуат', 'Вт'), 'F': ('күш', 'Н'), 'k': ('коэффициент', ''), 'E': ('кернеулік', 'Н/Кл'), 'C': ('электр сыйымдылығы', 'Ф'), 'φ': ('потенциал', 'В'),
    'D': ('оптикалық күш', 'дптр'), 'f': ('кескінге дейінгі қашықтық', 'м'), 'd': ('денеге дейінгі қашықтық', 'м'), 'n': ('сыну көрсеткіші', ''), 'B': ('магнит индукциясы', 'Тл'),
    'φ_': ('', ''), 'α': ('түсу бұрышы', '°'), 'γ': ('сыну бұрышы', '°'), 'β': ('шағылу бұрышы', '°'), 'v': ('жылдамдық', 'м/с'), 'υ': ('жылдамдық', 'м/с'),
}


def clean(t):
    t = re.sub(r'\s+', ' ', (t or '')).strip()
    return t


def strip_md(t):
    return re.sub(r'\*\*(.+?)\*\*', r'\1', t or '')


def short_topic(t):
    t = re.sub(r'\s*(Пр\.\s*№\s*\d+.*|БЖБ\s*№\s*\d+.*|ТЖБ.*)$', '', t).strip(' .')
    return t


def picks(text, table):
    out = []
    for rx, v in table:
        if re.search(rx, text, re.I) and v not in out:
            out.append(v)
    return out


def pick(text, table, default=None):
    for rx, v in table:
        if re.search(rx, text, re.I):
            return v
    return default


def split_item(t):
    """«**Термин** – анықтама» → (термин, анықтама, тізім)"""
    t = clean(t)
    m = re.match(r'^\*\*(.+?)\*\*\s*[–—:-]?\s*(.*)$', t)
    if m and re.search(r'[А-Яа-яӘәҒғҚқҢңӨөҰұҮүІі]{3,}', m.group(1)):
        title, body = m.group(1).strip(' :–—'), m.group(2)
    else:
        m = re.match(r'^([^:–—]{3,48})\s*[:–—]\s+(.+)$', t)
        if m and '=' not in m.group(1) and re.search(r'[А-Яа-яӘәҒғҚқҢңӨөҰұҮүІі]{3,}', m.group(1)):
            title, body = m.group(1).strip(), m.group(2)
        else:
            return None, t, None
    lst = None
    parts = re.split(r'\s*\d\)\s*', body)
    if len(parts) >= 3:
        lst = [p.strip(' ;.') for p in parts if p.strip(' ;.')]
        lst = [p[0].upper() + p[1:] for p in lst]
    body = body[0].upper() + body[1:] if body and re.match(rf'[{KZ}]', body[0]) else body
    return title, body, lst


KZ = 'А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІіЁё'


def formula_of(t):
    """мәтіндегі қысқа формула: «Q = cmΔt», «sin α / sin γ = n» """
    s = strip_md(t)
    for c in re.findall(rf'(?:_[{KZ}]+|[^{KZ};:,()])*[^{KZ};:,()\s]\s*=\s*(?:_[{KZ}]+|[^{KZ};:,])+', s):
        c = re.sub(r'\s*\([^)]*$', '', c).strip(' .–—-')
        c = re.sub(r'\s*[–—-]\s*$', '', c)
        if re.search(r'^(sin|cos|tg)\b', c, re.I) or re.match(r'^[A-Za-zΔληρφυαβγεℰ]', c):
            if 3 <= len(c) <= 34 and c.count('(') == c.count(')'):
                return c
    return None


def parts_of(f, optics=False):
    out, seen = [], set()
    toks = sorted(SYM, key=len, reverse=True)
    s = f.replace(' ', '')
    i = 0
    while i < len(s):
        for k in toks:
            if s.startswith(k, i) and k not in ('φ_',):
                if k not in seen and SYM[k][0]:
                    nm = OPT.get(k) if optics and k in OPT else SYM[k]
                    seen.add(k); out.append([k, nm[0], nm[1]])
                i += len(k); break
        else:
            i += 1
    return out[:4]


def shorten(t, n=90):
    t = strip_md(clean(t)).rstrip('.')
    if len(t) <= n:
        return t
    cut = t[:n].rsplit(' ', 1)[0]
    return cut.rstrip(',;:–') + '…'


def aim(t):
    t = strip_md(clean(t)).rstrip('.;')
    return t[0].upper() + t[1:] if t else t


def keep_from(old):
    """ескі (v2 немесе v3) файлдан сақталатын бөліктер"""
    k = {'link': None, 'lab': [], 'illus': None, 'quiz': old.get('quiz') or []}
    for s in old.get('slides', []):
        if s['t'] == 'link' and not k['link']:
            k['link'] = s
        elif s['t'] in ('equip', 'procedure', 'table', 'chart'):
            k['lab'].append(s)
        elif s['t'] == 'model' and not k['illus']:
            k['illus'] = s['illus']
        elif s.get('illus') and isinstance(s['illus'], dict) and not k['illus']:
            k['illus'] = s['illus']
    return k


def build(v, n):
    path = os.path.join(OUT, f'{v}-{n}.json')
    old = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
    if old.get('hand'):
        return None
    P = json.load(open(os.path.join(PJ, f'{v}_{int(n):02d}.json'), encoding='utf-8'))
    K = keep_from(old)
    topic = clean(P['topic'])
    whole = ' '.join([topic] + P.get('theory', []))
    cover_art = pick(topic, ART) or pick(whole, ART) or pick(P.get('bolim', '') + topic, SECTION_ART, 'thermometer')
    use = {cover_art: 1}
    rev = P.get('kind') == 'rev' or re.search(r'Қайталау', topic)
    lab = P.get('kind') == 'lab'
    S = []
    g = P.get('g') or str(v).split('-')[0]
    S.append({'t': 'cover', 'kicker': f"{g}-сынып · {clean(P.get('bolim') or 'Физика')}", 'title': short_topic(topic), 'art': cover_art,
              'notes': f"Ұйымдастыру. Құндылық: {P.get('value') or '—'}. {P.get('quote') or ''}".strip()})
    if P.get('hook'):
        ha = next((a for a in picks(P['hook'], ART) if a != cover_art), cover_art)
        use[ha] = use.get(ha, 0) + 1
        S.append({'t': 'ask', 'q': clean(P['hook']), 'art': ha,
                  'notes': f"Ой қозғау: оқушылардың болжамын тыңдап, тақтаға жазыңыз. Өткен тақырыпты еске түсіру — {strip_md(P.get('opener') or '')}: {strip_md(P.get('opener_text') or '')}".strip()})
    aims = [aim(x) for x in (P.get('smart') or [])][:3]
    if aims:
        S.append({'t': 'aims', 'title': 'Бүгін үйренеміз', 'items': aims, 'notes': 'Оқу мақсаты: ' + '; '.join(P.get('codes') or [])})
    # ── жаңа ұғымдар: әр тармаққа бір слайд ──
    def art_for(text, cap=2):
        """мәтінге сай, әлі аз қолданылған сурет; бәрі қолданылса — None (cap=0 → тек жаңасы)"""
        cands = picks(text, ART)
        for a in cands:
            if use.get(a, 0) < max(cap, 1) and (cap or not use.get(a)):
                use[a] = use.get(a, 0) + 1
                return a
        return None

    used, sums, flip, loose, seen_t = set(), [], False, [], set()
    kick = 'Қайталау' if rev else ('Зертханалық жұмыс' if lab else 'Жаңа ұғым')
    for i, item in enumerate(P.get('theory') or []):
        title, body, lst = split_item(item)
        art = art_for(item) or art_for(whole) or cover_art
        f = formula_of(item)
        if title is None or title.lower() in seen_t:
            loose.append((item, art, f)); continue
        seen_t.add(title.lower())
        sl = {'t': 'idea', 'kicker': kick, 'title': title[0].upper() + title[1:], 'art': art, 'flip': flip}
        if lst:
            sl['list'] = lst
        else:
            sl['text'] = body
        if f and not lst:
            sl['chips'] = [f]
        if not sums or i == 0:
            sl['notes'] = f"Жаңа білім — {strip_md(P.get('newm') or '')}: {strip_md(P.get('newm_text') or '')}".strip(' —:')
        S.append(sl); flip = not flip
        sums.append({'art': art, 'text': shorten(f"{title} — {strip_md(body if not lst else '; '.join(lst))}", 64)})
        used.add(art)
    if loose:
        # анықтамасыз тармақтар — бір слайдқа тізіммен
        art = next((a for _, a, _ in loose if a not in used), loose[0][1])
        S.append({'t': 'idea', 'kicker': kick, 'title': P.get('fc') and clean(P['fc'])[:60] or 'Негізгі ойлар', 'art': art, 'flip': flip,
                  'list': [strip_md(clean(x)) for x, _, _ in loose][:5]})
        flip = not flip
        for x, a, _ in loose:
            if len(sums) < 3:
                sums.append({'art': a, 'text': shorten(x, 64)})
    # ── формула ──
    fs = [formula_of(x) for x in (P.get('formulas') or [])] or []
    fs = [x for x in fs if x]
    for f in fs[:2]:
        ps = parts_of(f, bool(re.search(r'жарық|оптик|линза|айна', whole, re.I)))
        if len(ps) >= 2:
            S.append({'t': 'bigf', 'tag': 'Формула', 'title': 'Есте сақта', 'f': f, 'parts': ps})
    # ── интерактивті модель ──
    ill = K['illus'] or ({'k': pick(whole, MODEL)} if pick(whole, MODEL) else None)
    if ill:
        S.append({'t': 'model', 'title': 'Өзің тексеріп көр', 'text': 'Параметрді өзгертіп, нәтижені бақыла.', 'illus': ill,
                  'notes': 'Модельді тақтада оқушымен бірге басқарыңыз: «Не өзгереді деп ойлайсың?» деп алдын ала сұраңыз.'})
    if K['link']:
        S.append(K['link'])
    S.extend(K['lab'])
    # ── жылдам сұрақтар (тесттің алғашқы екеуі) ──
    Q = K['quiz']
    for q, opts, ok in Q[:2]:
        if ok in opts:
            S.append({'t': 'poll', 'q': clean(q), 'opts': opts, 'ok': opts.index(ok), 'art': art_for(q, 0),
                      'notes': 'Жылдам тексеріс: оқушылар саусақпен 1–4 көрсетеді немесе «Сынып» режимінде телефоннан жауап береді.'})
    for sl in S:
        if sl.get('art') is None:
            sl.pop('art', None)
    # ── деңгейлік тапсырмалар ──
    keys = P.get('key') or []
    sen = '; '.join(P.get('sen') or [])
    for j, (lv, arr) in enumerate((('A', P.get('a')), ('B', P.get('b')), ('C', P.get('c')))):
        if not arr:
            continue
        q = strip_md(clean(arr[0])).replace('Тапсырма:', '').strip()
        ans = strip_md(clean(keys[j])) if j < len(keys) else '—'
        sl = {'t': 'job', 'level': lv, 'q': q, 'answer': ans}
        ja = art_for(q, 0)
        if ja:
            sl['art'] = ja
        if lv == 'A':
            sl['notes'] = f"Практикалық жұмыс — {strip_md(P.get('prm') or '')}: {strip_md(P.get('prm_text') or '')}. Саралау: А — бәріне, B — көпшілігіне, C — жоғары деңгейге." + (f" ЕББҚ: {sen}." if sen else '')
        if lv == 'B' and P.get('energizer'):
            sl['notes'] = 'Сергіту сәті: ' + strip_md(P['energizer'])
        S.append(sl)
    if len(Q) > 2 and Q[2][2] in Q[2][1]:
        q, opts, ok = Q[2]
        S.append({'t': 'poll', 'q': clean(q), 'opts': opts, 'ok': opts.index(ok)})
    if len(sums) >= 2:
        S.append({'t': 'sum', 'title': 'Есте сақта', 'items': sums[:3]})
    hw = P.get('hw') or []
    if hw:
        S.append({'t': 'home', 'title': 'Үй тапсырмасы', 'items': [['ABC'[i], strip_md(clean(x))] for i, x in enumerate(hw[:3])]})
    refl = re.sub(r'[«»]', '', strip_md(P.get('refl') or 'Екі жұлдыз, бір тілек')).strip()
    items = next((v for k, v in REFL if k in refl.lower()), [['note', 'Бүгін не білдім?'], ['idea', 'Не түсініксіз қалды?'], ['wish', 'Келесіде не үйренгім келеді?']])
    S.append({'t': 'stars', 'title': refl, 'items': items, 'notes': f"Рефлексия: {strip_md(P.get('refl_text') or '')}. Кері байланыс: {P.get('cons') or ''}".strip()})
    qt = P.get('quote') or ''
    m = re.match(r'^«(.+?)»\s*[–—-]\s*(.+?)\.?$', qt)
    S.append({'t': 'bye', 'title': 'Сабаққа рахмет!', 'art': cover_art, **({'quote': {'text': m.group(1), 'by': m.group(2)}} if m else {})})
    d = {'v': str(v), 'n': int(n), 'grade': int(g), 'topic': topic, 'ver': 3, 'slides': S}
    if Q:
        d['quiz'] = Q
    json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False)
    return len(S)


def main(args):
    v = args[0]
    ns = [int(x) for x in args[1:]]
    if not ns:
        ns = sorted(int(re.search(r'_(\d+)\.json$', f).group(1)) for f in os.listdir(PJ) if f.startswith(f'{v}_'))
    done = 0
    for n in ns:
        if not os.path.exists(os.path.join(OUT, f'{v}-{n}.json')):
            continue
        r = build(v, n)
        if r:
            done += 1
    print(f'{v}: {done} презентация жаңартылды')


if __name__ == '__main__':
    main(sys.argv[1:])
