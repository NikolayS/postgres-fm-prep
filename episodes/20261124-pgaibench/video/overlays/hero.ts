// Viewport capture of a page top at 2x (product pages). bun scripts/hero.ts <url> <out.png> [vw] [vh]
import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const [url, out, vw, vh] = process.argv.slice(2);
const W = Number(vw ?? 1280), H = Number(vh ?? 720);
const b = await chromium.launch({executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const p = await (await b.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 2, locale: 'en-US'})).newPage();
await p.goto(url, {waitUntil: 'networkidle', timeout: 90000}); await p.waitForTimeout(3000);
await p.screenshot({path: out});
writeFileSync(out.replace(/\.png$/, '.rect.json'), JSON.stringify({url, clip: {x: 0, y: 0, width: W, height: H}, scale: 2, highlights: [], capturedAt: new Date().toISOString()}, null, 2));
await b.close();
