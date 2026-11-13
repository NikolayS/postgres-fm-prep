import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile} from 'remotion';
import {Beat, beatPulse, beatT, ELE, FPS, Grain, H, HOSTS, lin, TITLE, useFonts, useLevels, useT, W} from './common';

// v7, the ep 196 title card ("The hidden costs of CREATE TEMP TABLE"). Host (2026-11-10): the
// FIRST Crazy6 (10 scenes, kept as Crazy6a.tsx) had the good ideas and the right beat energy, but
// "things happen too fast"; so v7 is that card at HALF SPEED on a longer cue: every scene lasts
// twice as long (2-4 s), while the hits stay on every real beat (host tiles boom on each beat,
// the frame border pulses, inverts on the scene changes). The postcard ending is replaced by
// Crazy5's deck chair: "RESERVED / Michael / on vacation" flips on the final hit to
// "Michael's seat: ON COMMIT PRESERVE ROWS" (the SQL in mono, one size).
//
// Timing: the scene code below is the original, written in "story beats" p (0..24). The real cue
// (a-shades-ep196-pad.wav, 116 BPM, beat 0 = 0.486 s) runs at 2 real beats per story beat, so
// story beat p happens at real beat 2p: final hit on real beat 48 = 25.31 s; card 27 s, --card 26.
// Story beats (x2 for real beats):
//  <0     a psql terminal: "CREATE TEMP TABLE frame;"
//  0-0.7  the pink frame is INSERTed row by row (12 rows slide in from alternating sides)
//  1-2    title typed letter by letter; the elephant assembles from table cells (3D tile flips) by 2
//  2-5    sinval queue: a conveyor of invalidation messages, the elephant running on it; the
//         4,096-slot counter fills, belt speed doubles every beat
//  5-6    OVERFLOW: invalidation messages flood the frame, the elephant floats up on them
//  6-8    night: 5,000 idle sessions asleep (a theatre of tiny elephants, z z z); on 7 the elephant
//         shouts "CATALOG CHANGED!" through a megaphone and the wake-up wave runs through them
//  8-10   builder in a hard hat: the pg_class skyscraper grows 16 floors a beat, the camera pulls
//         back, it sways and topples
//  10-12  3D flip into a 2x2 multiverse: suit / hoodie / ON COMMIT DROP / temp_buffers = 8MB,
//         panels shuffle on 11 and 11.5
//  12-13  VHS REWIND: the last four beats play backwards at 4x
//  13-14  DISCARD ALL vacuum cleaner sucks up temp tables, prepared statements, SETs, LISTENs ...
//  14-16  it overloads into a black hole; everything spirals in, the elephant is spaghettified
//  16-17  3D flip: a river of rows, the elephant in a "temp_buffers" barrel goes over the cliff
//  17-19  the camera falls with it, TPS meter crashing 48,000 -> 12; on 18 it bails out under a
//         table-grid parachute; 19 SPLASH into the base/pgsql_tmp/ lake (work_mem swim ring)
//  20-21  jumps out home; a psql prompt types "TRUNCATE frame;"
//  21-22  the frame is TRUNCATEd: shredded into strips that fall away to the terminal
//  22-24  INSERT INTO frame SELECT * FROM pink: rows slide back, the elephant reassembles from cells
//  24     clean final frame: Michael's sign flips to "ON COMMIT PRESERVE ROWS"

// Speech bubbles over the hosts: off until the hosts approve the words.
const SHOW_BUBBLES = false;

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const PLUM = '#3d0f45';
const TERM = '#22072a';
const RED = '#d93d1b';
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
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const eIn = (x: number) => Math.pow(clamp01(x), 3);
const arc = (q: number) => 4 * q * (1 - q);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const inP = (p: number, a: number, b: number) => p >= a && p < b;
const mix = (a: number, b: number, q: number) => a + (b - a) * q;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
// overshoot spring 0 -> 1 over ~0.3 beat
const boing = (u: number) => (u <= 0 ? 0 : u >= 1.6 ? 1 : 1 - Math.exp(-u * 9) * Math.cos(u * 14));

// Elephant geometry (as before): 880 px tall, origin at 62% height.
const EH = 880, EK = EH / ELE.h, EW = ELE.w * EK, EX = 1120, EY = H - EH + 170;
const OX = EX + EW / 2, OY = EY + 0.62 * EH;
const L = (v: number) => v * EK; // image px -> local px
type Pose = {x: number; y: number; rot: number; sx: number; sy: number; scale: number; hidden?: boolean};
const at = (cx: number, cy: number, s: number, rot = 0, sx = 1, sy = 1): Pose => ({x: cx - OX, y: cy - OY, rot, sx, sy, scale: s});
const HOME = at(OX, OY, 1);
const cOf = (e: Pose) => ({x: OX + e.x, y: OY + e.y});
// image point -> world (ignores rotation; fine for props on near-upright poses)
const imgPt = (e: Pose, ix: number, iy: number) => ({x: OX + e.x + (ix - ELE.w / 2) * EK * e.scale * e.sx, y: OY + e.y + (iy - 0.62 * ELE.h) * EK * e.scale * e.sy});

const Elephant: React.FC<{e: Pose; hue?: number; opacity?: number; filter?: string; under?: React.ReactNode; over?: React.ReactNode}> = ({e, hue = 0, opacity = 1, filter, under, over}) =>
  e.hidden ? null : (
    <div style={{position: 'absolute', left: EX + e.x, top: EY + e.y, width: EW, height: EH, opacity,
      transform: `rotate(${e.rot}deg) scale(${e.scale * e.sx}, ${e.scale * e.sy})`, transformOrigin: '50% 62%'}}>
      {under}
      <Img src={staticFile('elephant.png')} style={{position: 'absolute', left: 0, top: 0, width: EW, height: EH, filter: [hue ? `hue-rotate(${hue}deg) saturate(1.6)` : '', filter ?? ''].join(' ').trim() || undefined,
        maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}} />
      {over}
    </div>
  );

// The elephant assembled from table cells: 6x7 tiles flip in (rotateY) along the diagonal.
const MCOLS = 6, MROWS = 7;
const Mosaic: React.FC<{e: Pose; u: number}> = ({e, u}) => {
  const tw = EW / MCOLS, th = EH / MROWS;
  return (
    <div style={{position: 'absolute', left: EX + e.x, top: EY + e.y, width: EW, height: EH, transform: `scale(${e.scale})`, transformOrigin: '50% 62%',
      maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}}>
      {Array.from({length: MCOLS * MROWS}, (_, k) => {
        const c = k % MCOLS, r = Math.floor(k / MCOLS);
        const d = ((c / (MCOLS - 1)) + (1 - r / (MROWS - 1))) / 2 * 0.65 + rnd(k) * 0.08;
        const q = clamp01((u - d) / 0.27);
        if (q <= 0) return null;
        const ang = 90 * (1 - eOut(q)) * (k % 2 ? 1 : -1);
        return (
          <div key={k} style={{position: 'absolute', left: c * tw, top: r * th, width: tw + 0.5, height: th + 0.5, overflow: 'hidden',
            transform: `perspective(900px) rotateY(${ang}deg)`, outline: q < 1 ? `2px solid rgba(255,255,255,${0.8 * (1 - q)})` : undefined}}>
            <Img src={staticFile('elephant.png')} style={{position: 'absolute', left: -c * tw, top: -r * th, width: EW, height: EH}} />
          </div>
        );
      })}
    </div>
  );
};

