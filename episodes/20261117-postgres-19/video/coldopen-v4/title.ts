// Title sequence for the v4 cold opens (style study: a fast late-night news-show open).
// 12 beats at the given BPM: tracked caps + a hand-drawn ellipse, giant cropped name letters,
// black-and-white host portraits with typed names, a fast face run, then the one-line header.
// Our brand only: Lato, plum #3d0f45, pinks #ef7de3 / #f39aea, the postgres.fm wordmark.
// Usage: bun title.ts <outdir> <bpm> <nik.png> <michael.png> <kirk.png> [--fx]
//   writes <outdir>/%04d.png at 25 fps (1920x1080). --fx adds flash frames and RGB-split ghosts.
import { join, resolve } from "path";
import { mkdirSync } from "fs";

const REPO = resolve(import.meta.dir, "../../../..");
const { chromium } = await import(join(REPO, "tools/podcast-edit/cover/node_modules/playwright-core/index.js"));
const BRAND = join(REPO, "episodes/20261027-uuidv4-vs-uuidv7/video/brand-public");

const [outRel, bpmS, ...rest] = Bun.argv.slice(2);
const [nikP, micP, kirkP] = rest.slice(0, 3).map((p) => resolve(p));
const out = resolve(outRel), bpm = Number(bpmS), fx = rest.includes("--fx");
mkdirSync(out, { recursive: true });
const B = 60 / bpm, FPS = 25, N = Math.round(12 * B * FPS);
const PLUM = "#3d0f45", DARK = "#16061b", PINK = "#ef7de3", PINK2 = "#f39aea";

const fonts = ["700", "900"].map((w) => `@font-face{font-family:Lato;font-weight:${w};src:url("file://${BRAND}/fonts/Lato-${w}.woff2")}`).join("");
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// Hand-drawn ellipse around an inline word: an SVG stretched over the span (viewBox 200x100).
const ring = (word: string, p: number, sw = 6) => {
  const d = "M 6 58 C 4 8, 196 2, 196 48 C 198 96, 10 100, 16 30";
  return `<span style="position:relative;display:inline-block">${word}<svg viewBox="0 0 200 100" preserveAspectRatio="none" style="position:absolute;left:-28%;top:-22%;width:156%;height:144%;overflow:visible"><path d="${d}" fill="none" stroke="${PINK}" stroke-width="${sw}" vector-effect="non-scaling-stroke" stroke-linecap="round" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="${1000 * (1 - ease(p))}" transform="rotate(-3 100 50)"/></svg></span>`;
};
// Line with an arrow head, drawn left to right over p.
const arrow = (x0: number, y: number, x1: number, p: number) => {
  const x = x0 + (x1 - x0) * ease(p);
  return p <= 0 ? "" : `<line x1="${x0}" y1="${y}" x2="${x}" y2="${y}" stroke="#fff" stroke-width="2"/><path d="M ${x - 14} ${y - 9} L ${x} ${y} L ${x - 14} ${y + 9}" fill="none" stroke="#fff" stroke-width="2"/>`;
};
const typed = (s: string, p: number) => s.slice(0, Math.round(s.length * clamp01(p)));
const grain = `<svg width="1920" height="1080" style="position:absolute;left:0;top:0;mix-blend-mode:overlay;opacity:.22"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="SEED"/><feColorMatrix type="saturate" values="0"/></filter><rect width="1920" height="1080" filter="url(#g)"/></svg>`;
const ticks = `<div style="position:absolute;left:120px;top:150px;color:#fff;opacity:.35;font:700 14px Lato;letter-spacing:6px">POSTGRES.FM · EPISODE 197 · 2026</div><div style="position:absolute;right:120px;top:150px;color:#fff;opacity:.35;font:700 14px Lato;letter-spacing:6px">POSTGRES 19</div>`;

// Portrait: B&W, high contrast, slow push-in; name typed in white + pink, arrow line.
const portrait = (img: string, first: string, last: string, p: number) => {
  const z = 1.04 + 0.07 * p;
  return `<div style="position:absolute;inset:0;background:${DARK}"></div>
  <img src="file://${img}" style="position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:cover;filter:grayscale(1) contrast(1.55) brightness(1.05);transform:translateX(300px) scale(${z});transform-origin:50% 40%">
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(22,6,27,1) 0%,rgba(22,6,27,.9) 22%,rgba(22,6,27,0) 50%)"></div>
  <div style="position:absolute;left:120px;top:690px;font:900 64px Lato;letter-spacing:14px;color:#fff;white-space:nowrap">${typed(first, p * 3)}<span style="color:${PINK}">${typed(last, p * 3 - 1)}</span></div>
  <svg width="1920" height="1080" style="position:absolute;left:0;top:0">${arrow(120, 790, 820, p * 2 - 0.6)}</svg>`;
};
// Giant cropped letters on pink, a faint B&W face behind (multiply).
const giant = (word: string, img: string, p: number) => `<div style="position:absolute;inset:0;background:${PINK}"></div>
  <img src="file://${img}" style="position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:cover;filter:grayscale(1) contrast(1.8);mix-blend-mode:multiply;opacity:.55">
  <div style="position:absolute;left:${-60 - 240 * p}px;top:250px;font:900 520px Lato;letter-spacing:30px;color:#fff;line-height:1;white-space:nowrap">${word}</div>`;
