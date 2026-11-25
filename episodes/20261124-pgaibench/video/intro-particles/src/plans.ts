import {layeredScene, premultiply, rectScene, type PhasePlan, type Rect, type Scene} from './particles-engine';

// Ep 198 particle intro: timing on the shades intro cue (a-shades-long2-pad.wav, which starts at
// intro t = 0): its hits fall on 0.48 + k * 0.517 s (measured: 0.48 1.00 1.52 ... 16.52).
export const hit = (k: number) => 0.48 + k * (60 / 116);

// Cold-open last frame and body first frame share the ep 198 layout (layout.json): header line,
// Kirk tile left (120,222 800x450), Nik tile right (1000,222), small robot tile bottom right.
const LAYOUT: Rect[] = [
  {name: 'header', x0: 160, y0: 36, x1: 1770, y1: 196},
  {name: 'kirk', x0: 105, y0: 206, x1: 935, y1: 752},
  {name: 'nik', x0: 985, y0: 206, x1: 1815, y1: 752},
  {name: 'robot', x0: 1644, y0: 868, x1: 1908, y1: 1027},
];
export const CARD = ['bg', 'michael', 'logo', 'badge', 'title1', 'band', 'paper', 'kirk', 'nik']; // = CardStill LAYER_ORDER

export type Images = Record<string, Uint8ClampedArray>; // straight RGBA, 1920x1080
const card = (im: Images, set: string) => layeredScene(CARD.map((name, i) => ({name, img: premultiply(im[`${set}-${i}`])})));
export const scenes = (im: Images, set1: string) => ({
  co: rectScene(im.co, LAYOUT),
  body: rectScene(im.body, LAYOUT),
  card1: card(im, set1), // the card as it lands
  cardF: card(im, 'F'), // the card as it dissolves (last text state)
});

// Text states while the card holds sharp (between the flights): instant swaps on music hits.
type St = {sign: 'reserved' | 'auditor'; badge: 'none' | 'c18' | 'harms13' | 'harms1'; paper: 'none' | 'drop' | 'drop-rejected' | 'approved'};
export type Beat = {t: number; set: Partial<St>};

export type Variant = {id: 'A' | 'B'; len: number; card: number; set1: 'A1' | 'B1'; start: St; beats: Beat[]; phases: [PhasePlan, PhasePlan]};
const CORR1 = {kirk: 'kirk', nik: 'nik', logo: 'header', bg: 'bg'};
const CORR2 = {kirk: 'kirk', nik: 'nik', header: 'title1', robot: 'michael', bg: 'bg'};

