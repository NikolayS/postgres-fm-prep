// Tests for the overlay sound convention (sfx-manifest.ts): pure planning, plus exit measurement
// and typing trims on small synthetic files.
// Run: bun test tests/sfx-manifest.test.ts
import { afterAll, describe, expect, test } from "bun:test";
import { $ } from "bun";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { exitFrom, LIB, measureExit, plan, trimTyping, typedLines, typingName, type Overlay } from "../sfx-manifest";

const dir = mkdtempSync(join(tmpdir(), "sfx-manifest-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("typedLines", () => {
  test("one span per line, from the first burst to the last burst end, in order", () => {
    const b = [
      { start: 0.48, end: 0.747, line: "UUIDv4" }, { start: 0.947, end: 2.48, line: "UUIDv4" },
      { start: 13, end: 13.267, line: "UUIDv7" }, { start: 13.467, end: 15, line: "UUIDv7" },
    ];
    expect(typedLines(b)).toEqual([{ at: 0.48, dur: 2 }, { at: 13, dur: 2 }]);
  });
  test("bursts without a line are one line", () => {
    expect(typedLines([{ start: 1, end: 1.5 }, { start: 2, end: 2.25 }])).toEqual([{ at: 1, dur: 1.25 }]);
  });
});

describe("exitFrom", () => {
  test("the first frame of the final drop", () => {
    expect(exitFrom([5, 100, 100, 100, 80, 40, 0], 25, 10)).toBeCloseTo(10 + 4 / 25, 3);
  });
  test("a dip earlier in the card is not the exit", () => {
    expect(exitFrom([100, 50, 100, 100, 60, 0], 25, 0)).toBeCloseTo(4 / 25, 3);
  });
  test("no drop: the overlay's end", () => {
    expect(exitFrom([100, 100, 100], 25, 2)).toBeCloseTo(2 + 3 / 25, 3);
  });
});

describe("plan", () => {
  const sfx = [{ file: "sfx/thud1.wav", at: 9.2, gain: 0.5 }, { file: "sfx/air.wav", at: 0 }, { file: "sfx/thud3.wav", at: 24.8 }];
  test("band card with a typing render: typing per line, thuds kept, air dropped", () => {
    const o: Overlay = { id: "01-x", file: "01-x.mov", placement: "band", dur: 30, sfx };
    const p = plan(o, { typed: "01-x-typing.mov", bursts: [{ start: 0.45, end: 1.45, line: 0 }, { start: 2.1, end: 3.3, line: 1 }] });
    expect(p.file).toBe("01-x-typing.mov");
    expect(p.sfx).toEqual([
      sfx[0], sfx[2],
      { file: "sfx/typing-1000ms.wav", at: 0.45, gain: 1 },
      { file: "sfx/typing-1200ms.wav", at: 2.1, gain: 1 },
    ]);
  });
  test("band card without a typing render keeps its file and drops noise bursts", () => {
    const p = plan({ id: "04", file: "04.mov", placement: "band", dur: 20, sfx }, {});
    expect(p).toEqual({ file: "04.mov", sfx: [sfx[0], sfx[2]] });
  });
  test("center card: IN at 0.05, accent replaces a nearby thud, OUT 0.1 s before the exit at gain 0.7", () => {
    const p = plan({ id: "02", file: "02.mov", placement: "center", dur: 82, sfx }, { exit: 81.64, accents: [24.8] });
    expect(p.sfx).toEqual([
      { file: "sfx/center-in.wav", at: 0.05, gain: 1 },
      sfx[0],
      { file: "sfx/accent.wav", at: 24.8, gain: 1 },
      { file: "sfx/center-out.wav", at: 81.54, gain: 0.7 },
    ]);
  });
  test("re-running on its own output gives the same sounds", () => {
    const o: Overlay = { id: "02", file: "02.mov", placement: "center", dur: 82, sfx };
    const once = plan(o, { exit: 81.64, accents: [24.8] });
    expect(plan({ ...o, sfx: once.sfx }, { exit: 81.64, accents: [24.8] })).toEqual(once);
  });
  test("full cards are left alone", () => {
    expect(plan({ id: "09", file: "09.mov", placement: "full", dur: 5, sfx }, { exit: 4 })).toEqual({ file: "09.mov", sfx });
  });
});

describe("on files", () => {
  test("measureExit finds an alpha fade-out in a ProRes 4444 overlay", async () => {
    const mov = join(dir, "card.mov");
    // 6 s card at 25 fps: alpha fades out from 4.6 s over 0.5 s.
    await $`ffmpeg -y -v error -f lavfi -i color=white:s=320x180:r=25:d=6 -vf format=yuva444p10le,fade=t=out:st=4.6:d=0.5:alpha=1 -c:v prores_ks -profile:v 4444 ${mov}`;
    const exit = await measureExit(mov);
    expect(Math.abs(exit - 4.6)).toBeLessThanOrEqual(0.04 + 1e-6); // within one frame
  });
  test("trimTyping cuts the typing sound to the line plus a short faded tail", async () => {
    const out = join(dir, typingName(0.867));
    await trimTyping(join(LIB, "U2-typing-fast.wav"), 0.867, out);
    const d = Number((await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${out}`.text()).trim());
    expect(d).toBeCloseTo(0.947, 2);
    expect(typingName(0.867)).toBe("typing-867ms.wav");
  });
});
