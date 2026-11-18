import json,re,sys
from pathlib import Path
# Usage: chapters.py words.json [cuts.json] [cold-open seconds] [HH:MM:SS links ...]
words_p=sys.argv[1]
cuts_p=sys.argv[2] if len(sys.argv)>2 else str(Path(__file__).with_name('edited-v2.cuts.json'))
CO=float(sys.argv[3]) if len(sys.argv)>3 else 0
W=[w for w in json.load(open(words_p))['words'] if w.get('type','word')=='word']
seg=json.load(open(cuts_p))['segmentTimes']
n=lambda s: re.sub(r"[^a-z0-9]","",s.lower())
def find(phrase,near,win=30):
    q=[n(x) for x in phrase.split()]; best=None
    for i in range(len(W)-len(q)):
        if abs(W[i]['start']-near)>win: continue
        if all(n(W[i+k]['text'])==q[k] for k in range(len(q))):
            d=abs(W[i]['start']-near)
            if best is None or d<best[0]: best=(d,W[i]['start'])
    if not best: raise SystemExit(f"not found: {phrase} near {near}")
    return best[1]
def ed(src):
    for s in seg:
        if src<s['srcStart']-0.02: return s['outStart']   # inside a cut: next kept piece
        if src<=s['srcEnd']: return s['outStart']+src-s['srcStart']
    return seg[-1]['outEnd']
fin=lambda src: CO+ed(src)
fmt=lambda t: f"{int(t//3600)}:{int(t%3600//60):02d}:{int(t%60):02d}" if t>=3600 else f"{int(t//60):02d}:{int(t%60):02d}"
CH=[("01:32","So today I guess we have impossible task",130),("04:55","when I was reporting some bugs",337),("12:03","maybe let's talk about features",758),
("15:38","Do you think pg_repack will",965),("19:52","Do you have another favorite for PG 19",1226),("23:09","The other one I like is the auto vacuum",1429),
("25:12","Probably the biggest one we haven't mentioned",1539),("28:13","So, but I wanted to point out something",1735),("31:20","quite a lot, Nick",1921),
("33:58","One more dev feature",2075),("39:22","one more on the performance side",2412),("40:30","I have also one more improvement to mention",2469),
("44:18","Now that's the good news",2697),("47:10","I guess we covered our favorite features",2869),("52:38","just having the dev",3172)]
out={'chapters':{},'links':{}}
for oa,ph,near in CH: out['chapters'][oa]=fmt(fin(find(ph,near)))
for oa in sys.argv[4:]:
    h,m,s=map(int,oa.split(':')); src=h*3600+m*60+s+36
    w=min(W,key=lambda w:abs(w['start']-src)); out['links'][oa]=fmt(fin(w['start']))
print(json.dumps(out,indent=1))
