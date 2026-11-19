import json,sys,statistics
from PIL import Image, ImageFilter, ImageStat
p=sys.argv[1]; rows=[]
for l in open(f'{p}.jsonl'):
    r=json.loads(l)
    if len(r['faces'])!=1: continue
    f=r['faces'][0]; x,y,w,h=f['box']; e=f['eyes']; pu=f['pupils']
    if min(e)<0 or -1 in pu: continue
    rows.append((r['f'],x,y,w,h,e,pu))
mh=statistics.median([r[4] for r in rows]); me=statistics.median([min(r[5]) for r in rows])
out=[]
for f,x,y,w,h,e,pu in rows:
    if abs(h-mh)/mh>0.15: continue
    cx=x+w/2
    # frontal: pupils midpoint near box centre; eye balance
    pm=(pu[0]+pu[2])/2; front=abs(pm-cx)/w
    bal=abs(e[0]-e[1])/max(e)
    eo=min(e)
    if eo<me*1.05: continue
    im=Image.open(f).crop((int(x),int(y),int(x+w),int(y+h))).convert('L')
    sharp=ImageStat.Stat(im.filter(ImageFilter.FIND_EDGES)).var[0]
    score=eo*2-front*3-bal-0+sharp/4000
    t=(int(f.split('/')[-1][:5])-1)*2
    out.append((score,t,f,round(eo,3),round(front,3),round(bal,2),int(sharp),h))
out.sort(reverse=True)
print(p,'median h',mh,'median eye',me,'n',len(out))
for o in out[:25]: print(round(o[0],3),o[1],'%02d:%02d:%02d'%(o[1]//3600,o[1]//60%60,o[1]%60),*o[3:])
