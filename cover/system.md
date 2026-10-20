# Postgres.FM cover system (new format)

One system for every episode. Source files: `build/base.css` (tokens,
host placement, show mark), one HTML per episode, rendered with
`build/render.ts` (Playwright + local Chrome). Fonts are local in
`build/fonts/`.

## Canvas and grid

- YouTube: 1280x720. Safe margin 48 px on all sides. Keep the bottom-right
  corner (about 140x40 px) free of text: YouTube draws the duration there.
- Square (podcast directories): 3000x3000, authored at 1000x1000 CSS px and
  rendered at 3x. Safe margin 56 px. Directories show it at 300 px, so the
  same rules as the 320x180 test apply.
- Two zones: text zone is the left 60% (x 48-760), host zone is the right
  45% (x 580-1280), bottom-anchored. They overlap by design; hosts sit on
  top of text (z-index), so the key word must finish before x 580 or above
  y 430.

## Type scale (1280x720)

Rule (Nik, 2026-10-20): no text under about 48 px cap height at 1280x720,
which is 66 px font size for Anton, Inter and JetBrains Mono. Everything
must read at 320x180 on a phone. At most two text levels per cover.

| Role | Font | Size | Rule |
|---|---|---|---|
| L1, the hook word or number | Anton (caps) | 180-250 px | one word or one number, accent color |
| L2, one secondary line | Anton (caps) | 76-104 px | the status or the verdict; cream, with one colored word |
| Show mark | Inter 800 | 66 px | "Postgres.FM" with the red dot, top-right (top-left on the square) |

Nothing else carries text: no labels on stickers, no small receipts, no
episode number unless it is published. The robot is an image only.
Checked at 320x180 on v3: L1, L2, the show mark, both faces and the
strike-through number in B all read. Dropped in v3 because they failed:
the `pg_restore` label, "first SELECT after restore: surprise work", the
"time check" bubble, the robot label, the EXPLAIN header lines.

## Colors

| Token | Hex | Use |
|---|---|---|
| ink | #0b0e14 | default background |
| paper | #f3efe6 | default text; alternate background (concept B) |
| amber | #ffb400 | the one accent: the key word |
| ok | #3dff8a | "done", 100%, checks |
| red | #ff3b3b | the problem word, the strikethrough |
| blue | #5aa9ff | psql prompt only |
| mute | #8a93a6 | labels like `pg_restore` |

One accent per cover. Green and red appear only as status meaning
(done/not done), never as decoration. No pink gradient, no elephant
background; the elephant may return as a small sticker on special episodes.

## Hosts

Expression matches the hook (Nik, 2026-10-20). "READY?" wants a surprised
or skeptical face, a punchline wants a laugh, a receipt wants a grin. No
neutral or listening faces: big, readable emotion beats subtle, and energy
(head tilt, eye contact, a gesture that reads) wins ties. The scorer
(`build/facescore.swift` + `build/pick2.ts`) ranks frames per class
(laughing, smiling, surprised, skeptical, thinking) by intensity and writes
one labelled sheet per class per host. Pick from the sheets, then run
`build/prep.sh <nik|kirk> <frame> <faceX> <out>` (cutout, wall-logo
removal, light cleanup, face-centred crop; no face editing).

- Nik is the anchor: bottom-right, 640 px wide (head about 38% of frame
  height). Guest co-host is smaller (440 px) at Nik's left, overlapping
  behind him. Both are cutouts (no Zoom backgrounds); the guest fades out
  at the bottom so the shirt is never a problem.
- Expressions: laugh or raised eyebrows. Pull frames from the recording,
  not posed photos, so the covers stay honest.
- Solo episode: Nik alone at 720 px wide. Interview: guest in Nik's spot,
  Nik smaller at left.
- samograph (the bot) is a small rotated "Zoom tile" sticker (120-170 px)
  with its name label, top-right. It is a cast member, so it appears on
  every cover it took part in; add a one-line speech bubble when it did
  something in the episode ("time check").

## Hook text

- The hook is the question or the surprise, never the topic name.
  "MVCC" is a topic; "100% != ready" is a hook.
- Patterns that work with this audience: status check (DONE / READY?),
  a real number with a before/after (3301 -> 34), a contradiction
  (a SELECT wrote 27 MiB), a 100% progress bar with a warning.
- Receipts: when there is a real number, show it in a mono "receipt"
  (EXPLAIN line, psql prompt, chip). Numbers are exact; units are binary
  (MiB, GiB).
- Avoid: generic 3D props, stock icons, emojis, more than one accent word.

## Square variant

Same ingredients, stacked: show mark top-left, hook in the upper half at
a larger scale (key word 300 px), hosts across the bottom third, bot
sticker top-right. The hook stays left-aligned so it matches the YouTube
cover when both appear in a feed.

## Workflow per episode (about 10 minutes)

1. Pick 1 host frame each from the recording (`ffmpeg -ss T -frames:v 1`,
   crop the tile), cut the background with
   `bun run build/cutout.ts in.png out.png` (run from `build/`).
2. Copy a concept HTML, change the hook, the receipt values and `#NNN`.
3. `bun run build/render.ts concept.html out.png` and the same at
   `1000 1000 3` for the square.
4. Check at 320x180 (`ffmpeg -vf scale=320:180`). If the key word or a face
   does not read, cut words, not size.
