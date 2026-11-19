# Episode 197 covers v2: head cutouts from the final video, picks N1, MA, K3.
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
    if p == 'mic':                                             # MA (raw recording 0:24.2)
        from PIL import ImageDraw
        al[:, 2090:] = 0                                       # ragged shoulder edge, behind Kirk on the cover
        m = Image.new('L', (al.shape[1], al.shape[0]), 0)      # right headphone cup: the mask is half transparent there
        ImageDraw.Draw(m).polygon([(1540,520),(1640,555),(1702,640),(1708,790),(1665,868),(1585,872),(1590,700),(1555,600)], fill=255)
        al = np.where((np.asarray(m) > 0) & (al > 25), 255, al).astype(np.float32)
        m = Image.new('L', (al.shape[1], al.shape[0]), 0)      # gap between the right band and the head: keep it filled, no hole
        ImageDraw.Draw(m).polygon([(1490,400),(1605,438),(1655,580),(1510,575)], fill=255)
        al = np.where(np.asarray(m) > 0, 255, al).astype(np.float32)
    blur = 5 if p == 'mic' else 2.2                            # smoother outline around the headphones
    A = Image.fromarray(al.astype(np.uint8)).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(blur))
    A = A.point(lambda v: max(0, min(255, int((v - 90) * 2.2))))
    if p == 'nik':  rgb = tone(rgb, gamma=0.86, contrast=1.08, sat=1.06)
    if p == 'mic':  rgb = tone(rgb, gamma=0.92, contrast=1.10, sat=0.96, rmul=0.97)
    if p == 'kirk': rgb = tone(rgb, gamma=1.04, contrast=1.10, sat=0.80, rmul=0.97, shoulder=(0.82, 0.6))
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=5, percent=55, threshold=2))
    out = Image.merge('RGBA', (*rgb.split(), A)).crop((0, 0, 2432, 1356))   # drop the tile border at the bottom
    out.save(f'heads/{p}.png'); print(p, out.size)
