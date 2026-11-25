// Sound design for the ep 198 particle intro: deterministic (seeded) synthesis, 48 kHz stereo.
// bun synth.ts <A|B> <out-sfx.wav>
// Follows tools/podcast-edit/sfx/README.md: nothing bright (all lowpassed at 4.5 kHz), no clicks
// (every grain and hit has a smooth attack), nothing sub-only (impacts carry a 200-600 Hz knock),
// and the sounds sit under the music (mixed into the intro bed by mix.sh).
import {A, B, hit} from '../src/plans';

const SR = 48000;
const v = process.argv[2] === 'B' ? B : A;
const LEN = 22.2; // as long as the intro cue
const N = Math.round(LEN * SR);
const L = new Float32Array(N), R = new Float32Array(N);

let seed = 198;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const noise = () => rnd() * 2 - 1;

// RBJ band-pass biquad with a time-varying centre (coefficients every 16 samples)
class BP {
  b0 = 0; b2 = 0; a1 = 0; a2 = 0; x1 = 0; x2 = 0; y1 = 0; y2 = 0;
  set(f: number, q: number) { const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al; this.b0 = al / a0; this.b2 = -al / a0; this.a1 = (-2 * Math.cos(w)) / a0; this.a2 = (1 - al) / a0; }
  run(x: number) { const y = this.b0 * x + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
}
const add = (i: number, x: number, pan: number) => { if (i < 0 || i >= N) return; const p = (pan + 1) * Math.PI / 4; L[i] += x * Math.cos(p); R[i] += x * Math.sin(p); };

// whoosh: band-passed noise, centre sweeping f0 -> f1 (log), envelope peaking at `peak` (0..1),
// pan sweeping p0 -> p1
const whoosh = (t0: number, dur: number, f0: number, f1: number, peak: number, gain: number, p0 = -0.6, p1 = 0.6, q = 1.4, floor = 0) => {
  const bpL = new BP(), n = Math.round(dur * SR), s0 = Math.round(t0 * SR);
  for (let k = 0; k < n; k++) {
    const u = k / n;
    if (k % 16 === 0) bpL.set(f0 * Math.pow(f1 / f0, u), q);
    const env = (u < peak ? floor + (1 - floor) * Math.pow(u / peak, floor ? 1.5 : 2.2) : Math.pow(1 - (u - peak) / (1 - peak), 1.6)) * Math.min(1, k / (0.004 * SR));
    add(s0 + k, bpL.run(noise()) * env * gain, p0 + (p1 - p0) * u);
  }
};
// grains: short band-passed noise bursts (glittering dust); density(t) per second
const grains = (t0: number, dur: number, rate: (u: number) => number, fLo: number, fHi: number, gain: number) => {
  let t = t0;
  while (t < t0 + dur) {
    const u = (t - t0) / dur;
    const r = Math.max(1, rate(u));
    t += -Math.log(1 - rnd() * 0.999) / r;
    const len = 0.012 + 0.05 * rnd(), f = fLo * Math.pow(fHi / fLo, rnd()), pan = noise() * 0.9, g = gain * (0.4 + 0.6 * rnd());
    const bp = new BP(); bp.set(f, 6);
    const s0 = Math.round(t * SR), n = Math.round(len * SR);
    for (let k = 0; k < n; k++) { const e = Math.sin((Math.PI * k) / n) ** 2; add(s0 + k, bp.run(noise()) * e * g * 4, pan); }
  }
};
// impact: 140 -> 50 Hz drop plus a 200-600 Hz knock, soft 4 ms attack
const impact = (t0: number, size: number) => {
  const s0 = Math.round(t0 * SR), n = Math.round(0.7 * SR), bp = new BP(); bp.set(380, 1.1);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR, att = Math.min(1, t / 0.004);
    const f = 50 + 90 * Math.exp(-t / 0.07);
    ph += (2 * Math.PI * f) / SR;
    const body = Math.sin(ph) * Math.exp(-t / 0.22) * 0.55;
    const knock = bp.run(noise()) * Math.exp(-t / 0.05) * 1.6;
    const x = (body + knock) * att * size;
    add(s0 + k, x, 0);
  }
};

