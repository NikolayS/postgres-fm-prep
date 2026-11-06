// Tests for layout.ts filtergraph features: per-tile crop, tiles that exist only in some Zoom
// layouts, and face tracking (track JSON -> sendcmd crop path).
// Run: bun test tests/layout.test.ts
import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { filtergraph, resolvePlaces, trackAt, trackCommands, type LayoutConfig, type Track } from "../layout";
import type { Detection } from "../detect-tiles";

const dir = mkdtempSync(join(tmpdir(), "layout-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

// Two Zoom layouts: L0 gallery (a, b), L1 the same plus a screen share. 1 fps, no cuts.
const tiles: Detection = {
  video: "x.mp4", width: 2048, height: 1152, every: 10,
  layouts: [
    { id: "L0", tiles: { a: { x: 0, y: 0, w: 1024, h: 576 }, b: { x: 1024, y: 0, w: 1024, h: 576 } } },
    { id: "L1", tiles: { a: { x: 0, y: 576, w: 1024, h: 576 }, b: { x: 1024, y: 576, w: 1024, h: 576 }, screen: { x: 0, y: 0, w: 2048, h: 576 } } },
  ],
  intervals: [{ layout: "L0", start: 0, end: 10 }, { layout: "L1", start: 10, end: 20 }, { layout: "L0", start: 20, end: 30 }],
} as unknown as Detection;
const config = (place: LayoutConfig["place"]): LayoutConfig => ({
  canvas: { w: 1920, h: 1080, fps: 25 }, tiles, crop: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 }, place,
});
const host = { x: 0, y: 0, w: 608, h: 456 };

describe("per-tile crop", () => {
  test("a place's own crop replaces the global one", () => {
    const { graph } = filtergraph(config({ screen: { ...host, w: 1600, h: 450, crop: { top: 0, bottom: 0, left: 0, right: 0 } } }), tiles, null);
    expect(graph).toContain("crop=2048:576:0:0,"); // the whole tile: same aspect, no trim
  });
  test("without one, the global crop applies", () => {
    const { graph } = filtergraph(config({ screen: { ...host, w: 1600, h: 450 } }), tiles, null);
    expect(graph).not.toContain("crop=2048:576:0:0,");
  });
});

describe("tiles in some Zoom layouts only", () => {
  test("the screen share is shown only while its layout is on; hosts always", () => {
    const { graph } = filtergraph(config({ a: host, screen: { ...host, x: 100, w: 1600, h: 450 } }), tiles, null);
    expect(graph).toMatch(/\[box_screen\]overlay=100:0:enable='between\(t,10\.000,19\.999\)'/);
    expect(graph).toMatch(/\[box_a\]overlay=0:0\[o_a\]/);
  });
});

describe("track", () => {
  const trk: Track = { w: 400, h: 300, path: [[0, 100, 50], [5, 110, 52], [12, 120, 60]] };
  test("trackAt: the last point at or before t", () => {
    expect(trackAt(trk, 0)).toEqual([100, 50]);
    expect(trackAt(trk, 7)).toEqual([110, 52]);
    expect(trackAt(trk, 99)).toEqual([120, 60]);
  });
  test("trackCommands: window time, one crop per variant at tile origin + point", () => {
    const cmd = trackCommands(trk, 4, [{ i: 0, x: 0, y: 0 }, { i: 3, x: 0, y: 576 }]);
    expect(cmd).toBe(
      "1.000 crop@trk0 x 110, crop@trk0 y 52, crop@trk3 x 110, crop@trk3 y 628;\n" +
      "8.000 crop@trk0 x 120, crop@trk0 y 60, crop@trk3 x 120, crop@trk3 y 636;\n");
  });
  test("filtergraph: named crops, one sendcmd, the command file next to the track", () => {
    const p = join(dir, "a-track.json");
    writeFileSync(p, JSON.stringify(trk));
    const { graph } = filtergraph(config({ a: { ...host, track: p } }), tiles, null, 6);
    expect(graph.match(/sendcmd=/g)?.length).toBe(1);
    expect(graph).toContain(`sendcmd=f='${join(dir, "a-track.cmd")}',crop@trk0=400:300:110:52,scale=608:456`);
    expect(graph).toContain("crop@trk1=400:300:110:628,scale=608:456");
    expect(readFileSync(join(dir, "a-track.cmd"), "utf8").split("\n")[0]).toBe("6.000 crop@trk0 x 120, crop@trk0 y 60, crop@trk1 x 120, crop@trk1 y 636;");
  });
  test("resolvePlaces: track paths are relative to the config", () => {
    const c = config({ a: { ...host, track: "t/a.json" }, b: { ...host, track: "/abs/b.json" } });
    resolvePlaces(c, "/cfg");
    expect(c.place.a.track).toBe("/cfg/t/a.json");
    expect(c.place.b.track).toBe("/abs/b.json");
  });
});
