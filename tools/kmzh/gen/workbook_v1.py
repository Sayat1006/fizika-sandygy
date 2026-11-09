# -*- coding: utf-8 -*-
"""Build student worksheet booklets (HTML -> PDF). usage: python3 workbook.py 7 8 9"""
import json, os, re, sys, glob, random, html
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'img')
OUT = os.path.join(ROOT, 'workbook'); os.makedirs(OUT, exist_ok=True)
ICON = json.load(open(os.path.join(ROOT, 'gen', 'icons.json')))
plt.rcParams['font.family'] = 'DejaVu Serif'

GC = {'7': ('#0E7C86', '#E3F4F5'), '8': ('#3949AB', '#E8EAF8'), '9': ('#C2410C', '#FCEDE4')}
LV = {'Білу': '#2E7D32', 'Түсіну': '#1565C0', 'Қолдану': '#B7791F', 'Талдау': '#6A1B9A', 'Жинақтау': '#C0392B', 'Бағалау': '#C0392B'}


def esc(t): return html.escape(t)


def md(t):  # **bold** -> <b>
    return re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', esc(t))


def plain(t): return t.replace('**', '')


def lines(n, cls=''): return f'<div class="lines {cls}" style="height:{n * 8.2}mm"></div>'


def ic(name): return f'<span class="ic">{ICON[name]}</span>'


def task(num, level, title, body, icon='FaPencilAlt'):
    col = LV[level]
    return (f'<section class="task" style="--lv:{col}"><div class="th"><span class="num">{num}</span>'
            f'<span class="tt">{ic(icon)} {title}</span><span class="lv">{level}</span></div><div class="tb">{body}</div></section>')


def strip_ans(q):
    m = re.match(r'^(.*)\(([^()]*)\)\s*$', q)
    return (m.group(1).strip(), m.group(2).strip()) if m else (q, '')


def chart_png(d):
    ch = d['chart']; name = f'wb_chart_{d["g"]}_{d["n"]:02d}.png'; p = os.path.join(IMG, name)
    fig, ax = plt.subplots(figsize=(6.4, 3.4))
    cols = ['#0E7C86', '#C0392B', '#2E7D32', '#E07A1F', '#5B4B8A']
    if ch['type'] == 'bar':
        b = ax.bar(ch['labels'], ch['series'][0]['values'], color=cols[0]); ax.bar_label(b, fontsize=9)
    else:
        try: xs = [float(x) for x in ch['labels']]
        except ValueError: xs = list(range(len(ch['labels'])))
        for i, s in enumerate(ch['series']):
            ax.plot(xs, s['values'], lw=2.4, color=cols[i % 5], label=s['name'], marker='o' if len(xs) <= 12 else None)
        if len(ch['series']) > 1: ax.legend(fontsize=9)
    ax.set_xlabel(ch.get('xl', '')); ax.set_ylabel(ch.get('yl', '')); ax.grid(alpha=0.35); ax.set_title(ch['title'], fontsize=11, weight='bold')
    plt.tight_layout(); fig.savefig(p, dpi=150); plt.close(fig)
    return name


def cluster_svg(center, color):
    c = esc(center if len(center) < 40 else center[:38] + '…')
    out = [f'<svg viewBox="0 0 600 300" class="cluster" xmlns="http://www.w3.org/2000/svg">']
    import math
    for k in range(6):
        a = math.pi / 2 + k * math.pi / 3; x, y = 300 + 225 * math.cos(a), 150 + 108 * math.sin(a)
        out.append(f'<line x1="300" y1="150" x2="{x:.0f}" y2="{y:.0f}" stroke="{color}" stroke-width="2" stroke-dasharray="6 4"/>')
        out.append(f'<rect x="{x - 70:.0f}" y="{y - 24:.0f}" width="140" height="48" rx="14" fill="#fff" stroke="{color}" stroke-width="2"/>')
    out.append(f'<ellipse cx="300" cy="150" rx="120" ry="44" fill="{color}"/>')
    out.append(f'<foreignObject x="185" y="112" width="230" height="76"><div xmlns="http://www.w3.org/1999/xhtml" class="cl-c">{c}</div></foreignObject></svg>')
    return ''.join(out)


