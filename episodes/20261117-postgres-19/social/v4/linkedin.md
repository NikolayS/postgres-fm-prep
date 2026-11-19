# Episode 197 (Postgres 19): LinkedIn post, v4

DRAFT v4, 2026-11-19. Nothing is posted. Nik posts from his account today, Thu 19 Nov, ~2:00 PM PT (schedule: [`x-plan.md`](x-plan.md#schedule-pacific-time)). Every number is in the number check of [`x-plan.md`](x-plan.md#number-check); the trap is from the repro there.

Why v4: open with the upgrade trap (now reproduced), then the numbers.

Media: one PDF document (a swipeable carousel): `preview/social-v4/li-carousel.pdf`, 9 pages of 1080x1350. Page 1 is the upgrade trap with the real output; page 2 the measured scoreboard; then NOTIFY, autovacuum, lz4, JIT, REPACK, plan changes, and an end page with the YouTube thumbnail. Document title in the LinkedIn editor: "Postgres 19 vs 18.7: what we measured".

Tags: type "@" and pick the person in the editor. Michael Christofides https://www.linkedin.com/in/michristofides/, Kirk Wolak https://www.linkedin.com/in/kirk-wolak-7706737/. Ask Michael to repost within 30 minutes.

### Post — media: `li-carousel.pdf`

```text
pg_upgrade --check says "Clusters are compatible". Then the upgrade to Postgres 19 fails.

We reproduced it today, 18.7 to 19 RC2: escape_string_warning, or standard_conforming_strings = off, set on a role, a database or a function. Find them in pg_db_role_setting and pg_proc, and upgrade a clone first.

The good news, 19 RC2 vs 18.7 in our tests:
- LISTEN/NOTIFY with 1,000 listeners: 200 to 11,040 notifications per second, and our test client was the limit
- Autovacuum got to a table near wraparound in 12.9 s, not 152.3 s
- lz4 TOAST: 200,000 jsonb docs inserted in 44 s, not 107 s

We talk it through in the new postgres.fm episode: Michael Christofides, Kirk Wolak and I. Thank you to the 645 people credited in the 19 release notes.

Which 19 feature do you test first? Links in the first comment.
```

### First comment

```text
Watch: https://youtu.be/VcDU-NRE3hI
Listen: https://postgres.fm/episodes/postgres-19
All the numbers, with methods: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
```

Source for "645 people credited": `f01-numbers`, key `pg19`. The thank-you line is Nik's own, not an on-air quote.
