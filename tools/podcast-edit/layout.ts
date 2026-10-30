// Re-layout a Zoom gallery recording: hosts side by side at the same size, the AI tile
// small in a corner, on a clean background with name lower-thirds.
//
//   bun layout.ts <layout.json> <in.mp4> <out.mp4> [--from S] [--dur D] [--still T] [--preset fast]
//
// layout.json: tile rectangles come from detect-tiles.ts (source time intervals); with
// "cuts" (render.ts cuts.json) they are mapped to the edited timeline. --from/--dur cut a
// preview window (output seconds); --still T writes one PNG at output time T instead of video.
// Text, background, masks and labels are drawn by headless Chrome into PNGs (this ffmpeg has
// no drawtext), so fonts and rounded corners look right. Tiles are masked boxes on top of
// the background, so they can move: "center" windows slide the hosts to the edges.
import { $ } from "bun";
import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import type { Detection, Rect } from "./detect-tiles";

export type Place = { x: number; y: number; w: number; h: number; label?: string; sub?: string; radius?: number; focusX?: number; focusY?: number; small?: boolean;
  center?: { x: number; y: number; w: number } }; // where the tile goes in the "center" state (keeps aspect)
export type LayoutConfig = {
  canvas: { w: number; h: number; fps: number };
  tiles: string | Detection; // detect-tiles.ts output (path relative to the config, or inline)
  cuts?: string; // render.ts cuts.json: source -> output time map
  show?: string;
  title?: string;
  crop: { top: number; bottom: number; left: number; right: number }; // fraction of a tile: borders, Zoom name label
  place: Record<string, Place>; // tile name -> position on the canvas
  highlight?: { tile: string; from: number | string; to: number | string }[]; // source times: the tile speaks
  sharpen?: number; // cas strength, 0 = off
  center?: { from: number; to: number }[]; // edited seconds: hosts move aside, middle free for a chart
  transition?: number; // center move duration, s (default 0.6)
};

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FPS_DEFAULT = 25;
const sec = (t: number | string) => (typeof t === "number" ? t : t.split(":").map(Number).reduce((a, v) => a * 60 + v, 0));
const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

// Source interval -> output intervals, using render.ts `segments` (kept [startFrame, endFrame) at fps).
export function mapToOutput(start: number, end: number, segments: [number, number][] | null, fps: number): [number, number][] {
  if (!segments) return [[start, end]];
  const out: [number, number][] = [];
  let off = 0;
  for (const [a, b] of segments) {
    const lo = Math.max(a, Math.round(start * fps)), hi = Math.min(b, Math.round(end * fps));
    if (hi > lo) out.push([(off + lo - a) / fps, (off + hi - a) / fps]);
    off += b - a;
  }
  return out;
}

