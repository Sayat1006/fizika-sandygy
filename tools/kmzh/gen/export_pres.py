# -*- coding: utf-8 -*-
"""Export lesson data for presentations: python3 export_pres.py 7 8 9 -> pres_json/<g>_<nn>.json"""
import json, os, re, sys, importlib
sys.path.insert(0, os.path.dirname(__file__))
import make
from make import *
from PIL import Image
import numpy as np
import figs

EXTRA = [  # keyword -> custom figure spec (first match wins)
 ('архимед', ('archimedes',)), ('жүзу', ('floating',)), ('қатынас ыдыс', ('vessels',)), ('гидравлик', ('hydraulic',)), ('атмосфера', ('torricelli',)),
 ('гидростат', ('liquid_column',)), ('сұйықтар мен газдардағы қысым', ('liquid_column',)), ('қысым', ('pressure_bricks',)), ('гук', ('spring',)), ('серпімд', ('spring',)), ('деформац', ('spring',)),
 ('иінді', ('lever',)), ('момент', ('lever',)), ('жай механизм', ('simple_machines',)), ('пайдалы әрекет', ('simple_machines',)), ('массалық центр', ('center_mass',)), ('массалар центр', ('center_mass',)),
 ('күн жүйесі', ('solar',)), ('ғаламшар', ('kepler',)), ('мезгіл', ('seasons',)), ('күнтізбе', ('seasons',)), ('аспан денелері', ('solar',)),
 ('диффузия', ('particles', 'diffusion')), ('молекула', ('particles', 'states')), ('агрегат', ('particles', 'states')), ('балқу', ('particles', 'states')), ('булану', ('particles', 'states')), ('қайнау', ('particles', 'states')),
 ('температура', ('thermo_scales',)), ('жылуөткізгіш', ('heat_transfer',)), ('жылу берілу', ('heat_transfer',)), ('конвекция', ('heat_transfer',)),
 ('заряд', ('charges',)), ('электрлен', ('charges',)), ('кулон', ('charges',)), ('электр өріс', ('field_lines', 'dipole')), ('потенциал', ('field_lines',)),
 ('тізбектей', ('circuit', 'series')), ('параллель', ('circuit', 'parallel')), ('аралас', ('circuit', 'parallel')), ('кедерг', ('circuit',)), ('ом заңы', ('circuit',)), ('электр тізбег', ('circuit',)), ('ток', ('circuit',)),
 ('тұрақты магнит', ('field_lines', 'magnet')), ('шарғы', ('solenoid',)), ('электромагнит', ('solenoid',)), ('индукция', ('induction',)), ('генератор', ('induction',)), ('қозғалтқыш', ('motor',)),
 ('көлеңке', ('shadow',)), ('түзу сызықты таралу', ('shadow',)), ('шағылу', ('reflection',)), ('толық іштей', ('refraction', True)), ('толық ішкі', ('refraction', True)), ('сыну', ('refraction',)),
 ('айна', ('mirror',)), ('линза', ('lens',)), ('көз', ('eye',)), ('оптикалық аспап', ('lens',)),
 ('вектор', ('vectors',)), ('гидравлик', ('hydraulic',)), ('химиялық әсер', ('circuit',)), ('магнит өріс', ('field_lines', 'magnet')), ('лақтырыл', ('projectile',)), ('шеңбер', ('circular',)), ('центрге тартқыш', ('circular',)), ('кеплер', ('kepler',)), ('параллакс', ('parallax',)), ('аспан сфера', ('celestial',)), ('ендік', ('celestial',)), ('жұлдыз', ('celestial',)),
 ('салмақ', ('elevator',)), ('серік', ('orbit',)), ('тартылыс', ('gravity',)), ('импульс', ('collision',)), ('реактив', ('rocket',)),
 ('резонанс', ('resonance',)), ('электромагнитік тербеліс', ('lc',)), ('электромагниттік тербеліс', ('lc',)), ('маятник', ('pendulum',)), ('тербел', ('oscillation',)), ('еркін түсу', ('projectile',)),
 ('электромагниттік толқын', ('em_scale',)), ('толқын', ('waves',)), ('дыбыс', ('waves',)), ('рентген', ('em_scale',)), ('жылулық сәуле', ('blackbody',)), ('фотоэффект', ('photoeffect',)), ('есептер шығару', None),
 ('радиоактив', ('penetration',)), ('резерфорд', ('rutherford',)), ('массалар ақауы', ('binding',)), ('ядролық күш', ('nucleus',)), ('ядролық реакция', ('decay',)), ('бөлінуі', ('chain',)), ('термоядро', ('nucleus',)), ('элементар', ('nucleus',)),
 ('үйкеліс', ('block_forces', [('F_тарт', 'right', 3), ('F_үйк', 'left', 3), ('mg', 'down', 2), ('N', 'up', 2)], 'Үйкеліс күші')),
 ('ньютон', ('block_forces', [('F', 'right', 3), ('F_үйк', 'left', 1.5), ('mg', 'down', 2), ('N', 'up', 2)], 'Денеге әсер ететін күштер')),
 ('күш', ('block_forces', [('F₁', 'right', 3), ('F₂', 'left', 2)], 'Күштерді қосу')), ('инерция', ('block_forces', [('N', 'up', 2), ('mg', 'down', 2)], 'Тыныштықтағы дене')),
]


