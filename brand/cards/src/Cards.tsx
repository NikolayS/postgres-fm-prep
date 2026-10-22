import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile} from 'remotion';
import {at, Beat, beatPulse, beatT, ELE, FPS, Grain, H, HOSTS, lin, pop, Sparkle, TITLE, useFonts, useLevels, useT, W} from './common';

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const PLUM = '#3d0f45';
const font = {fontFamily: 'Lato', fontWeight: 900} as const;

// The sunglasses elephant, bottom-anchored. glint: 0..1 sparkle on the right lens.
const Elephant: React.FC<{x: number; height: number; dy: number; rot: number; glint: number; glintRot: number; filter?: string}> = ({x, height, dy, rot, glint, glintRot, filter}) => {
  const k = height / ELE.h, w = ELE.w * k;
  return (
    <div style={{position: 'absolute', left: x, top: H - height + 30 + dy, width: w, height, transform: `rotate(${rot}deg)`, transformOrigin: '50% 100%'}}>
      <Img src={staticFile('elephant.png')} style={{width: w, height, filter}} />
      <Sparkle x={ELE.glintR[0] * k} y={ELE.glintR[1] * k} s={glint * 0.9} rot={glintRot} />
      <Sparkle x={ELE.glintL[0] * k} y={ELE.glintL[1] * k} s={glint * 0.5} rot={-glintRot} />
    </div>
  );
};

// Glint: rises fast at beat k and fades over ~0.6 s.
const glintAt = (t: number, times: number[]) => Math.max(0, ...times.map((s) => (t < s ? 0 : t < s + 0.12 ? (t - s) / 0.12 : Math.max(0, 1 - (t - s - 0.12) / 0.5))));

