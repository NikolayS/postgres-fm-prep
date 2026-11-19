#!/usr/bin/env bash
# Episode final compose (template). Copy to episodes/<YYYYMMDD>-<slug>/video/render.sh and fill in R.
# Every overlay enters with a sound cue (root CLAUDE.md, "Video: sound cues on every illustration"):
# sfx-manifest.ts applies the convention in tools/podcast-edit/sfx/README.md and writes manifest-sfx.json;
# compose renders that file, never the raw manifest.json. compose.ts and qa.ts (check "sfx") fail
# when an overlay has no sound.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../../.." && pwd)"
S="$REPO/tools/podcast-edit"
R="${R:?set R to the recording review folder}"
OV="$R/20-overlays"
OUT="${1:-25-final-v1.mp4}"
# Accents only for a sudden reveal inside a card: --accent <card id>=<s from card start>.
(cd "$OV" && bun "$S/sfx-manifest.ts" manifest.json --out manifest-sfx.json)
cd "$R"
bun "$S/watchdog.ts" 180 -- bun "$S/compose.ts" 21-layout.json 01-edited.mp4 "$OUT" \
  --overlays "$OV/manifest-sfx.json" --sfx-rel center-in=0,center-out=-3,typing=0,accent=0 --preset fast
bun "$S/qa.ts" "$REPO/episodes/$(basename "$(dirname "$(dirname "$0")")")"
