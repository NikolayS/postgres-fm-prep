import sys
from PIL import Image, ImageEnhance, ImageFilter
W=sys.argv[1]
faces={'nik':(589,368,222),'alv':(585,324,194),'kirk':(587,263,169)}
def tile(name,w,h,fhT,cyT,out,cx_off=0,dy=0):
    fx,fy,fh=faces[name]; s=fhT/fh
    im=Image.open(f'{W}/{name}-src.png').convert('RGB')
    if name=='kirk':
        im=im.point(lambda v: int(255*((v/255)**1.18)))
        im=ImageEnhance.Contrast(im).enhance(1.08)
        im=im.filter(ImageFilter.UnsharpMask(radius=2,percent=60,threshold=2))
    if name=='nik':
        im=im.point(lambda v: int(255*((v/255)**0.95)))
    big=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    left=round(fx*s-w/2+cx_off); top=round(fy*s-cyT-dy)
    assert left>=0 and top>=0 and left+w<=big.width and top+h<=big.height,(name,left,top,big.size)
    big.crop((left,top,left+w,top+h)).save(out)
w,h,fhT,cyT=[int(x) for x in sys.argv[2:6]]; suf=sys.argv[6]
off={'kirk':-28*w/376,'nik':-25*w/376,'alv':0}
for n in faces: tile(n,w,h,fhT,cyT,f'{W}/{n}-{suf}.png',round(off[n]),round({'kirk':18,'nik':0,'alv':0}[n]*h/300))
