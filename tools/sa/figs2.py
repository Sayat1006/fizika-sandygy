"""8–11-сыныптарға қосымша сызбалар (figs.py стилінде)."""
import math
from figs import svg, text, line, arrow, rect, num, graph, INK, MUTED, BLUE, RED, GREEN, WATER


# ── электр тізбектері ──
def _res(x, y, lab, vertical=False):
    if vertical: return rect(x - 11, y - 28, 22, 56, '#fff') + text(x + 22, y + 5, lab, 15, 'start', italic=True)
    return rect(x - 30, y - 11, 60, 22, '#fff') + text(x, y - 18, lab, 15, italic=True)


def _meter(x, y, s):
    return f"<circle cx='{x}' cy='{y}' r='17' fill='#fff' stroke='{INK}' stroke-width='1.8'/>" + text(x, y + 6, s, 17, bold=True)


def _bat(x, y, lab='', vertical=False):
    if vertical:
        return f"<rect x='{x - 20}' y='{y - 8}' width='40' height='16' fill='#fff' stroke='none'/>" + line(x - 18, y - 5, x + 18, y - 5, INK, 2) + line(x - 9, y + 5, x + 9, y + 5, INK, 4) + text(x + 26, y + 5, lab, 15, 'start', italic=True)
    return f"<rect x='{x - 8}' y='{y - 20}' width='16' height='40' fill='#fff' stroke='none'/>" + line(x - 5, y - 18, x - 5, y + 18, INK, 2) + line(x + 5, y - 9, x + 5, y + 9, INK, 4) + text(x, y - 26, lab, 15, italic=True)


def circuit(kind, R=('R₁', 'R₂', 'R₃'), bat='', A=True, V=None):
    """kind: series | parallel | mixed | emf. V: қай резистор/элементке вольтметр ('R₁', 'bat')"""
    W, H = 460, 300; L, T, Rr, Bm = 60, 60, 400, 240
    b = ''
    if kind == 'series':
        b += line(L, T, Rr, T) + line(Rr, T, Rr, Bm) + line(Rr, Bm, L, Bm) + line(L, Bm, L, T)
        b += _bat(230, T, bat) + _res(170, Bm, R[0]) + _res(300, Bm, R[1])
        if A: b += _meter(L, 150, 'A')
        if V == R[0]: b += line(130, Bm, 130, Bm + 40) + line(210, Bm, 210, Bm + 40) + line(130, Bm + 40, 150, Bm + 40) + line(190, Bm + 40, 210, Bm + 40) + _meter(170, Bm + 40, 'V'); H = 310
    elif kind == 'parallel':
        b += line(L, T, Rr, T) + line(L, T, L, Bm) + line(Rr, T, Rr, Bm) + line(L, Bm, 140, Bm) + line(320, Bm, Rr, Bm)
        b += line(140, Bm - 50, 140, Bm + 40) + line(320, Bm - 50, 320, Bm + 40) + line(140, Bm - 50, 320, Bm - 50) + line(140, Bm + 40, 320, Bm + 40)
        b += _res(230, Bm - 50, R[0]) + _res(230, Bm + 40, R[1]) + _bat(230, T, bat)
        if A: b += _meter(L, 150, 'A')
        H = 310
    elif kind == 'mixed':
        b += line(L, T, Rr, T) + line(L, T, L, Bm) + line(Rr, T, Rr, Bm) + line(L, Bm, 210, Bm)
        b += line(210, Bm - 45, 210, Bm + 45) + line(360, Bm - 45, 360, Bm + 45) + line(210, Bm - 45, 360, Bm - 45) + line(210, Bm + 45, 360, Bm + 45) + line(360, Bm, Rr, Bm)
        b += _res(130, Bm, R[0]) + _res(285, Bm - 45, R[1]) + _res(285, Bm + 45, R[2]) + _bat(230, T, bat)
        if A: b += _meter(L, 150, 'A')
        H = 310
    elif kind == 'emf':
        b += line(L, T, Rr, T) + line(Rr, T, Rr, Bm) + line(Rr, Bm, L, Bm) + line(L, Bm, L, T)
        b += _bat(230, T, bat) + _res(230, Bm, R[0])
        if A: b += _meter(Rr, 150, 'A')
        if V == 'bat': b += line(180, T, 180, T - 40) + line(280, T, 280, T - 40) + line(180, T - 40, 213, T - 40) + line(247, T - 40, 280, T - 40) + _meter(230, T - 40, 'V')
    return svg(W, H, b.replace("<svg", ''))


