#!/usr/bin/env python3
# Episode 197: central Forge illustrations. Reads the brief's figure data
# (data.json, numbers.json) and writes scripts/items-forge.ts. Values that are only
# in the brief text are marked TEXT with the brief section. outStart = body seconds
# (edited timeline, no title card).
import json, sys, os
# Usage: forge-items.py [cuts.json]  (default: the v2 plan with the London part restored).
# Each card is anchored on a source (recording) second and mapped through the cut plan.
HERE = os.path.dirname(os.path.abspath(__file__))
REC = os.environ.get('RECORDING', os.path.expanduser('~/Documents/Zoom/2026-11-17 10.02.00 .fm recording'))
CUTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '../edit/edited-v2.cuts.json')
SEG = json.load(open(CUTS))['segmentTimes']
def S(src):
    for g in SEG:
        if g['srcStart'] - 0.02 <= src <= g['srcEnd']: return round(g['outStart'] + max(0, src - g['srcStart']), 2)
    raise SystemExit(f'source {src} is inside a cut')
FIG = os.environ.get('FORGE_FIGURES', os.path.expanduser('~/gitlab/forge-wt-pg19-brief/cases/pg19-vs-18-01/brief/figures/reader'))
d = json.load(open(f'{FIG}/data.json'))['figures']
n = json.load(open(f'{FIG}/numbers.json'))
C = {'s18': '#2a78d6', 's19': '#d9822b', 's3': '#7a5bd6', 'grey': '#8b95a1'}
BRIEF = 'https://console.postgres.ai/shared/brief/01a1e0e2-b826-73de-8300-9e56a1eb124c'
items = []
def add(id, at, dur, props, source):
    items.append({'id': id, 'comp': 'forge', 'outStart': at, 'duration': dur, 'placement': 'center', 'freezeSec': 0, 'sfx': [], 'props': props, 'source': source})

# Review 2026-11-18 (Nik): every card ties to what is said at that moment. One headline, one
# chart or one or two numbers, a short bridge line in "sub" that says what the numbers are,
# a minimal footer. Provenance of every number: REVIEW.md (raw run files, recomputed).
STUDY = 'What the Forge study measured: '

# F01 (on air "Postgres 19 is ready for release")
bv = n['by_version']
add('f01-numbers', S(183.62), 14, {'kind': 'vbars', 'title': 'Postgres 19: 645 people credited, the most of 10 to 19',
    'sub': 'What the Forge study counted: names in the release notes acknowledgments, by major version',
    'bars': [{'label': str(v['version']), 'value': v['acknowledgments_names'], 'color': C['s19'] if v['version'] == 19 else C['s18'] if v['version'] == 18 else C['grey']} for v in bv],
    'axisMax': 700, 'median': {'value': n['median_10_to_19']['acknowledgments_names'], 'label': ''},
    'side': [{'big': '2,990', 'text': 'commits in the 19 cycle (18: 2,774)'}],
    'footer': 'Dashed line: median of 10 to 19 (410.5).'}, 'numbers.json by_version; brief "Postgres 19 in numbers"')

# F02 (on air "repack concurrently will actually be fine. And there are edge cases")
r = d['fig-repack-lock']
lab = {0.14: '0.14 s', 3.54: '3.54 s', 27.66: '27.7 s', 85.72: '85.7 s'}
add('f02-repack', S(992.44), 16, {'kind': 'line', 'title': 'REPACK (CONCURRENTLY): the final lock grows with the write rate',
    'sub': STUDY + '19.0, synthetic writes into a 20,000,000-row table, 16 vCPU',
    'series': [{'label': s['label'], 'color': C['s19'] if i == 0 else C['s3'], 'points': [{'x': q['x'], 'y': q['value'], **({'label': lab[q['value']]} if q['value'] in lab else {})} for q in s['points']]} for i, s in enumerate(r['series'])],
    'xMax': 70000, 'yMax': 90, 'xStep': 10000, 'yStep': 15, 'xUnit': 'rows written per second', 'yUnit': 'seconds blocked',
    'footer': 'Median of 3 runs per point.'}, 'data.json fig-repack-lock; brief 1.1')

# F03 (on air "if 1,000 listeners, from 200 per second, we went to 11,000 per second")
add('f03-notify', S(1297.32), 15, {'kind': 'pop', 'title': 'LISTEN/NOTIFY with 1,000 listeners',
    'sub': STUDY + '1,000 listeners on their own channels, 4 notifiers, 8 vCPU',
    'pairs': [{'caption': 'Notifications per second, as fast as each version can go', 'before': '200/s', 'beforeLabel': '18.7', 'after': '11,040/s', 'afterLabel': '19 RC2'}],
    'footer': 'Median of 3 trials. Our client was the limit, so 19 can go higher.'}, 'brief v3.0 1.2')

# F04 (on air "a big fan of the auto vacuum improvements ... The prioritization")
a = d['fig-autovac']; g0 = a['groups'][0]
add('f04-autovac', S(1508.92), 15, {'kind': 'hbars', 'title': '19 vacuums the table nearest wraparound first',
    'sub': STUDY + 'one old table among 120 bloated tables, 16 vCPU',
    'groups': [{'rows': [{'label': x['label'], 'value': x['value'], 'display': x['display'], 'color': C.get(x['series'], C['grey'])} for x in g0['rows']]}],
    'axisMax': a['axis_max'], 'labelW': 460, 'barH': 64,
    'footer': 'Seconds until autovacuum starts on the old table (age 1.65 billion); median of 3 trials.'}, 'data.json fig-autovac group 1; brief 1.3')

