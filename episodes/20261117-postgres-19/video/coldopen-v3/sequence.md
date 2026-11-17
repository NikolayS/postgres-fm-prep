# Episode 197 cold open v3: six-topic montage

Nik's feedback on v2: "wrong moments, quite boring, no dynamics, monotopic". v3 is a fast montage over six different topics with all three hosts and the laughs left in. It ends on a punchline.

Pacing follows the only earlier published cold open, episode 196 (20.8 s: five lines of 1.7-6.5 s, hard cuts, no glue sound, a 0.3 s fade in, a 0.5 s fade out, -16 LUFS). Episodes 193 to 195 had no cold open. The framing is the episode 195 layout (`../coldopen-v2/layout.json`). There is one text strip, for the number only.

Times are source seconds in the Zoom recording (Scribe words). Recording time (00:00 = Michael's "Hello") is the source time minus about 37 s.

## v3 (rendered: `preview/cold-open-v3.mp4`, 34.2 s)

| # | Topic | Who | Bite | Source s | Length |
|---|---|---|---|---|---|
| 1 | GTA VI on Nov 19 | Nik, Kirk laughs | "Because the GTA VI is being released on November 19." [laugh] | 147.80-152.20 | 4.4 s |
| 2 | GTA VI on Nov 19 | Michael | "When would GTA 19 come out? Like a couple of hundred years?" | 165.85-168.99 | 3.1 s |
| 3 | reverts | Kirk | "We have commit fests, and then we had a revert fest" | 507.05-509.72 | 2.7 s |
| 4 | CVEs | Kirk | "10 or 20x the number of CVEs in the same year. Like, that's insane." | 550.20-555.25 | 5.1 s |
| 5 | NOTIFY | Nik | "From 200 per second, we went to 11,000 per second." Strip: "NOTIFY, 1,000 listeners: 200/s → 11,000/s" | 1303.60-1307.92 | 4.3 s |
| 6 | plan hints | Michael | "no-go area for Postgres for years," | 1598.70-1600.75 | 2.1 s |
| 7 | plan hints | Kirk, Michael laughs, Nik | "You said years, I think you meant decades." [laugh] N: "Decades." | 1636.35-1640.10 | 3.8 s |
| 8 | logical replication | Nik | "The only thing left, from among big gaps is just DDL, right?" (the "uh" is cut) | 2807.10-2807.98, 2808.42-2810.88 | 3.3 s |
| 9 | logical replication | Michael, Kirk laughs | "The only thing. That small thing." [laugh] | 2811.90-2814.47 | 2.6 s |
| 10 | logical replication | Nik | "Just DDL and Postgres 20 and that's it." | 2815.62-2818.40 | 2.8 s |

Energy curve: a joke and a laugh, then two fast one-liners (reverts, CVEs), the number, a setup and its punchline with a laugh, then the closing joke between two voices.

## Alternative A: open on the number (about 28 s)

5 NOTIFY → 3 revert fest → 4 CVEs → 6+7 years/decades → 8-10 DDL. The number hooks in the first second. The GTA joke is dropped.

## Alternative B: shorter, ends on Kirk (about 24 s)

1 GTA (Nik + laugh) → 3 revert fest → 5 NOTIFY → 6+7 years/decades → Kirk "So what? It's a Christmas gift now" (577.57-578.75; his laugh follows at 579.9).

The full candidate list is in `../../notes/cold-open-shortlist.md`. Rebuild: `run.sh`.
