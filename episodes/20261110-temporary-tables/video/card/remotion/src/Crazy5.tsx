import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile} from 'remotion';
import {at, Beat, beatPulse, beatT, ELE, Grain, H, HOSTS, lin, pop, Sparkle, TITLE, useFonts, useLevels, useT, W} from './common';

// v5, the ep 196 title card ("Temporary tables"). Same look, beat clock, length (14 s) and final
// hit (beat 24, 12.90 s) as Crazy4, so it drops into the same compose command. Crazier: temp
// tables pop into existence and vanish all the time, a CREATE TEMP TABLE storm, a pg_class bloat
// counter and a pile of pg_class rows that buries the elephant, VACUUM, the elephant multiplies
// itself into 32 temp elephants that all go ON COMMIT DROP, then surfs a TPS chart off a
// performance cliff and jetpacks back. RGB-split glitches and a dutch tilt on the beat.
// Michael (on vacation) gags stay friendly: a deck chair with a drink, his sign; nothing of his is
// hit, buried or thrown; on the final hit his sign flips to "ON COMMIT PRESERVE ROWS".
//
// Beats (one beat = 0.517 s, beat 0 = 0.486 s):
//  0-2    deck chair "RESERVED / Michael / on vacation" at the right edge; temp tables start popping
//  1.2-2  cannonball in, lands on 2 (CREATE!)
//  3-7    temp tables drop onto its head, one per beat; the pg_class counter climbs; SQL storm doubles per beat
//  8      spin kick: the tables fly and vanish; 9 smashes the title (TRUNCATE!), letters reassemble by 10.4
//  10-12  headspin + windmill while juggling temp tables with its feet
//  12-14  pg_class rows rain down and pile up, burying it to the sunglasses (13 BLOAT!); hosts' bubbles
//  14     VACUUM! blasts the pile away
//  14.5-16 CREATE TEMP ELEPHANT: clones double every quarter beat to 32; on 16 all ON COMMIT DROP (POOF!)
//  15.4-18 the chair slides out; a TPS chart draws in; the elephant surfs the line on a temp table
//  18-19.3 runs past the cliff edge, hangs ("temp_buffers: FULL"), falls (SPILL! on 19)
//  20-21  jetpacks back up home; 21-22 headbang; 22-23 rockets out; 23-24 cannonballs down
//  24     final hit: clean frame, title + hosts, the sign flips to "Michael's seat: ON COMMIT PRESERVE ROWS"

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const PLUM = '#3d0f45';
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

const bt: Beat = {t0: 0.486, b: 60 / 116};
const B = (k: number) => beatT(bt, k);
const beatPos = (t: number) => (t - bt.t0) / bt.b;
const hop = (t: number, from: number, to: number, len = 1) => {
  const p = beatPos(t);
  if (p < from || p >= to) return 0;
  const ph = ((p - from) % len) / len;
  return 4 * ph * (1 - ph);
};
const land = (t: number, from: number, to: number, len = 1) => {
  const p = beatPos(t);
  if (p < from || p >= to + 0.5) return 0;
  const ph = ((p - from) % len) / len;
  return Math.exp(-ph * len * 9);
};
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const arc = (q: number) => 4 * q * (1 - q);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const kick = (t: number, s: number, rate = 6) => (t >= s ? Math.exp(-(t - s) * rate) : 0);
const inP = (p: number, a: number, b: number) => p >= a && p < b;

// Elephant geometry (as v1-v4).
const EH = 880, EK = EH / ELE.h, EW = ELE.w * EK, EX = 1120, EY = H - EH + 170;
const OX = EX + EW / 2, OY = EY + 0.62 * EH;
const HEAD_TOP = 26;
const SMASH = {x: 520 - OX, y: 330 - OY};
const UPSIDE_Y = -292;

// The performance cliff: a TPS line, flat from x 880 to the edge, then straight down.
const LINE_Y = 640, LINE_X0 = 880, CLIFF_X = 1560;
const SURF = {s: 0.55, y: 507 - OY, x0: 950 - OX, x1: CLIFF_X - 40 - OX, hang: CLIFF_X + 110 - OX};

type Pose = {x: number; y: number; rot: number; sx: number; sy: number; scale: number; hidden?: boolean; top?: boolean; jet?: number; flame?: number};
const pose = (t: number, bass: number): Pose => {
  const p = beatPos(t);
  let x = 0, y = 0, rot = 0, sx = 1, sy = 1, scale = 1, top = false, jet = 0, flame = 0;
  if (p < 1.2) return {x: 900, y: -1500, rot: 0, sx: 1, sy: 1, scale: 0.55, hidden: true};
  if (p >= 19.3 && p < 20) return {x: 0, y: 1200, rot: 0, sx: 1, sy: 1, scale: 1, hidden: true};
  if (p < 2) {
    const u = (p - 1.2) / 0.8;
    x = 900 * (1 - u); y = -1500 * (1 - u * u); rot = -1080 * (1 - u); scale = 0.55 + 0.45 * Math.pow(u, 4);
  } else if (p < 8) {
    const h = hop(t, 4, 8);
    y = -140 * h; sy += 0.06 * h; sx -= 0.04 * h;
  } else if (p < 8.55) {
    const q = (p - 8) / 0.55;
    y = -380 * arc(q); rot = 360 * easeInOut(q);
  } else if (p < 9) {
    const q = (p - 8.55) / 0.45;
    x = SMASH.x * q; y = SMASH.y * q - 260 * arc(q); scale = 1 - 0.45 * q; rot = -30 * q; top = true;
  } else if (p < 9.8) {
    const q = (p - 9) / 0.8;
    x = SMASH.x * (1 - q); y = SMASH.y * (1 - q) - 380 * arc(q); scale = 0.55 + 0.45 * q; rot = -30 * (1 - q) - 360 * easeInOut(q); top = true;
  } else if (p < 10) {
    const q = (p - 9.8) / 0.2;
    rot = 180 * easeInOut(q); y = UPSIDE_Y * q; scale = 1 - 0.2 * q;
  } else if (p < 11) {
    rot = 180; y = UPSIDE_Y; scale = 0.8;
    const c = Math.cos(2 * Math.PI * 2 * (p - 10));
    sx *= Math.sign(c || 1) * Math.max(0.08, Math.abs(c));
  } else if (p < 12) {
    rot = 180 + 720 * easeInOut(p - 11); y = UPSIDE_Y - 60 * Math.sin((p - 11) * Math.PI); scale = 0.8;
  } else if (p < 13) { // flip upright, lands in the growing pg_class pile on 13
    const q = p - 12;
    rot = 180 + 180 * easeInOut(q); y = UPSIDE_Y * (1 - q) - 450 * arc(q); scale = 0.8 + 0.2 * q;
  } else if (p < 14) { // stuck in the bloat, struggling
    const s = lin(p, 13.3, 14);
    x = 9 * Math.sin(t * 60) * s; rot = 4 * Math.sin((p - 13) * Math.PI * 4) * s;
  } else if (p < 14.5) { // VACUUM blast-off
    const q = (p - 14) / 0.5;
    y = -340 * arc(q); rot = 360 * easeInOut(q);
  } else if (p < 15.4) { // groove while the clones multiply
    rot = 10 * Math.sin(2 * Math.PI * (p - 14.5)); y = -40 * hop(t, 14.5, 15.4, 0.5);
  } else if (p < 16) { // jump onto the TPS line
    const q = (p - 15.4) / 0.6, e = easeInOut(q);
    x = SURF.x0 * e; y = SURF.y * e - 300 * arc(q); scale = 1 - (1 - SURF.s) * e; rot = -360 * e;
  } else if (p < 18) { // surfing the line
    const q = (p - 16) / 2;
    x = SURF.x0 + (SURF.x1 - SURF.x0) * q; y = SURF.y - 14 * Math.abs(Math.sin(2 * Math.PI * p)); scale = SURF.s; rot = 5 * Math.sin(2 * Math.PI * p);
  } else if (p < 18.6) { // past the edge, hangs in the air
    const q = easeOut(clamp01((p - 18) / 0.15));
    x = SURF.x1 + (SURF.hang - SURF.x1) * q + 5 * Math.sin(t * 70) * lin(p, 18.3, 18.6); y = SURF.y; scale = SURF.s; rot = -8 * q;
  } else if (p < 19.3) { // falls off the cliff
    const q = (p - 18.6) / 0.7;
    x = SURF.hang + 60 * q; y = SURF.y + 1400 * q * q; scale = SURF.s; rot = -8 + 170 * q;
  } else if (p < 21) { // jetpack rescue, rises back home
    const q = p - 20, e = easeOut(q);
    y = 1000 * (1 - e); x = 50 * Math.sin(q * 10) * (1 - q); rot = 6 * Math.sin(q * 14) * (1 - q); jet = 1; flame = 1 - 0.6 * q;
  } else if (p < 22) {
    rot = 16 * Math.sin(2 * Math.PI * (p - 21)); jet = 1 - clamp01((p - 21) / 0.3);
  } else if (p < 22.3) {
    const q = (p - 22) / 0.3;
    sy -= 0.12 * Math.sin(Math.PI * q); sx += 0.08 * Math.sin(Math.PI * q); jet = clamp01(q * 3); flame = q > 0.6 ? 0.5 : 0;
  } else if (p < 23) {
    const q = (p - 22.3) / 0.7;
    y = -1800 * q * q; x = 60 * Math.sin(q * 12); rot = 8 * Math.sin(q * 20); jet = 1; flame = 1;
  } else if (p < 24) {
    const q = p - 23;
    y = -1800 * (1 - q * q); rot = 720 * easeInOut(q);
  }
  const sq = Math.max(land(t, 2, 2.01) * 1.6, land(t, 4, 8), land(t, 13, 13.01) * 1.3, land(t, 21, 21.01) * 1.1, land(t, 24, 24.01) * 1.8);
  sx += 0.14 * sq + 0.03 * bass; sy -= 0.16 * sq + 0.03 * bass;
  return {x, y, rot, sx, sy, scale, top, jet, flame};
};
const centre = (e: Pose) => ({x: OX + e.x, y: OY + e.y});

