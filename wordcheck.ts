#!/usr/bin/env bun
// Word check at every join: does a cut drop or double a real word?
// Usage: bun wordcheck.ts <out.cuts.json> [--audio out.mp4] [--from s --to s] [--json out.json] [--work dir]
// For each join, local whisper transcribes the source around it ([A-W, B+W]) and the rebuilt
// output around it ([J-W, J+W]). The kept source words (before A, after B) are aligned with the
// output words: a kept source word missing from the output is "dropped", an output word the
// source lacks next to its own copy is "doubled". Words whisper hears inside the cut that no
// removal row covers are "cut but not planned". Fillers are ignored (whisper drops many).
// Each flag is a lead to check by ear: whisper misreads short clips too.
import { $ } from "bun";
import { parseArgs } from "util";
import { type Edl, assembleAudio, decodePcm, fmt, loadTranscript, norm, whisperWords } from "./lib";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2), allowPositionals: true,
  options: { audio: { type: "string" }, from: { type: "string" }, to: { type: "string" }, json: { type: "string" }, work: { type: "string" } },
});
const planPath = positionals[0];
if (!planPath) { console.error("usage: bun wordcheck.ts <out.cuts.json> [--from s --to s]"); process.exit(2); }
// TIME_TOL: whisper word times in a short clip are off by up to ~0.3 s; closer to a cut point
// a word's side is unknown, so it does not count.
const R = 16000, W = 2.2, EDGE_IGNORE = 0.5, TIME_TOL = 0.3;
const plan = await Bun.file(planPath).json();
const edl: Edl = await Bun.file(plan.edl).json();
const words = (await loadTranscript(edl.words)).words;
const work = values.work ?? planPath.replace(/\.cuts\.json$/, "") + ".wordcheck";
await $`mkdir -p ${work}`.quiet();
const src = await decodePcm(plan.media, 1, R);
// --audio: the rendered file (else the sound is rebuilt from the plan).
const out = values.audio ? await decodePcm(values.audio, 1, R) : assembleAudio(src.slice(), 1, R, { audio: plan.audio, segments: plan.segments, cuts: [], muteOnly: [], gains: plan.gains ?? [] });
const FILLER = new Set(["uh", "um", "er", "eh", "hmm", "mm", "mmm", "ah", "oh", "mhm", "mmhmm", "hm"]);
const split = (text: string) => text.split(/[\s-]+/).map((t) => norm(t).replace(/'/g, "")).filter((t) => t && !FILLER.has(t));
// Edit distance, for whisper's near misses ("bits"/"beats").
const lev = (a: string, b: string) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
const toks = (ws: { text: string; start: number; end: number }[]) => ws.flatMap((w) => split(w.text).map((t) => ({ t, m: (w.start + w.end) / 2 })));
async function hear(pcm: Float32Array, a: number, b: number, name: string) {
  const s = Math.max(0, Math.floor(a * R)), e = Math.min(pcm.length, Math.floor(b * R));
  const wav = `${work}/${name}.f32`;
  await Bun.write(wav, pcm.slice(s, e).buffer);
  await $`ffmpeg -y -v error -f f32le -ar ${R} -ac 1 -i ${wav} ${work}/${name}.wav`;
  return toks((await whisperWords(`${work}/${name}.wav`)).filter((w) => w.type === "word")).map((x) => ({ ...x, m: x.m + s / R }));
}
// LCS alignment: indices of a matched in b.
function lcs(a: string[], b: string[]) {
  const d = Array.from({ length: a.length + 1 }, () => new Int32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) d[i][j] = a[i] === b[j] ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
  const ma = new Set<number>(), mb = new Set<number>();
  for (let i = 0, j = 0; i < a.length && j < b.length; ) if (a[i] === b[j]) ma.add(i++), mb.add(j++); else if (d[i + 1][j] >= d[i][j + 1]) i++; else j++;
  return { ma, mb };
}

const pieces: { a: number; b: number }[] = plan.audio;
const from = values.from ? Number(values.from) : 0, to = values.to ? Number(values.to) : Infinity;
const byId = new Map(edl.removals.map((r) => [r.id, r]));
const rows: any[] = [];
let acc = pieces[0].b - pieces[0].a;
for (let k = 1; k < pieces.length; k++) {
  const A = pieces[k - 1].b, B = pieces[k].a, J = acc;
  acc += pieces[k].b - pieces[k].a;
  if (A < from || A > to) continue;
  const c = plan.cuts.find((c: any) => Math.abs(c.end - B) < 0.021) ?? { cat: "?", ids: [], text: "" };
  // Source: [A-W, B+W] as heard; output: [J-W, J+W].
  const S = await hear(src, A - W, B + W, `s${k}`);
  const E = await hear(out, J - W, J + W, `o${k}`);
  // Source times -> output times for the kept parts; drop words near the outer clip edges.
  const keptS = S.filter((x) => (x.m <= A - TIME_TOL && x.m >= A - W + EDGE_IGNORE) || (x.m >= B + TIME_TOL && x.m <= B + W - EDGE_IGNORE));
  const inCut = S.filter((x) => x.m > A + TIME_TOL && x.m < B - TIME_TOL);
  const Ein = E.filter((x) => x.m >= J - W + EDGE_IGNORE && x.m <= J + W - EDGE_IGNORE);
  const { ma, mb } = lcs(keptS.map((x) => x.t), E.map((x) => x.t));
  let dropped = keptS.filter((_, i) => !ma.has(i)).map((x) => x.t);
  // "take away" heard once as "takeaway": a split or joined spelling is not a dropped word.
  const outText = " " + E.map((x) => x.t).join(" ") + " ", outJoined = E.map((x) => x.t).join("");
  dropped = dropped.filter((t, i) => !outJoined.includes(t + (dropped[i + 1] ?? "")) && !outJoined.includes((dropped[i - 1] ?? "") + t) || outText.includes(` ${t} `));
  dropped = dropped.filter((t) => !E.some((x) => !mb.has(E.indexOf(x)) && t.length > 3 && lev(t, x.t) <= 1));
  const extra = E.map((x, j) => ({ ...x, j })).filter((x) => !mb.has(x.j) && Ein.includes(E[x.j]));
  const doubled = extra.filter((x) => E[x.j - 1]?.t === x.t || E[x.j + 1]?.t === x.t).map((x) => x.t);
  const planned = new Set((c.ids ?? []).flatMap((id: string) => split(byId.get(id)?.text ?? "")));
  const unplanned = inCut.map((x) => x.t).filter((t) => ![...planned].some((p) => p === t || (t.length > 3 && lev(p, t) <= 2)));
  const row = { n: k, out: +J.toFixed(2), srcA: +A.toFixed(2), srcB: +B.toFixed(2), cat: c.cat, text: c.text, source: S.map((x) => x.t).join(" "), output: E.map((x) => x.t).join(" "), dropped, doubled, unplanned };
  rows.push(row);
  const flag = dropped.length || doubled.length || unplanned.length;
  console.error(`${flag ? "CHECK" : "ok   "} out ${fmt(J)} src ${fmt(A)}-${fmt(B)} ${c.cat} "${c.text}"${dropped.length ? ` dropped: ${dropped.join(" ")}` : ""}${doubled.length ? ` doubled: ${doubled.join(" ")}` : ""}${unplanned.length ? ` cut but not planned: ${unplanned.join(" ")}` : ""}`);
}
const flagged = rows.filter((r) => r.dropped.length || r.doubled.length || r.unplanned.length);
await Bun.write(values.json ?? planPath.replace(/\.cuts\.json$/, "") + ".wordcheck.json", JSON.stringify({ rows }, null, 1));
console.log(`joins ${rows.length}: to check ${flagged.length} (dropped ${rows.filter((r) => r.dropped.length).length}, doubled ${rows.filter((r) => r.doubled.length).length}, cut but not planned ${rows.filter((r) => r.unplanned.length).length})`);
