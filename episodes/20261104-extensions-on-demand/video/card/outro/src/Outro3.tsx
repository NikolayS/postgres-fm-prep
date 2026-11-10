import React, {useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame} from 'remotion';

// Outro v3 (ep 195). Two separate frames, because StackGres and PostgresAI are different
// companies and must not share a frame:
//  1. 0 .. 13.76 s: StackGres alone (logo, stackgres.io, sgcr.io). No PostgresAI mark.
//  2. 13.76 s .. end: "Prepared by PostgresAI" + the v1 Postgres.AI wordmark animation.
// The change is on beat 26 (13.78 s; detected onset 13.77 s), about 61/39. Frame 1 dissolves
// back into grain over the last 0.3 s, then a clean cut to frame 2.
// Music: a-shades-outro.wav, the logo starts 28.642 s into it (compose lines the bed's end up
// with the episode end). Beats in logo time: 0.33 + k * 60/116 (downbeats k = 0, 4, 8, 12...).
const FPS = 25, W = 1920;
const BEAT = 60 / 116, T0 = 0.33;
const B = (k: number) => T0 + k * BEAT;
const BG = 'rgb(236,233,224)';
const INK = '#0d0d10', GREY = '#57534c';
// v1 wordmark, settled: x 484..1434, y 656..792 (cap top .. descender).
const WM = {x: 484, w: 950, top: 656, h: 136};

// One shared promise: fonts are added once, measuring waits for them.
let fontsP: Promise<void> | null = null;
const loadFonts = () => fontsP ??= Promise.all(([
  ['Archivo', 'fonts/Archivo-var.woff2', {weight: '100 900', stretch: '62% 125%'}],
  ['Exo 2', 'fonts/Exo2-Regular.woff2', {weight: '400'}],
  ['JetBrains Mono', 'fonts/JetBrainsMono-Medium.ttf', {weight: '500'}],
  ['Exo 2', 'fonts/Exo2-Bold.woff2', {weight: '700'}],
] as [string, string, Record<string, string>][]).map(([fam, f, d]) => new FontFace(fam, `url(${staticFile(f)})`, d).load().then((ff) => { document.fonts.add(ff); })))
  .then(() => undefined);
const EXO = '"Exo 2"';

const lin = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Lines of the lockup. Every line is fitted to the wordmark width (flush left and right),
// except the "Prepared by" kicker, which is set at the v1 kicker size, flush left.
type Line = {key: string; text: React.ReactNode; style: React.CSSProperties; fit: boolean; at: number};
const archivo = (weight: number, stretch: number, color: string): React.CSSProperties => ({fontFamily: 'Archivo', fontWeight: weight, fontStretch: `${stretch}%`, color});
const LINES: Line[] = [
  {key: 'url', at: B(6), fit: true, style: archivo(400, 100, GREY),
    text: <><span style={{color: INK, fontWeight: 600}}>stackgres.io</span>{'  ·  the full-stack Postgres platform'}</>},
  {key: 'sgcr', at: B(8), fit: true, style: archivo(800, 112, INK), text: 'stackgres.io/containers'},
  {key: 'reg', at: B(9), fit: true, style: archivo(600, 106, INK), text: 'StackGres Containers · extensions on demand'},
];

// StackGres icon (official, inline SVG from the stackgres.io header), split into its layers so
// they can drop in one by one: slab, disc, diamond, wedge.
const SG_LAYERS: {d: string; fill: string}[][] = [
  [{fill: '#42a8c8', d: 'M5.2 273.7l110.7 126.8h268.2l110.7-126.8-110.7-126.8H115.9z'}, {fill: '#426d88', d: 'M115.9 400.5h268.4v56.4H115.9z'},
    {fill: '#428bb4', d: 'M115.9 456.8 5.2 330v-56.3l110.7 126.8z'}, {fill: '#16657c', d: 'M384.1 456.8 494.8 330v-56.3L384.1 400.5z'}],
  [{fill: '#39b54a', d: 'M465.7 253.4c0-47-96.6-85.2-215.7-85.2S34.4 206.3 34.4 253.4s96.5 85.2 215.6 85.2 215.7-38.2 215.7-85.2z'},
    {fill: '#009245', d: 'M465.7 253.4c0 47-96.6 85.2-215.7 85.2S34.4 300.4 34.4 253.4v46.9c14.9 41.3 106.5 85.2 215.6 85.2s200.8-43.9 215.7-85.2v-46.9z'}],
  [{fill: '#f2c63f', d: 'M16.3 178.6 250 314.1l233.8-135.5L250 43.2z'}, {fill: '#f2b136', d: 'M16.3 178.6v52.8L250 366.9v-52.8z'},
    {fill: '#f2a130', d: 'M483.8 178.6 250 314.1v52.8l233.8-135.5z'}],
  [{fill: '#ff7124', d: 'M68 212.4l364.1-53-92.4-106z'}, {fill: '#d93d1b', d: 'M68 212.4l364.1-53v47.8L68 260.1z'}],
];
const SG_AT = [B(2), B(2.5), B(3), B(3.5)];

