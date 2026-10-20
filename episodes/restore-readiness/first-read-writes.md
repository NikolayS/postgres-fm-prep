# Why a first SELECT after restore can generate WAL

[Study pack](study-pack.md) · [Forge results and chart](forge-results.md#4-first-select-reads-can-cause-writes)

## The episode explanation

A query can leave the logical rows unchanged while changing physical bookkeeping. After a logical restore, some of that bookkeeping has not yet been established. The first reader can pay for it.

1. **Tuple hint bits:** when checking visibility, PostgreSQL can remember a transaction's committed status in the tuple header. Later readers can avoid repeating the transaction-status lookup. Setting those bits modifies the heap page.
2. **Full-page images (FPIs):** with data checksums enabled (or `wal_log_hints=on`), a qualifying hint update can require a page image in WAL for torn-page protection. The checkpoint boundary and whether a buffer is already dirty matter. This is not one WAL record per row or per SELECT.
3. **PG19 visibility-map updates:** eligible reads can additionally establish all-visible/all-frozen state. This has its own WAL work. It is conditional; an arbitrary SELECT is not a substitute for VACUUM.

Primary sources: [WAL settings: full_page_writes, wal_log_hints and wal_compression](https://www.postgresql.org/docs/18/runtime-config-wal.html), [PG18 tuple visibility/hint-bit implementation](https://github.com/postgres/postgres/blob/REL_18_6/src/backend/access/heap/heapam_visibility.c), [PG19rc1 buffer hint-update handling](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/storage/buffer/bufmgr.c), [PG19rc1 on-access visibility handling](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/access/heap/pruneheap.c).

## What Forge actually measured

The unindexed `events` heap had 200,000 rows and 3,480 8-KiB pages (27.19 MiB). The measured query was its first count after restore and the indicated treatment. Three fresh restores per treatment; the checkpointed counts below agree across all three. Settings: `full_page_writes=on`, `wal_log_hints=off`, `wal_compression=off`. These are statement-level EXPLAIN counters, not cluster-wide LSN deltas.

| First count, no prior maintenance | Dirtied shared blocks | WAL records | WAL FPIs | WAL bytes |
| --- | ---: | ---: | ---: | ---: |
| PG18.6, checksums on, checkpoint | 3,449 | 3,449 | 3,449 | 28,251,777 |
| PG18.6, checksums on, no intervening checkpoint | 1,432 | 0 | 0 | 0 |
| PG18.6, checksums off, checkpoint | 3,449 | 0 | 0 | 0 |
| PG19rc1, checksums on, checkpoint | 3,450 | 6,897 | 3,450 | 28,466,854 |
| PG19rc1, checksums on, no intervening checkpoint | 1,433 | 3,448 | 1 | 215,077 |

These selected values are from repetition 1; filter the [measurement CSV](assets/forge/tracks_measurements.csv) by `track=first_read`, `tag=seq_events_first`, the named run and `none_ckpt`/`none_nockpt` arm to inspect all repetitions. [Source provenance](evidence/forge/provenance.json).

**The PG18 first count generated 26.94 MiB of WAL against a 27.19-MiB heap.** Its 3,449 FPIs explain the scale: thousands of page images, not thousands of tiny hint-bit records. Exact bytes also reflect page-image hole removal and record overhead. This is an observation for this fixture, not a universal one-times-table-size rule.

The PG18 controls separate dirtying from WAL generation. With checksums off, the query still dirtied 3,449 shared buffers but produced no WAL. Without the intervening checkpoint, the checksummed run also produced no WAL. A checkpoint does not clear hint bits: it changes the page-protection state, and flushes dirty buffers. A later checkpoint alone does not make every subsequent SELECT repeat this cost.

PG19's no-checkpoint result is especially useful: 3,448 records and 215,077 bytes with just one FPI show that its WAL cannot all be attributed to full-page images. The measured VM gained 3,448 all-visible pages. That is consistent with the new on-access visibility work; exact record-type attribution would require a WAL decode, which this evidence package does not contain.

After VACUUM, the corresponding measured reads generated zero WAL and dirtied zero buffers. The repeated count in the PG18 no-maintenance/checkpoint treatment also generated zero WAL. Work had already been done. This does not establish lower total restore-plus-maintenance-plus-query WAL for every strategy.

![First-read WAL and dirtied buffers, including the indexed-table query order caveat.](assets/forge/fig3_first_read_cost.png)

## What to say carefully

- **SQL read-only does not imply no physical writes.** Logical data did not change.
- **Dirtied is not written.** A clean-to-dirty buffer transition is not a synchronous disk write. EXPLAIN's WAL bytes do not measure bytes flushed to storage during that statement. Shared buffers include VM buffers too. See [EXPLAIN counter definitions](https://www.postgresql.org/docs/18/sql-explain.html).
- **First reader means first relevant visit to those pages.** Index creation had already visited the indexed table in this fixture; its results cannot stand in for the untouched unindexed table. ANALYZE and earlier queries can also alter what remains for a later reader.
- **Cache warm-up and physical preparation are separate.** A page can be in shared buffers and still require hint/visibility work. A fast second run can reflect both caching and persistent bookkeeping changes.
- **More WAL creates potential replication, archival and storage work.** These runs did not measure replica lag, archive cost, or production latency. Do not present those consequences as measured outcomes.
- **Do not prescribe disabling checksums or checkpoints.** These controls explain the mechanism. WAL compression can reduce FPI volume, but was off here and was not benchmarked.

## Practical episode takeaway

Budget for query readiness before admitting latency-sensitive traffic. VACUUM/ANALYZE, imported statistics, and representative query checks address different needs. Maintenance can move physical preparation ahead of users; it still costs time, I/O and WAL. The larger Forge fixture's maintenance WAL is reported separately because it uses cluster-wide LSN deltas.

Suggested exchange:

> Kirk: “It is a SELECT. Why did it generate almost a heap's worth of WAL?”
>
> Nik: “It learned visibility information while reading and changed page bookkeeping. With checksums and this checkpoint schedule, protecting those changes meant logging thousands of full-page images. In PG19, reads can also build visibility-map state. Restore completion is not necessarily the end of physical preparation.”

Follow-up: “Who should pay that cost: an explicit readiness phase, asynchronous autovacuum, or the first users?”
