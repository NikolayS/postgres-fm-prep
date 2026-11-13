#!/usr/bin/env bash
# Render one window of the final (edited seconds FROM..TO) with the current overlays, for splice.ts.
# Usage: bash patch-window.sh FROM TO NAME     -> 27-win-NAME.mp4 (final time 0 = edited FROM + 14)
set -euo pipefail
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; cd "$R"
WD=/Users/nik/.claude/skills/podcast-edit/watchdog.ts
bun "$WD" 180 -- bun tools/compose.ts 21-layout.json 01-edited.mp4 "27-win-$3.mp4" --from "$1" --until "$2" \
  --overlays 20-overlays/manifest-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0 --preset fast
