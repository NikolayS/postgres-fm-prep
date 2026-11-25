# Episode 198 final

Media stay outside git, in the recording's `review/` folder (`<review>` below).

| File | Length |
| --- | --- |
| `<review>/final/episode-198-final.mp4` | 53:01.83: bold cold open 24.44 s + particle intro A 17.96 s + show 51:56.64 (edit v5) + outro 22.72 s |
| `<review>/podcast/postgres-fm-198-final.mp3` | 52:38.12 (intro music 17.96 s + show + outro; no cold open, no overlay sounds except one cue at podcast 19:42.56) |
| `<review>/covers/thumb-{a,b,c}.png`, `square-3000.png` | 1280x720, 3000x3000 |

## Recipe (episodes 194-197)

- **Cold open:** a montage in the published episode 196/197 form. It has 5-7 short lines, alternating voices, hard cuts and a punchline ending, on a clean screen with the episode 197 funk cue (0.2 under the voices, full on a 1 s button). Built by `../coldopen/montage.sh`, joined by `join.sh`. Three variants are offered to the host; the final uses bold.
- **Title card:** a crazy Remotion card on the 14 s `a-shades-long2-pad` cue, crazier than the last one, fun with the elephant and never with the heads. Kirk is on the left and Nik on the right (they face each other; Nik's order for this episode), and Michael's empty chair carries a friendly sign that flips to "Michael's seat: AUDITOR". `../card/`, `--card 13`.
- **Body:** the two-tile layout used when one host is absent (episode 196), Kirk left and Nik right, with the one-line 104 px header (episode 197). The samograph tile is small at the bottom right, and the Circleback tile is never shown. Files: `layout.json`, `tiles-manual.json`.
- **Intro:** particle intro A (`../intro-particles/`, 17.96 s, `--card 17.96 --fade-in 0 --intro-lufs -18.5`). Fallback: the 13 s title card below.
- **Overlays:** 42 (15 band strips under the heads with typing sounds, 27 center panels with IN/OUT sounds), mostly animated Remotion pieces from the post's own diagrams and data, incl. the 3D AAA hero (`Aaa3D.tsx`). The hosts move to the right column while a panel is up. Manifest `manifest-v5-sfx.json`, every row checked on its words (`verify-v5.tsv`). `../overlays/`.
- **Outro:** "In this episode: <title>", then Postgres.AI and "Prepared by". No Forge frame: there was no Forge experiment. `../outro/`.
- **Music:** `--music-lufs -20.5 --duck -21 --duck-ramp 3 --intro-fade 8`, outro bed `a-shades-outro`.
- **Voices:** `level.ts` adds Nik +2.3 dB and Kirk -1.6 dB to the finished mix (body and podcast). Measured on the final (LUFS, 94 Nik and 37 Kirk stretches of 5-8 s): Nik -15.6, Kirk -15.5; every 5-minute block within 1.6 LU. With +1.6 Nik was 0.7 LU lower, 1-2 LU in the last 10 min.

## Build

1. The opening is a separate segment, so it can be swapped without a body render. `render-body0.sh`: the body with `--card 0`. `head.sh particle <intro video> <intro bed> 17.96 30`: the intro plus the first 30 s of the show. Show = head (gain -0.7 dB to match the body) + body0 from 30 s, re-encoded at the same timescale (a stream-copy cut at a keyframe shifted the video by 90 ms).
2. `bun level.ts <body.mp4> ... body-level.wav`, then remux with the compose limiter (see the shell history in the review notes): `episode-198-body-lv.mp4`.
3. `BODY=<body-lv> bash join.sh <review> <cold-open variant>`: re-encoded cold open + body = `episode-198-final.mp4`. Then trim to the video length and re-encode the whole audio in one pass (cold-open audio to 24.44 s + body audio): the stream-copy join left 20 ms of digital silence (AAC priming) at the join. (`coldopen.sh` is the v1 method: slices of the body.)
4. Podcast: `podcast-audio.ts` (`--music-lufs=-20.5 --duck=-21 --card 17.96 --tail 22.72`, intro bed A), then `level.ts --offset 17.96 --sr 44100 --gain speaker_1=2.3,speaker_0=-1.6`, the one cue (center-in, -9.6 dB, at 19:42.56), loudnorm -16 LUFS, MP3 192k with the square cover.
5. `bun stems.ts <body-lv.mp4> ... --gain speaker_1=2.3,speaker_0=-1.6` for the qa.ts audio check.
6. `bun set_times.ts 24.44 --card 17.96`: video times = edited + 42.40 s, podcast times = edited + 17.96 s. Measured on the final at all 18 chapters: edited + 42.49 s (the head join adds 0.09 s; chapters are whole seconds).
7. If the compose freezes at the outro: `splice.ts --outro <outro> --at <time-map logo.start>`, then `render.sh` with `--audio-only`.
8. `EP198_REVIEW=<review> bun gen-qa.ts ../../qa.json <manifest-sfx> <cold-open s> <card s>`, then `qa.ts`. Frame sheet: `swift frame-sheet.swift <frames dir> <out.png> 4`.

## Differs from episodes 196 and 197

- No Forge frame in the outro: there was no experiment.
- The podcast has no cold open: the episode 197 decision.
- Center cards are figure screenshots, not `cards/*.card.json` data cards, because every number is the published post's own. `qa.json` skips `cards` and gives this reason.
- The title-card text ends by y 890. In episodes 196 and 197 the name labels sat at about y 970; the bottom-180 px rule now applies to cards too.
