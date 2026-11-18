// Chart-first card as one SVG string (no React, no DOM): the Remotion ChartCard, the contact
// sheet and the research cheat sheet all draw the same picture. Layout of the 1560x640 panel
// (the "center" placement, frame x 40-1600, y 250-890; nothing in the bottom 180 px):
// chip and headline on top, the chart on the left, 1-2 hero numbers on the right.
// Linear scales only, every axis starts at 0. Manifest format: cards/card.ts.
import type { Card, Chart, Finding, NumberRef } from "../../cards/card";

export const PANEL = { x: 40, y: 250, w: 1560, h: 640 };
export const PALETTE = ["#2a78d6", "#d9822b", "#7a5bd6", "#3a9d6a", "#a8433b", "#8b95a1"];
const INK = "#1d2530", SOFT = "#4c5766", FAINT = "#6b7581", LINE = "#d4d9e0", PLUM = "#3d0f45";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r1 = (v: number) => Math.round(v * 10) / 10;
function disp(n: NumberRef): string {
  if (n.display) return n.display;
  const d = Number.isInteger(n.value) ? 0 : Math.min(2, String(n.value).split(".")[1]?.length ?? 0);
  return n.value.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) + (n.unit ?? "");
}
const text = (x: number, y: number, s: string, size: number, o: { weight?: number; fill?: string; anchor?: string; cls?: string } = {}) =>
  `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-weight="${o.weight ?? 400}" fill="${o.fill ?? INK}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.cls ? ` class="${o.cls}"` : ""}>${esc(s)}</text>`;

// A tick step of 1, 2 or 5 x 10^k giving 3-6 ticks.
export function niceStep(max: number): number {
  const raw = max / 4, p = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 5, 10].map((m) => m * p).find((s) => max / s <= 5) ?? 10 * p;
}

type Box = { x: number; y: number; w: number; h: number };

function bars(c: Extract<Chart, { type: "bars" }>, N: Record<string, NumberRef>, b: Box): string {
  const max = Math.max(...c.bars.map((r) => N[r.n].value), 0) || 1;
  const labelW = 230, valueW = 210, gap = 18;
  const bh = Math.min(110, (b.h - gap * (c.bars.length - 1)) / c.bars.length);
  const top = b.y + (b.h - (bh * c.bars.length + gap * (c.bars.length - 1))) / 2;
  const scale = (b.w - labelW - valueW) / max;
  return c.bars.map((r, i) => {
    const n = N[r.n], y = top + i * (bh + gap), w = Math.max(2, n.value * scale);
    return text(b.x + labelW - 18, y + bh / 2 + 11, r.label, 32, { anchor: "end", fill: SOFT }) +
      `<rect data-n="${esc(r.n)}" x="${b.x + labelW}" y="${r1(y)}" width="${r1(w)}" height="${r1(bh)}" rx="8" fill="${r.color ?? PALETTE[i % PALETTE.length]}"/>` +
      text(b.x + labelW + w + 16, y + bh / 2 + 14, disp(n), 40, { weight: 700 });
  }).join("");
}

function donut(c: Extract<Chart, { type: "donut" }>, N: Record<string, NumberRef>, b: Box): string {
  const total = c.parts.reduce((s, p) => s + N[p.n].value, 0) || 1;
  const R = Math.min(b.h / 2 - 10, 200), T = R * 0.36, cx = b.x + R + 10, cy = b.y + b.h / 2;
  let a = -Math.PI / 2, out = "";
  c.parts.forEach((p, i) => {
    const f = N[p.n].value / total, a2 = a + f * 2 * Math.PI, large = f > 0.5 ? 1 : 0, col = p.color ?? PALETTE[i % PALETTE.length];
    const pt = (rad: number, ang: number) => `${r1(cx + rad * Math.cos(ang))},${r1(cy + rad * Math.sin(ang))}`;
    if (f >= 0.9999) out += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(R - T / 2)}" fill="none" stroke="${col}" stroke-width="${r1(T)}"/>`;
    else if (f > 0) out += `<path data-n="${esc(p.n)}" d="M${pt(R, a)} A${R},${R} 0 ${large} 1 ${pt(R, a2)} L${pt(R - T, a2)} A${R - T},${R - T} 0 ${large} 0 ${pt(R - T, a)} Z" fill="${col}"/>`;
    const ly = b.y + b.h / 2 - (c.parts.length * 70) / 2 + i * 70 + 40, lx = cx + R + 60;
    out += `<rect x="${r1(lx)}" y="${r1(ly - 26)}" width="28" height="28" rx="6" fill="${col}"/>` + text(lx + 44, ly, `${disp(N[p.n])}`, 40, { weight: 700 }) +
      text(lx + 44 + 26 * disp(N[p.n]).length + 16, ly, p.label, 32, { fill: SOFT });
    a = a2;
  });
  return out;
}

