// Episode 198 dynamic cold opens, step 3: sound and final file.
// Voices: each line's speech (L<i>.src.mov) at its start frame, leveled together to -16 LUFS.
// Music: the ep 197 funk cue (128 BPM) from 0 s up to the button, then its closing brass hit (cue 43.125 s)
// spliced in on the button beat. Level: 0.18 under speech (-15 dB), 0.4 in the gaps between lines,
// full on the button. SFX: spec.ts, each file peak-normalized to -6 dBFS, then its gain.
// Master: -16 LUFS integrated, limiter. Muxes the Remotion picture (rem/out/<variant>.mp4).
//   bun ../../../../20261117-postgres-19/video/coldopen-v8/fx.ts <work dir>/fx   (once: whoosh, slam, impact, glitch)
//   bun mix.ts <work dir> <music wav> <variant> <out.mp4>
import { $ } from "bun";
import { BTN, END, FPS, S, SFX, SPEECH, type Variant } from "./spec";

const [W, MUSIC, V, OUT] = Bun.argv.slice(2) as [string, string, Variant, string];
const SFXLIB = new URL("../../../../../tools/podcast-edit/sfx/", import.meta.url).pathname;
const FILES: Record<string, string> = {
  G10: SFXLIB + "G10-soft-start-quick-stop.wav", K: SFXLIB + "K-sand-stroke-falling.wav", L: SFXLIB + "L-punch-rough.wav",
  whoosh: `${W}/fx/whoosh.wav`, slam: `${W}/fx/slam.wav`, impact: `${W}/fx/impact.wav`, glitch: `${W}/fx/glitch.wav`,
  down: `${W}/fx/down.wav`, up: `${W}/fx/up.wav`,
};
const T = (f: number) => (f / FPS).toFixed(3), dur = END / FPS;

// power-down / power-up sweeps (200-600 Hz body so phones play them; nothing bright)
await $`ffmpeg -v error -y -f lavfi -i ${"aevalsrc='0.8*sin(2*PI*600*(1-exp(-5*t))/5)*exp(-3*t)*min(1,t/0.01)|0.8*sin(2*PI*600*(1-exp(-5*t))/5)*exp(-3*t)*min(1,t/0.01)':s=48000:d=0.4"} -af lowpass=f=2500,afade=t=out:st=0.3:d=0.1 ${FILES.down}`;
await $`ffmpeg -v error -y -f lavfi -i ${"aevalsrc='0.8*sin(2*PI*160*(exp(5*t)-1)/5)*min(1,t/0.03)|0.8*sin(2*PI*160*(exp(5*t)-1)/5)*min(1,t/0.03)':s=48000:d=0.28"} -af lowpass=f=2500,afade=t=out:st=0.22:d=0.06 ${FILES.up}`;

const lufs = async (args: string[]) => {
  const r = await $`ffmpeg -hide_banner ${args} -af ebur128 -f null -`.quiet().nothrow();
  const m = [...r.stderr.toString().matchAll(/I:\s+(-?[\d.]+) LUFS/g)]; return Number(m.at(-1)![1]);
};
const peak = async (f: string) => Number((await $`ffmpeg -hide_banner -i ${f} -af volumedetect -f null -`.quiet().nothrow()).stderr.toString().match(/max_volume: (-?[\d.]+) dB/)![1]);

// 1) voices on the timeline
const vin: string[] = []; let fc = "";
S.forEach((s, i) => { vin.push("-i", `${W}/lines/L${i + 1}.src.mov`); fc += `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(s / FPS * 1000)}:all=1[v${i}];`; });
fc += `${S.map((_, i) => `[v${i}]`).join("")}amix=inputs=${S.length}:normalize=0,apad=whole_dur=${dur}[a]`;
await $`ffmpeg -v error -y ${vin} -filter_complex ${fc} -map [a] -t ${dur} -c:a pcm_s24le ${W}/mix-${V}-voice.wav`;
const vI = await lufs(["-i", `${W}/mix-${V}-voice.wav`]);

// 2) music: 0..button, then the closing hit; envelope
const btn = BTN / FPS;
const mI = await lufs(["-t", "23", "-i", MUSIC]);
const trap = S.map((s, i) => { const a = s / FPS, b = (s + SPEECH[i]) / FPS; return `clip((t-${(a - 0.08).toFixed(3)})/0.08,0,1)*clip((${(b + 0.1).toFixed(3)}-t)/0.1,0,1)`; }).join("+");
const env = `(0.4-0.22*(${trap}))+0.6*clip((t-${(btn - 0.12).toFixed(3)})/0.1,0,1)`;
fc = `[0:a]atrim=0:${btn},asetpts=PTS-STARTPTS,aresample=48000,afade=t=out:st=${(btn - 0.03).toFixed(3)}:d=0.03[m1];` +
  `[1:a]atrim=43.125,asetpts=PTS-STARTPTS,aresample=48000,adelay=${Math.round(btn * 1000)}:all=1[m2];` +
  `[m1][m2]amix=inputs=2:normalize=0,volume=${(-16 - mI).toFixed(2)}dB,volume='${env}':eval=frame,afade=t=out:st=${(dur - 0.12).toFixed(3)}:d=0.12[m]`;
await $`ffmpeg -v error -y -i ${MUSIC} -i ${MUSIC} -filter_complex ${fc} -map [m] -t ${dur} -c:a pcm_s24le ${W}/mix-${V}-music.wav`;

// 3) sfx
const ev = SFX[V]; const sin: string[] = []; fc = "";
for (const [k, [f, key, g]] of ev.entries()) {
  const p = await peak(FILES[key]); sin.push("-i", FILES[key]);
  fc += `[${k}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${(-6 - p + g).toFixed(2)}dB,adelay=${Math.round(f / FPS * 1000)}:all=1[s${k}];`;
}
fc += `${ev.map((_, k) => `[s${k}]`).join("")}amix=inputs=${ev.length}:normalize=0,apad=whole_dur=${dur}[s]`;
await $`ffmpeg -v error -y ${sin} -filter_complex ${fc} -map [s] -t ${dur} -c:a pcm_s24le ${W}/mix-${V}-sfx.wav`;

// 4) master: voices to -16 first (bed and SFX are relative to them), sum, -16 LUFS, limiter
const mixOnce = async (gain: number, out: string) => {
  const f = `[0:a]volume=${(-16 - vI).toFixed(2)}dB[v];[v][1:a][2:a]amix=inputs=3:normalize=0,afade=t=in:d=0.03,volume=${gain.toFixed(2)}dB,alimiter=limit=0.85:level=false[a]`;
  await $`ffmpeg -v error -y -i ${W}/mix-${V}-voice.wav -i ${W}/mix-${V}-music.wav -i ${W}/mix-${V}-sfx.wav -filter_complex ${f} -map [a] -t ${dur} -c:a pcm_s24le ${out}`;
  return lufs(["-i", out]);
};
let g = 0, I = await mixOnce(g, `${W}/mix-${V}.wav`);
for (let k = 0; k < 3 && Math.abs(I + 16) > 0.2; k++) { g += -16 - I; I = await mixOnce(g, `${W}/mix-${V}.wav`); }

await $`ffmpeg -v error -y -i ${W}/rem/out/${V}.mp4 -i ${W}/mix-${V}.wav -map 0:v -map 1:a -t ${dur} -c:v libx264 -profile:v high -pix_fmt yuv420p -r 25 -crf 17 -preset medium -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart ${OUT}`;
console.log(`${OUT}: ${dur} s, voices ${vI.toFixed(1)} -> -16, master ${I.toFixed(2)} LUFS (gain ${g.toFixed(2)} dB)`);
