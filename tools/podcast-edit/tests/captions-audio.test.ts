// Tests for qa/captions-audio.ts. Run: bun test tests/captions-audio.test.ts
import { describe, expect, test } from "bun:test";
import { align, compare, DEFAULT_MODEL, heardWords, loadTerms, whisperPrompt, type Cue } from "../qa/captions-audio";

// whisper JSON with one word per segment, words 0.5 s apart from t0
const whisper = (text: string, t0 = 0) => ({
  transcription: text.split(" ").map((w, k) => ({ text: ` ${w}`, offsets: { from: Math.round((t0 + k * 0.5) * 1000) } })),
});
// one cue per sentence chunk: [start, end, text]
const cues = (rows: [number, number, string][]): Cue[] =>
  rows.map(([s, e, text]) => {
    const ws = text.split(" ");
    return { start: s, end: e, toks: ws.map((w, k) => ({ text: w, start: s + (k * (e - s)) / ws.length })) };
  });

describe("captions vs audio", () => {
  test("aligned captions give no findings", () => {
    const h = heardWords(whisper("as long as you use the latest and the best agents out there"));
    const c = cues([[0, 3, "as long as you use the latest"], [3, 6, "and the best agents out there"]]);
    expect(align([], [])).toEqual([]);
    expect(compare(c, h)).toEqual([]);
  });

  test("speech with no cue over it is a missing cue (episode 198, 16:29)", () => {
    const h = heardWords(whisper("so the first finding is that in one task five out of five cases fable restarted it okay"));
    // the cue for "in one task ... restarted it" (words 6-15, 3.0-8.0 s) is lost
    const c = cues([[0, 2.4, "so the first finding is that"], [8.6, 9, "okay"]]);
    const f = compare(c, h);
    expect(f.map((x) => x.kind)).toEqual(["missing"]);
    expect(f[0].heard).toBe("in one task five out of five cases fable restarted it");
    expect(f[0].t).toBeCloseTo(3, 6);
  });

  test("words whisper stretched over music (seconds per word) do not make a gap", () => {
    const h = heardWords({ transcription: [[30, 33.4, "Hello,"], [33.5, 35.4, "this"], [35.5, 36.2, "is"], [36.3, 40, "Postgres"], [40.1, 42, "FM"]].map(([a, b, w]) => ({ text: ` ${w}`, offsets: { from: +a * 1000, to: +b * 1000 } })) });
    expect(compare(cues([[42.4, 45, "Hello, this is Postgres FM"]]), h)).toEqual([]);
  });

  test("whisper repeats with near-zero length and music-stretched words are not lost words (ep198 52:38)", () => {
    const rows: [number, number, string][] = [[0, 0.4, "Thank"], [0.4, 0.8, "you,"], [0.8, 1.3, "Nik."], [1.31, 1.32, "Thank"], [1.32, 1.33, "you,"], [1.33, 1.36, "Nik."], [3, 11, "Thank"], [11, 20, "you."]];
    const h = heardWords({ transcription: rows.map(([a, b, w]) => ({ text: ` ${w}`, offsets: { from: a * 1000, to: b * 1000 } })) });
    expect(compare(cues([[0, 1.4, "Thank you, Nik."]]), h)).toEqual([]);
  });

  test("words heard inside cue time but not captioned are unheard (lost words, wrong neighbours)", () => {
    const h = heardWords(whisper("yeah as long as you use the latest and the best you know agents"));
    const c = cues([[0, 6.5, "yeah you know agents"]]);
    const f = compare(c, h);
    expect(f.map((x) => x.kind)).toEqual(["unheard"]);
    expect(f[0].heard).toContain("as long as you use the latest");
  });

  test("captioned words whisper did not hear are extra (crosstalk or cut audio)", () => {
    const h = heardWords(whisper("we decided to proceed"));
    const c = cues([[0, 3, "we decided, right, right, I, I, to proceed"]]);
    expect(compare(c, h).map((x) => x.kind)).toEqual(["extra"]);
  });

  test("a glossary term heard where the caption says something else (max slots)", () => {
    const h = heardWords(whisper("max_locks_per_transaction is one of them"));
    const c = cues([[0, 3, "Max slots per transaction is one of them"]]);
    const terms = loadTerms([["Max slots per transaction", "max_locks_per_transaction"]]);
    const f = compare(c, h, terms);
    expect(f.some((x) => x.kind === "term" && x.note === 'heard "max_locks_per_transaction"')).toBe(true);
    expect(f.some((x) => x.kind === "term" && x.note === 'known mishearing "Max slots per transaction"')).toBe(true);
  });

  test("glossary prompt.txt forms: right term and its 'instead of' mishearings", () => {
    const t = loadTerms([], 'DBLab Forge (instead of AI Lab Forge, DB Lab forge)\ninserts // always replace "in sorts" -> "inserts"\n');
    expect(t.right).toContain("DBLab Forge");
    expect(t.wrong).toEqual(expect.arrayContaining(["AI Lab Forge", "in sorts"]));
    expect(t.wrong).not.toContain("DB Lab forge"); // same letters as the right form: not a mishearing to flag
    const f = compare(cues([[0, 2, "with AI Lab Forge"]]), heardWords(whisper("with AI Lab Forge")), t);
    expect(f.map((x) => x.kind)).toEqual(["term"]);
  });

  test("whisper runs large-v3-turbo with the episode terms first in the prompt", () => {
    expect(DEFAULT_MODEL).toEndWith("ggml-large-v3-turbo-q5_0.bin");
    const fixes: [string, string][] = [["PG AI Bench", "PGAIBench"], ["Max slots per transaction", "max_locks_per_transaction"], ["Nick", "Nik"]];
    const p = whisperPrompt(fixes, loadTerms(fixes, "DBLab Forge (instead of DB lab forge)\n"), 60);
    expect(p).toBe("PGAIBench, max_locks_per_transaction, Nik, DBLab Forge");
    expect(whisperPrompt(fixes, loadTerms(fixes), 30).length).toBeLessThanOrEqual(30);
  });
});
