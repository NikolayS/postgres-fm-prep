#!/bin/bash
# Episode 197 covers v2: heads, 4 thumbnails (1280x720), 4 square covers (3000x3000), review sheet.
# Usage: bash build.sh [--heads]   (--heads re-extracts and upscales the picks N1, MA, K3)
# Needs: ffmpeg, Google Chrome, python3 + Pillow + numpy, swiftc; for --heads also realesrgan-ncnn-vulkan
# (https://github.com/xinntao/Real-ESRGAN/releases, v0.2.5.0) in $REALESRGAN.
set -e; cd "$(dirname "$0")"
EP=$(cd ../.. && pwd); OUT=$EP/preview/covers-v2; V=$EP/preview/episode-197-final.mp4
RAW="$HOME/Documents/Zoom/2026-11-17 10.02.00 .fm recording/video1398514958.mp4"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT" work
if [ "$1" = "--heads" ] || [ ! -f heads/nik.png ]; then
  [ -x work/seg ] || swiftc -O seg.swift -o work/seg
  for a in nik:1057.4:24 mic:raw:656 kirk:1541.8:1288; do   # person : final-video seconds : tile x
    IFS=: read p t x <<<"$a"
    if [ $p = mic ]; then   # MA is from the raw Zoom recording (0:24.2), not the final video: 640x360 tile, scaled to the same 608x342 frame
      ffmpeg -nostdin -v error -ss 24.2 -i "$RAW" -frames:v 1 -vf "crop=640:360:640:360" -y work/mic-raw640.png
      "${REALESRGAN:?set REALESRGAN to the realesrgan-ncnn-vulkan binary}" -i work/mic-raw640.png -o work/mic-x4big.png -n realesrgan-x4plus
      python3 -c "from PIL import Image as I; I.open('work/mic-raw640.png').resize((608,342),I.LANCZOS).save('work/mic-raw.png'); I.open('work/mic-x4big.png').resize((2432,1368),I.LANCZOS).save('work/mic-x4.png')"
    else
      ffmpeg -nostdin -v error -ss $t -i "$V" -frames:v 1 -vf "crop=608:342:$x:300" -y work/$p-raw.png
      "${REALESRGAN:?set REALESRGAN to the realesrgan-ncnn-vulkan binary}" -i work/$p-raw.png -o work/$p-x4.png -n realesrgan-x4plus
    fi
    work/seg "$PWD/work/$p-x4.png" "$PWD/work/$p-cut.png"
  done
  python3 prep.py work
fi
for f in a-cut b-made-it c-git-log d-finally; do
  k=${f%%-*}
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1280,720 \
    --screenshot="$OUT/thumb-$f.png" "file://$PWD/$f.html" 2>/dev/null
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=3 --window-size=1000,1000 \
    --screenshot="$OUT/square-$f.png" "file://$PWD/$f.html?sq" 2>/dev/null
done
python3 sheet.py "$OUT"
# Final (2026-11-19): the channel-style V1, written by yt.py as FINAL-thumb.jpg and FINAL-square.jpg.
# Concepts A-D above are kept as rejected drafts (thumb-*.png, square-*.png); ab.py is no longer run.
python3 yt.py "$OUT"   # channel-style thumbnails yt-v1..v3.jpg and yt-sheet.png (episode 196 template)
