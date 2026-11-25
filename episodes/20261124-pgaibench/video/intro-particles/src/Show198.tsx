import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ELE, H, HOSTS, Sparkle, TITLE, W} from './common';
import {BEAT, FPS, kt, tk} from './beats';
import {B, PAPER} from './show-timeline';

// Ep 198 intro A v3: the corrected Card198 show (ep 198 title card), retimed onto the music hits
// (show-timeline.ts) so that every text state reads for >= 1 s, with bigger texts (>= 44 px) and
// Michael's chair + sign 22% smaller. Its entry (band slam, title drop, host tiles) is done by
// the particles, so here those elements are static from the first frame; the show takes over
// from the particles at frame SW_F and is detonated into particles at frame EX_F.
// New gag: the Analyst stamps its own proposal SELF-APPROVED; the Auditor's REJECTED blows it apart.
// `only` renders one layer (transparent), for the particle engine; `none` hides nothing.

export type Grp = 'bg' | 'arm' | 'logo' | 'title1' | 'band' | 'kirk' | 'nik' | 'michael';
export const GROUPS: Grp[] = ['bg', 'arm', 'logo', 'title1', 'band', 'kirk', 'nik', 'michael'];

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
const kick = (q: number, s: number, rate = 3) => (q >= s ? Math.exp(-(q - s) * rate) : 0);
// stamp/sticker slam: big, undershoot, settle (scale)
const slamS = (q: number, s: number, from = 1.9) => (q < s ? 0 : q < s + 0.1 ? mix(from, 0.9, eIn((q - s) / 0.1)) : q < s + 0.4 ? mix(0.9, 1, eOut((q - s - 0.1) / 0.3)) : 1);

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
const PRESSES = B.presses;
const BTN = {x: 1250, top: 778};
const pressed = (q: number) => PRESSES.some((k) => inP(q, k - 0.04, k + 0.22));
const RestartButton: React.FC<{q: number}> = ({q}) => {
  if (q >= B.night + 0.6) return null;
  const sq = pressed(q) ? 0.35 : 1;
  const o = 1 - seg(q, B.night, B.night + 0.5);
  const w = 250;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <ellipse cx={BTN.x} cy={BTN.top} rx={100} ry={64 * sq} fill={RED} stroke={PLUM} strokeWidth={8} />
        <ellipse cx={BTN.x - 30} cy={BTN.top - 30 * sq} rx={30} ry={12 * sq} fill="#fff" opacity={0.5} />
        <rect x={BTN.x - w / 2} y={BTN.top} width={w} height={H - BTN.top + 20} rx={14} fill="#ffcc4d" stroke={PLUM} strokeWidth={8} />
      </svg>
      {/* the rule, on the pedestal: ends by y 898 */}
      <div style={{...font, position: 'absolute', left: BTN.x - w / 2 + 10, top: BTN.top + 12, width: w - 20, height: 104, background: PLUM, borderRadius: 8,
        color: '#ffcc4d', fontSize: 46, lineHeight: '50px', textAlign: 'center', paddingTop: 2, letterSpacing: 1}}>DO NOT<br />RESTART</div>
    </div>
  );
};
const Arm: React.FC<{tip: {x: number; y: number}; from: {x: number; y: number}; tag: string; led: string}> = ({tip, from, tag, led}) => {
  const dx = tip.x - from.x, dy = tip.y - from.y;
  const phi = (-Math.atan2(dx, dy) * 180) / Math.PI;
  const wide = tag.length > 3;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${tip.x},${tip.y}) rotate(${phi})`} stroke={PLUM} strokeWidth={7} strokeLinejoin="round">
        <rect x={-40} y={-1700} width={80} height={1500} fill={STEEL} />
        {[-420, -760].map((y) => <circle key={y} cx={0} cy={y} r={52} fill="#9aa0ad" />)}
        <rect x={-62} y={-212} width={124} height={44} rx={10} fill="#9aa0ad" />
        <circle cx={0} cy={-190} r={11} fill={led} strokeWidth={4} />
        <rect x={wide ? -88 : -58} y={-172} width={wide ? 176 : 116} height={104} rx={22} fill={STEEL} />
        <rect x={-50} y={-86} width={26} height={44} rx={12} fill={STEEL} />
        <rect x={24} y={-86} width={26} height={44} rx={12} fill={STEEL} />
        <rect x={-15} y={-100} width={30} height={100} rx={15} fill="#fff" />
        <text x={0} y={-122} textAnchor="middle" dominantBaseline="central" fill={PLUM} stroke="none" style={{...font, fontSize: wide ? 44 : 50, letterSpacing: 1}}>{tag}</text>
      </g>
    </svg>
  );
};
const ARM1_FROM = {x: 1010, y: -260};
const ARM1_TIP = {x: BTN.x, y: BTN.top - 58};
const HOVER = 0.88;
const arm1Ext = (q: number) => {
  if (q >= B.restart + 0.9) return -1;
  if (q >= B.restart + 0.25) return HOVER * (1 - eIn(seg(q, B.restart + 0.25, B.restart + 0.9)));
  const k = Math.round(q);
  const d = q - k;
  if (PRESSES.includes(k) && d > -0.2 && d < 0.35) return d < 0 ? mix(HOVER, 1, eIn(seg(d, -0.2, 0))) : mix(1, HOVER, eOut(seg(d, 0, 0.35)));
  return HOVER;
};
const back = (from: {x: number; y: number}, tip: {x: number; y: number}) => ({x: from.x - (tip.x - from.x) * 0.2, y: from.y - (tip.y - from.y) * 0.2});
const extTip = (from: {x: number; y: number}, tip: {x: number; y: number}, e: number) => ({x: mix(from.x, tip.x, e), y: mix(from.y, tip.y, e)});

// ---------- act 2: the clone, the harm bombs ----------
const CATCH = B.catch, PASS = B.pass;
const BOMBS = [...CATCH.map((b, i) => ({b, clone: true, x: CLONE.x - 40 + 120 * rnd(i + 40), y: 610 + 40 * rnd(i + 60)})),
  ...PASS.map((b, i) => ({b, clone: false, x: PROD.x - 20 + 80 * rnd(i + 80), y: 640 + 40 * rnd(i + 90)}))];
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
  if (q < CATCH[0] - FALL - 0.1 || q >= B.day + 0.5) return null;
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
  if (q < B.zero || q >= B.day + 0.2) return null;
  const s = slamS(q, B.zero, 2.6) * (1 - seg(q, B.day - 0.05, B.day + 0.2));
  return (
    <div style={{...font, position: 'absolute', left: cx - 180, top: cy - 56, width: 360, height: 112, transform: `scale(${s}) rotate(-9deg)`, background: '#ffcc4d', border: `7px solid ${PLUM}`,
      borderRadius: 18, boxSizing: 'border-box', boxShadow: `0 8px 0 ${PLUM}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 62, color: PLUM, whiteSpace: 'nowrap'}}>$0 AI cost</div>
  );
};
const clonePose = (q: number): Pose => {
  const u = boing((q - B.night) * 2.6);
  const out = seg(q, B.day, B.day + 0.4);
  return at(mix(PROD.x, CLONE.x, u) + (q < B.day ? CATCH.reduce((a, k) => a + 10 * kick(q, k, 6) * Math.sin((q - k) * 40), 0) : 0),
    CLONE.y - 120 * out, CLONE.s * (1 - 0.9 * eIn(out)), 30 * out * 12);
};
const CloneTag: React.FC<{q: number}> = ({q}) => {
  if (q < B.night + 0.2 || q >= B.day) return null;
  const p = clonePose(q);
  return (
    <div style={{...font, position: 'absolute', left: OX + p.x - 100, top: 806, width: 200, textAlign: 'center', fontSize: 48, lineHeight: '62px', color: PLUM, background: CYAN,
      borderRadius: 12, border: `5px solid ${PLUM}`, transform: `scale(${boing((q - B.night - 0.2) * 3)})`}}>CLONE</div>
  );
};

