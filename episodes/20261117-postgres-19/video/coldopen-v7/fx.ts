// Synthesized sound effects for the v7 cold open (all made here from noise and oscillators, so they
// are ours to use). Writes 44.1 kHz stereo float WAVs:
//   whoosh.wav (whip-pan), slam.wav (type hit), impact.wav (trailer hit), braam.wav (big low brass-like
//   swell), riser.wav (2 s build), glitch.wav (0.2 s digital stutter), crackle.wav (12 s vinyl bed).
// Usage: bun fx.ts <outdir>
import { join, resolve } from "path";
import { mkdirSync } from "fs";

const SR = 44100, out = resolve(Bun.argv[2] ?? "."); mkdirSync(out, { recursive: true });
let seed = 197; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

// RBJ biquad, coefficients updated per sample (fine for these lengths)
function biquad() {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x: number, type: "lp" | "bp" | "hp", f: number, q: number) => {
    const w = 2 * Math.PI * Math.min(f, SR * 0.45) / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w);
    let b0, b1, b2;
    if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = a; b1 = 0; b2 = -a; }
    const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; return y;
  };
}
const env = (t: number, a: number, d: number) => (t < a ? t / a : Math.exp(-(t - a) / d));
const sat = (x: number, k = 1.5) => Math.tanh(k * x) / Math.tanh(k);

function write(name: string, L: Float32Array, R: Float32Array) {
  let peak = 0; for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.89 / peak : 1, data = new Float32Array(L.length * 2);
  for (let i = 0; i < L.length; i++) { data[2 * i] = L[i] * g; data[2 * i + 1] = R[i] * g; }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.byteLength, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(3, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 8, 28); h.writeUInt16LE(8, 32); h.writeUInt16LE(32, 34); h.write("data", 36); h.writeUInt32LE(data.byteLength, 40);
  Bun.write(join(out, name), Buffer.concat([h, Buffer.from(data.buffer)]));
}
function make(sec: number, fn: (t: number, i: number) => [number, number]) {
  const n = Math.round(sec * SR), L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { const [l, r] = fn(i / SR, i); L[i] = l; R[i] = r; }
  return [L, R] as const;
}

{ // whoosh: band-passed noise sweeping up then down, panned left to right
  const fl = biquad(), fr = biquad(), d = 0.42;
  write("whoosh.wav", ...make(d, (t) => {
    const p = t / d, f = 400 + 3200 * Math.sin(Math.PI * p) ** 2, a = Math.sin(Math.PI * Math.min(1, p * 1.15)) ** 2;
    const n = rnd(), l = fl(n, "bp", f, 1.2) * a * (1 - p * 0.7), r = fr(n, "bp", f * 1.03, 1.2) * a * (0.3 + p * 0.7);
    return [l, r];
  }));
}
{ // slam: short knock for type hits (180 Hz body + a 25 ms noise click, low-passed)
  const f = biquad(); let ph = 0;
  write("slam.wav", ...make(0.35, (t) => {
    ph += 2 * Math.PI * (180 - 80 * Math.min(1, t / 0.12)) / SR;
    const x = Math.sin(ph) * env(t, 0.002, 0.08) + f(rnd(), "lp", 2500, 0.7) * env(t, 0.001, 0.012) * 0.8;
    return [sat(x), sat(x)];
  }));
}
{ // impact: sub drop + knock + noise tail, for trailer hits
  const fn = biquad(), fn2 = biquad(); let ph = 0, ph2 = 0;
  write("impact.wav", ...make(2.2, (t) => {
    ph += 2 * Math.PI * (40 + 50 * Math.exp(-t * 18)) / SR; ph2 += 2 * Math.PI * 130 / SR;
    const sub = Math.sin(ph) * env(t, 0.003, 0.7), knock = Math.sin(ph2) * env(t, 0.001, 0.06) * 0.7;
    const n = rnd(), tail = fn(n, "lp", 900 * Math.exp(-t * 1.5) + 150, 0.8) * env(t, 0.002, 0.45) * 0.6;
    const tail2 = fn2(rnd(), "lp", 900 * Math.exp(-t * 1.5) + 150, 0.8) * env(t, 0.002, 0.45) * 0.6;
    return [sat(sub + knock + tail, 2), sat(sub + knock + tail2, 2)];
  }));
}
{ // braam: detuned saws on A (55, 110, 165 Hz), filter opening then closing, saturated
  const fl = biquad(), fr = biquad(), d = 3.2, fq = [55, 55.4, 110, 109.3, 164.8, 220.6], ph = fq.map(() => ((rnd() + 1) / 2));
  write("braam.wav", ...make(d, (t) => {
    let l = 0, r = 0;
    fq.forEach((f, k) => { ph[k] = (ph[k] + f / SR) % 1; const s = 2 * ph[k] - 1; if (k % 2) r += s; else l += s; });
    const cut = 250 + 2200 * env(t, 0.12, 0.9), a = env(t, 0.04, 1.4);
    return [sat(fl(l, "lp", cut, 1.1) * a, 2.5), sat(fr(r, "lp", cut, 1.1) * a, 2.5)];
  }));
}
{ // riser: noise sweeping up + a rising sine, crescendo, ends abruptly
  const fl = biquad(), fr = biquad(), d = 2.0; let ph = 0;
  write("riser.wav", ...make(d, (t) => {
    const p = t / d, f = 300 * Math.pow(20, p); ph += 2 * Math.PI * (180 * Math.pow(6, p)) / SR;
    const a = p ** 2.2, tone = Math.sin(ph) * 0.35;
    return [(fl(rnd(), "bp", f, 2) + tone) * a, (fr(rnd(), "bp", f * 1.05, 2) + tone) * a];
  }));
}
{ // glitch: 0.22 s of stepped square chirps, crushed
  const steps = [880, 220, 1320, 330, 660, 110, 990, 440];
  write("glitch.wav", ...make(0.22, (t) => {
    const s = Math.floor(t / 0.0275), f = steps[s % steps.length], q = Math.sign(Math.sin(2 * Math.PI * f * t));
    const x = Math.round(q * 4) / 4 * 0.6 + (s % 3 === 0 ? rnd() * 0.3 : 0);
    return [x, s % 2 ? x : -x];
  }));
}
{ // vinyl crackle bed: sparse filtered pops over low hiss
  const fh = biquad(), fp = biquad();
  write("crackle.wav", ...make(12, () => {
    const pop = ((rnd() + 1) / 2) < 0.0009 ? rnd() * 3 : 0, hiss = fh(rnd(), "lp", 3000, 0.7) * 0.05;
    const c = fp(pop, "bp", 2500, 0.9);
    return [c + hiss, c * 0.8 + hiss];
  }));
}
console.log("fx ->", out);