const SgIcon: React.FC<{size: number; f: number}> = ({size, f}) => (
  <svg width={size} height={size} viewBox="0 0 500 500" style={{overflow: 'visible'}}>
    {SG_LAYERS.map((layer, i) => {
      const s = spring({frame: f - Math.round(SG_AT[i] * FPS), fps: FPS, config: {damping: 12, stiffness: 190, mass: 0.6}});
      if (s <= 0.001) return null;
      return (
        <g key={i} style={{transform: `translateY(${(1 - s) * -260}px)`, opacity: Math.min(1, s * 3)}}>
          {layer.map((p, j) => <path key={j} d={p.d} fill={p.fill} />)}
        </g>
      );
    })}
  </svg>
);

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


// Frame change: beat 26 = 13.78 s -> frame 344 (13.76 s). Frame 2 plays logo-v1.mp4 so that its
// own beat grid stays on the music: logo time = outro time - 13.44 s (26 beats less its 0.33 s
// lead), i.e. it starts at its frame 8 (clean, particles mid-assembly; dot lands on beat 29).
const CUT = 344, LOGO_SKIP = 8;
const BY_STYLE = archivo(400, 100, GREY);
// Kicker over each frame ("In this episode:", "Prepared by:"): JetBrains Mono, small, grey.
const KICK = 44;
const KICK_STYLE: React.CSSProperties = {fontFamily: '"JetBrains Mono"', fontWeight: 500, color: GREY, letterSpacing: '0.01em', fontSize: KICK, lineHeight: 1, whiteSpace: 'pre'};

type Metrics = {logoFont: number; sizes: number[]; by: number};

