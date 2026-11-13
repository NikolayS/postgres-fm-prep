import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';
import {typedAt, textBursts, Burst} from './typing';
import {Marker, Wipe, seedOf, BAND} from './Band';
import {PANEL} from './Ep196';
import PSQL from './psql18.json';
import ASH from './ash62.json';
import ASHB from './ash62b.json';

// Plan v2 cards for episode 196 (illustrations-review.md). House blocks are built from the public
// brief's numbers; every reveal time is seconds from the overlay start (scripts/ep196.ts maps them
// from SOURCE word times). Colour key: orange = temp table per transaction, light blue = reused
// temp table, yellow = no temp table / key point.
export const K = {orange: '#FF7A1A', lblue: '#7CC4FF', yellow: '#FFD23F', red: '#FF4B3E', grey: '#8A8A93'};
const BG = 'rgba(27,27,31,0.96)';
const DIM = 'rgba(255,255,255,0.62)';
const MONO = 'JetBrains Mono, Menlo, monospace';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const useT = (fadeSec = 0.3) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const s = (at: number, cfg = {damping: 14, stiffness: 200, mass: 0.6}) => spring({frame: frame - at * fps, fps, config: cfg});
  const grow = (at: number, d = 0.6) => interpolate(frame, [at * fps, (at + d) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const fadeOut = interpolate(frame, [durationInFrames - fadeSec * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return {frame, fps, t, s, grow, fadeOut, dur: durationInFrames / fps};
};

const Panel: React.FC<{children: React.ReactNode; pad?: string}> = ({children, pad}) => {
  const {s, fadeOut} = useT();
  const k = s(0, {damping: 16, stiffness: 160, mass: 0.7});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, background: BG, borderRadius: 18, padding: pad ?? '40px 50px 34px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: k, transform: `scale(${0.97 + 0.03 * k})`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: '#fff', overflow: 'hidden', position: 'absolute'}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
const Title: React.FC<{text: string; sub?: string}> = ({text, sub}) => {
  const {s} = useT();
  return (
    <div style={{opacity: s(0.15)}}>
      <div style={{fontSize: 50, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1}}>{text}</div>
      {sub ? <div style={{fontSize: 38, fontWeight: 500, color: DIM, marginTop: 8}}>{sub}</div> : null}
    </div>
  );
};

// ---------- band: typed lines, each made of segments that may start later (two-stage bands) ----------
// style: marker = yellow marker (takeaway, spoken quotes); dark = big dark strip (facts, credits);
// chip = the small dark sub strip. arrow: a pointer from the band to the robot tile.
export type Seg = {text: string; at?: number; color?: string};
export type BLine = {style: 'marker' | 'dark' | 'chip'; segs: Seg[]};
export type Band196Props = {lines: BLine[]; arrow?: boolean; durationSec: number};
export const band196Plan = (p: {lines: BLine[]}) => {
  let cursor = 0.45;
  return p.lines.map((ln, li) => {
    const segs = ln.segs.map((sg, si) => {
      const start = sg.at ?? cursor;
      const bs = textBursts(sg.text, start);
      cursor = bs[bs.length - 1].end + 0.35;
      return {...sg, start, bs, line: `l${li}s${si}`};
    });
    cursor += 0.3;
    return {...ln, segs, start: segs[0].start - (li === 0 ? 0.45 : 0.3)};
  });
};
// Host 2026-11-11: "too much typing" -> band cards show each segment whole at its start (the strip's own
// wipe/marker animation is the reveal), no typed characters, no cursor, no typing sound. Typing stays only in psql.
const BAND_TYPING = false;
const Typed: React.FC<{text: string; bs: Burst[]; t: number; cursor: string; show: boolean; color?: string}> = ({text, bs, t, cursor, show: show0, color}) => {
  const n = BAND_TYPING ? typedAt(bs, t) : (t >= bs[0].start ? [...text].length : 0);
  const show = BAND_TYPING && show0;
  const typing = bs.some((b) => t >= b.start && t < b.end + 0.12);
  const blinkOn = typing || Math.floor(t * 2) % 2 === 0;
  const chars = [...text];
  return (
    <span style={{position: 'relative', color}}>
      {chars.map((c, j) => (
        <span key={j} style={{position: 'relative', visibility: j < n ? 'visible' : 'hidden'}}>
          {c}
          {j === n && show && blinkOn ? <span style={{position: 'absolute', left: 1, top: '8%', width: '0.5em', height: '84%', background: cursor, visibility: 'visible'}} /> : null}
        </span>
      ))}
      {n >= chars.length && show && blinkOn ? <span style={{display: 'inline-block', width: '0.5em', height: '0.84em', marginLeft: 3, verticalAlign: '-0.08em', background: cursor}} /> : null}
    </span>
  );
};
export const Band196: React.FC<Band196Props> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const fadeOut = interpolate(frame, [durationInFrames - 0.2 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const plan = band196Plan(p);
  const all = plan.flatMap((l) => l.segs);
  const lastEnd = Math.max(...all.map((sg) => sg.bs[sg.bs.length - 1].end));
  // The cursor sits in the segment being typed, else after the last typed one; it goes 3 s after the end.
  let curSeg = all[0];
  for (const sg of all) if (t >= sg.start - 0.05) curSeg = sg;
  const cursorOn = t >= 0.3 && t < lastEnd + 3;
  const seed = seedOf(all.map((x) => x.text).join(''));
  const k = spring({frame: frame - 0.0 * fps, fps, config: {damping: 14, stiffness: 180, mass: 0.6}});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      {/* Host 2026-11-11: bands sit right under the hosts' name labels (y 800), clear of YouTube's captions at the
          bottom. The arrow tag ends just left of the robot tile, with a big bouncing arrow down-right into it. */}
      <div style={p.arrow
        ? {position: 'absolute', right: 1920 - 1660, top: 800, display: 'flex', flexDirection: 'row', alignItems: 'flex-start'}
        : {position: 'absolute', left: BAND.x, top: 800, width: BAND.w, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: p.arrow ? 'flex-end' : 'flex-start'}}>
          {plan.map((ln, li) => {
            const body = ln.segs.map((sg, si) => (
              <Typed key={si} text={sg.text} bs={sg.bs} t={t} color={sg.color} show={cursorOn && sg === curSeg} cursor={ln.style === 'marker' ? '#111' : 'rgba(255,255,255,0.85)'} />
            ));
            if (ln.style === 'marker')
              return (
                <Marker key={li} frame={frame} fps={fps} delay={ln.start} seed={seed + li} fontSize={46}>
                  <span style={{whiteSpace: 'pre'}}>{body}</span>
                </Marker>
              );
            const big = ln.style === 'dark';
            return (
              <Wipe key={li} frame={frame} fps={fps} delay={ln.start}>
                <div style={{display: 'inline-block', background: big ? 'rgba(17,17,17,0.9)' : 'rgba(17,17,17,0.85)', color: '#fff', fontSize: big ? 44 : 38, fontWeight: big ? 700 : 500, lineHeight: 1.2, padding: big ? '10px 26px' : '6px 22px', borderRadius: big ? 10 : 8, whiteSpace: 'pre', marginLeft: big ? 0 : 26, letterSpacing: big ? -0.5 : 0}}>{body}</div>
              </Wipe>
            );
          })}
        </div>
        {p.arrow ? (
          <svg width={96} height={110} viewBox="0 0 96 110" style={{marginLeft: 6, marginTop: 30, overflow: 'visible', opacity: k, transform: `translate(${5 * Math.abs(Math.sin(t * 5))}px, ${5 * Math.abs(Math.sin(t * 5))}px)`}}>
            <path d="M8 8 L80 92" stroke={K.yellow} strokeWidth={12} strokeLinecap="round" />
            <path d="M44 94 L84 98 L82 58" fill="none" stroke={K.yellow} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------- layers of temp-table problems: five slabs, slot 3 waits as a dashed outline ----------
export type L2Row = {tag: string; text: string; at: number};
export type Layers2Props = {
  rows: L2Row[]; // 0, 1, 2A, 2B
  slot3: {tag: string; text: string; fillAt?: number}; // no fillAt: stays an empty dashed outline
  dimAt?: number; // rows 0-2B dim to 35% from here
  waits?: {names: {text: string; at: number}[]; note: string; noteAt: number};
  measured?: {text: string; sub: string; at: number};
  durationSec: number;
};
const SLAB = 96;
export const Layers2: React.FC<Layers2Props> = (p) => {
  const {frame, fps, grow, s} = useT();
  const dim = p.dimAt !== undefined ? interpolate(frame, [p.dimAt * fps, (p.dimAt + 0.5) * fps], [1, 0.35], clamp) : 1;
  const chip = (tag: string, dark: boolean): React.CSSProperties => ({minWidth: 92, height: 64, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 700, background: dark ? '#111' : '#fff', color: dark ? K.yellow : '#111', padding: '0 14px', boxSizing: 'border-box'});
  const fill = p.slot3.fillAt;
  const f3 = fill !== undefined ? grow(fill, 0.45) : 0;
  const pop = fill !== undefined ? s(fill, {damping: 9, stiffness: 220, mass: 0.6}) : 0;
  const waits = p.waits;
  return (
    <Panel pad="44px 50px 34px">
      <Title text="Temp tables: problems in layers" />
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 34}}>
        {p.rows.map((r, i) => {
          const w = grow(r.at, 0.45);
          return (
            <div key={i} style={{height: SLAB, position: 'relative', opacity: dim}}>
              <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - w * 100}% 0 0 round 14px)`, background: '#2c2c33', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 28, padding: '0 22px', boxSizing: 'border-box'}}>
                <div style={chip(r.tag, false)}>{r.tag}</div>
                <div style={{fontSize: 52, fontWeight: 700, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{r.text}</div>
              </div>
            </div>
          );
        })}
        <div style={{height: SLAB, position: 'relative', transform: `scale(${1 + 0.04 * Math.sin(Math.min(1, pop) * Math.PI)})`}}>
          <div style={{position: 'absolute', inset: 0, border: `4px dashed ${K.yellow}`, borderRadius: 14, opacity: 1 - f3, boxSizing: 'border-box'}} />
          <div style={{position: 'absolute', inset: 0, background: K.yellow, borderRadius: 14, clipPath: `inset(0 ${100 - f3 * 100}% 0 0 round 14px)`, display: 'flex', alignItems: 'center', gap: 28, padding: '0 22px', boxSizing: 'border-box', color: '#111'}}>
            <div style={chip(p.slot3.tag, true)}>{p.slot3.tag}</div>
            <div style={{fontSize: 52, fontWeight: 700, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{p.slot3.text}</div>
          </div>
          {fill === undefined ? (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 28, padding: '0 22px', boxSizing: 'border-box'}}>
              <div style={{...chip(p.slot3.tag, false), background: 'transparent', color: K.yellow, border: `3px dashed ${K.yellow}`}}>{p.slot3.tag}</div>
              <div style={{fontSize: 52, fontWeight: 700, color: 'rgba(255,210,63,0.55)'}}>?</div>
            </div>
          ) : null}
        </div>
      </div>
      {p.measured ? (
        <div style={{marginTop: 26, opacity: grow(p.measured.at, 0.5), transform: `translateY(${(1 - grow(p.measured.at, 0.5)) * 12}px)`}}>
          <div style={{fontSize: 40, fontWeight: 700}}>{p.measured.text}</div>
          <div style={{fontSize: 38, fontWeight: 500, color: DIM, marginTop: 6}}>{p.measured.sub}</div>
        </div>
      ) : null}
      {waits ? (
        <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 14}}>
          <div style={{display: 'flex', gap: 60}}>
            {waits.names.map((w, i) => {
              const bs = textBursts(w.text, w.at);
              const t = frame / fps;
              return (
                <div key={i} style={{fontFamily: MONO, fontSize: 56, fontWeight: 500, color: K.yellow, whiteSpace: 'pre'}}>
                  <Typed text={w.text} bs={bs} t={t} cursor={K.yellow} show={t >= w.at && t < bs[bs.length - 1].end + 0.8} />
                </div>
              );
            })}
          </div>
          <div style={{fontSize: 38, fontWeight: 500, color: DIM, opacity: grow(waits.noteAt, 0.5)}}>{waits.note}</div>
        </div>
      ) : null}
    </Panel>
  );
};
export const layers2Bursts = (p: Layers2Props) => (p.waits ? p.waits.names.flatMap((w, i) => textBursts(w.text, w.at).map((b) => ({...b, line: `w${i}`}))) : []);

// ---------- where active sessions are (5,000 idle): wait-event sample shares ----------
export type SharesProps = {title: string; rows: {label: string; value: number; at: number; color: string}[]; caption: string; compare?: {text: string; at: number}; durationSec: number};
export const Shares196: React.FC<SharesProps> = (p) => {
  const {grow, s} = useT();
  const W = 1000;
  return (
    <Panel>
      <Title text={p.title} />
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 56}}>
        {p.rows.map((r, i) => {
          const g = grow(r.at, 0.9);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 30, opacity: s(r.at)}}>
              <div style={{width: 250, fontSize: 52, fontWeight: 700, color: r.color}}>{r.label}</div>
              <div style={{width: Math.max(6, (r.value / 100) * W * g), height: 76, background: r.color, borderRadius: 8}} />
              <div style={{fontSize: 84, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: -2, color: r.color}}>{(r.value * g).toFixed(r.value < 1 ? 2 : 1)}%</div>
            </div>
          );
        })}
      </div>
      {p.compare ? <div style={{fontSize: 40, fontWeight: 700, color: '#73BF69', marginBottom: 14, opacity: grow(p.compare.at, 0.5)}}>{p.compare.text}</div> : null}
      <div style={{fontSize: 38, fontWeight: 500, color: DIM, opacity: s(0.6)}}>{p.caption}</div>
    </Panel>
  );
};

// ---------- monitoring blindness: two numbers ----------
export type TwoNumProps = {title: string; rows: {label: string; sub: string; value: string; at: number; color: string}[]; caption: string; durationSec: number};
export const TwoNum196: React.FC<TwoNumProps> = (p) => {
  const {s} = useT();
  return (
    <Panel>
      <Title text={p.title} />
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 50}}>
        {p.rows.map((r, i) => {
          const k = s(r.at, {damping: 11, stiffness: 200, mass: 0.6});
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 50, opacity: Math.min(1, k * 1.5)}}>
              <div style={{width: 380, textAlign: 'right', fontSize: 170, fontWeight: 700, letterSpacing: -5, color: r.color, fontVariantNumeric: 'tabular-nums', transform: `scale(${0.8 + 0.2 * k})`, transformOrigin: 'right center'}}>{r.value}</div>
              <div>
                <div style={{fontSize: 52, fontWeight: 700}}>{r.label}</div>
                <div style={{fontSize: 38, fontWeight: 500, color: DIM, marginTop: 6}}>{r.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{fontSize: 38, fontWeight: 500, color: DIM, opacity: s(0.6)}}>{p.caption}</div>
    </Panel>
  );
};

// ---------- the cliff: DDL tx/s vs idle sessions, with a dot that falls off ----------
export type CliffProps = {
  pts: {x: number; y: number; label: string}[]; // idle sessions, tx/s
  drawAt: number[]; // segment i (pts[i] -> pts[i+1]) draws at drawAt[i]
  waitRow: {values: string[]; at: number; label: string};
  dot: {at: number; landAt: number};
  caption: string; durationSec: number;
};
export const Cliff196: React.FC<CliffProps> = (p) => {
  const {t, grow, s} = useT();
  // Fig. 4.1 / 4.2 style: top panel DDL tx/s vs idle sessions (target 500), bottom panel SInvalWrite share.
  const X0 = 150, X1 = 1330, YT = 20, YB = 400, YMAX = 600, P2T = 470, P2B = 610;
  const px = (x: number) => X0 + (x / 5000) * (X1 - X0);
  const py = (y: number) => YB - (y / YMAX) * (YB - YT);
  const pq = (v: number) => P2B - (v / 100) * (P2B - P2T);
  const P = p.pts.map((q) => ({...q, X: px(q.x), Y: py(q.y)}));
  const segK = p.drawAt.map((a) => grow(a, 0.8));
  const rideStart = p.dot.at, rideEnd = p.dot.landAt;
  let dot: {x: number; y: number; o: number} | null = null;
  if (t >= rideStart) {
    const u = interpolate(t, [rideStart, rideEnd], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
    const xx = P[0].X + (P[P.length - 1].X - P[0].X) * u;
    let yy = P[0].Y;
    for (let i = 0; i < P.length - 1; i++) if (xx >= P[i].X && xx <= P[i + 1].X) yy = P[i].Y + ((xx - P[i].X) / (P[i + 1].X - P[i].X)) * (P[i + 1].Y - P[i].Y);
    if (t > rideEnd) { const b = t - rideEnd; yy = P[P.length - 1].Y - Math.abs(Math.sin(b * 9)) * 26 * Math.exp(-b * 5); }
    // rides on top of the line (lifted 24 px), then settles centred on the last point after landing
    const lift = 24 * interpolate(t, [rideEnd - 0.12, rideEnd + 0.05], [1, 0], clamp);
    dot = {x: xx, y: yy - lift, o: interpolate(t, [rideStart, rideStart + 0.25], [0, 1], clamp)};
  }
  const wk = grow(p.waitRow.at, 0.8);
  const wv = p.waitRow.values.map((v) => parseFloat(v));
  return (
    <Panel>
      <Title text="Temp table per transaction: DDL tx/s vs idle sessions" sub={p.caption} />
      <svg width={1470} height={720} style={{marginTop: 18, overflow: 'visible'}}>
        {[0, 100, 200, 300, 400, 500, 600].map((v) => <g key={v}><line x1={X0} x2={X1} y1={py(v)} y2={py(v)} stroke={GRID} strokeWidth={2} /><text x={X0 - 16} y={py(v) + 10} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="end">{v}</text></g>)}
        {[0, 1000, 2000, 3000, 4000, 5000].map((x) => <line key={x} x1={px(x)} x2={px(x)} y1={YT} y2={P2B} stroke={GRID} strokeWidth={2} />)}
        <line x1={X0} x2={X1} y1={YB} y2={YB} stroke={AX} strokeWidth={3} /><line x1={X0} x2={X0} y1={YT} y2={YB} stroke={AX} strokeWidth={3} />
        <text transform={`translate(${X0 - 100}, ${(YT + YB) / 2}) rotate(-90)`} fill={AX} fontSize={36} fontFamily="Inter" fontWeight={500} textAnchor="middle">DDL tx/s</text>
        <line x1={X0} y1={py(500)} x2={X1} y2={py(500)} stroke={K.grey} strokeWidth={4} strokeDasharray="16 12" opacity={s(0.3)} />
        <text x={X1 + 14} y={py(500) + 10} fill={K.grey} fontSize={38} fontFamily="Inter" fontWeight={600} opacity={s(0.3)}>target</text>
        {P.slice(0, -1).map((a, i) => { const b = P[i + 1], k = segK[i]; return <line key={i} x1={a.X} y1={a.Y} x2={a.X + (b.X - a.X) * k} y2={a.Y + (b.Y - a.Y) * k} stroke={K.orange} strokeWidth={7} strokeLinecap="round" opacity={k > 0 ? 1 : 0} />; })}
        {P.map((q, i) => {
          const shown = i === 0 ? segK[0] : segK[i - 1]; const last = i === P.length - 1;
          return (<g key={i} opacity={shown >= 0.98 ? 1 : 0}><circle cx={q.X} cy={q.Y} r={11} fill={last ? K.red : K.orange} /><text x={q.X + (i === 0 ? 20 : 0)} y={last ? q.Y + 66 : q.Y - 26} fill={last ? K.red : '#fff'} fontSize={52} fontFamily="Inter" fontWeight={700} textAnchor={i === 0 ? 'start' : 'middle'}>{q.label}</text></g>);
        })}
        {dot ? <circle cx={dot.x} cy={dot.y} r={18} fill="#fff" opacity={dot.o} stroke="#111" strokeWidth={4} /> : null}
        {/* bottom panel: LWLock:SInvalWrite share of the DDL sessions' active samples */}
        <g opacity={wk}>
          {[0, 50, 100].map((v) => <g key={v}><line x1={X0} x2={X1} y1={pq(v)} y2={pq(v)} stroke={GRID} strokeWidth={2} /><text x={X0 - 16} y={pq(v) + 10} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="end">{v}%</text></g>)}
          <line x1={X0} x2={X1} y1={P2B} y2={P2B} stroke={AX} strokeWidth={3} /><line x1={X0} x2={X0} y1={P2T} y2={P2B} stroke={AX} strokeWidth={3} />
          <polyline points={p.pts.map((q, i) => `${px(q.x)},${pq(wv[i] * wk)}`).join(' ')} fill="none" stroke={'#F2495C'} strokeWidth={5} />
          {p.pts.map((q, i) => <g key={i}><circle cx={px(q.x)} cy={pq(wv[i] * wk)} r={9} fill={'#F2495C'} /><text x={px(q.x) + (i === 0 ? 6 : i === p.pts.length - 1 ? -16 : 0)} y={pq(wv[i] * wk) - (i === 0 ? 46 : 18)} fill={'#F2495C'} fontSize={40} fontFamily="Inter" fontWeight={700} textAnchor={i === 0 ? 'start' : i === p.pts.length - 1 ? 'end' : 'middle'}>{p.waitRow.values[i]}</text></g>)}
          <text x={X0 + 24} y={P2T - 14} fill={'#F2495C'} fontSize={36} fontFamily="Inter" fontWeight={600}>{`${p.waitRow.label}: share of waits`}</text>
        </g>
        {[0, 1000, 2000, 3000, 4000, 5000].map((x) => <text key={x} x={px(x)} y={P2B + 42} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="middle">{fmt(x)}</text>)}
        <text x={(X0 + X1) / 2} y={P2B + 86} fill={AX} fontSize={36} fontFamily="Inter" fontWeight={500} textAnchor="middle">idle sessions</text>
      </svg>
      
    </Panel>
  );
};

// ---------- the ring: a fixed queue of 4,096 slots broadcasting to every session ----------
export type RingProps = {
  drawAt: number; fillAt: number; msgNote: string; flashAt: number; quadAt: number; greyAt: number; redAt: number;
  durationSec: number;
};
const TICKS = 96;
export const Ring196: React.FC<RingProps> = (p) => {
  const {t, grow, s} = useT();
  const CX = 360, CY = 390, R = 250;
  const draw = grow(p.drawAt, 1.0);
  // True scale: one temp-table create + drop = ~114 of 4,096 slots (2.8%, ~2.7 of 96 ticks). From fillAt one
  // transaction lands every 0.35 s and fills its slice; 36 of them fill the ring.
  const TX = 36, PER = 0.35;
  const ntx = t >= p.fillAt ? Math.min(TX, Math.floor((t - p.fillAt) / PER) + 1) : 0;
  const nfill = (ntx * TICKS) / TX;
  const red = t >= p.redAt ? Math.max(0, 1 - (t - p.redAt) / 1.6) * (0.5 + 0.5 * Math.cos((t - p.redAt) * 14)) : 0;
  const quad = grow(p.quadAt, 1.2);
  const n1 = 1000, n4 = 4000;
  const GX = 790, GY = 160, GW = 660, GH = 560;
  const count = Math.round(n1 + (n4 - n1) * quad);
  const big = quad >= 0.02; // from the quadruple on: 80 x 50 grid, dots fill in up to 4,000
  const cols = big ? 80 : 40, rows = big ? 50 : 25, nShow = big ? count : n1;
  const cw = GW / cols, ch = GH / rows;
  const r = Math.min(cw, ch) * 0.36;
  const grey = grow(p.greyAt, 0.8);
  const flashWave = (i: number) => {
    if (t < p.flashAt) return 0;
    // repeating broadcasts: a wave every 1.6 s sweeping the grid
    const col = i % cols, row = Math.floor(i / cols);
    const d = (col / cols + row / rows) * 0.6;
    const ph = ((t - p.flashAt - d) % 1.6 + 1.6) % 1.6;
    return t - p.flashAt - d < 0 ? 0 : Math.max(0, 1 - ph / 0.35);
  };
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < nShow; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const fl = flashWave(i);
    const base = 0.45 + 0.55 * fl;
    const c = grey > 0 ? `rgba(${Math.round(255 - 100 * grey)},${Math.round(255 - 100 * grey)},${Math.round(255 - 90 * grey)},${base * (1 - 0.35 * grey) + 0.1})` : `rgba(255,255,255,${base})`;
    dots.push(<circle key={i} cx={GX + col * cw + cw / 2} cy={GY + row * ch + ch / 2} r={r * (1 + 0.5 * fl)} fill={c} />);
  }
  return (
    <Panel>
      <svg width={1470} height={800} style={{position: 'absolute', left: 50, top: 40}}>
        {Array.from({length: TICKS}).map((_, i) => {
          const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
          const shown = i / TICKS <= draw;
          const filled = i < nfill;
          const col = red > 0.05 ? K.red : filled ? K.orange : 'rgba(255,255,255,0.4)';
          const r0 = R - 34, r1 = R + (filled ? 6 : 0);
          return shown ? <line key={i} x1={CX + Math.cos(a) * r0} y1={CY + Math.sin(a) * r0} x2={CX + Math.cos(a) * r1} y2={CY + Math.sin(a) * r1} stroke={col} strokeWidth={9} strokeLinecap="round" /> : null;
        })}
        <circle cx={CX} cy={CY} r={R + 26} fill="none" stroke={K.red} strokeWidth={10} opacity={red} />
        <text x={CX} y={CY + 40} fill="#fff" fontSize={120} fontFamily="Inter" fontWeight={700} textAnchor="middle" opacity={draw}>4,096</text>
        <text x={CX} y={CY + 92} fill={DIM} fontSize={32} fontFamily="Inter" fontWeight={600} textAnchor="middle" opacity={draw}>message slots, fixed</text>
        <text x={CX} y={CY + R + 90} fill={K.orange} fontSize={40} fontFamily="Inter" fontWeight={700} textAnchor="middle" opacity={grow(p.fillAt, 0.5)}>{p.msgNote}</text>
        <text x={CX} y={CY + R + 145} fill="#fff" fontSize={40} fontFamily="Inter" fontWeight={600} textAnchor="middle" opacity={grow(p.fillAt, 0.5)} style={{fontVariantNumeric: 'tabular-nums'}}>{ntx >= TX ? '× 36 transactions = full' : `× ${ntx} transaction${ntx === 1 ? '' : 's'}`}</text>
        {dots}
        <text x={GX} y={GY - 40} fill="#fff" fontSize={54} fontFamily="Inter" fontWeight={700} opacity={s(0.4)}>{fmt(quad < 0.02 ? n1 : count)} sessions</text>
        <text x={GX + GW} y={GY - 40} fill={DIM} fontSize={40} fontFamily="Inter" fontWeight={600} textAnchor="end" opacity={grow(p.greyAt, 0.6)}>all idle</text>
      </svg>
      <div style={{position: 'absolute', left: 50, bottom: 30, fontSize: 38, fontWeight: 500, color: DIM}}>Schematic</div>
    </Panel>
  );
};

// ---------- throughput: three bars to true scale, numbers count up on the words ----------
export type ThruProps = {
  popAt: number;
  rows: {label: string; value: number; color: string; numAt: number; badge?: {text: string; at: number}}[];
  note?: {text: string; at: number; until: number};
  durationSec: number;
};
export const Thru196: React.FC<ThruProps> = (p) => {
  const {frame, fps, t, grow, s} = useT();
  const max = Math.max(...p.rows.map((r) => r.value));
  const FULL = 1300;
  const g = grow(p.popAt, 1.0);
  const noteK = p.note ? Math.min(grow(p.note.at, 0.4), 1 - grow(p.note.until, 0.4)) : 0;
  return (
    <Panel>
      <Title text="Transactions per second" sub="PG17, 16 vCPU, 32 clients, synthetic workload" />
      <svg width={1470} height={60} style={{position: 'absolute', left: 50, top: 0, height: PANEL.h, pointerEvents: 'none', overflow: 'visible'}}>
        {[0, 20000, 40000, 60000, 80000].map((v) => <g key={v}><line x1={(v / max) * FULL} x2={(v / max) * FULL} y1={170} y2={730} stroke={GRID} strokeWidth={2} /><text x={(v / max) * FULL} y={772} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="middle">{fmt(v)}</text></g>)}
        <line x1={0} x2={FULL + 20} y1={730} y2={730} stroke={AX} strokeWidth={3} />
        <text x={FULL + 20} y={772} fill={AX} fontSize={36} fontFamily="Inter" fontWeight={500} textAnchor="start">tx/s</text>
      </svg>
      <div style={{display: 'flex', flexDirection: 'column', gap: 22, marginTop: 40}}>
        {p.rows.map((r, i) => {
          const w = Math.max(10, (r.value / max) * FULL * g);
          const c = interpolate(frame, [r.numAt * fps, (r.numAt + 1.1) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          const inside = (r.value / max) * FULL > 900;
          const num = t >= r.numAt ? fmt(r.value * c) : '';
          const numPop = s(r.numAt, {damping: 10, stiffness: 220, mass: 0.6});
          const bk = r.badge ? s(r.badge.at, {damping: 10, stiffness: 220, mass: 0.6}) : 0;
          return (
            <div key={i}>
              <div style={{display: 'flex', alignItems: 'center', gap: 24, marginBottom: 10, width: FULL, height: 64}}>
                <div style={{fontSize: 40, fontWeight: 700, color: r.color, background: '#1b1b1f', paddingRight: 14}}>{r.label}</div>
                {inside && r.badge && t >= r.badge.at ? <div style={{marginLeft: 'auto', fontSize: 44, fontWeight: 700, color: '#111', background: r.color, borderRadius: 40, padding: '2px 24px', lineHeight: '56px', transform: `scale(${bk})`, transformOrigin: 'right center'}}>{r.badge.text}</div> : null}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 22, position: 'relative'}}>
                <div style={{width: w, height: 80, background: r.color, borderRadius: 10, position: 'relative'}}>
                  {inside && num ? <div style={{position: 'absolute', right: 24, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 76, fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums', letterSpacing: -2, transform: `scale(${0.85 + 0.15 * numPop})`, transformOrigin: 'right center'}}>{num}</div> : null}
                </div>
                {!inside && num ? <div style={{fontSize: 76, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: -2, transform: `scale(${0.85 + 0.15 * numPop})`, transformOrigin: 'left center'}}>{num}</div> : null}
                {!inside && r.badge && t >= r.badge.at ? <div style={{fontSize: 52, fontWeight: 700, color: '#111', background: r.color, borderRadius: 40, padding: '4px 26px', transform: `scale(${bk})`, marginLeft: 8}}>{r.badge.text}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      {p.note ? (
        <div style={{position: 'absolute', left: 50, right: 50, bottom: 30, opacity: noteK, transform: `translateY(${(1 - noteK) * 16}px)`}}>
          <div style={{display: 'inline-block', background: '#0d0d0f', borderLeft: `8px solid ${K.yellow}`, padding: '14px 26px', fontSize: 40, fontWeight: 600, color: '#fff', borderRadius: 8, whiteSpace: 'nowrap'}}>{p.note.text}</div>
        </div>
      ) : null}
    </Panel>
  );
};

// ---------- select t1 from t1: one code line edited in place over a real result grid ----------
export type SqlStage = {at: number; code: {text: string; hl?: boolean}[]; head: string[]; rows: string[][]; collapse?: boolean};
export type SelectProps = {stages: SqlStage[]; punchAt?: number; durationSec: number};
export const Select196: React.FC<SelectProps> = (p) => {
  const {frame, fps, t, s} = useT();
  let cur = 0;
  p.stages.forEach((x, i) => { if (t >= x.at) cur = i; });
  const st = p.stages[cur];
  const k = s(st.at, {damping: 13, stiffness: 190, mass: 0.6});
  const punch = p.punchAt !== undefined ? spring({frame: frame - p.punchAt * fps, fps, config: {damping: 8, stiffness: 240, mass: 0.6}}) : 0;
  const isPunch = st.collapse && p.punchAt !== undefined;
  const codeChars = st.code.map((c) => c.text).join('').length;
  const codeSize = Math.min(44, Math.floor(1440 / ((codeChars + 11) * 0.61)));
  const cell = (txt: string, head: boolean, key: string | number, flex = 1) => (
    <div key={key} style={{flex, padding: '16px 24px', fontFamily: MONO, fontSize: head ? 34 : 40, fontWeight: 500, color: head ? DIM : '#fff', borderRight: '2px solid rgba(255,255,255,0.12)', whiteSpace: 'pre', overflow: 'hidden'}}>{txt}</div>
  );
  const many = st.head.length > 1;
  const longest = Math.max(...st.rows.flat().map((x) => x.length), 1);
  const bodySize = Math.min(40, Math.floor(1400 / (longest * 0.6)));
  return (
    <Panel>
      <div style={{fontSize: 38, fontWeight: 600, color: DIM, opacity: s(0.2)}}>psql, PostgreSQL 17 and 18</div>
      <div style={{fontFamily: MONO, fontSize: codeSize, fontWeight: 500, marginTop: 18, whiteSpace: 'pre', minHeight: 64, fontVariantLigatures: 'none'}}>
        <span style={{color: K.lblue}}>{'postgres=# '}</span>
        {st.code.map((c, i) => (
          <span key={`${cur}-${i}`} style={c.hl ? {background: K.yellow, color: '#111', borderRadius: 6, padding: '0 4px'} : undefined}>{c.text}</span>
        ))}
      </div>
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: many ? 1200 : undefined, minWidth: 700, border: '2px solid rgba(255,255,255,0.18)', borderRadius: 12, overflow: 'hidden', opacity: k, transform: `scale(${0.96 + 0.04 * k + (isPunch ? 0.06 * Math.sin(Math.min(1, punch) * Math.PI) : 0)})`}}>
          <div style={{display: 'flex', background: '#2c2c33'}}>{st.head.map((h, i) => cell(h, true, i))}</div>
          {st.rows.map((row, ri) => (
            <div key={ri} style={{display: 'flex', borderTop: '2px solid rgba(255,255,255,0.12)', background: isPunch ? 'rgba(255,210,63,0.12)' : undefined}}>
              {row.map((c, ci) => (
                <div key={ci} style={{flex: 1, padding: '16px 24px', fontFamily: MONO, fontSize: many ? 40 : bodySize, fontWeight: 500, color: c === 'vacation' ? K.yellow : '#fff', borderRight: '2px solid rgba(255,255,255,0.12)', whiteSpace: 'pre'}}>{c}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{fontSize: 38, fontWeight: 600, color: DIM, textAlign: 'center'}}>{`(${st.rows.length} row${st.rows.length > 1 ? 's' : ''})`}</div>
    </Panel>
  );
};

// ---------- a real psql session: statements typed, output verbatim from PostgreSQL 18.6 ----------
// psql18.json is parsed from a real interactive psql session (research/psql18-session.txt).
export type PsqlStmt = {typeAt: number; enterAt: number; cps?: number}; // cps: fast linear typing (setup lines)
export type PsqlProps = {stmts: PsqlStmt[]; hl?: {stmt: number; text: string; at: number}; flash?: {stmt: number; at: number}; durationSec: number};
export const psqlPlan = (p: {stmts: PsqlStmt[]}) => p.stmts.map((s, i) => {
  const cmd = PSQL.blocks[i].cmd;
  const bs = s.cps ? [{start: s.typeAt, end: s.typeAt + cmd.length / s.cps, chars: cmd.length, from: 0}] : textBursts(cmd, s.typeAt);
  return {...s, cmd, out: PSQL.blocks[i].out, bs};
});
const psqlTyped = (st: {cps?: number; cmd: string; bs: Burst[]}, t: number) =>
  st.cps ? Math.max(0, Math.min(st.cmd.length, Math.floor((t - st.bs[0].start) * st.cps))) : Math.min(st.cmd.length, typedAt(st.bs, t));
const PSQL_COLS = 69; // terminal width in characters (36 px JetBrains Mono in the panel); long input wraps like a real terminal
export const Psql196: React.FC<PsqlProps> = (p) => {
  const {t, s, fadeOut, frame, fps} = useT();
  const k = s(0, {damping: 16, stiffness: 160, mass: 0.7});
  const plan = psqlPlan(p);
  const FS = 36, LH = 48, BODY_H = PANEL.h - 56 - 44;
  const maxLines = Math.floor(BODY_H / LH);
  type L = {text: string; kind: 'prompt' | 'out' | 'banner'; stmt?: number; typed?: number; cursor?: boolean; cont?: boolean};
  const lines: L[] = [...PSQL.banner.map((b) => ({text: b, kind: 'banner' as const})), {text: '', kind: 'out'}];
  let done = true;
  plan.forEach((st, i) => {
    if (!done) return;
    const n = t >= st.typeAt ? psqlTyped(st, t) : 0;
    const entered = t >= st.enterAt;
    // a multi-line statement: psql shows the continuation prompt postgres-# on the next lines
    let off = 0;
    st.cmd.split('\n').forEach((part, j) => {
      if (j > 0 && n <= off) return;
      const typed = Math.max(0, Math.min(part.length, n - off));
      const last = j === st.cmd.split('\n').length - 1 || n <= off + part.length;
      lines.push({text: part, kind: 'prompt', stmt: i, typed, cursor: !entered && last, cont: j > 0});
      off += part.length + 1;
    });
    if (entered) { st.out.forEach((o) => lines.push({text: o, kind: 'out', stmt: i})); if ((PSQL.blocks[i] as {gap?: boolean}).gap !== false) lines.push({text: '', kind: 'out'}); }
    else done = false;
  });
  if (done) lines.push({text: '', kind: 'prompt', typed: 0, cursor: true});
  const rows = (ln: L) => ln.kind === 'prompt' ? Math.max(1, Math.ceil((11 + (ln.typed ?? 0) + (ln.cursor ? 1 : 0)) / PSQL_COLS)) : 1;
  let used = 0, first = lines.length;
  while (first > 0 && used + rows(lines[first - 1]) <= maxLines) { used += rows(lines[first - 1]); first--; }
  const vis = lines.slice(first);
  const blink = Math.floor(t * 2) % 2 === 0;
  const flashK = p.flash ? Math.max(0, 1 - Math.abs(t - p.flash.at - 0.25) / 0.6) : 0;
  const hlOn = p.hl && t >= p.hl.at;
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, background: '#0d0d10', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.55)', border: '2px solid #3a3a42', opacity: k, transform: `scale(${0.97 + 0.03 * k})`}}>
        <div style={{height: 56, background: '#2a2a30', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 12}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 20, height: 20, borderRadius: 10, background: c}} />)}
          <div style={{flex: 1, textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 34, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginRight: 90}}>psql (PostgreSQL 18.6)</div>
        </div>
        <div style={{padding: '22px 30px', fontFamily: MONO, fontSize: FS, lineHeight: `${LH}px`, color: '#e8e8e8', whiteSpace: 'pre', fontVariantLigatures: 'none'}}>
          {vis.map((ln, i) => {
            if (ln.kind !== 'prompt') {
              const isFlash = p.flash && ln.stmt === p.flash.stmt && flashK > 0 && ln.text.startsWith(' {');
              return <div key={i} style={{height: LH, background: isFlash ? `rgba(255,210,63,${0.35 * flashK})` : undefined}}>{ln.text || ' '}</div>;
            }
            const shown = ln.text.slice(0, ln.typed);
            let body: React.ReactNode = shown;
            if (hlOn && ln.stmt === p.hl!.stmt) {
              const j = shown.indexOf(p.hl!.text);
              if (j >= 0) body = <>{shown.slice(0, j)}<span style={{background: K.yellow, color: '#111'}}>{p.hl!.text}</span>{shown.slice(j + p.hl!.text.length)}</>;
            }
            return (
              <div key={i} style={{height: LH * rows(ln), width: `${PSQL_COLS}ch`, whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                <span>{ln.cont ? 'postgres-# ' : 'postgres=# '}</span>{body}
                {ln.cursor && (blink || (ln.typed! > 0 && ln.typed! < ln.text.length)) ? <span style={{display: 'inline-block', width: FS * 0.6, height: LH * 0.8, verticalAlign: 'middle', background: '#e8e8e8'}} /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- technical charts (host feedback 2026-11-11): real axes, ticks, gridlines, units ----------
const AX = 'rgba(255,255,255,0.75)', GRID = 'rgba(255,255,255,0.14)', TICK = 38;
const ASHC: Record<string, string> = {CPU: '#73BF69', IO: '#5794F2', LWLock: '#C4162A', Lock: '#F2495C', IPC: '#FADE2A', Timeout: '#896638'};
const ORDER = ['CPU', 'IO', 'Lock', 'LWLock', 'IPC', 'Timeout'];
type AshFig = {t: number[]; classes: Record<string, number[]>; ymax: number; xmax: number};
const AshArea: React.FC<{fig: AshFig; x: number; y: number; w: number; h: number; reveal: number; yTicks: number[]; xTicks: number[]; small?: boolean}> = ({fig, x, y, w, h, reveal, yTicks, xTicks, small}) => {
  const px = (t: number) => x + (t / fig.xmax) * w, py = (v: number) => y + h - (v / fig.ymax) * h;
  const cls = ORDER.filter((c) => fig.classes[c]);
  const cum = fig.t.map(() => 0);
  const fs = small ? 24 : TICK;
  const bands = cls.map((c) => {
    const lo = [...cum];
    fig.classes[c].forEach((v, i) => { cum[i] += v; });
    const top = fig.t.map((t, i) => `${px(t)},${py(cum[i])}`), bot = fig.t.map((t, i) => `${px(t)},${py(lo[i])}`).reverse();
    return <polygon key={c} points={[...top, ...bot].join(' ')} fill={ASHC[c]} />;
  });
  return (
    <g>
      {yTicks.map((v) => <g key={v}><line x1={x} x2={x + w} y1={py(v)} y2={py(v)} stroke={GRID} strokeWidth={2} /><text x={x - 14} y={py(v) + fs * 0.35} fill={AX} fontSize={fs} fontFamily="Inter" fontWeight={500} textAnchor="end">{fmt(v)}</text></g>)}
      {xTicks.map((v) => <text key={v} x={px(v)} y={y + h + fs + 10} fill={AX} fontSize={fs} fontFamily="Inter" fontWeight={500} textAnchor="middle">{v}</text>)}
      <clipPath id={`rv${x}${y}`}><rect x={x} y={y - 2} width={w * reveal} height={h + 4} /></clipPath>
      <g clipPath={`url(#rv${x}${y})`}>{bands}</g>
      <line x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={AX} strokeWidth={3} />
      <line x1={x} x2={x} y1={y} y2={y + h} stroke={AX} strokeWidth={3} />
    </g>
  );
};
// Shares as stacked 100% bars (the brief's text numbers), plus the per-second strip of Fig. 6.2b from
// forge's 1 s bins (ash62b.json); seconds without samples are hatched "no samples", never drawn as zero.
export type ShareSeg = {cls: string; value: number; at: number; label?: string};
export type Ash196Props = {rows: {name: string; segs: ShareSeg[]; at: number}[]; durationSec: number};
export const Ash196: React.FC<Ash196Props> = (p) => {
  const {grow, s, frame, fps} = useT();
  const X = 230, W = 1100, BH = 92, Y0 = 70, RG = 170;
  const px = (v: number) => X + (v / 100) * W;
  // strip
  const SX = 230, SW = 1100, SY = 470, SH = 160, SMAX = 600;
  const bins = ASHB.t.length, bw = SW / bins;
  const rev = grow(0.3, 1.6);
  const order = ['CPU', 'IO', 'LWLock', 'IPC', 'Timeout'];
  const strip: React.ReactNode[] = [];
  ASHB.t.forEach((t, i) => {
    if (i / bins > rev) return;
    const x = SX + i * bw;
    if (ASHB.total[i] === 0) { strip.push(<rect key={`g${i}`} x={x + 1} y={SY} width={bw - 2} height={SH} fill="url(#hatch)" />); return; }
    let acc = 0;
    order.forEach((c) => { const v = (ASHB.classes as Record<string, number[]>)[c]?.[i] ?? 0; if (!v) return; const h = (v / SMAX) * SH; strip.push(<rect key={`${c}${i}`} x={x + 1} y={SY + SH - acc - h} width={bw - 2} height={h} fill={ASHC[c]} />); acc += h; });
  });
  return (
    <Panel>
      <Title text="Where active sessions are: share of sampled time" sub="pg_wait_sampling, all sessions, PG18.6, 500 DDL tx/s target" />
      <svg width={1470} height={760} style={{marginTop: 10, overflow: 'visible'}}>
        <defs><pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="rgba(255,255,255,0.04)" /><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.22)" strokeWidth="3" /></pattern></defs>
        {[0, 25, 50, 75, 100].map((v) => <g key={v}><line x1={px(v)} x2={px(v)} y1={Y0 - 16} y2={Y0 + RG + BH + 10} stroke={GRID} strokeWidth={2} /><text x={px(v)} y={Y0 + RG + BH + 48} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="middle">{v}%</text></g>)}
        {p.rows.map((r, ri) => {
          const y = Y0 + ri * RG;
          let acc = 0;
          return (
            <g key={ri} opacity={Math.min(1, s(r.at) * 1.5)}>
              <text x={X - 24} y={y + BH / 2 + 12} fill="#fff" fontSize={38} fontFamily="Inter" fontWeight={700} textAnchor="end">{r.name}</text>
              {r.segs.map((sg, i) => {
                const g = interpolate(frame, [sg.at * fps, (sg.at + 0.7) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
                const x0 = px(acc); acc += sg.value; const w = Math.max(sg.value > 0 ? 3 : 0, ((sg.value / 100) * W) * g);
                const big = sg.value > 30, small = sg.value < 3;
                const lx = big ? x0 + 24 : small ? Math.max(x0 + w + 10, px(100) - 330 + (sg.cls === 'IO' ? 0 : 0)) : x0 + 14;
                return (
                  <g key={i}>
                    <rect x={x0} y={y} width={w} height={BH} fill={ASHC[sg.cls]} />
                    {g > 0.5 ? (big
                      ? <text x={lx} y={y + BH / 2 + 18} fill="#fff" fontSize={52} fontFamily="Inter" fontWeight={700}>{`${sg.cls} ${sg.label}`}</text>
                      : <text x={small ? px(100) + 16 : x0 + w / 2} y={small ? y + BH / 2 + 12 + (sg.cls === 'IO' ? 30 : -14) : y - 14} fill={ASHC[sg.cls] === '#C4162A' ? '#FF4B5C' : ASHC[sg.cls]} fontSize={small ? 32 : 44} fontFamily="Inter" fontWeight={700} textAnchor={small ? 'start' : 'middle'}>{`${sg.cls} ${sg.label}`}</text>) : null}
                  </g>
                );
              })}
            </g>
          );
        })}
        <text x={SX} y={SY - 20} fill={AX} fontSize={36} fontFamily="Inter" fontWeight={600}>5,000 idle, per second (Fig. 6.2b): average active sessions</text>
        {[0, 300, 600].map((v) => <g key={v}><line x1={SX} x2={SX + SW} y1={SY + SH - (v / SMAX) * SH} y2={SY + SH - (v / SMAX) * SH} stroke={GRID} strokeWidth={2} /><text x={SX - 14} y={SY + SH - (v / SMAX) * SH + 10} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="end">{v}</text></g>)}
        {strip}
        <line x1={SX} x2={SX + SW} y1={SY + SH} y2={SY + SH} stroke={AX} strokeWidth={3} />
        {[0, 20, 40, 60, 80].map((v) => <text key={v} x={SX + (v + 0.5) * bw} y={SY + SH + 40} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="middle">{v} s</text>)}
        <g transform={`translate(${SX + SW - 190}, ${SY - 44})`} opacity={rev}><rect x={0} y={-24} width={30} height={30} fill="url(#hatch)" stroke="rgba(255,255,255,0.3)" /><text x={40} y={0} fill={AX} fontSize={34} fontFamily="Inter" fontWeight={500}>no samples</text></g>
      </svg>
      <div style={{position: 'absolute', left: 50, bottom: 30, fontSize: 36, fontWeight: 500, color: DIM}}>Shares as stated in the brief (sample-weighted). Synthetic workload.</div>
    </Panel>
  );
};

// horizontal bars on a linear axis with ticks and gridlines
export type AxisBarsProps = {title: string; sub: string; unit: string; max: number; ticks: number[]; rows: {label: string; sub?: string; value: number; at: number; color: string; text: string}[]; note?: {text: string; at: number}; caption: string; durationSec: number};
export const AxisBars196: React.FC<AxisBarsProps> = (p) => {
  const {grow, s, frame, fps} = useT();
  const X = 40, W = 1180, ROW = 240, Y0 = 70;
  const px = (v: number) => X + (v / p.max) * W;
  const H = p.rows.length * ROW;
  return (
    <Panel>
      <Title text={p.title} sub={p.sub} />
      <svg width={1470} height={H + 140} style={{marginTop: 30, overflow: 'visible'}}>
        {p.ticks.map((v) => <g key={v}><line x1={px(v)} x2={px(v)} y1={Y0 - 20} y2={Y0 + H} stroke={GRID} strokeWidth={2} /><text x={px(v)} y={Y0 + H + 44} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="middle">{fmt(v)}</text></g>)}
        <line x1={X} x2={X} y1={Y0 - 20} y2={Y0 + H} stroke={AX} strokeWidth={3} />
        <line x1={X} x2={X + W} y1={Y0 + H} y2={Y0 + H} stroke={AX} strokeWidth={3} />
        <text x={X + W} y={Y0 + H + 90} fill={AX} fontSize={36} fontFamily="Inter" fontWeight={500} textAnchor="end">{p.unit}</text>
        {p.rows.map((r, i) => {
          const g = interpolate(frame, [r.at * fps, (r.at + 1.0) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          const y = Y0 + i * ROW;
          const w = Math.max(r.value > 0 ? 6 : 0, (r.value / p.max) * W * g);
          return (
            <g key={i} opacity={Math.min(1, s(r.at) * 1.4)}>
              <text x={X + 16} y={y + 6} fill="#fff" fontSize={42} fontFamily="Inter" fontWeight={700}>{r.label}{r.sub ? <tspan fill={AX} fontSize={38} fontWeight={500}>{'  ' + r.sub}</tspan> : null}</text>
              <rect x={X} y={y + 34} width={w} height={110} fill={r.color} rx={4} />
              <text x={X + w + 22} y={y + 118} fill={r.color} fontSize={96} fontFamily="Inter" fontWeight={700}>{g > 0.02 ? r.text : ''}</text>
            </g>
          );
        })}
      </svg>
      {p.note ? <div style={{fontSize: 40, fontWeight: 600, color: '#fff', opacity: grow(p.note.at, 0.5)}}>{p.note.text}</div> : null}
      <div style={{position: 'absolute', left: 50, bottom: 30, fontSize: 36, fontWeight: 500, color: DIM}}>{p.caption}</div>
    </Panel>
  );
};

// ---------- 16 (v3): plain ASH time series, 0 idle vs 5,000 idle (Fig. 6.2a / 6.2b, forge's 1 s bins) ----------
// Same y scale (average active sessions) and same x scale for both runs, so the 5,000-idle pile-up reads at a
// glance. In 6.2b, seconds with no samples (pg_wait_sampling collected in bursts) are hatched, never drawn as 0.
type AshRun = {t: number[]; classes: Record<string, (number | null)[]>};
export type AshTSProps = {top: {at: number; label?: {text: string; at: number}}; bottom: {at: number; label?: {text: string; at: number}}; durationSec: number};
const AshBars: React.FC<{run: AshRun; x: number; y: number; w: number; h: number; ymax: number; xmax: number; reveal: number; hatchGaps: boolean}> = ({run, x, y, w, h, ymax, xmax, reveal, hatchGaps}) => {
  const bw = w / xmax, order = ['CPU', 'IO', 'Lock', 'LWLock', 'IPC', 'Timeout'];
  const out: React.ReactNode[] = [];
  run.t.forEach((t, i) => {
    if (t / xmax > reveal) return;
    const bx = x + t * bw;
    const tot = order.reduce((a, c) => a + (run.classes[c]?.[i] ?? 0), 0);
    if (tot === 0) { if (hatchGaps) out.push(<rect key={`g${i}`} x={bx + 1} y={y} width={bw - 2} height={h} fill="url(#hatch16)" />); return; }
    let acc = 0;
    order.forEach((c) => { const v = run.classes[c]?.[i] ?? 0; if (!v) return; const hh = (v / ymax) * h; out.push(<rect key={`${c}${i}`} x={bx + 0.5} y={y + h - acc - hh} width={bw - 1} height={hh} fill={ASHC[c]} />); acc += hh; });
  });
  return <g>{out}</g>;
};
export const AshTS196: React.FC<AshTSProps> = (p) => {
  const {grow, s} = useT();
  const X = 170, W = 1240, H = 200, YMAX = 700, XMAX = 65;
  const PY = [125, 455];
  const runs = [ASH['Fig. 6.2a'] as unknown as AshRun, ASH['Fig. 6.2b'] as unknown as AshRun];
  const cfg = [{name: '0 idle sessions', ...p.top, hatch: false}, {name: '5,000 idle sessions', ...p.bottom, hatch: true}];
  const legend = [['CPU', 'CPU'], ['LWLock', 'LWLock (SInvalWrite)'], ['IO', 'IO']];
  return (
    <Panel>
      <Title text="Active session history: 0 vs 5,000 idle sessions" sub="pg_wait_sampling, 1 s bins · PG18, 500 DDL tx/s, synthetic workload" />
      <svg width={1470} height={780} style={{position: 'absolute', left: 50, top: 190, overflow: 'visible'}}>
        <defs><pattern id="hatch16" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="rgba(255,255,255,0.03)" /><line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.16)" strokeWidth="3" /></pattern></defs>
        <g opacity={s(0.3)}>
          {legend.map(([c, txt], i) => <g key={c} transform={`translate(${X + [0, 180, 640][i]}, 30)`}><rect x={0} y={-24} width={30} height={30} rx={4} fill={ASHC[c]} /><text x={42} y={0} fill="#fff" fontSize={38} fontFamily="Inter" fontWeight={600}>{txt}</text></g>)}
          <g transform={`translate(${X + 1240 - 250}, 30)`}><rect x={0} y={-24} width={30} height={30} fill="url(#hatch16)" stroke="rgba(255,255,255,0.35)" /><text x={42} y={0} fill={AX} fontSize={36} fontFamily="Inter" fontWeight={500}>no samples</text></g>
        </g>
        {cfg.map((c, k) => {
          const y = PY[k], rev = grow(c.at, 1.6), o = s(c.at - 0.1);
          return (
            <g key={k} opacity={Math.min(1, o * 1.4)}>
              <text x={X} y={y - 22} fill="#fff" fontSize={38} fontFamily="Inter" fontWeight={700}>{c.name}</text>
              {[0, 300, 600].map((v) => <g key={v}><line x1={X} x2={X + W} y1={y + H - (v / YMAX) * H} y2={y + H - (v / YMAX) * H} stroke={GRID} strokeWidth={2} /><text x={X - 16} y={y + H - (v / YMAX) * H + 10} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="end">{v}</text></g>)}
              <AshBars run={runs[k]} x={X} y={y} w={W} h={H} ymax={YMAX} xmax={XMAX} reveal={rev} hatchGaps={c.hatch} />
              <line x1={X} x2={X + W} y1={y + H} y2={y + H} stroke={AX} strokeWidth={3} />
              <line x1={X} x2={X} y1={y} y2={y + H} stroke={AX} strokeWidth={3} />
              {[20, 40, 60].map((v) => <text key={v} x={X + (v / XMAX) * W} y={y + H + 38} fill={AX} fontSize={TICK} fontFamily="Inter" fontWeight={500} textAnchor="middle">{`${v} s`}</text>)}
              {c.label ? <text x={X + W} y={y - 22} fill={k === 0 ? ASHC.CPU : '#FF4B5C'} fontSize={40} fontFamily="Inter" fontWeight={800} textAnchor="end" opacity={grow(c.label.at, 0.4)}>{c.label.text}</text> : null}
            </g>
          );
        })}
        <text x={X - 120} y={PY[0] + H + 65} fill={AX} fontSize={34} fontFamily="Inter" fontWeight={500} transform={`rotate(-90 ${X - 120} ${PY[0] + H + 65})`} textAnchor="middle">average active sessions</text>
      </svg>
    </Panel>
  );
};