def capacitors(kind, labs=('C₁', 'C₂')):
    def cap(x, y, lab):
        return f"<rect x='{x - 8}' y='{y - 22}' width='16' height='44' fill='#fff'/>" + line(x - 6, y - 20, x - 6, y + 20, INK, 3) + line(x + 6, y - 20, x + 6, y + 20, INK, 3) + text(x, y - 28, lab, 15, italic=True)
    b = ''
    if kind == 'series':
        b += line(40, 100, 380, 100) + cap(160, 100, labs[0]) + cap(260, 100, labs[1])
    else:
        b += line(40, 110, 120, 110) + line(300, 110, 380, 110) + line(120, 60, 120, 160) + line(300, 60, 300, 160) + line(120, 60, 300, 60) + line(120, 160, 300, 160) + cap(210, 60, labs[0]) + cap(210, 160, labs[1])
    b += f"<circle cx='40' cy='{100 if kind == 'series' else 110}' r='5' fill='{INK}'/><circle cx='380' cy='{100 if kind == 'series' else 110}' r='5' fill='{INK}'/>"
    return svg(420, 200, b)


# ── жылу ──
def thermometer(t, tmin=-10, tmax=50, step=10, minor=2):
    X, Y0, Y1 = 90, 310, 40; per = (Y0 - Y1) / (tmax - tmin)
    b = rect(X - 9, Y1 - 14, 18, Y0 - Y1 + 30, '#f7fafc', INK, 1.6, 9) + f"<circle cx='{X}' cy='{Y0 + 26}' r='18' fill='{RED}' stroke='{INK}' stroke-width='1.6'/>"
    b += rect(X - 3.5, Y0 - (t - tmin) * per, 7, (t - tmin) * per + 14, RED, RED, 0)
    for v in range(tmin, tmax + 1, minor):
        y = Y0 - (v - tmin) * per; big = v % step == 0
        b += line(X + 12, y, X + 12 + (16 if big else 8), y, INK, 1.2 if big else .8)
        if big: b += text(X + 36, y + 5, str(v), 13, 'start')
    b += text(X + 36, Y1 - 20, '°C', 13, 'start')
    return svg(200, Y0 + 52, b)


def heat_engine(Q1, Q2):
    b = rect(140, 20, 160, 50, '#ffe2dc', INK, 1.6, 10) + text(220, 52, 'Қыздырғыш T₁', 15)
    b += f"<circle cx='220' cy='150' r='36' fill='#eef2f7' stroke='{INK}' stroke-width='1.6'/>" + text(220, 155, 'Жұмыс', 14) + text(220, 172, 'денесі', 14)
    b += rect(140, 230, 160, 50, '#dcebff', INK, 1.6, 10) + text(220, 262, 'Суытқыш T₂', 15)
    b += arrow(220, 72, 220, 112, RED, 2.6) + text(232, 98, f'Q₁ = {Q1} кДж', 15, 'start', RED)
    b += arrow(220, 188, 220, 228, BLUE, 2.6) + text(232, 214, f'Q₂ = {Q2} кДж', 15, 'start', BLUE)
    b += arrow(258, 150, 340, 150, GREEN, 2.6) + text(346, 155, 'A', 17, 'start', GREEN, italic=True, bold=True)
    return svg(420, 300, b)


def piston(p_kpa, V1, V2):
    b = f"<path d='M60,40 L60,240 L300,240 L300,40' fill='none' stroke='{INK}' stroke-width='2.4'/>" + rect(62, 120, 236, 118, '#e8f0fa', 'none', 0)
    b += rect(62, 104, 236, 16, '#7c8796') + line(180, 104, 180, 40, INK, 4) + arrow(330, 160, 330, 90, GREEN, 2.2) + text(338, 128, 'ΔV', 15, 'start', GREEN, italic=True)
    b += text(180, 190, f'p = {p_kpa} кПа', 16) + text(180, 214, f'V: {num(V1)} → {num(V2)} л', 15, color=MUTED)
    return svg(400, 260, b)