const Hosts: React.FC<{t0: number; step: number; color: string; sub: string; size?: number; glow?: string}> = ({t0, step, color, sub, size = 50, glow}) => {
  const {f} = useT();
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      {HOSTS.map((h, i) => {
        const p = pop(f, t0 + i * step, 13);
        return (
          <div key={h.name} style={{...font, fontWeight: 700, fontSize: size, color, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -60}px)`, textShadow: glow, whiteSpace: 'nowrap'}}>
            {h.name}{h.company ? <span style={{fontWeight: 400, color: sub}}>{'  ·  '}{h.company}</span> : null}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- A: "Shades" (classic pink)
export const CardShades: React.FC = () => {
  useFonts();
  const lv = useLevels('a-shades');
  const {f, t} = useT();
  const bt: Beat = {t0: 0.486, b: 60 / 116};
  const B = (k: number) => beatT(bt, k);
  const hit = beatPulse(bt, t, 8) * (t < B(24) ? 1 : 0); // brass hook downbeats
  const bass = at(lv, 'low', f);
  const finalHit = t >= B(24) ? Math.exp(-(t - B(24)) * 5) : 0;
  const zoom = 1 + 0.025 * hit + 0.04 * finalHit;
  const wm = pop(f, B(0) - 0.08, 9, 220);
  const ele = pop(f, B(2), 12, 120);
  const sway = t > B(4) ? Math.sin(((t - bt.t0) / bt.b) * Math.PI) * 2.2 : 0;
  const bob = -14 * beatPulse(bt, t, 1, 4);
  const band = lin(t, B(5), B(5.6));
  const q = pop(f, B(6), 6, 260);
  const rays = t * 6;
  return (
    <AbsoluteFill style={{background: PINK_BG, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {/* Slow light rays from the elephant, breathing with the bass. */}
        <div style={{position: 'absolute', left: 1520 - 1600, top: 380 - 1600, width: 3200, height: 3200, opacity: 0.16 + 0.12 * bass,
          background: `repeating-conic-gradient(from ${rays}deg at 50% 50%, rgba(255,255,255,.9) 0deg 7deg, rgba(255,255,255,0) 7deg 22deg)`,
          maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 55%)'}} />
        <Elephant x={1170} height={950} dy={(1 - ele) * 900 + bob} rot={sway} glint={glintAt(t, [B(8), B(16), B(24)])} glintRot={t * 90} />
        <Img src={staticFile('wordmark-white.png')} style={{position: 'absolute', left: 110, top: 70, width: 700,
          transform: `scale(${0.4 + 0.6 * wm}) rotate(${(1 - wm) * -8}deg)`, transformOrigin: '0% 50%', opacity: Math.min(1, wm * 2),
          filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
        <div style={{position: 'absolute', left: 110, top: 330}}>
          {[TITLE[0], TITLE[1]].map((w, i) => {
            const p = pop(f, B(1 + i), 10, 200);
            return (
              <div key={w} style={{...font, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, opacity: Math.min(1, p * 2),
                transform: `translateY(${(1 - p) * 80}px) scale(${1 + 0.04 * (i === 1 ? hit : 0)})`, transformOrigin: '0% 80%',
                textShadow: `0 7px 0 ${PLUM}55, 0 0 40px rgba(120,20,120,.25)`}}>{w}</div>
            );
          })}
          <div style={{position: 'relative', marginTop: 26, height: 150}}>
            <div style={{position: 'absolute', left: -24, top: 0, height: 150, width: 790, background: PLUM, borderRadius: 18, transform: `scaleX(${band}) skewX(-6deg)`, transformOrigin: '0 50%', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
            <div style={{...font, position: 'absolute', left: 14, top: 4, fontSize: 124, color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap', clipPath: `inset(0 ${100 - band * 100}% 0 0)`}}>
              Is it enough<span style={{display: 'inline-block', color: '#ff9cf0', transform: `rotate(${(1 - q) * 40 + 14 * beatPulse(bt, t, 8, 8)}deg) scale(${0.6 + 0.4 * q})`, transformOrigin: '50% 90%'}}>?</span>
            </div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 116, top: 905}}>
          <Hosts t0={B(7)} step={bt.b} color={PLUM} sub="#7a2f80" />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.14} />
      <AbsoluteFill style={{background: '#fff', opacity: 0.35 * Math.max(0, 1 - (t - B(24)) / 0.12) * (t >= B(24) ? 1 : 0)}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- B: "Neon" (pink neon at night)
const NEON = '#ff4fd8';
const neonText = (k: number) => `0 0 6px rgba(255,255,255,${0.8 * k}), 0 0 18px ${NEON}, 0 0 42px ${NEON}, 0 0 90px rgba(255,79,216,${0.6 * k})`;
// Neon ignition: flicker pattern then steady.
const flicker = (t: number, s: number) => {
  if (t < s) return 0;
  const d = t - s, pat = [1, 0, 1, 1, 0, 0, 1, 0.3, 1];
  const i = Math.floor(d / 0.045);
  return i < pat.length ? pat[i] : 1;
};
export const CardNeon: React.FC = () => {
  useFonts();
  const lv = useLevels('b-neon');
  const {f, t} = useT();
  const bt: Beat = {t0: 0.9, b: 0.5};
  const B = (k: number) => beatT(bt, k);
  const bass = at(lv, 'low', f), rms = at(lv, 'rms', f);
  const wmOn = flicker(t, B(0) - 0.4);
  const finalHit = t >= B(24) ? Math.exp(-(t - B(24)) * 5) : 0;
  const ele = pop(f, B(4), 14, 110);
  const gridShift = ((t - bt.t0) / bt.b) % 1;
  const hit = beatPulse(bt, t, 4) * (t < B(24) ? 1 : 0);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 60% 40%, #3a0f44 0%, #1c0623 55%, #0d0311 100%)', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.02 * hit + 0.04 * finalHit})`}}>
        {/* Synthwave floor: horizon glow + a grid that moves one row per beat. */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 800, height: 6, background: NEON, boxShadow: `0 0 40px 10px ${NEON}`, opacity: 0.55 + 0.4 * bass}} />
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.5 + 0.4 * bass}}>
          {Array.from({length: 9}, (_, i) => {
            // Rows: z = 1..9 moving toward the viewer one row per beat; y = horizon + 900/z.
            const z = 9 - i - gridShift + 0.0001, y = 803 + 260 / z;
            return y > H ? null : <line key={'h' + i} x1={0} x2={W} y1={y} y2={y} stroke={NEON} strokeWidth={Math.min(4, 1 + 8 / z)} opacity={Math.min(1, 2.5 / z)} />;
          })}
          {Array.from({length: 25}, (_, i) => {
            const x = (i - 12) * 260;
            return <line key={'v' + i} x1={960 + x * 0.08} y1={803} x2={960 + x * 1.3} y2={H} stroke={NEON} strokeWidth={2} opacity={0.7} />;
          })}
        </svg>
        <Elephant x={1150} height={900} dy={(1 - ele) * 900 - 10 * beatPulse(bt, t, 1, 4)} rot={0} glint={glintAt(t, [B(8), B(16), B(24)])} glintRot={t * 90}
          filter={`drop-shadow(0 0 ${10 + 22 * bass}px ${NEON}) drop-shadow(0 0 4px #fff) brightness(${0.9 + 0.25 * bass})`} />
        <Img src={staticFile('wordmark-white.png')} style={{position: 'absolute', left: 110, top: 70, width: 720, opacity: wmOn,
          filter: `drop-shadow(0 0 6px rgba(255,255,255,.9)) drop-shadow(0 0 16px ${NEON}) drop-shadow(0 0 ${30 + 30 * rms}px ${NEON})`}} />
        <div style={{position: 'absolute', left: 110, top: 330}}>
          {[TITLE[0], TITLE[1]].map((w, i) => {
            const on = flicker(t, B(1 + i));
            return <div key={w} style={{...font, fontSize: 148, lineHeight: 1.0, color: '#fff', letterSpacing: -1, opacity: on, textShadow: neonText(0.6 + 0.4 * rms)}}>{w}</div>;
          })}
          <div style={{...font, fontStyle: 'italic', marginTop: 30, fontSize: 132, color: '#ffd6f6', opacity: flicker(t, B(3)), whiteSpace: 'nowrap',
            textShadow: `0 0 8px #fff, 0 0 22px ${NEON}, 0 0 50px ${NEON}, 0 0 ${80 + 60 * hit}px ${NEON}`}}>Is it enough?</div>
        </div>
        <div style={{position: 'absolute', left: 116, top: 905}}>
          <Hosts t0={B(5)} step={bt.b} color="#ffe3fa" sub="#ff9ced" glow={`0 0 6px #0d0311, 0 0 16px #0d0311, 0 0 14px rgba(255,79,216,.8)`} />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- C: "Dial" (tune in to postgres.fm)
