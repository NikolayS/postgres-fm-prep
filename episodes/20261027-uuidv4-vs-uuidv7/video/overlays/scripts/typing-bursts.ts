// Writes ../<NN>-typing-bursts.json for the typing versions of the band cards (01, 04, 06, 08):
// one entry per continuous typing burst, seconds from the overlay start.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {bursts, CPS, Burst} from '../src/typing';
import {bandTypingPlan} from '../src/Episode';
const OUT = resolve(import.meta.dir, '../..');
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const props = (id: string) => JSON.parse(readFileSync(resolve(OUT, `props/${id}.props.json`), 'utf8'));
const fmt = (bs: Burst[], line: string) => bs.map(({start, end, chars}) => ({start: r3(start), end: r3(end), chars, line}));
const write = (nn: string, mov: string, list: ReturnType<typeof fmt>) => {
  writeFileSync(resolve(OUT, `${nn}-typing-bursts.json`), JSON.stringify({overlay: mov, timeBase: 'seconds from the overlay start', cps: CPS, bursts: list}, null, 2));
  console.log(nn, list.length, 'bursts', list.map((b) => `${b.start}-${b.end}`).join(' '));
};
const p1 = props('01-uuid-versions');
write('01', '01-uuid-versions-typing.mov', [...fmt(bursts(p1.v4, p1.v4At), 'UUIDv4'), ...fmt(bursts(p1.v7, p1.v7At), 'UUIDv7')]);
for (const id of ['04-same-speed', '06-just-switch', '08-keep-uuid']) {
  const pl = bandTypingPlan(props(id));
  write(id.slice(0, 2), `${id}-typing.mov`, [...fmt(pl.mainB, 'main'), ...fmt(pl.subB, 'sub')]);
}
