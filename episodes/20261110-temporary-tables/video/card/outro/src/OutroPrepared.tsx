import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

// Outro for ep 196: PostgresAI only. Frame 2 of the ep 195 Outro3 ("Prepared by:" + the v1
// Postgres.AI wordmark animation) for the whole 22.72 s. No partner frame in this episode.
// logo-v1.mp4 plays from its frame 0, so its beat grid matches a-shades-outro.wav exactly as the
// ep 194 logo.mp4 did (compose lines the bed's end up with the end of this video).
// Beats in logo time: 0.33 + k * 60/116.
const FPS = 25;
const BEAT = 60 / 116, T0 = 0.33;
const B = (k: number) => T0 + k * BEAT;
const BG = 'rgb(236,233,224)';
const GREY = '#57534c';
// v1 wordmark, settled: x 484..1434, y 656..792 (cap top .. descender).
const WM = {x: 484, w: 950, top: 656, h: 136};
const KICK = 44;
const KICK_STYLE: React.CSSProperties = {fontFamily: '"JetBrains Mono"', fontWeight: 500, color: GREY, letterSpacing: '0.01em', fontSize: KICK, lineHeight: 1, whiteSpace: 'pre'};

const lin = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Stipple dissolve: the text assembles from grain, like the particle wordmark.
const Dissolve: React.FC<{id: string; p: number}> = ({id, p}) => {
  const b = 12 * (0.1 - (1 - p) * 1.15);
  return (
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <filter id={id} x="-5%" y="-30%" width="110%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed={7} result="n" />
        <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  12 0 0 0 ${b}`} result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
    </svg>
  );
};

export const OutroPrepared: React.FC = () => {
  const f = useCurrentFrame(), lt = f / FPS;
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    new FontFace('JetBrains Mono', `url(${staticFile('fonts/JetBrainsMono-Medium.ttf')})`, {weight: '500'}).load()
      .then((ff) => { document.fonts.add(ff); return document.fonts.ready; }).then(() => continueRender(h));
  }, [h]);

  // Kicker + wordmark, centred as a group once the wordmark settles (same motion as Outro3).
  const gap2 = 0.75 * KICK;
  const top2 = (1080 - (KICK + gap2 + WM.h)) / 2;
  const shift = top2 + KICK + gap2 - WM.top;
  const dy = shift * easeInOut(lin(lt, 4.3, 5.15));
  const band = lt >= 4.5;
  const bandMask = `linear-gradient(180deg, transparent ${WM.top - 90}px, black ${WM.top - 60}px, black ${WM.top + WM.h + 40}px, transparent ${WM.top + WM.h + 80}px)`;
  const byP = ease(lin(lt, B(10) - 0.06, B(10) + 0.6)); // one beat after the wordmark settles

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <Img src={staticFile('plate.png')} style={{position: 'absolute', inset: 0}} />
      <AbsoluteFill style={{transform: `translateY(${dy}px)`, ...(band ? {maskImage: bandMask, WebkitMaskImage: bandMask} : {})}}>
        <OffthreadVideo src={staticFile('logo-v1.mp4')} muted style={{width: 1920, height: 1080}} />
      </AbsoluteFill>
      <Dissolve id="d-by" p={byP} />
      <div style={{...KICK_STYLE, position: 'absolute', left: WM.x, top: top2,
        filter: byP < 1 ? 'url(#d-by)' : undefined, transform: `translateY(${(1 - byP) * 14}px)`}}>Prepared by:</div>
    </AbsoluteFill>
  );
};
