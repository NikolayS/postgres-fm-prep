// Episode 198 v2 overlays (illus-1 rows of for-nik/10-storyboard.md). Edited-body times come from
// tools/podcast-edit/find.ts on work/src.words.json + pgfm198-edited.cuts.json; the anchor words and
// their edited times are in `words`. Beat props (`b`, `appear`, tokens) are seconds from the overlay start.
// Numbers: https://postgres.ai/blog/20261123-pgaibench (= v0.2 home page of https://pgaibench.dev/).
//   bun scripts/items-v2.ts render [id ...]   render MOVs (ProRes 4444 alpha) to $OUT (default ../out-v2)
//   bun scripts/items-v2.ts manifest          write manifest-v2.json: these items + parts/*.json + kept v1 captures
import {writeFileSync, readFileSync, readdirSync, existsSync, mkdirSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {motifPlan} from '../src/Ep198v2';

const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(process.env.OUT ?? resolve(ROOT, '../out-v2'));
const r2 = (x: number) => Math.round(x * 100) / 100;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const POST = 'https://postgres.ai/blog/20261123-pgaibench';
type It = {id: string; row: number; comp: string; outStart: number; dur: number; placement: 'center' | 'band'; props: any; words: string; source: string; accents?: number[]; vetoable?: string; typed?: {lines: string[]; lineAt?: number[]}};

// Times below were measured on the v2 edit (v2-edit/pgfm198-edited.cuts.json, 3,207.84 s). E() maps such a
// time to the cut in $CUTS (default: that same v2 edit) through the source timeline, so a re-cut needs
// only CUTS=<new cuts.json>; a time inside a removed piece moves to the next kept piece.
type Seg = {srcStart: number; srcEnd: number; outStart: number; outEnd: number};
const BASE_CUTS = resolve(ROOT, '../../v2-edit/pgfm198-edited.cuts.json');
const segsOf = (f: string): Seg[] => JSON.parse(readFileSync(f, 'utf8')).segmentTimes;
const BASE = segsOf(BASE_CUTS), NOW = segsOf(process.env.CUTS ?? BASE_CUTS);
const toSrc = (t: number) => { for (const s of BASE) if (t >= s.outStart && t <= s.outEnd) return s.srcStart + (t - s.outStart); throw new Error(`no source for ${t}`); };
const toOut = (t: number) => { for (const s of NOW) { if (t < s.srcStart) return s.outStart; if (t <= s.srcEnd) return s.outStart + (t - s.srcStart); } return NOW[NOW.length - 1].outEnd; };
const E = (t: number) => r2(toOut(toSrc(t)));
const relE = (start: number, o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r2(E(v) - E(start))]));
const rel = (start: number, o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r2(v - start)]));

// AAA token paths over the post's Figure 2 (panel coordinates, see AaaFig in src/Ep198v2.tsx)
const CR1 = [{x: 105, y: 291}, {x: 105, y: 600}, {x: 394, y: 600}, {x: 394, y: 291}, {x: 618, y: 250}, {x: 618, y: 139}, {x: 941, y: 139}, {x: 1015, y: 250}, {x: 1015, y: 368}, {x: 1015, y: 605}];
const CR2 = [{x: 105, y: 291}, {x: 105, y: 600}, {x: 575, y: 605}];
const ALL = {phase1: 0, phase2: 0, analyst: 0, auditor: 0, actor: 0, clones: 0, prod: 0, cr: 0, back: 0, draft: 0, results: 0, approve: 0, reject: 0, rehearse: 0, apply: 0};

