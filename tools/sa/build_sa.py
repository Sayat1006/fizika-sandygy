"""Жиынтық бағалау жинақтары: БЖБ (бөлім бойынша) және ТЖБ (тоқсандық) — 2 нұсқа, спецификация, дескрипторлар,
балл қою кестесі (жауаптар) және баллды бағаға ауыстыру шкаласы. Word (.docx) — мұғалім өңдей алады.

    python3 tools/sa/build_sa.py            # барлық нұсқа
    python3 tools/sa/build_sa.py 8 10-kgb-2 # тек осы нұсқалар
    python3 tools/sa/build_sa.py --plan 8   # тек бөлінуін көрсету

Бөліну (public/lessons.json бойынша):
  - БЖБ: тақырыбында «БЖБ» бар сабақ — алдыңғы БЖБ-дан кейінгі сабақтарды қамтиды; белгі жоқ нұсқада — әр бөлім (bolim) бір БЖБ,
    соңғы сабағында өтеді.
  - ТЖБ: әр тоқсан (күні бойынша; «Тоқсандық жиынтық бағалау» сабағы болса — сол сабақта), тоқсанның барлық сабағын қамтиды.
Тапсырмалар — сол сабақтардың өз материалынан: тест (materials/decks/*.json, quiz) және A/B/C тапсырмалары жауабымен
(tools/kmzh/pres_json). 1- және 2-нұсқа әртүрлі сабақтардан / әртүрлі сұрақтардан құралады.
Нәтиже: materials/{папка}/sa_NNN.docx (сабақ NNN — бағалау өтетін сабақ), manifest.json (sa), lessons.json (sa: true),
previews.json + public/pv (Қарау).
"""
import glob, hashlib, json, os, re, subprocess, sys, tempfile
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
PJ = os.path.join(REPO, 'tools', 'kmzh', 'pres_json')
SRC = {'10-zhmb-2': '10', '11-zhmb-3': '11'}
SECRET = 'sabaqtas-pv-7f3a91'
TJB = re.compile(r'тоқсандық жиынтық|\bТЖБ', re.I)
BJB = re.compile(r'\bБЖБ', re.I)
REV = re.compile(r'^\s*(тоқсандық )?қайталау|жылдық қорытынды|^қорытынды сабақ', re.I)
LEVEL = {'mcq': 'Білу және түсіну', 'A': 'Білу және түсіну', 'B': 'Қолдану', 'C': 'Жоғары деңгей дағдылары'}
PTS = {'A': 2, 'B': 3, 'C': 4}
KZ = 'А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі'


# ───────── деректер ─────────
def quarter(date):
    m = int(date[5:7]) if date else 9
    return 1 if m in (9, 10) else 2 if m in (11, 12) else 3 if m in (1, 2, 3) else 4


def lesson_data(v, n):
    """сабақтың тапсырмалары: тест, A/B/C + жауап, оқу мақсаты"""
    p = os.path.join(PJ, f'{SRC.get(v, v)}_{int(n):02d}.json')
    d = os.path.join(REPO, 'materials', 'decks', f'{v}-{n}.json')
    if not os.path.exists(p):
        return None
    P = json.load(open(p, encoding='utf-8'))
    quiz = json.load(open(d, encoding='utf-8')).get('quiz', []) if os.path.exists(d) else []
    key = P.get('key') or []
    clean = lambda t: re.sub(r'\*\*(.+?)\*\*', r'\1', re.sub(r'\s+', ' ', t or '')).replace('Тапсырма:', '').strip()
    jobs = {lv: (clean((P.get(lv.lower()) or [''])[0]), clean(key[i]) if i < len(key) else '') for i, lv in enumerate('ABC')}
    return {'n': n, 'topic': clean(P['topic']), 'codes': [clean(c) for c in P.get('codes') or []], 'quiz': [q for q in quiz if q[2] in q[1]], 'jobs': jobs,
            'kind': P.get('kind')}


