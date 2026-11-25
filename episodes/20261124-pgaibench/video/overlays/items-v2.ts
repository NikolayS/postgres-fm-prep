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
// v3 edited time -> $CUTS edited time (for fragments made for edit v3)
// edit <tag> time -> $CUTS edited time (for fragments made for an earlier re-cut)
const TAG_CUTS: Record<string, string> = {v3: resolve(ROOT, '../../pgfm198-edited.cuts.json'), v4: resolve(ROOT, '../../v4/pgfm198-edited.cuts.json'), v5: resolve(ROOT, '../../v5/pgfm198-edited.cuts.json')};
const EVX = (tag: string, t: number) => { for (const s of segsOf(TAG_CUTS[tag])) if (t >= s.outStart - 1e-6 && t <= s.outEnd + 1e-6) return r2(toOut(s.srcStart + (t - s.outStart))); throw new Error(`no ${tag} source for ${t}`); };
const relE = (start: number, o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r2(E(v) - E(start))]));
// A re-cut: CUTS=<cuts.json> TAG=v3|v4 VIDEO=<mp4 relative to review/>. An overlay whose beats change inside
// its window needs its own render, <id>-<TAG>.mov; illus-2 fragments re-timed for it are parts/<id>.<TAG>.json.
const V3 = !!process.env.CUTS && resolve(process.env.CUTS) !== BASE_CUTS;
const TAG = process.env.TAG ?? 'v3';
const V3_RENDER = new Set(['r18-clone-gate', ...(TAG === 'v5' ? ['r29-377-of-378'] : [])]);
// note: rows 06, 18, 28a, 28b and the new 28c changed in the v4 review round; their v2 files are re-rendered too
const fileOf = (id: string) => `${id}${V3 && (V3_RENDER.has(id) || EXTENDED.has(id)) ? `-${TAG}` : ''}.mov`;
const rel = (start: number, o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r2(v - start)]));

// AAA token paths over the post's Figure 2 (panel coordinates, see AaaFig in src/Ep198v2.tsx)
const CR1 = [{x: 105, y: 291}, {x: 105, y: 600}, {x: 394, y: 600}, {x: 394, y: 291}, {x: 618, y: 250}, {x: 618, y: 139}, {x: 941, y: 139}, {x: 1015, y: 250}, {x: 1015, y: 368}, {x: 1015, y: 605}];
const CR2 = [{x: 105, y: 291}, {x: 105, y: 600}, {x: 575, y: 605}];
const ALL = {phase1: 0, phase2: 0, analyst: 0, auditor: 0, actor: 0, clones: 0, prod: 0, cr: 0, back: 0, draft: 0, results: 0, approve: 0, reject: 0, rehearse: 0, apply: 0};

