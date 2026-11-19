"""Episode 197 speaker clip: Kirk on plan hints ("the 1975 solution ... we're 2026, baby").

Vertical 1080x1920 and square 1080x1080, from the final video (Kirk's tile, x 1290-1894,
y 302-640). Sound: the final video. Burned captions sit under the tile, never on a face.
Ends on a Postgres.FM end card. Style follows tools/podcast-edit/social/clip.py.

  python3 clip197.py <episode-197-final.mp4> <out-prefix>   # writes <prefix>-1080x1920.mp4,
                                                            # <prefix>-1080x1080.mp4, *.check.png
Caption times: whisper-cli (large-v3-turbo) word times on the final video, 2026-11-18.
"""
import sys, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC, PREFIX = sys.argv[1:3]
START, END = 1534.95, 1588.85          # first word "Plan" 1535.10; "that happens." ends 1588.41
FPS, XF, HOLD = 25, 0.3, 2.0
T_CARD = END - START; TOTAL = T_CARD + XF + HOLD
TILE_X, TILE_Y, TILE_H = 1290, 302, 338  # Kirk's tile in the final video
CAPS = [(1535.10, 'Plan hints, to me, is the 1975 solution'),
        (1539.15, 'to having a query that you need to tell the database,'),
        (1543.62, '"Hey, you\'re gonna calculate this wrong.'),
        (1545.70, 'So I\'m gonna put literally a slash-asterisk hint'),
        (1549.49, 'after the word SELECT,'),
        (1552.34, 'and I\'m gonna put some things in there'),
        (1554.38, 'and tell you what tables and indexes'),
        (1556.02, 'you should really be doing as your driver table.'),
        (1560.74, 'I\'m gonna focus you, because you\'re gonna make mistakes."'),
        (1564.20, 'And the problem is... I want you to hold it right there.'),
        (1567.00, 'It was a great idea in 1975, okay?'),
        (1570.72, 'The problem is, we\'re 2026, baby.'),
        (1574.46, 'And the reality is, you\'re hard-coding the hint'),
        (1576.95, 'usually into the application.'),
        (1579.36, 'The last thing you want to do is be tweaking your application'),
        (1582.34, 'because of a subtle change in the database,'),
        (1584.62, 'because now your hint is actually a bad idea.'),
        (1587.52, 'And that happens.')]
CAPS = [(a - START, (CAPS[i + 1][0] - START - 0.05) if i + 1 < len(CAPS) else T_CARD, s) for i, (a, s) in enumerate(CAPS)]

SANS = '/System/Library/Fonts/SFNS.ttf'
def font(size, w):
    f = ImageFont.truetype(SANS, size)
    try: f.set_variation_by_axes([100, min(96, max(17, size / 2)), 400, w])
    except Exception: pass
    return f
TOP, BOT = (237, 129, 226), (249, 219, 245)
INK, ACC, WHITE, CAPBG = (45, 18, 48), (110, 40, 110), (255, 255, 255), (32, 18, 36)

def grad(W, H):
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / H; d.line([(0, y), (W, y)], fill=tuple(int(TOP[i] + (BOT[i] - TOP[i]) * k) for i in range(3)))
    return im

def wrap(d, s, f, maxw):
    out, cur = [], ''
    for w in s.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= maxw: cur = t
        else: out.append(cur); cur = w
    return out + ([cur] if cur else [])

