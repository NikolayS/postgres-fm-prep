# Rules for agents in this repository

## Video: on-screen text goes under the heads

Every on-screen text in a postgres.fm video (strips, quotes, note cards, lower thirds, in the cold open and in the main episode) sits right under the row of head tiles and their name labels, never at the very bottom of the frame. YouTube subtitles cover the bottom. In the ep195 wide layout (tiles y 300-642, labels to y 714) the text band is y 724-864; for another layout, start at tile bottom + 72 + 10. Toolkit default: `BAND` in `tools/podcast-edit/overlays/src/Band.tsx`.

Full-screen cards too: keep all text, chips and screenshots out of the bottom 180 px of the frame (everything ends by y 900). `HackingInsert`, `NumberPop` and `ShotCard` follow this. (Nik, asked more than once; restated 2026-11-17, episode 197.)

QA every strip with zoomed frame crops during and after its swipe: no clipped glyphs (descenders, commas), no cut or offset band. A strip drawn with headless Chrome near the bottom of a 1080 px page got clipped by the viewport (episode 197 NOTIFY strip).
