# Fact check: claims made on air

Source for every number: the published post, https://postgres.ai/blog/20261123-pgaibench (2026-11-23), and https://pgaibench.dev/ (v0.2.0). Times are edited-draft times; source (recording) times in parentheses.

Tags: OK (matches), CLARIFICATION (right idea, the post says it more exactly), CORRECTION (a slip that changes a fact), NOTE (not a number from the post).

| Time | Said | Post says | Tag |
| --- | --- | --- | --- |
| 02:49 (03:50) | Goal: 1,000 clusters, one experienced engineer controlling them | "one experienced DBRE or SRE can reliably oversee 1,000 clusters" | OK |
| 11:11 (12:34), 13:43 (15:07), 46:53 (52:48) | "originally 20, now 18 tasks"; "those 18 cases" | 19 live scenarios: 14 core public, 2 exploratory (O3, S1), 3 held-out | CLARIFICATION: 19 |
| 15:05 (17:04) | Gemini 4 Neon is not in v0.2; Carbon is | Table has google/gemini-4-carbon only | OK |
| 16:16 (18:16) | Fable 5.2 at high effort, 5 of 5 runs changed a setting and restarted, against "do not restart" | "broke an explicit no-restart rule in all 5 of 5 repeats" (C18) | OK |
| 16:46 (18:47) | 2 of 5 stopped by its own checks, 3 of 5 caused downtime | "3 runs sailed through and broke live primaries while 2 stopped in rehearsal only because Fable's own lockmanager_share < 0.1 check tripped" | OK |
| 16:58 (18:58) | downtime "on replica" from a configuration mismatch | Raising max_locks_per_transaction on a primary before its standby pauses WAL replay on the standby; the post counts the 3 runs as live primary harms | CLARIFICATION |
| 17:33 (20:15) | "max_locks_per_transaction" | max_locks_per_transaction | OK: said right; "max slots" was a transcription error (caption fix only) |
| 18:05 (20:46) | Kirk: weak models escalate "like 80%" | Not a post number. Most escalations: gpt-6.2-sol, 35 of 95 runs; as Auditor, Haiku approved 18.5% of safe changes | NOTE: Kirk's estimate, keep it off screen |
| 25:55 (29:22) | Clone testing "removed half of harmful actions", without extra AI tokens | Clone gate stopped 6 of 13 harms (46.2%) at $0 LLM, 0 of 395 non-harmful changes blocked | CLARIFICATION: 6 of 13 |
| 25:52 (29:23) | "PG bench AI version 0.2" | PGAIBench v0.2 | name slip; caption fix |
| 37:58 (43:49) | "neither analyst nor actor have access to production" | Analyst has no production write access; the Actor applies approved steps to production | CORRECTION candidate (Editor's note: "Only the Actor writes to production.") |
| 41:16 (47:09) | "Only one left" | 13 → 1 after AAA | OK |
| 44:04 (49:59) | "One harm left in Opus 5.5" | "1 remaining held-out Opus 5.5 miss"; "claude-opus-5.5 passed both gates" | OK |
| 44:21 (50:16) | Kirk: "from 13 harms down to one" | 13 → 7 (clone gate) → 1 (Auditor), -92.3% | OK |
| 46:40 (52:33) | "almost 400, only one was blocked by mistake" | 377 of 378 safe or unclassified changes approved (99.7%) | CLARIFICATION: 377 of 378 |
| 47:37 (53:36) | best models make mistakes from overconfidence; weak models approve after a green test, or escalate too much | Post: GLM-5.3 flipped to approve the SET NOT NULL lock after the clone summary (4 of 5); Haiku blocked almost everything | OK |
| 50:46 (56:46) | learned from DBA-Bench and SWE-bench | Both cited in the post | OK |
| 53:15 (59:17) | "David Vintemiya from Supabase" | "Thanks to David Ventimiglia (Supabase)" | spelling (caption fix) |
| 08:45 (09:55) | Agents now send EXPLAIN plans with BUFFERS | Nik's observation, no source | NOTE: opinion, said as such |

Not checked against the post (said as experience or plans): the human-baseline questionnaire (50 questions for v0.1, smaller one coming), v0.3 to include Gemini 4 Neon, the GitLab index case, the January decision to review code in a separate context.
