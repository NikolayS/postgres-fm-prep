// Chart-first data card manifest (one <id>.card.json per card in <episode>/cards/) and its lint.
// A card is: a headline of 6 words or fewer, one chart (bars, donut or line; linear scales only),
// 1-2 hero numbers and a source chip. No sentences, no footers: caveats go to the show notes.
// Every number on the card is a key in `numbers` with its raw file and the command that
// recomputes it (cards/provenance.ts runs it). The same shape, without onAir and decision,
// is a "finding" on the pre-recording cheat sheet (cheatsheet.ts).

export type NumberRef = {
  value: number;
  display?: string; // default: value with thousands separators + unit
  unit?: string; // "%", "x", "/s", " s", " ms" ...; appended to the value as is
  source: { file: string; compute: string }; // file: path relative to the episode dir or "<ROOT>/..."; compute: shell command, $F = the file
};
export type Ref = { label: string; n: string; color?: string };
export type Chart =
  | { type: "bars"; unit?: string; scale?: "linear"; bars: Ref[] }
  | { type: "donut"; scale?: "linear"; parts: Ref[] }
  | { type: "line"; scale?: "linear"; xLabel?: string; yLabel?: string; series: { label: string; color?: string; points: { x: string; y: string }[] }[] };
export type Hero = { n: string; label?: string };
export type Finding = {
  id: string;
  headline: string;
  chart: Chart;
  heroes: Hero[];
  chip: string;
  numbers: Record<string, NumberRef>;
  literals?: string[]; // numbers in the text that are not measurements (versions, "1,000 listeners" as a setup)
};
export type Card = Finding & {
  onAir: { quote: string; at: string }; // the words this card illustrates and their time in the edited episode
  decision: "keep" | "blog"; // blog: listed in notes/blog-candidates.md and not rendered
};

export const LIMITS = { headlineCard: 6, headlineFinding: 10, label: 4, chip: 6, visibleWords: 14 };
const HEDGES = /\b(about|around|approx\w*|roughly|nearly|almost|up to|over|more than|less than)\b|~|≈/i;
const CARD_KEYS = new Set(["id", "headline", "chart", "heroes", "chip", "numbers", "literals", "onAir", "decision"]);
const FINDING_KEYS = new Set(["id", "headline", "chart", "heroes", "chip", "numbers", "literals"]);
const TIME = /^(\d+:)?\d{1,2}:\d{2}(\.\d+)?$/;

export const numberTokens = (s: string): string[] => s.match(/\d[\d,]*(?:\.\d+)?/g)?.map((t) => t.replace(/,$/, "")) ?? [];
const plain = (t: string) => Number(t.replace(/,/g, ""));
const decimals = (t: string) => (t.includes(".") ? t.split(".")[1].length : 0);
const words = (s: string) => s.split(/\s+/).filter((w) => /\p{L}/u.test(w));

export function displayOf(n: NumberRef): string {
  if (n.display) return n.display;
  const d = Number.isInteger(n.value) ? 0 : Math.min(2, String(n.value).split(".")[1]?.length ?? 0);
  return n.value.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) + (n.unit ?? "");
}

export function chartRefs(c: Chart): string[] {
  if (c.type === "bars") return c.bars.map((b) => b.n);
  if (c.type === "donut") return c.parts.map((p) => p.n);
  if (c.type === "line") return c.series.flatMap((s) => s.points.flatMap((p) => [p.x, p.y]));
  return [];
}

// Strings a viewer reads, apart from the number displays.
export function textStrings(c: Finding): string[] {
  const ch = c.chart as any;
  const labels = [...(ch.bars ?? []), ...(ch.parts ?? []), ...(ch.series ?? [])].map((r: any) => r.label);
  return [c.headline, c.chip, ...c.heroes.map((h) => h.label ?? ""), ...labels, ch.xLabel ?? "", ch.yLabel ?? "", ch.unit ?? ""].filter(Boolean);
}

