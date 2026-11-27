# Episode 198 (PGAIBench): X thread

DRAFT v1, 2026-11-27. Nothing is posted. Nik posts from his accounts. Rules (`tools/podcast-edit/PROMOTION.md`): numbers in the first line; no link in the first post (links in the last reply); one media item per post; no emojis; only our products named (PGAIBench, DBLab), models described generically. LinkedIn variant: [`linkedin.md`](linkedin.md).

Handles: Nik https://x.com/samokhvalov, the show https://x.com/PostgresFM. Kirk has no X account on https://postgres.fm/people (checked for episode 197), so plain "Kirk Wolak". Michael is not on this episode.

Before posting: replace `VIDEO_ID` with the YouTube id, and check that https://postgres.fm/episodes/pgaibench returns 200 (404 on 2026-11-27, before the page exists). Character counts are X counts (a link = 23; limit 280).

Media (review folder `for-nik/`, not in git): the YouTube thumbnail `32-thumb-b-let-ai-touch-production.png`; the speaker clip `67-social-clip-kirk-mistakes-at-scale.mp4` (1080x1350, 28.6 s, burned captions, ends on postgres.fm). Overlay stills come from the final video at the given times.

---

### 1/ First post (no link) — 273 chars — media: the speaker clip (Kirk, "I don't want AI to automate my ability to make mistakes at scale")

```
PGAIBench v0.2, 10 AI models changing live Postgres clusters under load: acting alone, they made 13 harmful changes in 408 live primary changes.

Replayed offline through AAA (Analyst, Auditor, Actor), 12 of the 13 would have been blocked.

New Postgres FM with Kirk Wolak.
```

### 2/ Reply — 202 chars — media: still of the C18 restart overlay (final video 16:29 chapter)

```
One task, 5 of 5 runs: a top model restarted Postgres nodes that did not need a restart. Each restart meant client errors on both nodes, about 3 s.

It was not a weak model. It was an overconfident one.
```

### 3/ Reply — 199 chars — media: still of the clone-gate overlay (final video 23:51 chapter)

```
The cheapest guard has no AI in it: rehearse every change on a live clone first.

That gate alone stopped 6 of the 13 harms (46.2%), at zero AI cost. It halts the change; it does not teach the model.
```

### 4/ Reply — 270 chars — media: still of the AAA scene (final video 32:41 chapter)

```
AAA: an Analyst proposes, an independent Auditor approves, sends back or rejects, and a deterministic Actor rehearses on a clone and applies only approved steps.

Offline replay (in-sample): 12 of 13 harms blocked, 377 of 378 safe or unclassified changes still approved.
```

### 5/ Reply (links) — 187 chars — media: the YouTube thumbnail

```
Would you let AI run DDL on your production Postgres?

PGAIBench v0.2: https://pgaibench.dev
Watch: https://youtu.be/VIDEO_ID
Listen: https://postgres.fm/episodes/pgaibench
Post: https://postgres.ai/blog/20261123-pgaibench
```

## Number check

All numbers are from the post https://postgres.ai/blog/20261123-pgaibench and the YouTube description (`../notes/youtube-description.edited.txt`), which were checked against the post, the v0.2 run logs and the preregistration.

| Post | Number | Source |
| --- | --- | --- |
| 1 | 10 models; 13 harmful changes in 408 live primary changes | post, headline result; description line 5 |
| 1, 4 | 12 of 13 blocked in the offline replay through AAA; 377 of 378 safe or unclassified still approved | post, AAA replay; description line 5 (retrospective, in-sample) |
| 2 | 5 of 5 runs of one task (C18); about 3 s of client errors per restart, both nodes | post, C18; correction (16:26, 17:09, 20:35) in `../notes/notes.edited.md` |
| 3 | clone gate stopped 6 of 13 harms (46.2%); it halts the change, no feedback to the model | post; correction (25:11) |

Facts without numbers: "overconfident" is Nik on air (final video 20:49 chapter); "Would you let AI run DDL on production?" is the chapter at 05:00.
