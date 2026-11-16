# Postgres 19 for people who run it: recording notes (DRAFT)

[Episode overview](README.md)

**DRAFT, 2026-11-15 PT.** For Nik and Michael: read before recording, keep open while recording. Every number below is in the study brief (version 2.2), with the same unit and qualifier. The brief tested PGDG packages of 18.7 and 19 RC2, not 19.0. RC2 came out on 2026-11-12; 19.0 is planned for 2026-11-19.

Brief: https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c

## Episode angle

Postgres 19 for people who run it: what breaks on upgrade day, what you gain, and what we measured on 18.7 against 19 RC2. We take three topics in depth (upgrade day, REPACK (CONCURRENTLY), LISTEN/NOTIFY) and then go fast through the defaults that change under you.

- **Working title:** Postgres 19 for people who run it
- **Alternative 1:** Postgres 19: what bites on upgrade day
- **Alternative 2:** Upgrading to Postgres 19: what we measured

## How to say the hosts and runs

The brief names a host by its size. Say it the same way:

- "a small test host": 4 or 8 shared vCPU. These runs show **behavior** (messages, locks, order of events). Do not use them for speed.
- "a 32-vCPU dedicated host", "a 16-vCPU dedicated host", "an 8-vCPU dedicated host": the speed runs, usually 3 trials per version. Say "median of 3 runs" only where the line below says it.
- The tests ran on DBLab Forge, our benchmark harness. Say the name once, if at all.

## Cold open: Postgres 19 in numbers

Source: the brief, section "Postgres 19 in numbers" (PostgreSQL git history, master line, to 2026-11-11).

- "The 19 development cycle had 2,990 commits. That is the most of the last ten release cycles. 18 had 2,774, and the median of 10 to 19 is 2,405."
- "645 people are thanked in the 19 release notes. About 316 of them are in no list back to version 10." (Name matching is approximate: say "about".)
- "In 2025 the project had 2,816 commits, the most of any full year since 2001, which had 3,061. 2026, counted to November 11, already has 3,024." Do not say "record year": 2001 is still higher.
- Bridge to lead 1: "And 22 migration items in the release notes. 18 had 12."

## Lead 1: upgrade day

**Finding.** You can lose the upgrade window to a removed setting, to a `pg_upgrade --check` that says "compatible" and then fails, or to a standby without zstd, and one read-only script on 18 finds these problems first.

**Numbers to say**

- "pg_upgrade --check printed 'Clusters are compatible', and then the real upgrade failed. We reproduced it in 7 of 7 trigger cases, on a small test host."
- "If you set max_locks_per_transaction to 64, 19 gives you 8,765 locks. 18 gave 14,973 for the same value." That is 58% at 64, 61% at 128 and 63% at 256 (small test host).
- "If you never set it, you get more: the default went from 64 to 128, and that gives 17,533 locks against 14,829 on 18."
- "On a new 18.7 cluster our pre-check script printed 16 ok lines and no HIT." (Small test host.)
- "pg_upgradecluster fixed 2 of the 3 removed settings, and it never copied conf.d."

**Mechanism**

- A removed setting in a config file stops 19 at start with FATAL: `io_workers`, `escape_string_warning`, `standard_conforming_strings = off`, or a `radius` line in pg_hba.conf. `pg_upgrade --check` does not read them.
- Role, database and function settings of removed parameters, grants on them, and your own uuid-bytea casts (19 has them built in) pass `--check`. The real run fails when it restores them ("Restoring global objects"), one problem per run.
- `wal_compression = on` now means the best method compiled in: zstd on PGDG builds. A standby or restore host without zstd streams, then stops with FATAL at the first zstd page. 19 also sizes the lock table exactly and no longer borrows free shared memory, so the same `max_locks_per_transaction` gives fewer locks.

**What to do on Monday**

- Run `pg19-precheck.sh` (brief, section 2.0) as a superuser on every 18 primary. Fix every HIT. As pg_monitor, four checks fail with "permission denied".
- If you set `max_locks_per_transaction`, double it in the 19 config before the first start, on the primary and on every standby. pg_upgradecluster keeps the old value.
- Keep `wal_compression = on` only if every standby, restore host and page-reading tool has zstd. Else write the method by name: `wal_compression = lz4`.
- Copy conf.d by hand if you use pg_upgradecluster.

**What we did not show**

