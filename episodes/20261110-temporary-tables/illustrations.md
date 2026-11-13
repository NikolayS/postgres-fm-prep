# Illustrations: The hidden costs of CREATE TEMP TABLE (#196)

[Episode overview](README.md) · [Expert review and plan v2](illustrations-review.md)

Plan v2, as built: 31 inserts, 14 in the center (the hosts move to the small tiles at the right, 9.5 min in total) and 17 bands.5 min in total) and 17 bands.5 min in total) and 17 bands.5 min in total) and 17 bands.1 min in total) and 17 bands. No card freezes the talk. Each card is anchored to source words with `tools/podcast-edit/find.ts` and mapped through `01-edited.cuts.json`. Times are SOURCE (`video2707337352.mp4`) and EDITED (`01-edited.mp4`); YouTube time = edited time + the title card length. Sources, props and scripts are in [`video/overlays/`](video/overlays/); the rendered `.mov` files, `manifest.json`, `manifest-sfx.json` and `qa-sheet.png` are in `$R/20-overlays/`.

Rules applied: numbers only from the public DBLab Forge brief (https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d, live V6.1 on 2026-11-10, numbers confirmed by the forge agent: `forge-data.md`, "V6.1 confirmation", and each one found in the live page text), built as house blocks with "synthetic workload"; documentation, code and commits are real captures (headless Chrome, logged out, 2x, the sinvaladt.c capture 4x), source code pinned to commits; yellow marker only for the takeaway and spoken quotes, facts and credits on dark strips; five punch sounds (layer 3, the 4096 box, the 127 landing, the array collapse, 88,531). Every URL below returned HTTP 200 on 2026-11-10.

## Cards

1. **01-michael**, center. Source 0:44.50-0:52.00, edited 0:30.86-0:39.86 (9 s). Michael's post on X (real capture of the official embed), red underline on "taking a few months off". Variant `01-michael-short.mov` (MICHAEL=short) ends after "taking a few months off @PostgresFM", without the product line.
   Words: Nik: "there should be a sound right now, and you should see" (44.62) ... "this tweet from Michael" (47.84-49.86).
   Source: https://x.com/michristofides/status/2117283823314674021 (2026-11-02 15:52 UTC; official embed, logged out, 2x, time in UTC; the avatar is his real profile image on X, a plain green picture). Same text on Bluesky: https://bsky.app/profile/michristofides.com/post/3mzdomwp3jk27.
2. **02-temp-docs**, center. Source 1:54.60-2:26.20, edited 1:20.20-1:51.80 (31.6 s). CREATE TABLE docs, Compatibility, "Temporary Tables" (recaptured at 560 px so it reads at phone size); underlines on "temporary tables are defined just once and automatically exist" and "instead requires each session to issue its own".
   Words: Kirk: "Oracle has global temporary tables" (116.30-118.00) ... "we're gonna have to create these temporary tables" (142.60) "all the time, and this adds overhead" (144.38-146.14).
   Source: https://www.postgresql.org/docs/current/sql-createtable.html (PG18 docs, Compatibility, Temporary Tables).
3. **03-fall-off**, band. Source 4:01.20-4:06.20, edited 3:25.68-3:30.68 (5 s). Marker quote `“You fall off of them.”`
   Words: Kirk: "You fall off of them" (241.82-242.64) "unexpectedly trip and fall" (243.76-245.54).
   Source: on air (Kirk).
4. **04-autovacuum**, band. Source 5:03.30-5:10.80, edited 4:25.90-4:33.40 (7.5 s). Marker quote `“Autovacuum doesn't care about your poor temporary tables.”`, chip `Docs, CREATE TABLE: autovacuum cannot vacuum or analyze temporary tables`.
   Words: Nik: "Autovacuum doesn't care about your poor temporary tables" (304.12-307.0).
   Source: on air (Nik); https://www.postgresql.org/docs/current/sql-createtable.html (TEMPORARY: "The autovacuum daemon cannot access and therefore cannot vacuum or analyze temporary tables.").
