import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {at, Beat, beatPulse, beatT, ELE, Grain, H, lin, pop, Sparkle, TITLE, useFonts, useLevels, useT, W} from './common';

// v3 of the ep 195 title card: v2 plus a good-natured roast of Michael (the regular co-host,
// absent this episode; no photo of him, only signs) and much wilder elephant moves.
// Kept from v2: look, title, hosts (photos untouched, same small nod), title layer above the
// action, beat grid, final hit on beat 24 (12.90 s), length 14 s.
//
// Beats (one beat = 0.517 s, beat 0 = 0.486 s):
//  0-2    an empty folding chair with a sign "RESERVED / Michael" waits on the right
//  1.2-2  the elephant cannonballs in from off-screen, body-slams the chair on 2 (BONK!), the sign is launched away
//  3-7    catches extension boxes on its head, one per beat, bouncing
//  8      spin jump kicks the stack away, then leaps at the title and smashes through it on 9 (SMASH!);
//         the letters scatter and reassemble by beat 10.4
//  10-11  headspin (upside down), 11-12 windmill
//  12     a laptop "Michael is still editing... export 99%" drops; the elephant flips and sits on it on 13: "export 100%"
//  14     kicks the laptop away; a conga line of seven clones dances across the sky (14-16)
//  16-20  crowd-surfs on a crowd of extension boxes
//  20     the crowd tosses it, it flips upright on 21 and the boxes rain back onto its head (21-21.75)
//  22-23  jetpack exit through the top of the frame; 23-24 cannonballs back down
//  24     lands on the final hit with the stack; Michael's sign falls back: "Michael's seat (we saved it)"

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const PLUM = '#3d0f45';
const font = {fontFamily: 'Lato', fontWeight: 900} as const;

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
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const arc = (q: number) => 4 * q * (1 - q);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const kick = (t: number, s: number, rate = 6) => (t >= s ? Math.exp(-(t - s) * rate) : 0);

// Elephant geometry (as v1/v2): 880 px tall, left 1120, feet 170 px below the frame.
const EH = 880, EK = EH / ELE.h, EW = ELE.w * EK, EX = 1120, EY = H - EH + 170;
const OX = EX + EW / 2, OY = EY + 0.62 * EH; // rotation/scale origin in world px (pose 0)
const HEAD_TOP = 26;
// The title smash target: the middle of "Extensions" (world px), as an offset of the origin.
const SMASH = {x: 520 - OX, y: 330 - OY};
const UPSIDE_Y = -292;
const SURF_Y = -316; // lying on the crowd at scale 0.72: body centre at y 600 // upside down at scale 0.8 with the head on the floor

