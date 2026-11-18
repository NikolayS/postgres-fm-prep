# Episode 197 final video: how it was made

[Episode overview](../../README.md)

Media are not in git. `<recording>` stands for the Zoom folder of the recording (`~/Documents/Zoom/2026-11-17 10.02.00 .fm recording`). `<repo>` is this repository.

## Order of the final video

1. Cold open: not chosen yet (Nik rejected v6; v7 is in progress).
2. Title card: `<recording>/final-cards/card-197.mp4` (14 s, Remotion, the episode 196 CardCrazy9 style with the three hosts).
3. The edited show in the episode layout, with 9 on-screen notes.
4. Outro: `<recording>/final-cards/outro-197.mp4` (22.72 s: "In this episode: Postgres 19", then "Prepared by: PostgresAI"), with the episode 194 outro music.

`preview/episode-197-body.mp4` is a copy of `<recording>/final/25-final-v1.mp4` (title card, show, outro). When the cold open is chosen, one command makes the final and sets the chapter and link times for its length:

```bash
bash episodes/20261117-postgres-19/video/final/join.sh episodes/20261117-postgres-19/preview/<cold-open>.mp4
```

It writes `preview/episode-197-final.mp4` and runs `edit/set_times.py <cold-open seconds>`. Until then the chapters in `notes/youtube-description.txt` are body times with a TODO.

## Cuts

- `edit/judgment.applied.json`: the 48 rows of `../edit/judgment.draft.json`, anchored again on the ElevenLabs Scribe words (`edit/anchor.py`, `edit/respan.py`, then edits by hand for c02, c06, c13, c20, c35 and c44). 43 rows are cut; c16, c18, c25, c32 and c41 are not (see `../edit/cutlist-draft.md`).
- The toolkit's automatic filler, repeat, false-start and pause cuts are added by `detect.ts`.
- `render.ts` ran with a relaxed "heard as a jump" check (`edit/render-relaxed-joins.patch`: join score 9 instead of 4, level step 25 dB instead of 10). This differs from the toolkit default. Nik approved the cut set as he saw it in the draft, so the final keeps the same cuts.
- `edit/edited-draft.cuts.json`: the cut plan; its `segmentTimes` map the recording to the edited show.

## Picture

- `layout.json`: canvas 1920x1080, the episode 195 wide tiles with the people in the order Nik, Michael, Kirk (x 24, 656, 1288; y 300; 608x342), samograph small at the bottom right, theme shades, `"header": "line"`, `"headerSize": 104`.
- `tiles-manual.json`: the Zoom gallery tiles (2x2, 640x360 each). `detect-tiles.ts` cannot split them, because they touch.
- Tools: `compose.ts` is the episode 196 patched copy, with its `freeze-audio` import made relative (`compose-import.patch`). `layout.ts` and `detect-tiles.ts` are the repository versions at bc9cd90. Set `PODCAST_BRAND` to `episodes/20261027-uuidv4-vs-uuidv7/video/brand-public`.

## On-screen notes

- `overlays/items.ts`: 9 `band` strips (toolkit `overlays/src/Band.tsx`, BAND y 724, under the name labels). The text is from `../../notes/corrections.md`, split into a strip and a smaller line.
- Each card starts on a spoken word: `edit/items.py` finds the anchor phrase in the Scribe words and maps it through the cuts. `overlays/anchors.json` lists phrase, recording time and edited time.
- Render: copy `tools/podcast-edit/overlays` to `<recording>/final-overlays/tool`, link `node_modules`, put `items.ts` in `scripts/`, run `bun scripts/render-all.ts`. Output: ProRes 4444 `.mov` files and `manifest.json` in `<recording>/final-overlays/overlays`.

## Sound

Intro `a-shades-long2-pad.wav` and outro `a-shades-outro.wav` from episode 194, the same arguments as episode 196 `render.sh` (`--music-lufs -20.5`, two-pass loudnorm to -16 LUFS, -1.5 dBTP).

## Render

`render.sh`, on the Mac. A Hetzner VM was tried, but the upload from the Mac ran at about 0.07 MB/s, so the VM was deleted before use.

## Chapters

`edit/chapters.py` anchors each chapter on its first words and maps it to the final video: final = cold open + 14 s card + edited time. `edit/times-body.json` keeps every time relative to the start of the title card; `edit/set_times.py` writes them for a given cold-open length.
