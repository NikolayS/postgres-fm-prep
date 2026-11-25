// Deterministic particle engine for the ep 198 intro (no WebGL, no Math.random).
// A frame is a pure function of (images, plan, t): every particle's path is computed in closed
// form from fixed-seed parameters, and drawn by a small software rasterizer into a Float32 RGB
// buffer: exact 3x3 pixel blocks while a particle sits in its source or target cell (so the
// first frame, the assembled card and the last frame are pixel-exact copies of the images),
// soft box/disc splats with motion streaks, depth of field and a quarter-res bloom while it flies.

export const W = 1920, H = 1080, CS = 3, GW = W / CS, GH = H / CS;

// ---------- seeded RNG ----------
export const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffle = (a: Int32Array, rnd: () => number) => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
  return a;
};
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const inOutCubic = (x: number) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

// ---------- scenes ----------
// A layer: a premultiplied RGBA image (full res) and the grid cells it owns (cell = 3x3 px).
export type Layer = {name: string; img: Uint8ClampedArray; cells: Int32Array};
export type Scene = {layers: Layer[]};
export type Rect = {name: string; x0: number; y0: number; x1: number; y1: number};

export const premultiply = (rgba: Uint8ClampedArray) => {
  const o = new Uint8ClampedArray(rgba.length);
  for (let p = 0; p < rgba.length; p += 4) {
    const a = rgba[p + 3];
    o[p] = (rgba[p] * a + 127) / 255; o[p + 1] = (rgba[p + 1] * a + 127) / 255; o[p + 2] = (rgba[p + 2] * a + 127) / 255; o[p + 3] = a;
  }
  return o;
};

// One opaque image split into disjoint rect layers (cell owned by the first rect holding its
// centre; the rest is "bg", drawn first).
export const rectScene = (img: Uint8ClampedArray, rects: Rect[]): Scene => {
  const own = new Int32Array(GW * GH).fill(-1);
  for (let c = 0; c < GW * GH; c++) {
    const x = (c % GW) * CS + 1.5, y = Math.floor(c / GW) * CS + 1.5;
    for (let r = 0; r < rects.length; r++) { const R = rects[r]; if (x >= R.x0 && x < R.x1 && y >= R.y0 && y < R.y1) { own[c] = r; break; } }
  }
  const pick = (r: number) => { const out: number[] = []; for (let c = 0; c < own.length; c++) if (own[c] === r) out.push(c); return Int32Array.from(out); };
  return {layers: [{name: 'bg', img, cells: pick(-1)}, ...rects.map((R, r) => ({name: R.name, img, cells: pick(r)}))]};
};

// Separate transparent layers (first one opaque): every layer owns the cells where it has ink.
export const layeredScene = (layers: {name: string; img: Uint8ClampedArray}[]): Scene => ({
  layers: layers.map(({name, img}, li) => {
    const out: number[] = [];
    for (let c = 0; c < GW * GH; c++) {
      if (li === 0) { out.push(c); continue; }
      const x0 = (c % GW) * CS, y0 = Math.floor(c / GW) * CS;
      let m = 0;
      for (let dy = 0; dy < CS; dy++) for (let dx = 0; dx < CS; dx++) m = Math.max(m, img[((y0 + dy) * W + x0 + dx) * 4 + 3]);
      if (m > 3) out.push(c);
    }
    return {name, img, cells: Int32Array.from(out)};
  }),
});

// ---------- plan ----------
export type Orbit = {
  tilt0: number; tilt1: number; // disk tilt around X (rad) at the start and end of the flight
  roll0: number; roll1: number; // screen-plane roll (rad)
  spin: number; // angular speed scale (rad/s at mid radius), sign = direction
  zOff: number; // disk centre depth (negative = away from camera)
  r0: number; r1: number; // disk radius range
  cx: number; cy: number; // disk centre offset on screen (px from frame centre)
};
export type PhasePlan = {
  from: number; to: number; // video time window this phase draws (s)
  dep0: number; dep1: number; depDur: number; // departure window and per-particle take-off duration
  breakX: number; breakY: number; // the departure wave starts here
  land: Record<string, number>; // target layer -> landing time (s): all its particles settle by land + spread/2
  landOrder?: Record<string, 'radial' | 'sweep'>;
  spread: number; // landing spread (s)
  spreads?: Record<string, number>; // per-layer override
  arrDur: number; // per-particle approach duration (s)
  corr: Record<string, string>; // target layer -> source layer that feeds it first
  orbit: Orbit;
  flash?: number; // landing flash duration (s), default 0.28
  punch?: Record<string, number>; // target layer -> landing overshoot (scale - 1) once it has landed
  blast: number; // explosion strength at take-off (px)
  lift: number; // how far the blast throws particles toward the camera (x blast)
  seed: number;
};

