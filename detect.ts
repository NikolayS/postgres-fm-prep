#!/usr/bin/env bun
// Find fillers, repeats and false starts; merge the agent's judgment file; write the EDL.
// Usage: bun detect.ts <words.json> <edl.json> [--judgment judgment.json] [--review review.txt] [--prosody prosody.json]
import { parseArgs } from "util";
import { type Edl, type Removal, type Word, fmt, isLaugh, loadTranscript, norm, parseTime } from "./lib";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: { judgment: { type: "string" }, review: { type: "string" }, prosody: { type: "string" } },
});
const [wordsPath, edlPath] = positionals;
if (!wordsPath || !edlPath) {
  console.error("usage: bun detect.ts <words.json> <edl.json> [--judgment judgment.json] [--review review.txt]");
  process.exit(2);
}

const FILLERS = new Set(["uh", "um", "uhm", "umm", "er", "erm", "eh", "hmm", "mm"]);
// Reactions, not noise: kept unless the judgment cuts one.
const AGREE = new Set(["mmhmm", "mhm", "mm", "hmm", "uhhuh"]);
// Doubled words that are usually emphasis, not a stutter.
const EMPHATIC = new Set(["hello", "hyphen", "yeah", "yes", "no", "okay", "right", "always", "very", "really", "much", "many", "more", "exactly", "docs", "reminder"]);
const NUMBER = /^(\d.*|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|percent)$/;
const MAX_RESTART_GAP = 1.0; // s; a false start must be followed by the same speaker within this gap
const GLUED = 0.04; // s; a word this close to both neighbors cannot be cut cleanly
const LAUGH_GUARD = 1.5; // s; no filler or repeat cuts this close to a laugh

const t = await loadTranscript(wordsPath);
const words = t.words;
const laughs: { start: number; end: number }[] = words.filter(isLaugh);
// Laughs found in the audio (prosody.ts) count too, tagged or not.
const audioLaughs: { start: number; end: number; tagged: boolean }[] = values.prosody ? ((await Bun.file(values.prosody).json()).laughs ?? []) : [];
laughs.push(...audioLaughs);
const nearLaugh = (a: number, b: number) => laughs.some((l) => a < l.end + LAUGH_GUARD && b > l.start - LAUGH_GUARD);
// Silence to the nearest word of any speaker on each side.
const gapBefore = (i: number) => (i > 0 ? words[i].start - Math.max(...words.slice(Math.max(0, i - 3), i).map((w) => w.end)) : Infinity);
const gapAfter = (i: number) => (i + 1 < words.length ? words[i + 1].start - words[i].end : Infinity);
const glued = (i: number, j = i) => gapBefore(i) < GLUED && gapAfter(j) < GLUED;

type Mark = { cat: string; reason: string; keep?: boolean };
const removed = new Map<number, Mark>();
// Zero-length words (crosstalk) have no reliable timing; never auto-cut them.
const mark = (i: number, m: Mark) => removed.has(i) || words[i].end - words[i].start < 0.02 || removed.set(i, m);

// Next word index of the same speaker, or -1 if another speaker talks first or the gap is long.
function nextSame(i: number): number {
  const j = i + 1;
  if (j >= words.length || words[j].speaker !== words[i].speaker) return -1;
  return words[j].start - words[i].end <= MAX_RESTART_GAP ? j : -1;
}
const prevSame = (i: number) => (i > 0 && words[i - 1].speaker === words[i].speaker && words[i].start - words[i - 1].end <= MAX_RESTART_GAP ? i - 1 : -1);

// Fillers: a rule decision per instance. The judgment file overrides any of them (`fillers`).
for (let i = 0; i < words.length; i++) {
  const w = words[i];
  if (w.type !== "word") continue;
  const n = norm(w.text);
  if (/-$/.test(w.text) && nextSame(i) >= 0) {
    if (glued(i)) mark(i, { cat: "falsestart", reason: `cut-off word "${w.text}"; kept: glued`, keep: true });
    else if (nearLaugh(w.start, w.end)) mark(i, { cat: "falsestart", reason: `cut-off word "${w.text}"; kept: near laugh`, keep: true });
    else mark(i, { cat: "falsestart", reason: `cut-off word "${w.text}" before restart` });
    continue;
  }
  if (!FILLERS.has(n) && !AGREE.has(n)) continue;
  const p = prevSame(i), nx = nextSame(i);
  const alone = p < 0 && nx < 0; // the whole turn is this one word
  const f = (keep: boolean, why: string) => mark(i, { cat: "filler", reason: `"${w.text}" ${keep ? "kept" : "cut"}: ${why}`, keep });
  if (alone && AGREE.has(n)) f(true, "agreement or reaction");
  else if (nearLaugh(w.start, w.end)) f(true, "near laugh");
  else if (glued(i)) f(true, "glued");
  else if (p >= 0 && FILLERS.has(norm(words[p].text))) f(false, "run of fillers");
  else if (gapBefore(i) > 0.7 && p >= 0) f(false, "after a pause (double hesitation)");
  else if ((p >= 0 && NUMBER.test(norm(words[p].text))) || (nx >= 0 && NUMBER.test(norm(words[nx].text)))) f(false, "inside a number");
  else if (p < 0) f(true, "turn start");
  else f(false, "mid-clause");
}

