# Episode 197 (Postgres 19): X plan, v4

DRAFT v4, 2026-11-19. Nothing is posted. Nik posts from his account. LinkedIn: [`linkedin.md`](linkedin.md). X Article: [`x-article.md`](x-article.md). Phone-size preview of every post with its media: `preview/social-v4-sheet.png`.

Why v4: a second review. Lead with the upgrade trap (long form, with queries to save), now reproduced for real. Final review: B goes today; A-joy is later, maybe. The measured scoreboard (A) moves to tomorrow.

Rules: first person; no emojis; every number from a card in `../../cards/` or from the repro (tables below); claims only about what the episode discussed or what the repro showed; channel style; media 1080x1350. Character counts are X counts (a link = 23); `build.ts sheet` checks them (280 for short posts; long-form posts are marked and allowed up to 1,000, Nik has X Premium).

Media: `preview/social-v4/` (git-ignored). Rebuild with `bun episodes/20261117-postgres-19/social/v4/build/build.ts`.

Handles: Michael is @michristofides. Kirk Wolak has no X account, so plain "Kirk Wolak". Kirk is a co-host.

## Repro: the upgrade trap (done 2026-11-19)

Postgres 18.7 and 19 RC2, built from the git tags `REL_18_7` and `REL_19_RC2` ([`repro/build.sh`](repro/build.sh)). For each case a fresh 18.7 cluster, one setting, then `pg_upgrade --check` and `pg_upgrade` to 19 RC2 ([`repro/repro.sh`](repro/repro.sh), output [`repro/repro.out`](repro/repro.out)):

| Case on 18.7 | --check | pg_upgrade | Error during restore on 19 |
| --- | --- | --- | --- |
| none (control) | compatible | complete | - |
| role: standard_conforming_strings = off | compatible | **fails** | non-standard string literals are not supported |
| role: escape_string_warning = off | compatible | **fails** | unrecognized configuration parameter "escape_string_warning" |
| database: standard_conforming_strings = off | compatible | **fails** | non-standard string literals are not supported |
| database: escape_string_warning = on | compatible | **fails** | unrecognized configuration parameter |
| function: standard_conforming_strings = off | compatible | **fails** | non-standard string literals are not supported |
| function: escape_string_warning = off | compatible | **fails** | unrecognized configuration parameter |
| role: standard_conforming_strings = on | compatible | complete | - |
| GRANT SET ON PARAMETER escape_string_warning | compatible | **fails** | unrecognized configuration parameter |

So: 19 removed escape_string_warning (any value fails), and standard_conforming_strings = off fails (= on is fine). --check caught none of the 7 failing cases. The three queries in post B, run as written on an 18.7 cluster with these cases set, find every one ([`repro/queries.sh`](repro/queries.sh), output [`repro/queries.out`](repro/queries.out)); the first query also lists harmless "= on" rows. pg_proc is per database: run the second query in each database.

## Schedule (Pacific Time)

| When (PT) | What |
| --- | --- |
| **Today, Thu 19 Nov, ~2:00 PM** | LinkedIn post + first comment (`linkedin.md`) |
| **Today, Thu 19 Nov, ~2:00 PM** | X: **B** (upgrade trap, long form). Self-reply 2 min later. |
| Fri 20 Nov, 8:30 AM | X Unit A: measured scoreboard |
| Later, maybe | X: A-joy (celebration) |
| Tue 24 Nov, 8:30 AM | X Article post |
| Wed 25 Nov, 8:30 AM | X Unit C: Kirk clip |
| Later, one per slot | NOTIFY, lz4, JIT, REPACK, plan changes (texts below) |

## First 60 minutes after each X post (checklist for Nik)

- [ ] Stay in the replies for the full hour. Answer every comment, with a fact or a question back, not only "thanks". Reply to people only; no extra self-replies with slides.
- [ ] By +30 min: ask Michael (@michristofides) and @PostgresFM to repost, not quote.
- [ ] Do not quote-post your own posts. Do not delete and repost a post that starts slowly.

---

## Today: B (A-joy: later, maybe)

### B upgrade trap, long form — media: `s06-upgrade.png`

Long form (X Premium). The image shows the real output from the repro (shortened).

