#!/usr/bin/env bun
// Level the hosts in the edited body: Michael +7 dB with presence EQ (his mic runs about 9 dB
// quiet), Nik +1.5 dB.
//
// Usage: bun michael-boost.ts <recording dir> <in.mp4> <out.mp4> [dB]
//        bun michael-boost.ts <recording dir> --print-filter [dB]   (print the audio chain only)
//
// Michael's turns come from the transcript speaker labels (speaker_0 in review/work/src.words.json).
// They are mapped through edited-v2.cuts.json to output time. The audio gets +dB in his turns
// (default 7) and the cold-open presence EQ, then a limiter and the same two-pass loudnorm as
// render.ts (-16 LUFS, TP -2). The video stream is copied.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type W = { text: string; start: number; end: number; speaker: string; type?: string };
type Seg = { srcStart: number; srcEnd: number; outStart: number };

const MICHAEL = "speaker_0", NIK = "speaker_1";
const NIK_DB = 1.5; // Nik runs about 1.5 dB under Kirk after the mix (qa.ts audio spread)
const R = 0.04; // ramp, s
const EQ = "highpass=f=90,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3000:t=q:w=0.9:g=4,equalizer=f=5500:t=q:w=1:g=2";
const LN = "loudnorm=I=-16:TP=-2.0:LRA=11";

// First index i with a[i] > x (bisect_right) and first index with a[i] >= x (bisect_left).
const bisectRight = (a: number[], x: number) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (x < a[m]) hi = m; else lo = m + 1; } return lo; };
const bisectLeft = (a: number[], x: number) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] < x) lo = m + 1; else hi = m; } return lo; };

// A speaker's turns in output time, padded but not into another speaker's words.
export function ranges(words: W[], seg: Seg[], spk: string): [number, number][] {
  const oth = words.filter((w) => w.speaker !== spk);
  const oe = oth.map((w) => w.end).sort((a, b) => a - b), os = oth.map((w) => w.start).sort((a, b) => a - b);
  const turns: [number, number][] = [];
  words.forEach((w, i) => {
    if (w.speaker !== spk) return;
    if (turns.length && w.start - turns.at(-1)![1] < 1.5 && words[i - 1].speaker === spk) turns.at(-1)![1] = w.end;
    else turns.push([w.start, w.end]);
  });
  const outr: [number, number][] = [];
  for (const [s, e] of turns) {
    const j = bisectRight(oe, s + 0.01), prev = j ? oe[j - 1] : 0;
    const k = bisectLeft(os, e - 0.01), nxt = k < os.length ? os[k] : 1e9;
    const a = Math.max(s - 0.12, Math.min(prev, s)), b = Math.min(e + 0.25, Math.max(nxt, e));
    if (b - a <= 0.05) continue;
    for (const g of seg) { // map to output time through the kept segments
      const lo = Math.max(a, g.srcStart), hi = Math.min(b, g.srcEnd);
      if (hi > lo) outr.push([g.outStart + lo - g.srcStart, g.outStart + hi - g.srcStart]);
    }
  }
  outr.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const merged: [number, number][] = [];
  for (const [a, b] of outr) {
    if (merged.length && a - merged.at(-1)![1] < 0.05) merged.at(-1)![1] = Math.max(merged.at(-1)![1], b);
    else merged.push([a, b]);
  }
  return merged;
}

// Weights 0..1 with 40 ms linear ramps; volume is evaluated every 256 samples (5 ms), so the
// switch between the paths does not click. Michael wins where his and Nik's padding overlap.
// Michael's path: the cold-open v8 presence chain (high-pass, de-mud, presence) plus the gain;
// the other path keeps everyone else as is. Each path is muted outside its own ranges.
export function chain(michael: [number, number][], nik: [number, number][], db: number): string {
  const wexpr = (rs: [number, number][]) => rs.map(([a, b]) => `clip((t-${(a - R / 2).toFixed(3)})/${R},0,1)*clip((${(b + R / 2).toFixed(3)}-t)/${R},0,1)`).join("+");
  const expr = `min(1,${wexpr(michael)})`;
  const nexpr = `min(1,${wexpr(nik)})*(1-${expr})`;
  const lin = 10 ** (db / 20), nlin = 10 ** (NIK_DB / 20);
  return `asetnsamples=n=256,asplit=3[m][n][o];[m]${EQ},volume='${lin.toFixed(4)}*${expr}':eval=frame[m2];` +
    `[n]volume='${nlin.toFixed(4)}*${nexpr}':eval=frame[n2];[o]volume='max(0,1-${expr}-${nexpr})':eval=frame[o2];` +
    `[m2][n2][o2]amix=inputs=3:normalize=0,alimiter=limit=0.89:attack=5:release=50:level=false`;
}

if (import.meta.main) {
  const [rec, src, out, dbArg] = process.argv.slice(2);
  if (!rec || !src) { console.error("usage: bun michael-boost.ts <recording dir> <in.mp4> <out.mp4> [dB] | <recording dir> --print-filter [dB]"); process.exit(2); }
  const printOnly = src === "--print-filter";
  const db = Number((printOnly ? out : dbArg) ?? 7);
  const words = (JSON.parse(readFileSync(`${rec}/review/work/src.words.json`, "utf8")).words as W[]).filter((w) => (w.type ?? "word") === "word");
  const seg = JSON.parse(readFileSync(join(import.meta.dir, "edited-v2.cuts.json"), "utf8")).segmentTimes as Seg[];
  const merged = ranges(words, seg, MICHAEL), nik = ranges(words, seg, NIK);
  const pre = chain(merged, nik, db);
  if (printOnly) { console.log(pre); process.exit(0); }
  console.log(`Michael: ${merged.length} output ranges, ${merged.reduce((s, [a, b]) => s + b - a, 0).toFixed(0)} s, +${db} dB; Nik: ${nik.length} ranges, +${NIK_DB} dB`);
  const p1 = Bun.spawnSync(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-vn", "-filter_complex", `[0:a]${pre},${LN}:print_format=json`, "-f", "null", "-"], { stderr: "pipe" });
  const js = [...p1.stderr.toString().matchAll(/\{[^{}]*"input_i"[^{}]*\}/g)].at(-1);
  if (!js) throw new Error(`loudnorm pass 1 failed:\n${p1.stderr.toString().slice(-2000)}`);
  const j = JSON.parse(js[0]);
  const ln2 = `${LN}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  const p2 = Bun.spawnSync(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", `[0:a]${pre},${ln2},aresample=48000[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], { stderr: "inherit" });
  if (p2.exitCode !== 0) process.exit(p2.exitCode ?? 1);
  writeFileSync(out.replace(/\.[^.]+$/, ".michael.json"), JSON.stringify(merged.map(([a, b]) => [Number(a.toFixed(3)), Number(b.toFixed(3))])));
  console.log(`wrote ${out}`);
}
