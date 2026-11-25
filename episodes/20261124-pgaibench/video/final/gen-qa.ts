// Rewrite qa.json eyes/strips/sfx for a manifest and cold-open length.
// Usage: bun gen-qa.ts <qa.json> <manifest-sfx.json (absolute, under $EP198_REVIEW)> <coldOpenSec> [cardSec=13]
const [qaPath, manPath, coArg, cardArg] = process.argv.slice(2);
const R = process.env.EP198_REVIEW!;
if (!R || !manPath.startsWith(R)) throw new Error("EP198_REVIEW unset or manifest outside it");
const co = Number(coArg), CARD = Number(cardArg ?? 13);
const qa = await Bun.file(qaPath).json();
const m = await Bun.file(manPath).json();
const rel = (p: string) => "${EP198_REVIEW}" + p.slice(R.length);
const dir = manPath.slice(0, manPath.lastIndexOf("/"));
const V = "${EP198_REVIEW}/final/episode-198-final.mp4";
const vt = (t: number) => +(co + CARD + t).toFixed(2);
const b = m.band;
const layers: any[] = [], items: any[] = [];
for (const o of m.overlays) {
  const f = rel(`${dir}/${o.file}`);
  for (const t of [0.3, +(o.dur / 2).toFixed(2)]) layers.push({ id: o.id, file: f, t });
  if (o.placement === "band") {
    const at = vt(o.outStart);
    items.push({ id: o.id, at, box: [b.x - 20, b.y - 24, b.w + 40, b.h + 40], times: [+(at + 0.3).toFixed(2), +(at + 1.2).toFixed(2), +(at + Math.min(o.dur - 0.5, 3.7)).toFixed(2)] });
  }
}
qa.strips = { ...qa.strips, video: V, layers, items };
qa.sfx = { manifest: rel(manPath) };
const fr = qa.eyes.frames.filter((x: any) => x.image);
qa.eyes.frames = [
  { label: "cold open: first frame", video: V, t: 0.1, expectFaces: 2 },
  { label: "cold open: last frame before the title card", video: V, t: +(co - 0.4).toFixed(2), expectFaces: 2 },
  { label: "body: first frames after the title card", video: V, t: +(co + CARD + 1.4).toFixed(2), expectFaces: 2 },
  ...fr,
];
await Bun.write(qaPath, JSON.stringify(qa, null, 1) + "\n");
console.log(`layers ${layers.length}, band items ${items.length}, eyes ${qa.eyes.frames.length}`);
