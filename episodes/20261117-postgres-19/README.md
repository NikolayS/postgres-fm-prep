# Postgres 19 for people who run it

[All episodes](../../README.md)

## Overview

- **Question:** What stops an upgrade from 18 to 19, what do you gain, and what did we measure on 18.7 against 19 RC2?
- **Hosts / guests:** Michael Christofides and Nikolay Samokhvalov, with Kirk Wolak.
- **Status:** Recorded 2026-11-17 (Zoom, about 58 min on air). Release text drafts in `notes/`, `thumbs/` and `social/`; edit not started.
- **Study material deadline:** To be confirmed, with time zone.
- **Recording date:** 2026-11-17, 10:13 PT (18:13 UTC).
- **Episode number:** 197 (confirmed 2026-11-17).

## Materials

| Document | Purpose |
| --- | --- |
| [`recording-notes.md`](recording-notes.md) | Angle, three leads with numbers to say, quick hits, demos, "do not say" list, show-notes links, open questions |
| [`notes/notes.md`](notes/notes.md) | Show notes draft: description, 20 links with times, link check |
| [`notes/youtube-description.txt`](notes/youtube-description.txt) | YouTube description draft with chapters |
| [`notes/summary.txt`](notes/summary.txt) | Transistor summary draft |
| [`notes/fact-check.md`](notes/fact-check.md) | Claims made on air, checked against primary sources |
| [`thumbs/titles.md`](thumbs/titles.md) | Title options, thumbnail concepts, cold-open candidates |
| [`social/x-thread.md`](social/x-thread.md) | X thread and LinkedIn drafts with a number check |

## Discussion outline

Planned: the three leads of the recording notes. Recorded (agreed in the pre-show): why 19 came in November, then a round of favorite features, then warnings before the upgrade.

1. The delay: security fixes, AI bug reports, the reverts.
2. Favorites: REPACK (CONCURRENTLY), LISTEN/NOTIFY with many listeners, autovacuum prioritization, pg_plan_advice, new defaults, WAIT FOR LSN, EXPLAIN ANALYZE timing, vacuumdb, extended statistics, pgbench.
3. Warnings: removed settings and `pg_upgrade --check`, logical replication of sequences, how to test the upgrade, plan flips.

## Evidence status

Study brief, version 2.2 (PGDG 18.7 against 19 RC2; behavior on small test hosts, speed on dedicated hosts, 3 trials per version where stated): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c. Not a result for 19.0. Raw data is not public.

## Sources and attribution

Credits and links are in the recording notes, beside each lead: shihao zhong (`pg_upgrade --check` gap), Heikki Linnakangas (double `max_locks_per_transaction`), Radim Marek (REPACK final lock), Joel Jacobson (NOTIFY).

## Open questions

See the last section of the recording notes.

## Published links

To be added.
