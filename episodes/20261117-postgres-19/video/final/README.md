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

Only outro `a-shades-outro.wav` from episode 194; opening music belongs to the cold open. Outro arguments match episode 196 `render.sh` (`--music-lufs -20.5`, two-pass loudnorm to -16 LUFS, -1.5 dBTP), plus `--duck -21`: the music stays 21 dB under the talk (CLAUDE.md asks for 20 dB or more).

Voices: `edit/michael-boost.ts` levels the edited body before compose. Michael gets the cold-open v8 presence chain and +7 dB in his turns (his microphone runs about 9 dB quiet), and Nik gets +1.5 dB. Turns come from the transcript speaker labels, mapped through the cut plan, with 40 ms ramps. The script then applies a limiter and two-pass loudnorm. Word medians after it: Michael -20.0, Nik -19.9, Kirk -18.8 dB.

## Render (v2, 2026-11-18)

1. `bash edit/render-edited-v2.sh` regenerates `<recording>/review/edited-v2.mp4` (3,145.72 s) and checks it against the saved plan.
2. `bun edit/michael-boost.ts <recording> edited-v2.mp4 edited-v2-mb.mp4` (run in `<recording>/review`).
3. Overlays in `<recording>/final-overlays/overlays-v2/` (one `manifest.json`, times in body seconds):
   - The 8 band strips reuse the v1 `.mov` files at the v2 times from `overlays/items.ts`.
   - The 8 Forge cards come from `bun scripts/render-forge.ts` in the overlay tool, after `python3 forge/forge-items.py` and a copy of `forge/Ep197.tsx`.
   - `london.mov` comes from `bun london/london-card.ts --mov ... --dur 23.62`.
   - Cards and London are PNG-in-MOV with alpha (`-c:v png -pix_fmt rgba`). This is pixel-identical to ProRes 4444 and about 5x smaller.
4. `render.sh` (replace the `<...>` placeholders). ffmpeg hung twice at body 3,143.8 s, just before the end-card xfade. The draft body was therefore rendered as two parts and joined with stream copy at 3,029.68 s, in a 1 s pause. The parts are the same command with `--until 3029.68` and with `--from 3029.68`. The tail audio got +0.5 dB to match the head speech level.
5. Copy to `preview/episode-197-body-v2.mp4`, then `bash join.sh <absolute path to cold open>`. The cold open must be an absolute path, because the concat list is in a temp folder.
6. QA: `bun tools/podcast-edit/qa.ts episodes/20261117-postgres-19` with the `EP197_*` variables from `qa.json` and `cards/roots.json`.

## Render (v3, 2026-11-18): only the changed chunks

Changes: f02 shortened to 9.5 s, then `radim-shot` (a real screenshot of Radim Marek's boringSQL post, 2x headless Chrome, `v2-shot` kind in `forge/Ep197.tsx`; images in the overlay tool's `public/shots/`), and the f07 card as "TOAST compression: LZ4 by default". Back-to-back center cards are one hosts-aside window (`mergeCenter` in `layout.ts`).

1. `python3 forge/forge-items.py`, copy `forge/Ep197.tsx`, render the three cards (`DUMP_PROPS` + `remotion render`, then PNG-in-MOV), update `overlays-v2/manifest.json`.
2. Render only body 790-840 s and 1730-1770 s: the `render.sh` command with `--from`/`--until`, under a watchdog (no CPU progress for 90 s: kill and retry).
3. Split body v2's video at its keyframes (`-f segment -segment_times 789.9,839.9,1729.9,1769.9`, stream copy), put the two chunks in place of segments 1 and 3, and concat with `-itsoffset 0.021016` (body v2's video start). The audio stream of body v2 is kept as is: the cards have no sound, and the chunk audio matched it (0 lag, -0.14 dB).
4. `bash trim-cold-open.sh preview/cold-open-v9a.mp4 preview/cold-open-v9a-trim.mp4 43.76`: the cold open ends on the last three-way split, 40 ms after the last word (seam gap about 0.37 s with the body's 0.33 s room tone), +2.5 dB to match the body start (-13.9 LUFS).
5. `bash join.sh <absolute path>/cold-open-v9a-trim.mp4` (body: `preview/episode-197-body-v5.mp4`).

Body v5: cuts of two of Nik's restarts that the edit kept. Kirk heard "there are improvements" twice at 18:20, and the same pass removes "there should be some need to" twice at 15:24. The cuts are in `edit/body-v5-cuts.json` (body v3 seconds 880.88-883.40, 884.64-885.48 and 1055.20-1060.64; 8.80 s in total). Only body 880-890 s and 1050-1070 s were re-rendered, as five `--from`/`--until` pieces. The video was spliced at keyframes 880, 890, 1050 and 1070. The audio was rebuilt from body v3's PCM, with the pieces gain-matched and 5-10 ms crossfades. Later times move earlier (`times-body.json`, `qa.json`, `notes/subtitles-en.srt`). An audio self-similarity scan of the whole final found no duplicated audio (no splice or render repeat).

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

## Overlay sounds (body v8, audio-only remux)

The body was rendered with the raw `overlays-v2/manifest.json`, so the final had no overlay sounds. The fix needed no video re-render:

1. `bun <repo>/tools/podcast-edit/sfx-manifest.ts manifest.json --out manifest-sfx.json --accent f00-cves=3.8` in `<recording>/final-overlays/overlays-v2` (copy: `overlays/manifest-sfx.json`). This gives 11 center cards and photos (London included) IN and OUT, an accent on the CVE 52 bar, and 8 band strips with two typing lines each (line reveals measured from each strip's alpha).
2. `bun edit/sfx-stem.ts <overlays-v2>/manifest-sfx.json edit/body-v5-cuts.json 3158.922 stem.f32` places the 39 sounds as one stem, with compose.ts levels (loudest 400 ms at -20 LUFS, center-out -3 dB, plus the body mix's +0.15 dB loudnorm gain). Times are in body v5 seconds, plus the body's 21.3 ms A/V start offset.
3. Body v7 audio + stem, amix (no normalize), the compose limiter (192 kHz, limit 0.75, attack 1 ms; its 48-sample lookahead trimmed), AAC 192k, remuxed with body v7's video by stream copy: `preview/episode-197-body-v8.mp4`. Lag against body v7: 0 samples.
4. `bash join.sh <absolute path>/cold-open-v9a-trim.mp4`.

Final: -16.0 LUFS integrated, true peak -1.8 dBTP. Each sound is 4.5-14.1 dB under the speech peak in the 8 s around it (median about 9 dB). Whisper reads the same words with and without the sounds at the NOTIFY IN, the CVE accent and the 06 strip.
