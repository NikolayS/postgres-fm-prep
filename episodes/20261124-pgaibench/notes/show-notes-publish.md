# Can AI safely change production Postgres?

Tip: watch on YouTube. Since episode 193, the video shows charts and illustrations as we talk.

## Episode description

Nik and Kirk discuss whether AI can safely change production Postgres. Nik built PGAIBench to measure it: 10 models, 19 tasks, most of them from real production failures, and live two-node Postgres 18.7 clusters under load. Acting alone, even top models caused harm. Then we talk about AAA (Analyst, Auditor, Actor): separate roles, rehearsal on a clone, an independent reviewer, and a deterministic executor. In a retrospective, in-sample replay of the recorded changes, it would have blocked 12 of 13 harmful changes and still approved 377 of 378 safe or unclassified ones.

Thanks to David Ventimiglia (Supabase) for feedback on the post. Design partners: if your team runs Postgres at scale and wants safe AI-driven operations, or has real failure cases for the benchmark, write to contact@postgres.ai

## Links

Here are some links to things they mentioned (times in brackets are podcast times):

### Main links

- [08:01] PGAIBench v0.2 (results, method, replays): https://pgaibench.dev
- [08:01] PGAIBench and AAA: can AI safely change production Postgres? (blog post, 2026-11-23): https://postgres.ai/blog/20261123-pgaibench
- [08:01] PGAIBench source, data and prompts (Apache 2.0): https://github.com/NikolayS/pgaibench

### PGAIBench
- [11:09] v0.2 tasks and replays: https://pgaibench.dev/replay/
- [32:16] AAA and Track 2 (AI Control) results: https://pgaibench.dev/control/
- [48:52] Related work map (DBA-Bench, SWE-bench and others): https://pgaibench.dev/related-work/
- [48:52] DBA-Bench (arXiv): https://arxiv.org/abs/2607.22165
- [48:54] SWE-bench (arXiv): https://arxiv.org/abs/2310.06770

### Operations practice

- [07:14] Site Reliability Engineering, the Google SRE book: https://sre.google/sre-book/table-of-contents/
- [17:24] max_locks_per_transaction (the setting Fable raised in the 5-of-5 restart task, C18): https://www.postgresql.org/docs/18/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION
- [26:01] Systems Performance, Brendan Gregg: https://www.brendangregg.com/systems-performance-2nd-edition-book.html
- [27:49] Mirroring in PgDog: https://docs.pgdog.dev/features/mirroring/
- [27:49] Mirroring in PgCat: https://github.com/postgresml/pgcat#mirroring
- [37:14] pg_repack: https://github.com/reorg/pg_repack

### AI tools

- [33:48] Jev, a fast judgment model from TypeSafe (the example for quick risk analysis): https://typesafe.ai

### Testing on clones

- [25:04] DBLab Engine (thin clones and branching): https://github.com/postgres-ai/database-lab-engine
- [25:12] DBLab Forge (dedicated primary and standby environments): https://postgres.ai/products/dblab-forge

### Episodes we referred to

- [08:44] BUFFERS by default: https://postgres.fm/episodes/buffers-by-default
- [12:28] Index maintenance: https://postgres.fm/episodes/index-maintenance
- [27:20] Postgres 19 (plan flips): https://postgres.fm/episodes/postgres-19


## Corrections

Checked after recording against the post (https://postgres.ai/blog/20261123-pgaibench); the C18 points against the v0.2 run logs and the preregistration:

- [11:12] PGAIBench v0.2 has 19 live scenarios (14 core, 2 exploratory, 3 held-out); on air we say 18.
- [12:24] The standby did not crash: in the index-drop task its query p99 got 18.0x slower (2.91 to 52.58 ms).
- [16:11] The C18 ticket did not say "do not restart" (also in the cold open). The rule was implicit: only a restart the task cannot be done without is excused. This task needed none.
- [16:43, 17:26, 20:52] In C18 Fable restarted the standby first, as it should. Replay never paused. The harm was the unneeded restarts: client errors on both nodes, about 3 s per restart.
- [17:56] In v0.2, nine of ten models escalated 21 to 35 of 95 runs. The most, 35, was gpt-6.2-sol (37%); no model escalated 80%. There was no clear link to model strength.
- [25:28] The deterministic clone gate alone stopped 6 of 13 live harms (46.2%), a bit less than half. It halts the change; it does not send test results back to the model.
- [37:58] Two limits apply. A lock wait is active, so lock_timeout limits it. pg_repack --wait-timeout (default 60 s) waits that long for its exclusive lock, then cancels the conflicting queries, and after twice the time terminates them, unless --no-kill-backend is set. During the long copy, pg_repack's second connection is idle in transaction, so a short idle_in_transaction_session_timeout can kill the run.
- [40:45] The AAA result (13 harms down to 1) is a replay: the 408 recorded primary changes were replayed offline through the clone gate and the Auditor (in-sample). It was not a second live run. In v0.2 the Analyst and Auditor ran tool-free; revise loops are planned (Track 3).
- [50:12] True for upgrades to Postgres 17 and older, and for dump/restore or logical replication. Since Postgres 18, pg_upgrade keeps most optimizer statistics, but not extended statistics: run vacuumdb --all --analyze-in-stages --missing-stats-only, then vacuumdb --all --analyze-only.

What did you like or not like? What should we discuss next time? Let us know via a YouTube comment, on social media (https://postgres.fm/people), or by commenting on our Google doc (https://docs.google.com/document/d/1PNGSn_d0A7gTR4C0p6geQyHOTgdpitKCRvafCNnT-44/edit#heading=h.v4ncheatetql)!

~~~

Postgres FM is produced by:

- Michael Christofides, founder of pgMustard: https://pgmustard.com/
- Nikolay Samokhvalov, founder of PostgresAI: https://postgres.ai/
- Kirk Wolak, Software Architect at KiraSoft: https://www.kirasoft.com/

With credit to:

- Jessie Draws for the elephant artwork
- Intro and outro music: our own arrangement of Apple Loops from GarageBand (royalty-free under the GarageBand licence)