- Managed services, Patroni, Ansible roles and operators: not tested.
- `pg_upgrade --clone`, Citus, plv8: not tested.
- Throughput and replica lag per `wal_compression` method: not measured.
- How often each problem happens in production: we show that it happens and under which condition.

**Questions**

- Michael to Nik: "Is the --check gap a bug? What did the hackers say?" (Committer Masahiko Sawada is "inclined to think these are not v19 bugs we must fix before release"; the thread is open; a generic check is proposed for the next major.)
- Nik to Michael: "The release notes say to double max_locks_per_transaction. Who reads that line before an upgrade?"

**Credit.** shihao zhong reported the `--check` gap on pgsql-hackers on 2026-10-24; we reproduced it. Heikki Linnakangas's commit message and the release notes already say to double `max_locks_per_transaction`; we measured the size of the cut. We did not find the standby-without-zstd problem in what others wrote.

## Lead 2: REPACK (CONCURRENTLY)

**Finding.** REPACK (CONCURRENTLY) can replace pg_repack for most tables, but its final exclusive lock is short only when the table fits in memory and the write rate is well below the apply rate; when the table does not fit, the lock is tens of seconds.

**Numbers to say**

- "With the data in memory, on a 32-vCPU dedicated host, REPACK (CONCURRENTLY) held its exclusive lock under 0.1 s with no load, 0.4 s at 28,600 updates per second, and 2.5 s at 57,300 updates per second. Median of 3 runs."
- "Plain REPACK held its lock 53.7 s. Median of 3 runs."
- "With the server capped at 12 GiB of memory, REPACK (CONCURRENTLY) blocked the table 24.4 to 25.2 s at 58,000 updates per second offered, 3 runs." The server served about 30,000 updates per second during the copy. At 32,200 offered: 20.6 and 20.8 s (2 runs, exploratory).
- "At 57,300 updates per second, pg_repack had not finished when our 360-second limit stopped it, in 3 of 3 runs." REPACK (CONCURRENTLY) finished in 12.1 to 13.4 s.
- "An idle transaction that read the table once held REPACK, and every application client behind it, for 30.7 seconds." (Small test host, one run.)

**Mechanism**

- REPACK (CONCURRENTLY) copies the table and rebuilds its indexes under SHARE UPDATE EXCLUSIVE, and collects concurrent changes through logical decoding.
- A first catch-up pass applies the changes made during the copy, before the lock. Then REPACK takes the AccessExclusiveLock, and a second catch-up pass under the lock applies every change written during the first pass and the lock wait. REPACK has no timeout of its own.
- **The one rule:** the table is blocked for about (time of the first catch-up pass + lock wait) x write rate / apply rate, in our runs. With the data larger than memory the hold was 0.91 to 0.93 of the rule; with the data in memory the rule was an upper bound (0.8 of it at 57,300, about one third at 28,600).

**Other costs (each from the brief, each with its host)**

- WAL for the whole cluster: with logical decoding on, an update of another table (1 KiB rows, 1,000 per second) wrote 1,127 bytes of WAL during REPACK (CONCURRENTLY) against 576 without it, 1.96 times; during pg_repack, 546 (32-vCPU dedicated host, 3 trials).
- `effective_wal_level` goes from replica to logical and back, while `SHOW wal_level` says replica. On the 32-vCPU dedicated host it was back 0.00 to 0.10 s after the end in all 13 runs. On a small test host, with a checkpoint in progress, it stayed logical for 7 min 45 s, until a manual CHECKPOINT.
- REPACK holds the xmin horizon to the end, so dead rows in other tables stay.
- On a standby, a reader in an open transaction blocked replay of the swap; replay of the whole cluster stopped until the reader was canceled after 27 s (small test host, hot_standby_feedback = on, max_standby_streaming_delay = 30s).
- One REPACK (CONCURRENTLY) runs per instance. `max_repack_replication_slots = 5` does not mean five at once.
- lock_timeout protects the application, but a failed attempt throws away the whole copy.

**What to do on Monday**

- Run the pre-checks of the brief, section 1.1: identity index, valid indexes, old transactions, prepared transactions, `max_slot_wal_keep_size`.
- Treat the final lock like DDL: run the brief's `repack-retry.sh` (lock_timeout 1s, retry only after a lock timeout), no long transactions, a window with low writes.
- Check that the table, its new copy and its indexes fit in shared_buffers plus page cache. If they do not, expect a block of tens of seconds.
- During catch-up, watch `heap_tuples_updated` in `pg_stat_progress_repack`. If it grows slower than the write rate, cancel and retry when writes are low.
- Abort with `pg_cancel_backend`. Killing psql does not stop the backend.
- After REPACK, check that `effective_wal_level` is back to replica.
- Keep pg_repack for REPLICA IDENTITY FULL, for several tables at once, and for hot tables larger than memory.

