"""Episode 195 (Extensions on demand), animation v3: "How many Postgres images would you potentially need?"
1080x1350, 30 fps. No operator name on screen. Linear scale for the one bar (it is to scale: 0 px).
Facts (episode cards, PostgresAI brief c501d438, transcript):
  220 extensions (card 3; Álvaro says "220 something" / "225"); 2^220 computed below (exact).
  Atoms in Earth ~1.33e50 (common estimate) -> 2^220 / 1.33e50 ~ 1.3e16.
  Age of the universe 13.8e9 years ~ 4.35e17 s -> fraction 4.35e17 / 2^220 ~ 2.6e-49.
  Registry: each extension is built once as its own image; the registry composes manifests on pull (Álvaro, 49:00-50:30).
  docker pull sgcr.io/postgres is the real command (demo); the exact URL syntax for extensions is not shown.
  e/citext/pgvector and e/pgvector/citext give the same digest f9ca85e9... (brief, run E2; that set is PG18 + citext + pgvector).
v3.2: two fair 'fat image' screens added (Trivy 397 vs 914, 253.18/98 MiB, Álvaro 19:28 quotes).
StackGres Containers screen held fully readable 4.55 s (48.0+1.0 .. 53.8-0.25).
v3.3: no side accent bars on the quotes.
v3.4: Big Bang bar labelled; Planck-length comparison (0.06 m * 2.585e-49 = 1.55e-50 m < 1.616e-35 m).
Usage: python3 ext_anim_v3.4.py out.mp4 poster.png
"""
import sys, math, random, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

W, H, FPS = 1080, 1350, 30
OUT, POSTER = sys.argv[1], sys.argv[2]
BG = (28, 20, 30); FG = (255, 255, 255); DIM = (153, 146, 153)
ORANGE = (252, 120, 24); YELLOW = (252, 212, 73); BLUE = (131, 197, 250); PINK = (238, 130, 228)
PILL_OFF = (58, 48, 62); INK = (28, 20, 30)

N = 2 ** 220
assert str(N) == '1684996666696914987166688442938726917102321526408785780068975640576'
AGE_S = 13.8e9 * 365.25 * 86400
FRAC_PCT = 100 * AGE_S / N                      # ~2.6e-47 %
EARTH = 1.33e50
RATIO_EARTH = N / EARTH                          # ~1.3e16
assert 1e16 < RATIO_EARTH < 2e16 and 2.5e-49 < AGE_S / N < 2.7e-49
_e = int(math.floor(math.log10(FRAC_PCT)))       # -47
_m = FRAC_PCT / 10 ** _e
PCT_STR = '0.' + '0' * (-_e - 1) + f'{_m:.1f}'.replace('.', '') + ' %'   # 0.000...0026 %

SANS = '/System/Library/Fonts/SFNS.ttf'
import os
MONO_B = os.path.expanduser('~/Library/Fonts/JetBrainsMono-Bold.ttf')
_fc = {}
def sans(size, weight=700):
    k = (int(size), weight)
    if k not in _fc:
        f = ImageFont.truetype(SANS, int(size)); f.set_variation_by_axes([100, min(96, max(17, size / 2)), 400, weight]); _fc[k] = f
    return _fc[k]
def mono(size):
    k = ('m', int(size))
    if k not in _fc: _fc[k] = ImageFont.truetype(MONO_B, int(size))
    return _fc[k]
def clamp(x): return max(0.0, min(1.0, x))
def ease(t): t = clamp(t); return t * t * (3 - 2 * t)
def eout(t): t = clamp(t); return 1 - (1 - t) ** 3
def seg(t, a, b): return ease((t - a) / (b - a))
def mix(c, a, bg=BG): return tuple(int(bg[i] + (c[i] - bg[i]) * a) for i in range(3))
def text(d, xy, s, font, fill, a=1.0, anchor='la'):
    if a > 0.01: d.text(xy, s, font=font, fill=mix(fill, a), anchor=anchor)

