// Episode 198 cold open, bold and medium (medium = graphics at 70% of bold, smaller pull-back).
// When a graphic lands, the picture pulls back: the tile row (tiles + name labels, y 205-745) scales
// down about its top edge over the layout background (bg.png: gradient + header), which frees the whole
// lower area and the side margins for big graphics. Faces are never covered: graphics live only in
// the freed areas, and the graphics layer is clipped at y 900 (nothing in the bottom 180 px).
// Reboot after "restart server": dark blackout with one large terminal line and a blinking cursor.
// Whips pan a wrapped copy of the picture, so no black shows at the frame edge.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {BTN, FIVE_OF_FIVE, FPS, HANDLE, OFF, PRESS, S, STAMPS, Variant, W} from '../spec';
import {Clips, DynSmall, Glitch, camera, shake} from './Dyn';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (f: number, a: number, b: number, v0: number, v1: number) => interpolate(f, [a, b], [v0, v1], clamp);
const pop = (f: number, at: number, damping = 9, stiffness = 220) => spring({frame: f - at, fps: FPS, config: {damping, stiffness, mass: 0.6}});
const rnd = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const RED = '#e0262b', DARK = '#7d1013';
const font = 'Lato, "Helvetica Neue", Arial, sans-serif', mono = '"JetBrains Mono", Menlo, monospace';

const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      new FontFace('Lato', `url(${staticFile('fonts/Lato-900.woff2')})`, {weight: '900'}).load(),
      new FontFace('JetBrains Mono', `url(${staticFile('fonts/JetBrainsMono-Medium.ttf')})`).load(),
    ]).then((fs) => fs.forEach((x) => document.fonts.add(x))).finally(() => continueRender(h));
  }, [h]);
};

// Geometry of the pull-back
const CROP = {x: 90, y: 205, w: 1740, h: 540};
// stamps: the pull-back holds through the power-down (OFF..OFF+3), so no punch-in frame shows there;
// errors: the pull-back starts 8 frames before the first icon, so the labels are up before icons land
const WINDOWS: [number, number][] = [[W.perfectly - 2, S[1]], [S[2], OFF + 3], [W.doNot - 2, S[4]], [W.mistakes - 8, BTN]];
type G = {z: number; P: number; FT: number; H: number; side: number};
const geo = (v: Variant): G => {
  const z = v === 'bold' ? 1 : 0.7, P = v === 'bold' ? 0.78 : 0.86;
  const FT = CROP.y + CROP.h * P + 8; // first free row under the scaled labels
  return {z, P, FT, H: 895 - FT, side: 960 - (960 - CROP.x - 30) * P - 14};
};
const pullAmt = (f: number) => {
  for (const [a, b] of WINDOWS) if (f >= a && f < b) return pop(f, a, 12, 260);
  return 0;
};

