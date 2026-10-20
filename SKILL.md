---
name: podcast-edit
description: Post-process a podcast or Zoom recording - cut fillers (uh, um), stutters, false starts, long pauses, struggle moments, pre-show and post-show chatter, and bot interruptions; render a smooth edited video with a vetoable cut list (EDL). Use when asked to post-process a podcast, cut fillers, clean up or edit a Zoom recording, or shorten pauses in an episode.
---

# Podcast edit

Edit a recorded conversation so it is smooth to hear. Jump cuts in the video
are fine; the audience listens. Every cut is listed in an EDL, and a human can
veto any cut and re-render with one command.

## Prerequisites

- Bun, `ffmpeg`/`ffprobe` (Homebrew). Scripts are TypeScript, no Python.
- ElevenLabs Scribe for the source transcript: `ELEVENLABS_API_KEY` is
  exported in `~/.zshrc` (never print it). Scribe uploads the audio: run it
  once per episode on the source; everything else works from the words JSON.
- whisper.cpp (`whisper-cli`) with `~/.whisper-models/ggml-small.bin` for
  local checks (verify.ts default, nothing uploaded). `transcribe.ts --engine
  whisper` wants `--model` (default large-v3-turbo, not installed here).
- Disk: about 1.5 GB of temp PCM per episode in the `--work` dir.

## Workflow

1. **Transcribe** the source with word timestamps. Scribe keeps fillers
   ("uh", "um") and tags laughter; whisper drops many fillers.
2. **Detect** the mechanical cuts: fillers, immediate repeats ("the the",
   "it's a, it's a"), cut-off words before a restart ("sess- sessions").
3. **Judge** (you, the agent): read `review.txt` from start to end and write
   `judgment.json` (format below). Decide:
   - `head`: everything before the real show opening ("Hello, this is ...").
   - `tail`: everything after the sign-off.
   - `struggle`: abandoned sentence starts, searching for a word or name,
     restarts, tech trouble, "can you hear me". Keep the final, corrected
     version of the sentence. Drop only the failed attempts.
   - `bot`: kept by default. Use `bot-polish` to make it a clean exchange:
     cut dead air, crosstalk and the hosts' "Continue"/restarts around it; if
     the warning was cut off and repeated, keep one full version; add a
     `gains` row (`"db": "auto"`) so the bot matches the hosts' loudness.
   - `fillers`: one decision per filler (by meaning, not blanket; see Defaults).
   - `beats`: after a joke, punchline, tease, rhetorical or ironic line, and
     before a dramatic key point: the pause stays (cap 2.5 s).
   - `keep`: veto an auto row that is emphasis, a quote, or literal text
     ("hyphen, hyphen").
   - `candidates`: things you considered and kept (list them, so the human
     sees them). When unsure, keep.
   - `notes`: swears, factual slips, names to spell. Never cut a factual
     correction, a technical point, or a joke that lands.
4. **Prosody** (`prosody.ts`): filler pitch/length/level scores and laughs
   found in the audio. Then **detect again** with the judgment and prosody
   to build the final EDL.
5. **Preview first**: `--until 480` renders the first 8 min of output; get the
   host's go before the full render.
6. **Render**: plan the joins, lay room tone over removed words, splice audio
   sample-exact with 60-120 ms equal-power crossfades, drop the same video frames, normalize loudness
   (two-pass loudnorm, -16 LUFS; true peak -2.0 before AAC, about -1.5 dBTP after), encode H.264 CRF 19 + AAC 192k.
7. **Verify** and report the numbers, including join harshness (worst 10).
8. **Report**: output path, durations, cuts per category, filler kept/cut per
   speaker, beats and laughs protected, verify numbers, the top judgment cuts
   to check (with source mm:ss), how to veto.

## Commands

