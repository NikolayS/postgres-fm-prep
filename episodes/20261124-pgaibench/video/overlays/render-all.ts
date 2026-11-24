// Render every overlay listed in scripts/items.ts as a ProRes 4444 alpha .mov and write
// the manifest that compose.ts reads. Usage: bun scripts/render-all.ts [id ...]
// Start from items.example.ts (one episode's list) and keep one items.ts per episode.
import {mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(process.env.OUT ?? resolve(ROOT, '../overlays'));
mkdirSync(OUT, {recursive: true});

import {ITEMS} from './items';

const only = new Set(process.argv.slice(2));
const todo = ITEMS.filter((it) => only.size === 0 || only.has(it.id));
// ep198: band items with `typing` also get <id>-typing.mov (props.typing true) and <id>-typing-bursts.json.
import {band198Plan} from '../src/Ep198';
type Job = {name: string; it: (typeof ITEMS)[number]; props: Record<string, unknown>};
const jobs: Job[] = todo.flatMap((it: any) => it.typing ? [{name: it.id, it, props: {...it.props, typing: false}}, {name: `${it.id}-typing`, it, props: {...it.props, typing: true}}] : [{name: it.id, it, props: it.props}]);
const r3 = (x: number) => Math.round(x * 1000) / 1000;
for (const it of todo as any[]) if (it.typing) {
  const pl = band198Plan(it.props);
  const bursts = pl.flatMap((l, i) => l.bs.map((b) => ({start: r3(b.start), end: r3(b.end), chars: b.chars, line: i})));
  writeFileSync(join(OUT, `${it.id}-typing-bursts.json`), JSON.stringify({overlay: `${it.id}-typing.mov`, timeBase: 'seconds from the overlay start', bursts}, null, 2));
}
// Data cards (comp "chartcard", `card`: path to <episode>/cards/<id>.card.json): the card file is
// the props. Provenance gate: every number is recomputed from its raw file; any failure stops
// the whole render before anything is drawn.
const gateErrors: string[] = [];
for (const it of todo as any[]) {
  if (!it.card) continue;
  const {gateCard} = await import(process.env.GATE ?? '../../cards/gate');
  const g = await gateCard(it.card);
  if (g.errors.length) gateErrors.push(...g.errors);
  else it.props = {...g.props, ...(it.props ?? {})};
}
if (gateErrors.length) {
  console.error(`card gate failed, nothing rendered:\n${gateErrors.map((e) => `  ${e}`).join('\n')}`);
  process.exit(1);
}
// DUMP_PROPS=<dir>: write <id>.props.json for the selected items and stop (for `remotion still` QA).
if (process.env.DUMP_PROPS) {
  mkdirSync(process.env.DUMP_PROPS, {recursive: true});
  for (const it of todo) writeFileSync(join(process.env.DUMP_PROPS, `${it.id}.props.json`), JSON.stringify({...it.props, durationSec: it.duration}));
  process.exit(0);
}
const CONC = 3;
let next = 0;
const failed: string[] = [];
async function worker() {
  while (next < jobs.length) {
    const {name, it, props} = jobs[next++];
    const file = join(OUT, `${name}.mov`);
    const args = ['bunx', 'remotion', 'render', 'src/index.ts', it.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', `--props=${JSON.stringify({...props, durationSec: it.duration})}`];
    const p = Bun.spawn(args, {cwd: ROOT, stdout: 'pipe', stderr: 'pipe'});
    const code = await p.exited;
    const err = await new Response(p.stderr).text();
    if (code !== 0 || !existsSync(file)) {
      failed.push(name);
      console.error(`FAIL ${name}\n${err.slice(-1500)}`);
    } else console.log(`ok ${name}`);
  }
}
await Promise.all(Array.from({length: CONC}, worker));

const r2 = (x: number) => Math.round(x * 100) / 100;
const manifest = ITEMS.map((it) => ({id: it.id, outStart: it.outStart, duration: it.duration, dur: it.duration, file: `${it.id}.mov`, placement: it.placement, freezeSec: it.freezeSec, sfx: it.sfx.map((s) => ({...s, at: r2(s.at)})), source: it.source ?? null, srcStart: (it as any).srcStart, srcEnd: (it as any).srcEnd, words: (it as any).words, ...((it as any).vetoable ? {vetoable: (it as any).vetoable} : {})}));
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({video: 'pgfm198-edited.mp4', fps: 25, width: 1920, height: 1080, timeBase: 'edited.mp4 seconds, before intro and freeze shifts', band: {x: 120, y: 744, w: 1480, h: 144}, layout: 'center placement: hosts move to place.<host>.center (right column, x 1630) in layout.json', overlays: manifest}, null, 2));
console.log(`manifest: ${join(OUT, 'manifest.json')}; failed: ${failed.length ? failed.join(', ') : 'none'}`);
if (failed.length) process.exit(1);
