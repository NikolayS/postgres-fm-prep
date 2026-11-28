# Episode 198 (PGAIBench): LinkedIn post

DRAFT v1, 2026-11-27. Nothing is posted. Nik posts from his account. Numbers in the first line; links in the first comment; no emojis; only our products named. Numbers: see the check in [`x-thread.md`](x-thread.md#number-check).

Tag: type "@" and pick Kirk Wolak (https://www.linkedin.com/in/kirk-wolak-7706737/) in the editor.

Media, in this order: the speaker clip `67-social-clip-kirk-mistakes-at-scale.mp4`, then the YouTube thumbnail `32-thumb-b-let-ai-touch-production.png` (review folder).

Before posting: check that https://postgres.fm/episodes/pgaibench returns 200.

## Post

```
PGAIBench v0.2: 10 AI models changed live two-node Postgres 18.7 clusters under load. Acting alone, they made 13 harmful changes in 408 live primary changes.

New Postgres FM episode, out now. Kirk Wolak and I talk about whether AI can safely change production Postgres. What we found:

- One task, 5 of 5 runs: a top model restarted nodes that did not need a restart. Not a weak model, an overconfident one.
- The cheapest guard has no AI in it. Rehearsing every change on a live clone stopped 6 of the 13 harms (46.2%).
- AAA: an Analyst proposes, an independent Auditor approves, sends back or rejects, and a deterministic Actor rehearses on a clone and applies only approved steps. In an offline, in-sample replay, 12 of the 13 harms were blocked, and 377 of 378 safe or unclassified changes were still approved.

Kirk's rule: "I don't want AI to automate my ability to make mistakes at scale."

Would you let AI run DDL on your production Postgres? Links in the first comment.
```

## First comment

```
PGAIBench v0.2: https://pgaibench.dev
Watch: https://youtu.be/tXzR8dKueVA
Listen (any podcast app): https://postgres.fm/episodes/pgaibench
Post: https://postgres.ai/blog/20261123-pgaibench
```
