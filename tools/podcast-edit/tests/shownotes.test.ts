// Tests for shownotes.ts. Run: bun test tests/shownotes.test.ts
// Golden files: UPDATE_GOLDEN=1 bun test tests/shownotes.test.ts rewrites them (review the diff).
import { describe, expect, test } from "bun:test";
import { buildNotes, lint, videoTime, type Notes } from "../shownotes";

const D = `${import.meta.dir}/subtitles`, G = `${import.meta.dir}/shownotes`;
const json = (f: string) => Bun.file(`${D}/${f}`).json();
const maps = async () => ({ audio: await json("fixture.audio-map.json"), cuts: await json("fixture.cuts.json"), compose: await json("fixture.time-map.json") });
async function golden(name: string, got: string) {
  const f = Bun.file(`${G}/golden/${name}`);
  if (process.env.UPDATE_GOLDEN || !(await f.exists())) await Bun.write(f, got);
  expect(got).toBe(await f.text());
}

const notes = (over: Partial<Notes> = {}): Notes => ({
  title: "Fixture episode", number: 7, byline: "Nik and guest Kirk.", status: "draft",
  summary: "Nik and Kirk talk about restores & statistics.",
  links: [
    { group: "Episodes", title: "Our previous episode", url: "https://postgres.fm/episodes/x", at: "00:00:10", referred: true },
    { group: "Commits", title: "Set pd_prune_xid <on insert>", url: "https://github.com/postgres/postgres/commit/378a216", at: "00:00:15" },
    { group: "Docs", title: "COPY FREEZE", url: "https://www.postgresql.org/docs/18/sql-copy.html", at: "00:00:15", special: true },
  ],
  ...over,
});

describe("times", () => {
  test("podcast time maps to video time through source, cuts and the compose map (card, freezes)", async () => {
    const m = await maps();
    expect(videoTime("00:00:10", m)).toBe(12); // src 10.8 -> edited 7 -> final 5 + 7
    expect(videoTime("00:00:15", m)).toBe(19); // src 15.8 -> edited 12, after the 2 s freeze at 8.5
  });
  test("a time 0.98 s into a second rounds up (frame-snapped cuts), not down", () => {
    const m = { audio: [{ audioStart: 0, srcStart: 0, srcEnd: 100 }], cuts: { segmentTimes: [{ srcStart: 0, srcEnd: 100, outStart: 0.98 }] }, compose: { card: 0 } };
    expect(videoTime("00:00:10", m)).toBe(11);
  });
});

describe("rules", () => {
  const big = Array.from({ length: 21 }, (_, i) => ({ group: "Commits", title: `c${i}`, url: `https://github.com/p/p/commit/${i}`, at: "00:00:10" }));
  test("at most 20 links", () => {
    expect(lint(notes({ links: big })).join("\n")).toMatch(/21 links/);
    expect(lint(notes({ links: big.slice(0, 20) }))).toEqual([]);
  });
  test("a plain docs link needs the special flag", () => {
    const l = notes().links.map((x) => ({ ...x, special: false }));
    expect(lint(notes({ links: l })).join("\n")).toMatch(/docs link.*COPY FREEZE/);
  });
  test("a past episode needs an explicit reference on air", () => {
    const l = notes().links.map((x) => ({ ...x, referred: false }));
    expect(lint(notes({ links: l })).join("\n")).toMatch(/past episode.*Our previous episode/);
  });
  test("no TBD or placeholder in any output marked publish; a draft may have them", async () => {
    const l = [...notes().links, { group: "Blog post", title: "Blog post", url: "BLOG-LINK-TBD" }];
    const out = buildNotes(notes({ links: l, status: "publish" }), await maps());
    expect(lint(notes({ links: l, status: "publish" }), out).join("\n")).toMatch(/placeholder/);
    expect(lint(notes({ links: l }), buildNotes(notes({ links: l }), await maps()))).toEqual([]);
    expect(lint(notes({ status: "publish", summary: "TODO: summary" }), out).join("\n")).toMatch(/placeholder/);
  });
  test("the YouTube description is at most 5,000 characters", async () => {
    const n = notes({ summary: "x".repeat(5000) });
    expect(lint(n, buildNotes(n, await maps())).join("\n")).toMatch(/YouTube description .* 5000/);
  });
});

describe("outputs", () => {
  test("podcast markdown, Transistor HTML and YouTube text match the golden files", async () => {
    const out = buildNotes(notes(), await maps());
    await golden("notes.md", out.md);
    await golden("notes.transistor.html", out.html);
    await golden("notes.youtube.txt", out.youtube);
    expect(out.html).toContain("Set pd_prune_xid &lt;on insert&gt;");
    expect(out.youtube).toContain("0:19 Set pd_prune_xid <on insert>: https://github.com/postgres/postgres/commit/378a216");
    expect(out.youtube).not.toMatch(/^#|\*\*|<(a|div|li|ul|br|strong)\b/m);
  });
});
