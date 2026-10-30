// Cut planning from the sound, not from word timestamps alone.
//
// ASR word times (Scribe) are often off by 0.2-0.5 s, worst at fillers and stutters. A cut placed
// by them lands inside a syllable. So: split the audio into sound runs and valleys (10 ms levels),
// map every word boundary to a valley (or "glued": no valley, the words run together), and cut
// only inside valleys:
//   - a removal is cut only when the boundary before its first word and the boundary after its
//     last word are both real valleys. Glued to a kept word = not cut (kept, and listed).
//   - a breath right before the next phrase stays (the cut ends before it).
//   - the silence left is the natural silence around the removal, compressed only when long, by a
//     smooth monotonic curve (pause lengths stay varied and proportional).
//   - audio cut points are sample-exact (video follows to the nearest frame); crossfades are
//     equal-power and stay inside the valleys.
import { type Removal, type Word, isLaugh } from "./lib";

export type Run = { s: number; e: number; peak: number }; // sound run, seconds; peak dBFS
export type PlannedCut = {
  start: number; end: number; xfade: number; ids: string[]; cats: string[]; text: string;
  gapBefore: number; gapAfter: number; why: string;
};
export type PlanParams = {
  maxGap: number; // valleys longer than this get compressed (s)
  turnExtra: number; // extra silence kept at a speaker change (s)
  beatCap: number; // protected pauses (beats, laughs) keep up to this (s)
  headKeep: number; tailKeep: number;
  keepPauses?: number[]; // source times of pause joins not to compress (reverted after the audit)
};
export const DEFAULT_PARAMS: PlanParams = { maxGap: 0.9, turnExtra: 0.1, beatCap: 2.5, headKeep: 0.3, tailKeep: 1.0 };

// Pause curve: unchanged up to maxGap, then compressed smoothly and monotonically.
// 0.9 -> 0.9, 1.2 -> 1.02, 1.5 -> 1.14, 2 -> 1.34, 3 -> 1.49, 5 -> 1.79, cap 1.8 s.
export function pauseTarget(g: number, maxGap = 0.9): number {
  if (g <= maxGap) return g;
  const a = maxGap + 0.4 * (Math.min(g, 2) - maxGap);
  return Math.min(1.8, g > 2 ? a + 0.15 * (g - 2) : a);
}

const MIN_VALLEY = 0.03; // s; a cut point needs this much quiet (after the 10 ms margins)
const XF_MAX = 0.12, XF_MIN = 0.012;
export const VALLEY_DB = 30; // a valley is this far under the local speech level (or near the floor)
export const SOFT_VALLEY_DB = 20; // "soft" judgment rows: a 20 ms dip this far under speech will do
// Valley level from the local floor f and speech level s (dBFS): `db` under speech. Only where the
// floor is noisy (closer than db + 6 to speech) the floor + 6 counts, never above s - (db - 6).
export const valleyThreshold = (f: number, s: number, db = VALLEY_DB) => Math.max(s - db, Math.min(f + 6, s - db + 6));
const EDGE = 0.01; // s; cut points and fades keep this clear of the sound runs (10 ms level frames)
const AUTO = ["filler", "repeat", "falsestart"];

