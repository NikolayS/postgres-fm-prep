#!/usr/bin/env bash
# Episode 197 final compose (no cold open; it is prepended after). Same arguments as episode 196 render.sh.
set -euo pipefail
R="<recording>"
cd "$R/final"
O="<ep194-recording>/review/scratchpad/v3/card"
export PODCAST_BRAND=<repo>/episodes/20261027-uuidv4-vs-uuidv7/video/brand-public
bun tools/compose.ts layout.json "$R/review/edited-v2-mb.mp4" 26-final-v2.mp4 \
  --outro "$O/outro/a-shades-outro.wav" --end 0 --card 0 --fade-in 0 --music-lufs -20.5 --duck -21 --preset fast \
  --overlays "$R/final-overlays/overlays-v2/manifest.json" --sfx-rel center-in=0,center-out=-3,typing=0,accent=0
