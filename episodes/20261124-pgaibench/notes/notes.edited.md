# Can AI safely change production Postgres?

Postgres.FM episode 198 (number to confirm). Hosts: Nik and Kirk.

**DRAFT, 2026-11-25.** Nothing here is published. Open items for the host are at the end.

**Times.** In this file (`notes.edited.md`) times in brackets are edit times (00:00 = the first word of the show). In the generated `notes.md` they are podcast times (`podcast/postgres-fm-198-final.mp3`: the intro music, then the show; no cold open, as episode 197). `notes.md` is generated from `notes.edited.md` (edited-draft times) by `video/final/set_times.ts`; edit that file, not this one. YouTube times are in `youtube-description.txt` (cold open + title card + show).

## Episode description

Nik and Kirk discuss whether AI can safely change production Postgres. Nik built PGAIBench to measure it: 10 models, 19 tasks, most of them from real production failures, and live two-node Postgres 18.7 clusters under load. Acting alone, even top models caused harm. Then we talk about AAA (Analyst, Auditor, Actor): separate roles, rehearsal on a clone, an independent reviewer, and a deterministic executor. In a retrospective, in-sample replay of the recorded changes, it would have blocked 12 of 13 harmful changes and still approved 377 of 378 safe or unclassified ones.

## Links

Here are some links to things they mentioned:

### Main links

- [07:44] PGAIBench v0.2 (results, method, replays): https://pgaibench.dev
- [07:44] PGAIBench and AAA: can AI safely change production Postgres? (blog post, 2026-11-23): https://postgres.ai/blog/20261123-pgaibench
- [07:44] PGAIBench source, data and prompts (Apache 2.0): https://github.com/NikolayS/pgaibench

### PGAIBench
- [10:52] The tasks (public catalog): https://pgaibench.dev/scenarios/
- [31:59] AAA and Track 2 (AI Control) results: https://pgaibench.dev/control/
- [48:35] Related work map (DBA-Bench, SWE-bench and others): https://pgaibench.dev/related-work/
- [48:35] DBA-Bench (arXiv): https://arxiv.org/abs/2607.22165
- [48:37] SWE-bench (arXiv): https://arxiv.org/abs/2310.06770

### Operations practice

- [06:57] Site Reliability Engineering, the Google SRE book: https://sre.google/sre-book/table-of-contents/
- [17:07] max_locks_per_transaction (the setting Fable raised in the 5-of-5 restart task, C18): https://www.postgresql.org/docs/18/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION
- [25:44] Systems Performance, Brendan Gregg: https://www.brendangregg.com/systems-performance-2nd-edition-book.html
- [27:32] Mirroring in PgDog: https://docs.pgdog.dev/features/mirroring/
- [27:32] Mirroring in PgCat: https://github.com/postgresml/pgcat#mirroring
- [36:57] pg_repack: https://github.com/reorg/pg_repack

### Testing on clones

- [24:47] DBLab Engine (thin clones and branching): https://github.com/postgres-ai/database-lab-engine
- [24:55] DBLab Forge (dedicated primary and standby environments): https://postgres.ai/products/dblab-forge

### Episodes we referred to

- [08:27] BUFFERS by default: https://postgres.fm/episodes/buffers-by-default
- [12:11] Index maintenance: https://postgres.fm/episodes/index-maintenance
- [27:03] Postgres 19 (plan flips): https://postgres.fm/episodes/postgres-19

19 links. All opened (HTTP 200) on 2026-11-24.

## Corrections

Checked against the post (https://postgres.ai/blog/20261123-pgaibench) after recording:

- [10:55] PGAIBench v0.2 has 19 live scenarios (14 core, 2 exploratory, 3 held-out); on air we say 18.
- [12:07] The standby did not crash: in the index-drop task its query p99 got 18.0x slower (2.91 to 52.58 ms).
- [17:08] The setting is max_locks_per_transaction ("max slots per transaction" on air).
- [17:40] No model escalated 80% of runs: gpt-6.2-sol escalated 35 of 95 runs to a human (37%).
- [25:11] The deterministic clone gate alone stopped 6 of 13 live harms (46.2%), a bit less than half. It halts the change; it does not send test results back to the model.
- [37:41] A session that waits for a lock is active (wait event Lock), not idle in transaction: limit lock waits with lock_timeout, or pg_repack --wait-timeout.
- [40:28] The AAA result (13 harms down to 1) is a replay: the 408 recorded primary changes were replayed offline through the clone gate and the Auditor (in-sample). It was not a second live run. In v0.2 the Analyst and Auditor ran tool-free; revise loops are planned (Track 3).

What did you like or not like? What should we discuss next time? Let us know via a YouTube comment, on social media (https://postgres.fm/people), or by commenting on our Google doc (https://docs.google.com/document/d/1PNGSn_d0A7gTR4C0p6geQyHOTgdpitKCRvafCNnT-44/edit#heading=h.v4ncheatetql)!

~~~

Postgres FM is produced by:

- Michael Christofides, founder of pgMustard: https://pgmustard.com/
- Nikolay Samokhvalov, founder of PostgresAI: https://postgres.ai/
- Kirk Wolak, Software Architect at KiraSoft: https://www.kirasoft.com/

With credit to:

- Jessie Draws for the elephant artwork
- Intro and outro music: our own arrangement of Apple Loops from GarageBand (royalty-free under the GarageBand licence)

## Link check

| Link | Said on air (edited time) | Check |
| --- | --- | --- |
| Blog post | 07:44 "I created this benchmark called PG AI Bench" | 200, numbers below match it |
| pgaibench.dev, GitHub | 07:44 | 200 |
| Scenarios | 10:52 "those tasks ... very properly chosen" | 200 |
| Control | 31:59 "three As, triple A, AAA" | 200 |
| Related work, DBA-Bench, SWE-bench | 48:35 "I learned from other benchmarks, like DBA bench ... SWE bench" | 200 |
| SRE book | 06:57 "proper change request workflow, like from Google SRE books" | 200 |
| max_locks_per_transaction | 17:07 (said as "max slots per transaction") | 200 |
| Systems Performance | 25:44 "as Brendan Gregg says in all his books" | 200 |
| PgDog, PgCat mirroring | 27:32 "traffic mirroring ... PgDog, PgCat support it" | 200; PgCat marks mirroring experimental |
| pg_repack | 36:57 | 200 |
| DBLab Engine, DBLab Forge | 24:47, 24:55 | 200 |
| BUFFERS by default | 08:27 "we spent with Michael two years talking that buffers is needed" | 200 |
| Index maintenance | 12:11 "We have an episode about index maintenance" | 200 |
| Postgres 19 | 27:03 "last week talking about Postgres 19, plan flips" | 200 |

## Open items for the host

1. Episode number 198 and the slug (proposed `pgaibench`).
2. Title: options in `../thumbs/titles.md`.
3. Credit line: Nik thanks David Ventimiglia (Supabase) on air for feedback on the post (spelled as in the post). Link him? Not added.
4. "Jeff" at 33:31 (source 39:00): probably Jev; whisper also hears "Jeff". Check by ear before captions.
5. The 10:52 time for the scenarios link is where the tasks are first described ("Those tasks ... 18 tasks"); the post counts 19 live scenarios (see `fact-check.md`).
