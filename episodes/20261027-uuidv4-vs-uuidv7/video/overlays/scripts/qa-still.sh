#!/usr/bin/env bash
# qa-still.sh <id> <comp> <sec> <band|center> -> stills/<id>@<sec>.png composited over the layout still
set -euo pipefail
cd "$(dirname "$0")/.."
O=..; id=$1; comp=$2; sec=$3; pl=$4
f=$(python3 -c "print(round($sec*25))")
bunx remotion still src/index.ts "$comp" "$O/stills/raw-$id@$sec.png" --frame=$f --log error --props="$O/props/$id.props.json"
bg="$O/still-band.png"; [ "$pl" = center ] && bg="$O/still-center.png"
ffmpeg -v error -y -i "$bg" -i "$O/stills/raw-$id@$sec.png" -filter_complex overlay "$O/stills/$id@$sec.png"
echo "$O/stills/$id@$sec.png"