5. **05-uuid-episode**, band. Source 6:37.90-6:49.90, edited 6:00.50-6:12.50 (12 s). Dark strip `Postgres.FM 194: UUIDv4 vs UUIDv7`, chip `postgres.fm/episodes/uuidv4-vs-uuidv7` (optional item 5; no thumbnail, as the episode page has no YouTube link).
   Words: Kirk: "Integer, uh, eight versus UUID version four and version seven" (398.14-400.22).
   Source: https://postgres.fm/episodes/uuidv4-vs-uuidv7 (200 on 2026-11-10).
6. **06-takeaway**, band. Source 7:58.90-8:04.40, edited 7:20.78-7:26.28 (5.5 s). Takeaway marker `Don't use temp tables.` (1 of 3).
   Words: Nik: "don't use temporary tables" (479.50-481.26).
   Source: on air (Nik), the episode takeaway (1 of 3).
7. **07-8x-machine**, band. Source 10:41.00-10:47.00, edited 10:02.72-10:08.72 (6 s). Marker quote `“The client bought 8X the machine.”`
   Words: Kirk: "the client bought 8X the machine" (641.74-643.24).
   Source: on air (Kirk).
8. **08-layers**, center. Source 12:34.40-13:30.00, edited 11:54.64-12:48.44 (53.8 s). Hero layers: five 96 px slabs; 0 Primary only, 1 Invisible to other sessions, 2A Dead tuples, 2B Catalog bloat, each wipes in on its word; slot 3 is an empty dashed yellow outline; the card exits with it empty. On "catalog bloat" a measured line appears under the slots: `Measured: pg_attribute +737 to 839 MiB in ~70 s` / `temp table per transaction; under 1.5 MiB with a reused temp table. Synthetic workload.`
   Words: Nik: "problems number zero" (756.06) "Problem number one" (763.12) "2A is the bloat itself" (779.56) "problem 2B is a catalog bloat" (800.92) ... card exits 810.0 (13:30).
   Source: the layers as listed on air (Nik); 2B measurement from https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d § 5 ("churn at 128 clients grows pg_attribute by 737 to 839 MiB ... in about 70 s ... reuse_* arms grow it by less than 1.5 MiB"); 2A "dead tuples" as Nik says on air ("it's not bloat, it's dead tuples").
9. **09-kirk-60m**, band. Source 14:35.90-14:52.00, edited 13:54.34-14:10.44 (16.1 s). Dark strip, two stages: `10M queries/day` then `→ 60M pg_catalog changes/day`; chip `Kirk's system: 2 temp tables + 1 index, created and dropped`.
   Words: Kirk: "So what was 10 million a day" (876.18) "quickly became 60 million" (879.12-881.02) "updates to PG catalog a day" (881.56-883.82) ... "for no good reason" (890.58).
   Source: on air (Kirk), his production system; not measured by us.
10. **10-robot-tag**, band. Source 15:07.90-15:14.40, edited 14:26.14-14:32.64 (6.5 s). Marker quote `“not to speak unless directly addressed”` at the right of the band with a yellow arrow to the robot tile.
   Words: Nik: "told him not to speak unless directly addressed" (908.84-911.34).
   Source: on air (Nik), about the meeting bot in the robot tile.
11. **11-layer3**, center. Source 15:53.50-16:48.00, edited 15:02.78-15:56.08 (53.3 s). The layers card returns: rows 0-2B dim to 35 %, slot 3 fills yellow `3 Catalog invalidation: the sinval queue` (punch), then `LWLock:SInvalWrite` and `LWLock:SInvalRead` type in mono 56 px on "write"/"read"; note `sinval = shared invalidation · postgresql.org/docs/current/monitoring-stats.html`. Punch at edited 15:05.74.
   Words: Nik: "And finally, layer number three" (956.46) ... "lightweight lock, S and Val write" (984.86) "S and Val read" (987.24) "snapshot invalidation, catalog snapshot invalidation" (989-993.5) ... "refresh their understanding of catalog" (1005.12-1008.0).
   Source: layer 3 as said on air; wait event names from https://www.postgresql.org/docs/current/monitoring-stats.html (LWLock: SInvalWrite, SInvalRead). On air Nik says "catalog snapshot invalidation" (whisper check of 16:22-16:36); the card says shared invalidation, the meaning of sinval in the source..
