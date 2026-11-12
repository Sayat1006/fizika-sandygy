"""Көрнекі (v3) презентацияның .pptx нұсқасы: тақтадағы слайдтармен бірдей құрылым.

    python3 tools/deck/build_pptx3.py materials/decks/8-7.json materials/8/pres_007.pptx

Мәтін — PowerPoint-тың өз пішіндері (мұғалім өңдей алады), суреттер — tools/deck/art/*.png
(tools/deck/art_png.py жасайды). Әр басу тақтадағы қадаммен бірдей (types.ts → stepsOf).
Мұғалімге арналған әдіс сипаттамасы — слайд жазбасында (Notes).
"""
import json, os, re, sys

from PIL import Image
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Pt
from pptx.oxml.ns import qn
from lxml import etree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_pptx as B  # noqa: E402
from build_pptx import C, FONT, Page, px, rgb  # noqa: E402

ART = os.path.join(HERE, 'art')
W, H = 1920, 1080
OK, NO = '17A05D', 'E5483A'
LV = {'A': ('Түсінемін', '17A05D'), 'B': ('Қолданамын', 'F08C00'), 'C': ('Талдаймын', 'D6336C')}
OPT = ['1F8BFF', 'FF8A1F', '8B5CF6', 'E5483A']


def steps_of(s):
    t = s['t']
    if t == 'ask': return 1 if s.get('answer') else 0
    if t in ('aims', 'trio', 'sum'): return len(s['items'])
    if t == 'idea': return len(s.get('list') or []) + (1 if s.get('chips') else 0)
    if t == 'bigf': return len(s['parts'])
    if t in ('poll', 'job'): return 1
    if t == 'myth': return 2
    if t in ('cover', 'home', 'stars', 'bye', 'model'): return 0
    return B.steps_of(s)


def art(pg, aid, x, y, w, h, meet=False, model=False, r=44):
    """сурет: панельге толтырып (slice) немесе сыйғызып (meet) қою, бұрыштары дөңгеленген"""
    path = os.path.join(ART, ('model_' if model else '') + aid + '.png')
    if not os.path.exists(path):
        return pg.rect(x, y, w, h, C['card'], r=r)
    iw, ih = Image.open(path).size
    if meet:
        pg.rect(x, y, w, h, C['card'], r=r)
        k = min(w / iw, h / ih); dw, dh = iw * k, ih * k
        return pg.sh.add_picture(path, px(x + (w - dw) / 2), px(y + (h - dh) / 2), px(dw), px(dh))
    pic = pg.sh.add_picture(path, px(x), px(y), px(w), px(h))
    ra, rb = w / h, iw / ih
    if rb > ra:  # сурет кеңірек — екі шетін кесеміз
        c = (1 - ra / rb) / 2; pic.crop_left = pic.crop_right = c
    else:
        c = (1 - rb / ra) / 2; pic.crop_top = pic.crop_bottom = c
    if r:
        pic.auto_shape_type = MSO_SHAPE.ROUNDED_RECTANGLE
        geom = pic._element.spPr.find(qn('a:prstGeom'))
        av = geom.find(qn('a:avLst'))
        if av is None:
            av = etree.SubElement(geom, qn('a:avLst'))
        gd = etree.SubElement(av, qn('a:gd')); gd.set('name', 'adj'); gd.set('fmla', f'val {int(min(0.5, r / min(w, h)) * 100000)}')
    return pic


def lines(t, w, size, k=0.58):
    """мәтін неше жолға сыяды (Arial, шамамен)"""
    per = max(1, int(w / (size * k)))
    n, cur = 1, 0
    for word in re.sub(r'\*\*', '', t).split():
        L = len(word) + (1 if cur else 0)
        if cur + L > per:
            n += 1; cur = len(word)
        else:
            cur += L
    return n


def tx(pg, x, y, w, h, t, size, **k):
    return pg.text(x, y, w, h, t, size, **k)


def kicker(pg, x, y, t, w=800):
    return tx(pg, x, y, w, 44, t.upper(), 28, color='accent', bold=True)


def pill(pg, x, y, t, fill, color='FFFFFF', size=26):
    w = len(t) * size * 0.62 + 48
    return pg.text(x, y, w, size + 26, t, size, color=color, bold=True, fill=fill, r=(size + 26) / 2, align='c', anchor='m')


def h2(pg, x, y, w, h, t, size=80, align='l', anchor='t'):
    return tx(pg, x, y, w, h, t, size, bold=True, align=align, anchor=anchor, spacing=0.95)


def number(pg, x, y, d, label, fill):
    c = pg.rect(x, y, d, d, fill, r=d * 0.28)
    tf = c.text_frame; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = label; r.font.name = FONT; r.font.size = Pt(d * 0.28); r.font.bold = True; r.font.color.rgb = rgb('FFFFFF')
    return c


