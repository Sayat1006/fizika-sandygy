"""ҚМЖ v2 figures (pilot lessons). Each fn(path) -> (w_px, h_px) display size in the docx."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, Polygon, Arc, FancyArrowPatch, Ellipse
import numpy as np

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['mathtext.fontset'] = 'dejavusans'
BLUE, ORANGE, GREEN, RED, PURPLE, GREY = '#1565C0', '#E65100', '#2E7D32', '#C62828', '#6A1B9A', '#455A64'


def save(fig, path, w):
    fig.savefig(path, dpi=180, bbox_inches='tight', facecolor='white')
    W, H = fig.get_size_inches()
    plt.close(fig)
    from PIL import Image
    im = Image.open(path); return w, round(w * im.height / im.width)


def arrow(ax, x0, y0, x1, y1, c=RED, lw=2, ms=14):
    ax.annotate('', xy=(x1, y1), xytext=(x0, y0), arrowprops=dict(arrowstyle='-|>', lw=lw, color=c, mutation_scale=ms))


# ---------- 7 №19 Тығыздықты есептеу ----------
def density_triangle(path):
    fig, ax = plt.subplots(figsize=(7.2, 3.2)); ax.axis('off'); ax.set_xlim(0, 22); ax.set_ylim(0, 10)
    ax.add_patch(Polygon([[1, 1], [9, 1], [5, 8.6]], closed=True, fc='#E3F2FD', ec=BLUE, lw=2.5))
    ax.plot([2.9, 7.1], [4.6, 4.6], color=BLUE, lw=2); ax.plot([5, 5], [1, 4.6], color=BLUE, lw=2)
    ax.text(5, 6.2, 'm', fontsize=26, ha='center', weight='bold', color=RED)
    ax.text(3.6, 2.6, 'ρ', fontsize=26, ha='center', weight='bold', color=GREEN)
    ax.text(6.4, 2.6, 'V', fontsize=26, ha='center', weight='bold', color=ORANGE)
    rows = [('Тығыздық', r'$\rho = \dfrac{m}{V}$', GREEN), ('Масса', r'$m = \rho \cdot V$', RED), ('Көлем', r'$V = \dfrac{m}{\rho}$', ORANGE)]
    for i, (t, f, c) in enumerate(rows):
        y = 8 - i * 3
        ax.add_patch(FancyBboxPatch((10.6, y - 1.1), 10.6, 2.3, boxstyle='round,pad=0.12', fc='white', ec=c, lw=1.8))
        ax.text(11.2, y, t, fontsize=12.5, va='center', color=c, weight='bold')
        ax.text(17.6, y, f, fontsize=17, va='center', ha='center')
    ax.text(5, 0.2, 'Ізделетін шаманы саусақпен жап — қалғаны формула', fontsize=9.5, ha='center', color=GREY, style='italic')
    return save(fig, path, 520)


def density_bars(path):
    sub = [('Пробка', 240), ('Ағаш (қарағай)', 520), ('Мұз', 900), ('Су', 1000), ('Шыны', 2500), ('Алюминий', 2700), ('Болат', 7800), ('Мыс', 8900), ('Қорғасын', 11300)]
    fig, ax = plt.subplots(figsize=(7.4, 3.3))
    names = [s[0] for s in sub]; vals = [s[1] for s in sub]
    cols = [GREEN if v < 1000 else (BLUE if v == 1000 else ORANGE) for v in vals]
    b = ax.barh(names, vals, color=cols, height=0.62)
    for r, v in zip(b, vals): ax.text(v + 150, r.get_y() + r.get_height() / 2, f'{v}', va='center', fontsize=9.5)
    ax.axvline(1000, color=BLUE, ls='--', lw=1.2)
    ax.set_xlabel('ρ, кг/м³', fontsize=10.5); ax.set_xlim(0, 12800); ax.invert_yaxis()
    ax.spines[['top', 'right']].set_visible(False); ax.tick_params(labelsize=9.5)
    ax.set_title('Кейбір заттардың тығыздығы (жасыл — суда қалқиды)', fontsize=11.5, weight='bold')
    return save(fig, path, 560)


def density_mV_graph(path):
    fig, ax = plt.subplots(figsize=(5.6, 3.8))
    V = np.linspace(0, 50, 2)
    ax.plot(V, 2.7 * V, color=ORANGE, lw=2.6, label='1-зат')
    ax.plot(V, 1.0 * V, color=BLUE, lw=2.6, label='2-зат')
    ax.plot(V, 0.8 * V, color=GREEN, lw=2.6, label='3-зат')
    ax.plot([20, 20, 0], [0, 54, 54], color=GREY, ls=':', lw=1.2)
    ax.plot([40, 40, 0], [0, 40, 40], color=GREY, ls=':', lw=1.2)
    ax.scatter([20, 40], [54, 40], color='black', zorder=5, s=22)
    ax.set_xlim(0, 50); ax.set_ylim(0, 140); ax.set_xticks(range(0, 51, 10)); ax.set_yticks(range(0, 141, 20))
    ax.grid(alpha=.35); ax.set_xlabel('V, см³'); ax.set_ylabel('m, г')
    ax.legend(loc='upper left', fontsize=9.5, frameon=False)
    ax.set_title('m(V) графигі: көлбеулігі — тығыздық', fontsize=11.5, weight='bold')
    return save(fig, path, 380)


def density_cylinder(path):
    fig, ax = plt.subplots(figsize=(6.6, 4.4)); ax.axis('off'); ax.set_xlim(0, 20); ax.set_ylim(-3.2, 11); ax.set_aspect('equal')
    for x0, lvl, body, lab in [(2.2, 4.8, False, 'V₁ = 60 мл'), (13.0, 6.8, True, 'V₂ = 80 мл')]:
        ax.add_patch(Rectangle((x0, 0.8), 4, lvl - 0.8, fc='#BBDEFB', ec='none'))
        ax.plot([x0, x0, x0 + 4, x0 + 4], [9.8, 0.8, 0.8, 9.8], color=GREY, lw=2)
        for k in range(1, 9):
            y = 0.8 + k; ax.plot([x0, x0 + (0.9 if k % 2 == 0 else 0.5)], [y, y], color=GREY, lw=1)
            if k % 2 == 0: ax.text(x0 - 0.3, y, f'{k * 10 + 20}', fontsize=8, ha='right', va='center', color=GREY)
        ax.plot([x0, x0 + 4], [lvl, lvl], color=BLUE, lw=1.6)
        ax.text(x0 + 2, 10.4, lab, ha='center', fontsize=11, weight='bold', color=BLUE)
        if body:
            ax.add_patch(Rectangle((x0 + 1.2, 1.1), 1.6, 1.6, fc='#FFB74D', ec=ORANGE, lw=1.6))
            ax.plot([x0 + 2, x0 + 2], [2.7, 10.2], color='#8D6E63', lw=1)
    arrow(ax, 7.2, 5, 11.4, 5, c=GREEN)
    ax.text(9.3, 5.7, 'денені батыру', ha='center', fontsize=9.5, color=GREEN)
    ax.text(10, -1.0, r'$V_{дене} = V_2 - V_1 = 80 - 60 = 20$ см³', ha='center', fontsize=11)
    ax.text(10, -2.6, r'$m = 54$ г  →  $\rho = m/V = 2{,}7$ г/см³', ha='center', fontsize=11)
    return save(fig, path, 470)


# ---------- 8 №36 Ом заңы зертханалық ----------
def ohm_circuit(path):
    fig, ax = plt.subplots(figsize=(6.4, 3.8)); ax.axis('off'); ax.set_xlim(0, 20); ax.set_ylim(0, 12); ax.set_aspect('equal')
    k = dict(color='black', lw=2)
    ax.plot([2, 2], [2, 10], **k); ax.plot([2, 18], [10, 10], **k); ax.plot([18, 18], [10, 2], **k); ax.plot([2, 18], [2, 2], **k)
    # battery (left)
    ax.plot([2, 2], [5.2, 6.8], color='white', lw=4)
    ax.plot([1.2, 2.8], [6.6, 6.6], color='black', lw=2.2); ax.plot([1.6, 2.4], [5.4, 5.4], color='black', lw=4)
    ax.text(0.6, 6.0, 'ε', fontsize=14, ha='center', va='center'); ax.text(3.2, 6.9, '+', fontsize=11); ax.text(3.2, 4.9, '–', fontsize=12)
    # key (top-left)
    ax.plot([4.5, 6.3], [10, 10], color='white', lw=4); ax.plot([4.5, 6.2], [10, 10.9], **k)
    ax.add_patch(Circle((4.5, 10), 0.18, fc='black')); ax.add_patch(Circle((6.3, 10), 0.18, fc='white', ec='black', lw=1.5)); ax.text(5.4, 11.2, 'K', fontsize=11, ha='center')
    # ammeter (top)
    ax.add_patch(Circle((9.5, 10), 0.95, fc='white', ec='black', lw=2)); ax.text(9.5, 10, 'A', fontsize=14, ha='center', va='center', weight='bold')
    # resistor (top-right)
    ax.add_patch(Rectangle((12.6, 9.55), 3.0, 0.9, fc='white', ec='black', lw=2)); ax.text(14.1, 11.0, 'R', fontsize=13, ha='center', weight='bold')
    # voltmeter parallel to R
    ax.plot([12.2, 12.2, 16.0, 16.0], [10, 7.4, 7.4, 10], color=BLUE, lw=1.8)
    ax.add_patch(Circle((14.1, 7.4), 0.95, fc='white', ec=BLUE, lw=2)); ax.text(14.1, 7.4, 'V', fontsize=14, ha='center', va='center', weight='bold', color=BLUE)
    for x in (12.2, 16.0): ax.add_patch(Circle((x, 10), 0.14, fc='black'))
    # rheostat (bottom)
    ax.add_patch(Rectangle((8.2, 1.55), 4.0, 0.9, fc='white', ec='black', lw=2)); arrow(ax, 9.0, 0.4, 11.4, 3.1, c='black', lw=1.6, ms=12)
    ax.text(10.2, 3.5, 'Rₖ (реостат)', fontsize=10, ha='center')
    return save(fig, path, 400)


def ohm_vac(path):
    fig, ax = plt.subplots(figsize=(5.6, 3.8))
    U = np.array([0, 1, 2, 3, 4, 5])
    for R, c, lab in [(4, ORANGE, 'R₁ = 4 Ом'), (8, BLUE, 'R₂ = 8 Ом')]:
        I = U / R
        noise = np.array([0, .02, -.015, .02, -.01, .015]) if R == 4 else np.array([0, -.01, .012, -.008, .01, -.012])
        ax.plot(U, I, color=c, lw=2.2, label=lab); ax.scatter(U[1:], (I + noise)[1:], color=c, s=26, zorder=5)
    ax.set_xlabel('U, В'); ax.set_ylabel('I, А'); ax.set_xlim(0, 5.5); ax.set_ylim(0, 1.4); ax.grid(alpha=.35)
    ax.legend(frameon=False, fontsize=9.5, loc='upper left')
    ax.annotate('көлбеулігі үлкен →\nкедергі аз', xy=(3.6, 0.9), xytext=(3.7, 0.25), fontsize=9, color=GREY, arrowprops=dict(arrowstyle='->', color=GREY))
    ax.set_title('Вольт-амперлік сипаттама I(U)', fontsize=11.5, weight='bold')
    return save(fig, path, 380)


def ohm_triangle(path):
    fig, ax = plt.subplots(figsize=(5.4, 2.6)); ax.axis('off'); ax.set_xlim(0, 18); ax.set_ylim(0, 8.6)
    ax.add_patch(Polygon([[0.6, 0.6], [7.4, 0.6], [4, 7.6]], closed=True, fc='#FFF3E0', ec=ORANGE, lw=2.4))
    ax.plot([2.2, 5.8], [3.9, 3.9], color=ORANGE, lw=2); ax.plot([4, 4], [0.6, 3.9], color=ORANGE, lw=2)
    ax.text(4, 5.1, 'U', fontsize=22, ha='center', weight='bold', color=BLUE)
    ax.text(2.9, 1.8, 'I', fontsize=22, ha='center', weight='bold', color=RED)
    ax.text(5.1, 1.8, 'R', fontsize=22, ha='center', weight='bold', color=GREEN)
    ax.text(8.6, 6.4, r'$I = \dfrac{U}{R}$', fontsize=17)
    ax.text(8.6, 3.6, r'$U = I \cdot R$', fontsize=17)
    ax.text(8.6, 1.0, r'$R = \dfrac{U}{I}$', fontsize=17)
    ax.text(14.4, 6.4, '[А]', fontsize=12, color=GREY); ax.text(14.4, 3.6, '[В]', fontsize=12, color=GREY); ax.text(14.4, 1.0, '[Ом]', fontsize=12, color=GREY)
    return save(fig, path, 330)


# ---------- 11 ҚГБ Айнымалы ток генераторы ----------
def gen_scheme(path):
    fig, ax = plt.subplots(figsize=(7.2, 3.9)); ax.axis('off'); ax.set_xlim(0, 24); ax.set_ylim(-1.6, 13); ax.set_aspect('equal')
    ax.add_patch(FancyBboxPatch((0.6, 3.0), 3.2, 7.0, boxstyle='round,pad=0.1', fc='#EF5350', ec=RED, lw=2)); ax.text(2.2, 6.5, 'N', fontsize=22, color='white', ha='center', va='center', weight='bold')
    ax.add_patch(FancyBboxPatch((14.2, 3.0), 3.2, 7.0, boxstyle='round,pad=0.1', fc='#42A5F5', ec=BLUE, lw=2)); ax.text(15.8, 6.5, 'S', fontsize=22, color='white', ha='center', va='center', weight='bold')
    for y in (4.2, 5.4, 6.5, 7.6, 8.8): arrow(ax, 4.2, y, 13.8, y, c='#90A4AE', lw=1, ms=9)
    ax.text(9.0, 11.2, 'B (магнит өрісі)', fontsize=10, ha='center', color=GREY)
    ax.add_patch(Polygon([[6.6, 3.6], [11.4, 4.6], [11.4, 9.6], [6.6, 8.6]], closed=True, fc='#FFE0B2', ec=ORANGE, lw=2.6, alpha=.9))
    ax.text(9.0, 6.6, 'рамка\n(орама)', ha='center', va='center', fontsize=10, color=ORANGE, weight='bold')
    ax.add_patch(Arc((9.0, 2.0), 5.4, 1.6, theta1=200, theta2=340, color=GREEN, lw=2)); arrow(ax, 11.4, 1.6, 11.9, 1.95, c=GREEN, ms=12)
    ax.text(5.6, 0.2, 'айналу (турбина, жел, су)', ha='center', fontsize=9.5, color=GREEN)
    ax.plot([9.0, 9.0], [3.9, 1.2], color=GREY, lw=2)
    ax.plot([9.0, 19.5], [1.6, 1.6], color=GREY, lw=2)
    for x in (19.4, 20.4): ax.add_patch(Ellipse((x, 1.6), 0.5, 1.6, fc='#B0BEC5', ec=GREY, lw=1.5))
    ax.text(19.9, -1.3, 'сақиналар мен щеткалар', fontsize=9, ha='center', color=GREY)
    ax.plot([20.4, 22.8, 22.8], [1.6, 1.6, 6.0], color='black', lw=1.6); ax.plot([19.4, 19.4, 21.6, 21.6], [0.8, 0.2, 0.2, 6.0], color='black', lw=1.6)
    ax.add_patch(Circle((22.2, 7.2), 1.0, fc='#FFF59D', ec='#F9A825', lw=2)); ax.text(22.2, 7.2, '💡' if False else '~', fontsize=18, ha='center', va='center')
    ax.plot([21.6, 21.6], [6.0, 6.4], color='black', lw=1.6); ax.plot([22.8, 22.8], [6.0, 6.4], color='black', lw=1.6)
    ax.text(22.2, 8.8, 'тұтынушы', fontsize=9.5, ha='center')
    return save(fig, path, 540)


def gen_emf(path):
    fig, ax = plt.subplots(figsize=(7.0, 3.3))
    t = np.linspace(0, 0.04, 600); e = 311 * np.sin(2 * np.pi * 50 * t)
    ax.plot(t * 1000, e, color=ORANGE, lw=2.4)
    ax.axhline(0, color='black', lw=0.8)
    ax.axhline(311, color=GREY, ls=':', lw=1); ax.text(41, 330, 'εₘₐₓ ≈ 311 В', va='bottom', ha='center', fontsize=9.5, color=GREY)
    ax.annotate('', xy=(40, -385), xytext=(20, -385), arrowprops=dict(arrowstyle='<->', color=BLUE, lw=1.6))
    ax.text(30, -360, 'T = 0,02 с  (ν = 50 Гц)', ha='center', fontsize=9.5, color=BLUE)
    for tt, y, lab in [(0, 40, '0°'), (5, 335, '90°'), (10, 40, '180°'), (15, -365, '270°'), (20, 40, '360°')]:
        ax.text(tt + (0.8 if tt == 0 else 0), y, lab, ha='center', fontsize=8.5, color=PURPLE)
    ax.set_xlim(0, 46); ax.set_ylim(-410, 420); ax.set_xlabel('t, мс'); ax.set_ylabel('ε, В')
    ax.spines[['top', 'right']].set_visible(False)
    ax.set_title('Генератордың ЭҚК-і: ε = εₘₐₓ·sin(ωt)', fontsize=11.5, weight='bold')
    return save(fig, path, 520)


def gen_chain(path):
    steps = [('Энергия көзі', 'көмір, су ағыны,\nжел, бу', '#ECEFF1', GREY), ('Турбина', 'механикалық\nайналу', '#E8F5E9', GREEN),
             ('Генератор', 'электромагниттік\nиндукция', '#FFF3E0', ORANGE), ('Трансформатор', 'кернеуді\nарттыру', '#E3F2FD', BLUE),
             ('ЭБЖ', 'алысқа\nжеткізу', '#F3E5F5', PURPLE), ('Үй, мектеп', '220 В,\n50 Гц', '#FFFDE7', '#F9A825')]
    fig, ax = plt.subplots(figsize=(10.4, 2.3)); ax.axis('off'); ax.set_xlim(0, 36); ax.set_ylim(0, 7)
    for i, (h, b, fc, ec) in enumerate(steps):
        x = i * 6 + 0.2
        ax.add_patch(FancyBboxPatch((x, 0.6), 5.0, 5.6, boxstyle='round,pad=0.1', fc=fc, ec=ec, lw=1.8))
        ax.text(x + 2.5, 4.9, h, ha='center', fontsize=9 if len(h) > 11 else 10, weight='bold', color=ec)
        ax.text(x + 2.5, 2.4, b, ha='center', va='center', fontsize=8.2)
        if i < len(steps) - 1: arrow(ax, x + 5.2, 3.4, x + 6.0, 3.4, c=GREY, lw=1.6, ms=11)
    return save(fig, path, 600)


def ohm_blank(path):
    fig, ax = plt.subplots(figsize=(5.6, 3.8))
    ax.set_xlim(0, 6); ax.set_ylim(0, 1.6); ax.set_xticks(np.arange(0, 6.1, 1)); ax.set_yticks(np.arange(0, 1.61, 0.2))
    ax.set_xticks(np.arange(0, 6.01, 0.2), minor=True); ax.set_yticks(np.arange(0, 1.601, 0.04), minor=True)
    ax.grid(which='major', color='#E57373', lw=0.8); ax.grid(which='minor', color='#FFCDD2', lw=0.4)
    ax.set_xlabel('U, В'); ax.set_ylabel('I, А'); ax.set_title('I(U) графигі (толтыруға)', fontsize=11.5, weight='bold')
    return save(fig, path, 380)


ALL = {
    'd7_triangle': density_triangle, 'd7_bars': density_bars, 'd7_graph': density_mV_graph, 'd7_cyl': density_cylinder,
    'o8_circuit': ohm_circuit, 'o8_blank': ohm_blank, 'o8_vac': ohm_vac, 'o8_tri': ohm_triangle,
    'g11_scheme': gen_scheme, 'g11_emf': gen_emf, 'g11_chain': gen_chain,
}

if __name__ == '__main__':
    import os, sys
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for k, f in ALL.items():
        print(k, f(os.path.join(out, k + '.png')))
