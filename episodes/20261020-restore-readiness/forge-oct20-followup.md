# New Forge checks: parents, freezing and maintenance tools

[Host TL;DR](hosts-tldr.md) · [Study pack](study-pack.md) · [Earlier results](forge-results.md) · [Selected raw evidence](evidence/forge/oct20-followup/README.md)

Reviewed October 20, 2026. Source: Forge branch `case/restore-readiness-01`, commit recorded in the [SHA-256 manifest](evidence/forge/oct20-followup/provenance.json). These are newly reviewed supplied experiment outputs, not new executions by the podcast-prep project. PG19 means **19rc1** throughout.

## What changes in our advice

1. **Waiting for autovacuum is insufficient for partitioned-parent statistics.** The new experiment demonstrates a persistent bad estimate after the leaves were analyzed.
2. **Client mode matters.** In the tested no-explicit-table invocation, PG18 vacuumdb skipped parents in all three analysis modes. PG19 included them in two modes, but still skipped them with `--analyze`.
3. **FREEZE deserves more attention for stable restored data on PG18.** In this fixture it added little initial cost and sharply reduced a later forced freezing pass. PG19's ordinary VACUUM already established the same all-frozen coverage. Neither observation proves a universal cost or behavior.
4. **WAL compression changes the maintenance budget substantially.** Measure the CPU/time tradeoff and the whole workload; these are single-run observations.

## 1. Parent statistics: leaves ready, parent still missing

The fixture has 400,000 orders in eight hash partitions and 200,000 customers. The diagnostic query groups orders by customer before joining. It depends on the parent-level distinct-value estimate. A second join query benefits from leaf statistics, providing a useful contrast.

| Server / state | Parent pg_stats rows | Estimated / actual grouped-join rows | Plan | Root buffer accesses |
| --- | ---: | ---: | --- | ---: |
| PG18.6, leaves autoanalyzed; parent still missing | 0 | 200 / 100,000 | Nested Loop | 403,072 |
| PG18.6, after explicit parent ANALYZE | 3 | 102,063 / 100,000 | Hash Join | 4,400 |
| PG19rc1, leaves autoanalyzed; parent still missing | 0 | 200 / 100,000 | Nested Loop | 402,891 |
| PG19rc1, after explicit parent ANALYZE | 3 | 100,068 / 100,000 | Hash Join | 4,383 |

Leaves were first observed autoanalyzed about 13–15 seconds after restore. Parents still had no inherited statistics at the end of the roughly eight-minute observation window. The nominal 480-second polling budget is not an exact elapsed duration: SQL/poll overhead extended it. These are single restores per version, and detection time is not job completion time. [Raw timelines, states and plans](evidence/forge/oct20-followup/runs).

The other join's PG18 estimate improved from 2,001 to 4,167 rows against 4,084 actual after leaf autoanalysis. This explains why a workload can appear partly repaired while parent-dependent plans remain poor. The buffer counts above are accesses, not distinct pages or latency speedups.

