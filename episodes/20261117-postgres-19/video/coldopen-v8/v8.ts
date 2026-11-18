// Episode 197 v8: v7b timing and funk, clean faces, face-aware captions and split panels.
// Render JPEGs; FROM/TO or FRAMES=i,j,k select partial renders.
// Usage: bun v8.ts <workdir/v7> <outdir>
import { join, resolve } from "path";
import { mkdirSync, unlinkSync, statfsSync } from "fs";

const H = import.meta.dir, REPO = resolve(H, "../../../..");
const { chromium } = await import(join(REPO, "tools/podcast-edit/cover/node_modules/playwright-core/index.js"));
const BRAND = join(REPO, "episodes/20261027-uuidv4-vs-uuidv7/video/brand-public");
const [workRel, outRel] = Bun.argv.slice(2);
const W = resolve(workRel), out = resolve(outRel);
mkdirSync(out, { recursive: true });
const U = 60 / 128, TT = 18 * U, MLEN = 34.24;            // title length; montage length
const TB = 92 * U, FPS = 25, END = TB + 1.6, N = Math.round(END * FPS); // button hit on unit 92 (43.125 s)
const PLUM = "#3d0f45", DARK = "#16061b", PINK = "#ef7de3", PINK2 = "#f39aea";
const f4 = (n: number) => String(n).padStart(4, "0");
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const typed = (s: string, p: number) => s.slice(0, Math.round(s.length * clamp01(p)));
let seed = 1; const rnd = (k: number) => { seed = (k * 2654435761) % 4294967296; return ((seed >>> 8) % 1000) / 1000; };

// ---------- footage ----------
const seqF = (who: string, f: number) => join(W, "seq", who, f4(Math.min(70, Math.max(1, f + 1))) + ".png");
const mont = (src: string, m: number) => join(W, src, f4(Math.min(856, Math.max(1, Math.round(m * FPS) + 1))) + ".jpg");
// Face centres in the 1920x1080 tile images (for the intro face-run zoom)
const FACE: Record<string, [number, number, number, number]> = { nik: [1080, 590, 175, 235], michael: [1215, 575, 185, 245], kirk: [960, 410, 165, 205] };

// ---------- building blocks ----------
const fonts = ["700", "900"].map((w) => `@font-face{font-family:Lato;font-weight:${w};src:url("file://${BRAND}/fonts/Lato-${w}.woff2")}`).join("");
const defs = (rgb: number, hb: number) => `<svg width="0" height="0" style="position:absolute"><defs>
<filter id="rgb" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
 <feColorMatrix in="SourceGraphic" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="r" dx="${-rgb}" result="r2"/>
 <feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/>
 <feColorMatrix in="SourceGraphic" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/><feOffset in="b" dx="${rgb}" result="b2"/>
 <feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen"/></filter>
<filter id="hb" x="-20%" y="0" width="140%" height="100%"><feGaussianBlur stdDeviation="${hb} 0"/></filter>
<filter id="vb" x="0" y="-20%" width="100%" height="140%"><feGaussianBlur stdDeviation="0 ${hb}"/></filter>
</defs></svg>`;
const grain = (i: number) => `<svg width="1920" height="1080" style="position:absolute;left:0;top:0;mix-blend-mode:overlay;opacity:.2;pointer-events:none"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${i % 9}"/><feColorMatrix type="saturate" values="0"/></filter><rect width="1920" height="1080" filter="url(#g)"/></svg>`;
// Light leak: warm pink/orange blobs drifting across, screen blend; p 0..1 over its life
const leak = (p: number, side = 1) => {
  if (p <= 0 || p >= 1) return "";
  const a = Math.sin(Math.PI * p) * 0.85, x = side > 0 ? -300 + 1500 * p : 1900 - 1500 * p;
  return `<div style="position:absolute;inset:0;mix-blend-mode:screen;opacity:${a};background:radial-gradient(ellipse 700px 900px at ${x}px 420px, rgba(255,150,120,.95), rgba(239,125,227,.55) 40%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 380px 520px at ${x + 420 * side}px 760px, rgba(255,210,140,.7), rgba(0,0,0,0) 70%)"></div>`;
};
const duo = (src: string, extra = "", o = 1) => `<div style="position:absolute;inset:0;${extra}">
  <img src="file://${src}" style="position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover;filter:grayscale(1) contrast(1.5) brightness(1.05)">
  <div style="position:absolute;inset:0;background:${PLUM};mix-blend-mode:multiply;opacity:${0.75 * o}"></div>
  <div style="position:absolute;inset:0;background:${PINK};mix-blend-mode:screen;opacity:${0.16 * o}"></div></div>`;
