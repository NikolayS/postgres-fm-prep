#!/usr/bin/env bash
# Episode 197 cold open v3 (shortlist suggestion) and v3b (DDL closer): hard cuts, no strips, episode 196 montage style.
# Usage: SOURCE=<Zoom video1398514958.mp4> T=<patched tools dir> WORK=<media dir> bash run-suggested.sh <preview dir>
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)"; V2="$H/../coldopen-v2"; P=$1
: "${SOURCE:?}" "${T:?}" "${WORK:?}"; mkdir -p "$WORK"; cd "$WORK"
BASE=("147.80 152.20" "165.85 168.99" "507.05 509.72" "550.20 555.25" "1598.70 1600.75" "1636.35 1640.10")
XMAS=("577.53 579.55")
DDL=("2807.10 2807.98" "2808.42 2810.88" "2811.90 2814.47" "2815.62 2818.40")
build() { SOURCE="$SOURCE" "$V2/cut.sh" "$1.src.mov" "${@:3}"; bun "$T/layout.ts" "$V2/layout.json" "$1.src.mov" "$1.layout.mp4" --preset fast >/dev/null; "$V2/finish.sh" "$1.layout.mp4" none "$2"; }
build v3 "$P/cold-open-v3.mp4" "${BASE[@]}" "${XMAS[@]}" &
build v3b "$P/cold-open-v3b.mp4" "${BASE[@]}" "${DDL[@]}" &
wait
