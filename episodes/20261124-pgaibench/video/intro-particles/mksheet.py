# Contact sheet for the ep 198 particle intro: python3 mksheet.py <scratch> <out.png>
import glob, sys
from PIL import Image, ImageDraw, ImageFont
S = sys.argv[1]; out = sys.argv[2]
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 22)
big = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30)
W = 8 * 324 + 4
def grid(prefix, title):
    fs = sorted(glob.glob(f'{S}/out/{prefix}_*.png'))
    rows = (len(fs) + 7) // 8
    im = Image.new('RGB', (W, 50 + rows * 184), 'white'); d = ImageDraw.Draw(im)
    d.text((8, 10), title, fill='black', font=big)
    for i, f in enumerate(fs):
        x, y = 4 + (i % 8) * 324, 50 + (i // 8) * 184
        im.paste(Image.open(f), (x, y))
        d.rectangle([x + 256, y + 154, x + 320, y + 180], fill='black'); d.text((x + 260, y + 156), f'{i * 0.25:.2f}', fill='white', font=font)
    return im
def states(prefix, title, labels):
    fs = sorted(glob.glob(f'{S}/out/{prefix}_*.png'))
    w = (W - 8) // len(fs) - 4; h = w * 9 // 16
    im = Image.new('RGB', (W, 50 + h + 40), 'white'); d = ImageDraw.Draw(im)
    d.text((8, 10), title, fill='black', font=big)
    for i, f in enumerate(fs):
        t = f.rsplit('_', 1)[1][:-4]
        x = 4 + i * (w + 4)
        im.paste(Image.open(f).convert('RGB').resize((w, h)), (x, 50))
        d.text((x + 4, 50 + h + 6), f'{t} s: {labels[i]}', fill='black', font=font)
    return im
a = grid('fA', 'A "full" (18.52 s, compose --card 17.72): frames every 0.25 s')
sa = states('sA', 'A text states while the card is sharp (hold 7.76-13.41 s; each state >= 1.03 s)',
            ['C18 pill, drop indexes', '13 harms in replay', 'REJECTED', '377 of 378 APPROVED, 13 -> 1', "Michael's seat: AUDITOR"])
b = grid('fB', 'B "tighter" (13.8 s, compose --card 13): frames every 0.25 s')
sb = states('sB', 'B text states (hold 6.16-10.31 s; each state >= 1.03 s)', ['13 harms, drop indexes', 'REJECTED', '377 of 378 APPROVED, 13 -> 1', "Michael's seat: AUDITOR"])
old = Image.open(f'{S}/out/michael-old.png').convert('RGB').crop((1300, 330, 1920, 1080))
new = Image.open(f'{S}/out/cardF.png').convert('RGB').crop((1300, 330, 1920, 1080))
j = Image.open(f'{S}/out/joins.png').convert('RGB')
h = 750; j = j.resize((int(j.width * h / j.height), h))
row = Image.new('RGB', (W, h + 50), 'white'); d = ImageDraw.Draw(row)
d.text((8, 10), "Michael's sign + chair: old size | new size (x0.78)", fill='black', font=big)
row.paste(old, (4, 50)); row.paste(new, (4 + 630, 50))
d.text((4 + 1270, 10), 'A joins: cold-open last | intro first (top); intro last | body (bottom)', fill='black', font=big)
row.paste(j, (4 + 1270, 50))
parts = [a, sa, row, b, sb]
sheet = Image.new('RGB', (W, sum(p.height for p in parts)), 'white')
y = 0
for p in parts: sheet.paste(p, (0, y)); y += p.height
sheet.save(out)
print(sheet.size)
