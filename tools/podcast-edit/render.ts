#!/usr/bin/env bun
// EDL -> cut plan -> edited video. Writes <out>.cuts.json and <out>.cuts.md next to the output.
// Usage: bun render.ts <edl.json> <out.mp4> [--keep bot,r0012] [--plan-only] [--work dir]
//        [--until 480] [--src-from S --src-to S] [--max-gap 0.9] [--turn-extra 0.1] [--crf 19] [--preset medium]
// Cuts are planned from the sound (plan.ts): only in real valleys, sample-exact audio, video to the
// nearest frame. A removal that cannot be cut clean is kept and listed. Check: bun joins.ts <out.cuts.json>.
import { $ } from "bun";
import { parseArgs } from "util";
import { type Edl, FPS, FRAME_S, RATE, assembleAudio, decodePcm, energy, fmt, isLaugh, loadTranscript } from "./lib";
import { type PlannedCut, piecesFrom, planCuts, videoSegments } from "./plan";
import { auditJoins } from "./joins";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    keep: { type: "string", default: "" }, // categories or removal ids to NOT cut
    "plan-only": { type: "boolean", default: false },
    until: { type: "string" }, // preview: render only this many seconds of OUTPUT
    "max-gap": { type: "string", default: "0.9" }, // only silences longer than this get shortened
    "turn-extra": { type: "string", default: "0.1" }, // extra silence kept when the speaker changes
    "src-from": { type: "string" }, // render only this source window (review stretches)
    "src-to": { type: "string" },
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
const MAX_GAP = Number(values["max-gap"]), TURN_EXTRA = Number(values["turn-extra"]);
const BEAT_CAP = 2.5; // s; a beat keeps its pause up to this
const base = out.replace(/\.mp4$/, "");
const work = values.work ?? `${base}.work`;
await $`mkdir -p ${work}`.quiet();

const edl: Edl = await Bun.file(edlPath).json();
const t = await loadTranscript(edl.words);
const media = edl.media;
const db = await energy(media, `${work}/energy.f32`);
const frames = Math.floor(Number((await $`ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of csv=p=0 ${media}`.text()).trim()));
const duration = frames / FPS;

