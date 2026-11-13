#!/usr/bin/env bash
# Episode 196 (temporary tables) video: final compose, same look as episode 195.
# Run from anywhere:  bash render.sh [out.mp4]        (default 25-final-v1.mp4)
#   HEAD=40 bash render.sh 24-draft-head.mp4          (preview: card + first 40 s of show, no overlays)
# tools/ is the patched copy of tools/podcast-edit at 31a74c9 (see the episode 195 video README, "Tools").
# A full render takes over an hour: it is wrapped in the watchdog (SIGINT after 180 s with no CPU).
set -euo pipefail
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"
cd "$R"
WD=/Users/nik/.claude/skills/podcast-edit/watchdog.ts
# Intro and outro music: the episode 194 cues (as in episode 195).
O="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card"
INTRO="$O/music/a-shades-long2-pad.wav"
OUTRO_MUSIC="$O/outro/a-shades-outro.wav"
# Title card: v8 or v9 (14 s, Remotion, card/remotion).
CARD="${CARD:-card-crazy-v9}"
CARD_VIDEO="$R/card/remotion/out/$CARD.mp4"
LAYOUT="$R/21-layout.json"   # outro video = its "logo": 21-outro-v2.mp4 (frame 1 DBLab Forge experiment + public brief, frame 2 Prepared by PostgresAI)
OVERLAYS="$R/20-overlays/manifest-sfx.json"
OUT="${1:-25-final-v1.mp4}"

df -h "$R" | tail -1
ARGS=(--intro "$INTRO" --card-video "$CARD_VIDEO" --duck-ramp 3 --intro-fade 8
  --outro "$OUTRO_MUSIC" --end 0 --card 14 --fade-in-pow 3 --music-lufs -20.5 --preset fast)
if [[ -n "${HEAD:-}" ]]; then
  ARGS+=(--until "$HEAD")
else
  ARGS+=(--overlays "$OVERLAYS" --sfx-rel center-in=0,center-out=-3,typing=0,accent=0)
fi
bun "$WD" 180 -- bun tools/compose.ts "$LAYOUT" 01-edited.mp4 "$OUT" "${ARGS[@]}"
