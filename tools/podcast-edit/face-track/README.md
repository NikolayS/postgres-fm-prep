# Face track for one Zoom tile

Use it when a host moves a lot in their camera and a fixed crop cuts off the head. The crop of that tile follows the face. The camera glides: it moves only when the face leaves a dead zone, and then a damped spring moves it. First used on episode 195 (Nik's tile), 2026-11-05.

macOS only: `faces.swift` uses the Vision framework (`swift` comes with the Xcode command line tools).

## Steps

Run from the review folder of the episode. `D` is any work folder.

```bash
S=~/.claude/skills/podcast-edit
D=work/face-track; mkdir -p $D/frames

# 1. One small frame per second of the tile, from the EDITED video (crop = the tile rect in
#    tiles.json; here Nik's tile, top right of a 2048x1152 gallery).
ffmpeg -loglevel error -i 01-edited.mp4 -vf "fps=1,crop=1024:576:1024:0,scale=512:288" -q:v 4 $D/frames/f%05d.jpg

# 2. Face rectangles.
swift $S/face-track/faces.swift $D/frames > $D/faces.jsonl

# 3. Smooth track. --place is the w x h of the tile's place in layout.json (the crop aspect);
#    --crop-h is the crop height in tile pixels (smaller = closer); --trim is the layout "crop".
bun $S/face-track/track.ts $D/faces.jsonl $D/nik-track.json --tile 1024x576 --det 512x288 --place 608x456 --crop-h 526 --face-y 0.55
```

4. Add `"track": "work/face-track/nik-track.json"` to that tile's place in `layout.json` (path relative to the layout file). `layout.ts` and `compose.ts` then crop the tile at the tracked position and ignore `crop`, `focusX` and `focusY` for it. They write the ffmpeg `sendcmd` file next to the track (`nik-track.cmd`).

5. Check a 2-minute window before the full render:

```bash
bun $S/compose.ts layout.json 01-edited.mp4 track-test.mp4 --from 1480 --until 1600 --preset fast
```

## Limits

- The track is in tile pixels and is applied to the tile in every Zoom layout. If the tile has a different size in another Zoom layout, make one track per size or check those parts.
- One face per tile. With two people in one camera it follows the larger face.
- Detection uses frames of the edited video. Re-run steps 1 to 3 after any change to the edit.
- `track.ts` options: `--dead 45x30` (px), `--omega 2.2` (spring speed; higher follows faster), `--median 3` (s each side), `--every 1` (s between frames), `--fps 25`.