def plan(v, L):
    """[{type, no, host, lessons[], title}] — БЖБ мен ТЖБ"""
    L = sorted(L, key=lambda x: x['n'])
    content = [x for x in L if not TJB.search(x['topic']) and not REV.search(x['topic'])]
    out = []
    marks = [x for x in content if BJB.search(x['topic'])]
    if marks:
        prev = 0
        for i, m in enumerate(marks, 1):
            grp = [x for x in content if prev < x['n'] <= m['n']]
            out.append({'type': 'БЖБ', 'no': i, 'host': m, 'lessons': grp, 'title': ' / '.join(OrderedDict.fromkeys(x['bolim'] for x in grp))})
            prev = m['n']
    else:
        # белгі жоқ: бөлім бойынша топтап, 5 сабақтан аз топты сол тоқсандағы көршісіне қосамыз
        groups = []
        for x in content:
            if groups and groups[-1][-1]['bolim'] == x['bolim']:
                groups[-1].append(x)
            else:
                groups.append([x])
        merged = []
        for g_ in groups:
            if merged and (len(merged[-1]) < 5 or len(g_) < 3) and quarter(merged[-1][-1]['date']) == quarter(g_[0]['date']):
                merged[-1] += g_
            else:
                merged.append(g_)
        if len(merged) > 1 and len(merged[-1]) < 3:
            merged[-2] += merged.pop()
        for i, g_ in enumerate(merged, 1):
            out.append({'type': 'БЖБ', 'no': i, 'host': g_[-1], 'lessons': g_, 'title': ' / '.join(OrderedDict.fromkeys(x['bolim'] for x in g_))})
    for q in (1, 2, 3, 4):
        ql = [x for x in L if quarter(x['date']) == q]
        if not ql:
            continue
        host = next((x for x in ql if TJB.search(x['topic'])), ql[-1])
        grp = [x for x in content if quarter(x['date']) == q]
        if grp:
            out.append({'type': 'ТЖБ', 'no': q, 'host': host, 'lessons': grp, 'title': ' / '.join(OrderedDict.fromkeys(x['bolim'] for x in grp))})
    return out


def criterion(code):
    """«8.3.2.3 – мысалдар келтіру» → «Мысалдар келтіреді»"""
    t = re.sub(r'^[\d.\s]+[–—-]\s*', '', code).strip(' ;.')
    words = t.split(' ')
    w = words[-1]
    m = re.match(rf'^([{KZ}]+?)(у)$', w)
    if m and len(w) >= 4 and w not in ('жылу', 'ағу', 'тану'):
        stem = w[:-1]
        if stem.endswith(('а', 'е')):
            words[-1] = stem + 'йды' if stem.endswith('а') else stem + 'йді'
        else:
            last = re.findall(r'[аоұыәеөүі]', stem)
            words[-1] = stem + ('ады' if last and last[-1] in 'аоұы' else 'еді')
    t = ' '.join(words)
    return t[:1].upper() + t[1:]


def descriptors(lv, answer):
    num = bool(re.search(r'\d', answer)) and ('=' in answer or re.search(r'\d\s*[a-zA-Zа-яА-Я°%]', answer))
    if num:
        return {'A': ['формуланы дұрыс жазады', 'есептеп, жауабын өлшем бірлігімен жазады'],
                'B': ['қажетті формуланы таңдап жазады', 'мәндерді қойып, есептейді', 'жауабын өлшем бірлігімен дұрыс жазады'],
                'C': ['есептің физикалық моделін құрады', 'қажетті заңдарды қолданып, теңдеу құрады', 'есептеулерді дұрыс орындайды', 'нәтижені талдап, қорытынды жасайды']}[lv]
    return {'A': ['негізгі ұғымды / құбылысты дұрыс атайды', 'қысқаша түсіндіреді немесе мысал келтіреді'],
            'B': ['құбылысты дұрыс сипаттайды', 'оны физикалық заңдылықпен байланыстырады', 'өмірден мысал келтіреді'],
            'C': ['мәселені талдайды', 'физикалық негіздемесін түсіндіреді', 'дәлелді шешім / ұсыныс береді', 'қорытынды жасайды']}[lv]


DEP = re.compile(r'^(осы|сол|жоғарыдағы|алдыңғы|бұл)\b', re.I)  # басқа тапсырманың шартына сілтейтін тапсырма — өздігінен түсініксіз


