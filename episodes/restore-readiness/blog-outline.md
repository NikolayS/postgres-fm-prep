# Blog outline: your restore finished—now make it ready

Target: a practical article accompanying the Postgres.FM recording. This is an outline, not a finished article or a claim that the planned experiments have run.

## Opening

Start with a real, measured example from the new restore matrix: the same correct result before and after maintenance, with the plan and work performed made visible. If the experiment is unfinished, use the explicitly labelled earlier synthetic VM observation instead. Do not invent a production incident.

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

## 5. What to do after restoring

Give a short decision sequence:

1. Check restore scope, errors, versions and required objects.
2. Check optimizer data rather than relying only on last-analyze timestamps.
3. Analyze critical tables after their expression indexes/statistics objects exist.
4. Check actual VM and heap fetches for important index-only paths.
5. Choose concurrency based on the work unit and available resources.
6. Validate sustained behavior of the representative workload.

Do not prescribe VACUUM FULL. Do not imply ANALYZE fixes every bad plan or every slow query.

## 6. What remains open

PG19 release-candidate behavior and load-time COPY FREEZE fit in a short closing section. Do not let them delay the PG18 core experiment or become untested fixes presented as recommendations.

## Evidence required before publication

- Exact source/server/client identities, settings, fixture description and measurement conditions.
- Complete actual-restore results for any new claim presented as measured.
- Correct result counts and sufficient repeated fresh arms to detect inconsistent conclusions.
- Analysis figures traceable to the recorded measurements.
- Explicit separation of earlier synthetic observations, new measurements, source-derived explanations and untested proposals.

The deadline is a reason to reduce scope. If a comparison remains incomplete, omit its numerical claim and state the remaining question.
