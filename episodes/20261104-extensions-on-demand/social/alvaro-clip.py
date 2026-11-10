"""Episode 195: 4:5 clip of Álvaro explaining StackGres Containers (final video 29:17.5 to 30:20.7).
Video: Álvaro's Zoom tile from the original recording (sharper than the 608x342 tile in the final),
mapped through the podcast time map, so the cuts match the final video exactly.
Audio: the final video. Captions: word timings from 10-youtube.en.cues.json, regrouped.
Card: drawn here, synced to his words (episode card colors: base light blue, extensions yellow, fat/naive orange).
Usage (from review/): python3 33-social/alvaro_clip.py out.mp4
"""
import sys, json, subprocess
from PIL import Image, ImageDraw, ImageFont
OUT = sys.argv[1]
FINAL = '27-final-v5.mp4'
REC = '../video1638846836.mp4'
TMAP = json.load(open('11-podcast.time-map.json'))
CUES = json.load(open('10-youtube.en.cues.json'))
START, LAST_WORD = 1757.50, 1820.72      # after the edit cut at 1757.485, "So what's the end goal?" .. "Nothing more."
XF, HOLD = 0.3, 1.9
T_CARD = LAST_WORD - START
TOTAL = T_CARD + XF + HOLD
FPS = 25; W, H = 1080, 1350
# Álvaro tile in the recording (layout L1, 140.5..2873.5 s): x 0..1024, y 576..1152; trim the Zoom name label
CROP = (190, 576 + 40, 930, 576 + 498)
TW = 1000; TH = int((CROP[3] - CROP[1]) * TW / (CROP[2] - CROP[0]))
TX, TY = 40, 214

SANS = '/System/Library/Fonts/SFNS.ttf'
def sans(size, w):
    f = ImageFont.truetype(SANS, size); f.set_variation_by_axes([100, min(96, max(17, size/2)), 400, w]); return f
F_CAP = sans(46, 700); F_NAME = sans(58, 800); F_SUB = sans(36, 600); F_SMALL = sans(30, 700)
F_CHIP = sans(38, 800); F_CL = sans(32, 700); F_BIG = sans(44, 800)
TOP, BOT = (237, 129, 226), (249, 219, 245)
INK = (45, 18, 48); PANEL = (28, 20, 30); WHITE = (255, 255, 255); DIM = (153, 146, 153)
BLUE = (131, 197, 250); YELLOW = (252, 212, 73); ORANGE = (252, 120, 24)

def grad():
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / H; d.line([(0, y), (W, y)], fill=tuple(int(TOP[i] + (BOT[i]-TOP[i])*k) for i in range(3)))
    return im
bg = grad(); bd = ImageDraw.Draw(bg)
bd.text((44, 40), 'Álvaro Hernández', font=F_NAME, fill=INK)
bd.text((44, 112), 'an image with only the extensions you ask for', font=F_SUB, fill=INK)
bd.text((W - 44, 52), 'Postgres.FM 195', font=F_SMALL, fill=(110, 40, 110), anchor='ra')
bd.text((W - 44, 92), 'StackGres', font=F_SMALL, fill=(110, 40, 110), anchor='ra')
endcard = grad(); ed = ImageDraw.Draw(endcard)
for txt, f, y, col in [('Postgres.FM', sans(150, 800), 520, INK), ('postgres.fm', sans(64, 600), 730, (110, 40, 110))]:
    ed.text(((W - ed.textlength(txt, font=f)) / 2, y), txt, font=f, fill=col)
def rmask(size, r):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0]-1, size[1]-1], r, fill=255); return m
tmask = rmask((TW, TH), 22)

# ---- words -> captions (break after . ? or every ~7 words / 2 lines)
words = [w for c in CUES for w in c.get('toks', []) if START - 0.01 <= w['start'] and w['end'] <= LAST_WORD + 0.05]
words.sort(key=lambda w: w['start'])
caps, cur = [], []
i = 0
while i < len(words):
    w = words[i]; cur.append(w); i += 1
    txt = w['text']
    end = txt.endswith(('.', '?'))
    nxt = words[i]['text'] if i < len(words) else ''
    ln = len(' '.join(x['text'] for x in cur))
    if not end and (ln + 1 + len(nxt) > 38 or (txt.endswith(',') and ln >= 22)):
        # do not leave a 1-2 word orphan before a sentence end
        look = [x['text'] for x in words[i:i+2]]
        for j, lt in enumerate(look):
            if lt.endswith(('.', '?')):
                cur += words[i:i+j+1]; i += j + 1; break
        end = True
    if end: caps.append(cur); cur = []
