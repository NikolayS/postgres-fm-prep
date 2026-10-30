// Applies the overlay sound convention (sfx/README.md) to an overlay manifest.
//
//   bun sfx-manifest.ts <manifest.json> [--out manifest-sfx.json] [--accent <id>=<s>[,<s>...]]...
//                       [--accent-sound L|K] [--keep thud]
//
// Band cards: if <card>-typing.mov and its typing bursts (<card>-typing-bursts.json, or
// <id>-typing-bursts.json, or <NN>-typing-bursts.json for an id "NN-...") are next to the
// manifest, the card switches to the typing render and gets one typing sound per typed line,
// from the line's first keystroke, trimmed to the line's typing time. Without them it keeps its
// file. Center cards: IN (G10) at 0.05 s, OUT (G9, gain 0.7) 0.1 s before the exit starts, the
// exit measured from the overlay's alpha (the first frame of the final drop); accents (L, or K
// with --accent-sound K) at the times given by the overlay's "accents" field or --accent (an id
// or an id prefix, seconds from the overlay start). "full" cards are left as they are.
// Old sounds on band and center cards are dropped except names starting with --keep (default
// "thud"); a kept sound within 0.5 s of an accent is dropped (the accent replaces it).
// Sounds are copied into <manifest dir>/sfx/ under role names (center-in, center-out, accent,
// typing-<ms>ms), so `compose.ts --sfx-rel center-out=-3` sets the OUT level by name.
import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { basename, dirname, join, resolve } from "path";
import { parseArgs } from "util";

export const LIB = join(import.meta.dir, "sfx");
export const IN_AT = 0.05, OUT_BEFORE = 0.1, OUT_GAIN = 0.7, ACCENT_NEAR = 0.5, TYPING_TAIL = 0.08;
const ACCENT_FILES: Record<string, string> = { L: "L-punch-rough.wav", K: "K-sand-stroke-falling.wav" };

export type Sfx = { file: string; at: number; gain?: number };
export type Overlay = { id: string; file: string; placement?: "band" | "full" | "center"; dur: number; sfx?: Sfx[]; accents?: number[]; [k: string]: unknown };
export type Burst = { start: number; end: number; line?: string | number };
export type Line = { at: number; dur: number };

const r3 = (x: number) => Math.round(x * 1000) / 1000;

// One span per typed line, in order of the line's first burst.
export function typedLines(bursts: Burst[]): Line[] {
  const lines = new Map<string, Burst[]>();
  for (const b of bursts) {
    const k = String(b.line ?? 0);
    lines.set(k, [...(lines.get(k) ?? []), b]);
  }
  return [...lines.values()].map((v) => {
    const at = Math.min(...v.map((b) => b.start));
    return { at: r3(at), dur: r3(Math.max(...v.map((b) => b.end)) - at) };
  });
}

// Exit start from per-frame mean alpha (frame i at t0 + i / fps): the first frame of the final
// drop below 99% of the held level. No drop at the end: the overlay's end.
export function exitFrom(alpha: number[], fps: number, t0: number): number {
  const ref = Math.max(...alpha);
  let k = alpha.length - 1;
  while (k >= 0 && alpha[k] < 0.99 * ref) k--;
  return r3(t0 + (k + 1) / fps);
}

export const typingName = (dur: number) => `typing-${Math.round(dur * 1000)}ms.wav`;

// The new file and sounds of one overlay. typed: the typing render's file name (if it and the
// bursts exist); exit: measured exit start (center cards).
export function plan(o: Overlay, x: { typed?: string; bursts?: Burst[]; exit?: number; accents?: number[]; keep?: string[] }): { file: string; sfx: Sfx[] } {
  const keep = x.keep ?? ["thud"], accents = x.accents ?? o.accents ?? [];
  const name = (s: Sfx) => basename(s.file).replace(/\.[^.]+$/, "");
  const kept = (o.sfx ?? []).filter((s) => keep.some((p) => p && name(s).startsWith(p)) && !accents.some((a) => Math.abs(s.at - a) < ACCENT_NEAR));
  if (o.placement === "band") {
    if (!x.typed || !x.bursts) return { file: o.file, sfx: kept };
    return { file: x.typed, sfx: [...kept, ...typedLines(x.bursts).map((l) => ({ file: `sfx/${typingName(l.dur)}`, at: l.at, gain: 1 }))] };
  }
  if (o.placement === "center") {
    const exit = x.exit ?? o.dur;
    return {
      file: o.file,
      sfx: [
        { file: "sfx/center-in.wav", at: IN_AT, gain: 1 },
        ...kept,
        ...accents.map((a) => ({ file: "sfx/accent.wav", at: a, gain: 1 })),
        { file: "sfx/center-out.wav", at: r3(Math.max(IN_AT, exit - OUT_BEFORE)), gain: OUT_GAIN },
      ],
    };
  }
  return { file: o.file, sfx: o.sfx ?? [] };
}

