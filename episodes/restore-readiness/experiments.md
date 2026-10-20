# A bounded restore experiment for the podcast

Proposal for DBLab Forge. These tests have not been run. Target: first results within 60–90 minutes and a complete, checked preparation package within 3–4 hours. If the core takes longer, drop optional work rather than broaden the experiment.

## What needs new evidence

Existing synthetic bulk-load demonstrations explain why ANALYZE and VACUUM solve different problems. The missing piece is an actual PG18 dump/restore comparison: restore the same source data, vary maintenance, and inspect both planner statistics and the destination visibility map.

The practical question is: **Which state is missing when the restore exits, and which maintenance changes the work required by representative queries?** This small single-session experiment can answer that without a large database or a throughput benchmark.

## Small fixture, two queries

Reuse the following fixture shapes:

- A 200,000-row table with a bigint key, 100-byte payload, seeded random heap order, and a covering btree. Query a range returning 10,000 keys. This exposes visibility checks without changing query results.
- A two-table join with 200,000 customers and 100,000 orders, one order per customer, and a 99:1 status distribution. This exposes selectivity estimates and repeated inner probes without repeated customer keys letting Memoize conceal the effect.

Reuse root-plan buffer extraction and the separate forced-index-only diagnostic from the covering-index experiment. For the statistics fixture, emit estimated rows, actual rows, maximum loops, and a symmetric estimate-error ratio explicitly. Collect at least three repetitions and use actual arm names in assertions. Do not carry over a threshold that compares raw buffer counts to a multiplier without normalizing by object blocks.

Create and analyze the source once, then vacuum it and inspect its actual statistics and VM state. Dump the same source twice: default custom-format export, and export with `--statistics`. Pin the exact PG18 server patch/build, dump client, restore client, extensions, locale and settings. Do not use an unpinned image tag. Keep data, indexes and source statistics unchanged between exports.

## Minimum matrix

| Archive | Maintenance after complete restore | Fresh targets |
|---|---|---:|
| Default export | None | 3 |
| Default export | ANALYZE | 3 |
| Default export | VACUUM | 3 |
| Default export | VACUUM ANALYZE | 3 |
| Export with `--statistics` | None | 3 |

That is **15 fresh target restores**. Each target runs both queries. Never derive the four main arms by progressively maintaining the same target. Rotate arm order deterministically across repetitions. Three repeated queries against one target do not substitute for three independently restored targets.

Keep the maintenance comparison separate from the export-policy comparison: hold the archive fixed while varying maintenance; hold maintenance fixed when comparing default export with statistics export. Record first-query behavior separately from a declared warmup and subsequent query passes.

Do not predetermine which natural plan must win. The expected direction is a hypothesis: ANALYZE supplies distributions; VACUUM can establish physical visibility; statistics export can transport supported optimizer information. Observe whether those changes reduce work for these particular queries.

## Measurements that decide the result

For every target, retain:

- Exact content and row-count checks, restored object identities, archive contents, restore exit status and errors.
- Relevant optimizer statistics and relation estimates, including `relpages`, `reltuples` and `relallvisible`.
- Direct visibility-map all-visible and all-frozen page counts, before maintenance and after maintenance/query passes.
- Natural `EXPLAIN (ANALYZE, BUFFERS, SETTINGS, VERBOSE, FORMAT JSON)` plans: estimated/actual rows, loops, node types, root shared hits plus reads, and heap fetches when the natural plan uses an Index Only Scan.
- A separately labelled forced Index Only Scan diagnostic for the covering query, to expose heap fetches even when the natural planner chooses another path.

Use total **root** shared hits plus reads. Child-node buffer counters are inclusive and must not be added to their parents. These counters measure accesses, not distinct pages, physical disk reads or elapsed time.

For this single-user experiment, use plans, rows and total buffers as primary evidence. Timings may be retained as context, but do not turn a buffer reduction into a latency or throughput speedup. Report ranges across fresh targets rather than insisting that ANALYZE sampling produces identical estimates.

The charts should distinguish three things: column distributions, relation-level estimates, and the actual physical VM. Imported `relallvisible` is not proof that destination heap pages can skip visibility checks. All-visible and all-frozen are also separate observations.

## Control autovacuum without changing index-build behavior unnoticed

PG18 index creation can refresh relation estimates differently when autovacuum is disabled globally or per table. Simply copying `autovacuum_enabled=false` from an older fixture changes more than background timing.

For the controlled main matrix, keep autovacuum enabled during load and index creation. Use explicitly high, recorded per-table maintenance thresholds to prevent ordinary background analysis and insert-vacuum triggers on the small fixture. Verify the supported parameter values before execution. Inspect maintenance timestamps/counters and logs to detect contamination. Record these settings in the article: this is a controlled restore, not a claim about stock scheduling.

