#!/usr/bin/env bash
# Trim the cold open's tail for the join (re-encode only, no rebuild of its picture; a stream
# copy cannot cut the H.264 tail on the exact frame): keep frames before END s
# (the last three-way-split frame, after the last word), fade the sound out over the last FADE s,
# and raise its level by GAIN dB under a limiter, so the cold open is as loud as the body start.
#   bash trim-cold-open.sh <cold-open.mp4> <out.mp4> <END> [GAIN_DB=2.5] [FADE=0.06]
# Episode 197, v9a: END 43.76 (last word ends 43.72; the body starts with 0.334 s of room tone,
# so the seam gap is about 0.37 s), GAIN 2.5 (cold open -16.1 LUFS, body first minute -13.9).
set -euo pipefail
IN="$1"; OUT="$2"; END="$3"; GAIN="${4:-2.5}"; FADE="${5:-0.06}"
ST=$(echo "$END - $FADE" | bc -l)
ffmpeg -v error -y -i "$IN" -t "$END" -map 0:v -map 0:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 25 \
  -af "afade=t=out:st=$ST:d=$FADE,volume=${GAIN}dB,aresample=192000,alimiter=limit=0.75:level=false:attack=1:release=50,aresample=48000" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 "$OUT"
