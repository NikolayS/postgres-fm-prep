// Rank scored frames for natural smiles and write a labelled contact-sheet HTML.
// usage: bun pick.ts scores.csv out.html N cols maxGlare [words.json]
const [csv, outHtml, nStr, colsStr, glareStr, wordsJson] = Bun.argv.slice(2);
const N = Number(nStr), cols = Number(colsStr), maxGlare = Number(glareStr ?? 0.02);
const ROOT = "/private/tmp/claude-501/-Users-nik/df73b264-f06f-4bd2-a8c6-70f373a5e814/scratchpad/podcast-cover/";
type R = { file: string; t: number; faceW: number; yaw: number; roll: number; eyeOpen: number; mouthOpen: number; glare: number; sharp: number; smile: number; pitch: number; hand: number; laugh: number };

// laugh moments from the transcript ([laughs] tags), any speaker
let laughs: number[] = [];
if (wordsJson) {
  const j = JSON.parse(await Bun.file(wordsJson).text());
  laughs = (j.words as any[]).filter(w => /laugh/i.test(w.text)).map(w => Number(w.start));
}
const nearLaugh = (t: number) => laughs.some(l => t >= l - 1 && t <= l + 4) ? 1 : 0;

const rows: R[] = (await Bun.file(csv).text()).trim().split("\n").slice(1).filter(l => /\.png,/.test(l)).map(l => {
  const [file0, faceW, yaw, roll, eyeOpen, mouthOpen, glare, sharp, smile, pitch, hand] = l.split(",");
  const file = file0.startsWith("/") ? file0 : ROOT + file0;
  const t = Number(file.match(/(\d{4})\.png$/)![1]) - 1;
  return { file, t, faceW: +faceW, yaw: +yaw, roll: +roll, eyeOpen: +eyeOpen, mouthOpen: +mouthOpen, glare: +glare, sharp: +sharp, smile: +smile, pitch: +(pitch ?? 0), hand: +(hand ?? 0), laugh: nearLaugh(t) };
});
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const faces = rows.filter(r => r.faceW > 0);
const medSharp = med(faces.map(r => r.sharp)), medW = med(faces.map(r => r.faceW)), medSmile = med(faces.map(r => r.smile));

const ok = rows.filter(r =>
  r.faceW >= medW * 0.8 &&                       // not leaning away
  r.glare <= maxGlare &&                         // no lens glare
  r.eyeOpen >= 0.16 &&                           // eyes open (a smile narrows them, so lower bar)
  r.mouthOpen <= 0.55 &&                         // laugh is fine, a shout is not
  r.sharp >= medSharp * 0.85 &&                  // sharp
  Math.abs(r.yaw) <= 0.5 && Math.abs(r.roll) <= 0.35 && Math.abs(r.pitch) <= 0.4 &&
  r.hand <= 0.05 &&                              // no hand on the face
  r.smile >= medSmile * 1.06                     // wider mouth than this person's neutral
);
// Duchenne proxy: wide mouth + eyes a bit narrower than neutral + relaxed (not wide open) mouth
const score = (r: R) => {
  const smileN = Math.min((r.smile - medSmile) / (medSmile * 0.25), 1);          // 0..1 over neutral..+25%
  const crinkle = r.eyeOpen < 0.30 ? 0.25 : 0;                                  // eyes narrowed by cheeks
  const relaxed = r.mouthOpen <= 0.35 ? 0.3 : r.mouthOpen <= 0.45 ? 0.15 : 0;  // closed or soft-open
  const sharpN = Math.min(r.sharp / (medSharp * 1.5), 1) * 0.5;
  const face = Math.min(r.faceW / (medW * 1.2), 1) * 0.2;
  return smileN * 1.5 + crinkle + relaxed + sharpN + face + r.laugh * 0.4 - Math.abs(r.yaw) * 0.3 - Math.abs(r.pitch) * 0.5 - r.glare * 10;
};
ok.sort((a, b) => score(b) - score(a));
const picked: R[] = [];
for (const r of ok) { if (picked.every(p => Math.abs(p.t - r.t) >= 8)) picked.push(r); if (picked.length >= N) break; }
console.error(`rows=${rows.length} pass=${ok.length} medSharp=${medSharp.toFixed(0)} medW=${medW} medSmile=${medSmile.toFixed(3)} laughs=${laughs.length} picked=${picked.length}`);
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
const tiles = picked.map((r, i) => `<figure><img src="file://${r.file}"><figcaption>#${i + 1} t=${fmt(r.t)} (${r.t}s) smile ${r.smile.toFixed(2)} glare ${r.glare.toFixed(3)}${r.laugh ? " [laugh]" : ""}</figcaption></figure>`).join("\n");
const w = cols * 480, rowsN = Math.ceil(picked.length / cols), h = rowsN * 302 + 8;
await Bun.write(outHtml, `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#111;color:#eee;font:15px ui-monospace,monospace;width:${w}px;height:${h}px}
.g{display:grid;grid-template-columns:repeat(${cols},480px);gap:0}
figure{margin:0;padding:4px;width:480px;height:302px}
img{width:472px;height:266px;object-fit:cover;display:block}
figcaption{padding:3px 2px;white-space:nowrap;overflow:hidden}
</style></head><body><div class="g">${tiles}</div></body></html>`);
console.log(JSON.stringify({ w, h, picked: picked.map(r => ({ t: r.t, file: r.file, smile: r.smile, glare: r.glare, mouthOpen: r.mouthOpen, eyeOpen: r.eyeOpen, laugh: r.laugh })) }));
