// Episode 197 social v3: slide HTML (1080x1350, channel style). Every number comes from a card in
// ../../../cards/*.card.json (read at build time), so the slides show what the card recompute gives.
import { resolve } from "node:path";

export const EP = resolve(import.meta.dir, "../../..");
const FONTS = resolve(EP, "../../tools/podcast-edit/cover/fonts/all.css");

type Card = { numbers: Record<string, { value: number; display: string }> };
const cards: Record<string, Card> = {};
export async function card(id: string): Promise<Card> {
  return (cards[id] ??= await Bun.file(`${EP}/cards/${id}.card.json`).json());
}
export const v = async (id: string, k: string) => {
  const n = (await card(id)).numbers[k];
  if (!n) throw new Error(`${id}: no number ${k}`);
  return n.value;
};
const fmt = (x: number, d = 0) => x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const W = 1080, H = 1350;
const CSS = `
@import url("file://${FONTS}");
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#111013;--ink:#f5f3ee;--or:#ff7a1a;--mute:#9a958b;--dim:#4a4741;--red:#ff4a3d;--line:#2a282c}
html,body{background:var(--bg)}
body{width:${W}px;height:${H}px;overflow:hidden;position:relative;color:var(--ink);font-family:Inter,sans-serif}
.top{position:absolute;left:64px;right:64px;top:52px;display:flex;justify-content:space-between;align-items:center;
  font:800 34px Inter;letter-spacing:-.01em;color:var(--mute)}
.top b{color:var(--ink)} .top i{display:inline-block;width:16px;height:16px;border-radius:50%;background:var(--or);margin-right:12px;vertical-align:2px}
h1{position:absolute;left:64px;right:64px;top:118px;font:400 128px/1.0 Impact,sans-serif;text-transform:uppercase;letter-spacing:.005em;white-space:nowrap}
h1 em,.or{color:var(--or);font-style:normal}
.sub{position:absolute;left:66px;right:64px;font:700 40px/1.25 Inter;color:var(--mute)}
.sub b{color:var(--ink);font-weight:800}
.foot{position:absolute;left:64px;right:64px;bottom:56px;font:600 30px/1.35 Inter;color:var(--mute);border-top:2px solid var(--line);padding-top:22px}
.imp{font-family:Impact,sans-serif;font-weight:400}
.bar{position:absolute;left:64px;height:150px;border-radius:6px}
.blab{position:absolute;left:64px;font:800 40px Inter;color:var(--mute)}
.bval{position:absolute;font:400 120px/1 Impact;white-space:nowrap}
.bval small{font-size:56px;margin-left:8px}
.note{font:700 32px Inter;color:var(--mute)}
`;
const page = (body: string, js = "") =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}
<script>
// shrink one-line headlines until they fit the 952 px text width
for (const el of document.querySelectorAll('[data-fit]')) { let s = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth + 1 && s > 40) { s -= 2; el.style.fontSize = s + 'px'; } }
${js}
</script></body></html>`;
const top = (right = "Postgres 19 vs 18.7") => `<div class="top"><span><i></i><b>postgres.fm</b> 197</span><span>${right}</span></div>`;

// Two horizontal bars (18.7 grey, 19 orange or red), linear from 0.
function bars(y: number, rows: { lab: string; val: number; text: string; color: string; note?: string }[], max: number, unit = "") {
  const full = 952 - 0; // bar area width at full value
  return rows.map((r, i) => {
    const yy = y + i * 300;
    const w = Math.max(10, Math.round((r.val / max) * full));
    const inside = w > 600; // number inside the bar when the bar is long
    const vx = inside ? 64 + 28 : 64 + w + 24;
    const col = inside ? "#111013" : r.color;
    return `<div class="blab" style="top:${yy}px">${r.lab}</div>
