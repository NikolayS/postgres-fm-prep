#!/usr/bin/env bun
// Prosody of filler and backchannel tokens: duration, level vs the speaker's median, F0 (YIN),
// pitch range and slope, gaps. Gives each an "intentional" score (0-1) for detect.ts --prosody.
// Usage: bun prosody.ts <words.json> <prosody.json> [--media in.mp4] [--show 01:58.66,03:05.72]
import { parseArgs } from "util";
import { decodePcm, fmt, loadTranscript, norm, parseTime } from "./lib";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: { media: { type: "string" }, show: { type: "string" } },
});
const [wordsPath, outPath] = positionals;
if (!wordsPath || !outPath) {
  console.error("usage: bun prosody.ts <words.json> <prosody.json> [--media in.mp4] [--show mm:ss.ss,...]");
  process.exit(2);
}
const TOKENS = new Set(["uh", "um", "uhm", "umm", "er", "erm", "eh", "hmm", "mm", "mmm", "mmhmm", "mhm", "oh", "ah"]);
const SR = 16000, HOP = 160, WIN = 640; // 10 ms hop, 40 ms YIN frame
const LAG_MIN = Math.floor(SR / 400), LAG_MAX = Math.ceil(SR / 70);

const t = await loadTranscript(wordsPath);
const words = t.words;
const pcm = await decodePcm(values.media ?? t.media, 1, SR);
const S = (s: number) => Math.max(0, Math.min(pcm.length, Math.round(s * SR)));
const rmsDb = (a: number, b: number) => {
  let s = 0;
  for (let i = S(a); i < S(b); i++) s += pcm[i] * pcm[i];
  return 10 * Math.log10(s / Math.max(1, S(b) - S(a)) + 1e-12);
};
const median = (xs: number[]) => xs.sort((p, q) => p - q)[Math.floor(xs.length / 2)] ?? -30;

// Speaker reference level: median RMS of that speaker's ordinary words (not fillers, >= 0.15 s).
const ref: Record<string, number> = {};
for (const sp of new Set(words.map((w) => w.speaker)))
  ref[sp] = median(words.filter((w) => w.speaker === sp && w.type === "word" && w.end - w.start >= 0.15 && !TOKENS.has(norm(w.text))).slice(0, 3000).map((w) => rmsDb(w.start, w.end)));

// YIN F0 of one frame starting at sample i; NaN when unvoiced.
function yin(i: number): number {
  const d = new Float64Array(LAG_MAX + 2);
  for (let tau = 1; tau <= LAG_MAX + 1; tau++) {
    let s = 0;
    for (let j = 0; j < WIN; j++) {
      const x = pcm[i + j] - pcm[i + j + tau];
      s += x * x;
    }
    d[tau] = s;
  }
  let run = 0;
  for (let tau = 1; tau <= LAG_MAX + 1; tau++) {
    run += d[tau];
    d[tau] = run > 0 ? (d[tau] * tau) / run : 1; // cumulative mean normalized difference
  }
  for (let tau = LAG_MIN; tau <= LAG_MAX; tau++) {
    if (d[tau] < 0.15) {
      while (tau + 1 <= LAG_MAX && d[tau + 1] < d[tau]) tau++;
      const a = d[tau - 1], b = d[tau], c = d[tau + 1]; // parabolic refinement
      const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
      return SR / (tau + (Number.isFinite(shift) ? shift : 0));
    }
  }
  return NaN;
}

