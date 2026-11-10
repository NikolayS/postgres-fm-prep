#!/usr/bin/env bun
// Change a window of a finished video without a full re-render. Everything before and after the
// window is stream-copied; only the window (widened to the nearest keyframes) is encoded again,
// with the same x264 settings as compose.ts. The audio is copied from the input (or --audio).
//
//   bun splice.ts in.mp4 out.mp4 --from 12.9 --to 106.2 --vf "crop=150:104:1538:302,boxblur=18:3" --at 1538:302
//        a filter on part of the frame: crop, filter, overlay back at --at x:y (or --vf alone on the whole frame)
//   bun splice.ts in.mp4 out.mp4 --to 20 --with intro-head.mp4
//        the picture of [0, 20) comes from another render of the same timeline (compose.ts --until 22)
//   bun splice.ts in.mp4 out.mp4 --outro outro.mp4 --at 4087.28 [--xfade 0.8]
//        new ending: the show up to --at (time-map "logo.start"), its last frame held while it
//        crossfades into outro.mp4. Also the fix for a compose render that froze at the outro.
//   [--audio mix.mp4] take the sound from another file (e.g. compose.ts --audio-only)
//   [--preset fast] [--dry-run]
//
// --from/--to are final-video seconds. --with: the clip's time 0 is final time --with-at (default 0).
// In --vf, t starts at 0 at the window start (printed as "window").
// Checks: video frame count equals the input's (except --outro), and the audio duration is kept.
import { $ } from "bun";
import { mkdirSync, rmSync } from "fs";
import { join } from "path";
import { parseArgs } from "util";

type Probe = { fps: number; frames: number; duration: number; timescale: number; hasAudio: boolean };

export async function probe(f: string): Promise<Probe> {
  const v = JSON.parse(await $`ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=r_frame_rate,nb_read_packets,time_base:format=duration -of json ${f}`.text());
  const [n, d] = v.streams[0].r_frame_rate.split("/").map(Number);
  const tb = v.streams[0].time_base.split("/").map(Number);
  const a = (await $`ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 ${f}`.text()).trim();
  return { fps: n / d, frames: Number(v.streams[0].nb_read_packets), duration: Number(v.format.duration), timescale: tb[1] / tb[0], hasAudio: a.length > 0 };
}

// Keyframe times (s) in [lo, hi].
export async function keyframes(f: string, lo: number, hi: number): Promise<number[]> {
  const out = await $`ffprobe -v error -select_streams v:0 -skip_frame nokey -show_entries frame=pts_time -of csv=p=0 -read_intervals ${`${Math.max(0, lo)}%${hi}`} ${f}`.text();
  return out.split("\n").map((s) => parseFloat(s)).filter((x) => Number.isFinite(x) && x >= lo - 1e-6 && x <= hi + 1e-6);
}

// Widen [from, to) to keyframes: start at the last keyframe <= from, end at the first keyframe
// >= to (or the end of the file). Times are rounded to whole frames.
export function widen(from: number, to: number, keysBefore: number[], keysAfter: number[], duration: number, fps: number) {
  const a = Math.max(0, ...keysBefore.filter((k) => k <= from + 1e-6));
  const after = keysAfter.filter((k) => k >= to - 1e-6);
  const b = after.length ? Math.min(...after) : duration;
  const fr = (x: number) => Math.round(x * fps);
  return { a: fr(a) / fps, b: fr(b) / fps, fa: fr(a), fb: after.length ? fr(b) : null };
}