// ---------- costumes and props (local px inside the elephant box) ----------
const HardHat = () => (
  <svg width={EW} height={EH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <path d={`M${L(330)},${L(150)} Q${L(660)},${L(-210)} ${L(990)},${L(150)} Z`} fill="#ffcc4d" stroke={PLUM} strokeWidth={10} />
    <rect x={L(250)} y={L(130)} width={L(820)} height={L(55)} rx={L(25)} fill="#ffcc4d" stroke={PLUM} strokeWidth={10} />
    <rect x={L(630)} y={L(-20)} width={L(60)} height={L(150)} rx={L(20)} fill="#f2a130" />
  </svg>
);
const Bowler = () => (
  <svg width={EW} height={EH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <ellipse cx={L(660)} cy={L(95)} rx={L(380)} ry={L(55)} fill="#26232b" stroke={PLUM} strokeWidth={8} />
    <path d={`M${L(420)},${L(95)} Q${L(420)},${L(-200)} ${L(660)},${L(-200)} Q${L(900)},${L(-200)} ${L(900)},${L(95)} Z`} fill="#26232b" stroke={PLUM} strokeWidth={8} />
    <rect x={L(425)} y={L(30)} width={L(470)} height={L(45)} fill="#8a4fd8" />
    {/* briefcase on the left tusk */}
    <line x1={L(250)} y1={L(1230)} x2={L(250)} y2={L(1300)} stroke={PLUM} strokeWidth={8} />
    <rect x={L(90)} y={L(1300)} width={L(330)} height={L(230)} rx={L(20)} fill="#7a4a24" stroke={PLUM} strokeWidth={8} />
    <rect x={L(90)} y={L(1380)} width={L(330)} height={L(14)} fill="#c9a36b" />
  </svg>
);
const HoodUnder = () => (
  <div style={{position: 'absolute', left: L(-90), top: L(-110), width: L(1500), height: L(1250), borderRadius: '48% 48% 30% 30%', background: '#5b2a8a', border: `6px solid ${PLUM}`}} />
);
const HoodOver = () => (
  <svg width={EW} height={EH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <path d={`M${L(130)},${L(420)} Q${L(660)},${L(-330)} ${L(1190)},${L(420)}`} fill="none" stroke="#26232b" strokeWidth={L(55)} />
    <rect x={L(40)} y={L(330)} width={L(150)} height={L(240)} rx={L(50)} fill="#ff5fcf" stroke={PLUM} strokeWidth={8} />
    <rect x={L(1130)} y={L(330)} width={L(150)} height={L(240)} rx={L(50)} fill="#ff5fcf" stroke={PLUM} strokeWidth={8} />
    {[470, 850].map((x) => <g key={x}><line x1={L(x)} y1={L(720)} x2={L(x)} y2={L(1080)} stroke="#fff" strokeWidth={8} /><circle cx={L(x)} cy={L(1090)} r={L(22)} fill="#fff" /></g>)}
  </svg>
);

// ---------- elephant choreography ----------
const FLOOD = (p: number) => 1080 - 600 * eOut(seg(p, 5, 5.8)) * (1 - eIn(seg(p, 6, 6.25)));
const MEGA = at(1610, 300, 0.42);
const BUILD = at(1600, 835, 0.8);
const VAC = at(1560, 880, 0.88);
const HOLE = {x: 1300, y: 420};
const pose = (p: number): Pose => {
  if (p < 1) return {...HOME, hidden: true};
  if (p < 2) return HOME;
  if (p < 5) { // running on the conveyor, 8th-note bob
    const b = Math.abs(Math.sin(2 * Math.PI * p));
    return {...HOME, y: -28 * b, x: 18 * Math.sin(Math.PI * p), rot: 3 * Math.sin(2 * Math.PI * p), sy: 1 - 0.04 * Math.cos(4 * Math.PI * p)};
  }
  if (p < 6) return {...HOME, y: -(1080 - FLOOD(p)) * 0.75, rot: 7 * Math.sin(2 * Math.PI * p)};
  if (p < 6.3) { const q = ease(seg(p, 6, 6.3)); const a = {...HOME, y: -(1080 - FLOOD(6)) * 0.75}; return {x: mix(a.x, MEGA.x, q), y: mix(a.y, MEGA.y, q) - 200 * arc(q), rot: 0, sx: 1, sy: 1, scale: mix(1, MEGA.scale, q)}; }
  if (p < 8) { const k = p >= 7 ? Math.exp(-(p - 7) * 6) : 0; return {...MEGA, x: MEGA.x + 30 * k, rot: -6 * k + (p < 7 ? 2 * Math.sin(p * Math.PI * 2) : 0)}; }
  if (p < 8.25) { const q = ease(seg(p, 8, 8.25)); return {x: mix(MEGA.x, BUILD.x, q), y: mix(MEGA.y, BUILD.y, q) - 150 * arc(q), rot: 0, sx: 1, sy: 1, scale: mix(MEGA.scale, BUILD.scale, q)}; }
  if (p < 10) { const ph = (p - 8.25) % 0.5, st = Math.exp(-ph * 14); return {...BUILD, sy: 1 - 0.07 * st, sx: 1 + 0.05 * st, rot: p > 9.5 ? -6 * seg(p, 9.5, 9.8) : 0}; }
  if (p < 13) return {...HOME, hidden: true};
  if (p < 14) return {...VAC, rot: -4 + 1.5 * Math.sin(p * 60), x: VAC.x + 3 * Math.sin(p * 47)};
  if (p < 15.5) {
    const q = eIn(seg(p, 14, 15.5)), c0 = cOf(VAC);
    const ang = Math.atan2(HOLE.y - c0.y, HOLE.x - c0.x) * 180 / Math.PI + 90;
    return {x: mix(c0.x, HOLE.x, q) - OX, y: mix(c0.y, HOLE.y, q) - OY, rot: ang * Math.min(1, q * 3) + 400 * q * q, sx: 1 - 0.75 * q, sy: 1 + 1.4 * q, scale: VAC.scale * (1 - 0.95 * q)};
  }
  if (p < 16) return {...HOME, hidden: true};
  if (p < 17) return at(900 + 450 * (p - 16), 470 + 6 * Math.sin(p * 9), 0.3, 6 * Math.sin(p * 6));
  if (p < 17.3) { const q = seg(p, 17, 17.3); return at(mix(1350, 1400, q), mix(470, 420, q) + 120 * arc(q), mix(0.3, 0.4, q), 40 * Math.sin(q * Math.PI)); }
  if (p < 18) return at(1400 + 20 * Math.sin(p * 7), 420 + 25 * Math.sin(p * 5), 0.4, 15 * Math.sin(3 * Math.PI * p));
  if (p < 18.85) return at(1400, 470 + 60 * (p - 18), 0.4, 8 * Math.sin(2 * Math.PI * p));
  if (p < 19) { const q = eIn(seg(p, 18.85, 19)); return at(1400, mix(521, 900, q), mix(0.4, 0.45, q)); }
  if (p < 20) { const k = Math.exp(-(p - 19) * 5); return at(1400, 900 + 18 * Math.sin((p - 19) * 18) * k + 6 * Math.sin(p * 6), 0.45, 4 * Math.sin(p * 5)); }
  if (p < 21) { const q = seg(p, 20, 21), e = ease(q); const c = cOf(HOME); return at(mix(1400, c.x, e), mix(900, c.y, e) - 420 * arc(q), mix(0.45, 1, e), -360 * e); }
  if (p < 22) { const k = Math.exp(-(p - 21) * 8); return {...HOME, sy: 1 - 0.12 * k, sx: 1 + 0.08 * k}; }
  if (p < 23) return {...HOME, hidden: true};
  return HOME;
};

// ---------- the frame: 12 pink rows over the psql terminal ----------
const NROWS = 12, RH = H / NROWS;
const rowShift = (i: number, p: number) => {
  const side = i % 2 ? 1 : -1;
  if (p < 0) return side * W;
  if (p < 1) return side * W * (1 - eOut(seg(p, i * 0.04, i * 0.04 + 0.26)));
  if (p < 22) return 0;
  return side * W * (1 - eOut(seg(p, 22 + i * 0.1, 22 + i * 0.1 + 0.4)));
};
const PinkRows: React.FC<{p: number}> = ({p}) => (
  <>
    {Array.from({length: NROWS}, (_, i) => {
      const x = rowShift(i, p);
      if (Math.abs(x) >= W) return null;
      const zebra = p >= 2 && p < 24 && (i + Math.floor(p)) % 2 === 0;
      return (
        <div key={i} style={{position: 'absolute', left: x, top: i * RH - 0.5, width: W, height: RH + 1, background: PINK_BG, backgroundSize: `${W}px ${H}px`, backgroundPosition: `0 ${-i * RH}px`}}>
          {zebra && <div style={{position: 'absolute', inset: 0, background: 'rgba(255,255,255,.07)'}} />}
        </div>
      );
    })}
  </>
);

const typed = (s: string, p: number, a: number, b: number) => s.slice(0, Math.floor(s.length * seg(p, a, b)));
const Terminal: React.FC<{p: number; t: number}> = ({p, t}) => {
  const cur = Math.floor(t * 4) % 2 === 0;
  const line = (y: number, s: string, size = 34, color = '#fff', x = 840) => <div key={y + s} style={{...mono, position: 'absolute', left: x, top: y, fontSize: size, color, whiteSpace: 'nowrap'}}>{s}</div>;
  const out: React.ReactNode[] = [];
  if (p < 0.8) {
    out.push(line(470, 'postgres=# ' + typed('CREATE TEMP TABLE frame (vibe pink);', beatPos(t), -0.85, -0.15) + (cur ? '█' : ' '), 48, '#fff', 120));
    if (p > -0.12) out.push(line(545, 'CREATE TABLE', 48, '#9fe6a0', 120));
  }
  if (p >= 20.9) {
    out.push(line(330, 'postgres=# TRUNCATE frame;'));
    if (p >= 21.1) out.push(line(380, 'TRUNCATE TABLE', 34, '#9fe6a0'));
    if (p >= 21.9) out.push(line(450, 'postgres=# ' + typed('INSERT INTO frame SELECT * FROM pink;', p, 21.9, 22.3) + (p < 22.3 && cur ? '█' : '')));
    if (p >= 23.3) out.push(line(500, 'INSERT 0 12', 34, '#9fe6a0'));
  }
  return <>{out}</>;
};

// ---------- 2-6: the sinval queue ----------
const MSGS = ['inval pg_class', 'inval pg_attribute', 'inval pg_type', 'inval pg_index', 'inval pg_depend', 'inval pg_statistic'];
const Chip: React.FC<{s: string; x: number; y: number; r?: number; c?: number; scale?: number}> = ({s, x, y, r = 0, c = 0, scale = 1}) => (
  <div style={{...mono, position: 'absolute', left: x, top: y, height: 52, padding: '0 14px', lineHeight: '46px', fontSize: 30, whiteSpace: 'nowrap', boxSizing: 'border-box',
    color: '#fff', background: ['#16657c', '#8a4fd8', '#d93d1b', '#2fa38a', '#f2a130'][c % 5], border: '3px solid #fff', borderRadius: 10, transform: `rotate(${r}deg) scale(${scale})`, boxShadow: `0 4px 0 ${PLUM}55`}}>{s}</div>
);
const beltPos = (t: number) => { // integral of the speed, doubling every beat from beat 2
  const p = beatPos(t);
  if (p < 2) return 0;
  const k = Math.min(p, 6) - 2, v0 = 220;
  return v0 * bt.b * (Math.pow(2, k) - 1) / Math.LN2;
};
const Sinval: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 1.6 || p > 6.4) return null;
  const o = seg(p, 1.6, 2) * (1 - seg(p, 6.1, 6.4));
  const x0 = 820, belt = 1000;
  const n = p < 5 ? Math.min(4096, Math.floor(4096 * Math.pow(seg(p, 2, 5), 1.6))) : 4096;
  const over = p >= 5;
  const pos = beltPos(t);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const x = W + 40 - (((pos + i * 190) % (9 * 190)));
    out.push(<Chip key={'c' + i} s={MSGS[(i + Math.floor((pos + i * 190) / (9 * 190)) * 3) % MSGS.length]} x={x - 100} y={belt - 46} c={i} />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      {out}
      <div style={{position: 'absolute', left: x0, top: belt, width: W - x0 + 20, height: 56, background: '#2b2433', borderTop: `6px solid ${PLUM}`, borderBottom: `6px solid ${PLUM}`}}>
        {Array.from({length: 14}, (_, i) => <div key={i} style={{position: 'absolute', left: ((i * 90 - pos) % 1260 + 1260) % 1260, top: 10, width: 40, height: 24, borderRadius: 12, background: '#6f6680'}} />)}
      </div>
      {/* the queue bin */}
      <div style={{position: 'absolute', left: x0, top: 760, width: 440, whiteSpace: 'nowrap', padding: '12px 16px', background: '#fff', border: `5px solid ${PLUM}`, borderRadius: 16, boxShadow: `0 7px 0 ${PLUM}55`,
        transform: `rotate(${over ? 4 * Math.sin(t * 50) : 0}deg)`}}>
        <div style={{...mono, fontSize: 26, color: PLUM}}>sinval queue</div>
        <div style={{...mono, fontSize: 44, color: over ? RED : PLUM, lineHeight: 1.1}}>{fmt(n)} / 4,096</div>
        <div style={{marginTop: 6, height: 20, borderRadius: 10, background: '#f3d6ef', overflow: 'hidden'}}><div style={{width: `${(n / 4096) * 100}%`, height: '100%', background: n > 3000 ? RED : '#39b54a'}} /></div>
        {over && Math.floor(p * 6) % 2 === 0 && <div style={{...font, fontSize: 40, color: RED, marginTop: 4}}>OVERFLOW!</div>}
      </div>
    </div>
  );
};
const Flood: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 5 || p > 6.3) return null;
  const lvl = FLOOD(p);
  const out: React.ReactNode[] = [];
  for (let r = 0; r < 16; r++) {
    const y = lvl + r * 44 - 10;
    if (y > H) break;
    for (let c = 0; c < 7; c++) {
      const dir = r % 2 ? 1 : -1;
      const x = ((c * 290 + dir * t * 380 + r * 77) % 2030 + 2030) % 2030 - 110;
      out.push(<Chip key={r + '-' + c} s={MSGS[(r + c) % MSGS.length]} x={x} y={y + 8 * Math.sin(t * 6 + c + r)} r={(rnd(r * 7 + c) - 0.5) * 24} c={r + c} />);
    }
  }
  const wave = Array.from({length: 25}, (_, i) => `${i * 80},${lvl + 14 * Math.sin(i * 0.9 + t * 9)}`).join(' L');
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><path d={`M${wave} L${W},${H} L0,${H} Z`} fill="#42a8c8" opacity={0.55} /></svg>
      {out}
      {/* the spout */}
      {p < 6 && Array.from({length: 10}, (_, i) => {
        const d = ((t * 3 + i / 10) % 1);
        return <Chip key={'s' + i} s={MSGS[i % MSGS.length]} x={760 + 40 * Math.sin(i)} y={mix(820, lvl, d)} r={d * 200} c={i} scale={0.8} />;
      })}
    </>
  );
};

