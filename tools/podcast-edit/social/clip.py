"""Vertical social clip (1080x1350, 4:5) of one speaker, from a final episode video.

Picture: the speaker's tile from the ORIGINAL recording (sharper than the small tile in the
final layout), mapped final -> edited -> source through the compose time map and the cuts, so
every edit cut matches the final video. Sound: the final video. Captions: the YouTube cues
(subtitles.ts *.cues.json, final time), regrouped into short 1-2 line captions. Ends on a
Postgres.FM end card (the show URL; never a dead last frame).

  python3 clip.py --final 27-final.mp4 --rec ../video.mp4 --cuts 01-edited.cuts.json \
      --time-map 27-final.time-map.json --cues 10-youtube.en.cues.json \
      --start 1757.50 --end 1820.72 --crop 190,616,740,458 \
      --name "Álvaro Hernández" --sub "an image with only the extensions you ask for" \
      --tag "Postgres.FM 195|StackGres" --out clip.mp4

--start/--end are final-video times (find.ts prints them for a phrase). Start on the first word
of a sentence and after any layout change; end just after the last word. --crop x,y,w,h is the
tile in the recording (trim the Zoom name label). It also writes <out>.check.png: the first and
last 1.5 s as a strip, to check for sips, hands, half words and layout changes before posting.
Needs Pillow and ffmpeg. Fonts: SF Pro (macOS); pass --font for another.

Lessons (episodes 194-195): no sip, hand or "um" in the first second; a burned caption on every
spoken frame (most people watch muted); the end card gives the show name and URL, not a
product; one speaker, one idea, 30-75 s.
"""
import argparse, json, subprocess
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
for a in ('final', 'rec', 'cuts', 'time-map', 'cues', 'crop', 'name', 'out'):
    ap.add_argument('--' + a, required=True)
ap.add_argument('--start', type=float, required=True)
ap.add_argument('--end', type=float, required=True)
ap.add_argument('--sub', default='')
ap.add_argument('--tag', default='Postgres.FM', help='top-right lines, split by |')
ap.add_argument('--end-title', default='Postgres.FM')
ap.add_argument('--end-url', default='postgres.fm')
ap.add_argument('--hold', type=float, default=1.9, help='end card seconds')
ap.add_argument('--font', default='/System/Library/Fonts/SFNS.ttf')
A = ap.parse_args()

FPS, W, H, XF = 25, 1080, 1350, 0.3
START, T_CARD = A.start, A.end - A.start
TOTAL = T_CARD + XF + A.hold
cx, cy, cw, ch = map(int, A.crop.split(','))
TW = 1000; TH = int(ch * TW / cw); TX = 40
TY = int(180 + max(34, (H - 180 - (TH + 48 + 150)) / 2))  # tile + caption block centred under the header

# ---- final -> source pieces (same rule as subtitles.ts composePieces)
def compose_pieces(cuts, m):
    card, frm, show_end = m.get('card', 0), m.get('from', 0), m.get('showEnd', float('inf'))
    fr = [((f.get('edited', f.get('at', 0))), f['sec']) for f in m.get('freezes', [])]
    out = []
    for p in cuts['segmentTimes']:
        r0 = p['outStart'] - frm; r1 = r0 + p['srcEnd'] - p['srcStart']
        if r1 <= 0: continue
        src_at = lambda r: p['srcStart'] + (r - (p['outStart'] - frm))
        r0 = max(r0, 0)
        cut_at = sorted(a for a, _ in fr if r0 + 1e-9 < a < r1 - 1e-9)
        edges = [r0] + cut_at + [r1]
        for a, b in zip(edges, edges[1:]):
            shift = sum(s for at, s in fr if at <= a + 1e-9)
            o0 = card + a + shift; ln = min(b - a, show_end - o0)
            if ln > 0: out.append((o0, o0 + ln, src_at(a)))
    return out
PIECES = compose_pieces(json.load(open(A.cuts)), json.load(open(A.time_map)))
def src_of(t):
    for o0, o1, s in PIECES:
        if o0 - 1e-6 <= t < o1: return s + (t - o0), o1
    return None, None

def font(size, w):
    f = ImageFont.truetype(A.font, size)
    try: f.set_variation_by_axes([100, min(96, max(17, size / 2)), 400, w])
    except Exception: pass
    return f
F_CAP, F_NAME, F_SUB, F_SMALL = font(46, 700), font(58, 800), font(36, 600), font(30, 700)
TOP, BOT = (237, 129, 226), (249, 219, 245)
INK, ACC, WHITE, CAPBG = (45, 18, 48), (110, 40, 110), (255, 255, 255), (32, 18, 36)

def grad():
    im = Image.new('RGB', (W, H)); d = ImageDraw.Draw(im)
    for y in range(H):
        k = y / H; d.line([(0, y), (W, y)], fill=tuple(int(TOP[i] + (BOT[i] - TOP[i]) * k) for i in range(3)))
    return im
bg = grad(); bd = ImageDraw.Draw(bg)
bd.text((44, 40), A.name, font=F_NAME, fill=INK)
if A.sub: bd.text((44, 112), A.sub, font=F_SUB, fill=INK)
for i, line in enumerate(A.tag.split('|')):
    bd.text((W - 44, 52 + 40 * i), line, font=F_SMALL, fill=ACC, anchor='ra')
