"""ҚМЖ сапасын тексеру (130-бұйрық нысаны және әдістемелік талаптар бойынша).

    python3 tools/kmzh/audit_kmzh.py            # қысқа есеп
    python3 tools/kmzh/audit_kmzh.py --list X   # X қатесі бар файлдар

Тексерілетіні (әр docx):
  - тақырыптық бөлік: бөлім, педагог, күні, сынып, қатысушылар, тақырып, оқу мақсаттары, сабақтың мақсаты, құндылық;
  - оқу мақсатының коды (7.2.1.1 сияқты) бар ма;
  - сабақтың мақсаты: кемінде 2 өлшенетін мақсат;
  - «Сабақтың барысы» кестесі: 5 баған (кезең/уақыт, педагог, оқушы, бағалау, ресурстар);
  - кезеңдер: басы / ортасы / соңы бар ма, уақыттың қосындысы 45 мин (БЖБ/ТЖБ ескеріледі);
  - әр кезеңде педагог пен оқушы әрекеті, бағалау және ресурс толтырылған ба;
  - бағалауда дескриптор/кері байланыс, саралау (ЕББҚ/қолдау), рефлексия, үй тапсырмасы бар ма;
  - бос орын/артық мәтін (None, TODO), өте ұзын ұяшық.
"""
import collections, glob, json, os, re, sys
import docx

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def cells_text(c):
    return '\n'.join(p.text for p in c.paragraphs).strip()


def audit(path):
    d = docx.Document(path)
    issues = []
    body = '\n'.join(p.text for p in d.paragraphs)
    tables = d.tables
    if not tables:
        return ['кесте жоқ'], {}
    head = {}
    for r in tables[0].rows:
        cs = [cells_text(c) for c in r.cells]
        if cs:
            head[cs[0]] = cs[1:]
    keys = ' '.join(head)
    for need, label in [('Бөлім', 'бөлім'), ('Педагог', 'педагог'), ('Күні', 'күні'), ('Сынып', 'сынып'), ('Сабақтың тақырыбы', 'тақырып'),
                        ('оқыту мақсаттары', 'оқу мақсаттары'), ('Сабақтың мақсаты', 'сабақтың мақсаты'), ('Құндылық', 'құндылық')]:
        if need not in keys:
            issues.append('тақырыптық бөлікте жоқ: ' + label)
    obj = next((v for k, v in head.items() if 'оқыту мақсаттары' in k), [''])
    obj = ' '.join(obj)
    is_rep = re.search(r'ТЖБ|БЖБ|қайталау|қорытынды|Қатемен', ' '.join(head.get('Сабақтың тақырыбы:', [''])), re.I)
    if not re.search(r'\d+\.\d+\.\d+\.\d+', obj) and not is_rep:
        issues.append('оқу мақсатының коды жоқ')
    aims = ' '.join(next((v for k, v in head.items() if 'Сабақтың мақсаты' in k), ['']))
    n_aims = len([x for x in re.split(r'\n|•|;', aims) if len(x.strip()) > 8])
    if n_aims < 2:
        issues.append('сабақтың мақсаты: 2-ден аз')
    # Сабақтың барысы
    flow = None
    for t in tables[1:]:
        hdr = ' '.join(cells_text(c) for c in t.rows[0].cells)
        if 'Педагог' in hdr and 'Оқушы' in hdr:
            flow = t
            break
    stats = {}
    if not flow:
        issues.append('«Сабақтың барысы» кестесі жоқ')
        return issues, stats
    hdr = [cells_text(c) for c in flow.rows[0].cells]
    if len(hdr) < 5 or not any('Бағалау' in h for h in hdr) or not any('Ресурс' in h for h in hdr):
        issues.append('сабақ барысы: бағалау/ресурс бағаны жоқ')
    total = 0
    stages = []
    for r in flow.rows[1:]:
        cs = [cells_text(c) for c in r.cells]
        if len(cs) < 5:
            continue
        st, teacher, student, assess, res = cs[:5]
        m = re.findall(r'(\d+)\s*мин', st)
        mins = int(m[0]) if m else 0
        total += mins
        stages.append(st)
        name = st.split('\n')[0][:30]
        if len(teacher) < 40:
            issues.append(f'педагог әрекеті тым қысқа: {name}')
        if len(student) < 15:
            issues.append(f'оқушы әрекеті тым қысқа: {name}')
        if len(assess) < 5:
            issues.append(f'бағалау бос: {name}')
        if len(res) < 3:
            issues.append(f'ресурс бос: {name}')
        for x in (teacher, student, assess, res):
            if len(x) > 2200:
                issues.append(f'ұяшық тым ұзын: {name}')
    allst = ' '.join(stages)
    for need in ('басы', 'ортасы', 'соңы'):
        if need not in allst:
            issues.append('кезең жоқ: сабақтың ' + need)
    if total and total != 45:
        issues.append(f'уақыт қосындысы {total} мин')
    if not total:
        issues.append('кезеңдерде уақыт көрсетілмеген')
    flow_txt = '\n'.join(cells_text(c) for r in flow.rows for c in r.cells)
    full = body + '\n' + flow_txt
    if not re.search(r'[Дд]ескриптор', full):
        issues.append('дескриптор жоқ')
    if not re.search(r'ЕББҚ|ерекше білім беру|қолдау|саралау|[Сс]аралау', full):
        issues.append('саралау/ЕББҚ жоқ')
    if not re.search(r'[Рр]ефлексия', full):
        issues.append('рефлексия жоқ')
    if not re.search(r'[Үү]й тапсырмасы', full) and not is_rep:
        issues.append('үй тапсырмасы жоқ')
    if re.search(r'\bNone\b|undefined|TODO|nan\b', full):
        issues.append('бөтен мәтін (None/TODO)')
    stats = {'mins': total, 'stages': len(stages), 'chars': len(full), 'pages_est': round(len(full) / 2600, 1)}
    return issues, stats


def main():
    files = sorted(glob.glob(os.path.join(REPO, 'materials', '**', 'kmzh_*.docx'), recursive=True))
    agg = collections.defaultdict(list)
    sizes = []
    for f in files:
        try:
            iss, st = audit(f)
        except Exception as e:
            iss, st = [f'ашылмады: {e}'], {}
        rel = os.path.relpath(f, os.path.join(REPO, 'materials'))
        for i in iss:
            key = re.sub(r':.*', '', i) if i.startswith(('педагог', 'оқушы', 'бағалау', 'ресурс', 'ұяшық')) else i
            agg[key].append(rel + (' — ' + i if key != i else ''))
        if st:
            sizes.append((st['chars'], rel))
    if '--list' in sys.argv:
        k = sys.argv[sys.argv.index('--list') + 1]
        for x in agg.get(k, []):
            print(x)
        return
    print(f'ҚМЖ: {len(files)}')
    for k, v in sorted(agg.items(), key=lambda x: -len(x[1])):
        print(f'{len(v):5d}  {k}   (мыс.: {v[0]})')
    sizes.sort()
    print('ең қысқа:', sizes[:3])
    print('ең ұзын:', sizes[-3:])


if __name__ == '__main__':
    main()
