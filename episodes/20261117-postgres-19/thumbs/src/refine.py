# Pick 14 spread-out smile candidates per person, refine each at 0.2 s over +-1.2 s.
import json,sys,subprocess,os
V='/Users/nik/github/postgres-fm-prep/episodes/20261117-postgres-19/preview/episode-197-final.mp4'
X={'nik':27,'mic':658,'kirk':1290}
p=sys.argv[1]; rows=json.load(open(f'smr-{p}.json'))
rows=[r for r in rows if r['t']>=46 and r['score']>-9]
rows.sort(key=lambda r:-(r['smile'] if os.environ.get('BYSMILE') else r['score'])); pick=[]
for r in rows:
    if all(abs(r['t']-q['t'])>=int(os.environ.get('GAP',20)) for q in pick): pick.append(r)
    if len(pick)==int(os.environ.get('NPICK',26)): break
os.makedirs(f'ref/{p}',exist_ok=True)
for r in pick:
    t0=r['t']-1.2
    subprocess.run(['ffmpeg','-v','error','-ss',str(t0),'-t','2.4','-i',V,'-vf',f'fps=5,crop=604:338:{X[p]}:302','-q:v','2','-y',f'ref/{p}/{r["t"]:05d}-%02d.jpg'])
