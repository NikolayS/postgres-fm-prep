import json,sys,statistics as st
from PIL import Image,ImageFilter,ImageStat,ImageDraw,ImageFont
p=sys.argv[1]; full=json.load(open(f'smr-{p}.json'))
mh=st.median(r['h'] for r in full); me=st.median(r['eye'] for r in full); mmw=st.median(r['mw'] for r in full)
def eo(e):
    xs=[q[0] for q in e]; ys=[q[1] for q in e]; w=max(xs)-min(xs); return (max(ys)-min(ys))/w if w else 0
best={}
HD={json.loads(l)['f']:json.loads(l)['hands'] for l in open(f'hd-{p}.jsonl')}
for l in open(f'rf-{p}.jsonl'):
    r=json.loads(l)
    if len(r['faces'])!=1: continue
    f=r['faces'][0]
    if not (f['lips'] and f['le'] and f['re'] and f['inner']): continue
    n=r['f'].split('/')[-1][:-4]
    if n[0]=='L': base='L'+n[1:6]; t=int(n[1:6])-1+(int(n[7:])-1)*0.2
    else: base=n[:5]; t=int(base)-1.2+(int(n[6:])-1)*0.2
    lc=[sum(q[0] for q in f['le'])/6,sum(q[1] for q in f['le'])/6]; rc=[sum(q[0] for q in f['re'])/6,sum(q[1] for q in f['re'])/6]
    iod=((rc[0]-lc[0])**2+(rc[1]-lc[1])**2)**.5; L=f['lips']; a=min(L,key=lambda q:q[0]); b=max(L,key=lambda q:q[0])
    mw=(b[0]-a[0])/iod; cy=(a[1]+b[1])/2; mid=[q[1] for q in L if abs(q[0]-(a[0]+b[0])/2)<(b[0]-a[0])*0.15]
    lift=((sum(mid)/len(mid))-cy)/iod if mid else 0
    ex=(lc[0]+rc[0])/2; nx=sum(q[0] for q in f['nose'])/len(f['nose']); front=abs(nx-ex)/iod
    e=min(eo(f['le']),eo(f['re'])); x,y,w,h=f['box']
    if any(x-0.7*w<=q[0]<=x+1.7*w and y-0.6*h<=q[1]<=y+2.2*h for hd in HD.get(r['f'],[]) for q in hd): continue
    if e<me*0.95 or front>0.12 or abs((rc[1]-lc[1])/iod)>0.12: continue
    im=Image.open(r['f']).convert('L').crop((x,y,x+w,y+h)); sharp=ImageStat.Stat(im.filter(ImageFilter.FIND_EDGES)).var[0]
    sc=(mw-mmw)*3+lift*4+e*1.5-front*2+min(sharp,1500)/3000
    if base not in best or sc>best[base]['sc']: best[base]=dict(iod=iod,sc=sc,t=round(t,2),f=r['f'],box=f['box'],eye=e,smile=(mw-mmw)*3+lift*4,front=front)
c=[]
for r in sorted(best.values(),key=lambda r:-r['sc']):
    if all(abs(r['t']-q['t'])>=8 for q in c): c.append(r)
c=c[:int(__import__('os').environ.get('TOPN',10))]
json.dump(c,open(f'cands-{p}.json','w'))
L={'nik':'N','mic':'M','kirk':'K'}[p]
fnt=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf',40); sm=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20)
T=300; cols=6; rws=(len(c)+cols-1)//cols; sh=Image.new('RGB',(cols*(T+10)+10,rws*(T+40)+10),'white'); d=ImageDraw.Draw(sh)
for i,r in enumerate(c):
    x,y,w,h=r['box']; cx,cy=x+w/2,y+h/2; s=r['iod']*5.4
    im=Image.open(r['f']).crop((int(cx-s/2),int(cy-s*0.55),int(cx+s/2),int(cy+s*0.45))).resize((T,T),Image.LANCZOS)
    X0=10+(i%cols)*(T+10); Y0=10+(i//cols)*(T+40); sh.paste(im,(X0,Y0))
    d.rectangle([X0,Y0,X0+70,Y0+50],fill='black'); d.text((X0+8,Y0+4),f'{L}{i+1}',font=fnt,fill='white')
    t=r['t']; d.text((X0,Y0+T+6),'%d:%05.2f  eyes %.2f'%(t//60,t%60,r['eye']),font=sm,fill='black')
    r['label']=f'{L}{i+1}'
json.dump(c,open(f'cands-{p}.json','w'))
sh.save(f'smiles-{p}.png'); print(p,[(r['label'],r['t'],round(r['sc'],2)) for r in c])
