#!/bin/zsh
# QA sheet: for every overlay in manifest.json, the frame at its middle (or stillAt) composited over
# 01-edited.mp4 at the same edited time. Writes $R/20-overlays/qa-sheet.png.
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; O="$R/20-overlays"; Q="$R/scratchpad/overlays/qa/frames"; mkdir -p "$Q"; rm -f "$Q"/*.png
cd "$O"
python3 -c "
import json
for o in json.load(open('manifest.json'))['overlays']:
    f=o['file'] if o['placement']!='band' else o['id']+'-typing.mov'
    rel=min(o['stillAt'], o['dur']-0.5) if o['placement']=='center' else o['dur']/2
    print(o['id'], f, round(rel,2), round(o['outStart']+rel,2))
" | while read id f rel at; do
  ffmpeg -v error -y -ss $at -i "$R/01-edited.mp4" -ss $rel -i "$O/$f" -filter_complex "[0:v]scale=1920:1080[b];[b][1:v]overlay=0:0:format=auto" -frames:v 1 "$Q/$id.png" || echo "FAIL $id"
done
python3 "$R/scratchpad/overlays/qa/sheet.py" "$O/qa-sheet.png" gray 4 "$Q"/*.png
