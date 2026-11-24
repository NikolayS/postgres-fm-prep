#!/usr/bin/env bash
# ep198 body: ep196 two-host recipe + ep197 header line. Run from review/.
set -euo pipefail
O="<ep194-recording>/review/scratchpad/v3/card"
export PODCAST_BRAND=~/github/postgres-fm-prep/episodes/20261027-uuidv4-vs-uuidv7/video/brand-public
bun ~/github/postgres-fm-prep/tools/podcast-edit/watchdog.ts 180 -- bun tools/compose.ts layout.json pgfm198-edited.mp4 final/episode-198-body.mp4 \
  --intro "$O/music/a-shades-long2-pad.wav" --card-video card/out/card-198.mp4 --card 13 --duck-ramp 3 --intro-fade 8 \
  --outro "$O/outro/a-shades-outro.wav" --end 0 --music-lufs -20.5 --duck -21 --preset fast \
  --overlays overlays/out/manifest-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0
