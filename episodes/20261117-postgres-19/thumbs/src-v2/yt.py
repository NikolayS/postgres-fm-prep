# Episode 197 YouTube thumbnails in the channel style (the episode 196 template, thumbs/src/mk.py there):
# #111013 background, Impact headline in 2 lines (white, key words #ff7a1a), real rectangular video tiles
# with a 6 px light border. Three tiles: Nik N1, Michael MA, Kirk K3, same head size, eyes on one line.
# Tiles come from the same frames as the cutout covers (work/<p>-raw.png and -x4.png, see build.sh --heads).
# Kirk's face sits left of centre in his tile to stay clear of YouTube's duration badge (bottom-right 160x80).
# Usage: python3 yt.py <out dir>
import sys, os, subprocess, json
from PIL import Image, ImageFilter, ImageDraw, ImageFont
from prep import tone
out = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__))
W, H, D, E = 376, 316, 75, 148                    # tile, eye distance (px), eye line from the tile top
P = {  # pupil midpoint in the 2432x1368 source, eye distance there, head-size factor, tone, x shift of the face in the tile
 'nik':  dict(ex=1459, ey=800, iod=247, k=1.0, dx=0, tone=dict(gamma=0.86, contrast=1.08, sat=1.06)),
 'mic':  dict(ex=1342, ey=576, iod=200.2, k=.827, dx=0, tone=dict(gamma=0.92, contrast=1.10, sat=0.96, rmul=0.97)),
 'kirk': dict(ex=1143.5, ey=514.5, iod=197, k=.76, dx=-26, tone=dict(gamma=1.04, contrast=1.10, sat=0.80, rmul=0.97, shoulder=(0.82, 0.6))),
}
def tiles(W, H, D, E, m=1.0, tag=''):
    """Tile crops in thumbnail px units, rendered m times larger (the square cover needs more pixels)."""
    for p, c in P.items():
        x4 = Image.open(f'work/{p}-x4.png').convert('RGB')
        im = Image.blend(Image.open(f'work/{p}-raw.png').convert('RGB').resize(x4.size, Image.LANCZOS), x4, 0.5).crop((0, 0, 2432, 1356))
        im = tone(im, **c['tone']); s = D * c['k'] / c['iod']
        left = round(c['ex'] * s - W / 2 - c['dx']); top = round(c['ey'] * s - E)
        assert 0 <= left and left + W <= im.width * s and 0 <= top and top + H <= im.height * s, (p, left, top)
        big = im.resize((round(im.width * s * m), round(im.height * s * m)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2 * m, percent=45, threshold=2))
        big.crop((round(left * m), round(top * m), round(left * m) + round(W * m), round(top * m) + round(H * m))).save(f'work/yt-{p}{tag}.png')
tiles(W, H, D, E)
tiles(353, 370, 90, 170, m=3 * 286 / 353, tag='-sq')   # square cover: 286x300 CSS px tiles at 3x
V = {'v1': ('POSTGRES 19', 'IS OUT'), 'v2': ('POSTGRES 19:', 'WHAT MADE IT?'), 'v3': ('FINALLY,', 'POSTGRES 19'),
     'h1': ('DO YOU STILL NEED', 'pg_repack?'), 'h2': ('PLAN ADVICE <span class="or">or</span>', 'HINTS?'), 'h3': ('WILL YOUR PLANS', 'FLIP ON 19?')}
css = '''@font-face{font-family:Imp;src:url(file:///System/Library/Fonts/Supplemental/Impact.ttf)}
html,body{margin:0;width:1280px;height:720px;background:#111013;overflow:hidden}
.l{position:absolute;left:46px;font-family:Imp;line-height:1;letter-spacing:0.5px;white-space:nowrap;font-size:158px;width:max-content}
.l1{top:30px;color:#f5f3ee}
.l2{top:192px;color:#ff7a1a}
.or{font-size:.5em;color:#8a8f98;margin-left:.12em}
.tile{position:absolute;top:376px;width:376px;height:316px;border:6px solid #f5f3ee;background:#000}
.tile img{display:block;width:376px;height:316px}
.t1{left:40px}.t2{left:446px}.t3{left:852px}
'''
chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
for k, (a, b) in V.items():
    open(f'work/yt-{k}.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body><div class="l l1">{a}</div><div class="l l2">{b}</div>'
        '<div class="tile t1"><img src="yt-nik.png"></div><div class="tile t2"><img src="yt-mic.png"></div><div class="tile t3"><img src="yt-kirk.png"></div>'
        '<script>document.fonts.load("158px Imp").then(()=>{for(const e of document.querySelectorAll(".l")){let z=158;while(e.offsetWidth>1190&&z>80){z-=2;e.style.fontSize=z+"px"}e.style.marginTop=(158-z)*0.55+"px"}})</script></body></html>')
    subprocess.run([chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1280,720', '--virtual-time-budget=3000',
                    f'--screenshot={here}/work/yt-{k}.png', f'file://{here}/work/yt-{k}.html'], capture_output=True)
    Image.open(f'work/yt-{k}.png').convert('RGB').save(f'{out}/yt-{k}.jpg', quality=93, subsampling=0, optimize=True)