const slamS = (u: number, d = 0.16, from = 1.2) => (u < 0 ? 0 : 1 + (from - 1) * (1 - ease(u / d)));
const shake = (u: number, amp = 22) => (u < 0 || u > 0.3 ? [0, 0] : [amp * Math.exp(-u * 14) * Math.sin(u * 95), amp * 0.7 * Math.exp(-u * 14) * Math.cos(u * 83)]);
// whip: position offset (px) and blur for the 3 frames into (k<0) or out of (k>0) a cut
const whip = (f: number, frames: number, dir: number) => { const k = f / frames; return { dx: dir * 1400 * k * k, blur: 90 * k }; };
const plate = (kicker: string, first: string, last: string, top = 536) => `<div style="position:absolute;left:96px;top:${top}px;white-space:nowrap;padding:24px 36px 28px 24px;background:rgba(22,6,27,.8);border-left:6px solid ${PINK};border-radius:4px">
  <div style="font:900 30px Lato;letter-spacing:12px;color:${PINK}">${kicker}</div>
  <div style="font:900 96px Lato;letter-spacing:10px;color:#fff;line-height:1.05;margin-top:18px">${first}</div>
  <div style="font:900 96px Lato;letter-spacing:10px;color:${PINK2};line-height:1.05">${last}</div></div>`;
// Band text under the heads (y 760-860): words, each {w, from, pink?, strike?: time}
type Word = { w: string; at: number; pink?: boolean; strike?: number };
const band = (m: number, words: Word[], pos: Pos) => {
  const shown = words.filter((x) => m >= x.at); if (!shown.length) return "";
  const last = Math.max(...shown.map((x) => x.at)), s = slamS(m - last, 0.14, 1.18);
  const spans = shown.map((x, k) => {
    const st = x.strike !== undefined && m >= x.strike ? `<svg viewBox="0 0 100 20" preserveAspectRatio="none" style="position:absolute;left:-4%;top:28%;width:108%;height:40%;overflow:visible"><path d="M 0 12 L 100 7" stroke="${PINK}" stroke-width="7" vector-effect="non-scaling-stroke" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 * (1 - ease((m - x.strike) / 0.12))}"/></svg>` : "";
    return `<span style="position:relative;display:inline-block;margin-right:28px;color:${x.pink ? PINK2 : "#fff"};${x.strike !== undefined && m >= x.strike ? "opacity:.55" : ""}">${x.w}${st}</span>`;
  }).join("");
  const just = pos.side === "l" ? "flex-start" : pos.side === "r" ? "flex-end" : "center", org = pos.side === "l" ? "0% 50%" : pos.side === "r" ? "100% 50%" : "50% 50%";
  return `<div style="position:absolute;left:60px;width:1800px;top:${pos.y}px;display:flex;justify-content:${just}"><div class="cap" style="padding:14px 34px 16px 38px;background:rgba(22,6,27,.82);border-left:6px solid ${PINK};border-radius:4px;font:900 72px Lato;letter-spacing:8px;white-space:nowrap;transform:scale(${s});transform-origin:${org}">${spans}</div></div>`;
};

// ---------- intro: 18 units of U s (the v4b title rhythm, names held longer) ----------
const giantName = (word: string, img: string, p: number) => `<div style="position:absolute;inset:0;background:${PINK}"></div>
  <img src="file://${img}" style="position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover;filter:grayscale(1) contrast(1.8);mix-blend-mode:multiply;opacity:.55">
  <div style="position:absolute;left:${-40 - 300 * p}px;top:250px;font:900 520px Lato;letter-spacing:30px;color:#fff;line-height:1;white-space:nowrap">${word}</div>`;
const typedPlate = (first: string, last: string, u: number) => `<div style="position:absolute;left:96px;top:536px;white-space:nowrap;padding:24px 36px 28px 24px;background:rgba(22,6,27,.8);border-left:6px solid ${PINK};border-radius:4px">
  <div style="font:900 30px Lato;letter-spacing:12px;color:${PINK}">CO-HOST</div>
  <div style="font:900 96px Lato;letter-spacing:10px;color:#fff;line-height:1.05;margin-top:18px;min-height:101px">${typed(first, u / 0.12)}</div>
  <div style="font:900 96px Lato;letter-spacing:10px;color:${PINK2};line-height:1.05;min-height:101px">${typed(last, (u - 0.1) / 0.18)}</div></div>`;
