# Should pg_restore offer --vacuum-analyze?

Episode discussion proposal, not an implemented PostgreSQL option or an upstream patch. Version scope: PostgreSQL 18 unless stated otherwise.

## Why statistics transport does not close the question

Yes: PG18 does **not** export collected extended-statistics data associated with CREATE STATISTICS. Restoring the object definitions is different from restoring their collected data. The dump documentation also excludes custom extension statistics and cumulative activity statistics, while supported expression-index statistics are a separate category. Export is opt-in with `--statistics`; pg_restore only imports what the archive contains. [PG18 pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html); [PG18 pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html).

The restore reference conditionally recommends ANALYZE when not all statistics were restored. It has no direct explanation of physical visibility-map readiness. The source VM is tied to physical pages; importing optimizer statistics is not importing that map. [PG18 VM storage](https://www.postgresql.org/docs/18/storage-vm.html); [index-only scans](https://www.postgresql.org/docs/18/indexes-index-only-scans.html). See the [documentation audit](restore-docs-audit.md) for the exact page-level classification.

## Why hasn't automatic maintenance shipped?

The evidence supports a history of competing approaches, not a single definitive reason:

- **2002:** Tom Lane favored recurring automatic maintenance when discussing restore-end analysis. This is a historical position, not a permanent veto on an opt-in modern option. [Tom Lane, April 3, 2002](https://www.postgresql.org/message-id/10511.1017856566%40sss.pgh.pa.us).
- **2008:** Tom Lane suggested that a parallel pg_restore could generate and schedule ANALYZE for each loaded table itself, rather than put these commands into pg_dump output. He contrasted restore-aware scheduling with background autoanalyze. [Tom Lane, September 17, 2008](https://www.postgresql.org/message-id/13358.1221663140%40sss.pgh.pa.us). Simon Riggs welcomed that possibility but noted that it would not cover plain dumps and other loading workflows. [Simon Riggs, September 17, 2008](https://www.postgresql.org/message-id/1221673494.3913.2148.camel%40ebony.2ndQuadrant).
- **2025:** Jian He proposed `--include-analyze`, crediting Andrey Borodin, Nikolay Samokhvalov and Kirk Wolak. Tom Lane questioned whether statistics import/export superseded it; Nathan Bossart expected transport to be faster and useful for pg_upgrade. These responses address analysis and transport, not a completed answer to physical VM readiness. [Jian He, January 14, 2025](https://www.postgresql.org/message-id/CACJufxGx_YLLxmnZVMuUApiVYqjKrydvEQqD3qxhwM6e0_8jrQ%40mail.gmail.com); [Tom Lane, January 14](https://www.postgresql.org/message-id/681450.1736865139%40sss.pgh.pa.us); [Nathan Bossart, January 14](https://www.postgresql.org/message-id/Z4aPZWJ7E-EsnYlm%40nathan).

The PG18 command reference has no `--vacuum-analyze` option. These sources do not establish why no implementation ultimately shipped, who should be blamed, or that a new optional phase would be rejected. Technical constraints below are our design analysis, not explanations attributed to particular contributors.

## Autovacuum is a real alternative, with asynchronous completion

[PG13's insert-triggered autovacuum](autovacuum-readiness.md) materially improves restored-table maintenance. The proposed option would provide an explicit completion step, not replace a nonexistent background mechanism. Some restores may already have adequate statistics and visibility coverage when they finish; measure that before claiming mandatory extra work.

## A concrete behavior to discuss

**Proposed contract:** an explicit opt-in adds a maintenance phase for the destination relations affected by this restore, reports its completion separately, and returns a failure status when requested maintenance fails. “Restore finished” would then distinguish data/schema completion from requested maintenance completion.

| Decision | Proposed starting point / unresolved choice |
| --- | --- |
| What does “touched” mean? | Track successfully loaded heap tables and populated materialized views, plus tables needing fresh expression/extended statistics after restored definitions. Specify behavior for schema-only, index-only, data-only, list-filtered and failed/partial restores. Do not infer the target set as every table in the database. |
| When? | A simple first design runs after all selected data and post-data work, including expression indexes and statistics objects. Earlier per-table scheduling could reduce time, but must respect dependencies and may require another analysis pass. |
| Single-transaction restore | VACUUM cannot run inside a transaction block. Either reject the combination explicitly or document a separate post-commit phase; a maintenance failure cannot roll back already committed data. |
| Parallelism | Limit concurrent tables and distinguish that from workers inside one VACUUM. The two controls serve different workloads. |
| Partitions | Deduplicate physical leaf work and decide how partitioned-parent statistics are gathered. Parent analysis and leaf vacuuming are not interchangeable. |
| Permissions and errors | Report each skipped/failed relation and why. Preserve the restore error summary; do not silently report complete readiness after partial success. |
| Import plus analysis | Fresh ANALYZE may replace imported estimates. Document this deliberate effect, including possible plan changes and added work. |
| Interface | Consider separate analysis-only and vacuum-plus-analysis modes; spelling and defaults require discussion. No VACUUM FULL implied. |

Technical basis: [VACUUM transaction restrictions, relation scope and permissions](https://www.postgresql.org/docs/18/sql-vacuum.html), [ANALYZE and partitioned tables](https://www.postgresql.org/docs/18/sql-analyze.html), [expression-index statistics](https://www.postgresql.org/docs/18/sql-createindex.html), [pg_restore selection and transaction modes](https://www.postgresql.org/docs/18/app-pgrestore.html), and [vacuumdb jobs versus parallel workers](https://www.postgresql.org/docs/18/app-vacuumdb.html).

Even successful VACUUM ANALYZE is not a guarantee of full VM coverage under every concurrent workload or of acceptable application latency. The value of this option would be a visible, scoped completion step; representative-query validation remains necessary. [Routine vacuuming and visibility](https://www.postgresql.org/docs/18/routine-vacuuming.html).

**Podcast question:** if pg_restore already knows the loaded objects and their dependency order, should operators still have to reconstruct that scope in an external maintenance script?
