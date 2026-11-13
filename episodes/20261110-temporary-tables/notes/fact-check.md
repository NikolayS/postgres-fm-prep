# Fact-check: Postgres.FM 196, "The hidden costs of CREATE TEMP TABLE"

Checked 2026-11-13. Times are episode (podcast timeline = YouTube v6) times; a "~" marks a point inside a long turn. Exact caption times (41-podcast.en.srt) for the spoken items: 04:02 hard to diagnose, 05:32 bloat definition, 13:58 three records, 14:56 freeze, 15:47 snapshot invalidation, 17:05 global catalog, 17:48 abandoned, 18:40 16-core, 18:49 LockManager (19:22 "goes away"), 19:39 CPU is low, 23:38 Postgres 13/14, 24:06 Performance Insights, 26:50 20,000, 27:26 more messages, 27:34 dead tuples, 28:15 four times, 30:27 record type, 35:20 suppress, 35:43 Tom Lane, 37:55 DISCARD ALL.

Sources used:

- PostgreSQL source, a local clone: `origin/REL_18_STABLE` unless noted, also `origin/REL_17_STABLE`, `origin/REL_14_STABLE`, tags `REL_19_RC1` / `REL_19_RC2`, and commit `3d342deeb4` (the commit the sinvaladt.c card pins).
- PostgreSQL docs (the same text, read from `doc/src/sgml` of REL_18_STABLE), PostgreSQL wiki, commitfest.postgresql.org.
- PgBouncer config reference, AWS RDS docs, Oracle 19c Administrator's Guide, pg_repack source.
- The brief, v6.2 (2026-11-11), read through its public API.

Not re-checked here (already being corrected): the 21-ring card, "4K ring buffer", "wait till everybody reads".

Summary: 4 wrong (all spoken), 18 imprecise (16 spoken, plus card 15 and one line of the YouTube description), the rest correct or unverifiable. All measured numbers on the cards match the brief.

## Wrong

