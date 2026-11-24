import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';
import {Marker, Wipe, seedOf} from './Band';

// Episode 198 overlays ("AI in production Postgres", recording 2026-11-24).
// Layout: two host tiles 800x450 at y 222, name labels end near y 730. Band strips sit right under
// the labels (x 120, y 744-888); nothing below y 900 (YouTube subtitles). Center cards use the
// panel x 40-1600, y 220-890 while the hosts move to the right column (x 1630).
// Band strips: same marker / typing grammar as episodes 194-196 (BandTyping): the marker swipes
// in empty, then the text types left to right with a block cursor; one typing sound per line.

export const BAND198 = {x: 120, y: 744, w: 1480, h: 144};
export const PANEL198 = {x: 40, y: 220, w: 1560, h: 670};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const MONO = 'JetBrains Mono, Menlo, monospace';
const DIM = 'rgba(255,255,255,0.66)';

// ---------- typing schedule ----------
export const CPS = 30;
export const SENT_GAP = 0.35;
export type Burst = {start: number; end: number; chars: number; from: number};
export const textBursts = (text: string, at: number): Burst[] => {
  const parts = text.match(/[^.!?]+[.!?]*["”]?\s*/g) ?? [text];
  const out: Burst[] = [];
  let t = at, from = 0;
  for (const part of parts) {
    const end = t + part.length / CPS;
    out.push({start: t, end, chars: part.length, from});
    from += part.length;
    t = end + SENT_GAP;
  }
  return out;
};
export const typedAt = (bs: Burst[], t: number) => {
  let n = 0;
  for (const b of bs) {
    if (t >= b.end) n = b.from + b.chars;
    else if (t > b.start) return b.from + Math.floor((t - b.start) * CPS);
    else return n;
  }
  return n;
};

export type Band198Props = {
  lines: string[]; // one marker (or dark strip) per line, typed one after the other
  prefix?: string; // shown before line 0 in the accent colour (Editor's note)
  style?: 'marker' | 'dark';
  quote?: boolean; // curly quotes around the whole quote (opening on line 0, closing on the last line)
  fontSize?: number;
  typing?: boolean; // false: plain swipe render (manifest file); true: the -typing render
  lineAt?: number[]; // optional start (s from overlay start) of each line after the first
  durationSec: number;
};
// Shared by the component and the script that writes <id>-typing-bursts.json.
export const band198Plan = (p: {lines: string[]; prefix?: string; quote?: boolean; lineAt?: number[]}) => {
  const n = p.lines.length;
  const texts = p.lines.map((l, i) => `${p.quote && i === 0 ? '“' : ''}${l}${p.quote && i === n - 1 ? '”' : ''}`);
  const out: {text: string; swipeAt: number; bs: Burst[]}[] = [];
  let next = 0.45;
  texts.forEach((text, i) => {
    const typeAt = i === 0 ? next : Math.max(next, p.lineAt?.[i - 1] ?? 0);
    const full = i === 0 && p.prefix ? `${p.prefix} ${text}` : text;
    out.push({text: full, swipeAt: i === 0 ? 0 : typeAt - 0.3, bs: textBursts(full, typeAt)});
    next = out[i].bs[out[i].bs.length - 1].end + 0.35;
  });
  return out;
};

const Typed: React.FC<{text: string; bs: Burst[]; t: number; cursor: string; cursorFrom: number; cursorUntil: number; prefixLen: number; prefixColor?: string; typing: boolean}> = ({text, bs, t, cursor, cursorFrom, cursorUntil, prefixLen, prefixColor, typing}) => {
  const n = typing ? typedAt(bs, t) : text.length;
  const active = bs.some((b) => t >= b.start && t < b.end + 0.12);
  const blinkOn = active || Math.floor(t * 2) % 2 === 0;
  const showCursor = typing && t >= cursorFrom && t < cursorUntil && blinkOn;
  const chars = [...text];
  return (
    <span style={{position: 'relative', whiteSpace: 'pre'}}>
      {chars.map((c, j) => (
        <span key={j} style={{position: 'relative', visibility: j < n ? 'visible' : 'hidden', color: j < prefixLen && prefixColor ? prefixColor : undefined}}>
          {c}
          {j === n && showCursor ? <span style={{position: 'absolute', left: 1, top: '8%', width: '0.5em', height: '84%', background: cursor, visibility: 'visible'}} /> : null}
        </span>
      ))}
      {n >= chars.length && showCursor ? <span style={{display: 'inline-block', width: '0.5em', height: '0.84em', marginLeft: 3, verticalAlign: '-0.08em', background: cursor}} /> : null}
    </span>
  );
};

export const Band198: React.FC<Band198Props> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const fadeOut = interpolate(frame, [durationInFrames - 0.25 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const plan = band198Plan(p);
  const typing = p.typing ?? true;
  const lastEnd = (i: number) => plan[i].bs[plan[i].bs.length - 1].end;
  const cursorOff = lastEnd(plan.length - 1) + 3;
  const fs = p.fontSize ?? 44;
  const style = p.style ?? 'marker';
  const prefixLen = p.prefix ? p.prefix.length : 0;
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: BAND198.x, top: BAND198.y, width: BAND198.w, height: BAND198.h, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', justifyContent: 'flex-start'}}>
        {plan.map((l, i) => {
          const until = i < plan.length - 1 ? plan[i + 1].bs[0].start : cursorOff;
          const typed = <Typed text={l.text} bs={l.bs} t={t} cursor={style === 'dark' ? 'rgba(255,255,255,0.85)' : '#111'} cursorFrom={l.swipeAt + 0.3} cursorUntil={until} prefixLen={i === 0 ? prefixLen : 0} prefixColor={i === 0 ? '#FFD23F' : undefined} typing={typing} />;
          if (style === 'dark') {
            return (
              <Wipe key={i} frame={frame} fps={fps} delay={l.swipeAt}>
                <div style={{display: 'inline-block', background: 'rgba(17,17,17,0.92)', color: '#fff', fontSize: fs, fontWeight: 600, lineHeight: 1.2, padding: '10px 26px 12px', borderRadius: 8, whiteSpace: 'nowrap'}}>{typed}</div>
              </Wipe>
            );
          }
          return (
            <Marker key={i} frame={frame} fps={fps} delay={l.swipeAt} seed={seedOf(p.lines[i])} fontSize={fs}>
              {typed}
            </Marker>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- screenshot card (real captures; rects from <name>.rect.json, never estimated) ----------
type Rect = {x: number; y: number; w: number; h: number};
export type Shot198 = {
  src: string; w: number; h: number; url: string;
  at?: number; // s from the overlay start when this shot replaces the previous one (first: 0)
  hl?: {rects: Rect[]; at: number; kind?: 'underline' | 'box'}[]; // red underline or box, grows in at `at`
  zooms?: {rect: Rect; at: number; scale: number; dur?: number}[];
};
export type ShotCard198Props = {shot?: Shot198; shots?: Shot198[]; durationSec: number};
const URL_H = 44;
const PAD = {t: 22, x: 40, b: 14};
const AREA = {w: PANEL198.w - 2 * PAD.x, h: PANEL198.h - PAD.t - PAD.b - URL_H - 6};
const RED = '#E5322D';

const ShotView: React.FC<{sh: Shot198; frame: number; fps: number}> = ({sh, frame, fps}) => {
  const t0 = sh.at ?? 0;
  const sc = Math.min(AREA.w / sh.w, AREA.h / sh.h, 3);
  const W = sh.w * sc, H = sh.h * sc;
  const pin = interpolate(frame, [t0 * fps, (t0 + 1.0) * fps], [0.94, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  let cz = 1, cx = W / 2, cy = H / 2;
  for (const zm of sh.zooms ?? []) {
    const g = interpolate(frame, [zm.at * fps, (zm.at + (zm.dur ?? 1.0)) * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
    const tx = (zm.rect.x + zm.rect.w / 2) * sc, ty = (zm.rect.y + zm.rect.h / 2) * sc;
    cz = cz + (zm.scale - cz) * g; cx = cx + (tx - cx) * g; cy = cy + (ty - cy) * g;
  }
  const zz = cz * pin;
  const txx = Math.min(0, Math.max(W - W * zz, W / 2 - cx * zz));
  const tyy = Math.min(0, Math.max(H - H * zz, H / 2 - cy * zz));
  return (
    <div style={{width: W, height: H, position: 'relative', overflow: 'hidden', borderRadius: 10}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, transform: `translate(${txx}px, ${tyy}px) scale(${zz})`, transformOrigin: '0 0'}}>
        <Img src={staticFile(sh.src)} style={{width: W, height: H, display: 'block'}} />
        {(sh.hl ?? []).map((h, i) => {
          const g = interpolate(frame, [h.at * fps, (h.at + 0.6) * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          return h.rects.map((r, j) => h.kind === 'box' ? (
            <div key={`${i}-${j}`} style={{position: 'absolute', left: r.x * sc - 8, top: r.y * sc - 6, width: r.w * sc + 16, height: r.h * sc + 12, border: `5px solid ${RED}`, borderRadius: 8, opacity: g, boxSizing: 'border-box'}} />
          ) : (
            // a long underline grows line by line, left to right
            <div key={`${i}-${j}`} style={{position: 'absolute', left: r.x * sc, top: (r.y + r.h) * sc + 1, width: r.w * sc * Math.max(0, Math.min(1, g * h.rects.length - j)), height: 5, background: RED, borderRadius: 3}} />
          ));
        })}
      </div>
    </div>
  );
};

export const ShotCard198: React.FC<ShotCard198Props> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const shots = p.shots ?? (p.shot ? [p.shot] : []);
  const k = spring({frame, fps, config: {damping: 16, stiffness: 160, mass: 0.7}});
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  let cur = 0;
  shots.forEach((x, i) => { if (t >= (x.at ?? 0)) cur = i; });
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: fadeOut}}>
      <div style={{position: 'absolute', left: PANEL198.x, top: PANEL198.y, width: PANEL198.w, height: PANEL198.h, background: 'rgba(27,27,31,0.96)', borderRadius: 18, padding: `${PAD.t}px ${PAD.x}px ${PAD.b}px`, boxSizing: 'border-box', opacity: k, transform: `scale(${0.97 + 0.03 * k})`, overflow: 'hidden'}}>
        {shots.map((sh, i) => {
          if (i !== cur && i !== cur - 1) return null;
          const next = shots[i + 1];
          const out = next ? interpolate(t, [(next.at ?? 0) - 0.35, next.at ?? 0], [1, 0], clamp) : 1;
          const inK = i === 0 ? 1 : interpolate(t, [(sh.at ?? 0) - 0.05, (sh.at ?? 0) + 0.35], [0, 1], clamp);
          if (out <= 0) return null;
          return (
            <div key={i} style={{position: 'absolute', left: PAD.x, top: PAD.t, right: PAD.x, bottom: PAD.b, display: 'flex', flexDirection: 'column', opacity: out * inK}}>
              <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><ShotView sh={sh} frame={frame} fps={fps} /></div>
              <div style={{height: URL_H, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 30, color: DIM, opacity: i === 0 ? interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], clamp) : 1}}>{sh.url}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
