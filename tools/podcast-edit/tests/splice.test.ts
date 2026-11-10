// Tests for splice.ts on tiny generated videos (needs ffmpeg). Run: bun test tests/splice.test.ts
import { describe, expect, test } from "bun:test";
import { $ } from "bun";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { probe, widen } from "../splice";

const T = import.meta.dir + "/../splice.ts";
const d = mkdtempSync(join(tmpdir(), "splice-"));
const f = (n: string) => join(d, n);
await $`ffmpeg -y -v error -f lavfi -i testsrc2=size=320x180:rate=25 -f lavfi -i sine=f=440:sample_rate=48000 -t 8 -c:v libx264 -g 25 -pix_fmt yuv420p -video_track_timescale 12800 -c:a aac -shortest ${f("in.mp4")}`;
await $`ffmpeg -y -v error -f lavfi -i color=c=red:size=320x180:rate=25 -t 4 -c:v libx264 -pix_fmt yuv420p ${f("red.mp4")}`;
await $`ffmpeg -y -v error -f lavfi -i color=c=blue:size=320x180:rate=25 -t 2 -c:v libx264 -pix_fmt yuv420p ${f("outro.mp4")}`;
const px = async (file: string, t: number) => [...new Uint8Array(await $`ffmpeg -v error -ss ${t} -i ${file} -frames:v 1 -vf crop=2:2:160:90,scale=1:1 -f rawvideo -pix_fmt rgb24 -`.arrayBuffer())];

describe("widen", () => {
  test("snaps to the keyframe before --from and after --to; the end when none follows", () => {
    expect(widen(2.3, 4.1, [0, 1, 2], [5, 6], 8, 25)).toEqual({ a: 2, b: 5, fa: 50, fb: 125 });
    expect(widen(6.5, 7.9, [5, 6], [], 8, 25)).toMatchObject({ a: 6, b: 8, fb: null });
  });
});

describe("splice", () => {
  test("--with replaces the picture of the window, keeps frame count and audio", async () => {
    await $`bun ${T} ${f("in.mp4")} ${f("o1.mp4")} --to 3 --with ${f("red.mp4")}`.quiet();
    const [a, b] = [await probe(f("in.mp4")), await probe(f("o1.mp4"))];
    expect(b.frames).toBe(a.frames);
    expect(b.hasAudio).toBe(true);
    const red = await px(f("o1.mp4"), 1.5), after = await px(f("o1.mp4"), 5.5), orig = await px(f("in.mp4"), 5.5);
    expect(red[0]).toBeGreaterThan(200); expect(red[2]).toBeLessThan(40);
    expect(after).toEqual(orig); // stream-copied part is untouched
  });

  test("--outro crossfades into a new ending at --at", async () => {
    await $`bun ${T} ${f("in.mp4")} ${f("o2.mp4")} --outro ${f("outro.mp4")} --at 6`.quiet();
    const b = await probe(f("o2.mp4"));
    expect(b.duration).toBeCloseTo(8, 1);
    const end = await px(f("o2.mp4"), 7.6);
    expect(end[2]).toBeGreaterThan(200);
  });
});
