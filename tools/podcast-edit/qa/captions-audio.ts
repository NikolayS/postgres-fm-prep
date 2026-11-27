// Captions vs the whole audio: every cue against what whisper hears in the final media.
// Usage:
//   bun qa/captions-audio.ts <base.cues.json> (--whisper <whisper.json> | --media <final.mp4>)
//        [--fixes subtitle-fixes.json] [--glossary prompt.txt] [--min 3] [--out <report.json>]
// --media runs whisper-cli (ggml-small, one word per segment) on the whole audio first.
// Reports, with video times:
//   missing  speech whisper heard that no cue covers (a gap of 3+ words: a lost cue);
//   unheard  3+ heard words in a row that the captions do not have, inside cue time (lost words);
//   extra    3+ caption words in a row that whisper did not hear (crosstalk and fillers, or
//            words from cut audio: listen to these);
//   term     a glossary term whisper heard where the caption has other words, or a known
//            mishearing (the left side of a fix, a glossary "instead of" form) left in a caption.
// Whisper drops crosstalk and mishears names, so "extra" needs a listen; "missing", "unheard"
// and "term" are rarely false. Episode 198: 3 lost spots (cold open reused body audio) and a
// transcription error ("max slots" for max_locks_per_transaction) reached YouTube.

export type Word = { t: number; w: string; raw: string; cue?: number; dur?: number };
export type Cue = { start: number; end: number; toks?: { text: string; start: number }[] };
export type Finding = { kind: "missing" | "unheard" | "extra" | "term"; t: number; cues: number[]; caption: string; heard: string; note?: string };

export const norm = (s: string) => s.toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9_']/g, "");
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function heardWords(wj: { transcription: { text: string; offsets: { from: number; to?: number } }[] }): Word[] {
  const out: Word[] = [];
  for (const s of wj.transcription) {
    const t = s.text.trim();
    if (!t || t.startsWith("[") || t.startsWith("(")) continue;
    for (const p of t.split(/\s+/)) { const w = norm(p); if (w) out.push({ t: s.offsets.from / 1000, w, raw: p, dur: s.offsets.to === undefined ? undefined : (s.offsets.to - s.offsets.from) / 1000 }); }
  }
  return out;
}

export function captionWords(cues: Cue[]): Word[] {
  const out: Word[] = [];
  cues.forEach((q, i) => {
    for (const k of q.toks ?? []) {
      if (k.text.startsWith("[")) continue;
      for (const p of k.text.split(/\s+/)) { const w = norm(p); if (w) out.push({ t: k.start, w, raw: p, cue: i + 1 }); }
    }
  });
  return out;
}

type Op = { op: "equal" | "cap" | "heard"; i: number; j: number };

