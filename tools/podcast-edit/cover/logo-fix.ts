// Remove the orange chair logo that the cutout keeps next to Nik's head.
// Pass 1: saturated orange pixels near the cutout edge -> transparent (skin is never
// that saturated; b/g guard keeps lips and shadows). Pass 2: keep only the largest
// connected opaque region, so the white letters of the logo and any stray specks go.
// usage: bun logo-fix.ts cutout.png out.png
import { PNG } from "pngjs";
const [inp, out] = Bun.argv.slice(2);
const img = PNG.sync.read(Buffer.from(await Bun.file(inp).arrayBuffer()));
const { width: W, height: H, data: D } = img;
const A = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : D[(y * W + x) * 4 + 3];
const nearEdge = (x: number, y: number, r: number) => {
  for (let dy = -r; dy <= r; dy += 4) for (let dx = -r; dx <= r; dx += 4) if (A(x + dx, y + dy) < 20) return true;
  return false;
};
let n1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4; if (D[i + 3] === 0) continue;
  const [r, g, b] = [D[i], D[i + 1], D[i + 2]];
  const orange = r > 90 && r >= g && g >= b && (r - b) / r > 0.45 && b / g < 0.72;
  if (orange && nearEdge(x, y, 24)) { D[i + 3] = 0; n1++; }
}
// connected components over alpha > 30 (4-neighbour flood fill)
const label = new Int32Array(W * H).fill(-1);
const sizes: number[] = [];
const stack: number[] = [];
for (let s = 0; s < W * H; s++) {
  if (label[s] !== -1 || D[s * 4 + 3] <= 30) continue;
  const id = sizes.length; sizes.push(0); label[s] = id; stack.push(s);
  while (stack.length) {
    const p = stack.pop()!; sizes[id]++;
    const x = p % W, y = (p - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const q = yy * W + xx; if (label[q] === -1 && D[q * 4 + 3] > 30) { label[q] = id; stack.push(q); }
    }
  }
}
const main = sizes.indexOf(Math.max(...sizes));
let n2 = 0;
for (let p = 0; p < W * H; p++) if (D[p * 4 + 3] > 0 && label[p] !== main) { D[p * 4 + 3] = 0; n2++; }
await Bun.write(out, PNG.sync.write(img));
console.log(`logo-fix: orange ${n1} px, dropped ${sizes.length - 1} islands (${n2} px) -> ${out}`);