- **27:03, Nik (speech).** Claim: `ON COMMIT DELETE ROWS` "will lead to a lot of dead tuples. You need to vacuum. You have now bloat and indexes are out of shape."
  - Verdict: wrong. (The on-screen editor's note on card 23 already says so, and the note is correct.)
  - Evidence: docs, CREATE TABLE, ON COMMIT, DELETE ROWS (https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-PARMS-ON-COMMIT): "Essentially, an automatic TRUNCATE is done at each commit." Source: `tablecmds.c:PreCommit_on_commit_actions` collects `ONCOMMIT_DELETE_ROWS` relations and calls `heap_truncate()`; `heap.c:heap_truncate_one_rel` calls `table_relation_nontransactional_truncate(rel)` and `RelationTruncateIndexes(rel)`: the files are truncated in place, with no new relfilenode and no row versions left behind.
  - Correction: `ON COMMIT DELETE ROWS` truncates the table and its indexes in place at commit, so it leaves no dead tuples and needs no vacuum; dead tuples come from explicit `DELETE` on a temp table.

- **~19:00 to 19:40, Nik (speech).** Claim: under temp-table load you first see `LWLock:LockManager` because the fast path is not used past 16 relations per transaction; on Postgres 18 you raise `max_locks_per_transaction` to 128 or 256 "and then this lightweight lock goes away".
  - Verdict: wrong for this workload (the general fast-path background is right for PG17 and older).
  - Evidence: (1) `lock.c:EligibleForRelationFastPath` requires `(mode) < ShareUpdateExclusiveLock`; `tablecmds.c:DefineRelation` opens the new relation with `relation_open(relationId, AccessExclusiveLock)`, so the locks that temp-table DDL takes on its own new relations never use the fast path, at any setting. (2) On PG18 the limit is no longer 16 at the default: `postinit.c:InitializeFastPathLocks`, "The default max_locks_per_transaction = 64 means 4 groups by default", 16 slots per group = 64 slots. The fixed 16 is PG17 and older (`proc.h`: `#define FP_LOCK_SLOTS_PER_BACKEND 16` on REL_17_STABLE). (3) The brief measured the opposite, § 11: "LWLock:LockManager is not a lock-slot limit here ... With max_locks_per_transaction = 1024, two churn cells gave 12.7 and 6.6 percent (13.6 and 23.3 percent at 256)"; the cliff runs already ran with `max_locks_per_transaction = 256`.
  - Correction: in the experiment `LWLock:LockManager` did not go away with a higher `max_locks_per_transaction` (still 7 to 13 percent at 1024), because temp-table DDL takes AccessExclusiveLocks, which never use the fast path; and on Postgres 18 the default already gives 64 fast-path slots, not 16.

- **13:32, Kirk (speech); card 09 repeats the number.** Claim: two temp tables and one temporary index are "three records going in, and three records coming out", so 10 million queries a day became 60 million pg_catalog updates a day.
  - Verdict: wrong count (too low by an order of magnitude); the direction of the point is right.
  - Evidence: `heap.c:heap_create_with_catalog` creates, per table: one `pg_class` row, two `pg_type` rows (row type via `AddNewRelationType`, and "We'll make an array over the composite type, too"), and `pg_attribute` rows for every column plus 6 system columns (`SysAtt[] = {&a1 ... &a6}`, "Next we add the system attributes"), plus `pg_depend` rows. A table with a toastable column also gets a toast table and a toast index (`toasting.c`: `chunk_id`, `chunk_seq`, `chunk_data`). Each index adds a `pg_class` row, a `pg_index` row (`index.c:UpdateIndexRelation`) and `pg_attribute` rows (`index.c:AppendAttributeTuples`). The brief, § 10, says the same: "pg_class (table, toast table, toast index), pg_type (row type and array type), pg_attribute (one row per column plus 6 system columns), pg_depend and more". Measured on PostgreSQL 18.6 (`pg_stat_xact_sys_tables.n_tup_ins`, 2026-11-13): `create temp table t(id int)` inserts 13 catalog rows (pg_class 1, pg_type 2, pg_attribute 7, pg_depend 3); `(id int, v text)` inserts 31 (toast table and toast index); two int-only temp tables plus one index insert 30, and the same number are deleted at drop.
  - Correction: a temp table is not one catalog row: each one adds rows to pg_class, pg_type (2), pg_attribute (columns + 6), pg_depend, and more for toast and indexes, 13 rows at least and about 31 with a text column, so the real catalog churn in Kirk's system was at least 600 million row changes a day (30 in, 30 out per query), not 60 million.
  - Card 09 ("10M queries/day → 60M pg_catalog changes/day", chip "Kirk's system"): imprecise; it is labeled as Kirk's number, but the number is an undercount.

- **~15:55, Nik (speech).** Claim: the SInval wait events are "snapshot invalidation, catalog snapshot invalidation".
  - Verdict: wrong expansion. (Card 11 says "sinval = shared invalidation", which is correct.)
  - Evidence: `sinvaladt.c` header: "POSTGRES shared cache invalidation data manager". `wait_event_names.txt`: `SInvalRead "Waiting to retrieve messages from the shared catalog invalidation queue."`, `SInvalWrite "Waiting to add a message to the shared catalog invalidation queue."` The messages invalidate catalog cache and relation cache entries (`sinval.h`: "invalidate a specific tuple in a specific catcache ... invalidate a relcache entry"); a snapshot message (`SHAREDINVALSNAPSHOT_ID`) is only one of eight message types.
  - Correction: sinval means shared (cache) invalidation: the queue tells every backend to drop cached catalog and relation entries; it is not about snapshots.

## Imprecise

- **~05:20, Nik (speech).** Claim: "There's no official definition of bloat. You cannot find it in documentation." Bloat is only the empty space left after cleanup; dead tuples are not bloat.
  - Verdict: imprecise bordering on wrong: the docs do define it, and the definition includes dead tuples.
  - Evidence: docs glossary (https://www.postgresql.org/docs/current/glossary.html#GLOSSARY-BLOAT, `glossary.sgml`): "Bloat: Space in data pages which does not contain current row versions, such as unused (free) space or outdated row versions."
  - Correction: the PostgreSQL glossary defines bloat as space in data pages without current row versions, free space or outdated row versions, so by the docs dead tuples count as bloat; the dead-tuples-vs-bloat split is Nik's own, stricter usage.

- **~17:40, Nik (speech).** Claim: the work on global temporary tables "is abandoned a few years ago, so I'm not sure about the status".
  - Verdict: imprecise, outdated (he hedges on air).
  - Evidence: the 2019 to 2022 patch (Zeng Wenjing, Konstantin Knizhnik) was closed "Returned with feedback" in commitfest 2022-07 (https://commitfest.postgresql.org/38/2349). A new patch, "Global temporary tables" by Dean Rasheed, was registered 2026-06-21 and is "Needs review" in commitfest PG20-3 (2026-11): https://commitfest.postgresql.org/patch/6918/ (CFbot: needs rebase).
  - Correction: the old global temporary tables patch was returned with feedback in 2022, but a new patch by Dean Rasheed is under review for Postgres 20 (commitfest entry 6918).

- **37:43, Kirk (speech).** Claim: PgBouncer "uses a DISCARD ALL, which basically dumps and drops all your temp tables even though it's the same session".
  - Verdict: imprecise. (Card 31, "Session pooling: DISCARD ALL drops temp tables / PgBouncer server_reset_query, default DISCARD ALL", is correct.)
  - Evidence: https://www.pgbouncer.org/config.html#server_reset_query: "Query sent to server on connection release, before making it available to other clients." "Default: DISCARD ALL". "When transaction pooling is used, the server_reset_query is not used". `pool_mode` session: "Server is released back to pool after client disconnects." `server_reset_query_always` default 0: "run only in pools that are in sessions-pooling mode". DISCARD docs (https://www.postgresql.org/docs/current/sql-discard.html): `DISCARD ALL` runs `DISCARD TEMP` among others.
  - Correction: in session mode PgBouncer runs `DISCARD ALL` only when the client disconnects and the server connection goes back to the pool, not inside a client session; in transaction mode it runs no reset query by default, and a temp table cannot be relied on across transactions at all.

- **27:03, Nik (speech).** Claim: `ON COMMIT DROP` is the worst "because for every transaction you broadcast more messages"; `ON COMMIT DELETE ROWS` is faster because "we just avoid extra DDL and extra broadcast through that queue".
  - Verdict: imprecise against the brief.
  - Evidence: brief TL;DR and § 5: "That ceiling is not the sinval queue ... At the ceiling LWLock:SInvalWrite + LWLock:SInvalRead are under 1 percent of active samples. Kernel wait channels put about 64 percent of the churn backends' time in path lookup and unlink of the temp relation files." And § 5: "ON COMMIT DELETE ROWS is the strongest sinval generator per second ... about 5 smgr messages per transaction".
  - Correction: without many idle sessions, the per-transaction temp table is slow because of catalog and file create/unlink work, not the invalidation queue; `ON COMMIT DELETE ROWS` avoids that work but still sends about 5 invalidation messages per transaction and has the highest SInvalWrite share of all the arms.

- **26:50, Kirk (speech).** Claim: "20,000 versus 80,000 transactions per second".
  - Verdict: imprecise; Nik corrects it on air in the next lines (88,000 and under 4,000).
  - Evidence: brief § 4 A (PG17, 32 clients, median of 4 runs): temp table per transaction 3,931, one temp table per session with ON COMMIT DELETE ROWS 17,741, CTE 88,531 tx/s.
  - Correction: the measured numbers are 3,931 (temp table per transaction), 17,741 (reused temp table) and 88,531 tx/s (CTE).

- **16:31 Kirk, 17:07 Nik (speech); card 12 quotes it.** Claim: "it's a global catalog"; "Data is local. A catalog is global."
  - Verdict: imprecise wording, right idea.
  - Evidence: `inval.c` header: "inval messages are sent without regard for the possibility that the object described by the catalog tuple might be a session-local object such as a temporary table. This is because (1) this code has no practical way to tell the difference, and (2) it is not certain that other backends don't have catalog cache or even relcache entries for such tables". Temp-table rows live in the ordinary per-database catalogs (pg_class, pg_attribute, pg_type), which are not the cluster-wide "shared catalogs"; the queue itself is one per cluster (`sinvaladt.c`).
  - Correction: temp-table data is session-local, but its metadata are normal rows in the database's catalogs, visible to all sessions, and the invalidation queue is one per cluster, so every backend in every database reads the messages.

- **03:45 and 12:00, Nik (speech); card 08 row 1 "Invisible to other sessions".** Claim: only the session that created a temp table sees it; from another session "you don't see them".
  - Verdict: imprecise.
  - Evidence: `bufmgr.c` (`RELATION_IS_OTHER_TEMP`): "cannot access temporary tables of other sessions" blocks reading the data only. The catalog rows are ordinary and visible (`inval.c` comment above), and `pg_stat_user_tables` filters out only `pg_catalog`, `information_schema` and `pg_toast` schemas (`system_views.sql`), so `pg_temp_N` tables are listed.
  - Correction: another session cannot read the rows of a temp table, but it can see that the table exists, its definition and its statistics in pg_class and pg_stat_all_tables (schema pg_temp_N).

- **14:33, Nik (speech).** Claim: "in very heavily loaded environments it might happen that vacuum cannot freeze the content of the tuples in temporary tables", a wraparound risk.
  - Verdict: imprecise: the risk is real, the condition is not load.
  - Evidence: `autovacuum.c:do_autovacuum`: "We cannot safely process other backends' temp tables, so skip 'em." `vacuum.c:vac_update_datfrozenxid` takes the minimum `relfrozenxid` over all pg_class rows of kind table, matview and toast, with no exception for temp tables. Brief § 12: "Long-lived sessions with temp tables hold back datfrozenxid".
  - Correction: autovacuum never freezes temp tables, under any load; a temp table that lives in a long session holds back the database's datfrozenxid until the session vacuums it, drops it or disconnects. Temp tables created and dropped per transaction do not have this problem.

- **~23:38, Nik (speech).** Claim: "after Postgres 13, 14, thanks to work from Andres Freund, it handles really well extra idle connections".
  - Verdict: imprecise on the version. (Card 19, "PG14: faster snapshots with many sessions", is correct.)
  - Evidence: PG14 release notes (https://www.postgresql.org/docs/release/14.0/, `release-14.sgml`): "Improve the speed of computing MVCC visibility snapshots on systems with many CPUs and high session counts (Andres Freund) ... This also improves performance when there are many idle sessions." The commits (dc7420c2c, 1f51c17c6, 941697c3c) are from August 2020, in the 14 cycle; the PG13 release notes have no such item.
  - Correction: the snapshot scalability work for many idle connections is in Postgres 14, not 13.

- **35:43, Nik (speech); card 28 (cut from the video).** Claim: this code "was last heavily touched by Tom Lane in 2008".
  - Verdict: imprecise.
  - Evidence: fad153ec452, Tom Lane, 2008-06-19, "Rewrite the sinval messaging mechanism to reduce contention and avoid unnecessary cache resets" (in 8.4) is the current design, and `MAXNUMMESSAGES 4096` has not changed. Later changes to the same mechanism: b4fbe392f8f, Robert Haas, 2011-07-29, "Reduce sinval synchronization overhead" (9.2); 4f85fde8eb8, Andres Freund, 2015 (catch-up moved out of the signal handler, 9.5); ab355e3a88d and 024c5211175, Heikki Linnakangas, 2024 (PG17); df3978c2340, Nathan Bossart, 2026-09-24, "Convert SISeg->maxMsgNum to an atomic variable" (master, PG20).
  - Correction: the design and the 4,096 constant date from Tom Lane's 2008 rewrite (8.4), but the code was changed after that, most visibly by Robert Haas in 2011 (9.2) and by Nathan Bossart and Yura Sokolov in 2026 for Postgres 20.

- **~19:45, Nik (speech).** Claim: when you see SInvalWrite, "CPU is low and disk IO is low, can be close to zero. So you don't see the server as loaded at all."
  - Verdict: imprecise against the brief. (Card 16, "95% CPU" at 0 idle and "88% LWLock" at 5,000 idle, matches the brief and is labeled as a share of sampled session time.)
  - Evidence: brief § 5: at 5,000 idle "LWLock 88.1 percent (LWLock:SInvalWrite 84.7), CPU 11.7, IO 0.13": these are shares of active-session samples, not host utilization. Brief § 6: "With bystander think 0 the CPU is saturated", and idle backends cost "about 1.4 to 2 vCPU of catch-up work" at 100 DDL tx/s.
  - Correction: the low CPU and IO numbers are shares of what active sessions do, not host load; in the experiment the host CPU was still busy with other queries, and idle backends used 1.4 to 2 vCPU to process invalidation messages.

- **~24:06, Nik (speech).** Claim: "this wait event can be seen in active session history dashboards, like Performance Insights or our dashboards ... a lot of sessions are waiting in that wait event".
  - Verdict: imprecise.
  - Evidence: brief § 6, "Monitoring blind spot": "A wait sampler that keeps only state = 'active' does not see that time or those waits: in the 5,000-idle cell it saw 1.7 waiting sessions where pg_wait_sampling saw 161." The active DDL sessions do show the wait (88.4 percent in the active-only poll). Separately, the AWS page linked in the notes (https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.html) is now titled "Monitoring DB load with Amazon CloudWatch Database Insights"; the Performance Insights console has been replaced by Database Insights (AWS end-of-life notice, July 31, 2026 per the current AWS docs found by search; date not re-read on the page itself).
  - Correction: an active-only ASH shows the wait for the DDL sessions, but most of the waiters are backends in state idle, which such dashboards drop (1.7 seen vs 161 real); on RDS the dashboard is now CloudWatch Database Insights.

- **~18:49, Nik (speech).** Claim: "On 16-core machine, you will start seeing problems."
  - Verdict: imprecise (small).
  - Evidence: brief § 2 and § 5: Hetzner CCX43, "16 dedicated vCPU"; "16 vCPU = 8 cores with SMT". The cards say "16 vCPU", which is correct.
  - Correction: the test machines had 16 vCPU (8 cores with SMT).

- **35:20, Kirk (speech).** Claim: an idea is to "suppress the SInvalWrite lock from being emitted if it's dealing with a temporary table".
  - Verdict: imprecise wording.
  - Evidence: SInvalWrite is the lock a writer takes on the queue (`sinvaladt.c:SIInsertDataEntries`); what is sent are invalidation messages. The idea itself is in `inval.c`: "It might be worth trying to avoid sending such inval traffic in the future, if those problems can be overcome cheaply", and in the brief, § 13 ("Local-only invalidation for the backend's own temp namespace"), with the hard part: catcache messages are matched by hash, and other backends can hold entries for such tables.
  - Correction: the idea is to not send the invalidation messages for a session's own temp tables to the shared queue; SInvalWrite is the lock that writers of those messages wait on.

- **30:23, Nik (speech).** Claim: `select t1 from t1` returns one column "of record type".
  - Verdict: imprecise (small); everything else in this part is correct and matches the real psql 18.6 session on the card (`video/overlays/psql18-session.txt`).
  - Evidence: the column has the table's named composite row type `t1`, which every table gets together with an array type `t1[]` (`heap.c:heap_create_with_catalog`: `AddNewRelationType`, "We'll make an array over the composite type, too"); that is why `array(select t1 from t1)`, `unnest()` and `(t1).*` work.
  - Correction: the column is of the table's composite row type `t1` (not the generic `record`), and the array is `t1[]`.

- **28:15, Kirk (speech).** Claim: "the CTE version is like more than four times better than that" (than the reused temp table).
  - Verdict: imprecise (understated); true as said.
  - Evidence: brief § 4 A: 88,531 / 17,741 = 4.99.
  - Correction: the CTE is about 5 times faster than the reused temp table (88,531 vs 17,741 tx/s), and about 23 times faster than a temp table per transaction.

- **YouTube description, line 2 (`notes/youtube-description.v7.txt`).** Claim: with 5,000 idle sessions "LWLock:SInvalWrite takes 91% of the waits".
  - Verdict: imprecise.
  - Evidence: brief § 4 C, row C4: 91.1 percent is the LWLock:SInvalWrite "DDL pool share", defined as "percent of active samples of one pool, excluding Client:* and Activity:*" (CPU samples are in the denominator).
  - Correction: "the DDL sessions spend 91% of their active time waiting on LWLock:SInvalWrite".

- **Card 15 (band, ~18:50 to 19:30).** Text: "Over 16 relations per transaction: LWLock:LockManager" / "PG18: raise max_locks_per_transaction".
  - Verdict: imprecise (see the wrong item at ~19:00 for the speech).
  - Evidence: commit c4d5cb71d22 (Tomas Vondra, 2024-09-21, "Increase the number of fast-path lock slots", in REL_18_STABLE): "The fast-path locking introduced in 9.2 allowed each backend to acquire a small number (16) of weak relation locks cheaply"; arrays "sized on startup based on max_locks_per_transaction". The attribution is correct. But 16 is the PG17-and-older limit; PG18 at the default 64 already has 64 slots (`postinit.c:InitializeFastPathLocks`), and the fast path covers only weak locks.
  - Correction: "PG17 and older: 16 fast-path lock slots per backend. PG18: 64 by default, scales with max_locks_per_transaction (weak locks only)."

## Correct

- **01:24, Kirk; card 02.** Oracle global temporary tables are defined once in the dictionary and each session gets its own data; Postgres needs a CREATE per session. Correct. Oracle 19c Administrator's Guide, § 20.3.2.3: "The definition of a global temporary table is visible to all sessions, but the data in a global temporary table is visible only to the session that inserts the data into the table"; rows are "stored in the default temporary tablespace" (https://docs.oracle.com/en/database/oracle/oracle-database/19/admin/managing-tables.html). Card 02 highlights are verbatim from `create_table.sgml`, Compatibility, Temporary Tables: "temporary tables are defined just once and automatically exist (starting with empty contents) in every session that needs them. PostgreSQL instead requires each session to issue its own CREATE TEMPORARY TABLE command".
- **~02:10, Kirk.** Settings too low make temp-table writes spill to disk. Correct: `temp_buffers` (default 8MB) "Sets the maximum amount of memory used for temporary buffers within each database session. These are session-local buffers used only for access to temporary tables" (https://www.postgresql.org/docs/current/runtime-config-resource.html#GUC-TEMP-BUFFERS); pages beyond it go to the temp relation files.
- **02:40, Kirk.** He had to run VACUUM ANALYZE on the temp table by hand. Correct: docs, CREATE TABLE, TEMPORARY: "appropriate vacuum and analyze operations should be performed via session SQL commands".
- **~04:34, Nik; card 04.** Autovacuum ignores temp tables. Correct, quote on the card is accurate: "The autovacuum daemon cannot access and therefore cannot vacuum or analyze temporary tables." (`create_table.sgml`; also `maintenance.sgml`: "Temporary tables cannot be accessed by autovacuum."). Autovacuum only drops orphaned temp tables (`autovacuum.c`, "dropping orphan temp table").
- **06:28 to 07:20, Kirk; 12:00, Nik (card 08 row 0 "Primary only").** Without temp tables the search is a read-only transaction and can run on a replica; temp tables work only on the primary. Correct: hot standby docs, "Data Definition Language (DDL): CREATE, DROP, ALTER, COMMENT. This restriction applies even to temporary tables, because carrying out these operations would require updating the system catalog tables." (`high-availability.sgml`).
- **~13:10, Nik.** Bloated catalogs cannot be fixed with pg_repack; VACUUM FULL is needed. Correct: pg_repack's target list excludes them (`lib/pg_repack.sql.in`, view `repack.tables`: `N.nspname NOT IN ('pg_catalog', 'information_schema')`). "A few seconds" depends on catalog size; VACUUM FULL takes an ACCESS EXCLUSIVE lock on the catalog for that time.
- **~15:26, Nik.** Any DDL sends invalidations, including CREATE TEMP TABLE and TRUNCATE. Correct: `tablecmds.c:ExecuteTruncateGuts` calls `RelationSetNewRelfilenumber` ("Create a new empty storage file for the relation, and assign it as the relfilenumber value"), a pg_class update. Brief § 10: about 13 messages per TRUNCATE of a temp table.
- **~15:40, Nik; card 11.** Wait event names `LWLock:SInvalWrite`, `LWLock:SInvalRead`. Correct (`wait_event_names.txt`; https://www.postgresql.org/docs/current/monitoring-stats.html#WAIT-EVENT-LWLOCK-TABLE).
- **16:31, Kirk.** "Maybe an overly safe approach": correct in substance, see the `inval.c` comment quoted above (the mechanism is `CacheInvalidateHeapTuple` on every catalog row change, not a trigger).
- **~18:11, Nik; card 14.** The queue is a hard-coded 4,096. Correct: `sinvaladt.c` at 3d342deeb4, line 102 "MAXNUMMESSAGES: max number of shared-inval messages we can buffer.", line 123 `#define MAXNUMMESSAGES 4096`; same in REL_18_STABLE. Line numbers on the card are right.
- **~18:35, Nik.** "Postgres 19, which is release candidate 2 right now". Correct: tag `REL_19_RC2` is dated 2026-11-09. (The brief measured 19 RC1.)
- **~19:00, Nik; card 15 chip.** Fast-path slots commit in Postgres 18 by Tomas Vondra. Correct attribution: c4d5cb71d229095a39fda1121a75ee40e6069a2a, author and committer Tomas Vondra, 2024-09-21, in REL_18_STABLE.
- **~20:20, Nik.** RDS clients with 2,500 or 5,000 max_connections. Correct as a default: RDS for PostgreSQL `max_connections` default is `LEAST({DBInstanceClassMemory/9531392}, 5000)` (https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html#RDS_Limits.MaxConnections).
- **~22:00, card 17 (cliff).** 502 / 502 / 274 / 127 DDL tx/s at 0 / 1,000 / 3,000 / 5,000 idle; SInvalWrite 1.3% / 54% / 86% / 91%; "PG18, 16 vCPU, 500 DDL tx/s target". Correct against brief § 4 C (1.3 / 53.6 / 86.5 / 91.1). Nit: 86.5 is shown as 86; the brief itself has 86 in the prose and 87 in the cheat sheet.
- **~20:25, card 16 (ASH).** "95% CPU" at 0 idle, "88% LWLock" at 5,000 idle. Correct against brief § 5 (CPU 95.0; LWLock 88.1).
- **12:11, card 08 "Measured: pg_attribute +737 to 839 MiB in ~70 s; 128 clients, temp table per transaction; under 1.5 MiB with a reused temp table".** Correct against brief § 5 "Catalog bloat" (medians for PG18 and PG17, autovacuum on).
- **27:03 to 28:15, Nik; card 23.** "88,000 for CTE" (88,531), "less than 4,000" (3,931), "17,000" (17,741), "four, five times better" (4.5x). Correct. Card 23: 3,931 / 17,741 / 88,531, "4.5x", "about 23x" (88,531 / 3,931 = 22.5), subtitle "PG17, 16 vCPU, 32 clients, synthetic workload": all match brief § 4 A and § 5. The editor's note on the card is correct (see the first wrong item).
- **30:03 to 31:20, Nik and Kirk; card 24.** `select t1 from t1`, `select array(select t1 from t1)`, `unnest()`, `(t1).*`. Correct; the on-screen output is a real psql 18.6 session.
- **32:12, Kirk; card 25 (cut).** Unlogged tables instead. Quote on the card is accurate: "Data written to unlogged tables is not written to the write-ahead log ... However, they are not crash-safe" (`create_table.sgml`). Worth adding: "The contents of an unlogged table are also not replicated to standby servers."
- **34:55, Kirk.** "The size of the ring buffer can't be changed easily." Correct: a compile-time `#define`, not a setting.
- **36:10, Nik; card 28 second shot (cut).** The queue size "could depend on max_connections, or it could be a separate setting". Correct against brief § 13 ("Size the queue with the installation ... A size derived from max_connections, or a separate setting").
- **37:05, Kirk.** PgBouncer does not keep temp tables between sessions. Correct for transaction mode (see the PgBouncer item above).
- **Card 19 (band, ~23:38).** "PG14: faster snapshots with many sessions / Andres Freund · postgresql.org/docs/release/14.0". Correct.
- **Card 30 (cut) and the show notes.** The card's source note says there was no temp-table entry on the wiki on 2026-11-10. It exists now: "Don't create temporary tables in frequently executed code", added by Kirkw on 2026-11-11 (https://wiki.postgresql.org/wiki/Don%27t_Do_This#Don.27t_create_temporary_tables_in_frequently_executed_code). The link in the notes is valid.

## Unverifiable

- **~08:40 to 10:20, Kirk.** 30 ms average search on a 200-million-row table; Postgres 10 to 25% slower than Oracle for the same query; the client bought 8x the machine; 10 million queries a day. His production system, no public source.
- **~20:30, Nik.** "RDS Proxy is provoking idle sessions really well." Field observation, no public source. Related and documented: RDS Proxy pins a session when it creates a temp table, so such sessions are not multiplexed: "Creating temporary sequences, tables, or views" is in "Conditions that cause pinning for RDS for PostgreSQL", and a pooler-side `DISCARD ALL` also pins (https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-pinning.html). "Amazon doesn't provide PgBouncer as a managed service" on RDS: consistent with the RDS docs, which offer only RDS Proxy.
- **02:58, Nik.** Temp tables are fine "below a few hundred transactions per second". A rule of thumb; the brief gives no such threshold (its ceiling is 3,000 to 4,000 tx/s with no idle sessions, and the cliff starts at 500 DDL tx/s with 1,000 to 3,000 idle sessions).
- **Card 05 (cut).** "Postgres.FM 194: UUIDv4 vs UUIDv7". The episode page exists (published 2026-10-30, Nik with Kirk) but does not show an episode number.
