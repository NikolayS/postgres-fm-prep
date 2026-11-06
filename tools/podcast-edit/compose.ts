// Final episode: title card + laid-out show + end card, with intro/outro music.
//
//   bun compose.ts <layout.json> <edited.mp4> <out.mp4> --intro intro.mp3 --outro outro.mp3
//                  [--until S | --tail S] [--preset fast] [--card 4] [--end 10] [--duck -15]
//                  [--duck-ramp 2] [--intro-fade 6] [--end 0 = no end card]
//
// Picture: fade from black -> title card (C s, layers fade/slide in) -> 0.8 s crossfade ->
// the show with the layout.ts filtergraph -> end card (E s) -> logo video (config "logo") ->
// credit card (config "credit"), joined by 0.8 s crossfades -> fade to black. One encode.
// Sound: the intro is played at full level over the card, ducks by --duck dB just before
// the first words and plays on ducked to its own ending. The outro bed enters ducked (up to
// --bed-lead s) before the show ends, rises after the sign-off and ends with the episode. Music cues are first
// set to -18 LUFS; the final mix is two-pass loudnorm to -16 LUFS, -1.5 dBTP.
// --until S keeps only the first S s of the show (intro demo; no outro). --tail S keeps
// only the last S s (outro demo; no title card, no intro). --from S starts later (no card).
// --overlays manifest.json: full-frame alpha overlays at their final time; an overlay with
// freezeSec holds the picture and pauses the talk for that long while its SFX play.
import { $ } from "bun";
import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { filtergraph, prepareUi, renderHtml, type LayoutConfig } from "./layout";
import type { Detection } from "./detect-tiles";
import { sfxOff, talkChain } from "./freeze-audio";

const FONT = `-apple-system,"SF Pro Display","Helvetica Neue",sans-serif`;
const MONO = `"JetBrains Mono",ui-monospace,monospace`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function duration(f: string) {
  return Number((await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${f}`.text()).trim());
}

async function lufs(f: string): Promise<number> {
  const out = await $`ffmpeg -hide_banner -nostats -i ${f} -af ebur128 -f null -`.nothrow().quiet();
  const m = out.stderr.toString().match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/);
  if (!m) throw new Error(`no loudness for ${f}`);
  return Number(m[1]);
}

// Background shared by both cards (same look as the layout background, no holes).
function bgHtml(w: number, h: number, light = false) {
  if (light) return `<!doctype html><html><head><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${LIGHT_BG}}</style></head><body></body></html>`;
  return `<!doctype html><html><head><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}</style></head><body>
<svg width="${w}" height="${h}"><defs>
<radialGradient id="g" cx="18%" cy="0%" r="110%"><stop offset="0" stop-color="#16263F"/><stop offset="0.55" stop-color="#0D1625"/><stop offset="1" stop-color="#0A0F1A"/></radialGradient>
<pattern id="d" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.045)"/></pattern></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#d)"/></svg></body></html>`;
}

// postgres.ai look for the cards after its wordmark: warm light background, Archivo, orange.
const LIGHT_BG = "#eeeae2";
const ARCHIVO = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap";

// One transparent layer: a block of text at (left, top).
function layerHtml(w: number, h: number, top: number, inner: string, light = false) {
  if (light) return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${ARCHIVO}"><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}
.b{position:absolute;left:160px;top:${top}px;width:${w - 320}px;font-family:"Archivo","Helvetica Neue",Arial,sans-serif;color:#0d0d10}
.kicker{font-size:40px;font-weight:500;color:#55524c}
.big{font-size:104px;font-weight:900;letter-spacing:-1px;line-height:1.05}.big i{font-style:normal;color:rgb(255,98,18)}
.lead{font-size:50px;font-weight:500;line-height:1.25;max-width:1500px;text-wrap:balance}
.links{font-family:${MONO};font-size:36px;color:#55524c}.links span{color:#0d0d10}
</style></head><body><div class="b">${inner}</div></body></html>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent}
.b{position:absolute;left:160px;top:${top}px;width:${w - 320}px;font-family:${FONT};color:#E8EDF5}
.mark{font-family:${MONO};font-weight:700;font-size:44px;letter-spacing:1px}.mark i{font-style:normal;color:#4F8AD1}
.bar{width:72px;height:4px;border-radius:2px;background:#4F8AD1;margin-bottom:28px}
.title{font-size:80px;font-weight:700;line-height:1.08;letter-spacing:-0.5px;text-wrap:balance;max-width:1300px}
.hosts{font-size:32px;color:#B7C3D6}.hosts b{color:#E8EDF5;font-weight:600}
.links{font-family:${MONO};font-size:34px;color:#93A4BD}.links span{color:#E8EDF5}
</style></head><body><div class="b">${inner}</div></body></html>`;
}

