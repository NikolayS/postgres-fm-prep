#!/usr/bin/env bun
// Check an edited render against its cut plan.
// Usage: bun verify.ts <out.cuts.json> <out.mp4> [--joins 20] [--judgment-joins] [--no-transcribe]
//  1. durations: planned vs video stream vs audio stream
//  2. A/V offset at start, middle, end: output audio and video vs the source at the mapped time
//  3. full re-transcription vs the kept source words (missing / extra words)
//  4. N random joins (plus every judgment cut with --judgment-joins): 4 s clips, transcribed,
//     plus a sample-level click check
//  5. join harshness, every join: level and spectral jump across it, and the silence left at it
//     (< 0.12 s = a butt-join). Prints the worst 10. --harsh-only runs just this (and needs no
//     transcription); --audio takes the samples from another file (e.g. the pre-encode wav).
// --engine whisper (default: local whisper.cpp, nothing uploaded) or elevenlabs (Scribe, uploads audio;
// it keeps fillers, so its diff is cleaner). Whisper drops fillers: "missing" counts include kept fillers.
// Writes <out>.verify.json and prints a summary. Clips go to --work (default <out>.verify/).
import { $ } from "bun";
import { parseArgs } from "util";
import { FPS, type Word, decodePcm, fmt, loadTranscript, norm, scribe, whisperWords } from "./lib";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: { "harsh-only": { type: "boolean", default: false }, until: { type: "string" }, audio: { type: "string" }, joins: { type: "string", default: "20" }, "judgment-joins": { type: "boolean", default: false }, "no-transcribe": { type: "boolean", default: false }, engine: { type: "string", default: "whisper" }, seed: { type: "string", default: "1" }, work: { type: "string" } },
});
const [plansPath, out] = positionals;
if (!plansPath || !out) {
  console.error("usage: bun verify.ts <out.cuts.json> <out.mp4> [--joins 20] [--no-transcribe]");
  process.exit(2);
}
const plan = await Bun.file(plansPath).json();
const edl = await Bun.file(plan.edl).json();
const src = await loadTranscript(edl.words);
const work = values.work ?? out.replace(/\.mp4$/, ".verify");
await $`mkdir -p ${work}`.quiet();
const report: any = {};

// Output time <-> source time through the kept segments (frame units).
const segs: [number, number][] = plan.segments;
const outStart: number[] = [];
segs.reduce((acc, [a, b], i) => ((outStart[i] = acc), acc + b - a), 0);
const toSource = (t: number) => {
  const f = t * FPS;
  const i = outStart.findLastIndex((s) => s <= f);
  return (segs[i][0] + f - outStart[i]) / FPS;
};
const judgedCut = (srcStart: number) => plan.cuts.some((c: any) => Math.abs(c.end - srcStart) < 1e-3 && !["filler", "repeat", "falsestart", "pause"].includes(c.cat));
const joins = segs.slice(1).map((s, i) => ({ out: outStart[i + 1] / FPS, srcEnd: segs[i][1] / FPS, srcStart: s[0] / FPS, judged: judgedCut(s[0] / FPS) }));