// ---------- particles ----------
type Sys = {
  plan: PhasePlan; src: Scene; tgt: Scene; n: number;
  sL: Uint8Array; sC: Int32Array; tL: Uint8Array; tC: Int32Array;
  sx: Float32Array; sy: Float32Array; tx: Float32Array; ty: Float32Array;
  sc: Float32Array; tc: Float32Array; // r,g,b,a straight colour (0..1), 4 per particle
  td: Float32Array; ta: Float32Array; u: Float32Array; // 6 per particle
  orderS: Int32Array; orderT: Int32Array;
  tBox: {x0: number; x1: number; y0: number; y1: number}[];
};

const cellColor = (img: Uint8ClampedArray, c: number, out: Float32Array, o: number) => {
  const x0 = (c % GW) * CS, y0 = Math.floor(c / GW) * CS;
  let r = 0, g = 0, b = 0, a = 0;
  for (let dy = 0; dy < CS; dy++) for (let dx = 0; dx < CS; dx++) { const p = ((y0 + dy) * W + x0 + dx) * 4; r += img[p]; g += img[p + 1]; b += img[p + 2]; a += img[p + 3]; }
  if (a > 0) { out[o] = (255 * r) / a; out[o + 1] = (255 * g) / a; out[o + 2] = (255 * b) / a; } else { out[o] = out[o + 1] = out[o + 2] = 0; }
  out[o + 3] = a / (9 * 255);
};

