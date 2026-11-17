# Episode 197 draft: cut list with draft-video times

Video: `preview/episode-197-draft.mp4` (not in git; no cold open, it starts at the episode). The "draft video" column is where the cut now sits in that video (the jump point). The "source" column is the Zoom recording time. To restore a cut, say its id ("restore c12").

Source 58:41.5 -> draft 51:51.2. Judgment cuts: 43 of 48 rows applied; the toolkit's automatic filler, repeat, false-start and pause cuts are listed in the full cuts file.

| id | category | draft video | source | cut s | removed (Scribe words) | why |
| --- | --- | --- | --- | --- | --- | --- |
| c01 | head | 00:00.0 | 00:00.0 | 38.2 | (head/tail) | pre-show: disk space, Rust, 'your turn to introduce' |
| c02 | rambling | 00:41.3 | 01:21.1 | 48.3 | and it's, um- I, I can tell. I remember when we we met a couple of months ago in London, I was surprised. Like, you look like you're on vacations right now. think in the center people who watch YouTube- [laughs] can see  | off-topic: London meeting, Michael's looks, weather |
| c03 | rambling | 01:20.9 | 02:49.2 | 11.8 | have no idea. I don't follow. It was a joke. I, I, I stopped playing games after COVID, so yeah. Good. So let's talk about it. Uh, where to start? | after the GTA joke lands; keep the joke and Michael's quip |
| c04 | hedge | 03:48.4 | 05:32.3 | 4.9 | I, I don't, I don't think... Like, for me personally, | turn-start hedge; start at 'When I was reporting some bugs' |
| c05 | hedge | 04:34.6 | 06:23.9 | 5.4 | I don't know, like, it's good idea to compare with previous years, but definitely... | hedge; keep 'for example, I just checked it yesterday' |
| c06 | rambling | 05:00.4 | 06:56.1 | 24.2 | and I just didn't want it. And, uh, at some point, especially af- after Andre- Andres Freund said, like, since every my message where I used AI didn't check very carefully with my hands, it, it was an experiment. I'm ac- | garbled and about a colleague's private reaction; resume at 'Like, nineteen is coming, so I decided stop pushing' |
| c07 | hedge-trim | 05:19.4 | 07:39.3 | 4.1 | And, uh, I'm pretty sure we could find more bugs. Like, I, I'm not pretty sure. | keep 'I hundred percent sure. Could find more bugs.' (the claim, stronger) |
| c08 | rambling | 05:34.7 | 07:59.1 | 3.6 | This is how things look like right now. Yeah. | trailing filler |
| c09 | fix | 07:24.3 | 09:52.9 | 0.8 | Halloween | APPROVED by Nik. Was optional: drop the wrong date word; 'this scary list from Robert Haas' stays correct (removes the CORRECTION note) |
| c10 | rambling | 07:30.8 | 10:00.5 | 1.5 | whom? Was it Andres? / Or- No, / Or- No, / right? | name search crosstalk; keep 'from Robert Haas' |
| c11 | rambling | 07:33.6 | 10:04.6 | 10.5 | And it, this triggered me, like I started putting more AI to bug f- bug find- findings. And I think right now it's good point that, uh, maybe, like, | garbled start; keep 'it was from Tomas Vondra, the blog post...' |
| c12 | rambling | 08:07.2 | 10:49.5 | 9.4 | So this could be like overall shape will be better. Like, it's interesting, right? So. There's an argument, | trailing filler |
| c13 | hedge | 08:42.9 | 11:34.9 | 18.8 | Yeah. Yeah. But, but, but actually for me it's, it's different. Like we, in spring already started to find bugs and report. I just didn't pull- a lot of attention feature freeze? Uh, it was before- Spring feature freeze. | feature-freeze timing tangle with 'I don't remember details'; resume at 'But Opus 4.8 was already quite good' |
| c14 | rambling | 09:21.3 | 12:32.7 | 5.5 | and, and yeah, and, um, so things should be transformed. But, | keep 'maybe let's talk about features' |
| c15 | rambling | 12:30.3 | 15:48.9 | 15.5 | What do you think about like, like it, it feels to me little bit that using logical for this job probably, uh, it's not, it won't work in most, in all cases because, like do you think p- in other word, like let me ask di | false starts; keep 'Do you think pg_repack will be over with this release...' (the logical point comes back at 17:30) |
| c16 | rambling | not cut | ~17:40 | 0 | Ja en dat onze | NOT APPLIED: no words matched in the Scribe transcript (noise in the bot transcript only) |
| c17 | rambling | 14:24.3 | 18:03.3 | 5.0 | it's just, like, not convenient and there is some, there is something that can be improved there. | rambling; keep 'Like, it's password and so on.' then 'I also think...' (veto to keep 'feels insecure') |
| c18 | rambling | not cut | ~18:38 | 0 | So there are some edge cases Yeah. Yeah. Yeah. And and | NOT APPLIED: no clean pause after it (the words run together) |
| c19 | rambling | 15:13.7 | 18:57.8 | 3.2 | now, and, uh, yeah. You know it, right? | filler after the pgcompacttable idea |
| c20 | rambling | 15:30.4 | 19:17.8 | 5.9 | Yeah. actually... I was going to... was thinking of using it for a, a friend and, | Michael false starts; keep 'Who's on ... they don't have pg_repack' |
| c21 | rambling | 16:20.6 | 20:14.3 | 24.3 | think I just... I have an additional reason why this idea might be resurrected, but we will discuss it separately. There is interesting topic. Uh, we will talk about it separately anyway. Yeah, so- / think I just... I ha | teaser said twice, no content |
| c22 | rambling | 16:24.8 | 20:30.9 | 6.2 | Yeah. Well, I, I like that listen to five, which almost in my list of don't use it. | false start; keep 'You know, my list of don't use it: subtransactions and temp tables...' |
| c23 | rambling | 17:58.5 | 22:11.2 | 4.4 | With this improvement, right? It's improvement. It's great that... | repeats; keep 'It's great to see the progress here.' |
| c24 | rambling | 20:14.7 | 24:33.5 | 4.1 | No. [laughs] So, so yeah, that's my take on it. | Kirk trailing filler |
| c25 | rambling | not cut | ~24:58 | 0 | Right? So | NOT APPLIED: the removed words are not where the cut would be (So.) |
| c26 | rambling | 22:55.1 | 27:20.3 | 6.4 | Yeah. We... Last week, we, we, when we, like, we, we... In our hacking sessions, we, we... | false starts; keep 'Session which led to development of pgroast' |
| c27 | rambling | 23:19.6 | 27:51.4 | 5.4 | And, uh, I have, like, probably we should have a separate discussion about that as well, but | keep 'I have quite challenging experience...' |
| c28 | hedge-trim | 26:43.6 | 31:21.8 | 1.1 | Yeah. | keep 'Our testing found some overhead from using advice, around ten percent. So it's not for free.' (number is a CLARIFICATION: ~13%) |
| c29 | hedge | 27:49.7 | 32:31.6 | 2.7 | just definitely can be more testing. I would, | hedge and false starts; keep 'I will turn on track_planning in pg_stat_statements' |
| c30 | rambling | 28:13.7 | 32:58.2 | 0.4 | Yeah. | trailing filler |
| c31 | rambling | 29:45.7 | 34:33.0 | 4.2 | What else? What else? | trailing filler |
| c32 | tech | not cut | ~36:44 | 0 | פה / anything / Immediately received. | NOT APPLIED: no clean pause after it (the words run together) |
| c33 | hedge | 33:30.3 | 38:26.0 | 4.8 | But in some cases, I guess, uh, it can be beneficial to use. | second copy of the same hedge; the first ('in some cases, I see it can be beneficial') stays |
| c34 | hedge-trim | 38:06.0 | 43:11.0 | 0.8 | if you use it. | keep 'extended statistics can now be dumped and restored' |
| c35 | rambling | 38:20.8 | 43:26.6 | 9.4 | Maybe all, yeah. Maybe all. What kind of statistics do have? Regular, right? [laughs] Extended. Uh, extended. What else, right? So I, I'm, I'm looking- All extended. | search for the word on air; veto if Kirk's 'stick with regular and extended' needs the lead-in |
| c36 | hedge-trim | 38:35.9 | 43:51.2 | 10.5 | Yeah. I'm looking at it right now. / but I don't see support, and pg_restore I hope is just the same, like, just data and can restored to pg statistic, right? So if you / think so. | the pg_restore case: keep 'pg_dump includes restorable extended statistics ... if you can dump, you should be able to restore it.' The guess is right (pg_restore restores them), so the note becomes 'dump with --statistics' only |
| c37 | rambling | 39:20.0 | 44:46.3 | 9.7 | A lot of good small stuff which I will benefit personally, uh, uh, myself, like, so it's, it's great. Good? | filler |
| c38 | hedge | 42:08.0 | 47:49.0 | 0.6 | I guess | turn start: 'We covered all our favorite features.' |
| c39 | rambling | 42:11.3 | 47:52.9 | 4.9 | So as usual, like, recommendation is to... Like, | false start; keep 'I think recommendations would change as well' |
| c40 | rambling | 43:04.3 | 48:50.7 | 5.5 | As, as usual, testing on actual clone is, like, is great because | trailing; Michael's 'synthetic workloads' follows |
| c41 | tech | not cut | ~49:57 | 0 | We hang I was just | NOT APPLIED: no clean pause before it (the words run together) |
| c42 | hedge | 44:09.0 | 50:01.5 | 1.1 | I, I guess my, | keep 'My recommendation, like, usually was wait until dot one, dot two.' |
| c43 | rambling | 46:45.6 | 52:41.4 | 9.6 | but I still feel like lot of can be improved. Nobody has the- Right whole thing yet. So, yeah. For, for ours- | trailing; veto to keep 'Nobody has the thing yet' |
| c44 | tech | 46:45.6 | 52:41.4 | 13.0 | but I still feel like lot of can be improved. Nobody has the- Right whole thing yet. So, yeah. For, for ours- / exerci- apologize, / So sorry, Michael. Go / it's it's | crosstalk from lag; keep Kirk's point and Michael's 'I think I understand why we're calling it plan flips' |
| c45 | tech | 48:01.4 | 54:11.5 | 15.7 | your workload has. Like, it's a big topic. It's also like, how many? Uh, you're... Yeah, you're muted. Muted. Muted. You are muted. [laughs] Totally cut out. Sorry about that. Um, | Kirk was muted; keep 'do you know how many query IDs you actually have?' then 'So, yeah, that's a great question.' |
| c46 | rambling | 50:43.1 | 57:09.8 | 5.7 | it's a, it's a, it's challenging. That's the problem. Yeah. So | filler |
| c47 | tech | 51:43.0 | 58:17.1 | 1.9 | Huh? / Happy New Year. | lag repeat; keep the first 'Happy New Year, Michael.' |
| c48 | tail | 51:51.3 | 58:27.2 | 14.3 | (head/tail) | after the sign-off |

