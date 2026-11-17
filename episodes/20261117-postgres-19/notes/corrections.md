# Episode 197 (Postgres 19): on-screen corrections

DRAFT, 2026-11-17, for Nik's approval. Times are recording times (00:00:00 = Michael's "Hello, and welcome"); place each card on the source word with `find.ts` after the edit. Evidence for each card is in [`fact-check.md`](fact-check.md). The vacuumdb item was re-checked and is correct, so it has no card.

Card style as in 196: a small "Correction" band, two lines at most, shown while the next sentence plays.

| Time | Speaker | Card text |
| --- | --- | --- |
| 00:24:47 | Michael | Correction: parallel autovacuum is off by default. Set autovacuum_max_parallel_workers. |
| 00:42:34 | Michael | Correction: it is in the 19 release notes: "Allow pg_dump to include restorable extended statistics". |
| 00:43:12 | Nik | Correction: pg_restore restores extended statistics too (dump with pg_dump --statistics). |
| 00:45:14 | Kirk | Correction: removed settings cannot be set on a table. The trap is a setting on a role, a database or a function. |

Optional (imprecise, not wrong):

| Time | Speaker | Card text |
| --- | --- | --- |
| 00:09:13 | Nik | Robert Haas's "scary patch contest", pgsql-hackers, 2026-08-25 (not Halloween). |
| 00:30:46 | Nik | Our test: about 13% throughput cost with advice generated for every query, on a trivial query (small test host, rough). |

## Transistor corrections block (draft, after the links)

```html
<div><br><strong>Corrections (checked against the Postgres 19 RC2 source after recording)</strong></div><ul><li>[00:24:47] Parallel autovacuum is off by default: autovacuum_max_parallel_workers is 0 until you set it. Autovacuum prioritization needs no change.</li><li>[00:42:34] Extended statistics in pg_dump are in the release notes: "Allow pg_dump to include restorable extended statistics (Corey Huinker)".</li><li>[00:43:12] pg_restore restores them too; dump with pg_dump --statistics.</li><li>[00:45:14] The removed settings (escape_string_warning, io_workers) cannot be set on a table. The upgrade trap is escape_string_warning, or standard_conforming_strings = off, set on a role, a database or a function: pg_upgrade --check passes, then the upgrade fails.</li></ul><div><strong>Clarifications</strong></div><ul><li>[00:09:13] The list of risky patches is Robert Haas's "scary patch contest" on pgsql-hackers, 2026-08-25.</li><li>[00:30:46] Our test measured about 13% throughput cost with advice generated for every query, on a trivial query (small test host, 2 trials).</li><li>[00:39:41] The lower timing overhead uses the CPU time-stamp counter on x86-64; other platforms keep the system clock.</li></ul>
```

Shift the times in the block to podcast times after the edit.
