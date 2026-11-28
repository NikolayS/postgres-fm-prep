#!/usr/bin/env bash
# v8.1d: v8.1c with window 3 (frames 29560-31310) from x3d.mp4 (Track 1 scatter with a marked Y-axis cut).
# Reads v81c, writes a NEW file v81d; audio copied from v81c.
set -euo pipefail
cd "$(dirname "$0")"
IN=../../for-nik/70-episode-198-final-v81c.mp4; OUT=../../for-nik/70-episode-198-final-v81d.mp4; A=29560; B=31310
[ -e "$OUT" ] && { echo "$OUT exists; not overwriting"; exit 1; }
rm -rf partsd && mkdir partsd
ffmpeg -nostdin -y -v error -i $IN -map 0:v -c copy -frames:v $A -video_track_timescale 12800 partsd/c1.mp4
ffmpeg -nostdin -y -v error -ss 0.4 -i x3d.mp4 -map 0:v -frames:v $((B-A)) -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -r 25 -video_track_timescale 12800 partsd/m.mp4
ffmpeg -nostdin -y -v error -ss $(python3 -c "print($B/25+0.046953)") -i $IN -map 0:v -c copy -video_track_timescale 12800 partsd/t.mp4
printf "file 'c1.mp4'\nfile 'm.mp4'\nfile 't.mp4'\n" > partsd/list.txt
ffmpeg -nostdin -y -v error -f concat -safe 0 -i partsd/list.txt -c copy partsd/v.mp4
ffmpeg -nostdin -n -v error -i partsd/v.mp4 -i $IN -map 0:v -map 1:a -c copy -movflags +faststart $OUT
rm -rf partsd
ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 $OUT