<div class="bar" style="top:${yy + 58}px;width:${w}px;background:${r.color}"></div>
<div class="bval" style="top:${yy + 72}px;left:${vx}px;color:${col}">${r.text}<small>${unit}</small></div>
${r.note ? `<div class="note" style="position:absolute;left:64px;top:${yy + 222}px">${r.note}</div>` : ""}`;
  }).join("\n");
}

export async function slides(): Promise<Record<string, string>> {
  const n18 = await v("f03-notify", "pg18"), n19 = await v("f03-notify", "pg19");
  const a18 = await v("f04-autovac", "pg18"), a19 = await v("f04-autovac", "pg19"), rank = await v("f04-autovac", "rank");
  const l18 = await v("f07-lz4", "pg18"), l19 = await v("f07-lz4", "pg19"), docs = await v("f07-lz4", "docs"), kib = await v("f07-lz4", "kib");
  const js18 = await v("f06-jit", "q19B31"), js19 = await v("f06-jit", "q19B33"), jl18 = await v("f06-jit", "q1B31"), jl19 = await v("f06-jit", "q1B33");
  const jsc = await v("f06-jit", "q19change"), jlc = await v("f06-jit", "q1change");
  const ptot = await v("f10-plans", "total"), pch = await v("f10-plans", "changed"), pcom = await v("f10-plans", "commit"), poth = await v("f10-plans", "other"), psame = await v("f10-plans", "same");
  const rp = await card("f02-repack");
  const ratio = Math.floor(n19 / n18); // 11,040 / 200 = 55.2 -> "at least 55x" (19 was client-limited)
  if (pcom + poth !== pch || pch + psame !== ptot) throw new Error("plans parts do not add up");

  const S: Record<string, string> = {};

  // ---- 00 hero: three measured rows (also animated: set(t) below). v3: bigger type, 55x chip,
  // row 1 complete on frame 0, loops (rows 2-3 fade out at the end, back to frame 0).
  const rows = [
    { lab: "LISTEN/NOTIFY, 1,000 listeners", a: n18, b: n19, d: 0, u: "/s", chip: `${ratio}x` },
    { lab: "Autovacuum: table near wraparound", a: a18, b: a19, d: 1, u: "s", chip: "" },
    { lab: `LZ4 TOAST: ${fmt(docs)} jsonb docs`, a: l18, b: l19, d: 0, u: "s", chip: "" },
  ];
  const rowH = 290, ry0 = 290;
  S["s00-hero"] = page(`${top("19 RC2 vs 18.7")}
<style>.row .lab{font:800 48px Inter;font-feature-settings:"cv05" 1,"ss02" 1;color:var(--ink);margin-top:26px;white-space:nowrap}
.row .nums{display:flex;align-items:baseline;gap:24px;margin-top:10px;white-space:nowrap}
.chip{margin-left:auto;align-self:center;background:var(--or);color:#111013;font:400 92px/1 Impact;padding:10px 26px 8px;border-radius:14px}</style>
<h1 data-fit>Postgres 19, <em>measured</em></h1>
${rows.map((r, i) => `<div class="row r${i}" data-fitrow style="position:absolute;left:64px;right:64px;top:${ry0 + i * rowH}px;height:${rowH - 12}px;border-top:3px solid var(--line)">
  <div class="lab">${r.lab}</div>
  <div class="nums">
    <span class="imp" style="font-size:112px;color:var(--mute)">${fmt(r.a, r.d)}<span style="font-size:56px">${r.u}</span></span>
    <span class="imp" style="font-size:76px;color:var(--dim)">&rarr;</span>
    <span class="imp" style="font-size:130px;color:var(--or)"><span class="cnt" data-a="${r.a}" data-b="${r.b}" data-d="${r.d}">${fmt(r.b, r.d)}</span><span style="font-size:62px">${r.u}</span></span>
    ${r.chip ? `<span class="chip">${r.chip}</span>` : ""}
  </div></div>`).join("\n")}
<div class="foot" style="font-size:34px"><b style="color:var(--or)">${ratio}x: at least.</b> Our test client was the limit. Synthetic tests on dedicated hosts.</div>
`, `
const ease = x => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
const f = (x, d) => x.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d});
// timeline (8.5 s loop): frame 0 = headline + row 1 complete with the 55x chip, which pulses 0-0.45 s;
// row 2 in at 1.2 s, row 3 at 2.4 s, each counts for 0.8 s; footnote at 3.6 s; hold to 7.9 s;
// rows 2-3 and footnote fade out 7.9-8.4 s, so the last frame matches frame 0. set(999) = the still.
window.set = t => {
  if (t > 8.5) t = 5;
  const out = 1 - ease((t - 7.9) / 0.5);
  const chip = document.querySelector('.chip'), c = Math.min(1, t / 0.45);
  chip.style.transform = "scale(" + (1 + 0.14 * Math.sin(Math.PI * c)) + ")"; // visible on frame 0, one pulse
  document.querySelectorAll('.row').forEach((r, i) => {
    if (i === 0) return;
    const t0 = 1.2 * i, k = ease((t - t0) / 0.35);
    r.style.opacity = k * out; r.style.transform = 'translateY(' + (1 - k) * 40 + 'px)';
    const n = r.querySelector('.cnt'), a = +n.dataset.a, b = +n.dataset.b, d = +n.dataset.d;
    n.textContent = f(a + (b - a) * ease((t - t0 - 0.25) / 0.8), d);
  });
  document.querySelector('.foot').style.opacity = ease((t - 3.6) / 0.4) * out;
};`);

  // ---- 01 NOTIFY
  S["s01-notify"] = page(`${top()}