12. **12-local-global**, band. Source 17:50.00-17:56.60, edited 16:57.36-17:03.96 (6.6 s). Marker quote `“Data is local. A catalog is global.”`
   Words: Nik: "Data is, is local" (1070.30-1071.90) "A catalog is, is global" (1072.26-1073.96).
   Source: on air (Nik).
13. **14-maxnummessages**, center. Source 18:49.00-19:02.00, edited 17:53.00-18:06.00 (13 s). One real GitHub capture of sinvaladt.c lines 99-126 (4x, no line cut; the MAXNUMMESSAGES comment and the #defines in frame). Push-in to `#define MAXNUMMESSAGES 4096` on "invalidation queue", red box on 4096 on "4,096" (punch), second push to the number on "hard-coded constant", hold, exit 19:02 source. Punch at edited 17:58.90.
   Words: Nik: "this signal goes to this queue, invalidation" (1129.73-1132.33) "queue, which is, uh, 4,096" (1134.89) "hard-coded constant" (1137.73-1138.79) ... exit 1142.0 (19:02).
   Source: https://github.com/postgres/postgres/blob/3d342deeb433060dbea02fdd276656a5563275d5/src/backend/storage/ipc/sinvaladt.c#L123 (master on 2026-11-10; line 102: "MAXNUMMESSAGES: max number of shared-inval messages we can buffer.", line 123: #define MAXNUMMESSAGES 4096; capture at 4x so the push-in stays sharp).
14. **15-lockmanager**, band. Source 19:33.20-20:09.50, edited 18:36.64-19:12.94 (36.3 s). Dark strip `Over 16 relations per transaction: LWLock:LockManager`, chip `PG18: raise max_locks_per_transaction` on "max locks per transaction".
   Words: Nik: "first you will start seeing lightweight lock lock manager" (1173.39) ... "max locks per transaction" (1199.91) ... "this lightweight lock goes away" (1207.85-1209.29).
   Source: commit c4d5cb71d229095a39fda1121a75ee40e6069a2a (Tomas Vondra, PG18): 16 fast-path locks since 9.2; arrays "sized on startup based on max_locks_per_transaction"; https://github.com/postgres/postgres/commit/c4d5cb71d229095a39fda1121a75ee40e6069a2a.
15. **16-cpu**, center. Source 20:17.50-20:40.00, edited 19:20.94-19:43.44 (22.5 s). Technical chart (host feedback 2026-11-11, forge data). Title `Where active sessions are: share of sampled time`, sub `pg_wait_sampling, all sessions, PG18.6, 500 DDL tx/s target`. Top: two 100% stacked share bars on a 0-100% axis, numbers as stated in the brief text (sample-weighted): `5,000 idle` LWLock 88.1% / CPU 11.7% / IO 0.13% (each segment grows on its word), then `0 idle` CPU 95.1% / LWLock 3.1% / IO 1.65%. Bottom: Fig. 6.2b per-second strip (forge 1 s bins, fig6-2b_all_sessions_5000idle_pgws.tsv, src/ash62b.json), average active sessions 0-600, 0-80 s, house ASH colors; the 47 of 84 seconds without samples (pg_wait_sampling history overflow) are hatched, legend `no samples` - never drawn as zero. No peak label, no series means. Caption `Shares as stated in the brief (sample-weighted). Synthetic workload.`
   Words: Nik: "usually a CPU is low" (1221.19-1223.39) "and disk IO is low" (1224.37-1225.39) ... "this, uh, invalidation queue" (1237.73-1239.77).
   Source: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d (§ 5 "CPU or disk IO?": at 5,000 idle, LWLock 88.1 percent of active-session samples (SInvalWrite 84.7), CPU 11.7, IO 0.13; at 0 idle CPU 95.0) — share of sampled active-session time, pg_wait_sampling.
16. **17-cliff**, center. Source 21:36.40-22:21.00, edited 20:38.88-21:22.56 (43.68 s). Technical chart in the style of Fig. 4.1 / 4.2: top panel DDL tx/s vs idle sessions (y 0-600 by 100, x 0-5,000 by 1,000, gridlines, dashed target 500), orange line 502, 502, then 274 on "contention", 127 (red) on "as you can see from the graphs"; a white dot rides the line and lands on 127 on "lie down there on the bottom" (punch). Bottom panel: LWLock:SInvalWrite share 1.3 / 54 / 86 / 91 % (y 0-100 %). Caption `PG18, 16 vCPU, 500 DDL tx/s target, synthetic workload`. Punch at edited 21:12.86.
   Words: Nik: "lightweight lock S in wal write contention" (1303.85-1306.63) "as you can see from the graphs" (1307.27) ... "lie down there on the bottom" (1331.23-1333.13) ... "first urgent emergency help" (1344.15).
   Source: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d (§ 4 table C, Fig. 4.1: DDL 502 / 502 / 274 / 127 tx/s at 0 / 1,000 / 3,000 / 5,000 idle; LWLock:SInvalWrite 1.3 / 53.6 / 86.5 / 91.1 percent; the brief's prose rounds to 54 / 86 / 91).
17. **18-idle-1000**, band. Source 23:56.00-24:20.00, edited 22:54.64-23:18.64 (24 s). Dark strip `1,000 idle sessions: 502 tx/s`, then on "triple" `3,000: 274 tx/s` (274 in red); chip `500 tx/s target, synthetic workload`.
   Words: Nik: "we didn't exceed 1,000" (1448.09) "double or, or triple" (1451.11-1452.45) "So we just suddenly have more connections" (1459.22).
   Source: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d (§ 4 table C).
18. **19-andres**, band. Source 24:30.40-24:42.40, edited 23:28.24-23:40.24 (12 s). Dark strip `PG14: faster snapshots with many sessions`, chip `Andres Freund · postgresql.org/docs/release/14.0`.
   Words: Nik: "thanks to work from Andreas Freund" (1471.62-1474.10) ... "you don't suffer from them" (1481.22).
   Source: https://www.postgresql.org/docs/release/14.0/ ("Improve the speed of computing MVCC visibility snapshots on systems with many CPUs and high session counts (Andres Freund) ... also improves performance when there are many idle sessions.").
19. **19b-ash-blind**, center. Source 24:48.30-25:12.80, edited 23:46.14-24:09.84 (23.7 s). Bar chart on a linear axis (0-200 sessions, ticks every 50, gridlines): `5,000 idle sessions: how many are waiting?`, sub `idle-pool sessions, average over the run`. `pg_stat_activity` polled 10 times/s, state = active: 1.7 (a stub); then on "a lot of sessions are waiting" `pg_wait_sampling` (samples every 10 ms): `about 160`. No peak shown. Caption `500 DDL tx/s, PG18.6, synthetic workload`.
   Words: Nik: "this wait event can be seen in active session history dashboards" (1488.26-1494.56) ... "if you use pg_ash, you can see it as well" (1501.96-1503.80) "oh, boom, like a lot of sessions are waiting" (1505.06-1508) ... "CPU is not 100%" (1509-1511).
   Source: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d (summary: "At 5,000 idle sessions and 500 DDL tx/s, pg_wait_sampling shows 161 idle-pool sessions on average in a wait [...], 94 percent of them in LWLock:SInvalWrite; a 10 Hz poll of pg_stat_activity that keeps state = 'active' sees 1.7."; shown rounded as "about 160" per forge, 2026-11-11; the brief's "peaks near 1,000" is not shown: no plotted bin exceeds ~600).
20. **20-gregg**, band. Source 25:32.60-25:44.60, edited 24:29.64-24:41.64 (12 s). Dark strip `Brendan Gregg: Linux Performance Tools`, chip `brendangregg.com/linuxperf.html` (optional item 20).
   Words: Nik: "Brandon Gregg" (1532.84) ... "various Linux tools" (1542.20).
   Source: https://www.brendangregg.com/linuxperf.html.
21. **21-ring**, center. Source 26:00.30-26:56.00, edited 24:57.06-25:52.76 (55.7 s). Hero ring (schematic): left a ring of slot ticks with `4,096` / `message slots, fixed`, drawn on "ring buffer"; an orange write head fills slots on "dropping these messages" with `create + drop: ~114 messages`; right a grid of 1,000 session dots that flash in waves on "broadcast", grows to 4,000 on "now to 4,000 sessions" while the ring stays; dots grey with `all idle` on "All idle ones"; ring flashes red on "the queue doesn't change in size". Caption `Schematic`.
   Words: Kirk: "4K ring buffer" (1561.62) "dropping these messages into" (1563.40) ... "It's a broadcast" (1576.14) "not to 1,000 sessions, but now to 4,000 sessions" (1578.96-1583.74); Nik/Kirk: "All idle ones" (1584.00, 1585.62) ... Kirk: "the queue doesn't change in size" (1601.60-1603.06).
   Source: schematic; 4,096 = MAXNUMMESSAGES (https://github.com/postgres/postgres/blob/3d342deeb433060dbea02fdd276656a5563275d5/src/backend/storage/ipc/sinvaladt.c#L123); ~114 messages per CREATE TEMP ... ON COMMIT DROP (2 columns) from https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d § 10 table.
22. **22-information**, band. Source 26:58.90-27:04.90, edited 25:55.66-26:01.66 (6 s). Marker quote `“It's not the work, it's the information.”`
   Words: Kirk: "It's not the work, it's the information" (1619.20-1621.64).
   Source: on air (Kirk).
23. **23-throughput**, center. Source 27:29.60-29:25.00, edited 26:26.36-28:20.88 (114.52 s). Hero throughput, now on a numeric axis (0-80,000 tx/s, ticks every 20,000, gridlines): `Transactions per second` / `PG17, 16 vCPU, 32 clients, synthetic workload`; three bars (Temp table per transaction / One temp table per session, ON COMMIT DELETE ROWS / CTE, no temp table) to true scale (88,531 = 1,300 px, 3,931 = a 58 px stub) pop on "the AI will bring up" without numbers; 88,531 counts up on "88,000" (punch), 3,931 on "less than 4,000", 17,741 and badge `4.5x` on "17,000", badge `about 23x` on "more than four times better". Editor's note strip at the bottom from "It will lead to a lot of dead tuples" for ~10 s: `Editor's note: ON COMMIT DELETE ROWS truncates at commit. No dead tuples.` (approved by the host) Punch at edited 26:45.86.
   Words: Kirk: "the AI will bring up" (1649.72); Nik: "88,000 transactions for CTE" (1669.12) "less than 4,000 for temporary tables" (1672.50) ... "It will lead to a lot of dead tuples" (1704.94) "You need to vacuum" (1706.98) ... "17,000 transactions in this synthetic" (1721.46); Kirk: "more than four times better" (1749.54) ... "they have their place" (1767.56).
   Source: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d (§ 5 key numbers, ceiling runs, PG17, 32 clients, median of 4 runs: churn 3,931, reuse_ocdr 17,741 (4.5x), cte 88,531 (about 23x) tx/s). Editor's note: https://www.postgresql.org/docs/current/sql-createtable.html (ON COMMIT DELETE ROWS: "Essentially, an automatic TRUNCATE is done at each commit.").
24. **24-select-t1**, center. Source 30:36.70-32:14.00, edited 29:32.30-31:08.76 (96.46 s). A real psql terminal (PostgreSQL 18.6): each statement is typed character by character (typing bursts in `24-select-t1-typing-bursts.json`), Enter, then psql's output verbatim from a real session (`video/overlays/psql18-session.txt`), with scrollback. `select * from t1;` (output on "Select star from this table"), `select t1 from t1;`, `select array(select t1 from t1);` (Enter and a yellow flash on the array row = the punch, 2 s before Kirk's "Oh, wow"), `select t1 from unnest(array(select t1 from t1)) t1;` (on "You can unnest it"), `select (t1).* from unnest(array(select t1 from t1)) t1;` with `(t1).*` highlighted (on "T1 in parenthesis.star"). Table t1: (1, Nik, on air), (2, Kirk, on air), (3, Michael, vacation). Punch at edited 30:25.00.
   Words: Nik: "see it in the center" (1836.80) "Select star from this table" (1844.32) "select T1 from T1." (1860.88) ... "select array," (1884.06); Kirk: "Oh, wow." (1891.22); Nik: "single scalar value" (1900.20) "you can undo it dynamically" (1909.0); Kirk: "You can unnest it" (1912.20); Nik: "T1 in parenthesis.star" (1918.02) "your columns back" (1921.26).
   Source: on air (Nik, Kirk); a real interactive psql session on PostgreSQL 18.6 (postgres:18 image, 2026-11-11), output verbatim: video/overlays/psql18-session.txt.
25. **25-unlogged**, band. Source 33:15.00-33:22.00, edited 32:09.76-32:16.76 (7 s). Marker quote `“We've switched to using unlogged tables.”`, chip `Docs, CREATE UNLOGGED TABLE: not written to WAL, not crash-safe` (optional item 25).
   Words: Kirk: "we've switched to using unlogged tables" (1995.28-1997.86).
   Source: on air (Kirk); https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-UNLOGGED ("Data written to unlogged tables is not written to the write-ahead log ... However, they are not crash-safe").
26. **26-takeaway**, band. Source 34:38.30-34:43.80, edited 33:30.50-33:36.00 (5.5 s). Takeaway marker `Don't use temp tables.` (2 of 3).
   Words: Nik: "Just get rid of temporary tables" (2078.84-2080.58).
   Source: on air (Nik), the episode takeaway (2 of 3).
27. **27-brief**, center. Source 35:11.50-35:24.00, edited 34:03.70-34:16.20 (12.5 s). The brief's cover (title only; the metadata row is cropped out), URL line `console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d`.
   Words: Nik: "check out, uh, the brief" (2112.32) "at the very end, there are ideas" (2115.92) "for Postgres itself" (2121.04-2122.36).
   Source: https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d (cover, V6.1).
28. **28-tom-lane**, center. Source 36:37.10-37:02.00, edited 35:29.30-35:54.20 (24.9 s). Two shots: GitHub commit fad153e (Tom Lane, Jun 19 2008), title underlined on "Tom Lane in 2008"; then the brief's § 13 idea 3 "Size the queue with the installation", underlines on "A size derived from max_connections, or a separate setting".
   Words: Nik: "heavily touched by Tom Lane in 2008" (2200.56-2202.58) ... "this, uh, maximum messages" (2212.12) "could depend on max connections" (2217.64) "could be a separate, uh, setting" (2220.22-2221.94).
   Source: https://github.com/postgres/postgres/commit/fad153ec45299bd4d4f29dec8d9e04e2f1c08148 (Tom Lane, 2008-06-19, "Rewrite the sinval messaging mechanism to reduce contention and avoid unnecessary cache resets", first in REL8_4_BETA1; GitHub shows his mirror handle tglsfdc); https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d § 13 idea 3 "Size the queue with the installation ... A size derived from max_connections, or a separate setting".
29. **29-takeaway**, band. Source 37:31.60-37:36.80, edited 36:23.48-36:28.68 (5.2 s). Takeaway marker `Don't use temp tables.` (3 of 3).
   Words: Nik: "mitigation here remains just don't use temp tables" (2253.04-2254.52).
   Source: on air (Nik), the episode takeaway (3 of 3).
30. **30-dont-do-this**, center. Source 37:37.00-37:52.50, edited 36:28.88-36:43.94 (15.06 s). Title and contents of the wiki page; nothing highlighted (no temp-table entry yet).
   Words: Kirk: "updating the don't do this wiki" (2257.60-2259.20) ... "in doing that. So yeah." (2272.48).
   Source: https://wiki.postgresql.org/wiki/Don%27t_Do_This (no temp-table entry yet on 2026-11-10; Kirk plans to add one).
31. **31-discard-all**, band. Source 38:39.00-38:56.60, edited 37:29.40-37:47.00 (17.6 s). Dark strip `Session pooling: DISCARD ALL drops temp tables`, chip `PgBouncer server_reset_query, default DISCARD ALL`.
   Words: Kirk: "it's gonna issue a discard all" (2322.60-2324.02) ... "drops all your temp tables" (2334.98-2336.34).
   Source: https://www.pgbouncer.org/config.html (server_reset_query, "Default: DISCARD ALL", session pooling only by default); https://www.postgresql.org/docs/current/sql-discard.html (DISCARD ALL includes DISCARD TEMP).

## Dropped

- Item 13 (optional), global temporary tables thread or CommitFest entry: not verified in time (the CommitFest search redirects for automated clients), so not shown.
- Item 5 has no thumbnail: the postgres.fm episode page has no YouTube link to take one from; a dark strip with the episode URL instead.
- The v1 captures of the brief (CPU/IO list, Fig. 4.1, § 5 numbers) are replaced by house blocks built from the same numbers; the TOC capture stays dropped.
- Forge addition C ("Limit: serialized catalog and file work, not sinval" for the 3-4k ceiling) is not shown: optional, and the throughput card does not explain why the bar is short.
- No bystander loss number (Fig. 4.1 says 27-29 %, the forge notes 24-28 %).

## Open items, resolved

- 16:29 (source 16:22-16:36), whisper large-v3-turbo on the clip: Nik says "snapshot invalidation, catalog snapshot invalidation". The card (11-layer3) says `sinval = shared invalidation`, the meaning of sinval in the source; it does not repeat the on-air wording. No Editor's note proposed; the host may want one.
- "~114 messages": in the live V6.1 § 10 table ("CREATE TEMP t(id int, v text) ON COMMIT DROP, 2 columns: about 114") and § 4 ("500 x about 114"). Shown on 21-ring.
- SInvalWrite percentages: live V6.1 § 4 table C and the claims table: 1.3 / 53.6 / 86.5 / 91.1 percent, shown as the brief's prose rounds them, 1.3 / 54 / 86 / 91 %, on 17-cliff (forge confirmation).
- Editor's note (23-throughput): docs, CREATE TABLE, ON COMMIT DELETE ROWS: "All rows in the temporary table will be deleted at the end of each transaction block. Essentially, an automatic TRUNCATE is done at each commit." Wording on screen, approved by the host: "Editor's note: ON COMMIT DELETE ROWS truncates at commit. No dead tuples." The forge agent confirms it from the source (heap_truncate at commit: no new relfilenode, no catalog row, no dead tuples).
- Michael's avatar: not a placeholder. His X profile picture is a plain green image (the profile page and pbs.twimg.com serve the same); the capture is correct. Bluesky has the same post if a different look is wanted.
- Michael's product line: the default card shows the whole post; `01-michael-short.mov` is the crop without the product line, ready to swap in the manifest.
- PG19 RC2: tagged 2026-11-09, not yet announced; no note.

## Not shown, by rule

No GitLab work items or MRs, storage paths or hostnames. The brief's cover metadata row is cropped out of the title capture.
