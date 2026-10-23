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
6. **Plan and audit the joins** (`render.ts --plan-only`, then `joins.ts`):
   every cut must sit in a real pause found in the audio. Read the "Kept for
   a clean sound" section of `cuts.md`: for a judgment row it shows the clean
   cut points (`||`) inside and around the phrase. Respan the row to such a
   point (shorter `phrase`) or mark it `"soft": true` when its edge is a
   sentence or clause boundary with a short dip. Fewer cuts beat bad cuts.
   Re-detect, re-plan, re-audit until no join scores above 3.
7. **Render**: splice audio sample-exact at the planned points with equal-power
   crossfades on room tone, drop the nearest video frames, normalize loudness
   (two-pass loudnorm, -16 LUFS; true peak -2.0 before AAC, about -1.5 dBTP after), encode H.264 CRF 19 + AAC 192k.
8. **Verify** and report the numbers, including the join audit (worst 10).
9. **Report**: output path, durations, cuts per category, filler kept/cut per
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
bun $S/joins.ts out-edited.cuts.json --top 15 --max-bad 0 --fail-above 6   # join audit (regression check)
bun $S/joins.ts out-preview.cuts.json --audio out-preview.mp4 --top 10       # same, on the rendered audio
bun $S/podcast-audio.ts out-edited.mp4 out-edited.cuts.json out-podcast --intro i.wav --outro o.wav --trim-end S --title "..."  # audio-only master (wav, mp3, time map)
bun $S/wordcheck.ts out-edited.cuts.json   # whisper at every join: dropped / doubled / unplanned words (leads, ~2 min)
bun $S/render.ts work/edl.json part.mp4 --src-from 2580 --src-to 3030 --preset fast  # one source stretch
bun $S/ab.ts old.joins.json old-edited.mp4 old.cuts.json work/edl.json ab.mp4 --top 10  # old/new A/B
bun $S/render.ts work/edl.json out-edited.mp4 --work work/render   # temp PCM, ~1.5 GB
bun $S/verify.ts out-edited.cuts.json out-edited.mp4 --joins 20 --work work/verify   # local whisper
```

## Output-to-source time map (for later layers)

Layout, music and overlays are built on top of the edited mp4. `<out>.cuts.json`
has `segmentTimes`: every kept segment in output order as
`{srcStart, srcEnd, outStart, outEnd}` (seconds; output time t maps to
`srcStart + (t - outStart)` inside its segment). `segments` holds the same as
source frame numbers at 25 fps. `audio` holds the sample-exact audio pieces
(they differ from the frame segments by under 20 ms).

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
Add `"soft": true` to a removal row whose edge is a sentence or clause
boundary with only a short dip (a 20 ms dip 20 dB under speech will do there;
other rows need a real pause, 30 dB under speech).

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
- Join planning (`plan.ts`; host feedback 2026-10-22: "cut weirdly, hard to
  listen, not natural"). Word timestamps are often 0.2-0.5 s off, so cuts
  never trust them alone:
  - Valleys: 10 ms levels; a valley is 30 ms+ under max(speech - 30 dB,
    min(floor + 6, speech - 24)) (speech = p90, floor = p10 of +-3 s).
    Blips under 40 ms and 20 dB under speech merge into the valley.
  - Each word boundary maps to a valley by a DP alignment, or is "glued"
    (the words run together). A cut edge must be a valley: no valley, no cut.
  - A removal row is cut whole or not at all (no partial cuts: they change
    the meaning). Auto rows also need no crosstalk and no untranscribed sound.
    Rows not cut are listed under "Kept for a clean sound" with the reason.
  - Placement: fade zones clear of loud frames, room tone matched on both
    sides (Zoom gating jumps 30 dB), kept silence within +-35% of the target.
  - Pauses: unchanged up to 0.9 s, then a smooth monotonic curve (1.2 s ->
    1.02 s, 2 s -> 1.34 s, cap 1.8 s); +0.1 s at a speaker change; a pause
    keeps its natural length when the gain is under 0.15 s. A breath right
    before the next phrase is kept.
  - Audio pieces are sample-exact; video follows to the nearest frame.
    No mute-in-place: it chopped words (222 of 227 patches on 2026-10-20).
  - Word-time cross-check: no cut takes most of a kept word, and every
    removed word lies within 0.3 s of its cut (else the alignment slipped).
  - Revert loop (render.ts): after planning, every join is scored on the
    rebuilt sound (joins.ts); a join with a room-tone step over 10 dB above
    the natural one, or a score over 4, is reverted and the plan is redone.
- Laughs (Scribe tags) and `beats`: never cut, and the silence before and after
  is not shortened (beats cap 2.5 s).
- Laughs in the audio (`prosody.ts`, into the EDL via `detect.ts --prosody`):
  sound not covered by words, 0.3-3 s, 3+ energy pulses at 2.5-9 per second,
  zero-crossing rate > 0.08. Protected like tagged laughs. Recall is partial
  (5 of 13 Scribe tags on 2026-10-20; most tags overlap words), so tags stay
  the main source.
- Join audit (`joins.ts`), per join: edge level in the fade zones (penalty
  over -30 dB re speech), room-tone level and spectrum step (both sides
  quiet, over the natural step), breath clipped or removed, butt-join,
  squeezed pause, pitch jump over the natural jump, crosstalk, mid-clause
  struggle. Writes `<base>.joins.json`. `--max-bad N --fail-above S` exits
  non-zero, so it serves as the regression check. 2026-10-20 episode: old
  edit 200 joins, 112 above 6; new plan 122 joins, 0 above 6.
- 0.3 s of room tone stays before the first word, 1.0 s after the last word,
  with a 30 ms fade-in and a 0.5 s fade-out.

## Outputs

Next to the output video: `<out>.cuts.md` (human list: totals, judgment rows,
candidates, notes, every cut), `<out>.cuts.json` (cut intervals, audio pieces, kept
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

## Captions and website transcript (subtitles.ts)

`subtitles.ts` makes the captions and the article transcript from the source
words JSON and the time maps. Words that the edit cut out do not appear.

```bash
# YouTube final: source -> edited (cuts.json) -> final (compose time map)
bun $S/subtitles.ts build src.words.json --cuts out-edited.cuts.json \
  --compose final.time-map.json --speakers speaker_0=Nik,speaker_1=Kirk \
  --relabel 2614-2615.7=Agent --fixes fixes.json --out final
