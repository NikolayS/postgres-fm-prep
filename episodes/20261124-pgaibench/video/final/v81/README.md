# v8.1 = v8-lite + the Track 1 two-axis overlay (2026-11-27)

Viewer feedback: at 19:46 Nik says "So we started drawing on two axis, and you see the graphs right now", and v8-lite showed nothing.

- Overlay: `v2-r13b14a-axes-track1-v7.mov` (built for v7: safety and usefulness axes, "the goal", then Track 1 Figure 1, models acting alone, 949 live runs). The blog's `fig-track1` SVG is the same Track 1 bar chart; there is no published Track 1 two-axis plot (the `pareto` figure and pgaibench.dev/control are Auditor results).
- Placement: center, edited 1143.76 (final 19:46.20) for 28.46 s, entry sound center-in only (v8-lite sound policy). `../../overlays/manifest-v81-sfx.json`.
- Video: `OUT=final/v81/w81.mp4 bash render-v81.sh --from 1139.56 --until 1180.36` (in the review folder), then frames 0-29559 copied from v8-lite, frames 29560-30559 from w81 (`-ss 0.4`, re-encoded, keyframe to keyframe), the rest copied. 79,544 frames, as v8-lite.
- Audio: v8-lite audio plus the entry sound only: w81 audio minus the v8-lite window w09 audio (same span, r 0.9996) at w81 4.1-4.8 s, scaled by 0.872 (final vs compose speech level), placed by correlation at final 1182.022 + 4.1 s; one AAC 192k encode. Sync vs v8-lite: 0 samples at 5, 25 and 50 min.
- Checks: joins PSNR 49-52 dB against v8-lite; `qa.ts --config qa-v81.json --only sfx,strips,length,eyes,facing` PASS (audio check not re-run: voices and music unchanged). Timeline identical, so subtitles 63 stay valid.

## v8.1b: key overlays held through the explanation (2026-11-27)

Nik: keep a key illustration up while it is explained, until the topic changes. Each overlay keeps its own animation; the frame just before the 7-frame exit fade repeats until the new end (`hold.sh`, list in `plan.txt`: id, file, old dur, new dur). Manifest: `../../overlays/manifest-v81b-sfx.json`.

| Overlay | Old end | New end | Last sentence covered |
| --- | --- | --- | --- |
| r06-scenarios | 11:47.0 | 12:28.8 | "I'll bring the one I overlooked." |
| v2-r07b-l9-split | 12:56.3 | 13:58.4 | "...many layers to risk assessment, we need to properly establish here, right?" |
| v2-r11-maxlocks | 18:00.8 | 18:02.2 | "So Fable failed there fully." |
| v2-t1-scatter-v81b (replaces axes + bars) | 20:14.7 | 20:29.8 | "...what happens if you just let AI work with production." |
| r15-funnel | 20:38.3 | 20:41.9 | "It's being overly cautious." (entry sound removed: follows Track 1 within 0.5 s) |
| r22a-aaa-intro | 32:54.5 | 34:13.5 | "...designed in form of scripts, deterministically." (until the Jev band) |
| r24-editor-note | 37:14.9 | 37:29.7 | "...also have access to data, that's great, right?" |
| r28a-dots | 43:05.1 | 43:22.6 | "...13 harms down to one ... by structuring this a little better." |

Build: `run-windows.sh` renders six windows (`windows.txt`: id, first frame, end frame, cut offset; three windows needed 0.44 s, one frame later than 0.4, to line up), `splice-b.sh` joins them into the v8.1 picture at keyframes, `mix81b.py` removes r15's entry sound from the v8.1 audio. Frames 79,544 and length 3181.81 s unchanged, so subtitles stay valid. Checks: frame-exact against v8.1 outside the windows (PSNR 48-49 dB at all 12 joins, 0-sample audio offset); `qa.ts --config qa-v81b.json --only sfx,strips,length,eyes,facing` PASS.

### Track 1 scatter (replaces axes + bars)

The 19:46.2 overlay is now a two-axis scatter: x is usefulness (Correct adj / N), y is safety (Scored w/o harm, linear axis from 90 to 100%), with one labelled dot per model and a "the goal" box. The axes draw first, then the dots land at 19:48.3 ("you see the graphs right now"), then the goal box appears at 19:49.6. It holds until 20:29.8 and has no arrowheads, so the old play-icon flash is gone. Component:  (composition , props ). Data: . Window 3 re-rendered and spliced with ; audio unchanged (same entry sound). QA PASS again.
