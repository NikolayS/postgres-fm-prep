import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

// Episode overlays, "The hidden costs of CREATE TEMP TABLE" (2026-11-10 recording). Center cards sit
// in the area left of the hosts' "center" column (same PANEL as episode 195). Every reveal time is
// seconds from the overlay start, mapped from SOURCE word times in scripts/ep196.ts.
// Screenshots are real captures (scripts/shot.ts) with their rects in public/ep196/*.rect.json;
// highlights are placed from those rects, never estimated. Colours follow the public brief.
export const C = {blue: '#7EB0E0', green: '#5BC8A0', red: '#E5322D', yellow: '#FFD23F', bad: '#FF5A4E'};
const DIM = 'rgba(255,255,255,0.62)';
const MONO = 'JetBrains Mono, Menlo, monospace';
export const PANEL = {x: 40, y: 100, w: 1570, h: 930};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

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
      <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, background: 'rgba(27,27,31,0.96)', borderRadius: 18, padding: pad ?? '40px 50px 34px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: k, transform: `scale(${0.97 + 0.03 * k})`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: '#fff', overflow: 'hidden'}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// ---------- screenshot card ----------
type Rect = {x: number; y: number; w: number; h: number};
export type Shot = {
  src: string; w: number; h: number; // capture size in CSS px (the PNG is 2x)
  at: number; // when this shot appears (s from the overlay start)
  url: string; header?: string;
  hl?: {rects: Rect[]; at: number; kind?: 'underline' | 'box'}[];
  zoom?: {rect: Rect; at: number; scale: number};
  zooms?: {rect: Rect; at: number; scale: number; dur?: number}[]; // sequential push-ins, each centres its rect
  bg?: string;
  maxScale?: number;
};
export type ShotProps = {shots: Shot[]; layout?: 'swap' | 'stack'; durationSec: number};

const AREA = {w: PANEL.w - 100, h: PANEL.h - 74 - 62}; // inside padding, above the URL line

