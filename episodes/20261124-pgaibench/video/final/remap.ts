// Episode 198: move the MM:SS times in notes/*.edited.* from one edit to another, through source time.
//   bun remap.ts <old.cuts.json> <new.cuts.json>      (rewrites notes/notes.edited.md and notes/youtube-description.edited.txt)
// A time that falls in a region the new edit cuts moves to the next kept moment.
import { join } from "path";
type Seg = { srcStart: number; srcEnd: number; outStart: number; outEnd: number };
const [oldP, newP] = Bun.argv.slice(2);
const O: Seg[] = (await Bun.file(oldP).json()).segmentTimes, N: Seg[] = (await Bun.file(newP).json()).segmentTimes;
const toSrc = (t: number) => { const s = O.find((x) => t >= x.outStart && t < x.outEnd) ?? O[O.length - 1]; return s.srcStart + (t - s.outStart); };
const toNew = (s: number) => { const x = N.find((r) => s >= r.srcStart && s <= r.srcEnd); if (x) return x.outStart + s - x.srcStart; const nx = N.find((r) => r.srcStart > s); return nx ? nx.outStart : N[N.length - 1].outEnd; };
const fmt = (t: number) => { t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };
const NOTES = join(import.meta.dir, "../../notes");
for (const f of ["notes.edited.md", "youtube-description.edited.txt"]) {
  const p = join(NOTES, f); let n = 0;
  // +0.5 s: the stored times are floored; map the middle of the second.
  const out = (await Bun.file(p).text()).replace(/(?<![\d:])(\d\d):(\d\d)(?![\d:])/g, (_, m, s) => { n++; return fmt(toNew(toSrc(Number(m) * 60 + Number(s) + 0.5))); });
  await Bun.write(p, out); console.log(`${f}: ${n} times remapped`);
}
