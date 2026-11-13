# Episode 196 (The hidden costs of CREATE TEMP TABLE): X thread and LinkedIn post

Draft, 2026-11-12; updated 2026-11-13 after the fact-check and the final upload. Nik posts from his accounts. Rules: no link in the first post (links in the last reply); numbers in the first line; simple English; few emojis (Nik's choice in post 1); only our product named (DBLab Forge).

Handles: Kirk @yugedilbertfan, the show @postgresfm, Nik @samokhvalov. The postgres.fm URL is live (checked 2026-11-13).

Character counts are X counts (a link = 23; limit 280); `posts.py` prints them.

---

## v3 (2026-11-13, after the independent review): post this

4 posts. Fact rule: the 23x (0 idle sessions) is catalog and file work, sinval is under 1% there (brief § 5); the invalidation queue is a second cost that appears only with many idle sessions. Never write the queue as the cause of the 23x.

### 1/ First post (no link) — 276 chars (X weighting) — media: anim-196-x.mp4 (the 28 s X cut)

```
CREATE TEMP TABLE per transaction: 3,931 tx/s 🐢
Same query as a CTE: 88,531 tx/s 🐘🚀

- ~23x, with 0 idle sessions
- 5,000 idle sessions: 91% of DDL active time is one wait, LWLock:SInvalWrite

New Postgres FM with Kirk Wolak @yugedilbertfan

Ever seen this wait event? 🧵👇
```

### 2/ Reply — 277 chars (X weighting) — media: clip-kirk.mp4

```
Two different costs:

- always: 13+ catalog rows in and out per temp table, plus files created and unlinked. That is the 23x
- with many idle sessions: ~114 invalidation messages per create + drop, one 4,096-slot queue, and every session must read them

Kirk on the second one:
```

### 3/ Reply — 271 chars (X weighting) — media: clip-nik.mp4

```
Idle sessions are not free. We asked for 500 temp-table tx/s and got:

- 0 idle: 502
- 1,000: 502
- 3,000: 274
- 5,000: 127

At 5,000, the DDL sessions spend 91% of their active time waiting on LWLock:SInvalWrite (PG18, 16 vCPU, synthetic).

First aid: cut idle sessions.
```

### 4/ Reply — 279 chars (X weighting) — media: none (link card)

```
The fix: no temp tables in hot code.

- CTE: 88,531 tx/s
- PL/pgSQL arrays, records
- if you must: reuse one, ON COMMIT DELETE ROWS: 17,741 tx/s

Brief (DBLab Forge): https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d
Listen (Spotify, Apple, any app): https://postgres.fm/episodes/the-hidden-costs-of-create-temp-table
Watch: https://www.youtube.com/watch?v=gAdhpYewLZ8
```

## v1 (2026-11-12, reference)

#### 1/ First post (no link) — 229 chars — media: ../assets/23-throughput.png (or a clip of the throughput card from the final video, about 27:01-29:16)

```
A temp table created and dropped in every transaction: 3,931 tx/s.
The same query as a CTE: 88,531 tx/s.

New Postgres.FM with Kirk Wolak @yugedilbertfan: the hidden costs of CREATE TEMP TABLE, measured with DBLab Forge. Out now.
```

#### 2/ Reply — 225 chars — media: ../assets/21-ring-final.png (frame of the final ring card)

```
Why so slow? Every CREATE and DROP of a temp table is catalog DDL, and every session must hear about it.

The messages go into one shared queue with 4,096 slots, fixed at compile time. One create + drop is about 114 messages.
```

#### 3/ Reply — 230 chars — media: ../assets/17-cliff.png

```
Idle sessions are not free.

DDL at a 500 tx/s target:
0 idle sessions: 502 tx/s
1,000: 502
3,000: 274
5,000: 127

At 5,000, the DDL sessions spend 91% of their active time waiting on LWLock:SInvalWrite (PG18, 16 vCPU, synthetic).
```

#### 4/ Reply — 268 chars — media: ../assets/16-ash.png

```
Active session history: with 0 idle sessions, 95% CPU. With 5,000 idle: 88% LWLock (85% SInvalWrite), and more than half of the seconds have no samples at all.

The fix: no temp tables in hot code. Keep results in memory (PL/pgSQL arrays, records) or rewrite as a CTE.
```

#### 5/ Reply — 142 chars — media: none (link previews)

```
Links:

Video: https://www.youtube.com/watch?v=gAdhpYewLZ8
Podcast: https://postgres.fm/episodes/the-hidden-costs-of-create-temp-table
The DBLab Forge brief, every chart and config: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d
```

---

## LinkedIn (v3, post this)

Media: anim-196.mp4 (the full portrait animation, native upload; custom thumbnail = the final frame of slide 1). Links in the first comment: Brief / Listen / Watch, as in v3 reply 4.

```
CREATE TEMP TABLE in every transaction: 3,931 tx/s.
The same query as a CTE: 88,531 tx/s.
About 23x, and that is with zero idle sessions.

New Postgres FM episode with Kirk Wolak: the hidden costs of CREATE TEMP TABLE. What we measured with DBLab Forge:

- Without idle sessions, the cost is catalog and file work: 13 or more catalog rows inserted per temp table, the same rows deleted at drop, files created and unlinked.
- With many idle sessions, a second cost appears: about 114 invalidation messages per create + drop go into one shared queue of 4,096 slots, and every session must read them, the idle ones too.
- We asked for 500 temp-table transactions per second. With 0 or 1,000 idle sessions we got 502. With 3,000: 274. With 5,000: 127.
- At 5,000 idle sessions, the DDL sessions spend 91% of their active time waiting on one lock: LWLock:SInvalWrite.

The fix: no temp tables in hot code. Use a CTE, or keep the rows in PL/pgSQL arrays and records.

Have you ever seen LWLock:SInvalWrite in your wait events?

Video, podcast (Spotify, Apple Podcasts, any app) and the brief with every chart and config: first comment.
(Throughput: Postgres 17, 32 clients. Idle sessions: Postgres 18. Both 16 vCPU, synthetic.)
```

## Number check

- 3,931 / 17,741 / 88,531 tx/s, about 23x: brief, throughput figure; card 23 (PG17, 16 vCPU, 32 clients, synthetic).
- 502 / 502 / 274 / 127 tx/s; SInvalWrite 1.3 / 54 / 86 / 91%: brief, cliff figure; card 17 (PG18, 16 vCPU, 500 DDL tx/s target).
- 95% CPU at 0 idle; 88.1% LWLock at 5,000, 47 of 84 one-second bins empty: brief Fig. 6.2a/6.2b; card 16.
- 4,096 slots: sinvaladt.c MAXNUMMESSAGES, unchanged since Tom Lane's 2008 rewrite (fad153ec452, in 8.4); fact-check.
- 88.1% LWLock, 84.7% SInvalWrite at 5,000 idle: brief § 5.
- 91% is the share of the DDL sessions' active time (fact-check, YouTube description line 2).
- ~114 messages per create + drop: derived from the Postgres source in brief § 10 (2-column table, ON COMMIT DROP); a uprobe counted about 134, which the "~" covers. 4,096 / 114 = about 36 transactions to fill the queue, as the final ring card shows.

## YouTube community poll (PostgresTV, after the video is public)

From the growth brainstorm, quick win 8. It reaches subscribers who do not watch every episode.

```
Where do you create temp tables in Postgres?
- In the request path, per transaction
- Once per session
- Only in batch jobs
- Never
```

Link the poll to the episode in its text: "New episode on what this costs: https://youtu.be/gAdhpYewLZ8"