// A "full": long galaxy flight; the card lands element by element on beats 7-13 (badge with the
// logo, the Analyst's paper with Michael's sign), holds sharp from 7.76 s while its texts change
// on beats 17, 19, 21, 23 (each state >= 1.03 s), explodes on beat 25, the body lands on beats
// 30-33, then a 0.8 s still of the body for the compose crossfade. compose --card 17.72.
export const A: Variant = {
  id: 'A', len: 18.52, card: 17.72, set1: 'A1',
  start: {sign: 'reserved', badge: 'c18', paper: 'drop'},
  beats: [
    {t: hit(17), set: {badge: 'harms13'}},
    {t: hit(19), set: {paper: 'drop-rejected'}},
    {t: hit(21), set: {paper: 'approved', badge: 'harms1'}},
    {t: hit(23), set: {sign: 'auditor'}},
  ],
  phases: [
    {from: 0, to: hit(25), dep0: 0.1, dep1: 1.45, depDur: 1.05, breakX: 960, breakY: 470, blast: 280, lift: 1.2,
      land: {logo: hit(7), badge: hit(7), title1: hit(8), band: hit(9), kirk: hit(10), nik: hit(11), michael: hit(12), paper: hit(12), bg: hit(13)},
      landOrder: {bg: 'radial'}, spread: 0.3, spreads: {bg: 0.5}, arrDur: 1.3, corr: CORR1, seed: 198001,
      orbit: {tilt0: 1.25, tilt1: 0.42, roll0: -0.5, roll1: 0.3, spin: 1.5, zOff: -260, r0: 90, r1: 900, cx: 0, cy: 10}},
    {from: hit(25), to: 18.52, dep0: hit(25), dep1: hit(25) + 0.8, depDur: 0.95, breakX: 820, breakY: 420, blast: 340, lift: 0.6,
      land: {bg: hit(30), header: hit(31), kirk: hit(32), nik: hit(33), robot: hit(33)},
      landOrder: {bg: 'radial'}, spread: 0.3, spreads: {bg: 0.5}, arrDur: 1.2, corr: CORR2, seed: 198002,
      orbit: {tilt0: 0.55, tilt1: 1.25, roll0: 0.35, roll1: -0.4, spin: -1.5, zOff: -180, r0: 80, r1: 860, cx: 0, cy: 0}},
  ],
};
// B "tighter": shorter flights, no restart pill (the replay meter lands with the logo); texts
// change on beats 13, 15, 17 (each state >= 1.03 s); 13.8 s, so the compose keeps --card 13.
export const B: Variant = {
  id: 'B', len: 13.8, card: 13, set1: 'B1',
  start: {sign: 'reserved', badge: 'harms13', paper: 'drop'},
  beats: [
    {t: hit(13), set: {paper: 'drop-rejected'}},
    {t: hit(15), set: {paper: 'approved', badge: 'harms1'}},
    {t: hit(17), set: {sign: 'auditor'}},
  ],
  phases: [
    {from: 0, to: hit(19), dep0: 0.1, dep1: 1.0, depDur: 0.85, breakX: 960, breakY: 470, blast: 260, lift: 1.2,
      land: {logo: hit(4), badge: hit(4), title1: hit(5), band: hit(6), kirk: hit(7), nik: hit(8), michael: hit(9), paper: hit(9), bg: hit(10)},
      landOrder: {bg: 'radial'}, spread: 0.26, spreads: {bg: 0.4}, arrDur: 1.05, corr: CORR1, seed: 198003,
      orbit: {tilt0: 1.25, tilt1: 0.45, roll0: -0.5, roll1: 0.25, spin: 1.6, zOff: -260, r0: 90, r1: 880, cx: 0, cy: 10}},
    {from: hit(19), to: 13.8, dep0: hit(19), dep1: hit(19) + 0.6, depDur: 0.7, breakX: 820, breakY: 420, blast: 300, lift: 0.6,
      land: {bg: hit(21), header: hit(22), kirk: hit(23), nik: hit(24), robot: hit(24)},
      landOrder: {bg: 'radial'}, spread: 0.24, spreads: {bg: 0.4, nik: 0.16, robot: 0.16}, arrDur: 0.9, corr: CORR2, seed: 198004,
      orbit: {tilt0: 0.55, tilt1: 1.2, roll0: 0.35, roll1: -0.3, spin: -1.6, zOff: -180, r0: 80, r1: 840, cx: 0, cy: 0}},
  ],
};
export const VARIANTS = {A, B};

// The sharp hold: from the moment every phase-1 particle has landed (and its flash is gone)
// to the first take-off of phase 2.
export const holdStart = (v: Variant) => {
  const p = v.phases[0], last = Math.max(...Object.entries(p.land).map(([k, t]) => t + (p.spreads?.[k] ?? p.spread) / 2));
  return Math.ceil((last + 0.3) * 25) / 25;
};
export const stateAt = (v: Variant, t: number) => {
  const st: St & {punch: Partial<Record<'sign' | 'badge' | 'paper', number>>} = {...v.start, punch: {}};
  for (const b of v.beats) if (t >= b.t) {
    Object.assign(st, b.set);
    const k = Math.exp(-(t - b.t) * 9);
    for (const key of Object.keys(b.set) as ('sign' | 'badge' | 'paper')[]) st.punch[key] = k > 0.02 ? k : 0;
  }
  return st;
};