const HOSTS = [["nik", "NIK", "SAMOKHVALOV"], ["michael", "MICHAEL", "CHRISTOFIDES"], ["kirk", "KIRK", "WOLAK"]];
function intro(t: number, i: number): { body: string; rgb: number; hb: number } {
  let rgb = 0, hb = 0, body = "";
  const b = t / U, wrapRgb = (x: string) => `<div style="position:absolute;inset:0;filter:url(#rgb)">${x}</div>`;
  const whipWrap = (x: string, f: number, n: number, dir: number, out: boolean, vertical = false) => {
    const w = whip(out ? n + 1 - f : n - f, n, dir); hb = w.blur;
    return `<div style="position:absolute;inset:0;transform:${vertical ? `translateY(${w.dx * 0.7}px)` : `translateX(${w.dx}px)`};filter:url(#${vertical ? "vb" : "hb"})">${x}</div>`;
  };
  if (b < 2) { // POSTGRES slams, then "19" slams in pink with the ellipse; duotone hosts flicker behind
    const who = HOSTS[Math.floor(b * 2) % 3][0];
    body = duo(seqF(who, i % 60), "opacity:.5") + `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%, rgba(22,6,27,.15), rgba(22,6,27,.88) 75%)"></div>`;
    const u0 = t, u1 = t - U;
    body += `<div style="position:absolute;left:0;width:1920px;top:430px;text-align:center;font:900 120px Lato;letter-spacing:34px;color:#fff;white-space:nowrap">
      <span style="display:inline-block;transform:scale(${slamS(u0)})">POSTGRES</span>${u1 >= 0 ? `<span style="display:inline-block;margin-left:30px;color:${PINK2};transform:scale(${slamS(u1, 0.16, 1.6)});position:relative">19</span>` : ""}</div>`;
    if (u0 < 2 / FPS || (u1 >= 0 && u1 < 2 / FPS)) { rgb = 14; body = wrapRgb(body); }
  } else if (b < 2.5) { // giant POSTGRES on pink, whips out
    const p = (b - 2) / 0.5, f = Math.round((2.5 * U - t) * FPS);
    body = giantName("POSTGRES", "", p).replace(/<img[^>]*>/, "");
    if (f <= 2) body = whipWrap(body, f, 3, -1, true);
  } else if (b < 11.5) { // per host: giant first name (0.5 U), then the card (2.5 U)
    const k = Math.floor((b - 2.5) / 3), s = 2.5 + 3 * k, [who, first, last] = HOSTS[k];
    if (b < s + 0.5) {
      const p = (b - s) / 0.5; body = giantName(first, seqF(who, 4), p);
      if ((b - s) * U < 2 / FPS) { rgb = 12; body = wrapRgb(body); }
    } else {
      const u = t - (s + 0.5) * U, f = Math.floor(u * FPS + 1e-6), frozen = f >= 3;
      const [sx, sy] = shake(u - 3 / FPS), z = 1.04 + 0.05 * (u / (2.5 * U));
      const photo = frozen ? duo(seqF(who, 3)) : `<img src="file://${seqF(who, f)}" style="position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover">`;
      let inner = `<div style="position:absolute;inset:0;background:${DARK}"></div>
        <div style="position:absolute;inset:0;transform:translate(${330 + sx}px,${sy}px) scale(${z});transform-origin:60% 45%">${photo}</div>
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(22,6,27,.95) 0%,rgba(22,6,27,.7) 26%,rgba(22,6,27,0) 52%)"></div>`;
      if (frozen) inner += typedPlate(first, last, u - 3 / FPS);
      if (frozen && u - 3 / FPS < 1 / FPS) inner += `<div style="position:absolute;inset:0;background:#fff;opacity:.3"></div>`;
      body = frozen && u - 3 / FPS < 2 / FPS ? ((rgb = 10), wrapRgb(inner)) : inner;
      if (f < 3) body = whipWrap(inner, f, 3, 1, false, k === 2);
    }
  } else if (b < 12.5) { // face run: three tight pink duotone faces, a third of a unit each
    const k = Math.min(2, Math.floor((b - 11.5) * 3)), u = t - (11.5 + k / 3) * U, [who] = HOSTS[[1, 2, 0][k]];
    body = `<div style="position:absolute;inset:0;background:${PLUM}"></div><img src="file://${seqF(who, 8 + i % 20)}" style="position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover;filter:grayscale(1) contrast(1.7);mix-blend-mode:screen;transform:scale(${1.7 * slamS(u, 0.1, 1.15)});transform-origin:${FACE[who][0] / 19.2}% ${FACE[who][1] / 10.8}%"><div style="position:absolute;inset:0;background:${PINK};mix-blend-mode:multiply"></div>`;
    if (u < 1 / FPS) { rgb = 12; body = wrapRgb(body); }
  } else { // header plate: type, "19" slam at 13 U, ellipse, then zoom through the "1" into the episode
    const u = t - 12.5 * U, slam = t - 13 * U, zp = clamp01((t - 15.9 * U) / (TT - 15.9 * U)), reveal = clamp01((t - 15.6 * U) / (0.3 * U));
    const s19 = slam < 0 ? 0 : slamS(slam, 0.18, 3), [sx, sy] = shake(slam, 26), zs = Math.exp(Math.log(400) * Math.pow(zp, 2.2));
    body = `<img src="file://${mont("wide", 0)}" style="position:absolute;inset:0;width:1920px;height:1080px;transform:scale(${1.12 - 0.12 * zp})">
    <svg id="hp" width="1920" height="1080" style="position:absolute;left:0;top:0;overflow:visible" data-u="${u}" data-s19="${s19}" data-sx="${sx}" data-sy="${sy}" data-zs="${zs}" data-reveal="${reveal}" data-type="${clamp01(u / (0.5 * U))}" data-ring="-1">
      <defs><mask id="hole" maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000"><rect x="-100000" y="-100000" width="200000" height="200000" fill="#fff"/><text id="m19" font-family="Lato" font-weight="900" font-size="190" fill="#000" opacity="0">19</text></mask>
        <radialGradient id="glow" cx="50%" cy="48%" r="60%"><stop offset="0" stop-color="${PLUM}"/><stop offset="1" stop-color="${DARK}"/></radialGradient></defs>
      <g id="zoom"><rect x="-100000" y="-100000" width="200000" height="200000" fill="${DARK}" mask="url(#hole)"/>
        <rect x="0" y="0" width="1920" height="1080" fill="url(#glow)" mask="url(#hole)"/>
        <image id="wm" href="file://${BRAND}/wordmark-alpha.png" height="150" width="640"/>
        <text id="pg" font-family="Lato" font-weight="900" font-size="190" fill="#fff">Postgres</text>
        <g id="g19"><text id="t19" font-family="Lato" font-weight="900" font-size="190" fill="${PINK2}">19</text></g>
        <path id="r19" fill="none" stroke="${PINK}" stroke-width="9" stroke-linecap="round" pathLength="1000" stroke-dasharray="1000"/></g></svg>`;
    if (slam >= 0 && slam < 1 / FPS) body += `<div style="position:absolute;inset:0;background:#fff;opacity:.45"></div>`;
    if (slam >= 0 && slam < 2 / FPS) { rgb = 16; body = wrapRgb(body); }
    body += leak((slam - 0.04) / 1.0, -1);
  }
  return { body, rgb, hb };
}
// Lays out the header plate after fonts load (runs in the page).
const headerScript = `window.layoutHeader = () => {
  const svg = document.getElementById("hp"); if (!svg) return;
  const d = svg.dataset, pg = document.getElementById("pg"), t19 = document.getElementById("t19"), m19 = document.getElementById("m19"), wm = document.getElementById("wm");
  const full = "Postgres", type = +d.type; pg.textContent = full.slice(0, Math.round(full.length * type)) || " ";
  const wP = (() => { const t = pg.textContent; pg.textContent = full; const w = pg.getComputedTextLength(); pg.textContent = t; return w; })();
  const w19 = t19.getComputedTextLength(), gap = 56, sp = 48, total = 640 + gap + wP + sp + w19, x0 = (1920 - total) / 2, base = 610;
  wm.setAttribute("x", x0); wm.setAttribute("y", base - 68 - 75);
  pg.setAttribute("x", x0 + 640 + gap); pg.setAttribute("y", base);
  const x19 = x0 + 640 + gap + wP + sp; for (const e of [t19, m19]) { e.setAttribute("x", x19); e.setAttribute("y", base); }
  const s19 = +d.s19, cx = x19 + w19 / 2, cy = base - 68;
  document.getElementById("g19").setAttribute("transform", s19 ? "translate(" + (cx + +d.sx) + "," + (cy + +d.sy) + ") scale(" + s19 + ") translate(" + (-cx) + "," + (-cy) + ")" : "scale(0)");
  t19.setAttribute("opacity", 1 - +d.reveal); m19.setAttribute("opacity", +d.reveal);
  const rp = +d.ring, rx = w19 * 0.78, ry = 120, r = document.getElementById("r19");
  if (rp > 0 && +d.reveal < 1) { const e = 1 - Math.pow(1 - Math.min(1, rp), 3);
    r.setAttribute("d", "M " + (cx - rx) + " " + (cy + 10) + " C " + (cx - rx) + " " + (cy - ry * 1.15) + ", " + (cx + rx * 1.05) + " " + (cy - ry * 1.2) + ", " + (cx + rx) + " " + (cy - 4) + " C " + (cx + rx * .98) + " " + (cy + ry * 1.1) + ", " + (cx - rx * .9) + " " + (cy + ry * 1.15) + ", " + (cx - rx * .96) + " " + (cy - ry * .35));
    r.setAttribute("stroke-dashoffset", 1000 * (1 - e)); r.setAttribute("opacity", 1 - +d.reveal); } else r.setAttribute("d", "");
  // zoom point: the middle of the stem of the "1" (found by drawing the glyph on a canvas)
  const cv = document.createElement("canvas"); cv.width = 300; cv.height = 260; const g = cv.getContext("2d");
  g.font = "900 190px Lato"; g.fillStyle = "#000"; g.fillText("1", 20, 220);
  const row = 220 - 70, px = g.getImageData(0, row, 300, 1).data; let a = -1, b = -1;
  for (let x = 0; x < 300; x++) if (px[4 * x + 3] > 200) { if (a < 0) a = x; b = x; }
  const zx = x19 + (a + b) / 2 - 20, zy = base - 70, zs = +d.zs, c = Math.min(1, Math.log(zs) / Math.log(40));
  const tx = zx + (960 - zx) * c, ty = zy + (540 - zy) * c;   // bring the stem to the frame centre as it grows
  document.getElementById("zoom").setAttribute("transform", "translate(" + tx + "," + ty + ") scale(" + zs + ") translate(" + (-zx) + "," + (-zy) + ")");
};`;

