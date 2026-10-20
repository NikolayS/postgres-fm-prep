# Useful additions from the Forge engineer's host notes

[Host TL;DR](hosts-tldr.md) · [Study pack](study-pack.md)

Reviewed October 20, 2026 against the supplied eight-page PDF, existing measurements, and the primary sources linked below. The supplied document is an editorial input, not independent proof of every claim. Its pending experiments remain pending here unless underlying results have been reviewed. The source PDF is not republished.

## 1. Partitioned parents: waiting is not always the solution

This is the most useful operational addition. Autovacuum analyzes leaf partitions, but does not automatically analyze the partitioned parent. A parent can therefore lack useful inherited statistics after its leaves have been processed. Schedule explicit parent analysis where needed; don't judge the whole partition tree by leaf activity counters. [Official guidance](https://www.postgresql.org/docs/19/routine-vacuuming.html#VACUUM-FOR-STATISTICS).

PG19 also changes the **vacuumdb client's** no-explicit-target behavior for `--analyze-only` and `--analyze-in-stages`: those modes now include partitioned tables. **The PG19 no-target `--analyze` mode still excludes partitioned parents.** This is not a server-side autovacuum fix; distinguish the installed client version and selected mode. [vacuumdb documentation](https://www.postgresql.org/docs/19/app-vacuumdb.html). [PG19 release notes](https://www.postgresql.org/docs/19/release-19.html#RELEASE-19-SERVER-APPLICATIONS).

The supplied PDF reports leaves analyzed in 13–15 seconds while a parent remained unanalyzed over 480 seconds. We have not reviewed the underlying outputs for that new track, so do not present those timings as verified campaign results yet. The documented mechanism is sufficient for the episode.

**Question:** “When does 'wait for autovacuum' mean wait for something that will never analyze this object?”

## 2. Separate missing information from unfinished physical work

The notes improve the story by naming three initial gaps: distribution statistics, VM coverage, and unestablished tuple hints. For teaching, keep three concepts while explaining that hints and VM coverage are different physical states. ANALYZE can incidentally touch pages and set hints; it does not guarantee a complete hint-preparation pass. Do not put a categorical 'ANALYZE never changes hints' in a table.

The restored database is logically correct. It may still have poor estimates, extra heap visibility work and first-reader writes. An empty VM does not prohibit an Index Only Scan node: it means the executor must perform heap checks for pages whose VM bits remain clear. [Measured single-field example](evidence/pg19-relallvisible/README.md).

## 3. Restore tooling already makes different choices

Useful comparison: core restore, wrappers that schedule analysis, and tools that explicitly vacuum copied tables. Compare documented behavior and versions, not a ranking that one tool is universally correct. Tool behavior also differs from what a provider's tutorial tells the reader.

Two verified positive examples, inspected October 20, 2026:

| Tool / documentation inspected | Documented behavior | Scope limit |
| --- | --- | --- |
| [pgcopydb clone, 0.18~dev docs](https://pgcopydb.readthedocs.io/en/latest/ref/pgcopydb_clone.html) | Queues copied tables for VACUUM ANALYZE; `--skip-vacuum` disables it | Documented workflow, not independently executed here; no claim of complete readiness for every object |
| [Debian unstable pg_restorecluster manual](https://manpages.debian.org/unstable/postgresql-common/pg_restorecluster.1.en.html) | Runs ANALYZE after starting the restored cluster | Analysis is not the same as vacuuming |

**Question:** “Some tools already include preparation. What should core pg_restore promise, and what should its exit status mean?”

Keep the existing [page-level documentation audit](restore-docs-expanded.md) as the source of audited omission counts. The PDF's blanket statement that nobody mentions VM preparation is not supported by that audit: there are positive examples, including Dalibo. Do not replace the audit with an uncited vendor list.

## 4. FREEZE: a maintenance window now versus future work

Bulk restoration can concentrate tuple transaction ages into a relatively narrow range, making the future freezing schedule worth considering. The exact distribution depends on restore transaction boundaries, parallelism, table age metadata and subsequent maintenance. It does not prove the entire database will require freezing simultaneously.

For largely immutable data, ask whether establishing frozen state during the restore window is worthwhile. For rapidly changing data, the benefit may be smaller. Don't extrapolate lifetime savings or equal costs from the one-run larger fixture. The notes list further FREEZE/compression variants as running; those are not completed results in this synthesis. [Current decision guide](hint-bits-standbys-freeze.md).

**Question:** “Do we optimize the restore deadline, the first hour of traffic, or maintenance over the next year?”

## 5. Checkpoint timing is a variable, not a deadline to race

The notes suggest acting before the next checkpoint. The underlying lesson is useful: record page/checkpoint conditions when measuring maintenance WAL. But do not promise that starting immediately avoids FPIs across a large restore, or prescribe suppressing checkpoints. Different pages may have crossed different WAL/checkpoint boundaries already. Compare total restore-plus-preparation-plus-first-read cost under controlled conditions. [Measured controls](first-read-writes.md).

## 6. Does a logically restored copy represent production?

A logical copy rebuilds physical storage and indexes. It can lose source fragmentation/bloat while also losing physical visibility preparation. It can therefore be faster in one respect and slower in another. Neither perfect physical ordering nor universal lack of bloat should be assumed. A physical copy preserves more source state, but cache, hardware, concurrent load and recovery state can still differ.

This is a strong discussion question, not a benchmark result from this campaign: **“Are we testing the production database, or the database we wish production were?”** Migration-method choice still has compatibility, downtime and operational constraints; don't recommend pg_upgrade or pg_createsubscriber solely from this small readiness fixture.

## 7. A readiness manifest is a useful future idea

Instead of a single success message, could tooling report which restored objects have usable statistics, which maintenance ran, what was skipped or failed, and which representative checks passed? Keep raw VM and catalog estimates separate. For replica-serving workloads, add replay progress. This could help both humans and agents make an explicit decision.

A manifest would record evidence, not certify universal readiness: there is no one global VM percentage or pg_stats row count that guarantees good plans for every workload. [Existing maintenance-option design](maintenance-option.md).

## Corrections retained in our combined briefing

| Tempting simplification in the supplied notes | Wording we can defend |
| --- | --- |
| Empty VM makes IOS impossible | IOS can run with heap fetches; inspect execution, not only the node name |
| Nonzero relallvisible means ready | Compare actual VM, relevant statistics and representative plans |
| Imported visibility estimates always make things worse | PG18 diagnostic was adverse; isolated PG19 repeated-query result favored retaining the estimate |
| Autovacuum repairs everything / naptime explains all timing | Parent analysis is a gap; worker capacity, thresholds and workload affect timing |
| 96 versus 4 seconds proves only cost-delay effects | Scheduling/settings differ; no isolated causal comparison establishes 'only' |
| Everyone freezes at exactly the same time | Concentrated ages are a risk to investigate, not a universal schedule |
| Run before checkpoint and every page is cheap | Checkpoint/page state affects WAL; no guaranteed cheap window |
| Physical copy is always the right migration | Preserved state is one consideration among operational constraints |

## Provenance

Editorial input: user-supplied “Restore readiness podcast TL;DR”, eight pages, exported October 20, 2026. PDF SHA-256: `4796347c6a2783f721bea6ba52c468e16b5167867b005b4bdc758b3b039d63ee`. The supplied PDF was read in full. Claims above link to independently accessible technical evidence where available. The source PDF is not included in this repository.
