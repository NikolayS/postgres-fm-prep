// Capture a real docs page at 1920x1080 (2x), scroll a target element into view, and save its rect.
// Usage: bun scripts/capture.ts <url> <css-or-text selector> <out.png> [scrollOffsetPx]
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const [url, sel, out, offArg] = process.argv.slice(2);
const off = Number(offArg ?? 260);
const browser = await chromium.launch({executablePath: process.env.BROWSER_BIN});
const page = await browser.newPage({viewport: {width: Number(process.env.VW ?? 1280), height: Number(process.env.VH ?? 720)}, deviceScaleFactor: 2});
await page.goto(url, {waitUntil: 'networkidle'});
const loc = page.locator(sel).first();
await loc.waitFor();
await loc.evaluate((el, o) => { const y = el.getBoundingClientRect().top + window.scrollY - o; window.scrollTo(0, y); }, off);
await page.waitForTimeout(400);
const rect = await loc.boundingBox();
// Content column (whole lines live inside it); used to frame the push-in.
const col = page.locator(process.env.COL ?? '#docContent, .message-content, #pgContentWrap, main').first();
const column = (await col.count()) ? await col.boundingBox() : null;
await page.screenshot({path: out, fullPage: false});
writeFileSync(out.replace(/\.png$/, '.rect.json'), JSON.stringify({url, selector: sel, rect, column, viewport: {width: Number(process.env.VW ?? 1280), height: Number(process.env.VH ?? 720)}, capturedAt: new Date().toISOString()}, null, 2));
console.log(JSON.stringify(rect));
await browser.close();
