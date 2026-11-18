#!/usr/bin/env bash
# Episode 197 cold open v7: frames from v7.ts, dialogue, music and SFX, mixed to -16 LUFS.
# One picture for all variants, cut on a grid of U = 0.46875 s (v4b's 128 BPM beat):
#   a: v4b's Electro House arrangement (Apple Loops), 128 BPM: 1 beat = 1 U
#   b: funk/band (Apple Loops Disco Funk "Throwback Funk"), 120 -> 128 BPM: 1 beat = 1 U
#   c: trailer (Apple Loops Hip Hop "Legend"), 80.5 -> 85.33 BPM: 2 beats = 3 U, + fx.ts hits
#   d: lo-fi (Apple Loops Chillwave "Crunchy Funk"/"Chill Loop"), 90 -> 85.33 BPM, + crackle
# Title 18 U (8.44 s), montage 34.24 s, button hit at 92 U (43.125 s).
# Run prep.sh, fx.ts and v7.ts first (see README.md).
# Usage: WORK=<cold-open-final media dir> bash build.sh a|b|c|d <out.mp4>
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$H/../../../.." && pwd)"; TK="$R/tools/podcast-edit/sfx"
V=$1; OUT=$(cd "$(dirname "$2")" && pwd)/$(basename "$2"); : "${WORK:?}"; cd "$WORK/v7"
f3() { printf "%.3f" "$(echo "$1" | bc -l)"; }
U=0.46875; TT=$(f3 "18*$U"); TB=$(f3 "92*$U"); END=$(f3 "$TB+1.6")
u() { f3 "$1*$U"; }; m() { f3 "$TT+$1"; }
case $V in
  a) MUS=a-electro; TEMPO=1.000 ;;
  b) MUS=b-funk; TEMPO=$(f3 "128/120") ;;
  c) MUS=c-trailer; TEMPO=$(f3 "(128*2/3)/80.5") ;;
  d) MUS=d-lofi; TEMPO=$(f3 "(128*2/3)/90") ;;
  *) echo "variant a|b|c|d"; exit 1 ;;
esac
bun "$R/tools/podcast-edit/brand/music/arrange.ts" "$H/music/$MUS.json" $MUS.wav >/dev/null

# SFX cues: path seconds gain(dB) [trim s]
S=(); add() { S+=("$1 $2 $3 ${4:-}"); }
# title: typing under each typed name, punches on the slams, whips between cells
add $TK/U2-typing-fast.wav 0 -10 $(u 0.9)
for k in 0 1 2; do s=$(echo "2.5+3*$k" | bc -l)
  add fx/whoosh.wav $(u "$s+0.5-0.15") -15
  add $TK/U2-typing-fast.wav $(f3 "$(u "$s+0.5")+0.12") -11 0.42; done
