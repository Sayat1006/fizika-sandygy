"""Figure library for KMZh. draw(spec, path) -> (w_px, h_px) display size."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, Polygon, Arc, Wedge, Ellipse, FancyArrowPatch
import numpy as np

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['mathtext.fontset'] = 'dejavusans'
PAL = [('#E3F2FD', '#1565C0'), ('#FFF3E0', '#E65100'), ('#E8F5E9', '#2E7D32'), ('#F3E5F5', '#6A1B9A'),
       ('#FFEBEE', '#C62828'), ('#E0F7FA', '#00838F'), ('#FFFDE7', '#F9A825'), ('#ECEFF1', '#37474F')]


def arrow(ax, x0, y0, x1, y1, c='#C62828', lw=2.2, label=None, lx=0, ly=0, fs=12):
    ax.annotate('', xy=(x1, y1), xytext=(x0, y0), arrowprops=dict(arrowstyle='-|>', lw=lw, color=c, mutation_scale=16))
    if label:
        ax.text(x1 + lx, y1 + ly, label, color=c, fontsize=fs, weight='bold', ha='center', va='center')


def canvas(w=8, h=4.5, xl=(0, 16), yl=(0, 9), title=None):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(*xl); ax.set_ylim(*yl); ax.axis('off'); ax.set_aspect('equal')
    if title: ax.set_title(title, fontsize=13, weight='bold')
    return fig, ax


# ---------------- generic types ----------------
def cards(title, items, cols=None):
    n = len(items); cols = cols or (3 if n in (3, 5, 6, 9) else 2 if n in (2, 4) else min(n, 4))
    rows = int(np.ceil(n / cols))
    fig, ax = plt.subplots(figsize=(3.1 * cols, 2.2 * rows + 0.6))
    ax.set_xlim(0, cols * 10); ax.set_ylim(0, rows * 7); ax.axis('off')
    for i, (hd, body) in enumerate(items):
        r, c = divmod(i, cols); x, y = c * 10 + 0.3, (rows - 1 - r) * 7 + 0.3
        fc, ec = PAL[i % len(PAL)]
        ax.add_patch(FancyBboxPatch((x, y), 9.4, 6.4, boxstyle='round,pad=0.1', fc=fc, ec=ec, lw=1.8))
        ax.text(x + 4.7, y + 5.4, hd, ha='center', va='center', fontsize=12, weight='bold', color=ec, wrap=True)
        ax.text(x + 4.7, y + 2.6, body, ha='center', va='center', fontsize=10, color='#212121', linespacing=1.3)
    fig.suptitle(title, fontsize=14, weight='bold')
    plt.tight_layout()
    return fig


def formula(title, fl, legend):
    """fl: list of (mathtext, caption)"""
    n = len(fl)
    fig, ax = plt.subplots(figsize=(8, 1.2 + 1.25 * n + 0.32 * len(legend)))
    H = 1.2 + 1.25 * n + 0.32 * len(legend)
    ax.set_xlim(0, 16); ax.set_ylim(0, H * 2); ax.axis('off')
    ax.add_patch(FancyBboxPatch((0.2, 0.2), 15.6, H * 2 - 0.4, boxstyle='round,pad=0.1', fc='#FAFAFA', ec='#1565C0', lw=2))
    ax.text(8, H * 2 - 0.9, title, ha='center', fontsize=14, weight='bold', color='#0D47A1')
    y = H * 2 - 2.6
    for m, cap in fl:
        ax.add_patch(FancyBboxPatch((1, y - 0.9), 14, 1.9, boxstyle='round,pad=0.05', fc='#E3F2FD', ec='none'))
        ax.text(5.5, y, m, ha='center', va='center', fontsize=20, color='#B71C1C')
        ax.text(10.2, y, cap, ha='left', va='center', fontsize=10, color='#263238')
        y -= 2.5
    for line in legend:
        ax.text(1.2, y + 0.6, line, fontsize=10, color='#37474F'); y -= 0.64
    plt.tight_layout()
    return fig


def graph(title, xl, yl, series, notes=None, bars=False):
    fig, ax = plt.subplots(figsize=(7, 4))
    cols = ['#1565C0', '#C62828', '#2E7D32', '#EF6C00', '#6A1B9A']
    for i, s in enumerate(series):
        lab, xs, ys = s[:3]
        if bars: ax.bar(xs, ys, color=cols[i % 5], label=lab)
        else: ax.plot(xs, ys, lw=2.5, color=cols[i % 5], label=lab, marker='o' if len(xs) < 9 else None)
    ax.set_xlabel(xl, fontsize=11); ax.set_ylabel(yl, fontsize=11); ax.grid(alpha=0.35)
    ax.set_title(title, fontsize=13, weight='bold')
    if any(s[0] for s in series): ax.legend()
    for (x, y, t) in (notes or []): ax.annotate(t, (x, y), fontsize=10, color='#37474F')
    ax.set_xlim(left=min(0, ax.get_xlim()[0])); ax.set_ylim(bottom=min(0, ax.get_ylim()[0]))
    plt.tight_layout()
    return fig


def flow(title, steps):
    n = len(steps)
    fig, ax = plt.subplots(figsize=(min(2.4 * n, 11), 2.6))
    ax.set_xlim(0, n * 10); ax.set_ylim(0, 8); ax.axis('off')
    for i, s in enumerate(steps):
        fc, ec = PAL[i % len(PAL)]
        ax.add_patch(FancyBboxPatch((i * 10 + 0.5, 1.2), 8, 5.4, boxstyle='round,pad=0.2', fc=fc, ec=ec, lw=2))
        ax.text(i * 10 + 4.5, 3.9, s, ha='center', va='center', fontsize=10, weight='bold', color=ec)
        if i < n - 1: arrow(ax, i * 10 + 8.7, 3.9, i * 10 + 10.3, 3.9, c='#455A64', lw=2)
    ax.set_title(title, fontsize=13, weight='bold')
    plt.tight_layout()
    return fig


# ---------------- custom diagrams ----------------
def c_block_forces(forces, title='Денеге әсер ететін күштер', surface=True, incline=False):
    fig, ax = canvas(7, 4.5, (0, 14), (0, 9), title)
    if surface: ax.add_patch(Rectangle((1, 2), 12, 0.3, fc='#8D6E63'))
    ax.add_patch(Rectangle((5.5, 2.3), 3, 2, fc='#90CAF9', ec='#1565C0', lw=2))
    cx, cy = 7, 3.3
    dirs = {'up': (0, 1), 'down': (0, -1), 'left': (-1, 0), 'right': (1, 0)}
    for name, d, L in forces:
        dx, dy = dirs[d]
        sx, sy = (cx, cy) if d != 'down' else (cx, cy)
        if d == 'up' and name.startswith('N'): sx, sy = cx, 4.3
        arrow(ax, sx, sy, sx + dx * L, sy + dy * L, label=name, lx=0.7 * (1 if dx >= 0 else -1) if dx else 0.6, ly=0.4 * dy if dy else 0.4)
    ax.add_patch(Circle((cx, cy), 0.12, fc='k'))
    return fig


def c_spring():
    fig, ax = canvas(8, 4.5, (0, 16), (0, 9), 'Серпімділік күші. Гук заңы')
    for k, (L, m) in enumerate([(2.5, 0), (4, 1), (5.5, 2)]):
        x = 2.5 + k * 5
        ax.plot([x - 1.5, x + 1.5], [8.3, 8.3], color='#5D4037', lw=4)
        ys = np.linspace(8.3, 8.3 - L, 60); xs = x + 0.4 * np.sin(np.linspace(0, 20 * np.pi, 60)); xs[0] = xs[-1] = x
        ax.plot(xs, ys, color='#455A64', lw=1.8)
        if m:
            for j in range(m): ax.add_patch(Rectangle((x - 0.6, 8.3 - L - 0.8 * (j + 1)), 1.2, 0.8, fc='#FFB74D', ec='#E65100'))
            arrow(ax, x + 1.3, 8.3 - L - 0.4, x + 1.3, 8.3 - L + 1.2, c='#1565C0', label='$F_{сер}$', lx=0.9)
        ax.text(x, 0.4, ['x = 0', 'x', '2x'][k], ha='center', fontsize=12)
    ax.text(8, 1.4, r'$F_{сер} = k\cdot \Delta l$', ha='center', fontsize=16, color='#B71C1C')
    return fig


def c_pressure_bricks():
    fig, ax = canvas(8, 3.8, (0, 16), (0, 7.5), 'Қысымның тірек ауданына тәуелділігі')
    ax.add_patch(Rectangle((0.5, 1), 15, 0.6, fc='#D7CCC8'))
    for x, w, h, lab in [(1.5, 5, 1.6, 'S үлкен → p кіші'), (9.5, 1.6, 4.0, 'S кіші → p үлкен')]:
        ax.add_patch(Rectangle((x, 1.6), w, h, fc='#EF9A9A', ec='#B71C1C', lw=2))
        arrow(ax, x + w / 2, 1.6 + h + 1.4, x + w / 2, 1.6 + h, c='#1565C0', label='F', lx=0.5, ly=1.2)
        ax.text(x + w / 2, 0.3, lab, ha='center', fontsize=11, weight='bold')
    ax.text(13.6, 5.2, r'$p=\frac{F}{S}$', fontsize=20, color='#B71C1C')
    return fig


def c_liquid_column():
    fig, ax = canvas(8, 4.5, (0, 16), (0, 9), 'Гидростатикалық қысым')
    ax.add_patch(Rectangle((2, 1), 5, 7, fc='none', ec='#37474F', lw=2))
    ax.add_patch(Rectangle((2, 1), 5, 6, fc='#90CAF9', alpha=0.8))
    for y, t in [(5.5, 'p₁'), (3.5, 'p₂'), (1.6, 'p₃')]:
        ax.add_patch(Circle((4.5, y), 0.15, fc='k')); ax.text(5, y, t, fontsize=12)
    arrow(ax, 7.8, 7, 7.8, 1.2, c='#37474F', label='h', lx=0.5, ly=2.8)
    ax.text(9.5, 5.5, r'$p=\rho g h$', fontsize=20, color='#B71C1C')
    ax.text(9.5, 3.7, 'p₁ < p₂ < p₃', fontsize=14)
    ax.text(9.5, 2.3, 'Тереңдеген сайын\nқысым артады', fontsize=11)
    return fig


def c_vessels():
    fig, ax = canvas(8, 4, (0, 16), (0, 8), 'Қатынас ыдыстар')
    for x, w in [(1.5, 2), (6, 4), (12.5, 1.2)]:
        ax.add_patch(Rectangle((x, 2), w, 5, fc='none', ec='#37474F', lw=2))
        ax.add_patch(Rectangle((x, 2), w, 3.6, fc='#90CAF9'))
    ax.add_patch(Rectangle((1.5, 1.2), 12.2, 0.8, fc='#90CAF9', ec='#37474F', lw=2))
    ax.plot([0.5, 15], [5.6, 5.6], '--', color='#C62828'); ax.text(14.2, 5.9, 'бір деңгей', color='#C62828', fontsize=10)
    return fig


def c_hydraulic():
    fig, ax = canvas(8, 4.2, (0, 16), (0, 8.5), 'Гидравликалық машина')
    ax.add_patch(Rectangle((2, 1), 2, 5, fc='#90CAF9', ec='#37474F', lw=2))
    ax.add_patch(Rectangle((9, 1), 5.5, 4, fc='#90CAF9', ec='#37474F', lw=2))
    ax.add_patch(Rectangle((2, 0.3), 12.5, 0.7, fc='#90CAF9', ec='#37474F', lw=2))
    ax.add_patch(Rectangle((1.8, 6), 2.4, 0.4, fc='#616161')); ax.add_patch(Rectangle((8.8, 5), 5.9, 0.4, fc='#616161'))
    arrow(ax, 3, 8.2, 3, 6.4, label='$F_1$', lx=0.7, ly=1)
    arrow(ax, 11.75, 5.4, 11.75, 7.6, c='#2E7D32', label='$F_2$', lx=0.8, ly=-0.4)
    ax.text(3, 3.5, '$S_1$', ha='center', fontsize=13); ax.text(11.75, 3, '$S_2$', ha='center', fontsize=13)
    ax.text(5.5, 7.5, r'$\frac{F_2}{F_1}=\frac{S_2}{S_1}$', fontsize=18, color='#B71C1C')
    return fig


def c_torricelli():
    fig, ax = canvas(7, 4.5, (0, 14), (0, 9), 'Торричелли тәжірибесі')
    ax.add_patch(Rectangle((1, 0.5), 7, 1.8, fc='#B0BEC5', ec='#37474F', lw=2))
    ax.add_patch(Rectangle((4, 1.2), 1, 7.5, fc='none', ec='#37474F', lw=2))
    ax.add_patch(Rectangle((4, 1.2), 1, 6, fc='#90A4AE'))
    ax.text(4.5, 7.9, 'вакуум', ha='center', fontsize=9)
    arrow(ax, 6, 2.3, 6, 7.2, c='#37474F', label='760 мм', lx=1.3, ly=-2.5)
    for x in [1.8, 2.8, 7.2]: arrow(ax, x, 4, x, 2.4, c='#1565C0')
    ax.text(9, 5.5, '$p_{атм}$ ≈ 760 мм сын. бағ.\n≈ 101 325 Па', fontsize=11)
    return fig


def c_archimedes():
    fig, ax = canvas(7, 4.5, (0, 14), (0, 9), 'Архимед күші')
    ax.add_patch(Rectangle((1, 0.5), 8, 7, fc='#BBDEFB', ec='#37474F', lw=2))
    ax.add_patch(Rectangle((3.8, 2.5), 2.4, 2.4, fc='#FFB74D', ec='#E65100', lw=2))
    arrow(ax, 5, 3.7, 5, 6.8, c='#1565C0', label='$F_A$', lx=0.8, ly=-0.3)
    arrow(ax, 5, 3.7, 5, 0.9, c='#C62828', label='$F_{ауыр}$', lx=1.1, ly=0.4)
    ax.text(9.6, 5, r'$F_A=\rho_{с} g V_{д}$', fontsize=17, color='#B71C1C')
    return fig


def c_floating():
    fig, ax = canvas(8, 4, (0, 16), (0, 8), 'Денелердің жүзу шарттары')
    ax.add_patch(Rectangle((0.5, 0.5), 15, 5.5, fc='#BBDEFB', ec='#37474F'))
    for x, y, lab, c in [(2.5, 5.2, '$F_A>F_{ауыр}$\nқалқиды', '#81C784'), (7.3, 3, '$F_A=F_{ауыр}$\nжүзеді', '#FFB74D'), (12, 0.6, '$F_A<F_{ауыр}$\nбатады', '#E57373')]:
        ax.add_patch(Rectangle((x, y), 1.6, 1.4, fc=c, ec='k'))
        ax.text(x + 0.8, 6.8, lab, ha='center', fontsize=10)
    return fig


def c_lever():
    fig, ax = canvas(8, 3.6, (0, 16), (0, 7), 'Иіндіктің тепе-теңдік шарты')
    ax.add_patch(Polygon([[7.4, 1], [8.6, 1], [8, 2.6]], fc='#616161'))
    ax.add_patch(Rectangle((1, 2.6), 14, 0.35, fc='#8D6E63'))
    arrow(ax, 2.5, 2.6, 2.5, 0.6, label='$F_1$', lx=0.7, ly=0.3)
    arrow(ax, 12, 2.6, 12, 1.2, c='#1565C0', label='$F_2$', lx=0.7, ly=0.3)
    ax.annotate('', xy=(2.5, 3.6), xytext=(8, 3.6), arrowprops=dict(arrowstyle='<->', color='k')); ax.text(5.2, 3.9, '$l_1$', fontsize=13)
    ax.annotate('', xy=(12, 3.6), xytext=(8, 3.6), arrowprops=dict(arrowstyle='<->', color='k')); ax.text(9.8, 3.9, '$l_2$', fontsize=13)
    ax.text(8, 5.6, r'$F_1 l_1 = F_2 l_2$   немесе   $M_1 = M_2$', ha='center', fontsize=16, color='#B71C1C')
    return fig


def c_simple_machines():
    fig, axs = plt.subplots(1, 3, figsize=(9, 3.2))
    for a in axs: a.set_xlim(0, 10); a.set_ylim(0, 8); a.axis('off'); a.set_aspect('equal')
    a = axs[0]; a.add_patch(Polygon([[4.5, 1], [5.5, 1], [5, 2.5]], fc='#616161')); a.add_patch(Rectangle((0.5, 2.5), 9, 0.3, fc='#8D6E63'))
    a.set_title('Иіндік', fontsize=12, weight='bold')
    a = axs[1]; a.add_patch(Circle((5, 6), 1.3, fc='#B0BEC5', ec='k')); a.plot([3.7, 3.7], [6, 1.5], 'k'); a.plot([6.3, 6.3], [6, 3.5], 'k')
    a.add_patch(Rectangle((5.8, 2.3), 1, 1.2, fc='#FFB74D')); a.plot([3, 7], [7.6, 7.6], color='#5D4037', lw=4); a.plot([5, 5], [7.3, 7.6], 'k')
    a.set_title('Блок', fontsize=12, weight='bold')
    a = axs[2]; a.add_patch(Polygon([[0.5, 1], [9.5, 1], [9.5, 5.5]], fc='#D7CCC8', ec='k'))
    a.add_patch(Polygon([[4.5, 3.25], [6.3, 4.15], [5.8, 5.15], [4, 4.25]], fc='#90CAF9', ec='k'))
    a.set_title('Көлбеу жазықтық', fontsize=12, weight='bold')
    fig.suptitle('Жай механизмдер', fontsize=14, weight='bold'); plt.tight_layout()
    return fig


def c_center_mass():
    fig, ax = canvas(7, 4.2, (0, 14), (0, 8.4), 'Жазық фигураның массалық центрі')
    P = np.array([[2, 1.5], [8.5, 2], [7, 7], [3, 6]])
    ax.add_patch(Polygon(P, fc='#C5E1A5', ec='#33691E', lw=2))
    for (x, y), c in [((2.4, 1.9), '#1565C0'), ((7, 6.6), '#C62828')]:
        ax.add_patch(Circle((x, y), 0.15, fc='k'))
        d = np.array([5.1, 4.1]) - np.array([x, y]); d = d / np.linalg.norm(d)
        ax.plot([x - d[0] * 0.5, x + d[0] * 7], [y - d[1] * 0.5, y + d[1] * 7], '--', color=c, lw=2)
    ax.add_patch(Circle((5.1, 4.1), 0.25, fc='#FDD835', ec='k')); ax.text(5.5, 4.4, 'C', fontsize=14, weight='bold')
    ax.text(9.5, 5.5, 'Фигураны 2 нүктеден\nілеміз, тіктеуіш\nсызықтарының\nқиылысуы – C', fontsize=10)
    return fig


def c_solar():
    fig, ax = plt.subplots(figsize=(9, 3.2)); ax.set_xlim(-0.5, 17); ax.set_ylim(-2.2, 2.2); ax.axis('off'); ax.set_aspect('equal')
    ax.add_patch(Circle((-0.2, 0), 1.8, fc='#FDD835', ec='#F57F17'))
    pl = [('Меркурий', .25, '#9E9E9E'), ('Шолпан', .4, '#FFCC80'), ('Жер', .42, '#42A5F5'), ('Марс', .3, '#E57373'),
          ('Юпитер', 1.0, '#D7CCC8'), ('Сатурн', .85, '#FFE082'), ('Уран', .6, '#80DEEA'), ('Нептун', .58, '#5C6BC0')]
    x = 2.3
    for n, r, c in pl:
        x += r + 0.35; ax.add_patch(Circle((x, 0), r, fc=c, ec='k', lw=0.5))
        if n == 'Сатурн': ax.add_patch(Ellipse((x, 0), r * 3.2, r * 0.8, fc='none', ec='#8D6E63', lw=1.5))
        ax.text(x, -1.6 if r < 0.7 else -1.9, n, ha='center', fontsize=8, rotation=0); x += r + 0.35
    ax.set_title('Күн жүйесінің ғаламшарлары (масштабсыз)', fontsize=13, weight='bold'); plt.tight_layout()
    return fig


def c_seasons():
    fig, ax = canvas(8, 4, (0, 16), (0, 8), 'Жыл мезгілдерінің ауысуы (Жер осінің көлбеулігі 23,5°)')
    ax.add_patch(Ellipse((8, 4), 13, 5.5, fc='none', ec='#90A4AE', ls='--'))
    ax.add_patch(Circle((8, 4), 1, fc='#FDD835'))
    for (x, y), lab in [((1.5, 4), '22 желтоқсан'), ((14.5, 4), '22 маусым'), ((8, 6.75), '23 қыркүйек'), ((8, 1.25), '21 наурыз')]:
        ax.add_patch(Circle((x, y), 0.55, fc='#42A5F5', ec='k'))
        ax.plot([x - 0.35, x + 0.35], [y - 0.7, y + 0.7], 'k', lw=1.5)
        ax.text(x, y - 1.2 if y < 5 else y + 0.9, lab, ha='center', fontsize=9)
    return fig


def c_particles(kind='diffusion'):
    fig, axs = plt.subplots(1, 3, figsize=(9, 3.2)); rng = np.random.default_rng(3)
    titles = ['Қатты дене', 'Сұйық', 'Газ'] if kind == 'states' else ['Бастапқы күй', 'Біраз уақыттан соң', 'Толық араласу']
    for i, a in enumerate(axs):
        a.set_xlim(0, 10); a.set_ylim(0, 10); a.set_aspect('equal'); a.set_xticks([]); a.set_yticks([])
        a.set_title(titles[i], fontsize=11, weight='bold')
        if kind == 'states':
            if i == 0: pts = [(x, y) for x in np.arange(1, 10, 1.3) for y in np.arange(1, 10, 1.3)]
            elif i == 1: pts = [(x + rng.uniform(-.3, .3), y + rng.uniform(-.3, .3)) for x in np.arange(1, 10, 1.35) for y in np.arange(1, 6, 1.35)]
            else: pts = rng.uniform(0.5, 9.5, (12, 2))
            for x, y in pts: a.add_patch(Circle((x, y), 0.5, fc='#64B5F6', ec='#0D47A1'))
        else:
            n = 30
            for j in range(n):
                if i == 0: x = rng.uniform(0.5, 4.5)
                elif i == 1: x = rng.uniform(0.5, 6.5)
                else: x = rng.uniform(0.5, 9.5)
                a.add_patch(Circle((x, rng.uniform(.5, 9.5)), .3, fc='#E53935'))
                x2 = rng.uniform(5.5, 9.5) if i == 0 else rng.uniform(3.5, 9.5) if i == 1 else rng.uniform(.5, 9.5)
                a.add_patch(Circle((x2, rng.uniform(.5, 9.5)), .3, fc='#1E88E5'))
    fig.suptitle('Заттың агрегаттық күйлерінің молекулалық құрылысы' if kind == 'states' else 'Диффузия құбылысы', fontsize=13, weight='bold')
    plt.tight_layout()
    return fig


def c_thermo_scales():
    fig, ax = canvas(7, 4.5, (0, 14), (0, 9), 'Цельсий және Кельвин шкалалары')
    for x, lab, vals in [(3, '°C', ['100', '0', '−273']), (9, 'K', ['373', '273', '0'])]:
        ax.add_patch(FancyBboxPatch((x - 0.4, 1.2), 0.8, 6.5, boxstyle='round,pad=0.1', fc='white', ec='k'))
        ax.add_patch(Circle((x, 1.1), 0.7, fc='#E53935')); ax.add_patch(Rectangle((x - 0.2, 1.1), 0.4, 4.5, fc='#E53935'))
        for y, v in zip([7, 5, 1.9], vals): ax.plot([x + 0.4, x + 1], [y, y], 'k'); ax.text(x + 1.2, y, v, va='center', fontsize=11)
        ax.text(x, 8.4, lab, ha='center', fontsize=14, weight='bold')
    ax.text(7, 0.2, r'$T = t + 273$', ha='center', fontsize=16, color='#B71C1C')
    return fig


def c_heat_transfer():
    return cards('Жылу берілудің түрлері', [('Жылуөткізгіштік', 'қатты денелерде\nбөлшектердің\nсоқтығысуы арқылы\n(қасықтың қызуы)'),
                                            ('Конвекция', 'сұйық пен газда\nағындар арқылы\n(бөлмедегі\nрадиатор)'),
                                            ('Сәуле шығару', 'вакуумда да\nжүреді\n(Күннің жылуы)')])


def c_charges():
    fig, ax = canvas(8, 3.8, (0, 16), (0, 7.5), 'Зарядтардың өзара әрекеттесуі')
    for x, a, b, t in [(1, '+', '−', 'тартылады'), (6.3, '+', '+', 'тебіледі'), (11.6, '−', '−', 'тебіледі')]:
        for dx, s in [(0.6, a), (3.4, b)]:
            ax.add_patch(Circle((x + dx, 4), 0.7, fc='#EF9A9A' if s == '+' else '#90CAF9', ec='k')); ax.text(x + dx, 4, s, ha='center', va='center', fontsize=16, weight='bold')
        if t == 'тартылады': arrow(ax, x + 1.3, 4, x + 2, 4, lw=2); arrow(ax, x + 2.7, 4, x + 2, 4, lw=2)
        else: arrow(ax, x + 0.6, 5, x - 0.2, 5, lw=2); arrow(ax, x + 3.4, 5, x + 4.2, 5, lw=2)
        ax.text(x + 2, 2.4, t, ha='center', fontsize=11)
    ax.text(8, 0.8, r'$F = k\frac{|q_1||q_2|}{r^2}$', ha='center', fontsize=16, color='#B71C1C')
    return fig


def c_field_lines(kind='point'):
    fig, ax = plt.subplots(figsize=(7, 4)); ax.set_aspect('equal'); ax.axis('off')
    X, Y = np.meshgrid(np.linspace(-4, 4, 40), np.linspace(-2.5, 2.5, 30))
    if kind == 'dipole':
        Ex = Ey = 0
        for q, x0 in [(1, -1.5), (-1, 1.5)]:
            r3 = ((X - x0) ** 2 + Y ** 2) ** 1.5 + 1e-3; Ex = Ex + q * (X - x0) / r3; Ey = Ey + q * Y / r3
        ax.streamplot(X, Y, Ex, Ey, color='#546E7A', density=1.2)
        for q, x0 in [('+', -1.5), ('−', 1.5)]:
            ax.add_patch(Circle((x0, 0), 0.3, fc='#EF9A9A' if q == '+' else '#90CAF9', ec='k', zorder=3)); ax.text(x0, 0, q, ha='center', va='center', fontsize=14, zorder=4)
        ax.set_title('Әр аттас зарядтардың өрісі', fontsize=13, weight='bold')
    elif kind == 'magnet':
        Bx = By = 0
        for q, x0 in [(1, 1.2), (-1, -1.2)]:
            r3 = ((X - x0) ** 2 + Y ** 2) ** 1.5 + 1e-3; Bx = Bx + q * (X - x0) / r3; By = By + q * Y / r3
        ax.streamplot(X, Y, Bx, By, color='#546E7A', density=1.2)
        ax.add_patch(Rectangle((-1.5, -0.35), 1.5, 0.7, fc='#1E88E5', zorder=3)); ax.add_patch(Rectangle((0, -0.35), 1.5, 0.7, fc='#E53935', zorder=3))
        ax.text(-0.75, 0, 'S', color='w', ha='center', va='center', fontsize=14, weight='bold', zorder=4); ax.text(0.75, 0, 'N', color='w', ha='center', va='center', fontsize=14, weight='bold', zorder=4)
        ax.set_title('Жолақ магниттің магнит өрісі', fontsize=13, weight='bold')
    else:
        for a in np.linspace(0, 2 * np.pi, 16, endpoint=False): arrow(ax, 0.4 * np.cos(a), 0.4 * np.sin(a), 2.2 * np.cos(a), 2.2 * np.sin(a), c='#546E7A', lw=1.5)
        ax.add_patch(Circle((0, 0), 0.35, fc='#EF9A9A', ec='k')); ax.text(0, 0, '+', ha='center', va='center', fontsize=15)
        ax.text(2.6, 1.6, r'$E=\frac{F}{q}=k\frac{|q|}{r^2}$', fontsize=15, color='#B71C1C')
        ax.set_title('Оң нүктелік зарядтың өрісі', fontsize=13, weight='bold')
    ax.set_xlim(-4, 4); ax.set_ylim(-2.5, 2.5); plt.tight_layout()
    return fig


# electric circuit symbols
def _res(ax, x0, y0, x1, y1, lab=''):
    if y0 == y1:
        ax.plot([x0, x0 + (x1 - x0) * .3], [y0, y0], 'k'); ax.plot([x0 + (x1 - x0) * .7, x1], [y0, y0], 'k')
        ax.add_patch(Rectangle((x0 + (x1 - x0) * .3, y0 - 0.3), (x1 - x0) * .4, 0.6, fc='w', ec='k', lw=1.8))
        ax.text((x0 + x1) / 2, y0 + 0.6, lab, ha='center', fontsize=11)
    else:
        ax.plot([x0, x0], [y0, y0 + (y1 - y0) * .3], 'k'); ax.plot([x0, x0], [y0 + (y1 - y0) * .7, y1], 'k')
        ax.add_patch(Rectangle((x0 - 0.3, y0 + (y1 - y0) * .3), 0.6, (y1 - y0) * .4, fc='w', ec='k', lw=1.8))
        ax.text(x0 + 0.5, (y0 + y1) / 2, lab, va='center', fontsize=11)


def _bat(ax, x, y):
    ax.plot([x - 0.15, x - 0.15], [y - 0.6, y + 0.6], 'k', lw=2); ax.plot([x + 0.15, x + 0.15], [y - 0.3, y + 0.3], 'k', lw=4)


def _meter(ax, x, y, t):
    ax.add_patch(Circle((x, y), 0.45, fc='w', ec='k', lw=1.8, zorder=3)); ax.text(x, y, t, ha='center', va='center', fontsize=11, weight='bold', zorder=4)


def c_circuit(kind='simple'):
    fig, ax = canvas(7, 4, (0, 14), (0, 8))
    if kind == 'series':
        ax.plot([2, 2], [1.5, 6.5], 'k'); ax.plot([12, 12], [1.5, 6.5], 'k'); ax.plot([2, 6.5], [1.5, 1.5], 'k'); ax.plot([7.5, 12], [1.5, 1.5], 'k')
        _bat(ax, 7, 1.5); _res(ax, 2, 6.5, 7, 6.5, '$R_1$'); _res(ax, 7, 6.5, 12, 6.5, '$R_2$'); _meter(ax, 12, 4, 'A')
        ax.set_title('Тізбектей жалғау: I = const, U = U₁ + U₂, R = R₁ + R₂', fontsize=11, weight='bold')
    elif kind == 'parallel':
        ax.plot([2, 2], [1.5, 6.5], 'k'); ax.plot([12, 12], [1.5, 6.5], 'k'); ax.plot([2, 6.5], [1.5, 1.5], 'k'); ax.plot([7.5, 12], [1.5, 1.5], 'k')
        _bat(ax, 7, 1.5); ax.plot([2, 4], [6.5, 6.5], 'k'); ax.plot([10, 12], [6.5, 6.5], 'k'); ax.plot([4, 4], [4.5, 7.5], 'k'); ax.plot([10, 10], [4.5, 7.5], 'k')
        _res(ax, 4, 7.5, 10, 7.5, '$R_1$'); _res(ax, 4, 4.5, 10, 4.5, '$R_2$'); _meter(ax, 2, 4, 'A')
        ax.set_title('Параллель жалғау: U = const, I = I₁ + I₂, 1/R = 1/R₁ + 1/R₂', fontsize=11, weight='bold')
    else:
        ax.plot([2, 2], [1.5, 6.5], 'k'); ax.plot([12, 12], [1.5, 6.5], 'k'); ax.plot([2, 6.5], [1.5, 1.5], 'k'); ax.plot([7.5, 12], [1.5, 1.5], 'k')
        _bat(ax, 7, 1.5); _res(ax, 2, 6.5, 12, 6.5, 'R'); _meter(ax, 12, 4, 'A')
        ax.plot([5, 5], [6.5, 4.2], 'k'); ax.plot([9, 9], [6.5, 4.2], 'k'); ax.plot([5, 6.55], [4.2, 4.2], 'k'); ax.plot([7.45, 9], [4.2, 4.2], 'k'); _meter(ax, 7, 4.2, 'V')
        ax.text(3.6, 2.2, 'ток көзі, кілт, резистор,\nамперметр (A), вольтметр (V)', fontsize=10)
        ax.set_title('Электр тізбегінің сұлбасы', fontsize=12, weight='bold')
    return fig


def c_solenoid():
    fig, ax = canvas(8, 3.8, (0, 16), (0, 7.5), 'Тогы бар шарғының (соленоидтың) магнит өрісі')
    for i in range(8):
        ax.add_patch(Ellipse((4 + i, 3.7), 0.6, 2.6, fc='none', ec='#E65100', lw=2))
    for y in [2.9, 3.7, 4.5]: arrow(ax, 3, y, 12.5, y, c='#1565C0', lw=1.5)
    ax.text(2.2, 3.5, 'S', fontsize=16, weight='bold', color='#1E88E5'); ax.text(13, 3.5, 'N', fontsize=16, weight='bold', color='#E53935')
    ax.text(8, 0.8, 'Бұранда (оң қол) ережесі арқылы полюстерді анықтаймыз', ha='center', fontsize=10)
    return fig


def c_motor():
    return flow('Электрқозғалтқыш пен генератордағы энергия түрленуі', ['Электр\nэнергиясы', 'Магнит өрісі\n+ ток (Ампер күші)', 'Механикалық\nэнергия'])


def c_induction():
    fig, ax = canvas(8, 3.8, (0, 16), (0, 7.5), 'Электромагниттік индукция (Фарадей тәжірибесі)')
    for i in range(6): ax.add_patch(Ellipse((8 + i * 0.6, 3.8), 0.5, 2.6, fc='none', ec='#E65100', lw=2))
    ax.add_patch(Rectangle((2, 3.4), 2, 0.8, fc='#1E88E5')); ax.add_patch(Rectangle((4, 3.4), 2, 0.8, fc='#E53935'))
    arrow(ax, 4, 5, 7, 5, c='#2E7D32', label='v', ly=0.4)
    ax.plot([8, 8, 13], [2.5, 1, 1], 'k'); ax.plot([11, 11, 13], [2.5, 1.6, 1.6], 'k'); _meter(ax, 13.5, 1.3, 'G')
    ax.text(8, 6.5, 'Магнит ағыны өзгергенде шарғыда индукциялық ток пайда болады', ha='center', fontsize=10)
    return fig


def c_shadow():
    fig, ax = canvas(8, 3.8, (0, 16), (0, 7.5), 'Жарықтың түзу сызықты таралуы: көлеңке')
    ax.add_patch(Circle((1.5, 3.7), 0.4, fc='#FDD835', ec='k')); ax.add_patch(Rectangle((6, 2.7), 0.4, 2, fc='#455A64'))
    ax.add_patch(Rectangle((14, 0.5), 0.3, 6.5, fc='#BDBDBD'))
    ax.add_patch(Polygon([[6.4, 4.7], [6.4, 2.7], [14, 0.4], [14, 7.0]], fc='#424242', alpha=0.35))
    for y in [4.7, 2.7]: ax.plot([1.5, 14], [3.7, 3.7 + (y - 3.7) * 12.5 / 4.5], color='#F9A825', lw=1.5)
    ax.text(14.6, 3.6, 'көлеңке', fontsize=10, rotation=90)
    return fig


def c_reflection():
    fig, ax = canvas(7, 4, (0, 14), (0, 8), 'Жарықтың шағылу заңы: α = β')
    ax.add_patch(Rectangle((1, 1), 12, 0.4, fc='#90A4AE')); ax.plot([7, 7], [1.4, 7], '--', color='k')
    arrow(ax, 2.5, 6.4, 7, 1.4, c='#F9A825', lw=2.5); arrow(ax, 7, 1.4, 11.5, 6.4, c='#F9A825', lw=2.5)
    ax.add_patch(Arc((7, 1.4), 3, 3, theta1=90, theta2=132, color='#C62828', lw=2)); ax.text(6.0, 3.4, 'α', fontsize=15, color='#C62828')
    ax.add_patch(Arc((7, 1.4), 3.6, 3.6, theta1=48, theta2=90, color='#1565C0', lw=2)); ax.text(7.6, 3.6, 'β', fontsize=15, color='#1565C0')
    ax.text(7.2, 7.1, 'перпендикуляр', fontsize=9)
    return fig


def c_refraction(total=False):
    fig, ax = canvas(7, 4.2, (0, 14), (0, 8.4), 'Толық ішкі шағылу' if total else 'Жарықтың сынуы')
    ax.add_patch(Rectangle((0.5, 0.3), 13, 3.9, fc='#B3E5FC')); ax.plot([7, 7], [0.3, 8], '--', color='k')
    ax.text(1, 7.6, 'ауа (n₁)' if not total else 'ауа', fontsize=11); ax.text(1, 0.6, 'шыны / су (n₂)', fontsize=11)
    if not total:
        arrow(ax, 3, 8, 7, 4.2, c='#F9A825', lw=2.5); arrow(ax, 7, 4.2, 8.7, 0.6, c='#F9A825', lw=2.5)
        ax.text(5.9, 6.0, 'α', fontsize=15, color='#C62828'); ax.text(7.3, 2.6, 'γ', fontsize=15, color='#1565C0')
        ax.text(9, 6.5, r'$\frac{\sin\alpha}{\sin\gamma}=\frac{n_2}{n_1}$', fontsize=17, color='#B71C1C')
    else:
        for x0, c in [(5.5, '#F9A825'), (3.8, '#EF6C00'), (2.2, '#C62828')]:
            arrow(ax, x0, 0.3, 7, 4.2, c=c, lw=2)
        arrow(ax, 7, 4.2, 12.6, 7.6, c='#F9A825', lw=1.5); arrow(ax, 7, 4.2, 13, 4.5, c='#EF6C00', lw=1.5); arrow(ax, 7, 4.2, 11.8, 0.3, c='#C62828', lw=2.5)
        ax.text(8.5, 6.5, r'$\sin\alpha_0=\frac{1}{n}$', fontsize=16, color='#B71C1C')
    return fig


def c_mirror():
    fig, ax = canvas(8, 4, (0, 16), (0, 8), 'Ойыс сфералық айнадағы кескін')
    ax.add_patch(Arc((15, 4), 7, 7, theta1=145, theta2=215, lw=3, color='#455A64'))
    ax.plot([0.5, 12.2], [4, 4], 'k', lw=0.8)
    for x, t in [(8.3, 'F'), (4.9, 'C')]: ax.plot(x, 4, 'ko'); ax.text(x, 3.3, t, ha='center', fontsize=12)
    arrow(ax, 2.5, 4, 2.5, 5.8, c='#2E7D32', lw=2.5); ax.text(2.5, 6.2, 'дене', ha='center', fontsize=10)
    ax.plot([2.5, 11.6], [5.8, 5.8], color='#F9A825'); ax.plot([11.6, 6.2], [5.8, 3.0], color='#F9A825')
    ax.plot([2.5, 11.6], [5.8, 3.15], color='#EF6C00'); ax.plot([11.6, 6.2], [3.15, 3.15], color='#EF6C00')
    arrow(ax, 6.2, 4, 6.2, 3.05, c='#C62828', lw=2.5); ax.text(6.2, 2.5, 'кескін', ha='center', fontsize=10)
    return fig


def c_lens(kind='convex'):
    fig, ax = canvas(8, 4, (0, 16), (0, 8), 'Жинағыш линзадағы кескін' if kind == 'convex' else 'Шашыратқыш линза')
    ax.plot([0.5, 15.5], [4, 4], 'k', lw=0.8)
    ax.add_patch(Ellipse((8, 4), 0.8 if kind == 'convex' else 0.3, 6, fc='#B3E5FC', ec='#0277BD', lw=2))
    for x, t in [(5, 'F'), (11, 'F'), (2, '2F'), (14, '2F')]: ax.plot(x, 4, 'ko', ms=4); ax.text(x, 3.4, t, ha='center', fontsize=11)
    if kind == 'convex':
        arrow(ax, 1, 4, 1, 5.5, c='#2E7D32', lw=2.5)
        ax.plot([1, 8], [5.5, 5.5], color='#F9A825'); ax.plot([8, 15], [5.5, 5.5 - 1.5 * 7 / 3], color='#F9A825')
        ax.plot([1, 15], [5.5, 5.5 - 1.5 * 14 / 7], color='#EF6C00')
        xi = 8 + 3 * 7 / (7 - 3); hi = -1.5 * (xi - 8) / 7
        arrow(ax, xi, 4, xi, 4 + hi, c='#C62828', lw=2.5)
        ax.text(8, 7.4, r'$\frac{1}{F}=\frac{1}{d}+\frac{1}{f}$,   $D=\frac{1}{F}$', ha='center', fontsize=15, color='#B71C1C')
    else:
        arrow(ax, 3, 4, 3, 5.6, c='#2E7D32', lw=2.5)
        ax.plot([3, 8], [5.6, 5.6], color='#F9A825'); ax.plot([8, 14], [5.6, 5.6 + 1.6 * 6 / 3], color='#F9A825'); ax.plot([5, 8], [4, 5.6], ':', color='#F9A825')
        ax.text(10, 1.5, 'Кескін: жалған, тура, кішірейген', fontsize=11)
    return fig


def c_eye():
    fig, ax = canvas(8, 3.8, (0, 16), (0, 7.5), 'Көздің көру кемшіліктері')
    for cx, t, fx in [(4, 'Жақыннан көргіштік\n(миопия) – шашыратқыш линза', 4.7), (12, 'Алыстан көргіштік\n(гиперметропия) – жинағыш линза', 13.8)]:
        ax.add_patch(Circle((cx, 4), 1.8, fc='#FFF8E1', ec='k'))
        for y in [4.8, 3.2]: ax.plot([cx - 3.8, cx - 1.6], [y, y], color='#F9A825'); ax.plot([cx - 1.6, fx], [y, 4], color='#F9A825')
        ax.plot(fx, 4, 'ro'); ax.text(cx, 0.8, t, ha='center', fontsize=9)
    return fig


def c_vectors():
    fig, ax = canvas(7, 4, (0, 14), (0, 8), 'Векторларды қосу және проекциясы')
    arrow(ax, 1, 1, 6, 3, c='#1565C0', label=r'$\vec a$', ly=0.5); arrow(ax, 6, 3, 8, 7, c='#2E7D32', label=r'$\vec b$', lx=0.6)
    arrow(ax, 1, 1, 8, 7, c='#C62828', label=r'$\vec a+\vec b$', lx=-1.2, ly=0.3)
    ax.plot([9, 13.5], [1, 1], 'k'); arrow(ax, 9.5, 2, 12.5, 6, c='#6A1B9A', label=r'$\vec s$', lx=0.5)
    ax.plot([9.5, 9.5], [2, 1], ':k'); ax.plot([12.5, 12.5], [6, 1], ':k'); ax.plot([9.5, 12.5], [1, 1], color='#EF6C00', lw=4); ax.text(11, 0.3, '$s_x$', fontsize=13, color='#EF6C00')
    return fig


def c_projectile():
    t = np.linspace(0, 1.2, 50); x = 10 * t; y = 7.2 - 4.9 * t ** 2
    return graph('Горизонталь лақтырылған дененің траекториясы', 'x, м', 'y, м', [('', x[y >= 0], y[y >= 0])], notes=[(0.2, 6.6, r'$x=\upsilon_0 t$,  $y=h-\frac{gt^2}{2}$')])


def c_circular():
    fig, ax = canvas(7, 4.2, (0, 14), (0, 8.4), 'Шеңбер бойымен бірқалыпты қозғалыс')
    ax.add_patch(Circle((5, 4.2), 3, fc='none', ec='#455A64', lw=2)); ax.plot(5, 4.2, 'ko')
    ax.add_patch(Circle((7.12, 6.32), 0.2, fc='#E53935'))
    arrow(ax, 7.12, 6.32, 5.6, 7.84, c='#1565C0', label=r'$\vec\upsilon$', lx=-0.4, ly=0.3)
    arrow(ax, 7.12, 6.32, 6.0, 5.2, c='#C62828', label=r'$\vec a_ц$', lx=0.6, ly=-0.3)
    ax.text(9, 6, r'$a_ц=\frac{\upsilon^2}{R}=\omega^2 R$', fontsize=15, color='#B71C1C')
    ax.text(9, 4, r'$\upsilon=\omega R$,  $T=\frac{2\pi R}{\upsilon}$', fontsize=14)
    return fig


def c_kepler():
    fig, ax = canvas(7, 3.8, (-7, 7), (-3.8, 3.8), 'Кеплердің бірінші және екінші заңдары')
    ax.add_patch(Ellipse((0, 0), 12, 6.5, fc='none', ec='#455A64', lw=2))
    c = np.sqrt(36 - 3.25 ** 2); ax.add_patch(Circle((-c, 0), 0.5, fc='#FDD835', ec='#F57F17'))
    for a0, a1, col in [(-20, 20, '#90CAF9'), (160, 175, '#EF9A9A')]:
        th = np.radians(np.linspace(a0, a1, 20)); pts = [(-c, 0)] + [(6 * np.cos(t), 3.25 * np.sin(t)) for t in th]
        ax.add_patch(Polygon(pts, fc=col, alpha=0.7))
    ax.text(0, -3.6, 'Тең уақытта тең аудандар сызылады', ha='center', fontsize=10)
    return fig


def c_parallax():
    fig, ax = canvas(8, 3.8, (0, 16), (0, 7.5), 'Параллакс әдісі')
    ax.plot([2, 2], [1, 6], 'k', lw=2); ax.text(1.2, 3.5, 'базис\nD', fontsize=10)
    ax.add_patch(Circle((14, 3.5), 0.4, fc='#FDD835')); ax.text(14, 2.5, 'аспан денесі', ha='center', fontsize=9)
    ax.plot([2, 14], [6, 3.5], color='#1565C0'); ax.plot([2, 14], [1, 3.5], color='#1565C0'); ax.plot([2, 14], [3.5, 3.5], ':k')
    ax.text(11.6, 3.8, 'p', fontsize=14, color='#C62828')
    ax.text(5, 6.8, r'$r = \frac{D/2}{\sin p}$', fontsize=15, color='#B71C1C')
    return fig


def c_celestial():
    fig, ax = canvas(6, 4.5, (-6, 6), (-4.5, 4.5), 'Аспан сферасының негізгі элементтері')
    ax.add_patch(Circle((0, 0), 4, fc='#E8EAF6', ec='#283593', lw=2))
    ax.plot([-4, 4], [0, 0], 'k'); ax.text(3.2, 0.3, 'горизонт', fontsize=9)
    ax.plot([0, 0], [-4, 4], ':k'); ax.text(0.2, 4.1, 'зенит', fontsize=10); ax.text(0.2, -4.4, 'надир', fontsize=10)
    ax.plot([-3.2, 3.2], [-2.4, 2.4], color='#C62828'); ax.text(2.4, 2.6, 'әлем осі (P)', fontsize=9, color='#C62828')
    ax.plot([-2.4, 2.4], [3.2, -3.2], color='#2E7D32', ls='--'); ax.text(-3.9, 3.3, 'аспан экваторы', fontsize=9, color='#2E7D32')
    ax.plot(0, 0, 'ko'); ax.text(0.2, -0.5, 'бақылаушы', fontsize=9)
    return fig


def c_elevator():
    fig, axs = plt.subplots(1, 3, figsize=(9, 3.4))
    for a, (t, P, ad) in zip(axs, [('a = 0:  P = mg', 2, 0), ('a ↑:  P = m(g + a)', 3, 1), ('a ↓:  P = m(g − a)', 1, -1)]):
        a.set_xlim(0, 6); a.set_ylim(0, 8); a.axis('off'); a.set_aspect('equal')
        a.add_patch(Rectangle((1, 1), 4, 6, fc='#ECEFF1', ec='k', lw=2)); a.add_patch(Rectangle((2.5, 1), 1, 2, fc='#FFB74D'))
        arrow(a, 3, 1, 3, 1 - P * 0.35, c='#C62828', label='P', lx=0.4, ly=0.2)
        if ad: arrow(a, 5.5, 4, 5.5, 4 + ad * 1.5, c='#2E7D32', label='a', lx=0.4)
        a.set_title(t, fontsize=11, weight='bold')
    fig.suptitle('Үдеумен қозғалған лифттегі дененің салмағы', fontsize=13, weight='bold'); plt.tight_layout()
    return fig


def c_orbit():
    fig, ax = canvas(7, 4.2, (-7, 7), (-4.2, 4.2), 'Жердің жасанды серігі')
    ax.add_patch(Circle((0, 0), 2.2, fc='#42A5F5', ec='#0D47A1')); ax.add_patch(Circle((0, 0), 3.4, fc='none', ec='#455A64', ls='--'))
    ax.add_patch(Rectangle((-0.25, 3.15), 0.5, 0.5, fc='#9E9E9E'))
    arrow(ax, 0, 3.4, 2.4, 3.4, c='#1565C0', label=r'$\upsilon_1$', ly=0.4)
    arrow(ax, 0, 3.4, 0, 2.4, c='#C62828')
    ax.text(3.6, 0.5, r'$\upsilon_1=\sqrt{gR}\approx 7{,}9$ км/с', fontsize=14, color='#B71C1C')
    ax.text(3.6, -0.8, r'$\upsilon_1=\sqrt{\frac{GM}{R+h}}$', fontsize=14)
    return fig


def c_gravity():
    fig, ax = canvas(8, 3.4, (0, 16), (0, 6.8), 'Бүкіләлемдік тартылыс заңы')
    ax.add_patch(Circle((3, 3.2), 1.2, fc='#42A5F5', ec='k')); ax.add_patch(Circle((12, 3.2), 0.8, fc='#BDBDBD', ec='k'))
    ax.text(3, 3.2, '$m_1$', ha='center', va='center', fontsize=13); ax.text(12, 3.2, '$m_2$', ha='center', va='center', fontsize=12)
    arrow(ax, 4.2, 3.2, 6.2, 3.2); arrow(ax, 11.2, 3.2, 9.2, 3.2)
    ax.annotate('', xy=(3, 1.3), xytext=(12, 1.3), arrowprops=dict(arrowstyle='<->')); ax.text(7.5, 0.6, 'r', fontsize=13)
    ax.text(7.5, 5.5, r'$F=G\frac{m_1 m_2}{r^2}$,   $G=6{,}67\cdot10^{-11}$ Н·м²/кг²', ha='center', fontsize=14, color='#B71C1C')
    return fig


def c_collision():
    fig, ax = canvas(8, 3.4, (0, 16), (0, 6.8), 'Импульстің сақталу заңы')
    for y, lab, xs in [(4.5, 'дейін', [(2, '#EF9A9A', '$m_1$', 1.8), (8, '#90CAF9', '$m_2$', 0.8)]), (1.5, 'кейін', [(5, '#EF9A9A', '$m_1$', 0.6), (10, '#90CAF9', '$m_2$', 2)])]:
        ax.text(0.2, y, lab, fontsize=11, va='center')
        for x, c, m, v in xs:
            ax.add_patch(Circle((x, y), 0.7, fc=c, ec='k')); ax.text(x, y, m, ha='center', va='center', fontsize=11); arrow(ax, x + 0.7, y, x + 0.7 + v, y, c='#1565C0')
    ax.text(13.5, 3.2, r'$\sum m\vec\upsilon=$const', fontsize=14, color='#B71C1C', ha='center')
    return fig


def c_rocket():
    fig, ax = canvas(6, 4.5, (0, 12), (0, 9), 'Реактивті қозғалыс')
    ax.add_patch(Polygon([[5, 2.5], [7, 2.5], [7, 6.5], [6, 8], [5, 6.5]], fc='#ECEFF1', ec='k', lw=2))
    ax.add_patch(Polygon([[5.3, 2.5], [6.7, 2.5], [6, 0.6]], fc='#FF7043'))
    arrow(ax, 8, 4, 8, 7, c='#1565C0', label=r'$m_р\upsilon_р$', lx=1.2)
    arrow(ax, 4, 4, 4, 1, c='#C62828', label=r'$m_г\upsilon_г$', lx=-1.2)
    ax.text(6, 8.6, r'$m_р\upsilon_р = m_г\upsilon_г$', ha='center', fontsize=13, color='#B71C1C')
    return fig


def c_pendulum():
    fig, ax = canvas(7, 4.2, (0, 14), (0, 8.4), 'Маятниктегі энергияның түрленуі')
    ax.plot([5, 9], [8, 8], color='#5D4037', lw=4)
    for ang, lab in [(-35, '$E_p$ max'), (0, '$E_k$ max'), (35, '$E_p$ max')]:
        a = np.radians(ang); x, y = 7 + 6 * np.sin(a), 8 - 6 * np.cos(a)
        ax.plot([7, x], [8, y], 'k', lw=1, alpha=0.6); ax.add_patch(Circle((x, y), 0.4, fc='#FFB74D', ec='k')); ax.text(x, y - 0.9, lab, ha='center', fontsize=11)
    ax.add_patch(Arc((7, 8), 12, 12, theta1=235, theta2=305, ls='--', color='#90A4AE'))
    ax.text(11.2, 6.6, r'$T=2\pi\sqrt{\frac{l}{g}}$', fontsize=15, color='#B71C1C')
    return fig


def c_oscillation():
    t = np.linspace(0, 4, 200)
    return graph('Гармониялық тербеліс: x = A cos(ωt)', 't, с', 'x, см', [('', t, 5 * np.cos(np.pi * t))], notes=[(0.05, 5.3, 'A = 5 см'), (1.9, -6.2, 'T = 2 с')])


def c_resonance():
    w = np.linspace(0.1, 3, 200)
    return graph('Резонанс қисықтары', 'ω / ω₀', 'Амплитуда A', [('аз үйкеліс', w, 1 / np.sqrt((1 - w ** 2) ** 2 + (0.1 * w) ** 2)), ('көп үйкеліс', w, 1 / np.sqrt((1 - w ** 2) ** 2 + (0.5 * w) ** 2))])


def c_lc():
    fig, ax = canvas(7, 3.6, (0, 14), (0, 7.2), 'Тербелмелі контур (LC)')
    ax.plot([2, 2, 12, 12], [1.5, 5.5, 5.5, 1.5], 'k'); ax.plot([2, 6.6], [1.5, 1.5], 'k'); ax.plot([7.4, 12], [1.5, 1.5], 'k')
    ax.plot([6.6, 6.6], [0.8, 2.2], 'k', lw=3); ax.plot([7.4, 7.4], [0.8, 2.2], 'k', lw=3); ax.text(7, 0.1, 'C', ha='center', fontsize=13)
    for i in range(5): ax.add_patch(Arc((5 + i * 0.8, 5.5), 0.8, 1, theta1=0, theta2=180, lw=2))
    ax.text(7, 6.4, 'L', ha='center', fontsize=13)
    ax.text(7, 3.4, r'$T=2\pi\sqrt{LC}$', ha='center', fontsize=16, color='#B71C1C')
    return fig


def c_waves():
    fig, axs = plt.subplots(2, 1, figsize=(8, 3.8))
    x = np.linspace(0, 4 * np.pi, 300); axs[0].plot(x, np.sin(x), lw=2.5, color='#1565C0'); axs[0].set_title('Көлденең толқын', fontsize=11, weight='bold')
    axs[0].annotate('', xy=(2 * np.pi + np.pi / 2, 1.25), xytext=(np.pi / 2, 1.25), arrowprops=dict(arrowstyle='<->')); axs[0].text(np.pi * 1.4, 1.35, 'λ', fontsize=13)
    axs[0].set_ylim(-1.5, 1.8)
    xs = np.cumsum(0.25 + 0.18 * np.sin(np.linspace(0, 8 * np.pi, 70)))
    for xv in xs: axs[1].plot([xv, xv], [0, 1], color='#C62828', lw=1.5)
    axs[1].set_title('Бойлық толқын (сығылу мен сиреу)', fontsize=11, weight='bold')
    for a in axs: a.set_xticks([]); a.set_yticks([])
    plt.tight_layout()
    return fig


def c_em_scale():
    fig, ax = plt.subplots(figsize=(9, 2.6)); ax.set_xlim(0, 7); ax.set_ylim(0, 3); ax.axis('off')
    names = ['Радиотолқындар', 'Микротолқындар', 'Инфрақызыл', 'Көрінетін', 'Ультракүлгін', 'Рентген', 'Гамма']
    cols = ['#B0BEC5', '#90CAF9', '#EF9A9A', None, '#CE93D8', '#80CBC4', '#A5D6A7']
    for i, (n, c) in enumerate(zip(names, cols)):
        if c is None:
            for j, cc in enumerate(['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#3949AB', '#8E24AA']): ax.add_patch(Rectangle((i + j / 7, 1), 1 / 7, 1.2, fc=cc))
        else: ax.add_patch(Rectangle((i, 1), 1, 1.2, fc=c, ec='w'))
        ax.text(i + 0.5, 0.6, n, ha='center', fontsize=8.5, rotation=0)
    arrow(ax, 0.2, 2.6, 6.8, 2.6, c='#37474F', lw=1.5); ax.text(3.5, 2.75, 'жиілік ν артады, толқын ұзындығы λ кемиді', ha='center', fontsize=9)
    ax.set_title('Электромагниттік толқындар шкаласы', fontsize=13, weight='bold'); plt.tight_layout()
    return fig


def c_blackbody():
    l = np.linspace(0.1, 3, 300); h, c, k = 6.626e-34, 3e8, 1.38e-23; S = []
    for T in [3000, 4000, 5000]:
        lm = l * 1e-6; S.append((f'T = {T} K', l, 2 * h * c ** 2 / lm ** 5 / (np.exp(h * c / (lm * k * T)) - 1) / 1e13))
    return graph('Жылулық сәуле шығару спектрі', 'λ, мкм', 'Сәуле шығару қарқындылығы (шартты)', S)


def c_photoeffect():
    fig, ax = canvas(7, 3.8, (0, 14), (0, 7.6), 'Фотоэффект')
    ax.add_patch(Rectangle((1, 1), 6, 1, fc='#B0BEC5', ec='k')); ax.text(4, 0.4, 'металл', ha='center', fontsize=10)
    for x in [2, 3.5]:
        t = np.linspace(0, 1, 60); ax.plot(x - 1.5 + 1.5 * t, 6 - 4 * t + 0.2 * np.sin(t * 30), color='#8E24AA', lw=1.8)
    ax.text(0.8, 6.3, 'hν', fontsize=13, color='#8E24AA')
    for x in [4.5, 5.5]: ax.add_patch(Circle((x + 1, 4), 0.25, fc='#1E88E5')); arrow(ax, x + 1, 4.3, x + 2, 5.8, c='#1E88E5', lw=1.5)
    ax.text(7.6, 4.5, 'e⁻', fontsize=12, color='#1E88E5')
    ax.text(9.5, 2.5, r'$h\nu = A_{шығ}+\frac{m\upsilon^2}{2}$', fontsize=15, color='#B71C1C', ha='center')
    return fig


def c_penetration():
    fig, ax = canvas(8, 3.4, (0, 16), (0, 6.8), 'α, β, γ сәулелерінің өтімділігі')
    for x, t in [(5, 'қағаз'), (8.5, 'алюминий\n(бірнеше мм)'), (12, 'қорғасын\n(бірнеше см)')]:
        ax.add_patch(Rectangle((x, 0.8), 0.4 if x < 12 else 0.9, 5, fc='#BDBDBD', ec='k')); ax.text(x + 0.3, 0.1, t, ha='center', fontsize=8.5)
    for y, lab, xe, c in [(5, 'α', 5, '#C62828'), (3.5, 'β', 8.5, '#1565C0'), (2, 'γ', 12, '#2E7D32')]:
        ax.text(0.6, y, lab, fontsize=15, weight='bold', color=c, va='center'); arrow(ax, 1.2, y, xe, y, c=c, lw=2.5)
    return fig


def c_rutherford():
    fig, ax = canvas(7, 4, (0, 14), (0, 8), 'Резерфорд тәжірибесі: α-бөлшектердің шашырауы')
    ax.add_patch(Circle((8, 4), 0.25, fc='#C62828'))
    for y in [7, 6, 5.2, 2.8, 2, 1]: arrow(ax, 0.5, y, 13.5, y + (0.3 if y > 4 else -0.3), c='#1565C0', lw=1.2)
    t = np.linspace(0, 1, 40); ax.plot(0.5 + 7 * t, 4.4 + 0 * t, color='#E65100', lw=2); ax.plot(7.5 - 3 * t, 4.4 + 3 * t, color='#E65100', lw=2)
    ax.plot(0.5 + 6.8 * t, 3.6 + 0 * t, color='#6A1B9A', lw=2); ax.plot(7.3 + 4 * t, 3.6 - 2.5 * t, color='#6A1B9A', lw=2)
    ax.text(8.5, 4.4, 'ядро', fontsize=10)
    return fig


def c_nucleus():
    fig, ax = canvas(7, 4, (0, 14), (0, 8), 'Атом ядросының құрамы')
    rng = np.random.default_rng(1)
    for i in range(14):
        ax.add_patch(Circle((4 + rng.uniform(-1.2, 1.2), 4 + rng.uniform(-1.2, 1.2)), 0.5, fc='#EF5350' if i % 2 else '#90A4AE', ec='k'))
    ax.add_patch(Circle((9, 6), 0.4, fc='#EF5350')); ax.text(9.7, 6, 'протон (p⁺)', va='center', fontsize=11)
    ax.add_patch(Circle((9, 4.5), 0.4, fc='#90A4AE')); ax.text(9.7, 4.5, 'нейтрон (n)', va='center', fontsize=11)
    ax.text(9, 2.5, r'$^{A}_{Z}X$:  A = Z + N', fontsize=15, color='#B71C1C')
    return fig


def c_binding():
    A = np.array([2, 4, 12, 16, 56, 90, 120, 160, 200, 238]); E = np.array([1.1, 7.1, 7.7, 8.0, 8.8, 8.7, 8.5, 8.2, 7.9, 7.6])
    return graph('Меншікті байланыс энергиясының массалық санға тәуелділігі', 'Массалық сан A', 'E/A, МэВ', [('', A, E)], notes=[(56, 8.85, 'Fe')])


def c_decay():
    t = np.linspace(0, 4, 100)
    return graph('Радиоактивті ыдырау заңы: N = N₀·2^(−t/T)', 't / T', 'N / N₀', [('', t, 2 ** (-t))], notes=[(1, 0.52, 'T – жартылай ыдырау периоды')])


def c_chain():
    fig, ax = canvas(8, 4, (0, 16), (0, 8), 'Тізбекті ядролық реакция')
    def nuc(x, y): ax.add_patch(Circle((x, y), 0.55, fc='#FFB74D', ec='k'))
    def neu(x, y): ax.add_patch(Circle((x, y), 0.18, fc='#1E88E5'))
    neu(0.6, 4); arrow(ax, 0.8, 4, 1.8, 4, c='#1E88E5', lw=1.5); nuc(2.5, 4)
    for dy in [2.5, 0, -2.5]:
        arrow(ax, 3, 4, 5.2, 4 + dy, c='#1E88E5', lw=1.2); nuc(6, 4 + dy)
        for d2 in [0.9, -0.9]: arrow(ax, 6.5, 4 + dy, 9, 4 + dy + d2, c='#1E88E5', lw=1); nuc(9.6, 4 + dy + d2)
    ax.text(11, 4, '²³⁵U + n → ядро\nсынықтары + 2–3n\n+ энергия', fontsize=11)
    return fig


def c_huygens():
    fig, axs = plt.subplots(1, 3, figsize=(9, 3.4))
    B, R, G = '#1565C0', '#C62828', '#2E7D32'
    t = np.linspace(0, 2 * np.pi, 120)
    # (a) plane front
    a = axs[0]; ys = np.linspace(0.5, 4.5, 6); r = 0.8
    a.plot([1, 1], [0.2, 4.8], color=B, lw=3)
    for y in ys:
        a.plot(1, y, 'o', color=B, ms=5); a.plot(1 + r * np.cos(t[:61] - np.pi / 2), y + r * np.sin(t[:61] - np.pi / 2), color=G, lw=1, ls='--')
    a.plot([1 + r, 1 + r], [0.2, 4.8], color=R, lw=3)
    arrow(a, 2.0, 2.5, 2.8, 2.5, c='#37474F', lw=1.6)
    a.text(0.75, 5.1, 't', ha='center', fontsize=11, color=B, weight='bold'); a.text(2.3, 5.1, 't + Δt', ha='center', fontsize=11, color=R, weight='bold')
    a.set_title('Жазық толқын', fontsize=11, weight='bold')
    # (b) spherical front
    a = axs[1]; R1, r = 1.4, 0.7
    a.plot(0, 0, 'o', color='#37474F', ms=7); a.text(0, -0.45, 'S', ha='center', fontsize=11, weight='bold')
    a.plot(R1 * np.cos(t), R1 * np.sin(t), color=B, lw=2.5)
    for ang in np.linspace(0, 2 * np.pi, 12, endpoint=False):
        cx, cy = R1 * np.cos(ang), R1 * np.sin(ang); a.plot(cx, cy, 'o', color=B, ms=4)
        a.plot(cx + r * np.cos(t), cy + r * np.sin(t), color=G, lw=0.9, ls='--')
    a.plot((R1 + r) * np.cos(t), (R1 + r) * np.sin(t), color=R, lw=2.5)
    a.set_title('Сфералық толқын', fontsize=11, weight='bold')
    # (c) slit
    a = axs[2]
    a.add_patch(Rectangle((1.9, 0), 0.25, 2.1, color='#455A64')); a.add_patch(Rectangle((1.9, 2.9), 0.25, 2.1, color='#455A64'))
    for x in (0.4, 0.9, 1.4): a.plot([x, x], [0.2, 4.8], color=B, lw=2)
    for k, rr in enumerate((0.6, 1.1, 1.6, 2.1)):
        th = np.linspace(-np.pi / 2.4, np.pi / 2.4, 60); a.plot(2.15 + rr * np.cos(th), 2.5 + rr * np.sin(th), color=R, lw=2)
    a.text(2.6, 0.1, 'Саңылау', fontsize=10, color='#455A64')
    a.set_title('Саңылаудан өту', fontsize=11, weight='bold')
    for a in axs: a.set_aspect('equal'); a.axis('off')
    axs[0].set_xlim(0, 3.2); axs[0].set_ylim(0, 5.5); axs[1].set_xlim(-2.4, 2.4); axs[1].set_ylim(-2.4, 2.4); axs[2].set_xlim(0, 4.5); axs[2].set_ylim(0, 5.2)
    fig.text(0.5, 0.02, 'көк – бастапқы фронт;  жасыл үзік – екінші реттік толқындар;  қызыл – жаңа фронт (орауыш)', ha='center', fontsize=9.5, color='#37474F')
    plt.tight_layout(rect=(0, 0.06, 1, 1))
    return fig


def c_tjb():
    return cards('Тоқсандық жиынтық бағалау: жұмыс тәртібі', [('1. Нұсқаулық', 'уақыт: 40 минут\nжауапты таза\nжазу'), ('2. Орындау', 'тапсырмаларды\nретімен\nорында'),
                                                            ('3. Тексеру', 'жауаптарыңды\nқайта қара'), ('4. Тапсыру', 'жұмысты\nуақытында\nтапсыр')])


CUSTOM = {k[2:]: v for k, v in globals().items() if k.startswith('c_')}


def draw(spec, path):
    kind, *args = spec
    if kind == 'cards': fig = cards(*args)
    elif kind == 'formula': fig = formula(*args)
    elif kind == 'graph': fig = graph(*args)
    elif kind == 'flow': fig = flow(*args)
    else: fig = CUSTOM[kind](*args)
    fig.savefig(path, dpi=130); w, h = fig.get_size_inches(); plt.close(fig)
    W = 330 if w >= 7 else 300
    return W, int(W * h / w)
