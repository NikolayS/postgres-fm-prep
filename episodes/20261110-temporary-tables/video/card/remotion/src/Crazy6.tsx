import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile} from 'remotion';
import {Beat, beatT, ELE, Grain, H, HOSTS, TITLE, useFonts, useT, W} from './common';

// v6, the ep 196 title card ("Temporary tables"). Host notes (2026-11-10): crazier, not denser;
// fewer, bigger moments that own the frame; no reuse of last week's motifs; keep the Michael
// deck chair with "ON COMMIT PRESERVE ROWS". Four ideas, each about 2.8 s, so a first-time viewer
// gets every joke; on-screen text stays up long enough to read.
// Kept: pink shades background, wordmark, the sunglasses elephant, title + host tiles + names,
// the 14 s beat clock (final hit on beat 24, 12.90 s), Lato 900, grain, Michael's deck chair.
// Not used (last week's motifs): drop/cannonball entrances, bounce squash, boxes on the head,
// trails, punch zoom/shake, whip blur, confetti, sparkles/glint, speed lines, rays, rainbow,
// white flash, comic bursts, title smash, headspin/windmill/flips, clones/conga, box rain,
// crowd-surf, jetpack/smoke, headbang, host photo nod.
//
// Beats (one beat = 0.517 s, beat 0 = 0.486 s):
//  0-2.5   intro: wordmark wipes in, title typed, the elephant builds itself from table cells;
//          Michael's deck chair + sign "RESERVED / Michael / on vacation" at the right edge
//  2.5-8   IDEA 1, microscopic: hard cut into ONE giant pg_class row ("relpersistence = t"), the
//          elephant is a speck standing in it; the camera pulls back and back: rows, rows, rows,
//          until they turn out to BE the elephant (catalog bloat); the rows turn back into skin
//  8-14    IDEA 2, scale breaks: SET temp_buffers = 8MB / 8GB / 4TB: the elephant grows each beat
//          until its sunglasses fill the frame; on 11 we are in space, the elephant dwarfs the
//          server; on 12 ERROR: "8TB" is outside the valid range; snaps back on 14
//  14-20   IDEA 3, the fourth wall: the elephant walks up to the camera and presses its face on the
//          glass; knocks on 15 and 16 crack it; on 17 the screen SHATTERS toward the viewer, behind
//          it a psql terminal: the connection is gone, and so are the temp tables; "Attempting
//          reset: Succeeded." and the shards fly back into place by 20
//  20-24   IDEA 4, ON COMMIT DROP: the chair is back; "COMMIT;" and on 21 the elephant drops
//          through a trapdoor; ERROR: relation "elephant" does not exist; CREATE TEMP TABLE
//          elephant (); it pops back up on 24 and Michael's sign flips to
//          "Michael's seat: ON COMMIT PRESERVE ROWS" (his seat is never dropped)

// Speech bubbles over the hosts: off until the hosts approve the words.
const SHOW_BUBBLES = false;

const PINK_BG = 'linear-gradient(180deg, #ef7de3 0%, #f39aea 50%, #faddf7 100%)';
const PLUM = '#3d0f45';
const TERM = '#22072a';
const RED = '#d93d1b';
const GREEN = '#9fe6a0';
const font = {fontFamily: 'Lato', fontWeight: 900} as const;
const mono = {fontFamily: 'JBMono, Menlo, monospace', fontWeight: 500} as const;

let monoLoaded = false;
const useMono = () => {
  const [h] = useState(() => (monoLoaded ? null : delayRender('mono')));
  useEffect(() => {
    if (h === null) return;
    new FontFace('JBMono', `url(${staticFile('fonts/JetBrainsMono-Medium.ttf')})`, {weight: '500'}).load().then((ff) => document.fonts.add(ff))
      .finally(() => { monoLoaded = true; continueRender(h); });
  }, [h]);
};

const bt: Beat = {t0: 0.486, b: 60 / 116};
const B = (k: number) => beatT(bt, k);
const beatPos = (t: number) => (t - bt.t0) / bt.b;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const eIn = (x: number) => Math.pow(clamp01(x), 3);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const inP = (p: number, a: number, b: number) => p >= a && p < b;
const mix = (a: number, b: number, q: number) => a + (b - a) * q;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const boing = (u: number) => (u <= 0 ? 0 : u >= 1.6 ? 1 : 1 - Math.exp(-u * 9) * Math.cos(u * 14));
const typed = (s: string, p: number, a: number, b: number) => s.slice(0, Math.floor(s.length * seg(p, a, b)));