def extra_fig(topic, own):
    tl = topic.lower().replace('i', 'і')
    for kw, sp in EXTRA:
        if kw in tl:
            if sp is None: return None
            if own and sp[0] == own[0] and sp[1:] == tuple(own[1:]): return None
            name = 'x_' + '_'.join(str(a) for a in sp if not isinstance(a, list))[:40].replace(' ', '') + '.png'
            p = os.path.join(IMG, name)
            if not os.path.exists(p): figs.draw(sp, p)
            return imgsize(name) + [sp[-1] if isinstance(sp[-1], str) and sp[0] == 'block_forces' else '']
    return None


def r2(v): return [round(float(x), 3) for x in v]


def chart_of(spec_f, topic):
    k = spec_f[0] if spec_f else None
    if k == 'graph':
        t, xl, yl, ser = spec_f[1:5]
        if spec_f[6:7] == (True,) or (len(spec_f) > 6 and spec_f[6]):
            return dict(type='bar', title=t, xl=xl, yl=yl, labels=[str(x) for x in ser[0][1]], series=[dict(name=ser[0][0] or yl, values=r2(ser[0][2]))])
        xs = ser[0][1]
        return dict(type='line', title=t, xl=xl, yl=yl, labels=[f'{x:g}' if isinstance(x, (int, float)) else str(x) for x in xs],
                    series=[dict(name=s_[0] or yl, values=r2(s_[2])) for s_ in ser if len(s_[1]) == len(xs)])
    t = np.linspace(0, 4, 41)
    tl = topic.lower().replace('i', 'і')
    if k == 'oscillation' or ('тербел' in tl and 'электромагнит' not in tl):
        return dict(type='line', title='Гармониялық тербеліс x(t) = A·cos(ωt)', xl='t, с', yl='x, см', labels=[f'{x:.1f}' for x in t], series=[dict(name='x(t)', values=r2(5 * np.cos(np.pi * t))), dict(name='υ(t) (шартты)', values=r2(-5 * np.sin(np.pi * t)))])
    if k == 'decay' or 'ыдырау' in tl:
        return dict(type='line', title='Радиоактивті ыдырау: N = N₀·2^(−t/T)', xl='t / T', yl='N / N₀, %', labels=[f'{x:.1f}' for x in t], series=[dict(name='N/N₀', values=r2(100 * 2 ** (-t)))])
    if k == 'resonance' or 'резонанс' in tl:
        w = np.linspace(0.2, 2, 37)
        return dict(type='line', title='Резонанс қисықтары', xl='ω / ω₀', yl='Амплитуда', labels=[f'{x:.2f}' for x in w], series=[dict(name='аз үйкеліс', values=r2(1 / np.sqrt((1 - w ** 2) ** 2 + (0.15 * w) ** 2))), dict(name='көп үйкеліс', values=r2(1 / np.sqrt((1 - w ** 2) ** 2 + (0.5 * w) ** 2)))])
    if k == 'binding' or 'байланыс энерг' in tl:
        A = [2, 4, 12, 16, 56, 90, 120, 160, 200, 238]; E = [1.1, 7.1, 7.7, 8.0, 8.8, 8.7, 8.5, 8.2, 7.9, 7.6]
        return dict(type='line', title='Меншікті байланыс энергиясы', xl='A', yl='E/A, МэВ', labels=[str(a) for a in A], series=[dict(name='E/A', values=E)])
    if k == 'blackbody' or 'жылулық сәуле' in tl:
        l = np.linspace(0.2, 2.6, 25); h, c, kb = 6.626e-34, 3e8, 1.38e-23
        return dict(type='line', title='Жылулық сәуле шығару спектрі', xl='λ, мкм', yl='Қарқындылық (шартты)', labels=[f'{x:.1f}' for x in l],
                    series=[dict(name=f'{T} K', values=r2(2 * h * c ** 2 / (l * 1e-6) ** 5 / (np.exp(h * c / (l * 1e-6 * kb * T)) - 1) / 1e13)) for T in (3000, 4000, 5000)])
    if k == 'projectile' or 'лақтырыл' in tl:
        tt = np.linspace(0, 1.2, 13); x = 10 * tt; y = 7.2 - 4.9 * tt ** 2
        return dict(type='line', title='Горизонталь лақтырылған дене: y(x)', xl='x, м', yl='y, м', labels=[f'{v:.0f}' for v in x], series=[dict(name='y', values=r2(np.maximum(y, 0)))])
    if 'тығыздық' in tl:
        return dict(type='bar', title='Кейбір заттардың тығыздығы', xl='', yl='ρ, кг/м³', labels=['Мұз', 'Су', 'Алюминий', 'Темір', 'Мыс', 'Қорғасын'], series=[dict(name='ρ', values=[900, 1000, 2700, 7800, 8900, 11300])])
    if 'гук' in tl or 'серпімд' in tl:
        return dict(type='line', title='Гук заңы: F = kΔl', xl='Δl, см', yl='F, Н', labels=['0', '1', '2', '3', '4', '5'], series=[dict(name='k = 50 Н/м', values=[0, 0.5, 1, 1.5, 2, 2.5]), dict(name='k = 100 Н/м', values=[0, 1, 2, 3, 4, 5])])
    if 'гидростат' in tl:
        return dict(type='line', title='Гидростатикалық қысымның тереңдікке тәуелділігі', xl='h, м', yl='p, кПа', labels=['0', '2', '4', '6', '8', '10'], series=[dict(name='су', values=[0, 20, 40, 60, 80, 100]), dict(name='керосин', values=[0, 16, 32, 48, 64, 80])])
    if 'ом заңы' in tl or 'ток күшінің кернеуге' in tl:
        return dict(type='line', title='Вольт-амперлік сипаттама I(U)', xl='U, В', yl='I, А', labels=['0', '2', '4', '6', '8'], series=[dict(name='R = 4 Ом', values=[0, 0.5, 1, 1.5, 2]), dict(name='R = 8 Ом', values=[0, 0.25, 0.5, 0.75, 1])])
    if 'балқу' in tl or 'қайнау' in tl:
        return dict(type='line', title='Заттың қызу графигі (мұз → су → бу)', xl='Q (шартты)', yl='t, °C', labels=[str(i) for i in range(0, 19)], series=[dict(name='t', values=[-20, -10, 0, 0, 0, 0, 0, 0, 20, 40, 60, 80, 100, 100, 100, 100, 100, 100, 100])])
    if 'теңайнымалы' in tl or 'үдеу' in tl and 'центрге' not in tl:
        return dict(type='line', title='Теңайнымалы қозғалыс υ(t)', xl='t, с', yl='υ, м/с', labels=['0', '1', '2', '3', '4', '5'], series=[dict(name='a = 2 м/с²', values=[0, 2, 4, 6, 8, 10]), dict(name='a = −2 м/с²', values=[10, 8, 6, 4, 2, 0])])
    if 'қуат' in tl and 'ток' not in tl:
        return dict(type='bar', title='Әртүрлі қозғалтқыштардың қуаты', xl='', yl='N, кВт', labels=['Адам', 'Ат', 'Мотоцикл', 'Жеңіл көлік', 'Жүк көлігі'], series=[dict(name='N', values=[0.1, 0.74, 20, 100, 300])])
    if 'отын' in tl:
        return dict(type='bar', title='Отындардың меншікті жану жылуы', xl='', yl='q, МДж/кг', labels=['Ағаш', 'Көмір', 'Спирт', 'Газ', 'Бензин', 'Сутегі'], series=[dict(name='q', values=[10, 27, 27, 44, 46, 120])])
    return None


