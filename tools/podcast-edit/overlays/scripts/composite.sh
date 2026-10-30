#!/usr/bin/env bash
# Composite one alpha overlay (ProRes 4444) onto a window of the edited talk, with
# optional freeze-frame under the card and SFX pinned to clip time.
#
# Usage: composite.sh BASE START LEN OVERLAY AT FREEZE OUT "sfx@t:gain ..."
#   BASE    edited talk video (output time base)
#   START   clip start in BASE, seconds
#   LEN     clip length, seconds
#   OVERLAY alpha .mov from `remotion render ... --codec prores --prores-profile 4444`
#   AT      overlay start, seconds from clip start
#   FREEZE  seconds of freeze-frame starting at AT (0 = talk continues)
#   OUT     output mp4
#   SFX     space-separated list "path@seconds:gain", seconds from clip start
set -euo pipefail
BASE=$1; START=$2; LEN=$3; OVERLAY=$4; AT=$5; FREEZE=$6; OUT=$7; SFX=${8:-}
FPS=25

inputs=(-ss "$START" -t "$LEN" -i "$BASE" -i "$OVERLAY")
fc=""
if [ "$(echo "$FREEZE > 0" | bc)" = 1 ]; then
  n=$(printf "%.0f" "$(echo "$FREEZE * $FPS" | bc)")
  fc+="[0:v]split=3[v_a][v_b][v_c];"
  fc+="[v_a]trim=0:$AT,setpts=PTS-STARTPTS[pre];"
  fc+="[v_b]trim=start=$AT,setpts=PTS-STARTPTS,trim=end_frame=1,loop=loop=$n:size=1:start=0,trim=0:$FREEZE,setpts=PTS-STARTPTS[frz];"
  fc+="[v_c]trim=start=$AT,setpts=PTS-STARTPTS[post];"
  fc+="[pre][frz][post]concat=n=3:v=1:a=0[vbase];"
  fc+="[0:a]asplit=2[a_a][a_b];[a_a]atrim=0:$AT,asetpts=PTS-STARTPTS[apre];"
  fc+="anullsrc=r=48000:cl=stereo:d=$FREEZE[afrz];"
  fc+="[a_b]atrim=start=$AT,asetpts=PTS-STARTPTS[apost];"
  fc+="[apre][afrz][apost]concat=n=3:v=0:a=1[abase];"
else
  fc+="[0:v]copy[vbase];[0:a]aformat=sample_rates=48000:channel_layouts=stereo[abase];"
fi
# Overlay: delay its PTS by AT, pass through after it ends.
fc+="[1:v]setpts=PTS+$AT/TB[ov];[vbase][ov]overlay=0:0:eof_action=pass:format=auto[vout];"

# SFX chain
i=2; mix="[abase]"; cnt=1
for spec in $SFX; do
  path=${spec%%@*}; rest=${spec#*@}; t=${rest%%:*}; gain=${rest#*:}
  inputs+=(-i "$path")
  ms=$(printf "%.0f" "$(echo "$t * 1000" | bc)")
  fc+="[$i:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=$gain,adelay=$ms|$ms[s$i];"
  mix+="[s$i]"; i=$((i+1)); cnt=$((cnt+1))
done
fc+="${mix}amix=inputs=$cnt:normalize=0:duration=first[aout]"

ffmpeg -hide_banner -loglevel error -y "${inputs[@]}" -filter_complex "$fc" \
  -map "[vout]" -map "[aout]" -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r $FPS -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "wrote $OUT"
