// Capture a block of a real page (in the top document or any iframe) at 2x.
// bun scripts/shot.ts <url> <out.png> <block-selector-or-text> [highlight-text ...]
// env: VW (viewport width, default 1100), THEME (light|dark, sets data-theme on <html> of every frame),
//      PAD (px around the block), MAXH (max block height in CSS px), WAIT ms.
// Writes <out>.rect.json: block rect (CSS px, in the PNG's frame), highlight rects relative to the PNG.
import {chromium, type Frame} from 'playwright';
import {writeFileSync} from 'node:fs';
const [url, out, block, ...hls] = process.argv.slice(2);
const VW = Number(process.env.VW ?? 1100), PAD = Number(process.env.PAD ?? 16), MAXH = Number(process.env.MAXH ?? 1400);
const b = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const ctx = await b.newContext({viewport: {width: VW, height: 1600}, deviceScaleFactor: Number(process.env.DSF ?? 2), colorScheme: (process.env.THEME as any) ?? 'light', timezoneId: process.env.TZID ?? 'UTC', locale: 'en-US'});
const p = await ctx.newPage();
await p.goto(url, {waitUntil: 'load', timeout: 90000});
await p.waitForTimeout(Number(process.env.WAIT ?? 5000));
if (process.env.THEME) for (const f of p.frames()) await f.evaluate((t) => document.documentElement?.setAttribute('data-theme', t), process.env.THEME).catch(() => {});
await p.waitForTimeout(500);
const pick = (f: Frame) => block.startsWith('css=') ? f.locator(block.slice(4)) : f.getByText(block, {exact: false});
let loc = null; let ff: Frame | null = null;
for (const f of p.frames()) { const l = pick(f).first(); if (await l.count().catch(() => 0)) { loc = l; ff = f; break; } }
if (!loc) { console.error("block not found"); process.exit(2); }
for (let i = 0; i < Number(process.env.UP ?? 0); i++) loc = loc.locator("xpath=..");
console.error("block:", await loc.evaluate((e) => e.tagName + "." + e.className));
await loc.evaluate((e) => e.scrollIntoView({block: 'center'}));
for (const f of p.frames()) await f.evaluate(() => Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000); })))).catch(() => {});
await p.waitForTimeout(800);
let box = (await loc.boundingBox())!;
if (process.env.END) { const fr = loc.page().frames().find(() => true); let l2 = null; for (const f of p.frames()) { const l = f.locator(process.env.END).first(); if (await l.count().catch(() => 0)) { l2 = l; break; } } const b2 = (await l2!.boundingBox())!; const y2 = Math.max(box.y + box.height, b2.y + b2.height); const x1 = Math.min(box.x, b2.x); box = {x: x1, y: Math.min(box.y, b2.y), width: Math.max(box.x + box.width, b2.x + b2.width) - x1, height: y2 - Math.min(box.y, b2.y)}; }
const clip = {x: Math.max(0, box.x - PAD), y: Math.max(0, box.y - PAD), width: Math.min(Number(process.env.MAXW ?? VW), VW, box.width + 2 * PAD), height: Math.min(MAXH, box.height + 2 * PAD)};
// Highlights: rects of the exact text ranges (Range.getClientRects) inside the block element.
const hl = [];
for (const h of hls) {
  if (h.startsWith('css=')) { let bb = null; for (const f of p.frames()) { const l = f.locator(h.slice(4)).first(); if (await l.count().catch(() => 0)) { bb = await l.boundingBox(); break; } } hl.push({text: h, rects: bb ? [{x: bb.x - clip.x, y: bb.y - clip.y, w: bb.width, h: bb.height}] : []}); if (!bb) console.error('highlight not found:', h); continue; }
  const rects = await loc.evaluate((el, s) => {
    const w = document.createTreeWalker(el.ownerDocument.body, NodeFilter.SHOW_TEXT); let n; const all = [];
    while ((n = w.nextNode())) { const i = n.textContent!.indexOf(s); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + s.length); for (const q of r.getClientRects()) if (q.height > 0) all.push({x: q.x, y: q.y, w: q.width, h: q.height}); } }
    return all;
  }, h);
  // element coords are inside the frame; convert with the frame element offset.
  const fe = ff!.parentFrame() ? await (await ff!.frameElement()).boundingBox() : null;
  const fr = {x: fe?.x ?? 0, y: fe?.y ?? 0};
  if (!rects.length) console.error('highlight not found:', h);
  const inClip = rects.map((r) => ({x: r.x + fr.x - clip.x, y: r.y + fr.y - clip.y, w: r.w, h: r.h})).filter((r) => r.y >= -2 && r.y + r.h <= clip.height + 2 && r.x >= -2 && r.x + r.w <= clip.width + 2);
  if (!inClip.length) console.error('highlight not in clip:', h);
  hl.push({text: h, rects: inClip});
}
await p.screenshot({path: out, clip});
writeFileSync(out.replace(/\.png$/, '.rect.json'), JSON.stringify({url, block, clip, scale: Number(process.env.DSF ?? 2), highlights: hl, capturedAt: new Date().toISOString()}, null, 2));
console.log(out, JSON.stringify(clip), hl.map((h) => h.rects.length).join(','));
await b.close();
