// Tests for the overlay sound convention (sfx-manifest.ts): pure planning, plus exit measurement
// and typing trims on small synthetic files.
// Run: bun test tests/sfx-manifest.test.ts
import { afterAll, describe, expect, test } from "bun:test";
import { $ } from "bun";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { ENTRY_MAX, entryInSequence, exitFrom, LIB, measureExit, missingSfx, plan, sequenceSfx, sequences, SEQ_GAP, revealBursts, trimTyping, typedLines, typingName, type Overlay } from "../sfx-manifest";

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
  test("a named center set (the hosts move aside, e.g. london) gets IN and OUT like a center card", () => {
    const p = plan({ id: "london", file: "london.mov", placement: "london", dur: 23.62 }, { exit: 23.2 });
    expect(p.sfx).toEqual([{ file: "sfx/center-in.wav", at: 0.05, gain: 1 }, { file: "sfx/center-out.wav", at: 23.1, gain: 0.7 }]);
  });
  test("band card with reveal bursts but no typing render keeps its file and gets typing per line", () => {
    const p = plan({ id: "05", file: "05.mov", placement: "band", dur: 8 }, { bursts: [{ start: 0.04, end: 0.6, line: 0 }, { start: 0.6, end: 1.0, line: 1 }] });
    expect(p).toEqual({ file: "05.mov", sfx: [{ file: "sfx/typing-560ms.wav", at: 0.04, gain: 1 }, { file: "sfx/typing-400ms.wav", at: 0.6, gain: 1 }] });
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

describe("missingSfx: every overlay enters with a sound", () => {
  test("lists overlays with no sound in their first ENTRY_MAX s; a manifest with no sounds at all fails every overlay", () => {
    const o = (id: string, sfx?: { file: string; at: number }[], placement = "center") => ({ id, file: `${id}.mov`, placement, dur: 10, sfx }) as Overlay;
    expect(missingSfx([o("a", [{ file: "sfx/center-in.wav", at: 0.05 }]), o("b", [{ file: "sfx/typing-400ms.wav", at: 0.3 }], "band")])).toEqual([]);
    expect(missingSfx([o("a"), o("b", [])])).toEqual(["a", "b"]);
    expect(missingSfx([o("late", [{ file: "sfx/center-out.wav", at: ENTRY_MAX + 0.5 }])])).toEqual(["late"]);
  });
});

describe("revealBursts: line reveal times of a wipe strip from its alpha", () => {
  test("two lines revealed left to right one after the other: one burst per line", () => {
    // 10x8 frames; line 0 = rows 1-2 revealed over frames 1-4, line 1 = rows 5-6 over frames 4-6.
    const W = 10, H = 8, frames: Uint8Array[] = [];
    for (let f = 0; f < 10; f++) {
      const a = new Uint8Array(W * H);
      const c0 = Math.min(W, Math.max(0, Math.round(((f - 0) / 4) * W))), c1 = Math.min(W, Math.max(0, Math.round(((f - 4) / 2) * W)));
      for (const y of [1, 2]) for (let x = 0; x < c0; x++) a[y * W + x] = 255;
      for (const y of [5, 6]) for (let x = 0; x < c1; x++) a[y * W + x] = 255;
      frames.push(a);
    }
    expect(revealBursts(frames, W, H, 10)).toEqual([{ start: 0.1, end: 0.4, line: 0 }, { start: 0.5, end: 0.6, line: 1 }]);
  });
});

// Nik, 2026-11-27 (episode 198): overlays that follow one another as one sequence get one entry
// sound, on the first; the rest change silently ("user already attracted").
describe("sequences: one entry sound per run of overlays", () => {
  const IN = { file: "sfx/center-in.wav", at: 0.05, gain: 1 }, OUT = (at: number) => ({ file: "sfx/center-out.wav", at, gain: 0.7 });
  const T = (at: number) => ({ file: "sfx/typing-400ms.wav", at, gain: 1 }), ACC = { file: "sfx/accent.wav", at: 2, gain: 1 };
  const c = (id: string, outStart: number, dur: number, extra: Partial<Overlay> = {}): Overlay =>
    ({ id, file: `${id}.mov`, placement: "center", outStart, dur, sfx: [IN, ACC, OUT(dur - 0.4)], ...extra });
  const b = (id: string, outStart: number, dur: number): Overlay => ({ id, file: `${id}.mov`, placement: "band", outStart, dur, sfx: [T(0.04), T(2)] });

  test("a start within SEQ_GAP of the previous end joins the sequence; a later start begins a new one", () => {
    const ovs = [c("a", 10, 5), c("b", 15, 4), c("c", 19 + SEQ_GAP, 3), c("d", 22 + 3 + SEQ_GAP + 0.5, 3)];
    expect(sequences(ovs).map((s) => s.map((o) => o.id))).toEqual([["a", "b", "c"], ["d"]]);
  });
  test("the same group id joins a sequence across a longer gap; order is by start time", () => {
    const ovs = [c("y", 40, 2, { group: "g" }), c("x", 10, 2, { group: "g" })];
    expect(sequences(ovs).map((s) => s.map((o) => o.id))).toEqual([["x", "y"]]);
  });
  test("sequenceSfx keeps only the first entry cue and the last exit cue; accents stay", () => {
    const out = sequenceSfx([c("a", 10, 5), b("s", 15.5, 4), c("c", 20, 3)]);
    expect(out.map((o) => o.sfx)).toEqual([
      [IN, ACC],
      [T(2)],
      [ACC, OUT(2.6)],
    ]);
  });
  test("a lone overlay keeps all its sounds", () => {
    const o = c("solo", 100, 5);
    expect(sequenceSfx([o])[0].sfx).toEqual(o.sfx);
  });
  test("missingSfx does not ask for an entry sound inside a sequence", () => {
    expect(missingSfx(sequenceSfx([c("a", 10, 5), c("b", 15, 4)]))).toEqual([]);
    expect(missingSfx([c("a", 10, 5), { ...c("b", 15, 4), sfx: [] }])).toEqual([]);
    expect(missingSfx([{ ...c("a", 10, 5), sfx: [] }, c("b", 15, 4)])).toEqual(["a"]);
  });
  test("entryInSequence names overlays after the first that still enter with a sound", () => {
    expect(entryInSequence([c("a", 10, 5), c("b", 15, 4), b("s", 30, 3)])).toEqual(["b"]);
    expect(entryInSequence(sequenceSfx([c("a", 10, 5), c("b", 15, 4)]))).toEqual([]);
  });
});
