// A/V sync check: final vs edited at mapped times (audio envelope and video motion xcorr).
//   bun av-sync.ts edited.mp4 final.mp4 final.time-map.json 20 300 1500   (PAD=5 widens the search)
import { $ } from "bun";
const [edited, final, mapPath] = Bun.argv.slice(2);
const map = await Bun.file(mapPath).json();
const toFinal = (t: number) => map.card + t + map.freezes.filter((f: any) => f.edited < t).reduce((a: number, f: any) => a + f.sec, 0);
async function env(f: string, t: number, d: number) {
  const pcm = new Float32Array(await $`ffmpeg -v error -ss ${t} -t ${d} -i ${f} -vn -ac 1 -ar 8000 -f f32le -`.arrayBuffer());
  const out: number[] = []; // 1 ms envelope
  for (let i = 0; i + 8 <= pcm.length; i += 8) { let s = 0; for (let j = i; j < i + 8; j++) s += Math.abs(pcm[j]); out.push(s); }
  return out;
}
async function motion(f: string, t: number, d: number, crop: string) {
  const W = 96, H = 64;
  const raw = new Uint8Array(await $`ffmpeg -v error -ss ${t} -t ${d} -i ${f} -vf crop=${crop},scale=${W}:${H} -f rawvideo -pix_fmt gray -`.arrayBuffer());
  const n = Math.floor(raw.length / (W * H)), out: number[] = [];
  for (let i = 1; i < n; i++) { let s = 0; for (let j = 0; j < W * H; j++) s += Math.abs(raw[i * W * H + j] - raw[(i - 1) * W * H + j]); out.push(s); }
  return out;
}
function bestLag(a: number[], b: number[], maxLag: number) { // b shifted vs a
  let best = 0, bestC = -Infinity;
  const ma = a.reduce((x, y) => x + y) / a.length, mb = b.reduce((x, y) => x + y) / b.length;
  for (let L = -maxLag; L <= maxLag; L++) {
    let c = 0;
    for (let i = 0; i < a.length; i++) { const j = i + L; if (j >= 0 && j < b.length) c += (a[i] - ma) * (b[j] - mb); }
    if (c > bestC) (bestC = c), (best = L);
  }
  return best;
}
for (const t of Bun.argv.slice(5).map(Number)) {
  const T = toFinal(t), pad = Number(process.env.PAD ?? 1), d = 12;
  const ea = await env(edited, t, d), fa = await env(final, T - pad, d + 2 * pad);
  const aLag = bestLag(ea, fa, 1000) - pad * 1000; // ms; 0 = audio exactly where the map says
  const ev = await motion(edited, t, d, "686:386:956:152"), fv = await motion(final, T - pad, d + 2 * pad, "924:594:24:110");
  const vLag = (bestLag(ev, fv, 25) - pad * 25) * 40; // ms
  console.log(`edited ${t}s -> final ${T.toFixed(2)}s: audio ${aLag} ms, video ${vLag} ms, A/V offset ${aLag - vLag} ms`);
}
