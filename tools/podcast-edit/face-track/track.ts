// Smooth face track for one Zoom tile -> layout.ts "track" JSON {w, h, path: [[t, x, y], ...]}.
//
//   bun track.ts <faces.jsonl> <out.json> [--tile 1024x576] [--det 512x288] [--every 1]
//        [--place 608x456] [--crop-h 526] [--face-y 0.55] [--trim 0.012,0.072,0.008,0.008]
//        [--dead 45x30] [--omega 2.2] [--median 3] [--fps 25]
//
// faces.jsonl: faces.swift output for frames of ONE tile, one frame every --every s of the
// edited video, named with the frame number (f00001.jpg = t 0). Per frame: the largest face
// with confidence > 0.5 and width > 8% of the frame. The face centre is a median over
// +-median samples (no face: the last centre). The crop (--crop-h high, --place aspect, even
// sizes) puts the face centre at --face-y of its height and stays inside the tile minus
// --trim (top, bottom, left, right fractions: the layout "crop", e.g. the Zoom name label).
// Camera: the goal moves only past a dead zone (--dead px), and a critically damped spring
// (--omega rad/s) follows it, so the crop glides and does not jitter. Points are written only
// when the rounded position changes. All positions are tile pixels; t is edited seconds.
import { readFileSync, writeFileSync } from "fs";

export type Opts = {
  tile: [number, number]; det: [number, number]; every: number; place: [number, number]; cropH: number; faceY: number;
  trim: [number, number, number, number]; dead: [number, number]; omega: number; median: number; fps: number;
};
export const DEFAULTS: Opts = {
  tile: [1024, 576], det: [512, 288], every: 1, place: [608, 456], cropH: 526, faceY: 0.55,
  trim: [0.012, 0.072, 0.008, 0.008], dead: [45, 30], omega: 2.2, median: 3, fps: 25,
};

// Python-style round (half to even), so results match the first version (track.py).
const pyRound = (x: number) => { const r = Math.round(x); return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r; };
const median = (v: number[]) => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function track(lines: string[], o: Opts = DEFAULTS) {
  const [TW, TH] = o.tile, SC = TW / o.det[0];
  const X0 = pyRound(TW * o.trim[2]), X1 = TW - pyRound(TW * o.trim[3]);
  const Y0 = pyRound(TH * o.trim[0]), Y1 = Math.floor(TH * (1 - o.trim[1]));
  const W = Math.floor(pyRound((o.cropH * o.place[0]) / o.place[1]) / 2) * 2, H = Math.floor(o.cropH / 2) * 2;
  const raw: ([number, number] | null)[] = [];
  for (const l of lines) {
    if (!l.trim()) continue;
    const f = JSON.parse(l) as { f: string; faces: number[][] };
    const i = Number(f.f.match(/\d+/)![0]) - 1;
    const fs = f.faces.filter((x) => x[4] > 0.5 && x[2] > 0.08);
    const best = fs.length ? fs.reduce((a, b) => (b[2] * b[3] > a[2] * a[3] ? b : a)) : null;
    raw[i] = best ? [(best[0] + best[2] / 2) * o.det[0] * SC, (best[1] + best[3] / 2) * o.det[1] * SC] : null;
  }
  for (let j = 0; j < raw.length; j++) raw[j] ??= null;
  const tx: number[] = [], ty: number[] = [];
  let lx = TW / 2, ly = TH * 0.6;
  for (let j = 0; j < raw.length; j++) {
    const win = raw.slice(Math.max(0, j - o.median), j + o.median + 1).filter((v): v is [number, number] => v !== null);
    if (win.length) { lx = median(win.map((v) => v[0])); ly = median(win.map((v) => v[1])); }
    tx.push(Math.min(Math.max(lx - W / 2, X0), X1 - W));
    ty.push(Math.min(Math.max(ly - o.faceY * H, Y0), Y1 - H));
  }
  const dt = 1 / o.fps, OM = o.omega;
  let cx = tx[0], cy = ty[0], gx = cx, gy = cy, vx = 0, vy = 0, last = "";
  const path: [number, number, number][] = [];
  for (let fr = 0; fr < raw.length * o.every * o.fps; fr++) {
    const t = fr / o.fps, s = Math.min(raw.length - 1, Math.floor(t / o.every));
    if (Math.abs(tx[s] - gx) > o.dead[0]) gx = tx[s];
    if (Math.abs(ty[s] - gy) > o.dead[1]) gy = ty[s];
    const ax = OM * OM * (gx - cx) - 2 * OM * vx; vx += ax * dt; cx += vx * dt;
    const ay = OM * OM * (gy - cy) - 2 * OM * vy; vy += ay * dt; cy += vy * dt;
    const k: [number, number] = [pyRound(cx), pyRound(cy)];
    if (`${k}` !== last) { path.push([Math.round(t * 1000) / 1000, k[0], k[1]]); last = `${k}`; }
  }
  return { w: W, h: H, path };
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const pair = (n: string, d: [number, number]) => (flag(n) ? (flag(n)!.split("x").map(Number) as [number, number]) : d);
  const [inp, out] = args;
  if (!out || inp.startsWith("--")) { console.error("usage: bun track.ts <faces.jsonl> <out.json> [--tile 1024x576] [--det 512x288] [--every 1] [--place 608x456] [--crop-h 526] [--face-y 0.55] [--trim t,b,l,r] [--dead 45x30] [--omega 2.2] [--median 3] [--fps 25]"); process.exit(2); }
  const D = DEFAULTS;
  const o: Opts = {
    tile: pair("--tile", D.tile), det: pair("--det", D.det), every: Number(flag("--every") ?? D.every), place: pair("--place", D.place),
    cropH: Number(flag("--crop-h") ?? D.cropH), faceY: Number(flag("--face-y") ?? D.faceY),
    trim: flag("--trim") ? (flag("--trim")!.split(",").map(Number) as Opts["trim"]) : D.trim,
    dead: pair("--dead", D.dead), omega: Number(flag("--omega") ?? D.omega), median: Number(flag("--median") ?? D.median), fps: Number(flag("--fps") ?? D.fps),
  };
  const r = track(readFileSync(inp, "utf8").split("\n"), o);
  writeFileSync(out, JSON.stringify(r));
  const ys = r.path.map((p) => p[2]);
  console.log(`crop ${r.w}x${r.h}, ${r.path.length} points, y ${Math.min(...ys)}..${Math.max(...ys)}`);
}
