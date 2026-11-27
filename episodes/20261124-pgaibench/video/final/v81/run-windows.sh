#!/usr/bin/env bash
# Render the v8.1b windows (3 at a time) from final/v81/windows.txt: id, first frame, end frame (final, keyframes).
set -uo pipefail
cd "$(dirname "$0")/../.."
run() { read -r i a b <<< "$1"; f=$(python3 -c "print(round(($a-1061)/25-0.4,2))"); u=$(python3 -c "print(round(($b-1061)/25+0.4,2))");
  OUT=final/v81/x$i.mp4 bash final/v81/render-v81b.sh --from $f --until $u </dev/null > final/v81/x$i.log 2>&1; echo "x$i exit $? ($f-$u)"; }
export -f run
L=(); while IFS= read -r line; do L+=("$line"); done < final/v81/windows.txt
for k in 0 1 2; do run "${L[$k]}" & done; wait
for k in 3 4 5; do run "${L[$k]}" & done; wait