export function planCuts(o: {
  words: Word[]; removals: Removal[]; lv: Float32Array; duration: number;
  beats?: { start: number; end: number; side: string }[]; laughs?: { start: number; end: number }[];
  params?: Partial<PlanParams>;
}) {
  const P = { ...DEFAULT_PARAMS, ...o.params };
  const { words, lv, duration } = o;
  const N = lv.length;
  // Local floor and speech level: 10th and 90th percentile within +-3 s, cached per second.
  const cache = new Map<number, [number, number]>();
  const local = (t: number): [number, number] => {
    const k = Math.max(0, Math.round(t));
    if (!cache.has(k)) {
      const a = lv.subarray(Math.max(0, (k - 3) * 100), Math.min(N, (k + 3) * 100)).slice().sort();
      cache.set(k, [a[Math.floor(a.length * 0.1)] ?? -90, a[Math.floor(a.length * 0.9)] ?? -20]);
    }
    return cache.get(k)!;
  };
  // Valley: 10 ms level 30 dB under the local speech level (valleyThreshold).
  const quiet = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const [f, s] = local(i / 100); quiet[i] = lv[i] <= valleyThreshold(f, s) ? 1 : 0; }
  const valleyLevel = (i: number) => { const [f, s] = local(i / 100); return valleyThreshold(f, s); };
  const runs: Run[] = [];
  for (let i = 0, a = -1; i <= N; i++) {
    const on = i < N && !quiet[i];
    if (on && a < 0) a = i;
    if (!on && a >= 0) {
      let p = -120;
      for (let k = a; k < i; k++) p = Math.max(p, lv[k]);
      // Runs split only by a valley of 2+ frames.
      if (runs.length && a / 100 - runs[runs.length - 1].e < 0.02) { const r = runs[runs.length - 1]; r.e = i / 100; r.peak = Math.max(r.peak, p); }
      else runs.push({ s: a / 100, e: i / 100, peak: p });
      a = -1;
    }
  }
  // A run shorter than 40 ms that stays 20 dB under speech is a click or a blip: part of the
  // valley. A short loud run (a cut-off "t-") is sound and stays a run.
  for (let i = runs.length - 1; i >= 0; i--) if (runs[i].e - runs[i].s < 0.04 && runs[i].peak < local(runs[i].s)[1] - 20) runs.splice(i, 1);
  // Valley v lies between run v and run v + 1.
  const V = runs.length - 1;
  const vs = (v: number) => runs[v].e + EDGE, ve = (v: number) => runs[v + 1].s - EDGE, vlen = (v: number) => Math.max(0, ve(v) - vs(v));
  const firstValleyAfter = (t: number) => { let lo = 0, hi = V; while (lo < hi) { const m = (lo + hi) >> 1; if (ve(m) < t) lo = m + 1; else hi = m; } return lo; };
  const isBreath = (r: Run) => { const [, s] = local(r.s); return r.peak < s - 10 && r.e - r.s >= 0.1 && r.e - r.s <= 0.8; };

  // Words with a duration, in time order. Zero-length words (crosstalk) are not placed.
  const ws = words.filter((w) => (w.type === "word" || isLaugh(w)) && w.end - w.start >= 0.02);
  // bnd[i]: the valley at the boundary between ws[i] and ws[i + 1], or -1 (glued).
  // DP per chunk over boundaries; state = last valley used. Costs in seconds:
  //   valley v for boundary i: distance between the ASR gap and the valley (0 if they overlap)
  //   glued: 0.12 + the ASR gap beyond 0.1 s (the ASR heard a pause, the sound has none)
  //   a valley no boundary uses lies inside a word: 0.5 x its length, plus 3 x beyond 0.15 s.
  const bnd = new Int32Array(Math.max(0, ws.length - 1)).fill(-1);
  const inWordCost = (v: number) => 0.5 * vlen(v) + 3 * Math.max(0, vlen(v) - 0.15);
  for (let i0 = 0; i0 < ws.length - 1; ) {
    let i1 = i0 + 1;
    while (i1 < ws.length - 1 && ws[i1 + 1].start - ws[i1].end < 2.0) i1++;
    // Boundaries i0 .. i1-1 (words i0 .. i1); a gap of 2 s or more always maps to the valley under it.
    alignChunk(i0, i1);
    if (i1 < ws.length - 1) {
      const v = firstValleyAfter((ws[i1].end + ws[i1 + 1].start) / 2);
      if (v < V && vs(v) < ws[i1 + 1].start + 0.3) bnd[i1] = v;
    }
    i0 = i1 + 1;
  }
  function alignChunk(i0: number, i1: number) {
    const nb = i1 - i0;
    if (nb <= 0) return;
    const v0 = Math.max(0, firstValleyAfter(ws[i0].start - 1.0)), v1 = Math.min(V, firstValleyAfter(ws[i1].end + 1.0) + 1);
    const m = v1 - v0; // local valleys 0..m-1; state u = -1..m-1 -> index u+1
    const INF = 1e9;
    const f = Array.from({ length: nb + 1 }, () => new Float64Array(m + 1).fill(INF));
    const back = Array.from({ length: nb + 1 }, () => new Int32Array(m + 1).fill(-2));
    const choice = Array.from({ length: nb + 1 }, () => new Int32Array(m + 1).fill(-1));
    // Start: valleys before the first word start are free.
    for (let u = -1; u < m; u++) if (u < 0 || ve(v0 + u) <= ws[i0].start + 0.05) f[0][u + 1] = 0;
    for (let b = 0; b < nb; b++) {
      const a = ws[i0 + b], z = ws[i0 + b + 1];
      const g0 = Math.min(a.end, z.start), g1 = Math.max(a.end, z.start);
      for (let u = -1; u < m; u++) {
        const c0 = f[b][u + 1];
        if (c0 >= INF) continue;
        const glue = c0 + 0.12 + Math.max(0, z.start - a.end - 0.1);
        if (glue < f[b + 1][u + 1]) (f[b + 1][u + 1] = glue), (back[b + 1][u + 1] = u), (choice[b + 1][u + 1] = -1);
        let skip = 0;
        for (let v = u + 1; v < m; v++) {
          const s = vs(v0 + v), e = ve(v0 + v);
          if (s > g1 + 1.0) break;
          const d = Math.max(0, s - g1, g0 - e);
          if (d <= 1.0) {
            const c = c0 + skip + d;
            if (c < f[b + 1][v + 1]) (f[b + 1][v + 1] = c), (back[b + 1][v + 1] = u), (choice[b + 1][v + 1] = v);
          }
          // Skipping v: it lies inside a word.
          skip += inWordCost(v0 + v);
        }
      }
    }
    // End: valleys used after the last word's end cost nothing more.
    let bu = -1, bc = INF;
    for (let u = -1; u < m; u++) if (f[nb][u + 1] < bc) (bc = f[nb][u + 1]), (bu = u);
    for (let b = nb, u = bu; b > 0; b--) {
      const c = choice[b][u + 1];
      bnd[i0 + b - 1] = c >= 0 ? v0 + c : -1;
      u = back[b][u + 1];
    }
  }

  // Which words go.
  const removedBy = new Map<Word, Removal>();
  for (const r of o.removals)
    for (const w of words) if (w.start >= r.start - 0.001 && w.end <= r.end + 0.001 && (!r.speaker || w.speaker === r.speaker)) removedBy.set(w, r);
  const keptIdx = ws.map((w, i) => (removedBy.has(w) ? -1 : i)).filter((i) => i >= 0);
  const laughs = [...(o.laughs ?? []), ...words.filter(isLaugh)];
  const laughIn = (a: number, b: number) => laughs.some((l) => l.start < b && l.end > a);
  const beats = o.beats ?? [];
  const protectedAt = (wa: Word, wb: Word) =>
    beats.some((b) => (b.side === "after" && Math.abs(b.end - wa.end) < 0.3) || (b.side === "before" && Math.abs(b.start - wb.start) < 0.3)) || laughIn(wa.end - 0.3, wb.start + 0.3) || isLaugh(wa) || isLaugh(wb);

  const cuts: PlannedCut[] = [];
  const keptRows = new Map<string, string>(); // removal id -> why it was not cut
  // Place a join: keep T of silence, split between the left valley and the right valley in
  // proportion to their lengths (one valley: 55% before the cut point, 45% after).
  // Place a join: keep about T of silence, taken from the left valley l and the right valley r
  // (the same valley for a pause join). Searched on a 10 ms grid: each fade zone must be clear of
  // loud frames (a valley can hold a click), the room tone on both sides should match (Zoom gates
  // some pauses to near silence: joining hiss to a gated hole is a step), and the kept silence
  // should stay near T. Returns null when no clean pair exists.
  const softLevel = (i: number) => { const [f, s] = local(i / 100); return valleyThreshold(f, s, SOFT_VALLEY_DB); };
  const clear = (t: number, h: number, soft: boolean) => { for (let i = Math.floor((t - h) * 100 + 1e-6); i <= Math.floor((t + h) * 100 - 1e-6); i++) if (lv[i] > (soft ? softLevel(i) : valleyLevel(i))) return false; return true; };
  const room = (a: number, b: number) => { let e = 0, n = 0; for (let i = Math.floor(a * 100); i < Math.floor(b * 100); i++) (e += 10 ** (Math.max(-80, lv[i]) / 10)), n++; return n ? 10 * Math.log10(e / n) : -80; };
  type Span = { s: number; e: number; soft?: boolean };
  const valley = (v: number): Span => ({ s: vs(v), e: ve(v) });
  function place(L: Span, Rv: Span, T: number) {
    const same = L.s === Rv.s && L.e === Rv.e;
    const gl = L.e - L.s, gr = Rv.e - Rv.s;
    // Fade half h: a quarter of a valley (a cut point has room to move), all of a soft dip's half.
    const cap = (sp: Span) => (sp.e - sp.s) / (sp.soft ? 2 : 4);
    const h = Math.max(XF_MIN / 2, Math.min(XF_MAX / 2, cap(L), cap(Rv)));
    const g = same ? gl : gl + gr;
    if (Math.min(gl, gr) < 2 * h - 1e-9) return null;
    T = Math.max(2 * h, Math.min(T, g - 2 * h));
    let best: { A: number; B: number; T: number; c: number } | null = null;
    // Grid points rounded to 10 us, as the plan JSON stores them (so the audit sees the same frames).
    for (let A0 = L.s + h; A0 <= L.e - h + 1e-9; A0 += 0.01) {
      const A = Math.round(A0 * 1e5) / 1e5;
      if (!clear(A, h, !!L.soft)) continue;
      const ra = room(A - h - 0.04, A - h);
      for (let B0 = Rv.s + h; B0 <= Rv.e - h + 1e-9; B0 += 0.01) {
        const B = Math.round(B0 * 1e5) / 1e5;
        if (same && B - A < 0.02) continue;
        const kept = A - L.s + (Rv.e - B);
        const dev = Math.abs(kept - T) / T;
        if (dev > 0.35) continue;
        if (!clear(B, h, !!Rv.soft)) continue;
        const c = Math.abs(ra - room(B + h, B + h + 0.04)) + 12 * dev;
        if (!best || c < best.c) best = { A, B, T: kept, c };
      }
    }
    return best ? { A: best.A, B: best.B, xf: 2 * h, T: best.T, g } : null;
  }
  // Soft dip for a "soft" judgment row: a run of 2+ frames (20 ms) under the soft level; the fade
  // then fills the dip exactly
  // between the midpoints of the two words, nearest to the ASR boundary t.
  function softDip(t: number, lo: number, hi: number): Span | null {
    let best: Span | null = null, bc = Infinity;
    for (let i = Math.ceil(lo * 100), a = -1; i <= Math.floor(hi * 100) + 1; i++) {
      const on = i <= Math.floor(hi * 100) && lv[i] <= softLevel(i);
      if (on && a < 0) a = i;
      if (!on && a >= 0) {
        if (i - a >= 2) { const sp = { s: a / 100, e: i / 100, soft: true }; const c = Math.max(0, sp.s - t, t - sp.e) - 0.1 * (sp.e - sp.s); if (c < bc) (bc = c), (best = sp); }
        a = -1;
      }
    }
    return best;
  }

  // Head: everything before the first kept word; tail: everything after the last one.
  if (keptIdx.length) {
    const first = ws[keptIdx[0]], last = ws[keptIdx[keptIdx.length - 1]];
    const vh = keptIdx[0] > 0 && bnd[keptIdx[0] - 1] >= 0 ? bnd[keptIdx[0] - 1] : firstValleyAfter(first.start - 0.3);
    // Clamp to the valley: word ends are often late, and the next word must not leak in.
    const headEnd = Math.max(vs(vh), Math.min(first.start, ve(vh)) - Math.min(P.headKeep, vlen(vh)));
    const headIds = [...new Set(words.filter((w) => removedBy.has(w) && w.end <= first.start + 0.01).map((w) => removedBy.get(w)!.id))];
    if (headEnd > 0.05) cuts.push({ start: 0, end: headEnd, xfade: 0, ids: headIds, cats: ["head"], text: "", gapBefore: 0, gapAfter: 0, why: "head" });
    const li = keptIdx[keptIdx.length - 1];
    const vt = li < ws.length - 1 && bnd[li] >= 0 ? bnd[li] : firstValleyAfter(last.end);
    const tailStart = Math.min(ve(vt), Math.max(last.end, vs(vt)) + Math.min(P.tailKeep, vlen(vt)));
    const tailIds = [...new Set(words.filter((w) => removedBy.has(w) && w.start >= last.end - 0.01).map((w) => removedBy.get(w)!.id))];
    if (tailStart < duration - 0.05) cuts.push({ start: tailStart, end: duration, xfade: 0, ids: tailIds, cats: ["tail"], text: "", gapBefore: 0, gapAfter: 0, why: "tail" });
  }

  const ok = (v: number) => v >= 0 && v < V && vlen(v) >= MIN_VALLEY;
  // Search window for a cut point between words x and y: from inside x to inside y. ASR times
  // stretch some words, so the window opens up to 0.4 s into each word, at most half of it.
  const winLo = (x: Word) => x.start + Math.min(0.5 * (x.end - x.start), 0.4);
  const winHi = (y: Word) => y.end - Math.min(0.5 * (y.end - y.start), 0.4);
  // The clean valley nearest the ASR boundary t inside [lo, hi] (judgment rows, when the word
  // alignment glued the boundary).
  const nearValley = (t: number, lo: number, hi: number) => {
    let bv = -1, bc = Infinity;
    for (let v = firstValleyAfter(lo); v < V && vs(v) <= hi; v++) {
      if (!ok(v) || vs(v) < lo || ve(v) > hi) continue;
      const c = Math.max(0, vs(v) - t, t - ve(v)) - 0.2 * Math.min(vlen(v), 0.3);
      if (c < bc) (bc = c), (bv = v);
    }
    return bv;
  };
  // Try to cut the removed words ws[i1+1 .. i2] (neighbors ws[i1] and ws[i2+1] stay).
  function tryCut(i1: number, i2: number): PlannedCut | string {
    const wa = ws[i1], wb = ws[i2 + 1], first = ws[i1 + 1], last = ws[i2];
    const span = ws.slice(i1 + 1, i2 + 1);
    const zero = words.filter((w) => w.end - w.start < 0.02 && w.start > wa.end - 0.3 && w.start < wb.start + 0.3);
    const inside = [...span, ...zero.filter((w) => removedBy.has(w) && w.start >= wa.end - 0.01 && w.end <= wb.start + 0.01)];
    const ids = [...new Set(inside.map((w) => removedBy.get(w)!.id))];
    const cats = [...new Set(inside.map((w) => removedBy.get(w)!.cat))];
    const judged = cats.some((c) => !AUTO.includes(c));
    const turn = wa.speaker !== wb.speaker;
    const prot = protectedAt(wa, wb);
    let l = bnd[i1], r = bnd[i2];
    const tA = (wa.end + first.start) / 2, tB = (last.end + wb.start) / 2;
    if (judged && !ok(l)) l = nearValley(tA, winLo(wa), winHi(first));
    if (judged && !ok(r)) r = nearValley(tB, winLo(last), winHi(wb));
    // A breath right before the next phrase stays: end the cut one valley earlier.
    if (ok(l) && ok(r) && r - 1 > l && isBreath(runs[r]) && ok(r - 1)) r = r - 1;
    let Ls: Span | null = ok(l) ? valley(l) : null;
    let Rs: Span | null = ok(r) && r > l ? valley(r) : null;
    // "soft" judgment rows (agent decision): a shallower dip will do at a run-together edge.
    const soft = inside.some((w) => removedBy.get(w)!.soft);
    if (soft && !Ls) Ls = softDip(tA, winLo(wa), winHi(first));
    if (soft && !Rs) Rs = softDip(tB, winLo(last), winHi(wb));
    if (!Ls || !Rs || Rs.s <= Ls.e) return `no clean pause ${!Ls ? "before" : "after"} it (the words run together)`;
    if (!judged && zero.some((w) => !removedBy.has(w))) return "crosstalk (overlapping words)";
    // Untranscribed sound: much more sound in the cut than the removed words account for.
    let sound = 0;
    for (const run of runs) if (run.s >= Ls.e && run.e <= Rs.s && !isBreath(run)) sound += run.e - run.s;
    const said = span.reduce((s, w) => s + w.end - w.start, 0);
    if (!judged && sound > said + 0.6) return `untranscribed sound in the cut (${(sound - said).toFixed(2)} s)`;
    if (laughIn(Ls.s, Rs.e) && !inside.some((w) => removedBy.get(w)!.cutLaugh)) return "laugh in the cut";
    const g = Ls.e - Ls.s + (Rs.e - Rs.s);
    const T = prot ? Math.min(g, P.beatCap) : pauseTarget(g, P.maxGap) + (turn && g > 0.3 ? P.turnExtra : 0);
    const p = place(Ls, Rs, T);
    if (!p) return "no clean cut point in the pauses (clicks or noise)";
    // Cross-check with the word times (off by up to ~0.5 s, so only gross mismatches count): a kept
    // word mostly inside the cut, or removed words mostly outside it, mean the alignment slipped.
    const ov = (w: Word) => Math.max(0, Math.min(w.end, p.B) - Math.max(w.start, p.A));
    const lost = ws.filter((w) => !removedBy.has(w) && w.end - w.start >= 0.05 && ov(w) > 0.5 * (w.end - w.start));
    if (lost.length) return `the cut would take kept words (${lost.map((w) => w.text).join(" ")})`;
    const far = span.filter((w) => w.end + 0.3 < p.A || w.start - 0.3 > p.B);
    if (far.length) return `the removed words are not where the cut would be (${far.map((w) => w.text).join(" ")})`;
    const why = [prot ? "beat/laugh pause kept" : "", Ls.soft || Rs.soft ? `soft edge (${[Ls.soft ? "start" : "", Rs.soft ? "end" : ""].filter(Boolean).join(", ")})` : ""].filter(Boolean).join("; ");
    return { start: p.A, end: p.B, xfade: p.xf, ids, cats, text: span.map((w) => w.text).join(" "), gapBefore: g, gapAfter: p.T, why };
  }
  // Removed words between two kept words form groups (one per removal row). Cut the longest run of
  // whole groups that can be cut clean; then try the groups left on each side. A group that
  // cannot be cut stays, with the reason.
  function solve(groups: [number, number][]) {
    if (!groups.length) return;
    const ranges: [number, number, number][] = [];
    for (let p = 0; p < groups.length; p++) for (let q = p; q < groups.length; q++) ranges.push([p, q, ws[groups[q][1]].end - ws[groups[p][0]].start]);
    ranges.sort((x, y) => y[2] - x[2]);
    const reasons = new Map<number, string>();
    for (const [p, q] of ranges) {
      const res = tryCut(groups[p][0] - 1, groups[q][1]);
      if (typeof res !== "string") { cuts.push(res); solve(groups.slice(0, p)); solve(groups.slice(q + 1)); return; }
      if (p === q) reasons.set(p, res);
    }
    groups.forEach((g, i) => { for (const w of ws.slice(g[0], g[1] + 1)) keptRows.set(removedBy.get(w)!.id, reasons.get(i) ?? "no clean cut"); });
  }

  for (let k = 1; k < keptIdx.length; k++) {
    const ia = keptIdx[k - 1], ib = keptIdx[k];
    const wa = ws[ia], wb = ws[ib];
    const turn = wa.speaker !== wb.speaker;
    const prot = protectedAt(wa, wb);
    if (ib - ia > 1) {
      const groups: [number, number][] = [];
      for (let i = ia + 1; i < ib; i++) {
        if (groups.length && removedBy.get(ws[i]) === removedBy.get(ws[i - 1])) groups[groups.length - 1][1] = i;
        else groups.push([i, i]);
      }
      solve(groups);
      continue;
    }
    // Pause only: compress the valley between the two kept words if it is long.
    const v = bnd[ia];
    if (v < 0 || prot) continue;
    const g = vlen(v);
    if (g <= P.maxGap) continue;
    const T = Math.min(g, pauseTarget(g, P.maxGap) + (turn ? P.turnExtra : 0));
    if (g - T < 0.15) continue; // too little to gain for a join
    if (P.keepPauses?.some((t) => t >= vs(v) - 0.01 && t <= ve(v) + 0.01)) continue;
    const p = place(valley(v), valley(v), T);
    if (!p) continue;
    if (ws.some((w) => w.end - w.start >= 0.05 && Math.min(w.end, p.B) - Math.max(w.start, p.A) > 0.5 * (w.end - w.start))) continue; // a word sits in this "pause"
    if (cuts.some((c) => c.start < p.B && c.end > p.A)) continue; // the same valley, reached from another word pair (crosstalk)
    cuts.push({ start: p.A, end: p.B, xfade: p.xf, ids: [], cats: [], text: "", gapBefore: g, gapAfter: T, why: "" });
  }
  // For judgment rows that stay: the words around them with every clean cut point marked "||",
  // so the agent can move the row's edges to clean points (or leave it).
  const cleanPoints = (r: Removal) => {
    const near = ws.filter((w) => w.end > r.start - 2.5 && w.start < r.end + 2.5);
    return near.map((w, i) => {
      const x = near[i + 1];
      const inR = removedBy.get(w) === r;
      const mark = x && nearValley((w.end + x.start) / 2, winLo(w), winHi(x)) >= 0 ? " || " : " ";
      return `${inR && removedBy.get(near[i - 1]) !== r ? "[" : ""}${w.text}${inR && (!x || removedBy.get(x) !== r) ? "]" : ""}${mark}`;
    }).join("").replace(/ +/g, " ").trim();
  };
  const hints = new Map<string, string>();
  for (const r of o.removals) if (!AUTO.includes(r.cat) && keptRows.has(r.id)) hints.set(r.id, cleanPoints(r));
  // Removal rows that never reached a cut: their words had no duration or no kept neighbors.
  for (const r of o.removals) if (!keptRows.has(r.id) && !cuts.some((c) => c.ids.includes(r.id))) keptRows.set(r.id, "no clean place to cut (zero-length or overlapping words)");
  cuts.sort((a, b) => a.start - b.start);
  return { cuts, kept: keptRows, hints, runs, bnd, ws };
}

