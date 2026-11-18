# Cold open v7 (episode 197)

v7 is v4b rebuilt with bigger effects. It keeps v4b's typed title, its full six-topic montage, its punch-in pacing and its Electro House cut. There is no voice. All four variants have the same picture, cut on a grid of U = 0.46875 s (one beat at 128 BPM). Length 44.7 s; the button hit is at 43.125 s (unit 92).

## Picture (`v7.ts`)

### Title: 18 units (8.44 s)

| Units | Shot | Effects |
|---|---|---|
| 0-2 | "POSTGRES", then a pink "19" | Each slams in on its beat with overshoot and a 2-frame RGB split; an ellipse draws around "19"; arrows draw in; duotone hosts flicker behind |
| 2-2.5 | Giant "POSTGRES" on pink | Slides left and whips out |
| 2.5-11.5 | Nik, Michael, Kirk: 3 units (1.41 s) each | A giant first name on pink (0.5 unit), then the card whips in (Kirk's from below), freezes to duotone with a shake and an RGB hit. The plate reads "CO-HOST" for all three; the name types in about 0.3 s and holds about 0.9 s. An ellipse and an arrow draw onto the face |
| 11.5-12.5 | Face run | Three tight pink duotone faces, a third of a unit each |
| 12.5-18 | "postgres.fm Postgres 19" | Types on; "19" slams from 3x with a shake, a light leak and one soft flash; an ellipse draws; then a zoom through the "1" into the wide shot |

### Montage: 34.24 s, v4b's six topics and punch-ins

Word-synced band text under the heads (y 740-864): "GTA VI / NOV 19", "GTA 19?", "COMMIT FEST" with COMMIT struck through and "REVERT" landing on the word, "20x CVEs", "NOTIFY 200/s" counting up to "11,000/s", "YEARS" struck through to "DECADES", "JUST DDL" with an ellipse on "DDL", and "JUST DDL + POSTGRES 20". Whip-pans and zoom-blurs join the topics. One glitch (5 frames) cuts into a skewed three-way split screen of the "decades" laugh, with the music out; Nik's panel grows to full frame for his "Decades." A giant pink "19" wipes into the DDL closer.

**Ending:** a freeze-frame turns to duotone with a slow push; "postgres.fm Postgres 19" stamps on the button hit and the clip cuts to black.

## Music and sound (`build.sh`, `music/*.json`)

| Variant | Music | Fit to the grid |
|---|---|---|
| v7a | v4b's Electro House arrangement: "Blueprint Beat 01", "Bedrock Bass", "Americana Synth", "Big Snare Roll Topper", "Basic Core Beat" (02 Electro House, 128 BPM) | 1 beat = 1 unit |
| v7b | Funk/band: "Throwback Funk" beats, synth bass and brass, "Electric Funk Synth Stabs", "80s Synth FX Riser 01" (09 Disco Funk) | 120 -> 128 BPM, 1 beat = 1 unit |
| v7c | Trailer: "Legend" drone, dark pad, beat, sub bass and lead (01 Hip Hop), plus synthesized impacts, braam and riser | 80.5 -> 85.33 BPM, 2 beats = 3 units |
| v7d | Lo-fi: "Crunchy Funk" beat and "Chill Loop" guitar and bass (07 Chillwave), plus vinyl crackle | 90 -> 85.33 BPM, 2 beats = 3 units |

As in v4b: music full in the title, a 0.2 bed under the voices, full on the button; typing under each typed name; punches on the slams. Mixed to -16 LUFS.

## Sources and licenses

| Asset | Source | License |
|---|---|---|
| Music loops | Apple Loops that ship with GarageBand/Logic (`/Library/Audio/Apple Loops/Apple/`): 02 Electro House, 09 Disco Funk, 01 Hip Hop, 07 Chillwave | Royalty-free for use in our own soundtracks (Apple's GarageBand/Logic license). They are arranged into new cues (`music/*.json`, `tools/podcast-edit/brand/music/arrange.ts`), not distributed as loops |
| Whoosh, slam, impact, braam, riser, glitch, crackle | Synthesized from noise and oscillators by `fx.ts` | Ours |
| Typing, punch, sweeps | `tools/podcast-edit/sfx` | Ours |
| Font | Lato | SIL Open Font License |
| Footage | The episode 197 Zoom recording | Ours |

## Build

```
SOURCE=<Zoom video1398514958.mp4> WORK=<cold-open-final media dir> bash prep.sh
bun fx.ts $WORK/v7/fx
bun v7.ts $WORK/v7 $WORK/v7/fr
for v in a b c d; do WORK=$WORK bash build.sh $v preview/cold-open-v7$v.mp4; done
```
