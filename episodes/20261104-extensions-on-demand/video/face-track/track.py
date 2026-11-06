import json, sys, statistics as st
D = sys.argv[1]
TW, TH = 1024, 576            # tile size in the edited video
SC = TW / 512                 # detection frames were 512x288
X0, X1 = 8, TW - 8            # usable area after the global crop
Y0, Y1 = 7, int(TH * (1 - 0.072))
H = 526; W = round(H * 608 / 456) // 2 * 2; H = H // 2 * 2
FY = 0.55                     # face center at 55% of the crop height
raw = []
for l in open(f'{D}/faces.jsonl'):
    o = json.loads(l); i = int(o['f'][1:6]) - 1
    fs = [f for f in o['faces'] if f[4] > 0.5 and f[2] > 0.08]
    if fs:
        f = max(fs, key=lambda f: f[2] * f[3])
        cx = (f[0] + f[2] / 2) * 512 * SC; cy = (f[1] + f[3] / 2) * 288 * SC
        raw.append((i, cx, cy))
    else:
        raw.append((i, None, None))
# median over +-3 s
def med(k, j):
    v = [raw[m][k] for m in range(max(0, j - 3), min(len(raw), j + 4)) if raw[m][k] is not None]
    return st.median(v) if v else None
tx, ty = [], []
lx, ly = TW / 2, TH * 0.6
for j in range(len(raw)):
    a, b = med(1, j), med(2, j)
    if a is None: a, b = lx, ly
    lx, ly = a, b
    tx.append(min(max(a - W / 2, X0), X1 - W)); ty.append(min(max(b - FY * H, Y0), Y1 - H))
# camera: goal moves only past a dead zone; critically damped spring toward the goal
FPS = 25; DZX, DZY = 45, 30; OM = 2.2
cx, cy = tx[0], ty[0]; gx, gy = cx, cy; vx = vy = 0.0
out = []; last = None
for fr in range(len(raw) * FPS):
    t = fr / FPS; s = min(len(raw) - 1, int(t))
    if abs(tx[s] - gx) > DZX: gx = tx[s]
    if abs(ty[s] - gy) > DZY: gy = ty[s]
    dt = 1 / FPS
    for (p, v, g) in ((0, 0, 0),):
        pass
    ax = OM * OM * (gx - cx) - 2 * OM * vx; vx += ax * dt; cx += vx * dt
    ay = OM * OM * (gy - cy) - 2 * OM * vy; vy += ay * dt; cy += vy * dt
    k = (round(cx), round(cy))
    if k != last:
        out.append([round(t, 3), k[0], k[1]]); last = k
json.dump({'w': W, 'h': H, 'path': out}, open(f'{D}/nik-track.json', 'w'))
ys = [p[2] for p in out]
print('W,H', W, H, 'points', len(out), 'y range', min(ys), max(ys))
