# Balanced head tiles: same eye distance (D px), eyes on one line (E px from tile top), faces centred.
# Exposure: per-person gamma so the face box has the same mean luminance.
import json,subprocess,math
from PIL import Image,ImageEnhance,ImageFilter,ImageStat
W,H,D,E,LUM=384,300,62,145,138
# Kirk's eyes sit closer together for his head size: equal eye distance made his head ~18% bigger on screen.
ADJ={'kirk':0.85}
faces={json.loads(l)['f'].split('/')[-1][:-8]:json.loads(l)['faces'][0] for l in subprocess.run('ls $PWD/*-src.png | ./faces  # faces = swiftc -O tools/podcast-edit/qa/faces.swift',shell=True,capture_output=True,text=True).stdout.splitlines()}
for p,f in faces.items():
    lx,ly,rx,ry=f['pupils']; s=D/math.hypot(rx-lx,ry-ly)*ADJ.get(p,1); ex,ey=(lx+rx)/2,(ly+ry)/2
    im=Image.open(f'{p}-src.png').convert('RGB')
    if p=='kirk': # hot, red camera: pull red down a little
        r,g,b=im.split(); r=r.point(lambda v:int(v*0.9)); im=Image.merge('RGB',(r,g,b))
    x,y,w,h=f['box']; m=ImageStat.Stat(im.crop((x,y,x+w,y+h)).convert('L')).mean[0]
    gam=math.log((LUM-14 if p=='kirk' else LUM)/255)/math.log(m/255); im=im.point(lambda v:int(255*((v/255)**gam)))
    im=ImageEnhance.Contrast(im).enhance(1.06)
    big=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2,percent=45,threshold=2))
    left=round(ex*s-W/2); top=round(ey*s-E)
    assert left>=0 and top>=0 and left+W<=big.width and top+H<=big.height,(p,left,top,big.size)
    big.crop((left,top,left+W,top+H)).save(f'{p}-t.png'); print(p,'scale',round(s,2),'face lum',round(m),'gamma',round(gam,2))
