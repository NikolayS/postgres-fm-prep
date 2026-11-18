#!/usr/bin/env bash
# Episode 197 cold open v8: v7b (funk) with levelled voices and hard music ducking.
# Picture: frames from v8.ts. Grid U = 0.46875 s (128 BPM); title 18 U, montage 34.24 s, button 92 U.
# Audio:
#   voice: each bite is cut from dialog.wav, cleaned (high-pass, de-mud, presence +4 dB at 3 kHz for
#          Michael's darker mic), compressed, and set to -18 LUFS on its own, so no speaker is quieter.
#   music: full in the title and on the button; under the montage it sits BED_LU below the voice
#          (default 14 LU) with a sidechain duck on top, so every bite is 10 dB or more over the music.
#   checks: per-bite voice and background (music + SFX) loudness from the stems, and whisper-cli on
#          each bite of the final mix (WHISPER_MODEL, ggml).
# Run prep.sh, fx.ts and v8.ts first (see README.md).
# Usage: WORK=<cold-open-final media dir> bash build.sh <out.mp4>
set -euo pipefail
check_disk() {
  local free
  free=$(df -Pk "$1" | awk 'END {print $4}')
  if [ "$free" -lt 3145728 ]; then echo "STOP: less than 3 GiB free; record in RESULT.md" >&2; exit 1; fi
}
check_disk "${WORK:?}"
H="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$H/../../../.." && pwd)"; TK="$R/tools/podcast-edit/sfx"
OUT=$(cd "$(dirname "$1")" && pwd)/$(basename "$1"); : "${WORK:?}"; cd "$WORK/v7"; T=v8tmp; mkdir -p $T
f3() { printf "%.3f" "$(echo "$1" | bc -l)"; }
U=0.46875; TT=$(f3 "18*$U"); TB=$(f3 "92*$U"); END=$(f3 "$TB+1.6"); BED_LU=${BED_LU:-14}
u() { f3 "$1*$U"; }; m() { f3 "$TT+$1"; }

# ---- voice: bites (montage seconds) by speaker ----
BITES=("0 4.40 nik GTA" "4.40 7.56 michael GTA-19" "7.56 15.32 kirk revert-fest+CVEs" "15.32 19.64 nik NOTIFY"
       "19.64 21.72 michael no-go-years" "21.72 24.95 kirk decades" "24.95 28.84 nik just-DDL" "28.84 31.44 michael small-thing"
       "31.44 34.24 nik postgres-20")
clean() { case $1 in
  michael) echo "highpass=f=90,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3000:t=q:w=0.9:g=4,equalizer=f=5500:t=q:w=1:g=2" ;;
  *)       echo "highpass=f=80,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3000:t=q:w=1:g=1.5" ;; esac; }
