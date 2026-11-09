import docx, json, re, sys
d = docx.Document(sys.argv[1])
res = {}
def merge_codes(codes):
    out = []
    for x in codes.split('\n'):
        x = re.sub(r'\s+', ' ', x).strip()
        if not x: continue
        if out and not re.match(r'^\d', x): out[-1] += ' ' + x
        else: out.append(x)
    return out

for grade, t in zip(['7','8','9'], d.tables):
    out = []; seen = set(); last_bolim = ''
    for r in t.rows[2:]:
        cells = []
        prev = None
        for c in r.cells:
            if c._tc is prev: continue
            prev = c._tc; cells.append(c.text.strip())
        if len(cells) < 4: continue
        if 'тоқсан' in cells[0] and len(set(cells)) == 1: continue
        # find topic/codes by position from right: [..., bolim, topic, codes, hours, dates...]
        # columns: №, Р/с, bolim, topic, codes, hours, A, B, note
        rowcells = [c.text.strip() for c in r.cells]
        key = tuple(rowcells[2:5])
        bolim, topic, codes = rowcells[2], rowcells[3], rowcells[4]
        if not topic or 'тоқсан' in topic: continue
        bolim = re.sub(r'\s+', ' ', bolim).strip()
        if bolim: last_bolim = bolim
        else: bolim = last_bolim
        out.append({'bolim': bolim, 'topic': re.sub(r'[ \t]+', ' ', topic).strip(),
                    'codes': merge_codes(codes)})
    if grade == '8':
        opt = False
        for o in out:
            if 'Жарықтың түзу' in o['topic']: opt = True
            if opt: o['bolim'] = '8.4 Жарық құбылыстары 16 сағ'
    for i, o in enumerate(out, 1): o['n'] = i
    res[grade] = out
json.dump(res, open('gen/ktzh.json', 'w'), ensure_ascii=False, indent=1)
for g in res:
    print(g, len(res[g]))
    for o in res[g]: print(' ', o['n'], '|', o['bolim'][:35], '|', o['topic'].replace('\n',' / ')[:70], '|', len(o['codes']))
