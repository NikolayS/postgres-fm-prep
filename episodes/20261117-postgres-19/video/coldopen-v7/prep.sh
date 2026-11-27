#!/usr/bin/env bash
# Frames and dialogue for the v7 montage: the full six-topic montage of v4b (v3 seconds), as one
# continuous 34.24 s sequence. Writes into $WORK/v7:
#   wide/%04d.jpg   the episode layout (v3.layout.mp4)
#   n|m|k/%04d.jpg  each host's own Zoom tile (v3.src.mov), cropped clear of Zoom's name label,
#                   scaled to 1920x1080 with lanczos and a light unsharp
#   dialog.wav      the montage audio
#   seq/<host>/     2.8 s of each host's tile for the intro cards (from SOURCE)
# Usage: SOURCE=<Zoom video1398514958.mp4> WORK=<cold-open-final media dir> bash prep.sh
set -euo pipefail
: "${SOURCE:?}" "${WORK:?}"; cd "$WORK"; mkdir -p v7
R=("0 34.24")
cat_filter() { # uses IN (input label) and PF (filter after each trim)
  local f="" c="" i=0
  for r in "${R[@]}"; do set -- $r; f+="[$IN]trim=$1:$2,setpts=PTS-STARTPTS$PF[p$i];"; c+="[p$i]"; i=$((i+1)); done
  echo "${f}${c}concat=n=$i:v=1:a=0[o]"
}
mkdir -p v7/wide; IN=0:v; PF=""; ffmpeg -nostdin -v error -y -i v3.layout.mp4 -filter_complex "$(cat_filter)" -map "[o]" -q:v 2 v7/wide/%04d.jpg
for t in "n 660:0" "m 660:360" "k 20:0"; do set -- $t; who=$1; xy=$2; mkdir -p v7/$who
  IN=0:v; PF=",crop=600:338:$xy,scale=2016:1134:flags=lanczos,crop=1920:1080:48:27,unsharp=5:5:0.5"
  ffmpeg -nostdin -v error -y -i v3.src.mov -filter_complex "$(cat_filter)" -map "[o]" -q:v 2 v7/$who/%04d.jpg
done
a=""; c=""; i=0; for r in "${R[@]}"; do set -- $r; a+="[0:a]atrim=$1:$2,asetpts=PTS-STARTPTS[a$i];"; c+="[a$i]"; i=$((i+1)); done
ffmpeg -nostdin -v error -y -i v3.layout.mp4 -filter_complex "${a}${c}concat=n=$i:v=0:a=1[o]" -map "[o]" -ar 48000 v7/dialog.wav
for p in "nik 1638.9 660:0" "michael 151.0 660:360" "kirk 151.0 20:0"; do set -- $p
  [ -s v7/seq/$1/0001.png ] || { mkdir -p v7/seq/$1; ffmpeg -nostdin -v error -y -ss $2 -t 2.8 -i "$SOURCE" -vf "fps=25,crop=600:338:$3,scale=1920:1080:flags=lanczos" v7/seq/$1/%04d.png; }
done
echo "wide $(ls v7/wide | wc -l) n $(ls v7/n | wc -l) dialog $(ffprobe -v error -show_entries format=duration -of csv=p=0 v7/dialog.wav)"
