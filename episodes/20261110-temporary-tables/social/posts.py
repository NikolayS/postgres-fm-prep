# X thread posts for episode 196 and their X character counts (a link counts as 23).
import re
P = {
"1": """A temp table created and dropped in every transaction: 3,931 tx/s.
The same query as a CTE: 88,531 tx/s.

New Postgres.FM with Kirk Wolak @yugedilbertfan: the hidden costs of CREATE TEMP TABLE, measured with DBLab Forge. Out now.""",
"2": """Why so slow? Every CREATE and DROP of a temp table is catalog DDL, and every session must hear about it.

The messages go into one shared queue with 4,096 slots, fixed since Postgres 8.4. One create + drop is about 114 messages.""",
"3": """Idle sessions are not free.

DDL at a 500 tx/s target:
0 idle sessions: 502 tx/s
1,000: 502
3,000: 274
5,000: 127

At 5,000, LWLock:SInvalWrite is 91% of the waits (PG18, 16 vCPU, synthetic).""",
"4": """Active session history: with 0 idle sessions, 95% CPU. With 5,000, 88% LWLock:SInvalWrite, and more than half of the seconds have no samples at all.

The fix: no temp tables in hot code. Keep results in memory (PL/pgSQL arrays, records) or rewrite as a CTE.""",
"5": """Links:

Video: https://www.youtube.com/watch?v=SinrACCAwa8
Podcast: https://postgres.fm/episodes/the-hidden-costs-of-create-temp-table
The DBLab Forge brief, every chart and config: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d""",
}
for k, t in P.items():
    n = len(re.sub(r"https?://\S+", "x" * 23, t))
    print(f"post {k}: {n} chars")