// Mean alpha per frame over the last `win` s of an overlay, and its exit start.
export async function measureExit(file: string, win = 4): Promise<number> {
  const p = (await $`ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate:format=duration -of json ${file}`.json()) as { streams: { r_frame_rate: string }[]; format: { duration: string } };
  const [a, b] = p.streams[0].r_frame_rate.split("/").map(Number);
  const fps = a / (b || 1), D = Number(p.format.duration);
  // Start on a frame boundary so frame i is at t0 + i / fps (ProRes is intra-only: exact seek).
  const t0 = Math.max(0, Math.floor((D - win) * fps) / fps);
  const W = 64, H = 36;
  const raw = new Uint8Array(await $`ffmpeg -v error -ss ${t0.toFixed(4)} -i ${file} -vf alphaextract,scale=${W}:${H}:flags=area,format=gray -f rawvideo -`.arrayBuffer());
  const alpha: number[] = [];
  for (let i = 0; (i + 1) * W * H <= raw.length; i++) {
    let s = 0;
    for (let j = i * W * H; j < (i + 1) * W * H; j++) s += raw[j];
    alpha.push(s / (W * H));
  }
  return exitFrom(alpha, fps, t0);
}

// The typing sound cut to one line: dur plus a short tail, faded out.
export async function trimTyping(src: string, dur: number, out: string) {
  await $`ffmpeg -y -v error -i ${src} -t ${(dur + TYPING_TAIL).toFixed(3)} -af afade=t=out:st=${Math.max(0, dur - 0.04).toFixed(3)}:d=${(TYPING_TAIL + 0.04).toFixed(3)} -c:a pcm_s16le ${out}`;
}

function findBursts(mdir: string, o: Overlay, base: string): Burst[] | undefined {
  for (const n of [`${base}-typing-bursts.json`, `${o.id}-typing-bursts.json`, `${o.id.split("-")[0]}-typing-bursts.json`]) {
    const p = join(mdir, n);
    if (existsSync(p)) {
      const j = JSON.parse(readFileSync(p, "utf8"));
      return Array.isArray(j) ? j : j.bursts;
    }
  }
  return undefined;
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    allowPositionals: true,
    options: { out: { type: "string" }, accent: { type: "string", multiple: true }, "accent-sound": { type: "string", default: "L" }, keep: { type: "string", default: "thud" } },
  });
  const [manifestPath] = positionals;
  if (!manifestPath) { console.error("usage: see the header of sfx-manifest.ts"); process.exit(2); }
  const mdir = dirname(resolve(manifestPath));
  const out = values.out ?? manifestPath.replace(/\.json$/, "") + "-sfx.json";
  if (resolve(out) === resolve(manifestPath)) { console.error("--out must differ from the input manifest"); process.exit(2); }
  const accentFile = ACCENT_FILES[values["accent-sound"]!];
  if (!accentFile) { console.error(`--accent-sound: L or K`); process.exit(2); }
  const flagAccents = (values.accent ?? []).map((a) => a.split("=")).map(([k, v]) => ({ k, at: v.split(",").map(Number) }));
  const keep = values.keep!.split(",");

  const m = await Bun.file(manifestPath).json();
  const sd = join(mdir, "sfx");
  mkdirSync(sd, { recursive: true });
  const copy = (src: string, dst: string) => $`cp ${join(LIB, src)} ${join(sd, dst)}`;
  await copy("G10-soft-start-quick-stop.wav", "center-in.wav");
  await copy("G9-wider-band.wav", "center-out.wav");
  await copy(accentFile, "accent.wav");
  const missing: string[] = [];
  for (const o of m.overlays as Overlay[]) {
    const fa = flagAccents.filter((a) => o.id.startsWith(a.k)).flatMap((a) => a.at);
    const accents = fa.length ? fa : o.accents ?? [];
    // A re-run starts from the plain card name, so the result is the same.
    const base = o.file.replace(/(-typing)?\.mov$/, ""), typedFile = `${base}-typing.mov`;
    const bursts = o.placement === "band" && existsSync(join(mdir, typedFile)) ? findBursts(mdir, o, base) : undefined;
    if (o.placement === "band" && !bursts) missing.push(o.id);
    const exit = o.placement === "center" ? await measureExit(join(mdir, o.file)) : undefined;
    const p = plan(o, { typed: bursts ? typedFile : undefined, bursts, exit, accents, keep });
    for (const l of bursts ? typedLines(bursts) : []) {
      const f = join(sd, typingName(l.dur));
      if (!existsSync(f)) await trimTyping(join(LIB, "U2-typing-fast.wav"), l.dur, f);
    }
    o.file = p.file;
    o.sfx = p.sfx;
    console.log(`${o.id} ${o.placement} ${o.file}${exit !== undefined ? ` exit ${exit}` : ""}: ${p.sfx.map((s) => `${basename(s.file)}@${s.at}`).join(" ")}`);
  }
  await Bun.write(out, JSON.stringify(m, null, 2) + "\n");
  if (missing.length) console.log(`band cards without a typing render and bursts (kept as they are): ${missing.join(", ")}`);
  console.log(`wrote ${out}; render with compose.ts --overlays ${out} --sfx-rel center-out=-3`);
}
