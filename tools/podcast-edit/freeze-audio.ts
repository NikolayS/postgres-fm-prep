// Talk audio around freeze cards (compose.ts): the picture holds, the sound must not do anything.
// Host feedback 2026-10-23 (viewer on YouTube): "very strange breathing sounds into the mic where
// the animation is". Causes: the freeze was filled by looping the quietest 0.4 s of mic sound near
// it (in dense talk that is mic noise or a breath, heard as a rhythm), the cut edge could sit on the
// tail of a word (heard twice through the two fades), and the air/wind SFX are noise bursts with a
// breath-like spectrum. So:
// - a freeze is clean silence; the 40 ms crossfades into and out of it are the fades;
// - the talk fades out (30 ms) by the last quiet 10 ms before the freeze, and fades in from the
//   first quiet 10 ms after it (quiet: three 10 ms frames in a row under QUIET_DB);
// - noise-burst SFX (air, wind) are off by default (compose --sfx-off "" turns them back on).
import { $ } from "bun";

export const XF = 0.04; // s; crossfade between the talk and a freeze
export const EDGE_FADE = 0.03; // s; talk fade at a freeze edge
export const QUIET_DB = -55; // dBFS, 10 ms frames
export const NOISE_SFX = ["air", "wind"];

export type Level = { t: number; db: number };
export type Freeze = { at: number; sec: number };

// Is this SFX file (name without extension) a noise burst that is off by default?
export const sfxOff = (name: string, off: string[] = NOISE_SFX) => off.some((p) => p && name.startsWith(p));

// Fade points at a freeze at time f, from 10 ms levels L (ascending t, around f): the talk is
// silent from outEnd and comes back from inStart. Without a quiet run nearby, the plain edges.
export function quietEdges(L: Level[], f: number, quiet = QUIET_DB): { outEnd: number; inStart: number } {
  const q = (k: number, dir: number) => [0, 1, 2].every((d) => (L[k + dir * d]?.db ?? 0) < quiet);
  const keys = [...L.keys()];
  const ia = [...keys].reverse().find((k) => L[k].t <= f - 0.01 && q(k, -1));
  const ib = keys.find((k) => L[k].t >= f && q(k, 1));
  return { outEnd: ia !== undefined ? L[ia].t + 0.01 : f, inStart: ib !== undefined ? L[ib].t : f };
}

// 10 ms levels of an input's sound in [t-0.3, t+0.3).
export async function edgeLevels(input: string, t: number): Promise<Level[]> {
  const a = Math.max(0, t - 0.3), R = 16000, H = R / 100;
  const pcm = new Float32Array(await $`ffmpeg -v error -ss ${a.toFixed(3)} -t 0.6 -i ${input} -vn -ac 1 -ar ${R} -f f32le -`.arrayBuffer());
  const out: Level[] = [];
  for (let k = 0; (k + 1) * H <= pcm.length; k++) {
    let e = 0;
    for (let j = k * H; j < (k + 1) * H; j++) e += pcm[j] ** 2;
    out.push({ t: a + k / 100, db: 10 * Math.log10(e / H + 1e-12) });
  }
  return out;
}

// Filter lines for the talk with freezes (window time; input 0's sound starts at `from`), ending in
// [talk]. `levels(t)` gives the 10 ms levels around input time t (edgeLevels by default).
export async function talkChain(input: string, from: number, freezes: Freeze[], showLen: number, levels = (t: number) => edgeLevels(input, t)): Promise<string[]> {
  const ga: string[] = [];
  if (!freezes.length) return [`[0:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[talk]`];
  const n = freezes.length + 1;
  ga.push(`[0:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,asplit=${n}${Array.from({ length: n }, (_, i) => `[ta${i}]`).join("")}`);
  const edges = await Promise.all(freezes.map(async (f) => {
    const e = quietEdges(await levels(from + f.at), from + f.at);
    return { outEnd: e.outEnd - from, inStart: e.inStart - from };
  }));
  let cur = "";
  for (let i = 0; i < n; i++) {
    const a = i === 0 ? 0 : freezes[i - 1].at, b = i < freezes.length ? freezes[i].at : showLen;
    // Each crossfade eats XF s, so talk pieces keep XF / 2 on the joined sides.
    const a2 = i === 0 ? a : a - XF / 2, b2 = i < freezes.length ? b + XF / 2 : b;
    const fades = [
      ...(i > 0 ? [`afade=t=in:st=${(Math.max(edges[i - 1].inStart, a2) - Math.max(0, a2)).toFixed(4)}:d=${EDGE_FADE}`] : []),
      ...(i < freezes.length ? [`afade=t=out:st=${(Math.min(edges[i].outEnd, b2) - EDGE_FADE - Math.max(0, a2)).toFixed(4)}:d=${EDGE_FADE}`] : []),
    ];
    ga.push(`[ta${i}]atrim=start=${Math.max(0, a2).toFixed(4)}:end=${b2.toFixed(4)},asetpts=PTS-STARTPTS${fades.map((f) => `,${f}`).join("")}[tp${i}]`);
    if (i === 0) cur = "tp0";
    else {
      ga.push(`[${cur}][tp${i}]acrossfade=d=${XF}:c1=qsin:c2=qsin[tj${i}]`);
      cur = `tj${i}`;
    }
    if (i < freezes.length) {
      // Clean silence, never looped mic sound.
      ga.push(`aevalsrc=0|0:s=48000:c=stereo:d=${(freezes[i].sec + XF).toFixed(4)}[rt${i}]`);
      ga.push(`[${cur}][rt${i}]acrossfade=d=${XF}:c1=qsin:c2=qsin[tr${i}]`);
      cur = `tr${i}`;
    }
  }
  ga.push(`[${cur}]anull[talk]`);
  return ga;
}
