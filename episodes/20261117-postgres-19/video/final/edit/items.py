import json,re,sys
from pathlib import Path
Z=sys.argv[1]; R=Z+'/review'
W=[w for w in json.load(open(R+'/work/src.words.json'))['words'] if w.get('type','word')=='word']
F=Path(__file__).resolve().parent.parent
cuts=Path(sys.argv[2]) if len(sys.argv)>2 else F/'edit/edited-v2.cuts.json'
seg=json.load(open(cuts))['segmentTimes']
n=lambda s: re.sub(r"[^a-z0-9]","",s.lower())
def find(phrase,near):
    q=[n(x) for x in phrase.split()]
    best=None
    for i in range(len(W)-len(q)):
        if abs(W[i]['start']-near)>40: continue
        if all(n(W[i+k]['text'])==q[k] for k in range(len(q))):
            d=abs(W[i]['start']-near)
            if best is None or d<best[0]: best=(d,W[i]['start'],W[i+len(q)-1]['end'])
    if not best: raise SystemExit(f"not found: {phrase}")
    return best[1],best[2]
def o(src):
    for s in seg:
        if s['srcStart']-0.02<=src<=s['srcEnd']: return s['outStart']+src-s['srcStart']
    raise SystemExit(f"src {src} is inside a cut")
notes=[
 ("01-score-weights","00:23:09","prioritizing and letting us queue",1434,"Note:","the score weights are server-wide","see pg_stat_autovacuum_scores"),
 ("02-parallel-av","00:24:47","parallel auto vacuum as well",1526,"Note:","parallel autovacuum is off by default","enable with autovacuum_max_parallel_workers"),
 ("03-stash-advice","00:29:53","store it in the database",1832,"Note:","pg_stash_advice keeps advice per query ID on the server","pg_dump does not include it"),
 # 04-overhead ("around 10%", about 13% in our test) is now the Forge card f11-advice (forge/forge-items.py).
 ("05-tsc","00:39:41","timing overhead of explain analyze",2418,"Note:","on x86-64","CPU time-stamp counter"),
 ("06-release-notes","00:42:34","didn't see it in the release notes",2599,"Note:","it is in the 19 release notes","“Allow pg_dump to include restorable extended statistics”"),
 ("07-pg-restore","00:43:12","if you can dump",2643,"Note:","pg_restore restores them too","dump with pg_dump --statistics"),
 ("08-not-on-table","00:45:14","a specific table",2759,"Correction:","these settings cannot be set on a table","check roles, databases and functions"),
 ("09-upgrade-fails","00:45:35","pg upgrade check will report success",2775,"Note:","on a role or database, pg_upgrade itself fails","in the 19 config file, 19 does not start"),
]
items=[];rep=[]
for id,onair,ph,near,prefix,text,sub in notes:
    a,b=find(ph,near); t=round(o(a),2)
    p=dict(kind='strip',prefix=prefix,text=text,sub=sub)
    if prefix.startswith('Corr'): p['accent']='#E5322D'
    items.append(dict(id=id,comp='band',outStart=t,duration=8,placement='band',freezeSec=0,sfx=[],props=p,source=f'notes/corrections.md {onair}; anchor "{ph}" at source {a:.2f}-{b:.2f}'))
    rep.append(dict(id=id,onair=onair,anchor=ph,src=round(a,2),edited=t,text=f"{prefix} {text} / {sub}"))
for i in range(1,len(items)):
    if items[i-1]['outStart']+8>items[i]['outStart']: print('OVERLAP',items[i-1]['id'],items[i]['id'])
open(Z+'/final-overlays/tool/scripts/items.ts','w').write("// Episode 197 on-screen notes (notes/corrections.md), anchored on Scribe word times, mapped through the supplied cuts plan.\nexport type Item = {id: string; comp: 'band'; outStart: number; duration: number; placement: 'band'; freezeSec: number; sfx: never[]; props: Record<string, unknown>; source?: string};\nexport const ITEMS: Item[] = "+json.dumps(items,indent=1,ensure_ascii=False)+";\n")
json.dump(rep,open(Z+'/final-overlays/anchors.json','w'),indent=1)
for r in rep: print(r['id'],r['onair'],r['src'],r['edited'],sep=' | ')

(F/'overlays/items.ts').write_text(Path(Z+'/final-overlays/tool/scripts/items.ts').read_text())
(F/'overlays/anchors.json').write_text(json.dumps(rep,indent=1)+'\n')