type Pose = {x: number; y: number; rot: number; sx: number; sy: number; scale: number; hidden?: boolean; top?: boolean; jet?: number; flame?: number};
const pose = (t: number, bass: number): Pose => {
  const p = beatPos(t);
  let x = 0, y = 0, rot = 0, sx = 1, sy = 1, scale = 1, top = false, jet = 0, flame = 0;
  if (p < 1.2) return {x: 900, y: -1500, rot: 0, sx: 1, sy: 1, scale: 0.55, hidden: true};
  if (p < 2) { // cannonball in from the top right
    const u = (p - 1.2) / 0.8;
    x = 900 * (1 - u); y = -1500 * (1 - u * u); rot = -1080 * (1 - u); scale = 0.55 + 0.45 * Math.pow(u, 4);
  } else if (p < 8) {
    const h = hop(t, 4, 8);
    y = -140 * h; sy += 0.06 * h; sx -= 0.04 * h;
  } else if (p < 8.55) { // spin jump, kicks the stack
    const q = (p - 8) / 0.55;
    y = -380 * arc(q); rot = 360 * easeInOut(q);
  } else if (p < 9) { // leap at the title
    const q = (p - 8.55) / 0.45;
    x = SMASH.x * q; y = SMASH.y * q - 260 * arc(q); scale = 1 - 0.45 * q; rot = -30 * q; top = true;
  } else if (p < 9.8) { // bounce back home with a backflip
    const q = (p - 9) / 0.8;
    x = SMASH.x * (1 - q); y = SMASH.y * (1 - q) - 380 * arc(q); scale = 0.55 + 0.45 * q; rot = -30 * (1 - q) - 360 * easeInOut(q); top = true;
  } else if (p < 10) { // flip onto its head
    const q = (p - 9.8) / 0.2;
    rot = 180 * easeInOut(q); y = UPSIDE_Y * q; scale = 1 - 0.2 * q;
  } else if (p < 11) { // headspin
    rot = 180; y = UPSIDE_Y; scale = 0.8;
    const c = Math.cos(2 * Math.PI * 2 * (p - 10));
    sx *= Math.sign(c || 1) * Math.max(0.08, Math.abs(c));
  } else if (p < 12) { // windmill
    rot = 180 + 720 * easeInOut(p - 11); y = UPSIDE_Y - 60 * Math.sin((p - 11) * Math.PI); scale = 0.8;
  } else if (p < 13) { // flip upright onto the laptop
    const q = p - 12;
    rot = 180 + 180 * easeInOut(q); y = UPSIDE_Y + (-260 - UPSIDE_Y) * q - 450 * arc(q); scale = 0.8 + 0.2 * q;
  } else if (p < 14) { // sitting on it
    y = -260 + 10 * Math.sin((p - 13) * Math.PI * 2);
  } else if (p < 14.4) { // kick it away
    const q = (p - 14) / 0.4;
    y = -260 * (1 - q) - 150 * arc(q); rot = -20 * Math.sin(Math.PI * q);
  } else if (p < 15.8) { // conga hips
    rot = 10 * Math.sin(2 * Math.PI * (p - 14.4)); x = 30 * Math.sin(Math.PI * (p - 14.4)); y = -40 * hop(t, 14.4, 15.8, 0.5);
  } else if (p < 16.3) { // thrown onto the crowd
    const q = (p - 15.8) / 0.5;
    rot = 90 * easeInOut(q); scale = 1 - 0.28 * q; y = SURF_Y * q - 200 * arc(q);
  } else if (p < 20) { // crowd-surfing
    rot = 90 + 8 * Math.sin(2 * Math.PI * (p - 16)); scale = 0.72;
    x = -120 * Math.sin(2 * Math.PI * (p - 16.3) / 3.7);
    y = SURF_Y - 25 * Math.abs(Math.sin(Math.PI * 2 * p));
  } else if (p < 21) { // tossed, flips upright
    const q = p - 20;
    rot = 90 + 270 * easeInOut(q); scale = 0.72 + 0.28 * q; y = SURF_Y * (1 - q) - 700 * arc(q);
  } else if (p < 22) { // headbang
    rot = 16 * Math.sin(2 * Math.PI * (p - 21));
  } else if (p < 22.3) { // crouch, jetpack on
    const q = (p - 22) / 0.3;
    sy -= 0.12 * Math.sin(Math.PI * q); sx += 0.08 * Math.sin(Math.PI * q); jet = clamp01(q * 3); flame = q > 0.6 ? 0.5 : 0;
  } else if (p < 23) { // rocket out of the top
    const q = (p - 22.3) / 0.7;
    y = -1800 * q * q; x = 60 * Math.sin(q * 12); rot = 8 * Math.sin(q * 20); jet = 1; flame = 1;
  } else if (p < 24) { // cannonball back down
    const q = p - 23;
    y = -1800 * (1 - q * q); rot = 720 * easeInOut(q);
  }
  const sq = Math.max(land(t, 2, 2.01) * 1.6, land(t, 4, 8), land(t, 13, 13.01) * 1.3, land(t, 21, 21.01) * 1.1, land(t, 24, 24.01) * 1.8);
  sx += 0.14 * sq + 0.03 * bass; sy -= 0.16 * sq + 0.03 * bass;
  return {x, y, rot, sx, sy, scale, top, jet, flame};
};
const centre = (e: Pose) => ({x: OX + e.x, y: OY + e.y});

