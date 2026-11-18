#!/usr/bin/env bun
// One QA gate before any preview reaches the host. Usage:
//   bun tools/podcast-edit/qa.ts <episode-dir> [--config <file>] [--only audio,eyes,...]
// Reads <episode-dir>/qa.json (format: qa.example.json). Strings may use ${VAR} from the
// environment, so private media paths stay out of this public repo. Checks:
//   audio     every voice clearly above the music, voices level with each other (qa/audio.ts)
//   eyes      eyes open on chosen key frames: cold-open endings, thumbnails (qa/eyes.ts)
//   captions  no caption over a face, none in the bottom 180 px (qa/caps.ts)
//   strips    overlay layers not clipped, above y 900; zoomed crops of every strip (qa/strips.ts)
//   cards     card lint + provenance recompute + blog-candidates rule + contact sheet (cards/)
// A check missing from qa.json FAILS unless qa.json says why it does not apply:
//   "skip": {"eyes": "no cold open in this preview"}
// Writes <out>/qa-summary.json and prints a pass/fail table; exit 1 on any failure.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { checkEpisodeCards } from "./cards/sheet";
import { checkAudio } from "./qa/audio";
import { checkCaptions } from "./qa/caps";
import { checkEyes } from "./qa/eyes";
import { checkStripLayers, zoomCrops } from "./qa/strips";

export const CHECKS = ["audio", "eyes", "captions", "strips", "cards"] as const;
type Check = (typeof CHECKS)[number];
export type Row = { check: Check; status: "PASS" | "FAIL" | "SKIP"; detail: string; problems: string[] };

// ${VAR} -> environment value; an unset variable is an error (never a silent empty path).
export function expand<T>(v: T, env: Record<string, string | undefined> = process.env): T {
  if (typeof v === "string") return v.replace(/\$\{(\w+)\}/g, (_, k) => { if (env[k] === undefined) throw new Error(`environment variable ${k} is not set`); return env[k]!; }) as T;
  if (Array.isArray(v)) return v.map((x) => expand(x, env)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, expand(x, env)])) as T;
  return v;
}

export function summary(rows: Row[]): { pass: boolean; text: string } {
  const w = Math.max(...rows.map((r) => r.check.length));
  const lines = rows.map((r) => `${r.status.padEnd(4)}  ${r.check.padEnd(w)}  ${r.detail}${r.problems.length ? "\n" + r.problems.slice(0, 20).map((p) => `        - ${p}`).join("\n") + (r.problems.length > 20 ? `\n        - ... ${r.problems.length - 20} more` : "") : ""}`);
  const pass = rows.every((r) => r.status !== "FAIL");
  return { pass, text: lines.join("\n") + `\n\nQA ${pass ? "PASSED" : "FAILED"}: ${rows.filter((r) => r.status === "FAIL").length} failed, ${rows.filter((r) => r.status === "SKIP").length} skipped with a reason` };
}

// The faces binary: compiled once from qa/faces.swift into the output folder.
function facesBinary(out: string): string {
  const bin = join(out, "faces-bin");
  if (!existsSync(bin)) {
    const p = Bun.spawnSync(["swiftc", "-O", join(import.meta.dir, "qa/faces.swift"), "-o", bin], { stderr: "pipe" });
    if (p.exitCode) throw new Error(`swiftc failed: ${p.stderr.toString().slice(0, 500)}`);
  }
  return bin;
}

async function run(check: Check, cfg: any, ep: string, out: string): Promise<Omit<Row, "check">> {
  if (check === "audio") {
    const r = await checkAudio(cfg);
    return { status: r.pass ? "PASS" : "FAIL", detail: r.rows.map((x) => `${x.voice} +${x.gapMedianDb.toFixed(1)} dB over music (${x.blocks} blocks)`).join(", ") + `; spread ${r.spreadDb.toFixed(1)} dB`, problems: r.errors };
  }
  if (check === "eyes") {
    const r = await checkEyes({ ...cfg, faces: facesBinary(out), out: join(out, "eyes") });
    return { status: r.pass ? "PASS" : "FAIL", detail: `${r.rows.length} key frames`, problems: r.rows.filter((x) => !x.pass).map((x) => `${x.label}: ${x.reason} (${x.file})`) };
  }
  if (check === "captions") {
    const r = await checkCaptions({ ...cfg, faces: facesBinary(out) });
    return { status: r.violations.length ? "FAIL" : "PASS", detail: `${r.frames} caption frames, ${r.faces} faces, ${r.framesWithoutFaces} frames without faces`, problems: r.violations };
  }
  if (check === "strips") {
    const problems: string[] = [];
    let layers = 0, crops: string[] = [];
    if (cfg.layers) { const r = await checkStripLayers({ items: cfg.layers, out: join(out, "strips"), safeBottom: cfg.safeBottom }); layers = r.rows.length; for (const x of r.rows) problems.push(...x.issues.map((i) => `${x.id}: ${i}`)); }
    if (cfg.video && cfg.items) crops = await zoomCrops({ video: cfg.video, items: cfg.items, out: join(out, "strip-crops"), scale: cfg.scale });
    if (!layers && !crops.length) problems.push('strips: give "layers" (overlay files) and/or "video" + "items" (crop boxes)');
    return { status: problems.length ? "FAIL" : "PASS", detail: `${layers} layers checked; ${crops.length} zoomed crops in ${join(out, "strip-crops")} (look at every one)`, problems };
  }
  const r = await checkEpisodeCards(ep, { out, png: cfg.png ?? true });
  return { status: r.pass ? "PASS" : "FAIL", detail: `${r.cards} cards; contact sheet ${r.sheet ?? "none"}`, problems: r.errors };
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const ep = args.find((a, i) => !a.startsWith("--") && !["--config", "--only"].includes(args[i - 1]));
  if (!ep) { console.error("Usage: bun qa.ts <episode-dir> [--config <file>] [--only audio,eyes,captions,strips,cards]"); process.exit(2); }
  const ci = args.indexOf("--config"), oi = args.indexOf("--only");
  const file = ci >= 0 ? args[ci + 1] : join(ep, "qa.json");
  const raw = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const only = oi >= 0 ? new Set(args[oi + 1].split(",")) : undefined;
  const skip: Record<string, string> = raw.skip ?? {};
  const rows: Row[] = [];
  let out = join(ep, "qa-out");
  try { out = resolve(raw.out ? expand(raw.out) : out); } catch (e) { console.error(`out: ${e}`); process.exit(2); }
  mkdirSync(out, { recursive: true });
  for (const check of CHECKS) {
    if (only && !only.has(check)) continue;
    if (skip[check]) { rows.push({ check, status: "SKIP", detail: skip[check], problems: [] }); continue; }
    if (check !== "cards" && !raw[check]) { rows.push({ check, status: "FAIL", detail: `not configured in ${file}; configure it or add "skip": {"${check}": "<reason>"}`, problems: [] }); continue; }
    try { rows.push({ check, ...(await run(check, expand(raw[check] ?? {}), ep, out)) }); }
    catch (e) { rows.push({ check, status: "FAIL", detail: `error: ${(e as Error).message}`, problems: [] }); }
  }
  const s = summary(rows);
  writeFileSync(join(out, "qa-summary.json"), JSON.stringify({ pass: s.pass, rows }, null, 2) + "\n");
  console.log(s.text + `\nreport: ${join(out, "qa-summary.json")}`);
  process.exit(s.pass ? 0 : 1);
}
