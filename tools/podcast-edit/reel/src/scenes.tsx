import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C, ease, EASE_IO, Headline, IMPACT, INTER, lin, MONO, Terminal, Typed, typingEnd, useSpring, W} from './kit';

export const SEG = 90;

// ---------------------------------------------------------------- intro
export const Intro: React.FC = () => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const zoom = 1 + t * 0.0009;
  const sweep = lin(t, 0, 60, -60, 160);
  const sub = sp(t, 26, 240, 14);
  const bar = ease(t, 24, 40);
  return (
    <AbsoluteFill>
      {/* speed stripes behind the number */}
      {Array.from({length: 9}).map((_, i) => {
        const y = 420 + i * 72;
        const x = ((t * (14 + i * 3) + i * 230) % 1600) - 400;
        return <div key={i} style={{position: 'absolute', top: y, left: x, width: 260 + (i % 3) * 120, height: 6, background: C.orange, opacity: 0.12 + (i % 2) * 0.08, borderRadius: 3}} />;
      })}
      <div style={{position: 'absolute', top: 170, width: W, textAlign: 'center', fontFamily: IMPACT, fontSize: 168, color: C.white, letterSpacing: 6 + t * 0.06, transform: `scale(${zoom})`}}>POSTGRES</div>
      <div style={{position: 'absolute', top: 300, width: W, textAlign: 'center', fontFamily: IMPACT, fontSize: 700, lineHeight: 1, transform: `scale(${zoom * (1 + 0.012 * Math.sin(t / 4))})`,
        color: 'transparent', backgroundImage: `linear-gradient(100deg, ${C.orange} ${sweep - 30}%, #ffd2a8 ${sweep}%, ${C.orange} ${sweep + 30}%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text',
        filter: `drop-shadow(0 0 ${30 + 14 * Math.sin(t / 5)}px rgba(255,122,26,0.45))`}}>19</div>
      <div style={{position: 'absolute', top: 1030, width: W, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', padding: '6px 34px', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 0, background: C.white, transform: `scaleX(${bar})`, transformOrigin: 'left'}} />
          <span style={{position: 'relative', fontFamily: IMPACT, fontSize: 92, color: C.bg, display: 'inline-block', transform: `translateY(${(1 - sub) * 120}%)`}}>THE BEST PARTS</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- REPACK
const REPACK_SQL = 'REPACK (CONCURRENTLY) orders;';
export const Repack: React.FC = () => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const rows = [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1]; // 1 live, 0 dead
  const RH = 29, GAP = 7, TOP = 630, X = 290, BW = 500;
  let y = TOP;
  const placed = rows.map((live, i) => {
    const p = live ? 0 : ease(t, 36 + i * 1.6, 54 + i * 1.6, 0, 1, EASE_IO);
    const h = live ? RH : RH * (1 - p);
    const g = live ? GAP : GAP * (1 - p);
    const r = {live, y, h, p};
    y += h + g;
    return r;
  });
  const bottom = y;
  const enter = sp(t, 8, 170, 16);
  // writes keep landing: one INSERT packet every 9 frames, all through the shrink
  const packets = Array.from({length: 10}).map((_, k) => {
    const s = 10 + k * 8;
    const u = lin(t, s, s + 12);
    const target = placed[[0, 3, 5, 8, 10, 13, 1, 3, 8, 13][k]];
    return {u, s, target};
  });
  return (
    <AbsoluteFill>
      <Headline lines={[[{w: 'SHRINK', hot: true}, 'BLOAT.'], ['KEEP', 'WRITING.']]} />
      <Terminal y={455} enter={3}><Typed text={REPACK_SQL} start={6} cps={1.6} /></Terminal>
      <div style={{position: 'absolute', left: 0, top: 0, opacity: enter, transform: `translateY(${(1 - enter) * 60}px)`}}>
        {/* table outline that follows the content */}
        <div style={{position: 'absolute', left: X - 18, top: TOP - 18, width: BW + 36, height: bottom - TOP + 28, border: `3px solid ${C.white}`, borderRadius: 16, opacity: 0.9}} />
        <div style={{position: 'absolute', left: X - 18, top: TOP - 62, fontFamily: MONO, fontSize: 30, color: C.mid}}>orders</div>
        {placed.map((r, i) => {
          const hit = packets.some((pk) => pk.target === r && t >= pk.s + 12 && t < pk.s + 20);
          return (
            <div key={i} style={{position: 'absolute', left: X, top: r.y, width: BW, height: r.h, borderRadius: 6, overflow: 'hidden',
              background: r.live ? (hit ? C.orange : C.white) : `repeating-linear-gradient(135deg, ${C.dim} 0 10px, #2a282d 10px 20px)`,
              opacity: r.live ? 1 : 1 - r.p * 0.9, transform: r.live ? 'none' : `scaleX(${1 - r.p * 0.3})`}} />
          );
        })}
        {/* shrinking size bracket */}
        <div style={{position: 'absolute', left: X + BW + 44, top: TOP - 4, width: 14, height: bottom - TOP, borderRight: `4px solid ${C.orange}`, borderTop: `4px solid ${C.orange}`, borderBottom: `4px solid ${C.orange}`}} />
        {packets.map((pk, k) => pk.u > 0 && pk.u < 1 && (
          <div key={k} style={{position: 'absolute', left: interpolateX(pk.u), top: pk.target.y - 6, padding: '4px 12px', borderRadius: 8, background: C.orange,
            fontFamily: MONO, fontSize: 20, color: C.bg, fontWeight: 500, opacity: pk.u < 0.9 ? 1 : (1 - pk.u) * 10}}>INSERT</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
const interpolateX = (u: number) => 20 + (290 - 110 - 20) * (1 - Math.pow(1 - u, 2));

// ---------------------------------------------------------------- NOTIFY
export const Notify: React.FC = () => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const COLS = 12, ROWS = 8, GX = 132, GY = 620, S = 74;
  const src = {x: W / 2, y: 526};
  const listeners = new Set([15, 30, 41, 58, 67, 88]);
  const phase2 = t >= 44;
  const ring = lin(t, 12, 36, 0, 900);
  const chip = sp(t, phase2 ? 44 : 8, 260, 16);
  return (
    <AbsoluteFill>
      <Headline lines={[['NOTIFY', 'WAKES'], ['ONLY', {w: 'LISTENERS', hot: true}]]} />
      <Terminal y={440} h={84} enter={2}><Typed text="NOTIFY orders;" start={4} cps={1.6} size={34} /></Terminal>
      <div style={{position: 'absolute', left: GX - 40, top: GY - 58, fontFamily: MONO, fontSize: 26, fontWeight: 500, padding: '4px 14px', borderRadius: 8,
        background: phase2 ? C.orange : C.dim, color: phase2 ? C.bg : C.white, transform: `scale(${0.8 + 0.2 * chip})`, transformOrigin: 'left'}}>{phase2 ? 'POSTGRES 19' : 'BEFORE'}</div>
      {!phase2 && <div style={{position: 'absolute', left: src.x - ring, top: src.y - ring, width: ring * 2, height: ring * 2, borderRadius: '50%', border: `3px solid ${C.white}`, opacity: lin(ring, 0, 900, 0.6, 0)}} />}
      {Array.from({length: COLS * ROWS}).map((_, i) => {
        const cx = GX + (i % COLS) * S, cy = GY + Math.floor(i / COLS) * S;
        const d = Math.hypot(cx - src.x, cy - src.y);
        const isL = listeners.has(i);
        let fill = C.dim, glow = 0, scale = 1, jit = 0;
        if (!phase2) {
          const woke = ring > d ? lin(ring - d, 0, 260, 1, 0.35) : 0;
          if (woke > 0) { fill = `rgba(245,243,238,${woke})`; jit = woke * 5; scale = 1 + woke * 0.3; }
        } else {
          const order = [...listeners].indexOf(i);
          const hitT = 54 + order * 3;
          if (isL) {
            const s = sp(t, hitT, 300, 11);
            fill = t >= hitT ? C.orange : C.dim; glow = s; scale = 1 + 0.5 * s * (t < hitT + 10 ? 1 : 0.6);
          }
        }
        const jx = jit * (random(`x${i}-${t}`) - 0.5) * 2, jy = jit * (random(`y${i}-${t}`) - 0.5) * 2;
        const ringOn = phase2 && isL ? ease(t, 44, 52) : 0;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: cx - 14 + jx, top: cy - 14 + jy, width: 28, height: 28, borderRadius: '50%', background: fill,
              transform: `scale(${scale})`, boxShadow: glow ? `0 0 ${30 * glow}px rgba(255,122,26,0.9)` : 'none', outline: ringOn ? `3px solid rgba(255,122,26,${ringOn})` : 'none', outlineOffset: 6}} />
          </React.Fragment>
        );
      })}
      {/* direct beams to the listeners */}
      {phase2 && (
        <svg width={W} height={1350} style={{position: 'absolute', left: 0, top: 0}}>
          {[...listeners].map((i, k) => {
            const cx = GX + (i % COLS) * S, cy = GY + Math.floor(i / COLS) * S;
            const u = ease(t, 46 + k * 3, 56 + k * 3);
            const fade = lin(t, 70, 86, 1, 0.25);
            return <line key={i} x1={src.x} y1={src.y} x2={src.x + (cx - src.x) * u} y2={src.y + (cy - src.y) * u} stroke={C.orange} strokeWidth={4} strokeLinecap="round" opacity={fade} />;
          })}
        </svg>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- AUTOVACUUM
export const Autovac: React.FC = () => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const names = ['events', 'users', 'logs', 'sessions', 'audit', 'payments'];
  const HOT = 5;
  const CH = 82, CG = 16, TOP = 500, X = 270, CW = 640;
  const heat = ease(t, 6, 28);
  const jump = sp(t, 32, 150, 14, 0.8);
  const clean = ease(t, 58, 76);
  const worker = sp(t, 52, 220, 16);
  return (
    <AbsoluteFill>
      <Headline lines={[[{w: 'URGENT', hot: true}, 'TABLES'], ['GO', 'FIRST']]} />
      {/* autovacuum worker at the head of the queue */}
      <div style={{position: 'absolute', left: 70, top: TOP + 14, width: 170, textAlign: 'right', fontFamily: MONO, fontSize: 24, color: C.mid, lineHeight: 1.2}}>auto&#8203;vacuum</div>
      <div style={{position: 'absolute', left: 70, top: TOP + 48, width: 170, height: 4, background: C.mid}} />
      <div style={{position: 'absolute', left: 226, top: TOP + 40, width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: `16px solid ${C.mid}`}} />
      {names.map((n, i) => {
        // queue position: the hot table jumps from slot 5 to slot 0, the rest move down by one
        const slot = i === HOT ? HOT - HOT * jump : i + jump;
        const y = TOP + slot * (CH + CG);
        const isHot = i === HOT;
        const h = isHot ? heat * (1 - clean) : [0.25, 0.4, 0.2, 0.35, 0.3][i] ?? 0;
        const shake = isHot && t > 12 && t < 34 ? Math.sin(t * 2.6) * 5 * heat : 0;
        const enter = sp(t, 4 + i * 2, 200, 16);
        return (
          <div key={n} style={{position: 'absolute', left: X + shake + (isHot ? 26 * Math.sin(Math.PI * jump) : 0), top: y, width: CW, height: CH, borderRadius: 14,
            background: isHot ? `rgba(255,122,26,${0.12 + 0.25 * h})` : C.panel, border: `3px solid ${isHot && h > 0.05 ? C.orange : C.dim}`,
            boxShadow: isHot ? `0 0 ${50 * h}px rgba(255,122,26,${0.7 * h})` : 'none', opacity: enter, transform: `translateX(${(1 - enter) * 80}px)`, zIndex: isHot ? 2 : 1,
            display: 'flex', alignItems: 'center', padding: '0 26px', boxSizing: 'border-box', gap: 20}}>
            <span style={{fontFamily: MONO, fontSize: 34, fontWeight: 500, color: C.white, width: 200}}>{n}</span>
            {/* urgency meter */}
            <div style={{flex: 1, height: 16, borderRadius: 8, background: '#2a282d', overflow: 'hidden'}}>
              <div style={{width: `${Math.max(0.05, h) * 100}%`, height: '100%', background: isHot ? C.orange : C.mid, borderRadius: 8}} />
            </div>
            {isHot && <span style={{fontFamily: IMPACT, fontSize: 40, color: C.orange, width: 40, opacity: clean, transform: `scale(${0.5 + 0.5 * clean})`}}>&#10003;</span>}
          </div>
        );
      })}
      {/* worker sweep over the hot table at the head */}
      <div style={{position: 'absolute', left: X - 6, top: TOP - 6, width: (CW + 12) * worker * (1 - lin(t, 76, 84)), height: CH + 12, borderRadius: 16, overflow: 'hidden', zIndex: 3, pointerEvents: 'none'}}>
        <div style={{width: '100%', height: '100%', background: `linear-gradient(90deg, rgba(245,243,238,0) 0%, rgba(245,243,238,0.35) 85%, ${C.white} 100%)`}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- WAIT FOR LSN
const WAIT_SQL = "WAIT FOR LSN '0/0306EE20';";
export const WaitLsn: React.FC = () => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const BY = 560, BH = 210;
  const P = {x: 70, w: 400}, R = {x: 610, w: 400};
  const write = ease(t, 4, 16);
  const wal = ease(t, 16, 56, 0, 1, EASE_IO);
  const ok = sp(t, 58, 280, 13);
  const read = ease(t, 62, 76);
  const enter = sp(t, 2, 200, 16);
  const Box: React.FC<{x: number; w: number; label: string; fill: number}> = ({x, w, label, fill}) => (
    <div style={{position: 'absolute', left: x, top: BY, width: w, height: BH, borderRadius: 18, border: `3px solid ${C.white}`, background: C.panel, opacity: enter, transform: `scale(${0.9 + 0.1 * enter})`}}>
      <div style={{fontFamily: MONO, fontSize: 28, color: C.mid, margin: '18px 24px'}}>{label}</div>
      {[0, 1, 2].map((r) => (
        <div key={r} style={{position: 'absolute', left: 24, right: 24, top: 70 + r * 44, height: 30, borderRadius: 6, background: '#2a282d', overflow: 'hidden'}}>
          {r === 2 && <div style={{width: `${fill * 100}%`, height: '100%', background: C.orange}} />}
          {r < 2 && <div style={{width: '100%', height: '100%', background: C.dim}} />}
        </div>
      ))}
    </div>
  );
  return (
    <AbsoluteFill>
      <Headline lines={[['READ', 'YOUR', {w: 'WRITES', hot: true}], ['ON', 'REPLICAS']]} size={116} />
      <Box x={P.x} w={P.w} label="primary" fill={write} />
      <Box x={R.x} w={R.w} label="replica" fill={wal} />
      {/* WAL stream */}
      <svg width={W} height={1350} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={P.x + P.w + 8} y1={BY + BH / 2} x2={R.x - 8} y2={BY + BH / 2} stroke={C.dim} strokeWidth={8} strokeLinecap="round" />
        <line x1={P.x + P.w + 8} y1={BY + BH / 2} x2={P.x + P.w + 8 + (R.x - P.x - P.w - 16) * wal} y2={BY + BH / 2} stroke={C.orange} strokeWidth={8} strokeLinecap="round" strokeDasharray="14 12" strokeDashoffset={-t * 3} />
      </svg>
      <div style={{position: 'absolute', left: P.x + P.w + 14, top: BY + BH / 2 - 52, width: R.x - P.x - P.w - 28, textAlign: 'center', fontFamily: MONO, fontSize: 24, color: C.mid}}>WAL</div>
      <Terminal y={830} h={92} enter={14}><Typed text={WAIT_SQL} start={18} cps={1.5} size={36} /></Terminal>
      <div style={{position: 'absolute', left: 70, top: 944, display: 'flex', gap: 18, alignItems: 'center', opacity: ok, transform: `scale(${0.6 + 0.4 * ok})`, transformOrigin: 'left center'}}>
        <span style={{fontFamily: MONO, fontSize: 36, fontWeight: 500, background: C.orange, color: C.bg, padding: '6px 18px', borderRadius: 10}}>success</span>
        <span style={{fontFamily: MONO, fontSize: 30, color: C.white, opacity: read}}>{'SELECT ... -> '}<span style={{color: C.orange}}>new row</span></span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- PLAN ADVICE
const ADVICE = "SET pg_plan_advice.advice = 'JOIN_ORDER(f d)';";
export const PlanAdvice: React.FC = () => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const PIN_AT = 50;
  const pin = sp(t, PIN_AT - 8, 260, 12);
  const locked = t >= PIN_AT;
  const wob = locked ? 0 : lin(t, 4, 14);
  const flip = !locked && Math.floor(t / 7) % 2 === 1;
  const lockGlow = locked ? sp(t, PIN_AT, 300, 10) : 0;
  const nodes = [
    {id: 'root', x: 540, y: 600, label: flip ? 'Nested Loop' : 'Hash Join', root: true},
    {id: 'a', x: 330, y: 790, label: flip ? 'Seq Scan d' : 'Seq Scan f'},
    {id: 'b', x: 750, y: 790, label: flip ? 'Index Scan f' : 'Hash'},
    {id: 'c', x: 750, y: 960, label: 'Seq Scan d', hide: flip},
  ];
  const pos = (n: typeof nodes[number], i: number) => ({x: n.x + wob * 14 * Math.sin(t * 1.7 + i * 2), y: n.y + wob * 10 * Math.cos(t * 1.3 + i)});
  const enter = sp(t, 2, 200, 16);
  const edges: Array<[number, number]> = [[0, 1], [0, 2], [2, 3]];
  return (
    <AbsoluteFill>
      <Headline lines={[['PLANS', 'THAT'], [{w: 'STAY', hot: true}, {w: 'PUT', hot: true}]]} />
      <Terminal y={1060} h={84} enter={18}><Typed text={ADVICE} start={20} cps={2} size={28} /></Terminal>
      <div style={{position: 'absolute', inset: 0, opacity: enter}}>
        <svg width={W} height={1350} style={{position: 'absolute', left: 0, top: 0}}>
          {edges.map(([a, b], k) => {
            if (nodes[b].hide) return null;
            const pa = pos(nodes[a], a), pb = pos(nodes[b], b);
            return <line key={k} x1={pa.x} y1={pa.y + 40} x2={pb.x} y2={pb.y - 40} stroke={locked ? C.orange : C.mid} strokeWidth={5} />;
          })}
        </svg>
        {nodes.map((n, i) => {
          if (n.hide) return null;
          const p = pos(n, i);
          return (
            <div key={n.id} style={{position: 'absolute', left: p.x - 170, top: p.y - 40, width: 340, height: 80, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: n.root && locked ? C.orange : C.panel, border: `3px solid ${locked ? C.orange : flip ? C.mid : C.white}`,
              boxShadow: locked ? `0 0 ${40 * lockGlow}px rgba(255,122,26,0.6)` : 'none',
              fontFamily: MONO, fontSize: 32, fontWeight: 500, color: n.root && locked ? C.bg : C.white, opacity: flip && !locked ? 0.75 : 1}}>{n.label}</div>
          );
        })}
        {/* the pin */}
        <div style={{position: 'absolute', left: 540 + 150 - 22, top: 600 - 40 - 74 - (1 - pin) * 520, width: 44, height: 90, opacity: t > PIN_AT - 9 ? 1 : 0}}>
          <div style={{width: 44, height: 44, borderRadius: '50%', background: C.white, border: `6px solid ${C.orange}`, boxSizing: 'border-box'}} />
          <div style={{width: 6, height: 50, background: C.white, margin: '0 auto'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- DEFAULTS
export const Defaults: React.FC = () => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const items = [
    {name: 'jit', from: 'on', to: 'off', at: 14, toggle: true, on0: true},
    {name: 'log_lock_waits', from: 'off', to: 'on', at: 34, toggle: true, on0: false},
    {name: 'default_toast_compression', from: 'pglz', to: 'lz4', at: 54, toggle: false, on0: false},
  ];
  return (
    <AbsoluteFill>
      <Headline lines={[['BETTER'], [{w: 'DEFAULTS', hot: true}]]} size={150} />
      {items.map((it, i) => {
        const enter = sp(t, 4 + i * 3, 200, 16);
        const s = sp(t, it.at, 260, 13);
        const flash = lin(t, it.at, it.at + 14, 1, 0) * (t >= it.at ? 1 : 0);
        const y = 520 + i * 200;
        const on = it.on0 ? 1 - s : s;
        return (
          <div key={it.name} style={{position: 'absolute', left: 70, right: 70, top: y, height: 160, borderRadius: 20, background: C.panel,
            border: `3px solid ${flash > 0.05 ? C.orange : C.dim}`, boxShadow: `0 0 ${60 * flash}px rgba(255,122,26,${0.6 * flash})`,
            opacity: enter, transform: `translateX(${(1 - enter) * -120}px)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', boxSizing: 'border-box'}}>
            <span style={{fontFamily: MONO, fontSize: it.name.length > 20 ? 34 : 44, fontWeight: 500, color: C.white}}>{it.name}</span>
            {it.toggle ? (
              <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
                <span style={{fontFamily: IMPACT, fontSize: 52, color: on > 0.5 ? C.orange : C.mid, width: 80, textAlign: 'right'}}>{on > 0.5 ? 'ON' : 'OFF'}</span>
                <div style={{width: 150, height: 78, borderRadius: 39, background: on > 0.5 ? C.orange : '#2a282d', border: `3px solid ${on > 0.5 ? C.orange : C.mid}`, position: 'relative', boxSizing: 'border-box'}}>
                  <div style={{position: 'absolute', top: 6, left: 6 + on * 72, width: 60, height: 60, borderRadius: 30, background: C.white}} />
                </div>
              </div>
            ) : (
              <div style={{height: 78, width: 200, overflow: 'hidden', borderRadius: 14, background: s > 0.5 ? C.orange : '#2a282d', position: 'relative'}}>
                {[it.from, it.to].map((v, k) => (
                  <div key={v} style={{position: 'absolute', width: '100%', height: 78, top: (k - s) * 78, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontSize: 44, fontWeight: 500, color: k === 1 ? C.bg : C.mid}}>{v}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- END
export const End: React.FC = () => {
  const t = useCurrentFrame();
  const sp = useSpring();
  const a = sp(t, 2, 240, 14);
  const b = sp(t, 8, 240, 12);
  const c = sp(t, 20, 200, 16);
  const d = sp(t, 28, 200, 16);
  const gather = ease(t, 0, 40, 0, 1);
  return (
    <AbsoluteFill>
      {/* 645 dots, one per contributor, gather into a field */}
      {Array.from({length: 645}).map((_, i) => {
        const fx = random(`fx${i}`) * 1400 - 160, fy = random(`fy${i}`) * 1500 - 80;
        const ang = random(`a${i}`) * Math.PI * 2, rad = Math.sqrt(random(`r${i}`));
        const tx = 540 + Math.cos(ang) * rad * 500, ty = 560 + Math.sin(ang) * rad * 430;
        const x = fx + (tx - fx) * gather, y = fy + (ty - fy) * gather;
        const tw = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t / 3 + i));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 7, height: 7, borderRadius: 4, background: i % 9 === 0 ? C.orange : C.white, opacity: tw}} />;
      })}
      <div style={{position: 'absolute', top: 250, width: W, textAlign: 'center', fontFamily: IMPACT, fontSize: 170, color: C.white, transform: `scale(${1.6 - 0.6 * a})`, opacity: a}}>POSTGRES 19</div>
      <div style={{position: 'absolute', top: 450, width: W, textAlign: 'center', fontFamily: IMPACT, fontSize: 330, lineHeight: 1, color: C.orange, transform: `scale(${1.8 - 0.8 * b})`, opacity: b,
        filter: 'drop-shadow(0 0 40px rgba(255,122,26,0.45))'}}>IS OUT</div>
      <div style={{position: 'absolute', top: 870, width: W, textAlign: 'center', fontFamily: IMPACT, fontSize: 96, color: C.white, opacity: c, transform: `translateY(${(1 - c) * 40}px)`}}>postgres.fm</div>
      <div style={{position: 'absolute', top: 1010, width: W, textAlign: 'center', fontFamily: INTER, fontWeight: 500, fontSize: 40, color: C.mid, opacity: d, transform: `translateY(${(1 - d) * 30}px)`}}>Thank you, 645 contributors</div>
    </AbsoluteFill>
  );
};
