import {mulberry32} from './particles-engine';
import {BEAT, FPS, kt} from './beats';
import {B, EX_F, FX, type Fx, LEN, PAPER, SW_F} from './show-timeline';

// FX overlay for intro A v3, drawn with the 2D canvas API as a pure function of t (seeded):
// shockwave rings, particle bursts sampled from the element that is hit (fx-samples.json), rejected
// things shattering into falling, burning particles, approved things condensing from particles
// with a flash, the self-approval stamp condensing from a jet of the paper's own particles, embers
// and light streaks between the hits. Never over the host photos (clipped out), never text.
// Plus camera(): the shake (2-4 frames per slam) and the bass pulse of the whole frame on every hit.

export type Samples = Record<string, number[]>; // id -> [x, y, r, g, b] * n
const FACES = new Set(['kirk', 'nik', 'bodykirk', 'bodynik']);
const TILES = [[110, 556, 330, 248], [470, 556, 330, 248]];
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const eOut = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
// host photos on screen at t (sharp, landed): the FX never draw over them
const BODY_TILES = [[105, 206, 830, 546], [985, 206, 830, 546]];
const faceRects = (t: number) => {
  const r: number[][] = [];
  if (t < SW_F / FPS) { if (t >= kt(B.kirk) - 0.12) r.push(TILES[0]); if (t >= kt(B.nik) - 0.12) r.push(TILES[1]); return r; }
  if (t < EX_F / FPS + 0.04) return TILES;
  if (t >= kt(B.detonate + 1.05) - 0.08) r.push(BODY_TILES[0]);
  if (t >= kt(B.detonate + 1.25) - 0.08) r.push(BODY_TILES[1]);
  return r;
};
const showing = (t: number) => t >= SW_F / FPS && t < EX_F / FPS;

// ---------- camera ----------
const SHAKE = [[1, -0.7], [-0.85, 0.6], [0.5, -0.45], [-0.25, 0.2]];
export const camera = (f: number) => {
  const t = f / FPS;
  let dx = 0, dy = 0, rot = 0;
  for (const e of FX) {
    if (e.p < 0.45) continue;
    const ef = Math.round(kt(e.k) * FPS), d = f - ef;
    const nF = e.p >= 0.9 ? 4 : e.p >= 0.7 ? 3 : 2;
    if (d < 0 || d >= nF) continue;
    const A = 30 * e.p;
    dx += SHAKE[d][0] * A; dy += SHAKE[d][1] * A; rot += (d % 2 ? -1 : 1) * 0.7 * e.p;
  }
  // the cold open trembles before it detonates on the first hit (from frame 3)
  if (f >= 3 && t < kt(0)) { const g = Math.pow((t - 0.12) / (kt(0) - 0.12), 2), j = f * 2.39; dx += 9 * g * Math.sin(j * 7.1); dy += 6 * g * Math.cos(j * 5.3); }
  // bass pulse on every music hit of the show (not on the first and the last frames)
  let pulse = 0;
  if (t > 0.3 && t < LEN - 0.85) for (let k = 0; k <= B.detonate + 1; k++) { const d = t - kt(k); if (d >= 0 && d < 0.4) pulse = Math.max(pulse, Math.exp(-d * 9)); }
  const cover = 1 + (2 * Math.max(Math.abs(dx) / 1920, Math.abs(dy) / 1080) + Math.abs(rot) * 0.012) * 1.15;
  return {transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${(cover * (1 + 0.016 * pulse)).toFixed(4)})`, bright: 1 + 0.1 * pulse};
};

// ---------- particles ----------
type P = {x: number; y: number; vx: number; vy: number; r: number; g: number; b: number; size: number; life: number; hot: number};
const burstOf = (e: Fx, S: Samples, n: number, speed: number, up: number): P[] => {
  const rnd = mulberry32(hash(e.id));
  const s = S[e.id];
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    let x: number, y: number, r: number, g: number, b: number;
    if (s && s.length >= 5) {
      const j = Math.floor(rnd() * (s.length / 5)) * 5;
      [x, y, r, g, b] = [s[j], s[j + 1], s[j + 2], s[j + 3], s[j + 4]];
    } else {
      x = e.x + rnd() * e.w; y = e.y + rnd() * e.h;
      [r, g, b] = hex(e.pal?.[Math.floor(rnd() * (e.pal?.length ?? 1))] ?? '#ffffff');
    }
    // a third of the sparks in the event's accent colours, so the burst reads hot
    if (e.pal && rnd() < 0.35) [r, g, b] = hex(e.pal[Math.floor(rnd() * e.pal.length)]);
    const a = Math.atan2(y - cy + 1e-3 * (rnd() - 0.5), x - cx + 1e-3) + (rnd() - 0.5) * 0.9;
    const v = speed * (0.25 + rnd() * rnd() * 1.4);
    out.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up * (0.3 + rnd()), r, g, b, size: 2.5 + rnd() * rnd() * 9, life: 0.45 + rnd() * 0.7, hot: rnd()});
  }
  return out;
};
const G = 2300; // px/s^2
const cache = new Map<string, P[]>();
const parts = (e: Fx, S: Samples, n: number, speed: number, up: number) => {
  let p = cache.get(e.id);
  if (!p) { p = burstOf(e, S, n, speed, up); cache.set(e.id, p); }
  return p;
};
const drawBurst = (c: CanvasRenderingContext2D, ps: P[], d: number, burn: boolean, drag = 2.2) => {
  for (const p of ps) {
    if (d > p.life) continue;
    const u = d / p.life;
    // position with linear drag and gravity; streak from 0.03 s ago
    const at = (s: number) => { const e = (1 - Math.exp(-drag * s)) / drag; return [p.x + p.vx * e, p.y + p.vy * e + 0.5 * G * s * s * 0.6]; };
    const [x1, y1] = at(d), [x0, y0] = at(Math.max(0, d - 0.03));
    let {r, g, b} = p;
    if (burn) { // burns off: through hot orange to dark ember
      const k = Math.min(1, u * 1.6);
      r = r + (255 - r) * Math.min(1, k * 1.5) * (1 - u); g = g + (140 - g) * k; b = b + (40 - b) * k;
    }
    const a = (1 - u) * (1 - u);
    c.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(3)})`;
    c.lineWidth = p.size * (1 - 0.5 * u);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + 0.01, y1); c.stroke();
  }
};
const ring = (c: CanvasRenderingContext2D, x: number, y: number, d: number, R: number, w: number, col: string, dur = 0.38, r0 = 0) => {
  if (d < 0 || d > dur) return;
  const u = d / dur;
  if (r0) { R = R - r0; x = x; }
  c.strokeStyle = col.replace('A', ((1 - u) * (1 - u)).toFixed(3));
  c.lineWidth = w * (1 - u) + 1;
  c.beginPath(); c.ellipse(x, y, r0 + R * eOut(u) + 10, (r0 + R * eOut(u)) * 0.62 + 6, 0, 0, Math.PI * 2); c.stroke();
};

