# Overlay plan: Postgres.FM "UUIDv4 vs UUIDv7"

Time base: source = `video2013034834.mp4` (review.txt times); edited = `full-v5-edited.mp4`
via `v3/full-v5-edited.cuts.json` (segmentTimes). Every item is anchored to source word
times; reveal times inside an item are mapped through the cuts too. No freezes (freezeSec 0).
Data: brief "UUIDv4 vs UUIDv7 vs int8 primary keys on Postgres 18" (experiment
uuid-pk-v4-v7-01, CC BY 4.0), https://console.postgres.ai/shared/brief/9fffe2da-00c1-470b-a79d-a210ae2306bc
(URL not shown on screen). Colours: UUIDv4 orange, UUIDv7 yellow, int8 light blue, on every card.

| # | source | edited | dur | type | on-screen text (exact) | data (brief) | SFX |
|---|---|---|---|---|---|---|---|
| 01-uuid-versions | 12:37.3 "UUID version 4" -> 13:09.0 "chunk them by the dashes." | 10:05.4 | 30.4 s | band, two mono lines (custom) | `UUIDv4  8b1f3c5e-2d7a-4c91-b3e8-6f0a9d42c718` (the 4 starts the third group, boxed yellow at "digit 4"); `UUIDv7  01a17e51-80a8-7b3d-9e21-4c6a8d0f5b17` (the 7 boxed at "digit 7"; first 12 hex digits underlined, label `time`) | example values (illustration); v7 = 48-bit Unix ms time first (RFC 9562) | thud x2 at the digit pops, low gain |
| 02-memory-then-graph | 17:43.9 "just consumes all the memory" -> 19:06.5 "integer 8." | 15:07.9 | 82.0 s | center block, 2 phases | Phase A (to "check out the graph"): title `What stays in memory`, sub `1 GiB shared_buffers, 100M rows`; 3 stacked bars `UUIDv4` index 767 MiB / table 50 MiB, `UUIDv7` 89 / 475, `int8` 69 / 485; legend `index`, `table`. Phase B (from "graph"): title `Inserts per second`; one linear chart, x `rows inserted` 0-100M, y `inserts/s` 0-30k; 3 lines drawn left to right; end labels `int8 23.5k`, `UUIDv7 21.7k`, `UUIDv4 13.9k`; one dashed marker at 25.85M (brief: 25.6M to 26.1M) `UUIDv4 index > shared_buffers`; caption `1 GiB shared_buffers, 3 GiB memory cap` | D (r1_summary), G (run 6 small tier, bold mean lines; int8 = box x1, single box) | thud when phase B pops |
| 03-btree | 20:27.3 "here's the difference" -> 21:37.0 "same concept." | 17:49.6 | 69.7 s | center block, new animation | Top: `UUIDv4: random leaf`; small B-tree (root, 2 inner, 8 leaves); keys drop to random leaves. From "doesn't fit in memory": some leaves are `on disk` (dashed); a hit on such a leaf reads it in (`read`), another leaf is pushed out (`evict`). Bottom (from "UUID version 7"): `UUIDv7: always the last leaf`; keys drop only to the rightmost leaf, it fills; at "when you add a page" a new leaf grows on the right. At "auto-increment IDs": tag `same as int8` | §3 mechanism (random leaf vs rightmost leaf) | none |
| 04-same-speed | 22:40.2 "basically the rates of inserts are same" -> 23:06.4 "version 4 degrades." "Yeah, yeah." | 20:00.9 | 26.2 s | band, yellow Marker + sub | `UUIDv7 inserts as fast as int8` / sub `23,458 vs 23,131 inserts/s, same box` | §9, TL;DR 1 (v7 23,458, int8 23,131, run 2 on int8's box) | air (off by default) |
| 05-wal-per-insert | 24:08.3 "which means that WAL is becoming bigger" -> 25:06.4 "It's hard to say because" | 21:27.6 | 57.7 s | center block, 3 bars | title `WAL per insert`, unit `bytes, 80M to 100M rows`; `UUIDv4 1,324`, `UUIDv7 744` (at "UUID version 7"), `int8 745` (at "integer 8"); caption `UUIDv4 dirties more pages, so more full pages go to WAL after each checkpoint.` (brief: 145 vs 40 full-page images per 1,000 inserts) | Infographic B, run 1 | thud when the v4 bar lands |
| 06-just-switch | 34:34.8 "just switch to UUID v7s." -> 34:57.0 "very widely" | 31:48.0 | 22.2 s | band, Marker quote | `"Just switch to UUID v7s."` | quote (on air) | air (off) |
| 07-index-size | 43:48.2 "it's 18 bytes" -> 44:21.2 "It's eight bytes." (Snowflake ID) | 40:54.1 | 32.5 s | center block, 3 bars | title `Primary key index size`, unit `MiB, 100M rows`; `UUIDv7 3,012` sub `16-byte key` (at "index size is bigger"), `int8 2,146` sub `8-byte key` (at "integer eight"), `UUIDv4 3,996` sub `16-byte key` (at "UUID version four") | Infographic C chart values, run 1 at 100M rows; key sizes §6 | thud when v4 lands |
| 08-keep-uuid | 48:11.0 "you don't need to change data type" -> 48:36.7 "decoded with the dates." | 45:13.6 | 25.1 s | band, yellow Marker + sub | `Keep the uuid type. Change only the default.` / sub `uuidv7() is in Postgres 18` | brief "uuidv7() is in Postgres 18" | air (off) |

Hold rule (Nik, 2026-10-28): every item stays at least 20 s, no freezes; holds 22-82 s here.
Spacing: center blocks 02 (15:07.9-16:29.9), 03 (17:49-18:59), 05 (21:27-22:25), 07 (40:54): all more than 60 s apart.
Band items do not overlap center blocks.

## Locked wording for Editor's notes
None. Two on-air slips are handled without a note:
- 43:48 "it's 18 bytes" (two ASR engines hear 18): a UUID is 16 bytes. Item 07 shows `16-byte key`
  under the UUID bars, so the screen is right without an Editor's note. Open item for Nik.
- 23:22 "whole page is compressed": only with wal_compression on (the brief's runs had it off). Nik
  says at 27:31 that compression should be on, so no note.

## Dropped / not used
- Infographic C's "2,260 vs 2,256 MiB on two boxes" (reproducibility point): the hosts talk about
  int8 vs UUID size at 43:48, so item 07 shows the three sizes from the same infographic instead.
- Aurora I/O cost ($514-$542 vs $54-$55 per month, 28:49 and 43:07): the brief labels it an
  illustration, not a measurement, with many caveats. A number card would make it look measured.
- Run 1 fsync latencies (14:30 box story): good story, but one more card in a dense first half.

## Open items
- 43:48 "18 bytes": keep as is with the quiet fix in item 07, or add an Editor's note band?
- Item 02 is long (about 82 s, hosts at the edges) because the chart topic runs from 17:44 to 19:06.
  It can be cut at 18:40 if it feels too long.
