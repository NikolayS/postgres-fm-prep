# Episode 198 draft: cut list with draft-video times

Video: `review/pgfm198-edited.mp4` in the Zoom recording folder (not in git; no cold open, no title card, it starts at the episode). The "draft video" column is where the cut sits in that video (the jump point). The "source" column is the Zoom recording time. To restore a cut, say its id ("restore c11"). Rows source: `judgment.draft.json` here (phrases), resolved to word times in the review folder.

Source 60:16.7 -> draft 54:10.0. Judgment cuts: 16 rows, all applied; the toolkit's filler, repeat, false-start and pause cuts are in `pgfm198-edited.cuts.md` next to the video.

| id | category | draft video | source | cut s | removed | why |
| --- | --- | --- | --- | --- | --- | --- |
| c01 | head | 00:00.0 | 00:00.5 | 49.5 | (head/tail) | pre-show: recording and transcription icons, talk about the absent co-host |
| c02 | struggle | 02:24.2 | 03:18.6 | 4.5 | So what I'm saying, we want to have, uh, we... Like, the, the vision is, | abandoned starts; resume at 'You know, we both have a friend' |
| c05 | struggle | 08:33.2 | 09:41.0 | 2.2 | Yeah. So you're, you're, you're m-... Yeah. | false start; keep Kirk's 'Sarcasm. Sorry.' and 'Well, it's not sarcasm' |
| c06 | hedge | 09:01.3 | 10:11.8 | 5.1 | And maybe, maybe, it's not 100%, I'm not... I cannot, uh, like claim it, but maybe | hedge; keep 'our role with Michael was there a little bit as well' |
| c07 | hedge | 09:42.8 | 10:58.6 | 4.7 | Of course, maybe it's not like a lot, but it's, it- it's a little bit. Uh, yeah. | hedge after 'This is my true belief' |
| c08 | rambling | 13:51.6 | 15:15.6 | 11.9 | That's why, like, if you show this- Do you wanna share the screen of the summary at all? I know this is a podcast, but o ...  the AI to bring it in when you're ready. But | show-format talk (screen share) and Nik's abandoned start; keep Kirk's 'I think you're getting ready to hit a point...' |
| c10 | struggle | 14:01.6 | 15:39.6 | 20.1 | again, like, human baseline is, is not established here, but these cases are for human errors directly. Uh, it's, it's n ... , did some harmful stuff. Actually, no. Like, | repeat of 12:27-15:06 and a wrong claim corrected at once ('all the AIs did harm': Sonnet had 0); keep 'Right. So the... how it worked' |
| c11 | rambling | 17:20.5 | 19:20.6 | 40.7 | So models, as we say, this is your production. We tell it it's important. Like, this is task. Go and, go and solve this, ... used, uh, downtime of this playground, right? | second telling of the 5-of-5 Fable story (first at 18:13); keep the 'playground' clarification and 'Which reminds me...' |
| c12 | tech | 21:51.1 | 24:34.5 | 41.3 | But when we make changes for, like... Oh, f***, f***ing fly. I, I'm, like, I need to kill it somehow. This- [laughs] thi ... taking care of that, don't worry. So, so, um, | fly and coffee spill (40 s); resume at Kirk's 'So, so, and true to form for you' |
| c14 | hedge | 24:44.4 | 28:12.7 | 1.4 | Maybe I should press more. But | hedge |
| c15 | struggle | 26:26.3 | 29:57.6 | 1.4 | Or- Next... Go ahead. | turn-taking crosstalk 'Or- / Next... Go ahead. / Yeah. / Well-'; resume at 'Testing is hard' |
| c16 | tech | 30:13.7 | 33:48.2 | 126.4 | All good? All right. Yeah. Yeah, yeah, we're good. I just, uh... I'm gonna mute myself for a couple seconds. Keep talkin ... ly would fly away. Fly away. Yeah. All right. | break for the fly (about 2 min); resume at 'So the separation of roles' |
| c18 | struggle | 33:53.5 | 39:38.8 | 2.5 | uh, actually let's talk about the second role is | restart; keep 'The second role is actor' |
| c23 | rambling | 47:37.2 | 53:32.3 | 3.4 | Uh, for me it's... There are several interesting... Let's wrap it up. | on-air wrap cue; keep 'Several interesting findings' |
| c26 | hedge | 50:09.3 | 56:09.7 | 0.4 | I don't know, like, | hedge; keep 'just CI/CD pipeline' |
| c27 | tail | 54:10.0 | 60:14.3 | 1.7 | (head/tail) | after the sign-off: 'Phew.', 'Stop recording' |

Judgment cuts total: 317 s.

## Considered and kept (veto to cut)

- 11:31 (source) "everyone in my team refused to do it": kept: why there is no human baseline yet (content)
- 17:04 (source) "Gemini 4 Neon is not in the results": kept: scope of the results; veto to cut the aside (16:59-17:18)
- 14:15 (source) "it was GitLab, I think": kept: the multi-installation index case
- 22:17 (source) "you see the graphs right now": kept: on-air cue for the Track 1 chart; needs a card at this moment
- 22:34 (source) "if you hear the sound you just heard": kept: explains the overlay sound cue; a card with a sound cue must enter just before it
- 39:07 (source) "right now you see on the, on, in the center of the screen": kept: on-air cue for the AAA diagram
- 20:48 (source) "escalation almost, right?": kept: Kirk's estimate, not a post number (see fact check)
- 47:09 (source) "I don't remember which one.": hedge kept: no clean pause before Kirk's 'Hold up'
- 50:01 (source) "I don't remember exactly which error.": hedge kept: no clean pause before it
- 54:07 (source) "Actor is already used word here, right?": on-air word fix kept: the cut was heard as a jump
- 54:28 (source) "we talked about it before the recording actually": pre-show reference kept: no clean pause before it
- 38:39 (source) "Like, how to say it properly?": kept: Kirk's 'responsibility' correction is part of the exchange

## Notes for captions and the edit

- 14:56 (source): 'Max slots per transaction' = max_locks_per_transaction (caption fix)
- 29:22 (source): 'PG bench AI version 0.2' = PGAIBench v0.2 (caption fix)
- 31:55 (source): 'PGDoc, PGCat' = PgDog, PgCat (caption fix)
- 40:42 (source): 'Jeff' = Jev? check by ear before captions
- 43:49 (source): slip: 'neither analyst nor actor have access to production'; in AAA only the Actor writes to production. Editor's note candidate
- 56:25 (source): 'DBLup4' = DBLab Forge; 'PGI bench' = PGAIBench; 'DBAbench' = DBA-Bench (caption fixes)
- 24:35 (source): swear (fly), inside cut c12
- 59:17 (source): 'David Vintemiya from Supabase': spell the name from the blog acknowledgments
