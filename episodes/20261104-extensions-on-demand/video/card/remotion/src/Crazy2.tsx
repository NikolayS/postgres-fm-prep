import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {at, Beat, beatPulse, beatT, ELE, Grain, H, lin, pop, Sparkle, TITLE, useFonts, useLevels, useT, W} from './common';

// "Even crazier" v2 of the ep 195 title card. Same look, title, hosts, length and beat grid as
// Crazy.tsx (v1); the elephant now catches, stacks and kicks extension boxes, gets clones and an
// echo trail, the camera punches and whips, confetti bursts on the hits, rainbow passages.
// Heads (host photos) are untouched: plain frames with the same small nod as v1.

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const PLUM = '#3d0f45';
const font = {fontFamily: 'Lato', fontWeight: 900} as const;

// a-shades intro (116 BPM): first downbeat 0.486 s, final hit at beat 24 (12.90 s).
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
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// 1 at time s, exponential decay after it (0 before).
const kick = (t: number, s: number, rate = 6) => (t >= s ? Math.exp(-(t - s) * rate) : 0);

// Elephant choreography (beats): 1-2 drop; 2 land; 3-7 catches a box per beat (4-8 bounces);
// 8 spin jump, kicks the stack away; 10-12 wobble; 12 backflip; 14-16 grows huge with two
// clones; 16-20 hops left and back catching four boxes; 20-22 headbang; 22-24 double spin;
// 24 lands on the final hit with the stack, confetti and flash.
type Pose = {x: number; y: number; rot: number; sx: number; sy: number; scale: number};
const pose = (t: number, bass: number): Pose => {
  const p = beatPos(t);
  let y = 0, x = 0, rot = 0, sx = 1, sy = 1, scale = 1;
  const drop = lin(t, B(1), B(2));
  if (p < 2) y = -1500 * (1 - drop * drop);
  const sq = Math.max(land(t, 2, 2.01) * 1.6, land(t, 4, 8), land(t, 9, 9.01), land(t, 13, 13.01), land(t, 16, 20, 0.5) * 0.7, land(t, 24, 24.01) * 1.8);
  sx += 0.14 * sq + 0.03 * bass; sy -= 0.16 * sq + 0.03 * bass;
  const h1 = hop(t, 4, 8);
  y -= 140 * h1; sy += 0.06 * h1; sx -= 0.04 * h1;
  if (p >= 8 && p < 9) { y -= 420 * hop(t, 8, 9); rot = 360 * easeInOut(p - 8); }
  if (p >= 10 && p < 12) rot = 14 * Math.sin((p - 10) * Math.PI * 2);
  if (p >= 12 && p < 13) { y -= 380 * hop(t, 12, 13); rot = -360 * easeInOut(p - 12); }
  const grow = lin(t, B(14), B(14.6)) * (1 - lin(t, B(15.6), B(16)));
  scale *= 1 + 0.3 * grow;
  if (grow > 0) { x += (Math.sin(t * 61) * 14 + Math.sin(t * 37) * 9) * (0.4 + bass) * grow; rot += Math.sin(t * 47) * 4 * grow; }
  if (p >= 16 && p < 20) {
    const k = (p - 16) / 4;
    x -= 150 * Math.sin(k * Math.PI);
    y -= 120 * hop(t, 16, 20, 0.5);
    rot += 10 * Math.sin((p - 16) * Math.PI * 2);
  }
  if (p >= 20 && p < 22) rot = 18 * Math.sin((p - 20) * Math.PI * 2) * (0.6 + 0.4 * beatPulse(bt, t, 1, 20));
  if (p >= 22 && p < 24) { y -= 520 * hop(t, 22, 24, 2); rot = 720 * easeInOut((p - 22) / 2); }
  return {x, y, rot, sx, sy, scale};
};

// Elephant geometry: 880 px tall, left 1120, feet 170 px below the frame edge.
const EH = 880, EK = EH / ELE.h, EW = ELE.w * EK, EX = 1120, EY = H - EH + 170;
const ORIGIN = '50% 62%';
const HEAD_TOP = 26; // local px: top of the head (image row ~40)

// Extension "container image" box: a layer with a label.
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

// Stack 1: caught on beats 3-7, kicked away by the spin at 8.
const STACK1 = ['pg_partman', 'timescaledb', 'citus', 'pg_repack', 'pgaudit'].map((label, i) => ({label, color: COLORS[(i * 3) % COLORS.length], at: B(3 + i)}));
// Stack 2: caught on the half-beat landings 16.5-19.5, kept to the end.
const STACK2 = ['postgis', 'pgvector', 'hypopg', 'pg_trgm'].map((label, i) => ({label, color: COLORS[(i * 3 + 1) % COLORS.length], at: B(16.5 + i)}));
const FALL = 0.42, FALL_H = 1100;

