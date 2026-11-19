# Social reel (Remotion)

A 1080x1350 kinetic reel: an intro, feature scenes of 3 s each and an end
card. It was first made for the Postgres 19 release post (episode 197).

- Scenes are in `src/scenes.tsx`. The timeline, the wipes and the top
  progress bar are in `src/Reel.tsx`. The shared design kit (colors,
  kinetic headline, typed SQL) is in `src/kit.tsx`.
- Fonts: copy Impact.ttf (macOS Supplemental), Inter and JetBrains Mono
  (`../overlays/public/fonts`) into `public/fonts/`.
- Render: `bun install`, then
  `bunx remotion render src/index.ts Reel out/silent.mp4 --codec=h264 --crf=16`.
- Sound: `bun mix.ts out/silent.mp4 out/reel.mp4` adds hits from `../sfx`
  (licences in its README) and normalizes the mix to -16 LUFS.
- QA: `./check.sh out/reel.mp4 check.png` makes a strip of frame 0 and
  the middle of each scene, with a red line at the 180 px bottom limit.
  The text stays out of the bottom 180 px.
