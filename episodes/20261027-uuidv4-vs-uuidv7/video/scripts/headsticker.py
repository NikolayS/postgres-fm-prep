import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
cut, out, cx, cy, rx, ry, scale = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:8])
im = np.array(Image.open(cut).convert('RGBA')).astype(float); a = im[..., 3] / 255
H, W = a.shape; yy, xx = np.mgrid[0:H, 0:W]
e = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
m = a * np.clip((1 - e) / 0.10, 0, 1)
m *= np.clip((cy + ry * 1.0 - yy) / (ry * 0.22), 0, 1)       # soft fade at the neck
lab, n = nd.label(m > 0.3); keep = lab == 1 + int(np.argmax(nd.sum(m > 0.3, lab, range(1, n + 1))))
m *= nd.binary_dilation(keep, iterations=3)
im[..., 3] = m * 255
ys, xs = np.where(m > 0.03); im = im[ys.min():ys.max() + 1, xs.min():xs.max() + 1].clip(0, 255).astype(np.uint8)
img = Image.fromarray(im); img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
img.save(out); print(out, img.size)
