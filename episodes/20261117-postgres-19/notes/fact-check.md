# Fact-check: Postgres.FM 197, "Postgres 19"

Checked 2026-11-17. Times are recording times (00:00:00 = Michael's "Hello, and welcome"), good to about 5 s; shift them after the edit.

Sources used:

- PostgreSQL source, a local clone, tag `REL_19_RC2` (release notes from `doc/src/sgml/release-19.sgml`), and the published notes at https://www.postgresql.org/docs/19/release-19.html.
- The PostgreSQL security page and the 18.6 and 18.7 release announcements.
- The study brief v3.0 (https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c), read logged out, and `../recording-notes.md`.
- pg_hint_plan on GitHub, pganalyze, the PostgreSQL wiki, pgsql-hackers archives, GitLab docs, DBLab Engine releases.

Summary: 4 wrong, 8 imprecise, the rest correct. None of the wrong items is about the brief's measured numbers. Suggested on-screen editor's notes are given for the wrong ones.

## Wrong

- **00:42:34, Michael (speech).** Claim: extended statistics in pg_dump is not in the release notes.
  - Evidence: release-19.sgml, server applications: "Allow pg_dump to include restorable extended statistics (Corey Huinker)". Commit `c32fb29e979db4a7b92adb29007725eeacf91f64` "Include extended statistics data in pg_dump" (2026-01-27).
  - Correction: it is in the release notes, under server applications.

- **00:43:12, Nik (speech).** Claim: pg_dump includes restorable extended statistics, "but I don't see support in pg_restore".
  - Evidence: the same commit makes the archive code accept "EXTENDED STATISTICS DATA" entries; pg_restore restores statistics by default. Dump needs `pg_dump --statistics`. At RC2 it covers ndistinct, dependencies, mcv and expression statistics.
  - Suggested editor's note: "Correction: pg_restore restores extended statistics too (dump with --statistics)."

- **00:24:47, Michael (speech).** Claim: parallel autovacuum is one of the things where "you don't have to change anything, you just upgrade".
  - Evidence: commit `1ff3180ca0169556984ab83759477f593129794d` "Allow autovacuum to use parallel vacuum workers." `autovacuum_max_parallel_workers` has `boot_val => '0'` at RC2, so it does nothing until you set it (per table: `autovacuum_parallel_workers`). Prioritization (commit `d7965d65fc5`) is on by default, so the point holds for it.
  - Suggested editor's note: "Parallel autovacuum is off by default: set autovacuum_max_parallel_workers."

- **00:45:14, Kirk (speech).** Claim: a removed setting "may be set on, for example, a specific table".
  - Evidence: `io_workers`, `escape_string_warning` and `standard_conforming_strings` are not table storage parameters. The trap is role, database and function settings, and grants on the parameters (recording notes, lead 1; shihao zhong's report).
  - Correction: on a role, a database or a function, not a table.

## Imprecise

- **00:09:13, Nik (speech).** Claim: the revert wave "started with this Halloween scary list" from Robert Haas.
  - Evidence: the thread is "scary patch contest", Robert Haas, pgsql-hackers, 2026-08-25 (https://www.postgresql.org/message-id/CA%2BTgmob9NY6m0YNFTQ4nFH2d0iC9SQRruDYxfndGKKzh8OC80w%40mail.gmail.com). Reverts followed from 2026-08-27 to 09-16. No list from 2026-10-31 found.
  - Correction: "scary", but late August, not Halloween. The author is right.

- **00:30:46, Nik (speech).** Claim: "our testing found around ten percent overhead from using [plan] advice ... for very fast queries".
  - Evidence: brief v3.0: `always_store_advice_details` (advice generated for every query) "cost about 13% of throughput on a trivial query"; an active stash "added about 2.5 µs per planning". Small test host, 2 trials, marked rough.
  - Correction: about 13%, for generating advice on every query, on a trivial query, small test host.

- **00:41:28, Nik (speech).** Claim: `vacuumdb --analyze-only` with `-j` now processes partitioned parents; before, parallel workers skipped them.
  - Evidence: commits `6429e5b771dbb98aa56441677b79cdb58f6e1675` and `95b6ec52e684e5de743e5bf4a2303f6cac466682`. Before 19 the catalog query kept only relkind r and m, so parents were skipped with or without `-j` when no table list was given.
  - Correction: the fix is not about `-j`; before 19, vacuumdb never analyzed partitioned parents unless you named them.

- **00:45:35, Nik (speech).** Claim: "pg_upgrade --check will report success, and then you just cannot start after upgrade".
  - Evidence: recording notes, lead 1. A removed setting in the 19 config added after `--check` stops 19 at start (FATAL). A removed setting on a role, database or function passes `--check`, and then pg_upgrade itself fails.
  - Correction: both happen; which one depends on where the setting is.

- **00:39:41, Michael (speech).** Claim: the EXPLAIN ANALYZE timing overhead is lower.
  - Evidence: commit `294520c44487ecaade7a6ea8781b973f9ed03909` uses the CPU time-stamp counter on x86-64 (new setting `timing_clock_source`, default `auto`); on other platforms it falls back to the system clock.
  - Correction: correct on x86-64 only.

- **00:23:09, Kirk (speech).** Implied: autovacuum prioritization lets you queue a given table again.
  - Evidence: commit `d7965d65fc5`: five server-wide `*_score_weight` settings and the view `pg_stat_autovacuum_scores`; no per-table queue.
  - Correction: weights for the whole server, not a per-table queue.

- **00:28:13 to 00:30:40, Kirk (speech).** Claim: with plan advice you store a good plan for a query ID "in the database" and give it a priority.
  - Evidence: pg_stash_advice keys advice by query ID, but the stash lives in shared memory and is saved to a file (commit `c10edb102ada607eb054bc9e23690109d86849ef`), not in a table; pg_dump does not include it. There is no priority setting.
  - Correction: the advice is kept by query ID in a stash, not in a table, and has no priority.

- **00:03:01, Michael (speech).** Claim: for the last few years the release came "very reliably in September".
  - Evidence: 15.0 came out 2022-10-13.
  - Correction: September or October.

## Correct (checked)

- 00:04:02, Michael: "seventy plus CVEs" in the last two minor releases. 18.6 (2026-08-13) fixed 28 and 18.7 (2026-11-12) fixed 52: 80.
- 00:08:31, Kirk: "ten or twenty x the number of CVEs". The security page lists 7 CVEs in 2025 releases and 96 in 2026, about 14x.
- 00:06:05, Nik: depesz on pgsql-bugs mail up and pgsql-general mail down ("What LLMs do to PostgreSQL and DBAs", 2026-11-09).
- 00:09:37, Nik: Tomas Vondra on revert counts "about on track with past releases", later in the cycle (vondra.me, 2026-10-01).
- 00:12:03, REPACK: `ac58465e0618941842439eb3f5a2cf8bebd5a3f1` "Introduce the REPACK command" (author Antonin Houska, 2026-03-10) and `28d534e2ae0ac888b5460f977a10cd9bb017ef98` "Add CONCURRENTLY option to REPACK", "heavily based on his own pg_squeeze". `REPACK ... USING INDEX` orders by an index (Michael, 00:13:27).
- 00:13:37, Michael: pg_squeeze has scheduling; REPACK does not.
- 00:20:40, Nik: NOTIFY wakes only the listeners of its channel (commit `282b1cde9dedf456ecf02eb27caf086023a7bb71`, Joel Jacobson); the global lock at commit stays (`async.c` at REL_19_RC2, `PreCommit_Notify`, `LockSharedObject(DatabaseRelationId, ..., AccessExclusiveLock)`).
- 00:21:02, Nik: "with one thousand listeners from two hundred per second, we went to eleven thousand per second". Brief: 200/s on 18.7, at least 11,040/s on 19 RC2, 8-vCPU dedicated host, 4 notifiers, median of 3 runs, client-limited (lower bound). Put the conditions in the notes and on screen.
- 00:25:12 to 00:26:36, Michael: pg_plan_advice is in contrib, by Robert Haas (commits `5883ff30b02ceed3c5eabba4d9c09a7766f9a8fc`, `e8ec19aa321abc89fb4fd277c994f14680ba17db`). pg_hint_plan lost code: its PG19 commit `e42246a82589001de2f08255d3b4d984fb134d38` says "removing close to 2000 lines" (it uses the path generation strategy hooks, commit `4020b370f214315b8c10430301898ac21658143f`). Lukas Fittl's 5mins of Postgres episode exists (2026-02-05).
- 00:26:52, Nik: the wiki lists optimizer hints under "Features We Do Not Want" (now on the Not_Worth_Doing page).
- 00:31:32, JIT off by default: `7f8c88c2b872cb74882ab93dcb05529dab2a10bc` (Jelte Fennema-Nio).
- 00:32:44, Michael: lz4 is the TOAST default when built with lz4 (`34dfca293432e206b8f80431f81535aff69782ca`); `wal_compression = on` picks zstd, then lz4, then pglz (`5838806ce696dd0759c5e4b87754e802612135e0`; `xlog.h` lines 89-100 at REL_19_RC2).
- 00:33:13, Nik: a standby without the method can be a problem (brief, lead 1: a standby without zstd stops with FATAL at the first zstd page).
- 00:33:39, log_lock_waits on by default: `2aac62be8cbb870ccf8c5b3fbb8a4e4aa8a14a73` (Laurenz Albe).
- 00:34:06, WAIT FOR LSN: `447aae13b0305780e87cac7b0dd669db6fab3d9d`; syntax at RC2 `WAIT FOR LSN 'lsn' [WITH (MODE ..., TIMEOUT ..., NO_THROW)]`. Kirk (00:36:10) is right that there is a timeout. A timeout raises an error by default, which is what Nik asks for at 00:35:55; `NO_THROW` returns a status instead.
- 00:36:42, Nik: GitLab's load balancer tracks the primary's LSN and sends reads to replicas that caught up (GitLab docs, "Primary sticking").
- 00:43:42, pgbench `--continue-on-error`: `0ab208fa505c04e2b3483de53a73edb71f9b9106`.
- 00:44:33, Michael: removed settings stop the server at start; `io_workers` was removed by Thomas Munro's `d1c01b79d4ae90e52bf9db9c05c9de17b7313e85` (automatic I/O worker pool); `escape_string_warning` removed and `standard_conforming_strings` fixed to on by `45762084545ec14dbbe66ace1d69d7e89f8978ac`. The release notes have 22 migration items.
- 00:46:03, Nik: logical replication of sequences is in 19 (`96b37849734673e7c82fb86c4f0a46a28f500ac8`, `5509055d6956745532e65ab218e15b99d87d66ce`); DDL is still not replicated.
- 00:51:49, Nik: DBLab Engine can upgrade a clone in place (v4.2.0, 2026-09-11, "Clone major upgrade").
- 00:54:51, Michael: deallocations are counted in `pg_stat_statements_info`; `pg_stat_statements.max` defaults to 5,000 (Nik, 00:54:30).

## Not checked

- 00:05:01 to 00:06:42, Nik: what Andres Freund said about AI-assisted reports. Not linked or quoted in the notes.
- 00:07:27, Kirk: "revert fest" coined by Andres in February.
- 00:11:34, Nik: people mentioned about 100 times in commit messages this year and zero or one time last year.
