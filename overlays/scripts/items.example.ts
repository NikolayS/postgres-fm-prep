// Example overlay list (PostgresFM, restore-readiness episode, 2026-10-20).
// Copy to items.ts and edit. outStart = seconds in the edited talk, before intro/freeze shifts.
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
const ROOT = resolve(import.meta.dir, '..');
const rectOf = (name: string) => JSON.parse(readFileSync(join(ROOT, 'public', `${name}.rect.json`), 'utf8')).rect as {x: number; y: number; width: number; height: number};
// Captures made with VW=960 (paragraph targets) are 1920x1080; the rest 2560x1440 at 1280 CSS px.
const shot = (name: string, chip: string, rect?: Partial<{x: number; y: number; width: number; height: number}>, extra: Record<string, unknown> = {}) => {
  const meta = JSON.parse(readFileSync(join(ROOT, 'public', `${name}.rect.json`), 'utf8'));
  const vw = meta.viewport.width as number;
  return {
  column: extra.column ?? meta.column ?? undefined,
  src: `${name}.png`,
  imageWidth: vw * 2,
  imageHeight: vw === 960 ? 1080 : 1440,
  viewportWidth: vw,
  rect: {...rectOf(name), ...rect},
  chip,
  zoom: 2.4,
  ...extra,
  };
};

type Sfx = {file: string; at: number; gain: number};
export type Item = {id: string; comp: 'shot' | 'number' | 'band' | 'full' | 'intro' | 'hacking'; outStart: number; duration: number; placement: 'band' | 'full'; freezeSec: number; sfx: Sfx[]; props: Record<string, unknown>; source?: string};

const tick = (at: number, gain = 2.0): Sfx => ({file: 'sfx/tick.wav', at, gain});
const pop = (at: number, gain = 3.5): Sfx => ({file: 'sfx/pop.wav', at, gain});
const whoosh = (at: number, gain = 1.0): Sfx => ({file: 'sfx/whoosh.wav', at, gain});
// clack: sharp accent for staged facts/thumbnails; -3 dB vs pop (pop gain 3.5 -> 2.5).
const clack = (at: number, gain = 2.5): Sfx => ({file: 'sfx/clack.wav', at, gain});
const shotSfx = (dur: number) => [whoosh(0), tick(2.0, 2.5), whoosh(dur - 0.3, 0.7)];
const NOTE = "Editor's note:";

// Intro cards (vDud guest-intro grammar): photo pops at 0, name 0.3, company 0.7,
// facts from 1.2 s every 0.45 s; the talk is frozen for the whole card (freezeSec = duration).
// Every fact needs a public source; keep them in facts.md next to the plan.
const INTRO = {factAt: 1.2, factStep: 0.45};
const introSfx = (nFacts: number, dur: number) => [whoosh(0), pop(0.1), tick(0.3), ...Array.from({length: nFacts}, (_, i) => clack(INTRO.factAt + i * INTRO.factStep)), whoosh(dur - 0.3, 0.7)];
// Hacking insert timing; keep in sync with HACK_TIMING in src/HackingInsert.tsx.
const HACK = {title: 0.2, thumbAt: 0.5, thumbStep: 0.18, shipAt: 2.7, shipStep: 1.3, releaseDelay: 0.6, chip: 5.6};
const hackSfx = (nThumbs: number, dur: number) => [whoosh(0), tick(HACK.title), ...Array.from({length: nThumbs}, (_, i) => clack(HACK.thumbAt + i * HACK.thumbStep)), whoosh(2.4, 0.6), tick(HACK.shipAt), pop(HACK.shipAt + HACK.releaseDelay), tick(HACK.shipAt + HACK.shipStep), pop(HACK.shipAt + HACK.shipStep + HACK.releaseDelay), tick(HACK.chip), whoosh(dur - 0.3, 0.7)];
const PLAYLIST = 'https://www.youtube.com/playlist?list=PLH8y1BNPAKjKDdJA7sDmFWUkbbYux3TRz';