const slotTop = (i: number) => HEAD_TOP - (i + 1) * (BH - 6);
const Stack: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  const out: React.ReactNode[] = [];
  const sway = (i: number) => {
    let r = 0;
    if (p >= 4 && p < 8) r = (i + 1) * 1.6 * Math.sin((p - 4) * Math.PI * 2 - 0.6);
    if (p >= 16 && p < 22) r = (i + 1) * 1.8 * Math.sin((p - 16) * Math.PI * 2 - 0.6);
    if (t >= B(24)) { const d = t - B(24); r = (i + 1) * 4 * Math.exp(-d * 3.5) * Math.sin(d * 16); }
    return r;
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
      if (k > 2.2) return;
    }
    out.push(<ExtBox key={key + i} label={b.label} color={b.color} style={{left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '50% 100%'}} />);
  };
  STACK1.forEach((b, i) => place(b, i, 's1', B(8) + 0.06));
  STACK2.forEach((b, i) => place(b, i, 's2', null));
  return <>{out}</>;
};

const ElephantBody: React.FC<{e: Pose; t: number; hue?: number; opacity?: number; withStack?: boolean; glint?: number}> = ({e, t, hue = 0, opacity = 1, withStack, glint = 0}) => (
  <div style={{position: 'absolute', left: EX + e.x, top: EY + e.y, width: EW, height: EH, opacity,
    transform: `rotate(${e.rot}deg) scale(${e.scale * e.sx}, ${e.scale * e.sy})`, transformOrigin: ORIGIN}}>
    <Img src={staticFile('elephant.png')} style={{width: EW, height: EH, filter: hue ? `hue-rotate(${hue}deg) saturate(1.6)` : undefined,
      maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}} />
    {glint > 0 && <><Sparkle x={850 * EK} y={310 * EK} s={glint * 1.1} rot={t * 120} /><Sparkle x={500 * EK} y={310 * EK} s={glint * 0.6} rot={-t * 120} /></>}
    {withStack && <Stack t={t} />}
  </div>
);

// Echo trail (onion skin) during the spins and the hops.
const TRAIL: [number, number][] = [[8, 9.2], [12, 13.2], [16, 20], [22, 24.1]];
const Trail: React.FC<{t: number; bass: number}> = ({t, bass}) => {
  const p = beatPos(t);
  if (!TRAIL.some(([a, b]) => p >= a && p < b)) return null;
  return <>{[4, 3, 2, 1].map((k) => <ElephantBody key={k} e={pose(t - k * 0.045, bass)} t={t} hue={k * 70} opacity={0.42 - k * 0.08} />)}</>;
};

// Two clones pop out on 14 and 14.5, headbang against the main one, vanish on 16.
const Clones: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  if (p < 13.8 || p > 16.4) return null;
  return (
    <>
      {[{dx: -400, at: 14, hue: 110, ph: 0}, {dx: 360, at: 14.5, hue: 230, ph: Math.PI}].map((c) => {
        const s = Math.min(1, Math.max(0, (p - c.at) * 4)) * (1 - Math.min(1, Math.max(0, (p - 15.8) * 3)));
        if (s <= 0) return null;
        const pp = Math.sin(Math.min(1, s) * Math.PI / 2);
        const e: Pose = {x: c.dx, y: 60 - 70 * hop(t, c.at, 16, 0.5), rot: 16 * Math.sin((p - 14) * Math.PI * 2 + c.ph), sx: 1, sy: 1, scale: 0.72 * pp};
        return <ElephantBody key={c.hue} e={e} t={t} hue={c.hue} />;
      })}
    </>
  );
};

