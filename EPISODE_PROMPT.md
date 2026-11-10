# Prompt: process a new episode recording

Paste this into a new Claude Code session in this repository (fill in the folder and the topic):

> /podcast-edit Process the new Postgres.FM recording in `~/Documents/Zoom/<YYYY-MM-DD HH.MM.SS .fm recording>` the same way as episodes 194-195. I need a draft first.

## What the agent does

1. Read `tools/podcast-edit/SKILL.md`, `RELEASE_CHECKLIST.md` and `tools/podcast-edit/PROMOTION.md`. Then read how episodes 194 and 195 were made: `episodes/20261027-uuidv4-vs-uuidv7/video/README.md` and `episodes/20261104-extensions-on-demand/video/README.md`. Reuse their patched tools, title card, outro, layout, overlay setup and render command.
2. Work in `<recording>/review/` (`$R`). Create `episodes/<YYYYMMDD>-<slug>/` here from `templates/episode/README.md` and add it to the episode table in `README.md`.
3. Edit: transcribe (Scribe, once), detect, judge, prosody, plan, audit the joins. Propose the on-air cut cues in the first preview. Render `--until 480` and **stop for the host's go**: send the cut list summary (judgment cuts with source times) and the preview path.
4. After the go: full edit, layout (tiles, face sizes), title card (a joke about the absent co-host stays friendly), outro that fits the episode (no Forge outro without Forge results; two companies never on one frame), overlays anchored to source words (`find.ts`), sounds, final compose under `watchdog.ts`. Late changes go in with `splice.ts`, not a full re-render.
5. Release material, as files only: title options, thumbnails and the square cover (title first, then covers), YouTube description, show notes, captions (glossary pass), podcast MP3, Transistor draft (`transistor.ts --dry-run` first).
6. **Where files go.** Sources, scripts, notes and drafts go in this repo (the episode folder or `tools/`). Rendered media and big work files go in the recording's `review/` folder. Temporary files go in the session scratchpad. Blog posts go in the postgres-ai/docs repo. Nothing goes loose in the home folder (`~`). Secrets go only in `~/.config/<service>/` with mode 600, never in a repo.
7. Nothing is uploaded, published or posted without the host's explicit OK. Never print API keys (the Transistor key is in `~/.config/transistor/key`).
8. When the episode is out: copy the final sources (cards, outro, layout, subtitles, thumbnail sources, social scripts) into the episode folder, write down how the published video was made, mark the episode published, and fix the tools or the checklist for anything that went wrong.

Ask the host for the topic, the guest and the episode number if they are not clear from the recording.
