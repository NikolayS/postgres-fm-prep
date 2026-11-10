// Tests for find.ts on the subtitles fixtures. Run: bun test tests/find.test.ts
import { describe, expect, test } from "bun:test";
import { findPhrase, locate, mapTime } from "../find";
import { loadTranscript } from "../lib";

const F = import.meta.dir + "/subtitles/fixture";
const words = (await loadTranscript(F + ".words.json")).words;
const cuts = await Bun.file(F + ".cuts.json").json();
const timeMap = await Bun.file(F + ".time-map.json").json();
const audioMap = await Bun.file(F + ".audio-map.json").json();

describe("find", () => {
  test("matches ignore case and punctuation; @S limits to a window", () => {
    const all = findPhrase(words, "hello");
    expect(all.length).toBeGreaterThan(1);
    expect(findPhrase(words, "HELLO,", 2.0, 0.2).map((h) => h.a)).toEqual([2.0]);
  });

  test("source time maps through cuts, the compose map and the audio map", () => {
    const [h] = locate(words, ["hello@2"], { cuts, timeMap, audioMap });
    const e = mapTime(2.0, cuts.segmentTimes);
    expect(h.edited).toBeCloseTo(e!, 6);
    expect(h.final).toBeCloseTo(timeMap.card + e!, 6); // before the freeze: card + edited
    expect(h.podcast).toBeCloseTo(3 + (2.0 - 1.8), 6);
  });

  test("a word inside a cut maps to null, not to a nearby time", () => {
    const [h] = locate(words, ["computer"], { cuts });
    expect(h.edited).toBeNull();
  });
});
