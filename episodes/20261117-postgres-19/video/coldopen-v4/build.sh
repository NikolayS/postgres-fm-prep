#!/usr/bin/env bash
# Episode 197 cold open v5: an opening on the music (intro.json, intro.ts: "Starring..." name cards on
# each host's own video), then a four-bite montage (cold-open-final layout) with snap punch-ins on the
# speaker, music ducked under the voices, and a one-hit button at the end. See style-notes.md.
#   a: with the announcer (vo.sh); Throwback Funk, 120 BPM.
#   b: the same opening without the announcer; Electro House, 128 BPM. This is v6, the cold open of
#      the final episode (Nik: no voice; Nik, Michael and Kirk are three equal co-hosts).
#   c: as a, plus risers, a flash frame and RGB split on every montage cut and punch-in, an impact
#      shake and a punch on every punch-in. The opening keeps calm name cards (no flash on the names).
# Usage: SOURCE=<Zoom video1398514958.mp4> WORK=<media dir> bash build.sh a|b|c <out.mp4>
# WORK holds the cold-open-final intermediates (coldopen-v3/run.sh with LAYOUT=layout-final.json:
# v3.src.mov, v3.layout.mp4) and, for a and c, the announcer lines in v4/vo (vo.sh; rerun it after
# changing the vo text in intro.json).
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$H/../../../.." && pwd)"; FX="$R/tools/podcast-edit/sfx"
V=$1; OUT=$(cd "$(dirname "$2")" && pwd)/$(basename "$2"); : "${SOURCE:?}" "${WORK:?}"
case $V in a|c) BPM=120; VO=1; BTN=75 ;; b) BPM=128; VO=0; BTN=80 ;; *) echo "variant a|b|c"; exit 1 ;; esac
cd "$WORK"; mkdir -p v4; B=$(echo "60/$BPM" | bc -l); f3() { printf "%.3f" "$(echo "$1" | bc -l)"; }
MD=$(ffprobe -v error -show_entries format=duration -of csv=p=0 v3.layout.mp4)

# 1. Opening: intro.ts frames over 2.8 s of each host's own Zoom tile (cropped clear of Zoom's label).
for p in "nik 1638.9 660:0" "michael 151.0 660:360" "kirk 151.0 20:0"; do set -- $p
  [ -s v4/seq/$1/0001.png ] || { mkdir -p v4/seq/$1; ffmpeg -nostdin -v error -y -ss $2 -t 2.8 -i "$SOURCE" -vf "fps=25,crop=600:338:$3,scale=1920:1080:flags=lanczos" v4/seq/$1/%04d.png; }
done
TD=v4/intro; { [ $TD/0000.png -nt "$H/intro.ts" ] && [ $TD/0000.png -nt "$H/intro.json" ]; } || bun "$H/intro.ts" $TD v4/seq
TT=$(bun -e 'console.log((await Bun.file(process.argv[1]).json()).end)' "$H/intro.json")
TB=$(f3 "$BTN*$B"); END=$(f3 "$TB+1.4")               # button hit (beats -> s) and clip end
bun "$R/tools/podcast-edit/brand/music/arrange.ts" "$H/music/v5$V.json" v4/music-$V.wav

# 2. Montage, the four strongest bites: Michael's "GTA 19" line (it follows "Tonight: Postgres 19"),
# Kirk's revert fest, years/decades, and the DDL closer. "w" keeps the wide layout shot
# (v3.layout.mp4); n/m/k cuts to that host's own Zoom tile (v3.src.mov, same timeline) at full frame.
# Segments in v3 montage seconds: start end shot.
SEG=("4.40 5.60 w" "5.60 7.56 m" "7.56 9.55 w" "9.55 10.24 k"
     "19.64 21.72 m" "21.72 23.55 k" "23.55 25.48 w" "25.48 28.84 n" "28.84 31.44 m" "31.44 $MD n")
fc=""; cat=""; i=0; at=0; CUTS=(); PUNCH=()
for s in "${SEG[@]}"; do set -- $s; a=$1; b=$2; who=$3
  if [ $who = w ]; then fc+="[0:v]trim=$a:$b,setpts=PTS-STARTPTS,setsar=1[s$i];"
  else
    case $who in n) xy="660:0" ;; m) xy="660:360" ;; k) xy="20:0" ;; esac
    sx="48"; sy="27"; if [ $V = c ]; then sx="48+26*exp(-t*9)*sin(t*70)"; sy="27+18*exp(-t*9)*cos(t*61)"; fi
    fc+="[1:v]trim=$a:$b,setpts=PTS-STARTPTS,crop=600:338:$xy,scale=2016:1134:flags=lanczos,crop=1920:1080:'$sx':'$sy',unsharp=5:5:0.5,setsar=1[s$i];"
    PUNCH+=("$(f3 "$TT+$at")")
  fi
  fc+="[0:a]atrim=$a:$b,asetpts=PTS-STARTPTS[a$i];"; cat+="[s$i][a$i]"
  CUTS+=("$(f3 "$TT+$at")"); at=$(f3 "$at+$b-$a"); i=$((i+1))
