# Episode 198 covers in the channel style (episode 196/197 template: ../../20261117-postgres-19/thumbs/src-v2/yt.py,
# ../../20261110-temporary-tables/thumbs/src/mk.py): #111013 background, Impact 2-line headline (line 1 white,
# line 2 #ff7a1a), real rectangular video tiles with a 6 px light border. Two people: Nik left, Kirk right.
# Heads: raw Zoom recording 2026-11-24 (Kirk tile 0,0,640,360; Nik tile 640,0,640,360), picked by Apple Vision
# scores (facescore.swift: eyes open, smile, no hand, sharpness) over 60-3600 s at 0.5 fps, then 5 fps around the best.
#   Nik  385.6 s   Kirk 1991.4 s
# Each frame: Real-ESRGAN x4 (realesrgan-x4plus, v0.2.5.0) blended 50/50 with a Lanczos x4 (ESRGAN alone looks painted),
# tone curves only. Scale by the Vision face box (Kirk turns his head, so the eye distance under-reads), eye line level.
# Usage: python3 gen.py <work dir with {nik,kirk}-raw.png and -x4.png> <out dir> <faces binary> <ep196 thumb> <ep197 thumb>
import sys, os, subprocess, json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont, ImageEnhance
work, out, faces, ref196, ref197 = sys.argv[1:6]
here = os.path.dirname(os.path.abspath(__file__))
chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

def tone(rgb, gamma=1.0, contrast=1.0, sat=1.0, rmul=1.0, shoulder=None):
    a = np.asarray(rgb).astype(np.float32) / 255
    a[..., 0] *= rmul
    if shoulder:                                   # compress highlights above the knee (bright webcam)
        k, m = shoulder; hi = a > k; a[hi] = k + (a[hi] - k) * m
    a = np.clip(a, 0, 1) ** gamma
    im = Image.fromarray((a * 255).astype(np.uint8))
    return ImageEnhance.Color(ImageEnhance.Contrast(im).enhance(contrast)).enhance(sat)

def detect(paths):
    o = subprocess.run([faces], input='\n'.join(paths) + '\n', capture_output=True, text=True).stdout
    return [json.loads(l) for l in o.splitlines() if l.startswith('{')]

# Source sec, tone, x shift of the face in its tile (Kirk left of centre: duration badge bottom-right).
P = {'nik':  dict(t=385.6, dx=0, k=1.0, tone=dict(gamma=0.88, contrast=1.08, sat=1.04)),
     'kirk': dict(t=1991.4, dx=-40, k=0.86, tone=dict(gamma=1.12, contrast=1.10, sat=0.82, rmul=0.98, shoulder=(0.80, 0.55)))}
geo = {r['f'].split('/')[-1].split('-')[0]: r['faces'][0] for r in detect([f'{work}/{p}-x4.png' for p in P])}

def tiles(W, H, D, E, m=1.0, tag=''):
    """W x H tile, face box D px wide, eye line E px from the tile top; rendered m times larger."""
    for p, c in P.items():
        x4 = Image.open(f'{work}/{p}-x4.png').convert('RGB')
        im = Image.blend(Image.open(f'{work}/{p}-raw.png').convert('RGB').resize(x4.size, Image.LANCZOS), x4, 0.5)
        im = tone(im, **c['tone'])
        g = geo[p]; pu = g['pupils']; ex, ey = (pu[0] + pu[2]) / 2, (pu[1] + pu[3]) / 2
        s = D * c['k'] / g['box'][2]                              # k: Kirk's head is larger for the same face box
        left = round(ex * s - W / 2 - c['dx']); top = round(ey * s - E)
        left = max(0, min(left, round(im.width * s) - W))          # keep inside the frame
        assert 0 <= top and top + H <= im.height * s, (p, left, top)
        big = im.resize((round(im.width * s * m), round(im.height * s * m)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2 * m, percent=40, threshold=2))
        big.crop((round(left * m), round(top * m), round(left * m) + round(W * m), round(top * m) + round(H * m))).save(f'{work}/t-{p}{tag}.png')

tiles(580, 316, 165, 148)                         # thumbnails: ep196 two-tile layout; eye line set by Kirk (high in his frame)
tiles(440, 330, 165, 148, m=3, tag="-sq")         # square: 440x330 CSS px tiles at 3x; Nik crop ends above his Zoom name label

V = {'a': ('13 HARMS', 'DOWN TO 1'), 'b': ('LET AI TOUCH', 'PRODUCTION?'), 'c': ('ANALYST, AUDITOR,', 'ACTOR')}
css = '''@font-face{font-family:Imp;src:url(file:///System/Library/Fonts/Supplemental/Impact.ttf)}
html,body{margin:0;width:1280px;height:720px;background:#111013;overflow:hidden}
.l{position:absolute;left:46px;font-family:Imp;line-height:1;letter-spacing:0.5px;white-space:nowrap;font-size:158px;width:max-content}
.l1{top:30px;color:#f5f3ee}
.l2{top:192px;color:#ff7a1a}
.tile{position:absolute;top:376px;width:580px;height:316px;border:6px solid #f5f3ee;background:#000}
.tile img{display:block;width:580px;height:316px}
.t1{left:40px}.t2{left:648px}
'''
fit = '<script>document.fonts.load("158px Imp").then(()=>{for(const e of document.querySelectorAll(".l")){let z=158;while(e.offsetWidth>1190&&z>80){z-=2;e.style.fontSize=z+"px"}e.style.marginTop=(158-z)*0.55+"px"}})</script>'
def shot(html, png, w, h, scale):
    subprocess.run([chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--force-device-scale-factor={scale}', f'--window-size={w},{h}',
                    '--virtual-time-budget=3000', f'--screenshot={png}', f'file://{html}'], capture_output=True)
