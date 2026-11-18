import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

// Episode 197 (Postgres 19) central illustrations from the Forge PG19 study (brief
// https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c).
// Placement "center": the hosts move to a column at x 1630, so the panel uses x 40-1600.
// The panel starts below the shades header line and ends at y 890 (nothing in the
// bottom 180 px). Every value comes from the brief's figure data (data.json,
// numbers.json) or its text; scripts/forge-items.py fills the props. Linear axes only.
export const PANEL = {x: 40, y: 250, w: 1560, h: 640};
export const C = {s18: '#2a78d6', s19: '#d9822b', s3: '#7a5bd6', grey: '#8b95a1', ink: '#1d2530', soft: '#4c5766', faint: '#6b7581', line: '#d4d9e0', plum: '#3d0f45'};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fmt = (n: number, d = 0) => n.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});

const useT = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const s = (at: number, cfg = {damping: 14, stiffness: 200, mass: 0.6}) => spring({frame: frame - at * fps, fps, config: cfg});
  const grow = (at: number, d = 0.7) => interpolate(frame, [at * fps, (at + d) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const fadeOut = interpolate(frame, [durationInFrames - 0.35 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return {frame, fps, s, grow, fadeOut};
};

type Base = {title: string; sub?: string; footer?: string; chip?: string; durationSec: number};

const Panel: React.FC<Base & {children: React.ReactNode}> = (p) => {
  const {s, fadeOut} = useT();
  const k = s(0.15, {damping: 16, stiffness: 160, mass: 0.7});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, background: 'rgba(253,253,254,0.97)', borderRadius: 20, padding: '26px 44px 20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: k, transform: `scale(${0.97 + 0.03 * k})`, boxShadow: '0 18px 50px rgba(61,15,69,0.28)', color: C.ink, overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10}}>
          <div style={{background: C.plum, color: '#fff', fontSize: 20, fontWeight: 600, padding: '5px 14px', borderRadius: 999, whiteSpace: 'nowrap'}}>{p.chip ?? 'Forge PG19 study'}</div>
          {p.sub ? <div style={{fontSize: 22, color: C.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{p.sub}</div> : null}
        </div>
        <div style={{fontSize: 40, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.5}}>{p.title}</div>
        <div style={{flex: 1, position: 'relative', marginTop: 16}}>{p.children}</div>
        {p.footer ? <div style={{fontSize: 20, color: C.faint, marginTop: 8}}>{p.footer}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------- horizontal bars, optional groups ----------
type HRow = {label: string; value: number; display: string; color: string};
export type HBarsProps = Base & {kind: 'hbars'; groups: {heading?: string; rows: HRow[]}[]; axisMax: number; labelW?: number; barH?: number; valueW?: number};
const HBars: React.FC<HBarsProps> = (p) => {
  const {s, grow} = useT();
  const LW = p.labelW ?? 430, BW = PANEL.w - 88 - LW - (p.valueW ?? 150), BH = p.barH ?? 46;
  let i = 0;
  return (
    <Panel {...p}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 14}}>
        {p.groups.map((g, gi) => (
          <div key={gi} style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {g.heading ? <div style={{fontSize: 24, fontWeight: 600, color: C.soft}}>{g.heading}</div> : null}
            {g.rows.map((r) => {
              const at = 0.7 + 0.45 * i++;
              const w = (BW * r.value) / p.axisMax;
              return (
                <div key={r.label} style={{display: 'flex', alignItems: 'center', opacity: s(at)}}>
                  <div style={{width: LW, fontSize: 26, color: C.ink, paddingRight: 16, boxSizing: 'border-box'}}>{r.label}</div>
                  <div style={{width: w * grow(at), height: BH, background: r.color, borderRadius: 6}} />
                  <div style={{fontSize: 30, fontWeight: 700, marginLeft: 14, fontVariantNumeric: 'tabular-nums', opacity: grow(at + 0.4, 0.3)}}>{r.display}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Panel>
  );
};

// ---------- line chart (linear axes) ----------
type Pt = {x: number; y: number; label?: string};
export type LineProps = Base & {kind: 'line'; series: {label: string; color: string; points: Pt[]}[]; xMax: number; yMax: number; xStep: number; yStep: number; xUnit: string; yUnit: string};
const Line: React.FC<LineProps> = (p) => {
  const {grow} = useT();
  const W = PANEL.w - 88, H = 380, L = 70, B = 40, R = 30;
  const X = (x: number) => L + ((W - L - R) * x) / p.xMax;
  const Y = (y: number) => H - B - ((H - B - 10) * y) / p.yMax;
  const k = grow(0.8, 2.2);
  const xt = Array.from({length: Math.floor(p.xMax / p.xStep) + 1}, (_, i) => i * p.xStep);
  const yt = Array.from({length: Math.floor(p.yMax / p.yStep) + 1}, (_, i) => i * p.yStep);
  return (
    <Panel {...p}>
      <div style={{display: 'flex', gap: 28, fontSize: 22, color: C.soft, marginBottom: 4}}>
        {p.series.map((s) => <div key={s.label} style={{display: 'flex', alignItems: 'center', gap: 8}}><div style={{width: 22, height: 6, background: s.color, borderRadius: 3}} />{s.label}</div>)}
      </div>
      <svg width={W} height={H} style={{fontFamily: 'Inter, sans-serif'}}>
        {yt.map((v) => <g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke={C.line} /><text x={L - 10} y={Y(v)} textAnchor="end" dominantBaseline="central" fontSize={20} fill={C.faint}>{fmt(v)}</text></g>)}
        {xt.map((v, i) => <text key={v} x={X(v)} y={H - B + 26} textAnchor={i === xt.length - 1 ? 'end' : 'middle'} fontSize={20} fill={C.faint}>{fmt(v)}</text>)}
        <text x={W - R} y={H - B - 10} textAnchor="end" fontSize={20} fill={C.faint}>{p.xUnit}</text>
        <text x={L + 6} y={16} fontSize={20} fill={C.faint}>{p.yUnit}</text>
        {p.series.map((s) => {
          const d = s.points.map((q, j) => `${j ? 'L' : 'M'}${X(q.x)},${Y(q.y)}`).join(' ');
          const len = 4000;
          return (
            <g key={s.label}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={5} strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
              {s.points.map((q, j) => {
                const on = k >= (X(q.x) - L) / (W - L - R) - 0.001;
                return <g key={j} opacity={on ? 1 : 0}><circle cx={X(q.x)} cy={Y(q.y)} r={7} fill={s.color} />{q.label ? <text x={X(q.x) - 12} y={Y(q.y) - 4} textAnchor="end" fontSize={26} fontWeight={700} fill={C.ink}>{q.label}</text> : null}</g>;
              })}
            </g>
          );
        })}
      </svg>
    </Panel>
  );
};

// ---------- dot plot (JIT) ----------
export type DotsProps = Base & {kind: 'dots'; rows: {label: string; values: number[]; mean: number; meanLabel: string; marks: {value: number; text: string}[]}[]; min: number; max: number; step: number; leftNote: string; rightNote: string};
const Dots: React.FC<DotsProps> = (p) => {
  const {grow, s} = useT();
  const W = PANEL.w - 88, L = 300, R = 40;
  const X = (v: number) => L + ((W - L - R) * (v - p.min)) / (p.max - p.min);
  const ticks = Array.from({length: Math.round((p.max - p.min) / p.step) + 1}, (_, i) => +(p.min + i * p.step).toFixed(2));
  const RH = 150, H = p.rows.length * RH + 70;
  return (
    <Panel {...p}>
      <svg width={W} height={H} style={{fontFamily: 'Inter, sans-serif'}}>
        {ticks.map((t) => <g key={t}><line x1={X(t)} x2={X(t)} y1={10} y2={H - 50} stroke={t === 1 ? C.ink : C.line} strokeWidth={t === 1 ? 2.5 : 1} /><text x={X(t)} y={H - 22} textAnchor="middle" fontSize={20} fill={C.faint}>{t.toFixed(1)}</text></g>)}
        <text x={L} y={H} fontSize={20} fill={C.faint}>{p.leftNote}</text>
        <text x={W - R} y={H} textAnchor="end" fontSize={20} fill={C.faint}>{p.rightNote}</text>
        {p.rows.map((r, ri) => {
          const cy = 20 + ri * RH + 55, at = 0.8 + ri * 2.2;
          return (
            <g key={r.label}>
              <text x={0} y={cy - 14} fontSize={25} fontWeight={600} fill={C.ink} opacity={s(at)}>{r.label.split('\n')[0]}</text>
              <text x={0} y={cy + 18} fontSize={21} fill={C.soft} opacity={s(at)}>{r.label.split('\n')[1] ?? ''}</text>
              {r.values.map((v, j) => <circle key={j} cx={X(v)} cy={cy + ((j % 3) - 1) * 9} r={9} fill={C.s19} fillOpacity={0.8} opacity={grow(at + 0.03 * j, 0.25)} />)}
              <g opacity={grow(at + 1.0, 0.4)}>
                <line x1={X(r.mean)} x2={X(r.mean)} y1={cy - 38} y2={cy + 38} stroke={C.plum} strokeWidth={4} />
                <text x={X(r.mean)} y={cy - 46} textAnchor="middle" fontSize={23} fontWeight={700} fill={C.plum}>{r.meanLabel}</text>
              </g>
              {r.marks.map((m, j) => <text key={j} x={X(m.value)} y={cy + 52} textAnchor={m.value > 1.1 ? 'end' : m.value < 0.7 ? 'start' : 'middle'} fontSize={20} fill={C.soft} opacity={grow(at + 1.4, 0.4)}>{m.text}</text>)}
            </g>
          );
        })}
      </svg>
    </Panel>
  );
};

// ---------- stacked horizontal bars (rehearsals) ----------
export type StackProps = Base & {kind: 'stack'; classes: {key: string; label: string; color: string}[]; rows: {label: string; counts: Record<string, number>}[]; axisMax: number; callout?: string};
const Stack: React.FC<StackProps> = (p) => {
  const {s, grow} = useT();
  const LW = 150, BW = PANEL.w - 88 - LW - 90;
  return (
    <Panel {...p}>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px 22px', fontSize: 20, color: C.soft, marginBottom: 12}}>
        {p.classes.map((c) => <div key={c.key} style={{display: 'flex', alignItems: 'center', gap: 7}}><div style={{width: 16, height: 16, background: c.color, borderRadius: 3}} />{c.label}</div>)}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {p.rows.map((r, i) => {
          const at = 0.8 + 0.35 * i, k = grow(at, 0.8);
          const total = Object.values(r.counts).reduce((a, b) => a + b, 0);
          return (
            <div key={r.label} style={{display: 'flex', alignItems: 'center', opacity: s(at)}}>
              <div style={{width: LW, fontSize: 25}}>{r.label}</div>
              <div style={{display: 'flex', width: (BW * total * k) / p.axisMax, height: 42, overflow: 'hidden', borderRadius: 5}}>
                {p.classes.map((c) => <div key={c.key} style={{width: `${(100 * (r.counts[c.key] ?? 0)) / total}%`, background: c.color, color: '#fff', fontSize: 19, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset -2px 0 0 rgba(255,255,255,0.7)'}}>{r.counts[c.key] ?? ''}</div>)}
              </div>
              <div style={{fontSize: 24, fontWeight: 700, marginLeft: 12, opacity: grow(at + 0.6, 0.3)}}>{total}</div>
            </div>
          );
        })}
      </div>
      {p.callout ? <div style={{fontSize: 27, fontWeight: 600, color: C.plum, marginTop: 14, opacity: grow(3.4, 0.5)}}>{p.callout}</div> : null}
    </Panel>
  );
};

// ---------- before -> after (big numbers) ----------
export type PopProps = Base & {kind: 'pop'; pairs: {caption: string; before: string; after: string; beforeLabel: string; afterLabel: string; good?: boolean}[]};
const Pop: React.FC<PopProps> = (p) => {
  const {s} = useT();
  return (
    <Panel {...p}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 26}}>
        {p.pairs.map((q, i) => {
          const at = 0.7 + i * 2.0;
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 4}}>
              <div style={{fontSize: 26, color: C.soft, opacity: s(at)}}>{q.caption}</div>
              <div style={{display: 'flex', alignItems: 'flex-end', gap: 36}}>
                <div style={{opacity: s(at)}}><div style={{fontSize: 88, fontWeight: 800, color: C.s18, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{q.before}</div><div style={{fontSize: 23, color: C.soft, marginTop: 6}}>{q.beforeLabel}</div></div>
                <div style={{fontSize: 70, color: C.faint, paddingBottom: 34, opacity: s(at + 0.5)}}>→</div>
                <div style={{opacity: s(at + 0.8), transform: `scale(${0.85 + 0.15 * s(at + 0.8, {damping: 10, stiffness: 220, mass: 0.5})})`, transformOrigin: 'left bottom'}}><div style={{fontSize: 88, fontWeight: 800, color: C.s19, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{q.after}</div><div style={{fontSize: 23, color: C.soft, marginTop: 6}}>{q.afterLabel}</div></div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

// ---------- vertical bars by major version ----------
export type VBarsProps = Base & {kind: 'vbars'; bars: {label: string; value: number; color: string}[]; axisMax: number; median?: {value: number; label: string}; side?: {big: string; text: string}[]};
const VBars: React.FC<VBarsProps> = (p) => {
  const {s, grow} = useT();
  const W = 1000, H = 400, B = 36, T = 34;
  const bw = W / p.bars.length;
  const Y = (v: number) => H - B - ((H - B - T) * v) / p.axisMax;
  return (
    <Panel {...p}>
      <div style={{display: 'flex', gap: 40, alignItems: 'center'}}>
        <svg width={W} height={H} style={{fontFamily: 'Inter, sans-serif', flex: 'none'}}>
          {p.bars.map((b, i) => {
            const at = 0.6 + 0.12 * i, k = grow(at, 0.6);
            const y = Y(b.value * k);
            return (
              <g key={b.label}>
                <rect x={i * bw + 10} y={y} width={bw - 20} height={H - B - y} rx={4} fill={b.color} />
                <text x={i * bw + bw / 2} y={y - 8} textAnchor="middle" fontSize={21} fontWeight={700} fill={C.ink} opacity={grow(at + 0.5, 0.3)}>{fmt(b.value)}</text>
                <text x={i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize={22} fill={C.soft}>{b.label}</text>
              </g>
            );
          })}
          {p.median ? <g opacity={grow(2.2, 0.4)}><line x1={0} x2={W} y1={Y(p.median.value)} y2={Y(p.median.value)} stroke={C.ink} strokeDasharray="8 6" strokeWidth={2} /><text x={W - 4} y={Y(p.median.value) + 22} textAnchor="end" fontSize={20} fill={C.ink}>{p.median.label}</text></g> : null}
        </svg>
        <div style={{display: 'flex', flexDirection: 'column', gap: 26}}>
          {(p.side ?? []).map((x, i) => <div key={i} style={{opacity: s(2.6 + 0.8 * i)}}><div style={{fontSize: 64, fontWeight: 800, color: C.s19, lineHeight: 1}}>{x.big}</div><div style={{fontSize: 23, color: C.soft, marginTop: 4}}>{x.text}</div></div>)}
        </div>
      </div>
    </Panel>
  );
};

// ---------- big numbers with a line each ----------
export type StatsProps = Base & {kind: 'stats'; stats: {big: string; text: string; color?: string}[]};
const Stats: React.FC<StatsProps> = (p) => {
  const {s} = useT();
  return (
    <Panel {...p}>
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 34}}>
        {p.stats.map((x, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 32, opacity: s(0.7 + 1.6 * i)}}>
            <div style={{fontSize: 68, fontWeight: 800, color: x.color ?? C.s19, lineHeight: 1, width: 520, flex: 'none', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>{x.big}</div>
            <div style={{fontSize: 28, color: C.soft, lineHeight: 1.25}}>{x.text}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export type ForgeProps = HBarsProps | LineProps | DotsProps | StackProps | PopProps | VBarsProps | StatsProps;
export const Forge: React.FC<ForgeProps> = (p) => {
  switch (p.kind) {
    case 'hbars': return <HBars {...p} />;
    case 'line': return <Line {...p} />;
    case 'dots': return <Dots {...p} />;
    case 'stack': return <Stack {...p} />;
    case 'pop': return <Pop {...p} />;
    case 'vbars': return <VBars {...p} />;
    case 'stats': return <Stats {...p} />;
  }
};
