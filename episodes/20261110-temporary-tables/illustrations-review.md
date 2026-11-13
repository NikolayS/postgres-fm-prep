# Illustrations: expert review and plan v2 (2026-11-10)

[Plan v1](illustrations.md)

Independent review (DevRel / technical-video expert) of plan v1, the transcript, the first-pass stills and episodes 194-195. Plan v2 below supersedes v1. Times are SOURCE times.

## Fix before anything else

- Factual slip on air, 28:19-28:30: Nik says ON COMMIT DELETE ROWS "will lead to a lot of dead tuples, you need to vacuum". Docs: "Essentially, an automatic TRUNCATE is done at each commit" - no dead tuples. Editor's note (item 23).
- "CPU is low" card: 11.7% is the share of active-session samples on CPU, not CPU utilisation (ceiling runs had 37-45% idle CPU). Label as wait-event sample shares.
- Brief captures are upscaled 2-4x and unreadable on a phone: build house blocks from the brief's numbers (as ep 194-195 did).
- Yellow marker only for the takeaway and spoken quotes; facts and credits on dark strips (needs Nik's OK; departs from Band.tsx default).
- Bystander loss: brief Fig. 4.1 says 27-29%, forge notes say 24-28%: show no bystander number.
- Layers: not "3 catalog rows in and 3 out"; say "2 temp tables + 1 index, created and dropped".
- Michael's avatar is a placeholder in the capture; code lines cut at the right in the MAXNUMMESSAGES capture.

## Hero designs

Centre card x 40-1610, y 100-1030, background #1b1b1f, Inter 800 + JetBrains Mono. Colour key: orange #FF7A1A = temp table per transaction; light blue = reused table; yellow #FFD23F = no temp table / key point.

- Layers (12:34, 15:53): five full-width slabs 96 px, text 52 px, tag chip 44 px, each wipes in on its word (12:36, 12:43, 12:59, 13:21). Slot 3 is an empty dashed yellow outline from the start; card exits 13:30 with it empty. At 15:53 the card returns, slot 3 fills yellow with the one punch, rows 0-2B dim to 35%, wait-event names type in mono 56 px on "write"/"read" (16:26-16:28). Row 2A says "Dead tuples", not bloat (Nik on air: "it's not bloat, it's dead tuples").
- 4,096 source line (18:50, 12 s): real GitHub capture of sinvaladt.c at a pinned commit, no line cut, comment "MAXNUMMESSAGES: max number of shared-inval messages we can buffer" in frame. Push-in 1.0 s on "invalidation queue" ending with the #define centred ~64 px; red box around 4096 on "4,096" (18:55); second push on "hard-coded constant" until the number is ~200 px; hold 2 s, exit 19:02.
- Cliff (21:36-22:21): house line chart, x idle sessions 0/1,000/3,000/5,000, y tx/s, dashed grey "target 500"; orange line, values 56 px 502, 502, 274, 127 (red). Flat part draws 21:37, drop to 274 on "contention" (21:45), to 127 on "as you can see from the graphs" (21:47). Grey row at 21:55: SInvalWrite 1%, 54%, 87%, 91%. Wow: a dot rides the line, falls off and rests at 127 on "lie down there on the bottom" (22:11), low thud.
- Ring (26:00-26:56, new): left a ring of slot ticks with "4,096" at 120 px; right a grid of 1,000 session dots. Ring draws on "ring buffer"; orange ticks fill on "dropping these messages" with "create + drop: ~114 messages"; dots flash on "broadcast" (26:14); on "not to 1,000 sessions, but now to 4,000" (26:19) the dot grid quadruples while the ring stays; dots grey on "all idle ones"; ring flashes red on "the queue doesn't change in size" (26:41). Caption "Schematic". Kirk's punchline 26:59 on a band.
- Throughput (27:30-29:25): three horizontal bars to true scale (88,531 = 1,300 px; temp-table bar ~58 px stub = the wow). Pops on "the AI will bring up" (27:31) with bars, no numbers; 88,531 counts up on "88,000" (27:47); 3,931 on "less than 4,000" (27:52); 17,741 + "4.5x" badge at 28:41; "23x" at 29:10. Editor's note caption at 28:26.
- select t1 from t1 (30:38-32:14): one mono 44 px code line edited in place; below a big result grid of a 3-row table (Nik, Kirk, Michael "vacation"). 30:44 select * (3x3 grid); 31:00 star -> t1, rows merge into one cell; 31:30 (2 s pause before Kirk's "Oh, wow") array( ) wraps it, three cells collapse into one with a punch; 31:53 unnest splits back to rows; 31:57 (t1).* highlighted yellow, columns return. Use real psql output.

## Rhythm

Target ~31 inserts in 38:04 (27 without the optional ones); hosts in small tiles ~9 min; punch sound at most five times (layer 3, 4096 box, 127 landing, array collapse, 88,531). Holes in v1: 05:10-12:34, 16:48-18:44, 22:29-24:31, 25:55-27:28.

## Plan v2 (source times)

1. 00:44.6 "right now" - centre screenshot 9 s: Michael's post (X), red underline on "taking a few months off" at 00:47.
2. 01:54.6-02:26 "Oracle has global temporary tables" - centre screenshot: docs CREATE TABLE, Compatibility, Temporary Tables; underlines 01:58 and 02:20 ("requires each session to issue its own CREATE TEMPORARY TABLE").
3. 04:01.2 Kirk, 5 s - band quote "You fall off of them."
4. 05:03.3, 7 s - band quote "Autovacuum doesn't care about your poor temporary tables." + docs chip.
5. 06:31 "UUID version four and version seven", 12 s - dark chip (optional) "Episode: UUIDv4 vs UUIDv7" + own thumbnail.
6. 07:58.2 "don't use temporary tables", 5.5 s - takeaway "Don't use temp tables."
7. 10:41, 6 s - band quote "the client bought 8X the machine".
8. 12:34.4-13:30 - centre staged layers 0/1/2A/2B, slot 3 empty.
9. 14:33.7-14:52 - band number "10M queries/day -> 60M pg_catalog changes/day" (Kirk).
10. 15:04-15:13 - tag with arrow to the robot tile: "not to speak unless directly addressed".
11. 15:53.5-16:48 "layer number three" - centre: "3 Catalog invalidation: the sinval queue", LWLock:SInvalWrite, LWLock:SInvalRead, "sinval = shared invalidation" + docs chip monitoring-stats.
12. 17:50.6, 6 s - band quote "Data is local. A catalog is global."
13. 18:26.5, 10 s - dark chip (optional): global temporary tables pgsql-hackers thread / CommitFest entry (find, check status).
14. 18:50.0-19:02 - full screenshot #define MAXNUMMESSAGES 4096 (pinned).
15. 19:33.2-20:09.5 - band two stages: "Over 16 relations per transaction: LWLock:LockManager", chip "PG18: raise max_locks_per_transaction".
16. 20:17.5-20:40 - centre block "5,000 idle sessions: where active sessions are": LWLock 88.1%, CPU 11.7%, IO 0.13%; caption "Share of wait-event samples. Synthetic workload."
17. 21:36.4-22:21 - centre hero cliff; caption "PG18, 16 vCPU, warm cache, synthetic workload".
18. 23:56-24:20 - band two stages "1,000 idle sessions: 502 tx/s", on "triple" (24:11) "3,000: 274 tx/s"; chip "500 tx/s target, synthetic workload".
19. 24:30.4, 12 s - dark strip "PG14: faster snapshots with many sessions", chip "Andres Freund - postgresql.org/docs/release/14.0".
20. 25:32, 12 s - dark strip (optional) "Brendan Gregg: Linux Performance Tools".
21. 26:00.3-26:56 - centre hero ring.
22. 26:59, 6 s - band quote "It's not the work, it's the information."
23. 27:30.5-29:25 - centre hero throughput, sub "PG17, 32 clients, synthetic workload"; Editor's note at 28:26: "Editor's note: ON COMMIT DELETE ROWS truncates. No dead tuples."
24. 30:38-32:14 - centre hero select t1 from t1.
25. 33:15, 6 s - band quote (optional) "we've switched to using unlogged tables" + docs chip UNLOGGED.
26. 34:36.5, 5.5 s - takeaway "Don't use temp tables."
27. 35:11.5-35:24 "check out the brief" - centre screenshot: brief title/top + URL chip.
28. 36:37.1-37:02 - centre two shots: commit fad153ec (Tom Lane, 2008-06-19, "Rewrite the sinval messaging mechanism to reduce contention and avoid unnecessary cache resets"), then at 36:52 the brief's idea on sizing the queue from max_connections (confirm wording).
29. 37:31.0, 5.4 s - takeaway "Don't use temp tables."
30. 37:37-37:50 - centre screenshot wiki Don't Do This.
31. 38:39-38:53 - dark strip "Session pooling: DISCARD ALL drops temp tables", chip "PgBouncer server_reset_query, default DISCARD ALL".

Open: Editor's-note wording (item 23); listen to 16:29 ("snapshot" vs "shared" invalidation); confirm "~114 messages" and the SInvalWrite percentages are in the live public brief (V6.1). PG19 RC2: tagged 2026-11-09, no note needed.
