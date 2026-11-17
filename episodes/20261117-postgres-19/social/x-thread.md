# Episode 197 (Postgres 19): X thread and LinkedIn post

DRAFT, 2026-11-17. Nothing is posted. Nik posts from his accounts. Rules: no link in the first post (links in the last reply); numbers in the first line; simple English; no emojis (none approved for this one); only our product named.

Handles: Michael @michristofides, Kirk @yugedilbertfan, the show @postgresfm, Nik @samokhvalov. Before posting, replace the YouTube placeholder and check that https://postgres.fm/episodes/postgres-19 is live (slug to confirm).

Character counts are X counts (a link = 23; limit 280).

---

## v1 (2026-11-17)

4 posts.

### 1/ First post (no link) — 278 chars — media: the brief's NOTIFY chart (18.7 vs 19 RC2, 1,000 listeners), or a speaker clip of Nik at 00:20:59 to 00:21:14

```
Postgres 19, LISTEN/NOTIFY with 1,000 listeners, each on its own channel:

18.7: 200 notifications/s
19 RC2: at least 11,040/s

New Postgres FM: @michristofides joins Kirk Wolak @yugedilbertfan and me for this one. Our favorite 19 features, and what to check before you upgrade.
```

### 2/ Reply — 251 chars — media: speaker clip: Michael at 00:15:38 to 00:16:10, or Kirk at 00:16:14 to 00:16:50

```
REPACK (CONCURRENTLY) is in core now, based on pg_squeeze. Michael thinks it will be fine for most workloads.

Watch the final lock. In our tests on 19 RC2: the longer the first catch-up pass and the faster the writes, the longer the table is blocked.
```

### 3/ Reply — 266 chars — media: none

```
Before the upgrade:

- pg_upgrade --check says OK, the upgrade still fails: escape_string_warning or standard_conforming_strings = off set on a role or database
- new defaults: jit off, log_lock_waits on, lz4 for TOAST, wal_compression = on means zstd on PGDG builds
```

### 4/ Reply — 230 chars — media: none (link card)

```
My advice: do not wait for 19.1. Start testing now, on clones, and give yourself a month or two to study plan changes.

Brief (19 RC2 vs 18.7): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
Listen: https://postgres.fm/episodes/postgres-19
Watch: https://www.youtube.com/watch?v=XXXXXXXXXXX
```

## LinkedIn (v1)

Media: the brief's NOTIFY chart, or the cold-open clip. Links in the first comment: Brief / Listen / Watch, as in reply 4.

```
Postgres 19, LISTEN/NOTIFY with 1,000 listeners, each on its own channel: 200 notifications per second on 18.7, at least 11,040 on 19 RC2.

New Postgres FM episode: Michael Christofides joins Kirk Wolak and me for this one. We went through our favorite Postgres 19 features, and what to check before you upgrade:

- REPACK (CONCURRENTLY) is in core, based on pg_squeeze. Michael thinks it is fine for most workloads; on a very large, busy table I still have doubts. Watch the final lock: the longer the first catch-up pass and the faster the writes, the longer the table is blocked.
- NOTIFY wakes only the listeners of its channel. The global lock at commit is still there.
- Autovacuum now orders tables by a score. In our test, a table at 1.65 billion XIDs, placed last of 121, started after about 13 s on 19 RC2 and about 152 s on 18.7 (16-vCPU dedicated host, 3 trials; the worst case for 18).
- pg_plan_advice and pg_stash_advice: keep a good plan for a query from SQL, with no hints in the application code.
- New defaults: jit off, log_lock_waits on, lz4 for TOAST, and wal_compression = on now means zstd on PGDG builds. Check that every standby has zstd.
- pg_upgrade --check can say OK, and the upgrade still fails: a removed or now-rejected setting on a role, database or function.

My advice: do not wait for 19.1 or 19.2. Start testing now, on clones, and give yourself a month or two to study plan changes.

Video, podcast (Spotify, Apple Podcasts, any app) and our study brief: first comment.
(NOTIFY: 8-vCPU dedicated host, 4 notifiers, median of 3 runs; our client was the limit, so 11,040 is a lower bound.)
```

## Number check

- 200 vs at least 11,040 notifications/s, 1,000 listeners each on its own channel: brief v3.0 and recording notes lead 3 (8-vCPU dedicated host, 4 notifiers, median of 3 runs, client-limited lower bound). Said on air at 00:21:02 as "200 to 11,000".
- REPACK (CONCURRENTLY) based on pg_squeeze: commit 28d534e2ae0ac888b5460f977a10cd9bb017ef98 ("heavily based on his own pg_squeeze"). "Fine for most workloads": Michael at 00:15:38, his opinion.
- The final-lock rule: brief v3.0, recording notes lead 2 ("The longer the first catch-up pass and the faster the writes, the longer the block"). Measured on 19 RC2.
- NOTIFY global lock at commit stays: async.c at REL_19_RC2, PreCommit_Notify.
- Autovacuum order: commit d7965d65fc5; brief quick hit 4 (a table placed last at 1.65 billion XIDs started at about 13 s on 19, about 152 s on 18.7). The LinkedIn post uses these two numbers (16-vCPU dedicated host, 3 trials).
- Removed or now-rejected settings (escape_string_warning, standard_conforming_strings = off) on a role, database or function pass --check, then the upgrade fails: recording notes lead 1; shihao zhong's report, pgsql-hackers, 2026-10-24.
- New defaults: commits 7f8c88c2b87 (jit), 2aac62be8cb (log_lock_waits), 34dfca29343 (lz4 TOAST, when built with lz4), 5838806ce69 (wal_compression = on picks zstd, lz4, pglz in that order). "zstd on PGDG": recording notes demo 2.
- "Do not wait for 19.1 or 19.2": Nik at 00:49:23; "a month or two": Nik at 00:56:40.
