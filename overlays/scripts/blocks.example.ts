// Long-hold "center" blocks, v3 (Nik, 2026-10-22): no freezes, the talk continues,
// hosts at the edges. Every block is anchored to SOURCE time (words in
// video1876562600.words.json), so it survives any new edit: the edited start is
// computed from the cuts file given on the command line.
//   bun scripts/blocks-v3.ts <cuts.json> [--render] [id ...]
// Writes ../out/blocks-v3.manifest.json (entries in edited seconds for that cuts file).
import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(ROOT, '../overlays');
mkdirSync(OUT, {recursive: true});

type Seg = {srcStart: number; srcEnd: number; outStart: number; outEnd: number};
// Source -> edited seconds. A source time inside a cut snaps to the start of the next kept segment.
export const toEdited = (segs: Seg[], t: number) => {
  for (const s of segs) {
    if (t < s.srcStart) return s.outStart;
    if (t <= s.srcEnd) return s.outStart + (t - s.srcStart);
  }
  return segs[segs.length - 1].outEnd;
};

// Block 08 numbers live in data/two-queries.json (swap the file to change the block).
const {_doc: _d1, source: _s1, ...ONEQ} = JSON.parse(readFileSync(resolve(ROOT, 'data/one-query.json'), 'utf8'));
const {_doc, source: _src, ...TWOQ} = JSON.parse(readFileSync(resolve(ROOT, 'data/two-queries.json'), 'utf8'));

type Sfx = {file: string; at: number; gain: number};
const air = (at: number, gain = 1.0): Sfx => ({file: 'sfx/air.wav', at, gain});
let nThud = 0;
const thud = (at: number, gain = 0.8): Sfx => ({file: ['sfx/thud1.wav', 'sfx/thud2.wav', 'sfx/thud3.wav'][nThud++ % 3], at, gain});

// srcStart/srcEnd: source seconds of the anchor words (quoted). Reveal times inside
// the block are seconds from srcStart, also taken from word times.
type Block = {id: string; comp: string; srcStart: number; srcEnd: number; words: string; replaces: string[]; sfx: Sfx[]; props: Record<string, unknown>; source: string};