if cur: caps.append(cur)
CAPS = []
for i, c in enumerate(caps):
    a = 0.0 if i == 0 else c[0]['start'] - START - 0.05
    e = (caps[i+1][0]['start'] - START - 0.05) if i + 1 < len(caps) else T_CARD
    e = min(e, c[-1]['end'] - START + 0.8)
    CAPS.append((a, e, ' '.join(w['text'] for w in c)))
def at(word, n=1, after=0.0):
    """final-video time of the n-th occurrence of word (after time) -> clip time"""
    k = 0
    for w in words:
        if w['start'] >= after and w['text'].strip('.,?').lower() == word.lower():
            k += 1
            if k == n: return w['start'] - START
    raise KeyError(word)

# ---- card events (clip seconds)
E = {}
E['pg1'] = at('Postgres'); E['A'] = at('A'); E['B'] = at('B'); E['M'] = at('M')
E['else'] = at('someone'); E['pg2'] = at('Postgres', 2); E['B2'] = at('B', 2); E['J'] = at('J'); E['Z'] = at('Z')
E['naive'] = at('naive'); E['docker'] = at('Dockerfile'); E['slow'] = at('seconds'); E['repro'] = at('reproducible')
E['new'] = at('generate', 2); E['citus'] = at('Citus'); E['ltree'] = at('ltree'); E['unaccent'] = at('unaccent')
E['get'] = at('container'); E['only'] = at('only'); E['nothing'] = at('Nothing', 2)
def ease(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)
def on(t, k, d=0.25): return ease((t - E[k]) / d)
PX0, PY0, PX1, PY1 = 40, 860, 1040, 1136
def chip(d, x, y, s, col, a, h=62):
    if a <= 0: return x
    w = d.textlength(s, font=F_CHIP) + 36
    yy = y + int(14 * (1 - a))
    c = tuple(int(PANEL[i] + (col[i] - PANEL[i]) * a) for i in range(3))
    d.rounded_rectangle([x, yy, x + w, yy + h], 10, fill=c)
    d.text((x + 18, yy + h / 2), s, font=F_CHIP, fill=tuple(int(c[i] + (PANEL[i] - c[i]) * a) for i in range(3)), anchor='lm')
    return x + w + 12
def fade(c, a): return tuple(int(PANEL[i] + (c[i] - PANEL[i]) * a) for i in range(3))
def card(d, t):
    d.rounded_rectangle([PX0, PY0, PX1, PY1], 22, fill=PANEL)
    x0 = PX0 + 28
    if t < E['new'] - 0.3:
        # phase 1: everyone wants a different set; phase 2: the naive way
        a1 = 1 - ease((t - (E['naive'] - 0.3)) / 0.3)
        if a1 > 0:
            d.text((x0, PY0 + 24), 'Every user wants a different set:', font=F_CL, fill=fade(DIM, a1))
            x = x0 + 150
            if t >= E['pg1']:
                d.text((x0, PY0 + 100), 'you', font=F_CL, fill=fade(WHITE, a1))
                x = chip(d, x, PY0 + 82, 'Postgres', BLUE, on(t, 'pg1') * a1)
                for k in 'ABM': x = chip(d, x, PY0 + 82, k, YELLOW, on(t, k) * a1)
            if t >= E['else']:
                d.text((x0, PY0 + 190), 'someone else', font=F_CL, fill=fade(WHITE, on(t, 'else') * a1))
                x = x0 + 230
                x = chip(d, x, PY0 + 172, 'Postgres', BLUE, on(t, 'pg2') * a1)
                for k, kk in (('B', 'B2'), ('J', 'J'), ('Z', 'Z')): x = chip(d, x, PY0 + 172, k, YELLOW, on(t, kk) * a1)
        a2 = ease((t - (E['naive'] - 0.1)) / 0.3) * (1 - ease((t - (E['new'] - 0.6)) / 0.3))
        if a2 > 0:
            d.text((x0, PY0 + 24), 'The naive way:', font=F_CL, fill=fade(DIM, a2))
            d.text((x0, PY0 + 74), 'run a Dockerfile build per request', font=F_BIG, fill=fade(WHITE, a2 * on(t, 'docker')))
            d.text((x0, PY0 + 140), '· seconds to a minute', font=F_BIG, fill=fade(ORANGE, a2 * on(t, 'slow')))
            d.text((x0, PY0 + 198), '· not reproducible', font=F_BIG, fill=fade(ORANGE, a2 * on(t, 'repro')))
    else:
        a3 = ease((t - (E['new'] - 0.3)) / 0.3)
        d.text((x0, PY0 + 24), 'StackGres Containers: you ask for', font=F_CL, fill=fade(DIM, a3))
        x = x0
        x = chip(d, x, PY0 + 76, 'Postgres', BLUE, a3)
        for k, s in (('citus', 'citus'), ('ltree', 'ltree'), ('unaccent', 'unaccent')): x = chip(d, x, PY0 + 76, s, YELLOW, on(t, k))
        g = on(t, 'get', 0.35)
        if g > 0:
            d.text((x0, PY0 + 170), '→ one image, in real time', font=F_BIG, fill=fade(WHITE, g))
        n = on(t, 'nothing', 0.2)
        if n > 0:
            d.text((x0, PY0 + 226), 'Nothing more.', font=F_BIG, fill=fade(YELLOW, n))
        elif on(t, 'only') > 0:
            d.text((x0, PY0 + 226), 'only Postgres + these 3', font=F_BIG, fill=fade(YELLOW, on(t, 'only')))

