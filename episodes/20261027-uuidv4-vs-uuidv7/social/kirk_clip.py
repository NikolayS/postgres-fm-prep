import sys, re, subprocess
from PIL import Image, ImageDraw, ImageFont
SRC, VTT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
START, END = 18*60+3.6, 19*60+17.6
FPS = 25; SW, SH = 1920, 1080; W, H = 1080, 1350
def ts(s):
    h, m, r = s.split(':'); return int(h)*3600 + int(m)*60 + float(r)
cues = []
for b in open(VTT).read().split('\n\n'):
    m = re.search(r'(\S+) --> (\S+)\n(.*)', b, re.S)
    if not m: continue
    a, e = ts(m[1]), ts(m[2])
    if e < START or a > END: continue
    txt = ' '.join(l.strip().lstrip('- ').strip() for l in m[3].split('\n'))
    cues.append((max(a, START) - START, min(e, END) - START, txt))
SANS = '/System/Library/Fonts/SFNS.ttf'
def sans(size, w):
    f = ImageFont.truetype(SANS, size); f.set_variation_by_axes([100, min(96, max(17, size/2)), 400, w]); return f
F_CAP = sans(44, 700); F_NAME = sans(50, 800); F_SUB = sans(36, 600); F_SMALL = sans(32, 600)
TOP, BOT = (237, 129, 226), (249, 219, 245)
bg = Image.new('RGB', (W, H))
bd = ImageDraw.Draw(bg)
for y in range(H):
    k = y / H; bd.line([(0, y), (W, y)], fill=tuple(int(TOP[i] + (BOT[i]-TOP[i])*k) for i in range(3)))
INK = (45, 18, 48)
bd.text((500, 70), 'Kirk Wolak', font=F_NAME, fill=INK)
bd.text((500, 140), 'why UUIDv4 inserts', font=F_SUB, fill=INK)
bd.text((500, 184), 'slow down', font=F_SUB, fill=INK)
bd.text((500, 250), 'Postgres.FM 194', font=F_SMALL, fill=(110, 40, 110))
def rmask(size, r):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0]-1, size[1]-1], r, fill=255); return m
KX0, KY0, KX1, KY1 = 24, 360, 584, 718
KW = 430; KH = int((KY1-KY0) * KW / (KX1-KX0))
DX0, DY0, DX1, DY1 = 614, 120, 1306, 980
DH = 800; DW = int((DX1-DX0) * DH / (DY1-DY0))
kmask = rmask((KW, KH), 18); dmask = rmask((DW, DH), 22)
def wrap(d, s, font, maxw):
    words, lines, cur = s.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines
dec = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-ss', str(START), '-i', SRC, '-t', str(END-START),
                        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        '-ss', str(START), '-t', str(END-START), '-i', SRC, '-map', '0:v', '-map', '1:a',
                        '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
                        '-af', f'afade=t=out:st={END-START-0.6}:d=0.6', '-shortest', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
n = 0; fs = SW*SH*3
while True:
    buf = dec.stdout.read(fs)
    if len(buf) < fs: break
    t = n / FPS; n += 1
    fr = Image.frombytes('RGB', (SW, SH), buf)
    im = bg.copy()
    im.paste(fr.crop((KX0, KY0, KX1, KY1)).resize((KW, KH), Image.LANCZOS), (40, 50), kmask)
    im.paste(fr.crop((DX0, DY0, DX1, DY1)).resize((DW, DH), Image.LANCZOS), ((W-DW)//2, 350), dmask)
    cur = [c for c in cues if c[0] <= t < c[1]]
    if cur:
        d = ImageDraw.Draw(im)
        lines = wrap(d, cur[-1][2], F_CAP, 960)[:3]
        lh = 56; bh = lh*len(lines) + 28; y0 = 1165 if len(lines) < 3 else 1150
        d.rounded_rectangle([40, y0, W-40, y0+bh], 18, fill=(32, 18, 36))
        for i, l in enumerate(lines):
            d.text(((W - d.textlength(l, font=F_CAP))/2, y0 + 14 + i*lh), l, font=F_CAP, fill=(255, 255, 255))
    enc.stdin.write(im.tobytes())
enc.stdin.close(); enc.wait(); print('frames', n, 'cues', len(cues))
