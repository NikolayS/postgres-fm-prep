// Verify every overlay of manifest-v3.json on its anchor words: find the first quoted phrase of `words`
// (with its v2 time) in the source transcript, map it to v3 with find.ts, and compare the offset from the
// overlay start with the v2 offset. Writes verify-v3.tsv next to the manifest.
import {readFileSync, writeFileSync} from 'node:fs';
const R = '/Users/nik/Documents/Zoom/2026-11-24 10.37.15 .fm recording/review';
const M = `${R}/overlays/out-v2`;
const v2 = JSON.parse(readFileSync(`${M}/manifest-v2.json`, 'utf8')).overlays;
const TAG = process.env.TAG ?? 'v3';
const NEWCUTS = process.env.CUTS ?? `${R}/pgfm198-edited.cuts.json`;
const v3 = JSON.parse(readFileSync(`${M}/manifest-${TAG}.json`, 'utf8')).overlays;
const FIND = '/Users/nik/github/postgres-fm-prep/tools/podcast-edit/find.ts';
const rows: string[] = [`id\t${TAG}_start\tanchor_words\tfound_${TAG}\tdelta_s\tok`];
let bad = 0;
for (const o of v3) {
  const p = v2.find((x: any) => x.id === o.id);
  const src = (p ?? o).words as string;
  const m = /"([^"]+)"\s*\((\d+(?:\.\d+)?)/.exec(src);
  // a fragment made only for this cut: its words carry this cut's times; check them directly
  if (m && !p) {
    const ph = m[1].replace(/\.\.\./g, ' ').replace(/[“”…]/g, '').trim();
    const hs = [...Bun.spawnSync(['bun', FIND, `${R}/work/src.words.json`, ph, '--cuts', NEWCUTS]).stdout.toString().matchAll(/edited [\d:.]+ \((\d+\.\d+)\)/g)].map((h) => +h[1]).sort((x, y) => Math.abs(x - +m[2]) - Math.abs(y - +m[2]));
    const d = hs.length ? Math.round((hs[0] - +m[2]) * 100) / 100 : NaN;
    const ok = Math.abs(d) <= 0.4;
    rows.push(`${o.id}\t${o.outStart}\t${ph}\t${hs[0] ?? 'not found'}\t${d}\t${ok ? 'ok' : 'FAIL'}`); if (!ok) bad++; continue;
  }
  if (!m || !p) { rows.push(`${o.id}\t${o.outStart}\t${m?.[1] ?? '-'}\t-\t-\tno anchor`); bad++; continue; }
  const phrase = m[1].replace(/\.\.\./g, ' ').replace(/[“”…]/g, '').trim(), t2 = +m[2];
  // the v2 offset of the words from the overlay start, measured with find.ts on the v2 cut
  const at = (cuts: string) => [...Bun.spawnSync(['bun', FIND, `${R}/work/src.words.json`, phrase, '--cuts', cuts]).stdout.toString().matchAll(/edited [\d:.]+ \((\d+\.\d+)\)/g)].map((h) => +h[1]);
  const h2 = at(`${R}/v2-edit/pgfm198-edited.cuts.json`).sort((a, b) => Math.abs(a - p.outStart - 1) - Math.abs(b - p.outStart - 1))[0];
  if (h2 === undefined) { rows.push(`${o.id}\t${o.outStart}\t${phrase}\tnot found on v2\t-\tFAIL`); bad++; continue; }
  const off = h2 - p.outStart;
  void t2;
  const hits = at(NEWCUTS);
  const want = o.outStart + off;
  const best = hits.sort((a, b) => Math.abs(a - want) - Math.abs(b - want))[0];
  if (best === undefined) { rows.push(`${o.id}\t${o.outStart}\t${phrase}\tnot found\t-\tFAIL`); bad++; continue; }
  const d = Math.round((best - want) * 100) / 100;
  const ok = Math.abs(d) <= 0.4;
  if (!ok) bad++;
  rows.push(`${o.id}\t${o.outStart}\t${phrase}\t${best}\t${d}\t${ok ? 'ok' : 'FAIL'}`);
}
writeFileSync(`${M}/verify-${TAG}.tsv`, rows.join('\n') + '\n');
console.log(rows.join('\n'));
console.log(`${v3.length} rows, ${bad} not ok`);
