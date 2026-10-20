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
    body = (
      <Wipe frame={frame} fps={fps} delay={0}>
        <div style={strip}>
          {p.prefix ? <span style={{color: accent, marginRight: 14}}>{p.prefix}</span> : null}
          {p.text}
        </div>
      </Wipe>
    );
  } else if (p.kind === 'quote') {
    // Quote: white strip with a left accent bar; optional attribution strip under it (p.sub).
    body = (
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <Wipe frame={frame} fps={fps} delay={0}>
          <div style={{...strip, background: '#fff', color: '#111', fontSize: 44, fontWeight: 700, borderLeft: `12px solid ${accent}`, paddingLeft: 22}}>
            {'“'}{p.text}{'”'}
          </div>
        </Wipe>
        {p.sub ? (
          <Wipe frame={frame} fps={fps} delay={0.4}>
            <div style={{...strip, fontSize: 28, fontWeight: 500, background: 'rgba(17,17,17,0.85)', padding: '6px 22px'}}>{p.sub}</div>
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
