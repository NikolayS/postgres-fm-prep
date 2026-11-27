// Episode 197 social v4: render every image, the animated hero, the Kirk clip, the LinkedIn PDF
// carousel and the phone-size contact sheet.
//
//   bun episodes/20261117-postgres-19/social/v4/build/build.ts [slides|hero|clip|pdf|sheet ...]
//
// Outputs go to <episode>/preview/social-v4/ (git-ignored) and <episode>/preview/social-v4-sheet.png.
// Needs Google Chrome, ffmpeg, and the cover tool's node_modules (cd tools/podcast-edit/cover && bun install).
import { chromium, type Page } from "../../../../../tools/podcast-edit/cover/node_modules/playwright-core";
import { mkdirSync, existsSync } from "node:fs";
import { EP, W, H, slides, clipLayers, articleCover } from "./slides";

const OUT = `${EP}/preview/social-v4`;
const TMP = `${OUT}/.tmp`;
mkdirSync(TMP, { recursive: true });
const want = new Set(Bun.argv.slice(2));
const all = want.size === 0;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
async function shot(html: string, out: string, w = W, h = H, transparent = false) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  const f = `${TMP}/${out.split("/").pop()}.html`;
  await Bun.write(f, html);
  await p.goto("file://" + f, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  if ((await p.evaluate(() => document.querySelector("[data-fit]") ? (document.querySelector("[data-fit]") as HTMLElement).scrollWidth > (document.querySelector("[data-fit]") as HTMLElement).clientWidth + 1 : false)))
    throw new Error(`${out}: headline does not fit`);
  const wide = await p.evaluate(() => [...document.querySelectorAll("[data-fitrow] .nums, [data-fitrow] .lab")].filter(e => (e as HTMLElement).scrollWidth > (e as HTMLElement).clientWidth + 1 || e.getBoundingClientRect().right > 1016).length);
  if (wide) throw new Error(`${out}: ${wide} hero row(s) do not fit`);
  if (await p.evaluate(() => typeof (window as any).set === "function")) await p.evaluate(() => (window as any).set(999));
  await p.screenshot({ path: out, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  await p.close();
}
async function run(cmd: string[]) {
  const pr = Bun.spawn(cmd, { stdout: "inherit", stderr: "inherit" });
  if ((await pr.exited) !== 0) throw new Error("failed: " + cmd.join(" "));
}

const S = await slides();
if (all || want.has("slides")) {
  for (const [id, html] of Object.entries(S)) { await shot(html, `${OUT}/${id}.png`); console.log("wrote", `${id}.png`); }
}

// ---- animated hero: 30 fps, 8.5 s loop: row 1 complete on frame 0, rows 2-3 in by 3.2 s, hold, rows 2-3 out
if (all || want.has("hero")) {
  const FPS = 30, DUR = 8.5;
  const p: Page = await browser.newPage({ viewport: { width: W, height: H } });
  await Bun.write(`${TMP}/hero.html`, S["s00-hero"]);
  await p.goto(`file://${TMP}/hero.html`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  const enc = Bun.spawn(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-f", "lavfi", "-t", String(DUR), "-i", "anullsrc=r=48000:cl=stereo",
    "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest",
    "-movflags", "+faststart", `${OUT}/xa-hero.mp4`], { stdin: "pipe" });
  for (let n = 0; n < Math.round(FPS * DUR); n++) {
    await p.evaluate((t) => (window as any).set(t), n / FPS);
    enc.stdin.write(await p.screenshot({ type: "png" }));
  }
  enc.stdin.end(); await enc.exited; await p.close();
  // check strip: frame 0, 0.7 s, mid-build, hold, last frame (must match frame 0 for the loop)
  const at = [0, 2.0, 4.3, 5.4, DUR - 0.1];
  for (let i = 0; i < at.length; i++) await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", at[i].toFixed(3), "-i", `${OUT}/xa-hero.mp4`, "-frames:v", "1", "-vf", "scale=430:-1", `${TMP}/hchk${i}.png`]);
  await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", ...at.flatMap((_, i) => ["-i", `${TMP}/hchk${i}.png`]), "-filter_complex", `${at.map((_, i) => `[${i}:v]`).join("")}hstack=inputs=${at.length}`, `${OUT}/xa-hero.check.png`]);
  console.log("wrote xa-hero.mp4, xa-hero.check.png");
}

// ---- Kirk clip: two pieces of the final video, his tile, captions under it, end card
if (all || want.has("clip")) {
  const SRC = `${EP}/preview/episode-197-final.mp4`;
  // final-video times. Cut points sit in silences (ffmpeg silencedetect -35 dB): 1534.90-1535.20,
  // 1539.36-1539.88, 1545.74-1545.86, 1566.77-1567.20, 1569.89-1570.36, 1573.93-1574.19. Two long
  // pauses are shortened to about 0.15 s. The clip ends after "baby" (whisper large-v3: "baby."
  // ends 1574.12, "And" starts after the 1573.93-1574.19 silence).
  const SEG = [[1535.08, 1539.48], [1539.76, 1545.78], [1566.95, 1570.00], [1570.25, 1574.06]];
  const CAPS: [number, string][] = [ // whisper word times on the final video (see ../../clip197.py)
    [1535.10, "Plan hints, to me, is the 1975 solution"],
    [1539.15, "to having a query that you need to tell the database,"],
    [1543.62, "“Hey, you’re gonna calculate this wrong.”"],
    [1567.00, "It was a great idea in 1975, okay?"],
    [1570.72, "The problem is, we’re 2026, baby."],
  ];
  const toClip = (t: number) => { let acc = 0; for (const [a, b] of SEG) { if (t >= a - 0.2 && t <= b) return acc + Math.max(0, t - a); acc += b - a; } throw new Error("time not in a segment: " + t); };
  const LEN = SEG.reduce((s, [a, b]) => s + b - a, 0), HOLD = 0.7, XF = 0.3;
  const L = clipLayers(CAPS.map(c => c[1]));
  await shot(L.head, `${TMP}/clip-head.png`);
  await shot(L.end, `${TMP}/clip-end.png`);
  for (let i = 0; i < L.caps.length; i++) await shot(L.caps[i], `${TMP}/cap${i}.png`, W, 230, true);
  // Kirk's tile in the final video: x 1290-1894, y 302-640 (clip197.py). v4: the whole tile, shown full width.
  const CW = 604, CX = 1290;
  const TW = W, TX = 0, TY = 290, TH = Math.round(338 * TW / CW / 2) * 2;
  const inputs: string[] = [];
  for (const [a, b] of SEG) inputs.push("-ss", a.toFixed(3), "-t", (b - a).toFixed(3), "-i", SRC);
  inputs.push("-loop", "1", "-i", `${TMP}/clip-head.png`, "-loop", "1", "-i", `${TMP}/clip-end.png`);
  for (let i = 0; i < CAPS.length; i++) inputs.push("-loop", "1", "-i", `${TMP}/cap${i}.png`);
  const nS = SEG.length, iHead = nS, iEnd = nS + 1, iCap0 = nS + 2;
  let f = "";
  for (let k = 0; k < nS; k++) {
    const d = SEG[k][1] - SEG[k][0];
    f += `[${k}:v]crop=${CW}:338:${CX}:302,scale=${TW}:${TH}:flags=lanczos,unsharp=5:5:0.6,fps=30,setpts=PTS-STARTPTS[v${k}];`;
    f += `[${k}:a]atrim=0:${d.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=${(d - 0.06).toFixed(3)}:d=0.06[a${k}];`;
  }
  f += `${Array.from({ length: nS }, (_, k) => `[v${k}][a${k}]`).join("")}concat=n=${nS}:v=1:a=1[tile][aud];`;
  f += `[${iHead}:v]trim=0:${LEN.toFixed(3)},fps=30,format=yuv420p,setpts=PTS-STARTPTS[bg];`;
  f += `[tile]format=yuv420p[tq];`;
  f += `[bg][tq]overlay=${TX}:${TY}:shortest=1[b0];`;
  const capY = TY + TH + 30;
  if (capY + 2 * 68 > H - 180) throw new Error("clip captions reach the bottom 180 px: " + capY);
  CAPS.forEach(([t], i) => {
    const a = i === 0 ? 0 : toClip(t), e = i + 1 < CAPS.length ? toClip(CAPS[i + 1][0]) - 0.05 : LEN;
    f += `[b${i}][${iCap0 + i}:v]overlay=0:${capY}:enable='between(t,${a.toFixed(2)},${e.toFixed(2)})'[b${i + 1}];`;
  });
  f += `[${iEnd}:v]trim=0:${(HOLD + XF).toFixed(2)},fps=30,format=yuv420p,setpts=PTS-STARTPTS[endv];`;
  f += `[b${CAPS.length}]format=yuv420p[main];[main][endv]xfade=transition=fade:duration=${XF}:offset=${(LEN - XF / 2).toFixed(2)}[vout];`;
  f += `[aud]apad=pad_dur=${HOLD + XF}[aout]`;
  await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", ...inputs, "-filter_complex", f, "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
    "-t", (LEN + HOLD).toFixed(2), "-movflags", "+faststart", `${OUT}/xc-kirk.mp4`]);
  // check strip: first 1.5 s, the jump cut, last 1.5 s of speech
  let acc = 0; const joins = SEG.slice(0, -1).map(([a, b]) => (acc += b - a));
  const at = [0.1, 1.0, ...joins.flatMap(j => [j - 0.15, j + 0.15]), LEN - 0.5, LEN + 0.5];
  for (let i = 0; i < at.length; i++) await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", at[i].toFixed(2), "-i", `${OUT}/xc-kirk.mp4`, "-frames:v", "1", "-vf", "scale=270:-1", `${TMP}/chk${i}.png`]);
  await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", ...at.flatMap((_, i) => ["-i", `${TMP}/chk${i}.png`]), "-filter_complex", `${at.map((_, i) => `[${i}:v]`).join("")}hstack=inputs=${at.length}`, `${OUT}/xc-kirk.check.png`]);
  await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", "3", "-i", `${OUT}/xc-kirk.mp4`, "-frames:v", "1", `${OUT}/xc-kirk.poster.png`]);
  console.log(`wrote xc-kirk.mp4: ${(LEN + HOLD).toFixed(1)} s`);
}