// LCS alignment in a time band: caption word i is compared only with heard words within `band` s.
export function align(cap: Word[], heard: Word[], band = 8): Op[] {
  const n = cap.length, m = heard.length;
  const lo = new Int32Array(n + 1), hi = new Int32Array(n + 1);
  let a = 0, b = 0;
  for (let i = 0; i < n; i++) {
    while (a < m && heard[a].t < cap[i].t - band) a++;
    while (b < m && heard[b].t <= cap[i].t + band) b++;
    lo[i] = a; hi[i] = b;
  }
  // dp over i (caption) and j (heard), j in the window [L[i], H[i]] (both nondecreasing; each window
  // overlaps the next, so a path can always move on). j = m is the end column (value 0).
  const L = new Int32Array(n + 1), H = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) { L[i] = lo[i]; H[i] = Math.max(hi[i], lo[i]); }
  L[0] = 0;
  for (let i = 1; i < n; i++) { H[i] = Math.max(H[i], H[i - 1]); L[i] = Math.min(Math.max(L[i], L[i - 1]), H[i - 1]); }
  L[n] = m; H[n] = m;
  const rows: Int32Array[] = new Array(n + 1);
  rows[n] = new Int32Array(1); // dp[n][m] = 0
  const get = (i: number, j: number): number => {
    if (i >= n || j >= m) return 0;
    if (j < L[i] || j > H[i]) return -1e9;
    return rows[i][j - L[i]];
  };
  for (let i = n - 1; i >= 0; i--) {
    const r = new Int32Array(H[i] - L[i] + 1);
    rows[i] = r;
    for (let j = H[i]; j >= L[i]; j--) {
      if (j >= m) { r[j - L[i]] = 0; continue; }
      const eq = cap[i].w === heard[j].w ? 1 + get(i + 1, j + 1) : -1e9;
      r[j - L[i]] = Math.max(eq, get(i + 1, j), get(i, j + 1));
    }
  }
  const ops: Op[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (j > H[i]) { ops.push({ op: "cap", i, j }); i++; continue; }
    if (j < L[i]) { ops.push({ op: "heard", i, j }); j++; continue; }
    if (cap[i].w === heard[j].w && get(i, j) === 1 + get(i + 1, j + 1)) { ops.push({ op: "equal", i, j }); i++; j++; }
    else if (get(i + 1, j) >= get(i, j + 1)) { ops.push({ op: "cap", i, j }); i++; }
    else { ops.push({ op: "heard", i, j }); j++; }
  }
  for (; i < n; i++) ops.push({ op: "cap", i, j });
  for (; j < m; j++) ops.push({ op: "heard", i, j });
  return ops;
}

export type Terms = { right: string[]; wrong: string[] };

// Terms from subtitle fixes ([wrong, right] pairs) and the postgres-fm glossary (prompt.txt):
// "Term (instead of a, b)" and "a -> b" lines give right and wrong forms.
export function loadTerms(fixes: [string, string][] = [], glossary = ""): Terms {
  const right = new Set<string>(), wrong = new Set<string>();
  for (const [w, r] of fixes) { if (/[A-Z_.]|\d/.test(r) || r.includes("_")) right.add(r); wrong.add(w); }
  for (const line of glossary.split("\n")) {
    const m = line.match(/^(.*?)\s*\(.*?instead of ([^)]*)\)/);
    if (m) { right.add(m[1].split("(")[0].trim()); for (const x of m[2].split(",")) if (x.trim()) wrong.add(x.trim()); }
    const r = line.match(/replace\s+"?([^">]+?)"?\s*->\s*"?([^"\n]+?)"?\s*$/);
    if (r) { wrong.add(r[1].trim()); right.add(r[2].trim()); }
  }
  const ok = (s: string) => squash(s).length >= 4;
  return { right: [...right].filter(ok), wrong: [...wrong].filter(ok).filter((w) => ![...right].some((r) => squash(r) === squash(w))) };
}

