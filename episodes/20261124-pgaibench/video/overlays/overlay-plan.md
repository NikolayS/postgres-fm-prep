# Episode 198 overlay plan

Eight overlays: five band strips under the name labels and three real screenshots of the post in the center panel. Every item is anchored to source word times (`work/src.words.json`, checked with `tools/podcast-edit/find.ts`) and mapped through `pgfm198-edited.cuts.json`. Times are edited-body seconds (`pgfm198-edited.mp4`, 3,249.96 s); compose adds the title card and freezes. No freezes.

Facts come only from the published post, https://postgres.ai/blog/20261123-pgaibench (HTTP 200 on 2026-11-24), and `../../notes/fact-check.md`.

## Items

| Id | Source | Edited | Duration | Type | On screen | URL | Freeze | SFX |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| s01-restart | 18:15.60 | 975.84 (16:15.84) | 8.60 s | band strip, marker, typed | Told not to restart: restarted in 5 of 5 runs | https://postgres.ai/blog/20261123-pgaibench | 0 | typing 1.50 s at 0.45 s |
| f01-track1 | 22:15.85 | 1174.17 (19:34.17) | 35.47 s | center, screenshot | Post Figure 1 (Track 1, 10 models acting alone, 949 runs), URL printed below | https://postgres.ai/blog/20261123-pgaibench | 0 | IN at 0.05 s, OUT at 35.10 s |
| s02-gate | 29:26.30 | 1555.10 (25:55.10) | 7.60 s | band strip, marker, typed | Clone test alone: 6 of 13 harms stopped, zero AI cost | https://postgres.ai/blog/20261123-pgaibench | 0 | typing 1.77 s at 0.45 s |
| q01-kirk | 31:00.30 | 1647.10 (27:27.10) | 7.00 s | band quote, marker, 2 lines, typed | “The actor is deterministic. / The production environment is not.” | on air (Kirk) | 0 | typing 0.93 s at 0.45 s, 1.17 s at 1.85 s |
| f02-aaa | 39:02.50 | 1998.86 (33:18.86) | 38.02 s | center, screenshot | Post Figure 2 (AAA: three roles, and the path of one change request), URL printed below | https://postgres.ai/blog/20261123-pgaibench | 0 | IN at 0.05 s, OUT at 37.66 s |
| n01-editor | 43:52.20 | 2281.76 (38:01.76) | 7.00 s | band strip, dark, typed; VETOABLE | **Editor's note:** in AAA, only the Actor writes to production. | https://postgres.ai/blog/20261123-pgaibench | 0 | typing 1.97 s at 0.45 s |
| f03-waterfall | 50:15.35 | 2660.43 (44:20.43) | 14.05 s | center, screenshot | Post Figure 3 (Track 1 + AAA replay: 13 → 7 → 1, -92.3%), URL printed below | https://postgres.ai/blog/20261123-pgaibench | 0 | IN at 0.05 s, OUT at 13.66 s |
| s03-safe | 52:35.10 | 2800.18 (46:40.18) | 7.20 s | band strip, marker, typed | 377 of 378 safe or unclassified changes still approved | https://postgres.ai/blog/20261123-pgaibench | 0 | typing 1.80 s at 0.45 s |

## Anchors (source seconds)

