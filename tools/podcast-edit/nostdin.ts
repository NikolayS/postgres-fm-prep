// Every ffmpeg spawn in this repo runs with -nostdin. Without it, ffmpeg reads the terminal's
// stdin: a render started in the background stops or hangs (ep198: outro "freezes" at the last
// frames, level.ts waiting 28 min with no output). nostdin.test.ts fails on any spawn without it.
//
//   bun nostdin.ts [--fix] <dir>...    list (or fix) ffmpeg spawns without -nostdin
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join } from "path";

// A shell or template-string call: the word ffmpeg followed by an argument.
const SHELL = /(^|[\s`(;|&=])ffmpeg(?=[ \t]+(?!-nostdin\b)[-$"'{\\])/gm;
// An argv array: "ffmpeg", then the next element.
const ARGV = /(["'])ffmpeg\1(?!\s*,\s*["']-nostdin["'])(\s*,\s*)/g;

const code = (l: string) => !/^\s*(\/\/|#|\*)/.test(l);

// Lines (1-based) with an ffmpeg spawn that lacks -nostdin.
export function violations(src: string): number[] {
  const out: number[] = [];
  src.split("\n").forEach((l, i) => {
    if (!code(l)) return;
    if (new RegExp(SHELL.source, "m").test(l) || new RegExp(ARGV.source).test(l)) out.push(i + 1);
  });
  return out;
}

export function fix(src: string): string {
  return src.split("\n").map((l) => (code(l) ? l.replace(SHELL, "$1ffmpeg -nostdin").replace(ARGV, (_, q, sep) => `${q}ffmpeg${q}${sep}${q}-nostdin${q}${sep}`) : l)).join("\n");
}

export function files(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    if (n === "node_modules" || n.startsWith(".")) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(ts|sh)$/.test(n) && !n.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

if (import.meta.main) {
  const args = Bun.argv.slice(2), doFix = args.includes("--fix"), dirs = args.filter((a) => a !== "--fix");
  if (!dirs.length) { console.error("usage: bun nostdin.ts [--fix] <dir>..."); process.exit(2); }
  let bad = 0;
  for (const f of dirs.flatMap(files)) {
    const src = readFileSync(f, "utf8"), v = violations(src);
    if (!v.length) continue;
    bad += v.length;
    if (doFix) writeFileSync(f, fix(src));
    console.log(`${f}: ${v.join(", ")}`);
  }
  console.log(`${bad} ffmpeg spawns without -nostdin${doFix ? " (fixed)" : ""}`);
  process.exit(bad && !doFix ? 1 : 0);
}
