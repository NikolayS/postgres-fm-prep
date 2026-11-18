# Rules for agents in this repository

## Video: on-screen text goes under the heads

Every on-screen text in a postgres.fm video (strips, quotes, note cards, lower thirds, in the cold open and in the main episode) sits right under the row of head tiles and their name labels, never at the very bottom of the frame. YouTube subtitles cover the bottom. In the ep195 wide layout (tiles y 300-642, labels to y 714) the text band is y 724-864; for another layout, start at tile bottom + 72 + 10. Toolkit default: `BAND` in `tools/podcast-edit/overlays/src/Band.tsx`.

Full-screen cards too: keep all text, chips and screenshots out of the bottom 180 px of the frame (everything ends by y 900). `HackingInsert`, `NumberPop` and `ShotCard` follow this. (Nik, asked more than once; restated 2026-11-17, episode 197.)

QA every strip with zoomed frame crops during and after its swipe: no clipped glyphs (descenders, commas), no cut or offset band. A strip drawn with headless Chrome near the bottom of a 1080 px page got clipped by the viewport (episode 197 NOTIFY strip).

## Video: faces stay clean

- No drawn annotations on people: no circles, ellipses or arrows on faces or heads, in titles, name cards or the montage. (Nik, episode 197: "bad idea, just drop it".)
- Captions never cover a face or mouth. In full-frame punch-ins, run face detection over the caption's whole duration (OpenCV/MediaPipe, or `episodes/20261117-postgres-19/video/coldopen-v8/faces.swift` with Apple Vision) and place the caption where it misses every face box, grown for hair and beard: beside the face, in an empty area, or at the top. Still never in the bottom 180 px. If no area is free, reframe the punch-in (zoom out or shift it) to make room. Check every caption frame automatically (face boxes on the rendered frames vs the caption boxes) and visually. Example: `episodes/20261117-postgres-19/video/coldopen-v8/check-caps.ts`.
- Split screens and multi-panel shots: centre each face in its panel with face detection. Same face scale in every panel (same eye distance), eyes on one horizontal line, the full head with headroom, nothing cut by a panel edge (straight or slanted).
