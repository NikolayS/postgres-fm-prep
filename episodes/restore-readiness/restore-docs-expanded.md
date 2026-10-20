# Restore guidance: expanded audit of 28 pages

**Podcast edition · October 20, 2026 UTC.** Twenty-eight distinct logical restore/import pages from **21 publishers**: the original twelve, eight more provider pages and eight practical posts/training tutorials. [CSV](restore-docs-expanded.csv) · [JSON, definitions and source hashes](restore-docs-expanded.json) · [Original twelve-page audit](restore-docs-audit.md).

![Expanded audit: 8 of 28 recommend analysis, 3 recommend vacuuming, and 1 explains visibility-map readiness. This is a selected page sample, not a representative survey.](assets/restore-docs-expanded-summary.png)

[Download the infographic](assets/restore-docs-expanded-summary.png) · [Rendering source](assets/render_docs_expanded.py).

## Numbers we can use on air

| Direct coverage in the logical-restore workflow | Original 12 | Additional provider pages (8) | Additional posts/tutorials (8) | Combined (28) |
| --- | --- | --- | --- | --- |
| ANALYZE / gather optimizer statistics | 4 | 2 | 2 | **8/28 (28.6%)** |
| Optimizer-statistics explanation or transport | 4 | 2 | 2 | **8/28 (28.6%)** |
| VACUUM after restore, including VACUUM ANALYZE as an alternative | 0 | 2 | 1 | **3/28 (10.7%)** |
| Physical VM / index-only-scan readiness explanation | 0 | 0 | 1 | **1/28 (3.6%)** |

Thus **20/28 (71.4%) lack direct statistics-gathering advice**, **25/28 (89.3%) lack a direct post-restore VACUUM recommendation**, and **27/28 (96.4%) lack a physical VM-readiness explanation**. These are counts of selected pages, not percentages of providers, production systems, readers or the entire internet. An omitted recommendation does not establish a broken restore or prove that every workload needs manual vacuuming.

**Suggested podcast wording:**

> We read 28 selected restore and import guides, posts and tutorials. Twenty did not directly tell readers to gather optimizer statistics. Only three recommended vacuuming after restore, and one explained visibility-map readiness. There are good counterexamples; this is a documentation gap, not evidence that PostgreSQL has no automatic maintenance.

## Name the counterexamples

