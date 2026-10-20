# Study pack for Kirk

Historical statements below are paraphrases, not quotations. Each attribution links to the individual original message, with author and date; technical claims link to versioned documentation or pinned source. Experiment proposals and co-host questions are our preparation suggestions, not positions attributed to PostgreSQL contributors.

## The episode in one sentence

A logical restore can finish successfully while the restored database still lacks the optimizer information and physical visibility state needed for efficient queries.

The proposed title is **“Your restore finished. Is your database ready?”** The episode should end with a concrete answer to: what should an operator check before returning traffic?

## Read this first

There are two different maintenance jobs:

- **ANALYZE** samples data to collect optimizer information: value frequencies, distinct counts, histograms, correlation and related statistics. It also refreshes relation estimates. It does not build the physical visibility map in PG18. [PG18 ANALYZE documentation](https://www.postgresql.org/docs/18/sql-analyze.html); [PG18.0 analysis implementation, `do_analyze_rel`](https://github.com/postgres/postgres/blob/3d6a828938a5fa0444275d3d2f67b64ec3199eb7/src/backend/commands/analyze.c).
- **VACUUM** maintains heap visibility and the visibility map, among other jobs. Ordinary VACUUM does not replace the distribution sampling done by ANALYZE. VACUUM ANALYZE requests both. [PG18 routine vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html); [VACUUM options](https://www.postgresql.org/docs/18/sql-vacuum.html).

An **Index Only Scan can still visit the heap**. The index supplies the requested values, but the executor checks the visibility map to determine whether heap visibility checks can be skipped. Inspect `Heap Fetches` and total buffer accesses, not just the plan-node name. [PG18 index-only scans](https://www.postgresql.org/docs/18/indexes-index-only-scans.html).

The map belongs to physical heap pages. Logical dump/restore recreates rows in new storage and transaction history; it does not copy the source's VM fork. This differs from physical recovery and pg_upgrade's reuse of relation files. This distinction follows from the [physical VM layout](https://www.postgresql.org/docs/18/storage-vm.html), [logical dump/restore description](https://www.postgresql.org/docs/18/backup-dump.html), and [pg_upgrade file-reuse description](https://www.postgresql.org/docs/18/pgupgrade.html).

All-visible and all-frozen are also different. The all-visible property enables avoiding heap checks. A plain VACUUM can make pages all-visible without making all of them all-frozen. [PG18 visibility-map bit definitions](https://www.postgresql.org/docs/18/storage-vm.html).

## Fairness: autovacuum can catch up

**PG13 added insert-triggered autovacuum**, which helps restored/insert-only tables build visibility coverage and spread freezing work. Autoanalyze already handled inserts. The issue is the absence of a restore-specific completion barrier, not an absence of automatic maintenance. Some tables may be maintained during restore; others may lag. Poor performance before catch-up is workload-dependent, not inevitable. [PG13 release notes](https://www.postgresql.org/docs/13/release-13.html); [controls, limitations and a fair experiment](autovacuum-readiness.md).

## PG18 defaults: the important distinction

| Program | PG18 default | Consequence | Primary source |
| --- | --- | --- | --- |
| pg_dump | Does not export optimizer statistics | Explicit `--statistics` is needed to include supported statistics | [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html) |
| pg_restore | Imports statistics included in the archive | It cannot recover statistics omitted by the exporter | [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html) |
| pg_upgrade | Transfers most optimizer statistics | This is a different workflow from logical dump/restore | [pg_upgrade](https://www.postgresql.org/docs/18/pgupgrade.html) |

PG18 does not transport collected extended-statistics data behind CREATE STATISTICS, although the object definitions can be restored. Expression-index statistics are a different category and have support in PG18. Custom statistics supplied by extensions and cumulative activity counters are additional distinctions. [PG18 pg_dump notes on included and excluded statistics](https://www.postgresql.org/docs/18/app-pgdump.html).

A null `last_analyze` timestamp does not prove optimizer statistics are absent after importing them. Likewise, a large `pg_class.relallvisible` value is an estimate used by planning, not proof that the destination's actual VM is populated. This is an inference from the separation of [cumulative statistics](https://www.postgresql.org/docs/18/monitoring-stats.html) and the [statistics-import functions](https://www.postgresql.org/docs/18/functions-admin.html#FUNCTIONS-ADMIN-STATSMOD); [PG18.0 relation-statistics import](https://github.com/postgres/postgres/blob/3d6a828938a5fa0444275d3d2f67b64ec3199eb7/src/backend/statistics/relation_stats.c) updates catalog estimates, not VM bits.

The details of restore ordering matter: post-data index creation can update relation estimates. Disabling autovacuum can change that behavior. We must measure the normal restore path before drawing conclusions from a deliberately isolated lab. Source-based qualification: [PG18.0 `index_update_stats`](https://github.com/postgres/postgres/blob/3d6a828938a5fa0444275d3d2f67b64ec3199eb7/src/backend/catalog/index.c) and [the change explaining autovacuum-disabled behavior](https://github.com/postgres/postgres/commit/d611f8b1587b8f30caa7c0da99ae5d28e914d54f).

## A connection to our previous discussion

On January 14, 2025, **Jian He** proposed `--include-analyze` for dump/restore after a livestream and credited **Andrey Borodin, Nikolay Samokhvalov and Kirk Wolak**. [Jian He, “Support --include-analyze in pg_dump, pg_dumpall, pg_restore,” January 14, 2025](https://www.postgresql.org/message-id/CACJufxGx_YLLxmnZVMuUApiVYqjKrydvEQqD3qxhwM6e0_8jrQ%40mail.gmail.com).

**Tom Lane** questioned whether the ongoing statistics import/export work superseded the proposal. [Tom Lane, reply, January 14, 2025](https://www.postgresql.org/message-id/681450.1736865139%40sss.pgh.pa.us).

**Nathan Bossart** expected transporting statistics to be faster than analyzing everything and useful to pg_upgrade. [Nathan Bossart, reply, January 14, 2025](https://www.postgresql.org/message-id/Z4aPZWJ7E-EsnYlm%40nathan).

Later, PG18 settled on statistics export being off by default. [Committed default change, May 27, 2025](https://github.com/postgres/postgres/commit/34eb2a80d5a3ea1392e4a9f16ebac54e96d0c6ed). This creates our episode question: if transporting statistics can replace some analysis work, what should an operational backup workflow do when the general-purpose exporter omits them by default?

The default debate contained several distinct arguments:

- **Greg Sabino Mullane** argued for a canonical representation of schema/data, with changing derived metadata opt-in. [Greg Sabino Mullane, May 10, 2025](https://www.postgresql.org/message-id/CAKAnmmL35eCAX-XoqwFzauaoJekyM5aNQpTaWDU2GvjeChkyog%40mail.gmail.com).
- **Robert Haas** emphasized user expectations. [Robert Haas, April 2, 2025](https://www.postgresql.org/message-id/CA%2BTgmoYXspGT4dc3jY8B_eJgsT7m%3DiwqF1i4te3HyG8FdTr1nA%40mail.gmail.com).
- **Jeff Davis** discussed starting opt-in and the implications for future scripts. [Jeff Davis, April 1, 2025](https://www.postgresql.org/message-id/db541ea000b2371c323c1f5c00ebca2c3a3e28c0.camel%40j-davis.com).
- **Robert Haas** also raised additional time and memory costs earlier in the discussion. [Robert Haas, March 6, 2025](https://www.postgresql.org/message-id/CA%2BTgmoYGuEC%3DE4TbomRyqO8%2BUav%3D90G0dYXw%3DrA1d5UmRB76Yg%40mail.gmail.com).

These are attributed arguments, not a claim of unanimous agreement. Our suggested framing is to compare the workflows pg_dump serves rather than present the outcome as proof that a contributor was wrong.

## History in two minutes

- **2002:** Christopher Kings-Lynne proposes adding ANALYZE after restore; Tom Lane argues for addressing routine maintenance through automatic background work. [Christopher Kings-Lynne, April 3, 2002](https://www.postgresql.org/message-id/GNELIHDDFBOCMGBFGEFOOEOPCBAA.chriskl%40familyhealth.com.au); [Tom Lane, April 3, 2002](https://www.postgresql.org/message-id/10511.1017856566%40sss.pgh.pa.us).
- **2003:** Tom Lane reconsiders per-table ANALYZE given its lower cost. Bruce Momjian later reports committing a documentation recommendation to analyze after restore. [Tom Lane, February 27, 2003](https://www.postgresql.org/message-id/27615.1046376756%40sss.pgh.pa.us); [Bruce Momjian, March 18, 2003 UTC](https://www.postgresql.org/message-id/200303180001.h2I01lA26847%40candle.pha.pa.us).
- **2012:** Bruce Momjian raises cross-version fragility; Peter Eisentraut proposes a version-aware function to import statistics. [Bruce Momjian, March 13, 2012](https://www.postgresql.org/message-id/20120313031037.GH10441%40momjian.us); [Peter Eisentraut, March 14, 2012](https://www.postgresql.org/message-id/1331757641.22638.5.camel%40vanquo.pezone.net).
- **2015:** Tom Lane describes function-based loading and the catalog-compatibility and validation problems with raw pg_statistic INSERTs. [Tom Lane, December 23, 2015](https://www.postgresql.org/message-id/6221.1450840565%40sss.pgh.pa.us).
- **2013 and 2025:** Bruce Momjian asks about COPY FREEZE in single-transaction restores; Dimitrios Apostolou later posts a restore-freezing patch with transaction/TRUNCATE prerequisites. These are proposals, not evidence of a shipped restore option. [Bruce Momjian, January 25, 2013](https://www.postgresql.org/message-id/20130125152433.GY21914%40momjian.us); [Dimitrios Apostolou, June 10, 2025](https://www.postgresql.org/message-id/ff258f33-00d3-a944-9517-b3cccb662722%40gmx.net); [documented COPY FREEZE requirements](https://www.postgresql.org/docs/18/sql-copy.html).
- **PG18:** portable statistics support ships; exporting them remains an explicit choice. [PG18 release notes](https://www.postgresql.org/docs/18/release-18.html); [pg_dump defaults](https://www.postgresql.org/docs/18/app-pgdump.html).

## COPY FREEZE: old feature, newer visibility-map behavior

**Yes: COPY FREEZE shipped in PostgreSQL 9.3 (2013).** The release notes credit Simon Riggs and Jeff Davis. Its original purpose was to load already-frozen tuples and avoid freezing them later. [PostgreSQL 9.3 release notes](https://www.postgresql.org/docs/release/9.3.0/).

**The crucial second date is PostgreSQL 14 (2021).** COPY FREEZE began setting page visibility flags and the visibility map, including all-visible and all-frozen bits for eligible pages. Before this change, freezing the individual tuples did not populate those page-level flags. The commit credits Anastasia Lubennikova, Pavan Deolasee and Jeff Janes. Its regression tests also cover mixed ordinary COPY and COPY FREEZE: pages containing ordinary, unfrozen inserts must not simply be marked all-visible/all-frozen. [PG14 release notes](https://www.postgresql.org/docs/14/release-14.html); [implementation and regression cases, commit 7db0cd2](https://github.com/postgres/postgres/commit/7db0cd2145f2bce84cac92402e205e4d2b045bf2).

### Practical companion reading

[Hans-Jürgen Schönig, CYBERTEC: “Speed up PostgreSQL data loading with COPY (FREEZE)”](https://www.cybertec-postgresql.com/en/loading-data-in-the-most-efficient-way/) (page dated August 2014; updated July 19, 2023) walks through bulk loading, the create/truncate eligibility error, and freezing's effect on later hint-bit work. Treat its timings as the author's example, not our measurements.

**Keep the mechanisms separate:** the article attributes much of its load-time improvement to `wal_level = minimal` and truncating in the loading transaction. PostgreSQL documents that eligible ordinary COPY can also avoid data WAL under those conditions; FREEZE is not itself a switch to disable WAL. Keep WAL settings and transaction setup identical when comparing ordinary COPY with COPY FREEZE. [PG18 bulk-loading documentation](https://www.postgresql.org/docs/18/populate.html#POPULATE-COPY). For the visibility-map version boundary, use the PG14 release notes and commit above.

### What makes a load eligible?

In PG18, FREEZE applies to COPY FROM. The table must have been created or truncated in the current **subtransaction**; the loading transaction must have no open cursors or older snapshots. A partitioned-table target or foreign-table target is unsupported. Merely having an empty table is insufficient. The documentation also warns that successfully loaded frozen rows have unusual visibility to other sessions, departing from normal MVCC rules. These requirements are why an operator should not blindly add FREEZE to every COPY statement. [PG18 COPY requirements and visibility warning](https://www.postgresql.org/docs/18/sql-copy.html).

### Why doesn't an ordinary restore get this automatically?

COPY's server capability and pg_restore's orchestration are separate. PG18 pg_restore has no documented `--freeze` option. A workflow would have to arrange the eligible create/truncate and load in the same subtransaction; wrapping an arbitrary data-only restore in one transaction does not make pre-existing tables eligible. PG18 also prohibits combining `--single-transaction` with parallel restore jobs. These are concrete integration constraints, not a claim that upstream rejected the idea. [PG18 pg_restore options](https://www.postgresql.org/docs/18/app-pgrestore.html); [COPY eligibility](https://www.postgresql.org/docs/18/sql-copy.html).

That integration was already being discussed by **Bruce Momjian on January 25, 2013**, and **Dimitrios Apostolou posted a restore-freezing patch on June 10, 2025**, with transaction/TRUNCATE prerequisites. Distinguish those proposals from the COPY feature that already shipped. [Bruce's original message](https://www.postgresql.org/message-id/20130125152433.GY21914%40momjian.us); [Dimitrios's patch posting](https://www.postgresql.org/message-id/ff258f33-00d3-a944-9517-b3cccb662722%40gmx.net).

**Episode takeaway:** an eligible modern COPY FREEZE load can establish visibility during loading, without a separate vacuum pass just to establish those VM bits. It does not collect optimizer distributions: ANALYZE or supported statistics import remains a separate concern. This follows from the [VM implementation](https://github.com/postgres/postgres/commit/7db0cd2145f2bce84cac92402e205e4d2b045bf2) and [ANALYZE's documented role](https://www.postgresql.org/docs/18/sql-analyze.html). Freezing rows, populating visibility bits and collecting statistics are three distinct operations.

## New measured evidence: read before recording

[Full Forge synthesis, four charts and public evidence](forge-results.md).

| PG18.6 treatment | Join: plan / buffer accesses | Covering query: plan / buffer accesses |
| --- | --- | --- |
| Restore only | Nested Loop / 396,608 | Bitmap Heap Scan / 3,301 |
| ANALYZE | Hash Join / 2,096 | Bitmap Heap Scan / 3,301 |
| VACUUM | Nested Loop / 396,608 | Index Only Scan / 34, zero heap fetches |
| VACUUM ANALYZE | Hash Join / 2,096 | Index Only Scan / 34, zero heap fetches |
| Statistics-enabled dump, no maintenance | Hash Join / 2,096 | Bitmap Heap Scan / 3,301 |

Three fresh restores per arm. These are root buffer accesses in a small cached fixture, **not latency speedups**. PG17.11 reproduced the four default-archive arms. [Chart 1: join](assets/forge/fig1_skewed_join_pg18.png), [chart 2: visibility](assets/forge/fig2_covering_query_pg18_pg19.png).

**Five additions for Kirk:**

- **Give autovacuum credit:** twelve small restores reached observed automatic vacuum-and-analysis completion roughly 5–68 seconds after restore. In the larger fixture, smaller tables were ready before restore finished; accounts took about 384 seconds until both jobs were observed complete amid competing databases. These are observations, not an SLA. [Corrected timing chart](assets/forge/fig4_stock_autovacuum_arrival.png).
- **A SELECT can write:** the first count on an unindexed PG18 heap generated 28,251,777 WAL bytes with checksums and an intervening checkpoint; the corresponding tested read after VACUUM generated none. Maintenance moves work before users arrive. [WAL chart and conditions](forge-results.md#4-first-select-reads-can-cause-writes).
- **PG18 stats are incomplete:** expression-index statistics arrived, collected extended statistics did not. A correlated predicate estimated 3,371 rows after stats import versus 10,213 actual; ANALYZE brought it to 10,050. PG19rc1 transported the extended statistics too.
- **Imported visibility counts deserve scrutiny:** with per-table autovacuum disabled, imported `relallvisible` survived over an empty VM and the natural Index Only Scan made 10,000 heap fetches. This is a candidate concern, not a proven novel bug; importing/preserving estimates was discussed upstream. [Evidence and history](forge-results.md#3-pg18-imported-statistics-useful-with-two-distinct-gaps).
- **Different loading paths:** two pg_upgrade --link runs preserved VM and column statistics. Eligible COPY FREEZE loads established visible/frozen bits, but ordinary pg_restore did not use FREEZE. Do not generalize either result to every restore.

The larger fixture also shows that vacuuming costs time and WAL: about 4 seconds and 1.6 GB of cluster WAL in a deliberately checkpointed, single-run comparison. Budget for maintenance; don't call it free. See the [full limitations](forge-results.md#5-larger-fixture-budget-for-readiness).

## PG19: a short caveat

The inspected PG19 release-candidate source adds extended-statistics transport and conditional VM marking during eligible reads. A query may change VM coverage while it is being measured. This is not a promise that one SELECT fills every VM bit, nor that VACUUM is obsolete. Keep the core demonstration on PG18. The new PG19rc1 runs show that ANALYZE after eligible reads can refresh the visibility estimate and change the natural plan; reads alone need not do so. [Measured results](forge-results.md#4-first-select-reads-can-cause-writes). Sources: [PG19 release notes](https://www.postgresql.org/docs/19/release-19.html), [extended-statistics dump integration](https://github.com/postgres/postgres/commit/c32fb29e979db4a7b92adb29007725eeacf91f64), and [on-access VM implementation at inspected commit 0da632e084842c36ec31d87adfc401b54ed7d7b2](https://github.com/postgres/postgres/blob/0da632e084842c36ec31d87adfc401b54ed7d7b2/src/backend/access/heap/pruneheap.c). The version qualification refers to the source inspected on October 20, 2026 UTC.

## What restore guides tell readers

![Expanded audit of 28 selected pages: 8 recommend analysis, 3 recommend vacuuming, and 1 explains visibility-map readiness.](assets/restore-docs-expanded-summary.png)

Our [expanded October 20 audit](restore-docs-expanded.md) inspected 28 selected logical restore/import guides, posts and tutorials. **20/28 omit direct statistics-gathering advice; 3/28 recommend vacuuming; 1/28 explains physical VM readiness.** Aiven and Supabase explicitly recommend vacuuming, and Dalibo explains the VM mechanism. The [original twelve-page audit](restore-docs-audit.md) remains available unchanged as the baseline; the new report adds sixteen pages and records all URLs and source limitations.

This is a page-level convenience sample, not an industry-wide rate. Linked advice and automatic service behavior are separate. PostgresAI's own VM-positive how-to is disclosed as an affiliated comparator outside the sample. Keep PG13's insert-triggered autovacuum in the discussion: the issue is potentially delayed query readiness, not inevitably bad performance or nonexistent automation.

For the feature discussion, use the [proposed --vacuum-analyze contract](maintenance-option.md). PG18 omits collected extended-statistics data and physical VM transport. Tom Lane's [September 17, 2008 suggestion](https://www.postgresql.org/message-id/13358.1221663140%40sss.pgh.pa.us) already proposed pg_restore scheduling analysis for loaded tables; the history is more nuanced than blanket upstream opposition.

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
5. Does parallel maintenance mean many tables at once or a faster scan of one huge table? ([PG18 vacuumdb documents the different work performed by `--jobs` and `--parallel`](https://www.postgresql.org/docs/18/app-vacuumdb.html).)
6. How do we prove readiness with a representative workload rather than one lucky fast query?

## Essential reading

1. [PG18 pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html) — statistics export flags and omissions.
2. [PG18 pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html) — importing statistics and restore scope.
3. [Index-only scans](https://www.postgresql.org/docs/18/indexes-index-only-scans.html) — why heap fetches can remain.
4. [January 2025 include-analyze proposal](https://www.postgresql.org/message-id/flat/CACJufxGx_YLLxmnZVMuUApiVYqjKrydvEQqD3qxhwM6e0_8jrQ%40mail.gmail.com) — the proposal crediting Andrey, Nikolay and Kirk, and the responses.
5. [PG18 vacuumdb](https://www.postgresql.org/docs/18/app-vacuumdb.html) — jobs, parallel workers, staged analysis and missing-only analysis.

6. [Hans-Jürgen Schönig, CYBERTEC: COPY (FREEZE)](https://www.cybertec-postgresql.com/en/loading-data-in-the-most-efficient-way/) — practical bulk-loading example; read with the WAL-setting qualification above.

The [full research report](research.md) contains the longer history and primary sources. The [Forge results](forge-results.md) contain completed measurements; the [original experiment plan](experiments.md) remains for comparison.
