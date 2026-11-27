# v8.1 = v8-lite + the Track 1 two-axis overlay (2026-11-27)

Viewer feedback: at 19:46 Nik says "So we started drawing on two axis, and you see the graphs right now", and v8-lite showed nothing.

- Overlay: `v2-r13b14a-axes-track1-v7.mov` (built for v7: safety and usefulness axes, "the goal", then Track 1 Figure 1, models acting alone, 949 live runs). The blog's `fig-track1` SVG is the same Track 1 bar chart; there is no published Track 1 two-axis plot (the `pareto` figure and pgaibench.dev/control are Auditor results).
- Placement: center, edited 1143.76 (final 19:46.20) for 28.46 s, entry sound center-in only (v8-lite sound policy). `../../overlays/manifest-v81-sfx.json`.
- Video: `OUT=final/v81/w81.mp4 bash render-v81.sh --from 1139.56 --until 1180.36` (in the review folder), then frames 0-29559 copied from v8-lite, frames 29560-30559 from w81 (`-ss 0.4`, re-encoded, keyframe to keyframe), the rest copied. 79,544 frames, as v8-lite.
- Audio: v8-lite audio plus the entry sound only: w81 audio minus the v8-lite window w09 audio (same span, r 0.9996) at w81 4.1-4.8 s, scaled by 0.872 (final vs compose speech level), placed by correlation at final 1182.022 + 4.1 s; one AAC 192k encode. Sync vs v8-lite: 0 samples at 5, 25 and 50 min.
- Checks: joins PSNR 49-52 dB against v8-lite; `qa.ts --config qa-v81.json --only sfx,strips,length,eyes,facing` PASS (audio check not re-run: voices and music unchanged). Timeline identical, so subtitles 63 stay valid.
