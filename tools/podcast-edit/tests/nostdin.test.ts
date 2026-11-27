// Every ffmpeg spawn in the repo runs with -nostdin (nostdin.ts). Run: bun test tests/nostdin.test.ts
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { files, fix, violations } from "../nostdin";

describe("violations", () => {
  test("finds shell, template and argv spawns without -nostdin", () => {
    const src = [
      "await $`ffmpeg -y -v error -i ${a} ${b}`;",
      'run(["ffmpeg", "-y", "-i", a]);',
      "I=$(ffmpeg -i x -af ebur128 -f null - 2>&1)",
      "ffmpeg \\",
    ].join("\n");
    expect(violations(src)).toEqual([1, 2, 3, 4]);
  });
  test("passes spawns with -nostdin, comments, ffprobe and plain words", () => {
    const src = [
      "await $`ffmpeg -nostdin -y -i ${a}`;",
      'spawnSync(["ffmpeg", "-nostdin", "-i", a]);',
      "// ffmpeg -i x: a comment",
      "# ffmpeg -y in a shell comment",
      "await $`ffprobe -v error ${f}`;",
      'console.error("ffmpeg failed");',
    ].join("\n");
    expect(violations(src)).toEqual([]);
  });
});

describe("fix", () => {
  test("adds -nostdin once and is idempotent", () => {
    const src = 'await $`ffmpeg -y -i ${a}`;\nrun(["ffmpeg", "-y"]);';
    const once = fix(src);
    expect(once).toBe('await $`ffmpeg -nostdin -y -i ${a}`;\nrun(["ffmpeg", "-nostdin", "-y"]);');
    expect(fix(once)).toBe(once);
    expect(violations(once)).toEqual([]);
  });
});

test("no ffmpeg spawn in the repo lacks -nostdin", () => {
  const root = join(import.meta.dir, "..", "..", "..");
  const bad = [join(root, "tools"), join(root, "episodes")].flatMap(files).flatMap((f) => violations(readFileSync(f, "utf8")).map((l) => `${f.slice(root.length + 1)}:${l}`));
  expect(bad).toEqual([]);
});
