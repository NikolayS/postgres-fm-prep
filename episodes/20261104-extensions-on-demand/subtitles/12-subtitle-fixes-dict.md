# Ep 195 "Extensions on demand": subtitle/transcript fixes (dictionary + judgment)

Date: 2026-11-05. Built with `subtitles.ts build ... --fixes 10-subtitle-fixes.json` (the fixes are part of the build; cue breaks are computed after them). The `*.pre-dict.*` files are the same build without any fixes, for comparison.

Dictionary: "Glossary:" section of `prompt.txt` in https://gitlab.com/postgres-ai/content/postgres-fm (read 2026-11-05), plus the ep 194 pairs (Nick -> Nik, PostgresFM -> Postgres.FM) and this episode's names and terms. Every glossary entry (and its spaced / "instead of" variants) was matched against the caption text; the only glossary hits were WAL-G and Stackgres (see note). Everything else below is episode terms checked against context and, where marked, a local whisper large-v3-turbo re-listen.

Timelines: YouTube = 13 s card + edited time (02-draft-v1.time-map.json formula; the re-render with the new intro/outro of the same 13 s card keeps all speech times; only the trailing "[music]" cues follow the outro length). Podcast (11-podcast.*) = 13 s intro + edited time, so the times below are the same on both.

## Speakers (diarization corrections, `--relabel`, source seconds)

speaker_0 = Nik, speaker_1 = Kirk, speaker_2 = Álvaro, speaker_3 = Nik (a 4th cluster ElevenLabs made at 18:10-24:15 source, mixing Nik and Álvaro). Ranges re-attributed by content plus a simple voice model (log-mel cepstra per speaker, 42/43 held-out turns correct):

`1093.8-1097.3=Kirk, 1097.85-1098.6=Álvaro, 1098.95-1100.75=Kirk, 1102.0-1102.3=Kirk, 1118.1-1118.5=Kirk, 1118.64-1119.3=Kirk, 1395.4-1395.8=Kirk, 1396.5-1409.9=Kirk, 1415.4-1415.5=Nik, 1410.0-1442.1=Álvaro, 1442.3-1447.06=Kirk, 1447.07-1455.5=Álvaro`

(Video 16:54-22:57: Kirk "that's kind of the product name, company name here?", Álvaro "It is both.", Kirk's "Hold on ... Real quick. How are you protected against ... injection attack" and "Okay. Just the security", Álvaro's "very good question ... served over HTTPS ... digitally signed".)

## Rules applied (count per file: YouTube srt/vtt, podcast srt/vtt, transcript md/txt; same hits on both timelines)

