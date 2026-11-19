# Episode 197 (Postgres 19): X thread

DRAFT v3, 2026-11-19. Nothing is posted. Nik posts from his accounts. Rules: numbers in the first line; no link in the first post (links in the last reply); one media item per post; simple English; no emojis; only our product named. LinkedIn variant: [`linkedin.md`](linkedin.md). One-page preview of both: `preview/social-preview.png`.

Handles (checked 2026-11-19 on https://postgres.fm/people): Michael https://x.com/michristofides, Nik https://x.com/samokhvalov, the show https://x.com/PostgresFM. Kirk has no X account listed there (LinkedIn and GitHub only), so plain "Kirk Wolak".

Live: YouTube https://youtu.be/VcDU-NRE3hI ("Postgres 19 is out! What survived the revert fest?"); https://postgres.fm/episodes/postgres-19 returned HTTP 200 on 2026-11-19. Character counts are X counts (a link = 23; limit 280).

Media: `preview/social/` (git-ignored, like all of `preview/`). The 1200x675 card images are rendered from `../cards/*.card.json` with the card renderer (`tools/podcast-edit/overlays/src/card-svg.ts`); no new charts. Nothing in the bottom 180 px, no faces covered. Not used: the REPACK card (its axis labels overlap at this size) and the plan advice card (its hero splits "-11 to -14%" over two lines).

---

### 1/ First post (no link) — 277 chars — media: `preview/social/x1-notify.png` (NOTIFY card, 1200x675)

```
Postgres 19, LISTEN/NOTIFY with 1,000 listeners, synthetic test:

18.7: 200 notifications/s
19 RC2: 11,040/s, at least (our client was the limit)

New Postgres FM out now. Michael @michristofides, Kirk Wolak and I on our favorite 19 features and what to check before upgrading.
```

### 2/ Reply — 223 chars — media: `preview/social/x2-cves.png` (CVE card, 1200x675)

```
Part of why 19 came in November, not September: security work.

PostgreSQL CVEs in 2026, to Nov 18: 96. From 2019 to 2025: 2 to 10 per year.

The 18.7 release alone fixed 52 CVEs, 34x the average minor release of 2019-2025.
```

### 3/ Reply — 255 chars — media: `preview/social/x3-autovac.png` (autovacuum card, 1200x675)

```
Two favorites, 19 RC2 vs 18.7, synthetic tests:

- Autovacuum order. A table near wraparound, placed last of 121: vacuum started after 12.9 s on 19, 152.3 s on 18.7
- lz4 for TOAST by default: 200,000 jsonb docs of 16 KiB inserted in 44 s, 107 s with pglz
```

### 4/ Reply — 270 chars — media: `preview/social/x4-jit.png` (JIT card, 1200x675)

```
New defaults cut both ways. jit = off on 19, TPC-H-derived queries:

- a short query: 172 ms to 108 ms (-37%)
- the longest query: 3,914 ms to 4,607 ms (+17.7%)

REPACK (CONCURRENTLY) is in core. Watch the final lock: 85.7 s wait in our test, at 65,996 rows/s of writes.
```

### 5/ Reply — 249 chars — media: `preview/social/x5-plans.png` (plans card, 1200x675)

```
Before you upgrade:

- pg_upgrade --check can say OK, and the upgrade still fails: escape_string_warning or standard_conforming_strings = off set on a role, database or function
- 83 of 220 query plans changed in our test, 61 of them from one commit
```

### 6/ Reply — 275 chars — media: `preview/social/x6-clip-kirk-1975.mp4` (Kirk, "Plan hints, to me, is the 1975 solution", 56 s, 1080x1080, captions, ends on postgres.fm)

```
pg_plan_advice can keep a good plan without hints in the app. Kirk's take on hints: a 1975 solution.

Advice for every query cost 11% to 14% throughput on a trivial query in our test.

My advice: do not wait for 19.1. Test on clones now, and give plan changes a month or two.
```

### 7/ Reply (links) — 152 chars — media: `preview/social/x7-thumbnail.jpg` (the YouTube thumbnail; an attached image replaces the link card)

```
Which 19 feature do you test first?

Watch: https://youtu.be/VcDU-NRE3hI
Listen: https://postgres.fm/episodes/postgres-19
Study brief, 19 RC2 vs 18.7: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
```

## Number check

Every number is from a card in `../cards/` (the card's `numbers.<key>`; its `source` gives the raw file and the command that recomputes it), except where marked.

| Post | Number | Card and key |
| --- | --- | --- |
| 1 | 1,000 listeners; 200/s on 18.7; 11,040/s on 19 RC2 | `f03-notify`: literal 1,000, `pg18`, `pg19`. "At least, client-limited": brief v3.0 and recording notes lead 3 (8-vCPU dedicated host, 4 notifiers, median of 3 runs). |
| 2 | 96 CVEs in 2026 (to 2026-11-18) | `f00-cves`: `y2026` |
| 2 | 2 to 10 per year, 2019-2025 | `f00-cves`: min `y2022` = 2, max `y2019` = 10 |
| 2 | 52 CVEs in 18.7; 34x the average minor release 2019-2025 | `f00-cves`: `b18_7`, `ratio` |
| 3 | last of 121; 12.9 s on 19; 152.3 s on 18.7 | `f04-autovac`: `rank`, `pg19`, `pg18` |
| 3 | 200,000 jsonb docs of 16 KiB; 44 s lz4; 107 s pglz | `f07-lz4`: `docs`, `kib`, `pg19`, `pg18` |
| 4 | short query 172 to 108 ms, -37%; longest query 3,914 to 4,607 ms, +17.7% | `f06-jit`: `q19B31`, `q19B33`, `q19change`, `q1B31`, `q1B33`, `q1change` |
| 4 | jit: 22 TPC-H-derived queries (scale factor 10) | `notes/notes.md` line 31; recording notes, JIT finding |
| 4 | REPACK final lock wait 85.7 s at 65,996 rows/s of writes | `f02-repack`: `wait`, `runcx30x` (30 rows per transaction, uncapped writers) |
| 5 | 83 of 220 plans changed; 61 of 83 from one commit | `f10-plans`: `changed`, `total`, `commit` |
| 6 | 11% to 14% throughput cost, advice generated for every query, trivial query | `f11-advice`: `lossOff` (-11, vs advice off), `lossLoaded` (-14, vs a loaded stash) |

Facts without numbers:

- REPACK (CONCURRENTLY) in core, based on pg_squeeze: commit 28d534e2ae0ac888b5460f977a10cd9bb017ef98.
- `pg_upgrade --check` says OK, the upgrade fails (escape_string_warning, or standard_conforming_strings = off, on a role, database or function): recording notes lead 1; shihao zhong's report, pgsql-hackers, 2026-10-24; corrected wording in `../notes/corrections.md` (00:45:14).
- jit off by default: commit 7f8c88c2b87. lz4 for TOAST by default (when built with lz4): commit 34dfca29343.
- Part of the delay was security work: on air (Michael, Nik, about 00:07:58 in the final, the CVE card).
- "Do not wait for 19.1": Nik at 00:49:23 (recording); "a month or two": Nik at 00:56:40 (recording).
