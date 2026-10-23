// Tests for subtitles.ts. Run: bun test tests/subtitles.test.ts
// Golden files: UPDATE_GOLDEN=1 bun test tests/subtitles.test.ts rewrites them (review the diff).
import { describe, expect, test } from "bun:test";
import {
  applyFixes, buildCues, checkCues, cleanCaption, composePieces, mapWords, musicCues, musicRanges, parseSrt,
  piecesFromAudioMap, piecesFromCuts, relabel, retime, toArticle, toSrt, toVtt, wrapLines, type Tok,
} from "../subtitles";

const D = `${import.meta.dir}/subtitles`;
const json = (f: string) => Bun.file(`${D}/${f}`).json();
const SPEAKERS = { speaker_0: "Nik", speaker_1: "Kirk" };

async function fixture(timeline: "final" | "audio") {
  const words = (await json("fixture.words.json")).words;
  const cuts = await json("fixture.cuts.json");
  const pieces = timeline === "final"
    ? composePieces(piecesFromCuts(cuts), await json("fixture.time-map.json"))
    : piecesFromAudioMap(await json("fixture.audio-map.json"));
  const toks = applyFixes(mapWords(words, pieces, SPEAKERS), await json("fixture.fixes.json"));
  return { toks, pieces };
}

async function golden(name: string, actual: string) {
  const f = Bun.file(`${D}/golden/${name}`);
  if (process.env.UPDATE_GOLDEN) await Bun.write(f, actual);
  expect(actual).toBe(await f.text());
}

describe("time maps", () => {
  test("cut words are dropped, kept words are shifted by the card", async () => {
    const { toks } = await fixture("final");
    const text = toks.map((t) => t.text);
    expect(text).not.toContain("Computer.");
    expect(text).not.toContain("CUTME");
    expect(text).not.toContain("Goodbye.");
    const hello = toks.find((t) => t.text === "Hello,")!;
    expect(hello.start).toBeCloseTo(5 + 0.2, 6); // card 5 + (2.0 - 1.8)
  });

  test("words after a freeze shift by its length; a straddling word keeps its length", async () => {
    const { toks } = await fixture("final");
    const think = toks.find((t) => t.text === "think.")!; // src 12.85 > freeze at src 12.3
    expect(think.start).toBeCloseTo(5 + 6 + (12.85 - 9.8) + 2, 6);
    const nineteen = toks.find((t) => t.text === "19,")!; // src 12.05-12.5 straddles the freeze
    expect(nineteen.start).toBeCloseTo(5 + 6 + (12.05 - 9.8), 6);
    expect(nineteen.end - nineteen.start).toBeCloseTo(0.45, 6);
  });

  test("a word less than half inside a kept piece is dropped; more than half is kept", () => {
    const pieces = [{ srcStart: 1, srcEnd: 2, outStart: 0 }];
    const w = (text: string, start: number, end: number) => ({ text, start, end, speaker: "s", type: "word" as const });
    // inside fraction: lead 0.2/0.6, mostly 0.5/0.6, half 0.25/0.5, tail 0.1/0.5
    const out = mapWords([w("lead", 0.6, 1.2), w("mostly", 0.9, 1.5), w("half", 1.75, 2.25), w("tail", 1.9, 2.4)], pieces, {});
    expect(out.map((t) => t.text)).toEqual(["mostly", "half"]);
    expect(out[0].start).toBeCloseTo(0, 6); // clamped to the piece start
    expect(out[0].src).toBe(1); // source time of that output start, for the audio check
  });

  test("audio map rows map source to podcast time", async () => {
    const { toks } = await fixture("audio");
    const hello = toks.find((t) => t.text === "Hello,")!;
    expect(hello.start).toBeCloseTo(3 + 0.2, 6);
    expect(toks.find((t) => t.text === "think.")!.start).toBeCloseTo(9 + (12.85 - 9.8), 6);
  });

  test("podcast-audio.ts map: segments rows, and music before the talk and after it", () => {
    const m = { intro: { start: 0, talkStart: 13 }, talk: { start: 13, end: 40 }, outro: { end: 60 }, segments: [{ audioStart: 13, audioEnd: 40, srcStart: 6, srcEnd: 33 }] };
    expect(piecesFromAudioMap(m)).toEqual([{ srcStart: 6, srcEnd: 33, outStart: 13 }]);
    expect(musicRanges(m)).toEqual([[0, 13], [40, 60]]);
    expect(musicRanges({ card: 13, showEnd: 3035.92, total: 3065.64 })).toEqual([[0, 13], [3035.92, 3065.64]]);
  });

  test("nothing maps past showEnd", () => {
    const pieces = composePieces([{ srcStart: 0, srcEnd: 100, outStart: 0 }], { card: 0, from: 0, showEnd: 10, freezes: [] });
    const w = (text: string, start: number) => ({ text, start, end: start + 0.3, speaker: "s", type: "word" as const });
    expect(mapWords([w("a", 5), w("b", 20)], pieces, {}).map((t) => t.text)).toEqual(["a"]);
  });
});