// ---- LinkedIn document carousel: hero, the slides, an end slide with the thumbnail
if (all || want.has("pdf")) {
  const thumb = `${EP}/preview/covers-v2/FINAL-thumb.jpg`;
  const endHtml = S["s07-plans"].replace(/<body>[\s\S]*<script>/, `<body>
<div class="top"><span><i></i><b>postgres.fm</b> 197</span><span>Listen or watch</span></div>
<h1 data-fit>The full <em>episode</em></h1>
<img src="file://${thumb}" style="position:absolute;left:64px;top:300px;width:952px;border-radius:12px">
<div class="sub" style="top:880px;color:var(--ink)">Michael Christofides, Kirk Wolak and I:<br>our favorite 19 features and what to check before you upgrade.</div>
<div class="sub" style="top:1060px;color:var(--or);font-size:44px">Links in the first comment</div>
<script>`);
  await shot(endHtml, `${OUT}/s08-end.png`);
  const order = ["s06-upgrade", "s00-hero", "s01-notify", "s02-autovac", "s03-lz4", "s04-jit", "s05-repack", "s07-plans", "s08-end"];
  const html = `<!doctype html><html><head><style>@page{size:${W}px ${H}px;margin:0}*{margin:0}img{display:block;width:${W}px;height:${H}px;page-break-after:always}</style></head><body>${order.map(o => `<img src="file://${OUT}/${o}.png">`).join("")}</body></html>`;
  const p = await browser.newPage();
  await Bun.write(`${TMP}/deck.html`, html);
  await p.goto(`file://${TMP}/deck.html`, { waitUntil: "networkidle" });
  await p.pdf({ path: `${OUT}/li-carousel.pdf`, width: `${W}px`, height: `${H}px`, printBackground: true });
  await p.close();
  console.log("wrote li-carousel.pdf");
}

