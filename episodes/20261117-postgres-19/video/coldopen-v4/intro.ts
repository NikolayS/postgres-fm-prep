// Announcer intro for the v4 cold opens (v4a, v4c): the shots of intro.json, timed to the announcer.
// Name cards: the host's own Zoom tile as black-and-white video with a slow push-in, a small kicker
// ("STARRING") and the name in big type (first name white, last name pink) on a dark plate. The name fades in and out
// over 0.35 s and holds in between; no typing, flash or blink on the names.
// Usage: bun intro.ts <outdir> <seqdir>     seqdir holds nik/, michael/, kirk/ with %04d.png frames (25 fps)
//   writes <outdir>/%04d.png at 25 fps, 1920x1080.
import { join, resolve } from "path";
import { mkdirSync, readdirSync, unlinkSync } from "fs";

const H = import.meta.dir, REPO = resolve(H, "../../../..");
const { chromium } = await import(join(REPO, "tools/podcast-edit/cover/node_modules/playwright-core/index.js"));
const BRAND = join(REPO, "episodes/20261027-uuidv4-vs-uuidv7/video/brand-public");
const [outRel, seqRel] = Bun.argv.slice(2);
const out = resolve(outRel), seq = resolve(seqRel);
mkdirSync(out, { recursive: true });
type Shot = { kind: string; from: number; to: number; text?: string; who?: string; kicker?: string; first?: string; last?: string };
const tl: { end: number; shots: Shot[] } = await Bun.file(join(H, "intro.json")).json();
const FPS = 25, N = Math.round(tl.end * FPS);
const PLUM = "#3d0f45", DARK = "#16061b", PINK = "#ef7de3", PINK2 = "#f39aea";
const frames: Record<string, string[]> = {};
for (const w of ["nik", "michael", "kirk"]) frames[w] = readdirSync(join(seq, w)).filter((f) => f.endsWith(".png")).sort().map((f) => join(seq, w, f));

const fonts = ["700", "900"].map((w) => `@font-face{font-family:Lato;font-weight:${w};src:url("file://${BRAND}/fonts/Lato-${w}.woff2")}`).join("");
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const typed = (s: string, p: number) => s.slice(0, Math.round(s.length * clamp01(p)));
// Opacity and slide for text that holds: in over 0.35 s from `a`, out over 0.35 s before `b`.
const hold = (t: number, a: number, b: number) => Math.min(ease((t - a) / 0.35), ease((b - t) / 0.35));
const ring = (word: string, p: number, sw = 9) => `<span style="position:relative;display:inline-block">${word}<svg viewBox="0 0 200 100" preserveAspectRatio="none" style="position:absolute;left:-28%;top:-22%;width:156%;height:144%;overflow:visible"><path d="M 6 58 C 4 8, 196 2, 196 48 C 198 96, 10 100, 16 30" fill="none" stroke="${PINK}" stroke-width="${sw}" vector-effect="non-scaling-stroke" stroke-linecap="round" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="${1000 * (1 - ease(p))}" transform="rotate(-3 100 50)"/></svg></span>`;
const arrow = (x0: number, y: number, x1: number, p: number) => {
  const x = x0 + (x1 - x0) * ease(p);
  return p <= 0 ? "" : `<line x1="${x0}" y1="${y}" x2="${x}" y2="${y}" stroke="#fff" stroke-width="2"/><path d="M ${x - 14} ${y - 9} L ${x} ${y} L ${x - 14} ${y + 9}" fill="none" stroke="#fff" stroke-width="2"/>`;
};
const grain = (i: number) => `<svg width="1920" height="1080" style="position:absolute;left:0;top:0;mix-blend-mode:overlay;opacity:.22"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${i % 7}"/><feColorMatrix type="saturate" values="0"/></filter><rect width="1920" height="1080" filter="url(#g)"/></svg>`;
const ticks = `<div style="position:absolute;left:120px;top:150px;color:#fff;opacity:.35;font:700 14px Lato;letter-spacing:6px">POSTGRES.FM · EPISODE 197 · 2026</div><div style="position:absolute;right:120px;top:150px;color:#fff;opacity:.35;font:700 14px Lato;letter-spacing:6px">POSTGRES 19</div>`;

