import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile} from 'remotion';
import {ELE, FPS, Grain, H, HOSTS, Levels, TITLE, useFonts, useLevels, useT, W} from './common';

// v9, the ep 196 title card ("The hidden costs of CREATE TEMP TABLE"), from the DevRel/video
// expert brief: ONE world, no cuts, one chain reaction. 14 s on the original intro cue
// (a-shades-long2-pad.wav); every hit is locked to the real audio onsets in a-shades-levels.json
// (the RMS peak nearest each grid beat), final hit on beat 24 (~12.92 s); compose --card 13.
//
// Beats:
//  0      the mono CREATE TEMP TABLE plate slams in (Michael's chair + sign already there)
//  1      "The hidden costs of" drops on
//  2-3    Kirk booms in, Nik booms in; the elephant hits a giant Enter key on 3
//  4-6    one table per beat slams down around the elephant, each bigger
//  7      avalanche of rows buries it to the sunglasses: BLOAT!
//  8      the pile topples (knocks the host tiles), the camera pulls out to a wall-to-wall grid
//         of sleeping elephants: "5,000 idle sessions"
//  9-11   megaphone "CATALOG CHANGED!" x3, the grid jolts awake in bigger, angrier waves
//  12-14  double-time blasts, the messages pile up
//  15     OVERFLOW! the flood fills the frame
//  16     the camera drops back in; the flood carries the elephant to a cliff edge; giant meter
//         502 tx/s
//  17     teeter; 18 fall, the meter crashes to 127 tx/s; 19 hold on red 127
//  20-21  TRUNCATE frame: everything but the title, the host tiles and the chair shreds away
//  22     clean frame, the elephant pops back up; 23 freeze, only the sign wobbles
//  24     the sign flips to "Michael's seat: ON COMMIT PRESERVE ROWS" (mono, one size); hold
// Every beat hits: camera punch (rule of three inside each bar: hit, bigger, biggest, break),
// elephant stomp, host tiles boom (RMS-scaled) and get knocked around by the big events.
// Nothing ever touches Michael's chair.

// Speech bubbles over the hosts: off until the hosts approve the words.
const SHOW_BUBBLES = false;

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const NIGHT_BG = 'linear-gradient(180deg, #2a0f4a 0%, #4a1b72 70%, #6a2a8a 100%)';
const PLUM = '#3d0f45';
const TERM = '#22072a';
const RED = '#d93d1b';
const WATER = '#3b9fd1';
const font = {fontFamily: 'Lato', fontWeight: 900} as const;
const mono = {fontFamily: 'JBMono, Menlo, monospace', fontWeight: 500} as const;

let monoLoaded = false;
const useMono = () => {
  const [h] = useState(() => (monoLoaded ? null : delayRender('mono')));
  useEffect(() => {
    if (h === null) return;
    new FontFace('JBMono', `url(${staticFile('fonts/JetBrainsMono-Medium.ttf')})`, {weight: '500'}).load().then((ff) => document.fonts.add(ff))
      .finally(() => { monoLoaded = true; continueRender(h); });
  }, [h]);
};

