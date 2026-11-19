# Episode 197 (Postgres 19): LinkedIn post, v2

DRAFT v2, 2026-11-19. Nothing is posted. Nik posts from his account. Why v2: [`teardown.md`](teardown.md). Every number is in the number check of [`x-thread.md`](x-thread.md#number-check), plus 645 (`f01-numbers`: `pg19`).

Media: one PDF document (LinkedIn shows it as a swipeable carousel): `preview/social-v2/li-carousel.pdf`, 9 pages of 1080x1350: the scoreboard, NOTIFY, autovacuum, lz4, JIT, REPACK, the upgrade trap, plan changes, and an end page with the YouTube thumbnail. Document title in the LinkedIn editor: "Postgres 19 vs 18.7: what we measured".

Tags: type "@" and pick the person in the editor. Michael Christofides https://www.linkedin.com/in/michristofides/, Kirk Wolak https://www.linkedin.com/in/kirk-wolak-7706737/ (both from https://postgres.fm/people).

The first two lines are what LinkedIn shows before "see more", so they carry the hook.

### Post — media: `li-carousel.pdf`

```text
Postgres 19 is out. Before we recorded the episode, we tested 19 RC2 against 18.7 on dedicated hosts. What changes for you, in numbers:

LISTEN/NOTIFY with 1,000 listeners: 200 notifications per second on 18.7, 11,040 on 19. At least: our test client was the limit. The global lock at commit is still there.

Autovacuum now ranks tables. One table near wraparound among 120 bloated ones: 18.7 got to it last, after 152.3 s. 19 got to it first, after 12.9 s. Nothing to configure.

TOAST uses lz4 by default, if Postgres is built with it: 200,000 jsonb documents of 16 KiB inserted in 44 s, not 107 s. The table is 11.3% larger.

jit = off by default cuts both ways: a short TPC-H-derived query went from 172 to 108 ms, the longest from 3,914 to 4,607 ms.

REPACK (CONCURRENTLY) is in core. Watch the final lock: it waited 85.7 s at 65,996 rows/s of writes in our test.

Before you upgrade:
- pg_upgrade --check can say OK, and the upgrade still fails, when standard_conforming_strings = off or escape_string_warning is set on a role, a database or a function.
- 83 of 220 query plans changed, 61 of them from one planner commit.

My advice: do not wait for 19.1. Test on clones now, and give yourself a month or two.

We talk it all through in the new postgres.fm episode: Michael Christofides, Kirk Wolak and I. Thank you to the 645 people credited in the 19 release notes.

Which Postgres 19 feature do you test first? Links in the first comment.
```

### First comment

```text
Watch: https://youtu.be/VcDU-NRE3hI
Listen: https://postgres.fm/episodes/postgres-19
All the numbers, with methods: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
```

Source for "645 people credited": `f01-numbers`, key `pg19` (names in the release-notes acknowledgments of 19); the episode shows this card at 00:02:24 (podcast time). The thank-you line is Nik's own, not an on-air quote.