export function compare(cues: Cue[], heard: Word[], terms: Terms = { right: [], wrong: [] }, min = 3): Finding[] {
  const cap = captionWords(cues);
  const ops = align(cap, heard);
  const out: Finding[] = [];
  const covered = (t: number) => cues.some((q) => t >= q.start - 0.5 && t <= q.end + 0.5);
  // runs of non-equal ops
  let k = 0;
  while (k < ops.length) {
    if (ops[k].op === "equal") { k++; continue; }
    const run: Op[] = [];
    for (;;) {
      while (k < ops.length && ops[k].op !== "equal") run.push(ops[k++]);
      // one or two matched words inside a lost stretch ("you", "the") do not end it
      let e = k;
      while (e < ops.length && ops[e].op === "equal" && e - k < 3) e++;
      if (e - k <= 2 && e < ops.length && ops[e].op !== "equal") { for (; k < e; k++) run.push(ops[k]); continue; }
      break;
    }
    // counts use only the unmatched words; the texts keep the few matched words inside the run
    const c = run.filter((o) => o.op === "cap").map((o) => cap[o.i]);
    const h = run.filter((o) => o.op === "heard").map((o) => heard[o.j]);
    const caption = run.filter((o) => o.op !== "heard").map((o) => cap[o.i].raw).join(" ");
    const said = run.filter((o) => o.op !== "cap").map((o) => heard[o.j].raw).join(" ");
    const t = (c[0] ?? h[0]).t, cueIds = [...new Set(c.map((x) => x.cue!))];
    // a glossary term heard where the caption has other words
    for (const term of terms.right) {
      const s = squash(term);
      if (squash(said).includes(s) && !squash(caption).includes(s)) out.push({ kind: "term", t, cues: cueIds, caption, heard: said, note: `heard "${term}"` });
    }
    if (h.length >= min) {
      // whisper stretches words over music (2-4 s a word): their times are not reliable for a gap
      const gap = h.filter((x) => !covered(x.t) && !((x.dur ?? 0) > 1.5));
      if (gap.length >= min) out.push({ kind: "missing", t: gap[0].t, cues: cueIds, caption, heard: gap.map((x) => x.raw).join(" ") });
      else if (h.length - gap.length >= min && c.length === 0) out.push({ kind: "unheard", t, cues: cueIds, caption, heard: said });
      else if (c.length > 0 && h.length >= min && c.length < min && h.length - c.length >= min) out.push({ kind: "unheard", t, cues: cueIds, caption, heard: said });
    }
    if (c.length >= min && h.length < min) out.push({ kind: "extra", t, cues: cueIds, caption, heard: said });
    else if (c.length >= min && h.length >= min && !out.some((f) => f.t === t && f.kind !== "term")) out.push({ kind: "extra", t, cues: cueIds, caption, heard: said, note: "heard differently" });
  }
  // known mishearings left in the captions
  cues.forEach((q, i) => {
    const text = (q.toks ?? []).map((x) => x.text).join(" ");
    for (const w of terms.wrong) {
      const re = new RegExp(`(^|[^A-Za-z0-9_])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9_]|$)`, "i");
      if (re.test(text)) out.push({ kind: "term", t: q.start, cues: [i + 1], caption: text, heard: "", note: `known mishearing "${w}"` });
    }
  });
  return out.sort((a, b) => a.t - b.t);
}

export const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(2).padStart(5, "0")}`;

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  const cuesFile = args[0];
  if (!cuesFile || (!opt("whisper") && !opt("media"))) {
    console.error("usage: bun qa/captions-audio.ts <base.cues.json> (--whisper <w.json> | --media <final.mp4>) [--fixes f.json] [--glossary prompt.txt] [--min 3] [--out r.json]");
    process.exit(2);
  }
  let wj = opt("whisper");
  if (!wj) {
    const base = `${cuesFile}.whisper`;
    const wav = `${base}.wav`;
    await Bun.$`ffmpeg -nostdin -v error -y -i ${opt("media")!} -vn -ac 1 -ar 16000 ${wav}`.stdin("ignore");
    await Bun.$`whisper-cli -m ${process.env.HOME}/.whisper-models/ggml-small.bin -f ${wav} -l en -ojf -ml 1 -sow -of ${base}`.stdin("ignore").quiet();
    wj = `${base}.json`;
  }
  const fixes = opt("fixes") ? await Bun.file(opt("fixes")!).json() : [];
  const gloss = opt("glossary") ? await Bun.file(opt("glossary")!).text() : "";
  const found = compare(await Bun.file(cuesFile).json(), heardWords(await Bun.file(wj).json()), loadTerms(fixes, gloss), Number(opt("min") ?? 3));
  if (opt("out")) await Bun.write(opt("out")!, JSON.stringify(found, null, 1));
  const by = (k: string) => found.filter((f) => f.kind === k);
  for (const k of ["missing", "unheard", "term", "extra"]) {
    const f = by(k);
    console.log(`${k}: ${f.length}`);
    for (const x of f) console.log(`  ${clock(x.t)} cues ${x.cues.join(",") || "-"} | CAP: ${x.caption.slice(0, 120)} | HEARD: ${x.heard.slice(0, 120)}${x.note ? ` | ${x.note}` : ""}`);
  }
  process.exit(by("missing").length + by("unheard").length + by("term").length ? 1 : 0);
}