def formulas(theory):
    out = []
    for t in theory:
        if '=' in t and len(t.replace('**', '')) <= 90: out.append(t)
    return out[:4] if len(out) >= 2 else []

OUT = os.path.join(ROOT, 'pres_json'); os.makedirs(OUT, exist_ok=True)


def imgsize(name):
    p = os.path.join(IMG, name)
    if not os.path.exists(p): return None
    w, h = Image.open(p).size
    return [name, w, h]


for g in sys.argv[1:]:
    specs = {}
    for part in sorted(f for f in os.listdir(os.path.join(ROOT, 'gen')) if re.match(rf'g{g}[a-z]?\.py$', f)):
        specs.update(importlib.import_module(part[:-3]).S)
    items = KTZH[g]
    for idx, item in enumerate(items):
        n = item['n']; spec = specs[n]; topic = clean_topic(item['topic'])
        kind = spec.get('kind') or kind_of(topic)
        if kind == 'tjb': continue
        disp = item.get('disp') or (n if (g == '7' or n <= 52) else ('52а' if n == 53 else n - 1))
        bjb = re.search(r'БЖБ\s*№\s*(\d+)', topic)
        r = idx + int(g) * 5
        op = OPENERS[r % len(OPENERS)]
        nw = NEW[(r * 5 + 3) % len(NEW)]
        if spec.get('ph') and kind == 'new' and (r % 3 == 0): nw = NEW[2]
        if not spec.get('ph') and nw[0].startswith('PhET'): nw = NEW[(r * 5 + 4) % len(NEW)]
        pr = PRACTICE[(r * 3 + 1) % len(PRACTICE)]
        en = ENERGIZERS[(r * 3) % len(ENERGIZERS)]
        co = CONSOLIDATE[(r * 3 + 2) % len(CONSOLIDATE)]
        rf = REFLECT[(r * 7 + 5) % len(REFLECT)]
        sen1, sen2 = SEN[r % len(SEN)], SEN[(r + 3) % len(SEN)]
        dm = re.match(r'^(\d{1,2})\.(\d{2})', item.get('date', '') or '')
        mon = int(dm.group(2)) if dm else None
        val, quote = VALUES[mon if mon in VALUES else month_of(n)]
        prev = clean_topic(items[idx - 1]['topic']) if idx else 'Физика пәніне кіріспе'
        if kind_of(prev) == 'tjb' and idx > 1: prev = clean_topic(items[idx - 2]['topic'])
        d = f'{disp:02d}' if isinstance(disp, int) else (disp.zfill(2) if disp[:1].isdigit() and not disp[1:2].isdigit() else disp)
        ph = spec.get('ph')
        data = dict(
            g=g, n=n, disp=d, file=f'Презентация_{g}-сынып_{d}_{slug(topic)}.pptx', kind=kind, bjb=bjb.group(1) if bjb else None,
            bolim=clean_bolim(item['bolim']), topic=topic, codes=spec.get('codes') or item['codes'] or ['Тоқсанда өткен оқу мақсаттарын қайталау'],
            smart=spec.get('s', []), value=val, quote=quote, prev=prev,
            opener=op[0], opener_text=re.sub(r'\*\*[^*]*\*\*\s*', '', op[1](prev)[0]), hook=spec['h'], theory=spec['t'],
            fig=imgsize(f'g{g}_{n:02d}.png'), fc=spec.get('fc', ''), newm=nw[0], newm_text=nw[1],
            practice=L(spec.get('p', ['**Тапсырма:** тақырыптың негізгі формулаларын «Формула – шама – бірлік – мысал» кестесіне жүйелеп, бір үлгі есепті жұппен шығарыңдар.'])), prm=pr[0], prm_text=pr[1],
            energizer=en, a=L(spec['a']), b=L(spec['b']), c=L(spec['c']), key=spec.get('k', ['', '', '']), quiz=spec['q'], hw=spec['hw'],
            cons=co[0], cons_url=co[1], cons_qr=co[2], refl=rf[0], refl_text=rf[1], sen=[sen1, sen2],
            ph=ph, ph_url=(PHET + ph) if ph else None, ph_qr=qr(f'qr_phet_{ph}.png', PHET + ph) if ph else None,
            equip=spec.get('e'), steps=spec.get('st'), table=spec.get('tb'),
            chart=chart_of(spec.get('f'), topic), extra=extra_fig(topic, spec.get('f')), formulas=formulas(spec['t']))
        qr(co[2], co[1])
        json.dump(data, open(os.path.join(OUT, f'{g}_{n:02d}.json'), 'w'), ensure_ascii=False)
    print(g, 'done')
