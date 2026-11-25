import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';
import {PANEL198, BAND198} from './Ep198';

// The post's hero: the AaaPipeline3D scene of https://postgres.ai/blog/20261123-pgaibench
// (docs repo src/components/AaaPipeline3D/index.tsx, origin/master). The geometry, the dark palette,
// the camera of the WIDE layout and the packet timings are copied from that component. Changes for video:
// - the clock is the Remotion frame, not requestAnimationFrame, so every frame is deterministic;
// - the story is a list of timed events (rehearse, review, apply, back, reject, feedback), not a 9 s loop;
// - the camera moves between keyframes per spoken beat;
// - the labels are the same words and pill styles, at 30 px or more; the 9 px canvas texts are left out.

type Vec3 = readonly [number, number, number];
type FlowId = 'rehearse' | 'telemetry' | 'review' | 'apply' | 'feedback';
type Rgb = readonly [number, number, number];

const AN_X = -1.68, AU_X = 1.68, CW = 1.24, CY0 = 2.58, CY1 = 3.38;
const SLAB = {x0: -2.68, x1: 2.68, z0: -0.82, z1: 0.82, y0: 1.48, y1: 1.58};
const SLAB_Y = (SLAB.y0 + SLAB.y1) / 2;
const X_REHEARSE = AN_X, X_APPLY = AU_X, X_REJECT = AU_X + 0.43, Y_REJECT = 2.32, Y_REVIEW = 3.16, Y_BACK = 2.82;
const CLONE_CYL = {r: 0.21, h: 0.44};
const CLONE_BOX = {x0: AN_X - 0.72, x1: AN_X + 0.72, z: 0.46, h: 0.64};
const CLONE_NODES = [{x: AN_X - 0.34, z: 0.06, role: 'primary'}, {x: AN_X + 0.34, z: -0.06, role: 'standby'}] as const;
const PROD = {x0: AU_X - 0.88, x1: AU_X + 0.88, z: 0.6, h: 0.76, inset: 0.08};
const PROD_CYL = {r: 0.17, hPrimary: 0.47, hStandby: 0.41};
const PROD_NODES = [
  {x: AU_X - 0.49, z: 0.2, h: PROD_CYL.hPrimary, primary: true},
  {x: AU_X + 0.09, z: -0.26, h: PROD_CYL.hStandby, primary: false},
  {x: AU_X + 0.49, z: 0.22, h: PROD_CYL.hStandby, primary: false},
] as const;
const TEL_BRICK = {w: 0.24, h: 0.24, z: 0.14};
const TEL_CLONE: Vec3 = [CLONE_BOX.x0 - TEL_BRICK.w / 2 - 0.02, 0, 0];
const TEL_PROD: Vec3 = [PROD.x1 + TEL_BRICK.w / 2 + 0.02, 0, 0];
const X_FB_R = 3.08, Y_FB_TOP = 3.74;
const P_FB_TO_AN: Vec3[] = [[TEL_PROD[0], TEL_BRICK.h + 0.06, 0], [X_FB_R, TEL_BRICK.h + 0.06, 0], [X_FB_R, Y_FB_TOP, 0], [AN_X, Y_FB_TOP, 0], [AN_X, CY1, 0]];
const P_FB_TO_AU: Vec3[] = [[TEL_PROD[0], TEL_BRICK.h + 0.06, 0], [X_FB_R, TEL_BRICK.h + 0.06, 0], [X_FB_R, Y_FB_TOP, 0], [AU_X, Y_FB_TOP, 0], [AU_X, CY1, 0]];
const P_REHEARSE: [Vec3, Vec3] = [[X_REHEARSE, CY0, 0], [X_REHEARSE, CLONE_BOX.h, 0]];
const P_APPLY: [Vec3, Vec3] = [[X_APPLY, CY0, 0], [X_APPLY, PROD.h, 0]];
const P_REVIEW: [Vec3, Vec3] = [[AN_X + CW / 2, Y_REVIEW, 0], [AU_X - CW / 2, Y_REVIEW, 0]];
const P_BACK: [Vec3, Vec3] = [[AU_X - CW / 2, Y_BACK, 0], [AN_X + CW / 2, Y_BACK, 0]];
const P_REJECT: [Vec3, Vec3] = [[X_REJECT, CY0, 0], [X_REJECT, Y_REJECT, 0]];

const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const dist3 = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
const samplePolyline = (pts: Vec3[], k: number): Vec3 => {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const d = dist3(pts[i], pts[i + 1]); segs.push(d); total += d; }
  const target = Math.max(0, Math.min(1, k)) * total;
  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    if (acc + segs[i] >= target || i === segs.length - 1) return lerp3(pts[i], pts[i + 1], segs[i] > 0 ? (target - acc) / segs[i] : 0);
    acc += segs[i];
  }
  return pts[pts.length - 1];
};
const slicePolyline = (pts: Vec3[], k0: number, k1: number): Vec3[] => {
  const a = Math.max(0, Math.min(1, k0)), b = Math.max(a, Math.min(1, k1));
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const d = dist3(pts[i], pts[i + 1]); segs.push(d); total += d; }
  if (total <= 0) return [pts[0]];
  const t0 = a * total, t1 = b * total;
  const out: Vec3[] = [samplePolyline(pts, a)];
  let acc = 0;
  for (let i = 0; i < segs.length; i++) { acc += segs[i]; if (acc > t0 && acc < t1) out.push(pts[i + 1]); }
  out.push(samplePolyline(pts, b));
  return out;
};

