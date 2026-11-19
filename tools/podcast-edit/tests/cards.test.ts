// Spec for chart-first data cards: the manifest lint, the provenance gate (recompute every number
// from its raw file), the SVG renderer, the contact sheet and the research cheat sheet.
// Run: bun test tests/cards.test.ts
import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { lintCard, numberTokens, type Card } from "../cards/card";
import { checkProvenance } from "../cards/provenance";
import { cardSvg } from "../overlays/src/card-svg";
import { checkEpisodeCards, contactSheetHtml, ensureSheet } from "../cards/sheet";
import { cheatSheetHtml, lintFindings } from "../cheatsheet";

const dir = mkdtempSync(join(tmpdir(), "cards-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

// Raw data for the provenance tests: a tiny CSV in an "episode" folder.
const ep = join(dir, "ep");
mkdirSync(join(ep, "raw"), { recursive: true });
mkdirSync(join(ep, "cards"), { recursive: true });
mkdirSync(join(ep, "notes"), { recursive: true });
writeFileSync(join(ep, "raw/notify.csv"), "version,per_s\n18,915\n19,19686\n");
const col = (v: string) => `awk -F, '$1=="${v}"{print $2}' "$F"`;

const good = (): Card => ({
  id: "notify",
  headline: "NOTIFY scales in 19",
  chart: { type: "bars", unit: "/s", bars: [{ label: "18", n: "n18" }, { label: "19", n: "n19" }] },
  heroes: [{ n: "x", label: "faster" }],
  chip: "Forge study · synthetic",
  numbers: {
    n18: { value: 915, unit: "/s", source: { file: "raw/notify.csv", compute: col("18") } },
    n19: { value: 19686, unit: "/s", source: { file: "raw/notify.csv", compute: col("19") } },
    x: { value: 21.5, display: "21.5x", source: { file: "raw/notify.csv", compute: `awk -F, 'NR==2{a=$2} NR==3{b=$2} END{print b/a}' "$F"` } },
  },
  literals: ["18", "19"],
  onAir: { quote: "from 200 per second we went to 11,000 per second", at: "21:37.3" },
  decision: "keep",
});

describe("lintCard: chart-first card rules", () => {
  test("a good card has no errors", () => {
    expect(lintCard(good(), "card")).toEqual([]);
  });

  test("headline of more than 6 words fails", () => {
    const c = { ...good(), headline: "NOTIFY with one thousand listeners is much faster" };
    expect(lintCard(c, "card").join("\n")).toMatch(/headline.*6 words/);
  });

  test("sentences and footers are not allowed", () => {
    const c = { ...good(), footer: "Synthetic test on a small host." } as unknown as Card;
    expect(lintCard(c, "card").join("\n")).toMatch(/footer.*show notes/);
    const s = { ...good(), sub: "What the study measured" } as unknown as Card;
    expect(lintCard(s, "card").join("\n")).toMatch(/sub/);
  });

  test("log scales are never allowed", () => {
    const c = good();
    (c.chart as any).scale = "log";
    expect(lintCard(c, "card").join("\n")).toMatch(/log/);
  });

  test("hedge words fail: use the exact number", () => {
    const c = { ...good(), headline: "About 21x faster NOTIFY" };
    expect(lintCard(c, "card").join("\n")).toMatch(/about/i);
  });

  test("more than 8 bars fails unless a human approved an exception for this card", () => {
    const many = (n: number) => { const c = good(); (c.chart as any).bars = Array.from({ length: n }, () => ({ label: "", n: "n18" })); return c; };
    expect(lintCard(many(9), "card").join()).toContain("1-8 bars");
    const ok = { ...many(37), exceptions: [{ rule: "bars", max: 40, approvedBy: "Nik", date: "2026-11-18", reason: "one bar per minor release" }] };
    expect(lintCard(ok as any, "card")).toEqual([]);
    const over = { ...many(41), exceptions: ok.exceptions };
    expect(lintCard(over as any, "card").join()).toContain("1-40 bars");
    const anon = { ...many(37), exceptions: [{ rule: "bars", max: 40, date: "2026-11-18", reason: "x" }] };
    expect(lintCard(anon as any, "card").join()).toContain("approvedBy");
  });
  test("1 or 2 hero numbers", () => {
    expect(lintCard({ ...good(), heroes: [] }, "card").join("\n")).toMatch(/hero/);
    expect(lintCard({ ...good(), heroes: [{ n: "x" }, { n: "n18" }, { n: "n19" }] }, "card").join("\n")).toMatch(/hero/);
  });

  test("a number without provenance fails", () => {
    const c = good();
    (c.numbers.n19 as any).source = { file: "raw/notify.csv", compute: "" };
    expect(lintCard(c, "card").join("\n")).toMatch(/n19.*provenance/);
    delete (c.numbers.n18 as any).source;
    expect(lintCard(c, "card").join("\n")).toMatch(/n18.*provenance/);
  });

  test("a chart value must point to a number", () => {
    const c = good();
    (c.chart as any).bars[0].n = "missing";
    expect(lintCard(c, "card").join("\n")).toMatch(/missing/);
  });

  test("a number in the text that is not a declared number fails (no invented numbers)", () => {
    const c = { ...good(), headline: "NOTIFY 13% faster" };
    expect(lintCard(c, "card").join("\n")).toMatch(/13/);
  });

  test("display must equal the value at the shown precision (no rounding up)", () => {
    const c = good();
    c.numbers.x.display = "25x";
    expect(lintCard(c, "card").join("\n")).toMatch(/x.*25.*21\.5/);
  });

  test("a kept card names the on-air quote and timestamp; decision is keep or blog", () => {
    const c = good();
    delete (c as any).onAir;
    expect(lintCard(c, "card").join("\n")).toMatch(/onAir/);
    expect(lintCard({ ...good(), decision: "maybe" as any }, "card").join("\n")).toMatch(/decision/);
    expect(lintCard({ ...good(), onAir: { quote: "x", at: "soon" } }, "card").join("\n")).toMatch(/timestamp/);
  });

  test("numberTokens finds numbers with separators and decimals", () => {
    expect(numberTokens("from 1,013 to 65,996 rows/s in 0.02 s, PG 18.7")).toEqual(["1,013", "65,996", "0.02", "18.7"]);
  });

  test("a negative display keeps its sign (U+2212 or hyphen-minus)", () => {
    const c = good();
    c.numbers.x = { value: -37.4, display: "\u221237%", source: c.numbers.x.source };
    expect(lintCard(c, "card").join("\n")).not.toMatch(/does not match/);
    c.numbers.x = { value: -37.4, display: "-37%", source: c.numbers.x.source };
    expect(lintCard(c, "card").join("\n")).not.toMatch(/does not match/);
    c.numbers.x = { value: -37.4, display: "37%", source: c.numbers.x.source };
    expect(lintCard(c, "card").join("\n")).toMatch(/does not match/);
  });
});

describe("checkProvenance: recompute every number from the raw file", () => {
  test("all numbers recompute", async () => {
    const r = await checkProvenance(good(), { episodeDir: ep, roots: {} });
    expect(r.errors).toEqual([]);
    expect(r.checked).toBe(3);
  });

  test("a value that does not match the recompute fails", async () => {
    const c = good();
    c.numbers.n19.value = 11000;
    const r = await checkProvenance(c, { episodeDir: ep, roots: {} });
    expect(r.errors.join("\n")).toMatch(/n19.*11,000.*19,686/);
  });

  test("a missing raw file fails", async () => {
    const c = good();
    c.numbers.n18.source.file = "raw/nope.csv";
    const r = await checkProvenance(c, { episodeDir: ep, roots: {} });
    expect(r.errors.join("\n")).toMatch(/n18.*nope\.csv/);
  });

  test("root aliases map to directories (from the environment)", async () => {
    const c = good();
    c.numbers.n18.source.file = "R/notify.csv";
    expect((await checkProvenance(c, { episodeDir: ep, roots: { R: join(ep, "raw") } })).errors).toEqual([]);
    const r = await checkProvenance(c, { episodeDir: ep, roots: { R: undefined } });
    expect(r.errors.join("\n")).toMatch(/R/);
  });
});

describe("cardSvg: chart-first layout, linear scales", () => {
  test("has the headline, chip, values and hero, nothing in the bottom 180 px", () => {
    const svg = cardSvg(good());
    expect(svg.startsWith("<svg")).toBe(true);
    for (const s of ["NOTIFY scales in 19", "Forge study · synthetic", "915/s", "19,686/s", "21.5x", "faster"]) expect(svg).toContain(s);
  });

  test("bar lengths are linear in the value", () => {
    const svg = cardSvg(good());
    const w = (n: string) => Number(svg.match(new RegExp(`data-n="${n}"[^>]*width="([\\d.]+)"`))![1]);
    expect(w("n19") / w("n18")).toBeCloseTo(19686 / 915, 1);
  });

  test("donut and line charts render", () => {
    const d = { ...good(), chart: { type: "donut", parts: [{ label: "changed", n: "n18" }, { label: "same", n: "n19" }] } } as Card;
    expect(cardSvg(d)).toContain("<path");
    const l = { ...good(), chart: { type: "line", xLabel: "rows/s", series: [{ label: "wait", points: [{ x: "n18", y: "x" }, { x: "n19", y: "x" }] }] } } as Card;
    expect(cardSvg(l)).toContain("<polyline");
  });

  test("text is escaped", () => {
    expect(cardSvg({ ...good(), headline: "A < B & C" })).toContain("A &lt; B &amp; C");
  });
});

describe("contact sheet and episode check", () => {
  test("contact sheet HTML shows every card with its id", () => {
    const html = contactSheetHtml([{ id: "a", svg: "<svg id='a'></svg>", decision: "keep" }, { id: "b", svg: "<svg id='b'></svg>", decision: "blog" }]);
    expect(html).toContain("<svg id='a'>");
    expect(html).toContain(">b<");
  });

  test("ensureSheet rewrites the sheet only when cards change", async () => {
    writeFileSync(join(ep, "cards/notify.card.json"), JSON.stringify(good()));
    const out = join(dir, "qa-out");
    expect((await ensureSheet(join(ep, "cards"), out, { png: false })).written).toBe(true);
    expect(existsSync(join(out, "contact-sheet.html"))).toBe(true);
    expect((await ensureSheet(join(ep, "cards"), out, { png: false })).written).toBe(false);
    writeFileSync(join(ep, "cards/notify.card.json"), JSON.stringify({ ...good(), headline: "NOTIFY is faster in 19" }));
    expect((await ensureSheet(join(ep, "cards"), out, { png: false })).written).toBe(true);
    expect(readFileSync(join(out, "contact-sheet.html"), "utf8")).toContain("NOTIFY is faster in 19");
  });

  test("checkEpisodeCards: blog cards must be listed in notes/blog-candidates.md", async () => {
    writeFileSync(join(ep, "cards/notify.card.json"), JSON.stringify({ ...good(), decision: "blog" }));
    const out = join(dir, "qa-out2");
    const missing = await checkEpisodeCards(ep, { out, png: false, roots: {} });
    expect(missing.pass).toBe(false);
    expect(missing.errors.join("\n")).toMatch(/blog-candidates\.md/);
    writeFileSync(join(ep, "notes/blog-candidates.md"), "# Blog candidates\n\n## notify\n");
    const ok = await checkEpisodeCards(ep, { out, png: false, roots: {} });
    expect(ok.errors).toEqual([]);
    expect(ok.pass).toBe(true);
  });
});

describe("cheat sheet before recording", () => {
  const finding = () => { const { onAir, decision, ...f } = good(); return { ...f, headline: "NOTIFY with 1,000 listeners got much faster" , literals: ["18", "19", "1,000"] }; };
  test("5 to 8 findings, each a chart and a headline of 10 words or fewer", () => {
    expect(lintFindings({ title: "PG19", findings: Array(4).fill(finding()) }).join("\n")).toMatch(/5-8/);
    const many = Array.from({ length: 6 }, (_, i) => ({ ...finding(), id: `f${i}` }));
    expect(lintFindings({ title: "PG19", findings: many })).toEqual([]);
    many[0] = { ...many[0], headline: "one two three four five six seven eight nine ten eleven" };
    expect(lintFindings({ title: "PG19", findings: many }).join("\n")).toMatch(/f0.*10 words/);
  });

  test("the HTML is one page with every finding", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ ...finding(), id: `f${i}` }));
    const html = cheatSheetHtml({ title: "Postgres 19", source: { label: "Forge brief", url: "https://example.com/b" }, findings: many });
    expect(html).toContain("Postgres 19");
    expect(html).toContain("https://example.com/b");
    expect(html.match(/<svg/g)!.length).toBe(6);
    expect(html).toContain("@page");
  });
});

