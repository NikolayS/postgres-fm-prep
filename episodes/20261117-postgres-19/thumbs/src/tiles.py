# Balanced head tiles: same eye distance (D px), eyes on one line (E px from tile top), faces centred.
# Exposure: per-person gamma so the face box has the same mean luminance.
import json,subprocess,math,os
V='/Users/nik/github/postgres-fm-prep/episodes/20261117-postgres-19/preview/episode-197-final.mp4'
X={'nik':27,'mic':658,'kirk':1290}
# PICKS='nik=1057.4,mic=3149.8,kirk=1541.8' (final-video seconds)
for kv in os.environ.get('PICKS','').split(','):
    if kv: p,t=kv.split('='); subprocess.run(['ffmpeg','-v','error','-ss',t,'-i',V,'-frames:v','1','-vf',f'crop=604:338:{X[p]}:302','-y',f'{p}-src.png'])
from PIL import Image,ImageEnhance,ImageFilter,ImageStat
W,H,D,E,LUM=384,300,62,145,138
# Kirk's eyes sit closer together for his head size: equal eye distance made his head ~18% bigger on screen.
ADJ={'kirk':0.85,'mic':0.9}  # Michael: head tilted back, chin hit the tile edge at equal eye distance
faces={json.loads(l)['f'].split('/')[-1][:-8]:json.loads(l)['faces'][0] for l in subprocess.run('ls $PWD/*-src.png | ./faces',shell=True,capture_output=True,text=True).stdout.splitlines()}
def geo(D):
    g={}
    for p,f in faces.items():
        lx,ly,rx,ry=f['pupils']; s=D/math.hypot(rx-lx,ry-ly)*ADJ.get(p,1); g[p]=(s,(lx+rx)/2,(ly+ry)/2)
    return g
# Eye line E and scale D: the largest E <= 150 that every source can fill above and below the eyes.
while True:
    g=geo(D); src=Image.open('nik-src.png').size
    up=min(ey*s for s,ex,ey in g.values()); down=min((src[1]-ey)*s for s,ex,ey in g.values())
    E=min(150,up)
    if H-E<=down: break
    D+=1
E=int(E); print('D',D,'E',E)
for p,f in faces.items():
    s,ex,ey=g[p]
    im=Image.open(f'{p}-src.png').convert('RGB')
    if p=='kirk': # hot, red camera: pull red down a little
        r,gg,b=im.split(); r=r.point(lambda v:int(v*0.9)); im=Image.merge('RGB',(r,gg,b))
    x,y,w,h=f['box']; m=ImageStat.Stat(im.crop((x,y,x+w,y+h)).convert('L')).mean[0]
    gam=math.log((LUM-14 if p=='kirk' else LUM)/255)/math.log(m/255); im=im.point(lambda v:int(255*((v/255)**gam)))
    im=ImageEnhance.Contrast(im).enhance(1.06)
    big=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2,percent=45,threshold=2))
    left=round(ex*s-W/2); top=round(ey*s-E)
    left=max(0,min(left,big.width-W))  # keep inside the frame (face may sit off-centre)
    assert top>=0 and top+H<=big.height,(p,left,top,big.size)
    big.crop((left,top,left+W,top+H)).save(f'{p}-t.png'); print(p,'scale',round(s,2),'face lum',round(m),'gamma',round(gam,2))