// Extension box.
const BW = 290, BH = 66;
const COLORS = ['#42a8c8', '#39b54a', '#f2a130', '#ff7124', '#8a4fd8', '#16657c', '#d93d1b', '#2fa38a'];
const ExtBox: React.FC<{label: string; color: string; style?: React.CSSProperties}> = ({label, color, style}) => (
  <div style={{position: 'absolute', width: BW, height: BH, borderRadius: 12, background: color, border: '4px solid #fff', boxSizing: 'border-box',
    boxShadow: `0 7px 0 ${PLUM}66`, display: 'flex', alignItems: 'center', ...style}}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 5, marginLeft: 14, marginRight: 12}}>
      {[0, 1, 2].map((i) => <div key={i} style={{width: 20, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.75)'}} />)}
    </div>
    <div style={{...font, fontSize: 33, color: '#fff', letterSpacing: -0.5, whiteSpace: 'nowrap', textShadow: `0 2px 0 ${PLUM}88`}}>{label}</div>
  </div>
);

const STACK1 = ['pg_partman', 'timescaledb', 'citus', 'pg_repack', 'pgaudit'].map((label, i) => ({label, color: COLORS[(i * 3) % COLORS.length], at: B(3 + i)}));
const STACK2 = ['postgis', 'pgvector', 'hypopg', 'pg_trgm'].map((label, i) => ({label, color: COLORS[(i * 3 + 1) % COLORS.length], at: B(21 + i * 0.25)}));
const FALL = 0.42, FALL_H = 1100;
const slotTop = (i: number) => HEAD_TOP - (i + 1) * (BH - 6);

const Stack: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  const out: React.ReactNode[] = [];
  const sway = (i: number) => {
    if (p >= 4 && p < 8) return (i + 1) * 1.6 * Math.sin((p - 4) * Math.PI * 2 - 0.6);
    if (p >= 21.75 && p < 22.3) return (i + 1) * 2 * Math.sin((p - 21) * Math.PI * 2 - 0.6);
    if (p >= 22.3 && p < 24) return (i + 1) * 3 * Math.sin((p - 22) * Math.PI * 3);
    if (t >= B(24)) { const d = t - B(24); return (i + 1) * 4 * Math.exp(-d * 3.5) * Math.sin(d * 16); }
    return 0;
  };
  const place = (b: {label: string; color: string; at: number}, i: number, key: string, kicked: number | null) => {
    const d = t - b.at;
    if (d < -FALL) return;
    const top = slotTop(i), left = EW / 2 - BW / 2 + (rnd(i + key.length * 7) - 0.5) * 18;
    let y = top, x = left, rot = sway(i), sy = 1, sx = 1;
    if (d < 0) { const q = 1 + d / FALL; y = top - FALL_H * (1 - q * q); rot = (1 - q) * (rnd(i + 3) - 0.5) * 60; }
    else { const s = Math.exp(-d * 10); sy = 1 - 0.25 * s; sx = 1 + 0.15 * s; }
    if (kicked !== null && t >= kicked) {
      const k = t - kicked, vx = (rnd(i * 5 + 1) - 0.5) * 2600, vy = -900 - 900 * rnd(i * 5 + 2);
      x += vx * k; y += vy * k + 2400 * k * k; rot += (rnd(i * 5 + 3) - 0.5) * 1600 * k;
      if (k > 0.5) return; // the smash leap follows; keep the flying boxes short
    }
    out.push(<ExtBox key={key + i} label={b.label} color={b.color} style={{left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '50% 100%'}} />);
  };
  STACK1.forEach((b, i) => place(b, i, 's1', B(8) + 0.06));
  STACK2.forEach((b, i) => place(b, i, 's2', null));
  return <>{out}</>;
};

// Jetpack (two tanks behind the body) with flickering flames.
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

const TRAIL: [number, number][] = [[1.2, 2], [8.55, 9.8], [10, 12.6], [20, 21], [22.3, 24.05]];
const Trail: React.FC<{t: number; bass: number; topLayer: boolean}> = ({t, bass, topLayer}) => {
  const p = beatPos(t);
  if (!TRAIL.some(([a, b]) => p >= a && p < b)) return null;
  const e = pose(t, bass);
  if (!!e.top !== topLayer || e.hidden) return null;
  return <>{[4, 3, 2, 1].map((k) => { const g = pose(t - k * 0.045, bass); return g.hidden ? null : <ElephantBody key={k} e={g} t={t} hue={k * 70} opacity={0.42 - k * 0.08} />; })}</>;
};

// ---- Michael gags (signs only, no photo) ----
const Sign: React.FC<{lines: [string, number][]; w: number; style?: React.CSSProperties}> = ({lines, w, style}) => (
  <div style={{position: 'absolute', width: w, ...style}}>
    <div style={{position: 'absolute', left: w / 2 - 8, top: 40, width: 16, height: 420, background: '#b9865a', border: `4px solid ${PLUM}`, borderRadius: 6}} />
    <div style={{position: 'relative', background: '#fff', border: `6px solid ${PLUM}`, borderRadius: 16, padding: '12px 10px 14px', textAlign: 'center', boxShadow: `0 8px 0 ${PLUM}55`}}>
      {lines.map(([s, size], i) => <div key={i} style={{...font, fontSize: size, lineHeight: 1.05, color: PLUM, letterSpacing: size < 40 ? 3 : -1, whiteSpace: 'nowrap'}}>{s}</div>)}
    </div>
  </div>
);

// Beat 0-2: the reserved chair; flattened by the cannonball on 2 (stays flat on the floor).
const Chair: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  const flat = p >= 2;
  const wob = p < 2 ? 3 * Math.sin(p * Math.PI * 2) : 0;
  const sq = flat ? 0.14 + 0.1 * kick(t, B(2), 12) : 1;
  return (
    <div style={{position: 'absolute', left: OX - 150, top: H - 400, width: 300, height: 400, transform: `rotate(${wob}deg) scale(${flat ? 1.25 : 1}, ${sq})`, transformOrigin: '50% 100%'}}>
      <svg width={300} height={400} viewBox="0 0 300 400">
        <g stroke={PLUM} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round">
          <line x1={70} y1={200} x2={40} y2={395} /><line x1={230} y1={200} x2={260} y2={395} />
          <line x1={80} y1={20} x2={70} y2={210} /><line x1={220} y1={20} x2={230} y2={210} />
          <rect x={70} y={20} width={160} height={80} rx={14} fill="#ffcc4d" />
          <path d="M40,195 L260,195 L250,235 L50,235 Z" fill="#ffcc4d" />
        </g>
        <text x={150} y={72} textAnchor="middle" style={{...font, fontSize: 34, fill: PLUM}}>Michael</text>
      </svg>
    </div>
  );
};
// The sign behind the chair; launched on 2, falls back on 24.3 as "Michael's seat (we saved it)".
const ChairSign: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 2.8) {
    const k = Math.max(0, t - B(2));
    const x = OX - 190 + 1100 * k, y = H - 760 - 1700 * k + 1300 * k * k, r = -4 + 800 * k;
    return <Sign w={380} lines={[['RESERVED', 30], ['Michael', 74]]} style={{left: x, top: y, transform: `rotate(${r}deg)`}} />;
  }
  if (p < 24) return null;
  const q = clamp01((t - B(24)) / 0.3);
  const y = -500 + (600 + 500) * q * q;
  const wob = q >= 1 ? -6 + 5 * Math.exp(-(t - B(24) - 0.3) * 5) * Math.sin((t - B(24) - 0.3) * 22) : -6;
  return <Sign w={420} lines={[["Michael's seat", 60], ['(we saved it)', 40]]} style={{left: 1170, top: y, transform: `rotate(${wob}deg)`, transformOrigin: '50% 100%'}} />;
};

