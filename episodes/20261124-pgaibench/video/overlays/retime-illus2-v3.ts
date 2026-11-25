// Re-time an illus-2 row for edit v3: map its v2 times (outStart, end, beats, accents) through the
// source timeline, render <id>-v3.mov, write parts/<id>.v3.json. Usage: bun retime-illus2-v3.ts <id>
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
const R = '/Users/nik/Documents/Zoom/2026-11-24 10.37.15 .fm recording/review';
const TOOL = `${R}/overlays/tool`, OUT = `${R}/overlays/out-v2`;
const {ROWS} = await import(`${TOOL}/scripts/items-illus2.ts`);
const segs = (f: string) => JSON.parse(readFileSync(f, 'utf8')).segmentTimes;
const B = segs(`${R}/v2-edit/pgfm198-edited.cuts.json`), N = segs(`${R}/pgfm198-edited.cuts.json`);
const toSrc = (t: number) => { for (const s of B) if (t >= s.outStart && t <= s.outEnd) return s.srcStart + t - s.outStart; throw new Error(String(t)); };
const toOut = (t: number) => { for (const s of N) { if (t < s.srcStart) return s.outStart; if (t <= s.srcEnd) return s.outStart + t - s.srcStart; } return N.at(-1).outEnd; };
const r2 = (x: number) => Math.round(x * 100) / 100;
const E = (t: number) => r2(toOut(toSrc(t)));
const id = process.argv[2];
const r = ROWS.find((x: any) => x.id === id);
const o = E(r.outStart), end = E(r.end), dur = r2(end - o);
const beats: Record<string, {at: number}> = {};
for (const [k, v] of Object.entries(r.beats ?? {})) beats[k] = {at: r2(E(v as number) - o)};
const acc = (r.accents ?? []).map((a: number) => r2(E(a) - o));
const file = `${id}-v3.mov`;
const p = Bun.spawnSync(['bunx', 'remotion', 'render', 'src/index.ts', r.comp, join(OUT, file), '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', `--props=${JSON.stringify({durationSec: dur, beats})}`], {cwd: TOOL});
if (p.exitCode || !existsSync(join(OUT, file))) { console.error(p.stderr.toString().slice(-1500)); process.exit(1); }
const sfx = [{file: 'sfx/center-in.wav', at: 0.05, gain: 1}, ...acc.map((a: number) => ({file: 'sfx/accent.wav', at: a, gain: 1})), {file: 'sfx/center-out.wav', at: r2(dur - 0.38), gain: 0.7}];
writeFileSync(join(OUT, 'parts', `${id}.v3.json`), JSON.stringify({id, row: r.row, file, outStart: o, dur, duration: dur, placement: r.placement, freezeSec: 0, sfx, accents: acc, words: `v3 times (re-timed by illus-1 from the v2 row through source time). ${r.words}`, source: r.source}, null, 2));
console.log('ok', id, o, dur, JSON.stringify(beats), acc);
