# python3 tryb.py 8 <outdir> — банктің әр тапсырмасын 3 сид бойынша тексеру, сызбаларын svg ретінде сақтау
import importlib, random, sys, os
g = sys.argv[1]; out = sys.argv[2]; os.makedirs(out, exist_ok=True)
B = importlib.import_module('bank' + g).BANK; seen = set(); k = 0
for sec, gens in B.items():
    for fn in gens:
        if fn.__name__ in seen: continue
        seen.add(fn.__name__)
        for s in range(3):
            t = fn(random.Random(s))
            assert t['parts'] and all(p['ans'] for p in t['parts']), fn.__name__
            if s == 0:
                print(f"{fn.__name__}: {t['stem'][:70]} | " + ' || '.join(p['ans'][:50] for p in t['parts']))
                if t['fig']: open(f'{out}/{k:02d}_{fn.__name__}.svg', 'w').write(t['fig']); k += 1