# ── электр және магнит ──
def charges(q1, q2, r_cm):
    def c(x, q):
        col = RED if q > 0 else BLUE
        return f"<circle cx='{x}' cy='80' r='26' fill='{col}' fill-opacity='.15' stroke='{col}' stroke-width='2'/>" + text(x, 88, '+' if q > 0 else '−', 26, color=col, bold=True) + text(x, 130, f'q = {"+" if q > 0 else "−"}{num(abs(q))} нКл', 15)
    b = c(100, q1) + c(380, q2) + line(100, 160, 380, 160, MUTED, 1.2) + line(100, 152, 100, 168, MUTED) + line(380, 152, 380, 168, MUTED) + text(240, 182, f'r = {num(r_cm)} см', 15, color=MUTED)
    return svg(480, 200, b)


def wire_in_field(current_right=True, into=True):
    b = ''
    for i in range(5):
        for j in range(4):
            x, y = 70 + i * 70, 50 + j * 60
            b += (line(x - 7, y - 7, x + 7, y + 7, MUTED, 1.6) + line(x - 7, y + 7, x + 7, y - 7, MUTED, 1.6)) if into else f"<circle cx='{x}' cy='{y}' r='4' fill='{MUTED}'/><circle cx='{x}' cy='{y}' r='9' fill='none' stroke='{MUTED}' stroke-width='1.2'/>"
    b += line(30, 140, 390, 140, '#c08a3e', 6)
    b += arrow(150, 112, 270, 112, RED, 2.4) if current_right else arrow(270, 112, 150, 112, RED, 2.4)
    b += text(210, 102, 'I', 17, color=RED, italic=True, bold=True) + text(400, 40, 'B', 18, 'end', BLUE, italic=True, bold=True)
    return svg(420, 260, b)


def solenoid(front_down=True):
    b = ''
    for i in range(7):
        x = 110 + i * 32
        b += f"<ellipse cx='{x}' cy='120' rx='12' ry='52' fill='none' stroke='#c08a3e' stroke-width='3'/>"
    b += arrow(150, 60, 150, 94, RED, 2.4) if front_down else arrow(150, 94, 150, 60, RED, 2.4)
    b += text(136, 72, 'I', 17, 'end', RED, italic=True, bold=True) + text(60, 126, 'A', 18, bold=True) + text(370, 126, 'B', 18, bold=True)
    b += text(220, 200, 'тоқ катушканың алдыңғы бетінде көрсетілген', 13, color=MUTED)
    return svg(420, 215, b)


def magnet_coil(front='N', come=True):
    back = 'S' if front == 'N' else 'N'; cl = {'N': RED, 'S': BLUE}
    b = rect(40, 95, 70, 40, cl[back]) + rect(110, 95, 70, 40, cl[front]) + text(75, 122, back, 20, color='#fff', bold=True) + text(145, 122, front, 20, color='#fff', bold=True)
    b += arrow(190, 115, 236, 115, INK, 2.2) if come else arrow(236, 115, 190, 115, INK, 2.2)
    for i in range(6):
        b += f"<ellipse cx='{270 + i * 22}' cy='115' rx='9' ry='42' fill='none' stroke='#c08a3e' stroke-width='3'/>"
    b += line(270, 157, 270, 200) + line(380, 157, 380, 200) + line(270, 200, 300, 200) + line(350, 200, 380, 200) + f"<circle cx='325' cy='200' r='22' fill='#fff' stroke='{INK}' stroke-width='1.6'/>" + text(325, 206, 'G', 17, bold=True)
    return svg(440, 240, b)