// ---------- faces (Apple Vision boxes from faces.swift, per extracted frame) ----------
type Box = number[]; // x, y, w, h (+ pupils lx, ly, rx, ry from faces.swift)
const FACES: Record<string, Box[][]> = { n: [], m: [], k: [], wide: [] };
for (const line of (await Bun.file(join(W, "faces.jsonl")).text()).split("\n")) {
  if (!line) continue; const o = JSON.parse(line), mm = o.f.match(/\/(n|m|k|wide)\/(\d+)\.jpg$/);
  if (mm) FACES[mm[1]][Number(mm[2]) - 1] = o.b;
}
const facesAt = (src: string, m: number): Box[] => FACES[src]?.[Math.min(855, Math.max(0, Math.round(m * FPS)))] ?? [];
// Captions: a slot in the band under the heads (centre, left, right), else at the top (punch-ins only:
// the wide layout has its header there); never below y 900. A slot is free when its box (grown for the
// slam overshoot) misses every face box (grown for hair, beard and a margin) on every frame of the shot
// while the caption is up. The slot is chosen per shot, so a caption can move only on a cut.
type Pos = { side: "c" | "l" | "r"; y: number; dy: number };
type Cap = { a: number; b: number; words: (m: number) => Word[]; chars: number; scan?: number };
const W_ = (x: Word[]) => () => x;
const CAPS: Cap[] = [
  { a: 0.56, b: 4.4, words: W_([{ w: "GTA VI", at: 0.56 }, { w: "NOV 19", at: 2.32, pink: true }]), chars: 12 },
  { a: 5.21, b: 7.56, words: W_([{ w: "GTA", at: 5.21 }, { w: "19?", at: 5.21, pink: true }]), chars: 7 },
  { a: 7.88, b: 10.24, words: W_([{ w: "COMMIT", at: 7.88, strike: 9.58 }, { w: "REVERT", at: 9.66, pink: true }, { w: "FEST", at: 7.88 }]), chars: 18, scan: 9.58 },
  { a: 11.07, b: 14.3, words: W_([{ w: "20×", at: 11.07, pink: true }, { w: "CVEs", at: 12.19 }]), chars: 8 },
  { a: 16.59, b: 19.64, chars: 23, words: (m) => { const c = m < 18.19 ? 0 : clamp01((m - 18.19) / 0.45), v = Math.round(200 + (11000 - 200) * ease(c));
      return [{ w: "NOTIFY", at: 16.59 }, { w: "200/s", at: 16.59 }, ...(m >= 18.19 ? [{ w: `→ ${v.toLocaleString("en-US")}/s`, at: 18.19, pink: true }] : [])]; } },
  { a: 21.26, b: 24.05, words: W_([{ w: "YEARS", at: 21.26, strike: 23.57 }, { w: "DECADES", at: 23.6, pink: true }]), chars: 14 },
  { a: 27.96, b: 28.84, words: W_([{ w: "JUST", at: 27.96 }, { w: "DDL", at: 27.96, pink: true }]), chars: 8 },
  { a: 31.74, b: 34.1, words: W_([{ w: "JUST DDL", at: 31.74 }, { w: "+ POSTGRES 20", at: 33.18, pink: true }]), chars: 22 },
];
const capW = (chars: number) => chars * 50 + 130, CAP_H = 116;
const capRect = (chars: number, p: Pos): Box => { const w = capW(chars) * 1.1, h = CAP_H * 1.1, x = p.side === "l" ? 60 : p.side === "r" ? 1860 - w : 960 - w / 2; return [x, p.y - (h - CAP_H) / 2, w, h]; };
const hit = (a: Box, b: Box) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
const grow = (f: Box): Box => [f[0] - 30, f[1] - 0.55 * f[3] - 12, f[2] + 60, f[3] * 1.8 + 42]; // + hair above, beard below
const capCache = new Map<string, Pos>();
// If no slot is free, the punch-in is reframed: the picture moves down by dy px (a dark bar opens at the top).
function capPos(c: Cap, sh: Shot): Pos {
  const key = `${c.a}/${sh.a}`; if (capCache.has(key)) return capCache.get(key)!;
  // width from the words that are up by the end of this shot (NOTIFY's count-up: its widest text)
  const tEnd = Math.min(c.b, sh.b) - 0.01, ws = c.words(tEnd).filter((x) => tEnd >= x.at), chars = Math.max(c.chars * (c.a === 16.59 && tEnd >= 18.19 ? 1 : 0), ws.map((x) => x.w).join(" ").length + ws.length);
  const faces: Box[] = [];
  for (let f = Math.ceil(Math.max(c.a, sh.a) * FPS); f < Math.min(c.b, sh.b) * FPS; f++) faces.push(...facesAt(sh.src, f / FPS).map(grow));
  for (const dy of sh.src === "wide" ? [0] : [0, 180, 240, 300]) {
    const band: Pos[] = [{ side: "c", y: 752, dy }, { side: "l", y: 752, dy }, { side: "r", y: 752, dy }];
    const top: Pos[] = [{ side: "c", y: 40, dy }, { side: "l", y: 40, dy }, { side: "r", y: 40, dy }];
    const slots = sh.src === "wide" ? band : dy ? top : [...band, ...top];
    const p = slots.find((s) => !faces.some((f) => hit(capRect(chars, s), [960 + (f[0] - 960) * (1 - dy / 1080), f[1] * (1 - dy / 1080) + dy, f[2] * (1 - dy / 1080), f[3] * (1 - dy / 1080)])));
    if (p) { capCache.set(key, p); return p; }
  }
  throw new Error(`no free caption slot for "${c.words(c.b)[0].w}" in the ${sh.src} shot at ${sh.a}`);
}
const shotDy = (sh: Shot) => Math.max(0, ...CAPS.filter((c) => c.a < sh.b && c.b > sh.a).map((c) => capPos(c, sh).dy));