def faces():
    def face(mouth, fill):
        return (f'<svg viewBox="0 0 40 40" class="face"><circle cx="20" cy="20" r="18" fill="{fill}" stroke="#555" stroke-width="1.5"/>'
                f'<circle cx="14" cy="16" r="2.2" fill="#333"/><circle cx="26" cy="16" r="2.2" fill="#333"/><path d="{mouth}" stroke="#333" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>')
    return (face('M12 25 Q20 32 28 25', '#C8E6C9') + '<span>Бәрін түсіндім</span>' + face('M12 27 L28 27', '#FFF3C4') + '<span>Сұрағым бар</span>'
            + face('M12 29 Q20 22 28 29', '#FFCDD2') + '<span>Көмек керек</span>')


def build_sheet(d, idx, color):
    rnd = random.Random(f'{d["g"]}-{d["n"]}')
    keys = []  # answer key lines
    parts = []
    lab = d['kind'] == 'lab'
    t_no = 1
    # 1. Ойлан
    parts.append(task(t_no, 'Талдау', 'Ойлан! Проблемалық сұрақ', f'<div class="hook">{ic("FaLightbulb")}<p>{md(d["hook"])}</p></div><p class="hint">Болжамыңды жаз. Сабақ соңында қайта оралып, тексер.</p>{lines(1)}', 'FaLightbulb'))
    t_no += 1
    # 2. Knowledge task
    th = d['theory']
    match = [t for t in th if re.match(r'^\*\*[^*]{1,40}\*\*\s*[–:-]', t)]
    bold_lines = [t for t in th if re.search(r'\*\*[^*]{1,40}\*\*', t)]
    nb = sum(len(re.findall(r'\*\*[^*]{1,40}\*\*', t)) for t in bold_lines)
    fl = []
    for f in d.get('formulas') or []:
        m = re.search(r'([^\s:;,(«»]{1,14})\s*=\s*([^;,«»]{1,40}?)(?=[;,]|\s—|\s–|$|\.\s)', plain(f))
        if m and not m.group(2).strip().replace(' ', '').isdigit(): fl.append((m.group(1), m.group(2).strip(' .')))
    if len(match) >= 3:
        items = []
        for t in match[:5]:
            m = re.match(r'^\*\*([^*]+)\*\*\s*[–:-]\s*(.*)$', t); items.append((m.group(1).strip(' :'), plain(m.group(2)).strip()))
        defs = items[:]; rnd.shuffle(defs); letters = 'АӘБВГ'
        left = ''.join(f'<li><b>{i + 1}.</b> {esc(a)}</li>' for i, (a, _) in enumerate(items))
        right = ''.join(f'<li><b>{letters[i]})</b> {esc(b)}</li>' for i, (_, b) in enumerate(defs))
        grid = ''.join(f'<td>{i + 1} – ____</td>' for i in range(len(items)))
        body = f'<p>Ұғымды оның анықтамасымен сәйкестендір.</p><div class="match"><ul>{left}</ul><ul>{right}</ul></div><table class="ans"><tr>{grid}</tr></table>'
        parts.append(task(t_no, 'Білу', 'Сәйкестендір', body, 'FaPuzzlePiece'))
        keys.append(f'{t_no}) ' + '; '.join(f'{i + 1} – {letters[defs.index(it)]}' for i, it in enumerate(items)))
    elif nb >= 2:
        bank, out = [], []
        for t in bold_lines[:4]:
            def rep(m):
                w = m.group(1).strip(' :'); bank.append(w); return '<span class="blank">' + '&nbsp;' * 22 + '</span>' + (':' if m.group(1).endswith(':') else '')
            out.append('<li>' + re.sub(r'\*\*([^*]{1,40})\*\*', rep, esc(t).replace('&quot;', '"')) + '</li>')
        sb = bank[:]; rnd.shuffle(sb)
        body = f'<p>Бос орындарға сөздер қорынан тиісті сөздерді қой.</p><div class="bank">{"".join(f"<span>{esc(w)}</span>" for w in sb)}</div><ol class="fill">{"".join(out)}</ol>'
        parts.append(task(t_no, 'Білу', 'Бос орынды толтыр', body, 'FaPuzzlePiece'))
        keys.append(f'{t_no}) ' + '; '.join(bank))
    elif len(fl) >= 2:
        rows = ''.join(f'<tr><td class="fx">{esc(a)} = </td><td class="blankcell"></td><td class="blankcell"></td></tr>' for a, _ in fl[:4])
        body = f'<p>Формулаларды толықтыр және шамалардың өлшем бірлігін жаз.</p><table class="grid"><tr><th>Шама</th><th>Формуласы</th><th>Өлшем бірлігі (SI)</th></tr>{rows}</table>'
        parts.append(task(t_no, 'Білу', 'Формула конструкторы', body, 'FaCalculator'))
        keys.append(f'{t_no}) ' + '; '.join(f'{a} = {b}' for a, b in fl[:4]))
    else:
        body = f'<p>Тақырыптың негізгі ұғымдары мен формулаларын кластерге жаз. Әр ұғымға бір мысал келтір.</p>{cluster_svg(d["topic"], color)}'
        parts.append(task(t_no, 'Білу', 'Ой-кластер', body, 'FaProjectDiagram'))
    t_no += 1
    # 3. Quick questions
    qs = [strip_ans(q) for q in d['quiz']]
    body = '<ol class="qq">' + ''.join(f'<li>{esc(q)}<div class="ansline"></div></li>' for q, _ in qs) + '</ol>'
    parts.append(task(t_no, 'Түсіну', 'Жылдам сұрақтар', body, 'FaQuestionCircle'))
    keys.append(f'{t_no}) ' + '; '.join(f'{i + 1}) {a}' for i, (_, a) in enumerate(qs) if a))
    t_no += 1
    # 4. Picture analysis
    pics = [p for p in [d.get('fig'), d.get('extra')] if p]
    if pics:
        imgs = ''.join(f'<img src="file://{IMG}/{p[0]}" style="width:{88 if len(pics) == 1 else 48}%">' for p in pics)
        qn = ['Суретте не бейнеленген? Қандай дене/құбылыс көрсетілген?', 'Қандай физикалық шамалар мен белгілеулер бар? Олардың мағынасын түсіндір.',
              'Сурет қандай заңдылықты көрсетеді? Өмірден бір мысал келтір.']
        body = f'<div class="pics">{imgs}</div><ol class="qq">' + ''.join(f'<li>{q}<div class="ansline"></div></li>' for q in qn) + '</ol>'
        parts.append(task(t_no, 'Талдау', 'Суретпен жұмыс', body, 'FaSearch')); t_no += 1
    # 5. Chart
    if d.get('chart'):
        cp = chart_png(d)
        q = (['Ең үлкен және ең кіші мәнді жаз.', 'Мәндерді салыстырып, қорытынды жаса.'] if d['chart']['type'] == 'bar'
             else ['Осьтерде қандай шамалар және өлшем бірліктері берілген?', 'Шамалар бір-біріне қалай тәуелді? (тура/кері пропорционал, тұрақты т.б.)', 'Графиктен бір нүктенің мәнін оқып, жаз.'])
        body = f'<div class="pics"><img src="file://{IMG}/{cp}" style="width:70%"></div><ol class="qq">' + ''.join(f'<li>{x}<div class="ansline"></div></li>' for x in q) + '</ol>'
        parts.append(task(t_no, 'Талдау', 'Графикті оқы', body, 'FaChartLine')); t_no += 1
    # 6. Lab
    if lab and d.get('steps'):
        st = d['steps'][:]; order = list(range(len(st))); sh = order[:]; rnd.shuffle(sh)
        if sh == order: sh = order[1:] + order[:1]
        body = '<p>Жұмыс қадамдарын дұрыс ретпен нөмірле (ұяшыққа 1, 2, 3… деп жаз).</p><ul class="order">' + ''.join(f'<li><span class="box"></span>{esc(st[i])}</li>' for i in sh) + '</ul>'
        parts.append(task(t_no, 'Талдау', 'Логикалық тізбек: жұмыс барысы', body, 'FaListOl'))
        keys.append(f'{t_no}) ' + ', '.join(str(sh.index(i) + 1) for i in order) + ' (тізімдегі қатар нөмірлері дұрыс ретпен)')
        t_no += 1
        cols = [c.strip() for c in d['table'].split('||')[0].split('|') if c.strip()]
        tbl = '<table class="grid data"><tr>' + ''.join(f'<th>{esc(c)}</th>' for c in cols) + '</tr>' + ('<tr>' + '<td></td>' * len(cols) + '</tr>') * 4 + '</table>'
        parts.append(task(t_no, 'Қолдану', 'Өлшеу нәтижелері', f'<p>Құралдар: {esc(", ".join(d["equip"]))}.</p>{tbl}<p class="hint">Қорытынды:</p>{lines(2)}', 'FaFlask')); t_no += 1
    # 7. Levels A, B, C
    for lv, key, title, iconn in [('Білу' if lab else 'Қолдану', 'a', 'А деңгейі', 'FaStar'), ('Қолдану', 'b', 'В деңгейі', 'FaCalculator'), ('Жинақтау', 'c', 'С деңгейі', 'FaTrophy')]:
        txt = ' '.join(d[key])
        is_prob = bool(re.search(r'\d', txt)) and bool(re.search(r'(м|кг|с|Н|Па|Дж|Вт|В|А|Ом|°C|К|Гц|км|см|г|л)\b', txt))
        work = ('<table class="grid prob"><tr><th>Берілгені</th><th>ХБЖ (SI)</th><th>Шешуі</th></tr><tr><td></td><td></td><td></td></tr></table><p class="answ">Жауабы: ____________________</p>'
                if is_prob else lines(4 if key == 'c' else 3))
        parts.append(task(t_no, lv, f'{title}: {"есеп" if is_prob else "тапсырма"}', ''.join(f'<p>{md(x)}</p>' for x in d[key]) + work, iconn)); t_no += 1
    for i, k in enumerate(d.get('key') or []):
        if k: keys.append(f'{"АВС"[i]}) {plain(k)}')
    # 8. Self-assessment
    sm = ''.join(f'<li><span class="box"></span>{esc(s[:1].upper() + s[1:])}</li>' for s in d['smart'][:4])
    parts.append(f'<section class="self"><div class="sh">{ic("FaCheckCircle")} Өзіңді бағала</div><div class="self-in"><div><p><b>Мен:</b></p><ul class="check">{sm}</ul></div>'
                 f'<div class="faces">{faces()}</div></div><p>Бүгін мен ________________________________________________ үйрендім.</p></section>')
    # 9. Remember box
    parts.append(f'<section class="remember"><div class="sh">{ic("FaBookOpen")} Есте сақта!</div><ul>' + ''.join(f'<li>{md(t)}</li>' for t in th) + '</ul></section>')
    head = (f'<div class="sheet-head"><div class="badge">{idx}</div><div class="ht"><div class="bolim">{esc(d["bolim"])} · {d["disp"]}-сабақ</div>'
            f'<h2>{esc(d["topic"])}</h2></div></div><div class="who">Аты-жөні: ______________________________ &nbsp; Сынып: ______ &nbsp; Күні: ____________</div>')
    return f'<article class="sheet" id="ws{idx}">{head}{"".join(parts)}</article>', keys


