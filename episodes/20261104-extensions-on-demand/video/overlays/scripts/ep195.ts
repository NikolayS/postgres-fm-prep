// Overlays for "Extensions on demand" (recording 2026-11-04). Every item is anchored to SOURCE word
// times (src.words.json); start, duration and reveal times are mapped to edited seconds through the
// cuts file. Same pipeline as the 2026-10-27 episode (scripts/episode.ts there).
//   bun scripts/ep195.ts <cuts.json> [--render] [--stills] [id ...]
// Writes ../manifest.json (compose.ts format, freezeSec 0), ../<id>.mov (center) or
// ../<id>-typing.mov + ../<id>-typing-bursts.json (band), ../props/<id>.props.json.
import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {bandTypingPlan} from '../src/Episode';

type Seg = {srcStart: number; srcEnd: number; outStart: number; outEnd: number};
const toEdited = (segs: Seg[], t: number) => {
  for (const s of segs) {
    if (t < s.srcStart) return s.outStart;
    if (t <= s.srcEnd) return s.outStart + (t - s.srcStart);
  }
  return segs[segs.length - 1].outEnd;
};
const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(ROOT, '..');
const BRIEF = 'https://console.postgres.ai/shared/brief/c501d438-b872-4705-89a6-bdab30ea1680';

type Item = {id: string; comp: string; placement: 'band' | 'center'; srcStart: number; srcEnd: number; words: string; props: Record<string, unknown>; timeKeys: string[]; accents?: number[]; source: string | null; still: number};