def wrap(d, s, font, maxw):
    out, cur = [], ''
    for w in s.split():
        tt = (cur + ' ' + w).strip()
        if d.textlength(tt, font=font) <= maxw: cur = tt
        else: out.append(cur); cur = w
    if cur: out.append(cur)
    return out

# ---- source frames through the time map
def src_frames(n_total):
    segs = TMAP['segments']
    n = 0
    while n < n_total:
        tf = START + n / FPS
        s = next(s for s in segs if s['audioStart'] <= tf + 1e-6 < s['audioEnd'])
        n_end = n
        while n_end < n_total and START + n_end / FPS < s['audioEnd'] - 1e-6: n_end += 1
        cnt = n_end - n
        src = s['srcStart'] + (tf - s['audioStart'])
        p = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-ss', f'{src:.3f}', '-i', REC, '-frames:v', str(cnt),
                              '-vf', f'crop={CROP[2]-CROP[0]}:{CROP[3]-CROP[1]}:{CROP[0]}:{CROP[1]},scale={TW}:{TH}:flags=lanczos',
                              '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
        fs = TW * TH * 3; last = None
        for _ in range(cnt):
            b = p.stdout.read(fs)
            if len(b) == fs: last = Image.frombytes('RGB', (TW, TH), b)
            yield last
        p.wait(); n = n_end

N_VID = int(round(T_CARD * FPS)) + int(round(XF * FPS))
enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        '-ss', str(START), '-t', str(TOTAL), '-i', FINAL, '-map', '0:v', '-map', '1:a',
                        '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
                        '-af', f'afade=t=out:st={T_CARD - 0.02}:d=0.15,apad', '-t', str(TOTAL), '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
n = 0; last_tile = None
for tile in src_frames(N_VID):
    t = n / FPS
    im = bg.copy()
    if tile is not None: last_tile = tile
    im.paste(last_tile, (TX, TY), tmask)
    d = ImageDraw.Draw(im)
    card(d, t)
    cur = [c for c in CAPS if c[0] <= t < c[1]]
    if cur:
        lines = wrap(d, cur[-1][2], F_CAP, 960)[:2]
        lh = 58; bh = lh * len(lines) + 26; y0 = 1160
        d.rounded_rectangle([40, y0, W-40, y0+bh], 18, fill=(32, 18, 36))
        for i, l in enumerate(lines):
            d.text(((W - d.textlength(l, font=F_CAP))/2, y0 + 13 + i*lh), l, font=F_CAP, fill=WHITE)
    if t >= T_CARD: im = Image.blend(im, endcard, min(1.0, (t - T_CARD + 1 / FPS) / XF))
    enc.stdin.write(im.tobytes()); n += 1
while n / FPS < TOTAL - 1e-6:
    enc.stdin.write(endcard.tobytes()); n += 1
enc.stdin.close(); enc.wait()
print('frames', n, 'seconds', round(n / FPS, 2), 'captions', len(CAPS))
for c in CAPS: print(f'{c[0]:6.2f} {c[1]:6.2f} {c[2]}')
