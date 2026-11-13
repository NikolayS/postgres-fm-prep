#!/usr/bin/env bash
# Episode 196 final v5 without a full compose (the full one took 5 h and swapped the disk full):
#  1. sound manifest from the new cards (no band typing; psql typing added by hand)
#  2. the show re-composed in 5 chunks (edited seconds, split in gaps between cards), 2 at a time
#  3. each chunk spliced into v4 (final = edited + 14; splice.ts widens to keyframes at x6.48)
#  4. new sound (compose --audio-only) and the episode-194 outro (DBLab Forge + Postgres.AI logo)
set -euo pipefail
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; cd "$R"
S=~/.claude/skills/podcast-edit
O="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card"

(cd 20-overlays && bun $S/sfx-manifest.ts manifest.json --out manifest-sfx.json)
bun add-psql-typing.ts >/dev/null

chunk() { bun $S/watchdog.ts 180 -- bun tools/compose.ts 21-layout.json 01-edited.mp4 "30-chunk-$3.mp4" --from "$1" --until "$2" \
  --overlays 20-overlays/manifest-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0 --preset fast > "30-chunk-$3.log" 2>&1; }
# chunks A-D are reused when present (cards 27/28 cut after they were built; they sit in chunk E only)
[ -s 30-chunk-A.mp4 ] && [ -s 30-chunk-B.mp4 ] || { chunk 20 500 A & chunk 490 1000 B & wait; }
[ -s 30-chunk-C.mp4 ] && [ -s 30-chunk-D.mp4 ] || { chunk 990 1370 C & chunk 1360 1760 D & wait; }
chunk 1750 2280 E
for c in A B C D E; do echo "$c $(ffprobe -v error -show_entries format=duration -of csv=p=0 30-chunk-$c.mp4)"; done

# sound: same compose inputs, audio only, remuxed into a copy of v4
cp 25-final-v4.mp4 31-audio.mp4
bun tools/compose.ts 21-layout.json 01-edited.mp4 31-audio.mp4 --intro "$O/music/a-shades-long2-pad.wav" --card-video "$R/card/remotion/out/card-crazy-v9.mp4" \
  --duck-ramp 3 --intro-fade 8 --outro "$O/outro/a-shades-outro.wav" --end 0 --card 14 --fade-in-pow 3 --music-lufs -20.5 --preset fast \
  --overlays 20-overlays/manifest-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0 --audio-only > 31-audio.log 2>&1

in=25-final-v4.mp4; i=0
for spec in "A 20 500" "B 490 1000" "C 990 1370" "D 1360 1760" "E 1750 2280"; do
  set -- $spec; i=$((i+1)); cs=$(( $2 + 14 )); ce=$(( $3 + 14 ))
  out="32-s$i.mp4"
  bun $S/splice.ts "$in" "$out" --from "$(echo "$cs + 10.1" | bc)" --to "$(echo "$ce - 10.1" | bc)" --with "30-chunk-$1.mp4" --with-at "$cs" --preset fast 2>&1 | grep -E "window|wrote"
  [ "$in" = 25-final-v4.mp4 ] || rm -f "$R/$in"
  in="$out"
done
bun $S/splice.ts "$in" 32-s6.mp4 --audio 31-audio.mp4 --from 30 --to 31 --preset fast 2>&1 | grep -E "window|wrote"
rm -f "$R/$in"
bun $S/splice.ts 32-s6.mp4 25-final-v5.mp4 --outro "$O/outro/logo.mp4" --at 2297.6 --preset fast 2>&1 | grep -E "window|wrote"
rm -f "$R/32-s6.mp4"
ffprobe -v error -show_entries stream=codec_type,duration,nb_frames -of csv=p=0 25-final-v5.mp4
