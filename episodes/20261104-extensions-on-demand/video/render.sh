#!/usr/bin/env bash
# Final render of episode 195 (25-final-v1.mp4), as run on 2026-11-05.
# Run from the review folder, which holds the inputs (see README.md):
#   cd "/Users/nik/Documents/Zoom/2026-11-04 14.09.51 .fm recording/review" && bash <repo>/episodes/20261104-extensions-on-demand/video/render.sh
# tools/ there is the patched copy of tools/podcast-edit (README.md, "Tools").
# A full render takes well over an hour. Wrap long renders in the
# watchdog: bun ~/.claude/skills/podcast-edit/watchdog.ts 180 -- bun tools/compose.ts ...
set -euo pipefail
# Intro and outro music and their arrangement are from episode 194.
O="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card"
bun tools/compose.ts 21-layout-center-v2.json 01-edited.mp4 25-final-v1.mp4 \
  --intro "$O/music/a-shades-long2-pad.wav" \
  --card-video card/remotion/out/card-crazy-v3.mp4 \
  --duck-ramp 3 --intro-fade 8 \
  --outro "$O/outro/a-shades-outro.wav" \
  --end 0 --card 13 --fade-in-pow 3 --music-lufs -20.5 \
  --overlays 20-overlays/manifest-sfx.json \
  --sfx-rel center-in=0,center-out=-3,typing=0,accent=0 \
  --preset fast
