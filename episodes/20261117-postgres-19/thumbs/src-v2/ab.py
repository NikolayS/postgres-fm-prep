# YouTube Test & Compare set: thumbnails A, B, D as JPG (same heads as FINAL-thumb.jpg = C) and one sheet.
import sys
from PIL import Image, ImageDraw, ImageFont
o = sys.argv[1]; f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 30)
for k, n in (('a', 'a-cut'), ('b', 'b-made-it'), ('d', 'd-finally')):
    Image.open(f'{o}/thumb-{n}.png').convert('RGB').save(f'{o}/ab-{k}.jpg', quality=93, subsampling=0, optimize=True)
C = [('A  WHAT GOT CUT?', 'ab-a.jpg'), ('B  WHAT MADE IT?', 'ab-b.jpg'), ('C  Revert, Revert, Stamp 19.0 (FINAL-thumb)', 'FINAL-thumb.jpg'), ('D  Finally, 19.', 'ab-d.jpg')]
S = Image.new("RGB", (2060, 900), (228, 228, 224)); d = ImageDraw.Draw(S)
for i, (name, fn) in enumerate(C):
    x, y = 20 + (i % 2) * 1020, 20 + (i // 2) * 440; t = Image.open(f'{o}/{fn}')
    S.paste(t.resize((640, 360), Image.LANCZOS), (x, y)); S.paste(t.resize((320, 180), Image.LANCZOS), (x + 660, y))
    d.text((x, y + 372), name, fill=(20, 20, 20), font=f)
S.save(f'{o}/ab-sheet.png')
