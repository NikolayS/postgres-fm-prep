# Episode 197 (Postgres 19): cold-open shortlist

DRAFT, 2026-11-17, text only. Nothing is rendered until Nik picks.

## What worked before

Episode 196 (temporary tables) is the only published cold open (episodes 193 to 195 had none). The first draft was one 10.7 s clip on a chart. It was replaced by a 20.8 s montage of five short lines with hard cuts, and that montage was published:

1. Nik: "Why create temporary tables at all?" (a question, 1.7 s)
2. Nik: "You're basically already falling from the cliff and just lie down there on the bottom." (an image, 5.5 s)
3. Kirk: "Hey, just confirm that you know you have to update your cache here, because somebody created a temp table." (role-play, 6.5 s)
4. Nik: "Less than 4,000 for temporary tables which are created per transaction." (a number, on the chart card, 5.4 s)
5. Nik: "Just don't use temp tables." (the closing punchline, 1.7 s)

The pattern:
- 4 to 5 lines of 1.5 to 6.5 s each, about 20 s in total.
- Two voices that alternate.
- Each line lands on its own: a joke, an image, a strong opinion or a number said with emphasis.
- The montage ends on a short punchline.

Where the episode 197 v1 and v2 drafts fall short:
- Each is one topic, 10 to 24 s of explanation, with nothing that makes you laugh.
- None ends on a punchline.
- v2-3 ("don't wait") and v2-1 (pg_upgrade) are useful advice, not energy.
- The 1975 hints line and the NOTIFY chart are good as single lines, but each was cut too long.

## Candidates

The times are source seconds in the Zoom recording (`video1398514958.mp4`), taken from the Scribe words. The recording time (00:00 = Michael's "Hello") is the source time minus about 37 s.

| # | Speakers | Quote (exact words) | Source s | Rec. | Length | Why it fits |
|---|---|---|---|---|---|---|
| 1 | Nik, Michael | N: "November 19 is very well known release date, but for very different software." ... "Because the GTA VI is being released on November 19." M: "In the current GTA release cycle, when would GTA 19 come out? Like a couple of hundred years?" | 135.10-137.66, 147.86-150.96, 163.48-168.96 | 1:38, 1:51, 2:06 | 3 pieces, about 11 s (6 s without the first piece) | A joke from each of two voices that needs no context. It is a strong first line. |
| 2 | Kirk | "We have commit fests, and then we had a revert fest" | 507.15-509.71 | 7:50 | 2.6 s | A one-line punchline that names the story of this release. |
| 3 | Kirk | "And now we had something like 10 or 20x the number of CVEs in the same year. Like, that's insane." | 548.43-555.09 | 8:32 | 6 s | A big number said with emphasis, plus a reaction. Same role as "less than 4,000" in episode 196. |
| 4 | Kirk | "It's late, and I'm... So what? It's a Christmas gift now, right? ... Happy Thanksgiving, everyone. Here's your new version of Postgres." | 575.19-579.87, 581.09-583.81 | 8:58 | about 7.5 s (or "So what? It's a Christmas gift now" alone, 2 s) | High energy, defiant, funny. The short version is a closer. |
| 5 | Michael, Kirk | M: "this has been a discussion and like a no-go area for Postgres for years" ... K: "You said years, I think you meant decades." | 1596.94-1600.68, 1636.40-1638.76 | 25:59, 26:39 | 2 pieces, about 6 s | A back-and-forth with a punchline: the classic setup and correction. |
| 6 | Nik, Kirk | N: "It should be off by default from very beginning, yes." K: "We turned it off." N: "It, it actually shows lack of testing" | 1936.97-1943.63 | 31:40 | 6.7 s | A strong opinion about JIT that the second voice backs. It has an edge. |
| 7 | Nik | "it takes a little bit of my consulting bread because we always say enable it, but now it's enabled by default. It's... log lock waits." | 2048.31-2055.59, 2057.25-2058.07 | 33:31 | about 8 s (cut "uh, uh") | Self-mocking humour. The reveal ("log_lock_waits") comes last. |
| 8 | Kirk, Nik | K: "You did the right thing, and you're not punished for doing the right thing." ... N: "I'm just not going to use it" | 2182.81-2186.13, 2312.00-2313.28 | 35:46, 37:55 | 2 pieces, about 5 s | A real disagreement about WAIT FOR LSN, with a blunt answer. |
| 9 | Nik, Michael | N: "The only thing left from among big gaps is just DDL, right?" M: "The only thing. That small thing." N: "Just DDL and Postgres 20 and that's it." | 2807.14-2813.62, 2815.68-2818.22 | 46:10 | about 9 s (cut "uh", "Which-", "Yeah") | Dry irony between two voices. On its own it is weak (logical replication is not named), but it is strong as the last line of a montage. |
| 10 | Nik | "What if it was two QPS? You already more than 100 active sessions, and you have only 96 cores." | 3398.60-3405.42 | 56:02 | 6.8 s | Simple arithmetic with a punch, said with emphasis. Same role as a chart number. |

Lines considered and left out: Kirk's "Did you slow down Postgres or something?" to Michael (banter that needs context), Kirk's "200 million rows ... any plan flip is immediately dissatisfied" (flat), and the v2 picks (pg_upgrade, AI reverts, "don't wait").

## A montage in the episode 196 shape (one suggestion)

Five lines with hard cuts, about 21 s:
1. #1, pieces 2 and 3 (GTA VI, then GTA 19): 6.1 s
2. #2, revert fest: 2.6 s
3. #3, 10 or 20x CVEs: 6 s
4. #5, years and decades: 4.4 s
5. #4, "So what? It's a Christmas gift now": 2 s, as the closer

Other closers: #9 ("Just DDL and Postgres 20 and that's it") or #8 (Nik's "I'm just not going to use it").