// the dark palette of the component (canvas) and of styles.module.css (labels)
const P = {
  grid: [255, 255, 255] as Rgb, gridMajor: 0.13, gridMinor: 0.045,
  fill: 'rgba(38, 40, 45, 0.84)', fillBack: 'rgba(38, 40, 45, 0.45)',
  glass: 'rgba(120, 140, 180, 0.13)', glassSide: 'rgba(120, 140, 180, 0.2)',
  edge: 'rgba(236, 236, 230, 0.48)', soft: 'rgba(236, 236, 230, 0.2)', faint: 'rgba(236, 236, 230, 0.09)', muted: 'rgba(236, 236, 230, 0.5)',
  bg: [27, 27, 29] as Rgb,
  flow: {rehearse: [124, 163, 248], telemetry: [56, 189, 248], feedback: [56, 189, 248], review: [178, 146, 250], apply: [62, 199, 145], reject: [242, 124, 113]} as Record<FlowId | 'reject', Rgb>,
};
export const CSS = {ink: '#ecece6', muted: '#a3a39d', pill: '#1b1b1d', rehearse: '#7ca3f8', telemetry: '#38bdf8', feedback: '#38bdf8', review: '#b292fa', apply: '#3ec791', reject: '#f27c71'};
const rgba = (c: Rgb, a: number) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
const DEG = Math.PI / 180;
const easeIO = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const span = (u: number, a: number, b: number) => (u < a || u > b ? -1 : (u - a) / (b - a));
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ---------- camera ---------- */
export type Cam = {at: number; move?: number; yaw: number; pitch: number; dist: number; focal: number; tx: number; ty: number; ox: number; oy: number};
// the WIDE layout of the component; focal and oy fitted to the 1560x670 panel
export const WIDE: Omit<Cam, 'at' | 'move'> = {yaw: -8, pitch: 13, dist: 10.4, focal: 0.99, tx: 0.05, ty: 1.84, ox: 0.5, oy: 0.55};
type Proj = {x: number; y: number; z: number};
const makeCam = (c: Omit<Cam, 'at'>, w: number, h: number) => {
  const yaw = c.yaw * DEG, pitch = Math.min(60, Math.max(2, c.pitch)) * DEG;
  const [tx, ty, tz] = [c.tx, c.ty, 0];
  const cp = Math.cos(pitch);
  const C: Vec3 = [tx + c.dist * cp * Math.sin(yaw), ty + c.dist * Math.sin(pitch), tz + c.dist * cp * Math.cos(yaw)];
  let fx = tx - C[0], fy = ty - C[1], fz = tz - C[2];
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl; fy /= fl; fz /= fl;
  const F: Vec3 = [fx, fy, fz];
  const rl = Math.hypot(fz, fx);
  const R: Vec3 = [-fz / rl, 0, fx / rl];
  const U: Vec3 = [R[1] * fz - R[2] * fy, R[2] * fx - R[0] * fz, R[0] * fy - R[1] * fx];
  const focal = c.focal * w, ox = c.ox * w, oy = c.oy * h;
  const project = (p: Vec3): Proj => {
    const dx = p[0] - C[0], dy = p[1] - C[1], dz = p[2] - C[2];
    const zc = dx * F[0] + dy * F[1] + dz * F[2];
    const s = focal / Math.max(zc, 0.05);
    return {x: ox + (dx * R[0] + dy * R[1] + dz * R[2]) * s, y: oy - (dx * U[0] + dy * U[1] + dz * U[2]) * s, z: zc};
  };
  return {C, R, F, project};
};
// keys[0] is the start pose; each later key starts a 1.6 s eased move toward its pose at its `at`
const camAt = (keys: Cam[], t: number): Omit<Cam, 'at' | 'move'> => {
  if (!keys.length) return WIDE;
  const F: (keyof Omit<Cam, 'at' | 'move'>)[] = ['yaw', 'pitch', 'dist', 'focal', 'tx', 'ty', 'ox', 'oy'];
  const pose = {...keys[0]};
  for (let i = 1; i < keys.length; i++) {
    const g = Easing.inOut(Easing.cubic)(Math.max(0, Math.min(1, (t - keys[i].at) / (keys[i].move ?? 1.6))));
    for (const f of F) pose[f] = pose[f] + (keys[i][f] - pose[f]) * g;
  }
  return pose;
};

/* ---------- the story: timed events ---------- */
export type Ev = {kind: 'rehearse' | 'review' | 'apply' | 'back' | 'reject' | 'feedback'; at: number};
export const cycle = (at: number, outcome: 'apply' | 'back' | 'reject'): Ev[] => [
  {kind: 'rehearse', at}, {kind: 'review', at: at + 3.3}, {kind: outcome, at: at + 5.15},
];
// how long each event keeps its flow lit, from the component's `active` windows
const LIT: Record<Ev['kind'], [FlowId, number, number][]> = {
  rehearse: [['rehearse', 0, 2.5], ['telemetry', 1.6, 3.9]],
  review: [['review', 0, 2.2]],
  apply: [['apply', -0.05, 3.25], ['telemetry', 1.65, 3.9], ['feedback', 1.75, 3.9]],
  back: [['review', 0, 2.35]],
  reject: [['review', 0, 2.35]],
  feedback: [['feedback', 0, 2.0], ['telemetry', 0, 2.0]],
};

export type Glow = Partial<Record<'analyst' | 'auditor' | 'actor' | 'clones' | 'prod', number>>;
export type Build = Partial<Record<'grid' | 'clones' | 'prod' | 'tel' | 'slab' | 'analyst' | 'auditor' | 'lanes' | 'feedback', number>>;
type State = {t: number; lit: Record<FlowId, number>; vis: Record<FlowId, number>; events: Ev[]; glow: Glow; build: Build; motion: number};