// ---- 1-3. Plan the cuts from the sound (plan.ts), then the kept audio and video ---------
const vetoed = new Set(values.keep!.split(",").filter(Boolean));
const active = edl.removals.filter((r) => !r.keep && !vetoed.has(r.cat) && !vetoed.has(r.id));
const words = t.words;
const AUTO = ["filler", "repeat", "falsestart"];
const beats = edl.beats ?? [];
const laughs = words.filter(isLaugh);
const audioLaughs = edl.laughs ?? [];
// Plan, then score every join on the rebuilt sound (joins.ts) and revert the cuts that are heard
// as a jump: a room-tone step over the natural one (host, 2026-10-22: 09:24, 19.5 dB) or a
// score over REVERT_SCORE. Fewer cuts beat bad cuts. Repeat until no join needs a revert.
const PRIORITY = ["head", "tail", "bot", "bot-polish", "struggle", "repeat", "falsestart", "filler"];
const primary = (c: PlannedCut) => PRIORITY.find((p) => c.cats.includes(p)) ?? "pause";
const REVERT_LEVEL = 10, REVERT_SCORE = 4; // dB over the natural step; join score (joins.ts)
const keepPauses: number[] = [];
const reverted = new Map<string, string>();
const srcPcm = await decodePcm(media, 1, 16000);
let planned = planCuts({ words, removals: active, lv: db, duration, beats, laughs: audioLaughs, params: { maxGap: MAX_GAP, turnExtra: TURN_EXTRA } });
for (let round = 0; round < 4; round++) {
  const pcs = piecesFrom(planned.cuts, duration);
  const draft = { media, edl: edlPath, muteOnly: [], segments: videoSegments(pcs, FPS, frames), audio: pcs, cuts: planned.cuts.map((c) => ({ ...c, cat: primary(c) })) };
  const all = (await auditJoins(draft, { src: srcPcm })).rows; if (process.env.DBG) await Bun.write(process.env.DBG + round, JSON.stringify(draft));
  const bad = all.filter((r: any) => r.levelX > REVERT_LEVEL || r.score > REVERT_SCORE);
  if (!bad.length) break;
  for (const r of bad) {
    const why = `reverted: heard as a jump (join score ${r.score}; ${r.flags.join("; ")})`;
    if (r.ids.length) for (const id of r.ids) reverted.set(id, why);
    else keepPauses.push((r.srcA + r.srcB) / 2);
    console.error(`revert ${fmt(r.srcA)} ${r.cat} "${r.text}": ${r.flags.join("; ")}`);
  }
  planned = planCuts({ words, removals: active.filter((r) => !reverted.has(r.id)), lv: db, duration, beats, laughs: audioLaughs, params: { maxGap: MAX_GAP, turnExtra: TURN_EXTRA, keepPauses } });
}
for (const [id, why] of reverted) planned.kept.set(id, why);
type Cut = PlannedCut;
const cuts: Cut[] = planned.cuts;
const skipped = planned.kept; // removal id -> why it was not cut (restraint)
let pieces = piecesFrom(cuts, duration);
// Source window (review stretches): keep only the pieces inside [from, to] of the source.
const srcFrom = values["src-from"] ? Number(values["src-from"]) : 0, srcTo = values["src-to"] ? Number(values["src-to"]) : duration;
pieces = pieces.flatMap((p) => (p.b <= srcFrom || p.a >= srcTo ? [] : [{ a: Math.max(p.a, srcFrom), b: Math.min(p.b, srcTo), xf: p.a < srcFrom ? 0 : p.xf }]));
// Preview: keep only the first --until seconds of output.
if (values.until) {
  let left = Number(values.until);
  pieces = pieces.flatMap((p) => { const n = Math.min(p.b - p.a, left); left -= n; return n > 0.001 ? [{ ...p, b: p.a + n }] : []; });
}
const segs = videoSegments(pieces, FPS, frames);
const outFrames = segs.reduce((s, [a, b]) => s + b - a, 0);
const srcEndFrame = segs[segs.length - 1][1];
const srcStartFrame = segs[0][0];

// Gains ("auto" = median speech level of the hosts vs the range).
const sorted = Float32Array.from(db).sort();
const floor = sorted[Math.floor(sorted.length * 0.05)];
const speech = sorted[Math.floor(sorted.length * 0.6)];
const SPEECH = floor + 0.8 * (speech - floor);
const gains = (edl.gains ?? []).map((g) => {
  let gdb = g.db;
  if (gdb === "auto") {
    const med = (xs: number[]) => xs.sort((p, q) => p - q)[Math.floor(xs.length / 2)];
    const host = med(Array.from(db).filter((v) => v > SPEECH));
    const part = med(Array.from(db.subarray(Math.round(g.start / FRAME_S), Math.round(g.end / FRAME_S))).filter((v) => v > SPEECH));
    gdb = Math.max(-6, Math.min(12, host - (part ?? host)));
  }
  return { start: g.start, end: g.end, db: gdb as number, text: g.text };
});

