// Count orange wall-logo pixels in a ring just outside the face box of a tile frame.
// usage: bun orange-check.ts picks.json   -> prints class, t, orange count; writes picks-clean.json
import { PNG } from "pngjs";
const picks = JSON.parse(await Bun.file(Bun.argv[2]).text());
const out: Record<string, any[]> = {};
for (const [cls, arr] of Object.entries(picks) as [string, any[]][]) {
  out[cls] = [];
  for (const p of arr) {
    const img = PNG.sync.read(Buffer.from(await Bun.file(p.file).arrayBuffer()));
    const { width: W, height: H, data: D } = img;
    const fw = p.faceH, fh = p.faceH;             // Vision box is square-ish; use height
    const x0 = p.faceX - fw / 2, x1 = p.faceX + fw / 2, y0 = p.faceY - fh / 2, y1 = p.faceY + fh / 2;
    let n = 0;
    for (let y = Math.max(0, y0 - 40); y < Math.min(H, y1 + 40); y++) for (let x = Math.max(0, x0 - 40); x < Math.min(W, x1 + 40); x++) {
      const inside = x >= x0 - 2 && x <= x1 + 2 && y >= y0 - 2 && y <= y1 + 2;   // ring = within 40 px of the box, outside it slightly shrunk
      const i = (y * W + x) * 4; const [r, g, b] = [D[i], D[i + 1], D[i + 2]];
      const orange = r > 90 && r >= g && g >= b && (r - b) / r > 0.45 && b / g < 0.7;
      if (orange && !inside) n++;
      if (orange && inside && (x < x0 + fw * 0.25)) n++;   // logo peeking at the left edge of the box (glasses hinge)
    }
    out[cls].push({ ...p, orange: n });
    console.log(`${cls}\tt=${p.t}\torange=${n}`);
  }
  out[cls].sort((a, b) => (a.orange > 25 ? 1 : 0) - (b.orange > 25 ? 1 : 0));   // clean first, keep intensity order within
}
await Bun.write(Bun.argv[2].replace(".json", "-clean.json"), JSON.stringify(out, null, 1));
