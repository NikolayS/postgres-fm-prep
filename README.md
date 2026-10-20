# Postgres.FM preparation

Research, study packs, experiment plans and recording notes for individual Postgres.FM episodes.

## Episodes

| Episode | Status | Materials |
| --- | --- | --- |
| Your restore finished. Is your database ready? | Preparation; additional experiments proposed | [Episode overview](episodes/restore-readiness/README.md) · [Study pack](episodes/restore-readiness/study-pack.md) |

## Repository structure

Each episode lives in `episodes/<topic-slug>/`. Use a short, stable topic name; put recording dates and episode numbers in the episode overview once confirmed.

The episode's `README.md` is its entry point. Keep its research, study pack, experiment plans, observations and article material together so relative links remain local to that episode. Add an `assets/` directory when there are figures to include.

[The episode template](templates/episode/README.md) provides a starting point. Document names are conventions, not requirements: create only the materials an episode needs.

## Add an episode

1. Create `episodes/<topic-slug>/` and copy the episode template into its `README.md`.
2. Fill in the question, participants, status, deadlines and planned discussion.
3. Add the relevant documents and link them from that overview.
4. Add an entry to the episode table above.
5. As work progresses, distinguish proposed experiments from measured results. Add recording and publication links when available.

## Public material

Keep this repository suitable for public reading. Include technical research, public sources, approved observations and preparation notes. Exclude private communications, credentials, customer information and confidential planning. State the versions, measurement conditions and limits behind technical claims.
