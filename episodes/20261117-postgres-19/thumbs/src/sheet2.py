import sys
from PIL import Image,ImageDraw,ImageFont
f=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
labs={'a':'A  96 CVEs. WORTH THE WAIT?  (recommended)','b':'B  POSTGRES 19: WORTH IT?','c':'C  52 CVEs IN ONE RELEASE?'}
sh=Image.new('RGB',(3*660+20+440,420),'#e8e6e1');d=ImageDraw.Draw(sh)
for i,k in enumerate('abc'):
    im=Image.open(f'thumb-{k}.png'); sh.paste(im.resize((640,360),Image.LANCZOS),(20+i*660,20)); d.text((20+i*660,388),labs[k],font=f,fill='black')
sh.paste(Image.open('cover-3000.png').resize((360,360),Image.LANCZOS),(2010,20)); d.text((2010,388),'Square cover 3000x3000',font=f,fill='black')
sh.save(sys.argv[1])
