import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {font} from './font';
import {PANEL198, BAND198} from './Ep198';

// Episode 198 v2 overlays (illus-1). Every number is from https://postgres.ai/blog/20261123-pgaibench
// and equals the v0.2 home page of https://pgaibench.dev/. Beat times (`b.*`) are seconds from the
// overlay start, computed in scripts/items-v2.ts from find.ts source-word anchors.
// Center pieces: PANEL198 (x 40-1600, y 220-890). Band pieces: BAND198 (x 120-1600, y 744-888).
// Nothing below y 900, nothing on faces. Text that matters: 30 px or more; hero numbers 120 px or more.

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const MONO = 'JetBrains Mono, Menlo, monospace';
const RED = '#FF4D4F';
const GREEN = '#2BD67B';
const AMBER = '#FFB020';
const YEL = '#FFD23F';
const DIM = 'rgba(255,255,255,0.7)';
// colors of the post's Figure 2 (20261113-pgaibench-fig-aaa-roles-dark.svg)
const F = {bg: '#202124', box: '#2b2d31', line: '#6d6c68', hi: '#e6e6e1', grey: '#a3a39d'};
const ease = (f: number, a: number, b: number, fps: number) => interpolate(f, [a * fps, b * fps], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
const pop = (f: number, at: number, fps: number) => (f < at * fps ? 0 : spring({frame: f - at * fps, fps, config: {damping: 11, stiffness: 170, mass: 0.7}}));
type P = {x: number; y: number};
const lerp = (a: P, c: P, g: number) => ({x: a.x + (c.x - a.x) * g, y: a.y + (c.y - a.y) * g});
// position along a polyline at fraction g of its length
const along = (pts: P[], g: number): P => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  let d = Math.max(0, Math.min(1, g)) * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) return lerp(pts[i], pts[i + 1], seg[i] ? Math.min(1, d / seg[i]) : 1);
    d -= seg[i];
  }
  return pts[pts.length - 1];
};

const Panel: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = 'rgba(22,22,28,0.96)'}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const k = spring({frame, fps, config: {damping: 16, stiffness: 160, mass: 0.7}});
  const out = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: out}}>
      <div style={{position: 'absolute', left: PANEL198.x, top: PANEL198.y, width: PANEL198.w, height: PANEL198.h, background: bg, borderRadius: 18, overflow: 'hidden', opacity: k, transform: `scale(${0.97 + 0.03 * k})`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
// small source tag, top right of a panel
const Tag: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', right: 34, top: 22, fontFamily: MONO, fontSize: 30, color: 'rgba(255,255,255,0.55)', opacity: ease(frame, 0.8, 1.4, fps)}}>{text}</div>;
};
const Title: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', left: 40, top: 18, fontSize: 44, fontWeight: 800, color: '#fff', opacity: ease(frame, 0.2, 0.8, fps)}}>{text}</div>;
};