// ---------- act 3: Analyst proposal, self-approval, Auditor stamp, Actor ----------
const IMPRINT_Y = 252; // centre of the stamp imprint, in paper px (page y 817)
const Paper: React.FC<{q: number}> = ({q}) => {
  if (q < B.paper || q >= B.tick + 0.95) return null;
  const second = q >= B.swap;
  const pop = boing((q - (second ? B.swap : B.paper)) * 3);
  const lift = -920 * eIn(seg(q, B.tick + 0.55, B.tick + 0.95));
  const applied = q >= B.tick;
  const imprint = (text: string, color: string, s0: number, size = 58) => {
    if (q < s0) return null;
    return (
      <div style={{...font, position: 'absolute', left: '50%', top: IMPRINT_Y, transform: `translate(-50%, -50%) rotate(-8deg) scale(${slamS(q, s0, 1.8)})`, fontSize: size, lineHeight: `${size + 8}px`, color,
        border: `7px solid ${color}`, borderRadius: 12, padding: '0 18px', whiteSpace: 'nowrap', opacity: 0.94, background: 'rgba(255,255,255,.6)'}}>{text}</div>
    );
  };
  return (
    <div style={{position: 'absolute', left: PAPER.x, top: PAPER.y, width: PAPER.w, height: PAPER.h, transform: `translateY(${lift}px) scale(${pop}) rotate(${second ? 2 : -2}deg)`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', inset: 0, background: applied ? '#d9ffd9' : '#fff', border: `7px solid ${PLUM}`, borderRadius: 16, boxShadow: `0 10px 0 ${PLUM}55`, overflow: 'hidden'}}>
        <div style={{...font, position: 'absolute', left: 0, right: 0, top: 0, height: 66, background: PLUM, color: '#fff', fontSize: 46, lineHeight: '66px', paddingLeft: 16, letterSpacing: 0, whiteSpace: 'nowrap'}}>{second ? 'CHANGE REQUESTS' : 'ANALYST'}</div>
        {second && (
          <div style={{position: 'absolute', right: 10, top: 12, width: 42, height: 42, borderRadius: 8, background: applied ? '#39b54a' : '#fff', border: '4px solid #fff', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center', ...font, fontSize: 30, color: '#fff'}}>{applied ? '✓' : ''}</div>
        )}
        {!second ? (
          <div style={{...mono, position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontSize: 52, color: PLUM, whiteSpace: 'nowrap'}}>drop indexes</div>
        ) : (
          <>
            <div style={{...mono, position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center', fontSize: 48, color: PLUM, whiteSpace: 'nowrap'}}>safe changes</div>
            <div style={{...font, position: 'absolute', left: 0, right: 0, top: 140, textAlign: 'center', fontSize: 78, lineHeight: 1, color: PLUM, letterSpacing: -1, whiteSpace: 'nowrap'}}>377 of 378</div>
          </>
        )}
      </div>
      {!second && q < B.rejected && imprint('SELF-APPROVED', GREEN, B.selfStamp, 50)}
      {!second && q >= B.rejected && imprint('REJECTED', RED, B.rejected)}
      {second && imprint('APPROVED', GREEN, B.approved)}
    </div>
  );
};
const STAMP_X = PAPER.x + PAPER.w / 2, STAMP_HIT = PAPER.y + IMPRINT_Y;
// stamp tool: who: 'ANALYST' (its own proposal: self-approval) or 'AUDITOR'
const Stamp: React.FC<{q: number}> = ({q}) => {
  const hits: [number, string, string][] = [[B.selfStamp, 'ANALYST', GREEN], [B.rejected, 'AUDITOR', RED], [B.approved, 'AUDITOR', GREEN]];
  const h = hits.find(([s]) => q >= s - (s === B.selfStamp ? 0.2 : 0.3) && q < s + 0.5);
  if (!h) return null;
  const [k, who, pad] = h;
  const d = q - k;
  // the self-approval stamp condenses from the paper's own particles above it (Fx), then slams
  const y = d < 0 ? (k === B.selfStamp ? mix(STAMP_HIT - 330, STAMP_HIT, eIn(seg(d, -0.2, 0))) : mix(-420, STAMP_HIT, eIn(seg(d, -0.3, 0)))) : mix(STAMP_HIT, -420, eIn(seg(d, 0.15, 0.5)));
  const sq = d >= 0 && d < 0.15 ? 1 - 0.22 * kick(q, k, 10) : 1;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g transform={`translate(${STAMP_X},${y}) scale(1, ${sq}) rotate(-6)`} stroke={PLUM} strokeWidth={8} strokeLinejoin="round">
        <rect x={-34} y={-330} width={68} height={210} rx={16} fill="#b9865a" />
        <ellipse cx={0} cy={-340} rx={74} ry={46} fill="#b9865a" />
        <rect x={-150} y={-126} width={300} height={82} rx={14} fill={PLUM} />
        <rect x={-164} y={-44} width={328} height={44} rx={8} fill={pad} />
        <text x={0} y={-84} textAnchor="middle" dominantBaseline="central" fill="#fff" stroke="none" style={{...font, fontSize: 50, letterSpacing: 3}}>{who}</text>
      </g>
    </svg>
  );
};
const ARM3_FROM = {x: 1060, y: -300};
const ARM3_TIP = {x: PAPER.x + PAPER.w - 32, y: PAPER.y + 30};
const arm3Ext = (q: number) => {
  if (q < B.tick - 0.6 || q >= B.tick + 0.95) return -1;
  if (q < B.tick) return mix(0, 0.9, eOut(seg(q, B.tick - 0.6, B.tick - 0.15))) + 0.1 * eIn(seg(q, B.tick - 0.15, B.tick));
  return (1 - 0.1 * eOut(seg(q, B.tick, B.tick + 0.3))) * (1 - eIn(seg(q, B.tick + 0.55, B.tick + 0.95)));
};
const Meter: React.FC<{q: number}> = ({q}) => {
  if (q < B.rejected || q >= B.rollback) return null;
  const crash = ease(seg(q, B.crash, B.crash + 0.35));
  const good = q >= B.crash;
  const s = slamS(q, B.rejected, 1.5);
  const shake = good ? 16 * kick(q, B.crash, 5) * Math.sin(q * 80) : 0;
  return (
    <div style={{position: 'absolute', left: 740, top: 26, width: 1140, height: 200, transform: `scale(${s}) translateX(${shake}px)`, transformOrigin: '30% 50%'}}>
      <div style={{position: 'absolute', inset: 0, background: good ? '#e3ffe6' : '#fff', border: `7px solid ${PLUM}`, borderRadius: 24, boxShadow: `0 10px 0 ${PLUM}55`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${mix(100, 100 / 13, crash)}%`, background: good ? '#39b54a' : RED}} />
      </div>
      <div style={{...mono, position: 'absolute', left: 36, top: 22, fontSize: 100, lineHeight: '156px', color: good ? PLUM : '#fff', WebkitTextStroke: good ? '0px' : `8px ${PLUM}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>{good ? '13 → 1 in replay' : '13 harms in replay'}</div>
    </div>
  );
};

// ---------- Michael's deck chair + sign (22% smaller than in Card198) ----------
const CX = 1765, CS = 0.85, MICHAEL = 0.78;
const SIGN = {x: 1605, top: 410, w: 610};
const Chair: React.FC = () => {
  const stripes = ['#ff5fcf', '#fff', '#42a8c8', '#fff', '#ff5fcf', '#fff', '#42a8c8'];
  return (
    <div style={{position: 'absolute', left: CX - 150, top: H - 400, width: 300, height: 400, transform: `scale(${CS})`, transformOrigin: '50% 100%'}}>
      <svg width={360} height={400} viewBox="0 0 360 400" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><clipPath id="sling198v3"><path d="M70,40 L200,40 L250,260 L120,260 Z" /></clipPath></defs>
        <g clipPath="url(#sling198v3)">{stripes.map((c, i) => <rect key={i} x={60 + i * 30} y={30} width={30} height={240} fill={c} transform="skewX(12)" />)}</g>
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
  const a = 180 * ease(seg(q, B.flip, B.flip + 0.6));
  const backSide = a > 90;
  // set large: the whole group is scaled 0.78, so 58 px -> 45 px on screen
  const lines: [string, number][] = backSide
    ? [["Michael's seat:", 58], ['AUDITOR', 108], ['', 58]]
    : [['RESERVED', 58], ['Michael', 108], ['seat kept warm', 58]];
  const wob = inP(q, B.clean, B.clean + 1) ? 5 * Math.sin((q - B.clean) * 2 * Math.PI * 2) * (1 - seg(q, B.clean + 0.6, B.clean + 1)) : 0;
  const pop = 1 + 0.12 * kick(q, B.flip + 0.6, 6);
  return (
    <>
      <div style={{position: 'absolute', left: SIGN.x - 11, top: SIGN.top + 200, width: 22, height: H - SIGN.top - 200, background: '#b9865a', border: `5px solid ${PLUM}`, borderRadius: 6}} />
      <div style={{position: 'absolute', left: SIGN.x - SIGN.w / 2, top: SIGN.top, width: SIGN.w,
        transform: `rotate(${wob}deg) scale(${pop}) scaleX(${Math.max(0.02, Math.abs(Math.cos((a * Math.PI) / 180)))})`, transformOrigin: '50% 100%'}}>
        <div style={{background: '#fff', border: `7px solid ${PLUM}`, borderRadius: 20, padding: '12px 6px 16px', textAlign: 'center', boxShadow: `0 10px 0 ${PLUM}55`}}>
          {lines.map(([s, size], i) => <div key={i} style={{...font, fontSize: size, lineHeight: 1.06, height: size * 1.06, color: PLUM, letterSpacing: size < 60 ? 1 : -1, whiteSpace: 'nowrap'}}>{s}</div>)}
        </div>
      </div>
    </>
  );
};
const Michael: React.FC<{q: number}> = ({q}) => (
  <AbsoluteFill style={{transform: `scale(${MICHAEL})`, transformOrigin: `${CX}px ${H}px`}}>
    <Chair />
    <Sign q={q} />
  </AbsoluteFill>
);

// ---------- labels (top right of the title): one at a time, >= 1 s each ----------
const nRestarts = (q: number) => PRESSES.filter((k) => q >= k).length;
type Pip = 'off' | 'lit' | 'green' | 'orange';
type LabelDef = {a: number; b: number; s: string; s2?: string; bg: string; sql?: boolean; size?: number; bumps?: number[]; pips?: (q: number) => Pip[]};
const LABELS: LabelDef[] = [
  {a: PRESSES[0] - 0.02, b: B.night - 0.02, s: 'Restarted anyway: 5 of 5 runs', s2: 'of one task (C18)', bg: RED, size: 60, bumps: PRESSES,
    pips: (q) => PRESSES.map((_, i) => (i < nRestarts(q) ? 'lit' : 'off'))},
  {a: B.rehearse[0], b: B.rehearse[1], s: 'Rehearse on a clone', bg: PLUM, size: 84},
  {a: B.stopped[0], b: B.stopped[1], s: 'Clone alone stopped 6 of 13 harms', bg: PLUM, size: 60, bumps: [...CATCH, ...PASS],
    pips: (q) => [...BOMBS].sort((x, y) => x.b - y.b).map((bm) => (q < bm.b ? 'off' : bm.clone ? 'green' : 'orange'))},
  {a: B.aaa[0], b: B.aaa[1], s: 'Analyst · Auditor · Actor', bg: PLUM, size: 80},
  {a: B.rollback, b: B.rollback + 1.95, s: 'ROLLBACK;', bg: TERM, sql: true, size: 84},
];
const Label: React.FC<{q: number}> = ({q}) => (
  <>
    {LABELS.filter((l) => inP(q, l.a, l.b)).map((l) => {
      const bump = (l.bumps ?? []).reduce((a, k) => a + 0.07 * kick(q, k, 6), 0);
      return (
        <div key={l.a} style={{...(l.sql ? mono : font), position: 'absolute', left: 700, top: 26, fontSize: l.size ?? 88, lineHeight: 1.1, color: '#fff', background: l.bg, padding: '6px 28px', borderRadius: 20, whiteSpace: 'nowrap',
          border: '5px solid #fff', boxShadow: `0 10px 0 ${PLUM}55`, transform: `scale(${slamS(q, l.a, 1.6) * (1 + bump)}) rotate(-2deg)`, transformOrigin: '0 50%'}}>
          {l.s}
          {(l.s2 || l.pips) && (
            <div style={{display: 'flex', gap: 12, alignItems: 'center', padding: '0 0 6px'}}>
              {l.s2 && <span style={{fontSize: 48, lineHeight: 1.1, marginRight: 10}}>{l.s2}</span>}
              {l.pips?.(q).map((p, i) => <div key={i} style={{width: 30, height: 30, borderRadius: 15, border: '4px solid #fff', boxSizing: 'border-box',
                background: {off: 'rgba(255,255,255,.15)', lit: '#ffcc4d', green: '#39b54a', orange: '#ff7124'}[p]}} />)}
            </div>
          )}
        </div>
      );
    })}
  </>
);
const Burst: React.FC<{q: number; beat: number; text: string; x: number; y: number; color: string; size?: number; dur?: number}> = ({q, beat, text, x, y, color, size = 120, dur = 2}) => {
  const d = q - beat;
  if (d < 0 || d > dur) return null;
  const s = slamS(q, beat, 2.2) * (d > dur - 0.2 ? 1 - (d - dur + 0.2) / 0.2 : 1) * (1 + 0.05 * Math.sin(d * 25) * Math.exp(-d * 2));
  const pts = Array.from({length: 28}, (_, i) => { const a = (i / 28) * Math.PI * 2, r = i % 2 ? 150 : 230 + 30 * rnd(i + beat); return `${Math.cos(a) * r * 1.6},${Math.sin(a) * r}`; }).join(' ');
  return (
    <div style={{position: 'absolute', left: x - 380, top: y - 240, width: 760, height: 480, transform: `scale(${s}) rotate(-7deg)`}}>
      <svg width={760} height={480} viewBox="-380 -240 760 480" style={{position: 'absolute'}}><polygon points={pts} fill={color} stroke={PLUM} strokeWidth={10} strokeLinejoin="round" /></svg>
      <div style={{...font, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size, color: '#fff', letterSpacing: -1,
        WebkitTextStroke: `7px ${PLUM}`, paintOrder: 'stroke fill', fontStyle: 'italic', whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};

// ---------- title + host tiles (static: the particles slam them in) ----------
const HOST_X = [110, 470];
const TITLE_TOP = 228;
const TILE_TOP = 556;
const BAND_PX = 100;
type Knock = {s: number; r: number; x: number; y: number};
const Photo: React.FC<{src: string; name: string; x: number; k: Knock}> = ({src, name, x, k}) => (
  <div style={{position: 'absolute', left: x, top: TILE_TOP, width: 330, transform: `translate(${k.x}px, ${Math.min(0, k.y)}px) scale(${k.s}) rotate(${k.r}deg)`, transformOrigin: '50% 100%'}}>
    <Img src={staticFile(src)} style={{width: 330, height: 248, objectFit: 'cover', borderRadius: 14, border: '5px solid #fff', boxShadow: '0 10px 0 rgba(61,15,69,.3)'}} />
    <div style={{...font, fontWeight: 700, fontSize: 44, lineHeight: '54px', color: PLUM, marginTop: 8, whiteSpace: 'nowrap', background: '#fff', borderRadius: 10, padding: '0 12px', display: 'inline-block', boxShadow: '0 4px 0 rgba(61,15,69,.25)'}}>{name}</div>
  </div>
);
const Wordmark: React.FC = () => <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560, filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />;
const Title1: React.FC = () => (
  <div style={{...font, position: 'absolute', left: 110, top: TITLE_TOP, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap', height: 150, textShadow: `0 7px 0 ${PLUM}88, 0 0 30px rgba(61,15,69,.5)`}}>{TITLE[0]}</div>
);
const Band: React.FC = () => (
  <div style={{position: 'absolute', left: 110, top: TITLE_TOP + 176, height: 150, display: 'inline-block'}}>
    <div style={{position: 'absolute', left: -24, right: -36, top: 0, bottom: 0, background: PLUM, borderRadius: 18, transform: 'skewX(-6deg)', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
    <div style={{...font, position: 'relative', paddingLeft: 14, paddingRight: 6, fontSize: BAND_PX, lineHeight: '150px', color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap'}}>{TITLE[1]}</div>
  </div>
);

// ---------- the main elephant ----------
const mainPose = (q: number): Pose => {
  const home = at(HOME.x, HOME.y, HOME.s);
  if (q < PRESSES[0]) return home;
  if (q < B.restart) { // power-cycles on every press: a full spin and a hop
    const k = Math.floor(q), d = q - k;
    return at(HOME.x, HOME.y - 90 * arc(seg(d, 0.05, 0.55)), HOME.s, (k % 2 ? -1 : 1) * 360 * eOut(seg(d, 0, 0.6)));
  }
  if (q < B.night) { const u = seg(q, B.restart, B.night); return at(mix(HOME.x, PROD.x, u), mix(HOME.y, PROD.y, u) - 720 * arc(u), mix(HOME.s, PROD.s, u), 720 * eOut(u)); }
  if (q < B.day) {
    const r = PASS.reduce((a, k, i) => a + (i % 2 ? 1 : -1) * 14 * kick(q, k, 5), 0);
    const sh = PASS.reduce((a, k) => a + 16 * kick(q, k, 7) * Math.sin((q - k) * 50), 0);
    return at(PROD.x + sh, PROD.y + 8 * Math.abs(r) / 14, PROD.s, r);
  }
  if (q < B.day + 0.8) { const u = seg(q, B.day, B.day + 0.8); return at(mix(PROD.x, MID.x, ease(u)), mix(PROD.y, MID.y, ease(u)) - 220 * arc(u), mix(PROD.s, MID.s, ease(u))); }
  if (q < B.rollback) { const r = -6 * kick(q, B.rejected, 5) + 5 * kick(q, B.approved, 5) - 4 * kick(q, B.selfStamp, 5); return at(MID.x, MID.y, MID.s, r); }
  if (q < B.clean) return {...home, hidden: true};
  return at(MID.x, MID.y + 600 * (1 - boing((q - B.clean) * 2.6)), MID.s);
};
const mainFilter = (q: number) => {
  if (PRESSES.some((k) => inP(q, k, k + 0.3))) return 'brightness(.25) grayscale(1)';
  if (PASS.some((k) => inP(q, k, k + 0.25))) return 'brightness(.8) sepia(1) saturate(4) hue-rotate(-30deg)';
  return undefined;
};

// static film grain (seed fixed), part of the background layer
const Grain: React.FC = () => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.1}}>
    <filter id="g198v3"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={3} /><feColorMatrix type="saturate" values="0" /></filter>
    <rect width={W} height={H} filter="url(#g198v3)" />
  </svg>
);

const World: React.FC<{q: number; t: number; stomp: number; arm: boolean; bg: boolean}> = ({q, t, stomp, arm, bg}) => {
  const nightO = q < B.night ? 0 : q < B.night + 0.6 ? seg(q, B.night, B.night + 0.6) : q < B.day ? 1 : 1 - seg(q, B.day, B.day + 0.5);
  const lightsOff = PRESSES.some((k) => inP(q, k, k + 0.16));
  const a1 = arm1Ext(q);
  return (
    <>
      {bg && (
        <>
          <div style={{position: 'absolute', inset: 0, background: PINK_BG}} />
          {nightO > 0 && <div style={{position: 'absolute', inset: 0, background: NIGHT_BG, opacity: nightO}} />}
          {Array.from({length: 9}, (_, i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 120 * (i + 1), height: 3, background: 'rgba(255,255,255,.18)'}} />)}
          <Grain />
          {inP(q, B.night, B.day + 0.4) && <Elephant e={clonePose(q)} hue={150} opacity={0.92} filter={`brightness(1.15) drop-shadow(0 0 22px ${CYAN}) drop-shadow(0 0 6px ${CYAN})`} />}
          <Elephant e={mainPose(q)} stomp={q < B.restart || q >= B.clean ? stomp : 0} filter={mainFilter(q)} />
          <CloneTag q={q} />
          {lightsOff && <div style={{position: 'absolute', inset: 0, background: '#0a0010', opacity: 0.72}} />}
          <RestartButton q={q} />
        </>
      )}
      {arm && a1 >= 0 && <Arm from={ARM1_FROM} tip={extTip(back(ARM1_FROM, ARM1_TIP), ARM1_TIP, a1)} tag="AI" led={pressed(q) ? RED : '#39b54a'} />}
      {bg && <Paper q={q} />}
      {bg && <Stamp q={q} />}
    </>
  );
};

// ---------- beat energy ----------
const BIG = [1, 2, 3, 4, 8, 9, 11, 17, 19, 21, 23, 25, 27, 29, 31, 32];
const INVERT = [B.restart, B.day, B.rejected, B.approved, B.rollback];
const KNOCKS: {k: number; x: number; y: number; r: number}[] = [
  {k: B.restart, x: -60, y: 20, r: -12}, {k: B.day, x: 0, y: -50, r: 9}, {k: B.rejected, x: 40, y: -20, r: 8}, {k: B.approved, x: 30, y: 40, r: -10}, {k: B.rollback, x: -30, y: -20, r: 8}];

// The show at video frame f. only: render one layer (transparent background) for the particles.
export const Show198: React.FC<{f: number; only?: Grp}> = ({f, only}) => {
  const t = f / FPS;
  const q = tk(t);
  const k = Math.floor(q);
  const dt = k >= 0 ? t - kt(k) : 9;
  const env = dt < 0.03 ? dt / 0.03 : Math.exp(-(dt - 0.03) * 8);
  const big = BIG.includes(k);
  const live = k >= 4 && k <= B.detonate; // the particles do the punch before the show takes over
  const hit = live ? env * (big ? 1.4 : 1) : 0;
  const alt = k % 2 ? 1 : -1;
  const inv = INVERT.some((s) => { const kk = Math.round(kt(s) * FPS); return f >= kk && f < kk + 2; });
  const punch = `scale(${1 + 0.03 * hit}) rotate(${alt * 0.9 * hit}deg) translateY(${-10 * hit}px)`;
  const knock = KNOCKS.reduce((a, n) => { const e = kick(q, n.k, 3.5); return {x: a.x + n.x * e * Math.cos((q - n.k) * 9), y: a.y + n.y * e, r: a.r + n.r * e}; }, {x: 0, y: 0, r: 0});
  const knocks: Knock[] = [0, 1].map((i) => {
    const b = live ? env : 0;
    return {s: 1 + (big ? 0.12 : 0.07) * b, r: 0.6 * ((i % 2 ? 1 : -1) * alt * (big ? 4 : 2.5) * b + knock.r * (i ? 0.7 : 1)), x: knock.x * (i ? 0.6 : 1), y: knock.y};
  });
  const shred = inP(q, B.rollback, B.rollback + 1.9);
  const NS = 14, sw = W / NS;
  const show = (g: Grp) => !only || only === g;
  const shake = live ? alt * 0.5 * hit + knock.r * 0.15 : 0;
  const filter = inv && !only ? 'invert(1) hue-rotate(180deg)' : undefined;
  return (
    <AbsoluteFill style={{background: only ? undefined : TERM, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: punch, filter}}>
        {q < B.rollback && (show('bg') || show('arm')) && <World q={q} t={t} stomp={hit} arm={show('arm')} bg={show('bg')} />}
        {show('bg') && shred && Array.from({length: NS}, (_, i) => {
          const d = Math.max(0, (q - B.rollback - (i % 2) * 0.06 - rnd(i) * 0.15) * BEAT);
          const y = 1500 * d * d + 150 * d, r = (rnd(i + 5) - 0.5) * 120 * d, gap = (i - NS / 2) * 12 * seg(q, B.rollback, B.rollback + 0.1);
          if (y > H + 300) return null;
          return (
            <AbsoluteFill key={i} style={{clipPath: `inset(0 ${W - (i + 1) * sw}px 0 ${i * sw}px)`, transform: `translate(${gap}px, ${y}px) rotate(${r}deg)`, transformOrigin: `${(i + 0.5) * sw}px 0px`}}>
              <World q={B.rollback - 0.05} t={t} stomp={0} arm bg />
            </AbsoluteFill>
          );
        })}
        {show('bg') && q >= B.clean - 0.4 && (
          <>
            {Array.from({length: 9}, (_, i) => (
              <div key={i} style={{position: 'absolute', left: (i % 2 ? 1 : -1) * W * (1 - eOut(seg(q, B.clean - 0.4 + i * 0.02, B.clean))), top: i * 120, width: W, height: 121,
                background: PINK_BG, backgroundSize: `${W}px ${H}px`, backgroundPosition: `0 ${-i * 120}px`}} />
            ))}
            {q >= B.clean && <Grain />}
            <Elephant e={mainPose(q)} stomp={hit} />
          </>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `rotate(${shake}deg)`, transformOrigin: '600px 400px', filter}}>
        {show('logo') && <Wordmark />}
        {show('title1') && <Title1 />}
        {show('band') && <Band />}
      </AbsoluteFill>
      {HOSTS.map((h, i) => (show(i ? 'nik' : 'kirk') ? <Photo key={h.name} src={h.photo ?? ''} name={h.name} x={HOST_X[i]} k={knocks[i]} /> : null))}
      {!only && (
        <>
          <Bombs q={q} t={t} />
          <ZeroCost q={q} cx={CLONE.x} cy={724} />
          {arm3Ext(q) >= 0 && <Arm from={ARM3_FROM} tip={extTip(back(ARM3_FROM, ARM3_TIP), ARM3_TIP, arm3Ext(q))} tag="ACTOR" led="#39b54a" />}
          <Meter q={q} />
          <Burst q={q} beat={B.restart} text="RESTART!" x={1180} y={520} color={RED} size={130} dur={2} />
          <Label q={q} />
        </>
      )}
      {show('michael') && <Michael q={q} />}
      {!only && q >= B.glint && [ELE.glintL, ELE.glintR].map(([gx, gy], i) => {
        const p = imgPt(mainPose(q), gx, gy), d = q - B.glint - 0.15 * i;
        return <Sparkle key={i} x={p.x} y={p.y} s={d > 0 ? 0.8 * Math.sin(Math.min(1, d / 0.45) * Math.PI) : 0} rot={60 * d} />;
      })}
    </AbsoluteFill>
  );
};
