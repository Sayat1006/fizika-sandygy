"""Анимациялы презентацияның мазмұнынан (materials/decks/{v}-{n}.json) жүктеп алатын .pptx жасау.

    python3 tools/deck/build_pptx.py materials/decks/7-5.json materials/7/pres_005.pptx

Барлық мәтін мен сызба — PowerPoint-тың өз пішіндері (суретке айналдырылмайды), сондықтан
мұғалім кез келген жерін өңдей алады. 16:9, 1920×1080 торымен салынады. Анимациялар: әр басу
келесі элементті шығарады — тақтадағы қадамдармен бірдей (web/src/app/deck/types.ts → stepsOf).
Қаріп: Arial — қазақ әріптері кез келген компьютерде дұрыс шығады.
"""
import base64, io, json, sys
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.dml import MSO_LINE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree

FONT = 'Arial'
C = dict(bg='FFFFFF', card='F2F4F7', ink='101418', ink2='4A525E', ink3='8A919C', accent='0A6CFF', on='FFFFFF',
         vec='0A6CFF', sca='7C4DFF', ok='1F9D55', err='E0443A', grid='E3E7EE', warn='E8A23A')
DIRS = {'right': 'оңға', 'left': 'солға', 'up': 'жоғары', 'down': 'төмен'}


def px(v):
    return Emu(int(round(v * 6350)))


def rgb(h):
    return RGBColor.from_string(h)


def steps_of(s):
    t = s['t']
    if t in ('goals', 'picture', 'yesno', 'sort', 'qa', 'levels'):
        return len(s['items'])
    return {'problem': 2, 'compare': 3 if s.get('note') else 2, 'vectors': len(s.get('vectors', [])), 'task': 1}.get(t, 0)


