// Final episode: title card + laid-out show + end card, with intro/outro music.
//
//   bun compose.ts <layout.json> <edited.mp4> <out.mp4> --intro intro.mp3 --outro outro.mp3
//                  [--until S | --tail S] [--preset fast] [--card 4] [--end 10] [--duck -15]
//
// Picture: title card (C s, layers fade/slide in) -> 0.5 s crossfade -> the show with the
// layout.ts filtergraph -> 0.6 s crossfade -> end card (E s). One encode.
// Sound: the intro is played at full level over the card, ducks by --duck dB just before
// the first words and fades out by C + 6 s. The outro bed enters ducked 10 s before the
// show ends, rises after the sign-off and ends with the end card. Music cues are first
// set to -18 LUFS; the final mix is two-pass loudnorm to -16 LUFS, -1.5 dBTP.
// --until S keeps only the first S s of the show (intro demo; no outro). --tail S keeps
// only the last S s (outro demo; no title card, no intro). --from S starts later (no card).
// --overlays manifest.json: full-frame alpha overlays at their final time; an overlay with
// freezeSec holds the picture and pauses the talk for that long while its SFX play.
import { $ } from "bun";
import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { chromeHtml, filtergraph, highlightHtml, renderHtml, type LayoutConfig } from "./layout";
import type { Detection } from "./detect-tiles";

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
function bgHtml(w: number, h: number) {
  return `<!doctype html><html><head><style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}</style></head><body>
<svg width="${w}" height="${h}"><defs>
<radialGradient id="g" cx="18%" cy="0%" r="110%"><stop offset="0" stop-color="#16263F"/><stop offset="0.55" stop-color="#0D1625"/><stop offset="1" stop-color="#0A0F1A"/></radialGradient>
<pattern id="d" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.045)"/></pattern></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#d)"/></svg></body></html>`;
}

