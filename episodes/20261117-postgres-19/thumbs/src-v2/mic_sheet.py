# Michael candidates v2: refine each chosen moment (raw-recording seconds) at 10 fps over +-1 s, keep the best
# frame of each, write the labelled sheet (MA..) and mic-picks.json. The moments come from mic_score.py's
# top list, curated by eye (no hand at the chin, real smile).
# Usage: python3 mic_sheet.py <work dir> <scan.json> <out.png> <t> <t> ...
import json, sys, subprocess, os
from PIL import Image, ImageDraw, ImageFont
import mic_score as ms
R = os.path.expanduser('~/Documents/Zoom/2026-11-17 10.02.00 .fm recording/video1398514958.mp4')
w, scan, out = sys.argv[1:4]; ts = sorted(float(t) for t in sys.argv[4:])
os.makedirs(f'{w}/ref', exist_ok=True); ref = json.load(open(scan)); best = []
for t in ts:
    b = f'{w}/ref/{int(t*10):06d}'
    subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t - 1), '-t', '2.05', '-i', R, '-vf', 'fps=10,crop=640:360:640:360', '-y', b + '-%02d.png'], check=True)
    files = sorted(f for f in os.listdir(f'{w}/ref') if f.startswith(os.path.basename(b)))
    o = subprocess.run(['work/face'], input='\n'.join(f'{w}/ref/{f}' for f in files) + '\n', capture_output=True, text=True).stdout
    open(b + '.jsonl', 'w').write(o)
    rows = ms.load(b + '.jsonl', lambda f: t - 1 + (int(f[-6:-4]) - 1) / 10)
    ms.score(rows, ref, win=0.3)
    best.append(max(rows, key=lambda r: r['score']))
B = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 44); S = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 22)
T, cols = 400, 4; rws = (len(best) + cols - 1) // cols
sh = Image.new('RGB', (cols * (T + 12) + 12, rws * (T + 46) + 70), 'white'); d = ImageDraw.Draw(sh)
d.text((14, 14), 'Michael: smile candidates v2 from the raw recording (pick one letter)', font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30), fill='black')
meta = []
for i, r in enumerate(best):
    (lx, ly), (rx, ry) = r['eyes']; cx, cy = (lx + rx) / 2, (ly + ry) / 2; s = r['iod'] * 5.4
    box = (int(cx - s / 2), int(cy - s * 0.42), int(cx + s / 2), int(cy + s * 0.58))
    c = Image.new('RGB', (box[2] - box[0], box[3] - box[1]), 'black'); c.paste(Image.open(r['f']), (-box[0], -box[1])); c = c.resize((T, T), Image.LANCZOS)
    X0 = 12 + (i % cols) * (T + 12); Y0 = 64 + (i // cols) * (T + 46); sh.paste(c, (X0, Y0)); lab = 'M' + chr(65 + i)
    d.rectangle([X0, Y0, X0 + 96, Y0 + 56], fill='black'); d.text((X0 + 8, Y0 + 4), lab, font=B, fill='white')
    t = r['t']; d.text((X0, Y0 + T + 8), '%d:%05.2f rec   eyes %.2f' % (t // 60, t % 60, r['eye']), font=S, fill='black')
    meta.append(dict(label=lab, t=round(t, 2), eyes=round(r['eye'], 3), score=round(r['score'], 2), frame=r['f']))
sh.save(out); json.dump(meta, open('mic-picks.json', 'w'), indent=1); print(meta)
