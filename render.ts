#!/usr/bin/env bun
// EDL -> cut plan -> edited video. Writes <out>.cuts.json and <out>.cuts.md next to the output.
// Usage: bun render.ts <edl.json> <out.mp4> [--keep bot,r0012] [--plan-only] [--work dir]
//        [--until 480] [--max-gap 1.0] [--join-min 0.2] [--turn-extra 0.15] [--crf 19] [--preset medium]
import { $ } from "bun";
import { parseArgs } from "util";
import { type Edl, type Removal, type Word, FPS, FRAME_S, RATE, energy, fmt, isLaugh, loadTranscript } from "./lib";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    keep: { type: "string", default: "" }, // categories or removal ids to NOT cut
    "plan-only": { type: "boolean", default: false },
    until: { type: "string" }, // preview: render only this many seconds of OUTPUT
    "max-gap": { type: "string", default: "1.0" }, // only silences longer than this get shortened
    "join-min": { type: "string", default: "0.2" }, // smallest silence at a join (or the original, if shorter)
    "turn-extra": { type: "string", default: "0.15" }, // extra silence kept when the speaker changes
    crf: { type: "string", default: "19" },
    preset: { type: "string", default: "medium" },
    work: { type: "string" }, // temp dir (about 1.5 GB of PCM); default <out>.work
  },
});
const [edlPath, out] = positionals;
if (!edlPath || !out) {
  console.error("usage: bun render.ts <edl.json> <out.mp4> [--keep bot,r0012] [--plan-only] [--until 480]");
  process.exit(2);
}
const MAX_GAP = Number(values["max-gap"]), JOIN_MIN = Number(values["join-min"]), TURN_EXTRA = Number(values["turn-extra"]);
const BEAT_CAP = 2.5; // s; a beat keeps its pause up to this
const XFADE_MIN = 0.06, XFADE_MAX = 0.12; // s, equal-power crossfade; longer for longer cuts
const HEAD_KEEP = 0.3, TAIL_KEEP = 1.0; // s of silence kept before the first and after the last word
// Pause compression, scaled to length: 1.2 s -> 0.6 s, 3 s and longer -> 0.8 s. Shorter ones stay.
const squeeze = (s: number) => (s <= MAX_GAP ? s : Math.min(s, Math.max(0.6, Math.min(0.8, 0.6 + ((s - 1.2) / 1.8) * 0.2))));
const base = out.replace(/\.mp4$/, "");
const work = values.work ?? `${base}.work`;
await $`mkdir -p ${work}`.quiet();

const edl: Edl = await Bun.file(edlPath).json();
const t = await loadTranscript(edl.words);
const media = edl.media;
const db = await energy(media, `${work}/energy.f32`);
const frames = Math.floor(Number((await $`ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of csv=p=0 ${media}`.text()).trim()));
const duration = frames / FPS;

// ---- 1. Which words go -------------------------------------------------------------
const vetoed = new Set(values.keep!.split(",").filter(Boolean));
const active = edl.removals.filter((r) => !r.keep && !vetoed.has(r.cat) && !vetoed.has(r.id));
const words = t.words;
const owner = new Map<Word, Removal>();
for (const r of active)
  for (const w of words)
    if (w.start >= r.start - 0.001 && w.end <= r.end + 0.001 && (!r.speaker || w.speaker === r.speaker)) owner.set(w, r);
const AUTO = ["filler", "repeat", "falsestart"];

// Levels: noise floor, "voiced" (breath, quiet sound) and "speech".
const sorted = Float32Array.from(db).sort();
const floor = sorted[Math.floor(sorted.length * 0.05)];
const speech = sorted[Math.floor(sorted.length * 0.6)];
const VOICED = floor + 0.55 * (speech - floor);
const SPEECH = floor + 0.8 * (speech - floor);
const dbAt = (s: number) => db[Math.round(s / FRAME_S)] ?? -120;