// ---- 4. Reports ---------------------------------------------------------------------
const byId = new Map(edl.removals.map((r) => [r.id, r]));
const totals: Record<string, { n: number; s: number }> = {};
for (const c of cuts) {
  const p = primary(c);
  totals[p] ??= { n: 0, s: 0 };
  totals[p].n++, (totals[p].s += c.end - c.start);
}
const plan = {
  media, edl: edlPath, keep: [...vetoed], until: values.until ? Number(values.until) : undefined,
  settings: { MAX_GAP, TURN_EXTRA, planner: "plan.ts (sound runs, valleys)" },
  sourceSeconds: duration, outputSeconds: outFrames / FPS, totals,
  skipped: [...skipped].map(([id, reason]) => ({ id, text: byId.get(id)?.text, reason })),
  cuts: cuts.map((c, i) => ({ n: i + 1, start: +c.start.toFixed(5), end: +c.end.toFixed(5), dur: +(c.end - c.start).toFixed(3), cat: primary(c), ids: c.ids, text: c.text, gapBefore: +c.gapBefore.toFixed(3), gapAfter: +c.gapAfter.toFixed(3), xfade: +c.xfade.toFixed(4), why: c.why })),
  muteOnly: [],
  audio: pieces.map((p) => ({ a: +p.a.toFixed(5), b: +p.b.toFixed(5), xf: +p.xf.toFixed(4) })), // kept source audio, sample-exact
  gains: gains.map((g) => ({ start: g.start, end: g.end, db: +g.db.toFixed(2) })),
  segments: segs, // kept source frames [start, end) at 25 fps, in output order (video; follows the audio within 20 ms)
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
md.push(`Source ${fmt(duration)} -> edited ${fmt(outFrames / FPS)} (${cuts.length} cuts, ${skipped.size} planned rows kept for a clean sound)${values.until ? `, preview: first ${values.until} s of output (source to ${fmt(srcEndFrame / FPS)})` : ""}. Vetoed: ${[...vetoed].join(", ") || "none"}.`, "");
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
md.push("", `## Kept for a clean sound: not cut (${skipped.size})`, "", "A cut here would land inside a word or breath, or over other sound. Fewer cuts beat bad cuts.", "");
for (const s of plan.skipped) md.push(`- ${s.id} ${fmt(byId.get(s.id)!.start)}: "${s.text}" - ${s.reason}${planned.hints.has(s.id) ? `\n  - clean cut points (||): ${planned.hints.get(s.id)}` : ""}`);
md.push("", "## All cuts", "", "| # | Source start | Source end | Dur | Category | Ids | Removed words | Reason |", "|---:|---|---|---:|---|---|---|---|");
cuts.forEach((c, i) => {
  const reasons = [...new Set(c.ids.map((id) => byId.get(id)!.reason))].join("; ");
  const gap = `silence ${c.gapBefore.toFixed(2)} s -> ${c.gapAfter.toFixed(2)} s`;
  md.push(`| ${i + 1} | ${fmt(c.start)} | ${fmt(c.end)} | ${(c.end - c.start).toFixed(2)} | ${primary(c)} | ${c.ids.join(" ")} | ${c.text.replace(/\|/g, "/")} | ${reasons || gap}${c.why ? `; ${c.why}` : ""} |`);
});
await Bun.write(`${base}.cuts.md`, md.join("\n") + "\n");
console.error(`plan: ${cuts.length} cuts, ${fmt(duration)} -> ${fmt(outFrames / FPS)}, kept for a clean sound ${skipped.size} rows`, totals);
if (values["plan-only"]) process.exit(0);

// ---- 5. Audio: gains, sample-exact splice with equal-power crossfades in valleys (lib.ts) ----
const raw = `${work}/src.s16`;
if (!(await Bun.file(raw).exists())) await $`ffmpeg -y -v error -i ${media} -vn -ac 2 -ar ${RATE} -f s16le ${raw}`;
const src = new Int16Array(await Bun.file(raw).arrayBuffer());
for (const g of gains) console.error(`gain ${fmt(g.start)} ${g.db.toFixed(1)} dB: ${g.text}`);
let outPcm = assembleAudio(src, 2, RATE, { audio: pieces, segments: segs, cuts: [], gains }, db);
// The audio length follows the video frames exactly (pad or trim under 20 ms).
const want = Math.round((outFrames / FPS) * RATE) * 2;
if (outPcm.length !== want) { const p = new Int16Array(want); p.set(outPcm.subarray(0, want)); outPcm = p; }
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
const sel = segs.map(([a, b]) => `between(n\\,${a - srcStartFrame}\\,${b - 1 - srcStartFrame})`).join("+");
await Bun.write(`${work}/video.filter`, `[0:v]select='${sel}',setpts=N/(${FPS}*TB)[v]`);
console.error("encoding video ...");
await $`ffmpeg -y -v error -stats -ss ${(srcStartFrame / FPS).toFixed(3)} -t ${((srcEndFrame - srcStartFrame) / FPS + 1).toFixed(2)} -i ${media} -i ${work}/edited.wav -/filter_complex ${work}/video.filter -map [v] -map 1:a -c:v libx264 -preset ${values.preset} -crf ${values.crf} -pix_fmt yuv420p -r ${FPS} -c:a aac -b:a 192k -movflags +faststart -shortest ${out}`;
console.error(`done: ${out}`);