// Join output intervals that touch or nearly touch (a highlight should not blink at each cut).
export function merge(iv: [number, number][], gap = 0.5): [number, number][] {
  const out: [number, number][] = [];
  for (const [a, b] of iv) {
    const last = out.at(-1);
    if (last && a - last[1] <= gap) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

// Crop of a tile: trim borders and the name label, then center (or focus) to the target aspect.
export function cropFor(r: Rect, crop: LayoutConfig["crop"], p: Place): Rect {
  const x0 = r.x + r.w * crop.left, x1 = r.x + r.w * (1 - crop.right);
  const y0 = r.y + r.h * crop.top, y1 = r.y + r.h * (1 - crop.bottom);
  const a = p.w / p.h;
  let w = x1 - x0, h = y1 - y0;
  if (w / h > a) w = h * a;
  else h = w / a;
  // focus -1..1: where the crop sits in the spare room (0 = center, -1 = left/top).
  const x = x0 + ((x1 - x0 - w) * ((p.focusX ?? 0) + 1)) / 2, y = y0 + ((y1 - y0 - h) * ((p.focusY ?? 0) + 1)) / 2;
  return { x: Math.round(x), y: Math.round(y), w: even(w), h: even(h) };
}

function roundRect(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const LABEL_H = 72; // label strip under a host tile (part of the tile box, so it moves with it)
const FONT = `-apple-system,"SF Pro Display","Helvetica Neue",sans-serif`;
const MONO = `"JetBrains Mono",ui-monospace,monospace`;
const page = (w: number, h: number, css: string, body: string, bg = "transparent") =>
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${bg}}${css}</style></head><body>${body}</body></html>`;

// Opaque background: gradient, dot grid, the title line, and the labels of small (fixed) tiles.
export function chromeHtml(c: LayoutConfig): string {
  const { w, h } = c.canvas;
  const places = Object.values(c.place);
  const small = places.filter((p) => p.small && p.label).map((p) => `<div class="small" style="left:${p.x}px;top:${p.y - 34}px">${esc(p.label!)}</div>`).join("");
  const top = c.show || c.title
    ? `<div class="top"><span class="show">${esc(c.show ?? "")}</span>${c.title ? `<span class="title">${esc(c.title)}</span>` : ""}</div>`
    : "";
  return page(w, h, `svg{position:absolute;left:0;top:0}
.small,.top{position:absolute;font-family:${FONT};white-space:nowrap}
.small{font-family:${MONO};font-size:17px;color:#93A4BD;letter-spacing:0.3px}
.top{left:${Math.min(...places.map((p) => p.x))}px;top:44px;font-size:22px;display:flex;gap:18px;align-items:baseline}
.top .show{font-family:${MONO};font-weight:700;color:#E8EDF5;letter-spacing:0.5px}
.top .title{color:#7F90A8}`, `<svg width="${w}" height="${h}"><defs>
<radialGradient id="g" cx="18%" cy="0%" r="110%"><stop offset="0" stop-color="#16263F"/><stop offset="0.55" stop-color="#0D1625"/><stop offset="1" stop-color="#0A0F1A"/></radialGradient>
<pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.045)"/></pattern></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#dots)"/></svg>${top}${small}`, "#0A0F1A");
}

// Tile box = the tile plus (for hosts) its label strip. Mask: white rounded tile, black elsewhere.
export const boxSize = (p: Place) => ({ w: p.w, h: p.h + (p.small || !p.label ? 0 : LABEL_H) });
export function maskHtml(p: Place): string {
  const b = boxSize(p);
  return page(b.w, b.h, "", `<svg width="${b.w}" height="${b.h}"><path d="${roundRect(0, 0, p.w, p.h, p.radius ?? 16)}" fill="#fff"/></svg>`, "#000");
}
export function labelHtml(p: Place, text = true): string {
  const b = boxSize(p);
  return page(b.w, b.h, `.lt{position:absolute;left:0;top:${p.h + 22}px;display:flex;align-items:center;font-family:${FONT};font-size:30px;color:#E8EDF5;white-space:nowrap}
.bar{display:inline-block;width:4px;height:30px;border-radius:2px;background:#4F8AD1;margin-right:14px}.name{font-weight:600}.sub{color:#93A4BD}
.edge{position:absolute;left:0;top:0;width:${p.w - 2}px;height:${p.h - 2}px;border:1px solid rgba(255,255,255,0.10);border-radius:${p.radius ?? 16}px}`,
    `<div class="edge"></div>${text && p.label && !p.small ? `<div class="lt"><span class="bar"></span><span class="name">${esc(p.label)}</span>${p.sub ? `<span class="sub">&nbsp;&middot;&nbsp;${esc(p.sub)}</span>` : ""}</div>` : ""}`);
}

// Glow frame for a speaking tile (transparent elsewhere).
export function highlightHtml(c: LayoutConfig, p: Place): string {
  const r = p.radius ?? 16;
  return `<!doctype html><html><head><style>html,body{margin:0;width:${c.canvas.w}px;height:${c.canvas.h}px;background:transparent;overflow:hidden}
.f{position:absolute;left:${p.x - 3}px;top:${p.y - 3}px;width:${p.w}px;height:${p.h}px;border:3px solid #4F8AD1;border-radius:${r + 3}px;box-shadow:0 0 24px 4px rgba(79,138,209,0.55)}
</style></head><body><div class="f"></div></body></html>`;
}

async function duration(f: string) {
  return Number((await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${f}`.text()).trim());
}

export async function renderHtml(html: string, w: number, h: number, png: string) {
  const file = png.replace(/\.png$/, ".html");
  await Bun.write(file, html);
  await $`${CHROME} --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 --virtual-time-budget=4000 --window-size=${w},${h} --screenshot=${png} file://${file}`.quiet();
}

async function load(configPath: string) {
  const c: LayoutConfig = await Bun.file(configPath).json();
  const base = dirname(resolve(configPath));
  const tiles: Detection = typeof c.tiles === "string" ? await Bun.file(resolve(base, c.tiles)).json() : c.tiles;
  const cuts = c.cuts ? await Bun.file(resolve(base, c.cuts)).json() : null;
  return { c, tiles, segments: (cuts?.segments ?? null) as [number, number][] | null };
}

// Render the still layers once: background, then per place a mask, a label and an edge-only
// layer, then
// one glow per highlight row. The returned order is the input order the graph expects.
export async function prepareUi(c: LayoutConfig, work: string): Promise<string[]> {
  const out = [join(work, "bg.png")];
  await renderHtml(chromeHtml(c), c.canvas.w, c.canvas.h, out[0]);
  for (const [name, p] of Object.entries(c.place)) {
    const b = boxSize(p);
    for (const [kind, html] of [["mask", maskHtml(p)], ["label", labelHtml(p)], ["edge", labelHtml(p, false)]] as const) {
      const png = join(work, `${kind}-${name}.png`);
      await renderHtml(html, b.w, b.h, png);
      out.push(png);
    }
  }
  for (const [i, h] of (c.highlight ?? []).entries()) {
    const png = join(work, `hl${i}.png`);
    await renderHtml(highlightHtml(c, c.place[h.tile]), c.canvas.w, c.canvas.h, png);
    out.push(png);
  }
  return out;
}

// Smooth 0..1 "center state" weight over window time t: ease-in-out ramps of `d` s at
// both ends of every window.
function centerWeight(windows: [number, number][], d: number): string {
  const st = (x: string) => `(pow(clip(${x},0,1),2)*(3-2*clip(${x},0,1)))`;
  return windows.map(([a, b]) => `(${st(`(t-${a.toFixed(3)})/${d}`)}-${st(`(t-${(b - d).toFixed(3)})/${d}`)})`).join("+") || "0";
}

// ffmpeg filtergraph. Per tile: one crop+scale per Zoom layout (shown while that layout is
// on), merged, then the rounded mask and label, then the move/scale of the "center" state.
// Inputs: 0 = video, then the prepareUi() layers from index `base`.
export function filtergraph(c: LayoutConfig, tiles: Detection, segments: [number, number][] | null, from = 0, base = 1) {
  const fps = c.canvas.fps ?? FPS_DEFAULT;
  const enable = (iv: [number, number][]) => iv.map(([a, b]) => `between(t,${(a - from).toFixed(3)},${(b - from - 0.001).toFixed(3)})`).join("+");
  const sharp = (c.sharpen ?? 0.25) > 0 ? `,cas=${c.sharpen ?? 0.25}` : "";
  const names = Object.keys(c.place);
  const used = tiles.layouts
    .map((L) => ({ L, iv: tiles.intervals.filter((i) => i.layout === L.id).flatMap((i) => mapToOutput(i.start, i.end, segments, fps)).filter(([, b]) => b > from) }))
    .filter((u) => u.iv.length);
  const variants = names.flatMap((n) => used.filter((u) => u.L.tiles[n]).map((u) => ({ n, u })));
  const parts = [`[0:v]split=${variants.length + 1}${variants.map((_, i) => `[s${i}]`).join("")}[sbg]`];
  parts.push(`[sbg]scale=${c.canvas.w}:${c.canvas.h},setsar=1,format=yuv420p[sb];[sb][${base}:v]overlay=0:0[bg0]`);
  const D = c.transition ?? 0.6;
  const windows = (c.center ?? []).map((w) => [w.from - from, w.to - from] as [number, number]).filter(([, b]) => b > 0);
  const e = centerWeight(windows, D);
  let cur = "bg0";
  // Small tiles first, so a moving host tile passes over them.
  const order = [...names].sort((a, b) => Number(!!c.place[b].small) - Number(!!c.place[a].small));
  for (const n of order) {
    const p = c.place[n], bx = boxSize(p);
    const vs = variants.map((v, i) => ({ ...v, i })).filter((v) => v.n === n);
    if (!vs.length) continue;
    vs.forEach((v) => {
      const k = cropFor(v.u.L.tiles[n], c.crop, p);
      parts.push(`[s${v.i}]crop=${k.w}:${k.h}:${k.x}:${k.y},scale=${p.w}:${p.h}:flags=lanczos${sharp},setsar=1[v${v.i}]`);
    });
    // Merge the Zoom-layout variants: later ones on top while their layout is on.
    let t = `v${vs[0].i}`;
    for (const v of vs.slice(1)) {
      parts.push(`[${t}][v${v.i}]overlay=0:0:enable='${enable(v.u.iv)}'[m${v.i}]`);
      t = `m${v.i}`;
    }
    const mi = base + 1 + names.indexOf(n) * 3;
    parts.push(`[${t}]format=yuva420p${bx.h > p.h ? `,pad=${bx.w}:${bx.h}:0:0:color=black@0` : ""}[p_${n}];[${mi}:v]format=gray[mk_${n}];[p_${n}][mk_${n}]alphamerge[a_${n}]`);
    const q = p.center;
    if (q && windows.length) {
      // The name label fades out while the tile is aside: blend the labelled box into the
      // edge-only box by the same weight (only inside the windows, so it costs little).
      const on = windows.map(([a, b]) => `between(t,${a.toFixed(3)},${b.toFixed(3)})`).join("+");
      parts.push(`[a_${n}]split[a1_${n}][a2_${n}];[a1_${n}][${mi + 1}:v]overlay=0:0:format=yuv420[wl_${n}];[a2_${n}][${mi + 2}:v]overlay=0:0:format=yuv420[nl_${n}]`);
      parts.push(`[wl_${n}][nl_${n}]blend=all_expr='A+(B-A)*(${e.replace(/\bt\b/g, "T")})':enable='${on}'[box_${n}]`);
      const k = q.w / p.w; // box scales with the tile
      const lerp = (a: number, b: number) => `(${a}+(${b - a})*(${e}))`;
      parts.push(`[box_${n}]scale=w='trunc(${lerp(bx.w, bx.w * k)}/2)*2':h='trunc(${lerp(bx.h, bx.h * k)}/2)*2':eval=frame:flags=bicubic[bs_${n}]`);
      parts.push(`[${cur}][bs_${n}]overlay=x='${lerp(p.x, q.x)}':y='${lerp(p.y, q.y)}':eval=frame[o_${n}]`);
    } else parts.push(`[a_${n}][${mi + 1}:v]overlay=0:0:format=yuv420[box_${n}];[${cur}][box_${n}]overlay=${p.x}:${p.y}[o_${n}]`);
    cur = `o_${n}`;
  }
  // Highlights: one glow layer per highlight row, fade in/out 0.3 s.
  const hlBase = base + 1 + names.length * 3;
  (c.highlight ?? []).forEach((h, i) => {
    const iv = merge(mapToOutput(sec(h.from), sec(h.to), segments, fps)).map(([a, b]) => [a - from, b - from] as [number, number]).filter(([, b]) => b > 0);
    iv.forEach(([a, b], j) => {
      const lab = `hl${i}_${j}`;
      parts.push(`[${hlBase + i}:v]format=rgba,fade=in:st=${Math.max(0, a).toFixed(2)}:d=0.3:alpha=1,fade=out:st=${b.toFixed(2)}:d=0.4:alpha=1[${lab}]`);
      parts.push(`[${cur}][${lab}]overlay=0:0:enable='between(t,${Math.max(0, a - 0.1).toFixed(2)},${(b + 0.5).toFixed(2)})'[${lab}o]`);
      cur = `${lab}o`;
    });
  });
  return { graph: parts.join(";\n"), out: cur };
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const [configPath, input, output] = args;
  if (!output) { console.error("usage: bun layout.ts <layout.json> <in.mp4> <out.mp4|out.png> [--from S] [--dur D] [--still T] [--preset fast]"); process.exit(2); }
  const { c, tiles, segments } = await load(configPath);
  const work = join(dirname(resolve(output)), ".layout");
  mkdirSync(work, { recursive: true });
  const pngs = await prepareUi(c, work);
  const still = flag("--still");
  const from = still !== undefined ? Number(still) : Number(flag("--from") ?? 0);
  const dur = still !== undefined ? 1 / c.canvas.fps : flag("--dur") ? Number(flag("--dur")) : undefined;
  const { graph, out } = filtergraph(c, tiles, segments, from);
  const graphFile = join(work, "graph.txt");
  await Bun.write(graphFile, graph);
  const seek = from > 0 ? ["-ss", String(from)] : [];
  // Looped PNG inputs never end: always bound the output length.
  const len = ["-t", String(dur ?? (await duration(input)) - from)];
  const loops = pngs.flatMap((p) => ["-loop", "1", "-framerate", String(c.canvas.fps), "-i", p]);
  const enc = still !== undefined
    ? ["-frames:v", "1"]
    : ["-map", "0:a?", "-c:v", "libx264", "-preset", flag("--preset") ?? "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"];
  await $`ffmpeg -y -v error ${seek} -i ${input} ${loops} -filter_complex_script ${graphFile} -map [${out}] ${enc} ${len} ${output}`;
  console.log(`wrote ${output}`);
}
