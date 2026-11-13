#!/bin/zsh
# Render every ep196 overlay (ProRes 4444 + alpha via Remotion), then re-encode at prores_ks qscale 8
# (same profile, alpha kept; about 37% smaller) to fit the free disk. Stops if free space < 3 GB.
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; T="$R/scratchpad/overlays/tool"; O="$R/20-overlays"
cd "$T"
ids=(${(f)"$(bun -e 'import {ITEMS} from "./scripts/ep196.ts"; for (const i of ITEMS) console.log(i.id + " " + i.placement)')"})
for line in $ids; do
  id=${line%% *}; pl=${line##* }
  f="$O/$id.mov"; [[ $pl == band ]] && f="$O/$id-typing.mov"
  if [[ -f "$f.q8done" ]]; then echo "skip $id"; continue; fi
  free=$(df -k "$O" | tail -1 | awk '{print $4}'); if (( free < 4200000 )); then echo "LOW DISK, stop at $id"; exit 3; fi
  bun scripts/ep196.ts ../../../01-edited.cuts.json --render $id 2>&1 | grep -E "^(ok|FAIL)"
  [[ -f "$f" ]] || { echo "missing $f"; continue; }
  ffmpeg -v error -y -i "$f" -c:v prores_ks -profile:v 4 -qscale:v 8 -pix_fmt yuva444p10le -alpha_bits 16 -vendor apl0 "$f.tmp.mov" && mv "$f.tmp.mov" "$f" && touch "$f.q8done" && echo "q8 $id $(stat -f %z "$f")"
done
echo ALL DONE
