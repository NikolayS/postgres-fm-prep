import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

// Episode overlays, "Extensions on demand" (2026-11-04 recording). Center cards sit in the area
// left of the hosts' "center" column (21-layout-center.json: three faces 256 px wide at x 1640,
// robot under them). Every reveal time is seconds from the overlay start, mapped from SOURCE word
// times in scripts/ep195.ts. Colours are fixed on every card: fat image orange, extension image
// yellow, official/base image light blue.
export const C = {fat: '#FF7A1A', ext: '#FFD23F', base: '#7CC4FF', bad: '#FF5A4E', ok: '#7CE0A3'};
const DIM = 'rgba(255,255,255,0.62)';
const MONO = 'JetBrains Mono, Menlo, monospace';
export const PANEL = {x: 40, y: 100, w: 1570, h: 930};
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

const Panel: React.FC<{children: React.ReactNode; pad?: string}> = ({children, pad}) => {
  const {s, fadeOut} = useT();
  const panel = s(0, {damping: 16, stiffness: 160, mass: 0.7});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, background: 'rgba(8,8,10,0.9)', borderRadius: 18, padding: pad ?? '40px 48px 36px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: panel, transform: `scale(${0.97 + 0.03 * panel})`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: '#fff', overflow: 'hidden'}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Title: React.FC<{text: string; sub?: string; at?: number}> = ({text, sub, at = 0.2}) => {
  const {s} = useT();
  return (
    <div>
      <div style={{fontSize: 60, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, opacity: s(at)}}>{text}</div>
      {sub ? <div style={{fontSize: 34, fontWeight: 600, color: DIM, marginTop: 10, opacity: s(at + 0.1)}}>{sub}</div> : null}
    </div>
  );
};

