// Ep 198 particle intro A, v3 ("the full show, more intense"): the corrected Card198 show
// (every gag, stamp and slam), retimed onto the music hits so that every text state reads for at
// least 1 s, with a particle assembly in front and a particle detonation at the end.
// Times are in music beats k (shades cue, 116 BPM; k -> seconds via kt() in beats.ts).
// Shared by the Remotion show (Show198.tsx), the FX overlay (Fx.tsx) and the sound (sfx/synth.ts).
import {FPS, kt, ONF} from './beats';

export const LEN_F = 469; // 18.76 s
export const LEN = LEN_F / FPS;
export const CARD_AT = LEN - 0.8; // compose --card 17.96 (the last 0.8 s is the body, for the xfade)
export const SW_F = 63; // particles -> DOM show (2.52 s), every element has landed
export const EX_F = ONF[32]; // the show detonates on hit 32 (frame 426, 17.04 s)

// ---------- show beats (k) ----------
export const B = {
  detonateCO: 0, band: 1, title: 2, kirk: 3, nik: 3.5, arm: 3.25,
  presses: [4, 5, 6, 7, 8], restart: 8, // 5th press = RESTART! (the elephant is launched)
  night: 9, rehearse: [9, 10.95] as [number, number],
  catch: [11, 12, 13, 14, 15, 16], pass: [11.5, 12.5, 13.5, 14.5, 15.5, 16.25, 16.75],
  stopped: [11, 18.95] as [number, number], zero: 17,
  day: 19, aaa: [19, 20.95] as [number, number], paper: 19.3,
  selfJet: [20.35, 20.8] as [number, number], selfStamp: 21, // the Analyst approves its own proposal
  rejected: 23, // the Auditor's REJECTED blows the self-approval apart
  swap: 25, // the rejected proposal shatters; CHANGE REQUESTS / 377 of 378 snaps in
  approved: 27, crash: 27, // APPROVED + the meter crashes 13 -> 1
  tick: 28, rollback: 29, flip: 29.4, clean: 31, glint: 31.5, detonate: 32,
};

// ---------- FX events (camera shake, shockwave, burst, sound) ----------
// kind: slam (element lands / is hit), stamp, shatter (rejected thing breaks into particles),
// snap (approved thing condenses from particles), bomb (small), boom (big, whole frame),
// land (particle landing in the canvas phases).
export type FxKind = 'slam' | 'stamp' | 'shatter' | 'snap' | 'bomb' | 'boom' | 'land';
export type Fx = {k: number; kind: FxKind; x: number; y: number; w: number; h: number; p: number; pal?: string[]; id: string};
const R = (id: string, k: number, kind: FxKind, x: number, y: number, w: number, h: number, p: number, pal?: string[]): Fx => ({id, k, kind, x, y, w, h, p, pal});
const PINKS = ['#ff5fcf', '#ffd1f6', '#ffffff', '#f39aea'];
const HOT = ['#ff3b1f', '#ffcc4d', '#ff7124', '#ffffff'];
const GRN = ['#39ff6a', '#1f9a3a', '#c8ffd2', '#ffffff'];
const PLUMS = ['#3d0f45', '#ffffff', '#ff5fcf'];
export const PAPER = {x: 840, y: 565, w: 520, h: 320};
export const FX: Fx[] = [
  R('co', 0, 'boom', 0, 0, 1920, 1080, 1.0, PINKS),
  R('band', 1, 'land', 90, 404, 980, 150, 0.9),
  R('title', 2, 'land', 100, 228, 1400, 150, 0.85),
  R('arm', 3.25, 'land', 1150, 0, 230, 760, 0.45),
  R('kirk', 3, 'land', 110, 562, 330, 248, 0.75),
  R('nik', 3.5, 'land', 470, 562, 330, 248, 0.75),
  ...[4, 5, 6, 7].map((k) => R(`press${k}`, k, 'slam', 1150, 700, 200, 140, 0.55, HOT)),
  R('restart', 8, 'boom', 800, 280, 760, 480, 1.0, HOT),
  R('night', 9, 'slam', 1000, 600, 420, 260, 0.6, ['#4fe3ff', '#ffffff', '#b06bff']),
  R('rehearse', 10, 'slam', 710, 40, 760, 110, 0.35, PLUMS),
  ...[11, 12, 13, 14, 15, 16].map((k, i) => R(`catch${i}`, k, 'bomb', 1120, 610, 120, 60, 0.4, ['#4fe3ff', '#ffffff', '#39ff6a'])),
  ...[11.5, 12.5, 13.5, 14.5, 15.5, 16.25, 16.75].map((k, i) => R(`pass${i}`, k, 'bomb', 860, 640, 80, 60, 0.45, HOT)),
  R('zero', 17, 'stamp', 1000, 680, 320, 100, 0.75, ['#ffcc4d', '#ffffff', '#3d0f45']),
  R('stopped', 18, 'slam', 710, 40, 900, 140, 0.35, PLUMS),
  R('day', 19, 'boom', 710, 40, 900, 110, 0.85, PINKS),
  R('paper', 19.3, 'slam', PAPER.x, PAPER.y, PAPER.w, PAPER.h, 0.4, PLUMS),
  R('aaa', 20, 'slam', 710, 40, 900, 110, 0.3, PLUMS),
  R('self', 21, 'stamp', 875, 772, 450, 90, 0.8, GRN),
  R('selfbump', 22, 'slam', 875, 772, 450, 90, 0.3, GRN),
  R('rejected', 23, 'shatter', 875, 772, 450, 90, 1.0, GRN),
  R('meter', 23.01, 'slam', 740, 26, 1140, 200, 0.6, ['#d93d1b', '#ffffff', '#3d0f45']),
  R('rejbump', 24, 'slam', 875, 772, 450, 90, 0.35, HOT),
  R('swap', 25, 'shatter', PAPER.x, PAPER.y, PAPER.w, PAPER.h, 0.9),
  R('swapin', 25.02, 'snap', PAPER.x, PAPER.y, PAPER.w, PAPER.h, 0.5, ['#ffffff', '#3d0f45', '#ffd1f6']),
  R('crbump', 26, 'slam', PAPER.x, PAPER.y, PAPER.w, 64, 0.3, PLUMS),
  R('approved', 27, 'snap', 875, 772, 450, 90, 1.0, GRN),
  R('crash', 27.01, 'boom', 740, 26, 1140, 200, 0.7, GRN),
  R('tick', 28, 'slam', PAPER.x + PAPER.w - 60, PAPER.y, 60, 60, 0.5, GRN),
  R('rollback', 29, 'boom', 0, 0, 1920, 1080, 1.0, PINKS),
  R('flip', 29.4, 'slam', 1402, 557, 476, 222, 0.5, PLUMS),
  R('rb2', 30, 'slam', 710, 40, 420, 110, 0.35, PINKS),
  R('clean', 31, 'slam', 820, 520, 440, 420, 0.7, PINKS),
  R('detonate', 32, 'boom', 0, 0, 1920, 1080, 1.1, PINKS),
  R('bodybg', 32.6, 'land', 0, 0, 1920, 1080, 0.5),
  R('bodyhdr', 32.85, 'land', 160, 36, 1610, 160, 0.6),
  R('bodykirk', 33.05, 'land', 105, 206, 830, 546, 0.7),
  R('bodynik', 33.25, 'land', 985, 206, 830, 546, 0.75),
];
export const fxT = (e: Fx) => kt(e.k);

// Music hits inside the intro (integer k), for the bass pulse of the whole field.
export const HITS = Array.from({length: 34}, (_, k) => k);