// SAFE: slams in under Kirk on "perfectly", cracks on "right?" (halves split and fall, clipped at 900)
const Safe: React.FC<{f: number; g: G; bold: boolean}> = ({f, g, bold}) => {
  if (f < W.perfectly || f >= S[1]) return null;
  const {z, P, FT, H} = g, w = 640 * z, h = 210 * z, cx = 960 + (520 - 960) * P;
  const p = pop(f, W.perfectly, 8, 240), crack = W.rightEnd + 2, broken = f >= crack, c = broken ? lerp(f, crack, S[1] - 1, 0, 1) : 0;
  const slam = bold ? 2.2 - 1.2 * p : 0.3 + 0.7 * p;
  const half = (clip: string, dir: number) => (
    <div style={{position: 'absolute', inset: 0, clipPath: clip, transform: `translate(${dir * 70 * c}px, ${60 * c * c}px) rotate(${dir * 18 * c}deg)`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 36 * z, background: broken ? '#a32626' : '#16a34a', border: `${10 * z}px solid #fff`, boxShadow: `0 ${14 * z}px 0 ${broken ? '#5c1010' : '#0d5e2b'}, 0 ${20 * z}px 40px rgba(0,0,0,.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26 * z, color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 150 * z, letterSpacing: 6 * z}}>
        <span style={{fontSize: 130 * z}}>{broken ? '✕' : '✓'}</span>SAFE
      </div>
    </div>
  );
  const L = '0% 0%, 51% 0%, 44% 28%, 57% 50%, 45% 74%, 53% 100%, 0% 100%', R = '51% 0%, 100% 0%, 100% 100%, 53% 100%, 45% 74%, 57% 50%, 44% 28%';
  return (
    <div style={{position: 'absolute', left: cx - w / 2, top: FT + (H - h) / 2 - 6, width: w, height: h, transform: `scale(${slam})`, opacity: Math.min(1, p * 2)}}>
      {broken ? <>{half(`polygon(${L})`, -1)}{half(`polygon(${R})`, 1)}</> : half('none', 0)}
    </div>
  );
};

// Five RESTART stamps on the beat, then a huge 5/5 (what Nik says: five out of five)
const Stamps: React.FC<{f: number; g: G; bold: boolean}> = ({f, g, bold}) => {
  if (f < STAMPS[0] || f >= OFF) return null;
  const {z, FT, H} = g, w = 280 * z, h = 128 * z, step = 296 * z, fw = 330 * z;
  const x0 = (1920 - (4 * step + w + 40 * z + fw)) / 2, top = FT + (H - h) / 2 - LIFT;
  const q = f >= FIVE_OF_FIVE ? pop(f, FIVE_OF_FIVE, 7, 260) : 0;
  return (
    <>
      {STAMPS.map((at, k) => {
        if (f < at) return null;
        const p = lerp(f, at, at + 3, 0, 1);
        return <div key={k} style={{position: 'absolute', left: x0 + k * step, top, width: w, height: h, transform: `rotate(${(rnd(k + 3) - 0.5) * 18}deg) scale(${(bold ? 3 : 2.2) - (bold ? 2 : 1.2) * p})`, opacity: Math.min(1, p * 2), border: `${11 * z}px solid ${RED}`, borderRadius: 16 * z, color: RED, fontFamily: font, fontWeight: 900, fontSize: 54 * z, letterSpacing: 2 * z, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.8)', boxShadow: `0 ${8 * z}px 24px rgba(0,0,0,.18)`}}>RESTART</div>;
      })}
      {q > 0 ? <div style={{position: 'absolute', left: x0 + 4 * step + w + 40 * z, top: FT - 6 - LIFT, width: fw, height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.3 + 0.7 * q}) rotate(${-6 * (1 - q)}deg)`, opacity: Math.min(1, q * 2), fontFamily: font, fontWeight: 900, fontSize: 210 * z, color: RED, textShadow: `0 ${8 * z}px 0 #fff, 0 ${14 * z}px 24px rgba(0,0,0,.25)`}}>5/5</div> : null}
    </>
  );
};

// Scope tag: what Nik says, "in one task" (task C18 in the post). It slams into the free lower area
// on "task", then shrinks to a caption row under the stamps on the first stamp, and stays with them.
const LIFT = 12, CAP_Y = 869; // stamps row lifted by LIFT; caption row centre (text ends by y 892)
const ScopeTag: React.FC<{f: number; g: G; bold: boolean}> = ({f, g, bold}) => {
  if (f < W.task || f >= OFF) return null;
  const {FT, H} = g, cap = bold ? 40 : 36, big = bold ? 2.4 : 2;
  const p = pop(f, W.task, 8, 240), m = lerp(f, STAMPS[0] - 2, STAMPS[0] + 3, 0, 1), e = 1 - Math.pow(1 - m, 3);
  const cy = FT + H / 2 + (CAP_Y - (FT + H / 2)) * e, sc = (big + (1 - big) * e) * (m > 0 ? 1 : (bold ? 1.6 - 0.6 * p : 0.3 + 0.7 * p));
  return (
    <div style={{position: 'absolute', left: 0, width: 1920, top: cy - cap * 0.7, height: cap * 1.4, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: Math.min(1, p * 2)}}>
      <div style={{transform: `scale(${sc})`, padding: `${cap * 0.12}px ${cap * 0.45}px`, borderRadius: cap * 0.3, background: '#3b0f3f', color: '#fff', fontFamily: font, fontWeight: 900, fontSize: cap, lineHeight: `${cap * 1.1}px`, letterSpacing: 2, whiteSpace: 'nowrap'}}>ONE TASK (C18)</div>
    </div>
  );
};

