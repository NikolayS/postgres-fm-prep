# Episode 196 speaker clips for X / LinkedIn / YouTube Shorts (1080x1350, 25 fps).
# Style follows social/anim-196.mp4: a dark window on an indigo/purple wave wallpaper.
# Usage: python3 clip196.py <final-video.mp4> <captions.vtt> <out.mp4> <kirk|nik>
# Source layout (final video, 1920x1080): either an illustration card on the left with
# small speaker tiles on the right ("card" mode), or two large speaker tiles ("side" mode).
import sys, re, subprocess, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC, VTT, OUT, WHO = sys.argv[1:5]
CLIPS = {
    # start/end: YouTube video time (s), cut in pauses measured on the audio.
    'kirk': dict(start=1544.88, end=1598.55, name='Kirk Wolak',
                 topic='why temp tables slow down\nevery session'),
    'nik': dict(start=1268.92, end=1334.90, name='Nikolay Samokhvalov',
                topic='idle sessions push you\noff the cliff'),
}
C = CLIPS[WHO]; START, END = C['start'], C['end']; DUR = END - START
FPS = 25; SW, SH = 1920, 1080; W, H = 1080, 1350
# Source geometry (measured on frames of the final video).
CARD = (40, 100, 1610, 1030)
SMALL = {'nik': (1644, 124, 1892, 260), 'kirk': (1644, 364, 1892, 500)}
BIG = {'nik': (28, 214, 948, 728), 'kirk': (972, 214, 1892, 728)}

# ---------- fonts ----------
SANS = '/System/Library/Fonts/SFNS.ttf'; MONO = '/System/Library/Fonts/SFNSMono.ttf'
def sans2(size, wght):
    f = ImageFont.truetype(SANS, size)
    axes = f.get_variation_axes(); vals = []
    for a in axes:
        n = a['name'] if isinstance(a['name'], str) else a['name'].decode()
        if n.lower().startswith('weight'): vals.append(wght)
        elif n.lower().startswith('optical'): vals.append(min(a['maximum'], max(a['minimum'], size / 2)))
        elif n.lower().startswith('width'): vals.append(100)
        else: vals.append(a['default'])
    f.set_variation_by_axes(vals); return f
F_NAME = sans2(52, 700); F_TOPIC = sans2(36, 500); F_CAP = sans2(50, 600)
F_EYE = ImageFont.truetype(MONO, 24); F_END = ImageFont.truetype(MONO, 30)

# ---------- static background: wallpaper + window ----------
def wallpaper():
    y, x = np.mgrid[0:H, 0:W].astype(float)
    t = (x / W) * 0.6 + (y / H) * 0.9
    base = np.stack([20 + 60 * t, 14 + 22 * t, 60 + 120 * t], -1)
    for k, (amp, fr, ph, col) in enumerate([(160, 0.006, 0.3, (110, 40, 190)), (220, 0.004, 2.1, (40, 80, 230)), (120, 0.008, 4.0, (150, 60, 220))]):
        band = np.exp(-((y - (H * (0.25 + 0.3 * k)) - amp * np.sin(x * fr + ph)) / 110.0) ** 2)
        base += band[..., None] * (np.array(col) - base) * 0.55
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
WX0, WY0, WX1, WY1 = 36, 36, W - 36, H - 36
bg = wallpaper()
sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle([WX0 + 6, WY0 + 14, WX1 + 6, WY1 + 14], 26, fill=150)
bg.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(18)))
d = ImageDraw.Draw(bg)
d.rounded_rectangle([WX0, WY0, WX1, WY1], 22, fill=(10, 10, 10), outline=(58, 58, 66), width=2)
for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
    d.ellipse([WX0 + 24 + i * 30, WY0 + 20, WX0 + 40 + i * 30, WY0 + 36], fill=c)