// ---- Temp tables ----
const BW = 290, BH = 66;
const COLORS = ['#42a8c8', '#39b54a', '#f2a130', '#ff7124', '#8a4fd8', '#16657c', '#d93d1b', '#2fa38a'];
const GridIcon: React.FC = () => (
  <svg width={34} height={30} viewBox="0 0 34 30" style={{marginLeft: 12, marginRight: 10, flex: 'none'}}>
    <rect x={2} y={2} width={30} height={26} rx={4} fill="rgba(255,255,255,.25)" stroke="#fff" strokeWidth={3} />
    <rect x={2} y={2} width={30} height={8} rx={3} fill="#fff" />
    <line x1={2} y1={19} x2={32} y2={19} stroke="#fff" strokeWidth={2.5} /><line x1={14} y1={10} x2={14} y2={28} stroke="#fff" strokeWidth={2.5} />
  </svg>
);
// drop: 0 = solid, 1 = gone (dashed ghost, fading).
const TmpBox: React.FC<{label: string; color: string; style?: React.CSSProperties; drop?: number}> = ({label, color, style, drop = 0}) => (
  <div style={{position: 'absolute', width: BW, height: BH, borderRadius: 12, background: drop > 0 ? 'transparent' : color, border: `4px ${drop > 0 ? 'dashed' : 'solid'} #fff`, boxSizing: 'border-box',
    boxShadow: drop > 0 ? 'none' : `0 7px 0 ${PLUM}66`, display: 'flex', alignItems: 'center', ...style, opacity: (style?.opacity as number ?? 1) * (1 - drop)}}>
    <GridIcon />
    <div style={{...mono, fontSize: 30, color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap', textShadow: drop > 0 ? 'none' : `0 2px 0 ${PLUM}88`}}>{label}</div>
  </div>
);

// White puffs where something vanished.
const Poof: React.FC<{x: number; y: number; d: number; size?: number}> = ({x, y, d, size = 1}) => {
  if (d < 0 || d > 0.5) return null;
  const q = d / 0.5;
  return (
    <>
      {Array.from({length: 7}, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + rnd(i + x) * 0.6, r = (30 + 110 * easeOut(q)) * size, rr = (26 + 30 * q) * size;
        return <div key={i} style={{position: 'absolute', left: x + Math.cos(a) * r - rr, top: y + Math.sin(a) * r * 0.7 - rr, width: 2 * rr, height: 2 * rr, borderRadius: '50%', background: '#fff', opacity: 0.9 * (1 - q)}} />;
      })}
    </>
  );
};

const STACK1 = ['tmp_orders', 'tmp_users', 'tmp_ids', 'tmp_report', 'tmp_batch'].map((label, i) => ({label, color: COLORS[(i * 3) % COLORS.length], at: B(3 + i)}));
const FALL = 0.42, FALL_H = 1100;
const slotTop = (i: number) => HEAD_TOP - (i + 1) * (BH - 6);

const Stack: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p >= 9) return null;
  const out: React.ReactNode[] = [];
  const kicked = B(8) + 0.06;
  STACK1.forEach((b, i) => {
    const d = t - b.at;
    if (d < -FALL) return;
    const top = slotTop(i), left = EW / 2 - BW / 2 + (rnd(i + 14) - 0.5) * 18;
    let y = top, x = left, rot = p >= 4 && p < 8 ? (i + 1) * 1.6 * Math.sin((p - 4) * Math.PI * 2 - 0.6) : 0, sy = 1, sx = 1, drop = 0;
    if (d < 0) { const q = 1 + d / FALL; y = top - FALL_H * (1 - q * q); rot = (1 - q) * (rnd(i + 3) - 0.5) * 60; }
    else { const s = Math.exp(-d * 10); sy = 1 - 0.25 * s; sx = 1 + 0.15 * s; }
    if (t >= kicked) {
      const k = t - kicked, vx = (rnd(i * 5 + 1) - 0.5) * 2600, vy = -900 - 900 * rnd(i * 5 + 2);
      x += vx * k; y += vy * k + 2400 * k * k; rot += (rnd(i * 5 + 3) - 0.5) * 1600 * k;
      drop = clamp01((k - 0.2) / 0.25);
      if (drop >= 1) return;
    }
    out.push(<TmpBox key={i} label={b.label} color={b.color} drop={drop} style={{left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '50% 100%'}} />);
  });
  return <>{out}</>;
};

