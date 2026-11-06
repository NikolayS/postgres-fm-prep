// Tests for face-track/track.ts: crop size, clamping to the tile, dead zone and smoothing.
// Run: bun test tests/face-track.test.ts
import { describe, expect, test } from "bun:test";
import { DEFAULTS, track } from "../face-track/track";

// n frames (1 per s) with one face centred at (fx, fy), fractions of the detection frame.
const faces = (n: number, at: (i: number) => [number, number] | null) =>
  Array.from({ length: n }, (_, i) => {
    const c = at(i);
    return JSON.stringify({ f: `f${String(i + 1).padStart(5, "0")}.jpg`, faces: c ? [[c[0] - 0.1, c[1] - 0.15, 0.2, 0.3, 0.9]] : [] });
  });

describe("track", () => {
  test("crop keeps the place aspect, even sizes", () => {
    const r = track(faces(3, () => [0.5, 0.5]));
    expect([r.w, r.h]).toEqual([700, 526]);
  });
  test("a still face gives one point, centred in x, face at face-y in y (clamped to the tile)", () => {
    const r = track(faces(5, () => [0.5, 0.5]));
    expect(r.path).toEqual([[0, 162, 7]]); // x 512 - 350; y 288 - 0.55 * 526 is above the top limit 7
  });
  test("a move inside the dead zone does not move the crop", () => {
    const r = track(faces(20, (i) => [i < 10 ? 0.5 : 0.53, 0.5])); // 0.03 * 1024 = 31 px < 45
    expect(new Set(r.path.map((p) => p[1]))).toEqual(new Set([162]));
  });
  test("a big move glides there in a few seconds and stays in the tile", () => {
    const r = track(faces(20, (i) => [i < 5 ? 0.3 : 0.9, 0.5]));
    const xs = r.path.map((p) => p[1]);
    expect(xs[xs.length - 1]).toBe(1024 - 8 - 700); // clamped right
    const first = r.path.find((p) => p[1] === xs[xs.length - 1])!;
    expect(first[0]).toBeGreaterThan(6.5);
    expect(first[0]).toBeLessThan(10);
  });
  test("frames without a face keep the last position", () => {
    const r = track(faces(10, (i) => (i < 3 ? [0.5, 0.5] : null)));
    expect(r.path.length).toBe(1);
  });
  test("defaults match the episode 195 run", () => {
    expect(DEFAULTS.cropH).toBe(526);
    expect(DEFAULTS.faceY).toBe(0.55);
  });
});