COMP="acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=2"
list=""; k=0
for b in "${BITES[@]}"; do set -- $b; k=$((k+1))
  ffmpeg -v error -y -i dialog.wav -af "atrim=$1:$2,asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,$(clean $3),$COMP" $T/b$k.wav
  L=$(ffmpeg -nostats -i $T/b$k.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
  ffmpeg -v error -y -i $T/b$k.wav -af "volume=$(f3 "-18 - ($L)")dB" $T/v$k.wav; list+="file 'v$k.wav'"$'\n'
done
printf "%s" "$list" > $T/list.txt; ffmpeg -v error -y -f concat -safe 0 -i $T/list.txt -c pcm_s16le $T/voice-m.wav
ms0=$(printf "%.0f" "$(echo "$TT*1000" | bc -l)")
ffmpeg -v error -y -i $T/voice-m.wav -af "adelay=$ms0|$ms0,apad=whole_dur=$END" -t $END $T/voice.wav

# ---- music: funk (Apple Loops Disco Funk), 120 -> 128 BPM ----
bun "$R/tools/podcast-edit/brand/music/arrange.ts" "$H/music/b-funk.json" b-funk.wav >/dev/null
ffmpeg -v error -y -i b-funk.wav -af "aresample=48000,atempo=$(f3 "128/120"),volume=-7dB" -t $END $T/mus1.wav
LM=$(ffmpeg -nostats -i $T/mus1.wav -af "atrim=$TT:$(m 34.0),ebur128" -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
BED=$(f3 "e(l(10)*((-18 - $BED_LU) - ($LM))/20)")
VOL="if(lt(t,$TT-0.1),1,if(lt(t,$TT+0.15),1-(1-$BED)*(t-$TT+0.1)/0.25,if(lt(t,$TB-0.05),$BED,1)))"
ffmpeg -v error -y -i $T/mus1.wav -i $T/voice.wav -filter_complex "[0:a]volume='$VOL':eval=frame[mb];[mb][1:a]sidechaincompress=threshold=0.03:ratio=2:attack=20:release=300:makeup=1[mo]" -map "[mo]" $T/music.wav

# ---- SFX (gains in dB); quieter while someone speaks ----
S=(); add() { S+=("$1 $2 $3 ${4:-}"); }
add $TK/U2-typing-fast.wav 0 -10 $(u 0.9)
for k in 0 1 2; do s=$(echo "2.5+3*$k" | bc -l)
  add fx/whoosh.wav $(u "$s+0.5-0.15") -15
  add $TK/U2-typing-fast.wav $(f3 "$(u "$s+0.5")+0.12") -11 0.42
  add fx/slam.wav $(f3 "$(u "$s+0.5")+0.12") -12; done
for k in 0 1; do add $TK/L-punch-rough.wav $(u $k) -5; done
add $TK/G10-soft-start-quick-stop.wav $(u 12.5) -4; add $TK/L-punch-rough.wav $(u 13) -4; add $TK/G9-wider-band.wav $(u 17.6) -5
add fx/whoosh.wav $(f3 "$TT-0.25") -12
for t in 7.48 15.24; do add fx/whoosh.wav $(m $t) -24; done
for t in 10.1 19.5; do add $TK/K-sand-stroke-falling.wav $(m $t) -20; done
add fx/glitch.wav $(m 24.05) -22; add fx/whoosh.wav $(m 25.30) -22
for t in 0.56 2.32 5.21 9.58 11.07 16.59 18.19 23.57 27.96 31.74 33.18; do add fx/slam.wav $(m $t) -30; done
add $TK/L-punch-rough.wav $TB -4
in=(); af=""; mix=""; k=0
for s in "${S[@]}"; do set -- $s; ms=$(printf "%.0f" "$(echo "$2*1000" | bc -l)"); tr=""
  if [ -n "${4:-}" ]; then tr=",atrim=0:$4,afade=t=out:st=$(f3 "$4-0.05"):d=0.05"; fi
  in+=(-i "$1"); af+="[$k:a]aresample=48000,aformat=channel_layouts=stereo$tr,volume=$3dB,volume=-7dB,adelay=$ms|$ms[x$k];"; mix+="[x$k]"; k=$((k+1)); done
ffmpeg -v error -y "${in[@]}" -filter_complex "${af}${mix}amix=inputs=$k:normalize=0:duration=longest,apad=whole_dur=$END" -t $END $T/sfx.wav
ffmpeg -v error -y -i $T/music.wav -i $T/sfx.wav -filter_complex "amix=inputs=2:normalize=0:duration=longest" -t $END $T/bg.wav

# ---- mix, -16 LUFS ----
check_disk "$WORK"
ffmpeg -v error -y -framerate 25 -i ${FRAMES_DIR:-fr8}/%04d.jpg -i $T/voice.wav -i $T/bg.wav -filter_complex "[1:a][2:a]amix=inputs=2:normalize=0:duration=longest,atrim=0:$(f3 "$END-0.08"),apad=whole_dur=$END,afade=t=in:d=0.05,afade=t=out:st=$(f3 "$END-0.6"):d=0.5[ao]" \
  -map 0:v -map "[ao]" -t $END -c:v libx264 -threads 4 -profile:v high -pix_fmt yuv420p -r 25 -crf 18 -preset medium -c:a pcm_s16le "$OUT.raw.mov"
I=$(ffmpeg -nostats -i "$OUT.raw.mov" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}'); g=$(echo "-16 - ($I)" | bc -l)
ffmpeg -v error -y -i "$OUT.raw.mov" -c:v copy -af "volume=${g}dB,alimiter=limit=0.75:level=false" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"; rm -f "$OUT.raw.mov"
echo "$OUT $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s, button $TB s, bed $BED (music $LM LUFS at full), gain $g dB"

# ---- checks: voice over background per bite; whisper on the final mix ----
WM=${WHISPER_MODEL:-$HOME/.cache/whisper-cpp/ggml-large-v3-turbo-q5_0.bin}
printf "%-20s %8s %8s %6s  %s\n" bite voice bg "v-bg" "whisper (final mix)"
for b in "${BITES[@]}"; do set -- $b; a=$(m $1); e=$(m $2)
  lv=$(ffmpeg -nostats -i $T/voice.wav -af "atrim=$a:$e,ebur128" -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
  lb=$(ffmpeg -nostats -i $T/bg.wav -af "atrim=$a:$e,ebur128" -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
  ffmpeg -v error -y -ss $a -to $e -i "$OUT" -ar 16000 -ac 1 $T/w.wav
  w=$(whisper-cli -m "$WM" -l en -nt -np -f $T/w.wav 2>/dev/null | tr -s ' \n' ' ')
  printf "%-20s %8s %8s %6s  %s\n" "$4($3)" "$lv" "$lb" "$(f3 "$lv - ($lb)")" "$w"
done