/* ---------- drawing: the component's frame(), as a pure function ---------- */
const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, cam: Omit<Cam, 'at'>, S: State) => {
  const {C, R, F, project} = makeCam(cam, w, h);
  const {lit, vis, t} = S;
  const B = (k: keyof Build) => (S.build[k] === undefined ? 1 : S.build[k]!);
  const poly = (pts: Vec3[], fill: string | null, stroke: string | null, lw = 1) => {
    ctx.beginPath();
    pts.forEach((p, i) => { const q = project(p); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  const polyline = (pts: Vec3[], stroke: string, lw = 1.2, dash: number[] | null = null) => {
    if (pts.length < 2) return;
    ctx.beginPath();
    pts.forEach((p, i) => { const q = project(p); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    ctx.strokeStyle = stroke; ctx.lineWidth = lw;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke();
    if (dash) ctx.setLineDash([]);
  };
  const line = (a: Vec3, b: Vec3, stroke: string | CanvasGradient, lw = 1, dash: number[] | null = null) => {
    const p = project(a), q = project(b);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
    ctx.strokeStyle = stroke; ctx.lineWidth = lw;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke();
    if (dash) ctx.setLineDash([]);
  };
  const rectZ = (z: number, x0: number, x1: number, y0: number, y1: number): Vec3[] => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];
  const rectY = (y: number, x0: number, x1: number, z0: number, z1: number): Vec3[] => [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
  const square = (q: {x: number; y: number}, size: number, fill: string | null, stroke: string | null, lw = 1) => {
    const s = size / 2;
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(q.x - s, q.y - s, size, size); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeRect(q.x - s, q.y - s, size, size); }
  };
  const arrow = (a: Vec3, b: Vec3, color: string, size = 5) => {
    const p = project(a), q = project(b);
    const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    ctx.beginPath();
    ctx.moveTo(q.x, q.y);
    ctx.lineTo(q.x - ux * size * 1.5 - uy * size * 0.75, q.y - uy * size * 1.5 + ux * size * 0.75);
    ctx.lineTo(q.x - ux * size * 1.5 + uy * size * 0.75, q.y - uy * size * 1.5 - ux * size * 0.75);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  };
  const withAlpha = (a: number, fn: () => void) => { if (a <= 0.001) return; const g = ctx.globalAlpha; ctx.globalAlpha = g * Math.min(1, a); fn(); ctx.globalAlpha = g; };
  const glowOn = (c: Rgb, k: number, fn: () => void) => {
    if (k <= 0.001) return;
    ctx.save(); ctx.shadowColor = rgba(c, 0.9 * k); ctx.shadowBlur = 14 * k; fn(); ctx.restore();
  };

  // grid
  const GX0 = -6.5, GX1 = 6.5, GZ0 = -4, GZ1 = 4, GS = 0.25;
  const NX = Math.round((GX1 - GX0) / GS), NZ = Math.round((GZ1 - GZ0) / GS), BUCKETS = 10;
  const fade = (x: number, z: number) => { const a = x / 5.6, b = (z + 0.4) / 3.4, r = Math.sqrt(a * a + b * b); return r >= 1 ? 0 : (1 - r) * (1 - r) * (3 - 2 * (1 - r)); };
  const drawGrid = () => {
    const gridPts: Proj[] = new Array((NX + 1) * (NZ + 1));
    for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) gridPts[i * (NZ + 1) + j] = project([GX0 + i * GS, 0, GZ0 + j * GS]);
    const paths: Path2D[][] = [[], []];
    for (let m = 0; m < 2; m++) for (let b = 0; b <= BUCKETS; b++) paths[m][b] = new Path2D();
    const seg = (i0: number, j0: number, i1: number, j1: number, major: boolean) => {
      const a = gridPts[i0 * (NZ + 1) + j0], b = gridPts[i1 * (NZ + 1) + j1];
      if (a.z < 0.4 || b.z < 0.4) return;
      const k = Math.round(fade(GX0 + ((i0 + i1) / 2) * GS, GZ0 + ((j0 + j1) / 2) * GS) * BUCKETS);
      if (!k) return;
      const p = paths[major ? 1 : 0][k];
      p.moveTo(a.x, a.y); p.lineTo(b.x, b.y);
    };
    for (let i = 0; i <= NX; i++) { const major = (i - 2) % 4 === 0; for (let j = 0; j < NZ; j++) seg(i, j, i, j + 1, major); }
    for (let j = 0; j <= NZ; j++) { const major = j % 4 === 0; for (let i = 0; i < NX; i++) seg(i, j, i + 1, j, major); }
    ctx.lineWidth = 1;
    for (let m = 0; m < 2; m++) for (let b = 1; b <= BUCKETS; b++) { ctx.strokeStyle = rgba(P.grid, (b / BUCKETS) * (m ? P.gridMajor : P.gridMinor)); ctx.stroke(paths[m][b]); }
  };
  const cylinder = (cx: number, cz: number, r: number, hh: number, stroke: string, lw = 1) => {
    const thR = Math.atan2(R[2], R[0]);
    const front = Math.cos(thR + Math.PI / 2) * -F[0] + Math.sin(thR + Math.PI / 2) * -F[2] > 0 ? 1 : -1;
    const rim = (y: number, th: number): Vec3 => [cx + r * Math.cos(th), y, cz + r * Math.sin(th)];
    const N = 24;
    const arc = (y: number, dir: number) => { const pts: Vec3[] = []; for (let i = 0; i <= N; i++) pts.push(rim(y, thR + dir * (Math.PI * i) / N)); return pts; };
    const frontBottom = arc(0, front), backTop = arc(hh, -front);
    ctx.beginPath();
    frontBottom.forEach((p, i) => { const q = project(p); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    for (let i = N; i >= 0; i--) { const q = project(backTop[N - i]); ctx.lineTo(q.x, q.y); }
    ctx.closePath(); ctx.fillStyle = P.fill; ctx.fill();
    polyline(arc(0, -front), P.faint, 1);
    polyline(frontBottom, stroke, lw);
    polyline(arc(hh * 0.5, front), P.soft, 1);
    line(rim(0, thR), rim(hh, thR), stroke, lw);
    line(rim(0, thR + Math.PI), rim(hh, thR + Math.PI), stroke, lw);
    const top: Vec3[] = [];
    for (let i = 0; i < N * 2; i++) top.push(rim(hh, (Math.PI * i) / N));
    poly(top, P.fill, stroke, lw);
  };
  const edgesOfBox = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, stroke: string, lw = 1) => {
    ctx.beginPath();
    const e: [Vec3, Vec3][] = [
      [[x0, y0, z0], [x1, y0, z0]], [[x0, y1, z0], [x1, y1, z0]], [[x0, y0, z1], [x1, y0, z1]], [[x0, y1, z1], [x1, y1, z1]],
      [[x0, y0, z0], [x0, y0, z1]], [[x1, y0, z0], [x1, y0, z1]], [[x0, y1, z0], [x0, y1, z1]], [[x1, y1, z0], [x1, y1, z1]],
      [[x0, y0, z0], [x0, y1, z0]], [[x1, y0, z0], [x1, y1, z0]], [[x0, y0, z1], [x0, y1, z1]], [[x1, y0, z1], [x1, y1, z1]],
    ];
    for (const [a, b] of e) { const p = project(a), q = project(b); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); }
    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
  };
  const drawTelemetryBrick = (center: Vec3, dirX: -1 | 1, tt: number, boost: number) => {
    const [cx, , cz] = center;
    const x0 = cx - TEL_BRICK.w / 2, x1 = cx + TEL_BRICK.w / 2, y0 = 0, y1 = TEL_BRICK.h, z0 = cz - TEL_BRICK.z, z1 = cz + TEL_BRICK.z;
    const c = P.flow.telemetry;
    const alpha = vis.telemetry * (0.55 + 0.45 * Math.max(lit.telemetry, boost));
    poly(rectY(y0, x0, x1, z0, z1), rgba(c, 0.08 * alpha), null);
    poly(rectZ(z1, x0, x1, y0, y1), rgba(c, 0.14 * alpha), null);
    const side = C[0] < x0 ? x0 : x1;
    poly([[side, y0, z0], [side, y0, z1], [side, y1, z1], [side, y1, z0]], rgba(c, 0.18 * alpha), null);
    poly(rectY(y1, x0, x1, z0, z1), rgba(c, 0.16 * alpha), null);
    edgesOfBox(x0, x1, y0, y1, z0, z1, rgba(c, 0.85 * alpha), 1.1);
    const beacon: Vec3 = [cx, y1 + 0.06, cz];
    line([cx, y1, cz], beacon, rgba(c, 0.9 * alpha), 1.2);
    const bq = project(beacon);
    ctx.fillStyle = rgba(c, (0.2 + 0.2 * boost) * alpha);
    ctx.beginPath(); ctx.arc(bq.x, bq.y, 5.5 + 2 * boost, 0, Math.PI * 2); ctx.fill();
    square(bq, 4.5, rgba(c, alpha), rgba(P.bg, 1), 0.9);
    const baseAngle = dirX < 0 ? -Math.PI * 0.68 : -Math.PI * 0.32, spread = 0.62;
    for (let i = 0; i < 3; i++) {
      const phase = S.motion ? (tt * 0.65 + i / 3) % 1 : 0.25 + i * 0.3;
      const rad = 10 + phase * (24 + 8 * boost);
      const fadeWave = Math.sin(Math.PI * phase) * (0.45 + 0.55 * boost) * alpha;
      if (fadeWave <= 0.02) continue;
      ctx.beginPath(); ctx.arc(bq.x, bq.y, rad, baseAngle - spread, baseAngle + spread);
      ctx.strokeStyle = rgba(c, fadeWave); ctx.lineWidth = 1.35; ctx.stroke();
    }
  };

  // events -> packets, flashes, ripples (timings from the component's frame())
  type Packet = {trailPts: Vec3[]; head: Vec3; c: Rgb; a: number};
  const below: Packet[] = [], above: Packet[] = [], flashes: {x: number; flow: FlowId; k: number}[] = [];
  const push = (pk: Packet) => (pk.head[1] < SLAB_Y ? below : above).push(pk);
  const passFlash = (x: number, y: number, fl: FlowId) => { const d = Math.abs(y - SLAB_Y); if (d < 0.48) flashes.push({x, flow: fl, k: d / 0.48}); };
  const along = (pts: [Vec3, Vec3], k: number, trail: number) => { const head = lerp3(pts[0], pts[1], k); return {trailPts: [lerp3(pts[0], pts[1], Math.max(0, k - trail)), head], head}; };
  const alongPoly = (pts: Vec3[], k: number, trail: number) => { const kk = Math.max(0, Math.min(1, k)); return {trailPts: slicePolyline(pts, Math.max(0, kk - trail), kk), head: samplePolyline(pts, kk)}; };
  let ripple = -1, cloneTelBoost = 0, prodTelBoost = 0, review = -1, arrive = -1, backAt = -1, halt = 0;
  for (const ev of S.events) {
    const u = t - ev.at;
    if (u < -0.01 || u > 4.5) continue;
    let s: number;
    if (ev.kind === 'rehearse') {
      s = span(u, 0, 1.55);
      if (s >= 0) { const pk = along(P_REHEARSE, easeIO(s), 0.12); push({...pk, c: P.flow.rehearse, a: vis.rehearse}); passFlash(X_REHEARSE, pk.head[1], 'rehearse'); }
      s = span(u, 1.5, 2.45); if (s >= 0) ripple = s;
      s = span(u, 1.55, 2.15);
      if (s >= 0) { const [a, b] = CLONE_NODES; below.push({...along([[a.x, CLONE_CYL.h * 0.5, a.z], [b.x, CLONE_CYL.h * 0.5, b.z]], easeIO(s), 0.45), c: P.flow.rehearse, a: vis.rehearse * 0.85}); }
      s = span(u, 1.65, 3.85); if (s >= 0) cloneTelBoost = Math.max(cloneTelBoost, Math.sin(Math.PI * s));
    } else if (ev.kind === 'review') {
      s = span(u, 0, 1.4); if (s >= 0) above.push({...along(P_REVIEW, easeIO(s), 0.14), c: P.flow.review, a: vis.review});
      s = span(u, 1.35, 2.1); if (s >= 0) review = s;
    } else if (ev.kind === 'apply') {
      s = span(u, 0, 1.6);
      if (s >= 0) { const pk = along(P_APPLY, easeIO(s), 0.11); push({...pk, c: P.flow.apply, a: vis.apply}); passFlash(X_APPLY, pk.head[1], 'apply'); }
      s = span(u, 1.55, 3.05); if (s >= 0) arrive = s;
      s = span(u, 1.7, 2.45);
      if (s >= 0) {
        const [pn, s1, s2] = PROD_NODES;
        const p0: Vec3 = [pn.x, pn.h * 0.45, pn.z];
        below.push({...along([p0, [s1.x, s1.h * 0.45, s1.z]], easeIO(s), 0.45), c: P.flow.apply, a: vis.apply * 0.85});
        below.push({...along([p0, [s2.x, s2.h * 0.45, s2.z]], easeIO(s), 0.45), c: P.flow.apply, a: vis.apply * 0.85});
      }
      s = span(u, 1.75, 3.75); if (s >= 0) prodTelBoost = Math.max(prodTelBoost, Math.sin(Math.PI * s));
      s = span(u, 1.85, 3.2); if (s >= 0) above.push({...alongPoly(P_FB_TO_AU, easeIO(s), 0.14), c: P.flow.feedback, a: vis.feedback * 0.9});
      s = span(u, 2.0, 3.8); if (s >= 0) above.push({...alongPoly(P_FB_TO_AN, easeIO(s), 0.1), c: P.flow.feedback, a: vis.feedback * 0.95});
    } else if (ev.kind === 'feedback') {
      s = span(u, 0, 2.0); if (s >= 0) prodTelBoost = Math.max(prodTelBoost, Math.sin(Math.PI * s));
      s = span(u, 0.1, 1.45); if (s >= 0) above.push({...alongPoly(P_FB_TO_AU, easeIO(s), 0.14), c: P.flow.feedback, a: vis.feedback * 0.9});
      s = span(u, 0.25, 2.05); if (s >= 0) above.push({...alongPoly(P_FB_TO_AN, easeIO(s), 0.1), c: P.flow.feedback, a: vis.feedback * 0.95});
    } else if (ev.kind === 'back') {
      s = span(u, 0, 1.5); if (s >= 0) above.push({...along(P_BACK, easeIO(s), 0.14), c: P.flow.review, a: vis.review});
      s = span(u, 1.45, 2.2); if (s >= 0) backAt = s;
    } else {
      s = span(u, 0, 0.55); if (s >= 0) above.push({...along(P_REJECT, easeIO(s), 0.3), c: P.flow.reject, a: vis.review});
      s = span(u, 0.5, 2.1); if (s >= 0) halt = Math.max(halt, 1 - s);
    }
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'butt';
  withAlpha(B('grid'), drawGrid);

  const flowAlpha = (fl: FlowId) => vis[fl] * (0.38 + 0.62 * lit[fl]);
  const vlane = (pts: [Vec3, Vec3], fl: FlowId, part: 'below' | 'above') => {
    const [a, b] = pts;
    const c = rgba(P.flow[fl], flowAlpha(fl));
    const lo = a[1] < b[1] ? a : b, hi = a[1] < b[1] ? b : a;
    if (part === 'below') { line(lo, [lo[0], SLAB.y0, lo[2]], c, 1.5); arrow([lo[0], lo[1] + 0.2, lo[2]], lo, c); }
    else { line([hi[0], SLAB.y1, hi[2]], hi, c, 1.5); square(project(hi), 5, rgba(P.bg, 1), c, 1.2); }
  };
  const drawPacket = (pk: Packet) => {
    const q = project(pk.head), tq = project(pk.trailPts[0]);
    const g0 = ctx.globalAlpha;
    ctx.globalAlpha = g0 * pk.a;
    const g = ctx.createLinearGradient(tq.x, tq.y, q.x, q.y);
    g.addColorStop(0, rgba(pk.c, 0)); g.addColorStop(1, rgba(pk.c, 0.85));
    ctx.strokeStyle = g; ctx.lineWidth = 3;
    ctx.beginPath();
    pk.trailPts.forEach((pt, i) => { const qp = project(pt); if (i) ctx.lineTo(qp.x, qp.y); else ctx.moveTo(qp.x, qp.y); });
    ctx.stroke();
    ctx.fillStyle = rgba(pk.c, 0.18);
    ctx.beginPath(); ctx.arc(q.x, q.y, 7, 0, Math.PI * 2); ctx.fill();
    square(q, 6, rgba(pk.c, 1), rgba(P.bg, 1), 1);
    ctx.globalAlpha = g0;
  };

  // bottom tier
  withAlpha(B('clones'), () => {
    const {x0, x1, z} = CLONE_BOX;
    poly(rectY(0, x0, x1, -z, z), P.fillBack, P.soft, 1);
    const [cn0, cn1] = CLONE_NODES;
    line([cn0.x, CLONE_CYL.h * 0.5, cn0.z], [cn1.x, CLONE_CYL.h * 0.5, cn1.z], P.muted, 1, [2, 2]);
    const ordered = [...CLONE_NODES].sort((a, b) => project([b.x, 0, b.z]).z - project([a.x, 0, a.z]).z);
    for (const nd of ordered) cylinder(nd.x, nd.z, CLONE_CYL.r, CLONE_CYL.h, P.edge, nd.role === 'primary' ? 1.15 : 1);
  });
  withAlpha(B('prod'), () => {
    const {x0, x1, z, h: ph, inset: i} = PROD;
    poly(rectY(0, x0, x1, -z, z), P.fillBack, null);
    edgesOfBox(x0 + i, x1 - i, 0, ph - i, -z + i, z - i, P.soft);
    const [pn, s1, s2] = PROD_NODES;
    line([pn.x, pn.h * 0.45, pn.z], [s1.x, s1.h * 0.45, s1.z], P.muted, 1, [2, 2]);
    line([pn.x, pn.h * 0.45, pn.z], [s2.x, s2.h * 0.45, s2.z], P.muted, 1, [2, 2]);
    const ordered = [...PROD_NODES].sort((a, b) => project([b.x, 0, b.z]).z - project([a.x, 0, a.z]).z);
    for (const nd of ordered) cylinder(nd.x, nd.z, PROD_CYL.r, nd.h, P.edge, nd.primary ? 1.2 : 1);
  });
  withAlpha(B('lanes'), () => { vlane(P_REHEARSE, 'rehearse', 'below'); vlane(P_APPLY, 'apply', 'below'); });
  for (const pk of below) drawPacket(pk);
  if (ripple >= 0) {
    const r = 0.22 + 0.42 * easeOut(ripple);
    const pts: Vec3[] = [];
    for (let i = 0; i < 40; i++) pts.push([AN_X + r * Math.cos((i / 40) * Math.PI * 2), CLONE_BOX.h, r * Math.sin((i / 40) * Math.PI * 2) * 0.65]);
    poly(pts, null, rgba(P.flow.rehearse, (1 - ripple) * vis.rehearse), 1.2);
  }
  withAlpha(B('clones'), () => {
    const {x0, x1, z, h: ch} = CLONE_BOX;
    const glow = Math.max(ripple >= 0 ? Math.sin(Math.PI * Math.min(1, ripple * 1.3)) * 0.75 * vis.rehearse : 0, S.glow.clones ?? 0);
    edgesOfBox(x0, x1, 0, ch, -z, z, P.soft, 1);
    if (glow > 0.01) glowOn(P.flow.rehearse, glow, () => edgesOfBox(x0, x1, 0, ch, -z, z, rgba(P.flow.rehearse, glow), 1.4));
  });
  if (arrive >= 0) {
    for (const d of [0, 0.25]) {
      const kk = arrive - d;
      if (kk < 0 || kk > 0.75) continue;
      const e = kk / 0.75, r = 0.24 + 0.52 * easeOut(e);
      const pts: Vec3[] = [];
      for (let i = 0; i < 40; i++) pts.push([AU_X + r * Math.cos((i / 40) * Math.PI * 2), PROD.h, r * Math.sin((i / 40) * Math.PI * 2) * 0.68]);
      poly(pts, null, rgba(P.flow.apply, (1 - e) * vis.apply), 1.3);
    }
  }
  withAlpha(B('prod'), () => {
    const {x0, x1, z, h: ph} = PROD;
    const glow = Math.max(arrive >= 0 ? Math.sin(Math.PI * Math.min(1, arrive * 1.4)) * 0.85 * vis.apply : 0, S.glow.prod ?? 0);
    const side = C[0] < x0 ? x0 : x1;
    poly([[side, 0, -z], [side, 0, z], [side, ph, z], [side, ph, -z]], P.glassSide, null);
    poly(rectZ(z, x0, x1, 0, ph), P.glass, null);
    poly(rectY(ph, x0, x1, -z, z), P.glass, null);
    edgesOfBox(x0, x1, 0, ph, -z, z, P.edge, 1.2);
    if (glow > 0.01) glowOn(P.flow.apply, glow, () => edgesOfBox(x0, x1, 0, ph, -z, z, rgba(P.flow.apply, glow), 1.6));
  });
  withAlpha(B('tel'), () => { drawTelemetryBrick(TEL_CLONE, -1, t, cloneTelBoost); drawTelemetryBrick(TEL_PROD, 1, t + 0.5, prodTelBoost); });

  // middle tier: the Actor slab
  withAlpha(B('slab'), () => {
    const {x0, x1, z0, z1, y0, y1} = SLAB;
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]] as const) line([x, y0, z], [x, 0, z], P.faint, 1, [2, 4]);
    poly(rectY(y0, x0, x1, z0, z1), P.glass, P.faint);
    poly(rectZ(z1, x0, x1, y0, y1), P.glassSide, null);
    const side = C[0] < x0 ? x0 : x1;
    poly([[side, y0, z0], [side, y0, z1], [side, y1, z1], [side, y1, z0]], P.glassSide, null);
    poly(rectY(y1, x0, x1, z0, z1), P.glass, null);
    edgesOfBox(x0, x1, y0, y1, z0, z1, P.edge, 1);
    const ga = S.glow.actor ?? 0;
    if (ga > 0.01) glowOn(P.flow.apply, ga, () => edgesOfBox(x0, x1, y0, y1, z0, z1, rgba([236, 236, 230], 0.5 + 0.5 * ga), 1.6));
    poly(rectY(y1, x0 + 0.1, x1 - 0.1, z0 + 0.1, z1 - 0.1), null, P.faint);
    ctx.beginPath();
    for (let x = x0 + 0.5; x < x1 - 0.2; x += 0.5) { const a = project([x, y1, z0 + 0.1]), b = project([x, y1, z1 - 0.1]); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    ctx.strokeStyle = P.faint; ctx.lineWidth = 0.75; ctx.stroke();
    for (const p of [{x: X_REHEARSE, flow: 'rehearse' as const}, {x: X_APPLY, flow: 'apply' as const}]) {
      const a = vis[p.flow] * (0.45 + 0.55 * lit[p.flow]);
      poly(rectY(y1, p.x - 0.09, p.x + 0.09, -0.09, 0.09), rgba(P.bg, 0.9), rgba(P.flow[p.flow], a), 1.2);
    }
    for (const fl of flashes) {
      const s = 0.1 + 0.32 * easeOut(fl.k);
      poly(rectY(y1, fl.x - s, fl.x + s, -s, s), null, rgba(P.flow[fl.flow], (1 - fl.k) * 0.9 * vis[fl.flow]), 1.2);
    }
  });

  // feedback loop
  withAlpha(B('feedback'), () => {
    const cf = rgba(P.flow.feedback, flowAlpha('feedback') * 0.78);
    polyline(P_FB_TO_AN, cf, 1.25, [4, 3]);
    line([AU_X, Y_FB_TOP, 0], [AU_X, CY1, 0], cf, 1.25, [4, 3]);
    square(project([AU_X, Y_FB_TOP, 0]), 4, cf, null);
    arrow([AU_X, CY1 + 0.22, 0], [AU_X, CY1, 0], cf, 4.5);
    arrow([AN_X, CY1 + 0.22, 0], [AN_X, CY1, 0], cf, 4.5);
  });

  // top tier: the cards
  const drawCard = (cx: number, glow: number, c: Rgb) => {
    const x0 = cx - CW / 2, x1 = cx + CW / 2;
    poly(rectZ(-0.3, x0 + 0.1, x1 + 0.1, CY0 + 0.09, CY1 + 0.09), P.fillBack, P.faint);
    poly(rectZ(0, x0, x1, CY0, CY1), P.fill, P.edge);
    if (glow > 0.01) glowOn(c, glow, () => poly(rectZ(0, x0, x1, CY0, CY1), null, rgba(c, glow), 2));
    poly(rectZ(0, x0 + 0.05, x1 - 0.05, CY0 + 0.05, CY1 - 0.05), null, P.faint);
    for (const [y, len] of [[CY0 + 0.25, 0.62], [CY0 + 0.15, 0.4]] as const) line([x0 + 0.13, y, 0], [x0 + 0.13 + len, y, 0], P.soft);
  };
  withAlpha(B('analyst'), () => drawCard(AN_X, S.glow.analyst ?? 0, P.flow.rehearse));
  withAlpha(B('auditor'), () => drawCard(AU_X, S.glow.auditor ?? 0, P.flow.review));
  withAlpha(B('lanes'), () => {
    vlane(P_REHEARSE, 'rehearse', 'above');
    vlane(P_APPLY, 'apply', 'above');
    const cr = rgba(P.flow.review, flowAlpha('review'));
    const [ra, rb] = P_REVIEW;
    line(ra, rb, cr, 1.5); square(project(ra), 5, rgba(P.bg, 1), cr, 1.2); arrow([rb[0] - 0.2, rb[1], 0], rb, cr);
    const [ba, bb] = P_BACK;
    const cb = rgba(P.flow.review, flowAlpha('review') * 0.8);
    line(ba, [bb[0] + 0.08, bb[1], 0], cb, 1.2, [3, 3]); arrow([bb[0] + 0.2, bb[1], 0], bb, cb, 4.5);
    const ar = vis.review * (0.55 + 0.45 * halt);
    const [ja, jb] = P_REJECT;
    line(ja, jb, rgba(P.flow.reject, ar), 1.5);
    line([jb[0] - 0.11, jb[1], 0], [jb[0] + 0.11, jb[1], 0], rgba(P.flow.reject, ar), 2.5 + 1.5 * halt);
  });
  if (review >= 0) { const s = 0.06 + 0.14 * easeOut(review), [, rb] = P_REVIEW; poly(rectZ(0, rb[0] - s, rb[0] + s, rb[1] - s, rb[1] + s), null, rgba(P.flow.review, (1 - review) * vis.review), 1.2); }
  if (backAt >= 0) { const s = 0.06 + 0.14 * easeOut(backAt), [, bb] = P_BACK; poly(rectZ(0, bb[0] - s, bb[0] + s, bb[1] - s, bb[1] + s), null, rgba(P.flow.review, (1 - backAt) * vis.review), 1.2); }
  if (halt > 0) {
    const q = project(P_REJECT[1]);
    const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 16);
    g.addColorStop(0, rgba(P.flow.reject, 0.32 * halt * vis.review)); g.addColorStop(1, rgba(P.flow.reject, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, 16, 0, Math.PI * 2); ctx.fill();
  }
  for (const pk of above) drawPacket(pk);
  return {project, halt};
};

/* ---------- labels (styles.module.css, dark theme), anchors from the WIDE layout ---------- */
type LabelId = 'analyst' | 'auditor' | 'actor' | 'clones' | 'prod' | 'rehearse' | 'telemetry' | 'feedback' | 'review' | 'sendback' | 'apply' | 'reject' | 'nowriteAn' | 'nowriteAu';
type Place = {at: Vec3; dx: number; dy: number; ax: number; ay: number};
const PLACE: Record<LabelId, Place> = {
  analyst: {at: [AN_X - CW / 2, CY1, 0], dx: 5, dy: 4, ax: 0, ay: 0},
  auditor: {at: [AU_X - CW / 2, CY1, 0], dx: 5, dy: 4, ax: 0, ay: 0},
  nowriteAn: {at: [AN_X, CY0, 0], dx: 0, dy: -4, ax: 0.5, ay: 1},
  nowriteAu: {at: [AU_X, CY0, 0], dx: 0, dy: -4, ax: 0.5, ay: 1},
  actor: {at: [-0.04, SLAB.y1, 0.28], dx: 0, dy: 0, ax: 0.5, ay: 0.5},
  clones: {at: [AN_X, 0, CLONE_BOX.z + 0.08], dx: 0, dy: 12, ax: 0.5, ay: 0},
  prod: {at: [AU_X, 0, PROD.z + 0.08], dx: 0, dy: 12, ax: 0.5, ay: 0},
  rehearse: {at: [X_REHEARSE, 1.06, 0], dx: 10, dy: 0, ax: 0, ay: 0.5},
  telemetry: {at: [TEL_CLONE[0] - 0.14, 0.55, 0], dx: -8, dy: 0, ax: 1, ay: 0.5},
  feedback: {at: [0, Y_FB_TOP, 0], dx: 0, dy: -4, ax: 0.5, ay: 1},
  review: {at: [0, Y_REVIEW, 0], dx: 0, dy: -4, ax: 0.5, ay: 1},
  sendback: {at: [0, Y_BACK, 0], dx: 0, dy: 4, ax: 0.5, ay: 0},
  apply: {at: [X_APPLY, 2.08, 0], dx: -10, dy: 0, ax: 1, ay: 0.5},
  reject: {at: [X_REJECT, Y_REJECT, 0], dx: 15, dy: 0, ax: 0, ay: 0.5},
};
const ORDER: LabelId[] = ['analyst', 'auditor', 'actor', 'clones', 'prod', 'feedback', 'telemetry', 'review', 'sendback', 'apply', 'reject', 'rehearse', 'nowriteAn', 'nowriteAu'];
type LabelDef = {text: string; hint?: string; flow?: FlowId | 'reject'; dashed?: boolean; node?: boolean};
const LABELS: Record<LabelId, LabelDef> = {
  analyst: {text: 'Analyst', node: true},
  auditor: {text: 'Auditor', node: true},
  actor: {text: 'Actor', hint: 'deterministic · sole write path', node: true},
  clones: {text: 'Clones', node: true},
  prod: {text: 'Production Postgres', node: true},
  rehearse: {text: 'rehearse', flow: 'rehearse'},
  telemetry: {text: 'telemetry', flow: 'telemetry', dashed: true},
  feedback: {text: 'feedback · improve over time', flow: 'feedback', dashed: true},
  review: {text: 'change request', flow: 'review'},
  sendback: {text: 'send back', flow: 'review', dashed: true},
  apply: {text: 'approve → apply', flow: 'apply'},
  reject: {text: 'reject', flow: 'reject'},
  nowriteAn: {text: 'no write access'},
  nowriteAu: {text: 'no write access'},
};
const FLOW_OF: Partial<Record<LabelId, FlowId>> = {rehearse: 'rehearse', clones: 'rehearse', telemetry: 'telemetry', feedback: 'feedback', review: 'review', sendback: 'review', reject: 'review', apply: 'apply', prod: 'apply'};

/* ---------- the scene component ---------- */
export type Scene3DProps = {
  w: number; h: number; dpr: number; // logical size (component px) and pixel ratio
  cam: Cam[];
  events?: Ev[];
  focus?: {flows: FlowId[]; at: number; until?: number}[]; // other flows dim to 0.16, as when a pill is hovered
  glow?: {key: keyof Glow; at: number; until?: number}[];
  build?: Partial<Record<keyof Build, number>>; // appear times
  labels?: Partial<Record<LabelId, number>> | 'all' | 'none'; // appear times
  labelScale?: number; // label font px multiplier over the component's 13 px / 10.5 px
  hot?: {id: LabelId; at: number}[]; // labels that pop
  labelsUntil?: Partial<Record<LabelId, number>>; // fade-out times
  breathe?: number;
};
const ramp = (t: number, a: number, b?: number, r = 0.45) => {
  const up = Math.max(0, Math.min(1, (t - a) / r));
  const dn = b === undefined ? 1 : Math.max(0, Math.min(1, (b + r - t) / r));
  return Easing.inOut(Easing.quad)(Math.min(up, dn));
};
export const Scene3D: React.FC<Scene3DProps> = ({w, h, dpr, cam, events = [], focus = [], glow = [], build, labels = 'all', labelScale = 3.0, hot = [], breathe = 1, labelsUntil = {}}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ref = useRef<HTMLCanvasElement>(null);
  const c0 = camAt(cam, t);
  const c = {...c0, yaw: c0.yaw + breathe * (Math.sin(t * 0.29) * 2.0 + Math.sin(t * 0.13) * 0.9), pitch: c0.pitch + breathe * Math.sin(t * 0.21 + 1) * 0.9};
  // lit: the component eases toward `active` with 1 - exp(-6 dt); here a ramp over the event windows
  const lit: Record<FlowId, number> = {rehearse: 0, telemetry: 0, feedback: 0, review: 0, apply: 0};
  for (const ev of events) for (const [fl, a, b] of LIT[ev.kind]) lit[fl] = Math.max(lit[fl], ramp(t, ev.at + a, ev.at + b, 0.35));
  const vis: Record<FlowId, number> = {rehearse: 1, telemetry: 1, feedback: 1, review: 1, apply: 1};
  for (const f of focus) {
    const k = ramp(t, f.at, f.until, 0.5);
    for (const fl of Object.keys(vis) as FlowId[]) if (!f.flows.includes(fl)) vis[fl] = Math.min(vis[fl], 1 - 0.84 * k);
  }
  const G: Glow = {};
  for (const g of glow) G[g.key] = Math.max(G[g.key] ?? 0, ramp(t, g.at, g.until, 0.4));
  const Bd: Build = {};
  if (build) for (const k of Object.keys(build) as (keyof Build)[]) Bd[k] = ramp(t, build[k]!, undefined, 0.6);
  const S: State = {t, lit, vis, events, glow: G, build: Bd, motion: 1};
  const {project} = makeCam(c, w, h);
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    draw(ctx, w, h, dpr, c, S);
  });
  // labels: same collision rule as placeLabels(), with sizes estimated from the fonts
  const fs = (13 * labelScale) / dpr, ps = (10.5 * labelScale) / dpr; // in logical px
  const boxes: {l: number; t: number; w: number; h: number}[] = [];
  const out: React.ReactNode[] = [];
  const dimFocus = (id: LabelId) => { const fl = FLOW_OF[id]; return fl ? vis[fl] : 1; };
  for (const id of ORDER) {
    const at = labels === 'all' ? (id.startsWith('nowrite') ? undefined : 0) : labels === 'none' ? undefined : labels[id];
    if (at === undefined) continue;
    const k = Math.max(0, Math.min(1, (t - at) / 0.35)) * (labelsUntil[id] === undefined ? 1 : Math.max(0, Math.min(1, (labelsUntil[id]! + 0.35 - t) / 0.35)));
    if (k <= 0) continue;
    const L = LABELS[id];
    const width = L.node ? L.text.length * fs * 0.58 + (L.hint ? (14 * labelScale) / 2.4 / dpr + L.hint.length * ps * 0.6 : 0) : L.flow && L.flow !== 'reject' ? L.text.length * ps * 0.6 + ps * 1.9 : L.text.length * ps * 0.6;
    const height = L.node ? fs * 1.25 : ps * 1.75;
    const pl = PLACE[id];
    const a = project(pl.at);
    if (a.x < -10 || a.x > w + 10 || a.y < -6 || a.y > h + 6) continue; // anchor out of view: no label
    const dd = labelScale / 2.4;
    const l = Math.min(Math.max(a.x + pl.dx * dd - pl.ax * width, 4), w - 4 - width);
    const tt0 = a.y + pl.dy * dd - pl.ay * height;
    const GAP = 3;
    const free = (tt: number) => boxes.every((b) => !(l < b.l + b.w + GAP && l + width + GAP > b.l && tt < b.t + b.h + GAP && tt + height + GAP > b.t));
    let top = Math.min(Math.max(tt0, 4), h - 4 - height);
    for (let q = 0; q <= 30; q++) {
      const down = Math.min(Math.max(tt0 + q * 3, 4), h - 4 - height), up = Math.min(Math.max(tt0 - q * 3, 4), h - 4 - height);
      if (free(down)) { top = down; break; }
      if (free(up)) { top = up; break; }
    }
    boxes.push({l, t: top, w: width, h: height});
    const hk = Math.max(0, ...hot.filter((x) => x.id === id).map((x) => (t < x.at ? 0 : Math.max(0, 1 - (t - x.at) / 1.2))));
    const sc = 1 + 0.14 * Math.sin(Math.PI * Math.min(1, hk * 1.6)) * (hk > 0 ? 1 : 0);
    const col = L.flow ? CSS[L.flow] : CSS.ink;
    const style: React.CSSProperties = {position: 'absolute', left: l * dpr, top: top * dpr, opacity: k * (dimFocus(id) < 0.99 ? 0.25 + 0.75 * (dimFocus(id) - 0.16) / 0.84 : 1), transform: `scale(${sc})`, transformOrigin: 'left center', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center'};
    if (L.node) {
      out.push(
        <div key={id} style={{...style, alignItems: 'baseline', gap: 14 * dd, ...(L.hint ? {background: 'rgba(27,27,29,0.72)', borderRadius: 8, padding: '0 10px', marginLeft: -10} : {})}}>
          <span style={{color: CSS.ink, font: `600 ${13 * labelScale}px/1.2 Inter, sans-serif`, letterSpacing: '-0.01em', textShadow: '0 2px 10px #1b1b1d'}}>{L.text}</span>
          {L.hint ? <span style={{color: CSS.muted, font: `400 ${10.5 * labelScale}px/1.2 'JetBrains Mono', monospace`}}>{L.hint}</span> : null}
        </div>,
      );
    } else if (L.flow === 'reject' || !L.flow) {
      out.push(<div key={id} style={{...style, color: L.flow ? CSS.reject : CSS.muted, font: `${L.flow ? 600 : 500} ${10.5 * labelScale}px/1.2 'JetBrains Mono', monospace`, textShadow: '0 2px 8px #1b1b1d'}}>{L.text}</div>);
    } else {
      out.push(
        <div key={id} style={{...style, gap: 5 * labelScale / 2, padding: `${2 * labelScale / 2}px ${7 * labelScale / 2}px ${2 * labelScale / 2}px ${6 * labelScale / 2}px`, border: `${Math.max(1.5, labelScale / 2)}px ${L.dashed ? 'dashed' : 'solid'} color-mix(in srgb, ${col} 36%, transparent)`, borderRadius: 4 * labelScale / 2, background: `color-mix(in srgb, ${col} 7%, rgba(27,27,29,0.9))`}}>
          <span style={{width: 5 * labelScale / 2, height: 5 * labelScale / 2, borderRadius: 1 * labelScale / 2, background: col, flex: 'none'}} />
          <span style={{color: `color-mix(in srgb, ${col} 70%, ${CSS.ink})`, font: `500 ${10.5 * labelScale}px/1.3 'JetBrains Mono', monospace`}}>{L.text}</span>
        </div>,
      );
    }
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w * dpr, height: h * dpr}}>
      <canvas ref={ref} width={Math.round(w * dpr)} height={Math.round(h * dpr)} style={{position: 'absolute', left: 0, top: 0, width: w * dpr, height: h * dpr}} />
      {out}
    </div>
  );
};