// Jetpack (as v4).
const Jetpack: React.FC<{jet: number; flame: number; f: number}> = ({jet, flame, f}) => (
  <div style={{position: 'absolute', inset: 0, transform: `scale(${jet})`, transformOrigin: '50% 45%'}}>
    {[EW * 0.02, EW * 0.84].map((lx, i) => {
      const fl = flame * (0.75 + 0.25 * rnd(f * 3 + i));
      return (
        <div key={i} style={{position: 'absolute', left: lx, top: EH * 0.22, width: 96, height: 300}}>
          {fl > 0 && (
            <svg width={160} height={420} viewBox="-80 0 160 420" style={{position: 'absolute', left: -32, top: 270}}>
              <defs><linearGradient id={`fl${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff6b0" /><stop offset="0.4" stopColor="#ffb02e" /><stop offset="1" stopColor="#ff4b1f" stopOpacity="0" /></linearGradient></defs>
              <path d={`M-40,0 Q-55,${160 * fl} 0,${400 * fl} Q55,${160 * fl} 40,0 Z`} fill={`url(#fl${i})`} />
            </svg>
          )}
          <div style={{position: 'absolute', inset: 0, borderRadius: '44px 44px 18px 18px', background: 'linear-gradient(90deg, #9aa3b5, #eef1f7 45%, #7d8699)', border: `5px solid ${PLUM}`}} />
          <div style={{position: 'absolute', left: 0, top: 0, width: 96, height: 70, borderRadius: '44px 44px 8px 8px', background: '#ff4d6d', border: `5px solid ${PLUM}`, boxSizing: 'border-box'}} />
          <div style={{position: 'absolute', left: 18, bottom: -26, width: 60, height: 30, background: '#555c6e', border: `5px solid ${PLUM}`, borderRadius: '0 0 10px 10px'}} />
        </div>
      );
    })}
  </div>
);

const ElephantBody: React.FC<{e: Pose; t: number; f?: number; hue?: number; opacity?: number; withStack?: boolean; glint?: number}> = ({e, t, f = 0, hue = 0, opacity = 1, withStack, glint = 0}) => (
  <div style={{position: 'absolute', left: EX + e.x, top: EY + e.y, width: EW, height: EH, opacity,
    transform: `rotate(${e.rot}deg) scale(${e.scale * e.sx}, ${e.scale * e.sy})`, transformOrigin: '50% 62%'}}>
    {(e.jet ?? 0) > 0 && <Jetpack jet={e.jet!} flame={e.flame ?? 0} f={f} />}
    <Img src={staticFile('elephant.png')} style={{position: 'absolute', left: 0, top: 0, width: EW, height: EH, filter: hue ? `hue-rotate(${hue}deg) saturate(1.6)` : undefined,
      maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}} />
    {glint > 0 && <><Sparkle x={850 * EK} y={310 * EK} s={glint * 1.1} rot={t * 120} /><Sparkle x={500 * EK} y={310 * EK} s={glint * 0.6} rot={-t * 120} /></>}
    {withStack && <Stack t={t} />}
  </div>
);

const TRAIL: [number, number][] = [[1.2, 2], [8.55, 9.8], [10, 12.6], [14, 14.5], [15.4, 16], [18.6, 19.3], [20, 21], [22.3, 24.05]];
const Trail: React.FC<{t: number; bass: number; topLayer: boolean}> = ({t, bass, topLayer}) => {
  const p = beatPos(t);
  if (!TRAIL.some(([a, b]) => p >= a && p < b)) return null;
  const e = pose(t, bass);
  if (!!e.top !== topLayer || e.hidden) return null;
  return <>{[4, 3, 2, 1].map((k) => { const g = pose(t - k * 0.045, bass); return g.hidden ? null : <ElephantBody key={k} e={g} t={t} hue={k * 70} opacity={0.42 - k * 0.08} />; })}</>;
};

// ---- Michael: a deck chair, a drink, his sign. Never hit, buried or thrown. ----
const CX = 1700, CS = 0.85;
const chairDX = (p: number) => 560 * easeInOut(clamp01((p - 15.4) / 0.5)) * (1 - easeInOut(clamp01((p - 22.4) / 0.6)));

const Board: React.FC<{t: number}> = ({t}) => {
  const a = 180 * easeInOut(clamp01((t - B(24)) / 0.32));
  const back = a > 90;
  const lines: [string, number][] = back ? [["Michael's seat:", 36], ['ON COMMIT', 50], ['PRESERVE ROWS', 40]] : [['RESERVED', 32], ['Michael', 76], ['on vacation', 34]];
  return (
    <div style={{position: 'absolute', left: 150 - 215, top: -380, width: 430, transform: `scaleX(${Math.max(0.02, Math.abs(Math.cos((a * Math.PI) / 180)))})`}}>
      <div style={{background: '#fff', border: `6px solid ${PLUM}`, borderRadius: 16, padding: '12px 8px 14px', textAlign: 'center', boxShadow: `0 8px 0 ${PLUM}55`}}>
        {lines.map(([s, size], i) => <div key={i} style={{...font, fontSize: size, lineHeight: 1.08, color: PLUM, letterSpacing: size < 40 ? 1.5 : -1, whiteSpace: 'nowrap'}}>{s}</div>)}
      </div>
    </div>
  );
};

const Chair: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  const startle = (s: number, amp: number) => (t >= B(s) ? amp * Math.exp(-(t - B(s)) * 4) * Math.sin((t - B(s)) * 22) : 0);
  const wob = (p < 2 ? 2 * Math.sin(p * Math.PI * 2) : 0) + startle(2, 6) + startle(24, 4) + startle(13, 2);
  const stripes = ['#ff5fcf', '#fff', '#42a8c8', '#fff', '#ff5fcf', '#fff', '#42a8c8'];
  return (
    <div style={{position: 'absolute', left: CX - 150 + chairDX(p), top: H - 400, width: 300, height: 400, transform: `rotate(${wob}deg) scale(${CS})`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', left: 142, top: -230, width: 16, height: 260, background: '#b9865a', border: `4px solid ${PLUM}`, borderRadius: 6}} />
      <Board t={t} />
      <svg width={360} height={400} viewBox="0 0 360 400" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><clipPath id="sling"><path d="M70,40 L200,40 L250,260 L120,260 Z" /></clipPath></defs>
        <g clipPath="url(#sling)">{stripes.map((c, i) => <rect key={i} x={60 + i * 30} y={30} width={30} height={240} fill={c} transform="skewX(12)" />)}</g>
        <g stroke={PLUM} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" fill="none">
          <path d="M70,40 L200,40 L250,260 L120,260 Z" />
          <line x1={70} y1={40} x2={150} y2={395} /><line x1={200} y1={40} x2={280} y2={395} />
          <line x1={120} y1={260} x2={60} y2={395} /><line x1={250} y1={260} x2={190} y2={395} />
          <line x1={40} y1={250} x2={280} y2={250} />
        </g>
        {/* the drink on the armrest, with a paper umbrella */}
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

// Comic bursts.
const Burst: React.FC<{t: number; beat: number; text: string; x: number; y: number; color: string; size?: number}> = ({t, beat, text, x, y, color, size = 92}) => {
  const d = t - B(beat);
  if (d < 0 || d > 0.75) return null;
  const s = Math.min(1, d / 0.08) * (d > 0.55 ? 1 - (d - 0.55) / 0.2 : 1);
  const pts = Array.from({length: 28}, (_, i) => { const a = (i / 28) * Math.PI * 2, r = i % 2 ? 120 : 190 + 25 * rnd(i + beat); return `${Math.cos(a) * r * 1.45},${Math.sin(a) * r}`; }).join(' ');
  return (
    <div style={{position: 'absolute', left: x - 290, top: y - 200, width: 580, height: 400, transform: `scale(${s * (1 + 0.1 * Math.sin(d * 40))}) rotate(-8deg)`}}>
      <svg width={580} height={400} viewBox="-290 -200 580 400" style={{position: 'absolute'}}><polygon points={pts} fill={color} stroke={PLUM} strokeWidth={9} strokeLinejoin="round" /></svg>
      <div style={{...font, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size, color: '#fff', letterSpacing: -1,
        WebkitTextStroke: `6px ${PLUM}`, paintOrder: 'stroke fill', fontStyle: 'italic'}}>{text}</div>
    </div>
  );
};

// CREATE TEMP TABLE storm: rows of SQL scroll across the whole frame, doubling every beat 3-8.
const Storm: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 2.6 || p > 12.6) return null;
  const n = Math.min(26, Math.floor(Math.pow(2, Math.max(0, p - 2.6))));
  const fade = 1 - lin(p, 12, 12.6);
  const order = Array.from({length: 26}, (_, i) => i).sort((a, b) => rnd(a + 300) - rnd(b + 300));
  return (
    <>
      {order.slice(0, n).map((row, k) => {
        const dir = row % 2 ? 1 : -1, speed = 260 + 420 * rnd(row + 40), seg = 1500;
        const off = ((t * speed * dir + rnd(row + 70) * seg) % seg + seg) % seg - seg;
        const txt = Array.from({length: 4}, (_, j) => `CREATE TEMP TABLE tmp_${Math.floor(1000 + rnd(row * 9 + j) * 8999)} (id int8);`).join('   ');
        return <div key={row} style={{...mono, position: 'absolute', left: off, top: 18 + row * 41, fontSize: 28, color: PLUM, opacity: 0.26 * fade * (k === n - 1 ? clamp01((p - 2.6) % 1 * 4 + 0.3) : 1), whiteSpace: 'nowrap'}}>{txt}</div>;
      })}
    </>
  );
};

// pg_class bloat HUD (top right), beats 3-14.6.
const Hud: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 2.8 || p > 14.7) return null;
  const vac = p >= 14;
  const fill = vac ? 0.04 : clamp01((p - 3) / 10);
  const rows = vac ? 412 : Math.floor(412 * Math.pow(2.2, Math.max(0, p - 3)));
  const o = lin(p, 2.8, 3.1) * (1 - lin(p, 14.4, 14.7));
  const pulse = beatPulse(bt, t, 1, 3);
  const red = fill > 0.75;
  const blink = p >= 13 && p < 14 && Math.floor(p * 4) % 2 === 0;
  return (
    <div style={{position: 'absolute', left: 860, top: 40, width: 410, opacity: o, transform: `scale(${1 + 0.06 * pulse})`, transformOrigin: '0% 0%'}}>
      <div style={{background: '#fff', border: `5px solid ${PLUM}`, borderRadius: 16, padding: '10px 16px 14px', boxShadow: `0 7px 0 ${PLUM}55`}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{...mono, fontSize: 26, color: PLUM}}>pg_class rows</div>
          <div style={{...mono, fontSize: 34, color: red ? '#d93d1b' : PLUM}}>{rows.toLocaleString('en-US')}</div>
        </div>
        <div style={{marginTop: 8, height: 22, borderRadius: 11, background: '#f3d6ef', overflow: 'hidden'}}>
          <div style={{width: `${fill * 100}%`, height: '100%', background: red ? '#d93d1b' : fill > 0.45 ? '#f2a130' : '#39b54a'}} />
        </div>
        {blink && <div style={{...font, fontSize: 30, color: '#d93d1b', marginTop: 6, letterSpacing: 2}}>CATALOG BLOAT</div>}
        {vac && <div style={{...font, fontSize: 30, color: '#39b54a', marginTop: 6, letterSpacing: 2}}>VACUUMED</div>}
      </div>
    </div>
  );
};

// Temp tables popping into existence and vanishing, one every half beat (2-22), right half only,
// clear of Michael's sign.
const POPS = Array.from({length: 41}, (_, k) => {
  let x = 0, y = 0, j = 0;
  do { x = 900 + rnd(k * 13 + j) * 980; y = 150 + rnd(k * 17 + j + 5) * 840; j++; } while (x > 1480 && y > 330 && j < 20);
  return {k, at: B(2 + k * 0.5), x, y, label: `tmp_${Math.floor(10 + rnd(k + 900) * 989)}`, color: COLORS[k % COLORS.length], s: 0.45 + 0.25 * rnd(k + 33), r: (rnd(k + 66) - 0.5) * 30};
});
const Pops: React.FC<{t: number; f: number}> = ({t, f}) => (
  <>
    {POPS.flatMap((o) => {
      const d = t - o.at, life = bt.b * 0.9;
      if (d < 0 || d > life + 0.5) return [];
      const out: React.ReactNode[] = [];
      if (d < life) {
        const s = pop(f, o.at, 8, 260);
        out.push(<TmpBox key={'b' + o.k} label={o.label} color={o.color} style={{left: o.x - BW / 2, top: o.y - BH / 2, transform: `scale(${o.s * s}) rotate(${o.r}deg)`}} />);
      } else out.push(<Poof key={'p' + o.k} x={o.x} y={o.y} d={d - life} size={0.6 * o.s / 0.45} />);
      return out;
    })}
  </>
);

// Juggling with its feet during the headspin/windmill (10-12); thrown off on 12.
const JUGGLE = ['tmp_a', 'tmp_b', 'tmp_c', 'tmp_d'];
const Juggle: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 9.9 || p > 12.9) return null;
  const cx = OX, base = OY + UPSIDE_Y - 250;
  return (
    <>
      {JUGGLE.flatMap((label, j) => {
        const tt = Math.min(p, 12) - 10 + j / JUGGLE.length;
        const u = ((tt % 1) + 1) % 1, side = (Math.floor(tt) + j) % 2 ? 1 : -1;
        let x = cx + side * (1 - 2 * u) * 150, y = base - 300 * arc(u), r = side * 360 * u;
        const enter = clamp01((p - 9.9) / 0.15);
        if (p >= 12) { const k = t - B(12); x += (j - 1.5) * 1400 * k; y -= 900 * k - 1800 * k * k; r += 900 * k; }
        const drop = p >= 12 ? clamp01((t - B(12) - 0.25) / 0.2) : 0;
        if (drop >= 1) { const d = t - B(12) - 0.45; return [<Poof key={label} x={x} y={y} d={d} size={0.8} />]; }
        return [<TmpBox key={label} label={label} color={COLORS[(j * 2 + 1) % COLORS.length]} drop={drop} style={{left: x - BW / 2, top: y - BH / 2, transform: `scale(${0.6 * enter}) rotate(${r}deg)`}} />];
      })}
    </>
  );
};

