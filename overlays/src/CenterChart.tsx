import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

// Charts for the "center" placement: the packager moves the host tiles to the
// edges (560x360 at y 360) and leaves x 600-1320 free. Everything is drawn
// inside CENTER on transparent alpha; the talk continues under it.
export const CENTER = {x: 600, y: 120, w: 720, h: 860};

type Donut = {value: number; of: number; label: string};
type Bar = {value: number; label: string; sub?: string};
export type CenterChartProps = {
  kind: 'donuts' | 'bars';
  title: string;
  sub?: string;
  donuts?: Donut[];
  bars?: Bar[];
  unit?: string; // bars: unit under the numbers
  footnote?: string;
  chip?: string; // source line at the bottom
  stagger?: number; // seconds between items
  durationSec: number;
};

export const CENTER_TIMING = {title: 0.2, itemAt: 0.8, stagger: 0.5, grow: 0.9};

const fmt = (n: number) => n.toLocaleString('en-US');

export const CenterChart: React.FC<CenterChartProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const accent = '#FFD23F';
  const T = CENTER_TIMING;
  const stagger = p.stagger ?? T.stagger;
  const s = (at: number, cfg = {damping: 14, stiffness: 200, mass: 0.6}) => spring({frame: frame - at * fps, fps, config: cfg});
  const grow = (at: number) => interpolate(frame, [at * fps, (at + T.grow) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const panel = s(0, {damping: 16, stiffness: 160, mass: 0.7});

  const strip: React.CSSProperties = {display: 'inline-block', background: '#111', color: '#fff', fontWeight: 600, lineHeight: 1.2, padding: '8px 22px', borderRadius: 8, whiteSpace: 'nowrap'};

  let body: React.ReactNode = null;
  if (p.kind === 'donuts') {
    const R = 92, SW = 26, C = 2 * Math.PI * R;
    body = (
      <div style={{display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'stretch', marginTop: 24}}>
        {(p.donuts ?? []).map((d, i) => {
          const at = T.itemAt + i * stagger;
          const g = grow(at);
          const frac = (d.value / d.of) * g;
          const pop = s(at + T.grow * 0.6);
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 28, opacity: s(at)}}>
              <svg width={2 * (R + SW / 2) + 4} height={2 * (R + SW / 2) + 4} style={{flex: 'none'}}>
                <g transform={`translate(${R + SW / 2 + 2},${R + SW / 2 + 2}) rotate(-90)`}>
                  <circle r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={SW} />
                  <circle r={R} fill="none" stroke={accent} strokeWidth={SW} strokeLinecap="butt" strokeDasharray={`${C * frac} ${C}`} />
                </g>
                <text x={R + SW / 2 + 2} y={R + SW / 2 + 2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={64} fontWeight={700} fontFamily="Inter, sans-serif" style={{opacity: pop}}>
                  {Math.round(d.value * g)}
                </text>
              </svg>
              <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                <div style={{fontSize: 34, fontWeight: 600, color: '#fff', lineHeight: 1.2}}>{d.label}</div>
                <div style={{fontSize: 30, fontWeight: 500, color: 'rgba(255,255,255,0.7)'}}>of {d.of} pages</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  } else {
    const bars = p.bars ?? [];
    const max = Math.max(...bars.map((b) => b.value));
    const H = 330;
    body = (
      <div style={{display: 'flex', flexDirection: 'column', marginTop: 20}}>
        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: H + 90, padding: '0 10px'}}>
          {bars.map((b, i) => {
            const at = T.itemAt + i * stagger;
            const g = grow(at);
            const h = Math.max(8, (b.value / max) * H) * g;
            const num = Math.round(b.value * g);
            return (
              <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 220, opacity: s(at)}}>
                <div style={{fontSize: 60, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{fmt(num)}</div>
                <div style={{fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 10}}>{p.unit ?? ''}</div>
                <div style={{width: 150, height: h, background: i === bars.length - 1 ? accent : '#fff', borderRadius: '8px 8px 0 0'}} />
              </div>
            );
          })}
        </div>
        <div style={{height: 3, background: 'rgba(255,255,255,0.3)', margin: '0 10px'}} />
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '12px 10px 0'}}>
          {bars.map((b, i) => (
            <div key={i} style={{width: 220, textAlign: 'center', opacity: s(T.itemAt + i * stagger)}}>
              <div style={{fontSize: 27, fontWeight: 600, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', letterSpacing: -0.3}}>{b.label}</div>
              {b.sub ? <div style={{fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 1.2}}>{b.sub}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: CENTER.x, top: CENTER.y, width: CENTER.w, height: CENTER.h, background: 'rgba(8,8,10,0.86)', borderRadius: 18, padding: '28px 28px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: panel, transform: `scale(${0.96 + 0.04 * panel})`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
        <div style={{opacity: s(T.title)}}>
          <div style={{fontSize: 38, fontWeight: 700, color: '#fff', lineHeight: 1.2}}>{p.title}</div>
          {p.sub ? <div style={{fontSize: 28, fontWeight: 500, color: accent, marginTop: 6, lineHeight: 1.25}}>{p.sub}</div> : null}
        </div>
        {body}
        <div style={{flex: 1}} />
        {p.footnote ? <div style={{fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3, opacity: s(T.itemAt + 1.5)}}>{p.footnote}</div> : null}
        {p.chip ? <div style={{...strip, fontSize: 26, fontWeight: 500, fontFamily: 'JetBrains Mono, Menlo, monospace', padding: '6px 16px', marginTop: 12, alignSelf: 'flex-start', background: '#222', opacity: s(T.itemAt + 1.5), whiteSpace: 'normal'}}>{p.chip}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
