// Check transparent strip bounds and extract inspection crops. Usage: await checkStripLayers({ items, out }).
import { mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import type { Box } from "./caps";
import { dimensions, ffmpeg, fileId } from "./util";
export function alphaBox(rgba: Uint8Array, w: number, h: number, minAlpha = 16): Box | null {
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || rgba.length !== w * h * 4) throw new Error("Invalid RGBA image dimensions or byte count");
  let left = w, top = h, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (rgba[(y * w + x) * 4 + 3] >= minAlpha) {
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? null : [left, top, right - left + 1, bottom - top + 1];
}
export function stripIssues(rgba: Uint8Array, w: number, h: number, opts: { safeBottom?: number; edge?: number; minAlpha?: number } = {}): string[] {
  const { safeBottom = 900, edge = 2, minAlpha = 16 } = opts;
  const box = alphaBox(rgba, w, h, minAlpha), issues: string[] = [];
  if (!box) return issues;
  const [x, y, bw, bh] = box;
  for (const [side, touches] of [["left", x < edge], ["right", x + bw > w - edge], ["top", y < edge], ["bottom", y + bh > h - edge]] as const) {
    if (touches) issues.push(`touches the ${side} edge of the frame (clipped?)`);
  }
  if (y + bh > safeBottom) issues.push(`ends at y ${y + bh}, below the safe line ${safeBottom} (bottom 180 px)`);
  return issues;
}
export async function readRgba(file: string): Promise<{ w: number; h: number; data: Uint8Array }> {
  const { w, h } = await dimensions(file);
  const data = await ffmpeg(["-noautorotate", "-i", file, "-map", "0:v:0", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"]);
  if (data.length !== w * h * 4) throw new Error(`Incomplete RGBA frame from ${file}`);
  return { w, h, data };
}
export async function zoomCrops(cfg: { video: string; out: string; items: { id: string; at: number; box: Box; times?: number[] }[]; scale?: number }): Promise<string[]> {
  await mkdir(cfg.out, { recursive: true });
  const { w, h } = await dimensions(cfg.video), scale = cfg.scale ?? 2;
  if (!Number.isFinite(scale) || scale <= 0) throw new Error("Crop scale must be positive");
  const files: string[] = [];
  for (const item of cfg.items) {
    const [x, y, bw, bh] = item.box;
    if (!item.box.every(Number.isFinite) || bw <= 0 || bh <= 0) throw new Error(`Invalid crop box for ${item.id}`);
    const left = Math.max(0, Math.floor(x - 24)), top = Math.max(0, Math.floor(y - 24));
    const right = Math.min(w, Math.ceil(x + bw + 24)), bottom = Math.min(h, Math.ceil(y + bh + 24));
    if (right <= left || bottom <= top) throw new Error(`Crop ${item.id} lies outside the frame`);
    const filter = `format=rgba,crop=${right - left}:${bottom - top}:${left}:${top},scale=${Math.max(1, Math.round((right - left) * scale))}:${Math.max(1, Math.round((bottom - top) * scale))}:flags=lanczos`;
    for (const t of item.times ?? [item.at + 0.15, item.at + 0.4, item.at + 1.5]) {
      if (!Number.isFinite(t) || t < 0) throw new Error(`Invalid crop time for ${item.id}`);
      const file = join(cfg.out, `${fileId(item.id)}-${t}.png`);
      await ffmpeg(["-ss", String(t), "-noautorotate", "-i", cfg.video, "-frames:v", "1", "-vf", filter, file]);
      files.push(file);
    }
  }
  return files;
}
export async function checkStripLayers(cfg: { items: { id: string; file: string; t?: number }[]; out: string; safeBottom?: number }) {
  await mkdir(cfg.out, { recursive: true });
  const rows: { id: string; issues: string[] }[] = [];
  for (const [i, item] of cfg.items.entries()) {
    let file = item.file;
    if (extname(file).toLowerCase() === ".mov") {
      const t = item.t ?? 1;
      if (!Number.isFinite(t) || t < 0) throw new Error(`Invalid strip time for ${item.id}`);
      file = join(cfg.out, `${i}-${fileId(item.id)}.png`);
      await ffmpeg(["-ss", String(t), "-noautorotate", "-i", item.file, "-frames:v", "1", "-vf", "format=rgba", "-c:v", "png", file]);
    }
    const { w, h, data } = await readRgba(file);
    rows.push({ id: item.id, issues: stripIssues(data, w, h, { safeBottom: cfg.safeBottom }) });
  }
  return { pass: rows.every(r => !r.issues.length), rows };
}
