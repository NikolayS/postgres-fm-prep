# Face-balanced tiles from the Zoom gallery frames (Vision face boxes: cx, cy, face height).
from PIL import Image, ImageEnhance, ImageFilter
faces={'nik':(343,217,170),'kirk':(308,173,120)}
def tile(n,w,h,fhT,cyT,out):
    fx,fy,fh=faces[n]; s=fhT/fh
    im=Image.open(f'{n}-src.png').convert('RGB')
    if n=='kirk':  # bright camera: pull exposure down, a bit of contrast
        im=im.point(lambda v:int(255*((v/255)**1.25))); im=ImageEnhance.Contrast(im).enhance(1.08)
    big=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    big=big.filter(ImageFilter.UnsharpMask(radius=2,percent=50,threshold=2))
    left=max(0,min(big.width-w,round(fx*s-w/2))); top=max(0,min(big.height-h,round(fy*s-cyT)))
    big.crop((left,top,left+w,top+h)).save(out)
# Vision under-boxes Kirk's face (bright, laughing): 150 vs 196 gives equal head size on screen.
# Nik's crop stays above the Zoom name label (source y > 345).
tile('nik',580,316,196,175,'nik-t.png'); tile('kirk',580,316,150,175,'kirk-t.png')
