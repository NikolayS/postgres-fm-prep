import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';

// Full-screen insert for the Hacking Postgres playlist: a title strip, a grid of
// recent session thumbnails popping in fast, then the grid shrinks to the top
// and two "it shipped" cards (session cover -> release) land below, then a
// playlist chip. Each pop lines up with a clack in the manifest.
export type HackingInsertProps = {
  title: string;
  sub: string;
  thumbs: string[]; // public/ files, 16:9, recent sessions (6)
  shipped: {cover: string; session: string; release: string}[]; // 2
  chip: string;
  durationSec: number;
};

// Seconds; render-all.ts uses the same table for the clacks.
export const HACK_TIMING = {title: 0.2, thumbAt: 0.5, thumbStep: 0.18, shrink: 2.4, shipAt: 2.7, shipStep: 1.3, releaseDelay: 0.6, chip: 5.6};

export const HackingInsert: React.FC<HackingInsertProps> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const accent = '#FFD23F';
  const T = HACK_TIMING;
  const s = (at: number, cfg = {damping: 13, stiffness: 240, mass: 0.5}) => spring({frame: frame - at * fps, fps, config: cfg});
  const dim = interpolate(frame, [0, 0.25 * fps], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const shrink = interpolate(frame, [T.shrink * fps, (T.shrink + 0.5) * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});

  // Grid: 3 x 2 of 520x292 thumbs centered; after shrink it becomes a 6-wide row at the top.
  const TW = 520, TH = 292, GAP = 20;
  const gridW = 3 * TW + 2 * GAP;
  const gridX = (1920 - gridW) / 2;
  const gridY = 240;
  const rowScale = 0.5;
  const rowW = 6 * TW * rowScale + 5 * GAP * rowScale;
  const rowX = (1920 - rowW) / 2;
  const rowY = 150;

  const strip: React.CSSProperties = {display: 'inline-block', background: '#111', color: '#fff', fontWeight: 600, lineHeight: 1.2, padding: '10px 26px', borderRadius: 8, whiteSpace: 'nowrap'};

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <AbsoluteFill style={{background: `rgba(8,8,10,${0.88 * dim})`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
        <div style={{...strip, fontSize: 44, fontWeight: 700, opacity: s(T.title), transform: `scale(${0.9 + 0.1 * s(T.title)})`}}>
          <span style={{color: accent, marginRight: 16}}>Postgres.TV</span>
          {p.title}
        </div>
        <div style={{...strip, fontSize: 30, fontWeight: 500, background: 'rgba(17,17,17,0.85)', padding: '6px 22px', opacity: s(T.title + 0.15)}}>{p.sub}</div>
      </div>
      {p.thumbs.map((th, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        const gx = gridX + col * (TW + GAP), gy = gridY + 60 + row * (TH + GAP);
        const rx = rowX + i * (TW + GAP) * rowScale, ry = rowY + 40;
        const x = gx + (rx - gx) * shrink, y = gy + (ry - gy) * shrink;
        const sc = 1 + (rowScale - 1) * shrink;
        const pop = s(T.thumbAt + i * T.thumbStep);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: TW, height: TH, transform: `scale(${sc * (0.7 + 0.3 * pop)})`, transformOrigin: 'top left', opacity: pop * (1 - 0.35 * shrink), borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.55)', border: '3px solid rgba(255,255,255,0.12)'}}>
            <Img src={staticFile(th)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        );
      })}
      {p.shipped.map((sh, i) => {
        const at = T.shipAt + i * T.shipStep;
        const land = s(at, {damping: 14, stiffness: 180, mass: 0.6});
        const rel = s(at + T.releaseDelay, {damping: 10, stiffness: 300, mass: 0.5});
        const CW = 700, CH = 394;
        const x = i === 0 ? 1920 / 2 - CW - 40 : 1920 / 2 + 40;
        const y = 400;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: CW, opacity: land, transform: `translateY(${(1 - land) * 40}px)`}}>
            <div style={{width: CW, height: CH, borderRadius: 10, overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,0.6)', border: '3px solid rgba(255,255,255,0.15)'}}>
              <Img src={staticFile(sh.cover)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            </div>
            <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start'}}>
              <div style={{...strip, fontSize: 30, fontWeight: 500, background: 'rgba(17,17,17,0.9)', padding: '6px 20px'}}>{sh.session}</div>
              <div style={{...strip, fontSize: 36, fontWeight: 700, color: '#111', background: accent, opacity: rel, transform: `scale(${0.8 + 0.2 * rel})`, transformOrigin: 'left center'}}>{sh.release}</div>
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center'}}>
        <div style={{...strip, fontSize: 32, fontWeight: 500, fontFamily: 'JetBrains Mono, Menlo, monospace', padding: '8px 22px', opacity: s(T.chip), transform: `scale(${0.92 + 0.08 * s(T.chip)})`}}>{p.chip}</div>
      </div>
    </AbsoluteFill>
  );
};
