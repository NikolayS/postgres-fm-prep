import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
src, cut, out = sys.argv[1:4]
rgb = np.array(Image.open(src).convert('RGB'))
a = np.array(Image.open(cut).convert('RGBA'))[..., 3].astype(float)
m = a > 110                                  # core silhouette, drop haze
m = nd.binary_opening(m, iterations=2)
lab, n = nd.label(m); sizes = nd.sum(m, lab, range(1, n + 1))
m = lab == (1 + int(np.argmax(sizes)))      # largest blob = elephant
m = nd.binary_closing(m, iterations=6)
m = nd.binary_fill_holes(m)                  # tusk etc. inside the outline
alpha = nd.gaussian_filter(m.astype(float), 1.0) * 255
Image.fromarray(np.dstack([rgb, alpha.clip(0, 255).astype(np.uint8)])).save(out)
