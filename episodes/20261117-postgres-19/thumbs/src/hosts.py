# Square-cover host layer (3000x3000): cutouts (seg.swift), same eye distance (ADJ as tiles.py),
# eyes on one line, the lowest body edge on the canvas bottom. Nik left, Michael centre, Kirk right.
import json,subprocess,math
from PIL import Image,ImageEnhance,ImageFilter,ImageStat
ADJ={'kirk':0.85,'mic':0.9}; IOD=250; LUM=138; CX={'nik':560,'mic':1500,'kirk':2450}
faces={json.loads(l)['f'].split('/')[-1][:-8]:json.loads(l)['faces'][0] for l in subprocess.run('ls $PWD/*-src.png | ./faces',shell=True,capture_output=True,text=True).stdout.splitlines()}
g={}
for p,f in faces.items():
    lx,ly,rx,ry=f['pupils']; g[p]=(IOD/math.hypot(rx-lx,ry-ly)*ADJ.get(p,1),(lx+rx)/2,(ly+ry)/2)
H0=338; EY=3000-min((H0-ey)*s for s,ex,ey in g.values())+4
L=Image.new('RGBA',(3000,3000),(0,0,0,0))
for p in ('mic','nik','kirk'):   # Michael behind: drawn first
    s,ex,ey=g[p]; f=faces[p]
    im=Image.open(f'{p}-cut.png').convert('RGBA'); rgb=im.convert('RGB')
    a=im.getchannel('A').filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))  # drop segmentation specks
    lx,ly,rx,ry=f['pupils']; top=int(ey-2.6*math.hypot(rx-lx,ry-ly)); a.paste(0,(0,0,a.width,max(0,top)))  # nothing above the crown
    if p=='kirk': r,gg,b=rgb.split(); rgb=Image.merge('RGB',(r.point(lambda v:int(v*0.9)),gg,b))
    x,y,w,h=f['box']; m=ImageStat.Stat(rgb.crop((x,y,x+w,y+h)).convert('L')).mean[0]
    gam=math.log((LUM-14 if p=='kirk' else LUM)/255)/math.log(m/255); rgb=rgb.point(lambda v:int(255*((v/255)**gam)))
    rgb=ImageEnhance.Contrast(rgb).enhance(1.06)
    im=Image.merge('RGBA',(*rgb.split(),a)).resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    im=im.filter(ImageFilter.UnsharpMask(radius=3,percent=50,threshold=2))
    im.putalpha(im.getchannel('A').point(lambda v:max(0,min(255,int((v-30)*1.25)))))
    L.alpha_composite(im,(round(CX[p]-ex*s),round(EY-ey*s)))
    print(p,'scale',round(s,2),'eye y',round(EY))
L.save('hosts-sq.png')