<h1 data-fit>NOTIFY: <em>${ratio}x</em> or more</h1>
<div class="sub" style="top:262px">1,000 listeners, each on its own channel.<br>Notifications sent per second:</div>
${bars(430, [
    { lab: "18.7", val: n18, text: fmt(n18), color: "#6b6760" },
    { lab: "19", val: n19, text: fmt(n19), color: "#ff7a1a", note: "At least: our test client was the limit." },
  ], n19, "/s")}
<div class="sub" style="top:1000px;color:var(--ink)">Still there in 19: the global lock at commit.</div>
<div class="foot">8-vCPU dedicated host, 4 notifiers, median of 3 trials. Synthetic test.</div>`);

  // ---- 02 autovacuum
  S["s02-autovac"] = page(`${top()}
<h1 data-fit>Urgent table <em>first</em></h1>
<div class="sub" style="top:262px">1 table near wraparound + 120 bloated tables.<br>Time until autovacuum starts on it:</div>
${bars(430, [
    { lab: "18.7", val: a18, text: fmt(a18, 1), color: "#6b6760", note: `It was the last of ${rank} tables.` },
    { lab: "19", val: a19, text: fmt(a19, 1), color: "#ff7a1a", note: "It was the first." },
  ], a18, " s")}
<div class="sub" style="top:1040px;color:var(--ink)">No setting to change. Upgrade, and it works.</div>
<div class="foot">16-vCPU dedicated host, table age 1.65 billion, median of 3 trials. Synthetic test.</div>`);

  // ---- 03 lz4
  S["s03-lz4"] = page(`${top()}
<h1 data-fit>TOAST: <em>lz4</em> by default</h1>
<div class="sub" style="top:262px">Insert ${fmt(docs)} jsonb documents of ${kib} KiB:</div>
${bars(380, [
    { lab: "18.7, pglz", val: l18, text: fmt(l18), color: "#6b6760" },
    { lab: "19, lz4", val: l19, text: fmt(l19), color: "#ff7a1a" },
  ], l18, " s")}
<div class="sub" style="top:960px;color:var(--ink)">The cost: the table is 11.3% larger.<br>If disk matters more:<br><span style="font-family:Menlo,monospace;font-size:34px;color:var(--or)">default_toast_compression = pglz</span></div>
<div class="foot">Needs Postgres built with lz4. 8-vCPU dedicated host, 3 trials. Synthetic test.</div>`);

  // ---- 04 JIT: two pairs
  const pair = (y: number, title: string, a: number, b: number, ch: string, good: boolean) => {
    const max = Math.max(a, b), full = 700;
    const wa = Math.round(a / max * full), wb = Math.round(b / max * full), col = good ? "#ff7a1a" : "#ff4a3d";
    return `<div style="position:absolute;left:64px;top:${y}px;font:800 40px Inter;color:var(--ink)">${title}</div>
<div class="imp" style="position:absolute;right:64px;top:${y - 14}px;font-size:110px;color:${col}">${ch}</div>
<div class="blab" style="top:${y + 128}px;font-size:34px">18.7</div><div class="bar" style="left:170px;top:${y + 118}px;height:70px;width:${wa}px;background:#6b6760"></div>
<div class="imp" style="position:absolute;left:${170 + wa + 18}px;top:${y + 116}px;font-size:64px;color:var(--mute)">${fmt(a)}<small style="font-size:32px"> ms</small></div>
<div class="blab" style="top:${y + 218}px;font-size:34px;color:${col}">19</div><div class="bar" style="left:170px;top:${y + 208}px;height:70px;width:${wb}px;background:${col}"></div>
<div class="imp" style="position:absolute;left:${170 + wb + 18}px;top:${y + 206}px;font-size:64px;color:${col}">${fmt(b)}<small style="font-size:32px"> ms</small></div>`;
  };
  S["s04-jit"] = page(`${top()}