export const buildSystem = (src: Scene, tgt: Scene, plan: PhasePlan): Sys => {
  const rnd = mulberry32(plan.seed);
  // flat (layer, cell) lists
  const list = (s: Scene) => { const L: number[] = [], C: number[] = []; s.layers.forEach((l, li) => l.cells.forEach((c) => { L.push(li); C.push(c); })); return {L, C}; };
  const S = list(src), T = list(tgt);
  const nS = S.L.length, nT = T.L.length, n = Math.max(nS, nT);
  // pad with duplicates of bg cells (opaque, so painting one twice changes nothing)
  const bgS = src.layers[0].cells, bgT = tgt.layers[0].cells;
  for (let k = nS; k < n; k++) { S.L.push(0); S.C.push(bgS[Math.floor(rnd() * bgS.length)]); }
  for (let k = nT; k < n; k++) { T.L.push(0); T.C.push(bgT[Math.floor(rnd() * bgT.length)]); }
  // pairing: corresponding layers first, the rest at random
  const byLayer = (X: {L: number[]}, nl: number) => Array.from({length: nl}, (_, li) => shuffle(Int32Array.from(X.L.map((l, k) => (l === li ? k : -1)).filter((k) => k >= 0)), rnd));
  const sBy = byLayer(S, src.layers.length), tBy = byLayer(T, tgt.layers.length);
  const usedS = new Uint8Array(n), usedT = new Uint8Array(n);
  const pairS: number[] = [], pairT: number[] = [];
  tgt.layers.forEach((tl, ti) => {
    const sName = plan.corr[tl.name];
    const si = src.layers.findIndex((l) => l.name === sName);
    if (si < 0) return;
    // a source layer can feed several target layers: never pair one source particle twice
    const a = tBy[ti], b = sBy[si].filter((k) => !usedS[k]), m = Math.min(a.length, b.length);
    for (let k = 0; k < m; k++) { pairT.push(a[k]); pairS.push(b[k]); usedT[a[k]] = 1; usedS[b[k]] = 1; }
  });
  const restS = shuffle(Int32Array.from(Array.from({length: n}, (_, k) => k).filter((k) => !usedS[k])), rnd);
  const restT = shuffle(Int32Array.from(Array.from({length: n}, (_, k) => k).filter((k) => !usedT[k])), rnd);
  for (let k = 0; k < restS.length; k++) { pairS.push(restS[k]); pairT.push(restT[k]); }

  const sys: Sys = {
    plan, src, tgt, n,
    sL: new Uint8Array(n), sC: new Int32Array(n), tL: new Uint8Array(n), tC: new Int32Array(n),
    sx: new Float32Array(n), sy: new Float32Array(n), tx: new Float32Array(n), ty: new Float32Array(n),
    sc: new Float32Array(n * 4), tc: new Float32Array(n * 4), td: new Float32Array(n), ta: new Float32Array(n), u: new Float32Array(n * 6),
    orderS: new Int32Array(n), orderT: new Int32Array(n), tBox: [],
  };
  // landing order within a layer: a sweep from left to right, or a ring from the layer centre
  const tBox = tgt.layers.map((l) => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    l.cells.forEach((c) => { const x = (c % GW) * CS, y = Math.floor(c / GW) * CS; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    return {x0, x1, y0, y1};
  });
  sys.tBox = tBox;
  const maxD = Math.hypot(W, H);
  for (let i = 0; i < n; i++) {
    const ks = pairS[i], kt = pairT[i];
    const sl = S.L[ks], scell = S.C[ks], tl = T.L[kt], tcell = T.C[kt];
    sys.sL[i] = sl; sys.sC[i] = scell; sys.tL[i] = tl; sys.tC[i] = tcell;
    sys.sx[i] = (scell % GW) * CS + 1.5; sys.sy[i] = Math.floor(scell / GW) * CS + 1.5;
    sys.tx[i] = (tcell % GW) * CS + 1.5; sys.ty[i] = Math.floor(tcell / GW) * CS + 1.5;
    cellColor(src.layers[sl].img, scell, sys.sc, i * 4);
    cellColor(tgt.layers[tl].img, tcell, sys.tc, i * 4);
    for (let k = 0; k < 6; k++) sys.u[i * 6 + k] = rnd();
    const u0 = sys.u[i * 6];
    // take-off: a wave from the break point, with jitter
    const d = Math.hypot(sys.sx[i] - plan.breakX, sys.sy[i] - plan.breakY) / maxD;
    sys.td[i] = plan.dep0 + (plan.dep1 - plan.dep0) * clamp01(0.82 * d / 0.62 + 0.18 * u0);
    // landing: per target layer
    const name = tgt.layers[tl].name, T0 = plan.land[name] ?? plan.land.bg;
    const bx = tBox[tl];
    let q: number;
    if ((plan.landOrder?.[name] ?? 'sweep') === 'radial') {
      const cx = (bx.x0 + bx.x1) / 2, cy = (bx.y0 + bx.y1) / 2;
      q = Math.hypot(sys.tx[i] - cx, sys.ty[i] - cy) / (0.5 * Math.hypot(bx.x1 - bx.x0, bx.y1 - bx.y0) + 1);
    } else q = (sys.tx[i] - bx.x0) / (bx.x1 - bx.x0 + 1);
    sys.ta[i] = T0 + (plan.spreads?.[name] ?? plan.spread) * (clamp01(0.85 * q + 0.15 * sys.u[i * 6 + 1]) - 0.5);
  }
  const ord = (L: Uint8Array) => Int32Array.from(Array.from({length: n}, (_, k) => k).sort((a, b) => L[a] - L[b] || a - b));
  sys.orderS = ord(sys.sL); sys.orderT = ord(sys.tL);
  return sys;
};

// ---------- motion ----------
const F = 1700; // focal length (px)
const pos = new Float32Array(3);
// 3D position of particle i at time t (frame centre = origin, +z toward the camera).
const place = (s: Sys, i: number, t: number) => {
  const p = s.plan, o = p.orbit, u = s.u, k = i * 6;
  const td = s.td[i], ta = s.ta[i];
  const a = smooth((t - td) / p.depDur);
  const b = inOutCubic((t - (ta - p.arrDur)) / p.arrDur);
  const sx = s.sx[i] - W / 2, sy = s.sy[i] - H / 2, tx = s.tx[i] - W / 2, ty = s.ty[i] - H / 2;
  // the galaxy: a tilted, rolling disk with three spiral arms, inner stars faster
  const fl = clamp01((t - p.dep0) / (p.to - p.dep0)); // phase clock for camera moves
  const tilt = o.tilt0 + (o.tilt1 - o.tilt0) * smooth(fl), roll = o.roll0 + (o.roll1 - o.roll0) * fl;
  const R = o.r0 + (o.r1 - o.r0) * Math.sqrt(u[k + 2]);
  const arm = Math.floor(u[k + 4] * 4);
  const th = arm * 1.5708 + R * 0.0046 + (u[k + 1] - 0.5) * 0.7 * (u[k] < 0.25 ? 3.5 : 1) + o.spin * Math.sqrt(420 / (R + 120)) * (t - p.dep0);
  const gx = R * Math.cos(th), gz = R * Math.sin(th), gy = (u[k + 5] - 0.5) * 260 * (1.1 - R / (o.r1 + 200));
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  const y1 = gy * ct - gz * st, z1 = gy * st + gz * ct;
  const cr = Math.cos(roll), sr = Math.sin(roll);
  let ox = gx * cr - y1 * sr + o.cx, oy = gx * sr + y1 * cr + o.cy, oz = z1 + o.zOff;
  // turbulence
  ox += 46 * Math.sin(0.0061 * oy + 1.7 * t + 6.283 * u[k]);
  oy += 46 * Math.sin(0.0057 * ox + 1.3 * t + 6.283 * u[k + 1]);
  oz += 60 * Math.sin(0.004 * (ox + oy) + 1.1 * t + 6.283 * u[k + 2]);
  // take-off: blast away from the break point, lift toward the camera, then join the galaxy
  const bx = sx - (p.breakX - W / 2), by = sy - (p.breakY - H / 2), bl = Math.hypot(bx, by) + 60;
  const lift = Math.sin(Math.PI * a);
  let x = sx + (ox - sx) * a + (bx / bl) * p.blast * (0.4 + u[k + 1]) * lift;
  let y = sy + (oy - sy) * a + (by / bl) * p.blast * (0.4 + u[k + 1]) * lift;
  let z = oz * a + p.blast * p.lift * (0.3 + u[k + 4]) * lift;
  // approach: swoop in from depth
  const arc = Math.sin(Math.PI * b) * (220 + 420 * u[k + 5]);
  x = x + (tx - x) * b; y = y + (ty - y) * b; z = z + (0 - z) * b + arc;
  pos[0] = x; pos[1] = y; pos[2] = z;
  return a * (1 - b); // flight weight
};

// ---------- raster ----------
export type Buffers = {out: Float32Array; acc: Float32Array; gl: Float32Array; tmp: Float32Array; voidBg: Float32Array};
const QW = W / 4, QH = H / 4;
export const makeBuffers = (pink = false): Buffers => {
  const voidBg = new Float32Array(W * H * 3);
  // pink: the card's own background (#ef7de3 -> #f39aea -> #faddf7), a little darker, so the
  // holes the particles leave read as depth, not as black
  if (pink) for (let y = 0; y < H; y++) {
    const u = y / (H - 1), a = u < 0.5 ? [0xef, 0x7d, 0xe3] : [0xf3, 0x9a, 0xea], b = u < 0.5 ? [0xf3, 0x9a, 0xea] : [0xfa, 0xdd, 0xf7], v = u < 0.5 ? u * 2 : u * 2 - 1;
    for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / W, k = 0.8 - 0.12 * Math.abs(dx), p = (y * W + x) * 3;
      for (let ch = 0; ch < 3; ch++) voidBg[p + ch] = (a[ch] + (b[ch] - a[ch]) * v) * k;
    }
  }
  else for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (x - W * 0.5) / W, dy = (y - H * 0.48) / H, d = Math.min(1, Math.hypot(dx, dy) * 1.6);
    const p = (y * W + x) * 3, k = 1 - d;
    voidBg[p] = 10 + 34 * k * k; voidBg[p + 1] = 3 + 9 * k * k; voidBg[p + 2] = 18 + 48 * k * k;
  }
  return {out: new Float32Array(W * H * 3), acc: new Float32Array(W * H * 4), gl: new Float32Array(QW * QH * 3), tmp: new Float32Array(QW * QH * 3), voidBg};
};

