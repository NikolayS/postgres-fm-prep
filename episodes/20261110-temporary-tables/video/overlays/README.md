# Overlays (#196)

Nineteen cards, described in [../../illustrations.md](../../illustrations.md). Remotion compositions on top of `tools/podcast-edit/overlays`, with episode 194's `BandTyping` for the band cards.

- `src/Ep196.tsx`: `shot196` (real captures in the center panel: push-in, red underline or box from the capture's rects, URL line; `swap` or `stack` of several captures), `layers196` (the problem layers, staged), `code196` (the SQL lines, staged).
- `src/Root.tsx`: registers the compositions of episodes 194, 195 and 196.
- `scripts/ep196.ts`: every card anchored to SOURCE word times (`src.words.json`, checked with `find.ts`) and mapped through the cuts file. Every number under `at`, `at10`, `at60`, `noteAt` in the props is a source time. Writes `manifest.json`, `props/`, the typing bursts and, with `--render`, the `.mov` files into `$R/20-overlays`.
- `scripts/shot.ts`: captures a block of a real page (also inside the brief's iframe) at 2x with headless Chrome and writes `<name>.rect.json` (clip, highlight rects of exact text or of a CSS element). Env: `VW`, `THEME=dark|light`, `PAD`, `MAXW`, `MAXH`, `UP` (go up n parents), `END` (union with a second element), `TZID` (default UTC).
- `scripts/render-all.sh`: renders every card, then re-encodes it with `prores_ks -profile:v 4 -qscale:v 8` (ProRes 4444 with alpha, about 37% smaller than Remotion's default, mean pixel difference 0.15 of 255) to fit the disk.
- `scripts/ctx.ts`: prints the source transcript with word times (`bun ctx.ts src.words.json <from> <to>`).
- `captures/`: the PNG captures and their rect files (copy to `public/ep196/` of the tool).
- `qa/`: `qa-sheet.sh` (mid frame of each card over `01-edited.mp4`) and `sheet.py`.
- `manifest.json`, `manifest-sfx.json` (after `sfx-manifest.ts`), `props/`, `*-typing-bursts.json`: copies of the files in `$R/20-overlays`.

Set up the tool:

```bash
REPO=~/github/postgres-fm-prep; E194=$REPO/episodes/20261027-uuidv4-vs-uuidv7/video/overlays; E196=$REPO/episodes/20261110-temporary-tables/video/overlays
T="$R/scratchpad/overlays/tool"; mkdir -p "$T" && cp -R $REPO/tools/podcast-edit/overlays/. "$T"/
cp $E194/src/Episode.tsx $E194/src/typing.ts $REPO/episodes/20261104-extensions-on-demand/video/overlays/src/Ep195.tsx $E196/src/*.tsx "$T/src/"
cp $E196/scripts/*.ts "$T/scripts/"; mkdir -p "$T/public/ep196" && cp $E196/captures/* "$T/public/ep196/"
cd "$T" && bun install && bun scripts/ep196.ts ../../../01-edited.cuts.json        # manifest + props
$E196/scripts/render-all.sh                                                         # .mov files
cd "$R/20-overlays" && bun $REPO/tools/podcast-edit/sfx-manifest.ts manifest.json --out manifest-sfx.json --accent 04-layers=<s>
```
