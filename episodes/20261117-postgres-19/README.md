# Postgres 19 for people who run it

[All episodes](../../README.md)

## Overview

- **Question:** What stops an upgrade from 18 to 19, what do you gain, and what did we measure on 18.7 against 19 RC2?
- **Hosts:** Nikolay Samokhvalov, Michael Christofides and Kirk Wolak (three co-hosts).
- **Status:** Recorded 2026-11-17 (Zoom, about 58 min on air). Release text drafts in `notes/`, `thumbs/` and `social/`; edit not started.
- **Study material deadline:** To be confirmed, with time zone.
- **Recording date:** 2026-11-17, 10:13 PT (18:13 UTC).
- **Episode number:** 197 (confirmed 2026-11-17).

## Materials

| Document | Purpose |
| --- | --- |
| [`recording-notes.md`](recording-notes.md) | Angle, three leads with numbers to say, quick hits, demos, "do not say" list, show-notes links, open questions |
| [`notes/notes.md`](notes/notes.md) | Show notes draft: description, 20 links with times, link check |
| [`notes/youtube-description.txt`](notes/youtube-description.txt) | YouTube description draft with chapters |
| [`notes/summary.txt`](notes/summary.txt) | Transistor summary draft |
| [`notes/fact-check.md`](notes/fact-check.md) | Claims made on air, checked against primary sources |
| [`captions/`](captions/) | Podcast SRT/VTT and transcript (`.md`, website `.txt`), dictionary rules (`subtitle-fixes.json`) |
| [`video/podcast/README.md`](video/podcast/README.md) | Podcast audio master, time map, dictionary pass, Transistor notes |
| [`thumbs/titles.md`](thumbs/titles.md) | Title options, thumbnail concepts, cold-open candidates |
| [`social/x-thread.md`](social/x-thread.md) | X thread and LinkedIn drafts with a number check |

## Discussion outline

Planned: the three leads of the recording notes. Recorded (agreed in the pre-show): why 19 came in November, then a round of favorite features, then warnings before the upgrade.

1. The delay: security fixes, AI bug reports, the reverts.
2. Favorites: REPACK (CONCURRENTLY), LISTEN/NOTIFY with many listeners, autovacuum prioritization, pg_plan_advice, new defaults, WAIT FOR LSN, EXPLAIN ANALYZE timing, vacuumdb, extended statistics, pgbench.
3. Warnings: removed settings and `pg_upgrade --check`, logical replication of sequences, how to test the upgrade, plan flips.

## Evidence status

Study brief, version 2.2 (PGDG 18.7 against 19 RC2; behavior on small test hosts, speed on dedicated hosts, 3 trials per version where stated): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c. Not a result for 19.0. Raw data is not public.

## Sources and attribution

Credits and links are in the recording notes, beside each lead: shihao zhong (`pg_upgrade --check` gap), Heikki Linnakangas (double `max_locks_per_transaction`), Radim Marek (REPACK final lock), Joel Jacobson (NOTIFY).

## Open questions

See the last section of the recording notes.

## Release checklist (podcast part, 2026-11-18)

**HARD GATE: Publish only after PostgreSQL 19.0 is announced on postgresql.org; check the release notes link (https://www.postgresql.org/docs/19/release-19.html) and the 'is out' wording then.** The Transistor draft stays unscheduled until then.

YouTube subtitles (section 4):
- [x] English subtitles built from the edited transcript (`notes/subtitles-en.srt`, final-video times).
- [x] Dictionary pass with the `prompt.txt` glossary, then a read-through; doubtful spots checked with whisper (`video/podcast/README.md`). New mis-hearings not yet added to the glossary repository (MR to do).
- [ ] Uploaded with timing; auto-generated track removed; auto-dubbing off (no YouTube video yet).

Podcast audio (section 5):
- [x] Decision (Nik, 2026-11-19): NO cold open in the podcast audio or transcript; it starts at "Hello, and welcome". Podcast time = video time - 43.76 s.
- [x] Audio-only master: body only, 0.25 s fade-in, no overlay sounds, 52:38.9, -16.2 LUFS, -2.5 dBTP, MP3 192 kbps with `covers-v2/FINAL-square.jpg` (MA version) embedded (`preview/episode-197-podcast.mp3`, not in git).
- [x] Square cover 3000x3000: `preview/covers-v2/FINAL-square.jpg` (made by the cover work, not in git), embedded in the MP3 and set as the episode artwork.
- [x] Draft restored after the release; body-only audio, notes and polished transcript uploaded 2026-11-19 and checked through the API (same decoded audio, description, summary, transcript). Draft created with `transistor.ts`: episode 3745675 (slug `postgres-19`, status draft): title, summary, description, transcript, audio. Not published or scheduled.
- [x] `video_url` set to https://youtu.be/VcDU-NRE3hI (Transistor stores it as https://www.youtube.com/watch?v=VcDU-NRE3hI); the youtu.be URL is in the tip of the notes (2026-11-19).
- [x] Published 2026-11-19 06:39 PT (14:39:30 UTC), episode 197, no schedule: https://postgres.fm/episodes/postgres-19 , https://share.transistor.fm/s/1cf71ca2 . Checked logged out: the page shows the new square cover (og:image), notes, player and transcript page; RSS https://feeds.transistor.fm/postgres-fm has 197 as the newest item, duration 3159, author with Kirk, transcript tag, and the enclosure decodes to the same audio as the local MP3.
- [x] Show notes open with the watch-on-YouTube tip.
- [ ] Publish and check the episode page, the share page and the RSS feed (not done: draft only).

Transcript and podcast subtitles (section 6):
- [x] Transcript in the new style (name and stamp only when a person starts speaking), podcast times, clean verbatim (`video/podcast/polish.py`: fillers, repeats, false starts removed).
- [x] SRT/VTT for the audio version from the audio time map (`captions/podcast.en.*`).

Show notes (section 7):
- [x] One paragraph, then links grouped by topic with podcast times; 20 links, all opened on 2026-11-18.
- [x] Brief as the Main link in the Transistor notes and in the YouTube description.
- [x] No company or job title for a guest (no guests; Kirk is a co-host and is in the producers).

## Published links

To be added.
