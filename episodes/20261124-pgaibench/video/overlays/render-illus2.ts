// Render illus-2's rows (scripts/items-illus2.ts) as ProRes 4444 alpha .mov files into ../out-v2/
// and write one fragment per overlay to ../out-v2/parts/<id>.json (illus-1 merges the manifest).
// Sounds: center-in at 0.05 s, an accent at each `accents` time, center-out 0.38 s before the end.
//   bun scripts/render-illus2.ts [id ...]      STILLS=<dir> renders mid-beat PNG stills only
import {mkdirSync, writeFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {ROWS as ROWS_V2, ROWS_V3, ROWS_V4, ROWS_V5} from './items-illus2';

const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(process.env.OUT ?? resolve(ROOT, '../out-v2'));
mkdirSync(join(OUT, 'parts'), {recursive: true});
const r2 = (x: number) => Math.round(x * 100) / 100;
const V3 = process.argv.includes('--v3');
const ROWS = process.argv.includes('--v5') ? ROWS_V5 : process.argv.includes('--v4') ? ROWS_V4 : V3 ? ROWS_V3 : ROWS_V2;
const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--v')));
const todo = ROWS.filter((r) => only.size === 0 || only.has(r.id));

const propsOf = (r: (typeof ROWS)[number]) => {
  const dur = r2(r.end - r.outStart);
  const beats: Record<string, {at: number}> = {};
  for (const [k, v] of Object.entries(r.beats ?? {})) beats[k] = {at: r2(v - r.outStart)};
  return {dur, props: {durationSec: dur, beats}};
};

let next = 0;
const failed: string[] = [];
async function worker() {
  while (next < todo.length) {
    const r = todo[next++];
    const {dur, props} = propsOf(r);
    const file = join(OUT, `${r.id}.mov`);
    const p = Bun.spawn(['bunx', 'remotion', 'render', 'src/index.ts', r.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', `--props=${JSON.stringify(props)}`], {cwd: ROOT, stdout: 'pipe', stderr: 'pipe'});
    const code = await p.exited;
    if (code !== 0 || !existsSync(file)) {
      failed.push(r.id);
      console.error(`FAIL ${r.id}\n${(await new Response(p.stderr).text()).slice(-1500)}`);
      continue;
    }
    const sfx = [
      {file: 'sfx/center-in.wav', at: 0.05, gain: 1},
      ...(r.accents ?? []).map((a) => ({file: 'sfx/accent.wav', at: r2(a - r.outStart), gain: 1})),
      {file: 'sfx/center-out.wav', at: r2(dur - 0.38), gain: 0.7},
    ];
    writeFileSync(join(OUT, 'parts', r.part ?? `${r.id}.json`), JSON.stringify({id: r.id, row: r.row, file: `${r.id}.mov`, outStart: r.outStart, dur, duration: dur, placement: r.placement, freezeSec: 0, sfx, words: r.words, source: r.source}, null, 2));
    console.log(`ok ${r.id} ${r.outStart} ${dur}`);
  }
}
await Promise.all(Array.from({length: Number(process.env.CONC ?? 3)}, worker));
console.log(`failed: ${failed.length ? failed.join(', ') : 'none'}`);
if (failed.length) process.exit(1);
