# Forge evidence accompanying the episode

Source: supplied local snapshot of case `restore-readiness-01` from https://gitlab.com/postgres-ai/forge, received October 19, 2026 Pacific time. The case snapshot had no source Git commit assigned when copied. The original repository requires access; no inaccessible branch URL is presented as public evidence.

[Results and interpretation](../../forge-results.md) · [Source paths and SHA-256 manifest](provenance.json)

## Public files

- [Core plans and measurements](../../assets/forge/measurements.csv), [catalog and physical visibility state](../../assets/forge/state.csv).
- [Additional-track measurements](../../assets/forge/tracks_measurements.csv). **Its `seconds_until_autovacuum` field contains polling loop counters, not elapsed seconds.** Use the [corrected timestamp-derived times](../../assets/forge/stock-times.csv) and the [PG18](runs/stock_pg18/targets) / [PG19rc1](runs/stock_pg19/targets) restore timestamps and poll logs.
- [Extended-statistics estimate summary](runs/extstats_track/plan_summary.txt), [PG18 state and raw plans](runs/extstats_track/pg18), [PG19rc1 state and raw plans](runs/extstats_track/pg19).
- [Upgrade run 1](runs/upgrade_track/run1), [run 2](runs/upgrade_track/run2): source/destination state, plan summaries and content-hash comparisons.
- [Larger-fixture steps](runs/big_pg18/steps.csv), [raw plans and maintenance timing logs](runs/big_pg18/steps).
- Chart source: [core figures](../../assets/forge/figures.py) and [additional figures](../../assets/forge/figures_tracks.py). With Python and matplotlib installed, pass the `episodes/restore-readiness/assets/forge` directory as their sole argument to regenerate PNG and SVG files. Figure 4 consumes corrected `stock-times.csv`.

The manifest records original case-relative file paths and hashes, plus published hashes. Figure scripts have explicit presentation corrections; original measurements are retained unchanged. Numerical summaries can be inspected publicly, but this is a selected evidence package, not all source data, SQL or a complete reproduction bundle. Timings in the CSVs are not production performance forecasts.

## Scope and settings

Core: PG18.6 and PG19rc1 package builds; master 20devel at `ddd468cacf0d5d6f124c39439505ab93d31ac65b`; additional default-archive comparison on PG17.11. Host: 4 vCPU, 16 GiB RAM, Ubuntu 24.04.4, x86-64. Core settings include shared_buffers 2GB, work_mem 64MB, maintenance_work_mem 512MB, parallel query and index maintenance disabled, JIT off, checksums on. Core tables used elevated vacuum/analyze/insert thresholds of 2,000,000,000; stock-autovacuum controls removed them. Main fixture 63 MiB, three fresh restores per core arm. First-read experiments add an unindexed table and explicitly vary checkpoints/checksums. The larger fixture uses different settings and a single observation per timed step; see the report for its limitations.

These are recorded results from the supplied experiments. No claim is made that every experiment was independently rerun for this publication.
