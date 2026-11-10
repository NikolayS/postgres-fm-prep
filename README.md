# Postgres.FM preparation

Research, study packs, experiment plans and recording notes for individual Postgres.FM episodes.

## Episodes

| Episode | Status | Materials |
| --- | --- | --- |
| Dump/restore done. Now what? (#193) | Published 2026-10-23: [YouTube](https://www.youtube.com/watch?v=0R1BJBzLCoc) · [postgres.fm](https://postgres.fm/episodes/dump-restore-done-now-what) | [Episode overview](episodes/20261020-restore-readiness/README.md) · [Study pack](episodes/20261020-restore-readiness/study-pack.md) |
| UUIDv4 vs UUIDv7 (#194) | Published 2026-10-30: [YouTube](https://www.youtube.com/watch?v=gf8e3JkQ_8M) · [postgres.fm](https://postgres.fm/episodes/uuidv4-vs-uuidv7) | [Episode overview](episodes/20261027-uuidv4-vs-uuidv7/README.md) · [Show notes](episodes/20261027-uuidv4-vs-uuidv7/show-notes.md) · [Illustrations](episodes/20261027-uuidv4-vs-uuidv7/illustrations.md) |
| Extensions on demand (#195) | Published 2026-11-06: [YouTube](https://www.youtube.com/watch?v=7oeAAqU00zk) · [postgres.fm](https://postgres.fm/episodes/extensions-on-demand) | [Episode overview](episodes/20261104-extensions-on-demand/README.md) · [Show notes](episodes/20261104-extensions-on-demand/show-notes.md) · [Illustrations](episodes/20261104-extensions-on-demand/illustrations.md) · [Video](episodes/20261104-extensions-on-demand/video/README.md) · [Social](episodes/20261104-extensions-on-demand/social/README.md) |
| Temporary tables (#196, working title) | Recorded 2026-11-10; edit in progress | [Episode overview](episodes/20261110-temporary-tables/README.md) |

## Repository structure

Each episode lives in `episodes/<YYYYMMDD>-<topic-slug>/`, prefixed with the recording date so the list sorts by time. Keep the topic part short and stable; put the episode number in the overview once confirmed.

The episode's `README.md` is its entry point. Keep its research, study pack, experiment plans, observations and article material together so relative links remain local to that episode. Add an `assets/` directory when there are figures to include.

[The episode template](templates/episode/README.md) provides a starting point. Document names are conventions, not requirements: create only the materials an episode needs.

## Tooling

[`tools/podcast-edit/`](tools/podcast-edit/SKILL.md) is the post-production toolkit for recorded episodes, packaged as a Claude Code skill: cut fillers and false starts with a vetoable cut list, lay out and compose the final video (cards, music, overlays and their sounds), build captions, the podcast MP3, show notes and the Transistor draft. `SKILL.md` is the entry point; [`PROMOTION.md`](tools/podcast-edit/PROMOTION.md) covers the X thread, LinkedIn, animations, speaker clips and the blog post; it runs on Bun and ffmpeg. To use it as a skill, symlink the directory to `~/.claude/skills/podcast-edit`. API keys (`ELEVENLABS_API_KEY`, `TRANSISTOR_API_KEY`) come from the environment only and never belong in this repository.

## Release an episode

To start on a new recording, use [the episode prompt](EPISODE_PROMPT.md). Follow [the release checklist](RELEASE_CHECKLIST.md): edit approval, the YouTube video and its metadata, subtitles, the podcast audio on Transistor, transcript, show notes and research artefacts.

## Add an episode

1. Create `episodes/<YYYYMMDD>-<topic-slug>/` (recording date) and copy the episode template into its `README.md`.
2. Fill in the question, participants, status, deadlines and planned discussion.
3. Add the relevant documents and link them from that overview.
4. Add an entry to the episode table above.
5. As work progresses, distinguish proposed experiments from measured results. Add recording and publication links when available.

## Public material

Keep this repository suitable for public reading. Include technical research, public sources, approved observations and preparation notes. Exclude private communications, credentials, customer information and confidential planning. State the versions, measurement conditions and limits behind technical claims.

Attribute contributors’ positions with a direct link to the original message, author and date beside the paraphrase or quotation. Cite technical facts where they appear, distinguish source evidence from interpretation, and explicitly identify observations whose supporting measurements are not publicly available. A general reading list does not replace claim-level provenance.
