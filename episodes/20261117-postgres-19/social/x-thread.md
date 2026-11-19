# Episode 197 (Postgres 19): X thread

DRAFT v2, 2026-11-18. Nothing is posted. Nik posts from his accounts. Rules: numbers in the first line; no link in the first post (links in the last reply); simple English; no emojis; only our product named. LinkedIn variant: [`linkedin.md`](linkedin.md).

Handles (checked 2026-11-18): Michael @michristofides (linked from https://www.pgmustard.com/about), the show @PostgresFM (linked from https://postgres.fm), Nik @samokhvalov (GitHub profile of NikolayS). Kirk: no verified X handle (no link on his GitHub profile, https://github.com/kirkw), so plain "Kirk Wolak"; add the handle only when Nik confirms it.

Before posting: replace the YouTube placeholder, and check that https://postgres.fm/episodes/postgres-19 is live. Character counts are X counts (a link = 23; limit 280).

---

### 1/ First post (no link) — 273 chars — media: the NOTIFY card (`preview/illus-03-notify.png`), or the NOTIFY speaker clip if one is cut

```
Postgres 19, LISTEN/NOTIFY with 1,000 listeners:

18.7: 200 notifications/s
19 RC2: 11,040/s (at least: our client was the limit)

New Postgres FM. Michael @michristofides is back: Kirk Wolak, Michael and I on our favorite 19 features, and what to check before you upgrade.
```

### 2/ Reply — 219 chars — media: the CVE card (`preview/illus-09-cves-v3.png`)

```
Part of why 19 came in November, not September: security work.

PostgreSQL CVEs in 2026 so far: 96. From 2019 to 2025: 2 to 10 per year.

The 18.7 release alone fixed 52 CVEs, 34x the average minor release of 2019-2025.
```

### 3/ Reply — 246 chars — media: the autovacuum card (`preview/illus-04-autovac.png`)

```
Favorites, measured on 19 RC2 vs 18.7:

- Autovacuum order: a table near wraparound, placed last of 121. Vacuum started after 12.9 s on 19, 152.3 s on 18.7
- lz4 for TOAST by default: 200,000 jsonb docs of 16 KiB inserted in 44 s, 107 s with pglz
```

### 4/ Reply — 256 chars — media: the JIT card (`preview/illus-06-jit.png`)

```
New defaults cut both ways. jit = off on 19:

- a short query: 172 ms to 108 ms (-37%)
- the longest query: 3,914 ms to 4,607 ms (+17.7%)

REPACK (CONCURRENTLY) is in core. Watch the final lock. With fast writes, the final lock wait was 85.7 s in our test.
```

### 5/ Reply — 249 chars — media: the plans card (`preview/illus-08-plans.png`)

```
Before the upgrade:

- pg_upgrade --check can say OK, and the upgrade still fails: escape_string_warning or standard_conforming_strings = off set on a role, database or function
- 83 of 220 query plans changed in our test, 61 of them from one commit
```

### 6/ Reply — 264 chars — media: Kirk's speaker clip, "1975 solution ... 2026, baby" (`preview/clip-kirk-1975-*.mp4`)

```
pg_plan_advice can keep a good plan without hints in the app. Generating advice for every query cost 11% to 14% throughput on a trivial query in our test.

My advice: do not wait for 19.1. Test on clones now, and give yourself a month or two to study plan changes.
```

### 7/ Reply — 147 chars — media: none (link card)

```
Which 19 feature do you test first?

Brief (19 RC2 vs 18.7): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
Listen: https://postgres.fm/episodes/postgres-19
Watch: https://www.youtube.com/watch?v=XXXXXXXXXXX
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
| 4 | REPACK final lock wait 85.7 s with fast writes | `f02-repack`: `wait` (30 rows per transaction, uncapped writers, `runcx30x` = 65,996 rows/s) |
| 5 | 83 of 220 plans changed; 61 of 83 from one commit | `f10-plans`: `changed`, `total`, `commit` |
| 6 | 11% to 14% throughput cost, advice generated for every query, trivial query | `f11-advice`: `lossOff` (-11, vs advice off), `lossLoaded` (-14, vs a loaded stash) |

Facts without numbers:

- REPACK (CONCURRENTLY) in core, based on pg_squeeze: commit 28d534e2ae0ac888b5460f977a10cd9bb017ef98.
- `pg_upgrade --check` says OK, the upgrade fails (escape_string_warning, or standard_conforming_strings = off, on a role, database or function): recording notes lead 1; shihao zhong's report, pgsql-hackers, 2026-10-24; corrected wording in `../notes/corrections.md` (00:45:14).
- jit off by default: commit 7f8c88c2b87. lz4 for TOAST by default (when built with lz4): commit 34dfca29343.
- Part of the delay was security work: on air (Michael, Nik, about 00:07:58 in the final, the CVE card).
- "Do not wait for 19.1": Nik at 00:49:23 (recording); "a month or two": Nik at 00:56:40 (recording).
