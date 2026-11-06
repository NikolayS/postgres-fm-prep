// Clear alpha inside a polygon, then feather the alpha 3x3 (2 passes) near its edge.
// bun poly-clear.ts in.png out.png "x,y x,y ..."
import { PNG } from "pngjs";
import fs from "fs";
const [inp, out, pts] = Bun.argv.slice(2);
const P = pts.trim().split(/\s+/).map((s) => s.split(",").map(Number));
const p = PNG.sync.read(fs.readFileSync(inp)), W = p.width, H = p.height, d = p.data;
const inside = (x: number, y: number) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const near = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x + 0.5, y + 0.5)) { d[(y * W + x) * 4 + 3] = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) near[yy * W + xx] = 1; } }
for (let pass = 0; pass < 2; pass++) {
  const a = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) a[i] = d[i * 4 + 3];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (near[y * W + x]) { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += a[(y + dy) * W + x + dx]; d[(y * W + x) * 4 + 3] = Math.round(s / 9); }
}
fs.writeFileSync(out, PNG.sync.write(p)); console.log("cleared polygon", pts);
