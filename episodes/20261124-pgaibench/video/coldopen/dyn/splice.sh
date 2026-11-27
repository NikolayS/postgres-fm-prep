# splice.sh <remotion picture> <old final mp4> <out mp4> <first old keyframe frame>: new picture for frames
# [0, K), the old file's own encoded frames from keyframe K on (stream copy, bit-identical), old audio.
set -euo pipefail
NEWPIC=$1; OLD=$2; OUT=$3; K=$4; T=$(echo "scale=3; $K/25" | bc); d=$(dirname "$OUT")/.splice; mkdir -p "$d"
ffmpeg -nostdin -v error -y -i "$NEWPIC" -frames:v $K -an -c:v libx264 -profile:v high -pix_fmt yuv420p -r 25 -crf 17 -preset medium "$d/head.mp4"
ffmpeg -nostdin -v error -y -ss $T -i "$OLD" -map 0:v -c copy "$d/tail.mp4"
printf "file '%s'\nfile '%s'\n" "$d/head.mp4" "$d/tail.mp4" > "$d/list.txt"
ffmpeg -nostdin -v error -y -f concat -safe 0 -i "$d/list.txt" -c copy "$d/v.mp4"
ffmpeg -nostdin -v error -y -i "$d/v.mp4" -i "$OLD" -map 0:v -map 1:a -c copy -movflags +faststart "$OUT"
