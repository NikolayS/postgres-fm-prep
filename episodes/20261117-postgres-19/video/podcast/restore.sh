#!/usr/bin/env bash
# Restore Transistor draft 3745675 (episode 197) after it was emptied for the pre-release leak
# (option A, 2026-11-18): re-sets summary, description and transcript from the repo and
# re-uploads preview/episode-197-podcast.mp3. Title, number, season and slug were never changed.
# Usage (from anywhere): bash restore.sh [--dry-run]
# Does NOT publish. Publish separately after PostgreSQL 19.0 is out (see ../../README.md).
set -euo pipefail
E="$(cd "$(dirname "$0")/../.." && pwd)"; R="$(cd "$E/../.." && pwd)"
MP3="$E/preview/episode-197-podcast.mp3"
[ -f "$MP3" ] || { echo "missing $MP3" >&2; exit 1; }
export TRANSISTOR_API_KEY="${TRANSISTOR_API_KEY:-$(cat ~/.config/transistor/key)}"
bun "$R/tools/podcast-edit/transistor.ts" --show 32147 --episode 3745675 \
  --audio "$MP3" \
  --summary-file "$E/notes/summary.txt" \
  --description-file "$E/notes/notes.transistor.html" \
  --transcript-file "$E/captions/podcast.transcript.txt" "$@"