d.text((W // 2, WY0 + 28), 'postgres.fm · episode 196', font=ImageFont.truetype(MONO, 20), fill=(110, 110, 120), anchor='mm')
d.line([WX0, WY0 + 56, WX1, WY0 + 56], fill=(34, 34, 40), width=1)
PX = 80  # left text margin
d.ellipse([PX, 116, PX + 12, 128], fill=(61, 220, 132))
d.text((PX + 24, 122), 'POSTGRES.FM 196', font=F_EYE, fill=(150, 150, 160), anchor='lm')
d.text((PX, 150), C['name'], font=F_NAME, fill=(245, 245, 247))
d.multiline_text((PX, 228), C['topic'], font=F_TOPIC, fill=(160, 160, 170), spacing=8)

def rmask(size, r):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], r, fill=255); return m
MEDIA_Y = 400; MW = W - 2 * PX + 40  # media width 960
MX = (W - MW) // 2
cw, ch = CARD[2] - CARD[0], CARD[3] - CARD[1]; CH_ = int(ch * MW / cw)
card_mask = rmask((MW, CH_), 18)
SMW = 320; SMH = int(SMW * 136 / 248); small_mask = rmask((SMW, SMH), 14)
bw, bh = BIG[WHO][2] - BIG[WHO][0], BIG[WHO][3] - BIG[WHO][1]; BH_ = int(bh * MW / bw)
big_mask = rmask((MW, BH_), 18)
CAP_Y = MEDIA_Y + max(CH_, BH_) + 46

# ---------- captions ----------
def ts(s):
    p = s.split(':'); return float(p[0]) * 3600 + float(p[1]) * 60 + float(p[2]) if len(p) == 3 else float(p[0]) * 60 + float(p[1])
BACK = re.compile(r"^(mm-?hmm|mm|hmm|yeah|yes|right|okay|wow|exactly|three|all idle ones\.? yeah)[.!,?]*( yeah[.!,]*)?$", re.I)
cues = []
for b in open(VTT).read().split('\n\n'):
    m = re.search(r'(\S+) --> (\S+)[^\n]*\n(.*)', b, re.S)
    if not m: continue
    a, e = ts(m[1]), ts(m[2])
    if e <= START or a >= END: continue
    keep = []
    for l in m[3].split('\n'):
        l = re.sub(r'</?v[^>]*>', '', l).strip()
        l = re.sub(r'^(Kirk|Nik):\s*', '', l)
        if l.startswith('- '): l = l[2:]
        l = re.sub(r'^(Kirk|Nik):\s*', '', l).strip()
        if l and not BACK.match(l): keep.append(l)
    if keep: cues.append([max(a, START) - START, min(e, END) - START, ' '.join(keep)])
mx = ImageDraw.Draw(Image.new('L', (1, 1)))
def wrap(s, maxw=W - 2 * PX):
    lines, cur = [], ''
    for w in s.split():
        t = (cur + ' ' + w).strip()
        if mx.textlength(t, font=F_CAP) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines
def balance(ws):  # best 2-line split of a word list (shortest longest line)
    best = None
    for i in range(1, len(ws)):
        a, b = ' '.join(ws[:i]), ' '.join(ws[i:])
        m = max(mx.textlength(a, font=F_CAP), mx.textlength(b, font=F_CAP))
        if best is None or m < best[0]: best = (m, [a, b])
    return best[1]
def chunk(txt):
    ls = wrap(txt)
    if len(ls) == 1: return [ls]
    n = math.ceil(len(ls) / 2); ws = txt.split(); per = math.ceil(len(ws) / n); out = []
    for i in range(0, len(ws), per):
        part = ws[i:i + per]
        out.append(balance(part) if len(part) > 1 and mx.textlength(' '.join(part), font=F_CAP) > W - 2 * PX else [' '.join(part)])
    return out
shown = []  # (t0, t1, [line, line])
cues = [c for c in cues if c[1] - c[0] >= 0.4]
for a, e, txt in cues:
    chunks = chunk(txt)
    tot = sum(len(' '.join(c)) for c in chunks); t = a
    for c in chunks:
        dt = (e - a) * len(' '.join(c)) / tot; shown.append((t, t + dt, c)); t += dt
json.dump([[round(a, 2), round(e, 2), c] for a, e, c in shown], open(OUT + '.cues.json', 'w'), indent=0)