# timeline (s)
T1, T2, T3, T4, T4B, T4C, T5, T6, T7, T_END = 0.0, 3.5, 12.5, 23.0, 26.0, 33.5, 41.0, 48.0, 53.8, 55.8
def vis(t, a, b, fin=0.25, fout=0.25):
    """scene alpha; scene a..b with short cross-fades"""
    if b >= T_END: return seg(t, a - 0.1, a + fin) if a > 0 else 1.0
    return (seg(t, a - 0.1, a + fin) if a > 0 else 1.0) * (1 - seg(t, b - fout, b - 0.02))

NAMED = ['pgvector', 'postgis', 'citext', 'timescaledb', 'pg_cron', 'hypopg', 'pgaudit', 'hll', 'ltree', 'pg_partman']
GCOLS, GROWS = 21, 10                            # 210 tiny + 10 named = 220
assert GCOLS * GROWS + len(NAMED) == 220
rnd = random.Random(195)
state = [rnd.random() < 0.3 for _ in range(220)]
heat = [0.0] * 220
PICK = {'pgvector', 'citext', 'postgis'}

def layout_named(d, y0, font):
    out, x, y = [], 60, y0
    for nm in NAMED:
        w = d.textlength(nm, font=font) + 36
        if x + w > W - 60: x = 60; y += 66
        out.append((x, y, w)); x += w + 12
    return out

def draw_pills(d, g, t, a, y_named, y_grid, flip_rate, pick_mode=0.0):
    f = sans(34, 800)
    pos = layout_named(d, y_named, f)
    for i, (nm, (x, y, w)) in enumerate(zip(NAMED, pos)):
        on = state[i]
        if pick_mode > 0: on = nm in PICK
        col = YELLOW if on else PILL_OFF
        if pick_mode > 0 and nm in PICK:
            col = tuple(int(PILL_OFF[k] + (YELLOW[k] - PILL_OFF[k]) * pick_mode) for k in range(3))
        d.rounded_rectangle([x, y, x + w, y + 52], 26, fill=mix(col, a))
        tc = INK if on and (pick_mode == 0 or pick_mode > 0.5) else FG
        d.text((x + w / 2, y + 26), nm, font=f, fill=mix(tc, a, mix(col, a)), anchor='mm')
        if heat[i] > 0.05: g.rounded_rectangle([x - 4, y - 4, x + w + 4, y + 56], 30, fill=mix(YELLOW, 0.6 * a * heat[i], (0, 0, 0)))
    cw, chh, gx, gy = 40, 22, 6, 10
    x0 = (W - (GCOLS * cw + (GCOLS - 1) * gx)) / 2
    for r in range(GROWS):
        for c in range(GCOLS):
            i = len(NAMED) + r * GCOLS + c
            x, y = x0 + c * (cw + gx), y_grid + r * (chh + gy)
            on = state[i] and pick_mode == 0
            col = YELLOW if on else PILL_OFF
            d.rounded_rectangle([x, y, x + cw, y + chh], 11, fill=mix(col, a * (1 - 0.6 * pick_mode)))
            if heat[i] > 0.05: g.rounded_rectangle([x - 3, y - 3, x + cw + 3, y + chh + 3], 13, fill=mix(YELLOW, 0.7 * a * heat[i], (0, 0, 0)))
    return y_grid + GROWS * (chh + gy)

def commas(n): return f'{n:,}'
def wrap_chars(s, n):
    # break a comma-grouped number into lines of <= n chars, at group boundaries
    groups, lines, cur = s.split(','), [], ''
    for gp in groups:
        add = (',' if cur else '') + gp
        if len(cur) + len(add) > n and cur: lines.append(cur + ','); cur = gp
        else: cur += add
    lines.append(cur); return lines

def header(d):
    d.rectangle([0, 0, W, 8], fill=PINK)
    text(d, (60, 44), 'postgres.fm', mono(34), PINK)
    text(d, (W - 60, 44), 'Extensions on demand', sans(34, 600), DIM, anchor='ra')