// One transparent layer: a block of text at (left, top).
function layerHtml(w: number, h: number, top: number, inner: string) {
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

async function card(work: string, name: string, w: number, h: number, parts: { top: number; html: string; st: number }[]): Promise<{ bg: string; layers: Layer[] }> {
  const bg = join(work, `${name}-bg.png`);
  await renderHtml(bgHtml(w, h), w, h, bg);
  const layers: Layer[] = [];
  for (const [i, p] of parts.entries()) {
    const png = join(work, `${name}-l${i}.png`);
    await renderHtml(layerHtml(w, h, p.top, p.html), w, h, png);
    layers.push({ png, st: p.st, d: 0.7, dy: 24 });
  }
  return { bg, layers };
}

// Overlay manifest (from the overlay agent): times are edited.mp4 seconds.
type Sfx = { file: string; at: number; gain?: number }; // gain is ignored: see --sfx-rel
type Overlay = { file: string; outStart: number; dur: number; placement?: "band" | "full"; freezeSec?: number; sfx?: Sfx[] };
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

// Quietest RT s of the talk within +-10 s of t (window seconds), as a room-tone source.
const RT = 0.4; // room-tone source length (s)
async function roomTone(input: string, from: number, t: number, showLen: number): Promise<number> {
  const a = Math.max(0, t - 10), b = Math.min(showLen, t + 10), rate = 16000;
  const pcm = new Float32Array(await $`ffmpeg -v error -ss ${(from + a).toFixed(3)} -t ${(b - a).toFixed(3)} -i ${input} -vn -ac 1 -ar ${rate} -f f32le -`.arrayBuffer());
  const win = Math.round(rate * RT), hop = rate / 50;
  let best = a, bestE = Infinity;
  for (let i = 0; i + win <= pcm.length; i += hop) {
    let e = 0;
    for (let j = i; j < i + win; j++) e += pcm[j] * pcm[j];
    if (e > 1e-9 && e < bestE) (bestE = e), (best = a + i / rate); // skip digital zero
  }
  return best;
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
  const C = from > 0 ? 0 : Number(flag("--card") ?? 4), E = Number(flag("--end") ?? 10), DUCK = Number(flag("--duck") ?? -15);
  const X1 = 0.5, X2 = 0.6, MUSIC_LUFS = -18, SFX_M = Number(flag("--sfx-lufs") ?? -20);

  const c: LayoutConfig & { links?: string[]; cardTitle?: string } = await Bun.file(configPath).json();
  const base = dirname(resolve(configPath));
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

  // UI layers for the show (same as layout.ts).
  const uiPng = join(work, "ui.png");
  await renderHtml(chromeHtml(c), w, h, uiPng);
  const hlPngs: string[] = [];
  for (const [i, hl] of (c.highlight ?? []).entries()) {
    const png = join(work, `hl${i}.png`);
    await renderHtml(highlightHtml(c, c.place[hl.tile]), w, h, png);
    hlPngs.push(png);
  }

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

  const showLen = to - from;
  const withOutro = !!outro && to >= full - 0.01;
  const showEndFinal = C + showLen + F; // final time where the show (with freezes) ends
  const total = withOutro ? showEndFinal - X2 + E : showEndFinal;

  // Inputs: 0 show, 1 ui, 2.. highlights (fixed by layout.ts), then cards, music, overlays, SFX.
  const inputs: string[][] = [[...(from ? ["-ss", from.toFixed(3)] : []), ...(to < full ? ["-t", showLen.toFixed(3)] : []), "-i", input], ["-loop", "1", "-framerate", String(fps), "-i", uiPng], ...hlPngs.map((p) => ["-loop", "1", "-framerate", String(fps), "-i", p])];
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
    buildCard("ecard", ec, E);
    g.push(`[${vout}][ecard]xfade=transition=fade:duration=${X2}:offset=${(showEndFinal - X2).toFixed(3)}[v2]`);
    vout = "v2";
  }
  // Overlays: full-frame alpha video at 0,0 from their final start time.
  for (const [i, o] of overlays.entries()) {
    const k = add(["-i", o.file]);
    const T = fin(o.t);
    const dur = await duration(o.file);
    g.push(`[${k}:v]setpts=PTS-STARTPTS+${T.toFixed(3)}/TB,format=yuva420p[ov${i}]`);
    g.push(`[${vout}][ov${i}]overlay=0:0:eof_action=pass:enable='between(t,${T.toFixed(3)},${(T + dur).toFixed(3)})'[vo${i}]`);
    vout = `vo${i}`;
  }

  const db = (expr: string) => `volume='pow(10,(${expr})/20)':eval=frame`;
  // Talk audio: cut at each freeze and fill the freeze with room tone: the quietest
  // RT s nearby, played forward then reversed (a seamless loop), joined with 40 ms crossfades.
  const XF = 0.04;
  if (freezes.length) {
    const n = freezes.length + 1;
    ga.push(`[0:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,asplit=${n + freezes.length}${Array.from({ length: n + freezes.length }, (_, i) => `[ta${i}]`).join("")}`);
    let cur = "";
    for (let i = 0; i < n; i++) {
      const a = i === 0 ? 0 : freezes[i - 1].at, b = i < freezes.length ? freezes[i].at : showLen;
      // Each crossfade eats XF s, so talk pieces keep XF on the joined sides.
      const a2 = i === 0 ? a : a - XF / 2, b2 = i < freezes.length ? b + XF / 2 : b;
      ga.push(`[ta${i}]atrim=start=${Math.max(0, a2).toFixed(4)}:end=${b2.toFixed(4)},asetpts=PTS-STARTPTS[tp${i}]`);
      if (i === 0) cur = "tp0";
      else {
        ga.push(`[${cur}][tp${i}]acrossfade=d=${XF}:c1=qsin:c2=qsin[tj${i}]`);
        cur = `tj${i}`;
      }
      if (i < freezes.length) {
        const q = await roomTone(input, from, freezes[i].at, showLen);
        const len = freezes[i].sec + XF; // plus half a crossfade per side
        ga.push(`[ta${n + i}]atrim=start=${q.toFixed(3)}:end=${(q + RT).toFixed(3)},asetpts=PTS-STARTPTS,asplit[rf${i}][rr${i}]`);
        ga.push(`[rr${i}]areverse[rv${i}]`);
        ga.push(`[rf${i}][rv${i}]concat=n=2:v=0:a=1,aloop=loop=-1:size=${Math.round(2 * RT * 48000)},atrim=end=${len.toFixed(4)},asetpts=PTS-STARTPTS[rt${i}]`);
        ga.push(`[${cur}][rt${i}]acrossfade=d=${XF}:c1=qsin:c2=qsin[tr${i}]`);
        cur = `tr${i}`;
      }
    }
    ga.push(`[${cur}]anull[talk]`);
  } else ga.push(`[0:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[talk]`);
  ga.push(`[talk]adelay=${Math.round(C * 1000)}:all=1,apad=whole_dur=${total.toFixed(3)}[voice]`);
  const mix = ["[voice]"];
  if (intro && C > 0) {
    const gi = MUSIC_LUFS - (await lufs(intro));
    const ii = add(["-i", intro]);
    const introLen = await duration(intro);
    const duckAt = C + 0.1; // the edit keeps 0.3 s of room tone before the first word
    ga.push(`[${ii}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${gi.toFixed(2)}dB,${db(`if(lt(t,${duckAt}),0,${DUCK}*min(1,(t-${duckAt})/0.5))`)},afade=t=out:st=${Math.min(introLen - 1, C + 1.5)}:d=${Math.min(4.5, introLen - C - 1.5)}[mi]`);
    mix.push("[mi]");
  }
  if (withOutro) {
    const go = MUSIC_LUFS - (await lufs(outro!));
    const oi = add(["-i", outro!]);
    const outroLen = await duration(outro!);
    const signOff = showEndFinal - 1.0; // sign-off ends about 1 s before the show (room tone tail)
    // Line the bed's natural ending up with the end of the end card; skip its head if long.
    const start = Math.max(total - outroLen, showEndFinal - 10);
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
      const k = add(["-i", s.file]);
      const mm = await momentaryMax(s.file);
      const name = s.file.split("/").pop()!.replace(/\.[^.]+$/, "");
      const want = SFX_M + (sfxRel[name] ?? 0);
      const gain = want - mm;
      ga.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${gain.toFixed(2)}dB,adelay=${Math.round((fin(o.t) + s.at) * 1000)}:all=1[sfx${si}]`);
      mix.push(`[sfx${si++}]`);
    }
  ga.push(`${mix.join("")}amix=inputs=${mix.length}:normalize=0:duration=first,atrim=end=${total.toFixed(3)}[mix]`);

  // Pass 1: loudness of the mix (audio only, so the video chain is not decoded).
  const flat = inputs.flat();
  await Bun.write(join(work, "audio.txt"), `${ga.join(";\n")};\n[mix]loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json[out]`);
  const p1 = await $`ffmpeg -hide_banner -nostats ${flat} -filter_complex_script ${join(work, "audio.txt")} -map [out] -f null -`.nothrow().quiet();
  const js = p1.stderr.toString().match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!js) throw new Error(`loudnorm pass 1 failed:\n${p1.stderr.toString().slice(-2000)}`);
  const m = JSON.parse(js[0]);
  ga.push(`[mix]loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000,alimiter=limit=0.79:level=false:attack=1:release=50[aout]`);
  const graphFile = join(work, "graph.txt");
  await Bun.write(graphFile, [...g, ...ga].join(";\n"));
  // Time map for chapters and later layers: edited time -> final time.
  await Bun.write(output.replace(/\.mp4$/, "") + ".time-map.json", JSON.stringify({
    formula: "final = card + (edited - from) + sum(freeze.sec for freezes with at < edited - from)",
    card: C, from, total: Number(total.toFixed(3)), showEnd: Number(showEndFinal.toFixed(3)), endCard: withOutro ? { start: Number((showEndFinal - X2).toFixed(3)), sec: E } : null,
    freezes: freezes.map((f) => ({ edited: Number((f.at + from).toFixed(3)), sec: f.sec, finalStart: Number(fin(f.at).toFixed(3)) })),
  }, null, 2));
  await $`ffmpeg -y -v error ${flat} -filter_complex_script ${graphFile} -map [${vout}] -map [aout] -t ${total.toFixed(3)} -c:v libx264 -preset ${flag("--preset") ?? "medium"} -crf 19 -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -movflags +faststart ${output}`;
  console.log(`wrote ${output} (${total.toFixed(2)} s; ${freezes.length} freezes, ${overlays.length} overlays, ${si} sfx)`);
}