// Breaths: runs of 0.12-0.8 s above floor + 8 dB and below speech, in a gap between words.
// A cut point never falls inside one (keep the whole breath or cut the whole breath).
const breaths: [number, number][] = [];
{
  let a = -1;
  for (let i = 0; i <= db.length; i++) {
    const on = i < db.length && db[i] > floor + 8 && db[i] < SPEECH;
    if (on && a < 0) a = i;
    if (!on && a >= 0) {
      const s = a * FRAME_S, e = i * FRAME_S;
      if (e - s >= 0.12 && e - s <= 0.8 && !words.some((w) => w.start < e + 0.03 && w.end > s - 0.03)) breaths.push([s, e]);
      a = -1;
    }
  }
}
// Local room-tone floor: 10th percentile of the 10 ms levels within +-3 s (cached per second).
const floorCache = new Map<number, number>();
function localFloor(s: number): number {
  const k = Math.round(s);
  if (!floorCache.has(k)) {
    const a = db.subarray(Math.max(0, (k - 3) * 100), Math.min(db.length, (k + 3) * 100)).slice().sort();
    floorCache.set(k, a[Math.floor(a.length * 0.1)] ?? floor);
  }
  return floorCache.get(k)!;
}
const inBreath = (s: number) => breaths.some(([a, b]) => s > a - 0.02 && s < b + 0.02);

// Laughs (transcript tags) and beats (judgment): the silence next to them is not shortened.
const laughs = words.filter(isLaugh);
const beats = edl.beats ?? [];
const audioLaughs = edl.laughs ?? [];
const laughIn = (lo: number, hi: number) => audioLaughs.some((l) => l.start < hi && l.end > lo);
function protectedGap(a: Word | undefined, b: Word | undefined): string {
  if ((a && isLaugh(a)) || (b && isLaugh(b))) return "laugh";
  if (a && b && laughIn(a.end - 0.3, b.start + 0.3)) return "laugh";
  if (a && beats.some((x) => x.side === "after" && Math.abs(x.end - a.end) < 0.05)) return "beat";
  if (b && beats.some((x) => x.side === "before" && Math.abs(x.start - b.start) < 0.05)) return "beat";
  return "";
}

// ---- 2. Joins between kept words -> cut intervals -----------------------------------
type Cut = { start: number; end: number; ids: string[]; cats: string[]; text: string; gapBefore: number; gapAfter: number; xfade: number; mutes: [number, number][]; why: string };
const cuts: Cut[] = [];
const muteOnly: Cut[] = []; // a removed word replaced by room tone, no frames dropped (too tight to cut)
const skipped = new Map<string, string>(); // removal id -> why it was not cut
const kept = words.filter((w) => !owner.has(w));
const removedWords = words.filter((w) => owner.has(w));

// Quietest video-frame boundary in [lo, hi], never in a breath; NaN if none.
function gridPoint(lo: number, hi: number, target: number, quiet: (s: number) => boolean): number {
  let best = NaN, bestE = Infinity;
  for (let k = Math.ceil(lo * FPS - 1e-6); k / FPS <= hi + 1e-6; k++) {
    const s = k / FPS;
    if (inBreath(s)) continue;
    const i = Math.round(s / FRAME_S);
    const e = (quiet(s) ? floor * 3 : (db[i - 1] ?? -120) + (db[i] ?? -120) + (db[i + 1] ?? -120)) / 3 + Math.abs(s - target) * 10; // 1 dB per 100 ms
    if (e < bestE) (bestE = e), (best = s);
  }
  return best;
}