The enduring mechanism is documented: autovacuum does not analyze partitioned parents. The finite test demonstrates the symptom; the documentation explains why simply extending the wait is not the solution. [Official parent-statistics guidance](https://www.postgresql.org/docs/19/routine-vacuuming.html#VACUUM-FOR-STATISTICS).

### Imported parent statistics worked, including from a PG17 source

PG18 and PG19 statistics-enabled archives restored three inherited parent pg_stats rows and selected the Hash Join immediately. A **PG18.6 pg_dump client reading PG17.11** also produced a usable statistics-enabled archive for PG18.6: 20 STATISTICS DATA entries, restore exit status zero, and parent statistics present. This does not mean the PG17 pg_dump executable supports `--statistics`, or that every cross-version combination is covered. [Cross-version state](evidence/forge/oct20-followup/runs/pt_pg18/steps/xver_immediate_state.txt), [plan](evidence/forge/oct20-followup/runs/pt_pg18/steps/xver_immediate_qp.json).

## 2. vacuumdb is not interchangeable with bare SQL ANALYZE

Each row below used a fresh restore, matching client/server versions, autovacuum disabled, and **no explicit table selection**.

| Client/server | Mode | Parent statistics rows | Parent analyze_count |
| --- | --- | ---: | ---: |
| 18.6 | `--analyze` | 0 | 0 |
| 18.6 | `--analyze-only` | 0 | 0 |
| 18.6 | `--analyze-in-stages` | 0 | 0 |
| 19rc1 | `--analyze` | 0 | 0 |
| 19rc1 | `--analyze-only` | 3 | 1 |
| 19rc1 | `--analyze-in-stages` | 3 | 3 |

[PG18 raw states](evidence/forge/oct20-followup/runs/vdb_pg18/steps), [PG19 raw states](evidence/forge/oct20-followup/runs/vdb_pg19/steps). The summary files render zero matching pg_stats rows as an empty field; the states and zero analyze_count corroborate the absence.

**Important distinction, verified during the Supabase docs review:** SQL `VACUUM VERBOSE ANALYZE;` itself includes partitioned-parent analysis on tested PostgreSQL 17.11 and 19rc1. The exclusion above is in the vacuumdb client's automatic target selection. Do not infer that Supabase's existing SQL maintenance command misses parents. [Server relation selection and analysis](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/commands/vacuum.c), [client target filter](https://github.com/postgres/postgres/blob/REL_19_RC1/src/bin/scripts/vacuuming.c#L649-L677).

Operationally, explicitly analyze required parents, for example `ANALYZE public.orders_p;`, or use SQL `ANALYZE;` with appropriate privileges to analyze the database. Account for its recursive work and cost. Do not infer that `vacuumdb --analyze` covered parents simply because its name includes “analyze.” [SQL ANALYZE](https://www.postgresql.org/docs/19/sql-analyze.html), [PG19 client change](https://www.postgresql.org/docs/19/release-19.html#RELEASE-19-SERVER-APPLICATIONS).

## 3. FREEZE now versus a later forced freezing pass

The second host used the same instance class as the first: four vCPUs, 16 GiB RAM, PGDG 18.6/19rc1, checksums on. Each arm restored a fresh database, checkpointed, ran maintenance, then checkpointed again before a forced aggressive VACUUM of `accounts`. That table has 10 million rows and 172,440 heap pages; 172,414 became all-visible in these arms. Initial maintenance covered the database; the later command targeted accounts. Compare those scopes carefully.

| Version | Initial maintenance | Initial seconds | Initial cluster WAL delta | Accounts all-frozen pages | Later accounts vacuum: seconds / cluster WAL delta |
| --- | --- | ---: | ---: | ---: | --- |
| 18.6 | VACUUM ANALYZE | 3.28 | 1.49 GiB | 0 | 2.78 / 1.32 GiB |
| 18.6 | VACUUM (FREEZE, ANALYZE) | 3.50 | 1.50 GiB | 172,414 | 0.026 / 35 KiB |
| 19rc1 | VACUUM ANALYZE | 3.43 | 1.49 GiB | 172,414 | 0.023 / 35 KiB |
| 19rc1 | VACUUM (FREEZE, ANALYZE) | 3.58 | 1.49 GiB | 172,414 | 0.017 / 35 KiB |

Source: [18.6 CSV](evidence/forge/oct20-followup/runs/fz_pg18/steps.csv), [19rc1 CSV](evidence/forge/oct20-followup/runs/fz_pg19/steps.csv), [state snapshots and VERBOSE output](evidence/forge/oct20-followup/runs). Ordinary VACUUM without ANALYZE showed the same version difference in frozen coverage.

**Interpretation:** for this PG18 fixture, choosing FREEZE during preparation avoided substantial additional work in a later deliberately forced pass for nearly the same observed initial cost. On PG19, ordinary vacuum already froze those pages. This strengthens the case for evaluating FREEZE on stable PG18 data; it does not prove FREEZE is free on every restore, establish a PG17 result, or guarantee PG19 always freezes all newly loaded tuples.

**Limits that matter:** one run per arm; cluster LSN deltas, not exclusively statement-attributed WAL; forced age thresholds of zero, not an actual transaction-age progression or observed future autovacuum; an intervening diagnostic query; no changed-data workload. The state query failed at `count(distinct xmin)` because xid lacks the required ordering operator. Earlier catalog/VM results were emitted, but subsequent state queries were not reached. No measured claim about the number of inserting transactions is justified. The specific PG19 change responsible for this freezing behavior has not been isolated.

The PG18 plain-FREEZE arm's later command has a roughly 2 MiB cluster LSN delta, while the table's VERBOSE WAL report is much smaller. Do not attribute that discrepancy to a VM full-page image without evidence.

## 4. Compression changes WAL volume and time

For initial plain VACUUM, with the same fresh-restore/checkpoint procedure:

| Version | wal_compression | Cluster WAL delta | Wall seconds |
| --- | --- | ---: | ---: |
| 18.6 | off | 1.60 GiB | 4.83 |
| 18.6 | lz4 | 0.54 GiB | 2.48 |
| 18.6 | zstd | 0.34 GiB | 6.05 |
| 19rc1 | off | 1.49 GiB | 4.08 |
| 19rc1 | lz4 | 0.54 GiB | 2.65 |
| 19rc1 | zstd | 0.34 GiB | 6.21 |

These are context for the tradeoff, not a production sizing formula or a recommendation to change global settings. Compression was set for the maintenance session. CPU consumption was not separately measured. The same CSVs contain the FREEZE/compression arms.

## 5. Tooling audit: preserve the boundary between docs and execution

The new Forge audit adds source/documentation comparisons, not tool executions. Keep our existing [28-page documentation audit](restore-docs-expanded.md) denominator unchanged. Missing advice on a page does not prove a managed service omits internal maintenance.

The previously verified positive examples remain useful: [pgcopydb documents post-copy VACUUM ANALYZE](https://pgcopydb.readthedocs.io/en/latest/ref/pgcopydb_clone.html), and [Debian pg_restorecluster documents automatic analysis](https://manpages.debian.org/unstable/postgresql-common/pg_restorecluster.1.en.html). Their table/parent selection still matters. Do not translate “runs analysis” into “every object is ready.” Broader source-only claims in Forge's vendor table are not added to our measured counts or presented as executed results.

## Podcast lines

- “The leaves recovered. The parent estimate was still 200 when the answer was 100,000.”
- “The spelling of the maintenance command matters: vacuumdb --analyze and ANALYZE are not the same coverage promise.”
- “On PG18, we could do the freezing during our window for little extra measured cost. PG19 had already done it with ordinary vacuum.”
- “A successful command is one checkpoint. Plans, parent statistics and physical state are the next checks.”