class Page:
    """Бір слайд: пішіндерді қосу және анимация қадамдарын жинау"""

    def __init__(self, prs):
        self.s = prs.slides.add_slide(prs.slide_layouts[6])
        self.sh = self.s.shapes
        self.clicks = []  # [[(shape, effect)], ...]
        self.auto = []    # [(shape, effect, delay_ms)]
        bg = self.s.background.fill
        bg.solid(); bg.fore_color.rgb = rgb(C['bg'])

    # ── пішіндер ──
    def rect(self, x, y, w, h, fill, r=28, line=None, lw=0, into=None):
        shp = (into or self.sh).add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if r else MSO_SHAPE.RECTANGLE, px(x), px(y), px(w), px(h))
        if r:
            shp.adjustments[0] = min(0.5, r / min(w, h))
        if fill:
            shp.fill.solid(); shp.fill.fore_color.rgb = rgb(fill)
        else:
            shp.fill.background()
        if line:
            shp.line.color.rgb = rgb(line); shp.line.width = px(lw)
        else:
            shp.line.fill.background()
        shp.shadow.inherit = False
        tf = shp.text_frame
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        return shp

    def oval(self, x, y, d, fill, into=None, line=None, lw=0):
        shp = (into or self.sh).add_shape(MSO_SHAPE.OVAL, px(x - d / 2), px(y - d / 2), px(d), px(d))
        shp.fill.solid(); shp.fill.fore_color.rgb = rgb(fill)
        if line:
            shp.line.color.rgb = rgb(line); shp.line.width = px(lw)
        else:
            shp.line.fill.background()
        shp.shadow.inherit = False
        return shp

    def poly(self, pts, fill, into=None):
        b = (into or self.sh).build_freeform(px(pts[0][0]), px(pts[0][1]), scale=1.0)
        b.add_line_segments([(px(a), px(c)) for a, c in pts[1:]], close=True)
        shp = b.convert_to_shape()
        shp.fill.solid(); shp.fill.fore_color.rgb = rgb(fill); shp.line.fill.background(); shp.shadow.inherit = False
        return shp

    def line(self, x1, y1, x2, y2, color, w, arrow=False, dash=None, into=None, round_cap=True):
        ln = (into or self.sh).add_connector(MSO_CONNECTOR.STRAIGHT, px(x1), px(y1), px(x2), px(y2))
        ln.line.color.rgb = rgb(color); ln.line.width = px(w)
        lnx = ln.line._get_or_add_ln()
        if round_cap:
            lnx.set('cap', 'rnd')
        if dash:
            pd = etree.SubElement(lnx, qn('a:prstDash')); pd.set('val', dash)
        if arrow:
            te = etree.SubElement(lnx, qn('a:tailEnd')); te.set('type', 'triangle'); te.set('w', 'med'); te.set('len', 'med')
        return ln

    def text(self, x, y, w, h, runs, size, color='ink', bold=False, align='l', anchor='t', italic=False, into=None, spacing=None, fill=None, r=0):
        """runs: мәтін немесе [(мәтін, {color, bold})] тізімі; бірнеше абзац үшін '\\n'"""
        shp = self.rect(x, y, w, h, fill, r=r, into=into) if fill else (into or self.sh).add_textbox(px(x), px(y), px(w), px(h))
        tf = shp.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = {'t': MSO_ANCHOR.TOP, 'm': MSO_ANCHOR.MIDDLE, 'b': MSO_ANCHOR.BOTTOM}[anchor]
        if isinstance(runs, str):
            runs = [(runs, {})]
        paras = [[]]
        for txt, st in runs:
            parts = txt.split('\n')
            for k, part in enumerate(parts):
                if k:
                    paras.append([])
                if part:
                    paras[-1].append((part, st))
        for k, pr in enumerate(paras):
            p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
            p.alignment = {'l': PP_ALIGN.LEFT, 'c': PP_ALIGN.CENTER, 'r': PP_ALIGN.RIGHT}[align]
            if spacing:
                p.line_spacing = spacing
            for txt, st in pr:
                r_ = p.add_run(); r_.text = txt
                f = r_.font; f.name = FONT; f.size = Pt(st.get('size', size) * 0.5)
                f.bold = st.get('bold', bold); f.italic = st.get('italic', italic)
                f.color.rgb = rgb(C.get(st.get('color', color), st.get('color', color)))
        return shp

    def picture(self, data_uri, x, y, w, h):
        raw = base64.b64decode(data_uri.split(',', 1)[1])
        return self.sh.add_picture(io.BytesIO(raw), px(x), px(y), px(w), px(h))

    def group(self):
        return self.sh.add_group_shape()

    # ── анимация ──
    def click(self, *items):
        self.clicks.append([(i if isinstance(i, tuple) else (i, 'fade')) for i in items])

    def timing(self):
        if not self.clicks and not self.auto:
            return
        ids = iter(range(3, 10000))
        P = 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"'

        def eff(shp, kind, node, delay=0):
            spid = shp.shape_id
            a, b, c = next(ids), next(ids), next(ids)
            if kind == 'fade':
                pid, sub, flt, dur = 10, 0, 'fade', 500
            else:  # wipe-* : стрелка өз бағытымен «сызылады»
                pid, dur = 22, 700
                sub, flt = {'wipe-right': (8, 'wipe(left)'), 'wipe-left': (2, 'wipe(right)'), 'wipe-up': (4, 'wipe(down)'), 'wipe-down': (1, 'wipe(up)')}[kind]
            return (f'<p:par><p:cTn id="{a}" presetID="{pid}" presetClass="entr" presetSubtype="{sub}" fill="hold" grpId="0" nodeType="{node}">'
                    f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>'
                    f'<p:set><p:cBhvr><p:cTn id="{b}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
                    f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
                    f'<p:to><p:strVal val="visible"/></p:to></p:set>'
                    f'<p:animEffect transition="in" filter="{flt}"><p:cBhvr><p:cTn id="{c}" dur="{dur}"/><p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>'
                    f'</p:childTnLst></p:cTn></p:par>')

        groups = []
        if self.auto:
            inner = ''.join(eff(s, k, 'afterEffect' if n == 0 else 'withEffect', d) for n, (s, k, d) in enumerate(self.auto))
            o, i_ = next(ids), next(ids)
            groups.append(f'<p:par><p:cTn id="{o}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
                          f'<p:par><p:cTn id="{i_}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>')
        for grp in self.clicks:
            o, i_ = next(ids), next(ids)
            inner = ''.join(eff(s, k, 'clickEffect' if n == 0 else 'withEffect') for n, (s, k) in enumerate(grp))
            groups.append(f'<p:par><p:cTn id="{o}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>'
                          f'<p:par><p:cTn id="{i_}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>')
        shapes = [s for s, *_ in self.auto] + [s for g in self.clicks for s, _ in g]
        bld = ''.join(f'<p:bldP spid="{s.shape_id}" grpId="0" animBg="1"/>' for s in shapes if s.has_text_frame and s.text_frame.text)
        xml = (f'<p:timing {P}><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
               f'<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>{"".join(groups)}</p:childTnLst></p:cTn>'
               f'<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
               f'<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
               f'</p:childTnLst></p:cTn></p:par></p:tnLst>{"<p:bldLst>" + bld + "</p:bldLst>" if bld else ""}</p:timing>')
        self.s._element.append(etree.fromstring(xml))

    def transition(self):
        tr = etree.fromstring('<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" spd="med"><p:fade/></p:transition>')
        self.s._element.insert(2, tr)


