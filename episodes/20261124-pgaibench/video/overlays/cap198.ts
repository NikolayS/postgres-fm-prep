// Capture a passage of a real page at 2x: from the block that holds START to the block that holds
// END (both: exact text, or css=<selector>), across the width of COL (css, default: the common
// parent of both blocks). Highlights: exact text ranges (Range.getClientRects), relative to the PNG.
//   bun scripts/cap198.ts <url> <out.png> <start> <end> [highlight ...]
// env: MAXH (cap the clip height, CSS px), VW (default 1100), VH (default 2400), PAD (default 14), THEME (light|dark), WAIT ms, DSF (default 2)
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const [url, out, start, end, ...hls] = process.argv.slice(2);
const VW = Number(process.env.VW ?? 1100), VH = Number(process.env.VH ?? 2400), PAD = Number(process.env.PAD ?? 14), DSF = Number(process.env.DSF ?? 2);
const b = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const ctx = await b.newContext({viewport: {width: VW, height: VH}, deviceScaleFactor: DSF, colorScheme: (process.env.THEME as any) ?? 'light', locale: 'en-US', timezoneId: 'UTC'});
const p = await ctx.newPage();
await p.goto(url, {waitUntil: 'load', timeout: 90000});
await p.waitForTimeout(Number(process.env.WAIT ?? 4000));
const res = await p.evaluate(({start, end, col, hls}) => {
  const find = (s: string): Element | null => {
    if (s.startsWith('css=')) return document.querySelector(s.slice(4));
    // smallest block-level element whose text contains s
    let best: Element | null = null;
    for (const el of Array.from(document.body.querySelectorAll('p,li,dt,dd,h1,h2,h3,h4,div,blockquote,td,section,figure,pre'))) {
      if ((el.textContent ?? '').replace(/\s+/g, ' ').includes(s) && (!best || best.contains(el))) best = el;
    }
    return best;
  };
  const a = find(start), z = find(end);
  if (!a || !z) return {err: `not found: ${!a ? start : end}`};
  a.scrollIntoView({block: 'start'});
  window.scrollBy(0, -160); // clear sticky site headers
  const ra = a.getBoundingClientRect(), rz = z.getBoundingClientRect();
  let colEl: Element | null = col ? document.querySelector(col) : null;
  if (!colEl) { colEl = a.parentElement; while (colEl && !colEl.contains(z)) colEl = colEl.parentElement; }
  const rc = colEl!.getBoundingClientRect();
  const box = {x: rc.x, y: Math.min(ra.y, rz.y), w: rc.width, h: Math.max(ra.bottom, rz.bottom) - Math.min(ra.y, rz.y)};
  const out: {text: string; rects: {x: number; y: number; w: number; h: number}[]}[] = [];
  for (const h of hls) {
    const rects: {x: number; y: number; w: number; h: number}[] = [];
    if (h.startsWith('css=')) { const el = document.querySelector(h.slice(4)); if (el) { const r = el.getBoundingClientRect(); rects.push({x: r.x, y: r.y, w: r.width, h: r.height}); } }
    else {
      // text may span several text nodes: walk all text, map the match back to nodes
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const nodes: Text[] = []; let n;
      while ((n = w.nextNode())) nodes.push(n as Text);
      const full = nodes.map((t) => t.textContent ?? '').join('');
      const i = full.indexOf(h);
      if (i >= 0) {
        let off = 0, sN: Text | null = null, sO = 0, eN: Text | null = null, eO = 0;
        for (const t of nodes) { const L = (t.textContent ?? '').length; if (!sN && i < off + L) { sN = t; sO = i - off; } if (!eN && i + h.length <= off + L) { eN = t; eO = i + h.length - off; } off += L; }
        const r = document.createRange(); r.setStart(sN!, sO); r.setEnd(eN!, eO);
        for (const q of Array.from(r.getClientRects())) if (q.height > 0 && q.width > 1) rects.push({x: q.x, y: q.y, w: q.width, h: q.height});
      }
    }
    out.push({text: h, rects});
  }
  return {box, hl: out};
}, {start, end, col: process.env.COL ?? '', hls});
if ('err' in res) { console.error(res.err); process.exit(2); }
const {box, hl} = res as any;
const clip = {x: Math.max(0, box.x - PAD), y: Math.max(0, box.y - PAD), width: Math.min(Number(process.env.MAXW ?? VW), VW, box.w + 2 * PAD), height: Math.min(Number(process.env.MAXH ?? 1e9), box.h + 2 * PAD)};
const highlights = hl.map((h: any) => ({text: h.text, rects: h.rects.map((r: any) => ({x: r.x - clip.x, y: r.y - clip.y, w: r.w, h: r.h}))}));
for (const h of highlights) if (!h.rects.length) console.error('highlight not found:', h.text);
await p.screenshot({path: out, clip});
writeFileSync(out.replace(/\.png$/, '.rect.json'), JSON.stringify({url, start, end, clip, scale: DSF, highlights, capturedAt: new Date().toISOString()}, null, 2));
console.log(out, JSON.stringify(clip), highlights.map((h: any) => h.rects.length).join(','));
await b.close();
