"""Оқушының жұмыс парағы (PDF) — көрнекі презентациямен (materials/decks/*.json, ver 3) бір мазмұнда.

    python3 tools/ws/build_ws.py              # барлық 615 сабақ
    python3 tools/ws/build_ws.py 8-5 9-33     # тек осылар
    python3 tools/ws/build_ws.py --html 8-5   # тексеру үшін HTML (scratch қалтасына)

Құрылымы (2 бет + мұғалімге жауап беті):
  1. Ойлан! — сабақтың сұрағы (суретімен)        4. Тест — 4 сұрақ (A–D)
  2. Сәйкестендір — ұғым ↔ анықтама               5. Суретпен жұмыс — сабақтың суреті
  3. Формула — шамалардың атауы мен бірлігі       6. A / B / C деңгейлі тапсырмалар
  7. Рефлексия (сабақтағы әдіспен) және үйге: PhET QR-коды
Суреттер — tools/deck/art/*.png (презентациямен бірдей). Қаріп: Carlito (TrueType — PDF шағын, қазақ әріптері толық).
Нәтиже: materials/{папка}/ws_NNN.pdf, manifest.json (ws), lessons.json (ws: true), previews.json + public/pv (Қарау).
"""
import base64, glob, hashlib, html, io, json, os, random, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
ART = os.path.join(REPO, 'tools', 'deck', 'art')
SECRET = 'sabaqtas-pv-7f3a91'
GC = {7: ('#0E7C86', '#E3F4F5'), 8: ('#3949AB', '#E8EAF8'), 9: ('#C2410C', '#FCEDE4'), 10: ('#1F6FD0', '#E4EFFC'), 11: ('#8E3BB8', '#F3E8FA')}
LV = {'A': ('Түсінемін', '#17A05D'), 'B': ('Қолданамын', '#F08C00'), 'C': ('Талдаймын', '#D6336C')}
_IMG = {}


def esc(t):
    return html.escape(str(t))


