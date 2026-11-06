# Episode 194 video: how it was made

[Episode overview](../README.md)

The video was made in the Zoom review folder, not in this repository:

```bash
R="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review"
SP="$R/scratchpad"
```

This folder keeps the source and settings that were left only in `$SP`, so later episodes can reuse them (episode 195 did). Rendered media stay in `$R` (see [Local media](#local-media-not-in-git)).

## Tools

`$SP/style/tools/` holds patched copies of `compose.ts` and `layout.ts` from `tools/podcast-edit`. Patches against repository commit `31a74c9`:

- [`tools/compose.patch`](tools/compose.patch): shades title and end cards, `--card-video`, `--fade-in-pow`, `--music-lufs`, `--trim-end`, `--bed-shift`, `cardHosts`, `links: []`, SFX levels by name prefix (`--sfx-rel`, `--sfx-floor`), and other defaults (card 13 s, fades 10 s). It imports `freeze-audio` from `~/.claude/skills/podcast-edit/`. Episode 195 used the same file.
- [`tools/layout.patch`](tools/layout.patch): the shades theme (as in `tools/podcast-edit/brand/layout-shades-theme.patch`) and no bar before the name labels.

Rebuild the copies:

```bash
REPO=~/github/postgres-fm-prep
mkdir -p tools && cd tools
for f in compose layout detect-tiles freeze-audio lib; do git -C $REPO show 31a74c9:tools/podcast-edit/$f.ts > $f.ts; done
patch -p1 < $REPO/episodes/20261027-uuidv4-vs-uuidv7/video/tools/compose.patch
patch -p1 < $REPO/episodes/20261027-uuidv4-vs-uuidv7/video/tools/layout.patch
```

`layout.ts` reads the theme assets from `BRAND`: `join(import.meta.dir, "../remotion/public")` here, an absolute path in the episode 195 copy. [`brand-public/`](brand-public/) is a copy of that folder without the music: Lato fonts, `wordmark-white.png`, the end-card background `brand-card-bg.png` and `brand-card-wordmark.png`.

## Title card

[`card/remotion/`](card/remotion/): the Remotion title card, composition `CardCrazy` in `src/Crazy.tsx` (14 s, beat-synced to the intro cue through `public/a-shades-levels.json`). Title and hosts are in `src/common.tsx` (`TITLE`, `HOSTS`); host photos are in `public/`. Renders are in `$SP/v3/card/remotion/out/` (`card-crazy-v1.mp4` to `-v3.mp4`).

```bash
cd "$SP/v3/card/remotion" && npm install && npx remotion render src/index.ts CardCrazy out/card-crazy-v3.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p
```

[`card/music/`](card/music/): arrangement files for `tools/podcast-edit/brand/music/arrange.ts` (GarageBand Apple Loops). `a-shades-long2.json` gives `a-shades-long2.wav`; the intro of episodes 194 and 195 is `a-shades-long2-pad.wav` next to it (the wav files are not in git).

## Overlays (on-screen cards)

Eight cards, described in [../illustrations.md](../illustrations.md). Remotion compositions on top of `tools/podcast-edit/overlays`, in [`overlays/`](overlays/):

- `overlay-plan.md`: the plan (anchors, data sources, colors).
- `src/Episode.tsx`: the compositions (`uuid`, `uuidtype`, `bandtype`, `hbars`, `memgraph`, `btree`). `BandTyping` and `bandTypingPlan` are reused by episode 195.
- `src/typing.ts`, `scripts/typing-bursts.ts`: the typing schedule of the band cards and the bursts JSON for their typing sounds.
- `src/Root.tsx`: registers the compositions.
- `scripts/episode.ts`: every card anchored to SOURCE word times and mapped through the cuts file; writes `manifest.json`, the `.mov` files and `props/`.
- `scripts/qa-sheet.py`, `scripts/qa-still.sh`: QA stills over the layout stills.
- `data/figG.json`, `figG-paths.json`: data of the memory-then-graph card.
- `build-manifest-v8.py`: adds the overlay sounds to a manifest (typing on band cards, sand strokes on center cards, a punch on sudden reveals). This convention is now `tools/podcast-edit/sfx-manifest.ts`.
- `manifest-v9.json`: the manifest of the final video; `props/`, `*-typing-bursts.json`, `qa-layout-center.json`.

Set up the tool:

```bash
REPO=~/github/postgres-fm-prep; E=$REPO/episodes/20261027-uuidv4-vs-uuidv7/video/overlays
T="$SP/overlays/tool"; mkdir -p "$T" && cp -R $REPO/tools/podcast-edit/overlays/. "$T"/
cp $E/src/*.tsx $E/src/typing.ts "$T/src/"; cp $E/scripts/* "$T/scripts/"; mkdir -p "$T/data" && cp $E/data/figG.json "$T/data/"
cd "$T" && bun install && bun scripts/episode.ts <cuts.json> --render
```

## Covers and thumbnail

[`cover/`](cover/): `vs7.html` (YouTube 1280x720) and `vs7-square.html` (3000x3000) for the cover `render.ts` in `tools/podcast-edit/cover/` (they link `base.css` from there); `thumb.html` (thumbnail 33, Impact headline); `poly-clear.ts` (clears the alpha inside a polygon of a cutout, then feathers the edge).

## Scripts

[`scripts/`](scripts/):

- `splice.sh`: puts the typing band cards into a complete render by re-encoding only four keyframe-aligned windows and copying the rest (the release checklist's "splice the changed windows"). Paths and windows are at the top.
- `remap.py cuts.json manifest.json render.log out.json`: moves every overlay to a new edit, from the source times in the overlay render log.
- `fixmask.py`, `headsticker.py`: clean the elephant cutout (largest blob, holes filled) and cut a head sticker with a soft neck fade (`scipy`, Pillow).
- `card-still.ts`: one still of the shades title card from the patched `compose.ts`.
- `compose-command.txt`: the preview compose command with the shades look (absolute paths).

Compose flags of this episode's final look, as noted at the time and reused for episode 195: `--intro a-shades-long2-pad.wav --card-video <card>.mp4 --duck-ramp 3 --intro-fade 8 --outro a-shades-outro.wav --end 0 --card 13 --fade-in-pow 3 --music-lufs -20.5 --preset fast`, plus `--overlays <manifest>`, wrapped in `watchdog.ts`. Episode 195's [`render.sh`](../../20261104-extensions-on-demand/video/render.sh) has the full command with paths.

The subtitle dictionary of this episode is [`../subtitles/30-subtitle-fixes.json`](../subtitles/30-subtitle-fixes.json).

## Local media (not in git)

- Source recording: `/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/video2013034834.mp4` and `audio2013034834.m4a` (the `...1013034834` files are an earlier part).
- `$R/29-final-v9.mp4` (final video), `$R/30-podcast.mp3`, `$R/30-podcast.wav`, and the drafts and previews numbered 01 to 28 in `$R`.
- `$SP/overlays/*.mov` (rendered cards, about 4 GB) and `$SP/overlays/sfx/*.wav`.
- `$SP/v3/card/remotion/out/card-crazy-v3.mp4` (title card), `$SP/v3/card/outro/logo.mp4` (Postgres.AI logo animation, 9.7 MB), `$SP/v3/card/outro/a-shades-outro.wav`.
- `$SP/v3/card/music/*.wav` (intro cues), `$SP/style/remotion/public/*-intro.wav`.
- Social clips: the source scratch files of [`../social/`](../social/) (earlier versions `uuid-v1.mp4`, `uuid-v2.mp4`, `kirk-btree-v1.mp4`) are only in a temporary session scratch folder.
