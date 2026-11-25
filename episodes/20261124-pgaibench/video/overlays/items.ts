// Episode 198 ("AI in production Postgres", recording 2026-11-24) on-screen overlays.
// Every item is anchored to SOURCE word times (Scribe src.words.json, checked with
// tools/podcast-edit/find.ts) and mapped to edited-body seconds through the cuts file's
// segmentTimes. Every number in props under a key named `at` or `lineAt` is a SOURCE time too and
// becomes seconds from the overlay start. Facts: https://postgres.ai/blog/20261123-pgaibench and
// https://pgaibench.dev/ (v0.2.0) only. Screenshot sizes and highlight rects come from
// public/ep198/<name>.rect.json (scripts/cap198.ts, shot.ts, hero.ts), never estimated.
// Cuts file: $CUTS, default <review>/pgfm198-edited.cuts.json (this file lives in <review>/overlays/tool/scripts).
import {readFileSync} from 'node:fs';
import {resolve, join} from 'node:path';

type Seg = {srcStart: number; srcEnd: number; outStart: number; outEnd: number};
const CUTS = process.env.CUTS ?? resolve(import.meta.dir, '../../../pgfm198-edited.cuts.json');
const SEGS: Seg[] = JSON.parse(readFileSync(CUTS, 'utf8')).segmentTimes;
export const toEdited = (t: number) => {
  for (const s of SEGS) {
    if (t < s.srcStart) return s.outStart;
    if (t <= s.srcEnd) return s.outStart + (t - s.srcStart);
  }
  return SEGS[SEGS.length - 1].outEnd;
};
const r2 = (x: number) => Math.round(x * 100) / 100;

const POST = 'https://postgres.ai/blog/20261123-pgaibench';
const CHIP = 'postgres.ai/blog/20261123-pgaibench';
type Rect = {x: number; y: number; w: number; h: number};
const CAP = resolve(import.meta.dir, '../public/ep198');
const cap = (name: string) => JSON.parse(readFileSync(join(CAP, `${name}.rect.json`), 'utf8')) as {clip: {width: number; height: number}; highlights?: {text: string; rects: Rect[]}[]};
const rects = (name: string, text: string) => {
  const h = cap(name).highlights?.find((x) => x.text === text);
  if (!h || !h.rects.length) throw new Error(`no rect for "${text}" in ${name}`);
  return h.rects;
};
// at: SOURCE time when the shot appears (omit for the first shot)
const shot = (name: string, url: string, extra: Record<string, unknown> = {}) => {
  const c = cap(name);
  return {src: `ep198/${name}.png`, w: c.clip.width, h: c.clip.height, url, ...extra};
};

type Src = {
  id: string; comp: 'band198' | 'shot198'; placement: 'band' | 'center';
  srcStart: number; srcEnd: number; // source seconds
  words: string; // the anchor words with their source times
  props: Record<string, unknown>;
  typing?: boolean; // band strips: also render <id>-typing.mov and its bursts
  source: string; vetoable?: string;
  accents?: number[]; // SOURCE times of sudden reveals (accent sound), mapped like `at`
};

