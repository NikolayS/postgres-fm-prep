import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';
import {CENTER} from './CenterChart';
import {bursts, typedAt, textBursts, Burst} from './typing';
import {Marker, Wipe, seedOf, BAND} from './Band';

// Episode overlays, "UUIDv4 vs UUIDv7" (2026-10-27 recording). Simple by rule (Nik): one idea per
// card, big numbers, few words. Every reveal time is seconds from the overlay start, mapped from
// SOURCE word times in scripts/episode.ts. Colours are fixed per key on every card.
export const KEY = {v4: '#FF7A1A', v7: '#FFD23F', int8: '#7CC4FF'};
const ACCENT = '#FFD23F';
const DIM = 'rgba(255,255,255,0.62)';
const MONO = 'JetBrains Mono, Menlo, monospace';
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const useT = (fadeSec = 0.4) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const s = (at: number, cfg = {damping: 14, stiffness: 200, mass: 0.6}) => spring({frame: frame - at * fps, fps, config: cfg});
  const grow = (at: number, d = 0.9) => interpolate(frame, [at * fps, (at + d) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const fadeOut = interpolate(frame, [durationInFrames - fadeSec * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return {frame, fps, t, s, grow, fadeOut, dur: durationInFrames / fps};
};

const Panel: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {s, fadeOut} = useT();
  const panel = s(0, {damping: 16, stiffness: 160, mass: 0.7});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: CENTER.x, top: CENTER.y, width: CENTER.w, height: CENTER.h, background: 'rgba(8,8,10,0.9)', borderRadius: 18, padding: '30px 30px 26px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: panel, transform: `scale(${0.96 + 0.04 * panel})`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: '#fff', overflow: 'hidden'}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 01: what a UUIDv4 and a UUIDv7 look like ----------
// Two mono lines in the free area under the tiles. The version digit pops in a yellow box;
// on v7 the leading 48-bit time part gets a yellow underline and a "time" label.
export type UuidProps = {v4: string; v7: string; v4At: number; d4At: number; v7At: number; d7At: number; timeAt: number; durationSec: number};
export const UuidBand: React.FC<UuidProps> = (p) => {
  const {s, grow, fadeOut} = useT(0.3);
  const CH = 0.6; // JetBrains Mono advance, em
  const FS = 50;
  const line = (label: string, color: string, id: string, at: number, dAt: number, extra?: React.ReactNode) => {
    const k = s(at);
    const pop = s(dAt, {damping: 9, stiffness: 260, mass: 0.5});
    const i = 14; // version digit index: xxxxxxxx-xxxx-Vxxx
    return (
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', background: '#111', borderRadius: 12, padding: '8px 24px 8px 26px', opacity: k, transform: `translateX(${(1 - k) * -24}px)`}}>
        <div style={{width: 196, fontSize: 46, fontWeight: 800, color}}>{label}</div>
        <div style={{position: 'relative', fontFamily: MONO, fontSize: FS, fontWeight: 500, color: '#fff', whiteSpace: 'pre', lineHeight: 1.2}}>
          <span>{id.slice(0, i)}</span>
          <span style={{position: 'relative', display: 'inline-block'}}>
            <span style={{position: 'absolute', left: -6, right: -6, top: -2, bottom: -2, background: ACCENT, borderRadius: 6, opacity: pop, transform: `scale(${0.4 + 0.6 * pop}) rotate(-4deg)`}} />
            <span style={{position: 'relative', color: pop > 0.5 ? '#111' : '#fff', fontWeight: 800}}>{id[i]}</span>
          </span>
          <span>{id.slice(i + 1)}</span>
          {extra}
        </div>
      </div>
    );
  };
  const tw = grow(p.timeAt, 0.6);
  const timeMark = (
    <>
      <div style={{position: 'absolute', left: 0, top: '100%', marginTop: 2, width: 13 * CH * FS * tw, height: 7, borderRadius: 3, background: ACCENT}} />
      <div style={{position: 'absolute', left: -14, top: '100%', marginTop: 20, fontFamily: 'Inter, sans-serif', fontSize: 34, fontWeight: 800, color: ACCENT, background: '#111', borderRadius: 8, padding: '2px 14px', opacity: s(p.timeAt + 0.4)}}>time</div>
    </>
  );
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: 24, top: 800, display: 'flex', flexDirection: 'column', gap: 26}}>
        {line('UUIDv4', KEY.v4, p.v4, p.v4At, p.d4At)}
        {line('UUIDv7', KEY.v7, p.v7, p.v7At, p.d7At, timeMark)}
      </div>
    </AbsoluteFill>
  );
};

