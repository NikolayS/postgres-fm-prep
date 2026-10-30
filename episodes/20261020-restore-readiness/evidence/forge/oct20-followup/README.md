# Selected evidence for the October 20 follow-up

[Reviewed findings and limitations](../../../forge-oct20-followup.md) · [Source paths and hashes](provenance.json)

This subset contains raw query plans, catalog/visibility snapshots, polling records, maintenance measurements and vacuumdb results from the partition, freeze and client-mode tracks. The manifest pins the private source branch and commit and each file's SHA-256. Files were copied unchanged.

The Forge implementation and full artifacts are not published. This is an inspectable evidence subset, not a complete reproduction package. The new tracks were reviewed from supplied output; they were not independently rerun for this update. Failed xmin capture remains visible in the freeze state files. Cluster WAL deltas and per-table VERBOSE WAL counters measure different scopes.