const med = (v: number[]) => v.sort((x, y) => x - y)[v.length >> 1];
// split panels: median eye midpoint and eye distance of each host over the split
const splitEyes = (who: string) => { const v: number[][] = [];
  for (let f = Math.round(24.25 * FPS); f < 25.48 * FPS; f++) { const b = facesAt(who, f / FPS)[0]; if (b && b[4] >= 0) v.push([(b[4] + b[6]) / 2, (b[5] + b[7]) / 2, Math.hypot(b[6] - b[4], b[7] - b[5])]); }
  return [0, 1, 2].map((j) => med(v.map((x) => x[j]))); };

// ---------- montage: the v4b six-topic montage (v3 seconds), with transitions and word-synced type ----------
type Shot = { a: number; b: number; src: string };
const SHOTS: Shot[] = [
  { a: 0, b: 2.3, src: "wide" }, { a: 2.3, b: 4.4, src: "n" }, { a: 4.4, b: 7.56, src: "m" }, { a: 7.56, b: 9.55, src: "wide" },
  { a: 9.55, b: 10.24, src: "k" }, { a: 10.24, b: 14.3, src: "wide" }, { a: 14.3, b: 15.32, src: "k" }, { a: 15.32, b: 19.64, src: "wide" },
  { a: 19.64, b: 21.72, src: "m" }, { a: 21.72, b: 24.05, src: "k" }, { a: 24.05, b: 24.25, src: "glitch" }, { a: 24.25, b: 25.0, src: "split" },
  { a: 25.0, b: 25.48, src: "expand" }, { a: 25.48, b: 28.84, src: "n" }, { a: 28.84, b: 31.44, src: "m" }, { a: 31.44, b: 99, src: "n" }];
