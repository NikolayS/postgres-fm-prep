// Re-layout a Zoom gallery recording: hosts side by side at the same size, the AI tile
// small in a corner, on a clean background with name lower-thirds.
//
//   bun layout.ts <layout.json> <in.mp4> <out.mp4> [--from S] [--dur D] [--still T] [--preset fast]
//
// layout.json: tile rectangles come from detect-tiles.ts (source time intervals); with
// "cuts" (render.ts cuts.json) they are mapped to the edited timeline. --from/--dur cut a
// preview window (output seconds); --still T writes one PNG at output time T instead of video.
// Text and the background are drawn by headless Chrome into one PNG with transparent holes
// where the tiles go (this ffmpeg has no drawtext), so fonts and rounded corners look right.
import { $ } from "bun";
import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import type { Detection, Rect } from "./detect-tiles";

export type Place = { x: number; y: number; w: number; h: number; label?: string; sub?: string; radius?: number; focusX?: number; focusY?: number; small?: boolean };
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

// Background + frames + labels, with transparent holes for the tiles.
export function chromeHtml(c: LayoutConfig): string {
  const { w, h } = c.canvas;
  const places = Object.values(c.place);
  const holes = places.map((p) => roundRect(p.x, p.y, p.w, p.h, p.radius ?? 16)).join("");
  const frames = places.map((p) => `<path d="${roundRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1, p.radius ?? 16)}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>`).join("");
  const labels = places
    .filter((p) => p.label)
    .map((p) =>
      p.small
        ? `<div class="small" style="left:${p.x}px;top:${p.y - 34}px;width:${p.w}px">${esc(p.label!)}</div>`
        : `<div class="lt" style="left:${p.x}px;top:${p.y + p.h + 22}px"><span class="bar"></span><span class="name">${esc(p.label!)}</span>${p.sub ? `<span class="sub">&nbsp;&middot;&nbsp;${esc(p.sub)}</span>` : ""}</div>`,
    )
    .join("");
  const top = c.show || c.title
    ? `<div class="top"><span class="show">${esc(c.show ?? "")}</span>${c.title ? `<span class="title">${esc(c.title)}</span>` : ""}</div>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}
svg{position:absolute;left:0;top:0}
.lt,.small,.top{position:absolute;font-family:-apple-system,"SF Pro Display","Helvetica Neue",sans-serif;color:#E8EDF5;white-space:nowrap}
.lt{display:flex;align-items:center;font-size:30px;letter-spacing:0.2px}
.lt .bar{display:inline-block;width:4px;height:30px;border-radius:2px;background:#4F8AD1;margin-right:14px}
.lt .name{font-weight:600}
.lt .sub{color:#93A4BD;font-weight:400}
.small{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:17px;color:#93A4BD;text-align:left;letter-spacing:0.3px}
.top{left:${Math.min(...places.map((p) => p.x))}px;top:44px;font-size:22px;display:flex;gap:18px;align-items:baseline}
.top .show{font-family:"JetBrains Mono",ui-monospace,monospace;font-weight:700;color:#E8EDF5;letter-spacing:0.5px}
.top .title{color:#7F90A8}
</style></head><body>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<radialGradient id="g" cx="18%" cy="0%" r="110%"><stop offset="0" stop-color="#16263F"/><stop offset="0.55" stop-color="#0D1625"/><stop offset="1" stop-color="#0A0F1A"/></radialGradient>
<pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.045)"/></pattern>
</defs>
<path fill-rule="evenodd" fill="url(#g)" d="M0,0H${w}V${h}H0Z${holes}"/>
<path fill-rule="evenodd" fill="url(#dots)" d="M0,0H${w}V${h}H0Z${holes}"/>
${frames}
</svg>${top}${labels}</body></html>`;
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
  await $`${CHROME} --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 --window-size=${w},${h} --screenshot=${png} file://${file}`.quiet();
}

async function load(configPath: string) {
  const c: LayoutConfig = await Bun.file(configPath).json();
  const base = dirname(resolve(configPath));
  const tiles: Detection = typeof c.tiles === "string" ? await Bun.file(resolve(base, c.tiles)).json() : c.tiles;
  const cuts = c.cuts ? await Bun.file(resolve(base, c.cuts)).json() : null;
  return { c, tiles, segments: (cuts?.segments ?? null) as [number, number][] | null };
}