// Immediate n-gram repeats inside one speaker run ("the the", "it's a, it's a"). Keep the last copy.
for (let i = 0; i < words.length; i++) {
  if (removed.has(i)) continue;
  // Same-speaker run from i; fillers and false starts between copies do not break a repeat.
  const seq: number[] = [i];
  for (let j = nextSame(i); j >= 0 && seq.length < 8; j = nextSame(j)) if (!removed.has(j)) seq.push(j);
  for (let n = 4; n >= 1; n--) {
    if (seq.length < 2 * n) continue;
    const a = seq.slice(0, n), b = seq.slice(n, 2 * n);
    if (!a.every((k, m) => norm(words[k].text) === norm(words[b[m]].text) && norm(words[k].text))) continue;
    const last = words[a[n - 1]];
    if (/[.?!]$/.test(last.text)) continue; // separate sentences: "Right. Right."
    if (n === 1 && EMPHATIC.has(norm(last.text))) continue;
    const span = a.map((k) => words[k].text).join(" ");
    const keepWhy = glued(a[0], b[0] - 1) ? "glued" : nearLaugh(words[a[0]].start, words[b[0] - 1].end) ? "near laugh" : "";
    for (let k = a[0]; k < b[0]; k++)
      mark(k, keepWhy ? { cat: "repeat", reason: `repeated "${span}"; kept: ${keepWhy}`, keep: true } : { cat: "repeat", reason: `repeated "${span}"` });
    break;
  }
}

const rows: Removal[] = [];
// Group consecutive marked words with the same category and decision into one row.
for (let i = 0; i < words.length; i++) {
  const r = removed.get(i);
  if (!r) continue;
  let j = i;
  const same = (m?: Mark) => m?.cat === r.cat && !!m.keep === !!r.keep && (r.cat !== "filler" || m.reason === r.reason);
  while (r.cat !== "filler" && same(removed.get(j + 1)) && words[j + 1].speaker === words[i].speaker) j++;
  const span = words.slice(i, j + 1);
  rows.push({
    id: "",
    cat: r.cat,
    speaker: span[0].speaker,
    start: span[0].start,
    end: span[span.length - 1].end,
    text: span.map((w) => w.text).join(" "),
    reason: r.reason,
    ...(r.keep ? { keep: true } : {}),
  });
  i = j;
}

const edl: Edl = { media: t.media, words: wordsPath, removals: [], candidates: [], notes: [], beats: [], gains: [], laughs: audioLaughs };

// Judgment file: removals the agent decided, auto rows it vetoed, candidates it kept, notes,
// per-filler decisions, beats (pauses to keep) and gains.
// A range is either from/to times, or a phrase (exact words) said near a time.
type JRange = { from?: string | number; to?: string | number; near?: string | number; phrase?: string; speaker?: string };
type Judgment = {
  removals?: (JRange & { cat: string; reason: string })[];
  keep?: (JRange & { reason: string })[];
  // One row per filler or repeat: `at` is its start (mm:ss.ss, within 0.35 s).
  fillers?: { at: string | number; keep: boolean; reason: string }[];
  beats?: (JRange & { side?: "after" | "before"; reason: string })[];
  gains?: (JRange & { db: number | "auto"; reason: string })[];
  candidates?: (JRange & { note: string })[];
  notes?: { at: string | number; note: string }[];
};
// Resolve a phrase to from/to: the matching word sequence closest to `near` (within 15 s).
function resolve(r: JRange): JRange {
  if (!r.phrase) return r;
  const want = r.phrase.split(/\s+/).map(norm).filter(Boolean);
  const near = parseTime(r.near ?? 0);
  let best: [number, number] | null = null, bestD = 15, speakers = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    if (Math.abs(words[i].start - near) > bestD) continue;
    const seq: number[] = [];
    for (let j = i; j < words.length && seq.length < want.length; j++) {
      if (r.speaker && words[j].speaker !== r.speaker) continue;
      if (words[j].type !== "word") continue;
      seq.push(j);
    }
    if (seq.length === want.length && seq.every((j, m) => norm(words[j].text) === want[m]))
      (best = [words[seq[0]].start, words[seq[seq.length - 1]].end]), (bestD = Math.abs(words[i].start - near)), (speakers = new Set(seq.map((j) => words[j].speaker)));
  }
  if (!best) throw new Error(`phrase not found near ${r.near}: "${r.phrase}"`);
  // One voice said the whole phrase: cut only that voice, so a backchannel inside it stays.
  return { ...r, from: best[0], to: best[1], speaker: r.speaker ?? (speakers.size === 1 ? [...speakers][0] : undefined) };
}
const inRange = (w: Word, r: JRange) =>
  w.start >= parseTime(r.from!) - 0.03 && w.end <= parseTime(r.to!) + 0.03 && (!r.speaker || w.speaker === r.speaker);
