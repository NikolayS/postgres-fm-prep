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
export const C = {s18: '#2a78d6', s19: '#d9822b', s3: '#7a5bd6', grey: '#8b95a1', red: '#a8433b', ink: '#1d2530', soft: '#4c5766', faint: '#6b7581', line: '#d4d9e0', plum: '#3d0f45'};
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

type Base = {title: string; sub?: string; footer?: string; chip?: string; durationSec: number; qaNoText?: boolean};

const NoTextStyle = () => <style>{`[data-qa-no-text], [data-qa-no-text] * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; } [data-qa-no-text] text:not(.hero) { fill: none !important; stroke: none !important; }`}</style>;

const Panel: React.FC<Base & {children: React.ReactNode}> = (p) => {
  const {s, fadeOut} = useT();
  const k = s(0.15, {damping: 16, stiffness: 160, mass: 0.7});
  return (
    <AbsoluteFill data-qa-no-text={p.qaNoText || undefined} style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <NoTextStyle/>
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
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 48}}>
        {p.stats.map((x, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 32, opacity: s(0.7 + 1.6 * i)}}>
            <div style={{fontSize: 104, fontWeight: 800, color: x.color ?? C.s19, lineHeight: 1, width: 560, flex: 'none', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>{x.big}</div>
            <div style={{fontSize: 36, color: C.ink, lineHeight: 1.25}}>{x.text}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
};

export type ForgeProps = HBarsProps | LineProps | DotsProps | StackProps | PopProps | VBarsProps | StatsProps | V2Props;
export const Forge: React.FC<ForgeProps> = (p) => {
  switch (p.kind) {
    case 'v2-credits': case 'v2-repack': case 'v2-notify': case 'v2-autovac':
    case 'v2-advice': case 'v2-jit': case 'v2-lz4': case 'v2-rehearsal': case 'v2-plans': return <V2Card {...p} />;
    case 'hbars': return <HBars {...p} />;
    case 'line': return <Line {...p} />;
    case 'dots': return <Dots {...p} />;
    case 'stack': return <Stack {...p} />;
    case 'pop': return <Pop {...p} />;
    case 'vbars': return <VBars {...p} />;
    case 'stats': return <Stats {...p} />;
  }
};

// V2: one explicitly sized graphic viewport per card. Boxes describe the chart
// envelope (axes, marks and numeric callouts), not the sum of painted pixels.
export const G = {x: 90, y: 370, w: 1460, h: 490};
export type V2Kind = 'v2-credits' | 'v2-repack' | 'v2-notify' | 'v2-autovac' | 'v2-advice' | 'v2-jit' | 'v2-lz4' | 'v2-rehearsal' | 'v2-plans';
export type V2Props = Base & {kind: V2Kind; labels: Record<string, string>};
export type GraphicBox = {x: number; y: number; w: number; h: number};
export function graphicBoxes(p: {kind: string}): GraphicBox[] {
  switch (p.kind) {
    case 'v2-credits': case 'v2-repack': case 'v2-notify': case 'v2-autovac':
    case 'v2-advice': case 'v2-jit': case 'v2-lz4': case 'v2-rehearsal': case 'v2-plans': return [{...G}];
    default: return [];
  }
}
// Every linguistic string rendered by V2 is supplied here; units and numeric
// axis/version tags are intentionally separate from narrative labels.
export const visibleStrings = (p: V2Props) => [p.title, ...Object.values(p.labels), p.chip ?? 'Forge PG19 study'];
const T = ({x, y, children, size = 30, color = C.soft, weight = 600, anchor = 'start', opacity = 1, maxWidth}: {x: number; y: number; children: React.ReactNode; size?: number; color?: string; weight?: number; anchor?: 'start' | 'middle' | 'end'; opacity?: number; maxWidth?: number}) =>
  <text className={size >= 100 ? 'hero' : undefined} x={x} y={y} textLength={maxWidth} lengthAdjust={maxWidth ? "spacingAndGlyphs" : undefined} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor} opacity={opacity} style={{fontVariantNumeric: 'tabular-nums', letterSpacing: size >= 100 ? -5 : 0}}>{children}</text>;
const R = ({x,y,w,h,color,opacity=1}: {x:number;y:number;w:number;h:number;color:string;opacity?:number}) => <rect x={x} y={y} width={Math.max(0,w)} height={Math.max(0,h)} rx={4} fill={color} opacity={opacity}/>;
const Rule = ({x1,x2,y,color=C.line}: {x1:number;x2:number;y:number;color?:string}) => <line x1={x1} x2={x2} y1={y} y2={y} stroke={color} strokeWidth={2}/>;
const TableIcon = ({x,y,k=1}: {x:number;y:number;k?:number}) => <g transform={`translate(${x},${y}) scale(${k})`}><rect x={-22} y={-26} width={44} height={52} rx={5} fill={C.red}/><path d="M-15,-9 H15 M-15,6 H15 M-5,-18 V20" stroke="white" strokeWidth={3}/></g>;
const Cylinder = ({x,y,h,color,w=90}: {x:number;y:number;h:number;color:string;w?:number}) => <g opacity={h>0?1:0}><path d={`M${x},${y-h+12} v${Math.max(0,h-24)} a${w/2},12 0 0 0 ${w},0 v-${Math.max(0,h-24)}`} fill={color}/><ellipse cx={x+w/2} cy={y-h+12} rx={w/2} ry={12} fill={color} stroke="white" strokeWidth={3}/><path d={`M${x},${y-24} a${w/2},12 0 0 0 ${w},0`} fill="none" stroke="white" strokeOpacity={0.5} strokeWidth={2}/></g>;
const V2Card: React.FC<V2Props> = (p) => {
  const {frame,fps,fadeOut} = useT();
  const time=frame/fps;
  const lin=(at:number,end:number)=>interpolate(time,[at,end],[0,1],clamp);
  const pulse=(at:number)=>1+0.14*interpolate(time,[at,at+0.12,at+0.4],[0,1,0],clamp);
  const labels=p.labels;
  let art: React.ReactNode;
  switch(p.kind) {
    case 'v2-credits': {
      const values=[324,313,410,380,415,411,361,463,507,645];
      const X=(i:number)=>145+i*94, Y=(v:number)=>820-v/700*440;
      art=<>
        <line x1={125} x2={125} y1={380} y2={820} stroke={C.line} strokeWidth={2}/>{[0,350,700].map(v=><g key={v}><Rule x1={125} x2={1090} y={Y(v)}/><T x={123} y={Y(v)+6} size={17} anchor="end">{v}</T></g>)}
        {values.map((v,i)=>{const k=i===9?lin(1.7,2)*interpolate(time,[2,2.25,2.8],[1,1.06,1],clamp):lin(.8+i*.09,1.2+i*.09);return <g key={i}><R x={X(i)} y={Y(v*k)} w={74} h={820-Y(v*k)} color={i===9?C.s19:i===8?C.s18:C.grey}/><T x={X(i)+37} y={852} size={24} anchor="middle">{10+i}</T><T x={X(i)+37} y={798} size={21} color="white" anchor="middle" opacity={lin(2.8,3)}>{v}</T></g>;})}
        <g opacity={lin(3,3.5)}><line x1={125} x2={1090} y1={Y(410.5)} y2={Y(410.5)} stroke={C.plum} strokeWidth={3} strokeDasharray="8 8"/><T x={145} y={Y(410.5)-15} color={C.plum}>{labels.median}</T></g>
        <g opacity={lin(4.5,4.7)}>
          <T x={1150} y={680} anchor="start">{labels.commits}</T>
          {[2774,2990].map((v,i)=><g key={v}><T x={1150} y={738+i*76} size={26}>{18+i}</T><R x={1195} y={708+i*76} w={v/3000*240*lin(4.5,5.3)} h={44} color={i?C.s19:C.grey}/><T x={1205+v/3000*240} y={740+i*76} size={26}>{fmt(v)}</T></g>)}
        </g>
        <T x={1130} y={580} size={200} color={C.s19} weight={800}>{fmt(645*lin(2,2.8))}</T><T x={1150} y={612}>{labels.people ?? 'people'}</T>
      </>; break;
    }
    case 'v2-repack': {
      const X=(v:number)=>170+v/70000*1340,Y=(v:number)=>795-v/90*390;
      const series=[[[1013,.02],[4994,.14],[9989,.38],[19980,1.18],[26363,3.54]],[[30198,2.44],[52562,7],[56652,27.66],[65996,85.72]]];
      const k=interpolate(time,[2.5,5],[0,1],{...clamp,easing:Easing.in(Easing.quad)});
      const q=k*3,idx=Math.min(2,Math.floor(q)),f=q-idx;
      const head=series[1][idx].map((v,j)=>v+(series[1][idx+1][j]-v)*f);
      art=<>{[0,15,30,45,60,75,90].map(v=><g key={v}><Rule x1={170} x2={1510} y={Y(v)}/><T x={150} y={Y(v)+7} size={21} anchor="end">{v}</T></g>)}{Array.from({length:8},(_,i)=>i*10000).map(v=><T key={v} x={X(v)} y={829} size={21} anchor={v===70000?'end':'middle'}>{fmt(v)}</T>)}<T x={112} y={390} size={22}>s</T><T x={1510} y={855} size={22} anchor="end">rows/s</T>
        <T x={210} y={560} size={170} color={C.s3} weight={800}>{(time<2.5?0:head[1]).toFixed(1)} s</T>
        <T x={230} y={625} color={C.s19}>{labels.orange}</T><T x={590} y={625} color={C.s3}>{labels.purple}</T>
        {series.map((points,i)=>{const progress=i?k:lin(.8,2.2),n=progress*(points.length-1),a=Math.min(points.length-2,Math.floor(n)),t=n-a;const active=[...points.slice(0,a+1),points[a].map((v,j)=>v+(points[a+1][j]-v)*t)];return <g key={i} opacity={time>=(i?2.5:.8)?1:0}><polyline points={active.map(v=>`${X(v[0])},${Y(v[1])}`).join(' ')} fill="none" stroke={i?C.s3:C.s19} strokeWidth={7} strokeLinejoin="round"/>{points.map((v,j)=><circle key={j} cx={X(v[0])} cy={Y(v[1])} r={7} fill={i?C.s3:C.s19} opacity={j<=n?1:0}/>)}</g>;})}
        <T x={X(26363)+12} y={Y(3.54)-20} size={30} color={C.s19} opacity={lin(2.1,2.2)}>3.5 s</T>
        <g opacity={lin(2.5,2.7)} transform={`translate(${X(head[0])},${Y(head[1])}) rotate(${interpolate(time,[5,5.08,5.16,5.24,5.4],[0,-8,8,-5,0],clamp)}) scale(${.6+head[1]/90*.6})`}><rect x={-19} y={-10} width={38} height={30} rx={5} fill={C.s3}/><path d="M-11,-10 V-19 A11,11 0 0 1 11,-19 V-10" fill="none" stroke={C.s3} strokeWidth={5}/><circle cy={2} r={3} fill="white"/></g>
      </>;break;
    }
    case 'v2-notify': {
      const k=lin(.8,3.4),bw=1290;
      art=<><line x1={260} x2={260} y1={380} y2={835} stroke={C.line} strokeWidth={2}/><Rule x1={260} x2={1550} y={835}/>{[0,5000,10000].map(n=><g key={n}><line x1={260+n/11040*1290} x2={260+n/11040*1290} y1={380} y2={835} stroke={C.line} strokeWidth={2}/><T x={260+n/11040*1290} y={858} size={18} anchor="middle">{fmt(n)}</T></g>)}<T x={90} y={485} size={48} color={C.s18}>18.7</T><T x={90} y={725} size={48} color={C.s19}>19</T>
        <R x={260} y={405} w={bw} h={155} color="#edf1f6"/><R x={260} y={625} w={bw} h={175} color="#f5eadf"/>
        <R x={260} y={405} w={bw*Math.min(200/11040,k)} h={155} color={C.s18}/><T x={310} y={510} size={72} color={C.s18} weight={800}>200/s</T>
        <R x={260} y={625} w={bw*k} h={175} color={C.s19}/><T x={310} y={758} size={150} maxWidth={k<.5?Math.max(1,bw*k-65):undefined} color="white" weight={800} opacity={lin(1.1,1.5)}>{fmt(11040*k)}/s</T>
        {Array.from({length:1000},(_,i)=><circle key={i} cx={1155+(i%50)*7.8} cy={401+Math.floor(i/50)*6.8} r={2.5} fill={i<1000*k?C.s19:'#cfd5dd'}/>)}<T x={1550} y={577} anchor="end">{labels.listeners}</T>
      </>;break;
    }
    case 'v2-autovac': {
      const X=(s:number)=>260+s/160*1290,head=160*lin(1,6);
      art=<>{[0,40,80,120,160].map(v=><line key={v} x1={X(v)} x2={X(v)} y1={380} y2={825} stroke={C.line} strokeWidth={2}/>)}<T x={90} y={485} size={48} color={C.s18}>18.7</T><T x={90} y={705} size={48} color={C.s19}>19</T>
        {[485,705].map((y,lane)=><g key={y}><Rule x1={260} x2={1550} y={y}/>{Array.from({length:120},(_,i)=>{const t=lane?17+i/119*135:2+i/119*145;return <line key={i} x1={X(t)} x2={X(t)} y1={y-20} y2={y+20} stroke={C.grey} strokeWidth={3} opacity={t<=head?1:.12}/>;})}</g>)}
        <TableIcon x={X(152.3)} y={485} k={pulse(1+152.3/32)}/><TableIcon x={X(12.9)} y={705} k={pulse(1+12.9/32)}/>
        <T x={X(152.3)-40} y={460} size={110} color={C.s18} weight={800} anchor="end" opacity={lin(1+152.3/32,6.2)}>152.3 s</T><T x={X(12.9)+42} y={675} size={150} color={C.s19} weight={800} opacity={lin(1.4,1.8)}>12.9 s</T>
        <line x1={X(head)} x2={X(head)} y1={385} y2={785} stroke={C.plum} strokeWidth={3} opacity={time<6?0.55:0}/>
        <Rule x1={260} x2={1550} y={805}/>{[0,40,80,120,160].map(v=><T key={v} x={X(v)} y={840} size={23} anchor={v===160?'end':'middle'}>{v}{v===160?' s':''}</T>)}<T x={90} y={840} size={25}>{labels.tables}</T>
      </>;break;
    }
    case 'v2-advice': {
      const base=lin(.8,1.6),value=time<2?100:interpolate(time,[2,2.6,3.2],[100,89,86],clamp),Y=(v:number)=>820-v*4.4;
      art=<>{[0,50,100].map(v=><g key={v}><Rule x1={150} x2={v===50?560:1550} y={Y(v)}/>{v===50?<Rule x1={1130} x2={1550} y={Y(v)}/>:null}<T x={150} y={Y(v)+7} size={20} anchor="end">{v}%</T></g>)}
        {[100,value].map((v,i)=><g key={i}><R x={220+i*970} y={Y(v*base)} w={260} h={820-Y(v*base)} color={i?C.s19:C.grey}/>{i===1?<R x={1190} y={Y(89)} w={260} h={3*4.4} color="url(#hatch)" opacity={lin(2.8,3.2)}/>:null}<T x={350+i*970} y={852} anchor="middle">{i?labels.on:labels.off}</T></g>)}
        <T x={600} y={655} size={120} maxWidth={500} color={C.red} weight={800}>−{fmt(11*lin(2,3.2))}–{fmt(14*lin(2,3.2))}%</T>
      </>;break;
    }
    case 'v2-jit': {
      art=<>{[{x:90,max:6000,a:3914,b:4607,label:labels.longest},{x:850,max:250,a:172,b:108,label:labels.short}].map((v,i)=>{const left=v.x+100,w=600,X=(n:number)=>left+n/v.max*w;return <g key={i}>{[0,v.max/2,v.max].map(n=><line key={n} x1={X(n)} x2={X(n)} y1={n===v.max/2?580:375} y2={815} stroke={C.line} strokeWidth={2}/>)}<Rule x1={left} x2={left+w} y={375}/><T x={left+20} y={409}>{v.label}</T><T x={left+20} y={555} size={140} color={i?C.plum:C.red} weight={800}>{i?'−':'+'}{i?fmt(37*lin(2.4,3.2)):fmt(17.7*lin(2.4,3.2),1)}%</T>
          {[v.a,v.b].map((n,j)=><g key={j}><T x={v.x} y={630+j*130} size={27}>{j?'19':'18.7'}</T><R x={left} y={590+j*130} w={w*n/v.max*lin(j?1.6:.8,j?2.4:1.4)} h={65} color={j?C.s19:C.s18}/><text x={X(i && j ? v.a : n)+14} y={622.5+j*130} dominantBaseline="central" fontSize={26} fill={C.soft} fontWeight={600}>{fmt(n)} ms</text></g>)}
          {i?<rect x={X(v.b)} y={720} width={X(v.a)-X(v.b)} height={65} fill="none" stroke={C.plum} strokeDasharray="9 6" strokeWidth={3} opacity={interpolate(time,[2.4,2.55,2.7,2.85,3.2],[0,1,.35,1,1],clamp)}/>:<R x={X(v.a)} y={720} w={X(v.b)-X(v.a)} h={65} color="url(#hatch)" opacity={interpolate(time,[2.4,2.55,2.7,2.85,3.2],[0,1,.35,1,1],clamp)}/>}
          <Rule x1={left} x2={left+w} y={815}/>{[0,v.max/2,v.max].map(n=><T key={n} x={X(n)} y={848} size={22} anchor={n===v.max?'end':'middle'}>{fmt(n)}{n===v.max?' ms':''}</T>)}
        </g>;})}</>;break;
    }
    case 'v2-lz4': {
      const clock=22*Math.max(0,time-.8),X=(s:number)=>260+s/110*980;
      art=<>{[0,55,110].map(n=><line key={n} x1={X(n)} x2={X(n)} y1={380} y2={820} stroke={C.line} strokeWidth={2}/>)}<Rule x1={260} x2={1240} y={380}/><Rule x1={260} x2={1240} y={820}/>{[0,50].map(n=><Rule key={n} x1={1290} x2={1550} y={820-n*4.4}/>)}<line x1={1290} x2={1290} y1={380} y2={820} stroke={C.line} strokeWidth={2}/><line x1={1550} x2={1550} y1={380} y2={820} stroke={C.line} strokeWidth={2}/>{[107,44].map((n,i)=>{const y=480+i*220,progress=Math.min(clock,n);return <g key={i}><T x={90} y={y-25} size={32} color={i?C.s19:C.s18}>{i?labels.lz4:labels.pglz}</T><T x={90} y={y+20} size={30}>{i?'19':'18.7'}</T><Rule x1={260} x2={1240} y={y+60}/><R x={260} y={y+35} w={X(progress)-260} h={25} color={i?C.s19:C.s18}/><Cylinder x={1200} y={y+15} h={65} w={40} color={i?C.s19:C.s18}/>{Array.from({length:8},(_,j)=>{const k=(clock/18+j/8)%1;return <g key={j} opacity={clock<n&&time>=.8?.7:0} transform={`translate(${270+k*900},${y-30})`}><path d="M0,0 H17 L26,9 V36 H0 Z M17,0 V9 H26" fill="white" stroke={i?C.s19:C.s18} strokeWidth={3}/></g>;})}<T x={300} y={y+10} size={i?150:110} color={i?C.s19:C.s18} weight={800} opacity={lin(.8+n/22,.8+n/22+.22)}>{n} s</T></g>;})}
        {[0,55,110].map(n=><T key={n} x={X(n)} y={840} size={22} anchor={n===110?'end':'middle'}>{n}{n===110?' s':''}</T>)}
        <Cylinder x={1310} y={820} h={360*lin(6.2,7)} color={C.s18}/><Cylinder x={1440} y={820} h={400.68*lin(6.2,7)} color={C.s19}/><T x={1310} y={850} size={24}>18.7</T><T x={1440} y={850} size={24}>19</T><T x={1420} y={410} size={48} anchor="middle" color={C.plum} weight={800} opacity={lin(6.2,7)}>+11.3%</T>
      </>;break;
    }
    case 'v2-rehearsal': {
      const red=lin(3,4.4),purple=lin(5,5.8);
      art=<>{Array.from({length:687},(_,i)=>{const isRed=i>=567&&i<656,isPurple=i>=656,k=isRed?red:isPurple?purple:0;return <circle key={i} cx={101+i%43*22} cy={400+Math.floor(i/43)*29} r={7+(k>0&&k<1?2:0)} fill={isRed&&i-567<89*red?C.red:isPurple&&i-656<31*purple?C.s3:C.grey} opacity={lin(.8+Math.floor(i/43)*.09,1.05+Math.floor(i/43)*.09)}/>;})}
        <T x={1060} y={560} size={170} color={C.red} weight={800}>{fmt(89*red)}</T><T x={1070} y={608}>{labels.false}</T>
        <T x={1060} y={800} size={170} color={C.s3} weight={800}>{fmt(31*purple)}</T><T x={1070} y={848}>{labels.start}</T>
      </>;break;
    }
    case 'v2-plans': {
      const changed=lin(1.8,3.8),commit=lin(4.5,5.5);
      art=<>{Array.from({length:220},(_,i)=>{const flip=lin(1.8+i/83*1.7,2.1+i/83*1.7),orange=i<83&&flip>=.5,purple=i<61&&i<61*commit;return <g key={i}>{purple?<line x1={109+i%22*44} y1={419+Math.floor(i/22)*44} x2={1445} y2={690} stroke={C.s3} strokeWidth={.8} opacity={.07*commit}/>:null}<g transform={`translate(${109+i%22*44},${419+Math.floor(i/22)*44})`} opacity={lin(.8+i/220*.4,1+i/220*.4)}><rect style={{transform:`rotateY(${i<83?180*flip:0}deg)`,transformBox:"fill-box",transformOrigin:"center"}} x={-19} y={-19} width={38} height={38} rx={5} fill={purple?C.s3:orange?C.s19:C.grey}/></g></g>;})}
        <T x={1110} y={565} size={190} color={C.s19} weight={800}>{fmt(83*changed)}</T><T x={1115} y={610}>{labels.changed}</T>
        <T x={1110} y={765} size={120} color={C.s3} weight={800}>{fmt(61*commit)}</T><T x={1115} y={820}>{labels.commit}</T><g opacity={lin(4.5,5.5)} stroke={C.s3} strokeWidth={6}><line x1={1360} x2={1530} y1={690} y2={690}/><circle cx={1445} cy={690} r={24} fill="#fdfdfe"/></g>
      </>;break;
    }
  }
  const panel=spring({frame:Math.min(frame,.4*fps),fps,durationInFrames:Math.round(.4*fps),config:{damping:18,stiffness:200,mass:.6}});
  const box=graphicBoxes(p)[0];
  return <AbsoluteFill data-qa-no-text={p.qaNoText || undefined} style={{fontFamily:'Inter, sans-serif',opacity:fadeOut}}>
    <NoTextStyle/>
    <div style={{position:'absolute',left:PANEL.x,top:PANEL.y,width:PANEL.w,height:PANEL.h,borderRadius:20,background:'rgba(253,253,254,0.97)',boxShadow:'0 18px 50px rgba(61,15,69,0.28)',opacity:panel,transform:`scale(${.97+.03*panel})`}}/>
    <svg width={1920} height={1080} style={{position:'absolute',opacity:panel}}>
      <defs><pattern id="hatch" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width={9} height={9} fill={C.s19}/><rect width={3} height={9} fill={C.red}/></pattern></defs>
      <T x={90} y={330} size={56} color={C.plum} weight={800} opacity={lin(.2,.6)}>{p.title}</T>
      <g opacity={lin(.2,.6)}><rect x={p.chip?.includes('synthetic')?1210:1328} y={290} width={p.chip?.includes('synthetic')?340:222} height={40} rx={20} fill={C.plum}/><T x={1534} y={318} size={22} color="white" anchor="end">{p.chip}</T></g>
      <svg opacity={lin(.8,1)} x={box.x} y={box.y} width={box.w} height={box.h} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} overflow="hidden">{art}</svg>
    </svg>

  </AbsoluteFill>;
};