const W1 = {yaw: -8, pitch: 13, dist: 10.4, focal: 0.81, tx: 0.05, ty: 1.84, ox: 0.5, oy: 0.52}; // one caption line
const W2 = {yaw: -8, pitch: 13, dist: 10.4, focal: 1.42, tx: 0.05, ty: 1.84, ox: 0.5, oy: 0.52}; // caption in a 560 px side column
const W3D = {yaw: -8, pitch: 13, dist: 10.4, focal: 0.94, tx: 0.05, ty: 1.84, ox: 0.5, oy: 0.52};
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
  {id: 'r16-auditor-next', row: 16, comp: 'aaa3d198', outStart: E(1331.4), dur: 6.5, placement: 'center',
    props: {caption: {lines: ['In AAA: an independent Auditor'], prefixLen: 7, hi: [{word: 'Auditor', at: relE(1331.4, {a: 1333.86}).a}]},
      cam: [{at: 0, ...W1}, {at: 0.3, move: 1.6, yaw: 12, pitch: 16, dist: 10.4, focal: 1.45, tx: 1.3, ty: 2.75, ox: 0.5, oy: 0.5}],
      focus: [{flows: ['review'], at: 0.4}], glow: [{key: 'auditor', at: 0.6}], hot: [{id: 'auditor', at: relE(1331.4, {a: 1333.86}).a}],
      events: [{kind: 'review', at: 0.8}, {kind: 'review', at: 3.4}]},
    words: 'Kirk: "another agent or something" (1331.60) "like, auditing it" (1333.86)', source: `${POST} (hero: AaaPipeline3D; AAA: "Auditor (review). An independent model ...")`},
  {id: 'r18-clone-gate', row: 18, comp: 'dots198', outStart: E(1555.0), dur: 12.0, placement: 'center',
    props: {mode: 'gate', b: relE(1555.0, {gate: 1556.0, hero: 1562.6})}, accents: [relE(1555.0, {h: 1562.6}).h],
    words: 'Nik: "it removed half of harm- harmful actions" (1555.26) "dropped twice" (1560.56) "Without any additional AI tokens spent" (1562.66)',
    source: `${POST} (replay finding 1: "Clone gate ($0 LLM): stopped 6 of 13 harms (46.2%)")`},
  {id: 'r19-deterministic', row: 19, comp: 'det198', outStart: E(1647.0), dur: 16.5, placement: 'center',
    props: {b: relE(1647.0, {prod: 1648.95, backup: 1653.43, peak: 1661.17})},
    words: 'Kirk: "The actor is deterministic" (1647.23) "The production environment is not" (1648.95) "Is backup currently running" (1653.43) "most critical 15 minutes" (1661.17)',
    source: 'on air (Kirk), his words'},
  {id: 'r21-tom-lane', row: 21, comp: 'prompt198', outStart: E(1888.1), dur: 8.5, placement: 'band',
    props: {text: "Pretend you're Tom Lane, and cover this critically.", stampAt: 3.4, stamp: 'CRITICAL\nREVIEW'}, typed: {lines: ["Pretend you're Tom Lane, and cover this critically."]},
    words: 'Kirk: "Pretend you\'re Tom Lane" (1888.28) "cover this critically" (1890.90)', source: 'on air (Kirk), his exact words'},
  {id: 'r22a-aaa-intro', row: 22, comp: 'aaa3d198', outStart: E(1974.0), dur: 14.0, placement: 'center',
    props: {cam: [{at: 0, yaw: -34, pitch: 34, dist: 12.5, focal: 0.94, tx: 0.05, ty: 1.84, ox: 0.5, oy: 0.52}, {at: 0.2, move: 3.4, ...W3D}],
      build: {grid: 0, clones: 0.3, prod: 0.5, tel: 0.7, slab: 1.0, analyst: 1.4, auditor: 1.8, lanes: 2.2, feedback: 2.6},
      labels: {clones: 0.4, prod: 0.6, telemetry: 0.8, actor: 1.1, analyst: 1.5, auditor: 1.9, rehearse: 2.3, review: 2.3, sendback: 2.4, apply: 2.4, reject: 2.5, feedback: 2.7},
      hot: [{id: 'analyst', at: 1.5}, {id: 'auditor', at: 1.9}, {id: 'actor', at: 1.1}],
      events: [{kind: 'rehearse', at: 4.0}, {kind: 'review', at: 7.3}, {kind: 'apply', at: 9.15}],
      title: [{text: 'AAA', at: 0.3}]},
    words: 'Nik: "three As, triple A, AAA" (1974.26) ... "already evolved architecture" (1983.70) "third version maybe" (1987.34)',
    source: `${POST} (hero: the AaaPipeline3D scene, same geometry, colors, camera and labels)`},
  {id: 'r22b-aaa-analyst', row: 22, comp: 'aaa3d198', outStart: E(1994.4), dur: 12.6, placement: 'center',
    props: {cam: [{at: 0, ...W3D}, {at: 0.44, move: 1.4, yaw: -17, pitch: 14, dist: 10.4, focal: 1.06, tx: -0.8, ty: 1.72, ox: 0.45, oy: 0.53}, {at: 8.2, move: 1.4, ...W3D}],
      focus: [{flows: ['rehearse', 'telemetry', 'feedback', 'review'], at: 0.44}], glow: [{key: 'analyst', at: 0.44}],
      hot: [{id: 'analyst', at: 0.44}, {id: 'review', at: 10.0}], labels: {analyst: 0, auditor: 0, actor: 0, clones: 0, prod: 0, telemetry: 0, feedback: 0, rehearse: 0, review: 0, sendback: 0, apply: 0, reject: 0, nowriteAn: 3.6}, labelsUntil: {nowriteAn: 7.9},
      events: [{kind: 'feedback', at: 2.1}, {kind: 'rehearse', at: 5.0}, {kind: 'review', at: 8.6}]},
    words: 'Nik: "First is analyst" (1994.84) "whose role is to analyze metrics" (1996.54) "propose some solution, the change" (2004.46)',
    source: `${POST} (hero: AaaPipeline3D; AAA: "Analyst (propose) ... holds zero production write access")`},
  {id: 'r22c-aaa-actor', row: 22, comp: 'aaa3d198', outStart: E(2008.6), dur: 12.4, placement: 'center',
    props: {cam: [{at: 0, ...W3D}, {at: 0.34, move: 1.4, yaw: -4, pitch: 10, dist: 10.4, focal: 1.02, tx: 0.0, ty: 1.8, ox: 0.5, oy: 0.53}],
      focus: [{flows: ['rehearse', 'apply'], at: 0.34}], glow: [{key: 'actor', at: 0.34}],
      hot: [{id: 'actor', at: 0.34}, {id: 'actor', at: 5.1}],
      events: [{kind: 'rehearse', at: 5.2}, {kind: 'apply', at: 7.4}]},
    words: 'Nik: "actor, which will execute this change" (2008.94) "actor is almost, like, ideally should be super deterministic" (2013.74) "the script, uh, a- analyst proposed" (2020.80)',
    source: `${POST} (hero: AaaPipeline3D, "Actor deterministic · sole write path"; AAA: "Actor (execute). A deterministic engine ...")`},
  {id: 'r23a-aaa-auditor', row: 23, comp: 'aaafig198', outStart: E(2228.4), dur: 12.5, placement: 'center',
    props: {appear: ALL, focus: {keys: ['phase2', 'auditor', 'cr', 'back', 'approve', 'reject'], at: 2.5}, glow: [{key: 'auditor', at: 2.5}]},
    words: 'Nik: "And then there is a third A, which is auditor" (2228.64) "Originally, auditor role" (2232.08)',
    source: `${POST} (Figure 2; AAA: "Auditor (review) ... returns a verdict (approve, request_changes, or reject)")`},
  {id: 'r23b-aaa-path', row: 23, comp: 'aaa3d198', outStart: E(2242.6), dur: 10.6, placement: 'center',
    props: {cam: [{at: 0, ...W3D}, {at: 0.3, move: 9.5, yaw: 5, pitch: 15, dist: 10.4, focal: 0.94, tx: 0.05, ty: 1.84, ox: 0.5, oy: 0.52}],
      glow: [{key: 'auditor', at: 2.8}], hot: [{id: 'auditor', at: 2.8}, {id: 'reject', at: 4.0}, {id: 'apply', at: 6.2}],
      events: [{kind: 'rehearse', at: 0.4}, {kind: 'review', at: 2.0}, {kind: 'reject', at: 3.5}, {kind: 'review', at: 4.6}, {kind: 'apply', at: 6.2}]},
    accents: [4.0],
    words: 'Nik: "obviously auditor, main auditor role" (2244.38) "is between analyst and actor" (2245.72) "review the change proposed by analyst" (2250.42)',
    source: `${POST} (hero: AaaPipeline3D; AAA: the Auditor reviews the change request and the clone evidence: approve, send back or reject; only an approved change goes through the Actor to production)`},
  {id: 'r24-editor-note', row: 24, comp: 'aaa3d198', outStart: E(2258.08), dur: 7.0, placement: 'center',
    // v5 cuts the slip "and neither analyst nor actor have access to production, right?" (src 2628.3-2632.8):
    // the panel states the fact plainly, on the next AAA words that remain
    props: {caption: {lines: ['In AAA: only the Actor writes to production.'], prefixLen: 7, size: 42, hi: [{word: 'only the Actor', at: 1.4}]},
      cam: [{at: 0, ...W1}, {at: 0.3, move: 1.6, yaw: 6, pitch: 12, dist: 10.4, focal: 0.95, tx: 0.35, ty: 1.75, ox: 0.5, oy: 0.52}],
      focus: [{flows: ['apply'], at: 0.3}], glow: [{key: 'actor', at: 0.4}, {key: 'prod', at: 1.4}],
      labels: {analyst: 0, auditor: 0, actor: 0, clones: 0, prod: 0, apply: 0, nowriteAn: 0.9, nowriteAu: 1.2},
      hot: [{id: 'nowriteAn', at: 0.9}, {id: 'nowriteAu', at: 1.2}, {id: 'actor', at: 1.4}],
      events: [{kind: 'apply', at: 0.8}, {kind: 'apply', at: 1.4}]},
    words: 'Nik: "But all of them have access to, of course, proposed CR" (2258.08)', source: `${POST} (hero: AaaPipeline3D, "no write access" on Analyst and Auditor, "Actor deterministic · sole write path")`},
  {id: 'r26-send-back', row: 26, comp: 'aaa3d198', outStart: E(2398.3), dur: 7.6, placement: 'center',
    props: {caption: {lines: ['Auditor: send back · reject · approve'], prefixLen: 8, hi: Object.entries(relE(2398.3, {'send back': 2398.54, reject: 2400.6, approve: 2403.22})).map(([word, at]) => ({word, at}))},
      cam: [{at: 0, ...W1}, {at: 0.2, move: 1.4, yaw: 6, pitch: 13, dist: 10.4, focal: 1.25, tx: 0.75, ty: 2.35, ox: 0.5, oy: 0.5}],
      focus: [{flows: ['review', 'apply'], at: 0.3}], glow: [{key: 'auditor', at: 0.3}],
      hot: Object.entries(relE(2398.3, {sendback: 2398.54, reject: 2400.6, apply: 2403.22})).map(([id, at]) => ({id, at})),
      events: [{kind: 'back', at: relE(2398.3, {a: 2398.54}).a}, {kind: 'reject', at: relE(2398.3, {a: 2400.6}).a}, {kind: 'apply', at: relE(2398.3, {a: 2403.22}).a}]},
    words: 'Nik: "send back for improvements" (2398.54) "completely reject" (2400.60) "approve" (2403.22)', source: `${POST} (hero: AaaPipeline3D pills "send back", "reject", "approve → apply")`},
  {id: 'r27-triangle', row: 27, comp: 'aaa3d198', outStart: E(2570.3), dur: 11.0, placement: 'center',
    props: {caption: {lines: ['Not alone: three roles, plus', 'branching · dedicated clones · telemetry'], lineAt: [3.0], prefixLen: 10, size: 50, side: 560, hi: Object.entries(relE(2570.3, {branching: 2575.72, 'dedicated clones': 2577.86, telemetry: 2580.28})).map(([word, at]) => ({word, at}))},
      cam: [{at: 0, ...W2}],
      events: [{kind: 'rehearse', at: 0.4}, {kind: 'review', at: 2.4}, {kind: 'apply', at: 3.8}, {kind: 'rehearse', at: relE(2570.3, {a: 2575.72}).a}, {kind: 'feedback', at: relE(2570.3, {a: 2580.28}).a}],
      glow: [{key: 'clones', at: relE(2570.3, {a: 2575.72}).a, until: relE(2570.3, {a: 2580.0}).a}],
      hot: Object.entries(relE(2570.3, {rehearse: 2575.72, clones: 2577.86, telemetry: 2580.28})).map(([id, at]) => ({id, at}))},
    words: 'Nik: "triangle works really well" (2571.32) "equipped with proper" (2573.32) "branching" (2575.72) "dedicated" (2577.86) "all the telemetry" (2580.28)',
    source: `on air (Nik); ${POST} (hero: AaaPipeline3D; Practical rules: DBLab Engine branching, DBLab Forge dedicated environments, postgres_ai monitoring)`},
  {id: 'r28a-dots', row: 28, comp: 'dots198', outStart: E(2602.6), dur: 19.4, placement: 'center',
    props: {mode: 'full', b: relE(2602.6, {gate: 2605.8, auditor: 2610.78, stamp: 2614.86, no: 2617.5, left: 2618.2})}, accents: [3.2],
    words: 'Kirk: "So now that we used AAA as our process" (2602.82) "gave it over to the actor again to run it in production" (2610.78) "got rid of 100% of the errors" (2614.14; "100%" 2614.86 = stamp); Nik: "Uh, no. One harm left in Opus 5.5" (2617.30; "no." 2617.50 = count 1)',
    source: `${POST} (Figure 3; replay finding 1: gate 6 of 13, Auditor 6 of 7 remaining, 1 held-out claude-opus-5.5 miss)`},
  {id: 'r28b-13-to-1', row: 28, comp: 'dots198', outStart: E(2633.6), dur: 6.6, placement: 'center',
    props: {mode: 'hero', b: {hero: 0.2, pct: 2.2}},
    words: 'Kirk: "13 harms down to one" (2634.28) "by structuring this a little better" (2637.98)', source: `${POST} (Figure 3: 13 -> 7 -> 1, -92.3%)`},
  {id: 'r28c-replay-note', row: 28, comp: 'motif198', outStart: E(2508.52), dur: 7.0, placement: 'band',
    props: {lines: ["Editor's note: 13 → 1 is an offline replay of the 408 recorded", 'changes through AAA (in-sample), not a second live run.'], lit: 'none', prefixLen: 14},
    typed: {lines: ["Editor's note: 13 → 1 is an offline replay of the 408 recorded", 'changes through AAA (in-sample), not a second live run.']},
    vetoable: 'Editor\'s note: on air Kirk asks "Did it then tell a different actor to run it in production?" and Nik says "Yes."; the post: "We replayed all 408 scored Track 1 primary CRs offline through both AAA gates" (retrospective and in-sample)',
    words: 'Kirk: "different actor to run it in production" (2506.82); Nik: "Yes." (2508.52)',
    source: `${POST} (replay finding 1: "When we replayed the models' primary changes through AAA (retrospective and in-sample) ... blocked 12 of 13 measured harms (-92.3%)"; "We replayed all 408 scored Track 1 primary CRs offline through both AAA gates using their recorded rehearsal telemetry")`},
  {id: 'r29-377-of-378', row: 29, comp: 'safe198', outStart: E(2771.9), dur: 10.0, placement: 'center',
    props: {b: relE(2771.9, {one: 2773.44, hero: 2774.5, note: 2777.7})}, accents: [relE(2771.9, {h: 2774.5}).h],
    words: 'Nik: "almost 400" (2772.06) "only one was blocked" (2773.44; v5 cuts "by mistake") "should talk about false positive" (2777.70)',
    source: `${POST} (replay finding 2: 377 of 378 safe or unclassified approved, 99.7%; the one block: L5, grok-4.7, one DO block over the 10M-row scan)`},
  {id: 'r34-kirk-evidence', row: 34, comp: 'motif198', outStart: E(3037.7), dur: 9.6, placement: 'band',
    props: {lines: ['“A successful experiment is evidence, not a guarantee.', 'Rollback is a procedure, not a promise.”'], lineAt: [4.93], lit: 'none', hiWords: ['evidence', 'procedure'], strike: [{word: 'guarantee', at: 2.6}, {word: 'promise', at: 6.6}]},
    typed: {lines: ['“A successful experiment is evidence, not a guarantee.', 'Rollback is a procedure, not a promise.”'], lineAt: [4.93]},
    words: 'Kirk: "A successful experiment is evidence" (3037.89) "rollback is a procedure, not a promise" (3042.63)', source: 'on air (Kirk), his exact words'},
  {id: 'r37-kirk-delegate', row: 37, comp: 'aaa3d198', outStart: E(3120.2), dur: 8.2, placement: 'center',
    props: {caption: {lines: ['“…how much responsibility we can safely delegate,', 'not simply how intelligent the AI is.”'], lineAt: [relE(3120.2, {a: 3123.53}).a], size: 50, side: 560, hi: [{word: 'responsibility', at: relE(3120.2, {a: 3120.87}).a}]},
      cam: [{at: 0, ...W2}],
      events: [{kind: 'rehearse', at: 0.3}, {kind: 'review', at: 2.6}, {kind: 'apply', at: 4.2}]},
    words: 'Kirk: "responsibility we can safely delegate" (3120.87) "not simply how intelligent the AI is" (3123.53)', source: `on air (Kirk), his exact words; scene: ${POST} hero (AaaPipeline3D)`},
];
// Back-to-back center cards (S28): when the gap between two center cards is under 2 s on this cut, the first
// card holds until the next one starts, so the hosts stay in the right column. Such a card gets its own render.
const EXTENDED = new Set<string>();
{
  const cen = ITEMS.filter((it) => it.placement === 'center').sort((a, b) => a.outStart - b.outStart);
  for (let i = 0; i + 1 < cen.length; i++) {
    const gap = cen[i + 1].outStart - (cen[i].outStart + cen[i].dur);
    if (V3 && gap > 0.001 && gap < 2) { cen[i].dur = r2(cen[i + 1].outStart - cen[i].outStart); EXTENDED.add(cen[i].id); }
  }
}

