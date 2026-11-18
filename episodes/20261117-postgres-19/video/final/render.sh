#!/usr/bin/env bash
# Episode 197 final compose (no cold open; it is prepended after). Same arguments as episode 196 render.sh.
set -euo pipefail
cd "<recording>/final"
O="<ep194-recording>/review/scratchpad/v3/card"
export PODCAST_BRAND=<repo>/episodes/20261027-uuidv4-vs-uuidv7/video/brand-public
bun tools/compose.ts layout.json "<recording>/review/edited-draft.mp4" 25-final-v1.mp4 \
  --intro "$O/music/a-shades-long2-pad.wav" --card-video "<recording>/final-cards/card-197.mp4" --duck-ramp 3 --intro-fade 8 \
  --outro "$O/outro/a-shades-outro.wav" --end 0 --card 14 --fade-in-pow 3 --music-lufs -20.5 --preset fast \
  --overlays "<recording>/final-overlays/overlays/manifest.json" --sfx-rel center-in=0,center-out=-3,typing=0,accent=0
