#!/usr/bin/env bash
# Finish a cold open: Marker strip lines over the layout video (each line swipes in at its time and stays),
# a soft sand stroke (K) under each line, fade in 0.3 s / out 0.5 s, loudness -16 LUFS, limiter (as ep196 montage.sh).
# Usage: [END=s] finish.sh <layout.mp4> <markerdir> <out.mp4> <t_line0> [<t_line1>]   (END: strips off after END s)
set -euo pipefail
IN=$1; M=$2; OUT=$3; shift 3; T=("$@"); n=${#T[@]}
K="$(cd "$(dirname "$0")/../../../../tools/podcast-edit/sfx" && pwd)/K-sand-stroke-falling.wav"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
in=(-i "$IN"); fc="[0:v]null[v0]"; mix="[0:a]"
for ((i=0; i<n; i++)); do
  in+=(-framerate 25 -i "$M/l${i}_%02d.png")
  # sequence: swipe frames then hold the last frame; shown from T[i] (until the next line's sequence takes over)
  end=$([ $i -lt $((n-1)) ] && echo "${T[$((i+1))]}" || echo "${END:-$D}")
  fc+=";[$((i+1)):v]tpad=stop_mode=clone:stop_duration=60,setpts=PTS-STARTPTS+${T[$i]}/TB[m$i];[v$i][m$i]overlay=enable='between(t,${T[$i]},$end)':eof_action=pass[v$((i+1))]"
done
for ((i=0; i<n; i++)); do in+=(-i "$K"); ms=$(printf "%.0f" $(echo "${T[$i]}*1000"|bc)); fc+=";[$((n+1+i)):a]aresample=48000,volume=-14dB,adelay=${ms}|${ms}[s$i]"; mix+="[s$i]"; done
fc+=";${mix}amix=inputs=$((n+1)):normalize=0:duration=first[am]"
fo=$(printf "%.3f" $(echo "$D-0.5"|bc))
fc+=";[v$n]fade=t=in:st=0:d=0.3,fade=t=out:st=$fo:d=0.5,format=yuv420p[vo];[am]afade=t=in:d=0.05,afade=t=out:st=$fo:d=0.5[ao]"
ffmpeg -v error -y "${in[@]}" -filter_complex "$fc" -map "[vo]" -map "[ao]" -t "$D" -c:v libx264 -profile:v high -r 25 -crf 19 -preset medium -c:a pcm_s16le "$OUT.raw.mov"
I=$(ffmpeg -i "$OUT.raw.mov" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}'); g=$(echo "-16 - ($I)"|bc -l)
ffmpeg -v error -y -i "$OUT.raw.mov" -c:v copy -af "volume=${g}dB,alimiter=limit=0.75:level=false" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"; rm -f "$OUT.raw.mov"
echo "$OUT $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") gain $g"