endcard = grad(); ed = ImageDraw.Draw(endcard)
for txt, f, y, col in [(A.end_title, font(150, 800), 520, INK), (A.end_url, font(64, 600), 730, ACC)]:
    ed.text(((W - ed.textlength(txt, font=f)) / 2, y), txt, font=f, fill=col)
mask = Image.new('L', (TW, TH), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, TW - 1, TH - 1], 22, fill=255)

# ---- captions: words of the cues inside the clip, cut at . ? or about 38 characters
words = sorted((w for c in json.load(open(A.cues)) for w in c.get('toks', [])
                if START - 0.01 <= w['start'] and w['end'] <= A.end + 0.05), key=lambda w: w['start'])
groups, cur, i = [], [], 0
while i < len(words):
    w = words[i]; cur.append(w); i += 1
    end = w['text'].endswith(('.', '?', '!'))
    ln = len(' '.join(x['text'] for x in cur)); nxt = words[i]['text'] if i < len(words) else ''
    if not end and (ln + 1 + len(nxt) > 38 or (w['text'].endswith(',') and ln >= 22)):
        for j, x in enumerate(words[i:i + 2]):  # no 1-2 word orphan before a sentence end
            if x['text'].endswith(('.', '?', '!')): cur += words[i:i + j + 1]; i += j + 1; break
        end = True
    if end: groups.append(cur); cur = []
if cur: groups.append(cur)
CAPS = []
for k, g in enumerate(groups):
    a = 0.0 if k == 0 else g[0]['start'] - START - 0.05
    e = groups[k + 1][0]['start'] - START - 0.05 if k + 1 < len(groups) else T_CARD
    CAPS.append((a, min(e, g[-1]['end'] - START + 0.8), ' '.join(w['text'] for w in g)))

def wrap(d, s, f, maxw):
    out, cur = [], ''
    for w in s.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= maxw: cur = t
        else: out.append(cur); cur = w
    return out + ([cur] if cur else [])

# ---- source frames, one ffmpeg read per kept piece; a freeze holds the last frame
def tiles(n_total):
    n, last = 0, None
    while n < n_total:
        src, piece_end = src_of(START + n / FPS)
        if src is None: yield last; n += 1; continue
        cnt = 0
        while n + cnt < n_total and START + (n + cnt) / FPS < piece_end - 1e-6: cnt += 1
        p = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-ss', f'{src:.3f}', '-i', A.rec, '-frames:v', str(cnt),
                              '-vf', f'crop={cw}:{ch}:{cx}:{cy},scale={TW}:{TH}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                             stdout=subprocess.PIPE)
        for _ in range(cnt):
            b = p.stdout.read(TW * TH * 3)
            if len(b) == TW * TH * 3: last = Image.frombytes('RGB', (TW, TH), b)
            yield last
        p.wait(); n += cnt

cap_y = TY + TH + 48
enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        '-ss', str(START), '-t', str(TOTAL), '-i', A.final, '-map', '0:v', '-map', '1:a',
                        '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
                        '-af', f'afade=t=out:st={T_CARD - 0.02}:d=0.15,apad', '-t', str(TOTAL), '-movflags', '+faststart', A.out],
                       stdin=subprocess.PIPE)
frames, n, last = [], 0, None
for tile in tiles(int(round((T_CARD + XF) * FPS))):
    t = n / FPS; im = bg.copy()
    last = tile or last
    if last is not None: im.paste(last, (TX, TY), mask)
    d = ImageDraw.Draw(im)
    cur = [c for c in CAPS if c[0] <= t < c[1]]
    if cur:
        lines = wrap(d, cur[-1][2], F_CAP, 960)[:2]; lh = 58
        d.rounded_rectangle([40, cap_y, W - 40, cap_y + lh * len(lines) + 26], 18, fill=CAPBG)
        for k, l in enumerate(lines): d.text(((W - d.textlength(l, font=F_CAP)) / 2, cap_y + 13 + k * lh), l, font=F_CAP, fill=WHITE)
    if t >= T_CARD: im = Image.blend(im, endcard, min(1.0, (t - T_CARD + 1 / FPS) / XF))
    if n % 5 == 0 and (t < 1.5 or T_CARD - 1.5 <= t < T_CARD): frames.append(im.resize((216, 270)))
    enc.stdin.write(im.tobytes()); n += 1
while n / FPS < TOTAL - 1e-6: enc.stdin.write(endcard.tobytes()); n += 1
enc.stdin.close(); enc.wait()
half = max(1, (len(frames) + 1) // 2)
sheet = Image.new('RGB', (216 * half, 540), WHITE)
for k, f in enumerate(frames): sheet.paste(f, (216 * (k % half), 270 * (k // half)))
sheet.save(A.out.rsplit('.', 1)[0] + '.check.png')
print(f'wrote {A.out}: {n / FPS:.2f} s, {len(CAPS)} captions; check strip {A.out.rsplit(".", 1)[0]}.check.png')
for c in CAPS: print(f'{c[0]:6.2f} {c[1]:6.2f} {c[2]}')