# Square podcast cover in the same style (V1 text): 1000x1000 CSS px at 3x = 3000x3000.
sqcss = '''@font-face{font-family:Imp;src:url(file:///System/Library/Fonts/Supplemental/Impact.ttf)}
@font-face{font-family:Inter;font-weight:800;src:url(../../../../../tools/podcast-edit/cover/fonts/Inter_UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYAZ9hiJ-Ek-_0ew.woff2)}
html,body{margin:0;width:1000px;height:1000px;background:#111013;overflow:hidden}
.mark{position:absolute;left:44px;top:40px;display:flex;align-items:center;gap:14px;font:800 66px Inter,sans-serif;letter-spacing:-.02em;color:#f5f3ee}
.mark i{width:26px;height:26px;border-radius:50%;background:#ff3b3b}
.l{position:absolute;left:42px;font-family:Imp;line-height:1;letter-spacing:0.5px;white-space:nowrap;font-size:178px}
.l1{top:176px;color:#f5f3ee}.l2{top:362px;color:#ff7a1a}
.tile{position:absolute;top:648px;width:286px;height:300px;border:6px solid #f5f3ee;background:#000}
.tile img{display:block;width:286px;height:300px}
.t1{left:40px}.t2{left:351px}.t3{left:662px}
'''
open('work/yt-square-v1.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{sqcss}</style></head><body><div class="mark"><i></i>Postgres.FM</div>'
    '<div class="l l1">POSTGRES 19</div><div class="l l2">IS OUT</div>'
    '<div class="tile t1"><img src="yt-nik-sq.png"></div><div class="tile t2"><img src="yt-mic-sq.png"></div><div class="tile t3"><img src="yt-kirk-sq.png"></div></body></html>')
subprocess.run([chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=3', '--window-size=1000,1000', '--virtual-time-budget=3000',
                f'--screenshot={here}/work/yt-square-v1.png', f'file://{here}/work/yt-square-v1.html'], capture_output=True)
Image.open('work/yt-square-v1.png').convert('RGB').save(f'{out}/FINAL-square-v1.jpg', quality=90, subsampling=0, optimize=True)
# Sheets: variants in full view, then at playlist size (420x236) next to the episode 196 thumbnail.
ref = Image.open(f'{here}/../../../20261110-temporary-tables/thumbs/thumb-d.png').convert('RGB')
f = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 28)
def sheet(name, full, small):
    S = Image.new('RGB', (40 + 3 * 660, 40 + 360 + 60 + (236 + 70) * ((len(small) + 4) // 4)), (228, 228, 224)); d = ImageDraw.Draw(S)
    for i, k in enumerate(full):
        S.paste(Image.open(f'{out}/yt-{k}.jpg').resize((640, 360), Image.LANCZOS), (20 + i * 660, 20)); d.text((20 + i * 660, 388), k.upper(), fill=(20, 20, 20), font=f)
    for j, k in enumerate(['196'] + small):
        x, y = 20 + (j % 4) * 440, 440 + (j // 4) * 306
        S.paste((ref if k == '196' else Image.open(f'{out}/yt-{k}.jpg')).resize((420, 236), Image.LANCZOS), (x, y))
        d.text((x, y + 244), 'Episode 196 (reference)' if k == '196' else k.upper() + ' at playlist size', fill=(20, 20, 20), font=f)
    S.save(f'{out}/{name}')
sheet('yt-sheet.png', ['v1', 'v2', 'v3'], ['v1', 'v2', 'v3'])
sheet('yt-sheet-h.png', ['h1', 'h2', 'h3'], ['h1', 'h2', 'h3', 'v1', 'v2', 'v3'])
rows = [(k, f'{out}/yt-{k}.jpg') for k in V] + [('sq', f'{out}/FINAL-square-v1.jpg')]
# Canonical files = what is live: V1 thumbnail and the V1 square.
import shutil
shutil.copyfile(f'{out}/yt-v1.jpg', f'{out}/FINAL-thumb.jpg'); shutil.copyfile(f'{out}/FINAL-square-v1.jpg', f'{out}/FINAL-square.jpg')
# Eyes and duration-badge check.
o = subprocess.run([f'{here}/work/face'], input='\n'.join(fn for _, fn in rows) + '\n', capture_output=True, text=True).stdout
for l in o.splitlines():
    r = json.loads(l); fs = sorted(r['faces'], key=lambda q: q['box'][0])
    eo = lambda e: (max(q[1] for q in e) - min(q[1] for q in e)) / (max(q[0] for q in e) - min(q[0] for q in e))
    badge = [q['box'] for q in fs if q['box'][0] + q['box'][2] > 1120 and q['box'][1] + q['box'][3] > 640] if 'square' not in r['f'] else []
    print(os.path.basename(r['f']), len(fs), 'faces; eye y', [round((q['lp'][0][1] + q['rp'][0][1]) / 2) for q in fs],
          'eye opening', [round(min(eo(q['le']), eo(q['re'])), 2) for q in fs], 'boxes', [q['box'] for q in fs], 'UNDER BADGE' if badge else 'badge area clear')
    assert len(fs) == 3 and not badge
