# Episode 197 (Postgres 19): cold open draft

DRAFT, 2026-11-17, for Nik's approval. Nothing is cut until Nik approves.

Growth rule from #197: 15 to 25 s, the best line plus a chart, before the title card. The audio version gets the same cold open, or none (decide with the checklist, section 5).

Times are recording times (00:00:00 = Michael's "Hello, and welcome", 18:13:30 UTC) from the samograph transcript. Deepgram gives one time per chunk, so in and out points are good to about 1 to 2 s; set the exact cut on word times (`transcribe.ts`, `find.ts`) when the edit starts. Wall-clock UTC times are given too.

## Option A (recommended): NOTIFY, 200 to 11,000 per second

- **In:** 00:20:59 (18:34:29 UTC), on "And we have some graphs".
- **Out:** 00:21:14 (18:34:44 UTC), after "notifications throughput.", before "So it's like drastic improvements".
- **Length:** about 15 s.
- **Speaker:** Nik.

Transcript excerpt (Deepgram, as heard):

```
00:20:59  Nik: And we have some graphs showing throughput
00:21:02  Nik: Right? So with one thousand listeners from
00:21:06  Nik: two hundred per second, we went to eleven thousand per second.
00:21:10  Nik: And it's great. I mean,
00:21:12  Nik: notifications throughput.
```

On screen: the brief's NOTIFY chart (18.7 against 19 RC2, 1,000 listeners), full frame, with the two bars built on "two hundred" and "eleven thousand".

- Bar labels: "18.7: 200/s" and "19 RC2: at least 11,040/s".
- Chip (bottom): "1,000 listeners, each on its own channel · 8-vCPU dedicated host · 4 notifiers · median of 3 runs · our client was the limit".
- Small line under the chart: "The global lock at commit is still there."
- Sound: the usual centre-card sand strokes, a punch on the second bar.

Why this one: it has a chart and one measured number, and the number is ours (brief v3.0). The words say "eleven thousand"; the chart says "at least 11,040", which is correct and is not a contradiction.

## Option B: Kirk, "hints are the 1975 solution"

Two pieces, hard cut, about 24 s.

- **Piece 1 in:** 00:28:24 (18:41:54 UTC), on "Plan hints to me".
- **Piece 1 out:** 00:28:33 (18:42:03 UTC), after "tell the database".
- **Piece 2 in:** 00:28:54 (18:42:24 UTC), on "It was a great idea".
- **Piece 2 out:** 00:29:09 (18:42:39 UTC), after "into the application."
- **Speaker:** Kirk.

Transcript excerpt (Deepgram, as heard):

```
00:28:24  Kirk: Plan hints to me is the nineteen seventy five solution
00:28:29  Kirk: to having a query that you need to tell the database
   [cut]
00:28:54  Kirk: And the problem is is I want you to hold it right there. It was a great idea.
00:28:58  Kirk: In nineteen seventy five.
00:29:00  Kirk: Okay? The problem is
00:29:02  Kirk: we're we're twenty twenty six, baby. And the reality is
00:29:06  Kirk: you're hard coding the hint usually into the application.
```

Piece 2 starts at "It was a great idea", so the cut drops "And the problem is is I want you to hold it right there." The 00:28:54 chunk holds both; find the word time of "It".

On screen:

- Band card at "1975": `select /*+ IndexScan(o) */ ...` in grey mono, struck through on "twenty twenty six".
- Band card at "into the application": "Postgres 19: pg_plan_advice + pg_stash_advice · a plan per query ID, set from SQL".
- Sound: typing reveal for the band cards.

Why this one: it is funny and stands alone. It has no number and no chart, so it fits the growth rule less well than A.

## Not proposed

00:55:23 to 00:56:13, Nik on the long tail (a one-call-per-second query at a 60 s statement_timeout fills 96 cores). It is strong, but it is 50 s, and a trim to 25 s loses the arithmetic.
