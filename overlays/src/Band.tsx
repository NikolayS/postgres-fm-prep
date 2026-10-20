import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

// Bottom band of the BIG-faces layout: x 24-1600, y 912-1052 (robot tile sits to the right).
export const BAND = {x: 24, y: 912, w: 1576, h: 140};

export type BandProps = {
  kind: 'strip' | 'lower' | 'lines' | 'chips' | 'quote';
  text?: string; // strip, quote
  prefix?: string; // strip: accent prefix, e.g. "Editor's note:"
  name?: string; // lower
  sub?: string; // lower
  lines?: string[]; // lines: staged, one under the other
  chips?: string[]; // chips: staged link chips
  accent?: string; // accent color for prefix / lines
  stagger?: number; // seconds between staged items (lines, chips)
  durationSec: number;
};

const Wipe: React.FC<{frame: number; fps: number; delay: number; children: React.ReactNode; style?: React.CSSProperties}> = ({frame, fps, delay, children, style}) => {
  const f = frame - delay * fps;
  const w = interpolate(f, [0, 0.3 * fps], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const x = interpolate(f, [0, 0.3 * fps], [-24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <div style={{clipPath: `inset(0 ${100 - w}% 0 0)`, transform: `translateX(${x}px)`, ...style}}>{children}</div>
  );
};

// Hand-drawn yellow marker stroke behind dark text (Nik, 2026-10-20: "yellow-highlighted, like by hand").
// The stroke is an SVG rect roughened by a turbulence displacement, tilted a little (seeded by the
// text), and revealed left-to-right like a marker swipe over `swipe` seconds.
const Marker: React.FC<{frame: number; fps: number; delay: number; seed: number; swipe?: number; fontSize: number; children: React.ReactNode}> = ({frame, fps, delay, seed, swipe = 0.5, fontSize, children}) => {
  const f = frame - delay * fps;
  const w = interpolate(f, [0, swipe * fps], [0, 104], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const textIn = interpolate(f, [0.1 * fps, 0.4 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tilt = ((seed * 9301 + 49297) % 233280) / 233280 * 1.6 - 0.8; // -0.8..0.8 deg
  const id = `rough${seed}`;
  // The swipe clip covers stroke and text together, so no text shows ahead of the marker.
  return (
    <div style={{position: 'relative', display: 'inline-block', padding: '10px 30px 12px 26px', fontSize, fontWeight: 700, color: '#111', lineHeight: 1.2, whiteSpace: 'nowrap', transform: `rotate(${tilt}deg)`, clipPath: `inset(-6px ${Math.max(0, 104 - w)}% -6px -10px)`}}>
      <svg style={{position: 'absolute', left: -8, top: -4, width: 'calc(100% + 16px)', height: 'calc(100% + 8px)'}}>
        <defs>
          <filter id={id} x="-5%" y="-10%" width="110%" height="120%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.12" numOctaves={2} seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={9} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <rect x="6" y="8" width="calc(100% - 12px)" height="calc(100% - 16px)" rx="6" fill="rgba(255,214,0,0.86)" filter={`url(#${id})`} />
        <rect x="10" y="14" width="calc(100% - 22px)" height="calc(100% - 28px)" rx="4" fill="rgba(255,225,60,0.55)" filter={`url(#${id})`} style={{mixBlendMode: 'multiply'}} />
      </svg>
      <span style={{position: 'relative', opacity: textIn}}>{children}</span>
    </div>
  );
};
const seedOf = (s: string) => Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 1000;

export const Band: React.FC<BandProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const accent = p.accent ?? '#FFD23F';
  const stagger = p.stagger ?? 0.5;
  const fadeOut = interpolate(frame, [durationInFrames - 0.2 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});

  const strip: React.CSSProperties = {
    display: 'inline-block',
    background: '#111',
    color: '#fff',
    fontSize: 40,
    fontWeight: 600,
    lineHeight: 1.2,
    padding: '10px 26px',
    borderRadius: 8,
    whiteSpace: 'nowrap',
  };

  let body: React.ReactNode = null;
  if (p.kind === 'strip') {
    // Text strips and takeaways: marker highlight; optional second line (p.sub) in a small dark strip.
    body = (
      <div style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start'}}>
        <Marker frame={frame} fps={fps} delay={0} seed={seedOf(p.text ?? '')} fontSize={46}>
          {p.prefix ? <span style={{marginRight: 14, fontWeight: 500}}>{p.prefix}</span> : null}
          {p.text}
        </Marker>
        {p.sub ? (
          <Wipe frame={frame} fps={fps} delay={0.5}>
            <div style={{...strip, fontSize: 30, fontWeight: 500, background: 'rgba(17,17,17,0.85)', padding: '6px 22px', marginLeft: 26}}>{p.sub}</div>
          </Wipe>
        ) : null}
      </div>
    );
  } else if (p.kind === 'quote') {
    // Quote: marker highlight with quote marks; optional attribution strip under it (p.sub).
    body = (
      <div style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start'}}>
        <Marker frame={frame} fps={fps} delay={0} seed={seedOf(p.text ?? '')} fontSize={44}>
          {'“'}{p.text}{'”'}
        </Marker>
        {p.sub ? (
          <Wipe frame={frame} fps={fps} delay={0.5}>
            <div style={{...strip, fontSize: 28, fontWeight: 500, background: 'rgba(17,17,17,0.85)', padding: '6px 22px', marginLeft: 26}}>{p.sub}</div>
          </Wipe>
        ) : null}
      </div>
    );
  } else if (p.kind === 'lower') {
    body = (
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <Wipe frame={frame} fps={fps} delay={0}>
          <div style={{...strip, fontSize: 44, fontWeight: 700}}>{p.name}</div>
        </Wipe>
        {p.sub ? (
          <Wipe frame={frame} fps={fps} delay={0.4}>
            <div style={{...strip, fontSize: 28, fontWeight: 500, background: 'rgba(17,17,17,0.85)', padding: '6px 22px'}}>{p.sub}</div>
          </Wipe>
        ) : null}
      </div>
    );
  } else if (p.kind === 'lines') {
    body = (
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        {(p.lines ?? []).map((l, i) => (
          <Wipe key={i} frame={frame} fps={fps} delay={i * stagger}>
            <div style={{...strip, fontSize: i === 0 ? 40 : 36, color: i === 0 ? accent : '#fff'}}>{l}</div>
          </Wipe>
        ))}
      </div>
    );
  } else if (p.kind === 'chips') {
    body = (
      <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10, maxWidth: BAND.w}}>
        {(p.chips ?? []).map((c, i) => {
          const s = spring({frame: frame - i * stagger * fps, fps, config: {damping: 14, stiffness: 180, mass: 0.5}});
          return (
            <div key={i} style={{...strip, fontSize: (p.chips?.length ?? 1) > 2 ? 28 : 32, fontWeight: 500, padding: '8px 20px', fontFamily: 'JetBrains Mono, Menlo, monospace', transform: `scale(${0.92 + 0.08 * s})`, transformOrigin: 'left center', opacity: s}}>
              {c}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: BAND.x, top: BAND.y, width: BAND.w, height: BAND.h, display: 'flex', alignItems: 'center'}}>{body}</div>
    </AbsoluteFill>
  );
};
