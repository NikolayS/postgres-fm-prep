# Postgres 19

Postgres.FM episode 197. Hosts: Nik, Michael and Kirk.

**DRAFT, 2026-11-17.** Nothing here is published. Open items for the host are at the end.

**Times.** Times in brackets are YouTube video times in the final video (`episode-197-final.mp4`: a 45 s cold open, then the edited show, then the outro). They come from the on-air time of the first mention plus a fixed offset to the recording, snapped to the nearest word and mapped through the cuts, so each is good to about 5 s. Chapter times in `youtube-description.txt` are anchored on the first words of each section. Pre-show and post-show chatter are not in the episode.

## Episode description

Kirk Wolak is joining Michael and me as a co-host. Nik, Michael and Kirk discuss Postgres 19: why the release came in November and not in September, the features they like most, and what to check before you upgrade. They cover REPACK (CONCURRENTLY), LISTEN/NOTIFY with many listeners, autovacuum prioritization, plan advice, WAIT FOR LSN, new defaults, and how to test an upgrade now that AI makes testing cheaper.

## Links

Here are some links to things they mentioned:

Times are YouTube video times of the first mention (see the note above).

### Main link

- [21:33] Postgres 19 for people who run it: PostgreSQL 19 RC2 vs 18.7 (study brief, PostgresAI): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
- [47:48] The plan comparison in the same brief: 4,273 queries planned on 18.7 and 19 RC2, causes of each plan change (section 3.6, "Diff your plans before you upgrade"): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c#plans

About the numbers on screen. They come from this study. Most are synthetic tests of setups we built; they are not failure or speed rates of real systems. Hosts, trials and caveats per card:
- Release credits: names in the release-notes acknowledgments of 10 to 19; commits in each development cycle (PostgreSQL git, data of 2026-11-11).
- REPACK (CONCURRENTLY): 19.0, 16 dedicated vCPU, 20,000,000-row table, 16 writer sessions; median of 3 runs per point (2 valid runs at the first point).
- LISTEN/NOTIFY: 1,000 listeners on their own channels, 4 notifiers, 8-vCPU dedicated host, median of 3 trials; our client was the limit, so 19 can go higher.
- Autovacuum order: one old table (age 1.65 billion) among 120 bloated tables, 16-vCPU dedicated host, median of 3 trials.
- Plan advice: advice generated for every query (always_store_advice_details), trivial query, small shared test host, 4 clients, 20 s, 2 trials; 11% against the modules off, 14% against them loaded and idle.
- JIT: 22 TPC-H-derived queries, scale factor 10, 32-vCPU dedicated host, 3 trials; per-query numbers are exploratory. JIT itself did not change; the default did.
- lz4 TOAST: insert of 200,000 jsonb documents of 16 KiB, 8-vCPU dedicated host, 3 trials. The table is 11.3% larger with lz4; if disk matters more, set default_toast_compression = pglz.
- Plan changes: 4,273 benchmark queries (263 templates; 220 stable on 18.7) planned on 18.7 and 19 RC2 with the same data and statistics; 61 of the 83 changed templates come from one planner commit (a tie-break), shown by a build without it.

### The release

- [02:40] PostgreSQL 19 release notes: https://www.postgresql.org/docs/19/release-19.html
- [06:04] What LLMs do to PostgreSQL and DBAs (depesz, 2026-11-09): https://www.depesz.com/2026/11/09/what-llms-do-to-postgresql-and-dbas/
- [08:39] scary patch contest (Robert Haas, pgsql-hackers, 2026-08-25): https://www.postgresql.org/message-id/CA%2BTgmob9NY6m0YNFTQ4nFH2d0iC9SQRruDYxfndGKKzh8OC80w%40mail.gmail.com
- [08:52] Are we reverting patches because of bugs found by AI? (Tomas Vondra, 2026-10-01): https://vondra.me/posts/are-we-reverting-patches-because-of-bugs-found-by-ai/
- [09:06] pgroast, an adversarial reviewer for Postgres proposals: https://github.com/NikolayS/pgroast

### Episodes we referred to

- [10:48] Our episode on pg_squeeze, with Antonin Houska: https://postgres.fm/episodes/pg_squeeze
- [17:46] The hidden costs of CREATE TEMP TABLE (our episode last week): https://postgres.fm/episodes/the-hidden-costs-of-create-temp-table
- [18:09] Our episode with DBOS, on LISTEN/NOTIFY at scale (its notes link the Recall.ai post): https://postgres.fm/episodes/dbos
- [37:46] Dump/restore done. Now what? (our episode 193): https://postgres.fm/episodes/dump-restore-done-now-what