type Layer = { png: string; st: number; d: number; dy: number };

async function card(work: string, name: string, w: number, h: number, parts: { top: number; html: string; st: number }[], light = false): Promise<{ bg: string; layers: Layer[] }> {
  const bg = join(work, `${name}-bg.png`);
  await renderHtml(bgHtml(w, h, light), w, h, bg);
  const layers: Layer[] = [];
  for (const [i, p] of parts.entries()) {
    const png = join(work, `${name}-l${i}.png`);
    await renderHtml(layerHtml(w, h, p.top, p.html, light), w, h, png);
    layers.push({ png, st: p.st, d: 0.7, dy: 24 });
  }
  return { bg, layers };
}

// Overlay manifest (from the overlay agent): times are edited.mp4 seconds.
type Sfx = { file: string; at: number; gain?: number }; // gain is ignored: see --sfx-rel
type Overlay = { file: string; outStart: number; dur: number; placement?: "band" | "full" | "center"; freezeSec?: number; sfx?: Sfx[] };
type Freeze = { at: number; sec: number };

// Edited time -> final time: the title card first, then every freeze that starts before t.
export function toFinal(t: number, C: number, freezes: Freeze[]): number {
  return C + t + freezes.filter((f) => f.at < t).reduce((a, f) => a + f.sec, 0);
}

// Loudest momentary (400 ms) loudness of a short sound, for SFX levels.
async function momentaryMax(f: string): Promise<number> {
  const out = await $`ffmpeg -hide_banner -nostats -v verbose -i ${f} -af apad=pad_dur=0.5,ebur128=framelog=verbose -f null -`.nothrow().quiet();
  const ms = [...out.stderr.toString().matchAll(/ M:\s*(-?[\d.]+)/g)].map((m) => Number(m[1])).filter((v) => v > -70);
  if (!ms.length) throw new Error(`no loudness for ${f}`);
  return Math.max(...ms);
}


