# Episode 198 (PGAIBench): corrections

Draft, 2026-11-25, for Nik's approval. Source of truth: the post https://postgres.ai/blog/20261123-pgaibench and https://pgaibench.dev. Times are edit v5 times (`v5/pgfm198-edited.mp4`, 00:00 = the first word of the show). The same items are in the YouTube description and the show notes (`set_times.ts` writes their final times).

## Corrected in the notes (said on air, kept in the edit)

| Edit time | Speaker | Said on air | The post | On screen |
| --- | --- | --- | --- | --- |
| 10:55 | Nik | "now it's, like, 18 tasks" (also 13:18 "those 18 cases", 45:05, Kirk 45:16 "these 18 tests") | "10 unquantized models across 19 live scenarios"; "14 core public tasks, 2 exploratory tasks ..., and 3 held-out tasks" | Scenario card: 19, with an Editor's note line |
| 12:07 | Kirk | "now your read replica crashes because nothing's finishing" | Async standby query q20 client p99 "spikes 18.0x (2.91 to 52.58 ms)" | L9 split card: 18.0x slower |
| 16:27 | Nik | "in three cases it led to downtime on, on replica" | "Three runs broke live primaries" (C18); the restart was on the primary, the effect on the standby | Strip worded to match both |
| 17:08 | Nik | "Max slots per transaction is one of them" | max_locks_per_transaction | Card shows max_locks_per_transaction |
| 17:40 | Kirk, Nik | "Like 80% escalation almost, right?" / "Yeah" | "gpt-6.2-sol escalated 35 runs to humans" (of 95); no 80% | Escalation strip with an Editor's note |
| 25:11 | Nik | "it removed half of harm- harmful actions" ... "from giving the results of testing back to AI" | "Clone gate ($0 LLM): stopped 6 of 13 harms (46.2%)"; the gate halts the change | Clone-gate card: 6 of 13 |
| 37:41 | Nik | pg_repack lock waits and "idle in transaction session timeout" | (Postgres docs) a session waiting for a lock is active, wait event Lock; lock_timeout or pg_repack --wait-timeout limit it | none |
| 40:28 | Kirk, Nik | "Did it then tell a different actor to run it in production?" / "Yes." | "When we replayed the models' primary changes through AAA (retrospective and in-sample), the clone gate and Auditor together blocked 12 of 13 measured harms (-92.3%)"; "We replayed all 408 scored Track 1 primary CRs offline through both AAA gates using their recorded rehearsal telemetry"; "Every v0.2 Analyst and Auditor ran strictly tool-free"; revise loops are Track 3 | Editor's note strip; "offline replay (in-sample)" on both 13 -> 1 cards and on the title card |

## Cut from the edit (edit v5)

| Source | Said on air | Why |
| --- | --- | --- |
| 43:48.3 | "and neither analyst nor actor have access to production, right?" | Inverts AAA: the Actor is the only write path |
| 52:36.2 | "by mistake" (in "only one was blocked by mistake") | The post: "The sole blocked lab-correct CR caught a real lock bug" |