def scene_count(d, g, t):
    a = vis(t, T1, T3)
    if a <= 0: return
    # title (frame 0 readable), replaced by the answer at T2+4.6
    ta = 1 - seg(t, T2 + 4.3, T2 + 4.6)
    text(d, (60, 112), 'How many Postgres images', sans(70, 900), FG, a * ta)
    text(d, (60, 194), 'would you potentially need?', sans(70, 900), FG, a * ta)
    text(d, (60, 300), '220 extensions. Each one: on or off.', sans(42, 700), YELLOW, a * ta)
    # flips speed up during the count
    lt = t - T2
    if 0 <= lt < 4.4:
        rate = 0.3 + 14 * (lt / 4.4) ** 2
        for _ in range(int(rate) + (1 if rnd.random() < rate % 1 else 0)):
            i = rnd.randrange(220); state[i] = not state[i]; heat[i] = 1.0 if state[i] else 0.0
    for i in range(220): heat[i] *= 0.82
    ga = a * (1 - seg(t, T2 + 4.3, T2 + 4.8))
    gy_end = draw_pills(d, g, t, ga, 370, 590, 0)
    # counter: k from 1 to 220 (exponential in time: value doubles each step)
    if t < T2:
        k = 1; ca = seg(t, 1.2, 1.6)
    else:
        k = 1 + int(round(219 * (clamp(lt / 4.2) ** 1.6))); ca = 1.0
    k = max(1, min(220, k))
    val = commas(2 ** k)
    big = seg(t, T2 + 4.4, T2 + 5.0)             # grow to fill the screen
    if big < 1:
        cpl = max(24, math.ceil(len(val) / 3) + 2)   # chars per line so that it fits in 3 lines
        lines = wrap_chars(val, cpl)
        fsz = min(64, int(960 / (max(len(l) for l in lines) * 0.62)))
        y = gy_end + 30
        text(d, (60, y), f'2^{k} =' if k > 1 else '1 extension: 2 images', sans(40, 800), DIM, a * ca * (1 - big))
        for j, l in enumerate(lines[-3:]):
            text(d, (60, y + 56 + j * (fsz + 12)), l, mono(fsz), ORANGE, a * ca * (1 - big))
            if j == len(lines[-3:]) - 1 and t >= T2:
                g.text((60, y + 56 + j * (fsz + 12)), l, font=mono(fsz), fill=mix(ORANGE, 0.5 * a, (0, 0, 0)))
    if big > 0:
        ba = a * big
        text(d, (60, 110), '2²²⁰ possible images', sans(76, 900), FG, ba)
        text(d, (60, 210), '(220 extensions, on or off)', sans(40, 600), DIM, ba)
        lines = wrap_chars(commas(N), 20)        # 5 lines
        fsz = 64 + 8 * big
        for j, l in enumerate(lines):
            y = 330 + j * 104
            text(d, (60, y), l, mono(fsz), ORANGE, ba)
            g.text((60, y), l, font=mono(fsz), fill=mix(ORANGE, 0.45 * ba, (0, 0, 0)))
        text(d, (60, 900), '≈ 1.7 × 10⁶⁶', sans(110, 900), FG, a * seg(t, T2 + 5.0, T2 + 5.4))
        text(d, (60, 1050), 'a 67-digit number of images', sans(44, 700), YELLOW, a * seg(t, T2 + 5.4, T2 + 5.8))

