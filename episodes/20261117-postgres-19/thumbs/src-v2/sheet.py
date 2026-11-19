# Review sheet: 4 thumbnails and 4 square covers, each with its phone-size preview (320x180, 300x300).
import sys
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]
C = [('a-cut', 'A  WHAT GOT CUT?'), ('b-made-it', 'B  WHAT MADE IT?'), ('c-git-log', 'C  Revert, Revert, Stamp 19.0'), ('d-finally', 'D  Finally, 19.')]
f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 22)
W, RH = 2000, 470
S = Image.new('RGB', (W, 60 + RH * 4), (228, 228, 224)); d = ImageDraw.Draw(S)
d.text((24, 16), 'Episode 197 covers v2: thumbnail 1280x720, at 320x180, square 3000x3000, at 300x300', fill=(20, 20, 20), font=f)
for i, (k, name) in enumerate(C):
    y = 60 + i * RH
    t = Image.open(f'{out}/thumb-{k}.png').convert('RGB'); q = Image.open(f'{out}/square-{k}.png').convert('RGB')
    S.paste(t.resize((747, 420), Image.LANCZOS), (24, y)); S.paste(t.resize((320, 180), Image.LANCZOS), (795, y))
    S.paste(q.resize((420, 420), Image.LANCZOS), (1139, y)); S.paste(q.resize((300, 300), Image.LANCZOS), (1583, y))
    d.text((795, y + 196), name, fill=(20, 20, 20), font=f)
S.save(f'{out}/covers-v2-sheet.png'); print(f'{out}/covers-v2-sheet.png')
