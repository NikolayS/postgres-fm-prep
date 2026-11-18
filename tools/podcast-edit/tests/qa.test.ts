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

  test("an unconfigured check fails the run; a reasoned skip passes", () => {
    const ep = join(dir, "ep");
    mkdirSync(join(ep, "notes"), { recursive: true });
    writeFileSync(join(ep, "notes/blog-candidates.md"), "# Blog candidates\n");
    writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", skip: { audio: "test", eyes: "test", captions: "test" } }));
    const bad = qa(ep);
    expect(bad.exitCode).toBe(1);
    expect(bad.stdout.toString()).toMatch(/FAIL\s+strips\s+not configured/);
    writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", skip: { audio: "test", eyes: "test", captions: "test", strips: "test" } }));
    const ok = qa(ep);
    expect(ok.stdout.toString()).toMatch(/PASS\s+cards[\s\S]*QA PASSED/);
    expect(ok.exitCode).toBe(0);
    expect(JSON.parse(readFileSync(join(dir, "out/qa-summary.json"), "utf8")).pass).toBe(true);
  });

  test("cards: a missing blog-candidates.md fails", () => {
    const ep = join(dir, "ep2");
    mkdirSync(ep, { recursive: true });
    writeFileSync(join(ep, "qa.json"), JSON.stringify({ out: "${QA_OUT}", skip: { audio: "t", eyes: "t", captions: "t", strips: "t" } }));
    const r = qa(ep);
    expect(r.exitCode).toBe(1);
    expect(r.stdout.toString()).toMatch(/blog-candidates\.md is missing/);
  });
});
