"""docx ішіндегі қайталанған суреттерді біріктіру (npm docx бір суретті әр қолданған жерге жеке сақтайды).

    python3 tools/kmzh/slim_docx.py materials/**/kmzh_*.docx
Мазмұн өзгермейді: қайталанған медиа өшіріліп, сілтемелер біреуіне бағытталады.
"""
import glob, hashlib, io, re, sys, zipfile


def slim(path):
    raw = open(path, 'rb').read()
    zin = zipfile.ZipFile(io.BytesIO(raw))
    names = zin.namelist()
    media = [n for n in names if n.startswith('word/media/')]
    first, drop = {}, {}
    for n in media:
        h = hashlib.sha1(zin.read(n)).hexdigest()
        if h in first:
            drop[n] = first[h]
        else:
            first[h] = n
    if not drop:
        return 0
    rels_name = 'word/_rels/document.xml.rels'
    rels = zin.read(rels_name).decode('utf-8')
    for n, keep in drop.items():
        rels = rels.replace('Target="media/' + n.split('/')[-1] + '"', 'Target="media/' + keep.split('/')[-1] + '"')
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for it in zin.infolist():
            if it.filename in drop:
                continue
            data = rels.encode('utf-8') if it.filename == rels_name else zin.read(it.filename)
            z.writestr(it, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    out = buf.getvalue()
    open(path, 'wb').write(out)
    return len(raw) - len(out)


if __name__ == '__main__':
    files = [f for a in sys.argv[1:] for f in glob.glob(a, recursive=True)]
    saved = sum(slim(f) for f in files)
    print(f'{len(files)} docx, үнемделді {saved // 1024} КБ')
