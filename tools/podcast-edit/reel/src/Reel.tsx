import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {C, EASE_IO, ease, IMPACT, lin, MONO, useFonts, W} from './kit';
import {Autovac, Defaults, End, Intro, Notify, PlanAdvice, Repack, SEG, WaitLsn} from './scenes';

export const INTRO = 66;
export const FEATURES = [Repack, Notify, Autovac, WaitLsn, PlanAdvice, Defaults];
export const END = 84;
export const TOTAL = INTRO + FEATURES.length * SEG + END;
export const cuts = () => FEATURES.map((_, i) => INTRO + i * SEG).concat([INTRO + FEATURES.length * SEG]);

const Grid: React.FC = () => {
  const t = useCurrentFrame();
  const off = (t * 1.2) % 90;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg}}>
      <AbsoluteFill style={{backgroundImage: `linear-gradient(rgba(245,243,238,0.035) 2px, transparent 2px), linear-gradient(90deg, rgba(245,243,238,0.035) 2px, transparent 2px)`,
        backgroundSize: '90px 90px', backgroundPosition: `0 ${off}px`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% ${40 + 8 * Math.sin(t / 40)}%, rgba(255,122,26,0.10), transparent 60%)`}} />
    </AbsoluteFill>
  );
};

// Slab wipe: an orange parallelogram crosses the frame; the cut happens under it.
const Wipe: React.FC<{at: number}> = ({at}) => {
  const t = useCurrentFrame();
  const u = ease(t, at - 7, at + 7, 0, 1, EASE_IO);
  if (u <= 0 || u >= 1) return null;
  const x = -2000 + u * 3400;
  return (
    <>
      <div style={{position: 'absolute', top: -200, left: x - 140, width: 1700, height: 1750, background: C.white, transform: 'skewX(-14deg)'}} />
      <div style={{position: 'absolute', top: -200, left: x, width: 1700, height: 1750, background: C.orange, transform: 'skewX(-14deg)'}} />
    </>
  );
};

const TopBar: React.FC = () => {
  const t = useCurrentFrame();
  const start = INTRO, end = INTRO + FEATURES.length * SEG;
  if (t < start - 2 || t >= end) return null;
  const idx = Math.floor((t - start) / SEG);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 52}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{fontFamily: IMPACT, fontSize: 40, color: C.white, letterSpacing: 2}}>POSTGRES <span style={{color: C.orange}}>19</span></span>
        <span style={{fontFamily: MONO, fontSize: 28, color: C.mid}}>postgres.fm</span>
      </div>
      <div style={{display: 'flex', gap: 10, marginTop: 14}}>
        {FEATURES.map((_, i) => {
          const fill = i < idx ? 1 : i > idx ? 0 : lin(t, start + i * SEG, start + (i + 1) * SEG);
          return <div key={i} style={{flex: 1, height: 6, borderRadius: 3, background: '#2e2b31', overflow: 'hidden'}}>
            <div style={{width: `${fill * 100}%`, height: '100%', background: i === idx ? C.orange : C.white}} /></div>;
        })}
      </div>
    </div>
  );
};

// Each scene gets a slow push-in so nothing ever sits still.
const Push: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const t = useCurrentFrame();
  const s = 1.035 - 0.035 * ease(t, 0, dur);
  return <AbsoluteFill style={{transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};

export const Reel: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{width: W, overflow: 'hidden'}}>
      <Grid />
      <Sequence durationInFrames={INTRO}><Intro /></Sequence>
      {FEATURES.map((F, i) => (
        <Sequence key={i} from={INTRO + i * SEG} durationInFrames={SEG}><Push dur={SEG}><F /></Push></Sequence>
      ))}
      <Sequence from={INTRO + FEATURES.length * SEG} durationInFrames={END}><End /></Sequence>
      <TopBar />
      {cuts().map((c) => <Wipe key={c} at={c} />)}
    </AbsoluteFill>
  );
};
