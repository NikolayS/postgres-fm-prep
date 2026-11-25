# Prompt: process a new episode recording

Paste this into a new Claude Code session in this repository (fill in the folder and the topic):

> /podcast-edit Process the new Postgres.FM recording in `~/Documents/Zoom/<YYYY-MM-DD HH.MM.SS .fm recording>` the same way as the last 4 episodes. I need the full composed draft (cold open variants, title card, framed heads, illustrations) and the review folder.

## Before recording

If the episode has research (a Forge study brief, recording notes), put its 5-8 strongest findings into `notes/findings.json`, every number with its raw file and recompute command, and run `bun tools/podcast-edit/cheatsheet.ts <episode-dir>`. Send the cheat sheet to the hosts before the recording.

## What the agent does

1. Follow `RELEASE_CHECKLIST.md` **section 0 in order** (production, from the recording to the full draft); copy it into the episode folder as `checklist.md` and mark each item. Read `tools/podcast-edit/SKILL.md` and `tools/podcast-edit/PROMOTION.md`. Then read how episodes 194 and 195 were made: `episodes/20261027-uuidv4-vs-uuidv7/video/README.md` and `episodes/20261104-extensions-on-demand/video/README.md`. Reuse their patched tools, title card, outro, layout, overlay setup and render command.
2. Work in `<recording>/review/` (`$R`). Create `episodes/<YYYYMMDD>-<slug>/` here from `templates/episode/README.md` and add it to the episode table in `README.md`.
3. Edit: transcribe (Scribe, once), detect, judge, prosody, plan, audit the joins. Propose the on-air cut cues in the first preview. Do the bad-moments sweep (checklist 0.5). Do not stop at a cuts-only draft: the host reviews the full composed episode.
4. Then the full draft: full edit, layout (tiles, face sizes; host order so that every host faces inward, decided on real frames with `qa/facing.ts estimate` and recorded in `video/final/facing.json`, checked by `qa.ts` `facing`), title card (a joke about the absent co-host stays friendly), outro that fits the episode (no Forge outro without Forge results; two companies never on one frame), overlays anchored to source words (`find.ts`), sounds (every overlay enters with a sound cue: render with the `manifest-sfx.json` from `sfx-manifest.ts`, never the raw `manifest.json`), final compose under `watchdog.ts`. Late changes go in with `splice.ts`, not a full re-render.
5. Release material, as files only: title options, thumbnails and the square cover (title first, then covers), YouTube description, show notes, captions (glossary pass), podcast MP3, Transistor draft (`transistor.ts --dry-run` first).
6. **Where files go.** Sources, scripts, notes and drafts go in this repo (the episode folder or `tools/`). Rendered media and big work files go in the recording's `review/` folder. Temporary files go in the session scratchpad. Blog posts go in the postgres-ai/docs repo. Nothing goes loose in the home folder (`~`). Secrets go only in `~/.config/<service>/` with mode 600, never in a repo.
7. Nothing is uploaded, published or posted without the host's explicit OK. Never print API keys (the Transistor key is in `~/.config/transistor/key`).
8. When the episode is out: copy the final sources (cards, outro, layout, subtitles, thumbnail sources, social scripts) into the episode folder, write down how the published video was made, mark the episode published, and fix the tools or the checklist for anything that went wrong.

Ask the host for the topic, the guest and the episode number if they are not clear from the recording.
