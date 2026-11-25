import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile, useCurrentFrame} from 'remotion';
import {ELE, H, HOSTS, TITLE, useFonts, W} from './common';

// Ep 198 particle intro: the assembled title card, as separate layers (one layer per frame,
// transparent PNG), so the particle engine can sample each element on its own and land them in
// sequence; and the whole card in a given text state (CardState), shown while the card holds
// sharp between the two particle flights. Texts follow the corrected Card198 (2026-11-25, after
// two factual reviews): "13 harms in replay" -> "13 → 1 in replay"; the Analyst's "drop indexes"
// (REJECTED) -> "CHANGE REQUESTS / safe changes 377 of 378" (APPROVED); RESERVED -> "Michael's
// seat: AUDITOR"; the restart pill names its task: "task C18: restarted in 5 of 5 runs".
// Every text change is an instant swap on a music hit with a small punch, so each state reads
// for its whole hold (at least 1 s), only while the card is sharp.
// Same title, wordmark, photos, elephant and Michael's sign as Card198 (ep 198 card); the hosts
// face each other (Kirk left, Nik right). Michael's chair + sign are 22% smaller than in Card198
// (host, 2026-11-25: "make michael's chair a bit smaller"); the sign text is set larger so it
// still reads at 360p. All text ends by y 900 (nothing in the bottom 180 px).

export type CardLayer = 'bg' | 'michael' | 'logo' | 'badge' | 'title1' | 'band' | 'paper' | 'kirk' | 'nik';
// z order of the layers
export const LAYER_ORDER: CardLayer[] = ['bg', 'michael', 'logo', 'badge', 'title1', 'band', 'paper', 'kirk', 'nik'];
export type CardState = {
  sign: 'reserved' | 'auditor';
  badge: 'none' | 'c18' | 'harms13' | 'harms1';
  paper: 'none' | 'drop' | 'drop-rejected' | 'approved';
  punch?: Partial<Record<'sign' | 'badge' | 'paper', number>>; // 0..1, decays after a change
};
// layer sets rendered to PNG for the particles: A1/B1 = what lands, F = what dissolves
export const SETS: Record<string, CardState> = {
  A1: {sign: 'reserved', badge: 'c18', paper: 'drop'},
  B1: {sign: 'reserved', badge: 'harms13', paper: 'drop'},
  F: {sign: 'auditor', badge: 'harms1', paper: 'approved'},
};
const RED = '#d93d1b', GREEN = '#1f9a3a';
const mono = {fontFamily: 'JBMono, Menlo, monospace', fontWeight: 500} as const;

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const PLUM = '#3d0f45';
const font = {fontFamily: 'Lato', fontWeight: 900} as const;

// elephant (same art and mask as Card198)
const EH = 880, EK = EH / ELE.h, EW = ELE.w * EK;
const ELX = 1215, ELY = 835, ELS = 0.7; // where the elephant's 50%/62% point sits, and its scale
const Elephant: React.FC = () => (
  <div style={{position: 'absolute', left: ELX - EW / 2, top: ELY - 0.62 * EH, width: EW, height: EH, transform: `scale(${ELS})`, transformOrigin: '50% 62%'}}>
    <Img src={staticFile('elephant.png')} style={{position: 'absolute', left: 0, top: 0, width: EW, height: EH,
      maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}} />
  </div>
);

// Static grain (one fixed seed) so the bg layer is one exact image.
const Grain: React.FC = () => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.1}}>
    <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={3} /><feColorMatrix type="saturate" values="0" /></filter>
    <rect width={W} height={H} filter="url(#g)" />
  </svg>
);