# ───────── ортақ бөліктер ─────────
def head(pg, s, title=None):
    runs = [(s.get('tag', ''), {'color': 'accent', 'bold': True})]
    if s.get('time'):
        runs.append(('     ' + s['time'], {'color': 'ink2'}))
    pg.text(128, 84, 1664, 44, runs, 28)
    if title or s.get('title'):
        pg.text(128, 136, 1664, 100, title or s['title'], 72, bold=True)


def foot(pg, topic, n):
    pg.text(128, 1010, 1300, 34, topic, 22, color='ink3')
    pg.text(1592, 1010, 200, 34, str(n), 22, color='ink3', align='r')


def num(pg, x, y, label, fill='accent', d=64, into=None):
    c = pg.oval(x + d / 2, y + d / 2, d, C[fill], into=into)
    tf = c.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = label; r.font.name = FONT; r.font.size = Pt(d * 0.25); r.font.bold = True; r.font.color.rgb = rgb(C['on'])
    return c


def grid(pg, x, y, w, h, cell, ox=None, oy=None, into=None):
    ox = x if ox is None else ox; oy = y if oy is None else oy
    k = (x - ox) // cell
    gx = ox + k * cell
    while gx <= x + w + 0.1:
        if gx >= x - 0.1:
            pg.line(gx, y, gx, y + h, C['grid'], 2, into=into, round_cap=False)
        gx += cell
    k = (y - oy) // cell
    gy = oy + k * cell
    while gy <= y + h + 0.1:
        if gy >= y - 0.1:
            pg.line(x, gy, x + w, gy, C['grid'], 2, into=into, round_cap=False)
        gy += cell


def vector_grid(pg, x, y, W, H, scale, vectors, steps=True):
    """Масштаб торы + векторлар (тақтадағы gridLayout-пен бірдей есеп). Әр вектор — жеке топ."""
    cells = lambda v: v['mag'] / scale['cell']
    r = max([cells(v) for v in vectors if v['dir'] == 'right'] or [0]); l = max([cells(v) for v in vectors if v['dir'] == 'left'] or [0])
    u = max([cells(v) for v in vectors if v['dir'] == 'up'] or [0]); d = max([cells(v) for v in vectors if v['dir'] == 'down'] or [0])
    k = W / 1000
    c = min(130, (1000 - 160) / (l + r + 1.5), (720 - 150) / (u + d + 1.5)) * k
    ox = x + (W - (l + r) * c) / 2 + l * c
    oy = y + (H - (u + d) * c) / 2 + u * c + 10 * k
    pg.rect(x, y, W, H, C['card'], r=28)
    grid(pg, x + 6, y + 6, W - 12, H - 12, c, ox, oy)
    # масштаб белгісі
    sx, sy = x + W - 60 * k - c, y + H - 40 * k - c
    pg.rect(sx, sy, c, c, None, r=0, line=C['accent'], lw=4)
    pg.text(sx - 340, sy + c / 2 - 22, 320, 44, f"1 тор = {scale['cell']} {scale['unit']}", 30, color='accent', bold=True, align='r')
    groups = []
    for i, v in enumerate(vectors):
        L = cells(v) * c
        ex, ey = {'right': (ox + L, oy), 'left': (ox - L, oy), 'up': (ox, oy - L), 'down': (ox, oy + L)}[v['dir']]
        col = C['sca'] if i % 2 else C['vec']
        ln = pg.line(ox, oy, ex, ey, col, 12, arrow=True)
        horiz = v['dir'] in ('right', 'left')
        label = f"{v['name']} = {v['mag']} {scale['unit']}"
        tx = pg.text((ox + ex) / 2 - 250 if horiz else ex + 26, (ey + 24 if horiz else (oy + ey) / 2 - 26), 500 if horiz else 420, 52, label, 40,
                     color='sca' if i % 2 else 'vec', bold=True, align='c' if horiz else 'l')
        groups.append((ln, tx, 'wipe-' + v['dir']))
    pg.oval(ox, oy, 28, C['ink'])
    pg.text(ox - 70, oy + 16, 48, 40, 'O', 30, bold=True, align='r')
    return groups


