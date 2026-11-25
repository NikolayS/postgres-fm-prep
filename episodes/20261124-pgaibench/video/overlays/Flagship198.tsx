import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';
import {PANEL198, BAND198} from './Ep198';
import TPS from './l9-tps.json';

// Episode 198 cards by illus-2 (2026-11-24, second pass after "illustrations are weak").
// Every number is from https://postgres.ai/blog/20261123-pgaibench (task L9 and L5 bullets,
// Figure 4, matched-prompt table). The primary TPS line is Figure 4 panel A's own 1 Hz trace
// (l9-tps.json, read from the figure SVG); all scales are linear. Center panel x 40-1600,
// y 220-890 (hosts in the right column); band x 120-1600, y 744-888; nothing below y 890.
// Text that matters is 30 px or more; hero numbers 120 px or more (band: as tall as the band).

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const MONO = 'JetBrains Mono, Menlo, monospace';
export const GREEN = '#22c55e';
export const GREEN_D = 'rgba(34,197,94,0.14)';
export const RED = '#ef4444';
export const RED_D = 'rgba(239,68,68,0.16)';
export const AMBER = '#f59e0b';
export const DIM = 'rgba(255,255,255,0.7)';
export const CARD = 'rgba(255,255,255,0.05)';
export const BG = 'rgba(22,22,26,0.97)';

export type At = {at: number};
export const ease = (t: number, a: number, d = 0.5) => interpolate(t, [a, a + d], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
export const pop = (frame: number, fps: number, at: number) => (frame < at * fps ? 0 : spring({frame: frame - at * fps, fps, config: {damping: 11, stiffness: 190, mass: 0.6}}));
export const fmt = (x: number, d = 0) => x.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});

