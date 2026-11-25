#!/bin/bash
# compose head with intro A v3 (same flags as review/final/head.sh "particle"), -> out/head3.mp4
set -e
S="$(cd "$(dirname "$0")" && pwd)"
R="/Users/nik/Documents/Zoom/2026-11-24 10.37.15 .fm recording/review"
O="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card"
export PODCAST_BRAND=/Users/nik/github/postgres-fm-prep/episodes/20261027-uuidv4-vs-uuidv7/video/brand-public
cd "$R"
bun tools/compose.ts layout.json v5/pgfm198-edited.mp4 "$S/out/head3.mp4" --intro "$S/out/bed3.wav" --card-video "${1:-$S/out/intro-A3.mp4}" --card 17.96 --fade-in 0 --until 10.5 \
  --outro "$O/outro/a-shades-outro.wav" --end 0 --music-lufs -20.5 --intro-lufs -18.5 --duck -21 --duck-ramp 3 --intro-fade 8 --preset fast \
  --overlays overlays/out-v2/manifest-v5-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0