// Background rain of extension boxes (right half, behind the elephant), beats 9-12 and 19.5-23.
const RAIN = ['pg_stat_statements', 'pgcrypto', 'pg_hint_plan', 'orafce', 'pgrouting', 'pg_squeeze', 'hstore', 'plv8', 'pg_ivm', 'pgsodium', 'h3', 'pg_trgm', 'postgis', 'pgvector', 'hypopg', 'pg_cron', 'citus', 'timescaledb', 'pg_partman', 'wal2json'];
const Rain: React.FC<{t: number}> = ({t}) => (
  <>
    {RAIN.map((label, j) => {
      // second shower is denser and done before the final hit settles
      const second = j >= 10, ts = second ? B(19.5) + (j % 10) * 0.15 + rnd(j) * 0.1 : B(9) + j * 0.29 + rnd(j) * 0.12;
      const d = t - ts, dur = second ? 1.2 : 1.5;
      if (d < 0 || d > dur) return null;
      const q = d / dur, s = 0.5 + 0.35 * rnd(j + 40);
      const x = 900 + rnd(j + 20) * 900, y = -150 + (H + 300) * q * (0.6 + 0.4 * q);
      return <ExtBox key={j} label={label} color={COLORS[j % COLORS.length]} style={{left: x - BW / 2, top: y, opacity: 0.9, transform: `scale(${s}) rotate(${(rnd(j + 60) - 0.5) * 50 + d * (rnd(j + 80) - 0.5) * 300}deg)`}} />;
    })}
  </>
);

// Confetti bursts from the elephant on the hits.
const BURSTS: {beat: number; n: number; power: number}[] = [{beat: 2, n: 70, power: 1}, {beat: 8, n: 80, power: 1.2}, {beat: 13, n: 60, power: 0.9}, {beat: 16, n: 80, power: 1.1}, {beat: 24, n: 160, power: 1.5}];
const CONF = ['#ffffff', '#3d0f45', '#39b54a', '#f2c63f', '#ff7124', '#42a8c8', '#8a4fd8', '#ff5fcf'];
const Confetti: React.FC<{t: number; bass: number}> = ({t, bass}) => (
  <>
    {BURSTS.flatMap((b, bi) => {
      const s = B(b.beat), d = t - s;
      if (d < 0 || d > 2.4) return [];
      const e = pose(s, bass);
      const ox = EX + e.x + EW / 2, oy = EY + e.y + EH * 0.35;
      return Array.from({length: b.n}, (_, i) => {
        const id = bi * 1000 + i;
        const a = -Math.PI / 2 + (rnd(id) - 0.5) * Math.PI * 1.5, v = (700 + 1100 * rnd(id + 1)) * b.power;
        const drag = Math.exp(-d * 1.4);
        const dist = (1 - drag) / 1.4;
        const x = ox + Math.cos(a) * v * dist, y = oy + Math.sin(a) * v * dist + 700 * d * d;
        const o = d > 1.8 ? 1 - (d - 1.8) / 0.6 : 1;
        const w = 10 + 10 * rnd(id + 2), hh = 6 + 6 * rnd(id + 3);
        return <div key={id} style={{position: 'absolute', left: x, top: y, width: w, height: hh, background: CONF[id % CONF.length], opacity: o, borderRadius: 2,
          transform: `rotate(${(rnd(id + 4) - 0.5) * 1400 * d}deg) scaleX(${Math.cos(d * (6 + 10 * rnd(id + 5)))})`}} />;
      });
    })}
  </>
);

// Sparkle bursts around the elephant on the hits.
const SparkleBurst: React.FC<{t: number; bass: number}> = ({t, bass}) => (
  <>
    {[2, 8, 13, 16, 20, 24].flatMap((beat, bi) => {
      const d = t - B(beat);
      if (d < 0 || d > 0.7) return [];
      const e = pose(B(beat), bass), cx = EX + e.x + EW / 2, cy = EY + e.y + EH * 0.35;
      return Array.from({length: 7}, (_, i) => {
        const a = rnd(bi * 50 + i) * Math.PI * 2, r = 260 + 260 * rnd(bi * 50 + i + 9) + 200 * d;
        const s = Math.sin(Math.min(1, d / 0.7) * Math.PI) * (0.5 + 0.6 * rnd(i + bi));
        return <Sparkle key={bi + '-' + i} x={cx + Math.cos(a) * r} y={cy + Math.sin(a) * r} s={s} rot={d * 240} />;
      });
    })}
  </>
);