function line(c: Extract<Chart, { type: "line" }>, N: Record<string, NumberRef>, b: Box): string {
  const pts = c.series.flatMap((s) => s.points.map((p) => [N[p.x].value, N[p.y].value]));
  const xMax = Math.max(...pts.map((p) => p[0])) || 1, yMax = Math.max(...pts.map((p) => p[1])) || 1;
  const xs = niceStep(xMax), ys = niceStep(yMax), xTop = Math.ceil(xMax / xs) * xs, yTop = Math.ceil(yMax / ys) * ys;
  const L = b.x + 110, R = b.x + b.w - 40, T = b.y + 48, B = b.y + b.h - 60;
  const X = (v: number) => L + ((R - L) * v) / xTop, Y = (v: number) => B - ((B - T) * v) / yTop;
  const f = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  let out = "";
  for (let v = 0; v <= yTop + 1e-9; v += ys) out += `<line x1="${L}" x2="${R}" y1="${r1(Y(v))}" y2="${r1(Y(v))}" stroke="${LINE}"/>` + text(L - 12, Y(v) + 8, f(v), 24, { anchor: "end", fill: FAINT, cls: "tick" });
  for (let v = 0; v <= xTop + 1e-9; v += xs) out += text(X(v), B + 34, f(v), 24, { anchor: "middle", fill: FAINT, cls: "tick" });
  if (c.xLabel) out += text(R, B - 14, c.xLabel, 26, { anchor: "end", fill: FAINT });
  if (c.yLabel) out += text(L - 60, b.y + 14, c.yLabel, 26, { fill: FAINT });
  c.series.forEach((s, i) => {
    const col = s.color ?? PALETTE[i % PALETTE.length];
    const P = s.points.map((p) => [X(N[p.x].value), Y(N[p.y].value)]);
    out += `<polyline points="${P.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ")}" fill="none" stroke="${col}" stroke-width="6" stroke-linejoin="round"/>`;
    out += P.map((p) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="8" fill="${col}"/>`).join("");
    const last = s.points[s.points.length - 1], lp = P[P.length - 1];
    out += text(lp[0] - 14, lp[1] - 18, disp(N[last.y]), 34, { weight: 700, anchor: "end" });
    if (c.series.length > 1) out += text(lp[0] - 14, lp[1] + 40, s.label, 26, { anchor: "end", fill: col });
  });
  return out;
}

export function cardSvg(c: Card | Finding, o: { w?: number; h?: number } = {}): string {
  const W = o.w ?? PANEL.w, H = o.h ?? PANEL.h, N = c.numbers;
  const heroW = c.heroes.length ? 420 : 0;
  const chartBox = { x: 44, y: 170, w: W - 88 - heroW - (heroW ? 40 : 0), h: H - 170 - 36 };
  const words = c.headline.split(/\s+/).length, hs = words <= 6 ? 56 : 44;
  const chipW = 24 + c.chip.length * 11.5;
  let body = "";
  if (c.chart.type === "bars") body = bars(c.chart, N, chartBox);
  else if (c.chart.type === "donut") body = donut(c.chart, N, chartBox);
  else if (c.chart.type === "line") body = line(c.chart, N, chartBox);
  const hx = W - 44 - heroW, hTop = chartBox.y + (chartBox.h - c.heroes.length * 210) / 2;
  const heroes = c.heroes.map((h, i) => {
    const y = hTop + i * 210, s = disp(N[h.n]), size = Math.min(120, Math.floor(heroW / (0.62 * s.length)));
    return text(hx, y + 120, s, size, { weight: 800, fill: PLUM, cls: "hero" }) + (h.label ? text(hx + 4, y + 172, h.label, 32, { fill: SOFT }) : "");
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, sans-serif" data-card="${esc(c.id)}">` +
    `<rect width="${W}" height="${H}" rx="20" fill="#fdfdfe" fill-opacity="0.97"/>` +
    `<rect x="44" y="26" width="${r1(chipW)}" height="38" rx="19" fill="${PLUM}"/>` + text(44 + 12, 53, c.chip, 21, { weight: 600, fill: "#fff" }) +
    text(44, 132, c.headline, hs, { weight: 700 }) + body + heroes + `</svg>`;
}
