// Episode 198 dynamic cold open picture. Video only; mix.ts makes the sound and build.sh muxes.
// Layers: the laid-out line clips (moved by punch-ins, whips, glitch, CRT off/on), then graphics in
// free areas only: the band under the name labels (y 740-895), the side margins and the gap between
// tiles. Nothing is drawn on a tile (no marks on faces or heads) and nothing below y 900, except the
// layout's own meeting-bot tile, which only wiggles in place.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {BTN, END, FPS, FZ, FIVE_OF_FIVE, HANDLE, PRESS, S, SPEECH, STAMPS, Variant, W} from '../spec';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (f: number, a: number, b: number, v0: number, v1: number) => interpolate(f, [a, b], [v0, v1], clamp);
const pop = (f: number, at: number, damping = 9, stiffness = 220) => spring({frame: f - at, fps: FPS, config: {damping, stiffness, mass: 0.6}});
const rnd = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const KIRK = {x: 520, y: 690}, NIK = {x: 1400, y: 690}, MID = {x: 960, y: 540};
const RED = '#e0262b', INK = '#3b0f3f';
const font = 'Lato, "Helvetica Neue", Arial, sans-serif';

type Cam = {s: number; o: {x: number; y: number}; tx: number; blur: number};
// Camera per variant: punch-in scale and origin (the speaking tile, origin at its label line so the tile
// grows upward and the band under it stays free), whips (fast x move with blur) around some cuts.
const camera = (v: Variant, f: number): Cam => {
  const c: Cam = {s: 1, o: MID, tx: 0, blur: 0};
  const L = S.findIndex((s, i) => f >= s && (i === S.length - 1 || f < S[i + 1]));
  const ease = (x: number) => 1 - Math.pow(1 - x, 3);
  if (v === 'restrained') {
    const i = Math.max(0, L); const who = i === 1 || i === 2 ? NIK : KIRK;
    if (f < BTN) { c.o = i === 3 && f >= W.yeah ? NIK : who; c.s = lerp(f, S[i], S[i] + SPEECH[i], 1, 1.04); }
    return c;
  }
  const big = v === 'bold';
  if (f < S[0]) { if (big) { const k = ease(lerp(f, 0, 10, 0, 1)); c.s = 1.35 - 0.35 * k; c.blur = 8 * (1 - k); } return c; }
  if (L === 0) { c.o = KIRK; c.s = f < W.right ? lerp(f, S[0], W.right, 1, big ? 1.12 : 1.08) : (big ? 1.26 : 1.15); }
  if (L === 1) { c.o = NIK; c.s = big ? 1.2 : 1.1; }
  if (L === 2) { c.o = NIK; c.s = big ? 1.1 + 0.3 * (1 - ease(lerp(f, S[2], S[2] + 5, 0, 1))) : lerp(f, S[2], S[2] + SPEECH[2], 1, 1.06); }
  if (L === 3) {
    if (f < W.yeah) { c.o = KIRK; c.s = big ? 1.15 : 1; }
    else { c.o = NIK; c.s = big ? lerp(f, W.yeah, S[4] - 4, 1.2, 1.3) : 1.15; }
  }
  if (L === 4) { c.o = MID; c.s = 1; }
  // whips: out over the last 3 frames before a cut, in over the first 3 after it (dir: +1 = to the left)
  const whips = big ? [S[1], S[2], S[4]] : [S[1], S[4]];
  for (const w of whips) {
    if (f >= w - 3 && f < w) { const k = (f - (w - 4)) / 3; c.tx = -900 * k * k; c.blur = 18 * k; }
    if (f >= w && f < w + 3) { const k = 1 - (f - w + 1) / 3; c.tx = 900 * k * k; c.blur = 18 * k; }
  }
  // bold: a small beat pulse in the gaps between lines, and a punch on the button
  if (big && L === 2 && f >= S[2] + SPEECH[2]) c.s *= 1;
  return c;
};

// shake for bold hits (stamps, button press, final stop)
const shake = (v: Variant, f: number) => {
  if (v !== 'bold') return {x: 0, y: 0};
  const hits = [...STAMPS, PRESS, BTN, W.rightEnd + 2];
  let a = 0; for (const h of hits) if (f >= h && f < h + 6) a = Math.max(a, (1 - (f - h) / 6) * 10);
  return {x: (rnd(f) - 0.5) * 2 * a, y: (rnd(f + 99) - 0.5) * 2 * a};
};

