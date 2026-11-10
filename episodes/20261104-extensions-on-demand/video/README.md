# Episode 195 video: how it was made

[Episode overview](../README.md)

The YouTube video was made in the Zoom review folder, not in this repository:

```bash
R="/Users/nik/Documents/Zoom/2026-11-04 14.09.51 .fm recording/review"
```

This folder keeps the source, settings and commands, so the next episode can reuse them. Rendered media stay in `$R` (see [Local media](../README.md#local-media-not-in-git)). The pipeline is the one in [`tools/podcast-edit/SKILL.md`](../../../tools/podcast-edit/SKILL.md): transcribe, detect, judge, render the edit (`01-edited.mp4`), then compose the final video.

## Tools

`$R/tools/` holds patched copies of `compose.ts`, `layout.ts` and `detect-tiles.ts` from `tools/podcast-edit`. Patches against repository commit `31a74c9`:

- [`tools/layout.patch`](tools/layout.patch): the shades theme (as in `tools/podcast-edit/brand/layout-shades-theme.patch`, with an absolute `BRAND` path to the episode 194 brand assets), no bar before the name labels, per-tile `crop`, tiles shown only in their Zoom layouts, and face `track`. The last three are now in `tools/podcast-edit/layout.ts`.
- `compose.ts`: the same patched copy as episode 194, see [its patch](../../20261027-uuidv4-vs-uuidv7/video/tools/compose.patch). It imports `freeze-audio` from `~/.claude/skills/podcast-edit/`.
- `detect-tiles.ts`: same as the repository.

To rebuild the copies:

```bash
REPO=~/github/postgres-fm-prep
mkdir -p tools && cd tools
for f in compose layout detect-tiles freeze-audio lib; do git -C $REPO show 31a74c9:tools/podcast-edit/$f.ts > $f.ts; done
patch -p1 < $REPO/episodes/20261104-extensions-on-demand/video/tools/layout.patch
patch -p1 < $REPO/episodes/20261027-uuidv4-vs-uuidv7/video/tools/compose.patch
```

The theme needs the brand assets at `BRAND` in `layout.ts` (fonts, `wordmark-white.png`, `brand-card-bg.png`, `brand-card-wordmark.png`). A copy is in [episode 194 `video/brand-public/`](../../20261027-uuidv4-vs-uuidv7/video/brand-public/); point `BRAND` there if the Zoom folder is gone.

## Layout

[`layout/`](layout/):

- `21-layout-center-v2.json`: used for the final render. Three hosts in 4:3 tiles in a row. During center cards the faces move to a column on the right (256 px wide at x 1640, y 120/360/600), above the robot tile. The screen share tile is shown only while Zoom shows it.
- `layout-v2.json`: the same without the center positions (used for the face-track tests).
- `tiles-manual.json`: tile rectangles per Zoom layout, written by hand. The Zoom tiles touch, so `detect-tiles.ts` cannot split them.

These files contain absolute paths: `tiles`, `cuts` and `logo` point into `$R`, and `place.nik.track` points into a session scratch folder (`/private/tmp/...`) that will not survive. Use `face-track/nik-track.json` from this folder instead.

## Face track (Nik's tile)

Nik moved a lot in his camera, so his crop follows his face. The generic tool is now [`tools/podcast-edit/face-track/`](../../../tools/podcast-edit/face-track/README.md). This episode's run, in [`face-track/`](face-track/):

- `faces.swift`, `track.py`: the first versions. `tools/podcast-edit/face-track/track.ts` gives the same `nik-track.json` with its default options.
- `faces.jsonl`: Vision face rectangles, one line per second of `01-edited.mp4` (Nik's tile, `crop=1024:576:1024:0`, scaled to 512x288).
- `nik-track.json`: the smoothed track (crop 700x526 in tile pixels, face center at 55% of the crop height).
- `nik-track.cmd`: the ffmpeg `sendcmd` file that `layout.ts` writes from it (full episode, `from` 0).

## Title card and outro

[`card/remotion/`](card/remotion/): the Remotion title card. `src/Crazy3.tsx` (composition `CardCrazy3`) is the one used: 14 s, beat-synced to the intro music (`public/a-shades-levels.json`), the elephant roasts the absent co-host, and the title and hosts are in `src/common.tsx` (`TITLE`, `HOSTS`). `Crazy.tsx` and `Crazy2.tsx` are earlier versions. The card source started from episode 194 (`../../20261027-uuidv4-vs-uuidv7/video/card/remotion/`).

[`card/outro/`](card/outro/): the outro after the show, `src/Outro.tsx` (composition `Outro`, 22.72 s). It starts with the Postgres.AI logo animation (`logo-v1.mp4`, not in git) and adds the StackGres lockup. In the layout config it is `"logo"`: `$R/21-outro-v2.mp4`.

```bash
cd "$R/card/remotion" && npm install && npx remotion render src/index.ts CardCrazy3 out/card-crazy-v3.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p
cd "$R/card/outro" && npm install && npx remotion render src/index.ts Outro out/outro-v2.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p
cp "$R/card/outro/out/outro-v2.mp4" "$R/21-outro-v2.mp4"
```

To render from this repository, copy `logo-v1.mp4` into `card/outro/public/` first.

## Overlays (on-screen cards)

Seven cards, described in [../illustrations.md](../illustrations.md). They are Remotion compositions on top of `tools/podcast-edit/overlays`, in [`overlays/`](overlays/):

- `src/Ep195.tsx`: the five center cards (`fat`, `repodown`, `quote`, `layers`, `outage`).
- `scripts/ep195.ts`: every card anchored to SOURCE word times (`src.words.json`) and mapped to edited time through the cuts file. It writes `manifest.json`, the `.mov` files, `props/` and the typing bursts.
- `src/Root.tsx`: registers the episode 194 and 195 compositions.
- `manifest.json` (from `ep195.ts`), `manifest-sfx.json` (after `sfx-manifest.ts`, used for the render), `props/`, `*-typing-bursts.json`, `qa-layout-center-v2.json` (the layout used for QA stills).

The band typing cards use `BandTyping` from episode 194's `Episode.tsx`. To set up the tool:

```bash
REPO=~/github/postgres-fm-prep; E194=$REPO/episodes/20261027-uuidv4-vs-uuidv7/video/overlays; E195=$REPO/episodes/20261104-extensions-on-demand/video/overlays
T="$R/scratchpad/overlays/tool"; mkdir -p "$T" && cp -R $REPO/tools/podcast-edit/overlays/. "$T"/
cp $E194/src/Episode.tsx $E194/src/typing.ts $E195/src/Ep195.tsx $E195/src/Root.tsx "$T/src/"
cp $E195/scripts/ep195.ts "$T/scripts/"
cd "$T" && bun install
bun scripts/ep195.ts ../../../01-edited.cuts.json --render      # writes ../manifest.json, ../*.mov
# then move the .mov files, the typing bursts and manifest.json to $R/20-overlays and add the sounds:
cd "$R/20-overlays" && bun $REPO/tools/podcast-edit/sfx-manifest.ts manifest.json --out manifest-sfx.json
```

The rendered `.mov` files (ProRes 4444 with alpha, 5.6 GB in all) stay in `$R/20-overlays/`.

[`scripts/`](scripts/):

- `find.py "phrase" ["phrase@1200" ...]`: finds a phrase in `src.words.json` and prints its source, edited and final time (final = edited + 13 s card). Paths to `$R` are at the top. Now generic: `tools/podcast-edit/find.ts` (also maps freezes and podcast time).
- `sheet.py`: takes stills from the overlay previews (`$R/22-previews/`), writes them to `../assets/` and makes the contact sheet `$R/23-contact-sheet.png`.

## Final render

[`render.sh`](render.sh), run from `$R`:

```bash
O="/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/scratchpad/v3/card"
bun tools/compose.ts 21-layout-center-v2.json 01-edited.mp4 25-final-v1.mp4 --intro "$O/music/a-shades-long2-pad.wav" --card-video card/remotion/out/card-crazy-v3.mp4 --duck-ramp 3 --intro-fade 8 --outro "$O/outro/a-shades-outro.wav" --end 0 --card 13 --fade-in-pow 3 --music-lufs -20.5 --overlays 20-overlays/manifest-sfx.json --sfx-rel center-in=0,center-out=-3,typing=0,accent=0 --preset fast
```

The intro and outro music are the episode 194 cues (`O`). Their arrangement files are in [episode 194 `video/card/music/`](../../20261027-uuidv4-vs-uuidv7/video/card/music/).

## Subtitles and transcript

[`../subtitles/`](../subtitles/), copied from `$R` on 2026-11-05:

- `10-youtube.en.srt`, `10-youtube.en.vtt`: YouTube captions, final-video time.
- `11-podcast.en.srt`, `11-podcast.en.vtt`, `11-podcast.transcript.md`: podcast time.
- `10-subtitle-fixes.json`: the dictionary applied (glossary pass); `12-subtitle-fixes-dict.md`: every fix that hit.
- `relabel.txt`: speaker corrections (`source start-end=Name`) for crosstalk where Scribe gave the wrong speaker.
- `spkid.py`: the MFCC speaker check used to find those ranges (`python3 spkid.py src.words.json <from> <to>`, reads `src16k.f32`, 16 kHz mono float32 of the source).
- `fixlog.ts`: lists every dictionary fix with its time and speaker (`bun fixlog.ts src.words.json yt|pod <time-map> <cuts.json> 10-subtitle-fixes.json "$(cat relabel.txt)"`). It imports `subtitles.ts` from the repository by absolute path.
