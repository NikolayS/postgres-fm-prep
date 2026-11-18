// Provenance gate: recompute every number of a card (or cheat-sheet finding) from its raw file.
// source.file is relative to the episode folder, or "<ROOT>/rest" where ROOT is an alias from
// <episode>/cards/roots.json ({"X": "FORGE_X"}: the alias X is the directory in $FORGE_X).
// Raw data stays outside this public repo; the environment says where it is on this machine.
// source.compute runs in sh with cwd = the episode folder, F = the resolved file and each root
// alias exported. The first number in its output is the recomputed value; it must give the same
// display as the card value (same rounding), else the card fails.
import { existsSync, readFileSync } from "fs";
import { isAbsolute, join, resolve } from "path";
import { displayOf, numberTokens, type Finding } from "./card";

export type Roots = Record<string, string | undefined>;

// Aliases from <episode>/cards/roots.json, resolved through the environment.
export function loadRoots(episodeDir: string, env: Record<string, string | undefined> = process.env): Roots {
  const f = join(episodeDir, "cards", "roots.json");
  if (!existsSync(f)) return {};
  const map: Record<string, string> = JSON.parse(readFileSync(f, "utf8"));
  return Object.fromEntries(Object.entries(map).map(([alias, v]) => [alias, env[v]]));
}

export function resolveFile(file: string, episodeDir: string, roots: Roots): { path?: string; error?: string } {
  const [head, ...rest] = file.split("/");
  if (rest.length && head in roots) {
    const r = roots[head];
    return r ? { path: resolve(r, ...rest) } : { error: `root ${head} is not set (see cards/roots.json and set its environment variable)` };
  }
  return { path: isAbsolute(file) ? file : resolve(episodeDir, file) };
}

const decimals = (t: string) => (t.includes(".") ? t.split(".")[1].length : 0);
const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 6 });

export async function checkProvenance(c: Finding, o: { episodeDir: string; roots: Roots; timeoutMs?: number }): Promise<{ errors: string[]; checked: number }> {
  const errors: string[] = [];
  let checked = 0;
  const rootEnv = Object.fromEntries(Object.entries(o.roots).filter(([, v]) => v) as [string, string][]);
  for (const [k, n] of Object.entries(c.numbers ?? {})) {
    if (!n.source?.file || !n.source?.compute) { errors.push(`${c.id}/${k}: no provenance`); continue; }
    const r = resolveFile(n.source.file, o.episodeDir, o.roots);
    if (r.error) { errors.push(`${c.id}/${k}: ${r.error}`); continue; }
    if (!existsSync(r.path!)) { errors.push(`${c.id}/${k}: raw file ${n.source.file} not found`); continue; }
    const p = Bun.spawn(["sh", "-c", n.source.compute], { cwd: o.episodeDir, env: { ...process.env, ...rootEnv, F: r.path! }, stdout: "pipe", stderr: "pipe" });
    const timer = setTimeout(() => p.kill(), o.timeoutMs ?? 120_000);
    const [code, out, err] = await Promise.all([p.exited, new Response(p.stdout).text(), new Response(p.stderr).text()]);
    clearTimeout(timer);
    if (code !== 0) { errors.push(`${c.id}/${k}: compute failed (exit ${code}): ${err.trim().slice(0, 300)}`); continue; }
    const tok = out.match(/-?\d[\d,]*(?:\.\d+)?(?:e[-+]?\d+)?/i)?.[0];
    const got = tok === undefined ? NaN : Number(tok.replace(/,/g, ""));
    if (!Number.isFinite(got)) { errors.push(`${c.id}/${k}: compute printed no number`); continue; }
    const d = numberTokens(displayOf(n))[0] ?? String(n.value);
    const prec = decimals(d);
    if (got.toFixed(prec) !== n.value.toFixed(prec))
      errors.push(`${c.id}/${k}: card value ${fmt(n.value)} (shown as ${displayOf(n)}) does not match the recompute ${fmt(got)}`);
    checked++;
  }
  return { errors, checked };
}
