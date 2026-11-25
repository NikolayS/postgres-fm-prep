#!/usr/bin/env bun
// Facing rule: hosts face each other, never out of the picture (Nik, episode 198).
// A host who looks to screen-left must not sit on the left edge of the row of tiles, and a host
// who looks to screen-right must not sit on the right edge. "neutral" (straight at the camera)
// may sit anywhere; with three hosts the middle tile may face either way.
//
// Record (one per episode, e.g. <episode>/video/final/facing.json), made from real frames:
//   {"hosts": {"nik": {"facing": "left", "evidence": ["facing/nik-0600.png", ...], "note": "..."}},
//    "override": {"by": "Nik", "reason": "..."}}          // optional: the host's written decision
//
// Estimate + contact sheet from the source recording (head turn, else face position; many frames):
//   bun qa/facing.ts estimate <tiles.json> <out-dir> [--samples 12] [--hosts nik,kirk]
// It writes <out-dir>/<host>-<t>.png, <out-dir>/facing-sheet.png and prints a draft record.
// The estimate is a proposal: look at the sheet and write the record yourself.
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

export type Facing = "left" | "right" | "neutral";
export type FacingRecord = {
  hosts: Record<string, { facing: Facing; evidence: string[]; note?: string }>;
  override?: { by: string; reason: string };
};
type Place = { x?: number; w?: number; small?: boolean };

// Host tiles (not small fixed tiles such as a meeting bot), left to right.
export function hostOrder(layout: { place: Record<string, Place> }): string[] {
  return Object.entries(layout.place).filter(([, p]) => !p.small && typeof p.x === "number").sort((a, b) => a[1].x! - b[1].x!).map(([n]) => n);
}

export function facingVerdict(layout: { place: Record<string, Place> }, record: FacingRecord | undefined): { pass: boolean; order: string[]; problems: string[]; note?: string } {
  const order = hostOrder(layout), problems: string[] = [];
  if (!record?.hosts) return { pass: false, order, problems: ["no facing record: decide each host's facing on real frames (bun qa/facing.ts estimate ...) and write it"] };
  for (const n of order) {
    const h = record.hosts[n];
    if (!h || !["left", "right", "neutral"].includes(h.facing)) problems.push(`${n}: no facing value (left, right or neutral)`);
    else if (!h.evidence?.length) problems.push(`${n}: no evidence frames for facing "${h.facing}"`);
  }
  if (problems.length) return { pass: false, order, problems };
  const outward: string[] = [];
  if (order.length >= 2) {
    const first = order[0], last = order[order.length - 1];
    if (record.hosts[first].facing === "left") outward.push(`${first} faces left but sits on the left edge: looks out of the picture`);
    if (record.hosts[last].facing === "right") outward.push(`${last} faces right but sits on the right edge: looks out of the picture`);
  }
  if (outward.length && record.override) {
    if (record.override.by?.trim() && record.override.reason?.trim()) return { pass: true, order, problems: [], note: `override by ${record.override.by}: ${record.override.reason} (${outward.join("; ")})` };
    return { pass: false, order, problems: [...outward, "override needs both \"by\" and \"reason\""] };
  }
  return { pass: !outward.length, order, problems: outward };
}

// Right-facing hosts go left, neutral ones to the middle, left-facing ones right.
export function proposeOrder(record: FacingRecord): string[] {
  const rank: Record<Facing, number> = { right: 0, neutral: 1, left: 2 };
  return Object.entries(record.hosts).map(([n, h], i) => ({ n, r: rank[h.facing], i })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.n);
}

