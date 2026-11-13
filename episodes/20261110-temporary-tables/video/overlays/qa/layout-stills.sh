#!/bin/zsh
# Layout stills (current 21-layout.json + center windows of the v2 overlays) at each card's still time.
# layout.ts reads stdin, so feed it </dev/null inside the loop or it eats the list.
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; Q="$R/scratchpad/overlays/qa"; mkdir -p "$Q/layout"; cd "$R"
while read id t rel; do bun tools/layout.ts "$Q/qa-layout-center.json" 01-edited.mp4 "$Q/layout/$id.png" --still $t </dev/null >/dev/null 2>&1 && echo "ok $id" || echo "FAIL $id"; done < "$Q/still-times.txt"
