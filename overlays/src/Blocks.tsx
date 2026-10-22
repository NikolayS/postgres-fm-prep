import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';
import {CENTER} from './CenterChart';

// Long-hold blocks for the "center" placement (Nik, 2026-10-22): the talk never
// stops, the hosts sit at the edges, the block stays while the topic is discussed.
// Big numbers, few words. Every reveal time is in seconds from the block start and
// is set from word times in scripts/render-all.ts.

const ACCENT = '#FFD23F';
const WARN = '#FF7A1A';
const DIM = 'rgba(255,255,255,0.62)';
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const useT = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const s = (at: number, cfg = {damping: 14, stiffness: 200, mass: 0.6}) => spring({frame: frame - at * fps, fps, config: cfg});
  const grow = (at: number, d = 0.9) => interpolate(frame, [at * fps, (at + d) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const fadeOut = interpolate(frame, [durationInFrames - 0.4 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return {frame, fps, s, grow, fadeOut};
};

const Panel: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {s, fadeOut} = useT();
  const panel = s(0, {damping: 16, stiffness: 160, mass: 0.7});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: CENTER.x, top: CENTER.y, width: CENTER.w, height: CENTER.h, background: 'rgba(8,8,10,0.88)', borderRadius: 18, padding: '30px 30px 26px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: panel, transform: `scale(${0.96 + 0.04 * panel})`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: '#fff'}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{text: string; o: number}> = ({text, o}) => (
  <div style={{alignSelf: 'flex-start', fontFamily: 'JetBrains Mono, Menlo, monospace', fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.8)', background: '#222', borderRadius: 8, padding: '6px 16px', opacity: o}}>{text}</div>
);

// ---------- Guest bio ----------
export type BioProps = {name: string; role: string; facts: string[]; factAt: number; factStep: number; chip?: string; durationSec: number};
export const BioBlock: React.FC<BioProps> = (p) => {
  const {s} = useT();
  return (
    <Panel>
      <div style={{flex: 1}} />
      <div style={{fontSize: 30, fontWeight: 600, color: DIM, opacity: s(0.2)}}>Guest</div>
      <div style={{fontSize: 84, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, marginTop: 6, opacity: s(0.3), transform: `translateX(${(1 - s(0.3)) * -30}px)`}}>{p.name}</div>
      <div style={{alignSelf: 'flex-start', marginTop: 18, fontSize: 36, fontWeight: 700, color: '#111', background: ACCENT, borderRadius: 8, padding: '8px 20px', opacity: s(0.7), transform: `scale(${0.85 + 0.15 * s(0.7)})`, transformOrigin: 'left center'}}>{p.role}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 26, marginTop: 56}}>
        {p.facts.map((f, i) => {
          const k = s(p.factAt + i * p.factStep);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'baseline', gap: 18, opacity: k, transform: `translateY(${(1 - k) * 16}px)`}}>
              <div style={{width: 14, height: 14, borderRadius: 3, background: ACCENT, flex: 'none', transform: 'translateY(-6px)'}} />
              <div style={{fontSize: 40, fontWeight: 600, lineHeight: 1.2}}>{f}</div>
            </div>
          );
        })}
      </div>
      <div style={{flex: 1}} />
      {p.chip ? <Chip text={p.chip} o={s(p.factAt + p.facts.length * p.factStep)} /> : null}
    </Panel>
  );
};

