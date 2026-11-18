# Cold open v8 — episode 197

Based on v7b: the same 128 BPM funk cue, 44.72-second picture timeline,
six topics, transitions, CO-HOST cards and word timings.

Changes: removed face annotations; choose caption slots from face detections
across each shot, zooming out when needed; match split-panel eye distance to
105 px and eye height to y=450 using median detected pupils. Captions end above
y=900. Level each speech bite to -18 LUFS before mixing, add Michael presence
EQ at 3 kHz, and duck the funk bed under speech. Final target is -16 LUFS.

## Build and verify

Requires Bun, ffmpeg, Chrome, the cover toolkit dependencies, Swift/Vision,
OpenCV 4.x (Python, for the independent delivery check), and local whisper.cpp.
WORK is the existing coldopen-final media directory containing v3.layout.mp4
and v3.src.mov. SOURCE is the original Zoom recording. Media stays outside git.

```sh
SOURCE="$SOURCE" WORK="$WORK" bash prep.sh
swiftc -O faces.swift -o /private/tmp/ep197-faces
find "$WORK/v7/n" "$WORK/v7/m" "$WORK/v7/k" "$WORK/v7/wide" -name '*.jpg' | /private/tmp/ep197-faces > "$WORK/v7/faces.jsonl"
bun fx.ts "$WORK/v7/fx"
bun v8.ts "$WORK/v7" "$WORK/v7/fr8"
bun check-caps.ts "$WORK/v7/fr8" /private/tmp/ep197-faces
bun check-split.ts "$WORK/v7/faces.jsonl" /private/tmp/split-check.json
WORK="$WORK" bash build.sh /absolute/path/cold-open-v8.mp4
python check-opencv.py "$WORK/v7/fr8" /absolute/path/cold-open-v8.mp4
bun check-audio.ts "$WORK/v7/v8tmp" /absolute/path/cold-open-v8.mp4 /private/tmp/audio-check.json
```

Check frame crops of caption reveals and the split screen. Keep caption JSONL
and QA reports, then delete rendered JPEGs immediately after encoding; the
OpenCV delivery check reads the MP4. Stop if free disk falls below 3 GiB.

Music provenance is in music/b-funk.json: Apple GarageBand loops arranged into
an original cue, royalty-free in this soundtrack. Do not distribute the loops.
Footage and synthesized FX are ours; Lato is SIL OFL.
