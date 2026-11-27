// Episode 198: shift the edited-draft times in the notes to final times.
//   bun set_times.ts <cold-open seconds> [--card 13]
// notes/*.edited.* hold the times in the edited draft (00:00 = "Hello"). Writes:
//   notes/youtube-description.txt  video times  = edited + card + cold open (chapter list starts 00:00 Cold open)
//   notes/notes.md                 podcast times = edited + card (the podcast has no cold open, as episode 197)
// Re-run after any re-render; never edit the generated files by hand.
import { parseArgs } from "util";
import { join } from "path";
const { values, positionals } = parseArgs({ args: Bun.argv.slice(2), allowPositionals: true, options: { card: { type: "string", default: "13" } } });
const CO = Number(positionals[0]), CARD = Number(values.card);
if (!Number.isFinite(CO)) { console.error("usage: bun set_times.ts <cold-open seconds> [--card 13]"); process.exit(2); }
const N = join(import.meta.dir, "../../notes");
const fmt = (t: number) => { t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };
const shift = (txt: string, add: number) => txt.replace(/\b(\d\d):(\d\d)\b/g, (_, m, s) => fmt(Number(m) * 60 + Number(s) + add));
// YouTube: chapters "MM:SS title" and link times "(MM:SS)".
let yt = await Bun.file(join(N, "youtube-description.edited.txt")).text();
yt = yt.split("\n").map((l) => /^\d\d:\d\d /.test(l) || /\(\d\d:\d\d(, \d\d:\d\d)*\)/.test(l) ? shift(l, CARD + CO) : l).join("\n");
yt = yt.replace(/^(\d\d:\d\d|\d:\d\d:\d\d) /m, (x) => `00:00 Cold open\n${x}`);
await Bun.write(join(N, "youtube-description.txt"), yt);
// notes.md: "[MM:SS]" link times only.
const nt = (await Bun.file(join(N, "notes.edited.md")).text()).replace(/\[(\d\d:\d\d(?:, \d\d:\d\d)*)\]/g, (_, t) => `[${shift(t, CARD)}]`);
await Bun.write(join(N, "notes.md"), nt);
console.log(`video = edited + ${CARD + CO} s; podcast = edited + ${CARD} s`);
