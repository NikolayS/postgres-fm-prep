import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig, Easing, delayRender, continueRender, staticFile} from 'remotion';
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

// The shared loader has weights 400–700. Load the specified 800 face as well.
let extraBoldLoaded = false;
const extraBold = () => {
  if (extraBoldLoaded || typeof document === 'undefined') return;
  extraBoldLoaded = true;
  const handle = delayRender('load Inter 800');
  new FontFace('Inter', `url(${staticFile('fonts/Inter-ExtraBold.ttf')})`, {weight:'800'}).load()
    .then(face => document.fonts.add(face)).finally(() => continueRender(handle));
};
const useT = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  extraBold();
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

export type ForgeProps = CenterShotProps | HBarsProps | LineProps | DotsProps | StackProps | PopProps | VBarsProps | StatsProps | V2Props;
export const Forge: React.FC<ForgeProps> = (p) => {
  switch (p.kind) {
    case 'v2-credits': case 'v2-cves': case 'v2-cves-rel': case 'v2-cves-both': case 'v2-repack': case 'v2-notify': case 'v2-autovac':
    case 'v2-advice': case 'v2-jit': case 'v2-lz4': case 'v2-rehearsal': case 'v2-plans': return <V2Card {...p} />;
    case 'v2-shot': return <CenterShot {...(p as any)} />;
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
export type V2Kind = 'v2-credits' | 'v2-cves' | 'v2-cves-rel' | 'v2-cves-both' | 'v2-repack' | 'v2-notify' | 'v2-autovac' | 'v2-advice' | 'v2-jit' | 'v2-lz4' | 'v2-rehearsal' | 'v2-plans';
export type V2Props = Base & {kind: V2Kind; labels: Record<string, string>};
export type GraphicBox = {x: number; y: number; w: number; h: number};
export function graphicBoxes(p: {kind: string}): GraphicBox[] {
  switch (p.kind) {
    case 'v2-credits': case 'v2-cves': case 'v2-cves-rel': case 'v2-cves-both': case 'v2-repack': case 'v2-notify': case 'v2-autovac':
    case 'v2-advice': case 'v2-jit': case 'v2-lz4': case 'v2-rehearsal': case 'v2-plans': return [{...G}];
    default: return [];
  }
}
// Every linguistic string rendered by V2 is supplied here; units and numeric
// axis/version tags are intentionally separate from narrative labels.
export const visibleStrings = (p: V2Props) => [p.title, ...Object.values(p.labels)];
const T = ({x,y,children,size=30,color=C.soft,weight=600,anchor='start',opacity=1,center=false}: {x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:'start'|'middle'|'end';opacity?:number;center?:boolean}) =>
  <text className={size>=100?'hero':undefined} x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor} dominantBaseline={center?'central':undefined} opacity={opacity} style={{fontVariantNumeric:'tabular-nums',fontFeatureSettings:'"tnum"'}}>{children}</text>;
// Square zero end, rounded value end, including true sub-pixel lengths.
const Bar = ({x,y,w,h,color,r=10,opacity=1}: {x:number;y:number;w:number;h:number;color:string;r?:number;opacity?:number}) => {
  const a=Math.min(r,w/2,h/2);
  return <path d={`M${x},${y} H${x+w-a} Q${x+w},${y} ${x+w},${y+a} V${y+h-a} Q${x+w},${y+h} ${x+w-a},${y+h} H${x} Z`} fill={color} opacity={opacity}/>;
};
const Value = ({x,y,n,unit,size,color=C.soft,center=true}: {x:number;y:number;n:string;unit:string;size:number;color?:string;center?:boolean}) => <T x={x} y={y} size={size} weight={800} color={color} center={center}>{n}<tspan dx={10} fontSize={size/2} fontWeight={600}>{unit}</tspan></T>;
type PairRow = {tag:string;length:number;value:number;unit:string;decimals?:number;sub?:string;at?:number;duration?:number;subAt?:number};
const PAIR = ({rows,advice=false,rangeLabel='to'}: {rows:PairRow[];advice?:boolean;rangeLabel?:string}) => {
  const {grow}=useT();
  const d0=rows[0].duration??Math.max(.3,rows[0].length/820*1.4);
  return <>
    <line x1={230} x2={230} y1={385} y2={795} stroke={C.soft} strokeWidth={3} opacity={grow(.8,.3)}/>
    {rows.map((row,i)=>{
      const y=390+i*240,at=row.at??(i?1.1+d0+.4:1.1),duration=row.duration??Math.max(.3,row.length/820*1.4),k=grow(at,duration),color=i?C.s19:advice?C.grey:C.s18;
      return <g key={i}>
        <T x={205} y={y+80} size={52} weight={800} color={color} anchor="end" center opacity={grow(.8,.3)}>{row.tag}</T>
        <Bar x={230} y={y} w={row.length*k} h={160} color={color} r={advice&&i?0:10}/>
        {advice&&i?<><Bar x={866} y={y} w={23} h={160} color={C.s19} opacity={.45*grow(3.9,.4)}/><T x={998} y={y+80} size={96} weight={800} color={C.plum} center opacity={grow(4.3,.5)}>−11<tspan fontSize={48} fontWeight={600}>{' '+rangeLabel+' '}</tspan>−14%</T></>:<g opacity={grow(at,.15)}><Value x={230+row.length*k+28} y={y+80} n={fmt(row.value*k,row.decimals??0)} unit={row.unit} size={i?112:72} color={i?C.plum:C.soft}/></g>}
        {row.sub?<T x={230} y={y+212} size={44} opacity={grow(row.subAt??at+duration,.3)}>{row.sub}</T>:null}
      </g>;
    })}
    {advice?<line x1={970} x2={970} y1={550} y2={550+250*grow(2.3,.3)} stroke={C.grey} strokeWidth={3} strokeDasharray="10 8"/>:null}
  </>;
};
const arc = (start:number,end:number) => {
  const pt=(r:number,a:number)=>[340+r*Math.sin(a*Math.PI/180),615-r*Math.cos(a*Math.PI/180)].join(',');
  return `M${pt(235,start)} A235,235 0 ${end-start>180?1:0} 1 ${pt(235,end)} L${pt(150,end)} A150,150 0 ${end-start>180?1:0} 0 ${pt(150,start)} Z`;
};
const V2Card: React.FC<V2Props> = (p) => {
  const {frame,fps,grow,fadeOut}=useT(),time=frame/fps,labels=p.labels;
  const lin=(a:number,b:number)=>interpolate(time,[a,b],[0,1],clamp);
  let art:React.ReactNode;
  switch(p.kind) {
    case 'v2-credits': {
      const values=[410,380,415,411,361,463,507,645]; // 12..19 (the card gate allows 8 bars)
      art=<>
        <g opacity={grow(.8,.3)}>{[0,200,400,600].map(v=><g key={v}>{v>0?<line x1={180} x2={1160} y1={800-v*.6} y2={800-v*.6} stroke={C.grey} strokeOpacity={.25}/>:null}<T x={160} y={800-v*.6} center anchor="end">{v}</T></g>)}</g>
        {values.map((v,i)=>{const k=i===7?grow(3.2,.9):grow(1.1+.27*i,.5),h=v*.6*k,x=195+122*i,r=Math.min(8,h/2);return <g key={i}><path d={`M${x},800 V${800-h+r} Q${x},${800-h} ${x+r},${800-h} H${x+88-r} Q${x+88},${800-h} ${x+88},${800-h+r} V800 Z`} fill={i===7?C.s19:C.grey}/><T x={x+44} y={842} size={34} anchor="middle" color={i===7?C.s19:C.soft} weight={i===7?800:600} opacity={grow(.8,.3)}>{12+i}</T></g>;})}
        <T x={1215} y={610} size={160} weight={800} color={C.plum} opacity={grow(3.2,.15)}>{fmt(645*grow(3.2,.9))}</T>
        <T x={1215} y={675} size={44} color={C.s19} opacity={grow(4.1,.4)}>{labels.people}</T>
      </>;break;
    }
    case 'v2-cves': {
      // PostgreSQL CVEs per year, 2019..2026 (cards/f00-cves.card.json; postgresql.org/support/security snapshot).
      const values=[10,7,8,2,8,7,7,96],u=4.4;
      art=<>
        <g opacity={grow(.4,.3)}>{[0,25,50,75,100].map(v=><g key={v}>{v>0?<line x1={180} x2={1160} y1={800-v*u} y2={800-v*u} stroke={C.grey} strokeOpacity={.25}/>:null}<T x={160} y={800-v*u} center anchor="end">{v}</T></g>)}</g>
        {values.map((v,i)=>{const hi=i===7,k=hi?grow(1.6,.9):grow(.5+.08*i,.4),h=Math.max(v*u*k,.01),x=195+122*i,r=Math.min(8,h/2);return <g key={i}><path d={`M${x},800 V${800-h+r} Q${x},${800-h} ${x+r},${800-h} H${x+88-r} Q${x+88},${800-h} ${x+88},${800-h+r} V800 Z`} fill={hi?C.s19:C.grey}/><T x={x+44} y={842} size={30} anchor="middle" color={hi?C.s19:C.soft} weight={hi?800:600} opacity={grow(.4,.3)}>{2019+i}</T>{hi?<T x={x+44} y={800-h-18} size={44} anchor="middle" color={C.s19} weight={800} opacity={grow(2.2,.3)}>{fmt(96*k)}</T>:null}</g>;})}
        <T x={1200} y={600} size={124} weight={800} color={C.plum} opacity={grow(2.6,.15)}>{(13.7*grow(2.6,.9)).toFixed(1)}x</T>
        {labels.hero.split(/ (?=\d{4}-)/).map((l,i)=><T key={i} x={1204} y={660+44*i} size={36} color={C.s19} opacity={grow(3.2,.4)}>{l}</T>)}
      </>;break;
    }
    case 'v2-cves-rel': {
      // PostgreSQL CVEs per minor-release batch, 2019-02 (11.2) .. 2026-11 (18.7); cards/f00-cves.card.json.
      const values=[0,4,1,4,1,1,1,2,3,2,3,1,2,0,1,0,1,0,1,2,2,3,1,1,1,4,0,1,0,1,3,2,5,0,11,28,52];
      const years:[number,number][]=[[0,2019],[5,2020],[9,2021],[13,2022],[18,2023],[22,2024],[27,2025],[32,2026]];
      const u=8,x0=190,stp=25.4,bw=18,hot=(i:number)=>i>=35;
      art=<>
        <g opacity={grow(.4,.3)}>{[0,10,20,30,40,50].map(v=><g key={v}>{v>0?<line x1={180} x2={1140} y1={800-v*u} y2={800-v*u} stroke={C.grey} strokeOpacity={.25}/>:null}<T x={160} y={800-v*u} center anchor="end">{v}</T></g>)}
          {years.map(([i,y])=><g key={y}><line x1={x0+stp*i-3} x2={x0+stp*i-3} y1={800} y2={812} stroke={C.grey} strokeOpacity={.6}/><T x={x0+stp*i} y={842} size={26} color={y===2026?C.s19:C.soft} weight={y===2026?800:600}>{y}</T></g>)}</g>
        {values.map((v,i)=>{const k=hot(i)?grow(i===35?1.6:2.1,.7):grow(.5+.025*i,.4),h=Math.max(v*u*k,v?0:3),x=x0+stp*i,r=Math.min(5,h/2);return <g key={i}><path d={`M${x},800 V${800-h+r} Q${x},${800-h} ${x+r},${800-h} H${x+bw-r} Q${x+bw},${800-h} ${x+bw},${800-h+r} V800 Z`} fill={hot(i)?C.s19:C.grey}/>{hot(i)?<T x={i===35?x+bw-2:x+bw/2} y={800-h-14} size={i===36?40:32} anchor={i===35?'end':'middle'} color={C.s19} weight={800} opacity={grow(i===35?2.0:2.6,.3)}>{fmt(v*k)}</T>:null}</g>;})}
        <T x={1200} y={600} size={150} weight={800} color={C.plum} opacity={grow(3.2,.15)}>{fmt(34*grow(3.2,.9))}x</T>
        {labels.hero.split('|').map((l,i)=><T key={i} x={1206} y={662+42*i} size={34} color={C.s19} opacity={grow(3.8,.4)}>{l}</T>)}
      </>;break;
    }
    case 'v2-cves-both': {
      // Two views of the same snapshot (cards/f00-cves.card.json): CVEs per year 2019..2026 (left)
      // and per minor-release batch 2019-02 (11.2) .. 2026-11 (18.7) (right). Linear scales, no gridlines.
      const yv=[10,7,8,2,8,7,7,96],rv=[0,4,1,4,1,1,1,2,3,2,3,1,2,0,1,0,1,0,1,2,2,3,1,1,1,4,0,1,0,1,3,2,5,0,11,28,52];
      const ry:[number,number][]=[[0,2019],[5,2020],[9,2021],[13,2022],[18,2023],[22,2024],[27,2025],[32,2026]];
      const base=800,bar=(x:number,w:number,h:number,c:string,key:number)=>{const r=Math.min(w/3,h/2,6);return <path key={key} d={`M${x},${base} V${base-h+r} Q${x},${base-h} ${x+r},${base-h} H${x+w-r} Q${x+w},${base-h} ${x+w},${base-h+r} V${base} Z`} fill={c}/>;};
      const L=labels.left.split('|'),R=labels.right.split('|');
      art=<>
        <line x1={800} x2={800} y1={385} y2={850} stroke={C.grey} strokeOpacity={.3} strokeWidth={2}/>
        <T x={90} y={410} size={36} color={C.plum} weight={800} opacity={grow(.3,.3)}>{L[0]}</T>
        <line x1={100} x2={740} y1={base} y2={base} stroke={C.grey} strokeOpacity={.5}/>
        {yv.map((v,i)=>{const hi=i===7,k=hi?grow(1.0,.6):grow(.4+.06*i,.35),h=Math.max(v*2.6*k,2),x=110+80*i;return <g key={i}>{bar(x,52,h,hi?C.s19:C.grey,i)}<T x={x+26} y={834} size={22} anchor="middle" color={hi?C.s19:C.soft} weight={hi?800:600} opacity={grow(.4,.3)}>{2019+i}</T>{hi?<><T x={x+26} y={862} size={22} anchor="middle" color={C.s19} weight={800} opacity={grow(.4,.3)}>{L[1]}</T><T x={x+26} y={base-h-14} size={34} anchor="middle" color={C.s19} weight={800} opacity={grow(1.4,.3)}>{fmt(96*k)}</T></>:<T x={x+26} y={base-h-10} size={22} anchor="middle" color={C.soft} opacity={grow(.9,.3)}>{v}</T>}</g>;})}
        <T x={104} y={500} size={88} weight={800} color={C.plum} opacity={grow(1.8,.15)}>{(13.7*grow(1.8,.7)).toFixed(1)}x</T>
        <T x={108} y={540} size={26} color={C.s19} opacity={grow(2.2,.3)}>{L[2]}</T>
        <T x={850} y={410} size={36} color={C.plum} weight={800} opacity={grow(2.4,.3)}>{R[0]}</T>
        <line x1={845} x2={1550} y1={base} y2={base} stroke={C.grey} strokeOpacity={.5} opacity={grow(2.4,.3)}/>
        {ry.map(([i,y])=><T key={y} x={852+18.6*i} y={834} size={20} color={y===2026?C.s19:C.soft} weight={y===2026?800:600} opacity={grow(2.4,.3)}>{y}</T>)}
        {rv.map((v,i)=>{const hi=i>=35,k=hi?grow(i===35?3.4:3.8,.6):grow(2.5+.02*i,.35),h=Math.max(v*4.8*k,v?0:2),x=852+18.6*i;return <g key={i}>{bar(x,13,h,hi?C.s19:C.grey,i)}{hi?<T x={i===35?x+12:x+6} y={base-h-12} size={i===36?34:28} anchor={i===35?'end':'middle'} color={C.s19} weight={800} opacity={grow(i===35?3.8:4.2,.3)}>{fmt(v*k)}</T>:null}</g>;})}
        <T x={852} y={500} size={88} weight={800} color={C.plum} opacity={grow(4.6,.15)}>{fmt(34*grow(4.6,.7))}x</T>
        <T x={856} y={540} size={26} color={C.s19} opacity={grow(5.0,.3)}>{R[1]}</T>
      </>;break;
    }
    case 'v2-repack': {
      const X=(v:number)=>200+.019*v,Y=(v:number)=>790-4.5*v;
      const series=[[[1013,.02],[4994,.14],[9989,.38],[19980,1.18],[26363,3.54]],[[30198,2.44],[52562,7],[56652,27.66],[65996,85.72]]];
      art=<>
        <g opacity={grow(.8,.4)}>{[0,30,60,90].map(v=><g key={v}>{v>0?<line x1={200} x2={1530} y1={Y(v)} y2={Y(v)} stroke={C.grey} strokeOpacity={.25}/>:null}<T x={180} y={Y(v)} center anchor="end">{v}{v===90?' s':''}</T></g>)}{[0,20000,40000,60000].map(v=><T key={v} x={X(v)} y={832} anchor="middle">{v?v/1000+'k':'0'}</T>)}<T x={1530} y={832} anchor="end">rows/s</T></g>
        {series.map((points,i)=>{const k=i?lin(2.6,5):grow(1.2,1.2),end=points[0][0]+(points.at(-1)![0]-points[0][0])*k;const active=points.filter(v=>v[0]<=end);const next=points.findIndex(v=>v[0]>end);if(next>0){const a=points[next-1],b=points[next];active.push([end,a[1]+(b[1]-a[1])*(end-a[0])/(b[0]-a[0])]);}return <g key={i} opacity={time>=(i?2.6:1.2)?1:0}><polyline points={active.map(v=>`${X(v[0])},${Y(v[1])}`).join(' ')} fill="none" stroke={i?C.s19:C.s3} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round"/>{points.map((v,j)=><circle key={j} cx={X(v[0])} cy={Y(v[1])} r={i&&j===3?13:9} fill={i?(j===3?C.red:C.s19):C.s3} opacity={v[0]<=end?1:0}/>)}</g>;})}
        <T x={380} y={752} size={40} color={C.s3} opacity={grow(2.4,.3)}>{labels.purple}</T><T x={1180} y={730} size={40} color={C.s19} anchor="end" opacity={grow(3.6,.3)}>{labels.orange}</T>
        <T x={1380} y={480} size={120} weight={800} color={C.red} anchor="end" opacity={grow(4.4,.15)}>{fmt(85.7*grow(4.4,.8),1)}<tspan dx={10} fontSize={60} fontWeight={600}>s</tspan></T>
      </>;break;
    }
    case 'v2-notify': art=<PAIR rows={[{tag:'18.7',length:820*200/11040,value:200,unit:'/s'},{tag:'19',length:820,value:11040,unit:'/s'}]}/>;break;
    case 'v2-autovac': art=<PAIR rows={[{tag:'18.7',length:820,value:152.3,unit:'s',decimals:1,sub:labels.last,duration:2},{tag:'19',length:820*12.9/152.3,value:12.9,unit:'s',decimals:1,sub:labels.first,at:3.6,duration:.3,subAt:4}]}/>;break;
    case 'v2-advice': art=<PAIR advice rangeLabel={labels.range} rows={[{tag:labels.off,length:740,value:100,unit:'%',duration:1.2},{tag:labels.on,length:636,value:86,unit:'%',at:2.8,duration:1.1}]}/>;break;
    case 'v2-lz4': art=<PAIR rows={[{tag:'18.7',length:820,value:107,unit:'s',sub:labels.pglz},{tag:'19',length:820*44/107,value:44,unit:'s',sub:labels.lz4}]}/>;break;
    case 'v2-jit': {
      art=<><line x1={820} x2={820} y1={400} y2={840} stroke={C.grey} strokeWidth={2} strokeOpacity={.35}/>{[0,1].map(i=>{const px=i?850:90,heroAt=i?5.3:2.7;return <g key={i}><T x={px} y={418} size={44} opacity={grow(i?3.3:.8,.3)}>{i?labels.longest:labels.short}</T>{[0,1].map(j=>{const at=i?(j?4.4:3.5):(j?2:1.1),k=grow(at,j&&!i?.6:.8),w=(i?(j?330:280):(j?207:330))*k,y=450+j*110,n=i?(j?4607:3914):(j?108:172),color=j?C.s19:C.s18;return <g key={j} opacity={grow(at,.15)}><T x={px+85} y={y+45} size={40} weight={800} color={color} anchor="end" center>{j?'19':'18.7'}</T><Bar x={px+105} y={y} w={w} h={90} r={8} color={color}/><Value x={px+105+w+20} y={y+45} n={fmt(n*k)} unit="ms" size={56}/></g>;})}<T x={px+105} y={815+12*(1-grow(heroAt,.4))} size={140} weight={800} color={i?C.red:C.plum} opacity={grow(heroAt,.4)}>{i?'+17.7%':'−37%'}</T></g>;})}</>;break;
    }
    case 'v2-rehearsal': {
      const red=lin(3,4.4),purple=lin(5,5.8);
      art=<>{Array.from({length:687},(_,i)=>{const isRed=i>=567&&i<656,isPurple=i>=656,k=isRed?red:isPurple?purple:0;return <circle key={i} cx={101+i%43*22} cy={400+Math.floor(i/43)*29} r={7+(k>0&&k<1?2:0)} fill={isRed&&i-567<89*red?C.red:isPurple&&i-656<31*purple?C.s3:C.grey} opacity={lin(.8+Math.floor(i/43)*.09,1.05+Math.floor(i/43)*.09)}/>;})}
        <T x={1060} y={560} size={170} color={C.red} weight={800}>{fmt(89*red)}</T><T x={1070} y={608}>{labels.false}</T>
        <T x={1060} y={800} size={170} color={C.s3} weight={800}>{fmt(31*purple)}</T><T x={1070} y={848}>{labels.start}</T>
      </>;break;
    }
    case 'v2-plans': {
      const changed=grow(1.3,1.5),commit=grow(3.4,1.2);
      art=<>
        <path d={arc(135.8*changed,359.99999)} fill={C.grey} opacity={.3*grow(.8,.4)}/>
        {changed>0?<path d={arc(0,135.8*changed)} fill={C.s19} fillOpacity={.45}/>:null}
        {commit>0?<path d={arc(0,99.8*commit)} fill={C.s19}/>:null}
        {[0,135.8*changed,...(commit>0?[99.8*commit]:[])].map((a,i)=><line key={i} x1={340+150*Math.sin(a*Math.PI/180)} y1={615-150*Math.cos(a*Math.PI/180)} x2={340+235*Math.sin(a*Math.PI/180)} y2={615-235*Math.cos(a*Math.PI/180)} stroke="white" strokeWidth={3} opacity={changed>0?1:0}/>)}
        <T x={340} y={635} size={130} weight={800} color={C.plum} anchor="middle" opacity={grow(1.3,.15)}>{fmt(83*changed)}</T><T x={340} y={695} size={44} anchor="middle" opacity={grow(2.8,.3)}>{labels.total}</T>
        <T x={720} y={620} size={220} weight={800} color={C.s19} opacity={grow(3.4,.15)}>{fmt(61*commit)}</T><T x={1025} y={620} size={80} opacity={grow(4.7,.5)}>{labels.changed}</T><T x={720} y={720} size={64} opacity={grow(4.7,.5)}>{labels.commit}</T>
      </>;break;
    }
  }
  const panel=spring({frame:Math.min(frame,.4*fps),fps,durationInFrames:Math.round(.4*fps),config:{damping:18,stiffness:200,mass:.6}});
  const box=graphicBoxes(p)[0];
  return <AbsoluteFill data-qa-no-text={p.qaNoText || undefined} style={{fontFamily:'Inter, sans-serif',opacity:fadeOut}}>
    <NoTextStyle/>
    <div style={{position:'absolute',left:PANEL.x,top:PANEL.y,width:PANEL.w,height:PANEL.h,borderRadius:20,background:'rgba(253,253,254,0.97)',boxShadow:'0 3px 6px rgba(61,15,69,0.22)',opacity:panel,transform:`scale(${.97+.03*panel})`}}/>
    <svg width={1920} height={1080} style={{position:'absolute',opacity:panel}}>
      <T x={90} y={330} size={p.kind==='v2-repack'?54:56} color={C.plum} weight={800} opacity={lin(.2,.6)}>{p.title}</T>
      <g opacity={lin(.2,.6)}><rect x={p.chip?.includes('synthetic')?1210:p.kind.startsWith('v2-cves')?1170:1328} y={290} width={p.chip?.includes('synthetic')?340:p.kind.startsWith('v2-cves')?380:222} height={40} rx={20} fill={C.plum}/><T x={1534} y={318} size={22} color="white" anchor="end">{p.chip}</T></g>
      {labels.caption?<T x={1550} y={842} size={30} color={C.faint} anchor="end" opacity={lin(.8,1)}>{labels.caption}</T>:null}
      <svg opacity={lin(.8,1)} x={box.x} y={box.y} width={box.w} height={box.h} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} overflow="visible">{art}</svg>
    </svg>

  </AbsoluteFill>;
};

// Center-placement real screenshot (hosts in the right column): page header on top, one
// section below with its key sentence marked. Images are 2x captures in public/shots/
// (scripts: capture in the episode's notes); `mark` rects are CSS px inside the `body` clip.
export type CenterShotProps = {kind: 'v2-shot'; chip: string; head: {src: string; w: number; h: number}; section: {src: string; w: number; h: number}; body: {src: string; w: number; h: number; mark: {x: number; y: number; w: number; h: number}[]}; durationSec: number; title?: string};
const CenterShot: React.FC<CenterShotProps> = (p) => {
  const {frame, fps, grow, fadeOut} = useT();
  const panel = spring({frame: Math.min(frame, .4 * fps), fps, durationInFrames: Math.round(.4 * fps), config: {damping: 18, stiffness: 200, mass: .6}});
  const sheet = {background: '#fbfaf8', borderRadius: 12, border: '1px solid #e4e1dc', boxShadow: '0 2px 8px rgba(61,15,69,0.12)', overflow: 'hidden', position: 'absolute' as const};
  const hw = 1080, hh = hw * p.head.h / p.head.w;
  const bw = 1040, k = bw / p.section.w, sh = p.section.h * k, bh = p.body.h * k, gap = 22, css = bw / (p.body.w / 2);
  const top = 455, mark = grow(1.6, .8);
  return <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
    <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, borderRadius: 20, background: 'rgba(253,253,254,0.97)', boxShadow: '0 3px 6px rgba(61,15,69,0.22)', opacity: panel, transform: `scale(${.97 + .03 * panel})`}}/>
    <div style={{...sheet, left: 90, top: 280, width: hw, height: hh, opacity: grow(.2, .4)}}><Img src={staticFile(p.head.src)} style={{width: hw, height: hh, display: 'block'}}/></div>
    <div style={{...sheet, left: 90, top, width: bw, height: sh + gap + bh, opacity: grow(.6, .4)}}>
      <Img src={staticFile(p.section.src)} style={{width: bw, height: sh, display: 'block'}}/>
      <div style={{height: gap, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: bw - 48, borderTop: '2px dashed #d4d0c8'}}/></div>
      <div style={{position: 'relative', width: bw, height: bh}}>
        <Img src={staticFile(p.body.src)} style={{width: bw, height: bh, display: 'block'}}/>
        {p.body.mark.map((m, i) => <div key={i} style={{position: 'absolute', left: m.x * css - 4, top: m.y * css - 2, width: (m.w * css + 8) * Math.max(0, Math.min(1, mark * p.body.mark.length - i)), height: m.h * css + 4, background: 'rgba(255,214,0,0.45)', mixBlendMode: 'multiply', borderRadius: 3}}/>)}
      </div>
    </div>
    <svg width={1920} height={1080} style={{position: 'absolute', opacity: grow(.2, .4)}}>
      <rect x={1550 - 350} y={290} width={350} height={40} rx={20} fill={C.plum}/>
      <text x={1534} y={318} fontSize={22} fill="white" fontWeight={600} textAnchor="end">{p.chip}</text>
    </svg>
  </AbsoluteFill>;
};