// Beat 12-14: the laptop. Drops on 12, sat on at 13 (export 100%), kicked away on 14.
const Laptop: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 11.4 || p > 15.6) return null;
  const restTop = H - 330;
  let y = restTop, x = OX - 220, r = 0, sy = 1;
  if (p < 12) { const q = clamp01((t - (B(12) - 0.3)) / 0.3); y = -400 + (restTop + 400) * q * q; }
  if (p >= 13 && p < 14) sy = 0.82 - 0.12 * kick(t, B(13), 8);
  if (p >= 14) { const k = t - B(14); x += 1300 * k; y += -1500 * k + 2400 * k * k; r = 900 * k; sy = 0.82; }
  const done = p >= 13;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 440, transform: `rotate(${r}deg) scaleY(${sy})`, transformOrigin: '50% 100%'}}>
      <div style={{width: 440, height: 270, background: PLUM, border: '8px solid #d8d2e6', borderRadius: 18, boxSizing: 'border-box', padding: '22px 26px', color: '#fff', ...font}}>
        <div style={{fontSize: 40, lineHeight: 1.05}}>Michael is</div>
        <div style={{fontSize: 40, lineHeight: 1.05}}>still editing...</div>
        <div style={{marginTop: 22, height: 30, borderRadius: 15, background: 'rgba(255,255,255,.2)', overflow: 'hidden'}}>
          <div style={{width: done ? '100%' : '93%', height: '100%', background: done ? '#39b54a' : '#f2a130'}} />
        </div>
        <div style={{fontSize: 26, marginTop: 8, fontWeight: 700}}>{done ? 'export 100%' : 'export 99%'}</div>
      </div>
      <div style={{width: 520, marginLeft: -40, height: 34, background: '#d8d2e6', borderRadius: '6px 6px 18px 18px', border: `5px solid ${PLUM}`, boxSizing: 'border-box'}} />
    </div>
  );
};

