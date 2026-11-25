import {interpolate, useCurrentFrame, useVideoConfig, Easing, Img, staticFile} from 'remotion';
import {AMBER, At, BandShell, CARD, Chip, DIM, Dots, GREEN, GREEN_D, MONO, RED, RED_D, Shell, SourceLine, Stamp, clamp, ease, fmt, pop} from './Flagship198';

// Episode 198 storyboard rows built by illus-2 (R/for-nik/10-storyboard.md). One idea per card.
// Numbers: https://postgres.ai/blog/20261123-pgaibench (post), pgaibench.dev (site), PostgreSQL 18
// docs. `beats` are seconds from the overlay start (scripts/items-illus2.ts maps the spoken words).

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps, t: frame / fps};
};
const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- row 1: one engineer, 1,000 clusters (center)
export const R01Clusters: React.FC<{durationSec: number; beats: {eng: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const order = Array.from({length: 1000}, (_, i) => i).sort((a, b) => rnd(a) - rnd(b));
  const rank: number[] = [];
  order.forEach((c, r) => (rank[c] = r));
  const filled = Math.floor(interpolate(t, [0.3, 2.4], [0, 1000], {...clamp, easing: Easing.in(Easing.quad)}));
  const engK = pop(frame, fps, beats.eng.at);
  const C = 40, S = 17, G = 4;
  return (
    <Shell>
      <div style={{position: 'absolute', left: 40, top: 30, width: 620}}>
        <div style={{fontSize: 40, color: DIM, fontWeight: 600}}>The goal</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 10, opacity: Math.min(1, engK), transform: `scale(${0.6 + 0.4 * engK})`, transformOrigin: 'left center'}}>
          <div style={{fontSize: 200, fontWeight: 800, color: GREEN, lineHeight: 1}}>1</div>
          <svg width={90} height={110} viewBox="0 0 90 110"><circle cx={45} cy={28} r={22} fill={GREEN} /><path d="M5 108 C5 70 25 58 45 58 C65 58 85 70 85 108 Z" fill={GREEN} /></svg>
          <div style={{fontSize: 48, fontWeight: 700}}>engineer</div>
        </div>
        <div style={{fontSize: 200, fontWeight: 800, color: '#60a5fa', lineHeight: 1, marginTop: 20, fontVariantNumeric: 'tabular-nums'}}>{fmt(Math.max(1, filled))}</div>
        <div style={{fontSize: 48, fontWeight: 700, marginTop: 6}}>clusters, reliably</div>
      </div>
      <div style={{position: 'absolute', left: 690, top: 50, width: C * (S + G), display: 'flex', flexWrap: 'wrap', gap: G}}>
        {Array.from({length: 1000}, (_, i) => (
          <div key={i} style={{width: S, height: S, borderRadius: 4, background: rank[i] < filled ? '#60a5fa' : 'rgba(255,255,255,0.07)'}} />
        ))}
      </div>
      <SourceLine text="postgres.ai/blog/20261123-pgaibench · the goal" />
    </Shell>
  );
};

// ---------- row 2: would you let an AI run DDL on production? (band)
export const R02Ddl: React.FC<{durationSec: number; beats: {ask: At}}> = ({beats}) => {
  const {t} = useT();
  const cmd = 'ALTER TABLE …';
  const n = Math.floor(interpolate(t, [0.5, 1.4], [0, cmd.length], clamp));
  const blink = Math.floor(t * 2.5) % 2 === 0;
  const askK = ease(t, beats.ask.at, 0.25);
  return (
    <BandShell>
      <div style={{fontFamily: MONO, fontSize: 66, whiteSpace: 'pre'}}>
        <span style={{color: GREEN}}>prod=# </span>{cmd.slice(0, n)}<span style={{opacity: t < beats.ask.at && blink ? 1 : 0, background: '#fff'}}> </span>
      </div>
      <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 80, fontWeight: 700, color: AMBER, opacity: askK, transform: `scale(${0.7 + 0.3 * askK})`, whiteSpace: 'nowrap'}}>
        Allow? [y/N]
      </div>
    </BandShell>
  );
};

