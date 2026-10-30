# Existing experimental observations

These are analyses of earlier synthetic experiments, not new runs for this episode. Both VM examples created data using INSERT; neither executed pg_dump or pg_restore. They motivate the new experiment, but cannot establish the performance of a restore workflow.

## Visibility map with statistics already present

An earlier demonstration used 1,000,000 rows with random physical ordering, a 100-byte payload, a B-tree index, and ANALYZE already completed. The recorded server identity was PostgreSQL 17.10. A covered range query matched 50,000 rows. The intervention was plain VACUUM, without ANALYZE.

| Observation | Before VACUUM | After VACUUM |
| --- | ---: | ---: |
| All-visible heap pages | 0 / 17,242 | 17,242 / 17,242 |
| All-frozen heap pages | 0 | 0 |
| Natural query plan | Bitmap heap/index scan | Index-only scan |
| Root-plan shared buffer accesses | 16,491 | 143 |
| Matching rows | 50,000 | 50,000 |

The buffer totals above correct an earlier summary that added inclusive counters from parent and child EXPLAIN nodes. **Do not add those counters together.** The retained root shows 15,789 hits plus 702 reads before VACUUM, and 143 hits afterward.

A separate forced index-only-scan diagnostic performed 50,000 heap fetches before VACUUM. It was not the natural planner choice and must not be substituted for the natural baseline in a performance comparison.

The useful result is the distinction between statistics and physical visibility. All-visible coverage increased while all-frozen coverage remained zero. This does not establish a general latency multiplier; cache state and fixed measurement order confound timing.

## Smaller repeated VM example

A later synthetic fixture used 200,000 rows, deterministic random physical ordering, ANALYZE, and a plain-VACUUM treatment. The recorded server identity was PostgreSQL 17.10. Each arm recreated the fixture, discarded an initial warm-up query, and retained three measured trials.

| Observation, identical across the three trials | Baseline | VACUUM |
| --- | ---: | ---: |
| Natural root shared buffer accesses | 3,313 | 34 |
| Forced index-only-scan heap fetches | 10,000 | 0 |
| Matching rows | 10,000 | 10,000 |

That is approximately 97.4 times fewer buffer accesses for this fixture, **not 97.4 times faster**. Buffer accesses are not distinct blocks or physical disk reads. The surviving measurement tables do not include complete raw EXPLAIN output for this converted example, so a new end-to-end experiment should retain full plans.

## Missing-statistics example: incomplete evidence

A separate recorded PG17.6 example used 200,000 customers and 100,000 orders with a heavily skewed status distribution. The baseline recorded 99,000 maximum loops, 396,736 root buffer accesses, and 99,000 returned rows.

There is no recorded after-ANALYZE arm. The records have one baseline trial and insufficient-data verdicts, including a missing estimate-ratio metric. They cannot support a measured ANALYZE improvement or the previously suggested 198-fold estimate error.

## Consequence for the article

Use these examples to explain why the new experiment is necessary. Prefer fresh, complete actual-restore results for the main figures. If time runs out, retain these explicitly historical mechanism observations and omit unmeasured claims. Never fill a missing result with a prediction.
