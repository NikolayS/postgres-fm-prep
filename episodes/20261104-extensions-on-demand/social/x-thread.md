# Episode 195 (Extensions on demand): X thread and LinkedIn post

As prepared on 2026-11-06 (YouTube premiere 13:15 Pacific). The first post and the replies were posted by Nik; check X for the final wording.

Rules kept: no link in the first post (links go in the last reply); the first post opens with concrete numbers; first person; no emojis (add a single pointing-down one at the end of post 1 only if that is your usual style); simple English; charts use linear scales starting at 0.

Handles: Álvaro @ahachete, Kirk @yugedilbertfan, the show @postgresfm, Nik @samokhvalov.

If you post after 13:15 PT, change "Premiere today, 13:15 PT" to "Out now" (and "premiere 13:15 PT" in the links reply). Character counts are for X (limit 280). Post 1 is 269 characters with the handles.

---

## Recommended thread

### 1/ First post (no link) — media: `ep195-anim-fat-image-or-layers-v2.mp4` (28.5 s; v1 is kept but names the operator)

```
pgvector as its own container image: 0.31 MiB.
A fat Postgres image with 18 extensions: 253 MiB.

Both still cost the same restart to add.

New Postgres.FM with Álvaro Hernández @ahachete and Kirk Wolak @yugedilbertfan on extensions for Postgres in containers. Out now.
```

### 2/ Reply — media: `ep195-alvaro-image-on-demand.mp4` (65 s, sound on)

```
Álvaro's answer, in 65 seconds (sound on):

you ask for Postgres + citus + ltree + unaccent, and you get one image with only those. Nothing more.

This is StackGres Containers (public beta), built on DOCIR, a dynamic OCI registry.
```

### 3/ Reply — media: `07-restart-outage-no-operator.png` (in this folder; the episode card with the operator name in the subtitle replaced)

```
A small image does not save you from a restart.

On a Kubernetes operator, every image change is a rolling restart. Longest write outage when adding pgvector (medians of 5):

switchover: 6.4 s (extension image) vs 6.5 s (fat image)
restart, clients keep their connections: 192.1 s
```

### 4/ Reply — media: `../assets/06-layers.png`

```
Why not prebuild every image? 220 extensions give 2^220 ≈ 10^66 possible sets, and users really do pick different sets.

So the registry keeps each layer once and writes a new manifest per request. citext + pgvector in either order: same digest.
```

### 5/ Reply (optional) — media: `../assets/01-fat-image-cves.png`

```
Size is not the only cost. Trivy found 397 CVEs in the official postgres:18.6 image and 914 in our fat image with 18 extensions.

Also in the episode: pinning versions by digest, air-gapped mirrors, and major upgrades with two Postgres versions in one image.
```

### 6/ Reply — links (no media)

```
Video: https://youtu.be/7oeAAqU00zk
Podcast and transcript: https://postgres.fm/episodes/extensions-on-demand
All numbers, charts and configs: https://console.postgres.ai/shared/brief/c501d438-b872-4705-89a6-bdab30ea1680
StackGres Containers: https://stackgres.io/containers
```

X shortens each link to 23 characters, so this reply fits.

---

## Alternative first posts

### Alt A — the combinatorics hook (media: the same animation)

```
220 Postgres extensions give 2^220 possible images. That is about 10^66. Nobody can build them all.

Álvaro Hernández @ahachete told Kirk Wolak @yugedilbertfan and me how StackGres composes the one image you need, when you pull it.

New Postgres.FM, out now.
```

### Alt B — the question hook (media: `ep195-alvaro-image-on-demand.mp4`, then the animation goes in reply 2)

```
How do you add one extension to Postgres in Kubernetes without a new 253 MiB image and a restart?

Álvaro Hernández @ahachete explains a third way: an image with only the extensions you ask for, made on pull (65 s, sound on).

New Postgres.FM with Kirk Wolak @yugedilbertfan.
```

If you use Alt B, the restart claim is in the question only; reply 3 gives the numbers.

---

## LinkedIn variant of the first post

Put the links in the first comment, like on X. Media: `ep195-alvaro-image-on-demand.mp4` (or the animation, v2).

```
How do you add one extension to Postgres running in containers? Usually you ship a new image and restart.

We measured it on a Kubernetes operator: pgvector as its own extension image is 0.31 MiB, and a fat image with 18 extensions is 253 MiB. But both cost the same rolling restart: 6.4 s vs 6.5 s longest write outage with switchover, and 192 s if clients keep their connections.

In Postgres.FM episode 195, Álvaro Hernández (StackGres) explains another way: StackGres Containers, built on DOCIR (a dynamic OCI registry), composes an image with only the extensions you ask for, when you pull it. Kirk Wolak and I asked a lot of questions: reproducible builds, pinning by digest, major upgrades, air-gapped setups.

Here is Álvaro explaining the idea in 65 seconds (sound on!). Links to the video, the podcast and the brief with every number are in the first comment.
```

First comment:

```
Video: https://youtu.be/7oeAAqU00zk
Podcast and transcript: https://postgres.fm/episodes/extensions-on-demand
All numbers, charts and configs: https://console.postgres.ai/shared/brief/c501d438-b872-4705-89a6-bdab30ea1680
StackGres Containers (public beta): https://stackgres.io/containers
```

---

## Number check (all from the episode cards and the PostgresAI brief; the operator and its version are deliberately not named in posts or in the animation)

- Fat image (official `postgres:18.6` + 18 extensions): 253.18 MiB compressed; its extension layer: 98 MiB. pgvector extension image: 0.31 MiB. The fair "like for like" comparison is 98 MiB for 18 extensions vs 0.31 MiB for one; the posts do not claim a ratio.
- Kubernetes operator (1 primary + 1 replica), adding pgvector, longest write outage, medians of 5: switchover 6.4 s (extension image) / 6.5 s (fat image); restart with clients that keep their connections 192.1 s / 193.2 s.
- 220 extensions: 2^220 ≈ 1.7 × 10^66.
- Trivy 0.76.1: 397 (official `postgres:18.6`), 914 (fat image). Trivy cannot scan the extension image, so no "0 CVEs" claim.
- Digest: `e/citext/pgvector` and `e/pgvector/citext` give the same digest (`f9ca85e9…`).
