// Sound design for the ep 198 intro A v3 (the full show + particles): deterministic synthesis,
// 48 kHz stereo float. bun synth3.ts A <out.wav>. Every hit is on its video frame (show-timeline.ts).
// Deviation from tools/podcast-edit/sfx/README.md on purpose (host: bigger impacts): the impacts
// carry real sub (38-110 Hz); still lowpassed at 4.5 kHz, soft attacks, soft-limited peaks.
import {FX, B} from '../src/show-timeline';
import {kt} from '../src/beats';

const SR = 48000;

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

// ---------- intro A v3: louder, frame-synced hits ("boom boom boom") ----------
// boom: heavy low impact, 110 -> 38 Hz body (sub) + 90 -> 55 Hz punch + 200-600 Hz knock +
// a short lowpassed noise crack; size scales everything. Soft 3 ms attack (no click).
const boom = (t0: number, size: number, pan = 0) => {
  const s0 = Math.round(t0 * SR), n = Math.round(1.1 * SR), bp = new BP(), bp2 = new BP(); bp.set(300, 1.2); bp2.set(1400, 0.9);
  let ph = 0, ph2 = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR, att = Math.min(1, t / 0.003);
    ph += (2 * Math.PI * (38 + 72 * Math.exp(-t / 0.06))) / SR;
    ph2 += (2 * Math.PI * (55 + 35 * Math.exp(-t / 0.03))) / SR;
    const sub = Math.sin(ph) * Math.exp(-t / 0.32) * 0.9;
    const punch = Math.tanh(2.2 * Math.sin(ph2)) * Math.exp(-t / 0.09) * 0.5;
    const knock = bp.run(noise()) * Math.exp(-t / 0.06) * 2.2;
    const crack = bp2.run(noise()) * Math.exp(-t / 0.025) * 1.1;
    add(s0 + k, (sub + punch + knock + crack) * att * size, pan * Math.exp(-t / 0.2));
  }
};
// stamp thud: wood on paper, short (160 + 420 Hz bands), with a small low punch
const thud = (t0: number, size: number) => {
  const s0 = Math.round(t0 * SR), n = Math.round(0.35 * SR), a = new BP(), b = new BP(); a.set(170, 2.5); b.set(430, 2);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const t = k / SR, att = Math.min(1, t / 0.002);
    ph += (2 * Math.PI * (70 + 60 * Math.exp(-t / 0.03))) / SR;
    const x = (a.run(noise()) * 3.2 * Math.exp(-t / 0.07) + b.run(noise()) * 2.2 * Math.exp(-t / 0.035) + Math.sin(ph) * 0.6 * Math.exp(-t / 0.12)) * att * size;
    add(s0 + k, x, 0);
  }
};
// riser into a hit: noise band sweeping up, ending exactly on the hit
const riser = (t: number, dur: number, gain: number) => whoosh(t - dur, dur + 0.02, 300, 3200, 0.97, gain, -0.5, 0.5, 1.3);
const dust = (t: number, dur: number, rate: number, gain: number) => grains(t, dur, (u) => rate * Math.exp(-u * 4), 900, 4300, gain);

// the bridge from the cold open: a riser from the first sample (no silence), a tremble, the blast on hit 0
whoosh(0, kt(0) + 0.04, 250, 3000, 0.9, 1.4, 0.3, -0.3, 1.1, 0.7);
for (const e of FX) {
  const t = kt(e.k), p = e.p;
  switch (e.kind) {
    case 'boom':
      if (e.id !== 'co') riser(t, 0.45, 0.35 * p);
      boom(t, 0.95 * p);
      whoosh(t, 1.2, 2600, 260, 0.08, 0.55 * p, -0.7, 0.7);
      dust(t - 0.02, 1.2, 900, 0.09 * p);
      break;
    case 'land':
      whoosh(t - 0.3, 0.36, 500, 2800, 0.88, 0.32 * p, 0.4, 0);
      boom(t, 0.62 * p);
      dust(t, 0.45, 300, 0.05);
      break;
    case 'slam':
      boom(t, 0.5 * p + 0.12);
      if (p >= 0.5) whoosh(t - 0.18, 0.22, 700, 2600, 0.9, 0.18 * p, 0, 0);
      break;
    case 'stamp':
      whoosh(t - 0.16, 0.18, 400, 2400, 0.9, 0.3, -0.2, 0.2);
      thud(t, 0.9 * p); boom(t, 0.55 * p);
      break;
    case 'shatter':
      thud(t, 0.8); boom(t, 0.7 * p);
      dust(t, 1.0, 1400, 0.11);
      whoosh(t, 0.9, 2400, 300, 0.1, 0.45, 0.4, -0.4);
      break;
    case 'snap':
      whoosh(t - (e.id === 'approved' ? 0.32 : 0.22), (e.id === 'approved' ? 0.33 : 0.23), 260, 3600, 0.96, 0.4 * p, -0.6, 0.6, 1.2);
      thud(t, 0.8 * p); boom(t, 0.45 * p);
      break;
    case 'bomb':
      whoosh(t - 0.25, 0.27, 2200, 500, 0.85, 0.12, e.x > 1000 ? 0.5 : -0.3, e.x > 1000 ? 0.4 : -0.2, 3);
      boom(t, 0.32, e.x > 1000 ? 0.4 : -0.3);
      break;
  }
}
// the self-approval jet: the paper's particles stream up into the stamp
whoosh(kt(B.selfJet[0]), kt(B.selfJet[1]) - kt(B.selfJet[0]) + 0.05, 400, 3000, 0.92, 0.3, -0.3, 0.3, 1.6);
dust(kt(B.selfJet[0]), 0.45, 500, 0.05);
// the five presses: a hard click-free button knock under each slam
for (const k of B.presses) thud(kt(k), 0.6);

// level and safety: lowpass 4.5 kHz (two one-pole stages); soft-limit the peaks
for (const ch of [L, R]) for (let pass = 0; pass < 2; pass++) { const a = 1 - Math.exp((-2 * Math.PI * 4500) / SR); let y = 0; for (let i = 0; i < N; i++) { y += a * (ch[i] - y); ch[i] = y; } }
const G = Number(process.env.SFX_GAIN ?? 1);
for (const ch of [L, R]) for (let i = 0; i < N; i++) ch[i] = Math.tanh(ch[i] * G * 1.2) / 1.2;
// the cold open fades its own sound out at its end: the riser comes up from silence (0.15 s,
// raised-cosine), so the join has no level step
for (const ch of [L, R]) for (let i = 0; i < 0.15 * SR; i++) ch[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / (0.15 * SR));
const buf = new ArrayBuffer(44 + N * 8), dv = new DataView(buf);
const w = (o: number, s: string) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
w(0, 'RIFF'); dv.setUint32(4, 36 + N * 8, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 3, true); dv.setUint16(22, 2, true);
dv.setUint32(24, SR, true); dv.setUint32(28, SR * 8, true); dv.setUint16(32, 8, true); dv.setUint16(34, 32, true); w(36, 'data'); dv.setUint32(40, N * 8, true);
for (let i = 0; i < N; i++) { dv.setFloat32(44 + i * 8, L[i], true); dv.setFloat32(48 + i * 8, R[i], true); }
await Bun.write(process.argv[3], buf);
console.log('wrote', process.argv[3]);
