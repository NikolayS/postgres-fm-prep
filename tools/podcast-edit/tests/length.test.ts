// Spec for the qa.ts check "length": the final is as long as its parts and ends on the outro.
// Episode 198: a compose froze at the outro; the final was 21.5 s short, had no outro, and QA passed.
// Run: bun test tests/length.test.ts
import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { checkLength, lengthVerdict } from "../qa/length";

const dir = mkdtempSync(join(tmpdir(), "length-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const ff = (...a: string[]) => { const p = Bun.spawnSync(["ffmpeg", "-loglevel", "error", "-y", ...a]); if (p.exitCode) throw new Error(p.stderr.toString()); };
const clip = (out: string, src: string, sec: number) =>
  ff("-f", "lavfi", "-i", `${src}${src.includes("=") ? ":" : "="}size=320x180:rate=25`, "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000", "-t", String(sec), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", out);
const cat = (out: string, ...parts: string[]) => {
  const list = join(dir, "list.txt");
  writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n") + "\n");
  ff("-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out);
};

describe("length: final = cold open + body (time map), ending on the outro", () => {
  test("lengthVerdict: within tolerance passes; 21.5 s short fails", () => {
    expect(lengthVerdict({ final: 3262.93, coldOpen: 20.138, body: 3242.76 }).pass).toBe(true);
    const v = lengthVerdict({ final: 3241.39, coldOpen: 20.138, body: 3242.76 });
    expect(v.pass).toBe(false);
    expect(v.problem).toContain("21.5");
  });

  test("a final that ends on the outro passes; one that is short, or ends on show frames, fails", async () => {
    const co = join(dir, "co.mp4"), show = join(dir, "show.mp4"), outro = join(dir, "outro.mp4");
    clip(co, "color=c=blue", 2); clip(show, "testsrc2", 4); clip(outro, "mandelbrot", 3);
    const body = join(dir, "body.mp4"); cat(body, show, outro);
    const tm = join(dir, "body.time-map.json"); writeFileSync(tm, JSON.stringify({ total: 7, logo: { start: 4, sec: 3 } }));
    const good = join(dir, "good.mp4"); cat(good, co, body);
    const cfg = { coldOpen: co, timeMap: tm, outro };
    const ok = await checkLength({ ...cfg, video: good });
    expect(ok.problems).toEqual([]);
    // the episode 198 failure: render stopped before the outro
    const short = join(dir, "short.mp4"); cat(short, co, show);
    expect((await checkLength({ ...cfg, video: short })).problems.join("\n")).toMatch(/short|outro/);
    // right length, wrong ending: show frames where the outro should be
    const show7 = join(dir, "show7.mp4"); clip(show7, "testsrc2", 7);
    const wrong = join(dir, "wrong.mp4"); cat(wrong, co, show7);
    const w = await checkLength({ ...cfg, video: wrong });
    expect(w.problems.join("\n")).toContain("does not end on the outro");
  });
  test("the compose fade to black over the last 2 s does not count as a wrong ending (episode 198 body render)", async () => {
    const co = join(dir, "co2.mp4"), show = join(dir, "show2.mp4"), outro = join(dir, "outro6.mp4");
    clip(co, "color=c=blue", 2); clip(show, "testsrc2", 4); clip(outro, "mandelbrot", 6);
    const raw = join(dir, "body2raw.mp4"); cat(raw, show, outro);
    const body = join(dir, "body2.mp4");
    ff("-i", raw, "-vf", "fade=t=out:st=8:d=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "copy", body);
    const tm = join(dir, "body2.time-map.json"); writeFileSync(tm, JSON.stringify({ total: 10, logo: { start: 4, sec: 6 } }));
    const fin = join(dir, "faded.mp4"); cat(fin, co, body);
    const r = await checkLength({ video: fin, coldOpen: co, timeMap: tm, outro });
    expect(r.problems).toEqual([]);
  });
});
