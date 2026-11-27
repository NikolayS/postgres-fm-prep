// Episode 197 social v5: Nik clips for concepts #1 (upgrade advice) and #3 (log_lock_waits).
// Same style as the v4 Kirk clip (social/v4/build/build.ts "clip"): Nik's tile full width,
// captions under the tile, nothing in the bottom 180 px, end card.
//
//   bun episodes/20261117-postgres-19/social/v5/build/clips.ts [advice|bread ...]
//
// Times are on the final video (preview/episode-197-final.mp4; video = podcast + 43.76 s).
// Cut points sit in silences or RMS dips (20 ms frames); every cut was checked with
// whisper large-v3 on the joined audio. Outputs go to <episode>/preview/social-v5/ (git-ignored).
import { chromium } from "../../../../../tools/podcast-edit/cover/node_modules/playwright-core";
import { mkdirSync } from "node:fs";
import { EP, W, H, clipLayers } from "../../v4/build/slides";

const OUT = `${EP}/preview/social-v5`, TMP = `${OUT}/.tmp`;
mkdirSync(TMP, { recursive: true });
const SRC = `${EP}/preview/episode-197-final.mp4`;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const want = new Set(Bun.argv.slice(2)), all = want.size === 0;

type Clip = { name: string; header: string; seg: [number, number][]; caps: [number, string][] };
const CLIPS: Clip[] = [
  { // podcast 00:44:35. Cut: "like" x2, "uh", "I think", the repeated "start".
    // Whisper on the joined audio: "My recommendation usually was wait until .1, .2 version,
    // but now the better recommendation is don't wait, start testing earlier."
    name: "xn-advice", header: `UPGRADE <span style="color:var(--or)">TO 19?</span>`,
    seg: [[2718.80, 2719.60], [2720.02, 2721.70], [2722.50, 2725.10], [2725.88, 2728.02], [2728.43, 2730.26]],
    caps: [
      [2718.80, "My recommendation usually was:"],
      [2720.88, "wait until .1, .2 version."],
      [2724.34, "But now the better<br>recommendation is:"],
      [2727.34, "don’t wait, start testing earlier."],
    ] },
  { // podcast 00:29:40. Cut: "it, it", a long pause, "uh". Whisper hears "log log weights"
    // for the last word (the episode transcript: log_lock_waits).
    name: "xn-bread", header: `NEW <span style="color:var(--or)">DEFAULT</span>`,
    seg: [[1829.62, 1834.30], [1834.68, 1838.58], [1839.34, 1840.38]],
    caps: [
      [1829.62, "It takes a little bit<br>of my consulting bread,"],
      [1833.25, "because we always say “enable it”,"],
      [1836.25, "but now it’s enabled by default:"],
      [1839.34, "log_lock_waits."],
    ] },
];

async function run(cmd: string[]) {
  const pr = Bun.spawn(cmd, { stdout: "inherit", stderr: "inherit" });
  if ((await pr.exited) !== 0) throw new Error("failed: " + cmd.join(" "));
}
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
async function shot(html: string, out: string, w = W, h = H) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  const f = `${out}.html`; await Bun.write(f, html);
  await p.goto("file://" + f, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } }); await p.close();
}