let prevEnd = 0; // running max end of kept words
let noisyPauses = 0; // long pauses left as they are: no quiet join point
let prevWord: Word | undefined;
for (let k = 0; k <= kept.length; k++) {
  const b = kept[k];
  const bStart = b ? b.start : duration;
  const inside = removedWords.filter((w) => w.start >= prevEnd - 0.005 && w.end <= bStart + 0.005);
  const region = bStart - prevEnd;
  const isHead = k === 0, isTail = !b;
  const advance = () => { if (b) { prevEnd = Math.max(prevEnd, b.end); prevWord = b; } };
  if (region <= 0) { advance(); continue; }
  if (!inside.length && region <= MAX_GAP && !isHead && !isTail) { advance(); continue; }

  const lenL = inside.length ? inside[0].start - prevEnd : region; // silence after the kept word
  const lenR = inside.length ? bStart - inside[inside.length - 1].end : region; // silence before the next kept word
  const span = inside.length ? inside[inside.length - 1].end - inside[0].start : 0;
  const turn = !!b && !!prevWord && b.speaker !== prevWord.speaker;
  const prot = isHead || isTail ? "" : protectedGap(prevWord, b);
  // T: silence the join keeps. Natural silence, squeezed only when long; a removed word leaves
  // about 0.4 x its length as room tone (min 0.12 s); never below JOIN_MIN (or the original gap).
  let T: number;
  if (isHead) T = Math.min(HEAD_KEEP, lenR);
  else if (isTail) T = Math.min(TAIL_KEEP, lenL);
  else {
    const outer = lenL + lenR;
    T = prot ? Math.min(outer, BEAT_CAP) : squeeze(outer) + (turn && outer > MAX_GAP ? TURN_EXTRA : 0);
    if (inside.length) T = Math.max(T, Math.min(span, Math.max(0.12, 0.4 * span)) + Math.min(outer, 0.1));
    T = Math.max(T, JOIN_MIN + (turn ? TURN_EXTRA : 0));
    if (prot && !inside.length) T = Math.max(T, Math.min(region, BEAT_CAP));
    T = Math.min(T, region);
  }
  const ids = [...new Set(inside.map((w) => owner.get(w)!.id))];
  const judged = inside.some((w) => !AUTO.includes(owner.get(w)!.cat));
  // Removed words become room tone (so any cut point and crossfade near them is quiet).
  const mutes: [number, number][] = inside
    .map((w) => [Math.max(prevEnd + 0.03, w.start - 0.02), Math.min(bStart - 0.03, w.end + 0.04)] as [number, number])
    .filter(([a, z]) => z > a);
  const muted = (s: number) => mutes.some(([a, z]) => s >= a && s <= z);

  // Safety: never cut speech the transcript does not account for. Crosstalk shows up as
  // a cluster of zero-length words; loud frames outside removed words mean untranscribed talk
  // (or a laugh). Judgment rows were read by the agent; only the crosstalk check applies.
  const crosstalk = words.filter((w) => w.end - w.start < 0.02 && w.end > prevEnd - 0.3 && w.start < bStart + 0.3).length >= 2;
  const fail = (why: string) => { for (const id of ids) skipped.set(id, why); };

  // Split T: a bit more after the kept word than before the next one.
  let R = isTail ? 0 : Math.min(lenR, isHead ? T : T * 0.45);
  let L = isHead ? 0 : T - R;
  let cs = isHead ? 0 : prevEnd + L, ce = isTail ? duration : bStart - R;
  if (!isHead) {
    const lo = prevEnd + Math.min(0.05, lenL), hi = Math.max(lo, ce - 1 / FPS);
    cs = gridPoint(Math.max(lo, cs - 0.1), Math.min(hi, cs + 0.1), cs, muted);
    if (Number.isNaN(cs)) cs = gridPoint(lo, hi, prevEnd + L, muted);
  }
  if (!isTail && !Number.isNaN(cs)) {
    const hi = bStart - Math.min(0.04, lenR), lo = Math.min(hi, cs + 1 / FPS);
    ce = gridPoint(Math.max(lo, ce - 0.1), Math.min(hi, ce + 0.1), ce, muted);
    if (Number.isNaN(ce)) ce = gridPoint(lo, hi, bStart - R, muted);
  }
  // Snap: never trust word timestamps alone. Each side of the join (crossfade plus 100 ms) must be
  // within 6 dB of the local room-tone floor (or under -55 dBFS); search up to 240 ms both ways.
  let noisy = false;
  if (!Number.isNaN(cs) && !Number.isNaN(ce) && !isHead && !isTail) {
    const xf = Math.min(XFADE_MIN + 0.03 * (ce - cs), XFADE_MAX);
    const ok = (lo: number, hi: number) => { for (let x = lo; x <= hi; x += FRAME_S) if (!muted(x) && dbAt(x) > Math.max(localFloor(x) + 6, -55)) return false; return true; };
    const snap = (p: number, lo: number, hi: number, side: (s: number) => boolean) => {
      for (const d of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
        const s = p + d / FPS;
        if (s >= lo - 1e-6 && s <= hi + 1e-6 && !inBreath(s) && side(s)) return s;
      }
      return NaN;
    };
    const ncs = snap(cs, prevEnd + 0.02, ce - 1 / FPS, (s) => ok(s - xf / 2 - 0.1, s + xf / 2));
    if (!Number.isNaN(ncs)) cs = ncs;
    const nce = snap(ce, cs + 1 / FPS, bStart - 0.02, (s) => ok(s - xf / 2, s + xf / 2 + 0.1));
    if (!Number.isNaN(nce)) ce = nce;
    noisy = Number.isNaN(ncs) || Number.isNaN(nce);
  }
  let extraVoice = 0;
  if (!Number.isNaN(cs) && !Number.isNaN(ce))
    for (let x = cs; x < ce; x += FRAME_S)
      if (dbAt(x) > SPEECH && !inside.some((w) => x > w.start - 0.06 && x < w.end + 0.06)) extraVoice += FRAME_S;
  const laughCut = !isHead && !isTail && !Number.isNaN(cs) && !Number.isNaN(ce) && laughIn(cs - 0.05, ce + 0.05);
  const safe = isHead || isTail || (!crosstalk && !laughCut && (judged || extraVoice <= (inside.length ? 0.3 : 0.12)));
  const why = crosstalk ? "crosstalk (zero-length words nearby)" : laughCut ? "laugh in the audio" : !safe ? `untranscribed sound in the cut (${extraVoice.toFixed(2)} s; laugh or talk)` : "";
  if (Number.isNaN(cs) || Number.isNaN(ce) || ce - cs < 1 / FPS - 1e-6 || (!isHead && !isTail && region - T < 1 / FPS)) {
    // Too tight to drop a frame: replace the removed words with room tone in place.
    if (inside.length && !crosstalk && mutes.length) muteOnly.push({ start: prevEnd, end: bStart, ids, cats: [...new Set(inside.map((w) => owner.get(w)!.cat))], text: inside.map((w) => w.text).join(" "), gapBefore: region, gapAfter: region, xfade: 0, mutes, why: "muted in place" });
    else if (inside.length) fail(crosstalk ? why : "no room for a clean cut point");
    advance();
    continue;
  }
  if (!safe) { fail(why); advance(); continue; }
  // No quiet point for an auto row or a pause: a hard join is worse than the original.
  // Mute the removed words in place instead, or leave the pause as it is.
  if (noisy && !judged && !isHead && !isTail) {
    if (inside.length && mutes.length) muteOnly.push({ start: prevEnd, end: bStart, ids, cats: [...new Set(inside.map((w) => owner.get(w)!.cat))], text: inside.map((w) => w.text).join(" "), gapBefore: region, gapAfter: region, xfade: 0, mutes, why: "muted in place: no quiet join point" });
    else noisyPauses++;
    advance();
    continue;
  }
  // Crossfade: longer for longer cuts, but its halves never reach a kept word.
  const room = Math.min(isHead ? Infinity : cs - prevEnd - 0.02, isTail ? Infinity : bStart - ce - 0.02);
  const xfade = Math.max(0.02, Math.min(XFADE_MIN + 0.03 * (ce - cs), XFADE_MAX, 2 * room));
  cuts.push({
    start: cs, end: ce, ids,
    cats: [...new Set(inside.map((w) => owner.get(w)!.cat))],
    text: inside.map((w) => w.text).join(" "),
    gapBefore: region, gapAfter: region - (ce - cs), xfade, mutes, why: [prot ? `${prot} kept` : "", noisy ? "no quiet point within 240 ms" : ""].filter(Boolean).join("; "),
  });
  advance();
}
// Removed words that never fell inside a clean gap overlap other speech: they stay.
const done = [...cuts, ...muteOnly];
for (const w of removedWords)
  if (!done.some((c) => (w.start >= c.start - 0.05 && w.end <= c.end + 0.05) || c.mutes.some(([a, z]) => w.start >= a - 0.03 && w.end <= z + 0.05)) && !skipped.has(owner.get(w)!.id))
    skipped.set(owner.get(w)!.id, "overlaps a kept word");

