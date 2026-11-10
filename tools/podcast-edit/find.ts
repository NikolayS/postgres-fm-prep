#!/usr/bin/env bun
// Find a phrase in the source transcript and print its time on every timeline: source,
// edited (render.ts cuts), final YouTube video (compose.ts time map) and podcast audio
// (podcast-audio.ts time map). Use it to anchor overlays, chapters, show-note links and
// social clips to what was said, not to a guessed time.
//
//   bun find.ts src.words.json "two to the power" "fat image@1100" \
//       [--cuts 01-edited.cuts.json] [--time-map 27-final.time-map.json] [--audio-map podcast.time-map.json]
//
// "phrase@S" keeps only matches within 60 s of source time S. Punctuation and case are ignored.
// A phrase inside a cut prints "cut" for the later timelines.
import { parseArgs } from "util";
import { fmt, loadTranscript, norm, type Word } from "./lib";
import { composePieces, piecesFromAudioMap, piecesFromCuts, type Piece } from "./subtitles";

export type Hit = { phrase: string; src: [number, number]; speaker: string; edited?: number | null; final?: number | null; podcast?: number | null };

// Source time -> output time through kept pieces; null when the time was cut.
export function mapTime(t: number, pieces: Piece[]): number | null {
  for (const p of pieces) if (t >= p.srcStart - 1e-6 && t <= p.srcEnd + 1e-6) return p.outStart + (t - p.srcStart);
  return null;
}

export function findPhrase(words: Word[], query: string, near?: number, window = 60): { a: number; b: number; speaker: string }[] {
  const ws = words.filter((w) => w.type === "word");
  const toks = ws.map((w) => norm(w.text));
  const q = query.split(/\s+/).map(norm).filter(Boolean);
  const out: { a: number; b: number; speaker: string }[] = [];
  if (!q.length) return out;
  for (let i = 0; i + q.length <= toks.length; i++) {
    if (!q.every((x, k) => toks[i + k] === x)) continue;
    const a = ws[i].start, b = ws[i + q.length - 1].end;
    if (near !== undefined && Math.abs(a - near) > window) continue;
    out.push({ a, b, speaker: ws[i].speaker });
  }
  return out;
}

export function locate(words: Word[], queries: string[], maps: { cuts?: any; timeMap?: any; audioMap?: any }): Hit[] {
  const edited = maps.cuts ? piecesFromCuts(maps.cuts) : null;
  const final = edited && maps.timeMap ? composePieces(edited, maps.timeMap) : null;
  const podcast = maps.audioMap ? piecesFromAudioMap(maps.audioMap) : null;
  const hits: Hit[] = [];
  for (const raw of queries) {
    const m = raw.match(/^(.*)@([\d.:]+)$/);
    const phrase = m ? m[1] : raw;
    const near = m ? m[2].split(":").map(Number).reduce((s, v) => s * 60 + v, 0) : undefined;
    for (const f of findPhrase(words, phrase, near))
      hits.push({
        phrase, src: [f.a, f.b], speaker: f.speaker,
        edited: edited ? mapTime(f.a, edited) : undefined,
        final: final ? mapTime(f.a, final) : undefined,
        podcast: podcast ? mapTime(f.a, podcast) : undefined,
      });
  }
  return hits;
}

if (import.meta.main) {
  const { values: v, positionals: p } = parseArgs({
    args: Bun.argv.slice(2), allowPositionals: true,
    options: { cuts: { type: "string" }, "time-map": { type: "string" }, "audio-map": { type: "string" }, json: { type: "boolean" } },
  });
  if (p.length < 2) { console.error("usage: bun find.ts <words.json> \"phrase\" [\"phrase@S\" ...] [--cuts f] [--time-map f] [--audio-map f] [--json]"); process.exit(2); }
  const j = async (f?: string) => (f ? Bun.file(f).json() : undefined);
  const t = await loadTranscript(p[0]);
  const hits = locate(t.words, p.slice(1), { cuts: await j(v.cuts), timeMap: await j(v["time-map"]), audioMap: await j(v["audio-map"]) });
  if (v.json) { console.log(JSON.stringify(hits, null, 2)); process.exit(0); }
  const show = (x?: number | null) => (x === undefined ? "" : x === null ? "cut" : `${fmt(x)} (${x.toFixed(2)})`);
  for (const q of p.slice(1)) if (!hits.some((h) => q.startsWith(h.phrase))) console.log(`${JSON.stringify(q)}: not found`);
  for (const h of hits) {
    const cols = [`src ${fmt(h.src[0])}-${fmt(h.src[1])}`, h.speaker];
    if (h.edited !== undefined) cols.push(`edited ${show(h.edited)}`);
    if (h.final !== undefined) cols.push(`final ${show(h.final)}`);
    if (h.podcast !== undefined) cols.push(`podcast ${show(h.podcast)}`);
    console.log(`${JSON.stringify(h.phrase)}: ${cols.join("  ")}`);
  }
}