# ── оптика ──
def mirror(alpha_surface):
    """шағылу: түскен сәуле айна бетімен alpha_surface градус бұрыш жасайды"""
    cx, cy = 220, 200
    b = line(60, cy, 380, cy, INK, 3) + ''.join(line(x, cy, x - 10, cy + 12, MUTED, 1) for x in range(66, 380, 14)) + line(cx, cy, cx, 50, MUTED, 1.2, '6 5')
    a = math.radians(alpha_surface); L = 170
    x0, y0 = cx - L * math.cos(a), cy - L * math.sin(a)
    b += arrow(x0, y0, cx, cy, RED, 2.4) + line(cx, cy, cx + L * math.cos(a), cy - L * math.sin(a), RED, 2.4)
    b += f"<path d='M{cx - 60},{cy} A60,60 0 0,1 {cx - 60 * math.cos(a):.1f},{cy - 60 * math.sin(a):.1f}' fill='none' stroke='{INK}' stroke-width='1.4'/>" + text(cx - 78, cy - 14, f'{alpha_surface}°', 15)
    return svg(440, 230, b)


def refraction(alpha, n1='ауа', n2='шыны'):
    cx, cy = 220, 150
    b = rect(40, cy, 360, 120, '#e3f0fb', 'none', 0) + line(40, cy, 400, cy, INK, 2) + line(cx, 30, cx, 270, MUTED, 1.2, '6 5')
    a = math.radians(alpha); L = 130
    b += arrow(cx - L * math.sin(a), cy - L * math.cos(a), cx, cy, RED, 2.4)
    b += f"<path d='M{cx},{cy - 50} A50,50 0 0,0 {cx - 50 * math.sin(a):.1f},{cy - 50 * math.cos(a):.1f}' fill='none' stroke='{INK}' stroke-width='1.3'/>" + text(cx - 26, cy - 58, f'{alpha}°', 15)
    b += text(60, cy - 14, n1, 15, 'start', MUTED) + text(60, cy + 26, n2, 15, 'start', MUTED)
    return svg(440, 290, b)


def lens(F_cm, d_cm, h_cm=2, conv=True, scale=6):
    """жұқа линза: бас оптикалық ось, F және 2F, дене (бағыттама) d қашықтықта"""
    W, cx, cy = 560, 280, 140; k = scale
    b = line(20, cy, W - 20, cy, INK, 1.4) + line(cx, 30, cx, 250, BLUE, 3)
    b += (f"<polygon points='{cx},26 {cx - 8},40 {cx + 8},40' fill='{BLUE}'/><polygon points='{cx},254 {cx - 8},240 {cx + 8},240' fill='{BLUE}'/>" if conv else
          f"<polygon points='{cx - 8},26 {cx + 8},26 {cx},40' fill='{BLUE}'/><polygon points='{cx - 8},254 {cx + 8},254 {cx},240' fill='{BLUE}'/>")
    for s_ in (-2, -1, 1, 2):
        x = cx + s_ * F_cm * k
        if 20 < x < W - 20: b += line(x, cy - 6, x, cy + 6, INK, 2) + text(x, cy + 24, ('2F' if abs(s_) == 2 else 'F'), 14, italic=True)
    xo = cx - d_cm * k
    b += arrow(xo, cy, xo, cy - h_cm * k * 4, RED, 2.6) + text(xo, cy - h_cm * k * 4 - 8, 'AB', 14, color=RED, italic=True)
    b += text(W - 30, 30, f'F = {num(F_cm)} см', 14, 'end', MUTED) + text(W - 30, 50, f'd = {num(d_cm)} см', 14, 'end', MUTED)
    return svg(W, 270, b)


def grating(k_max=2):
    b = line(60, 40, 60, 240, INK, 3) + ''.join(line(56, y, 64, y, INK, 2) for y in range(46, 240, 10)) + line(400, 30, 400, 250, INK, 2)
    b += ''.join(arrow(10, y, 54, y, '#f0b429', 1.6, 7) for y in (90, 140, 190))
    for k in range(-k_max, k_max + 1):
        y = 140 - k * 46
        b += line(64, 140, 398, y, '#f0b42966', 1.2) + f"<circle cx='400' cy='{y}' r='6' fill='#e5683a'/>" + text(414, y + 5, f'k = {k}', 13, 'start')
    b += text(60, 268, 'тор', 13, color=MUTED) + text(400, 268, 'экран', 13, color=MUTED)
    return svg(470, 280, b)


