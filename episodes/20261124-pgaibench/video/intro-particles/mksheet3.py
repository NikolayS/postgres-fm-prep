# Review sheet for intro A v3: 0.25 s frames, hit map, old vs new at 4 beats, 360p readability.
import json, glob, struct, wave
from PIL import Image, ImageDraw, ImageFont
d = json.load(open('sh3/plan.json'))
F = lambda s: ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', s)
W = 3840
frames = sorted(glob.glob('sh3/f_*.png'))
cols, tw, th = 10, 384, 216
rows = (len(frames) + cols - 1) // cols
hA = 70 + rows * (th + 30)
hB = 520
hC = 70 + 4 * (450 + 20)
hD = 70 + 2 * (360 + 40)
img = Image.new('RGB', (W, hA + hB + hC + hD), (24, 10, 30))
g = ImageDraw.Draw(img)
g.text((20, 15), 'Intro A v3 (18.76 s): one frame every 0.25 s', font=F(40), fill='white')
for i, f in enumerate(frames):
    x, y = (i % cols) * tw, 70 + (i // cols) * (th + 30)
    img.paste(Image.open(f), (x, y)); g.text((x + 6, y + th + 2), f'{i * 0.25:.2f} s', font=F(22), fill='#ffd1f6')
# hit map
y0 = hA; T = 19.0; X = lambda t: 60 + (W - 120) * t / T
g.text((20, y0 + 10), 'Hit map: music hits (grey), old card hits (row 1, big = tall), new impacts (row 2: height = strength)', font=F(34), fill='white')
for t in d['grid']:
    if t < T: g.line([(X(t), y0 + 70), (X(t), y0 + 470)], fill=(90, 80, 100), width=2)
for k, t in enumerate(d['old']):
    hgt = 110 if k in d['oldBig'] else 60
    g.rectangle([X(t) - 5, y0 + 200 - hgt, X(t) + 5, y0 + 200], fill='#c9a0ff')
g.text((10, y0 + 150), 'old', font=F(24), fill='#c9a0ff')
col = {'boom': '#ff3b1f', 'slam': '#ff5fcf', 'land': '#ffffff', 'stamp': '#39ff6a', 'shatter': '#ffcc4d', 'snap': '#4fe3ff', 'bomb': '#ff7124'}
for e in d['fx']:
    hgt = 40 + 180 * e['p']
    g.rectangle([X(e['t']) - 5, y0 + 450 - hgt, X(e['t']) + 5, y0 + 450], fill=col[e['kind']])
g.text((10, y0 + 400), 'new', font=F(24), fill='white')
for s in range(0, 19): g.text((X(s) - 8, y0 + 475), f'{s}', font=F(24), fill='#aaa')
lx = 1200
for k, c in col.items(): g.rectangle([lx, y0 + 15, lx + 24, y0 + 39], fill=c); g.text((lx + 30, y0 + 12), k, font=F(26), fill='white'); lx += 170
# old vs new
y = hA + hB
g.text((20, y + 15), 'Old card (left) vs new intro (right), same beat', font=F(40), fill='white')
for i, (n, to, tn) in enumerate(d['pairs']):
    yy = y + 70 + i * 470
    img.paste(Image.open(f'sh3/old{i}.png'), (40, yy)); img.paste(Image.open(f'sh3/new{i}.png'), (900, yy))
    g.text((1760, yy + 180), f'{n}\nold {to:.2f} s  new {tn:.2f} s', font=F(40), fill='white')
# 360p
y = hA + hB + hC
g.text((20, y + 15), '360p readability (each text state, 640x360 shown 1:1)', font=F(40), fill='white')
for i, (n, t) in enumerate(d['r360']):
    x, yy = (i % 6) * 640, y + 70 + (i // 6) * 400
    img.paste(Image.open('sh3/r%02d.png' % i), (x, yy)); g.text((x + 6, yy + 362), f'{n} ({t:.2f} s)', font=F(24), fill='#ffd1f6')
img.save('out/45-sheet-v3.png', optimize=True)
print(img.size)