# ───────── слайдтар ─────────
def s_cover(pg, s, D, bye=False):
    art(pg, s['art'], 883, 48, 989, 984, r=48)
    if bye:
        h2(pg, 128, 330, 720, 260, s['title'], 96, anchor='b')
        q = s.get('quote')
        if q:
            tx(pg, 128, 620, 700, 200, f"«{q['text']}»", 40, color='ink2')
            tx(pg, 128, 830, 700, 50, '— ' + q['by'], 30, color='ink3')
        return
    kicker(pg, 128, 300, s['kicker'], 720)
    size = 84 if len(s['title']) > 44 else 100
    h2(pg, 128, 360, 720, 460, s['title'], size)
    if s.get('sub'):
        tx(pg, 128, 830, 700, 120, s['sub'], 38, color='ink2')


def s_ask(pg, s, D):
    art(pg, s['art'], 0, 0, W, H, r=0)
    card = pg.rect(96, 700, 1728, 300, 'FFFFFF', r=40)
    q = pg.oval(200, 850, 108, C['accent'])
    q.text_frame.text = '?'
    for p in q.text_frame.paragraphs:
        p.alignment = PP_ALIGN.CENTER
        for r in p.runs:
            r.font.size = Pt(36); r.font.bold = True; r.font.name = FONT; r.font.color.rgb = rgb('FFFFFF')
    q.text_frame.vertical_anchor = MSO_ANCHOR.MIDDLE
    h2(pg, 290, 730, 1480, 170, s['q'], 58 if len(s['q']) < 90 else 48, anchor='m')
    if s.get('answer'):
        pg.click(tx(pg, 290, 912, 1480, 70, s['answer'], 38, color='ink2'))
    return card


def s_aims(pg, s, D):
    h2(pg, 128, 96, 1664, 110, s['title'], 84)
    n = len(s['items']); gw = (1664 - 36 * (n - 1)) / n
    for i, t in enumerate(s['items']):
        x = 128 + i * (gw + 36)
        c = pg.rect(x, 300, gw, 460, C['card'], r=36)
        nb = number(pg, x + 44, 348, 96, str(i + 1), C['accent'])
        tt = tx(pg, x + 44, 480, gw - 88, 260, t, 42, bold=True)
        pg.click(c, nb, tt)


def s_trio(pg, s, D):
    if s.get('tag'):
        pill(pg, 128, 70, s['tag'], 'E6F0FF', C['accent'])
    h2(pg, 128, 130, 1664, 100, s['title'], 76)
    items = s['items']; n = len(items); gw = (1664 - 36 * (n - 1)) / n
    for i, it in enumerate(items):
        x = 128 + i * (gw + 36)
        c = pg.rect(x, 270, gw, 700, C['card'], r=36)
        a = art(pg, it['art'], x, 270, gw, 380, r=36)
        sh = [c, a]
        if it.get('name'):
            sh.append(tx(pg, x + 40, 680, gw - 80, 70, it['name'], 46, bold=True))
            sh.append(tx(pg, x + 40, 760, gw - 80, 200, it['text'], 34, color='ink2'))
        else:
            sh.append(tx(pg, x + 40, 690, gw - 80, 260, it['text'], 38, bold=True))
        pg.click(*sh)


def s_idea(pg, s, D):
    flip = s.get('flip')
    ax, aw = (48, 1066) if flip else (806, 1066)
    tx0 = 1178 if flip else 128
    tw = 614
    art(pg, s['art'], ax, 48, aw, 984)
    lst = s.get('list') or []
    y = 260 if lst else 300
    if s.get('kicker'):
        kicker(pg, tx0, y - 60, s['kicker'], tw)
    ts = 80 if lines(s['title'], tw, 80, 0.62) <= 2 else 64
    th = lines(s['title'], tw, ts, 0.62) * ts * 1.05 + 10
    h2(pg, tx0, y, tw, th, s['title'], ts)
    y += th + 30
    if s.get('text'):
        fs = 40 if len(s['text']) < 150 else 34
        tx(pg, tx0, y, tw, 400, s['text'], fs, color='ink2')
        y += lines(s['text'], tw, fs) * fs * 1.3 + 30
    small = len(''.join(lst)) > 220
    for t in lst:
        dot = pg.oval(tx0 + 14, y + 22, 22, C['accent'])
        fs = 30 if small else 36
        tt = tx(pg, tx0 + 48, y, tw - 48, 120, t, fs, color='ink2')
        pg.click(dot, tt)
        y += lines(t, tw - 48, fs) * fs * 1.25 + 22
    if s.get('chips'):
        x = tx0; sh = []
        for c in s['chips']:
            p = pill(pg, x, min(y + 10, 930), c, C['accent'], size=32); sh.append(p); x += len(c) * 32 * 0.62 + 64
        pg.click(*sh)


