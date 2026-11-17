# Episode 197 (Postgres 19): on-screen notes

DRAFT, 2026-11-17, for Nik's approval. Times are recording times (00:00:00 = Michael's "Hello, and welcome"); place each note on the source word with `find.ts` after the edit. Evidence and the tag of each item are in [`fact-check.md`](fact-check.md).

Wording rule (Michael and Nik, 2026-11-17): most items are clarifications. Notes are short, neutral and additive ("Note: ..."). Only a CORRECTION item says "Correction". The vacuumdb item was re-checked and is correct, so it has no note.

Style as in 196: a small band, two lines at most, shown while the next sentence plays.

| Time | Speaker | Tag | On-screen text |
| --- | --- | --- | --- |
| 00:09:13 | Nik | CORRECTION | Correction: Robert Haas's "scary patch contest" was on 2026-08-25 (pgsql-hackers). |
| 00:23:09 | Kirk | CLARIFICATION | Note: the score weights are server-wide; see pg_stat_autovacuum_scores. |
| 00:24:47 | Michael | CLARIFICATION | Note: parallel autovacuum is off by default; enable with autovacuum_max_parallel_workers. |
| 00:29:53 | Kirk | CLARIFICATION | Note: pg_stash_advice keeps advice per query ID on the server; pg_dump does not include it. |
| 00:30:46 | Nik | CLARIFICATION | Note: about 13% in our test, with advice generated for every query, on a trivial query (small test host). |
| 00:39:41 | Michael | CLARIFICATION | Note: on x86-64 (CPU time-stamp counter). |
| 00:42:34 | Michael | CLARIFICATION | Note: it is in the 19 release notes: "Allow pg_dump to include restorable extended statistics". |
| 00:43:12 | Nik | CLARIFICATION | Note: pg_restore restores them too (dump with pg_dump --statistics). |
| 00:45:14 | Kirk | CORRECTION | Correction: these settings cannot be set on a table. Check roles, databases and functions. |
| 00:45:35 | Nik | CLARIFICATION | Note: on a role or database, pg_upgrade itself fails; in the 19 config file, 19 does not start. |

Not on screen: 00:03:01 (September or October), too small to show.

## Transistor notes block (draft, after the links)

```html
<div><br><strong>Notes (checked against the Postgres 19 RC2 source after recording)</strong></div><ul><li>[00:09:13] Correction: the list of risky patches is Robert Haas's "scary patch contest" on pgsql-hackers, 2026-08-25.</li><li>[00:24:47] Parallel autovacuum is off by default: set autovacuum_max_parallel_workers. Autovacuum prioritization needs no change.</li><li>[00:30:46] Our test measured about 13% throughput cost with advice generated for every query, on a trivial query (small test host, 2 trials).</li><li>[00:39:41] The lower timing overhead uses the CPU time-stamp counter on x86-64.</li><li>[00:42:34] Extended statistics in pg_dump are in the release notes ("Allow pg_dump to include restorable extended statistics"), and pg_restore restores them; dump with pg_dump --statistics.</li><li>[00:45:14] Correction: the removed settings cannot be set on a table. The upgrade trap is escape_string_warning, or standard_conforming_strings = off, set on a role, a database or a function: pg_upgrade --check passes, then the upgrade fails.</li></ul>
```

Shift the times in the block to podcast times after the edit.
