// Contact sheet (every card on one page) and the episode card check.
// ensureSheet rewrites <out>/contact-sheet.{html,png} whenever any card file changes (hash of
// the card files), so the host always reviews the current set. checkEpisodeCards = lint +
// provenance recompute + the blog-candidates rule + the sheet; cards.ts and qa.ts call it,
// and overlays/scripts/render-all.ts refuses to render a card that fails it.
import { createHash } from "crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { cardSvg, esc } from "../overlays/src/card-svg";
import { lintCard, type Card } from "./card";
import { checkProvenance, loadRoots, type Roots } from "./provenance";

export const cardFiles = (cardsDir: string) =>
  existsSync(cardsDir) ? readdirSync(cardsDir).filter((f) => f.endsWith(".card.json")).sort().map((f) => join(cardsDir, f)) : [];

export function contactSheetHtml(items: { id: string; svg: string; decision?: string; at?: string }[], title = "Cards"): string {
  const cells = items.map((it) =>
    `<figure class="${it.decision === "blog" ? "blog" : ""}">${it.svg}<figcaption><b>${esc(it.id)}</b>${it.at ? ` · ${esc(it.at)}` : ""}${it.decision === "blog" ? " · blog only" : ""}</figcaption></figure>`).join("\n");
  return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{margin:0;padding:24px;background:#2b2f36;font-family:Inter,sans-serif;color:#eee}
h1{font-size:22px;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(3,520px);gap:20px}
figure{margin:0}figure svg{width:520px;height:auto;display:block}figure.blog{opacity:.45}
figcaption{font-size:15px;margin-top:6px}</style>
<h1>${esc(title)} (${items.length})</h1><div class="grid">
${cells}
</div>`;
}

export function chromePath(): string | undefined {
  const c = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"];
  return c.find((p) => p && existsSync(p));
}

// HTML -> PNG with headless Chrome. The window is taller than the page, so nothing is cut.
export function screenshot(html: string, png: string, w: number, h: number): boolean {
  const chrome = chromePath();
  if (!chrome) return false;
  const p = Bun.spawnSync([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${w},${h}`, `--screenshot=${png}`, `file://${resolve(html)}`], { stderr: "pipe" });
  return p.exitCode === 0 && existsSync(png);
}

export async function ensureSheet(cardsDir: string, out: string, o: { png?: boolean; title?: string } = {}): Promise<{ written: boolean; html: string; png?: string }> {
  const files = cardFiles(cardsDir);
  const raw = files.map((f) => readFileSync(f, "utf8"));
  // The renderer is part of the hash: a layout change redraws the sheet too.
  const hash = createHash("sha256").update(raw.join("\0")).update(readFileSync(join(import.meta.dir, "../overlays/src/card-svg.ts"))).digest("hex");
  mkdirSync(out, { recursive: true });
  const html = join(out, "contact-sheet.html"), png = join(out, "contact-sheet.png"), hf = join(out, "contact-sheet.hash");
  const wantPng = o.png ?? true;
  if (existsSync(hf) && readFileSync(hf, "utf8") === hash && existsSync(html) && (!wantPng || existsSync(png)))
    return { written: false, html, png: wantPng ? png : undefined };
  const items = raw.map((s) => JSON.parse(s) as Card).map((c) => ({ id: c.id, svg: cardSvg(c), decision: c.decision, at: c.onAir?.at }));
  writeFileSync(html, contactSheetHtml(items, o.title ?? "Cards"));
  let shot: string | undefined;
  if (wantPng) shot = screenshot(html, png, 1680, 120 + Math.ceil(items.length / 3) * 260) ? png : undefined;
  writeFileSync(hf, hash);
  return { written: true, html, png: shot };
}

export async function checkEpisodeCards(episodeDir: string, o: { out: string; png?: boolean; roots?: Roots }): Promise<{ pass: boolean; errors: string[]; cards: number; sheet?: string }> {
  const cardsDir = join(episodeDir, "cards");
  const files = cardFiles(cardsDir);
  const errors: string[] = [];
  const roots = o.roots ?? loadRoots(episodeDir);
  const blogFile = join(episodeDir, "notes", "blog-candidates.md");
  const blog = existsSync(blogFile) ? readFileSync(blogFile, "utf8") : undefined;
  if (blog === undefined) errors.push("notes/blog-candidates.md is missing (standard file in every episode folder)");
  for (const f of files) {
    let c: Card;
    try { c = JSON.parse(readFileSync(f, "utf8")); } catch (e) { errors.push(`${f}: ${e}`); continue; }
    errors.push(...lintCard(c, "card").map((m) => `${c.id}: ${m}`));
    if (c.decision === "blog" && blog !== undefined && !blog.includes(c.id)) errors.push(`${c.id}: decision is "blog" but notes/blog-candidates.md does not mention it`);
    errors.push(...(await checkProvenance(c, { episodeDir, roots })).errors);
  }
  const sheet = files.length ? await ensureSheet(cardsDir, o.out, { png: o.png }) : undefined;
  return { pass: errors.length === 0, errors, cards: files.length, sheet: sheet?.png ?? sheet?.html };
}
