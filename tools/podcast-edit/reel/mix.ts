// Mix SFX hits for the PG19 reel and mux with the silent render.
// usage: bun mix.ts <silent.mp4> <out.mp4>
import {$} from 'bun';
const [IN, OUT] = process.argv.slice(2);
const SFX = '/Users/nik/github/postgres-fm-prep/tools/podcast-edit/sfx';
const fps = 30, INTRO = 66, SEG = 90, N = 6;
const cuts = Array.from({length: N + 1}, (_, i) => INTRO + i * SEG);
type Ev = {f: number; file: string; gain: number; dur?: number};
const ev: Ev[] = [
  {f: 0, file: 'G10-soft-start-quick-stop.wav', gain: 0},
  {f: 26, file: 'L-punch-rough.wav', gain: 0},
];
for (const c of cuts) ev.push({f: c - 8, file: 'G9-wider-band.wav', gain: -4});
for (const c of cuts.slice(0, N)) ev.push({f: c + 4, file: 'L-punch-rough.wav', gain: -2});
const [rep, ntf, av, wt, pa, df, end] = cuts;
const typing = (f: number, frames: number) => ev.push({f, file: 'U2-typing-fast.wav', gain: -3, dur: frames / fps});
typing(rep + 6, 19); typing(ntf + 4, 9); typing(wt + 18, 18); typing(pa + 20, 24);
ev.push({f: ntf + 54, file: 'K-sand-stroke-falling.wav', gain: -2});
ev.push({f: av + 32, file: 'K-sand-stroke-falling.wav', gain: -2});
ev.push({f: wt + 58, file: 'G10-soft-start-quick-stop.wav', gain: -2});
ev.push({f: pa + 50, file: 'L-punch-rough.wav', gain: 0});
for (const k of [8, 22, 36]) ev.push({f: df + k, file: 'G10-soft-start-quick-stop.wav', gain: -3});
ev.push({f: end + 6, file: 'L-punch-rough.wav', gain: 1});
const inputs = ev.flatMap((e) => ['-i', `${SFX}/${e.file}`]);
const parts = ev.map((e, i) => `[${i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,${e.dur ? `atrim=0:${e.dur.toFixed(3)},afade=t=out:st=${(e.dur - 0.08).toFixed(3)}:d=0.08,` : ''}volume=${e.gain}dB,adelay=${Math.round((e.f / fps) * 1000)}:all=1[a${i}]`);
const filter = `${parts.join(';')};${ev.map((_, i) => `[a${i}]`).join('')}amix=inputs=${ev.length}:normalize=0,apad,atrim=0:23,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;
await $`ffmpeg -nostdin -loglevel error -y -i ${IN} ${inputs} -filter_complex ${filter} -map 0:v -map [out] -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest ${OUT}`;
console.log('events', ev.length);