def scene_scale(d, g, t):
    a = vis(t, T3, T4)
    if a <= 0: return
    lt = t - T3
    text(d, (60, 110), 'How big is that?', sans(76, 900), FG, a)
    b1 = a * seg(lt, 0.4, 0.8)
    text(d, (60, 250), '≈ 10¹⁶ ×', sans(120, 900), ORANGE, b1)
    text(d, (60, 400), 'the atoms in planet Earth', sans(50, 800), FG, b1)
    text(d, (60, 466), '(Earth has about 1.3 × 10⁵⁰ atoms)', sans(36, 600), DIM, b1)
    # little Earth with sparkles
    if b1 > 0:
        cx, cy, r = 900, 320, 70
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=mix(BLUE, b1))
        d.ellipse([cx - 30, cy - 40, cx + 10, cy - 5], fill=mix((90, 160, 110), b1, mix(BLUE, b1)))
        d.ellipse([cx + 5, cy + 5, cx + 45, cy + 40], fill=mix((90, 160, 110), b1, mix(BLUE, b1)))
        g.ellipse([cx - r - 10, cy - r - 10, cx + r + 10, cy + r + 10], fill=mix(BLUE, 0.35 * b1, (0, 0, 0)))
    b2 = a * seg(lt, 1.6, 2.0)
    text(d, (60, 590), 'Build one image every second', sans(50, 800), FG, b2)
    text(d, (60, 652), 'since the Big Bang (4.35 × 10¹⁷ s):', sans(50, 800), FG, b2)
    b3 = a * seg(lt, 2.3, 2.7)
    text(d, (60, 742), 'Progress after 13.8 billion years,', sans(40, 800), YELLOW, b3)
    text(d, (60, 792), 'drawn to scale:', sans(40, 800), YELLOW, b3)
    if b3 > 0:
        x0, y0, x1 = 60, 856, W - 60
        d.rounded_rectangle([x0, y0, x1, y0 + 72], 14, outline=mix(DIM, b3), width=4)
        # fill is to scale: 2.6e-49 of the track = 0 px; the pulsing cursor marks where it is
        pulse = 0.55 + 0.45 * math.sin(lt * 6)
        d.rectangle([x0 + 7, y0 + 9, x0 + 12, y0 + 63], fill=mix(YELLOW, b3 * pulse))
        g.rectangle([x0 + 3, y0 + 5, x0 + 16, y0 + 67], fill=mix(YELLOW, 0.5 * b3 * pulse, (0, 0, 0)))
        text(d, (x0 + 30, y0 + 36), '← the filled part is here', sans(36, 800), YELLOW, b3, anchor='lm')
        text(d, (60, 950), 'done: ' + PCT_STR, mono(24), DIM, b3)
    b4 = a * seg(lt, 3.2, 3.6)
    text(d, (60, 1010), 'The filled part is 2.6 × 10⁻⁴⁹ of the bar.', sans(40, 800), FG, b4)
    b5 = a * seg(lt, 4.0, 4.4)
    text(d, (60, 1076), 'On a phone screen, that is smaller', sans(44, 900), ORANGE, b5)
    text(d, (60, 1132), 'than the Planck length.', sans(44, 900), ORANGE, b5)

def scene_old(d, g, t):
    a = vis(t, T4, T4B)
    if a <= 0: return
    lt = t - T4
    text(d, (60, 110), 'The old ways', sans(76, 900), FG, a)
    b1 = a * seg(lt, 0.2, 0.6)
    text(d, (60, 260), '1. Prebuild every image?', sans(56, 800), FG, b1)
    if b1 > 0:
        x0, y0, x1 = 60, 360, W - 60
        d.rounded_rectangle([x0, y0, x1, y0 + 56], 12, outline=mix(DIM, b1), width=3)
        pulse = 0.5 + 0.5 * math.sin(lt * 6)
        d.rectangle([x0 + 6, y0 + 8, x0 + 10, y0 + 48], fill=mix(YELLOW, b1 * pulse))
        text(d, (60, 440), 'CI: built 0.000…% of the images', mono(34), DIM, b1)
    text(d, (60, 540), 'Impossible.', sans(90, 900), ORANGE, a * seg(lt, 0.8, 1.1))

