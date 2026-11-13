# Square-cover host layer (1000x1000 CSS, rendered at 3x): cutouts, equal head size, Nik left, Kirk right.
from PIL import Image, ImageEnhance, ImageFilter
faces={'nik':(343,217,158,280),'kirk':(308,173,120*1.3,745)}   # cx, cy, face h (Kirk's box is small), x on canvas
L=Image.new('RGBA',(3000,3000),(0,0,0,0)); FH=780; CY=2380
for n,(fx,fy,fh,cx) in faces.items():
    im=Image.open(f'{n}-cut.png').convert('RGBA'); s=FH/fh
    rgb=im.convert('RGB'); a=im.getchannel('A')
    if n=='kirk': rgb=rgb.point(lambda v:int(255*((v/255)**1.25))); rgb=ImageEnhance.Contrast(rgb).enhance(1.08)
    im=Image.merge('RGBA',(*rgb.split(),a)).resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    im=im.filter(ImageFilter.UnsharpMask(radius=3,percent=50,threshold=2))
    im.putalpha(im.getchannel('A').point(lambda v:max(0,min(255,int((v-30)*1.25)))))
    L.alpha_composite(im,(round(cx*3-fx*s),round(CY-fy*s)))
L.save('hosts-sq.png')
