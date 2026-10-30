// Find Zoom gallery tiles and layout changes in a recording.
//
//   bun detect-tiles.ts <video> [--every 10] [--out tiles.json] [--names robot,nik,kirk]
//
// Samples one gray frame every N seconds, marks non-black blocks (Zoom paints the
// background pure black), groups frames with the same block pattern into layout
// segments, and measures exact tile rectangles at full resolution for each segment.
// Touching tiles are split by the Zoom tile aspect (16:9). Names are assigned in
// reading order (top-left first); check them and edit the JSON when needed.
import { $ } from "bun";

export type Rect = { x: number; y: number; w: number; h: number };


const SW = 480, SH = 270, BLOCK = 6; // sample size and block size for the layout signature
const BLACK = 2; // Zoom background is 0; dark video content is still >= 8

async function probe(video: string) {
  const out = await $`ffprobe -v error -select_streams v:0 -show_entries stream=width,height:format=duration -of json ${video}`.json();
  return { w: out.streams[0].width as number, h: out.streams[0].height as number, duration: Number(out.format.duration) };
}

// Block signature: one bit per BLOCK x BLOCK cell, set when most of the cell is non-black.
function signature(f: Uint8Array): Uint8Array {
  const gw = SW / BLOCK, gh = SH / BLOCK;
  const sig = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++)
    for (let gx = 0; gx < gw; gx++) {
      let on = 0;
      for (let y = gy * BLOCK; y < (gy + 1) * BLOCK; y++)
        for (let x = gx * BLOCK; x < (gx + 1) * BLOCK; x++) if (f[y * SW + x] > BLACK) on++;
      sig[gy * gw + gx] = on * 2 > BLOCK * BLOCK ? 1 : 0;
    }
  return sig;
}

const diff = (a: Uint8Array, b: Uint8Array) => a.reduce((n, v, i) => n + (v !== b[i] ? 1 : 0), 0) / a.length;

// Non-black mask with small holes closed (dilate, then erode, by r px). A dark room in a
// camera tile has many pure-black pixels; Zoom's background is black in large areas only.
function closedMask(f: Uint8Array, W: number, H: number, r = 8): Uint8Array {
  let m = new Uint8Array(W * H);
  for (let i = 0; i < m.length; i++) m[i] = f[i] > 0 ? 1 : 0;
  const pass = (src: Uint8Array, horiz: boolean, dilate: boolean) => {
    const out = new Uint8Array(W * H);
    const [n, len, stride, step] = horiz ? [H, W, W, 1] : [W, H, 1, W];
    for (let a = 0; a < n; a++) {
      const base = a * stride;
      // Running count of set pixels in the window [i - r, i + r]; edges count as background.
      let cnt = 0;
      for (let j = 0; j <= r && j < len; j++) cnt += src[base + j * step];
      for (let i = 0; i < len; i++) {
        const win = Math.min(len - 1, i + r) - Math.max(0, i - r) + 1;
        out[base + i * step] = dilate ? (cnt > 0 ? 1 : 0) : cnt === win ? 1 : 0;
        if (i + r + 1 < len) cnt += src[base + (i + r + 1) * step];
        if (i - r >= 0) cnt -= src[base + (i - r) * step];
      }
    }
    return out;
  };
  m = pass(pass(m, true, true), false, true);
  return pass(pass(m, true, false), false, false);
}

// Tile rectangles in one full-resolution gray frame. Zoom puts the tiles of one row
// edge to edge and separates rows with a thin dark (not black) band, so: find row
// bands by the non-black extent of each pixel row, then split each band into 16:9 tiles.
export function tilesInFrame(f: Uint8Array, W: number, H: number): Rect[] {
  const m = closedMask(f, W, H);
  const extent = (y: number): [number, number] | null => {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (m[y * W + x]) { if (l < 0) l = x; r = x; }
    return l < 0 || r - l < W * 0.05 ? null : [l, r + 1];
  };
  const bands: { l: number; r: number; y0: number; y1: number }[] = [];
  for (let y = 0; y < H; y++) {
    const e = extent(y);
    const b = bands.at(-1);
    if (e && b && b.y1 === y && Math.abs(e[0] - b.l) <= 24 && Math.abs(e[1] - b.r) <= 24) b.y1 = y + 1;
    else if (e) bands.push({ l: e[0], r: e[1], y0: y, y1: y + 1 });
  }
  const out: Rect[] = [];
  for (const b of bands) {
    const w = b.r - b.l, h = b.y1 - b.y0;
    if (h < H * 0.1) continue; // separators, name labels
    // Dark content at a tile edge can move the extent a little: the band keeps its first edges.
    const cols = Math.max(1, Math.round(w / (h * 16 / 9)));
    const rows = Math.max(1, Math.round(h / ((w / cols) * 9 / 16)));
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        out.push({ x: Math.round(b.l + (i * w) / cols), y: Math.round(b.y0 + (j * h) / rows), w: Math.round(w / cols), h: Math.round(h / rows) });
  }
  return out;
}

async function frameAt(video: string, t: number, w: number, h: number): Promise<Uint8Array> {
  const buf = await $`ffmpeg -v error -ss ${t} -i ${video} -frames:v 1 -f rawvideo -pix_fmt gray -`.arrayBuffer();
  if (buf.byteLength !== w * h) throw new Error(`frame at ${t}: got ${buf.byteLength} bytes`);
  return new Uint8Array(buf);
}