// ---------- 6-8: idle sessions + the megaphone ----------
const CROWD = Array.from({length: 50}, (_, i) => ({c: i % 10, r: Math.floor(i / 10)}));
const MOUTH = () => { const tip = imgPt(MEGA, 240, 1230); return {x: tip.x - 170, y: tip.y + 40, tip}; };
const Sessions: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 6.1 || p > 8.3) return null;
  const o = seg(p, 6.1, 6.35) * (1 - seg(p, 8.05, 8.3));
  const m = MOUTH();
  const ringR = p >= 7 ? (p - 7) * 1700 : -1;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      {CROWD.map(({c, r}, i) => {
        const cx = 880 + c * 104 + (r % 2) * 40, cy = 600 + r * 100;
        const dist = Math.hypot(cx - m.x, cy - m.y);
        const wake = ringR >= dist ? (ringR - dist) / 1700 : -1; // beats since woken
        const awake = wake >= 0;
        const jump = awake ? 60 * arc(clamp01(wake / 0.35)) : 0;
        const e = at(cx + (awake && wake > 0.35 ? 6 * Math.sin(t * 40 + i) : 0), cy - jump, 0.085, awake ? 0 : -12 + 3 * Math.sin(t * 2 + i));
        const zt = (t * 0.9 + rnd(i)) % 1;
        return (
          <React.Fragment key={i}>
            <Elephant e={e} hue={awake ? (i * 37) % 360 : 0} filter={awake ? undefined : 'brightness(.6) saturate(.5)'} />
            {!awake && <div style={{...font, position: 'absolute', left: cx + 18 + 20 * zt, top: cy - 60 - 40 * zt, fontSize: 18 + 14 * zt, color: '#fff', opacity: 1 - zt}}>z</div>}
            {awake && wake < 0.9 && <div style={{...font, position: 'absolute', left: cx - 6, top: cy - 92 - jump, fontSize: 34, color: RED, WebkitTextStroke: '2px #fff', paintOrder: 'stroke fill'}}>!</div>}
          </React.Fragment>
        );
      })}
      <div style={{...mono, position: 'absolute', left: 860, top: 500, fontSize: 30, color: '#fff', background: PLUM, padding: '4px 14px', borderRadius: 10}}>{p < 7 ? '5,000 idle sessions' : 'all 5,000: re-read the catalog'}</div>
      {/* megaphone at the left tusk */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g transform={`translate(${m.tip.x},${m.tip.y}) rotate(${p >= 7 ? -8 * Math.exp(-(p - 7) * 5) : 0})`}>
          <path d="M10,-18 L-150,-62 L-150,98 L10,22 Z" fill="#fff" stroke={PLUM} strokeWidth={7} strokeLinejoin="round" />
          <rect x={0} y={-22} width={34} height={48} rx={8} fill={RED} stroke={PLUM} strokeWidth={6} />
        </g>
        {ringR > 0 && [0, 1, 2].map((k) => { const rr = ringR - k * 160; return rr > 0 && rr < 1500 ? <circle key={k} cx={m.x} cy={m.y} r={rr} fill="none" stroke="#fff" strokeWidth={14 - k * 3} opacity={0.8 * (1 - rr / 1500)} /> : null; })}
      </svg>
    </div>
  );
};

