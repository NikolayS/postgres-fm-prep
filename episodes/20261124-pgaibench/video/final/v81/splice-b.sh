#!/usr/bin/env bash
# v8.1b video: copy the v8.1 picture outside the windows, windows from x<i>.mp4 (-ss per window, column 4: the compose window can start one frame early), joined at keyframes.
set -euo pipefail
cd "$(dirname "$0")"
IN=../../for-nik/70-episode-198-final-v81.mp4
ENC=(-c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -r 25 -video_track_timescale 12800)
rm -rf partsb && mkdir partsb && : > partsb/list.txt
prev=0; n=0
while read -r i a b ss; do
  n=$((n+1)); c=$(printf "partsb/c%02d.mp4" $n); m=$(printf "partsb/m%02d.mp4" $n)
  if [ $prev -eq 0 ]; then ffmpeg -nostdin -y -v error -i $IN -map 0:v -c copy -frames:v $a -video_track_timescale 12800 $c
  else ks=$(python3 -c "print($prev/25+0.046953)"); ffmpeg -nostdin -y -v error -ss $ks -i $IN -map 0:v -c copy -frames:v $((a-prev)) -video_track_timescale 12800 $c; fi
  ffmpeg -nostdin -y -v error -ss $ss -i x$i.mp4 -map 0:v -frames:v $((b-a)) "${ENC[@]}" $m
  printf "file '%s'\nfile '%s'\n" $(basename $c) $(basename $m) >> partsb/list.txt
  prev=$b
done < windows.txt
ks=$(python3 -c "print($prev/25+0.046953)"); ffmpeg -nostdin -y -v error -ss $ks -i $IN -map 0:v -c copy -video_track_timescale 12800 partsb/tail.mp4
echo "file 'tail.mp4'" >> partsb/list.txt
ffmpeg -nostdin -y -v error -f concat -safe 0 -i partsb/list.txt -c copy video81b.mp4
for f in partsb/*.mp4; do printf "%s %s\n" $f $(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 $f); done
echo "total $(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 video81b.mp4) (want 79544)"