// ---- 3. Kept segments (frame-aligned) -----------------------------------------------
let segs: [number, number][] = []; // [startFrame, endFrame)
let f0 = 0;
for (const c of cuts) {
  const a = Math.round(c.start * FPS), b = Math.round(c.end * FPS);
  if (a > f0) segs.push([f0, a]);
  f0 = Math.max(f0, b);
}
if (f0 < frames) segs.push([f0, frames]);
// Preview: keep only the first --until seconds of output.
if (values.until) {
  let left = Math.round(Number(values.until) * FPS);
  segs = segs.flatMap(([a, b]) => {
    const n = Math.min(b - a, left);
    left -= n;
    return n > 0 ? [[a, a + n] as [number, number]] : [];
  });
}
const outFrames = segs.reduce((s, [a, b]) => s + b - a, 0);
const srcEndFrame = segs[segs.length - 1][1];

// ---- 4. Reports ---------------------------------------------------------------------
const PRIORITY = ["head", "tail", "bot", "bot-polish", "struggle", "repeat", "falsestart", "filler"];
const primary = (c: Cut) => PRIORITY.find((p) => c.cats.includes(p)) ?? "pause";
const byId = new Map(edl.removals.map((r) => [r.id, r]));
const totals: Record<string, { n: number; s: number }> = {};
for (const c of cuts) {
  const p = primary(c);
  totals[p] ??= { n: 0, s: 0 };
  totals[p].n++, (totals[p].s += c.end - c.start);
}
const plan = {
  media, edl: edlPath, keep: [...vetoed], until: values.until ? Number(values.until) : undefined,
  settings: { MAX_GAP, JOIN_MIN, TURN_EXTRA, BEAT_CAP, XFADE_MIN, XFADE_MAX },
  sourceSeconds: duration, outputSeconds: outFrames / FPS, totals,
  skipped: [...skipped].map(([id, reason]) => ({ id, text: byId.get(id)?.text, reason })),
  cuts: cuts.map((c, i) => ({ n: i + 1, start: +c.start.toFixed(3), end: +c.end.toFixed(3), dur: +(c.end - c.start).toFixed(3), cat: primary(c), ids: c.ids, text: c.text, gapAfter: +c.gapAfter.toFixed(3), xfade: +c.xfade.toFixed(3), why: c.why })),
  muteOnly: muteOnly.map((c) => ({ start: +c.start.toFixed(3), end: +c.end.toFixed(3), ids: c.ids, text: c.text })),
  segments: segs, // kept source frames [start, end) at 25 fps, in output order
  // Output-to-source time map for later layers (layout, music, overlays): each kept segment with
  // its source and output times in seconds. Output time t maps to srcStart + (t - outStart).
  segmentTimes: segs.reduce((acc: { srcStart: number; srcEnd: number; outStart: number; outEnd: number }[], [a, b]) => {
    const o0 = acc.length ? acc[acc.length - 1].outEnd : 0;
    acc.push({ srcStart: a / FPS, srcEnd: b / FPS, outStart: +o0.toFixed(2), outEnd: +(o0 + (b - a) / FPS).toFixed(2) });
    return acc;
  }, []),
};
await Bun.write(`${base}.cuts.json`, JSON.stringify(plan, null, 1));

