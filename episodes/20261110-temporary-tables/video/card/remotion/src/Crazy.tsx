import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {at, Beat, beatPulse, beatT, ELE, Grain, H, lin, pop, Sparkle, TITLE, useFonts, useLevels, useT, W} from './common';

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const PLUM = '#3d0f45';
const font = {fontFamily: 'Lato', fontWeight: 900} as const;

// a-shades intro (Apple Loops "Boogie Right", 116 BPM): first downbeat 0.486 s, final hit at beat 24.
const bt: Beat = {t0: 0.486, b: 60 / 116};
const B = (k: number) => beatT(bt, k);
const beatPos = (t: number) => (t - bt.t0) / bt.b;
// Ballistic hop: 0 at the start and end of each hop of `len` beats, 1 at the top.
const hop = (t: number, from: number, to: number, len = 1) => {
  const p = beatPos(t);
  if (p < from || p >= to) return 0;
  const ph = ((p - from) % len) / len;
  return 4 * ph * (1 - ph);
};
// Squash on landing: 1 right at each beat in [from, to), decays fast.
const land = (t: number, from: number, to: number, len = 1) => {
  const p = beatPos(t);
  if (p < from || p >= to + 0.5) return 0;
  const ph = ((p - from) % len) / len;
  return Math.exp(-ph * len * 9);
};
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Elephant choreography, in beats (one beat = 0.517 s):
//  2   drops from the sky, squashes on landing, dust
//  4-8   bounces every beat (squash and stretch)
//  8     big jump with a full spin
//  10-12 wobble / headbang
//  12    backflip
//  14-16 grows huge and shakes on the bass
//  16-20 hops left across the screen and back, half-beat bounces
//  20-22 headbang, rainbow sunglasses
//  22-24 highest jump, double spin; lands on the final hit (24) with shake + flash
const useElephant = (t: number, bass: number) => {
  const p = beatPos(t);
  let y = 0, x = 0, rot = 0, sx = 1, sy = 1, scale = 1;
  // Drop from the sky at beat 2 (falls 1 beat).
  const drop = lin(t, B(1), B(2));
  if (p < 2) y = -1500 * (1 - drop * drop);
  // Landing squashes.
  const sq = Math.max(land(t, 2, 2.01) * 1.6, land(t, 4, 8), land(t, 9, 9.01), land(t, 13, 13.01), land(t, 16, 20, 0.5) * 0.7, land(t, 24, 24.01) * 1.8);
  sx += 0.14 * sq + 0.03 * bass; sy -= 0.16 * sq + 0.03 * bass;
  // Every-beat bounce 4-8.
  const h1 = hop(t, 4, 8);
  y -= 140 * h1; sy += 0.06 * h1; sx -= 0.04 * h1;
  // Big spin jump 8-9.
  const h2 = hop(t, 8, 9);
  if (p >= 8 && p < 9) { y -= 420 * h2; rot = 360 * easeInOut(p - 8); }
  // Wobble 10-12.
  if (p >= 10 && p < 12) rot = 14 * Math.sin((p - 10) * Math.PI * 2);
  // Backflip 12-13.
  if (p >= 12 && p < 13) { y -= 380 * hop(t, 12, 13); rot = -360 * easeInOut(p - 12); }
  // Grow huge 14-16, shaking with the bass.
  const grow = lin(t, B(14), B(14.6)) * (1 - lin(t, B(15.6), B(16)));
  scale *= 1 + 0.35 * grow;
  if (grow > 0) { x += (Math.sin(t * 61) * 14 + Math.sin(t * 37) * 9) * (0.4 + bass) * grow; rot += Math.sin(t * 47) * 4 * grow; }
  // Hop left across the screen and back 16-20 (half-beat bounces).
  if (p >= 16 && p < 20) {
    const k = (p - 16) / 4;
    x -= 150 * Math.sin(k * Math.PI);
    y -= 120 * hop(t, 16, 20, 0.5);
    rot += 10 * Math.sin((p - 16) * Math.PI * 2);
  }
  // Headbang 20-22.
  if (p >= 20 && p < 22) rot = 18 * Math.sin((p - 20) * Math.PI * 2) * (0.6 + 0.4 * beatPulse(bt, t, 1, 20));
  // Final: jump at 22, double spin, land on the final hit at 24.
  if (p >= 22 && p < 24) { y -= 520 * hop(t, 22, 24, 2); rot = 720 * easeInOut((p - 22) / 2); }
  return {x, y, rot, sx, sy, scale};
};