describe("render gate", () => {
  test("gateCard returns render props for a good kept card and refuses blog or broken cards", async () => {
    const { gateCard } = await import("../cards/gate");
    const f = join(ep, "cards/notify.card.json");
    writeFileSync(f, JSON.stringify(good()));
    const ok = await gateCard(f, { roots: {} });
    expect(ok.errors).toEqual([]);
    expect(ok.props?.headline).toBe("NOTIFY scales in 19");
    writeFileSync(f, JSON.stringify({ ...good(), decision: "blog" }));
    expect((await gateCard(f, { roots: {} })).errors.join(" ")).toMatch(/blog/);
    const bad = good(); bad.numbers.n18.value = 900;
    writeFileSync(f, JSON.stringify(bad));
    const r = await gateCard(f, { roots: {} });
    expect(r.props).toBeUndefined();
    expect(r.errors.join(" ")).toMatch(/n18/);
  });
});

describe("provenance: the command must read the raw file", () => {
  test("a compute that does not read $F (for example a bare echo) fails the lint", () => {
    const c = good();
    c.numbers.n18.source.compute = "echo 915";
    expect(lintCard(c, "card").join("\n")).toMatch(/n18.*\$F/);
  });

  test("a relative episode path still resolves", async () => {
    const rel = require("path").relative(process.cwd(), ep);
    expect((await checkProvenance(good(), { episodeDir: rel, roots: {} })).errors).toEqual([]);
  });
});