**What we did not show**

- pg_repack with the data larger than memory: not run. pg_repack longer than 360 s at 57,300 updates per second: not run, so we do not know when it would finish.
- What limits the first catch-up pass on the 32-vCPU host: not shown (the backend was on CPU in 78 to 83% of its samples under the lock).
- A lower real write rate with the data larger than memory: the server served about 30,000 updates per second at both offered rates.
- `wal_level = minimal`, an anti-wraparound autovacuum at the start, very many changes (memory limit), the horizon and WAL costs of pg_repack and pg_squeeze.

**Questions**

- Michael to Nik: "I do not know my apply rate. How do I pick a window?" (Watch `heap_tuples_updated` during catch-up; pick a low write rate.)
- Nik to Michael: "Would you uninstall pg_repack on day one of 19?"

**Credit.** Radim Marek (boringSQL, 2026-09-28) showed first that the final lock grows with the write rate, that an idle reader blocks the swap, and that pg_repack can fail to catch up. We add when the lock is long, on a 32-vCPU dedicated host, and the rule. Upstream marked the lock upgrade at the swap "Won't Fix" on the 19 open items page.

## Lead 3: LISTEN/NOTIFY with many listeners

**Finding.** On 19 a NOTIFY wakes only the backends that listen on its channel, so applications with many listeners on different channels get a large gain with no setting and no code change.

**Numbers to say** (8-vCPU dedicated host)

- "With 1,000 listeners, each on its own channel, and 4 notifiers as fast as they can go, 18.7 delivered 200 notifications per second. 19 RC2 delivered at least 11,040. Median of 3 runs. Our client was the limit, so the 19 number is a lower bound."
- "At a fixed target of 2,000 per second with 1,000 listeners, 19 kept up with a p99 of 12 to 15 ms, 3 runs. 18.7 reached 121 to 136 per second, 4 runs, with a p99 near 65 s." 18.7 was overloaded: this is not its capacity.
- "Server CPU per notification with 1,000 listeners: 32.2 ms on 18.7, 0.242 ms on 19. 133 times less." (Median of 3 runs.)
- "Committed transactions per notification: 883 on 18.7, 2.32 on 19." (Median of 3 runs.)
- "With 100 listeners: 2,580 per second on 18.7, 22,019 on 19, 8.5 times." (Median of 3 runs; 19 is a lower bound.)

**Mechanism**

On 18 a NOTIFY wakes every backend that listens on any channel, and each woken backend runs a transaction to read the queue. On 19 it wakes only the listeners of that channel, through a new channel map. With 1,000 listeners on 19, 95.6% of the non-idle samples were `LWLock:NotifyChannelHash`, no problem at this rate.

**Who gains**

Anyone with many listeners on different channels: cache invalidation, a channel per worker, a channel per tenant. No gain when every listener reads every message: the commit says so (we did not test it).

**What to do on Monday**

- On 19: nothing to set.
- On 18: keep listening sessions few, for example one listener that fans out in the application.
- On 18, do not trust wait events here: the listeners look idle (`Client:ClientRead`) while they burn CPU.

**What we did not show**

- One channel for all listeners: not tested.
- 18.7 latency at a rate it can hold: not compared.
- The global lock at commit that DBOS describes: not measured.
- One host size, one or four notifiers.

**Questions**

- Michael to Nik: "Who has 1,000 listening sessions? Is this a real pattern?"
- Nik to Michael: "Does this change the advice not to use LISTEN/NOTIFY at scale?"

**Credit.** Joel Jacobson, the author, posted the first numbers with idle listeners on pgsql-hackers in July 2025, on an early patch. We add the released code, at a fixed rate, on a dedicated host. DBOS notes that the global lock at commit stays.

## Quick hits

