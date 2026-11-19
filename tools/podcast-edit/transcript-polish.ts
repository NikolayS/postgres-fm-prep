// Clean-verbatim pass over a transcript.txt ("Name [hh:mm:ss]: text" blocks, blank line between).
// Mechanical only: fillers, stutters, term spelling (subtitle-fixes.json), punctuation tidy.
// Speakers, timestamps and turn order stay; a turn that becomes empty or a bare backchannel
// ("Yeah.", "Mm-hmm.") is dropped. Prints filler counts before and after to stderr.
// Usage: bun transcript-polish.ts <in.txt> <out.txt> [--fixes subtitle-fixes.json]
import { parseArgs } from "util";

const FILLER_RE = /\b(uh|um|ugh|oh|mm|hmm|you know)\b/gi;
export const countFillers = (s: string) => (s.match(FILLER_RE) ?? []).length;

const BACKCHANNEL = /^(yeah|yep|mm-hmm|mhm|uh-huh|right|okay|ok|sure|yes)[.!]?$/i;

export function cleanText(t: string, fixes: [string, string][]): string {
  let s = " " + t + " ";
  for (const [a, b] of fixes) s = s.split(a).join(b);
  // pure fillers
  s = s.replace(/[,\s]*\b(u+h+|u+m+|ugh+|o+gh|e+r+m*|hmm+|mm+(?:-hmm)?|ah+)\b[,.]?(?=\s)/gi, " ");
  // "oh" as a filler: at clause start followed by comma
  s = s.replace(/(^|[.?!,]\s+|\s)oh,\s+/gi, "$1");
  // filler "you know" / "I mean" set off by commas
  s = s.replace(/,?\s*\byou know\b,\s*/gi, " ");
  s = s.replace(/(^|[.?!]\s+)(?:you know|I mean|like),\s+/gi, "$1");
  s = s.replace(/,\s*(?:you know|I mean|like),\s*/gi, ", ");
  // stutters: "I, I", "the the", "it's, it's" (1-3 words repeated)
  for (let i = 0; i < 3; i++)
    s = s.replace(/\b((?:[\w']+\s+){0,2}[\w']+)(?:,?\s+|-\s*)\1\b/gi, (m, w) => w);
  // tidy
  s = s.replace(/\s+([,.?!])/g, "$1").replace(/,\s*,/g, ",").replace(/([.?!]),/g, "$1")
    .replace(/,([.?!])/g, "$1").replace(/\s{2,}/g, " ").trim();
  s = s.replace(/^[,.\s]+/, "");
  // capitalize sentence starts, but never identifiers such as pg_dump or postgres_fdw
  s = s.replace(/(^|[.?!]\s+)([a-z])(?![\w-]*_)(?!g_|gbench|groast|gcompact)/g, (m, p, c) => p + c.toUpperCase());
  return s;
}

export function polish(src: string, fixes: [string, string][]): string {
  const blocks = src.trim().split(/\n\s*\n/);
  const out: string[] = [];
  for (const b of blocks) {
    const m = b.match(/^([^\[\n]+) \[(\d\d:\d\d:\d\d)\]: ([\s\S]*)$/);
    if (!m) { const c = cleanText(b.replace(/\s*\n\s*/g, " "), fixes); if (c) out.push(c); continue; }
    const text = cleanText(m[3].replace(/\s*\n\s*/g, " "), fixes);
    if (!text || /^[.,?!\s]*$/.test(text)) continue;
    if (BACKCHANNEL.test(text) && out.length && !/\?$/.test(out[out.length - 1])) continue;
    out.push(`${m[1]} [${m[2]}]: ${text}`);
  }
  return out.join("\n\n") + "\n";
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({ args: Bun.argv.slice(2), allowPositionals: true, options: { fixes: { type: "string" } } });
  const [inp, outp] = positionals;
  if (!inp || !outp) throw new Error("usage: transcript-polish.ts <in> <out> [--fixes f.json]");
  const fixes: [string, string][] = values.fixes ? await Bun.file(values.fixes).json() : [];
  const src = await Bun.file(inp).text();
  const res = polish(src, fixes);
  await Bun.write(outp, res);
  console.error(`fillers before ${countFillers(src)} after ${countFillers(res)}; turns ${src.trim().split(/\n\s*\n/).length} -> ${res.trim().split(/\n\s*\n/).length}`);
}