CSS = r'''
@page { size: A4; margin: 13mm 12mm 15mm 12mm; }
* { box-sizing: border-box; }
body { font-family: 'Times New Roman', 'Liberation Serif', serif; font-size: 12.5pt; color: #1f2a37; margin: 0; }
.ic svg { width: 1.05em; height: 1.05em; vertical-align: -0.15em; }
p { margin: 1.2mm 0; line-height: 1.32; }
.cover { height: 268mm; position: relative; page-break-after: always; overflow: hidden; border-radius: 6mm; background: var(--soft); padding: 22mm 16mm; }
.cover .c1, .cover .c2, .cover .c3 { position: absolute; border-radius: 50%; background: var(--main); opacity: .10; }
.cover .c1 { width: 140mm; height: 140mm; right: -45mm; top: -45mm; } .cover .c2 { width: 80mm; height: 80mm; left: -25mm; bottom: 30mm; opacity: .08; } .cover .c3 { width: 40mm; height: 40mm; right: 30mm; bottom: 60mm; opacity: .12; }
.cover .atom { width: 34mm; height: 34mm; color: var(--main); } .cover .atom svg { width: 100%; height: 100%; }
.cover h1 { font-size: 46pt; margin: 8mm 0 2mm; color: var(--main); letter-spacing: .5pt; }
.cover h3 { font-size: 22pt; margin: 0 0 6mm; font-weight: normal; }
.cover .sub { font-size: 15pt; max-width: 150mm; }
.cover .collage { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 12mm; }
.cover .collage div { background: #fff; border-radius: 4mm; padding: 2mm; height: 46mm; display: flex; align-items: center; justify-content: center; box-shadow: 0 1mm 3mm rgba(0,0,0,.08); }
.cover .collage img { max-width: 100%; max-height: 100%; }
.cover .foot { position: absolute; bottom: 16mm; left: 16mm; right: 16mm; font-size: 13pt; color: #44505c; }
.toc { page-break-after: always; }
.toc h2 { color: var(--main); font-size: 24pt; margin: 0 0 4mm; }
.toc .howto { background: var(--soft); border-radius: 4mm; padding: 3mm 5mm; margin-bottom: 4mm; font-size: 11.5pt; }
.toc .levels span { display: inline-block; color: #fff; border-radius: 3mm; padding: .5mm 3mm; margin: .8mm 1mm .8mm 0; font-size: 11pt; }
.toc h4 { margin: 3mm 0 1mm; color: var(--main); font-size: 13pt; }
.toc ol { margin: 0; padding-left: 0; list-style: none; columns: 2; column-gap: 8mm; font-size: 11pt; }
.toc li { break-inside: avoid; margin: .4mm 0; } .toc li b { color: var(--main); display: inline-block; min-width: 9mm; }
.sheet { page-break-before: always; }
.sheet-head { display: flex; align-items: center; gap: 4mm; background: var(--soft); border-radius: 4mm; padding: 3mm 4mm; }
.badge { flex: 0 0 15mm; height: 15mm; border-radius: 50%; background: var(--main); color: #fff; font-size: 20pt; font-weight: bold; display: flex; align-items: center; justify-content: center; }
.sheet-head h2 { margin: .5mm 0 0; font-size: 17pt; color: var(--main); line-height: 1.15; }
.bolim { font-size: 11pt; color: #55606e; text-transform: uppercase; letter-spacing: .4pt; }
.who { font-size: 11.5pt; margin: 2.5mm 1mm 3mm; color: #44505c; }
.task { border: 1.4px solid color-mix(in srgb, var(--lv) 55%, white); border-radius: 4mm; margin: 0 0 3.2mm; break-inside: avoid; overflow: hidden; }
.th { display: flex; align-items: center; gap: 2.5mm; background: color-mix(in srgb, var(--lv) 12%, white); padding: 1.6mm 3mm; }
.num { width: 7mm; height: 7mm; border-radius: 50%; background: var(--lv); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11.5pt; }
.tt { font-weight: bold; font-size: 13pt; color: var(--lv); flex: 1; }
.lv { font-size: 10pt; color: #fff; background: var(--lv); border-radius: 3mm; padding: .4mm 2.5mm; }
.tb { padding: 2mm 4mm 2.5mm; }
.lines { background: repeating-linear-gradient(to bottom, transparent 0, transparent 7.6mm, #b9c3cf 7.6mm, #b9c3cf 8.2mm); margin-top: 1mm; }
.ansline { border-bottom: 1px solid #b9c3cf; height: 8mm; }
.hook { display: flex; gap: 3mm; align-items: flex-start; background: #FFF6E5; border-radius: 3mm; padding: 2mm 3mm; }
.hook .ic svg { width: 9mm; height: 9mm; color: #E07A1F; } .hook p { font-size: 13pt; margin: 0; }
.hint { color: #6b7785; font-style: italic; font-size: 11pt; }
.match { display: grid; grid-template-columns: 1fr 1.7fr; gap: 4mm; } .match ul { list-style: none; padding: 0; margin: 0; }
.match li { background: #F5F7FA; border-radius: 2.5mm; padding: 1.4mm 2.5mm; margin: 1.2mm 0; font-size: 12pt; }
table.ans { border-collapse: collapse; margin-top: 2mm; } table.ans td { border: 1px solid #b9c3cf; padding: 1.5mm 4mm; }
.bank { display: flex; flex-wrap: wrap; gap: 2mm; margin: 1.5mm 0 2mm; } .bank span { border: 1.5px dashed var(--lv); border-radius: 3mm; padding: .6mm 3mm; font-weight: bold; color: var(--lv); }
.fill li { margin: 1.4mm 0; line-height: 1.6; } .blank { border-bottom: 1.2px solid #444; display: inline-block; min-width: 30mm; }
table.grid { width: 100%; border-collapse: collapse; margin-top: 1.5mm; } table.grid th { background: color-mix(in srgb, var(--lv) 14%, white); border: 1px solid #b9c3cf; padding: 1.4mm; font-size: 11.5pt; }
table.grid td { border: 1px solid #b9c3cf; height: 9mm; padding: 1mm 2mm; } table.grid td.fx { font-weight: bold; width: 26%; } table.prob td { height: 27mm; vertical-align: top; }
table.data td { height: 8.5mm; } .answ { margin-top: 2mm; font-weight: bold; }
.qq { margin: 1mm 0 0; padding-left: 6mm; } .qq li { margin: 1mm 0; }
.pics { display: flex; gap: 3mm; justify-content: center; align-items: center; margin: 1mm 0 2mm; } .pics img { max-height: 62mm; object-fit: contain; border: 1px solid #dfe5ec; border-radius: 3mm; padding: 1mm; background: #fff; }
.cluster { width: 100%; height: 52mm; } .cl-c { color: #fff; font-weight: bold; font-size: 14px; text-align: center; height: 76px; display: flex; align-items: center; justify-content: center; font-family: 'Times New Roman','Liberation Serif',serif; }
.order { list-style: none; padding: 0; } .order li, .check li { display: flex; gap: 3mm; align-items: center; margin: 1.3mm 0; }
.box { flex: 0 0 7mm; height: 7mm; border: 1.6px solid #555; border-radius: 1.5mm; display: inline-block; }
.self { border: 1.6px dashed var(--main); border-radius: 4mm; padding: 2.5mm 4mm; margin: 0 0 3.2mm; break-inside: avoid; }
.sh { font-weight: bold; font-size: 13.5pt; color: var(--main); }
.self-in { display: grid; grid-template-columns: 1.5fr 1fr; gap: 4mm; align-items: center; } .check { list-style: none; padding: 0; margin: 0; font-size: 11.5pt; } .check .box { flex-basis: 5mm; height: 5mm; }
.faces { display: grid; grid-template-columns: 12mm 1fr; align-items: center; gap: 1mm 2mm; font-size: 11pt; } .face { width: 11mm; height: 11mm; }
.remember { background: var(--soft); border-radius: 4mm; padding: 2.5mm 5mm; break-inside: avoid; } .remember ul { margin: 1mm 0; padding-left: 5mm; } .remember li { margin: .8mm 0; font-size: 12pt; }
.keys { page-break-before: always; } .keys h2 { color: var(--main); font-size: 22pt; margin: 0 0 3mm; }
.keys .k { break-inside: avoid; border-bottom: 1px solid #dfe5ec; padding: 1.4mm 0; font-size: 10.5pt; } .keys .k b { color: var(--main); }
'''