const blit = (out: Float32Array, img: Uint8ClampedArray, c: number, flash: number) => {
  const x0 = (c % GW) * CS, y0 = Math.floor(c / GW) * CS;
  for (let dy = 0; dy < CS; dy++) {
    let p = ((y0 + dy) * W + x0) * 4, q = ((y0 + dy) * W + x0) * 3;
    for (let dx = 0; dx < CS; dx++, p += 4, q += 3) {
      const a = img[p + 3];
      if (a === 0) continue;
      const k = 1 - a / 255;
      let r = img[p] + out[q] * k, g = img[p + 1] + out[q + 1] * k, b = img[p + 2] + out[q + 2] * k;
      if (flash > 0) { r += (255 - r) * flash; g += (255 - g) * flash; b += (255 - b) * flash; }
      out[q] = r; out[q + 1] = g; out[q + 2] = b;
    }
  }
};

const blitScaled = (out: Float32Array, img: Uint8ClampedArray, c: number, flash: number, sc: number, bx: {x0: number; x1: number; y0: number; y1: number}) => {
  const cx = (bx.x0 + bx.x1 + CS) / 2, cy = (bx.y0 + bx.y1 + CS) / 2;
  const x0 = (c % GW) * CS, y0 = Math.floor(c / GW) * CS;
  const X0 = Math.floor(cx + (x0 - cx) * sc), Y0 = Math.floor(cy + (y0 - cy) * sc), m = Math.ceil(CS * sc) + 1;
  for (let dy = 0; dy < m; dy++) {
    const Y = Y0 + dy; if (Y < 0 || Y >= H) continue;
    const sy = y0 + Math.min(CS - 1, Math.floor(dy / sc));
    for (let dx = 0; dx < m; dx++) {
      const X = X0 + dx; if (X < 0 || X >= W) continue;
      const p = (sy * W + x0 + Math.min(CS - 1, Math.floor(dx / sc))) * 4, q = (Y * W + X) * 3;
      const a = img[p + 3];
      if (a === 0) continue;
      const k = 1 - a / 255;
      let r = img[p] + out[q] * k, g = img[p + 1] + out[q + 1] * k, b = img[p + 2] + out[q + 2] * k;
      if (flash > 0) { r += (255 - r) * flash; g += (255 - g) * flash; b += (255 - b) * flash; }
      out[q] = r; out[q + 1] = g; out[q + 2] = b;
    }
  }
};

