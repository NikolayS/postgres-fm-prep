# python3 gen-illustrations.py <illustrations.md> : rebuild the card list of illustrations.md from manifest.json + show.json
import json,sys,os
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; Q=os.path.dirname(os.path.abspath(__file__))
m=json.load(open(R+"/20-overlays/manifest.json")); show=json.load(open(Q+"/show.json"))
ts=lambda x:f"{int(float(x)//60)}:{float(x)%60:05.2f}"
cards=[]
for i,o in enumerate(m['overlays'],1):
    kind='center' if o['placement']=='center' else 'band'
    acc=f" Punch at edited {', '.join(ts(o['outStart']+a) for a in o['accents'])}." if o['accents'] else ''
    cards.append(f"{i}. **{o['id']}**, {kind}. Source {ts(o['srcStart'])}-{ts(o['srcEnd'])}, edited {ts(o['outStart'])}-{ts(o['outStart']+o['dur'])} ({o['dur']} s). {show[o['id']]}{acc}\n   Words: {o['words']}.\n   Source: {o['source']}.")
nc=sum(o['placement']=='center' for o in m['overlays']); nb=len(m['overlays'])-nc; tc=sum(o['dur'] for o in m['overlays'] if o['placement']=='center')
p=sys.argv[1]; s=open(p).read()
head,rest=s.split("## Cards\n",1); tail=rest[rest.index("## Dropped"):]
import re
head=re.sub(r"Plan v2, as built: [^.]*\.", f"Plan v2, as built: {len(m['overlays'])} inserts, {nc} in the center (the hosts move to the small tiles at the right, {tc/60:.1f} min in total) and {nb} bands.", head)
open(p,'w').write(head+"## Cards\n\n"+"\n".join(cards)+"\n\n"+tail)
print(len(cards))