// pg_class rows rain and pile up 11.6-14, buried to the sunglasses; VACUUM on 14 blows them away.
const PILE_N = 45, LANES = [955, 1225, 1495], ROW_W = 270, ROW_H = 34;
const Pile: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 11.5 || p > 15.2) return null;
  const vac = t - B(14);
  return (
    <>
      {Array.from({length: PILE_N}, (_, i) => {
        const ts = B(11.6) + (B(13.9) - B(11.6)) * (i / PILE_N) + rnd(i + 500) * 0.05;
        const d = t - ts, fall = 0.32;
        if (d < 0) return null;
        const lane = i % 3, level = Math.floor(i / 3);
        const ty = H - (level + 1) * ROW_H, tx = LANES[lane] - ROW_W / 2 + (rnd(i + 7) - 0.5) * 30;
        let y = d < fall ? -60 + (ty + 60) * Math.pow(d / fall, 2) : ty, x = tx, r = (rnd(i + 8) - 0.5) * 6, o = 1;
        if (vac >= 0) {
          const a = Math.atan2(y + ROW_H / 2 - 820, x + ROW_W / 2 - 1200) + (rnd(i + 9) - 0.5) * 0.8, v = 1800 + 1600 * rnd(i + 10);
          x += Math.cos(a) * v * vac; y += Math.sin(a) * v * vac - 500 * vac; r += (rnd(i + 11) - 0.5) * 1200 * vac; o = 1 - clamp01(vac / 0.6);
          if (o <= 0) return null;
        }
        return (
          <div key={i} style={{...mono, position: 'absolute', left: x, top: y, width: ROW_W, height: ROW_H, boxSizing: 'border-box', background: i % 2 ? '#fff' : '#ffe6fb', border: `3px solid ${PLUM}`,
            borderRadius: 6, fontSize: 18, lineHeight: `${ROW_H - 6}px`, color: PLUM, paddingLeft: 10, whiteSpace: 'nowrap', overflow: 'hidden', opacity: o, transform: `rotate(${r}deg)`}}>
            {`pg_temp_${3 + (i % 5)}.tmp_${Math.floor(1000 + rnd(i + 600) * 8999)} | r`}
          </div>
        );
      })}
    </>
  );
};