def render(W, H, TW, TY, CAP_Y, name_y, fs, cw):
    CROP = (TILE_X + 302 - cw // 2, TILE_Y, cw, TILE_H)  # Kirk centred (tile centre x 302), full tile height
    TH = round(CROP[3] * TW / CROP[2]); TX = (W - TW) // 2
    F_NAME, F_SUB, F_SMALL, F_CAP = font(fs[0], 800), font(fs[1], 600), font(30, 700), font(fs[2], 700)
    bg = grad(W, H); bd = ImageDraw.Draw(bg)
    bd.text((44, name_y), 'Kirk Wolak', font=F_NAME, fill=INK)
    bd.text((44, name_y + fs[0] + 14), 'Plan hints: a 1975 solution', font=F_SUB, fill=INK)
    for i, line in enumerate(['Postgres.FM 197', 'Postgres 19']):
        bd.text((W - 44, name_y + 12 + 40 * i), line, font=F_SMALL, fill=ACC, anchor='ra')
    end = grad(W, H); ed = ImageDraw.Draw(end)
    for txt, f, y, col in [('Postgres.FM', font(150, 800), H // 2 - 140, INK), ('postgres.fm', font(64, 600), H // 2 + 70, ACC)]:
        ed.text(((W - ed.textlength(txt, font=f)) / 2, y), txt, font=f, fill=col)
    mask = Image.new('L', (TW, TH), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, TW - 1, TH - 1], 22, fill=255)
    out = f'{PREFIX}-{W}x{H}.mp4'
    n_tile = int(round((T_CARD + XF) * FPS))
    rd = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-ss', f'{START:.3f}', '-i', SRC, '-frames:v', str(n_tile),
                           '-vf', f'crop={CROP[2]}:{CROP[3]}:{CROP[0]}:{CROP[1]},scale={TW}:{TH}:flags=lanczos,unsharp=5:5:0.6',
                           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-ss', f'{START:.3f}', '-t', f'{TOTAL:.3f}', '-i', SRC, '-map', '0:v', '-map', '1:a',
                            '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
                            '-af', f'afade=t=in:d=0.04,afade=t=out:st={T_CARD - 0.05:.3f}:d=0.25,apad', '-t', f'{TOTAL:.3f}', '-movflags', '+faststart', out],
                           stdin=subprocess.PIPE)
    frames, boxes, last, n = [], [], None, 0
    while n / FPS < TOTAL - 1e-6:
        t = n / FPS
        if n < n_tile:
            b = rd.stdout.read(TW * TH * 3)
            if len(b) == TW * TH * 3: last = Image.frombytes('RGB', (TW, TH), b)
        im = bg.copy(); im.paste(last, (TX, TY), mask); d = ImageDraw.Draw(im)
        cur = [c for c in CAPS if c[0] <= t < c[1]]
        if cur:
            lines = wrap(d, cur[-1][2], F_CAP, W - 120)[:2]; lh = int(fs[2] * 1.26)
            box = [40, CAP_Y, W - 40, CAP_Y + lh * len(lines) + 26]; boxes.append(box)
            d.rounded_rectangle(box, 18, fill=CAPBG)
            for k, l in enumerate(lines): d.text(((W - d.textlength(l, font=F_CAP)) / 2, CAP_Y + 13 + k * lh), l, font=F_CAP, fill=WHITE)
        if t >= T_CARD: im = Image.blend(im, end, min(1.0, (t - T_CARD + 1 / FPS) / XF))
        if n % 5 == 0 and (t < 1.5 or T_CARD - 1.5 <= t < T_CARD): frames.append(im.resize((W // 5, H // 5)))
        if n % 50 == 0 and t < T_CARD: im.save(f'{PREFIX}-{W}x{H}-f{n:05d}.png')  # for the face/caption check
        enc.stdin.write(im.tobytes()); n += 1
    enc.stdin.close(); enc.wait(); rd.wait()
    sheet = Image.new('RGB', (W // 5 * ((len(frames) + 1) // 2), H // 5 * 2), WHITE)
    for k, f in enumerate(frames): sheet.paste(f, (W // 5 * (k % ((len(frames) + 1) // 2)), H // 5 * (k // ((len(frames) + 1) // 2))))
    sheet.save(f'{PREFIX}-{W}x{H}.check.png')
    print(f'wrote {out}: {n / FPS:.2f} s; tile y {TY}-{TY + TH}; caption box from y {CAP_Y}; max caption bottom {max(b[3] for b in boxes)}')

render(1080, 1920, 1000, 330, 1190, 90, (80, 44, 50), 420)   # vertical: tile 1000x805; Shorts UI covers the bottom ~400 px
render(1080, 1080, 880, 150, 790, 36, (54, 32, 44), 480)     # square: tile 880x620
