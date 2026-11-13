# The hidden costs of CREATE TEMP TABLE (#196)

[All episodes](../../README.md)

## Overview

- **Question:** Why do temporary tables become a performance cliff in Postgres, and what to use instead?
- **Hosts / guests:** Nikolay Samokhvalov and Kirk Wolak (Michael Christofides away).
- **Status:** Final video v5 done 2026-11-11; uploaded unlisted to YouTube (https://www.youtube.com/watch?v=SinrACCAwa8). Release material ready as files; nothing published.
- **Recording date:** 2026-11-10.
- **Episode number:** 196.

## Discussion outline

1. Kirk's story: Oracle global temporary tables vs. Postgres temp tables; delete vs. truncate.
2. Problems in layers: primary only (0), invisible to other sessions (1), bloat of the temp table and of the catalog (2A/2B), sinval queue contention, LWLock:SInvalWrite (3).
3. Idle sessions make the cliff worse (RDS/Aurora, Black Friday scaling of app nodes without a pooler).
4. Throughput: temp table per transaction vs. ON COMMIT DELETE ROWS vs. a CTE rewrite (synthetic workload).
5. Alternatives: arrays and `select t1 from t1`, PL/pgSQL record structures, unlogged tables; ideas for Postgres hackers.

## Evidence status

DBLab Forge sinval study (PG17, PG18, PG19 RC1), public brief:
https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d. Raw data and a DOI are not public yet. Catalog bloat was discussed on air, not measured.

## Materials

- [`video/`](video/): overlay sources (Remotion), `v5-build.sh` (chunked compose + splices + ep 194 outro).
- [`captions/`](captions/): YouTube SRT/VTT (video time), podcast SRT/VTT, transcript (`.md` and the website `.txt`), the subtitle fixes.
- [`notes/`](notes/): `notes.json` (links), show notes, Transistor HTML with the watch-on-YouTube tip, summary, YouTube description.
- [`thumbs/`](thumbs/): title options (`titles.md`) and the sources of the thumbnails and the square cover.
- [`social/`](social/): X thread and LinkedIn draft (`x-thread.md`, `posts.py`).
- [`assets/`](assets/): one still per chart card, from the final video.

## Local media (not in git)

Review folder `/Users/nik/Documents/Zoom/2026-11-10 10.03.07 .fm recording/review/`:
- `25-final-v6.mp4` (final video, 38:40, -16.0 LUFS; v5 + reviewer fixes: card 23 axis, no psql typing sound), `26-final-v5-sheet.png`;
- `41-podcast.mp3` / `.wav` (podcast audio, cover embedded, -16.2 LUFS), `41-podcast.time-map.json`;
- `40-thumbs/` (`thumb-a|b|c.png`, `cover-3000.png`), `41-notes/` (release text).

## Release checklist (2026-11-12)

- [x] Edit approved; final video v6 (v5 + card 23 axis fix, psql typing sound removed) (18 cards, bands above YouTube captions, ep 194 outro).
- [x] YouTube SRT, glossary pass, checked by ear at 4 doubtful spots.
- [ ] YouTube SRT uploaded with timing; auto-generated track removed; auto-dubbing off.
- [x] Titles (3 options) and thumbnails A/B/C; square cover 3000x3000.
- [x] v6 uploaded as https://www.youtube.com/watch?v=SinrACCAwa8 (private until Premiere): title 1, thumbnail A, description, playlists Postgres.FM podcast + PostgreSQL in English + PostgreSQL performance. Benchmarks, not made for kids. A/B test after the Premiere.
- [x] YouTube description (hook, chapters, key links); `postgres.fm/episodes/...` slug to confirm after the Transistor draft.
- [x] Podcast MP3 with cover; podcast SRT/VTT; transcript.
- [x] Show notes: 20 links checked on 2026-11-12, docs anchors verified; brief as Main link.
- [x] Transistor draft: `--dry-run` OK (now sends summary and video_url too).
- [x] Transistor draft created: episode 3732185 (slug the-hidden-costs-of-create-temp-table); publish with the Premiere.
- [x] X thread + LinkedIn drafts with number check.
- [ ] Social media: an animation and a speaker clip (not made yet).
- [ ] Research artefacts: raw data / DOI not public yet.
- [ ] Blog post (later).

## Published links

To be added.
