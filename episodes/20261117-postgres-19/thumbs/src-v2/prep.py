# Episode 197 covers v2: head cutouts from the final video, picks N1, M1, K1.
# Steps: tile frame (608x342) -> Real-ESRGAN x4 (realesrgan-x4plus) -> Apple Vision person mask (seg.swift)
# -> here: blend the ESRGAN image 50/50 with a plain Lanczos x4 of the tile (ESRGAN alone looks painted),
# mask repairs and exposure. No face retouching: only tone curves and mask edits.
# Usage: python3 prep.py <dir with {nik,mic,kirk}-x4.png and -cut.png>  -> heads/{nik,mic,kirk}.png
import sys, os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
d = sys.argv[1]; os.makedirs('heads', exist_ok=True)

def tone(rgb, gamma=1.0, contrast=1.0, sat=1.0, rmul=1.0, shoulder=None):
    a = np.asarray(rgb).astype(np.float32) / 255
    a[..., 0] *= rmul
    if shoulder:                      # compress highlights above the knee (blown webcam)
        k, m = shoulder; hi = a > k
        a[hi] = k + (a[hi] - k) * m
    a = np.clip(a, 0, 1) ** gamma
    im = Image.fromarray((a * 255).astype(np.uint8))
    return ImageEnhance.Color(ImageEnhance.Contrast(im).enhance(contrast)).enhance(sat)

for p in ('nik', 'mic', 'kirk'):
    rgb = Image.open(f'{d}/{p}-x4.png').convert('RGB')
    soft = Image.open(f'{d}/{p}-raw.png').convert('RGB').resize(rgb.size, Image.LANCZOS)
    rgb = Image.blend(soft, rgb, 0.5)
    al = np.asarray(Image.open(f'{d}/{p}-cut.png').getchannel('A')).astype(np.float32)
    px = np.asarray(rgb).astype(np.float32)
    if p == 'mic':
        yy, xx = np.mgrid[0:al.shape[0], 0:al.shape[1]]
        al[(xx > 2140) & (yy < 1150 + (xx - 2140) * 0.3)] = 0; al[:, 2330:] = 0   # room clutter right of the shoulder
        from PIL import ImageDraw                              # wall seen between the headphone band and the head
        m = Image.new('L', (al.shape[1], al.shape[0]), 0)
        ImageDraw.Draw(m).polygon([(1088,610),(1105,545),(1145,500),(1200,468),(1218,480),(1188,530),(1172,580),(1166,628),(1095,628)], fill=255)
        al = np.where(np.asarray(m) > 0, 0, al)
        m = Image.new('L', (al.shape[1], al.shape[0]), 0)      # right headphone cup: the mask is ragged there
        ImageDraw.Draw(m).polygon([(1650,372),(1725,415),(1790,520),(1830,640),(1840,800),(1812,930),(1760,992),(1705,1000),(1712,800),(1705,560),(1690,470)], fill=255)
        cup = np.asarray(m) > 0
        al = np.where(cup, np.where(px.sum(-1) < 300, 255, 0), al).astype(np.float32)
    A = Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(2.2))
    A = A.point(lambda v: max(0, min(255, int((v - 90) * 2.2))))
    if p == 'nik':  rgb = tone(rgb, gamma=0.86, contrast=1.08, sat=1.06)
    if p == 'mic':  rgb = tone(rgb, gamma=0.92, contrast=1.10, sat=0.96, rmul=0.97)
    if p == 'kirk': rgb = tone(rgb, gamma=1.04, contrast=1.10, sat=0.80, rmul=0.97, shoulder=(0.82, 0.6))
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=5, percent=55, threshold=2))
    out = Image.merge('RGBA', (*rgb.split(), A)).crop((0, 0, 2432, 1356))   # drop the tile border at the bottom
    out.save(f'heads/{p}.png'); print(p, out.size)