```bash
S=~/.claude/skills/podcast-edit
bun $S/transcribe.ts in.mp4 work/src.words.json --speakers 3     # or --engine whisper
bun $S/detect.ts work/src.words.json work/edl.json --review work/review.txt
# read work/review.txt, write work/judgment.json
bun $S/prosody.ts work/src.words.json work/prosody.json --show 01:00.34,03:05.72   # filler prosody
bun $S/detect.ts work/src.words.json work/edl.json --judgment work/judgment.json --prosody work/prosody.json --review work/review.txt
bun $S/render.ts work/edl.json out-edited.mp4 --plan-only          # writes out-edited.cuts.md/.cuts.json
bun $S/render.ts work/edl.json out-preview.mp4 --until 480 --preset fast --work work/render  # preview
bun $S/verify.ts out-preview.cuts.json out-preview.mp4 --harsh-only  # join harshness, worst 10
bun $S/render.ts work/edl.json out-edited.mp4 --work work/render   # temp PCM, ~1.5 GB
bun $S/verify.ts out-edited.cuts.json out-edited.mp4 --joins 20 --work work/verify   # local whisper
```

## Output-to-source time map (for later layers)

Layout, music and overlays are built on top of the edited mp4. `<out>.cuts.json`
has `segmentTimes`: every kept segment in output order as
`{srcStart, srcEnd, outStart, outEnd}` (seconds; output time t maps to
`srcStart + (t - outStart)` inside its segment). `segments` holds the same as
source frame numbers at 25 fps. Room-tone mutes (`muteOnly`) do not change
timing.

Put the words JSON, judgment.json and EDL next to the output (not only in a
temp dir): the EDL stores the words path, and a veto re-render needs it.
Render time: about 5 min for a 45 min 1080p25 episode on Apple Silicon.

Veto and re-render (one command): pass categories or row ids to `--keep`, or
set `"keep": true` on a row in the EDL.

```bash
bun $S/render.ts work/edl.json out-edited.mp4 --keep bot,r0123,r0456
```

## judgment.json

A range is a `phrase` (the exact words, as in `review.txt`; punctuation and
case are ignored) said `near` a time, or explicit `from`/`to` source times.
Add `speaker` ("speaker_0") when another voice talks over the phrase.

```json
{
  "removals": [
    {"cat": "head", "near": "00:00", "phrase": "Okay, let's go, right?", "reason": "pre-show"},
    {"cat": "struggle", "near": "07:58", "phrase": "heat map. Uh, uh, not heat map.", "reason": "wrong word corrected at once"},
    {"cat": "tail", "near": "52:09", "phrase": "I think it was great. No.", "reason": "after the sign-off"}
  ],
  "keep": [{"near": "17:31", "phrase": "hyphen,", "reason": "literal --"}],
  "fillers": [{"at": "01:00.34", "keep": true, "reason": "thinking before framing the question"},
              {"at": "03:06.48", "keep": false, "reason": "run of fillers"}],
  "beats": [{"near": "01:57", "phrase": "I have to say it sounds boring.", "reason": "joke", "side": "after"}],
  "gains": [{"near": "43:50", "phrase": "We are at 45 minutes.", "db": "auto", "reason": "bot loudness"}],
  "candidates": [{"near": "17:05", "phrase": "I cannot pronounce it.", "note": "self-joke, kept"}],
  "notes": [{"at": "30:11", "note": "swear, not bleeped"}]
}
```

`review.txt` shows each line as `[mm:ss.ss speaker]`, removed words in
`[brackets]` (judgment rows as `[cat:word]`), kept fillers in `<angle>`,
filler/repeat starts as `@mm:ss.ss` (use as `at` in `fillers`), and silences
over 0.7 s as `{1.3}`.

## Defaults and why

Host feedback (2026-10-20): hard jumps are heard by ear; gentle beats short.

- Fillers (uh, um, er, eh, hmm, mm): decided per instance by meaning. KEEP:
  thinking before a considered answer; "mm-hmm"/"mm" agreement (a turn of its
  own); "oh" of realization; "hmm" of doubt before a correction; a turn-start
  hold ("Uh, well...") before pushback; anything within 1.5 s of a laugh;
  glued ones (< 40 ms gap on both sides, also for repeats and cut-off words).
  CUT: mid-clause in a fact or list; runs (keep at most one); right after a
  pause (double hesitation); inside numbers or names. Target 15-30% kept per
  speaker; a density guard keeps one filler in any 60 s with 3+ and none kept.
  Every row has a reason ("kept: glued", "cut: mid-clause"). Rules give the
  first pass; the agent overrides in `fillers`.
