# Study pack for Kirk

## The episode in one sentence

A logical restore can finish successfully while the restored database still lacks the optimizer information and physical visibility state needed for efficient queries.

The proposed title is **“Your restore finished. Is your database ready?”** The episode should end with a concrete answer to: what should an operator check before returning traffic?

## Read this first

There are two different maintenance jobs:

- **ANALYZE** samples data to collect optimizer information: value frequencies, distinct counts, histograms, correlation and related statistics. It also refreshes relation estimates. It does not build the physical visibility map in PG18.
- **VACUUM** maintains heap visibility and the visibility map, among other jobs. Ordinary VACUUM does not replace the distribution sampling done by ANALYZE. VACUUM ANALYZE requests both.

An **Index Only Scan can still visit the heap**. The index supplies the requested values, but the executor checks the visibility map to determine whether heap visibility checks can be skipped. Inspect `Heap Fetches` and total buffer accesses, not just the plan-node name.

The map belongs to physical heap pages. Logical dump/restore recreates rows in new storage and transaction history; it does not copy the source's VM fork. This differs from physical recovery and pg_upgrade's reuse of relation files.

All-visible and all-frozen are also different. The all-visible property enables avoiding heap checks. A plain VACUUM can make pages all-visible without making all of them all-frozen.

## PG18 defaults: the important distinction

| Program | PG18 default | Consequence |
| --- | --- | --- |
| pg_dump | Does not export optimizer statistics | Explicit `--statistics` is needed to include supported statistics |
| pg_restore | Imports statistics included in the archive | It cannot recover statistics omitted by the exporter |
| pg_upgrade | Transfers most optimizer statistics | This is a different workflow from logical dump/restore |

PG18 does not transport collected extended-statistics data behind CREATE STATISTICS, although the object definitions can be restored. Expression-index statistics are a different category and have support in PG18. Custom statistics supplied by extensions and cumulative activity counters are additional distinctions.

A null `last_analyze` timestamp does not prove optimizer statistics are absent after importing them. Likewise, a large `pg_class.relallvisible` value is an estimate used by planning, not proof that the destination's actual VM is populated.

The details of restore ordering matter: post-data index creation can update relation estimates. Disabling autovacuum can change that behavior. We must measure the normal restore path before drawing conclusions from a deliberately isolated lab.

## A connection to our previous discussion

On January 14, 2025, Jian He proposed `--include-analyze` for dump/restore after a livestream and credited **Andrey Borodin, Nikolay Samokhvalov and Kirk Wolak**. Tom Lane questioned whether statistics transport superseded the proposal; Nathan Bossart expected transport to be faster and useful for pg_upgrade.

Later, PG18 settled on statistics export being off by default. This creates a useful episode question: if transporting statistics can replace some analysis work, what should an operational backup workflow do when the general-purpose exporter omits them by default?

Avoid framing this as a contradiction that proves anyone wrong. pg_dump serves multiple workflows. The default debate included whether a dump should represent canonical schema/data or also changing, derived metadata; compatibility expectations and extra work mattered too.

## History in two minutes

- **2002:** explicitly adding ANALYZE to restore scripts is debated. User convenience competes with control and the expectation of recurring automatic maintenance.
- **2003:** Tom reconsiders per-table ANALYZE now that analysis is cheaper. Documentation gains a recommendation to analyze after restore.
- **2012 and 2015:** statistics transport runs into catalog compatibility, representation and validation problems. Function-based loading is discussed years before PG18.
- **2013 onward:** using COPY FREEZE during restore is proposed, but transaction and visibility requirements make it more complicated than changing one keyword.
- **PG18:** portable statistics support ships; exporting them remains an explicit choice.

## What we know versus what we need to measure

Earlier synthetic experiments already show that **statistics can be present while the VM is missing**. A repeated 200,000-row example recorded natural root buffer accesses decreasing from 3,313 to 34 after plain VACUUM. This is a bounded mechanism observation, not a latency multiplier, and it did not run pg_dump/pg_restore.

The new core experiment should restore the same archive into fresh databases and compare four arms: no maintenance, ANALYZE, VACUUM, and VACUUM ANALYZE. Then compare default export with statistics-enabled export. Use one skewed-predicate/join query and one covering-index query.

We want estimated/actual rows, natural plans, root buffer totals, heap fetches, actual VM coverage and relation estimates. No prediction becomes a result until measured. If the expected plan change does not occur, explain why rather than tuning until a dramatic chart appears.

A small expression-index example is useful if time permits: ANALYZE before an expression index exists cannot collect that index's expression statistics. A final pass can therefore matter. Avoid prescribing an unconditional expensive sequence when workload priorities can guide the work.

## PG19: a short caveat

The inspected PG19 release-candidate source adds extended-statistics transport and conditional VM marking during eligible reads. A query may change VM coverage while it is being measured. This is not a promise that one SELECT fills every VM bit, nor that VACUUM is obsolete. Keep the core demonstration on pinned PG18; make PG19 a brief version-boundary note unless there is time for a separate controlled run.

## Proposed 28-minute conversation

| Time | Discussion |
| --- | --- |
| 0–3 | Correct rows, successful restore, poor query behavior: what does “ready” mean? |
| 3–9 | Two maintenance jobs, shown with the four-arm experiment |
| 9–14 | What PG18 statistics transport includes, omits and defaults to |
| 14–18 | The historical decisions, including the January 2025 proposal |
| 18–24 | A practical post-restore checklist and maintenance ordering |
| 24–28 | PG19, COPY FREEZE, and the remaining questions |

Questions to challenge each other with:

1. Which maintenance should block traffic, and for which query classes?
2. What evidence tells us that ANALYZE was enough—or that VACUUM is still needed?
3. Should pg_restore offer an explicit post-commit maintenance phase?
4. When is inherited statistics data less useful than fresh sampling?
5. Does parallel maintenance mean many tables at once or a faster scan of one huge table? (`vacuumdb --jobs` and `--parallel` do different work.)
6. How do we prove readiness with a representative workload rather than one lucky fast query?

## Essential reading

1. [PG18 pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html) — statistics export flags and omissions.
2. [PG18 pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html) — importing statistics and restore scope.
3. [Index-only scans](https://www.postgresql.org/docs/18/indexes-index-only-scans.html) — why heap fetches can remain.
4. [January 2025 include-analyze proposal](https://www.postgresql.org/message-id/flat/CACJufxGx_YLLxmnZVMuUApiVYqjKrydvEQqD3qxhwM6e0_8jrQ%40mail.gmail.com) — the proposal crediting Andrey, Nikolay and Kirk, and the responses.
5. [PG18 vacuumdb](https://www.postgresql.org/docs/18/app-vacuumdb.html) — jobs, parallel workers, staged analysis and missing-only analysis.

The [full research report](research.md) contains the longer history and primary sources. The [experiment plan](experiments.md) identifies what can realistically be completed in a few hours.