// Michael's deck chair + RESERVED sign, from Card198 (CX 1765, sign x 1605, top 410, w 610),
// scaled around the chair's foot.
const CX = 1765, CS = 0.85;
const SIGN = {x: 1605, top: 410, w: 610};
export const MICHAEL_SCALE = 0.78;
const Chair: React.FC = () => {
  const stripes = ['#ff5fcf', '#fff', '#42a8c8', '#fff', '#ff5fcf', '#fff', '#42a8c8'];
  return (
    <div style={{position: 'absolute', left: CX - 150, top: H - 400, width: 300, height: 400, transform: `scale(${CS})`, transformOrigin: '50% 100%'}}>
      <svg width={360} height={400} viewBox="0 0 360 400" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><clipPath id="sling198p"><path d="M70,40 L200,40 L250,260 L120,260 Z" /></clipPath></defs>
        <g clipPath="url(#sling198p)">{stripes.map((c, i) => <rect key={i} x={60 + i * 30} y={30} width={30} height={240} fill={c} transform="skewX(12)" />)}</g>
        <g stroke={PLUM} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" fill="none">
          <path d="M70,40 L200,40 L250,260 L120,260 Z" />
          <line x1={70} y1={40} x2={150} y2={395} /><line x1={200} y1={40} x2={280} y2={395} />
          <line x1={120} y1={260} x2={60} y2={395} /><line x1={250} y1={260} x2={190} y2={395} />
          <line x1={40} y1={250} x2={280} y2={250} />
        </g>
        <g transform="translate(22,170)">
          <path d="M0,0 L44,0 L36,72 L8,72 Z" fill="#ffcc4d" stroke={PLUM} strokeWidth={6} strokeLinejoin="round" />
          <line x1={30} y1={4} x2={46} y2={-40} stroke={PLUM} strokeWidth={5} strokeLinecap="round" />
          <path d="M20,-44 Q46,-74 74,-44 Z" fill="#39b54a" stroke={PLUM} strokeWidth={5} strokeLinejoin="round" />
          <circle cx={10} cy={4} r={9} fill="#ff7124" stroke={PLUM} strokeWidth={4} />
        </g>
      </svg>
    </div>
  );
};
const Sign: React.FC<{lines: [string, number][]}> = ({lines}) => (
  <>
    <div style={{position: 'absolute', left: SIGN.x - 11, top: SIGN.top + 200, width: 22, height: H - SIGN.top - 200, background: '#b9865a', border: `5px solid ${PLUM}`, borderRadius: 6}} />
    <div style={{position: 'absolute', left: SIGN.x - SIGN.w / 2, top: SIGN.top, width: SIGN.w}}>
      <div style={{background: '#fff', border: `7px solid ${PLUM}`, borderRadius: 20, padding: '14px 6px 18px', textAlign: 'center', boxShadow: `0 10px 0 ${PLUM}55`}}>
        {lines.map(([s, size], i) => <div key={i} style={{...font, fontSize: size, lineHeight: 1.06, height: size * 1.06, color: PLUM, letterSpacing: size < 60 ? 2 : -1, whiteSpace: 'nowrap'}}>{s}</div>)}
      </div>
    </div>
  </>
);
const OLD_LINES: [string, number][] = [['RESERVED', 46], ['Michael', 108], ['seat kept warm', 50]];
const NEW_LINES: [string, number][] = [['RESERVED', 54], ['Michael', 108], ['seat kept warm', 56]];
const AUDITOR_LINES: [string, number][] = [["Michael's seat:", 56], ['AUDITOR', 108], ['', 56]];
const Michael: React.FC<{old?: boolean; auditor?: boolean; punch?: number}> = ({old, auditor, punch = 0}) => (
  <AbsoluteFill style={{transform: `scale(${old ? 1 : MICHAEL_SCALE})`, transformOrigin: `${CX}px ${H}px`}}>
    <Chair />
    <div style={{position: 'absolute', inset: 0, transform: `rotate(${4 * punch * Math.sin(punch * 12)}deg) scale(${1 + 0.06 * punch})`, transformOrigin: `${SIGN.x}px ${SIGN.top + 200}px`}}>
      <Sign lines={old ? OLD_LINES : auditor ? AUDITOR_LINES : NEW_LINES} />
    </div>
  </AbsoluteFill>
);