1. **JIT is off by default.** On 22 TPC-H-derived queries (32-vCPU dedicated host, 3 trials): with each version's default, 19 took 6.8% less time (geometric mean). With the same setting on both, the difference was 1.8% (JIT off) and 1.2% (JIT on): "same". JIT did not change; the default did. Per query (exploratory): q1, the longest aggregation, 4,607 ms against 3,914 ms (17.7% longer); q19, 108 against 172 ms (37.4% less). Find JIT queries in `pg_stat_statements` on 18; set `jit = on` for that role or database where it helps.
2. **Throttled parallel VACUUM is slower.** `VACUUM (PARALLEL 4)` with a 2 ms cost delay: the index phase took 113.6 s on 19 against 41.5 s on 18.7, because workers now share one cost limit. With `vacuum_cost_limit = 1000` in that session: 31.8 s (16-vCPU dedicated host, 3 trials).
3. **Autovacuum order near wraparound.** We put a table at 1.65 billion XIDs last of 121, after 120 bloated tables. 19 started it at about 13 s, 18.7 at about 152 s (16-vCPU dedicated host, 3 trials). Say "placed last": on 18 the pg_class place decides. At default weights, a table at 300 million XIDs still came last on 19. `autovacuum_freeze_score_weight` has a maximum of 10; at 10 it came first in 3 of 3 trials, but then age leads the order of all tables. Watch `pg_stat_autovacuum_scores`.
4. **Hot queue table.** The longest gap between its vacuums was 60.0 to 60.1 s on 19 against 152.3 to 153.2 s on 18.7 (16-vCPU dedicated host, default naptime). A worker sorts its list once when it starts.
5. **The C-library trim setting on 18 (not a 19 feature).** Point lookups over 10 partitions without pruning, 128 clients (32-vCPU dedicated host, 3 trials): 18.7 did 196,490 lookups per second, 18.7 with the glibc trim threshold 256,024 (1.30 times), 19 RC2 258,182. It depends on heap layout: at 8, 9, 12 and 16 partitions both versions trim (small test host). Cost: up to 32 MiB times the number of backends: check RAM. On Debian and Ubuntu, only the cluster's environment file reaches the server.
6. **jsonb with the lz4 default.** 200,000 jsonb documents of 16 KiB: 107 s on 18.7, 44 s on 19 (8-vCPU dedicated host, 3 trials), from the lz4 default alone; the data took 11.3% more space. Old values stay pglz through pg_upgrade, VACUUM FULL and REPACK. On 18 today, `default_toast_compression = lz4` gives the same speed (43 s).
7. **Faster restore.** `pg_restore -j 1` of a 250M-row table: 589.6 s on 18.7, 464.8 s on 19 (-21.2%; 16-vCPU dedicated host, 3 trials), mostly in the index builds. A sort-tracing run (exploratory, another host type) built the non-key index in 96.2 s against 125.0 s, with 25.5 of the 28.8 s saved in the in-memory sort of the runs: this matches the new radix sort. The primary-key gain is not explained.
8. **Bulk insert with a foreign key.** `INSERT ... SELECT` of 10 million rows with an int8 key: 39 s on 18.7, 20 s on 19 (8-vCPU dedicated host, 3 trials). Without the key: 4.3 s and 4.1 s. Why the check is faster is not shown.
9. **log_lock_waits is on by default.** No cost while no wait passes `deadlock_timeout`. In a pile-up on one row the log got 2.35 MiB at 500 waiters and 28.8 to 31.5 MiB at 2,000 (16-vCPU dedicated host, 3 trials; 2,000 is a lower bound). At 2,000 waiters the server stalled for minutes with the setting on or off. Keep it on; keep queues short with `lock_timeout`.
10. **First read after a dump and restore.** On 19 the first read of the restored table wrote 31.18 GiB of WAL, about the heap size; on 18.7, 56 bytes (16-vCPU dedicated host). Run `VACUUM (ANALYZE)` before you let traffic in.

## Demos

Run as a superuser. Use only the text below: it is the text that passed our command check. Each is under two minutes except where noted.

**Demo 1: the pre-check script (on 18).** Save the script from the brief, section 2.0, as `pg19-precheck.sh`. Then:

```shell
./pg19-precheck.sh --host=/var/run/postgresql --port=5432
```

- Expected: on a new 18.7 cluster, 16 lines start with `ok`, and the last line is `0 hit(s), 0 check(s) failed to run` (exit code 0).
- Cleanup: none; the script only reads.

**Demo 2: same setting, other method (on 18 and on 19).**

```sql
set wal_compression = on; show wal_compression; -- 18: pglz; 19 on PGDG: zstd
```

- Expected: `pglz` on 18, `zstd` on 19 (PGDG).
- Cleanup: none; it is a session setting. Close the session.

