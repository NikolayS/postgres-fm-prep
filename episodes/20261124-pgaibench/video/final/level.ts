// Episode 198: level the two voices in a finished mix (video body or podcast), no re-render.
//
//   bun level.ts <mix.(mp4|wav)> <edited.mp4> <edited.cuts.json> <src.words.json> <out.wav>
//       [--offset 13] [--gain speaker_1=1.6,speaker_0=-1.6] [--sr 48000]
//
// The mix holds the edited talk at about --offset s (title card / intro). The exact lag and the
// talk gain in the mix come from cross-correlation and least squares (as stems.ts). Each speaker's
// word spans (Scribe, source time through the cuts map, +-0.15 s, 40 ms ramps) get
// (10^(dB/20) - 1) x talk added, which sets that voice dB louder; music and SFX stay as they are.
// Output: float WAV at --sr, stereo; peak printed. qa.ts audio: voices within 3 dB.
import { $ } from "bun";
import { parseArgs } from "util";

const { values, positionals } = parseArgs({ args: Bun.argv.slice(2), allowPositionals: true,
  options: { offset: { type: "string", default: "13" }, gain: { type: "string", default: "speaker_1=1.6,speaker_0=-1.6" }, sr: { type: "string", default: "48000" } } });
const [mixPath, edited, cutsPath, wordsPath, out] = positionals;
if (!out) { console.error("usage: bun level.ts <mix> <edited.mp4> <cuts.json> <words.json> <out.wav> [--offset 13] [--gain speaker_1=1.6,speaker_0=-1.6]"); process.exit(2); }
const SR = Number(values.sr), OFF = Number(values.offset);
const pcm = async (f: string) => new Float32Array(await $`ffmpeg -v error -i ${f} -vn -ac 2 -ar ${SR} -c:a pcm_f32le -f f32le pipe:1`.arrayBuffer());
const [M, T] = await Promise.all([pcm(mixPath), pcm(edited)]); // interleaved stereo
const frames = M.length / 2, tf = T.length / 2;
const at = (lag: number, i0: number, n: number, step = 1) => { let s = 0; for (let i = i0; i < i0 + n; i += step) s += (M[2 * (i + lag)] + M[2 * (i + lag) + 1]) * (T[2 * i] + T[2 * i + 1]); return s; };
const base = Math.round(OFF * SR), probe = 600 * SR;
let best = base, bv = -Infinity;
for (let l = base - SR / 2; l <= base + SR / 2; l += 12) { const v = at(l, probe, 6 * SR, 3); if (v > bv) { bv = v; best = l; } }
{ let b2 = best, v2 = -Infinity; for (let l = best - 24; l <= best + 24; l++) { const v = at(l, probe, 60 * SR); if (v > v2) { v2 = v; b2 = l; } } best = b2; }
let xy = 0, xx = 0;
for (let i = 5 * SR; i < Math.min(tf, frames - best) - 5 * SR; i++) for (const c of [0, 1]) { xy += M[2 * (i + best) + c] * T[2 * i + c]; xx += T[2 * i + c] ** 2; }
const g = xy / xx;
const st: { srcStart: number; srcEnd: number; outStart: number }[] = (await Bun.file(cutsPath).json()).segmentTimes;
const map = (s: number) => { const x = st.find((r) => s >= r.srcStart && s <= r.srcEnd); return x ? x.outStart + s - x.srcStart : null; };
const words: { start: number; end: number; speaker?: string; type?: string }[] = (await Bun.file(wordsPath).json()).words;
const gains = Object.fromEntries(values.gain!.split(",").map((kv) => kv.split("=")).map(([k, v]) => [k, 10 ** (Number(v) / 20) - 1]));
// Per-sample extra gain, from smoothed per-speaker masks (a sample in two speakers' spans gets no change).
const mask: Record<string, Float32Array> = {};
for (const id of Object.keys(gains)) mask[id] = new Float32Array(tf);
for (const w of words) {
  if (!w.speaker || !(w.speaker in gains) || (w.type && w.type !== "word")) continue;
  const s = map(w.start), e = map(w.end); if (s === null || e === null) continue;
  mask[w.speaker].fill(1, Math.max(0, Math.round((s - 0.15) * SR)), Math.min(tf, Math.round((e + 0.15) * SR)));
}
const R = Math.round(0.04 * SR);
for (const m of Object.values(mask)) { // 40 ms linear ramps: a one-pole rise/fall
  for (let i = 1; i < tf; i++) if (m[i] < m[i - 1]) m[i] = Math.max(m[i], m[i - 1] - 1 / R);
  for (let i = tf - 2; i >= 0; i--) if (m[i] < m[i + 1]) m[i] = Math.max(m[i], m[i + 1] - 1 / R);
}
const ids = Object.keys(gains);
let peak = 0;
for (let i = 0; i < tf && i + best < frames; i++) {
  const ms = ids.map((id) => mask[id][i]), sum = ms.reduce((a, b) => a + b, 0);
  if (!sum) continue;
  const k = ms.filter((x) => x > 0).length > 1 ? 0 : ids.reduce((a, id, j) => a + gains[id] * ms[j], 0);
  if (!k) continue;
  for (const c of [0, 1]) M[2 * (i + best) + c] += k * g * T[2 * i + c];
}
for (const x of M) peak = Math.max(peak, Math.abs(x));
const raw = `${out}.f32`; await Bun.write(raw, M.buffer);
await $`ffmpeg -v error -y -f f32le -ar ${SR} -ac 2 -i ${raw} -c:a pcm_f32le ${out} && rm ${raw}`;
console.log(`talk lag ${(best / SR).toFixed(4)} s, talk gain ${(20 * Math.log10(g)).toFixed(2)} dB, gains ${values.gain}, peak ${(20 * Math.log10(peak)).toFixed(2)} dBFS -> ${out}`);