const ElephantCrazy: React.FC<{t: number; bass: number}> = ({t, bass}) => {
  const e = useElephant(t, bass);
  const height = 880, k = height / ELE.h, w = ELE.w * k;
  const p = beatPos(t);
  // Rainbow sunglasses glint 20-24 and on the final hit.
  const hue = p >= 20 && p < 24 ? ((p - 20) * 90) % 360 : 0;
  const glint = Math.max(...[2, 8, 12, 16, 20, 22, 24].map((s) => { const d = t - B(s); return d < 0 ? 0 : d < 0.1 ? d / 0.1 : Math.max(0, 1 - (d - 0.1) / 0.45); }));
  return (
    <div style={{position: 'absolute', left: 1120 + e.x, top: H - height + 170 + e.y, width: w, height,
      transform: `rotate(${e.rot}deg) scale(${e.scale * e.sx}, ${e.scale * e.sy})`, transformOrigin: '50% 62%'}}>
      <Img src={staticFile('elephant.png')} style={{width: w, height, filter: hue ? `hue-rotate(${hue}deg) saturate(1.6)` : undefined,
        maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}} />
      <Sparkle x={850 * k} y={310 * k} s={glint * 1.1} rot={t * 120} />
      <Sparkle x={500 * k} y={310 * k} s={glint * 0.6} rot={-t * 120} />
    </div>
  );
};

// Dust puffs where the elephant lands.
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

// Host photos: plain rectangular frames from the recording. Fade in on their beat, then a
// small nod with the music: 4 px and 0.8 deg on alternate beats, nothing more.
const Photo: React.FC<{src: string; name: string; x: number; t0: number; t: number; phase: number}> = ({src, name, x, t, phase}) => {
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
const t0Of = (name: string) => (name.startsWith('Kirk') ? B(6) : name.startsWith('Nik') ? B(6.5) : B(7));

export const CardCrazy: React.FC = () => {
  useFonts();
  const lv = useLevels('a-shades');
  const {f, t} = useT();
  const bass = at(lv, 'low', f);
  const hit = beatPulse(bt, t, 8) * (t < B(24) ? 1 : 0);
  const finalHit = t >= B(24) ? Math.exp(-(t - B(24)) * 5) : 0;
  const shake = Math.max(land(t, 2, 2.01), land(t, 13, 13.01) * 0.6, land(t, 24, 24.01) * 1.4);
  const zoom = 1 + 0.03 * hit + 0.05 * finalHit;
  const wm = pop(f, B(0) - 0.08, 9, 220);
  const band = lin(t, B(5), B(5.6));
  const rays = t * (beatPos(t) > 14 ? 30 : 8);
  return (
    <AbsoluteFill style={{background: PINK_BG, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom}) translate(${Math.sin(t * 90) * 18 * shake}px, ${Math.cos(t * 77) * 14 * shake}px)`}}>
        <div style={{position: 'absolute', left: 1450 - 1600, top: 520 - 1600, width: 3200, height: 3200, opacity: 0.18 + 0.16 * bass,
          background: `repeating-conic-gradient(from ${rays}deg at 50% 50%, rgba(255,255,255,.9) 0deg 7deg, rgba(255,255,255,0) 7deg 22deg)`,
          maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 55%)'}} />
        <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560,
          transform: `scale(${0.4 + 0.6 * wm}) rotate(${(1 - wm) * -8}deg)`, transformOrigin: '0% 50%', opacity: Math.min(1, wm * 2),
          filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
        <div style={{position: 'absolute', left: 110, top: 240}}>
          <div style={{...font, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, opacity: Math.min(1, pop(f, B(1), 10, 200) * 2),
            transform: `translateY(${(1 - pop(f, B(1), 10, 200)) * 80}px)`, textShadow: `0 7px 0 ${PLUM}55, 0 0 40px rgba(120,20,120,.25)`}}>{TITLE[0]}</div>
          <div style={{position: 'relative', marginTop: 26, height: 150}}>
            <div style={{position: 'absolute', left: -24, top: 0, height: 150, width: 720, background: PLUM, borderRadius: 18, transform: `scaleX(${band}) skewX(-6deg)`, transformOrigin: '0 50%', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
            <div style={{...font, position: 'absolute', left: 14, top: 4, fontSize: 124, color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap', clipPath: `inset(0 ${100 - band * 100}% 0 0)`,
              transform: `scale(${1 + 0.05 * hit})`, transformOrigin: '0% 50%'}}>{TITLE[1]}</div>
          </div>
        </div>
        <Photo src="photo-kirk.png" name="Kirk Wolak" x={110} t0={B(6)} t={t} phase={0} />
        <Photo src="photo-nik.png" name="Nik Samokhvalov" x={470} t0={B(6.5)} t={t} phase={1} />
        <Photo src="photo-alvaro.png" name="Álvaro Hernández" x={830} t0={B(7)} t={t} phase={0} />
        <ElephantCrazy t={t} bass={bass} />
        <Dust t={t} />
      </AbsoluteFill>
      <Grain opacity={0.12} />
      <AbsoluteFill style={{background: '#fff', opacity: 0.45 * finalHit}} />
    </AbsoluteFill>
  );
};