describe("fixes and clean-up", () => {
  test("phrase fixes keep trailing punctuation and merge times", async () => {
    const { toks } = await fixture("final");
    const text = toks.map((t) => t.text);
    expect(text).toContain("Postgres.FM.");
    expect(text).toContain("vacuumdb.");
    expect(text).toContain("pg_restore,");
    expect(text).toContain("-j");
    const la = toks.find((t) => t.text === "Laurenz Albe")!;
    expect(la.start).toBeCloseTo(5 + 6 + 0.2, 6);
    expect(la.end).toBeCloseTo(5 + 6 + 1.0, 6);
  });

  test("fixes never join words of two speakers", () => {
    const t = (text: string, speaker: string, start: number): Tok => ({ text, start, end: start + 0.2, speaker });
    const out = applyFixes([t("pg", "Nik", 0), t("restore", "Kirk", 1)], [["pg restore", "pg_restore"]]);
    expect(out.map((x) => x.text)).toEqual(["pg", "restore"]);
  });

  test("a fix keeps a sentence-start capital for words, never for code names", () => {
    const t = (text: string, start: number): Tok => ({ text, start, end: start + 0.2, speaker: "Nik" });
    const fixes: [string, string][] = [["hintbits", "hint bits"], ["VacuumDB", "vacuumdb"]];
    const out = cleanCaption(applyFixes([t("Yes.", 0), t("Hintbits", 1), t("are", 2), t("there.", 3), t("Va-", 4), t("VacuumDB", 5), t("works.", 6)], fixes));
    expect(out.map((x) => x.text)).toEqual(["Yes.", "Hint bits", "are", "there.", "vacuumdb", "works."]);
  });

  test("a word after a sentence end (for example, after a cut) takes the capital; not after an ellipsis", () => {
    const t = (text: string, start: number): Tok => ({ text, start, end: start + 0.2, speaker: "Nik" });
    const out = cleanCaption([t("yet.", 0), t("that's", 1), t("it's...", 2), t("like", 3)]);
    expect(out.map((x) => x.text)).toEqual(["yet.", "That's", "it's...", "like"]);
  });

  test("a fix to an empty string removes a word ASR invented", () => {
    const t = (text: string, start: number): Tok => ({ text, start, end: start + 0.2, speaker: "Nik" });
    expect(applyFixes([t("pg_dump-", 0), t("Rebound", 1), t("should", 2)], [["Rebound", ""]]).map((x) => x.text)).toEqual(["pg_dump-", "should"]);
  });

  test("relabel gives a source time range to another speaker (a bot voice)", () => {
    const w = (text: string, start: number) => ({ text, start, end: start + 0.4, speaker: "speaker_1", type: "word" as const });
    const out = relabel([w("Excuse", 10), w("me.", 10.5), w("Yeah.", 12)], [[9.9, 11, "Agent"]]);
    expect(out.map((x) => x.speaker)).toEqual(["Agent", "Agent", "speaker_1"]);
  });

  test("the comma before a removed filler goes, except after an interjection", () => {
    const t = (text: string, start: number): Tok => ({ text, start, end: start + 0.2, speaker: "Nik" });
    const out = cleanCaption([t("cause,", 0), t("uh,", 1), t("hint", 2), t("bits.", 3), t("Okay,", 4), t("um,", 5), t("so", 6)]);
    expect(out.map((x) => x.text).join(" ")).toBe("cause hint bits. Okay, so");
  });

  test("fillers are removed and the next word takes the capital", () => {
    const t = (text: string, start: number): Tok => ({ text, start, end: start + 0.2, speaker: "Nik" });
    const out = cleanCaption([t("Okay.", 0), t("Uh,", 1), t("today", 2), t("r-", 3), t("raise", 4), t("partitions-", 5)]);
    expect(out.map((x) => x.text)).toEqual(["Okay.", "Today", "raise", "partitions-"]);
  });
});

