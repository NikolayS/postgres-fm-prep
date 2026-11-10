# UUIDv4 vs UUIDv7

[All episodes](../../README.md)

## Overview

- **Question:** Postgres 18 ships `uuidv7()`. What does a random UUIDv4 primary key actually cost compared with a time-ordered UUIDv7 or an `int8` key, and when does the difference show up?
- **Hosts:** Nik Samokhvalov and Kirk Wolak.
- **Recording date:** 2026-10-27.
- **Status:** Edited; YouTube upload pending; podcast release pending.
- **Episode number:** To be added when assigned.

## Links

- **Experiment brief:** [UUIDv4 vs UUIDv7 vs int8 primary keys on Postgres 18](https://console.postgres.ai/shared/brief/9fffe2da-00c1-470b-a79d-a210ae2306bc) ([DBLab Forge](https://postgres.ai/products/dblab-forge) case `uuid-pk-v4-v7-01`, PostgresAI).
- **Public results:** [forge-results, case `uuid-pk-v4-v7-01`](https://gitlab.com/postgres-ai/forge-results/-/tree/main/cases/uuid-pk-v4-v7-01). The case is in review in [merge request !2](https://gitlab.com/postgres-ai/forge-results/-/merge_requests/2) (draft). The case directory link works once that merge request is merged; until then, read the files in the merge request.
- **Raw data on Zenodo:** pending publication. The DOI 10.5281/zenodo.23812083 is reserved but not live yet.
- **YouTube:** to be added.
- **Podcast:** to be added.

## Materials

- [Show notes](show-notes.md): the resources mentioned in the episode, grouped, with the time of first mention.
- [Illustrations](illustrations.md): the eight on-screen cards in the video, what each shows, and where every number comes from.
- [`assets/`](assets/): one still per card, taken from the edited video.

## Key results from the experiment

All measured on Postgres 18 on Hetzner Cloud servers on 2026-10-26, one run per cell. File names are relative to the case directory in forge-results. The case README in forge-results states the full conditions, box differences and limits; read it before reusing a number.

- At 100M rows the primary key index is 3,996 MiB for UUIDv4, 3,012 MiB for UUIDv7 and 2,146 MiB for `int8` (run 1, `analysis/r1_summary.csv`).
- From 80M to 100M rows, UUIDv4 writes 1,324 bytes of WAL per insert, UUIDv7 744 and `int8` 745 (run 1, `analysis/r1_windows_20m.csv`). UUIDv4 writes 145 full-page images per 1,000 inserts in that window, against 40 for UUIDv7.
- On the same server, UUIDv7 inserted 23,458 rows/s and `int8` 23,131 rows/s over the first 71.35M rows (run 2 UUIDv7 against run 1 `int8`, `analysis/r2_cross_run.csv`). The two runs used different memory tiers; see the case README.
- Once the random-key indexes outgrow memory, UUIDv4 runs at 0.61 to 0.76 of UUIDv7's insert rate on the same server (run 4, `analysis/r4_replication_pastcap.csv`).

[Illustrations](illustrations.md) lists the source file for every number shown in the video.

## Video and social clips

- [How the video was made](video/README.md): tool patches, title card source, overlay source and manifests, covers, the splice script, and the files that stay out of git.
- [Social clips](social/README.md): the UUIDv4 vs UUIDv7 animation for the blog post and a clip of Kirk on the B-tree, with the scripts that made them.

## Local media (not in git)

- Source recording: `/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/video2013034834.mp4` and `audio2013034834.m4a`.
- Review folder: `/Users/nik/Documents/Zoom/2026-10-27 10.03.53 .fm recording/review/`: final video `29-final-v9.mp4`, podcast audio `30-podcast.mp3` and `30-podcast.wav`, drafts and previews `01` to `28`.
- `.../review/scratchpad/overlays/*.mov` (rendered cards) and `.../review/scratchpad/v3/card/` (title card renders, intro and outro music, `outro/logo.mp4`). Full list in [video/README.md](video/README.md#local-media-not-in-git).