// Face run frame: tight duotone crop.
const faceRun = (img: string, flip: boolean) => `<div style="position:absolute;inset:0;background:${PLUM}"></div>
  <img src="file://${img}" style="position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:cover;filter:grayscale(1) contrast(1.7);mix-blend-mode:screen;transform:scale(1.6)${flip ? " scaleX(-1)" : ""};transform-origin:50% 35%">
  <div style="position:absolute;inset:0;background:${PINK};mix-blend-mode:multiply"></div>`;

function frame(i: number): string {
  const t = i / FPS, b = t / B; // beats
  let body = "";
  if (b < 2) { // tracked caps, "19" in pink, ellipse + arrow
    const p = b / 2;
    body = `<div style="position:absolute;inset:0;background:${DARK}"></div>${ticks}
    <div style="position:absolute;left:0;width:1920px;top:470px;text-align:center;font:900 72px Lato;letter-spacing:26px;color:#fff;white-space:nowrap">${typed("POSTGRES", p * 2.2)}${b > 0.9 ? ` <span style="color:${PINK}">${ring("19", (b - 1) / 0.8)}</span>` : ""}</div>
    <svg width="1920" height="1080" style="position:absolute;left:0;top:0">${arrow(160, 506, 520, (b - 0.2) / 0.6)}${arrow(1400, 506, 1760, (b - 1.3) / 0.6)}</svg>`;
  } else if (b < 2.5) body = giant("POSTGRES", "", (b - 2) / 0.5).replace(/<img[^>]*>/, "");
  else if (b < 3.5) body = portrait(nikP, "NIK ", "SAMOKHVALOV", (b - 2.5) / 1);
  else if (b < 4) body = giant("MICHAEL", micP, (b - 3.5) / 0.5);
  else if (b < 5) body = portrait(micP, "MICHAEL ", "CHRISTOFIDES", (b - 4) / 1);
  else if (b < 5.5) body = giant("KIRK", kirkP, (b - 5) / 0.5);
  else if (b < 6.5) body = portrait(kirkP, "KIRK ", "WOLAK", (b - 5.5) / 1);
  else if (b < 8) { const k = Math.floor((b - 6.5) / 0.5); body = faceRun([nikP, micP, kirkP][Math.min(2, k)], k === 1); }
  else { // the header, big, with the ellipse under "19"
    const p = (b - 8) / 4, s = 0.92 + 0.08 * ease(p * 3);
    body = `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, ${PLUM} 0%, ${DARK} 70%)"></div>${ticks}
    <div style="position:absolute;left:0;width:1920px;top:0;height:1080px;display:flex;justify-content:center;align-items:center;gap:56px;transform:scale(${s})">
      <img src="file://${BRAND}/wordmark-alpha.png" style="height:150px"><span style="font:900 190px Lato;letter-spacing:-2px;color:#fff">Postgres <span style="color:${PINK2}">${ring("19", (b - 8.3) / 0.9, 9)}</span></span></div>`;
  }
  let fxl = "";
  if (fx) {
    const cuts = [2, 2.5, 3.5, 4, 5, 5.5, 6.5, 7, 7.5, 8];
    if (cuts.some((c) => b >= c && b < c + 1 / (B * FPS) - 1e-6)) fxl += `<div style="position:absolute;inset:0;background:#fff;opacity:.85"></div>`;
    if (cuts.some((c) => b >= c && b < c + 0.12)) fxl += `<div style="position:absolute;inset:0;backdrop-filter:hue-rotate(60deg) saturate(3);mix-blend-mode:difference;opacity:.35;transform:translateX(${(i % 2 ? 1 : -1) * 18}px)"></div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${DARK}}</style></head><body>${body}${grain.replace("SEED", String(i % 7))}${fxl}</body></html>`;
}

const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const tmp = join(out, "frame.html");
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
for (let i = 0; i < N; i++) {
  await Bun.write(tmp, frame(i));
  await page.goto("file://" + tmp, { waitUntil: "load" });
  await page.evaluate(() => (document as any).fonts.ready);
  await page.screenshot({ path: join(out, `${String(i).padStart(4, "0")}.png`) });
}
await browser.close();
(await import("fs")).unlinkSync(tmp);
console.log(`title: ${N} frames, ${(N / FPS).toFixed(2)} s at ${bpm} BPM -> ${out}`);