def title_art(pg, x, y, size, auto=True):
    k = size / 760
    P = lambda a, b: (x + a * k, y + b * k)
    ring = pg.oval(*P(380, 380), 600 * k, C['bg'], line=C['grid'], lw=3)
    ring.fill.background()
    ring.line.dash_style = MSO_LINE.DASH
    sc = pg.line(*P(160, 560), *P(560, 560), C['sca'], 12 * k)
    vc = pg.line(*P(160, 560), *P(585, 178), C['vec'], 16 * k, arrow=True)
    pg.oval(*P(160, 560), 44 * k, C['ink'])
    lbl = pg.text(*P(470, 360), 120 * k, 100 * k, 'F', 76 * k, color='vec', bold=True, italic=True)
    bar = pg.line(*P(476, 368), *P(540, 368), C['vec'], 5 * k, arrow=True)
    if auto:
        pg.auto += [(sc, 'wipe-right', 200), (vc, 'wipe-up', 0), (lbl, 'fade', 0), (bar, 'fade', 0)]


# ───────── шаблондар ─────────
def s_title(pg, s, D):
    pg.text(128, 290, 1100, 50, s['kicker'].upper(), 30, color='accent', bold=True)
    pg.text(128, 350, 1150, 330, s['title'], 116, bold=True, spacing=0.95)
    pg.text(128, 700, 1100, 60, s['sub'], 38, color='ink2')
    if s.get('foot'):
        pg.text(128, 990, 1300, 40, s['foot'], 26, color='ink3')
    title_art(pg, 1180, 170, 720)


def s_goals(pg, s, D):
    head(pg, s)
    for i, t in enumerate(s['items']):
        g = pg.group()
        num(pg, 128, 300 + i * 136, str(i + 1), into=g.shapes)
        pg.text(228, 300 + i * 136 + 4, 1500, 120, t, 42, anchor='t', into=g.shapes)
        pg.click(g)
    if s.get('code'):
        pg.text(128, 900, 1664, 80, 'Оқу мақсаты: ' + s['code'], 26, color='ink3')


def rows_with_pills(pg, items, y0, row_h, gap, w, pill):
    for i, (q, a) in enumerate(items):
        y = y0 + i * (row_h + gap)
        pg.rect(128, y, w, row_h, C['card'], r=24)
        pg.text(160, y, 50, row_h, str(i + 1), 32, color='ink3', bold=True, anchor='m')
        pg.text(220, y, w - 520, row_h, q, 36, anchor='m')
        fill, label = pill(a)
        sh = pg.text(128 + w - 280, y + (row_h - 64) / 2, 250, 64, label, 32, color='on' if fill != 'ok' and fill != 'err' else 'FFFFFF', bold=True, align='c', anchor='m', fill=C[fill], r=32)
        pg.click(sh)