// Comic bursts.
const Burst: React.FC<{t: number; beat: number; text: string; x: number; y: number; color: string}> = ({t, beat, text, x, y, color}) => {
  const d = t - B(beat);
  if (d < 0 || d > 0.75) return null;
  const s = Math.min(1, d / 0.08) * (d > 0.55 ? 1 - (d - 0.55) / 0.2 : 1);
  const pts = Array.from({length: 28}, (_, i) => { const a = (i / 28) * Math.PI * 2, r = i % 2 ? 120 : 190 + 25 * rnd(i + beat); return `${Math.cos(a) * r * 1.35},${Math.sin(a) * r}`; }).join(' ');
  return (
    <div style={{position: 'absolute', left: x - 260, top: y - 200, width: 520, height: 400, transform: `scale(${s * (1 + 0.1 * Math.sin(d * 40))}) rotate(-8deg)`}}>
      <svg width={520} height={400} viewBox="-260 -200 520 400" style={{position: 'absolute'}}><polygon points={pts} fill={color} stroke={PLUM} strokeWidth={9} strokeLinejoin="round" /></svg>
      <div style={{...font, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 92, color: '#fff', letterSpacing: -1,
        WebkitTextStroke: `6px ${PLUM}`, paintOrder: 'stroke fill', fontStyle: 'italic'}}>{text}</div>
    </div>
  );
};

// Conga line of clones across the sky, beats 13.6-16.3 (behind the title layer).
const Conga: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 13.6 || p > 16.4) return null;
  const q = (p - 13.6) / 2.7;
  const out = Math.min(1, Math.max(0, (16.4 - p) * 5));
  return (
    <>
      {Array.from({length: 7}, (_, i) => {
        const cx = 2060 - 1750 * q + i * 205, step = Math.floor(p * 2 + i) % 2 ? 1 : -1;
        const cy = 300 + 25 * Math.sin(cx / 140) - 50 * hop(t, 13.5, 16.5, 0.5);
        const e: Pose = {x: cx - OX, y: cy - OY, rot: 12 * step, sx: 1, sy: 1, scale: 0.34 * out};
        if (cx < -200 || cx > 2150) return null;
        return <ElephantBody key={i} e={e} t={t} hue={(i * 52 + 40) % 360} />;
      })}
    </>
  );
};

// Crowd of extension boxes carrying the elephant, beats 15.8-20.6.
const CROWD = ['pg_cron', 'postgis', 'pgvector', 'hypopg', 'pg_trgm', 'pgaudit'];
const Crowd: React.FC<{t: number; bass: number}> = ({t, bass}) => {
  const p = beatPos(t);
  if (p < 15.7 || p > 20.8) return null;
  const e = pose(Math.min(t, B(20)), bass), c = centre(e);
  return (
    <>
      {CROWD.map((label, i) => {
        const rise = clamp01((p - 15.7) / 0.5);
        let x = c.x + (i - 2.5) * 165 - BW / 2, y = 852 - 50 * Math.max(0, Math.sin(Math.PI * (2 * p + i * 0.5))) + (1 - rise) * 300, r = (i - 2.5) * 3;
        if (p >= 20) { const k = t - B(20); x += (i - 2.5) * 500 * k; y -= 2600 * k - 1200 * k * k; r += (i % 2 ? 1 : -1) * 700 * k; }
        return <ExtBox key={label} label={label} color={COLORS[(i * 3 + 1) % COLORS.length]} style={{left: x, top: y, transform: `scale(0.7) rotate(${r}deg)`}} />;
      })}
    </>
  );
};