// One horizontal bar row: label above, bar + direct value label. Linear scale, max -> W px.
type Row = {label: string; value?: number; text: string; color: string; at: number; alpha?: number; note?: string};
const Bars: React.FC<{rows: Row[]; max: number; W: number; gap?: number}> = ({rows, max, W, gap = 44}) => {
  const {s, grow} = useT();
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap}}>
      {rows.map((r, i) => {
        const g = grow(r.at, 1.0);
        return (
          <div key={i} style={{opacity: s(r.at)}}>
            <div style={{fontSize: 38, fontWeight: 700, color: '#fff'}}>{r.label}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 10, height: 64}}>
              {r.value !== undefined ? <div style={{width: Math.max(5, (r.value / max) * W * g), height: 60, background: r.color, opacity: r.alpha ?? 1, borderRadius: 8}} /> : null}
              <div style={{fontSize: 52, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: r.value === undefined ? r.color : '#fff', opacity: g}}>{r.text}</div>
              {r.note ? <div style={{fontSize: 30, fontWeight: 600, color: DIM, opacity: g}}>{r.note}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- 01: fat image vs extension image (size), then CVEs ----------
export type FatProps = {sizeAt: number[]; cveAt: number; cveRows: number[]; durationSec: number};
export const FatImage: React.FC<FatProps> = (p) => {
  const {t, s} = useT();
  const a = interpolate(t, [p.cveAt - 0.4, p.cveAt], [1, 0], clamp);
  const b = s(p.cveAt, {damping: 16, stiffness: 160, mass: 0.7});
  return (
    <Panel>
      <div style={{position: 'relative', flex: 1}}>
        {a > 0 ? (
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', opacity: a}}>
            <Title text="Fat image vs extension image" sub="Compressed size, MiB" />
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <Bars max={253.18} W={1000} rows={[
                {label: 'Fat image: official postgres:18.6 + 18 extensions', value: 253.18, text: '253.18', color: C.fat, at: p.sizeAt[0]},
                {label: 'its extension layer alone', value: 98, text: '98', color: C.fat, alpha: 0.55, at: p.sizeAt[1]},
                {label: 'pgvector extension image (CloudNativePG)', value: 0.31, text: '0.31', color: C.ext, at: p.sizeAt[2]},
              ]} />
            </div>
          </div>
        ) : null}
        {t >= p.cveAt - 0.1 ? (
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', opacity: b, transform: `scale(${0.98 + 0.02 * b})`}}>
            <Title text="CVEs found by Trivy" sub="All severities" at={p.cveAt + 0.1} />
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <Bars max={914} W={1000} rows={[
                {label: 'Official postgres:18.6', value: 397, text: '397', color: C.base, at: p.cveRows[0]},
                {label: 'Fat image: the same + 18 extensions', value: 914, text: '914', color: C.fat, at: p.cveRows[1]},
                {label: 'pgvector extension image', text: 'no packages Trivy can scan', color: C.ext, at: p.cveRows[2]},
              ]} />
            </div>
            <div style={{fontSize: 30, fontWeight: 500, color: DIM, opacity: s(p.cveRows[2] + 0.6)}}>Both Debian-based. The extension files themselves are not scanned.</div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
};

// ---------- 02: StackGres with the extension repository unreachable ----------
export type RepoProps = {rowAt: number[]; captionAt: number; durationSec: number};
export const RepoDown: React.FC<RepoProps> = (p) => {
  const {s} = useT();
  const rows = [
    {what: 'New cluster', res: 'not ready for 300 s', color: C.bad, note: '3 of 3 runs'},
    {what: 'Running cluster, pod deleted', res: 'Ready in 13 s', color: C.ok, note: 'no downloads'},
    {what: 'New cluster, extension cache on and warm', res: 'Ready in 29.4 s', color: C.ext, note: '3 runs'},
  ];
  return (
    <Panel>
      <Title text="Extension repository unreachable" sub="StackGres 1.19.3, 20 extensions, repository blocked for 300 s" />
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 50}}>
        {rows.map((r, i) => {
          const k = s(p.rowAt[i]);
          const pop = s(p.rowAt[i] + 0.35, {damping: 11, stiffness: 240, mass: 0.5});
          return (
            <div key={i} style={{opacity: k, transform: `translateX(${(1 - k) * -24}px)`}}>
              <div style={{fontSize: 40, fontWeight: 700}}>{r.what}</div>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 10}}>
                <div style={{fontSize: 58, fontWeight: 800, color: r.color, transform: `scale(${0.85 + 0.15 * pop})`, transformOrigin: 'left center', opacity: pop}}>{r.res}</div>
                <div style={{fontSize: 30, fontWeight: 600, color: DIM, opacity: pop}}>{r.note}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{fontSize: 30, fontWeight: 500, color: DIM, opacity: s(p.captionAt)}}>The cache is a Helm chart setting, off by default: extensions.cache.enabled</div>
    </Panel>
  );
};

// ---------- 04: the Mitchell Hashimoto post ----------
export type QuoteProps = {name: string; handle: string; date: string; where: string; parts: {text: string; hl?: number}[]; hlAt: number[]; durationSec: number};
export const QuotePost: React.FC<QuoteProps> = (p) => {
  const {s, grow} = useT();
  const k = s(0.4);
  return (
    <Panel pad="70px 90px 56px">
      <div style={{display: 'flex', alignItems: 'center', gap: 26, opacity: s(0.25)}}>
        <div style={{width: 92, height: 92, borderRadius: 46, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 800, color: '#fff'}}>{p.name.split(' ').map((w) => w[0]).join('')}</div>
        <div>
          <div style={{fontSize: 44, fontWeight: 800}}>{p.name}</div>
          <div style={{fontSize: 32, fontWeight: 500, color: DIM, marginTop: 2}}>{p.handle} · {p.date}</div>
        </div>
      </div>
      <div style={{position: 'relative', marginTop: 54, fontSize: 54, fontWeight: 600, lineHeight: 1.38, opacity: k, transform: `translateY(${(1 - k) * 16}px)`}}>
        <span style={{position: 'absolute', left: -62, top: -24, fontSize: 130, fontWeight: 800, color: C.ext, lineHeight: 1}}>“</span>
        {p.parts.map((x, i) => {
          if (x.hl === undefined) return <span key={i}>{x.text}</span>;
          const g = grow(p.hlAt[x.hl], 0.7);
          return (
            <span key={i} style={{backgroundImage: `linear-gradient(rgba(255,210,63,0.9), rgba(255,210,63,0.9))`, backgroundRepeat: 'no-repeat', backgroundSize: `${g * 100}% 100%`, color: g > 0.5 ? '#111' : '#fff', borderRadius: 6, padding: '0 4px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{x.text}</span>
          );
        })}
      </div>
      <div style={{flex: 1}} />
      <div style={{fontSize: 30, fontWeight: 500, color: DIM, opacity: s(1.2)}}>{p.where}</div>
    </Panel>
  );
};

// ---------- 06: layers composed by the registry ----------
// Left: the layers the registry holds (built once, shared). Right: the image you get, a manifest
// over some of them. Layers fly from left to right at their words. Phase B: the upgrade image
// holds Postgres 17 and 18 and the extension for each.
export type LayersProps = {reqAt: number; flyAt: number[]; digestAt: number; noteAt: number; bAt: number; b17At: number; bExtAt: number; durationSec: number};
export const Layers: React.FC<LayersProps> = (p) => {
  const {t, s, grow} = useT();
  const BW = 400, BH = 70, GAP = 14;
  // Store (left column) and image (right stack, drawn bottom-up).
  const store = [
    {id: 'base', label: 'base (OS files)', c: C.base},
    {id: 'pg17', label: 'Postgres 17', c: C.base},
    {id: 'pg18', label: 'Postgres 18', c: C.base},
    {id: 'citext', label: 'citext', c: C.ext},
    {id: 'hypopg', label: 'hypopg', c: C.ext},
    {id: 'pgvector', label: 'pgvector', c: C.ext, note: '0.85 MB, shared'},
    {id: 'postgis', label: 'postgis', c: C.ext},
  ];
  const SX = 0, SY = 130;
  const sy = (i: number) => SY + i * (BH + GAP);
  const IX = 720, IBOT = 760;
  const phaseB = t >= p.bAt;
  // Image stack: phase A base, pg18, citext, pgvector; phase B adds pg17 and pgvector for 17.
  const stackA = [
    {id: 'base', at: p.flyAt[0]},
    {id: 'pg18', at: p.flyAt[1]},
    {id: 'citext', at: p.flyAt[2]},
    {id: 'pgvector', at: p.flyAt[3]},
  ];
  const stackB = [
    {id: 'base', at: -1}, {id: 'pg17', at: p.b17At}, {id: 'pg18', at: -1},
    {id: 'pgvector', at: p.bExtAt, label: 'pgvector for 17'}, {id: 'pgvector', at: -1, label: 'pgvector for 18'},
  ];
  const stack = phaseB ? stackB : stackA;
  const fx = (from: number, k: number, to: number) => from + (to - from) * k;
  const bIn = s(p.bAt, {damping: 16, stiffness: 160, mass: 0.7});
  const eased = (at: number) => Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, (t - at) / 0.9)));
  const block = (key: string, x: number, y: number, label: string, c: string, op = 1, note?: string) => (
    <div key={key} style={{position: 'absolute', left: x, top: y, width: BW, height: BH, borderRadius: 10, background: c, opacity: op, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', boxSizing: 'border-box', color: '#111', fontSize: 34, fontWeight: 800}}>
      <span>{label}</span>{note ? <span style={{fontSize: 24, fontWeight: 700}}>{note}</span> : null}
    </div>
  );
  return (
    <Panel>
      <Title text={phaseB ? 'Upgrade image: two Postgres layers' : 'One image = a list of shared layers'} sub={phaseB ? 'Postgres 17 and 18 side by side for pg_upgrade' : 'The registry writes a manifest; nothing is built'} />
      <div style={{position: 'relative', flex: 1}}>
        <div style={{position: 'absolute', left: SX, top: SY - 56, fontSize: 32, fontWeight: 700, color: DIM, opacity: s(0.6)}}>Layers in the registry</div>
        {store.map((b, i) => block(`s${b.id}`, SX, sy(i) - 60, b.label, b.c, 0.35 + 0.65 * s(0.6 + i * 0.12), b.note))}
        <div style={{position: 'absolute', left: IX, top: SY - 56, fontSize: 32, fontWeight: 700, color: DIM, opacity: s(p.reqAt)}}>Your image</div>
        <div style={{position: 'absolute', left: IX, top: SY - 14, fontFamily: MONO, fontSize: 30, fontWeight: 500, color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: 8, whiteSpace: 'nowrap', opacity: s(p.reqAt) * (1 - bIn)}}>Postgres 18 + pgvector + citext</div>
        <div style={{position: 'absolute', left: IX, top: SY - 14, fontFamily: MONO, fontSize: 30, fontWeight: 500, color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: 8, whiteSpace: 'nowrap', opacity: bIn}}>Postgres 17 + 18 + pgvector</div>
        {stack.map((b, j) => {
          const si = store.findIndex((x) => x.id === b.id);
          const sb = store[si];
          const ty = IBOT - (j + 1) * (BH + GAP) - 60;
          const k = b.at < 0 ? 1 : eased(b.at);
          if (b.at >= 0 && t < b.at) return null;
          return block(`i${j}`, fx(SX, k, IX), fx(sy(si) - 60, k, ty), (b as {label?: string}).label ?? sb.label, sb.c);
        })}
        {!phaseB ? (
          <div style={{position: 'absolute', left: IX + BW + 30, top: IBOT - 2 * (BH + GAP) - 60, width: 360, opacity: s(p.digestAt)}}>
            <div style={{fontSize: 28, fontWeight: 600, color: DIM, lineHeight: 1.3}}>either order, same digest</div>
            <div style={{fontFamily: MONO, fontSize: 30, fontWeight: 500, color: C.ext, marginTop: 6}}>f9ca85e9…</div>
          </div>
        ) : null}
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 30, fontWeight: 500, color: DIM, opacity: phaseB ? s(p.bExtAt + 0.8) : s(p.noteAt) * (1 - bIn)}}>
          {phaseB ? 'After the upgrade, the operator asks for an image with Postgres 18 only.' : 'Layers are built once. Every set of extensions is a new manifest over them.'}
        </div>
      </div>
    </Panel>
  );
};

// ---------- 07: write outage when the image changes (CloudNativePG) ----------
export type OutageProps = {groupAt: number[]; captionAt: number; durationSec: number};
export const Outage: React.FC<OutageProps> = (p) => {
  const {s, grow} = useT();
  const W = 980, MAX = 200;
  const groups = [
    {label: 'restart, clients keep their connections', v: [192.1, 193.2]},
    {label: 'restart, a new connection per transaction', v: [12.7, 13.8]},
    {label: 'switchover', v: [6.4, 6.5]},
  ];
  const cols = [C.ext, C.fat];
  return (
    <Panel>
      <Title text="Every image change is a rolling restart" sub="Adding pgvector on CloudNativePG 1.27.4: longest write outage, seconds" />
      <div style={{display: 'flex', gap: 40, marginTop: 26, fontSize: 32, fontWeight: 700, opacity: s(0.5)}}>
        <span style={{display: 'flex', alignItems: 'center', gap: 12}}><span style={{width: 30, height: 22, borderRadius: 5, background: C.ext}} />extension image</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 12}}><span style={{width: 30, height: 22, borderRadius: 5, background: C.fat}} />253 MiB fat image</span>
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40}}>
        {groups.map((gr, i) => (
          <div key={i} style={{opacity: s(p.groupAt[i])}}>
            <div style={{fontSize: 38, fontWeight: 700}}>{gr.label}</div>
            {gr.v.map((v, j) => {
              const g = grow(p.groupAt[i] + j * 0.25, 1.0);
              return (
                <div key={j} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 8, height: 46}}>
                  <div style={{width: Math.max(5, (v / MAX) * W * g), height: 42, background: cols[j], borderRadius: 7}} />
                  <div style={{fontSize: 40, fontWeight: 800, fontVariantNumeric: 'tabular-nums', opacity: g}}>{v.toFixed(1)}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{fontSize: 30, fontWeight: 500, color: DIM, opacity: s(p.captionAt)}}>1 primary + 1 replica. Medians of 5 runs (3 with a new connection per transaction).</div>
    </Panel>
  );
};
