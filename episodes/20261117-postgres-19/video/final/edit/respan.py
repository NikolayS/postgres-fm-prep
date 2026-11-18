import json,re,sys
md,edl_p,words_p,judg_p=sys.argv[1:5]
W=[w for w in json.load(open(words_p))['words'] if w.get('type','word')=='word']
edl=json.load(open(edl_p)); rows={r['id']:r for r in edl['removals']}
lines=open(md).read().split('\n')
hints={};reasons={}
for i,l in enumerate(lines):
    m=re.match(r'- (r\d+) \S+: "(.*)" - (.*)$',l) or re.match(r'- (r\d+) \S+: "(.*)',l)
    if m:
        rid=m.group(1)
        reasons[rid]=l
        if i+1<len(lines) and 'clean cut points' in lines[i+1]:
            hints[rid]=lines[i+1].split('):',1)[1].strip()
j=json.load(open(judg_p)); changed=[]
norm=lambda s: re.sub(r"[^a-z0-9]","",s.lower())
for rid,l in reasons.items():
    r=rows.get(rid)
    if not r or not re.search(r'\[c\d\d\]',r.get('reason','')): continue
    jr=[x for x in j['removals'] if x['reason']==r['reason'].split('; ')[0] or x['reason'] in r['reason']]
    jr=[x for x in jr if abs(float(x['from'])-r['start'])<0.6]
    if not jr: continue
    jr=jr[0]
    if 'laugh in the cut' in l: jr['cutLaugh']=True; changed.append((rid,'cutLaugh')); continue
    h=hints.get(rid)
    if not h: continue
    near=[w for w in W if w['end']>r['start']-2.5 and w['start']<r['end']+2.5]
    toks=[t for t in h.split(' ') if t and not re.fullmatch(r'\[[a-z ]+\]',t)]
    toks=[t.replace('[','').replace(']','') for t in toks]; toks=[t for t in toks if t]
    # walk tokens, mark boundary after word index k when next token is '||'
    k=-1;b=set()
    for t in toks:
        if t=='||': b.add(k); continue
        k+=1
    if k+1!=len(near): changed.append((rid,'align-fail',k+1,len(near))); continue
    bounds=[(near[i]['end']+near[i+1]['start'])/2 for i in sorted(b) if i+1<len(near)]
    idx={(near[i]['end']+near[i+1]['start'])/2:i for i in sorted(b) if i+1<len(near)}
    s_c=[x for x in bounds if r['start']-0.7<=x<=r['end']-0.2]
    e_c=[x for x in bounds if r['start']+0.2<=x<=r['end']+0.7]
    if not s_c or not e_c: changed.append((rid,'no-bound')); continue
    s=min(s_c,key=lambda x:abs(x-r['start'])); e=min(e_c,key=lambda x:abs(x-r['end']))
    if e<=s: changed.append((rid,'empty')); continue
    a=near[idx[s]+1]; z=near[idx[e]]
    jr['from']=f"{a['start']:.3f}"; jr['to']=f"{z['end']:.3f}"
    txt=' '.join(w['text'] for w in near[idx[s]+1:idx[e]+1])
    changed.append((rid,'respan',r['reason'][:5],txt[:90]))
json.dump(j,open(judg_p,'w'),indent=1)
for c in changed: print(*c,sep=' | ')
