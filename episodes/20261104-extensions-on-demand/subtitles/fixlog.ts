// Log every fix hit: final time, speaker, before -> after (mirrors subtitles.ts build mapping).
import { mapWords, relabel, applyFixes, piecesFromCuts, piecesFromAudioMap, composePieces } from "/Users/nik/github/postgres-fm-prep/tools/podcast-edit/subtitles.ts";
import { loadTranscript } from "/Users/nik/github/postgres-fm-prep/tools/podcast-edit/lib.ts";
const [words, mode, mapPath, cutsPath, fixesPath, rl] = Bun.argv.slice(2);
const speakers = { speaker_0: "Nik", speaker_1: "Kirk", speaker_2: "Álvaro", speaker_3: "Nik" };
const ranges = rl.split(",").map((r) => { const [t, n] = r.split("="); const [a, b] = t.split("-").map(Number); return [a, b, n] as [number, number, string]; });
const map = await Bun.file(mapPath).json();
const pieces = mode === "yt" ? composePieces(piecesFromCuts(await Bun.file(cutsPath).json()), map) : piecesFromAudioMap(map);
const toks = mapWords(relabel((await loadTranscript(words)).words, ranges), pieces, speakers);
const fixes = await Bun.file(fixesPath).json();
const out = applyFixes(toks, fixes);
const fmt = (s: number) => new Date(s * 1000).toISOString().slice(11, 19);
const counts: Record<string, number> = {};
let j = 0;
for (const o of out) {
  if (!o.fixed) continue;
  // find source tokens covered
  const covered = toks.filter((t) => t.start >= o.start && t.end <= o.end && t.speaker === o.speaker && !t.event);
  const before = covered.map((t) => t.text).join(" ");
  if (before === o.text) continue;
  const f = fixes.find((f: string[]) => f[1].toLowerCase() === o.text.replace(/[.,?!;:"”)…]+$/, "").toLowerCase() && covered.map((t) => t.text.toLowerCase().replace(/[.,?!;:"”)…]+$/, "")).join(" ") === f[0].toLowerCase()) ?? fixes.find((f: string[]) => o.text.toLowerCase().includes(f[1].toLowerCase()));
  const k = f ? `${f[0]} -> ${f[1]}` : "?";
  counts[k] = (counts[k] ?? 0) + 1;
  console.log(`- ${fmt(o.start)} ${o.speaker}: "${before}" -> "${o.text}"`);
}
console.log("\nCOUNTS");
for (const [k, n] of Object.entries(counts)) console.log(`${n}\t${k}`);
