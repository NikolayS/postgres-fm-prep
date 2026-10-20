# Postgres.FM preparation

Research and recording preparation for **“Your restore finished. Is your database ready?”** with Nikolay Samokhvalov and Kirk Wolak.

The question: what performance-relevant state is missing after a logical PostgreSQL dump/restore, what PG18 statistics transport changes, and what operators should verify before returning traffic.

## Start here

- [Kirk's study pack](study-pack.md) — a short reading guide, core distinctions and co-host questions.
- [Research report](research.md) — historical discussions, PG18 defaults, visibility maps, version boundaries and operator considerations.
- [Additional DBLab Forge experiments](experiments.md) — a bounded plan for a few hours, with priorities, decisive measurements and stop rules.
- [Existing experimental observations](existing-observations.md) — what earlier synthetic examples show and what they do not.
- [Blog outline](blog-outline.md) — the article structure and evidence still needed.

## Current status

Research was assembled on 2026-10-20 UTC. The next recording/article target is October 20, with study material needed that morning Pacific time.

The additional experiments are **proposed, not executed**. Earlier observations are clearly labelled and are not an end-to-end dump/restore benchmark. No universal query-latency speedup is claimed.

PG18 is the core demonstration target. PG19 is a short, explicitly release-candidate-qualified follow-up unless the core work is complete early.