describe("cues", () => {
  test("wrapLines never splits a word and keeps lines within 42 characters", () => {
    const lines = wrapLines("Kirk: ", "you use -j in pg_restore, you introduce a problem where the view".split(" "))!;
    expect(lines.length).toBe(2);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(42);
    expect(lines.join(" ")).toBe("Kirk: you use -j in pg_restore, you introduce a problem where the view");
    expect(lines[0].endsWith("pg_restore,")).toBe(true); // breaks after the comma
    expect(wrapLines("", ["x".repeat(43)])).toBeNull();
  });

  test("cues obey the caption rules on the fixture", async () => {
    const { toks } = await fixture("final");
    const cues = buildCues(cleanCaption(toks));
    expect(checkCues(cues)).toEqual([]);
  });

  test("checkCues reports each broken rule (red cases)", () => {
    const bad = [
      { start: 0, end: 0.5, lines: ["short"] },
      { start: 0.4, end: 9, lines: ["x".repeat(43), "b", "c"] },
    ];
    const kinds = checkCues(bad).map((p) => p.rule).sort();
    expect(kinds).toEqual(["duration", "duration", "line-count", "line-length", "overlap"]);
  });

  test("retime moves a boundary at most 0.3 s to bring reading speed to 20 cps", () => {
    const tk = (text: string, start: number, end: number): Tok => ({ text, start, end, speaker: "Nik" });
    const cues = [
      { start: 0, end: 2, lines: ["x".repeat(30)], toks: [tk("a", 0, 1.9)] },
      { start: 2, end: 3.2, lines: ["y".repeat(30)], toks: [tk("b", 2, 3.0)] }, // 25 cps
      { start: 3.2, end: 6, lines: ["z".repeat(20)], toks: [tk("c", 3.2, 4)] },
      { start: 9, end: 10.2, lines: ["w".repeat(30)], toks: [tk("d", 9, 10)] }, // gap before: starts earlier
      { start: 20, end: 20.8, lines: ["v".repeat(10)], toks: [tk("e", 20, 20.5)] }, // too fast, nothing near
    ];
    const r = retime(cues);
    expect([r[1].start, r[1].end]).toEqual([1.7, 3.2]);
    expect(r[0].end).toBe(1.7);
    expect(r[3].start).toBe(8.7);
    expect(r[4].start).toBe(19.8); // a gap before: the smallest move that gives 1 s
    for (const [i, c] of r.entries()) expect(Math.abs(c.start - c.toks![0].start)).toBeLessThanOrEqual(0.3 + 1e-9);
    expect(checkCues(r.slice(0, 4))).toEqual([]);
  });

  test("music cues cover the card in pieces of at most 7 s", () => {
    const m = musicCues([[0, 13]]);
    expect(m.map((c) => [c.start, c.end])).toEqual([[0, 6.5], [6.5, 13]]);
    expect(m[0].lines).toEqual(["[music]"]);
  });
});

describe("article", () => {
  const t = (text: string, speaker: string, start: number): Tok => ({ text, start, end: start + 0.3, speaker });
  test("a backchannel stays with the paragraph it interrupts; a non-backchannel fragment is a turn", () => {
    const md = toArticle([
      t("One", "Nik", 0), t("two", "Nik", 0.4), t("three.", "Nik", 0.8), t("Yep.", "Kirk", 2), t("Four", "Nik", 3), t("five.", "Nik", 3.4),
      t("It's,", "Kirk", 4), t("Six.", "Nik", 5),
    ], { paraWords: 3 });
    expect(md).toBe([
      "**Nik** [00:00:00]", "", "One two three. *(Kirk: Yep.)*", "", "Four five.", "",
      "**Kirk** [00:00:04]", "", "It's,", "",
      "**Nik** [00:00:05]", "", "Six.", "",
    ].join("\n"));
  });
});

describe("round trip", () => {
  test("SRT -> parse -> SRT is lossless, and every kept word is in the captions in order", async () => {
    const { toks } = await fixture("final");
    const clean = cleanCaption(toks);
    const cues = buildCues(clean);
    const srt = toSrt(cues);
    const back = parseSrt(srt);
    expect(back).toEqual(cues.map((c) => ({ start: +c.start.toFixed(3), end: +c.end.toFixed(3), lines: c.lines })));
    expect(toSrt(back)).toBe(srt);
    const heard = back.flatMap((c) => c.lines.map((l) => l.replace(/^(- |(Nik|Kirk): )/, "")).join(" ").split(" "));
    expect(heard.join(" ")).toBe(clean.map((t) => t.text).join(" "));
  });
});

describe("golden files", () => {
  test("final SRT, VTT and podcast article match the golden files", async () => {
    const fin = await fixture("final");
    const cues = [...musicCues([[0, 5]]), ...buildCues(cleanCaption(fin.toks))];
    await golden("final.srt", toSrt(cues));
    await golden("final.vtt", toVtt(cues));
    const pod = await fixture("audio");
    await golden("podcast.transcript.md", toArticle(pod.toks, { title: "Fixture episode" }));
  });
});