### REPACK

- [10:41] Add CONCURRENTLY option to REPACK (commit, Antonin Houska; based on pg_squeeze): https://github.com/postgres/postgres/commit/28d534e2ae0ac888b5460f977a10cd9bb017ef98
- [14:21] What REPACK (CONCURRENTLY) costs while it runs (Radim Marek, boringSQL, 2026-09-28): https://boringsql.com/posts/repack-concurrently-costs/

### LISTEN/NOTIFY and autovacuum

- [18:22] Optimize LISTEN/NOTIFY via shared channel map and direct advancement (commit, Joel Jacobson): https://github.com/postgres/postgres/commit/282b1cde9dedf456ecf02eb27caf086023a7bb71
- [20:45] Add rudimentary table prioritization to autovacuum (commit, Nathan Bossart): https://github.com/postgres/postgres/commit/d7965d65fc5bb2139bc51c051c11428414c65160

### Plan advice

- [23:06] Waiting for Postgres 19: Better Planner Hints with Path Generation Strategies (Lukas Fittl, 5mins of Postgres): https://pganalyze.com/blog/5mins-postgres-19-better-planner-hints

### Other features

- [28:45] jit: Change the default to off (commit, Jelte Fennema-Nio): https://github.com/postgres/postgres/commit/7f8c88c2b872cb74882ab93dcb05529dab2a10bc
- [31:09] WAIT FOR (docs): https://www.postgresql.org/docs/19/sql-wait.html
- [36:33] instrumentation: Use Time-Stamp Counter on x86-64 to lower overhead (commit, Lukas Fittl, Andres Freund, David Geier): https://github.com/postgres/postgres/commit/294520c44487ecaade7a6ea8781b973f9ed03909

### Upgrade

- [41:51] pg_upgrade --check passes, then the upgrade fails (shihao zhong, pgsql-hackers, 2026-10-24): https://www.postgresql.org/message-id/CAGRkXqT%2B5%2BmQhoKZFTiM4yOZtVV%3DNW506vDwFtVeG%2BVmL_W5wQ%40mail.gmail.com
- [48:46] RegreSQL, catch query performance regressions (Radim Marek): https://github.com/boringSQL/regresql

20 links in total, the main link included (the cap is 20).

### Dropped on 2026-11-17 to keep the cap (added 193, 196, the JIT commit and RegreSQL)

- [04:22] PostgreSQL security information (18.6 fixed 28 CVEs, 18.7 fixed 52): https://www.postgresql.org/support/security/ — a side number; it stays in the fact-check.
- [16:25] pgcompacttable: https://github.com/dataegret/pgcompacttable — a passing idea, not a 19 topic.
- [17:58] Postgres LISTEN/NOTIFY does not scale (Recall.ai, 2025): https://www.recall.ai/blog/postgres-listen-notify-does-not-scale — the DBOS episode notes link it.
- [24:15] Not Worth Doing: Features We Do Not Want (PostgreSQL wiki): https://wiki.postgresql.org/wiki/Not_Worth_Doing#Features_We_Do_Not_Want — an aside.

### Other candidates left out

- [30:46] Default to log_lock_waits=on (commit, Laurenz Albe): https://github.com/postgres/postgres/commit/2aac62be8cbb870ccf8c5b3fbb8a4e4aa8a14a73
- [29:53] Change wal_compression=on to the first of zstd, lz4, pglz (commit, wenhui qiu): https://github.com/postgres/postgres/commit/5838806ce696dd0759c5e4b87754e802612135e0
- [22:44] pg_plan_advice (docs): https://www.postgresql.org/docs/19/pgplanadvice.html
- [33:41] GitLab database load balancing, primary sticking by LSN (docs): https://docs.gitlab.com/development/database/load_balancing/
- [39:14] Include extended statistics data in pg_dump (commit, Corey Huinker): https://github.com/postgres/postgres/commit/c32fb29e979db4a7b92adb29007725eeacf91f64
- [42:19] Logical replication of sequences (docs): https://www.postgresql.org/docs/19/logical-replication-sequences.html
- [47:48] DBLab Engine 4.2.0, clone major upgrade: https://gitlab.com/postgres-ai/database-lab/-/releases/v4.2.0

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
