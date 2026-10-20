# Your restore finished. Why are queries still slow?

Postgres.FM preparation for Nikolay Samokhvalov and Kirk Wolak. Research as of 2026-10-20 UTC.

**Scope:** historical research, source inspection, documentation audit, and synthesis of supplied Forge experiments. The [new results report](forge-results.md) contains measured outcomes, four charts and public evidence. Preparing these materials did not execute new database experiments. No newly confirmed PostgreSQL defect is claimed.

## New experimental evidence

The [Forge synthesis](forge-results.md) now covers PG17/18 maintenance arms, PG18 statistics import, normal autovacuum, first-read WAL, a larger fixture, two pg_upgrade runs, extended/expression statistics and COPY FREEZE. Key qualifications: normal autovacuum helped; collected extended statistics remain a PG18 gap; imported visibility counts can disagree with physical VM; first-query writes depend on checkpoint/checksum state; larger-fixture timing is single-run and background arrival was confounded by other databases.

## Recommendation

Make the episode about **the gap between a successful logical restore and a database ready for its workload**. Use two separate questions: does the planner know the data distribution, and can an index-only scan avoid visiting the heap? Show how ANALYZE and VACUUM address different state, then explain what PG18 statistics transport does and does not preserve.

## Findings that should anchor the episode

1. **The question is old.** In April 2002, hackers explicitly debated adding ANALYZE to restores. Convenience and predictable first-query behavior competed with scope, control, and the expectation of automatic maintenance. The question returned in 2003 and 2025; the modern feature took a different route: transporting statistics. [2002 thread](https://www.postgresql.org/message-id/flat/1017820759.2058.10.camel%40rh72.home.ee)
2. **PG18 export is off by default; import is not.** `pg_dump --statistics` opts in. `pg_restore` normally restores included statistics. PG18 `pg_upgrade` transfers most optimizer statistics by default. The phrase “stats restore is off by default” conflates these programs. [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html), [pg_upgrade](https://www.postgresql.org/docs/18/pgupgrade.html)
3. **Statistics do not recreate the physical visibility map.** A logical restore builds new heap storage; source physical page visibility cannot simply be copied. PG18 relation-statistics import can carry a visible-page count in `pg_class`, but that is not the destination's per-page visibility certificate. [Relation-statistics implementation](https://github.com/postgres/postgres/blob/REL_18_0/src/backend/statistics/relation_stats.c), [VM documentation](https://www.postgresql.org/docs/18/storage-vm.html)
4. **Forge has convincing VM mechanism evidence, but not an end-to-end restore comparison.** Its fixtures use INSERT. Its missing-statistics case is incomplete. See [existing experimental observations](existing-observations.md).
5. **The version boundary matters.** The inspected PG19 release-candidate source adds extended-statistics transport and conditional on-access VM population. A read can change the VM during a benchmark. “Only VACUUM sets it” is false; COPY FREEZE was an earlier exception. [PG19 release notes](https://www.postgresql.org/docs/19/release-19.html), [on-access commit](https://github.com/postgres/postgres/commit/b46e1e54d078def33b840ae1fa6c5236a7b12ec2)

## The historical trail, 2001–2026

This is a thematic search across the requested 25-year period, not an exhaustive census of every message. The earliest directly relevant discussion verified here is April 2002. Some important practical reports were on other lists; they are explicitly identified below.

| Date | What the primary evidence says | Why it matters now |
| --- | --- | --- |
| April 2002 | Christopher Kings-Lynne finds `pg_statistic` empty after restore and proposes ANALYZE at the end. Neil Conway supports a default with an opt-out. Gavin Sherry and Tom Lane raise control/scope objections. Hannu Krosing argues users suffer from bad defaults. | This is the direct ancestor of the episode's question, rather than a retrospective inference. [Opening proposal](https://www.postgresql.org/message-id/GNELIHDDFBOCMGBFGEFOOEOPCBAA.chriskl%40familyhealth.com.au), [thread](https://www.postgresql.org/message-id/flat/1017820759.2058.10.camel%40rh72.home.ee) |
| April 2002, conclusion | Tom argues maintenance is needed routinely anyway and favors automatic background vacuum/analysis. Justin Clift distinguishes analysis from vacuum; Tom confirms the intended automatic process includes analysis. | Historical policy direction, not proof that today's autovacuum will meet a restore's traffic deadline. [Tom](https://www.postgresql.org/message-id/10511.1017856566%40sss.pgh.pa.us), [clarification](https://www.postgresql.org/message-id/11785.1017862210%40sss.pgh.pa.us) |
| February–March 2003 | The question returns after a slow 7.2→7.3 restore. Tom Lane raises uncertainty about whether loading is finished, then explicitly reconsiders per-table ANALYZE because analysis had become cheaper. Bruce commits a documentation recommendation. | Avoid portraying the 2002 position as permanent or unanimous. [Reconsideration](https://www.postgresql.org/message-id/27615.1046376756%40sss.pgh.pa.us), [thread and documentation follow-up](https://www.postgresql.org/message-id/flat/13176.1046368542%40sss.pgh.pa.us) |
| September 2008 | Tom Lane suggests that a parallel pg_restore generate and schedule ANALYZE for loaded tables, instead of including it in pg_dump output. Simon Riggs notes other load workflows would still need a solution. | Evidence that restore-aware maintenance scheduling had upstream advocates. [Tom Lane, September 17](https://www.postgresql.org/message-id/13358.1221663140%40sss.pgh.pa.us), [Simon Riggs, September 17](https://www.postgresql.org/message-id/1221673494.3913.2148.camel%40ebony.2ndQuadrant) |
| 2009 / PG8.4 | The visibility map arrives to let VACUUM skip eligible pages. | The VM originally addressed maintenance efficiency; it was not part of the 2002 analysis debate. [Release notes](https://www.postgresql.org/docs/8.4/release-8-4.html) |
| March 2012 | Daniel Farina explains why post-upgrade ANALYZE downtime and catastrophic uninitialized plans are both unacceptable. Bruce says portable stats are on the TODO list but catalog changes make upgrades more fragile. Tom discusses the lack of a stable statistics representation. | Explains the technical portability problem: copying internal catalog rows is not a durable interchange format. This thread is about pg_upgrade, a related but different workflow. [Opening](https://www.postgresql.org/message-id/CAAZKuFaWdLkK8eozSAooZBets9y_mfo2HS6urPAKXEPbd-JLCA%40mail.gmail.com), [Bruce](https://www.postgresql.org/message-id/20120313031037.GH10441%40momjian.us), [full thread](https://www.postgresql.org/message-id/flat/20120313141025.GI10441%40momjian.us) |
| September 2012 / PG9.2 | Index-only scans use a crash-safe VM to avoid heap visits. pg_upgrade gains a script generating increasingly accurate statistics in stages. | Establishes both the query-performance role of VM and the older strategy of quickly rebuilding minimal statistics after upgrades. [Release notes](https://www.postgresql.org/docs/9.2/release-9-2.html) |
| January 2013 | Bruce asks why single-transaction pg_restore does not use COPY FREEZE. He raises target-version compatibility and whether pg_restore could inject FREEZE. Simon Riggs puts it on the 9.3 discussion list. | Load-time visibility/freezing is an old design avenue; it was not invented in response to PG18. This is a proposal, not evidence of a shipped option. [Original](https://www.postgresql.org/message-id/20130125152433.GY21914%40momjian.us), [reply](https://www.postgresql.org/message-id/CA%2BU5nM%2BXvkUu9ran%2B5cY%3DTWQquLTpvzte4KVMK%3DaDfbr-xfNXA%40mail.gmail.com) |
| September 2013 / PG9.3 | COPY FREEZE ships, credited to Simon Riggs and Jeff Davis. | Initially freezes tuples; page-level visibility marking arrives in PG14. [9.3 release notes](https://www.postgresql.org/docs/release/9.3.0/), [later VM change](https://github.com/postgres/postgres/commit/7db0cd2145f2bce84cac92402e205e4d2b045bf2) |
| November–December 2015 | Dmitry Ivanov proposes backing up pg_statistic. Tom objects to raw catalog INSERTs, describes function-based per-slot import, and explains validation and extension-statistics difficulties. Bruce discusses versioned input. | Portable representation and validation were concrete unresolved design work years before PG18. [Proposal](https://www.postgresql.org/message-id/724322880.K8vzik8zPz%40abook), [Tom](https://www.postgresql.org/message-id/6221.1450840565%40sss.pgh.pa.us) |
| January 2021 / PG14 | COPY FREEZE gains setting of page all-visible and VM bits. | Freezing tuples and populating the VM are distinct implementation steps. This change makes the old restore proposal more useful. [Commit](https://github.com/postgres/postgres/commit/7db0cd2145f2bce84cac92402e205e4d2b045bf2), [CommitFest](https://commitfest.postgresql.org/patch/2009/) |
| August 2023–February 2025 | Corey Huinker's Statistics Import and Export thread develops a portable approach, motivated by upgrade readiness and planning use cases. Integration into dump/restore enables pg_upgrade to transfer statistics. | A long-standing need becomes supported tooling. Early JSON/view proposals must not be confused with the final interfaces. [Thread opening](https://www.postgresql.org/message-id/CADkLM%3DcB0rF3p_FuWRTMSV0983ihTRpsH%2BOCpNyiqE7Wk0vUWA%40mail.gmail.com), [integration commit](https://github.com/postgres/postgres/commit/1fd1bd871012732e3c6c482667d2f2c56f1a9395) |
| January 14, 2025 | Jian He proposes opt-in `--include-analyze` for dump/restore, explicitly crediting Andrey Borodin, Nikolay Samokhvalov and Kirk Wolak after their livestream. Tom questions whether statistics transport supersedes it; Nathan expects transport to be faster and usable by pg_upgrade. | A direct connection to this episode. The proposal is absent from inspected PG18/19 source; the thread records pushback, not a formal permanent rejection. [Proposal and replies](https://www.postgresql.org/message-id/flat/CACJufxGx_YLLxmnZVMuUApiVYqjKrydvEQqD3qxhwM6e0_8jrQ%40mail.gmail.com) |
| March–August 2025 | Default behavior is contested; a May 27 commit disables statistics export by default while leaving restore and upgrade enabled. The August 2 rename changes `--with-statistics` to `--statistics`. | Explains conflicting prerelease articles and why the episode must show released flags. [Default commit](https://github.com/postgres/postgres/commit/34eb2a80d5a3ea1392e4a9f16ebac54e96d0c6ed), [rename](https://github.com/postgres/postgres/commit/a3e8dc14386221e2db0fe92589327c5b2dea22af) |
| June–July 2025, pgsql-performance and CommitFest | A 10 TB restore report describes very expensive foreign-key validation. Frédéric Yhuel suggests VM-building vacuum between data and post-data. Dimitrios Apostolou posts a `pg_restore --freeze` patch depending on a transaction/TRUNCATE change. | Missing physical readiness can affect work inside the restore itself, not only later application traffic. Reported timings are someone else's workload, not our benchmark. [Thread](https://www.postgresql.org/message-id/flat/5f002654-92e9-8032-3e1a-134461b4e819%40gmx.net), [patch posting](https://www.postgresql.org/message-id/ff258f33-00d3-a944-9517-b3cccb662722%40gmx.net), [CF5826](https://commitfest.postgresql.org/patch/5826/) |
| 2026 / PG19 | Extended statistics become transportable. Query heap access can conditionally mark pages all-visible. The latter remains in inspected REL_19_STABLE, including later heuristic fixes. | PG18 limitations must be version-labelled. A PG19 query can change the subject of the measurement. [Extended-statistics change](https://github.com/postgres/postgres/commit/c32fb29e979db4a7b92adb29007725eeacf91f64), [on-access change](https://github.com/postgres/postgres/commit/b46e1e54d078def33b840ae1fa6c5236a7b12ec2), [September correction](https://github.com/postgres/postgres/commit/13243ae44cf6d81f666223d3385bdf0a824cd07d) |

The 2002 debate predates the VM/index-only-scan story. Do not describe it as rejecting modern VM restoration. Nor does a discussion or uncommitted patch establish that PostgreSQL rejected a feature permanently.

## Why statistics export is off by default

The strongest supported answer combines **what a dump represents, compatibility expectations, and additional cost**. There was no unanimous view.

- **Canonical schema/data versus derived metadata.** Greg Sabino Mullane argues that statistics are changing, recreatable metadata and not part of the expected default dump. Robert Haas also grounds the choice in user expectations, rather than only feature maturity. This matters for dumps used as portable representations and comparisons as well as operational backups. [Greg, May 10](https://www.postgresql.org/message-id/CAKAnmmL35eCAX-XoqwFzauaoJekyM5aNQpTaWDU2GvjeChkyog%40mail.gmail.com), [Robert, April 2](https://www.postgresql.org/message-id/CA%2BTgmoYXspGT4dc3jY8B_eJgsT7m%3DiwqF1i4te3HyG8FdTr1nA%40mail.gmail.com)
- **Dump scope and resource costs.** Discussion raises added time and client memory, and questions whether every existing backup invocation should acquire this work implicitly. Early implementation memory concerns were subsequently addressed; do not imply an early reported OOM remains a released defect. [Robert, March 6](https://www.postgresql.org/message-id/CA%2BTgmoYGuEC%3DE4TbomRyqO8%2BUav%3D90G0dYXw%3DrA1d5UmRB76Yg%40mail.gmail.com), [Andres](https://www.postgresql.org/message-id/vhlnlrhgqaqxcjioyeyjoxuqzaccvsrbgeuqclalzqg5sp4u2k%4042sqfxto23gg)
- **Upgrade has a different readiness expectation.** Retaining statistics by default is particularly useful when the objective is returning an existing workload to service quickly. Corey describes clients reconnecting into bad plans and overwhelming the system before analysis can catch up. This is the practical counterargument to opt-in export. [Corey, March 6](https://www.postgresql.org/message-id/CADkLM%3DdTTf9tonKsQnDCDp5oyODE2mFV7K6nFuCp84QE3GBWuQ%40mail.gmail.com)
- **If explicitly included, restore it.** The May discussion separates exporter defaults from importer behavior. A user choosing an archive with statistics should not need a second opt-in just to consume its contents. [Greg](https://www.postgresql.org/message-id/CAKAnmmJ5S48AYbf0g%2Bzjni%2B-mCHqstrE6kULsFFsv1MhuOL5iA%40mail.gmail.com), [Nathan](https://www.postgresql.org/message-id/aC98o_zcR7eiCmPH%40nathan), [actual committed result](https://github.com/postgres/postgres/commit/34eb2a80d5a3ea1392e4a9f16ebac54e96d0c6ed)

The debate reopened in June. The final defaults therefore represent a choice among legitimate workflows, not a conclusion that statistics are unimportant or always unsafe. The January 2025 response to `--include-analyze` and the later export-off default create a useful question: statistics transport can replace some analysis work only when the archive actually includes it. VM and other missing state remain separate. The question for the episode: **Should operational backup tooling explicitly choose a stronger readiness contract than the general-purpose default?** That is our recommendation to evaluate, not an attributed upstream consensus.

## Why not simply append maintenance to every restore?

See the [proposed opt-in maintenance phase](maintenance-option.md), including the newly documented 2008 scheduling suggestion and concrete scope/transaction questions.

**Historical evidence:** the 2002 discussion preferred user control and recurring automatic maintenance over forcing a restore-end ANALYZE. It does not establish that an optional modern maintenance phase would be a bad idea. The 2025 statistics-default discussion concerns transporting metadata, which is different from generating fresh statistics by scanning the destination.

**Current design constraints, inferred from documented behavior:** VACUUM cannot execute inside a transaction block, while pg_restore supports an all-or-nothing single-transaction mode. An automatic vacuum phase would therefore need a separate post-commit contract. Parallel restores and selective/data-only restores also require deliberate object scope and scheduling. ANALYZE has different constraints: analysis before expression indexes or statistics objects exist may leave their data missing. These are reasons to design the feature carefully, not evidence that it is impossible. [VACUUM restrictions](https://www.postgresql.org/docs/18/sql-vacuum.html), [restore modes](https://www.postgresql.org/docs/18/app-pgrestore.html), [expression-index analysis](https://www.postgresql.org/docs/18/sql-createindex.html)

**Operational question to test:** should a restore tool offer a separate readiness phase with progress, concurrency, failure reporting, and a critical-table priority list? Running maintenance automatically adds work and cannot by itself guarantee a workload's service target. Conversely, delegating everything to background maintenance gives no restore-specific completion barrier. The episode should compare these contracts rather than assume one command sequence is universally optimal.

## What each operation restores or rebuilds

| State | Default logical restore | PG18 with statistics exported | What still needs attention |
| --- | --- | --- | --- |
| Data and object definitions | Restored within selected scope | Same | Constraints, errors, selected objects and application checks |
| Column / supported expression-index optimizer data | Generally absent until ANALYZE or other actor supplies it | Supported collected data imported | Missing, stale or unsupported stats; expression indexes must exist before collecting their stats |
| Extended-statistics definitions | Definitions can be restored | Definitions can be restored | PG18 does not transport their collected data; ANALYZE required. PG19 adds transport |
| Relation estimates including `relallvisible` | Some estimates can be established during load/index/maintenance | May be imported and later updated | Inspect actual restore order; estimates are not the VM |
| Physical VM | Source VM not transported | Still not transported | Destination vacuum or eligible alternative path; inspect actual coverage |
| Cumulative activity counters | Not a transported performance history | Not restored as optimizer data | Null `last_analyze` alone does not prove imported stats absent |

Sources: [PG18 dump documentation](https://www.postgresql.org/docs/18/app-pgdump.html), [stats administration functions](https://www.postgresql.org/docs/18/functions-admin.html), [PG19 dump documentation](https://www.postgresql.org/docs/19/app-pgdump.html).

For PG18, `--data-only` excludes statistics; do not treat it as “all content except schema.” Pin source server, dump client, restore client, and destination server independently. A PG18 destination cannot invent statistics omitted by an older dump client. A supported newer client can dump an older server; record this explicitly. [Restore options](https://www.postgresql.org/docs/18/app-pgrestore.html)

### Why the VM cannot simply come along

A visibility map is tied to heap blocks, tuple visibility, and the destination's transaction history. Logical dumping transports values and definitions rather than the original physical heap and its VM fork. New block placement and new insert transactions require visibility to be established for the destination. This differs from physical backups and pg_upgrade's reuse of relation files. [VM](https://www.postgresql.org/docs/18/storage-vm.html), [index-only scans](https://www.postgresql.org/docs/18/indexes-index-only-scans.html), [pg_upgrade](https://www.postgresql.org/docs/18/pgupgrade.html)

An Index Only Scan can still have many heap fetches: the executor checks the real VM. `relallvisible` helps the planner cost the path but cannot authorize skipping heap checks. All-visible is sufficient for this optimization; all-frozen is a separate state. Plain VACUUM may establish all-visible coverage without making every page all-frozen. [Executor source](https://github.com/postgres/postgres/blob/REL_18_0/src/backend/executor/nodeIndexonlyscan.c)

ANALYZE collects distributions and refreshes relation estimates from the existing map; it does not build PG18 VM bits. VACUUM updates physical visibility and relation estimates, but does not replace distribution sampling. These actions are distinct without being perfectly orthogonal. [ANALYZE source](https://github.com/postgres/postgres/blob/REL_18_0/src/backend/commands/analyze.c), [maintenance documentation](https://www.postgresql.org/docs/18/routine-vacuuming.html)

**Source-derived concern, now observed in the supplied Forge diagnostic:** importing high source `relallvisible` into a new heap can produce optimistic index-only-scan costing without physical VM coverage. But normal post-data index creation can overwrite those estimates. PG18 deliberately suppresses that heap-estimate refresh when autovacuum is disabled globally or per table. Consequently, “disable autovacuum for a clean experiment” changes more than background timing. Compare default ordering, stats-last ordering, and enabled/disabled controls. The [new Forge results](forge-results.md#3-pg18-imported-statistics-useful-with-two-distinct-gaps) observed the mismatch and extra heap fetches with per-table autovacuum disabled. A single-field control and independent execution of a minimized reproducer remain before calling it a confirmed defect. [Index source](https://github.com/postgres/postgres/blob/REL_18_0/src/backend/catalog/index.c), [associated change](https://github.com/postgres/postgres/commit/d611f8b1587b8f30caa7c0da99ae5d28e914d54f)

See the [COPY FREEZE study section](study-pack.md#copy-freeze-old-feature-newer-visibility-map-behavior) for the 9.3/14 distinction, exact eligibility requirements, MVCC caveat and restore integration constraints.

Companion reading: [Hans-Jürgen Schönig's CYBERTEC article](https://www.cybertec-postgresql.com/en/loading-data-in-the-most-efficient-way/) (August 2014; updated July 19, 2023). Its loading example combines FREEZE with a same-transaction TRUNCATE and `wal_level = minimal`. Separate WAL avoidance from freezing: [official bulk-loading documentation](https://www.postgresql.org/docs/18/populate.html#POPULATE-COPY) describes WAL avoidance for eligible ordinary COPY too. The article's timings are external illustrative results, not this episode's benchmark.

COPY FREEZE is a possible load-time alternative with transaction, snapshot and object constraints. The 2025 proposal depends on putting TRUNCATE and COPY in the appropriate transaction. CF5826 was listed as Needs review / needs rebase; no `--freeze` option appears in the inspected PG18 or PG19 source. Do not turn that into a supported command or a claim of formal rejection. [COPY requirements](https://www.postgresql.org/docs/18/sql-copy.html), [proposal](https://commitfest.postgresql.org/patch/5826/)

**PG19 caveat (release-candidate development line as of this research):** conditional on-access all-visible marking is retained in the pinned source. It depends on visibility horizons, page/lock/WAL conditions and eligible heap access. It neither guarantees complete coverage nor replaces freezing. Actual VM can improve while `pg_class.relallvisible` remains behind. Measure both before and after reads. See the [pinned PG19 implementation](https://github.com/postgres/postgres/blob/0da632e084842c36ec31d87adfc401b54ed7d7b2/src/backend/access/heap/pruneheap.c).

## What the existing experimental evidence shows

Earlier synthetic experiments already demonstrate the VM mechanism with ANALYZE completed before measurement. They do not actually invoke pg_dump/pg_restore. A separate missing-statistics case has no recorded after-ANALYZE comparison. The useful published analysis and its limitations are summarized in [existing observations](existing-observations.md).

The essential new work is therefore an actual dump/restore matrix, not another isolated VACUUM example. The [hours-scale experiment plan](experiments.md) defines priorities and stop rules.

## Experiment backlog and the hours-scale scope

The table below is a broader research backlog, not a checklist to finish before recording. The [hours-scale plan](experiments.md) controls this preparation window: five PG18 archive/maintenance combinations, three fresh restores each, and plans/rows/buffers as primary evidence. Expression/extended-statistics examples are optional; PG19 and multi-user workload testing are deferred by default. Phase-by-phase diagnostics are added only to resolve a concrete discrepancy. Proposed tests below have **not** been executed.

| Priority | Experiment | Decisive output |
| --- | --- | --- |
| P0 | Four independently restored PG18 arms: no maintenance; ANALYZE; VACUUM; VACUUM ANALYZE | One skewed selectivity/join query and one covering-index query. Estimated/actual rows, natural plans, root buffers, heap fetches, actual VM and relation estimates. |
| P0 | Same fixture, default dump versus `--statistics` | Archive contents, imported column data and final destination state. Expression/extended data and intermediate phases are optional diagnostics. Include autovacuum-enabled index-creation behavior as a control. |
| P0 | Correct Forge buffer summarization and preserve complete raw plans | Root inclusive counters only; separate forced-plan diagnostics. Repeated independently restored arms, declared warm/cold conditions, no universal latency claim. |
| P1 | Expression index created before versus after ANALYZE; PG18 extended stats object | Show why a final analysis pass can matter and why object definitions do not imply collected statistics. |
| P1 | PG19 repeat of VM experiment, measuring before/after every query pass | Distinguish cache warming from on-access map changes; inspect `relallvisible` separately. |
| P1 | Stats-last restore, then ANALYZE, then VACUUM | Test the imported-visible-count hypothesis without presenting it as ordinary restore behavior. |
| P2 | Maintenance scheduling across many tables versus one huge table | Time to critical workload readiness, total maintenance time, CPU/I/O and connection use. |
| P2 | Separate COPY FREEZE eligibility test and ordinary-COPY old-snapshot control | Explain transaction requirements and why VACUUM cannot promise complete visibility under every concurrent workload. |

For the recording, use the bounded core in experiments.md; add a concise expression-index example only if time remains. PG19 and restore-time freezing can be a short coda or a follow-up, rather than expanding the core episode into a patch review.

Capture exact server/client versions and image digests, data seed, table/index definitions, GUCs and reloptions, archive TOC, stderr/exit status, content checks, raw JSON plans, map summaries, catalog snapshots, repetitions and maintenance timeline. Treat query order as a controlled factor. On PG19 the measurement query can mutate VM state. Do not disable autovacuum without recording its source-level effect on index statistics.

Run snapshot and COPY FREEZE tests in disposable databases as separate arms. For the ordinary-COPY control, establish an old snapshot before loading, commit the load, inspect VM after vacuum, release the snapshot, and inspect after another vacuum. Test COPY FREEZE separately with its required creation/truncation transaction and snapshot conditions.

For a later controlled operational study, use **time to workload readiness** as the metric: the first sustained measurement interval in which the fixed representative workload meets declared latency, throughput, error-rate and concurrency targets. This requires an appropriately isolated multi-user workload experiment; it is not an acceptance gate or a measured claim for the present single-session plan/buffer study. Choose the interval and targets before that execution. Restore exit time, first-query time, warmed throughput and full maintenance completion are separate observations. No single percentage of global VM coverage defines readiness for every workload.

## Documentation coverage audit

The [expanded 28-page audit](restore-docs-expanded.md) records 8/28 pages with direct analysis advice, 3/28 with post-restore vacuum guidance and 1/28 explaining VM readiness. It includes positive examples, all source URLs, timestamps, hashes, mixed-page-scope limitations and the unchanged original twelve-page cohort. These are descriptive page counts, not a representative estimate of all documentation or provider automation.

## Autovacuum fairness

[Insert-triggered autovacuum since PG13](autovacuum-readiness.md) materially narrows the gap: restored tables can become all-visible without explicit manual vacuuming, and autoanalyze can supply statistics. The unresolved operational question is whether each important table is ready when traffic starts. Do not claim all restores remain unmaintained, every user suffers a slowdown, or the default naptime bounds completion. The experiment plan includes a normal-autovacuum control.

## Practical operator checklist to teach

- Identify logical restore versus physical recovery/pg_upgrade, exact tool versions, and archive scope. Verify restore errors and required objects before investigating performance.
- Inspect actual optimizer data; do not infer absence from cumulative timestamps. Imported-but-stale data is different from missing data.
- Analyze critical tables after required expression indexes/statistics objects exist. An explicit column-list ANALYZE can skip expression-index statistics in PG18. Partition parents need explicit analysis attention. [CREATE INDEX](https://www.postgresql.org/docs/18/sql-createindex.html), [ANALYZE implementation](https://github.com/postgres/postgres/blob/REL_18_0/src/backend/commands/analyze.c)
- Inspect actual VM and query heap fetches for important index-only paths. Neither `relallvisible` nor the Index Only Scan label proves zero heap access. [pg_visibility](https://www.postgresql.org/docs/18/pgvisibility.html)
- Choose maintenance concurrency deliberately. `vacuumdb --jobs` runs commands across connections/tables; `--parallel` targets eligible index-vacuum phases, not a parallel heap scan of one giant table. [vacuumdb](https://www.postgresql.org/docs/18/app-vacuumdb.html)
- PG18 missing-stats-only analysis can prioritize absent statistics; it does not detect all stale data or fill VM. Staged analysis may replace good existing statistics with coarser early samples; apply it intentionally. [vacuumdb options](https://www.postgresql.org/docs/18/app-vacuumdb.html)
- Confirm readiness with the actual critical workload and retain the evidence. Background autovacuum is not a completion barrier tied to the restore process.

Do not teach `VACUUM FULL` as a routine requirement, `--parallel` as “parallel everything,” or “ANALYZE always fixes slow queries.”

## Suggested 28-minute episode

| Minutes | Segment | Screen / takeaway |
| --- | --- | --- |
| 0–3 | The restore succeeded; the application is slow | State the workload acceptance test and show correct rows with poor work efficiency. |
| 3–9 | Two missing kinds of state | Four-arm matrix: distributions, aggregate estimates, actual VM. Show one plan change and one heap-fetch change. |
| 9–14 | PG18: what changed and what the defaults mean | Actual options/TOC; stats export off, import on if present; extended-statistics limitation. |
| 14–18 | Why wasn't this automatic? | The 2002/2003 debate, the 2012/2015 portability problem, the January 2025 proposal crediting Nikolay and Kirk, and the final default decision. Avoid a blame narrative. |
| 18–24 | What operators should do | Expression-index ordering, selective priorities, jobs versus parallel, workload readiness. |
| 24–28 | What remains open | PG19 read-induced VM, COPY FREEZE proposal, and the next falsifiable experiment. |

Questions worth asking each other: Which maintenance should block traffic? Does an archive promise data equivalence or performance readiness? When are inherited stats worse than fresh sampling? Can restoring visibility during load avoid a second scan? What evidence proves that the recommended maintenance worked?

## Source scope and limitations

This report uses official PostgreSQL documentation, public mailing-list archives, public commit history, source inspection, and analysis of previously recorded synthetic experiments. The historical search covers 2001–2026 thematically; it is not an exhaustive census of every message.

Source snapshots inspected: PG18 `e79df9dd9f34115c13b038c7b22a8c3903e76e9b`, PG19 `0da632e084842c36ec31d87adfc401b54ed7d7b2`, and PG18.0 `3d6a828938a5fa0444275d3d2f67b64ec3199eb7`. The PG19 snapshot is release-candidate code. Runtime conclusions about a proposed experiment require its own recorded execution.

No new database experiment has been run for this preparation package. The existing measurements are narrowly described in [existing observations](existing-observations.md). The [experiment plan](experiments.md) and [blog outline](blog-outline.md) identify what still needs to be measured before new performance claims are made.