def s_model(pg, s, D):
    art(pg, s['illus']['k'], 653, 48, 1219, 984, meet=True, model=True)
    kicker(pg, 128, 340, s.get('kicker') or 'Модельмен тексер', 480)
    h2(pg, 128, 400, 480, 240, s['title'], 72)
    if s.get('text'):
        tx(pg, 128, 660, 480, 200, s['text'], 36, color='ink2')


def s_bigf(pg, s, D):
    if s.get('tag'):
        pill(pg, W / 2 - 80, 90, s['tag'], 'E6F0FF', C['accent'])
    h2(pg, 128, 160, 1664, 100, s['title'], 76, align='c')
    f = tx(pg, 128, 320, 1664, 260, s['f'], 180 if len(s['f']) < 14 else 130, align='c', anchor='m', italic=True)
    for r in f.text_frame.paragraphs[0].runs:
        r.font.name = 'Cambria Math'
    n = len(s['parts']); gw = min(400, (1664 - 32 * (n - 1)) / n); x0 = (W - (gw * n + 32 * (n - 1))) / 2
    for i, (sym, name, unit) in enumerate(s['parts']):
        x = x0 + i * (gw + 32)
        c = pg.rect(x, 640, gw, 260, C['card'], r=32)
        a = tx(pg, x, 660, gw, 100, sym, 76, align='c', italic=True, bold=True)
        b = tx(pg, x + 20, 770, gw - 40, 70, name, 30, align='c', bold=True)
        u = tx(pg, x, 845, gw, 40, unit, 28, align='c', color='ink2')
        pg.click(c, a, b, u)


