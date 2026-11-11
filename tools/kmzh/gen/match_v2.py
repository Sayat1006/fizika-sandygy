"""Жаңа нұсқа сабағы → бар спецификация (сол сыныптың ЖМБ нұсқасы) сөз ұқсастығы бойынша"""
import json, re, sys
K = json.load(open('ktzh.json')); K.update(json.load(open('ktzh2.json'))); V2 = json.load(open('ktzh_v2.json'))
STOP = set('және мен бойынша есептер шығару практикалық жұмыс бжб тжб оның олардың үшін арасындағы негізгі заңы заңдары түрлері қолдану қолданылуы'.split())
def toks(t):
    w = re.findall(r'[а-яәғқңөұүһіa-z]+', t.lower().replace('i', 'і'))
    return {x[:6] for x in w if len(x) > 2 and x not in STOP}
def best(topic, pool):
    a = toks(topic); res = []
    for it in pool:
        b = toks(it['topic'])
        if not a or not b: continue
        s = len(a & b) / len(a | b) + 0.3 * len(a & b) / len(a)
        res.append((round(s, 2), it['n'], it['topic']))
    return sorted(res, reverse=True)[:2]
out = {}
for var in V2:
    g = var.split('-')[0]
    for it in V2[var]:
        b = best(it['topic'], K[g])
        out.setdefault(var, []).append((it['n'], it['topic'], b))
json.dump(out, open('/tmp/claude-0/-home-user/f1231f45-31b2-5203-b12d-8effb48fb930/scratchpad/hq/match.json', 'w'), ensure_ascii=False)
for var, rows in out.items():
    if sys.argv[1:] and var not in sys.argv[1:]: continue
    print('==', var)
    for n, t, b in rows:
        s = b[0] if b else (0, 0, '')
        print(f'{n:3} {s[0]:.2f} → {s[1]:3} | {t[:55]:55} | {s[2][:55]}')
