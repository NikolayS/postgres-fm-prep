# Episode 197: figures for the post-episode blog post

These Forge PG19 study results are not in the video, or are only partly in it. The video shows a card only when it is easy to understand in a few seconds at that point in the talk. The results below need more explanation than the conversation gives, so they go to the blog post.

Source study: "Postgres 19 for people who run it: PostgreSQL 19 RC2 vs 18.7" (brief v3.1): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c

Provenance: every number below was recomputed from raw run output (logs, pgbench and psql output, EXPLAIN JSON, git objects). Brief prose, data.json and agent notes were not used as evidence. Path keys:
- C = forge-wt-pg19-brief/cases/pg19-vs-18-01 (Forge case dir)
- S = pg19-study
- T = forge-wt-pg19-t1/cases/pg19-vs-18-01/t1
- X = the study session's scratch copy of the plan runs

The audit scripts are f01.py, f06.py, perf.py, plans.py and f10.py. They were run on 2026-11-18 and are kept with the episode work files.

## 1. Upgrade rehearsals: when `pg_upgrade --check` says OK and the upgrade still fails

- **Figure:** a stacked bar per source version (14, 15, 16, 17, 18) of rehearsal outcomes. The outcomes are: clean, caught by --check, check passed then upgrade failed, 19 did not start, extension step failed, and clone refused. A second figure is a short table of the 22 "check passed, then failed" cases.
- **Numbers:**
  - 687 rehearsals into 19 RC2, each on a fresh copy-on-write clone. 6 more were killed on purpose, and 99 did not apply; 792 records in total.
  - 89 rehearsals (22 cases) passed `pg_upgrade --check` and then failed.
  - In 31 rehearsals (11 cases), 19 did not start after the upgrade.
  - Outcomes per source version (clean / caught / clone refused / check passed then failed / no start / extension step):
    - 14: 68/36/4/16/10/9 of 143
    - 15: 66/34/5/25/9/13 of 152
    - 16: 66/28/6/19/6/17 of 142
    - 17: 65/22/6/16/3/18 of 130
    - 18: 61/22/7/13/3/14 of 120
- **Why it is interesting:** `--check` is the step most people trust. In this study, 89 rehearsals passed it and then failed in the upgrade itself. That makes a strong case for a full rehearsal on a clone, which ties to the talk about testing on clones.
- **Caveats:**
  - These are setups built to break the upgrade, not a failure rate of real systems.
  - The "clean" count includes 23 cells that were reclassified after the run. The reclassification used documented schema-diff rules (T/expected-diffs.txt, T/summarize.ts); the stored first-pass result was 303 clean, and after the rules it is 326.
  - Cases are grouped by setting or object, placement and first error. 4 duplicate known-fixture cases are merged.
- **Raw data:**
  - T/records/cells/*/{cell.json,check.out,upgrade.out}: 792 records, 693 check logs, 523 upgrade logs.
  - Host pg19-t1, run 2026-11-16 08:50-09:39 UTC. The harness is T/run-cell.ts and T/run-batch.ts.
  - The logs contain real pg_upgrade output and the clone paths /t1pool/c-<id>.

## 2. Plan changes from 18.7 to 19 RC2, and their causes

- **Figure:** a donut of 220 stable query templates: 83 changed plan, and 61 of them trace to one planner commit. A second figure is a bar chart of causes.
- **Numbers:**
  - 4,273 benchmark queries from 263 templates. 220 templates were stable on 18.7, which means the same plan in 3 runs.
  - 83 of 220 templates (1,199 of 3,785 queries) changed plan.
  - The tie-break commit explains 61 templates (757 queries). A 19 build without that commit restores the 18.7 plan for them.
  - The parallel-query switch leaves 25 templates (179 queries) untraced.
  - Smaller causes: semijoin 4 (115 queries), other 4 (8), eager aggregation 2 (32), eager-aggregation pattern 1 (20), NOT IN 1 (50), LEFT JOIN 1 (38).
  - 488 queries were unstable on 18.7 alone.
- **Why it is interesting:** it puts a number on "plan flips", which the hosts discuss. Most of the changes come from one small commit, and a build without the commit proves this. The method (diff your plans on a clone before you upgrade) is something readers can repeat.
- **Caveats:**
  - Causes use first-hit attribution.
  - The semijoin and eager-aggregation pattern rows rest partly on rules written after the data was seen (70 of 115 semijoin queries). Show them as weaker evidence than the switch and revert results.
  - A template with several causes counts in each.
- **Raw data:**
  - X/t2-audit/plans/{A,A2,A3,B,D1}/plans/*.json
  - X/t2-revert/plans-pkg-rc2-rev.tgz
  - X/t2-parallel/plans/{AS,AS2,AS3,BS}/plans/*.json
  - 42,730 EXPLAIN JSON documents in total. The signature whitelist was reimplemented from signature.ts; the attribution rules are in t2/attribute.ts.

## 3. Smaller results (video shows a simplified version, or nothing)

| Result | Numbers | Why it is interesting | Raw data |
|---|---|---|---|
| lz4 TOAST disk cost | +11.3% total relation size (2,043,338,752 to 2,274,082,816 bytes), next to 107 s to 44 s inserts | The trade-off behind the new default: faster, but larger | C/runs/*-D04-{18,19}tc.avoff-jsonb-a2/d04.txt |
| REPACK CONCURRENTLY lock wait, full curve | 9 points from 1,013 to 65,996 rows/s; 0.02 s to 85.72 s | Where "concurrently" stops being cheap, as a function of write rate and batch size | X/w3g-1/pull/w3g/res/*-{1,2,3}/{a-writers,a-sampler}.txt (derived per-run files; the first point has 2 valid runs, and the sampler resolution is 20 ms) |
| Plan advice costs | -11.4% vs modules off, -13.9% vs loaded and idle (trivial query); stash lookup +2.4 to +2.8 us; six-way join planning 0.47 to 0.28 ms with advice | Shows both the overhead and the planning-time win | S/evidence/functional/plan-advice-study/pa-archive.tgz: p01-*, p02-* pgbench and pg_stat_statements outputs |
| JIT, all 22 TPC-H queries | Geomean ratio 0.932 (-6.8%) and 0.982 (-1.8%) for the two comparisons; q1 +17.7%, q19 -37% | The default change helps most short analytic queries and hurts the longest | C/runs/*-{B31,B32,B33}-*-sf10-a{1,2,3}/q{1..22}.out (198 timings) |
| VACUUM PARALLEL with cost delay | 18 at limit 200: 41.5 s; 19 at limit 200: 113.6 s; 19 at limit 1000: 31.8 s | In 19, parallel workers share the cost limit, so the old limit makes parallel vacuum slower | C/runs/*-B13-18tc.avoff-vt-a*/progress.tsv; V/runs/*-XB13-19tc.avoff.tcdt-l{200,1000}-x*/progress.tsv |
| NOTIFY on 19.0 (retest) | 915/s to 19,686/s with pgbench, 1,000 listeners | Confirms the RC2 result on the final release | X/w3n-1/pull/w3n/res/runs/A-{18,19}-P2-L1000-c4-r{1,2,3}-on.out |
| Autovacuum weights | 300M-age table with default weights: 150.9 s; with weight 10: 12.9 s | Shows how to tune the new prioritization | A/runs/*-{V3A3-19,V3A3-19w10}-a*/{server-log.txt,t0} |

Not ready for the blog: the EXPLAIN ANALYZE timing comparison. Its noise threshold on that host is 46.1%, so it can show only very large changes.
