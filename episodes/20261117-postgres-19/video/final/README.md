# Episode 197 final video: how it was made

[Episode overview](../../README.md)

Media are not in git. `<recording>` stands for the Zoom folder of the recording (`~/Documents/Zoom/2026-11-17 10.02.00 .fm recording`). `<repo>` is this repository.

## Order of the final video

1. Cold open (chosen separately), carrying the opening music.
2. The edited show, starting immediately, with 9 on-screen notes and the London photo card.
3. Outro: `<recording>/final-cards/outro-197.mp4` (22.72 s), with the episode 194 outro music.

There is no title card or intro music in the body. After rendering, copy `<recording>/final/26-final-v2.mp4` to `preview/episode-197-body-v2.mp4`. These v2 media have **not been rendered**. When the cold open is chosen:

```bash
bash episodes/20261117-postgres-19/video/final/join.sh episodes/20261117-postgres-19/preview/<cold-open>.mp4
```

It writes `preview/episode-197-final.mp4` and runs `edit/set_times.py <cold-open seconds>`. Until then the chapters in `notes/youtube-description.txt` are body times with a TODO.

## Cuts

- `edit/judgment.applied.json`: 49 rows (c02 split into c02a/c02b) derived from the 48 rows of `../edit/judgment.draft.json`, anchored again on the ElevenLabs Scribe words (`edit/anchor.py`, `edit/respan.py`, then edits by hand for c02, c06, c13, c20, c35 and c44). The original draft cut 43 rows; c16, c18, c25, c32 and c41 are not (see `../edit/cutlist-draft.md`).
- The toolkit's automatic filler, repeat, false-start and pause cuts are added by `detect.ts`.
- `render.ts` ran with a relaxed "heard as a jump" check (`edit/render-relaxed-joins.patch`: join score 9 instead of 4, level step 25 dB instead of 10). This differs from the toolkit default. The v2 plan uses the same thresholds, with only c02 restored in part.
- `edit/edited-v2.cuts.json`: the current cut plan (the original `edited-draft.cuts.json` is retained); its `segmentTimes` map the recording to the edited show.

## Picture

- `layout.json`: canvas 1920x1080, the episode 195 wide tiles with the people in the order Nik, Michael, Kirk (x 24, 656, 1288; y 300; 608x342), samograph small at the bottom right, theme shades, `"header": "line"`, `"headerSize": 104`.
- `tiles-manual.json`: the Zoom gallery tiles (2x2, 640x360 each). `detect-tiles.ts` cannot split them, because they touch.
- Tools: `compose.ts` is the episode 196 patched copy, with its `freeze-audio` import made relative (`compose-import.patch`). `layout.ts` and `detect-tiles.ts` are the repository versions at bc9cd90. Set `PODCAST_BRAND` to `episodes/20261027-uuidv4-vs-uuidv7/video/brand-public`.

## On-screen notes

- `overlays/items.ts`: 9 `band` strips (toolkit `overlays/src/Band.tsx`, BAND y 724, under the name labels). The text is from `../../notes/corrections.md`, split into a strip and a smaller line.
- Each card starts on a spoken word: `edit/items.py` finds the anchor phrase in the Scribe words and maps it through the cuts. `overlays/anchors.json` lists phrase, recording time and edited time.
- Render: copy `tools/podcast-edit/overlays` to `<recording>/final-overlays/tool`, link `node_modules`, put `items.ts` in `scripts/`, run `bun scripts/render-all.ts`. Output: ProRes 4444 `.mov` files and `manifest.json` in `<recording>/final-overlays/overlays-v2` for v2 (configure the later renderer accordingly; no overlays rendered in this pass).

## Sound

Only outro `a-shades-outro.wav` from episode 194; opening music belongs to the cold open. Outro arguments match episode 196 `render.sh` (`--music-lufs -20.5`, two-pass loudnorm to -16 LUFS, -1.5 dBTP).

## Render

Prepared commands only; no video rendering was run for v2:

