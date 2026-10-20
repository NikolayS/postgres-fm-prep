import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

// Guest intro in the vDud grammar: the talk freezes, a round photo lands, the
// name wipes in, then short facts pop in one by one (each with a clack).
// `side` is where the host sits in the frame: the photo goes on that side and
// the text column on the other.
export type IntroCardProps = {
  name: string;
  company: string;
  photo: string; // public/ file, square crop
  facts: string[]; // <= 40 chars each
  side: 'left' | 'right';
  factAt?: number; // seconds, first fact
  factStep?: number; // seconds between facts
  accent?: string;
  durationSec: number;
};

export const INTRO_TIMING = {photo: 0, name: 0.3, company: 0.7, factAt: 1.2, factStep: 0.45};

export const IntroCard: React.FC<IntroCardProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const accent = p.accent ?? '#FFD23F';
  const factAt = p.factAt ?? INTRO_TIMING.factAt;
  const factStep = p.factStep ?? INTRO_TIMING.factStep;
  const t = frame / fps;

  const dim = interpolate(frame, [0, 0.25 * fps], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const photoS = spring({frame, fps, config: {damping: 12, stiffness: 160, mass: 0.6}});
  const wipe = (delay: number) => {
    const f = frame - delay * fps;
    const w = interpolate(f, [0, 0.3 * fps], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    const x = interpolate(f, [0, 0.3 * fps], [p.side === 'left' ? -24 : 24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    return {clipPath: p.side === 'left' ? `inset(0 ${100 - w}% 0 0)` : `inset(0 0 0 ${100 - w}%)`, transform: `translateX(${x}px)`} as React.CSSProperties;
  };

  const PHOTO = 520;
  const left = p.side === 'left';
  const textAlign = left ? 'left' : 'right';
  const strip: React.CSSProperties = {
    display: 'inline-block',
    background: '#111',
    color: '#fff',
    fontWeight: 600,
    lineHeight: 1.2,
    padding: '10px 26px',
    borderRadius: 8,
    whiteSpace: 'nowrap',
  };

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <AbsoluteFill style={{background: `rgba(8,8,10,${0.82 * dim})`}} />
      <div
        style={{
          position: 'absolute',
          top: (1080 - PHOTO) / 2,
          [left ? 'left' : 'right']: 170,
          width: PHOTO,
          height: PHOTO,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `8px solid ${accent}`,
          transform: `scale(${0.6 + 0.4 * photoS})`,
          opacity: photoS,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <Img src={staticFile(p.photo)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 300,
          [left ? 'left' : 'right']: 170 + PHOTO + 80,
          width: 1920 - 170 - PHOTO - 90 - 150,
          display: 'flex',
          flexDirection: 'column',
          alignItems: left ? 'flex-start' : 'flex-end',
          gap: 12,
        }}
      >
        <div style={wipe(INTRO_TIMING.name)}>
          <div style={{...strip, fontSize: 92, fontWeight: 700, padding: '8px 30px', letterSpacing: -1}}>{p.name}</div>
        </div>
        <div style={wipe(INTRO_TIMING.company)}>
          <div style={{...strip, fontSize: 40, fontWeight: 600, color: '#111', background: accent}}>{p.company}</div>
        </div>
        <div style={{height: 18}} />
        {p.facts.map((f, i) => {
          const at = factAt + i * factStep;
          const s = spring({frame: frame - at * fps, fps, config: {damping: 13, stiffness: 240, mass: 0.5}});
          const visible = t >= at;
          return (
            <div
              key={i}
              style={{
                ...strip,
                fontSize: 40,
                fontWeight: 500,
                background: 'rgba(17,17,17,0.92)',
                padding: '8px 24px',
                opacity: visible ? s : 0,
                transform: `scale(${0.85 + 0.15 * s}) translateY(${(1 - s) * 14}px)`,
                transformOrigin: left ? 'left center' : 'right center',
                textAlign,
              }}
            >
              {f}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