done
fc+="${cat}concat=n=$i:v=1:a=1[mv][ma]"
ffmpeg -nostdin -v error -y -i v3.layout.mp4 -i v3.src.mov -filter_complex "$fc" -map "[mv]" -map "[ma]" -c:v libx264 -threads 4 -crf 16 -preset fast -pix_fmt yuv420p -r 25 -c:a pcm_s16le v4/montage-$V.mov

# 3. Compose: opening + montage + held last frame.
in=(-framerate 25 -i $TD/%04d.png -i v4/montage-$V.mov -i v4/music-$V.wav)
vf="[0:v]setsar=1,format=yuv420p[t];[1:v]format=yuv420p[m];[t][m]concat=n=2:v=1:a=0,tpad=stop_mode=clone:stop_duration=3[c0]"
last=c0
if [ $V = c ]; then   # flash frame + RGB split at every montage cut and punch-in
  fl=""; rg=""; for c in "${CUTS[@]}"; do fl+="+between(t,$c,$c+0.04)"; rg+="+between(t,$c,$c+0.12)"; done
  vf+=";[$last]eq=brightness=0.35:enable='0${fl}',rgbashift=rh=-14:bh=14:enable='0${rg}'[c2]"; last=c2
fi
fo=$(f3 "$END-0.6")
vf+=";[$last]trim=0:$END,fade=t=in:st=0:d=0.2,fade=t=out:st=$fo:d=0.6,format=yuv420p[vo]"

# Audio: voices (montage), announcer, music, SFX. SFX: name seconds gain(dB) [trim s], on the intro shots.
SFX=("U2-typing-fast 0.3 -12 1.6" "K-sand-stroke-falling 0.2 -6" "G10-soft-start-quick-stop 2.3 -4" "L-punch-rough 4.35 -4"
     "K-sand-stroke-falling 5.25 -8" "K-sand-stroke-falling 7.95 -8" "K-sand-stroke-falling 10.65 -8"
     "G10-soft-start-quick-stop 13.35 -4" "K-sand-stroke-falling 13.6 -6" "G9-wider-band $(f3 "$TT-0.1") -6")
if [ $V = c ]; then for p in "${PUNCH[@]}"; do SFX+=("L-punch-rough $p -9"); done; fi
MI=$( [ $VO = 1 ] && echo 0.55 || echo 1 )   # music level in the opening (lower under the announcer)
d=$(printf "%.0f" "$(echo "$TT*1000" | bc)")
af="[1:a]aresample=48000,adelay=$d|$d,apad[voice]"
# music: MG dB overall; MI in the opening, 0.2 (-14 dB) under the voices, full for the button
MG=-7
af+=";[2:a]aresample=48000,volume='if(lt(t,$TT-0.15),$MI,if(lt(t,$TT+0.1),$MI-($MI-0.2)*(t-$TT+0.15)/0.25,if(lt(t,$TB-0.05),0.2,1)))':eval=frame,volume=${MG}dB[mus]"
mix="[voice][mus]"; k=3
if [ $VO = 1 ]; then   # announcer lines at their intro.json times, +4 dB
  while read -r n t; do ms=$(printf "%.0f" "$(echo "$t*1000" | bc -l)")
    in+=(-i v4/vo/vo-$n.mp3); af+=";[$k:a]aresample=48000,aformat=channel_layouts=stereo,volume=4dB,adelay=$ms|$ms[x$k]"; mix+="[x$k]"; k=$((k+1))
  done < <(bun -e 'for (const v of (await Bun.file(process.argv[1]).json()).vo) console.log(v.line, v.at)' "$H/intro.json")
fi
for s in "${SFX[@]}"; do set -- $s; ms=$(printf "%.0f" "$(echo "$2*1000" | bc -l)"); tr=""; if [ -n "${4:-}" ]; then tr=",atrim=0:$4,afade=t=out:st=$(f3 "$4-0.05"):d=0.05"; fi
  in+=(-i "$FX/$1.wav"); af+=";[$k:a]aresample=48000,aformat=channel_layouts=stereo$tr,volume=$(($3+MG))dB,adelay=$ms|$ms[x$k]"; mix+="[x$k]"; k=$((k+1)); done
n=$(echo "$mix" | grep -o '\[' | wc -l | tr -d ' ')
af+=";${mix}amix=inputs=$n:normalize=0:duration=longest,atrim=0:$END,afade=t=out:st=$fo:d=0.6[ao]"
ffmpeg -nostdin -v error -y "${in[@]}" -filter_complex "$vf;$af" -map "[vo]" -map "[ao]" -c:v libx264 -threads 4 -profile:v high -r 25 -crf 19 -preset medium -c:a pcm_s16le "$OUT.raw.mov"
I=$(ffmpeg -nostdin -i "$OUT.raw.mov" -af ebur128 -f null - 2>&1 | grep "I:" | tail -1 | awk '{print $2}'); g=$(echo "-16 - ($I)" | bc -l)
ffmpeg -nostdin -v error -y -i "$OUT.raw.mov" -c:v copy -af "volume=${g}dB,alimiter=limit=0.75:level=false" -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"; rm -f "$OUT.raw.mov"
echo "$OUT $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT") s, opening $TT s, montage $at s, button $TB s, gain $g dB"
