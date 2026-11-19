# Final numbered sheet from chosen times (s); each frame re-detected from the final video.
import json,sys,subprocess,os
from PIL import Image,ImageDraw,ImageFont
V='/Users/nik/github/postgres-fm-prep/episodes/20261117-postgres-19/preview/episode-197-final.mp4'
X={'nik':27,'mic':658,'kirk':1290}; L={'nik':'N','mic':'M','kirk':'K'}; NAME={'nik':'Nik','mic':'Michael','kirk':'Kirk'}
p=sys.argv[1]; out=sys.argv[2]; ts=[float(t) for t in sys.argv[3:]]
os.makedirs('cur',exist_ok=True); files=[]
for i,t in enumerate(ts):
    f=f'{os.getcwd()}/cur/{p}-{i+1}.png'; subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',V,'-frames:v','1','-vf',f'crop=604:338:{X[p]}:302','-y',f]); files.append(f)
det=[json.loads(l) for l in subprocess.run('./smile',input='\n'.join(files)+'\n',capture_output=True,text=True,shell=True).stdout.splitlines()]
def eo(e):
    xs=[q[0] for q in e]; ys=[q[1] for q in e]; return (max(ys)-min(ys))/(max(xs)-min(xs))
fnt=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf',44); sm=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
T=400; cols=4 if len(ts)<=8 else 5; rws=(len(ts)+cols-1)//cols
sh=Image.new('RGB',(cols*(T+12)+12,rws*(T+46)+70),'white'); d=ImageDraw.Draw(sh)
d.text((14,14),f'{NAME[p]}: smile candidates from the final video (pick one number)',font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf',30),fill='black')
meta=[]
for i,(t,r) in enumerate(zip(ts,det)):
    f=r['faces'][0]; x,y,w,h=f['box']
    lc=[sum(q[0] for q in f['le'])/6,sum(q[1] for q in f['le'])/6]; rc=[sum(q[0] for q in f['re'])/6,sum(q[1] for q in f['re'])/6]
    iod=((rc[0]-lc[0])**2+(rc[1]-lc[1])**2)**.5; cx,cy=(lc[0]+rc[0])/2,(lc[1]+rc[1])/2; s=iod*5.4
    im=Image.open(files[i]); box=(int(cx-s/2),int(cy-s*0.42),int(cx+s/2),int(cy+s*0.58))
    c=Image.new('RGB',(box[2]-box[0],box[3]-box[1]),'black'); c.paste(im,(-box[0],-box[1])); c=c.resize((T,T),Image.LANCZOS)
    X0=12+(i%cols)*(T+12); Y0=64+(i//cols)*(T+46); sh.paste(c,(X0,Y0))
    d.rectangle([X0,Y0,X0+84,Y0+56],fill='black'); d.text((X0+8,Y0+4),f'{L[p]}{i+1}',font=fnt,fill='white')
    e=min(eo(f['le']),eo(f['re'])); d.text((X0,Y0+T+8),'%d:%05.2f   eyes %.2f'%(t//60,t%60,e),font=sm,fill='black')
    meta.append(dict(label=f'{L[p]}{i+1}',t=t,eyes=round(e,3)))
sh.save(out); json.dump(meta,open(f'picks-{p}.json','w')); print(meta)
