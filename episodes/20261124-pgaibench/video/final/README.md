# Episode 198 final

Media stay outside git, in the recording's `review/` folder (`<review>` below).

| File | Length |
| --- | --- |
| `<review>/final/episode-198-final.mp4` | 54:22.93: cold open A 20.14 s + title card 13 s + show 53:27.84 + outro 22.72 s |
| `<review>/podcast/postgres-fm-198-final.mp3` | 54:03.56 (intro 13 s + show + outro; no cold open, no overlay sounds) |
| `<review>/covers/thumb-{a,b,c}.png`, `square-3000.png` | 1280x720, 3000x3000 |

## Recipe (episodes 194-197)

- **Cold open:** a montage in the published episode 196/197 form. It has 5-7 short lines, alternating voices, hard cuts and a punchline ending, on a clean screen with the episode 197 funk cue (0.2 under the voices, full on a 1 s button). Built by `../coldopen/montage.sh`, joined by `join.sh`. Three variants are offered to the host; the final uses A.
- **Title card:** a crazy Remotion card on the 14 s `a-shades-long2-pad` cue, crazier than the last one, fun with the elephant and never with the heads. Kirk is on the left and Nik on the right (they face each other; Nik's order for this episode), and Michael's empty chair carries a friendly sign that flips to "Michael's seat: AUDITOR". `../card/`, `--card 13`.
- **Body:** the two-tile layout used when one host is absent (episode 196), Kirk left and Nik right, with the one-line 104 px header (episode 197). The samograph tile is small at the bottom right, and the Circleback tile is never shown. Files: `layout.json`, `tiles-manual.json`.
- **Overlays:** 5 band strips under the heads with typing sounds, and 3 center cards (real screenshots of the post's figures, URL printed below) with IN/OUT sounds. The hosts move to the right column while a card is up. `../overlays/`.
- **Outro:** "In this episode: <title>", then Postgres.AI and "Prepared by". No Forge frame: there was no Forge experiment. `../outro/`.
- **Music:** `--music-lufs -20.5 --duck -21 --duck-ramp 3 --intro-fade 8`, outro bed `a-shades-outro`.
- **Voices:** `level.ts` adds Nik +1.6 dB and Kirk -1.6 dB to the finished mix (body and podcast), so the spread is 0.0 dB. Before, Nik was 3.2 dB lower.

## Build

1. `render.sh`: compose with the episode 197 tool copy plus `compose-card-video.patch` (the episode 196 `--card-video` and `--music-lufs`).
2. `bun level.ts <body.mp4> ... body-level.wav`, then remux with the compose limiter (see the shell history in the review notes): `episode-198-body-lv.mp4`.
3. `bash join.sh <review> <cold-open variant>`: re-encoded cold open + body = `episode-198-final.mp4`. (`coldopen.sh` is the v1 method: slices of the body.)
4. Podcast: `podcast-audio.ts` (`--music-lufs=-20.5 --duck=-21 --card 13 --tail 22.72`), then `level.ts --sr 44100`, loudnorm -16 LUFS, MP3 192k with the square cover.
5. `bun stems.ts <body-lv.mp4> ... --gain speaker_1=1.6,speaker_0=-1.6` for the qa.ts audio check.
6. `bun set_times.ts 20.12`: video times = edited + 33.12 s, podcast times = edited + 13 s.

## Differs from episodes 196 and 197

- No Forge frame in the outro: there was no experiment.
- The podcast has no cold open: the episode 197 decision.
- Center cards are figure screenshots, not `cards/*.card.json` data cards, because every number is the published post's own. `qa.json` skips `cards` and gives this reason.
- The title-card text ends by y 890. In episodes 196 and 197 the name labels sat at about y 970; the bottom-180 px rule now applies to cards too.
