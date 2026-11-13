# The hidden costs of CREATE TEMP TABLE

Postgres.FM episode 196. Nik and Kirk.

## Episode description

Nik and Kirk discuss the hidden costs of CREATE TEMP TABLE: dead tuples and catalog bloat, and the shared invalidation queue that every session has to read. They cover why thousands of idle sessions make it much worse, what it looks like in wait events, and what to use instead.

## Links

Here are some links to things they mentioned:

Times are podcast times of the first mention.

### Main link

- [00:34:15] Temp tables in the request path: where the cliff is, and what LWLock:SInvalWrite really tells you (DBLab Forge brief, PostgresAI): https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d

### Michael

- [00:00:44] Michael's post about taking a few months off (X): https://x.com/michristofides/status/2117283823314674021

### Episodes

- [00:06:12] UUIDv4 vs UUIDv7: https://postgres.fm/episodes/uuidv4-vs-uuidv7

### Postgres docs

- [00:01:32] CREATE TABLE, Compatibility: temporary tables vs the SQL standard's global temporary tables (docs): https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-COMPATIBILITY
- [00:04:34] CREATE TABLE, TEMPORARY: autovacuum cannot vacuum or analyze temporary tables (docs): https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-TEMPORARY
- [00:15:40] LWLock wait events, including SInvalWrite and SInvalRead (docs): https://www.postgresql.org/docs/current/monitoring-stats.html#WAIT-EVENT-LWLOCK-TABLE
- [00:19:16] max_locks_per_transaction (docs): https://www.postgresql.org/docs/current/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION
- [00:27:14] CREATE TABLE, ON COMMIT: PRESERVE ROWS, DELETE ROWS, DROP (docs): https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-PARMS-ON-COMMIT
- [00:32:24] CREATE TABLE, UNLOGGED (docs): https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-UNLOGGED
- [00:37:45] DISCARD (docs): https://www.postgresql.org/docs/current/sql-discard.html

### Postgres source and history

- [00:18:11] sinvaladt.c: MAXNUMMESSAGES, the 4,096-message invalidation queue: https://github.com/postgres/postgres/blob/3d342deeb433060dbea02fdd276656a5563275d5/src/backend/storage/ipc/sinvaladt.c
- [00:18:49] Increase the number of fast-path lock slots (Tomas Vondra, 2024, Postgres 18): https://github.com/postgres/postgres/commit/c4d5cb71d229095a39fda1121a75ee40e6069a2a
- [00:23:38] Postgres 14 release notes: better scalability with many connections (Andres Freund's work): https://www.postgresql.org/docs/release/14.0/
- [00:35:43] Rewrite the sinval messaging mechanism to reduce contention (Tom Lane, 2008): https://github.com/postgres/postgres/commit/fad153ec45299bd4d4f29dec8d9e04e2f1c08148

### Tools

- [00:13:10] pg_repack: https://github.com/reorg/pg_repack
- [00:20:24] PgBouncer, server_reset_query (default DISCARD ALL): https://www.pgbouncer.org/config.html#server_reset_query
- [00:24:06] Amazon RDS Performance Insights: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PerfInsights.html
- [00:24:12] pg_ash, active session history for Postgres: https://github.com/NikolayS/pg_ash

### Other

- [00:24:39] Linux performance tools (Brendan Gregg): https://www.brendangregg.com/linuxperf.html
- [00:36:41] Don't Do This: Don't create temporary tables in frequently executed code (PostgreSQL wiki): https://wiki.postgresql.org/wiki/Don%27t_Do_This#Don.27t_create_temporary_tables_in_frequently_executed_code

~~~

What did you like or not like? What should we discuss next time? Let us know via a YouTube comment, on social media (https://postgres.fm/people), or by commenting on our Google doc (https://docs.google.com/document/d/1PNGSn_d0A7gTR4C0p6geQyHOTgdpitKCRvafCNnT-44/edit#heading=h.v4ncheatetql)!

~~~

Postgres FM is produced by:

- Michael Christofides, founder of pgMustard: https://pgmustard.com/
- Nikolay Samokhvalov, founder of PostgresAI: https://postgres.ai/

With credit to:

- Jessie Draws for the elephant artwork
- Intro and outro music: our own arrangement of Apple Loops from GarageBand (royalty-free under the GarageBand licence)
