# Postgres 19 for people who run it

[All episodes](../../README.md)

## Overview

- **Question:** What stops an upgrade from 18 to 19, what do you gain, and what did we measure on 18.7 against 19 RC2?
- **Hosts / guests:** Nikolay Samokhvalov and Michael Christofides.
- **Status:** Preparation; recording notes are a draft.
- **Study material deadline:** To be confirmed, with time zone.
- **Recording date:** To be confirmed (the folder name assumes Tuesday 2026-11-17 PT).
- **Episode number:** Add when assigned.

## Materials

| Document | Purpose |
| --- | --- |
| [`recording-notes.md`](recording-notes.md) | Angle, three leads with numbers to say, quick hits, demos, "do not say" list, show-notes links, open questions |

## Discussion outline

1. Cold open: Postgres 19 in numbers.
2. Upgrade day: removed settings, the `pg_upgrade --check` gap, a standby without zstd, lock slots, the pre-check script.
3. REPACK (CONCURRENTLY) against pg_repack: the final lock, the rule for its length, the costs.
4. LISTEN/NOTIFY with many listeners.
5. Quick hits: defaults that change under you.

## Evidence status

Study brief, version 2.2 (PGDG 18.7 against 19 RC2; behavior on small test hosts, speed on dedicated hosts, 3 trials per version where stated): https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c. Not a result for 19.0. Raw data is not public.

## Sources and attribution

Credits and links are in the recording notes, beside each lead: shihao zhong (`pg_upgrade --check` gap), Heikki Linnakangas (double `max_locks_per_transaction`), Radim Marek (REPACK final lock), Joel Jacobson (NOTIFY).

## Open questions

See the last section of the recording notes.

## Published links

To be added.