const Shout: React.FC<{p: number}> = ({p}) =>
  p >= 6.9 && p < 7.9 ? (
    <div style={{...font, position: 'absolute', left: 910, top: 150, fontSize: 80, color: '#fff', WebkitTextStroke: `8px ${PLUM}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap', letterSpacing: -1,
      transform: `scale(${boing((p - 6.9) * 3)}) rotate(-4deg)`, transformOrigin: '80% 50%', opacity: 1 - seg(p, 7.7, 7.9)}}>CATALOG CHANGED!</div>
  ) : null;

// ---------- 8-10: the pg_class skyscraper ----------
const FLOOR_H = 44, TX = 905, TW = 230;
const Tower: React.FC<{p: number}> = ({p}) => {
  if (p < 8.1 || p >= 10) return null;
  const n = Math.min(44, Math.floor((p - 8.1) * 16));
  const sway = p > 9.3 ? 4 * Math.sin((p - 9.3) * 22) * seg(p, 9.3, 9.5) : 0;
  const topple = 85 * eIn(seg(p, 9.5, 10));
  const floors: React.ReactNode[] = [];
  for (let k = 0; k < n; k++) {
    const fresh = Math.exp(-((p - 8.1) * 16 - k) * 1.5);
    floors.push(
      <div key={k} style={{position: 'absolute', left: 0, bottom: k * FLOOR_H, width: TW, height: FLOOR_H, boxSizing: 'border-box', background: k % 2 ? '#7d3a8c' : '#6a2c78', border: `3px solid ${PLUM}`,
        display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 10, transform: `scaleX(${1 + 0.2 * fresh})`}}>
        <div style={{...mono, fontSize: 16, color: '#fff', width: 90}}>pg_class</div>
        {[0, 1, 2, 3].map((w) => <div key={w} style={{width: 18, height: 20, background: rnd(k * 4 + w + Math.floor(p * 2)) > 0.4 ? '#ffe27a' : '#3a1a44', borderRadius: 2}} />)}
      </div>,
    );
  }
  return (
    <div style={{position: 'absolute', left: TX, top: H, width: TW, height: 0, transform: `rotate(${topple + sway}deg)`, transformOrigin: `${TW}px 0px`}}>
      <div style={{position: 'absolute', left: 0, bottom: 0, width: TW, height: n * FLOOR_H}}>{floors}</div>
      {n > 4 && <div style={{...font, position: 'absolute', left: -60, bottom: n * FLOOR_H + 10, width: TW + 120, textAlign: 'center', fontSize: 34, color: '#fff', background: RED, borderRadius: 10, padding: '4px 0', border: '4px solid #fff'}}>
        {fmt(Math.pow(10, 2 + n / 8))} rows</div>}
    </div>
  );
};
// stamp marks around the builder (one per half beat)
const BuildStamp: React.FC<{p: number}> = ({p}) => {
  if (p < 8.25 || p >= 9.6) return null;
  const k = Math.floor((p - 8.25) / 0.5), ph = (p - 8.25) % 0.5;
  return <div style={{...mono, position: 'absolute', left: 1180 + (k % 2) * 80, top: 470 - k * 10, fontSize: 30, color: '#fff', background: PLUM, padding: '2px 12px', borderRadius: 8,
    opacity: 1 - ph / 0.5, transform: `translateY(${-60 * ph}px)`}}>CREATE TEMP TABLE</div>;
};

// ---------- 10-12: the multiverse ----------
type Uni = {bg: string; l1: string; l2: string; tag: string};
const UNIS: Uni[] = [
  {bg: 'linear-gradient(180deg, #d9e2ef, #b8c6da)', l1: 'GLOBAL TEMP TABLE', l2: 'defined once. calm.', tag: 'universe 1'},
  {bg: 'linear-gradient(180deg, #ef7de3, #b04fd6)', l1: 'CREATE TEMP TABLE', l2: '×10,000 a minute', tag: 'universe 2'},
  {bg: 'linear-gradient(180deg, #b9f3df, #7fd9c4)', l1: 'ON COMMIT DROP', l2: 'now you see me…', tag: 'universe 3'},
  {bg: 'linear-gradient(180deg, #ffd6b0, #ffad7a)', l1: 'temp_buffers = 8MB', l2: 'a bit tight', tag: 'universe 4'},
];
const PERMS = [[0, 1, 2, 3], [1, 3, 0, 2], [3, 2, 1, 0]];
const PW = 560, PH = 540, PX0 = 800;
const slotXY = (s: number) => ({x: PX0 + (s % 2) * PW, y: s < 2 ? 0 : PH});
const Panel: React.FC<{u: number; p: number; t: number}> = ({u, p, t}) => {
  const U = UNIS[u];
  const ec = {x: 280, y: 290};
  let e: Pose = {x: ec.x - OX, y: ec.y - OY, rot: 0, sx: 1, sy: 1, scale: 0.4};
  let opacity = 1, under: React.ReactNode, over: React.ReactNode;
  if (u === 0) { over = <Bowler />; e = {...e, rot: 1.5 * Math.sin(p * Math.PI)}; }
  if (u === 1) { under = <HoodUnder />; over = <HoodOver />; e = {...e, rot: 8 * Math.sin(p * Math.PI * 4), y: e.y - 14 * Math.abs(Math.sin(p * Math.PI * 4))}; }
  if (u === 2) opacity = Math.floor(p * 4) % 2 ? 0.08 : 1;
  if (u === 3) e = {...e, sx: 0.42 + 0.05 * Math.sin(t * 20), sy: 1.05};
  return (
    <div style={{position: 'absolute', inset: 0, background: U.bg, overflow: 'hidden', border: `6px solid ${PLUM}`, boxSizing: 'border-box'}}>
      {u === 1 && Array.from({length: 12}, (_, i) => {
        const d = (t * 1.6 + rnd(i)) % 1;
        return <div key={i} style={{...mono, position: 'absolute', left: rnd(i + 9) * 480, top: -40 + d * 600, fontSize: 18, color: '#fff', background: PLUM, padding: '2px 8px', borderRadius: 6, transform: `rotate(${d * 200}deg)`}}>tmp_{Math.floor(rnd(i + 50) * 999)}</div>;
      })}
      <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}}>
        <Elephant e={e} opacity={opacity} under={under} over={over} />
      </div>
      {u === 3 && <div style={{position: 'absolute', left: 280 - 95, top: 120, width: 190, height: 340, border: `6px dashed ${PLUM}`, borderRadius: 12}} />}
      <div style={{...mono, position: 'absolute', left: 16, top: 12, fontSize: 22, color: PLUM, background: 'rgba(255,255,255,.75)', padding: '2px 10px', borderRadius: 8}}>{U.tag}</div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center'}}>
        <div style={{...font, fontSize: 40, color: '#fff', WebkitTextStroke: `7px ${PLUM}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>{U.l1}</div>
        <div style={{...font, fontSize: 30, color: PLUM, whiteSpace: 'nowrap'}}>{U.l2}</div>
      </div>
    </div>
  );
};
const Multiverse: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 10 || p >= 12.05) return null;
  const stage = p < 11 ? 0 : p < 11.5 ? 1 : 2;
  const prev = Math.max(0, stage - 1), sw = stage === 0 ? 1 : eOut(seg(p, stage === 1 ? 11 : 11.5, (stage === 1 ? 11 : 11.5) + 0.15));
  return (
    <>
      {[0, 1, 2, 3].map((u) => {
        const a = slotXY(PERMS[prev].indexOf(u)), b = slotXY(PERMS[stage].indexOf(u));
        const x = mix(a.x, b.x, sw), y = mix(a.y, b.y, sw);
        // panels are local boxes: shift the world-coordinate elephant into the panel
        return (
          <div key={u} style={{position: 'absolute', left: x, top: y, width: PW, height: PH}}>
            <PanelBox u={u} p={p} t={t} />
          </div>
        );
      })}
    </>
  );
};
// Panel content is drawn in world coordinates by Elephant; wrap it so (0,0) is the panel corner.
const PanelBox: React.FC<{u: number; p: number; t: number}> = (props) => <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}><Panel {...props} /></div>;

