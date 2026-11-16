# Postgres 19 for people who run it: recording notes (DRAFT)

[Episode overview](README.md)

**DRAFT, 2026-11-16 PT.** For Nik and Michael: read before recording, keep open while recording. Every number below is in the study brief (version 3.0), with the same unit and qualifier. The brief tested PGDG packages of 18.7 and 19 RC2, not 19.0. RC2 came out on 2026-11-12; 19.0 is planned for 2026-11-19.

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
- "thin clones on one host": copy-on-write copies of one cluster on a 16-vCPU host (ZFS clones for the upgrade rehearsals, DBLab Engine clones for the plan comparison). Say "thin clones on one host" with every plan timing.

## Cold open: Postgres 19 in numbers

Source: the brief, section "Postgres 19 in numbers" (PostgreSQL git history, master line, to 2026-11-11).

- "The 19 development cycle had 2,990 commits. That is the most of the last ten release cycles. 18 had 2,774, and the median of 10 to 19 is 2,405."
- "645 people are thanked in the 19 release notes. About 316 of them are in no list back to version 10." (Name matching is approximate: say "about".)
- "In 2025 the project had 2,816 commits, the most of any full year since 2001, which had 3,061. 2026, counted to November 11, already has 3,024." Do not say "record year": 2001 is still higher.
- Bridge to lead 1: "And 22 migration items in the release notes. 18 had 12."

## Lead 1: upgrade day

**Finding.** Three things can cost you the upgrade window: a removed setting, a `pg_upgrade --check` that says "compatible" and then fails, and a standby without zstd. The five detection queries on the source list the measured cases of the first two (not the config you write for 19); for the third, check each standby's build by hand. An empty result does not mean the upgrade will work, so the brief gives three steps: the detection queries, then `pg_upgrade --check`, then a rehearsal on a clone.

**Numbers to say**

- "We ran 693 upgrade rehearsals into 19 RC2, from PGDG 14 to 18, of setups we built to break the upgrade, each on a fresh thin clone. Of those setups, 22 cases passed `pg_upgrade --check` and then failed the real run, and in 11 more a removed setting added to the 19 config stopped 19 at start. It is a list of traps we built, not a failure rate." (A case is one setting or object in one place; the 22 cases are 89 rehearsals.)
- "The most common one: `escape_string_warning` set on a role, a database or a function, or granted. 33 of the 89 failed rehearsals. The fix is one line on the source: `ALTER ROLE app RESET escape_string_warning;`, or REVOKE for a grant."
- "On a test table with every assigned code point, indexes on normalize() missed rows after pg_upgrade to 19, in 13 of 13 runs, from every source version: the rows with characters newer than the source's Unicode. From 14 to 16, pg_upgrade does not warn. How often real data holds such characters, we did not measure."
- "Kill pg_upgrade during the file transfer: with --link, the old cluster started again after the rename of pg_control.old that the docs describe, 3 of 3. With --swap it did not start, 2 of 2."
- "If you set max_locks_per_transaction to 64, 19 gives you 8,765 locks. 18 gave 14,973 for the same value." That is 58% at 64, 61% at 128 and 63% at 256 (small test host). If you never set it, you get more: the default went from 64 to 128, and that gives 17,533 locks against 14,829 on 18.
- "pg_upgradecluster rewrote io_workers and escape_string_warning, but not standard_conforming_strings = off, and it never copied conf.d."

**Mechanism**

- A removed setting in a config file stops 19 at start with FATAL: `io_workers`, `escape_string_warning`, `standard_conforming_strings = off`, or a `radius` line in pg_hba.conf. `pg_upgrade --check` misses them. Copied into the 19 config before `--check`, the same lines make `--check` fail (62 of 62); added after the run, 19 does not start.
- Role, database and function settings of removed parameters, grants on them, and your own uuid-bytea casts (19 has them built in) pass `--check`. The real run fails, one problem per run; a role setting, for example, at "Restoring global objects".
- 19 RC2 has Unicode 17.0 (18 has 16.0, 14 has 13.0). An expression index on normalize(), such as OpenStreetMap's `lower(NORMALIZE(display_name, NFKC))`, keeps the old values after pg_upgrade. pg_upgrade 19 checks this only for sources from 17. Exposed: an index, constraint, generated column, partition key or materialized view that uses normalize() or the other Unicode functions, with rows that hold characters newer than the source's Unicode (from 18: 1 changed code point with libc or ICU, 29 with the builtin provider). How often real data holds them, we did not measure.
- GiST indexes on inet or cidr with btree_gist fail `--check`; an extension with no 19 package fails `--check` or blocks pg_upgradecluster (timescaledb had none on PGDG). Q5 of the detection queries lists the extensions and preload libraries; the query in section 2.5 finds the btree_gist indexes.
- `wal_compression = on` now means the best method compiled in: zstd on PGDG builds. A standby or restore host without zstd streams, then stops with FATAL at the first zstd page. 19 also sizes the lock table exactly and no longer borrows free shared memory, so the same `max_locks_per_transaction` gives fewer locks.

