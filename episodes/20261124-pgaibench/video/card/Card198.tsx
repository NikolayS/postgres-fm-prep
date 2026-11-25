import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile} from 'remotion';
import {ELE, FPS, Grain, H, HOSTS, Levels, Sparkle, TITLE, useFonts, useLevels, useT, W} from './common';

// Ep 198 title card ("Can AI safely change production Postgres?"). A copy of the ep 196 CardCrazy9
// and the ep 197 Card197 (same world, same clock, same motion, plum band title as in ep 197);
// Michael was away, so his deck chair and "RESERVED" sign from ep 196 are back. The gags follow
// the ep 198 topics. 14 s on the same intro cue (a-shades-long2-pad.wav, levels
// a-shades-levels.json); final hit on beat 24 (~12.92 s); compose --card 13.
//
// Beats:
//  0      the plum band "production Postgres?" slams in (Michael's chair + sign already there)
//  1      "Can AI safely change" drops on
//  2-2.5  Kirk (left), Nik (right) boom in; a robot arm swings in over a big red RESTART button ("DO NOT RESTART")
//  3-7    the arm presses the button on every beat, the lights blink, the elephant power-cycles
//         (spins); label "Restarted anyway in 5 of 5 runs", one pip lights per press
//  7      RESTART! the elephant is launched
//  8      night; it lands and a cyan clone pops out of it: "Rehearse on a clone"
//  9-14   13 harm bombs rain down: one per beat (6) hits the clone and fizzles, 7 hit the live
//         elephant; label "Clone alone stopped 6 of 13 harms", one pip per harm (green = stopped,
//         orange = hit); 14: "$0 AI cost" sticker
//  15     day; "Analyst · Auditor · Actor"; the clone vanishes, the elephant hops to the middle
//  16     the Analyst's proposal "restart node": the Auditor stamp slams REJECTED; meter
//         "live harms: 13"
//  17     next proposal "safe changes 377 of 378": APPROVED
//  18     the meter crashes 13 -> 1 (green)
//  19     the Actor arm ticks the approved proposal and carries it away
//  20-21  "ROLLBACK;": everything but the title, the host tiles and the chair shreds away
//  22     clean frame (rewritten row by row), the elephant pops back up; 23 freeze, only the sign wobbles
//  24     the sign flips to "Michael's seat: AUDITOR", the sunglasses glint; hold
// On-screen facts (ep 198 study): acting alone, the top model restarted nodes against an explicit
// "do not restart" rule in 5 of 5 runs; testing on a clone alone stopped 6 of 13 harms at zero AI
// cost; with AAA, live harms went from 13 to 1, and 377 of 378 safe changes were still approved.
// Nothing ever touches Michael's chair; no text in the bottom 180 px (all text ends by y 900).

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const NIGHT_BG = 'linear-gradient(180deg, #2a0f4a 0%, #4a1b72 70%, #6a2a8a 100%)';
const PLUM = '#3d0f45';
const TERM = '#22072a';
const RED = '#d93d1b';
const GREEN = '#1f9a3a';
const CYAN = '#4fe3ff';
const STEEL = '#cfd3dc';
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
const Elephant: React.FC<{e: Pose; stomp?: number; filter?: string; hue?: number; opacity?: number}> = ({e, stomp = 0, filter, hue = 0, opacity = 1}) =>
  e.hidden ? null : (
    <div style={{position: 'absolute', left: EX + e.x, top: EY + e.y, width: EW, height: EH, transform: `rotate(${e.rot}deg) scale(${e.scale})`, transformOrigin: '50% 62%', opacity}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.07 * stomp}, ${1 - 0.1 * stomp})`, transformOrigin: '50% 95%'}}>
        <Img src={staticFile('elephant.png')} style={{position: 'absolute', left: 0, top: 0, width: EW, height: EH,
          filter: [hue ? `hue-rotate(${hue}deg) saturate(1.7)` : '', filter ?? ''].join(' ').trim() || undefined,
          maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}} />
      </div>
    </div>
  );

const HOME = {x: 960, y: 830, s: 0.68};
const PROD = {x: 880, y: 850, s: 0.6};
const CLONE = {x: 1160, y: 850, s: 0.6};
const MID = {x: 1010, y: 830, s: 0.68};

// ---------- act 1: the robot arm and the RESTART button ----------
const PRESSES = [3, 4, 5, 6, 7];
const BTN = {x: 1250, top: 790}; // dome base centre; the dome top (press point) is ~60 px higher
const pressed = (q: number) => PRESSES.reduce((a, k) => a + (inP(q, k - 0.04, k + 0.22) ? 1 : 0), 0) > 0;
const RestartButton: React.FC<{q: number}> = ({q}) => {
  if (q >= 8.6) return null;
  const sq = pressed(q) ? 0.35 : 1;
  const o = 1 - seg(q, 8, 8.5);
  const w = 240;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <ellipse cx={BTN.x} cy={BTN.top} rx={100} ry={64 * sq} fill={RED} stroke={PLUM} strokeWidth={8} />
        <ellipse cx={BTN.x - 30} cy={BTN.top - 30 * sq} rx={30} ry={12 * sq} fill="#fff" opacity={0.5} />
        <rect x={BTN.x - w / 2} y={BTN.top} width={w} height={H - BTN.top + 20} rx={14} fill="#ffcc4d" stroke={PLUM} strokeWidth={8} />
      </svg>
      {/* the rule, on the pedestal: ends by y 890 */}
      <div style={{...font, position: 'absolute', left: BTN.x - w / 2 + 12, top: BTN.top + 12, width: w - 24, height: 84, background: PLUM, borderRadius: 8,
        color: '#ffcc4d', fontSize: 34, lineHeight: '40px', textAlign: 'center', paddingTop: 2, letterSpacing: 1}}>DO NOT<br />RESTART</div>
    </div>
  );
};
// Robot arm: fingertip at `tip`, the arm runs back along `dir` (off screen). tag: text on the forearm.
const Arm: React.FC<{tip: {x: number; y: number}; from: {x: number; y: number}; tag: string; led: string}> = ({tip, from, tag, led}) => {
  const dx = tip.x - from.x, dy = tip.y - from.y;
  const phi = (-Math.atan2(dx, dy) * 180) / Math.PI;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${tip.x},${tip.y}) rotate(${phi})`} stroke={PLUM} strokeWidth={7} strokeLinejoin="round">
        <rect x={-40} y={-1700} width={80} height={1500} fill={STEEL} />
        {[-420, -760].map((y) => <circle key={y} cx={0} cy={y} r={52} fill="#9aa0ad" />)}
        <rect x={-62} y={-212} width={124} height={44} rx={10} fill="#9aa0ad" />
        <circle cx={0} cy={-190} r={11} fill={led} strokeWidth={4} />
        <rect x={-58} y={-172} width={116} height={104} rx={22} fill={STEEL} />
        <rect x={-50} y={-86} width={26} height={44} rx={12} fill={STEEL} />
        <rect x={24} y={-86} width={26} height={44} rx={12} fill={STEEL} />
        <rect x={-15} y={-100} width={30} height={100} rx={15} fill="#fff" />
        <text x={0} y={-122} textAnchor="middle" dominantBaseline="central" fill={PLUM} stroke="none" style={{...font, fontSize: tag.length > 3 ? 30 : 46, letterSpacing: 1}}>{tag}</text>
      </g>
    </svg>
  );
};
// act 1: from far up-left onto the dome; act 3: onto the approved proposal
const ARM1_FROM = {x: 1010, y: -260};
const ARM1_TIP = {x: BTN.x, y: BTN.top - 58};
const HOVER = 0.88;
const arm1Ext = (q: number) => {
  if (q < 2.3 || q >= 8) return -1;
  if (q < 2.9) return HOVER * eOut(seg(q, 2.3, 2.9));
  if (q >= 7.25) return HOVER * (1 - eIn(seg(q, 7.25, 7.9)));
  const k = Math.round(q);
  const d = q - k;
  // down onto the beat, back up after it
  if (PRESSES.includes(k) && d > -0.2 && d < 0.35) return d < 0 ? mix(HOVER, 1, eIn(seg(d, -0.2, 0))) : mix(1, HOVER, eOut(seg(d, 0, 0.35)));
  return HOVER;
};
// fully retracted: a bit further back than `from`, off screen
const back = (from: {x: number; y: number}, tip: {x: number; y: number}) => ({x: from.x - (tip.x - from.x) * 0.2, y: from.y - (tip.y - from.y) * 0.2});
const extTip = (from: {x: number; y: number}, tip: {x: number; y: number}, e: number) => ({x: mix(from.x, tip.x, e), y: mix(from.y, tip.y, e)});

