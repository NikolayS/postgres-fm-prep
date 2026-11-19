# Episode 197 (Postgres 19): X thread, v2

DRAFT v2, 2026-11-19. Nothing is posted. Nik posts from his account. Why v2: [`teardown.md`](teardown.md). LinkedIn: [`linkedin.md`](linkedin.md). Phone-size preview of every post with its media: `preview/social-v2-sheet.png`.

Rules kept from v1: first post stands alone and has no link; links in the last post; no emojis; every number from a card in `../../cards/` (table below). New in v2: post 1 is a scoreboard of what changes for the reader (the hook), with motion; one idea per post; channel style (black, Impact, cream and orange); every image is 1080x1350 and reads on a phone.

Media: `preview/social-v2/` (git-ignored, like all of `preview/`). Rebuild everything with `bun episodes/20261117-postgres-19/social/v2/build/build.ts`. The images read their numbers from the card files at build time.

Handles: Michael https://x.com/michristofides. Kirk has no X account on https://postgres.fm/people, so plain "Kirk Wolak". Character counts are X counts (a link = 23; limit 280); `build.ts sheet` checks them.

---

### 1/ First post, no link — media: `x1-hero.mp4`

16 s, silent animation: the five rows come in one by one, the 19 numbers count up, then a 7 s hold on the full table. Poster frame and still: `s00-hero.png`.

```text
Postgres 19 is out. We tested 19 RC2 against 18.7. What changes for you:

- LISTEN/NOTIFY, 1,000 listeners: 200/s to 11,040/s
- Autovacuum gets to a table near wraparound in 12.9 s, not 152.3 s
- 83 of 220 query plans changed

New postgres.fm with @michristofides and Kirk Wolak.
```

### 2/ NOTIFY — media: `s01-notify.png`

```text
LISTEN/NOTIFY, 1,000 listeners, each on its own channel: 55x or more on 19. Our test client was the limit, so 19 can go higher.

What did not change: the global lock at commit. With many concurrent writing transactions, NOTIFY can still be the bottleneck.
```

### 3/ Autovacuum — media: `s02-autovac.png`

```text
Michael's and Kirk's favorite: autovacuum now ranks tables.

One table near wraparound among 120 bloated ones. On 18.7 it was last of 121, and autovacuum started on it after 152.3 s. On 19 it was first, after 12.9 s.

Nothing to configure. Upgrade, and it works.
```

### 4/ lz4 default — media: `s03-lz4.png`

```text
New default: TOAST uses lz4, if Postgres is built with it.

200,000 jsonb docs of 16 KiB: inserted in 44 s on 19, 107 s with pglz on 18.7.

The cost: the table is 11.3% larger. If disk matters more, set default_toast_compression = pglz.
```

### 5/ JIT default — media: `s04-jit.png`

```text
New default: jit = off. It cuts both ways.

On TPC-H-derived queries, a short one went from 172 to 108 ms. The longest went from 3,914 to 4,607 ms.

JIT itself did not change. Check your long analytical queries.
```

### 6/ REPACK — media: `s05-repack.png`

```text
REPACK (CONCURRENTLY) is in core, based on pg_squeeze. You get it on managed services that do not ship pg_repack.

Watch the final lock. At 65,996 rows/s of writes, 30 rows per transaction, it waited 85.7 s in our test.
```

### 7/ Plan advice — media: `x6-kirk-1975.mp4`

35 s, sound on, burned captions under the tile (never on the face), two pieces of one answer joined at a pause, ends on the postgres.fm card. Check strip: `x6-kirk-1975.check.png`.

```text
pg_plan_advice is new in 19: keep a good plan on the server, with no hints in the app.

Kirk on hints: "a great idea in 1975. The problem is, we're 2026, baby."

The cost in our test: 11% to 14% less throughput on a trivial query, with advice generated for every query.
```

### 8/ Upgrade trap — media: `s06-upgrade.png`

```text
Before you upgrade: pg_upgrade --check can say OK, and the upgrade still fails.

The cause: standard_conforming_strings = off, or escape_string_warning, set on a role, a database or a function. 19 removed one and requires the other on.

Upgrade a clone first.
```

### 9/ Plan changes — media: `s07-plans.png`

```text
Also before you upgrade: diff your plans.

Same data, same statistics, planned on 18.7 and 19 RC2: 83 of 220 query plans changed. 61 of them come from one planner commit, a tie-break.
```

### 10/ Links — media: `x8-thumbnail.jpg`

```text
My advice: do not wait for 19.1. Start testing now, and give yourself a month or two.

Which 19 feature do you test first?

Watch: https://youtu.be/VcDU-NRE3hI
Listen: https://postgres.fm/episodes/postgres-19
Data: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
```

## Number check

Card keys are `numbers.<key>` in `../../cards/<card>.card.json`; each key has its raw file and the command that recomputes it.

| Post | Number | Source |
| --- | --- | --- |
| 1, 2 | 1,000 listeners; 200/s on 18.7; 11,040/s on 19 RC2 | `f03-notify`: literal, `pg18`, `pg19` |
| 2 | 55x or more | 11,040 / 200 = 55.2, rounded down; client-limited (notes, "About the numbers") |
| 1, 3 | 152.3 s on 18.7; 12.9 s on 19; last of 121 | `f04-autovac`: `pg18`, `pg19`, `rank` |
| 3 | 120 bloated tables, near wraparound (age 1.65 billion) | `notes/notes.md`, "About the numbers" |
| 1, 9 | 83 of 220 plans changed; 61 from one commit | `f10-plans`: `changed`, `total`, `commit` |
| 4 | 200,000 docs of 16 KiB; 44 s lz4; 107 s pglz | `f07-lz4`: `docs`, `kib`, `pg19`, `pg18` |
| 4 | table 11.3% larger with lz4 | `notes/notes.md`, "About the numbers" |
| 5 | 172 to 108 ms; 3,914 to 4,607 ms (image: -37%, +17.7%) | `f06-jit`: `q19B31`, `q19B33`, `q1B31`, `q1B33`, `q19change`, `q1change` |
| 6 | 85.7 s at 65,996 rows/s, 30 rows per transaction | `f02-repack`: `wait`, `runcx30x` (series "30 rows/tx") |
| 7 | 11% to 14% | `f11-advice`: `lossOff`, `lossLoaded` |

On-air sources for the claims without numbers (podcast times, `captions/podcast.transcript.txt`):

- NOTIFY numbers and "that single global lock is still there": Nik, 00:17:01.
- Autovacuum prioritization as a favorite: Kirk 00:19:23 ("The other one I like is the autovacuum one"), Michael 00:21:10 ("you don't have to change anything as a user").
- lz4 for TOAST "if your Postgres was built with it": Michael, 00:28:42. JIT off is a better default: Michael, 00:27:46.
- REPACK on managed services without pg_repack: Kirk, 00:16:00. Based on pg_squeeze: commit 28d534e2ae0ac888b5460f977a10cd9bb017ef98.
- pg_upgrade --check passes, then the upgrade fails: Nik, 00:41:00; the settings and objects as corrected in `notes/corrections.md` (role, database or function, not a table).
- Kirk's quote: 00:24:33 ("It was a great idea in 1975, okay? The problem is, it's 2026, baby"; the clip's captions follow the audio, "we're 2026").
- "Do not wait for .1": Nik, 00:44:35. "A month or two": Nik, 00:50:38.
- The upgrade slide shows an example `ALTER ROLE` and the outcome as labels (OK, FAILS), not pg_upgrade's output; the slide says so.