// Jetpack smoke puffs (world).
const Smoke: React.FC<{t: number; bass: number}> = ({t, bass}) => {
  const p = beatPos(t);
  if (p < 22.2 || p > 24.5) return null;
  const out: React.ReactNode[] = [];
  for (let k = 0; k < 30; k++) {
    const ts = B(22.25) + k * 0.025;
    if (ts > t || ts > B(23)) break;
    const age = t - ts; if (age > 1.1) continue;
    const e = pose(ts, bass), c = centre(e);
    const r = 40 + 160 * age, o = 0.8 * (1 - age / 1.1);
    out.push(<div key={k} style={{position: 'absolute', left: c.x + (rnd(k) - 0.5) * 220 - r, top: c.y + 330 + 200 * age - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: '#fff', opacity: o, filter: 'blur(4px)'}} />);
  }
  return <>{out}</>;
};

// Title letters: scatter on the smash (beat 9), reassemble by 10.4.
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

const BURSTS = [{beat: 2, n: 80, power: 1.1, o: null as null | {x: number; y: number}}, {beat: 9, n: 90, power: 1.1, o: {x: 560, y: 330}}, {beat: 13, n: 60, power: 0.9, o: null},
  {beat: 16.3, n: 60, power: 0.9, o: null}, {beat: 24, n: 160, power: 1.5, o: null}];
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
  const radial = (p >= 10 && p < 12) || (p >= 14.4 && p < 15.8);
  const vertical = (p >= 1.2 && p < 2) || (p >= 22.3 && p < 24);
  if (!radial && !vertical) return null;
  const c = centre(pose(t, bass));
  const seed = Math.floor(f / 2);
  const lines: React.ReactNode[] = [];
  if (radial) for (let i = 0; i < 46; i++) {
    const a = rnd(seed * 97 + i) * Math.PI * 2, r1 = 470 + 220 * rnd(seed * 31 + i), r2 = 1500, wd = 0.006 + 0.012 * rnd(seed * 13 + i);
    lines.push(<polygon key={'r' + i} points={`${c.x + Math.cos(a) * r1},${c.y + Math.sin(a) * r1} ${c.x + Math.cos(a - wd) * r2},${c.y + Math.sin(a - wd) * r2} ${c.x + Math.cos(a + wd) * r2},${c.y + Math.sin(a + wd) * r2}`} fill="#fff" opacity={0.55} />);
  }
  if (vertical) for (let i = 0; i < 28; i++) {
    const x = 1000 + 900 * rnd(seed * 7 + i), y = -200 + 1200 * rnd(seed * 11 + i), len = 220 + 300 * rnd(seed * 3 + i);
    lines.push(<rect key={'v' + i} x={x} y={y} width={4 + 4 * rnd(i)} height={len} rx={3} fill="#fff" opacity={0.6} />);
  }
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{lines}</svg>;
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
    {[2, 13, 16.3, 21, 24].flatMap((beat, bi) => {
      const d = t - B(beat);
      if (d < 0 || d > 0.7) return [];
      const c = centre(pose(B(beat), bass));
      return Array.from({length: 7}, (_, i) => {
        const a = rnd(bi * 50 + i) * Math.PI * 2, r = 260 + 260 * rnd(bi * 50 + i + 9) + 200 * d;
        const s = Math.sin(Math.min(1, d / 0.7) * Math.PI) * (0.5 + 0.6 * rnd(i + bi));
        return <Sparkle key={bi + '-' + i} x={c.x + Math.cos(a) * r} y={c.y - 150 + Math.sin(a) * r} s={s} rot={d * 240} />;
      });
    })}
  </>
);

