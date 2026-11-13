import React, {useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';

// Outro v2 (ep 196). Same structure and timing as the ep 195 Outro3: two separate frames.
//  1. 0 .. 13.76 s: "In this episode:" + the DBLab Forge experiment (one result, the public brief URL).
//  2. 13.76 s .. end: "Prepared by:" + the v1 Postgres.AI wordmark animation.
// The change is on beat 26 (13.78 s). Frame 1 dissolves back into grain over the last 0.3 s,
// then a clean cut to frame 2. Music: a-shades-outro.wav, aligned by compose exactly as in
// ep 195 (logo time = outro time - 13.44 s). Beats: 0.33 + k * 60/116.
// On-screen facts: public brief V6.1 only (Table C, PG18: 0 idle 502 tx/s, 5,000 idle 127 tx/s).
const FPS = 25;
const BEAT = 60 / 116, T0 = 0.33;
const B = (k: number) => T0 + k * BEAT;
const BG = 'rgb(236,233,224)';
const INK = '#0d0d10', GREY = '#57534c', DOT = '#f26a21';
// v1 wordmark, settled: x 484..1434, y 656..792 (cap top .. descender). Frame 1 uses the same width.
const WM = {x: 484, w: 950, top: 656, h: 136};
// Public brief (shown on two lines below): console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d

let fontsP: Promise<void> | null = null;
const loadFonts = () => fontsP ??= Promise.all(([
  ['Archivo', 'fonts/Archivo-var.woff2', {weight: '100 900', stretch: '62% 125%'}],
  ['JetBrains Mono', 'fonts/JetBrainsMono-Medium.ttf', {weight: '500'}],
] as [string, string, Record<string, string>][]).map(([fam, f, d]) => new FontFace(fam, `url(${staticFile(f)})`, d).load().then((ff) => { document.fonts.add(ff); })))
  .then(() => undefined);

const lin = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const archivo = (weight: number, stretch: number, color: string): React.CSSProperties => ({fontFamily: 'Archivo', fontWeight: weight, fontStretch: `${stretch}%`, color});
const MONO: React.CSSProperties = {fontFamily: '"JetBrains Mono"', fontWeight: 500, letterSpacing: '0.01em'};
const KICK = 44;
const KICK_STYLE: React.CSSProperties = {...MONO, color: GREY, fontSize: KICK, lineHeight: 1, whiteSpace: 'pre'};

// Frame 1 lines. fit: fitted to the wordmark width (flush left and right); otherwise `size` px.
// gap: space above the line, in units of its own font size.
type Line = {key: string; text: React.ReactNode; style: React.CSSProperties; fit?: boolean; size?: number; gap: number; at: number};
const LINES: Line[] = [
  {key: 'name', at: B(2), fit: true, gap: 0, style: archivo(800, 112, INK), text: 'DBLab Forge experiment'},
  {key: 'what', at: B(5), fit: true, gap: 0.9, style: archivo(600, 106, INK), text: 'Temp tables vs. 5,000 idle sessions'},
  {key: 'num', at: B(7), fit: true, gap: 0.12, style: archivo(800, 100, INK),
    text: <>502 <span style={{color: GREY, fontWeight: 400}}>{'→'}</span> <span style={{color: DOT}}>127</span> tx/s</>},
  {key: 'ctx', at: B(8), fit: true, gap: 0.5, style: {...MONO, color: GREY}, text: 'idle 0 \u2192 5,000 \u00b7 PG18 \u00b7 500 DDL tx/s target \u00b7 synthetic'},
  {key: 'url1', at: B(10), fit: true, gap: 1.0, style: {...MONO, color: GREY}, text: <><span style={{color: INK}}>console.postgres.ai</span>/shared/brief/</>},
  {key: 'url2', at: B(10.5), fit: true, gap: 0.12, style: {...MONO, color: GREY}, text: 'dfe99713-f5a8-483b-9aab-1606a883b75d'},
];
// The two URL lines must be fitted at the same size: use the smaller of the two.
const SAME = ['url1', 'url2'];

// Stipple dissolve: the text assembles from grain, like the particle wordmark.
const Dissolve: React.FC<{id: string; p: number}> = ({id, p}) => {
  const b = 12 * (0.1 - (1 - p) * 1.15);
  return (
    <svg width={0} height={0} style={{position: 'absolute'}}>
      <filter id={id} x="-5%" y="-30%" width="110%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed={7} result="n" />
        <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  12 0 0 0 ${b}`} result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
    </svg>
  );
};

const CUT = 344, LOGO_SKIP = 8;

export const OutroForge: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const meas = useRef<HTMLDivElement>(null);
  const [sz, setSz] = useState<number[] | null>(null);
  const [h] = useState(() => delayRender('measure'));
  useLayoutEffect(() => {
    if (sz || !meas.current) return;
    const go = () => {
      const kids = Array.from(meas.current!.children) as HTMLElement[];
      const s = LINES.map((l, i) => (l.fit ? (100 * WM.w) / kids[i].getBoundingClientRect().width : l.size!));
      const same = Math.min(...LINES.map((l, i) => (SAME.includes(l.key) ? s[i] : Infinity)));
      setSz(LINES.map((l, i) => (SAME.includes(l.key) ? same : s[i])));
      continueRender(h);
    };
    loadFonts().then(() => document.fonts.ready).then(() => requestAnimationFrame(() => requestAnimationFrame(go)));
  }, [sz, h]);

  // Frame 1 layout: kicker + lines, centred as a group.
  const s = sz ?? LINES.map(() => 60);
  const kGap = 0.75 * KICK;
  const total = KICK + kGap + LINES.reduce((a, l, i) => a + s[i] * (1 + l.gap), 0);
  const kTop = (1080 - total) / 2;
  const ys: number[] = [];
  LINES.reduce((y, l, i) => { const top = y + l.gap * s[i]; ys.push(top); return top + s[i]; }, kTop + KICK + kGap);
  const out1 = 1 - lin(t, CUT / FPS - 0.3, CUT / FPS);
  const reveal = (at: number) => ease(lin(t, at - 0.06, at + 0.6)) * out1;

  // Frame 2 (as Outro3).
  const lt = (f - CUT + LOGO_SKIP) / FPS;
  const gap2 = 0.75 * KICK;
  const top2 = (1080 - (KICK + gap2 + WM.h)) / 2;
  const shift = top2 + KICK + gap2 - WM.top;
  const dy = shift * easeInOut(lin(lt, 4.3, 5.15));
  const band = lt >= 4.5;
  const bandMask = `linear-gradient(180deg, transparent ${WM.top - 90}px, black ${WM.top - 60}px, black ${WM.top + WM.h + 40}px, transparent ${WM.top + WM.h + 80}px)`;
  const byP = ease(lin(lt, B(10) - 0.06, B(10) + 0.6));

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <Img src={staticFile('plate.png')} style={{position: 'absolute', inset: 0}} />

      <div ref={meas} style={{position: 'absolute', left: 0, top: -2000, visibility: 'hidden', whiteSpace: 'nowrap'}}>
        {LINES.map((l) => <div key={l.key} style={{...l.style, fontSize: 100, lineHeight: 1, display: 'inline-block', whiteSpace: 'pre'}}>{l.text}</div>)}
      </div>

      {sz && f < CUT && (
        <>
          {/* FRAME 1: DBLab Forge experiment */}
          <Dissolve id="d-kick1" p={reveal(B(1))} />
          <div style={{...KICK_STYLE, position: 'absolute', left: WM.x, top: kTop, filter: reveal(B(1)) < 1 ? 'url(#d-kick1)' : undefined}}>In this episode:</div>
          {LINES.map((l, i) => {
            const p = reveal(l.at);
            return (
              <React.Fragment key={l.key}>
                <Dissolve id={`d-${l.key}`} p={p} />
                <div style={{...l.style, position: 'absolute', left: WM.x, top: ys[i], fontSize: s[i], lineHeight: 1, whiteSpace: 'pre',
                  filter: p < 1 ? `url(#d-${l.key})` : undefined}}>{l.text}</div>
              </React.Fragment>
            );
          })}
        </>
      )}

      {f >= CUT && (
        <>
          {/* FRAME 2: PostgresAI */}
          <Sequence from={CUT} layout="none">
            <AbsoluteFill style={{transform: `translateY(${dy}px)`, ...(band ? {maskImage: bandMask, WebkitMaskImage: bandMask} : {})}}>
              <OffthreadVideo src={staticFile('logo-v1.mp4')} startFrom={LOGO_SKIP} muted style={{width: 1920, height: 1080}} />
            </AbsoluteFill>
          </Sequence>
          {sz && (
            <>
              <Dissolve id="d-by" p={byP} />
              <div style={{...KICK_STYLE, position: 'absolute', left: WM.x, top: top2,
                filter: byP < 1 ? 'url(#d-by)' : undefined, transform: `translateY(${(1 - byP) * 14}px)`}}>Prepared by:</div>
            </>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};
