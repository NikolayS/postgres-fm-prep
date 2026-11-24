# Can AI safely change production Postgres?

[All episodes](../../README.md)

## Overview

- **Question:** Can AI safely change production Postgres, and what does it take: PGAIBench results with models acting alone, and the AAA protocol (Analyst, Auditor, Actor).
- **Hosts:** Nikolay Samokhvalov and Kirk Wolak (co-hosts). Michael Christofides did not take part in this recording.
- **Status:** Recorded 2026-11-24 (Zoom, 60:17 raw, about 59 min on air). Edit draft and release text drafts ready for the host's review; no cold open, cards or final compose yet.
- **Recording date:** 2026-11-24, 10:37 PT (18:37 UTC); the show starts at 00:53 of the recording.
- **Episode number:** 198 (to confirm).

## Materials

| Document | Purpose |
| --- | --- |
| [`video/edit/cutlist-draft.md`](video/edit/cutlist-draft.md) | Judgment cuts of the edit draft, with draft-video and source times (vetoable) |
| [`video/edit/judgment.draft.json`](video/edit/judgment.draft.json) | The judgment rows (phrases) behind the draft |
| [`notes/notes.md`](notes/notes.md) | Show notes draft: description, 18 links with times, link check, open items |
| [`notes/youtube-description.txt`](notes/youtube-description.txt) | YouTube description draft with chapters |
| [`notes/summary.txt`](notes/summary.txt) | Transistor summary draft |
| [`notes/fact-check.md`](notes/fact-check.md) | Claims made on air, checked against the published post |
| [`notes/cold-open.md`](notes/cold-open.md) | Cold-open candidates |
| [`notes/illustrations.md`](notes/illustrations.md) | Card plan, with the two moments where the host points at the screen on air |
| [`thumbs/titles.md`](thumbs/titles.md) | Title options and thumbnail concepts |
| [`notes/blog-candidates.md`](notes/blog-candidates.md) | Standard file (empty: the blog post already exists) |
| [`qa.json`](qa.json) | QA gate config for the draft (`EP198_REVIEW` = the recording's `review/` folder) |

## Discussion outline (as recorded)

1. The goal: one engineer responsible for 1,000 clusters; would you let AI run DDL on production?
2. PGAIBench: tasks from real incidents; models acting alone; the 5-of-5 restart task; safety and usefulness.
3. Testing on clones: half of the harms gone with no extra AI cost; why testing is still hard.
4. AAA: separate roles, the Auditor between Analyst and Actor, 13 harms down to 1.
5. Limits and next steps: no human baseline yet, 19 tasks only, GitOps for every change.

## Evidence status

All numbers come from the published post https://postgres.ai/blog/20261123-pgaibench and https://pgaibench.dev/ (v0.2.0, data on the public `v0.2` branch of https://github.com/NikolayS/pgaibench). Claims on air are checked in `notes/fact-check.md`.

## Release checklist

Not started: see [`RELEASE_CHECKLIST.md`](../../RELEASE_CHECKLIST.md). First gate: the host approves the edit draft.