export const Outro3: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const meas = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<Metrics | null>(null);
  const [h] = useState(() => delayRender('measure'));
  useLayoutEffect(() => {
    if (m || !meas.current) return;
    const go = () => {
      const kids = Array.from(meas.current!.children) as HTMLElement[];
      const wLogo = kids[0].getBoundingClientRect().width;
      const sizes = LINES.map((l, i) => (100 * WM.w) / kids[i + 1].getBoundingClientRect().width);
      const by = (100 * WM.w) / kids[LINES.length + 1].getBoundingClientRect().width;
      setM({logoFont: (100 * WM.w) / wLogo, sizes, by});
      continueRender(h);
    };
    loadFonts().then(() => document.fonts.ready).then(() => requestAnimationFrame(() => requestAnimationFrame(go)));
  }, [m, h]);

  const logoFont = m?.logoFont ?? 140;
  const sz = m?.sizes ?? LINES.map(() => 60);
  const byFont = KICK;

  // Frame 1 layout: logo, url, sgcr, registry; centred as a group.
  const logoH = logoFont * 1.15;
  const gaps = [0.16 * logoFont, 0.95 * sz[1], 0.10 * sz[2]];
  const boxes = [logoH, sz[0], sz[1], sz[2]];
  const total = boxes.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  const ys: number[] = [];
  const kGap1 = 0.75 * KICK;
  const y0 = (1080 - (total + KICK + kGap1)) / 2 + KICK + kGap1;
  const kTop1 = y0 - kGap1 - KICK;
  boxes.reduce((y, b, i) => { ys.push(y); return y + b + (gaps[i] ?? 0); }, y0);
  // Frame 1 out: the whole lockup dissolves back into grain over the last 0.3 s.
  const out1 = 1 - lin(t, CUT / FPS - 0.3, CUT / FPS);
  const reveal = (at: number) => ease(lin(t, at - 0.06, at + 0.6)) * out1;
  const logoTextP = reveal(B(4));

  // Frame 2 layout: kicker (fitted) + wordmark, centred as a group.
  const lt = (f - CUT + LOGO_SKIP) / FPS; // logo-v1 time
  const gap2 = 0.75 * byFont;
  const top2 = (1080 - (byFont + gap2 + WM.h)) / 2;
  const wmTop = top2 + byFont + gap2;
  const shift = wmTop - WM.top;
  const dy = shift * easeInOut(lin(lt, 4.3, 5.15));
  const band = lt >= 4.5;
  const bandMask = `linear-gradient(180deg, transparent ${WM.top - 90}px, black ${WM.top - 60}px, black ${WM.top + WM.h + 40}px, transparent ${WM.top + WM.h + 80}px)`;
  const byP = ease(lin(lt, B(10) - 0.06, B(10) + 0.6)); // logo beat 10, one beat after the wordmark settles

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <Img src={staticFile('plate.png')} style={{position: 'absolute', inset: 0}} />

      <div ref={meas} style={{position: 'absolute', left: 0, top: -2000, visibility: 'hidden', whiteSpace: 'nowrap'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', fontFamily: EXO, fontSize: 100, lineHeight: 1}}>
          <span style={{width: 115, height: 100, flex: 'none'}} /><span style={{width: 10, flex: 'none'}} />
          <span>Stack<b style={{fontWeight: 700}}>Gres</b></span>
        </div>
        {LINES.map((l) => <div key={l.key} style={{...l.style, fontSize: 100, lineHeight: 1, display: 'inline-block', whiteSpace: 'pre'}}>{l.text}</div>)}
        <div style={{...BY_STYLE, fontSize: 100, lineHeight: 1, display: 'inline-block', whiteSpace: 'pre'}}>Prepared by PostgresAI</div>
      </div>

      {m && f < CUT && (
        <>
          {/* FRAME 1: StackGres only */}
          <Dissolve id="d-kick1" p={reveal(B(1))} />
          <div style={{...KICK_STYLE, position: 'absolute', left: WM.x, top: kTop1, filter: reveal(B(1)) < 1 ? 'url(#d-kick1)' : undefined}}>In this episode:</div>
          <div style={{position: 'absolute', left: WM.x, top: ys[0], height: logoH, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap'}}>
            <Dissolve id="d-icon" p={out1} />
            <div style={{width: logoFont * 1.15, height: logoFont * 1.15, flex: 'none', filter: out1 < 1 ? 'url(#d-icon)' : undefined}}><SgIcon size={logoFont * 1.15} f={f} /></div>
            <div style={{width: logoFont * 0.1, flex: 'none'}} />
            <Dissolve id="d-logo" p={logoTextP} />
            <div style={{fontFamily: EXO, fontWeight: 400, fontSize: logoFont, lineHeight: 1, color: INK, filter: logoTextP < 1 ? 'url(#d-logo)' : undefined,
              transform: `translateX(${(1 - Math.min(1, logoTextP / Math.max(out1, 0.001))) * 30}px)`}}>
              Stack<b style={{fontWeight: 700}}>Gres</b>
            </div>
          </div>
          {LINES.map((l, i) => {
            const p = reveal(l.at);
            return (
              <React.Fragment key={l.key}>
                <Dissolve id={`d-${l.key}`} p={p} />
                <div style={{...l.style, position: 'absolute', left: WM.x, top: ys[i + 1], fontSize: sz[i], lineHeight: 1, whiteSpace: 'pre',
                  filter: p < 1 ? `url(#d-${l.key})` : undefined}}>{l.text}</div>
              </React.Fragment>
            );
          })}
        </>
      )}

      {f >= CUT && (
        <>
          {/* FRAME 2: PostgresAI only */}
          <Sequence from={CUT} layout="none">
            <AbsoluteFill style={{transform: `translateY(${dy}px)`, ...(band ? {maskImage: bandMask, WebkitMaskImage: bandMask} : {})}}>
              <OffthreadVideo src={staticFile('logo-v1.mp4')} startFrom={LOGO_SKIP} muted style={{width: 1920, height: 1080}} />
            </AbsoluteFill>
          </Sequence>
          {m && (
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