def scene_fat1(d, g, t):
    a = vis(t, T4B, T4C)
    if a <= 0: return
    lt = t - T4B
    text(d, (60, 100), '2. One fat image', sans(70, 900), FG, a)
    text(d, (60, 180), 'with every extension?', sans(70, 900), FG, a)
    text(d, (60, 290), 'Simple. It works. But:', sans(56, 900), YELLOW, a * seg(lt, 0.4, 0.7))
    b = a * seg(lt, 1.0, 1.3)
    text(d, (60, 400), 'More CVEs to own', sans(50, 900), ORANGE, b)
    text(d, (60, 462), 'Found by Trivy, all severities (linear scale):', sans(32, 600), DIM, b)
    k = 760 / 914.0
    for j, (lab, v, col, st) in enumerate([('official postgres:18.6', 397, BLUE, 1.3), ('+ 18 extensions (our fat image)', 914, ORANGE, 1.6)]):
        y = 530 + j * 140
        text(d, (60, y), lab, sans(38, 800), FG, b)
        p = eout((lt - st) / 0.8)
        if p > 0:
            d.rectangle([60, y + 50, 60 + v * k * p, y + 110], fill=mix(col, a))
            text(d, (60 + v * k * p + 16, y + 80), f'{v * p:.0f}', sans(54, 900), FG, a, anchor='lm')
    q = a * seg(lt, 2.6, 3.0)
    text(d, (60, 860), '“There may be plenty of CVEs', sans(42, 700), FG, q)
    text(d, (60, 914), 'within it … not all are vetted.”', sans(42, 700), FG, q)
    text(d, (60, 980), 'Álvaro Hernández, in the episode', sans(34, 600), DIM, q)
    text(d, (60, 1120), 'You scan and patch every extension,', sans(42, 800), FG, a * seg(lt, 3.3, 3.6))
    text(d, (60, 1174), 'even the ones you never use.', sans(42, 800), FG, a * seg(lt, 3.3, 3.6))

def scene_fat2(d, g, t):
    a = vis(t, T4C, T5)
    if a <= 0: return
    lt = t - T4C
    text(d, (60, 100), 'And the fat image', sans(70, 900), FG, a)
    text(d, (60, 180), 'is heavy and fragile', sans(70, 900), ORANGE, a)
    b = a * seg(lt, 0.4, 0.7)
    text(d, (60, 300), 'Every node pulls all of it', sans(50, 900), FG, b)
    text(d, (60, 362), 'Compressed size, MiB (linear scale):', sans(32, 600), DIM, b)
    k = 760 / 253.18
    p = eout((lt - 0.7) / 0.8)
    if p > 0:
        y = 420
        base_w = (253.18 - 98) * k
        tot = 253.18 * k * p
        d.rectangle([60, y, 60 + min(tot, base_w), y + 70], fill=mix(BLUE, a))
        if tot > base_w: d.rectangle([60 + base_w, y, 60 + tot, y + 70], fill=mix(ORANGE, a))
        text(d, (60 + tot + 14, y + 35), f'{253.18 * p:.0f}', sans(54, 900), FG, a, anchor='lm')
        la = a * seg(lt, 1.5, 1.8)
        text(d, (60, y + 86), 'Postgres', sans(34, 700), BLUE, la)
        text(d, (60 + base_w, y + 86), '18 extensions: 98', sans(34, 700), ORANGE, la)
    s2 = a * seg(lt, 1.9, 2.2)
    text(d, (60, 600), 'With all extensions: “several gigabytes”', sans(40, 800), FG, s2)
    text(d, (60, 652), '(Álvaro, from their own measurement)', sans(32, 600), DIM, s2)
    s3 = a * seg(lt, 2.7, 3.0)
    text(d, (60, 760), 'Extensions can clash', sans(50, 900), FG, s3)
    text(d, (60, 840), '“There’s gonna be some conflicts', sans(42, 700), FG, s3)
    text(d, (60, 894), 'with transitive dependencies.”', sans(42, 700), FG, s3)
    text(d, (60, 956), 'Álvaro Hernández', sans(34, 600), DIM, s3)
    s4 = a * seg(lt, 3.4, 3.7)
    text(d, (60, 1090), 'You need 3 extensions.', sans(48, 900), YELLOW, s4)
    text(d, (60, 1150), 'You ship all of them, everywhere.', sans(48, 900), FG, s4)

