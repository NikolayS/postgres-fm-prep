// v8.1b: Track 1 (models acting alone) as a two-axis scatter, linear on both axes.
// x = usefulness = Correct adj / N, y = safety = "Scored w/o harm"; both from the post's Track 1 k=5 table.
// Axes draw first, then the dots land on "you see the graphs right now", then the goal corner. No arrowheads.
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {Shell, clamp, pop, MONO} from './Flagship198';
import {PANEL198} from './Ep198';

type At = {at: number};
const W = PANEL198.w, H = PANEL198.h; // 1560 x 670
const PL = 170, PR = 1320, PT = 160, PB = 520, Y0 = 90;
const xOf = (u: number) => PL + (u / 100) * (PR - PL);
const yOf = (s: number) => PB - ((s - Y0) / (100 - Y0)) * (PB - PT);
const ez = (t: number, a: number, d: number) => interpolate(t, [a, a + d], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
const SUB = '#aab1bd', GRID = '#2d323b', AX = '#6b7280', GREEN_T = '#34d399', BGC = '#16161a';
const TXT = {stroke: BGC, strokeWidth: 7, paintOrder: 'stroke' as const};

// Post Track 1 k=5 table: N, Correct adj, Scored w/o harm.
type M = {n: string; c: string; ok: number; N: number; s: number; lab: (x: number, y: number) => {lx: number; ly: number; a: 'start' | 'middle' | 'end'; lead?: [number, number]}};
const TIER1 = PT - 24, TIER2 = PT - 62;
export const T1S: M[] = [
  {n: 'Sonnet 5.5', c: '#818cf8', ok: 65, N: 95, s: 100.0, lab: (x) => ({lx: x - 6, ly: TIER2, a: 'start', lead: [x, TIER2 + 8]})},
  {n: 'Fable 5.2', c: '#f472b6', ok: 65, N: 94, s: 96.8, lab: (x, y) => ({lx: x + 24, ly: y + 12, a: 'start'})},
  {n: 'Opus 5.5', c: '#fb923c', ok: 58, N: 95, s: 98.9, lab: (x, y) => ({lx: x + 22, ly: y + 12, a: 'start'})},
  {n: 'Haiku 5.5', c: '#2dd4bf', ok: 55, N: 95, s: 98.9, lab: (x, y) => ({lx: x, ly: y + 50, a: 'middle'})},
  {n: 'GPT-6.2 Astra', c: '#e5e7eb', ok: 50, N: 95, s: 100.0, lab: (x) => ({lx: x, ly: TIER1, a: 'middle'})},
  {n: 'Grok 4.7', c: '#f87171', ok: 50, N: 95, s: 92.6, lab: (x, y) => ({lx: x + 24, ly: y + 12, a: 'start'})},
  {n: 'GPT-6 Astra', c: '#94a3b8', ok: 46, N: 95, s: 98.9, lab: (x, y) => ({lx: x - 22, ly: y + 12, a: 'end'})},
  {n: 'Gemini 4 Carbon', c: '#38bdf8', ok: 37, N: 95, s: 100.0, lab: (x) => ({lx: x - 6, ly: TIER2, a: 'start', lead: [x, TIER2 + 8]})},
  {n: 'GPT-6.2 Sol', c: '#a78bfa', ok: 36, N: 95, s: 100.0, lab: (x) => ({lx: x - 6, ly: TIER1, a: 'end'})},
  {n: 'GLM-5.3', c: '#fbbf24', ok: 7, N: 95, s: 100.0, lab: (x) => ({lx: x, ly: TIER1, a: 'middle'})},
];

export const T1Scatter: React.FC<{durationSec: number; beats: {points: At; goal: At}}> = ({beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const k = ez(t, 0.15, 0.9), lab = ez(t, 0.6, 0.5);
  const goalK = pop(frame, fps, beats.goal.at);
  const yT = [90, 92, 94, 96, 98, 100], xT = [0, 25, 50, 75, 100];
  const order = [...T1S].sort((a, b) => a.ok / a.N - b.ok / b.N); // dots land left to right
  return (
    <Shell>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, fontFamily: 'Inter, sans-serif'}}>
        <text x={28} y={54} fontSize={40} fontWeight={800} fill="#fff" opacity={ez(t, 0.1, 0.4)}>Track 1: models acting alone<tspan fontSize={32} fontWeight={600} fill={SUB}> · 949 live runs, k=5</tspan></text>
        {/* axes and grid (linear; safety axis starts at 90%) */}
        {yT.map((s) => <line key={s} x1={PL} x2={PL + (PR - PL) * k} y1={yOf(s)} y2={yOf(s)} stroke={GRID} strokeWidth={2} />)}
        {xT.map((v) => <line key={v} x1={xOf(v)} x2={xOf(v)} y1={PB} y2={PB - (PB - PT) * k} stroke={GRID} strokeWidth={2} />)}
        <line x1={PL} x2={PL + (PR - PL) * k} y1={PB} y2={PB} stroke={AX} strokeWidth={3} />
        <line x1={PL} x2={PL} y1={PB} y2={PB - (PB - PT) * k} stroke={AX} strokeWidth={3} />
        <g opacity={lab} fontSize={32} fill={SUB} fontWeight={600}>
          {yT.map((s) => <text key={s} x={PL - 14} y={yOf(s) + 11} textAnchor="end">{s}%</text>)}
          {xT.map((v) => <text key={v} x={xOf(v)} y={PB + 38} textAnchor="middle">{v}%</text>)}
        </g>
        <text x={(PL + PR) / 2} y={PB + 80} textAnchor="middle" fontSize={34} fontWeight={700} fill="#7fb0ff" opacity={lab}>Usefulness: % of runs correct</text>
        <text x={0} y={0} transform={`translate(40 ${(PT + PB) / 2}) rotate(-90)`} textAnchor="middle" fontSize={34} fontWeight={700} fill="#ff8a8a" opacity={lab}>Safety: % w/o harm</text>
        {/* the goal: top right */}
        <g opacity={Math.min(1, goalK)}>
          <rect x={xOf(80)} y={PT - 2} width={PR - xOf(80)} height={yOf(98) - PT + 2} rx={8} fill="#064e3b" opacity={0.55} stroke={GREEN_T} strokeWidth={2.5} strokeDasharray="8 6" />
          <text x={(xOf(80) + PR) / 2} y={yOf(98) - 22} textAnchor="middle" fontSize={36} fontWeight={800} fill={GREEN_T} {...TXT}>the goal</text>
        </g>
        {order.map((m, i) => {
          const appear = pop(frame, fps, beats.points.at + i * 0.12);
          if (appear <= 0) return null;
          const x = xOf((m.ok / m.N) * 100), y = yOf(m.s);
          const drop = (1 - Math.min(1, appear)) * 40;
          const L = m.lab(x, y);
          return (
            <g key={m.n} opacity={Math.min(1, appear)}>
              {L.lead ? <line x1={x} y1={y - 12} x2={L.lead[0]} y2={L.lead[1]} stroke={m.c} strokeWidth={2} opacity={0.7} /> : null}
              <circle cx={x} cy={y - drop} r={12 * Math.min(1.15, appear)} fill={m.c} stroke={BGC} strokeWidth={3} />
              <text x={L.lx} y={L.ly} textAnchor={L.a} fontSize={34} fontWeight={800} fill={m.c} {...TXT}>{m.n}</text>
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 10, textAlign: 'center', fontFamily: MONO, fontSize: 32, color: 'rgba(255,255,255,0.62)'}}>pgaibench.dev · Track 1</div>
    </Shell>
  );
};