// ====================== AAA: the post's Figure 2, animated ======================
// Same boxes, arrangement, colors and labels as Figure 2 (labels cut to fit 30 px text).
// SVG 760x596 -> panel: x' = 30 + (x - 18) * 2.07, y' = 70 + (y - 82) * 1.19.
type Key = 'phase1' | 'phase2' | 'analyst' | 'auditor' | 'actor' | 'clones' | 'prod' | 'cr' | 'back' | 'draft' | 'results' | 'approve' | 'reject' | 'rehearse' | 'apply';
const BOX = {
  analyst: {x: 30, y: 70, w: 588, h: 221, title: 'Analyst', sub: 'most capable model, not trusted', main: 'writes and tests change requests', stroke: F.line},
  auditor: {x: 941, y: 70, w: 589, h: 221, title: 'Auditor', sub: 'small model tuned to detect harm', main: 'reviews change requests', stroke: F.hi},
  actor: {x: 30, y: 368, w: 1500, h: 112, title: 'Actor', sub: 'almost no AI: rehearses on a clone, applies in production', main: '', stroke: F.line},
  clones: {x: 30, y: 550, w: 588, h: 110, title: 'Clones of production', sub: 'experiments and rehearsals', main: '', stroke: F.line},
  prod: {x: 941, y: 550, w: 589, h: 110, title: 'Production Postgres', sub: 'only the Actor changes it', main: '', stroke: F.hi},
} as const;
type BoxKey = keyof typeof BOX;
// arrows: from, to, label, label position, bold
const ARR: Record<Exclude<Key, BoxKey | 'phase1' | 'phase2'>, {a: P; c: P; label: string[]; at: P; bold?: boolean; hi?: boolean; anchor?: 'start' | 'middle' | 'end'}> = {
  cr: {a: {x: 618, y: 139}, c: {x: 937, y: 139}, label: ['change request', '+ test evidence'], at: {x: 778, y: 60}},
  back: {a: {x: 941, y: 220}, c: {x: 622, y: 220}, label: ['send back'], at: {x: 778, y: 232}, bold: true, hi: true},
  draft: {a: {x: 105, y: 291}, c: {x: 105, y: 364}, label: ['draft change'], at: {x: 122, y: 310}},
  results: {a: {x: 394, y: 368}, c: {x: 394, y: 295}, label: ['test results'], at: {x: 411, y: 310}},
  approve: {a: {x: 1015, y: 291}, c: {x: 1015, y: 364}, label: ['approve'], at: {x: 1032, y: 310}, bold: true, hi: true},
  reject: {a: {x: 1446, y: 291}, c: {x: 1446, y: 316}, label: ['reject'], at: {x: 1424, y: 300}, bold: true, hi: true, anchor: 'end'},
  rehearse: {a: {x: 105, y: 480}, c: {x: 105, y: 546}, label: ['rehearse'], at: {x: 122, y: 482}},
  apply: {a: {x: 1015, y: 480}, c: {x: 1015, y: 546}, label: ['apply'], at: {x: 1032, y: 482}},
};
type Tok = {label: string; t0: number; t1: number; path: P[]; halt?: string[]; color?: string};
export type AaaFigProps = {appear: Partial<Record<Key, number>>; focus?: {keys: Key[]; at: number}; glow?: {key: BoxKey; at: number}[]; tokens?: Tok[]; durationSec: number};
export const AaaFig: React.FC<AaaFigProps> = ({appear, focus, glow = [], tokens = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  font();
  const t = frame / fps;
  const k = (key: Key) => (appear[key] === undefined ? 0 : appear[key]! <= 0 ? 1 : pop(frame, appear[key]!, fps));
  const fo = focus ? ease(frame, focus.at, focus.at + 0.6, fps) : 0;
  const dim = (key: Key) => (focus && !focus.keys.includes(key) ? 1 - 0.72 * fo : 1);
  const glowOf = (key: BoxKey) => Math.max(0, ...glow.filter((g) => g.key === key).map((g) => ease(frame, g.at, g.at + 0.5, fps)));
  return (
    <Panel bg={F.bg}>
      {(['phase1', 'phase2'] as const).map((p, i) => (
        <div key={p} style={{position: 'absolute', left: i ? 941 : 30, top: 12, fontSize: 34, fontWeight: 700, color: F.grey, opacity: Math.min(1, k(p)) * dim(p)}}>{i ? '2. Review and apply' : '1. Prepare and test'}</div>
      ))}
      <svg width={PANEL198.w} height={PANEL198.h} style={{position: 'absolute', left: 0, top: 0}}>
        {(Object.keys(ARR) as (keyof typeof ARR)[]).map((key) => {
          const A = ARR[key];
          const g = ease(frame, (appear[key] ?? 1e9), (appear[key] ?? 1e9) + 0.6, fps);
          if (g <= 0) return null;
          const e = lerp(A.a, A.c, g);
          const col = A.hi ? F.hi : F.grey;
          const ang = Math.atan2(A.c.y - A.a.y, A.c.x - A.a.x);
          const head = key === 'reject'
            ? <rect x={A.c.x - 22} y={A.c.y - 4} width={44} height={9} rx={3} fill={col} />
            : <polygon points={`${e.x},${e.y} ${e.x - 16 * Math.cos(ang) + 8 * Math.sin(ang)},${e.y - 16 * Math.sin(ang) - 8 * Math.cos(ang)} ${e.x - 16 * Math.cos(ang) - 8 * Math.sin(ang)},${e.y - 16 * Math.sin(ang) + 8 * Math.cos(ang)}`} fill={col} />;
          return (
            <g key={key} opacity={dim(key)}>
              <line x1={A.a.x} y1={A.a.y} x2={e.x} y2={e.y} stroke={col} strokeWidth={3} />
              {g > 0.95 ? head : null}
              {A.label.map((l, i) => (
                <text key={i} x={A.at.x} y={A.at.y + 30 + i * 36} fontSize={31} fontWeight={A.bold ? 700 : 400} fill={col} textAnchor={A.anchor ?? (key === 'cr' || key === 'back' ? 'middle' : 'start')} fontFamily="Inter" opacity={g}>{l}</text>
              ))}
            </g>
          );
        })}
      </svg>
      {(Object.keys(BOX) as BoxKey[]).map((key) => {
        const B = BOX[key];
        const kk = k(key);
        if (kk <= 0.001) return null;
        const gl = glowOf(key);
        const small = key === 'clones' || key === 'prod';
        return (
          <div key={key} style={{position: 'absolute', left: B.x, top: B.y, width: B.w, height: B.h, boxSizing: 'border-box', background: key === 'clones' || key === 'prod' ? 'transparent' : F.box, border: `${B.stroke === F.hi ? 3 : 2}px solid ${gl > 0 ? `rgba(255,210,63,${0.4 + 0.6 * gl})` : B.stroke}`, borderRadius: 10, opacity: Math.min(1, kk * 1.4) * dim(key), transform: `scale(${0.9 + 0.1 * Math.min(kk, 1.04)})`, boxShadow: gl > 0 ? `0 0 ${30 * gl}px rgba(255,210,63,${0.6 * gl})` : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.18}}>
            <div style={{fontSize: small ? 36 : 46, fontWeight: 700, color: F.hi}}>{B.title}</div>
            <div style={{fontSize: 31, color: F.grey, marginTop: small ? 2 : 8}}>{B.sub}</div>
            {B.main ? <div style={{fontSize: 31, color: F.hi, marginTop: 4}}>{B.main}</div> : null}
          </div>
        );
      })}
      {tokens.map((tk, i) => {
        if (t < tk.t0) return null;
        const g = interpolate(t, [tk.t0, tk.t1], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
        const p = along(tk.path, g);
        const halted = tk.halt && g >= 1;
        const doneO = !tk.halt && g >= 1 ? 1 - interpolate(t, [tk.t1 + 0.6, tk.t1 + 1.2], [0, 1], clamp) : 1;
        const col = halted ? RED : g >= 1 ? GREEN : tk.color ?? YEL;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: p.x - 60, top: p.y - 26, width: 120, height: 52, borderRadius: 10, background: col, color: '#111', fontWeight: 800, fontSize: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 22px ${col}`, fontFamily: MONO, opacity: doneO}}>{tk.label}</div>
            {halted ? (
              <div style={{position: 'absolute', left: 640, top: 560, width: 290, color: RED, opacity: ease(frame, tk.t1, tk.t1 + 0.4, fps)}}>
                <div style={{fontSize: 40, fontWeight: 900}}>{tk.halt![0]}</div>
                <div style={{fontSize: 30, fontWeight: 600}}>{tk.halt![1]}</div>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </Panel>
  );
};

// ====================== band motif: the AAA figure in miniature ======================
// lit: which part is "you are here". Text types in at 30 chars/s from 0.45 s (bursts in items-v2.ts).
export type MotifProps = {lines: string[]; lit: 'actor-prod' | 'auditor' | 'analyst' | 'auditor-q' | 'back' | 'all' | 'none'; durationSec: number; prefixLen?: number; lineAt?: number[]; hiWords?: string[]; strike?: {word: string; at: number}[]};
export const motifPlan = (lines: string[], lineAt?: number[]) => {
  let next = 0.45;
  return lines.map((l, i) => {
    const at = i === 0 ? next : Math.max(next, lineAt?.[i - 1] ?? 0);
    const end = at + l.length / 30;
    next = end + 0.35;
    return {text: l, at, end};
  });
};
export const Motif198: React.FC<MotifProps> = ({lines, lit, prefixLen = 0, lineAt, hiWords = [], strike = []}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const out = interpolate(frame, [durationInFrames - 0.25 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const k = spring({frame, fps, config: {damping: 14, stiffness: 170, mass: 0.6}});
  const plan = motifPlan(lines, lineAt);
  const pulse = 0.55 + 0.45 * Math.sin(t * 5);
  // miniature of Figure 2: Analyst / Auditor on top, Actor bar, Clones / Production at the bottom
  const box = (x: number, y: number, w: number, h: number, l: string, on: boolean, hiStroke = false) => (
    <g opacity={on ? 1 : 0.3}>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={F.box} stroke={on ? YEL : hiStroke ? F.hi : F.line} strokeWidth={on ? 3 : 1.5} />
      <text x={x + w / 2} y={y + h / 2 + 8} fontSize={22} fontWeight={700} textAnchor="middle" fill={F.hi} fontFamily="Inter">{l}</text>
    </g>
  );
  const L = lit;
  const qO = L === 'auditor-q' ? ease(frame, 0.2, 0.6, fps) : 0;
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: out}}>
      <div style={{position: 'absolute', left: BAND198.x, top: BAND198.y, height: BAND198.h, display: 'flex', alignItems: 'center', gap: 16, transform: `translateX(${(1 - k) * -40}px)`, opacity: Math.min(1, k * 1.5)}}>
        {L === 'none' ? null : <div style={{width: 250, height: 144, background: F.bg, borderRadius: 10, position: 'relative', flex: 'none'}}>
          <svg width={250} height={144} style={{position: 'absolute', left: 0, top: 0}}>
            {box(8, 8, 104, 44, 'Analyst', L === 'analyst' || L === 'back' || L === 'all' || L === 'auditor-q')}
            {L === 'auditor-q'
              ? <g opacity={qO}><rect x={138} y={8} width={104} height={44} rx={4} fill="none" stroke={YEL} strokeWidth={3} strokeDasharray="7 6" /><text x={190} y={40} fontSize={28} fontWeight={800} textAnchor="middle" fill={YEL}>?</text></g>
              : box(138, 8, 104, 44, 'Auditor', L === 'auditor' || L === 'back' || L === 'all', true)}
            {L === 'back' ? <g opacity={pulse}><line x1={136} y1={30} x2={118} y2={30} stroke={YEL} strokeWidth={4} /><polygon points="112,30 122,24 122,36" fill={YEL} /></g> : null}
            {box(8, 66, 234, 30, 'Actor', L === 'actor-prod' || L === 'all')}
            {box(8, 108, 104, 30, 'Clones', L === 'all')}
            {box(138, 108, 104, 30, 'Prod', L === 'actor-prod' || L === 'all', true)}
            {L === 'actor-prod' ? <line x1={190} y1={96} x2={190} y2={108} stroke={YEL} strokeWidth={6} opacity={pulse} /> : null}
          </svg>
        </div>}
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          {plan.map((p, i) => {
            const n = Math.max(0, Math.min(p.text.length, Math.floor((t - p.at) * 30)));
            if (t < p.at - 0.3) return <div key={i} style={{height: 64}} />;
            return (
              <div key={i} style={{alignSelf: 'flex-start', background: 'rgba(17,17,17,0.92)', color: '#fff', fontSize: lines.length > 1 ? 40 : 44, fontWeight: 600, padding: '6px 22px 8px', borderRadius: 8, whiteSpace: 'pre'}}>
                {renderTyped(p.text, n, i === 0 ? prefixLen : 0, hiWords, strike, t)}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
// typed text with a yellow prefix, yellow highlight words and red strike-through words
const renderTyped = (text: string, n: number, prefixLen: number, hiWords: string[], strike: {word: string; at: number}[], t: number) => {
  const marks: {from: number; to: number; kind: 'hi' | 'strike'; at?: number}[] = [];
  for (const w of hiWords) { const i = text.indexOf(w); if (i >= 0) marks.push({from: i, to: i + w.length, kind: 'hi'}); }
  for (const s of strike) { const i = text.indexOf(s.word); if (i >= 0) marks.push({from: i, to: i + s.word.length, kind: 'strike', at: s.at}); }
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const m = marks.find((x) => x.from === i);
    if (m) {
      const seg = text.slice(m.from, m.to);
      const vis = Math.max(0, Math.min(seg.length, n - m.from));
      const g = m.kind === 'strike' ? interpolate(t, [m.at!, m.at! + 0.35], [0, 1], clamp) : 0;
      out.push(
        <span key={i} style={{position: 'relative', color: m.kind === 'hi' ? YEL : g > 0 ? '#ff9a9b' : undefined}}>
          <span style={{visibility: 'visible'}}>{seg.slice(0, vis)}</span><span style={{visibility: 'hidden'}}>{seg.slice(vis)}</span>
          {g > 0 ? <span style={{position: 'absolute', left: 0, top: '52%', height: 6, width: `${g * 100}%`, background: RED, borderRadius: 3}} /> : null}
        </span>,
      );
      i = m.to;
      continue;
    }
    const next = Math.min(...marks.filter((x) => x.from > i).map((x) => x.from), text.length);
    const seg = text.slice(i, next);
    const vis = Math.max(0, Math.min(seg.length, n - i));
    const pre = Math.max(0, Math.min(seg.length, prefixLen - i));
    out.push(<span key={i}><span style={{color: YEL}}>{seg.slice(0, Math.min(vis, pre))}</span><span>{seg.slice(Math.min(vis, pre), vis)}</span><span style={{visibility: 'hidden'}}>{seg.slice(vis)}</span></span>);
    i = next;
  }
  return out;
};

// ====================== band chat gag (Kirk as the agent) ======================
export type ChatProps = {lines: string[]; lineAt?: number[]; durationSec: number};
export const Chat198: React.FC<ChatProps> = ({lines, lineAt}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const out = interpolate(frame, [durationInFrames - 0.25 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const plan = motifPlan(lines, lineAt);
  const k = spring({frame, fps, config: {damping: 14, stiffness: 170, mass: 0.6}});
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: out}}>
      <div style={{position: 'absolute', left: BAND198.x, top: BAND198.y, height: BAND198.h, display: 'flex', gap: 16, alignItems: 'center', opacity: Math.min(1, k * 1.4)}}>
        <div style={{width: 110, height: 110, borderRadius: 22, background: '#3a3f4b', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transform: `rotate(${Math.sin(t * 3) * 4}deg)`}}>
          <svg width={80} height={80}><rect x={10} y={18} width={60} height={46} rx={10} fill="#cfd6e4" /><circle cx={28} cy={40} r={6} fill="#111" /><circle cx={52} cy={40} r={6} fill="#111" /><rect x={30} y={52} width={20} height={4} rx={2} fill="#111" /><line x1={40} y1={4} x2={40} y2={18} stroke="#cfd6e4" strokeWidth={4} /><circle cx={40} cy={4} r={4} fill={RED} /></svg>
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          {plan.map((p, i) => {
            const n = Math.max(0, Math.min(p.text.length, Math.floor((t - p.at) * 30)));
            const s = pop(frame, p.at - 0.25, fps);
            if (s <= 0) return <div key={i} style={{height: 62}} />;
            return (
              <div key={i} style={{alignSelf: 'flex-start', background: '#2f6fed', color: '#fff', fontSize: 40, fontWeight: 600, padding: '6px 22px 8px', borderRadius: '8px 22px 22px 22px', whiteSpace: 'pre', transform: `scale(${Math.min(1, s)})`, transformOrigin: 'left center'}}>
                {p.text.slice(0, n)}<span style={{visibility: 'hidden'}}>{p.text.slice(n)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ====================== band prompt gag ======================
export type PromptProps = {text: string; stampAt: number; stamp: string; durationSec: number};
export const Prompt198: React.FC<PromptProps> = ({text, stampAt, stamp}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  font();
  const t = frame / fps;
  const out = interpolate(frame, [durationInFrames - 0.25 * fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  const k = spring({frame, fps, config: {damping: 14, stiffness: 170, mass: 0.6}});
  const n = Math.max(0, Math.min(text.length, Math.floor((t - 0.45) * 30)));
  const s = pop(frame, stampAt, fps);
  const blink = Math.floor(t * 2) % 2 === 0;
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, sans-serif', opacity: out}}>
      <div style={{position: 'absolute', left: BAND198.x, top: BAND198.y + 14, height: 116, width: 1480, display: 'flex', alignItems: 'center', opacity: Math.min(1, k * 1.4)}}>
        <div style={{background: '#17181c', border: '2px solid #4a4f5c', borderRadius: 14, padding: '14px 26px', fontFamily: MONO, fontSize: 38, color: '#e8ecf4', whiteSpace: 'pre'}}>
          <span style={{color: GREEN}}>{'> '}</span>{text.slice(0, n)}<span style={{display: 'inline-block', width: 20, height: 36, verticalAlign: -4, background: blink || n < text.length ? '#e8ecf4' : 'transparent'}} />
          <span style={{visibility: 'hidden'}}>{text.slice(n)}</span>
        </div>
        {s > 0 ? (
          <div style={{marginLeft: 24, padding: '6px 18px', border: `6px solid ${RED}`, borderRadius: 10, color: RED, fontWeight: 900, fontSize: 40, transform: `rotate(-8deg) scale(${1.8 - 0.8 * Math.min(1, s)})`, opacity: Math.min(1, s), whiteSpace: 'pre', textAlign: 'center', lineHeight: 1.05, background: 'rgba(17,17,17,0.85)'}}>{stamp}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ====================== dots: 13 live harms through AAA ======================
// 13 live harms acting alone: grok-4.7 7 (L9 x4, held-out x3), fable-5.2 3 (C18), haiku-5.5 1 (L9),
// gpt-6-astra 1 (C18), opus-5.5 1 (held-out). Clone gate: -6 (3 Fable restart harms + 3 Grok
// held-out). Auditor (claude-fable-5.2:medium): -6 (5 standby-index drops + gpt-6-astra). Left: 1.
export type DotsProps = {mode: 'gate' | 'full' | 'hero'; b: Record<string, number>; durationSec: number};
const HARMS: ('gate' | 'auditor' | 'none')[] = ['auditor', 'auditor', 'auditor', 'auditor', 'gate', 'gate', 'gate', 'gate', 'gate', 'gate', 'auditor', 'auditor', 'none'];
export const Dots198: React.FC<DotsProps> = ({mode, b}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  font();
  const t = frame / fps;
  const W = PANEL198.w;
  const R = 36, GAP = 104;
  const x0 = (W - GAP * 12) / 2;
  const rowY = 200;
  const bins = {gate: {x: mode === 'gate' ? W / 2 : 400, y: 470}, auditor: {x: 1160, y: 470}};
  const gateIdx = HARMS.map((h, i) => (h === 'gate' ? i : -1)).filter((i) => i >= 0);
  const audIdx = HARMS.map((h, i) => (h === 'auditor' ? i : -1)).filter((i) => i >= 0);
  const gateAt = b.gate ?? 1e9, audAt = mode === 'full' ? b.auditor : 1e9;
  const count = 13 - (t >= gateAt + 1.2 ? 6 : 0) - (t >= audAt + 1.2 ? 6 : 0);
  const spot = mode === 'full' ? ease(frame, b.left, b.left + 0.8, fps) : 0;
  const stampIn = mode === 'full' ? pop(frame, b.stamp, fps) : 0;
  const crack = mode === 'full' ? ease(frame, b.no, b.no + 0.7, fps) : 0;
  const binO = (at: number) => ease(frame, at - 0.6, at, fps);
  const gateHero = mode === 'gate' ? pop(frame, b.hero, fps) : 0;
  if (mode === 'hero') {
    const h = pop(frame, b.hero, fps);
    const p = ease(frame, b.pct, b.pct + 0.5, fps);
    return (
      <Panel>
        <Tag text="pgaibench.dev" />
        <div style={{position: 'absolute', left: 0, top: 70, width: W, textAlign: 'center', transform: `scale(${0.6 + 0.4 * Math.min(h, 1.08)})`, opacity: Math.min(1, h * 1.4)}}>
          <div style={{fontSize: 44, fontWeight: 700, color: DIM}}>live harms, acting alone → with AAA</div>
          <div style={{fontSize: 260, fontWeight: 900, color: '#fff', lineHeight: 1.05}}><span style={{color: RED}}>13</span> → <span style={{color: GREEN}}>1</span></div>
        </div>
        <div style={{position: 'absolute', left: 0, top: 440, width: W, textAlign: 'center', fontSize: 130, fontWeight: 900, color: GREEN, opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>−92.3%</div>
      </Panel>
    );
  }
  return (
    <Panel>
      <Title text={mode === 'gate' ? '13 live harms meet the clone gate' : '13 live harms through AAA'} />
      <div style={{position: 'absolute', right: 50, top: 6, fontSize: 130, fontWeight: 900, color: count === 1 ? GREEN : RED, fontVariantNumeric: 'tabular-nums', opacity: ease(frame, 0.4, 1, fps) * (1 - gateHero)}}>{count}</div>
      {[{k: 'gate' as const, at: gateAt, title: 'Clone gate  −6', sub: '$0 LLM', c: '#38C6D9'}, ...(mode === 'full' ? [{k: 'auditor' as const, at: audAt, title: 'Auditor  −6', sub: 'an independent model', c: AMBER}] : [])].map((x) => (
        <div key={x.k} style={{position: 'absolute', left: bins[x.k].x - 290, top: bins[x.k].y - 80, width: 580, height: 190, boxSizing: 'border-box', borderRadius: 14, border: `4px solid ${x.c}`, background: 'rgba(255,255,255,0.03)', opacity: binO(x.at) * (1 - spot) * (1 - gateHero), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12}}>
          <div style={{fontSize: 46, fontWeight: 800, color: x.c, whiteSpace: 'pre'}}>{x.title}</div>
          <div style={{fontSize: 32, color: DIM}}>{x.sub}</div>
        </div>
      ))}
      {HARMS.map((h, i) => {
        const home = {x: x0 + i * GAP, y: rowY};
        const appear = pop(frame, 0.5 + i * 0.1, fps);
        let p = home, sc = 1, o = Math.min(1, appear * 1.5);
        const by = mode === 'gate' && h === 'auditor' ? 'none' : h;
        if (by === 'gate' || by === 'auditor') {
          const at = by === 'gate' ? gateAt : audAt;
          const j = (by === 'gate' ? gateIdx : audIdx).indexOf(i);
          const g = ease(frame, at + j * 0.12, at + 0.9 + j * 0.12, fps);
          const target = {x: bins[by].x - 160 + j * 64, y: bins[by].y - 30};
          p = lerp(home, target, g);
          sc = 1 - 0.45 * g;
          o = o * (1 - 0.5 * g) * (1 - spot) * (1 - gateHero);
        } else if (mode === 'full') {
          p = lerp(home, {x: W / 2, y: 290}, spot);
          sc = 1 + 1.3 * spot;
        } else {
          o = o * (1 - gateHero);
        }
        const r = R * sc * (0.4 + 0.6 * appear);
        return <div key={i} style={{position: 'absolute', left: p.x - r, top: p.y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: RED, opacity: o, boxShadow: by === 'none' && spot > 0 ? `0 0 ${40 * spot}px ${RED}` : undefined}} />;
      })}
      {spot > 0 ? (
        <div style={{position: 'absolute', left: W / 2 - 500, top: 400, width: 1000, textAlign: 'center', opacity: spot}}>
          <div style={{fontFamily: MONO, fontSize: 46, color: '#fff', fontWeight: 600}}>claude-opus-5.5</div>
          <div style={{fontSize: 36, color: DIM, marginTop: 6}}>held-out task · passed both gates</div>
        </div>
      ) : null}
      {stampIn > 0 && t < b.no + 1.6 ? (
        <div style={{position: 'absolute', left: W / 2 - 250, top: 260, width: 500, height: 200, border: `10px solid ${GREEN}`, borderRadius: 20, color: GREEN, fontSize: 130, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${-8 + 30 * crack}deg) scale(${(1.4 - 0.4 * Math.min(stampIn, 1)) * (1 - 0.2 * crack)}) translateY(${crack * 260}px)`, opacity: Math.min(1, stampIn) * (1 - interpolate(t, [b.no + 0.8, b.no + 1.5], [0, 1], clamp)), background: 'rgba(22,22,28,0.9)'}}>
          100%<span style={{fontSize: 80}}>?</span>
        </div>
      ) : null}
      {gateHero > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 120, width: W, textAlign: 'center', transform: `scale(${0.6 + 0.4 * Math.min(gateHero, 1.08)})`, opacity: Math.min(1, gateHero * 1.4)}}>
          <div style={{fontSize: 200, fontWeight: 900, color: '#fff', lineHeight: 1}}><span style={{color: '#38C6D9'}}>6</span> of 13</div>
          <div style={{fontSize: 60, fontWeight: 800, color: '#38C6D9', marginTop: 10}}>stopped by testing alone</div>
          <div style={{fontSize: 120, fontWeight: 900, color: GREEN, marginTop: 10}}>$0 LLM</div>
        </div>
      ) : null}
    </Panel>
  );
};

