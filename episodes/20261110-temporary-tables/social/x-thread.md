# Episode 196 (The hidden costs of CREATE TEMP TABLE): X thread and LinkedIn post

Draft, 2026-11-12. Nothing is posted; Nik posts. Rules kept: no link in the first post (links in the last reply); numbers in the first line; simple English; no emojis; only our product named (DBLab Forge).

Handles: Kirk @yugedilbertfan, the show @postgresfm, Nik @samokhvalov. Check the postgres.fm URL once the Transistor episode exists (the slug is a guess).

Character counts are X counts (a link = 23; limit 280); `posts.py` prints them.

---

### 1/ First post (no link) — 229 chars — media: ../assets/23-throughput.png (or a clip of the throughput card from the final video, 26:40-28:55)

```
A temp table created and dropped in every transaction: 3,931 tx/s.
The same query as a CTE: 88,531 tx/s.

New Postgres.FM with Kirk Wolak @yugedilbertfan: the hidden costs of CREATE TEMP TABLE, measured with DBLab Forge. Out now.
```

### 2/ Reply — 228 chars — media: ../assets/21-ring.png

```
Why so slow? Every CREATE and DROP of a temp table is catalog DDL, and every session must hear about it.

The messages go into one shared queue with 4,096 slots, fixed since Postgres 8.4. One create + drop is about 114 messages.
```

### 3/ Reply — 191 chars — media: ../assets/17-cliff.png

```
Idle sessions are not free.

DDL at a 500 tx/s target:
0 idle sessions: 502 tx/s
1,000: 502
3,000: 274
5,000: 127

At 5,000, LWLock:SInvalWrite is 91% of the waits (PG18, 16 vCPU, synthetic).
```

### 4/ Reply — 257 chars — media: ../assets/16-ash.png

```
Active session history: with 0 idle sessions, 95% CPU. With 5,000, 88% LWLock:SInvalWrite, and more than half of the seconds have no samples at all.

The fix: no temp tables in hot code. Keep results in memory (PL/pgSQL arrays, records) or rewrite as a CTE.
```

### 5/ Reply — 142 chars — media: none (link previews)

```
Links:

Video: https://www.youtube.com/watch?v=SinrACCAwa8
Podcast: https://postgres.fm/episodes/the-hidden-costs-of-create-temp-table
The DBLab Forge brief, every chart and config: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d
```

---

## LinkedIn

Links go in the first comment (the same links as reply 5). Media: `../assets/23-throughput.png`.

```
A temp table created and dropped in every transaction: 3,931 tx/s. The same query as a CTE: 88,531 tx/s (Postgres 17, 16 vCPU, 32 clients, synthetic workload).

In the new Postgres.FM episode, Kirk Wolak and I talk about the hidden costs of CREATE TEMP TABLE. Kirk's team came from Oracle, where global temporary tables are cheap. In Postgres, every CREATE and DROP of a temp table is catalog DDL, and every other session must hear about it, through one shared invalidation queue of 4,096 slots.

Idle sessions make it much worse. With a 500 tx/s target, DDL holds 502 tx/s up to 1,000 idle sessions, then falls to 274 at 3,000 and to 127 at 5,000, where LWLock:SInvalWrite is 91% of the waits (Postgres 18, 16 vCPU).

We measured all of this with DBLab Forge, and the brief has every chart and config. Links in the first comment.
```

## Number check

- 3,931 / 17,741 / 88,531 tx/s, about 23x: brief, throughput figure; card 23 (PG17, 16 vCPU, 32 clients, synthetic).
- 502 / 502 / 274 / 127 tx/s; SInvalWrite 1.3 / 54 / 86 / 91%: brief, cliff figure; card 17 (PG18, 16 vCPU, 500 DDL tx/s target).
- 95% CPU at 0 idle; 88.1% LWLock at 5,000, 47 of 84 one-second bins empty: brief Fig. 6.2a/6.2b; card 16.
- 4,096 slots: sinvaladt.c MAXNUMMESSAGES; fixed since 8.4: brief §13 idea 3 (Tom Lane's 2008 rewrite).
- ~114 messages per create + drop: brief; card 21.
