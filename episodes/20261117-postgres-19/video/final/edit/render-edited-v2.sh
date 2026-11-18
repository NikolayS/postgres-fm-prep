#!/usr/bin/env bash
# Prepared only: run after disk space is available. Reproduce the approved v2 plan.
set -euo pipefail
REPO="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
F="$REPO/episodes/20261117-postgres-19/video/final"
R="${RECORDING:-/Users/nik/Documents/Zoom/2026-11-17 10.02.00 .fm recording}"
df -h /System/Volumes/Data
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
for src in "$REPO"/tools/podcast-edit/*.ts; do ln -s "$src" "$TMP/$(basename "$src")"; done
rm "$TMP/render.ts"
cp "$REPO/tools/podcast-edit/render.ts" "$TMP/render.ts"
patch "$TMP/render.ts" < "$F/edit/render-relaxed-joins.patch"
patch "$TMP/render.ts" < "$F/edit/render-stable-frames.patch"
cd "$R/review"
STABLE_PLAN=edited-draft.cuts.json bun "$TMP/render.ts" work/edl-v2.json edited-v2.mp4 --work work/render --preset fast
cmp edited-v2.cuts.json "$F/edit/edited-v2.cuts.json"
