// Episode 197 on-screen notes (notes/corrections.md), anchored on Scribe word times, mapped through edited-draft.cuts.json.
export type Item = {id: string; comp: 'band'; outStart: number; duration: number; placement: 'band'; freezeSec: number; sfx: never[]; props: Record<string, unknown>; source?: string};
export const ITEMS: Item[] = [
 {
  "id": "01-score-weights",
  "comp": "band",
  "outStart": 1174.75,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Note:",
   "text": "the score weights are server-wide",
   "sub": "see pg_stat_autovacuum_scores"
  },
  "source": "notes/corrections.md 00:23:09; anchor \"prioritizing and letting us queue\" at source 1433.51-1435.63"
 },
 {
  "id": "02-parallel-av",
  "comp": "band",
  "outStart": 1263.46,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Note:",
   "text": "parallel autovacuum is off by default",
   "sub": "enable with autovacuum_max_parallel_workers"
  },
  "source": "notes/corrections.md 00:24:47; anchor \"parallel auto vacuum as well\" at source 1526.38-1527.78"
 },
 {
  "id": "03-stash-advice",
  "comp": "band",
  "outStart": 1553.71,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Note:",
   "text": "pg_stash_advice keeps advice per query ID on the server",
   "sub": "pg_dump does not include it"
  },
  "source": "notes/corrections.md 00:29:53; anchor \"store it in the database\" at source 1831.91-1833.65"
 },
 {
  "id": "04-overhead",
  "comp": "band",
  "outStart": 1611.21,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Note:",
   "text": "about 13% in our test",
   "sub": "advice generated for every query, on a trivial query (small test host)"
  },
  "source": "notes/corrections.md 00:30:46; anchor \"around 10%\" at source 1891.13-1891.91"
 },
 {
  "id": "05-tsc",
  "comp": "band",
  "outStart": 2115.82,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Note:",
   "text": "on x86-64",
   "sub": "CPU time-stamp counter"
  },
  "source": "notes/corrections.md 00:39:41; anchor \"timing overhead of explain analyze\" at source 2418.38-2420.60"
 },
 {
  "id": "06-release-notes",
  "comp": "band",
  "outStart": 2292.62,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Note:",
   "text": "it is in the 19 release notes",
   "sub": "“Allow pg_dump to include restorable extended statistics”"
  },
  "source": "notes/corrections.md 00:42:34; anchor \"didn't see it in the release notes\" at source 2598.46-2599.44"
 },
 {
  "id": "07-pg-restore",
  "comp": "band",
  "outStart": 2318.82,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Note:",
   "text": "pg_restore restores them too",
   "sub": "dump with pg_dump --statistics"
  },
  "source": "notes/corrections.md 00:43:12; anchor \"if you can dump\" at source 2643.66-2644.30"
 },
 {
  "id": "08-not-on-table",
  "comp": "band",
  "outStart": 2419.04,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Correction:",
   "text": "these settings cannot be set on a table",
   "sub": "check roles, databases and functions",
   "accent": "#E5322D"
  },
  "source": "notes/corrections.md 00:45:14; anchor \"a specific table\" at source 2757.24-2758.20"
 },
 {
  "id": "09-upgrade-fails",
  "comp": "band",
  "outStart": 2435.4,
  "duration": 8,
  "placement": "band",
  "freezeSec": 0,
  "sfx": [],
  "props": {
   "kind": "strip",
   "prefix": "Note:",
   "text": "on a role or database, pg_upgrade itself fails",
   "sub": "in the 19 config file, 19 does not start"
  },
  "source": "notes/corrections.md 00:45:35; anchor \"pg upgrade check will report success\" at source 2773.60-2776.02"
 }
];