// Speed lines: radial (anime) around the elephant on 14-16 and 22-24, vertical streaks on the drops.
const SpeedLines: React.FC<{t: number; f: number; bass: number}> = ({t, f, bass}) => {
  const p = beatPos(t);
  const radial = (p >= 14 && p < 16) || (p >= 22 && p < 24);
  const vertical = (p >= 1 && p < 2) || (p >= 23 && p < 24);
  if (!radial && !vertical) return null;
  const e = pose(t, bass), cx = EX + e.x + EW / 2, cy = EY + e.y + EH * 0.4;
  const seed = Math.floor(f / 2);
  const lines: React.ReactNode[] = [];
  if (radial) for (let i = 0; i < 46; i++) {
    const a = rnd(seed * 97 + i) * Math.PI * 2, r1 = 470 + 220 * rnd(seed * 31 + i), r2 = 1500, wd = 0.006 + 0.012 * rnd(seed * 13 + i);
    lines.push(<polygon key={'r' + i} points={`${cx + Math.cos(a) * r1},${cy + Math.sin(a) * r1} ${cx + Math.cos(a - wd) * r2},${cy + Math.sin(a - wd) * r2} ${cx + Math.cos(a + wd) * r2},${cy + Math.sin(a + wd) * r2}`} fill="#fff" opacity={0.55} />);
  }
  if (vertical) for (let i = 0; i < 26; i++) {
    const x = 1000 + 900 * rnd(seed * 7 + i), y = -200 + 1200 * rnd(seed * 11 + i), len = 220 + 300 * rnd(seed * 3 + i);
    lines.push(<rect key={'v' + i} x={x} y={y} width={4 + 4 * rnd(i)} height={len} rx={3} fill="#fff" opacity={0.6} />);
  }
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>{lines}</svg>;
};

const Dust: React.FC<{t: number}> = ({t}) => (
  <>
    {[2, 9, 13, 24].map((s) => {
      const d = t - B(s);
      if (d < 0 || d > 0.9) return null;
      const q = d / 0.9;
      return [-1, 1].map((side) => (
        <div key={s + '' + side} style={{position: 'absolute', left: 1440 + side * (120 + 260 * q) - 90, top: H - 110 - 60 * q, width: 180 * (1 + q), height: 90 * (1 + q),
          borderRadius: '50%', background: 'rgba(255,255,255,.75)', opacity: 1 - q, filter: 'blur(6px)'}} />
      ));
    })}
  </>
);

// Host photos: unchanged from v1 (plain frames, small nod on alternate beats).
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

// Camera whip: a fast sideways jerk of the world with horizontal motion blur, centred on beat s.
const whip = (t: number, s: number, amp: number) => {
  const u = (t - (B(s) - 0.16)) / 0.4;
  if (u <= 0 || u >= 1) return {x: 0, v: 0};
  const sh = Math.sin(Math.PI * u);
  return {x: amp * sh * sh, v: Math.abs(amp * Math.PI * Math.sin(2 * Math.PI * u) / 0.4)};
};