def spec_types(g):
    import importlib
    sys.path.insert(0, os.path.join(ROOT, 'gen'))
    S = {}
    for part in sorted(f for f in os.listdir(os.path.join(ROOT, 'gen')) if re.match(rf'g{g}[a-z]?\.py$', f)):
        S.update(importlib.import_module(part[:-3]).S)
    return {n: (sp.get('f') or [None])[0] for n, sp in S.items()}


def booklet(g):
    FT = spec_types(g)
    files = sorted(glob.glob(os.path.join(ROOT, 'pres_json', f'{g}_*.json')), key=lambda f: int(re.search(r'_(\d+)\.json', f).group(1)))
    L = [json.load(open(f)) for f in files]
    main, soft = GC[g]
    sheets, keys, toc = [], [], {}
    for i, d in enumerate(L, 1):
        if d.get('chart') and FT.get(d['n']) == 'graph': d = dict(d, fig=None)
        h, k = build_sheet(d, i, main); sheets.append(h); keys.append((i, d['topic'], k))
        toc.setdefault(d['bolim'], []).append((i, d['topic']))
    figs_ = [d['fig'][0] for d in L if d.get('fig')]
    pick = [figs_[int(j * (len(figs_) - 1) / 5)] for j in range(6)]
    cover = (f'<section class="cover"><div class="c1"></div><div class="c2"></div><div class="c3"></div><div class="atom">{ICON["FaAtom"]}</div>'
             f'<h1>ФИЗИКА</h1><h3>{g}-сынып · Жұмыс парақтары</h3><p class="sub">Әр сабаққа арналған тапсырмалар: білу, түсіну, қолдану, талдау және жинақтау деңгейлері. '
             f'Суреттермен, графиктермен, логикалық және аналитикалық тапсырмалармен.</p>'
             f'<div class="collage">' + ''.join(f'<div><img src="file://{IMG}/{p}"></div>' for p in pick) + '</div>'
             f'<div class="foot">Оқушының аты-жөні: ______________________________________ &nbsp; Сынып: ________</div></section>')
    lv = ''.join(f'<span style="background:{c}">{n}</span>' for n, c in LV.items() if n != 'Бағалау')
    tc = ''.join(f'<h4>{esc(b)}</h4><ol>' + ''.join(f'<li><b>{i}.</b> {esc(t)}</li>' for i, t in items) + '</ol>' for b, items in toc.items())
    toc_html = (f'<section class="toc"><h2>Мазмұны</h2><div class="howto"><b>Жұмыс парағымен қалай жұмыс істейміз?</b> Әр парақта тапсырмалар қиындық деңгейі бойынша '
                f'орналасқан. Түсті белгі тапсырманың деңгейін көрсетеді: <span class="levels">{lv}</span><br>Соңында «Өзіңді бағала» бөлімін толтыр, ал «Есте сақта» қорабы – '
                f'тақырыптың қысқаша түйіні. Жауаптар кітапшаның соңында берілген.</div>{tc}</section>')
    kh = '<section class="keys"><h2>Жауаптар</h2>' + ''.join(f'<div class="k"><b>{i}. {esc(t)}</b><br>' + '<br>'.join(esc(x) for x in k) + '</div>' for i, t, k in keys if k) + '</section>'
    doc = f'<!doctype html><html lang="kk"><head><meta charset="utf-8"><style>:root{{--main:{main};--soft:{soft};}}{CSS}</style></head><body>{cover}{toc_html}{"".join(sheets)}{kh}</body></html>'
    p = os.path.join(OUT, f'wb_{g}.html'); open(p, 'w').write(doc)
    return p


if __name__ == '__main__':
    for g in sys.argv[1:]: print(booklet(g))