# ---------- audio: cut, fades, two-pass loudnorm to -16 LUFS ----------
AUD = OUT + '.wav'
meas = subprocess.run(['ffmpeg', '-hide_banner', '-ss', str(START), '-t', str(DUR), '-i', SRC, '-vn', '-af',
                       'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
mj = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
af = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={mj['input_i']}:measured_TP={mj['input_tp']}:measured_LRA={mj['input_lra']}:"
      f"measured_thresh={mj['input_thresh']}:offset={mj['target_offset']}:linear=true,aresample=48000,"
      f"afade=t=in:st=0:d=0.12,afade=t=out:st={DUR - 0.45:.2f}:d=0.45")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(START), '-t', str(DUR), '-i', SRC, '-vn', '-af', af, '-ac', '2', AUD], check=True)

# ---------- video ----------
def pinkish(p): return p[0] > 200 and p[2] > 190 and p[0] - p[1] > 30 and p[2] - p[1] > 25 and abs(p[0] - p[2]) < 40  # the show's pink background, not a pale wall
def mode_of(fr):
    a, b = fr.getpixel((1590, 1010)), fr.getpixel((1700, 600))
    if not pinkish(a) and sum(a) < 200 and pinkish(b): return 'card'
    if pinkish(a) and not pinkish(b) and not any(pinkish(fr.getpixel(q)) for q in ((488, 470), (1432, 470), (44, 232), (930, 232), (44, 710), (930, 710), (990, 232), (1876, 232), (990, 710), (1876, 710))): return 'side'
    return None

def compose(fr, mode):
    im = bg.copy()
    if mode == 'card':
        im.paste(fr.crop(CARD).resize((MW, CH_), Image.LANCZOS), (MX, MEDIA_Y), card_mask)
        sm = fr.crop(SMALL[WHO]).resize((SMW, SMH), Image.LANCZOS)
        im.paste(sm, (WX1 - 44 - SMW, 96), small_mask)
    else:
        im.paste(fr.crop(BIG[WHO]).resize((MW, BH_), Image.LANCZOS), (MX, MEDIA_Y), big_mask)
    return im

dec = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-ss', str(START), '-i', SRC, '-t', str(DUR), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        '-i', AUD, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '19', '-preset', 'medium', '-pix_fmt', 'yuv420p',
                        '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
n = 0; fs = SW * SH * 3; last_mode = None; frozen = None; fade_from = None; fade_n = 0; switches = []
while True:
    buf = dec.stdout.read(fs)
    if len(buf) < fs: break
    t = n / FPS; n += 1
    fr = Image.frombytes('RGB', (SW, SH), buf)
    m = mode_of(fr)
    if m is None:  # source layout is mid-transition: hold the last clean picture
        im = frozen if frozen is not None else compose(fr, 'side')
    else:
        im = compose(fr, m)
        if last_mode is not None and m != last_mode:
            fade_from, fade_n = frozen, 8; switches.append(round(t, 2))
        if fade_n > 0 and fade_from is not None:
            im = Image.blend(im, fade_from, fade_n / 9); fade_n -= 1
        last_mode = m; frozen = im
    im = im.copy(); dr = ImageDraw.Draw(im)
    for a, e, lines in shown:
        if a <= t < e:
            y = CAP_Y
            for l in lines:
                dr.text((W // 2, y), l, font=F_CAP, fill=(245, 245, 247), anchor='ma'); y += 64
            break
    if t > DUR - 1.6:
        k = min(1, (t - (DUR - 1.6)) / 0.4)
        dr.text((W // 2, WY1 - 50), 'postgres.fm', font=F_END, fill=tuple(int(c * k) for c in (61, 220, 132)), anchor='mm')
    enc.stdin.write(im.tobytes())
enc.stdin.close(); enc.wait(); dec.wait()
import os; os.remove(AUD)
print(json.dumps({'out': OUT, 'start': START, 'end': END, 'dur': round(DUR, 2), 'frames': n, 'mode_switches_at': switches, 'cues': len(shown)}))
