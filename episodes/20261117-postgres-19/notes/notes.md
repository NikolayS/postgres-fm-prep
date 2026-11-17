# Postgres 19

Postgres.FM episode 197 (number to confirm). Michael and Nik, with Kirk.

**DRAFT, 2026-11-17.** Nothing here is published. Open items for the host are at the end.

**Times.** Times in brackets are recording times, counted from Michael's "Hello, and welcome" (00:00:00 = 18:13:30 UTC in the samograph transcript). They come from Deepgram chunk times, so each is good to about 5 s. Before release, shift every time by the cold open and title card length, and subtract the cuts before that point (the edit cuts fillers and pauses, so later times drift more). Pre-show chatter (about 13 min) and post-show chatter (from 00:57:51) are not in the episode.

## Episode description

Michael is back! Nik, Michael and Kirk discuss Postgres 19: why the release came in November and not in September, the features they like most, and what to check before you upgrade. They cover REPACK (CONCURRENTLY), LISTEN/NOTIFY with many listeners, autovacuum prioritization, plan advice, WAIT FOR LSN, new defaults, and how to test an upgrade now that AI makes testing cheaper.

## Links

Here are some links to things they mentioned:

Times are recording times of the first mention (see the note above).

### Main link

- [00:24:00] Postgres 19 for people who run it: PostgreSQL 19 RC2 vs 18.7 (study brief, PostgresAI): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c

### The release

- [00:02:25] PostgreSQL 19 release notes: https://www.postgresql.org/docs/19/release-19.html
- [00:04:09] PostgreSQL security information (18.6 fixed 28 CVEs, 18.7 fixed 52): https://www.postgresql.org/support/security/
- [00:06:05] What LLMs do to PostgreSQL and DBAs (depesz, 2026-11-09): https://www.depesz.com/2026/11/09/what-llms-do-to-postgresql-and-dbas/
- [00:09:13] scary patch contest (Robert Haas, pgsql-hackers, 2026-08-25): https://www.postgresql.org/message-id/CA%2BTgmob9NY6m0YNFTQ4nFH2d0iC9SQRruDYxfndGKKzh8OC80w%40mail.gmail.com
- [00:09:37] Are we reverting patches because of bugs found by AI? (Tomas Vondra, 2026-10-01): https://vondra.me/posts/are-we-reverting-patches-because-of-bugs-found-by-ai/
- [00:09:54] pgroast, an adversarial reviewer for Postgres proposals: https://github.com/NikolayS/pgroast

### REPACK

- [00:12:03] Add CONCURRENTLY option to REPACK (commit, Antonin Houska; based on pg_squeeze): https://github.com/postgres/postgres/commit/28d534e2ae0ac888b5460f977a10cd9bb017ef98
- [00:12:10] Our episode on pg_squeeze, with Antonin Houska: https://postgres.fm/episodes/pg_squeeze
- [00:16:04] What REPACK (CONCURRENTLY) costs while it runs (Radim Marek, boringSQL, 2026-09-28): https://boringsql.com/posts/repack-concurrently-costs/
- [00:18:15] pgcompacttable: https://github.com/dataegret/pgcompacttable

### LISTEN/NOTIFY and autovacuum

- [00:20:15] Postgres LISTEN/NOTIFY does not scale (Recall.ai, 2025): https://www.recall.ai/blog/postgres-listen-notify-does-not-scale
- [00:20:27] Our episode with DBOS: https://postgres.fm/episodes/dbos
- [00:20:40] Optimize LISTEN/NOTIFY via shared channel map and direct advancement (commit, Joel Jacobson): https://github.com/postgres/postgres/commit/282b1cde9dedf456ecf02eb27caf086023a7bb71
- [00:23:09] Add rudimentary table prioritization to autovacuum (commit, Nathan Bossart): https://github.com/postgres/postgres/commit/d7965d65fc5bb2139bc51c051c11428414c65160

### Plan advice

- [00:25:35] Waiting for Postgres 19: Better Planner Hints with Path Generation Strategies (Lukas Fittl, 5mins of Postgres): https://pganalyze.com/blog/5mins-postgres-19-better-planner-hints
- [00:26:52] Not Worth Doing: Features We Do Not Want (PostgreSQL wiki): https://wiki.postgresql.org/wiki/Not_Worth_Doing#Features_We_Do_Not_Want

### Other features