// CREATE TEMP ELEPHANT: clones double every quarter beat (14.5-15.75) to 32, all ON COMMIT DROP on 16.
const CLONE_ORDER = Array.from({length: 32}, (_, i) => parseInt(i.toString(2).padStart(5, '0').split('').reverse().join(''), 2));
const Clones: React.FC<{t: number; f: number}> = ({t, f}) => {
  const p = beatPos(t);
  if (p < 14.5 || p > 16.7) return null;
  const n = Math.min(32, Math.pow(2, Math.floor((p - 14.5) / 0.25)));
  const dropD = t - B(16);
  const out: React.ReactNode[] = [];
  for (let k = 0; k < 32; k++) {
    const cell = CLONE_ORDER[k];
    const gen = k === 0 ? 0 : Math.floor(Math.log2(k)) + 1;
    const born = B(14.5 + gen * 0.25);
    if (t < born) continue;
    const cxw = 920 + (cell % 8) * 128, cyw = 130 + Math.floor(cell / 8) * 100;
    if (dropD >= 0) { out.push(<Poof key={'p' + k} x={cxw} y={cyw} d={dropD - (k % 4) * 0.03} size={0.55} />); continue; }
    const s = pop(f, born, 8, 260), step = Math.floor(p * 4 + k) % 2 ? 1 : -1;
    const e: Pose = {x: cxw - OX, y: cyw - OY - 10 * hop(t, 14.5, 16, 0.5), rot: 10 * step, sx: 1, sy: 1, scale: 0.12 * s};
    out.push(<ElephantBody key={k} e={e} t={t} hue={(k * 47 + 30) % 360} />);
  }
  const banner = dropD < 0 ? `CREATE TEMP ELEPHANT ×${n}` : 'ON COMMIT DROP';
  const bo = dropD < 0 ? 1 : 1 - clamp01((dropD - 0.6) / 0.3);
  out.push(
    <div key="banner" style={{...mono, position: 'absolute', left: 900, top: 14, padding: '4px 18px', background: PLUM, color: '#fff', borderRadius: 10, fontSize: 36, opacity: bo, whiteSpace: 'nowrap',
      transform: `scale(${1 + 0.08 * beatPulse(bt, t, 0.25, 14.5)})`, transformOrigin: '0 50%'}}>{banner}</div>,
  );
  return <>{out}</>;
};

// The TPS chart with the performance cliff (15.4-20.5).
const Cliff: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 15.4 || p > 20.6) return null;
  const draw = easeInOut(clamp01((p - 15.4) / 0.6));
  const o = 1 - lin(p, 20, 20.6);
  const lab = clamp01((p - 16.3) / 0.3);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <path d={`M${LINE_X0},${LINE_Y} L${CLIFF_X},${LINE_Y} L${CLIFF_X},${H} L${LINE_X0},${H} Z`} fill={PLUM} opacity={0.18 * draw} />
        <path d={`M${LINE_X0},${LINE_Y} L${CLIFF_X},${LINE_Y} L${CLIFF_X},1010 L${W},1010`} pathLength={1} fill="none" stroke={PLUM} strokeWidth={22} strokeLinejoin="round" strokeDasharray="1" strokeDashoffset={1 - draw} />
        <path d={`M${LINE_X0},${LINE_Y} L${CLIFF_X},${LINE_Y} L${CLIFF_X},1010 L${W},1010`} pathLength={1} fill="none" stroke="#fff" strokeWidth={11} strokeLinejoin="round" strokeDasharray="1" strokeDashoffset={1 - draw} />
        <line x1={LINE_X0} y1={H - 10} x2={LINE_X0} y2={430} stroke={PLUM} strokeWidth={6} opacity={draw} />
      </svg>
      <div style={{...mono, position: 'absolute', left: LINE_X0 + 16, top: 440, fontSize: 30, color: PLUM, opacity: draw}}>TPS</div>
      <div style={{...font, position: 'absolute', left: CLIFF_X + 26, top: 760, fontSize: 44, lineHeight: 1.0, color: '#fff', background: PLUM, padding: '8px 16px', borderRadius: 12,
        opacity: lab, transform: `scale(${0.6 + 0.4 * lab}) rotate(-4deg)`, transformOrigin: '0 0'}}>performance<br />cliff</div>
    </div>
  );
};

// The surfboard (a temp table) and the "temp_buffers: FULL" sign while it hangs in the air.
const SurfBits: React.FC<{t: number; bass: number}> = ({t, bass}) => {
  const p = beatPos(t);
  if (p < 15.8 || p > 19.3) return null;
  const e = pose(t, bass), c = centre(e);
  const s = clamp01((p - 15.8) / 0.12);
  const out: React.ReactNode[] = [
    <TmpBox key="board" label="tmp_surf" color="#ff7124" style={{left: c.x - BW / 2, top: c.y + 0.2 * EH * e.scale - 18, transform: `rotate(${e.rot}deg) scale(${0.9 * s})`, transformOrigin: '50% 0'}} />,
  ];
  if (p >= 18.1 && p < 18.9) {
    const q = clamp01((p - 18.1) / 0.1);
    out.push(
      <div key="sign" style={{...mono, position: 'absolute', left: c.x - 200, top: c.y - 330, width: 400, textAlign: 'center', background: '#fff', border: `5px solid ${PLUM}`, borderRadius: 14,
        fontSize: 32, color: '#d93d1b', padding: '8px 0', transform: `scale(${q}) rotate(${6 * Math.sin(t * 30)}deg)`}}>temp_buffers: FULL</div>,
    );
  }
  return <>{out}</>;
};