// ---------- the score: per phase, on the plan's own times ----------
const [p1, p2] = v.phases;
const lands = (p: typeof p1) => Object.entries(p.land).filter(([k], i, a) => a.findIndex(([, t]) => t === p.land[k]) === i).sort((a, b) => a[1] - b[1]);
// join from the cold open: a riser from the first sample (no silence), the shatter on the first hit
whoosh(0, hit(0) + 0.14, 350, 2600, 0.62, 2.3, 0.3, -0.3, 1.1, 0.85);
grains(hit(0) - 0.05, 1.6, (u) => 900 * Math.exp(-u * 3), 900, 4200, 0.09);
whoosh(hit(0), 1.6, 2400, 300, 0.12, 0.42, -0.7, 0.7);
impact(hit(0), 0.45);
// galaxy flight: slow swirling air + sparse dust
const fly = (t0: number, t1: number) => {
  for (let t = t0; t < t1 - 0.4; t += 1.03) whoosh(t, 1.6, 500 + 300 * rnd(), 1400 + 600 * rnd(), 0.5, 0.16, rnd() < 0.5 ? -0.8 : 0.8, rnd() < 0.5 ? -0.8 : 0.8, 2.2);
  grains(t0, t1 - t0, (u) => 60 + 60 * Math.sin(Math.PI * u), 1200, 4200, 0.05);
};
// landings: a short reverse whoosh into each element, a knock as it lands (bigger for the last)
const landAll = (p: typeof p1) => {
  const ls = lands(p);
  ls.forEach(([name, t], i) => {
    const last = i === ls.length - 1;
    whoosh(t - 0.42, 0.5, 600, 2600, 0.9, last ? 0.4 : 0.26, -0.4 + 0.8 * (i / ls.length), 0);
    impact(t, last ? 0.9 : 0.42);
    grains(t, 0.5, (u) => 260 * Math.exp(-u * 5), 1500, 4300, last ? 0.07 : 0.045);
    void name;
  });
};
fly(p1.dep1, Math.min(...Object.values(p1.land)) - 0.4);
landAll(p1);
// text changes while the card holds sharp: a soft knock and a little dust on each
for (const b of v.beats) { impact(b.t, 0.3); grains(b.t, 0.35, (u) => 200 * Math.exp(-u * 6), 1500, 4300, 0.035); }
// break the card: shatter on the hit, then fly, then land the body
whoosh(p2.dep0 - 0.45, 0.5, 300, 1800, 0.92, 0.3, 0, 0);
impact(p2.dep0, 0.6);
grains(p2.dep0 - 0.03, 1.4, (u) => 800 * Math.exp(-u * 3), 900, 4200, 0.085);
whoosh(p2.dep0, 1.4, 2200, 280, 0.15, 0.4, 0.7, -0.7);
fly(p2.dep1, Math.min(...Object.values(p2.land)) - 0.4);
landAll(p2);

// level: the bridge from the cold open (first 0.6 s) at full level, everything after it 5 dB
// lower, so the intro section sits within about 1 dB of the old card's loudness
for (const ch of [L, R]) for (let i = 0; i < N; i++) { const t = i / SR; ch[i] *= t < 0.6 ? 1 : t < 1.0 ? 1 - 0.44 * (t - 0.6) / 0.4 : 0.56; }
// lowpass 4.5 kHz (two one-pole stages) and write a 32-bit float WAV
for (const ch of [L, R]) for (let pass = 0; pass < 2; pass++) { const a = 1 - Math.exp((-2 * Math.PI * 4500) / SR); let y = 0; for (let i = 0; i < N; i++) { y += a * (ch[i] - y); ch[i] = y; } }
const buf = new ArrayBuffer(44 + N * 8), dv = new DataView(buf);
const w = (o: number, s: string) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
w(0, 'RIFF'); dv.setUint32(4, 36 + N * 8, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 3, true); dv.setUint16(22, 2, true);
dv.setUint32(24, SR, true); dv.setUint32(28, SR * 8, true); dv.setUint16(32, 8, true); dv.setUint16(34, 32, true); w(36, 'data'); dv.setUint32(40, N * 8, true);
for (let i = 0; i < N; i++) { dv.setFloat32(44 + i * 8, L[i], true); dv.setFloat32(48 + i * 8, R[i], true); }
await Bun.write(process.argv[3], buf);
console.log('wrote', process.argv[3], LEN, 's');
