// Checks that no caption covers a face: runs Apple Vision (faces.swift, compiled) on every rendered
// frame that has a caption and tests each face box (grown 10 px; up 35% for the forehead, down 25%
// for the mouth and beard) against the caption boxes that v8.ts logged (caps-*.jsonl).
// Usage: bun check-caps.ts <frames dir> <faces binary>     exit 1 on any overlap
import { join } from "path";
import { readdirSync } from "fs";
const [dir, bin] = Bun.argv.slice(2);
const recs = readdirSync(dir).filter((f) => /^caps-.*\.jsonl$/.test(f)).flatMap((f) => require("fs").readFileSync(join(dir, f), "utf8").trim().split("\n").map((l: string) => JSON.parse(l)));
const paths = recs.map((r) => join(dir, String(r.i).padStart(4, "0") + ".jpg"));
const p = Bun.spawnSync([bin], { stdin: new TextEncoder().encode(paths.join("\n") + "\n") });
const faces = new Map<string, number[][]>(p.stdout.toString().trim().split("\n").map((l) => { const o = JSON.parse(l); return [o.f, o.b]; }));
if (p.exitCode !== 0 || !recs.length) throw new Error("Detector failed or no caption records");
let bad = 0, nf = 0, missing = 0;
for (const r of recs) {
  const fb = faces.get(join(dir, String(r.i).padStart(4, "0") + ".jpg")) ?? []; nf += fb.length; if (!fb.length) missing++;
  for (const c of r.caps) if (c[1] < 0 || c[1] + c[3] > 900) { bad++; console.log(`caption outside safe area: ${r.i}`); }
  for (const [x, y, w, h] of fb) {
    const g = [x - 10, y - 0.35 * h - 10, w + 20, h * 1.6 + 20];
    for (const c of r.caps) if (c[0] < g[0] + g[2] && g[0] < c[0] + c[2] && c[1] < g[1] + g[3] && g[1] < c[1] + c[3]) { bad++; console.log(`overlap: frame ${r.i} (montage ${r.m} s, ${r.src}) face ${[x, y, w, h]} caption ${c.map(Math.round)}`); }
  }
}
console.log(`${recs.length} caption frames, ${nf} faces found, ${bad} violations, ${missing} frames without detections`); process.exit(bad ? 1 : 0);