// Small gray frames [start, start + dur) at `fps`.
async function sample(video: string, start: number, dur: number | null, fps: number): Promise<Uint8Array[]> {
  const t = dur === null ? [] : ["-ss", String(start), "-t", String(dur)];
  const raw = new Uint8Array(await $`ffmpeg -v error ${t} -i ${video} -vf fps=${fps},scale=${SW}:${SH}:flags=area -f rawvideo -pix_fmt gray -`.arrayBuffer());
  const out: Uint8Array[] = [];
  for (let i = 0; (i + 1) * SW * SH <= raw.length; i++) out.push(raw.subarray(i * SW * SH, (i + 1) * SW * SH));
  return out;
}

export type Layout = { id: string; tiles: Record<string, Rect> };
export type Interval = { start: number; end: number; layout: string };
export type Detection = { video: string; width: number; height: number; every: number; layouts: Layout[]; intervals: Interval[] };

// 1. One sample every `every` s; runs of 2+ equal samples are stable layouts, single
//    odd samples are transitions (Zoom reflow animations, window resizes).
// 2. Between stable runs, every frame (25 fps) goes to the nearest stable layout, so
//    flips back and forth are found to the frame.
// 3. Tile rectangles are measured on one full-resolution frame of each distinct layout.
export async function detect(video: string, every = 10, names: string[] = [], maxDiff = 0.03): Promise<Detection> {
  const { w, h, duration } = await probe(video);
  const fps = 25;
  const groups: { start: number; last: number; sig: Uint8Array; frames: number }[] = [];
  (await sample(video, 0, null, 1 / every)).forEach((f, i) => {
    const sig = signature(f), t = i * every, g = groups.at(-1);
    if (g && diff(g.sig, sig) <= maxDiff) (g.last = t), g.frames++;
    else groups.push({ start: t, last: t, sig, frames: 1 });
  });
  let stable = groups.filter((g) => g.frames >= 2);
  if (!stable.length) stable = groups;
  // Distinct layouts: stable runs with the same signature share one layout.
  const kinds: { sig: Uint8Array; at: number; len: number }[] = [];
  const kindOf = stable.map((g) => {
    let k = kinds.findIndex((x) => diff(x.sig, g.sig) <= maxDiff);
    if (k < 0) k = kinds.push({ sig: g.sig, at: 0, len: 0 }) - 1;
    if (g.last - g.start >= kinds[k].len) (kinds[k].len = g.last - g.start), (kinds[k].at = (g.start + g.last) / 2 + 0.5);
    return k;
  });
  // Frame-level runs: stable spans as they are, each gap between them classified per frame.
  const frames: number[] = []; // layout index per output frame
  const fill = (from: number, to: number, k: number) => { for (let i = Math.round(from * fps); i < Math.min(Math.round(to * fps), Math.ceil(duration * fps)); i++) frames[i] = k; };
  for (let s = 0; s < stable.length; s++) {
    const g = stable[s];
    const lastRun = s === stable.length - 1;
    fill(s === 0 ? 0 : g.start, lastRun ? duration : g.last, kindOf[s]);
    if (lastRun) break;
    const from = g.last, to = stable[s + 1].start;
    const fr = await sample(video, from, to - from, fps);
    fr.forEach((f, i) => {
      const sig = signature(f);
      let best = 0, bestD = Infinity;
      kinds.forEach((k, j) => { const d = diff(k.sig, sig); if (d < bestD) (bestD = d), (best = j); });
      frames[Math.round(from * fps) + i] = best;
    });
  }
  const intervals: Interval[] = [];
  for (let i = 0; i < frames.length; i++) {
    const id = `L${(frames[i] ?? 0) + 1}`, last = intervals.at(-1);
    if (last && last.layout === id) last.end = (i + 1) / fps;
    else intervals.push({ start: i / fps, end: (i + 1) / fps, layout: id });
  }
  const layouts: Layout[] = [];
  for (const [k, kind] of kinds.entries()) {
    const rects = tilesInFrame(await frameAt(video, kind.at, w, h), w, h);
    layouts.push({ id: `L${k + 1}`, tiles: Object.fromEntries(rects.map((r, i) => [names[i] ?? `tile${i}`, r])) });
  }
  return { video, width: w, height: h, every, layouts, intervals };
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const video = args[0];
  if (!video) { console.error("usage: bun detect-tiles.ts <video> [--every 10] [--out tiles.json] [--names a,b,c]"); process.exit(2); }
  const res = await detect(video, Number(flag("--every") ?? 10), flag("--names")?.split(",") ?? []);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(2).padStart(5, "0")}`;
  for (const l of res.layouts) console.log(`${l.id}: ${Object.entries(l.tiles).map(([n, r]) => `${n}=${r.x},${r.y} ${r.w}x${r.h}`).join("  ")}`);
  for (const i of res.intervals) console.log(`  ${fmt(i.start)}-${fmt(i.end)} ${i.layout}`);
  const out = flag("--out");
  if (out) await Bun.write(out, JSON.stringify(res, null, 2));
}
