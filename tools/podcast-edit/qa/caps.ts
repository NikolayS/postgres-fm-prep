// Check caption safe areas and face collisions. Usage: await checkCaptions({ records, frames, faces }).
import { readdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseFaces } from "./eyes";
import { detectFaces } from "./util";
export type Box = [number, number, number, number];
export function growFace([x, y, w, h]: Box, pad = 10): Box {
  return [x - pad, y - 0.35 * h - pad, w + 2 * pad, 1.6 * h + 2 * pad];
}
export function captionViolations(frames: { frame: string; faces: Box[]; caps: Box[] }[], opts: { safeBottom?: number; pad?: number } = {}) {
  const safeBottom = opts.safeBottom ?? 900, violations: string[] = [];
  let faces = 0, framesWithoutFaces = 0;
  for (const f of frames) {
    faces += f.faces.length;
    if (!f.faces.length) framesWithoutFaces++;
    for (const c of f.caps) {
      if (c[1] < 0 || c[1] + c[3] > safeBottom) violations.push(`${f.frame}: caption ${JSON.stringify(c)} outside the safe area (ends below y ${safeBottom}; bottom 180 px)`);
      for (const b of f.faces) {
        const g = growFace(b, opts.pad);
        if (c[0] < g[0] + g[2] && g[0] < c[0] + c[2] && c[1] < g[1] + g[3] && g[1] < c[1] + c[3]) violations.push(`${f.frame}: caption ${JSON.stringify(c)} over face ${JSON.stringify(b)}`);
      }
    }
  }
  return { violations, frames: frames.length, faces, framesWithoutFaces };
}
export async function checkCaptions(cfg: { records: string; frames?: string; faces: string }): Promise<ReturnType<typeof captionViolations>> {
  const directory = (await stat(cfg.records)).isDirectory();
  const files = directory ? (await readdir(cfg.records)).filter(f => /^caps-.*\.jsonl$/.test(f)).sort().map(f => join(cfg.records, f)) : [cfg.records];
  const records: { frame: string; caps: Box[] }[] = [];
  for (const file of files) for (const line of (await Bun.file(file).text()).split(/\r?\n/).filter(l => l.trim())) {
    const r = JSON.parse(line);
    if (!r.frame && !Number.isInteger(r.i)) throw new Error(`Missing frame or numeric i in ${file}`);
    records.push({ frame: r.frame ?? join(cfg.frames ?? (directory ? cfg.records : dirname(cfg.records)), `${String(r.i).padStart(4, "0")}.jpg`), caps: r.caps });
  }
  if (!records.length) throw new Error("No caption records found");
  const detected = parseFaces(await detectFaces(cfg.faces, records.map(r => r.frame)));
  return captionViolations(records.map(r => {
    const faces = detected.get(r.frame);
    if (!faces) throw new Error(`No detector result for ${r.frame}`);
    return { ...r, faces: faces.map(f => f.box) };
  }));
}
