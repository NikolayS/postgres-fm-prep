import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

export type NumberPopProps = {
  title: string;
  mode?: 'arrow' | 'single'; // arrow: before -> after with bars; single: one big value
  before?: number;
  after?: number;
  sep?: string; // arrow mode separator glyph, default "->"
  beforeLabel?: string;
  afterLabel?: string;
  value?: string; // single mode
  valueLabel?: string; // single mode
  footnote: string;
  durationSec: number;
};

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

// Full-screen number card: dims the talk, counts up to "before", then "after" pops in
// and two bars (y from 0) show the ratio. "single" mode shows one value with a label.
export const NumberPop: React.FC<NumberPopProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const mode = p.mode ?? 'arrow';
  const before = p.before ?? 0;
  const after = p.after ?? 0;

  const pop = spring({frame, fps, config: {damping: 14, stiffness: 160, mass: 0.6}});
  const fadeOut = interpolate(frame, [durationInFrames - 0.25 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});

  const countEnd = 1.4 * fps;
  const beforeNow = interpolate(frame, [0.3 * fps, countEnd], [0, before], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const afterAt = 1.7 * fps; // SFX "pop" is pinned to 1.7 s in the manifest
  const afterPop = spring({frame: frame - afterAt, fps, config: {damping: 12, stiffness: 200, mass: 0.5}});
  const bars = interpolate(frame, [afterAt, afterAt + 0.8 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

  const barMax = 440;
  const big = Math.max(before, after, 1);
  const wBefore = Math.max(6, (barMax * before) / big) * bars;
  const wAfter = Math.max(6, (barMax * after) / big) * bars;

  const card = {w: 1240, h: 430, x: (1920 - 1240) / 2, y: 325};

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      {/* Dim the talk under the card (full-screen cutaway rule), so the card never fights a face. */}
      <AbsoluteFill style={{background: 'rgba(8,8,10,0.78)', opacity: pop}} />
      <div
        style={{
          position: 'absolute',
          left: card.x,
          top: card.y,
          width: card.w,
          height: card.h,
          background: 'rgba(17,17,19,0.96)',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          transform: `scale(${0.9 + 0.1 * pop})`,
          opacity: pop,
          color: '#fff',
          padding: '34px 48px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{fontSize: 34, fontWeight: 600, color: '#e4e4e8', letterSpacing: 0.3}}>{p.title}</div>
        {mode === 'arrow' ? (
          <>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 36, marginTop: 10}}>
              <div style={{fontSize: 112, fontWeight: 700, letterSpacing: -2, fontVariantNumeric: 'tabular-nums', minWidth: 330}}>{fmt(beforeNow)}</div>
              <div style={{fontSize: 64, fontWeight: 400, color: '#8a8a92', opacity: afterPop}}>{p.sep ?? '→'}</div>
              <div style={{fontSize: 112, fontWeight: 700, letterSpacing: -2, color: '#FFD23F', transform: `scale(${0.6 + 0.4 * afterPop})`, transformOrigin: 'left center', opacity: afterPop}}>{fmt(after)}</div>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4, opacity: bars}}>
              <Bar w={wBefore} color="#8a8a92" label={p.beforeLabel ?? ''} />
              <Bar w={wAfter} color="#FFD23F" label={p.afterLabel ?? ''} />
            </div>
          </>
        ) : (
          <div style={{display: 'flex', alignItems: 'baseline', gap: 28, marginTop: 10, opacity: afterPop}}>
            <div style={{fontSize: 104, fontWeight: 700, letterSpacing: -2, color: '#FFD23F', whiteSpace: 'nowrap', transform: `scale(${0.6 + 0.4 * afterPop})`, transformOrigin: 'left center'}}>{p.value}</div>
            <div style={{fontSize: 36, color: '#e4e4e8', maxWidth: 520, lineHeight: 1.25}}>{p.valueLabel}</div>
          </div>
        )}
        <div style={{position: 'absolute', left: 48, bottom: 24, fontSize: 28, color: '#b0b0b8', maxWidth: 1140, lineHeight: 1.25}}>{p.footnote}</div>
      </div>
    </AbsoluteFill>
  );
};

const Bar: React.FC<{w: number; color: string; label: string}> = ({w, color, label}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
    <div style={{width: w, height: 18, background: color, borderRadius: 4}} />
    <div style={{fontSize: 30, color: '#e4e4e8', whiteSpace: 'nowrap'}}>{label}</div>
  </div>
);
