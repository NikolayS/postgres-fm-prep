# Temporary tables (#196, working title)

[All episodes](../../README.md)

## Overview

- **Question:** Why do temporary tables become a performance cliff in Postgres, and what to use instead?
- **Hosts / guests:** Nikolay Samokhvalov and Kirk Wolak (Michael Christofides away).
- **Status:** Recorded 2026-11-10; edit in progress.
- **Recording date:** 2026-11-10.
- **Episode number:** 196.

## Discussion outline

1. Kirk's story: Oracle global temporary tables vs. Postgres temp tables; delete vs. truncate.
2. Problems in layers: primary only (0), invisible to other sessions (1), bloat of the temp table and of the catalog (2A/2B), sinval queue contention, LWLock:SInvalWrite (3).
3. Idle sessions make the cliff worse (RDS/Aurora, Black Friday scaling of app nodes without a pooler).
4. Throughput: temp table per transaction vs. ON COMMIT DELETE ROWS vs. a CTE rewrite (synthetic workload).
5. Alternatives: arrays and `select t1 from t1`, PL/pgSQL record structures, unlogged tables; ideas for Postgres hackers.

## Evidence status

DBLab Forge sinval study (PG17, PG18, PG19 RC1), public brief:
https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d. Raw data and a DOI are not public yet. Catalog bloat was discussed on air, not measured.

## Published links

To be added.