# Podcast audio: source -> audio (podcast-audio.ts segments); --article adds the .transcript.md
bun $S/subtitles.ts build src.words.json --audio-map podcast.time-map.json \
  --speakers ... --fixes fixes.json --out podcast --article --title "..."
bun $S/subtitles.ts check final.srt                       # caption rules report
bun $S/subtitles.ts qa final final.mp4 --source src.m4a --n 10  # spot check by ear and by audio match
bun test tests/subtitles.test.ts                          # golden files, round trip
```

- Output: `<out>.srt`, `<out>.vtt`, `<out>.cues.json` (cues with their words, for qa).
- Rules: lines of 42 characters or fewer, 2 lines or fewer, cues of 1-7 s,
  20 characters per second or fewer. A dynamic program picks the cue breaks:
  sentence and clause ends first, never inside a word. Then each cue start
  can move up to 0.3 s from its first word to bring the reading speed down.
  Cross-talk is faster than 20 cps in about 5% of the cues; `check` lists them.
- Speakers: the name starts each turn ("Kirk: "). A cue with two speakers has
  one line each, and each line starts with "- ".
- Clean-up: captions drop fillers ("uh", "um") and cut-off stutters ("r-");
  the article also drops repeats of short words ("I, I") and laughter tags.
- Fixes: a JSON list of `[from, to]` pairs for ASR errors (names, code names).
  An empty `to` removes a word. Read the full SRT once and listen to doubtful
  words (`whisper-cli` on a short clip) before you add a fix.
- `--relabel a-b=Name` (source seconds) gives a range to another speaker,
  for example the meeting bot that diarization put on a host.
- "[music]" cues cover the opening card or intro and the end card or outro.
- Article (postgres.fm): `**Name** [hh:mm:ss]`, then paragraphs until the
  speaker changes. A short backchannel stays inline as `*(Kirk: Right.)*`.
- qa: for each random cue, whisper hears the output around the cue, and the
  source audio of the first and last word is found in the output by
  cross-correlation. 2026-10-22: offsets were 0-32 ms on both timelines.
  Whisper word times in short clips are off by up to 1 s; do not use them
  as the timing check. In cross-talk whisper often hears only one speaker.

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

## Cover (YouTube 1280x720 and square 3000x3000)

Tooling in `cover/`. Rules and the full cover system are in
`cover/system.md` (two text levels, 66 px minimum font, emotion matches
the hook, no neutral faces). Steps per episode, about 10 minutes:

1. Frames: `ffmpeg -i rec.mp4 -vf "fps=1,crop=W:H:X:Y" tiles/%04d.png` per
   host tile (tile positions shift when Zoom re-lays out the gallery; check
   a few frames).
2. Score: `swiftc -O -o facescore facescore.swift` once, then
   `./facescore tiles/*.png > scores.csv` (macOS Vision: landmarks, glare,
   sharpness, hand on face, brow raise, head pose).
3. Rank: `bun pick2.ts scores.csv <prefix> <maxGlare> words.json` writes
   one HTML sheet per expression class (laughing, smiling, surprised,
   skeptical, thinking), ranked by intensity; render each with
   `bun render.ts sheet.html sheet.png 1920 612`. `pick.ts` is the older
   smile-only ranker.
4. Cutout: `./prep.sh <nik|kirk> frame.png <faceX> out.png` (background
   removal via @imgly/background-removal-node, light denoise/sharpen and
   exposure match, face-centred crop). Prefer frames where the head does
   not overlap anything the cutout model keeps (Nik's orange chair logo).
   `LOGOFIX=1` enables `logo-fix.ts` (can nibble skin); `alpha-box.ts`
   clears hand-picked boxes. Always check the edge at 300%.
5. Compose: copy `concept-a-v3.html` or `concept-b-v3.html`, replace
   `img/NIK.png` and `img/KIRK.png`, edit the two text lines, then
   `bun render.ts page.html out.png` (square: `... 1000 1000 3`).
6. Check at 320x180 (`ffmpeg -vf scale=320:180`): every text element and
   both faces must still read.

Fonts (Anton, Archivo Black, Bebas Neue, Inter; OFL) are in `cover/fonts/`.
`bun install` in `cover/` brings playwright-core, the background remover
and pngjs; rendering uses the local Google Chrome binary.

## Overlays (on-screen cards, 1920x1080 alpha layers)

Tooling in `overlays/` (Remotion 4, TypeScript, Bun). Output: one ProRes 4444
alpha `.mov` per overlay plus `manifest.json` (schema in
`overlays/manifest.schema.json`), which `compose.ts` reads. Nothing is
composited here; `compose.ts` places every file at 0,0, inserts the freezes and
mixes the SFX.

Style rules (from the vDud / "вДудь" study, 2026-10-20):
- Drop, do not explain: a card appears on the word that needs it, stays 3-6 s,
  leaves. No advice text, no "as you can see".
- Real artifacts only: docs pages, commit or source pages, mailing-list
  messages, our own published charts. Captured at the source, zoomed,
  highlighted. Never redraw a source as our own card.
- One motion per card: wipe-from-left 0.3 s for strips, scale-pop 0.3-0.4 s for
  numbers and chips, eased push-in 1.0 s for screenshots; fade-out 0.2-0.3 s.
- Staged lines: multi-line cards build line by line (0.4-0.6 s apart).
- One fact per strip, under 60 characters. Frequency: one insert per 30-90 s of
  talk; full-screen cards at least 60 s apart; SFX at least 2 s apart.
- Reading time: `min_on_screen = max(1.5 s, words / 3)`.

Placement:
- `band`: strips, lower-thirds, link chips, quotes, gags. Default band
  x 24-1600, y 912-1052 (constant `BAND` in `src/Band.tsx`); confirm the free
  band with the layout owner first. Text 40 px (strips), 44 px (names), mono
  28-32 px (chips); never below 28 px.
- `full`: screenshots (`ShotCard`), number cards (`NumberPop`), notes and
  charts (`FullCard`). They dim the whole frame to about 22% so they never
  fight a face.

Host intros (`IntroCard`, vDud guest-intro grammar): the talk freezes right
after the name is said; a round photo (square crop of the host's own tile,
`public/face-<host>.png`) pops on the side where the host sits, the name
wipes in (92 px), the company chip (40 px), then 3-4 facts pop in one by one
(40 px, 0.45 s apart, one clack each). Host first and short (about 4 s),
guest longer (about 7 s). `freezeSec` = card duration. Facts: under 40
characters, each with a public source (commit messages with Author /
Reviewed-by, release-note contributor lists, postgres.fm people pages, company
sites) written to `facts.md` before the render; nothing unverified goes on
screen, and release-note facts are checked with a tag compare
(`api.github.com/repos/postgres/postgres/compare/REL_17_0...<sha>` = "behind"
means the commit is in 17.0).

Playlist inserts (`HackingInsert`): title strip, six recent thumbnails pop in
0.18 s apart (clack each), the grid shrinks to a top row, two "session ->
release" cards land with a pop on the release chip, then the playlist chip;
7 s freeze. Thumbnails come from `i.ytimg.com/vi/<id>/maxresdefault.jpg` for
the channel's own videos only. "Built live" or "the idea came up in this
session" wording must match what the session actually did (check captions:
`yt-dlp --write-auto-sub`).

SFX: low-frequency and soft only (Nik, 2026-10-20: "sounds are annoying,
should be low frequency, like wind or a low smash"). Family from
`scripts/sfx-synth.sh`: `air` (short puff, strips and chips), `thud1-3` (sub
hit 80->55 Hz, lowpass 800 Hz; a number or fact lands; variants rotate so
repeats differ), `wind1-2` (pink-noise swell, lowpass 1.5 / 1.0 kHz;
full-screen in and out). No bright clicks or ticks; keep every hit under the
voice. Helpers `tick/pop/clack/whoosh` in items.ts keep the old role names
and map to these files. The regular host gets no intro card; only the guest. `DUMP_PROPS=<dir> bun scripts/render-all.ts <id>`
writes the props JSON for `bunx remotion still` QA frames.

Freezes: on number cards where the number is the point (2-2.5 s) and on intro
and playlist cards (whole card); `freezeSec` in the manifest, never baked into
the overlay. The talk holds and
goes silent at `outStart`; the overlay plays its full duration over the frozen
frame and then over the moving talk.

Do not overexplain (Nik, 2026-10-20): a quote strip is the quote only, no
attribution or "closing takeaway" line; no subtitles or footnotes that restate
the obvious. Keep only what is needed to read the fact correctly ("Buffers,
not latency", "selected sample", the PG version). Text strips and quotes use
the hand-drawn yellow marker style (`Marker` in `src/Band.tsx`: dark text on
a roughened, slightly tilted yellow stroke, swiped in left-to-right over
0.5 s); the main takeaway of an episode is shown two or three times at the
moments the hosts say it, 5-6 s each, no freeze.

Editor's-note policy: one line, neutral, prefix "Editor's note:" in the accent
colour; only for on-air slips that change a fact (numbers, versions, what a
command does); never for slips the host corrects on air; cite the source in the
item's `source` field. Numbers from experiments are buffers and WAL, never
latency claims, and name the tool only (no internal paths or code).

Plan format (`overlay-plan.md`, before any render): one row per moment with
source time, output time, duration, type, exact on-screen text, verified URL
(HTTP 200 on the day), pause (freeze) and SFX; plus a locked wording list for
the Editor's notes and an open-items list.

Workflow per episode (about 1 hour for 20 overlays):
1. `cd overlays && bun install && scripts/sfx-synth.sh`.
2. Captures: `VW=960 VH=540 COL='#docContent' BROWSER_BIN=<chrome-headless-shell> bun scripts/capture.ts <url> '<selector>' public/<name>.png [scrollOffset]`.
   Each capture writes `<name>.rect.json` (target rect, content column,
   viewport); highlights and framing come from these rects, never estimated.
   Use `VW=960` for paragraphs and option names alike (text lands at 29 px
   before the push-in).
3. Copy `scripts/items.example.ts` to `scripts/items.ts`, edit the list.
4. `bun scripts/render-all.ts [id ...]` renders in parallel (3 at a time) and
   writes `../overlays/manifest.json` next to the `.mov` files.
5. QA sheet: composite a mid frame of every overlay over the layout still
   (`ffmpeg -i still.png -ss 3.2 -i x.mov -filter_complex overlay`) and check.

Review checklist before the final composite:
- Screenshot framing: no line cut at the left or right (content column fitted),
  target block under the URL chip, top and bottom edges faded; the push-in ends
  on the highlight.
- Labels: secondary labels 30 px or more, context line 28 px or more.
- Band cards fit the band (2 lines max); nothing over a face or the robot tile.
- Every URL on screen verified; every source in the manifest; no third-party
  art without a licence (gag cards are our own text).
- SFX: pop on the moment the number lands (1.7 s), tick on strips, whoosh for
  full-screen in and out; relative gains pop 0 dB, tick -3 dB, whoosh -6 dB.
- Chapters for the description: final = intro + edited time + freezes before
  the chapter; re-check against the packager's final time map.
- Overlays (`compose.ts --overlays manifest.json`): entries `{file, outStart
  (edited s), dur, placement band|full, freezeSec, sfx: [{file, at}]}`; files
  are full-frame 1920x1080 ProRes 4444 with alpha, placed at 0,0 from their
  final start. `freezeSec` > 0: the picture holds one frame (`loop` filter,
  frames snapped to 1/25 s) and the talk pauses; the gap is room tone (the
  quietest 0.4 s within +-10 s, played forward then reversed as a seamless
  loop, 40 ms crossfades), never digital silence; no music. SFX: loudest
  400 ms set to -20 LUFS plus `--sfx-rel` (pop 0, tick -3, whoosh -6 dB).
  Writes `<out>.time-map.json`: final = card + edited + sum of earlier
  freezes. `--from/--until/--tail` render short windows for checks.
- Final layout used on 2026-10-20: `layout.example.json` with big faces
  (924x594 at y 110), robot 240x135 at 1656,790; overlay band x 24-1600,
  y 912-1052. Full render with 22 overlays: about 45 min (fast preset).
- Verify a final: `bun $S/av-sync.ts edited.mp4 final.mp4 final.time-map.json
  20 300 1500 2900` (audio and video lag vs the map; expect |A/V| < 20 ms),
  ebur128 (-16 LUFS, true peak <= -1.5), stream durations equal. Lesson
  (2026-10-20): amix began at the latest first timestamp of its inputs and
  dropped the 4 s title-card audio; every amix input is now renumbered from
  sample 0. `--audio-only` re-makes the sound of an existing render and remuxes.

## Long-hold center blocks (no freezes)
- Rule (Nik, 2026-10-22): blocks never freeze or pause the talk. They play over it in the "center" placement (hosts at the edges) and stay while the topic is discussed: 12-25 s for data blocks, longer when the topic runs longer. Use big numbers and few words.
- `overlays/src/Blocks.tsx`: `bio` (guest bio), `hack2` (sessions -> shipped releases), `simple` (before -> after time per query + fix tag), `compare` (queries x maintenance arms, a per-row scale, a ÷N badge, small ms under each bar), `trap` (planner vs visibility map, then a staged heap-fetch/time table).
- Anchor every block to SOURCE word times (`srcStart`/`srcEnd` and reveal times relative to them), never to edited seconds. `scripts/blocks.example.ts <cuts.json> [--render]` maps them through `segmentTimes` and renders one at a time. `scripts/manifest-from-anchors.ts <cuts.json> <out>` rebuilds the full compose manifest for a new edit and sets every freezeSec to 0.
- Less is more (Nik, 2026-10-22, on a 2-query x 3-arm grid with buffers, badges and footer: "very hard to understand -- too much, overloaded"). Start with the `simple` comp: one big before -> after line per query, the fixing command as a yellow tag, one small caption, about 12 words in all, readable at phone size. Use `compare` only when the arms themselves are the point.
- Units: GiB/MiB, never GB/MB (heap 4,098,361 x 8 KiB = 31.3 GiB). State what each number is (warm or cold cache, buffers or time) in the caption and in the YouTube description.
- Timings from a test harness are context only. Show ms small, next to the deterministic metric (buffers, heap fetches). Never present a ratio of ms as a speedup.

## Brand opening, intro music, covers (brand/)
Old postgres.fm look: pink gradient (#ef7de3 -> #f39aea -> #faddf7) with grain, the script wordmark (postgres.fm_logo_black.png from the Transistor CDN, tinted white), the sunglasses elephant (cut from the 3000x3000 show artwork; tusk holes filled), Lato 900.
- Music: ElevenLabs credits can run out (Starter). Fallback with a clean licence: arrange GarageBand Apple Loops (/Library/Audio/Apple Loops/Apple; royalty-free in own soundtracks). `bun brand/music/cafinfo.ts *.caf` (key, beats, priming), `profile.ts` (energy per half-beat: where the hits are), `arrange.ts arr.json out.wav` (sample-exact, priming removed), `levels.ts cue.wav levels.json` (per-frame bands for beat-reactive graphics). Same-prefix loops are one kit (same key/tempo).
- Cards: Remotion comps CardShades / CardNeon / CardDial in brand/cards/src (13.4 s, beat clock {t0, b} must match the cue offset). Public assets: elephant.png, wordmark-*.png, fonts/Lato-*.woff2, <cue>-levels.json.
- Compose: brand/compose-card-video.patch adds `--card-video card.mp4` (animated title card) and `--fade-in-pow 3` (picture 1-(1-t/10)^3, sound afade ipar: readable early, still a 10 s fade).
- Covers: brand/cover/*.html, render with the cover render.ts (1280x720, square 1000x1000 at 3x). Put a host image's hard cut edge at the frame edge.
- Reposition means move only (Nik, 2026-10-22): when Nik asks to move an overlay, change only its start time or position. Never redesign its content, style, animation or SFX. Reuse the exact rendered .mov and give it a new source-word anchor.
- Theme: layout config "theme": "shades" (brand/layout-shades-theme.patch, brand/compose-shades-endcard.patch) draws the show background, labels, highlight and end card in the shades style.