```text
pg_upgrade --check: "Clusters are compatible".
pg_upgrade: fails.

Postgres 19 is out today. Check this before you upgrade: we reproduced it, 18.7 to 19 RC2. 3 queries to find it are below.

The cause, set on a role, a database or a function:
- escape_string_warning, any value (removed in 19)
- standard_conforming_strings = off (19 requires on)
A GRANT SET ON PARAMETER escape_string_warning does it too. --check passes all of them.

Find them before your upgrade window (the pg_proc query in each database):

select * from pg_db_role_setting
where setconfig::text ~ 'standard_conforming_strings|escape_string_warning';

select oid::regprocedure from pg_proc
where proconfig::text ~ 'standard_conforming_strings|escape_string_warning';

select parname from pg_parameter_acl
where parname = 'escape_string_warning';

standard_conforming_strings = on is fine. Then upgrade a clone first.
```

### B self-reply, 2 minutes later

```text
We talk about this and the rest of 19 in the new postgres.fm episode, @michristofides, Kirk Wolak and I: https://youtu.be/VcDU-NRE3hI
```

### A-joy celebration — media: `s00-joy.png`

Positive only; the 55x caveat is on the image footnote ("55x: at least. Our test client was the limit."). Multipliers are rounded down from the cards: 11,040 / 200 = 55.2 -> 55x; 152.3 / 12.9 = 11.8 -> 11x; 107 / 44 = 2.43 -> 2.4x. Media: the still (it is what a video's first frame would show; no time to animate a fourth row today).

```text
Postgres 19 is out, and it is fast.

- LISTEN/NOTIFY with 1,000 listeners: 55x faster
- Autovacuum gets to the urgent table 11x sooner
- lz4 TOAST: jsonb inserts 2.4x faster
- REPACK (CONCURRENTLY), now in core

Thank you to the 645 people credited in the 19 release notes.
```

### A-joy self-reply, 2 minutes later

```text
@michristofides, Kirk Wolak and I talked it all through: https://youtu.be/VcDU-NRE3hI
```

## Next

### A measured scoreboard — media: `xa-hero.mp4`

8.5 s silent loop, 1080x1350. Video, not the still: native video is what gets reach on X, and frame 0 is now the full three-row table (same as the still `s00-hero.png`), so the muted autoplay preview reads at once. Hold 0-4 s, rows 2-3 replay with their count-up 4.0-6.6 s, hold to 8.5 s = frame 0 (clean loop). Check strip: `xa-hero.check.png`. "55x" sits mid-line, so it cannot wrap onto its own line.

```text
LISTEN/NOTIFY with 1,000 listeners: 200/s on Postgres 18.7. 11,040/s on 19. 55x, and our test client was the limit.

Autovacuum gets to a table near wraparound in 12.9 s, not 152.3 s.

lz4 TOAST: 200,000 jsonb docs in 44 s, not 107 s.
```

### A self-reply, 2 minutes later

```text
@michristofides, Kirk Wolak and I talk it all through in the new postgres.fm episode: https://youtu.be/VcDU-NRE3hI
```

### Article post (Tue) — media: `article-cover.png`

```text
Postgres 19 vs 18.7: 8 things we measured, each with its catch.

https://x.com/i/article/PLACEHOLDER
```

The URL is a placeholder until the Article is published. This post is the only one with more than the YouTube link: the Article holds the episode, podcast and data links.

### C Kirk clip (Wed) — media: `xc-kirk.mp4`

18.0 s, sound on. Header "PLAN HINTS?"; Kirk's tile full width; first caption on frame 0; ends right after "we're 2026, baby." plus a 0.7 s end card. Captions under the tile, never on his face, nothing in the bottom 180 px. Check strip: `xc-kirk.check.png`.

```text
Kirk Wolak has a strong view on plan hints. Sound on.

Postgres 19 adds pg_plan_advice: keep a good plan on the server, not as hints in the app. Cost in our test: 11% to 14% of throughput on a trivial query, with advice generated for every query.
```

### C self-reply

```text
The full episode: https://youtu.be/VcDU-NRE3hI
```

## Later standalone posts (v2 text)

### NOTIFY — media: `s01-notify.png`

```text
LISTEN/NOTIFY, 1,000 listeners, each on its own channel: 55x or more on 19. Our test client was the limit, so 19 can go higher.

What did not change: the global lock at commit. With many concurrent writing transactions, NOTIFY can still be the bottleneck.
```

### lz4 default — media: `s03-lz4.png`

```text
New default: TOAST uses lz4, if Postgres is built with it.

200,000 jsonb docs of 16 KiB: inserted in 44 s on 19, 107 s with pglz on 18.7.

The cost: the table is 11.3% larger. If disk matters more, set default_toast_compression = pglz.
```

### JIT default — media: `s04-jit.png`

```text
New default: jit = off. It cuts both ways.

On TPC-H-derived queries, a short one went from 172 to 108 ms. The longest went from 3,914 to 4,607 ms.

JIT itself did not change. Check your long analytical queries.
```

### REPACK — media: `s05-repack.png`

```text
REPACK (CONCURRENTLY) is in core, based on pg_squeeze. You get it on managed services that do not ship pg_repack.

Watch the final lock. At 65,996 rows/s of writes, 30 rows per transaction, it waited 85.7 s in our test.
```

### Plan changes — media: `s07-plans.png`

```text
Also before you upgrade: diff your plans.

Same data, same statistics, planned on 18.7 and 19 RC2: 83 of 220 query plans changed. 61 of them come from one planner commit, a tie-break.
```

The v2 autovacuum post is dropped: its numbers are in A1.

## Number check

Card keys are `numbers.<key>` in `../../cards/<card>.card.json`; each key has its raw file and the command that recomputes it. All checked against the cards on 2026-11-19.

| Post | Number | Source |
| --- | --- | --- |
| A1, NOTIFY, LinkedIn | 1,000 listeners; 200/s on 18.7; 11,040/s on 19 RC2 | `f03-notify`: literal, `pg18`, `pg19` |
| A1 (text, video chip), NOTIFY | 55x, "or more" | 11,040 / 200 = 55.2, rounded down; client-limited (notes, "About the numbers"). The image footnotes say "55x: at least. Our test client was the limit." |
| A1, LinkedIn | 152.3 s on 18.7; 12.9 s on 19 | `f04-autovac`: `pg18`, `pg19` |
| A1, lz4, LinkedIn | 200,000 docs of 16 KiB; 44 s lz4; 107 s pglz | `f07-lz4`: `docs`, `kib`, `pg19`, `pg18` |
| lz4 | table 11.3% larger with lz4 | `notes/notes.md`, "About the numbers" |
| C | 11% to 14% | `f11-advice`: `lossOff` (-11, against the modules off), `lossLoaded` (-14, against them loaded and idle); advice generated for every query (`notes/notes.md`) |
| JIT | 172 to 108 ms; 3,914 to 4,607 ms | `f06-jit`: `q19B31`, `q19B33`, `q1B31`, `q1B33` |
| REPACK | 85.7 s at 65,996 rows/s, 30 rows per transaction | `f02-repack`: `wait`, `runcx30x` |
| Plans | 83 of 220 plans changed; 61 from one commit | `f10-plans`: `changed`, `total`, `commit` |
| LinkedIn | 645 people credited | `f01-numbers`: `pg19` |
| B | 7 failing cases, --check passes all | `repro/repro.out` |
| B | the three queries find every case | `repro/queries.out` |
| A-joy | 55x, 11x, 2.4x | floor of 11,040/200, 152.3/12.9, 107/44 to the shown precision (`build/slides.ts`, s00-joy, fails the build if the cards change) |

On-air sources for the claims without numbers (podcast times, `captions/podcast.transcript.txt`):

- NOTIFY numbers and "that single global lock is still there": Nik, 00:17:01.
- Autovacuum prioritization, nothing to change: Kirk 00:19:23, Michael 00:21:10.
- lz4 for TOAST "if your Postgres was built with it": Michael, 00:28:42. JIT off: Michael, 00:27:46.
- REPACK on managed services without pg_repack: Kirk, 00:16:00. Based on pg_squeeze: commit 28d534e2ae0ac888b5460f977a10cd9bb017ef98.
- pg_upgrade --check passes, then the upgrade fails: Nik, 00:41:00; settings and objects as corrected in `notes/corrections.md` (role, database or function).
- Kirk's quote: 00:24:33 (podcast time), words as heard in the audio (whisper large-v3 on the final video): "It was a great idea in 1975, okay? The problem is, we're 2026, baby." The clip's last word "baby." ends at 1574.12 s of the final video; the cut is at 1574.06 s, inside the 1573.93-1574.19 s silence by silencedetect (-35 dB), before "And".