- **Aiven** recommends analysis after migration and offers VACUUM ANALYZE as an alternative in its performance troubleshooting. [Full guide](https://aiven.io/docs/products/postgresql/howto/migrate-pg-dump-restore).
- **Supabase's external migration guide** explicitly includes VACUUM VERBOSE ANALYZE and says to vacuum even when transporting PG18 statistics. It does not explain the physical VM mechanism. Its captured text uses `--with-statistics`; the released PG18 flag is `--statistics`, so do not copy that spelling into the episode's commands. This flag observation does not negate the positive maintenance classification. [Guide](https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres); [released PG18 flag](https://www.postgresql.org/docs/18/app-pgdump.html).
- **Dalibo's French training chapter** explains post-import analysis, vacuuming, hint bits, visibility maps and index-only scans. It is the VM-positive page in this sample. [Chapter, statistics and maintenance after import](https://public.dalibo.com/exports/formation/manuels/modules/i1/i1.handout.html).
- **Linuxize** includes analysis in its test-restore workflow. [Article](https://linuxize.com/post/postgresql-backup-with-pg-dump-and-pg-restore/).
- **PostgreSQL's two references, DigitalOcean's migration guide and TigerData** remain positive analysis examples from the original sample. Their exact links appear below.

Two different Supabase pages have different coverage; the same is true of DigitalOcean's provider guide and older community tutorial. This alone rules out “every provider misses it.”

## Fairness: automatic maintenance and linked advice

**PG13 improved the underlying behavior.** Inserts can trigger autovacuum, helping build visibility coverage; autoanalyze can also supply statistics. Some tables may be maintained before restore finishes. What is missing from pg_restore is an explicit wait for affected relations to reach the desired maintenance state. Slow plans or extra heap fetches before catch-up are possible, not inevitable. [PG13 release notes](https://www.postgresql.org/docs/13/release-13.html); [autovacuum fairness and experiment controls](autovacuum-readiness.md).

The metric is **direct-page guidance**. Azure's linked companion recommends analysis; pgAdmin, Neon, EDB and others link upstream. We have not exhaustively traversed links for all 28 pages, so do not extrapolate the original audit's named link sensitivity calculation to this expanded denominator. Linked guidance is recorded per source when observed. [Azure companion](https://learn.microsoft.com/en-us/azure/postgresql/troubleshoot/how-to-pgdump-restore); [original sensitivity checks](restore-docs-audit.md#links-change-the-interpretation).

**Affiliated comparator, outside the 28:** PostgresAI's own [How to use pg_restore](https://postgres.ai/docs/postgres-howtos/database-administration/backup-recovery/how-to-use-pg-restore) explicitly recommends gathering statistics and building visibility maps in its Postscript. Its affiliation and topic-specific selection are disclosed; it is not used to improve our comparison percentage. The second, user-supplied AWS guide also remains [supplementary](restore-docs-audit.md#follow-up-a-second-aws-restore-guide), outside the original and expanded denominators.

## Method, scope and exclusions

- **Purposeful expansion:** retained the original twelve without changing their labels, then sought eight additional provider pages and eight practical posts/tutorials by publisher and restore relevance, including positive findings. No traffic statistics were collected. Several publishers contribute multiple distinct pages; they are not independent samples of author opinion.
- **Avoid duplicate copies:** an apparent Redrock/PostgreSQLTutorial/Neon overlap was excluded. Searches for a dedicated pganalyze restore tutorial did not produce a suitable page; Dalibo's original training chapter was substituted and is a strong positive example. An inaccessible legacy Fly page was replaced by its accessible import CLI reference, whose narrow scope is explicit.
- **Varied purpose and age:** the sample mixes references, provider migration procedures, beginner posts and training. DigitalOcean's community tutorial dates to 2013; CYBERTEC's upgrade article dates to 2019. Do not treat every page as a current production runbook. A broader page denominator improves coverage, not statistical representativeness.
- **Consistent coding:** A = post-logical-restore analysis action; S = optimizer statistics in that workflow; V = post-restore vacuum action, including an explicit alternative; M = physical VM or index-only readiness explanation. CYBERTEC discusses statistics for pg_upgrade, so it is not credited as logical-restore statistics guidance. Incidental keywords, virtual-machine “VM”, cumulative counters, pre-dump vacuuming and analyze-only vacuumdb do not count for V/M.
- **Full content, not snippets:** complete article text and relevant tabs/code were inspected. DigitalOcean's community article was decoded from embedded page data. Linuxize rejected a direct HTTP request but its full article was available through a web extraction; the JSON records that limitation and no successful raw HTML status is invented. Other new pages have raw HTML/text capture hashes.
- **Provenance:** each source has full URL, retrieval time, section, classifications, notes and available hashes in JSON/CSV. Raw copyrighted articles are not republished; hashes identify captured bytes, not public immutable archives. Recheck live sources before later reuse. This audit measures guidance, not provider automation or runtime performance, and does not certify every command in the articles.

## Detailed register: every inspected URL

A/S/V/M are defined above. The following sections include all 28 sources and the context needed to interpret both positive and negative classifications.

### 1. PostgreSQL — PostgreSQL 18 — SQL Dump

[https://www.postgresql.org/docs/18/backup-dump.html](https://www.postgresql.org/docs/18/backup-dump.html)

- **A / S / V / M:** Yes / Yes / No / No.
- **Section:** Restoring the Dump.
- **Finding:** Recommends ANALYZE and explains optimizer statistics; links to maintenance and bulk-loading guidance.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:43.672433+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 2. PostgreSQL — PostgreSQL 18 — pg_restore

[https://www.postgresql.org/docs/18/app-pgrestore.html](https://www.postgresql.org/docs/18/app-pgrestore.html)

- **A / S / V / M:** Yes / Yes / No / No.
- **Section:** Notes.
- **Finding:** Conditional advice; also documents importing statistics already in the archive.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:43.920276+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 3. Neon — Neon — PostgreSQL Restore Database

[https://neon.com/postgresql/administration/restore-database](https://neon.com/postgresql/administration/restore-database)

- **A / S / V / M:** No / No / No / No.
- **Section:** PostgreSQL Restore Database example.
- **Finding:** Example ends with table listing and exiting psql; no direct statistics or VM readiness guidance.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:43.891244+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 4. Supabase — Supabase — Backup and Restore using the CLI

[https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

- **A / S / V / M:** No / No / No / No.
- **Section:** Restore backup using CLI / Special considerations.
- **Finding:** Covers restore steps and platform-specific considerations; none of the four audited topics appears in the page text.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:45.346534+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 5. TigerData — TigerData — Migrate with downtime

[https://www.tigerdata.com/docs/migrate/migrate-with-downtime](https://www.tigerdata.com/docs/migrate/migrate-with-downtime)

- **A / S / V / M:** Yes / Yes / No / No.
- **Section:** Validate your Tiger Cloud service and restart your app.
- **Finding:** All four source tabs include ANALYZE before verification and application restart.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:44.849585+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 6. AWS — AWS RDS — Importing data from PostgreSQL on an Amazon EC2 instance

[https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Procedural.Importing.EC2.html](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Procedural.Importing.EC2.html)

- **A / S / V / M:** No / No / No / No.
- **Section:** Import procedure.
- **Finding:** Covers dump, target creation and restore; no direct post-restore statistics or VM readiness guidance.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:43.385042+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 7. Microsoft Azure — Azure — Migrate using dump and restore

[https://learn.microsoft.com/en-us/azure/postgresql/migrate/how-to-migrate-using-dump-and-restore](https://learn.microsoft.com/en-us/azure/postgresql/migrate/how-to-migrate-using-dump-and-restore)

- **A / S / V / M:** No / No / No / No.
- **Section:** Restore / Next steps.
- **Finding:** Main page lacks these topics; explicitly linked best-practices page DOES recommend analysis after restore. See linked-guidance discussion.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:43.988935+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 8. Google Cloud — Google Cloud SQL — Import and export SQL dump files

[https://docs.cloud.google.com/sql/docs/postgres/import-export/import-export-sql](https://docs.cloud.google.com/sql/docs/postgres/import-export/import-export-sql)

- **A / S / V / M:** No / No / No / No.
- **Section:** Import data from a SQL dump file.
- **Finding:** Import workflow and permissions; no direct post-import statistics or VM readiness guidance.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:45.163908+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 9. DigitalOcean — DigitalOcean — Migrate a PostgreSQL database

[https://docs.digitalocean.com/products/databases/postgresql/how-to/migrate/](https://docs.digitalocean.com/products/databases/postgresql/how-to/migrate/)

- **A / S / V / M:** Yes / Yes / No / No.
- **Section:** After Importing.
- **Finding:** Recommends ANALYZE for query planning. VACUUM occurs in a linked wiki title, not a direct instruction to vacuum after restore.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:44.428497+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 10. Heroku — Heroku — Heroku Postgres Backups

[https://devcenter.heroku.com/articles/heroku-postgres-backups](https://devcenter.heroku.com/articles/heroku-postgres-backups)

- **A / S / V / M:** No / No / No / No.
- **Section:** Restore a Backup / Visibility.
- **Finding:** Visibility section concerns backup connections and credentials, not the visibility map. No direct statistics or VM readiness guidance.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:44.670008+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 11. pgAdmin — pgAdmin 4 9.18 — Restore Dialog

[https://www.pgadmin.org/docs/pgadmin4/9.18/restore_dialog.html](https://www.pgadmin.org/docs/pgadmin4/9.18/restore_dialog.html)

- **A / S / V / M:** No / No / No / No.
- **Section:** Restore Dialog.
- **Finding:** Documents UI controls and success notification; links to upstream pg_dump/pg_restore. No direct maintenance/readiness guidance.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:43.767902+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 12. Crunchy Data — Crunchy Bridge — From Heroku Postgres

[https://docs.crunchybridge.com/migrate/heroku_dump_restore](https://docs.crunchybridge.com/migrate/heroku_dump_restore)

- **A / S / V / M:** No / No / No / No.
- **Section:** Manual migration / Update DATABASE_URL and exit maintenance mode.
- **Finding:** Manual logical migration includes ownership and cutover; advises staging validation but no direct statistics or VM readiness step. Physical-backup section excluded.
- **Scope:** Core reference or provider/tool guide; see note
- **Linked guidance:** See the original audit for link qualifications.
- **Retrieved:** 2026-10-20T03:42:43.878323+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 13. Neon — Migrate data from Postgres with pg_dump and pg_restore - Neon Docs

[https://neon.com/docs/import/migrate-from-postgres](https://neon.com/docs/import/migrate-from-postgres)

- **A / S / V / M:** No / No / No / No.
- **Section:** Restore data to Neon with pg_restore; Post-migration steps; Advanced pg_dump and pg_restore options.
- **Finding:** Provides dump/restore commands, then directs application reconnection and testing. No direct optimizer-statistics, ANALYZE, VACUUM or physical visibility-map guidance in the captured page.
- **Scope:** This is the Neon command-reference documentation, distinct from the earlier Neon PostgreSQL tutorial.
- **Linked guidance:** Links PostgreSQL pg_dump and pg_restore references, plus migration/upgrade guides; linked content is not counted as direct guidance.
- **Retrieved:** 2026-10-20T03:51:59.332891+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 14. Supabase — Migrate from Postgres to Supabase | Supabase Docs

[https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres](https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres)

- **A / S / V / M:** Yes / Yes / Yes / No.
- **Section:** Method 2: Manual dump/restore / Step 5: Post-Migration tasks / Update statistics (important).
- **Finding:** Immediately after restore, gives VACUUM VERBOSE ANALYZE. Notes PostgreSQL 18 pg_dump --with-statistics and separately recommends VACUUM for optimal performance. Does not explain physical visibility-map bits or index-only-scan readiness.
- **Scope:** Score the manual dump/restore method. VM elsewhere on this page means a migration virtual machine, not visibility map.
- **Linked guidance:** Also links a migration notebook and PostgreSQL logical replication restrictions; these were not counted as instructions on this page.
- **Retrieved:** 2026-10-20T03:52:02.241805+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 15. Aiven — Migrate PostgreSQL® databases to Aiven using pg_dump and pg_restore | Aiven docs

[https://aiven.io/docs/products/postgresql/howto/migrate-pg-dump-restore](https://aiven.io/docs/products/postgresql/howto/migrate-pg-dump-restore)

- **A / S / V / M:** Yes / Yes / Yes / No.
- **Section:** Perform the migration; Poor performance after migration.
- **Finding:** Migration procedure explicitly runs ANALYZE on newly loaded data. Troubleshooting recommends ANALYZE or VACUUM ANALYZE for the entire database after pg_restore, explaining that missing current statistics can produce poor plans and performance. No physical VM explanation.
- **Scope:** V=true because VACUUM ANALYZE is an explicitly offered postrestore action, even though ANALYZE alone is also offered. Navigation phrase Query and analyze data is not evidence.
- **Linked guidance:** Links PostgreSQL ANALYZE documentation and pg_restore options; direct guidance itself supports positive labels.
- **Retrieved:** 2026-10-20T03:52:03.549830+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 16. Render — Render Postgres Recovery and Backups – Render Docs

[https://render.com/docs/postgresql-backups](https://render.com/docs/postgresql-backups)

- **A / S / V / M:** No / No / No / No.
- **Section:** Logical backups; Restoring from a logical backup; Exporting with pg_dump; Restoring from a pg_dump export.
- **Finding:** Logical sections give export download/extraction, pg_restore or psql commands and overwrite precautions. No postrestore maintenance/statistics/VM explanation appears in the full captured page.
- **Scope:** Mixed PITR and logical-backup page; labels concern logical restore sections. Render command blocks occur after footer in extracted text but were read and included.
- **Linked guidance:** Links a separate backup-to-S3 guide; this is not direct postrestore guidance.
- **Retrieved:** 2026-10-20T03:52:04.692950+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 17. Railway — Back Up and Restore Postgres | Railway Guides

[https://docs.railway.com/guides/postgres-backups-restores](https://docs.railway.com/guides/postgres-backups-restores)

- **A / S / V / M:** No / No / No / No.
- **Section:** Take a logical backup with pg_dump; Run a restore drill; Automate offsite dumps with a cron service.
- **Finding:** Gives custom-format dump and scratch database pg_restore drill, then checks pg_stat_user_tables.n_live_tup and spot-checks rows before dropping scratch database. No explicit postrestore ANALYZE/VACUUM or optimizer-statistics/VM explanation.
- **Scope:** Mixed volume/PITR/logical page. The n_live_tup query is a cumulative-statistics estimate, not an optimizer-statistics discussion and not proof of exact row equality.
- **Linked guidance:** Next steps link volume backup/PITR/PostgreSQL/cron references. They are not counted as direct logical-restore guidance.
- **Retrieved:** 2026-10-20T03:52:07.187171+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 18. EDB — EDB Docs - Importing an existing Postgres database

[https://www.enterprisedb.com/docs/edb-postgres-ai/cloud-service/managing_your_cluster/migration/cold_migration/](https://www.enterprisedb.com/docs/edb-postgres-ai/cloud-service/managing_your_cluster/migration/cold_migration/)

- **A / S / V / M:** No / No / No / No.
- **Section:** Downtime considerations; Export existing roles; Import the roles; Export a database; Import a database.
- **Finding:** Explains cold logical migration with roles, custom pg_dump archive and pg_restore; covers restart after restore errors. No direct maintenance, optimizer-statistics or physical VM guidance.
- **Scope:** Hosted Cloud Service notice says no new customers and eventual removal of associated docs; Your Cloud Account remains. Page reports modified 2024-10-17.
- **Linked guidance:** Links pg_restore documentation for options, not a local postrestore-maintenance section.
- **Retrieved:** 2026-10-20T03:52:13.597932+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 19. Crunchy Data — Data Loading in Postgres for Newbies | Crunchy Data Blog

[https://www.crunchydata.com/blog/data-loading-in-postgres-for-newbies](https://www.crunchydata.com/blog/data-loading-in-postgres-for-newbies)

- **A / S / V / M:** No / No / No / No.
- **Section:** Dump and Restore; Load It!.
- **Finding:** The dump/restore section shows pg_dump to SQL and psql restoration. Whole article also covers CSV/JSON, GUIs, FDWs and generated test data. No explicit postrestore maintenance/statistics/VM discussion.
- **Scope:** Broad beginner test-data-loading article dated 2022-11-01, not a dedicated operational recovery checklist. Distinct from earlier Crunchy Bridge how-to. Example connection strings are omitted from this audit.
- **Linked guidance:** Dump and Restore links PostgreSQL documentation for configuration options; following those links is outside direct-page labels.
- **Retrieved:** 2026-10-20T03:52:15.166695+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 20. Fly.io — fly postgres import - Fly.io

[https://docs.fly.io/flyctl/cmd/fly_postgres_import](https://docs.fly.io/flyctl/cmd/fly_postgres_import)

- **A / S / V / M:** No / No / No / No.
- **Section:** Usage; Options; Global Options; See Also.
- **Finding:** CLI reference describes importing from a source Postgres URI and documents restore-related flags including clean, create, data-only and no-owner. No postrestore maintenance, planner statistics or visibility-map explanation.
- **Scope:** Narrow CLI reference, not an end-to-end migration tutorial; classify separately when comparing breadth. Requested legacy URL redirects to this exact canonical URL. --vm-size means virtual machine, not visibility map.
- **Linked guidance:** See Also links unmanaged Postgres cluster commands. No direct maintenance link in the article body.
- **Retrieved:** 2026-10-20T03:53:41.872654+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 21. CYBERTEC — Upgrade to a new PostgreSQL major version

[https://www.cybertec-postgresql.com/en/a-primer-on-postgresql-upgrade-methods/](https://www.cybertec-postgresql.com/en/a-primer-on-postgresql-upgrade-methods/)

- **A / S / V / M:** No / No / No / No.
- **Section:** Logical Dump / Restore; Binary In-Place Upgrade.
- **Finding:** The logical dump/restore section lacks these readiness steps. The article DOES discuss statistics and ANALYZE for pg_upgrade; this is outside the logical-restore metric. Do not claim the whole article omits statistics.
- **Scope:** 2019-09
- **Linked guidance:** Links to upstream pg_upgrade documentation; do not treat that as direct logical-restore guidance.
- **Retrieved:** 2026-10-20T03:53:17.131732+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 22. Crunchy Data — Introduction to Postgres Backups

[https://www.crunchydata.com/blog/introduction-to-postgres-backups](https://www.crunchydata.com/blog/introduction-to-postgres-backups)

- **A / S / V / M:** No / No / No / No.
- **Section:** pg_dump/pg_restore; pg_dump as a corruption check.
- **Finding:** Logical section gives psql restore and corruption-check guidance; no four readiness topics. Physical backup/PITR sections excluded from logical-restore coding.
- **Scope:** 2023-03-09
- **Linked guidance:** Physical restore section links official documentation; no direct post-logical-restore maintenance instructions.
- **Retrieved:** 2026-10-20T03:53:14.529478+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 23. EDB — A Complete Guide to PostgreSQL Backup & Recovery

[https://www.enterprisedb.com/postgresql-database-backup-recovery-what-works-wal-pitr?lang=en](https://www.enterprisedb.com/postgresql-database-backup-recovery-what-works-wal-pitr?lang=en)

- **A / S / V / M:** No / No / No / No.
- **Section:** Restoring the backup from pg_dump backup (pg_restore); Backups and the buts that can help plan.
- **Finding:** Explains logical restore, rebuilding indexes, test restores and recovery planning; no four readiness topics. Navigation analytics/statistics text is unrelated.
- **Scope:** 2021-10-06
- **Linked guidance:** Links PostgreSQL 10 pg_dump/pg_basebackup and replication documentation; linked destinations are not direct article instructions.
- **Retrieved:** 2026-10-20T03:53:16.338223+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 24. Percona — PostgreSQL Upgrade Using pg_dump/pg_restore: A Step-by-Step Guide

[https://www.percona.com/blog/postgresql-upgrade-using-pg_dump-pg_restore/](https://www.percona.com/blog/postgresql-upgrade-using-pg_dump-pg_restore/)

- **A / S / V / M:** No / No / No / No.
- **Section:** Step 3: Migrating Table Data (pg_dump -a); Wrapping up; FAQ.
- **Finding:** Guide covers globals/schema/data migration, parallelism and selective restore; none of four readiness topics in article.
- **Scope:** 2025-02-27 (original March 2019)
- **Linked guidance:** Part of an upgrade series; companion articles are outside page-level classification.
- **Retrieved:** 2026-10-20T03:53:19.422566+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 25. Severalnines — PostgreSQL Backups: What is pg_dumpall?

[https://severalnines.com/blog/postgresql-backups-what-is-pg_dumpall/](https://severalnines.com/blog/postgresql-backups-what-is-pg_dumpall/)

- **A / S / V / M:** No / No / No / No.
- **Section:** Restoring the PostgreSQL database dumps; Conclusion.
- **Finding:** Gives psql/pg_restore options and recommends testing recovery; no four readiness topics. This audit does not validate every command in the tutorial.
- **Scope:** 2020-04-02; updated 2024-02-21
- **Linked guidance:** No directly credited linked maintenance instructions.
- **Retrieved:** 2026-10-20T03:53:15.200391+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 26. Linuxize — PostgreSQL Backup and Restore with pg_dump and pg_restore

[https://linuxize.com/post/postgresql-backup-with-pg-dump-and-pg-restore/](https://linuxize.com/post/postgresql-backup-with-pg-dump-and-pg-restore/)

- **A / S / V / M:** Yes / Yes / No / No.
- **Section:** Verifying a Backup with a Test Restore.
- **Finding:** Explicit post-restore ANALYZE command before checking counts, critical queries and extensions. No VACUUM or VM discussion.
- **Scope:** 2026-06-21
- **Linked guidance:** Full article retrieved by web tool; direct urllib fetch returned 403. Web extraction captured with hash; no successful raw HTML capture claimed.
- **Retrieved:** 2026-10-20T03:53:48.769203+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 27. DigitalOcean — How To Backup PostgreSQL Databases on an Ubuntu VPS

[https://www.digitalocean.com/community/tutorials/how-to-backup-postgresql-databases-on-an-ubuntu-vps](https://www.digitalocean.com/community/tutorials/how-to-backup-postgresql-databases-on-an-ubuntu-vps)

- **A / S / V / M:** No / No / No / No.
- **Section:** How to Restore Data Dumps from pg_dump with PostgreSQL; Dealing with Restoration Errors; Conclusion.
- **Finding:** Covers creating empty database, ownership, error handling and restore tests; none of four readiness topics. Historical PG9.1 tutorial.
- **Scope:** 2013-08-28
- **Linked guidance:** Article HTML is embedded in Next.js script data; decoded article body used. Initial visible-text extraction contains navigation only and must not be treated as evidence of absence.
- **Retrieved:** 2026-10-20T03:53:14.809518+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

### 28. Dalibo — Sauvegarde et restauration

[https://public.dalibo.com/exports/formation/manuels/modules/i1/i1.handout.html](https://public.dalibo.com/exports/formation/manuels/modules/i1/i1.handout.html)

- **A / S / V / M:** Yes / Yes / Yes / Yes.
- **Section:** Restauration d’une sauvegarde logique → Statistiques et maintenance après import.
- **Finding:** Explicit post-restore ANALYZE, VACUUM/VACUUM ANALYZE, hint bits, visibility map and index-only scans. Discusses PG18 opt-in statistics, autovacuum timing and later FREEZE. Positive counterexample. French training tutorial.
- **Scope:** 2026-09-10
- **Linked guidance:** Substitutes for pganalyze: targeted searches did not locate a dedicated logical-restore tutorial. Redrock candidate excluded as suspected overlap with PostgreSQLTutorial/Neon; Dalibo is distinct original training material.
- **Retrieved:** 2026-10-20T03:53:27.812215+00:00. Source hashes are in the [JSON](restore-docs-expanded.json).

## Episode follow-through

Use these results to motivate a practical readiness checklist, then show measured behavior. The [opt-in maintenance proposal](maintenance-option.md) separates fresh statistics, VM maintenance and post-commit semantics. The [experiment plan](experiments.md) includes normal-autovacuum behavior and distinguishes a changed plan from an unchanged Index Only Scan with many heap fetches. Neither outcome should be assumed before measurement.
