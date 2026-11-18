# Re-anchor judgment.draft.json rows (Deepgram phrases) on Scribe words -> judgment.json with from/to.
import json,re,sys,difflib
draft,words_p,out_p=sys.argv[1:4]
W=[w for w in json.load(open(words_p))['words'] if w.get('type','word')=='word']
norm=lambda s: re.sub(r"[^a-z0-9']","",s.lower())
toks=[norm(w['text']) for w in W]
def sec(t): m,s=t.split(':'); return int(m)*60+float(s)
def find(piece,near,win=40):
    q=[norm(x) for x in re.findall(r"[A-Za-z0-9']+",piece)]; q=[x for x in q if x]
    if not q: return None
    idx=[i for i,w in enumerate(W) if abs(w['start']-near)<=win]
    best=None
    for i in idx:
        for L in (len(q)-2,len(q)-1,len(q),len(q)+1,len(q)+2):
            if L<1 or i+L>len(W): continue
            sm=difflib.SequenceMatcher(None,q,toks[i:i+L]); r=sm.ratio()
            r-=abs(W[i]['start']-near)/400
            if not best or r>best[0]: best=(r,i,i+L-1)
    return best
d=json.load(open(draft)); rem=[];report=[]
for r in d['removals']:
    near=sec(r['near'])
    if r['cat']=='head':
        # everything before Michael's 'Hello'
        h=[w for w in W if norm(w['text'])=='hello' and w['start']>20][0]
        rem.append({"cat":"head","from":"0","to":f"{h['start']-0.4:.2f}","reason":f"[{r['id']}] {r['reason']}"}); report.append((r['id'],0,h['start'],1.0));continue
    if r['cat']=='tail':
        g=[i for i,w in enumerate(W) if norm(w['text'])=='recorded' and w['start']>near-60]
        st=W[g[0]-1]['start'] if g else near
        rem.append({"cat":"tail","from":f"{st-0.05:.2f}","to":f"{W[-1]['end']+2:.2f}","reason":f"[{r['id']}] {r['reason']}"}); report.append((r['id'],st,W[-1]['end'],1.0));continue
    pieces=[p for part in r['phrase'].split(' / ') for p in part.split(' ... ')]
    for p in pieces:
        b=find(p,near)
        if not b: continue
        sc,i,j=b
        report.append((r['id'],W[i]['start'],W[j]['end'],round(sc,2),p[:50],' '.join(w['text'] for w in W[i:j+1])[:70]))
        if sc<0.55: continue
        rem.append({"cat":r['cat'],"from":f"{W[i]['start']:.3f}","to":f"{W[j]['end']:.3f}","reason":f"[{r['id']}] {r['reason']}"})
        near=W[j]['end']
out={k:v for k,v in d.items() if k in ('notes',)}
out['removals']=rem
out['notes']=[]
json.dump(out,open(out_p,'w'),indent=1,ensure_ascii=False)
for x in report: print(*x,sep=' | ')
