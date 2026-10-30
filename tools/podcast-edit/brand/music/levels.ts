// Per-video-frame audio levels for beat-reactive graphics.
//   bun levels.ts <cue.wav> <out.json> [fps=25] [bands=12]
// Output: { fps, rms: number[], low: number[], bands: number[][] }, all 0..1 (normalized to
// the cue's own 98th percentile). Bands: log-spaced 60 Hz..10 kHz, Goertzel over a 2048 window.
const [inp, out, fpsS, nbS] = Bun.argv.slice(2);
const fps = Number(fpsS ?? 25), NB = Number(nbS ?? 12), SR = 24000, N = 1024;
const p = Bun.spawn(["ffmpeg", "-v", "error", "-i", inp, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { stdout: "pipe" });
const x = new Float32Array(await new Response(p.stdout).arrayBuffer());
const frames = Math.ceil((x.length / SR) * fps);
const freqs = Array.from({ length: NB }, (_, i) => 60 * Math.pow(10000 / 60, i / (NB - 1)));
const win = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
const rms: number[] = [], low: number[] = [], bands: number[][] = [];
for (let f = 0; f < frames; f++) {
  const c = Math.round((f / fps) * SR), a = c - N / 2;
  const seg = new Float32Array(N);
  for (let i = 0; i < N; i++) { const j = a + i; seg[i] = j >= 0 && j < x.length ? x[j] * win[i] : 0; }
  let e = 0; for (const v of seg) e += v * v; rms.push(Math.sqrt(e / N));
  const row = freqs.map((fr) => {
    const w = (2 * Math.PI * fr) / SR, k = 2 * Math.cos(w); let s1 = 0, s2 = 0;
    for (let i = 0; i < N; i++) { const s0 = seg[i] + k * s1 - s2; s2 = s1; s1 = s0; }
    return Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - k * s1 * s2)) / N;
  });
  bands.push(row); low.push((row[0] + row[1] + row[2]) / 3);
}
const norm = (arr: number[]) => { const s = [...arr].sort((p, q) => p - q), m = s[Math.floor(s.length * 0.98)] || 1; return arr.map((v) => +Math.min(1, v / m).toFixed(3)); };
const bandsT = freqs.map((_, b) => norm(bands.map((r) => r[b])));
await Bun.write(out, JSON.stringify({ fps, rms: norm(rms), low: norm(low), bands: bands.map((_, f) => bandsT.map((col) => col[f])) }));
console.log(`wrote ${out}: ${frames} frames`);
