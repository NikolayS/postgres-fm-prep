# Research: dynamic containers for Postgres

[Episode overview](README.md)

The facts below come from primary sources: Git history, the KEP file, or the project's own docs and Dockerfiles. The source sits beside each claim. **Unverified** marks claims that rest only on secondary material such as search snippets, slide summaries or write-ups.

Source snapshots used (2026-11-03):

- `cloudnative-pg/cloudnative-pg` at `66c7c6e` (2026-11-02), file `docs/src/imagevolume_extensions.md`.
- `cloudnative-pg/postgres-extensions-containers` at `cb5c269` (2026-11-02).
- `kubernetes/enhancements` at `e704e0b`, file `keps/sig-node/4639-oci-volume-source/kep.yaml`.
- `postgres/postgres` `master`, the commits listed below.

Network limits during research: this session could not open gabrielebartolini.it, youtube.com, cloudnative-pg.io or enterprisedb.com directly. Read the two main sources in full before recording.

## The two main sources

- **Gabriele Bartolini, ["CNPG Recipe 23 – Managing extensions with ImageVolume in CloudNativePG"](https://www.gabrielebartolini.it/articles/2025/12/cnpg-recipe-23-managing-extensions-with-imagevolume-in-cloudnativepg/)**, dated 2025-12-01. It mounts pgvector and PostGIS from separate images on PostgreSQL 18 + Kubernetes 1.33+ with CNPG 1.27+. Follow-ups: [Recipe 26 – extension image catalogs](https://www.gabrielebartolini.it/articles/2026/08/cnpg-recipe-26-extension-image-catalogs/) (2026-08) and the March 2025 design post, ["The Immutable Future of PostgreSQL Extensions in Kubernetes"](https://www.gabrielebartolini.it/articles/2025/03/the-immutable-future-of-postgresql-extensions-in-kubernetes-with-cloudnativepg/). This summary comes from search results; the full text has not been read yet.
- **Álvaro Hernández, ["Dynamic OCI Registry"](https://www.youtube.com/watch?v=PNvAefbcGiA)** (YouTube). Slides: [DOCIR – Dynamic OCI Registry](https://speakerdeck.com/ongres/docir-dynamic-oci-registry), presented at ContainerDays 2025 in Hamburg ([attendee write-up](https://www.containerdays.io/blog/containerdays-2025-my-experience/)). Companion talk: ["Postgres à la carte: dynamic container images with your choice of extensions"](https://speakerdeck.com/ongres/postgres-a-la-carte-dynamic-container-images-with-your-choice-of-extensions). The video itself has not been watched yet. The summary below comes from the slide pages and the write-up via search, so it is **unverified** in detail.

## Timeline (verified unless marked)

| Date | Event | Source |
| --- | --- | --- |
| 2024-05-17 | KEP-4639 "OCI images as VolumeSource" created (authors `@sallyom`, `@saschagrunert`) | `kep.yaml` |
| 2024-08 | Kubernetes v1.31: `ImageVolume` alpha | `kep.yaml` milestone `alpha: v1.31` |
| 2025-03-19 | PostgreSQL commit `4f7f7b0375` adds the `extension_control_path` GUC | postgres Git |
| 2025-05-02 | `81eaaa2c41`: the control-file `directory` setting works with `extension_control_path` | postgres Git |
| 2025-06-04 | `f777d77387`: keep `$libdir` on `LOAD`; strip it only in extension scripts (bug #18920) | postgres Git |
| 2025-08-12 | CloudNativePG 1.27.0: `.spec.postgresql.extensions` ([#7991](https://github.com/cloudnative-pg/cloudnative-pg/pull/7991)) | tag date; `release_notes/old/v1.27.md` |
| 2025-09-25 | PostgreSQL 18.0 released | from memory; **unverified**, check the release announcement |
| 2025-12-01 | Bartolini, CNPG Recipe 23 | search result |
| 2025-12-09 | CloudNativePG 1.28.0 | tag date |
| 2025-12 | Kubernetes v1.35: `ImageVolume` on by default (CNPG docs: "Kubernetes 1.35 or later: the ImageVolume feature is enabled by default") | CNPG docs |
| 2026-01-01 | `f3c9e341cd`: new `location` column in `pg_available_extensions` (PG19) | postgres Git |
| 2026-03-16 | `1e67508730`: fix `pg_upgrade` failure when `extension_control_path` is used | postgres Git |
| 2026-04-01 | CloudNativePG 1.29.0: extensions in image catalogs ([#9781](https://github.com/cloudnative-pg/cloudnative-pg/pull/9781)) | tag date; `release_notes/v1.29.md` |
| 2026 (v1.36) | `ImageVolume` stable/GA | `kep.yaml` milestone `stable: v1.36`, `status: implemented` |

**Beta version mismatch:** `kep.yaml` says `beta: v1.34`, while the CNPG docs say 1.33 needs the gate turned on. The Kubernetes blog "Kubernetes 1.33: Image Volumes graduate to beta" (**unverified title**) suggests beta came in 1.33, on by default only from 1.35. Check the Kubernetes release notes before stating either on air.

## `extension_control_path` (PostgreSQL 18)

Commit [`4f7f7b0375`](https://github.com/postgres/postgres/commit/4f7f7b0375), 2025-03-19:

- "The new GUC extension_control_path specifies a path to look for extension control files. The default value is `$system`, which looks in the compiled-in location, as before. The path search uses the same code and works in the same way as dynamic_library_path."
- The commit message lists three use cases, of which the third is "adding extensions to PostgreSQL running in a Kubernetes environment using operators such as CloudNativePG without having to rebuild the base image for each new extension."
- Author Peter Eisentraut, co-author Matheus Alcantara. Reviewers: David E. Wheeler, Gabriele Bartolini, Marco Nenciarini, Niccolò Fei. The discussion thread was [started by David Wheeler](https://www.postgresql.org/message-id/flat/E7C7BFFB-8857-48D4-A71F-88B359FADCFD@justatheory.com).

There are three follow-up details to know:

- **`$libdir` stripping.** `module_pathname = '$libdir/foo'` is stripped so that `dynamic_library_path` finds the module. `f777d77387` moved the stripping so that an explicit `LOAD '$libdir/…'` still works. CNPG's PostGIS image goes further and `sed`-strips `'$libdir/` from the PostGIS SQL scripts, because "with imageVolume-mounted extensions there is no $libdir to expand, and PostgreSQL 18+ fails to resolve it during CREATE/ALTER EXTENSION otherwise" (`postgis/Dockerfile`).
- **`pg_upgrade`.** It failed on extensions found via `extension_control_path` until `1e67508730` (2026-03-16, author Jonathan Gonzalez V.). **Check which 18.x minor carries the back-patch.**
- **`LOAD '$libdir/…'` inside extension scripts, [bug #19506](https://www.postgresql.org/message-id/19506-9478f3012ecc2328@postgresql.org)** (filed June 2026 against 18.4 by Gabriele Bartolini). PostGIS upgrades fail with "could not access file `$libdir/postgis-3`" because `f777d77387` limited the prefix stripping to function loads. Patches are on the list from Bartolini and Ayush Tiwari. Matheus Alcantara [argued](https://www.postgresql.org/message-id/9ef850b9-d127-44db-9a6c-4db64436b056@gmail.com) that extensions should drop the prefix themselves. As of 2026-11-03 `master` has no commit that references 19506. This is why CNPG's PostGIS image strips `$libdir/` with `sed`.
- **Observability.** PG19 adds `pg_available_extensions.location` (`f3c9e341cd`). Non-superusers see `<insufficient privilege>`. `db5ed03217` (2026-05-20) then stops the view leaking the system path.

## Kubernetes `ImageVolume` (KEP-4639)

- This volume type mounts an OCI image (or artifact) read-only into a pod at a chosen path. The kubelet asks the runtime to pull it like any image.
- Runtime support: containerd ≥ 2.1.0 or CRI-O ≥ 1.31 (CNPG docs, Requirements).
- CNPG caveat: adding, removing or updating an extension image restarts the Postgres pods. CNPG says this "is inherited from how image volumes work in Kubernetes" (CNPG docs, Caveats). A pod's volumes are immutable, so changing an image volume recreates the pod, which CNPG does as a rolling update.
- Follow-up KEP-5365, ImageVolume with an image digest, is alpha in v1.36 (search result, **unverified**).

## CloudNativePG implementation (docs at `66c7c6e`)

- Each extension is mounted at `/extensions/<NAME>`. CNPG appends `/extensions/<NAME>/share` to `extension_control_path` and `/extensions/<NAME>/lib` to `dynamic_library_path`, in the order of the `extensions` list, and only if those directories exist in the image.
- Advanced fields: `extension_control_path`, `dynamic_library_path`, `ld_library_path` (sets `LD_LIBRARY_PATH`), `bin_path` (sets `PATH`) and `env`, with a `${image_root}` placeholder. Changes to `ld_library_path`, `bin_path` and `env` need a manual `cnpg restart`, because CNPG does not trigger one.
- Activation in a database is declarative: a `Database` resource with `extensions: [{name: vector, version: …}]` runs `CREATE EXTENSION IF NOT EXISTS`. `ensure: absent` runs `DROP EXTENSION`.
- `shared_preload_libraries` modules still have to be listed by hand.
- The compatibility rule: an extension image must match the PG major, the OS distribution and the CPU architecture of the operand image. Official catalogs do that matching for you.
- Image catalogs (1.29+) let a `Cluster` enable an extension by name alone. Cluster-level fields override the catalog's.
- Resolved state is visible in `status.pgDataImageInfo.extensions`.

### What an extension image looks like (`postgres-extensions-containers` at `cb5c269`)

- Supported extensions: pgAudit, pg_crash, pg_ivm, pgRouting, pgvector, PostGIS, TimescaleDB (Apache-2 edition) and wal2json. Images exist only for Debian `stable` and `oldstable` (trixie and bookworm).
- Images are built only from Debian `main` packages, with PGDG recommended. Licences come from DEP-5 copyright files copied to `/licenses/<pkg>/`. New extensions must use licences on the CNCF allowlist. PostGIS and pgRouting are GPL-2.0, predate the policy and are going through a CNCF exception.
- pgvector `Dockerfile`: `apt-get install postgresql-18-pgvector` in a builder stage based on `ghcr.io/cloudnative-pg/postgresql:18-minimal-trixie`, then `FROM scratch` with `/lib/vector*`, `/lib/bitcode/`, `/share/extension/vector*` and `/licenses/`, running as `USER 65532:65532`. The image holds no OS, only files.
- PostGIS `Dockerfile`: it diffs `ldconfig -p` of the base image against `ldd postgis*.so` and copies into `/system/` only the libraries the base lacks (GEOS, PROJ, GDAL and so on). `metadata.hcl` sets `ld_library_path = ["system"]`, `GDAL_DATA` and `PROJ_DATA` via `${image_root}`, and `auto_update_os_libs = true`.
- Versions in `metadata.hcl`: pgvector `0.8.7-1.pgdg13+1` (trixie, PG18); PostGIS `3.7.0+dfsg-1.pgdg13+1`.

## Prior art and guest material

- OnGres, ["Why Postgres extensions should be distributed and packaged as OCI images"](https://ongres.com/blog/why-postgres-extensions-should-be-distributed-and-packaged-as-oci-images/). This summary comes from a search excerpt because ongres.com was blocked from this session; the date is **unverified**. Its argument: packaging binary extensions is really building a Postgres distribution with extensions; extensions should be built with the same host OS, libc and compiler as the server; any new extension format would end up looking like an OCI image; and OCI registries already give distribution over HTTP. It says OnGres had run a repository of about 200 extensions for StackGres for about three years.
- Álvaro's talks are listed at [aht.es](https://aht.es/). The page may not include the newest ones.

## Álvaro's alternatives: three ways to get extensions into a container

From the "Postgres à la carte" and DOCIR slide pages via search, so **unverified in detail**. Watch the talk to confirm.

1. **Fat image.** Bake everything in. Problems: size, CVE surface, and a restart or rebuild for every change.
2. **Inject at runtime.** This is what StackGres does. A `cluster-controller` sidecar in the Postgres pod downloads, verifies, unpacks and installs extensions from `extensions.stackgres.io`, and webhooks validate requests against the repository metadata ([StackGres docs: extensions](https://stackgres.io/doc/latest/administration/extensions/), [extensions cache](https://stackgres.io/doc/latest/administration/extensions/cache/)). The trade-offs are security, startup time and a mutable filesystem.
3. **Generate images dynamically.** A registry composes an image at pull time from existing layers. It generates the index, manifest and config on the fly, so `name:reference` maps to a list of layers plus a config. That is DOCIR, written from scratch by Álvaro. It supports multi-arch images, token auth and S3 storage, keeps layer metadata in Postgres, and lets custom business logic pick the layers. According to the ContainerDays write-up, the reference can carry several parts after the tag and the registry resolves them as separate artifacts, which covers compatibility between extensions. The slides list a v1.0 target of Q2 2026 and full OCI Distribution compliance as a TODO. Ask Álvaro for the current status.

Combinatorics: n optional extensions give 2ⁿ possible images. The slides reportedly cite about 9 × 10⁵⁸ at n = 200. 2²⁰⁰ ≈ 1.6 × 10⁶⁰, so the slide figure may count something else, perhaps fixed-size subsets or a version matrix. **Ask Álvaro what he counted.**

StackGres extension count: the StackGres 1.0 announcement (2021) said 120+ extensions; a later deck says "100+". A "200+" figure in our notes is **unverified**.

## Open technical questions for the episode

- Does ImageVolume (option 3½: compose at mount time on the node) make DOCIR unnecessary for Kubernetes users, or is DOCIR the answer for Docker, Podman, Compose and CI, where ImageVolume does not exist?
- Which ABI coupling exists in practice? An extension `.so` is built against one PG major, one glibc and one architecture. How often do minor releases break it?
- Is a restart on every extension change acceptable? StackGres's runtime injection avoids the pod restart for some changes. Ask Álvaro to confirm.
- How do supply-chain tools (cosign signatures, SBOMs, CVE scanners) handle an image that exists only once someone has pulled it?
- What should extension authors ship: debs, OCI artefacts (`FROM scratch` with `/lib` and `/share`), or both? See also PGXN v2 and Trunk (**context to confirm**).
