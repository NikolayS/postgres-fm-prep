# Episode 197 (Postgres 19): edit guidance and first-pass cut list

Nik's guidance for the main video edit (2026-11-17). The edit itself has not started. Nothing is cut until Nik approves the cut list and the first preview.

## Guidance

1. **Cut the BS heavily:** rambling, filler, false starts, off-topic bits.
2. **Cut Nik's hedges** ("I'm not sure", "I don't know if", "maybe I'm wrong", "I guess", "I think so"). He does not want to sound unsure too often. Where a hedge carries content (a guess that turns out right, a number with "right?"), keep the claim and drop only the hedge (category `hedge-trim`).
3. **Cut tech trouble:** the stretch where Kirk was muted and we pointed it out, lag crosstalk, "can you hear me", repeats caused by lag.

These come on top of the usual podcast-edit rules (tools/podcast-edit/SKILL.md): fillers, repeats, cut-off words, pauses, head and tail. Never cut a technical point, a factual correction, or a joke that lands.

## Source and times

- Source: the Zoom recording `2026-11-17 10.02.00 .fm recording/video1398514958.mp4` (58:41.5). It starts 38 s before Michael's "Hello, and welcome".
- **Source time = on-air time + about 36 s.** Whisper on the full file puts "Hello and welcome" at 0:38.4 and gives offsets of 32 to 40 s at 7 points through the episode (Deepgram chunk times are coarse), so each source time is good to about 5 s. The earlier pre-show chatter (about 11 min) is not in the recording; its first 38 s are.
- The cut list below is a first pass on the samograph (Deepgram) transcript, so the words are Deepgram's and the times are good to a few seconds. Durations are estimates from word counts. In the edit pass: transcribe with Scribe, re-anchor each row on the Scribe words in `review.txt`, then run `detect.ts` with the judgment.
- Machine-readable draft: [`../video/edit/judgment.draft.json`](../video/edit/judgment.draft.json). Its categories can be vetoed as a group, for example `render.ts ... --keep hedge` or by row id (`--keep c07`).

## Summary

| Category | Cuts | Est. time saved |
| --- | --- | --- |
| Rambling, filler, false starts, off-topic (`rambling`) | 29 | 238 s |
| Nik's hedges, clean cuts (`hedge`) | 7 | 50 s |
| Hedges that carry content, trimmed (`hedge-trim`) | 4 | 25 s |
| Tech trouble: mute, lag crosstalk (`tech`) | 5 | 28 s |
| Head (pre-show in the recording) and tail (after the sign-off) | 2 | 50 s |
| Optional fix (`fix`, "Halloween") | 1 | 1 s |
| **Total** | **48** | **about 392 s (6 min 32 s)** |

Mechanical fillers, repeats and long pauses found by `detect.ts` come on top; in 196 they saved several more minutes.

## Rambling, filler, false starts, off-topic

