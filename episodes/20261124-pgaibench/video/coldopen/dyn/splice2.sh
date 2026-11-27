#!/usr/bin/env bash
# splice2.sh <new picture (frames 0..) > <old final mp4> <out mp4> <a-b> [<a-b> ...]
# Re-encode only frame ranges [a, b] (a = a keyframe of the old file, b + 1 = the next one) from the
# new picture; every other frame is stream-copied from the old file (bit-identical); old audio.
set -euo pipefail
NEWPIC=$1; OLD=$2; OUT=$3; shift 3; d="$OUT.parts"; rm -rf "$d"; mkdir -p "$d"
cuts=(); for r in "$@"; do a=${r%-*}; b=${r#*-}; cuts+=("$a" "$((b + 1))"); done
times=$(printf "%s\n" "${cuts[@]}" | sort -n | uniq | awk '$1>0{printf "%s%.2f", s, $1/25; s=","}')
ffmpeg -nostdin -v error -y -i "$OLD" -map 0:v -c copy -f segment -segment_times "$times" -reset_timestamps 1 "$d/o%03d.mp4"
list=""; k=0; start=0
for f in $(ls "$d"/o*.mp4 | sort); do
  n=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$f")
  hit=""; for r in "$@"; do [ "${r%-*}" = "$start" ] && hit=$r; done
  if [ -n "$hit" ]; then a=${hit%-*}; b=${hit#*-}; [ $((b - a + 1)) = "$n" ] || { echo "range $hit != segment $n frames" >&2; exit 1; }
    ffmpeg -nostdin -v error -y -i "$NEWPIC" -vf "select=between(n\,$a\,$b),setpts=N/25/TB" -an -c:v libx264 -profile:v high -pix_fmt yuv420p -r 25 -crf 17 -preset medium "$d/n$k.mp4"
    list+="file '$d/n$k.mp4'"$'\n'
  else list+="file '$f'"$'\n'; fi
  start=$((start + n)); k=$((k + 1))
done
printf "%s" "$list" > "$d/list.txt"
ffmpeg -nostdin -v error -y -f concat -safe 0 -i "$d/list.txt" -c copy "$d/v.mp4"
ffmpeg -nostdin -v error -y -i "$d/v.mp4" -i "$OLD" -map 0:v -map 1:a -c copy -movflags +faststart "$OUT"
rm -rf "$d"
