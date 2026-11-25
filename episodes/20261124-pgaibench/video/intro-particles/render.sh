#!/usr/bin/env bash
# Ep 198 particle intro (Nik 2026-11-25: "dissolved into particles and then reassembled").
# Runs inside a copy of the ep 198 card project (review/card: src/common.tsx, public/ fonts,
# photos, wordmark, elephant). Copy src/ and public/pi/ from here over it, then:
set -euo pipefail
# 1. card layers (one transparent PNG per element) for the landing states (A1, B1) and the
#    dissolving state (F) -> public/pi/<set>-N.png
for set in A1 B1 F; do
  npx remotion render src/index.ts CardLayers layers/$set --sequence --image-format=png --concurrency=1 --props="{\"set\":\"$set\"}"
  for i in 0 1 2 3 4 5 6 7 8; do cp layers/$set/element-0$i.png public/pi/$set-$i.png; done
done
# 2. exact raw RGBA inputs (co = cold open bold last frame; body = body frame at show t = 0.8 s)
for f in public/pi/*.png; do ffmpeg -v error -y -i $f -pix_fmt rgba -f rawvideo ${f%.png}.rgba; done
# 3. video (one render at a time)
npx remotion render src/index.ts IntroA out/intro-A-video.mp4 --image-format=png --codec=h264 --crf=14 --pixel-format=yuv420p --concurrency=4 --muted
npx remotion render src/index.ts IntroB out/intro-B-video.mp4 --image-format=png --codec=h264 --crf=14 --pixel-format=yuv420p --concurrency=4 --muted
# 4. sound design, mixed into the intro cue -> the --intro bed for compose.ts
PAD="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card/music/a-shades-long2-pad.wav"
for V in A B; do
  bun sfx/synth.ts $V out/sfx$V.wav
  ffmpeg -v error -y -i "$PAD" -i out/sfx$V.wav -filter_complex "[0:a]aresample=48000,aformat=sample_fmts=flt:channel_layouts=stereo[m];[1:a]aformat=sample_fmts=flt:channel_layouts=stereo[s];[m][s]amix=inputs=2:normalize=0:duration=longest[o]" -map "[o]" -c:a pcm_f32le out/intro-bed-$V.wav
done

# ---------- intro A v3 (2026-11-25: the full Card198 show + particles, louder hits) ----------
# 1. the show's layers at frame 63 and its full frames at 63 / 426 -> public/pi3/L-<group>.png, sw.png, ex.png
#    (co.png = last frame of for-nik/01-cold-open-bold.mp4, body.png = body frame), then raw RGBA
npx remotion render src/index.ts ShowLayers layers/v3 --sequence --image-format=png --concurrency=1
i=0; for g in bg arm logo title1 band kirk nik michael; do cp layers/v3/element-$i.png public/pi3/L-$g.png; i=$((i+1)); done
cp layers/v3/element-8.png public/pi3/sw.png; cp layers/v3/element-9.png public/pi3/ex.png
for f in public/pi3/*.png; do ffmpeg -v error -y -i $f -pix_fmt rgba -f rawvideo ${f%.png}.rgba; done
# 2. the plain show (for the FX colour samples), the samples, the intro
npx remotion render src/index.ts ShowPlain out/show-plain.mp4 --codec=h264 --crf=16 --concurrency=4 --muted
bun sample-fx.ts out/show-plain.mp4
npx remotion render src/index.ts IntroA3 out/intro-A3.mp4 --image-format=png --codec=h264 --crf=14 --pixel-format=yuv420p --concurrency=4 --muted
# 3. sound: SFX_GAIN=2.2 ./mkbed3.sh ; compose head: ./head3.sh (needs compose.ts --intro-lufs; --card 17.96)
