# Episode 197 (Postgres 19): code cards (draft)

DRAFT, 2026-11-17, for Nik's approval. Times are recording times; anchor each card on the source word with `find.ts` after the edit.

Idea taken from a developer-facing PG19 overview on X (Alex Shapalov, 2026-11-17): for each feature, state the problem in one line, then show one small SQL snippet. Here that becomes a band card with one or two lines of SQL, shown while the feature is discussed. The SQL below was checked against the 19 RC2 docs and source; the WAIT FOR example follows the RC2 reference page.

| Time | Feature | Problem line | SQL on the card |
| --- | --- | --- | --- |
| 00:12:03 | REPACK | Shrink a bloated table without locking it for the whole rewrite | `repack (concurrently) orders;` then `select * from pg_stat_progress_repack;` |
| 00:13:27 | REPACK USING INDEX | CLUSTER under a new name | `repack orders using index orders_created_at_idx;` |
| 00:20:40 | LISTEN/NOTIFY | NOTIFY woke every listener on any channel | the brief's NOTIFY chart (see `cold-open.md`), not SQL |
| 00:24:29 | Autovacuum order | Which table goes first? | `select relname, score, for_wraparound from pg_stat_autovacuum_scores order by score desc limit 5;` |
| 00:25:12 | Plan advice | A plan flips, and you cannot change the app | `load 'pg_plan_advice';` then `explain (costs off, plan_advice) select ...;` (output ends with "Generated Plan Advice:", e.g. `JOIN_ORDER(f d)`) |
| 00:31:32 | JIT default | JIT is now off | `alter role reports set jit = on;` (only where it helps) |
| 00:34:06 | WAIT FOR LSN | Write on the primary, read on a replica, the row is not there yet | primary: `select pg_current_wal_insert_lsn();` replica: `wait for lsn '0/306EE20' with (timeout '2s');` |
| 00:43:42 | pgbench | Keep the load running after errors | `pgbench --continue-on-error ...` |
| 00:44:33 | Removed settings | --check says OK, the upgrade fails (role and database settings; functions need `proconfig` in pg_proc) | `select * from pg_db_role_setting where array_to_string(setconfig, ',') ~ 'escape_string_warning|standard_conforming_strings';` |

Rules: lowercase SQL; every card shows the version ("Postgres 19"); no card for a feature nobody on air talked about.