def assemble(item, var, avoid=frozenset()):
    """нұсқаның тапсырмалары: [(түрі, мәтін, опциялар, жауап, балл, сабақ)]; avoid — 1-нұсқадағы ашық тапсырмалардың мәтіні (қайталанбасын)"""
    LS = [x for x in item['data'] if x]
    if not LS:
        return []
    k = len(LS)
    tjb = item['type'] == 'ТЖБ'
    nq = 8 if tjb else 4
    mcq, used, seenq = [], set(), set()
    for r in range(4):  # әр сабақтан кезекпен; 1-нұсқа — жұп индекстер, 2-нұсқа — тақ
        for j in range(k):
            L = LS[(j + var) % k]
            qi = (2 * r + var) % 4
            if qi < len(L['quiz']) and (L['n'], qi) not in used and L['quiz'][qi][0] not in seenq:
                used.add((L['n'], qi)); seenq.add(L['quiz'][qi][0]); mcq.append((L, L['quiz'][qi]))
            if len(mcq) >= nq:
                break
        if len(mcq) >= nq:
            break
    tasks = [('mcq', q[0], q[1], q[2], 1, L) for L, q in mcq]
    plan_ = (['A', 'A', 'B', 'B', 'C'] if tjb else ['A', 'B', 'C'])
    taken = set(avoid)
    for i, lv in enumerate(plan_):
        base = round(i * (k - 1) / max(1, len(plan_) - 1)) + var  # бөлім бойы біркелкі
        for step in range(k):
            L = LS[(base + step) % k]
            q, a = L['jobs'][lv]
            if q and not DEP.search(q) and q not in taken:
                taken.add(q); tasks.append((lv, q, None, a, PTS[lv], L))
                break
    return tasks


# ───────── docx ─────────
def font(run, size=None, bold=None, italic=None, color=None):
    run.font.name = 'Times New Roman'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    if size: run.font.size = Pt(size)
    if bold is not None: run.font.bold = bold
    if italic is not None: run.font.italic = italic
    if color: run.font.color.rgb = RGBColor.from_string(color)
    return run


def para(doc, text='', size=12, bold=False, align=None, space=4, italic=False, color=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space); p.paragraph_format.space_before = Pt(0)
    if align == 'c': p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for k, part in enumerate(re.split(r'(_[^\s_]+)', text)):
        if not part:
            continue
        if part.startswith('_') and k % 2:
            r = font(p.add_run(part[1:]), size, bold, italic, color); r.font.subscript = True
        else:
            font(p.add_run(part), size, bold, italic, color)
    return p


def rule(doc):
    """жауап жазатын жол: астыңғы шекарасы бар бос абзац"""
    p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(0); p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = Pt(22)
    pPr = p._p.get_or_add_pPr(); bdr = OxmlElement('w:pBdr')
    for side in ('bottom', 'between'):  # «between» — қатар тұрған жолдардың әрқайсысы сызылады
        b = OxmlElement('w:' + side)
        for k, v_ in (('val', 'single'), ('sz', '4'), ('space', '1'), ('color', 'B8C0CC')):
            b.set(qn('w:' + k), v_)
        bdr.append(b)
    pPr.append(bdr)


def shade(cell, hexcol):
    tcPr = cell._element.get_or_add_tcPr()
    sh = OxmlElement('w:shd'); sh.set(qn('w:val'), 'clear'); sh.set(qn('w:color'), 'auto'); sh.set(qn('w:fill'), hexcol); tcPr.append(sh)


def table(doc, rows, widths, head=True, size=11):
    t = doc.add_table(rows=len(rows), cols=len(widths))
    t.style = 'Table Grid'; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, r in enumerate(rows):
        for j, val in enumerate(r):
            c = t.cell(i, j); c.width = Cm(widths[j])
            c.paragraphs[0].text = ''
            lines_ = str(val).split('\n')
            for li, ln in enumerate(lines_):
                p = c.paragraphs[0] if li == 0 else c.add_paragraph()
                p.paragraph_format.space_after = Pt(0)
                font(p.add_run(ln), size, bold=(head and i == 0))
            if head and i == 0:
                shade(c, 'E8EEF7')
    t.autofit = False
    grid = t._tbl.tblGrid
    for j, gc in enumerate(grid.findall(qn('w:gridCol'))):
        gc.set(qn('w:w'), str(int(widths[j] * 567)))
    tblPr = t._tbl.tblPr
    lay = OxmlElement('w:tblLayout'); lay.set(qn('w:type'), 'fixed'); tblPr.append(lay)
    return t