// The picture of line i at global frame f (handles give real motion before and after the speech).
const LineClip: React.FC<{i: number; from: number; to: number}> = ({i, from, to}) => (
  <Sequence from={from} durationInFrames={to - from} layout="none">
    <OffthreadVideo src={staticFile(`L${i + 1}.mp4`)} startFrom={from - S[i] + HANDLE} muted style={{position: 'absolute', width: 1920, height: 1080}} />
  </Sequence>
);

const Clips: React.FC = () => (
  <>
    <LineClip i={0} from={0} to={S[1]} />
    <LineClip i={1} from={S[1]} to={S[2]} />
    <LineClip i={2} from={S[2]} to={S[3]} />
    <LineClip i={3} from={S[3]} to={S[4]} />
    <LineClip i={4} from={S[4]} to={S[4] + SPEECH[4]} />
    <Sequence from={S[4] + SPEECH[4]} durationInFrames={END - S[4] - SPEECH[4]} layout="none">
      <Freeze frame={0}><OffthreadVideo src={staticFile('L5.mp4')} startFrom={FZ} muted style={{position: 'absolute', width: 1920, height: 1080}} /></Freeze>
    </Sequence>
  </>
);

// Glitch: horizontal slices of the picture slid sideways, with a red/cyan split (bold, medium).
const Glitch: React.FC<{f: number; amt: number}> = ({f, amt}) => {
  if (amt <= 0) return null;
  const slices = Array.from({length: 7}, (_, k) => {
    const y = Math.floor(rnd(f * 7 + k) * 1000), h = 20 + Math.floor(rnd(f * 13 + k) * 90), dx = (rnd(f * 3 + k) - 0.5) * 160 * amt;
    return <div key={k} style={{position: 'absolute', inset: 0, clipPath: `inset(${y}px 0 ${Math.max(0, 1080 - y - h)}px 0)`, transform: `translateX(${dx}px)`}}><Clips /></div>;
  });
  return (
    <>
      <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.55 * amt, transform: `translateX(${14 * amt}px)`, filter: 'sepia(1) saturate(6) hue-rotate(-50deg)'}}><Clips /></div>
      <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.45 * amt, transform: `translateX(${-14 * amt}px)`, filter: 'sepia(1) saturate(6) hue-rotate(140deg)'}}><Clips /></div>
      {slices}
    </>
  );
};

