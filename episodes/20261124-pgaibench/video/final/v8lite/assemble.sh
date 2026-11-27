#!/usr/bin/env bash
# v8-lite: splice the 25 window renders into 70 on exact frame indexes (copy outside), then mux the new audio.
set -euo pipefail
cd "$(dirname "$0")"
P=/private/tmp/claude-501/-Users-nik/78e80d19-210b-4b4c-ad18-c0968e038640/scratchpad/pgfm
IN="../../for-nik/70-episode-198-final.mp4"
ENC=(-c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -r 25 -video_track_timescale 12800)
rm -rf parts && mkdir parts && : > parts/list.txt
python3 -c "
import json;p=json.load(open('$P/v8lite-plan.json'))
prev=0;pk=None
for i,o in enumerate(p):
  print('copy',i,prev,o['fa']-prev,pk if pk is not None else '-')
  print('mid',i,o['fb']-o['fa'],0,0)
  prev=o['fb'];pk=o['ke']
print('tail',len(p),prev,0,pk)
" > parts/plan.txt
while read kind i a n k; do
  f=$(printf "parts/%s%02d.mp4" $kind $i)
  case $kind in
    copy) if [ "$k" = "-" ]; then ffmpeg -nostdin -y -v error -i "$IN" -map 0:v -c copy -frames:v $n -video_track_timescale 12800 $f; else ffmpeg -nostdin -y -v error -ss $k -i "$IN" -map 0:v -c copy -frames:v $n -video_track_timescale 12800 $f; fi;;
    mid) ffmpeg -nostdin -y -v error -ss 0.4 -i $(printf "w%02d.mp4" $i) -map 0:v -frames:v $a "${ENC[@]}" $f;;
    tail) ffmpeg -nostdin -y -v error -ss $k -i "$IN" -map 0:v -c copy -video_track_timescale 12800 $f;;
  esac
  echo "file '$(basename $f)'" >> parts/list.txt
done < parts/plan.txt
ffmpeg -nostdin -y -v error -f concat -safe 0 -i parts/list.txt -c copy video8l.mp4
echo "frames $(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 video8l.mp4) (70 has 79544)"
