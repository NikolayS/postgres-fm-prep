# Episode 198 captions

- `final.audio-map.json`: source -> final video. Cold open B1 lines (frames from `video/coldopen/dyn/spec.ts`, source spans from `dyn/lines.sh`), then the edit's kept segments at edited + 42.44 s.
- `podcast.audio-map.json`: source -> podcast MP3 (edited + 17.96 s; no cold open).
- Build (in the review folder `captions/`):
  `bun tools/podcast-edit/subtitles.ts build ../work/src.words.json --out final-en --audio-map final.audio-map.json --speakers speaker_0=Kirk,speaker_1=Nik --fixes subtitle-fixes.json --voices --article --title "Can AI safely change production Postgres?" --music 24.44-42.44,3159.9-3181.8`
  (podcast: `--out podcast-en --audio-map podcast.audio-map.json --music 0-17.96,3135.4-3158.12`), then `python3 merge-short-cues.py final-en` (and `podcast-en`): it merges three cues under 1 s and capitalizes the first cue.
- Checks: `subtitles.ts check` (only reading-speed warnings left), `subtitles.ts qa final-en <final.mp4> --source <recording> --n 10 --seed 198` (10/10 pass), and every caption word inside a kept piece.
- `subtitle-fixes.json`: the glossary pairs that hit (`prompt.txt` in the postgres-fm content repo) plus this episode's names.
