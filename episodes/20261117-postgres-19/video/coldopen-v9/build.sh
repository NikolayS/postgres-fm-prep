#!/usr/bin/env bash
# WORK is the coldopen-final directory; output directory must be gitignored.
set -euo pipefail
: "${WORK:?}"; H="$(cd "$(dirname "$0")" && pwd)"; OUT="${1:?output directory}"; QA="${2:?scratch directory}"
check_disk() { [ "$(df -Pk "$QA" | awk 'END {print $4}')" -ge 3145728 ] || { echo 'STOP: less than 3 GiB free' >&2; exit 1; }; }
mkdir -p "$QA"; check_disk
V8="$OUT/cold-open-v8.mp4"; T="$WORK/v7/v8tmp"
bun "$H/check-geometry.ts" "$WORK/v7/faces.jsonl" "$QA/geometry.json"
# Reorder only voice bites 8 and 9; retain the v8 music/SFX timeline and mastering gain.
ffmpeg -v error -y -i "$T/voice.wav" -filter_complex '[0:a]atrim=0:37.2775,asetpts=PTS-STARTPTS[a];[0:a]atrim=39.8775:42.6775,asetpts=PTS-STARTPTS[b];[0:a]atrim=37.2775:39.8775,asetpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=0:a=1,apad=whole_dur=44.725[o]' -map '[o]' "$QA/voice.wav"
ffmpeg -v error -y -i "$QA/voice.wav" -i "$T/bg.wav" -filter_complex '[0:a][1:a]amix=inputs=2:normalize=0:duration=longest,atrim=0:44.645,apad=whole_dur=44.725,afade=t=in:d=0.05,afade=t=out:st=44.125:d=0.5,volume=2dB,alimiter=limit=0.75:level=false[o]' -map '[o]' "$QA/mix.wav"
# Preserve the delivered v8 prefix audio exactly after decoding; new mix starts on the closing exchange.
ffmpeg -v error -y -i "$V8" -i "$QA/mix.wav" -filter_complex '[0:a]atrim=0:37.2775,asetpts=PTS-STARTPTS[a];[1:a]atrim=37.2775:44.725,asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1[o]' -map '[o]' "$QA/audio.wav"
for variant in a b; do
 check_disk
 FR="$QA/fr-$variant"
 VARIANT="$variant" bun "$H/render.ts" "$WORK/v7" "$FR"
 bun "$H/../coldopen-v8/check-caps.ts" "$FR" "${FACES_BIN:?compiled v8 faces.swift}" > "$QA/captions-$variant.log"
 ffmpeg -v error -y -i "$V8" -framerate 25 -start_number 932 -i "$FR/%04d.jpg" -i "$QA/audio.wav" -filter_complex '[0:v]trim=end_frame=932,setpts=PTS-STARTPTS[p];[1:v]setpts=PTS-STARTPTS[q];[p][q]concat=n=2:v=1:a=0[v]' -map '[v]' -map 2:a -t 44.725 -c:v libx264 -threads 4 -profile:v high -pix_fmt yuv420p -r 25 -crf 18 -preset medium -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT/cold-open-v9$variant.mp4"
 # Keep just a few review frames; remove render intermediates immediately.
 for f in 1064 1080 1095; do cp "$FR/$f.jpg" "$QA/$variant-$f.jpg"; done
 find "$FR" -name '*.jpg' -delete
 ffmpeg -v error -i "$OUT/cold-open-v9$variant.mp4" -f null -
 bun "$H/check-audio.ts" "$QA" "$OUT/cold-open-v9$variant.mp4" "$QA/audio-$variant.json" "$T"
 check_disk
done