// ---------- Hacking Postgres sessions ----------
export type HackProps = {title: string; sub: string; shipped: {cover: string; what: string; note: string; release: string}[]; shipAt: number; shipStep: number; chip: string; durationSec: number};
export const HackBlock: React.FC<HackProps> = (p) => {
  const {s} = useT();
  return (
    <Panel>
      <div style={{fontSize: 30, fontWeight: 700, color: ACCENT, opacity: s(0.2)}}>Postgres.TV</div>
      <div style={{fontSize: 64, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05, marginTop: 4, opacity: s(0.3)}}>{p.title}</div>
      <div style={{fontSize: 32, fontWeight: 500, color: DIM, marginTop: 10, lineHeight: 1.25, opacity: s(0.6)}}>{p.sub}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 30, marginTop: 40}}>
        {p.shipped.map((sh, i) => {
          const at = p.shipAt + i * p.shipStep;
          const land = s(at, {damping: 14, stiffness: 180, mass: 0.6});
          const rel = s(at + 0.6, {damping: 10, stiffness: 300, mass: 0.5});
          return (
            <div key={i} style={{display: 'flex', gap: 24, alignItems: 'center', opacity: land, transform: `translateY(${(1 - land) * 30}px)`}}>
              <div style={{width: 240, height: 135, borderRadius: 10, overflow: 'hidden', flex: 'none', border: '3px solid rgba(255,255,255,0.15)'}}>
                <Img src={staticFile(sh.cover)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                <div style={{fontSize: 31, fontWeight: 700, fontFamily: 'JetBrains Mono, Menlo, monospace', lineHeight: 1.15, whiteSpace: 'nowrap'}}>{sh.what}</div>
                <div style={{fontSize: 28, fontWeight: 500, color: DIM, lineHeight: 1.2}}>{sh.note}</div>
                <div style={{alignSelf: 'flex-start', fontSize: 34, fontWeight: 800, color: '#111', background: ACCENT, borderRadius: 8, padding: '6px 18px', opacity: rel, transform: `scale(${0.8 + 0.2 * rel})`, transformOrigin: 'left center'}}>{sh.release}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{flex: 1}} />
      <Chip text={p.chip} o={s(p.shipAt + p.shipped.length * p.shipStep + 0.4)} />
    </Panel>
  );
};

// ---------- Two queries x three arms ----------
// Columns = maintenance after restore, rows = queries; each row has its own scale,
// so the ~100x drop shows as a tall bar next to a sliver.
type Cell = {v: number; ms: string};
export type CompareProps = {cols: string[]; rows: {label: string; needs?: string; cells: Cell[]; drop: {col: 1 | 2; at: number; text: string}}[]; rowAt: number[]; colStep: number; foot: string; durationSec: number};
export const CompareBlock: React.FC<CompareProps> = (p) => {
  const {s, grow} = useT();
  const COLW = 200, BARW = 120, H = p.rows.length > 1 ? 120 : 300;
  return (
    <Panel>
      <div style={{display: 'flex', justifyContent: 'space-between', opacity: s(0.2)}}>
        {p.cols.map((c, i) => (
          <div key={i} style={{width: COLW, textAlign: 'center', fontSize: 28, fontWeight: 700, lineHeight: 1.15, color: i === 0 ? DIM : '#fff'}}>{c}</div>
        ))}
      </div>
      {p.rows.map((r, ri) => {
        const max = Math.max(...r.cells.map((c) => c.v));
        const at0 = p.rowAt[ri];
        return (
          <div key={ri} style={{marginTop: ri === 0 ? 22 : 30, opacity: s(at0)}}>
            <div style={{fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1.15}}>{r.label}</div>
            {r.needs ? <div style={{fontSize: 28, fontWeight: 600, color: ACCENT, lineHeight: 1.2, marginTop: 2}}>{r.needs}</div> : null}
            <div style={{position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: H + 66, marginTop: 4}}>
              {r.cells.map((c, ci) => {
                const at = at0 + 0.3 + ci * p.colStep;
                const g = grow(at);
                const h = Math.max(6, (c.v / max) * H) * g;
                const good = c.v < max / 10;
                return (
                  <div key={ci} style={{width: COLW, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: s(at)}}>
                    <div style={{fontSize: 46, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: good ? ACCENT : '#fff', marginBottom: 8}}>{fmt(c.v * g)}</div>
                    <div style={{width: BARW, height: h, background: good ? ACCENT : 'rgba(255,255,255,0.9)', borderRadius: '6px 6px 0 0'}} />
                  </div>
                );
              })}
              {(() => {
                const k = s(at0 + r.drop.at, {damping: 10, stiffness: 260, mass: 0.5});
                return <div style={{position: 'absolute', top: 56, left: r.drop.col === 1 ? 150 : 365, fontSize: 40, fontWeight: 900, color: '#111', background: ACCENT, borderRadius: 10, padding: '2px 14px', opacity: k, transform: `scale(${0.6 + 0.4 * k}) rotate(-4deg)`}}>{r.drop.text}</div>;
              })()}
            </div>
            <div style={{height: 3, background: 'rgba(255,255,255,0.3)'}} />
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8}}>
              {r.cells.map((c, ci) => (
                <div key={ci} style={{width: COLW, textAlign: 'center', fontSize: 28, fontWeight: 600, color: DIM, opacity: s(at0 + 0.3 + ci * p.colStep + 0.6)}}>{c.ms}</div>
              ))}
            </div>
          </div>
        );
      })}
      <div style={{flex: 1}} />
      <div style={{fontSize: 26, fontWeight: 500, color: DIM, opacity: s(p.rowAt[1] + 2)}}>{p.foot}</div>
    </Panel>
  );
};

