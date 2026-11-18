# Cold open v4/v5: style study and variants

An alternative to `preview/cold-open-final.mp4`. The final cold open does not change.

## Reference: the first 60 s of a late-night news-show segment (YouTube n6z70aaezd8)

This is a study of the style only. We copied none of its footage, music, type or logos. We looked at frames every 0.5 s, the scene cuts and the audio, and then deleted the download. It was never in the repo.

- **Shape.** A title package of about 9.5 s on the music, then a hard cut to the two hosts at the desk (applause, "Good evening"). The package has about 17 cuts in 9.3 s: 0.3-0.8 s per shot, with a cut on most beats.
- **First 3 s.** Dark, grainy background with small tick marks and tiny caps. One tracked word in white types in, the second word comes in a second colour, and a hand-drawn ellipse draws itself around the second word with an arrow line. The music starts on frame 1.
- **Type.** Wide-tracked bold caps for the names. Giant cropped letters that slide past the frame edge. Each name types in, first name white and last name in the accent colour, with a thin arrow line under it.
- **Image.** Black-and-white, high-contrast host portraits with a slow push-in. Short shots tinted in the accent colour, full-frame red fields, and a neon sign.
- **Transitions.** Hard cuts on the beat. Swipes come from type that moves across the frame, not from wipes. There are no glitches. The grain and the slow pushes give the motion.
- **Colour.** Black, white and one red accent until the hard cut to the full-colour blue studio.
- **Sound.** An upbeat band theme: drums, bass and stabs. It is loud from frame 1 and ends in a button as the show starts. There are no separate whooshes; the cuts sit on the drum hits. Our onset analysis was ambiguous (a flat peak between 160 and 166 BPM, so about 80-83 BPM at half time). The feel is a brisk funk/rock theme.

## How v5 uses it (v4 is in git history before this change)

The opening (`intro.json`, `intro.ts`, 17.8 s) uses our brand: Lato, plum and pink, and the postgres.fm wordmark.
- "LIVE FROM THREE TIME ZONES" types in as tracked caps with arrow lines, then comes the wordmark.
- A giant "STARRING" slides across the frame.
- A name card for each host shows black-and-white video of their own Zoom tile with a slow push-in. The big name sits on a dark plate with a pink edge, so it reads over light walls.
- A giant "GUEST" leads into Kirk's card.
- The header is "postgres.fm Postgres 19", with the ellipse drawn on "19".

Then a hard cut to the four strongest bites from `cold-open-final` (20.4 s):
1. Michael's "When would GTA 19 come out?", which follows "Tonight: Postgres 19".
2. Kirk's revert fest.
3. "years"/"decades".
4. The DDL closer.

Snap punch-ins cut to the speaker's own Zoom tile at full frame. The music drops 14 dB under the voices, and a one-hit button follows the last line. The text rule holds: everything in the opening ends by y 870.

## Variants (`build.sh a|b|c`)

| | Announcer | Music | FX |
|---|---|---|---|
| v5a | Yes (`README.md`) | Apple Loops "Throwback Funk" (Disco Funk), 120 BPM, A minor: beat, synth bass, brass; ducked 5 dB under the announcer | Typed caps, giant sliding words, name cards that fade in and out, grain, snap punch-ins. Toolkit SFX: U2 typing on the caps, K strokes on the cards, L punch on the giant words, G10 on the wordmark and header, G9 into the montage |
| v5b | No, for comparison | Apple Loops Electro House, 128 BPM: "Blueprint Beat 01", "Bedrock Bass", "Americana Synth", "Big Snare Roll Topper" build, "Basic Core Beat" bed | As v5a |
| v5c | Yes | v5a, plus "80s Synth FX Riser 01" into Kirk's card and into the closing line | As v5a, plus a white flash frame and an RGB split on every montage cut and punch-in, an impact shake and a punch on each punch-in. The name cards have no flash |

All three: -16 LUFS integrated with a limiter at 0.75, fade in 0.2 s, fade out 0.6 s.

## Licenses

| Asset | Source | License |
|---|---|---|
| All music loops above | Apple Loops that ship with GarageBand/Logic, from `/Library/Audio/Apple Loops/Apple/` | Royalty-free for use in your own music and soundtracks (Apple's GarageBand/Logic software license). The loops are arranged into a new cue, not distributed as stand-alone loops. Same basis as the episode 194-196 cues (`tools/podcast-edit/brand/music`). |
| Announcer voice | ElevenLabs text to speech, premade stock voice "Bill" (`pqHfZKP75CvOlQylNhV4`), on our paid ElevenLabs account | Commercial use under the ElevenLabs paid-plan terms. A stock voice, not a clone or an imitation of any real announcer. |
| U2, K, L, G9, G10 SFX | `tools/podcast-edit/sfx` | Synthesized by us (`generate.py`); owned by PostgresAI. |
| Font | Lato (brand-public/fonts) | SIL Open Font License |
| Host stills and footage | The episode 197 Zoom recording | Ours |

## Rebuild

```
SOURCE=<Zoom video1398514958.mp4> WORK=<cold-open-final media dir> bash build.sh a ../../preview/cold-open-v5a.mp4
```

`WORK` must hold `v3.src.mov` and `v3.layout.mp4` from `../coldopen-v3/run.sh` (run with `LAYOUT=layout-final.json`). The music arrangements are in `music/`.