type P = { i: number; at: string; text: string; speaker: string; dur: number; levelDb: number; f0: number | null; rangeSt: number; slopeSt: number; shape: "rise" | "fall" | "flat" | "unvoiced"; gapBefore: number; gapAfter: number; score: number };
const out: Record<number, P> = {};
for (let i = 0; i < words.length; i++) {
  const w = words[i];
  if (w.type !== "word" || !TOKENS.has(norm(w.text)) || w.end - w.start < 0.02) continue;
  const gapBefore = i > 0 ? w.start - Math.max(...words.slice(Math.max(0, i - 3), i).map((x) => x.end)) : 9;
  const gapAfter = i + 1 < words.length ? words[i + 1].start - w.end : 9;
  // Scribe makes filler spans short: grow the span into the gaps while the sound stays
  // within 18 dB of the speaker's median level (10 ms steps, 20 ms short of the neighbors).
  let ws = w.start, we = w.end;
  while (ws - 0.01 > w.start - Math.max(0, gapBefore - 0.02) && rmsDb(ws - 0.01, ws) > ref[w.speaker] - 18) ws -= 0.01;
  while (we + 0.01 < w.end + Math.max(0, gapAfter - 0.02) && rmsDb(we, we + 0.01) > ref[w.speaker] - 18) we += 0.01;
  const a = ws - 0.03, b = we + 0.03;
  const f0: [number, number][] = [];
  for (let k = S(a); k + WIN + LAG_MAX + 2 < Math.min(S(b), pcm.length); k += HOP) {
    const f = yin(k);
    if (f >= 70 && f <= 400) f0.push([k / SR, 12 * Math.log2(f / 100)]);
  }
  // Pitch in semitones re 100 Hz; drop octave jumps (> 5 st from the median).
  const med = median(f0.map((x) => x[1]));
  const v = f0.filter((x) => Math.abs(x[1] - med) < 5);
  const rangeSt = v.length >= 3 ? Math.max(...v.map((x) => x[1])) - Math.min(...v.map((x) => x[1])) : 0;
  let slopeSt = 0;
  if (v.length >= 3) {
    const mx = v.reduce((s, x) => s + x[0], 0) / v.length, my = v.reduce((s, x) => s + x[1], 0) / v.length;
    const k = v.reduce((s, x) => s + (x[0] - mx) * (x[1] - my), 0) / (v.reduce((s, x) => s + (x[0] - mx) ** 2, 0) || 1);
    slopeSt = k * (v[v.length - 1][0] - v[0][0]); // total change along the fit
  }
  const shape = v.length < 3 ? "unvoiced" : slopeSt > 1.5 ? "rise" : slopeSt < -1.5 ? "fall" : "flat";
  const dur = we - ws, levelDb = rmsDb(ws, we) - ref[w.speaker];
  const gapA = Math.max(0, gapAfter - (we - w.end)); // real silence after the sound
  // Intentional: long, moving pitch, normal level, a pause after. Unintentional: short, flat, quiet, glued.
  const pos = +(dur >= 0.4) + +(rangeSt >= 2.5) + +(levelDb >= -6) + +(gapA >= 0.3);
  const neg = +(dur < 0.25) + +(rangeSt < 1.5) + +(levelDb < -10) + +(gapA < 0.04);
  const score = Math.max(0, Math.min(1, 0.5 + 0.125 * (pos - neg)));
  out[i] = { i, at: fmt(w.start), text: w.text, speaker: w.speaker, dur: +dur.toFixed(2), levelDb: +levelDb.toFixed(1), f0: v.length ? +(100 * 2 ** (med / 12)).toFixed(0) : null, rangeSt: +rangeSt.toFixed(1), slopeSt: +slopeSt.toFixed(1), shape, gapBefore: +gapBefore.toFixed(2), gapAfter: +gapA.toFixed(2), score: +score.toFixed(2) };
}
// Laughs the transcript did not tag: sound not covered by words, 0.3-3 s, at least 3 energy
// pulses (ha-ha-ha) at 2.5-9 per second, with noisy (high zero-crossing) or unstable voicing.
const laughs: { start: number; end: number; pulses: number; zcr: number; tagged: boolean }[] = [];
{
  const F = 160, n = Math.floor(pcm.length / F);
  const e = new Float32Array(n), z = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    let s = 0, c = 0;
    for (let i = k * F; i < (k + 1) * F; i++) (s += pcm[i] * pcm[i]), (c += +(i > k * F && (pcm[i] >= 0) !== (pcm[i - 1] >= 0)));
    (e[k] = 10 * Math.log10(s / F + 1e-12)), (z[k] = c / F);
  }
  const covered = new Uint8Array(n);
  for (const w of words) if (w.type === "word") for (let k = Math.max(0, Math.floor((w.start - 0.05) * 100)); k < Math.min(n, Math.ceil((w.end + 0.05) * 100)); k++) covered[k] = 1;
  const thr = median(Object.values(ref)) - 15;
  let a = -1, quiet = 0;
  for (let k = 0; k <= n; k++) {
    const on = k < n && !covered[k] && e[k] > thr;
    if (on) { if (a < 0) a = k; quiet = 0; continue; }
    if (a < 0) continue;
    if (k < n && !covered[k] && ++quiet <= 8) continue; // bridge dips up to 80 ms
    const b = k - quiet, dur = (b - a) / 100;
    if (dur >= 0.3 && dur <= 3) {
      let pulses = 0, low = Infinity, peak = -Infinity, up = true;
      for (let i = a; i < b; i++) {
        if (up && e[i] > peak) peak = e[i];
        if (up && e[i] < peak - 6) (pulses++, (up = false), (low = e[i]));
        if (!up && e[i] < low) low = e[i];
        if (!up && e[i] > low + 6) (up = true), (peak = e[i]);
      }
      const rate = pulses / dur, zcr = z.subarray(a, b).reduce((s, v) => s + v, 0) / (b - a);
      const tagged = words.some((w) => w.type === "event" && w.start < b / 100 + 0.3 && w.end > a / 100 - 0.3);
      if (pulses >= 3 && rate >= 2.5 && rate <= 9 && zcr > 0.08) laughs.push({ start: a / 100, end: b / 100, pulses, zcr: +zcr.toFixed(3), tagged });
    }
    (a = -1), (quiet = 0);
  }
}
await Bun.write(outPath, JSON.stringify({ words: wordsPath, ref, tokens: out, laughs }, null, 1));
console.error(`laughs (audio): ${laughs.length}, ${laughs.filter((l) => l.tagged).length} next to a Scribe laugh tag; untagged at ${laughs.filter((l) => !l.tagged).map((l) => fmt(l.start)).join(" ")}`);
const all = Object.values(out);
console.error(`${all.length} tokens -> ${outPath}; speaker median levels ${JSON.stringify(Object.fromEntries(Object.entries(ref).map(([k, v]) => [k, +v.toFixed(1)])))}`);
console.error(`score >= 0.7: ${all.filter((p) => p.score >= 0.7).length}, <= 0.2: ${all.filter((p) => p.score <= 0.2).length}`);
if (values.show) {
  const want = values.show.split(",").map(parseTime);
  console.log("at        speaker text    dur  level  f0   range slope shape    gapB  gapA  score");
  for (const s of want) {
    const p = all.sort((x, y) => Math.abs(parseTime(x.at) - s) - Math.abs(parseTime(y.at) - s))[0];
    console.log(`${p.at} ${p.speaker.slice(-1)} ${p.text.padEnd(7)} ${p.dur.toFixed(2)} ${String(p.levelDb).padStart(6)} ${String(p.f0).padStart(4)} ${String(p.rangeSt).padStart(5)} ${String(p.slopeSt).padStart(5)} ${p.shape.padEnd(8)} ${p.gapBefore.toFixed(2)} ${p.gapAfter.toFixed(2)} ${p.score}`);
  }
}
