#!/bin/zsh
# Splice typing band cards into the complete v5 render, re-encoding only 4 keyframe-aligned windows.
set -e
R="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review"; O="$R/scratchpad/overlays"; W="$R/scratchpad/splice"
B="$R/23-full-draft-v5-shhik.mp4"; A=/private/tmp/claude-501/-Users-nik-gitlab-platform-all/2972b9ea-b972-48be-a654-9c7877a59634/scratchpad/preview-audio.mp4
OUT="$R/29-final-v9-splice.mp4"
cd "$W"
ffmpeg -v error -y -ss 605 -i "$B" -frames:v 1 clean.png
# name | window start | window len | card final start | card dur | bbox x y w h (12 px margin)
specs=(
 "01-uuid-versions-typing|610|50|618.42|30.42|0|788|1364|260"
 "04-same-speed-typing|1210|40|1213.92|26.2|6|903|771|156"
 "06-just-switch-typing|1910|40|1921.0|22.2|7|934|667|97"
 "08-keep-uuid-typing|2720|40|2726.64|25.1|7|903|1110|156"
)
n=0
for s in $specs; do
  IFS='|' read nm ws wl cs cd x y w h <<< "$s"; n=$((n+1))
  off=$(python3 -c "print(round($cs-$ws,3))"); e1=$(python3 -c "print(round($cs-$ws-0.2,3))"); e2=$(python3 -c "print(round($cs-$ws+$cd+0.6,3))")
  ffmpeg -v error -y -ss $ws -t $wl -i "$B" -loop 1 -framerate 25 -t $wl -i clean.png -itsoffset $off -i "$O/$nm.mov" -filter_complex \
   "[1:v]crop=${w}:${h}:${x}:${y},format=yuv420p[pt];[0:v][pt]overlay=${x}:${y}:enable='between(t,$e1,$e2)'[b];[2:v]format=yuva420p[ov];[b][ov]overlay=0:0:eof_action=pass:format=yuv420[v]" \
   -map "[v]" -t $wl -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -r 25 -an w$n.mp4
  echo "w$n: $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 w$n.mp4) frames"
done
# concat list: v5 copy pieces + windows
cat > list.txt <<L
file '$B'
outpoint 610
file 'w1.mp4'
file '$B'
inpoint 660
outpoint 1210
file 'w2.mp4'
file '$B'
inpoint 1250
outpoint 1910
file 'w3.mp4'
file '$B'
inpoint 1950
outpoint 2720
file 'w4.mp4'
file '$B'
inpoint 2760
L
ffmpeg -v error -y -f concat -safe 0 -i list.txt -map 0:v -c copy video.mp4
ffmpeg -v error -y -i video.mp4 -i "$A" -map 0:v -map 1:a -c copy -movflags +faststart "$OUT"
echo "final frames: $(ffprobe -v error -count_packets -select_streams v -show_entries stream=nb_read_packets -of csv=p=0 "$OUT") (expect $((288684*25/100)))"
ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 "$OUT"
# boundary checks vs v5 (should be identical outside cards) and card frames
for t in 609.9 610.1 659.9 660.1 1209.9 1250.1 1909.9 1950.1 2719.9 2760.1 1500 2800; do
  echo -n "t=$t psnr vs v5: "; ffmpeg -v info -ss $t -i "$OUT" -ss $t -i "$B" -frames:v 1 -lavfi "[0:v][1:v]psnr" -f null - 2>&1 | grep -o "average:[0-9.inf]*"; done
for t in 622 640 1216 1235 1925 1940 2730 2748; do ffmpeg -v error -y -ss $t -i "$OUT" -frames:v 1 -vf scale=960:-1 chk-$t.png; done
ffmpeg -nostats -i "$OUT" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E "I:|Peak:"
echo SPLICE-DONE
