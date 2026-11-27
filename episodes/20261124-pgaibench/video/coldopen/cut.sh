#!/usr/bin/env bash
# Cut cold-open pieces from the Zoom source (source seconds, Scribe word times), hard cuts, 30-40 ms edge fades.
# Usage: cut.sh out.mp4 "a b" "a b" ...
set -euo pipefail
F="${SOURCE:?set SOURCE to the Zoom recording video1808680036.mp4}"; out=$1; shift
in=(); fc=""; cat=""; i=0
for s in "$@"; do a=${s% *}; b=${s#* }; d=$(printf "%.3f" $(echo "$b-$a"|bc))
  in+=(-ss "$a" -t "$d" -i "$F")
  fc+="[$i:v]setpts=PTS-STARTPTS,fps=25[v$i];[$i:a]asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:d=0.03,afade=t=out:st=$(printf "%.3f" $(echo "$d-0.04"|bc)):d=0.04[a$i];"
  cat+="[v$i][a$i]"; i=$((i+1)); done
fc+="${cat}concat=n=$i:v=1:a=1[v][a]"
ffmpeg -nostdin -v error -y "${in[@]}" -filter_complex "$fc" -map "[v]" -map "[a]" -c:v libx264 -crf 16 -preset fast -pix_fmt yuv420p -r 25 -c:a pcm_s16le "$out"
