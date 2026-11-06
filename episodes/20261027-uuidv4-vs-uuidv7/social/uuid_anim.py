import sys, math, random, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1350, 30
OUT = sys.argv[1]
POSTER = sys.argv[2]
BG = (17, 18, 20)
FG = (240, 240, 238)
DIM = (130, 132, 138)
V4 = (255, 98, 44)      # orange
V7 = (64, 196, 205)     # teal
CELL_IDLE = (38, 40, 45)

MONO_B = '/Users/nik/Library/Fonts/JetBrainsMono-Bold.ttf'
MONO = '/Users/nik/Library/Fonts/JetBrainsMono-Medium.ttf'
SANS = '/System/Library/Fonts/SFNS.ttf'

def sans(size, weight=700):
    f = ImageFont.truetype(SANS, size)
    f.set_variation_by_axes([100, min(96, max(17, size / 2)), 400, weight])
    return f
def mono(size, bold=True):
    return ImageFont.truetype(MONO_B if bold else MONO, size)

def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)
def seg(t, a, b):
    return ease((t - a) / (b - a))

def text_c(d, y, s, font, fill, alpha=1.0, x=None):
    if alpha <= 0: return
    col = tuple(int(BG[i] + (fill[i] - BG[i]) * alpha) for i in range(3))
    w = d.textlength(s, font=font)
    d.text(((W - w) / 2 if x is None else x, y), s, font=font, fill=col)

def mix(c, a):
    return tuple(int(BG[i] + (c[i] - BG[i]) * a) for i in range(3))

# index grids
COLS, ROWS, CS, GAP = 7, 10, 52, 9
GW = COLS * CS + (COLS - 1) * GAP
GH = ROWS * CS + (ROWS - 1) * GAP
N = COLS * ROWS
LX = 80; RX = W - 80 - GW; GY = 330
rnd = random.Random(7)
v4_fill = [rnd.uniform(0.5, 0.86) for _ in range(N)]
v4_heat = [0.0] * N
v4_touched = set()

T_TITLE, T_GRID, T_NUM, T_FIX, T_END = 0.0, 2.4, 8.4, 12.4, 15.5
frames = int(T_END * FPS)

def cell_xy(gx, i):
    r, c = divmod(i, COLS)
    return gx + c * (CS + GAP), GY + r * (CS + GAP)

def draw_grid(d, glow, gx, fills, heats, color, a):
    for i in range(N):
        x, y = cell_xy(gx, i)
        h = heats[i]
        base = mix(CELL_IDLE, a)
        d.rounded_rectangle([x, y, x + CS, y + CS], 8, fill=base)
        f = fills[i]
        if f > 0:
            fc = mix(tuple(int(CELL_IDLE[k] + (color[k] - CELL_IDLE[k]) * (0.28 + 0.72 * h)) for k in range(3)), a)
            top = y + CS - int(CS * f)
            d.rounded_rectangle([x, top, x + CS, y + CS], 8, fill=fc)
        if h > 0.05 and a > 0:
            g = mix(color, a * h)
            glow.rounded_rectangle([x - 6, y - 6, x + CS + 6, y + CS + 6], 12, fill=g)

ff = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', OUT]
p = subprocess.Popen(ff, stdin=subprocess.PIPE)

