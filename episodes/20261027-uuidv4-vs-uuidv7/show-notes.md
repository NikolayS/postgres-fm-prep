# UUIDv4 vs UUIDv7: show notes

[Episode overview](README.md)

Resources mentioned in the episode. Each time in brackets is the first mention in the YouTube version of the episode, which starts with a 13-second title card. Times in the podcast audio will be different and are to be added when the audio is ready. Links were checked on 2026-10-30. The Cybertec and Instagram pages refuse automated requests, so those two were not confirmed by the check.

## Main link

- [00:00:34] UUIDv4 vs UUIDv7 vs int8 primary keys on Postgres 18 (DBLab Forge brief, PostgresAI): https://console.postgres.ai/shared/brief/9fffe2da-00c1-470b-a79d-a210ae2306bc

## Our previous episodes

- [00:00:51] UUID (2023): https://postgres.fm/episodes/uuid
- [00:00:51] Partitioning by ULID (2023): https://postgres.fm/episodes/partitioning-by-ulid
- [00:01:34] Postgres 18 (`uuidv7()` landed): https://postgres.fm/episodes/postgres-18
- [00:05:53] Benchmarking: https://postgres.fm/episodes/benchmarking
- [00:05:53] Getting started with benchmarking (with Melanie Plageman): https://postgres.fm/episodes/getting-started-with-benchmarking
- [00:17:57] Our previous episodes with Kirk: GSoC B-Tree Merge: https://postgres.fm/episodes/gsoc-btree-merge
- [00:17:57] Our previous episodes with Kirk: Dump/restore done. Now what?: https://postgres.fm/episodes/dump-restore-done-now-what
- [00:20:42] WAL and checkpoint tuning: https://postgres.fm/episodes/wal-and-checkpoint-tuning
- [00:25:01] Compression (including `wal_compression`): https://postgres.fm/episodes/compression

## Our materials on YouTube and elsewhere

- [00:00:51] Hacking Postgres 101: ULID function (Postgres.TV, 2023): https://www.youtube.com/watch?v=YPq_hiOE-N8
- [00:00:51] Hacking Postgres sessions with Andrey, Kirk and Nik (YouTube playlist): https://www.youtube.com/playlist?list=PLH8y1BNPAKjKDdJA7sDmFWUkbbYux3TRz
- [00:00:51] Hacking Postgres website: https://hacking.postgres.tv
- [00:13:36] DBLab Forge results for this experiment, case `uuid-pk-v4-v7-01` (public data, CC BY 4.0): https://gitlab.com/postgres-ai/forge-results/-/tree/main/cases/uuid-pk-v4-v7-01 (in review as https://gitlab.com/postgres-ai/forge-results/-/merge_requests/2 until it is merged)
- [00:38:42] How to use UUID (PostgresAI how-to): https://postgres.ai/docs/postgres-howtos/schema-design/data-types/how-to-use-uuid

## Postgres commits and docs

- [00:01:34] Commit adding `uuidv7()` to Postgres 18 (78c5e141e9c1, 2024-12-11): https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=78c5e141e9c1
- [00:04:16] UUID functions, `uuidv7()` and `uuid_extract_timestamp()` (docs): https://www.postgresql.org/docs/18/functions-uuid.html
- [00:20:42] `full_page_writes`: https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-FULL-PAGE-WRITES
- [00:25:01] `wal_compression` (lz4, zstd): https://www.postgresql.org/docs/current/runtime-config-wal.html#GUC-WAL-COMPRESSION
- [00:31:07] `pg_stat_io`: https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-IO-VIEW

## Standards and ID schemes

- [00:01:20] RFC 9562, Universally Unique IDentifiers (UUIDv7): https://www.rfc-editor.org/rfc/rfc9562
- [00:28:05] ULID spec: https://github.com/ulid/spec
- [00:41:29] Snowflake ID (Twitter): https://github.com/twitter-archive/snowflake
- [00:41:29] Sharding & IDs at Instagram: https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c

## Articles and books

- [00:05:34] Sequential UUID generators (Tomas Vondra, 2018): https://www.enterprisedb.com/blog/sequential-uuid-generators
- [00:05:59] Systems Performance, 2nd edition (Brendan Gregg): https://www.brendangregg.com/systems-performance-2nd-edition-book.html
- [00:12:25] fio: https://github.com/axboe/fio
- [00:26:17] Amazon Aurora pricing (I/O charges): https://aws.amazon.com/rds/aurora/pricing/
- [00:32:53] UUIDv7 doesn't have the properties you think it does (Robert Alexander, 2026): https://alexsci.com/blog/uuidv7-is-weird/
- [00:32:53] Hacker News discussion: https://news.ycombinator.com/item?id=50211746

## Further reading (prior art cited in the brief, not mentioned on air)

- UUID benchmark war (Jeremy Schneider, 2024): https://ardentperf.com/2024/02/03/uuid-benchmark-war/
- Unexpected downsides of UUID keys in PostgreSQL (Ants Aasma, Cybertec, 2023): https://www.cybertec-postgresql.com/en/unexpected-downsides-of-uuid-keys-in-postgresql/
- Goodbye to sequential integers, hello UUIDv7 (Buildkite, 2023): https://buildkite.engineering/goodbye-integers-hello-uuids/
- UUIDv7 and privacy (Marc Brooker, 2025): https://brooker.co.za/blog/2025/10/22/uuidv7