if (import.meta.main) {
  const { values: v, positionals: p } = parseArgs({
    args: Bun.argv.slice(2), allowPositionals: true,
    options: {
      from: { type: "string" }, to: { type: "string" }, vf: { type: "string" }, at: { type: "string" },
      with: { type: "string" }, "with-at": { type: "string" }, outro: { type: "string" }, xfade: { type: "string" },
      audio: { type: "string" }, preset: { type: "string" }, "dry-run": { type: "boolean" },
    },
  });
  const [input, output] = p;
  const modes = [v.vf, v.with, v.outro].filter(Boolean).length;
  if (!output || modes !== 1) { console.error("usage: see the header of splice.ts (one of --vf, --with, --outro)"); process.exit(2); }
  const src = await probe(input);
  const fps = src.fps, ts = src.timescale;
  const enc = ["-c:v", "libx264", "-preset", v.preset ?? "fast", "-crf", "19", "-pix_fmt", "yuv420p", "-r", String(fps), "-video_track_timescale", String(ts)];
  const work = output + ".splice";
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const parts: string[] = [];
  let expectFrames: number | null = src.frames;

  if (v.outro) {
    const at = Number(v.at), X = Number(v.xfade ?? 0.8);
    if (!Number.isFinite(at)) { console.error("--outro needs --at <final time where the crossfade starts>"); process.exit(2); }
    const { a } = widen(at, at, await keyframes(input, at - 30, at), [], src.duration, fps);
    const keep = at - a;
    console.log(`window ${a.toFixed(3)}..end: show ${keep.toFixed(2)} s, hold ${X} s, crossfade into ${v.outro}`);
    if (v["dry-run"]) process.exit(0);
    if (a > 0) { await $`ffmpeg -y -v error -i ${input} -map 0:v -c copy -frames:v ${Math.round(a * fps)} -video_track_timescale ${ts} ${join(work, "head.mp4")}`; parts.push("head.mp4"); }
    const g = `[0:v]trim=duration=${keep.toFixed(3)},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${X},format=yuv420p,setsar=1,fps=${fps},settb=1/${fps}[a];` +
      `[1:v]format=yuv420p,setsar=1,fps=${fps},settb=1/${fps}[b];[a][b]xfade=transition=fade:duration=${X}:offset=${keep.toFixed(3)}[v]`;
    await $`ffmpeg -y -v error -ss ${a} -i ${input} -i ${v.outro} -filter_complex ${g} -map [v] ${enc} ${join(work, "tail.mp4")}`;
    parts.push("tail.mp4");
    expectFrames = null;
  } else {
    const from = Number(v.from ?? 0), to = v.to !== undefined ? Number(v.to) : src.duration;
    if (!(to > from)) { console.error("need --to > --from"); process.exit(2); }
    const w = widen(from, to, await keyframes(input, from - 30, from), await keyframes(input, to, to + 30), src.duration, fps);
    const n = (w.fb ?? src.frames) - w.fa;
    console.log(`window ${w.a.toFixed(3)}..${w.fb === null ? "end" : w.b.toFixed(3)} (${n} frames; asked ${from}..${to})`);
    if (v["dry-run"]) process.exit(0);
    if (w.fa > 0) { await $`ffmpeg -y -v error -i ${input} -map 0:v -c copy -frames:v ${w.fa} -video_track_timescale ${ts} ${join(work, "head.mp4")}`; parts.push("head.mp4"); }
    const mid = join(work, "mid.mp4");
    if (v.with) {
      const off = w.a - Number(v["with-at"] ?? 0);
      if (off < 0) { console.error("--with clip starts after the window"); process.exit(2); }
      const clip = await probe(v.with);
      if (clip.duration + 1e-3 < off + n / fps) { console.error(`--with clip is ${clip.duration.toFixed(2)} s; the window needs ${(off + n / fps).toFixed(2)} s`); process.exit(2); }
      await $`ffmpeg -y -v error -ss ${off} -i ${v.with} -map 0:v -frames:v ${n} ${enc} ${mid}`;
    } else {
      const g = v.at
        ? `[0:v]split[base][x];[x]${v.vf}[fx];[base][fx]overlay=${v.at}[v]`
        : `[0:v]${v.vf}[v]`;
      await $`ffmpeg -y -v error -ss ${w.a} -i ${input} -filter_complex ${g} -map [v] -frames:v ${n} ${enc} ${mid}`;
    }
    parts.push("mid.mp4");
    if (w.fb !== null) { await $`ffmpeg -y -v error -ss ${w.b} -i ${input} -map 0:v -c copy -video_track_timescale ${ts} ${join(work, "rest.mp4")}`; parts.push("rest.mp4"); }
  }

  await Bun.write(join(work, "list.txt"), parts.map((f) => `file '${f}'`).join("\n") + "\n");
  const video = join(work, "video.mp4");
  await $`ffmpeg -y -v error -f concat -safe 0 -i ${join(work, "list.txt")} -c copy ${video}`;
  const sound = v.audio ?? input;
  const tmp = output.replace(/\.mp4$/, "") + ".tmp.mp4";
  if ((await probe(sound)).hasAudio) await $`ffmpeg -y -v error -i ${video} -i ${sound} -map 0:v -map 1:a -c copy -movflags +faststart ${tmp}`;
  else await $`ffmpeg -y -v error -i ${video} -c copy -movflags +faststart ${tmp}`;
  await $`mv ${tmp} ${output}`;
  const got = await probe(output);
  const ok = expectFrames === null || got.frames === expectFrames;
  const vDur = got.frames / fps, aDur = Number((await $`ffprobe -v error -select_streams a:0 -show_entries stream=duration -of csv=p=0 ${output}`.text()).trim() || NaN);
  if (Number.isFinite(aDur) && Math.abs(aDur - vDur) > 0.1)
    console.log(`WARNING: audio ${aDur.toFixed(2)} s vs video ${vDur.toFixed(2)} s; remake the sound (compose.ts --audio-only) and pass --audio`);
  console.log(`wrote ${output}: ${got.frames} frames (${ok ? "ok" : `EXPECTED ${expectFrames}`}), ${got.duration.toFixed(2)} s`);
  rmSync(work, { recursive: true, force: true });
  if (!ok) process.exit(1);
}