// ---- 5. Join harshness (defined here, run at the end or alone with --harsh-only) ----
// Level jump: RMS dB of 100 ms before vs after the crossfade zone. Spectral jump: mean absolute
// difference of 8 log-spaced band levels (dB) of the same windows. Gap: silence at the join between
// the last kept word before and the first kept word after (transcript times).
async function harshness() {
  const pcm = await decodePcm(values.audio ?? out, 1, 48000);
  const R = 48000, N = 1024;
  // Hann-windowed N samples centered at c.
  const win = (c: number) => {
    const a = new Float64Array(N);
    for (let i = 0; i < N; i++) a[i] = (pcm[c - N / 2 + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
    return a;
  };
  // Band levels with a plain DFT on log-spaced bins (cheap enough for a few hundred joins).
  const edges = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 20000];
  const bands = (a: Float64Array) => edges.slice(0, -1).map((lo, b) => {
    let e = 0;
    for (let f = lo; f < edges[b + 1]; f += Math.max(47, lo / 4)) {
      const k = (2 * Math.PI * f) / R;
      let re = 0, im = 0;
      for (let i = 0; i < N; i++) (re += a[i] * Math.cos(k * i)), (im -= a[i] * Math.sin(k * i));
      e += re * re + im * im;
    }
    return 10 * Math.log10(e + 1e-9);
  });
  const rms = (a: number, b: number) => {
    let s = 0;
    for (let i = a; i < b; i++) s += (pcm[i] ?? 0) ** 2;
    return 10 * Math.log10(s / Math.max(1, b - a) + 1e-12);
  };
  const keptW = src.words.filter((w) => !inCut(w));
  const rows = [];
  const limit = values.until ? Number(values.until) : plan.until ?? Infinity;
  for (const j of joins) {
    if (j.out > limit - 0.3) continue;
    const c = plan.cuts.find((c: any) => Math.abs(c.end - j.srcStart) < 0.021) ?? {};
    const xf = c.xfade ?? 0.02;
    const before = keptW.filter((w) => w.end <= j.srcEnd + 0.02).at(-1), after = keptW.find((w) => w.start >= j.srcStart - 0.02);
    const gL = before ? j.srcEnd - before.end : 1, gR = after ? after.start - j.srcStart : 1;
    const gap = gL + gR;
    // Compare the silence (room tone) on each side, outside the crossfade: the noise floor
    // should not step. Windows are up to 100 ms, at least 21 ms.
    const n0 = Math.round(j.out * R), h = Math.round((xf / 2) * R);
    const wl = Math.max(N, Math.round(Math.min(0.1, gL - xf / 2 - 0.02) * R)), wr = Math.max(N, Math.round(Math.min(0.1, gR - xf / 2 - 0.02) * R));
    // Levels below -70 dBFS are inaudible (Zoom gates silence to about -85): clamp them.
    const lL = Math.max(-70, rms(n0 - h - wl, n0 - h)), lR = Math.max(-70, rms(n0 + h, n0 + h + wr));
    const dLevel = Math.abs(lL - lR);
    // Spectral shape change (band levels minus their mean), weighted by how audible the louder side is.
    const shape = (b: number[]) => { const m = b.reduce((s, v) => s + v, 0) / b.length; return b.map((v) => v - m); };
    const bp = shape(bands(win(n0 - h - wl / 2))), bq = shape(bands(win(n0 + h + wr / 2)));
    const dSpec = (Math.min(1, Math.max(0, (Math.max(lL, lR) + 70) / 40)) * bp.reduce((s, v, i) => s + Math.abs(v - bq[i]), 0)) / bp.length;
    rows.push({ out: fmt(j.out), cut: `${fmt(j.srcEnd)}-${fmt(j.srcStart)}`, cat: c.cat, gap: +gap.toFixed(3), dLevel: +dLevel.toFixed(1), dSpec: +dSpec.toFixed(1), xfade: xf, score: +(dLevel + dSpec + (gap < 0.12 ? 10 : 0)).toFixed(1) });
  }
  rows.sort((a, b) => b.score - a.score);
  const mean = (k: "dLevel" | "dSpec") => +(rows.reduce((s, r) => s + r[k], 0) / rows.length).toFixed(2);
  return { joins: rows.length, butt: rows.filter((r) => r.gap < 0.12).length, meanLevelJump: mean("dLevel"), meanSpecJump: mean("dSpec"), worst10: rows.slice(0, 10) };
}

// A source word is gone when its middle is in a cut or in a room-tone (muted) range.
const inCut = (w: Word) => {
  const m = (w.start + w.end) / 2;
  return plan.cuts.some((c: any) => m > c.start && m < c.end) || (plan.muteOnly ?? []).some((c: any) => c.ids.length && m > c.start && m < c.end && edl.removals.some((r: any) => c.ids.includes(r.id) && m >= r.start && m <= r.end));
};
if (values["harsh-only"]) {
  const h = await harshness();
  console.log(JSON.stringify({ joins: h.joins, butt: h.butt, meanLevelJump: h.meanLevelJump, meanSpecJump: h.meanSpecJump }));
  for (const r of h.worst10) console.log(`  ${r.out} src ${r.cut} ${r.cat ?? ""} gap ${r.gap}s level ${r.dLevel}dB spec ${r.dSpec}dB xfade ${r.xfade} score ${r.score}`);
  process.exit(0);
}

// ---- 1. Durations ----
const probe = async (sel: string) =>
  Number((await $`ffprobe -v error -select_streams ${sel} -show_entries stream=duration -of csv=p=0 ${out}`.text()).trim());
report.durations = { planned: plan.outputSeconds, video: await probe("v:0"), audio: await probe("a:0"), source: plan.sourceSeconds };

// ---- 2. A/V offset at three points ----
// Pick the middle of a kept segment at least 4 s long near each target.
const longSeg = (target: number) => {
  let best = 0, bestD = Infinity;
  segs.forEach(([a, b], i) => {
    if (b - a < 4 * FPS) return;
    const mid = (outStart[i] + (b - a) / 2) / FPS;
    if (Math.abs(mid - target) < bestD) (bestD = Math.abs(mid - target)), (best = mid);
  });
  return best;
};
const grab = async (file: string, t: number) =>
  new Uint8Array(await $`ffmpeg -v error -ss ${t.toFixed(3)} -i ${file} -frames:v 1 -vf scale=64:36,format=gray -f rawvideo -`.arrayBuffer());
const mad = (x: Uint8Array, y: Uint8Array) => x.reduce((s, v, i) => s + Math.abs(v - y[i]), 0) / x.length;
const pcmAt = async (file: string, t: number, dur: number) =>
  new Float32Array(await $`ffmpeg -v error -ss ${t.toFixed(4)} -t ${dur} -i ${file} -vn -ac 1 -ar 16000 -f f32le -`.arrayBuffer());
function bestLag(a: Float32Array, b: Float32Array, maxLag: number) {
  let best = 0, bestC = -Infinity;
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let c = 0, na = 0, nb = 0;
    for (let i = maxLag; i < a.length - maxLag; i++) (c += a[i] * b[i + lag]), (na += a[i] * a[i]), (nb += b[i + lag] ** 2);
    c /= Math.sqrt(na * nb) + 1e-12;
    if (c > bestC) (bestC = c), (best = lag);
  }
  return { lagMs: (best / 16000) * 1000, corr: +bestC.toFixed(3) };
}
report.sync = [];
const total = report.durations.planned;
for (const target of [30, total / 2, total - 30]) {
  const t = longSeg(target), s = toSource(t);
  const o = await grab(out, t);
  const diffs = await Promise.all([-1, 0, 1].map(async (d) => mad(o, await grab(plan.media, s + d / FPS))));
  const audio = bestLag(await pcmAt(out, t, 1.5), await pcmAt(plan.media, s, 1.5), 1600); // +-100 ms
  report.sync.push({ out: fmt(t), source: fmt(s), frameDiff: diffs.map((d) => +d.toFixed(2)), videoOffsetFrames: diffs.indexOf(Math.min(...diffs)) - 1, audio });
}