export function lintCard(c: Card | Finding, mode: "card" | "finding"): string[] {
  const e: string[] = [];
  const keys = mode === "card" ? CARD_KEYS : FINDING_KEYS;
  for (const k of Object.keys(c)) if (!keys.has(k)) e.push(`field "${k}" is not allowed: no sentences, subtitles or footers on a card; caveats go to the show notes`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(c.id ?? "")) e.push(`id "${c.id}" must be lowercase letters, digits and dashes`);
  const maxH = mode === "card" ? LIMITS.headlineCard : LIMITS.headlineFinding;
  const hw = (c.headline ?? "").split(/\s+/).filter(Boolean).length;
  if (!hw) e.push("headline is missing");
  if (hw > maxH) e.push(`${c.id}: headline has ${hw} words; use ${maxH} words or fewer`);
  if (/[.!?;:]$/.test(c.headline ?? "")) e.push("headline is a sentence: drop the end punctuation");
  if (!c.chip) e.push("chip (the source) is missing");
  else if (c.chip.split(/\s+/).length > LIMITS.chip) e.push(`chip has more than ${LIMITS.chip} words`);

  // Chart: one of three forms, linear only.
  const ch = c.chart as any;
  if (!ch || !["bars", "donut", "line"].includes(ch.type)) e.push(`chart type must be bars, donut or line (got ${ch?.type})`);
  if (JSON.stringify(ch ?? {}).match(/"(scale|xScale|yScale)":"(?!linear")/) || /\blog\b|logarithm/i.test(JSON.stringify(ch ?? {})))
    e.push("log scales are not allowed (linear only); for wide ranges use value labels or two charts");
  if (ch?.type === "bars" && !(ch.bars?.length >= 1 && ch.bars.length <= 8)) e.push("bars: use 1-8 bars");
  if (ch?.type === "donut" && !(ch.parts?.length >= 2 && ch.parts.length <= 6)) e.push("donut: use 2-6 parts");
  if (ch?.type === "line" && !(ch.series?.length >= 1 && ch.series.length <= 3 && ch.series.every((s: any) => s.points?.length >= 2)))
    e.push("line: use 1-3 series with 2 or more points each");
  const nums = c.numbers ?? {};
  if (ch) for (const r of chartRefs(ch)) {
    if (!nums[r]) e.push(`chart value "${r}" is missing from numbers`);
    else if (ch.type !== "line" && nums[r].value < 0) e.push(`chart value "${r}" is negative`);
  }

  if (!(c.heroes?.length >= 1 && c.heroes.length <= 2)) e.push("use 1 or 2 hero numbers");
  for (const h of c.heroes ?? []) if (!nums[h.n]) e.push(`hero "${h.n}" is missing from numbers`);

  // Provenance and display of every number.
  for (const [k, n] of Object.entries(nums)) {
    if (!n.source?.file?.trim() || !n.source?.compute?.trim()) e.push(`number "${k}" has no provenance: give source.file (raw data) and source.compute (the command that recomputes it)`);
    else if (!/\$\{?F\b/.test(n.source.compute)) e.push(`number "${k}": source.compute must read the raw file through $F (a typed-in number is not provenance)`);
    if (typeof n.value !== "number" || !Number.isFinite(n.value)) { e.push(`number "${k}" has no numeric value`); continue; }
    const d = displayOf(n), t = numberTokens(d);
    if (t.length !== 1) e.push(`number "${k}": display "${d}" must show exactly one number (no ranges)`);
    else if (plain(t[0]) !== Number(n.value.toFixed(decimals(t[0]))))
      e.push(`number "${k}": display ${d} does not match the value ${n.value} at the shown precision`);
    if (HEDGES.test(d)) e.push(`number "${k}": display "${d}" hedges; show the exact number`);
  }

  // Text: short labels, no hedges, no numbers that are not declared.
  const text = textStrings(c as Finding);
  for (const s of text) if (HEDGES.test(s)) e.push(`"${s}": hedge word ("about", "~"...): show the exact number or drop it`);
  const ch2 = (c.chart ?? {}) as any;
  for (const r of [...(ch2.bars ?? []), ...(ch2.parts ?? []), ...(ch2.series ?? [])])
    if (words(r.label ?? "").length > LIMITS.label) e.push(`label "${r.label}" has more than ${LIMITS.label} words`);
  for (const h of c.heroes ?? []) if (words(h.label ?? "").length > LIMITS.label) e.push(`hero label "${h.label}" has more than ${LIMITS.label} words`);
  const total = text.filter((s) => s !== c.chip).flatMap(words).length;
  if (total > LIMITS.visibleWords) e.push(`${total} words on the card (chip not counted); keep ${LIMITS.visibleWords} or fewer`);
  const allowed = new Set([...(c.literals ?? []), ...Object.values(nums).flatMap((n) => numberTokens(displayOf(n)))]);
  for (const s of text) for (const t of numberTokens(s)) if (!allowed.has(t))
    e.push(`"${t}" in "${s}" is not a declared number: add it to numbers with its source, or to literals if it is not a measurement`);

  if (mode === "card") {
    const k = c as Card;
    if (!["keep", "blog"].includes(k.decision)) e.push(`decision must be "keep" or "blog" (got ${k.decision})`);
    if (!k.onAir?.quote?.trim() || !k.onAir?.at) e.push("onAir: give the on-air quote this card illustrates and its timestamp");
    else if (!TIME.test(k.onAir.at)) e.push(`onAir.at "${k.onAir.at}" is not a timestamp (mm:ss or h:mm:ss, edited episode time)`);
  }
  return e;
}
