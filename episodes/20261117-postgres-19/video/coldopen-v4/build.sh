#!/usr/bin/env bash
# Episode 197 cold open v4: a 12-beat title sequence on the music, then the six-topic montage
# (cold-open-final layout) with snap punch-ins on the speaker, music ducked under the voices,
# and a one-hit button at the end. See style-notes.md.
# Usage: SOURCE=<Zoom video1398514958.mp4> WORK=<media dir with v3.layout.mp4 and m-notify/> bash build.sh a|b|c <out.mp4>
#   a: Throwback Funk at 120 BPM; b: Electro House at 128 BPM; c: as a, plus risers, flash frames,
#   RGB split, impact shake and a punch on every punch-in.
# WORK must hold the cold-open-final intermediates (coldopen-v3/run.sh with LAYOUT=layout-final.json).
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$H/../../../.." && pwd)"; FX="$R/tools/podcast-edit/sfx"
V=$1; OUT=$(cd "$(dirname "$2")" && pwd)/$(basename "$2"); : "${SOURCE:?}" "${WORK:?}"
case $V in a|c) BPM=120 ;; b) BPM=128 ;; *) echo "variant a|b|c"; exit 1 ;; esac
cd "$WORK"; mkdir -p v4; B=$(echo "60/$BPM" | bc -l); TT=$(printf "%.3f" $(echo "12*$B" | bc -l))
BTN=$( [ $V = b ] && echo 86 || echo 81 )                       # button hit, in beats
TB=$(printf "%.3f" $(echo "$BTN*$B" | bc -l)); END=$(printf "%.3f" $(echo "$TB+1.4" | bc -l))
MD=$(ffprobe -v error -show_entries format=duration -of csv=p=0 v3.layout.mp4)

# 1. Host stills for the title (tile crops without Zoom's name labels) and the title frames.
if [ ! -s v4/kirk.png ]; then
  ffmpeg -v error -y -ss 1639.2 -i "$SOURCE" -frames:v 1 -vf "crop=600:338:660:0,scale=1920:1080:flags=lanczos" v4/nik.png
  ffmpeg -v error -y -ss 152.5 -i "$SOURCE" -frames:v 1 -vf "crop=600:338:660:360,scale=1920:1080:flags=lanczos" v4/michael.png
  ffmpeg -v error -y -ss 152.5 -i "$SOURCE" -frames:v 1 -vf "crop=600:338:20:0,scale=1920:1080:flags=lanczos" v4/kirk.png
fi
TD=v4/title-$BPM$( [ $V = c ] && echo fx || true ); [ -s $TD/0000.png ] || bun "$H/title.ts" $TD $BPM v4/nik.png v4/michael.png v4/kirk.png $( [ $V = c ] && echo --fx || true )
bun "$R/tools/podcast-edit/brand/music/arrange.ts" "$H/music/v4$V.json" v4/music-$V.wav

# 2. Montage with punch-ins: "w" keeps the wide layout shot (v3.layout.mp4); n/m/k cuts to that host's
# own Zoom tile (v3.src.mov, same timeline, 1280x720 gallery), cropped clear of Zoom's name label and
# scaled to full frame. Segments in montage seconds: start end shot.
SEG=("0 2.30 w" "2.30 4.40 n" "4.40 7.56 m" "7.56 9.55 w" "9.55 10.24 k" "10.24 14.30 w" "14.30 15.32 k"
     "15.32 19.64 w" "19.64 21.72 m" "21.72 23.55 k" "23.55 25.48 w" "25.48 28.84 n" "28.84 31.44 m" "31.44 $MD n")
fc=""; cat=""; i=0
for s in "${SEG[@]}"; do set -- $s; a=$1; b=$2; who=$3
  if [ $who = w ]; then fc+="[0:v]trim=$a:$b,setpts=PTS-STARTPTS,setsar=1[s$i];"
  else
    case $who in n) xy="660:0" ;; m) xy="660:360" ;; k) xy="20:0" ;; esac
    sx="48"; sy="27"; [ $V = c ] && sx="48+26*exp(-t*9)*sin(t*70)" && sy="27+18*exp(-t*9)*cos(t*61)"
    fc+="[1:v]trim=$a:$b,setpts=PTS-STARTPTS,crop=600:338:$xy,scale=2016:1134:flags=lanczos,crop=1920:1080:'$sx':'$sy',unsharp=5:5:0.5,setsar=1[s$i];"
  fi
  cat+="[s$i]"; i=$((i+1))
done
fc+="${cat}concat=n=$i:v=1:a=0[mv]"
ffmpeg -v error -y -i v3.layout.mp4 -i v3.src.mov -filter_complex "$fc" -map "[mv]" -c:v libx264 -threads 4 -crf 16 -preset fast -pix_fmt yuv420p -r 25 v4/montage-$V.mov

