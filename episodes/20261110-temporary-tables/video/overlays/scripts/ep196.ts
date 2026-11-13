// Overlays for "The hidden costs of CREATE TEMP TABLE" (#196, recording 2026-11-10). Every item is
// anchored to SOURCE word times (src.words.json, checked with tools/podcast-edit/find.ts); start,
// duration and every reveal time are mapped to edited seconds through the cuts file. Same pipeline as
// episode 195 (scripts/ep195.ts there).
//   bun scripts/ep196.ts <cuts.json> [--render] [--stills] [id ...]
// Writes ../manifest.json (compose.ts format, freezeSec 0), ../<id>.mov (center) or
// ../<id>-typing.mov + ../<id>-typing-bursts.json (band), ../props/<id>.props.json.
// Props: every number under a key named at, at10, at60, noteAt (or an array under "at") is a SOURCE
// time and is converted to seconds from the overlay start. Screenshot rects come from
// public/ep196/<name>.rect.json (scripts/shot.ts), never estimated.
import {mkdirSync, readFileSync, writeFileSync, existsSync, renameSync, unlinkSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {band196Plan, psqlPlan, K} from '../src/Ep196v2';

type Seg = {srcStart: number; srcEnd: number; outStart: number; outEnd: number};
const toEdited = (segs: Seg[], t: number) => {
  for (const s of segs) {
    if (t < s.srcStart) return s.outStart;
    if (t <= s.srcEnd) return s.outStart + (t - s.srcStart);
  }
  return segs[segs.length - 1].outEnd;
};
const ROOT = resolve(import.meta.dir, '..');
const OUT = resolve(ROOT, '../../../20-overlays');
const BRIEF = 'https://console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d';
const BRIEF_CHIP = 'console.postgres.ai/shared/brief/dfe99713-f5a8-483b-9aab-1606a883b75d';

type R = {x: number; y: number; w: number; h: number};
const cap = (name: string) => JSON.parse(readFileSync(join(ROOT, 'public/ep196', `${name}.rect.json`), 'utf8')) as {clip: {width: number; height: number}; highlights: {text: string; rects: R[]}[]};
const shot = (name: string, at: number, url: string, extra: Record<string, unknown> = {}) => {
  const c = cap(name);
  return {src: `ep196/${name}.png`, w: c.clip.width, h: c.clip.height, at, url, ...extra};
};
const rects = (name: string, text: string) => {
  const h = cap(name).highlights.find((x) => x.text === text);
  if (!h || !h.rects.length) throw new Error(`no rect for "${text}" in ${name}`);
  return h.rects;
};

type Item = {id: string; comp: string; placement: 'band' | 'center'; srcStart: number; srcEnd: number; editDur?: number; words: string; props: Record<string, unknown>; accents?: number[]; source: string | null; still: number};
// Band lines: marker (yellow) only for the takeaway and spoken quotes; facts and credits on dark strips.
const curly = (x: string) => x.replace(/'/g, '’');
const quote = (text: string, chip?: string) => ({lines: [{style: 'marker', segs: [{text: `“${curly(text)}”`}]}, ...(chip ? [{style: 'chip', segs: [{text: chip}]}] : [])]});
const fact = (text: string, chip?: string) => ({lines: [{style: 'dark', segs: [{text}]}, ...(chip ? [{style: 'chip', segs: [{text: chip}]}] : [])]});
const TAKEAWAY = {lines: [{style: 'marker', segs: [{text: 'Don’t use temp tables.'}]}]};
const DOCS_CT = 'https://www.postgresql.org/docs/current/sql-createtable.html';
const GH = 'https://github.com/postgres/postgres/blob/3d342deeb433060dbea02fdd276656a5563275d5/src/backend/storage/ipc/sinvaladt.c';
const ROWS = (at: number[]) => [
  {tag: '0', text: 'Primary only', at: at[0]},
  {tag: '1', text: 'Invisible to other sessions', at: at[1]},
  {tag: '2A', text: 'Dead tuples', at: at[2]},
  {tag: '2B', text: 'Catalog bloat', at: at[3]},
];
const SLOT3 = 'Catalog invalidation: the sinval queue';
const sinval = rects('gh-sinval-full', 'css=#LC123')[0], n4096 = rects('gh-sinval-full', '4096')[0];

export const ITEMS: Item[] = [
  {id: '01-michael', comp: 'shot196', placement: 'center', srcStart: 44.5, srcEnd: 52.0, editDur: 9,
    words: 'Nik: "there should be a sound right now, and you should see" (44.62) ... "this tweet from Michael" (47.84-49.86)',
    // MICHAEL=short: the crop that ends after "taking a few months off" (no product line, no date).
    props: {shots: [process.env.MICHAEL === 'short'
      ? shot('x-michael-short', 44.5, 'x.com/michristofides/status/2117283823314674021', {hl: [{rects: rects('x-michael-short', 'taking a few months off'), at: 47.0}]})
      : shot('x-michael', 44.5, 'x.com/michristofides/status/2117283823314674021', {hl: [{rects: rects('x-michael', 'taking a few months off'), at: 47.0}]})]},
    source: 'https://x.com/michristofides/status/2117283823314674021 (2026-11-02 15:52 UTC; official embed, logged out, 2x, time in UTC; the avatar is his real profile image on X, a plain green picture). Same text on Bluesky: https://bsky.app/profile/michristofides.com/post/3mzdomwp3jk27', still: 49},
  {id: '02-temp-docs', comp: 'shot196', placement: 'center', srcStart: 114.6, srcEnd: 146.2,
    words: 'Kirk: "Oracle has global temporary tables" (116.30-118.00) ... "we\'re gonna have to create these temporary tables" (142.60) "all the time, and this adds overhead" (144.38-146.14)',
    props: {shots: [shot('doc-compat', 114.6, 'postgresql.org/docs/current/sql-createtable.html', {hl: [{rects: rects('doc-compat', 'temporary tables are defined just once and automatically exist'), at: 118.0}, {rects: rects('doc-compat', 'instead requires each session to issue its own'), at: 142.6}]})]},
    source: `${DOCS_CT} (PG18 docs, Compatibility, Temporary Tables)`, still: 144},
  {id: '03-fall-off', comp: 'band196', placement: 'band', srcStart: 241.2, srcEnd: 246.2,
    words: 'Kirk: "You fall off of them" (241.82-242.64) "unexpectedly trip and fall" (243.76-245.54)',
    props: quote('You fall off of them.'), source: 'on air (Kirk)', still: 245},
  {id: '04-autovacuum', comp: 'band196', placement: 'band', srcStart: 303.3, srcEnd: 310.8,
    words: 'Nik: "Autovacuum doesn\'t care about your poor temporary tables" (304.12-307.0)',
    props: quote("Autovacuum doesn't care about your poor temporary tables.", 'Docs, CREATE TABLE: autovacuum cannot vacuum or analyze temporary tables'),
    source: `on air (Nik); ${DOCS_CT} (TEMPORARY: "The autovacuum daemon cannot access and therefore cannot vacuum or analyze temporary tables.")`, still: 309},
  {id: '05-uuid-episode', comp: 'band196', placement: 'band', srcStart: 397.9, srcEnd: 409.9,
    words: 'Kirk: "Integer, uh, eight versus UUID version four and version seven" (398.14-400.22)',
    props: fact('Postgres.FM 194: UUIDv4 vs UUIDv7', 'postgres.fm/episodes/uuidv4-vs-uuidv7'),
    source: 'https://postgres.fm/episodes/uuidv4-vs-uuidv7 (200 on 2026-11-10)', still: 405},
  {id: '06-takeaway', comp: 'band196', placement: 'band', srcStart: 478.9, srcEnd: 484.4,
    words: 'Nik: "don\'t use temporary tables" (479.50-481.26)', props: TAKEAWAY, source: 'on air (Nik), the episode takeaway (1 of 3)', still: 482},
  {id: '07-8x-machine', comp: 'band196', placement: 'band', srcStart: 641.0, srcEnd: 647.0,
    words: 'Kirk: "the client bought 8X the machine" (641.74-643.24)', props: quote('The client bought 8x the machine.'), source: 'on air (Kirk)', still: 645},
  {id: '08-layers', comp: 'layers2', placement: 'center', srcStart: 754.4, srcEnd: 810.0,
    words: 'Nik: "problems number zero" (756.06) "Problem number one" (763.12) "2A is the bloat itself" (779.56) "problem 2B is a catalog bloat" (800.92) ... card exits 810.0 (13:30)',
    props: {rows: ROWS([756.06, 763.12, 779.56, 800.92]), slot3: {tag: '3', text: SLOT3},
      measured: {text: 'Measured: pg_attribute +737 to 839 MiB in ~70 s', sub: '128 clients, temp table per transaction; under 1.5 MiB with a reused temp table. Synthetic workload.', at: 802.6}},
    source: `the layers as listed on air (Nik); 2B measurement from ${BRIEF} § 5 ("churn at 128 clients grows pg_attribute by 737 to 839 MiB ... in about 70 s ... reuse_* arms grow it by less than 1.5 MiB")`.concat('; 2A "dead tuples" as Nik says on air ("it\'s not bloat, it\'s dead tuples")'), still: 808},
  {id: '09-kirk-60m', comp: 'band196', placement: 'band', srcStart: 875.9, srcEnd: 892.0,
    words: 'Kirk: "So what was 10 million a day" (876.18) "quickly became 60 million" (879.12-881.02) "updates to PG catalog a day" (881.56-883.82) ... "for no good reason" (890.58)',
    props: {lines: [{style: 'dark', segs: [{text: '10M queries/day', at: 876.6}, {text: '  →  60M pg_catalog changes/day', at: 879.9}]}, {style: 'chip', segs: [{text: "Kirk's system: 2 temp tables + 1 index, created and dropped", at: 883.0}]}]},
    source: 'on air (Kirk), his production system; not measured by us', still: 888},
  {id: '10-robot-tag', comp: 'band196', placement: 'band', srcStart: 907.9, srcEnd: 914.4,
    words: 'Nik: "told him not to speak unless directly addressed" (908.84-911.34)',
    props: {arrow: true, lines: [{style: 'marker', segs: [{text: '“not to speak unless directly addressed”'}]}]}, source: 'on air (Nik), about the meeting bot in the robot tile', still: 912},
  {id: '11-layer3', comp: 'layers2', placement: 'center', srcStart: 953.5, srcEnd: 1008.0,
    words: 'Nik: "And finally, layer number three" (956.46) ... "lightweight lock, S and Val write" (984.86) "S and Val read" (987.24) "snapshot invalidation, catalog snapshot invalidation" (989-993.5) ... "refresh their understanding of catalog" (1005.12-1008.0)',
    props: {rows: ROWS([953.5, 953.5, 953.5, 953.5]), slot3: {tag: '3', text: SLOT3, fillAt: 956.46}, dimAt: 956.46,
      waits: {names: [{text: 'LWLock:SInvalWrite', at: 984.9}, {text: 'LWLock:SInvalRead', at: 987.3}], note: 'sinval = shared invalidation · postgresql.org/docs/current/monitoring-stats.html', noteAt: 992.0}},
    accents: [956.46], source: 'layer 3 as said on air; wait event names from https://www.postgresql.org/docs/current/monitoring-stats.html (LWLock: SInvalWrite, SInvalRead). On air Nik says "catalog snapshot invalidation" (whisper check of 16:22-16:36); the card says shared invalidation, the meaning of sinval in the source.', still: 1000},
  {id: '12-local-global', comp: 'band196', placement: 'band', srcStart: 1070.0, srcEnd: 1076.6,
    words: 'Nik: "Data is, is local" (1070.30-1071.90) "A catalog is, is global" (1072.26-1073.96)', props: {lines: [{style: 'marker', segs: [{text: '“Data is local.', at: 1070.3}, {text: ' A catalog is global.”', at: 1072.3}]}]}, source: 'on air (Nik)', still: 1075},
  {id: '14-maxnummessages', comp: 'shot196', placement: 'center', srcStart: 1129.0, srcEnd: 1142.0,
    words: 'Nik: "this signal goes to this queue, invalidation" (1129.73-1132.33) "queue, which is, uh, 4,096" (1134.89) "hard-coded constant" (1137.73-1138.79) ... exit 1142.0 (19:02)',
    // A: the file (comment block and #defines) as on GitHub; B at "invalidation queue": the same 4x capture,
    // lines 102-103 and 123 only (104-122 elided), so the comment and the #define read together at ~32 px;
    // red box on 4096 at "4,096"; push into "MAXNUMMESSAGES 4096" on "hard-coded constant". Rects from DOM.
    props: {shots: [
      shot('gh-sinval-full', 1129.0, 'github.com/postgres/postgres/blob/3d342deeb4/src/backend/storage/ipc/sinvaladt.c#L123'),
      shot('gh-sinval-elided', 1131.3, 'github.com/postgres/postgres/blob/3d342deeb4/src/backend/storage/ipc/sinvaladt.c#L123', {
        hl: [{rects: rects('gh-sinval-elided', '4096'), at: 1134.9, kind: 'box'}],
        zooms: [{rect: rects('gh-sinval-elided', 'define-line')[0], at: 1137.7, scale: 2.6}]})]},
    accents: [1134.9], source: `${GH}#L123 (master on 2026-11-10; line 102: "MAXNUMMESSAGES: max number of shared-inval messages we can buffer.", line 123: #define MAXNUMMESSAGES 4096; capture at 4x so the push-in stays sharp)`, still: 1140.5},
  {id: '15-lockmanager', comp: 'band196', placement: 'band', srcStart: 1173.2, srcEnd: 1209.5,
    words: 'Nik: "first you will start seeing lightweight lock lock manager" (1173.39) ... "max locks per transaction" (1199.91) ... "this lightweight lock goes away" (1207.85-1209.29)',
    props: {lines: [{style: 'dark', segs: [{text: 'Over 16 relations per transaction: LWLock:LockManager', at: 1173.6}]}, {style: 'chip', segs: [{text: 'PG18: raise max_locks_per_transaction', at: 1200.0}]}]},
    source: 'commit c4d5cb71d229095a39fda1121a75ee40e6069a2a (Tomas Vondra, PG18): 16 fast-path locks since 9.2; arrays "sized on startup based on max_locks_per_transaction"; https://github.com/postgres/postgres/commit/c4d5cb71d229095a39fda1121a75ee40e6069a2a', still: 1205},
  {id: '16-cpu', comp: 'ashts196', placement: 'center', srcStart: 1217.5, srcEnd: 1240.0,
    words: 'Nik: "usually a CPU is low" (1221.19-1223.39) "and disk IO is low" (1224.37-1225.39) ... "this, uh, invalidation queue" (1237.73-1239.77)',
    // Two plain ASH time series (Fig. 6.2a 0 idle, 6.2b 5,000 idle; forge's 1 s bins, src/ash62.json), same scales; 6.2b gaps hatched. Labels = the brief's text shares.
    props: {top: {at: 1217.9, label: {text: '95% CPU', at: 1219.1}}, bottom: {at: 1219.5, label: {text: '88% LWLock', at: 1221.2}}},
    source: `${BRIEF} (§ 5 "CPU or disk IO?": at 5,000 idle, LWLock 88.1 percent of active-session samples (SInvalWrite 84.7), CPU 11.7, IO 0.13; at 0 idle CPU 95.0) — share of sampled active-session time, pg_wait_sampling`, still: 1235},
  {id: '17-cliff', comp: 'cliff196', placement: 'center', srcStart: 1296.4, srcEnd: 1341.0,
    words: 'Nik: "lightweight lock S in wal write contention" (1303.85-1306.63) "as you can see from the graphs" (1307.27) ... "lie down there on the bottom" (1331.23-1333.13) ... "first urgent emergency help" (1344.15)',
    props: {pts: [{x: 0, y: 502, label: '502'}, {x: 1000, y: 502, label: '502'}, {x: 3000, y: 274, label: '274'}, {x: 5000, y: 127, label: '127'}],
      drawAt: [1297.0, 1305.8, 1307.3], waitRow: {values: ['1.3%', '54%', '86%', '91%'], at: 1315.0, label: 'SInvalWrite'},
      dot: {at: 1328.4, landAt: 1331.3}, caption: 'PG18, 16 vCPU, 500 DDL tx/s target, synthetic workload'},
    accents: [1331.3], source: `${BRIEF} (§ 4 table C, Fig. 4.1: DDL 502 / 502 / 274 / 127 tx/s at 0 / 1,000 / 3,000 / 5,000 idle; LWLock:SInvalWrite 1.3 / 53.6 / 86.5 / 91.1 percent; the brief's prose rounds to 54 / 86 / 91)`, still: 1336},
  {id: '18-idle-1000', comp: 'band196', placement: 'band', srcStart: 1436.0, srcEnd: 1460.0,
    words: 'Nik: "we didn\'t exceed 1,000" (1448.09) "double or, or triple" (1451.11-1452.45) "So we just suddenly have more connections" (1459.22)',
    props: {lines: [{style: 'dark', segs: [{text: '1,000 idle sessions: 502 tx/s', at: 1436.4}, {text: '   3,000: ', at: 1451.1}, {text: '274 tx/s', color: K.red}]}, {style: 'chip', segs: [{text: '500 tx/s target, synthetic workload'}]}]},
    source: `${BRIEF} (§ 4 table C)`, still: 1457},
  {id: '19-andres', comp: 'band196', placement: 'band', srcStart: 1470.4, srcEnd: 1482.4,
    words: 'Nik: "thanks to work from Andreas Freund" (1471.62-1474.10) ... "you don\'t suffer from them" (1481.22)',
    props: fact('PG14: faster snapshots with many sessions', 'Andres Freund · postgresql.org/docs/release/14.0'),
    source: 'https://www.postgresql.org/docs/release/14.0/ ("Improve the speed of computing MVCC visibility snapshots on systems with many CPUs and high session counts (Andres Freund) ... also improves performance when there are many idle sessions.")', still: 1480},
  {id: '19b-ash-blind', comp: 'axisbars196', placement: 'center', srcStart: 1488.3, srcEnd: 1512.8,
    words: 'Nik: "this wait event can be seen in active session history dashboards" (1488.26-1494.56) ... "if you use pg_ash, you can see it as well" (1501.96-1503.80) "oh, boom, like a lot of sessions are waiting" (1505.06-1508) ... "CPU is not 100%" (1509-1511)',
    props: {title: '5,000 idle sessions: how many are waiting?', sub: 'idle-pool sessions, average over the run', unit: 'sessions', max: 200, ticks: [0, 50, 100, 150, 200], rows: [
      {label: 'pg_stat_activity', sub: 'polled 10 times/s, state = active', value: 1.7, text: '1.7', at: 1490.5, color: '#8A8A93'},
      {label: 'pg_wait_sampling', sub: 'samples every 10 ms', value: 160, text: 'about 160', at: 1505.1, color: '#C4162A'}],
      caption: '500 DDL tx/s, PG18.6, synthetic workload'},
    source: `${BRIEF} (summary: "At 5,000 idle sessions and 500 DDL tx/s, pg_wait_sampling shows 161 idle-pool sessions on average in a wait [...], 94 percent of them in LWLock:SInvalWrite; a 10 Hz poll of pg_stat_activity that keeps state = 'active' sees 1.7."; shown rounded as "about 160" per forge, 2026-11-11; the brief's \"peaks near 1,000\" is not shown: no plotted bin exceeds ~600)`, still: 1510},
  {id: '20-gregg', comp: 'band196', placement: 'band', srcStart: 1532.6, srcEnd: 1544.6,
    words: 'Nik: "Brandon Gregg" (1532.84) ... "various Linux tools" (1542.20)', props: fact('Brendan Gregg: Linux Performance Tools', 'brendangregg.com/linuxperf.html'),
    source: 'https://www.brendangregg.com/linuxperf.html', still: 1542},
  {id: '21-ring', comp: 'ring196', placement: 'center', srcStart: 1560.3, srcEnd: 1616.0,
    words: 'Kirk: "4K ring buffer" (1561.62) "dropping these messages into" (1563.40) ... "It\'s a broadcast" (1576.14) "not to 1,000 sessions, but now to 4,000 sessions" (1578.96-1583.74); Nik/Kirk: "All idle ones" (1584.00, 1585.62) ... Kirk: "the queue doesn\'t change in size" (1601.60-1603.06)',
    props: {drawAt: 1561.6, fillAt: 1563.4, msgNote: 'create + drop = ~114 messages', flashAt: 1576.1, quadAt: 1581.0, greyAt: 1584.0, redAt: 1601.6},
    source: `schematic; 4,096 = MAXNUMMESSAGES (${GH}#L123); ~114 messages per CREATE TEMP ... ON COMMIT DROP (2 columns) from ${BRIEF} § 10 table`, still: 1590},
  {id: '22-information', comp: 'band196', placement: 'band', srcStart: 1618.9, srcEnd: 1624.9,
    words: 'Kirk: "It\'s not the work, it\'s the information" (1619.20-1621.64)', props: quote("It's not the work, it's the information."), source: 'on air (Kirk)', still: 1623},
  {id: '23-throughput', comp: 'thru196', placement: 'center', srcStart: 1649.6, srcEnd: 1765.0,
    words: 'Kirk: "the AI will bring up" (1649.72); Nik: "88,000 transactions for CTE" (1669.12) "less than 4,000 for temporary tables" (1672.50) ... "It will lead to a lot of dead tuples" (1704.94) "You need to vacuum" (1706.98) ... "17,000 transactions in this synthetic" (1721.46); Kirk: "more than four times better" (1749.54) ... "they have their place" (1767.56)',
    props: {popAt: 1650.0, rows: [
      {label: 'Temp table per transaction', value: 3931, color: K.orange, numAt: 1672.5},
      {label: 'One temp table per session, ON COMMIT DELETE ROWS', value: 17741, color: K.lblue, numAt: 1721.5, badge: {text: '4.5x vs temp table per tx', at: 1722.4}},
      {label: 'CTE, no temp table', value: 88531, color: K.yellow, numAt: 1669.1, badge: {text: 'about 23x vs temp table per tx', at: 1749.6}}],
      note: {text: "Editor's note: ON COMMIT DELETE ROWS truncates at commit. No dead tuples.", at: 1705.4, until: 1716.0}},
    accents: [1669.1], source: `${BRIEF} (§ 5 key numbers, ceiling runs, PG17, 32 clients, median of 4 runs: churn 3,931, reuse_ocdr 17,741 (4.5x), cte 88,531 (about 23x) tx/s). Editor's note: ${DOCS_CT} (ON COMMIT DELETE ROWS: "Essentially, an automatic TRUNCATE is done at each commit.")`, still: 1755},
  {id: '24-select-t1', comp: 'psql196', placement: 'center', srcStart: 1836.7, srcEnd: 1934.0,
    words: 'Nik: "see it in the center" (1836.80) "Select star from this table" (1844.32) "select T1 from T1." (1860.88) ... "select array," (1884.06); Kirk: "Oh, wow." (1891.22); Nik: "single scalar value" (1900.20) "you can undo it dynamically" (1909.0); Kirk: "You can unnest it" (1912.20); Nik: "T1 in parenthesis.star" (1918.02) "your columns back" (1921.26)',
    // A real psql 18.6 session (research/psql18-session.txt): each statement is typed from typeAt, Enter at
    // enterAt, then psql's output exactly as printed. The array row flashes (punch) at Enter, 2 s before "Oh, wow".
    props: {stmts: [
      {typeAt: 1837.2, enterAt: 1839.2},
      {typeAt: 1839.6, enterAt: 1842.9},
      {typeAt: 1843.3, enterAt: 1844.3},
      {typeAt: 1858.6, enterAt: 1860.9},
      {typeAt: 1884.1, enterAt: 1889.4},
      {typeAt: 1909.8, enterAt: 1912.2},
      {typeAt: 1915.2, enterAt: 1918.0}],
      hl: {stmt: 6, text: '(t1).*', at: 1918.0}, flash: {stmt: 4, at: 1889.4}},
    accents: [1889.4], source: 'on air (Nik, Kirk); a real interactive psql session on PostgreSQL 18.6 (postgres:18 image, 2026-11-11), output verbatim: video/overlays/psql18-session.txt', still: 1925},
  {id: '25-unlogged', comp: 'band196', placement: 'band', srcStart: 1995.0, srcEnd: 2002.0,
    words: 'Kirk: "we\'ve switched to using unlogged tables" (1995.28-1997.86)',
    props: quote("We've switched to using unlogged tables.", 'Docs, CREATE UNLOGGED TABLE: not written to WAL, not crash-safe'),
    source: `on air (Kirk); ${DOCS_CT}#SQL-CREATETABLE-UNLOGGED ("Data written to unlogged tables is not written to the write-ahead log ... However, they are not crash-safe")`, still: 2000},
  {id: '26-takeaway', comp: 'band196', placement: 'band', srcStart: 2078.3, srcEnd: 2083.8,
    words: 'Nik: "Just get rid of temporary tables" (2078.84-2080.58)', props: TAKEAWAY, source: 'on air (Nik), the episode takeaway (2 of 3)', still: 2082},
  {id: '27-brief', comp: 'shot196', placement: 'center', srcStart: 2111.5, srcEnd: 2124.0,
    words: 'Nik: "check out, uh, the brief" (2112.32) "at the very end, there are ideas" (2115.92) "for Postgres itself" (2121.04-2122.36)',
    props: {shots: [shot('brief-title-only', 2111.5, 'DBLab Forge brief · link in the description')]}, source: `${BRIEF} (cover, V6.1)`, still: 2120},
  {id: '28-tom-lane', comp: 'shot196', placement: 'center', srcStart: 2197.1, srcEnd: 2222.0,
    words: 'Nik: "heavily touched by Tom Lane in 2008" (2200.56-2202.58) ... "this, uh, maximum messages" (2212.12) "could depend on max connections" (2217.64) "could be a separate, uh, setting" (2220.22-2221.94)',
    props: {shots: [
      shot('gh-commit-fad153ec', 2197.1, 'Tom Lane, Jun 19, 2008 · github.com/postgres/postgres/commit/fad153ec45', {hl: [{rects: rects('gh-commit-fad153ec', 'Rewrite the sinval messaging mechanism to reduce contention and avoid'), at: 2200.6}]}),
      shot('brief-idea-queue-top', 2212.1, BRIEF_CHIP + ' · § 13', {hl: [{rects: rects('brief-idea-queue-top', 'Size the queue with the installation'), at: 2212.6}, {rects: rects('brief-idea-queue-top', 'A size derived from'), at: 2217.6}, {rects: rects('brief-idea-queue-top', 'max_connections'), at: 2217.9}, {rects: rects('brief-idea-queue-top', 'or a separate setting'), at: 2220.2}]}),
    ]},
    source: `https://github.com/postgres/postgres/commit/fad153ec45299bd4d4f29dec8d9e04e2f1c08148 (Tom Lane, 2008-06-19, "Rewrite the sinval messaging mechanism to reduce contention and avoid unnecessary cache resets", first in REL8_4_BETA1; GitHub shows his mirror handle tglsfdc); ${BRIEF} § 13 idea 3 "Size the queue with the installation ... A size derived from max_connections, or a separate setting"`, still: 2219},
  {id: '29-takeaway', comp: 'band196', placement: 'band', srcStart: 2251.6, srcEnd: 2256.8,
    words: 'Nik: "mitigation here remains just don\'t use temp tables" (2253.04-2254.52)', props: {lines: [{style: 'marker', segs: [{text: 'Don’t use temp tables.', at: 2253.0}]}]}, source: 'on air (Nik), the episode takeaway (3 of 3)', still: 2255},
  {id: '30-dont-do-this', comp: 'shot196', placement: 'center', srcStart: 2257.0, srcEnd: 2272.5,
    words: 'Kirk: "updating the don\'t do this wiki" (2257.60-2259.20) ... "in doing that. So yeah." (2272.48)',
    props: {shots: [shot('wiki-ddt', 2257.0, "wiki.postgresql.org/wiki/Don't_Do_This")]},
    source: "https://wiki.postgresql.org/wiki/Don%27t_Do_This (no temp-table entry yet on 2026-11-10; Kirk plans to add one)", still: 2266},
  {id: '31-discard-all', comp: 'band196', placement: 'band', srcStart: 2319.0, srcEnd: 2336.6,
    words: 'Kirk: "it\'s gonna issue a discard all" (2322.60-2324.02) ... "drops all your temp tables" (2334.98-2336.34)',
    props: {lines: [{style: 'dark', segs: [{text: 'Session pooling: DISCARD ALL drops temp tables', at: 2322.6}]}, {style: 'chip', segs: [{text: 'PgBouncer server_reset_query, default DISCARD ALL', at: 2335.0}]}]},
    source: 'https://www.pgbouncer.org/config.html (server_reset_query, "Default: DISCARD ALL", session pooling only by default); https://www.postgresql.org/docs/current/sql-discard.html (DISCARD ALL includes DISCARD TEMP)', still: 2333},
];

const TIME_KEYS = new Set(['at', 'at10', 'at60', 'noteAt', 'fillAt', 'dimAt', 'drawAt', 'landAt', 'flashAt', 'quadAt', 'greyAt', 'redAt', 'popAt', 'numAt', 'until', 'punchAt', 'typeAt', 'enterAt']);
const mapTimes = (v: unknown, rel: (t: number) => number): unknown => {
  if (Array.isArray(v)) return v.map((x) => mapTimes(x, rel));
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) {
      if (TIME_KEYS.has(k) && typeof x === 'number') o[k] = rel(x);
      else if (TIME_KEYS.has(k) && Array.isArray(x) && x.every((y) => typeof y === 'number')) o[k] = (x as number[]).map(rel);
      else o[k] = mapTimes(x, rel);
    }
    return o;
  }
  return v;
};

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const cutsPath = resolve(args[0]);
  const render = args.includes('--render');
  const stills = args.includes('--stills');
  const only = new Set(args.slice(1).filter((a) => !a.startsWith('--')));
  const segs: Seg[] = JSON.parse(readFileSync(cutsPath, 'utf8')).segmentTimes;
  const r2 = (x: number) => Math.round(x * 100) / 100;
  // Host 2026-11-11 (after the v4 review): cut cards that add no value.
  const CUT = new Set(['03-fall-off', '05-uuid-episode', '19b-ash-blind', '20-gregg', '26-takeaway', '30-dont-do-this', '06-takeaway', '07-8x-machine', '18-idle-1000', '22-information', '25-unlogged', '27-brief', '28-tom-lane']);
  const built = ITEMS.filter((it) => !CUT.has(it.id)).map((it) => {
    const outStart = r2(toEdited(segs, it.srcStart));
    const dur = it.editDur ?? r2(toEdited(segs, it.srcEnd) - outStart);
    const rel = (t: number) => r2(Math.max(0, toEdited(segs, t) - outStart));
    const props = mapTimes(it.props, rel) as Record<string, unknown>;
    return {it, outStart, dur, props: {...props, durationSec: dur}, stillAt: rel(it.still), accents: (it.accents ?? []).map(rel)};
  });
  for (let i = 1; i < built.length; i++) {
    const p = built[i - 1], q = built[i];
    if (p.outStart + p.dur > q.outStart) console.warn(`overlap: ${p.it.id} ends ${r2(p.outStart + p.dur)} > ${q.it.id} starts ${q.outStart}`);
  }
  for (const b of built) console.log(`${b.it.id}\tsrc ${b.it.srcStart}\tedited ${b.outStart}\tdur ${b.dur}`);
  mkdirSync(join(OUT, 'props'), {recursive: true});
  for (const b of built) writeFileSync(join(OUT, 'props', `${b.it.id}.props.json`), JSON.stringify(b.props));
  const r3 = (x: number) => Math.round(x * 1000) / 1000;
  for (const b of built.filter((x) => x.it.placement === 'band' && false)) { // bands are not typed any more (host 2026-11-11)
    const pl = band196Plan(b.props as {lines: never[]});
    const list = pl.flatMap((l) => l.segs.flatMap((sg) => sg.bs.map((x) => ({start: r3(x.start), end: r3(x.end), chars: x.chars, line: sg.line}))));
    writeFileSync(join(OUT, `${b.it.id}-typing-bursts.json`), JSON.stringify({overlay: `${b.it.id}-typing.mov`, timeBase: 'seconds from the overlay start', bursts: list}, null, 2));
  }
  for (const b of built.filter((x) => x.it.comp === 'psql196')) {
    // typing bursts of the psql card (one line per statement), same format as the bands
    const pl = psqlPlan(b.props as {stmts: never[]});
    const list = pl.flatMap((st, i) => st.bs.map((x) => ({start: r3(x.start), end: r3(x.end), chars: x.chars, line: `stmt${i}`})));
    writeFileSync(join(OUT, `${b.it.id}-typing-bursts.json`), JSON.stringify({overlay: `${b.it.id}.mov`, timeBase: 'seconds from the overlay start', note: 'center card: add one typing sound per line by hand (sfx-manifest adds typing only to band cards)', bursts: list}, null, 2));
  }
  const todo = built.filter((b) => only.size === 0 || only.has(b.it.id));
  if (stills) {
    mkdirSync(join(OUT, 'stills'), {recursive: true});
    for (const b of todo) {
      const frame = Math.min(Math.round(b.stillAt * 25), Math.round(b.dur * 25) - 10);
      const p = Bun.spawnSync(['bunx', 'remotion', 'still', 'src/index.ts', b.it.comp, join(OUT, 'stills', `raw-${b.it.id}.png`), `--frame=${frame}`, '--log', 'error', `--props=${join(OUT, 'props', `${b.it.id}.props.json`)}`], {cwd: ROOT, stdout: 'inherit', stderr: 'inherit'});
      console.log(p.exitCode === 0 ? `still ${b.it.id} @${b.stillAt}s` : `FAIL still ${b.it.id}`);
    }
  }
  if (render) {
    for (const b of todo) {
      const final = join(OUT, `${b.it.id}.mov`), file = `${final}.part.mov`; // render to a temp name, move into place at the end
      const p = Bun.spawn(['bunx', 'remotion', 'render', 'src/index.ts', b.it.comp, file, '--codec', 'prores', '--prores-profile', '4444', '--image-format', 'png', '--pixel-format', 'yuva444p10le', '--log', 'error', `--props=${join(OUT, 'props', `${b.it.id}.props.json`)}`], {cwd: ROOT, stdout: 'inherit', stderr: 'inherit'});
      const code = await p.exited;
      if (code === 0 && existsSync(file)) {
        const q8 = Bun.spawnSync(['ffmpeg', '-v', 'error', '-y', '-i', file, '-c:v', 'prores_ks', '-profile:v', '4', '-qscale:v', '8', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-vendor', 'apl0', `${final}.q8.mov`]);
        if (q8.exitCode === 0) { renameSync(`${final}.q8.mov`, final); unlinkSync(file); console.log(`ok ${b.it.id}`); } else console.log(`FAIL q8 ${b.it.id}`);
      } else console.log(`FAIL ${b.it.id}`);
    }
  }
  const overlays = built.map((b) => ({id: b.it.id, srcStart: b.it.srcStart, srcEnd: b.it.srcEnd, words: b.it.words, outStart: b.outStart, dur: b.dur, duration: b.dur, file: `${b.it.id}.mov`, placement: b.it.placement, freezeSec: 0, sfx: [], accents: b.accents, stillAt: b.stillAt, source: b.it.source}));
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({video: '01-edited.mp4', cuts: cutsPath, fps: 25, width: 1920, height: 1080, timeBase: 'edited seconds for the cuts file, no freezes', layout: 'center placement needs the layout\'s place.<host>.center entries (hosts at the edges during center cards)', band: {x: 24, y: 912, w: 1576, h: 140}, overlays}, null, 2));
  console.log(`manifest: ${join(OUT, 'manifest.json')}`);
}
