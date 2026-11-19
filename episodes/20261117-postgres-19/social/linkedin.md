# Episode 197 (Postgres 19): LinkedIn post

DRAFT v3, 2026-11-18. Nothing is posted. Nik posts from his account. Numbers in the first line; links in the first comment, not in the post; no emojis; only our product named. Every number matches the cards; the number check is in [`x-thread.md`](x-thread.md#number-check).

Media: the NOTIFY card (`preview/illus-03-notify.png`) or the square speaker clip (`preview/clip-kirk-1975-1080x1080.mp4`).

## Post

```
Postgres 19, LISTEN/NOTIFY with 1,000 listeners: 200 notifications per second on 18.7, 11,040 on 19 RC2 (at least: our client was the limit).

New Postgres FM episode. Michael Christofides is back, and Kirk Wolak, Michael and I talk about our favorite Postgres 19 features, and what to check before you upgrade. What we measured on 19 RC2 against 18.7:

1. Security. Part of why 19 came in November: 96 PostgreSQL CVEs in 2026 so far, against 2 to 10 per year from 2019 to 2025. The 18.7 release alone fixed 52, 34x the average minor release.

2. LISTEN/NOTIFY. NOTIFY now wakes only the listeners of its channel. The global lock at commit is still there.

3. Autovacuum order. Tables now get a score. A table near wraparound, placed last of 121: vacuum started after 12.9 s on 19, 152.3 s on 18.7.

4. lz4 for TOAST by default. 200,000 jsonb documents of 16 KiB: inserted in 44 s, against 107 s with pglz.

5. jit = off by default. A short query went from 172 ms to 108 ms (-37%). The longest query went from 3,914 ms to 4,607 ms (+17.7%). Check your analytics.

6. REPACK (CONCURRENTLY) is in core, based on pg_squeeze. Watch the final lock: with fast writes, the final lock wait was 85.7 s in our test.

7. pg_plan_advice keeps a good plan for a query without hints in the application. Generating advice for every query cost 11% to 14% throughput on a trivial query.

8. pg_upgrade --check can say OK, and the upgrade still fails: escape_string_warning, or standard_conforming_strings = off, set on a role, database or function.

9. Plans change. 83 of 220 query plans changed in our test, 61 of them from one commit.

My advice: do not wait for 19.1. Start testing now, on clones, and give yourself a month or two to study plan changes.

Which Postgres 19 feature do you test first?

Video, podcast and our study brief: first comment.
```

## First comment

```
Watch: https://www.youtube.com/watch?v=XXXXXXXXXXX
Listen (any podcast app): https://postgres.fm/episodes/postgres-19
Study brief, 19 RC2 vs 18.7: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
```

Before posting: replace the YouTube placeholder and check that the postgres.fm page is live.