const RAIN = ['pg_stat_statements', 'pgcrypto', 'pg_hint_plan', 'orafce', 'pgrouting', 'pg_squeeze', 'hstore', 'plv8', 'pg_ivm', 'wal2json'];
const Rain: React.FC<{t: number}> = ({t}) => (
  <>
    {RAIN.map((label, j) => {
      const ts = B(9.8) + j * 0.22 + rnd(j) * 0.1, d = t - ts, dur = 1.4;
      if (d < 0 || d > dur) return null;
      const q = d / dur, s = 0.5 + 0.35 * rnd(j + 40);
      const x = 900 + rnd(j + 20) * 900, y = -150 + (H + 300) * q * (0.6 + 0.4 * q);
      return <ExtBox key={j} label={label} color={COLORS[j % COLORS.length]} style={{left: x - BW / 2, top: y, opacity: 0.9, transform: `scale(${s}) rotate(${(rnd(j + 60) - 0.5) * 50 + d * (rnd(j + 80) - 0.5) * 300}deg)`}} />;
    })}
  </>
);

const t0Of = (name: string) => (name.startsWith('Kirk') ? B(6) : name.startsWith('Nik') ? B(6.5) : B(7));
const Photo: React.FC<{src: string; name: string; x: number; t: number; phase: number}> = ({src, name, x, t, phase}) => {
  const o = lin(t, t0Of(name), t0Of(name) + 0.4);
  const on = t > t0Of(name) + 0.4 ? 1 : 0;
  const nod = beatPulse(bt, t + phase * bt.b, 2) * on;
  return (
    <div style={{position: 'absolute', left: x, top: 660, width: 330, opacity: o,
      transform: `translateY(${-4 * nod}px) rotate(${(phase ? 0.8 : -0.8) * nod}deg)`, transformOrigin: '50% 100%'}}>
      <Img src={staticFile(src)} style={{width: 330, height: 248, objectFit: 'cover', borderRadius: 14, border: '5px solid #fff', boxShadow: '0 10px 0 rgba(61,15,69,.3)'}} />
      <div style={{...font, fontWeight: 700, fontSize: 32, color: PLUM, marginTop: 12, whiteSpace: 'nowrap'}}>{name}</div>
    </div>
  );
};

const whip = (t: number, s: number, amp: number) => {
  const u = (t - (B(s) - 0.16)) / 0.4;
  if (u <= 0 || u >= 1) return {x: 0, v: 0};
  const sh = Math.sin(Math.PI * u);
  return {x: amp * sh * sh, v: Math.abs(amp * Math.PI * Math.sin(2 * Math.PI * u) / 0.4)};
};

