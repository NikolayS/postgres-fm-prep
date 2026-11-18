// Render every overlay listed in scripts/items.ts as a ProRes 4444 alpha .mov and write
// the manifest that compose.ts reads. Usage: bun scripts/render-all.ts [id ...]
// Start from items.example.ts (one episode's list) and keep one items.ts per episode.
import {mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(ROOT, '../overlays');
mkdirSync(OUT, {recursive: true});

import {ITEMS} from './items';
import {gateCard} from '../../cards/gate';

const only = new Set(process.argv.slice(2));
const todo = ITEMS.filter((it) => only.size === 0 || only.has(it.id));
// Data cards (comp "chartcard", `card`: path to <episode>/cards/<id>.card.json): the card file is
// the props. Provenance gate: every number is recomputed from its raw file; any failure stops
// the whole render before anything is drawn.
const gateErrors: string[] = [];
for (const it of todo as any[]) {
  if (!it.card) continue;
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
  while (next < todo.length) {
    const it = todo[next++];
    const file = join(OUT, `${it.id}.mov`);
    const args = ['bunx', 'remotion', 'render', 'src/index.ts', it.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', `--props=${JSON.stringify({...it.props, durationSec: it.duration})}`];
    const p = Bun.spawn(args, {cwd: ROOT, stdout: 'pipe', stderr: 'pipe'});
    const code = await p.exited;
    const err = await new Response(p.stderr).text();
    if (code !== 0 || !existsSync(file)) {
      failed.push(it.id);
      console.error(`FAIL ${it.id}\n${err.slice(-1500)}`);
    } else console.log(`ok ${it.id}`);
  }
}
await Promise.all(Array.from({length: CONC}, worker));

mkdirSync(join(OUT, 'sfx'), {recursive: true});
for (const f of ['wind1.wav', 'wind2.wav', 'air.wav', 'thud1.wav', 'thud2.wav', 'thud3.wav', 'LICENSE.txt']) copyFileSync(join(ROOT, 'sfx', f), join(OUT, 'sfx', f));
const r2 = (x: number) => Math.round(x * 100) / 100;
const manifest = ITEMS.map((it) => ({id: it.id, outStart: it.outStart, duration: it.duration, dur: it.duration, file: `${it.id}.mov`, placement: it.placement, freezeSec: it.freezeSec, sfx: it.sfx.map((s) => ({...s, at: r2(s.at)})), source: it.source ?? null}));
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({video: 'video1876562600-edited.mp4', fps: 25, width: 1920, height: 1080, timeBase: 'edited.mp4 seconds, before intro and freeze shifts', band: {x: 24, y: 912, w: 1576, h: 140}, overlays: manifest}, null, 2));
console.log(`manifest: ${join(OUT, 'manifest.json')}; failed: ${failed.length ? failed.join(', ') : 'none'}`);
if (failed.length) process.exit(1);