// Kept source words, in order, with output times.
const keptWords = src.words.filter((w) => w.type === "word" && !inCut(w));

// Longest common subsequence alignment of normalized words; returns unmatched indices on both sides.
function align(a: string[], b: string[]) {
  const n = a.length, m = b.length, W = m + 1;
  const dp = new Uint16Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
  const missA: number[] = [], missB: number[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) i++, j++;
    else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) missA.push(i++);
    else missB.push(j++);
  }
  while (i < n) missA.push(i++);
  while (j < m) missB.push(j++);
  return { matched: n - missA.length, missA, missB };
}

if (!values["no-transcribe"]) {
  // ---- 3. Full re-transcription ----
  const audio = `${work}/edited.mp3`;
  await $`ffmpeg -y -v error -i ${out} -vn -ac 1 -ar 22050 -b:a 64k ${audio}`;
  const got = (values.engine === "elevenlabs" ? await scribe(audio, 2, `${work}/edited.raw.json`) : await whisperWords(audio)).filter((w) => w.type === "word");
  await Bun.write(`${work}/edited.words.json`, JSON.stringify(got));
  const A = keptWords.map((w) => norm(w.text)), B = got.map((w) => norm(w.text));
  const r = align(A, B);
  // A missing word next to a join is the suspicious kind; elsewhere it is usually ASR variance.
  const nearJoin = (w: Word) => plan.cuts.some((c: any) => Math.abs(w.start - c.end) < 0.6 || Math.abs(w.end - c.start) < 0.6);
  const missing = r.missA.map((i) => keptWords[i]);
  report.transcript = {
    engine: values.engine,
    expectedWords: A.length, outputWords: B.length, matched: r.matched,
    missing: missing.length, missingNearJoin: missing.filter(nearJoin).length, extra: r.missB.length,
    missingList: missing.map((w) => `${fmt(w.start)} ${w.text}${nearJoin(w) ? " (join)" : ""}`),
    extraList: r.missB.map((j) => `${fmt(got[j].start)}out ${got[j].text}`),
  };
}

