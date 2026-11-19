# Episode 197: thumbnail headlines, v3

2026-11-19. Video: https://youtu.be/VcDU-NRE3hI. Title (fixed): "Postgres 19 is out! What survived the revert fest?"

The title carries the release news. Each headline below takes one technical hook from the episode and does not repeat the title. Line 1 is white, line 2 is orange. Times are video chapter times from `notes/youtube-description.txt`. Text only; no images are made yet.

## Ranked options

| # | Line 1 (white) | Line 2 (orange) | Time on topic | Top 3 |
| --- | --- | --- | --- | --- |
| 1 | DO YOU STILL NEED | pg_repack? | 10:39-17:35 (7 min) | yes |
| 2 | PLAN ADVICE or | HINTS? | 22:26-28:29 (6 min) | yes |
| 3 | UPGRADE TO 19: | WHICH PLANS FLIP? | 43:17-end (9 min), also 24:30 | yes |
| 4 | 1,000 LISTENERS. | NOTIFY FIXED? | 17:35-20:39 (3 min) | |
| 5 | READ YOUR WRITES | ON REPLICAS? | 30:55-36:18 (5 min) | |
| 6 | JIT IS NOW | OFF BY DEFAULT | 28:29-30:55 (2.5 min, JIT about 1 min) | |

### 1. DO YOU STILL NEED / pg_repack?

- Hook: REPACK (CONCURRENTLY) is in core now, so each engineer who runs pg_repack wants to know if they can drop it.
- Evidence: the chapter "Do you still need pg_repack?" (13:48) has this exact question. Nik asks it on air; all three hosts answer. Michael: for most workloads REPACK CONCURRENTLY is fine, with edge cases. Kirk: old versions and existing scripts keep pg_repack alive. Nik: neither tool works for a 10 TB table under load. The whole REPACK block is 10:39-17:35, the longest feature block of the episode.
- Risk: low. The question is about a tool choice, not about people. Keep "pg_repack" in lower case with the underscore. Do not write "pg_repack is dead": the hosts did not say that, and it reads as an attack on a tool that many people use.

### 2. PLAN ADVICE or / HINTS?

- Hook: Postgres refused hints for decades; 19 ships pg_plan_advice, and the episode explains why it is not the same thing.
- Evidence: chapters "pg_plan_advice: plan advice, not hints" (22:26) and "Why plan advice beats query hints" (25:26). Michael: "I know it's not hints". Kirk: hints are "a great idea in 1975", and advice lives on the server, outside the application code. Nik: the wiki page of refused proposals, plan pinning in Aurora, about 10% overhead on very fast queries (card `f11-advice`: 11% to 14% lower throughput on a trivial query).
- Risk: low. Same "X or Y?" form as 194 and 195, so it fits the channel but looks like those two. "Plan advice" is a new term; "HINTS?" in orange carries the click.

### 3. UPGRADE TO 19: / WHICH PLANS FLIP?

- Hook: the upgrade works, then some queries get a different plan; how do you find them before production does?
- Evidence: "How to test a Postgres upgrade" (43:17) and "Plan flips, regressions and the long tail of queries" (47:55): clones, synthetic load, RegreSQL, the long tail behind pg_stat_statements.max, calls against total time. Nik also tells the 17-to-18 story with many plan flips at about 24:30. Card `f10-plans` is on screen: 83 of 220 templates changed, 61 of the 83 from one planner commit.
- Risk: medium. The hosts discuss how to find flips; they do not list the plans that flip in 19. "WHICH" promises a little more than "how to find them". Safer variant: "WILL YOUR PLANS / FLIP ON 19?". Do not put "83 of 220" in the headline: the number is on a card, the hosts do not say it, and it is a synthetic test.

### 4. 1,000 LISTENERS. / NOTIFY FIXED?

- Hook: "NOTIFY does not scale" is a known pain; 19 changes one part of it.
- Evidence: 17:35-20:39. Nik: with 1,000 listeners, from 200/s to 11,000/s (card `f03-notify`: 200/s on 18.7, 11,040/s on 19 RC2, client-limited). Kirk names it his favorite feature and uses it in production.
- Risk: medium. Only 3 min of talk. The honest answer is "in part": the global lock on commit stays, and Nik says "partially satisfied". The question mark keeps the headline true. A number headline ("200/s / 11,040/s") is exact per the card, but it needs the conditions (1,000 listeners, one channel each, 8 vCPU, our client was the limit), and a thumbnail has no room for them. Do not use "55x".

### 5. READ YOUR WRITES / ON REPLICAS?

- Hook: stale reads after a write are a classic replica problem; WAIT FOR LSN is the new answer in SQL.
- Evidence: "WAIT FOR LSN: read your writes on replicas" (30:55-36:18), 5 min; Michael introduces it, Kirk explains the replica setup, then the hosts discuss it.
- Risk: medium. No card and no number. Read without context, the line may look like a general replication episode. Variant with the command name: "WAIT FOR LSN: / READ YOUR WRITES".

### 6. JIT IS NOW / OFF BY DEFAULT

- Hook: many teams turned JIT off by hand after an incident; now the default agrees with them.
- Evidence: "New defaults: JIT off, lz4 TOAST, wal_compression, log_lock_waits" (28:29). Michael: "far more sensible". Nik: "long overdue". Kirk: "We turned it off." Card `f06-jit`: short query 172 ms to 108 ms, longest query 3,914 ms to 4,607 ms.
- Risk: high for depth. JIT gets about 1 min. It is a statement, not a question, and it gives the answer away, so there is less reason to click. Use it only if a short, sure fact is wanted.

## Not proposed

- Autovacuum prioritization: 20:39-22:26, under 2 min. Too thin for the headline.
- CVE count ("96 CVEs", "52 CVEs IN ONE RELEASE?"): the v2 concepts. The title now carries the late-release story, so a CVE headline repeats it.
- Any "revert" wording: rejected (it reads as gloating next to smiling faces).

## Recommendation

Option 1. It is the longest feature block, the question is asked on air in the same words, and all three hosts answer it. Option 2 is the alternative, if it is acceptable that it has the same "X or Y?" form as 194 and 195. Option 3 is best if the goal is to reach people who plan the upgrade.
