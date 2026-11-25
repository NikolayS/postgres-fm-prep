// Final length and ending: the final must be as long as its parts (cold open + the composed
// body, whose time map holds the card and the outro) and must end on the outro. Episode 198:
// a compose froze at the outro crossfade (a known freeze); the final came out 21.5 s short,
// with no outro, and every other check passed.
//   "length": {"video": "<final.mp4>", "coldOpen": "<cold open.mp4>" (optional),
//              "timeMap": "<body>.time-map.json", "outro": "<outro.mp4>", "tolerance": 0.12}
import { run } from "./util";

const dur = async (f: string) => Number(new TextDecoder().decode(await run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])).trim());

export function lengthVerdict(d: { final: number; coldOpen?: number; body: number }, tolerance = 0.12): { pass: boolean; expected: number; problem?: string } {
  const expected = (d.coldOpen ?? 0) + d.body, diff = d.final - expected;
  if (Math.abs(diff) <= tolerance) return { pass: true, expected };
  return { pass: false, expected, problem: `final is ${d.final.toFixed(2)} s, expected ${expected.toFixed(2)} s (cold open + body): ${Math.abs(diff).toFixed(1)} s ${diff < 0 ? "short (a render stopped early? see the SKILL.md freeze note)" : "long"}` };
}

// One small grayscale frame as bytes.
async function gray(file: string, t: number): Promise<Uint8Array> {
  return run(["ffmpeg", "-nostdin", "-v", "error", "-ss", Math.max(0, t).toFixed(3), "-i", file, "-frames:v", "1", "-vf", "scale=64:36,format=gray", "-f", "rawvideo", "-"]);
}
const mad = (a: Uint8Array, b: Uint8Array) => { if (!a.length || a.length !== b.length) return 255; let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };

// Frames of the final's tail against the outro at 3 points after its crossfade in and before the
// compose fade to black (fadeOut s, default 2: compose.ts FADE_OUT; episode 198 body render).
export async function checkLength(cfg: { video: string; coldOpen?: string; timeMap: string; outro?: string; tolerance?: number; maxDiff?: number; fadeOut?: number }) {
  const problems: string[] = [];
  const tm = await Bun.file(cfg.timeMap).json();
  const final = await dur(cfg.video), coldOpen = cfg.coldOpen ? await dur(cfg.coldOpen) : 0;
  const v = lengthVerdict({ final, coldOpen, body: tm.total }, cfg.tolerance);
  if (!v.pass) problems.push(v.problem!);
  const diffs: number[] = [];
  if (cfg.outro) {
    const len = await dur(cfg.outro);
    const xfade = Math.min(1.5, len / 3);
    for (const f of [0.45, 0.75, 0.95]) {
      const t = xfade + f * (len - xfade - (cfg.fadeOut ?? 2) - 0.2);
      diffs.push(mad(await gray(cfg.outro, t), await gray(cfg.video, final - len + t)));
    }
    if (diffs.some((d) => d > (cfg.maxDiff ?? 12))) problems.push(`final does not end on the outro (${cfg.outro}): frame differences ${diffs.map((d) => d.toFixed(1)).join(", ")} (max ${cfg.maxDiff ?? 12})`);
  } else problems.push('give "outro": the outro component the compose used');
  return { final, expected: v.expected, diffs, problems };
}