Record complete normal restore ordering and final state. If phase splitting is needed to inspect data-load, index-build or statistics-import effects, treat that as a separate diagnostic; a split restore is not silently equivalent to a normal complete restore.

If an imported-visible-count effect is central to the result, add one bounded enabled/disabled index-build comparison with everything else fixed. Otherwise defer it and clearly state the control limitation. Do not change costs or maintenance settings until a preferred plan appears.

## Three-to-four-hour schedule

| Time from start | Work | Exit condition |
|---|---|---|
| 0–30 minutes | Pin versions; adapt the two fixtures; verify content checks and collection | Fresh restore works, identities/settings are captured, raw plans are retained |
| 30–90 minutes | Execute the core matrix | First results show actual statistics, VM, plans and work per arm; discrepancies retained |
| 90–150 minutes | Repeat the decisive comparisons from clean setup and inspect all executable examples | Results survive a clean rerun, or uncertainty is explicitly documented |
| 150–210 minutes | Produce two figures, a concise interpretation and reading notes | Each plotted value traces to an observed plan/state; operational advice matches evidence |
| 210–240 minutes | Final factual checks and buffer for a concrete defect | Freeze scope and deliver; no new experimental branch |

Proposed resource bounds: local disposable instance, at most 4 CPUs and 4 GiB RAM, fixture below 1 GiB, 5 GiB task storage, no cloud provisioning. Suggested per-statement timeout: 60 seconds; per-target wall cap: 5 minutes. These are limits, not runtime predictions. Do not let an individual slow target consume the whole preparation window.

Stop an arm for data mismatches, restore errors, missing plans, unexpected effective settings, background maintenance contamination, timeout or insufficient storage. Preserve the unsuccessful attempt. Allow one bounded diagnosis/fix/retry for a concrete execution defect; do not rerun repeatedly to obtain the desired plot. At the hard stop, deliver the verified subset and list what remains untested.

## Optional work, in priority order

Only start an optional test after the core results and clean rerun are complete, and only if it fits the remaining four-hour window:

1. **Expression index / extended statistics:** a tiny semantic example showing expression-index creation before versus after ANALYZE, and PG18 extended-statistics definitions versus collected data after statistics export. Maximum 20 minutes; otherwise use documented behavior and mark it unmeasured.
2. **Remaining statistics-export maintenance arms:** add only if a specific unresolved comparison requires them. This would add nine fresh targets and is not necessary to establish the main distinction.
3. **PG19:** defer by default. If included, pin the exact build and measure VM before and after every query pass; reads can conditionally populate it, so warmup changes the measured state.

**Optional COPY FREEZE micro-lab (20–30 minutes; only if the core is finished):** on the same pinned PG18 build, compare an ordinary COPY with an eligible COPY FREEZE into separate freshly created heap tables, each created and loaded in its own transaction. Use identical data and covering indexes. Measure all-visible/all-frozen VM coverage immediately after load, then again after index creation and ANALYZE; compare natural plans and heap fetches. Keep statistics treatment identical between arms, record autovacuum activity and do not vacuum before the first measurements. Include a separate negative eligibility check using an empty table created in an earlier transaction. This tests the documented mechanism, not a nonexistent pg_restore flag. Link raw SQL, versions, plans and measurements; label it a custom bulk-load experiment, not a dump/restore result. [Eligibility](https://www.postgresql.org/docs/18/sql-copy.html); [upstream VM regression cases](https://github.com/postgres/postgres/blob/7db0cd2145f2bce84cac92402e205e4d2b045bf2/contrib/pg_visibility/sql/pg_visibility.sql).

Defer the PG13/PG14 historical comparison and mixed ordinary/frozen-load cases unless those versions and fixtures are already available. Long snapshots, foreign-key validation costs, parallel maintenance scheduling and multi-user throughput remain follow-up experiments. None is a prerequisite for this episode.

## What Kirk should receive

Send the reading material as soon as the verified core is available: a four-arm outcome table, two selected plan excerpts, the PG18 export/import default distinction, the historical discussion links, and a short list of questions to challenge during recording. If experiments are unfinished, supply the reading packet on time with those sections marked “not yet measured.”

The companion article should contain two derived figures: one for estimates/loops/buffer work on the skewed join, and one for VM coverage/heap fetches/buffers on the covering-index query. Include exact versions, fixture scale, relevant controls, result ranges and limits. Distinguish observations, source-based explanations and proposed follow-ups. A restore's successful exit and readiness for a particular workload are separate acceptance criteria.
