# Extensions on demand: show notes

[Episode overview](README.md)

Resources mentioned in the episode. Each time in brackets is the first mention. In this episode the podcast audio and the YouTube video both start the talk at 13 s, after the title card, so the podcast time and the video time are the same. Links were checked on 2026-11-06 without logging in. The episode title is "Extensions on demand".

Release files (YouTube description, Transistor HTML, summary) are in the review folder, `31-notes/`; the full YouTube description is copied below.

## Main link

- [00:18:54] Dynamic containers for PostgreSQL: what we measured (DBLab Forge brief, PostgresAI): https://console.postgres.ai/shared/brief/c501d438-b872-4705-89a6-bdab30ea1680

## Álvaro and StackGres

- [00:00:25] Álvaro Hernández: https://postgres.fm/people/alvaro-hernandez-tortosa
- [00:01:16] StackGres Containers (public beta; the images come from the registry host sgcr.io, and the demo used sgcr.dev, a dev instance): https://stackgres.io/containers
- [00:14:52] StackGres: https://stackgres.io
- [00:20:55] PostgreSQL extensions in StackGres, loaded into running pods (docs): https://stackgres.io/doc/latest/features/extensions/
- [00:24:28] StackGres extensions cache, experimental (docs): https://stackgres.io/doc/latest/administration/extensions/cache/
- [01:04:08] Why Postgres extensions should be packaged and distributed as OCI images (Álvaro Hernández, 2024): https://ongres.com/blog/why-postgres-extensions-should-be-distributed-and-packaged-as-oci-images/

## Episodes

- [00:00:25] Our previous episode with Álvaro: Citus + StackGres: https://postgres.fm/episodes/citus-stackgres

## Hacking sessions

- [00:31:33] Hacking Postgres sessions with Andrey, Kirk and Nik (YouTube playlist, PostgresTV): https://www.youtube.com/playlist?list=PLH8y1BNPAKjKDdJA7sDmFWUkbbYux3TRz

## Postgres and extensions

- [00:38:51] extension_control_path, new in Postgres 18 (docs): https://www.postgresql.org/docs/18/runtime-config-client.html#GUC-EXTENSION-CONTROL-PATH
- [00:50:56] pg_background: https://github.com/vibhorkum/pg_background
- [00:50:58] plsh (Peter Eisentraut): https://github.com/petere/plsh
- [01:02:58] PGXN, the PostgreSQL Extension Network: https://pgxn.org
- [01:04:40] POC: Distributing Trunk binaries via OCI (David E. Wheeler, 2024): https://justatheory.com/2024/06/trunk-oci-poc/
- [01:05:12] Anarchy in the Database: a survey and evaluation of DBMS extensibility (Kim, Slot, Andersen, Pavlo, VLDB 2025; tests extensions in pairs): https://www.vldb.org/pvldb/vol18/p1962-kim.pdf

## Containers

- [00:01:22] OCI image format specification: https://github.com/opencontainers/image-spec
- [00:41:19] Spilo (Zalando), one Postgres image with several major versions: https://github.com/zalando/spilo
- [01:05:43] Testcontainers, PostgreSQL module: https://testcontainers.com/modules/postgresql/

## Other

- [00:36:32] Mitchell Hashimoto on never updating dependencies unless it breaks (post on X, 2026-05-20): https://x.com/mitchellh/status/2057171518027887035

## Notes on the links

- StackGres Containers lives at stackgres.io/containers. sgcr.io is only the registry host (`docker pull sgcr.io/postgres`); it redirects to the page. At 00:48:20 Kirk reads `sgcr.dev/postgres` from the screen: that was the dev registry used in the demo and in the brief.
- The brief is still marked draft. It opens without logging in, but it links to the internal forge work items and merge requests, which need a GitLab login.

## Summary (Transistor)

Nik and Kirk are joined by Álvaro Hernández to discuss how Postgres in containers gets its extensions — a fat image with all of them, extensions downloaded at run time, or StackGres Containers, built on DOCIR (Dynamic OCI Registry), which composes an image with only the extensions you ask for, on demand — and what this means for security, pinning versions, and major upgrades.

## YouTube description