const md: string[] = [];
md.push(`# Cut list: ${media.split("/").pop()}`, "");
md.push(`Source ${fmt(duration)} -> edited ${fmt(outFrames / FPS)} (${cuts.length} cuts, ${muteOnly.length} muted in place)${values.until ? `, preview: first ${values.until} s of output (source to ${fmt(srcEndFrame / FPS)})` : ""}. Vetoed: ${[...vetoed].join(", ") || "none"}.`, "");
md.push("To veto a cut: re-render with its id (or a category) in `--keep`, or set `\"keep\": true` on the row in the EDL:", "");
md.push("```", `bun ~/.claude/skills/podcast-edit/render.ts "${edlPath}" "${out}" --keep bot,r0012`, "```", "");
md.push("| Category | Cuts | Seconds |", "|---|---:|---:|");
for (const [k, v] of Object.entries(totals).sort((a, b) => b[1].s - a[1].s)) md.push(`| ${k} | ${v.n} | ${v.s.toFixed(1)} |`);
md.push("", "## Judgment removals (check these first)", "", "| Id | Source | Dur | Category | Removed words | Reason |", "|---|---|---:|---|---|---|");
for (const r of edl.removals.filter((r) => !AUTO.includes(r.cat)))
  md.push(`| ${r.id} | ${fmt(r.start)}-${fmt(r.end)} | ${(r.end - r.start).toFixed(1)} | ${r.cat}${r.keep || vetoed.has(r.id) || vetoed.has(r.cat) ? " (vetoed)" : ""} | ${r.text.replace(/\|/g, "/")} | ${r.reason} |`);