def s_yesno(pg, s, D):
    head(pg, s)
    if s.get('sub'):
        pg.text(128, 236, 1664, 50, s['sub'], 34, color='ink2')
    rows_with_pills(pg, [(t, ok) for t, ok in s['items']], 304, 92, 16, 1664, lambda ok: ('ok' if ok else 'err', 'Иә' if ok else 'Жоқ'))
    if s.get('quote'):
        q = s['quote']
        pg.text(128, 860, 1664, 110, [('«' + q['text'] + '»', {'bold': True}), ('\n— ' + q['by'], {'color': 'ink3', 'size': 24})], 30, color='ink2')


def walkers(pg, x, y, size):
    k = size / 700
    P = lambda a, b: (x + a * k, y + b * k)
    pg.rect(x, y, size, size, C['card'], r=28)
    grid(pg, x + 6, y + 6, size - 12, size - 12, 50 * k, x, y)
    # мектеп
    pg.rect(*P(94, 480), 112 * k, 80 * k, C['ink'], r=8)
    pg.poly([P(80, 482), P(150, 430), P(220, 482)], C['ink'])
    pg.rect(*P(136, 526), 28 * k, 34 * k, C['card'], r=0)
    pg.text(*P(50, 580), 200 * k, 40 * k, 'Мектеп', 28 * k, bold=True, align='c')
    g = pg.group(); G = g.shapes
    pg.text(*P(528, 482), 124 * k, 76 * k, 'Дүкен', 30 * k, color='FFFFFF', bold=True, align='c', anchor='m', fill=C['sca'], r=12, into=G)
    pg.oval(*P(126, 110), 68 * k, C['vec'], into=G)
    pg.oval(*P(172, 100), 80 * k, C['vec'], into=G)
    pg.rect(*P(144, 130), 12 * k, 40 * k, C['ink'], r=0, into=G)
    pg.text(*P(220, 80), 200 * k, 40 * k, 'Саябақ', 30 * k, bold=True, into=G)
    pg.line(*P(212, 520), *P(516, 520), C['sca'], 12 * k, into=G)
    pg.line(*P(150, 456), *P(150, 176), C['vec'], 12 * k, into=G)
    pg.text(*P(300, 534), 140 * k, 44 * k, '100 м', 34 * k, bold=True, align='c', into=G)
    pg.text(*P(176, 300), 140 * k, 44 * k, '100 м', 34 * k, bold=True, into=G)
    return g


def s_problem(pg, s, D):
    head(pg, s)
    pg.text(128, 250, 1000, 180, s['lead'], 46, spacing=1.05)
    t = pg.text(128, 450, 1000, 140, s['twist'], 46, spacing=1.05)
    a = pg.text(128, 620, 1000, 150, s['ask'], 58, color='accent', bold=True, spacing=0.95)
    n = pg.text(128, 800, 1000, 70, s.get('note', ''), 40, color='accent', italic=True) if s.get('note') else None
    g = walkers(pg, 1170, 240, 640)
    pg.click(t, g)
    pg.click(a, *( [n] if n else []))


def arrow_icon(pg, x, y, deg, into):
    import math
    cx, cy, L = x + 70, y + 26, 54
    dx, dy = math.cos(math.radians(deg)) * L, math.sin(math.radians(deg)) * L
    pg.line(cx - dx, cy - dy, cx + dx, cy + dy, C['vec'], 7, arrow=True, into=into)


def s_compare(pg, s, D):
    head(pg, s)
    for k, c in enumerate([s['left'], s['right']]):
        x = 128 + k * (829 + 6 + 0) + (0 if k == 0 else 0)
        x = 128 if k == 0 else 1000
        g = pg.group(); G = g.shapes
        pg.rect(x, 270, 792, 640, C['card'], r=28, into=G)
        pg.text(x + 48, 304, 700, 80, c['name'], 60, color='vec' if k else 'sca', bold=True, into=G)
        pg.text(x + 48, 392, 700, 110, c['def'], 32, color='ink2', into=G)
        for i, e in enumerate(c['ex']):
            yy = 528 + i * 70
            pg.text(x + 48, yy, 200, 56, str(e[0]), 34, bold=True, into=G)
            if k:
                arrow_icon(pg, x + 250, yy, float(e[2] if len(e) > 2 else 0), G)
                pg.text(x + 420, yy, 340, 56, str(e[1]), 34, into=G)
            else:
                pg.text(x + 260, yy, 480, 56, str(e[1]), 34, into=G)
        pg.click(g)
    if s.get('note'):
        pg.click(pg.text(128, 930, 1664, 60, s['note'], 36, color='accent', italic=True, bold=True))


