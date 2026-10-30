// Arrange Apple Loops into one cue, sample-exact.
//   bun arrange.ts <arrangement.json> <out.wav>
// Arrangement: { dir, bpm?, beatFrames?, events: [{ file, at, beats, gain?, from?, fadeIn?, fadeOut? }], extra?: [{ wav, atSec, gain? }] }
// - Loops are decoded with ffmpeg, the AAC priming (pakt) is removed, and each loop is
//   trimmed to its exact frame count, so repeats are seamless.
// - at/beats/from/fadeIn/fadeOut are in beats. beatFrames = loop frames / beat count of the
//   first event's file unless set.
// - extra: other mono/stereo 44.1 kHz WAVs (e.g. synthesized FX) placed at seconds.
import { join } from "path";
const SR = 44100;
type Ev = { file: string; at: number; beats: number; gain?: number; from?: number; fadeIn?: number; fadeOut?: number };
type Arr = { dir: string; beatFrames?: number; tailSec?: number; events: Ev[]; extra?: { wav: string; atSec: number; gain?: number }[] };

function caf(buf: Buffer) {
  let o = 8, prime = 0, frames = 0, beats = 0;
  while (o + 12 <= buf.length) {
    const type = buf.toString("latin1", o, o + 4), size = Number(buf.readBigInt64BE(o + 4)), d = o + 12;
    if (type === "pakt") { frames = Number(buf.readBigInt64BE(d + 8)); prime = buf.readInt32BE(d + 16); }
    if (type === "uuid") {
      const parts = buf.toString("utf8", d + 20, d + size).split("\0");
      const i = parts.indexOf("beat count"); if (i >= 0) beats = Number(parts[i + 1]);
    }
    if (size < 0) break; o = d + size;
  }
  return { prime, frames, beats };
}
async function decode(path: string, ch = 2): Promise<Float32Array> {
  const p = Bun.spawn(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", String(ch), "-ar", String(SR), "-"], { stdout: "pipe" });
  const ab = await new Response(p.stdout).arrayBuffer(); await p.exited;
  return new Float32Array(ab);
}
const cache = new Map<string, { pcm: Float32Array; frames: number; beats: number }>();
async function loop(path: string) {
  if (!cache.has(path)) {
    const meta = caf(Buffer.from(await Bun.file(path).arrayBuffer()));
    const all = await decode(path);
    cache.set(path, { pcm: all.subarray(meta.prime * 2, (meta.prime + meta.frames) * 2), frames: meta.frames, beats: meta.beats });
  }
  return cache.get(path)!;
}

const [arrPath, out] = Bun.argv.slice(2);
const a: Arr = await Bun.file(arrPath).json();
const first = await loop(join(a.dir, a.events[0].file));
const bf = a.beatFrames ?? first.frames / first.beats;
const endBeat = Math.max(...a.events.map((e) => e.at + e.beats));
const total = Math.ceil(endBeat * bf + (a.tailSec ?? 2) * SR);
const mix = new Float32Array(total * 2);
for (const e of a.events) {
  const L = await loop(join(a.dir, e.file));
  const g = Math.pow(10, (e.gain ?? 0) / 20), n = Math.round(e.beats * bf), s0 = Math.round(e.at * bf), off = Math.round((e.from ?? 0) * bf);
  const fi = (e.fadeIn ?? 0) * bf, fo = (e.fadeOut ?? 0) * bf;
  for (let i = 0; i < n && s0 + i < total; i++) {
    let w = g;
    if (fi > 0 && i < fi) w *= i / fi;
    if (fo > 0 && i > n - fo) w *= Math.max(0, (n - i) / fo) ** 2;
    const j = (off + i) % L.frames;
    mix[(s0 + i) * 2] += L.pcm[j * 2] * w; mix[(s0 + i) * 2 + 1] += L.pcm[j * 2 + 1] * w;
  }
}
for (const x of a.extra ?? []) {
  const pcm = await decode(x.wav), g = Math.pow(10, (x.gain ?? 0) / 20), s0 = Math.round(x.atSec * SR);
  for (let i = 0; i * 2 < pcm.length && s0 + i < total; i++) { mix[(s0 + i) * 2] += pcm[i * 2] * g; mix[(s0 + i) * 2 + 1] += pcm[i * 2 + 1] * g; }
}
// WAV float32
const hdr = Buffer.alloc(44);
hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + mix.byteLength, 4); hdr.write("WAVE", 8); hdr.write("fmt ", 12);
hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(3, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24);
hdr.writeUInt32LE(SR * 8, 28); hdr.writeUInt16LE(8, 32); hdr.writeUInt16LE(32, 34); hdr.write("data", 36); hdr.writeUInt32LE(mix.byteLength, 40);
await Bun.write(out, Buffer.concat([hdr, Buffer.from(mix.buffer)]));
console.log(`wrote ${out}: ${(total / SR).toFixed(3)} s, beat ${(bf / SR).toFixed(5)} s (${(60 * SR / bf).toFixed(2)} BPM)`);
