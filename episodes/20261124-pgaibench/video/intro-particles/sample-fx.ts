// Colour samples for the FX bursts (intro A v3): for every FX event, points [x, y, r, g, b] taken
// from the element it hits, in the frame where it is hit (a rejected thing: just before it breaks;
// an approved thing: just after it lands). bun sample-fx.ts <show-plain.mp4> -> public/pi3/fx-samples.json
import {$} from 'bun';
import {FX, SW_F, EX_F} from './src/show-timeline';
import {kt, FPS} from './src/beats';
import {mulberry32} from './src/particles-engine';

const W = 1920, H = 1080;
const video = process.argv[2];
const raw = async (file: string) => new Uint8Array(await Bun.file(file).arrayBuffer());
const frameOf = async (f: number) => {
  const p = `/tmp/fxs-${process.pid}-${f}.rgba`;
  const vf = `select=eq(n\\,${f})`;
  await $`ffmpeg -v error -y -i ${video} -vf ${vf} -frames:v 1 -pix_fmt rgba -f rawvideo ${p}`;
  const b = await raw(p); await $`rm -f ${p}`; return b;
};
const pi = 'public/pi3';
const LAYER: Record<string, string> = {band: 'L-band', title: 'L-title1', arm: 'L-arm', kirk: 'L-kirk', nik: 'L-nik'};
const out: Record<string, number[]> = {};
const FACE = new Set(['kirk', 'nik', 'bodykirk', 'bodynik']);
const frames = new Map<number, Uint8Array>();
for (const e of FX) {
  const ef = Math.round(kt(e.k) * FPS);
  let img: Uint8Array;
  if (e.id === 'co') img = await raw(`${pi}/co.rgba`);
  else if (LAYER[e.id]) img = await raw(`${pi}/${LAYER[e.id]}.rgba`);
  else if (e.id === 'detonate') img = await raw(`${pi}/ex.rgba`);
  else if (e.id.startsWith('body')) img = await raw(`${pi}/body.rgba`);
  else {
    const f = Math.min(EX_F - 1, Math.max(SW_F, e.kind === 'snap' ? ef + 6 : e.kind === 'shatter' ? ef - 1 : ef + 2));
    if (!frames.has(f)) frames.set(f, await frameOf(f));
    img = frames.get(f)!;
  }
  let hh = 7; for (const ch of e.id) hh = (hh * 31 + ch.charCodeAt(0)) | 0;
  const rnd = mulberry32(hh);
  const n = e.w * e.h > 1e6 ? 2400 : 700;
  const pts: number[] = [];
  for (let tries = 0; pts.length < n * 5 && tries < n * 400; tries++) {
    const x = Math.floor(e.x + rnd() * e.w), y = Math.floor(e.y + rnd() * e.h);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const p = (y * W + x) * 4;
    if (img[p + 3] < 128) continue; // layer images: only the element's own ink
    // host tiles: only their rim (the sparks never start on a face)
    if (FACE.has(e.id) && Math.min(x - e.x, e.x + e.w - x, y - e.y, e.y + e.h - y) > 12) continue;
    pts.push(x, y, img[p], img[p + 1], img[p + 2]);
  }
  out[e.id] = pts;
}
// the paper (for the self-approval jet): the Analyst's proposal just before the stamp condenses
{
  const f = Math.round(kt(20.2) * FPS), img = await frameOf(f), rnd = mulberry32(99), pts: number[] = [];
  for (let i = 0; i < 900; i++) { const x = Math.floor(845 + rnd() * 510), y = Math.floor(570 + rnd() * 310), p = (y * W + x) * 4; pts.push(x, y, img[p], img[p + 1], img[p + 2]); }
  out.paper_jet = pts;
}
await Bun.write(`${pi}/fx-samples.json`, JSON.stringify(out));
console.log(Object.entries(out).map(([k, v]) => `${k}:${v.length / 5}`).join(' '));