def rich(t):
    """**қалың** және төменгі индекс (c_су, E_{k})"""
    t = esc(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(.)\u20d7', r'<span class="vec">\1</span>', t)  # p⃗ — вектор белгісі
    return re.sub(r'(?<=[^\W_]|\))_(\{[^}]*\}|[^\W_]+)', lambda m: '<sub>' + m.group(1).strip('{}') + '</sub>', t)


def img(aid, w=560):
    """презентация суретін PDF-ке шағын JPEG етіп қосу"""
    if aid not in _IMG:
        p = os.path.join(ART, aid + '.png')
        if not os.path.exists(p):
            _IMG[aid] = None
        else:
            im = Image.open(p).convert('RGB')
            im.thumbnail((w, w))
            b = io.BytesIO(); im.save(b, 'JPEG', quality=70, optimize=True, progressive=True)
            _IMG[aid] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
    return _IMG[aid]


def lines(n):
    return '<div class="ln">' + '<i></i>' * n + '</div>'


def shorten(t, n):
    t = re.sub(r'\s+', ' ', t.replace('**', '')).strip()
    if len(t) <= n:
        return t
    return t[:n].rsplit(' ', 1)[0].rstrip(',;:–—') + '…'


def task(num, title, level, body, cls=''):
    return (f'<section class="t {cls}"><header><span class="n">{num}</span><span class="tt">{title}</span>'
            f'<span class="lv">{level}</span></header><div class="b">{body}</div></section>')


ICONS = {
    'star': '<path d="M50 6l13 28 30 3-23 20 7 30-27-16-27 16 7-30L7 37l30-3z" fill="#ffc21f"/>',
    'wish': '<path d="M50 12c12 18 30 26 30 44a30 30 0 0 1-60 0c0-18 18-26 30-44z" fill="#1f8bff"/>',
    'note': '<rect x="18" y="8" width="64" height="84" rx="8" fill="#fff" stroke="#8a93a3" stroke-width="6"/><path d="M30 32h40M30 50h40M30 68h26" stroke="#8a93a3" stroke-width="6"/>',
    'idea': '<circle cx="50" cy="42" r="30" fill="#ffc21f"/><rect x="38" y="70" width="24" height="18" rx="4" fill="#8a93a3"/>',
    'plus': '<circle cx="50" cy="50" r="44" fill="#17a05d"/><path d="M50 28v44M28 50h44" stroke="#fff" stroke-width="10"/>',
    'minus': '<circle cx="50" cy="50" r="44" fill="#e5483a"/><path d="M28 50h44" stroke="#fff" stroke-width="10"/>',
}
COL = {'g': '#17a05d', 'y': '#ffb020', 'r': '#e5483a'}


def icon(k):
    base, _, mod = k.partition('-')
    if base in ICONS:
        body = ICONS[base]
    elif base in ('leaf', 'light', 'face'):
        body = f'<circle cx="50" cy="50" r="40" fill="{COL.get(mod, "#17a05d")}"/>'
        if base == 'face':
            body += {'g': '<path d="M30 58q20 22 40 0" stroke="#fff" stroke-width="7" fill="none"/>', 'y': '<path d="M32 64h36" stroke="#fff" stroke-width="7"/>',
                     'r': '<path d="M30 70q20 -20 40 0" stroke="#fff" stroke-width="7" fill="none"/>'}[mod] + '<circle cx="36" cy="40" r="6" fill="#fff"/><circle cx="64" cy="40" r="6" fill="#fff"/>'
    elif base == 'target':
        body = ''.join(f'<circle cx="50" cy="50" r="{r}" fill="{"#e5483a" if j == 3 - int(mod or 1) else ("#fff" if j % 2 else "#ffd0cc")}" stroke="#e5483a" stroke-width="4"/>' for j, r in enumerate((44, 30, 16)))
    else:  # num, step
        body = f'<circle cx="50" cy="50" r="42" fill="#1f6fd0"/><text x="50" y="66" text-anchor="middle" font-size="46" font-weight="800" fill="#fff" font-family="Carlito">{esc(mod)}</text>'
    return f'<svg viewBox="0 0 100 100">{body}</svg>'


def build_html(D, man_key, compact=0):
    g = int(D['grade'])
    main, soft = GC.get(g, GC[8])
    S = D['slides']
    get = lambda t: [s for s in S if s['t'] == t]
    cover = get('cover')[0]
    rnd = random.Random(f"{D['v']}-{D['n']}")
    keys = []  # мұғалімге жауаптар
    parts = []
    num = 0

    # 1. Ойлан!
    ask = (get('ask') or [None])[0]
    if ask:
        num += 1
        a = img(ask.get('art') or cover['art'], 420)
        parts.append(task(num, 'Ойлан!', 'Түсіну', f'<div class="row"><div class="grow"><p class="q">{rich(ask["q"])}</p>{lines(2)}</div>'
                          + (f'<img class="pic sm" src="{a}">' if a else '') + '</div>'))

    # 2. Сәйкестендір: ұғым ↔ анықтама
    ideas = [s for s in get('idea') if (s.get('text') or s.get('list'))]
    pairs, seen = [], set()
    for s in ideas:
        if s['title'].lower() in seen:
            continue
        seen.add(s['title'].lower())
        t = s.get('text') or s['list'][0]
        if len(s['title']) <= 60 and s['title'].lower() not in t.lower()[:len(s['title']) + 2]:
            pairs.append((s['title'], shorten(t, 120)))
    pairs = pairs[:4]
    if len(pairs) >= 2:
        num += 1
        order = list(range(len(pairs))); rnd.shuffle(order)
        if order == sorted(order):
            order = order[1:] + order[:1]
        L = 'АБВГ'
        left = ''.join(f'<li><b>{i + 1}.</b> {rich(p[0])}</li>' for i, p in enumerate(pairs))
        right = ''.join(f'<li><b>{L[j]}.</b> {rich(pairs[o][1])}</li>' for j, o in enumerate(order))
        boxes = ''.join(f'<span class="box">{i + 1} — <i></i></span>' for i in range(len(pairs)))
        parts.append(task(num, 'Сәйкестендір', 'Білу', f'<p class="hint">Ұғымды оның анықтамасымен сәйкестендір.</p><div class="match"><ol class="l">{left}</ol><ol class="r">{right}</ol></div><div class="boxes">{boxes}</div>'))
        keys.append(('Сәйкестендір', ', '.join(f'{i + 1} — {L[order.index(i)]}' for i in range(len(pairs)))))

    # 3. Формула
    fs = get('bigf')
    if fs:
        f = fs[0]
        num += 1
        rows = ''
        for i, (sym, name, unit) in enumerate(f['parts']):
            hide = i % 2 == 1  # әр екінші шаманың атауы мен бірлігін оқушы толтырады
            rows += f'<tr><td class="sym">{rich(sym)}</td><td>{"<i></i>" if hide else esc(name)}</td><td>{"<i></i>" if hide else esc(unit)}</td></tr>'
        parts.append(task(num, 'Формуланы оқы', 'Білу', f'<div class="row"><div class="fml">{rich(f["f"])}</div><table class="ft"><tr><th>Белгі</th><th>Шама</th><th>Бірлігі</th></tr>{rows}</table></div>'))
        keys.append(('Формула ' + f['f'], '; '.join(f'{p[0]} — {p[1]}, {p[2]}' for p in f['parts'])))

    # 4. Тест
    quiz = D.get('quiz') or []
    if quiz:
        num += 1
        qs = ''
        for i, (q, opts, ok) in enumerate(quiz[:4]):
            os_ = ''.join(f'<span class="o"><i>{"ABCD"[j]}</i>{rich(o)}</span>' for j, o in enumerate(opts))
            qs += f'<li><p>{rich(q)}</p><div class="opts">{os_}</div></li>'
        parts.append(task(num, 'Тест', 'Түсіну', f'<p class="hint">Дұрыс жауапты дөңгелекпен белгіле.</p><ol class="quiz">{qs}</ol>'))
        keys.append(('Тест', ', '.join(f'{i + 1} — {"ABCD"[q[1].index(q[2])] if q[2] in q[1] else "?"}' for i, q in enumerate(quiz[:4]))))

    # 5. Суретпен жұмыс (сабақтың мұқабадан басқа суреті)
    arts = [s['art'] for s in get('idea') if s.get('art') and s['art'] != (ask or {}).get('art')]
    pa = arts[0] if arts else cover['art']
    p = img(pa, 440)
    if p and not compact:
        num += 1
        parts.append(task(num, 'Суретпен жұмыс', 'Талдау', f'<div class="row"><img class="pic" src="{p}"><div class="grow"><p>1. Суретте қандай құбылыс бейнеленген?</p>{lines(2)}'
                          f'<p>2. Суреттегі белгілеулерді (бағыттама, жазу) түсіндір.</p>{lines(2)}</div></div>'))

    # 6. Деңгейлік тапсырмалар
    for j in get('job'):
        num += 1
        nm, col = LV[j['level']]
        h = {'A': 2, 'B': 3, 'C': 4}[j['level']] - (1 if compact > 1 else 0)
        parts.append(task(num, f'{j["level"]} деңгейі', nm, f'<p class="q">{rich(j["q"])}</p>{lines(h)}', f'lv{j["level"]}'))
        keys.append((f'{j["level"]} деңгейі', j['answer']))

    # 7. Рефлексия + үйге
    st = (get('stars') or [None])[0]
    refl = ''
    if st:
        its = [(('wish' if i == len(st['items']) - 1 else 'star'), x) if isinstance(x, str) else x for i, x in enumerate(st['items'])]
        refl = (f'<section class="refl"><h3>Рефлексия · {esc(st["title"])}</h3><div class="ri">'
                + ''.join(f'<div class="r1">{icon(k)}<span>{esc(t)}</span><i></i></div>' for k, t in its) + '</div></section>')
    link = (get('link') or [None])[0]
    home = (get('home') or [None])[0]
    extra = ''
    if link and link.get('qr') or home:
        hw = ''.join(f'<li><b class="hl hl{lv}">{lv}</b> {rich(t)}</li>' for lv, t in (home['items'] if home else []))
        qr = f'<div class="qr"><img src="{link["qr"]}"><small>Үйде виртуалды<br>зертханада тексер</small></div>' if link and link.get('qr') else ''
        extra = f'<section class="home"><div class="grow"><h3>Үй тапсырмасы</h3><ul>{hw}</ul></div>{qr}</section>'

    head = (f'<header class="hd"><div class="num">{D["n"]}</div><div><small>ЖҰМЫС ПАРАҒЫ · {g}-СЫНЫП · {esc(cover["kicker"].split("·")[-1].strip().upper())}</small>'
            f'<h1>{esc(cover["title"])}</h1></div></header>'
            '<div class="who"><span>Аты-жөні: <i class="w"></i></span><span>Сынып: <i></i></span><span>Күні: <i></i></span></div>')
    key = ''.join(f'<p><b>{esc(a)}:</b> {rich(b)}</p>' for a, b in keys)
    body = (head + ''.join(parts) + refl + extra
            + f'<section class="key"><h2>Мұғалімге: жауаптар</h2><p class="kt">{esc(D["topic"])}</p>{key}</section>')
    return f'<!doctype html><html lang="kk"><head><meta charset="utf-8"><style>:root{{--m:{main};--s:{soft}}}{CSS}</style></head><body>{body}</body></html>'


CSS = """
@page { size: A4; }
* { box-sizing: border-box; }
body { margin: 0; font: 11pt/1.36 Carlito, 'DejaVu Sans', sans-serif; color: #1b2230; }
b { font-weight: 700; } sub { font-size: 70%; }
.hd { display: flex; gap: 12px; align-items: center; background: var(--m); color: #fff; border-radius: 14px; padding: 10px 14px; }
.hd .num { flex: none; width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,.2); display: grid; place-items: center; font: 700 20pt Carlito; }
.hd small { font: 700 7.5pt Carlito; letter-spacing: .06em; opacity: .85; }
.hd h1 { margin: 2px 0 0; font: 700 15pt/1.15 Carlito; }
.who { display: flex; gap: 14px; margin: 9px 2px 4px; font-size: 9.5pt; color: #4a5263; }
.who span { display: flex; gap: 6px; flex: 1; } .who span:first-child { flex: 2.2; }
.who i { flex: 1; border-bottom: 1px solid #9aa4b2; }
.t { border: 1.2px solid #dfe3ea; border-radius: 12px; margin-top: 7px; break-inside: avoid; overflow: hidden; }
.t header { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--s); }
.t .n { width: 22px; height: 22px; border-radius: 7px; background: var(--m); color: #fff; display: grid; place-items: center; font: 700 10pt Carlito; }
.t .tt { font: 700 11pt Carlito; flex: 1; color: var(--m); }
.t .lv { font: 700 7.5pt Carlito; text-transform: uppercase; letter-spacing: .05em; color: #fff; background: var(--m); border-radius: 99px; padding: 2px 8px; }
.t.lvA header { background: #e6f6ed; } .t.lvA .n, .t.lvA .lv { background: #17A05D; } .t.lvA .tt { color: #17A05D; }
.t.lvB header { background: #fff3e0; } .t.lvB .n, .t.lvB .lv { background: #F08C00; } .t.lvB .tt { color: #c46f00; }
.t.lvC header { background: #fce8ef; } .t.lvC .n, .t.lvC .lv { background: #D6336C; } .t.lvC .tt { color: #D6336C; }
.t .b { padding: 6px 12px 8px; }
.q { margin: 0 0 2px; font-weight: 700; }
.hint { margin: 0 0 6px; color: #5a6475; font-size: 9pt; }
.ln i { display: block; height: 7.8mm; border-bottom: .7pt solid #c9d0da; }
.row { display: flex; gap: 12px; align-items: flex-start; } .grow { flex: 1; min-width: 0; }
.pic { width: 52mm; border-radius: 10px; flex: none; } .pic.sm { width: 40mm; }
.match { display: grid; grid-template-columns: 1fr 1.6fr; gap: 10px; }
.match ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.match li { background: #f5f7fa; border-radius: 8px; padding: 5px 8px; font-size: 9.5pt; }
.match .l li { font-weight: 700; }
.boxes { display: flex; gap: 10px; margin-top: 7px; font-weight: 700; }
.box { display: flex; align-items: center; gap: 4px; } .box i { display: inline-block; width: 22px; height: 20px; border: 1.2px solid #9aa4b2; border-radius: 5px; }
.fml { flex: none; min-width: 52mm; font: italic 600 17pt 'DejaVu Serif', serif; padding: 6px 4px; align-self: center; text-align: center; }
.ft { flex: 1; border-collapse: collapse; font-size: 9.5pt; }
.ft th { text-align: left; font: 700 8pt Carlito; color: #5a6475; border-bottom: 1.2px solid #dfe3ea; padding: 3px 6px; }
.ft td { border-bottom: 1px solid #edf0f4; padding: 4px 6px; height: 7mm; } .ft .sym { font: italic 700 11pt 'DejaVu Serif', serif; width: 14mm; }
.ft i { display: block; border-bottom: 1px solid #9aa4b2; height: 4mm; }
.quiz { margin: 0; padding-left: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
.quiz li { break-inside: avoid; } .quiz p { margin: 0 0 3px; font-weight: 700; font-size: 9.8pt; }
.opts { display: flex; flex-direction: column; gap: 2px; font-size: 9.3pt; }
.o { display: flex; gap: 6px; align-items: baseline; } .o i { flex: none; width: 15px; height: 15px; border: 1.2px solid #8a93a3; border-radius: 50%; font: 700 7pt Carlito; display: inline-grid; place-items: center; font-style: normal; }
.refl, .home { border: 1.2px solid #c9d0da; border-radius: 12px; margin-top: 9px; padding: 8px 12px; break-inside: avoid; }
.refl h3, .home h3 { margin: 0 0 6px; font: 700 10.5pt Carlito; color: var(--m); }
.ri { display: flex; gap: 8px; } .r1 { flex: 1; display: flex; align-items: center; gap: 6px; font-size: 8.8pt; line-height: 1.2; }
.r1 svg { width: 22px; height: 22px; flex: none; } .r1 i { flex: none; width: 13px; height: 13px; border: 1.2px solid #8a93a3; border-radius: 3px; margin-left: auto; }
.home { display: flex; gap: 12px; align-items: center; } .home ul { list-style: none; margin: 0; padding: 0; font-size: 9.5pt; }
.home li { margin: 2px 0; } .hl { display: inline-grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; color: #fff; font: 700 8pt Carlito; }
.hlA { background: #17A05D; } .hlB { background: #F08C00; } .hlC { background: #D6336C; }
.qr { text-align: center; flex: none; } .qr img { width: 24mm; height: 24mm; display: block; } .qr small { font-size: 7.5pt; color: #5a6475; }
.vec { position: relative; display: inline-block; } .vec::after { content: '→'; position: absolute; left: 0; right: 0; top: -.62em; text-align: center; font: normal .7em Carlito, sans-serif; }
.key { break-before: page; } .key h2 { font: 700 15pt Carlito; color: var(--m); margin: 0 0 4px; }
.key .kt { color: #5a6475; margin: 0 0 10px; } .key p { margin: 0 0 7px; font-size: 10pt; }
"""

JS = r"""
const fs = require('fs'); const { chromium } = require('playwright');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [h, pdf, label] of jobs) {
    await p.goto('file://' + h, { waitUntil: 'load' });
    await p.pdf({ path: pdf, format: 'A4', printBackground: true, margin: { top: '11mm', bottom: '13mm', left: '11mm', right: '11mm' },
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font:8px Carlito,sans-serif;color:#8a93a3;padding:0 11mm;display:flex;justify-content:space-between"><span>${label}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>` });
  }
  await b.close();
})();
"""


def previews(path, pdf):
    h = hashlib.sha256((SECRET + path).encode()).hexdigest()[:20]
    d = os.path.join(REPO, 'public/pv', h)
    os.makedirs(d, exist_ok=True)
    for f in glob.glob(os.path.join(d, '*.webp')):
        os.remove(f)
    files = []
    with tempfile.TemporaryDirectory() as t:
        subprocess.run(['pdftoppm', '-scale-to-x', '1000', '-scale-to-y', '-1', '-png', pdf, os.path.join(t, 'p')], check=True, stderr=subprocess.DEVNULL)
        for i, p in enumerate(sorted(glob.glob(os.path.join(t, 'p*.png'))), 1):
            im = Image.open(p).convert('RGB')
            fn = f"{i}-{hashlib.sha256((SECRET + path + str(i)).encode()).hexdigest()[:10]}.webp"
            im.save(os.path.join(d, fn), 'WEBP', quality=80, method=4)
            files.append(fn)
    return {'dir': h, 'files': files, 'w': im.width, 'h': im.height}


def main(args):
    html_only = '--html' in args
    only = {a for a in args if not a.startswith('--')}
    man = json.load(open(os.path.join(REPO, 'materials/manifest.json'), encoding='utf-8'))
    decks = sorted(glob.glob(os.path.join(REPO, 'materials/decks/*.json')))
    tmp = tempfile.mkdtemp(prefix='ws-')
    jobs, meta, decks_used = [], [], []
    for dp in decks:
        key = os.path.basename(dp)[:-5]
        if only and key not in only:
            continue
        v, n = key.rsplit('-', 1)
        e = man.get(f'{v}:{n}')
        if not e:
            continue
        D = json.load(open(dp, encoding='utf-8'))
        g = int(D['grade'])
        folder = os.path.dirname(e['kmzh']['path']) if e.get('kmzh') else str(g)
        path = e.get('ws', {}).get('path') or f'{folder}/ws_{int(n):03d}.pdf'
        slug = re.sub(r'[^\w]+', '_', D['topic']).strip('_')[:60]
        name = e.get('ws', {}).get('name') or f'Жұмыс_парағы_{g}-сынып_{int(n):02d}_{slug}.pdf'
        h = os.path.join(tmp, key + '.html')
        open(h, 'w', encoding='utf-8').write(build_html(D, f'{v}:{n}'))
        jobs.append([h, os.path.join(REPO, 'materials', path), f'Сабақтас · Физика · {g}-сынып · Жұмыс парағы'])
        meta.append((v, n, path, name)); decks_used.append(D)
    if html_only:
        print('\n'.join(j[0] for j in jobs)); return
    def render(js_jobs):
        chunks = [js_jobs[i::4] for i in range(4)]
        def run(ch):
            if not ch:
                return
            jf = tempfile.mktemp(suffix='.json', dir=tmp); json.dump(ch, open(jf, 'w'))
            js = os.path.join(tmp, 'r.js'); open(js, 'w').write(JS)
            subprocess.run(['node', js, jf], check=True)
        with ThreadPoolExecutor(4) as ex:
            list(ex.map(run, chunks))

    def npages(pdf):
        return int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))

    render(jobs)
    # оқушы бөлігі 2 беттен асса — ықшамдап қайта жасаймыз (алдымен суретпен жұмыс алынады, сосын жолдар азаяды)
    for level in (1, 2):
        over = [(j, d) for j, d in zip(jobs, decks_used) if npages(j[1]) > 3]
        if not over:
            break
        for j, D in over:
            open(j[0], 'w', encoding='utf-8').write(build_html(D, '', level))
        render([j for j, _ in over])
        print(f'ықшамдалды ({level}): {len(over)}')
    pj = os.path.join(REPO, 'materials/previews.json')
    prev = json.load(open(pj, encoding='utf-8'))
    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(lambda m: previews(m[2], os.path.join(REPO, 'materials', m[2])), meta))
    added = set()
    for (v, n, path, name), pv in zip(meta, res):
        prev[f'{v}:{n}:ws'] = pv
        if 'ws' not in man[f'{v}:{n}']:
            added.add((v, int(n)))
        man[f'{v}:{n}']['ws'] = {'path': path, 'name': name}
    json.dump(prev, open(pj, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(man, open(os.path.join(REPO, 'materials/manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if added:
        lp = os.path.join(REPO, 'public/lessons.json')
        L = json.load(open(lp, encoding='utf-8'))
        for x in L:
            if (x['v'], x['n']) in added:
                x['ws'] = True
        json.dump(L, open(lp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'жұмыс парағы: {len(meta)} (жаңа: {len(added)})')


if __name__ == '__main__':
    main(sys.argv[1:])
