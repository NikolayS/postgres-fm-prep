#!/usr/bin/env bash
# Episode 198 dynamic cold opens, step 1: per montage line
#   L<i>.src.mov  speech: cut.sh (hard cuts, 30-40 ms edge fades), the audio the mix uses;
#   L<i>.mp4      picture: the same line with H s of video handle on each side, laid out by
#                 layout.ts (Kirk left, Nik right), so whips and pushes have real motion to run on.
# Speech in L<i>.mp4 starts at H s. Each layout runs in its own folder (layout.ts keeps a .layout
# cache next to its output; parallel runs in one folder overwrite each other).
#   R=<review dir> W=<work dir> bash lines.sh
set -euo pipefail
D0="$(cd "$(dirname "$0")/.." && pwd)"
: "${R:?review dir}" "${W:?work dir}"
export SOURCE="$R/../video1808680036.mp4"
export PODCAST_BRAND=$HOME/github/postgres-fm-prep/episodes/20261027-uuidv4-vs-uuidv7/video/brand-public
H=0.8
# Source seconds (Scribe word times), shortlist lines 1, 2, 3, 4, 11 (montage A).
LINES=(
  "569.03 571.32|573.13 576.06"   # L1 Kirk: As long as you use the latest and the best | agents out there, you're perfectly safe, right?
  "578.48 580.32"                 # L2 Nik: I know a lot of our listeners are agents.
  "1095.60 1100.62"               # L3 Nik: Five out of five cases, Fable decided to change something and restart server.
  "1101.83 1105.66"               # L4 Kirk/Nik: After being told, "Do not restart the server"? / Yeah. Being overconfident.
  "3504.08 3507.62"               # L5 Kirk: I don't want AI to automate my ability to make mistakes at scale.
)
for i in "${!LINES[@]}"; do (
  n=$((i+1)); d="$W/lines/L$n"; mkdir -p "$d"
  IFS='|' read -ra segs <<< "${LINES[$i]}"
  bash "$D0/cut.sh" "$W/lines/L$n.src.mov" "${segs[@]}"
  # picture with handles: first segment starts H earlier, last one ends H later
  hs=(); k=0; last=$((${#segs[@]}-1))
  for s in "${segs[@]}"; do a=${s% *}; b=${s#* }
    [ $k -eq 0 ] && a=$(echo "$a-$H" | bc); [ $k -eq $last ] && b=$(echo "$b+$H" | bc)
    hs+=("$a $b"); k=$((k+1)); done
  bash "$D0/cut.sh" "$d/h.mov" "${hs[@]}"
  bun "$R/tools/layout.ts" "$R/coldopen-layout.json" "$d/h.mov" "$d/pic.mp4" --preset fast > "$d/layout.log" 2>&1 && mv "$d/pic.mp4" "$W/lines/L$n.mp4"
  echo "L$n speech $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/lines/L$n.src.mov") picture $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/lines/L$n.mp4")"
) & done; wait
