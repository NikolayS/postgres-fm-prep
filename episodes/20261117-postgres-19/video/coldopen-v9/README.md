# Cold open v9 — two endings

Uses the delivered v8 picture through frame 931 (37.28 seconds), then swaps
Nik's Postgres 20 question and Michael's “The only thing. That small thing.”
The rest of the edit, music/SFX timeline, 43.125-second button and 44.72-second
picture duration stay as in v8. The prefix is decoded from v8 and re-encoded;
it is the same edit, not a bit-for-bit copy of the encoded stream.

- **a:** freeze on three slanted panels, matching the earlier decades split.
- **b:** freeze on Michael alone.

The freeze begins at picture frame 1064 (42.56 seconds). Selected 1-based
v7 JPEGs: Nik `n/0797.jpg`, Michael `m/0749.jpg`, Kirk `k/0773.jpg`, all from
the DDL closer. Each was visually checked for open eyes. Apple Vision pupil
landmarks center each face; split eye distance is 105px with eyes at y=400.
Solo eye distance is 125px with eyes at y=340. Title remains below the heads,
y=760–876 (overshoot contained above y=900). No annotations on faces.

The final exchange starts at montage 28.84s; Nik now occupies 28.84–31.64s,
Michael 31.64–34.24s. Both use the v8 leveled speech stems. Music and SFX retain
v8 timing and levels, as does the +2dB master gain and limiter. New audio uses
the delivered v8 prefix through 37.2775s, then the remixed closing exchange.

## Build

Requires the same local media, Bun, Chrome/Playwright, ffmpeg, and compiled
`../coldopen-v8/faces.swift` detector as v8. No media belongs in git.

```sh
WORK=/path/to/coldopen-final FACES_BIN=/path/to/faces \
  bash build.sh /absolute/path/to/preview /absolute/path/to/scratch/v9
bun check-geometry.ts "$WORK/v7/faces.jsonl" "$QA/geometry.json"
for v in a b; do
  bun check-audio.ts "$QA" "$OUT/cold-open-v9$v.mp4" "$QA/audio-$v.json" "$WORK/v7/v8tmp"
done
```

Build checks every changed caption/title frame with Vision, decodes both
outputs, removes rendered JPEGs after encoding (three QA samples retained),
and stops below 3 GiB free. Source framing and title clearance are checked by
`check-geometry.ts`; verify final encoded frames visually too. Earlier v8
caption checks remain applicable to the unchanged prefix.