md.push("", "## Beats and laughs (pauses kept)", "");
for (const b of beats) md.push(`- ${fmt(b.start)} beat (${b.side}): "${b.text}" - ${b.reason}`);
for (const l of laughs) md.push(`- ${fmt(l.start)} laugh (${l.speaker}): no cut, silence around it kept`);
for (const l of audioLaughs) md.push(`- ${fmt(l.start)}-${fmt(l.end)} laugh in the audio${l.tagged ? " (next to a tag)" : " (untagged)"}: protected`);
md.push("", "## Filler decisions", "", "| Id | Source | Speaker | Word | Decision |", "|---|---|---|---|---|");
for (const r of edl.removals.filter((r) => AUTO.includes(r.cat)))
  md.push(`| ${r.id} | ${fmt(r.start)} | ${r.speaker?.slice(-1) ?? ""} | ${r.text.replace(/\|/g, "/")} | ${r.keep ? "keep" : "cut"}: ${r.reason} |`);
md.push("", "## Candidates considered and kept", "", "| Source | Words | Note |", "|---|---|---|");
for (const c of edl.candidates) md.push(`| ${fmt(c.start)}-${fmt(c.end)} | ${c.text.replace(/\|/g, "/")} | ${c.note} |`);
md.push("", "## Notes", "");
for (const n of edl.notes) md.push(`- ${fmt(n.at)}: ${n.note}`);
md.push("", `## Planned but not cut, for safety (${skipped.size})`, "");
for (const s of plan.skipped) md.push(`- ${s.id} ${fmt(byId.get(s.id)!.start)}: "${s.text}" - ${s.reason}`);
md.push("", `## Muted in place, no frames dropped (${muteOnly.length})`, "");
for (const c of muteOnly) md.push(`- ${fmt(c.start)}: "${c.text}" (${c.ids.join(" ")})`);
md.push("", "## All cuts", "", "| # | Source start | Source end | Dur | Category | Ids | Removed words | Reason |", "|---:|---|---|---:|---|---|---|---|");
cuts.forEach((c, i) => {
  const reasons = [...new Set(c.ids.map((id) => byId.get(id)!.reason))].join("; ");
  const gap = `silence ${c.gapBefore.toFixed(2)} s -> ${c.gapAfter.toFixed(2)} s`;
  md.push(`| ${i + 1} | ${fmt(c.start)} | ${fmt(c.end)} | ${(c.end - c.start).toFixed(2)} | ${primary(c)} | ${c.ids.join(" ")} | ${c.text.replace(/\|/g, "/")} | ${reasons || gap}${c.why ? `; ${c.why}` : ""} |`);
});
await Bun.write(`${base}.cuts.md`, md.join("\n") + "\n");
console.error(`plan: ${cuts.length} cuts, ${muteOnly.length} muted, ${fmt(duration)} -> ${fmt(outFrames / FPS)}, skipped ${skipped.size}, breaths ${breaths.length}, pauses left (no quiet point) ${noisyPauses}`, totals);
if (values["plan-only"]) process.exit(0);

