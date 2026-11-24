// Episode 198 ("AI in production Postgres", recording 2026-11-24) on-screen overlays.
// Every item is anchored to SOURCE word times (Scribe src.words.json, checked with
// tools/podcast-edit/find.ts) and mapped to edited-body seconds through the cuts file's
// segmentTimes. Times inside props named `lineAt` are SOURCE times too and become seconds from the
// overlay start. Facts: https://postgres.ai/blog/20261123-pgaibench (published 2026-11-23) only.
// Cuts file: $CUTS, default <review>/pgfm198-edited.cuts.json (this file lives in <review>/overlays/tool/scripts).
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

type Seg = {srcStart: number; srcEnd: number; outStart: number; outEnd: number};
const CUTS = process.env.CUTS ?? resolve(import.meta.dir, '../../../pgfm198-edited.cuts.json');
const SEGS: Seg[] = JSON.parse(readFileSync(CUTS, 'utf8')).segmentTimes;
export const toEdited = (t: number) => {
  for (const s of SEGS) {
    if (t < s.srcStart) return s.outStart;
    if (t <= s.srcEnd) return s.outStart + (t - s.srcStart);
  }
  return SEGS[SEGS.length - 1].outEnd;
};
const r2 = (x: number) => Math.round(x * 100) / 100;

const POST = 'https://postgres.ai/blog/20261123-pgaibench';
const CHIP = 'postgres.ai/blog/20261123-pgaibench';
const shot = (name: string, w: number, h: number) => ({src: `ep198/${name}.png`, w, h, url: CHIP});

type Src = {
  id: string; comp: 'band198' | 'shot198'; placement: 'band' | 'center';
  srcStart: number; srcEnd: number; // source seconds
  words: string; // the anchor words with their source times
  props: Record<string, unknown>;
  typing?: boolean; // band strips: also render <id>-typing.mov and its bursts
  source: string; vetoable?: string;
};

const SRC: Src[] = [
  {id: 's01-restart', comp: 'band198', placement: 'band', srcStart: 1095.6, srcEnd: 1104.2, typing: true,
    words: 'Nik: "five out of five cases" (1095.72-1097.42) ... "After being told, do not restart the server" (1101.90-1103.90)',
    props: {lines: ['Told not to restart: restarted in 5 of 5 runs'], fontSize: 44},
    source: `${POST} ("broke an explicit no-restart rule in all 5 of 5 repeats", claude-fable-5.2:high, task C18)`},
  {id: 'f01-track1', comp: 'shot198', placement: 'center', srcStart: 1335.85, srcEnd: 1372.2,
    words: 'Nik: "you see the graphs right now" (1335.96-1337.08) ... "if you hear the sound you just heard" (1355.16) ... "so yeah, this is the picture" (1370.64-1371.92)',
    props: {shot: shot('fig-track1', 902, 480.44)},
    source: `${POST} Figure 1 (Track 1 outcomes, 10 models acting alone, 949 runs); live page captured 2026-11-24, dark theme, 2x`},
  {id: 's02-gate', comp: 'band198', placement: 'band', srcStart: 1766.3, srcEnd: 1773.9, typing: true,
    words: 'Nik: "it removed half of harm- harmful actions" (1766.46-1769.80) ... "dropped twice, which is good" (1771.76-1773.80)',
    props: {lines: ['Clone test alone: 6 of 13 harms stopped, zero AI cost'], fontSize: 44},
    source: `${POST} ("Clone gate ($0 LLM): stopped 6 of 13 harms (46.2%) ... while blocking 0 of 395 non-harmful changes")`},
  {id: 'q01-kirk', comp: 'band198', placement: 'band', srcStart: 1860.3, srcEnd: 1867.3, typing: true,
    words: 'Kirk: "I have a soundbite for this." (1858.17-1859.93) "The actor is deterministic." (1860.43-1862.09) "The production environment is not." (1862.15-1863.90)',
    props: {lines: ['The actor is deterministic.', 'The production environment is not.'], quote: true, fontSize: 40, lineAt: [1862.15]},
    source: 'on air (Kirk), his exact words'},
  {id: 'f02-aaa', comp: 'shot198', placement: 'center', srcStart: 2342.5, srcEnd: 2384.6,
    words: 'Nik: "three As, triple A, AAA" (2342.66-2345.00) "right now you see ... in the center of the screen" (2346.80-2349.40) ... "First is analyst" (2364.60) ... "actor, which will execute this change" (2381.42-2384.40)',
    props: {shot: shot('fig-aaa-roles', 542, 425.89)},
    source: `${POST} Figure 2 (AAA: three roles, and the path of one change request); the post's hero is a 3D canvas animation, so the static Figure 2 is used; live page captured 2026-11-24, dark theme, 2x`},
  {id: 'n01-editor', comp: 'band198', placement: 'band', srcStart: 2632.2, srcEnd: 2639.2, typing: true,
    words: 'Nik: "neither analyst nor actor have access to production, right?" (2628.60-2632.90)',
    props: {lines: ['in AAA, only the Actor writes to production.'], prefix: "Editor's note:", style: 'dark', fontSize: 40},
    vetoable: 'Editor\'s note; on air Nik says "neither analyst nor actor have access to production" (he means the Analyst and the Auditor)',
    source: `${POST} ("only after the Auditor signs off does the Actor apply the approved steps verbatim to production"; Figure 2: "Production Postgres: only the Actor changes it"); notes/fact-check.md 37:58 (43:49)`},
  {id: 'f03-waterfall', comp: 'shot198', placement: 'center', srcStart: 3015.35, srcEnd: 3029.4,
    words: 'Kirk: "so you went from 13 harms down to one at the end of the day" (3015.40-3019.40) "by structuring this a little better" (3019.78-3021.40)',
    props: {shot: shot('fig-track1-aaa', 902, 450.5)},
    source: `${POST} Figure 3 (Track 1 + AAA replay: 13 -> 7 -> 1, -92.3%); live page captured 2026-11-24, dark theme, 2x`},
  {id: 's03-safe', comp: 'band198', placement: 'band', srcStart: 3155.1, srcEnd: 3162.3, typing: true,
    words: 'Nik: "almost 400, uh, only one was blocked by mistake" (3153.86-3156.98)',
    props: {lines: ['377 of 378 safe or unclassified changes still approved'], fontSize: 42},
    source: `${POST} ("approving 377 of 378 safe or unclassified changes (99.7%)")`},
];

export type Item = {id: string; comp: string; outStart: number; duration: number; placement: 'band' | 'center'; freezeSec: number; sfx: never[]; props: Record<string, unknown>; typing?: boolean; srcStart: number; srcEnd: number; words: string; source: string; vetoable?: string};
export const ITEMS: Item[] = SRC.map((s) => {
  const outStart = r2(toEdited(s.srcStart));
  const duration = r2(toEdited(s.srcEnd) - outStart);
  const props: Record<string, unknown> = {...s.props};
  if (Array.isArray(props.lineAt)) props.lineAt = (props.lineAt as number[]).map((t) => r2(toEdited(t) - outStart));
  return {id: s.id, comp: s.comp, outStart, duration, placement: s.placement, freezeSec: 0, sfx: [], props, typing: s.typing, srcStart: s.srcStart, srcEnd: s.srcEnd, words: s.words, source: s.source, vetoable: s.vetoable};
});

if (import.meta.main) for (const it of ITEMS) console.log(`${it.id}\tsrc ${it.srcStart}\tedited ${it.outStart}\tdur ${it.duration}\t${JSON.stringify(it.props.lines ?? it.props.shot)}`);
