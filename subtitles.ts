#!/usr/bin/env bun
// Captions (SRT, WebVTT) and an article transcript from the source words and the time maps.
// Usage:
//   bun subtitles.ts build <src.words.json> --out <base>
//        (--cuts <edited.cuts.json> --compose <final.time-map.json> | --audio-map <podcast.time-map.json>)
//        --speakers speaker_0=Nik,speaker_1=Kirk [--fixes fixes.json] [--music 0-13,3036-3065]
//        [--relabel 2614-2615.7=Agent,...]   (source seconds: words there get this speaker)
//        [--article] [--title "..."] [--voices]   (--voices: WebVTT <v Name> spans)
//   bun subtitles.ts check <file.srt> [--map time-map.json]   (--map: also no speech over freezes/outro)
//   bun subtitles.ts qa <base> <media> [--source src.mp4] [--n 10] [--seed 1] [--tol 0.3]
// build writes <base>.srt, <base>.vtt, <base>.cues.json (cues with their words, for qa) and,
// with --article, <base>.transcript.md. YouTube final: source words map through the edit's kept
// segments (cuts.json segmentTimes: source -> edited), then the compose map (edited -> final:
// card + edited + earlier freezes, cut at showEnd). Podcast: the audio map (podcast-audio.ts
// segments) maps source -> audio directly. A word stays only if half or more
// of it is inside a kept piece. "[music]" cues cover the time before and after the talk.
// Fixes: JSON list of [from, to] phrase pairs, matched on whole words (case and edge
// punctuation ignored, one speaker only); the last word's punctuation stays.
// qa: random cues; whisper.cpp hears the media around each cue, and the source audio of the
// cue's first and last word is found in the media by cross-correlation (offset in s).
import { $ } from "bun";
import { parseArgs } from "util";
import { loadTranscript, type Word } from "./lib";

export type Piece = { srcStart: number; srcEnd: number; outStart: number };
// fixed: set by a fix (case kept); src: the source time of `start` (for the qa audio check)
export type Tok = { text: string; start: number; end: number; speaker: string; event?: boolean; fixed?: boolean; src?: number };
export type Cue = { start: number; end: number; lines: string[]; toks?: Tok[]; dropped?: Tok[] }; // dropped: backchannels left out of a fast cue
export type ComposeMap = { card?: number; from?: number; showEnd?: number; total?: number; freezes?: { edited?: number; at?: number; sec: number }[] };
export type Fix = [string, string] | { from: string; to: string };

export const MAX_LINE = 42, MAX_LINES = 2, MIN_DUR = 1, MAX_DUR = 7, MAX_CPS = 20;

// ---- Time maps -----------------------------------------------------------------------------
export const piecesFromCuts = (cuts: { segmentTimes: { srcStart: number; srcEnd: number; outStart: number }[] }): Piece[] =>
  cuts.segmentTimes.map((s) => ({ srcStart: s.srcStart, srcEnd: s.srcEnd, outStart: s.outStart }));

// Podcast audio map (podcast-audio.ts): rows {audioStart, srcStart, srcEnd} under `segments`
// (or a bare list).
export function piecesFromAudioMap(m: any): Piece[] {
  const rows: any[] = Array.isArray(m) ? m : (m.segments ?? m.rows);
  return rows.map((r) => ({ srcStart: r.srcStart, srcEnd: r.srcEnd, outStart: r.audioStart ?? r.outStart }));
}

// Music-only time (no talk): the opening card or intro, and the end card or outro.
export function musicRanges(m: any): [number, number][] {
  const r: [number, number][] = m.segments
    ? [[m.intro?.start ?? 0, m.intro?.talkStart ?? m.talk?.start ?? 0], [m.talk?.end ?? Infinity, m.outro?.end ?? 0]]
    : [[0, m.card ?? 0], [m.showEnd ?? Infinity, m.total ?? 0]];
  return r.filter(([a, b]) => b > a);
}

// Time with no talk that a speech cue must not run into: the video freezes, and the end card or
// the outro after the talk.
export function speechWalls(m: any): [number, number][] {
  if (m.segments) return m.talk?.end !== undefined && m.outro?.end > m.talk.end ? [[m.talk.end, m.outro.end]] : [];
  const card = m.card ?? 0, from = m.from ?? 0;
  let shift = 0;
  const walls = [...(m.freezes ?? [])].sort((a: any, b: any) => (a.edited ?? a.at) - (b.edited ?? b.at)).map((f: any) => {
    const at: number = f.finalStart ?? card + (f.edited ?? f.at ?? 0) - from + shift;
    shift += f.sec;
    return [at, at + f.sec] as [number, number];
  });
  if (m.showEnd !== undefined && m.total > m.showEnd) walls.push([m.showEnd, m.total]);
  return walls;
}

// Edited -> final (compose.ts): final = card + (edited - from) + sum of freezes before it.
// Pieces are split at each freeze; output past showEnd is cut off.
export function composePieces(edited: Piece[], m: ComposeMap): Piece[] {
  const card = m.card ?? 0, from = m.from ?? 0, showEnd = m.showEnd ?? Infinity;
  const fr = (m.freezes ?? []).map((f) => ({ at: f.edited ?? f.at ?? 0, sec: f.sec }));
  const out: Piece[] = [];
  for (const p of edited) {
    let r0 = p.outStart - from, r1 = r0 + (p.srcEnd - p.srcStart);
    if (r1 <= 0) continue;
    const srcAt = (r: number) => p.srcStart + (r - (p.outStart - from));
    if (r0 < 0) r0 = 0;
    const cutsAt = fr.map((f) => f.at).filter((a) => a > r0 + 1e-9 && a < r1 - 1e-9).sort((a, b) => a - b);
    for (const [a, b] of [r0, ...cutsAt].map((a, i, all) => [a, all[i + 1] ?? r1])) {
      const shift = fr.filter((f) => f.at <= a + 1e-9).reduce((s, f) => s + f.sec, 0);
      const o0 = card + a + shift;
      const len = Math.min(b - a, showEnd - o0);
      if (len > 0) out.push({ srcStart: srcAt(a), srcEnd: srcAt(a) + len, outStart: o0 });
    }
  }
  return out;
}