// ---------- Imported relallvisible trap ----------
export type TrapProps = {
  planner: {label: string; value: number}; // what pg_class says
  vm: {label: string; value: number}; // what the visibility map holds
  vmAt: number;
  scanTitle: string;
  scanAt: number;
  rowsAt: number;
  cols: [string, string];
  rows: {label: string; a: string; b: string; bar?: [number, number]}[];
  foot: string;
  durationSec: number;
};
export const TrapBlock: React.FC<TrapProps> = (p) => {
  const {s, grow} = useT();
  const meter = (label: string, value: number, full: number, at: number, color: string) => {
    const g = grow(at, 1.0);
    return (
      <div style={{opacity: s(at)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{fontSize: 32, fontWeight: 600}}>{label}</div>
          <div style={{fontSize: 64, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{fmt(value * g)}</div>
        </div>
        <div style={{height: 20, background: 'rgba(255,255,255,0.12)', borderRadius: 6, marginTop: 10}}>
          <div style={{width: `${(value / full) * 100 * g}%`, height: '100%', background: color, borderRadius: 6}} />
        </div>
      </div>
    );
  };
  const full = Math.max(p.planner.value, 1);
  return (
    <Panel>
      <div style={{fontSize: 30, fontWeight: 600, color: DIM, opacity: s(0.2)}}>all-visible pages after restore</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 26, marginTop: 18}}>
        {meter(p.planner.label, p.planner.value, full, 0.4, ACCENT)}
        {meter(p.vm.label, p.vm.value, full, p.vmAt, WARN)}
      </div>
      <div style={{height: 2, background: 'rgba(255,255,255,0.2)', margin: '34px 0 22px', opacity: s(p.scanAt)}} />
      <div style={{opacity: s(p.scanAt)}}>
        <div style={{fontSize: 38, fontWeight: 800}}>{p.scanTitle}</div>
        <div style={{display: 'flex', marginTop: 14}}>
          <div style={{flex: 1}} />
          {p.cols.map((c, i) => (
            <div key={i} style={{width: 228, textAlign: 'center', fontSize: 28, fontWeight: 700, color: i === 0 ? WARN : ACCENT, lineHeight: 1.15}}>{c}</div>
          ))}
        </div>
        {p.rows.map((r, i) => {
          const at = p.rowsAt + i * 1.2;
          const k = s(at, {damping: 11, stiffness: 240, mass: 0.5});
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', marginTop: 18, opacity: k}}>
              <div style={{flex: 1, fontSize: 30, fontWeight: 600, color: DIM, whiteSpace: 'nowrap'}}>{r.label}</div>
              <div style={{width: 228, textAlign: 'center', fontSize: 52, fontWeight: 800, color: WARN, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transform: `scale(${0.7 + 0.3 * k})`}}>{r.a}</div>
              <div style={{width: 228, textAlign: 'center', fontSize: 52, fontWeight: 800, color: ACCENT, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transform: `scale(${0.7 + 0.3 * k})`}}>{r.b}</div>
            </div>
          );
        })}
      </div>
      <div style={{flex: 1}} />
      <div style={{fontSize: 26, fontWeight: 500, color: DIM, opacity: s(p.rowsAt + 2)}}>{p.foot}</div>
    </Panel>
  );
};

// ---------- Before/after pair (first read vs second read, etc.) ----------
// Optional meter (e.g. visibility map 0 -> N of M pages), then a two-column table;
// the first row is the big metric, later rows are small (time).
export type DuelProps = {
  kicker: string;
  title: string;
  meter?: {label: string; value: number; of: number; at: number};
  cols: [string, string];
  rows: {label: string; a: string; b: string}[];
  rowsAt: number[];
  foot: string;
  durationSec: number;
};
export const DuelBlock: React.FC<DuelProps> = (p) => {
  const {s, grow} = useT();
  const m = p.meter;
  const g = m ? grow(m.at, 1.2) : 0;
  return (
    <Panel>
      <div style={{fontSize: 30, fontWeight: 700, color: ACCENT, opacity: s(0.2)}}>{p.kicker}</div>
      <div style={{fontSize: 52, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginTop: 6, opacity: s(0.3)}}>{p.title}</div>
      {m ? (
        <div style={{marginTop: 34, opacity: s(m.at)}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
            <div style={{fontSize: 32, fontWeight: 600}}>{m.label}</div>
            <div style={{fontSize: 64, fontWeight: 800, color: ACCENT, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{fmt(m.value * g)}</div>
          </div>
          <div style={{height: 20, background: 'rgba(255,255,255,0.12)', borderRadius: 6, marginTop: 10}}>
            <div style={{width: `${(m.value / m.of) * 100 * g}%`, height: '100%', background: ACCENT, borderRadius: 6}} />
          </div>
          <div style={{fontSize: 26, color: DIM, marginTop: 8, textAlign: 'right'}}>of {fmt(m.of)} pages</div>
        </div>
      ) : null}
      <div style={{flex: 1}} />
      <div style={{opacity: s(p.rowsAt[0])}}>
        <div style={{display: 'flex'}}>
          <div style={{flex: 1}} />
          {p.cols.map((c, i) => (
            <div key={i} style={{width: 215, textAlign: 'center', fontSize: 30, fontWeight: 700, color: i === 0 ? WARN : ACCENT}}>{c}</div>
          ))}
        </div>
        {p.rows.map((r, i) => {
          const k = s(p.rowsAt[i] ?? p.rowsAt[0], {damping: 11, stiffness: 240, mass: 0.5});
          const big = i === 0;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', marginTop: big ? 16 : 10, opacity: k}}>
              <div style={{flex: 1, fontSize: 28, fontWeight: 600, color: DIM, whiteSpace: 'nowrap', overflow: 'hidden'}}>{r.label}</div>
              {[r.a, r.b].map((v, j) => (
                <div key={j} style={{width: 215, textAlign: 'center', fontSize: big ? 48 : 38, fontWeight: 800, color: j === 0 ? WARN : ACCENT, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transform: `scale(${0.7 + 0.3 * k})`}}>{v}</div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{flex: 1}} />
      <div style={{fontSize: 26, fontWeight: 500, color: DIM, opacity: s(p.rowsAt[0] + 2)}}>{p.foot}</div>
    </Panel>
  );
};