export const Shell: React.FC<{children: React.ReactNode; shake?: number}> = ({children, shake = 0}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const k = spring({frame, fps, config: {damping: 16, stiffness: 160, mass: 0.7}});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const dx = shake * Math.sin(frame * 2.3) * 9, dy = shake * Math.cos(frame * 3.1) * 5;
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut, color: '#fff'}}>
      <div style={{position: 'absolute', left: PANEL198.x, top: PANEL198.y, width: PANEL198.w, height: PANEL198.h, background: BG, borderRadius: 18, opacity: k, transform: `translate(${dx}px, ${dy}px) scale(${0.97 + 0.03 * k})`, overflow: 'hidden'}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Band strip under the name labels: wipes in from the left, fades out.
export const BandShell: React.FC<{children: React.ReactNode; w?: number}> = ({children, w = BAND198.w}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const k = interpolate(frame, [0, 0.35 * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut, color: '#fff'}}>
      <div style={{position: 'absolute', left: BAND198.x, top: BAND198.y, width: w, height: BAND198.h, background: BG, borderRadius: 14, clipPath: `inset(0 ${(1 - k) * 100}% 0 0 round 14px)`, overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 28px', boxSizing: 'border-box', gap: 28}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const Chip: React.FC<{text: string; color: string; bg: string; size?: number; style?: React.CSSProperties}> = ({text, color, bg, size = 30, style}) => (
  <span style={{display: 'inline-block', padding: '4px 16px', borderRadius: 999, background: bg, color, fontSize: size, fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap', ...style}}>{text}</span>
);

export const Stamp: React.FC<{text: string; color: string; k: number; size: number; rot?: number; style?: React.CSSProperties}> = ({text, color, k, size, rot = -6, style}) => (
  <div style={{position: 'absolute', border: `6px solid ${color}`, color, borderRadius: 14, padding: '2px 22px', fontSize: size, fontWeight: 800, letterSpacing: 2, whiteSpace: 'nowrap', background: 'rgba(22,22,26,0.9)', opacity: Math.min(1, k * 1.5), transform: `rotate(${rot}deg) scale(${interpolate(k, [0, 1], [2.4, 1])})`, transformOrigin: 'center', ...style}}>{text}</div>
);

// Small source tag at the panel bottom (pgaibench.dev on PGAIBench visuals).
export const SourceLine: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center', fontFamily: MONO, fontSize: 26, color: 'rgba(255,255,255,0.55)'}}>{text}</div>
);

// ---------------------------------------------------------------- L9 split screen (row 7, beat 2)
// Starts on Kirk's "you turn around" and runs through "nothing's finishing".
export type L9Props = {durationSec: number; beats: {noone: At; drop: At; crash: At; x18: At}};

const TPSChart: React.FC<{t: number; dropAt: number; w: number; h: number}> = ({t, dropAt, w, h}) => {
  const {x0, x1} = TPS.xAxis;
  const sx = (svgX: number) => ((svgX - x0) / (x1 - x0)) * w;
  const MAX = 6000; // linear, same axis as Figure 4
  const sy = (v: number) => h - (v / MAX) * h;
  const base = TPS.baseline.map((v: number, i: number) => [sx(x0 + (i * (137.5 - x0)) / (TPS.baseline.length - 1)), sy(v)]);
  const chg = TPS.change.map((v: number, i: number) => [sx(153.5 + (i * (x1 - 153.5)) / (TPS.change.length - 1)), sy(v)]);
  const reveal = interpolate(t, [0.3, 2.2], [0, w], {...clamp, easing: Easing.inOut(Easing.quad)});
  const pts = (a: number[][]) => a.filter(([x]) => x <= reveal).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} style={{overflow: 'visible'}}>
      {[0, 3000, 6000].map((v) => <line key={v} x1={0} x2={w} y1={sy(v)} y2={sy(v)} stroke="rgba(255,255,255,0.14)" />)}
      <polyline points={pts(base)} fill="none" stroke="#60a5fa" strokeWidth={4} />
      <polyline points={pts(chg)} fill="none" stroke={GREEN} strokeWidth={4} />
      {TPS.dropX.map((x: number, i: number) => {
        const g = ease(t, dropAt + i * 0.25, 0.35);
        return <line key={i} x1={sx(x)} x2={sx(x)} y1={0} y2={h * g} stroke={RED} strokeWidth={4} strokeDasharray="10 7" opacity={g} />;
      })}
    </svg>
  );
};

const Tile: React.FC<{label: string; value: string; k: number}> = ({label, value, k}) => (
  <div style={{flex: 1, background: GREEN_D, borderRadius: 12, padding: '8px 14px', opacity: Math.min(1, k), transform: `scale(${0.6 + 0.4 * k})`}}>
    <div style={{fontSize: 30, color: DIM, fontWeight: 600, whiteSpace: 'nowrap'}}>{label}</div>
    <div style={{fontSize: 56, fontWeight: 800, color: GREEN, whiteSpace: 'nowrap', lineHeight: 1.1}}>{value}</div>
  </div>
);

export const L9Split198: React.FC<L9Props> = ({beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const {noone, drop, crash, x18} = beats;
  const tpsK = ease(t, drop.at + 0.5, 1.2);
  const bubbleK = pop(frame, fps, noone.at);
  // standby: q20 client p99, 2.91 -> 52.58 ms, linear 0-55 ms
  const climb = interpolate(t, [crash.at, crash.at + 1.6], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const p99 = 2.91 + (52.58 - 2.91) * climb;
  const hot = climb > 0.15;
  const x18K = pop(frame, fps, x18.at);
  const shake = t >= x18.at ? interpolate(t, [x18.at, x18.at + 0.5], [1, 0], clamp) : 0;
  const W = 740, BAR = 680;
  return (
    <Shell shake={shake}>
      {/* PRIMARY */}
      <div style={{position: 'absolute', left: 20, top: 20, width: W, height: 588, background: CARD, borderRadius: 16, border: `4px solid ${GREEN}`, boxSizing: 'border-box', padding: '16px 24px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{fontSize: 48, fontWeight: 800, letterSpacing: 1}}>PRIMARY</div>
          <Chip text="ALL GREEN ✓" color="#0b1f12" bg={GREEN} size={32} />
        </div>
        <div style={{position: 'absolute', left: 24, top: 92}}>
          <TPSChart t={t} dropAt={drop.at} w={W - 56} h={120} />
        </div>
        <div style={{position: 'absolute', left: 24, right: 24, top: 232, display: 'flex', gap: 12}}>
          <Tile label="TPS" value={t < drop.at + 0.5 ? '2,625' : tpsK < 1 ? fmt(Math.round(2625 + 415 * tpsK)) : '+16%'} k={ease(t, 0.5, 0.4)} />
          <Tile label="errors" value="0" k={ease(t, 0.8, 0.4)} />
          <Tile label="pooled p99" value="1.19×" k={pop(frame, fps, drop.at + 1.0)} />
        </div>
        <div style={{position: 'absolute', left: 24, top: 382}}>
          {['(k)', '(k)', '(v)'].map((c, i) => {
            const s = ease(t, drop.at + i * 0.25, 0.3);
            return (
              <div key={i} style={{position: 'relative', display: 'flex', gap: 20, fontFamily: MONO, fontSize: 36, lineHeight: 1.3, opacity: 1 - 0.5 * s}}>
                <span style={{width: 92}}>{c}</span><span style={{color: AMBER}}>idx_scan = 0</span>
                <div style={{position: 'absolute', left: -6, top: '50%', height: 6, width: 420 * s, background: RED, borderRadius: 3}} />
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', right: 14, top: 380, width: 300, padding: '10px 16px', background: '#f8fafc', color: '#111', borderRadius: 14, fontSize: 32, fontWeight: 700, lineHeight: 1.15, opacity: Math.min(1, bubbleK), transform: `scale(${bubbleK}) rotate(2deg)`, transformOrigin: 'left center'}}>
          <div style={{fontFamily: MONO, fontSize: 26, color: '#555', fontWeight: 500}}>grok-4.7</div>
          idx_scan = 0 → drop all three
        </div>
      </div>
      {/* STANDBY */}
      <div style={{position: 'absolute', left: 20 + W + 20, top: 20, width: 1560 - W - 60, height: 588, background: hot ? RED_D : CARD, borderRadius: 16, border: `4px solid ${hot ? RED : 'rgba(255,255,255,0.3)'}`, boxSizing: 'border-box', padding: '16px 24px'}}>
        <div style={{fontSize: 48, fontWeight: 800, letterSpacing: 1}}>ASYNC STANDBY</div>
        <div style={{marginTop: 14, fontSize: 34, color: DIM}}>query <span style={{fontFamily: MONO, color: '#fff'}}>q20</span> p99</div>
        <div style={{fontSize: 150, fontWeight: 800, lineHeight: 1.0, color: hot ? RED : GREEN, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{fmt(p99, 2)}<span style={{fontSize: 64}}> ms</span></div>
        <div style={{position: 'relative', marginTop: 20, width: BAR, height: 44, background: 'rgba(255,255,255,0.1)', borderRadius: 8}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: (p99 / 55) * BAR, background: hot ? RED : GREEN, borderRadius: 8}} />
        </div>
        <div style={{position: 'relative', width: BAR, height: 40, fontFamily: MONO, fontSize: 28, color: DIM}}>
          {[0, 25, 50].map((v) => <span key={v} style={{position: 'absolute', left: (v / 55) * BAR, transform: v ? 'translateX(-50%)' : undefined, top: 4, whiteSpace: 'nowrap'}}>{v}{v === 50 ? ' ms' : ''}</span>)}
        </div>
        <div style={{marginTop: 10, fontSize: 32, color: DIM, opacity: ease(t, x18.at + 1.0, 0.5)}}><span style={{fontFamily: MONO}}>pg_stat_statements</span> mean <b style={{color: RED}}>188×</b></div>
        <Stamp text="18.0× slower" color={RED} k={x18K} size={88} style={{left: 40, top: 452}} />
      </div>
      <SourceLine text="pgaibench.dev · task L9 · live Postgres 18.7" />
    </Shell>
  );
};

// ---------------------------------------------------------------- L5 lock queue (row 31) + Haiku (row 32)
export type L5Props = {durationSec: number; beats: {green: At; go: At; haiku: At}};

const QUERIES = ['UPDATE …', 'SELECT …', 'UPDATE …', 'SELECT …', 'UPDATE …', 'SELECT …', 'UPDATE …'];

const Lock: React.FC<{open: number; color: string; size?: number}> = ({open, color, size = 1}) => (
  <svg width={46 * size} height={56 * size} viewBox="0 0 46 56">
    <path d={`M11 26 V16 a12 12 0 0 1 24 0 V${26 - open * 10}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" transform={`translate(${open * 10} 0)`} />
    <rect x={3} y={25} width={40} height={29} rx={6} fill={color} />
  </svg>
);

export const Dots: React.FC<{marks: ('ok' | 'halt')[]; k: number; size?: number}> = ({marks, k, size = 44}) => (
  <div style={{display: 'flex', gap: 10}}>
    {marks.map((m, i) => {
      const g = Math.max(0, Math.min(1, k * marks.length - i));
      return <div key={i} style={{width: size, height: size, borderRadius: size / 2, background: m === 'ok' ? GREEN : RED, opacity: g, transform: `scale(${g})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.6, fontWeight: 800, color: '#111'}}>{m === 'ok' ? '✓' : '✕'}</div>;
    })}
  </div>
);

const L5Main: React.FC<{t: number; frame: number; fps: number; green: number; go: number}> = ({t, frame, fps, green, go}) => {
  const sql = 'ALTER TABLE pgbench_accounts\n  ALTER COLUMN bid SET NOT NULL;';
  const typed = Math.floor(interpolate(t, [0.3, 1.1], [0, sql.length], clamp));
  const lockK = pop(frame, fps, 1.15);
  const passed = t >= green;
  const drain = ease(t, green + 0.1, 0.8);
  const passK = pop(frame, fps, green + 0.5);
  const goK = pop(frame, fps, go);
  // wait counter climbs to the post's 0.75 s peak sampled wait, then the lock releases
  const wait = interpolate(t, [1.3, green - 0.2], [0, 0.75], clamp);
  const LW = 930;
  return (
    <>
      <div style={{position: 'absolute', left: 20, top: 20, width: LW, height: 588, background: CARD, borderRadius: 16, border: `4px solid ${passed ? GREEN : 'rgba(255,255,255,0.3)'}`, boxSizing: 'border-box', padding: '14px 24px', overflow: 'hidden'}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
          <div style={{fontSize: 44, fontWeight: 800, letterSpacing: 1}}>CLONE TEST</div>
          <div style={{fontSize: 30, color: DIM}}>10M rows · 1.46 GiB</div>
        </div>
        <pre style={{margin: '8px 0 0', fontFamily: MONO, fontSize: 36, lineHeight: 1.25, color: '#fff', minHeight: 90}}>{sql.slice(0, typed)}</pre>
        <div style={{marginTop: 6, display: 'flex', alignItems: 'center', gap: 14, opacity: Math.min(1, lockK), transform: `scale(${0.5 + 0.5 * lockK})`, transformOrigin: 'left center'}}>
          <Lock open={drain} color={passed ? GREEN : AMBER} />
          <span style={{fontFamily: MONO, fontSize: 34, fontWeight: 600, color: passed ? GREEN : AMBER}}>AccessExclusiveLock</span>
        </div>
        {/* queue of blocked sessions */}
        <div style={{position: 'absolute', left: 24, top: 270, width: 600, height: 330}}>
          {QUERIES.map((q, i) => {
            const at = 1.4 + i * ((green - 1.9) / QUERIES.length);
            const k = frame < at * fps ? 0 : spring({frame: frame - at * fps, fps, config: {damping: 9, stiffness: 220, mass: 0.5}});
            const out = Math.max(0, Math.min(1, drain * 1.6 - (QUERIES.length - 1 - i) * 0.1));
            const wob = passed ? 0 : Math.sin(frame * 0.9 + i) * 2;
            return (
              <div key={i} style={{position: 'absolute', left: (i % 2) * 40 + out * 700, top: 284 - (i + 1) * 46 + (1 - k) * -60 + wob, opacity: Math.min(1, k) * Math.max(0, 1 - out * 2.5), whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 34, background: 'rgba(245,158,11,0.16)', border: `3px solid ${AMBER}`, borderRadius: 10, padding: '0 16px', lineHeight: '40px'}}>
                {q}
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', right: 24, top: 270, textAlign: 'right', opacity: Math.min(1, lockK) * (1 - ease(t, green, 0.3))}}>
          <div style={{fontSize: 32, color: DIM}}>queued, waiting</div>
          <div style={{fontSize: 120, fontWeight: 800, color: AMBER, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{wait.toFixed(2)} s</div>
          <div style={{fontSize: 30, color: DIM}}>peak sampled wait</div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 268, textAlign: 'center', opacity: Math.min(1, passK), transform: `scale(${interpolate(passK, [0, 1], [0.4, 1])})`}}>
          <Chip text="CLONE TEST PASSED" color="#0b1f12" bg={GREEN} size={36} />
          <div style={{fontSize: 170, fontWeight: 800, color: GREEN, lineHeight: 1.0, marginTop: 4}}>1.02 s</div>
          <div style={{fontSize: 30, color: DIM, marginTop: 2}}>after 2 timeouts</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 20 + LW + 20, top: 20, width: 1560 - LW - 60, height: 588, background: CARD, borderRadius: 16, border: `4px solid ${t >= go ? GREEN : 'rgba(255,255,255,0.3)'}`, boxSizing: 'border-box', padding: '14px 24px'}}>
        <div style={{fontSize: 44, fontWeight: 800, letterSpacing: 1}}>AUDITOR</div>
        <div style={{fontFamily: MONO, fontSize: 30, color: DIM}}>z-ai/glm-5.3 · k=5</div>
        <div style={{marginTop: 18, opacity: ease(t, 0.8, 0.6)}}>
          <div style={{fontSize: 32, color: DIM}}>SQL text only</div>
          <div style={{fontSize: 80, fontWeight: 800, color: RED, lineHeight: 1.05}}>HALT 5/5</div>
        </div>
        <div style={{marginTop: 22, fontSize: 32, color: DIM, opacity: ease(t, green + 1.0, 0.4)}}>+ green clone test</div>
        <div style={{position: 'relative', height: 120}}>
          <Stamp text="APPROVE" color={GREEN} k={goK} size={80} rot={-5} style={{left: 0, top: 10}} />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: Math.min(1, goK)}}>
          <Dots marks={['ok', 'ok', 'ok', 'ok', 'halt']} k={ease(t, go + 0.3, 0.8)} size={40} />
          <span style={{fontSize: 64, fontWeight: 800, color: GREEN}}>4 of 5</span>
        </div>
      </div>
    </>
  );
};

const L5Haiku: React.FC<{t: number; at: number}> = ({t, at}) => {
  const g = ease(t, at + 0.6, 1.0);
  const v = 18.5 + (13.0 - 18.5) * g;
  const BAR = 1300;
  return (
    <div style={{position: 'absolute', left: 60, top: 40, right: 60}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 20}}>
        <div style={{fontSize: 56, fontWeight: 800}}>Too careful</div>
        <div style={{fontFamily: MONO, fontSize: 36, color: DIM}}>Auditor claude-haiku-5.5 · matched prompt, k=3</div>
      </div>
      <div style={{marginTop: 18, fontSize: 36, color: DIM}}>safe changes approved, with clone telemetry</div>
      <div style={{fontSize: 190, fontWeight: 800, color: AMBER, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums'}}>{v.toFixed(1)}%</div>
      {[{l: 'SQL text only', v: 18.5, c: 'rgba(255,255,255,0.45)'}, {l: '+ clone telemetry', v, c: AMBER}].map((b, i) => (
        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 14}}>
          <div style={{width: 300, fontSize: 32, color: DIM}}>{b.l}</div>
          <div style={{position: 'relative', width: BAR - 320, height: 44, background: 'rgba(255,255,255,0.08)', borderRadius: 8}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: (b.v / 100) * (BAR - 320), background: b.c, borderRadius: 8}} />
            <span style={{position: 'absolute', left: (b.v / 100) * (BAR - 320) + 14, top: 2, fontSize: 32, fontWeight: 700}}>{b.v.toFixed(1)}%</span>
          </div>
        </div>
      ))}
      <div style={{marginTop: 6, marginLeft: 320, display: 'flex', justifyContent: 'space-between', width: BAR - 320, fontFamily: MONO, fontSize: 26, color: DIM}}><span>0</span><span>50%</span><span>100%</span></div>
    </div>
  );
};

export const L5Queue198: React.FC<L5Props> = ({beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const {green, go, haiku} = beats;
  const swap = interpolate(t, [haiku.at, haiku.at + 0.45], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <Shell>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - swap, transform: `translateX(${-swap * 120}px)`}}>
        <L5Main t={t} frame={frame} fps={fps} green={green.at} go={go.at} />
      </div>
      {swap > 0 ? <div style={{position: 'absolute', inset: 0, opacity: swap, transform: `translateX(${(1 - swap) * 120}px)`}}><L5Haiku t={t} at={haiku.at} /></div> : null}
      <SourceLine text={t < haiku.at ? 'pgaibench.dev · task L5 · live Postgres 18.7' : 'pgaibench.dev · Track 2 matched-prompt table'} />
    </Shell>
  );
};
