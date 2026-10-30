#!/usr/bin/env bun
// A/B review file: the worst joins of an old edit, each played old then new.
// Usage: bun ab.ts <old.joins.json> <old-edited.mp4> <old.cuts.json> <new.edl.json> <out.mp4>
//        [--top 10] [--pad 3] [--work dir] [--render-work dir (render.ts temp dir; reuse one with src.s16)]
// <old.joins.json> comes from `bun joins.ts <old.cuts.json> --audio <old-edited.mp4>`. For each of
// the --top worst joins (at least 8 s apart): the old edit's output around the join (+-pad s), then
// the same source stretch rendered with the new EDL (render.ts --src-from/--src-to). Each clip
// carries a visual label (OLD / NEW, join n of N, source time; no voice-over), clips are
// loudness-matched (-16 LUFS, linear gain), and 1 s of black silence separates them.
import { $ } from "bun";
import { parseArgs } from "util";
import { dirname, join, resolve } from "path";
import { FPS, fmt } from "./lib";
import { renderHtml } from "./layout";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2), allowPositionals: true,
  options: { top: { type: "string", default: "10" }, pad: { type: "string", default: "3" }, work: { type: "string" }, "render-work": { type: "string" } },
});
const [joinsPath, oldMp4, oldCutsPath, newEdl, out] = positionals;
if (!out) { console.error("usage: bun ab.ts <old.joins.json> <old-edited.mp4> <old.cuts.json> <new.edl.json> <out.mp4> [--top 10]"); process.exit(2); }
const work = values.work ?? out.replace(/\.mp4$/, ".ab-work");
await $`mkdir -p ${work}`.quiet();
const PAD = Number(values.pad), TOP = Number(values.top);
const rows: any[] = (await Bun.file(joinsPath).json()).rows;
const oldPlan = await Bun.file(oldCutsPath).json();
// Old output time -> source time through the old frame segments.
const segs: [number, number][] = oldPlan.segments;
const starts: number[] = [];
segs.reduce((acc, [a, b], i) => ((starts[i] = acc), acc + b - a), 0);
const toSource = (t: number) => { const f = t * FPS; const i = Math.max(0, starts.findLastIndex((s) => s <= f)); return (segs[i][0] + f - starts[i]) / FPS; };

const picked: any[] = [];
for (const r of [...rows].sort((a, b) => b.score - a.score)) {
  if (picked.length >= TOP) break;
  if (picked.some((p) => Math.abs(p.srcA - r.srcA) < 8)) continue;
  picked.push(r);
}
picked.sort((a, b) => a.out - b.out);

const W = 1920, H = 1080;
const label = async (name: string, tag: string, color: string, sub: string) => {
  const png = join(work, `${name}.png`);
  await renderHtml(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden}
.b{position:absolute;left:48px;top:40px;padding:18px 34px;border-radius:14px;background:${color};color:#fff;font:800 88px -apple-system,Helvetica,sans-serif;letter-spacing:2px}
.s{position:absolute;left:52px;top:180px;padding:8px 18px;border-radius:10px;background:rgba(0,0,0,.65);color:#fff;font:600 34px -apple-system,Helvetica,sans-serif}</style></head>
<body><div class="b">${tag}</div><div class="s">${sub}</div></body></html>`, W, H, png);
  return png;
};
// Encode one clip: picture + label, 25 fps, 48 kHz stereo, loudness to -16 LUFS (linear gain).
async function clip(src: string, ss: number | null, t: number | null, png: string, dst: string) {
  const inArgs = [...(ss !== null ? ["-ss", ss.toFixed(3)] : []), ...(t !== null ? ["-t", t.toFixed(3)] : []), "-i", src];
  const m = (await $`ffmpeg -hide_banner -nostats ${inArgs} -af ebur128 -f null -`.nothrow().quiet()).stderr.toString().match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/);
  const gain = m ? -16 - Number(m[1]) : 0;
  await $`ffmpeg -y -v error ${inArgs} -i ${png} -filter_complex ${`[0:v]scale=${W}:${H},fps=${FPS},format=yuv420p[v0];[v0][1:v]overlay=0:0[v];[0:a]aresample=48000,aformat=channel_layouts=stereo,volume=${gain.toFixed(2)}dB,afade=t=in:d=0.05,areverse,afade=t=in:d=0.08,areverse[a]`} -map [v] -map [a] -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k ${dst}`;
}
const gap = join(work, "gap.mp4");
await $`ffmpeg -y -v error -f lavfi -i color=c=black:s=${W}x${H}:r=${FPS}:d=1 -f lavfi -i anullsrc=r=48000:cl=stereo -t 1 -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k ${gap}`;

const list: string[] = [];
const render = resolve(dirname(Bun.main), "render.ts");
for (const [i, r] of picked.entries()) {
  const n = i + 1, t0 = Math.max(0, r.out - PAD), t1 = r.out + PAD;
  const s0 = toSource(t0), s1 = toSource(t1 - 1e-3);
  const sub = `join ${n} of ${picked.length} &middot; source ${fmt(r.srcA)} &middot; ${r.cat}`;
  const oldClip = join(work, `${n}-old.mp4`), newRaw = join(work, `${n}-new-raw.mp4`), newClip = join(work, `${n}-new.mp4`);
  await clip(oldMp4, t0, t1 - t0, await label(`${n}-old`, "OLD", "#c0392b", sub), oldClip);
  await $`bun ${render} ${newEdl} ${newRaw} --src-from ${s0.toFixed(3)} --src-to ${s1.toFixed(3)} --preset fast --work ${values["render-work"] ?? join(work, "render")}`.quiet();
  await clip(newRaw, null, null, await label(`${n}-new`, "NEW", "#1e8449", sub), newClip);
  list.push(oldClip, gap, newClip, gap);
  console.error(`${n}: old ${fmt(t0)}-${fmt(t1)} (source ${fmt(s0)}-${fmt(s1)}) score ${r.score} ${r.cat} "${r.text}"`);
}
await Bun.write(join(work, "list.txt"), list.map((f) => `file '${f}'`).join("\n"));
await $`ffmpeg -y -v error -f concat -safe 0 -i ${join(work, "list.txt")} -c copy -movflags +faststart ${out}`;
await Bun.write(out.replace(/\.mp4$/, ".json"), JSON.stringify(picked.map((r, i) => ({ n: i + 1, oldOut: r.out, srcA: r.srcA, srcB: r.srcB, cat: r.cat, text: r.text, oldScore: r.score, oldFlags: r.flags })), null, 1));
console.log(`wrote ${out} (${picked.length} joins)`);
