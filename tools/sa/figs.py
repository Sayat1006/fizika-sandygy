"""БЖБ/ТЖБ сызбалары: SVG (қара-сұр сызық, баспаға арналған). Әр функция толық <svg> қайтарады.
PNG-ге tools/sa/svg2png.js айналдырады (Playwright, 3× сапа)."""
import math

INK, MUTED, BLUE, RED, GREEN, WATER = '#1b2230', '#6b7380', '#1f6fd0', '#d23c30', '#178a50', '#bcdcf6'
FONT = "font-family='Times New Roman,serif'"


def svg(w, h, body):
    return f"<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}'><rect width='{w}' height='{h}' fill='#fff'/>{body}</svg>"


def text(x, y, s, size=15, anchor='middle', color=INK, italic=False, bold=False):
    st = (" font-style='italic'" if italic else '') + (" font-weight='bold'" if bold else '')
    return f"<text x='{x:.1f}' y='{y:.1f}' font-size='{size}' text-anchor='{anchor}' fill='{color}' {FONT}{st}>{s}</text>"


def line(x1, y1, x2, y2, c=INK, w=1.6, dash=None):
    d = f" stroke-dasharray='{dash}'" if dash else ''
    return f"<line x1='{x1:.1f}' y1='{y1:.1f}' x2='{x2:.1f}' y2='{y2:.1f}' stroke='{c}' stroke-width='{w}'{d}/>"


def arrow(x1, y1, x2, y2, c=INK, w=2.2, head=10):
    a = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 - head * math.cos(a - .4), y2 - head * math.sin(a - .4)); p2 = (x2 - head * math.cos(a + .4), y2 - head * math.sin(a + .4))
    return line(x1, y1, x2 - head * .6 * math.cos(a), y2 - head * .6 * math.sin(a), c, w) + f"<polygon points='{x2:.1f},{y2:.1f} {p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}' fill='{c}'/>"


def rect(x, y, w, h, fill='none', c=INK, sw=1.6, r=0):
    return f"<rect x='{x:.1f}' y='{y:.1f}' width='{w:.1f}' height='{h:.1f}' rx='{r}' fill='{fill}' stroke='{c}' stroke-width='{sw}'/>"


