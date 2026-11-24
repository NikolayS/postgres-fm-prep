# Episode 198 overlay plan

23 overlays: 14 band strips under the name labels and 9 real screenshots in the center panel. Every item is anchored to source word times (`work/src.words.json`, checked with `tools/podcast-edit/find.ts`) and mapped through `pgfm198-edited.cuts.json` (edit with the widened fly break, Kirk's absence removed, 50:28 and 54:00-54:31 cut). Times are edited-body seconds (`pgfm198-edited.mp4`, 3,207.84 s). Video time = edited + 30.12 s (cold open) until the cold open is final. No freezes.

Facts come only from https://postgres.ai/blog/20261123-pgaibench, https://pgaibench.dev/ (v0.2.0) and `../../notes/fact-check.md`. Kirk quotes are his exact words. All URLs returned HTTP 200 on 2026-11-24.

## Items

| Id | Source | Edited | Duration | On screen | Source | SFX |
| --- | --- | --- | --- | --- | --- | --- |
| s00-goal | 3:49.80 | 169.28 (2:49.28) | 7.20 s | marker strip: "Goal: one engineer reliably oversees 1,000 clusters" | https://postgres.ai/blog/20261123-pgaibench | typing-1700ms at 0.45 s |
| q00-kirk | 5:35.30 | 272.54 (4:32.54) | 7.20 s | quote strip: "Would you let an AI run DDL on your production?" | on air | typing-1633ms at 0.45 s |
| c00-pgaibench | 9:08.40 | 482 (8:02.00) | 7.20 s | dark strip: "PGAIBench v0.2 · pgaibench.dev" | https://pgaibench.dev/ | typing-1700ms at 0.45 s |
| s04-scenarios VETOABLE | 12:38.70 | 676.5 (11:16.50) | 6.00 s | marker strip: "PGAIBench v0.2: 19 live scenarios" | https://postgres.ai/blog/20261123-pgaibench | typing-1450ms at 0.45 s |
| f00-l9 | 13:32.40 | 729 (12:09.00) | 26.20 s | Post, task L9 bullet. Red underline on "saw idx_scan = 0 on the primary and dropped all three indexes" at "Drop all these indexes", then on "18.0×" at "read replica crashes". | https://postgres.ai/blog/20261123-pgaibench | center-in at 0.05 s, center-out at 25.82 s |
| f04-site | 17:18.40 | 920.2 (15:20.20) | 26.72 s | pgaibench.dev Track 1 section (v0.2). Red underline on "claude-fable-5.2 tied for first with 65 correct runs and still caused 3 of the 13 live harms" at "Fable 5.2 at high effort". | https://pgaibench.dev/ | center-in at 0.05 s, center-out at 26.34 s |
| s01-restart | 18:15.60 | 975.84 (16:15.84) | 8.60 s | marker strip: "Told not to restart: restarted in 5 of 5 runs" | https://postgres.ai/blog/20261123-pgaibench | typing-1500ms at 0.45 s |
| s05-downtime | 18:52.40 | 1012.36 (16:52.36) | 8.00 s | marker strip: "3 runs broke live primaries, 2 stopped in rehearsal" | https://postgres.ai/blog/20261123-pgaibench | typing-1700ms at 0.45 s |
| f05-maxlocks | 20:07.30 | 1046.38 (17:26.38) | 17.92 s | PostgreSQL 18 docs, max_locks_per_transaction. Red underline on "When running a standby server, you must set this parameter to have the same or higher value as on the primary server."; red box on the parameter name at "Max slots per transaction". Also fixes the name said on air. | https://www.postgresql.org/docs/18/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION | center-in at 0.05 s, center-out at 17.54 s |
| f01-track1 | 22:15.85 | 1174.17 (19:34.17) | 35.47 s | Post Figure 1: Track 1 outcomes, 10 models acting alone, 949 runs. | https://postgres.ai/blog/20261123-pgaibench | center-in at 0.05 s, center-out at 35.10 s |
| f06-dblab | 28:59.40 | 1528.84 (25:28.84) | 24.76 s | DBLab Engine product page top; swaps to the DBLab Forge page top at "DB lab forge". | https://postgres.ai/products/dblab_engine https://postgres.ai/products/dblab-forge | center-in at 0.05 s, center-out at 24.38 s |
| s02-gate | 29:26.30 | 1555.1 (25:55.10) | 7.60 s | marker strip: "Clone test alone: 6 of 13 harms stopped, zero AI cost" | https://postgres.ai/blog/20261123-pgaibench | typing-1767ms at 0.45 s |
| q01-kirk | 31:00.30 | 1647.1 (27:27.10) | 7.00 s | quote strip: "The actor is deterministic. / The production environment is not." | on air | typing-933ms at 0.45 s, typing-1167ms at 1.85 s |
| q02-kirk | 33:05.90 | 1772.7 (29:32.70) | 8.30 s | quote strip: "If you have read replicas, / you must have them in your test environment." | on air | typing-900ms at 0.45 s, typing-1500ms at 2.43 s |
| q03-kirk | 37:36.50 | 1888.12 (31:28.12) | 6.98 s | quote strip: "Pretend you’re Tom Lane, and cover this critically." | on air | typing-1767ms at 0.45 s |
| f02-aaa | 39:02.50 | 1974.1 (32:54.10) | 38.02 s | Post Figure 2: AAA, three roles and the path of one change request. | https://postgres.ai/blog/20261123-pgaibench | center-in at 0.05 s, center-out at 37.66 s |
| n01-editor VETOABLE | 43:52.20 | 2257 (37:37.00) | 7.00 s | dark strip: "Editor's note: in AAA, only the Actor writes to production." | https://postgres.ai/blog/20261123-pgaibench | typing-1967ms at 0.45 s |
| f03-waterfall | 50:15.35 | 2633.55 (43:53.55) | 14.05 s | Post Figure 3: Track 1 + AAA replay, live harms 13 -> 7 -> 1 (-92.3%). | https://postgres.ai/blog/20261123-pgaibench | center-in at 0.05 s, center-out at 13.66 s |
| s03-safe | 52:35.10 | 2773.3 (46:13.30) | 7.20 s | marker strip: "377 of 378 safe or unclassified changes still approved" | https://postgres.ai/blog/20261123-pgaibench | typing-1800ms at 0.45 s |
| f07-l5 | 53:43.00 | 2837.44 (47:17.44) | 17.00 s | Post, task L5 bullet (SET NOT NULL scale complacency). Red underline on "After seeing the passing clone summary, GLM flipped to approve in 4 of 5". | https://postgres.ai/blog/20261123-pgaibench | center-in at 0.05 s, center-out at 16.62 s |
| f08-dbabench | 56:45.10 | 3002.18 (50:02.18) | 11.10 s | arXiv 2607.22165 abstract page. Red underline on the title "DBA-Bench: A Production-Fidelity Benchmark for LLM-Based Database Operations Agents". | https://arxiv.org/abs/2607.22165 | center-in at 0.05 s, center-out at 10.74 s |
| q04-kirk | 57:20.80 | 3037.68 (50:37.68) | 8.72 s | quote strip: "A successful experiment is evidence, not a guarantee. / Rollback is a procedure, not a promise." | on air | typing-1800ms at 0.45 s, typing-1333ms at 4.95 s |
| q05-kirk | 58:43.90 | 3120.14 (52:00.14) | 7.70 s | quote strip: "…how much responsibility we can safely delegate, / not simply how intelligent the AI is." | on air | typing-1633ms at 0.45 s, typing-1267ms at 3.39 s |

## Anchors (source seconds)

- s00-goal: Nik: "vision should be, like, 1,000 clusters and one experienced engineer controlling them reliably" (227.84-233.6). Source: https://postgres.ai/blog/20261123-pgaibench ("one experienced DBRE or SRE can reliably oversee 1,000 clusters").
- q00-kirk: Kirk: "would you let an AI run DDL on your production?" (335.50-338.44). Source: on air (Kirk), his exact words.
- c00-pgaibench: Nik: "this benchmark called PG, PG AI Bench" (547.73-550.11). Source: https://pgaibench.dev/ (v0.2.0; HTTP 200 on 2026-11-24).
- s04-scenarios: Nik: "It was originally, I think, 20. Then, uh, now it's, like, 18 tasks." (755.76-759.36). Source: https://postgres.ai/blog/20261123-pgaibench ("10 unquantized models across 19 live scenarios × 5 repeats"); notes/fact-check.md 11:11 (12:34). Vetoable: number note: on air "18 tasks"; the post says 19 live scenarios (14 core public, 2 exploratory, 3 held-out).
- f00-l9: Kirk: "You have read replicas that are running reports" (812.60-814.90) ... "Oh, no one's using this" (831.50) "Drop all these indexes" (833.54-834.56) "And now your read replica crashes because nothing's finishing" (835.0-837.90). Source: https://postgres.ai/blog/20261123-pgaibench (task L9: "x-ai/grok-4.7 saw idx_scan = 0 on the primary and dropped all three indexes ... query q20 client p99 jumped 18.0×"); live page, dark theme, 2x.
- f04-site: Nik: "first thing what I was, um, surprised to see is that even Fable at high, Fable 5.2 at high effort, uh, was making some harmful changes" (1038.56-1053.0) ... "So escalate to human, right?" (1063.5-1065.22). Source: https://pgaibench.dev/ (v0.2.0, "Track 1: Models acting alone (949 live Postgres 18.7 runs)"); pgaibench.dev/leaderboard/ still shows v0.1.7, so it is not used.
- s01-restart: Nik: "five out of five cases" (1095.72-1097.42); Kirk: "After being told, do not restart the server" (1101.90-1103.90). Source: https://postgres.ai/blog/20261123-pgaibench ("broke an explicit no-restart rule in all 5 of 5 repeats", claude-fable-5.2:high, task C18).
- s05-downtime: Nik: "it was blocked by internal stuff in two cases out of five. But in three cases it led to downtime" (1130.5-1136.48). Source: https://postgres.ai/blog/20261123-pgaibench ("3 runs sailed through and broke live primaries while 2 stopped in rehearsal"); on air "downtime on replica", the post counts them as live primary harms (fact-check 16:58).
- f05-maxlocks: Nik: "sometimes there are some settings you cannot change on the primary before changing them on standbys" (1207.44-1213.0) "Max slots per transaction is one of them" (1214.96-1217.0) "First you need to adjust replicas, restarts on them, and then on the primary" (1219.04-1223.10). Source: https://www.postgresql.org/docs/18/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION ("When running a standby server, you must set this parameter to have the same or higher value as on the primary server."); on air "max slots per transaction" (fact-check 17:33: max_locks_per_transaction).
- f01-track1: Nik: "you see the graphs right now" (1335.96-1337.08) ... "if you hear the sound you just heard" (1355.16) ... "so yeah, this is the picture" (1370.64-1371.92). Source: https://postgres.ai/blog/20261123-pgaibench Figure 1 (Track 1 outcomes, 10 models acting alone, 949 runs); live page, dark theme, 2x.
- f06-dblab: Nik: "with our branching DB lab, uh, engine, it's a shared environment" (1739.68-1744) ... "while a DB lab forge, it's a dedicated, uh, clusters of multiple nodes" (1748.70-1753.82). Source: https://postgres.ai/products/dblab_engine and https://postgres.ai/products/dblab-forge (page tops, 1280x720 at 2x, 2026-11-24); both linked from the post.
- s02-gate: Nik: "it removed half of harm- harmful actions" (1766.46-1769.80) ... "dropped twice, which is good" (1771.76-1773.80). Source: https://postgres.ai/blog/20261123-pgaibench ("Clone gate ($0 LLM): stopped 6 of 13 harms (46.2%) ... while blocking 0 of 395 non-harmful changes").
- q01-kirk: Kirk: "I have a soundbite for this." (1858.17-1859.93) "The actor is deterministic." (1860.43-1862.09) "The production environment is not." (1862.15-1863.90). Source: on air (Kirk), his exact words.
- q02-kirk: Kirk: "If you have read replicas, you must have them in your test environment." (1986.07-1990.07) "destined to potentially have problems in production" (1992.85-1995.11). Source: on air (Kirk), his exact words.
- q03-kirk: Kirk: "I also like to tell it to Pretend you're Tom Lane, and cover this critically." (2254.5-2260.24). Source: on air (Kirk), his exact words.
- f02-aaa: Nik: "three As, triple A, AAA" (2342.66-2345.00) "right now you see ... in the center of the screen" (2346.80-2349.40) ... "First is analyst" (2364.60) ... "actor, which will execute this change" (2381.42-2384.54). Source: https://postgres.ai/blog/20261123-pgaibench Figure 2 (AAA: three roles, and the path of one change request); the post's hero is a 3D canvas animation, so the static Figure 2 is used; live page, dark theme, 2x.
- n01-editor: Nik: "neither analyst nor actor have access to production, right?" (2628.60-2632.90). Source: https://postgres.ai/blog/20261123-pgaibench ("only after the Auditor signs off does the Actor apply the approved steps verbatim to production"; Figure 2: "Production Postgres: only the Actor changes it"); notes/fact-check.md 37:58 (43:49). Vetoable: Editor's note; on air Nik says "neither analyst nor actor have access to production" (he means the Analyst and the Auditor).
- f03-waterfall: Kirk: "so you went from 13 harms down to one at the end of the day" (3015.40-3019.40) "by structuring this a little better" (3019.78-3021.40). Source: https://postgres.ai/blog/20261123-pgaibench Figure 3 (Track 1 + AAA replay: 13 -> 7 -> 1, -92.3%); live page, dark theme, 2x.
- s03-safe: Nik: "almost 400, uh, only one was blocked by mistake" (3153.86-3156.98). Source: https://postgres.ai/blog/20261123-pgaibench ("approving 377 of 378 safe or unclassified changes (99.7%)").
- f07-l5: Nik: "Weak models, if you just show them weak testing green light, they become like, Oh, let's go." (3223.20-3229.5) "Or they escalate too much" (3230.76-3232.38). Source: https://postgres.ai/blog/20261123-pgaibench (task L5, "Scale complacency on SET NOT NULL": "After seeing the passing clone summary, GLM flipped to approve in 4 of 5 k = 5 and 2 of 3 matched-prompt repeats"); live page, dark theme, 2x.
- f08-dbabench: Nik: "I learned from other benchmarks, uh, like D- DBAbench, for example, and others, S- SWE bench" (3405.27-3410.35). Source: https://arxiv.org/abs/2607.22165 (DBA-Bench, cited in the post; abstract page, 2x, 2026-11-24).
- q04-kirk: Kirk: "A successful experiment is evidence, not a guarantee, okay? rollback is a procedure, not a promise." (3441.01-3448.61). Source: on air (Kirk), his exact words.
- q05-kirk: Kirk: "we should be measuring how much responsibility we can safely delegate- not simply how intelligent the AI is." (3523.63-3529.71). Source: on air (Kirk), his exact words (the opening "we should be measuring" left out).

## Captures

Real screenshots, headless Chrome, 2x, taken 2026-11-24. Sizes and red highlight rects are measured on the page and stored in `captures/<name>.rect.json`; the PNGs stay in the tool's `public/ep198/`.

- Post figures (`fig-track1`, `fig-aaa-roles`, `fig-track1-aaa`): figure image only, `shot.ts`, dark theme.
- Post passages (`post-l9`, `post-l5`), pgaibench.dev Track 1 section (`site-track1`), PostgreSQL 18 docs (`docs-maxlocks`), arXiv abstract (`arxiv-dbabench`): `cap198.ts` (start block to end block, highlights as exact text ranges or `css=` elements).
- DBLab Engine and DBLab Forge page tops (`dblab-engine`, `dblab-forge`): `hero.ts`, 1024x600 viewport.
- pgaibench.dev/leaderboard/ still shows v0.1.7 and its numbers do not match v0.2, so f04-site uses the v0.2 Track 1 section of the home page.

## Rendering

- Tool: `tools/podcast-edit/overlays` copied to `<review>/overlays/tool`, plus `Ep198.tsx` (`band198`, `shot198`). `shot198` takes `shots: [{src, w, h, url, at?, hl?: [{rects, at, kind}]}]`: a later shot crossfades in at `at`; highlights are red underlines (growing line by line) or boxes. `render-all.ts` in the copy writes to `$OUT` and renders each typed band twice: `<id>.mov` and `<id>-typing.mov`, with `<id>-typing-bursts.json`.
- Band: x 120, y 744-888 (labels end near y 730). Center panel: x 40-1600, y 220-890; hosts move to the right column (`place.*.center`). Nothing below y 900.
- Sounds: `bun tools/podcast-edit/sfx-manifest.ts manifest.json --out manifest-sfx.json`. Compose with `manifest-sfx.json` only, and `--sfx-rel center-out=-3`.

## Files here

- `items.ts` (item list, source anchors, cuts mapping; `bun items.ts` prints times, overlaps and center gaps), `Ep198.tsx`, `render-all.ts`, `shot.ts`, `cap198.ts`, `hero.ts`.
- `manifest.json`, `manifest-sfx.json`, `*-typing-bursts.json`: copies of `<review>/overlays/out`. `captures/*.rect.json`: capture geometry.

## QA (2026-11-24)

- No overlaps; center cards 60 s or more apart.
- Every overlay has its sound in `manifest-sfx.json`: IN at 0.05 s and OUT before the exit for center cards, one typing sound per line for strips.
- Alpha in y 900-1080 is zero in every frame of all 37 files.
- One settled frame per item over the real frame at that edited second (`tools/layout.ts --still`, center windows for center cards): `<review>/for-nik/11-illus-NN-<id>.png`; list in `<review>/for-nik/10-illustrations.md`. No text over faces; no clipped glyphs.

## Open items

- n01-editor and s04-scenarios need Nik's OK (vetoable).
- Video times assume a 30.12 s cold open.
