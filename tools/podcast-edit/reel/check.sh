#!/bin/sh
# usage: check.sh in.mp4 out.png  -- strip of frame 0, the middle of each feature, and the end card
IN=$1; OUT=$2; D=$(mktemp -d)
i=0; for f in 0 111 201 291 381 471 561 670; do
  ffmpeg -loglevel error -y -i "$IN" -vf "select=eq(n\,$f),scale=540:-1,drawbox=y=ih-90:w=iw:h=1:color=red@0.8" -frames:v 1 "$D/$i.png"; i=$((i+1)); done
ffmpeg -loglevel error -y $(for k in 0 1 2 3 4 5 6 7; do printf -- "-i $D/$k.png "; done) -filter_complex "xstack=inputs=8:grid=4x2" "$OUT"