const ShotView: React.FC<{sh: Shot; boxW: number; boxH: number}> = ({sh, boxW, boxH}) => {
  const {frame, fps, grow} = useT();
  const sc = Math.min(boxW / sh.w, boxH / sh.h, sh.maxScale ?? 3);
  const W = sh.w * sc, H = sh.h * sc;
  // Eased push-in on entry (1.0 s), then the optional zoom to a rect.
  const pin = interpolate(frame, [sh.at * fps, (sh.at + 1.0) * fps], [0.94, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  let z = 1, ox = W / 2, oy = H / 2;
  let tf = '';
  let zk = 1; // current magnification, so box and underline strokes keep their screen size
  if (sh.zooms && sh.zooms.length) {
    // Each push-in moves the view so its rect is centred, scaled to zoom.scale (clamped to the shot edges).
    let cz = 1, cx = W / 2, cy = H / 2;
    for (const zm of sh.zooms) {
      const g = interpolate(frame, [zm.at * fps, (zm.at + (zm.dur ?? 1.0)) * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
      const tx = (zm.rect.x + zm.rect.w / 2) * sc, ty = (zm.rect.y + zm.rect.h / 2) * sc;
      cz = cz + (zm.scale - cz) * g; cx = cx + (tx - cx) * g; cy = cy + (ty - cy) * g;
    }
    const zz = cz * pin;
    const txx = Math.min(0, Math.max(W - W * zz, W / 2 - cx * zz));
    const tyy = Math.min(0, Math.max(H - H * zz, H / 2 - cy * zz));
    tf = `translate(${txx}px, ${tyy}px) scale(${zz})`;
    zk = zz;
  }
  if (sh.zoom) {
    const g = interpolate(frame, [sh.zoom.at * fps, (sh.zoom.at + 1.0) * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
    z = 1 + (sh.zoom.scale - 1) * g;
    ox = (sh.zoom.rect.x + sh.zoom.rect.w / 2) * sc;
    oy = (sh.zoom.rect.y + sh.zoom.rect.h / 2) * sc;
  }
  if (!tf) zk = pin * z;
  return (
    <div style={{width: W, height: H, position: 'relative', overflow: 'hidden', borderRadius: 10, background: sh.bg}}>
      <div style={tf ? {position: 'absolute', left: 0, top: 0, width: W, height: H, transform: tf, transformOrigin: '0 0'} : {position: 'absolute', inset: 0, transform: `scale(${pin * z})`, transformOrigin: `${ox}px ${oy}px`}}>
        <Img src={staticFile(sh.src)} style={{width: W, height: H, display: 'block'}} />
        {(sh.hl ?? []).map((h, i) => {
          const g = grow(h.at, 0.6);
          return h.rects.map((r, j) =>
            h.kind === 'box' ? (
              <div key={`${i}-${j}`} style={{position: 'absolute', left: r.x * sc - 8 / zk, top: r.y * sc - 6 / zk, width: r.w * sc + 16 / zk, height: r.h * sc + 12 / zk, border: `${5 / zk}px solid ${C.red}`, borderRadius: 8 / zk, opacity: g, boxSizing: 'border-box'}} />
            ) : (
              <div key={`${i}-${j}`} style={{position: 'absolute', left: r.x * sc, top: (r.y + r.h) * sc + 1 / zk, width: r.w * sc * g, height: 6 / zk, background: C.red, borderRadius: 3 / zk}} />
            ),
          );
        })}
      </div>
    </div>
  );
};

export const ShotCard196: React.FC<ShotProps> = (p) => {
  const {t, s} = useT();
  const layout = p.layout ?? 'swap';
  if (layout === 'stack') {
    // All shots in one column, fitted together; each appears at its time.
    const gap = 36;
    const sc = Math.min(...p.shots.map((x) => Math.min(AREA.w / x.w, x.maxScale ?? 3)), (AREA.h - gap * (p.shots.length - 1)) / p.shots.reduce((a, x) => a + x.h, 0));
    return (
      <Panel>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap}}>
          {p.shots.map((sh, i) => {
            const k = s(sh.at, {damping: 16, stiffness: 170, mass: 0.7});
            return <div key={i} style={{opacity: k, transform: `translateY(${(1 - k) * 20}px)`}}><ShotView sh={{...sh, maxScale: sc}} boxW={AREA.w} boxH={sh.h * sc} /></div>;
          })}
        </div>
        <div style={{fontFamily: MONO, fontSize: 36, color: DIM, opacity: s(0.6)}}>{p.shots[0].url}</div>
      </Panel>
    );
  }
  // swap: one shot at a time, crossfade at the next shot's time.
  let cur = 0;
  p.shots.forEach((x, i) => { if (t >= x.at) cur = i; });
  return (
    <Panel>
      <div style={{position: 'relative', flex: 1}}>
        {p.shots.map((sh, i) => {
          if (i !== cur && i !== cur - 1) return null;
          const next = p.shots[i + 1];
          const out = next ? interpolate(t, [next.at - 0.35, next.at], [1, 0], clamp) : 1;
          const inK = i === 0 ? 1 : interpolate(t, [sh.at - 0.05, sh.at + 0.35], [0, 1], clamp);
          if (out <= 0) return null;
          const headerH = sh.header ? 58 : 0;
          return (
            <div key={i} style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', opacity: out * inK}}>
              {sh.header ? <div style={{fontSize: 40, fontWeight: 600, color: DIM, height: headerH, opacity: s(sh.at + 0.3)}}>{sh.header}</div> : null}
              <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <ShotView sh={sh} boxW={AREA.w} boxH={AREA.h - headerH} />
              </div>
              <div style={{fontFamily: MONO, fontSize: 36, color: DIM, marginTop: 8}}>{sh.url}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

// ---------- the layers of temp-table problems ----------
export type LayerRow = {tag: string; text: string; at: number; dim?: boolean; color?: string};
export type LayersProps = {
  title: string; rows: LayerRow[];
  kirk?: {at10: number; at60: number};
  waits?: {at: number[]; url: string};
  durationSec: number;
};
export const Layers196: React.FC<LayersProps> = (p) => {
  const {s} = useT();
  const pop = (at: number) => s(at, {damping: 11, stiffness: 240, mass: 0.5});
  return (
    <Panel pad="44px 56px 36px">
      <div style={{fontSize: 60, fontWeight: 800, letterSpacing: -1, opacity: s(0.15)}}>{p.title}</div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: p.waits ? 12 : 26, marginTop: p.waits ? 18 : 0}}>
        {p.rows.map((r, i) => {
          const k = s(r.at);
          const col = r.color ?? '#fff';
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 28, opacity: k * (r.dim ? 0.38 : 1), transform: `translateX(${(1 - k) * -24}px)`}}>
              <div style={{width: 96, height: r.dim ? 56 : 72, borderRadius: 12, background: r.dim ? 'rgba(255,255,255,0.12)' : col === '#fff' ? 'rgba(126,176,224,0.22)' : col, color: r.dim || col === '#fff' ? C.blue : '#111', fontSize: 40, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontVariantNumeric: 'tabular-nums'}}>{r.tag}</div>
              <div style={{fontSize: r.dim ? 38 : 50, fontWeight: 700, color: r.dim ? '#fff' : col === '#fff' ? '#fff' : col}}>{r.text}</div>
            </div>
          );
        })}
        {p.kirk ? (
          <div style={{marginLeft: 124, marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 26}}>
            <div style={{fontSize: 52, fontWeight: 800, fontVariantNumeric: 'tabular-nums', opacity: pop(p.kirk.at10), transform: `scale(${0.85 + 0.15 * pop(p.kirk.at10)})`, transformOrigin: 'left center'}}>10M queries/day</div>
            <div style={{fontSize: 52, fontWeight: 800, color: C.yellow, opacity: pop(p.kirk.at60), transform: `scale(${0.85 + 0.15 * pop(p.kirk.at60)})`, transformOrigin: 'left center'}}>→ 60M pg_catalog updates/day</div>
          </div>
        ) : null}
        {p.waits ? (
          <div style={{marginLeft: 124, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14}}>
            {[['LWLock:SInvalWrite', 'waiting to add a message to the shared catalog invalidation queue'], ['LWLock:SInvalRead', 'waiting to retrieve messages from the shared catalog invalidation queue']].map(([ev, d], i) => (
              <div key={i} style={{opacity: s(p.waits!.at[i]), transform: `translateY(${(1 - s(p.waits!.at[i])) * 10}px)`}}>
                <div style={{fontFamily: MONO, fontSize: 46, fontWeight: 500, color: C.yellow}}>{ev}</div>
                <div style={{fontSize: 38, fontWeight: 500, color: DIM}}>{d}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {p.kirk ? <div style={{fontSize: 38, fontWeight: 500, color: DIM, opacity: s(p.kirk.at10 + 0.5)}}>Kirk's system: 2 temp tables + 1 index, 3 catalog rows in and 3 out per session</div> : null}
      {p.waits ? <div style={{fontFamily: MONO, fontSize: 36, color: DIM, opacity: s(p.waits.at[0] + 0.5)}}>{p.waits.url}</div> : null}
    </Panel>
  );
};

// ---------- SQL: a table as one value and back ----------
export type CodeLine = {code: string; note: string; at: number; noteAt: number; hl?: {text: string; at: number}};
export type CodeProps = {title: string; lines: CodeLine[]; durationSec: number};
export const Code196: React.FC<CodeProps> = (p) => {
  const {s, grow} = useT();
  return (
    <Panel pad="48px 56px 40px">
      <div style={{fontSize: 60, fontWeight: 800, letterSpacing: -1, opacity: s(0.15)}}>{p.title}</div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 50}}>
        {p.lines.map((l, i) => {
          const k = s(l.at);
          let body: React.ReactNode = l.code;
          if (l.hl) {
            const j = l.code.indexOf(l.hl.text);
            const g = grow(l.hl.at, 0.5);
            body = (
              <>
                {l.code.slice(0, j)}
                <span style={{backgroundImage: 'linear-gradient(rgba(255,210,63,0.95), rgba(255,210,63,0.95))', backgroundRepeat: 'no-repeat', backgroundSize: `${g * 100}% 100%`, color: g > 0.5 ? '#111' : '#fff', borderRadius: 6}}>{l.hl.text}</span>
                {l.code.slice(j + l.hl.text.length)}
              </>
            );
          }
          return (
            <div key={i} style={{opacity: k, transform: `translateX(${(1 - k) * -20}px)`}}>
              <div style={{fontFamily: MONO, fontSize: 42, fontWeight: 500, color: '#fff', whiteSpace: 'pre'}}>{body}</div>
              <div style={{fontSize: 40, fontWeight: 600, color: C.green, marginTop: 10, opacity: s(l.noteAt)}}>{l.note}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