**What to do on Monday**

- Run the five detection queries (brief, section 2.0) on the source, in every database; Q3 needs a superuser. Fix what they list. Then run `pg_upgrade --check`, then rehearse the upgrade on a clone.
- After the upgrade, REINDEX each index that Q4 listed, refresh the materialized views, validate the constraints again, then run `bt_index_check(index, true)`.
- Know what a killed run leaves: after `--link`, rename `global/pg_control.old` as the docs say; after `--swap`, the docs give no recovery but a restore from backup.
- If you set `max_locks_per_transaction`, double it in the 19 config before the first start, on the primary and on every standby. pg_upgradecluster keeps the old value.
- Keep `wal_compression = on` only if every standby, restore host and page-reading tool has zstd. Else write the method by name: `wal_compression = lz4`.
- Copy conf.d by hand if you use pg_upgradecluster.

**What we did not show**

- Managed services, Patroni, Ansible roles and operators: not tested.
- Citus, plv8: not tested. `pg_upgrade --clone`: only on our ZFS with block cloning off, where it failed `--check`.
- Logical slots across the upgrade, data at real size, Debian pg_upgradecluster in the rehearsals: not covered.
- How often each problem happens in production: we show that it happens and under which condition.

**Questions**

- Michael to Nik: "Is the --check gap a bug? What did the hackers say?" (Committer Masahiko Sawada is "inclined to think these are not v19 bugs we must fix before release"; the thread is open; a generic check is proposed for the next major.)
- Michael to Nik: "Version 2.3 of your page had a pre-check script. Where did it go?" (We withdrew it in 3.0: it missed cases that the rehearsals found. The detection queries, `pg_upgrade --check` and a rehearsal on a clone replace it. The same version withdrew our line "plans are deterministic": 488 queries changed plan between ANALYZE runs on 18.7. Every correction is named in the page's version history.)

**Credit.** shihao zhong reported the `--check` gap on pgsql-hackers on 2026-10-24; we reproduced it (7 of 7 trigger cases, small test host) and then rehearsed it from 14 to 18. Heikki Linnakangas's commit message and the release notes already say to double `max_locks_per_transaction`; we measured the size of the cut. We did not find the standby-without-zstd problem in what others wrote.

## Lead 2: REPACK (CONCURRENTLY)

**Finding.** REPACK (CONCURRENTLY) can replace pg_repack for permanent tables with a primary key or a replica-identity index. Its final lock is short when the table and its new copy fit in memory and the write rate is well below the apply rate. On a 32-vCPU dedicated host with the server capped at 12 GiB of memory, at about 30,000 updates per second served, it blocked the table for 21 to 25 s (medians 20.7 and 24.9 s).

**Numbers to say** (keep it to these three on air)

- The rule: "The longer the first catch-up pass and the faster the writes, the longer the block."
- "On a 32-vCPU dedicated host: 2.5 s median at 57,300 updates per second with the data in memory; 24.9 s median at 58,000 updates per second offered, with the server capped at 12 GiB of memory. 3 runs each."
- "An idle transaction that read the table once held REPACK, and every application client behind it, for 30.7 seconds." (Small test host, one run.)

**If asked**

- "Plain REPACK of the same 60-million-row table, with no load, held its lock 53.7 s. Median of 3 runs."
- "With the data in memory, at 57,300 updates per second on the 32-vCPU dedicated host, pg_repack had not finished when our 360-second limit stopped it, in 3 of 3 runs." REPACK (CONCURRENTLY) finished in 12.1 to 13.4 s.
- The rule as a formula: the table is blocked for about (time of the first catch-up pass + lock wait) x write rate / apply rate, in our runs. With the data larger than memory the hold was 0.91 to 0.93 of the rule; with the data in memory the rule was an upper bound (0.8 of it at 57,300, about one third at 28,600).

**Mechanism**

- REPACK (CONCURRENTLY) copies the table and rebuilds its indexes under SHARE UPDATE EXCLUSIVE, and collects concurrent changes through logical decoding.
- A first catch-up pass applies the changes made during the copy, before the lock. Then REPACK takes the AccessExclusiveLock, and a second catch-up pass under the lock applies every change written during the first pass and the lock wait. REPACK has no timeout of its own.

**Other costs (if asked; each from the brief, each with its host)**

- WAL for the whole cluster: with logical decoding on, an update of another table (1 KiB rows, 1,000 per second) wrote 1,127 bytes of WAL during REPACK (CONCURRENTLY) against 576 without it, 1.96 times; during pg_repack, 546 (32-vCPU dedicated host, 3 trials).
- `effective_wal_level` goes from replica to logical and back, while `SHOW wal_level` says replica. On the 32-vCPU dedicated host it was back 0.00 to 0.10 s after the end in all 13 runs. On a small test host, with a checkpoint in progress, it stayed logical for 7 min 45 s, until a manual CHECKPOINT.
- One REPACK (CONCURRENTLY) runs per instance. `max_repack_replication_slots = 5` does not mean five at once.

**What to do on Monday**

- Run the pre-checks of the brief, section 1.1: identity index, valid indexes, old transactions, prepared transactions, `max_slot_wal_keep_size`.
- Treat the final lock like DDL: run the brief's `repack-retry.sh` (lock_timeout 1s, retry only after a lock timeout), no long transactions, a window with low writes.
- On a busy table, check that the table, its new copy and its indexes fit in shared_buffers plus page cache. If they do not, expect a block of tens of seconds (21 to 25 s at about 30,000 updates per second on the 32-vCPU dedicated host).
- During catch-up, watch `heap_tuples_updated` in `pg_stat_progress_repack`. If it grows slower than the write rate, cancel and retry when writes are low.
- Abort with `pg_cancel_backend`. Killing psql does not stop the backend.
- After REPACK, check that `effective_wal_level` is back to replica.
- Keep pg_repack for REPLICA IDENTITY FULL, for several tables at once, and for hot tables larger than memory.

**What we did not show**

- pg_repack with the data larger than memory: not run. pg_repack longer than 360 s at 57,300 updates per second: not run, so we do not know when it would finish.

**Questions**

- Michael to Nik: "I do not know my apply rate. How do I pick a window?" (Watch `heap_tuples_updated` during catch-up; pick a low write rate.)
- Nik to Michael: "Would you uninstall pg_repack on day one of 19?"

**Credit.** Radim Marek (boringSQL, 2026-09-28) showed first that the final lock grows with the write rate, that an idle reader blocks the swap, that lock_timeout throws away the whole copy, that REPACK holds the xmin horizon for the whole cluster, and that pg_repack can fail to catch up. Christophe Pettus (The Build, 2026-05-27) wrote first that only one REPACK (CONCURRENTLY) runs at a time. We add when the lock is long, on a 32-vCPU dedicated host, and the rule. Upstream marked the lock upgrade at the swap "Won't Fix" on the 19 open items page.

## Lead 3: LISTEN/NOTIFY with many listeners

**Finding.** If your listeners are on many channels, 19 wakes only the right ones; nothing to set.

**Numbers to say** (8-vCPU dedicated host)

- "With 1,000 listeners, each on its own channel, and 4 notifiers as fast as they can go, 18.7 delivered 200 notifications per second. 19 RC2 delivered at least 11,040. Median of 3 runs. Our client was the limit, so the 19 number is a lower bound."
- "At a fixed target of 2,000 per second with 1,000 listeners, 19 kept up with a p99 of 12 to 15 ms, 3 runs. 18.7 reached 121 to 136 per second, 4 runs, with a p99 near 65 s." 18.7 was overloaded: this is not its capacity.

**Mechanism**

On 18 a NOTIFY wakes every backend that listens on any channel, and each woken backend runs a transaction to read the queue. On 19 it wakes only the listeners of that channel, through a new channel map.

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

1. **JIT is off by default.** On 22 TPC-H-derived queries (32-vCPU dedicated host, 3 trials; per query exploratory): q1, the longest aggregation, took 17.7% longer on 19 RC2 (4,607 against 3,914 ms); q19, a short one, 37.4% less (108 against 172 ms). The geometric mean was 6.8% lower; with the same setting on both, 1.8% (JIT off) and 1.2% (JIT on): "same". JIT did not change; the default did. Find JIT queries in `pg_stat_statements` on 18; set `jit = on` for that role or database where it helps.
2. **Plans changed on four benchmarks; results matched where both versions finished.** We planned 4,273 benchmark queries (263 templates from four public benchmarks) on 18.7 and on 19 RC2 after pg_upgrade, with the same data and statistics, on thin clones. 83 of the 220 templates we could judge got another plan. One planner commit is behind 757 of the 1,199 changed queries: 8300d3ad4, a tie-break. When two parallel plans cost within 1%, 19 keeps the one with the lower startup cost; 18 kept the lower total. For those 757, a 19 RC2 build without the commit gave the 18.7 plan back. Rows: equal in 594 of 594 pairs that finished on both versions. Timed on 25 parallel-plan queries chosen by rule (thin clones on one host, two separate run sets, no JIT), the plan change alone: 1 faster, 1 slower, 23 inconclusive. To do: save your top plans on 18, compare them on a 19 clone, time the changed ones. The reproducer is Demo 1.
3. **Throttled parallel VACUUM is slower.** `VACUUM (PARALLEL 4)` with a 2 ms cost delay and cost limit 200: the index phase took 113.6 s on 19 RC2 against 41.5 s on 18.7 (16-vCPU dedicated host, 3 trials). With `vacuum_cost_limit = 1000` in that session: 31.8 s on 19 RC2. What 19 changed: parallel workers now share the cost limit (release notes; commit bf42705c7dd). We did not isolate this change as the only cause: not run were 18.7 at 1000, other limits, other worker counts, and a 19 build without the cost-sharing commit.
4. **Autovacuum order near wraparound.** We put a table at 1.65 billion XIDs last of 121, after 120 bloated tables. 19 started it at about 13 s, 18.7 at about 152 s (16-vCPU dedicated host, 3 trials). Say "placed last": on 18 the pg_class place decides. At default weights, with the other tables at a score of about 5, a table at 300 million XIDs still came last on 19. `autovacuum_freeze_score_weight` has a maximum of 10; at 10 it came first in 3 of 3 trials, and by the formula aging tables then start to outrank bloated ones, so all autovacuum work is reordered. Watch `pg_stat_autovacuum_scores`.
5. **The C-library trim setting on 18 (not a 19 feature).** On 18.7, the glibc trim threshold took point lookups over 10 partitions without pruning from 196,490 to 256,024 per second, 1.30 times (19 RC2: 258,182; 32-vCPU dedicated host, 128 clients, 3 trials); it depends on heap layout (at 8, 9, 12 and 16 partitions both versions trim, small test host) and costs up to 32 MiB times the number of backends.
6. **jsonb with the lz4 default.** 200,000 jsonb documents of 16 KiB: 107 s on 18.7, 44 s on 19 (8-vCPU dedicated host, 3 trials), from the lz4 default alone; the data took 11.3% more space. Old values stay pglz through pg_upgrade, VACUUM FULL and REPACK. On 18 today, `default_toast_compression = lz4` gives the same speed (43 s).
7. **Faster restore.** `pg_restore -j 1` of a 250M-row table: 589.6 s on 18.7, 464.8 s on 19 (-21.2%; 16-vCPU dedicated host, 3 trials), mostly in the index builds. Why: partly shown. In a separate exploratory run, most of the gain on the non-key index was in the in-memory sort, which fits the new radix sort. The primary-key gain is not explained.
8. **Bulk insert with a foreign key.** `INSERT ... SELECT` of 10 million rows with an int8 key: 39 s on 18.7, 20 s on 19 (8-vCPU dedicated host, 3 trials). Without the key: 4.3 s and 4.1 s. Why the check is faster is not shown.
9. **log_lock_waits is on by default.** No cost while no wait passes `deadlock_timeout`. In a pile-up on one row the log got 2.35 MiB at 500 waiters and 28.8 to 31.5 MiB at 2,000 (16-vCPU dedicated host, 3 trials; 2,000 is a lower bound). At 2,000 waiters the server stalled for minutes with the setting on or off. Keep it on; keep queues short with `lock_timeout`.
10. **First read after a dump and restore.** For dump and restore (not pg_upgrade) with standbys or a WAL archive. With data checksums on (the initdb default since 18), the first read of a restored table on 19 wrote 31.18 GiB of WAL, about the heap size; on 18.7, 56 bytes (16-vCPU dedicated host, 3 trials). This confirms our RC1 study on RC2. Run `VACUUM (ANALYZE)` before you let traffic in.
11. **Plan advice.** When a plan flips and you cannot deploy, 19 can pin the good plan for every session from SQL (`pg_plan_advice` and `pg_stash_advice`). The trap: cached plans ignore a stash change, and a changed query ID drops the advice silently. Fix statistics first; treat advice as a tracked stopgap (small test host).
12. **io_uring with many connections.** With the systemd default soft limit of 1,024 open files and `max_connections = 1200`, neither 18.7 nor 19 RC2 started with `io_method = io_uring` (8-vCPU dedicated host, every attempt). Raise `LimitNOFILE` first: a failed restart is an outage, not a slowdown.

## Demos

Run as a superuser. Use only the text below: it is copied from the brief. Each is under two minutes except where noted.

**Demo 1: the plan tie-break (on 18 and on 19).** The small reproducer from the brief, section 3.6, on a new cluster of each version (PGDG, default settings; the script sets its own session settings). The load time was not measured: create the tables before recording.

```sql
create table n as select g as n_id, 'nation ' || g as n_name
  from generate_series(0, 24) as g;
alter table n add primary key (n_id);
create table c as select g as c_id, g % 25 as c_nat,
  'customer ' || g as c_name from generate_series(1, 300000) as g;
alter table c add primary key (c_id);
create table o as select g as o_id,
  ((g::bigint * 7919) % 300000 + 1)::int as o_cust,
  date '1992-01-01' + (g % 2400) as o_date,
  (g % 100000)::numeric(12, 2) as o_price, repeat('x', 60) as o_pad
  from generate_series(1, 3000000) as g;
alter table o alter column o_date set statistics 10000;
alter table c alter column c_nat set statistics 1000;
vacuum analyze n, c, o;
set max_parallel_workers_per_gather = 4;
set work_mem = '64MB';
set random_page_cost = 1.1;
set effective_cache_size = '40GB';
explain select c_name, n_name, o_price
from o join c on o_cust = c_id join n on c_nat = n_id
where o_date < date '1992-01-10';
```

- Expected (same plans and costs in 3 of 3 runs per version on the page): 18.7 gives a Gather (cost=1001.99..53502.21) over a parallel hash join; 19 RC2 gives a Hash Join (cost=1001.99..53528.12) over the Gather: the same startup cost, a total 0.05% higher. A 19 RC2 build without 8300d3ad4 gives the 18.7 plan.
- Cleanup: `drop table o, c, n;`.

**Demo 2: same setting, other method (on 18 and on 19).**

```sql
set wal_compression = on; show wal_compression;   -- 18: pglz; 19 on PGDG: zstd
```

- Expected: `pglz` on 18, `zstd` on 19 (PGDG).
- Cleanup: none; it is a session setting. Close the session.

**Demo 3: REPACK behind an idle reader, with the retry script (on 19).** More than a minute: rehearse it once. Before recording: a table `public.t` with a primary key, and `repack-retry.sh` from the brief, section 1.1, made executable (`chmod +x repack-retry.sh`). We tested 1,000,000 rows, 195 MB, with 2 writers at 200 updates per second; the brief gives no command for the writers, and the demo without them is not tested.

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
select name, setting from pg_settings where name in ('wal_level', 'effective_wal_level');  -- SHOW wal_level does not show the switch
```

- Expected: attempts 1 to 4 print `canceling statement due to lock timeout`, attempt 5 prints `done` after session 1 ends; `effective_wal_level` shows `logical` while an attempt runs, and `wal_level` stays `replica`.
- Cleanup: end the transaction in session 1 at 60 s. Each failed attempt copies the whole table and its WAL, and leaves a FATAL line in the log and empty files until the next checkpoint. Run `CHECKPOINT` to remove the empty files; drop `public.t` if you made it for the demo.

## Do not say

| Do not say | Say instead |
| --- | --- |
| "REPACK locks your table for 30 to 50 seconds." | That was a small test host, data not in memory, writes near the apply rate. Give the rule and the condition. |
| "REPACK has a bug that keeps logical WAL on." | The switch back waits for the checkpoint in progress; the docs give no bound. |
| "Plans are deterministic." | Withdrawn in 3.0: 488 queries changed plan between ANALYZE runs on 18.7. A plan counts as changed only if 18.7 gave the same plan after three ANALYZE runs. |
| "log_lock_waits causes the stall at 2,000 waiters" or "the deadlock checks cause the stall." | The server stalled with the setting off too; that the deadlock checks cause it is partly shown. |
| "19 fixes LISTEN/NOTIFY at scale." | It removes the wake-up of listeners on other channels. DBOS notes that the global lock at commit stays; one channel for all listeners was not tested. |
| "pg_upgrade makes my TOAST data lz4." | No. Only new values, and values you rewrite. |
| "log_lock_waits slows the queue drain." | At 500 waiters the drain took 0.41 s either way; at 2,000 the server stalled with it on or off. |
| "18 handles only about 130 notifications per second." | That is 18.7 overloaded at a fixed target, 1,000 listeners, one notifier, one host size. |
| "Parallel VACUUM is 3 times slower on 19." | Only with a cost delay: 113.6 s against 41.5 s in the index phase at limit 200; 31.8 s at 1000. |
| "19 is X percent faster." | Every number holds for one workload, one host type, one config. |
| "19 reads 2x faster from disk." | Only the bitmap heap scan changed; 18.7 with `io_workers = 8` was as fast. |
| "The new plans make 19 faster" or "slower." | The plan change alone: 1 faster, 1 slower, 23 inconclusive, on 25 queries, thin clones on one host, no JIT. No percentage there is a property of 19. |
| "lz4 compresses better than pglz." | On our corpus lz4 stored 5 to 29% more in 8 of 9 cases. It was faster on the insert. |
| "bd3e3e9e568 changed q8 and q21" or "8300d3ad4 changed q14." | Both withdrawn in 3.0. Without 8300d3ad4, a 19 RC2 build gives the 18.7 plan of q8 and q21 back (50 of 50 queries each); the cause of the earlier q14 change is not known. |
| "pg_upgradecluster fixes the removed settings." | It rewrote io_workers and escape_string_warning, not standard_conforming_strings = off, and it never copied conf.d. |
| Anything about managed services. | We did not test any managed service. |
| Anything about 19.0. | This is RC2. |
| A speed number from a small test host. | Small test hosts show behavior only. |
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
- [hh:mm:ss] Only one REPACK (CONCURRENTLY) at a time (Christophe Pettus, The Build, 2026-05-27): https://thebuild.com/blog/repack-concurrently-pgsqueeze-gets-a-promotion/
- [hh:mm:ss] pg_upgrade checks Unicode changes only for sources from 17 (source at REL_19_RC2): https://github.com/postgres/postgres/blob/REL_19_RC2/src/bin/pg_upgrade/check.c#L2081-L2087
- [hh:mm:ss] REPACK CONCURRENTLY costs (Radim Marek, boringSQL, 2026-09-28): https://boringsql.com/posts/repack-concurrently-costs/
- [hh:mm:ss] PostgreSQL 19 open items: https://wiki.postgresql.org/wiki/PostgreSQL_19_Open_Items
- [hh:mm:ss] Parallel plans: startup cost breaks near-ties (commit 8300d3ad4): https://github.com/postgres/postgres/commit/8300d3ad4
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
3. **We record before 19.0 (planned for 2026-11-19).** Recommendation: say "RC2" each time a number comes up.
4. **Do we promise a re-run on 19.0?** Recommendation: only with a date.
5. **How many quick hits?** Recommendation: if time is short, keep JIT, the plan comparison, parallel VACUUM, first read after restore and log_lock_waits; move the rest to the show notes.
6. **The glibc setting is an 18 tip, not a 19 feature. Keep it?** Recommendation: keep it, short, as "if you stay on 18 for a while"; say its memory cost in the same breath.

## Checked against

Numbers, links and the "do not say" list checked against the published version 3.0 of the brief.
