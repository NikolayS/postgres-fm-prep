// Fast preview without Chrome (canvas phases only; the sharp hold is DOM in Remotion):
// bun preview.ts A <t1,t2,...> [out-prefix] -> raw RGBA frames
import {buildSystem, drawFrame, makeBuffers, OPTS, W, H} from './proj/src/particles-engine';
import {scenes, VARIANTS} from './proj/src/plans';
const dir = import.meta.dir;
const v0 = VARIANTS[process.argv[2] as 'A' | 'B'];
const names = ['co', 'body', ...[v0.set1, 'F'].flatMap((s) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `${s}-${i}`))];
const im: Record<string, Uint8ClampedArray> = {};
for (const n of names) im[n] = new Uint8ClampedArray(await Bun.file(`${dir}/raw/${n}.rgba`).arrayBuffer());
const v = VARIANTS[process.argv[2] as 'A' | 'B'];
const sc = scenes(im, v.set1);
let t0 = performance.now();
const sys = [buildSystem(sc.co, sc.card1, v.phases[0]), buildSystem(sc.cardF, sc.body, v.phases[1])];
console.log('build ms', (performance.now() - t0).toFixed(0), 'n', sys.map((s) => s.n));
const buf = makeBuffers(), rgba = new Uint8ClampedArray(W * H * 4);
const ts = process.argv[3].split(',').map(Number);
const out = process.argv[4] ?? `${dir}/prev`;
for (const t of ts) {
  const s = t < v.phases[0].to ? sys[0] : sys[1];
  t0 = performance.now();
  const fl = drawFrame(s, t, buf, rgba, OPTS);
  const ms = performance.now() - t0;
  const f = `${out}-${t.toFixed(2)}.rgba`;
  await Bun.write(f, rgba);
  console.log(t, 'flying', fl, 'ms', ms.toFixed(0));
}
