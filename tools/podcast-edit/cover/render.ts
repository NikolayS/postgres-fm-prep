import { chromium } from "playwright-core";
const [html, out, w, h] = [Bun.argv[2], Bun.argv[3], Number(Bun.argv[4] ?? 1280), Number(Bun.argv[5] ?? 720)];
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(Bun.argv[6] ?? 1) });
await p.goto("file://" + html, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
await b.close(); console.log("wrote", out);
