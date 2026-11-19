# Episode 197 (Postgres 19): LinkedIn post, v3

DRAFT v3, 2026-11-19. Nothing is posted. Nik posts from his account, Fri 20 Nov, 7:00 AM PT (schedule: [`x-plan.md`](x-plan.md#schedule-pacific-time)). Every number is in the number check of [`x-plan.md`](x-plan.md#number-check).

Why v3: cut to about 700 characters; the two lines before "see more" carry the strongest number and the trap.

Media: one PDF document (a swipeable carousel): `preview/social-v3/li-carousel.pdf`, 9 pages of 1080x1350. Page 1 is the new hero still (three rows, 55x chip); then NOTIFY, autovacuum, lz4, JIT, REPACK, the upgrade trap, plan changes, and an end page with the YouTube thumbnail. Document title in the LinkedIn editor: "Postgres 19 vs 18.7: what we measured".

Tags: type "@" and pick the person in the editor. Michael Christofides https://www.linkedin.com/in/michristofides/, Kirk Wolak https://www.linkedin.com/in/kirk-wolak-7706737/ (both from https://postgres.fm/people). Ask Michael to repost within 30 minutes.

### Post — media: `li-carousel.pdf`

```text
Postgres 19: LISTEN/NOTIFY with 1,000 listeners went from 200 to 11,040 notifications per second in our test. And pg_upgrade --check can say OK while the upgrade fails.

The NOTIFY number is a floor: our test client was the limit. Also, 19 RC2 vs 18.7:
- Autovacuum got to a table near wraparound in 12.9 s, not 152.3 s
- lz4 TOAST: 200,000 jsonb docs inserted in 44 s, not 107 s

The trap: standard_conforming_strings = off, or escape_string_warning, set on a role, a database or a function. Upgrade a clone first.

We talk it through in the new postgres.fm episode: Michael Christofides, Kirk Wolak and I. Thank you to the 645 people credited in the 19 release notes.

Which 19 feature do you test first? Links in the first comment.
```

### First comment

```text
Watch: https://youtu.be/VcDU-NRE3hI
Listen: https://postgres.fm/episodes/postgres-19
All the numbers, with methods: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
```

Source for "645 people credited": `f01-numbers`, key `pg19` (names in the release-notes acknowledgments of 19). The thank-you line is Nik's own, not an on-air quote.
