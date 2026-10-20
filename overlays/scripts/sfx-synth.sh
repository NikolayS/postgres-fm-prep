#!/usr/bin/env bash
# Synthesize the three overlay SFX with ffmpeg (no third-party samples). Output: sfx/*.wav, 48 kHz.
set -euo pipefail
mkdir -p sfx
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "anoisesrc=color=pink:r=48000:a=0.5:d=0.45" -af "bandpass=f=900:width_type=o:w=2,afade=t=in:st=0:d=0.12:curve=qsin,afade=t=out:st=0.2:d=0.25,alimiter=limit=0.7:level=false,volume=1.5" sfx/whoosh.wav
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "sine=frequency=520:r=48000:d=0.16" -af "aeval='val(0)*(1-0.5*t/0.16)':c=same,afade=t=in:st=0:d=0.004,afade=t=out:st=0.03:d=0.13,volume=0.9" sfx/pop.wav
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "anoisesrc=color=white:r=48000:a=1:d=0.03" -af "highpass=f=2500,afade=t=out:st=0.004:d=0.026,volume=0.7" sfx/tick.wav
cp "$(dirname "$0")/SFX-LICENSE.txt" sfx/LICENSE.txt
echo "sfx: whoosh 0.45 s, pop 0.16 s, tick 0.03 s"
