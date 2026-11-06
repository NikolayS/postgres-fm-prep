# Stills from the preview clips (clip t = stillAt + 3) -> repo assets + review contact sheet.
import json, subprocess, os, sys
from PIL import Image, ImageDraw, ImageFont
R = "/Users/nik/Documents/Zoom/2026-11-04 14.09.51 .fm recording/review"
A = os.path.expanduser("~/github/postgres-fm-prep/episodes/20261104-extensions-on-demand/assets")
m = json.load(open(f"{R}/20-overlays/manifest-sfx.json"))["overlays"]
PICK = {"01-fat-image": [("01-fat-image", 40), ("01-fat-image-cves", 80)], "02-repo-down": [("02-repo-down", 24.6)],
        "03-combinations": [("03-combinations", 12.2)], "04-hashimoto": [("04-hashimoto", 34.8)], "05-preload-trap": [("05-preload-trap", 15.6)],
        "06-layers": [("06-layers", 55.8), ("06-layers-upgrade", 99)], "07-restart-outage": [("07-restart-outage", 38.7)]}
font = ImageFont.truetype(f"{R}/scratchpad/overlays/tool/public/fonts/Inter-Bold.ttf", 30)
tiles = []
for o in m:
    for name, sec in PICK[o["id"]]:
        dst = f"{A}/{name}.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(sec + 3), "-i", f"{R}/22-previews/{o['id']}.mp4", "-frames:v", "1", "-vf", "scale=1280:720", dst], check=True)
        im = Image.open(dst).convert("RGB").resize((960, 540))
        d = ImageDraw.Draw(im); f = 13 + o["outStart"] + sec
        d.rectangle([0, 0, 960, 44], fill=(0, 0, 0))
        d.text((12, 6), f"{name}  final {int(f//3600):02d}:{int(f%3600//60):02d}:{f%60:04.1f}  ({o['placement']}, {o['dur']:.0f} s)", font=font, fill=(255, 255, 255))
        tiles.append(im)
cols = 3; rows = (len(tiles) + cols - 1) // cols
sheet = Image.new("RGB", (960 * cols, 540 * rows))
for i, t in enumerate(tiles): sheet.paste(t, ((i % cols) * 960, (i // cols) * 540))
sheet.save(f"{R}/23-contact-sheet.png"); print(len(tiles), "stills")