<h1 data-fit>jit = off: <em>both ways</em></h1>
<div class="sub" style="top:262px">JIT itself did not change. The default did.<br>22 TPC-H-derived queries, scale factor 10:</div>
${pair(450, "A short query", js18, js19, `${jsc}%`.replace("-", "&minus;"), true)}
${pair(800, "The longest query", jl18, jl19, `+${jlc}%`, false)}
<div class="foot">32-vCPU dedicated host, 3 trials; per-query numbers are exploratory.</div>`);

  // ---- 05 REPACK: line chart, linear axes from 0
  const P = (id: string) => rp.numbers[id].value;
  const s1 = [["r1000x", "r1000y"], ["r5000x", "r5000y"], ["r10000x", "r10000y"], ["r20000x", "r20000y"], ["runcx", "runcy"]].map(([x, y]) => [P(x), P(y)]);
  const s2 = [["r1000x30x", "r1000x30y"], ["r2000x30x", "r2000x30y"], ["r3000x30x", "r3000x30y"], ["runcx30x", "runcx30y"]].map(([x, y]) => [P(x), P(y)]);
  const cx0 = 150, cx1 = 990, cy0 = 1030, cy1 = 520, xmax = 70000, ymax = 90;
  const X = (x: number) => cx0 + (x / xmax) * (cx1 - cx0), Y = (y: number) => cy0 - (y / ymax) * (cy0 - cy1);
  const path = (s: number[][]) => s.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ");
  const grid = [0, 30, 60, 90].map(g => `<line x1="${cx0}" x2="${cx1}" y1="${Y(g)}" y2="${Y(g)}" stroke="#2a282c" stroke-width="2"/><text x="${cx0 - 18}" y="${Y(g) + 12}" text-anchor="end" fill="#9a958b" font-family="Inter" font-weight="700" font-size="32">${g}</text>`).join("")
    + [0, 20000, 40000, 60000].map(g => `<text x="${X(g)}" y="${cy0 + 50}" text-anchor="middle" fill="#9a958b" font-family="Inter" font-weight="700" font-size="32">${g ? g / 1000 + "k" : "0"}</text>`).join("");
  const last = s2[s2.length - 1];
  S["s05-repack"] = page(`${top("Postgres 19.0")}
