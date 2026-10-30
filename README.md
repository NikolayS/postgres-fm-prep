# Postgres.FM preparation

Research, study packs, experiment plans and recording notes for individual Postgres.FM episodes.

## Episodes

| Episode | Status | Materials |
| --- | --- | --- |
| Your restore finished. Is your database ready? | Preparation; additional experiments proposed | [Episode overview](episodes/20261020-restore-readiness/README.md) · [Study pack](episodes/20261020-restore-readiness/study-pack.md) |
| UUIDv4 vs UUIDv7 | Edited; release pending | [Episode overview](episodes/20261027-uuidv4-vs-uuidv7/README.md) · [Show notes](episodes/20261027-uuidv4-vs-uuidv7/show-notes.md) · [Illustrations](episodes/20261027-uuidv4-vs-uuidv7/illustrations.md) |

## Repository structure

Each episode lives in `episodes/<YYYYMMDD>-<topic-slug>/`, prefixed with the recording date so the list sorts by time. Keep the topic part short and stable; put the episode number in the overview once confirmed.

The episode's `README.md` is its entry point. Keep its research, study pack, experiment plans, observations and article material together so relative links remain local to that episode. Add an `assets/` directory when there are figures to include.

[The episode template](templates/episode/README.md) provides a starting point. Document names are conventions, not requirements: create only the materials an episode needs.

## Add an episode

1. Create `episodes/<YYYYMMDD>-<topic-slug>/` (recording date) and copy the episode template into its `README.md`.
2. Fill in the question, participants, status, deadlines and planned discussion.
3. Add the relevant documents and link them from that overview.
4. Add an entry to the episode table above.
5. As work progresses, distinguish proposed experiments from measured results. Add recording and publication links when available.

## Public material

Keep this repository suitable for public reading. Include technical research, public sources, approved observations and preparation notes. Exclude private communications, credentials, customer information and confidential planning. State the versions, measurement conditions and limits behind technical claims.

Attribute contributors’ positions with a direct link to the original message, author and date beside the paraphrase or quotation. Cite technical facts where they appear, distinguish source evidence from interpretation, and explicitly identify observations whose supporting measurements are not publicly available. A general reading list does not replace claim-level provenance.
