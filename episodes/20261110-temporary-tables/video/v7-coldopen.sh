#!/usr/bin/env bash
# Episode 196 final v7 = cold open (10.72 s, final v6 26:57.9-27:08.6, chart card 23) + final v6; podcast audio gets the same cold open.
set -euo pipefail
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; cd "$R"
C=50-coldopen
printf "file '%s'\nfile '%s'\n" "$R/$C/coldopen-v1.mp4" "$R/25-final-v6.mp4" > $C/concat.txt
ffmpeg -v error -y -f concat -safe 0 -i $C/concat.txt -c copy -movflags +faststart 25-final-v7.part.mp4
mv 25-final-v7.part.mp4 25-final-v7.mp4
# podcast: same cold open audio, resampled to 44.1k, then the podcast wav
ffmpeg -v error -y -i $C/coldopen-v1.mp4 -vn -ar 44100 -ac 2 -c:a pcm_s16le $C/coldopen.wav
ffmpeg -v error -y -i 41-podcast.mp3 -an -c:v copy $C/cover.png
ffmpeg -v error -y -i $C/coldopen.wav -i 41-podcast.wav -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[a]" -c:a pcm_s16le 42-podcast.wav
ffmpeg -v error -y -i 42-podcast.wav -i $C/cover.png -map 0:a -map 1:v -c:a libmp3lame -b:a 192k -c:v png -disposition:v attached_pic -id3v2_version 3 \
  -metadata title="The hidden costs of CREATE TEMP TABLE" -metadata artist=PostgresFM -metadata album=PostgresFM 42-podcast.mp3
ffprobe -v error -show_entries stream=codec_type,duration,nb_frames -of csv=p=0 25-final-v7.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 42-podcast.mp3
