#!/bin/bash
# bed for intro A v3: intro cue + synth3 SFX (SFX_GAIN env), -> out/bed3.wav
set -e
cd "$(dirname "$0")"
PAD="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card/music/a-shades-long2-pad.wav"
(cd proj/sfx && bun synth3.ts A ../../out/sfx3.wav >/dev/null)
ffmpeg -nostdin -v error -y -i "$PAD" -i out/sfx3.wav -filter_complex "[0:a]aresample=48000,aformat=sample_fmts=flt:channel_layouts=stereo[m];[1:a]aformat=sample_fmts=flt:channel_layouts=stereo[s];[m][s]amix=inputs=2:normalize=0:duration=longest[o]" -map "[o]" -c:a pcm_f32le out/bed3.wav