// ---------- row 4: PGAIBench v0.2 (band)
export const R04Bench: React.FC<{durationSec: number}> = () => {
  const {frame, fps, t} = useT();
  const k = pop(frame, fps, 0.35);
  return (
    <BandShell>
      <div style={{position: 'relative', width: 680, height: 124}}>
        <Stamp text="PGAIBench v0.2" color="#fff" k={k} size={76} rot={-3} style={{left: 0, top: 8}} />
      </div>
      <div style={{opacity: ease(t, 0.9, 0.5)}}>
        <div style={{fontSize: 46, fontWeight: 700, whiteSpace: 'nowrap'}}>live two-node Postgres 18.7</div>
        <div style={{fontFamily: MONO, fontSize: 50, color: '#60a5fa', fontWeight: 600}}>pgaibench.dev</div>
      </div>
    </BandShell>
  );
};

// ---------- row 5: no human baseline yet (band)
export const R05Baseline: React.FC<{durationSec: number; beats: {slot: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const slotK = pop(frame, fps, beats.slot.at);
  return (
    <BandShell>
      <div style={{width: 120, height: 120, border: '6px dashed rgba(255,255,255,0.85)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96, fontWeight: 800, opacity: Math.min(1, slotK), transform: `scale(${slotK})`}}>?</div>
      <div style={{fontSize: 72, fontWeight: 800, whiteSpace: 'nowrap', opacity: ease(t, 0.3, 0.4)}}>No human baseline yet</div>
      <div style={{marginLeft: 'auto', opacity: ease(t, beats.slot.at + 1.2, 0.4)}}><Chip text="coming" color="#111" bg={AMBER} size={52} /></div>
    </BandShell>
  );
};

// ---------- row 9: told not to restart; restarted 5 of 5 (center)
export const R09Restart: React.FC<{durationSec: number; beats: {kirk: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const hits = Math.min(5, Math.floor(interpolate(t, [0.5, 2.3], [0, 5.01], clamp)));
  const lastHit = 0.5 + (hits - 1) * 0.45;
  const jolt = hits > 0 ? Math.max(0, 1 - (t - lastHit) / 0.25) : 0;
  const kirkK = pop(frame, fps, beats.kirk.at);
  return (
    <Shell>
      <div style={{position: 'absolute', left: 80, top: 60, width: 420, height: 500, borderRadius: 18, background: '#2a2a31', border: '4px solid rgba(255,255,255,0.25)', transform: `translateX(${Math.sin(frame * 3) * jolt * 10}px)`}}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{position: 'absolute', left: 30, right: 30, top: 40 + i * 90, height: 60, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', paddingLeft: 20}}><div style={{width: 18, height: 18, borderRadius: 9, background: i < hits ? RED : GREEN}} /></div>)}
        <div style={{position: 'absolute', left: 60, top: 130, width: 300, padding: '18px 10px', background: '#fde047', color: '#111', fontSize: 52, fontWeight: 900, lineHeight: 1.0, textAlign: 'center', transform: `rotate(${-5 + jolt * 4}deg)`, boxShadow: '0 8px 20px rgba(0,0,0,0.4)'}}>DO NOT RESTART</div>
        <div style={{position: 'absolute', left: 30, top: 330}}><Stamp text="IGNORED" color={RED} k={kirkK} size={72} rot={-12} style={{position: 'relative'}} /></div>
      </div>
      <div style={{position: 'absolute', left: 580, top: 70}}>
        <div style={{display: 'flex', gap: 14}}>
          {[0, 1, 2, 3, 4].map((i) => <svg key={i} width={96} height={96} viewBox="0 0 96 96" style={{transform: `rotate(${i < hits ? Math.min(1, (t - 0.5 - i * 0.45) / 0.4) * 360 : 0}deg)`}}><path d="M78 48 A30 30 0 1 1 64 22" stroke={i < hits ? RED : 'rgba(255,255,255,0.15)'} strokeWidth={10} fill="none" strokeLinecap="round" /><path d="M54 8 L72 22 L52 32 Z" fill={i < hits ? RED : 'rgba(255,255,255,0.15)'} /></svg>)}
        </div>
        <div style={{fontSize: 230, fontWeight: 800, color: RED, lineHeight: 1.0, marginTop: 10}}>{hits} of 5</div>
        <div style={{fontSize: 44, fontWeight: 700, marginTop: 8}}>runs restarted the nodes</div>
        <div style={{fontFamily: MONO, fontSize: 32, color: DIM, marginTop: 10}}>claude-fable-5.2 · task C18</div>
      </div>
      <SourceLine text="pgaibench.dev · Track 1, task C18" />
    </Shell>
  );
};

// ---------- row 10: 2 stopped in rehearsal, 3 hit the live cluster (band)
export const R10Runs: React.FC<{durationSec: number; beats: {two: At; three: At}}> = ({beats}) => {
  const {t} = useT();
  const tile = (i: number) => {
    const amber = i < 2;
    const k = ease(t, amber ? beats.two.at + i * 0.2 : beats.three.at + (i - 2) * 0.2, 0.3);
    return <div key={i} style={{width: 96, height: 96, borderRadius: 12, background: k > 0 ? (amber ? AMBER : RED) : 'rgba(255,255,255,0.12)', opacity: 0.35 + 0.65 * k, transform: `scale(${0.85 + 0.15 * k})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 66, fontWeight: 900, color: '#111'}}>{k > 0 ? (amber ? '■' : '✕') : ''}</div>;
  };
  return (
    <BandShell>
      <div style={{display: 'flex', gap: 12}}>{[0, 1, 2, 3, 4].map(tile)}</div>
      <div>
        <div style={{fontSize: 50, fontWeight: 800, color: AMBER, opacity: ease(t, beats.two.at, 0.3), whiteSpace: 'nowrap', lineHeight: 1.1}}><span style={{fontFamily: MONO, fontSize: 40, color: DIM}}>task C18 · </span>2 stopped in rehearsal</div>
        <div style={{fontSize: 50, fontWeight: 800, color: RED, opacity: ease(t, beats.three.at, 0.3), whiteSpace: 'nowrap', lineHeight: 1.1}}>3 hit live: standby replay paused</div>
      </div>
    </BandShell>
  );
};

// ---------- row 11: max_locks_per_transaction: standby first (center)
export const R11Locks: React.FC<{durationSec: number; beats: {replicas: At; primary: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const node = (title: string, step: string, at: number, x: number) => {
    const k = pop(frame, fps, at);
    return (
      <div style={{position: 'absolute', left: x, top: 150, width: 560, height: 230, borderRadius: 16, background: k > 0.5 ? GREEN_D : CARD, border: `4px solid ${k > 0.5 ? GREEN : 'rgba(255,255,255,0.3)'}`, padding: '18px 26px', boxSizing: 'border-box'}}>
        <div style={{fontSize: 52, fontWeight: 800}}>{title}</div>
        <div style={{marginTop: 22, fontSize: 44, fontWeight: 700, color: GREEN, opacity: Math.min(1, k), transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: 'left center', whiteSpace: 'nowrap'}}>{step}</div>
      </div>
    );
  };
  return (
    <Shell>
      <div style={{position: 'absolute', left: 50, top: 36, fontFamily: MONO, fontSize: 60, fontWeight: 600, color: '#fde047', opacity: ease(t, 0.2, 0.4)}}>max_locks_per_transaction</div>
      {node('STANDBY', '1. raise + restart', beats.replicas.at, 50)}
      <div style={{position: 'absolute', left: 640, top: 225, fontSize: 90, color: DIM, opacity: ease(t, beats.primary.at - 0.4, 0.3)}}>→</div>
      {node('PRIMARY', '2. raise + restart', beats.primary.at, 760)}
      <div style={{position: 'absolute', left: 50, right: 60, top: 420, fontSize: 34, lineHeight: 1.3, opacity: ease(t, 1.0, 0.5)}}>
        “When running a standby server, you must set this parameter to have the same or higher value as on the primary server.”
      </div>
      <SourceLine text="postgresql.org/docs/18/runtime-config-locks.html" />
    </Shell>
  );
};

// ---------- row 12: escalated to a human, 35 of 95; editor's note on the on-air "80%" (band)
export const R12Esc: React.FC<{durationSec: number; beats?: {note?: At}}> = ({beats}) => {
  const {t} = useT();
  const lit = Math.round(interpolate(t, [0.4, 1.6], [0, 35], clamp));
  const noteAt = beats?.note?.at ?? 1e9;
  const n = ease(t, noteAt, 0.35);
  return (
    <BandShell>
      <div style={{position: 'absolute', left: 28, right: 28, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 28, opacity: 1 - n}}>
        <div style={{fontSize: 124, fontWeight: 800, color: AMBER, lineHeight: 1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>{lit}<span style={{fontSize: 64, color: DIM}}> of 95</span></div>
        <div>
          <div style={{fontSize: 56, fontWeight: 800, whiteSpace: 'nowrap', lineHeight: 1.1}}>runs escalated to a human</div>
          <div style={{fontFamily: MONO, fontSize: 44, color: DIM}}>gpt-6.2-sol</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 28, right: 28, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: n, transform: `translateY(${(1 - n) * 20}px)`}}>
        <div style={{fontSize: 52, fontWeight: 800, color: AMBER, whiteSpace: 'nowrap', lineHeight: 1.15}}>Editor's note: not 80%</div>
        <div style={{fontSize: 46, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1.15}}><span style={{fontFamily: MONO}}>gpt-6.2-sol</span> escalated 35 of 95 runs (37%)</div>
      </div>
    </BandShell>
  );
};

// ---------- row 13a: metric 1, safety: what counts as harm (band)
export const R13Safety: React.FC<{durationSec: number; beats: {down: At; loss: At; over: At}}> = ({beats}) => {
  const {frame, fps} = useT();
  const chip = (text: string, at: number) => {
    const k = pop(frame, fps, at);
    return <div key={text} style={{opacity: Math.min(1, k), transform: `scale(${k})`}}><Chip text={text} color="#fff" bg={RED} size={54} /></div>;
  };
  return (
    <BandShell>
      <div style={{fontSize: 72, fontWeight: 800}}>SAFETY</div>
      {chip('downtime', beats.down.at)}
      {chip('data loss', beats.loss.at)}
      {chip('overspending', beats.over.at)}
    </BandShell>
  );
};

// ---------- rows 13b + 14: two axes, then Track 1 outcomes (center)
const T1 = [ // post Track 1 table: correct adj, pending esc., ineff./miss, invalid, trapped (reh+pat), lab-primary harmful
  ['sonnet-5.5', 65, 21, 2, 0, 7, 0], ['fable-5.2', 65, 22, 2, 0, 2, 3], ['opus-5.5', 58, 29, 7, 0, 0, 1], ['haiku-5.5', 55, 28, 6, 0, 5, 1],
  ['gpt-6.2-astra', 50, 29, 15, 0, 1, 0], ['grok-4.7', 50, 27, 6, 4, 1, 7], ['gpt-6-astra', 46, 24, 19, 0, 5, 1], ['gemini-4-carbon', 37, 21, 5, 31, 1, 0],
  ['gpt-6.2-sol', 36, 35, 23, 0, 1, 0], ['glm-5.3', 7, 5, 0, 83, 0, 0],
] as const;
const T1C = [GREEN, AMBER, '#64748b', '#3f3f46', '#a78bfa', RED];
const T1L = ['correct', 'escalated', 'missed', 'invalid', 'trapped', 'harm'];

export const Track1Bars: React.FC<{t: number; at: number; glmAt?: number}> = ({t, at, glmAt}) => {
  const W = 880;
  return (
    <div style={{position: 'absolute', left: 40, top: 30, right: 40}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 20}}>
        <div style={{fontSize: 48, fontWeight: 800}}>Models acting alone</div>
        <div style={{fontSize: 34, color: DIM}}>949 live runs</div>
      </div>
      <div style={{display: 'flex', gap: 22, marginTop: 8, fontSize: 30}}>
        {T1L.map((l, i) => <span key={l} style={{display: 'flex', alignItems: 'center', gap: 8}}><span style={{width: 22, height: 22, borderRadius: 4, background: T1C[i], display: 'inline-block'}} />{l}</span>)}
      </div>
      <div style={{marginTop: 12}}>
        {T1.map((r, i) => {
          const g = ease(t, at + 0.2 + i * 0.12, 0.7);
          const glm = r[0] === 'glm-5.3' && glmAt !== undefined ? ease(t, glmAt, 0.4) : 0;
          let x = 0;
          return (
            <div key={r[0]} style={{display: 'flex', alignItems: 'center', height: 44, marginBottom: 4}}>
              <div style={{width: 270, fontFamily: MONO, fontSize: 30, color: glm ? '#fff' : DIM}}>{r[0]}</div>
              <div style={{position: 'relative', width: W, height: 36}}>
                {(r.slice(1) as number[]).map((v, j) => {
                  const w = (v / 95) * W * g;
                  const el = <div key={j} style={{position: 'absolute', left: x, width: w, top: 0, bottom: 0, background: T1C[j], outline: j === 3 && glm ? `4px solid #fff` : undefined}} />;
                  x += w;
                  return el;
                })}
              </div>
              {glm ? <div style={{marginLeft: 14, fontSize: 32, fontWeight: 800, color: '#fde047', whiteSpace: 'nowrap', opacity: glm}}>83 of 95 invalid</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const R13Axes14: React.FC<{durationSec: number; beats: {goal: At; bars: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const sw = interpolate(t, [beats.bars.at, beats.bars.at + 0.45], [0, 1], clamp);
  const ax = ease(t, 0.2, 0.9), ay = ease(t, 0.9, 0.9);
  const goalK = pop(frame, fps, beats.goal.at);
  const O = {x: 300, y: 470}, L = 1000, H = 400;
  return (
    <Shell>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - sw}}>
        <svg width={1560} height={670} style={{position: 'absolute', left: 0, top: 0}}>
          <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#fff" /></marker></defs>
          <line x1={O.x} y1={O.y} x2={O.x + L * ax} y2={O.y} stroke="#fff" strokeWidth={6} markerEnd="url(#ah)" />
          <line x1={O.x} y1={O.y} x2={O.x} y2={O.y - H * ay} stroke="#fff" strokeWidth={6} markerEnd="url(#ah)" />
        </svg>
        <div style={{position: 'absolute', left: 15, top: 70, width: 240, textAlign: 'right', opacity: ay}}>
          <div style={{fontSize: 52, fontWeight: 800, color: RED}}>SAFETY</div>
          <div style={{fontSize: 30, color: DIM}}>runs scored without harm</div>
        </div>
        <div style={{position: 'absolute', left: O.x + L - 460, top: O.y + 16, width: 460, textAlign: 'right', opacity: ax}}>
          <div style={{fontSize: 52, fontWeight: 800, color: '#60a5fa'}}>USEFULNESS</div>
          <div style={{fontSize: 30, color: DIM}}>adjudicated correct runs</div>
        </div>
        <div style={{position: 'absolute', left: O.x + L - 300, top: O.y - H - 10, opacity: Math.min(1, goalK), transform: `scale(${goalK})`, display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{width: 60, height: 60, borderRadius: 30, background: GREEN, boxShadow: `0 0 40px ${GREEN}`}} />
          <div style={{fontSize: 44, fontWeight: 800}}>the goal</div>
        </div>
      </div>
      {sw > 0 ? <div style={{position: 'absolute', inset: 0, opacity: sw}}><Track1Bars t={t} at={beats.bars.at} /></div> : null}
      <SourceLine text={t < beats.bars.at ? 'pgaibench.dev · Safety vs. Usefulness' : 'pgaibench.dev · Track 1, Figure 1'} />
    </Shell>
  );
};

// ---------- row 14b: "if you hear the sound you just heard": the bars again + GLM (center)
export const R14Sound: React.FC<{durationSec: number; beats: {glm: At}}> = ({beats}) => {
  const {t} = useT();
  const pulse = t < 3.5 ? 1 + 0.12 * Math.sin(t * 9) : 1;
  return (
    <Shell>
      <Track1Bars t={t} at={0} glmAt={beats.glm.at} />
      <div style={{position: 'absolute', right: 30, top: 24, display: 'flex', alignItems: 'center', gap: 12, opacity: 1 - ease(t, 4, 0.5), transform: `scale(${pulse})`}}>
        <svg width={64} height={64} viewBox="0 0 64 64"><path d="M8 24 H20 L36 10 V54 L20 40 H8 Z" fill="#fde047" /><path d="M44 20 Q54 32 44 44 M50 12 Q66 32 50 52" stroke="#fde047" strokeWidth={5} fill="none" strokeLinecap="round" /></svg>
        <div style={{fontSize: 36, fontWeight: 800, color: '#fde047'}}>this sound = look</div>
      </div>
      <SourceLine text="pgaibench.dev · Track 1, Figure 1" />
    </Shell>
  );
};

// ---------- row 17: DBLab Engine vs DBLab Forge (center)
export const R17Dblab: React.FC<{durationSec: number; beats: {forge: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const forgeK = pop(frame, fps, beats.forge.at);
  const stream = (t * 1.2) % 1;
  return (
    <Shell>
      <div style={{position: 'absolute', left: 30, top: 30, width: 720}}>
        <div style={{fontSize: 52, fontWeight: 800}}>DBLab Engine</div>
        <div style={{fontSize: 34, color: DIM}}>shared · CoW branches in seconds</div>
        <svg width={700} height={420} style={{marginTop: 10}}>
          <rect x={20} y={170} width={180} height={90} rx={14} fill="#334155" />
          <text x={110} y={225} textAnchor="middle" fontSize={34} fontWeight={700} fill="#fff">1 disk</text>
          {Array.from({length: 7}, (_, i) => {
            const g = ease(t, 0.4 + i * 0.18, 0.4);
            const y = 30 + i * 58;
            return (
              <g key={i} opacity={g}>
                <path d={`M200 215 C 330 215 360 ${y + 20} ${200 + 300 * g} ${y + 20}`} stroke="#60a5fa" strokeWidth={4} fill="none" />
                <rect x={500} y={y} width={170 * g} height={40} rx={8} fill="rgba(96,165,250,0.25)" stroke="#60a5fa" strokeWidth={3} />
                <text x={585} y={y + 29} textAnchor="middle" fontSize={26} fill="#fff" opacity={g}>branch {i + 1}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{position: 'absolute', left: 800, top: 30, width: 720, opacity: Math.min(1, forgeK), transform: `translateY(${(1 - forgeK) * 40}px)`}}>
        <div style={{fontSize: 52, fontWeight: 800}}>DBLab Forge</div>
        <div style={{fontSize: 34, color: DIM}}>dedicated primary + standby</div>
        <div style={{position: 'relative', marginTop: 110, height: 220}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 280, height: 160, borderRadius: 16, background: GREEN_D, border: `4px solid ${GREEN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800}}>PRIMARY</div>
          <div style={{position: 'absolute', left: 300, top: 70, width: 110, height: 6, background: 'rgba(255,255,255,0.3)'}} />
          <div style={{position: 'absolute', left: 300 + 100 * stream, top: 62, width: 22, height: 22, borderRadius: 11, background: '#fff'}} />
          <div style={{position: 'absolute', left: 420, top: 0, width: 280, height: 160, borderRadius: 16, background: CARD, border: '4px solid #60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800}}>STANDBY</div>
        </div>
      </div>
      <SourceLine text="postgres.ai/products/dblab_engine · postgres.ai/products/dblab-forge" />
    </Shell>
  );
};

// ---------- row 20: read replicas belong in the test environment (band)
export const R20Replicas: React.FC<{durationSec: number; beats: {test: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const k = pop(frame, fps, beats.test.at);
  const box = (label: string, color: string) => <div style={{width: 250, height: 112, borderRadius: 14, border: `6px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 800, whiteSpace: 'nowrap'}}>{label}</div>;
  return (
    <BandShell>
      {box('primary', GREEN)}
      <div style={{opacity: Math.min(1, k), transform: `translateX(${(1 - k) * 60}px) scale(${0.7 + 0.3 * k})`}}>{box('standby', '#60a5fa')}</div>
      <div style={{fontSize: 54, fontWeight: 800, lineHeight: 1.1, opacity: ease(t, 0.4, 0.4), whiteSpace: 'nowrap'}}>
        Replicas in prod?<br /><span style={{color: '#60a5fa'}}>Test with them too.</span>
      </div>
    </BandShell>
  );
};

// ---------- row 30: the cases are real production failures (band)
export const R30Real: React.FC<{durationSec: number; beats: {real: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const k = pop(frame, fps, beats.real.at);
  return (
    <BandShell>
      <div style={{position: 'relative', width: 300, height: 116}}>
        <Stamp text="REAL" color={RED} k={k} size={88} rot={-6} style={{left: 10, top: 2}} />
      </div>
      <div style={{opacity: ease(t, 0.2, 0.4)}}>
        <div style={{fontSize: 56, fontWeight: 800, whiteSpace: 'nowrap', lineHeight: 1.1}}>Most cases: real failures</div>
        <div style={{fontSize: 44, color: DIM, whiteSpace: 'nowrap'}}>that had passed human review</div>
      </div>
    </BandShell>
  );
};

// ---------- row 35: two AIs agreeing (band)
const Bot: React.FC<{nod: number}> = ({nod}) => (
  <svg width={112} height={124} viewBox="0 0 96 110" style={{transform: `translateY(${nod * 6}px)`}}>
    <line x1={48} y1={4} x2={48} y2={20} stroke="#cbd5e1" strokeWidth={5} /><circle cx={48} cy={6} r={6} fill="#cbd5e1" />
    <rect x={8} y={20} width={80} height={66} rx={16} fill="#cbd5e1" />
    <circle cx={32} cy={52} r={8} fill="#111" /><circle cx={64} cy={52} r={8} fill="#111" />
  </svg>
);
export const R35Agree: React.FC<{durationSec: number; beats: {wrong: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const nod = Math.abs(Math.sin(t * 6)) * (t < beats.wrong.at ? 1 : 0);
  const q = pop(frame, fps, beats.wrong.at);
  return (
    <BandShell>
      <Bot nod={nod} />
      <div style={{width: 110, textAlign: 'center', fontSize: 110, fontWeight: 900, color: q > 0.5 ? AMBER : GREEN, lineHeight: 1}}>{q > 0.5 ? '?' : '✓'}</div>
      <Bot nod={nod} />
      <div style={{fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginLeft: 12, whiteSpace: 'nowrap'}}>
        “Two AIs agreeing does not<br />make either one correct.”
      </div>
    </BandShell>
  );
};

// ---------- row 36: major upgrade, ANALYZE forgotten on the weekend (band)
export const R36Analyze: React.FC<{durationSec: number; beats: {wk: At; mon: At; stats: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const day = (d: string, ok: boolean, at: number) => {
    const k = ease(t, at, 0.3);
    return <div key={d} style={{width: 150, height: 120, borderRadius: 14, background: k > 0 ? (ok ? GREEN_D : RED_D) : CARD, border: `5px solid ${k > 0 ? (ok ? GREEN : RED) : 'rgba(255,255,255,0.2)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 800, lineHeight: 1.05}}>{d}<span style={{fontSize: 50, color: ok ? GREEN : RED, opacity: k}}>{ok ? '✓' : '✕'}</span></div>;
  };
  const sK = pop(frame, fps, beats.stats.at);
  return (
    <BandShell>
      <div style={{fontSize: 46, fontWeight: 800, lineHeight: 1.1, whiteSpace: 'nowrap'}}>upgrade,<br /><span style={{color: AMBER}}>no ANALYZE</span></div>
      {day('Sat', true, beats.wk.at)}
      {day('Sun', true, beats.wk.at + 0.25)}
      {day('Mon', false, beats.mon.at)}
      <div style={{position: 'relative', width: 420, height: 110}}><Stamp text="no statistics" color={RED} k={sK} size={56} rot={-5} style={{left: 0, top: 10}} /></div>
    </BandShell>
  );
};

// ---------- row 7, beat 1: where the index is used (band)
export const L9Setup198: React.FC<{durationSec: number; beats: {standby: At}}> = ({beats}) => {
  const {t} = useT();
  const s = ease(t, beats.standby.at, 0.35);
  return (
    <BandShell>
      <div style={{lineHeight: 1.05}}>
        <div style={{fontSize: 40, fontWeight: 800, color: GREEN, whiteSpace: 'nowrap'}}>PRIMARY <span style={{color: DIM}}>·</span> <span style={{fontFamily: MONO, fontWeight: 600, color: '#fff'}}>secret_lookup</span></div>
        <div style={{fontFamily: MONO, fontSize: 60, color: AMBER, whiteSpace: 'nowrap', opacity: ease(t, 0.4, 0.3)}}>idx_scan = 0</div>
      </div>
      <div style={{width: 5, height: 110, background: 'rgba(255,255,255,0.35)', opacity: s}} />
      <div style={{opacity: s, lineHeight: 1.05, transform: `translateX(${(1 - s) * 40}px)`}}>
        <div style={{fontSize: 40, fontWeight: 800, color: '#60a5fa'}}>STANDBY</div>
        <div style={{fontSize: 54, fontWeight: 800, whiteSpace: 'nowrap'}}>reads need the <span style={{fontFamily: MONO}}>(k)</span> indexes</div>
      </div>
    </BandShell>
  );
};


// ---------- f08: DBA-Bench, a native card (replaces the raw arXiv capture) (center)
export const F08DbaBench: React.FC<{durationSec: number; beats: {quote: At}}> = ({beats}) => {
  const {t, frame, fps} = useT();
  const k = pop(frame, fps, 0.2);
  return (
    <Shell>
      <div style={{position: 'absolute', left: 60, top: 36, right: 60}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 28}}>
          <div style={{fontSize: 124, fontWeight: 900, lineHeight: 1, transform: `scale(${k})`, transformOrigin: '0 80%'}}>DBA-Bench</div>
          <div style={{fontFamily: MONO, fontSize: 40, color: '#60a5fa', opacity: ease(t, 0.6, 0.4)}}>arXiv 2607.22165</div>
        </div>
        <div style={{marginTop: 14, fontSize: 40, fontWeight: 600, color: DIM, width: 900, lineHeight: 1.2, opacity: ease(t, 0.8, 0.4)}}>A Production-Fidelity Benchmark for LLM-Based Database Operations Agents</div>
        <div style={{marginTop: 28, fontSize: 54, fontWeight: 800, width: 1000, lineHeight: 1.18, opacity: ease(t, beats.quote.at, 0.5), transform: `translateY(${(1 - ease(t, beats.quote.at, 0.5)) * 20}px)`}}>
          <span style={{color: AMBER}}>“</span>Success requires satisfying scenario-specific operational objectives <span style={{color: GREEN}}>without violating safety constraints.</span><span style={{color: AMBER}}>”</span>
        </div>
      </div>
      <div style={{position: 'absolute', right: 50, top: 170, width: 400, opacity: ease(t, 1.2, 0.5), transform: 'rotate(2deg)'}}>
        <Img src={staticFile('ep198/arxiv-dbabench.png')} style={{width: 400, borderRadius: 8, border: '4px solid rgba(255,255,255,0.8)', display: 'block'}} />
        <div style={{fontFamily: MONO, fontSize: 24, color: DIM, marginTop: 8, textAlign: 'center'}}>source: arxiv.org/abs/2607.22165</div>
      </div>
      <SourceLine text="arxiv.org/abs/2607.22165 · abstract" />
    </Shell>
  );
};
