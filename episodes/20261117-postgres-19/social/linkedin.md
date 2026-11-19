# Episode 197 (Postgres 19): LinkedIn post

DRAFT v4, 2026-11-19. Nothing is posted. Nik posts from his account. Numbers in the first line; links in the first comment, not in the post; no emojis; only our product named. Every number matches the cards; the number check is in [`x-thread.md`](x-thread.md#number-check). 1204 characters (limit for this draft: 1,300).

Tags: type "@" and pick the person in the LinkedIn editor. Verified on https://postgres.fm/people: Michael Christofides https://www.linkedin.com/in/michristofides/, Kirk Wolak https://www.linkedin.com/in/kirk-wolak-7706737/.

Images, in this order (`preview/social/`, git-ignored):
1. `li1-notify-autovac.png` (1200x1200: NOTIFY and autovacuum cards)
2. `li2-jit-plans.png` (1200x1200: JIT and plans cards)
3. `li3-thumbnail.jpg` (the YouTube thumbnail, 1280x720)

## Post

```
Postgres 19, LISTEN/NOTIFY with 1,000 listeners, synthetic test: 200 notifications per second on 18.7, 11,040 on 19 RC2 (at least: our client was the limit).

New Postgres FM episode, out now. Michael Christofides, Kirk Wolak and I talk about our favorite Postgres 19 features and what to check before you upgrade. What we measured, 19 RC2 against 18.7:

- Autovacuum order: a table near wraparound, placed last of 121, got vacuum after 12.9 s on 19, 152.3 s on 18.7.
- lz4 for TOAST by default: 200,000 jsonb documents of 16 KiB inserted in 44 s, 107 s with pglz.
- jit = off by default cuts both ways. On 22 TPC-H-derived queries, a short one went from 172 ms to 108 ms (-37%), the longest from 3,914 ms to 4,607 ms (+17.7%).
- pg_upgrade --check can say OK, and the upgrade still fails: escape_string_warning or standard_conforming_strings = off set on a role, database or function.
- 83 of 220 query plans changed, 61 of them from one commit.

Also: 96 PostgreSQL CVEs in 2026 up to November 18, against 2 to 10 per year in 2019-2025.

My advice: do not wait for 19.1. Test on clones now, and give plan changes a month or two.

Which Postgres 19 feature do you test first? Links in the first comment.
```

## First comment

```
Watch: https://youtu.be/VcDU-NRE3hI
Listen (any podcast app): https://postgres.fm/episodes/postgres-19
Study brief, 19 RC2 vs 18.7: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
```