def merge_down(t, col, start=1):
    """бағандағы қатар тұрған бірдей мәндерді біріктіру"""
    rows = t.rows
    i = start
    while i < len(rows):
        j = i
        while j + 1 < len(rows) and rows[j + 1].cells[col].text == rows[i].cells[col].text and rows[i].cells[col].text:
            j += 1
        if j > i:
            txt = rows[i].cells[col].text
            m = rows[i].cells[col].merge(rows[j].cells[col])
            for p in m.paragraphs[1:]:
                p._element.getparent().remove(p._element)
            m.paragraphs[0].text = ''
            font(m.paragraphs[0].add_run(txt), 11)
        i = j + 1


def scale(total):
    """баллды бағаға ауыстыру (0–39% «2», 40–64% «3», 65–84% «4», 85–100% «5»)"""
    import math
    cut = lambda p: math.ceil(total * p / 100)
    b3, b4, b5 = cut(40), cut(65), cut(85)
    return [['Балл', 'Баға'], [f'{b5}–{total}', '«5»'], [f'{b4}–{b5 - 1}', '«4»'], [f'{b3}–{b4 - 1}', '«3»'], [f'0–{b3 - 1}', '«2»']]


def build_docx(item, grade, out):
    doc = Document()
    sec = doc.sections[0]
    sec.page_height, sec.page_width = Cm(29.7), Cm(21)
    sec.left_margin = sec.right_margin = Cm(2); sec.top_margin = sec.bottom_margin = Cm(1.6)
    st = doc.styles['Normal']; st.font.name = 'Times New Roman'; st.font.size = Pt(12)
    st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
    tjb = item['type'] == 'ТЖБ'
    title = f'{item["no"]}-тоқсан бойынша жиынтық бағалау' if tjb else f'«{item["title"]}» бөлімі бойынша жиынтық бағалау №{item["no"]}'
    para(doc, 'Физика · ' + f'{grade}-сынып', 11, color='5A6475', align='c', space=2)
    para(doc, title, 15, True, 'c', 8, color='1F3A68')
    v1 = assemble(item, 0)
    V = [v1, assemble(item, 1, frozenset(t[1] for t in v1 if t[0] != 'mcq'))]
    codes = list(OrderedDict.fromkeys(c for L in item['data'] if L for c in L['codes']))
    total = sum(t[4] for t in V[0])
    levels = list(OrderedDict.fromkeys(LEVEL[t[0]] for t in V[0]))
    spec = [['', ''], ['Бөлім' + ('дер' if '/' in item['title'] else ''), item['title']],
            ['Оқу мақсаттары', '\n'.join(codes[:6]) or '—'],
            ['Бағалау критерийі', '\n'.join(OrderedDict.fromkeys(criterion(c) for c in codes[:6])) or '—'],
            ['Ойлау дағдыларының деңгейі', '\n'.join(levels)],
            ['Орындау уақыты', '40 минут' if tjb else '20 минут'], ['Балл саны', str(total)]]
    t = table(doc, spec[1:], [4.5, 12.5], head=False)
    for r in t.rows:
        shade(r.cells[0], 'F2F5FA'); r.cells[0].paragraphs[0].runs[0].font.bold = True
    for vi, tasks in enumerate(V):
        doc.add_page_break() if vi else para(doc, '', space=6)
        para(doc, f'{vi + 1}-нұсқа', 14, True, space=6, color='1F3A68')
        para(doc, 'Аты-жөні: ____________________________________   Сынып: ______   Күні: ___________', 11, space=8)
        num = 0
        mcq = [x for x in tasks if x[0] == 'mcq']
        if mcq:
            num += 1
            para(doc, f'{num}. Дұрыс жауапты таңдаңыз. [{len(mcq)} балл]', 12, True, space=4)
            for i, (_, q, opts, ans, pts, L) in enumerate(mcq, 1):
                para(doc, f'{num}.{i}. {q}', 12, space=1)
                ops = [f'{"ABCD"[j]}) {o}' for j, o in enumerate(opts)]
                if sum(len(o) for o in ops) < 64:
                    para(doc, '     ' + '      '.join(ops), 12, space=5)
                else:
                    w = max(len(o) for o in ops)
                    if w < 38:
                        for a_, b_, sp in ((ops[0], ops[1], 0), (ops[2], ops[3], 5)):
                            pp = para(doc, '     ' + a_ + '\t' + b_, 12, space=sp)
                            pp.paragraph_format.tab_stops.add_tab_stop(Cm(8.6))
                    else:
                        for k_, o in enumerate(ops):
                            para(doc, '     ' + o, 12, space=5 if k_ == 3 else 0)
        for lv, q, _, ans, pts, L in [x for x in tasks if x[0] != 'mcq']:
            num += 1
            para(doc, f'{num}. {q} [{pts} балл]', 12, space=2)
            for _ in range({'A': 2, 'B': 4, 'C': 5}[lv]):
                rule(doc)
    # дескрипторлар (екі нұсқаға ортақ құрылым)
    doc.add_page_break()
    para(doc, 'Балл қою кестесі (дескрипторлар)', 14, True, space=6, color='1F3A68')
    rows = [['Бағалау критерийі', '№', 'Дескриптор\nБілім алушы', 'Балл']]
    num, base = 0, V[0]
    mcq = [x for x in base if x[0] == 'mcq']
    if mcq:
        num += 1
        for i, x in enumerate(mcq, 1):
            rows.append([criterion(x[5]['codes'][0]) if x[5]['codes'] else '—', f'{num}.{i}', 'дұрыс жауапты таңдайды', '1'])
    for lv, q, _, ans, pts, L in [x for x in base if x[0] != 'mcq']:
        num += 1
        ds = descriptors(lv, ans)
        for d in ds:
            rows.append([criterion(L['codes'][0]) if L['codes'] else '—', str(num), d, '1'])
    rows.append(['Барлығы', '', '', str(total)])
    t = table(doc, rows, [5.2, 1.3, 9, 1.5])
    merge_down(t, 0); merge_down(t, 1)
    para(doc, '', space=4)
    para(doc, 'Баллды бағаға ауыстыру шкаласы', 13, True, space=4, color='1F3A68')
    table(doc, scale(total), [4, 3])
    para(doc, 'Ескерту: шкала ұсыныс ретінде берілген; мектептің бағалау ережесіне сай өзгертуге болады.', 10, italic=True, color='5A6475', space=0)
    para(doc, '', space=4)
    for vi, tasks in enumerate(V):
        para(doc, f'Жауаптар · {vi + 1}-нұсқа', 13, True, space=4, color='1F3A68')
        rows = [['№', 'Жауап', 'Балл']]
        num = 0
        mcq = [x for x in tasks if x[0] == 'mcq']
        if mcq:
            num += 1
            rows.append([str(num), '; '.join(f'{num}.{i} — {"ABCD"[x[2].index(x[3])]}' for i, x in enumerate(mcq, 1)), str(len(mcq))])
        for lv, q, _, ans, pts, L in [x for x in tasks if x[0] != 'mcq']:
            num += 1
            rows.append([str(num), ans or '—', str(pts)])
        rows.append(['', 'Барлығы', str(sum(x[4] for x in tasks))])
        table(doc, rows, [1.3, 14, 1.7])
        para(doc, '', space=4)
    doc.core_properties.author = 'Сабақтас'
    doc.core_properties.title = title
    doc.save(out)
    return title, total