// ---- 5. Audio: room tone over removed words, gains, sample-exact splice ----------------
const raw = `${work}/src.s16`;
if (!(await Bun.file(raw).exists())) await $`ffmpeg -y -v error -i ${media} -vn -ac 2 -ar ${RATE} -f s16le ${raw}`;
const src = new Int16Array(await Bun.file(raw).arrayBuffer());
const S = (s: number) => Math.round(s * RATE);

// Room tone: the quietest 0.5 s within 15 s, laid over [a, b] in 0.5 s tiles with 20 ms edges.
function roomTone(a: number, b: number) {
  let best = a, bestE = Infinity;
  for (let s = Math.max(0, a - 15); s < Math.min(duration - 0.5, b + 15); s += 0.05) {
    if (s + 0.5 > a - 0.05 && s < b + 0.05) continue;
    let e = -Infinity;
    for (let x = s; x < s + 0.5; x += FRAME_S) e = Math.max(e, dbAt(x));
    if (e < bestE) (bestE = e), (best = s);
  }
  const len = S(b - a), edge = S(0.02), tile = S(0.5), src0 = S(best), dst0 = S(a);
  const orig = src.slice(dst0 * 2, (dst0 + len) * 2);
  for (let i = 0; i < len; i++) {
    const g = Math.min(1, i / edge, (len - 1 - i) / edge); // 1 = room tone, 0 = original at the edges
    for (let ch = 0; ch < 2; ch++) {
      const v = src[(src0 + (i % tile)) * 2 + ch];
      src[(dst0 + i) * 2 + ch] = Math.round(orig[i * 2 + ch] * Math.cos((g * Math.PI) / 2) + v * Math.sin((g * Math.PI) / 2));
    }
  }
}
for (const c of [...cuts, ...muteOnly]) for (const [a, b] of c.mutes) roomTone(a, b);

// Gains ("auto" = median speech level of the hosts vs the range), 30 ms ramps.
for (const g of edl.gains ?? []) {
  let gdb = g.db;
  if (gdb === "auto") {
    const med = (xs: number[]) => xs.sort((p, q) => p - q)[Math.floor(xs.length / 2)];
    const host = med(Array.from(db).filter((v) => v > SPEECH));
    const part = med(Array.from(db.subarray(Math.round(g.start / FRAME_S), Math.round(g.end / FRAME_S))).filter((v) => v > SPEECH));
    gdb = Math.max(-6, Math.min(12, host - (part ?? host)));
  }
  const a = S(g.start - 0.05), b = S(g.end + 0.1), ramp = S(0.03), lin = 10 ** (gdb / 20);
  for (let i = a; i < b; i++) {
    const w = Math.min(1, (i - a) / ramp, (b - 1 - i) / ramp);
    const k = 1 + (lin - 1) * w;
    for (let ch = 0; ch < 2; ch++) src[i * 2 + ch] = Math.max(-32768, Math.min(32767, Math.round(src[i * 2 + ch] * k)));
  }
  console.error(`gain ${fmt(g.start)} ${gdb.toFixed(1)} dB: ${g.text}`);
}

