"""Independent OpenCV check of every caption frame, including the bottom exclusion.
Usage: python check-opencv.py FRAME_DIR [VIDEO]
Requires opencv-python-headless. VIDEO checks decoded delivery frames, not intermediates.
Writes opencv-check.json beside the frames. Missing detections are reported, never hidden.
"""
import cv2, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
records = {r['i']: r for p in root.glob('caps-*.jsonl') for line in p.read_text().splitlines() if (r := json.loads(line))}
assert records, 'No caption records'
detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
video = cv2.VideoCapture(sys.argv[2]) if len(sys.argv) > 2 else None
rows, bad, missing = [], [], []
for i, r in sorted(records.items()):
    if video:
        video.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, im = video.read()
        assert ok, f'Cannot decode frame {i}'
    else:
        im = cv2.imread(str(root / f'{i:04}.jpg'))
    assert im is not None
    gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    boxes = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=7, minSize=(90,90))
    boxes = [[int(v) for v in b] for b in boxes]
    if not boxes: missing.append(i)
    for c in r['caps']:
        if c[1] < 0 or c[1] + c[3] > 900: bad.append({'frame': i, 'bottom_or_top': c})
        for x,y,w,h in boxes:
            # Haar boxes already include forehead; expand for hair/beard and margin.
            g = [x-10, y-h*.15-10, w+20, h*1.3+20]
            if c[0] < g[0]+g[2] and g[0] < c[0]+c[2] and c[1] < g[1]+g[3] and g[1] < c[1]+c[3]:
                bad.append({'frame': i, 'face': [x,y,w,h], 'caption': c})
    rows.append({'frame': i, 'faces': boxes})
result = {'frames': len(rows), 'faces': sum(len(r['faces']) for r in rows), 'missing': missing, 'violations': bad, 'detections': rows}
(root / 'opencv-check.json').write_text(json.dumps(result, indent=2))
print(json.dumps({k:v for k,v in result.items() if k != 'detections'}))
sys.exit(bool(bad))