# ── механика ──
def orbit(labels=('A', 'B')):
    a, bb, cx, cy = 170, 100, 220, 130; c = (a * a - bb * bb) ** .5
    s = f"<ellipse cx='{cx}' cy='{cy}' rx='{a}' ry='{bb}' fill='none' stroke='{MUTED}' stroke-width='1.6' stroke-dasharray='6 4'/>"
    s += f"<circle cx='{cx - c:.1f}' cy='{cy}' r='18' fill='#ffc21f' stroke='#e0a000'/>" + text(cx - c, cy + 40, 'Күн', 13, color=MUTED)
    s += f"<circle cx='{cx - a}' cy='{cy}' r='9' fill='#5aa0e0'/>" + text(cx - a - 14, cy + 5, labels[0], 16, 'end', bold=True)
    s += f"<circle cx='{cx + a}' cy='{cy}' r='9' fill='#5aa0e0'/>" + text(cx + a + 14, cy + 5, labels[1], 16, 'start', bold=True)
    return svg(460, 260, s)


def atwood(m1, m2):
    b = f"<circle cx='200' cy='60' r='34' fill='#eef2f7' stroke='{INK}' stroke-width='2'/>" + line(200, 10, 200, 26, INK, 3) + line(140, 10, 260, 10, INK, 4)
    b += line(166, 60, 166, 200) + line(234, 60, 234, 160)
    b += rect(141, 200, 50, 50, '#9aa4b2') + text(166, 231, f'{m1} кг', 13) + rect(209, 160, 50, 50, '#c99d6b') + text(234, 191, f'{m2} кг', 13)
    b += text(120, 230, 'm₁', 16, 'end', italic=True) + text(280, 190, 'm₂', 16, 'start', italic=True)
    return svg(400, 270, b)


def carts(m1, v1, m2, v2):
    def cart(x, m, v, col):
        s = rect(x, 80, 110, 50, col, INK, 1.6, 6) + f"<circle cx='{x + 25}' cy='138' r='10' fill='{INK}'/><circle cx='{x + 85}' cy='138' r='10' fill='{INK}'/>" + text(x + 55, 111, f'{m} кг', 15)
        if v: s += (arrow(x + 55, 60, x + 55 + (60 if v > 0 else -60), 60, RED, 2.4) + text(x + 55 + (30 if v > 0 else -30), 50, f'{num(abs(v))} м/с', 14, color=RED))
        return s
    b = line(20, 148, 520, 148, INK, 2) + cart(60, m1, v1, '#dfe8f5') + cart(330, m2, v2, '#f5e6d8')
    return svg(540, 170, b)


def beam(Lm, xload, P):
    """жеңіл арқалық екі тірекке (ұштарында) қойылған, xload м қашықтықта P Н жүк"""
    k = 380 / Lm; x0 = 60
    b = rect(x0, 100, Lm * k, 14, '#c99d6b') + f"<polygon points='{x0},114 {x0 - 14},144 {x0 + 14},144' fill='#9aa4b2' stroke='{INK}'/><polygon points='{x0 + Lm * k},114 {x0 + Lm * k - 14},144 {x0 + Lm * k + 14},144' fill='#9aa4b2' stroke='{INK}'/>"
    xl = x0 + xload * k
    b += arrow(xl, 30, xl, 98, RED, 2.6) + text(xl + 8, 50, f'{P} Н', 15, 'start', RED)
    b += text(x0 - 8, 170, 'A', 16, bold=True) + text(x0 + Lm * k + 8, 170, 'B', 16, bold=True)
    b += line(x0, 190, xl, 190, MUTED) + text((x0 + xl) / 2, 208, f'{num(xload)} м', 14, color=MUTED) + line(x0, 222, x0 + Lm * k, 222, MUTED) + text(x0 + Lm * k / 2, 240, f'{num(Lm)} м', 14, color=MUTED)
    return svg(520, 250, b)


def pipe(d1, d2):
    b = f"<path d='M30,60 L200,60 L260,{100 - d2 * 4} L420,{100 - d2 * 4} L420,{100 + d2 * 4} L260,{100 + d2 * 4} L200,140 L30,140 Z' fill='{WATER}' stroke='{INK}' stroke-width='2'/>"
    b += arrow(60, 100, 150, 100, BLUE, 2.4) + text(105, 90, 'υ₁', 16, italic=True) + arrow(300, 100, 390, 100, BLUE, 2.4) + text(345, 90, 'υ₂', 16, italic=True)
    b += text(110, 165, f'S₁ = {num(d1)} см²', 15) + text(340, 165, f'S₂ = {num(d2)} см²', 15)
    return svg(450, 180, b)


