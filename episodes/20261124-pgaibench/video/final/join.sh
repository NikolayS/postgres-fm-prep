#!/usr/bin/env bash
# Episode 198 final = a cold-open variant (video/coldopen: cut.sh, marker.ts, finish.sh) + the levelled body.
# The variant is re-encoded to the body's format (h264 High, 25 fps, same timescale, AAC 48 kHz stereo),
# then joined by stream copy.
#   bash join.sh <review-dir> <cold-open.mp4>       -> <review>/final/episode-198-final.mp4
set -euo pipefail
R="$1"; CO="$2"; cd "$R/final"
B=${BODY:-episode-198-body-lv.mp4}
TS=$(ffprobe -v error -select_streams v -show_entries stream=time_base -of csv=p=0 "$B" | cut -d/ -f2)
ffmpeg -nostdin -v error -y -i "$CO" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 25 -video_track_timescale "$TS" \
  -c:a aac -b:a 192k -ar 48000 -ac 2 coldopen-198.mp4
printf "file '%s'\nfile '%s'\n" "$PWD/coldopen-198.mp4" "$PWD/$B" > concat.txt
ffmpeg -nostdin -v error -y -f concat -safe 0 -i concat.txt -c copy -movflags +faststart episode-198-final.part.mp4
mv episode-198-final.part.mp4 episode-198-final.mp4
for f in coldopen-198.mp4 episode-198-final.mp4; do echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