const BURSTS = [{beat: 2, n: 80, power: 1.1, o: null as null | {x: number; y: number}}, {beat: 9, n: 90, power: 1.1, o: {x: 560, y: 330}}, {beat: 14, n: 90, power: 1.1, o: null},
  {beat: 16, n: 80, power: 1.0, o: {x: 1400, y: 300}}, {beat: 21, n: 50, power: 0.8, o: null}, {beat: 24, n: 180, power: 1.5, o: null}];
const CONF = ['#ffffff', '#3d0f45', '#39b54a', '#f2c63f', '#ff7124', '#42a8c8', '#8a4fd8', '#ff5fcf'];
const Confetti: React.FC<{t: number; bass: number}> = ({t, bass}) => (
  <>
    {BURSTS.flatMap((b, bi) => {
      const s = B(b.beat), d = t - s;
      if (d < 0 || d > 2.4) return [];
      const c = b.o ?? (() => { const cc = centre(pose(s, bass)); return {x: cc.x, y: cc.y - 150}; })();
      return Array.from({length: b.n}, (_, i) => {
        const id = bi * 1000 + i;
        const a = -Math.PI / 2 + (rnd(id) - 0.5) * Math.PI * 1.6, v = (700 + 1100 * rnd(id + 1)) * b.power;
        const dist = (1 - Math.exp(-d * 1.4)) / 1.4;
        const x = c.x + Math.cos(a) * v * dist, y = c.y + Math.sin(a) * v * dist + 700 * d * d;
        const o = d > 1.8 ? 1 - (d - 1.8) / 0.6 : 1;
        return <div key={id} style={{position: 'absolute', left: x, top: y, width: 10 + 10 * rnd(id + 2), height: 6 + 6 * rnd(id + 3), background: CONF[id % CONF.length], opacity: o, borderRadius: 2,
          transform: `rotate(${(rnd(id + 4) - 0.5) * 1400 * d}deg) scaleX(${Math.cos(d * (6 + 10 * rnd(id + 5)))})`}} />;
      });
    })}
  </>
);

const SpeedLines: React.FC<{t: number; f: number; bass: number}> = ({t, f, bass}) => {
  const p = beatPos(t);
  const radial = inP(p, 10, 12) || inP(p, 14, 15.4);
  const vertical = inP(p, 1.2, 2) || inP(p, 18.6, 19.3) || inP(p, 20, 21) || inP(p, 22.3, 24);
  const horizontal = inP(p, 16, 18.1);
  if (!radial && !vertical && !horizontal) return null;
  const c = centre(pose(t, bass));
  const seed = Math.floor(f / 2);
  const lines: React.ReactNode[] = [];
  if (radial) for (let i = 0; i < 52; i++) {
    const a = rnd(seed * 97 + i) * Math.PI * 2, r1 = 470 + 220 * rnd(seed * 31 + i), r2 = 1500, wd = 0.006 + 0.012 * rnd(seed * 13 + i);
    lines.push(<polygon key={'r' + i} points={`${c.x + Math.cos(a) * r1},${c.y + Math.sin(a) * r1} ${c.x + Math.cos(a - wd) * r2},${c.y + Math.sin(a - wd) * r2} ${c.x + Math.cos(a + wd) * r2},${c.y + Math.sin(a + wd) * r2}`} fill="#fff" opacity={0.55} />);
  }
  if (vertical) for (let i = 0; i < 28; i++) {
    const x = 1000 + 900 * rnd(seed * 7 + i), y = -200 + 1200 * rnd(seed * 11 + i), len = 220 + 300 * rnd(seed * 3 + i);
    lines.push(<rect key={'v' + i} x={x} y={y} width={4 + 4 * rnd(i)} height={len} rx={3} fill="#fff" opacity={0.6} />);
  }
  if (horizontal) for (let i = 0; i < 22; i++) {
    const y = 200 + 420 * rnd(seed * 5 + i), x = c.x - 900 + 700 * rnd(seed * 9 + i), len = 200 + 300 * rnd(seed * 4 + i);
    lines.push(<rect key={'h' + i} x={x} y={y} width={len} height={4 + 4 * rnd(i + 3)} rx={3} fill="#fff" opacity={0.6} />);
  }
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{lines}</svg>;
};

const SMOKE: [number, number][] = [[20, 21], [22.25, 23]];
const Smoke: React.FC<{t: number; bass: number}> = ({t, bass}) => {
  const out: React.ReactNode[] = [];
  SMOKE.forEach(([a, b], si) => {
    for (let k = 0; k < 40; k++) {
      const ts = B(a) + k * 0.025;
      if (ts > t || ts > B(b)) break;
      const age = t - ts; if (age > 1.1) continue;
      const e = pose(ts, bass), c = centre(e);
      const r = 40 + 160 * age, o = 0.8 * (1 - age / 1.1);
      out.push(<div key={si + '-' + k} style={{position: 'absolute', left: c.x + (rnd(k + si * 50) - 0.5) * 220 - r, top: c.y + 330 + 200 * age - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: '#fff', opacity: o, filter: 'blur(4px)'}} />);
    }
  });
  return <>{out}</>;
};

const letterOffset = (t: number, i: number, n: number) => {
  const p = beatPos(t);
  if (p < 9 || p >= 10.4) return {x: 0, y: 0, r: 0};
  const fly = (d: number) => {
    const vx = (i - (n - 1) / 2) * 260 + (rnd(i + 3) - 0.5) * 300, vy = -700 - 500 * rnd(i + 9);
    return {x: vx * d, y: vy * d + 2200 * d * d, r: (rnd(i + 17) - 0.5) * 1400 * d};
  };
  const dF = B(9.6) - B(9);
  if (p < 9.6) return fly(t - B(9));
  const a = fly(dF), q = easeInOut(clamp01((p - 9.6) / 0.8));
  return {x: a.x * (1 - q), y: a.y * (1 - q), r: a.r * (1 - q)};
};

const Dust: React.FC<{t: number}> = ({t}) => (
  <>
    {[2, 13, 21, 24].map((s) => {
      const d = t - B(s);
      if (d < 0 || d > 0.9) return null;
      const q = d / 0.9;
      return [-1, 1].map((side) => (
        <div key={s + '' + side} style={{position: 'absolute', left: OX + side * (120 + 260 * q) - 90, top: H - 110 - 60 * q, width: 180 * (1 + q), height: 90 * (1 + q),
          borderRadius: '50%', background: 'rgba(255,255,255,.75)', opacity: 1 - q, filter: 'blur(6px)'}} />
      ));
    })}
  </>
);

const SparkleBurst: React.FC<{t: number; bass: number}> = ({t, bass}) => (
  <>
    {[2, 13, 14, 21, 24].flatMap((beat, bi) => {
      const d = t - B(beat);
      if (d < 0 || d > 0.7) return [];
      const c = centre(pose(B(beat), bass));
      return Array.from({length: 8}, (_, i) => {
        const a = rnd(bi * 50 + i) * Math.PI * 2, r = 260 + 260 * rnd(bi * 50 + i + 9) + 200 * d;
        const s = Math.sin(Math.min(1, d / 0.7) * Math.PI) * (0.5 + 0.6 * rnd(i + bi));
        return <Sparkle key={bi + '-' + i} x={c.x + Math.cos(a) * r} y={c.y - 150 + Math.sin(a) * r} s={s} rot={d * 240} />;
      });
    })}
  </>
);