| id | on air | source | est. s | cut (Deepgram words) | why |
| --- | --- | --- | --- | --- | --- |
| c02 | 00:43 | 01:19 | 49 | I can tell I remember when we we met a couple of months ago, in London. ... But no, not not the kind of getting sick part of it. | off-topic: London meeting, Michael's looks, weather |
| c03 | 02:10 | 02:46 | 12 | Yeah. I I have no idea. I don't follow. It was a joke. I I I stopped playing games after COVID. So... Yeah. Good. So let's talk about it. Where to start? | after the GTA joke lands; keep the joke and Michael's quip |
| c06 | 06:24 | 07:00 | 26 | And at some point, especially after under... Andres Freud said, like, since every my message where I used the, yeah, I didn't check very carefully with my hands. It's... It was an experiment. And I... Actually, I will I will return to this experiment. Understood. Like, it it it triggered him in terms of like, my transparency that I didn't check it manually. And it also, coincidentally, it was... | garbled and about a colleague's private reaction; resume at 'Like, nineteen is coming, so I decided stop pushing' |
| c08 | 07:18 | 07:54 | 3 | This is how things look like right now. Yeah. | trailing filler |
| c10 | 09:21 | 09:57 | 3 | Was it Andres? / from home? / Or / No. ... Right? | name search crosstalk; keep 'from Robert Haas' |
| c11 | 09:25 | 10:01 | 11 | And it is to get me, like, I started pulling more. AI to bug find... Findings. And I think right now, it's a good point that maybe, like, just | garbled start; keep 'it was from Tomas Vondra, the blog post...' |
| c12 | 10:12 | 10:48 | 5 | So this could be, like... Overall shape will be better. Like, interesting. Right? So | trailing filler |
| c14 | 11:56 | 12:32 | 4 | And and, yeah, and so things should be transformed, but | keep 'maybe let's talk about features' |
| c15 | 14:56 | 15:32 | 17 | What do you think about, like like, it it feels to me a little bit that using logical for this job it's not... It won't work in most... In all cases. Because like, do you think... In other word... Like, let me ask you differently. | false starts; keep 'Do you think pg_repack will be over with this release...' (the logical point comes back at 17:30) |
| c16 | 17:04 | 17:40 | 1 | Ja en dat onze | noise at turn start |
| c17 | 17:24 | 18:00 | 11 | It's like... It feels unsecured and so on. Like, it's just, like, not convenient, and there is some there is something that can be improved there. We should explore it separately. | rambling; keep 'Like, it's password and so on.' then 'I also think...' (veto to keep 'feels insecure') |
| c18 | 18:02 | 18:38 | 4 | So there are some edge cases Yeah. Yeah. Yeah. And and | filler run |
| c19 | 18:15 | 18:51 | 3 | Now. And yeah. You know it. Right? | filler after the pgcompacttable idea |
| c20 | 18:38 | 19:14 | 7 | I had questions. Yeah. I actually... I was going to... I was thinking of using it a a friend and... | Michael false starts; keep 'Who's on ... they don't have pg_repack' |
| c21 | 19:30 | 20:06 | 12 | I think I just... I have an additional reason why this idea might resurrected, but we will discuss it separately. / There is interesting topic. We will talk about it separately anyway. Yeah. So | teaser said twice, no content |
| c22 | 19:52 | 20:28 | 6 | yeah. Well, I I like that listen to which almost in my list of don't use it. | false start; keep 'You know, my list of don't use it: subtransactions and temp tables...' |
| c23 | 21:31 | 22:07 | 3 | With this improvement. Right? It's improvement. It's great that... | repeats; keep 'It's great to see the progress here.' |
| c24 | 23:52 | 24:28 | 3 | No. So yeah, that's my take on it. | Kirk trailing filler |
| c25 | 24:22 | 24:58 | 1 | Right? So | trailing |
| c26 | 26:41 | 27:17 | 6 | Okay. Yeah. We... Last week, we we... When we, like, we our sessions, we we... | false starts; keep 'Session which led to development of pgroast' |
| c27 | 27:13 | 27:49 | 6 | And I have... Like, probably, we should have a separate discussion about as well, but | keep 'I have quite challenging experience...' |
| c30 | 32:17 | 32:53 | 2 | Yeah. Great thing. Yeah. Think. Yeah. | trailing filler |
| c31 | 33:50 | 34:26 | 2 | Percent. So What else? What else? | trailing filler |
| c35 | 42:48 | 43:24 | 11 | Maybe all, yeah, maybe all. What kind of statistics do we have? Regular. Right? / Extended. / Extended. What else? Right? So I... I'm I'm looking / Hello? / Extra extended? / I'm on the... / Super. | search for the word on air; veto if Kirk's 'stick with regular and extended' needs the lead-in |
| c37 | 44:07 | 44:43 | 7 | Good. A lot of good small stuff which I will benefit personally myself. Like... So it's it's great. Good. | filler |
| c39 | 47:14 | 47:50 | 3 | So as usual, like, recommendation is to... Like, | false start; keep 'I think recommendations would change as well' |
| c40 | 48:10 | 48:46 | 9 | but we, like, as as usual, testing on actual is, like, is great because plans will be the same as on / Yeah. And the plans... | trailing; Michael's 'synthetic workloads' follows |
| c43 | 52:00 | 52:36 | 7 | So... But I still feel like a lot of... Can be improved. Nobody has the thing yet. So... Yeah. It's... | trailing; veto to keep 'Nobody has the thing yet' |
| c46 | 56:13 | 56:49 | 4 | it's a it's a... It's That's the problem. Yeah. So anyway, | filler |

## Nik's hedges (clean cuts)

| id | on air | source | est. s | cut (Deepgram words) | why |
| --- | --- | --- | --- | --- | --- |
| c04 | 04:55 | 05:31 | 3 | I don't think like, for me, personally, I... | turn-start hedge; start at 'When I was reporting some bugs' |
| c05 | 05:46 | 06:22 | 6 | I don't know. Like, it's a good idea to compare with previous years, but definitely, | hedge; keep 'for example, I just checked it yesterday' |
| c13 | 10:54 | 11:30 | 25 | It's not after release at this. / Yeah. / Yeah. But but but actually, for me, it's it's different. Like, we... In spring, I already started to find bugs. And report. I just didn't put a lot of attention to it. / When speech... When's feature freeze? Spring. / It was before FuturePress. Before... Well, I don't remember details, actually. Yeah. Yeah. / It's very similar, though, I think, timing... / Similar. Yeah. Yeah. | feature-freeze timing tangle with 'I don't remember details'; resume at 'But Opus 4.8 was already quite good' |
| c29 | 31:59 | 32:35 | 10 | I just... This is my natural reaction to this. Like, just definitely can be more testing. I would I would like, for example, to I would... | hedge and false starts; keep 'I will turn on track_planning in pg_stat_statements' |
| c33 | 37:42 | 38:18 | 4 | But in some cases, I guess, it can be beneficial to use. | second copy of the same hedge; the first ('in some cases, I see it can be beneficial') stays |
| c38 | 47:10 | 47:46 | 1 | I guess | turn start: 'We covered all our favorite features.' |
| c42 | 49:23 | 49:59 | 1 | I I guess my... | keep 'My recommendation, like, usually was wait until dot one, dot two.' |

