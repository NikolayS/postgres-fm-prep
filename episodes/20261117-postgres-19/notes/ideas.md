# Episode 197 (Postgres 19): ideas for later

Ideas raised in or after the episode. No claims; nothing here was tested.

- **Parallel ANALYZE in SQL.** vacuumdb is the usual tool to rebuild statistics after an upgrade or a restore because `-j` runs ANALYZE on many tables at once; a plain `ANALYZE` in SQL runs one table after another. A server-side parallel `ANALYZE` (or a parallel option for it) could be a topic for a future episode or for pgsql-hackers. Raised by Nik, 2026-11-17, after the vacuumdb fact-check. Check the archives for earlier proposals first.
- **Scheduling in core** (00:13:42 to 00:17:17): pg_cron or an equivalent shipped with Postgres, and a safe way for a session to connect to its own server (for autonomous transactions) without dblink and stored passwords.
- **pgcompacttable again** (00:18:15): move rows from the end of the table and truncate, for tables where logical-decoding tools do not work (very large, very busy tables).
- **WAIT FOR LSN at the connection level** (00:36:29): choose the replica that caught up in libpq or the load balancer, not on one node.
- **track_planning default** (00:31:42): Nik thinks the benchmark that kept pg_stat_statements.track_planning off was weak.
