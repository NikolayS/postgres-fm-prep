// Episode 197: the overlay sounds as one stem in body v5 time, for an audio-only remux
// (the body was rendered from the raw manifest.json, so it has no SFX).
//
//   bun sfx-stem.ts <manifest-sfx.json> <cuts.json> <seconds> <out.f32> [--sfx-lufs -20]
//       [--sfx-rel center-in=0,center-out=-3,typing=0,accent=0] [--gain-db 0.15] [--offset 0.021333]
//
// Levels as compose.ts: each sound's loudest 400 ms (momentary max) is set to --sfx-lufs plus its
// --sfx-rel offset by file name; then --gain-db, the linear loudnorm gain the body mix got
// (26-final-v2: measured -16.15 LUFS, target -16). Times: outStart + at in body v3 seconds,
// minus the body v5 cuts before them (edit/body-v5-cuts.json), plus --offset: the body's
// constant 1024-sample (21.3 ms) A/V start offset, so a sound lands on its overlay's frame.
// Output: raw float32 stereo 48 kHz, <seconds> long.
import { $ } from "bun";
import { dirname, resolve } from "path";
import { parseArgs } from "util";

export type Cut = { from: number; to: number };
// Body v3 time -> body v5 time; null inside a cut.
export function toV5(t: number, cuts: Cut[]): number | null {
  let d = 0;
  for (const c of cuts) {
    if (t >= c.from && t < c.to) return null;
    if (t >= c.to) d += c.to - c.from;
  }
  return t - d;
}

// The same measurement as compose.ts momentaryMax.
async function momentaryMax(f: string): Promise<number> {
  const out = await $`ffmpeg -nostdin -hide_banner -nostats -v verbose -i ${f} -af apad=pad_dur=0.5,ebur128=framelog=verbose -f null -`.nothrow().quiet();
  const ms = [...out.stderr.toString().matchAll(/ M:\s*(-?[\d.]+)/g)].map((m) => Number(m[1])).filter((v) => v > -70);
  if (!ms.length) throw new Error(`no loudness for ${f}`);
  return Math.max(...ms);
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2), allowPositionals: true,
    options: { "sfx-lufs": { type: "string", default: "-20" }, "sfx-rel": { type: "string", default: "center-in=0,center-out=-3,typing=0,accent=0" }, "gain-db": { type: "string", default: "0.15" }, offset: { type: "string", default: "0.021333" } },
  });
  const [manifestPath, cutsPath, secs, out] = positionals;
  if (!out) { console.error("usage: see the header of sfx-stem.ts"); process.exit(2); }
  const m = await Bun.file(manifestPath).json(), mdir = dirname(resolve(manifestPath));
  const cj = await Bun.file(cutsPath).json();
  const cuts: Cut[] = (cj.cuts ?? cj).map((c: any) => ({ from: c.from ?? c[0], to: c.to ?? c[1] }));
  const rel = Object.fromEntries(values["sfx-rel"]!.split(",").map((kv) => kv.split("=")).map(([k, v]) => [k, Number(v)]));
  const SFX_M = Number(values["sfx-lufs"]), G = Number(values["gain-db"]), OFF = Number(values.offset);
  const ins: string[] = ["-f", "lavfi", "-t", secs, "-i", "anullsrc=r=48000:cl=stereo"], ga: string[] = [], rows: string[] = [];
  const mm = new Map<string, number>();
  for (const o of m.overlays)
    for (const s of o.sfx ?? []) {
      const f = resolve(mdir, s.file), name = f.split("/").pop()!.replace(/\.[^.]+$/, "");
      if (!mm.has(f)) mm.set(f, await momentaryMax(f));
      const t = toV5(o.outStart + s.at, cuts);
      if (t === null) { console.error(`${o.id} ${name}: inside a cut, skipped`); continue; }
      const gain = SFX_M + (rel[name] ?? 0) - mm.get(f)! + G, k = ins.filter((x) => x === "-i").length;
      ins.push("-i", f);
      ga.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${gain.toFixed(2)}dB,adelay=${Math.round((t + OFF) * 1000)}:all=1[s${k}]`);
      rows.push(`${o.id}\t${name}\t${(t).toFixed(3)}\t${gain.toFixed(2)} dB`);
    }
  const n = ga.length;
  const graph = `${ga.join(";\n")};\n[0:a]${[...Array(n).keys()].map((i) => `[s${i + 1}]`).join("")}amix=inputs=${n + 1}:normalize=0:duration=first[out]`;
  const gf = out + ".graph.txt";
  await Bun.write(gf, graph);
  await $`ffmpeg -nostdin -y -v error ${ins} -filter_complex_script ${gf} -map [out] -f f32le -ar 48000 -ac 2 ${out}`;
  await Bun.write(out + ".tsv", "id\tsound\tbody_v5_s\tgain\n" + rows.join("\n") + "\n");
  console.log(`${n} sounds -> ${out} (${out}.tsv)`);
}
