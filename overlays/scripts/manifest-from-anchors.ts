// Build the compose manifest for any edit from source-time anchors.
//   bun scripts/manifest-v3.ts <cuts.json> <out manifest.json>
// Inputs: ../out/manifest-v2-src-anchors.json (the 26 v2 entries with srcStart/srcEnd) and
// ../out/blocks-v3.manifest.json (run blocks-v3.ts with the SAME cuts file first).
// Rules (Nik, 2026-10-22): no freezes anywhere; v3 blocks replace the entries they name.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {toEdited} from './blocks.example';

const ROOT = resolve(import.meta.dir, '..');
const V2 = resolve(ROOT, '../../podcast-overlays/overlays');
const V3 = resolve(ROOT, '../overlays');
const [cutsPath, outPath] = Bun.argv.slice(2);
if (!outPath) { console.error('usage: bun scripts/manifest-v3.ts <cuts.json> <out manifest.json>'); process.exit(2); }
const segs = JSON.parse(readFileSync(cutsPath, 'utf8')).segmentTimes;
const blocks = JSON.parse(readFileSync(resolve(ROOT, '../out/blocks-v3.manifest.json'), 'utf8'));
if (resolve(blocks.cuts) !== resolve(cutsPath)) { console.error(`blocks-v3.manifest.json was built for ${blocks.cuts}; rerun blocks-v3.ts with ${cutsPath}`); process.exit(1); }
const v2 = JSON.parse(readFileSync(resolve(ROOT, '../out/manifest-v2-src-anchors.json'), 'utf8')).overlays;
const replaced = new Set(blocks.overlays.flatMap((b: {replaces: string[]}) => b.replaces));
const r2 = (x: number) => Math.round(x * 100) / 100;
// Nik, 2026-10-22: the v2 guest intro and hacking insert were perfect; move them only. Same .mov, props,
// SFX and freeze as v2; new source anchors: right after Kirk's "Hey, Nik." (ends 20.32) and "Yep." (ends 46.16).
const REPOSITION: Record<string, number> = {'01-kirk-intro': 20.32, '02-hacking-sessions': 46.16};

const abs = (dir: string, o: {file: string; sfx: {file: string}[]}) => ({...o, file: resolve(dir, o.file), sfx: o.sfx.map((s) => ({...s, file: resolve(dir, s.file)}))});
const kept = v2.filter((o: {id: string}) => !replaced.has(o.id)).map((o: any) => {
  const srcStart = REPOSITION[o.id] ?? o.srcStart;
  const outStart = r2(toEdited(segs, srcStart));
  const {nearWords, ...rest} = o;
  // Keep the v2 rendered duration: the .mov length is fixed until re-rendered. Freezes only on the repositioned v2 cards.
  return abs(V2, {...rest, srcStart, outStart, freezeSec: o.id in REPOSITION ? o.freezeSec : 0});
});
const added = blocks.overlays.map((o: any) => abs(V3, o));
const all = [...kept, ...added].sort((a, b) => a.outStart - b.outStart);
for (let i = 1; i < all.length; i++) {
  const p = all[i - 1], q = all[i];
  if (p.outStart + p.dur > q.outStart) console.warn(`overlap: ${p.id} ends ${r2(p.outStart + p.dur)} > ${q.id} starts ${q.outStart}`);
}
writeFileSync(outPath, JSON.stringify({video: 'edited (see cuts)', cuts: cutsPath, fps: 25, width: 1920, height: 1080, timeBase: 'edited seconds for the cuts file, no freezes', band: {x: 24, y: 912, w: 1576, h: 140}, overlays: all}, null, 2));
console.log(`${all.length} overlays -> ${outPath}`);