export const BLOCKS: Block[] = [
  // 01-kirk-intro and 02-hacking-sessions are NOT here: Nik wants the exact v2 overlays, only moved
  // (see REPOSITION in manifest-v3.ts).
  // Nik: "...or even worse, you expected index only scan ... you don't have statistics." until Kirk: "So let's define".
  // Numbers: Forge restore-readiness-01 README lines 32-35 (join), 49-52 (covering), 70-73 (ms, context only).
  {id: '08-two-queries', comp: 'simple', srcStart: 488.6, srcEnd: 510.6, words: 'Nik: "or even worse, you expected index only scan" (src 488.62) to Kirk: "So let\'s define" (src 510.66)', replaces: ['08-three-bars'],
    sfx: [air(0), air(0.6), thud(2.0), air(2.6), thud(4.6)],
    // Same reveal times as the old grid, so the SFX stay: rows at 0.6 / 2.6 (air), fix tags at 2.0 / 4.6 (thud).
    props: {...TWOQ, rowAt: [0.6, 2.6], fixAt: [1.4, 2.0]},
    source: 'DBLab Forge restore-readiness-01 README.md:70-73'},
  // Right after block 08 ends: Kirk opens a new thought, "So let's define a few things, okay?" (src 510.66), and the
  // hosts stay at the edges while the card hands over. Ends after "The optimizer can just look at that." (src 543.70).
  // Numbers: data/one-query.json (Forge analysis/one_query_pg18.csv, cold medians; README.md 22, 377-405).
  {id: '08b-one-query-at-scale', comp: 'scale', srcStart: 510.66, srcEnd: 543.8, words: 'Kirk: "So let\'s define a few things" (src 510.66) to "The optimizer can just look at that." (src 543.70)', replaces: [],
    sfx: [], // no audio change (team-lead, 2026-10-22)
    props: {...ONEQ, barAt: 1.2, barStep: 2.2, finalAt: 8.4},
    source: 'DBLab Forge restore-readiness-01 analysis/one_query_pg18.csv; README.md:22,377-405'},
  // Nik: "relallv, uh, visible" (src 2067.41) ... "visibility maps are not yet built" (2097.27) ... "index only scan" (2102.17)
  // ... "heap fetches" (2106.09) ... "skewed result for a planner, right?" (2119.45).
  // Numbers: README lines 10, 15, 88, 100 (10,000 heap fetches); ms: runs/pg18/diag_av_off q1_*_stats (6.1, 7.4),
  // runs/tav_pg18 q1 stats passes (10.1-13.1, median 10.2); after VACUUM: README line 72 (1.1 ms), lines 51-52 (0 heap fetches).
  {id: '20-relallvisible', comp: 'trap', srcStart: 2067.3, srcEnd: 2119.6, words: 'Nik: "relallv, uh, visible" (src 2067.41) to "skewed result for a planner, right?" (src 2119.45)', replaces: ['20-relallvisible'],
    sfx: [air(0), thud(30.0), air(34.9), thud(38.8), thud(40.0, 0.6)],
    props: {planner: {label: 'Planner (relallvisible)', value: 3449}, vm: {label: 'Visibility map', value: 0}, vmAt: 30.0,
      scanTitle: 'Index Only Scan, same query', scanAt: 34.9, rowsAt: 38.8, cols: ['after restore', 'after VACUUM'],
      rows: [{label: 'heap fetches', a: '10,000', b: '0'}, {label: 'time', a: '6–11 ms', b: '1.1 ms'}],
      foot: 'PG 18.6, --statistics archive, autovacuum off during restore. DBLab Forge.'},
    source: 'DBLab Forge restore-readiness-01 README.md:10,15,88,100,51-52,72; runs/pg18/diag_av_off; runs/tav_pg18'},
  // Nik: "But, if you don't have indexes ... first read is terribly slow ... Subsequent sequential scans will be fast." (src 2670.5-2690.7)
  // Numbers: README lines 16, 157 (28,251,777 bytes WAL, 3,449 FPI); times from raw runs/frc2_pg18_checksums/targets/r{1,2,3}_none_ckpt/
  // seq_events_first.json (49.1, 48.6, 42.9 ms) and seq_events_second.json (22.7, 23.2, 22.6 ms): medians 48.6 and 22.7.
  {id: '25-first-read-wal', comp: 'duel', srcStart: 2670.5, srcEnd: 2690.7, words: 'Nik: "if you don\'t have indexes ... first read is terribly slow" (src 2670.51) to "will be fast." (src 2689.39)', replaces: ['25-first-read-wal'],
    sfx: [air(0), thud(7.3), thud(16.2, 0.6)],
    props: {kicker: 'PG 18.6, table without indexes', title: 'SELECT count(*) right after restore', cols: ['1st read', '2nd read'],
      rows: [{label: 'WAL', a: '26.9 MiB', b: '0'}, {label: 'time', a: '49 ms', b: '23 ms'}], rowsAt: [7.3, 16.2],
      foot: 'After a checkpoint, data checksums on. 200k rows. DBLab Forge.'},
    source: 'DBLab Forge restore-readiness-01 README.md:16,157; runs/frc2_pg18_checksums/targets/r*_none_ckpt/seq_events_{first,second}.json'},
  // Nik: "And in Postgres 19 ... also visibility maps." Kirk: "But that's a lot of writing to do a query." Nik: "...one bit for one page." (src 2691.0-2716.4)
  // Numbers: README lines 11, 16, 166 (VM 3,267 of 3,480 after the first range query; 26,827,000 bytes WAL); times from raw
  // runs/frc2_pg19_checksums/targets/r{1,2,3}_none_ckpt/q1_first.json (33.2, 30.1, 32.9 ms) and q1_second.json (7.3, 7.5, 7.6 ms).
  {id: '26-pg19-first-read-vm', comp: 'duel', srcStart: 2691.0, srcEnd: 2716.4, words: 'Nik: "And in Postgres 19" (src 2690.81) to Nik: "one bit for one page." (src 2714.97)', replaces: ['26-pg19-first-read-vm'],
    sfx: [air(0), thud(13.5), thud(18.1), thud(19.3, 0.6)],
    props: {kicker: 'PG 19 (rc1), no VACUUM', title: 'A SELECT fills the visibility map',
      meter: {label: 'all-visible after 1st read', value: 3267, of: 3480, at: 13.5}, cols: ['1st read', '2nd read'],
      rows: [{label: 'WAL', a: '25.6 MiB', b: '0'}, {label: 'time', a: '33 ms', b: '7.5 ms'}], rowsAt: [18.1, 19.3],
      foot: 'Full-page images after checkpoint. Index range query, checksums on. DBLab Forge.'},
    source: 'DBLab Forge restore-readiness-01 README.md:11,16,166; runs/frc2_pg19_checksums/targets/r*_none_ckpt/q1_{first,second}.json'},
];

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const cutsPath = args[0];
  const render = args.includes('--render');
  const only = new Set(args.slice(1).filter((a) => !a.startsWith('--')));
  const segs: Seg[] = JSON.parse(readFileSync(cutsPath, 'utf8')).segmentTimes;
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const entries = BLOCKS.map((b) => {
    const outStart = r2(toEdited(segs, b.srcStart));
    let dur = r2(toEdited(segs, b.srcEnd) - outStart);
    const mov = join(OUT, `${b.id}.mov`);
    const rendering = render && (only.size === 0 || only.has(b.id));
    if (!rendering && existsSync(mov)) {
      // Frozen block: keep the rendered .mov as is; its length wins over the mapped one.
      const movDur = r2(Number(Bun.spawnSync(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mov]).stdout.toString().trim()));
      if (Math.abs(movDur - dur) > 0.3) console.warn(`${b.id}: mapped ${dur} s, rendered ${movDur} s; keeping the rendered file`);
      dur = movDur;
    }
    // Reveal times and SFX are word-relative in source seconds; map them through the cuts too.
    const rel = (t: number) => r2(toEdited(segs, b.srcStart + t) - toEdited(segs, b.srcStart));
    for (const k of ['vmAt', 'scanAt', 'shipAt']) if (typeof b.props[k] === 'number') b.props[k] = rel(b.props[k] as number);
    if (Array.isArray(b.props.rowsAt)) b.props.rowsAt = (b.props.rowsAt as number[]).map(rel);
    else if (typeof b.props.rowsAt === 'number') b.props.rowsAt = rel(b.props.rowsAt as number);
    if (b.props.meter) b.props.meter = {...(b.props.meter as object), at: rel((b.props.meter as {at: number}).at)};
    b.sfx = b.sfx.map((x) => ({...x, at: rel(x.at)}));
    return {id: b.id, srcStart: b.srcStart, srcEnd: b.srcEnd, words: b.words, replaces: b.replaces, outStart, duration: dur, dur, file: `${b.id}.mov`, placement: 'center', freezeSec: 0, sfx: b.sfx, source: b.source};
  });
  mkdirSync(resolve(ROOT, '../out'), {recursive: true});
  writeFileSync(resolve(ROOT, '../out/blocks-v3.manifest.json'), JSON.stringify({cuts: cutsPath, timeBase: 'edited seconds for that cuts file', overlays: entries}, null, 2));
  for (const e of entries) console.log(e.id, 'edited', e.outStart, 'dur', e.dur);
  for (const b of BLOCKS) writeFileSync(resolve(ROOT, `../out/${b.id}.props.json`), JSON.stringify({...b.props, durationSec: entries.find((x) => x.id === b.id)!.dur}));
  if (render) {
    // One at a time (parallel renders can deadlock).
    for (const b of BLOCKS.filter((x) => only.size === 0 || only.has(x.id))) {
      const e = entries.find((x) => x.id === b.id)!;
      const file = join(OUT, `${b.id}.mov`);
      const p = Bun.spawn(['bunx', 'remotion', 'render', 'src/index.ts', b.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', `--props=${JSON.stringify({...b.props, durationSec: e.dur})}`], {cwd: ROOT, stdout: 'inherit', stderr: 'inherit'});
      const code = await p.exited;
      console.log(code === 0 && existsSync(file) ? `ok ${b.id}` : `FAIL ${b.id}`);
    }
  }
}
