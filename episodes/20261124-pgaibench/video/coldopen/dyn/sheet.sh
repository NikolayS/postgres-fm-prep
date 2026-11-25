#!/usr/bin/env bash
# Frame sheet of the three variants: one block of 7x3 frames per variant (bold, medium, restrained, top to
# bottom), at the effect moments (frame numbers below, 25 fps), 384 px wide each.
#   bash sheet.sh <out.png> <bold.mp4> <medium.mp4> <restrained.mp4>
set -euo pipefail
OUT=$1; shift
F="6 102 141 146 150 188 214 258 275 325 340 348 355 380 407 430 452 520 538 550 575"
sel=$(for f in $F; do printf "eq(n\\,%s)+" "$f"; done); sel=${sel%+}
in=(); fc=""; k=0
for v in "$@"; do in+=(-i "$v"); fc+="[$k:v]select='$sel',scale=384:-1,pad=iw+6:ih+6:3:3:black,tile=7x3[t$k];"; k=$((k+1)); done
fc+="$(for ((i=0;i<k;i++)); do printf "[t%s]" $i; done)vstack=inputs=$k,pad=iw:ih+0[o]"
ffmpeg -v error -y "${in[@]}" -filter_complex "$fc" -map "[o]" -frames:v 1 -fps_mode vfr "$OUT"
