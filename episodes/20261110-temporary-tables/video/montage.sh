#!/usr/bin/env bash
# Cold-open montage: hard cuts, no glue sound. Usage: montage.sh out.mp4 "a b" "a b" ...  (final v6 seconds)
set -euo pipefail
F=../25-final-v6.mp4; out=$1; shift
in=(); fc=""; cat=""; i=0
for s in "$@"; do a=${s% *}; b=${s#* }; d=$(echo "$b-$a"|bc)
  in+=(-ss "$a" -t "$d" -i "$F")
  fc+="[$i:v]setpts=PTS-STARTPTS[v$i];[$i:a]asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=$(echo "$d-0.05"|bc):d=0.05[a$i];"
  cat+="[v$i][a$i]"; i=$((i+1)); done
fc+="${cat}concat=n=$i:v=1:a=1[v][a]"
ffmpeg -v error -y "${in[@]}" -filter_complex "$fc" -map "[v]" -map "[a]" -c:v libx264 -profile:v high -pix_fmt yuv420p -r 25 -crf 19 -preset medium -c:a aac -b:a 192k -ar 48000 "$out.raw.mp4"
I=$(ffmpeg -i "$out.raw.mp4" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}'); g=$(echo "-16 - ($I)"|bc -l)
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out.raw.mp4")
ffmpeg -v error -y -i "$out.raw.mp4" -vf "fade=t=in:st=0:d=0.3,fade=t=out:st=$(echo "$D-0.5"|bc):d=0.5" -c:v libx264 -profile:v high -pix_fmt yuv420p -r 25 -crf 19 -preset medium -af "volume=${g}dB,alimiter=limit=0.75:level=false" -c:a aac -b:a 192k -ar 48000 "$out"; rm -f "$out.raw.mp4"
ffmpeg -v error -y -i "$out" -i "$F" -filter_complex "[1:v]trim=0:30,setpts=PTS-STARTPTS[v1];[1:a]atrim=0:30,asetpts=PTS-STARTPTS[a1];[0:v][0:a][v1][a1]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 160k "preview-$out"
echo "$out $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out") $(ffmpeg -i "$out" -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+(I|Peak):' | tr -s ' ' | tr '\n' ' ')"
