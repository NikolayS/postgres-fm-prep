#!/usr/bin/env bash
# Episode 198 cold open (episode 196 v7 method): slices of the composed body, overlays and their
# sounds included, joined in front of the body by stream copy. No announcer, no extra music.
#   A  Nik "five out of five cases, Fable decided to change something and restart server"
#      Kirk "After being told, 'Do not restart the server'?"  Nik "Yeah. Being overconfident."
#      (source 18:15.5-18:26.2; the s01 "5 of 5" strip is up)
#   C  Kirk "I don't want AI to automate my ability to make mistakes at scale." (58:23.95-58:29.05)
#      Nik "Faster." / "Often." (58:30.10-58:31.05)
# Body time = edited time + 13 (title card): A 975.74-986.16, C 3142.31-3147.41 and 3148.46-3149.41 edited. Edited times from the cuts map (stems.ts map()).
#   bash coldopen.sh <review-dir>
set -euo pipefail
R="$1"; cd "$R/final"
B=${BODY:-episode-198-body-lv.mp4}  # the body with levelled voices (level.ts)
OFF=13
# piece: body start, body end (s)
P=( "988.74 999.16"
    "3155.31 3160.41"
    "3161.46 3162.41" )
TS=$(ffprobe -v error -select_streams v -show_entries stream=time_base -of csv=p=0 "$B" | cut -d/ -f2)
F=""; i=0
for p in "${P[@]}"; do set -- $p; F="$F[0:v]trim=$1:$2,setpts=PTS-STARTPTS[v$i];[0:a]atrim=$1:$2,asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=$(printf "%.3f" "$(echo "$2-$1-0.04" | bc)"):d=0.04[a$i];"; i=$((i+1)); done
F="$F[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[cv][ca];[cv]fade=t=in:d=0.3,tpad=stop_mode=clone:stop_duration=0.6,fade=t=out:st=@FADEST@:d=0.6[v];[ca]apad=pad_dur=0.6,afade=t=in:d=0.2[a]"
D=$(echo "(986.16-975.74)+(3147.41-3142.31)+(3149.41-3148.46)" | bc)
F="${F/@FADEST@/$(printf "%.3f" "$D")}"
ffmpeg -v error -y -i "$B" -filter_complex "$F" -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 25 \
  -video_track_timescale "$TS" -c:a aac -b:a 192k -ar 48000 -ac 2 coldopen-198.mp4
printf "file '%s'\nfile '%s'\n" "$PWD/coldopen-198.mp4" "$PWD/$B" > concat.txt
ffmpeg -v error -y -f concat -safe 0 -i concat.txt -c copy -movflags +faststart episode-198-final.part.mp4
mv episode-198-final.part.mp4 episode-198-final.mp4
for f in coldopen-198.mp4 episode-198-final.mp4; do echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
