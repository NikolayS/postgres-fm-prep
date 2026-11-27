#!/usr/bin/env bash
# ep198 body (v7b: Gemini-check fixes, the yawn patch in the edit) without the opening: --card 0, talk from 0 s. The opening (title card or particle intro
# + its music under the first words) is a separate head render (head.sh) joined at a keyframe.
set -euo pipefail
O="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card"
export PODCAST_BRAND=/Users/nik/github/postgres-fm-prep/episodes/20261027-uuidv4-vs-uuidv7/video/brand-public
bun /Users/nik/github/postgres-fm-prep/tools/podcast-edit/watchdog.ts 180 -- bun tools/compose.ts layout.json v5/pgfm198-edited.v7b.mp4 final/body7b.mp4 \
  --card 0 --outro "$O/outro/a-shades-outro.wav" --end 0 --music-lufs -20.5 --duck -21 --preset fast \
  --overlays overlays/out-v2/manifest-v7b-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0 "$@"
