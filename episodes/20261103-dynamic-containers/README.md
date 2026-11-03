# Dynamic containers for Postgres

[All episodes](../../README.md)

## Overview

- **Question:** How should Postgres and its extensions be combined in containers? The options are a fat image, injecting extensions at runtime, a registry that composes images on pull, or Kubernetes ImageVolume with PostgreSQL 18's `extension_control_path`. What does each cost?
- **Hosts / guests:** Nik Samokhvalov; co-host to be confirmed. Guest: Álvaro Hernández Tortosa. Confirm with him how he wants to be introduced.
- **Status:** Preparation.
- **Recording date:** To be confirmed. The folder date (2026-11-03) is a placeholder; rename the folder once the date is set.
- **Episode number:** To be added when assigned.

## Materials

| Document | Purpose |
| --- | --- |
| [Prep brief](https://claude.ai/artifact/XyvBbKY2eWJ8L7EfbqDbTt) ([source](prep.html)) | Run of show, eight animated 16:9 illustrations to screen-capture, questions for Álvaro, timeline, pre-recording checklist, titles and thumbnails |
| [Cheat sheet](https://claude.ai/artifact/81DdY6NeSHGyGMFWGvC8mf) ([source](cheat-sheet.html)) | One-page host notes: the four approaches, key facts, gotchas, DOCIR demo, debate, top questions, run of show |
| [`research.md`](research.md) | Facts with their sources: Postgres commits, KEP-4639, CNPG source and docs, the CNPG extension image Dockerfiles. Unverified claims are flagged |

## Main sources

- Gabriele Bartolini, [CNPG Recipe 23 – Managing extensions with ImageVolume in CloudNativePG](https://www.gabrielebartolini.it/articles/2025/12/cnpg-recipe-23-managing-extensions-with-imagevolume-in-cloudnativepg/) (2025-12-01).
- Álvaro Hernández, [Dynamic OCI Registry](https://www.youtube.com/watch?v=PNvAefbcGiA) (video), [slides](https://speakerdeck.com/ongres/docir-dynamic-oci-registry).

The research session could not open either page directly because of its network policy. Read both in full before recording; the checklist in the brief tracks this.

## Discussion outline

1. Why fat images hurt, and the 2ⁿ combinatorics.
2. Runtime injection (StackGres).
3. PostgreSQL 18 `extension_control_path` and `dynamic_library_path`, the `$libdir` problem, and bug #19506.
4. Kubernetes ImageVolume with CloudNativePG: mounts, GUCs, rolling restarts, PostGIS system libraries.
5. DOCIR, the dynamic OCI registry, and whether ImageVolume makes it unnecessary.
6. The hard parts: ABI, shared native dependencies, `pg_upgrade`, the extension ecosystem, thin clones.

## Evidence status

There are no experiments. Facts come from primary sources: Git, the KEP and the CNPG source at the commits recorded in `research.md`. The illustrations are explanatory drawings. Their step timings, library names and digests are illustrative and labelled as such.

## Open questions

See "Verify before recording" in the brief and the flagged items in `research.md`.