add $TK/G10-soft-start-quick-stop.wav $(u 12.5) -4; add $TK/G9-wider-band.wav $(u 17.6) -5
add fx/whoosh.wav $(f3 "$TT-0.25") -12
# montage: whips, zoom-blurs, glitch, the "19" wipe, word-synced band text
for t in 7.48 15.24; do add fx/whoosh.wav $(m $t) -15; done
for t in 10.1 19.5; do add $TK/K-sand-stroke-falling.wav $(m $t) -9; done
add fx/glitch.wav $(m 24.05) -16; add fx/whoosh.wav $(m 25.30) -13
for t in 0.56 2.32 5.21 9.58 11.07 16.59 18.19 23.57 27.96 31.74 33.18; do add fx/slam.wav $(m $t) -19; done
case $V in
  a) for k in 0 1; do add $TK/L-punch-rough.wav $(u $k) -3; done
     for k in 0 1 2; do s=$(echo "2.5+3*$k" | bc -l); add $TK/L-punch-rough.wav $(u $s) -3; add fx/slam.wav $(f3 "$(u "$s+0.5")+0.12") -12; done
     add $TK/L-punch-rough.wav $(u 13) -2; add $TK/L-punch-rough.wav $TB -2 ;;
  b) for k in 0 1; do add $TK/L-punch-rough.wav $(u $k) -5; done
     for k in 0 1 2; do s=$(echo "2.5+3*$k" | bc -l); add fx/slam.wav $(f3 "$(u "$s+0.5")+0.12") -12; done
     add $TK/L-punch-rough.wav $(u 13) -4; add $TK/L-punch-rough.wav $TB -4 ;;
  c) for k in 0 1; do add fx/impact.wav $(u $k) -10; done
     for k in 0 1 2; do s=$(echo "2.5+3*$k" | bc -l); add fx/impact.wav $(f3 "$(u "$s+0.5")+0.12") -11; done
     add fx/braam.wav $(u 13) -12; add fx/impact.wav $(u 13) -8; add fx/riser.wav $(f3 "$TT-1.6") -13
     add fx/impact.wav $TB -8; add fx/braam.wav $TB -13 ;;
  d) for k in 0 1; do add $TK/L-punch-rough.wav $(u $k) -8; done
     for k in 0 1 2; do s=$(echo "2.5+3*$k" | bc -l); add fx/slam.wav $(f3 "$(u "$s+0.5")+0.12") -14; done
     add $TK/L-punch-rough.wav $(u 13) -6; add $TK/L-punch-rough.wav $TB -6
     for t in 0 12 24 36; do add fx/crackle.wav $t -24; done ;;
esac

in=(-framerate 25 -i fr/%04d.png -i dialog.wav -i $MUS.wav); k=3; mix="[voice][mus]"
ms0=$(printf "%.0f" "$(echo "$TT*1000" | bc -l)")
af="[1:a]aresample=48000,adelay=$ms0|$ms0,apad[voice]"
# music as in v4b: full in the title, bed 0.2 under the voices; out for the split-screen laugh; full on the button
af+=";[2:a]aresample=48000$([ "$TEMPO" != 1.000 ] && echo ",atempo=$TEMPO" || true),volume='if(lt(t,$TT-0.1),1,if(lt(t,$TT+0.15),1-0.8*(t-$TT+0.1)/0.25,if(between(t,$(m 24.05),$(m 25.40)),0.04,if(lt(t,$TB-0.05),0.2,1))))':eval=frame,volume=-7dB[mus]"
for s in "${S[@]}"; do set -- $s; ms=$(printf "%.0f" "$(echo "$2*1000" | bc -l)"); tr=""
  if [ -n "${4:-}" ]; then tr=",atrim=0:$4,afade=t=out:st=$(f3 "$4-0.05"):d=0.05"; fi
  in+=(-i "$1"); af+=";[$k:a]aresample=48000,aformat=channel_layouts=stereo$tr,volume=$3dB,volume=-7dB,adelay=$ms|$ms[x$k]"; mix+="[x$k]"; k=$((k+1)); done
n=$(echo "$mix" | grep -o '\[' | wc -l | tr -d ' ')
af+=";${mix}amix=inputs=$n:normalize=0:duration=longest,atrim=0:$(f3 "$END-0.08"),apad=whole_dur=$END,afade=t=in:d=0.05,afade=t=out:st=$(f3 "$END-0.6"):d=0.5[ao]"
nice -n 15 ffmpeg -v error -y "${in[@]}" -filter_complex "$af" -map 0:v -map "[ao]" -t $END -c:v libx264 -threads 4 -profile:v high -pix_fmt yuv420p -r 25 -crf 18 -preset medium -c:a pcm_s16le "$OUT.raw.mov"
I=$(ffmpeg -i "$OUT.raw.mov" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}'); g=$(echo "-16 - ($I)" | bc -l)
ffmpeg -v error -y -i "$OUT.raw.mov" -c:v copy -af "volume=${g}dB,alimiter=limit=0.75:level=false" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"; rm -f "$OUT.raw.mov"
echo "$OUT $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s, button $TB s, gain $g dB"