REG = [('base (OS files)', BLUE), ('Postgres 17', BLUE), ('Postgres 18', BLUE), ('citext', YELLOW), ('hypopg', YELLOW),
       ('pgvector', YELLOW), ('postgis', YELLOW), ('timescaledb', YELLOW)]
WANT = ['base (OS files)', 'Postgres 18', 'pgvector', 'citext', 'postgis']
def scene_dyn(d, g, t):
    a = vis(t, T5, T6)
    if a <= 0: return
    lt = t - T5
    text(d, (60, 100), 'The dynamic way', sans(76, 900), YELLOW, a)
    text(d, (60, 196), 'Pick what you need:', sans(42, 700), FG, a)
    for i in range(220): heat[i] *= 0.85
    pm = seg(lt, 0.4, 0.9)
    f = sans(34, 800); pos = layout_named(d, 260, f)
    for nm, (x, y, w) in zip(NAMED, pos):
        on = nm in PICK
        col = mix(YELLOW, pm, PILL_OFF) if on else PILL_OFF
        d.rounded_rectangle([x, y, x + w, y + 52], 26, fill=mix(col, a))
        d.text((x + w / 2, y + 26), nm, font=f, fill=mix(INK if (on and pm > 0.5) else DIM, a, mix(col, a)), anchor='mm')
        if on and 0.3 < pm < 1 or (on and lt < 1.4 and pm >= 1):
            g.rounded_rectangle([x - 5, y - 5, x + w + 5, y + 57], 30, fill=mix(YELLOW, 0.6 * a, (0, 0, 0)))
    ca = a * seg(lt, 1.1, 1.4)
    if ca > 0:
        d.rounded_rectangle([60, 470, W - 60, 548], 14, fill=mix((14, 10, 16), ca), outline=mix(DIM, 0.5 * ca), width=2)
        text(d, (84, 509), '$ docker pull sgcr.io/postgres…', mono(38), FG, ca, anchor='lm')
        text(d, (60, 562), 'the page gives you the URL for your set', sans(32, 600), DIM, ca)
    # registry shelf (left) -> your image (right)
    sa = a * seg(lt, 1.7, 2.0)
    text(d, (60, 620), 'Registry: layers', sans(36, 800), FG, sa)
    text(d, (60, 660), 'each built once', sans(32, 600), DIM, sa)
    text(d, (590, 620), 'Your image', sans(36, 800), FG, a * seg(lt, 2.2, 2.5))
    text(d, (590, 660), 'composed on pull', sans(32, 600), DIM, a * seg(lt, 2.2, 2.5))
    lw, lh, gap = 420, 50, 8
    for i, (nm, col) in enumerate(REG):
        y = 706 + i * (lh + gap)
        k = WANT.index(nm) if nm in WANT else -1
        d.rounded_rectangle([60, y, 60 + lw, y + lh], 10, fill=mix(col, sa * (0.35 if k >= 0 and lt > 2.4 + 0.3 * k else 1)))
        d.text((80, y + lh / 2), nm, font=sans(34, 800), fill=mix(INK, 1, mix(col, sa * (0.35 if k >= 0 and lt > 2.4 + 0.3 * k else 1))), anchor='lm')
        if k >= 0:
            st = 2.4 + 0.3 * k
            p = eout((lt - st) / 0.45)
            if p > 0:
                ty = 706 + (len(REG) - 1) * (lh + gap) - k * (lh + gap) - 0   # stack from the bottom up
                x = 60 + (590 - 60) * p; yy = y + (ty - y) * p
                d.rounded_rectangle([x, yy, x + lw, yy + lh], 10, fill=mix(col, a))
                d.text((x + 20, yy + lh / 2), nm, font=sans(34, 800), fill=INK, anchor='lm')
                if 0.6 < p and lt - st < 0.9:
                    g.rounded_rectangle([x - 6, yy - 6, x + lw + 6, yy + lh + 6], 14, fill=mix(col, 0.7 * a * (1 - clamp((lt - st - 0.45) / 0.45)), (0, 0, 0)))
    ma = a * seg(lt, 3.8, 4.2)
    text(d, (60, 1200), 'Each layer built once.', sans(46, 900), FG, ma)
    text(d, (60, 1258), 'Any combination composed on pull.', sans(46, 900), YELLOW, ma)

