#!/usr/bin/env bash
# Episode 198 dynamic cold opens, step 2: render the picture of each variant with Remotion (no audio).
# Uses the episode card project's node_modules (review/card). W = work dir with lines/ from lines.sh.
#   R=<review dir> W=<work dir> bash render.sh [variant ...]
set -euo pipefail
D="$(cd "$(dirname "$0")" && pwd)"; : "${R:?}" "${W:?}"
P="$W/rem"; mkdir -p "$P/public" "$P/out"
ln -sfn "$R/card/node_modules" "$P/node_modules"; cp "$R/card/package.json" "$P/"
rm -rf "$P/src"; cp -R "$D/src" "$P/src"; cp "$D/spec.ts" "$P/spec.ts"; cp "$W"/lines/L?.mp4 "$P/public/"; cp "$W/lines/L1/.layout/bg.png" "$P/public/bg.png"; cp -R "$R/card/public/fonts" "$P/public/"
cd "$P"
for v in "${@:-bold medium restrained}"; do for x in $v; do
  npx remotion render src/index.tsx "Dyn-$x" "out/$x.mp4" --codec=h264 --crf=16 --muted --log=error
done; done