// Elephant geometry (as before).
const EH = 880, EK = EH / ELE.h, EW = ELE.w * EK, EX = 1120, EY = H - EH + 170;
const OX = EX + EW / 2, OY = EY + 0.62 * EH;
type Pose = {x: number; y: number; rot: number; sx: number; sy: number; scale: number; hidden?: boolean};
const HOME: Pose = {x: 0, y: 0, rot: 0, sx: 1, sy: 1, scale: 1};
// pose whose image point (ix, iy) lands on screen point (gx, gy) at scale s
const pin = (ix: number, iy: number, gx: number, gy: number, s: number, extra: Partial<Pose> = {}): Pose =>
  ({x: gx - (ix - ELE.w / 2) * EK * s - OX, y: gy - (iy - 0.62 * ELE.h) * EK * s - OY, rot: 0, sx: 1, sy: 1, scale: s, ...extra});

const Elephant: React.FC<{e: Pose}> = ({e}) =>
  e.hidden ? null : (
    <div style={{position: 'absolute', left: EX + e.x, top: EY + e.y, width: EW, height: EH,
      transform: `rotate(${e.rot}deg) scale(${e.scale * e.sx}, ${e.scale * e.sy})`, transformOrigin: '50% 62%'}}>
      <Img src={staticFile('elephant.png')} style={{position: 'absolute', left: 0, top: 0, width: EW, height: EH,
        maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}} />
    </div>
  );

// Intro: the elephant assembled from table cells (6x7 tiles flip in along the diagonal).
const MCOLS = 6, MROWS = 7;
const Mosaic: React.FC<{u: number}> = ({u}) => {
  const tw = EW / MCOLS, th = EH / MROWS;
  return (
    <div style={{position: 'absolute', left: EX, top: EY, width: EW, height: EH,
      maskImage: 'linear-gradient(180deg, black 82%, transparent 98%)', WebkitMaskImage: 'linear-gradient(180deg, black 82%, transparent 98%)'}}>
      {Array.from({length: MCOLS * MROWS}, (_, k) => {
        const c = k % MCOLS, r = Math.floor(k / MCOLS);
        const d = ((c / (MCOLS - 1)) + (1 - r / (MROWS - 1))) / 2 * 0.65 + rnd(k) * 0.08;
        const q = clamp01((u - d) / 0.27);
        if (q <= 0) return null;
        return (
          <div key={k} style={{position: 'absolute', left: c * tw, top: r * th, width: tw + 0.5, height: th + 0.5, overflow: 'hidden',
            transform: `perspective(900px) rotateY(${90 * (1 - eOut(q)) * (k % 2 ? 1 : -1)}deg)`, outline: q < 1 ? `2px solid rgba(255,255,255,${0.8 * (1 - q)})` : undefined}}>
            <Img src={staticFile('elephant.png')} style={{position: 'absolute', left: -c * tw, top: -r * th, width: EW, height: EH}} />
          </div>
        );
      })}
    </div>
  );
};