// top-right slot (x 1010..1880, y 66..196): the restart pill, then the replay meter
const SLOT = {x: 1010, y: 66, w: 870, h: 130};
const Badge: React.FC<{kind: CardState['badge']; punch?: number}> = ({kind, punch = 0}) => {
  if (kind === 'none') return null;
  const tf = {transform: `scale(${1 + 0.08 * punch}) rotate(-2deg)`, transformOrigin: '0 50%'};
  if (kind === 'c18')
    return (
      <div style={{position: 'absolute', left: SLOT.x, top: SLOT.y, ...tf}}>
        <div style={{...font, color: '#fff', background: RED, border: '5px solid #fff', borderRadius: 20, padding: '6px 30px 10px', boxShadow: `0 10px 0 ${PLUM}55`, whiteSpace: 'nowrap'}}>
          <div style={{fontSize: 40, lineHeight: '46px', letterSpacing: 1}}>task C18:</div>
          <div style={{fontSize: 58, lineHeight: '64px', letterSpacing: -0.5}}>restarted in 5 of 5 runs</div>
        </div>
      </div>
    );
  const one = kind === 'harms1';
  return (
    <div style={{position: 'absolute', left: SLOT.x, top: SLOT.y, width: SLOT.w, height: SLOT.h, ...tf}}>
      <div style={{position: 'absolute', inset: 0, background: '#fff', border: `7px solid ${PLUM}`, borderRadius: 24, boxShadow: `0 10px 0 ${PLUM}55`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: one ? '100%' : '100%', background: one ? GREEN : RED}} />
      </div>
      <div style={{...mono, position: 'absolute', left: 0, right: 0, top: 0, height: SLOT.h, textAlign: 'center', fontSize: 72, lineHeight: `${SLOT.h}px`, color: '#fff', WebkitTextStroke: `7px ${PLUM}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>
        {one ? '13 → 1 in replay' : '13 harms in replay'}
      </div>
    </div>
  );
};

// the Analyst's paper (x 950..1370, y 592..884): no face nearby, ends above y 900
const PAPER = {x: 950, y: 592, w: 420, h: 292};
const Paper: React.FC<{kind: CardState['paper']; punch?: number}> = ({kind, punch = 0}) => {
  if (kind === 'none') return null;
  const second = kind === 'approved';
  const stamp = kind === 'drop-rejected' ? ['REJECTED', RED] : second ? ['APPROVED', GREEN] : null;
  return (
    <div style={{position: 'absolute', left: PAPER.x, top: PAPER.y, width: PAPER.w, height: PAPER.h, transform: `rotate(2deg) scale(${1 + 0.05 * punch})`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', inset: 0, background: second ? '#e3ffe3' : '#fff', border: `7px solid ${PLUM}`, borderRadius: 16, boxShadow: `0 10px 0 ${PLUM}55`, overflow: 'hidden'}}>
        <div style={{...font, position: 'absolute', left: 0, right: 0, top: 0, height: 56, background: PLUM, color: '#fff', fontSize: 34, lineHeight: '56px', paddingLeft: 18, letterSpacing: 2}}>{second ? 'CHANGE REQUESTS' : 'ANALYST'}</div>
        {!second ? (
          <div style={{...mono, position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontSize: 46, color: PLUM, whiteSpace: 'nowrap'}}>drop indexes</div>
        ) : (
          <>
            <div style={{...mono, position: 'absolute', left: 0, right: 0, top: 62, textAlign: 'center', fontSize: 40, color: PLUM, whiteSpace: 'nowrap'}}>safe changes</div>
            <div style={{...font, position: 'absolute', left: 0, right: 0, top: 108, textAlign: 'center', fontSize: 72, lineHeight: 1, color: PLUM, letterSpacing: -1, whiteSpace: 'nowrap'}}>377 of 378</div>
          </>
        )}
      </div>
      {stamp && (
        <div style={{...font, position: 'absolute', left: '50%', top: 242, transform: `translate(-50%, -50%) rotate(-6deg) scale(${1 + 0.25 * punch})`, fontSize: 52, lineHeight: '60px', color: stamp[1],
          border: `7px solid ${stamp[1]}`, borderRadius: 12, padding: '0 18px', whiteSpace: 'nowrap', background: 'rgba(255,255,255,.75)'}}>{stamp[0]}</div>
      )}
    </div>
  );
};

let monoLoaded = false;
export const useMono = () => {
  const [h] = useState(() => (monoLoaded ? null : delayRender('mono')));
  useEffect(() => {
    if (h === null) return;
    new FontFace('JBMono', `url(${staticFile('fonts/JetBrainsMono-Medium.ttf')})`, {weight: '500'}).load().then((ff) => document.fonts.add(ff))
      .finally(() => { monoLoaded = true; continueRender(h); });
  }, [h]);
};

const TITLE_TOP = 228;
const TILE_TOP = 574, TILE_W = 360, TILE_H = 270;
export const HOST_X = [110, 520];
const Tile: React.FC<{i: number}> = ({i}) => {
  const h = HOSTS[i];
  return (
    <div style={{position: 'absolute', left: HOST_X[i], top: TILE_TOP, width: TILE_W}}>
      <Img src={staticFile(h.photo ?? '')} style={{display: 'block', width: TILE_W, height: TILE_H, objectFit: 'cover', borderRadius: 14, border: '5px solid #fff', boxShadow: '0 10px 0 rgba(61,15,69,.3)'}} />
      <div style={{...font, fontWeight: 900, fontSize: 36, lineHeight: '44px', color: PLUM, marginTop: 10, whiteSpace: 'nowrap', background: '#fff', borderRadius: 10, padding: '0 14px', display: 'inline-block', boxShadow: '0 4px 0 rgba(61,15,69,.25)'}}>{h.name}</div>
    </div>
  );
};

export const Layer: React.FC<{name: CardLayer; st: CardState}> = ({name, st}) => {
  switch (name) {
    case 'bg':
      return (
        <AbsoluteFill style={{background: PINK_BG}}>
          <Elephant />
          <Grain />
        </AbsoluteFill>
      );
    case 'michael':
      return <Michael auditor={st.sign === 'auditor'} punch={st.punch?.sign} />;
    case 'badge':
      return <Badge kind={st.badge} punch={st.punch?.badge} />;
    case 'paper':
      return <Paper kind={st.paper} punch={st.punch?.paper} />;
    case 'logo':
      return (
        <AbsoluteFill>
          <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560, filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
          <div style={{...font, position: 'absolute', left: 716, top: 82, height: 112, fontSize: 84, lineHeight: '112px', color: '#fff', background: PLUM, padding: '0 30px', borderRadius: 20,
            border: '5px solid #fff', boxShadow: `0 10px 0 ${PLUM}55`, transform: 'rotate(-2deg)', letterSpacing: 0}}>#198</div>
        </AbsoluteFill>
      );
    case 'title1':
      return (
        <div style={{...font, position: 'absolute', left: 110, top: TITLE_TOP, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap', height: 150,
          textShadow: `0 7px 0 ${PLUM}88, 0 0 30px rgba(61,15,69,.5)`}}>{TITLE[0]}</div>
      );
    case 'band':
      return (
        <div style={{position: 'absolute', left: 110, top: TITLE_TOP + 176, height: 150, display: 'inline-block'}}>
          <div style={{position: 'absolute', left: -24, right: -36, top: 0, bottom: 0, background: PLUM, borderRadius: 18, transform: 'skewX(-6deg)', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
          <div style={{...font, position: 'relative', paddingLeft: 14, paddingRight: 6, fontSize: 100, lineHeight: '150px', color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap'}}>{TITLE[1]}</div>
        </div>
      );
    case 'kirk':
      return <Tile i={0} />;
    case 'nik':
      return <Tile i={1} />;
  }
};

export const CardFull: React.FC<{st: CardState}> = ({st}) => (
  <AbsoluteFill>{LAYER_ORDER.map((n) => <Layer key={n} name={n} st={st} />)}</AbsoluteFill>
);

// --props '{"set":"A1"}': frame i = layer LAYER_ORDER[i] alone; then the full card; then the
// old-size Michael element over the bg (size comparison).
export const CardLayers: React.FC<{set: string}> = ({set}) => {
  useFonts();
  useMono();
  const f = useCurrentFrame();
  const st = SETS[set] ?? SETS.A1;
  if (f < LAYER_ORDER.length) return <AbsoluteFill><Layer name={LAYER_ORDER[f]} st={st} /></AbsoluteFill>;
  if (f === LAYER_ORDER.length) return <CardFull st={st} />;
  return <AbsoluteFill><Layer name="bg" st={st} /><Michael old /></AbsoluteFill>;
};