// ffmpeg filtergraph: one crop+scale per (layout, tile), each shown only while its layout is on.
export function filtergraph(c: LayoutConfig, tiles: Detection, segments: [number, number][] | null, from = 0) {
  const fps = c.canvas.fps ?? FPS_DEFAULT;
  const enable = (iv: [number, number][]) => iv.map(([a, b]) => `between(t,${(a - from).toFixed(3)},${(b - from - 0.001).toFixed(3)})`).join("+");
  const chains: string[] = [];
  const shown: { label: string; place: Place; when: string }[] = [];
  for (const L of tiles.layouts) {
    const iv = tiles.intervals.filter((i) => i.layout === L.id).flatMap((i) => mapToOutput(i.start, i.end, segments, fps));
    const visible = iv.filter(([, b]) => b > from);
    if (!visible.length) continue;
    for (const [name, p] of Object.entries(c.place)) {
      const r = L.tiles[name];
      if (!r) continue;
      const k = cropFor(r, c.crop, p);
      const label = `t_${L.id}_${name}`;
      const sharp = (c.sharpen ?? 0.25) > 0 ? `,cas=${c.sharpen ?? 0.25}` : "";
      chains.push(`[SRC]crop=${k.w}:${k.h}:${k.x}:${k.y},scale=${p.w}:${p.h}:flags=lanczos${sharp},setsar=1[${label}]`);
      shown.push({ label, place: p, when: enable(visible) });
    }
  }
  // The background is drawn on a branch of the video itself (not a color source), so it
  // is in step with the tiles: no blank first frame after a seek, and it ends with the video.
  const n = chains.length;
  const parts = [`[0:v]split=${n + 1}${chains.map((_, i) => `[s${i}]`).join("")}[sbg]`, ...chains.map((ch, i) => ch.replace("[SRC]", `[s${i}]`))];
  parts.push(`[sbg]scale=${c.canvas.w}:${c.canvas.h},setsar=1,drawbox=x=0:y=0:w=iw:h=ih:color=0x0A0F1A:t=fill[bg0]`);
  let cur = "bg0";
  shown.forEach((s, i) => {
    parts.push(`[${cur}][${s.label}]overlay=${s.place.x}:${s.place.y}:enable='${s.when}'[bg${i + 1}]`);
    cur = `bg${i + 1}`;
  });
  parts.push(`[${cur}][1:v]overlay=0:0[ui]`);
  cur = "ui";
  // Highlights: inputs 2.., one per highlight row, fade in/out 0.3 s.
  (c.highlight ?? []).forEach((h, i) => {
    const iv = merge(mapToOutput(sec(h.from), sec(h.to), segments, fps)).map(([a, b]) => [a - from, b - from] as [number, number]).filter(([, b]) => b > 0);
    iv.forEach(([a, b], j) => {
      const lab = `hl${i}_${j}`;
      parts.push(`[${2 + i}:v]format=rgba,fade=in:st=${Math.max(0, a).toFixed(2)}:d=0.3:alpha=1,fade=out:st=${b.toFixed(2)}:d=0.4:alpha=1[${lab}]`);
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
  const uiPng = join(work, "ui.png");
  await renderHtml(chromeHtml(c), c.canvas.w, c.canvas.h, uiPng);
  const hlPngs: string[] = [];
  for (const [i, h] of (c.highlight ?? []).entries()) {
    const png = join(work, `hl${i}.png`);
    await renderHtml(highlightHtml(c, c.place[h.tile]), c.canvas.w, c.canvas.h, png);
    hlPngs.push(png);
  }
  const still = flag("--still");
  const from = still !== undefined ? Number(still) : Number(flag("--from") ?? 0);
  const dur = still !== undefined ? 1 / c.canvas.fps : flag("--dur") ? Number(flag("--dur")) : undefined;
  const { graph, out } = filtergraph(c, tiles, segments, from);
  const graphFile = join(work, "graph.txt");
  await Bun.write(graphFile, graph);
  const seek = from > 0 ? ["-ss", String(from)] : [];
  // Looped PNG inputs never end: always bound the output length.
  const len = ["-t", String(dur ?? (await duration(input)) - from)];
  const loops = [uiPng, ...hlPngs].flatMap((p) => ["-loop", "1", "-framerate", String(c.canvas.fps), "-i", p]);
  const enc = still !== undefined
    ? ["-frames:v", "1"]
    : ["-map", "0:a?", "-c:v", "libx264", "-preset", flag("--preset") ?? "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"];
  await $`ffmpeg -y -v error ${seek} -i ${input} ${loops} -filter_complex_script ${graphFile} -map [${out}] ${enc} ${len} ${output}`;
  console.log(`wrote ${output}`);
}