// ---------- 01, typing version (Nik, 2026-10-30) ----------
// Same strips, size, place and beats as UuidBand; only the reveal changes: the hex groups are
// typed left to right with a block cursor. Untyped characters are hidden but keep their space,
// so the strip does not change width. The digit pops and the time mark keep their times.
export const UuidTyping: React.FC<UuidProps & {cursorOff?: number}> = (p) => {
  const {t, s, grow, fadeOut} = useT(0.3);
  const CH = 0.6;
  const FS = 50;
  const b4 = bursts(p.v4, p.v4At), b7 = bursts(p.v7, p.v7At);
  const cursorOff = p.cursorOff ?? p.timeAt + 3;
  const line = (label: string, color: string, id: string, at: number, dAt: number, bs: ReturnType<typeof bursts>, next: number, extra?: React.ReactNode) => {
    const k = s(at);
    const pop = s(dAt, {damping: 9, stiffness: 260, mass: 0.5});
    const n = typedAt(bs, t);
    const i = 14;
    const typing = bs.some((b) => t >= b.start && t < b.end + 0.12);
    const blinkOn = typing || Math.floor((t - at) * 2) % 2 === 0; // 1 Hz blink when idle
    const showCursor = t >= at + 0.15 && t < next && blinkOn;
    const ch = (c: string, j: number) => <span key={j} style={{visibility: j < n ? 'visible' : 'hidden'}}>{c}</span>;
    return (
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', background: '#111', borderRadius: 12, padding: '8px 24px 8px 26px', opacity: k, transform: `translateX(${(1 - k) * -24}px)`}}>
        <div style={{width: 196, fontSize: 46, fontWeight: 800, color}}>{label}</div>
        <div style={{position: 'relative', fontFamily: MONO, fontSize: FS, fontWeight: 500, color: '#fff', whiteSpace: 'pre', lineHeight: 1.2}}>
          <span>{[...id.slice(0, i)].map((c, j) => ch(c, j))}</span>
          <span style={{position: 'relative', display: 'inline-block', visibility: i < n ? 'visible' : 'hidden'}}>
            <span style={{position: 'absolute', left: -6, right: -6, top: -2, bottom: -2, background: ACCENT, borderRadius: 6, opacity: pop, transform: `scale(${0.4 + 0.6 * pop}) rotate(-4deg)`}} />
            <span style={{position: 'relative', color: pop > 0.5 ? '#111' : '#fff', fontWeight: 800}}>{id[i]}</span>
          </span>
          <span>{[...id.slice(i + 1)].map((c, j) => ch(c, j + i + 1))}</span>
          {showCursor ? <div style={{position: 'absolute', left: Math.min(n, id.length) * CH * FS + 2, top: '12%', width: CH * FS - 6, height: '76%', background: 'rgba(255,255,255,0.85)'}} /> : null}
          {extra}
        </div>
      </div>
    );
  };
  const tw = grow(p.timeAt, 0.6);
  const timeMark = (
    <>
      <div style={{position: 'absolute', left: 0, top: '100%', marginTop: 2, width: 13 * CH * FS * tw, height: 7, borderRadius: 3, background: ACCENT}} />
      <div style={{position: 'absolute', left: -14, top: '100%', marginTop: 20, fontFamily: 'Inter, sans-serif', fontSize: 34, fontWeight: 800, color: ACCENT, background: '#111', borderRadius: 8, padding: '2px 14px', opacity: s(p.timeAt + 0.4)}}>time</div>
    </>
  );
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: 24, top: 800, display: 'flex', flexDirection: 'column', gap: 26}}>
        {line('UUIDv4', KEY.v4, p.v4, p.v4At, p.d4At, b4, p.v7At)}
        {line('UUIDv7', KEY.v7, p.v7, p.v7At, p.d7At, b7, cursorOff, timeMark)}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Band strips, typing version (Nik, 2026-10-30) ----------