// Head turn first: the nose line's offset from the face-box center (faces.swift "nose", a
// fraction of the box width; + = nose right of center = the head turns to screen-right).
// Median over many frames: > +0.035 faces right, < -0.035 faces left, else neutral.
// Fallback when no nose data: a person who sits off-center in their own frame usually turns
// toward the empty side; median face-center offset > +0.08 of the tile width = faces left.
// Episode 198 (12 frames each): Kirk nose +0.11 (right), Nik -0.05 (left); both sat centered.
export function estimateFacing(faces: { box: number[]; nose?: number | null }[], tileW: number): { facing: Facing | "unknown"; offset: number; frames: number; by: string } {
  if (!faces.length) return { facing: "unknown", offset: 0, frames: 0, by: "none" };
  const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.floor(s.length / 2)] * 1000) / 1000; };
  const noses = faces.map((f) => f.nose).filter((x): x is number => typeof x === "number");
  if (noses.length >= Math.ceil(faces.length / 2)) {
    const m = med(noses);
    return { facing: m > 0.035 ? "right" : m < -0.035 ? "left" : "neutral", offset: m, frames: noses.length, by: "head turn" };
  }
  const m = med(faces.map((f) => (f.box[0] + f.box[2] / 2) / tileW - 0.5));
  return { facing: m > 0.08 ? "left" : m < -0.08 ? "right" : "neutral", offset: m, frames: faces.length, by: "position" };
}

if (import.meta.main && Bun.argv[2] === "estimate") {
  const [tilesFile, out] = [Bun.argv[3], Bun.argv[4]];
  const arg = (k: string) => { const i = Bun.argv.indexOf(k); return i > 0 ? Bun.argv[i + 1] : undefined; };
  if (!tilesFile || !out) { console.error("Usage: bun qa/facing.ts estimate <tiles.json> <out-dir> [--samples 12] [--hosts nik,kirk]"); process.exit(2); }
  const tiles = JSON.parse(readFileSync(tilesFile, "utf8")), n = Number(arg("--samples") ?? 12);
  const L = tiles.layouts[0], hosts: string[] = arg("--hosts")?.split(",") ?? Object.keys(L.tiles).filter((h) => h !== "robot");
  const end = Math.max(...tiles.intervals.map((i: any) => i.end)), ts = Array.from({ length: n }, (_, i) => Math.round(((i + 0.5) * end) / n));
  mkdirSync(out, { recursive: true });
  const bin = join(out, "faces-bin");
  Bun.spawnSync(["swiftc", "-O", join(import.meta.dir, "faces.swift"), "-o", bin]);
  const draft: FacingRecord = { hosts: {} }, files: string[] = [];
  for (const h of hosts) {
    const r = L.tiles[h], shots: string[] = [];
    for (const t of ts) {
      const f = resolve(out, `${h}-${String(t).padStart(4, "0")}.png`);
      Bun.spawnSync(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", String(t), "-i", tiles.video, "-frames:v", "1", "-vf", `crop=${r.w}:${r.h}:${r.x}:${r.y}`, f]);
      shots.push(f);
    }
    const res = Bun.spawnSync([bin], { stdin: new TextEncoder().encode(shots.join("\n") + "\n") }).stdout.toString();
    const faces = res.split("\n").filter(Boolean).map((l) => JSON.parse(l).faces[0]).filter(Boolean);
    const e = estimateFacing(faces, r.w);
    console.log(`${h}: estimate ${e.facing} by ${e.by} (median offset ${e.offset}, ${e.frames}/${ts.length} frames)`);
    draft.hosts[h] = { facing: e.facing === "unknown" ? "neutral" : e.facing, evidence: shots.map((s) => s.slice(resolve(out).length + 1)), note: `estimate ${e.facing}, offset ${e.offset}; confirm on the sheet` };
    files.push(...shots);
  }
  Bun.spawnSync(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-pattern_type", "glob", "-i", join(out, "*-[0-9][0-9][0-9][0-9].png"), "-vf", `scale=320:-1,tile=${n}x${hosts.length}`, "-frames:v", "1", join(out, "facing-sheet.png")]);
  writeFileSync(join(out, "facing.draft.json"), JSON.stringify(draft, null, 1) + "\n");
  console.log(`sheet ${join(out, "facing-sheet.png")}; draft ${join(out, "facing.draft.json")}; proposed order, left to right: ${proposeOrder(draft).join(", ")}`);
}