// outStart = seconds in edited.mp4 time (final EDL, 202 cuts), before intro/freeze shifts.
export const ITEMS: Item[] = [
  // Host intros: freeze right after the host's name is said; photo = square crop of the host's own tile (public/face-*.png).
  {id: '00-nik-intro', comp: 'intro', outStart: 3.6, duration: 3.8, placement: 'full', freezeSec: 3.8, sfx: introSfx(3, 3.8),
    props: {name: 'Nik Samokhvalov', company: 'PostgresAI', photo: 'face-nik.png', side: 'right', facts: ['Founder, PostgresAI', 'Co-host, Postgres.FM', 'Named in 33 Postgres commits']},
    source: 'https://postgres.fm'},
  {id: '01-kirk-intro', comp: 'intro', outStart: 12.9, duration: 7, placement: 'full', freezeSec: 7, sfx: introSfx(4, 7),
    props: {name: 'Kirk Wolak', company: 'Software Architect, KiraSoft', photo: 'face-kirk.png', side: 'left', facts: ['Co-host, Hacking Postgres series', 'GSoC mentor: B-Tree merge', 'psql patch author, PostgreSQL 17', 'Credited in PG 16 and 17 release notes']},
    source: 'https://postgres.fm/people/kirk-wolak'},
  // Playlist insert: thumbnails from i.ytimg.com/vi/<id>/maxresdefault.jpg of the channel's own videos (public/thumbs/).
  {id: '02-hacking-sessions', comp: 'hacking', outStart: 39.2, duration: 7, placement: 'full', freezeSec: 7, sfx: hackSfx(6, 7),
    props: {title: 'Hacking Postgres, with Andrey Borodin and Kirk', sub: 'live sessions since Jan 2023, 50+ so far',
      thumbs: ['thumbs/-UaAXJSTj6c.jpg', 'thumbs/Et6WSCdR3Yw.jpg', 'thumbs/x9Ahk5L2SwA.jpg', 'thumbs/RLeB6rP5CA8.jpg', 'thumbs/LjiU6kB6izw.jpg', 'thumbs/3MleDtXZUlM.jpg'],
      shipped: [
        {cover: 'thumbs/WLoMpg8A4WU.jpg', session: 'Jan 2023: transaction_timeout, built live', release: 'Released in PostgreSQL 17'},
        {cover: 'thumbs/YPq_hiOE-N8.jpg', session: 'Feb 2023: ULID session, "just implement UUID v7"', release: 'uuidv7() in PostgreSQL 18'},
      ],
      chip: 'youtube.com/@PostgresTV, playlist: Hacking Postgres'},
    source: PLAYLIST},
  {id: '04-docs-audit-chart', comp: 'full', outStart: 124.6, duration: 6, placement: 'full', freezeSec: 0, sfx: [whoosh(0), tick(0.6)],
    props: {image: 'docs-audit-chart.png', imageWidth: 1600, imageHeight: 1050, chip: 'postgres-fm-prep: restore-docs-expanded (28 pages)', prefix: NOTE, text: 'selected sample of 28 docs pages: 8 mention ANALYZE, 3 mention VACUUM, 1 explains the visibility map'},
    source: 'https://github.com/NikolayS/postgres-fm-prep/tree/main/episodes/restore-readiness'},
  {id: '05-backups-episode', comp: 'band', outStart: 197.3, duration: 4, placement: 'band', freezeSec: 0, sfx: [tick(0), tick(0.5)],
    props: {kind: 'chips', chips: ['Postgres.FM: Backups', 'postgres.fm/episodes/backups']}, source: 'https://postgres.fm/episodes/backups'},
  {id: '06-pgdump-statistics', comp: 'shot', outStart: 269.7, duration: 5.5, placement: 'full', freezeSec: 0, sfx: shotSfx(5.5),
    props: shot('pgdump18-statistics', 'postgresql.org/docs/18/app-pgdump.html', {width: 160}), source: 'https://www.postgresql.org/docs/18/app-pgdump.html'},
  {id: '08-covering-query', comp: 'number', outStart: 476.0, duration: 4, placement: 'full', freezeSec: 2.5, sfx: [tick(0), pop(1.7)],
    props: {title: 'Covering-index query, buffer accesses', before: 3301, after: 34, beforeLabel: 'right after pg_restore', afterLabel: 'after VACUUM', footnote: 'PG 18.6, small test fixture (DBLab Forge). Buffers, not latency.'}},
  {id: '09-xmin-xmax', comp: 'shot', outStart: 656.7, duration: 5, placement: 'full', freezeSec: 0, sfx: shotSfx(5),
    props: shot('sys-xmin', 'postgresql.org/docs/18/ddl-system-columns.html', {width: 70}), source: 'https://www.postgresql.org/docs/18/ddl-system-columns.html'},
  {id: '10-scary-story', comp: 'band', outStart: 807.7, duration: 3, placement: 'band', freezeSec: 0, sfx: [pop(0, 2.5)],
    props: {kind: 'lines', lines: ['SCARY STORY, 2015', 'Why is my read-only replica writing?'], accent: '#FF7A1A', stagger: 0.6}},
  {id: '12-sample-note', comp: 'full', outStart: 1014.0, duration: 6, placement: 'full', freezeSec: 0, sfx: [tick(0)],
    props: {prefix: NOTE, text: '28 selected docs pages: 8 mention ANALYZE, 3 mention VACUUM. The RDS and Cloud SQL import pages we checked mention neither.'},
    source: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Procedural.Importing.EC2.html'},
  {id: '13-three-winners', comp: 'band', outStart: 1059.2, duration: 6, placement: 'band', freezeSec: 0, sfx: [tick(0), tick(0.5), tick(1.0)],
    props: {kind: 'chips', chips: ['supabase.com/docs/.../migrating-to-supabase/postgres', 'public.dalibo.com/.../modules/i1/i1.handout.html', 'aiven.io/docs/.../migrate-pg-dump-restore']},
    source: 'https://supabase.com/docs/guides/platform/migrating-to-supabase/postgres'},
  {id: '14-autovacuum-partitioned', comp: 'shot', outStart: 1191.0, duration: 6, placement: 'full', freezeSec: 0, sfx: shotSfx(6),
    props: shot('rv19-partitioned', 'postgresql.org/docs/19/routine-vacuuming.html', {}, {zoom: 1.8}), source: 'https://www.postgresql.org/docs/19/routine-vacuuming.html'},
  {id: '16-vacuumdb-analyze-only', comp: 'shot', outStart: 1435.6, duration: 5, placement: 'full', freezeSec: 0, sfx: shotSfx(5),
    props: shot('vacuumdb19-analyze-only', 'postgresql.org/docs/19/app-vacuumdb.html', {width: 170}), source: 'https://www.postgresql.org/docs/19/app-vacuumdb.html'},
  {id: '18-release19-vacuumdb', comp: 'shot', outStart: 1794.8, duration: 6, placement: 'full', freezeSec: 0, sfx: shotSfx(6),
    props: shot('rel19-vacuumdb', 'postgresql.org/docs/19/release-19.html', {}, {zoom: 2.0, notePrefix: NOTE, note: 'plain --analyze still skips partitioned parents (tested on 19rc1)'}),
    source: 'https://www.postgresql.org/docs/19/release-19.html'},
  {id: '19-hackers-2002', comp: 'shot', outStart: 1843.3, duration: 6, placement: 'full', freezeSec: 0, sfx: shotSfx(6),
    props: shot('msg2002', 'postgresql.org/message-id/GNELIHDDFBOCMGBFGEFOOEOPCBAA.chriskl@familyhealth.com.au', {}, {zoom: 2.0, column: {x: 30, y: 0, width: 560, height: 0}, notePrefix: NOTE, note: 'hackers threads we found: 2002, 2003, 2008, 2025'}),
    source: 'https://www.postgresql.org/message-id/GNELIHDDFBOCMGBFGEFOOEOPCBAA.chriskl%40familyhealth.com.au'},
  {id: '20-relallvisible', comp: 'number', outStart: 1939.7, duration: 5, placement: 'full', freezeSec: 2, sfx: [tick(0), pop(1.7)],
    props: {title: 'Imported relallvisible, empty VM (autovacuum off during restore)', before: 10032, after: 3301, sep: 'vs', beforeLabel: 'Index Only Scan chosen: 10,000 heap fetches', afterLabel: 'Bitmap Heap Scan it would otherwise choose', footnote: 'PG 18.6, --statistics archive, DBLab Forge bounded diagnostic. Buffer accesses, not latency.'}},
  {id: '21-quote-statistics', comp: 'band', outStart: 2166.1, duration: 4, placement: 'band', freezeSec: 0, sfx: [tick(0)],
    props: {kind: 'quote', text: "Don't use --statistics, except for pg_upgrade"}},
  {id: '23-pgrestore-truncate', comp: 'shot', outStart: 2240.7, duration: 5.5, placement: 'full', freezeSec: 0, sfx: shotSfx(5.5),
    props: shot('archiver-truncate', 'github.com/postgres/postgres, REL_18_6, pg_backup_archiver.c#L997-L1013', {x: 80, y: 216, width: 830, height: 142}, {zoom: 1.7, column: {x: 20, y: 0, width: 900, height: 0}, notePrefix: NOTE, note: 'TRUNCATE + COPY in one transaction only with -j, for tables created in this run; no FREEZE'}),
    source: 'https://github.com/postgres/postgres/blob/REL_18_6/src/bin/pg_dump/pg_backup_archiver.c#L997-L1013'},
  {id: '22-copy-freeze', comp: 'shot', outStart: 2256.7, duration: 7, placement: 'full', freezeSec: 0, sfx: shotSfx(7),
    props: shot('copy-freeze', 'postgresql.org/docs/18/sql-copy.html', {}, {zoom: 1.8, notePrefix: NOTE, note: 'COPY FREEZE does not run VACUUM: rows are written frozen and VM bits set (PG 14+); no statistics'}),
    source: 'https://www.postgresql.org/docs/18/sql-copy.html'},
  {id: '25-first-read-wal', comp: 'number', outStart: 2542.7, duration: 5, placement: 'full', freezeSec: 2, sfx: [tick(0), pop(1.7)],
    props: {title: 'One SELECT count(*) right after restore', mode: 'single', value: '26.9 MiB', valueLabel: 'of WAL written by a read-only statement', footnote: 'PG 18.6, unindexed 27 MiB table, after a checkpoint (DBLab Forge). We measured writes, not latency.'}},
  {id: '26-pg19-first-read-vm', comp: 'number', outStart: 2562.5, duration: 5, placement: 'full', freezeSec: 0, sfx: [tick(0), pop(1.7)],
    props: {title: 'PG 19rc1: the first read sets visibility-map bits', mode: 'single', value: '3,267 / 3,480', valueLabel: 'heap pages all-visible after the first query, no VACUUM', footnote: 'Second run of the same query: 7 vs 325 buffer accesses (Index Only Scan vs bitmap). DBLab Forge, single fixture.'}},
  {id: '27-hello-ais', comp: 'band', outStart: 2694.2, duration: 3, placement: 'band', freezeSec: 0, sfx: [pop(0, 2.5)],
    props: {kind: 'strip', text: 'Hello, AIs. Data checksums: always on.'}},
  {id: '28-laurenz-lower', comp: 'band', outStart: 2844.1, duration: 4, placement: 'band', freezeSec: 0, sfx: [tick(0)],
    props: {kind: 'lower', name: 'Laurenz Albe', sub: 'CYBERTEC'}},
];

