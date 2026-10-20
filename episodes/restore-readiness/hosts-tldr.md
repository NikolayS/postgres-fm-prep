# Host TL;DR — Nikolay and Kirk

**Episode:** Your restore finished. Is your database ready?  
**Read this before recording.** [Study pack](study-pack.md) · [Results and charts](forge-results.md)

## The one idea listeners should remember

**Successful restore is a data milestone. Query readiness needs its own checks.** Stats, physical visibility and the work paid by the first reader are separate concerns.

## Seven core thinking points

1. **ANALYZE and VACUUM solve different problems.** In our PG18 fixture, ANALYZE fixed the join plan; VACUUM enabled the efficient covering-index path; both were needed for both benefits. An Index Only Scan label alone proves little: check heap fetches. [Four-arm comparison](forge-results.md).
   - Ask: “What does our application need before we let traffic back in?”

2. **Statistics transport helps, but is not a physical clone.** PG18 can transport selected statistics when requested; collected extended statistics are a gap there, addressed in PG19. Neither logically restores the source VM. pg_upgrade is different because it transfers physical files. [Versioned evidence](forge-results.md).
   - Ask: “Which source facts still describe the newly loaded heap?”

3. **Autovacuum deserves credit—and time is the issue.** Normal autovacuum repaired the small test restores in observed intervals of roughly 5–68 seconds. That is not an SLA. Do we accept asynchronous preparation or require it before traffic? [Timing and limits](forge-results.md).
   - Ask: “Is the first user part of our restore procedure without knowing it?”

4. **A read can do writes.** One first count on a 27.19-MiB PG18 heap generated 26.94 MiB of WAL under the tested checksum/checkpoint settings. Hint-bit changes and full-page images explain the scale; PG19 adds conditional read-time VM work. VACUUM can schedule work earlier, but it is not free. [Controls and explanation](first-read-writes.md).
   - Ask: “Does read-only mean no logical changes, or no physical work?”

5. **PG19 makes the conclusion more interesting.** Changing only imported relallvisible selected IOS versus bitmap. First-read buffer work was nearly equal (648 vs 644); second-read work favored IOS (7 vs 325) after VM coverage improved. The initially inaccurate estimate was not universally harmful. [Independent reproduction](evidence/pg19-relallvisible/README.md).
   - Ask: “Should planning describe today's VM, or anticipate what this read will change?”

6. **Read replicas don't prepare their own VM through this PG19 feature.** Primary reads can initiate it; physical standbys receive changes through WAL replay. Replica-only reads therefore do not trigger this preparation. The possibility of replay conflicts is source-derived, not experimentally demonstrated. [Exact code and scope](pg19-standby-and-episode-angles.md).
   - Ask: “Would a primary-only benchmark predict our read-replica behavior?”

7. **The experiment itself can change the answer.** A first read changes physical state. Disabling autovacuum also changes whether index creation preserves imported estimates. Warm-up and isolation settings are part of the result. [Controls and history](forge-results.md).
   - Ask: “What would falsify our explanation—and did we test it?”

## Three additions worth making room for

- **Partitioned parents are a real autovacuum exception.** Leaves can be analyzed while parent statistics remain missing. PG19 improves `--analyze-only` and `--analyze-in-stages`; default `--analyze` still excludes parents. Autovacuum's parent behavior is unchanged. Ask: “What does waiting never fix?”
- **A logical copy changes the benchmark.** It rebuilds storage and indexes while losing some physical preparation. Ask: “Is our restored copy representative of production?”
- **Make readiness an explicit output.** A proposed manifest could record stats, completed/skipped maintenance, workload checks and replica replay. Ask: “What evidence should a human—or an agent—require before opening traffic?”

[Engineer-notes synthesis, source links and corrections](engineer-notes-synthesis.md). Optional extensions there: pgcopydb already schedules VACUUM ANALYZE, Debian's wrapper schedules ANALYZE, plus lifecycle FREEZE costs and checkpoint timing. Newly reported partition-track timings and pending FREEZE runs have not yet been validated for this briefing.

## A simple recording arc

**Hook:** a successful logical restore can leave the first query doing unexpected work.

**Explain:** estimates, physical visibility and hint preparation.

**Demonstrate:** ANALYZE versus VACUUM, then the WAL surprise.

**Complicate honestly:** PG19's better second read, replicas and partitioned parents.

**Close:** operations today; proposals for future tooling. Keep low-level record names in the article.

## Keep only three numbers in the spoken story

- PG18 covering query: **3,301 → 34 buffer accesses** after vacuuming in the small fixture.
- First count: **about 27 MiB of WAL**, with the checkpoint/checksum qualification.
- PG19 second query: **7 vs 325 accesses**, showing why we challenged our first conclusion.

These are buffer/WAL measurements, **not latency speedups**. Put the other numbers in the companion evidence.

## Short sidebar: hints and FREEZE

**Yes, first-read physical work is another reason to consider scheduled post-restore VACUUM.** Standby hint-bit updates differ from VM updates: hints can be local, and dirtying depends on checksums/wal_log_hints; standby SELECTs generate no new WAL. FREEZE is optional future-maintenance planning for stable data. All-visible is enough for Index Only Scans; all-frozen is a different goal. [Decision guide and exact source](hint-bits-standbys-freeze.md).

## End in two parts

**Operations today:** establish usable statistics; decide whether physical preparation should precede traffic; inspect representative plans, heap fetches and actual VM; check the serving replica's replay state where relevant. Measure cold/first and repeated queries separately. Budget maintenance I/O and WAL. [Practical guidance](study-pack.md).

**Future PostgreSQL:** should pg_restore offer an explicit post-commit maintenance phase for loaded tables? Should logical restores derive visibility estimates from destination state? Could eligible bulk loading establish more state safely? These are proposals, not accepted fixes. [Option design](maintenance-option.md).

## Tone and guardrails

Be curious, practical and fair. Explain the mechanism before criticizing the default. Say what we measured, what source inspection supports, and what is still unknown. The docs audit is a selected-page sample, not an industry rate. Do not say PostgreSQL developers overlooked a proven bug or that PG19 removes the need for maintenance.

**Closing:** “Don't stop at restore succeeded. Show that the queries you care about are ready.” Link the PostgresAI companion article and public evidence once available; do not claim the entire Forge study is publicly reproducible until its publication bundle is complete.
