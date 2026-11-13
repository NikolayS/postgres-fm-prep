# Episode 196 (The hidden costs of CREATE TEMP TABLE): titles and thumbnails

The title promises the answer; the thumbnail asks the question. No channel or episode suffix.

1. **Temp table per transaction: 3,931 vs 88,531 tx/s** (48) — pairs with thumbnail A, "TEMP TABLES 23x SLOWER?". The thumbnail asks; the title gives the measured throughput: temp table created and dropped in every transaction vs the same query as a CTE (PG17, 16 vCPU, 32 clients, synthetic workload, DBLab Forge).
2. **5,000 idle sessions cut DDL from 502 to 127 tx/s** (47) — pairs with thumbnail B, "5,000 IDLE SESSIONS?". Idle sessions look free; the title gives the cliff (PG18, 16 vCPU, 500 DDL tx/s target; LWLock:SInvalWrite 91% of waits at 5,000).
3. **The hidden costs of CREATE TEMP TABLE** (37) — pairs with thumbnail C, "DON'T USE TEMP TABLES?". The episode title; the safe fallback for the A/B test.

Recommended: thumbnail A + title 1 as the main pair; A/B test titles 1-3 after the Premiere.

Square cover (podcast): "TEMP TABLES 23X SLOWER?", Nik left, Kirk right, samograph sticker.

Faces (recording video2707337352.mp4, Zoom gallery, 1280x720): Nik 00:17:09.6 (right-top tile), Kirk 00:29:43.0 (left-top tile; the virtual background bites his crown in most other laughing frames).

Sources: `src/` (`tiles.py`, `mk.py`, `hosts.py`, `square.html`, `faces.swift`, `seg.swift`); renders in the recording's `review/40-thumbs/` (`thumb-a|b|c.png`, `cover-3000.png`).