// After the smash: temp tables rain down and each one vanishes on its way.
const Rain: React.FC<{t: number}> = ({t}) => (
  <>
    {Array.from({length: 10}, (_, j) => {
      const ts = B(9.8) + j * 0.2 + rnd(j) * 0.1, d = t - ts, dur = 1.4, life = 0.5 + 0.5 * rnd(j + 90);
      if (d < 0 || d > life + 0.5) return null;
      const s = 0.5 + 0.35 * rnd(j + 40);
      const yAt = (dd: number) => { const q = dd / dur; return -150 + (H + 300) * q * (0.6 + 0.4 * q); };
      const x = 900 + rnd(j + 20) * 900;
      if (d > life) return <Poof key={j} x={x} y={yAt(life) + BH / 2} d={d - life} size={0.7} />;
      return <TmpBox key={j} label={`tmp_${Math.floor(10 + rnd(j + 700) * 900)}`} color={COLORS[j % COLORS.length]} style={{left: x - BW / 2, top: yAt(d), opacity: 0.92, transform: `scale(${s}) rotate(${(rnd(j + 60) - 0.5) * 50 + d * (rnd(j + 80) - 0.5) * 300}deg)`}} />;
    })}
  </>
);

// Hosts.
const HOST_X = [110, 470];
const t0Of = (i: number) => B(6 + i * 0.5);
const Photo: React.FC<{src: string; name: string; x: number; t: number; i: number}> = ({src, name, x, t, i}) => {
  const o = lin(t, t0Of(i), t0Of(i) + 0.4);
  const on = t > t0Of(i) + 0.4 ? 1 : 0;
  const nod = beatPulse(bt, t + (i % 2) * bt.b, 2) * on;
  return (
    <div style={{position: 'absolute', left: x, top: 660, width: 330, opacity: o,
      transform: `translateY(${-4 * nod}px) rotate(${(i % 2 ? 0.8 : -0.8) * nod}deg)`, transformOrigin: '50% 100%'}}>
      <Img src={staticFile(src)} style={{width: 330, height: 248, objectFit: 'cover', borderRadius: 14, border: '5px solid #fff', boxShadow: '0 10px 0 rgba(61,15,69,.3)'}} />
      <div style={{...font, fontWeight: 700, fontSize: 32, color: PLUM, marginTop: 12, whiteSpace: 'nowrap', textShadow: '0 0 6px rgba(255,255,255,.9), 0 0 2px #fff'}}>{name}</div>
    </div>
  );
};

// Speech bubbles above the host photos during the bloat (12.3-14.3).
const Bubble: React.FC<{t: number; x: number; from: number; to: number; text: string}> = ({t, x, from, to, text}) => {
  const p = beatPos(t);
  if (p < from || p > to) return null;
  const s = Math.min(spring01(p - from), 1 - clamp01((p - (to - 0.2)) / 0.2));
  return (
    <div style={{position: 'absolute', left: x, top: 578, transform: `scale(${s}) rotate(${-2 + 1.5 * Math.sin(p * Math.PI)}deg)`, transformOrigin: '30px 70px'}}>
      <div style={{...font, fontWeight: 700, fontSize: 34, color: PLUM, background: '#fff', border: `4px solid ${PLUM}`, borderRadius: 16, padding: '6px 14px', whiteSpace: 'nowrap'}}>{text}</div>
      <svg width={40} height={22} style={{position: 'absolute', left: 30, top: 57}}><path d="M2,0 L22,0 L6,20 Z" fill="#fff" stroke={PLUM} strokeWidth={4} strokeLinejoin="round" /><rect x={4} y={0} width={16} height={4} fill="#fff" /></svg>
    </div>
  );
};
const spring01 = (beats: number) => { const x = clamp01(beats / 0.3); return 1 + Math.exp(-x * 5) * -Math.cos(x * 9); };

const whip = (t: number, s: number, amp: number) => {
  const u = (t - (B(s) - 0.16)) / 0.4;
  if (u <= 0 || u >= 1) return {x: 0, v: 0};
  const sh = Math.sin(Math.PI * u);
  return {x: amp * sh * sh, v: Math.abs(amp * Math.PI * Math.sin(2 * Math.PI * u) / 0.4)};
};

