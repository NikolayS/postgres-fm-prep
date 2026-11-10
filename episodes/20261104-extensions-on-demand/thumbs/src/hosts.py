from PIL import Image, ImageEnhance, ImageFilter
faces={'kirk':(587,263,169,600),'alv':(585,324,194,1500),'nik':(589,368,222,2400)}
L=Image.new('RGBA',(3000,3000),(0,0,0,0))
FH=600; CY=2438
for n in ['kirk','nik','alv']:
    fx,fy,fh,cx=faces[n]; s=FH/fh*(0.88 if n=='kirk' else 1)
    im=Image.open(f'{n}-cut.png').convert('RGBA')
    rgb=im.convert('RGB'); a=im.getchannel('A')
    if n=='kirk':
        rgb=rgb.point(lambda v:int(255*((v/255)**1.18))); rgb=ImageEnhance.Contrast(rgb).enhance(1.08)
    if n=='nik': rgb=rgb.point(lambda v:int(255*((v/255)**0.95)))
    im=Image.merge('RGBA',(*rgb.split(),a))
    im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    im=im.filter(ImageFilter.UnsharpMask(radius=3,percent=50,threshold=2))
    # harden alpha slightly
    a=im.getchannel('A').point(lambda v: max(0,min(255,int((v-30)*1.25))))
    im.putalpha(a)
    L.alpha_composite(im,(round(cx-fx*s),round(CY-fy*s)))
L.save('hosts-sq.png')