def vecadd(pg, x, y, W, H):
    k = W / 900
    P = lambda a, b: (x + a * k, y + b * k)
    pg.rect(x, y, W, H, C['card'], r=28)
    grid(pg, x + 6, y + 6, W - 12, H - 12, 60 * k, x, y)
    pg.line(*P(60, 460), *P(316, 360), C['vec'], 9 * k, arrow=True)
    pg.line(*P(320, 358), *P(406, 128), C['sca'], 9 * k, arrow=True)
    pg.line(*P(60, 460), *P(404, 124), C['accent'], 9 * k, arrow=True, dash='dash')
    pg.text(*P(150, 410), 60 * k, 50 * k, 'a', 40 * k, color='vec', bold=True, italic=True)
    pg.text(*P(380, 240), 60 * k, 50 * k, 'b', 40 * k, color='sca', bold=True, italic=True)
    pg.text(*P(120, 220), 160 * k, 50 * k, 'a + b', 40 * k, color='accent', bold=True, italic=True)
    pg.line(*P(560, 480), *P(860, 480), C['ink'], 4 * k)
    pg.line(*P(600, 460), *P(770, 162), C['vec'], 9 * k, arrow=True)
    pg.line(*P(772, 160), *P(772, 480), C['ink'], 3 * k, dash='dash')
    pg.line(*P(600, 480), *P(772, 480), C['sca'], 12 * k)
    pg.text(*P(660, 270), 60 * k, 50 * k, 's', 40 * k, color='vec', bold=True, italic=True)
    pg.text(*P(660, 494), 80 * k, 50 * k, 'sₓ', 36 * k, color='sca', bold=True, italic=True)
    pg.text(*P(838, 488), 40 * k, 44 * k, 'x', 32 * k, bold=True)


def s_picture(pg, s, D):
    head(pg, s)
    vecadd(pg, 128, 270, 860, 535)
    for i, t in enumerate(s['items']):
        g = pg.group()
        num(pg, 1060, 290 + i * 150, '?', into=g.shapes)
        pg.text(1150, 290 + i * 150, 640, 130, t, 36, into=g.shapes)
        pg.click(g)
    if s.get('note'):
        pg.text(1060, 760, 730, 60, s['note'], 38, color='accent', italic=True, bold=True)


def qr(pg, uri, x, y, label):
    pg.rect(x, y, 420, 470, 'FFFFFF', r=28, line=C['grid'], lw=2)
    pg.picture(uri, x + 40, y + 30, 340, 340)
    pg.text(x + 20, y + 390, 380, 60, label, 22, color='ink2', bold=True, align='c')


def s_link(pg, s, D):
    head(pg, s)
    for i, t in enumerate(s['items']):
        num(pg, 128, 300 + i * 130, str(i + 1))
        pg.text(228, 304 + i * 130, 1050, 110, t, 40)
    if s.get('qr'):
        qr(pg, s['qr'], 1372, 280, s['url'].replace('https://', ''))
    else:
        pg.text(128, 720, 1200, 50, s['url'], 30, color='accent')


def s_vectors(pg, s, D):
    head(pg, s)
    groups = vector_grid(pg, 128, 260, 1000, 720, s['scale'], s['vectors'])
    xx = 1180
    y = 270
    if s.get('chain'):
        pg.text(xx, y, 620, 140, '  →  '.join(s['chain']), 24, color='ink2', bold=True)
        y += 150
    pg.text(xx, y, 620, 170, s['task'], 34)
    y += 190
    for i, (ln, tx, wipe) in enumerate(groups):
        v = s['vectors'][i]
        g = pg.group()
        num(pg, xx, y + i * 120, str(i + 1), fill='sca' if i % 2 else 'vec', into=g.shapes)
        pg.text(xx + 90, y + i * 120 + 6, 540, 100, f"{v['name']} = {v['mag']} {s['scale']['unit']}\n→ {int(v['mag'] / s['scale']['cell'])} тор {DIRS[v['dir']]}", 32, into=g.shapes)
        pg.click((ln, wipe), (tx, 'fade'), (g, 'fade'))