// ---------- Michael's deck chair (as Crazy5); never hit, never dropped ----------
const CX = 1700, CS = 0.85;
const Board: React.FC<{p: number}> = ({p}) => {
  const a = 180 * ease(seg(p, 24, 24 + 0.32 / bt.b));
  const back = a > 90;
  const lines: [string, number][] = back ? [["Michael's seat:", 36], ['ON COMMIT', 50], ['PRESERVE ROWS', 40]] : [['RESERVED', 32], ['Michael', 76], ['on vacation', 34]];
  return (
    <div style={{position: 'absolute', left: 150 - 215, top: -380, width: 430, transform: `scaleX(${Math.max(0.02, Math.abs(Math.cos((a * Math.PI) / 180)))})`}}>
      <div style={{background: '#fff', border: `6px solid ${PLUM}`, borderRadius: 16, padding: '12px 8px 14px', textAlign: 'center', boxShadow: `0 8px 0 ${PLUM}55`}}>
        {lines.map(([s, size], i) => <div key={i} style={{...font, fontSize: size, lineHeight: 1.08, color: PLUM, letterSpacing: size < 40 ? 1.5 : -1, whiteSpace: 'nowrap'}}>{s}</div>)}
      </div>
    </div>
  );
};
const Chair: React.FC<{p: number; dx: number}> = ({p, dx}) => {
  const st = (s: number, amp: number) => (p >= s ? amp * Math.exp(-(p - s) * bt.b * 4) * Math.sin((p - s) * bt.b * 22) : 0);
  const wob = st(21, 3) + st(24, 4);
  const stripes = ['#ff5fcf', '#fff', '#42a8c8', '#fff', '#ff5fcf', '#fff', '#42a8c8'];
  return (
    <div style={{position: 'absolute', left: CX - 150 + dx, top: H - 400, width: 300, height: 400, transform: `rotate(${wob}deg) scale(${CS})`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', left: 142, top: -230, width: 16, height: 260, background: '#b9865a', border: `4px solid ${PLUM}`, borderRadius: 6}} />
      <Board p={p} />
      <svg width={360} height={400} viewBox="0 0 360 400" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><clipPath id="sling"><path d="M70,40 L200,40 L250,260 L120,260 Z" /></clipPath></defs>
        <g clipPath="url(#sling)">{stripes.map((c, i) => <rect key={i} x={60 + i * 30} y={30} width={30} height={240} fill={c} transform="skewX(12)" />)}</g>
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
// the chair is on stage in the intro and the finale; it slides out of the way at 2.2-2.5 and back at 20-20.5
const chairDX = (p: number) => (p < 3 ? 600 * eIn(seg(p, 2.6, 3)) : p < 20 ? 600 : 600 * (1 - eOut(seg(p, 20, 20.5))));

// Little label in a plum pill.
const Pill: React.FC<{x: number; y: number; size?: number; children: React.ReactNode; color?: string; bg?: string; style?: React.CSSProperties}> = ({x, y, size = 36, children, color = '#fff', bg = PLUM, style}) => (
  <div style={{...mono, position: 'absolute', left: x, top: y, fontSize: size, color, background: bg, padding: '6px 16px', borderRadius: 12, whiteSpace: 'nowrap', boxShadow: `0 6px 0 ${PLUM}44`, ...style}}>{children}</div>
);

// ---------- IDEA 1: one giant pg_class row; pull back until the rows ARE the elephant ----------
const RH = 6; // row height in local (elephant-box) px; at the start one row is ~300 px tall
const S0 = 50;
const FOC = {x: 660 * EK, y: 228 * EK}; // forehead, local px
const ROW_TXT = 'relname = tmp_elephant · relkind = r · relpersistence = t · ';
const Micro: React.FC<{p: number}> = ({p}) => {
  const q = seg(p, 4.2, 7.1);
  const S = Math.exp(Math.log(S0) * (1 - ease(q) * 0.15 - q * 0.85));
  const home = {x: EX + FOC.x, y: EY + FOC.y};
  const T = {x: mix(1180, home.x, ease(q)), y: mix(560, home.y, ease(q))};
  const ox = T.x - FOC.x * S, oy = T.y - FOC.y * S; // screen pos of local (0,0)
  const real = seg(p, 7.3, 7.9);
  // the speck: a tiny real elephant standing on a row line next to the focus point
  const sk = 0.0042, skH = EH * sk, skW = EW * sk;
  const spot = {x: FOC.x + 0.9, y: Math.floor(FOC.y / RH) * RH + RH * 0.92};
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="pgrows" width={EW} height={RH * 2} patternUnits="userSpaceOnUse" patternTransform={`translate(${ox},${oy}) scale(${S})`}>
            <rect width={EW} height={RH} fill="#d76bcd" />
            <rect y={RH} width={EW} height={RH} fill="#c75bbd" />
            <rect y={RH - 0.08} width={EW} height={0.16} fill={PLUM} opacity={0.5} />
            <rect y={2 * RH - 0.08} width={EW} height={0.16} fill={PLUM} opacity={0.5} />
            <text x={0.4} y={RH * 0.66} style={{...mono, fontSize: RH * 0.42, fill: '#fff'}} opacity={0.6}>{ROW_TXT.repeat(6)}</text>
            <text x={-1.7} y={RH * 1.66} style={{...mono, fontSize: RH * 0.42, fill: '#fff'}} opacity={0.6}>{ROW_TXT.repeat(6)}</text>
          </pattern>
          <mask id="emask" maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H} style={{maskType: 'alpha'}}>
            <image href={staticFile('elephant.png')} x={ox} y={oy} width={EW * S} height={EH * S} preserveAspectRatio="none" />
          </mask>
        </defs>
        <rect width={W} height={H} fill="url(#pgrows)" mask="url(#emask)" opacity={1 - real} />
        {S > 3 && <image href={staticFile('elephant.png')} x={ox + (spot.x - skW / 2) * S} y={oy + (spot.y - skH) * S} width={skW * S} height={skH * S} />}
      </svg>
      {real > 0 && <div style={{position: 'absolute', inset: 0, opacity: real}}><Elephant e={HOME} /></div>}
    </>
  );
};
const MicroText: React.FC<{p: number}> = ({p}) => {
  const q = seg(p, 4.2, 7.1);
  const n = Math.round(Math.pow(S0 * 0.9, 2 * q));
  const out: React.ReactNode[] = [];
  if (p < 4.5) {
    const o = 1 - seg(p, 4.25, 4.5);
    out.push(<Pill key="you" x={1265} y={500} size={38} style={{opacity: o}}>{'← one temp table'}</Pill>);
    out.push(<Pill key="cap" x={880} y={60} size={38} style={{opacity: o}}>CREATE TEMP TABLE = a new pg_class row</Pill>);
  }
  if (p >= 4.3) {
    const bloat = p >= 6.9;
    out.push(
      <Pill key="cnt" x={1200} y={70} size={bloat ? 46 : 40} bg={bloat ? RED : PLUM} style={{opacity: 1 - seg(p, 7.7, 8)}}>
        {bloat ? 'catalog bloat!' : `pg_class: ${fmt(n)} rows`}
      </Pill>,
    );
  }
  return <>{out}</>;
};

// ---------- IDEA 2: SET temp_buffers, bigger every beat, then space ----------
const BUF = ['8MB', '8GB', '4TB', '8TB'];
const GLASS = {ix: 660, iy: 420}; // between the lenses, image px
const growPose = (p: number): Pose => {
  const k = Math.min(3, Math.floor(p - 8));
  const S = [1, 2.4, 6.2];
  if (k >= 3) return pin(GLASS.ix, GLASS.iy, 1500, 650, 0.55, {rot: 12 * Math.sin((p - 11) * 1.4)});
  if (k === 0) return HOME;
  const g0 = {x: OX + (GLASS.ix - ELE.w / 2) * EK, y: OY + (GLASS.iy - 0.62 * ELE.h) * EK};
  const st = (j: number) => (j === 0 ? pin(GLASS.ix, GLASS.iy, g0.x, g0.y, 1) : pin(GLASS.ix, GLASS.iy, 1400, 470, S[j]));
  const a = st(k - 1), b = st(k), u = boing((p - 8 - k) * 3.2);
  return {...b, x: mix(a.x, b.x, u), y: mix(a.y, b.y, u), scale: mix(a.scale, b.scale, u)};
};
const STARS = Array.from({length: 90}, (_, i) => ({x: rnd(i + 1) * W, y: rnd(i + 2) * H, r: 1 + rnd(i + 3) * 2.5}));
const Space: React.FC<{p: number; t: number}> = ({p, t}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 40%, #2a1450 0%, #0d0620 70%)'}} />
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
      {/* the server, for scale */}
      <g transform={`translate(865,770) rotate(${(p - 11) * 20})`}>
        <circle r={30} fill="#42a8c8" stroke="#fff" strokeWidth={3} />
        <path d="M-18,-10 Q-6,-22 6,-12 Q2,0 -14,4 Z M4,8 Q18,4 20,14 Q8,24 2,16 Z" fill="#39b54a" />
      </g>
    </svg>
    <Pill x={910} y={745} size={34}>{'← your server'}</Pill>
  </>
);
const SetBanner: React.FC<{p: number}> = ({p}) => {
  if (p < 8 || p >= 14) return null;
  const k = Math.min(3, Math.floor(p - 8));
  const err = p >= 12;
  const pulse = 1 + 0.08 * Math.exp(-(p - Math.floor(p)) * 8);
  return (
    <>
      <Pill x={880} y={60} size={50} style={{transform: `scale(${err ? 1 : pulse})`, transformOrigin: '0 50%'}}>SET temp_buffers = &apos;{BUF[k]}&apos;;</Pill>
      {err && (
        <div style={{...mono, position: 'absolute', left: 880, top: 170, padding: '16px 22px', background: '#fff', border: `6px solid ${RED}`, borderRadius: 14, color: RED, fontSize: 40, whiteSpace: 'nowrap', lineHeight: 1.3,
          transform: `scale(${boing((p - 12) * 3)})`, transformOrigin: '0 0', boxShadow: `0 8px 0 ${PLUM}55`}}>
          <div style={{...font, fontSize: 44}}>ERROR:</div>
          <div>&quot;8TB&quot; is outside the valid range</div>
          <div>for parameter &quot;temp_buffers&quot;</div>
        </div>
      )}
    </>
  );
};

// ---------- IDEA 3: face on the glass, the screen shatters ----------
const HIT = {x: 1330, y: 600};
const glassPose = (p: number): Pose => {
  // walk up to the camera (14-15), then knock on 15, 16, 17
  if (p < 15) { const q = ease(seg(p, 14, 15)); return pin(660, 700, mix(OX, HIT.x, q), mix(OY + (700 - 951.7) * EK, HIT.y, q) + 30 * Math.abs(Math.sin((p - 14) * Math.PI * 3)) * (1 - q), mix(1, 2.6, q)); }
  const ph = p - Math.floor(p); // 0 = impact
  const back = ph < 0.5 ? 0 : Math.sin(((ph - 0.5) / 0.5) * Math.PI);
  const squish = Math.exp(-ph * 7);
  return pin(660, 700, HIT.x, HIT.y, 2.6 - 0.25 * Math.max(0, back), {sx: 1 + 0.16 * squish, sy: 1 - 0.1 * squish});
};
const crackLevel = (p: number) => (p >= 16 ? 2 : p >= 15 ? 1 : 0);
const CRACKS = Array.from({length: 24}, (_, i) => ({a: (i / 24) * Math.PI * 2 + (rnd(i + 40) - 0.5) * 0.25, l: 0.5 + rnd(i + 41) * 0.5, kink: (rnd(i + 42) - 0.5) * 0.5}));
const Cracks: React.FC<{p: number}> = ({p}) => {
  const lv = crackLevel(p);
  if (lv === 0) return null;
  const n = lv === 1 ? 9 : 24, len = lv === 1 ? 260 : 1100;
  const grow = eOut(seg(p, lv === 1 ? 15 : 16, (lv === 1 ? 15 : 16) + 0.12));
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {CRACKS.slice(0, n).map((c, i) => {
        const L = len * c.l * grow, mx = HIT.x + Math.cos(c.a) * L * 0.5, my = HIT.y + Math.sin(c.a) * L * 0.5;
        const ex = HIT.x + Math.cos(c.a + c.kink) * L, ey = HIT.y + Math.sin(c.a + c.kink) * L;
        return <polyline key={i} points={`${HIT.x},${HIT.y} ${mx},${my} ${ex},${ey}`} fill="none" stroke="#fff" strokeWidth={lv === 1 ? 4 : 5} opacity={0.95} />;
      })}
      {lv === 2 && [120, 260].map((r) => <circle key={r} cx={HIT.x} cy={HIT.y} r={r * grow} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="40 30" opacity={0.85} />)}
      <circle cx={HIT.x} cy={HIT.y} r={20} fill="#fff" opacity={0.9} />
    </svg>
  );
};
// Glare bands: the frame is glass for the duration of the idea.
const Glare: React.FC<{p: number}> = ({p}) => {
  const o = seg(p, 14.6, 15) * (p < 17 ? 1 : 0);
  if (o <= 0) return null;
  return <div style={{position: 'absolute', inset: 0, opacity: o * 0.5, background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,.55) 33%, transparent 37%, transparent 42%, rgba(255,255,255,.35) 44%, transparent 47%)'}} />;
};
// Shards: wedges around the hit point, split by a ring.
const NSH = 11, RING = 330;
const SH_ANG = Array.from({length: NSH}, (_, i) => (i / NSH) * Math.PI * 2 + (rnd(i + 90) - 0.5) * 0.35);
const shardPoly = (i: number, inner: boolean) => {
  const a0 = SH_ANG[i], a1 = SH_ANG[(i + 1) % NSH] + (i === NSH - 1 ? Math.PI * 2 : 0);
  const r0 = inner ? 0 : RING, r1 = inner ? RING : 3200;
  const pts = [[a0, r0], [a0, r1], [(a0 + a1) / 2, r1], [a1, r1], [a1, r0]].map(([a, r]) => `${HIT.x + Math.cos(a) * r}px ${HIT.y + Math.sin(a) * r}px`);
  return `polygon(${pts.join(', ')})`;
};
// 0 = in place, 1 = gone (flown at the viewer and fallen away)
const shardOut = (p: number) => (p < 17 ? 0 : p < 19.3 ? eOut(seg(p, 17, 17.7)) : 1 - ease(seg(p, 19.3, 20)));
const TermText: React.FC<{p: number}> = ({p}) => {
  if (p < 17 || p >= 20.05) return null;
  const line = (y: number, s: string, c = '#fff', from = 17, size = 38) => (p >= from ? <div key={y} style={{...mono, position: 'absolute', left: 880, top: y, fontSize: size, color: c, whiteSpace: 'nowrap'}}>{s}</div> : null);
  return (
    <>
      {line(160, 'server closed the connection unexpectedly', '#fff', 17.15)}
      {line(220, '-- all your temp tables: gone', GREEN, 17.6)}
      {line(270, '-- (they were temporary)', GREEN, 17.9)}
      {line(355, 'The connection to the server was lost.', '#fff', 18.4)}
      {line(405, 'Attempting reset: Succeeded.', GREEN, 18.8)}
    </>
  );
};

// ---------- IDEA 4: ON COMMIT DROP ----------
const DOOR = {x: 1390, y: 1060, rx: 290, ry: 54};
const dropPose = (p: number): Pose => {
  if (p < 21) return HOME;
  if (p < 21.25) return {...HOME, y: 1300 * eIn(seg(p, 21, 21.25))};
  if (p < 23.55) return {...HOME, hidden: true};
  if (p < 24) return {...HOME, y: 1300 * (1 - eIn(seg(p, 23.55, 24)))};
  return HOME;
};
const Trapdoor: React.FC<{p: number}> = ({p}) => {
  const open = eOut(seg(p, 20.85, 21)) * (1 - ease(seg(p, 24, 24.3)));
  if (open <= 0) return null;
  return (
    <>
      <div style={{position: 'absolute', left: DOOR.x - DOOR.rx, top: DOOR.y - DOOR.ry * open, width: DOOR.rx * 2, height: DOOR.ry * 2 * open, borderRadius: '50%', background: '#0c0410', border: `6px solid ${PLUM}`}} />
      {p >= 21 && p < 23.5 && <Pill x={DOOR.x - 175} y={960} size={36} bg={RED}>ON COMMIT DROP</Pill>}
    </>
  );
};
const DropText: React.FC<{p: number}> = ({p}) => {
  const out: React.ReactNode[] = [];
  if (p >= 20 && p < 24.1) {
    const cmd = p < 23 ? 'COMMIT;' : 'CREATE TEMP TABLE elephant ();';
    const s = p < 23 ? typed(cmd, p, 20.1, 20.5) : typed(cmd, p, 23, 23.5);
    out.push(<Pill key="pr" x={880} y={60} size={40} bg={TERM} style={{border: '3px solid #fff', opacity: 1 - seg(p, 23.9, 24.1)}}>postgres=# {s}</Pill>);
  }
  if (p >= 21.4 && p < 23.4) {
    out.push(
      <div key="err" style={{...mono, position: 'absolute', left: 860, top: 160, padding: '14px 22px', background: '#fff', border: `6px solid ${RED}`, borderRadius: 14, fontSize: 38, whiteSpace: 'nowrap', lineHeight: 1.35,
        transform: `scale(${boing((p - 21.4) * 3)})`, transformOrigin: '0 0', opacity: 1 - seg(p, 23.2, 23.4), boxShadow: `0 8px 0 ${PLUM}55`}}>
        <div style={{color: PLUM}}>postgres=# SELECT * FROM elephant;</div>
        <div style={{color: RED}}>ERROR: relation &quot;elephant&quot; does not exist</div>
      </div>,
    );
  }
  return <>{out}</>;
};

// ---------- the action layer for a given beat position ----------
const mainPose = (p: number): Pose => {
  if (p < 1) return {...HOME, hidden: true};
  if (p < 3) return {...HOME, rot: p > 2 ? -5 * Math.sin(seg(p, 2, 3) * Math.PI) : 0};
  if (p < 8) return {...HOME, hidden: true}; // Micro draws it
  if (p < 14) return growPose(p);
  if (p < 17) return glassPose(p);
  if (p < 20) return HOME;
  return dropPose(p);
};
const Scene: React.FC<{p: number; t: number}> = ({p, t}) => {
  const e = mainPose(p);
  return (
    <>
      {inP(p, 11, 14) ? <Space p={p} t={t} /> : <div style={{position: 'absolute', inset: 0, background: PINK_BG}} />}
      {inP(p, 3, 8) && <Micro p={p} />}
      {inP(p, 1, 2) ? <Mosaic u={seg(p, 1, 2)} /> : <Elephant e={e} />}
      {inP(p, 20, 24.4) && <Trapdoor p={p} />}
      {(p < 3.05 || p >= 20) && <Chair p={p} dx={chairDX(p)} />}
      {inP(p, 15, 17) && <Cracks p={p} />}
      <Glare p={p} />
    </>
  );
};

// ---------- title layer: never tilted, cracked, shattered ----------
const HOST_X = [110, 470];
const Photo: React.FC<{src: string; name: string; x: number; p: number; i: number}> = ({src, name, x, p, i}) => {
  const s0 = 4.5 + i * 0.5, q = seg(p, s0, s0 + 0.35);
  if (q <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: 660, width: 330, transform: `perspective(1200px) rotateY(${90 * (1 - eOut(q))}deg)`}}>
      <Img src={staticFile(src)} style={{width: 330, height: 248, objectFit: 'cover', borderRadius: 14, border: '5px solid #fff', boxShadow: '0 10px 0 rgba(61,15,69,.3)'}} />
      <div style={{...font, fontWeight: 700, fontSize: 30, color: PLUM, marginTop: 12, whiteSpace: 'nowrap', background: '#fff', borderRadius: 10, padding: '2px 12px', display: 'inline-block', boxShadow: '0 4px 0 rgba(61,15,69,.25)'}}>{name}</div>
    </div>
  );
};
const Bubble: React.FC<{p: number; x: number; from: number; to: number; text: string}> = ({p, x, from, to, text}) => {
  if (!SHOW_BUBBLES || p < from || p > to) return null;
  return (
    <div style={{position: 'absolute', left: x, top: 578, transform: `scale(${boing((p - from) * 3) * (1 - seg(p, to - 0.2, to))})`, transformOrigin: '30px 70px'}}>
      <div style={{...font, fontWeight: 700, fontSize: 34, color: PLUM, background: '#fff', border: `4px solid ${PLUM}`, borderRadius: 16, padding: '6px 14px', whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};
const TitleLayer: React.FC<{p: number; t: number}> = ({p, t}) => {
  const cur = Math.floor(t * 4) % 2 === 0;
  const wmQ = seg(p, 0.2, 0.6);
  const l1 = TITLE[0], per = 0.7 / l1.length;
  const band = boing((p - 1.75) * 2.5);
  const n2 = Math.floor(TITLE[1].length * seg(p, 1.85, 2.3));
  const shadow = `0 7px 0 ${PLUM}88, 0 0 26px rgba(61,15,69,.45)`;
  return (
    <AbsoluteFill>
      <Img src={staticFile('wordmark.png')} style={{position: 'absolute', left: 110, top: 70, width: 560, clipPath: `inset(0 ${100 - wmQ * 100}% 0 0)`, filter: 'drop-shadow(0 6px 0 rgba(61,15,69,.35))'}} />
      <div style={{position: 'absolute', left: 110, top: 240}}>
        <div style={{...font, fontSize: 150, lineHeight: 1.0, color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap', textShadow: shadow, height: 150}}>
          {l1.split('').map((ch, i) => {
            const u = (p - 1 - i * per) / per;
            if (u < 0) return null;
            return <span key={i} style={{display: 'inline-block', transform: `scale(${u < 1 ? mix(1.7, 1, eOut(u)) : 1})`, transformOrigin: '50% 80%'}}>{ch}</span>;
          })}
          {p >= 0.9 && p < 1.85 && cur && <span style={{display: 'inline-block', width: 70, height: 120, background: '#fff', marginLeft: 8, verticalAlign: '-8px'}} />}
        </div>
        <div style={{position: 'relative', marginTop: 26, height: 150}}>
          {p >= 1.75 && (
            <div style={{position: 'relative', display: 'inline-block', height: 150}}>
              <div style={{position: 'absolute', left: -24, right: -36, top: 0, bottom: 0, background: PLUM, borderRadius: 18, transform: `scaleY(${band}) skewX(-6deg)`, transformOrigin: '50% 0%', boxShadow: '0 10px 0 rgba(61,15,69,.25)'}} />
              <div style={{...font, position: 'relative', paddingLeft: 14, paddingTop: 4, fontSize: 124, lineHeight: '142px', color: '#fff', letterSpacing: -1, whiteSpace: 'nowrap'}}>
                <span>{TITLE[1].slice(0, n2)}</span><span style={{opacity: 0}}>{TITLE[1].slice(n2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {HOSTS.map((h, i) => <Photo key={h.name} src={h.photo ?? ''} name={h.name} x={HOST_X[i] ?? 110 + i * 360} p={p} i={i} />)}
      <Bubble p={p} x={115} from={9} to={11} text="Oracle GTTs: free!" />
      <Bubble p={p} x={505} from={9.4} to={11} text="Postgres: pg_class bloat!" />
    </AbsoluteFill>
  );
};

// Two inverted frames on the hard cuts, snapped to the audio hits (the RMS peaks sit ~0.4 frame after the grid).
const INVERT = [3, 8, 11, 14, 17, 21, 24];
export const CardCrazy6: React.FC = () => {
  useFonts();
  useMono();
  const {f, t} = useT();
  const p = beatPos(t);
  const inv = INVERT.some((s) => { const k = Math.round(B(s) * 25 + 0.4); return f >= k && f < k + 2; });
  const so = shardOut(p);
  const shards = so > 0;
  // outgoing shards carry the cracked frame as it was on the last knock; returning ones the clean frame
  const pS = p < 19.3 ? 16.99 : 20;
  return (
    <AbsoluteFill style={{background: TERM, overflow: 'hidden'}}>
      <TermText p={p} />
      {!shards && <AbsoluteFill style={{filter: inv ? 'invert(1) hue-rotate(180deg)' : undefined}}><Scene p={p} t={t} /></AbsoluteFill>}
      {shards && Array.from({length: NSH * 2}, (_, k) => {
        const i = k % NSH, inner = k >= NSH;
        const am = (SH_ANG[i] + SH_ANG[(i + 1) % NSH] + (i === NSH - 1 ? Math.PI * 2 : 0)) / 2;
        const d = so;
        const tx = Math.cos(am) * 900 * d + (rnd(k + 3) - 0.5) * 200 * d, ty = Math.sin(am) * 600 * d + 900 * d * d;
        const sc = 1 + (inner ? 1.4 : 0.6) * d, r = (rnd(k + 7) - 0.5) * 120 * d;
        return (
          <AbsoluteFill key={k} style={{clipPath: shardPoly(i, inner), transform: `translate(${tx}px, ${ty}px) rotate(${r}deg) scale(${sc})`, transformOrigin: `${HIT.x}px ${HIT.y}px`, opacity: 1 - clamp01((d - 0.75) / 0.25)}}>
            <Scene p={pS} t={t} />
          </AbsoluteFill>
        );
      })}
      {/* the text of each idea sits above the action but below the title */}
      {inP(p, 3, 8) && <MicroText p={p} />}
      <SetBanner p={p} />
      <DropText p={p} />
      <TitleLayer p={p} t={t} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};