- [00:34:06] WAIT FOR (docs): https://www.postgresql.org/docs/19/sql-wait.html
- [00:39:41] instrumentation: Use Time-Stamp Counter on x86-64 to lower overhead (commit, Lukas Fittl, Andres Freund, David Geier): https://github.com/postgres/postgres/commit/294520c44487ecaade7a6ea8781b973f9ed03909

### Upgrade

- [00:45:35] pg_upgrade --check passes, then the upgrade fails (shihao zhong, pgsql-hackers, 2026-10-24): https://www.postgresql.org/message-id/CAGRkXqT%2B5%2BmQhoKZFTiM4yOZtVV%3DNW506vDwFtVeG%2BVmL_W5wQ%40mail.gmail.com

20 links in total, the main link included (the cap is 20).

### Candidates left out (swap in if wanted)

- [00:53:01] RegreSQL (Radim Marek): https://github.com/boringSQL/regresql
- [00:20:04] The hidden costs of CREATE TEMP TABLE (episode 196): https://postgres.fm/episodes/the-hidden-costs-of-create-temp-table
- [00:40:56] Dump/restore done. Now what? (episode 193): https://postgres.fm/episodes/dump-restore-done-now-what
- [00:31:32] jit: Change the default to off (commit, Jelte Fennema-Nio): https://github.com/postgres/postgres/commit/7f8c88c2b872cb74882ab93dcb05529dab2a10bc
- [00:33:39] Default to log_lock_waits=on (commit, Laurenz Albe): https://github.com/postgres/postgres/commit/2aac62be8cbb870ccf8c5b3fbb8a4e4aa8a14a73
- [00:32:44] Change wal_compression=on to the first of zstd, lz4, pglz (commit, wenhui qiu): https://github.com/postgres/postgres/commit/5838806ce696dd0759c5e4b87754e802612135e0
- [00:25:12] pg_plan_advice (docs): https://www.postgresql.org/docs/19/pgplanadvice.html
- [00:36:42] GitLab database load balancing, primary sticking by LSN (docs): https://docs.gitlab.com/development/database/load_balancing/
- [00:42:24] Include extended statistics data in pg_dump (commit, Corey Huinker): https://github.com/postgres/postgres/commit/c32fb29e979db4a7b92adb29007725eeacf91f64
- [00:46:03] Logical replication of sequences (docs): https://www.postgresql.org/docs/19/logical-replication-sequences.html
- [00:51:49] DBLab Engine 4.2.0, clone major upgrade: https://gitlab.com/postgres-ai/database-lab/-/releases/v4.2.0

~~~

What did you like or not like? What should we discuss next time? Let us know via a YouTube comment, on social media (https://postgres.fm/people), or by commenting on our Google doc (https://docs.google.com/document/d/1PNGSn_d0A7gTR4C0p6geQyHOTgdpitKCRvafCNnT-44/edit#heading=h.v4ncheatetql)!

~~~

Postgres FM is produced by:

- Michael Christofides, founder of pgMustard: https://pgmustard.com/
- Nikolay Samokhvalov, founder of PostgresAI: https://postgres.ai/

With credit to:

- Jessie Draws for the elephant artwork
- Intro and outro music: our own arrangement of Apple Loops from GarageBand (royalty-free under the GarageBand licence)

## Link check

All links above, the candidates too, returned HTTP 200 without logging in on 2026-11-17. Each was opened and matches its label. Notes:

- The Robert Haas thread is "scary patch contest", 2026-08-25. On air (00:09:13) Nik calls it a "Halloween scary list": the subject is scary, the date is not Halloween. No list of reverts from 2026-10-31 was found on pgsql-hackers.
- The DBOS episode (#184) is the one where we discussed LISTEN/NOTIFY; its notes link the Recall.ai post. The DBOS blog post itself is titled "Postgres LISTEN/NOTIFY Actually Scales", so do not label it as a "does not scale" source.
- The wiki anchor `Todo#Features_We_Do_Not_Want` no longer exists; the section moved to the Not_Worth_Doing page ("Oracle-style optimizer hints").
- pgroast (https://github.com/NikolayS/pgroast) is public, created 2026-11-11.
- The brief opens logged out; it is version 3.0 of the study ("Postgres 19 for people who run it: PostgreSQL 19 RC2 vs 18.7 (v3.0)"). Its numbers are for 19 RC2, not 19.0.
