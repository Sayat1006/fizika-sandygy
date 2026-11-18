"""БЖБ/ТЖБ 2-нұсқа: суретті, бірнеше сұрақты (а, ә, б, в) тапсырмалар + тест. Сандар нұсқаға қарай өзгереді, жауаптар кодпен есептеледі.

    python3 tools/sa/build_sa2.py 7          # 7-сынып (тапсырмалар банкі: tools/sa/bank7.py)

Бөліну (қай сабақта, қай сабақтарды қамтиды) — build_sa.plan(). Оқу мақсаттары — сабақтардың ҚМЖ-сынан (кэш: kmzh_codes.json).
Тест — сабақтардың презентациясындағы тест (materials/decks/*.json → quiz).
Сызбалар: figs.py (SVG) → svg2png.js (PNG) → docx."""
import importlib, json, os, random, re, subprocess, sys, tempfile, zipfile
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import build_sa as B  # noqa: E402
from docx import Document  # noqa: E402
from docx.enum.text import WD_ALIGN_PARAGRAPH  # noqa: E402
from docx.shared import Cm, Pt  # noqa: E402

REPO = B.REPO
LBL = 'аәбвгд'
LEVELS = ['Білу және түсіну', 'Қолдану', 'Жоғары деңгей дағдылары']


def kmzh_codes(v, n, man, cache):
    k = f'{v}:{n}'
    if k in cache: return cache[k]
    e = man.get(k, {}); out = []
    if e.get('kmzh'):
        t = re.sub(r'<[^>]+>', ' ', zipfile.ZipFile(os.path.join(REPO, 'materials', e['kmzh']['path'])).read('word/document.xml').decode())
        out = list(OrderedDict.fromkeys(re.sub(r'\s+', ' ', m).strip(' ;:,') for m in re.findall(r'\d{1,2}\.\d\.\d\.\d+\s*[–-]\s*[^.;]{5,160}?(?=\s{3,}|;|\.|$)', t)))
    cache[k] = out; return out


def quiz_of(v, n):
    p = os.path.join(REPO, 'materials', 'decks', f'{v}-{n}.json')
    return [q for q in (json.load(open(p, encoding='utf-8')).get('quiz', []) if os.path.exists(p) else []) if q[2] in q[1]]


def pick_code(task, codes):
    for kw in task.get('kw', []):
        for c in codes:
            if kw.lower() in c.lower(): return c
    return codes[0] if codes else ''


