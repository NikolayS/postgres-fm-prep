#!/usr/bin/env bash
# Episode 198 dynamic cold opens, step 1: per montage line
#   L<i>.src.mov  speech: cut.sh (hard cuts, 30-40 ms edge fades), the audio the mix uses;
#   L<i>.mp4      picture: the same line with H s of video handle on each side, laid out by
#                 layout.ts (Kirk left, Nik right), so whips and pushes have real motion to run on.
# Speech in L<i>.mp4 starts at H s. Each layout runs in its own folder (layout.ts keeps a .layout
# cache next to its output; parallel runs in one folder overwrite each other).
# PICS overrides the picture segments of a line (handles included), when the picture cut must sit
# elsewhere than the audio cut. L3: the audio joins "task," to "five" in the pause; the picture
# jumps on "five", where the first RESTART stamp lands, and stays in sync with the speech.
#   R=<review dir> W=<work dir> [ONLY="3"] bash lines.sh
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
  "1093.70 1095.10|1095.60 1100.62" # L3 Nik: in one task, | five out of five cases, Fable decided to change something and restart server.
  "1101.83 1105.66"               # L4 Kirk/Nik: After being told, "Do not restart the server"? / Yeah. Being overconfident.
  "3504.08 3507.62"               # L5 Kirk: I don't want AI to automate my ability to make mistakes at scale.
)
PICS=("" "" "1092.90 1095.22|1095.72 1101.42" "" "")
for i in "${!LINES[@]}"; do
  n=$((i+1)); [ -n "${ONLY:-}" ] && [[ " $ONLY " != *" $n "* ]] && continue
  (d="$W/lines/L$n"; mkdir -p "$d"
  IFS='|' read -ra segs <<< "${LINES[$i]}"
  bash "$D0/cut.sh" "$W/lines/L$n.src.mov" "${segs[@]}"
  # picture with handles: first segment starts H earlier, last one ends H later
  hs=(); k=0; last=$((${#segs[@]}-1))
  if [ -n "${PICS[$i]}" ]; then IFS='|' read -ra hs <<< "${PICS[$i]}"; else
  for s in "${segs[@]}"; do a=${s% *}; b=${s#* }
    [ $k -eq 0 ] && a=$(echo "$a-$H" | bc); [ $k -eq $last ] && b=$(echo "$b+$H" | bc)
    hs+=("$a $b"); k=$((k+1)); done; fi
  bash "$D0/cut.sh" "$d/h.mov" "${hs[@]}"
  bun "$R/tools/layout.ts" "$R/coldopen-layout.json" "$d/h.mov" "$d/pic.mp4" --preset fast > "$d/layout.log" 2>&1 && mv "$d/pic.mp4" "$W/lines/L$n.mp4"
  echo "L$n speech $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/lines/L$n.src.mov") picture $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/lines/L$n.mp4")"
) & done; wait
# L1: Nik only listens there, and his face read as negative (host note, 2026-11-25). His tile
# (x 990-1810, y 212-682) comes from source 161.30-168.18 instead: silent, smiling at the camera,
# same light and framing (fixed crop in the layout). The final files keep their old encoded frames
# from the first keyframe after line 1 (splice.sh), so the last frame and the audio stay bit-identical.
if [ -z "${ONLY:-}" ] || [[ " $ONLY " == *" 1 "* ]]; then
  d="$W/lines/L1n"; mkdir -p "$d"; bash "$D0/cut.sh" "$d/h.mov" "161.30 168.18"
  bun "$R/tools/layout.ts" "$R/coldopen-layout.json" "$d/h.mov" "$d/pic.mp4" --preset fast > "$d/layout.log" 2>&1
  ffmpeg -v error -y -i "$W/lines/L1.mp4" -i "$d/pic.mp4" -filter_complex "[1:v]crop=820:470:990:212[n];[0:v][n]overlay=990:212:shortest=1[v]" \
    -map "[v]" -map 0:a -c:v libx264 -crf 14 -preset medium -pix_fmt yuv420p -r 25 -c:a copy "$d/L1.mp4" && mv "$d/L1.mp4" "$W/lines/L1.mp4"
fi