export const ITEMS: It[] = [
  {id: 'r03-backup-chat', row: 3, comp: 'chat198', outStart: E(326.2), dur: 6.6, placement: 'band',
    props: {lines: ['I dropped the production database.', "Do you have a backup? I'll make a note not to do that again."], lineAt: [2.27]},
    words: 'Kirk: "I dropped the production database." (326.33) "Do you have a backup?" (328.47) "I\'ll make a note not to do that again." (329.77)', source: 'on air (Kirk), his exact words'},
  {id: 'r06-scenarios', row: 6, comp: 'cards198', outStart: E(676.4), dur: 9.5, placement: 'center',
    props: {b: {hero: 3.6, legend: 4.6}}, accents: [3.6],
    vetoable: 'on air "18 tasks"; the post says 19 live scenarios (14 core public, 2 exploratory, 3 held-out)',
    words: 'Nik: "It was originally, I think, 20" (673.56) ... "18 tasks" (676.68)', source: `${POST} (Track 1 test matrix: 10 models, 19 live scenarios x 5 repeats, 949 episodes; 14 core + 2 exploratory O3, S1 + 3 held-out)`},
  {id: 'r08-leaderboard', row: 8, comp: 'board198', outStart: E(920.2), dur: 21.3, placement: 'center',
    props: {b: relE(920.2, {tie: 923.8, fable: 928.58, harm: 931.54})}, accents: [3.6, 11.34],
    words: 'Nik: "first thing what I was, um, surprised to see" (920.36) "Fable 5.2 at high effort" (928.58) "was making some harmful changes" (931.54)',
    source: `${POST} (Full Track 1 k=5 table: adjudicated correct, lab-primary harmful) = https://pgaibench.dev/ v0.2 table`},
  {id: 'r15-funnel', row: 15, comp: 'funnel198', outStart: E(1216.3), dur: 8.0, placement: 'center',
    props: {b: {step: 0.8, hero: 4.0}}, accents: [4.0],
    words: 'Nik: "it\'s, it\'s not safe" (1216.58); Kirk: "It\'s being overly cautious" (1224.46) ends it',
    source: `${POST} (execution funnel: 949 episodes, 552 entered rehearsal, 408 on the live primary, 13 harmful = 3.2%)`},
  {id: 'r16-auditor-next', row: 16, comp: 'motif198', outStart: E(1331.4), dur: 6.5, placement: 'band',
    props: {lines: ['In AAA: an independent Auditor'], lit: 'auditor-q', prefixLen: 7}, typed: {lines: ['In AAA: an independent Auditor']},
    words: 'Kirk: "another agent or something, like, auditing it" (1331.60)', source: `${POST} (AAA: "Auditor (review). An independent model ...")`},
  {id: 'r18-clone-gate', row: 18, comp: 'dots198', outStart: E(1555.0), dur: 12.0, placement: 'center',
    props: {mode: 'gate', b: {gate: 1.0, hero: 7.6}}, accents: [7.6],
    words: 'Nik: "it removed half of harm- harmful actions" (1555.26) "dropped twice" (1560.56) "Without any additional AI tokens spent" (1562.66)',
    source: `${POST} (replay finding 1: "Clone gate ($0 LLM): stopped 6 of 13 harms (46.2%)")`},
  {id: 'r19-deterministic', row: 19, comp: 'det198', outStart: E(1647.0), dur: 16.5, placement: 'center',
    props: {b: relE(1647.0, {prod: 1648.95, backup: 1653.43, peak: 1661.17})},
    words: 'Kirk: "The actor is deterministic" (1647.23) "The production environment is not" (1648.95) "Is backup currently running" (1653.43) "most critical 15 minutes" (1661.17)',
    source: 'on air (Kirk), his words'},
  {id: 'r21-tom-lane', row: 21, comp: 'prompt198', outStart: E(1888.1), dur: 8.5, placement: 'band',
    props: {text: "Pretend you're Tom Lane, and cover this critically.", stampAt: 3.4, stamp: 'CRITICAL\nREVIEW'}, typed: {lines: ["Pretend you're Tom Lane, and cover this critically."]},
    words: 'Kirk: "Pretend you\'re Tom Lane" (1888.28) "cover this critically" (1890.90)', source: 'on air (Kirk), his exact words'},
  {id: 'r22a-aaa-intro', row: 22, comp: 'aaafig198', outStart: E(1974.0), dur: 14.0, placement: 'center',
    props: {appear: {analyst: 0.4, auditor: 1.0, actor: 1.6, phase1: 2.6, phase2: 2.6, clones: 3.0, prod: 3.3, cr: 4.0, back: 4.4, draft: 4.8, results: 5.1, approve: 5.4, reject: 5.7, rehearse: 6.0, apply: 6.3}},
    words: 'Nik: "three As, triple A, AAA" (1974.26) ... "already evolved architecture" (1983.70) "third version maybe" (1987.34)',
    source: `${POST} (Figure 2, 20261113-pgaibench-fig-aaa-roles-dark.svg: same boxes, arrows and labels, labels cut to fit)`},
  {id: 'r22b-aaa-analyst', row: 22, comp: 'aaafig198', outStart: E(1994.4), dur: 12.6, placement: 'center',
    props: {appear: ALL, focus: {keys: ['phase1', 'analyst', 'draft'], at: 0.44}, glow: [{key: 'analyst', at: 0.44}], tokens: [{label: 'CR', t0: 10.0, t1: 11.4, path: [{x: 105, y: 291}, {x: 105, y: 424}]}]},
    words: 'Nik: "First is analyst" (1994.84) "whose role is to analyze metrics" (1996.54) "propose some solution, the change" (2004.46)',
    source: `${POST} (Figure 2; AAA: "Analyst (propose) ... holds zero production write access")`},
  {id: 'r22c-aaa-actor', row: 22, comp: 'aaafig198', outStart: E(2008.6), dur: 12.4, placement: 'center',
    props: {appear: ALL, focus: {keys: ['actor', 'rehearse', 'apply', 'clones', 'prod'], at: 0.34}, glow: [{key: 'actor', at: 0.34}], tokens: [{label: 'CR', t0: 5.2, t1: 6.6, path: [{x: 105, y: 424}, {x: 105, y: 515}]}, {label: 'CR', t0: 7.4, t1: 8.8, path: [{x: 1015, y: 424}, {x: 1015, y: 515}]}]},
    words: 'Nik: "actor, which will execute this change" (2008.94) "actor is almost, like, ideally should be super deterministic" (2013.74) "the script, uh, a- analyst proposed" (2020.80)',
    source: `${POST} (Figure 2; AAA: "Actor (execute). A deterministic engine ... rehearses the exact CR on a live two-node clone ... applies the approved steps verbatim")`},
  {id: 'r23a-aaa-auditor', row: 23, comp: 'aaafig198', outStart: E(2228.4), dur: 12.5, placement: 'center',
    props: {appear: ALL, focus: {keys: ['phase2', 'auditor', 'cr', 'back', 'approve', 'reject'], at: 2.5}, glow: [{key: 'auditor', at: 2.5}]},
    words: 'Nik: "And then there is a third A, which is auditor" (2228.64) "Originally, auditor role" (2232.08)',
    source: `${POST} (Figure 2; AAA: "Auditor (review) ... returns a verdict (approve, request_changes, or reject)")`},
  {id: 'r23b-aaa-path', row: 23, comp: 'aaafig198', outStart: E(2242.6), dur: 10.6, placement: 'center',
    props: {appear: ALL, glow: [{key: 'prod', at: 8.6}], tokens: [{label: 'CR 1', t0: 0.6, t1: 8.6, path: CR1}, {label: 'CR 2', t0: 1.2, t1: 4.0, path: CR2, halt: ['HALTED', 'lock wait ≥ 5 s']}]},
    accents: [4.0],
    words: 'Nik: "obviously auditor, main auditor role" (2244.38) "is between analyst and actor" (2245.72) "review the change proposed by analyst" (2250.42)',
    source: `${POST} (AAA: the Actor rehearses on a live clone and halts mechanical failures; P2 halts on lock wait >= 5 s; the Auditor reviews the clone evidence; the Actor applies approved steps)`},
  {id: 'r24-editor-note', row: 24, comp: 'motif198', outStart: E(2253.4), dur: 7.0, placement: 'band',
    props: {lines: ["Editor's note: in AAA, only the Actor writes to production."], lit: 'actor-prod', prefixLen: 14}, typed: {lines: ["Editor's note: in AAA, only the Actor writes to production."]},
    vetoable: 'Editor\'s note: on air "neither analyst nor actor have access to production" (he means the Analyst and the Auditor)',
    words: 'Nik: "neither analyst nor actor have access to production" (2253.40)', source: `${POST} (Figure 2: "Production Postgres: only the Actor changes it")`},
  {id: 'r26-send-back', row: 26, comp: 'motif198', outStart: E(2398.3), dur: 6.5, placement: 'band',
    props: {lines: ['Auditor: approve · send back · reject'], lit: 'back', prefixLen: 8}, typed: {lines: ['Auditor: approve · send back · reject']},
    words: 'Nik: "auditor can send back for improvements, completely reject" (2398.54)', source: `${POST} (Figure 2 arrows: approve, send back, reject)`},
  {id: 'r27-triangle', row: 27, comp: 'motif198', outStart: E(2570.3), dur: 9.0, placement: 'band',
    props: {lines: ['Not alone: three roles, plus', 'branching · dedicated clones · telemetry'], lineAt: [3.0], lit: 'all', prefixLen: 10}, typed: {lines: ['Not alone: three roles, plus', 'branching · dedicated clones · telemetry'], lineAt: [3.0]},
    words: 'Nik: "Not be alone, right? So this triangle works really well" (2570.50) "equipped with proper" (2573.32) testing, like database branching, ... dedicated ... All the telemetry',
    source: `on air (Nik); ${POST} (Practical rules: DBLab Engine branching, DBLab Forge dedicated environments, postgres_ai monitoring)`},
  {id: 'r28a-dots', row: 28, comp: 'dots198', outStart: E(2602.6), dur: 19.4, placement: 'center',
    props: {mode: 'full', b: relE(2602.6, {gate: 2605.8, auditor: 2610.78, stamp: 2614.14, no: 2617.3, left: 2618.2})}, accents: [3.2],
    words: 'Kirk: "So now that we used AAA as our process" (2602.82) "gave it over to the actor again to run it in production" (2610.78) "got rid of 100% of the errors" (2614.14); Nik: "Uh, no. One harm left in Opus 5.5" (2617.30)',
    source: `${POST} (Figure 3; replay finding 1: gate 6 of 13, Auditor 6 of 7 remaining, 1 held-out claude-opus-5.5 miss)`},
  {id: 'r28b-13-to-1', row: 28, comp: 'dots198', outStart: E(2633.6), dur: 6.6, placement: 'center',
    props: {mode: 'hero', b: {hero: 0.2, pct: 2.2}},
    words: 'Kirk: "13 harms down to one" (2634.28) "by structuring this a little better" (2637.98)', source: `${POST} (Figure 3: 13 -> 7 -> 1, -92.3%)`},
  {id: 'r29-377-of-378', row: 29, comp: 'safe198', outStart: E(2771.9), dur: 10.0, placement: 'center',
    props: {b: relE(2771.9, {one: 2773.44, hero: 2774.5, note: 2777.7})}, accents: [2.6],
    words: 'Nik: "almost 400" (2772.06) "only one was blocked by mistake" (2773.44) "should talk about false positive" (2777.70)',
    source: `${POST} (replay finding 2: 377 of 378 safe or unclassified approved, 99.7%; the one block: L5, grok-4.7, one DO block over the 10M-row scan)`},
  {id: 'r34-kirk-evidence', row: 34, comp: 'motif198', outStart: E(3037.7), dur: 9.6, placement: 'band',
    props: {lines: ['“A successful experiment is evidence, not a guarantee.', 'Rollback is a procedure, not a promise.”'], lineAt: [4.93], lit: 'none', hiWords: ['evidence', 'procedure'], strike: [{word: 'guarantee', at: 2.6}, {word: 'promise', at: 6.6}]},
    typed: {lines: ['“A successful experiment is evidence, not a guarantee.', 'Rollback is a procedure, not a promise.”'], lineAt: [4.93]},
    words: 'Kirk: "A successful experiment is evidence" (3037.89) "rollback is a procedure, not a promise" (3042.63)', source: 'on air (Kirk), his exact words'},
  {id: 'r37-kirk-delegate', row: 37, comp: 'motif198', outStart: E(3120.2), dur: 8.2, placement: 'band',
    props: {lines: ['“…how much responsibility we can safely delegate,', 'not simply how intelligent the AI is.”'], lineAt: [3.33], lit: 'all', hiWords: ['responsibility']},
    typed: {lines: ['“…how much responsibility we can safely delegate,', 'not simply how intelligent the AI is.”'], lineAt: [3.33]},
    words: 'Kirk: "how much responsibility we can safely delegate" (3120.39) "not simply how intelligent the AI is" (3123.53)', source: 'on air (Kirk), his exact words'},
];

