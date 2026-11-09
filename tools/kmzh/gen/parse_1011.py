import docx, json, re, datetime
def merge_codes(codes):
    out = []
    for x in codes.split('\n'):
        x = re.sub(r'\s+', ' ', x).strip()
        if not x: continue
        if out and not re.match(r'^\d', x): out[-1] += ' ' + x
        else: out.append(x)
    return out
def norm_date(s):
    m = re.search(r'(\d{1,2})\.(\d{2})', s)
    if not m: return ''
    d, mo = int(m.group(1)), int(m.group(2)); y = 2026 if mo >= 9 else 2027
    try: datetime.date(y, mo, d); return f'{d:02d}.{mo:02d}.{y}'
    except ValueError: return ''
res = json.load(open('gen/ktzh.json'))
for g, f, ti, cols in [('10', 'ktzh10.docx', 2, (0, 2, 3, 4, 6)), ('11', 'ktzh11.docx', 0, (0, 1, 2, 3, 5))]:
    t = docx.Document(f).tables[ti]; out = []; last = ''
    for r in t.rows:
        cells = []; prev = None
        for c in r.cells:
            if c._tc is prev: continue
            prev = c._tc; cells.append(c.text.strip())
        if len(cells) <= max(cols): continue
        no, bol, top, cod, dat = (cells[i] for i in cols)
        if not top or 'тоқсан' in top.lower() and 'жиынтық' not in top.lower() and 'қайталау' not in top.lower(): continue
        if not re.match(r'^\d', no.strip()): continue
        bol = re.sub(r'\s+', ' ', bol.replace('\n', ' ')).strip()
        if bol: last = bol
        else: bol = last
        no = re.sub(r'\s*/\s*', '–', re.sub(r'\n+', '/', no.strip()))
        out.append({'no': no, 'bolim': bol, 'topic': re.sub(r'\s+', ' ', top.replace('\n', ' / ')).strip(),
                    'codes': merge_codes(cod), 'date': norm_date(dat.split('\n')[0])})
    seen = {}
    for i, o in enumerate(out, 1):
        o['n'] = i
        if o['no'] in seen: o['no'] += 'а'
        seen[o['no']] = 1
    res[g] = out
json.dump(res, open('gen/ktzh.json', 'w'), ensure_ascii=False, indent=1)
for g in ['10', '11']:
    print(g, len(res[g]))
    for o in res[g]: print(' ', o['n'], o['no'], o['date'], '|', o['bolim'][:30], '|', o['topic'][:70], '|', len(o['codes']))
