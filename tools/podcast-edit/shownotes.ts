#!/usr/bin/env bun
// Show notes for one episode from a links file: the podcast notes (podcast times) as markdown and
// Transistor HTML, and the YouTube description (video times) as plain text.
// Usage:
//   bun shownotes.ts <notes.json> --audio-map podcast.time-map.json --cuts edited.cuts.json
//        --compose final.time-map.json --out <base>
// Writes <base>.md, <base>.transistor.html and <base>.youtube.txt, prints the rule problems and
// exits 1 if there are any. notes.json:
//   { "title", "number", "byline"?: "Nik and guest ...", "status": "draft" | "publish", "summary",
//     "links": [{ "group", "title", "url", "at": "hh:mm:ss" (podcast time of the first mention),
//                 "referred"?: true (a past episode that the speakers refer to),
//                 "special"?: true (a docs link that is allowed) }] }
// Rules (Nik): at most 20 links; no plain docs links unless special; past episodes only when
// referred to on air; no "TBD" or other placeholder when the status is "publish"; the YouTube
// description is at most 5,000 characters.
import { parseArgs } from "util";
import { composePieces, piecesFromAudioMap, piecesFromCuts, type Piece } from "./subtitles";

export type Link = { group: string; title: string; url: string; at?: string; referred?: boolean; special?: boolean };
export type Notes = { title: string; number?: number; byline?: string; status: "draft" | "publish"; summary: string; links: Link[] };
export type Maps = { audio: any; cuts: any; compose: any };
export type Out = { md: string; html: string; youtube: string };

export const MAX_LINKS = 20, MAX_YOUTUBE = 5000;
const PLACEHOLDER = /\bTBD\b|-TBD\b|\bTODO\b|\bXXX\b|placeholder|lorem ipsum/i;
const DOCS = /\/docs\/|^https?:\/\/docs\.|readthedocs\.io/;
const EPISODE = /^https?:\/\/(www\.)?postgres\.fm\/episodes\//;

const FEEDBACK = { text: "What did you like or not like? What should we discuss next time? Let us know via a YouTube comment, on social media, or by commenting on our Google doc!",
  social: "https://postgres.fm/people", doc: "https://docs.google.com/document/d/1PNGSn_d0A7gTR4C0p6geQyHOTgdpitKCRvafCNnT-44/edit#heading=h.v4ncheatetql" };
const PRODUCERS = [["Michael Christofides, founder of pgMustard", "https://pgmustard.com/"], ["Nikolay Samokhvalov, founder of PostgresAI", "https://postgres.ai/"]];
const CREDITS = ["Jessie Draws for the elephant artwork", "Intro and outro music: our own arrangement of Apple Loops from GarageBand (royalty-free under the GarageBand licence)"];