1. `bash edit/render-edited-v2.sh` from any directory regenerates the edited video with the relaxed-joins patch and `render-stable-frames.patch`. The latter preserves original downstream video frames and puts the one-frame rounding remainder in the quiet pause after “shorts”. It checks the resulting plan against the saved plan.
2. Render the nine strips into `final-overlays/overlays-v2`, then render the London `.mov` separately when disk permits. Add its manifest entry with `dur` from `london/item.json`'s `duration`, `freezeSec: 0`, and `sfx: []`.
3. Run `render.sh` after replacing its `<recording>`, `<repo>` and `<ep194-recording>` placeholders. It uses edited-v2, overlays-v2, explicit `--card 0` (the compose default is 13), no intro music and no opening fade, and preserves the outro arguments.
4. Copy the body as described above, then use `join.sh`.

Plan reproduction (run from `<recording>/review`): `bun <repo>/tools/podcast-edit/detect.ts work/src.words.json work/edl-v2.json --judgment <repo>/episodes/20261117-postgres-19/video/final/edit/judgment.applied.json --prosody work/prosody.json --review work/review-v2.txt`; use the render script's two patched renderer copies with `--plan-only` for planning. Keep the original EDL and plan unchanged.

## Chapters

`edit/chapters.py words.json [cuts.json] [cold-open seconds] [HH:MM:SS links ...]` anchors chapters to words; the cuts default is edited-v2. Final time = cold open + edited body time. `edit/times-body.json` retains its chapter/link keys; existing precise body anchors were mapped back through the old plan (subtracting its 14 s card), then forward through v2. Intro starts at zero. `python3 edit/set_times.py 0` writes body times; `join.sh` adds the chosen cold-open length later.

## London photo card

`london/london-card.ts --still ../../preview/illus-00-london.png` creates the opaque 1920x1080 still (invoke from this directory). It uses the existing Playwright installation under `<recording>/final-overlays/tool`; set `PLAYWRIGHT_MODULE` or `BROWSER_BIN` when needed. Source photo and still are ignored by `episodes/*/preview/`.

Pixel-detected content is y=[321,2476); the four-pixel trim gives y=[325,2472). The full-width sharp photo fits y=24–900 with 18 px corners and shadow; its blurred, 35% darkened copy fills the background. No text. Later: `bun london/london-card.ts --mov <output>/london.mov --dur 23.62`. This mode writes ProRes 4444 with 0.4 s alpha fades; it has not been run.

`london/item.json` anchors source 94.06–118.24 to body 51.70–75.32. Toolkit and final compose both support a full-frame opaque overlay at 0,0; no compose change is needed. Convert `duration` to the manifest's `dur`; opacity comes from the generated video, with transparency only during fades.

## Forge illustrations (v2)

`forge/forge-items.py` writes 9 cards from the Forge PG19 study (brief https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c; values from its `figures/reader/data.json`, `numbers.json` or text, each recomputed from the raw run output before use). Each card ties to what is said at that moment: one headline, one chart or one or two numbers, a bridge line ("What the Forge study measured: ..."), a short footer. Cards are anchored on recording seconds and mapped through `edit/edited-v2.cuts.json`; the script writes `<recording>/final-overlays/tool/scripts/items-forge.ts` and the host places of `layout.json` (`center`: right column while a card is up). compose.ts makes the windows from the overlay manifest. `forge/Ep197.tsx` is the Remotion component (`forge` composition), `forge/render-forge.ts` renders the cards (`DUMP_PROPS=<dir>` writes props only). Dropped after review: EXPLAIN ANALYZE timing (the brief's verdict is "same" within a 46% noise band) and throttled VACUUM (PARALLEL) (not what is said on air). Band strip 04 is replaced by the plan advice card.

## London photo (v2)

`london/london-card.ts` makes the London photo overlay: the photo in the centre (y 250-900), transparent around it; placement `london` moves the host tiles to `place.*.centers.london` in `layout.json` (new in `tools/podcast-edit/layout.ts` and `compose.ts`: named states) (`--still out.png`, or `--mov out.mov --dur S`); `london/item.json` is its manifest entry. The photo stays out of git (`preview/` is ignored).