// ---------- act 2: the clone, the harm bombs ----------
const CATCH = [9, 10, 11, 12, 13, 14]; // 6 stopped on the clone
const PASS = [9.5, 10.5, 11.5, 12.5, 13.5, 14.25, 14.75]; // 7 reach the live elephant
const BOMBS = [...CATCH.map((b, i) => ({b, clone: true, x: CLONE.x - 40 + 120 * rnd(i + 40), y: 610 + 40 * rnd(i + 60)})),
  ...PASS.map((b, i) => ({b, clone: false, x: PROD.x - 20 + 80 * rnd(i + 80), y: 640 + 40 * rnd(i + 90)}))]; // puffs stay clear of the right tile's face (Nik)
const FALL = 0.5;
const Bomb: React.FC<{x: number; y: number; r: number; t: number}> = ({x, y, r, t}) => (
  <svg width={160} height={180} viewBox="-80 -100 160 180" style={{position: 'absolute', left: x - 80, top: y - 100, transform: `rotate(${r}deg)`, overflow: 'visible'}}>
    <path d="M18,-38 Q34,-70 56,-74" stroke="#7a5a3a" strokeWidth={7} fill="none" strokeLinecap="round" />
    <circle cx={0} cy={0} r={42} fill="#1d1420" stroke="#fff" strokeWidth={5} />
    <rect x={-14} y={-52} width={28} height={16} rx={4} fill="#55465a" stroke="#fff" strokeWidth={4} />
    <circle cx={-14} cy={-14} r={10} fill="#fff" opacity={0.5} />
    <g transform={`translate(58,-76) rotate(${t * 900})`}>
      <path d="M0,-22 L6,-6 L22,0 L6,6 L0,22 L-6,6 L-22,0 L-6,-6Z" fill="#ffcc4d" stroke="#ff7124" strokeWidth={3} />
    </g>
  </svg>
);
const Puff: React.FC<{x: number; y: number; d: number; good: boolean; i: number}> = ({x, y, d, good, i}) => {
  if (d < 0 || d > 0.7) return null;
  const s = eOut(d / 0.25) * (1 - seg(d, 0.45, 0.7));
  const pts = Array.from({length: 18}, (_, k) => { const a = (k / 18) * Math.PI * 2, r = k % 2 ? 50 : 100 + 20 * rnd(k + i); return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return (
    <svg width={300} height={300} viewBox="-150 -150 300 300" style={{position: 'absolute', left: x - 150, top: y - 150, transform: `scale(${s}) rotate(${i * 37}deg)`, overflow: 'visible'}}>
      {good ? (
        <>
          <circle r={110 * eOut(d / 0.5)} fill="none" stroke={CYAN} strokeWidth={16} />
          <circle r={58} fill="#e9fbff" stroke={CYAN} strokeWidth={8} />
          <path d="M-28,2 L-8,24 L30,-22" stroke={GREEN} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <polygon points={pts} fill="#ff7124" stroke={PLUM} strokeWidth={8} strokeLinejoin="round" />
      )}
    </svg>
  );
};
const Bombs: React.FC<{q: number; t: number}> = ({q, t}) => {
  if (q < 8.3 || q >= 15.5) return null;
  return (
    <>
      {BOMBS.map((bm, i) => {
        const d = q - (bm.b - FALL);
        if (d < 0) return null;
        if (q < bm.b) {
          const u = d / FALL;
          return <Bomb key={i} x={bm.x + 30 * Math.sin(u * 3 + i)} y={mix(-140, bm.y, u * u)} r={(rnd(i) - 0.5) * 60 + u * 40} t={t} />;
        }
        return <Puff key={i} x={bm.x} y={bm.y} d={q - bm.b} good={bm.clone} i={i} />;
      })}
    </>
  );
};
const ZeroCost: React.FC<{q: number; cx: number; cy: number}> = ({q, cx, cy}) => {
  if (q < 14 || q >= 15.2) return null;
  const s = (q < 14.12 ? mix(2.4, 1, eOut((q - 14) / 0.12)) : 1) * (1 - seg(q, 14.95, 15.2));
  return (
    <div style={{...font, position: 'absolute', left: cx - 160, top: cy - 50, width: 320, height: 100, transform: `scale(${s}) rotate(-9deg)`, background: '#ffcc4d', border: `7px solid ${PLUM}`,
      borderRadius: 18, boxSizing: 'border-box', boxShadow: `0 8px 0 ${PLUM}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, color: PLUM, whiteSpace: 'nowrap'}}>$0 AI cost</div>
  );
};
const clonePose = (q: number): Pose => {
  const u = boing((q - 8.3) * 2.6);
  const out = seg(q, 15, 15.4);
  return at(mix(PROD.x, CLONE.x, u) + (q < 15 ? CATCH.reduce((a, k) => a + 10 * kick(q, k, 6) * Math.sin((q - k) * 40), 0) : 0),
    CLONE.y - 120 * out, CLONE.s * (1 - 0.9 * eIn(out)), 30 * out * 12);
};
const CloneTag: React.FC<{q: number}> = ({q}) => {
  if (q < 8.5 || q >= 15) return null;
  const p = clonePose(q);
  return (
    <div style={{...font, position: 'absolute', left: OX + p.x - 90, top: 812, width: 180, textAlign: 'center', fontSize: 40, lineHeight: '56px', color: PLUM, background: CYAN,
      borderRadius: 12, border: `5px solid ${PLUM}`, transform: `scale(${boing((q - 8.5) * 3)})`}}>CLONE</div>
  );
};

// ---------- act 3: Analyst proposal, Auditor stamp, Actor ----------
const PAPER = {x: 820, y: 565, w: 430, h: 320}; // ends by y 885
const STAMPS = [16, 17];
const Paper: React.FC<{q: number}> = ({q}) => {
  if (q < 15.5 || q >= 19.95) return null;
  const pop = boing((q - 15.5) * 2.6);
  // the Actor takes the approved change away (up, with its arm), so no text falls in the ROLLBACK shred
  const lift = -920 * eIn(seg(q, 19.55, 19.95));
  const second = q >= 16.6;
  const swap = second ? boing((q - 16.6) * 3) : 1;
  const applied = q >= 19;
  const imprint = (text: string, color: string, at0: number) => {
    if (q < at0) return null;
    const s = q < at0 + 0.08 ? mix(1.6, 1, (q - at0) / 0.08) : 1;
    return (
      <div style={{...font, position: 'absolute', left: '50%', top: 256, transform: `translate(-50%, -50%) rotate(-8deg) scale(${s})`, fontSize: 58, lineHeight: '66px', color,
        border: `7px solid ${color}`, borderRadius: 12, padding: '0 18px', whiteSpace: 'nowrap', opacity: 0.92, background: 'rgba(255,255,255,.55)'}}>{text}</div>
    );
  };
  return (
    <div style={{position: 'absolute', left: PAPER.x, top: PAPER.y, width: PAPER.w, height: PAPER.h, transform: `translateY(${lift}px) scale(${pop}) rotate(${second ? 3 * (1 - swap) - 2 : 2}deg) translateX(${second ? (1 - swap) * -300 : 0}px)`,
      transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', inset: 0, background: applied ? '#d9ffd9' : '#fff', border: `7px solid ${PLUM}`, borderRadius: 16, boxShadow: `0 10px 0 ${PLUM}55`, overflow: 'hidden'}}>
        <div style={{...font, position: 'absolute', left: 0, right: 0, top: 0, height: 52, background: PLUM, color: '#fff', fontSize: 30, lineHeight: '52px', paddingLeft: 18, letterSpacing: 2}}>ANALYST</div>
        {/* the Actor's run box: ticked on 19 */}
        <div style={{position: 'absolute', right: 14, top: 8, width: 36, height: 36, borderRadius: 8, background: applied ? '#39b54a' : '#fff', border: '4px solid #fff', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'center', ...font, fontSize: 26, color: '#fff'}}>{applied ? '✓' : ''}</div>
        {!second ? (
          <div style={{...mono, position: 'absolute', left: 0, right: 0, top: 92, textAlign: 'center', fontSize: 50, color: PLUM, whiteSpace: 'nowrap'}}>restart node</div>
        ) : (
          <>
            <div style={{...mono, position: 'absolute', left: 0, right: 0, top: 64, textAlign: 'center', fontSize: 40, color: PLUM, whiteSpace: 'nowrap'}}>safe changes</div>
            <div style={{...font, position: 'absolute', left: 0, right: 0, top: 116, textAlign: 'center', fontSize: 76, lineHeight: 1, color: PLUM, letterSpacing: -1, whiteSpace: 'nowrap'}}>377 of 378</div>
          </>
        )}
      </div>
      {!second ? imprint('REJECTED', RED, 16) : imprint('APPROVED', GREEN, 17)}
    </div>
  );
};
const STAMP_X = PAPER.x + PAPER.w / 2, STAMP_HIT = PAPER.y + 256;
const Stamp: React.FC<{q: number}> = ({q}) => {
  if (q < 15.6 || q >= 17.8) return null;
  // falls onto each hit, lifts after it
  const k = STAMPS.find((s) => q >= s - 0.3 && q < s + 0.5);
  if (k === undefined) return null;
  const d = q - k;
  const y = d < 0 ? mix(-420, STAMP_HIT, eIn(seg(d, -0.3, 0))) : mix(STAMP_HIT, -420, eIn(seg(d, 0.15, 0.5)));
  const sq = d >= 0 && d < 0.15 ? 1 - 0.18 * kick(q, k, 10) : 1;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${STAMP_X},${y}) scale(1, ${sq}) rotate(-6)`} stroke={PLUM} strokeWidth={8} strokeLinejoin="round">
        <rect x={-34} y={-330} width={68} height={210} rx={16} fill="#b9865a" />
        <ellipse cx={0} cy={-340} rx={74} ry={46} fill="#b9865a" />
        <rect x={-150} y={-126} width={300} height={82} rx={14} fill={PLUM} />
        <rect x={-164} y={-44} width={328} height={44} rx={8} fill={k === 16 ? RED : GREEN} />
        <text x={0} y={-84} textAnchor="middle" dominantBaseline="central" fill="#fff" stroke="none" style={{...font, fontSize: 44, letterSpacing: 3}}>AUDITOR</text>
      </g>
    </svg>
  );
};
const ARM3_FROM = {x: 1060, y: -300};
const ARM3_TIP = {x: PAPER.x + PAPER.w - 32, y: PAPER.y + 30};
const arm3Ext = (q: number) => {
  if (q < 18.4 || q >= 19.95) return -1;
  if (q < 19) return mix(0, 0.9, eOut(seg(q, 18.4, 18.85))) + 0.1 * eIn(seg(q, 18.85, 19));
  return (1 - 0.1 * eOut(seg(q, 19, 19.3))) * (1 - eIn(seg(q, 19.55, 19.95)));
};

// ---------- act 3: the meter (live harms) ----------
const Meter: React.FC<{q: number}> = ({q}) => {
  if (q < 16 || q >= 20) return null;
  // the number snaps 13 -> 1 on the beat (no in-between numbers on screen); only the bar slides
  const crash = ease(seg(q, 18, 18.35));
  const v = q < 18 ? 13 : 1;
  const good = q >= 18;
  const s = boing((q - 16) * 3);
  const shake = q >= 18 ? 14 * kick(q, 18, 5) * Math.sin(q * 80) : 0;
  return (
    <div style={{position: 'absolute', left: 740, top: 26, width: 1140, height: 200, transform: `scale(${s}) translateX(${shake}px)`, transformOrigin: '0 50%'}}>
      <div style={{position: 'absolute', inset: 0, background: '#fff', border: `7px solid ${PLUM}`, borderRadius: 24, boxShadow: `0 10px 0 ${PLUM}55`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${mix(100, 100 / 13, crash)}%`, background: good ? '#39b54a' : RED}} />
      </div>
      <div style={{...mono, position: 'absolute', left: 36, top: 22, fontSize: 112, lineHeight: '156px', color: '#fff', WebkitTextStroke: `8px ${PLUM}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>live harms: {v}</div>
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
        <defs><clipPath id="sling198"><path d="M70,40 L200,40 L250,260 L120,260 Z" /></clipPath></defs>
        <g clipPath="url(#sling198)">{stripes.map((c, i) => <rect key={i} x={60 + i * 30} y={30} width={30} height={240} fill={c} transform="skewX(12)" />)}</g>
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
  const lines: [string, number][] = back
    ? [["Michael's seat:", 50], ['AUDITOR', 108], ['', 50]]
    : [['RESERVED', 46], ['Michael', 108], ['on vacation', 50]];
  const wob = inP(q, 23, 24) ? 5 * Math.sin((q - 23) * 2 * Math.PI * 2) * (1 - seg(q, 23.6, 24)) : 0;
  return (
    <>
      <div style={{position: 'absolute', left: SIGN.x - 11, top: SIGN.top + 200, width: 22, height: H - SIGN.top - 200, background: '#b9865a', border: `5px solid ${PLUM}`, borderRadius: 6}} />
      <div style={{position: 'absolute', left: SIGN.x - SIGN.w / 2, top: SIGN.top, width: SIGN.w,
        transform: `rotate(${wob}deg) scaleX(${Math.max(0.02, Math.abs(Math.cos((a * Math.PI) / 180)))})`, transformOrigin: '50% 100%'}}>
        <div style={{background: '#fff', border: `7px solid ${PLUM}`, borderRadius: 20, padding: '14px 6px 18px', textAlign: 'center', boxShadow: `0 10px 0 ${PLUM}55`}}>
          {lines.map(([s, size], i) => <div key={i} style={{...font, fontSize: size, lineHeight: 1.06, height: size * 1.06, color: PLUM, letterSpacing: size < 60 ? 2 : -1, whiteSpace: 'nowrap'}}>{s}</div>)}
        </div>
      </div>
    </>
  );
};

// ---------- labels: one per act, big, never two moving at once ----------
const nRestarts = (q: number) => PRESSES.filter((k) => q >= k).length;
// Label numbers are the final facts from the first frame; the running count is a row of pips.
type Pip = 'off' | 'lit' | 'green' | 'orange';
type LabelDef = {a: number; b: number; s: (q: number) => string; bg: string; sql?: boolean; size?: number; bumps?: number[]; pips?: (q: number) => Pip[]};
const LABELS: LabelDef[] = [
  {a: 3, b: 7.95, s: () => 'Restarted anyway in 5 of 5 runs', bg: RED, size: 62, bumps: PRESSES,
    pips: (q) => PRESSES.map((_, i) => (i < nRestarts(q) ? 'lit' : 'off'))},
  {a: 8.3, b: 8.95, s: () => 'Rehearse on a clone', bg: PLUM, size: 80},
  {a: 9, b: 14.95, s: () => 'Clone alone stopped 6 of 13 harms', bg: PLUM, size: 56, bumps: [...CATCH, ...PASS],
    // one pip per harm, in the order they land: green = stopped on the clone, orange = hit the live elephant
    pips: (q) => [...BOMBS].sort((x, y) => x.b - y.b).map((bm) => (q < bm.b ? 'off' : bm.clone ? 'green' : 'orange'))},
  {a: 15, b: 15.95, s: () => 'Analyst · Auditor · Actor', bg: PLUM, size: 76},
  {a: 20, b: 21.95, s: () => 'ROLLBACK;', bg: TERM, sql: true},
];
const Label: React.FC<{q: number}> = ({q}) => (
  <>
    {LABELS.filter((l) => inP(q, l.a, l.b)).map((l) => {
      const bump = (l.bumps ?? []).reduce((a, k) => a + 0.06 * kick(q, k, 6), 0);
      return (
        <div key={l.a} style={{...(l.sql ? mono : font), position: 'absolute', left: 710, top: 40, fontSize: l.size ?? (l.sql ? 76 : 88), lineHeight: 1.1, color: '#fff', background: l.bg, padding: '8px 30px', borderRadius: 20, whiteSpace: 'nowrap',
          border: '5px solid #fff', boxShadow: `0 10px 0 ${PLUM}55`, transform: `scale(${boing((q - l.a) * 3) * (1 + bump)}) rotate(-2deg)`, transformOrigin: '0 50%'}}>
          {l.s(q)}
          {l.pips && (
            <div style={{display: 'flex', gap: 10, padding: '4px 0 8px'}}>
              {l.pips(q).map((p, i) => <div key={i} style={{width: 30, height: 30, borderRadius: 15, border: '4px solid #fff', boxSizing: 'border-box',
                background: {off: 'rgba(255,255,255,.15)', lit: '#ffcc4d', green: '#39b54a', orange: '#ff7124'}[p]}} />)}
            </div>
          )}
        </div>
      );
    })}
  </>
);
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

// ---------- title + host tiles ----------
const HOST_X = [110, 470];
const TITLE_TOP = 228; // band ends at y 554
const TILE_TOP = 562; // tile + name label end by y ~872; they boom from the bottom edge, so they stay above y 900
const BAND_PX = 100;
type Knock = {s: number; r: number; x: number; y: number};
const Photo: React.FC<{src: string; name: string; x: number; q: number; i: number; k: Knock}> = ({src, name, x, q, i, k}) => {
  const s0 = 2 + i * 0.5;
  if (q < s0) return null;
  const pop = boing((q - s0) * 3);
  return (
    <div style={{position: 'absolute', left: x, top: TILE_TOP, width: 330, transform: `translate(${k.x}px, ${Math.min(0, k.y)}px) scale(${pop * k.s}) rotate(${k.r}deg)`, transformOrigin: '50% 100%'}}>
      <Img src={staticFile(src)} style={{width: 330, height: 248, objectFit: 'cover', borderRadius: 14, border: '5px solid #fff', boxShadow: '0 10px 0 rgba(61,15,69,.3)'}} />
      <div style={{...font, fontWeight: 700, fontSize: 30, color: PLUM, marginTop: 12, whiteSpace: 'nowrap', background: '#fff', borderRadius: 10, padding: '2px 12px', display: 'inline-block', boxShadow: '0 4px 0 rgba(61,15,69,.25)'}}>{name}</div>
    </div>
  );
};
const TitleLayer: React.FC<{q: number; shake: number}> = ({q, shake}) => {
  const slam = q >= 0 ? (q < 0.15 ? mix(2.6, 1, eOut(q / 0.15)) : 1) : 0;
  const slamRot = q >= 0 ? -8 * kick(q, 0, 6) : 0;
  const drop = q >= 1 ? -420 * (1 - boing((q - 1) * 2.6)) : -9999;
  return (
    <AbsoluteFill style={{transform: `rotate(${shake}deg)`, transformOrigin: '600px 400px'}}>
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560, filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
      <div style={{position: 'absolute', left: 110, top: TITLE_TOP}}>
        <div style={{...font, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap', height: 150, textShadow: `0 7px 0 ${PLUM}88, 0 0 30px rgba(61,15,69,.5)`,
          transform: `translateY(${drop}px)`}}>{TITLE[0]}</div>
        <div style={{position: 'relative', marginTop: 26, height: 150}}>
          {slam > 0 && (
            <div style={{position: 'relative', display: 'inline-block', height: 150, transform: `scale(${slam}) rotate(${slamRot}deg)`, transformOrigin: '30% 50%'}}>
              <div style={{position: 'absolute', left: -24, right: -36, top: 0, bottom: 0, background: PLUM, borderRadius: 18, transform: 'skewX(-6deg)', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
              <div style={{...font, position: 'relative', paddingLeft: 14, paddingRight: 6, fontSize: BAND_PX, lineHeight: '150px', color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap'}}>{TITLE[1]}</div>
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
  if (q < 3) { const u = seg(q, 2.5, 3); return at(HOME.x, HOME.y - 50 * arc(u), HOME.s, -6 * u); } // looks up at the arm
  if (q < 7) { // power-cycles on every press: a full spin and a hop
    const k = Math.floor(q), d = q - k;
    return at(HOME.x, HOME.y - 90 * arc(seg(d, 0.05, 0.55)), HOME.s, (k % 2 ? -1 : 1) * 360 * eOut(seg(d, 0, 0.6)));
  }
  if (q < 8) { // the 5th press launches it
    const u = seg(q, 7, 8);
    return at(mix(HOME.x, PROD.x, u), mix(HOME.y, PROD.y, u) - 720 * arc(u), mix(HOME.s, PROD.s, u), 720 * eOut(u));
  }
  if (q < 15) { // the live elephant takes the 7 hits the clone did not stop
    const r = PASS.reduce((a, k, i) => a + (i % 2 ? 1 : -1) * 14 * kick(q, k, 5), 0);
    const sh = PASS.reduce((a, k) => a + 16 * kick(q, k, 7) * Math.sin((q - k) * 50), 0);
    return at(PROD.x + sh, PROD.y + 8 * Math.abs(r) / 14, PROD.s, r);
  }
  if (q < 15.8) { const u = seg(q, 15, 15.8); return at(mix(PROD.x, MID.x, ease(u)), mix(PROD.y, MID.y, ease(u)) - 220 * arc(u), mix(PROD.s, MID.s, ease(u))); }
  if (q < 20) { const r = -6 * kick(q, 16, 5) + 5 * kick(q, 17, 5); return at(MID.x, MID.y, MID.s, r); }
  if (q < 22) return {...home, hidden: true};
  return at(MID.x, MID.y + 600 * (1 - boing((q - 22) * 2.6)), MID.s);
};
// darkens on every restart, flinches red on every live hit
const mainFilter = (q: number) => {
  const dark = PRESSES.some((k) => inP(q, k, k + 0.3));
  if (dark) return 'brightness(.25) grayscale(1)';
  const hitK = PASS.find((k) => inP(q, k, k + 0.25));
  if (hitK !== undefined) return 'brightness(.8) sepia(1) saturate(4) hue-rotate(-30deg)';
  return undefined;
};

// ---------- the world (everything ROLLBACK can shred) ----------
const World: React.FC<{q: number; t: number; stomp: number}> = ({q, t, stomp}) => {
  const nightO = q < 8.3 ? 0 : q < 9 ? seg(q, 8.3, 9) : q < 15 ? 1 : 1 - seg(q, 15, 15.5);
  const lightsOff = PRESSES.some((k) => inP(q, k, k + 0.16));
  const a1 = arm1Ext(q);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: PINK_BG}} />
      {nightO > 0 && <div style={{position: 'absolute', inset: 0, background: NIGHT_BG, opacity: nightO}} />}
      {Array.from({length: 9}, (_, i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 120 * (i + 1), height: 3, background: 'rgba(255,255,255,.18)'}} />)}
      {inP(q, 8.3, 15.4) && <Elephant e={clonePose(q)} hue={150} opacity={0.92} filter={`brightness(1.15) drop-shadow(0 0 22px ${CYAN}) drop-shadow(0 0 6px ${CYAN})`} />}
      <Elephant e={mainPose(q)} stomp={q < 7 || q >= 22 ? stomp : 0} filter={mainFilter(q)} />
      <CloneTag q={q} />
      <ZeroCost q={q} cx={CLONE.x} cy={730} />
      {lightsOff && <div style={{position: 'absolute', inset: 0, background: '#0a0010', opacity: 0.72}} />}
      <RestartButton q={q} />
      {a1 >= 0 && <Arm from={ARM1_FROM} tip={extTip(back(ARM1_FROM, ARM1_TIP), ARM1_TIP, a1)} tag="AI" led={pressed(q) ? RED : '#39b54a'} />}
      <Paper q={q} />
      <Stamp q={q} />
    </>
  );
};

// ---------- beat energy ----------
const RULE3 = [1, 1.45, 1.95, 0.55]; // hit, bigger, biggest, break
const BIG = [0, 3, 7, 8, 9, 10, 11, 15, 16, 17, 18, 20, 22, 24];
const INVERT = [7, 15, 18, 20];
const KNOCKS: {k: number; x: number; y: number; r: number}[] = [{k: 7, x: -60, y: 20, r: -12}, {k: 15, x: 0, y: -50, r: 9}, {k: 18, x: 30, y: 40, r: -10}, {k: 20, x: -30, y: -20, r: 8}];

export const Card198: React.FC = () => {
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
  const inv = INVERT.some((s) => { const kk = Math.round(ons[s] * FPS); return f >= kk && f < kk + 2; });
  const punch = `scale(${1 + 0.03 * hit}) rotate(${alt * 0.9 * hit}deg) translateY(${-10 * hit}px)`;
  const knock = KNOCKS.reduce((a, n) => { const e = kick(q, n.k, 3.5); return {x: a.x + n.x * e * Math.cos((q - n.k) * 9), y: a.y + n.y * e, r: a.r + n.r * e}; }, {x: 0, y: 0, r: 0});
  const knocks: Knock[] = [0, 1].map((i) => {
    const b = live || k === 24 ? env * (0.55 + 0.45 * lvl) : 0;
    return {s: 1 + (big ? 0.2 : 0.11) * b, r: 0.6 * ((i % 2 ? 1 : -1) * alt * (big ? 4 : 2.5) * b + knock.r * (i ? 0.7 : 1)), x: knock.x * (i ? 0.6 : 1), y: knock.y};
  });
  const shred = inP(q, 20, 21.9);
  const NS = 14, sw = W / NS;
  return (
    <AbsoluteFill style={{background: TERM, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: punch, filter: inv ? 'invert(1) hue-rotate(180deg)' : undefined}}>
        {q < 20 && <World q={q} t={t} stomp={hit} />}
        {shred && Array.from({length: NS}, (_, i) => {
          const d = Math.max(0, (q - 20 - (i % 2) * 0.06 - rnd(i) * 0.15) * BEAT);
          const y = 1500 * d * d + 150 * d, r = (rnd(i + 5) - 0.5) * 120 * d, gap = (i - NS / 2) * 12 * seg(q, 20, 20.1);
          if (y > H + 300) return null;
          return (
            <AbsoluteFill key={i} style={{clipPath: `inset(0 ${W - (i + 1) * sw}px 0 ${i * sw}px)`, transform: `translate(${gap}px, ${y}px) rotate(${r}deg)`, transformOrigin: `${(i + 0.5) * sw}px 0px`}}>
              <World q={19.95} t={t} stomp={0} />
            </AbsoluteFill>
          );
        })}
        {q >= 21.9 && (
          <>
            {/* the clean frame slides back row by row, then the elephant pops up on 22 */}
            {Array.from({length: 9}, (_, i) => (
              <div key={i} style={{position: 'absolute', left: (i % 2 ? 1 : -1) * W * (1 - eOut(seg(q, 21.6 + i * 0.02, 22))), top: i * 120, width: W, height: 121,
                background: PINK_BG, backgroundSize: `${W}px ${H}px`, backgroundPosition: `0 ${-i * 120}px`}} />
            ))}
            <Elephant e={mainPose(q)} stomp={q < 23 ? hit : 0} />
          </>
        )}
      </AbsoluteFill>
      <TitleLayer q={q} shake={live ? alt * 0.5 * hit + knock.r * 0.15 : 0} />
      {HOSTS.map((h, i) => <Photo key={h.name} src={h.photo ?? ''} name={h.name} x={HOST_X[i] ?? 110 + i * 360} q={q} i={i} k={knocks[i]} />)}
      {/* the gag texts and the bombs sit above the title and the tiles: they collide on purpose */}
      <Bombs q={q} t={t} />
      {/* the Actor reaches over the title: it runs the approved change */}
      {arm3Ext(q) >= 0 && <Arm from={ARM3_FROM} tip={extTip(back(ARM3_FROM, ARM3_TIP), ARM3_TIP, arm3Ext(q))} tag="ACTOR" led="#39b54a" />}
      <Meter q={q} />
      <Burst q={q} beat={7} text="RESTART!" x={1180} y={520} color={RED} size={130} dur={1.1} />
      <Label q={q} />
      <Chair wob={0} />
      <Sign q={q} />
      {q >= 24 && [ELE.glintL, ELE.glintR].map(([gx, gy], i) => {
        const p = imgPt(mainPose(q), gx, gy), d = q - 24 - 0.15 * i;
        return <Sparkle key={i} x={p.x} y={p.y} s={d > 0 ? 0.7 * Math.sin(Math.min(1, d / 0.9) * Math.PI) : 0} rot={60 * d} />;
      })}
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
