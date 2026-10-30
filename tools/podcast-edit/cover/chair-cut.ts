// Remove a cool-grey chair sliver along the left contour of a cutout.
// bun chair-cut.ts in.png out.png y0 y1 xMax [maxRun]
// Per row: from the leftmost opaque pixel, clear alpha while the pixel is
// cool neutral grey (chair), stop at the first hair/skin/shirt pixel.
// Then feather alpha with a 3x3 box blur (2 passes) along the touched rows.
import { PNG } from "pngjs";
import fs from "fs";
const [inp, out] = [Bun.argv[2], Bun.argv[3]];
const y0 = Number(Bun.argv[4]), y1 = Number(Bun.argv[5]);
const xMax = Number(Bun.argv[6]), maxRun = Number(Bun.argv[7] ?? 40);
const p = PNG.sync.read(fs.readFileSync(inp));
const W = p.width, H = p.height, d = p.data;
const idx = (x: number, y: number) => (y * W + x) * 4;
const isChair = (i: number) => {
  const r = d[i], g = d[i + 1], b = d[i + 2];
  return Math.max(r, g, b) <= 120 && r <= g + 1 && b >= g - 3 && g - r <= 12 && b - r <= 16;
};
let cleared = 0;
const log: string[] = [];
for (let y = y0; y <= y1; y++) {
  let x = 0;
  while (x < xMax && d[idx(x, y) + 3] === 0) x++;
  const start = x;
  let n = 0;
  while (x < xMax && n < maxRun && isChair(idx(x, y))) { d[idx(x, y) + 3] = 0; x++; n++; }
  if (n) { cleared += n; log.push(`y=${y}: x${start}-${x - 1} (${n})`); }
}
// feather: 3x3 box blur on alpha, 2 passes, region x 0..xMax+8, y y0-4..y1+4
for (let pass = 0; pass < 2; pass++) {
  const a = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + 3];
  for (let y = Math.max(1, y0 - 4); y <= Math.min(H - 2, y1 + 4); y++)
    for (let x = 1; x <= Math.min(W - 2, xMax + 8); x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += a[(y + dy) * W + x + dx];
      d[idx(x, y) + 3] = Math.round(s / 9);
    }
}
fs.writeFileSync(out, PNG.sync.write(p));
console.log(log.join("\n"));
console.log(`cleared ${cleared} px`);
