// The one-command QA gate (qa.ts): config expansion, the summary, and the CLI exit code.
// Run: bun test tests/qa.test.ts
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { expand, summary } from "../qa";

const dir = mkdtempSync(join(tmpdir(), "qa-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const qa = (ep: string) => Bun.spawnSync(["bun", join(import.meta.dir, "../qa.ts"), ep], { env: { ...process.env, QA_OUT: join(dir, "out") } });

describe("qa.ts", () => {
  test("expand fills ${VAR} from the environment and refuses unset ones", () => {
    expect(expand({ a: ["${X}/v.mp4"], n: 3 }, { X: "/m" })).toEqual({ a: ["/m/v.mp4"], n: 3 });
    expect(() => expand("${NOPE_QA}/x", {})).toThrow(/NOPE_QA/);
  });

  test("summary fails on any FAIL; SKIP with a reason is allowed", () => {
    expect(summary([{ check: "audio", status: "PASS", detail: "", problems: [] }, { check: "eyes", status: "SKIP", detail: "no key frames", problems: [] }]).pass).toBe(true);
    const s = summary([{ check: "cards", status: "FAIL", detail: "1 card", problems: ["x: headline"] }]);
    expect(s.pass).toBe(false);
    expect(s.text).toMatch(/FAIL\s+cards[\s\S]*x: headline[\s\S]*QA FAILED/);
  });

  test("facing: Nik on the left fails (episode 198), Kirk left and Nik right passes; no record fails", () => {
    const ep = join(dir, "ep-facing");
    mkdirSync(join(ep, "notes"), { recursive: true });
    writeFileSync(join(ep, "notes/blog-candidates.md"), "# Blog candidates\n");
    const skip = { audio: "t", eyes: "t", captions: "t", strips: "t", sfx: "t", length: "t" };
    const layout = (nikX: number, kirkX: number) => writeFileSync(join(ep, "layout.json"), JSON.stringify({ place: { nik: { x: nikX, w: 800 }, kirk: { x: kirkX, w: 800 }, robot: { x: 1656, w: 240, small: true } } }));
    writeFileSync(join(ep, "facing.json"), JSON.stringify({ hosts: { nik: { facing: "left", evidence: ["n.png"] }, kirk: { facing: "right", evidence: ["k.png"] } } }));
    writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", skip, facing: { layout: join(ep, "layout.json"), record: "facing.json" } }));
    layout(120, 1000);
    const bad = qa(ep);
    expect(bad.exitCode).toBe(1);
    expect(bad.stdout.toString()).toMatch(/FAIL\s+facing[\s\S]*nik faces left but sits on the left edge/);
    layout(1000, 120);
    const ok = qa(ep);
    expect(ok.stdout.toString()).toMatch(/PASS\s+facing\s+order kirk, nik/);
    expect(ok.exitCode).toBe(0);
    writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", skip, facing: { layout: join(ep, "layout.json"), record: "missing.json" } }));
    expect(qa(ep).stdout.toString()).toMatch(/FAIL\s+facing[\s\S]*no facing record/);
  });

  test("an unconfigured check fails the run; a reasoned skip passes", () => {
    const ep = join(dir, "ep");
    mkdirSync(join(ep, "notes"), { recursive: true });
    writeFileSync(join(ep, "notes/blog-candidates.md"), "# Blog candidates\n");
    writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", skip: { audio: "test", eyes: "test", captions: "test", sfx: "test", facing: "test", length: "test" } }));
    const bad = qa(ep);
    expect(bad.exitCode).toBe(1);
    expect(bad.stdout.toString()).toMatch(/FAIL\s+strips\s+not configured/);
    writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", skip: { audio: "test", eyes: "test", captions: "test", strips: "test", sfx: "test", facing: "test", length: "test" } }));
    const ok = qa(ep);
    expect(ok.stdout.toString()).toMatch(/PASS\s+cards[\s\S]*QA PASSED/);
    expect(ok.exitCode).toBe(0);
    expect(JSON.parse(readFileSync(join(dir, "out/qa-summary.json"), "utf8")).pass).toBe(true);
  });

  test("cards: a missing blog-candidates.md fails", () => {
    const ep = join(dir, "ep2");
    mkdirSync(ep, { recursive: true });
    writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", skip: { audio: "t", eyes: "t", captions: "t", strips: "t", sfx: "t" } }));
    const r = qa(ep);
    expect(r.exitCode).toBe(1);
    expect(r.stdout.toString()).toMatch(/blog-candidates\.md is missing/);
  });

  test("sfx: a manifest without entry sounds fails (episode 197 rendered the raw manifest.json); manifest-sfx.json passes", () => {
    const ep = join(dir, "ep3");
    mkdirSync(join(ep, "notes"), { recursive: true });
    mkdirSync(join(ep, "ov/sfx"), { recursive: true });
    writeFileSync(join(ep, "notes/blog-candidates.md"), "# Blog candidates\n");
    writeFileSync(join(ep, "ov/sfx/center-in.wav"), "");
    const ov = (sfx?: object[]) => ({ overlays: [{ id: "f01", file: "f01.mov", placement: "center", outStart: 10, dur: 5, ...(sfx ? { sfx } : {}) }] });
    writeFileSync(join(ep, "ov/manifest.json"), JSON.stringify(ov()));
    writeFileSync(join(ep, "ov/manifest-sfx.json"), JSON.stringify(ov([{ file: "sfx/center-in.wav", at: 0.05 }])));
    const cfg = (m: string) => writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", sfx: { manifest: join(ep, "ov", m) }, skip: { audio: "t", eyes: "t", captions: "t", strips: "t", facing: "t", length: "t" } }));
    cfg("manifest.json");
    const bad = qa(ep);
    expect(bad.exitCode).toBe(1);
    expect(bad.stdout.toString()).toMatch(/FAIL\s+sfx[\s\S]*f01: no entry sound/);
    cfg("manifest-sfx.json");
    const ok = qa(ep);
    expect(ok.stdout.toString()).toMatch(/PASS\s+sfx/);
    expect(ok.exitCode).toBe(0);
  });
});
