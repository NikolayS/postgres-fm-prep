// Spec for the pre-preview QA checks (qa/*.ts). Pure functions get synthetic data; the ffmpeg
// readers get small generated files. Run: bun test tests/qa-checks.test.ts
import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { blockDb, readPcm, voiceVsMusic } from "../qa/audio";
import { captionViolations, growFace } from "../qa/caps";
import { eyesVerdict, parseFaces } from "../qa/eyes";
import { alphaBox, readRgba, stripIssues } from "../qa/strips";

const dir = mkdtempSync(join(tmpdir(), "qa-checks-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const ff = (...a: string[]) => { const p = Bun.spawnSync(["ffmpeg", "-loglevel", "error", "-y", ...a]); if (p.exitCode) throw new Error(p.stderr.toString()); };

describe("audio: voice above music", () => {
  test("blockDb gives RMS dBFS per block, with a floor for silence", () => {
    const rate = 1000, s = new Float32Array(2000);
    for (let i = 0; i < 1000; i++) s[i] = 0.5 * Math.sin((2 * Math.PI * 50 * i) / rate); // RMS 0.3536 = -9.03 dBFS
    const db = blockDb(s, rate, 0.5);
    expect(db.length).toBe(4);
    expect(db[0]).toBeCloseTo(-9.03, 1);
    expect(db[3]).toBe(-120);
  });

  test("a voice 15 dB over the music passes; 5 dB fails", () => {
    const music = Array(10).fill(-35);
    const ok = voiceVsMusic({ Nik: [...Array(5).fill(-20), ...Array(5).fill(-90)], Michael: [...Array(5).fill(-90), ...Array(5).fill(-20)] }, music);
    expect(ok.pass).toBe(true);
    const bad = voiceVsMusic({ Nik: [...Array(5).fill(-20), ...Array(5).fill(-90)], Michael: [...Array(5).fill(-90), ...Array(5).fill(-30)] }, music, { maxSpreadDb: 20 });
    expect(bad.pass).toBe(false);
    const m = bad.rows.find((r) => r.voice === "Michael")!;
    expect(m.pass).toBe(false);
    expect(m.gapMedianDb).toBeCloseTo(5, 5);
    expect(m.blocks).toBe(5);
  });

  test("only blocks where the voice is active and dominant count", () => {
    // Nik talks in blocks 0-4, Michael in 5-9; Michael's mic hears Nik 10 dB lower (bleed).
    const nik = [...Array(5).fill(-20), ...Array(5).fill(-60)];
    const michael = [...Array(5).fill(-30), ...Array(5).fill(-21)];
    const r = voiceVsMusic({ Nik: nik, Michael: michael }, Array(10).fill(-40));
    expect(r.rows.find((x) => x.voice === "Nik")!.blocks).toBe(5);
    expect(r.rows.find((x) => x.voice === "Michael")!.blocks).toBe(5);
    expect(r.pass).toBe(true);
  });

  test("a quiet voice fails the spread check (Michael's mic runs quiet)", () => {
    const r = voiceVsMusic({ Nik: [...Array(5).fill(-18), ...Array(5).fill(-90)], Michael: [...Array(5).fill(-90), ...Array(5).fill(-26)] }, Array(10).fill(-60));
    expect(r.spreadDb).toBeCloseTo(8, 5);
    expect(r.pass).toBe(false);
    expect(r.errors.join(" ")).toMatch(/spread/i);
  });

  test("a voice with no speech at all fails", () => {
    const r = voiceVsMusic({ Nik: Array(4).fill(-20), Kirk: Array(4).fill(-100) }, Array(4).fill(-50));
    expect(r.pass).toBe(false);
    expect(r.errors.join(" ")).toMatch(/Kirk/);
  });

  test("readPcm decodes a file to mono float samples at the given rate", async () => {
    const f = join(dir, "tone.wav");
    ff("-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=1", "-ac", "2", f);
    const s = await readPcm(f, 8000);
    expect(s.length).toBeGreaterThan(7900);
    expect(s.length).toBeLessThan(8100);
    const db = blockDb(s, 8000, 0.5);
    expect(db[0]).toBeGreaterThan(-24); // ffmpeg sine: amplitude 1/8, RMS -21.07 dBFS
    expect(db[0]).toBeLessThan(-18);
  });
});

describe("captions never over faces", () => {
  test("growFace adds room for hair (35% up) and beard (25% down)", () => {
    expect(growFace([100, 200, 100, 100])).toEqual([90, 155, 120, 180]);
  });

  test("an overlap with a grown face box is a violation; a caption beside the face is fine", () => {
    const face: [number, number, number, number] = [800, 300, 200, 240];
    const r = captionViolations([
      { frame: "a.jpg", faces: [face], caps: [[200, 300, 400, 80]] },
      { frame: "b.jpg", faces: [face], caps: [[850, 560, 400, 80]] }, // under the chin, inside the beard margin
    ]);
    expect(r.violations.length).toBe(1);
    expect(r.violations[0]).toMatch(/b\.jpg/);
  });

  test("a caption in the bottom 180 px is a violation", () => {
    const r = captionViolations([{ frame: "c.jpg", faces: [], caps: [[100, 860, 400, 60]] }]);
    expect(r.violations.join(" ")).toMatch(/c\.jpg.*(safe|bottom)/);
    expect(r.framesWithoutFaces).toBe(1);
  });
});

describe("eyes open on key frames", () => {
  test("parseFaces reads the faces.swift JSON lines", () => {
    const m = parseFaces('{"f":"/x/a.jpg","faces":[{"box":[1,2,3,4],"pupils":[0,0,0,0],"eyes":[0.31,0.29]}]}\n{"f":"/x/b.jpg","faces":[]}\n');
    expect(m.get("/x/a.jpg")![0].eyes).toEqual([0.31, 0.29]);
    expect(m.get("/x/b.jpg")).toEqual([]);
  });

  test("open eyes pass; one closed eye fails; a missing face fails", () => {
    const open = { box: [0, 0, 100, 100] as [number, number, number, number], eyes: [0.32, 0.3] as [number, number] };
    const blink = { ...open, eyes: [0.08, 0.3] as [number, number] };
    expect(eyesVerdict([open, open], { expectFaces: 2 }).pass).toBe(true);
    const b = eyesVerdict([open, blink], { expectFaces: 2 });
    expect(b.pass).toBe(false);
    expect(b.closed).toEqual([1]);
    expect(eyesVerdict([open], { expectFaces: 2 }).pass).toBe(false);
    expect(eyesVerdict([], {}).pass).toBe(false);
  });
});

describe("text strips: no clipping, nothing in the bottom 180 px", () => {
  const W = 200, H = 120;
  const img = (x0: number, y0: number, x1: number, y1: number) => {
    const a = new Uint8Array(W * H * 4);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) a[(y * W + x) * 4 + 3] = 255;
    return a;
  };

  test("alphaBox finds the drawn area", () => {
    expect(alphaBox(img(10, 20, 60, 40), W, H)).toEqual([10, 20, 50, 20]);
    expect(alphaBox(new Uint8Array(W * H * 4), W, H)).toBeNull();
  });

  test("a strip cut by the frame edge is reported", () => {
    expect(stripIssues(img(10, 20, 60, 40), W, H, { safeBottom: 100 })).toEqual([]);
    expect(stripIssues(img(10, 90, 60, 120), W, H, { safeBottom: 200 }).join(" ")).toMatch(/bottom edge/);
    expect(stripIssues(img(0, 20, 60, 40), W, H, { safeBottom: 100 }).join(" ")).toMatch(/left edge/);
  });

  test("a strip that ends below the safe line is reported", () => {
    expect(stripIssues(img(10, 80, 60, 105), W, H, { safeBottom: 100 }).join(" ")).toMatch(/safe/);
  });

  test("readRgba decodes a PNG with alpha", async () => {
    const f = join(dir, "a.png");
    ff("-f", "lavfi", "-i", "color=c=red@0.0:s=64x32,format=rgba,drawbox=x=8:y=4:w=16:h=8:color=white@1:t=fill:replace=1", "-frames:v", "1", f);
    const { w, h, data } = await readRgba(f);
    expect([w, h]).toEqual([64, 32]);
    expect(alphaBox(data, w, h)).toEqual([8, 4, 16, 8]);
  });
});
