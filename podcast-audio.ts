#!/usr/bin/env bun
// Audio-only podcast master: intro music + the edited talk + outro bed, no SFX, no freezes.
// Usage: bun podcast-audio.ts <edited.mp4> <edited.cuts.json> <out-base> --intro a.wav --outro b.wav
//        [--title "..."] [--trim-end S] [--card 13] [--tail 29.72] [--duck -15] [--bed-lead 11]
// Writes <out-base>.wav (stereo 44.1 kHz 16-bit), <out-base>.mp3 (CBR 192k, ID3 title) and
// <out-base>.time-map.json (audio time -> source time, one row per kept piece).
// The music mix is the one of the video final (compose.ts): the intro plays at full level for
// --card s (the title card in the video), ducks by --duck dB at the first words and fades to its
// end; the outro bed enters ducked --bed-lead s before the show ends, rises after the sign-off
// and ends --tail s after the show (end card + logo in the video). Music cues at -18 LUFS, a
// 10 s fade-in and fade-out, pre-limit, then two-pass loudnorm to -16 LUFS / -1.5 dBTP.
import { $ } from "bun";
import { parseArgs } from "util";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2), allowPositionals: true,
  options: {
    intro: { type: "string" }, outro: { type: "string" }, title: { type: "string" }, "trim-end": { type: "string" },
    card: { type: "string", default: "13" }, tail: { type: "string", default: "29.72" }, duck: { type: "string", default: "-15" },
    "bed-lead": { type: "string", default: "11" }, "rise-before": { type: "string", default: "1.0" },
  },
});
const [edited, cutsPath, outBase] = positionals;
if (!outBase || !values.intro || !values.outro) { console.error("usage: bun podcast-audio.ts <edited.mp4> <cuts.json> <out-base> --intro a.wav --outro b.wav [--title ...]"); process.exit(2); }
const C = Number(values.card), TAIL = Number(values.tail), DUCK = Number(values.duck), BED_LEAD = Number(values["bed-lead"]);
const MUSIC_LUFS = -18, FADE = 10, SR = 44100;
const plan = await Bun.file(cutsPath).json();
const dur = async (f: string) => Number((await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${f}`.text()).trim());
const lufs = async (f: string) => Number((await $`ffmpeg -hide_banner -nostats -i ${f} -af ebur128 -f null -`.nothrow().quiet()).stderr.toString().match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/)![1]);
const talkLen = values["trim-end"] ? Number(values["trim-end"]) : await dur(edited);
const showEnd = C + talkLen, total = showEnd + TAIL;
const db = (expr: string) => `volume='pow(10,(${expr})/20)':eval=frame`;

const introLen = await dur(values.intro), outroLen = await dur(values.outro);
const gi = MUSIC_LUFS - (await lufs(values.intro)), go = MUSIC_LUFS - (await lufs(values.outro));
const duckAt = C + 0.1;
const signOff = showEnd - Number(values["rise-before"]);
const bedBase = total - outroLen, bedStart = Math.max(bedBase, showEnd - BED_LEAD), rel = (t: number) => (t - bedStart).toFixed(3);
const g = [
  `[0:a]atrim=end=${talkLen.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(C * 1000)}:all=1,apad=whole_dur=${total.toFixed(3)},asetpts=N/SR/TB[voice]`,
  `[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${gi.toFixed(2)}dB,${db(`if(lt(t,${duckAt}),0,${DUCK}*min(1,(t-${duckAt})/0.5))`)},afade=t=out:st=${Math.min(introLen - 1, C + 2)}:d=${Math.max(1, introLen - C - 3).toFixed(2)},asetpts=N/SR/TB[mi]`,
  `[2:a]atrim=start=${(bedStart - bedBase).toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume=${go.toFixed(2)}dB,${db(`if(lt(t,${rel(signOff)}),${DUCK},${DUCK}*max(0,1-(t-${rel(signOff)})/1.2))`)},afade=t=in:d=3,adelay=${Math.round(bedStart * 1000)}:all=1,asetpts=N/SR/TB[mo]`,
  `[voice][mi][mo]amix=inputs=3:normalize=0:duration=first,atrim=end=${total.toFixed(3)},asetpts=N/SR/TB,afade=t=in:d=${FADE}:curve=ipar,afade=t=out:st=${(total - FADE).toFixed(3)}:d=${FADE},aresample=192000,alimiter=limit=0.70:level=false:attack=1:release=50,aresample=48000[mix]`,
];
const inputs = ["-i", edited, "-i", values.intro, "-i", values.outro];
const p1 = await $`ffmpeg -hide_banner -nostats ${inputs} -filter_complex ${g.join(";") + ";[mix]loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json[out]"} -map [out] -f null -`.nothrow().quiet();
const m = JSON.parse(p1.stderr.toString().match(/\{[^{}]*"input_i"[^{}]*\}/)![0]);
const ln = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const wav = `${outBase}.wav`, mp3 = `${outBase}.mp3`;
await $`ffmpeg -y -v error ${inputs} -filter_complex ${g.join(";") + `;[mix]${ln},aresample=192000,alimiter=limit=0.75:level=false:attack=1:release=50,aresample=${SR}[out]`} -map [out] -c:a pcm_s16le ${wav}`;
const meta = values.title ? ["-metadata", `title=${values.title}`, "-metadata", "artist=PostgresFM", "-metadata", "album=PostgresFM"] : [];
await $`ffmpeg -y -v error -i ${wav} -c:a libmp3lame -b:a 192k ${meta} -id3v2_version 3 ${mp3}`;

// Time map: the kept source pieces, sample-exact, shifted by the intro.
const rows: { audioStart: number; audioEnd: number; srcStart: number; srcEnd: number }[] = [];
let acc = 0;
for (const p of plan.audio as { a: number; b: number }[]) {
  const len = Math.min(p.b - p.a, talkLen - acc);
  if (len > 0) rows.push({ audioStart: +(C + acc).toFixed(3), audioEnd: +(C + acc + len).toFixed(3), srcStart: +p.a.toFixed(3), srcEnd: +(p.a + len).toFixed(3) });
  acc += p.b - p.a;
}
const map = {
  formula: "source = srcStart + (t - audioStart) inside a row; outside the rows there is only music",
  audio: { file: wav.split("/").pop(), rate: SR, channels: 2, total: +total.toFixed(3) },
  intro: { start: 0, talkStart: C }, talk: { start: C, end: +showEnd.toFixed(3), editedTrimEnd: talkLen }, outro: { bedStart: +bedStart.toFixed(3), end: +total.toFixed(3) },
  edited: { file: edited, cuts: cutsPath, note: "edited time = t - talk.start" },
  segments: rows,
};
await Bun.write(`${outBase}.time-map.json`, JSON.stringify(map, null, 1));
console.log(`wrote ${wav}, ${mp3}, ${outBase}.time-map.json: total ${total.toFixed(2)} s = intro ${C} + talk ${talkLen} + tail ${TAIL}`);
