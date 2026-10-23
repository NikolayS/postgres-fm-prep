#!/usr/bin/env bun
// Join audit: score every join of an edit, worst first. A join is clean when both sides sit in
// a natural pause, no word or breath is clipped, the room tone and level do not step, the
// silence left is natural for that place, and the pitch does not jump more than it would have.
//
// Usage: bun joins.ts <out.cuts.json> [--audio edited.mp4 | --synth] [--top 30] [--json out.json]
//        [--from S] [--to S] (output seconds) [--fail-above 6] [--max-bad 0]
//   --audio: score the rendered sound. --synth (default): rebuild the sound from the source and
//   the plan at 16 kHz (same splice and room tone as render.ts), so a plan can be checked before
//   any render. --fail-above/--max-bad: exit 1 when more than --max-bad joins score above the limit
//   (regression check).
// Writes <out>.joins.json (all rows) unless --json says otherwise.
import { parseArgs } from "util";
import { VALLEY_DB, valleyThreshold } from "./plan";
import { FPS, type Edl, type Span, type Word, assembleAudio, decodePcm, fmt, levels, loadTranscript, roomToneFill } from "./lib";

export type JoinRow = {
  n: number; out: number; srcA: number; srcB: number; cat: string; ids: string[]; text: string;
  edgeA: number; edgeB: number; // dB above the local floor at each cut side (fade zone + 10 ms)
  levelX: number; specX: number; // level / spectral step across the join beyond the natural step
  breath: string; // "" | "clipped" | "removed before phrase"
  gapOut: number; gapNat: number; // silence between kept words: in the output, and natural
  pitchX: number; // semitones of pitch jump beyond the natural jump (same speaker)
  crosstalk: number; // other-speaker words in the cut +-0.3 s
  midClause: boolean;
  score: number; flags: string[];
};

const R = 16000;
const isWord = (w: Word) => w.type === "word";

// Radix-2 FFT magnitude bands (log-spaced 100-7000 Hz), dB.
function bands(x: Float32Array, c: number, n = 1024): number[] {
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = (x[c - n / 2 + i] ?? 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [re[i], re[j]] = [re[j], re[i]];
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(a * k), wi = Math.sin(a * k);
        const xr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi, xi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k + len / 2] = re[i + k] - xr, im[i + k + len / 2] = im[i + k] - xi;
        re[i + k] += xr, im[i + k] += xi;
      }
  }
  const edges = [100, 150, 220, 330, 500, 750, 1100, 1600, 2400, 3500, 5000, 7000];
  return edges.slice(0, -1).map((lo, b) => {
    let e = 0;
    for (let k = Math.floor((lo * n) / R); k < Math.ceil((edges[b + 1] * n) / R); k++) e += re[k] ** 2 + im[k] ** 2;
    return 10 * Math.log10(e + 1e-12);
  });
}
const rms = (x: Float32Array, a: number, b: number) => {
  let s = 0;
  const i0 = Math.max(0, Math.round(a * R)), i1 = Math.min(x.length, Math.round(b * R));
  for (let i = i0; i < i1; i++) s += x[i] * x[i];
  return Math.max(-80, 10 * Math.log10(s / Math.max(1, i1 - i0) + 1e-12));
};
// Spectral step between [t-w, t) and (t, t+w], shape only (mean removed), weighted by audibility.
function specStep(x: Float32Array, a: number, b: number, w: number) {
  const n = 512;
  const p = bands(x, Math.round((a - w / 2) * R), n), q = bands(x, Math.round((b + w / 2) * R), n);
  const lv = Math.max(rms(x, a - w, a), rms(x, b, b + w));
  const sh = (v: number[]) => { const m = v.reduce((s, y) => s + y, 0) / v.length; return v.map((y) => y - m); };
  const P = sh(p), Q = sh(q);
  return (Math.min(1, Math.max(0, (lv + 70) / 40)) * P.reduce((s, v, i) => s + Math.abs(v - Q[i]), 0)) / P.length;
}
// Median F0 (Hz) of voiced 40 ms frames in [a, b]; NaN if unvoiced. Normalized autocorrelation.
function f0(x: Float32Array, a: number, b: number): number {
  const out: number[] = [];
  const n = Math.round(0.04 * R);
  for (let t = a; t + 0.04 <= b; t += 0.02) {
    const i0 = Math.round(t * R);
    let best = 0, bv = 0.5;
    for (let lag = Math.round(R / 350); lag <= Math.round(R / 70); lag++) {
      let c = 0, e1 = 0, e2 = 0;
      for (let i = 0; i < n - lag; i++) (c += x[i0 + i] * x[i0 + i + lag]), (e1 += x[i0 + i] ** 2), (e2 += x[i0 + i + lag] ** 2);
      const r = c / Math.sqrt(e1 * e2 + 1e-12);
      if (r > bv) (bv = r), (best = lag);
    }
    if (best) out.push(R / best);
  }
  if (out.length < 2) return NaN;
  out.sort((p, q) => p - q);
  return out[out.length >> 1];
}
const st = (a: number, b: number) => 12 * Math.log2(b / a);