for (const c of CLIPS.filter(c => all || want.has(c.name.slice(3)))) {
  const { seg: SEG, caps: CAPS } = c;
  const toClip = (t: number) => { let acc = 0; for (const [a, b] of SEG) { if (t >= a - 0.2 && t <= b) return acc + Math.max(0, t - a); acc += b - a; } throw new Error("time not in a segment: " + t); };
  const LEN = SEG.reduce((s, [a, b]) => s + b - a, 0), HOLD = 0.7, XF = 0.3;
  const L = clipLayers(CAPS.map(x => x[1]));
  const head = L.head.replace("Kirk Wolak", "Nik Samokhvalov").replace(/PLAN <span[^>]*>HINTS\?<\/span>/, c.header);
  if (head === L.head) throw new Error("header template changed");
  await shot(head, `${TMP}/${c.name}-head.png`); await shot(L.end, `${TMP}/${c.name}-end.png`);
  for (let i = 0; i < L.caps.length; i++) await shot(L.caps[i], `${TMP}/${c.name}-cap${i}.png`, W, 230);
  // Nik's tile in the final video: x 26-630, y 302-640 (same size as Kirk's, 604x338).
  const CW = 596, CX = 30, TY = 290, TH = Math.round(334 * W / CW / 2) * 2;
  const inputs: string[] = [];
  for (const [a, b] of SEG) inputs.push("-ss", a.toFixed(3), "-t", (b - a).toFixed(3), "-i", SRC);
  inputs.push("-loop", "1", "-i", `${TMP}/${c.name}-head.png`, "-loop", "1", "-i", `${TMP}/${c.name}-end.png`);
  for (let i = 0; i < CAPS.length; i++) inputs.push("-loop", "1", "-i", `${TMP}/${c.name}-cap${i}.png`);
  const nS = SEG.length, iHead = nS, iEnd = nS + 1, iCap0 = nS + 2;
  let f = "";
  for (let k = 0; k < nS; k++) {
    const d = SEG[k][1] - SEG[k][0];
    f += `[${k}:v]crop=${CW}:334:${CX}:304,scale=${W}:${TH}:flags=lanczos,unsharp=5:5:0.6,fps=30,setpts=PTS-STARTPTS[v${k}];`;
    f += `[${k}:a]atrim=0:${d.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=${(d - 0.06).toFixed(3)}:d=0.06[a${k}];`;
  }
  f += `${Array.from({ length: nS }, (_, k) => `[v${k}][a${k}]`).join("")}concat=n=${nS}:v=1:a=1[tile][aud];`;
  f += `[${iHead}:v]trim=0:${LEN.toFixed(3)},fps=30,format=yuv420p,setpts=PTS-STARTPTS[bg];[tile]format=yuv420p[tq];[bg][tq]overlay=0:${TY}:shortest=1[b0];`;
  const capY = TY + TH + 30;
  if (capY + 2 * 68 > H - 180) throw new Error("captions reach the bottom 180 px: " + capY);
  CAPS.forEach(([t], i) => {
    const a = i === 0 ? 0 : toClip(t), e = i + 1 < CAPS.length ? toClip(CAPS[i + 1][0]) - 0.05 : LEN;
    f += `[b${i}][${iCap0 + i}:v]overlay=0:${capY}:enable='between(t,${a.toFixed(2)},${e.toFixed(2)})'[b${i + 1}];`;
  });
  f += `[${iEnd}:v]trim=0:${(HOLD + XF).toFixed(2)},fps=30,format=yuv420p,setpts=PTS-STARTPTS[endv];`;
  f += `[b${CAPS.length}]format=yuv420p[main];[main][endv]xfade=transition=fade:duration=${XF}:offset=${(LEN - XF / 2).toFixed(2)}[vout];`;
  f += `[aud]apad=pad_dur=${HOLD + XF}[aout]`;
  const out = `${OUT}/${c.name}.mp4`;
  await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", ...inputs, "-filter_complex", f, "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
    "-t", (LEN + HOLD).toFixed(2), "-movflags", "+faststart", out]);
  let acc = 0; const joins = SEG.slice(0, -1).map(([a, b]) => (acc += b - a));
  const at = [0.1, ...joins.flatMap(j => [j - 0.15, j + 0.15]), LEN - 0.5, LEN + 0.5];
  for (let i = 0; i < at.length; i++) await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", at[i].toFixed(2), "-i", out, "-frames:v", "1", "-vf", "scale=270:-1", `${TMP}/${c.name}-chk${i}.png`]);
  await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", ...at.flatMap((_, i) => ["-i", `${TMP}/${c.name}-chk${i}.png`]), "-filter_complex", `${at.map((_, i) => `[${i}:v]`).join("")}hstack=inputs=${at.length}`, `${OUT}/${c.name}.check.png`]);
  await run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-ss", "0.1", "-i", out, "-frames:v", "1", `${OUT}/${c.name}.poster.png`]);
  console.log(`wrote ${out}: ${(LEN + HOLD).toFixed(1)} s`);
}
await browser.close();
