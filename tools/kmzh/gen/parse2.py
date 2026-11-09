import docx, json, re, sys
def cells(r):
    out=[];prev=None
    for c in r.cells:
        if c._tc is prev: continue
        prev=c._tc; out.append(c.text.strip())
    return out
def merge_codes(codes):
    out=[]
    for x in re.split(r'\n|(?<=;)\s+(?=1[01]\.\s?\d)', codes):
        x=re.sub(r'\s+',' ',x).strip()
        if not x: continue
        if out and not re.match(r'^\d',x): out[-1]+=' '+x
        else: out.append(x)
    # dedupe
    seen=[]; [seen.append(c) for c in out if c not in seen]; return seen
def clean(s): return re.sub(r'\s+',' ',s.replace('-\n','').replace('\n',' ')).strip()
res={}
for grade,path,ti,(bi,tpi,ci,di) in [('10',sys.argv[1],2,(2,3,4,6)),('11',sys.argv[2],0,(1,2,3,5))]:
    t=docx.Document(path).tables[ti]; out=[]; last=''
    for r in t.rows:
        c=cells(r)
        if len(c)<=ci or not re.match(r'^\d+(\s*/\s*\d+)?$', c[0].replace('\n','/')): continue
        topic=clean(c[tpi])
        if not topic or 'тоқсан' in topic and 'сағат' in topic: continue
        bolim=clean(c[bi]); codes=[] if 'практикум' in c[ci].lower() else merge_codes(c[ci])
        if bolim: last=bolim
        else: bolim=last
        date=clean(c[di]) if len(c)>di else ''
        out.append({'disp':re.sub(r'\s*/\s*','–',c[0].replace('\n','/')),'bolim':bolim,'topic':topic,'codes':codes,'date':date})
    for i,o in enumerate(out,1): o['n']=i
    res[grade]=out
# fix-ups grade 11
for o in res['11']:
    d=o['disp'].split('–')[0]
    if d.isdigit():
        k=int(d)
        if 49<=k<=56: o['bolim']='Геометриялық оптика'
        if 57<=k<=58: o['bolim']='Салыстырмалы теорияның элементтері'
        if 89<=k<=101 and 'Тоқсандық' not in o['topic']: o['bolim']='Физикалық практикум'
        if k==102: o['bolim']='Қорытынды'
# unique display numbers
for g in res:
    seen={}
    for o in res[g]:
        if o['disp'] in seen: o['disp']+='а'
        seen[o['disp']]=1
json.dump(res,open('gen/ktzh2.json','w'),ensure_ascii=False,indent=1)
for g in res:
    print(g,len(res[g]))
    for o in res[g]: print(' ',o['n'],o['disp'],o['date'],'|',o['bolim'][:30],'|',o['topic'][:70],'|',len(o['codes']))
