# Score Michael's frames for a real, still smile. Input: JSON lines from face.swift (frames named NNNNN.jpg
# at FPS from T0, or <base>-NN.jpg refine frames listed in a times file). Output: rows with features.
import json, sys, statistics as st
from PIL import Image, ImageFilter, ImageStat
def feats(f, path):
    if not (f['lips'] and f['le'] and f['re'] and f['inner'] and f['lp'] and f['rp']): return None
    c = lambda P: (sum(q[0] for q in P) / len(P), sum(q[1] for q in P) / len(P))
    lc, rc = c(f['le']), c(f['re']); iod = ((rc[0]-lc[0])**2 + (rc[1]-lc[1])**2) ** .5
    eo = lambda e: (max(q[1] for q in e) - min(q[1] for q in e)) / (max(q[0] for q in e) - min(q[0] for q in e))
    L = f['lips']; a = min(L, key=lambda q: q[0]); b = max(L, key=lambda q: q[0])
    mid = [q[1] for q in L if abs(q[0] - (a[0]+b[0])/2) < (b[0]-a[0]) * 0.15]
    I = f['inner']; x, y, w, h = f['box']
    im = Image.open(path).convert('L').crop((x, y, x+w, y+h))
    return dict(iod=iod, mw=(b[0]-a[0])/iod, lift=(sum(mid)/len(mid) - (a[1]+b[1])/2) / iod,   # corners above the lip middle: positive
        op=(max(q[1] for q in I) - min(q[1] for q in I)) / iod, eye=min(eo(f['le']), eo(f['re'])),
        gaze=((f['lp'][0][1]-lc[1]) + (f['rp'][0][1]-rc[1])) / 2 / iod,                          # pupils above the eye centre: negative
        pitch=f['pitch'], yaw=f['yaw'], roll=f['roll'], q=f['q'], box=f['box'], eyes=[lc, rc],
        sharp=ImageStat.Stat(im.filter(ImageFilter.FIND_EDGES)).var[0])
def load(jsonl, tmap):
    rows = []
    for l in open(jsonl):
        r = json.loads(l)
        if len(r['faces']) != 1: continue
        x = feats(r['faces'][0], r['f'])
        if x: x['f'] = r['f']; x['t'] = tmap(r['f']); rows.append(x)
    return sorted(rows, key=lambda r: r['t'])
def score(rows, ref=None, win=1.0):
    ref = ref or rows; med = lambda k: st.median(r[k] for r in ref)
    M = {k: med(k) for k in ('mw', 'eye', 'pitch', 'iod', 'sharp', 'lift')}
    for i, r in enumerate(rows):
        nb = [q for q in rows[max(0, i-12):i+13] if abs(q['t'] - r['t']) <= win]
        r['still'] = max(abs(q['op'] - r['op']) for q in nb) + max(abs(q['mw'] - r['mw']) for q in nb)   # speech moves the mouth
        r['smile'] = (r['mw'] - M['mw']) * 3 + (r['lift'] - M['lift']) * 4
        ok = (len(nb) >= 3 and r['eye'] >= M['eye'] * 0.9 and abs(r['yaw']) < 0.2 and abs(r['roll']) < 0.2
              and r['pitch'] >= M['pitch'] - 0.03 and r['gaze'] > -0.035 and abs(r['iod'] - M['iod']) / M['iod'] < 0.2 and r['op'] < 0.3)
        r['score'] = (r['smile'] + r['eye'] * 1.0 + (r['pitch'] - M['pitch']) * 1.5 - abs(r['yaw']) - r['still'] * 2.5
                      + min(r['sharp'], 2 * M['sharp']) / M['sharp'] * 0.15) if ok else -9
    return M
if __name__ == '__main__':
    fps = float(sys.argv[3]) if len(sys.argv) > 3 else 2
    rows = load(sys.argv[1], lambda f: (int(f.split('/')[-1][:5]) - 1) / fps)
    M = score(rows); json.dump(rows, open(sys.argv[2], 'w')); print(len(rows), M)
    pick = []
    for r in sorted(rows, key=lambda r: -r['score']):
        if r['score'] > -9 and all(abs(r['t'] - q['t']) >= 30 for q in pick): pick.append(r)
    for r in pick[:48]: print('%7.1f score %.2f smile %.2f op %.2f still %.2f eye %.2f pitch %.2f gaze %.3f' % (r['t'], r['score'], r['smile'], r['op'], r['still'], r['eye'], r['pitch'], r['gaze']))
    json.dump(pick[:48], open(sys.argv[2].replace('.json', '-top.json'), 'w'))
