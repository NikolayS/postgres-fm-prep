# QA sheet: frames taken from the rendered .mov files (alpha), composited over the layout
# stills (band or center state), labelled, in a 3-column grid.
#   python3 scripts/qa-sheet.py   (run from tool/; writes ../qa-sheet.png and ../stills/qa-*.png)
import json, subprocess, os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.abspath('..')
man = json.load(open(f'{OUT}/manifest.json'))['overlays']
# Frames to check (seconds from overlay start): the reveal is complete there.
PICK = {'01-uuid-versions': [18.7], '02-memory-then-graph': [11.0, 60.0], '03-btree': [30.0, 66.5],
        '04-same-speed': [3.0], '05-wal-per-insert': [21.4], '06-just-switch': [2.2], '07-index-size': [17.0], '08-keep-uuid': [4.0]}
font = ImageFont.truetype(f'{OUT}/tool/public/fonts/Inter-Bold.ttf', 34)
tiles = []
for o in man:
    for sec in PICK[o['id']]:
        bg = f"{OUT}/still-{'center' if o['placement'] == 'center' else 'band'}.png"
        dst = f"{OUT}/stills/qa-{o['id']}@{sec}.png"
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', bg, '-ss', str(sec), '-i', f"{OUT}/{o['file']}", '-filter_complex', '[1:v]format=rgba[o];[0:v][o]overlay=format=auto', '-frames:v', '1', dst], check=True)
        im = Image.open(dst).convert('RGB')
        d = ImageDraw.Draw(im)
        m, s = divmod(o['outStart'] + sec, 60)
        label = f"{o['id']}  edited {int(m)}:{s:05.2f}  (+{sec}s of {o['dur']}s)"
        d.rectangle([0, 0, 1920, 52], fill=(0, 0, 0))
        d.text((16, 8), label, font=font, fill=(255, 255, 255))
        tiles.append(im.resize((960, 540)))
cols = 3
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (960 * cols, 540 * rows), (0, 0, 0))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * 960, (i // cols) * 540))
sheet.save(f'{OUT}/qa-sheet.png')
print(f'{OUT}/qa-sheet.png', len(tiles), 'frames')