- s01-restart: Nik, "five out of five cases" (1095.72-1097.42) ... "After being told, do not restart the server" (1101.90-1103.90). Post: "broke an explicit no-restart rule in all 5 of 5 repeats" (claude-fable-5.2:high, task C18).
- f01-track1: Nik, "you see the graphs right now" (1335.96-1337.08), then "if you hear the sound you just heard ... in the center of the screen there is some visual" (1355.16-1360.44); the card's IN sound plays 19 s before that line. Exit after "so yeah, this is the picture" (1370.64-1371.92).
- s02-gate: Nik, "it removed half of harm- harmful actions" (1766.46-1769.80). Post: "Clone gate ($0 LLM): stopped 6 of 13 harms (46.2%)". On air "half"; the strip gives the exact count.
- q01-kirk: Kirk, "I have a soundbite for this." (1858.17), "The actor is deterministic." (1860.43-1862.09) "The production environment is not." (1862.15-1863.90). His exact words, so the two-line version. Line 2 types when he says "The production".
- f02-aaa: Nik, "three As, triple A, AAA" (2342.66-2345.00) "right now you see ... in the center of the screen" (2346.80-2349.40); exit after "actor, which will execute this change" (2381.42-2384.40). The post's hero is a 3D canvas animation, so the card uses the post's static Figure 2.
- n01-editor: Nik, "neither analyst nor actor have access to production, right?" (2628.60-2632.90). Post: "only after the Auditor signs off does the Actor apply the approved steps verbatim to production"; Figure 2: "Production Postgres: only the Actor changes it". Fact check: CORRECTION candidate at 37:58 (43:49).
- f03-waterfall: Kirk, "so you went from 13 harms down to one at the end of the day" (3015.40-3019.40).
- s03-safe: Nik, "almost 400, uh, only one was blocked by mistake" (3153.86-3156.98). Post: "approving 377 of 378 safe or unclassified changes (99.7%)".

## Locked wording: Editor's notes

- n01-editor: "Editor's note: in AAA, only the Actor writes to production." Vetoable: drop the row from `items.ts` (or the overlay from the manifest) if Nik prefers no note.

## Captures

Real screenshots of the live post, dark theme (the site default), 2x, headless Chrome (`scripts/shot.ts` from episode 196 with a taller viewport, `VH=2400`). Each capture is the figure image only (`img[src$="...-dark.svg"]`), without the long caption, so the text stays readable; the URL `postgres.ai/blog/20261123-pgaibench` is printed under it. Figure files on the day: `/assets/blog/20261120-pgaibench-fig-track1-dark.svg`, `/assets/blog/20261113-pgaibench-fig-aaa-roles-dark.svg`, `/assets/blog/20261120-pgaibench-fig-track1-aaa-dark.svg` (all 200).

## Rendering

- Tool: `tools/podcast-edit/overlays` copied to `<review>/overlays/tool`, plus `Ep198.tsx` (`band198`, `shot198`) and the episode 196 `scripts/shot.ts`. `render-all.ts` in the copy writes to `$OUT` and renders each typed band twice: `<id>.mov` (plain) and `<id>-typing.mov`, with `<id>-typing-bursts.json`.
- Band: x 120, y 744-888 (labels end near y 730; nothing below y 900). Center panel: x 40-1600, y 220-890; hosts move to the right column (`place.*.center` in `layout.json`).
- Sounds: `bun tools/podcast-edit/sfx-manifest.ts manifest.json --out manifest-sfx.json`. Compose with `manifest-sfx.json` only, and `--sfx-rel center-out=-3`.

## Files here

- `items.ts`: the item list (source anchors, mapping through the cuts file). `Ep198.tsx`: the `band198` and `shot198` compositions (register them in the tool's `src/Root.tsx`). `render-all.ts`: the toolkit script with the ep198 changes. `shot.ts`: the capture script.
- `manifest.json`, `manifest-sfx.json`, `*-typing-bursts.json`: copies of the files in `<review>/overlays/out`. `captures/*.rect.json`: capture rects (PNGs stay in the tool's `public/ep198/`).
- Sound times in the table are seconds from the overlay start, from `manifest-sfx.json`.

## QA (2026-11-24)

- Every overlay composited over the layout still (center cards over a still with the hosts in the right column), at mid-swipe, mid-typing and settled: `<review>/overlays/overlays-sheet.png`. Strip crops at 2x: no clipped glyphs.
- Alpha in y 900-1080 is zero in every frame of all 13 files (the panel's drop shadow was removed for this).

## Open items

- n01-editor needs Nik's OK (vetoable).
- s03-safe says "safe or unclassified" (the post's wording) instead of the shorter "safe changes".