// Source words -> output tokens. A word is kept when at least `minKeep` of it is inside kept
// pieces; its start is the first kept point; a word across a freeze keeps its kept length.
export function mapWords(words: Word[], pieces: Piece[], speakers: Record<string, string>, minKeep = 0.5): Tok[] {
  const out: Tok[] = [];
  for (const w of words) {
    const dur = w.end - w.start;
    let kept = 0, first: number | undefined, last = 0, src = w.start;
    for (const p of pieces) {
      if (dur <= 0) {
        if (w.start >= p.srcStart && w.start < p.srcEnd) { first = last = p.outStart + (w.start - p.srcStart); break; }
        continue;
      }
      const a = Math.max(w.start, p.srcStart), b = Math.min(w.end, p.srcEnd);
      if (b <= a) continue;
      kept += b - a;
      if (first === undefined) { first = p.outStart + (a - p.srcStart); src = a; }
      last = p.outStart + (b - p.srcStart);
    }
    if (first === undefined || (dur > 0 && kept / dur < minKeep - 1e-9)) continue;
    const t: Tok = { text: w.text, start: first, end: dur > 0 ? Math.min(last, first + kept) : first, speaker: speakers[w.speaker] ?? w.speaker, src };
    if (w.type === "event") t.event = true;
    out.push(t);
  }
  return out.sort((a, b) => a.start - b.start);
}

// Give the words in source ranges [start, end] another speaker (by word midpoint), for example a
// meeting bot that diarization put on a host.
export const relabel = (words: Word[], ranges: [number, number, string][]): Word[] =>
  words.map((w) => {
    const m = (w.start + w.end) / 2, r = ranges.find(([a, b]) => m >= a && m <= b);
    return r ? { ...w, speaker: r[2] } : w;
  });

// ---- Text clean-up --------------------------------------------------------------------------
const LEAD = /^["“(]+/, TRAIL = /[.,?!;:"”)…]+$/;
const key = (t: string) => t.toLowerCase().replace(LEAD, "").replace(TRAIL, "");

export function applyFixes(toks: Tok[], fixes: Fix[]): Tok[] {
  const fx = fixes.map((f) => (Array.isArray(f) ? { from: f[0], to: f[1] } : f))
    .map((f) => ({ keys: f.from.split(/\s+/).map(key), to: f.to }))
    .sort((a, b) => b.keys.length - a.keys.length);
  // A word that already is a lowercase fix target ("vacuumdb") is a code name: its case stays.
  const code = new Set(fx.map((f) => f.to).filter((t) => /^\p{Ll}/u.test(t)));
  const out: Tok[] = [];
  for (let i = 0; i < toks.length; i++) {
    const hit = fx.find((f) => f.keys.every((k, j) => toks[i + j] && toks[i + j].speaker === toks[i].speaker && !toks[i + j].event && key(toks[i + j].text) === k));
    if (!hit) { out.push(code.has(toks[i].text.replace(TRAIL, "").replace(/-$/, "")) ? { ...toks[i], fixed: true } : toks[i]); continue; }
    const a = toks[i], b = toks[i + hit.keys.length - 1];
    // A capital at the start stays for a phrase of words ("Hint bits"), not for a code name ("vacuumdb").
    const to = /^\p{Lu}/u.test(a.text.replace(LEAD, "")) && hit.to.includes(" ") ? cap(hit.to) : hit.to;
    i += hit.keys.length - 1;
    if (!to) continue; // an empty fix removes a word ASR invented in cross-talk
    out.push({ ...a, text: (a.text.match(LEAD)?.[0] ?? "") + to + (b.text.match(TRAIL)?.[0] ?? ""), end: b.end, fixed: true });
  }
  return out;
}