const mode = process.argv[2];
const only = new Set(process.argv.slice(3));
mkdirSync(OUT, {recursive: true});
if (mode === 'render') {
  const todo = ITEMS.filter((it) => !only.size || only.has(it.id));
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const it = todo[next++];
      const file = join(OUT, fileOf(it.id));
      const p = Bun.spawn(['bunx', 'remotion', 'render', 'src/index.ts', it.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', '--concurrency', '3', `--props=${JSON.stringify({...it.props, durationSec: it.dur})}`], {cwd: ROOT, stdout: 'pipe', stderr: 'pipe'});
      const code = await p.exited;
      console.log(code === 0 && existsSync(file) ? `ok ${it.id}` : `FAIL ${it.id} ${(await new Response(p.stderr).text()).slice(-1200)}`);
    }
  };
  await Promise.all(Array.from({length: Number(process.env.RW ?? 3)}, worker));
}
if (mode === 'manifest' || mode === 'render') {
  // typing bursts for band items (sfx-manifest.ts reads <id>-typing-bursts.json next to the manifest)
  for (const it of ITEMS) if (it.typed || it.comp === 'chat198') {
    const lines = it.typed?.lines ?? it.props.lines;
    const pl = motifPlan(lines, it.typed?.lineAt ?? it.props.lineAt);
    writeFileSync(join(OUT, `${it.id}-typing-bursts.json`), JSON.stringify({overlay: `${it.id}.mov`, timeBase: 'seconds from the overlay start', bursts: pl.map((p, i) => ({start: r3(p.at), end: r3(p.end), chars: p.text.length, line: i}))}, null, 2));
  }
  const mine = ITEMS.map((it) => ({id: it.id, row: it.row, outStart: it.outStart, duration: it.dur, dur: it.dur, file: fileOf(it.id), placement: it.placement, freezeSec: 0, sfx: [], ...(it.accents ? {accents: it.accents.map(r2)} : {}), source: it.source, words: it.words, builder: 'illus-1', ...(it.vetoable ? {vetoable: it.vetoable} : {})}));
  // illus-2 fragments
  const partsDir = join(OUT, 'parts');
  const parts = existsSync(partsDir) ? readdirSync(partsDir).filter((f) => f.endsWith('.json') && !/\.v\d+\.json$/.test(f)).map((f) => ({id: f.replace(/\.json$/, ''), builder: 'illus-2', freezeSec: 0, ...JSON.parse(readFileSync(join(partsDir, f), 'utf8'))})).map((p: any) => ({...p, row: parseInt(String(p.row), 10), duration: p.dur ?? p.duration, dur: p.dur ?? p.duration, accents: p.accents ?? (p.sfx ?? []).filter((x: any) => /accent/.test(x.file)).map((x: any) => x.at)})) : [];
  // on a re-cut: a fragment with its own <id>.v3.json (re-timed and re-rendered for v3) replaces the v2 one;
  // the others keep their render and move through the source timeline (E)
  if (V3) for (let i = 0; i < parts.length; i++) {
    const f3 = join(partsDir, `${parts[i].id}.${TAG}.json`);
    // no fragment for this TAG: an earlier re-cut's fragment (v3) moves through source time when the new
    // cut changes nothing inside its window (checked by verify-<TAG>.tsv)
    const prevTag = ['v4', 'v3'].filter((g) => +g.slice(1) < +TAG.slice(1)).find((g) => existsSync(join(partsDir, `${parts[i].id}.${g}.json`)));
    const fPrev = prevTag ? join(partsDir, `${parts[i].id}.${prevTag}.json`) : '';
    if (!existsSync(f3) && prevTag) {
      const q = JSON.parse(readFileSync(fPrev, 'utf8'));
      parts[i] = {...parts[i], ...q, id: parts[i].id, row: parts[i].row, outStart: EVX(prevTag, q.outStart), duration: q.dur ?? q.duration, dur: q.dur ?? q.duration, accents: q.accents ?? (q.sfx ?? []).filter((x: any) => /accent/.test(x.file)).map((x: any) => x.at), from: fPrev};
      continue;
    }
    if (existsSync(f3)) { const q = JSON.parse(readFileSync(f3, 'utf8')); parts[i] = {...parts[i], ...q, id: parts[i].id, row: parts[i].row, duration: q.dur ?? q.duration, dur: q.dur ?? q.duration, accents: q.accents ?? (q.sfx ?? []).filter((x: any) => /accent/.test(x.file)).map((x: any) => x.at), v3: f3}; }
    else parts[i] = {...parts[i], outStart: E(parts[i].outStart)};
  }
  // kept v1 captures: rows 11 (max_locks_per_transaction docs) and 33 (arXiv DBA-Bench)
  // row 11: illus-2's animated v2-r11-maxlocks replaces the v1 docs capture when it exists
  // a fragment that exists only for this cut (e.g. f08-dbabench.v5.json: illus-2 took over the v1 capture)
  const tagOnly = V3 && existsSync(partsDir) ? readdirSync(partsDir).filter((f) => f.endsWith(`.${TAG}.json`) && !existsSync(join(partsDir, f.replace(`.${TAG}.json`, '.json')))).map((f) => ({builder: 'illus-2', freezeSec: 0, ...JSON.parse(readFileSync(join(partsDir, f), 'utf8')), v3: join(partsDir, f)})) : [];
  for (const q of tagOnly) parts.push({...q, row: Number.isNaN(parseInt(String(q.row), 10)) ? q.row : parseInt(String(q.row), 10)});
  const keepV1 = [...(tagOnly.some((q: any) => q.id.startsWith('f08-dbabench')) ? [] : ['f08-dbabench']), ...(parts.some((p: any) => p.row === 11) ? [] : ['f05-maxlocks'])];
  const v1 = JSON.parse(readFileSync(resolve(OUT, '../out/manifest-sfx.json'), 'utf8')).overlays.filter((o: any) => keepV1.includes(o.id)).map((o: any) => ({...o, row: o.id === 'f05-maxlocks' ? 11 : 33, file: `../out/${o.file}`, sfx: [], builder: 'v1 capture'}));
  if (V3) for (const o of v1) o.outStart = E(o.outStart);
  const all = [...mine, ...parts.filter((p: any) => !mine.some((m) => m.id === p.id)), ...v1].sort((a: any, b: any) => a.outStart - b.outStart);
  const head = {video: V3 ? process.env.VIDEO ?? 'pgfm198-edited.mp4' : 'v2-edit/pgfm198-edited.mp4', cuts: process.env.CUTS ?? BASE_CUTS, fps: 25, width: 1920, height: 1080, timeBase: 'edited.mp4 seconds, before intro and freeze shifts', band: {x: 120, y: 744, w: 1480, h: 144}, layout: 'center placement: hosts move to place.<host>.center (right column, x 1630) in layout.json'};
  const MNAME = V3 ? `manifest-${TAG}.json` : 'manifest-v2.json';
  writeFileSync(join(OUT, MNAME), JSON.stringify({...head, overlays: all}, null, 2));
  // checks: overlaps on the same layer, center spacing
  const probs: string[] = [];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a: any = all[i], b: any = all[j];
    if (b.outStart < a.outStart + a.dur) probs.push(`overlap: ${a.id} (${a.outStart}-${r2(a.outStart + a.dur)}) and ${b.id} (${b.outStart})`);
  }
  const cen = all.filter((o: any) => o.placement === 'center');
  for (let i = 1; i < cen.length; i++) {
    const gap = r2(cen[i].outStart - (cen[i - 1].outStart + cen[i - 1].dur));
    if (gap > 0 && gap < 4) probs.push(`center gap ${gap} s: ${cen[i - 1].id} -> ${cen[i].id} (hosts would bounce)`);
  }
  console.log(`${MNAME}: ${all.length} overlays (${mine.length} illus-1, ${parts.length} illus-2, ${v1.length} v1)`);
  console.log(probs.length ? probs.join('\n') : 'no overlaps, center spacing ok');
}
