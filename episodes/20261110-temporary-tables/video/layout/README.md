# Episode 196 layout

Same look as episode 195 (`26-layout-wide.json`: shades theme, whole Zoom frame per host, robot tile small at the bottom right), for two hosts.

- `21-layout.json`: Kirk Wolak and Nik Samokhvalov, 928x522 each at y 210 (x 24 and 968). Robot 240x135 at (1656, 880). Center cards: the hosts move to a column on the right, 256 px wide at x 1640, y 120 and 360 (the first two ep195 positions). `logo` = `21-outro-prepared-v1.mp4` (from `../outro/`). No face track: the whole frame is shown and Nik stays in it.
- `tiles-manual.json`: the 2x2 Zoom gallery (1280x720 source, tiles touch). The bottom-right tile is the Circleback.ai note-taker: it is not listed, so it is never shown. The gallery is stable from 0 to 2354.48 s; the edit ends at 2354.0 s source (`check-gallery.py` finds changes per second, then per frame).
- `qa-layout-center.json`: the same with a forced center window at 1195-1210 s, for the QA still.

Tools: `$R/tools` = the episode 195 rebuild (see `../../../20261104-extensions-on-demand/video/README.md`, "Tools"), then `patch -p1 < ../tools/brand.patch` (BRAND -> episode 194 `video/brand-public`).

Outro: `../card/outro/` (Remotion; needs `public/` from episode 195 `card/outro/public`: fonts, `plate.png`, `logo-v1.mp4`; not in git). `logo` in `21-layout.json` = `21-outro-v2.mp4`.

- `OutroForge3` (`21-outro-v3.mp4`, to be spliced into the final): v2 with frame 1 simplified after host feedback ("too overloaded"): only "In this episode:", "DBLab Forge experiment" and "All links are in the description below". Same timing, cut and frame 2.
- `OutroForge` (`21-outro-v2.mp4`, superseded): the episode 195 `Outro3` structure and timing, 22.72 s. Frame 1 (0-13.76 s) "In this episode:" + DBLab Forge experiment, "Temp tables vs. 5,000 idle sessions", 502 -> 127 tx/s (public brief V6.1, Table C, PG18), and the public brief URL on two lines; a cut on beat 26; frame 2 "Prepared by:" + the Postgres.AI v1 wordmark animation (from its frame 8, as in ep 195).
- `OutroPrepared` (`21-outro-prepared-v1.mp4`, first draft): frame 2 only, for the whole length.

```bash
cd "$R/card/outro" && npx remotion render src/index.ts OutroForge3 out/outro-v3.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p
cp out/outro-v3.mp4 "$R/21-outro-v3.mp4"
```
