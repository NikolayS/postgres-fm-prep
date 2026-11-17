#!/usr/bin/env bash
# Episode 197 cold open v3: six-topic montage, hard cuts (episode 196 pacing). See sequence.md.
# Usage: [LAYOUT=layout-final.json PRESET=medium] SOURCE=<Zoom video1398514958.mp4> T=<patched tools dir with layout.ts> WORK=<media dir> bash run.sh <out.mp4>
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)"; V2="$H/../coldopen-v2"; OUT=$1
: "${SOURCE:?}" "${T:?}" "${WORK:?}"; mkdir -p "$WORK"; cd "$WORK"
P=("147.80 152.20" "165.85 168.99" "507.05 509.72" "550.20 555.25" "1303.60 1307.92" "1598.70 1600.75" "1636.35 1640.10" "2807.10 2807.98" "2808.42 2810.88" "2811.90 2814.47" "2815.62 2818.40")
SOURCE="$SOURCE" "$V2/cut.sh" v3.src.mov "${P[@]}"
# NOTIFY strip on piece 5 (index 4): from its start to its end, in clip seconds
s=0; for i in 0 1 2 3; do a=${P[$i]% *}; b=${P[$i]#* }; s=$(echo "$s+$b-$a"|bc); done
a=${P[4]% *}; b=${P[4]#* }; e=$(echo "$s+$b-$a"|bc); t0=$(echo "$s+1.27"|bc)   # "200" at 1304.87 = piece start + 1.27
bun "$T/layout.ts" "${LAYOUT:-$V2/layout.json}" v3.src.mov v3.layout.mp4 --preset "${PRESET:-fast}"
bun "$V2/marker.ts" m-notify 419 "NOTIFY, 1,000 listeners: 200/s → 11,000/s"
END=$e "$V2/finish.sh" v3.layout.mp4 m-notify "$OUT" "$t0"
echo "strip $t0-$e"