Judgment cuts total: 384 s.

## On-screen notes in the draft

| draft video | tag | text |
| --- | --- | --- |
| 19:26.2 | CLARIFICATION | Note: the score weights are server-wide; see pg_stat_autovacuum_scores. |
| 21:00.1 | CLARIFICATION | Note: parallel autovacuum is off by default; enable with autovacuum_max_parallel_workers. |
| 25:50.8 | CLARIFICATION | Note: pg_stash_advice keeps advice per query ID on the server; pg_dump does not include it. |
| 26:43.6 | CLARIFICATION | Note: about 13% in our test, with advice generated for every query, on a trivial query (small test host). |
| 35:14.4 | CLARIFICATION | Note: on x86-64 (CPU time-stamp counter). |
| 38:05.0 | CLARIFICATION | Note: it is in the 19 release notes: "Allow pg_dump to include restorable extended statistics". |
| 38:32.7 | CLARIFICATION | Note: pg_restore restores them too (dump with pg_dump --statistics). |
| 40:11.8 | CORRECTION | Correction: these settings cannot be set on a table. Check roles, databases and functions. |
| 40:32.8 | CLARIFICATION | Note: on a role or database, pg_upgrade itself fails; in the 19 config file, 19 does not start. |

## How this draft was made

- Cuts: `judgment.draft.json` rows re-anchored on the ElevenLabs Scribe word transcript, plus the toolkit's automatic filler, repeat, false-start and pause cuts (`tools/podcast-edit` detect.ts and render.ts).
- Draft only: the toolkit's "heard as a jump" check was relaxed (join score 9 instead of 4, level step 25 dB instead of 10), so every judgment cut is in the video for review. Some joins can sound abrupt. The final render uses the normal check, which can put some of these cuts back.
- Picture: `layout.ts` with the shades theme and the episode 195 framing (three faces in a row, samograph tile small at the bottom right). No title card, no music, no end card.
- On-screen notes: still PNG cards, 8 s each, from `notes/corrections.md`. Note times map the on-air time to the recording with a fixed offset of about 36 s, so a card can be a few seconds early or late.
- c09 ("Halloween") is approved; its correction card is removed.