def levels(E):
    """энергия деңгейлері: E = [(n, eV)], көрсеткіш — n=3→1 және 2→1 ауысулары"""
    lo, hi = min(e for _, e in E), max(e for _, e in E); k = 220 / (hi - lo or 1)
    b = ''
    for n_, e in E:
        y = 250 - (e - lo) * k
        b += line(80, y, 360, y, INK, 2) + text(70, y + 5, f'n = {n_}', 14, 'end') + text(370, y + 5, f'{num(e)} эВ', 14, 'start', MUTED)
    ys = {n_: 250 - (e - lo) * k for n_, e in E}
    b += arrow(180, ys[3], 180, ys[1], RED, 2.2) + text(170, (ys[3] + ys[1]) / 2, '1', 15, 'end', RED, bold=True)
    b += arrow(260, ys[2], 260, ys[1], BLUE, 2.2) + text(250, (ys[2] + ys[1]) / 2, '2', 15, 'end', BLUE, bold=True)
    return svg(460, 270, b)


def transformer(N1, N2):
    b = rect(130, 40, 200, 180, 'none', '#7c8796', 18) + ''.join(f"<ellipse cx='130' cy='{70 + i * 20}' rx='26' ry='7' fill='none' stroke='#c08a3e' stroke-width='3'/>" for i in range(7))
    b += ''.join(f"<ellipse cx='330' cy='{80 + i * 30}' rx='26' ry='7' fill='none' stroke='#c08a3e' stroke-width='3'/>" for i in range(5))
    b += text(70, 135, f'N₁ = {N1}', 15, 'end') + text(390, 135, f'N₂ = {N2}', 15, 'start')
    return svg(480, 260, b)


def sinus(A, T, cycles=2, xl='t, с', yl='x, см', unit_x=None, n_pts=80, phase=0.0, kind='sin'):
    f = math.sin if kind == 'sin' else math.cos
    pts = [(cycles * T * i / n_pts, A * f(2 * math.pi * (cycles * T * i / n_pts) / T + phase)) for i in range(n_pts + 1)]
    W, H, L, B, R, Tp = 460, 280, 60, 140, 430, 26
    sx, sy = (R - L) / (cycles * T), (B - Tp - 4) / A
    s = ''
    nx = int(cycles * 4)
    for i in range(nx + 1):
        x = L + i * T / 4 * sx; s += line(x, Tp, x, 2 * B - Tp, '#d5dbe3', 1) + text(x, B + 18 if i else B + 18, num(i * T / 4), 12)
    for j in (-1, 0, 1):
        y = B - j * A * sy; s += line(L, y, R, y, '#d5dbe3', 1) + text(L - 8, y + 5, num(j * A), 12, 'end')
    s += arrow(L, B, R + 16, B, INK, 1.4, 8) + arrow(L, 2 * B - Tp, L, Tp - 12, INK, 1.4, 8) + text(R + 14, B + 34, xl, 14, 'end', italic=True) + text(L + 8, Tp - 4, yl, 14, 'start', italic=True)
    s += "<polyline points='" + ' '.join(f'{L + x * sx:.1f},{B - y * sy:.1f}' for x, y in pts) + f"' fill='none' stroke='{BLUE}' stroke-width='2.6'/>"
    return svg(W, H, s)


def table_fig(head, rows, w=460):
    """кесте сурет ретінде (өлшеу нәтижелері)"""
    cw = w / len(head); h = 34 * (len(rows) + 1) + 4
    b = ''
    for j, hd in enumerate(head):
        b += rect(2 + j * cw, 2, cw, 34, '#eef2f7') + text(2 + j * cw + cw / 2, 25, hd, 14, bold=True)
    for i, r in enumerate(rows, 1):
        for j, c in enumerate(r): b += rect(2 + j * cw, 2 + i * 34, cw, 34) + text(2 + j * cw + cw / 2, 25 + i * 34, c, 14)
    return svg(int(w + 4), h, b)