// ---- X Article: cover (1500x500) and a phone preview (430x932) of its first screen
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const article = async () => {
  const src = await Bun.file(`${EP}/social/v4/x-article.md`).text();
  const title = src.match(/^## Title\n\n(.+)$/m)![1];
  const body = src.split(/^## Body\n/m)[1].split(/^---$/m)[0].trim();
  return { title, body, words: body.replace(/^Image: .*$/gm, "").replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length };
};
if (all || want.has("article") || want.has("sheet")) {
  await shot(await articleCover(), `${OUT}/article-cover.png`, 1500, 500);
  const { title, body, words } = await article();
  const md2html = (s: string) => s.split(/\n\n+/).map(p => p.startsWith("```") ? `<pre>${esc(p.replace(/```\n?/g, ""))}</pre>` : p.startsWith("### ") ? `<h3>${esc(p.slice(4))}</h3>`
    : p.startsWith("Image: ") ? (/`(s\d\d-[a-z0-9]+\.png)`/.test(p) ? `<img class="fig" src="file://${OUT}/${p.match(/`(s\d\d-[a-z0-9]+\.png)`/)![1]}">` : "")
    : `<p>${esc(p).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>")}</p>`).join("");
  const phone = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0}
body{width:430px;background:#fff;font-family:system-ui,-apple-system,Helvetica,sans-serif;color:#0f1419}
.bar{height:44px;display:flex;align-items:center;padding:0 16px;font:700 17px system-ui,Helvetica;border-bottom:1px solid #eff3f4}
.cover{width:430px;display:block}.in{padding:14px 16px}h1{font:800 26px/1.2 system-ui,Helvetica,sans-serif;margin:4px 0 12px}
.by{display:flex;gap:10px;align-items:center;font-size:15px;color:#536471;margin-bottom:14px}.by i{width:36px;height:36px;border-radius:50%;background:#111013;display:block}.by b{color:#0f1419}
p{font-size:17px;line-height:1.45;margin:0 0 14px}h3{font:800 21px/1.25 system-ui,Helvetica,sans-serif;margin:20px 0 10px}code{font:14px Menlo}
pre{font:12px/1.4 Menlo;background:#f4f4f5;border-radius:8px;padding:10px;white-space:pre-wrap;margin:0 0 14px}.fig{width:100%;border-radius:12px;margin:4px 0 14px;display:block}</style></head><body>
<div class="bar">&larr;&nbsp;&nbsp;Article</div><img class="cover" src="file://${OUT}/article-cover.png">
<div class="in"><h1>${esc(title)}</h1><div class="by"><i></i><span><b>Nik Samokhvalov</b><br>Article &middot; ${words} words</span></div>${md2html(body)}</div></body></html>`;
  await shot(phone, `${OUT}/article-phone.png`, 430, 932);
  if (words < 600 || words > 900) throw new Error("article words out of 600-900: " + words);
  console.log("wrote article-cover.png, article-phone.png;", words, "words");
}

// ---- contact sheet: every post text next to its media, at phone width
if (all || want.has("sheet")) {
  const md = (f: string) => Bun.file(`${EP}/social/v4/${f}`).text();
  type Post = { title: string; text: string; media: string[]; count: number };
  const xcount = (s: string) => [...s.replace(/https?:\/\/\S+/g, "x".repeat(23))].length;
  const parse = (src: string): Post[] => [...src.matchAll(/^### (.+)\n(?:(?!#)[^\n]*\n)*?```text\n([\s\S]*?)```/gm)].map(m => ({
    title: m[1].replace(/`/g, ""), text: m[2].trimEnd(), count: xcount(m[2].trimEnd()),
    media: [...m[1].matchAll(/`([^`]+\.(?:png|jpg|mp4|pdf))`/g)].map(x => x[1]),
  }));
  const xs = parse(await md("x-plan.md")), li = parse(await md("linkedin.md"));
  for (const p of xs) if (p.count > (/long form/.test(p.title) ? 1000 : 280)) throw new Error(`X post over 280: ${p.title} (${p.count})`);
  const mediaTag = (m: string) => {
    const f = m.endsWith(".mp4") ? (m.includes("kirk") ? `${OUT}/xc-kirk.poster.png` : `${OUT}/s00-hero.png`)
      : m.endsWith(".pdf") ? `${OUT}/s00-hero.png` : m.startsWith("/") ? m : `${OUT}/${m}`;
    if (!existsSync(f)) throw new Error("missing media " + f);
    const tag = m.endsWith(".mp4") ? `<span class="tag">VIDEO</span>` : m.endsWith(".pdf") ? `<span class="tag">PDF, 9 pages</span>` : "";
    return `<div class="m">${tag}<img src="file://${f}"></div>`;
  };
  const postHtml = (p: Post, kind: string) => `<div class="post"><div class="who"><b>Nik Samokhvalov</b> <span>${kind} &middot; ${p.title}</span></div>
<div class="txt">${esc(p.text)}</div><div class="media n${Math.min(p.media.length, 2)}">${p.media.map(m => mediaTag(m.replace("preview/social-v4/", ""))).join("")}</div>
<div class="cnt">${kind === "X" ? p.count + (/long form/.test(p.title) ? " (long form)" : " / 280") : p.text.length + " chars"}</div></div>`;
  const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}body{background:#e9e7e2;font-family:-apple-system,Helvetica,sans-serif;padding:28px;width:2440px}
h2{font:800 30px -apple-system;margin:0 0 18px}.cols{display:flex;gap:28px;align-items:flex-start}
.grid{display:grid;grid-template-columns:repeat(4,430px);gap:22px;align-items:start}
.post{background:#fff;border-radius:16px;padding:16px 16px 12px;width:430px;box-shadow:0 1px 3px #0002}
.who{font-size:15px;color:#536471;margin-bottom:6px}.who b{color:#0f1419}
.txt{white-space:pre-wrap;font-size:16px;line-height:1.35;color:#0f1419}
.media{margin-top:10px;display:grid;gap:4px}.media.n2{grid-template-columns:1fr 1fr}
.m{position:relative}.m img{width:100%;display:block;border-radius:14px;border:1px solid #cfd9de}
.tag{position:absolute;left:10px;bottom:10px;background:#000c;color:#fff;font:700 13px -apple-system;padding:3px 8px;border-radius:6px}
.cnt{font-size:12px;color:#8a8f94;margin-top:8px;text-align:right}
.li{width:520px}.li .post{width:520px}
</style></head><body>
<h2>postgres.fm 197 &middot; social v4 drafts (not posted) &middot; phone width 430 px</h2>
<div class="cols"><div><h2 style="font-size:22px">X: standalone posts, in schedule order</h2><div class="grid">${xs.map(p => postHtml(p, "X")).join("")}</div></div>
<div class="li"><h2 style="font-size:22px">LinkedIn</h2>${li.map(p => postHtml(p, "LinkedIn")).join("")}
<h2 style="font-size:22px;margin-top:28px">X Article (optional, before Unit A)</h2>
<div class="post"><div class="who"><b>Cover</b> <span>1500x500 &middot; article-cover.png</span></div><div class="m"><img src="file://${OUT}/article-cover.png"></div>
<div class="who" style="margin-top:14px"><b>First screen on a phone</b> <span>430x932 &middot; ${(await article()).words} words</span></div>
<div class="m"><img src="file://${OUT}/article-phone.png" style="width:430px"></div></div></div></div></body></html>`;
  const p = await browser.newPage({ viewport: { width: 2496, height: 1000 } });
  await Bun.write(`${TMP}/sheet.html`, sheet);
  await p.goto(`file://${TMP}/sheet.html`, { waitUntil: "networkidle" });
  await p.screenshot({ path: `${EP}/preview/social-v4-sheet.png`, fullPage: true });
  await p.close();
  console.log("wrote preview/social-v4-sheet.png;", xs.map(x => x.count).join(", "));
}
await browser.close();