def scene_digest(d, g, t):
    a = vis(t, T6, T7)
    if a <= 0: return
    lt = t - T6
    text(d, (60, 100), 'Same set, any order', sans(76, 900), FG, a)
    text(d, (60, 190), '= same image, same digest', sans(60, 900), YELLOW, a * seg(lt, 0.1, 0.3))
    b = a * seg(lt, 0.2, 0.5)
    if b > 0:
        for j, s in enumerate(['…/e/citext/pgvector', '…/e/pgvector/citext']):
            y = 320 + j * 100
            d.rounded_rectangle([60, y, 640, y + 76], 14, fill=mix((14, 10, 16), b), outline=mix(DIM, 0.5 * b), width=2)
            text(d, (84, y + 38), s, mono(36), FG, b, anchor='lm')
            d.line([(650, y + 38), (720, 408)], fill=mix(YELLOW, b), width=5)
        d.rounded_rectangle([730, 370, W - 60, 446], 14, fill=mix(YELLOW, b))
        d.text((750, 408), 'f9ca85e9…', font=mono(36), fill=INK, anchor='lm')
        g.rounded_rectangle([724, 364, W - 54, 452], 18, fill=mix(YELLOW, 0.4 * b, (0, 0, 0)))
        text(d, (60, 540), 'Postgres 18 + citext + pgvector, measured', sans(34, 600), DIM, b)
    c = a * seg(lt, 0.6, 1.0)
    d.line([(60, 640), (W - 60, 640)], fill=mix(DIM, 0.4 * c), width=2)
    text(d, (60, 700), 'StackGres Containers', sans(80, 900), FG, c)
    text(d, (60, 800), '(public beta)', sans(50, 800), YELLOW, c)
    text(d, (60, 900), 'built on DOCIR,', sans(50, 800), FG, c)
    text(d, (60, 962), 'a dynamic OCI registry', sans(50, 800), FG, c)
    text(d, (60, 1090), 'stackgres.io/containers', mono(44), PINK, c)

def scene_end(d, g, t):
    a = vis(t, T7, T_END)
    if a <= 0: return
    text(d, (W / 2, 420), 'Postgres.FM', sans(150, 900), FG, a, anchor='ma')
    text(d, (W / 2, 610), 'Episode 195: Extensions on demand', sans(50, 700), YELLOW, a, anchor='ma')
    text(d, (W / 2, 720), 'with Álvaro Hernández (StackGres)', sans(44, 600), FG, a, anchor='ma')
    text(d, (W / 2, 776), 'and Kirk Wolak', sans(44, 600), FG, a, anchor='ma')
    text(d, (W / 2, 920), 'postgres.fm', mono(64), PINK, a, anchor='ma')

ff = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-profile:v', 'high', '-movflags', '+faststart', OUT]
p = subprocess.Popen(ff, stdin=subprocess.PIPE)
frames = int(round(T_END * FPS))
for fi in range(frames):
    t = fi / FPS
    img = Image.new('RGB', (W, H), BG); glow = Image.new('RGB', (W, H), (0, 0, 0))
    d, g = ImageDraw.Draw(img), ImageDraw.Draw(glow)
    header(d)
    for sc in (scene_count, scene_scale, scene_old, scene_fat1, scene_fat2, scene_dyn, scene_digest, scene_end): sc(d, g, t)
    out = ImageChops.add(img, glow.filter(ImageFilter.GaussianBlur(12)))
    p.stdin.write(out.tobytes())
    if fi == int((T2 + 6.5) * FPS): out.save(POSTER)
p.stdin.close(); p.wait()
print('frames', frames, 'seconds', T_END, 'pct', PCT_STR, 'earth ratio %.3g' % RATIO_EARTH)