function shot(s: Shot, t: number, i: number): string {
  const p = (t - s.from) / (s.to - s.from), u = t - s.from;
  switch (s.kind) {
    case "caps": return `<div style="position:absolute;inset:0;background:${DARK}"></div>${ticks}
      <div style="position:absolute;left:0;width:1920px;top:480px;text-align:center;font:900 64px Lato;letter-spacing:22px;color:#fff;white-space:nowrap">${typed(s.text!, (u - 0.3) / 1.6)}</div>
      <svg width="1920" height="1080" style="position:absolute;left:0;top:0">${arrow(80, 512, 300, (u - 0.2) / 0.6)}${arrow(1620, 512, 1840, (u - 1.6) / 0.6)}</svg>`;
    case "wordmark": return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, ${PLUM} 0%, ${DARK} 70%)"></div>${ticks}
      <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;transform:scale(${0.9 + 0.1 * ease(u / 0.5) + 0.03 * p})"><img src="file://${BRAND}/wordmark-alpha.png" style="height:260px"></div>`;
    case "giant": return `<div style="position:absolute;inset:0;background:${PINK}"></div>
      <div style="position:absolute;left:${120 - 360 * p}px;top:250px;font:900 460px Lato;letter-spacing:24px;color:#fff;line-height:1;white-space:nowrap">${s.text}</div>`;
    case "card": {
      const f = frames[s.who!], img = f[Math.min(f.length - 1, Math.floor(u * FPS))], z = 1.03 + 0.06 * p, o = hold(t, s.from + 0.1, s.to), dy = 24 * (1 - o);
      return `<div style="position:absolute;inset:0;background:${DARK}"></div>
      <img src="file://${img}" style="position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:cover;filter:grayscale(1) contrast(1.45) brightness(1.05);transform:translateX(330px) scale(${z});transform-origin:50% 40%">
      <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(22,6,27,1) 0%,rgba(22,6,27,.92) 30%,rgba(22,6,27,0) 58%)"></div>
      <div style="position:absolute;left:96px;top:${536 + dy}px;opacity:${o};white-space:nowrap;padding:24px 36px 28px 24px;background:rgba(22,6,27,.78);border-left:6px solid ${PINK};border-radius:4px;text-shadow:0 2px 10px rgba(0,0,0,.6)">
        <div style="font:900 30px Lato;letter-spacing:12px;color:${PINK}">${s.kicker}</div>
        <div style="font:900 96px Lato;letter-spacing:10px;color:#fff;line-height:1.05;margin-top:18px">${s.first}</div>
        <div style="font:900 96px Lato;letter-spacing:10px;color:${PINK2};line-height:1.05">${s.last}</div>
      </div>
      <svg width="1920" height="1080" style="position:absolute;left:0;top:0;opacity:${o}">${arrow(96, 866, 820, (u - 0.3) / 0.7)}</svg>`;
    }
    default: { // header
      const sc = 0.92 + 0.08 * ease(u / 0.4);
      return `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, ${PLUM} 0%, ${DARK} 70%)"></div>${ticks}
      <div style="position:absolute;left:0;width:1920px;top:0;height:1080px;display:flex;justify-content:center;align-items:center;gap:56px;transform:scale(${sc})">
        <img src="file://${BRAND}/wordmark-alpha.png" style="height:150px"><span style="font:900 190px Lato;letter-spacing:-2px;color:#fff">Postgres <span style="color:${PINK2}">${ring("19", (u - 0.25) / 0.9)}</span></span></div>`;
    }
  }
}

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const tmp = join(out, "frame.html");
for (let i = 0; i < N; i++) {
  const t = i / FPS, s = tl.shots.find((x) => t >= x.from && t < x.to) ?? tl.shots[tl.shots.length - 1];
  await Bun.write(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${DARK}}</style></head><body>${shot(s, t, i)}${grain(i)}</body></html>`);
  await page.goto("file://" + tmp, { waitUntil: "load" });
  await page.evaluate(() => (document as any).fonts.ready);
  await page.screenshot({ path: join(out, `${String(i).padStart(4, "0")}.png`) });
}
await browser.close(); unlinkSync(tmp);
console.log(`intro: ${N} frames, ${tl.end} s -> ${out}`);
