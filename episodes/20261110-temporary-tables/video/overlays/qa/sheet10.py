# python3 sheet10.py <dir of NNN.N.png> <out.png> <label> : 10 frames, 5x2, over pink
import sys,os
from PIL import Image, ImageDraw
d,out,label=sys.argv[1:4]; fs=sorted((f for f in os.listdir(d) if f.endswith('.png')), key=lambda f: float(f[:-4]))
W,H=640,360; sh=Image.new('RGB',(W*5,(H+28)*((len(fs)+4)//5)),(30,30,30))
for i,f in enumerate(fs):
    im=Image.open(f'{d}/{f}').convert('RGBA'); bg=Image.new('RGBA',im.size,(200,120,150,255)); bg.alpha_composite(im)
    x,y=(i%5)*W,(i//5)*(H+28); sh.paste(bg.convert('RGB').resize((W,H)),(x,y+28)); ImageDraw.Draw(sh).text((x+6,y+6),f"{label} @ {float(f[:-4]):.1f}s",fill=(255,255,255))
sh.save(out); print(out)
