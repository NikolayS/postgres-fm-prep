import React from 'react';
import {continueRender, delayRender, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const C = {bg: '#111013', white: '#f5f3ee', orange: '#ff7a1a', dim: '#3a373e', mid: '#8a8690', panel: '#1c1a1f'};
export const W = 1080;
export const H = 1350;
export const SAFE_BOTTOM = H - 180; // no text below this line
export const IMPACT = 'ImpactX, Impact, sans-serif';
export const MONO = '"JetBrains Mono", monospace';
export const INTER = 'Inter, sans-serif';

let loaded = false;
export const useFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const h = delayRender('fonts');
  const fonts: Array<[string, string, string]> = [
    ['ImpactX', '400', 'Impact.ttf'],
    ['Inter', '500', 'Inter-Medium.ttf'],
    ['Inter', '700', 'Inter-Bold.ttf'],
    ['JetBrains Mono', '500', 'JetBrainsMono-Medium.ttf'],
  ];
  Promise.all(fonts.map(([fam, w, file]) => new FontFace(fam, `url(${staticFile(`fonts/${file}`)})`, {weight: w}).load().then((ff) => document.fonts.add(ff)))).finally(() => continueRender(h));
};

export const EASE = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
export const ease = (t: number, a: number, b: number, from = 0, to = 1, e = EASE) =>
  interpolate(t, [a, b], [from, to], {easing: e, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
export const lin = (t: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(t, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const useSpring = () => {
  const {fps} = useVideoConfig();
  return (t: number, delay = 0, stiff = 190, damp = 13, mass = 0.7) =>
    spring({frame: t - delay, fps, config: {stiffness: stiff, damping: damp, mass}});
};

// Kinetic headline: each word rises out of a mask with a spring and a small overshoot skew.
export const Headline: React.FC<{lines: Array<Array<string | {w: string; hot: true}>>; size?: number; top?: number; delay?: number}> = ({lines, size = 132, top = 150, delay = 2}) => {
  const t = useCurrentFrame();
  const sp = useSpring();
  let k = 0;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top}}>
      {lines.map((line, li) => (
        <div key={li} style={{overflow: 'hidden', height: size * 1.02, display: 'flex', gap: size * 0.22, marginBottom: size * 0.04}}>
          {line.map((wd, wi) => {
            const word = typeof wd === 'string' ? wd : wd.w;
            const hot = typeof wd !== 'string';
            const s = sp(t, delay + k++ * 3, 230, 15, 0.6);
            return (
              <span key={wi} style={{
                fontFamily: IMPACT, fontSize: size, lineHeight: 1.02, color: hot ? C.orange : C.white, letterSpacing: 1,
                display: 'inline-block', transform: `translateY(${(1 - s) * 105}%) skewY(${(1 - s) * 6}deg)`,
              }}>{word}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Typed mono line with a block cursor.
export const Typed: React.FC<{text: string; start: number; cps?: number; size?: number; color?: string; prompt?: boolean}> = ({text, start, cps = 1.4, size = 38, color = C.white, prompt = true}) => {
  const t = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((t - start) * cps)));
  const done = n >= text.length;
  const blink = done ? Math.floor(t / 8) % 2 === 0 : true;
  return (
    <span style={{fontFamily: MONO, fontSize: size, color, whiteSpace: 'pre', fontWeight: 500}}>
      {prompt && <span style={{color: C.orange}}>{'=# '}</span>}
      {text.slice(0, n)}
      <span style={{display: 'inline-block', width: size * 0.58, height: size * 1.05, background: C.orange, opacity: t >= start && blink ? 0.9 : 0, verticalAlign: 'text-bottom', marginLeft: 2}} />
    </span>
  );
};

export const typingEnd = (text: string, start: number, cps = 1.4) => start + Math.ceil(text.length / cps);

export const Terminal: React.FC<{y: number; h?: number; children: React.ReactNode; enter?: number}> = ({y, h = 96, children, enter = 0}) => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const s = sp(t, enter, 200, 18);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: y, height: h, borderRadius: 18, background: C.panel, border: `2px solid ${C.dim}`,
      display: 'flex', alignItems: 'center', padding: '0 30px', boxSizing: 'border-box', opacity: s, transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + 0.04 * s})`}}>
      {children}
    </div>
  );
};