const SPF = RATE / FPS; // samples per video frame
const outPcm = new Int16Array(outFrames * SPF * 2);
const xfadeAt = new Map(cuts.map((c) => [Math.round(c.end * FPS), c.xfade]));
let o = 0;
segs.forEach(([a, b], k) => {
  const s0 = a * SPF, s1 = b * SPF;
  outPcm.set(src.subarray(s0 * 2, s1 * 2), o * 2);
  if (k > 0) {
    // Join at output sample o: mix the previous segment's continuation with this segment's lead-in.
    const pEnd = segs[k - 1][1] * SPF;
    const X = Math.round((xfadeAt.get(a) ?? XFADE_MIN) * RATE), H = Math.floor(X / 2);
    for (let i = -H; i < H; i++) {
      const w = (i + H) / (2 * H), ga = Math.cos((w * Math.PI) / 2), gb = Math.sin((w * Math.PI) / 2);
      for (let ch = 0; ch < 2; ch++) {
        const va = src[(pEnd + i) * 2 + ch] ?? 0, vb = src[(s0 + i) * 2 + ch] ?? 0;
        outPcm[(o + i) * 2 + ch] = Math.max(-32768, Math.min(32767, Math.round(va * ga + vb * gb)));
      }
    }
  }
  o += s1 - s0;
});
const fadeIn = Math.round(0.03 * RATE), fadeOut = Math.round(0.5 * RATE), total = o;
for (let i = 0; i < fadeIn; i++) for (let ch = 0; ch < 2; ch++) outPcm[i * 2 + ch] *= i / fadeIn;
for (let i = 0; i < fadeOut; i++) for (let ch = 0; ch < 2; ch++) outPcm[(total - 1 - i) * 2 + ch] *= i / fadeOut;
await Bun.write(`${work}/edited.s16`, outPcm);

// ---- 6. Loudness: two-pass loudnorm to -16 LUFS, true peak -1.5 dBTP after AAC ---------------------------
const pcmIn = ["-f", "s16le", "-ar", String(RATE), "-ac", "2", "-i", `${work}/edited.s16`];
// TP -2.0 before AAC: the encoder adds about 0.3 dB of peak, so the file lands near -1.5 dBTP.
const LN = "loudnorm=I=-16:TP=-2.0:LRA=11";
const pass1 = await $`ffmpeg -hide_banner -nostats ${pcmIn} -af ${LN + ":print_format=json"} -f null -`.quiet().nothrow();
const m = JSON.parse(pass1.stderr.toString().match(/\{[\s\S]*\}/)![0]);
const ln2 = `${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
await $`ffmpeg -y -hide_banner -nostats ${pcmIn} -af ${ln2} -ar ${RATE} -c:a pcm_s16le ${work}/edited.wav`.quiet();

// ---- 7. Video: drop the cut frames, mux with the new audio ---------------------------
const sel = segs.map(([a, b]) => `between(n\\,${a}\\,${b - 1})`).join("+");
await Bun.write(`${work}/video.filter`, `[0:v]select='${sel}',setpts=N/(${FPS}*TB)[v]`);
console.error("encoding video ...");
await $`ffmpeg -y -v error -stats -t ${(srcEndFrame / FPS + 1).toFixed(2)} -i ${media} -i ${work}/edited.wav -/filter_complex ${work}/video.filter -map [v] -map 1:a -c:v libx264 -preset ${values.preset} -crf ${values.crf} -pix_fmt yuv420p -r ${FPS} -c:a aac -b:a 192k -movflags +faststart -shortest ${out}`;
console.error(`done: ${out}`);
