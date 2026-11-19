# Episode 197 podcast audio, transcript and captions

[Episode overview](../../README.md)

Media are not in git. `<recording>` is the Zoom folder (see `../final/README.md`).

## Audio master

Decision (the host can veto): the podcast has the cold open too, so podcast times are video times.

The podcast is the final video's audio without the overlay sounds:

1. Decode the audio of `preview/cold-open-v9a-trim.mp4` and `preview/episode-197-body-v5.mp4` (body v7 audio is byte-identical to v5; body v8 adds the sound cues).
2. Join them in the same layout as the final: the stream-copy join of `join.sh` decodes as a 1024-sample pad, the cold open (2,101,248 samples), a 1024-sample pad, then the body. So the body starts at 43.8187 s (not 43.76 s). Cross-correlation against `episode-197-final.mp4`: lag 0 for the cold open and at 6 points in the body; the only differences are the sound cues and the final's limiter.
3. No gain or limiter: the join measures -16.0 LUFS and -1.9 dBTP already.
4. MP3: 44.1 kHz, 192 kbps CBR (as episodes 195 and 196), ID3v2.3, the square cover as the front cover. Output: `preview/episode-197-podcast.mp3`, -16.2 LUFS, -2.1 dBTP (ebur128 on the MP3).

## Captions and transcript

- `time-map.py` writes `podcast.time-map.json`: Scribe source seconds to podcast seconds, through the `edited-v2.cuts.json` segments, the body-v5 cuts and the 43.8187 s body start. Run it in a folder with `edited-v2.cuts.json` (from `<recording>/review`).
- Build: `bun tools/podcast-edit/subtitles.ts build <recording>/review/work/src.words.json --audio-map podcast.time-map.json --speakers speaker_0=Michael,speaker_1=Nik,speaker_2=Kirk --fixes ../../captions/subtitle-fixes.json --out out/podcast --article --voices --title "Postgres 19" --music 3181-3202.7`.
- `cold-open-cues.py` puts the 12 cold-open cues in front (from `notes/subtitles-en.srt`, +1024 samples, speakers by the source words), writes `podcast.en.srt`, `.vtt` and `.transcript.md`. Then replace `postgres_fdw/dblink` with `postgres_fdw and dblink` (a fix with spaces gets a capital first letter) and run `subtitles.ts transcript-txt`.
- Output in `../../captions/`. `subtitles.ts check`: only reading-speed warnings.

## Dictionary pass

Glossary: "Glossary:" section of `prompt.txt` in https://gitlab.com/postgres-ai/content/postgres-fm (read 2026-11-18), the episode 195 and 196 rules, and this episode's terms. Doubtful spots were checked with whisper large-v3-turbo on the podcast audio. All rules are in `../../captions/subtitle-fixes.json`. Spoken words stay as said (Michael says "Tomas Vondra" for the I/O worker change; the fix only spells the name).

| From (ASR) | To | Why |
| --- | --- | --- |
| Nick, PostgresFM, Postgres.ai | Nik, Postgres.FM, PostgresAI | Names |
| CBEs | CVEs | Term |
| go on, Heck | go on, Kirk | Whisper hears "Kirk" |
| pgrost, pgROAST | pgroast | Repository name |
| it is squeeze to learn | pg_squeeze to learn | "...our episode about pg_squeeze, to learn the plans" |
| Repack (the command) | REPACK, REPACK CONCURRENTLY | SQL command; "need repack" (pg_repack) unchanged |
| Boing SQL, Vadim, RegressQL | boringSQL, Radim, RegreSQL | Radim Marek's blog and tool |
| PgCron, PG background | pg_cron, pg_background | Extension names |
| Postgres WNDB link | postgres_fdw and dblink | Whisper: "W and DB link" |
| pg_compacttable | pgcompacttable | Tool name |
| hot (heap-only tuples) | HOT | Term; "a hot second" unchanged |
| Listen to file(s) | LISTEN/NOTIFY | Feature |
| Recall AI, Samogrev, the four system, build-up forge | Recall.ai, samograph, the Forge system, DBLab Forge | Names |
| auto vacuum, toast, PGLZ, zstandard | autovacuum, TOAST, pglz, Zstandard | Terms |
| log lock waits, track plan, session target others, statement timeout | log_lock_waits, track_planning, target_session_attrs, statement_timeout | Settings |
| explain analyze, auto explain, VacuumDB, analyze only, continue on error | EXPLAIN ANALYZE, auto_explain, vacuumdb, analyze-only, --continue-on-error | Commands and options |
| wait command, Wait for LSN, LSENS | WAIT command, WAIT FOR LSN, LSNs | Command |
| PGA team one | PG18 one | Whisper: "PG-18 one" |
| IO workers, Thomas Wardrail | I/O workers, Tomas Vondra | Whisper: "Thomas Von Drill" |
| pg upgrade check, pg_create subscriber | pg_upgrade --check, pg_createsubscriber | Commands |
| No, to south | Note to self | Whisper |
| DB Lab (en-) engine, through get and | DBLab Engine, through Git and | Names |
| PG 19, PG-19, five minutes of Postgres, Wiki, pgsql general | PG19, 5mins of Postgres, wiki, pgsql-general | Names |

Left as said (unclear): "PG nine, version 19" (02:41), "Selma" (20:47), "plan with stashing" (26:20), "vacuum well" (11:45), "The case statistics" (39:04).

The same pass on `notes/subtitles-en.srt` (YouTube, times unchanged; it had an earlier pass): postgres.fm to Postgres.FM, PG-19 and PG 19 to PG19, five minutes to 5mins, Wiki to wiki, wait command to WAIT command, pgBouncer to PgBouncer (2), IO to I/O (2), "a HOT second" back to "a hot second", Samograph to samograph.

## Show notes

`notes-html.py` writes `notes/notes.transistor.html` from `notes/notes.md`: the watch-on-YouTube tip first (add the URL when the video is up), the brief as Main link, 20 links with podcast times, the numbers block, the notes block from `notes/corrections.md` (times moved to podcast times; the plan-advice cost is 11% to 14%, as the card data, not "about 13%"), and Kirk in the producers. All links opened on 2026-11-18 (HTTP 200, titles match). The second brief link (`#plans`) is left out: the brief is the Main link.

## Transistor draft

Episode 3745675 (show 32147), slug `postgres-19`, status draft, created 2026-11-18 with `tools/podcast-edit/transistor.ts`: title "Postgres 19", number 197, season 1, `notes/summary.txt`, `notes/notes.transistor.html`, `captions/podcast.transcript.txt`, `preview/episode-197-podcast.mp3`. `video_url` is empty until the YouTube video exists; then run `transistor.ts --show 32147 --episode 3745675 --video-url <url> --description-file <notes with the URL in the tip>`.

## Square cover

`preview/covers-v2/FINAL-square.jpg` (3000x3000, from the cover work), embedded in the MP3 as the front cover and uploaded as the episode artwork.