v7_count = 0.0
for fi in range(frames):
    t = fi / FPS
    img = Image.new('RGB', (W, H), BG)
    glow = Image.new('RGB', (W, H), (0, 0, 0))
    d = ImageDraw.Draw(img); g = ImageDraw.Draw(glow)

    # scene 1: title
    a1 = 1 - seg(t, 2.0, 2.4)
    if a1 > 0:
        text_c(d, 470, 'Your primary key:', sans(54, 600), DIM, a1)
        text_c(d, 560, 'id uuid default', mono(64), FG, a1)
        text_c(d, 650, 'gen_random_uuid()', mono(76), V4, a1)
        text_c(d, 790, 'What does it cost at 100M rows?', sans(50, 600), FG, a1)

    # scene 2: grids
    a2 = seg(t, T_GRID, T_GRID + 0.5) * (1 - seg(t, T_NUM - 0.4, T_NUM))
    if a2 > 0:
        lt = t - T_GRID
        text_c(d, 120, 'Every insert goes to one', sans(56, 700), FG, a2)
        text_c(d, 190, 'leaf of the primary key index', sans(56, 700), FG, a2)
        text_c(d, 270, 'UUIDv7', mono(40), V7, a2, x=LX + (GW - d.textlength('UUIDv7', font=mono(40))) / 2)
        text_c(d, 270, 'UUIDv4', mono(40), V4, a2, x=RX + (GW - d.textlength('UUIDv4', font=mono(40))) / 2)
        # v7: append to the right edge
        if lt > 0.4:
            v7_count = min(N - 1 + 0.999, 34 + (lt - 0.4) * 5.5)
        else:
            v7_count = 34
        full = int(v7_count)
        v7_f = [0.9 if i < full else 0 for i in range(N)]
        v7_h = [0.0] * N
        if full < N:
            v7_f[full] = 0.9 * (v7_count - full) + 0.08
            v7_h[full] = 0.85 + 0.15 * math.sin(lt * 18)
        # v4: random leaves light up
        if lt > 0.4:
            for _ in range(3):
                i = rnd.randrange(N)
                v4_heat[i] = 1.0
                v4_touched.add(i)
                v4_fill[i] = min(0.95, v4_fill[i] + 0.04)
                if v4_fill[i] >= 0.95: v4_fill[i] = 0.5   # split: half-empty again
        for i in range(N):
            v4_heat[i] *= 0.86
        draw_grid(d, g, LX, v7_f, v7_h, V7, a2)
        draw_grid(d, g, RX, v4_fill, v4_heat, V4, a2)
        yb = GY + GH + 34
        ca = a2 * seg(lt, 1.6, 2.1)
        text_c(d, yb, '1 hot leaf', sans(44, 700), V7, ca, x=LX + (GW - d.textlength('1 hot leaf', font=sans(44, 700))) / 2)
        hot = f'{len(v4_touched)} of {N} hot'
        text_c(d, yb, hot, sans(44, 700), V4, ca, x=RX + (GW - d.textlength(hot, font=sans(44, 700))) / 2)
        cb = a2 * seg(lt, 3.0, 3.5)
        text_c(d, yb + 100, 'UUIDv4 needs the whole index in memory.', sans(42, 600), FG, cb)
        text_c(d, yb + 158, 'Past it, almost every insert reads a page.', sans(42, 600), DIM, cb)

    # scene 3: numbers
    a3 = seg(t, T_NUM, T_NUM + 0.4) * (1 - seg(t, T_FIX - 0.4, T_FIX))
    if a3 > 0:
        lt = t - T_NUM
        text_c(d, 150, 'UUIDv4 at 100M rows,', sans(58, 700), FG, a3)
        text_c(d, 222, 'same server:', sans(58, 700), FG, a3)
        rows = [
            ('0.62–0.69×', 'insert rate vs an ordered key', 0.3),
            ('1.5–1.9×', 'WAL per row', 1.1),
            ('+33%', 'index size vs UUIDv7', 1.9),
        ]
        for k, (big, small, st) in enumerate(rows):
            ra = a3 * seg(lt, st, st + 0.35)
            if ra <= 0: continue
            y = 370 + k * 250 + int(30 * (1 - seg(lt, st, st + 0.35)))
            pop = 1 + 0.08 * math.sin(min(1, max(0, (lt - st) / 0.35)) * math.pi)
            text_c(d, y, big, sans(int(124 * pop), 800), V4, ra)
            text_c(d, y + 150, small, sans(42, 600), FG, ra)
            if ra > 0.5:
                bw = d.textlength(big, font=sans(int(124 * pop), 800))
                g.rounded_rectangle([(W - bw) / 2, y + 20, (W + bw) / 2, y + 130], 30, fill=mix(V4, 0.35 * ra))
        text_c(d, 1170, 'Postgres 18.6 · 16 clients · 1 GiB shared_buffers', mono(28, False), DIM, a3 * seg(lt, 2.4, 2.8))
        text_c(d, 1212, 'under a 3 GiB memory cap', mono(28, False), DIM, a3 * seg(lt, 2.4, 2.8))

    # scene 4: fix
    a4 = seg(t, T_FIX, T_FIX + 0.4)
    if a4 > 0:
        lt = t - T_FIX
        text_c(d, 250, 'Postgres 18 has uuidv7()', sans(60, 700), FG, a4)
        box_a = a4 * seg(lt, 0.3, 0.7)
        bx0, by0, bx1, by1 = 90, 400, W - 90, 700
        d.rounded_rectangle([bx0, by0, bx1, by1], 22, fill=mix((30, 32, 36), box_a), outline=mix(V7, box_a), width=3)
        d.text((bx0 + 44, by0 + 48), 'alter table events', font=mono(50), fill=mix(FG, box_a))
        d.text((bx0 + 44, by0 + 128), '  alter column id', font=mono(50), fill=mix(FG, box_a))
        d.text((bx0 + 44, by0 + 208 - 30), '', font=mono(50), fill=mix(FG, box_a))
        tail = '  set default '
        d.text((bx0 + 44, by0 + 128 + 0), '', font=mono(50))
        y3 = by0 + 128 + 80
        if y3 + 60 > by1:
            pass
        text_x = bx0 + 44
        d.text((text_x, by0 + 128 + 80 - 80 + 80), '', font=mono(50))
        # third line
        d.text((text_x, by0 + 48 + 160), tail, font=mono(50), fill=mix(FG, box_a))
        tw = d.textlength(tail, font=mono(50))
        ua = a4 * seg(lt, 0.8, 1.2)
        d.text((text_x + tw, by0 + 48 + 160), 'uuidv7();', font=mono(50), fill=mix(V7, ua))
        if ua > 0.5:
            uw = d.textlength('uuidv7();', font=mono(50))
            g.rounded_rectangle([text_x + tw - 8, by0 + 200, text_x + tw + uw + 8, by0 + 272], 14, fill=mix(V7, 0.4 * ua))
        text_c(d, 790, 'Same uuid type. New rows only.', sans(46, 600), FG, a4 * seg(lt, 1.3, 1.7))
        text_c(d, 852, 'Run it under a short lock_timeout.', sans(46, 600), DIM, a4 * seg(lt, 1.3, 1.7))
        ea = a4 * seg(lt, 1.9, 2.3)
        text_c(d, 1010, 'postgres.ai/blog', mono(52), V4, ea)
        text_c(d, 1090, 'PostgresAI', sans(44, 700), FG, ea)

    glow = glow.filter(ImageFilter.GaussianBlur(14))
    from PIL import ImageChops
    out = ImageChops.add(img, glow)
    p.stdin.write(out.tobytes())
    if abs(t - (T_NUM + 3.4)) < 0.5 / FPS:
        out.save(POSTER)
p.stdin.close(); p.wait()
print('frames', frames)
