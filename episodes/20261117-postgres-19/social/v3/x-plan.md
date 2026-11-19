# Episode 197 (Postgres 19): X plan, v3

DRAFT v3, 2026-11-19. Nothing is posted. Nik posts from his account. LinkedIn: [`linkedin.md`](linkedin.md). Phone-size preview of every post with its media: `preview/social-v3-sheet.png`.

Why v3: an expert review of v2. No thread today. Three standalone units (A, B, C), then the other findings as later standalone posts. The hero video is shorter and bigger: three rows, 55x chip, a payoff on the first frame.

Rules: first person; no emojis; every number from a card in `../../cards/` (table below); claims only about what the episode discussed; channel style (black #111013, Impact, cream #f5f3ee, orange #ff7a1a); media 1080x1350. Character counts are X counts (a link = 23; limit 280); `build.ts sheet` checks them.

Media: `preview/social-v3/` (git-ignored, like all of `preview/`). Rebuild everything with `bun episodes/20261117-postgres-19/social/v3/build/build.ts`. The images read their numbers from the card files at build time.

Handles: Michael is @michristofides (https://x.com/michristofides). Kirk Wolak has no X account on https://postgres.fm/people, so plain "Kirk Wolak". Kirk is a co-host.

## Schedule (Pacific Time)

| When (PT) | What |
| --- | --- |
| Fri 20 Nov, 7:00 AM | LinkedIn post + first comment with links (`linkedin.md`) |
| Fri 20 Nov, before 8:30 AM | X Article published (optional, [`x-article.md`](x-article.md)) |
| Fri 20 Nov, 8:30 AM | X Unit A: hero post |
| Fri 20 Nov, 8:32 AM | X Unit A: self-reply with links (or with the Article link) |
| Fri 20 Nov, ~8:50 AM and ~9:15 AM | Follow-ups in Nik's own thread under Unit A (checklist below) |
| Mon 23 Nov, 8:30 AM | X Unit B: upgrade trap |
| Wed 25 Nov, 8:30 AM | X Unit C: Kirk clip |
| Later, one per slot, no fixed dates | NOTIFY, lz4, JIT, REPACK, plan changes (texts below, from v2) |

Why 8:30 AM: in a measured comparison with a Postgres account that gets about 20x more views per follower, the posts went out in a consistent 8:20-11:45 AM PT slot, as native video, standalone (not quotes), with the author active in the replies for the first hour. Same slot every day: Fri, Mon, Wed.

Ask Michael to repost Unit A (and the LinkedIn post) within 30 minutes of posting.

## First 60 minutes after each X unit (checklist for Nik)

- [ ] Stay in the replies for the full hour. Answer every comment, with a fact or a question back, not only "thanks".
- [ ] By +30 min: ask Michael (@michristofides) and @PostgresFM to repost, not quote.
- [ ] ~+20 min (Unit A only): reply in your own thread with the NOTIFY slide and its post text (below, "NOTIFY").
- [ ] ~+45 min (Unit A only): reply in your own thread with the lz4 slide and its post text (below, "lz4 default").
- [ ] Do not quote-post your own posts; reply in the thread.
- [ ] Do not delete and repost a post that starts slowly.

---

## Unit A

### A1 hero post, no link — media: `xa-hero.mp4`

The review text was 287 characters; two wording cuts bring it to 278 ("Postgres 19 vs 18.7, measured:" for "Postgres 19, measured against 18.7:", "One trap:" for "And one trap:"). No number changed.

8.5 s silent loop, 1080x1350. Frame 0 already shows row 1 complete (200/s to 11,040/s); the orange 55x chip is there on frame 0 and pulses once by 0.45 s; autovacuum and lz4 rows come in by 3.2 s; full hold from 3.6 s to 7.9 s; then rows 2-3 fade out, so the loop is clean. Still: `s00-hero.png`. Check strip (frame 0, 0.7 s, 2 s, hold, last frame): `xa-hero.check.png`.

```text
Postgres 19 vs 18.7, measured:

- LISTEN/NOTIFY, 1,000 listeners: 200/s to 11,040/s. 55x
- Autovacuum gets to a table near wraparound in 12.9 s, not 152.3 s
- lz4 TOAST: 200,000 jsonb docs in 44 s, not 107 s

One trap: pg_upgrade --check can say OK, and the upgrade still fails.
```

### A2 self-reply, 2 minutes later

```text
We talk it all through in the new postgres.fm episode: @michristofides, Kirk Wolak and I.

Which 19 feature do you test first?

Watch: https://youtu.be/VcDU-NRE3hI
Listen: https://postgres.fm/episodes/postgres-19
Data: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
```

### Option: A2 links to the Article

If the X Article ([`x-article.md`](x-article.md)) is published first, use this self-reply instead. The Article holds all the links (episode, podcast, data).

```text
We talk it all through in the new postgres.fm episode: @michristofides, Kirk Wolak and I.

Which 19 feature do you test first?

Every number, with the catches, in one read: https://x.com/i/article/PLACEHOLDER
```

The URL is a placeholder until the Article is published.

## Unit B

### B upgrade trap — media: `s06-upgrade.png`

Image unchanged from v2.

```text
pg_upgrade --check says OK. The upgrade to Postgres 19 still fails.

The cause: standard_conforming_strings = off, or escape_string_warning, set on a role, a database or a function.

Upgrade a clone first.
```

## Unit C

### C Kirk clip — media: `xc-kirk.mp4`

18.0 s, sound on: 17.3 s of Kirk, then a 0.7 s postgres.fm end card. Ends right after "we're 2026, baby." Two long pauses shortened to about 0.15 s; every cut sits in a silence. Burned captions under his tile, never on the face, nothing in the bottom 180 px. Check strip (start, each cut, end): `xc-kirk.check.png`.

```text
Kirk Wolak on plan hints: "It was a great idea in 1975, okay? The problem is, we're 2026, baby."

19 adds pg_plan_advice: keep a good plan on the server, not as hints in the app. Cost in our test: 11% to 14% of throughput on a trivial query, with advice generated for every query.
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

Card keys are `numbers.<key>` in `../../cards/<card>.card.json`; each key has its raw file and the command that recomputes it. All checked against the cards on 2026-11-19; none needed a change.

| Post | Number | Source |
| --- | --- | --- |
| A1, NOTIFY, LinkedIn | 1,000 listeners; 200/s on 18.7; 11,040/s on 19 RC2 | `f03-notify`: literal, `pg18`, `pg19` |
| A1 (text, video chip), NOTIFY | 55x, "or more" | 11,040 / 200 = 55.2, rounded down; client-limited (notes, "About the numbers"). The video footnote says "55x is a floor: our test client was the limit". |
| A1, LinkedIn | 152.3 s on 18.7; 12.9 s on 19 | `f04-autovac`: `pg18`, `pg19` |
| A1, lz4, LinkedIn | 200,000 docs of 16 KiB; 44 s lz4; 107 s pglz | `f07-lz4`: `docs`, `kib`, `pg19`, `pg18` |
| lz4 | table 11.3% larger with lz4 | `notes/notes.md`, "About the numbers" |
| C | 11% to 14% | `f11-advice`: `lossOff` (-11, against the modules off), `lossLoaded` (-14, against them loaded and idle); advice generated for every query (`notes/notes.md`) |
| JIT | 172 to 108 ms; 3,914 to 4,607 ms | `f06-jit`: `q19B31`, `q19B33`, `q1B31`, `q1B33` |
| REPACK | 85.7 s at 65,996 rows/s, 30 rows per transaction | `f02-repack`: `wait`, `runcx30x` |
| Plans | 83 of 220 plans changed; 61 from one commit | `f10-plans`: `changed`, `total`, `commit` |
| LinkedIn | 645 people credited | `f01-numbers`: `pg19` |

On-air sources for the claims without numbers (podcast times, `captions/podcast.transcript.txt`):

- NOTIFY numbers and "that single global lock is still there": Nik, 00:17:01.
- Autovacuum prioritization, nothing to change: Kirk 00:19:23, Michael 00:21:10.
- lz4 for TOAST "if your Postgres was built with it": Michael, 00:28:42. JIT off: Michael, 00:27:46.
- REPACK on managed services without pg_repack: Kirk, 00:16:00. Based on pg_squeeze: commit 28d534e2ae0ac888b5460f977a10cd9bb017ef98.
- pg_upgrade --check passes, then the upgrade fails: Nik, 00:41:00; settings and objects as corrected in `notes/corrections.md` (role, database or function).
- Kirk's quote: 00:24:33 (podcast time), words as heard in the audio (whisper large-v3 on the final video): "It was a great idea in 1975, okay? The problem is, we're 2026, baby." The clip's last word "baby." ends at 1574.12 s of the final video; the cut is at 1574.06 s, inside the 1573.93-1574.19 s silence by silencedetect (-35 dB), before "And".