// SAFE badge under Kirk: pops in on "perfectly", cracks on "right?" (the two halves part and drop).
const Safe: React.FC<{v: Variant; f: number}> = ({v, f}) => {
  if (f < W.perfectly || f >= S[1]) return null;
  const p = pop(f, W.perfectly), crack = W.rightEnd + (v === 'restrained' ? 3 : 2);
  const c = f >= crack ? lerp(f, crack, S[1] - 1, 0, 1) : 0, broken = f >= crack;
  const fall = v === 'restrained' ? 0 : c;
  const badge = (clip: string, dir: number) => (
    <div style={{position: 'absolute', inset: 0, clipPath: clip, transform: `translate(${dir * 40 * fall}px, ${24 * fall}px) rotate(${dir * 14 * fall}deg)`, opacity: broken && v !== 'restrained' ? 1 - 0.6 * c : 1}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 26, background: broken ? (v === 'restrained' ? '#8d8d8d' : '#9c2b2b') : '#1f9d55', border: '6px solid #fff', boxShadow: '0 8px 24px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 76, letterSpacing: 4}}>
        <span style={{fontSize: 70}}>{broken ? '✕' : '✓'}</span>SAFE
      </div>
    </div>
  );
  const zig = '0% 0%, 52% 0%, 45% 30%, 56% 52%, 46% 75%, 53% 100%, 0% 100%';
  const zigR = '52% 0%, 100% 0%, 100% 100%, 53% 100%, 46% 75%, 56% 52%, 45% 30%';
  return (
    <div style={{position: 'absolute', left: 520 - 190, top: 752, width: 380, height: 128, transform: `scale(${0.3 + 0.7 * p})`}}>
      {broken ? <>{badge(`polygon(${zig})`, -1)}{badge(`polygon(${zigR})`, 1)}</> : badge('none', 0)}
      {broken && f < crack + 4 && v !== 'restrained' ? <div style={{position: 'absolute', inset: -30, background: '#fff', opacity: 1 - (f - crack) / 4, borderRadius: 40}} /> : null}
    </div>
  );
};

// Five RESTART stamps slam into the band on beats, then "5/5" (what Nik says: five out of five).
const Stamps: React.FC<{v: Variant; f: number}> = ({v, f}) => {
  const end = v === 'bold' ? W.serverEnd : S[3];
  if (f < STAMPS[0] || f >= end) return null;
  const items = STAMPS.map((at, k) => {
    if (f < at) return null;
    const p = lerp(f, at, at + (v === 'restrained' ? 4 : 3), 0, 1);
    const s = v === 'restrained' ? 0.85 + 0.15 * p : 2.4 - 1.4 * p;
    return (
      <div key={k} style={{position: 'absolute', left: 130 + k * 255, top: 768, width: 240, height: 92, transform: `rotate(${(rnd(k + 3) - 0.5) * 16}deg) scale(${s})`, opacity: Math.min(1, p * 1.5), border: `7px solid ${RED}`, borderRadius: 12, color: RED, fontFamily: font, fontWeight: 900, fontSize: 40, letterSpacing: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.55)'}}>RESTART</div>
    );
  });
  const q = f >= FIVE_OF_FIVE ? (v === 'restrained' ? lerp(f, FIVE_OF_FIVE, FIVE_OF_FIVE + 5, 0, 1) : pop(f, FIVE_OF_FIVE, 8, 260)) : 0;
  return (
    <>
      {items}
      {q > 0 ? <div style={{position: 'absolute', left: 1430, top: 742, width: 330, height: 146, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${v === 'restrained' ? 1 : 0.4 + 0.6 * q})`, opacity: Math.min(1, q * 1.4), fontFamily: font, fontWeight: 900, fontSize: 132, color: RED, textShadow: '0 4px 0 #fff'}}>5/5</div> : null}
    </>
  );
};

// DO NOT RESTART: a big red button in the band; it goes down just before "Yeah."
const Button: React.FC<{v: Variant; f: number}> = ({v, f}) => {
  if (f < W.doNot || f >= S[4]) return null;
  const p = v === 'restrained' ? lerp(f, W.doNot, W.doNot + 5, 0, 1) : pop(f, W.doNot);
  const down = f >= PRESS ? Math.min(1, (f - PRESS + 1) / 2) : 0;
  const flash = f >= PRESS && v !== 'restrained' ? Math.max(0, 1 - (f - PRESS) / 8) : 0;
  return (
    <div style={{position: 'absolute', left: 960 - 330, top: 748, width: 660, height: 140, transform: `scale(${v === 'restrained' ? 1 : 0.3 + 0.7 * p})`, opacity: Math.min(1, p * 1.5)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 30, background: 'repeating-linear-gradient(45deg,#ffd400 0 22px,#222 22px 44px)'}} />
      <div style={{position: 'absolute', left: 22, right: 22, top: 16 + 12 * down, bottom: 16 - 4 * down, borderRadius: 22, background: RED, boxShadow: `0 ${12 - 10 * down}px 0 #7d1013, inset 0 6px 0 rgba(255,255,255,.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: font, fontWeight: 900, fontSize: 60, letterSpacing: 3, filter: `brightness(${1 + 0.8 * flash})`}}>DO NOT RESTART</div>
    </div>
  );
};

// One error icon on "mistakes", then it doubles every 2 frames ("at scale") into free areas; gone at the button.
const ERR_SLOTS = (() => {
  const out: {x: number; y: number}[] = [];
  const add = (x0: number, x1: number, y0: number, y1: number, n: number, seed: number) => { for (let k = 0; k < n; k++) out.push({x: x0 + rnd(seed + k) * (x1 - x0), y: y0 + rnd(seed + k + 500) * (y1 - y0)}); };
  add(30, 1600, 750, 830, 26, 1); add(30, 1560, 830, 845, 8, 40); add(10, 62, 240, 700, 10, 80); add(1822, 1866, 240, 820, 10, 120); add(932, 944, 240, 680, 7, 160);
  return out;
})();
const Errors: React.FC<{v: Variant; f: number}> = ({v, f}) => {
  if (f < W.mistakes || f >= BTN) return null;
  const pool = v === 'bold' ? ERR_SLOTS : ERR_SLOTS.slice(0, v === 'medium' ? 22 : 12);
  let n = 1;
  if (v === 'restrained') n = Math.min(pool.length, 1 + Math.max(0, Math.floor((f - W.at + 2) / 1)));
  else n = Math.min(pool.length, f < W.at - 2 ? 1 : Math.pow(2, Math.floor((f - (W.at - 2)) / 2) + 1));
  const first = {x: 470, y: 780};
  return (
    <>
      {pool.slice(0, n).map((s, k) => {
        const at = k === 0 ? W.mistakes : W.at - 2 + 2 * Math.floor(Math.log2(k + 1));
        const p = pop(f, at, 10, 300), sz = k === 0 ? 76 : 42 + rnd(k + 7) * 10, pos = k === 0 ? first : s;
        return <div key={k} style={{position: 'absolute', left: pos.x, top: pos.y, width: sz, height: sz, borderRadius: sz * 0.22, background: RED, color: '#fff', border: '3px solid #fff', fontFamily: font, fontWeight: 900, fontSize: sz * 0.7, lineHeight: `${sz - 6}px`, textAlign: 'center', transform: `scale(${p}) rotate(${(rnd(k) - 0.5) * 24}deg)`, boxShadow: '0 3px 8px rgba(0,0,0,.25)'}}>!</div>;
      })}
    </>
  );
};

export const Dyn: React.FC<{variant: Variant}> = ({variant: v}) => {
  const f = useCurrentFrame();
  const c = camera(v, f), sh = shake(v, f);
  // glitch on "restart server", CRT off after it, black, CRT on at the next line (bold); shorter in medium
  const gStart = v === 'bold' ? W.restart : W.serverEnd - 6;
  const g = v !== 'restrained' && f >= gStart && f < S[2] + SPEECH[2] ? lerp(f, gStart, W.serverEnd, 0.3, 1) : 0;
  const offStart = S[2] + SPEECH[2];
  let sy = 1, sx = 1, bright = 1, black = false;
  if (v === 'bold') {
    if (f >= offStart && f < offStart + 4) { sy = lerp(f, offStart, offStart + 3, 1, 0.012); bright = 2.2; }
    if (f >= offStart + 4 && f < offStart + 7) { sy = 0.012; sx = lerp(f, offStart + 4, offStart + 6, 1, 0.02); bright = 3; }
    if (f >= offStart + 7 && f < S[3]) black = true;
    if (f >= S[3] && f < S[3] + 4) { sy = lerp(f, S[3], S[3] + 3, 0.012, 1); bright = lerp(f, S[3], S[3] + 4, 3, 1); }
  } else if (v === 'medium') {
    if (f >= offStart + 2 && f < offStart + 5) { sy = lerp(f, offStart + 2, offStart + 4, 1, 0.012); bright = 2; }
    if (f >= offStart + 5 && f < S[3]) black = true;
    if (f >= S[3] && f < S[3] + 3) bright = lerp(f, S[3], S[3] + 3, 2.2, 1);
  } else if (f >= S[3] - 2 && f < S[3]) black = true;
  const stop = v === 'bold' && f >= BTN && f < BTN + 3 ? 1 - (f - BTN) / 3 : 0;
  const bot = v !== 'restrained' && f >= W.agents && f < W.agents + 14 ? Math.sin((f - W.agents) * 1.3) * (1 - (f - W.agents) / 14) : 0;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {black ? null : (
        <AbsoluteFill style={{transform: `translate(${c.tx + sh.x}px, ${sh.y}px) scale(${sx}, ${sy})`, filter: `brightness(${bright})`}}>
          <AbsoluteFill style={{transformOrigin: `${c.o.x}px ${c.o.y}px`, transform: `scale(${c.s})`, filter: c.blur > 0.5 ? `blur(${c.blur}px)` : undefined}}>
            <Clips />
            <Glitch f={f} amt={g} />
            {bot !== 0 ? <div style={{position: 'absolute', left: 1656, top: 880, width: 240, height: 135, overflow: 'hidden', borderRadius: 10, transformOrigin: '50% 100%', transform: `rotate(${bot * 9}deg) scale(${1 + Math.abs(bot) * 0.12})`}}>
              <div style={{position: 'absolute', left: -1656, top: -880, width: 1920, height: 1080}}><Freeze frame={W.agents - S[1] + HANDLE}><OffthreadVideo src={staticFile('L2.mp4')} muted style={{width: 1920, height: 1080}} /></Freeze></div>
            </div> : null}
          </AbsoluteFill>
          <Safe v={v} f={f} />
          <Stamps v={v} f={f} />
          <Button v={v} f={f} />
          <Errors v={v} f={f} />
        </AbsoluteFill>
      )}
      {stop > 0 ? <AbsoluteFill style={{background: '#fff', opacity: 0.7 * stop}} /> : null}
      {f < 3 ? <AbsoluteFill style={{background: '#000', opacity: 1 - f / 3}} /> : null}
    </AbsoluteFill>
  );
};
