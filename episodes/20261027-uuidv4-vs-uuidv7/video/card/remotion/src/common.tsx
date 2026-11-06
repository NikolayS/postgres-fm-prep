import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const W = 1920, H = 1080, FPS = 25;
export const TITLE = ['UUIDv4', 'vs UUIDv7'];
export const HOSTS: {name: string; company?: string}[] = [{name: 'Kirk Wolak'}, {name: 'Nik Samokhvalov'}];

// Lato (OFL), the type family of the old postgres.fm covers, in heavy weights.
let fontsLoaded = false;
export const useFonts = () => {
  const [h] = useState(() => (fontsLoaded ? null : delayRender('fonts')));
  useEffect(() => {
    if (h === null) return;
    const faces: [string, string, string][] = [['400', 'normal', 'Lato-400'], ['700', 'normal', 'Lato-700'], ['900', 'normal', 'Lato-900']];
    Promise.all(faces.map(([weight, style, f]) => new FontFace('Lato', `url(${staticFile(`fonts/${f}.woff2`)})`, {weight, style}).load().then((ff) => document.fonts.add(ff))))
      .finally(() => { fontsLoaded = true; continueRender(h); });
  }, [h]);
};

export type Levels = {fps: number; rms: number[]; low: number[]; bands: number[][]};
export const useLevels = (name: string): Levels | null => {
  const [lv, setLv] = useState<Levels | null>(null);
  const [h] = useState(() => delayRender('levels ' + name));
  useEffect(() => {
    fetch(staticFile(`${name}-levels.json`)).then((r) => r.json()).then((j) => { setLv(j); continueRender(h); });
  }, [h, name]);
  return lv;
};
export const at = (lv: Levels | null, k: keyof Omit<Levels, 'fps' | 'bands'>, f: number) => (lv ? lv[k][Math.min(lv[k].length - 1, Math.max(0, f))] ?? 0 : 0);

// Beat clock: t0 = first downbeat (s), b = beat length (s).
export type Beat = {t0: number; b: number};
export const beatT = (bt: Beat, k: number) => bt.t0 + k * bt.b;
// 1 at the beat, decays over ~0.35 beat; for "pulse on every beat" motion.
export const beatPulse = (bt: Beat, t: number, every = 1, from = 0) => {
  if (t < beatT(bt, from)) return 0;
  const ph = ((t - bt.t0) / bt.b) % every;
  return Math.exp(-ph * 6 / every);
};

export const useT = () => { const f = useCurrentFrame(); return {f, t: f / FPS}; };
export const pop = (f: number, sec: number, damping = 11, stiffness = 170) =>
  spring({frame: f - Math.round(sec * FPS), fps: FPS, config: {damping, stiffness, mass: 0.7}});
export const lin = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// Film grain like the old cover art (animated, cheap: 6 seeds).
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.16}) => {
  const {f} = useT();
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity}}>
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 6} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width={W} height={H} filter="url(#g)" />
    </svg>
  );
};

// Four-point sparkle (the glint on the sunglasses).
export const Sparkle: React.FC<{x: number; y: number; s: number; rot: number; color?: string}> = ({x, y, s, rot, color = '#fff'}) =>
  s <= 0.01 ? null : (
    <svg width={200} height={200} viewBox="-100 -100 200 200" style={{position: 'absolute', left: x - 100, top: y - 100, transform: `scale(${s}) rotate(${rot}deg)`, filter: 'drop-shadow(0 0 10px rgba(255,255,255,.9))'}}>
      <path d="M0,-90 C8,-12 12,-8 90,0 C12,8 8,12 0,90 C-8,12 -12,8 -90,0 C-12,-8 -8,-12 0,-90Z" fill={color} />
    </svg>
  );

// Elephant (cut from the original postgres.fm artwork, 1319x1536). Glint points on the lenses in image px.
export const ELE = {w: 1321, h: 1535, glintL: [365, 335], glintR: [730, 335]};