// Same marker strip / quote and sub strip as Band (kind strip|quote), same size and place. The
// marker swipes in empty at 0, then the text types left to right with a block cursor; the sub
// strip wipes in after the main line and types too. Untyped characters keep their space.
export type BandTypingProps = {kind: 'strip' | 'quote'; text: string; sub?: string; durationSec: number};
export const bandTypingPlan = (p: {kind: string; text: string; sub?: string}) => {
  const main = p.kind === 'quote' ? `\u201c${p.text}\u201d` : p.text;
  const mainB = textBursts(main, 0.45);
  const subAt = mainB[mainB.length - 1].end + 0.35;
  const subB = p.sub ? textBursts(p.sub, subAt + 0.3) : [];
  return {main, mainB, subAt, subB};
};
const Typed: React.FC<{text: string; bs: Burst[]; t: number; cursor: string; cursorUntil: number; cursorFrom: number}> = ({text, bs, t, cursor, cursorUntil, cursorFrom}) => {
  const n = typedAt(bs, t);
  const typing = bs.some((b) => t >= b.start && t < b.end + 0.12);
  const blinkOn = typing || Math.floor(t * 2) % 2 === 0;
  const chars = [...text];
  return (
    <span style={{position: 'relative'}}>
      {chars.map((c, j) => (
        <span key={j} style={{position: 'relative', visibility: j < n ? 'visible' : 'hidden'}}>
          {c}
          {j === n && t >= cursorFrom && t < cursorUntil && blinkOn ? <span style={{position: 'absolute', left: 1, top: '8%', width: '0.5em', height: '84%', background: cursor, visibility: 'visible'}} /> : null}
        </span>
      ))}
      {n >= chars.length && t >= cursorFrom && t < cursorUntil && blinkOn ? <span style={{display: 'inline-block', width: '0.5em', height: '0.84em', marginLeft: 3, verticalAlign: '-0.08em', background: cursor}} /> : null}
    </span>
  );
};
export const BandTyping: React.FC<BandTypingProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const fadeOut = interpolate(frame, [durationInFrames - 0.2 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const {main, mainB, subAt, subB} = bandTypingPlan(p);
  const mainDone = mainB[mainB.length - 1].end;
  const subDone = subB.length ? subB[subB.length - 1].end : mainDone;
  const cursorOff = subDone + 3; // blink a little after the last line, then go
  const strip: React.CSSProperties = {display: 'inline-block', background: 'rgba(17,17,17,0.85)', color: '#fff', fontSize: p.kind === 'quote' ? 28 : 30, fontWeight: 500, lineHeight: 1.2, padding: '6px 22px', borderRadius: 8, whiteSpace: 'pre', marginLeft: 26};
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: BAND.x, top: BAND.y, width: BAND.w, height: BAND.h, display: 'flex', alignItems: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start'}}>
          <Marker frame={frame} fps={fps} delay={0} seed={seedOf(p.text)} fontSize={p.kind === 'quote' ? 44 : 46}>
            <span style={{whiteSpace: 'pre'}}><Typed text={main} bs={mainB} t={t} cursor="#111" cursorFrom={0.3} cursorUntil={p.sub ? subAt : cursorOff} /></span>
          </Marker>
          {p.sub ? (
            <Wipe frame={frame} fps={fps} delay={subAt}>
              <div style={strip}><Typed text={p.sub} bs={subB} t={t} cursor="rgba(255,255,255,0.85)" cursorFrom={subAt} cursorUntil={cursorOff} /></div>
            </Wipe>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Horizontal bars, one metric (WAL per insert, index size) ----------
export type HBarsProps = {title: string; unit: string; rows: {key: 'v4' | 'v7' | 'int8'; label: string; value: number; sub?: string; at: number}[]; caption?: string; captionAt?: number; durationSec: number};
export const HBars: React.FC<HBarsProps> = (p) => {
  const {s, grow} = useT();
  const max = Math.max(...p.rows.map((r) => r.value));
  const W = 400;
  return (
    <Panel>
      <div style={{fontSize: 52, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, opacity: s(0.2)}}>{p.title}</div>
      <div style={{fontSize: 32, fontWeight: 600, color: DIM, marginTop: 8, opacity: s(0.3)}}>{p.unit}</div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 54}}>
        {p.rows.map((r, i) => {
          const g = grow(r.at, 1.0);
          const c = KEY[r.key];
          return (
            <div key={i} style={{opacity: s(r.at)}}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
                <div style={{fontSize: 40, fontWeight: 800, color: c}}>{r.label}</div>
                {r.sub ? <div style={{fontSize: 30, fontWeight: 600, color: DIM}}>{r.sub}</div> : null}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 10}}>
                <div style={{width: Math.max(8, (r.value / max) * W * g), height: 62, background: c, borderRadius: 8}} />
                <div style={{fontSize: 64, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: g}}>{fmt(r.value * g)}</div>
              </div>
            </div>
          );
        })}
      </div>
      {p.caption ? <div style={{fontSize: 30, fontWeight: 500, color: DIM, lineHeight: 1.3, opacity: s(p.captionAt ?? 2)}}>{p.caption}</div> : null}
    </Panel>
  );
};

