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
ARGS = [a for a in sys.argv[1:] if a != '--json']
CUTS = ARGS[0] if ARGS else os.path.join(HERE, '../edit/edited-v2.cuts.json')
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
add('f01-numbers', S(183.62), 14, {'kind': 'v2-credits', 'title': 'People credited in release notes', 'chip': 'Forge PG19 study', 'labels': {'people': 'in Postgres 19'}}, 'numbers.json by_version; brief "Postgres 19 in numbers"')

# F02 (on air "repack concurrently will actually be fine. And there are edge cases")
r = d['fig-repack-lock']
lab = {0.14: '0.14 s', 3.54: '3.54 s', 27.66: '27.7 s', 85.72: '85.7 s'}
add('f02-repack', S(992.44), 16, {'kind': 'v2-repack', 'title': 'REPACK CONCURRENTLY: final lock wait', 'chip': 'Forge PG19 study · synthetic', 'labels': {'purple': '1 row/tx', 'orange': '30 rows/tx'}}, 'data.json fig-repack-lock; brief 1.1')

# F03 (on air "if 1,000 listeners, from 200 per second, we went to 11,000 per second")
add('f03-notify', S(1297.32), 15, {'kind': 'v2-notify', 'title': 'NOTIFY with 1,000 listeners', 'chip': 'Forge PG19 study · synthetic', 'labels': {}}, 'brief v3.0 1.2')

# F04 (on air "a big fan of the auto vacuum improvements ... The prioritization")
a = d['fig-autovac']; g0 = a['groups'][0]
add('f04-autovac', S(1508.92), 15, {'kind': 'v2-autovac', 'title': 'Autovacuum reaches the urgent table', 'chip': 'Forge PG19 study · synthetic', 'labels': {'last': 'last of 121', 'first': 'first'}}, 'data.json fig-autovac group 1; brief 1.3')

# F05 VACUUM (PARALLEL) with cost delay: dropped. On air is parallel autovacuum ("just upgrade"),
# the figure is manual VACUUM (PARALLEL); band strip 02 already says parallel autovacuum is off by default.

# F11 (on air "our testing found some overhead from using advice ... around 10%"); replaces band strip 04
add('f11-advice', S(1883.0), 13, {'kind': 'v2-advice', 'title': 'Plan advice: throughput, trivial query', 'chip': 'Forge PG19 study · synthetic', 'labels': {'off': 'off', 'on': 'on', 'range': 'to'}}, 'brief v3.0 1.4 "Cost (small test host, rough)"')

# F06 (on air "JIT being off by default feels far more sensible")
add('f06-jit', S(1927.68), 14, {'kind': 'v2-jit', 'title': 'JIT off: short faster, long slower', 'chip': 'Forge PG19 study', 'labels': {'longest': 'longest query', 'short': 'short query'}}, 'brief 2.10')

# F07 (on air "LZ4 in the case of toast")
add('f07-lz4', S(1997.48), 11.5, {'kind': 'v2-lz4', 'title': 'LZ4 by default: faster inserts', 'chip': 'Forge PG19 study · synthetic', 'labels': {'pglz': 'pglz', 'lz4': 'lz4'}}, 'brief 2.11')

# F08 EXPLAIN ANALYZE timing: dropped (see REVIEW.md: the brief has no clear statement that fits the moment).

# F09 rehearsal moves to the blog; no video card.

# F10 (on air "I'm very curious about plan flip analysis")
pc = d['fig-plan-causes']; cls = {c['key']: c['light'] for c in pc['classes']}
add('f10-plans', S(3144.8), 15, {'kind': 'v2-plans', 'title': 'Query plans changed in 19', 'chip': 'Forge PG19 study · synthetic', 'labels': {'total': 'of 220', 'changed': 'of 83', 'commit': 'from one commit'}}, 'data.json fig-plan-causes rows 1-2; brief 3.6')

items.sort(key=lambda x: x['outStart'])

# Read-only input for the Bun visual-budget checker.
if '--json' in sys.argv:
    print(json.dumps(items))
    sys.exit(0)

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
