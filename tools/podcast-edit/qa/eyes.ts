// Inspect eye opening on selected images. Usage: await checkEyes({ faces, out, frames }).
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Box } from "./caps";
import { detectFaces, ffmpeg, fileId } from "./util";
export type Face = { box: Box; pupils?: number[]; eyes: [number, number] };
export function parseFaces(jsonl: string): Map<string, Face[]> {
  return new Map(jsonl.split(/\r?\n/).filter(l => l.trim()).map(line => {
    const r = JSON.parse(line);
    return [r.f, r.faces];
  }));
}
export function eyesVerdict(faces: Face[], opts: { minRatio?: number; expectFaces?: number } = {}): { pass: boolean; closed: number[]; reason?: string } {
  const { minRatio = 0.2, expectFaces = 1 } = opts;
  const closed = faces.flatMap((f, i) => !f.eyes || f.eyes.length !== 2 || f.eyes.some(e => !Number.isFinite(e) || e < 0 || e < minRatio) ? [i] : []);
  if (faces.length < expectFaces) return { pass: false, closed, reason: `found ${faces.length} faces, expected ${expectFaces}` };
  if (closed.length) return { pass: false, closed, reason: `closed or missing eyes on faces ${closed.join(", ")}` };
  return { pass: true, closed };
}
export async function checkEyes(cfg: { faces: string; out: string; frames: { label: string; image?: string; video?: string; t?: number; expectFaces?: number }[]; minRatio?: number }) {
  await mkdir(cfg.out, { recursive: true });
  const files: string[] = [];
  for (const [i, frame] of cfg.frames.entries()) {
    if (frame.image) files.push(frame.image);
    else {
      if (!frame.video || frame.t === undefined || !Number.isFinite(frame.t) || frame.t < 0) throw new Error(`Missing image or video time for ${frame.label}`);
      const file = join(cfg.out, `${i}-${fileId(frame.label)}.png`);
      await ffmpeg(["-ss", String(frame.t), "-i", frame.video, "-frames:v", "1", file]);
      files.push(file);
    }
  }
  const detected = files.length ? parseFaces(await detectFaces(cfg.faces, files)) : new Map<string, Face[]>();
  const rows = cfg.frames.map((frame, i) => {
    const faces = detected.get(files[i]);
    if (!faces) throw new Error(`No detector result for ${files[i]}`);
    return { label: frame.label, file: files[i], faces: faces.length, ...eyesVerdict(faces, { minRatio: cfg.minRatio, expectFaces: frame.expectFaces }) };
  });
  return { pass: rows.every(r => r.pass), rows };
}
