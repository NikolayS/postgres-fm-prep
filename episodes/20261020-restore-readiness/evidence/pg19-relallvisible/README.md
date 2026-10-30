# Independent PG19rc1 single-field experiment

Executed October 20, 2026 UTC, separately from the Forge campaign. Two fresh container clusters reproduced the result. This is evidence of plan sensitivity and an open policy question, not a demonstrated PG19 performance regression or wrong-results bug.

## Identity and reproduction

Official [PG19rc1 source archive](https://ftp.postgresql.org/pub/source/v19rc1/postgresql-19rc1.tar.bz2), SHA-256 `af105fc8e960fc836a09fc2cd7f582b49fd17675d9d36631abe3a565bfd7d701`; tag `REL_19_RC1`, commit `0b8bff042a997fe50fcd1c4c83b9ef1cc9ed8a89`. Built on Debian 13/Linux arm64 with GCC 14.2 and `--prefix=/opt/pg19 --enable-cassert --enable-debug --without-icu`; installed `contrib/pg_visibility`. Server, pg_dump and pg_restore all reported 19rc1. Local immutable image ID `sha256:2540df7731a9d3ece4a39f71095e02d8874174f20265da20ff9acf895ff39250` identifies the tested build; it is not a published downloadable image.

[reproduce.sh](reproduce.sh) is the exact tested script. It requires bash, PG19rc1 clients, superuser access to a disposable fresh cluster, standard 8-KiB blocks and installed pg_visibility. Database names must be unused; it creates three databases and `rvis.dump`. [container-test.sh](container-test.sh) records the actual cluster setup and additional identity/content checks; it assumes the container user `pgtest`, the `/opt/pg19` installation and the reproducer at `/tmp/reproduce.sh`. It is not a generic host setup script.

Fresh initdb used checksums and no locale. Assertions, checksums and cluster autovacuum were on; the table had autovacuum disabled. Default planner cost settings; checkpoint timeout 1h, max_wal_size 1GB. Source was vacuum analyzed; restored targets were not. This is not the separately checkpointed Forge WAL experiment.

[First execution log](run1.log) · [Independent execution log](independent-run.log) · [Artifact hashes](sha256.json).

## Result

Both restored heaps started at 408 physical pages, VM all-visible count 0, imported relpages 345 and reltuples 20,000. The control changed only relallvisible through pg_restore_relation_stats; omitted fields remain unchanged.

| Observation | Imported relallvisible = 345 | Control relallvisible = 0 |
| --- | ---: | ---: |
| Plan | Index Only Scan | Bitmap Heap Scan |
| First query root buffer accesses | 648 | 644 |
| Second query root buffer accesses | 7 | 325 |
| First / second heap fetches (IOS only) | 323 / 4 | not applicable |
| VM all-visible pages after first query | 319 | 319 |

Both queries returned 1,000 rows, estimated 1,182. All three databases subsequently had 20,000 rows and matching ordered content hash `c1b2596f97706280802c63710b6f15d5`. No automatic vacuum/analysis occurred on these tables. The source/target packing difference affects both target arms equally. Buffer accesses are hits plus reads, not distinct pages or latency measurements.

The imported estimate initially overstated VM coverage, but keeping the IOS plan benefited the repeated query after reads populated VM bits. Zeroing the estimate is therefore not established as a universal fix. The executor checks actual VM bits and fetches heap tuples when needed; the catalog estimate does not bypass visibility checks.

## Physical transfer versus logical reload

A useful design question is whether to retain relallvisible when heap/VM state survives and otherwise derive it from destination state. pg_upgrade transfers heap and VM forks together; a logical restore creates new heap visibility state. “Major upgrade” alone is insufficient: dump/restore can also perform a major upgrade.

Source: [pg_upgrade transfer_single_new_db](https://github.com/postgres/postgres/blob/REL_19_RC1/src/bin/pg_upgrade/relfilenumber.c), [old-format VM conversion preserving all-visible bits](https://github.com/postgres/postgres/blob/REL_19_RC1/src/bin/pg_upgrade/file.c), [catalog definition](https://www.postgresql.org/docs/19/catalog-pg-class.html), [planner visibility fraction](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/access/table/tableam.c), [executor VM checks](https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/executor/nodeIndexonlyscan.c).

No new pg_upgrade execution is claimed here; the separate [Forge upgrade runs](../forge/README.md) tested that path. No upstream submission or accepted change is implied. Import/preservation was deliberate; see the [prior discussion and PG18 evidence](../../forge-results.md#3-pg18-imported-statistics-useful-with-two-distinct-gaps).