export const CardCrazy3: React.FC = () => {
  useFonts();
  const lv = useLevels('a-shades');
  const {f, t} = useT();
  const p = beatPos(t);
  const bass = at(lv, 'low', f);
  const e = pose(t, bass);
  const finalHit = kick(t, B(24), 5);
  const shake = Math.max(land(t, 2, 2.01) * 1.2, land(t, 9, 9.01), land(t, 13, 13.01) * 0.7, land(t, 21, 21.01) * 0.5, land(t, 24, 24.01) * 1.4);
  const everyBeat = p >= 4 && p < 24 ? beatPulse(bt, t, 1, 4) : 0;
  const big = Math.max(...[2, 9, 13, 16].map((s) => kick(t, B(s), 7)), finalHit);
  const zoom = 1 + 0.025 * everyBeat + 0.09 * big;
  const w1 = whip(t, 16, -240), w2 = whip(t, 20, 240);
  const wx = w1.x + w2.x, blur = Math.min(40, (w1.v + w2.v) / 90);
  const rainbow = Math.max(lin(p, 13.8, 14) * (1 - lin(p, 15.9, 16.1)), lin(p, 19.8, 20) * (1 - lin(p, 21.9, 22.1)), lin(p, 10, 10.2) * (1 - lin(p, 11.8, 12)));
  const hueStep = Math.floor(p) * 67;
  const flash = rainbow * 0.12 * beatPulse(bt, t, 1, 10);

  const wm = pop(f, B(0) - 0.08, 9, 220);
  const band = lin(t, B(5), B(5.6));
  const rays = t * (p > 10 ? 34 : 8);
  const titleIn = pop(f, B(1), 10, 200);
  const wave = p >= 16 && p < 24 ? 1 : p >= 24 ? kick(t, B(24), 2.5) : 0;
  const glint = Math.max(...[2, 8, 12, 13, 16, 18, 21, 22, 24].map((s) => { const d = t - B(s); return d < 0 ? 0 : d < 0.1 ? d / 0.1 : Math.max(0, 1 - (d - 0.1) / 0.45); }));
  const eleHue = p >= 21 && p < 22 ? ((p - 21) * 180) % 360 : 0;
  const shX = Math.sin(t * 90) * 18 * shake, shY = Math.cos(t * 77) * 14 * shake;
  const smashShake = kick(t, B(9), 6);
  const letters = TITLE[0].split('');

  const mainEle = !e.hidden && <ElephantBody e={e} t={t} f={f} hue={eleHue} withStack glint={glint} />;
  const whipStyle: React.CSSProperties = {transform: `translateX(${wx}px)`, filter: blur > 0.5 ? 'url(#whip)' : undefined};

  return (
    <AbsoluteFill style={{background: PINK_BG, overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}><filter id="whip" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} /></filter></svg>
      <AbsoluteFill style={{transform: `scale(${zoom}) translate(${shX}px, ${shY}px)`}}>
        <AbsoluteFill style={whipStyle}>
          {rainbow > 0 && (
            <AbsoluteFill style={{background: PINK_BG, filter: `hue-rotate(${hueStep}deg) saturate(1.5)`, opacity: rainbow,
              maskImage: 'linear-gradient(90deg, transparent 44%, black 62%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 44%, black 62%)'}} />
          )}
          <div style={{position: 'absolute', left: 1450 - 1600, top: 520 - 1600, width: 3200, height: 3200, opacity: 0.18 + 0.16 * bass + 0.15 * rainbow,
            background: `repeating-conic-gradient(from ${rays}deg at 50% 50%, rgba(255,255,255,.9) 0deg 7deg, rgba(255,255,255,0) 7deg 22deg)`,
            maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 55%)'}} />
          <Rain t={t} />
          <Conga t={t} />
          <SpeedLines t={t} f={f} bass={bass} />
          <Smoke t={t} bass={bass} />
          <Chair t={t} />
          <Trail t={t} bass={bass} topLayer={false} />
          <Crowd t={t} bass={bass} />
          {!e.top && mainEle}
          <Laptop t={t} />
          <ChairSign t={t} />
          <Dust t={t} />
          <SparkleBurst t={t} bass={bass} />
          <Confetti t={t} bass={bass} />
          <Burst t={t} beat={2} text="BONK!" x={1560} y={300} color="#ffcc4d" />
        </AbsoluteFill>
      </AbsoluteFill>

      {/* title, wordmark and hosts: above the action, never blurred or whipped, a third of the zoom */}
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
            <div style={{position: 'absolute', left: -24, top: 0, height: 150, width: 720, background: PLUM, borderRadius: 18, transform: `scaleX(${band}) skewX(-6deg)`, transformOrigin: '0 50%', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
            <div style={{...font, position: 'absolute', left: 14, top: 4, fontSize: 124, color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap', clipPath: `inset(0 ${100 - band * 100}% 0 0)`,
              transform: `scale(${1 + 0.05 * beatPulse(bt, t, 8) + 0.06 * finalHit})`, transformOrigin: '0% 50%'}}>{TITLE[1]}</div>
          </div>
        </div>
        <Photo src="photo-kirk.png" name="Kirk Wolak" x={110} t={t} phase={0} />
        <Photo src="photo-nik.png" name="Nik Samokhvalov" x={470} t={t} phase={1} />
        <Photo src="photo-alvaro.png" name="Álvaro Hernández" x={830} t={t} phase={0} />
      </AbsoluteFill>

      {/* the smash: the elephant flies over the title (beats 8.55-9.8) */}
      {e.top && (
        <AbsoluteFill style={{transform: `scale(${zoom}) translate(${shX}px, ${shY}px)`}}>
          <Trail t={t} bass={bass} topLayer />
          {mainEle}
          <Burst t={t} beat={9} text="SMASH!" x={900} y={190} color="#7ee0ff" />
        </AbsoluteFill>
      )}
      {!e.top && <AbsoluteFill style={{transform: `scale(${zoom})`}}><Burst t={t} beat={9} text="SMASH!" x={900} y={190} color="#7ee0ff" /></AbsoluteFill>}
      <Grain opacity={0.12} />
      <AbsoluteFill style={{background: '#fff', opacity: 0.45 * finalHit + flash}} />
    </AbsoluteFill>
  );
};