/* ---------- center card: the hero scene in the panel ---------- */
// caption: the strip text of a row, typed at 30 chars/s in a bar above the scene; `hi` words turn
// yellow when they are said; prefixLen characters of line 1 are yellow from the start.
export type Caption = {lines: string[]; lineAt?: number[]; prefixLen?: number; hi?: {word: string; at: number}[]; size?: number; side?: number};
export type Aaa3DProps = Omit<Scene3DProps, 'w' | 'h' | 'dpr'> & {durationSec: number; title?: {text: string; at: number}[]; caption?: Caption};
export const Aaa3D198: React.FC<Aaa3DProps> = ({durationSec, title = [], caption, ...rest}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  void durationSec;
  const t = frame / fps;
  const k = spring({frame, fps, config: {damping: 16, stiffness: 160, mass: 0.7}});
  const out = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const cur = [...title].reverse().find((x) => t >= x.at);
  const fsz = caption?.size ?? 46;
  const side = caption?.side ?? 0;
  const capH = caption && !side ? Math.round(caption.lines.length * fsz * 1.3 + 36) : 0;
  const plan = caption ? motif3DPlan(caption.lines, caption.lineAt) : [];
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: out}}>
      <div style={{position: 'absolute', left: PANEL198.x, top: PANEL198.y, width: PANEL198.w, height: PANEL198.h, background: '#1b1b1d', borderRadius: 18, overflow: 'hidden', opacity: k, transform: `scale(${0.97 + 0.03 * k})`}}>
        <div style={{position: 'absolute', left: side, top: capH, width: PANEL198.w - side, height: PANEL198.h - capH}}>
          <Scene3D w={(PANEL198.w - side) / 2} h={(PANEL198.h - capH) / 2} dpr={2} {...rest} />
        </div>
        {caption ? (
          <div style={{position: 'absolute', left: 0, top: 0, width: side || PANEL198.w, height: side ? PANEL198.h : capH, background: '#111113', borderBottom: side ? undefined : '2px solid rgba(255,255,255,0.08)', borderRight: side ? '2px solid rgba(255,255,255,0.08)' : undefined, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: side ? 24 : 0, padding: side ? '0 36px 0 44px' : '0 0 0 40px', boxSizing: 'border-box'}}>
            {plan.map((p, i) => {
              const n = Math.max(0, Math.min(p.text.length, Math.floor((t - p.at) * 30)));
              return <div key={i} style={{fontSize: fsz, fontWeight: 700, lineHeight: 1.3, color: '#fff', whiteSpace: side ? 'normal' : 'pre'}}>{capTyped(p.text, n, i === 0 ? caption.prefixLen ?? 0 : 0, caption.hi ?? [], t)}</div>;
            })}
          </div>
        ) : null}
        {cur ? (
          <div key={cur.text} style={{position: 'absolute', left: 36, top: capH + 22, fontSize: 44, fontWeight: 800, color: '#fff', opacity: interpolate(t, [cur.at, cur.at + 0.4], [0, 1], clamp), textShadow: '0 2px 12px #1b1b1d'}}>{cur.text}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
const capTyped = (text: string, n: number, prefixLen: number, hi: {word: string; at: number}[], t: number) => {
  const on = new Array(text.length).fill(0);
  for (let j = 0; j < Math.min(prefixLen, text.length); j++) on[j] = 1;
  for (const h of hi) { const i = text.indexOf(h.word); if (i >= 0) for (let j = i; j < i + h.word.length; j++) on[j] = Math.max(on[j], Math.max(0, Math.min(1, (t - h.at) / 0.2))); }
  return text.split('').map((ch, i) => <span key={i} style={{color: on[i] > 0 ? `rgb(255, ${Math.round(255 - (255 - 210) * on[i])}, ${Math.round(255 - (255 - 63) * on[i])})` : undefined, visibility: i < n ? 'visible' : 'hidden'}}>{ch}</span>);
};

/* ---------- band motif: the hero scene in miniature, plus a typed line ---------- */
export type Motif3DProps = {
  lines: string[]; durationSec: number; prefixLen?: number; lineAt?: number[]; hiWords?: string[];
  lit: 'actor-prod' | 'auditor-q' | 'back' | 'all';
};
export const motif3DPlan = (lines: string[], lineAt?: number[]) => {
  let next = 0.45;
  return lines.map((l, i) => {
    const at = i === 0 ? next : Math.max(next, lineAt?.[i - 1] ?? 0);
    const end = at + l.length / 30;
    next = end + 0.35;
    return {text: l, at, end};
  });
};
const MINI = {w: 300, h: 144};
const MINI_CAM: Cam = {at: 0, yaw: -8, pitch: 13, dist: 10.4, focal: 1.02, tx: 0.05, ty: 1.84, ox: 0.5, oy: 0.53};
export const Motif3D198: React.FC<Motif3DProps> = ({lines, lit, prefixLen = 0, lineAt, hiWords = []}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const out = interpolate(frame, [durationInFrames - 0.25 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const k = spring({frame, fps, config: {damping: 14, stiffness: 170, mass: 0.6}});
  const plan = motif3DPlan(lines, lineAt);
  const scene: Omit<Scene3DProps, 'w' | 'h' | 'dpr'> =
    lit === 'actor-prod' ? {cam: [MINI_CAM], events: [{kind: 'apply', at: 0.6}, {kind: 'apply', at: 4.0}], focus: [{flows: ['apply'], at: 0.3}], glow: [{key: 'actor', at: 0.4}, {key: 'prod', at: 0.4}]}
    : lit === 'auditor-q' ? {cam: [MINI_CAM], events: [{kind: 'review', at: 0.8}, {kind: 'review', at: 3.6}], focus: [{flows: ['review'], at: 0.3}], glow: [{key: 'auditor', at: 0.5}]}
    : lit === 'back' ? {cam: [MINI_CAM], events: [{kind: 'review', at: 0.3}, {kind: 'apply', at: 1.8}, {kind: 'back', at: 3.0}, {kind: 'reject', at: 4.6}], focus: [{flows: ['review', 'apply'], at: 0.2}], glow: [{key: 'auditor', at: 0.3}]}
    : {cam: [MINI_CAM], events: [...cycle(0.2, 'apply'), ...cycle(5.6, 'back')]};
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: out}}>
      <div style={{position: 'absolute', left: BAND198.x, top: BAND198.y, height: BAND198.h, display: 'flex', alignItems: 'center', gap: 16, transform: `translateX(${(1 - k) * -40}px)`, opacity: Math.min(1, k * 1.5)}}>
        <div style={{width: MINI.w, height: MINI.h, background: '#1b1b1d', borderRadius: 10, position: 'relative', flex: 'none', overflow: 'hidden'}}>
          <Scene3D w={MINI.w / 1.6} h={MINI.h / 1.6} dpr={1.6} labels="none" breathe={0.6} {...scene} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          {plan.map((p, i) => {
            const n = Math.max(0, Math.min(p.text.length, Math.floor((t - p.at) * 30)));
            if (t < p.at - 0.3) return <div key={i} style={{height: 64}} />;
            return (
              <div key={i} style={{alignSelf: 'flex-start', background: 'rgba(17,17,17,0.92)', color: '#fff', fontSize: lines.length > 1 ? 40 : 44, fontWeight: 600, padding: '6px 22px 8px', borderRadius: 8, whiteSpace: 'pre'}}>
                {typed(p.text, n, i === 0 ? prefixLen : 0, hiWords)}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
const typed = (text: string, n: number, prefixLen: number, hiWords: string[]) => {
  const hi = new Array(text.length).fill(false);
  for (const w of hiWords) { const i = text.indexOf(w); if (i >= 0) for (let j = i; j < i + w.length; j++) hi[j] = true; }
  for (let j = 0; j < Math.min(prefixLen, text.length); j++) hi[j] = true;
  return text.split('').map((ch, i) => <span key={i} style={{color: hi[i] ? '#FFD23F' : undefined, visibility: i < n ? 'visible' : 'hidden'}}>{ch}</span>);
};