const FILLERS = new Set(["uh", "um", "uhm", "er", "erm"]);
const isFiller = (t: Tok) => !t.event && FILLERS.has(key(t.text).replace(/-$/, ""));
// A cut-off word before a restart: "r-", "wa-", or "sessh-" before "sessions" (same first letters).
// A short real word that was cut off ("Oh, when you do-") stays: dropping it loses the verb.
const SHORT_WORDS = new Set("do go get see use put run set add say let try ask fix".split(" ")); // verbs
const isStutter = (toks: Tok[], i: number) => {
  const t = toks[i], m = t.event ? null : t.text.match(/^(\p{L}[\p{L}']*)-$/u);
  if (!m) return false;
  const frag = m[1].toLowerCase(), next = toks[i + 1];
  const restart = !!next && next.speaker === t.speaker && key(next.text).startsWith(frag.slice(0, 3));
  return restart || (frag.length <= 3 && !SHORT_WORDS.has(frag));
};
// Scribe sets a comma before a filler ("and, uh, I"). After a word that cannot end a clause the
// comma goes with the filler; elsewhere it can be real ("I must admit, uh, dumps"), so it stays.
const COMMA_BEFORE_FILLER = new Set("and but or because cause that the a an to of with which is for in on at from by as about into my our your their its this these those some".split(" "));
const endsSentence = (t?: Tok) => !!t && /[.?!]["”)]?$/.test(t.text);
const cap = (s: string) => s.replace(/^([^\p{L}]*)(\p{Ll})/u, (_, p, c) => p + c.toUpperCase());

// Drop tokens by `drop`; a dropped capital at a sentence start passes to the next word, and a
// dropped token's end mark (".", "?", or the cut "-" before an interruption) passes to the word
// before it.
function dropTokens(toks: Tok[], drop: (t: Tok, i: number) => boolean): Tok[] {
  const out: Tok[] = [];
  let capNext = false;
  toks.forEach((t, i) => {
    const prev = out.findLast((o) => o.speaker === t.speaker);
    const turnStart = !out.length || out[out.length - 1].speaker !== t.speaker;
    if (drop(t, i)) {
      if (/^\p{Lu}/u.test(t.text) && (turnStart || endsSentence(prev))) capNext = true;
      const mark = t.text.match(/[.?!]$/)?.[0];
      const last = out[out.length - 1];
      if (mark && prev && last === prev && !TRAIL.test(prev.text)) out[out.length - 1] = { ...prev, text: prev.text + mark };
      // A dropped cut-off word before the other speaker leaves the cut on the word before it.
      else if (/-$/.test(t.text) && prev && last === prev && !TRAIL.test(prev.text) && !/-$/.test(prev.text) && toks[i + 1]?.speaker !== t.speaker)
        out[out.length - 1] = { ...prev, text: prev.text + "-" };
      else if (isFiller(t) && /,$/.test(t.text) && prev && last === prev && /,$/.test(prev.text) && COMMA_BEFORE_FILLER.has(key(prev.text)))
        out[out.length - 1] = { ...prev, text: prev.text.slice(0, -1) };
      return;
    }
    const capital = !t.event && !t.fixed && (capNext || (prev === out[out.length - 1] && endsSentence(prev) && !/\.\.\.$|…$/.test(prev!.text)));
    out.push(capital ? { ...t, text: cap(t.text) } : t);
    if (!t.event) capNext = false;
  });
  return out;
}

// Captions: drop fillers ("uh", "um") and stutter fragments ("r-"); keep everything else.
export const cleanCaption = (toks: Tok[]) => dropTokens(toks, (t, i) => isFiller(t) || isStutter(toks, i));

// Article: also drop events and immediate repeats of short function words ("I, I", "the the").
const REPEATABLE = new Set("i i'm it it's the a an and to of in is we you that this so but like let's they he she was for on what how which if there our my".split(" "));
export function cleanArticle(toks: Tok[]): Tok[] {
  const t1 = cleanCaption(toks).filter((t) => !t.event);
  const rep = (i: number) => {
    const a = t1[i], b = t1[i + 1];
    if (!b || a.speaker !== b.speaker || /[.?!]$/.test(a.text)) return false;
    if (key(a.text) === key(b.text) && (REPEATABLE.has(key(a.text)) || a.text === key(a.text))) return true; // "I, I"; "agentic agentic"
    const c = t1[i + 2], d = t1[i + 3]; // two-word repeat: "it's a, it's a"
    return !!d && c.speaker === a.speaker && d.speaker === a.speaker && key(a.text) === key(c.text) && key(b.text) === key(d.text) && !/[.?!]$/.test(b.text) && REPEATABLE.has(key(a.text));
  };
  const drop = new Set<number>();
  for (let i = 0; i < t1.length; i++) if (rep(i)) { drop.add(i); if (key(t1[i].text) !== key(t1[i + 1].text)) drop.add(++i); }
  return dropTokens(t1, (_, i) => drop.has(i)).map((t) => ({ ...t, text: t.text.replace(/(\p{L})-$/u, "$1—") }));
}

// ---- Cues ------------------------------------------------------------------------------------
const FUNC = new Set("a an the and or but of to in on at for with from by as is are was that this my our your their its if so than then".split(" "));
const lastWord = (s: string) => key(s.split(" ").pop() ?? "");

// Best 1- or 2-line wrap of prefix + words (lines <= MAX_LINE, never inside a word), or null.
export function wrapLines(prefix: string, words: string[], max = MAX_LINE): string[] | null {
  const one = prefix + words.join(" ");
  if (one.length <= max) return [one];
  let best: string[] | null = null, bestScore = Infinity;
  for (let k = 1; k < words.length; k++) {
    const l1 = prefix + words.slice(0, k).join(" "), l2 = words.slice(k).join(" ");
    if (l1.length > max || l2.length > max) continue;
    let s = Math.abs(l1.length - l2.length) * 0.25;
    if (/[.?!]["”)]?$/.test(l1)) s -= 8; else if (/[,;:—-]$/.test(l1)) s -= 5;
    if (FUNC.has(lastWord(l1))) s += 6;
    if (s < bestScore) { bestScore = s; best = [l1, l2]; }
  }
  return best;
}

const round3 = (t: number) => Math.round(t * 1000) / 1000;

// Dynamic programming over cue breaks. A cue holds one speaker (up to 2 lines) or two speakers
// (one line each, each line starts with "- ", the two-speaker convention). A single-speaker cue
// that starts a new turn starts with the name ("Kirk: "). Costs favour breaks at sentence and
// clause ends, cues of 1-7 s and reading speed under MAX_CPS. walls: ranges with no talk
// (freezes, outro); no cue crosses one, and before a wall the hold after the last word is 0.3 s.
// A name label that pushes a cue over MAX_CPS goes (the VTT voice span still names the speaker).
export function buildCues(toks: Tok[], o: { names?: boolean; maxCps?: number; walls?: [number, number][] } = {}): Cue[] {
  const names = o.names ?? true, maxCps = o.maxCps ?? MAX_CPS, n = toks.length, MAXW = 30, walls = o.walls ?? [];
  const wallAfter = (t: number) => Math.min(...walls.map(([a]) => a).filter((a) => a > t + 1e-9));
  const turnStart = (i: number) => i === 0 || toks[i - 1].speaker !== toks[i].speaker;
  const pre = (i: number) => (names && turnStart(i) ? `${toks[i].speaker}: ` : "");
  function layout(i: number, j: number): string[] | null {
    let k = i + 1;
    while (k < j && toks[k].speaker === toks[i].speaker) k++;
    if (k === j) return wrapLines(pre(i), toks.slice(i, j).map((t) => t.text));
    for (let m = k + 1; m < j; m++) if (toks[m].speaker !== toks[k].speaker) return null;
    const l1 = "- " + toks.slice(i, k).map((t) => t.text).join(" "), l2 = "- " + toks.slice(k, j).map((t) => t.text).join(" ");
    return l1.length <= MAX_LINE && l2.length <= MAX_LINE ? [l1, l2] : null;
  }
  function timing(i: number, j: number, chars: number) {
    const start = toks[i].start;
    const natEnd = Math.max(...toks.slice(i, j).map((t) => t.end));
    const next = j < n ? toks[j].start : Infinity;
    const want = Math.max(natEnd + 0.5, start + MIN_DUR, start + chars / (maxCps - 3));
    let end = Math.min(want, natEnd + 2, next, start + MAX_DUR);
    const wall = wallAfter(start);
    if (end > wall) end = natEnd > wall ? natEnd : Math.min(wall, natEnd + 0.3); // a word cut by a freeze keeps its length
    return { start, end, natEnd };
  }
  function breakCost(j: number) {
    if (j === n || toks[j].speaker !== toks[j - 1].speaker) return 0;
    const t = toks[j - 1].text;
    let c = /[.?!]["”)]?$/.test(t) ? 0 : /[,;:—-]$/.test(t) ? 3 : toks[j].start - toks[j - 1].end >= 0.5 ? 2 : 9;
    if (FUNC.has(key(t))) c += 6;
    return c;
  }
  const best = new Float64Array(n + 1).fill(Infinity), from = new Int32Array(n + 1);
  best[0] = 0;
  for (let j = 1; j <= n; j++) {
    for (let i = j - 1; i >= Math.max(0, j - MAXW); i--) {
      if (best[i] === Infinity) continue;
      const lines = layout(i, j);
      if (!lines) { if (j - i > 1 && toks.slice(i, j).every((t) => t.speaker === toks[i].speaker)) break; continue; }
      const chars = lines.join(" ").length;
      const { start, end, natEnd } = timing(i, j, chars);
      if (natEnd - start > MAX_DUR) break;
      const dur = end - start;
      let c = 5 + breakCost(j) + (lines.length === 2 && toks[j - 1].speaker !== toks[i].speaker ? 3 : 0);
      if (dur < MIN_DUR) c += 40 + (MIN_DUR - dur) * 40;
      const cps = chars / Math.max(dur, 0.05);
      if (cps > maxCps) c += (cps - maxCps) * 8;
      for (let k = i + 1; k < j; k++) {
        const g = toks[k].start - toks[k - 1].end;
        if (g > 1.2) c += (g - 1.2) * 15 + (g > 3 ? 100 : 0);
      }
      if (best[i] + c < best[j]) { best[j] = best[i] + c; from[j] = i; }
    }
  }
  const cues: Cue[] = [];
  for (let j = n; j > 0; j = from[j]) {
    const i = from[j], lines = layout(i, j)!;
    const { start, end } = timing(i, j, lines.join(" ").length);
    cues.push({ start: round3(start), end: round3(end), lines, toks: toks.slice(i, j) });
  }
  return retime(cues.reverse(), 0.3, maxCps, walls).map((c) => densify(c, maxCps));
}

// Lines for the tokens of one cue: one speaker (label optional), or "- " lines for two speakers.
function relayout(toks: Tok[], label: string): string[] | null {
  const k = toks.findIndex((t) => t.speaker !== toks[0].speaker);
  if (k < 0) return wrapLines(label, toks.map((t) => t.text));
  if (toks.slice(k).some((t) => t.speaker !== toks[k].speaker)) return null;
  const l = [toks.slice(0, k), toks.slice(k)].map((p) => "- " + p.map((t) => t.text).join(" "));
  return l.every((x) => x.length <= MAX_LINE) ? l : null;
}

// A cue that still reads faster than maxCps loses, in this order, its name label (the VTT voice
// span keeps the name) and then repeated words ("I, I", "Yeah, yeah."): the approved clean-up.
// Over maxCps + 5 (rapid cross-talk), the other speaker's pure backchannel line ("- Yeah") goes
// too. No other word goes.
export function densify(c: Cue, maxCps = MAX_CPS): Cue {
  const d = densify1(c, maxCps);
  if (!d.toks || d.lines.join(" ").length / (d.end - d.start) <= maxCps + 5) return d;
  const t = d.toks, k = t.findIndex((x) => x.speaker !== t[0].speaker);
  if (k < 0) return d;
  const parts = [t.slice(0, k), t.slice(k)];
  const back = parts.findIndex((p) => p.every((x) => x.event || BACKCHANNEL.has(key(x.text))));
  if (back < 0) return d;
  const keep = parts[1 - back];
  return { ...d, lines: wrapLines("", keep.map((x) => x.text)) ?? d.lines, toks: keep, dropped: parts[back] };
}
function densify1(c: Cue, maxCps: number): Cue {
  const fast = (lines: string[]) => lines.join(" ").length / (c.end - c.start) > maxCps;
  if (!c.toks?.length || !fast(c.lines)) return c;
  const label = c.lines[0].startsWith(`${c.toks[0].speaker}: `) ? `${c.toks[0].speaker}: ` : "";
  let lines = label ? relayout(c.toks, "") ?? c.lines : c.lines;
  if (!fast(lines)) return { ...c, lines };
  const t = c.toks, dup = (i: number) => !!t[i + 1] && t[i + 1].speaker === t[i].speaker && !t[i].event &&
    key(t[i].text) === key(t[i + 1].text) && !endsSentence(t[i]) && !/\.\.\.$|…$/.test(t[i].text);
  const toks = dropTokens(t, (_, i) => dup(i));
  if (toks.length === t.length) return { ...c, lines };
  const l2 = relayout(toks, "");
  return l2 ? { ...c, lines: l2, toks } : { ...c, lines };
}

// Fast talk can pass MAX_CPS in any split. Move each cue start up to `slack` s from its first
// word (earlier into a gap, or the boundary shared with the cue before) when that brings the
// reading speed or the duration inside the rules. The smallest move with the lowest cost wins.
// A boundary between two speakers never moves later than the second speaker's first word, and
// no start moves into a wall.
export function retime(cues: Cue[], slack = 0.3, maxCps = MAX_CPS, walls: [number, number][] = []): Cue[] {
  const r = cues.map((c) => ({ ...c }));
  const cost = (c: Cue, a: number, b: number) => {
    const d = b - a;
    return (d < MIN_DUR ? 10 + 100 * (MIN_DUR - d) : 0) + (d > MAX_DUR ? 10 + 100 * (d - MAX_DUR) : 0) + Math.max(0, c.lines.join(" ").length / d - maxCps) ** 2;
  };
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < r.length; i++) {
      const c = r[i], p = r[i - 1], s = c.toks?.[0]?.start;
      if (s === undefined) continue;
      const shared = !!p && Math.abs(p.end - c.start) < 1e-6;
      const wallEnd = Math.max(0, ...walls.map(([, b]) => b).filter((b) => b <= s + 1e-9));
      const turn = shared && p.toks?.[p.toks.length - 1]?.speaker !== c.toks![0].speaker;
      const lo = Math.max(s - slack, wallEnd, shared ? p.start + 0.05 : (p?.end ?? 0)), hi = shared ? Math.min(turn ? s : s + slack, c.end - 0.05) : c.start;
      const f = (x: number) => cost(c, x, c.end) + (shared ? cost(p, p.start, x) : 0);
      let best = c.start, bestCost = f(c.start);
      const xs: number[] = [];
      for (let x = Math.ceil(lo * 100 - 1e-6) / 100; x <= hi + 1e-9; x = round3(x + 0.01)) xs.push(round3(x));
      for (const x of xs.sort((a, b) => Math.abs(a - c.start) - Math.abs(b - c.start))) {
        const v = f(x);
        if (v < bestCost - 1e-9) { best = x; bestCost = v; }
      }
      if (best !== c.start) { c.start = best; if (shared) p.end = best; }
    }
  }
  return r;
}

export function musicCues(ranges: [number, number][]): Cue[] {
  return ranges.flatMap(([a, b]) => {
    const k = Math.ceil((b - a) / MAX_DUR - 1e-9), d = (b - a) / k;
    return Array.from({ length: k }, (_, i) => ({ start: round3(a + i * d), end: round3(a + (i + 1) * d), lines: ["[music]"] }));
  });
}

// "[music]" cues over the music-only ranges, cut back so they never cover a talk cue.
export function withMusic(talk: Cue[], ranges: [number, number][]): Cue[] {
  const first = talk[0]?.start ?? Infinity, last = talk[talk.length - 1]?.end ?? -Infinity;
  const before = ranges.filter(([a]) => a < first).map(([a, b]) => [a, Math.min(b, first)] as [number, number]);
  const after = ranges.filter(([, b]) => b > last).map(([a, b]) => [Math.max(a, last), b] as [number, number]);
  return [...musicCues(before.filter(([a, b]) => b > a)), ...talk, ...musicCues(after.filter(([a, b]) => b > a))];
}

export type Problem ={ cue: number; rule: "line-length" | "line-count" | "duration" | "overlap" | "cps"; detail: string };
export function checkCues(cues: Cue[], maxCps = MAX_CPS, walls: [number, number][] = []): Problem[] {
  const p: Problem[] = [];
  cues.forEach((c, i) => {
    const d = c.end - c.start, chars = c.lines.join(" ").length;
    for (const l of c.lines) if (l.length > MAX_LINE) p.push({ cue: i + 1, rule: "line-length", detail: `${l.length}: ${l}` });
    if (c.lines.length > MAX_LINES) p.push({ cue: i + 1, rule: "line-count", detail: String(c.lines.length) });
    if (d < MIN_DUR - 1e-6 || d > MAX_DUR + 1e-6) p.push({ cue: i + 1, rule: "duration", detail: d.toFixed(3) });
    if (i > 0 && c.start < cues[i - 1].end - 1e-6) p.push({ cue: i + 1, rule: "overlap", detail: `${c.start} < ${cues[i - 1].end}` });
    if (chars / d > maxCps + 1e-6) p.push({ cue: i + 1, rule: "cps", detail: (chars / d).toFixed(1) });
    const w = walls.find(([a, b]) => c.start < b - 1e-6 && c.end > a + 1e-6);
    if (w && !/^\[.*\]$/.test(c.lines.join(" "))) p.push({ cue: i + 1, rule: "wall", detail: `speech over ${w[0]}-${w[1]}` });
  });
  return p;
}

// ---- Writers and parser ----------------------------------------------------------------------
const stamp = (t: number, sep: string) => {
  const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${sep}${String(ms % 1000).padStart(3, "0")}`;
};
export const toSrt = (cues: Cue[]) => cues.map((c, i) => `${i + 1}\n${stamp(c.start, ",")} --> ${stamp(c.end, ",")}\n${c.lines.join("\n")}\n`).join("\n");
// voices: each speech line goes in a WebVTT voice span (<v Nik>...</v>) in place of the visible
// "Nik: " or "- " label, for podcast players that show speaker names.
function voiced(c: Cue): string[] {
  const t = c.toks?.filter((x) => !x.event) ?? [], sp = (c.toks ?? [])[0]?.speaker;
  if (!sp) return c.lines;
  const a = t[0]?.speaker ?? sp, b = t[t.length - 1]?.speaker ?? sp;
  if (c.lines.length === 2 && a !== b && c.lines.every((l) => l.startsWith("- ")))
    return [`<v ${a}>${c.lines[0].slice(2)}</v>`, `<v ${b}>${c.lines[1].slice(2)}</v>`];
  const lines = [c.lines[0].replace(new RegExp(`^${sp}: `), ""), ...c.lines.slice(1)];
  return [`<v ${sp}>${lines[0]}`, ...lines.slice(1)].map((l, i, all) => (i === all.length - 1 ? `${l}</v>` : l));
}
export const toVtt = (cues: Cue[], o: { voices?: boolean } = {}) =>
  "WEBVTT\n\n" + cues.map((c) => `${stamp(c.start, ".")} --> ${stamp(c.end, ".")}\n${(o.voices ? voiced(c) : c.lines).join("\n")}\n`).join("\n");
export function parseSrt(srt: string): Cue[] {
  const sec = (s: string) => { const [h, m, r] = s.split(":"); const [x, ms] = r.split(/[,.]/); return (+h * 3600000 + +m * 60000 + +x * 1000 + +ms) / 1000; };
  return srt.trim().split(/\n\s*\n/).map((b) => {
    const ls = b.split("\n"), ti = ls.findIndex((l) => l.includes("-->"));
    const [a, z] = ls[ti].split("-->").map((s) => sec(s.trim()));
    return { start: a, end: z, lines: ls.slice(ti + 1) };
  });
}

// ---- Article ----------------------------------------------------------------------------------
const BACKCHANNEL = new Set("yeah yes yep yup right okay ok exactly sure mm mm-hmm mhm uh-huh nice interesting oh wow true cool absolutely indeed great good agreed correct".split(" "));
const hms = (t: number) => stamp(Math.floor(t), "").slice(0, 8);
type Item = { tok: Tok } | { aside: string; speaker: string };

// Turns with name and [hh:mm:ss]; paragraphs flow until the speaker changes. A short
// backchannel ("Right.") inside the other speaker's turn stays, inline, as "*(Kirk: Right.)*".
export function toArticle(raw: Tok[], o: { title?: string; paraWords?: number } = {}): string {
  const toks = cleanArticle(raw), para = o.paraWords ?? 70;
  const turns: { speaker: string; toks: Tok[] }[] = [];
  for (const t of toks) {
    const last = turns[turns.length - 1];
    if (last && last.speaker === t.speaker) last.toks.push(t); else turns.push({ speaker: t.speaker, toks: [t] });
  }
  // An aside: a pure backchannel, one word said once or repeated ("Right.", "Yeah, yeah.").
  // Every other interjection ("Yeah. Exactly.", "Well—") is a turn with its own timestamp.
  const isAside = (t: { toks: Tok[] }) =>
    t.toks.length <= 3 && t.toks.every((x) => BACKCHANNEL.has(key(x.text))) && new Set(t.toks.map((x) => key(x.text))).size === 1;
  const merged: { speaker: string; start: number; items: Item[] }[] = [];
  for (let k = 0; k < turns.length; k++) {
    const t = turns[k], prev = merged[merged.length - 1];
    if (prev && prev.speaker !== t.speaker && turns[k + 1]?.speaker === prev.speaker && isAside(t)) {
      prev.items.push({ aside: t.toks.map((x) => x.text).join(" ").replace(/([^.?!—])$/, "$1."), speaker: t.speaker }, ...turns[k + 1].toks.map((tok) => ({ tok })));
      k++;
      continue;
    }
    if (prev && prev.speaker === t.speaker) { prev.items.push(...t.toks.map((tok) => ({ tok }))); continue; }
    merged.push({ speaker: t.speaker, start: t.toks[0].start, items: t.toks.map((tok) => ({ tok })) });
  }
  const out: string[] = o.title ? [`# ${o.title}`, ""] : [];
  for (const m of merged) {
    out.push(`**${m.speaker}** [${hms(m.start)}]`, "");
    const paras: string[] = [];
    let cur: string[] = [], words = 0, breakNext = false; // asides stay with the paragraph before
    m.items.forEach((it, i) => {
      if ("aside" in it) { cur.push(`*(${it.speaker}: ${it.aside})*`); return; }
      if (breakNext) { paras.push(cur.join(" ")); cur = []; words = 0; breakNext = false; }
      cur.push(cur.length || it.tok.fixed || /[_\d]/.test(it.tok.text) ? it.tok.text : cap(it.tok.text)); // code names keep their case
      words++;
      const next = m.items.slice(i + 1).find((x) => "tok" in x) as { tok: Tok } | undefined;
      if (next && endsSentence(it.tok) && words >= para && (next.tok.start - it.tok.end >= 0.7 || words >= para * 1.6)) breakNext = true;
    });
    if (cur.length) paras.push(cur.join(" "));
    for (const p of paras) out.push(p, "");
  }
  return out.join("\n");
}

// ---- QA: random cues, checked by ear (whisper) and against the source audio ----------------------
const lev = (a: string, b: string) => { const d = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { let p = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] === b[j - 1] ? 0 : 1)); p = t; } } return d[b.length]; };
const qnorm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const QR = 8000; // sample rate for the audio match

async function pcm(media: string, a: number, dur: number) {
  const buf = await $`ffmpeg -v error -ss ${Math.max(0, a)} -t ${dur} -i ${media} -vn -ac 1 -ar ${QR} -f f32le -`.arrayBuffer();
  return new Float32Array(buf);
}

// Where is the source sound of a word in the output? Normalized cross-correlation of 0.6 s of
// source audio from the word start against the output from t - 1 s to t + 1.6 s.
// Returns the found time minus t (0 = the caption time is exact) and the peak correlation.
async function locate(source: string, src: number, media: string, t: number) {
  const x = await pcm(source, src, 0.6), y = await pcm(media, t - 1, 2.6);
  let ex = 0;
  for (const v of x) ex += v * v;
  let best = -1, lag = 0;
  for (let k = 0; k + x.length <= y.length; k++) {
    let dot = 0, ey = 0;
    for (let j = 0; j < x.length; j++) { dot += x[j] * y[k + j]; ey += y[k + j] * y[k + j]; }
    const r = dot / Math.sqrt(ex * ey + 1e-12);
    if (r > best) { best = r; lag = k; }
  }
  return { offset: lag / QR - Math.min(1, t), corr: best };
}

async function hear(media: string, a: number, b: number, work: string, name: string) {
  const wav = `${work}/${name}.wav`, base = `${work}/${name}`;
  await $`ffmpeg -y -v error -ss ${a} -t ${b - a} -i ${media} -vn -ac 1 -ar 16000 ${wav}`;
  await $`whisper-cli -m ${process.env.HOME}/.whisper-models/ggml-small.bin -f ${wav} -ojf -ml 1 -sow -of ${base}`.quiet();
  const raw: any = await Bun.file(`${base}.json`).json();
  return raw.transcription
    .map((s: any) => ({ w: qnorm(s.text), start: a + s.offsets.from / 1000, end: a + s.offsets.to / 1000 }))
    .filter((x: any) => x.w);
}

// n random cues (seeded) with 4 or more words. Per cue: whisper on the output around the cue
// (recall of the caption words, time of the first word whisper matched), and, with a source
// file, the audio match of the cue's first and last word. A cue passes when the audio match
// finds both words within `tol` s (correlation >= 0.6) and whisper hears half of the words.
// Whisper word times in short clips are off by up to ~1 s, so its times are context only.
export async function qa(base: string, media: string, o: { source?: string; n?: number; seed?: number; tol?: number; work?: string } = {}) {
  const n = o.n ?? 10, tol = o.tol ?? 0.3, work = o.work ?? `${base}.qa`;
  await $`mkdir -p ${work}`.quiet();
  const cues: Cue[] = await Bun.file(`${base}.cues.json`).json();
  const pool = cues.map((c, i) => ({ c, i })).filter(({ c }) => (c.toks ?? []).filter((t) => !t.event && qnorm(t.text).length > 1).length >= 4);
  let s = o.seed ?? 1;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const pick = new Set<number>();
  while (pick.size < Math.min(n, pool.length)) pick.add(Math.floor(rnd() * pool.length));
  const rows = [];
  for (const k of [...pick].sort((a, b) => a - b)) {
    const { c, i } = pool[k];
    const heard = await hear(media, Math.max(0, c.start - 3), c.end + 3, work, `cue${i + 1}`);
    // The first word of each token carries its time ("Laurenz Albe": "laurenz" only).
    const ws = (c.toks ?? []).filter((t) => !t.event).map((t) => ({ w: qnorm(t.text.split(/\s+/)[0]), start: t.start }))
      .filter((x) => x.w.length > 1);
    // In-order match: of the heard words within 1.5 s of the caption time and within one edit
    // (two for long words), the closest in time; misses are skipped.
    let h = 0;
    const deltas: number[] = [];
    for (const x of ws) {
      let best = -1;
      for (let q = h; q < heard.length && heard[q].start < x.start + 1.5; q++) {
        if (heard[q].start < x.start - 1.5 || lev(x.w, heard[q].w) > (x.w.length > 6 ? 2 : x.w.length > 3 ? 1 : 0)) continue;
        if (best < 0 || Math.abs(heard[q].start - x.start) < Math.abs(heard[best].start - x.start)) best = q;
      }
      if (best >= 0) { deltas.push(heard[best].start - x.start); h = best + 1; }
    }
    const recall = deltas.length / ws.length;
    const words = (c.toks ?? []).filter((t) => !t.event && t.src !== undefined);
    const audio = o.source ? await Promise.all([words[0], words[words.length - 1]].map(async (t) => ({ word: t.text, at: t.start, ...(await locate(o.source!, t.src!, media, t.start)) }))) : [];
    const audioOk = audio.every((a) => a.corr >= 0.6 && Math.abs(a.offset) <= tol);
    rows.push({ cue: i + 1, start: c.start, end: c.end, text: c.lines.join(" / "), recall: +recall.toFixed(2), whisperFirstDelta: deltas.length ? +deltas[0].toFixed(2) : null, audio: audio.map((a) => ({ ...a, offset: +a.offset.toFixed(3), corr: +a.corr.toFixed(2) })), pass: audioOk && recall >= 0.5 });
  }
  return rows;
}

// ---- CLI ----------------------------------------------------------------------------------------
if (import.meta.main) {
  const { values: v, positionals: [cmd, ...pos] } = parseArgs({
    args: Bun.argv.slice(2), allowPositionals: true,
    options: {
      cuts: { type: "string" }, compose: { type: "string" }, "audio-map": { type: "string" }, out: { type: "string" },
      speakers: { type: "string", default: "" }, fixes: { type: "string" }, relabel: { type: "string" }, music: { type: "string" }, article: { type: "boolean" }, voices: { type: "boolean" },
      title: { type: "string" }, map: { type: "string" }, source: { type: "string" }, n: { type: "string", default: "10" }, seed: { type: "string", default: "1" }, tol: { type: "string", default: "0.3" },
    },
  });
  const usage = () => { console.error("usage: bun subtitles.ts build <words.json> (--cuts c.json --compose m.json | --audio-map m.json) --speakers a=Nik,b=Kirk --out base [--fixes f.json] [--article]\n       bun subtitles.ts check <file.srt>\n       bun subtitles.ts qa <base> <media> [--source src.m4a] [--n 10]"); process.exit(2); };
  if (cmd === "build") {
    if (!pos[0] || !v.out || !(v.compose ? v.cuts : v["audio-map"])) usage();
    const speakers = Object.fromEntries(v.speakers!.split(",").filter(Boolean).map((p) => p.split("=")));
    const map = await Bun.file((v.compose ?? v["audio-map"])!).json();
    const pieces = v.compose ? composePieces(piecesFromCuts(await Bun.file(v.cuts!).json()), map) : piecesFromAudioMap(map);
    const fixes: Fix[] = v.fixes ? await Bun.file(v.fixes).json() : [];
    const ranges = (v.relabel ?? "").split(",").filter(Boolean).map((r) => { const [t, name] = r.split("="); const [a, b] = t.split("-").map(Number); return [a, b, name] as [number, number, string]; });
    const toks = applyFixes(mapWords(relabel((await loadTranscript(pos[0])).words, ranges), pieces, speakers), fixes);
    const music: [number, number][] = v.music
      ? v.music.split(",").map((r) => r.split("-").map(Number) as [number, number])
      : musicRanges(map);
    const talk = buildCues(cleanCaption(toks), { walls: speechWalls(map) });
    const cues = withMusic(talk, music);
    await Bun.write(`${v.out}.srt`, toSrt(cues));
    await Bun.write(`${v.out}.vtt`, toVtt(cues, { voices: v.voices }));
    await Bun.write(`${v.out}.cues.json`, JSON.stringify(cues));
    if (v.article) await Bun.write(`${v.out}.transcript.md`, toArticle(toks, { title: v.title }));
    const probs = checkCues(cues);
    const by = Object.groupBy(probs, (p) => p.rule);
    console.log(`${cues.length} cues, ${toks.length} words; rule problems: ${probs.length ? Object.entries(by).map(([k, x]) => `${k} ${x!.length}`).join(", ") : "none"}`);
    for (const p of probs.slice(0, 15)) console.log(`  cue ${p.cue} ${p.rule} ${p.detail}`);
  } else if (cmd === "check") {
    if (!pos[0]) usage();
    const probs = checkCues(parseSrt(await Bun.file(pos[0]).text()), MAX_CPS, v.map ? speechWalls(await Bun.file(v.map).json()) : []);
    for (const p of probs) console.log(`cue ${p.cue} ${p.rule} ${p.detail}`);
    console.log(`${probs.length} problems`);
    process.exit(probs.some((p) => p.rule !== "cps") ? 1 : 0);
  } else if (cmd === "qa") {
    if (!pos[1]) usage();
    const rows = await qa(pos[0], pos[1], { source: v.source, n: Number(v.n), seed: Number(v.seed), tol: Number(v.tol) });
    await Bun.write(`${pos[0]}.qa.json`, JSON.stringify(rows, null, 1));
    for (const r of rows) console.log(`cue ${r.cue} ${r.start.toFixed(2)} ${r.pass ? "PASS" : "FAIL"} heard ${Math.round(r.recall * 100)}% | ${r.audio.map((a) => `${a.word} ${a.offset >= 0 ? "+" : ""}${a.offset.toFixed(3)} s (r ${a.corr})`).join(", ")} | ${r.text}`);
    console.log(`${rows.filter((r) => r.pass).length}/${rows.length} cues pass (first and last word found in the audio within ${v.tol} s; whisper hears >= 50%)`);
  } else usage();
}
