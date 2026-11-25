import {layeredScene, premultiply, rectScene, type PhasePlan, type Rect} from './particles-engine';
import {FPS, kt} from './beats';
import {B, EX_F, LEN} from './show-timeline';
import {GROUPS} from './Show198';

// Intro A v3: two short, violent particle phases around the show.
// 1. hit 0: the cold open's last frame detonates; its pieces slam into the show's first frame
//    element by element on the music: band (hit 1), title (2), Kirk (3), the arm (3.25), Nik (3.5).
// 2. hit 32: the show's last frame detonates; the pieces slam into the body layout by hit 33.25.
const LAYOUT: Rect[] = [
  {name: 'header', x0: 160, y0: 36, x1: 1770, y1: 196},
  {name: 'kirk', x0: 105, y0: 206, x1: 935, y1: 752},
  {name: 'nik', x0: 985, y0: 206, x1: 1815, y1: 752},
  {name: 'robot', x0: 1644, y0: 868, x1: 1908, y1: 1027},
];
// the show's last frame, split the same way (title -> header, tiles -> tiles, sign -> robot tile)
const SHOW_RECTS: Rect[] = [
  {name: 'title', x0: 90, y0: 60, x1: 1440, y1: 560},
  {name: 'kirk', x0: 105, y0: 552, x1: 445, y1: 816},
  {name: 'nik', x0: 465, y0: 552, x1: 805, y1: 816},
  {name: 'michael', x0: 1395, y0: 550, x1: 1885, y1: 1080},
];
export type Images = Record<string, Uint8ClampedArray>;
export const NAMES = ['co', 'body', 'ex', ...GROUPS.map((g) => `L-${g}`)];
export const scenes3 = (im: Images) => ({
  co: rectScene(im.co, LAYOUT),
  body: rectScene(im.body, LAYOUT),
  show0: layeredScene(GROUPS.map((g) => ({name: g, img: premultiply(im[`L-${g}`])}))),
  ex: rectScene(im.ex, SHOW_RECTS),
});

const t0 = kt(B.detonateCO);
export const P1: PhasePlan = {
  from: 0, to: 63 / FPS, dep0: t0, dep1: t0 + 0.22, depDur: 0.3, breakX: 960, breakY: 470, blast: 620, lift: 1.6,
  land: {bg: kt(1) - 0.02, logo: kt(1) - 0.04, michael: kt(1) + 0.04, band: kt(B.band), title1: kt(B.title), kirk: kt(B.kirk), arm: kt(B.arm), nik: kt(B.nik) - 0.04},
  landOrder: {bg: 'radial', band: 'sweep', title1: 'sweep'},
  spread: 0.1, spreads: {bg: 0.3, band: 0.08, title1: 0.12, kirk: 0.08, nik: 0.08, arm: 0.1, michael: 0.14, logo: 0.1},
  arrDur: 0.42, flash: 0.16,
  punch: {band: 0.22, title1: 0.16, kirk: 0.18, nik: 0.18, logo: 0.12},
  corr: {kirk: 'kirk', nik: 'nik', logo: 'header', title1: 'header', bg: 'bg', michael: 'robot'}, seed: 198301,
  orbit: {tilt0: 1.1, tilt1: 0.5, roll0: -0.6, roll1: 0.4, spin: 4.2, zOff: -120, r0: 60, r1: 760, cx: 0, cy: 0},
};
const tx = EX_F / FPS;
export const P2: PhasePlan = {
  from: tx, to: LEN, dep0: tx, dep1: tx + 0.16, depDur: 0.26, breakX: 1035, breakY: 600, blast: 700, lift: 1.4,
  land: {bg: kt(B.detonate + 0.6), header: kt(B.detonate + 0.85), kirk: kt(B.detonate + 1.05), nik: kt(B.detonate + 1.25), robot: kt(B.detonate + 1.25)},
  landOrder: {bg: 'radial'},
  spread: 0.1, spreads: {bg: 0.22, header: 0.12},
  arrDur: 0.36, flash: 0.16,
  punch: {header: 0.12, kirk: 0.08, nik: 0.08},
  corr: {kirk: 'kirk', nik: 'nik', header: 'title', robot: 'michael', bg: 'bg'}, seed: 198302,
  orbit: {tilt0: 0.6, tilt1: 1.1, roll0: 0.4, roll1: -0.5, spin: -4.4, zOff: -100, r0: 60, r1: 760, cx: 0, cy: 0},
};
