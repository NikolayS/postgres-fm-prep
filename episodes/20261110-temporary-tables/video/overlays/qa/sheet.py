# python3 sheet.py <out.png> <bg.png|gray> <cols> <img...> : composite each overlay frame over bg, tile with labels
import sys, os
from PIL import Image, ImageDraw, ImageFont
out, bg, cols, *imgs = sys.argv[1:]; cols = int(cols)
W, H = 640, 360
base = Image.open(bg).convert('RGBA').resize((1920,1080)) if bg != 'gray' else Image.new('RGBA', (1920,1080), (90,95,100,255))
rows = (len(imgs)+cols-1)//cols
sheet = Image.new('RGB', (cols*W, rows*(H+30)), (20,20,20))
try: f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 22)
except Exception: f = None
for i, p in enumerate(imgs):
    b = base.copy() if not os.path.exists(p + '.bg') else Image.open(p + '.bg').convert('RGBA').resize((1920,1080))
    b.alpha_composite(Image.open(p).convert('RGBA').resize((1920,1080)))
    x, y = (i%cols)*W, (i//cols)*(H+30)
    sheet.paste(b.convert('RGB').resize((W,H)), (x, y+30))
    ImageDraw.Draw(sheet).text((x+6, y+4), os.path.basename(p), fill=(255,255,255), font=f)
sheet.save(out); print(out, sheet.size)