const WHIP = [7.56, 15.32], ZOOMB = [10.24, 19.64], WIPE19 = 25.48, FREEZE = 34.1;
function montage(m: number, i: number, tEnd: number): { body: string; rgb: number; hb: number } {
  let rgb = 0, hb = 0, body = "";
  const sh = SHOTS.find((s) => m >= s.a && m < s.b)!;
  const base = (src: string, mm = m, extra = "") => `<img src="file://${mont(src, mm)}" style="position:absolute;inset:0;width:1920px;height:1080px;${extra}">`;
  const tb = TB - TT;
  if (m >= FREEZE) { // freeze ending: duotone, slow push, stamp on the button
    const u = m - FREEZE;
    body = duo(mont("n", FREEZE), `transform:scale(${1 + 0.05 * u / (tEnd - FREEZE)})`, ease(u / 0.16));
    body += `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%, rgba(22,6,27,.35), rgba(22,6,27,.9) 80%);opacity:${ease((m - tb) / 0.1)}"></div>`;
    if (m >= tb) {
      const sc = slamS(m - tb, 0.14, 1.35), [sx, sy] = shake(m - tb, 18);
      body += `<div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;gap:56px;transform:translate(${sx}px,${sy - 60}px) scale(${sc})"><img src="file://${BRAND}/wordmark-alpha.png" style="height:150px"><span style="font:900 190px Lato;color:#fff;letter-spacing:-2px">Postgres <span style="color:${PINK2}">19</span></span></div>`;
      body += leak((m - tb) / 1.3, 1);
      if (m - tb < 2 / FPS) { rgb = 14; body = `<div style="position:absolute;inset:0;filter:url(#rgb)">${body}</div>`; }
    }
    return { body, rgb, hb };
  }
  if (sh.src === "glitch") { // 5 frames: strips shifted, RGB split, one pink frame
    const f = Math.floor((m - sh.a) * FPS);
    for (let s = 0; s < 8; s++) body += `<div style="position:absolute;inset:0;clip-path:inset(${s * 12.5}% 0 ${100 - (s + 1) * 12.5}% 0);transform:translateX(${(rnd(i * 31 + s) - 0.5) * 220}px)">${base(f % 2 ? "k" : "wide", m)}</div>`;
    if (f === 2) body += `<div style="position:absolute;inset:0;background:${PINK};mix-blend-mode:multiply;opacity:.8"></div>`;
    rgb = 18; return { body: `<div style="position:absolute;inset:0;filter:url(#rgb)">${body}</div>`, rgb, hb };
  }
  if (sh.src === "split" || sh.src === "expand") { // three skewed panels of the laugh; Nik's grows to full
    // Each face is centred in its panel at one scale (eye distance IOD px), eyes on one line (y EY), with
    // headroom; the eye points are medians over the split, so the framing holds still.
    const u = m - 24.25, e = sh.src === "expand" ? ease((m - 25.0) / 0.2) : 0, sk = 60, IOD = 105, EY = 450;
    body = `<div style="position:absolute;inset:0;background:${DARK}"></div>`;
    for (const [who, k] of [["n", 0], ["m", 1], ["k", 2]] as const) {
      const x0 = k * 640, x1 = x0 + 640, slide = (1 - ease((u - k * 0.08) / 0.16)) * (k - 1 || 1) * 900;
      const full = who === "n" ? e : 0, hide = who !== "n" ? e : 0, [ex, ey, iod] = splitEyes(who);
      const sc = IOD / iod, px = x0 + 320 + sk * (1 - 2 * EY / 1080), L = px - sc * ex, T = EY - sc * ey;
      const s2 = sc + (1 - sc) * full, L2 = L * (1 - full), T2 = T * (1 - full);
      const clip = full > 0 ? `polygon(${x0 + sk - (x0 + sk + 200) * full}px 0, ${x1 + sk + (2120 - x1 - sk) * full}px 0, ${x1 - sk + (2120 - x1 + sk) * full}px 1080px, ${x0 - sk - (x0 - sk + 200) * full}px 1080px)` : `polygon(${x0 + sk}px 0, ${x1 + sk}px 0, ${x1 - sk}px 1080px, ${x0 - sk}px 1080px)`;
      body += `<div style="position:absolute;inset:0;clip-path:${clip};transform:translateY(${slide}px);opacity:${1 - hide}">
        <img src="file://${mont(who, m)}" style="position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover;filter:blur(30px) brightness(.6);transform:scale(1.1)">
        <img src="file://${mont(who, m)}" style="position:absolute;left:${L2}px;top:${T2}px;width:${1920 * s2}px;height:${1080 * s2}px"></div>`;
      if (!full) body += `<svg width="1920" height="1080" style="position:absolute;left:0;top:0;transform:translateY(${slide}px);opacity:${1 - hide}"><path d="M ${x1 + sk} 0 L ${x1 - sk} 1080" stroke="${PINK}" stroke-width="8"/></svg>`;
    }
    return { body, rgb, hb };
  }
  const dy = shotDy(sh);
  body = dy ? `<div style="position:absolute;inset:0;background:${DARK}"></div><div style="position:absolute;inset:0;transform:translateY(${dy}px) scale(${1 - dy / 1080});transform-origin:50% 0">${base(sh.src)}</div>` : base(sh.src);
  const fIn = Math.floor((m - sh.a) * FPS + 1e-6), fOut = Math.round((sh.b - m) * FPS);
  if (WHIP.includes(sh.a) && fIn < 3) { const w = whip(3 - fIn, 3, 1); body = `<div style="position:absolute;inset:0;transform:translateX(${w.dx}px);filter:url(#hb)">${body}</div>`; hb = w.blur; }
  if (WHIP.includes(sh.b) && fOut <= 3) { const w = whip(4 - fOut, 4, -1); body = `<div style="position:absolute;inset:0;transform:translateX(${w.dx}px);filter:url(#hb)">${body}</div>`; hb = w.blur; }
  const zb = (k: number) => { let s = ""; for (let j = 4; j >= 1; j--) s += `<div style="position:absolute;inset:0;opacity:${0.22 * k};transform:scale(${1 + 0.05 * j * k})">${base(sh.src)}</div>`; return s; };
  if (ZOOMB.includes(sh.b) && fOut <= 4) { const k = (5 - fOut) / 5; body = `<div style="position:absolute;inset:0;transform:scale(${1 + 0.3 * k * k})">${body}${zb(k)}</div>`; }
  if (ZOOMB.includes(sh.a) && fIn < 4) { const k = (4 - fIn) / 4; body = `<div style="position:absolute;inset:0;transform:scale(${1 + 0.25 * k * k})">${body}${zb(k)}</div>`; }
  // word-synced captions (v3 seconds = Scribe word times), each placed where it covers no face
  // Clear text before an outgoing whip/zoom moves a face into its formerly free slot.
  const exiting = (WHIP.includes(sh.b) && fOut <= 3) || (ZOOMB.includes(sh.b) && fOut <= 4);
  for (const c of CAPS) if (m >= c.a && m < c.b && !exiting) {
    const pos = capPos(c, sh);
    if (c.scan && m >= c.scan && m < c.scan + 0.32) body += `<div style="position:absolute;left:0;width:1920px;top:${pos.y - 15}px;height:150px;background:repeating-linear-gradient(0deg, rgba(255,255,255,.18) 0 3px, rgba(0,0,0,0) 3px 9px);transform:translateX(${(rnd(i) - 0.5) * 40}px);mix-blend-mode:screen"></div>`;
    body += band(m, c.words(m), pos);
  }
  if (m >= WIPE19 - 0.16 && m < WIPE19 + 0.16) { const p = (m - WIPE19 + 0.16) / 0.32; body += `<div style="position:absolute;top:-180px;left:${2000 - 3900 * p}px;font:900 1400px Lato;color:${PINK};line-height:1;letter-spacing:-40px">19</div>`; }
  return { body, rgb, hb };
}

