# Cold open v4: style study and variants

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

## How v4 uses it

`title.ts` renders a 12-beat title in our brand (Lato, plum and pink, the postgres.fm wordmark):
- beats 0-2: tracked caps "POSTGRES" type in, "19" in pink, the ellipse and arrows draw;
- beats 2-6.5: a giant cropped word on pink, then each host as a black-and-white portrait with the name typed in (first name white, last name pink, with an arrow line);
- beats 6.5-8: a fast run of pink duotone face shots;
- beats 8-12: the one-line header "postgres.fm Postgres 19" with the ellipse on "19".

Then comes a hard cut to the six-topic montage from `cold-open-final`, with the same bites, layout and NOTIFY strip. Snap punch-ins cut to the speaker's own Zoom tile at full frame. The music drops 14 dB under the voices, and a one-hit button ends the clip after the last line. The host stills are frames from the recording.

The text rule holds: the title text ends by y 800, and the montage keeps the strip under the heads.

## Variants (`build.sh a|b|c`)

| | Opening | Montage | Music | FX |
|---|---|---|---|---|
| v4a | Announcer intro (`intro.json`, `intro.ts`, 17.8 s), see `README.md` | Five topics, 24.8 s (CVE and NOTIFY bites dropped) | Apple Loops "Throwback Funk" (Disco Funk), 120 BPM, A minor: beat, synth bass, brass | Typed caps, wordmark, giant sliding words, name cards on the hosts' own video in black and white with a slow push-in, the ellipse on "19", grain, snap punch-ins; toolkit SFX (U2, K, L, G9, G10) |
| v4b | The 12-beat title, no announcer (`title.ts`, 5.6 s) | All six topics, 34.2 s, with the NOTIFY strip | Apple Loops Electro House, 128 BPM: "Blueprint Beat 01", "Bedrock Bass", "Americana Synth", "Big Snare Roll Topper" build, "Basic Core Beat" bed | As v4a, with stills and typed names (the first cut, kept for comparison) |
| v4c | As v4a | As v4a | v4a, plus "80s Synth FX Riser 01" into Kirk's card and into the closing line | As v4a, plus a white flash frame and an RGB split on every montage cut and punch-in, an impact shake and a punch on each punch-in. The intro has no flash: name cards fade in and out |

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
SOURCE=<Zoom video1398514958.mp4> WORK=<cold-open-final media dir> bash build.sh a ../../preview/cold-open-v4a.mp4
```

`WORK` must hold `v3.src.mov`, `v3.layout.mp4` and `m-notify/` from `../coldopen-v3/run.sh` (run with `LAYOUT=layout-final.json`). The music arrangements are in `music/`.
