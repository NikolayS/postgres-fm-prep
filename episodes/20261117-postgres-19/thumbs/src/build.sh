#!/bin/bash
# Rebuild thumbnails, the square cover and the contact sheet from picks (final-video seconds).
# Usage: bash build.sh <nik_t> <mic_t> <kirk_t>
set -e; cd "$(dirname "$0")"
P=/Users/nik/github/postgres-fm-prep/episodes/20261117-postgres-19/preview
PICKS="nik=$1,mic=$2,kirk=$3" python3 tiles.py
python3 mk.py
for p in nik mic kirk; do ./seg $PWD/$p-src.png $PWD/$p-cut.png; done
python3 hosts.py
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=3 --window-size=1000,1000 --screenshot=$PWD/cover-3000.png file://$PWD/square.html 2>/dev/null
mkdir -p $P/thumbs; cp thumb-a.png thumb-b.png thumb-c.png $P/thumbs/; cp cover-3000.png $P/cover-197-3000.png
python3 sheet2.py "$P/thumbs-sheet.png"
ls $PWD/thumb-?.png $PWD/cover-3000.png | ./faces 2>/dev/null | python3 -c "
import sys,json
for l in sys.stdin:
  r=json.loads(l); print(r['f'].split('/')[-1], len(r['faces']), 'faces; eyes', [f['eyes'] for f in r['faces']])"
