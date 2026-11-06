// Overlays for "UUIDv4 vs UUIDv7" (recording 2026-10-27). Every item is anchored to SOURCE word
// times (src.words.json); start, duration, reveal times and SFX are mapped to edited seconds
// through the cuts file given on the command line.
//   bun scripts/episode.ts <cuts.json> [--render] [--stills] [id ...]
// Writes ../manifest.json (compose.ts format, freezeSec 0) and ../<id>.mov.
import {mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

type Seg = {srcStart: number; srcEnd: number; outStart: number; outEnd: number};
// Source -> edited seconds (same as scripts/blocks.example.ts). A source time inside a cut snaps
// to the start of the next kept segment.
const toEdited = (segs: Seg[], t: number) => {
  for (const s of segs) {
    if (t < s.srcStart) return s.outStart;
    if (t <= s.srcEnd) return s.outStart + (t - s.srcStart);
  }
  return segs[segs.length - 1].outEnd;
};

const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(ROOT, '..');
const G = JSON.parse(readFileSync(resolve(ROOT, 'data/figG.json'), 'utf8'));

type Sfx = {file: string; at: number; gain: number};
const air = (at: number, gain = 1.0): Sfx => ({file: 'sfx/air.wav', at, gain});
let nThud = 0;
const thud = (at: number, gain = 0.6): Sfx => ({file: ['sfx/thud1.wav', 'sfx/thud2.wav', 'sfx/thud3.wav'][nThud++ % 3], at, gain});

// All times below are SOURCE seconds. `at` keys inside props are absolute source times and are
// turned into seconds-from-start (edited) before rendering.
type Item = {id: string; comp: string; placement: 'band' | 'center'; srcStart: number; srcEnd: number; words: string; sfx: Sfx[]; props: Record<string, unknown>; timeKeys: string[]; source: string | null; still: number};
const BRIEF = 'https://console.postgres.ai/shared/brief/9fffe2da-00c1-470b-a79d-a210ae2306bc';

export const ITEMS: Item[] = [
  {id: '01-uuid-versions', comp: 'uuid', placement: 'band', srcStart: 757.3, srcEnd: 789.0,
    words: 'Nik: "UUID version 4" (757.43) ... "digit 4" (766.43) ... "Version 7" (770.91) ... "digit 7" (773.93) ... "integer 8." (778.65)',
    sfx: [thud(766.5, 0.5), thud(774.0, 0.5)],
    props: {v4: '8b1f3c5e-2d7a-4c91-b3e8-6f0a9d42c718', v7: '01a17e51-80a8-7b3d-9e21-4c6a8d0f5b17', v4At: 757.43, d4At: 766.43, v7At: 770.91, d7At: 773.93, timeAt: 775.4},
    timeKeys: ['v4At', 'd4At', 'v7At', 'd7At', 'timeAt'], source: 'example values; UUIDv7 layout per RFC 9562 (48-bit Unix ms first)', still: 777},
  {id: '02-memory-then-graph', comp: 'memgraph', placement: 'center', srcStart: 1063.9, srcEnd: 1146.5,
    words: 'Kirk: "just consumes all the memory, it kicks the table out of memory" (1063.93-1067.47); Nik: "check out the graph" (1088.11) ... "doesn\'t drop for UUID version 7 or integer 8." (1146.03)',
    sfx: [thud(1088.7, 0.6)],
    props: {
      memTitle: 'What stays in memory', memSub: '1 GiB shared_buffers, 100M rows', memOf: 1024,
      mem: [{key: 'v4', label: 'UUIDv4', index: 767, table: 50, at: 1064.1}, {key: 'v7', label: 'UUIDv7', index: 89, table: 475, at: 1068.3}, {key: 'int8', label: 'int8', index: 69, table: 485, at: 1069.4}],
      graphAt: 1088.67, graphTitle: 'Inserts per second', graphCaption: '1 GiB shared_buffers, 3 GiB memory cap', drawSec: 7,
      lines: [{key: 'int8', label: 'int8', end: '23.5k', pts: G.int8}, {key: 'v7', label: 'UUIDv7', end: '21.7k', pts: G.v7}, {key: 'v4', label: 'UUIDv4', end: '13.9k', pts: G.v4}],
      marker: {x: 25.85, text: ['UUIDv4 index', '> shared_buffers'], at: 1101.5},
    },
    timeKeys: ['graphAt', 'mem.at', 'marker.at'], source: `${BRIEF} (Infographic D: r1_summary.csv; Infographic G: r6_series.csv, small tier, mean lines)`, still: 1075},
  {id: '03-btree', comp: 'btree', placement: 'center', srcStart: 1227.3, srcEnd: 1297.0,
    words: 'Kirk: "here\'s the difference" (1226.91) ... "doesn\'t fit in memory anymore" (1240.71) ... "UUID version 7" (1275.95) ... "when you add a page" (1287.77) ... "auto-increment IDs" (1293.65) ... "same concept." (1296.59)',
    sfx: [],
    props: {v4Title: 'UUIDv4: random leaf', v7Title: 'UUIDv7: always the last leaf', tag: 'same as int8',
      v4At: 1228.3, v4Start: 1230.7, v4Step: 1.5, v4Stop: 1275.6, memAt: 1240.7,
      v7At: 1275.95, v7Start: 1279.0, v7Step: 1.0, splitAt: 1288.2, tagAt: 1293.65},
    timeKeys: ['v4At', 'v4Start', 'v4Stop', 'memAt', 'v7At', 'v7Start', 'splitAt', 'tagAt'], source: `${BRIEF} (section 3: random leaf vs rightmost leaf)`, still: 1291},
  {id: '04-same-speed', comp: 'band', placement: 'band', srcStart: 1360.2, srcEnd: 1386.4,
    words: 'Nik: "basically the rates of inserts are same, like for integer 8 and UUID version 7" (1360.33-1366.33)',
    sfx: [air(1360.2)],
    props: {kind: 'strip', text: 'UUIDv7 inserts as fast as int8', sub: '23,458 vs 23,131 inserts/s, same box'},
    timeKeys: [], source: `${BRIEF} (section 9: run 2, UUIDv7 23,458 vs int8 23,131 inserts/s on int8's box)`, still: 1363},
  {id: '05-wal-per-insert', comp: 'hbars', placement: 'center', srcStart: 1448.3, srcEnd: 1506.4,
    words: 'Nik: "which means that WAL is becoming bigger" (1448.39) ... "UUID version 7" (1452.59) ... "integer 8" (1455.75) ... "It\'s hard to say because" (1506.38)',
    sfx: [thud(1449.6, 0.6)],
    props: {title: 'WAL per insert', unit: 'bytes, 80M to 100M rows',
      rows: [{key: 'v4', label: 'UUIDv4', value: 1324, at: 1448.6}, {key: 'v7', label: 'UUIDv7', value: 744, at: 1452.6}, {key: 'int8', label: 'int8', value: 745, at: 1455.8}],
      caption: 'UUIDv4 dirties more pages, so more full pages go to WAL after each checkpoint.', captionAt: 1458.0},
    timeKeys: ['rows.at', 'captionAt'], source: `${BRIEF} (Infographic B: r1_windows_20m.csv, run 1, 80M-100M rows)`, still: 1470},
  {id: '06-just-switch', comp: 'band', placement: 'band', srcStart: 2074.8, srcEnd: 2097.0,
    words: 'Kirk: "just switch to UUID v7s." (2074.87-2076.11)',
    sfx: [air(2074.8)],
    props: {kind: 'quote', text: 'Just switch to UUID v7s.'},
    timeKeys: [], source: null, still: 2077},
  {id: '07-index-size', comp: 'hbars', placement: 'center', srcStart: 2628.2, srcEnd: 2661.2,
    words: 'Nik: "it\'s 18 bytes ... index size is bigger" (2628.27-2631.77) ... "comparison with integer eight" (2639.15-2640.91) ... "not comparison with UUID version four." (2642.79-2644.61)',
    sfx: [thud(2644.8, 0.6)],
    props: {title: 'Primary key index size', unit: 'MiB, 100M rows',
      rows: [{key: 'int8', label: 'int8', sub: '8-byte key', value: 2146, at: 2639.8}, {key: 'v7', label: 'UUIDv7', sub: '16-byte key', value: 3012, at: 2631.0}, {key: 'v4', label: 'UUIDv4', sub: '16-byte key', value: 3996, at: 2643.75}]},
    timeKeys: ['rows.at'], source: `${BRIEF} (Infographic C chart: r1_summary.csv, run 1 at 100M rows; key sizes section 6)`, still: 2645.2},
  {id: '08-keep-uuid', comp: 'band', placement: 'band', srcStart: 2891.0, srcEnd: 2916.7,
    words: 'Nik: "you don\'t need to change data type ... stays UUID ... just need to change default function" (2890.57-2898.65)',
    sfx: [air(2891.0)],
    props: {kind: 'strip', text: 'Keep the uuid type. Change only the default.', sub: 'uuidv7() is in Postgres 18'},
    timeKeys: [], source: `${BRIEF} ("uuidv7() is in Postgres 18")`, still: 2895},
];

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const cutsPath = resolve(args[0]);
  const render = args.includes('--render');
  const stills = args.includes('--stills');
  const only = new Set(args.slice(1).filter((a) => !a.startsWith('--')));
  const segs = JSON.parse(readFileSync(cutsPath, 'utf8')).segmentTimes;
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const built = ITEMS.map((it) => {
    const outStart = r2(toEdited(segs, it.srcStart));
    const dur = r2(toEdited(segs, it.srcEnd) - outStart);
    const rel = (t: number) => r2(Math.max(0, toEdited(segs, t) - outStart));
    const props: Record<string, unknown> = JSON.parse(JSON.stringify(it.props));
    for (const k of it.timeKeys) {
      const [a, b] = k.split('.');
      if (b) {
        const v = props[a];
        if (Array.isArray(v)) props[a] = v.map((o) => ({...o, [b]: rel(o[b])}));
        else props[a] = {...(v as object), [b]: rel((v as Record<string, number>)[b])};
      } else props[a] = rel(props[a] as number);
    }
    // Step sizes stay in seconds (they are intervals, not times).
    return {it, outStart, dur, props: {...props, durationSec: dur}, sfx: it.sfx.map((x) => ({...x, at: rel(x.at)})), stillAt: rel(it.still)};
  });
  for (let i = 1; i < built.length; i++) {
    const p = built[i - 1], q = built[i];
    if (p.outStart + p.dur > q.outStart) console.warn(`overlap: ${p.it.id} ends ${r2(p.outStart + p.dur)} > ${q.it.id} starts ${q.outStart}`);
  }
  for (const b of built) console.log(`${b.it.id}\tsrc ${b.it.srcStart}\tedited ${b.outStart}\tdur ${b.dur}`);
  mkdirSync(join(OUT, 'props'), {recursive: true});
  for (const b of built) writeFileSync(join(OUT, 'props', `${b.it.id}.props.json`), JSON.stringify(b.props));
  const todo = built.filter((b) => only.size === 0 || only.has(b.it.id));
  if (stills) {
    mkdirSync(join(OUT, 'stills'), {recursive: true});
    for (const b of todo) {
      const frame = Math.round(b.stillAt * 25);
      const p = Bun.spawnSync(['bunx', 'remotion', 'still', 'src/index.ts', b.it.comp, join(OUT, 'stills', `${b.it.id}.png`), `--frame=${frame}`, '--log', 'error', `--props=${join(OUT, 'props', `${b.it.id}.props.json`)}`], {cwd: ROOT, stdout: 'inherit', stderr: 'inherit'});
      console.log(p.exitCode === 0 ? `still ${b.it.id} @${b.stillAt}s` : `FAIL still ${b.it.id}`);
    }
  }
  if (render) {
    // One at a time (parallel renders can deadlock).
    for (const b of todo) {
      const file = join(OUT, `${b.it.id}.mov`);
      const p = Bun.spawn(['bunx', 'remotion', 'render', 'src/index.ts', b.it.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', `--props=${join(OUT, 'props', `${b.it.id}.props.json`)}`], {cwd: ROOT, stdout: 'inherit', stderr: 'inherit'});
      const code = await p.exited;
      console.log(code === 0 && existsSync(file) ? `ok ${b.it.id}` : `FAIL ${b.it.id}`);
    }
  }
  mkdirSync(join(OUT, 'sfx'), {recursive: true});
  for (const f of ['air.wav', 'thud1.wav', 'thud2.wav', 'thud3.wav', 'wind1.wav', 'wind2.wav', 'LICENSE.txt']) copyFileSync(join(ROOT, 'sfx', f), join(OUT, 'sfx', f));
  const overlays = built.map((b) => ({id: b.it.id, srcStart: b.it.srcStart, srcEnd: b.it.srcEnd, words: b.it.words, outStart: b.outStart, dur: b.dur, duration: b.dur, file: `${b.it.id}.mov`, placement: b.it.placement, freezeSec: 0, sfx: b.sfx, source: b.it.source}));
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({video: 'full-v5-edited.mp4', cuts: cutsPath, fps: 25, width: 1920, height: 1080, timeBase: 'edited seconds for the cuts file, no freezes', band: {x: 24, y: 912, w: 1576, h: 140}, overlays}, null, 2));
  console.log(`manifest: ${join(OUT, 'manifest.json')}`);
}
