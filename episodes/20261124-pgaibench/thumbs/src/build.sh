#!/bin/bash
# Episode 198 covers: thumb-a/b/c.png (1280x720), square-3000.png, playlist-check.png, contact-sheet.png.
# Needs: ffmpeg, Google Chrome, python3 + Pillow + numpy, swiftc, realesrgan-ncnn-vulkan v0.2.5.0 in $REALESRGAN
# (its models/ folder next to the binary). Frame pick: rank.py / rank2.py / cand.py over facescore.swift CSV
# (tools/podcast-edit/cover/facescore.swift), 60-3600 s at 0.5 fps, Kirk camera-off 2018-2151 s skipped.
set -e; cd "$(dirname "$0")"
REPO=$(cd ../../../.. && pwd); W=${WORK:-$PWD/work}; mkdir -p "$W"
V="$HOME/Documents/Zoom/2026-11-24 10.37.15 .fm recording/video1808680036.mp4"
OUT=${OUT:-"$HOME/Documents/Zoom/2026-11-24 10.37.15 .fm recording/review/covers"}; mkdir -p "$OUT"
[ -x "$W/faces" ] || swiftc -O "$REPO/tools/podcast-edit/qa/faces.swift" -o "$W/faces"
for a in nik:385.6:640 kirk:1991.4:0; do IFS=: read p t x <<<"$a"     # person : source second : Zoom tile x
  ffmpeg -v error -ss $t -i "$V" -frames:v 1 -vf "crop=640:360:$x:0" -y "$W/$p-raw.png"
  "${REALESRGAN:?}" -i "$W/$p-raw.png" -o "$W/$p-x4.png" -n realesrgan-x4plus -m "$(dirname "$REALESRGAN")/models"
done
[ -f "$W/ep197.jpg" ] || curl -sSL -o "$W/ep197.jpg" https://i.ytimg.com/vi/VcDU-NRE3hI/maxresdefault.jpg
python3 gen.py "$W" "$OUT" "$W/faces" "$REPO/episodes/20261110-temporary-tables/thumbs/thumb-d.png" "$W/ep197.jpg"