for k, (a, b) in V.items():
    h = f'{work}/thumb-{k}.html'
    open(h, 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body><div class="l l1">{a}</div><div class="l l2">{b}</div>'
                       f'<div class="tile t1"><img src="t-nik.png"></div><div class="tile t2"><img src="t-kirk.png"></div>{fit}</body></html>')
    shot(h, f'{out}/thumb-{k}.png', 1280, 720, 1)
    Image.open(f'{out}/thumb-{k}.png').convert('RGB').save(f'{out}/thumb-{k}.png')

INTER = 'tools/podcast-edit/cover/fonts/Inter_UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYAZ9hiJ-Ek-_0ew.woff2'
INTER = next(x for x in (os.path.join(here, '../../../..', INTER), os.path.expanduser('~/github/postgres-fm-prep/' + INTER)) if os.path.exists(x))
# Square podcast cover (ep197 FINAL-square style): mark, the episode title, two tiles. 1000x1000 CSS px at 3x.
sqcss = '''@font-face{font-family:Imp;src:url(file:///System/Library/Fonts/Supplemental/Impact.ttf)}
@font-face{font-family:Inter;font-weight:800;src:url(file://%s)}
html,body{margin:0;width:1000px;height:1000px;background:#111013;overflow:hidden}
.mark{position:absolute;left:44px;top:40px;display:flex;align-items:center;gap:14px;font:800 66px Inter,sans-serif;letter-spacing:-.02em;color:#f5f3ee}
.mark i{width:26px;height:26px;border-radius:50%%;background:#ff3b3b}
.h{position:absolute;left:42px;top:150px;font-family:Imp;line-height:1.0;letter-spacing:0.5px;white-space:nowrap;font-size:116px}
.w{color:#f5f3ee}.o{color:#ff7a1a}
.tile{position:absolute;top:630px;width:440px;height:330px;border:6px solid #f5f3ee;background:#000}
.tile img{display:block;width:440px;height:330px}
.t1{left:40px}.t2{left:508px}
''' % INTER
h = f'{work}/square.html'
open(h, 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{sqcss}</style></head><body><div class="mark"><i></i>Postgres.FM</div>'
    '<div class="h"><div class="w">CAN AI SAFELY</div><div class="w">CHANGE</div><div class="o">PRODUCTION</div><div class="o">POSTGRES?</div></div>'
    '<div class="tile t1"><img src="t-nik-sq.png"></div><div class="tile t2"><img src="t-kirk-sq.png"></div>'
    '<script>document.fonts.load("116px Imp").then(()=>{const e=document.querySelector(".h");let z=116;while(e.offsetWidth>916&&z>60){z-=2;e.style.fontSize=z+"px"}})</script></body></html>')
shot(h, f'{out}/square-3000.png', 1000, 1000, 3)
Image.open(f'{out}/square-3000.png').convert('RGB').save(f'{out}/square-3000.png')

# Checks: two faces, eyes open, eye lines level, same face size, nothing under the duration badge (bottom-right 160x80).
outs = [f'{out}/thumb-{k}.png' for k in V] + [f'{out}/square-3000.png']
for r in detect(outs):
    fs = sorted(r['faces'], key=lambda q: q['box'][0])
    eyes = [round((q['pupils'][1] + q['pupils'][3]) / 2) for q in fs]
    badge = 'square' not in r['f'] and any(q['box'][0] + q['box'][2] > 1120 and q['box'][1] + q['box'][3] > 640 for q in fs)
    print(os.path.basename(r['f']), len(fs), 'faces; eye y', eyes, 'face w', [q['box'][2] for q in fs], 'eye opening', [q['eyes'] for q in fs],
          'UNDER BADGE' if badge else 'badge area clear')
    assert len(fs) == 2 and not badge and min(min(q['eyes']) for q in fs) > 0.2

# Playlist-size sheet: each option at 320x180 next to episodes 197 and 196.
f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 20)
items = [('Episode 197 (live)', ref197), ('Episode 196 (live)', ref196)] + [(f'Option {k.upper()}', f'{out}/thumb-{k}.png') for k in V]
S = Image.new('RGB', (20 + len(items) * 340, 250), (249, 249, 249)); d = ImageDraw.Draw(S)
for i, (lab, fn) in enumerate(items):
    S.paste(Image.open(fn).convert('RGB').resize((320, 180), Image.LANCZOS), (20 + i * 340, 20)); d.text((20 + i * 340, 210), lab, fill=(15, 15, 15), font=f)
S.save(f'{out}/playlist-check.png')
# Contact sheet: the three thumbnails at 640x360 and the square at 740x740.
f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 26)
S = Image.new('RGB', (20 + 2 * 660 + 760, 20 + 2 * 410), (228, 228, 224)); d = ImageDraw.Draw(S)
for i, k in enumerate(V):
    x, y = 20 + (i % 2) * 660, 20 + (i // 2) * 410
    S.paste(Image.open(f'{out}/thumb-{k}.png').resize((640, 360), Image.LANCZOS), (x, y)); d.text((x, y + 366), f'thumb-{k}.png: {" / ".join(V[k])}', fill=(20, 20, 20), font=f)
S.paste(Image.open(f'{out}/square-3000.png').resize((740, 740), Image.LANCZOS), (20 + 2 * 660, 20)); d.text((20 + 2 * 660, 770), 'square-3000.png', fill=(20, 20, 20), font=f)
S.save(f'{out}/contact-sheet.png')
