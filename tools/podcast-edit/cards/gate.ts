// Render gate for one card file: lint + provenance recompute. overlays/scripts/render-all.ts
// calls it for every item with a `card` path and renders nothing if any card fails.
// The episode folder is the parent of the card's cards/ folder.
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { lintCard, type Card } from "./card";
import { checkProvenance, loadRoots, type Roots } from "./provenance";

export async function gateCard(file: string, o: { roots?: Roots } = {}): Promise<{ errors: string[]; props?: Card }> {
  const episodeDir = dirname(dirname(resolve(file)));
  const c: Card = JSON.parse(readFileSync(file, "utf8"));
  const errors = lintCard(c, "card").map((e) => `${c.id}: ${e}`);
  if (c.decision === "blog") errors.push(`${c.id}: decision is "blog": the card goes to notes/blog-candidates.md, not into the video`);
  errors.push(...(await checkProvenance(c, { episodeDir, roots: o.roots ?? loadRoots(episodeDir) })).errors);
  return errors.length ? { errors } : { errors, props: c };
}