if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const [configPath, input, output] = args;
  const intro = flag("--intro"), outro = flag("--outro"), manifestPath = flag("--overlays");
  if (!output) { console.error("usage: bun compose.ts <layout.json> <edited.mp4> <out.mp4> [--intro a.mp3] [--outro b.mp3] [--overlays manifest.json] [--from S] [--until S | --tail S] [--preset fast]"); process.exit(2); }
  const full = await duration(input);
  const to = flag("--until") ? Number(flag("--until")) : full;
  const from = flag("--tail") ? full - Number(flag("--tail")) : Number(flag("--from") ?? 0);
  const C = from > 0 ? 0 : Number(flag("--card") ?? 5), E = Number(flag("--end") ?? 8), DUCK = Number(flag("--duck") ?? -15);
  const X1 = 0.8, X2 = 0.8, MUSIC_LUFS = -18, SFX_M = Number(flag("--sfx-lufs") ?? -20);
  const FADE_IN = 1.0, FADE_OUT = 2.0; // from black / to black, picture and sound
  const BED_LEAD = Number(flag("--bed-lead") ?? 30); // longest outro-bed lead under the closing talk

  // logo: a video played after the end card (path relative to the config); credit: a light
  // card after it ({kicker, big, lead, sec}).
  const c: LayoutConfig & { links?: string[]; cardTitle?: string; logo?: string; credit?: { kicker?: string; big: string; lead?: string; sec?: number } } = await Bun.file(configPath).json();
  const base = dirname(resolve(configPath));
  for (const p of Object.values(c.place)) if (p.track) p.track = resolve(base, p.track); // as layout.ts resolvePlaces
  const tiles: Detection = typeof c.tiles === "string" ? await Bun.file(resolve(base, c.tiles)).json() : c.tiles;
  const segments = c.cuts ? (await Bun.file(resolve(base, c.cuts)).json()).segments : null;
  const { w, h, fps } = c.canvas;
  const snap = (t: number) => Math.round(t * fps) / fps;
  const work = join(dirname(resolve(output)), `.compose-${output.split("/").pop()}`);
  mkdirSync(work, { recursive: true });

  // Overlays and freezes inside the window, in window time (edited time - from).
  const manifest: { overlays: Overlay[] } | Overlay[] | null = manifestPath ? await Bun.file(manifestPath).json() : null;
  const mdir = manifestPath ? dirname(resolve(manifestPath)) : "";
  const overlays = (Array.isArray(manifest) ? manifest : manifest?.overlays ?? [])
    .filter((o) => o.outStart >= from && o.outStart < to)
    .map((o) => ({ ...o, file: resolve(mdir, o.file), t: snap(o.outStart - from), sfx: (o.sfx ?? []).map((s) => ({ ...s, file: resolve(mdir, s.file) })) }))
    .sort((a, b) => a.t - b.t);
  const freezes: Freeze[] = overlays.filter((o) => (o.freezeSec ?? 0) > 0).map((o) => ({ at: o.t, sec: snap(o.freezeSec!) }));
  const F = freezes.reduce((a, f) => a + f.sec, 0);
  const fin = (t: number) => toFinal(t, C, freezes); // window time -> final time

  // "center" overlays: the hosts move aside for that window (window time, before freezes).
  c.center = [...(c.center ?? []), ...overlays.filter((o) => o.placement === "center").map((o) => ({ from: o.outStart, to: o.outStart + o.dur }))];
  // UI layers for the show (same as layout.ts).
  const uiPngs = await prepareUi(c, work);

  const hosts = Object.values(c.place).filter((p) => p.label && !p.small)
    .map((p) => `<b>${esc(p.label!)}</b>${p.sub ? ` (${esc(p.sub)})` : ""}`).join(" &nbsp;&middot;&nbsp; ");
  const mark = `<div class="mark">${esc(c.show ?? "PostgresFM").replace(/FM$/, "<i>FM</i>")}</div>`;
  // cardTitle: the title with explicit line breaks ("\n") for the cards.
  const title = `<div class="bar"></div><div class="title">${esc(c.cardTitle ?? c.title ?? "").replace(/\n/g, "<br>")}</div>`;
  const links = (c.links ?? ["postgres.fm", "postgres.ai"]).map((l) => `<span>${esc(l)}</span>`).join(" &nbsp;&middot;&nbsp; ");
  const tc = await card(work, "title", w, h, [
    { top: 330, html: mark, st: 0.2 },
    { top: 430, html: title, st: 0.6 },
    { top: 700, html: `<div class="hosts">${hosts}</div>`, st: 1.1 },
  ]);
  const ec = await card(work, "end", w, h, [
    { top: 300, html: mark, st: 0.3 },
    { top: 400, html: title, st: 0.6 },
    { top: 680, html: `<div class="hosts">${hosts}</div>`, st: 1.0 },
    { top: 770, html: `<div class="links">${links}</div>`, st: 1.4 },
  ]);
  const logo = c.logo ? resolve(base, c.logo) : null;
  const logoLen = logo ? await duration(logo) : 0;
  const cr = c.credit;
  const crc = cr ? await card(work, "credit", w, h, [
    ...(cr.kicker ? [{ top: 250, html: `<div class="kicker">${esc(cr.kicker)}</div>`, st: 0.2 }] : []),
    { top: 320, html: `<div class="big">${esc(cr.big)}</div>`, st: 0.4 },
    ...(cr.lead ? [{ top: 470, html: `<div class="lead">${esc(cr.lead)}</div>`, st: 0.7 }] : []),
    { top: 800, html: `<div class="links">${(c.links ?? ["postgres.fm", "postgres.ai"]).map((l) => `<span>${esc(l)}</span>`).join(" &nbsp;&middot;&nbsp; ")}</div>`, st: 1.1 },
  ], true) : null;
  const crLen = cr?.sec ?? 7;

  const showLen = to - from;
  const withOutro = !!outro && to >= full - 0.01;
  const showEndFinal = C + showLen + F; // final time where the show (with freezes) ends
  // After the show: end card, then the logo video, then the credit card, each joined by an
  // X2 crossfade. Starts of each part in final time. --end 0: no end card; the show
  // crossfades straight into the logo video (or the credit card, or just ends).
  const endStart = showEndFinal - X2, logoStart = E > 0 ? endStart + E - X2 : endStart, creditStart = logoStart + (logo ? logoLen - X2 : 0);
  const total = withOutro ? (cr ? creditStart + crLen : logo ? logoStart + logoLen : E > 0 ? endStart + E : showEndFinal) : showEndFinal;

  // Inputs: 0 show, 1.. the layout.ts layers, then cards, music, overlays, SFX.
  const inputs: string[][] = [[...(from ? ["-ss", from.toFixed(3)] : []), ...(to < full ? ["-t", showLen.toFixed(3)] : []), "-i", input], ...uiPngs.map((p) => ["-loop", "1", "-framerate", String(fps), "-i", p])];
  const add = (a: string[]) => inputs.push(a) - 1;
  const still = (png: string, len: number) => add(["-loop", "1", "-framerate", String(fps), "-t", String(len), "-i", png]);

  const g: string[] = []; // video graph
  const ga: string[] = []; // audio graph (also run alone for the loudness pass)
  const lay = filtergraph(c, tiles, segments, from);
  g.push(lay.graph.replace(/\[0:v\]split/, "[0:v]setpts=PTS-STARTPTS,split"));
  // Freezes: hold one frame; loops are applied last-first so frame numbers stay those of the input.
  const loops = [...freezes].reverse().map((f) => `loop=loop=${Math.round(f.sec * fps)}:size=1:start=${Math.round(f.at * fps)}`);
  g.push(`[${lay.out}]format=yuv420p,setsar=1,fps=${fps}${loops.length ? `,${loops.join(",")},setpts=N/(${fps}*TB)` : ""},settb=1/${fps}[show]`);
  // Card: background + layers sliding up while fading in (ease-out).
  const buildCard = (name: string, cd: { bg: string; layers: Layer[] }, len: number) => {
    let cur = `${name}bg`;
    g.push(`[${still(cd.bg, len)}:v]format=yuv420p,setsar=1[${cur}]`);
    cd.layers.forEach((l, i) => {
      const li = still(l.png, len);
      const p = `min(1,max(0,(t-${l.st})/${l.d}))`;
      g.push(`[${li}:v]format=rgba,fade=in:st=${l.st}:d=${l.d}:alpha=1[${name}l${i}]`);
      g.push(`[${cur}][${name}l${i}]overlay=x=0:y='${l.dy}*pow(1-${p},3)':shortest=1[${name}c${i}]`);
      cur = `${name}c${i}`;
    });
    g.push(`[${cur}]format=yuv420p,setsar=1,fps=${fps},settb=1/${fps}[${name}]`);
  };
  let vout = "show";
  if (C > 0) {
    buildCard("tcard", tc, C + X1);
    g.push(`[tcard][show]xfade=transition=fade:duration=${X1}:offset=${C}[v1]`);
    vout = "v1";
  }
  if (withOutro) {
    if (E > 0) {
      buildCard("ecard", ec, E);
      g.push(`[${vout}][ecard]xfade=transition=fade:duration=${X2}:offset=${endStart.toFixed(3)}[v2]`);
      vout = "v2";
    }
    if (logo) {
      g.push(`[${add(["-i", logo])}:v]format=yuv420p,setsar=1,fps=${fps},settb=1/${fps}[logo]`);
      g.push(`[${vout}][logo]xfade=transition=fade:duration=${X2}:offset=${logoStart.toFixed(3)}[v3]`);
      vout = "v3";
    }
    if (crc) {
      buildCard("ccard", crc, crLen);
      g.push(`[${vout}][ccard]xfade=transition=fade:duration=${X2}:offset=${creditStart.toFixed(3)}[v4]`);
      vout = "v4";
    }
  }
  // Overlays: full-frame alpha video at 0,0 from their final start time.
  for (const [i, o] of overlays.entries()) {
    // -itsoffset puts the overlay at its start time in the demuxer, so ffmpeg reads it only then.
    // With setpts in the graph instead, all ProRes inputs decoded from t=0 and queued frames for
    // the whole show; ffmpeg 8.0.1 slowed to a crawl and deadlocked (sch_wait) twice (2026-10-29).
    const T = fin(o.t);
    const k = add(["-itsoffset", T.toFixed(3), "-i", o.file]);
    const dur = await duration(o.file);
    g.push(`[${k}:v]setpts=PTS,format=yuva420p[ov${i}]`);
    g.push(`[${vout}][ov${i}]overlay=0:0:eof_action=pass:enable='between(t,${T.toFixed(3)},${(T + dur).toFixed(3)})'[vo${i}]`);
    vout = `vo${i}`;
  }

  // Fade from black at the start (full episode only) and to black at the end.
  const vf = [...(C > 0 ? [`fade=t=in:st=0:d=${FADE_IN}`] : []), ...(withOutro ? [`fade=t=out:st=${(total - FADE_OUT).toFixed(3)}:d=${FADE_OUT}`] : [])];
  if (vf.length) {
    g.push(`[${vout}]${vf.join(",")}[vfade]`);
    vout = "vfade";
  }

  const db = (expr: string) => `volume='pow(10,(${expr})/20)':eval=frame`;
  // Talk audio: cut at each freeze; the freeze is clean silence with fades in quiet frames (freeze-audio.ts).
  ga.push(...(await talkChain(input, from, freezes, showLen)));
  ga.push(`[talk]asetpts=PTS-STARTPTS,adelay=${Math.round(C * 1000)}:all=1,apad=whole_dur=${total.toFixed(3)}[voice]`);
  const mix = ["[voice]"];
  if (intro && C > 0) {
    const gi = MUSIC_LUFS - (await lufs(intro));
    const ii = add(["-i", intro]);
    const introLen = await duration(intro);
    const duckAt = C + 0.1; // the edit keeps 0.3 s of room tone before the first word
    // A hard duck and a short fade near the end of the cue can sound abrupt: --duck-ramp S eases
    // the duck in over S s (default 0.5, the old hard duck); --intro-fade S fades the bed out over
    // S s from card + 1 s with a quarter-sine curve (default: the old 1-3 s fade near the cue end).
    const DUCK_RAMP = Number(flag("--duck-ramp") ?? 0.5);
    const IF = flag("--intro-fade");
    const fadeSt = IF ? C + 1 : Math.min(introLen - 1, C + 2);
    const fadeD = IF ? Math.min(Number(IF), introLen - C - 1) : Math.max(1, introLen - C - 3);
    ga.push(`[${ii}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${gi.toFixed(2)}dB,${db(`if(lt(t,${duckAt}),0,${DUCK}*min(1,(t-${duckAt})/${DUCK_RAMP}))`)},afade=t=out:st=${fadeSt}:d=${fadeD.toFixed(2)}${IF ? ":curve=qsin" : ""}[mi]`);
    mix.push("[mi]");
  }
  if (withOutro) {
    const go = MUSIC_LUFS - (await lufs(outro!));
    const oi = add(["-i", outro!]);
    const outroLen = await duration(outro!);
    const signOff = showEndFinal - 1.0; // sign-off ends about 1 s before the show (room tone tail)
    // Line the bed's natural ending up with the end of the end card; skip its head if long.
    const start = Math.max(total - outroLen, showEndFinal - BED_LEAD);
    const skip = Math.max(0, start - (total - outroLen));
    const rel = (t: number) => (t - start).toFixed(3);
    ga.push(`[${oi}:a]atrim=start=${skip.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume=${go.toFixed(2)}dB,${db(`if(lt(t,${rel(signOff)}),${DUCK},${DUCK}*max(0,1-(t-${rel(signOff)})/1.2))`)},afade=t=in:d=1.5,adelay=${Math.round(start * 1000)}:all=1[mo]`);
    mix.push("[mo]");
  }
  // SFX: each sound's loudest 400 ms is set to SFX_M LUFS plus a per-sound offset by file
  // name (--sfx-rel, default pop 0, tick -3, whoosh -6 dB), so SFX sit under the voice.
  // Placed at final time.
  const sfxRel = Object.fromEntries((flag("--sfx-rel") ?? "pop=0,tick=-3,whoosh=-6").split(",").map((kv) => kv.split("=")).map(([k, v]) => [k, Number(v)]));
  let si = 0;
  for (const o of overlays)
    for (const s of o.sfx) {
      // Noise-burst SFX (air, wind) sound like breathing into the mic: off unless --sfx-off says otherwise.
      if (sfxOff(s.file.split("/").pop()!.replace(/\.[^.]+$/, ""), (flag("--sfx-off") ?? "air,wind").split(","))) continue;
      const k = add(["-i", s.file]);
      const mm = await momentaryMax(s.file);
      const name = s.file.split("/").pop()!.replace(/\.[^.]+$/, "");
      const want = SFX_M + (sfxRel[name] ?? 0);
      const gain = want - mm;
      ga.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${gain.toFixed(2)}dB,adelay=${Math.round((fin(o.t) + s.at) * 1000)}:all=1[sfx${si}]`);
      mix.push(`[sfx${si++}]`);
    }
  // amix starts at the latest first timestamp of its inputs (an mp3 or a delayed SFX may not
  // start at 0), which dropped the first 4 s once: number every input from sample 0.
  for (let i = 0; i < ga.length; i++) {
    const m = ga[i].match(/\[(\w+)\]$/);
    if (m && mix.includes(`[${m[1]}]`)) ga[i] = ga[i].replace(/\[(\w+)\]$/, ",asetpts=N/SR/TB[$1]");
  }
  ga.push(`${mix.join("")}amix=inputs=${mix.length}:normalize=0:duration=first,atrim=end=${total.toFixed(3)},asetpts=N/SR/TB${C > 0 ? `,afade=t=in:d=${FADE_IN / 2}` : ""}${withOutro ? `,afade=t=out:st=${(total - FADE_OUT).toFixed(3)}:d=${FADE_OUT}` : ""},aresample=192000,alimiter=limit=0.70:level=false:attack=1:release=50,aresample=48000[mix]`);
  // The pre-limit keeps true peaks low enough for loudnorm's linear mode: its dynamic mode
  // (used when peaks are too high) lost the first seconds of the mix in a full-length run.

  // Pass 1: loudness of the mix (audio only, so the video chain is not decoded).
  const flat = inputs.flat();
  await Bun.write(join(work, "inputs.json"), JSON.stringify(flat)); // to re-run a graph by hand
  await Bun.write(join(work, "audio.txt"), `${ga.join(";\n")};\n[mix]loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json[out]`);
  const p1 = await $`ffmpeg -hide_banner -nostats ${flat} -filter_complex_script ${join(work, "audio.txt")} -map [out] -f null -`.nothrow().quiet();
  const js = p1.stderr.toString().match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!js) throw new Error(`loudnorm pass 1 failed:\n${p1.stderr.toString().slice(-2000)}`);
  const m = JSON.parse(js[0]);
  ga.push(`[mix]loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=192000,alimiter=limit=0.75:level=false:attack=1:release=50,aresample=48000,asetpts=N/SR/TB[aout]`);
  const graphFile = join(work, "graph.txt");
  await Bun.write(graphFile, [...g, ...ga].join(";\n"));
  // Time map for chapters and later layers: edited time -> final time.
  await Bun.write(output.replace(/\.mp4$/, "") + ".time-map.json", JSON.stringify({
    formula: "final = card + (edited - from) + sum(freeze.sec for freezes with at < edited - from)",
    card: C, from, total: Number(total.toFixed(3)), showEnd: Number(showEndFinal.toFixed(3)), endCard: withOutro && E > 0 ? { start: Number(endStart.toFixed(3)), sec: E } : null,
    logo: withOutro && logo ? { start: Number(logoStart.toFixed(3)), sec: logoLen } : null,
    credit: withOutro && cr ? { start: Number(creditStart.toFixed(3)), sec: crLen } : null,
    freezes: freezes.map((f) => ({ edited: Number((f.at + from).toFixed(3)), sec: f.sec, finalStart: Number(fin(f.at).toFixed(3)) })),
  }, null, 2));
  // The limiter runs at 4x rate so AAC true peaks stay under -1.5 dBTP.
  if (args.includes("--audio-only")) {
    // Re-make only the sound of an existing render (same inputs and timing), then remux.
    const m4a = join(work, "audio.m4a"), tmp = output.replace(/\.mp4$/, ".remux.mp4");
    await Bun.write(join(work, "audio2.txt"), ga.join(";\n"));
    await $`ffmpeg -y -v error ${flat} -filter_complex_script ${join(work, "audio2.txt")} -map [aout] -t ${total.toFixed(3)} -c:a aac -b:a 192k ${m4a}`;
    await $`ffmpeg -y -v error -i ${output} -i ${m4a} -map 0:v -map 1:a -c copy -movflags +faststart ${tmp}`;
    await $`mv ${tmp} ${output}`;
    console.log(`remuxed new audio into ${output}`);
    process.exit(0);
  }
  await $`ffmpeg -y -v error ${flat} -filter_complex_script ${graphFile} -map [${vout}] -map [aout] -t ${total.toFixed(3)} -c:v libx264 -preset ${flag("--preset") ?? "medium"} -crf 19 -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -movflags +faststart ${output}`;
  console.log(`wrote ${output} (${total.toFixed(2)} s; ${freezes.length} freezes, ${overlays.length} overlays, ${si} sfx)`);
}