## Hedges that carry content: keep the claim, drop the hedge

| id | on air | source | est. s | cut (Deepgram words) | why |
| --- | --- | --- | --- | --- | --- |
| c07 | 06:55 | 07:31 | 5 | And I'm pretty sure we could find more bugs. Like, I'm not pretty sure. | keep 'I hundred percent sure. Could find more bugs.' (the claim, stronger) |
| c28 | 30:44 | 31:20 | 2 | As I see ... Yeah ... Right? | keep 'Our testing found some overhead from using advice, around ten percent. So it's not for free.' (number is a CLARIFICATION: ~13%) |
| c34 | 42:30 | 43:06 | 5 | I guess. Right? So this is also good stuff if you use it. Right? | keep 'extended statistics can now be dumped and restored' |
| c36 | 43:12 | 43:48 | 13 | Yeah. I'm looking at it right now. ... but I don't see support in PG restore. I hope it's just the same, like, just data and can be restored to PG statistic. Right? So ... I think so. | the pg_restore case: keep 'pg_dump includes restorable extended statistics ... if you can dump, you should be able to restore it.' The guess is right (pg_restore restores them), so the note becomes 'dump with --statistics' only |

The pg_restore case (c36) is the main one: Nik guessed on air that pg_restore restores extended statistics, and the source confirms it. With the trim, he states it, and the on-screen note at 00:43:12 shrinks to "dump with pg_dump --statistics". Same idea for c28 (keep "around ten percent", the note gives 13% and its conditions).

## Tech trouble

| id | on air | source | est. s | cut (Deepgram words) | why |
| --- | --- | --- | --- | --- | --- |
| c32 | 36:08 | 36:44 | 1 | פה / anything / Immediately received. | crosstalk from lag; keep Kirk's 'about it on a web UI' sentence |
| c41 | 49:21 | 49:57 | 2 | We hang I was just | crosstalk |
| c44 | 52:11 | 52:47 | 6 | It's also not just / For ours? / it's... It's probably... / No. / I apologize, Michael. / Sorry, Michael. Go ahead. | crosstalk from lag; keep Kirk's point and Michael's 'I think I understand why we're calling it plan flips' |
| c45 | 53:32 | 54:08 | 18 | Your workload has. It's a big topic. It's also, like, how many are your... Yeah. You are muted. / Muted, muted, you are muted. / Totally cut out. / Sorry about that. | Kirk was muted; keep 'do you know how many query IDs you actually have?' then 'So, yeah, that's a great question.' |
| c47 | 57:38 | 58:14 | 1 | Huh? / Happy New Year. | lag repeat; keep the first 'Happy New Year, Michael.' |

## Head, tail and the optional fix

| id | on air | source | est. s | cut (Deepgram words) | why |
| --- | --- | --- | --- | --- | --- |
| c01 | 00:00 | 00:00 | 38 | Do it. Yeah. If you have free disk space ... Yeah. I'm... I'd owe you a few, I think. | pre-show: disk space, Rust, 'your turn to introduce' |
| c09 | 09:09 | 09:45 | 1 | Halloween | APPROVED by Nik 2026-11-17. Was optional: drop the wrong date word; 'this scary list from Robert Haas' stays correct (removes the CORRECTION note) |
| c48 | 57:51 | 58:27 | 12 | Good. Recorded. Usually, here jumps out ... Ok. Let me stop. | after the sign-off |

## Kept on purpose (candidates)

- 00:02:52 to 00:04:55, Michael on the delay: long, on topic.
- 00:07:27 to 00:09:09, Kirk on reverts: his view.
- 00:28:13 to 00:30:44, Kirk on hints: the best explainer in the episode; cold-open option B comes from it.
- 00:49:49 to 00:51:29, Kirk's upgrade process: long; a 30 s trim of the dev/staging middle is possible, not proposed.
- Jokes: GTA 6 on November 19, "you meant decades", "I'm off my soap", "DDL in Postgres 20, please".
- 00:45:14, Kirk, "for example, a specific table": dropping these words would remove a CORRECTION note, but only if the join sounds natural. Listed in the JSON as a candidate, not a cut.

## Effect on other drafts

After the edit, shift every time in `notes/` and `social/` (show notes, chapters, cold open, on-screen notes) to the edited timeline. If c09 and c36 are approved, drop the matching on-screen notes in `corrections.md`.
