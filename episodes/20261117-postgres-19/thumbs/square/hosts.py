"""Three equal crown-to-chin heads, 3000 px square; no facial retouching.
Run from this directory after preparing the three transparent cutouts.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
ROOT=Path(__file__).resolve().parent
# Measured crown/chin bounds in the source frames, and face centre x.
GEOMETRY={'nik':(357,88,320,510),'mic':(365,74,297,1500),'kirk':(305,20,220,2490)}
HEAD_HEIGHT=1265
CROWN_Y=1665
layer=Image.new('RGBA',(3000,3000))
for name in ['nik','kirk','mic']:
    fx,top,chin,cx=GEOMETRY[name]
    im=Image.open(ROOT/f'{name}-cut.png').convert('RGBA')
    rgb=im.convert('RGB'); alpha=im.getchannel('A')
    # Restrained global white balance removes the source's magenta cast.
    # No saturation, gamma, or contrast boost for Kirk.
    if name=='kirk':
        r,g,b=rgb.split()
        rgb=Image.merge('RGB',(r.point(lambda v:round(v*.98)),
            g.point(lambda v:min(255,round(v*1.04))),b.point(lambda v:round(v*.95))))
    else:
        rgb=ImageEnhance.Contrast(rgb).enhance(1.04)
    im=Image.merge('RGBA',(*rgb.split(),alpha))
    s=HEAD_HEIGHT/(chin-top)
    im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
    alpha=im.getchannel('A').point(lambda v:max(0,min(255,round((v-15)*255/240))))
    rgb=im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=2,percent=40,threshold=3))
    im=Image.merge('RGBA',(*rgb.split(),alpha))
    layer.alpha_composite(im,(round(cx-fx*s),round(CROWN_Y-top*s)))
layer.save(ROOT/'hosts-sq.png')