const textOf = (r: JRange) => words.filter((w) => inRange(w, r)).map((w) => w.text).join(" ");

if (values.judgment) {
  const j: Judgment = await Bun.file(values.judgment).json();
  j.removals = j.removals?.map((r) => ({ ...r, ...resolve(r) }));
  j.keep = j.keep?.map((r) => ({ ...r, ...resolve(r) }));
  j.candidates = j.candidates?.map((r) => ({ ...r, ...resolve(r) }));
  j.beats = j.beats?.map((r) => ({ ...r, ...resolve(r) }));
  j.gains = j.gains?.map((r) => ({ ...r, ...resolve(r) }));
  for (const k of j.keep ?? []) {
    const hit = rows.filter((r) => r.start >= parseTime(k.from!) - 0.03 && r.end <= parseTime(k.to!) + 0.03);
    if (!hit.length) console.error(`warning: keep ${k.from}-${k.to} matches no auto row`);
    for (const r of hit) (r.keep = true), (r.reason += `; kept: ${k.reason}`);
  }
  for (const f of j.fillers ?? []) {
    const at = parseTime(f.at);
    const r = rows.filter((r) => ["filler", "repeat", "falsestart"].includes(r.cat)).sort((a, b) => Math.abs(a.start - at) - Math.abs(b.start - at))[0];
    if (!r || Math.abs(r.start - at) > 0.35) {
      console.error(`warning: filler decision at ${f.at} matches no auto row`);
      continue;
    }
    r.reason = `"${r.text}" ${f.keep ? "kept" : "cut"}: ${f.reason} (judgment)`;
    if (f.keep) r.keep = true;
    else delete r.keep;
  }
  for (const r of j.removals ?? []) {
    const span = words.filter((w) => inRange(w, r));
    const isEdge = r.cat === "head" || r.cat === "tail";
    if (!span.length && !isEdge) {
      console.error(`warning: judgment ${r.from}-${r.to} matches no words`);
      continue;
    }
    rows.push({
      id: "",
      cat: r.cat,
      speaker: r.speaker,
      start: span.length ? span[0].start : parseTime(r.from!),
      end: span.length ? span[span.length - 1].end : parseTime(r.to!),
      text: span.map((w) => w.text).join(" "),
      reason: r.reason,
    });
  }
  edl.beats = (j.beats ?? []).map((b) => ({ start: parseTime(b.from!), end: parseTime(b.to!), side: b.side ?? "after", text: textOf(b), reason: b.reason }));
  edl.gains = (j.gains ?? []).map((g) => ({ start: parseTime(g.from!), end: parseTime(g.to!), db: g.db, text: textOf(g), reason: g.reason }));
  edl.candidates = (j.candidates ?? []).map((c) => ({ start: parseTime(c.from!), end: parseTime(c.to!), text: textOf(c), note: c.note }));
  edl.notes = (j.notes ?? []).map((n) => ({ at: parseTime(n.at), note: n.note }));
}

// Judgment rows win over auto rows inside them; drop auto rows that a judgment row covers.
const AUTO = ["filler", "repeat", "falsestart"];
const judged = rows.filter((r) => !AUTO.includes(r.cat));
edl.removals = rows
  .filter((r) => judged.includes(r) || !judged.some((j) => r.start >= j.start - 0.01 && r.end <= j.end + 0.01))
  .sort((a, b) => a.start - b.start);

