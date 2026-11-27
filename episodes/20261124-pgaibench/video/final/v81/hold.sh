#!/usr/bin/env bash
set -euo pipefail
cd "/Users/nik/Documents/Zoom/2026-11-24 10.37.15 .fm recording/review/overlays/out-v2"
H="$(cd "$(dirname "$0")" && pwd)"
while read id f d nd; do
  N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nw=1:nk=1 "$f" | tr -dc 0-9)
  X=$(python3 -c "print(round($nd*25)-$N)"); S=$((N-8))
  ( ffmpeg -nostdin -v error -y -i "$f" -vf "loop=loop=$X:size=1:start=$S,setpts=N/25/TB" -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le -an "hold/$id.mov" </dev/null && echo "done $id N=$N +$X" ) &
done < $H/plan.txt
wait
