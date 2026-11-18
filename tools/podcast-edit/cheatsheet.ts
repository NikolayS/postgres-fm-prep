#!/usr/bin/env bun
// Pre-recording research cheat sheet: the 5-8 strongest findings of the episode's research
// (a Forge study brief, recording notes), each one headline and one chart, on one page for the
// hosts to see BEFORE recording. Input: <episode>/notes/findings.json
//   {"title": "...", "source": {"label": "...", "url": "..."}, "findings": [Finding, ...]}
// Finding = a card without onAir/decision (cards/card.ts): headline of 10 words or fewer, one
// chart, 1-2 hero numbers, a chip, and every number with its raw file and recompute command.
// Every number is recomputed (cards/provenance.ts) unless --no-recompute, which stamps the
// page "NUMBERS NOT RECOMPUTED".
// Usage: bun cheatsheet.ts <episode-dir> [--out <dir>] [--no-recompute]
//   writes <episode>/notes/cheatsheet.html (text, in git) and <out>/cheatsheet.png (default out:
//   <episode>/qa-out, git-ignored).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { lintCard, type Finding } from "./cards/card";
import { checkProvenance, loadRoots } from "./cards/provenance";
import { screenshot } from "./cards/sheet";
import { cardSvg, esc } from "./overlays/src/card-svg";

export type Findings = { title: string; source?: { label: string; url: string }; findings: Finding[] };

export function lintFindings(doc: Findings): string[] {
  const e: string[] = [];
  if (!doc.title) e.push("title is missing");
  const n = doc.findings?.length ?? 0;
  if (n < 5 || n > 8) e.push(`use the 5-8 strongest findings (got ${n})`);
  const ids = new Set<string>();
  for (const f of doc.findings ?? []) {
    if (ids.has(f.id)) e.push(`${f.id}: duplicate id`);
    ids.add(f.id);
    e.push(...lintCard(f, "finding").map((m) => `${f.id}: ${m}`));
  }
  return e;
}

export function cheatSheetHtml(doc: Findings, o: { unverified?: boolean } = {}): string {
  const cells = doc.findings.map((f, i) => `<figure><div class="n">${i + 1}</div>${cardSvg(f)}</figure>`).join("\n");
  const src = doc.source ? `<a href="${esc(doc.source.url)}">${esc(doc.source.label)}</a> · ${esc(doc.source.url)}` : "";
  return `<!doctype html><meta charset="utf-8"><title>${esc(doc.title)}: cheat sheet</title>
<style>@page{size:letter landscape;margin:0.3in}body{margin:0;padding:20px;font-family:Inter,sans-serif;color:#1d2530;background:#fff}
h1{font-size:26px;margin:0 0 4px}.src{font-size:14px;color:#4c5766;margin-bottom:12px}
.warn{background:#a8433b;color:#fff;padding:6px 10px;font-weight:700;margin-bottom:10px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}figure{margin:0;position:relative;border:1px solid #d4d9e0;border-radius:10px;overflow:hidden}
figure svg{width:100%;height:auto;display:block}.n{position:absolute;right:10px;top:6px;font-weight:800;color:#8b95a1}</style>
<h1>${esc(doc.title)}: before we record</h1><div class="src">${src}</div>
${o.unverified ? '<div class="warn">NUMBERS NOT RECOMPUTED: check every number against its raw file before the show</div>' : ""}
<div class="grid">
${cells}
</div>`;
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const ep = args.find((a) => !a.startsWith("--"));
  if (!ep) { console.error("Usage: bun cheatsheet.ts <episode-dir> [--out <dir>] [--no-recompute]"); process.exit(2); }
  const oi = args.indexOf("--out"), out = oi >= 0 ? args[oi + 1] : join(ep, "qa-out");
  const file = join(ep, "notes", "findings.json");
  if (!existsSync(file)) { console.error(`${file} not found`); process.exit(2); }
  const doc: Findings = JSON.parse(readFileSync(file, "utf8"));
  const errors = lintFindings(doc);
  const recompute = !args.includes("--no-recompute");
  if (recompute) { const roots = loadRoots(ep); for (const f of doc.findings ?? []) errors.push(...(await checkProvenance(f, { episodeDir: ep, roots })).errors); }
  if (errors.length) { console.error(errors.map((e) => `FAIL ${e}`).join("\n")); process.exit(1); }
  const html = join(ep, "notes", "cheatsheet.html");
  writeFileSync(html, cheatSheetHtml(doc, { unverified: !recompute }));
  mkdirSync(out, { recursive: true });
  const png = join(out, "cheatsheet.png");
  const ok = screenshot(html, png, 1600, 300 + Math.ceil(doc.findings.length / 2) * 410);
  console.log(`cheat sheet: ${html}${ok ? `\npng: ${png}` : " (no Chrome: open the HTML)"}`);
}
