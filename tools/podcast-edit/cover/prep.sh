#!/bin/zsh
# Prepare one host cutout for a cover.
# usage: prep.sh <nik|kirk> <frame.png> <faceX> <out.png>
#   cutout -> remove wall-logo leftovers (Nik) -> light denoise/sharpen + exposure match
#   -> harden edges -> crop centred on the face. No face retouching.
set -e
here=${0:A:h}
who=$1; src=$2; faceX=$3; out=$4
tmp=${out%.png}_cut.png
cd "$here"
bun run cutout.ts "$src" "$tmp" >/dev/null
if [[ $who == nik ]]; then
  # wall logo cleanup is off by default: pick frames where the head is clear of the logo.
  # LOGOFIX=1 turns it on (it can nibble skin, check the edge at 300%).
  [[ -n $LOGOFIX ]] && bun logo-fix.ts "$tmp" "$tmp"
  O="0"; P="0"
  eq="gamma=1.12:brightness=0.03:saturation=1.05"
  w=470; h=ih; x0=$(( faceX - 235 ))
else
  O="0"; P="0"
  eq="gamma=0.96:brightness=-0.04:saturation=0.95"
  w=400; h=290; x0=$(( faceX - 200 ))
fi
(( x0 < 0 )) && x0=0
ffmpeg -loglevel error -y -i "$tmp" -filter_complex "[0]format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if($O+$P,0,clip((alpha(X,Y)-40)*4,0,255))',format=rgba,split[c][a];[a]alphaextract[al];[c]format=yuv444p,hqdn3d=1.5:1.5:3:3,eq=$eq,unsharp=5:5:0.4:5:5:0.0,format=rgba[cc];[cc][al]alphamerge,crop=$w:$h:$x0:0" "$out"
echo "wrote $out"
