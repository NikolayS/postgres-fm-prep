# Blog outline: your restore finished—now make it ready

Target: a practical article accompanying the Postgres.FM recording. This is an outline, not a finished article. The [Forge results](forge-results.md) now supply measured evidence and four charts.

## Opening

Start with a real, measured example from the new restore matrix: the same correct result before and after maintenance, with the plan and work performed made visible. Use the PG18 five-arm table and the matching join/VM charts. Do not invent a production incident.

## 1. Two different missing things

Explain optimizer distributions and the physical VM. Introduce relation estimates only when needed to explain why the planner and executor can see different aspects of the same table.

Figure: a four-arm table showing no maintenance, ANALYZE, VACUUM and both. Every cell should contain a measured state, not a predicted checkmark.

## 2. What a covering index still has to do

Show the actual plan and heap-fetch count. Explain all-visible versus all-frozen. Show natural plan choices; label any forced-plan diagnostic separately.

Figure: root shared-buffer accesses by arm. Use a zero-based axis. Do not sum inclusive parent/child counters. Do not label fewer buffer accesses as an equivalent latency speedup.

## 3. What PG18 changed

Show the actual dump/restore versions, archive contents and statistics state. Explain export off, import on if present, and pg_upgrade's separate default. Distinguish expression-index statistics from CREATE STATISTICS data.

Figure: default export versus statistics-enabled export, using the same source data and independently restored destinations.

## 4. Why this was not automatic

Use short, paraphrased historical excerpts with links: 2002/2003 ANALYZE debate, 2012/2015 portable-format work, January 2025 include-analyze proposal, and the eventual exporter-default decision.

Keep historical reasoning distinct from present engineering constraints. VACUUM cannot run inside a transaction block; this matters to a separate maintenance phase after a single-transaction restore. It does not make such a phase impossible.

### Documentation gap: a bounded audit

Use the [expanded 28-page audit](restore-docs-expanded.md): twenty pages omit direct statistics-gathering advice, three recommend vacuuming, and one explains VM readiness. Name Aiven, Supabase and Dalibo as positive examples; preserve linked-guidance and page-scope qualifications. Show the denominator, original/additional cohorts and audit date; do not claim a representative industry percentage. This measures guidance coverage independently of the performance experiments.

## 5. What to do after restoring

Give a short decision sequence:

1. Check restore scope, errors, versions and required objects.
2. Check optimizer data rather than relying only on last-analyze timestamps.
3. Analyze critical tables after their expression indexes/statistics objects exist.
4. Check actual VM and heap fetches for important index-only paths.
5. Choose concurrency based on the work unit and available resources.
6. Validate sustained behavior of the representative workload.

Do not prescribe VACUUM FULL. Do not imply ANALYZE fixes every bad plan or every slow query.

### Credit the progress: insert-triggered autovacuum

Explain [PG13's insert-triggered autovacuum](autovacuum-readiness.md), separate from autoanalyze. Show the enabled-autovacuum control and any maintenance completed during restore. Frame the problem as a potential asynchronous readiness gap, not guaranteed poor performance or absent automation.

## 6. What remains open

PG19rc1 read-time VM, eligible COPY FREEZE loads, and pg_upgrade now have measured comparisons. Keep them as version/path distinctions. Open work includes the single-field relallvisible control, clean-cluster large autovacuum timing and the unexplained parallel statistics-import result.

## Evidence required before publication

- Exact source/server/client identities, settings, fixture description and measurement conditions.
- Complete actual-restore results for any new claim presented as measured.
- Correct result counts and sufficient repeated fresh arms to detect inconsistent conclusions.
- Analysis figures traceable to the recorded measurements.
- Explicit separation of earlier synthetic observations, new measurements, source-derived explanations and untested proposals.

The deadline is a reason to reduce scope. If a comparison remains incomplete, omit its numerical claim and state the remaining question.

## New measured sections to weave into the article

- Use [chart 4](assets/forge/fig4_stock_autovacuum_arrival.png) to give automatic maintenance credit; explain observed completion versus a guaranteed traffic-switch barrier.
- Use [chart 3](assets/forge/fig3_first_read_cost.png) for first-query writes, preserving checkpoint/checksum conditions and query order.
- Add the [larger-fixture cost table](forge-results.md#5-larger-fixture-budget-for-readiness): readiness consumes time and WAL, and similar buffer totals may describe very different work.
- Add the extended-statistics example: PG18 expression stats arrived; CREATE STATISTICS data required ANALYZE.
- Close with the workload acceptance criteria and the practical choices, not a universal speedup claim.


## Add to the draft: first users can pay for physical preparation

Use [first-read-writes.md](first-read-writes.md) for the explanation: 26.94 MiB statement WAL on a 27.19-MiB heap, 3,449 FPIs, checksum/checkpoint controls, and the distinction between dirtied buffers and physical writes. Avoid suggesting checksum removal or inferring replica lag from unmeasured effects.

Include the [PG19rc1 single-field control](evidence/pg19-relallvisible/README.md): first-query work nearly equal, second query favors retained estimate after read-time VM updates. Frame destination-derived relallvisible as a policy question; distinguish physical pg_upgrade from logical reload.

### Explain the crash-safety distinction

Use the [Forge follow-up](first-read-writes.md#forge-follow-up-why-this-bookkeeping-needs-crash-protection): a hint can be recomputed, but a torn checksummed page needs repair; a VM bit authorizes skipping heap checks. Distinguish pg_xact from WAL. Do not claim two heap images per page, identical VACUUM/SELECT write amplification, or WAL-free COPY FREEZE. The 16-MiB COPY-ring explanation for 1,432 newly dirtied buffers is a source-based hypothesis, not a controlled result.

## Strong closing angle: the read-replica blind spot

Explain that PG19 read-time VM preparation originates outside recovery; physical standbys receive it through replay. A primary-only benchmark does not demonstrate local repair by replica reads. End with the optional question of a primary SELECT generating a standby snapshot conflict. Label both as source-derived implications, with conflict occurrence unmeasured. [Evidence and six ranked discussion angles](pg19-standby-and-episode-angles.md).

## Add depth without overloading the narrative

From the [engineer-notes synthesis](engineer-notes-synthesis.md), prioritize a short partitioned-parent warning in operations and a readiness-manifest idea in future work. Use logical-copy benchmark fidelity as an optional closing question. Do not import the PDF's absolute claims about IOS, worker timing, synchronized freezing, or universal physical-copy recommendations.