// Prosody (prosody.ts) breaks ties: a cut flips to keep at score >= 0.7; a keep flips to cut only at
// score <= 0.2 when the context is mid-fact/clause/list. The reason records both.
if (values.prosody) {
  const pr: Record<string, any> = (await Bun.file(values.prosody).json()).tokens;
  const byStart = new Map(Object.values(pr).map((p: any) => [words[p.i]?.start, p]));
  const fr = edl.removals.filter((r) => r.cat === "filler" && byStart.has(r.start));
  // Flips to keep go highest score first and stop at 25% kept per speaker (rules and the density guard add a few more).
  fr.sort((a, b) => byStart.get(b.start).score - byStart.get(a.start).score);
  const all = (sp?: string) => edl.removals.filter((r) => r.cat === "filler" && r.speaker === sp);
  for (const r of fr) {
    const p = byStart.get(r.start);
    const tag = `prosody ${p.score.toFixed(2)} ${p.shape}${p.shape === "unvoiced" ? "" : ` ${Math.abs(p.slopeSt).toFixed(1)} st`} ${p.dur.toFixed(2)} s`;
    const room = all(r.speaker).filter((x) => x.keep).length < 0.25 * all(r.speaker).length;
    // Never flipped: a run, or a filler inside a number or name (cut by meaning, whatever the pitch).
    const firm = /run of fillers|inside a|before a name|after a name/.test(r.reason);
    if (!r.keep && p.score >= 0.7 && room && !firm) (r.keep = true), (r.reason = r.reason.replace(/ cut: (.*)$/, " kept: prosody says intentional (context was: $1)") + `; ${tag}`);
    else if (r.keep && p.score <= 0.2 && /mid-/.test(r.reason)) (delete r.keep), (r.reason = r.reason.replace(/ kept: (.*)$/, " cut: prosody says noise (context was: $1)") + `; ${tag}`);
    else r.reason += `; ${tag}`;
  }
}

// Density guard: a conversational minute never loses all of its fillers. In each 60 s window
// with 3 or more fillers of one speaker and none kept, keep the one with the longest pause before it
// (most likely thinking before an answer).
const fillerRows = edl.removals.filter((r) => r.cat === "filler");
for (const sp of new Set(fillerRows.map((r) => r.speaker))) {
  const mine = fillerRows.filter((r) => r.speaker === sp);
  for (let k = 0; k < mine.length; k++) {
    const win = mine.filter((r) => r.start >= mine[k].start && r.start < mine[k].start + 60);
    if (win.length < 3 || win.some((r) => r.keep)) continue;
    const idx = (r: Removal) => words.findIndex((w) => Math.abs(w.start - r.start) < 1e-6);
    const pick = win.filter((r) => !/\(judgment\)/.test(r.reason)).sort((a, b) => gapBefore(idx(b)) - gapBefore(idx(a)))[0];
    if (pick) (pick.keep = true), (pick.reason = `"${pick.text}" kept: density guard (no filler left in this minute)`);
  }
}
edl.removals.forEach((r, k) => (r.id = `r${String(k + 1).padStart(4, "0")}`));

await Bun.write(edlPath, JSON.stringify(edl, null, 1));
const count: Record<string, number> = {};
for (const r of edl.removals) if (!r.keep) count[r.cat] = (count[r.cat] ?? 0) + 1;
console.error(`${edl.removals.length} rows -> ${edlPath}`, count);
const stats: Record<string, { kept: number; cut: number }> = {};
for (const r of fillerRows) {
  stats[r.speaker!] ??= { kept: 0, cut: 0 };
  stats[r.speaker!][r.keep ? "kept" : "cut"]++;
}
for (const [sp, s] of Object.entries(stats))
  console.error(`fillers ${sp}: ${s.kept + s.cut}, kept ${s.kept} (${Math.round((100 * s.kept) / (s.kept + s.cut))}%)`);

// Review text: the transcript with removed words in [brackets], kept fillers in <angle brackets>,
// one line per speaker turn. Filler and repeat rows show their start time (`[uh@01:23.40]`)
// so the judgment can name them in `fillers`.
if (values.review) {
  const rowOf = (w: Word) => edl.removals.find((r) => w.start >= r.start - 0.001 && w.end <= r.end + 0.001 && (!r.speaker || r.speaker === w.speaker));
  let out = "", line = "";
  let prev: Word | undefined;
  for (const w of words) {
    const gap = prev ? w.start - prev.end : 0;
    if (!prev || w.speaker !== prev.speaker || line.length > 150) {
      if (line) out += line + "\n";
      line = `[${fmt(w.start)} ${w.speaker.slice(-1)}]`;
    } else if (gap > 0.7) line += ` {${gap.toFixed(1)}}`;
    const r = rowOf(w);
    const auto = r && AUTO.includes(r.cat);
    const tag = auto && w.start === r.start ? `@${fmt(w.start)}` : "";
    line += " " + (w.type === "event" ? `(${w.text.replace(/[[\]]/g, "")})` : !r ? w.text : r.keep ? `<${w.text}${tag}>` : `[${auto ? "" : r.cat + ":"}${w.text}${tag}]`);
    prev = w;
  }
  await Bun.write(values.review, out + line + "\n");
}