const splat = (acc: Float32Array, x: number, y: number, size: number, r: number, g: number, b: number, w: number) => {
  const h = size / 2, x0 = x - h, x1 = x + h, y0 = y - h, y1 = y + h;
  let ix0 = Math.floor(x0), ix1 = Math.ceil(x1) - 1, iy0 = Math.floor(y0), iy1 = Math.ceil(y1) - 1;
  if (ix1 < 0 || iy1 < 0 || ix0 >= W || iy0 >= H) return;
  if (ix0 < 0) ix0 = 0; if (iy0 < 0) iy0 = 0; if (ix1 >= W) ix1 = W - 1; if (iy1 >= H) iy1 = H - 1;
  const round = size > 5, rr = h * h;
  for (let py = iy0; py <= iy1; py++) {
    const wy = Math.min(y1, py + 1) - Math.max(y0, py);
    let p = (py * W + ix0) * 4;
    for (let px = ix0; px <= ix1; px++, p += 4) {
      let ww = (Math.min(x1, px + 1) - Math.max(x0, px)) * wy * w;
      if (round) { const dx = px + 0.5 - x, dy = py + 0.5 - y, e = h + 0.5 - Math.sqrt(dx * dx + dy * dy); if (e <= 0) continue; if (e < 1) ww *= e; void rr; }
      acc[p] += r * ww; acc[p + 1] += g * ww; acc[p + 2] += b * ww; acc[p + 3] += ww;
    }
  }
};

