// Measure speech levels against music. Usage: await checkAudio({ music, voices }).
import { ffmpeg } from "./util";

type Options = { activeDb?: number; dominanceDb?: number; minGapDb?: number; minP10GapDb?: number; maxSpreadDb?: number };
export function blockDb(samples: Float32Array, rate: number, blockSec: number): number[] {
  const size = Math.round(rate * blockSec);
  if (!Number.isFinite(size) || size < 1 || rate <= 0 || blockSec <= 0) throw new Error("Block duration and sample rate must be positive");
  const result: number[] = [];
  for (let start = 0; start < samples.length; start += size) {
    const n = Math.min(size, samples.length - start);
    if (n < size / 2) break;
    let sum = 0;
    for (let i = start; i < start + n; i++) sum += samples[i] ** 2;
    const rms = Math.sqrt(sum / n);
    result.push(rms < 1e-6 ? -120 : 20 * Math.log10(rms));
  }
  return result;
}
export async function readPcm(path: string, rate = 8000): Promise<Float32Array> {
  const data = await ffmpeg(["-i", path, "-vn", "-ac", "1", "-ar", String(rate), "-c:a", "pcm_f32le", "-f", "f32le", "pipe:1"]);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const samples = new Float32Array(data.byteLength / 4);
  for (let i = 0; i < samples.length; i++) samples[i] = view.getFloat32(i * 4, true);
  return samples;
}
function percentile(values: number[], p: number): number {
  if (!values.length) return -120;
  const sorted = [...values].sort((a, b) => a - b), index = (sorted.length - 1) * p;
  const lo = Math.floor(index), hi = Math.ceil(index);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
}
export function voiceVsMusic(voices: Record<string, number[]>, music: number[], opts: Options = {}) {
  const { activeDb = -45, dominanceDb = 6, minGapDb = 10, minP10GapDb = 6, maxSpreadDb = 3 } = opts;
  const errors: string[] = [], entries = Object.entries(voices);
  const rows = entries.map(([voice, db]) => {
    const levels: number[] = [], gaps: number[] = [];
    db.forEach((level, i) => {
      if (level >= activeDb && entries.every(([other, values]) => other === voice || level >= (values[i] ?? -120) + dominanceDb)) {
        levels.push(level);
        gaps.push(level - (music[i] ?? -120));
      }
    });
    const voiceDb = percentile(levels, 0.5), gapMedianDb = percentile(gaps, 0.5), gapP10Db = percentile(gaps, 0.1);
    const pass = levels.length > 0 && gapMedianDb >= minGapDb && gapP10Db >= minP10GapDb;
    if (!levels.length) errors.push(`no speech found for ${voice}`);
    else if (!pass) errors.push(`${voice} is too quiet above the music (median gap ${gapMedianDb.toFixed(1)} dB, 10th-percentile gap ${gapP10Db.toFixed(1)} dB)`);
    return { voice, blocks: levels.length, voiceDb, gapMedianDb, gapP10Db, pass };
  });
  const active = rows.filter(r => r.blocks).sort((a, b) => a.voiceDb - b.voiceDb);
  const spreadDb = active.length ? active[active.length - 1].voiceDb - active[0].voiceDb : 0;
  if (spreadDb > maxSpreadDb) errors.push(`Voice spread is ${spreadDb.toFixed(1)} dB; boost ${active[0].voice}`);
  if (!rows.length) errors.push("No voices supplied");
  return { pass: rows.every(r => r.pass) && spreadDb <= maxSpreadDb && !errors.length, rows, spreadDb, errors };
}
export async function checkAudio(cfg: { music: string; voices: Record<string, string>; blockSec?: number; from?: number; to?: number } & Options): Promise<ReturnType<typeof voiceVsMusic>> {
  const rate = 8000, from = cfg.from ?? 0;
  if (from < 0 || !Number.isFinite(from) || (cfg.to !== undefined && (!Number.isFinite(cfg.to) || cfg.to <= from))) throw new Error("Invalid audio time window");
  const read = async (path: string) => blockDb((await readPcm(path, rate)).subarray(Math.round(from * rate), cfg.to === undefined ? undefined : Math.round(cfg.to * rate)), rate, cfg.blockSec ?? 0.4);
  const [music, voices] = await Promise.all([read(cfg.music), Promise.all(Object.entries(cfg.voices).map(async ([name, path]) => [name, await read(path)] as const))]);
  return voiceVsMusic(Object.fromEntries(voices), music, cfg);
}