// Output pieces: kept source audio [a, b) in seconds, xf = crossfade at the start of the piece.
export function piecesFrom(cuts: PlannedCut[], duration: number) {
  const pieces: { a: number; b: number; xf: number }[] = [];
  let t = 0, xf = 0;
  for (const c of cuts) {
    if (c.start > t + 1e-3) pieces.push({ a: t, b: c.start, xf });
    t = Math.max(t, c.end);
    xf = c.xfade;
  }
  if (duration > t + 1e-3) pieces.push({ a: t, b: duration, xf });
  return pieces;
}

// Video segments [startFrame, endFrame) that follow the audio pieces: each piece starts at its
// nearest source frame and gets as many frames as keep the running output video length within
// half a frame of the running audio length (lip sync within 20 ms at 25 fps).
export function videoSegments(pieces: { a: number; b: number }[], fps: number, frames: number) {
  const segs: [number, number][] = [];
  let outA = 0, outV = 0;
  for (const p of pieces) {
    outA += p.b - p.a;
    const n = Math.round(outA * fps) - outV;
    if (n <= 0) continue;
    const f0 = Math.min(frames - 1, Math.round(p.a * fps));
    const f1 = Math.min(frames, f0 + n);
    if (segs.length && segs[segs.length - 1][1] === f0) segs[segs.length - 1][1] = f1;
    else segs.push([f0, f1]);
    outV += f1 - f0;
  }
  return segs;
}