# 3. Compose: title + montage (+ NOTIFY strip, as in cold-open-final) + held last frame; voices, music, SFX.
T0=$(echo "$TT+16.55" | bc); T1=$(echo "$TT+19.64" | bc); ME=$(echo "$TT+$MD" | bc)
in=(-framerate 25 -i $TD/%04d.png -i v4/montage-$V.mov -i v3.layout.mp4 -framerate 25 -i m-notify/l0_%02d.png -i v4/music-$V.wav)
vf="[0:v]setsar=1,format=yuv420p[t];[1:v]format=yuv420p[m];[t][m]concat=n=2:v=1:a=0,tpad=stop_mode=clone:stop_duration=3[c0]"
vf+=";[3:v]tpad=stop_mode=clone:stop_duration=60,setpts=PTS-STARTPTS+$T0/TB[st];[c0][st]overlay=enable='between(t,$T0,$T1)':eof_action=pass[c1]"
last=c1
if [ $V = c ]; then   # flash frame + RGB split at every cut and punch-in
  cuts="$TT"; for s in "${SEG[@]:1}"; do set -- $s; cuts+=" $(echo "$TT+$1" | bc)"; done
  fl=""; rg=""; for c in $cuts; do fl+="+between(t,$c,$c+0.04)"; rg+="+between(t,$c,$c+0.12)"; done
  vf+=";[c1]eq=brightness=0.35:enable='0${fl}',rgbashift=rh=-14:bh=14:enable='0${rg}'[c2]"; last=c2
fi
fo=$(printf "%.3f" $(echo "$END-0.6" | bc))
vf+=";[$last]trim=0:$END,fade=t=in:st=0:d=0.2,fade=t=out:st=$fo:d=0.6,format=yuv420p[vo]"

# SFX: name beat gain(dB) [trim s]. Title cues are in beats; typing is trimmed to the typing time.
SFX=("U2-typing-fast 0 -8 $(printf "%.3f" $(echo "0.9*$B" | bc -l))" "K-sand-stroke-falling 1 -4" "L-punch-rough 2 -2" "U2-typing-fast 2.5 -10 $(printf "%.3f" $(echo "0.66*$B" | bc -l))"
     "L-punch-rough 3.5 -2" "U2-typing-fast 4 -10 $(printf "%.3f" $(echo "0.66*$B" | bc -l))" "L-punch-rough 5 -2" "U2-typing-fast 5.5 -10 $(printf "%.3f" $(echo "0.66*$B" | bc -l))"
     "K-sand-stroke-falling 6.5 -4" "G10-soft-start-quick-stop 8 -2" "K-sand-stroke-falling 8.3 -5" "G9-wider-band 11.8 -4")
if [ $V = c ]; then for s in "${SEG[@]:1}"; do set -- $s; [ "$3" != w ] && SFX+=("L-punch-rough $(echo "($TT+$1)/$B" | bc -l) -9"); done; fi
af="[2:a]aresample=48000,adelay=$(printf "%.0f" $(echo "$TT*1000" | bc))|$(printf "%.0f" $(echo "$TT*1000" | bc)),apad[voice]"
# music: MG dB in the title and the button (level with the voices), 14 dB lower under the voices
MG=-7
af+=";[4:a]aresample=48000,volume='if(lt(t,$TT-0.15),1,if(lt(t,$TT+0.1),1-0.8*(t-$TT+0.15)/0.25,if(lt(t,$TB-0.05),0.2,1)))':eval=frame,volume=${MG}dB[mus]"
mix="[voice][mus]"; k=5
for s in "${SFX[@]}"; do set -- $s; ms=$(printf "%.0f" $(echo "$2*$B*1000" | bc -l)); tr=""; [ -n "${4:-}" ] && tr=",atrim=0:$4,afade=t=out:st=$(printf "%.3f" $(echo "$4-0.05" | bc -l)):d=0.05"
  in+=(-i "$FX/$1.wav"); af+=";[$k:a]aresample=48000,aformat=channel_layouts=stereo$tr,volume=$(($3+MG))dB,adelay=$ms|$ms[x$k]"; mix+="[x$k]"; k=$((k+1)); done
af+=";${mix}amix=inputs=$((k-3)):normalize=0:duration=longest,atrim=0:$END,afade=t=out:st=$fo:d=0.6[ao]"
ffmpeg -v error -y "${in[@]}" -filter_complex "$vf;$af" -map "[vo]" -map "[ao]" -c:v libx264 -threads 4 -profile:v high -r 25 -crf 19 -preset medium -c:a pcm_s16le "$OUT.raw.mov"
I=$(ffmpeg -i "$OUT.raw.mov" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}'); g=$(echo "-16 - ($I)" | bc -l)
ffmpeg -v error -y -i "$OUT.raw.mov" -c:v copy -af "volume=${g}dB,alimiter=limit=0.75:level=false" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"; rm -f "$OUT.raw.mov"
echo "$OUT $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s, title $TT s, button $TB s, gain $g dB"
