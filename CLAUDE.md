# Rules for agents in this repository

## The show: three co-hosts

postgres.fm has three co-hosts: Nik, Michael Christofides and Kirk Wolak. Kirk is never called a guest (cards, notes, descriptions, social posts). On-screen order: the hosts face each other, never outward (Nik, 2026-11-24, episode 198: "I should be on the right, Kirk on the left"). There is no fixed name order: decide it on real frames of each recording with `tools/podcast-edit/qa/facing.ts estimate`, write `video/final/facing.json`, and pass the `qa.ts` check `facing` (RELEASE_CHECKLIST.md section 0, item 6). The same order goes on the title card, the thumbnails and the square cover.

## Edit: cut hard

Cut BS heavily: rambling, false starts, off-topic bits, tech trouble ("you are muted", audio problems) and hedges such as "I'm not sure", "I don't know if", "maybe I'm wrong". Where a hedge carries content, keep the claim and cut the hedge. Every cut stays a vetoable EDL row (`tools/podcast-edit/SKILL.md`).

## Video: header, sound, no announcer

- Header: one line, 104 px, "postgres.fm <topic>" (`"header": "line"` in `layout.json`, `headerSize` 104).
- No announcer voice (no synthetic or voice-over narrator) in the episode, cold open, trailer or shorts.
- Voices clearly above the music: duck the music 20 dB or more under speech, level each speaker, and boost Michael (his mic runs quiet: presence EQ and gain). `qa.ts` measures each voice against the music and against the other voices.

## Video: on-screen text goes under the heads

Every on-screen text in a postgres.fm video (strips, quotes, note cards, lower thirds, in the cold open and in the main episode) sits right under the row of head tiles and their name labels, never at the very bottom of the frame. YouTube subtitles cover the bottom. In the ep195 wide layout (tiles y 300-642, labels to y 714) the text band is y 724-864; for another layout, start at tile bottom + 72 + 10. Toolkit default: `BAND` in `tools/podcast-edit/overlays/src/Band.tsx`.

Full-screen cards too: keep all text, chips and screenshots out of the bottom 180 px of the frame (everything ends by y 900). `HackingInsert`, `NumberPop` and `ShotCard` follow this. (Nik, asked more than once; restated 2026-11-17, episode 197.)

QA every strip with zoomed frame crops (`qa.ts` writes them) during and after its swipe: no clipped glyphs (descenders, commas), no cut or offset band. A strip drawn with headless Chrome near the bottom of a 1080 px page got clipped by the viewport (episode 197 NOTIFY strip).

## Video: sound cues on every illustration

- Every card, photo and strip enters with a sound cue, so audio-only listeners know to pull out the phone and look. (Nik, episode 197: the final had no overlay sounds.)
- Use the agreed library and convention in `tools/podcast-edit/sfx/README.md`: IN and OUT for center cards (and named center sets such as a photo card), typing for band strips, rare accents for a sudden reveal.
- Always render with the `manifest-sfx.json` that `tools/podcast-edit/sfx-manifest.ts` makes, never the raw `manifest.json`.
- `qa.ts` (check `sfx`) and `compose.ts` fail when an overlay has no sound in its first 1.5 s. Episode 197 lost every sound this way.

## Video: faces stay clean

- No drawn annotations on people: no circles, ellipses or arrows on faces or heads, in titles, name cards or the montage. (Nik, episode 197: "bad idea, just drop it".)
- Captions never cover a face or mouth. In full-frame punch-ins, run face detection over the caption's whole duration (`tools/podcast-edit/qa/faces.swift`, Apple Vision) and place the caption where it misses every face box, grown for hair and beard: beside the face, in an empty area, or at the top. Still never in the bottom 180 px. If no area is free, reframe the punch-in (zoom out or shift it) to make room. Check every caption frame automatically (face boxes on the rendered frames vs the caption boxes) and visually. Toolkit check: `tools/podcast-edit/qa/caps.ts` (run by `qa.ts`).
- Split screens and multi-panel shots: centre each face in its panel with face detection. Same face scale in every panel (same eye distance), eyes on one horizontal line, the full head with headroom, nothing cut by a panel edge (straight or slanted).

## Data cards: chart first, every number sourced

- One `<id>.card.json` per card in `<episode>/cards/` (format: `tools/podcast-edit/cards/card.ts`): headline of 6 words or fewer, one chart (bars, donut or line), 1-2 hero numbers, a small source chip. No sentences, subtitles or footers; caveats go to the show notes.
- Linear scales only, never log (unless a human explicitly approved it for that chart).
- Every number has provenance: its raw file and the command that recomputes it. The card shows what the recompute gives, rounded only to the shown precision: no "about", no inflated numbers, no range shown as one number. The render fails otherwise (episode 197: a false EXPLAIN headline, "about 13%" where the data said 11-14%).
- Each card records the on-air quote and timestamp it illustrates. Keep a card only if it illustrates what is being said at that moment and reads in a few seconds; otherwise set `"decision": "blog"` and list it in `notes/blog-candidates.md` (a standard file in every episode folder).
- The host reviews the contact sheet (all cards on one page); `cards.ts check` rewrites it whenever a card changes.

## Before recording: research cheat sheet

When the episode has research (a Forge study brief, recording notes), put its 5-8 strongest findings into `notes/findings.json` and build the one-page cheat sheet with `bun tools/podcast-edit/cheatsheet.ts <episode-dir>`. The hosts see it BEFORE recording (episode 197: the strongest rehearsal and plan-change data was found only after the show).

## QA before any preview reaches the host

Run `bun tools/podcast-edit/qa.ts <episode-dir>` and send nothing to the host until it passes: voices vs music, eyes open on key frames (cold-open endings, thumbnails), captions vs faces, strip clipping with zoomed crops, cards and the contact sheet. A check that does not apply is skipped in `qa.json` with a written reason. Then look at the crops and the contact sheet yourself.
