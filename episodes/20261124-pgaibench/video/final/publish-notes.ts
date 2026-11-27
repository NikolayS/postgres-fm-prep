// Episode 198: the paste-ready show notes from notes/notes.md (podcast times). Drops the working
// parts (draft header, the times note, link count, link check, open items) and says that the
// times in brackets are podcast times. Usage: bun publish-notes.ts <notes.md> <out.md>
const [inp, out] = Bun.argv.slice(2);
if (!out) { console.error("usage: bun publish-notes.ts <notes.md> <out.md>"); process.exit(2); }
const src = await Bun.file(inp).text();
const title = src.split("\n")[0];
const a = src.indexOf("## Episode description"), b = src.indexOf("## Link check");
if (a < 0 || b < 0) throw new Error("notes.md: missing '## Episode description' or '## Link check'");
let body = src.slice(a, b).split("\n").filter((l) => !/^\d+ links\. All opened/.test(l)).join("\n");
body = body.replace("Here are some links to things they mentioned:", "Here are some links to things they mentioned (times in brackets are podcast times):");
const res = `${title}\n\n${body.trimEnd()}\n`;
for (const bad of ["DRAFT", "number to confirm", "notes.edited.md", "set_times", "Open items"]) if (res.includes(bad)) throw new Error(`publish text still has "${bad}"`);
await Bun.write(out, res);
console.log(`${out}: ${res.split("\n").length} lines, ${(res.match(/https?:\/\//g) ?? []).length} URLs`);