export const ITEMS: Item[] = [
  {id: '01-fat-image', comp: 'fat', placement: 'center', srcStart: 1209.5, srcEnd: 1301.0,
    words: 'Alvaro: "what I call a fat image" (1209.77) ... "1,000 extensions" (1217.35) ... "single container image" (1221.97) ... "There may be plenty of CVEs" (1270.49) ... "the main one security" (1300.99)',
    props: {sizeAt: [1210.0, 1213.0, 1222.0], cveAt: 1270.5, cveRows: [1271.0, 1272.5, 1276.0]},
    timeKeys: ['sizeAt.*', 'cveAt', 'cveRows.*'], source: `${BRIEF} (section 2, E1: compressed MiB and Trivy CVE totals; key numbers: 98 MiB extension layer)`, still: 1260},
  {id: '02-repo-down', comp: 'repodown', placement: 'center', srcStart: 1547.4, srcEnd: 1574.4,
    words: 'Alvaro: "it has the most extensions available" (1547.60) ... "only when you create a new cluster" (1558.52) ... "steady state there is zero downloads" (1561.48-1562.80) ... "220 something" (1569.78)',
    props: {rowAt: [1558.6, 1562.0, 1565.5], captionAt: 1568.0},
    timeKeys: ['rowAt.*', 'captionAt'], source: `${BRIEF} (section 0, follow-up round: StackGres with the repository unreachable, n = 3; cache rerun, warm 29.4 s to 19 of 19)`, still: 1572},
  {id: '03-combinations', comp: 'bandtype', placement: 'band', srcStart: 1699.6, srcEnd: 1735.0,
    words: 'Nik: "two to a power of this 200 something" (1699.90) ... "10 power 66, so 66 zeros" (1707.16) ... "atoms in universe ... 80 zeros" (1713.30-1716.30)',
    props: {kind: 'strip', text: '220 extensions: 2²²⁰ ≈ 10⁶⁶ possible images', sub: 'Atoms in the observable universe: about 10⁸⁰'},
    timeKeys: [], source: '2^220 = 1.7 x 10^66 (arithmetic); 220 extensions said on air at 26:09; 10^80 atoms is the usual estimate quoted on air', still: 1712},
  {id: '04-hashimoto', comp: 'quote', placement: 'center', srcStart: 2289.4, srcEnd: 2340.0,
    words: 'Nik: "Mitchell Hashimoto, says that you shouldn\'t do it" (2289.58-2292.90) ... "on the screen you can see that very tweet" (2314.32-2318.52) ... "pin the versions" (2322.78) ... "verify all the upgrades" (2327.78)',
    props: {name: 'Mitchell Hashimoto', handle: '@mitchellh', date: 'May 20, 2026', where: 'Post on X, first paragraph',
      parts: [{text: 'Fork your dependencies, trim them to only your use case, '}, {text: 'never update unless it breaks for your users.', hl: 0}, {text: ' I’ve been vocal about this for 10+ years. I’ve always said that '}, {text: 'updating is way riskier than latent bugs', hl: 1}, {text: ' (which can be tracked and CVEs monitored).'}],
      hlAt: [2292.2, 2323.0]},
    timeKeys: ['hlAt.*'], source: 'https://x.com/mitchellh/status/2057171518027887035 (2026-05-20 18:48 UTC; text from the public syndication endpoint, first paragraph)', still: 2325},
  {id: '05-preload-trap', comp: 'bandtype', placement: 'band', srcStart: 2429.2, srcEnd: 2459.6,
    words: 'Alvaro: "functionality in Postgres 18 that allows you to add extensions in separate paths" (2429.34-2435.24) ... "pull dynamically code there and mount it there" (2441.82) ... "not pinning anymore" (2444.78)',
    props: {kind: 'strip', text: 'Mount the extension image first, preload it second', sub: 'CloudNativePG, switchover, both in one change: stuck in 4 of 4 runs'},
    timeKeys: [], source: `${BRIEF} (section 0: pgaudit image + shared_preload_libraries in one patch, switchover, 4 of 4 no recovery; two steps worked, n = 1)`, still: 2445},
  {id: '06-layers', comp: 'layers', placement: 'center', srcStart: 2598.6, srcEnd: 2700.0,
    words: 'Alvaro: "let me explain briefly" (2598.82) ... "composes layers dynamically" (2625.18) ... "base layer" (2627.96) ... "each extension is a layer" (2633.12) ... "these three extensions" (2641.16) ... "in milliseconds" (2650.14) ... "major version upgrade" (2662.32) ... "Postgres 17 and Postgres 18 layer" (2674.48) ... "plus the extensions for Postgres 17" (2683)',
    props: {reqAt: 2610.0, flyAt: [2628.0, 2630.0, 2633.2, 2634.4], digestAt: 2642.0, noteAt: 2650.2, bAt: 2662.4, b17At: 2674.6, bExtAt: 2683.0},
    timeKeys: ['reqAt', 'flyAt.*', 'digestAt', 'noteAt', 'bAt', 'b17At', 'bExtAt'], source: `mechanism as described on air; ${BRIEF} (section 3, E2: e/citext/pgvector and e/pgvector/citext share digest f9ca85e9; pgvector layer one blob, 0.85 MB, shared by every composition)`, still: 2655},
  {id: '07-restart-outage', comp: 'outage', placement: 'center', srcStart: 2800.8, srcEnd: 2852.2,
    words: 'Alvaro: "I wanna do an upgrade" (2801.02) ... "This will trigger a restart" (2809.28) ... "you run the PG upgrade process" (2815.46) ... "rewrite the manifest again" (2822.16) ... "then you restart and boom" (2830.22); Kirk: "It has to be changed through the manifest" (2846.14)',
    props: {groupAt: [2809.4, 2815.5, 2822.2], captionAt: 2826.0},
    timeKeys: ['groupAt.*', 'captionAt'], source: `${BRIEF} (section 0, case 02 table: longest rw outage, medians of 5 / 3)`, still: 2840},
];

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const cutsPath = resolve(args[0]);
  const render = args.includes('--render');
  const stills = args.includes('--stills');
  const only = new Set(args.slice(1).filter((a) => !a.startsWith('--')));
  const segs: Seg[] = JSON.parse(readFileSync(cutsPath, 'utf8')).segmentTimes;
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const built = ITEMS.map((it) => {
    const outStart = r2(toEdited(segs, it.srcStart));
    const dur = r2(toEdited(segs, it.srcEnd) - outStart);
    const rel = (t: number) => r2(Math.max(0, toEdited(segs, t) - outStart));
    const props: Record<string, unknown> = JSON.parse(JSON.stringify(it.props));
    for (const k of it.timeKeys) {
      const [a, b] = k.split('.');
      if (b === '*') props[a] = (props[a] as number[]).map(rel);
      else props[a] = rel(props[a] as number);
    }
    return {it, outStart, dur, props: {...props, durationSec: dur}, stillAt: rel(it.still)};
  });
  for (let i = 1; i < built.length; i++) {
    const p = built[i - 1], q = built[i];
    if (p.outStart + p.dur > q.outStart) console.warn(`overlap: ${p.it.id} ends ${r2(p.outStart + p.dur)} > ${q.it.id} starts ${q.outStart}`);
  }
  for (const b of built) console.log(`${b.it.id}\tsrc ${b.it.srcStart}\tedited ${b.outStart}\tfinal ${r2(b.outStart + 13)}\tdur ${b.dur}`);
  mkdirSync(join(OUT, 'props'), {recursive: true});
  for (const b of built) writeFileSync(join(OUT, 'props', `${b.it.id}.props.json`), JSON.stringify(b.props));
  // Typing bursts for band cards (sfx-manifest.ts reads <id>-typing-bursts.json).
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  for (const b of built.filter((x) => x.it.placement === 'band')) {
    const pl = bandTypingPlan(b.props as {kind: string; text: string; sub?: string});
    const list = [...pl.mainB.map((x) => ({...x, line: 'main'})), ...pl.subB.map((x) => ({...x, line: 'sub'}))].map(({start, end, chars, line}) => ({start: r3(start), end: r3(end), chars, line}));
    writeFileSync(join(OUT, `${b.it.id}-typing-bursts.json`), JSON.stringify({overlay: `${b.it.id}-typing.mov`, timeBase: 'seconds from the overlay start', bursts: list}, null, 2));
  }
  const todo = built.filter((b) => only.size === 0 || only.has(b.it.id));
  if (stills) {
    mkdirSync(join(OUT, 'stills'), {recursive: true});
    for (const b of todo) {
      const frame = Math.round(b.stillAt * 25);
      const p = Bun.spawnSync(['bunx', 'remotion', 'still', 'src/index.ts', b.it.comp, join(OUT, 'stills', `raw-${b.it.id}.png`), `--frame=${frame}`, '--log', 'error', `--props=${join(OUT, 'props', `${b.it.id}.props.json`)}`], {cwd: ROOT, stdout: 'inherit', stderr: 'inherit'});
      console.log(p.exitCode === 0 ? `still ${b.it.id} @${b.stillAt}s` : `FAIL still ${b.it.id}`);
    }
  }
  if (render) {
    for (const b of todo) {
      const file = join(OUT, b.it.placement === 'band' ? `${b.it.id}-typing.mov` : `${b.it.id}.mov`);
      const p = Bun.spawn(['bunx', 'remotion', 'render', 'src/index.ts', b.it.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', `--props=${join(OUT, 'props', `${b.it.id}.props.json`)}`], {cwd: ROOT, stdout: 'inherit', stderr: 'inherit'});
      const code = await p.exited;
      console.log(code === 0 && existsSync(file) ? `ok ${b.it.id}` : `FAIL ${b.it.id}`);
    }
  }
  const overlays = built.map((b) => ({id: b.it.id, srcStart: b.it.srcStart, srcEnd: b.it.srcEnd, words: b.it.words, outStart: b.outStart, dur: b.dur, duration: b.dur, file: `${b.it.id}.mov`, placement: b.it.placement, freezeSec: 0, sfx: [], accents: b.it.accents ?? [], stillAt: b.stillAt, source: b.it.source}));
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({video: '01-edited.mp4', cuts: cutsPath, fps: 25, width: 1920, height: 1080, timeBase: 'edited seconds for the cuts file, no freezes', layout: '21-layout-center.json (center placement needs its place.<host>.center entries)', band: {x: 24, y: 912, w: 1576, h: 140}, overlays}, null, 2));
  console.log(`manifest: ${join(OUT, 'manifest.json')}`);
}