const GLITCH = [9, 13, 14, 16, 19];
export const CardCrazy5: React.FC = () => {
  useFonts();
  useMono();
  const lv = useLevels('a-shades');
  const {f, t} = useT();
  const p = beatPos(t);
  const bass = at(lv, 'low', f);
  const e = pose(t, bass);
  const finalHit = kick(t, B(24), 5);
  const shake = Math.max(land(t, 2, 2.01) * 1.2, land(t, 9, 9.01), land(t, 13, 13.01) * 0.8, land(t, 14, 14.01) * 0.7, land(t, 19, 19.01) * 0.9, land(t, 21, 21.01) * 0.5, land(t, 24, 24.01) * 1.4);
  const everyBeat = p >= 3 && p < 24 ? beatPulse(bt, t, 1, 3) : 0;
  const big = Math.max(...[2, 9, 13, 14, 16, 19].map((s) => kick(t, B(s), 7)), finalHit);
  const zoom = 1 + 0.035 * everyBeat + 0.1 * big;
  // dutch tilt: snaps to the other side on every beat 4-24, straight again for the final hit
  const tiltSide = (k: number) => (k % 2 ? 1 : -1) * 2.4;
  const kb = Math.floor(p), ph = clamp01((p - kb) / 0.18);
  const tilt = p >= 4 && p < 24 ? tiltSide(kb - 1) + (tiltSide(kb) - tiltSide(kb - 1)) * easeOut(ph) * (p < 4.18 ? 0 : 1) : p >= 24 ? tiltSide(23) * Math.max(0, 1 - (p - 24) / 0.25) : 0;
  const w2 = whip(t, 20, 240);
  const wx = w2.x, blur = Math.min(40, w2.v / 90);
  const rainbow = Math.max(lin(p, 10, 10.2) * (1 - lin(p, 11.8, 12)), lin(p, 14.3, 14.5) * (1 - lin(p, 15.8, 16.1)), lin(p, 19, 19.2) * (1 - lin(p, 21.9, 22.1)));
  const hueStep = Math.floor(p * 2) * 67;
  const flash = rainbow * 0.12 * beatPulse(bt, t, 1, 10);
  const rgb = Math.max(...GLITCH.map((s) => (t >= B(s) && t < B(s) + 0.22 ? 26 * kick(t, B(s), 9) : 0)), t >= B(24) && t < B(24) + 0.16 ? 30 * kick(t, B(24), 12) : 0);

  const wm = pop(f, B(0) - 0.08, 9, 220);
  const band = lin(t, B(5), B(5.6));
  const rays = t * (p > 10 ? 40 : 8) + (p >= 16 && p < 24 ? 25 * Math.floor(p) : 0);
  const titleIn = pop(f, B(1), 10, 200);
  const wave = p >= 16 && p < 24 ? 1 : p >= 24 ? kick(t, B(24), 2.5) : 0;
  const glint = Math.max(...[2, 8, 12, 13, 14, 16, 18, 21, 22, 24].map((s) => { const d = t - B(s); return d < 0 ? 0 : d < 0.1 ? d / 0.1 : Math.max(0, 1 - (d - 0.1) / 0.45); }));
  const eleHue = p >= 21 && p < 22 ? ((p - 21) * 180) % 360 : 0;
  const shX = Math.sin(t * 90) * 18 * shake, shY = Math.cos(t * 77) * 14 * shake;
  const smashShake = kick(t, B(9), 6);
  const letters = TITLE[0].split('');
  const grid = p >= 3 && p < 24 ? 0.1 + 0.25 * everyBeat : 0;

  const mainEle = !e.hidden && <ElephantBody e={e} t={t} f={f} hue={eleHue} withStack glint={glint} />;
  const filters = [blur > 0.5 ? 'url(#whip)' : '', rgb > 0.8 ? 'url(#rgb)' : ''].filter(Boolean).join(' ');
  const actionStyle: React.CSSProperties = {transform: `translateX(${wx}px)`, filter: filters || undefined};
  const camera = `scale(${zoom}) translate(${shX}px, ${shY}px) rotate(${tilt}deg)`;

  return (
    <AbsoluteFill style={{background: PINK_BG, overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id="whip" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} /></filter>
        <filter id="rgb" x="-5%" y="-5%" width="110%" height="110%">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={rgb} dy={0} result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={-rgb} dy={rgb * 0.3} result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{transform: camera}}>
        <AbsoluteFill style={actionStyle}>
          {rainbow > 0 && (
            <AbsoluteFill style={{left: -200, right: -200, top: -200, bottom: -200, background: PINK_BG, filter: `hue-rotate(${hueStep}deg) saturate(1.5)`, opacity: rainbow,
              maskImage: 'linear-gradient(90deg, transparent 44%, black 60%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 44%, black 60%)'}} />
          )}
          {/* table-grid backdrop, flashes on the beat */}
          {grid > 0 && <div style={{position: 'absolute', left: -200, top: -200, width: W + 400, height: H + 400, opacity: grid,
            backgroundImage: 'linear-gradient(rgba(255,255,255,.9) 3px, transparent 3px), linear-gradient(90deg, rgba(255,255,255,.9) 3px, transparent 3px)',
            backgroundSize: '160px 60px', backgroundPosition: `${(-t * 120) % 160}px ${(t * 40) % 60}px`,
            maskImage: 'linear-gradient(90deg, transparent 38%, black 62%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 38%, black 62%)'}} />}
          <div style={{position: 'absolute', left: 1450 - 1600, top: 520 - 1600, width: 3200, height: 3200, opacity: 0.18 + 0.16 * bass + 0.15 * rainbow,
            background: `repeating-conic-gradient(from ${rays}deg at 50% 50%, rgba(255,255,255,.9) 0deg 7deg, rgba(255,255,255,0) 7deg 22deg)`,
            maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 55%)'}} />
          <Storm t={t} />
          <Cliff t={t} />
          <Pops t={t} f={f} />
          <Rain t={t} />
          <Clones t={t} f={f} />
          <SpeedLines t={t} f={f} bass={bass} />
          <Smoke t={t} bass={bass} />
          <Trail t={t} bass={bass} topLayer={false} />
          {!e.top && mainEle}
          <SurfBits t={t} bass={bass} />
          <Juggle t={t} />
          <Pile t={t} />
          <Hud t={t} />
          <Chair t={t} />
          <Dust t={t} />
          <SparkleBurst t={t} bass={bass} />
          <Confetti t={t} bass={bass} />
          <Burst t={t} beat={2} text="CREATE!" x={1250} y={250} color="#ffcc4d" />
          <Burst t={t} beat={13} text="BLOAT!" x={1180} y={430} color="#ff7124" />
          <Burst t={t} beat={14} text="VACUUM!" x={1300} y={250} color="#39b54a" size={84} />
          <Burst t={t} beat={16} text="POOF!" x={1560} y={180} color="#c9a7ff" />
          <Burst t={t} beat={19} text="SPILL!" x={1640} y={860} color="#42a8c8" />
        </AbsoluteFill>
      </AbsoluteFill>

      {/* title, wordmark and hosts: above the action, never tilted, blurred or glitched, a third of the zoom */}
      <AbsoluteFill style={{transform: `scale(${1 + (zoom - 1) * 0.33}) translate(${shX * 0.4}px, ${shY * 0.4}px)`}}>
        <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560,
          transform: `scale(${0.4 + 0.6 * wm}) rotate(${(1 - wm) * -8}deg)`, transformOrigin: '0% 50%', opacity: Math.min(1, wm * 2),
          filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
        <div style={{position: 'absolute', left: 110, top: 240}}>
          <div style={{...font, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, opacity: Math.min(1, titleIn * 2), whiteSpace: 'nowrap',
            transform: `translateY(${(1 - titleIn) * 80}px)`, textShadow: `0 7px 0 ${PLUM}66, 0 0 40px rgba(120,20,120,.3)`}}>
            {letters.map((ch, i) => {
              const o = letterOffset(t, i, letters.length);
              const wv = -14 * wave * Math.max(0, Math.sin((p - i * 0.12) * Math.PI * 2));
              return <span key={i} style={{display: 'inline-block', transform: `translate(${o.x}px, ${o.y + wv}px) rotate(${o.r}deg)`}}>{ch}</span>;
            })}
          </div>
          <div style={{position: 'relative', marginTop: 26, height: 150, transform: `translate(${Math.sin(t * 80) * 16 * smashShake}px, ${Math.cos(t * 70) * 10 * smashShake}px) rotate(${-3 * smashShake}deg)`}}>
            <div style={{position: 'relative', display: 'inline-block', height: 150}}>
              <div style={{position: 'absolute', left: -24, right: -36, top: 0, bottom: 0, background: PLUM, borderRadius: 18, transform: `scaleX(${band}) skewX(-6deg)`, transformOrigin: '0 50%', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
              <div style={{...font, position: 'relative', paddingLeft: 14, paddingTop: 4, fontSize: 124, lineHeight: '142px', color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap', clipPath: `inset(0 ${100 - band * 100}% 0 0)`,
                transform: `scale(${1 + 0.05 * beatPulse(bt, t, 8) + 0.06 * finalHit})`, transformOrigin: '0% 50%'}}>{TITLE[1]}</div>
            </div>
          </div>
        </div>
        {HOSTS.map((h, i) => <Photo key={h.name} src={h.photo ?? ''} name={h.name} x={HOST_X[i] ?? 110 + i * 360} t={t} i={i} />)}
        <Bubble t={t} x={115} from={12.3} to={14.3} text="Oracle GTTs: free!" />
        <Bubble t={t} x={505} from={12.8} to={14.3} text="Postgres: pg_class bloat!" />
      </AbsoluteFill>

      {e.top && (
        <AbsoluteFill style={{transform: camera}}>
          <Trail t={t} bass={bass} topLayer />
          {mainEle}
          <Burst t={t} beat={9} text="TRUNCATE!" x={900} y={190} color="#7ee0ff" size={76} />
        </AbsoluteFill>
      )}
      {!e.top && <AbsoluteFill style={{transform: `scale(${zoom})`}}><Burst t={t} beat={9} text="TRUNCATE!" x={900} y={190} color="#7ee0ff" size={76} /></AbsoluteFill>}
      <Grain opacity={0.12} />
      <AbsoluteFill style={{background: '#fff', opacity: 0.45 * finalHit + flash}} />
    </AbsoluteFill>
  );
};