// ---------- 02: what stays in memory, then the insert-rate chart ----------
type Pt = [number, number]; // [M rows, inserts/s]
export type MemGraphProps = {
  memTitle: string; memSub: string;
  mem: {key: 'v4' | 'v7' | 'int8'; label: string; index: number; table: number; at: number}[];
  memOf: number; // MiB, full bar = shared_buffers
  graphAt: number; // phase B starts
  graphTitle: string; graphCaption: string;
  lines: {key: 'v4' | 'v7' | 'int8'; label: string; end: string; pts: Pt[]}[];
  drawSec: number;
  marker: {x: number; text: string[]; at: number};
  durationSec: number;
};
export const MemGraph: React.FC<MemGraphProps> = (p) => {
  const {t, s, grow} = useT();
  const phaseA = interpolate(t, [p.graphAt - 0.4, p.graphAt], [1, 0], clamp);
  const phaseB = s(p.graphAt, {damping: 16, stiffness: 160, mass: 0.7});
  const BW = 630;

  const memView = (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', opacity: phaseA}}>
      <div style={{fontSize: 52, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, opacity: s(0.2)}}>{p.memTitle}</div>
      <div style={{fontSize: 30, fontWeight: 600, color: DIM, marginTop: 8, opacity: s(0.3)}}>{p.memSub}</div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 50}}>
        {p.mem.map((m, i) => {
          const g = grow(m.at, 1.1);
          const gt = grow(m.at + 0.5, 0.9);
          const c = KEY[m.key];
          return (
            <div key={i} style={{opacity: s(m.at)}}>
              <div style={{fontSize: 40, fontWeight: 800, color: c}}>{m.label}</div>
              <div style={{display: 'flex', height: 56, marginTop: 10, background: 'rgba(255,255,255,0.10)', borderRadius: 8, overflow: 'hidden', width: BW}}>
                <div style={{width: (m.index / p.memOf) * BW * g, background: c}} />
                <div style={{width: (m.table / p.memOf) * BW * gt, background: '#fff'}} />
              </div>
              <div style={{display: 'flex', gap: 26, marginTop: 10, fontSize: 32, fontWeight: 700, whiteSpace: 'nowrap'}}>
                <span style={{color: c, opacity: g}}>index {fmt(m.index)} MiB</span>
                <span style={{color: '#fff', opacity: gt}}>table {fmt(m.table)} MiB</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Chart geometry inside the panel content box (630 x ~800).
  const X0 = 86, X1 = 410, Y0 = 640, Y1 = 170; // plot box
  const YMAX = 30000;
  const xs = (m: number) => X0 + (m / 100) * (X1 - X0);
  const ys = (v: number) => Y0 - (v / YMAX) * (Y0 - Y1);
  const drawn = interpolate(t, [p.graphAt + 0.6, p.graphAt + 0.6 + p.drawSec], [0, 100], {...clamp, easing: Easing.inOut(Easing.quad)});
  const endIn = s(p.graphAt + 0.6 + p.drawSec);
  const mk = s(p.marker.at);
  const lastY = (pts: Pt[]) => ys(pts[pts.length - 1][1]);
  // End labels: keep at least 40 px apart (int8 and UUIDv7 end close together).
  const ends = p.lines.map((l) => ({l, y: lastY(l.pts)})).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 40) ends[i].y = ends[i - 1].y + 40;
  const graphView = (
    <div style={{position: 'absolute', inset: 0, opacity: phaseB, transform: `scale(${0.97 + 0.03 * phaseB})`}}>
      <div style={{fontSize: 52, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1}}>{p.graphTitle}</div>
      <svg width={630} height={760} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <clipPath id="draw"><rect x={0} y={0} width={xs(drawn) + 3} height={760} /></clipPath>
        </defs>
        {[0, 10000, 20000, 30000].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={ys(v)} y2={ys(v)} stroke="rgba(255,255,255,0.16)" strokeWidth={2} />
            <text x={X0 - 14} y={ys(v) + 10} textAnchor="end" fill={DIM} fontSize={28} fontWeight={600} fontFamily="Inter, sans-serif">{v === 0 ? '0' : `${v / 1000}k`}</text>
          </g>
        ))}
        <text x={0} y={Y1 - 36} textAnchor="start" fill={DIM} fontSize={28} fontWeight={600} fontFamily="Inter, sans-serif">inserts/s</text>
        {[0, 50, 100].map((m) => (
          <text key={m} x={xs(m)} y={Y0 + 40} textAnchor="middle" fill={DIM} fontSize={28} fontWeight={600} fontFamily="Inter, sans-serif">{m === 0 ? '0' : `${m}M`}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y0 + 82} textAnchor="middle" fill={DIM} fontSize={28} fontWeight={600} fontFamily="Inter, sans-serif">rows inserted</text>
        <line x1={X0} x2={X0} y1={Y1 - 10} y2={Y0} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
        <line x1={X0} x2={X1} y1={Y0} y2={Y0} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
        <g opacity={mk}>
          <line x1={xs(p.marker.x)} x2={xs(p.marker.x)} y1={Y1 - 10} y2={Y0} stroke="rgba(255,255,255,0.8)" strokeWidth={3} strokeDasharray="8 8" />
          {p.marker.text.map((tx, i) => (
            <text key={i} x={xs(p.marker.x) + 12} y={Y0 - 130 + i * 34} fill="#fff" fontSize={28} fontWeight={700} fontFamily="Inter, sans-serif" style={{paintOrder: 'stroke', stroke: 'rgba(8,8,10,0.9)', strokeWidth: 8, strokeLinejoin: 'round'}}>{tx}</text>
          ))}
        </g>
        <g clipPath="url(#draw)">
          {p.lines.map((l) => (
            <polyline key={l.key} points={l.pts.map(([m, v]) => `${xs(m).toFixed(1)},${ys(v).toFixed(1)}`).join(' ')} fill="none" stroke={KEY[l.key]} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </g>
        {ends.map(({l, y}) => (
          <g key={l.key} opacity={endIn}>
            <text x={X1 + 16} y={y + 10} fill={KEY[l.key]} fontSize={29} fontWeight={800} fontFamily="Inter, sans-serif">{l.label} <tspan fill="#fff">{l.end}</tspan></text>
          </g>
        ))}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 30, fontWeight: 500, color: DIM, lineHeight: 1.3, opacity: endIn}}>{p.graphCaption}</div>
    </div>
  );
  return (
    <Panel>
      <div style={{position: 'relative', flex: 1}}>
        {phaseA > 0 ? memView : null}
        {t >= p.graphAt - 0.1 ? graphView : null}
      </div>
    </Panel>
  );
};

// ---------- 03: B-tree, random leaf vs always the last leaf ----------
// v4: keys drop from the root to a random leaf. From `memAt` on some leaves are on disk (dashed);
// a key that lands on one reads it in ("read") and pushes another leaf out ("evict").
// v7: keys always drop to the rightmost leaf; it fills; at `splitAt` a new leaf grows on the right.
export type BTreeProps = {
  v4Title: string; v7Title: string; tag: string;
  v4At: number; v4Start: number; v4Step: number; v4Stop: number; memAt: number;
  v7At: number; v7Start: number; v7Step: number; splitAt: number; tagAt: number;
  durationSec: number;
};
const rand = (i: number) => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
export const BTree: React.FC<BTreeProps> = (p) => {
  const {t, s} = useT();
  const W = 630, LW = 60, GAP = 12, N = 8;
  const slotX = (i: number) => (W - (N * LW + (N - 1) * GAP)) / 2 + i * (LW + GAP);
  const TRAVEL = 0.75;

  // v4 events, deterministic.
  type Ev = {at: number; leaf: number; load: boolean; evict: number};
  const evs: Ev[] = [];
  const onDisk = new Set<number>();
  let prev = -1;
  for (let i = 0, at = p.v4Start; at < p.v4Stop; i++, at += p.v4Step) {
    if (onDisk.size === 0 && at + TRAVEL >= p.memAt) [1, 3, 4, 6].forEach((x) => onDisk.add(x));
    let leaf = Math.floor(rand(i) * N);
    if (leaf === prev) leaf = (leaf + 3) % N;
    prev = leaf;
    // After memAt, every other key goes to an on-disk leaf, so the read/evict pair is visible.
    if (at >= p.memAt && i % 2 === 0 && onDisk.size) leaf = [...onDisk][Math.floor(rand(i + 99) * onDisk.size)];
    const load = onDisk.has(leaf);
    let evict = -1;
    if (load) {
      onDisk.delete(leaf);
      const inMem = [...Array(N).keys()].filter((x) => !onDisk.has(x) && x !== leaf);
      evict = inMem[Math.floor(rand(i + 7) * inMem.length)];
      onDisk.add(evict);
    }
    evs.push({at, leaf, load, evict});
  }
  // Disk state at time t: initial set at memAt, then replay arrivals.
  const diskAt = (time: number) => {
    const d = new Set<number>();
    if (time < p.memAt) return d;
    [1, 3, 4, 6].forEach((x) => d.add(x));
    for (const e of evs) if (e.at + TRAVEL <= time && e.load) { d.delete(e.leaf); d.add(e.evict); }
    return d;
  };
  const disk = diskAt(t);
  const v4Dim = interpolate(t, [p.v7At, p.v7At + 0.8], [1, 0.45], clamp);

  const node = (x: number, y: number, w: number, key: string, style: {fill: string; stroke: string; dash?: boolean; op?: number}) => (
    <rect key={key} x={x} y={y} width={w} height={40} rx={8} fill={style.fill} stroke={style.stroke} strokeWidth={3} strokeDasharray={style.dash ? '7 6' : undefined} opacity={style.op ?? 1} />
  );
  const tree = (y0: number, leaves: number[], inner: number[][], leafStyle: (i: number) => {fill: string; stroke: string; dash?: boolean; op?: number}, extra: React.ReactNode, grow?: (i: number) => number) => {
    const rootY = y0, innerY = y0 + 80, leafY = y0 + 170;
    const cx = (ls: number[]) => (slotX(ls[0]) + slotX(ls[ls.length - 1]) + LW) / 2;
    const rootX = (cx(inner[0]) + cx(inner[inner.length - 1])) / 2;
    return (
      <g>
        {inner.map((ls, k) => <line key={`e${k}`} x1={rootX} y1={rootY + 40} x2={cx(ls)} y2={innerY} stroke="rgba(255,255,255,0.35)" strokeWidth={3} />)}
        {inner.map((ls) => ls.map((i) => <line key={`l${i}`} x1={cx(ls)} y1={innerY + 40} x2={slotX(i) + LW / 2} y2={leafY} stroke="rgba(255,255,255,0.35)" strokeWidth={3} opacity={grow ? grow(i) : 1} />))}
        {node(rootX - 45, rootY, 90, 'root', {fill: 'rgba(255,255,255,0.85)', stroke: 'transparent'})}
        {inner.map((ls, k) => node(cx(ls) - 40, innerY, 80, `in${k}`, {fill: 'rgba(255,255,255,0.85)', stroke: 'transparent'}))}
        {leaves.map((i) => {
          const g = grow ? grow(i) : 1;
          return <g key={`lf${i}`} transform={`translate(${slotX(i) + LW / 2},${leafY + 20}) scale(${g}) translate(${-(slotX(i) + LW / 2)},${-(leafY + 20)})`}>{node(slotX(i), leafY, LW, `n${i}`, leafStyle(i))}</g>;
        })}
        {extra}
      </g>
    );
  };
  // Path of a key: root -> inner -> leaf, eased.
  const dot = (y0: number, rootX: number, innerX: number, leafX: number, k: number, color: string, key: string) => {
    const pts: [number, number][] = [[rootX, y0 + 20], [innerX, y0 + 100], [leafX, y0 + 190]];
    const e = Easing.inOut(Easing.quad)(Math.min(1, Math.max(0, k)));
    const seg = e < 0.5 ? 0 : 1;
    const u = seg === 0 ? e * 2 : (e - 0.5) * 2;
    const [ax, ay] = pts[seg], [bx, by] = pts[seg + 1];
    return <circle key={key} cx={ax + (bx - ax) * u} cy={ay + (by - ay) * u} r={13} fill={color} stroke="#111" strokeWidth={3} />;
  };

  // ---- v4 section ----
  const Y4 = 92;
  const inner4 = [[0, 1, 2, 3], [4, 5, 6, 7]];
  const cxs = (ls: number[]) => (slotX(ls[0]) + slotX(ls[ls.length - 1]) + LW) / 2;
  const root4 = (cxs(inner4[0]) + cxs(inner4[1])) / 2;
  const flash4 = (i: number) => {
    let f = 0;
    for (const e of evs) if (e.leaf === i) f = Math.max(f, interpolate(t, [e.at + TRAVEL, e.at + TRAVEL + 0.15, e.at + TRAVEL + 0.9], [0, 1, 0], clamp));
    return f;
  };
  const v4Dots = evs.filter((e) => t >= e.at && t <= e.at + TRAVEL).map((e) => dot(Y4, root4, cxs(inner4[e.leaf < 4 ? 0 : 1]), slotX(e.leaf) + LW / 2, (t - e.at) / TRAVEL, KEY.v4, `d${e.at}`));
  const labels4 = evs.filter((e) => e.load && t >= e.at + TRAVEL && t <= e.at + TRAVEL + 1.3).map((e) => {
    const o = interpolate(t, [e.at + TRAVEL, e.at + TRAVEL + 0.2, e.at + TRAVEL + 1.0, e.at + TRAVEL + 1.3], [0, 1, 1, 0], clamp);
    return (
      <g key={`lb${e.at}`} opacity={o} fontFamily="Inter, sans-serif" fontWeight={800} fontSize={28}>
        <text x={slotX(e.leaf) + LW / 2} y={Y4 + 170 + 76} textAnchor="middle" fill={KEY.v4}>read</text>
        <text x={slotX(e.evict) + LW / 2} y={Y4 + 170 + 76} textAnchor="middle" fill="rgba(255,255,255,0.8)">evict</text>
      </g>
    );
  });
  const legendO = s(p.memAt);
  const v4Leaf = (i: number) => {
    const f = flash4(i);
    if (disk.has(i)) return {fill: 'rgba(255,255,255,0.04)', stroke: 'rgba(255,255,255,0.55)', dash: true};
    return {fill: f > 0 ? `rgba(255,122,26,${0.35 + 0.65 * f})` : 'rgba(255,255,255,0.85)', stroke: 'transparent'};
  };

  // ---- v7 section ----
  const Y7 = 530;
  const split = t >= p.splitAt;
  const g7 = interpolate(t, [p.splitAt, p.splitAt + 0.5], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const leaves7 = split ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5];
  const inner7 = split ? [[0, 1, 2], [3, 4, 5, 6]] : [[0, 1, 2], [3, 4, 5]];
  const root7 = (cxs(inner7[0]) + cxs(inner7[1])) / 2;
  const active = split ? 6 : 5;
  const ev7: number[] = [];
  for (let at = p.v7Start; at < p.durationSec - 0.8; at += p.v7Step) ev7.push(at);
  // Fill of the active leaf: before the split it fills up to full; after it the new leaf starts empty.
  const arrived = (from: number, to: number) => ev7.filter((a) => a + TRAVEL <= t && a >= from && a < to).length;
  const preSplit = ev7.filter((a) => a < p.splitAt - TRAVEL).length;
  const fill5 = split ? 1 : Math.min(1, 0.35 + 0.65 * (arrived(0, p.splitAt) / Math.max(1, preSplit)));
  const fill6 = split ? Math.min(0.9, 0.12 + 0.13 * arrived(p.splitAt - TRAVEL, 1e9)) : 0;
  const flash7 = Math.max(0, ...ev7.map((a) => interpolate(t, [a + TRAVEL, a + TRAVEL + 0.12, a + TRAVEL + 0.7], [0, 1, 0], clamp)));
  const v7Leaf = (i: number) => {
    if (i === active) return {fill: `rgba(255,210,63,${0.25 + 0.15 * flash7})`, stroke: KEY.v7};
    return {fill: 'rgba(255,255,255,0.22)', stroke: 'transparent'};
  };
  const fills = (
    <g>
      {[5, 6].filter((i) => leaves7.includes(i)).map((i) => {
        const f = i === 5 ? fill5 : fill6;
        return <rect key={`f${i}`} x={slotX(i) + 4} y={Y7 + 170 + 4} width={(LW - 8) * f} height={32} rx={5} fill={i === active ? KEY.v7 : 'rgba(255,255,255,0.0)'} opacity={i === 5 && split ? 0 : 1} />;
      })}
    </g>
  );
  const v7Dots = t >= p.v7Start ? ev7.filter((a) => t >= a && t <= a + TRAVEL).map((a) => {
    const tgt = a + TRAVEL > p.splitAt ? 6 : 5;
    const inn = inner7[1];
    return dot(Y7, root7, cxs(inn), slotX(tgt) + LW / 2, (t - a) / TRAVEL, KEY.v7, `v${a}`);
  }) : [];
  const tg = s(p.tagAt, {damping: 10, stiffness: 260, mass: 0.5});
  const v7o = s(p.v7At);

  return (
    <Panel>
      <svg width={W} height={800} style={{overflow: 'visible'}}>
        <g opacity={s(p.v4At) * v4Dim}>
          <text x={0} y={44} fill={KEY.v4} fontSize={42} fontWeight={800} fontFamily="Inter, sans-serif">{p.v4Title}</text>
          {tree(Y4, [0, 1, 2, 3, 4, 5, 6, 7], inner4, v4Leaf, null)}
          {v4Dots}
          {labels4}
          <g opacity={legendO} fontFamily="Inter, sans-serif" fontSize={28} fontWeight={600}>
            <rect x={120} y={Y4 + 272} width={34} height={26} rx={5} fill="rgba(255,255,255,0.85)" />
            <text x={164} y={Y4 + 294} fill="#fff">in memory</text>
            <rect x={360} y={Y4 + 272} width={34} height={26} rx={5} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={3} strokeDasharray="7 6" />
            <text x={404} y={Y4 + 294} fill="#fff">on disk</text>
          </g>
        </g>
        <line x1={0} x2={W} y1={422} y2={422} stroke="rgba(255,255,255,0.18)" strokeWidth={2} opacity={v7o} />
        <g opacity={v7o}>
          <text x={0} y={Y7 - 40} fill={KEY.v7} fontSize={42} fontWeight={800} fontFamily="Inter, sans-serif">{p.v7Title}</text>
          {tree(Y7, leaves7, inner7, v7Leaf, fills, (i) => (i === 6 ? g7 : 1))}
          {v7Dots}
        </g>
        <g opacity={tg} transform={`translate(${W - 4},${Y7 + 254}) scale(${0.6 + 0.4 * tg}) rotate(-3)`}>
          <rect x={-250} y={-40} width={250} height={58} rx={10} fill={ACCENT} />
          <text x={-125} y={2} textAnchor="middle" fill="#111" fontSize={36} fontWeight={900} fontFamily="Inter, sans-serif">{p.tag}</text>
        </g>
      </svg>
    </Panel>
  );
};