def previews(path, docx_path):
    h = hashlib.sha256((SECRET + path).encode()).hexdigest()[:20]
    d = os.path.join(REPO, 'public/pv', h)
    os.makedirs(d, exist_ok=True)
    for f in glob.glob(os.path.join(d, '*.webp')):
        os.remove(f)
    files = []
    with tempfile.TemporaryDirectory() as t:
        subprocess.run(['soffice', f'-env:UserInstallation=file://{tempfile.gettempdir()}/lo-sa-{threading_id()}', '--headless', '--convert-to', 'pdf', '--outdir', t, docx_path],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        pdf = os.path.join(t, os.path.basename(docx_path)[:-5] + '.pdf')
        subprocess.run(['pdftoppm', '-scale-to-x', '910', '-scale-to-y', '-1', '-png', pdf, os.path.join(t, 'p')], check=True, stderr=subprocess.DEVNULL)
        for i, p in enumerate(sorted(glob.glob(os.path.join(t, 'p*.png'))), 1):
            im = Image.open(p).convert('RGB')
            fn = f"{i}-{hashlib.sha256((SECRET + path + str(i)).encode()).hexdigest()[:10]}.webp"
            im.save(os.path.join(d, fn), 'WEBP', quality=80, method=4)
            files.append(fn)
    return {'dir': h, 'files': files, 'w': im.width, 'h': im.height}


def threading_id():
    import threading
    return threading.get_ident()


def main(args):
    only = [a for a in args if not a.startswith('--')]
    L = json.load(open(os.path.join(REPO, 'public/lessons.json'), encoding='utf-8'))
    man = json.load(open(os.path.join(REPO, 'materials/manifest.json'), encoding='utf-8'))
    variants = list(OrderedDict.fromkeys(x['v'] for x in L))
    jobs = []
    for v in variants:
        if only and v not in only:
            continue
        P = plan(v, [x for x in L if x['v'] == v])
        if '--plan' in args:
            for it in P:
                print(v, it['type'], it['no'], '→', it['host']['n'], len(it['lessons']), 'сабақ |', it['title'][:60])
            continue
        hosts = {}
        for it in P:
            it['data'] = [lesson_data(v, x['n']) for x in it['lessons']]
            hosts.setdefault(it['host']['n'], []).append(it)
        for n, items in hosts.items():
            jobs.append((v, n, items))
    if '--plan' in args:
        return
    tmp = tempfile.mkdtemp(prefix='sa-')
    done = []
    for v, n, items in jobs:
        e = man[f'{v}:{n}']
        grade = int(v.split('-')[0])
        folder = os.path.dirname(e['kmzh']['path']) if e.get('kmzh') else str(grade)
        path = f'{folder}/sa_{int(n):03d}.docx'
        out = os.path.join(REPO, 'materials', path)
        if len(items) == 1:
            title, total = build_docx(items[0], grade, out)
        else:  # бір сабақта БЖБ де, ТЖБ де — екі құжатты бір файлға
            parts = []
            for k, it in enumerate(items):
                p = os.path.join(tmp, f'{v}-{n}-{k}.docx'); parts.append(p); build_docx(it, grade, p)
            merge_docs(parts, out)
            title = ' + '.join('ТЖБ' if it['type'] == 'ТЖБ' else f'БЖБ №{it["no"]}' for it in items)
        slug = re.sub(r'[^\w]+', '_', ' '.join(('ТЖБ_' + str(it['no']) + '-тоқсан') if it['type'] == 'ТЖБ' else f'БЖБ_{it["no"]}_{it["title"]}' for it in items)).strip('_')[:70]
        e['sa'] = {'path': path, 'name': f'{slug}_{grade}-сынып.docx'}
        done.append((v, n, path, out))
    pj = os.path.join(REPO, 'materials/previews.json')
    prev = json.load(open(pj, encoding='utf-8'))
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda d: previews(d[2], d[3]), done))
    for (v, n, path, out), pv in zip(done, res):
        prev[f'{v}:{n}:sa'] = pv
    json.dump(prev, open(pj, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(man, open(os.path.join(REPO, 'materials/manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    hosts = {(v, n) for v, n, *_ in done}
    for x in L:
        if (x['v'], x['n']) in hosts:
            x['sa'] = True
        elif only and x['v'] in only:
            x.pop('sa', None)
    json.dump(L, open(os.path.join(REPO, 'public/lessons.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('жиынтық бағалау:', len(done), 'файл')


def merge_docs(parts, out):
    base = Document(parts[0])
    for p in parts[1:]:
        base.add_page_break()
        for el in Document(p).element.body:
            if el.tag.endswith('sectPr'):
                continue
            base.element.body.append(el)
    base.save(out)


if __name__ == '__main__':
    main(sys.argv[1:])