# F05 VACUUM (PARALLEL) with cost delay: dropped. On air is parallel autovacuum ("just upgrade"),
# the figure is manual VACUUM (PARALLEL); band strip 02 already says parallel autovacuum is off by default.

# F11 (on air "our testing found some overhead from using advice ... around 10%"); replaces band strip 04
add('f11-advice', S(1883.0), 13, {'kind': 'stats', 'title': 'Plan advice overhead in our test',
    'sub': STUDY + 'small shared test host, 4 clients, 20 s, 2 trials per setting',
    'stats': [{'big': '11–14%', 'text': 'less throughput on a trivial query, with advice generated for every query'}],
    'footer': 'Against the modules off (11%) or loaded and idle (14%). Setting: pg_plan_advice.always_store_advice_details.'}, 'brief v3.0 1.4 "Cost (small test host, rough)"')

# F06 (on air "JIT being off by default feels far more sensible")
add('f06-jit', S(1927.68), 14, {'kind': 'stats', 'title': 'JIT off by default: some analytic queries slower, some faster',
    'sub': STUDY + '22 TPC-H-derived queries, 32 vCPU, 3 trials',
    'stats': [{'big': '+17.7%', 'text': 'the longest aggregation (q1): 3,914 → 4,607 ms', 'color': C['s19']},
              {'big': '−37%', 'text': 'a short query just above the JIT cost threshold (q19): 172 → 108 ms', 'color': C['s18']}],
    'footer': 'JIT itself did not change; the default did. Per-query numbers are exploratory.'}, 'brief 2.10')

# F07 (on air "LZ4 in the case of toast")
add('f07-lz4', S(1997.48), 11.5, {'kind': 'pop', 'title': 'lz4 for new TOAST values: faster inserts, more disk',
    'sub': STUDY + 'insert of 200,000 jsonb documents of 16 KiB, 8 vCPU, 3 trials',
    'pairs': [{'caption': 'Insert time', 'before': '107 s', 'beforeLabel': '18.7 (pglz)', 'after': '44 s', 'afterLabel': '19 RC2 (lz4)'},
              {'caption': 'Space of the same data', 'before': 'pglz', 'beforeLabel': 'baseline', 'after': '+11.3%', 'afterLabel': 'lz4'}],
    'footer': 'If disk matters more: default_toast_compression = pglz.'}, 'brief 2.11')

# F08 EXPLAIN ANALYZE timing: dropped (see REVIEW.md: the brief has no clear statement that fits the moment).

# F09 (on air "full clone environment, checking that everything works"); kept only if the raw rehearsal records prove the counts
if os.environ.get('REHEARSAL', '1') == '1':
    add('f09-rehearsal', S(2906.44), 14, {'kind': 'stats', 'title': 'pg_upgrade --check said yes, then the upgrade failed',
        'sub': STUDY + '687 synthetic rehearsals, each on a fresh clone, of setups we built to break the upgrade',
        'stats': [{'big': '22 cases', 'text': 'passed pg_upgrade --check, then failed', 'color': '#a8433b'},
                  {'big': '11 cases', 'text': '19 did not start: a removed setting in its config', 'color': C['s3']}],
        'footer': 'Our list of risky setups, not failure rates of real systems.'}, 'data.json fig-rehearsal; brief 2.0')

# F10 (on air "I'm very curious about plan flip analysis")
pc = d['fig-plan-causes']; cls = {c['key']: c['light'] for c in pc['classes']}
add('f10-plans', S(3144.8), 15, {'kind': 'hbars', 'title': '83 of 220 query templates got a different plan on 19',
    'sub': STUDY + '4,273 benchmark queries planned on 18.7 and 19 RC2, same data and statistics',
    'groups': [{'rows': [{'label': x['label'].split(' (70 by')[0], 'value': x['templates'], 'display': f"{x['templates']} templates", 'color': cls[x['class']]} for x in pc['rows'][:2]]}],
    'axisMax': pc['axis_max'], 'labelW': 780, 'barH': 60, 'valueW': 220,
    'footer': 'Plus 6 smaller causes, 1 to 4 templates each. A template with several causes counts in each bar.'}, 'data.json fig-plan-causes rows 1-2; brief 3.6')

items.sort(key=lambda x: x['outStart'])

out = 'export type Item = {id: string; comp: string; outStart: number; duration: number; placement: "center"; freezeSec: number; sfx: never[]; props: Record<string, unknown>; source?: string};\nexport const ITEMS: Item[] = ' + json.dumps(items, indent=1) + ';\n'
open(REC + '/final-overlays/tool/scripts/items-forge.ts', 'w').write(out)
print(len(items), 'items')

# The hosts move to a right-hand column while a card is up ("center" placement), and around the
# London photo during its card ("london" placement). compose.ts makes the windows from the
# overlay manifest, so layout.json gets only the target places (no windows: they would double).
LP = os.path.join(HERE, '../layout.json')
lay = json.load(open(LP))
LONDON = {'nik': (150, 262), 'kirk': (150, 596), 'michael': (1230, 429)}  # w 540: photo x 765-1155, y 250-900
for k, y in (('nik', 300), ('michael', 500), ('kirk', 700)):
    lay['place'][k]['center'] = {'x': 1630, 'y': y, 'w': 266}
    lay['place'][k]['centers'] = {'london': {'x': LONDON[k][0], 'y': LONDON[k][1], 'w': 540}}
lay.pop('center', None)
lay['cuts'] = '<recording>/review/edited-v2.cuts.json'
json.dump(lay, open(LP, 'w'), indent=1)
print('layout.json: center and london places')