def s_break(pg, s, D):
    head(pg, s)
    for i, (a, b) in enumerate(s['rules']):
        x = 128 + i * 852
        pg.rect(x, 270, 812, 180, C['ok'] if i == 0 else C['err'], r=28)
        pg.text(x + 44, 296, 720, 64, a, 44, color='FFFFFF', bold=True)
        pg.text(x + 44, 370, 720, 56, b, 36, color='FFFFFF')
    for i, t in enumerate(s['items']):
        num(pg, 128, 520 + i * 120, str(i + 1))
        pg.text(228, 526 + i * 120, 1500, 70, t, 38)


def level_cards(pg, items, y, h, hw=False, click=True):
    cols = [C['ok'], C['vec'], C['sca']]
    for i, (k, t) in enumerate(items):
        x = 128 + i * 568
        g = pg.group(); G = g.shapes
        pg.rect(x, y, 528, h, C['card'], r=28, into=G)
        pg.text(x + 44, y + 36, 200, 130, k, 110, color=cols[i % 3], bold=True, into=G)
        if hw:
            pg.text(x + 44, y + 180, 440, h - 210, t, 34, into=G)
        else:
            pg.text(x + 44, y + 180, 440, 60, f'{k} деңгейі', 40, bold=True, into=G)
            pg.text(x + 44, y + 245, 440, 60, t, 34, color='ink2', into=G)
        if click:
            pg.click(g)


def s_levels(pg, s, D):
    head(pg, s)
    level_cards(pg, s['items'], 290, 420)
    if s.get('note'):
        pg.text(128, 760, 1664, 60, s['note'], 40, color='accent', italic=True, bold=True)


