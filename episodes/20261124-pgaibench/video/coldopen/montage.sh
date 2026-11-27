#!/usr/bin/env bash
# Episode 198 cold-open montage, in the form of the published episode 196 and 197 cold opens:
# 4-6 short lines, alternating voices, hard cuts (30-40 ms edge fades), ending on a punchline,
# clean screen (the episode layout, no strips), and the episode 197 funk cue (b-funk, 128 BPM)
# as the bed: 0.2 under the voices, full on a 1 s button after the last word, then cut.
#   SOURCE=<Zoom mp4> MUSIC=<b-funk.wav> T=<tools dir with layout.ts> LAYOUT=<layout without cuts> \
#     bash montage.sh <out.mp4> "a b" "a b" ...      (source seconds, Scribe word times)
set -euo pipefail
OUT=$1; shift; D0="$(cd "$(dirname "$0")" && pwd)"
W=$(mktemp -d "${TMPDIR:-/tmp}/montage.XXXXXX")
bash "$D0/cut.sh" "$W/src.mov" "$@"
bun "$T/layout.ts" "$LAYOUT" "$W/src.mov" "$W/layout.mp4" --preset fast > "$W/layout.log"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/layout.mp4"); BTN=1.0
TOT=$(echo "$D+$BTN" | bc)
# Voices to -16 LUFS first, so the bed level is relative to them.
VI=$(ffmpeg -nostdin -i "$W/layout.mp4" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}'); gv=$(echo "-16 - ($VI)" | bc -l)
MI=$(ffmpeg -nostdin -t "$TOT" -i "$MUSIC" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}'); gm=$(echo "-16 - ($MI)" | bc -l)
fc="[0:v]tpad=stop_mode=clone:stop_duration=$BTN,fade=t=in:d=0.25,format=yuv420p[v];"
fc+="[0:a]aresample=48000,volume=${gv}dB,apad=pad_dur=$BTN[va];"
fc+="[1:a]atrim=0:$TOT,asetpts=PTS-STARTPTS,aresample=48000,volume=${gm}dB,volume='if(lt(t,$D-0.05),0.2,min(1,0.2+0.8*(t-($D-0.05))/0.25))':eval=frame,afade=t=out:st=$(echo "$TOT-0.12" | bc):d=0.12[m];"
fc+="[va][m]amix=inputs=2:normalize=0:duration=first,afade=t=in:d=0.05,alimiter=limit=0.8:level=false[a]"
ffmpeg -nostdin -v error -y -i "$W/layout.mp4" -i "$MUSIC" -filter_complex "$fc" -map "[v]" -map "[a]" -t "$TOT" \
  -c:v libx264 -profile:v high -r 25 -crf 18 -preset medium -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
rm -rf "$W"
echo "$OUT $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s"
