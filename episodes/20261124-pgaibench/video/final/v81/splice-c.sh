#!/usr/bin/env bash
# v8.1b, second pass: replace window 3 (frames 29560-31310) with the Track 1 scatter render; audio copied as is.
set -euo pipefail
cd "$(dirname "$0")"
IN=../../for-nik/70-episode-198-final-v81b.mp4; A=29560; B=31310
rm -rf partsc && mkdir partsc
ffmpeg -nostdin -y -v error -i $IN -map 0:v -c copy -frames:v $A -video_track_timescale 12800 partsc/c1.mp4
ffmpeg -nostdin -y -v error -ss 0.4 -i x3.mp4 -map 0:v -frames:v $((B-A)) -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -r 25 -video_track_timescale 12800 partsc/m.mp4
ffmpeg -nostdin -y -v error -ss $(python3 -c "print($B/25+0.046953)") -i $IN -map 0:v -c copy -video_track_timescale 12800 partsc/t.mp4
printf "file 'c1.mp4'\nfile 'm.mp4'\nfile 't.mp4'\n" > partsc/list.txt
ffmpeg -nostdin -y -v error -f concat -safe 0 -i partsc/list.txt -c copy partsc/v.mp4
ffmpeg -nostdin -y -v error -i partsc/v.mp4 -i $IN -map 0:v -map 1:a -c copy -movflags +faststart ../../for-nik/70-episode-198-final-v81b.new.mp4
mv ../../for-nik/70-episode-198-final-v81b.new.mp4 $IN
rm -rf partsc
ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 $IN
