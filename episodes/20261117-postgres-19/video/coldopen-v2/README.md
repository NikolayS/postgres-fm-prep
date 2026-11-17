# Episode 197 cold opens, v2 (preview)

Three cold-open candidates for Nik's pick. The v1 drafts (notes/cold-open.md, options A and B) were rejected: they showed the raw gallery, were boring, and had no hook.

Look: the same as episode 195's published layout (`episodes/20261104-extensions-on-demand/video/layout/26-layout-wide.json`). That is the shades theme, with Kirk, Nik and Michael in a row at 608x342 and the robot small at the bottom right. `layout.json` here has the same tile rects and places as the episode draft layout. It has no `cuts`, because the clips are cut from the source, so source time maps straight through.

Hooks: the transcript gave 8 candidates. A blind review of the text ranked them by curiosity, tension and standalone clarity, and these are the top 3.

## Clips

Times are source seconds in the Zoom recording (`video1398514958.mp4`), from Scribe word times. Each piece is a hard cut with 30-40 ms edge fades.

| Clip | Duration | Pieces (source s) | Quote | Strips (clip s) |
|---|---|---|---|---|
| v2-1 | 10.4 s | 2746.56-2748.40, 2749.04-2750.97, 2751.50-2752.40, 2773.15-2776.30, 2776.70-2779.22 | Michael: "Some parameters that are no longer in Postgres, if you specify them, it won't start." Nik: "And pg_upgrade check will report success, and then... cannot start after upgrade." | 5.12 "pg_upgrade --check: passes"; 8.94 "Then the server won't start" |
| v2-2 | 13.8 s | 337.25-340.90, 342.10-347.40, 350.90-352.66, 352.88-355.85 | Nik: "When I was reporting some bugs found with AI, of course, I felt like if I keep pushing, I can do more damage, and more things will be reverted. At least two threads where I started pushing led to revert." | 6.19 "I can do more damage" (quote) |
| v2-3 | 9.7 s | 3002.85-3003.85, 3004.20-3006.05, 3006.70-3009.55, 3010.15-3012.05, 3012.45-3014.45 | Nik: "My recommendation usually was wait until .1, .2 version, but now I think the better recommendation is don't wait. Start testing earlier." | 2.09 "Old rule: wait for x.1 or x.2"; 6.98 "Now: don't wait, start testing" |

What the cuts drop:
- v2-1: a 0.9 s pause, the repeated "won't", and "you just". Kirk's "Yeah" stays.
- v2-2: Michael's "Mm-hmm", "I just felt that. Like, for example", and a restart.
- v2-3: "like", "uh", and the doubled "start".

Not checked: the v2-1 strip repeats Nik's on-air claim about `pg_upgrade --check`.

## Rebuild

```bash
SOURCE=<Zoom folder>/video1398514958.mp4
T=<patched tools dir: layout.ts with the shades theme, see episodes/20261104-extensions-on-demand/video/README.md, "Tools">
SOURCE=$SOURCE ./cut.sh c1.src.mov "2746.56 2748.40" "2749.04 2750.97" "2751.50 2752.40" "2773.15 2776.30" "2776.70 2779.22"
bun $T/layout.ts layout.json c1.src.mov c1.layout.mp4 --preset fast
bun marker.ts m1 311 "pg_upgrade --check: passes" "Then the server won't start"
./finish.sh c1.layout.mp4 m1 cold-open-v2-1.mp4 5.12 8.94
# v2-2: marker seed 527, one line at 6.19; v2-3: seed 733, lines at 2.09 and 6.98 (cuts in the table)
```

- `cut.sh`: cuts the pieces from `$SOURCE` and joins them.
- `marker.ts`: draws the yellow Marker strips as PNG frames with headless Chrome. They have the same look as `Marker` in `tools/podcast-edit/overlays/src/Band.tsx`: a 0.5 s swipe, Lato 700 at 46 px, in the band at x 24.
- `finish.sh`: puts the strips on the video with a K sand stroke (`tools/podcast-edit/sfx`) at -14 dB under each line. It fades in for 0.3 s and out for 0.5 s, sets loudness to -16 LUFS, and adds a limiter (as in episode 196's `montage.sh`).
- The media (sources, layout renders, the finished MP4s in `../../preview/`) is not in git.
