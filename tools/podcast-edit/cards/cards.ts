#!/usr/bin/env bun
// Data cards of one episode: lint, provenance recompute, blog-candidates rule, contact sheet.
// Usage:
//   bun cards/cards.ts check <episode-dir> [--out <dir>] [--no-png]   exit 1 on any failure
//   bun cards/cards.ts sheet <episode-dir> [--out <dir>]              contact sheet only
//   bun cards/cards.ts watch <episode-dir> [--out <dir>]              re-check on every card change
// Default out: <episode>/qa-out (git-ignored). Root aliases: <episode>/cards/roots.json.
import { watch } from "fs";
import { join } from "path";
import { checkEpisodeCards, ensureSheet } from "./sheet";

const [cmd, ep, ...rest] = Bun.argv.slice(2);
if (!cmd || !ep || !["check", "sheet", "watch"].includes(cmd)) {
  console.error("Usage: bun cards/cards.ts check|sheet|watch <episode-dir> [--out <dir>] [--no-png]");
  process.exit(2);
}
const oi = rest.indexOf("--out"), out = oi >= 0 ? rest[oi + 1] : join(ep, "qa-out");
const png = !rest.includes("--no-png");

async function check(): Promise<boolean> {
  const r = await checkEpisodeCards(ep, { out, png });
  for (const e of r.errors) console.log(`FAIL ${e}`);
  console.log(`${r.cards} cards, ${r.errors.length} problems; contact sheet: ${r.sheet ?? "none"}`);
  return r.pass;
}

if (cmd === "sheet") {
  const s = await ensureSheet(join(ep, "cards"), out, { png });
  console.log(`${s.written ? "written" : "unchanged"}: ${s.png ?? s.html}`);
} else if (cmd === "check") {
  process.exit((await check()) ? 0 : 1);
} else {
  await check();
  let t: Timer | undefined;
  watch(join(ep, "cards"), () => { clearTimeout(t); t = setTimeout(check, 300); });
  console.log("watching cards/ (Ctrl-C to stop)");
}