- Prosody (`prosody.ts`): per filler/backchannel token (uh, um, er, eh, hmm,
  mm, mm-hmm, oh, ah) it grows the Scribe span into the gaps while the sound
  stays within 18 dB of the speaker's median word level (Scribe makes fillers
  too short), then measures duration, level vs that median, F0 (YIN, 10 ms
  hop, 70-400 Hz), pitch range and slope in semitones, gaps. Score
  "intentional" = 0.5 + 0.125 x (long >= 0.4 s, range >= 2.5 st, level >= -6
  dB, pause after >= 0.3 s) - 0.125 x (short < 0.25 s, flat < 1.5 st, quiet
  < -10 dB, glued < 40 ms). Calibrated on PostgresFM 2026-10-20 (range 3 st
  was too strict: p90 of Nik's fillers is 2.7 st). Context stays primary:
  prosody flips cut -> keep at >= 0.7 (highest first, until 30% kept per
  speaker), keep -> cut only at <= 0.2 with a "mid-" context. The EDL reason
  carries both ("kept: thinking ...; prosody 0.88 fall 1.6 st 0.48 s").
- Repeats: the earlier copy goes, the last stays. Not cut when the first copy
  ends a sentence ("Right. Right.") or is emphatic (yeah, yes, no, right,
  okay, always, very, hello, hyphen ...).
- Words with zero duration in the transcript (crosstalk) are never auto-cut.
- Pauses: only silences over 1.0 s are touched (`--max-gap`); scaled 1.2 s ->
  0.6 s, 3 s+ -> 0.8 s; +0.15 s at a speaker change (`--turn-extra`). Every
  join keeps at least 0.2 s (`--join-min`; 0.35 s at a turn change) or the
  original gap if shorter: never butt-join two words. A removed word leaves
  about 0.4 x its length (min 0.12 s) as room tone; when that leaves less than
  one frame to cut, the word is muted in place (room tone, no frames dropped).
- Laughs (Scribe tags) and `beats`: never cut, and the silence before and after
  is not shortened (beats cap 2.5 s).
- Cut points: the quietest video-frame boundary (40 ms grid) near the target,
  never inside a breath (0.12-0.8 s above floor + 8 dB, below speech), never
  closer than 50 ms after or 40 ms before a kept word. Untranscribed sounds in
  a pause are kept (they are often laughs or breaths).
- Quiet snap: word timestamps are not trusted alone. Each cut boundary moves
  (up to 240 ms either way) until 100 ms plus the crossfade on its side is
  within 6 dB of the local room-tone floor (10th percentile of +-3 s) or under
  -55 dBFS. No such point: a filler/repeat is muted in place (room tone, no
  frames dropped) and a pause stays as it is; judgment rows are cut anyway
  and marked "no quiet point" in the md.
- Laughs in the audio (`prosody.ts`, into the EDL via `detect.ts --prosody`):
  sound not covered by words, 0.3-3 s, 3+ energy pulses at 2.5-9 per second,
  zero-crossing rate > 0.08. Protected like tagged laughs. Recall is partial
  (5 of 13 Scribe tags on 2026-10-20; most tags overlap words), so tags stay
  the main source.
- Audio: removed words are replaced by the quietest nearby room tone before the
  splice, so a crossfade never leaks a filler and the floor stays continuous.
  Crossfades are equal-power, 60 ms + 30 ms per cut second, max 120 ms, and
  never reach a kept word.
- Safety: a planned cut is dropped when it overlaps a kept word, sits in
  crosstalk (two or more zero-length words nearby), or holds loud sound that
  no removed word explains (over 0.12 s for a pause, 0.3 s for an auto row;
  judgment rows skip this check). The md lists them under "Planned but not
  cut, for safety" with the reason.
- Audio and video use the same frame-aligned cut points, so A/V offset is zero
  by construction; verify.ts measures it.
- 0.3 s of room tone stays before the first word, 1.0 s after the last word,
  with a 30 ms fade-in and a 0.5 s fade-out.

## Outputs

Next to the output video: `<out>.cuts.md` (human list: totals, judgment rows,
candidates, notes, every cut), `<out>.cuts.json` (cut intervals, mutes, kept
segments and the output-to-source time map) and `<out>.verify.json`. Keep the EDL, judgment.json and the
words JSON next to the output too, so a veto re-render works later. The
`--work` dirs are temporary and safe to delete.

## Verify (verify.ts)

1. Durations: planned vs video stream vs audio stream.
2. A/V offset at start, middle and end: output frame vs source frames at the
   mapped time (-1/0/+1 frame), and audio cross-correlation lag (should be 0 ms).
3. Re-transcription of the edited audio (local whisper by default;
   `--engine elevenlabs` uploads) vs the kept source words: missing words, and
   how many of them sit next to a join (the suspicious kind; the rest is ASR
   variance, and whisper drops most kept fillers - check a few by ear).
4. 20 random joins: a 3 s clip is transcribed and compared with the expected
   words, and a click ratio (largest sample step at the join vs the 99.9th
   percentile step around it; above 2 means listen to it).
5. Join harshness, every join: level step and spectral-shape step of the room
   tone on each side (levels under -70 dBFS clamped; Zoom gates silence), and
   the silence left at the join (< 0.12 s = butt-join). Worst 10 printed. A
   step over 30 dB usually means a word tail was clipped: listen to it.

## Layout, music and cards (packaging)

Scripts for the picture and the intro/outro, on top of the edited mp4. They
need Google Chrome (headless, draws text and the background into PNGs: this
ffmpeg has no drawtext) and, for music, `ELEVENLABS_API_KEY`.

```bash
S=~/.claude/skills/podcast-edit
# 1. Tiles and layout changes in the SOURCE (Zoom gallery; names in reading order)
bun $S/detect-tiles.ts in.mp4 --out work/tiles.json --names robot,nik,kirk
# 2. Copy layout.example.json, set tiles/cuts paths, names, labels, highlight times
bun $S/layout.ts layout.json out-edited.mp4 still.png --still 200
bun $S/layout.ts layout.json out-edited.mp4 layout-preview.mp4 --from 110 --dur 60 --preset fast
# 3. Music options (3 intro + outro pairs, prompts in music.ts or --options file)
bun $S/music.ts generate work/music --model music_v2_5
# 4. Final: title card + show + end card + music, -16 LUFS / -1.5 dBTP
bun $S/compose.ts layout.json out-edited.mp4 intro-demo.mp4 --intro work/music/a-pulse-intro.mp3 --until 36 --preset fast
bun $S/compose.ts layout.json out-edited.mp4 final.mp4 --intro a-intro.mp3 --outro a-outro.mp3
```

- `detect-tiles.ts`: one sample every 10 s finds stable layouts (2+ equal
  samples); between them every frame (25 fps) goes to the nearest layout, so
  Zoom resizes and flips are found to the frame. Tile rects: non-black mask
  with holes closed (dark rooms have pure-black pixels), row bands by extent,
  touching tiles split by 16:9. Output: `layouts` (rects per tile name) and
  `intervals` (source times). Edit the JSON to override.
- `layout.ts`: per (layout, tile) a crop (trim border and the Zoom name label,
  `crop` fractions; `focusX/Y` -1..1) + lanczos scale + light `cas` sharpen,
  shown only while its layout is on (source intervals mapped to output time
  with `segments` from cuts.json). Because crops are relative to the tile, a
  Zoom resize does not move the faces. `highlight` (source times) adds a glow
  frame on a tile, fade 0.3 s. Speed about 1.4x realtime on Apple Silicon.
- `compose.ts`: title card 4 s (layers fade and slide in) -> 0.5 s crossfade
  -> show -> 0.6 s crossfade -> end card 10 s (`cardTitle` with "\n" breaks,
  `links`). Music cues are set to -18 LUFS. The intro plays at full level on
  the card, ducks `--duck` -15 dB 0.1 s into the show (the edit keeps 0.3 s
  of room tone before the first word) and is gone by card + 6 s. The outro bed
  enters ducked 10 s before the show ends, rises over 1.2 s after the
  sign-off, and its natural ending lines up with the end of the end card.
  Two-pass loudnorm (audio-only first pass) to -16 LUFS, -1.5 dBTP.
- `music.ts`: ElevenLabs `POST /v1/music`, `force_instrumental`,
  mp3_44100_128 (Starter cannot download 192 kbps). `seed` cannot be used with
  `prompt`. Each option writes a `.json` provenance record (prompt, model,
  date). Licence (Eleven Music terms, checked 2026-10-20): Starter allows
  online and offline commercial use except film, TV, radio, music-streaming
  distribution and music libraries; 17 min generation / 30 min download per
  month; Starter is marked "For Individual Use Only", so use Creator or
  higher for a company show.