// ====================== 378 safe changes, 1 block (row 29) ======================
export type SafeProps = {b: Record<string, number>; durationSec: number};
export const Safe198: React.FC<SafeProps> = ({b}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  font();
  const COLS = 27, ROWS = 14, S = 22, G = 6; // 27 x 14 = 378
  const gx = 60, gy = 110;
  const one = ease(frame, b.one, b.one + 0.5, fps);
  const hero = pop(frame, b.hero, fps);
  const note = ease(frame, b.note, b.note + 0.5, fps);
  const idx = 13 * COLS + 26; // the last dot
  return (
    <Panel>
      <Title text="378 safe or unclassified changes" />
      <Tag text="pgaibench.dev" />
      {Array.from({length: COLS * ROWS}, (_, i) => {
        const c = i % COLS, r = Math.floor(i / COLS);
        const a = ease(frame, 0.4 + (c + r) * 0.04, 0.8 + (c + r) * 0.04, fps);
        const isOne = i === idx;
        return <div key={i} style={{position: 'absolute', left: gx + c * (S + G), top: gy + r * (S + G), width: S, height: S, borderRadius: '50%', background: isOne && one > 0 ? AMBER : GREEN, opacity: a * (isOne ? 1 : 0.85), transform: `scale(${isOne ? 1 + 0.8 * one : a})`, boxShadow: isOne && one > 0 ? `0 0 ${20 * one}px ${AMBER}` : undefined}} />;
      })}
      <div style={{position: 'absolute', left: 860, top: 110, width: 660, opacity: Math.min(1, hero), transform: `scale(${0.7 + 0.3 * Math.min(1, hero)})`, transformOrigin: 'left top'}}>
        <div style={{fontSize: 160, fontWeight: 900, color: GREEN, lineHeight: 1}}>377</div>
        <div style={{fontSize: 44, fontWeight: 700, color: '#fff'}}>of 378 still approved</div>
        <div style={{fontSize: 120, fontWeight: 900, color: GREEN, lineHeight: 1.1, marginTop: 6}}>99.7%</div>
      </div>
      <div style={{position: 'absolute', left: 860, top: 500, width: 660, opacity: note}}>
        <div style={{fontSize: 36, fontWeight: 800, color: AMBER}}>The 1 block: a real lock bug</div>
        <div style={{fontSize: 30, color: DIM, fontFamily: MONO}}>L5 · 10M-row scan in one DO block</div>
      </div>
    </Panel>
  );
};