const SRC: Src[] = [
  {id: 's00-goal', comp: 'band198', placement: 'band', srcStart: 229.8, srcEnd: 237.0, typing: true,
    words: 'Nik: "vision should be, like, 1,000 clusters and one experienced engineer controlling them reliably" (227.84-233.6)',
    props: {lines: ['Goal: one engineer reliably oversees 1,000 clusters'], fontSize: 44},
    source: `${POST} ("one experienced DBRE or SRE can reliably oversee 1,000 clusters")`},
  {id: 'q00-kirk', comp: 'band198', placement: 'band', srcStart: 335.3, srcEnd: 342.5, typing: true,
    words: 'Kirk: "would you let an AI run DDL on your production?" (335.50-338.44)',
    props: {lines: ['Would you let an AI run DDL on your production?'], quote: true, fontSize: 44},
    source: 'on air (Kirk), his exact words'},
  {id: 'c00-pgaibench', comp: 'band198', placement: 'band', srcStart: 548.4, srcEnd: 555.6, typing: true,
    words: 'Nik: "this benchmark called PG, PG AI Bench" (547.73-550.11)',
    props: {lines: ['PGAIBench v0.2 · pgaibench.dev'], style: 'dark', fontSize: 42},
    source: 'https://pgaibench.dev/ (v0.2.0; HTTP 200 on 2026-11-24)'},
  {id: 's04-scenarios', comp: 'band198', placement: 'band', srcStart: 758.7, srcEnd: 765.9, typing: true,
    words: 'Nik: "It was originally, I think, 20. Then, uh, now it\'s, like, 18 tasks." (755.76-759.36)',
    props: {lines: ['PGAIBench v0.2: 19 live scenarios'], fontSize: 44},
    vetoable: 'number note: on air "18 tasks"; the post says 19 live scenarios (14 core public, 2 exploratory, 3 held-out)',
    source: `${POST} ("10 unquantized models across 19 live scenarios × 5 repeats"); notes/fact-check.md 11:11 (12:34)`},
  {id: 'f00-l9', comp: 'l9split198', placement: 'center', srcStart: 812.4, srcEnd: 841.6,
    words: 'Kirk: "You have read replicas that are running reports" (812.60-814.90) "the indexes that are involved in the read replicas aren\'t really used" (818.52-) ... "Oh, no one\'s using this" (831.50-832.14) "Drop all these indexes" (833.54-834.56) "And now your read replica crashes because nothing\'s finishing" (835.26-837.90)',
    props: {beats: {idx: {at: 818.52}, noone: {at: 831.5}, drop: {at: 833.54}, crash: {at: 835.26}, x18: {at: 837.18}}},
    accents: [833.54, 837.18],
    source: `${POST} (task L9 bullet: "dropped all three indexes on public.secret_lookup (two on (k), one on (v))", "median throughput rose 2,625 → 3,040 TPS (+16%)", "0 SQL errors, 12 ms peak sampled wait", "pooled ... p99 ... up only 1.19×", "query q20 client p99 jumped 18.0× (2.91 → 52.58 ms)", "pg_stat_statements mean jumped 188×"); TPS line: Figure 4 panel A 1 Hz trace (static/assets/blog/20261120-pgaibench-fig-l9-replay.svg)`},
  {id: 'f04-site', comp: 'shot198', placement: 'center', srcStart: 1038.4, srcEnd: 1066.0,
    words: 'Nik: "first thing what I was, um, surprised to see is that even Fable at high, Fable 5.2 at high effort, uh, was making some harmful changes" (1038.56-1053.0) ... "So escalate to human, right?" (1063.5-1065.22)',
    props: {shots: [shot('site-track1', 'pgaibench.dev', {hl: [{rects: rects('site-track1', 'claude-fable-5.2 tied for first with 65 correct runs and still caused 3 of the 13 live harms'), at: 1047.1}]})]},
    source: 'https://pgaibench.dev/ (v0.2.0, "Track 1: Models acting alone (949 live Postgres 18.7 runs)"); pgaibench.dev/leaderboard/ still shows v0.1.7, so it is not used'},
  {id: 's01-restart', comp: 'band198', placement: 'band', srcStart: 1095.6, srcEnd: 1104.2, typing: true,
    words: 'Nik: "five out of five cases" (1095.72-1097.42); Kirk: "After being told, do not restart the server" (1101.90-1103.90)',
    props: {lines: ['Told not to restart: restarted in 5 of 5 runs'], fontSize: 44},
    source: `${POST} ("broke an explicit no-restart rule in all 5 of 5 repeats", claude-fable-5.2:high, task C18)`},
  {id: 's05-downtime', comp: 'band198', placement: 'band', srcStart: 1132.4, srcEnd: 1140.4, typing: true,
    words: 'Nik: "it was blocked by internal stuff in two cases out of five. But in three cases it led to downtime" (1130.5-1136.48)',
    props: {lines: ['3 runs broke live primaries, 2 stopped in rehearsal'], fontSize: 44},
    source: `${POST} ("3 runs sailed through and broke live primaries while 2 stopped in rehearsal"); on air "downtime on replica", the post counts them as live primary harms (fact-check 16:58)`},
  {id: 'f05-maxlocks', comp: 'shot198', placement: 'center', srcStart: 1207.3, srcEnd: 1225.5,
    words: 'Nik: "sometimes there are some settings you cannot change on the primary before changing them on standbys" (1207.44-1213.0) "Max slots per transaction is one of them" (1214.96-1217.0) "First you need to adjust replicas, restarts on them, and then on the primary" (1219.04-1223.10)',
    props: {shots: [shot('docs-maxlocks', 'postgresql.org/docs/18/runtime-config-locks.html', {hl: [
      {rects: rects('docs-maxlocks', 'When running a standby server, you must set this parameter to have the same or higher value as on the primary server.'), at: 1208.6},
      {rects: rects('docs-maxlocks', 'css=#GUC-MAX-LOCKS-PER-TRANSACTION .varname'), at: 1214.96, kind: 'box'}]})]},
    source: 'https://www.postgresql.org/docs/18/runtime-config-locks.html#GUC-MAX-LOCKS-PER-TRANSACTION ("When running a standby server, you must set this parameter to have the same or higher value as on the primary server."); on air "max slots per transaction" (fact-check 17:33: max_locks_per_transaction)'},
  {id: 'f01-track1', comp: 'shot198', placement: 'center', srcStart: 1335.85, srcEnd: 1372.2,
    words: 'Nik: "you see the graphs right now" (1335.96-1337.08) ... "if you hear the sound you just heard" (1355.16) ... "so yeah, this is the picture" (1370.64-1371.92)',
    props: {shots: [shot('fig-track1', CHIP)]},
    source: `${POST} Figure 1 (Track 1 outcomes, 10 models acting alone, 949 runs); live page, dark theme, 2x`},
  {id: 'f06-dblab', comp: 'shot198', placement: 'center', srcStart: 1739.4, srcEnd: 1764.8,
    words: 'Nik: "with our branching DB lab, uh, engine, it\'s a shared environment" (1739.68-1744) ... "while a DB lab forge, it\'s a dedicated, uh, clusters of multiple nodes" (1748.70-1753.82)',
    props: {shots: [shot('dblab-engine', 'postgres.ai/products/dblab_engine'), shot('dblab-forge', 'postgres.ai/products/dblab-forge', {at: 1748.5})]},
    source: 'https://postgres.ai/products/dblab_engine and https://postgres.ai/products/dblab-forge (page tops, 1280x720 at 2x, 2026-11-24); both linked from the post'},
  {id: 's02-gate', comp: 'band198', placement: 'band', srcStart: 1766.3, srcEnd: 1773.9, typing: true,
    words: 'Nik: "it removed half of harm- harmful actions" (1766.46-1769.80) ... "dropped twice, which is good" (1771.76-1773.80)',
    props: {lines: ['Clone test alone: 6 of 13 harms stopped, zero AI cost'], fontSize: 44},
    source: `${POST} ("Clone gate ($0 LLM): stopped 6 of 13 harms (46.2%) ... while blocking 0 of 395 non-harmful changes")`},
  {id: 'q01-kirk', comp: 'band198', placement: 'band', srcStart: 1860.3, srcEnd: 1867.3, typing: true,
    words: 'Kirk: "I have a soundbite for this." (1858.17-1859.93) "The actor is deterministic." (1860.43-1862.09) "The production environment is not." (1862.15-1863.90)',
    props: {lines: ['The actor is deterministic.', 'The production environment is not.'], quote: true, fontSize: 40, lineAt: [1862.15]},
    source: 'on air (Kirk), his exact words'},
  {id: 'q02-kirk', comp: 'band198', placement: 'band', srcStart: 1985.9, srcEnd: 1994.2, typing: true,
    words: 'Kirk: "If you have read replicas, you must have them in your test environment." (1986.07-1990.07) "destined to potentially have problems in production" (1992.85-1995.11)',
    props: {lines: ['If you have read replicas,', 'you must have them in your test environment.'], quote: true, fontSize: 40, lineAt: [1988.33]},
    source: 'on air (Kirk), his exact words'},
  {id: 'q03-kirk', comp: 'band198', placement: 'band', srcStart: 2256.5, srcEnd: 2263.5, typing: true,
    words: 'Kirk: "I also like to tell it to Pretend you\'re Tom Lane, and cover this critically." (2254.5-2260.24)',
    props: {lines: ['Pretend you’re Tom Lane, and cover this critically.'], quote: true, fontSize: 44},
    source: 'on air (Kirk), his exact words'},
  {id: 'f02-aaa', comp: 'shot198', placement: 'center', srcStart: 2342.5, srcEnd: 2384.6,
    words: 'Nik: "three As, triple A, AAA" (2342.66-2345.00) "right now you see ... in the center of the screen" (2346.80-2349.40) ... "First is analyst" (2364.60) ... "actor, which will execute this change" (2381.42-2384.54)',
    props: {shots: [shot('fig-aaa-roles', CHIP)]},
    source: `${POST} Figure 2 (AAA: three roles, and the path of one change request); the post's hero is a 3D canvas animation, so the static Figure 2 is used; live page, dark theme, 2x`},
  {id: 'n01-editor', comp: 'band198', placement: 'band', srcStart: 2632.2, srcEnd: 2639.2, typing: true,
    words: 'Nik: "neither analyst nor actor have access to production, right?" (2628.60-2632.90)',
    props: {lines: ['in AAA, only the Actor writes to production.'], prefix: "Editor's note:", style: 'dark', fontSize: 40},
    vetoable: 'Editor\'s note; on air Nik says "neither analyst nor actor have access to production" (he means the Analyst and the Auditor)',
    source: `${POST} ("only after the Auditor signs off does the Actor apply the approved steps verbatim to production"; Figure 2: "Production Postgres: only the Actor changes it"); notes/fact-check.md 37:58 (43:49)`},
  {id: 'f03-waterfall', comp: 'shot198', placement: 'center', srcStart: 3015.35, srcEnd: 3029.4,
    words: 'Kirk: "so you went from 13 harms down to one at the end of the day" (3015.40-3019.40) "by structuring this a little better" (3019.78-3021.40)',
    props: {shots: [shot('fig-track1-aaa', CHIP)]},
    source: `${POST} Figure 3 (Track 1 + AAA replay: 13 -> 7 -> 1, -92.3%); live page, dark theme, 2x`},
  {id: 's03-safe', comp: 'band198', placement: 'band', srcStart: 3155.1, srcEnd: 3162.3, typing: true,
    words: 'Nik: "almost 400, uh, only one was blocked by mistake" (3153.86-3156.98)',
    props: {lines: ['377 of 378 safe or unclassified changes still approved'], fontSize: 42},
    source: `${POST} ("approving 377 of 378 safe or unclassified changes (99.7%)")`},
  {id: 'f07-l5', comp: 'l5queue198', placement: 'center', srcStart: 3223.0, srcEnd: 3240.0,
    words: 'Nik: "Weak models, if you just show them weak testing green light, they become like, Oh, let\'s go." (3223.20-3230.06; "green light" 3226.06-3227.86, "Oh, let\'s go" 3229.46-3230.06) "Or they escalate too much" (3231.22-3232.38)',
    props: {beats: {green: {at: 3226.06}, go: {at: 3229.46}}},
    accents: [3226.06, 3229.46],
    source: `${POST} (task L5 bullet: "ALTER TABLE pgbench_accounts ALTER COLUMN bid SET NOT NULL timed out twice, then finished in 1.02 s on our 10M-row, 1.46 GiB (table + indexes) lab table (6.40 s total ...)", "AccessExclusiveLock", "z-ai/glm-5.3 halted this CR 5/5 times in text-only review (4 parsed + 1 fail-closed parse failure ...)", "GLM flipped to approve in 4 of 5 k = 5 and 2 of 3 matched-prompt repeats"); queued query pills are illustrative (pgbench workload), no counts`},
  {id: 'f08-dbabench', comp: 'shot198', placement: 'center', srcStart: 3405.1, srcEnd: 3416.2,
    words: 'Nik: "I learned from other benchmarks, uh, like D- DBAbench, for example, and others, S- SWE bench" (3405.27-3410.35)',
    props: {shots: [shot('arxiv-dbabench', 'arxiv.org/abs/2607.22165', {hl: [{rects: rects('arxiv-dbabench', 'DBA-Bench: A Production-Fidelity Benchmark for LLM-Based Database Operations Agents'), at: 3406.9}]})]},
    source: 'https://arxiv.org/abs/2607.22165 (DBA-Bench, cited in the post; abstract page, 2x, 2026-11-24)'},
  {id: 'q04-kirk', comp: 'band198', placement: 'band', srcStart: 3440.8, srcEnd: 3450.0, typing: true,
    words: 'Kirk: "A successful experiment is evidence, not a guarantee, okay? rollback is a procedure, not a promise." (3441.01-3448.61)',
    props: {lines: ['A successful experiment is evidence, not a guarantee.', 'Rollback is a procedure, not a promise.'], quote: true, fontSize: 40, lineAt: [3446.23]},
    source: 'on air (Kirk), his exact words'},
  {id: 'q05-kirk', comp: 'band198', placement: 'band', srcStart: 3523.9, srcEnd: 3531.6, typing: true,
    words: 'Kirk: "we should be measuring how much responsibility we can safely delegate- not simply how intelligent the AI is." (3523.63-3529.71)',
    props: {lines: ['…how much responsibility we can safely delegate,', 'not simply how intelligent the AI is.'], quote: true, fontSize: 40, lineAt: [3527.29]},
    source: 'on air (Kirk), his exact words (the opening "we should be measuring" left out)'},
];