const boxBlur = (src: Float32Array, dst: Float32Array, w: number, h: number, r: number, horiz: boolean) => {
  const n = horiz ? w : h, m = horiz ? h : w, inv = 1 / (2 * r + 1);
  for (let j = 0; j < m; j++) {
    for (let ch = 0; ch < 3; ch++) {
      let s = 0;
      const at = (i: number) => { i = i < 0 ? 0 : i >= n ? n - 1 : i; return (horiz ? j * w + i : i * w + j) * 3 + ch; };
      for (let i = -r; i <= r; i++) s += src[at(i)];
      for (let i = 0; i < n; i++) { dst[at(i)] = s * inv; s += src[at(i + r + 1)] - src[at(i - r)]; }
    }
  }
};

export type FrameOpts = {fps: number; shutter: number; glow: number; hero: number; haze: number; star: number};
export const OPTS: FrameOpts = {fps: 25, shutter: 0.6, glow: 0.6, hero: 0.08, haze: 0.06, star: 1.6};

// Draw time t of a system into rgba (Uint8ClampedArray, W*H*4).
// Order: void, particles still in their source cell, settled particles of the target's bg
// layer, the particles in flight (+ bloom), then the settled foreground layers (so a landed
// title stays crisp while the background swarms in behind it).
export const drawFrame = (s: Sys, t: number, buf: Buffers, rgba: Uint8ClampedArray, opt: FrameOpts) => {
  const {out, acc, gl, tmp, voidBg} = buf;
  out.set(voidBg);
  const n = s.n;
  for (let k = 0; k < n; k++) { const i = s.orderS[k]; if (t < s.td[i]) blit(out, s.src.layers[s.sL[i]].img, s.sC[i], 0); }
  const fd = s.plan.flash ?? 0.28;
  // landing overshoot: a landed layer is drawn scaled about its centre, 1 + A at its landing
  // time, ringing back to exactly 1 within ~0.25 s
  const scl = s.tgt.layers.map((l, li) => {
    const A = s.plan.punch?.[l.name];
    if (!A) return 1;
    const T = (s.plan.land[l.name] ?? 0) + (s.plan.spreads?.[l.name] ?? s.plan.spread) / 2, d = t - T;
    if (d < 0 || d > 0.26) return d < 0 ? 1 + A : 1;
    return 1 + A * Math.exp(-d * 16) * Math.cos(d * 26) * (1 - d / 0.26);
  });
  const settle = (fg: boolean) => {
    for (let k = 0; k < n; k++) {
      const i = s.orderT[k];
      if ((s.tL[i] > 0) !== fg || t < s.ta[i]) continue;
      const d = (t - s.ta[i]) / fd;
      const li = s.tL[i], f = d < 1 ? 0.5 * (1 - d) * (1 - d) : 0;
      if (scl[li] !== 1) blitScaled(out, s.tgt.layers[li].img, s.tC[i], f, scl[li], s.tBox[li]);
      else blit(out, s.tgt.layers[li].img, s.tC[i], f);
    }
  };
  settle(false);
  acc.fill(0); gl.fill(0);
  let flying = 0;
  const dt = opt.shutter / opt.fps;
  for (let i = 0; i < n; i++) {
    if (t < s.td[i] || t >= s.ta[i]) continue;
    flying++;
    const f = place(s, i, t);
    const X1 = pos[0], Y1 = pos[1], Z1 = Math.min(pos[2], F - 300);
    place(s, i, t - dt);
    const X0 = pos[0], Y0 = pos[1], Z0 = Math.min(pos[2], F - 300);
    const k1 = F / (F - Z1), k0 = F / (F - Z0);
    const x1 = W / 2 + X1 * k1, y1 = H / 2 + Y1 * k1, x0 = W / 2 + X0 * k0, y0 = H / 2 + Y0 * k0;
    const u = s.u, ku = i * 6;
    // colour: the source pixel's colour while flying, the target's as it lands
    const b = smooth((t - (s.ta[i] - s.plan.arrDur * 0.85)) / (s.plan.arrDur * 0.75));
    const ci = i * 4;
    // depth shading: far particles darker, near ones brighter
    const boost = 1 + f * (Math.min(1.25, Math.max(0.28, 0.2 + 0.8 * k1 * k1)) - 1);
    let r = (s.sc[ci] + (s.tc[ci] - s.sc[ci]) * b) * boost, g = (s.sc[ci + 1] + (s.tc[ci + 1] - s.sc[ci + 1]) * b) * boost, bl = (s.sc[ci + 2] + (s.tc[ci + 2] - s.sc[ci + 2]) * b) * boost;
    // far particles drift toward a cold blue, as in aerial perspective
    const cold = f * Math.min(0.65, Math.max(0, (1 - k1) * 1.6));
    r += (70 - r) * cold; g += (120 - g) * cold; bl += (255 - bl) * cold;
    const alpha = s.sc[ci + 3] + (s.tc[ci + 3] - s.sc[ci + 3]) * b;
    // one particle in five is a "hero": bigger and fully opaque; the rest thin out into a dim
    // haze while they fly, so the cloud reads as separate particles with depth
    const hero = u[ku + 3] < opt.hero;
    const dof = Math.min(1, Math.abs(Z1 - 100) / 800) * f;
    const size = hero ? (CS + f * (0.6 + 2.4 * (u[ku + 3] / opt.hero))) * k1 + dof * 6 : CS * (1 - 0.45 * f) * k1 + dof * 2.5;
    const inten = alpha * (hero ? 1 : 1 - (1 - opt.haze) * f) * Math.min(1, Math.pow(4.5 / Math.max(4.5, size), 1.5));
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.min(16, Math.ceil(len / Math.max(1.2, size * 0.6))));
    const wStep = inten * Math.max(1 / steps, Math.min(1, 2.0 / steps));
    for (let j = 0; j < steps; j++) {
      const q = steps === 1 ? 1 : (j + 1) / steps;
      splat(acc, x0 + (x1 - x0) * q, y0 + (y1 - y0) * q, size, r, g, bl, wStep);
    }
    // bloom: heroes glow with speed; a few twinkling "stars"
    const speed = (len * opt.fps) / opt.shutter;
    const star = u[ku + 4] < 0.02 ? (0.55 + 0.45 * Math.sin(17 * t + 40 * u[ku])) * opt.star : 0;
    const gw = f * ((hero ? opt.glow * (0.03 + 0.2 * Math.min(1, speed / 2600)) : 0) + star) * alpha;
    if (gw > 0.001) {
      const gx = Math.floor(x1 / 4), gy = Math.floor(y1 / 4);
      if (gx >= 0 && gy >= 0 && gx < QW && gy < QH) { const p = (gy * QW + gx) * 3; gl[p] += (r + 30) * gw; gl[p + 1] += (g + 30) * gw; gl[p + 2] += (bl + 30) * gw; }
    }
  }
  if (flying > 0) {
    for (let p = 0, q = 0; p < W * H * 4; p += 4, q += 3) {
      const w = acc[p + 3];
      if (w <= 0) continue;
      const a = w < 1 ? w : 1, iw = a / w;
      out[q] = out[q] * (1 - a) + acc[p] * iw; out[q + 1] = out[q + 1] * (1 - a) + acc[p + 1] * iw; out[q + 2] = out[q + 2] * (1 - a) + acc[p + 2] * iw;
    }
    boxBlur(gl, tmp, QW, QH, 3, true); boxBlur(tmp, gl, QW, QH, 3, false);
    boxBlur(gl, tmp, QW, QH, 3, true); boxBlur(tmp, gl, QW, QH, 3, false);
    for (let y = 0; y < H; y++) {
      const fy = Math.min(QH - 1.001, Math.max(0, y / 4 - 0.375)), y0 = Math.floor(fy), wy = fy - y0;
      for (let x = 0; x < W; x++) {
        const fx = Math.min(QW - 1.001, Math.max(0, x / 4 - 0.375)), x0 = Math.floor(fx), wx = fx - x0;
        const a = (y0 * QW + x0) * 3, b = a + 3, c = a + QW * 3, d = c + 3, q = (y * W + x) * 3;
        for (let ch = 0; ch < 3; ch++) out[q + ch] += (gl[a + ch] * (1 - wx) + gl[b + ch] * wx) * (1 - wy) + (gl[c + ch] * (1 - wx) + gl[d + ch] * wx) * wy;
      }
    }
  }
  settle(true);
  for (let p = 0, q = 0; p < W * H * 4; p += 4, q += 3) { rgba[p] = out[q]; rgba[p + 1] = out[q + 1]; rgba[p + 2] = out[q + 2]; rgba[p + 3] = 255; }
  return flying;
};
