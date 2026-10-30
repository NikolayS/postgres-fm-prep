#!/usr/bin/env bash
# Synthesize the overlay SFX with ffmpeg (no third-party samples). Output: sfx/*.wav, 48 kHz.
# Low-frequency, soft family (2026-10-20 feedback: no bright clicks):
#   wind1/wind2  airy swell, pink noise lowpass 1.5 / 1.0 kHz, 0.45 s, soft attack   (full-screen in/out)
#   air          short puff, 0.25 s, lowpass 1.2 kHz                                  (strips, chips)
#   thud1/2/3    sub hit 80->55 Hz with a short body, lowpass 800 Hz, 0.3 s           (a number or fact lands)
set -euo pipefail
mkdir -p sfx
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "anoisesrc=color=pink:r=48000:a=0.6:d=0.45:seed=1" -af "lowpass=f=1500,afade=t=in:st=0:d=0.15:curve=qsin,afade=t=out:st=0.2:d=0.25,alimiter=limit=0.6:level=false,volume=1.6" sfx/wind1.wav
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "anoisesrc=color=pink:r=48000:a=0.6:d=0.5:seed=7" -af "lowpass=f=1000,afade=t=in:st=0:d=0.18:curve=qsin,afade=t=out:st=0.22:d=0.28,alimiter=limit=0.6:level=false,volume=1.8" sfx/wind2.wav
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "anoisesrc=color=pink:r=48000:a=0.6:d=0.25:seed=3" -af "lowpass=f=1200,afade=t=in:st=0:d=0.06:curve=qsin,afade=t=out:st=0.1:d=0.15,alimiter=limit=0.5:level=false,volume=1.2" sfx/air.wav
thud() { ffmpeg -hide_banner -loglevel error -y -f lavfi -i "aevalsrc='0.95*sin(2*PI*($2+$3*exp(-t/$4))*t)*exp(-t/$5)':s=48000:d=0.3" -af "lowpass=f=800,afade=t=in:st=0:d=0.006,afade=t=out:st=0.2:d=0.1,alimiter=limit=0.8:level=false" "sfx/$1.wav"; }
thud thud1 55 30 0.05 0.09
thud thud2 60 25 0.06 0.11
thud thud3 50 35 0.045 0.08
cp "$(dirname "$0")/../sfx/LICENSE.txt" sfx/LICENSE.txt 2>/dev/null || true
echo "sfx: wind1 0.45 s, wind2 0.5 s, air 0.25 s, thud1-3 0.3 s"
