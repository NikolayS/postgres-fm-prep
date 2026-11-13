// bun ctx.ts words.json from to : prints words with times, one line per ~10 s
const [f, a, b] = Bun.argv.slice(2);
const ws = (await Bun.file(f).json()).words.filter((w: any) => w.type === 'word' && w.start >= +a && w.start <= +b);
let line = '', t0 = -1, sp = '';
for (const w of ws) {
  if (t0 < 0 || w.start - t0 > 8 || w.speaker !== sp) { if (line) console.log(line); t0 = w.start; sp = w.speaker; line = `[${w.start.toFixed(2)} ${w.speaker.slice(-1)}]`; }
  line += ' ' + w.text;
}
console.log(line);