// ---------- 13-16: DISCARD ALL ----------
const LOOT = ['tmp_orders', 'PREPARE q1', 'SET work_mem', 'LISTEN chan', 'advisory lock', 'cached plan', 'tmp_ids', 'SET search_path', 'PREPARE q7', 'tmp_report', 'temp sequence', 'tmp_batch'];
const NOZ = {x: 1170, y: 905};
const Vacuum: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 12.95 || p >= 14.25) return null;
  const swell = 1 + 0.25 * seg(p, 13.7, 14) + 0.05 * Math.sin(t * 60) * seg(p, 13.4, 14);
  const gone = seg(p, 14, 14.25);
  const can = {x: 1790, y: 930};
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 1 - gone}}>
        <path d={`M${can.x - 60},${can.y} C${can.x - 200},${can.y + 140} ${NOZ.x + 200},${NOZ.y + 160} ${NOZ.x + 70},${NOZ.y + 10}`} fill="none" stroke={PLUM} strokeWidth={30} />
        <path d={`M${can.x - 60},${can.y} C${can.x - 200},${can.y + 140} ${NOZ.x + 200},${NOZ.y + 160} ${NOZ.x + 70},${NOZ.y + 10}`} fill="none" stroke="#8a4fd8" strokeWidth={18} strokeDasharray="10 8" />
        <path d={`M${NOZ.x + 80},${NOZ.y - 10} L${NOZ.x - 20},${NOZ.y - 45} L${NOZ.x - 20},${NOZ.y + 45} L${NOZ.x + 80},${NOZ.y + 30} Z`} fill="#555c6e" stroke={PLUM} strokeWidth={7} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', left: can.x - 120, top: can.y - 110, width: 240, height: 180, borderRadius: 40, background: RED, border: `7px solid ${PLUM}`, boxSizing: 'border-box',
        transform: `scale(${swell * (1 - gone)})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{...font, fontSize: 34, lineHeight: 1.0, color: '#fff', textAlign: 'center'}}>DISCARD<br />ALL</div>
      </div>
      {LOOT.map((s, j) => {
        const sx = 860 + rnd(j + 1) * 950, sy = 120 + rnd(j + 2) * 560;
        const ts = 13.15 + j * 0.065, q = eIn(seg(p, ts, ts + 0.3));
        if (q >= 1) return null;
        const pop = boing((p - 12.95) * 4 - j * 0.05);
        const x = mix(sx, NOZ.x - 60, q) + 90 * Math.sin(q * Math.PI) * (j % 2 ? 1 : -1), y = mix(sy, NOZ.y - 20, q);
        return <Chip key={j} s={s} x={x} y={y} r={q * 540 * (j % 2 ? 1 : -1)} c={j} scale={pop * (1 - 0.85 * q)} />;
      })}
    </>
  );
};
const HOLE_ITEMS = Array.from({length: 46}, (_, i) => ({a: rnd(i + 200) * Math.PI * 2, r: 380 + rnd(i + 201) * 700, s: 14 + rnd(i + 202) * 1.3, kind: i % 4, label: [...LOOT, ...MSGS][i % 18]}));
const BlackHole: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 14 || p >= 16.05) return null;
  const R = 190 * eOut(seg(p, 14, 14.3)) * (1 - eIn(seg(p, 15.6, 16)));
  return (
    <>
      {HOLE_ITEMS.map((it, i) => {
        const q = eIn(seg(p, it.s, it.s + 0.7));
        if (q >= 1 || p < 14) return null;
        const r = it.r * (1 - q), a = it.a + q * Math.PI * 3;
        const x = HOLE.x + Math.cos(a) * r, y = HOLE.y + Math.sin(a) * r * 0.75;
        const sc = (1 - q) * boing((p - 14) * 3);
        if (it.kind === 3) return <Elephant key={i} e={at(x, y, 0.08 * sc, a * 57)} hue={i * 40} />;
        return <Chip key={i} s={it.label} x={x - 80} y={y - 20} r={a * 57} c={i} scale={sc} />;
      })}
      <div style={{position: 'absolute', left: HOLE.x - R * 2.2, top: HOLE.y - R * 2.2, width: R * 4.4, height: R * 4.4, borderRadius: '50%',
        background: `repeating-conic-gradient(from ${t * 400}deg, rgba(255,214,120,.65) 0deg 14deg, rgba(255,95,207,.25) 14deg 40deg)`,
        maskImage: 'radial-gradient(circle, transparent 22%, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, transparent 22%, black 30%, transparent 70%)'}} />
      <div style={{position: 'absolute', left: HOLE.x - R, top: HOLE.y - R, width: 2 * R, height: 2 * R, borderRadius: '50%', background: '#0c0410', boxShadow: `0 0 ${R * 0.5}px ${R * 0.15}px #ffb02e`}} />
      {R > 40 && <div style={{...mono, position: 'absolute', left: HOLE.x - 470, top: HOLE.y + R + 30, width: 340, whiteSpace: 'nowrap', textAlign: 'center', fontSize: 40, color: '#fff', background: PLUM, borderRadius: 10, padding: '4px 0'}}>DISCARD ALL;</div>}
    </>
  );
};