// ---------- clock: beats locked to the real audio onsets ----------
const T0 = 0.486, BEAT = 60 / 116;
const grid = (k: number) => T0 + k * BEAT;
const onsets = (lv: Levels | null) => Array.from({length: 27}, (_, k) => {
  if (!lv) return grid(k);
  const f = Math.round(grid(k) * FPS);
  let m = f;
  for (let i = f - 2; i <= f + 2; i++) if ((lv.rms[i] ?? 0) > (lv.rms[m] ?? 0)) m = i;
  return m / FPS;
});
// real time -> beat position q on the onset clock
const toQ = (ons: number[], t: number) => {
  if (t < ons[0]) return (t - ons[0]) / BEAT;
  for (let k = 0; k < ons.length - 1; k++) if (t < ons[k + 1]) return k + (t - ons[k]) / (ons[k + 1] - ons[k]);
  return ons.length - 1 + (t - ons[ons.length - 1]) / BEAT;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const eIn = (x: number) => Math.pow(clamp01(x), 3);
const arc = (q: number) => 4 * q * (1 - q);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const inP = (p: number, a: number, b: number) => p >= a && p < b;
const mix = (a: number, b: number, q: number) => a + (b - a) * q;
const boing = (u: number) => (u <= 0 ? 0 : u >= 1.6 ? 1 : 1 - Math.exp(-u * 9) * Math.cos(u * 14));
// decaying kick after beat s, in beats
const kick = (q: number, s: number, rate = 3) => (q >= s ? Math.exp(-(q - s) * rate) : 0);

// ---------- the elephant ----------
const EH = 880, EK = EH / ELE.h, EW = ELE.w * EK, EX = 1120, EY = H - EH + 170;
const OX = EX + EW / 2, OY = EY + 0.62 * EH;
type Pose = {x: number; y: number; rot: number; scale: number; hidden?: boolean};
const at = (cx: number, cy: number, s: number, rot = 0): Pose => ({x: cx - OX, y: cy - OY, rot, scale: s});
const imgPt = (e: Pose, ix: number, iy: number) => ({x: OX + e.x + (ix - ELE.w / 2) * EK * e.scale, y: OY + e.y + (iy - 0.62 * ELE.h) * EK * e.scale});
const Elephant: React.FC<{e: Pose; stomp?: number; filter?: string; hue?: number}> = ({e, stomp = 0, filter, hue = 0}) =>
  e.hidden ? null : (
    <div style={{position: 'absolute', left: EX + e.x, top: EY + e.y, width: EW, height: EH, transform: `rotate(${e.rot}deg) scale(${e.scale})`, transformOrigin: '50% 62%'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.07 * stomp}, ${1 - 0.1 * stomp})`, transformOrigin: '50% 95%'}}>
        <Img src={staticFile('elephant.png')} style={{position: 'absolute', left: 0, top: 0, width: EW, height: EH,
          filter: [hue ? `hue-rotate(${hue}deg) saturate(1.7)` : '', filter ?? ''].join(' ').trim() || undefined,
          maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}} />
      </div>
    </div>
  );

// ---------- act 1: Enter, tables, avalanche, BLOAT ----------
const HOME = {x: 1000, y: 830, s: 0.72};
const EnterKey: React.FC<{q: number}> = ({q}) => {
  if (q >= 8.6) return null;
  const sq = q >= 3 ? 1 - 0.45 * kick(q, 3, 4) : 1;
  return (
    <div style={{position: 'absolute', left: 1000, top: 1080 - 150 * sq, width: 230, height: 150 * sq, background: '#fff', border: `7px solid ${PLUM}`, borderRadius: 22, boxShadow: `0 10px 0 ${PLUM}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', opacity: 1 - seg(q, 8, 8.5)}}>
      <div style={{...mono, fontSize: 96 * sq, color: PLUM, lineHeight: 1}}>⏎</div>
    </div>
  );
};
const Table: React.FC<{w: number; x: number; y: number; r?: number; c?: string}> = ({w, x, y, r = 0, c = '#fff'}) => {
  const h = w * 0.66, rh = h / 5;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, background: c, border: `${Math.max(5, w / 40)}px solid ${PLUM}`, borderRadius: w / 22, boxSizing: 'border-box', overflow: 'hidden',
      transform: `rotate(${r}deg)`, boxShadow: `0 ${w / 30}px 0 ${PLUM}55`}}>
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: rh, background: PLUM}} />
      {[1, 2, 3].map((i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: rh * (i + 1), height: Math.max(3, w / 80), background: `${PLUM}55`}} />)}
      {[1, 2].map((i) => <div key={'c' + i} style={{position: 'absolute', top: rh, bottom: 0, left: (w * i) / 3, width: Math.max(3, w / 80), background: `${PLUM}55`}} />)}
    </div>
  );
};
const TABLES = [{k: 4, w: 230, x: 470, y: 1060, r: -8, c: '#fff'}, {k: 5, w: 340, x: 1150, y: 1075, r: 7, c: '#ffe6fb'}, {k: 6, w: 480, x: 780, y: 1085, r: -3, c: '#fff'}];
const PILE_N = 40, LANES = [430, 690, 950, 1210], ROW_W = 270, ROW_H = 54;
const pileXY = (i: number) => ({x: LANES[i % 4] - ROW_W / 2 + (rnd(i + 7) - 0.5) * 40, y: H - (Math.floor(i / 4) + 1) * ROW_H});
const Pile: React.FC<{q: number}> = ({q}) => {
  if (q < 3.5 || q >= 9) return null;
  // the whole heap topples to the left on 8 (that is the skyscraper fall) and fades
  const top = 100 * eIn(seg(q, 8, 8.6));
  const fade = 1 - seg(q, 8.5, 8.9);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `rotate(${-top}deg)`, transformOrigin: '300px 1080px', opacity: fade}}>
      {TABLES.map((tb, i) => {
        const d = q - (tb.k - 0.22);
        if (d < 0) return null;
        const fall = clamp01(d / 0.22);
        const y = mix(-400, tb.y, fall * fall);
        const sq = d > 0.22 ? 1 - 0.12 * kick(q, tb.k, 6) : 1;
        return <div key={i} style={{position: 'absolute', inset: 0, transform: `scaleY(${sq})`, transformOrigin: `${tb.x}px ${tb.y}px`}}><Table w={tb.w} x={tb.x} y={y} r={tb.r} c={tb.c} /></div>;
      })}
      {Array.from({length: PILE_N}, (_, i) => {
        const ts = 6.45 + 0.55 * (i / PILE_N) + rnd(i + 500) * 0.04;
        const d = q - ts, fall = 0.22;
        if (d < 0) return null;
        const p = pileXY(i);
        const y = d < fall ? -80 + (p.y + 80) * Math.pow(d / fall, 2) : p.y;
        return <div key={i} style={{position: 'absolute', left: p.x, top: y, width: ROW_W, height: ROW_H, boxSizing: 'border-box', background: ['#fff', '#ffe6fb', '#fff7d6'][i % 3],
          border: `4px solid ${PLUM}`, borderRadius: 8, transform: `rotate(${(rnd(i + 8) - 0.5) * 8}deg)`}}>
          <div style={{position: 'absolute', left: ROW_W / 3, top: 0, bottom: 0, width: 4, background: `${PLUM}44`}} />
          <div style={{position: 'absolute', left: (2 * ROW_W) / 3, top: 0, bottom: 0, width: 4, background: `${PLUM}44`}} />
        </div>;
      })}
    </div>
  );
};
const Burst: React.FC<{q: number; beat: number; text: string; x: number; y: number; color: string; size?: number; dur?: number; scale?: number}> = ({q, beat, text, x, y, color, size = 120, dur = 1.6, scale = 1}) => {
  const d = q - beat;
  if (d < 0 || d > dur) return null;
  const s = scale * Math.min(1, d / 0.15) * (d > dur - 0.25 ? 1 - (d - dur + 0.25) / 0.25 : 1);
  const pts = Array.from({length: 28}, (_, i) => { const a = (i / 28) * Math.PI * 2, r = i % 2 ? 150 : 230 + 30 * rnd(i + beat); return `${Math.cos(a) * r * 1.6},${Math.sin(a) * r}`; }).join(' ');
  return (
    <div style={{position: 'absolute', left: x - 380, top: y - 240, width: 760, height: 480, transform: `scale(${s}) rotate(-7deg)`}}>
      <svg width={760} height={480} viewBox="-380 -240 760 480" style={{position: 'absolute'}}><polygon points={pts} fill={color} stroke={PLUM} strokeWidth={10} strokeLinejoin="round" /></svg>
      <div style={{...font, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size, color: '#fff', letterSpacing: -1,
        WebkitTextStroke: `7px ${PLUM}`, paintOrder: 'stroke fill', fontStyle: 'italic', whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};

// ---------- act 2: the idle-session grid (world coords; the camera pulls out to Z) ----------
const ZO = {x: 960, y: 640}; // zoom origin
const ZMIN = 0.34;
const zoomZ = (q: number) => (q < 8 ? 1 : q < 15.5 ? mix(1, ZMIN, ease(seg(q, 8, 8.9))) : mix(ZMIN, 1, ease(seg(q, 15.5, 16.3))));
const GRID = (() => {
  const out: {x: number; y: number; i: number}[] = [];
  let i = 0;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 12; c++) {
    const x = -1650 + c * 520 + (r % 2) * 260, y = -950 + r * 540;
    out.push({x, y, i: i++});
  }
  return out;
})();
const SHOUTS = [9, 10, 11];
const BLASTS = [12, 12.5, 13, 13.5, 14, 14.5];
const RING_V = 5200; // world px per beat
const MAIN2 = {x: 1100, y: 760, s: 0.6}; // the shouter, screen coords
const tipScreen = () => {
  const e = at(MAIN2.x, MAIN2.y, MAIN2.s);
  const tip = imgPt(e, 240, 1230);
  return {x: tip.x, y: tip.y - 190, tip};
};
const toWorld = (p: {x: number; y: number}, z: number) => ({x: ZO.x + (p.x - ZO.x) / z, y: ZO.y + (p.y - ZO.y) / z});
const Grid: React.FC<{q: number; t: number}> = ({q, t}) => {
  if (q < 8 || q >= 15.8) return null;
  const src = toWorld(tipScreen(), ZMIN);
  const inner = (x: number, y: number) => x > -100 && x < W + 100 && y > -100 && y < H + 300;
  return (
    <>
      {GRID.map((g) => {
        const dist = Math.hypot(g.x - src.x, g.y - src.y);
        // waves passed: each shout (and each blast) sends a ring
        const passed = [...SHOUTS, ...BLASTS].filter((s) => q >= s && (q - s) * RING_V >= dist);
        const lvl = passed.length;
        const last = passed.length ? passed[passed.length - 1] : -1;
        const since = last >= 0 ? q - last - dist / RING_V : 9;
        const jump = lvl > 0 && since < 0.5 ? (40 + 50 * Math.min(lvl, 4)) * arc(since / 0.5) : 0;
        const o = inner(g.x, g.y) ? seg(q, 8.3, 8.9) : 1;
        const asleep = lvl === 0;
        const rot = asleep ? -14 + 3 * Math.sin(t * 2 + g.i) : (g.i % 2 ? 1 : -1) * 8 * Math.min(lvl, 3) * (since < 0.5 ? 1 : 0.3);
        const angry = Math.min(1, lvl / 6);
        return (
          <div key={g.i} style={{opacity: o}}>
            <Elephant e={at(g.x + (asleep ? 0 : 30 * angry * Math.sin(t * 70 + g.i)), g.y - jump, 0.56, rot)} hue={asleep ? 0 : [0, 0, 300, 330, 40][g.i % 5]}
              filter={asleep ? 'brightness(.5) saturate(.4)' : angry > 0.3 ? `drop-shadow(0 0 ${30 * angry}px rgba(255,40,0,${0.6 + 0.4 * angry})) drop-shadow(0 0 ${12 * angry}px rgba(255,40,0,1))` : undefined} />
            {asleep && g.i % 3 === 0 && <div style={{...font, position: 'absolute', left: g.x + 40, top: g.y - 230 - 70 * ((t * 0.7 + rnd(g.i)) % 1), fontSize: 90, color: '#fff', opacity: 1 - ((t * 0.7 + rnd(g.i)) % 1)}}>z</div>}
          </div>
        );
      })}
    </>
  );
};
const Megaphone: React.FC<{q: number}> = ({q}) => {
  if (q < 8.6 || q >= 15.2) return null;
  const {tip} = tipScreen();
  const s = boing((q - 8.6) * 3) * (1 - seg(q, 14.9, 15.2));
  const recoil = [...SHOUTS, ...BLASTS].reduce((a, k) => a + 12 * kick(q, k, 8), 0);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${tip.x},${tip.y + recoil}) rotate(90) scale(${s * 1.3})`}>
        <path d="M10,-18 L-150,-62 L-150,98 L10,22 Z" fill="#fff" stroke={PLUM} strokeWidth={7} strokeLinejoin="round" />
        <rect x={0} y={-22} width={34} height={48} rx={8} fill={RED} stroke={PLUM} strokeWidth={6} />
      </g>
    </svg>
  );
};
const Rings: React.FC<{q: number; z: number}> = ({q, z}) => {
  if (q < 9 || q >= 15.5) return null;
  const m = tipScreen();
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {[...SHOUTS, ...BLASTS].map((s, i) => {
        const r = (q - s) * RING_V * z;
        if (r <= 0 || r > 2600) return null;
        const big = i < 3 ? 1 + 0.4 * i : 0.8;
        return <circle key={i} cx={m.x} cy={m.y} r={r} fill="none" stroke="#fff" strokeWidth={22 * big} opacity={0.9 * (1 - r / 2600)} />;
      })}
    </svg>
  );
};
// the messages: chips fly out of the megaphone on every blast and pile up along the bottom
const CHIPC = ['#16657c', '#8a4fd8', RED, '#2fa38a', '#f2a130', '#ff5fcf'];
const PER_BLAST = 18;
const chipSlot = (i: number) => ({x: 20 + (i % 17) * 114 + (Math.floor(i / 17) % 2) * 50, y: H - 46 - Math.floor(i / 17) * 46});
const Chips: React.FC<{q: number; t: number; water: number}> = ({q, t, water}) => {
  if (q < 12 || q >= 16.4) return null;
  const m = tipScreen();
  const out: React.ReactNode[] = [];
  BLASTS.forEach((b, bi) => {
    for (let j = 0; j < PER_BLAST; j++) {
      const i = bi * PER_BLAST + j;
      const d = q - b - j * 0.012;
      if (d < 0) continue;
      const u = clamp01(d / 0.45), s = chipSlot(i);
      let x = mix(m.x, s.x, u), y = mix(m.y, s.y, u) - 300 * arc(u), r = (rnd(i) - 0.5) * 50 * (1 - u) + (rnd(i + 3) - 0.5) * 10;
      if (q >= 15) { // OVERFLOW: they float up with the water
        y = Math.min(y, water - 30 + (s.y - (H - 46)) * 0.6 + 14 * Math.sin(t * 5 + i)); x += 40 * Math.sin(t * 3 + i); r += 10 * Math.sin(t * 4 + i);
      }
      out.push(<div key={i} style={{position: 'absolute', left: x, top: y, width: 104, height: 40, borderRadius: 10, background: CHIPC[i % 6], border: '4px solid #fff', boxSizing: 'border-box', transform: `rotate(${r}deg)`}} />);
    }
  });
  return <>{out}</>;
};

// ---------- act 3: flood, cliff, meter ----------
const EDGE = 1170, GAP_R = 1440, SURF = 880;
const waterLevel = (q: number) => (q < 15 ? H + 40 : q < 15.5 ? mix(H + 40, 250, eOut(seg(q, 15, 15.4))) : mix(250, SURF, ease(seg(q, 15.5, 16.3))));
const Flood: React.FC<{q: number; t: number}> = ({q, t}) => {
  if (q < 15 || q >= 20) return null;
  const lvl = waterLevel(q);
  const cliff = q >= 15.6;
  const right = cliff ? EDGE : W;
  const wave = Array.from({length: 26}, (_, i) => { const x = (i / 25) * right; return `${x},${lvl + 22 * Math.sin(i * 0.9 + t * 9) * (q < 15.6 ? 2 : 1)}`; }).join(' L');
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {cliff && <rect x={EDGE} y={SURF + 40} width={GAP_R - EDGE} height={H} fill={TERM} opacity={seg(q, 15.6, 16)} />}
      {cliff && <rect x={GAP_R} y={SURF + 120} width={W - GAP_R} height={H} fill="#c96ac0" stroke={PLUM} strokeWidth={8} opacity={seg(q, 15.6, 16)} />}
      <path d={`M${wave} L${right},${H} L0,${H} Z`} fill={WATER} opacity={0.9} />
      {cliff && Array.from({length: 7}, (_, i) => {
        const ph = (t * 3 + i * 0.37) % 1;
        return <path key={i} d={`M${EDGE - 4},${SURF + 6 + i * 4} q ${60 + i * 16},${10} ${70 + i * 22},${240 * ph + 120}`} stroke={i % 2 ? '#bfe9ff' : WATER} strokeWidth={26 - i * 2} fill="none" strokeLinecap="round" opacity={seg(q, 15.7, 16)} />;
      })}
    </svg>
  );
};
const Meter: React.FC<{q: number}> = ({q}) => {
  if (q < 16 || q >= 20) return null;
  const crash = ease(seg(q, 18, 18.35));
  const v = Math.round(mix(502, 127, crash));
  const red = q >= 18;
  const blink = q >= 19 && Math.floor((q - 19) * 4) % 2 === 1;
  const s = boing((q - 16) * 3);
  const shake = q >= 18 ? 14 * kick(q, 18, 5) * Math.sin(q * 80) : 0;
  return (
    <div style={{position: 'absolute', left: 740, top: 26, width: 1140, height: 200, transform: `scale(${s}) translateX(${shake}px)`, transformOrigin: '0 50%'}}>
      <div style={{position: 'absolute', inset: 0, background: '#fff', border: `7px solid ${PLUM}`, borderRadius: 24, boxShadow: `0 10px 0 ${PLUM}55`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(v / 520) * 100}%`, background: red ? RED : '#39b54a', opacity: blink ? 0.55 : 1}} />
      </div>
      <div style={{...mono, position: 'absolute', left: 36, top: 22, fontSize: 132, lineHeight: 1, color: '#fff', WebkitTextStroke: `8px ${PLUM}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>{v} tx/s</div>
    </div>
  );
};

// ---------- Michael's deck chair + sign: on screen from frame 1, never touched ----------
const CX = 1765, CS = 0.85;
const SIGN = {x: 1605, top: 410, w: 610};
const Chair: React.FC<{wob: number}> = ({wob}) => {
  const stripes = ['#ff5fcf', '#fff', '#42a8c8', '#fff', '#ff5fcf', '#fff', '#42a8c8'];
  return (
    <div style={{position: 'absolute', left: CX - 150, top: H - 400, width: 300, height: 400, transform: `rotate(${wob}deg) scale(${CS})`, transformOrigin: '50% 100%'}}>
      <svg width={360} height={400} viewBox="0 0 360 400" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><clipPath id="sling9"><path d="M70,40 L200,40 L250,260 L120,260 Z" /></clipPath></defs>
        <g clipPath="url(#sling9)">{stripes.map((c, i) => <rect key={i} x={60 + i * 30} y={30} width={30} height={240} fill={c} transform="skewX(12)" />)}</g>
        <g stroke={PLUM} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" fill="none">
          <path d="M70,40 L200,40 L250,260 L120,260 Z" />
          <line x1={70} y1={40} x2={150} y2={395} /><line x1={200} y1={40} x2={280} y2={395} />
          <line x1={120} y1={260} x2={60} y2={395} /><line x1={250} y1={260} x2={190} y2={395} />
          <line x1={40} y1={250} x2={280} y2={250} />
        </g>
        <g transform="translate(22,170)">
          <path d="M0,0 L44,0 L36,72 L8,72 Z" fill="#ffcc4d" stroke={PLUM} strokeWidth={6} strokeLinejoin="round" />
          <line x1={30} y1={4} x2={46} y2={-40} stroke={PLUM} strokeWidth={5} strokeLinecap="round" />
          <path d="M20,-44 Q46,-74 74,-44 Z" fill="#39b54a" stroke={PLUM} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={10} cy={4} r={9} fill="#ff7124" stroke={PLUM} strokeWidth={4} />
        </g>
      </svg>
    </div>
  );
};
const Sign: React.FC<{q: number}> = ({q}) => {
  const a = 180 * ease(seg(q, 24, 24.6));
  const back = a > 90;
  const lines: [string, number, boolean][] = back
    ? [["Michael's seat:", 50, false], ['ON COMMIT', 74, true], ['PRESERVE ROWS', 74, true]]
    : [['RESERVED', 46, false], ['Michael', 108, false], ['on vacation', 50, false]];
  const wob = inP(q, 23, 24) ? 5 * Math.sin((q - 23) * 2 * Math.PI * 2) * (1 - seg(q, 23.6, 24)) : 0;
  return (
    <>
      <div style={{position: 'absolute', left: SIGN.x - 11, top: SIGN.top + 200, width: 22, height: H - SIGN.top - 200, background: '#b9865a', border: `5px solid ${PLUM}`, borderRadius: 6}} />
      <div style={{position: 'absolute', left: SIGN.x - SIGN.w / 2, top: SIGN.top, width: SIGN.w,
        transform: `rotate(${wob}deg) scaleX(${Math.max(0.02, Math.abs(Math.cos((a * Math.PI) / 180)))})`, transformOrigin: '50% 100%'}}>
        <div style={{background: '#fff', border: `7px solid ${PLUM}`, borderRadius: 20, padding: '14px 6px 18px', textAlign: 'center', boxShadow: `0 10px 0 ${PLUM}55`}}>
          {lines.map(([s, size, sql], i) => <div key={i} style={{...(sql ? mono : font), fontSize: size, lineHeight: sql ? 1.18 : 1.06, color: PLUM, letterSpacing: sql ? 0 : size < 60 ? 2 : -1, whiteSpace: 'nowrap'}}>{s}</div>)}
        </div>
      </div>
    </>
  );
};

// ---------- labels: one per act, big, never two moving at once ----------
const LABELS: {a: number; b: number; s: string; bg: string; sql?: boolean}[] = [
  {a: 8.5, b: 11.95, s: '5,000 idle sessions', bg: PLUM},
  {a: 15, b: 15.95, s: 'OVERFLOW!', bg: RED},
  {a: 20, b: 21.95, s: 'TRUNCATE frame;', bg: TERM, sql: true},
];
const Label: React.FC<{q: number}> = ({q}) => (
  <>
    {LABELS.filter((l) => inP(q, l.a, l.b)).map((l) => (
      <div key={l.s} style={{...(l.sql ? mono : font), position: 'absolute', left: 760, top: 40, fontSize: l.sql ? 76 : 88, lineHeight: 1.1, color: '#fff', background: l.bg, padding: '8px 30px', borderRadius: 20, whiteSpace: 'nowrap',
        border: '5px solid #fff', boxShadow: `0 10px 0 ${PLUM}55`, transform: `scale(${boing((q - l.a) * 3)}) rotate(-2deg)`, transformOrigin: '0 50%'}}>{l.s}</div>
    ))}
  </>
);

// ---------- title + host tiles ----------
const HOST_X = [110, 470];
type Knock = {s: number; r: number; x: number; y: number};
const Photo: React.FC<{src: string; name: string; x: number; q: number; i: number; k: Knock}> = ({src, name, x, q, i, k}) => {
  const s0 = 2 + i * 0.5;
  if (q < s0) return null;
  const pop = boing((q - s0) * 3);
  return (
    <div style={{position: 'absolute', left: x, top: 660, width: 330, transform: `translate(${k.x}px, ${k.y}px) scale(${pop * k.s}) rotate(${k.r}deg)`, transformOrigin: '50% 55%'}}>
      <Img src={staticFile(src)} style={{width: 330, height: 248, objectFit: 'cover', borderRadius: 14, border: '5px solid #fff', boxShadow: '0 10px 0 rgba(61,15,69,.3)'}} />
      <div style={{...font, fontWeight: 700, fontSize: 30, color: PLUM, marginTop: 12, whiteSpace: 'nowrap', background: '#fff', borderRadius: 10, padding: '2px 12px', display: 'inline-block', boxShadow: '0 4px 0 rgba(61,15,69,.25)'}}>{name}</div>
    </div>
  );
};
const Bubble: React.FC = () => (SHOW_BUBBLES ? null : null);
const TitleLayer: React.FC<{q: number; shake: number}> = ({q, shake}) => {
  const slam = q >= 0 ? (q < 0.15 ? mix(2.6, 1, eOut(q / 0.15)) : 1) : 0;
  const slamRot = q >= 0 ? -8 * kick(q, 0, 6) : 0;
  const drop = q >= 1 ? -420 * (1 - boing((q - 1) * 2.6)) : -9999;
  return (
    <AbsoluteFill style={{transform: `rotate(${shake}deg)`, transformOrigin: '600px 400px'}}>
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560, filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
      <div style={{position: 'absolute', left: 110, top: 240}}>
        <div style={{...font, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap', height: 150, textShadow: `0 7px 0 ${PLUM}88, 0 0 30px rgba(61,15,69,.5)`,
          transform: `translateY(${drop}px)`}}>{TITLE[0]}</div>
        <div style={{position: 'relative', marginTop: 26, height: 150}}>
          {slam > 0 && (
            <div style={{position: 'relative', display: 'inline-block', height: 150, transform: `scale(${slam}) rotate(${slamRot}deg)`, transformOrigin: '30% 50%'}}>
              <div style={{position: 'absolute', left: -24, right: -36, top: 0, bottom: 0, background: PLUM, borderRadius: 18, transform: 'skewX(-6deg)', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
              <div style={{...mono, position: 'relative', paddingLeft: 14, paddingRight: 6, paddingTop: 4, fontSize: 104, lineHeight: '142px', color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap'}}>{TITLE[1]}</div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- the main elephant ----------
const mainPose = (q: number): Pose => {
  const home = at(HOME.x, HOME.y, HOME.s);
  if (q < 2.5) return home;
  if (q < 3) { const u = seg(q, 2.5, 3); return at(mix(HOME.x, 1080, u), HOME.y - 220 * arc(u * 0.5 + 0.5 * u), HOME.s, 10 * u); } // hop onto Enter
  if (q < 7.2) { const s = seg(q, 6.6, 7.2); return at(1080 - 120 * eOut(seg(q, 3, 3.6)), HOME.y + 6 * Math.sin(q * 60) * s, HOME.s, 3 * Math.sin((q - 3) * Math.PI * 2) * (1 - s)); }
  if (q < 8) return at(960, HOME.y + 8 * Math.sin(q * 70), HOME.s); // buried, struggling
  if (q < 9) { // shakes free as the pile topples, becomes the shouter
    const u = ease(seg(q, 8, 8.8));
    return at(mix(960, MAIN2.x, u), mix(HOME.y, MAIN2.y, u) - 260 * arc(seg(q, 8, 8.8)), mix(HOME.s, MAIN2.s, u), -360 * u);
  }
  if (q < 15) { const r = [...SHOUTS, ...BLASTS].reduce((a, k) => a + 6 * kick(q, k, 6), 0); return at(MAIN2.x + 0.6 * r * 3, MAIN2.y, MAIN2.s, -r); }
  if (q < 17) { // the flood lifts it and carries it to the edge
    const u = ease(seg(q, 15, 16.6)), lvl = waterLevel(q);
    return at(mix(MAIN2.x, EDGE - 110, u), Math.min(MAIN2.y, lvl - 90) + 10 * Math.sin(q * 9), MAIN2.s, 8 * Math.sin(q * 5));
  }
  if (q < 18) return at(EDGE - 110 + 60 * seg(q, 17, 17.8), SURF - 90, MAIN2.s, 18 * Math.sin((q - 17) * Math.PI * 4)); // teeter
  if (q < 18.7) { const u = seg(q, 18, 18.7); return at(EDGE + 20 + 120 * u, SURF - 90 + 1300 * eIn(u), MAIN2.s, 20 + 140 * u); }
  if (q < 22) return {...home, hidden: true};
  return at(HOME.x, HOME.y + 600 * (1 - boing((q - 22) * 2.6)), HOME.s);
};

// ---------- the world (everything TRUNCATE can shred) ----------
const World: React.FC<{q: number; t: number; z: number; stomp: number}> = ({q, t, z, stomp}) => {
  const night = inP(q, 8.3, 15.6);
  const nightO = q < 8.3 ? 0 : q < 9 ? seg(q, 8.3, 9) : q < 15.3 ? 1 : 1 - seg(q, 15.3, 15.8);
  const water = waterLevel(q);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: PINK_BG}} />
      {nightO > 0 && <div style={{position: 'absolute', inset: 0, background: NIGHT_BG, opacity: nightO}} />}
      {Array.from({length: 9}, (_, i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 120 * (i + 1), height: 3, background: 'rgba(255,255,255,.18)'}} />)}
      <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: `${ZO.x}px ${ZO.y}px`}}>
        {night && <Grid q={q} t={t} />}
      </div>
      <EnterKey q={q} />
      <Elephant e={mainPose(q)} stomp={q < 15 || q >= 22 ? stomp : 0} />
      <Pile q={q} />
      <Megaphone q={q} />
      <Rings q={q} z={z} />
      <Flood q={q} t={t} />
      <Chips q={q} t={t} water={water} />
    </>
  );
};

// ---------- beat energy ----------
const RULE3 = [1, 1.45, 1.95, 0.55]; // hit, bigger, biggest, break
const BIG = [0, 3, 7, 8, 9, 10, 11, 15, 16, 18, 20, 22, 24];
const INVERT = [7, 15, 18, 20];
const KNOCKS: {k: number; x: number; y: number; r: number}[] = [{k: 8.3, x: -60, y: 20, r: -12}, {k: 15, x: 0, y: -50, r: 9}, {k: 18, x: 30, y: 40, r: -10}, {k: 20, x: -30, y: -20, r: 8}];

export const CardCrazy9: React.FC = () => {
  useFonts();
  useMono();
  const lv = useLevels('a-shades');
  const {f, t} = useT();
  const ons = onsets(lv);
  const q = toQ(ons, t);
  const k = Math.floor(q);
  const dt = k >= 0 ? t - ons[Math.min(k, ons.length - 1)] : 9;
  const env = dt < 0.03 ? dt / 0.03 : Math.exp(-(dt - 0.03) * 8);
  const kf = k >= 0 ? Math.round(ons[Math.min(k, ons.length - 1)] * FPS) : 0;
  const lvl = lv && k >= 0 ? Math.max(lv.rms[kf] ?? 0, lv.rms[kf + 1] ?? 0) : 1;
  const big = BIG.includes(k);
  const live = k >= 0 && k <= 22; // 23 is the freeze
  const hit = live ? env * (0.55 + 0.45 * lvl) * (big ? 1.4 : RULE3[k % 4]) : 0;
  const alt = k % 2 ? 1 : -1;
  const z = zoomZ(q);
  const inv = INVERT.some((s) => { const kk = Math.round(ons[s] * FPS); return f >= kk && f < kk + 2; });
  const punch = `scale(${1 + 0.03 * hit}) rotate(${alt * 0.9 * hit}deg) translateY(${-10 * hit}px)`;
  const knock = KNOCKS.reduce((a, n) => { const e = kick(q, n.k, 3.5); return {x: a.x + n.x * e * Math.cos((q - n.k) * 9), y: a.y + n.y * e, r: a.r + n.r * e}; }, {x: 0, y: 0, r: 0});
  const knocks: Knock[] = [0, 1].map((i) => {
    const b = live || k === 24 ? env * (0.55 + 0.45 * lvl) : 0;
    return {s: 1 + (big ? 0.2 : 0.11) * b, r: (i % 2 ? 1 : -1) * alt * (big ? 4 : 2.5) * b + knock.r * (i ? 0.7 : 1), x: knock.x * (i ? 0.6 : 1), y: knock.y};
  });
  const shred = inP(q, 20, 21.9);
  const NS = 14, sw = W / NS;
  const world = <World q={q} t={t} z={z} stomp={hit} />;
  return (
    <AbsoluteFill style={{background: TERM, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: punch, filter: inv ? 'invert(1) hue-rotate(180deg)' : undefined}}>
        {q < 20 && world}
        {shred && Array.from({length: NS}, (_, i) => {
          const d = Math.max(0, (q - 20 - (i % 2) * 0.06 - rnd(i) * 0.15) * BEAT);
          const y = 1500 * d * d + 150 * d, r = (rnd(i + 5) - 0.5) * 120 * d, gap = (i - NS / 2) * 12 * seg(q, 20, 20.1);
          if (y > H + 300) return null;
          return (
            <AbsoluteFill key={i} style={{clipPath: `inset(0 ${W - (i + 1) * sw}px 0 ${i * sw}px)`, transform: `translate(${gap}px, ${y}px) rotate(${r}deg)`, transformOrigin: `${(i + 0.5) * sw}px 0px`}}>
              <World q={19.95} t={t} z={1} stomp={0} />
            </AbsoluteFill>
          );
        })}
        {q >= 21.9 && (
          <>
            {/* INSERT: the clean frame slides back row by row, then the elephant pops up on 22 */}
            {Array.from({length: 9}, (_, i) => (
              <div key={i} style={{position: 'absolute', left: (i % 2 ? 1 : -1) * W * (1 - eOut(seg(q, 21.6 + i * 0.02, 22))), top: i * 120, width: W, height: 121,
                background: PINK_BG, backgroundSize: `${W}px ${H}px`, backgroundPosition: `0 ${-i * 120}px`}} />
            ))}
            <Elephant e={mainPose(q)} stomp={q < 23 ? hit : 0} />
          </>
        )}
      </AbsoluteFill>
      <Meter q={q} />
      <Label q={q} />
      <TitleLayer q={q} shake={live ? alt * 0.5 * hit + knock.r * 0.15 : 0} />
      {HOSTS.map((h, i) => <Photo key={h.name} src={h.photo ?? ''} name={h.name} x={HOST_X[i] ?? 110 + i * 360} q={q} i={i} k={knocks[i]} />)}
      <Bubble />
      {/* the gag texts sit above the title and the tiles: they collide on purpose */}
      <Burst q={q} beat={7} text="BLOAT!" x={820} y={600} color="#ff7124" size={150} dur={1.3} />
      {SHOUTS.map((s, i) => <Burst key={s} q={q} beat={s} text="CATALOG CHANGED!" x={830} y={660} color={['#ffcc4d', '#ff7124', RED][i]} size={70} dur={0.9} scale={0.95 + 0.12 * i} />)}
      <Chair wob={0} />
      <Sign q={q} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
