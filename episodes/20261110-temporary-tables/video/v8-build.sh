#!/usr/bin/env bash
# Episode 196 final v8 = v6 + fact-check fixes (2026-11-13), no full re-render:
#  - cards 08/11 (row 1 "Data invisible to other sessions"), 09 (editor's note: 23+ catalog rows),
#    15 (fast-path slots by version; temp-table DDL never uses the fast path), 21-ring (sinval mechanics,
#    re-checked by a PG internals reviewer against sinvaladt.c)
#  - three chunks re-composed (edited seconds, cut in gaps between cards), spliced in; audio copied from v6
#  - then v8 with the cold open = 25-final-v8c.mp4 (see v7-coldopen.sh)
set -euo pipefail
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; cd "$R"
S=~/.claude/skills/podcast-edit
SFX="--overlays 20-overlays/manifest-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0"
chunk() { bun $S/watchdog.ts 180 -- bun tools/compose.ts 21-layout.json 01-edited.mp4 "47-chunk-$3.mp4" --from "$1" --until "$2" $SFX --preset fast > "47-chunk-$3.log" 2>&1; }
[ -s 47-chunk-A.mp4 ] || chunk 700 975 A &
[ -s 47-chunk-B.mp4 ] || chunk 1090 1175 B &
[ -s 47-chunk-C.mp4 ] || chunk 1470 1580 C &
wait
in=25-final-v6.mp4; i=0
for spec in "A 700 975" "B 1090 1175" "C 1470 1580"; do
  set -- $spec; i=$((i+1)); cs=$(( $2 + 14 )); ce=$(( $3 + 14 ))
  out="47-s$i.mp4"
  bun $S/splice.ts "$in" "$out" --from "$(echo "$cs + 5.1" | bc)" --to "$(echo "$ce - 10" | bc)" --with "47-chunk-$1.mp4" --with-at "$cs" --preset fast 2>&1 | grep -E "window|wrote"
  [ "$in" = 25-final-v6.mp4 ] || rm -f "$R/$in"
  in="$out"
done
mv "$in" 25-final-v8.mp4
ffprobe -v error -show_entries stream=codec_type,duration,nb_frames -of csv=p=0 25-final-v8.mp4
