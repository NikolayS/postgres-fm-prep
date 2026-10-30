// Classify scored frames into expression classes, rank by intensity, write one sheet per class.
// usage: bun pick2.ts scores.csv outPrefix maxGlare words.json
//   writes <outPrefix>-<class>.html and <outPrefix>-picks.json
const [csv, outPrefix, glareStr, wordsJson] = Bun.argv.slice(2);
const maxGlare = Number(glareStr ?? 0.02);
const ROOT = "/private/tmp/claude-501/-Users-nik/df73b264-f06f-4bd2-a8c6-70f373a5e814/scratchpad/podcast-cover/";
type R = Record<string, number> & { file: string; t: number; laugh: number };

let laughs: number[] = [];
if (wordsJson) {
  const j = JSON.parse(await Bun.file(wordsJson).text());
  laughs = (j.words as any[]).filter(w => /laugh/i.test(w.text)).map(w => Number(w.start));
}
const nearLaugh = (t: number) => laughs.some(l => t >= l - 1 && t <= l + 4) ? 1 : 0;

const lines = (await Bun.file(csv).text()).trim().split("\n");
const header = lines[0].split(",");
const rows: R[] = lines.slice(1).filter(l => /\.png,/.test(l)).map(l => {
  const v = l.split(","); const r: any = {};
  header.forEach((k, i) => r[k] = i === 0 ? v[i] : +v[i]);
  r.file = v[0].startsWith("/") ? v[0] : ROOT + v[0];
  r.t = Number(r.file.match(/(\d{4})\.png$/)![1]) - 1;
  r.laugh = nearLaugh(r.t);
  return r as R;
});
const faces = rows.filter(r => r.faceW > 0);
const med = (k: string) => { const s = faces.map(r => r[k]).sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const M: Record<string, number> = {};
for (const k of ["sharp", "faceW", "smile", "eyeOpen", "mouthOpen", "browRaise", "browAsym"]) M[k] = med(k);
// relative deviation from this person's own median
const rel = (r: R, k: string) => (r[k] - M[k]) / M[k];

const base = (r: R) =>
  r.faceW >= M.faceW * 0.8 && r.glare <= maxGlare && r.sharp >= M.sharp * 0.85 &&
  Math.abs(r.yaw) <= 0.6 && Math.abs(r.roll) <= 0.45;

// each class: predicate + intensity (bigger = more readable emotion)
const classes: Record<string, { ok: (r: R) => boolean; intensity: (r: R) => number }> = {
  laughing: {
    ok: r => r.hand <= 0.05 && rel(r, "smile") >= 0.06 && r.mouthOpen > 0.30 && r.mouthOpen <= 0.75,
    intensity: r => rel(r, "smile") * 4 + r.mouthOpen * 1.5 + (r.eyeOpen < M.eyeOpen ? 0.3 : 0) + r.laugh * 0.5,
  },
  smiling: {
    ok: r => r.hand <= 0.05 && rel(r, "smile") >= 0.06 && r.mouthOpen <= 0.30 && r.eyeOpen >= 0.16,
    intensity: r => rel(r, "smile") * 5 + (r.eyeOpen < M.eyeOpen ? 0.3 : 0) + r.laugh * 0.3,
  },
  surprised: {
    ok: r => r.hand <= 0.05 && rel(r, "browRaise") >= 0.10 && rel(r, "eyeOpen") >= 0.08 && r.mouthOpen >= 0.18 && rel(r, "smile") < 0.06,
    intensity: r => rel(r, "browRaise") * 4 + rel(r, "eyeOpen") * 3 + r.mouthOpen * 2,
  },
  skeptical: {
    ok: r => r.hand <= 0.05 && rel(r, "smile") < 0.06 && r.mouthOpen <= 0.22 &&
      (rel(r, "browAsym") >= 0.6 || Math.abs(r.roll) >= 0.12 || rel(r, "eyeOpen") <= -0.15),
    intensity: r => rel(r, "browAsym") * 1.5 + Math.abs(r.roll) * 3 + Math.max(0, -rel(r, "eyeOpen")) * 3 + (r.mouthOpen < 0.12 ? 0.3 : 0),
  },
  thinking: {
    ok: r => rel(r, "smile") < 0.06 && r.mouthOpen <= 0.25 && r.hand <= 0.35 &&
      (Math.abs(r.yaw) >= 0.2 || r.pitch <= -0.15 || r.handChin >= 0.3),
    intensity: r => Math.abs(r.yaw) * 2 + Math.max(0, -r.pitch) * 2 + r.handChin * 1.5 + Math.max(0, rel(r, "browRaise")) * 2,
  },
};
// reject neutral/listening faces: everything close to the median
const neutral = (r: R) => Math.abs(rel(r, "smile")) < 0.05 && Math.abs(rel(r, "browRaise")) < 0.08 &&
  Math.abs(rel(r, "eyeOpen")) < 0.08 && r.mouthOpen < 0.18 && Math.abs(r.roll) < 0.1 && Math.abs(r.yaw) < 0.15 && r.handChin < 0.3;

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
const picks: Record<string, any[]> = {};
for (const [name, c] of Object.entries(classes)) {
  const ok = rows.filter(r => base(r) && !neutral(r) && c.ok(r));
  ok.sort((a, b) => c.intensity(b) - c.intensity(a));
  const picked: R[] = [];
  for (const r of ok) { if (picked.every(p => Math.abs(p.t - r.t) >= 8)) picked.push(r); if (picked.length >= Number(process.env.N ?? 8)) break; }
  picks[name] = picked.map(r => ({ t: r.t, file: r.file, faceX: r.faceX, faceY: r.faceY, faceH: r.faceH, intensity: +c.intensity(r).toFixed(2), glare: r.glare, laugh: r.laugh }));
  console.error(`${name}: pass=${ok.length} picked=${picked.length}`);
  const tiles = picked.map((r, i) => `<figure><img src="file://${r.file}"><figcaption>${name.toUpperCase()} #${i + 1}  t=${fmt(r.t)} (${r.t}s)  intensity ${c.intensity(r).toFixed(2)}${r.laugh ? "  [laugh]" : ""}</figcaption></figure>`).join("\n");
  const cols = 4, w = cols * 480, h = Math.ceil(Math.max(picked.length, 1) / cols) * 302 + 8;
  await Bun.write(`${outPrefix}-${name}.html`, `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#111;color:#eee;font:16px ui-monospace,monospace;width:${w}px;height:${h}px}
.g{display:grid;grid-template-columns:repeat(${cols},480px)}figure{margin:0;padding:4px;width:480px;height:302px}
img{width:472px;height:266px;object-fit:cover;display:block}figcaption{padding:3px 2px;white-space:nowrap;overflow:hidden}
</style></head><body><div class="g">${tiles || "<p>no frames passed</p>"}</div></body></html>`);
}
await Bun.write(`${outPrefix}-picks.json`, JSON.stringify(picks, null, 1));
console.log(JSON.stringify(Object.fromEntries(Object.entries(picks).map(([k, v]) => [k, v.length]))));