**Demo 3: REPACK behind an idle reader, with the retry script (on 19).** More than a minute: rehearse it once. Before recording: a table `public.t` with a primary key (we tested 1,000,000 rows, 195 MB, with 2 clients updating at 200 per second), and `repack-retry.sh` from the brief, section 1.1.

Session 1, then leave it open for 60 s:

```sql
begin; select count(*) from t where id < 10;
```

Session 2:

```shell
./repack-retry.sh public.t
```

During the run, in a third session:

```sql
select name, setting from pg_settings where name in ('wal_level', 'effective_wal_level'); -- SHOW wal_level does not show the switch
```

- Expected: attempts 1 to 4 print `canceling statement due to lock timeout`, attempt 5 prints `done` after session 1 ends; `effective_wal_level` shows `logical` during the run while `wal_level` stays `replica`.
- Cleanup: end the transaction in session 1 at 60 s. Each failed attempt leaves a FATAL line in the log and empty files until the next checkpoint.

## Do not say

| Do not say | Say instead |
| --- | --- |
| "REPACK blocks for up to 2.5 s." | "2.5 s, median of 3 runs, at 57,300 updates per second, with the data in memory, on a 32-vCPU dedicated host." |
| "REPACK locks your table for 30 to 50 seconds." | That was a small test host, data not in memory, writes near the apply rate. Give the rule and the condition. |
| "The long REPACK lock is a myth." | The short holds need the data in memory. Larger than memory: 24.4 to 25.2 s. |
| "pg_repack fails under load." | "At 57,300 updates per second it had not finished at our 360-second limit, 3 of 3 runs. We did not run it longer." |
| "REPACK has a bug that keeps logical WAL on." | The switch back waits for the checkpoint in progress; the docs give no bound. |
| "You can run several REPACK (CONCURRENTLY) at once." | One per instance. |
| "2026 is a record year." | 2001 had 3,061 commits; 2026 has 3,024 to November 11. |
| "The log of a lock pile-up is about 7 x N squared bytes." | Withdrawn: it held only at 2,000 waiters. Give the measured sizes. |
| "log_lock_waits slows the queue drain." | At 500 waiters the drain took 0.41 s either way; at 2,000 the server stalled with it on or off. |
| "19 vacuums wraparound tables ten times sooner." | We placed the table last in pg_class, the worst case for 18. |
| "The new autovacuum order is worse than 18" or "we measured its harm." | A table just past its freeze age started later on 19 (122 to 125 s against 67 to 87 s): by design, harm not measured. |
| "18 handles only about 130 notifications per second." | That is 18.7 overloaded at a fixed target, 1,000 listeners, one notifier, one host size. |
| "19 delivers 11,000 notifications per second." | "At least 11,040: our client was the limit." |
| "19 made JIT faster" or "slower." | With the same setting the difference was 1 to 2%. The default changed. |
| "19 is X percent faster." | Every number holds for one workload, one host type, one config. |
| "19 is 33% faster on partitioned lookups." | A C-library heap-layout effect on 18.7; at 8 partitions both were the same. |
| "The glibc setting makes 18 as fast as 19." | It closed the gap on one query shape on one host, and it costs memory per backend. |
| "19 reads 2x faster from disk." | Only the bitmap heap scan changed; 18.7 with `io_workers = 8` was as fast. |
| "The sort is 45% faster on 19." | By our rule that row is "same". Rows with 2 trials are inconclusive. |
| "The radix sort explains the faster restore." | It matches the non-key index build (exploratory). The primary-key gain is not explained. |
| "lz4 compresses better than pglz." | On our corpus lz4 stored 5 to 29% more in 8 of 9 cases. It was faster on the insert. |
| "19 gives 58% of the locks." | 58% at 64, 61% at 128, 63% at 256. |
| "Lock-usage alerts fire late on 19." | The other way round: thresholds above about 1.4 never fire. |
| "pg_upgradecluster fixes the removed settings." | It fixes 2 of 3, and it does not copy conf.d. |
| "wal_compression = on means zstd." | It means the best method compiled in; zstd on PGDG builds. |
| Anything about managed services. | We did not test any managed service. |
| Anything about 19.0. | This is RC2. We plan to re-run the headline cells on 19.0. |
| A speed number from a small test host. | Small test hosts show behavior only. |
| A comparison across hosts. | Two hosts of the same type differed by about 2x on our host benchmarks. |
| Radim Marek's or Joel Jacobson's numbers as ours. | Credit them by name; link their posts. |

