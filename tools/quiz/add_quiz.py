"""Әр сабақтың анимациялы презентациясына (materials/decks/*.json) тест сұрақтарын қосады.

    python3 tools/quiz/add_quiz.py

Сұрақтар ұғымдар банкінен (bank_a/b/c.py) алынады: сабақ тақырыбына сәйкес келетін 1–2 ұғымнан
4 сұрақ (A/B/C/D, дұрыс жауабы белгілі). Тақырып ешбір ұғымға сәйкес келмесе (қайталау,
қорытынды т.б.) — бөлім ұғымдары немесе алдыңғы сабақтардың ұғымдары алынады.
Тақтада: «Сынып» панелі → «Сабақтың тесті»; телефонда — батырмалар.
"""
import glob, hashlib, json, os, random, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from bank_a import C as A
from bank_b import C as B
from bank_c import C as Cc

REPO = os.path.dirname(os.path.dirname(HERE))
DECKS = os.path.join(REPO, 'materials', 'decks')
BANK = A + B + Cc
BY = {c[0]: c for c in BANK}
assert len(BY) == len(BANK), 'ұғым id қайталанады'
PER = 4

# Бөлімді қайталау сабақтары: тақырыпта нақты ұғым жоқ, бірақ бөлім аталған
SECTIONS = [
    (r'механика бөлім', ['kinem_accel', 'newton2', 'momentum', 'energy_mech']),
    (r'динамика негіздері', ['newton2', 'newton3', 'gravitation', 'momentum']),
    (r'жылу физикасы|молекулалық физика', ['mkt', 'gas_law', 'thermo1', 'thermo2']),
    (r'электростатика', ['charge', 'efield', 'capacitor', 'full_ohm']),
    (r'электромагнетизм', ['magnet', 'ampere_lorentz', 'induction', 'self_induction']),
    (r'жарық құбылыстар', ['reflection', 'refraction', 'lens', 'eye_optics']),
    (r'тербелістер және толқындар', ['oscill', 'waves_mech', 'sound', 'em_waves']),
    (r'астрономия негіздері', ['sky', 'kepler', 'astro7']),
    (r'кванттық физика', ['photoeffect', 'light_nature', 'lasers']),
    (r'тербелістер', ['oscill', 'em_oscill', 'resonance']),
]


def key(t):
    return re.sub(r'[^\wәғқңөұүһі]+', ' ', t.lower()).strip()


def concepts(topic):
    """Тақырыпқа сәйкес ұғымдар. Барлық сәйкестіктерден ұзындары басым (қиылыспайтындары
    қалады), ұғымдар тақырыптағы орны бойынша реттеледі."""
    k = key(topic)
    spans = []
    for i, (cid, rx, _) in enumerate(BANK):
        for m in re.finditer(rx, k):
            if m.end() > m.start():
                spans.append((m.end() - m.start(), -i, m.start(), m.end(), cid))
    spans.sort(reverse=True)
    taken = []
    for ln, _, s, e, cid in spans:
        if all(e <= s2 or s >= e2 for s2, e2, _ in taken):
            taken.append((s, e, cid))
    first = {}
    for s, _, cid in taken:
        first[cid] = min(s, first.get(cid, s))
    out = sorted(first, key=first.get)
    for rx, cs in SECTIONS:
        if not out and re.search(rx, k):
            out = cs
    return out


def pick(cs, n, seed):
    """cs ұғымдарынан PER сұрақ: тең бөліп, сабақ нөміріне қарай әр түрлі сұрақтар."""
    cs = cs[:PER]
    share = [PER // len(cs) + (1 if i < PER % len(cs) else 0) for i in range(len(cs))]
    out = []
    for c, k in zip(cs, share):
        qs = BY[c][2]
        off = (n * 2) % len(qs)
        out += [qs[(off + j) % len(qs)] for j in range(k)]
    rnd = random.Random(seed)
    res = []
    for q, ok, *bad in out:
        opts = [ok] + bad
        rnd.shuffle(opts)
        res.append([q, opts, ok])
    return res


def main():
    files = sorted(glob.glob(os.path.join(DECKS, '*.json')))
    by_var = {}
    for f in files:
        v, n = os.path.basename(f)[:-5].rsplit('-', 1)
        by_var.setdefault(v, []).append((int(n), f))
    stat = {'match': 0, 'section': 0, 'prev': 0}
    for v, items in by_var.items():
        items.sort()
        hist = []  # алдыңғы сабақтардың негізгі ұғымдары
        for n, f in items:
            D = json.load(open(f, encoding='utf-8'))
            cs = concepts(D['topic'])
            if cs and any(re.search(rx, key(D['topic'])) for rx, _ in SECTIONS) and not any(re.search(BY[c][1], key(D['topic'])) for c in cs):
                stat['section'] += 1
            elif cs:
                stat['match'] += 1
            else:
                seen = []
                for c in reversed(hist):
                    if c not in seen:
                        seen.append(c)
                    if len(seen) == PER:
                        break
                cs = seen or ['science']
                stat['prev'] += 1
            if any(re.search(BY[c][1], key(D['topic'])) for c in cs):
                hist += cs[:1]
            seed = int(hashlib.md5(f'{v}-{n}'.encode()).hexdigest()[:8], 16)
            D['quiz'] = pick(cs, n, seed)
            json.dump(D, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('тест қосылды:', len(files), stat)


if __name__ == '__main__':
    main()