// ---- 4. Random joins: clipped words and clicks ----
let seed = Number(values.seed);
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const random = [...joins].sort(() => rand() - 0.5).slice(0, Number(values.joins));
const pick = [...new Set([...random, ...(values["judgment-joins"] ? joins.filter((j) => j.judged) : [])])].sort((a, b) => a.out - b.out);
const pcm = await decodePcm(out, 1, 48000);
report.joins = [];
for (const j of pick) {
  // Click check: biggest sample step within +-5 ms of the join vs the 99.9th percentile around it.
  const n0 = Math.round(j.out * 48000);
  const steps = (lo: number, hi: number) => Array.from({ length: hi - lo }, (_, k) => Math.abs(pcm[lo + k + 1] - pcm[lo + k]));
  const local = Math.max(...steps(n0 - 240, n0 + 240));
  const ctx = steps(n0 - 24000, n0 + 24000).sort((a, b) => a - b);
  const ref = ctx[Math.floor(ctx.length * 0.999)] + 1e-4;
  const row: any = { random: random.includes(j), out: fmt(j.out), cut: `${fmt(j.srcEnd)}-${fmt(j.srcStart)}`, clickRatio: +(local / ref).toFixed(2) };
  if (!values["no-transcribe"]) {
    const clip = `${work}/join-${j.out.toFixed(2)}.wav`;
    await $`ffmpeg -y -v error -ss ${Math.max(0, j.out - 2).toFixed(3)} -t 4 -i ${out} -vn -ac 1 -ar 16000 ${clip}`;
    const heard = (values.engine === "elevenlabs" ? await scribe(clip, 2) : await whisperWords(clip)).filter((w) => w.type === "word").map((w) => norm(w.text));
    // Expected: kept words that sit fully inside the middle 2.8 s of the clip.
    const lo = toSource(Math.max(0, j.out - 1.4)), hi = toSource(j.out + 1.4);
    const before = keptWords.filter((w) => w.start >= lo && w.end <= j.srcEnd);
    const after = keptWords.filter((w) => w.start >= j.srcStart && w.end <= hi);
    const expected = [...before, ...after].map((w) => norm(w.text));
    const r = align(expected, heard);
    Object.assign(row, { expected: expected.join(" "), heard: heard.join(" "), missing: r.missA.map((i) => expected[i]) });
  }
  report.joins.push(row);
}

report.harshness = await harshness();
const reportPath = out.replace(/\.mp4$/, ".verify.json");
await Bun.write(reportPath, JSON.stringify(report, null, 1));
const d = report.durations;
console.log(`durations: planned ${d.planned.toFixed(3)} video ${d.video.toFixed(3)} audio ${d.audio.toFixed(3)} (source ${d.source.toFixed(1)})`);
for (const s of report.sync) console.log(`sync at ${s.out} (src ${s.source}): video offset ${s.videoOffsetFrames} frames ${JSON.stringify(s.frameDiff)}, audio lag ${s.audio.lagMs} ms corr ${s.audio.corr}`);
if (report.transcript) {
  const t = report.transcript;
  console.log(`transcript: expected ${t.expectedWords}, matched ${t.matched}, missing ${t.missing} (${t.missingNearJoin} near a join), extra ${t.extra}`);
}
for (const [name, set] of [["random", report.joins.filter((j: any) => j.random)], ["all checked", report.joins]] as const) {
  const clicks = set.filter((j: any) => j.clickRatio > 2).length;
  const clipped = set.filter((j: any) => j.missing?.length).length;
  console.log(`joins ${name} ${set.length}: click ratio max ${Math.max(...set.map((j: any) => j.clickRatio))}, >2: ${clicks}; with a missing word: ${clipped}`);
}
const h = report.harshness;
console.log(`join harshness: ${h.joins} joins, butt-joins (gap < 0.12 s) ${h.butt}, mean level jump ${h.meanLevelJump} dB, mean spectral jump ${h.meanSpecJump} dB; worst 10:`);
for (const r of h.worst10) console.log(`  ${r.out} src ${r.cut} ${r.cat ?? ""} gap ${r.gap}s level ${r.dLevel}dB spec ${r.dSpec}dB score ${r.score}`);
console.log(`details: ${reportPath}`);