export async function auditJoins(plan: any, opts: { audio?: string; synth?: boolean; src?: Float32Array } = {}) {
  const edl: Edl = await Bun.file(plan.edl).json();
  const words = (await loadTranscript(edl.words)).words;
  const src = opts.src ?? (await decodePcm(plan.media, 1, R));
  const segs: [number, number][] = plan.segments;
  const outStarts: number[] = [];
  segs.reduce((acc, [a, b], i) => ((outStarts[i] = acc), acc + b - a), 0);
  // Room-tone spans of removed words: from the plan, or rebuilt from the removal ids (older plans).
  const byId = new Map(edl.removals.map((r) => [r.id, r]));
  const removed = new Set<Word>();
  for (const c of [...plan.cuts, ...(plan.muteOnly ?? [])]) {
    for (const id of c.ids ?? []) {
      const r = byId.get(id);
      if (r) for (const w of words) if (w.start >= r.start - 0.001 && w.end <= r.end + 0.001 && (!r.speaker || w.speaker === r.speaker)) removed.add(w);
    }
    if (!c.mutes) c.mutes = plan.audio ? [] : words.filter((w) => removed.has(w) && w.start >= c.start - 0.05 && w.end <= c.end + 0.05).map((w) => [w.start - 0.02, w.end + 0.04] as Span);
  }
  const mutes: Span[] = [...plan.cuts, ...(plan.muteOnly ?? [])].flatMap((c: any) => c.mutes);
  const muted = (t: number) => mutes.some(([a, b]) => t >= a && t <= b);
  // The source as the splice sees it (removed words under room tone).
  const filled = src.slice();
  const flv = levels(filled, 1, R);
  for (const [a, b] of mutes) roomToneFill(filled, 1, R, flv, a, b);
  const lvF = levels(filled, 1, R);
  const out = opts.audio ? await decodePcm(opts.audio, 1, R) : assembleAudio(src.slice(), 1, R, plan);

  // 10 ms levels: source, room-toned source (what the splice sees), output.
  const lv = levels(src, 1, R), lvOut = levels(out, 1, R);
  // Local floor / speech level (10th / 90th percentile within +-3 s) and the valley threshold:
  // the same rule as plan.ts (valleyThreshold).
  const cache = new Map<number, [number, number]>();
  const local = (t: number) => {
    const k = Math.max(0, Math.round(t));
    if (!cache.has(k)) {
      const a = lv.subarray(Math.max(0, (k - 3) * 100), Math.min(lv.length, (k + 3) * 100)).slice().sort();
      cache.set(k, [a[Math.floor(a.length * 0.1)] ?? -90, a[Math.floor(a.length * 0.9)] ?? -20]);
    }
    return cache.get(k)!;
  };
  const thr = (t: number) => { const [f, s] = local(t); return valleyThreshold(f, s); };
  const lvAt = (t: number) => { const i = Math.floor(t * 100); return muted(t) ? lvF[i] : lv[i]; };
  const peak = (a: number, b: number) => { let m = -120; for (let i = Math.floor(a * 100); i <= Math.floor(b * 100 - 1e-6); i++) m = Math.max(m, lvAt(i / 100 + 0.005) ?? -120); return m; };
  // Quiet run (valley) containing t: its length, in a level array; 0 if t is in sound.
  const quietRun = (x: Float32Array, t: number, th: number, src = true) => {
    const at = (i: number) => (src && muted(i / 100) ? lvF[i] : x[i]);
    let i = Math.floor(t * 100);
    if (!(at(i) <= th)) return 0;
    let a = i, z = i;
    while (a > 0 && at(a - 1) <= th && i - a < 300) a--;
    while (z < x.length - 1 && at(z + 1) <= th && z - i < 300) z++;
    return (z - a + 1) / 100;
  };
  // Breaths: 0.1-0.8 s of sound above the valley level with a peak 10+ dB under speech.
  const breaths: [number, number][] = [];
  for (let i = 0, a = -1; i <= lv.length; i++) {
    const on = i < lv.length && lv[i] > thr(i / 100);
    if (on && a < 0) a = i;
    if (!on && a >= 0) {
      let p = -120;
      for (let k = a; k < i; k++) p = Math.max(p, lv[k]);
      const s = a / 100, e = i / 100;
      if (e - s >= 0.1 && e - s <= 0.8 && p < local(s)[1] - 10) breaths.push([s, e]);
      a = -1;
    }
  }

  const ws = words.filter((w) => isWord(w) && !removed.has(w));
  // Joins: from the sample-exact audio pieces (plan.ts) or, in older plans, the frame segments.
  const pieces: { a: number; b: number; xf: number }[] = plan.audio ?? segs.map(([a, b]: [number, number]) => ({ a: a / FPS, b: b / FPS, xf: plan.cuts.find((c: any) => Math.round(c.end * FPS) === a)?.xfade ?? 0.06 }));
  const rows: JoinRow[] = [];
  let acc = pieces[0] ? pieces[0].b - pieces[0].a : 0;
  for (let k = 1; k < pieces.length; k++) {
    const A = pieces[k - 1].b, B = pieces[k].a, J = acc;
    acc += pieces[k].b - pieces[k].a;
    const c = plan.cuts.find((c: any) => Math.abs(c.end - B) < 0.021) ?? { cat: "?", ids: [], text: "" };
    const xf = pieces[k].xf ?? 0.06, h = xf / 2;
    const wa = ws.filter((w) => w.end <= A + 0.05 && w.start < A).at(-1), wb = ws.find((w) => w.start >= B - 0.05 && w.end > B);
    // Edges: loudest 10 ms in each fade zone, dB relative to the local speech level.
    const edgeA = peak(A - h, A + h) - local(A)[1], edgeB = peak(B - h, B + h) - local(B)[1];
    // Room tone: when both sides next to the join are quiet, level and spectrum should not step
    // more than they step naturally at A and at B.
    const w = 0.04;
    const q1 = rms(out, J - h - w, J - h), q2 = rms(out, J + h, J + h + w);
    let levelX = 0, specX = 0;
    if (q1 <= thr(A) + 3 && q2 <= thr(B) + 3) {
      const step = (x: Float32Array, a: number, b: number) => Math.abs(rms(x, a - w, a) - rms(x, b, b + w));
      levelX = Math.max(0, step(out, J - h, J + h) - Math.min(step(filled, A - h, A + h), step(filled, B - h, B + h)));
      specX = Math.max(0, specStep(out, J - h, J + h, w) - Math.min(specStep(filled, A - h, A + h, w), specStep(filled, B - h, B + h, w)));
    }
    // Breath: clipped by a cut point, or a whole breath right before the next phrase removed.
    const clipped = breaths.some(([s, e]) => (s < A - h && e > A + h) || (s < B - h && e > B + h));
    const removedBreath = breaths.some(([s, e]) => s >= A && e <= B && B - e < 0.15 && !breaths.some(([s2]) => s2 >= B && s2 < B + 0.4));
    const breath = clipped ? "clipped" : removedBreath ? "removed before phrase" : "";
    // Silence at the join, from the sound: the quiet run around the join in the output, vs the
    // natural quiet runs at A and B (a pause join: the one valley).
    const th = Math.max(thr(A), thr(B));
    // The cut point itself can sit at a soft dip's edge: measure from just outside the fade.
    const gapOut = Math.max(quietRun(lvOut, J - h - 0.01, th, false), quietRun(lvOut, J + h + 0.01, th, false));
    const qa = quietRun(lv, A - 0.001, thr(A)), qb = quietRun(lv, B + 0.001, thr(B));
    const gapNat = c.ids?.length ? qa + qb : Math.max(qa, qb);
    // Pitch: last 0.2 s of wa vs first 0.2 s of wb, minus wa vs its natural successor.
    let pitchX = 0;
    if (wa && wb && wa.speaker === wb.speaker) {
      const pa = f0(src, Math.max(wa.start, wa.end - 0.2), wa.end), pb = f0(src, wb.start, Math.min(wb.end, wb.start + 0.2));
      const nx = ws.find((x) => x.start >= wa.end - 0.001 && x !== wa);
      const pn = nx ? f0(src, nx.start, Math.min(nx.end, nx.start + 0.2)) : NaN;
      if (pa && pb && !Number.isNaN(pa) && !Number.isNaN(pb)) pitchX = Math.max(0, Math.abs(st(pa, pb)) - (Number.isNaN(pn) ? 2 : Math.abs(st(pa, pn))));
    }
    // Crosstalk: zero-length words (ASR sign of overlap) or another speaker's word at a cut point.
    const sp0 = wa?.speaker ?? wb?.speaker;
    const crosstalk = words.filter((x) => (x.end - x.start < 0.02 && x.start > A - 0.3 && x.start < B + 0.3) || (sp0 && x.speaker !== sp0 && ((x.start < A + h && x.end > A - h) || (x.start < B + h && x.end > B - h)))).length;
    const midClause = !!wa && !/[.?!]$/.test(wa.text) && !!wb && wb.speaker === wa.speaker;
    const flags: string[] = [];
    let score = 0;
    const add = (v: number, f: string) => { if (v > 0.3) flags.push(f); score += v; };
    // A fade zone louder than the valley level (VALLEY_DB under speech) is a cut in sound.
    add(Math.max(0, edgeA + VALLEY_DB) / 3, `A side in sound (${edgeA.toFixed(0)} dB re speech)`);
    add(Math.max(0, edgeB + VALLEY_DB) / 3, `B side in sound (${edgeB.toFixed(0)} dB re speech)`);
    add(Math.max(0, levelX - 4) / 3, `room tone level step ${levelX.toFixed(1)} dB`);
    add(Math.max(0, specX - 4) / 2, `room tone spectrum step ${specX.toFixed(1)} dB`);
    add(breath === "clipped" ? 2 : breath ? 1 : 0, `breath ${breath}`);
    add(gapOut < 0.03 && gapNat >= 0.08 ? 2 : 0, `butt-join (${gapOut.toFixed(2)} s left of ${gapNat.toFixed(2)} s)`);
    const need = Math.min(0.5, 0.45 * gapNat);
    add(gapOut < need - 0.05 ? (need - gapOut) * 6 : 0, `pause squeezed ${gapNat.toFixed(2)} -> ${gapOut.toFixed(2)} s`);
    add(Math.max(0, pitchX - 4) / 3, `pitch jump +${pitchX.toFixed(1)} st`);
    add(crosstalk ? 1 + crosstalk * 0.5 : 0, `crosstalk (${crosstalk} words)`);
    if (midClause && c.cat === "struggle") (score *= 1.2), flags.push("mid-clause struggle cut");
    rows.push({ n: k, out: +J.toFixed(2), srcA: +A.toFixed(2), srcB: +B.toFixed(2), cat: c.cat, ids: c.ids ?? [], text: c.text ?? "", edgeA: +edgeA.toFixed(1), edgeB: +edgeB.toFixed(1), levelX: +levelX.toFixed(1), specX: +specX.toFixed(1), breath, gapOut: +gapOut.toFixed(2), gapNat: +gapNat.toFixed(2), pitchX: +pitchX.toFixed(1), crosstalk, midClause, score: +score.toFixed(2), flags });
  }

  // Mute-in-place spots: the room-tone patch vs the pause around it (a hole or a bump).
  // Mute-in-place spots (older plans): a room-tone patch whose edge sits in sound chops a word.
  const spots = (plan.muteOnly ?? []).flatMap((m: any) => (m.mutes ?? []).map(([a, b]: Span) => {
    const ea = (lv[Math.round((a - 0.02) * 100)] ?? -120) - local(a)[1], eb = (lv[Math.round((b + 0.01) * 100)] ?? -120) - local(b)[1];
    return { src: +a.toFixed(2), text: m.text, edgeA: +ea.toFixed(1), edgeB: +eb.toFixed(1), chopped: ea > -26 || eb > -26 };
  }));
  // Rhythm: share of pause-only joins that land within 0.1 s of the most common length.
  const pauseGaps = rows.filter((r) => r.cat === "pause").map((r) => r.gapOut);
  const hist = new Map<number, number>();
  for (const g of pauseGaps) hist.set(Math.round(g * 10) / 10, (hist.get(Math.round(g * 10) / 10) ?? 0) + 1);
  const mode = [...hist].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
  const uniform = pauseGaps.filter((g) => Math.abs(g - mode) <= 0.1).length / Math.max(1, pauseGaps.length);
  return { rows, mutes: spots, rhythm: { pauseJoins: pauseGaps.length, mode, shareNearMode: +uniform.toFixed(2) }, breaths: breaths.length };
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2), allowPositionals: true,
    options: { audio: { type: "string" }, synth: { type: "boolean", default: false }, top: { type: "string", default: "30" }, json: { type: "string" }, from: { type: "string" }, to: { type: "string" }, "fail-above": { type: "string", default: "6" }, "max-bad": { type: "string" } },
  });
  const [planPath] = positionals;
  if (!planPath) { console.error("usage: bun joins.ts <out.cuts.json> [--audio edited.mp4 | --synth] [--top 30]"); process.exit(2); }
  const plan = await Bun.file(planPath).json();
  const res = await auditJoins(plan, { audio: values.audio });
  const lo = Number(values.from ?? 0), hi = Number(values.to ?? Infinity);
  const rows = res.rows.filter((r) => r.out >= lo && r.out <= hi);
  await Bun.write(values.json ?? planPath.replace(/\.cuts\.json$/, "") + ".joins.json", JSON.stringify({ ...res, rows }, null, 1));
  const lim = Number(values["fail-above"]);
  const bad = rows.filter((r) => r.score > lim);
  const sum = rows.reduce((s, r) => s + r.score, 0);
  const holes = res.mutes.filter((m: any) => m.chopped).length;
  console.log(`joins ${rows.length}: score sum ${sum.toFixed(1)}, mean ${(sum / Math.max(1, rows.length)).toFixed(2)}, above ${lim}: ${bad.length}, above 3: ${rows.filter((r) => r.score > 3).length}, clean (<1): ${rows.filter((r) => r.score < 1).length}`);
  console.log(`pause rhythm: ${res.rhythm.pauseJoins} pause joins, ${Math.round(res.rhythm.shareNearMode * 100)}% within 0.1 s of ${res.rhythm.mode} s; muted-in-place patches ${res.mutes.length}, edge in sound (chopped word): ${holes}`);
  for (const r of [...rows].sort((a, b) => b.score - a.score).slice(0, Number(values.top)))
    console.log(`${r.score.toFixed(1).padStart(5)} out ${fmt(r.out)} src ${fmt(r.srcA)}-${fmt(r.srcB)} ${r.cat.padEnd(10)} ${r.flags.join("; ")}${r.text ? ` | "${r.text.slice(0, 50)}"` : ""}`);
  if (values["max-bad"] !== undefined && bad.length > Number(values["max-bad"])) { console.error(`FAIL: ${bad.length} joins score above ${lim} (max ${values["max-bad"]})`); process.exit(1); }
}
