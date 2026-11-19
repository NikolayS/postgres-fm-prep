#!/usr/bin/env bash
# Join a cold open in front of the episode body (stream copy, as episode 196 v7-coldopen.sh),
# then set the chapter and link times for its length.
#   bash join.sh <cold-open.mp4>     -> preview/episode-197-final.mp4
set -euo pipefail
E="$(cd "$(dirname "$0")/../.." && pwd)"
CO="$1"; BODY="${BODY:-$E/preview/episode-197-body-v5.mp4}"; OUT="$E/preview/episode-197-final.mp4"
for f in "$CO" "$BODY"; do ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of csv=p=0 "$f"; done
L=$(mktemp); printf "file '%s'\nfile '%s'\n" "$CO" "$BODY" > "$L"
ffmpeg -v error -y -f concat -safe 0 -i "$L" -c copy -movflags +faststart "$OUT.part.mp4" && mv "$OUT.part.mp4" "$OUT"; rm -f "$L"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CO")
python3 "$E/video/final/edit/set_times.py" "$D"
echo "$OUT $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s; cold open $D s"