// DO NOT RESTART: a big red button with a hazard frame; it goes down just before "Yeah."
const Button: React.FC<{f: number; g: G; bold: boolean}> = ({f, g, bold}) => {
  if (f < W.doNot || f >= S[4]) return null;
  const {z, FT, H} = g, w = 1040 * z, h = 220 * z;
  const p = pop(f, W.doNot, 8, 240), down = f >= PRESS ? Math.min(1, (f - PRESS + 1) / 2) : 0;
  const glow = f >= PRESS ? Math.max(0, 1 - (f - PRESS) / 10) : 0;
  return (
    <div style={{position: 'absolute', left: 960 - w / 2, top: FT + (H - h) / 2, width: w, height: h, transform: `scale(${bold ? 2 - p : 0.3 + 0.7 * p})`, opacity: Math.min(1, p * 2)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 44 * z, background: 'repeating-linear-gradient(45deg,#ffd400 0 30px,#1d1d1d 30px 60px)', boxShadow: `0 ${16 * z}px 40px rgba(0,0,0,.3)`}} />
      <div style={{position: 'absolute', left: 30 * z, right: 30 * z, top: (22 + 20 * down) * z, bottom: (22 - 6 * down) * z, borderRadius: 30 * z, background: RED, boxShadow: `0 ${(18 - 16 * down) * z}px 0 ${DARK}, inset 0 ${8 * z}px 0 rgba(255,255,255,.35), 0 0 ${80 * glow}px ${30 * glow}px rgba(255,60,60,${0.8 * glow})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 96 * z, letterSpacing: 4 * z}}>DO NOT RESTART</div>
    </div>
  );
};

// Errors: one big icon on "mistakes", then it doubles every 2 frames ("at scale") over the freed areas
const Errors: React.FC<{f: number; g: G; bold: boolean}> = ({f, g, bold}) => {
  if (f < W.mistakes || f >= BTN) return null;
  const {z, FT, H, side, P} = g;
  const slots: {x: number; y: number; s: number}[] = [];
  const add = (x0: number, x1: number, y0: number, y1: number, n: number, seed: number, smin: number, smax: number) => {
    for (let k = 0; k < n; k++) { const s = (smin + rnd(seed + k + 900) * (smax - smin)) * z; slots.push({x: x0 + rnd(seed + k) * Math.max(0, x1 - x0 - s), y: y0 + rnd(seed + k + 500) * Math.max(0, y1 - y0 - s), s}); }
  };
  add(10, 1910, FT, 895, bold ? 64 : 40, 1, 70, 120);
  add(8, side, 225, FT, bold ? 16 : 9, 300, 60, 100);
  add(1920 - side, 1912, 225, FT, bold ? 16 : 9, 400, 60, 100);
  const gap = 2 * 40 * P - 10; if (bold) add(960 - gap / 2, 960 + gap / 2, 230, FT - 60, 5, 600, 44 / z, 44 / z);
  // name labels in the pulled-back picture (layout: Kirk x 123-275, Nik x 1002-1239, y 700-722); an icon
  // (with room for its rotation and pop) stays 24 px clear of them
  const lab = [[123, 275], [1002, 1239]].map(([a, b]) => ({x0: 960 + (a - 960) * P - 24, x1: 960 + (b - 960) * P + 24, y0: CROP.y + (700 - CROP.y) * P - 24, y1: CROP.y + (722 - CROP.y) * P + 24}));
  const clear = (s: {x: number; y: number; s: number}) => { const r = s.s * 0.25; return lab.every((l) => s.x + s.s + r < l.x0 || s.x - r > l.x1 || s.y + s.s + r < l.y0 || s.y - r > l.y1); };
  for (let k = slots.length - 1; k >= 0; k--) if (!clear(slots[k])) slots.splice(k, 1);
  const n = f < W.at - 2 ? 0 : Math.min(slots.length, Math.pow(2, Math.floor((f - (W.at - 2)) / 2) + 1));
  const first = pop(f, W.mistakes, 7, 260), fs = 170 * z;
  const icon = (x: number, y: number, s: number, sc: number, rot: number, key: number) => (
    <div key={key} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s * 0.24, background: RED, color: '#fff', border: `${Math.max(3, s * 0.06)}px solid #fff`, fontFamily: font, fontWeight: 900, fontSize: s * 0.72, lineHeight: `${s * 0.88}px`, textAlign: 'center', transform: `scale(${sc}) rotate(${rot}deg)`, boxShadow: `0 ${s * 0.08}px ${s * 0.15}px rgba(0,0,0,.3)`}}>!</div>
  );
  return (
    <>
      {slots.slice(0, n).map((s, k) => icon(s.x, s.y, s.s, pop(f, W.at - 2 + 2 * Math.floor(Math.log2(k + 1)), 10, 320), (rnd(k) - 0.5) * 30, k))}
      {icon(960 - fs / 2, FT + (H - fs) / 2, fs, first, -6 + 6 * first, 999)}
    </>
  );
};

// Terminal on black during the reboot: one large line (readable on a phone in the 0.5 s it shows),
// "$ pg_ctl restart" typed in 3 frames, blinking cursor.
const Terminal: React.FC<{f: number}> = ({f}) => {
  const t0 = OFF + 3, cmd = '$ pg_ctl restart', n = Math.min(cmd.length, Math.floor((f - t0 + 1) * 6));
  const cursor = Math.floor(f / 3) % 2 === 0, fs = 120;
  return (
    <AbsoluteFill style={{background: '#050505', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 17 * fs * 0.6, marginTop: -60, fontFamily: mono, fontSize: fs, lineHeight: `${fs * 1.2}px`, color: '#d8f5d0', whiteSpace: 'pre'}}>
        {cmd.slice(0, n)}{cursor ? <span style={{background: '#d8f5d0', color: '#050505'}}>{'\u00a0'}</span> : null}
      </div>
    </AbsoluteFill>
  );
};

export const Dyn: React.FC<{variant: Variant}> = ({variant: v}) => {
  useFonts();
  const f = useCurrentFrame();
  if (v === 'restrained') return <DynSmall variant={v} />;
  const bold = v === 'bold', g = geo(v);
  const k = pullAmt(f), sc = 1 - (1 - g.P) * k;
  const c = camera(v, f), sh = shake(v, f);
  if (k > 0) { c.s = 1; c.o = {x: 960, y: 540}; }
  // glitch on "restart server"; then the picture drops to dark (no white), black terminal, picture back
  const gStart = bold ? W.restart : W.serverEnd - 6;
  const gl = f >= gStart && f < OFF ? lerp(f, gStart, W.serverEnd, 0.3, 1) : 0;
  let sy = 1, bright = 1;
  const term = f >= OFF + 3 && f < S[3];
  if (f >= OFF && f < OFF + 3) { sy = lerp(f, OFF, OFF + 2, 1, 0.02); bright = lerp(f, OFF, OFF + 2, 0.8, 0.2); }
  if (f >= S[3] && f < S[3] + 4) { bright = lerp(f, S[3], S[3] + 4, 0.25, 1); if (bold) sy = lerp(f, S[3], S[3] + 2, 0.4, 1); }
  // the meeting-bot tile (the layout's own, in place) wiggles on "agents"
  const bot = f >= W.agents && f < W.agents + 14 ? Math.sin((f - W.agents) * 1.3) * (1 - (f - W.agents) / 14) : 0;
  const stop = bold && f >= BTN && f < BTN + 3 ? 1 - (f - BTN) / 3 : 0;
  const mask = 'linear-gradient(to bottom, transparent 0, #000 12px, #000 calc(100% - 14px), transparent 100%), linear-gradient(to right, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)';
  const pic = k > 0 ? (
    <div style={{position: 'absolute', left: CROP.x, top: CROP.y, width: CROP.w, height: CROP.h, overflow: 'hidden', transformOrigin: `${960 - CROP.x}px 0px`, transform: `scale(${sc})`, WebkitMaskImage: mask, WebkitMaskComposite: 'source-in', maskImage: mask, maskComposite: 'intersect'} as React.CSSProperties}>
      <div style={{position: 'absolute', left: -CROP.x, top: -CROP.y, width: 1920, height: 1080}}><Clips /><Glitch f={f} amt={gl} /></div>
    </div>
  ) : (<><Clips /><Glitch f={f} amt={gl} />{bot !== 0 ? <div style={{position: 'absolute', left: 1656, top: 880, width: 240, height: 135, overflow: 'hidden', borderRadius: 10, transformOrigin: '50% 100%', transform: `rotate(${bot * 9}deg) scale(${1 + Math.abs(bot) * 0.12})`}}>
      <div style={{position: 'absolute', left: -1656, top: -880, width: 1920, height: 1080}}><Freeze frame={W.agents - S[1] + HANDLE}><OffthreadVideo src={staticFile('L2.mp4')} muted style={{width: 1920, height: 1080}} /></Freeze></div>
    </div> : null}</>);
  const scene = (
    <AbsoluteFill style={{transformOrigin: `${c.o.x}px ${c.o.y}px`, transform: `scale(${c.s})`}}>
      {k > 0 ? <Img src={staticFile('bg.png')} style={{position: 'absolute', width: 1920, height: 1080}} /> : null}
      {pic}
    </AbsoluteFill>
  );
  // during a whip the picture moves sideways; a copy one frame-width away fills the side it uncovers
  const wrap = c.tx !== 0 ? c.tx - Math.sign(c.tx) * 1920 : 0;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {term ? <Terminal f={f} /> : (<AbsoluteFill style={{filter: c.blur > 0.5 ? `blur(${c.blur}px)` : undefined}}>
        {wrap !== 0 ? <AbsoluteFill style={{transform: `translate(${wrap + sh.x}px, ${sh.y}px) scale(1, ${sy})`, filter: `brightness(${bright})`}}>{scene}</AbsoluteFill> : null}
        <AbsoluteFill style={{transform: `translate(${c.tx + sh.x}px, ${sh.y}px) scale(1, ${sy})`, filter: `brightness(${bright})`}}>
          {scene}
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 900, overflow: 'hidden'}}>
            <Safe f={f} g={g} bold={bold} />
            <Stamps f={f} g={g} bold={bold} />
            <ScopeTag f={f} g={g} bold={bold} />
            <Button f={f} g={g} bold={bold} />
            <Errors f={f} g={g} bold={bold} />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>)}
      {stop > 0 ? <AbsoluteFill style={{background: '#fff', opacity: 0.45 * stop}} /> : null}
      {f < 3 ? <AbsoluteFill style={{background: '#000', opacity: 1 - f / 3}} /> : null}
    </AbsoluteFill>
  );
};