// convergence: particles fly in from a ring around the element to points inside it
const snapIn = (c: CanvasRenderingContext2D, e: Fx, S: Samples, t: number, te: number, pre: number, n: number) => {
  const d = t - (te - pre);
  if (d < 0 || t >= te) return;
  const rnd = mulberry32(hash(e.id + 'in'));
  const s = S[e.id];
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  for (let i = 0; i < n; i++) {
    let x: number, y: number, r: number, g: number, b: number;
    if (s && s.length >= 5) { const j = Math.floor(rnd() * (s.length / 5)) * 5; [x, y, r, g, b] = [s[j], s[j + 1], s[j + 2], s[j + 3], s[j + 4]]; }
    else { x = e.x + rnd() * e.w; y = e.y + rnd() * e.h; [r, g, b] = hex(e.pal?.[i % (e.pal?.length ?? 1)] ?? '#fff'); }
    const a = rnd() * Math.PI * 2, R = 260 + 520 * rnd(), sw = (rnd() - 0.5) * 2.4;
    const st = rnd() * 0.35 * pre;
    const u = Math.max(0, Math.min(1, (d - st) / (pre - st)));
    if (u <= 0) continue;
    const k = u * u * u, k0 = Math.max(0, u - 0.08) ** 3;
    const pos = (k: number) => { const ang = a + sw * (1 - k); const rr = R * (1 - k); return [x + Math.cos(ang) * rr * 1.4, y + Math.sin(ang) * rr]; };
    const [x1, y1] = pos(k), [x0, y0] = pos(k0);
    c.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${(0.25 + 0.75 * u).toFixed(3)})`;
    c.lineWidth = 2 + 4 * (1 - u) * rnd();
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + 0.01, y1); c.stroke();
  }
  void cx; void cy;
};

// the self-approval jet: the paper's own particles stream up and condense into the ANALYST stamp
const STAMP_BOX = {x: PAPER.x + PAPER.w / 2 - 164, y: PAPER.y + 252 - 330 - 386, w: 328, h: 386};
const jet = (c: CanvasRenderingContext2D, S: Samples, t: number) => {
  const a = kt(B.selfJet[0]), b = kt(B.selfJet[1]) + 0.04;
  if (t < a || t >= b) return;
  const rnd = mulberry32(777);
  const s = S.paper_jet;
  const pal = ['#39ff6a', '#1f9a3a', '#ffffff', '#b9865a', '#3d0f45'];
  for (let i = 0; i < 900; i++) {
    let x0 = PAPER.x + rnd() * PAPER.w, y0 = PAPER.y + 66 + rnd() * (PAPER.h - 66), col = hex(pal[i % pal.length]);
    if (s && s.length >= 5 && i % 2) { const j = Math.floor(rnd() * (s.length / 5)) * 5; x0 = s[j]; y0 = s[j + 1]; col = [s[j + 2], s[j + 3], s[j + 4]]; }
    const tx = STAMP_BOX.x + rnd() * STAMP_BOX.w, ty = STAMP_BOX.y + rnd() * STAMP_BOX.h;
    const st = a + rnd() * 0.45 * (b - a), en = st + (b - a) * (0.45 + 0.1 * rnd());
    const u = Math.max(0, Math.min(1, (t - st) / (en - st)));
    if (u <= 0) continue;
    const pos = (u: number) => { const k = u * u * (3 - 2 * u); const bow = Math.sin(Math.PI * k) * (120 + 160 * rnd()) * (i % 2 ? 1 : -1); return [x0 + (tx - x0) * k + bow, y0 + (ty - y0) * k]; };
    const [x1, y1] = pos(u), [xp, yp] = pos(Math.max(0, u - 0.07));
    c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${(u >= 1 ? 0.9 : 0.85).toFixed(2)})`;
    c.lineWidth = 2 + 3 * rnd();
    c.beginPath(); c.moveTo(xp, yp); c.lineTo(x1 + 0.01, y1); c.stroke();
  }
};