// ---------- render ----------
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const tmp = join(out, "frame.html"), from = Number(process.env.FROM ?? 0), to = Number(process.env.TO ?? N);
const list = process.env.FRAMES ? process.env.FRAMES.split(",").map(Number) : Array.from({ length: Math.min(N, to) - from }, (_, k) => from + k);
const capLog: string[] = [];
for (const i of list) {
  const disk = statfsSync(out);
  if (disk.bavail * disk.bsize < 3 * 1024 ** 3) throw new Error("STOP: less than 3 GiB free; record this in RESULT.md");
  const t = i / FPS;
  let r: { body: string; rgb: number; hb: number };
  if (t >= END - 2 / FPS) r = { body: `<div style="position:absolute;inset:0;background:#000"></div>`, rgb: 0, hb: 0 };
  else r = t < TT ? intro(t, i) : montage(t - TT, i, END - TT);
  await Bun.write(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${fonts}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${DARK}}</style><script>${headerScript}</script></head><body>${defs(r.rgb, r.hb)}${r.body}${t < END - 2 / FPS ? grain(i) : ""}</body></html>`);
  await page.goto("file://" + tmp, { waitUntil: "load" });
  await page.evaluate(async () => { await (document as any).fonts.ready; (window as any).layoutHeader(); });
  await page.screenshot({ path: join(out, `${f4(i)}.jpg`), type: "jpeg", quality: 95 });
  const caps = await page.evaluate(() => [...document.querySelectorAll(".cap")].map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
  if (caps.length) capLog.push(JSON.stringify({ i, m: +(t - TT).toFixed(3), src: t >= TT ? SHOTS.find((s) => t - TT >= s.a && t - TT < s.b)?.src : null, caps }));
}
await browser.close(); unlinkSync(tmp);
if (capLog.length) await Bun.write(join(out, `caps-${from}-${list[list.length - 1]}.jsonl`), capLog.join("\n") + "\n");
console.log(`v8: frames ${from}-${Math.min(N, to) - 1} of ${N} (${END.toFixed(2)} s) -> ${out}`);