def num(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return s.replace('.', ',')


# ── өлшеу аспаптары ──
def ruler(obj_from, obj_to, length=10, div_per_cm=10, obj='pencil'):
    """сызғыш (см) және оның үстіндегі дене (obj_from…obj_to см)"""
    W, X0, k = 620, 40, 54
    b = rect(X0 - 10, 90, length * k + 20, 46, '#f7f2e3')
    for i in range(length * div_per_cm + 1):
        x = X0 + i * k / div_per_cm; big = i % div_per_cm == 0; mid = div_per_cm == 10 and i % 5 == 0
        b += line(x, 90, x, 90 + (20 if big else 14 if mid else 9), INK, 1.4 if big else .9)
        if big:
            b += text(x, 128, str(i // div_per_cm), 14)
    b += text(X0 + length * k + 14, 112, 'см', 13, 'start')
    x1, x2 = X0 + obj_from * k, X0 + obj_to * k
    if obj == 'pencil':
        b += f"<polygon points='{x1:.1f},62 {x1 + 22:.1f},50 {x2 - 10:.1f},50 {x2:.1f},56 {x2:.1f},68 {x2 - 10:.1f},74 {x1 + 22:.1f},74' fill='#f2c14e' stroke='{INK}' stroke-width='1.4'/>"
        b += f"<polygon points='{x1:.1f},62 {x1 + 22:.1f},50 {x1 + 22:.1f},74' fill='#e9d4a8' stroke='{INK}' stroke-width='1.2'/>"
    else:
        b += rect(x1, 46, x2 - x1, 32, '#c99d6b')
    b += line(x1, 78, x1, 92, MUTED, 1, '3 3') + line(x2, 78, x2, 92, MUTED, 1, '3 3')
    return svg(W, 150, b)


def cylinder(level, top=100, step=10, minor=2, body=None, label=True):
    """мензурка: шкала 0…top мл, бөлу құны step/minor; level — су деңгейі (мл); body — батырылған тас"""
    H, Y0, Y1, X = 330, 300, 40, 90
    per = (Y0 - Y1) / top
    b = f"<path d='M{X},{Y1 - 20} L{X},{Y0} Q{X},{Y0 + 12} {X + 12},{Y0 + 12} L{X + 78},{Y0 + 12} Q{X + 90},{Y0 + 12} {X + 90},{Y0} L{X + 90},{Y1 - 20}' fill='none' stroke='{INK}' stroke-width='1.8'/>"
    yl = Y0 - level * per
    b += f"<rect x='{X + 1}' y='{yl:.1f}' width='88' height='{Y0 + 11 - yl:.1f}' fill='{WATER}'/>" + line(X, yl, X + 90, yl, BLUE, 1.6)
    if body:
        b += f"<ellipse cx='{X + 45}' cy='{Y0 - 16}' rx='22' ry='15' fill='#8d8a84' stroke='{INK}' stroke-width='1.2'/>" + line(X + 45, Y1 - 30, X + 45, Y0 - 31, INK, 1)
    for v in range(0, top + 1, minor):
        y = Y0 - v * per; big = v % step == 0
        b += line(X + 90, y, X + 90 + (16 if big else 8), y, INK, 1.2 if big else .8)
        if big and label:
            b += text(X + 112, y + 5, str(v), 13, 'start')
    b += text(X + 112, Y1 - 24, 'мл', 13, 'start')
    return svg(260, H + 20, b)


def dynamometer(F, maxF=5, minor=0.2, body='cube'):
    """динамометр (Н), көрсеткіші F"""
    X, Y0, Y1 = 120, 40, 300
    per = (Y1 - Y0) / maxF
    b = rect(X - 32, 20, 64, Y1 - 20 + 24, '#f4f6f9', INK, 1.6, 8) + line(X, 6, X, 20, INK, 2)
    n = round(maxF / minor)
    for i in range(n + 1):
        v = i * minor; y = Y0 + v * per; big = abs(v - round(v)) < 1e-6
        b += line(X - 24, y, X - 24 + (16 if big else 9), y, INK, 1.2 if big else .8)
        if big:
            b += text(X + 14, y + 5, str(round(v)), 13, 'middle')
    yp = Y0 + F * per
    b += f"<polygon points='{X - 8},{yp} {X + 2},{yp - 6} {X + 2},{yp + 6}' fill='{RED}'/>" + line(X - 26, yp, X, yp, RED, 2)
    b += text(X + 26, Y0 - 6, 'Н', 13, 'start')
    b += line(X, Y1 + 4, X, Y1 + 40, INK, 1.6)
    b += rect(X - 26, Y1 + 40, 52, 46, '#9aa4b2') if body == 'cube' else f"<circle cx='{X}' cy='{Y1 + 64}' r='24' fill='#9aa4b2' stroke='{INK}' stroke-width='1.4'/>"
    return svg(240, Y1 + 100, b)


def balance(weights, obj='cube'):
    """тең иінді таразы: сол жақта дене, оң жақта гирлер (г)"""
    b = line(60, 70, 340, 70, INK, 3) + line(200, 70, 200, 200, INK, 3) + f"<polygon points='200,62 192,76 208,76' fill='{INK}'/>" + rect(150, 200, 100, 10, '#9aa4b2')
    for x in (90, 310):
        b += line(x, 70, x - 34, 140, MUTED, 1) + line(x, 70, x + 34, 140, MUTED, 1) + f"<path d='M{x - 46},140 Q{x},164 {x + 46},140 Z' fill='#dfe5ec' stroke='{INK}' stroke-width='1.4'/>"
    b += rect(70, 108, 40, 32, '#c99d6b') if obj == 'cube' else f"<ellipse cx='90' cy='124' rx='24' ry='16' fill='#8d8a84' stroke='{INK}' stroke-width='1.2'/>"
    x = 310 - (len(weights) - 1) * 13
    for w in weights:
        h = 14 + min(26, w ** .5 * 2.2)
        b += rect(x - 10, 140 - h, 20, h, '#c8a24a', INK, 1.2, 3) + text(x, 140 - h - 5, f'{w}', 15, bold=True)
        x += 26
    b += text(310, 186, 'гирлер, г', 15, color=MUTED)
    return svg(400, 220, b)


# ── графиктер ──
def graph(series, xmax, ymax, xstep, ystep, xl='t, с', yl='s, м', labels=None, w=440, h=310):
    """series: [[(x,y),…], …] — сынық сызықтар; labels: әр сызыққа белгі (I, II)"""
    L, B, R, T = 60, h - 54, w - 30, 24
    sx, sy = (R - L) / xmax, (B - T) / ymax
    b = ''
    for i in range(0, int(round(xmax / xstep)) + 1):
        x = L + i * xstep * sx; b += line(x, T, x, B, '#d5dbe3', 1) + text(x, B + 20, num(i * xstep), 13)
    for i in range(0, int(round(ymax / ystep)) + 1):
        y = B - i * ystep * sy; b += line(L, y, R, y, '#d5dbe3', 1) + text(L - 8, y + 5, num(i * ystep), 13, 'end')
    b += arrow(L, B, R + 18, B, INK, 1.6, 9) + arrow(L, B, L, T - 14, INK, 1.6, 9)
    b += text(R + 20, B + 38, xl, 14, 'end', italic=True) + text(L + 8, T - 6, yl, 14, 'start', italic=True)
    cols = [BLUE, RED, GREEN]
    for k, s in enumerate(series):
        pts = ' '.join(f'{L + x * sx:.1f},{B - y * sy:.1f}' for x, y in s)
        b += f"<polyline points='{pts}' fill='none' stroke='{cols[k % 3]}' stroke-width='2.6'/>"
        if labels:
            x, y = s[-1]; b += text(L + x * sx - 4, B - y * sy - 10, labels[k], 15, 'end', cols[k % 3], bold=True)
    return svg(w, h, b)


# ── күштер, денелер ──
def block_forces(forces, label_body=''):
    """бір түзу бойындағы күштер: forces = [(F, 'right'|'left', 'F₁')], масштаб: 1 Н = 18 px"""
    b = rect(250, 70, 90, 60, '#c99d6b') + text(295, 106, label_body, 16, italic=True) + line(40, 130, 560, 130, INK, 1.6)
    for k in range(40, 560, 14):
        b += line(k, 130, k - 8, 140, MUTED, 1)
    yk = {'right': 0, 'left': 0}
    for F, d, lab in forces:
        y = 84 + yk[d] * 34; yk[d] += 1
        x0 = 340 if d == 'right' else 250; x1 = x0 + (1 if d == 'right' else -1) * F * 18
        b += arrow(x0, y, x1, y, RED if d == 'right' else BLUE, 2.4) + text(x1 + (14 if d == 'right' else -14), y + 5, lab, 17, 'start' if d == 'right' else 'end', italic=True)
    # масштаб
    b += line(420, 170, 456, 170, INK, 2) + line(420, 165, 420, 175) + line(456, 165, 456, 175) + text(476, 175, '2 Н', 13, 'start')
    return svg(600, 190, b)


def spring_graph(points, xmax, ymax, xstep, ystep):
    return graph([points], xmax, ymax, xstep, ystep, 'Δl, см', 'F, Н')


def brick(a, b_, c):
    """тікбұрышты брусок: өлшемдері a×b×c (см), изометрия"""
    k = 9
    ax, by, cz = a * k, b_ * k * .55, c * k
    x0, y0 = 70, 60 + by + cz
    P = lambda x, y, z: (x0 + x + y * .9, y0 - z - y * .55)
    f = lambda pts, fill: "<polygon points='" + ' '.join(f'{p[0]:.1f},{p[1]:.1f}' for p in pts) + f"' fill='{fill}' stroke='{INK}' stroke-width='1.5'/>"
    s = f([P(0, 0, 0), P(ax, 0, 0), P(ax, 0, cz), P(0, 0, cz)], '#d9a07a') + f([P(ax, 0, 0), P(ax, by / .55 * .55, 0), P(ax, by, cz), P(ax, 0, cz)], '#c88a63') + f([P(0, 0, cz), P(ax, 0, cz), P(ax, by, cz), P(0, by, cz)], '#e7b896')
    p1, p2 = P(0, 0, 0), P(ax, 0, 0)
    s += text((p1[0] + p2[0]) / 2, p1[1] + 22, f'{num(a)} см', 14)
    q1, q2 = P(ax, 0, 0), P(ax, by, 0)
    s += text((q1[0] + q2[0]) / 2 + 30, (q1[1] + q2[1]) / 2 + 8, f'{num(b_)} см', 14, 'start')
    r1, r2 = P(0, 0, 0), P(0, 0, cz)
    s += text(r1[0] - 10, (r1[1] + r2[1]) / 2 + 5, f'{num(c)} см', 14, 'end')
    return svg(int(x0 + ax + by * .9 + 110), int(y0 + 40), s)


def vessel_points(h_total, points):
    """сұйығы бар ыдыс; points = [('A', тереңдік см)]"""
    X, Y0, Y1, Wd = 90, 290, 50, 200
    per = (Y0 - Y1) / h_total
    b = f"<rect x='{X}' y='{Y1}' width='{Wd}' height='{Y0 - Y1}' fill='{WATER}'/>" + f"<path d='M{X},{Y1 - 30} L{X},{Y0} L{X + Wd},{Y0} L{X + Wd},{Y1 - 30}' fill='none' stroke='{INK}' stroke-width='2'/>" + line(X, Y1, X + Wd, Y1, BLUE, 1.6)
    for i, (lab, d) in enumerate(points):
        y = Y1 + d * per; x = X + 50 + i * 70
        b += f"<circle cx='{x}' cy='{y:.1f}' r='4.5' fill='{INK}'/>" + text(x + 10, y + 5, lab, 15, 'start', bold=True)
        b += line(X + Wd + 14 + i * 26, Y1, X + Wd + 14 + i * 26, y, MUTED, 1.2) + line(X + Wd + 8 + i * 26, y, X + Wd + 20 + i * 26, y, MUTED, 1.2)
        b += text(X + Wd + 18 + i * 26, (Y1 + y) / 2, f'{num(d)}', 12, 'start', MUTED)
    b += line(X + Wd + 8, Y1, X + Wd + 70, Y1, MUTED, 1.2) + text(X + Wd + 76, Y1 + 4, '0', 12, 'start', MUTED) + text(X + Wd + 76, Y0 - 4, 'см', 12, 'start', MUTED)
    return svg(400, Y0 + 20, b)


def hydraulic(S1, S2, F1):
    """гидравликалық машина: кіші поршень S1 (см²), үлкені S2, кішісіне F1 (Н)"""
    b = f"<path d='M60,90 L60,250 L340,250 L340,90 M110,90 L110,200 L250,200 L250,90' fill='none' stroke='{INK}' stroke-width='2'/>"
    b += f"<path d='M62,140 L108,140 L108,202 L252,202 L252,120 L338,120 L338,248 L62,248 Z' fill='{WATER}'/>"
    b += rect(62, 128, 46, 12, '#7c8796') + rect(252, 108, 86, 12, '#7c8796')
    b += arrow(85, 70, 85, 126, RED, 2.6) + text(98, 80, 'F₁', 16, 'start', RED, italic=True)
    b += arrow(295, 104, 295, 40, BLUE, 2.6) + text(308, 56, 'F₂', 16, 'start', BLUE, italic=True)
    b += text(85, 275, f'S₁ = {num(S1)} см²', 14) + text(295, 275, f'S₂ = {num(S2)} см²', 14)
    return svg(400, 290, b)


def archimedes(F_air, F_water, maxF=5):
    """динамометрге ілінген дене: ауада және суда"""
    a = dynamometer(F_air, maxF, 0.2, 'cube'); w = dynamometer(F_water, maxF, 0.2, 'cube')
    inner = lambda s: s[s.index('>', s.index('<rect')) + 1:s.rindex('</svg>')]
    b = f"<g>{inner(a)}</g><g transform='translate(250,0)'><rect x='60' y='320' width='120' height='90' fill='{WATER}' stroke='{INK}' stroke-width='1.6'/>{inner(w)}</g>"
    b += text(120, 418, 'ауада', 14, color=MUTED) + text(370, 418, 'суда', 14, color=MUTED)
    return svg(500, 430, b)


def lever(left, right, n=6):
    """иіндік: left/right = [(орны 1..n, жүк саны)], бір жүк 1 Н, бөлік 1 бірлік"""
    X0, k, Y = 300, 40, 90
    b = line(X0 - n * k - 10, Y, X0 + n * k + 10, Y, INK, 5) + f"<polygon points='{X0},{Y + 4} {X0 - 16},{Y + 40} {X0 + 16},{Y + 40}' fill='#9aa4b2' stroke='{INK}' stroke-width='1.4'/>"
    for i in range(-n, n + 1):
        b += line(X0 + i * k, Y - 6, X0 + i * k, Y + 6, '#fff' if i == 0 else INK, 1.2)
        if i: b += text(X0 + i * k, Y - 12, str(abs(i)), 12, color=MUTED)
    for side, items in ((-1, left), (1, right)):
        for pos, cnt in items:
            x = X0 + side * pos * k; b += line(x, Y + 3, x, Y + 22, INK, 1.2)
            for j in range(cnt):
                b += rect(x - 11, Y + 22 + j * 26, 22, 22, '#9aa4b2', INK, 1.2, 3)
    return svg(600, Y + 22 + 26 * max([c for _, c in left + right] + [1]) + 20, b)


def incline(L_cm, h_cm, F):
    """көлбеу жазықтық: ұзындығы L, биіктігі h, тарту күші F (динамометр)"""
    x0, y0, s = 60, 230, 380 / L_cm
    x1, y1 = x0 + L_cm * s * math.cos(math.asin(h_cm / L_cm)), y0 - h_cm * s
    b = f"<polygon points='{x0},{y0} {x1:.1f},{y0} {x1:.1f},{y1:.1f}' fill='#efe6d6' stroke='{INK}' stroke-width='1.8'/>"
    a = math.atan2(y1 - y0, x1 - x0); cx, cy = x0 + (x1 - x0) * .45, y0 + (y1 - y0) * .45
    bw, bh = 44, 28; nx, ny = math.sin(a), -math.cos(a)
    pts = [(cx, cy), (cx + bw * math.cos(a), cy + bw * math.sin(a)), (cx + bw * math.cos(a) - bh * nx * -1, cy + bw * math.sin(a) - bh * ny * -1), (cx - bh * nx * -1, cy - bh * ny * -1)]
    b += "<polygon points='" + ' '.join(f'{p[0]:.1f},{p[1]:.1f}' for p in pts) + f"' fill='#9aa4b2' stroke='{INK}' stroke-width='1.4'/>"
    ex, ey = cx + (bw + 120) * math.cos(a) + bh / 2 * nx, cy + (bw + 120) * math.sin(a) + bh / 2 * ny
    b += arrow(cx + bw * math.cos(a) + bh / 2 * nx, cy + bw * math.sin(a) + bh / 2 * ny, ex, ey, RED, 2.4) + text(ex + 6, ey - 6, f'F = {num(F)} Н', 15, 'start', RED, italic=True)
    b += text((x0 + x1) / 2 + 30, (y0 + y1) / 2 + 34, f'l = {num(L_cm)} см', 14, 'start', italic=True) + text(x1 + 10, (y0 + y1) / 2, f'h = {num(h_cm)} см', 14, 'start', italic=True)
    return svg(560, 260, b)


def heights(h1, h2, label='доп'):
    """денені h1 биіктіктен лақтыру / құлау: A (h1) және B (h2) нүктелері"""
    Y0, k = 270, 220 / max(h1, 1)
    b = line(40, Y0, 360, Y0, INK, 2)
    for x in range(40, 360, 14): b += line(x, Y0, x - 8, Y0 + 10, MUTED, 1)
    for lab, h, x in (('A', h1, 150), ('B', h2, 150)):
        y = Y0 - h * k
        b += f"<circle cx='{x}' cy='{y:.1f}' r='11' fill='{'#e5683a' if lab == 'A' else 'none'}' stroke='{INK}' stroke-width='1.4' {'' if lab == 'A' else "stroke-dasharray='4 3'"}/>" + text(x + 20, y + 5, lab, 15, 'start', bold=True)
        b += line(250, Y0, 250, y, MUTED, 1.2) + line(244, y, 256, y, MUTED, 1.2) + text(262, (Y0 + y) / 2 + 5, f'{num(h)} м', 14, 'start', MUTED)
    b += arrow(150, Y0 - h1 * k + 16, 150, Y0 - h2 * k - 16, BLUE, 1.6, 8)
    return svg(400, Y0 + 20, b)


def crane(h, m):
    """кран жүкті h биіктікке көтереді"""
    b = line(60, 280, 360, 280, INK, 2) + rect(80, 60, 18, 220, '#f0b429') + line(80, 60, 330, 60, INK, 3) + line(98, 90, 230, 60, INK, 1.4)
    b += line(300, 60, 300, 280 - h * 18 - 26, INK, 1.4) + rect(282, 280 - h * 18 - 26, 36, 26, '#9aa4b2') + text(300, 280 - h * 18 - 8, f'{m} кг', 11)
    b += arrow(345, 270, 345, 280 - h * 18, GREEN, 1.6, 8) + text(352, 280 - h * 9, f'{num(h)} м', 14, 'start', GREEN)
    return svg(420, 300, b)


def moon_phases():
    """Жер, Ай орбитасы, 4 орын (1–4), Күн сәулесі сол жақтан"""
    b = ''.join(arrow(20, 60 + i * 50, 70, 60 + i * 50, '#f0b429', 2, 8) for i in range(4)) + text(45, 40, 'Күн сәулесі', 13, color=MUTED)
    cx, cy, R = 280, 140, 100
    b += f"<circle cx='{cx}' cy='{cy}' r='{R}' fill='none' stroke='{MUTED}' stroke-dasharray='5 4'/>" + f"<circle cx='{cx}' cy='{cy}' r='26' fill='#5aa0e0' stroke='{INK}'/>" + text(cx, cy + 5, 'Жер', 12, color='#fff')
    for i, (dx, dy) in enumerate(((-1, 0), (0, -1), (1, 0), (0, 1)), 1):
        x, y = cx + dx * R, cy + dy * R
        b += f"<circle cx='{x}' cy='{y}' r='13' fill='#2b2f38'/><path d='M{x},{y - 13} A13,13 0 0,0 {x},{y + 13} Z' fill='#f6f0d8'/>" + text(x + dx * 26 + (14 if dx == 0 else 0), y + dy * 26 + 5, str(i), 14, bold=True)
    return svg(420, 280, b)