// embers and light streaks between the hits (show only)
const ambient = (c: CanvasRenderingContext2D, t: number) => {
  const fade = Math.min(1, (t - SW_F / FPS) / 0.3, (EX_F / FPS - t) / 0.2);
  if (fade <= 0) return;
  const rnd = mulberry32(4242);
  const pal = ['#ff5fcf', '#ff3b1f', '#39ff6a', '#ffffff', '#ffcc4d', '#ff5fcf'];
  for (let i = 0; i < 170; i++) {
    const x0 = rnd() * 1920, sp = 120 + 260 * rnd(), ph = rnd(), sz = 1.5 + 3.5 * rnd() * rnd(), col = hex(pal[i % pal.length]);
    const span = 1300, y = 1140 - ((t * sp + ph * span) % span), x = x0 + 50 * Math.sin(t * (0.8 + rnd()) + i);
    const tw = 0.55 + 0.45 * Math.sin(t * 9 + i * 1.7);
    c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(0.18 * tw * fade).toFixed(3)})`;
    c.beginPath(); c.arc(x, y, sz * 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(0.75 * tw * fade).toFixed(3)})`;
    c.fillRect(x - sz / 2, y - sz * 1.5, sz, sz * 3);
  }
  // a light streak sweeps across on every off-beat (k + 0.5)
  const q = (t - kt(0)) / BEAT;
  const k = Math.floor(q - 0.5), d = (q - 0.5 - k) * BEAT;
  if (d < 0.22) {
    const u = d / 0.22, y = 120 + ((k * 397) % 760), dir = k % 2 ? 1 : -1;
    const xc = dir > 0 ? -400 + u * 2700 : 2300 - u * 2700;
    const gr = c.createLinearGradient(xc - 500, y, xc + 500, y - 120 * dir);
    const col = k % 3 === 0 ? '255,95,207' : k % 3 === 1 ? '255,255,255' : '255,59,31';
    gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${(0.55 * (1 - u) * fade).toFixed(3)})`); gr.addColorStop(1, `rgba(${col},0)`);
    c.strokeStyle = gr; c.lineWidth = 5;
    c.beginPath(); c.moveTo(xc - 500, y + 60 * dir); c.lineTo(xc + 500, y - 60 * dir); c.stroke();
  }
};

export const drawFx = (c: CanvasRenderingContext2D, t: number, S: Samples) => {
  c.clearRect(0, 0, 1920, 1080);
  c.save();
  // never over the host photos while the show runs (their faces stay clean)
  const tiles = faceRects(t);
  if (tiles.length) {
    c.beginPath(); c.rect(0, 0, 1920, 1080);
    for (const [x, y, w, h] of tiles) { c.moveTo(x - 6, y - 6); c.lineTo(x - 6, y + h + 6); c.lineTo(x + w + 6, y + h + 6); c.lineTo(x + w + 6, y - 6); c.closePath(); }
    c.clip('evenodd');
  }
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  // the last 0.8 s is the clean body frame (the compose crossfades it into the show)
  c.globalAlpha = Math.max(0, Math.min(1, (LEN - 0.8 - t) / 0.25));
  if (c.globalAlpha <= 0) { c.restore(); return; }
  if (showing(t)) ambient(c, t);
  for (const e of FX) {
    const te = kt(e.k), d = t - te;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    if (e.kind === 'snap') snapIn(c, e, S, t, te, e.id === 'approved' ? 0.32 : 0.22, e.id === 'approved' ? 700 : 500);
    if (d < 0 || d > 1.3) continue;
    const R = Math.max(e.w, e.h) * 0.6 + 120;
    switch (e.kind) {
      case 'boom':
        ring(c, cx, cy, d, Math.max(900, R), 60 * e.p, 'rgba(255,255,255,A)', 0.45);
        ring(c, cx, cy, d - 0.06, Math.max(700, R * 0.8), 40 * e.p, 'rgba(255,95,207,A)', 0.45);
        drawBurst(c, parts(e, S, Math.round(900 * e.p), 2200, 500), d, true, 1.6);
        if (d < 0.12) { c.fillStyle = `rgba(255,240,250,${(0.3 * (1 - d / 0.12) * e.p).toFixed(3)})`; c.fillRect(0, 0, 1920, 1080); }
        break;
      case 'slam': case 'land': case 'stamp':
        // around a host tile the ring starts outside the tile (never across a face)
        // no ring around a host tile (no circles around faces) and none across the body frame
        if (!FACES.has(e.id) && e.id !== 'bodybg') ring(c, cx, cy, d, R, 34 * e.p, 'rgba(255,255,255,A)');
        if (e.p >= 0.5 && !FACES.has(e.id)) ring(c, cx, cy, d - 0.05, R * 0.75, 22 * e.p, e.kind === 'stamp' ? 'rgba(57,255,106,A)' : 'rgba(255,95,207,A)');
        drawBurst(c, parts(e, S, Math.round((e.kind === 'land' ? 260 : 340) * e.p + 40), 1500 * Math.max(0.5, e.p), 450), d, e.kind !== 'land');
        if (d < 0.08 && e.p >= 0.6 && !FACES.has(e.id)) { c.fillStyle = `rgba(255,255,255,${(0.35 * (1 - d / 0.08)).toFixed(3)})`; c.fillRect(e.x - 30, e.y - 30, e.w + 60, e.h + 60); }
        break;
      case 'bomb':
        ring(c, cx, cy, d, 170, 16, e.pal?.[0] === '#4fe3ff' ? 'rgba(79,227,255,A)' : 'rgba(255,113,36,A)', 0.3);
        drawBurst(c, parts(e, S, 90, 1100, 500), d, true);
        break;
      case 'shatter': {
        // the rejected thing breaks into its own pixels, which fall and burn off
        ring(c, cx, cy, d, R * 1.2, 46, 'rgba(255,59,31,A)', 0.42);
        drawBurst(c, parts(e, S, 1400, 1700, 300), d, true, 1.4);
        if (d < 0.1) { c.fillStyle = `rgba(255,80,40,${(0.4 * (1 - d / 0.1)).toFixed(3)})`; c.fillRect(e.x - 40, e.y - 40, e.w + 80, e.h + 80); }
        break;
      }
      case 'snap':
        ring(c, cx, cy, d, R, 30, 'rgba(57,255,106,A)', 0.36);
        drawBurst(c, parts(e, S, 220, 900, 200), d, false);
        if (d < 0.12) { c.fillStyle = `rgba(220,255,225,${(0.6 * (1 - d / 0.12)).toFixed(3)})`; c.fillRect(e.x - 20, e.y - 20, e.w + 40, e.h + 40); }
        break;
    }
  }
  jet(c, S, t);
  c.restore();
};
