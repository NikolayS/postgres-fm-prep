# Give autovacuum credit — then measure when the database is ready

**Measured partition exception:** the [October 20 follow-up](forge-oct20-followup.md) confirms that all leaves can be observed analyzed within 15 seconds while the parent remains without statistics after more than eight minutes. Leaf statistics helped one query but did not repair the parent-dependent group estimate (200 versus 100,000 actual). Explicit parent analysis or usable imported parent statistics supplied the missing information.

## PG13 changed the insert-only case

PostgreSQL 13 introduced vacuum triggers based on inserts, alongside the older update/delete-driven behavior. The release notes explicitly identify all-visible marking for index-only scans and spreading out freezing work as benefits. They credit Laurenz Albe and Darafei Praliaskouski. A restored table does not need to accumulate dead tuples before it can receive useful automatic vacuuming. [PG13 release notes](https://www.postgresql.org/docs/13/release-13.html).

Autoanalyze already responded to inserts before PG13. The improvement was insert-triggered **vacuuming**, not the invention of automatic analysis. This is a material reason to avoid presenting modern PostgreSQL as leaving every restored table permanently unmaintained. [Same release notes](https://www.postgresql.org/docs/13/release-13.html).

## PG18 controls

| Control | Default | Role |
| --- | --- | --- |
| autovacuum_vacuum_insert_threshold | 1000 | Base insert count for vacuum eligibility; -1 disables this trigger |
| autovacuum_vacuum_insert_scale_factor | 0.2 | Scales the insert trigger, accounting for the table's unfrozen fraction |
| autovacuum_analyze_threshold | 50 | Base change count for analysis eligibility |
| autovacuum_analyze_scale_factor | 0.1 | Scales the analysis trigger |

These defaults can be overridden per table. Autovacuum must be enabled and have the required statistics tracking; worker capacity and cost settings also matter. [PG18 vacuum configuration](https://www.postgresql.org/docs/18/runtime-config-vacuum.html).

The documented insert-vacuum threshold is the base plus scale factor × estimated tuples × fraction of the table not frozen. Analysis uses a separate change threshold. Avoid reducing this to “always vacuum after 1000 inserts” or confusing the vacuum insert scale factor with the analyze scale factor. [PG18 trigger definitions](https://www.postgresql.org/docs/18/routine-vacuuming.html#AUTOVACUUM).

## Eligibility is not a completion barrier

The default one-minute autovacuum naptime is not a promise that every restored table will finish maintenance within one minute. Worker availability, scheduling and throttling affect completion. [Configuration](https://www.postgresql.org/docs/18/runtime-config-vacuum.html).

**Operational inference:** in a restore that commits work incrementally, background maintenance may catch up on some tables while other work continues. A single-transaction restore changes when data becomes committed and available to that work. pg_restore has no documented option that waits for every affected table's autovacuum/autoanalyze to finish. [Restore transaction modes](https://www.postgresql.org/docs/18/app-pgrestore.html).

Some tables may not cross the triggers. Partitioned parents are another explicit exception: autovacuum processes leaf partitions but does not automatically analyze the partitioned parent. Conflicting operations can interrupt ordinary autovacuum. [PG18 automatic vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html#AUTOVACUUM).

## Fair wording for the podcast

> Since PostgreSQL 13, inserts can trigger autovacuum, so a logical restore can recover visibility-map coverage in the background. The remaining issue is timing: restore completion does not wait for that work. Some workloads can see poor plans or extra heap fetches before maintenance catches up; others may already be ready.

“Can” matters. Slow queries are not inevitable, and we have not measured a universal delay. Imported statistics, actual VM coverage, query shape and concurrent activity determine the result. The planner/executor distinction is documented in [index-only scans](https://www.postgresql.org/docs/18/indexes-index-only-scans.html).

## Two plan symptoms to distinguish

1. **A different chosen plan.** Low estimated all-visible coverage increases the modeled heap work of an index-only path. A bitmap index/heap plan, ordinary index scan or sequential scan may then win. This is a possible outcome, not a guarantee. In pinned PG18 source, index-only heap-page cost is reduced according to the estimated all-visible fraction. [PG18.0 cost_index implementation](https://github.com/postgres/postgres/blob/3d6a828938a5fa0444275d3d2f67b64ec3199eb7/src/backend/optimizer/path/costsize.c).
2. **The same Index Only Scan, with heap fetches.** The executor consults the actual VM. An attractive estimate cannot make absent visibility bits appear. This is especially relevant when imported relation estimates and physical state differ. [Executor behavior](https://www.postgresql.org/docs/18/indexes-index-only-scans.html).

Bitmap scans are not intrinsically bad: they can combine predicates and visit heap pages in physical order. A normal Index Scan still visits the heap even with a healthy VM. The specific expected benefit to demonstrate is a **heap-light index-only path**, not a rule that every bitmap plan should become an ordinary index scan. [Bitmap scan behavior](https://www.postgresql.org/docs/18/indexes-bitmap-scans.html).

## Experiment control

Include a fresh restore with **normal autovacuum enabled**, recording real table settings. Measure statistics, VM coverage and representative plans immediately after restore and over a bounded observation window. Capture maintenance start/completion evidence and mark runs in which it happened during restore. Report time to a defined readiness condition, not just time to pg_restore exit. If maintenance has not completed by the time limit, report that censored observation rather than an invented catch-up time.

Keep this separate from the controlled mechanism comparison, which leaves autovacuum enabled but suppresses ordinary triggers with recorded high thresholds. Disabling autovacuum is a separate diagnostic: it changes behavior, including index-build estimate refresh, and cannot establish what users normally experience. See the [experiment plan](experiments.md).

## Measured follow-up

The [Forge stock-autovacuum control](forge-results.md#2-fairness-normal-autovacuum-catches-up) has now run: twelve small restores reached observed completion of both automatic jobs roughly 5–68 seconds after restore. The figure uses actual timestamp differences, correcting loop-counter labels in the original summary. A larger run had some tables maintained during restore, and accounts complete about 384 seconds afterwards amid competing databases. This supports the asynchronous-readiness argument without establishing a universal lag or attributing all pre-vacuum delay to worker queueing.
