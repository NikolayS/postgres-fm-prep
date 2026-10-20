# PG19, physical standbys, and the strongest remaining episode angles

[Study pack](study-pack.md) · [First-read WAL](first-read-writes.md) · [Measured PG19 control](evidence/pg19-relallvisible/README.md)

Updated October 20, 2026. **Standby behavior below is verified from PG19rc1 source, not a new primary/standby experiment.** Existing measured results are linked separately. No additional runs are claimed.

## Read-time VM preparation originates on the primary

PG19's [release notes](https://www.postgresql.org/docs/19/release-19.html#RELEASE-19-GENERAL-PERFORMANCE) explicitly describe query table scans marking pages all-visible, extending the earlier VACUUM/COPY FREEZE paths.

In the exact `REL_19_RC1` source, `heap_page_prune_opt()` returns immediately when `RecoveryInProgress()` is true. A SELECT on a physical hot standby therefore cannot use this optimization to populate its VM locally. A read-only transaction on a primary is a different case from a server in recovery.

| Event | Effect through this feature |
| --- | --- |
| Eligible heap read on primary | May set VM bits and generate WAL |
| Read on physical standby during recovery | Does not independently set VM through this path |
| Replay of primary's visibility WAL on standby | Applies the VM change |
| Promotion and subsequent eligible reads | Recovery guard no longer prevents the path |

Primary sources, pinned to RC1: [recovery guard](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/access/heap/pruneheap.c#L280), [enable VM work on eligible read-only scans](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/access/heap/pruneheap.c#L354), [redo dispatch for PRUNE_ON_ACCESS](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/access/heap/heapam_xlog.c#L1352), [redo VM update](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/access/heap/heapam_xlog.c#L270).

**VM coverage can differ temporarily with replay lag.** This feature does not have standby readers independently building their own VM. Do not broaden that into a guarantee that every physical byte on primary and standby is identical. Logical subscribers are a separate architecture: this section concerns physical replication.

### Consequence for read-replica architectures

Routing all application reads to physical standbys does not trigger this preparation on the primary. Standby query repetition alone cannot supply the new read-time VM repair. Benefits depend on primary-side activity, such as VACUUM/autovacuum or eligible reads, and replay reaching the resulting WAL. Cache warming on the standby can still improve performance for other reasons.

This makes primary-side post-restore maintenance more relevant than a primary-only PG19 demo might suggest. A useful readiness check should observe the server that will actually serve the workload and its replay progress; successful maintenance on the primary is not evidence that its effects have already replayed elsewhere.

### A SELECT on the primary can have a standby conflict consequence

The redo implementation explicitly considers setting a page all-visible when it is not visible to all active standby snapshots. It handles the record's snapshot conflict horizon before applying the change. Therefore, a primary read that generates this work can lead to replay waiting or a conflicting standby query being canceled, depending on snapshots and recovery settings. **This is a source-derived possibility, not a conflict observed in our tests; it is not inevitable.**

Sources: [replay conflict handling](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/access/heap/heapam_xlog.c#L107), [hot-standby conflict policy](https://www.postgresql.org/docs/19/hot-standby.html#HOT-STANDBY-CONFLICT).

## Six strong angles for the episode or article

| Angle | Evidence status | Question for Kirk |
| --- | --- | --- |
| A SELECT can generate nearly a heap's worth of WAL | Measured under specific checkpoint/checksum settings; [controls](first-read-writes.md) | “Which part of read-only actually means no writes?” |
| The second benchmark run tests a physically different database | VM growth and falling heap fetches measured in [PG19 control](evidence/pg19-relallvisible/README.md) | “Are we measuring caching, maintenance, or both?” |
| An inaccurate estimate can produce a better repeated-query outcome | Imported relallvisible overstates VM initially, yet second IOS uses 7 buffers versus bitmap's 325 | “Should costing describe current state, or anticipate what the scan will change?” |
| Disabling autovacuum changes more than background noise | [PG18 source/history and Forge controls](forge-results.md#3-pg18-imported-statistics-useful-with-two-distinct-gaps) show index-build estimate preservation depends on it | “Did our attempt to isolate the experiment change the behavior being tested?” |
| Read replicas don't locally get PG19's new VM repair | Source verified above; no standby runtime test | “Does a primary-only benchmark tell us what read replicas will experience?” |
| A primary SELECT can produce recovery-conflict work | Source-derived possibility above; not yet observed | “Could a read on one server cause another server's read to wait or be canceled?” |

Use the first four as demonstrated results, with their version/settings qualifications. Use the last two as architectural implications and an optional future demonstration. None establishes a universal latency multiplier.

## A better restore-completion contract

PG19 reduces some need for a separate VM-building pass; it does not make eligible reads perform ANALYZE or guarantee readiness before the first request. Statistics transport, physical visibility preparation, and first-query cost remain separate.

For a proposed pg_restore maintenance option, discuss an explicit **post-commit phase** and distinguish “data restored” from “requested maintenance completed.” VACUUM cannot run inside a transaction block, whereas pg_restore offers single-transaction restoration. A maintenance failure after commit cannot honestly be reported as an atomic rollback of the restore. Table selection, privileges, parallel scheduling, and imported-statistics policy also need defined behavior. These are design considerations, not a documented collective explanation for the current default.

Sources: [pg_restore transaction mode](https://www.postgresql.org/docs/19/app-pgrestore.html), [VACUUM restrictions](https://www.postgresql.org/docs/19/sql-vacuum.html), [existing option proposal](maintenance-option.md).

## Optional bounded follow-up: primary versus standby

Suggested 30–45-minute experiment only if infrastructure is already available; not a prerequisite for recording:

1. Pin PG19rc1 on a disposable primary and physical standby. Restore a small permanent heap on the primary with automatic maintenance controlled; record initial actual VM and planner estimates on both, plus replay position. Avoid any heap-scanning validation query before the first-read measurements.
2. After replay catches up, run the same query twice **only on the standby**. Check actual VM before/after; prediction: local query execution does not populate it through the new feature.
3. Run an eligible read on the primary. Capture WAL/VM/plan data; wait for replay of a recorded primary LSN using an explicit bounded condition. Recheck the standby VM and query. Prediction: replay conveys the primary's VM changes.
4. Only if time remains, design a separate old-standby-snapshot arm to test conflict behavior. Define the snapshot horizon and feedback settings explicitly; do not assume a long-running query alone guarantees a conflict.

Stop on setup failures, inability to isolate background work, or the time limit. Publish negative/inconclusive outcomes. A data-equality scan itself can prepare the primary heap, so perform it after the measured sequence or use a separate control.

## Separate standby mechanism: hint bits

The recovery guard above concerns VM preparation, not every physical change caused by reading. [Standby hint-bit dirtying and FREEZE](hint-bits-standbys-freeze.md) explains the checksum/wal_log_hints conditions and why local hints can differ. Do not equate no local VM-building with no local hint work.
