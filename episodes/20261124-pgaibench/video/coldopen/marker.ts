// Band Marker strips as PNG frame sequences (same look as overlays/src/Band.tsx Marker: yellow roughened
// stroke, dark Lato 700 text, slight tilt, 0.5 s left-to-right swipe). Usage: bun marker.ts <outdir> <seed> <line1> [<line2>]
// Writes <outdir>/l<N>_%02d.png (13 swipe frames + hold) for each line, 1920x1080, transparent.
import { $ } from "bun";
import { mkdirSync } from "fs";
const [outRel, seedS, ...lines] = Bun.argv.slice(2); const out = require("path").resolve(outRel);
const BRAND = require("path").resolve(import.meta.dir, "../../../20261027-uuidv4-vs-uuidv7/video/brand-public");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
mkdirSync(out, { recursive: true });
const fps = 25, swipe = 0.5, N = Math.round(swipe * fps);
const ease = (x: number) => 1 - (1 - x) * (1 - x);
const strip = (text: string, seed: number, f: number, top: number) => {
  const w = 104 * ease(Math.min(1, f / N));
  const textIn = Math.max(0, Math.min(1, (f - 0.1 * fps) / (0.3 * fps)));
  const tilt = ((seed * 9301 + 49297) % 233280) / 233280 * 1.6 - 0.8;
  return `<div style="position:absolute;left:${LEFT}px;top:${top}px"><div style="position:relative;display:inline-block;padding:10px 30px 12px 26px;font-size:46px;font-weight:700;color:#111;line-height:1.2;white-space:nowrap;transform:rotate(${tilt}deg);clip-path:inset(-6px ${Math.max(0, 104 - w)}% -6px -10px)">
  <svg style="position:absolute;left:-8px;top:-4px;width:calc(100% + 16px);height:calc(100% + 8px)"><defs><filter id="r${seed}" x="-5%" y="-10%" width="110%" height="120%" filterUnits="objectBoundingBox"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.12" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
  <rect x="6" y="8" width="calc(100% - 12px)" height="calc(100% - 16px)" rx="6" fill="rgba(255,214,0,0.86)" filter="url(#r${seed})"/><rect x="10" y="14" width="calc(100% - 22px)" height="calc(100% - 28px)" rx="4" fill="rgba(255,225,60,0.55)" filter="url(#r${seed})" style="mix-blend-mode:multiply"/></svg>
  <span style="position:relative;opacity:${textIn}">${text}</span></div></div>`;
};
const page = (body: string) => `<!doctype html><html><head><style>@font-face{font-family:Lato;font-weight:700;src:url("file://${BRAND}/fonts/Lato-700.woff2")}html,body{margin:0;width:1920px;height:1080px;background:transparent;overflow:hidden;font-family:Lato}</style></head><body>${body}</body></html>`;
// Under the head tiles, never at the frame bottom (YouTube subtitles): TOP = first line top, default 724
// (ep195 wide layout: tiles end at y 642, name labels end at y 714).
const TOP = Number(process.env.TOP ?? 724), LEFT = Number(process.env.LEFT ?? 24); // ep198: TOP 744, LEFT 120 (two-tile layout)
const tops = [TOP, TOP + 80]; // ep198: two lines end by y 900
for (let li = 0; li < lines.length; li++) {
  for (let f = 0; f <= N + 3; f++) {
    // earlier lines are fully drawn; this line swipes in
    const body = lines.slice(0, li).map((t, k) => strip(t, Number(seedS) + k, 999, tops[k])).join("") + strip(lines[li], Number(seedS) + li, f, tops[li]);
    const html = `${out}/l${li}_${String(f).padStart(2, "0")}.html`;
    await Bun.write(html, page(body));
    await $`${CHROME} --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 --virtual-time-budget=2000 --window-size=1920,1080 --screenshot=${html.replace(".html", ".png")} file://${html}`.quiet();
  }
}
console.log("ok", out);