| Rule (from -> to) | n | Why |
|---|---|---|
| `PostgresFM -> Postgres.FM` | 1 | Show name (ep 194 rule) |
| `Alvaro -> Álvaro` | 3 | Guest name spelling |
| `Stackgres -> StackGres` | 1 | Product name. Note: the glossary itself lists "Stackgres"; official spelling is StackGres (see below) |
| `Dosser -> DOCIR` | 1 | Mishearing of DOCIR (Dynamic OCI Registry); he spells it out right after |
| `peak name- namespace -> PID namespace` | 1 | Linux PID namespace ("so you see only your process hierarchy"); stutter "name-" absorbed |
| `DBN -> Debian` | 1 | "Red Hat or Debian"; whisper hears "DBM" |
| `FreeVSD -> FreeBSD` | 1 | OS name |
| `ETCD -> etcd` | 1 | Project name casing |
| `Docker file -> Dockerfile` | 2 | Term |
| `stateful set -> StatefulSet` | 1 | Kubernetes object name |
| `dot source -> .so` | 1 | Nik: ".control and .so files ... binaries and text files"; ASR "dot source", whisper ".store"; judgment, please confirm |
| `CDEs -> CVEs` | 1 | Whisper re-check hears "CVEs" |
| `CI text -> citext` | 1 | Extension name ("Citus, citext, boom") |
| `Nick -> Nik` | 2 | Host name (ep 194 rule) |
| `Ltree -> ltree` | 1 | Extension name casing |
| `an accent -> unaccent` | 1 | Extension name in a list of extensions ("Citus, ltree, and with whatever, unaccent"); sounds identical, please confirm |
| `libcd -> libc` | 1 | Whisper re-check hears "libc" |
| `Michelle Hashimoto -> Mitchell Hashimoto` | 1 | Name; whisper hears "Mitchell Hashimoto" |
| `Staggers -> StackGres` | 1 | Mishearing; whisper re-check hears "StackGres" |
| `Spillo -> Spilo` | 1 | Glossary: Spilo (Zalando image); whisper hears "Spilo" |
| `Dosr -> DOCIR` | 1 | Same, 41:56 ("why we call it DOCIR, because it's the dynamic OCI registry") |
| `Wal-G -> WAL-G` | 2 | Glossary: WAL-G |
| `Docker pool -> Docker pull` | 5 | Command name (docker pull) |
| `PG upgrade -> pg_upgrade` | 1 | Tool name |
| `pg available extensions -> pg_available_extensions` | 1 | View name |
| `PLpgSQL -> PL/pgSQL` | 1 | Language name (ep 194 shipped without this) |
| `PL uh pgSQL -> PL/pgSQL` | 1 | Same; filler inside the name |
| `PG background -> pg_background` | 2 | Extension name (Kirk's extension request) |
| `PLSH -> PL/sh` | 2 | Peter Eisentraut's PL/sh (extension plsh) |
| `PLPG SQL -> PL/pgSQL` | 1 | Same |
| `Entity -> entity` | 1 | Stray capital |
| `Jupiter- -> Jupyter-` | 1 | Product name |
| `Jupiter -> Jupyter` | 1 | Product name |
| `Jupiter Netbooks uh Notebooks -> Jupyter Netbooks, Notebooks` | 1 | Product name; his self-correction kept |
| `Jupiter Netbooks -> Jupyter notebooks` | 1 | Second mention (1:00:31); whisper hears "Jupyter networks"; he means notebooks (self-corrected the first time) |
| `test containers -> Testcontainers` | 1 | Project name |

Also in the fixes file: `[".control", ".control"]` (keeps the lowercase file name at a sentence start in the transcript), and `Nick's -> Nik's` (0 hits).

## Flagged, NOT changed (times = video and podcast time)

- 24:55 Kirk: "a little bit of a interface and an AI demo you could show us": both ASRs hear "AI demo"; maybe "a demo". Left.
- 48:20 Kirk: "and then his sgcr.dev/postgres": both ASRs hear "sgcr.dev" (production is sgcr.io; the demo may have used a dev host). Left.
- 54:20 / 54:35 Álvaro: "the OCI specific registry", "the OCI specific the OCI- specification": probably the OCI distribution spec; left verbatim.
- 54:26 Álvaro: "you say /postgres-- and the version": URL syntax as heard; left.
- 17:35 Nik: "from AGPL V, V3": left verbatim (AGPLv3).
- 09:49 Nik: "And the operate, yeah.": probably "operator"; left.
- 40:07 / 40:24 Kirk: "outer servers ... things that serve SEO": left.
- 23:14 Álvaro: "the main image, the one that contains Kubernetes": maybe "contains Postgres"; left.
- 50:56 Nik: "Might be PG-" (cut off before Kirk says pg_background): left.
- 19:28 Nik: "What, other than that" (cross-talk, speaker uncertain).
- Short backchannels in cross-talk ("Yeah", "Mm-hmm", "Right") may still sit on the wrong person in a few places; the voice model flagged about 25, all one or two words, left as diarized.
- Glossary conflict: prompt.txt lists "Stackgres"; the official name is StackGres, which is what the captions use. Suggest changing that glossary line.
- Names to confirm: Álvaro with accent (used everywhere, incl. speaker labels); "David Wheeler" (PGXN, David E. Wheeler), "Kelsey Hightower", "Peter Eisentraut" are as heard and correct as far as I know. "Michael" (Christofides) mentioned by Nik is fine.

## Proposed glossary additions (MR to gitlab postgres-ai/content/postgres-fm, not done)

StackGres (replace "Stackgres"), OnGres, DOCIR (instead of Dosser), sgcr.io, PL/pgSQL (instead of PLpgSQL / PLPG SQL), PL/sh, pg_background, pg_upgrade (instead of PG upgrade), pg_available_extensions, citext (instead of CI text), unaccent, ltree, Spilo (already there), Mitchell Hashimoto, Kirk Wolak, Álvaro Hernández, Testcontainers, Jupyter, CVE (instead of CDE), libc, etcd, PID namespace, Dockerfile, StatefulSet, docker pull (instead of Docker pool).

## Full change list (video/podcast time, speaker, before -> after)

- 00:00:16 Nik: "PostgresFM." -> "Postgres.FM."
- 00:00:26 Nik: "Alvaro" -> "Álvaro"
- 00:00:29 Nik: "Alvaro." -> "Álvaro."
- 00:01:17 Álvaro: "Stackgres" -> "StackGres"
- 00:01:23 Álvaro: "Dosser," -> "DOCIR,"
- 00:01:48 Kirk: "Alvaro," -> "Álvaro,"
- 00:04:40 Álvaro: "peak name- namespace," -> "PID namespace,"
- 00:07:29 Álvaro: "DBN" -> "Debian"
- 00:07:58 Álvaro: "FreeVSD" -> "FreeBSD"
- 00:11:40 Álvaro: "ETCD," -> "etcd,"
- 00:13:24 Álvaro: "Docker file" -> "Dockerfile"
- 00:13:25 Álvaro: "stateful set" -> "StatefulSet"
- 00:19:20 Nik: "dot source" -> ".so"
- 00:19:55 Álvaro: "CDEs" -> "CVEs"
- 00:21:19 Álvaro: "CI text," -> "citext,"
- 00:26:42 Kirk: "Nick." -> "Nik."
- 00:29:37 Álvaro: "Docker file" -> "Dockerfile"
- 00:30:02 Álvaro: "Ltree," -> "ltree,"
- 00:30:06 Álvaro: "an accent." -> "unaccent."
- 00:31:34 Kirk: "Nick," -> "Nik,"
- 00:34:25 Álvaro: "libcd," -> "libc,"
- 00:36:33 Nik: "Michelle Hashimoto," -> "Mitchell Hashimoto,"
- 00:39:01 Álvaro: "Staggers" -> "StackGres"
- 00:41:21 Nik: "Spillo," -> "Spilo,"
- 00:41:56 Álvaro: "Dosr," -> "DOCIR,"
- 00:43:20 Álvaro: "Wal-G," -> "WAL-G,"
- 00:43:22 Álvaro: "Wal-G." -> "WAL-G."
- 00:43:27 Álvaro: "Docker pool," -> "Docker pull,"
- 00:45:11 Álvaro: "PG upgrade" -> "pg_upgrade"
- 00:47:52 Álvaro: "Docker pool" -> "Docker pull"
- 00:50:13 Kirk: "pg available extensions," -> "pg_available_extensions,"
- 00:50:18 Kirk: "PLpgSQL" -> "PL/pgSQL"
- 00:50:34 Álvaro: "Docker pool" -> "Docker pull"
- 00:50:39 Álvaro: "PL, uh, pgSQL." -> "PL/pgSQL."
- 00:50:57 Kirk: "PG background" -> "pg_background"
- 00:50:58 Nik: "PLSH" -> "PL/sh"
- 00:51:04 Nik: "PLSH," -> "PL/sh,"
- 00:51:23 Kirk: "PG background," -> "pg_background,"
- 00:52:13 Álvaro: "Docker pool" -> "Docker pull"
- 00:53:31 Álvaro: "PLPG SQL" -> "PL/pgSQL"
- 00:58:44 Álvaro: "Entity." -> "entity."
- 01:00:06 Kirk: "Jupiter-" -> "Jupyter-"
- 01:00:07 Álvaro: "Jupiter" -> "Jupyter"
- 01:00:09 Álvaro: "Jupiter Netbooks, uh, Notebooks," -> "Jupyter Netbooks, Notebooks,"
- 01:00:31 Álvaro: "Jupiter Netbooks." -> "Jupyter notebooks."
- 01:05:37 Álvaro: "Docker pool," -> "Docker pull,"
- 01:05:44 Álvaro: "test containers" -> "Testcontainers"
