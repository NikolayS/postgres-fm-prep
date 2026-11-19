#!/usr/bin/env bash
# Episode 197 final compose (no cold open; it is prepended after). Same arguments as episode 196 render.sh.
# Overlay sounds: sfx-manifest.ts writes manifest-sfx.json (the convention in tools/podcast-edit/sfx/README.md);
# compose renders that, never the raw manifest.json (the first ep197 final had no sounds that way).
# The shipped final got its sounds by an audio-only remux instead: edit/sfx-stem.ts (video/final/README.md).
set -euo pipefail
R="<recording>"; REPO="<repo>"
OV="$R/final-overlays/overlays-v2"
(cd "$OV" && bun "$REPO/tools/podcast-edit/sfx-manifest.ts" manifest.json --out manifest-sfx.json --accent f00-cves=3.8)
cd "$R/final"
O="<ep194-recording>/review/scratchpad/v3/card"
export PODCAST_BRAND=$REPO/episodes/20261027-uuidv4-vs-uuidv7/video/brand-public
bun tools/compose.ts layout.json "$R/review/edited-v2-mb.mp4" 26-final-v2.mp4 \
  --outro "$O/outro/a-shades-outro.wav" --end 0 --card 0 --fade-in 0 --music-lufs -20.5 --duck -21 --preset fast \
  --overlays "$OV/manifest-sfx.json" --sfx-rel center-in=0,center-out=-3,typing=0,accent=0
