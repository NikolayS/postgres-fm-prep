#!/usr/bin/env bash
# Episode 196 final v6 = v5 + two reviewer fixes (2026-11-12):
#  - card 23 (throughput): the CTE bar no longer covers the x-axis -> re-compose edited 1560-1760, splice
#  - no keyboard sound under the psql card (24) -> new sound from compose --audio-only, remuxed
set -euo pipefail
R="/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review"; cd "$R"
S=~/.claude/skills/podcast-edit
O="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card"
SFX="--overlays 20-overlays/manifest-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0"

bun $S/watchdog.ts 180 -- bun tools/compose.ts 21-layout.json 01-edited.mp4 43-chunk.mp4 --from 1560 --until 1760 $SFX --preset fast > 43-chunk.log 2>&1
cp 25-final-v5.mp4 43-audio.mp4
bun tools/compose.ts 21-layout.json 01-edited.mp4 43-audio.mp4 --intro "$O/music/a-shades-long2-pad.wav" --card-video "$R/card/remotion/out/card-crazy-v9.mp4" \
  --duck-ramp 3 --intro-fade 8 --outro "$O/outro/a-shades-outro.wav" --end 0 --card 14 --fade-in-pow 3 --music-lufs -20.5 --preset fast \
  $SFX --audio-only > 43-audio.log 2>&1

# final = edited + 14; splice.ts widens the window to keyframes
bun $S/splice.ts 25-final-v5.mp4 44-video.mp4 --from 1584.1 --to 1763.9 --with 43-chunk.mp4 --with-at 1574 --preset fast 2>&1 | grep -E "window|wrote"
ffmpeg -v error -y -i 44-video.mp4 -i 43-audio.mp4 -map 0:v -map 1:a -c copy -movflags +faststart 25-final-v6.part.mp4
mv 25-final-v6.part.mp4 25-final-v6.mp4
rm -f "$R/44-video.mp4"
ffprobe -v error -show_entries stream=codec_type,duration,nb_frames -of csv=p=0 25-final-v6.mp4