// ---------- 16-21: the waterfall, the fall, the lake ----------
const CLIFF = 1350, RIVER_Y = 560;
const River: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 16 || p >= 17.35) return null;
  const strips: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const x = 780 + ((i * 70 + t * 650) % (CLIFF - 780)), y = RIVER_Y - 8 + (i % 3) * 18;
    strips.push(<div key={'r' + i} style={{position: 'absolute', left: x, top: y, width: 60 + rnd(i) * 50, height: 10, borderRadius: 5, background: i % 2 ? '#fff' : '#bfefff'}} />);
  }
  for (let i = 0; i < 24; i++) {
    const y = RIVER_Y + ((i * 47 + t * 1400) % (H - RIVER_Y + 60)) - 30, x = CLIFF + 10 + rnd(i + 3) * 120;
    strips.push(<div key={'w' + i} style={{position: 'absolute', left: x, top: y, width: 10, height: 70 + rnd(i) * 60, borderRadius: 5, background: i % 2 ? '#fff' : '#bfefff'}} />);
  }
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <path d={`M760,${RIVER_Y + 40} L${CLIFF},${RIVER_Y + 40} L${CLIFF},${H} L760,${H} Z`} fill={PLUM} opacity={0.35} />
        <rect x={760} y={RIVER_Y - 18} width={CLIFF - 760} height={58} fill="#42a8c8" />
        <rect x={CLIFF} y={RIVER_Y - 18} width={140} height={H} fill="#42a8c8" opacity={0.85} />
      </svg>
      {strips}
      <div style={{...font, position: 'absolute', left: CLIFF + 170, top: 640, fontSize: 44, lineHeight: 1.0, color: '#fff', background: PLUM, padding: '8px 16px', borderRadius: 12, transform: 'rotate(-4deg)'}}>performance<br />cliff</div>
    </>
  );
};
const Fall: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 17.25 || p >= 19.1) return null;
  // scroll distance: fast until the chute opens on 18, slower after
  const d = (p < 18 ? (p - 17.25) * 2600 : 0.75 * 2600 + (p - 18) * 900) * bt.b * 2;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const y = ((i * 130 - d) % 2080 + 2080) % 2080 - 300;
    out.push(<div key={'l' + i} style={{position: 'absolute', left: 1600 + rnd(i) * 60, top: y, width: 330, height: 14, background: PLUM, opacity: 0.45, borderRadius: 7}} />);
  }
  for (let i = 0; i < 22; i++) {
    const y = ((i * 97 - d * 0.35) % 1300 + 1300) % 1300 - 150;
    out.push(<div key={'w' + i} style={{position: 'absolute', left: 1240 + rnd(i + 7) * 300, top: y, width: 10, height: 120, borderRadius: 5, background: '#fff', opacity: 0.7}} />);
  }
  for (let i = 0; i < 6; i++) {
    const y = ((i * 260 - d * 0.6) % 1600 + 1600) % 1600 - 250, r = 90 + rnd(i) * 60;
    out.push(<div key={'m' + i} style={{position: 'absolute', left: 900 + rnd(i + 11) * 800, top: y, width: 2 * r, height: r, borderRadius: '50%', background: '#fff', opacity: 0.35}} />);
  }
  const q = seg(p, 17.25, 19);
  const tps = 48000 * Math.pow(12 / 48000, Math.pow(q, 0.8));
  return (
    <>
      <div style={{position: 'absolute', left: 1220, top: 0, width: 360, height: H, background: '#42a8c8', opacity: 0.55}} />
      <div style={{position: 'absolute', left: 1600, top: 0, width: 320, height: H, background: '#7d3a8c', opacity: 0.35}} />
      {out}
      <div style={{position: 'absolute', left: 850, top: 90, padding: '10px 18px', background: '#fff', border: `5px solid ${PLUM}`, borderRadius: 14, boxShadow: `0 7px 0 ${PLUM}55`}}>
        <div style={{...mono, fontSize: 28, color: PLUM}}>TPS</div>
        <div style={{...mono, fontSize: 60, lineHeight: 1.0, color: tps < 1000 ? RED : PLUM, width: 260}}>{fmt(tps)}</div>
      </div>
    </>
  );
};
const Barrel: React.FC<{e: Pose; p: number}> = ({e, p}) => {
  const c = cOf(e);
  let x = c.x, y = c.y + 80 * e.scale / 0.3 * 0.3 + 40, r = e.rot;
  if (p >= 18) { const k = (p - 18) * bt.b; y += 1800 * k * k + 200 * k; r += 300 * k; x += 80 * k; }
  if (y > H + 200) return null;
  return (
    <div style={{position: 'absolute', left: x - 150, top: y - 90, width: 300, height: 190, borderRadius: 40, background: '#8a5a2b', border: `6px solid ${PLUM}`, boxSizing: 'border-box', transform: `rotate(${r}deg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {[30, 130].map((yy) => <div key={yy} style={{position: 'absolute', left: 0, right: 0, top: yy, height: 14, background: '#555c6e'}} />)}
      <div style={{...mono, fontSize: 28, color: '#fff', background: PLUM, padding: '0 8px', borderRadius: 6}}>temp_buffers</div>
    </div>
  );
};
const Chute: React.FC<{e: Pose; p: number}> = ({e, p}) => {
  const c = cOf(e), o = eOut(seg(p, 18, 18.25)) * (1 - seg(p, 19, 19.4));
  if (o <= 0) return null;
  const w = 520 * o, top = c.y - 380 - (p >= 19 ? -300 * seg(p, 19, 19.4) : 0);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`rotate(${e.rot} ${c.x} ${c.y})`}>
        <line x1={c.x - w / 2} y1={top} x2={c.x - 60} y2={c.y - 60} stroke={PLUM} strokeWidth={4} />
        <line x1={c.x + w / 2} y1={top} x2={c.x + 60} y2={c.y - 60} stroke={PLUM} strokeWidth={4} />
        <path d={`M${c.x - w / 2},${top} Q${c.x},${top - 260 * o} ${c.x + w / 2},${top} Z`} fill="#fff" stroke={PLUM} strokeWidth={7} />
        {[-0.25, 0, 0.25].map((k) => <line key={k} x1={c.x + k * w} y1={top} x2={c.x + k * w * 0.8} y2={top - 180 * o} stroke={PLUM} strokeWidth={4} />)}
        <line x1={c.x - w * 0.45} y1={top - 70 * o} x2={c.x + w * 0.45} y2={top - 70 * o} stroke={PLUM} strokeWidth={4} />
        <text x={c.x} y={top - 20} textAnchor="middle" style={{...mono, fontSize: 30, fill: PLUM}}>tmp_chute</text>
      </g>
    </svg>
  );
};
const Lake: React.FC<{p: number; t: number; e: Pose}> = ({p, t, e}) => {
  if (p < 18.6 || p >= 21.1) return null;
  const rise = eOut(seg(p, 18.6, 18.9)), o = 1 - seg(p, 20.7, 21.1);
  const top = H - 180 * rise;
  const wave = Array.from({length: 25}, (_, i) => `${i * 80},${top + 10 * Math.sin(i * 0.8 + t * 7)}`).join(' L');
  const c = cOf(e);
  const splash = p >= 19 && p < 19.9 ? (p - 19) * bt.b : -1;
  const dropsFrom = p >= 20 && p < 20.8 ? (p - 20) * bt.b : -1;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      {p >= 19 && p < 20.1 && <div style={{position: 'absolute', left: c.x - 150, top: top - 40, width: 300, height: 90, borderRadius: '50%', border: '16px solid #ff7124', boxSizing: 'border-box',
        background: 'transparent', transform: `translateY(${6 * Math.sin(t * 6)}px)`}} />}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}><path d={`M${wave} L${W},${H} L0,${H} Z`} fill="#2f86b8" opacity={0.92} /></svg>
      {p >= 19 && p < 20.1 && <div style={{...mono, position: 'absolute', left: c.x - 70, top: top + 30, fontSize: 22, color: '#fff'}}>work_mem</div>}
      <div style={{...mono, position: 'absolute', left: 860, top: top + 60, fontSize: 36, color: '#fff'}}>base/pgsql_tmp/</div>
      {splash >= 0 && Array.from({length: 36}, (_, i) => {
        const a = -Math.PI / 2 + (rnd(i + 70) - 0.5) * 2.2, v = 500 + 900 * rnd(i + 71);
        const x = c.x + Math.cos(a) * v * splash, y = top + Math.sin(a) * v * splash + 2200 * splash * splash;
        const r = 8 + 12 * rnd(i + 72);
        return y < top + 30 ? <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r * 1.3, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#bfefff', border: '3px solid #2f86b8'}} /> : null;
      })}
      {dropsFrom >= 0 && Array.from({length: 14}, (_, i) => {
        const pe = cOf(pose(20 + (i % 7) * 0.08)), dd = dropsFrom - (i % 7) * 0.08 * bt.b;
        if (dd < 0) return null;
        return <div key={'d' + i} style={{position: 'absolute', left: pe.x + (rnd(i) - 0.5) * 200, top: pe.y + 100 + 1500 * dd * dd, width: 14, height: 20, borderRadius: '50%', background: '#bfefff', border: '3px solid #2f86b8'}} />;
      })}
    </div>
  );
};
const Prompt: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 19.9 || p >= 21.2) return null;
  const cur = Math.floor(t * 4) % 2 === 0;
  return <div style={{...mono, position: 'absolute', left: 860, top: 590, fontSize: 38, color: '#fff', background: TERM, padding: '6px 16px', borderRadius: 10, border: '3px solid #fff'}}>
    postgres=# {typed('TRUNCATE frame;', p, 20, 20.75)}{cur ? '█' : ' '}</div>;
};

// ---------- Michael's deck chair (exactly as Crazy5) ----------
const CX = 1700, CS = 0.92;
const Board: React.FC<{p: number}> = ({p}) => {
  const a = 180 * ease(seg(p, 24, 24.31)); // 0.32 s
  const back = a > 90;
  const lines: [string, number, boolean][] = back ? [["Michael's seat:", 36, false], ['ON COMMIT', 46, true], ['PRESERVE ROWS', 46, true]] : [['RESERVED', 32, false], ['Michael', 76, false], ['on vacation', 34, false]];
  return (
    <div style={{position: 'absolute', left: 150 - 235, top: -390, width: 470, transform: `scaleX(${Math.max(0.02, Math.abs(Math.cos((a * Math.PI) / 180)))})`}}>
      <div style={{background: '#fff', border: `6px solid ${PLUM}`, borderRadius: 16, padding: '12px 8px 14px', textAlign: 'center', boxShadow: `0 8px 0 ${PLUM}55`}}>
        {lines.map(([s, size, sql], i) => <div key={i} style={{...(sql ? mono : font), fontSize: size, lineHeight: sql ? 1.2 : 1.08, color: PLUM, letterSpacing: sql ? 0 : size < 40 ? 1.5 : -1, whiteSpace: 'nowrap'}}>{s}</div>)}
      </div>
    </div>
  );
};
const Chair: React.FC<{p: number; dx: number}> = ({p, dx}) => {
  const st = (s: number, amp: number) => (p >= s ? amp * Math.exp(-(p - s) * bt.b * 4) * Math.sin((p - s) * bt.b * 22) : 0);
  const wob = st(24, 4);
  const stripes = ['#ff5fcf', '#fff', '#42a8c8', '#fff', '#ff5fcf', '#fff', '#42a8c8'];
  return (
    <div style={{position: 'absolute', left: CX - 150 + dx, top: H - 400, width: 300, height: 400, transform: `rotate(${wob}deg) scale(${CS})`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', left: 142, top: -230, width: 16, height: 260, background: '#b9865a', border: `4px solid ${PLUM}`, borderRadius: 6}} />
      <Board p={p} />
      <svg width={360} height={400} viewBox="0 0 360 400" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><clipPath id="sling"><path d="M70,40 L200,40 L250,260 L120,260 Z" /></clipPath></defs>
        <g clipPath="url(#sling)">{stripes.map((c, i) => <rect key={i} x={60 + i * 30} y={30} width={30} height={240} fill={c} transform="skewX(12)" />)}</g>
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
// on stage in the intro (out at story 1.8-2.1) and back for the finale (21.6-22.1)
const chairDX = (p: number) => (p < 2.1 ? 600 * eIn(seg(p, 1.8, 2.1)) : p < 21.6 ? 600 : 600 * (1 - eOut(seg(p, 21.6, 22.1))));

// ---------- (v6a's postcard, unused in v7) ----------
const CARD = {x: 1690, y: 865};
const Postcard: React.FC<{p: number; t: number}> = ({p, t}) => {
  if (p < 21) return null;
  const out: React.ReactNode[] = [];
  if (p < 22.1) {
    const q = seg(p, 21, 22);
    const x = mix(-150, CARD.x, q), y = mix(140, CARD.y, eIn(q)) + 70 * Math.sin(q * Math.PI * 3), dy = 70 * 3 * Math.PI * Math.cos(q * Math.PI * 3) / 1800;
    const ang = Math.atan2(dy + 0.3, 1) * 57;
    out.push(
      <svg key="plane" width={240} height={140} viewBox="-120 -70 240 140" style={{position: 'absolute', left: x - 120, top: y - 70, transform: `rotate(${ang}deg) scale(${1 - 0.4 * seg(p, 21.9, 22.1)})`, opacity: 1 - seg(p, 21.95, 22.1)}}>
        <path d="M110,0 L-110,-55 L-60,0 Z" fill="#fff" stroke={PLUM} strokeWidth={6} strokeLinejoin="round" />
        <path d="M110,0 L-110,55 L-60,0 Z" fill="#f3d6ef" stroke={PLUM} strokeWidth={6} strokeLinejoin="round" />
      </svg>,
    );
  }
  if (p >= 21.95) {
    const u = (p - 21.95) * 3;
    const s = boing(u);
    const stamp = p >= 24 ? (p - 24) * bt.b : -1;
    const stampS = stamp < 0 ? 0 : stamp < 0.07 ? mix(2.4, 1, stamp / 0.07) : 1;
    const jolt = stamp >= 0 ? 6 * Math.exp(-stamp * 18) * Math.sin(stamp * 90) : 0;
    out.push(
      <div key="card" style={{position: 'absolute', left: CARD.x - 210, top: CARD.y - 145, width: 420, height: 290, transform: `scale(${s}) rotate(${3 + jolt * 0.3}deg) translateY(${jolt}px)`}}>
        <div style={{position: 'absolute', inset: 0, background: '#fffaf2', border: `6px solid ${PLUM}`, borderRadius: 14, boxShadow: `0 9px 0 ${PLUM}55`}} />
        <svg width={110} height={120} style={{position: 'absolute', right: 18, top: 16}}>
          <rect x={4} y={4} width={100} height={110} fill="#ffe8b0" stroke={PLUM} strokeWidth={4} strokeDasharray="8 5" />
          <circle cx={54} cy={44} r={20} fill="#ffcc4d" stroke={PLUM} strokeWidth={4} />
          <path d="M8,96 Q54,70 100,96 L100,112 L8,112 Z" fill="#42a8c8" />
        </svg>
        <div style={{...font, position: 'absolute', left: 26, top: 30, fontSize: 64, color: PLUM, letterSpacing: -1}}>Michael</div>
        <div style={{...font, position: 'absolute', left: 28, top: 108, fontSize: 38, color: PLUM}}>on vacation</div>
        {stamp >= 0 && (
          <div style={{position: 'absolute', left: 26, top: 160, width: 368, padding: '4px 0 6px', textAlign: 'center', border: `7px solid ${RED}`, borderRadius: 12, color: RED,
            transform: `rotate(-6deg) scale(${stampS})`, opacity: 0.93, background: 'rgba(255,250,242,.55)'}}>
            <div style={{...font, fontSize: 38, whiteSpace: 'nowrap', lineHeight: 1.08}}>NOT TEMPORARY</div>
            <div style={{...font, fontSize: 32, lineHeight: 1.05}}>back soon!</div>
          </div>
        )}
      </div>,
    );
  }
  return <>{out}</>;
};

// ---------- the action layer (everything that lives inside the frame "table") ----------
const zoomOut = (p: number) => (p >= 8.5 && p < 10 ? 1 - 0.42 * ease(seg(p, 8.5, 9.4)) : 1);
const Action: React.FC<{t: number}> = ({t}) => {
  const p = beatPos(t);
  const e = pose(p);
  const z = zoomOut(p);
  let main: React.ReactNode = null;
  if (inP(p, 1, 2)) main = <Mosaic e={HOME} u={seg(p, 1, 2)} />;
  else if (inP(p, 23, 24)) main = <Mosaic e={HOME} u={seg(p, 23, 24)} />;
  else if (!e.hidden) {
    const over = inP(p, 8, 10) ? <HardHat /> : undefined;
    main = <Elephant e={e} over={over} />;
  }
  return (
    <>
      <PinkRows p={p} />
      <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: `${TX + TW / 2}px ${H}px`}}>
        <Flood p={p} t={t} />
        <Sessions p={p} t={t} />
        <Tower p={p} />
        <River p={p} t={t} />
        <Fall p={p} t={t} />
        <BlackHole p={p} t={t} />
        {main}
        <Shout p={p} />
        {inP(p, 16, 19) && <Barrel e={e} p={p} />}
        {inP(p, 18, 19.4) && <Chute e={e} p={p} />}
        <Lake p={p} t={t} e={e} />
        <Sinval p={p} t={t} />
        <BuildStamp p={p} />
        <Vacuum p={p} t={t} />
        <Multiverse p={p} t={t} />
        <Prompt p={p} t={t} />
      </div>
    </>
  );
};

// ---------- title layer ----------
const HOST_X = [110, 470];
const Photo: React.FC<{src: string; name: string; x: number; p: number; i: number; boom: {s: number; r: number}}> = ({src, name, x, p, i, boom}) => {
  const s0 = 1.6 + i * 0.25, q = seg(p, s0, s0 + 0.3);
  if (q <= 0) return null;
  const ang = 90 * (1 - eOut(q));
  return (
    <div style={{position: 'absolute', left: x, top: 660, width: 330, transform: `perspective(1200px) rotateY(${ang}deg) scale(${boom.s}) rotate(${boom.r}deg)`, transformOrigin: '50% 55%'}}>
      <Img src={staticFile(src)} style={{width: 330, height: 248, objectFit: 'cover', borderRadius: 14, border: '5px solid #fff', boxShadow: '0 10px 0 rgba(61,15,69,.3)'}} />
      <div style={{...font, fontWeight: 700, fontSize: 30, color: PLUM, marginTop: 12, whiteSpace: 'nowrap', background: '#fff', borderRadius: 10, padding: '2px 12px', display: 'inline-block', boxShadow: '0 4px 0 rgba(61,15,69,.25)'}}>{name}</div>
    </div>
  );
};
const Bubble: React.FC<{p: number; x: number; from: number; to: number; text: string}> = ({p, x, from, to, text}) => {
  if (!SHOW_BUBBLES || p < from || p > to) return null;
  return (
    <div style={{position: 'absolute', left: x, top: 578, transform: `scale(${boing((p - from) * 3) * (1 - seg(p, to - 0.2, to))})`, transformOrigin: '30px 70px'}}>
      <div style={{...font, fontWeight: 700, fontSize: 34, color: PLUM, background: '#fff', border: `4px solid ${PLUM}`, borderRadius: 16, padding: '6px 14px', whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};
const TitleLayer: React.FC<{p: number; t: number; booms: {s: number; r: number}[]}> = ({p, t, booms}) => {
  const cur = Math.floor(t * 4) % 2 === 0;
  const wmQ = seg(p, 0.2, 0.6);
  const l1 = TITLE[0], n1 = l1.length;
  const per = 0.75 / n1;
  const band = boing((p - 5) * 2.5);
  const n2 = Math.floor(TITLE[1].length * seg(p, 5.15, 5.6));
  return (
    <AbsoluteFill>
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560, clipPath: `inset(0 ${100 - wmQ * 100}% 0 0)`, filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
      <div style={{position: 'absolute', left: 110, top: 240}}>
        <div style={{...font, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap', textShadow: `0 7px 0 ${PLUM}66, 0 0 40px rgba(120,20,120,.3)`, height: 150}}>
          {l1.split('').map((ch, i) => {
            const u = (p - 1 - i * per) / per;
            if (u < 0) return null;
            const s = u < 1 ? mix(1.7, 1, eOut(u)) : 1;
            return <span key={i} style={{display: 'inline-block', transform: `scale(${s})`, transformOrigin: '50% 80%', whiteSpace: 'pre'}}>{ch}</span>;
          })}
          {p >= 0.9 && p < 2.2 && cur && <span style={{display: 'inline-block', width: 70, height: 120, background: '#fff', marginLeft: 8, verticalAlign: '-8px'}} />}
        </div>
        <div style={{position: 'relative', marginTop: 26, height: 150}}>
          {p >= 5 && (
            <div style={{position: 'relative', display: 'inline-block', height: 150}}>
              <div style={{position: 'absolute', left: -24, right: -36, top: 0, bottom: 0, background: PLUM, borderRadius: 18, transform: `scaleY(${band}) skewX(-6deg)`, transformOrigin: '50% 0%', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
              <div style={{...mono, position: 'relative', paddingLeft: 14, paddingRight: 6, paddingTop: 4, fontSize: 104, lineHeight: '142px', color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap'}}>
                <span>{TITLE[1].slice(0, n2)}</span><span style={{opacity: 0}}>{TITLE[1].slice(n2)}</span>
                {p < 6.2 && cur && <span style={{position: 'absolute', top: 22, width: 56, height: 100, background: '#fff', marginLeft: 6}} />}
              </div>
            </div>
          )}
        </div>
      </div>
      {HOSTS.map((h, i) => <Photo key={h.name} src={h.photo ?? ''} name={h.name} x={HOST_X[i] ?? 110 + i * 360} p={p} i={i} boom={booms[i] ?? {s: 1, r: 0}} />)}
      <Bubble p={p} x={115} from={10.2} to={12} text="Oracle GTTs: free!" />
      <Bubble p={p} x={505} from={10.6} to={12} text="Postgres: pg_class bloat!" />
    </AbsoluteFill>
  );
};

// ---------- VHS rewind overlay (12-13) and OSD ----------
const Rewind: React.FC<{p: number; f: number}> = ({p, f}) => {
  const rw = inP(p, 12, 13), play = inP(p, 13, 13.6);
  if (!rw && !play) return null;
  return (
    <>
      {rw && <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 3px, transparent 3px 6px)'}} />}
      {rw && [0, 1].map((k) => { const y = ((f * 37 + k * 500) % 1300) - 100; return <div key={k} style={{position: 'absolute', left: 0, top: y, width: W, height: 34 + 20 * k, background: 'rgba(255,255,255,.35)', filter: 'blur(3px)'}} />; })}
      <div style={{position: 'absolute', right: 60, top: 40, display: 'flex', alignItems: 'center', gap: 14, opacity: play ? 1 - seg(p, 13.3, 13.6) : 1}}>
        <svg width={rw ? 110 : 56} height={64}>{rw ? <><path d="M54,4 L4,32 L54,60 Z" fill="#fff" /><path d="M106,4 L56,32 L106,60 Z" fill="#fff" /></> : <path d="M6,4 L54,32 L6,60 Z" fill="#fff" />}</svg>
        <div style={{...mono, fontSize: 60, color: '#fff', textShadow: '3px 3px 0 #000'}}>{rw ? 'REWIND' : 'PLAY'}</div>
      </div>
    </>
  );
};

export const C7_SECONDS = 27;
// real-beat hits: inverts on these scene changes; the host tiles boom harder on all BIG ones
const INVERT_REAL = [4, 14, 20, 28, 32, 38, 48];
const BIG = [4, 10, 12, 14, 16, 20, 24, 26, 28, 32, 34, 38, 40, 42, 44, 48];
const tReal = (k: number) => bt.t0 + k * bt.b;
export const CardCrazy7: React.FC = () => {
  useFonts();
  useMono();
  const lv = useLevels('a-shades-ep196');
  const {f, t: tr} = useT();
  // story time: real time before beat 0, then half speed
  const t = tr < bt.t0 ? tr : bt.t0 + (tr - bt.t0) / 2;
  const p = beatPos(t);
  const rq = (tr - bt.t0) / bt.b, k = Math.floor(rq);
  const booms = [0, 1].map((i) => {
    if (k < 0) return {s: 1, r: 0};
    const dt = tr - tReal(k), big = BIG.includes(k);
    const kf = Math.round(tReal(k) * FPS);
    const lvl = lv ? Math.max(...[0, 1, 2].map((d) => lv.rms[kf + d] ?? 0)) : 1;
    const env = dt < 0.03 ? dt / 0.03 : Math.exp(-(dt - 0.03) * 7);
    const amp = (big ? 0.2 : 0.1) * (0.55 + 0.45 * lvl) * env;
    return {s: 1 + amp, r: (i % 2 ? 1 : -1) * (k % 2 ? 1 : -1) * (big ? 4 : 2.5) * env};
  });
  // action time: rewinds beats 12 -> 8 at 4x during 12-13
  const tA = inP(p, 12, 13) ? B(12) - (t - B(12)) * 4 : t;
  // on the frame nearest the audio hit (the RMS peaks sit ~0.4 frame after the beat grid), 2 frames
  const inv = INVERT_REAL.some((s) => { const kk = Math.round(tReal(s) * FPS + 0.4); return f >= kk && f < kk + 2; });
  // 3D flips of the whole frame into the multiverse and the waterfall
  const flip = [10, 16].reduce((a, s) => (inP(p, s, s + 0.3) ? -90 * (1 - eOut(seg(p, s, s + 0.3))) : a), 0);
  const jitter = inP(p, 12, 13) ? (rnd(f) - 0.5) * 24 : 0;
  const shred = inP(p, 21, 22.2);
  const border = p >= 2 && p < 24.5 ? 16 * beatPulse(bt, tr, 1, 4) : 0; // every REAL beat
  const wrapStyle: React.CSSProperties = {
    transform: `perspective(2400px) rotateY(${flip}deg) translateX(${jitter}px)`,
    filter: [inv ? 'invert(1) hue-rotate(180deg)' : '', inP(p, 12, 13) ? 'saturate(.6) contrast(1.25)' : ''].filter(Boolean).join(' ') || undefined,
  };
  const NS = 14, sw = W / NS;
  return (
    <AbsoluteFill style={{background: TERM, overflow: 'hidden'}}>
      <Terminal p={p} t={t} />
      {!shred && <AbsoluteFill style={wrapStyle}><Action t={tA} /></AbsoluteFill>}
      {shred && Array.from({length: NS}, (_, i) => {
        const d = Math.max(0, (p - 21.08 - (i % 2) * 0.05 - rnd(i) * 0.12) * bt.b);
        const y = 1400 * d * d + 120 * d, r = (rnd(i + 5) - 0.5) * 40 * d * 3, gap = (i - NS / 2) * 10 * seg(p, 21, 21.12);
        if (y > H + 200) return null;
        return (
          <AbsoluteFill key={i} style={{clipPath: `inset(0 ${W - (i + 1) * sw}px 0 ${i * sw}px)`, transform: `translate(${gap}px, ${y}px) rotate(${r}deg)`, transformOrigin: `${(i + 0.5) * sw}px 0px`}}>
            <Action t={tA} />
          </AbsoluteFill>
        );
      })}
      <AbsoluteFill style={{boxShadow: `inset 0 0 0 ${border}px ${PLUM}`}} />
      {((p >= 0.2 && p < 2.1) || p >= 21.6) && <Chair p={p} dx={chairDX(p)} />}
      <Rewind p={p} f={f} />
      <TitleLayer p={p} t={t} booms={booms} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};