```text
Fat image or extensions on demand: how should Postgres in containers get its extensions?
Measured with CloudNativePG 1.27.4 and Postgres 18.6 (1 primary + 1 replica, pgbench at 100 TPS, medians of 5): the pgvector extension image is 0.31 MiB compressed, against 98 MiB for 18 extensions in a fat image, but both ways still cost a rolling restart: 6.4 s vs 6.5 s longest write outage with switchover.

Postgres.FM episode 195: Nik and Kirk are joined by Álvaro Hernández to discuss how Postgres in containers gets its extensions: a fat image with all of them, extensions downloaded at run time, or StackGres Containers, built on DOCIR (Dynamic OCI Registry), which composes an image with only the extensions you ask for, on demand. We also talk about what this means for security, pinning versions, and major upgrades. Álvaro also shows a short demo.

Main link: the experiment brief, with every chart, number and config (DBLab Forge, PostgresAI):
https://console.postgres.ai/shared/brief/c501d438-b872-4705-89a6-bdab30ea1680

[Check out the subtitles – we edit them! YouTube auto-translates them from English to other languages; try it and share it with people interested in Postgres!]

Chapters:
00:00 Intro
00:13 Álvaro is back: StackGres Containers and DOCIR
01:39 Why run Postgres in containers
09:50 Kubernetes, and what an operator adds
18:12 The fat image: all extensions in one image
20:55 StackGres today: extensions downloaded at run time, signed
26:43 2^220 possible images
27:20 The new idea: compose the image on demand
31:57 Build Postgres and every extension in one environment
35:04 Upgrade or pin? Mitchell Hashimoto, and pinning by digest
41:05 Major upgrades: two Postgres versions in one image
45:48 Demo: StackGres Containers
55:15 Air-gapped environments and private mirrors
1:00:42 Public beta, pricing, and agents
1:02:49 PGXN, OCI, and the extension ecosystem
1:06:14 What comes next: reproducible, hermetic builds

Key links (video time of the first mention):
* StackGres Containers, public beta (1:16) https://stackgres.io/containers
* Our previous episode with Álvaro: Citus + StackGres (0:25) https://postgres.fm/episodes/citus-stackgres
* PostgreSQL extensions in StackGres, docs (20:55) https://stackgres.io/doc/latest/features/extensions/
* StackGres extensions cache, experimental, docs (24:28) https://stackgres.io/doc/latest/administration/extensions/cache/
* Mitchell Hashimoto on never updating unless it breaks, post on X (36:32) https://x.com/mitchellh/status/2057171518027887035
* extension_control_path, new in Postgres 18, docs (38:51) https://www.postgresql.org/docs/18/runtime-config-client.html#GUC-EXTENSION-CONTROL-PATH
* Spilo, Zalando (41:19) https://github.com/zalando/spilo
* PGXN (1:02:58) https://pgxn.org
* Why Postgres extensions should be packaged and distributed as OCI images, Álvaro Hernández, 2024 (1:04:08) https://ongres.com/blog/why-postgres-extensions-should-be-distributed-and-packaged-as-oci-images/
* POC: Distributing Trunk binaries via OCI, David E. Wheeler, 2024 (1:04:40) https://justatheory.com/2024/06/trunk-oci-poc/
* Anarchy in the Database, VLDB 2025 (1:05:12) https://www.vldb.org/pvldb/vol18/p1962-kim.pdf

All links: https://postgres.fm/episodes/extensions-on-demand

~~~

What did you like or not like? What should we discuss next time? Let us know in the comments, or by tweeting us on @postgresfm https://twitter.com/PostgresFM, @samokhvalov https://twitter.com/samokhvalov and @michristofides https://twitter.com/michristofides

~~~

Postgres FM is produced by:
- Michael Christofides, founder of pgMustard https://pgmustard.com/
- Nikolay Samokhvalov, founder of PostgresAI https://postgres.ai/

With credit to:
- Jessie Draws for the elephant artwork
- Intro and outro music: our own arrangement of Apple Loops from GarageBand

~~~

This is the video version. Check out https://postgres.fm to subscribe to the audio-only version, to see the transcript, guest profiles, and more.

#PostgreSQL #Postgres #Kubernetes
```
