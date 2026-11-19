import json,sys,statistics as st
from PIL import Image,ImageFilter,ImageStat
p=sys.argv[1]; rows=[]
def eo(e):
    xs=[q[0] for q in e]; ys=[q[1] for q in e]; w=max(xs)-min(xs); return (max(ys)-min(ys))/w if w else 0
for l in open(f'sm-{p}.jsonl'):
    r=json.loads(l)
    if len(r['faces'])!=1: continue
    f=r['faces'][0]
    if not f['lips'] or not f['le'] or not f['re']: continue
    x,y,w,h=f['box']; t=(int(r['f'].split('/')[-1][:5])-1)*2
    lc=[sum(q[0] for q in f['le'])/6,sum(q[1] for q in f['le'])/6]; rc=[sum(q[0] for q in f['re'])/6,sum(q[1] for q in f['re'])/6]
    iod=((rc[0]-lc[0])**2+(rc[1]-lc[1])**2)**.5
    L=f['lips']; a=min(L,key=lambda q:q[0]); b=max(L,key=lambda q:q[0])
    mw=(b[0]-a[0])/iod
    cy=(a[1]+b[1])/2; mid=[q[1] for q in L if abs(q[0]-(a[0]+b[0])/2)<(b[0]-a[0])*0.15]
    lift=((sum(mid)/len(mid))-cy)/iod if mid else 0   # corners above the lip centre line: positive
    I=f['inner']; op=(max(q[1] for q in I)-min(q[1] for q in I))/iod if I else 0
    ex=(lc[0]+rc[0])/2; nx=sum(q[0] for q in f['nose'])/len(f['nose']); front=abs(nx-ex)/iod
    e=min(eo(f['le']),eo(f['re']))
    rows.append(dict(t=t,f=r['f'],mw=mw,lift=lift,op=op,front=front,eye=e,h=h,iod=iod,box=f['box'],roll=abs((rc[1]-lc[1])/iod)))
mh=st.median(r['h'] for r in rows); me=st.median(r['eye'] for r in rows); mmw=st.median(r['mw'] for r in rows)
for r in rows:
    r['smile']=(r['mw']-mmw)*3+r['lift']*4
    ok=r['eye']>=me*0.95 and r['front']<0.12 and abs(r['h']-mh)/mh<0.2 and r['roll']<0.12
    im=Image.open(r['f']).convert('L').crop(tuple(int(v) for v in (r['box'][0],r['box'][1],r['box'][0]+r['box'][2],r['box'][1]+r['box'][3])))
    r['sharp']=ImageStat.Stat(im.filter(ImageFilter.FIND_EDGES)).var[0]
    r['score']=r['smile']+r['eye']*1.5-r['front']*2 if ok else -9
json.dump(rows,open(f'smr-{p}.json','w'))
top=sorted(rows,key=lambda r:-r['score'])
print(p,'median eye',round(me,3),'mw',round(mmw,2))
for r in top[:30]: print(r['t'],'%d:%02d'%(r['t']//60,r['t']%60),'score %.2f smile %.2f mw %.2f lift %.3f op %.2f eye %.2f front %.2f'%(r['score'],r['smile'],r['mw'],r['lift'],r['op'],r['eye'],r['front']))
