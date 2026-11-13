// Adds one typing sound per typed psql statement to 24-select-t1 in manifest-sfx.json
// (sfx-manifest.ts types only band cards). Run from the review folder after the card's bursts are written.
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { typedLines, typingName, trimTyping, LIB } from "/Users/nik/.claude/skills/podcast-edit/sfx-manifest.ts";
const D = "20-overlays", M = join(D, "manifest-sfx.json");
const m = JSON.parse(readFileSync(M, "utf8"));
const o = m.overlays.find((x: { id: string }) => x.id === "24-select-t1");
const bursts = JSON.parse(readFileSync(join(D, "24-select-t1-typing-bursts.json"), "utf8")).bursts;
const lines = typedLines(bursts);
for (const l of lines) { const f = join(D, "sfx", typingName(l.dur)); if (!existsSync(f)) await trimTyping(join(LIB, "U2-typing-fast.wav"), l.dur, f); }
o.sfx = [...o.sfx.filter((s: { file: string }) => !s.file.includes("typing-")), ...lines.map((l) => ({ file: `sfx/${typingName(l.dur)}`, at: Number(l.at.toFixed(3)), gain: 1 }))].sort((a, b) => a.at - b.at);
writeFileSync(M, JSON.stringify(m, null, 2));
console.log(JSON.stringify(o.sfx));