const mode = process.argv[2];
const only = new Set(process.argv.slice(3));
mkdirSync(OUT, {recursive: true});
if (mode === 'render') {
  const todo = ITEMS.filter((it) => !only.size || only.has(it.id));
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const it = todo[next++];
      const file = join(OUT, `${it.id}.mov`);
      const p = Bun.spawn(['bunx', 'remotion', 'render', 'src/index.ts', it.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', '--concurrency', '3', `--props=${JSON.stringify({...it.props, durationSec: it.dur})}`], {cwd: ROOT, stdout: 'pipe', stderr: 'pipe'});
      const code = await p.exited;
      console.log(code === 0 && existsSync(file) ? `ok ${it.id}` : `FAIL ${it.id} ${(await new Response(p.stderr).text()).slice(-1200)}`);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}
if (mode === 'manifest' || mode === 'render') {
  // typing bursts for band items (sfx-manifest.ts reads <id>-typing-bursts.json next to the manifest)
  for (const it of ITEMS) if (it.typed || it.comp === 'chat198') {
    const lines = it.typed?.lines ?? it.props.lines;
    const pl = motifPlan(lines, it.typed?.lineAt ?? it.props.lineAt);
    writeFileSync(join(OUT, `${it.id}-typing-bursts.json`), JSON.stringify({overlay: `${it.id}.mov`, timeBase: 'seconds from the overlay start', bursts: pl.map((p, i) => ({start: r3(p.at), end: r3(p.end), chars: p.text.length, line: i}))}, null, 2));
  }
  const mine = ITEMS.map((it) => ({id: it.id, row: it.row, outStart: it.outStart, duration: it.dur, dur: it.dur, file: `${it.id}.mov`, placement: it.placement, freezeSec: 0, sfx: [], ...(it.accents ? {accents: it.accents.map(r2)} : {}), source: it.source, words: it.words, builder: 'illus-1', ...(it.vetoable ? {vetoable: it.vetoable} : {})}));
  // illus-2 fragments
  const partsDir = join(OUT, 'parts');
  const parts = existsSync(partsDir) ? readdirSync(partsDir).filter((f) => f.endsWith('.json')).map((f) => ({id: f.replace(/\.json$/, ''), builder: 'illus-2', freezeSec: 0, ...JSON.parse(readFileSync(join(partsDir, f), 'utf8'))})).map((p: any) => ({...p, row: Number(p.row), duration: p.dur ?? p.duration, dur: p.dur ?? p.duration, accents: p.accents ?? (p.sfx ?? []).filter((x: any) => /accent/.test(x.file)).map((x: any) => x.at)})) : [];
  // kept v1 captures: rows 11 (max_locks_per_transaction docs) and 33 (arXiv DBA-Bench)
  // row 11: illus-2's animated v2-r11-maxlocks replaces the v1 docs capture when it exists
  const keepV1 = ['f08-dbabench', ...(parts.some((p: any) => p.row === 11) ? [] : ['f05-maxlocks'])];
  const v1 = JSON.parse(readFileSync(resolve(OUT, '../out/manifest-sfx.json'), 'utf8')).overlays.filter((o: any) => keepV1.includes(o.id)).map((o: any) => ({...o, row: o.id === 'f05-maxlocks' ? 11 : 33, file: `../out/${o.file}`, sfx: [], builder: 'v1 capture'}));
  const all = [...mine, ...parts.filter((p: any) => !mine.some((m) => m.id === p.id)), ...v1].sort((a: any, b: any) => a.outStart - b.outStart);
  const head = {video: 'v2-edit/pgfm198-edited.mp4', cuts: process.env.CUTS ?? BASE_CUTS, fps: 25, width: 1920, height: 1080, timeBase: 'edited.mp4 seconds, before intro and freeze shifts', band: {x: 120, y: 744, w: 1480, h: 144}, layout: 'center placement: hosts move to place.<host>.center (right column, x 1630) in layout.json'};
  writeFileSync(join(OUT, 'manifest-v2.json'), JSON.stringify({...head, overlays: all}, null, 2));
  // checks: overlaps on the same layer, center spacing
  const probs: string[] = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a: any = all[i], b: any = all[j];
    if (b.outStart < a.outStart + a.dur) probs.push(`overlap: ${a.id} (${a.outStart}-${r2(a.outStart + a.dur)}) and ${b.id} (${b.outStart})`);
  }
  const cen = all.filter((o: any) => o.placement === 'center');
  for (let i = 1; i < cen.length; i++) {
    const gap = r2(cen[i].outStart - (cen[i - 1].outStart + cen[i - 1].dur));
    if (gap > 1.7 && gap < 4) probs.push(`center gap ${gap} s: ${cen[i - 1].id} -> ${cen[i].id} (hosts would bounce)`);
  }
  console.log(`manifest-v2.json: ${all.length} overlays (${mine.length} illus-1, ${parts.length} illus-2, ${v1.length} v1)`);
  console.log(probs.length ? probs.join('\n') : 'no overlaps, center spacing ok');
}