def make_variant(item, bank, var, codes, nq, nt):
    """нұсқа: (тест, тапсырмалар)"""
    v, L = item['v'], item['lessons']
    # тест: сабақтардан кезекпен; 1-нұсқа жұп, 2-нұсқа тақ сұрақтар
    pools = [quiz_of(v, x['n']) for x in L]; mcq, seen = [], set()
    for r_ in range(6):
        for j in range(len(pools)):
            q = pools[(j + var) % len(pools)]; i = (2 * r_ + var) % 4
            if i < len(q) and q[i][0] not in seen:
                seen.add(q[i][0]); mcq.append(q[i])
            if len(mcq) >= nq: break
        if len(mcq) >= nq: break
    # тапсырмалар: бөлімдерден кезекпен; 2-нұсқа басқа тапсырманы алады (бар болса)
    secs = [s for s in OrderedDict.fromkeys(x['bolim'] for x in L) if s in bank]
    gens, used = [], set()
    k = 0
    while len(gens) < nt and k < 40:
        s = secs[k % len(secs)]; lst = bank[s]
        for d in range(len(lst)):
            g = lst[(k // len(secs) + var + d) % len(lst)]
            if g.__name__ not in used:
                used.add(g.__name__); gens.append(g); break
        k += 1
    rnd = random.Random(f"{v}:{item['host']['n']}:{item['type']}:{item['no']}:{var}")
    tasks = []
    for g in gens:
        t = g(rnd); t['code'] = pick_code(t, codes); t['gen'] = g.__name__; tasks.append(t)
    # оңайдан қиынға
    tasks.sort(key=lambda t: LEVELS.index(t['level']))
    return mcq, tasks


def fig_png(svg, tmp, cache):
    if svg in cache: return cache[svg]
    f = os.path.join(tmp, f'f{len(cache):04d}.svg'); open(f, 'w').write(svg); cache[svg] = f[:-4] + '.png'; return cache[svg]


def new_doc():
    doc = Document()
    sec = doc.sections[0]; sec.page_height, sec.page_width = Cm(29.7), Cm(21)
    sec.left_margin = sec.right_margin = Cm(2); sec.top_margin = sec.bottom_margin = Cm(1.6)
    st = doc.styles['Normal']; st.font.name = 'Times New Roman'; st.font.size = Pt(12)
    st.element.rPr.rFonts.set(B.qn('w:eastAsia'), 'Times New Roman')
    return doc


def build(item, grade, doc, V, figs):
    tjb = item['type'] == 'ТЖБ'
    title = f'{item["no"]}-тоқсан бойынша жиынтық бағалау' if tjb else f'«{item["title"]}» бөлімі бойынша жиынтық бағалау №{item["no"]}'
    B.para(doc, f'Физика · {grade}-сынып', 11, color='5A6475', align='c', space=2)
    B.para(doc, title, 15, True, 'c', 8, color='1F3A68')
    mcq0, tasks0 = V[0]
    total = len(mcq0) + sum(p['pts'] for t in tasks0 for p in t['parts'])
    codes = list(OrderedDict.fromkeys(t['code'] for t in tasks0 if t['code']))
    levels = [l for l in LEVELS if any(t['level'] == l for t in tasks0) or (l == LEVELS[0] and mcq0)]
    spec = [['Бөлім' + ('дер' if '/' in item['title'] else ''), item['title']], ['Оқу мақсаттары', '\n'.join(codes) or '—'],
            ['Бағалау критерийі', '\n'.join(OrderedDict.fromkeys(B.criterion(c) for c in codes)) or '—'], ['Ойлау дағдыларының деңгейі', '\n'.join(levels)],
            ['Орындау уақыты', '40 минут' if tjb else '25 минут'], ['Балл саны', str(total)]]
    t = B.table(doc, spec, [4.5, 12.5], head=False)
    for r in t.rows:
        B.shade(r.cells[0], 'F2F5FA'); r.cells[0].paragraphs[0].runs[0].font.bold = True
    for vi, (mcq, tasks) in enumerate(V):
        doc.add_page_break() if vi else B.para(doc, '', space=6)
        B.para(doc, f'{vi + 1}-нұсқа', 14, True, space=6, color='1F3A68')
        B.para(doc, 'Аты-жөні: ____________________________________   Сынып: ______   Күні: ___________', 11, space=8)
        num = 0
        if mcq:
            num += 1
            B.para(doc, f'{num}. Дұрыс жауапты таңдаңыз. [{len(mcq)} балл]', 12, True, space=4)
            for i, (q, opts, ans) in enumerate(mcq, 1):
                B.para(doc, f'{num}.{i}. {q}', 12, space=1)
                ops = [f'{"ABCD"[j]}) {o}' for j, o in enumerate(opts)]
                if sum(len(o) for o in ops) < 64: B.para(doc, '     ' + '      '.join(ops), 12, space=5)
                else:
                    for a_, b_, sp in ((ops[0], ops[1], 0), (ops[2], ops[3], 5)):
                        pp = B.para(doc, '     ' + a_ + '\t' + b_, 12, space=sp); pp.paragraph_format.tab_stops.add_tab_stop(Cm(8.6))
        for tk in tasks:
            num += 1; pts = sum(p['pts'] for p in tk['parts'])
            p = B.para(doc, '', 12, space=3); p.paragraph_format.keep_with_next = True
            B.font(p.add_run(f'{num}. '), 12, bold=True); B.font(p.add_run(tk['stem']), 12); B.font(p.add_run(f' [{pts} балл]'), 11, color='5A6475')
            if tk['fig']:
                fp = doc.add_paragraph(); fp.alignment = WD_ALIGN_PARAGRAPH.CENTER; fp.paragraph_format.keep_with_next = True
                fp.add_run().add_picture(figs[tk['fig']], width=Cm(tk.get('figw', 10)))
            for j, pt in enumerate(tk['parts']):
                q = B.para(doc, '', 12, space=1); B.font(q.add_run(f'{LBL[j]}) '), 12, bold=True); B.font(q.add_run(pt['q']), 12); B.font(q.add_run(f' [{pt["pts"]}]'), 10, color='5A6475')
                for _ in range(pt['pts'] + (1 if pt['pts'] > 1 else 0)): B.rule(doc)
            B.para(doc, '', space=4)
    # дескрипторлар
    doc.add_page_break()
    B.para(doc, 'Балл қою кестесі (дескрипторлар) · 1-нұсқа', 14, True, space=6, color='1F3A68')
    rows = [['Бағалау критерийі', '№', 'Дескриптор\nБілім алушы', 'Балл']]
    num = 0
    if mcq0:
        num += 1
        for i in range(1, len(mcq0) + 1): rows.append(['Тест сұрақтарына жауап береді', f'{num}.{i}', 'дұрыс жауапты таңдайды', '1'])
    for tk in tasks0:
        num += 1
        for j, pt in enumerate(tk['parts']):
            for d in pt['desc'][:pt['pts']] + [''] * (pt['pts'] - len(pt['desc'][:pt['pts']])):
                rows.append([B.criterion(tk['code']) if tk['code'] else '—', f'{num} {LBL[j]})', d or pt['desc'][0], '1'])
    rows.append(['Барлығы', '', '', str(total)])
    t = B.table(doc, rows, [5.2, 1.5, 8.8, 1.5]); B.merge_down(t, 0); B.merge_down(t, 1)
    B.para(doc, '', space=4)
    B.para(doc, 'Баллды бағаға ауыстыру шкаласы', 13, True, space=4, color='1F3A68')
    B.table(doc, B.scale(total), [4, 3])
    B.para(doc, 'Ескерту: шкала ұсыныс ретінде берілген; мектептің бағалау ережесіне сай өзгертуге болады. 2-нұсқаның дескрипторлары 1-нұсқамен бірдей (тапсырмалардың сандары мен мазмұны өзгеше).', 10, italic=True, color='5A6475', space=0)
    B.para(doc, '', space=4)
    for vi, (mcq, tasks) in enumerate(V):
        B.para(doc, f'Жауаптар · {vi + 1}-нұсқа', 13, True, space=4, color='1F3A68')
        rows = [['№', 'Жауап', 'Балл']]; num = 0
        if mcq:
            num += 1; rows.append([str(num), '; '.join(f'{num}.{i} — {"ABCD"[o.index(a)]}' for i, (_, o, a) in enumerate(mcq, 1)), str(len(mcq))])
        for tk in tasks:
            num += 1
            for j, pt in enumerate(tk['parts']): rows.append([f'{num} {LBL[j]})', pt['ans'], str(pt['pts'])])
        rows.append(['', 'Барлығы', str(len(mcq) + sum(p['pts'] for t in tasks for p in t['parts']))])
        B.table(doc, rows, [1.5, 13.8, 1.7]); B.para(doc, '', space=4)
    doc.core_properties.author = 'Сабақтас'; doc.core_properties.title = title
    return title, total


def main(args):
    only = [a for a in args if not a.startswith('--')]
    L = json.load(open(os.path.join(REPO, 'public/lessons.json'), encoding='utf-8'))
    man = json.load(open(os.path.join(REPO, 'materials/manifest.json'), encoding='utf-8'))
    cpath = os.path.join(HERE, 'kmzh_codes.json'); cache = json.load(open(cpath)) if os.path.exists(cpath) else {}
    tmp = tempfile.mkdtemp(prefix='sa2-'); figs = {}; jobs = []
    for v in only:
        bank = importlib.import_module('bank' + v.split('-')[0]).BANK
        grade = int(v.split('-')[0]); hosts = OrderedDict()
        for it in B.plan(v, [x for x in L if x['v'] == v]):
            it['v'] = v
            codes = list(OrderedDict.fromkeys(c for x in it['lessons'] for c in kmzh_codes(v, x['n'], man, cache)))
            tjb = it['type'] == 'ТЖБ'
            V = [make_variant(it, bank, var, codes, 6 if tjb else 4, 4 if tjb else 3) for var in (0, 1)]
            for _, tasks in V:
                for tk in tasks:
                    if tk['fig']: tk['fig'] = fig_png(tk['fig'], tmp, figs)
            hosts.setdefault(it['host']['n'], []).append((it, V))
        for n_, items in hosts.items(): jobs.append((v, n_, grade, items))
    json.dump(cache, open(cpath, 'w'), ensure_ascii=False, indent=0)
    subprocess.run(['node', os.path.join(HERE, 'svg2png.js'), tmp], check=True)
    figmap = {p: p for p in figs.values()}
    done = []
    for v, n_, grade, items in jobs:
        e = man[f'{v}:{n_}']; path = e['sa']['path']; out = os.path.join(REPO, 'materials', path)
        doc = new_doc()
        for k, (it, V) in enumerate(items):
            if k: doc.add_page_break()
            build(it, grade, doc, V, figmap)
        doc.save(out)
        done.append((v, n_, path, out)); print(v, n_, path, flush=True)
    pj = os.path.join(REPO, 'materials/previews.json'); prev = json.load(open(pj, encoding='utf-8'))
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(4) as ex: res = list(ex.map(lambda d: B.previews(d[2], d[3]), done))
    for (v, n_, path, out), pv in zip(done, res): prev[f'{v}:{n_}:sa'] = pv
    json.dump(prev, open(pj, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('дайын:', len(done), 'файл')


if __name__ == '__main__':
    main(sys.argv[1:])