def s_sort(pg, s, D):
    head(pg, s)
    for i, (t, k) in enumerate(s['items']):
        x, y = 128 + (i % 4) * 424, 290 + (i // 4) * 250
        pg.text(x, y, 392, 220, t, 42, bold=True, align='c', anchor='m', fill=C['card'], r=28)
        col = C['sca'] if k == 's' else C['vec']
        b = pg.text(x, y, 392, 220, [('Скаляр' if k == 's' else 'Векторлық', {'bold': True}), ('\n' + ('тек сан мәні' if k == 's' else 'сан + бағыт'), {'size': 26})], 40,
                    color='FFFFFF', align='c', anchor='m', fill=col, r=28)
        pg.click(b)
    pg.oval(146, 830, 32, C['sca']); pg.text(176, 810, 260, 44, 'Скаляр', 32, color='ink2')
    pg.oval(436, 830, 32, C['vec']); pg.text(466, 810, 300, 44, 'Векторлық', 32, color='ink2')


def track(pg, x, y, W, H):
    k = W / 1080
    P = lambda a, b: (x + a * k, y + b * k)
    pg.rect(x, y, W, H, C['card'], r=28)
    pg.rect(*P(60, 100), 960 * k, 500 * k, None, r=250 * k, line=C['grid'], lw=70 * k)
    pg.rect(*P(532, 550), 16 * k, 100 * k, C['ink'], r=0)
    pg.text(*P(565, 530), 300 * k, 44 * k, 'Старт · Мәре', 30 * k, bold=True)
    pg.oval(*P(540, 600), 48 * k, C['accent'], line=C['card'], lw=6 * k)
    trail = pg.rect(*P(60, 100), 960 * k, 500 * k, None, r=250 * k, line=C['sca'], lw=12 * k)
    res = pg.group(); G = res.shapes
    pg.text(*P(300, 270), 400 * k, 50 * k, 'Жол', 34 * k, color='sca', bold=True, into=G)
    pg.text(*P(300, 320), 400 * k, 90 * k, '400 м', 72 * k, color='sca', bold=True, into=G)
    pg.text(*P(610, 270), 400 * k, 50 * k, 'Орын ауыстыру', 34 * k, color='vec', bold=True, into=G)
    pg.text(*P(610, 320), 400 * k, 90 * k, '0 м', 72 * k, color='vec', bold=True, into=G)
    return trail, res


def s_task(pg, s, D):
    head(pg, s)
    pg.text(128, 250, 300, 130, s['level'], 110, color='accent', bold=True)
    pg.text(128, 400, 680, 360, s['q'], 38, spacing=1.05)
    ans = pg.text(128, 790, 680, 170, [('Жауабы\n', {'size': 24}), (s['answer'], {'bold': True})], 34, color='on', fill=C['accent'], r=28, anchor='m')
    ans.text_frame.margin_left = ans.text_frame.margin_right = px(32)
    if s.get('illus') == 'track':
        trail, res = track(pg, 860, 250, 932, 621)
        pg.click(ans, (trail, 'fade'), (res, 'fade'))
    elif s.get('vectors'):
        groups = vector_grid(pg, 860, 250, 932, 671, s['scale'], s['vectors'])
        eff = [ans]
        for ln, tx, wipe in groups:
            eff += [(ln, wipe), (tx, 'fade')]
        pg.click(*eff)
    else:
        pg.click(ans)


def s_qa(pg, s, D):
    head(pg, s)
    rows_with_pills(pg, s['items'], 290, 110, 22, 1180, lambda a: ('accent', a))
    if s.get('qr'):
        qr(pg, s['qr'], 1372, 280, 'Socrative')


def s_reflect(pg, s, D):
    head(pg, s)
    for i, (a, b) in enumerate(s['fingers']):
        y = 290 + i * 116
        num(pg, 128, y, str(i + 1), fill='sca' if i % 2 else 'vec')
        pg.text(222, y + 6, 330, 60, a, 34, bold=True)
        pg.text(540, y + 6, 450, 60, b, 34, color='ink2')
    cols = [C['ok'], C['vec'], C['warn'], C['err']]
    for i, (a, b) in enumerate(s['scale']):
        y = 290 + i * 130
        pg.rect(1080, y, 712, 110, cols[i], r=24)
        pg.text(1116, y, 300, 110, a + ' балл', 34, color='FFFFFF', bold=True, anchor='m')
        pg.text(1400, y, 360, 110, b, 34, color='FFFFFF', align='r', anchor='m')


def s_homework(pg, s, D):
    head(pg, s)
    level_cards(pg, s['items'], 290, 560, hw=True, click=False)


def s_end(pg, s, D):
    title_art(pg, 820, 140, 280)
    pg.text(160, 450, 1600, 260, s['title'], 88, bold=True, align='c', spacing=0.95)
    if s.get('quote'):
        q = s['quote']
        pg.text(260, 740, 1400, 150, [('«' + q['text'] + '»', {'bold': True}), ('\n— ' + q['by'], {'color': 'ink3', 'size': 30})], 42, align='c')


T = dict(title=s_title, goals=s_goals, yesno=s_yesno, problem=s_problem, compare=s_compare, picture=s_picture, link=s_link,
         vectors=s_vectors, **{'break': s_break}, levels=s_levels, sort=s_sort, task=s_task, qa=s_qa, reflect=s_reflect, homework=s_homework, end=s_end)


def build(deck_path, out):
    D = json.load(open(deck_path, encoding='utf-8'))
    prs = Presentation()
    prs.slide_width, prs.slide_height = px(1920), px(1080)
    prs.core_properties.title = D['topic']
    prs.core_properties.author = 'Сабақтас'
    for n, s in enumerate(D['slides'], 1):
        pg = Page(prs)
        T[s['t']](pg, s, D)
        if s['t'] not in ('title', 'end'):
            foot(pg, D['topic'], n)
        got = len(pg.clicks)
        assert got == steps_of(s), f"{n}-слайд: {got} басу, тақтада {steps_of(s)}"
        pg.transition(); pg.timing()
    prs.save(out)
    print('ok', out, len(D['slides']), 'слайд')


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