// ---- Times ---------------------------------------------------------------------------------
const secs = (hms: string) => hms.split(":").map(Number).reduce((a, b) => a * 60 + b, 0);
const hms = (t: number) => [t / 3600, (t / 60) % 60, t % 60].map((x) => String(Math.floor(x)).padStart(2, "0")).join(":");
const ytTime = (t: number) => {
  const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = String(Math.floor(t % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};
const find = (pieces: Piece[], t: number, key: "out" | "src") => {
  const len = (p: Piece) => p.srcEnd - p.srcStart, start = (p: Piece) => (key === "out" ? p.outStart : p.srcStart);
  return pieces.find((p) => t >= start(p) - 1e-6 && t < start(p) + len(p)) ?? pieces.find((p) => start(p) >= t); // in a cut: the next kept piece
};

// Podcast time -> source (audio map) -> video (cuts, then the compose map), rounded to a second.
export function videoTime(at: string, m: Maps): number {
  const t = secs(at), a = find(piecesFromAudioMap(m.audio), t, "out");
  if (!a) throw new Error(`${at} is not in the podcast audio map`);
  const src = a.srcStart + Math.max(0, t - a.outStart);
  const v = find(composePieces(piecesFromCuts(m.cuts), m.compose), src, "src");
  if (!v) throw new Error(`${at} (source ${src.toFixed(1)} s) is not in the video`);
  return Math.round(v.outStart + Math.max(0, src - v.srcStart));
}

// ---- Rules ---------------------------------------------------------------------------------
export function lint(n: Notes, out?: Out): string[] {
  const p: string[] = [];
  if (n.links.length > MAX_LINKS) p.push(`${n.links.length} links; the maximum is ${MAX_LINKS}`);
  for (const l of n.links) {
    if (DOCS.test(l.url) && !l.special) p.push(`plain docs link without "special": ${l.title} ${l.url}`);
    if (EPISODE.test(l.url) && !l.referred) p.push(`past episode not marked "referred" (said on air): ${l.title}`);
  }
  if (n.status === "publish") {
    const texts: [string, string][] = [["notes", JSON.stringify(n)], ...(out ? Object.entries(out) : [])];
    for (const [name, s] of texts) {
      const m = s.match(PLACEHOLDER);
      if (m) p.push(`placeholder "${m[0]}" in ${name}, status is publish`);
    }
  }
  if (out && out.youtube.length > MAX_YOUTUBE) p.push(`YouTube description is ${out.youtube.length} characters; the maximum is ${MAX_YOUTUBE}`);
  return p;
}

// ---- Outputs -------------------------------------------------------------------------------
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const groups = (links: Link[]) => [...new Set(links.map((l) => l.group))].map((g) => [g, links.filter((l) => l.group === g)] as const);

export function buildNotes(n: Notes, m: Maps): Out {
  const pod = (l: Link) => (l.at ? `[${hms(secs(l.at))}] ` : "");
  const vid = (l: Link) => (l.at ? `${ytTime(videoTime(l.at, m))} ` : "");
  const intro = "Here are some links to things they mentioned:";
  const md = [`# ${n.title}`, "", ...(n.number ? [[`Postgres.FM episode ${n.number}.`, n.byline].filter(Boolean).join(" "), ""] : []), "## Episode description", "", n.summary, "",
    "## Links", "", intro, "", "Times are podcast times of the first mention.", "",
    ...groups(n.links).flatMap(([g, ls]) => [`### ${g}`, "", ...ls.map((l) => `- ${pod(l)}${l.title}: ${l.url}`), ""]),
    "~~~", "", `${FEEDBACK.text.replace("social media,", `social media (${FEEDBACK.social}),`).replace("Google doc!", `Google doc (${FEEDBACK.doc})!`)}`, "", "~~~", "",
    "Postgres FM is produced by:", "", ...PRODUCERS.map(([t, u]) => `- ${t}: ${u}`), "", "With credit to:", "", ...CREDITS.map((c) => `- ${c}`), ""].join("\n");

  const li = (l: Link) => `<li>${esc(pod(l) + l.title)} <a href="${esc(l.url)}">${esc(l.url)}</a></li>`;
  const html = `<div>${esc(n.summary)}<br>&nbsp;<br>${intro}&nbsp;<br>Times are podcast times of the first mention.</div>` +
    groups(n.links).map(([g, ls]) => `<div><br><strong>${esc(g)}</strong></div><ul>${ls.map(li).join("")}</ul>`).join("") +
    `<div><br></div><div>~~~<br><br>What did you like or not like? What should we discuss next time? Let us know via a YouTube comment, on <a href="${FEEDBACK.social}">social media,</a> or by commenting on <a href="${FEEDBACK.doc}">our Google doc</a>!</div>` +
    `<div><br>~~~<br><br>Postgres FM is produced by:</div><ul>${PRODUCERS.map(([t, u]) => `<li>${esc(t.replace(/(pgMustard|PostgresAI)$/, ""))}<a href="${u}">${t.match(/(pgMustard|PostgresAI)$/)![0]}</a></li>`).join("")}</ul>` +
    `<div><br></div><div>With credit to:</div><ul>${CREDITS.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`;

  // YouTube shows plain text: no markdown, no HTML; a "0:34" time is a link to that moment.
  const youtube = [n.summary, "", intro, "Times are video times of the first mention.", "",
    ...groups(n.links).flatMap(([g, ls]) => [g, ...ls.map((l) => `${vid(l)}${l.title}: ${l.url}`), ""]),
    "~~~", "", FEEDBACK.text.replace("social media,", `social media (${FEEDBACK.social}),`).replace("Google doc!", `Google doc (${FEEDBACK.doc})!`), "", "~~~", "",
    "Postgres FM is produced by:", ...PRODUCERS.map(([t, u]) => `${t}: ${u}`), "", "With credit to:", ...CREDITS, ""].join("\n");
  return { md, html, youtube };
}

if (import.meta.main) {
  const { values: v, positionals: pos } = parseArgs({
    args: Bun.argv.slice(2), allowPositionals: true,
    options: { "audio-map": { type: "string" }, cuts: { type: "string" }, compose: { type: "string" }, out: { type: "string" } },
  });
  if (!pos[0] || !v.out || !v["audio-map"] || !v.cuts || !v.compose) {
    console.error("usage: bun shownotes.ts <notes.json> --audio-map m.json --cuts c.json --compose f.json --out <base>");
    process.exit(2);
  }
  const n: Notes = await Bun.file(pos[0]).json();
  const m: Maps = { audio: await Bun.file(v["audio-map"]).json(), cuts: await Bun.file(v.cuts).json(), compose: await Bun.file(v.compose).json() };
  const out = buildNotes(n, m);
  await Bun.write(`${v.out}.md`, out.md);
  await Bun.write(`${v.out}.transistor.html`, out.html);
  await Bun.write(`${v.out}.youtube.txt`, out.youtube);
  const probs = lint(n, out);
  for (const p of probs) console.log(`problem: ${p}`);
  console.log(`${n.links.length} links, YouTube ${out.youtube.length} characters, ${probs.length} problems (status ${n.status})`);
  process.exit(probs.length ? 1 : 0);
}