## Show notes links (draft, 20)

Time codes are placeholders until the edit.

- [hh:mm:ss] Postgres 19 for people who run it (study brief, 18.7 against 19 RC2): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c
- [hh:mm:ss] PostgreSQL 19 release notes: https://www.postgresql.org/docs/19/release-19.html
- [hh:mm:ss] PostgreSQL 19 RC2 announcement: https://www.postgresql.org/about/news/postgresql-187-1712-1616-1520-1425-and-19-rc-2-released-3442/
- [hh:mm:ss] pg_upgrade --check passes, then the upgrade fails (shihao zhong, pgsql-hackers, 2026-10-24): https://www.postgresql.org/message-id/CAGRkXqT%2B5%2BmQhoKZFTiM4yOZtVV%3DNW506vDwFtVeG%2BVmL_W5wQ%40mail.gmail.com
- [hh:mm:ss] Lock table sizing commit, "in many cases you can acquire far fewer locks than before": https://github.com/postgres/postgres/commit/e1ad034809a
- [hh:mm:ss] Commit message on doubling max_locks_per_transaction (Heikki Linnakangas): https://postgrespro.com/list/id/E1w8iNH-002maX-1C@gemulon.postgresql.org
- [hh:mm:ss] wal_compression = on picks the best method compiled in (source at REL_19_RC2): https://github.com/postgres/postgres/blob/REL_19_RC2/src/include/access/xlog.h#L89-L100
- [hh:mm:ss] REPACK docs: https://www.postgresql.org/docs/19/sql-repack.html
- [hh:mm:ss] REPACK takes the final AccessExclusiveLock (source at REL_19_RC2): https://github.com/postgres/postgres/blob/REL_19_RC2/src/backend/commands/repack.c#L3475
- [hh:mm:ss] REPACK CONCURRENTLY costs (Radim Marek, boringSQL, 2026-09-28): https://boringsql.com/posts/repack-concurrently-costs/
- [hh:mm:ss] PostgreSQL 19 open items: https://wiki.postgresql.org/wiki/PostgreSQL_19_Open_Items
- [hh:mm:ss] One REPACK (CONCURRENTLY) at a time (revert commit): https://github.com/postgres/postgres/commit/01a80f06214
- [hh:mm:ss] NOTIFY wakes only the listeners of its channel (commit): https://github.com/postgres/postgres/commit/282b1cde9de
- [hh:mm:ss] Joel Jacobson's first numbers (pgsql-hackers, July 2025): https://www.postgresql.org/message-id/6899c044-4a82-49be-8117-e6f669765f7e%40app.fastmail.com
- [hh:mm:ss] LISTEN/NOTIFY scalability (DBOS): https://dbos.dev/blog/postgres-listen-notify-scalability
- [hh:mm:ss] JIT default changed to off (commit): https://github.com/postgres/postgres/commit/7f8c88c2b87
- [hh:mm:ss] Parallel vacuum workers share the cost limit (commit): https://github.com/postgres/postgres/commit/bf42705c7dd
- [hh:mm:ss] Autovacuum prioritization (commit): https://github.com/postgres/postgres/commit/d7965d65fc5
- [hh:mm:ss] Radix sort (commit): https://github.com/postgres/postgres/commit/ef3c3cf6d02
- [hh:mm:ss] Postgres 19 compression from pglz to lz4 (Christopher Winslett, Crunchy Data, 2026-07-16): https://www.crunchydata.com/blog/postgres-19-compression-from-pglz-to-lz4

## Open questions for the hosts

1. **Which lead goes first?** Recommendation: upgrade day. Everyone who upgrades meets it, and the numbers bridge ("22 migration items") leads into it.
2. **Do Demo 3 (REPACK) live?** Recommendation: only after one rehearsal on the recording machine; else tell the result (four lock timeouts, success on attempt 5) and show the script.
3. **We record before 19.0 (planned for 2026-11-19).** Recommendation: say "RC2" each time a number comes up, and say once that we plan to re-run the headline cells on 19.0.
4. **How many quick hits?** Recommendation: if time is short, keep JIT, parallel VACUUM, first read after restore, log_lock_waits and the autovacuum order; move the rest to the show notes.
5. **The glibc setting is an 18 tip, not a 19 feature. Keep it?** Recommendation: keep it, short, as "if you stay on 18 for a while"; say its memory cost in the same breath.

## Checked against

Numbers checked against the brief candidate of 16:35 PT (version 2.2).