// ====================== 19 scenario cards (row 6) ======================
export type CardsProps = {b: Record<string, number>; durationSec: number};
export const Cards198: React.FC<CardsProps> = ({b}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  font();
  const groups = [
    ...Array.from({length: 14}, () => ({c: '#4C8DFF', l: ''})),
    {c: AMBER, l: 'O3'}, {c: AMBER, l: 'S1'},
    ...Array.from({length: 3}, () => ({c: '#555a66', l: '?'})),
  ];
  const CW = 100, CH = 140, GAP = 14;
  const hero = pop(frame, b.hero, fps);
  const legend = ease(frame, b.legend, b.legend + 0.5, fps);
  return (
    <Panel>
      <Title text="PGAIBench v0.2: live scenarios" />
      <Tag text="pgaibench.dev" />
      {groups.map((g, i) => {
        const row = i < 10 ? 0 : 1;
        const col = i < 10 ? i : i - 10;
        const x = 60 + col * (CW + GAP) + (row ? (CW + GAP) / 2 : 0);
        const y = 110 + row * (CH + 24);
        const s = pop(frame, 0.5 + i * 0.16, fps);
        if (s <= 0) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: CW, height: CH, borderRadius: 12, background: g.c, border: '3px solid rgba(255,255,255,0.8)', transform: `translateY(${(1 - Math.min(1, s)) * -300}px) rotate(${(1 - Math.min(1, s)) * 25 + ((i * 37) % 7) - 3}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#111', fontFamily: MONO, backgroundImage: g.l === '?' ? 'repeating-linear-gradient(45deg, #555a66 0 10px, #4a4e58 10px 20px)' : undefined}}>{g.l}</div>
        );
      })}
      <div style={{position: 'absolute', left: 1240, top: 90, width: 300, textAlign: 'center', opacity: Math.min(1, hero), transform: `scale(${0.6 + 0.4 * Math.min(hero, 1.08)})`}}>
        <div style={{fontSize: 240, fontWeight: 900, color: '#fff', lineHeight: 1}}>19</div>
        <div style={{fontSize: 34, color: DIM}}>× 5 repeats</div>
      </div>
      <div style={{position: 'absolute', left: 60, top: 470, display: 'flex', gap: 50, fontSize: 36, fontWeight: 700, opacity: legend}}>
        <span style={{color: '#7fb0ff'}}>14 core</span><span style={{color: AMBER}}>2 exploratory</span><span style={{color: '#9aa0ad'}}>3 held-out</span>
      </div>
      <div style={{position: 'absolute', left: 60, top: 560, fontSize: 32, color: DIM, opacity: legend}}>{'10 models · 949 live runs'}</div>
    </Panel>
  );
};

// ====================== funnel (row 15) ======================
export type FunnelProps = {b: Record<string, number>; durationSec: number};
export const Funnel198: React.FC<FunnelProps> = ({b}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  font();
  const rows = [
    {n: 949, l: 'runs', c: '#7f8aa3'},
    {n: 552, l: 'entered rehearsal', c: '#7f8aa3'},
    {n: 408, l: 'ran on a live primary', c: '#9B8CFF'},
    {n: 13, l: 'caused measured harm', c: RED},
  ];
  const MAXW = 1000; // linear: 949 = 1000 px
  const hero = pop(frame, b.hero, fps);
  return (
    <Panel>
      <Title text="Track 1: models acting alone" />
      <Tag text="pgaibench.dev" />
      {rows.map((r, i) => {
        const at = 0.5 + i * (b.step ?? 0.9);
        const g = ease(frame, at, at + 0.7, fps);
        const w = Math.max(8, MAXW * (r.n / 949)) * g;
        const y = 110 + i * 120;
        return (
          <div key={i} style={{position: 'absolute', left: 60, top: y, opacity: Math.min(1, g * 2)}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: w, height: 80, background: r.c, borderRadius: 8}} />
            <div style={{position: 'absolute', left: w + 20, top: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'baseline', gap: 18}}>
              <span style={{fontSize: 70, fontWeight: 900, color: i === 3 ? RED : '#fff', fontVariantNumeric: 'tabular-nums'}}>{Math.round(r.n * g).toLocaleString('en-US')}</span>
              <span style={{fontSize: 36, color: DIM}}>{r.l}</span>
            </div>
          </div>
        );
      })}
      {hero > 0 ? (
        <div style={{position: 'absolute', right: 60, top: 400, textAlign: 'right', opacity: Math.min(1, hero), transform: `scale(${0.6 + 0.4 * Math.min(1.08, hero)})`, transformOrigin: 'right center'}}>
          <div style={{fontSize: 150, fontWeight: 900, color: RED, lineHeight: 1}}>3.2%</div>
          <div style={{fontSize: 34, color: DIM}}>of live changes</div>
        </div>
      ) : null}
    </Panel>
  );
};

// ====================== deterministic Actor vs production (row 19) ======================
export type DetProps = {b: Record<string, number>; durationSec: number};
export const Det198: React.FC<DetProps> = ({b}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  font();
  const t = frame / fps;
  const left = ease(frame, 0.3, 0.9, fps);
  const right = ease(frame, b.prod, b.prod + 0.6, fps);
  const steps = ['step 1', 'step 2', 'step 3'];
  const cyc = 3.2; // the script reruns, identical every time
  const chips = [{at: b.backup, l: 'backup running?'}, {at: b.backup + 1.6, l: 'something else running?'}, {at: b.peak, l: 'peak 15 minutes?'}];
  const shake = right > 0 ? Math.sin(t * 9) * 3 * right : 0;
  return (
    <Panel>
      <div style={{position: 'absolute', left: 40, top: 30, width: 700, opacity: left}}>
        <div style={{fontSize: 60, fontWeight: 900, color: GREEN}}>The Actor</div>
        <div style={{fontSize: 40, color: '#fff', fontWeight: 700}}>is deterministic.</div>
        <div style={{marginTop: 30, background: '#111', borderRadius: 12, padding: '20px 26px', fontFamily: MONO, fontSize: 40, lineHeight: 1.5, color: '#e8ecf4'}}>
          {steps.map((s, i) => {
            const ph = ((t - 0.6) % cyc + cyc) % cyc;
            const ok = t > 0.6 && ph > 0.6 + i * 0.7;
            return <div key={i}>{s} <span style={{color: GREEN, opacity: ok ? 1 : 0.15}}>✓</span></div>;
          })}
          <div style={{fontSize: 30, color: DIM, marginTop: 8}}>run {Math.max(1, Math.floor((t - 0.6) / cyc) + 1)}: same steps</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 800, top: 30, width: 720, opacity: right, transform: `translateX(${shake}px)`}}>
        <div style={{fontSize: 60, fontWeight: 900, color: RED}}>Production</div>
        <div style={{fontSize: 40, color: '#fff', fontWeight: 700}}>is not.</div>
        <div style={{position: 'relative', height: 380, marginTop: 30}}>
          {chips.map((c, i) => {
            const s = pop(frame, c.at, fps);
            if (s <= 0) return null;
            return <div key={i} style={{position: 'absolute', left: [10, 220, 60][i], top: [10, 140, 270][i], padding: '10px 24px', borderRadius: 40, background: '#3a1f24', border: `3px solid ${RED}`, color: '#ffd6d6', fontSize: 40, fontWeight: 700, transform: `scale(${Math.min(1.1, s)}) rotate(${[-4, 3, -2][i]}deg)`, whiteSpace: 'nowrap'}}>{c.l}</div>;
          })}
        </div>
      </div>
    </Panel>
  );
};

// ====================== leaderboard reveal (Track 1 k = 5, sorted by adjudicated correct) ======================
export type Board198Props = {b: Record<string, number>; durationSec: number};
const ROWS: {m: string; correct: number; harm: number}[] = [
  {m: 'sonnet-5.5', correct: 65, harm: 0},
  {m: 'fable-5.2', correct: 65, harm: 3},
  {m: 'opus-5.5', correct: 58, harm: 1},
  {m: 'haiku-5.5', correct: 55, harm: 1},
  {m: 'gpt-6.2-astra', correct: 50, harm: 0},
  {m: 'grok-4.7', correct: 50, harm: 7},
  {m: 'gpt-6-astra', correct: 46, harm: 1},
  {m: 'gemini-4-carbon', correct: 37, harm: 0},
  {m: 'gpt-6.2-sol', correct: 36, harm: 0},
  {m: 'glm-5.3', correct: 7, harm: 0},
];
export const Board198: React.FC<Board198Props> = ({b}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  font();
  const RH = 54, top = 108, L = 40;
  const BARX = 380, BARW = 420; // linear, 0 -> 65
  const HX = 960;
  const harmCol = ease(frame, b.harm - 0.6, b.harm, fps);
  const fableHi = ease(frame, b.fable, b.fable + 0.5, fps);
  const tie = pop(frame, b.tie, fps);
  const verdict = pop(frame, b.harm + 1.6, fps);
  return (
    <Panel>
      <div style={{position: 'absolute', left: L, top: 14, fontSize: 44, fontWeight: 800, color: '#fff'}}>Models acting alone: correct runs</div>
      <Tag text="pgaibench.dev" />
      <div style={{position: 'absolute', left: HX, top: 62, fontSize: 34, fontWeight: 800, color: RED, opacity: harmCol}}>live harms</div>
      {ROWS.map((r, i) => {
        const y = top + i * RH;
        const a = ease(frame, 0.4 + i * 0.16, 0.9 + i * 0.16, fps);
        const g = ease(frame, 0.7 + i * 0.16, 1.6 + i * 0.16, fps);
        const isF = i === 1;
        const w = BARW * (r.correct / 65) * g;
        return (
          <div key={i} style={{position: 'absolute', left: 16, top: y, width: PANEL198.w - 32, height: RH - 4, background: isF ? `rgba(255,77,79,${0.22 * fableHi})` : 'transparent', borderRadius: 8, opacity: a}}>
            <div style={{position: 'absolute', left: 20, top: 4, fontFamily: MONO, fontSize: 36, color: '#fff', fontWeight: isF ? 700 : 500}}>{r.m}</div>
            <div style={{position: 'absolute', left: BARX, top: 9, height: 32, width: w, background: i < 2 ? YEL : '#7f8aa3', borderRadius: 5}} />
            <div style={{position: 'absolute', left: BARX + w + 12, top: 2, fontSize: 38, fontWeight: 900, color: i < 2 ? YEL : '#fff', fontVariantNumeric: 'tabular-nums'}}>{Math.round(r.correct * g)}</div>
            <div style={{position: 'absolute', left: HX - 16, top: 9, display: 'flex', gap: 7, alignItems: 'center'}}>
              {r.harm === 0 ? <span style={{fontSize: 34, color: 'rgba(255,255,255,0.4)', opacity: harmCol, lineHeight: '32px'}}>0</span> : Array.from({length: r.harm}, (_, j) => {
                const s = pop(frame, b.harm + (isF ? 0 : 0.5) + j * 0.12, fps);
                return <div key={j} style={{width: 32, height: 32, borderRadius: 6, background: RED, transform: `scale(${s})`, boxShadow: isF ? `0 0 14px ${RED}` : undefined}} />;
              })}
            </div>
          </div>
        );
      })}
      {tie > 0 ? (
        <div style={{position: 'absolute', left: 1080, top: top - 6, padding: '6px 22px', border: `6px solid ${YEL}`, borderRadius: 12, color: YEL, fontWeight: 900, fontSize: 64, transform: `rotate(-8deg) scale(${1.6 - 0.6 * Math.min(tie, 1)})`, opacity: Math.min(1, tie) * (1 - verdict), background: 'rgba(22,22,28,0.9)'}}>TIE: 65</div>
      ) : null}
      {verdict > 0 ? (
        <div style={{position: 'absolute', left: 1250, top: top + 90, width: 290, textAlign: 'center', transform: `rotate(-6deg) scale(${1.5 - 0.5 * Math.min(verdict, 1)})`, opacity: Math.min(1, verdict), padding: '10px 8px', border: `6px solid ${RED}`, borderRadius: 12, background: 'rgba(22,22,28,0.92)'}}>
          <div style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>#1 and</div>
          <div style={{fontSize: 120, fontWeight: 900, color: RED, lineHeight: 1}}>3</div>
          <div style={{fontSize: 36, fontWeight: 800, color: RED}}>live harms</div>
        </div>
      ) : null}
    </Panel>
  );
};