const FM_LO = 88, FM_HI = 108, DIAL = {x: 110, y: 60, w: 1700, h: 150};
const fmX = (mhz: number) => DIAL.x + 70 + ((mhz - FM_LO) / (FM_HI - FM_LO)) * (DIAL.w - 140);
export const CardDial: React.FC = () => {
  useFonts();
  const lv = useLevels('c-dial');
  const {f, t} = useT();
  const bt: Beat = {t0: 0.75, b: 60 / 97};
  const B = (k: number) => beatT(bt, k);
  const bands = lv ? lv.bands[Math.min(lv.bands.length - 1, f)] : new Array(12).fill(0);
  const bass = at(lv, 'low', f);
  // Needle: searches (wobbly sweep) until the first downbeat, then springs onto 101.
  const lock = pop(f, B(0) - 0.12, 9, 180);
  const search = FM_LO + 1 + 9 * lin(t, 0, B(0)) + 1.6 * Math.sin(t * 19) * (1 - lin(t, 0.3, B(0)));
  const mhz = search + (101 - search) * lock;
  const wm = pop(f, B(0), 9, 200);
  const finalHit = t >= B(20) ? Math.exp(-(t - B(20)) * 5) : 0;
  const ele = pop(f, B(2), 12, 120);
  return (
    <AbsoluteFill style={{background: PINK_BG, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.04 * finalHit + 0.015 * beatPulse(bt, t, 4)})`}}>
        {/* Spectrum bars along the bottom, from the real music. */}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, display: 'flex', alignItems: 'flex-end', gap: 14, padding: '0 14px', opacity: 0.22}}>
          {Array.from({length: 24}, (_, i) => {
            const v = bands[Math.floor(i / 2)] ?? 0;
            return <div key={i} style={{flex: 1, height: 30 + v * 380 * (0.8 + 0.2 * Math.sin(i * 1.7)), background: PLUM, borderRadius: '10px 10px 0 0'}} />;
          })}
        </div>
        {/* The dial. */}
        <div style={{position: 'absolute', left: DIAL.x, top: DIAL.y, width: DIAL.w, height: DIAL.h, background: PLUM, borderRadius: 28, boxShadow: 'inset 0 4px 20px rgba(0,0,0,.45), 0 10px 0 rgba(61,15,69,.25)'}} />
        {Array.from({length: (FM_HI - FM_LO) * 2 + 1}, (_, i) => {
          const m = FM_LO + i / 2, major = i % 4 === 0;
          return (
            <React.Fragment key={i}>
              <div style={{position: 'absolute', left: fmX(m) - 1.5, top: DIAL.y + 22, width: 3, height: major ? 44 : 24, background: '#f6b6ee', opacity: major ? 0.95 : 0.55}} />
              {major ? <div style={{position: 'absolute', left: fmX(m) - 40, width: 80, textAlign: 'center', top: DIAL.y + 78, ...font, fontWeight: 700, fontSize: 40, color: '#f6b6ee'}}>{m}</div> : null}
            </React.Fragment>
          );
        })}
        <div style={{position: 'absolute', left: fmX(mhz) - 4, top: DIAL.y + 10, width: 8, height: DIAL.h - 20, background: '#ff3b6b', borderRadius: 4, boxShadow: `0 0 ${12 + 20 * lock}px #ff3b6b`}} />
        <Img src={staticFile('wordmark-black.png')} style={{position: 'absolute', left: 110, top: 245, width: 640,
          filter: 'brightness(0) invert(1) drop-shadow(0 6px 0 rgba(61,15,69,.35))', opacity: Math.min(1, wm * 2), transform: `scale(${0.5 + 0.5 * wm})`, transformOrigin: `${fmX(101) - 110}px -60px`}} />
        <Elephant x={1250} height={760} dy={(1 - ele) * 900 - 12 * beatPulse(bt, t, 1, 2)} rot={Math.sin(((t - bt.t0) / bt.b) * Math.PI) * 2 * lin(t, B(3), B(4))}
          glint={glintAt(t, [B(8), B(16)])} glintRot={t * 90} />
        <div style={{position: 'absolute', left: 110, top: 470}}>
          <div style={{display: 'flex', gap: 34, alignItems: 'baseline'}}>
            {[TITLE[0], TITLE[1]].map((w, i) => {
              const p = pop(f, B(1 + i), 10, 200);
              return <div key={w} style={{...font, fontSize: 120, color: PLUM, letterSpacing: -1, opacity: Math.min(1, 2 * p), transform: `translateY(${(1 - p) * 60}px)`}}>{w}</div>;
            })}
          </div>
          {(() => {
            const p = pop(f, B(3), 8, 220);
            return <div style={{...font, fontSize: 168, lineHeight: 1.05, color: '#fff', letterSpacing: -2, opacity: Math.min(1, 2 * p), transform: `scale(${0.7 + 0.3 * p})`, transformOrigin: '0% 70%',
              textShadow: `0 8px 0 ${PLUM}, 0 0 30px rgba(61,15,69,.25)`}}>Is it enough?</div>;
          })()}
        </div>
        <div style={{position: 'absolute', left: 116, top: 870}}>
          <Hosts t0={B(4)} step={bt.b} color={PLUM} sub="#7a2f80" />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.14} />
    </AbsoluteFill>
  );
};
