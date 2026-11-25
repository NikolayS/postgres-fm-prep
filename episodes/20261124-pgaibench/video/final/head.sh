#!/usr/bin/env bash
# ep198 head: the opening card/intro + the first N s of the show, same compose settings as the body.
#   bash final/head.sh particle <intro-video> <intro-bed> <card-s> <until-s>   (no fade from black)
#   bash final/head.sh card                                         <until-s>   (13 s title card, fallback)
set -euo pipefail
O="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card"
export PODCAST_BRAND=/Users/nik/github/postgres-fm-prep/episodes/20261027-uuidv4-vs-uuidv7/video/brand-public
C=(--outro "$O/outro/a-shades-outro.wav" --end 0 --music-lufs -20.5 --duck -21 --duck-ramp 3 --intro-fade 8 --preset fast
   --overlays overlays/out-v2/manifest-v5-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0)
if [ "$1" = particle ]; then
  bun tools/compose.ts layout.json v5/pgfm198-edited.mp4 final/head.mp4 --intro "$3" --card-video "$2" --card "$4" --fade-in 0 --intro-lufs -18.5 --until "$5" "${C[@]}"
else
  bun tools/compose.ts layout.json v5/pgfm198-edited.mp4 final/head.mp4 --intro "$O/music/a-shades-long2-pad.wav" --card-video card/out/card-198.mp4 --card 13 --until "$2" "${C[@]}"
fi
