// Regression tests for freeze-card audio (freeze-audio.ts): a freeze over noisy mic sound must come
// out silent, with no repeat pattern, and the talk around it must stay in place.
// Run: bun test tests/freeze-audio.test.ts
import { afterAll, describe, expect, test } from "bun:test";
import { $ } from "bun";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { quietEdges, sfxOff, talkChain, type Level } from "../freeze-audio";

const dir = mkdtempSync(join(tmpdir(), "freeze-audio-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const R = 48000;

// "Mic": pink noise at about -40 dBFS with a breath-like burst (band noise, +20 dB) every 0.8 s:
// the old room-tone picker found no quiet 0.4 s here and looped noise into the freeze.
async function mic(path: string, sec: number) {
  await $`ffmpeg -y -v error -f lavfi -i anoisesrc=c=pink:a=0.02:d=${sec}:r=${R} -f lavfi -i anoisesrc=c=white:a=0.2:d=${sec}:r=${R} -filter_complex ${"[1:a]bandpass=f=900:w=600,volume='if(lt(mod(t,0.8),0.25),1,0)':eval=frame[b];[0:a][b]amix=inputs=2:normalize=0,aformat=channel_layouts=stereo"} -c:a pcm_s16le ${path}`;
}
async function render(input: string, chain: string[], out: string) {
  await $`ffmpeg -y -v error -i ${input} -filter_complex ${chain.join(";")} -map [talk] -ar ${R} -ac 1 -f f32le ${out}`;
  return new Float32Array(await Bun.file(out).arrayBuffer());
}
const rms = (x: Float32Array, a: number, b: number) => { let e = 0; for (let i = Math.floor(a * R); i < Math.floor(b * R); i++) e += x[i] ** 2; return 10 * Math.log10(e / Math.max(1, Math.floor(b * R) - Math.floor(a * R)) + 1e-20); };

describe("freeze over noisy mic audio", () => {
  const src = join(dir, "mic.wav");
  const F = { at: 2.0, sec: 3.0 }, LEN = 6.0;
  let out: Float32Array;
  test("renders", async () => {
    await mic(src, LEN);
    out = await render(src, await talkChain(src, 0, [F], LEN), join(dir, "out.f32"));
    expect(out.length / R).toBeCloseTo(LEN + F.sec, 1); // timing: the freeze adds exactly its length
  });
  test("the freeze is silent", () => {
    expect(rms(out, F.at + 0.05, F.at + F.sec - 0.05)).toBeLessThan(-90);
  });
  test("no repeat pattern in the freeze (energy in 50 ms frames does not vary)", () => {
    const fr: number[] = [];
    for (let t = F.at + 0.05; t + 0.05 <= F.at + F.sec - 0.05; t += 0.05) fr.push(rms(out, t, t + 0.05));
    expect(Math.max(...fr)).toBeLessThan(-90);
  });
  test("the talk before and after is the source", async () => {
    const s = new Float32Array(await $`ffmpeg -v error -i ${src} -ac 1 -ar ${R} -f f32le -`.arrayBuffer());
    const diff = (a: number, b: number, off: number) => { let e = 0, n = 0; for (let i = Math.floor(a * R); i < Math.floor(b * R); i++) (e += (out[i] - s[i - Math.round(off * R)]) ** 2), n++; return 10 * Math.log10(e / n + 1e-20); };
    expect(diff(0.2, F.at - 0.2, 0)).toBeLessThan(-80);
    expect(diff(F.at + F.sec + 0.2, LEN + F.sec - 0.2, F.sec)).toBeLessThan(-80);
  });
});

describe("quietEdges", () => {
  const frames = (dbs: number[], t0: number): Level[] => dbs.map((db, k) => ({ t: +(t0 + k / 100).toFixed(2), db }));
  test("a word tail on the edge: fade out before it, fade in after it", () => {
    // 39.50..39.79: quiet, burst at 39.62-39.68 (the 2026-10-23 hacking-card edge), quiet after.
    const L = frames([-64, -64, -64, -64, -64, -64, -64, -64, -64, -64, -64, -64, -44, -40, -38, -53, -47, -47, -61, -61, -61, -61, -61, -61, -61, -61, -61, -61, -61, -61], 39.5);
    const e = quietEdges(L, 39.64);
    expect(e.outEnd).toBeCloseTo(39.62, 2);
    expect(e.inStart).toBeCloseTo(39.68, 2);
  });
  test("a lone quiet frame inside a burst does not count", () => {
    const L = frames([-60, -60, -60, -40, -58, -40, -40, -60, -60, -60, -60], 1.0);
    expect(quietEdges(L, 1.04).inStart).toBeCloseTo(1.07, 2);
  });
  test("no quiet run nearby: the plain edges", () => {
    const L = frames(Array(20).fill(-20), 5.0);
    expect(quietEdges(L, 5.1)).toEqual({ outEnd: 5.1, inStart: 5.1 });
  });
});

describe("SFX defaults", () => {
  test("air and wind are off, thuds stay", () => {
    expect(sfxOff("air")).toBe(true);
    expect(sfxOff("wind1")).toBe(true);
    expect(sfxOff("thud2")).toBe(false);
    expect(sfxOff("air", [])).toBe(false); // --sfx-off "" turns them back on
  });
});
