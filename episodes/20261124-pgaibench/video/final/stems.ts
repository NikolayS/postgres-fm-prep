// Episode 198: stems for qa.ts "audio" (voices vs music), in final-body time.
//
//   bun stems.ts <final-body.mp4> <edited.mp4> <edited.cuts.json> <src.words.json> <out-dir>
//       [--offset 13] [--speakers speaker_1=nik,speaker_0=kirk]
//
// The body is the title card (--offset s) and then the edited talk, mixed with the music beds
// and overlay sounds, then loudnorm and a limiter. Voices: the edited talk shifted by --offset,
// scaled by the least-squares gain that best matches the body, and kept only inside each
// speaker's word spans (Scribe words, source time mapped through the cuts map, +-0.15 s).
// Music: the body minus that scaled talk. The limiter is not linear, so some talk leaks into the
// residual; that makes the music stem louder than it is, so the check errs on the strict side.
// Output: nik.wav, kirk.wav, music.wav (mono 16 kHz float), plus gain.json.
import { $ } from "bun";
import { parseArgs } from "util";

const { values, positionals } = parseArgs({ args: Bun.argv.slice(2), allowPositionals: true,
  options: { offset: { type: "string", default: "13" }, speakers: { type: "string", default: "speaker_1=nik,speaker_0=kirk" }, gain: { type: "string", default: "" } } });
// --gain: the per-speaker dB that level.ts applied to this mix (e.g. speaker_1=1.6,speaker_0=-1.6), so the
// talk reference matches the mix.
const [body, edited, cutsPath, wordsPath, out] = positionals;
if (!out) { console.error("usage: bun stems.ts <body.mp4> <edited.mp4> <cuts.json> <words.json> <out-dir> [--offset 13]"); process.exit(2); }
const SR = 16000, OFF = Number(values.offset);
const pcm = async (f: string) => { const b = await $`ffmpeg -nostdin -v error -i ${f} -vn -ac 1 -ar ${SR} -c:a pcm_f32le -f f32le pipe:1`.arrayBuffer(); return new Float32Array(b); };
const [B, T0] = await Promise.all([pcm(body), pcm(edited)]);
// The talk sits near --offset, but encoder priming and the card crossfade move it by some ms:
// find the exact lag by cross-correlation over 60 s of talk (search +-0.5 s around --offset).
const lagAt = (lag: number, i0: number, n: number) => { let s = 0; for (let i = i0; i < i0 + n; i++) s += B[i + lag] * T0[i]; return s; };
const base = Math.round(OFF * SR), probe = Math.round(600 * SR), N = 60 * SR;
let best = base, bestV = -Infinity;
for (let l = base - SR / 2; l <= base + SR / 2; l += 4) { const v = lagAt(l, probe, N / 10); if (v > bestV) { bestV = v; best = l; } }
{ let b2 = best, v2 = -Infinity; for (let l = best - 8; l <= best + 8; l++) { const v = lagAt(l, probe, N); if (v > v2) { v2 = v; b2 = l; } } best = b2; }
const T = new Float32Array(B.length); T.set(T0.subarray(0, Math.max(0, B.length - best)), best);
const st: { srcStart: number; srcEnd: number; outStart: number }[] = (await Bun.file(cutsPath).json()).segmentTimes;
const map = (s: number) => { const x = st.find((r) => s >= r.srcStart && s <= r.srcEnd); return x ? x.outStart + s - x.srcStart : null; };
const words: { start: number; end: number; speaker?: string; type?: string }[] = (await Bun.file(wordsPath).json()).words;
const span = (w: { start: number; end: number }) => { const s = map(w.start), e = map(w.end); return s === null || e === null ? null :
  [Math.max(0, Math.round((s + best / SR - 0.15) * SR)), Math.min(B.length, Math.round((e + best / SR + 0.15) * SR))] as const; };
if (values.gain) {
  const gn = Object.fromEntries(values.gain.split(",").map((kv) => kv.split("=")).map(([k, v]) => [k, 10 ** (Number(v) / 20)]));
  const k = new Float32Array(B.length).fill(1), owner = new Int8Array(B.length); const ids = Object.keys(gn);
  for (const w of words) { const j = ids.indexOf(w.speaker ?? ""); if (j < 0 || (w.type && w.type !== "word")) continue; const sp = span(w); if (!sp) continue;
    for (let i = sp[0]; i < sp[1]; i++) owner[i] = owner[i] && owner[i] !== j + 1 ? -1 : j + 1; }
  for (let i = 0; i < B.length; i++) if (owner[i] > 0) T[i] *= gn[ids[owner[i] - 1]];
}
// Least-squares gain over the talk part (after the card, before the outro).
let xy = 0, xx = 0; const a = best + 5 * SR, z = Math.min(B.length, best + T0.length - 5 * SR);
for (let i = a; i < z; i++) { xy += B[i] * T[i]; xx += T[i] * T[i]; }
const g = xy / xx; console.error(`talk lag ${(best / SR).toFixed(4)} s (offset ${OFF})`);
const music = new Float32Array(B.length); for (let i = 0; i < B.length; i++) music[i] = B[i] - g * T[i];
const spk = Object.fromEntries(values.speakers!.split(",").map((kv) => kv.split("=")));
await $`mkdir -p ${out}`;
const write = async (name: string, x: Float32Array) => {
  const raw = `${out}/${name}.f32`; await Bun.write(raw, x.buffer);
  await $`ffmpeg -nostdin -v error -y -f f32le -ar ${SR} -ac 1 -i ${raw} -c:a pcm_f32le ${out}/${name}.wav && rm ${raw}`;
};
for (const [id, name] of Object.entries(spk)) {
  const v = new Float32Array(B.length);
  for (const w of words) {
    if (w.speaker !== id || (w.type && w.type !== "word")) continue;
    const sp = span(w); if (!sp) continue;
    for (let i = sp[0]; i < sp[1]; i++) v[i] = g * T[i];
  }
  await write(name as string, v);
}
await write("music", music);
await Bun.write(`${out}/gain.json`, JSON.stringify({ gain: g, gainDb: 20 * Math.log10(g), offset: best / SR }, null, 1));
console.log(`stems in ${out}: talk gain ${(20 * Math.log10(g)).toFixed(2)} dB`);