<h1 data-fit>REPACK: <em>the final lock</em></h1>
<div class="sub" style="top:262px">REPACK (CONCURRENTLY) is in core. Under heavy writes, its last step waits for a lock:</div>
<svg width="${W}" height="1150" style="position:absolute;left:0;top:0">
${grid}
<text x="${cx0 - 18}" y="${cy1 - 36}" text-anchor="start" fill="#9a958b" font-family="Inter" font-weight="700" font-size="30">lock wait, s</text>
<text x="${cx1}" y="${cy0 + 96}" text-anchor="end" fill="#9a958b" font-family="Inter" font-weight="700" font-size="30">rows written per second</text>
<path d="${path(s1)}" fill="none" stroke="#9a958b" stroke-width="7" stroke-linejoin="round"/>
<path d="${path(s2)}" fill="none" stroke="#ff7a1a" stroke-width="9" stroke-linejoin="round"/>
${s2.map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="10" fill="#ff7a1a"/>`).join("")}
<text x="${X(14000)}" y="${Y(9)}" text-anchor="middle" fill="#9a958b" font-family="Inter" font-weight="800" font-size="32">1 row per tx</text>
<text x="${X(36000)}" y="${Y(22)}" text-anchor="middle" fill="#ff7a1a" font-family="Inter" font-weight="800" font-size="32">30 rows per tx</text>
<text x="${X(last[0]) - 30}" y="${Y(last[1]) + 20}" text-anchor="end" fill="#ff7a1a" font-family="Impact" font-size="120">${fmt(P("wait"), 1)} s</text>
</svg>
<div class="foot">20,000,000-row table, 16 writer sessions, 16 dedicated vCPU, median of 3 runs. Synthetic test.</div>`);

  // ---- 06 upgrade trap: code
  S["s06-upgrade"] = page(`${top("Before you upgrade")}
<h1 data-fit>--check says OK. <em>Upgrade fails.</em></h1>
<div class="sub" style="top:262px">In 19, this setting must be on. Set off on a role, a database or a function, it passes the check:</div>
<div style="position:absolute;left:64px;right:64px;top:430px;background:#1c1a1f;border:2px solid #2a282c;border-radius:14px;padding:40px 40px;font:500 34px/1.6 Menlo,monospace;color:var(--ink)">
<div style="color:#8a93a6">-- on 18.7, for example:</div>
<div>ALTER ROLE app SET</div><div>&nbsp;&nbsp;<span style="color:var(--or)">standard_conforming_strings</span> = off;</div>
<div style="height:30px"></div>
<div><span style="color:#8a93a6">$</span> pg_upgrade --check ...</div>
<div style="font:400 72px Impact;color:#3dff8a;margin:4px 0 18px">OK</div>
<div><span style="color:#8a93a6">$</span> pg_upgrade ...</div>
<div style="font:400 72px Impact;color:var(--red);margin-top:4px">FAILS</div>
</div>
<div class="sub" style="top:1060px;color:var(--ink)">Same with <span style="font-family:Menlo,monospace;font-size:34px;color:var(--or)">escape_string_warning</span>.<br>Upgrade a clone first.</div>
<div class="foot">Reported on pgsql-hackers, 2026-10-24. Illustration, not a log.</div>`);

  // ---- 07 plans: waffle of the 220 query templates
  const cells: string[] = [];
  for (let i = 0; i < ptot; i++) {
    const c = i < pcom ? "#ff7a1a" : i < pch ? "#ffc08a" : "#3a383c";
    cells.push(`<i style="background:${c}"></i>`);
  }
  S["s07-plans"] = page(`${top("Before you upgrade")}
<h1 data-fit><em>${pch}</em> of ${ptot} plans changed</h1>
<div class="sub" style="top:262px">Same data, same statistics, planned on 18.7 and on 19 RC2. One square = one query template:</div>
<div style="position:absolute;left:64px;top:400px;width:952px;display:grid;grid-template-columns:repeat(20,1fr);gap:6px">${cells.join("")}</div>
<style>.top~div i{display:block;aspect-ratio:1;border-radius:5px}</style>
<div style="position:absolute;left:64px;right:64px;top:944px;font:700 36px/1.6 Inter">
<div><span style="display:inline-block;width:30px;height:30px;border-radius:5px;background:#ff7a1a;vertical-align:-4px;margin-right:16px"></span><b class="imp" style="font-size:52px;color:var(--or)">${pcom}</b> from one planner commit (a tie-break)</div>
<div><span style="display:inline-block;width:30px;height:30px;border-radius:5px;background:#ffc08a;vertical-align:-4px;margin-right:16px"></span><b class="imp" style="font-size:52px;color:#ffc08a">${poth}</b> other changes</div>
<div><span style="display:inline-block;width:30px;height:30px;border-radius:5px;background:#3a383c;vertical-align:-4px;margin-right:16px"></span><b class="imp" style="font-size:52px;color:var(--mute)">${psame}</b> same plan</div>
</div>
<div class="foot">4,273 queries, ${ptot} stable templates. Synthetic test.</div>`);

  return S;
}

// Kirk clip layers (transparent captions, header, end card), 1080x1350.
export function clipLayers(caps: string[]) {
  const head = page(`${top("Plan hints")}
<div class="imp" style="position:absolute;left:64px;top:120px;font-size:120px;line-height:1">KIRK WOLAK</div>
<div class="imp" style="position:absolute;left:64px;top:250px;font-size:72px;line-height:1;color:var(--or)">PLAN HINTS: A 1975 SOLUTION</div>`);
  const cap = (s: string) => `<!doctype html><html><head><meta charset="utf-8"><style>@import url("file://${FONTS}");
*{margin:0}html,body{background:transparent}body{width:${W}px;height:230px;display:flex;align-items:flex-start;justify-content:center}
p{max-width:980px;text-align:center;font:800 54px/1.25 Inter;color:#f5f3ee;letter-spacing:-.01em}</style></head><body><p>${s}</p></body></html>`;
  const end = page(`<div class="imp" style="position:absolute;left:0;right:0;top:470px;text-align:center;font-size:170px">POSTGRES<span style="color:var(--or)">.</span>FM</div>
<div style="position:absolute;left:0;right:0;top:700px;text-align:center;font:800 52px Inter;color:var(--or)">postgres.fm/episodes/postgres-19</div>`);
  return { head, caps: caps.map(cap), end };
}