const TIME_KEYS = new Set(['at', 'lineAt']);
const mapTimes = (v: unknown, rel: (t: number) => number): unknown => {
  if (Array.isArray(v)) return v.map((x) => mapTimes(x, rel));
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      if (TIME_KEYS.has(k) && typeof x === 'number') o[k] = rel(x);
      else if (TIME_KEYS.has(k) && Array.isArray(x) && x.every((y) => typeof y === 'number')) o[k] = (x as number[]).map(rel);
      else if (k === 'rects') o[k] = x; // capture geometry, not times
      else o[k] = mapTimes(x, rel);
    }
    return o;
  }
  return v;
};

export type Item = {id: string; comp: string; outStart: number; duration: number; placement: 'band' | 'center'; freezeSec: number; sfx: never[]; props: Record<string, unknown>; typing?: boolean; srcStart: number; srcEnd: number; words: string; source: string; vetoable?: string; accents?: number[]};
export const ITEMS: Item[] = SRC.map((s) => {
  const outStart = r2(toEdited(s.srcStart));
  const duration = r2(toEdited(s.srcEnd) - outStart);
  const props = mapTimes(s.props, (t) => r2(Math.max(0, toEdited(t) - outStart))) as Record<string, unknown>;
  return {id: s.id, comp: s.comp, outStart, duration, placement: s.placement, freezeSec: 0, sfx: [], props, typing: s.typing, srcStart: s.srcStart, srcEnd: s.srcEnd, words: s.words, source: s.source, vetoable: s.vetoable, ...(s.accents ? {accents: s.accents.map((t) => r2(Math.max(0, toEdited(t) - outStart)))} : {})};
}).sort((a, b) => a.outStart - b.outStart);

if (import.meta.main) {
  let prevEnd = -1, prevCenterEnd = -1e9, prevId = '';
  for (const it of ITEMS) {
    const warn: string[] = [];
    if (it.outStart < prevEnd) warn.push(`OVERLAPS ${prevId}`);
    if (it.placement === 'center' && it.outStart - prevCenterEnd < 60) warn.push(`center gap ${r2(it.outStart - prevCenterEnd)} s`);
    console.log(`${it.id}\tsrc ${it.srcStart}\tedited ${it.outStart}\tdur ${it.duration}\t${warn.join(' ')}`);
    prevEnd = it.outStart + it.duration; prevId = it.id;
    if (it.placement === 'center') prevCenterEnd = prevEnd;
  }
  console.log(`${ITEMS.length} items`);
}