export const CardCrazy2: React.FC = () => {
  useFonts();
  const lv = useLevels('a-shades');
  const {f, t} = useT();
  const p = beatPos(t);
  const bass = at(lv, 'low', f);
  const e = pose(t, bass);
  const finalHit = kick(t, B(24), 5);
  const shake = Math.max(land(t, 2, 2.01), land(t, 13, 13.01) * 0.6, land(t, 24, 24.01) * 1.4, land(t, 8, 8.01) * 0.4);
  // Zoom: a small punch on every beat from 4, big punches on 2, 8, 13, 16, 24.
  const everyBeat = p >= 4 && p < 24 ? beatPulse(bt, t, 1, 4) : 0;
  const big = Math.max(...[2, 8, 13, 16].map((s) => kick(t, B(s), 7)), finalHit);
  const zoom = 1 + 0.025 * everyBeat + 0.09 * big;
  // Whips on 16 (left) and 20 (right).
  const w1 = whip(t, 16, -240), w2 = whip(t, 20, 240);
  const wx = w1.x + w2.x, blur = Math.min(40, (w1.v + w2.v) / 90);
  // Rainbow passages (right side only, the title side stays pink): 14-16 and 20-22, hue steps per beat.
  const rainbow = Math.max(lin(p, 13.8, 14) * (1 - lin(p, 15.9, 16.1)), lin(p, 19.8, 20) * (1 - lin(p, 21.9, 22.1)));
  const hueStep = Math.floor(p) * 67;
  const flash = rainbow * 0.14 * beatPulse(bt, t, 1, 14);

  const wm = pop(f, B(0) - 0.08, 9, 220);
  const band = lin(t, B(5), B(5.6));
  const rays = t * (p > 14 ? 34 : 8) + (p > 20 && p < 24 ? t * 30 : 0);
  const titleIn = pop(f, B(1), 10, 200);
  const wave = p >= 16 && p < 24 ? 1 : p >= 24 ? kick(t, B(24), 2.5) : 0;
  const glint = Math.max(...[2, 8, 12, 16, 18, 20, 22, 24].map((s) => { const d = t - B(s); return d < 0 ? 0 : d < 0.1 ? d / 0.1 : Math.max(0, 1 - (d - 0.1) / 0.45); }));
  const eleHue = p >= 20 && p < 24 ? ((p - 20) * 90) % 360 : 0;
  const shX = Math.sin(t * 90) * 18 * shake, shY = Math.cos(t * 77) * 14 * shake;

  return (
    <AbsoluteFill style={{background: PINK_BG, overflow: 'hidden'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}><filter id="whip" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} /></filter></svg>
      <AbsoluteFill style={{transform: `scale(${zoom}) translate(${shX}px, ${shY}px)`}}>
        {/* world: background, rain, clones, elephant (whips with the camera) */}
        <AbsoluteFill style={{transform: `translateX(${wx}px)`, filter: blur > 0.5 ? 'url(#whip)' : undefined}}>
          {rainbow > 0 && (
            <AbsoluteFill style={{background: PINK_BG, filter: `hue-rotate(${hueStep}deg) saturate(1.5)`, opacity: rainbow,
              maskImage: 'linear-gradient(90deg, transparent 44%, black 62%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 44%, black 62%)'}} />
          )}
          <div style={{position: 'absolute', left: 1450 - 1600, top: 520 - 1600, width: 3200, height: 3200, opacity: 0.18 + 0.16 * bass + 0.15 * rainbow,
            background: `repeating-conic-gradient(from ${rays}deg at 50% 50%, rgba(255,255,255,.9) 0deg 7deg, rgba(255,255,255,0) 7deg 22deg)`,
            maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 55%)'}} />
          <Rain t={t} />
          <Clones t={t} />
        </AbsoluteFill>

        <AbsoluteFill style={{transform: `translateX(${wx}px)`, filter: blur > 0.5 ? 'url(#whip)' : undefined}}>
          <SpeedLines t={t} f={f} bass={bass} />
          <Trail t={t} bass={bass} />
          <ElephantBody e={e} t={t} hue={eleHue} withStack glint={glint} />
          <Dust t={t} />
          <SparkleBurst t={t} bass={bass} />
          <Confetti t={t} bass={bass} />
        </AbsoluteFill>
      </AbsoluteFill>
      {/* title, wordmark and hosts: above the world (never blurred, not whipped), a third of the zoom */}
      <AbsoluteFill style={{transform: `scale(${1 + (zoom - 1) * 0.33}) translate(${shX * 0.4}px, ${shY * 0.4}px)`}}>
        <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560,
          transform: `scale(${0.4 + 0.6 * wm}) rotate(${(1 - wm) * -8}deg)`, transformOrigin: '0% 50%', opacity: Math.min(1, wm * 2),
          filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
        <div style={{position: 'absolute', left: 110, top: 240}}>
          <div style={{...font, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, opacity: Math.min(1, titleIn * 2), whiteSpace: 'nowrap',
            transform: `translateY(${(1 - titleIn) * 80}px)`, textShadow: `0 7px 0 ${PLUM}66, 0 0 40px rgba(120,20,120,.3)`}}>
            {TITLE[0].split('').map((ch, i) => (
              <span key={i} style={{display: 'inline-block', transform: `translateY(${-14 * wave * Math.max(0, Math.sin((p - i * 0.12) * Math.PI * 2))}px)`}}>{ch}</span>
            ))}
          </div>
          <div style={{position: 'relative', marginTop: 26, height: 150}}>
            <div style={{position: 'absolute', left: -24, top: 0, height: 150, width: 720, background: PLUM, borderRadius: 18, transform: `scaleX(${band}) skewX(-6deg)`, transformOrigin: '0 50%', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
            <div style={{...font, position: 'absolute', left: 14, top: 4, fontSize: 124, color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap', clipPath: `inset(0 ${100 - band * 100}% 0 0)`,
              transform: `scale(${1 + 0.05 * beatPulse(bt, t, 8) + 0.06 * finalHit})`, transformOrigin: '0% 50%'}}>{TITLE[1]}</div>
          </div>
        </div>
        <Photo src="photo-kirk.png" name="Kirk Wolak" x={110} t={t} phase={0} />
        <Photo src="photo-nik.png" name="Nik Samokhvalov" x={470} t={t} phase={1} />
        <Photo src="photo-alvaro.png" name="Álvaro Hernández" x={830} t={t} phase={0} />
      </AbsoluteFill>

      <Grain opacity={0.12} />
      <AbsoluteFill style={{background: '#fff', opacity: 0.45 * finalHit + flash}} />
    </AbsoluteFill>
  );
};
