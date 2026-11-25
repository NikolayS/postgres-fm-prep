# Can AI safely change production Postgres?

Postgres.FM episode 198 (number to confirm). Hosts: Nik and Kirk.

**DRAFT, 2026-11-24.** Nothing here is published. Open items for the host are at the end.

**Times.** Times in brackets are podcast times (`podcast/postgres-fm-198-final.mp3`: 13 s intro music, then the show; no cold open, as episode 197). This file is generated from `notes.edited.md` (edited-draft times) by `video/final/set_times.ts`; edit that file, not this one. YouTube times are in `youtube-description.txt` (cold open + title card + show).

## Episode description

Nik and Kirk discuss whether AI can safely change production Postgres. Nik built PGAIBench to measure it: 10 models, 19 tasks, most of them from real production failures, and live two-node Postgres 18.7 clusters under load. Acting alone, even top models caused harm. Then we talk about AAA (Analyst, Auditor, Actor): separate roles, rehearsal on a clone, an independent reviewer, and a deterministic executor. In the replay it blocked 12 of 13 harmful changes and approved 377 of 378 safe ones.

## Links

Here are some links to things they mentioned:

### Main links

- [07:57] PGAIBench v0.2 (results, method, replays): https://pgaibench.dev
- [07:57] PGAIBench and AAA: can AI safely change production Postgres? (blog post, 2026-11-23): https://postgres.ai/blog/20261123-pgaibench
- [07:57] PGAIBench source, data and prompts (Apache 2.0): https://github.com/NikolayS/pgaibench

### PGAIBench
- [11:05] The tasks (public catalog): https://pgaibench.dev/scenarios/
- [32:10] AAA and Track 2 (AI Control) results: https://pgaibench.dev/control/
- [48:51] Related work map (DBA-Bench, SWE-bench and others): https://pgaibench.dev/related-work/
- [48:51] DBA-Bench (arXiv): https://arxiv.org/abs/2607.22165
- [48:53] SWE-bench (arXiv): https://arxiv.org/abs/2310.06770

### Operations practice

- [07:10] Site Reliability Engineering, the Google SRE book: https://sre.google/sre-book/table-of-contents/
- [17:18] max_locks_per_transaction (the setting behind the 5-of-5 restart task): https://www.postgresql.org/docs/18/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION
- [25:55] Systems Performance, Brendan Gregg: https://www.brendangregg.com/systems-performance-2nd-edition-book.html
- [27:43] Mirroring in PgDog: https://docs.pgdog.dev/features/mirroring/
- [27:43] Mirroring in PgCat: https://github.com/postgresml/pgcat#mirroring
- [37:13] pg_repack: https://github.com/reorg/pg_repack

### Testing on clones

- [24:58] DBLab Engine (thin clones and branching): https://github.com/postgres-ai/database-lab-engine
- [25:06] DBLab Forge (dedicated primary and standby environments): https://postgres.ai/products/dblab-forge

### Episodes we referred to

- [08:40] BUFFERS by default: https://postgres.fm/episodes/buffers-by-default
- [12:26] Index maintenance: https://postgres.fm/episodes/index-maintenance
- [27:14] Postgres 19 (plan flips): https://postgres.fm/episodes/postgres-19

18 links. All opened (HTTP 200) on 2026-11-24.

## Link check

| Link | Said on air (edited time) | Check |
| --- | --- | --- |
| Blog post | 07:44 "I created this benchmark called PG AI Bench" | 200, numbers below match it |
| pgaibench.dev, GitHub | 07:44 | 200 |
| Scenarios | 10:52 "those tasks ... very properly chosen" | 200 |
| Control | 31:57 "three As, triple A, AAA" | 200 |
| Related work, DBA-Bench, SWE-bench | 48:38 "I learned from other benchmarks, like DBA bench ... SWE bench" | 200 |
| SRE book | 06:57 "proper change request workflow, like from Google SRE books" | 200 |
| max_locks_per_transaction | 17:05 (said as "max slots per transaction") | 200 |
| Systems Performance | 25:42 "as Brendan Gregg says in all his books" | 200 |
| PgDog, PgCat mirroring | 27:30 "traffic mirroring ... PgDog, PgCat support it" | 200; PgCat marks mirroring experimental |
| pg_repack | 37:00 | 200 |
| DBLab Engine, DBLab Forge | 24:45, 24:53 | 200 |
| BUFFERS by default | 08:27 "we spent with Michael two years talking that buffers is needed" | 200 |
| Index maintenance | 12:13 "We have an episode about index maintenance" | 200 |
| Postgres 19 | 27:01 "last week talking about Postgres 19, plan flips" | 200 |

## Open items for the host

1. Episode number 198 and the slug (proposed `pgaibench`).
2. Title: options in `../thumbs/titles.md`.
3. Credit line: Nik thanks David Ventimiglia (Supabase) on air for feedback on the post (spelled as in the post). Link him? Not added.
4. "Jeff" at 33:29 (source 39:03): probably Jev; whisper also hears "Jeff". Check by ear before captions.
5. The 10:52 time for the scenarios link is where the tasks are first described ("Those tasks ... 18 tasks"); the post counts 19 live scenarios (see `fact-check.md`).