def s_poll(pg, s, D):
    has = bool(s.get('art'))
    pill(pg, 128, 90, 'Сұрақ', 'FFB020', '1B1300')
    tw = 1000 if has else 1664
    h2(pg, 128, 160, tw, 200, s['q'], 64 if len(s['q']) < 70 else 54)
    if has:
        art(pg, s['art'], 1232, 96, 560, 888, meet=True, r=40)
    marks = []
    for i, o in enumerate(s['opts']):
        if has:
            x, y, w, h = 128, 400 + i * 150, 1000, 128
        else:
            x, y, w, h = 128 + (i % 2) * 848, 420 + (i // 2) * 270, 816, 240
        pg.rect(x, y, w, h, C['card'], r=28)
        number(pg, x + 28, y + (h - 80) / 2, 80, 'ABCD'[i], OPT[i])
        tx(pg, x + 140, y, w - 170, h, o, 40 if has else 46, bold=True, anchor='m')
        if i == s['ok']:
            m = pg.rect(x - 6, y - 6, w + 12, h + 12, None, r=32, line=OK, lw=8)
            ok = number(pg, x + 28, y + (h - 80) / 2, 80, 'ABCD'[i], OK)
            marks += [m, ok]
    pg.click(*marks)


def s_myth(pg, s, D):
    pg.rect(0, 0, W / 2, H, 'FDF0EF', r=0); pg.rect(W / 2, 0, W / 2, H, 'EEF8F2', r=0)
    pill(pg, 128, 150, '✕  Қате пікір', NO, size=32)
    w = tx(pg, 128, 250, 760, 500, s['wrong'], 62, bold=True, color='ink2')
    for p in w.text_frame.paragraphs:
        for r in p.runs:
            r.font._rPr.set('strike', 'sngStrike')
    a = pill(pg, 1056, 150, '✓  Шындығында', OK, size=32)
    b = tx(pg, 1056, 250, 736, 460, s['right'], 62, bold=True)
    pg.click(a, b)
    pg.click(tx(pg, 1056, 760, 736, 220, s['why'], 36, color='ink2', fill='FFFFFF', r=28))


def s_job(pg, s, D):
    lv, col = LV[s['level']]
    has = bool(s.get('art'))
    tw = 1000 if has else 1664
    pill(pg, 128, 110, f"{s['level']}   {lv}", col, size=34)
    q = s['q']
    h2(pg, 128, 230, tw, 460, q, 66 if len(q) < 80 else 54 if len(q) < 160 else 46)
    if has:
        art(pg, s['art'], 1152, 48, 720, 984, meet=True)
    c = pg.rect(128, 770, tw, 220, C['card'], r=32)
    a = tx(pg, 168, 790, tw - 80, 36, 'ЖАУАБЫ', 24, bold=True, color=OK)
    b = tx(pg, 168, 834, tw - 80, 150, s['answer'], 36 if len(s['answer']) < 140 else 30)
    pg.click(c, a, b)


def s_home(pg, s, D):
    h2(pg, 128, 96, 1664, 110, s['title'], 84)
    for i, (lv, t) in enumerate(s['items']):
        y = 290 + i * 200
        pg.rect(128, y, 1664, 170, C['card'], r=32)
        number(pg, 168, y + 41, 88, lv, LV.get(lv, ('', C['accent']))[1])
        tx(pg, 300, y, 1450, 170, t, 42, bold=True, anchor='m')


ICON_COL = {'g': '17A05D', 'y': 'FFB020', 'r': 'E5483A'}


def icon(pg, k, cx, cy, d):
    base, _, mod = k.partition('-')
    if base == 'star':
        shp = pg.sh.add_shape(MSO_SHAPE.STAR_5_POINT, px(cx - d / 2), px(cy - d / 2), px(d), px(d)); col = 'FFC21F'
    elif base == 'wish':
        shp = pg.sh.add_shape(MSO_SHAPE.TEAR, px(cx - d / 2), px(cy - d / 2), px(d), px(d)); col = '1F8BFF'; shp.rotation = -45
    elif base == 'face':
        shp = pg.sh.add_shape(MSO_SHAPE.SMILEY_FACE, px(cx - d / 2), px(cy - d / 2), px(d), px(d)); col = ICON_COL.get(mod, 'FFB020')
        if mod == 'r':
            shp.adjustments[0] = -0.04
        elif mod == 'y':
            shp.adjustments[0] = 0
    elif base == 'note':
        shp = pg.sh.add_shape(MSO_SHAPE.FOLDED_CORNER, px(cx - d * 0.38), px(cy - d / 2), px(d * 0.76), px(d)); col = 'C9D1DC'
    elif base in ('leaf', 'light'):
        shp = pg.oval(cx, cy, d, ICON_COL.get(mod, '17A05D')); return shp
    elif base == 'target':
        for j, r in enumerate((1, .66, .33)):
            pg.oval(cx, cy, d * r, NO if j == 3 - int(mod or 1) else ('FFFFFF' if j % 2 else 'FFD0CC'), line=NO, lw=4)
        return None
    else:  # num, step, plus, minus, idea
        lab = {'plus': '+', 'minus': '−', 'idea': '!'}.get(base, mod)
        col = {'plus': OK, 'minus': NO, 'idea': 'FFB020'}.get(base, C['accent'])
        shp = pg.oval(cx, cy, d, col)
        tf = shp.text_frame; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
        r = p.add_run(); r.text = lab; r.font.name = FONT; r.font.size = Pt(d * 0.3); r.font.bold = True; r.font.color.rgb = rgb('FFFFFF')
        return shp
    shp.fill.solid(); shp.fill.fore_color.rgb = rgb(col); shp.line.fill.background(); shp.shadow.inherit = False
    return shp


def s_stars(pg, s, D):
    h2(pg, 128, 110, 1664, 110, s['title'], 80, align='c')
    items = s['items']; n = len(items); gw = (1664 - 32 * (n - 1)) / n
    for i, it in enumerate(items):
        k, t = (('wish' if i == n - 1 else 'star'), it) if isinstance(it, str) else it
        x = 128 + i * (gw + 32)
        pg.rect(x, 320, gw, 520, C['card'], r=40)
        icon(pg, k, x + gw / 2, 470, 150 if n <= 3 else 110)
        tx(pg, x + 24, 600, gw - 48, 220, t, 40 if n <= 3 else 32, bold=True, align='c')


T = dict(cover=s_cover, ask=s_ask, aims=s_aims, trio=s_trio, sum=s_trio, idea=s_idea, model=s_model, bigf=s_bigf, poll=s_poll, myth=s_myth,
         job=s_job, home=s_home, stars=s_stars, bye=lambda pg, s, D: s_cover(pg, s, D, bye=True))


def build(deck_path, out):
    D = json.load(open(deck_path, encoding='utf-8'))
    prs = Presentation()
    prs.slide_width, prs.slide_height = px(W), px(H)
    prs.core_properties.title = D['topic']
    prs.core_properties.author = 'Сабақтас'
    for n, s in enumerate(D['slides'], 1):
        pg = Page(prs)
        if s['t'] in T:
            T[s['t']](pg, s, D)
            if s['t'] not in ('cover', 'bye', 'ask'):
                tx(pg, 1720, 1020, 150, 34, str(n), 22, color='ink3', align='r')
        else:
            B.T[s['t']](pg, s, D)
            B.foot(pg, D['topic'], n)
        got = len(pg.clicks)
        assert got == steps_of(s), f"{n}-слайд ({s['t']}): {got} басу, тақтада {steps_of(s)}"
        if s.get('notes'):
            pg.s.notes_slide.notes_text_frame.text = re.sub(r'\*\*(.+?)\*\*', r'\1', s['notes'])
        pg.transition(); pg.timing()
    prs.save(out)
    print('ok', out, len(D['slides']), 'слайд')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
