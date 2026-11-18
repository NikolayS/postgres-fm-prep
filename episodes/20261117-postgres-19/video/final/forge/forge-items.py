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

# F01 Postgres 19 in numbers (on air 01:23 "Postgres 19 is ready for release")
bv = n['by_version']
add('f01-numbers', S(183.62), 14, {'kind': 'vbars', 'title': 'Postgres 19: 645 people credited, the most of 10 to 19',
    'sub': 'Names in the release notes acknowledgments, by major version',
    'bars': [{'label': str(v['version']), 'value': v['acknowledgments_names'], 'color': C['s19'] if v['version'] == 19 else C['s18'] if v['version'] == 18 else C['grey']} for v in bv],
    'axisMax': 700, 'median': {'value': n['median_10_to_19']['acknowledgments_names'], 'label': ''},
    'side': [{'big': '2,990', 'text': 'commits in the 19 cycle (18: 2,774)'},  # TEXT: brief "Postgres 19 in numbers"
             {'big': f"{bv[-1]['items_changes']} + {bv[-1]['items_migration']}", 'text': 'release-note items: changes + migration'}],
    'footer': 'Dashed line: median of 10 to 19, 410.5. PostgreSQL git history and release notes, data of 2026-11-11.'}, 'numbers.json by_version; brief "Postgres 19 in numbers"')

# F02 REPACK (CONCURRENTLY) final lock (on air 12:56)
r = d['fig-repack-lock']
lab = {0.14: '0.14 s', 3.54: '3.54 s', 27.66: '27.7 s', 85.72: '85.7 s'}
add('f02-repack', S(992.44), 16, {'kind': 'line', 'title': 'REPACK (CONCURRENTLY): the final lock blocks the table longer as writes grow',
    'sub': '19.0, 16 dedicated vCPU, 20,000,000-row table in memory, 16 writer sessions',
    'series': [{'label': s['label'], 'color': C['s19'] if i == 0 else C['s3'], 'points': [{'x': p['x'], 'y': p['value'], **({'label': lab[p['value']]} if p['value'] in lab else {})} for p in s['points']]} for i, s in enumerate(r['series'])],
    'xMax': 70000, 'yMax': 90, 'xStep': 10000, 'yStep': 15, 'xUnit': 'rows written per second', 'yUnit': 'seconds blocked',
    'footer': 'Median of 3 runs per point. Use lock_timeout and retry.'}, 'data.json fig-repack-lock; brief 1.1')

# F03 LISTEN/NOTIFY (on air 17:25 "1,000 listeners, from 200 per second to 11,000"): brief v3.0 numbers, as said on air
add('f03-notify', S(1297.32), 15, {'kind': 'pop', 'title': 'LISTEN/NOTIFY with many listeners: 19 wakes only the listeners of the channel',
    'chip': 'Forge PG19 study, brief v3.0',
    'pairs': [{'caption': '1,000 listeners, each on its own channel; 4 notifiers at full speed', 'before': '200/s', 'beforeLabel': '18.7', 'after': '11,040+/s', 'afterLabel': '19 RC2 (at least: our client was the limit)'}],
    'footer': '8-vCPU dedicated host, median of 3 trials. Retest on 19.0, 16 vCPU, NOTIFY-only transactions: 915/s on 18.7, 19,686/s on 19.0 (brief v3.1).'},
    'TEXT brief v3.0 1.2; v3.1 1.2 table')

# F04 Autovacuum prioritization (on air 20:46 Michael)
a = d['fig-autovac']
colr = lambda s: C.get(s, C['grey'])
add('f04-autovac', S(1508.92), 16.5, {'kind': 'hbars', 'title': a['title'],
    'sub': 'Seconds until autovacuum starts on one old table, among 120 bloated tables',
    'groups': [{'heading': g['heading'], 'rows': [{'label': x['label'], 'value': x['value'], 'display': x['display'], 'color': colr(x['series'])} for x in g['rows']]} for g in a['groups']],
    'axisMax': a['axis_max'], 'labelW': 560, 'barH': 40, 'footer': a['footer']}, 'data.json fig-autovac; brief 1.3')

# F05 Parallel VACUUM with cost delay (on air 21:12, after strip "parallel autovacuum is off by default")
v = d['fig-vacuum-parallel']
add('f05-vacuum-parallel', S(1535.62), 15, {'kind': 'hbars', 'title': v['title'],
    'sub': v['groups'][0]['heading'],
    'groups': [{'rows': [{'label': x['label'], 'value': x['value'], 'display': x['display'], 'color': colr(x['series'])} for x in v['groups'][0]['rows']]}],
    'axisMax': v['axis_max'], 'labelW': 420, 'barH': 56, 'footer': v['footer']}, 'data.json fig-vacuum-parallel; brief 3')

# F06 JIT off by default (on air 27:29)
j = d['fig-jit']; q = j['queries']
add('f06-jit', S(1927.68), 16, {'kind': 'dots', 'title': j['title'],
    'sub': 'Time on 19 RC2 / time on 18.7, one dot per query, 22 TPC-H-derived queries',
    'rows': [{'label': "Each version's default\n18.7 JIT on, 19 JIT off", 'values': [x['ratio'] for x in q], 'mean': j['mean']['value'], 'meanLabel': f"{j['mean']['display']} (-6.8%)",
              'marks': [{'value': 0.628, 'text': 'q19: 172 → 108 ms'}, {'value': 1.177, 'text': 'q1: 3,914 → 4,607 ms'}]},
             {'label': 'JIT off on both', 'values': [x['ratio_jit_off_both'] for x in q], 'mean': j['mean_jit_off_both']['value'], 'meanLabel': f"{j['mean_jit_off_both']['display']} (-1.8%)", 'marks': []}],
    'min': j['axis_min'], 'max': j['axis_max'], 'step': j['axis_step'], 'leftNote': '← faster on 19', 'rightNote': 'slower on 19 →',
    'footer': j['footer']}, 'data.json fig-jit; brief 2.10')

# F07 lz4 TOAST default (on air 28:37)
add('f07-lz4', S(1997.48), 11.5, {'kind': 'pop', 'title': 'lz4 is the default for new TOAST values: faster inserts, more disk',
    'pairs': [{'caption': 'Insert of 200,000 jsonb documents of 16 KiB', 'before': '107 s', 'beforeLabel': '18.7 (pglz)', 'after': '44 s', 'afterLabel': '19 RC2 (lz4)'},
              {'caption': 'Space of the same data', 'before': 'pglz', 'beforeLabel': 'baseline', 'after': '+11.3%', 'afterLabel': 'lz4: more disk'}],
    'footer': '8-vCPU dedicated host, 3 trials. If disk matters more: default_toast_compression = pglz.'}, 'TEXT brief 2.11')

# F08 EXPLAIN ANALYZE timing overhead (on air 35:24, after strip "on x86-64")
add('f08-timing', S(2427.46), 15, {'kind': 'hbars', 'title': 'On our cloud VM, EXPLAIN ANALYZE costs the same on 19 as on 18',
    'sub': 'Hash join: EXPLAIN (ANALYZE, TIMING ON) time / plain query time',
    'groups': [{'rows': [{'label': '18.7', 'value': 1.240, 'display': '1.240x', 'color': C['s18']},
                         {'label': '19 RC2, timing_clock_source = auto', 'value': 1.255, 'display': '1.255x', 'color': C['s19']},
                         {'label': '19 RC2, system', 'value': 1.321, 'display': '1.321x', 'color': C['s3']}]}],
    'axisMax': 1.5, 'labelW': 520, 'barH': 56,
    'footer': '8-vCPU dedicated cloud host, median of 3 trials; 19 used the system clock at auto here. Same verdict: within the noise.'}, 'TEXT brief 12.7 result table')

# F09 Upgrade rehearsals (on air 42:42 "full clone environment, checking that everything works")
h = d['fig-rehearsal']
add('f09-rehearsal', S(2906.44), 16, {'kind': 'stack', 'title': 'Rehearse the upgrade on a clone: pg_upgrade --check does not catch everything',
    'sub': h['sub'],
    'classes': [{'key': o['key'], 'label': o['label'], 'color': o['light']} for o in h['outcomes']],
    'rows': [{'label': x['label'], 'counts': x['counts']} for x in h['rows']], 'axisMax': h['axis_max'],
    'callout': '22 cases passed --check, then failed; in 11 more, 19 did not start',
    'footer': '687 rehearsals into 19 RC2 (not shown: 99 that do not apply, 6 killed on purpose). Counts follow our list of risky setups; they are not failure rates of real systems.'}, 'data.json fig-rehearsal; brief 2.0')

# F10 Plan changes (on air 46:29 "plan flip analysis ... two clones")
pc = d['fig-plan-causes']; cls = {c['key']: c['light'] for c in pc['classes']}
add('f10-plans', S(3144.8), 16, {'kind': 'hbars', 'title': pc['title'],
    'sub': 'Templates with a changed plan, by cause; 4,273 queries, same data and statistics',
    'groups': [{'rows': [{'label': x['label'], 'value': x['templates'], 'display': f"{x['templates']} ({x['queries']:,} queries)", 'color': cls[x['class']]} for x in pc['rows']]}],
    'axisMax': pc['axis_max'], 'labelW': 680, 'barH': 28, 'valueW': 260,
    'footer': 'Plans only; a template with several causes counts in each bar. Not counted: 488 queries whose 18.7 plan moved between ANALYZE runs.'}, 'data.json fig-plan-causes; brief 3.6')

# F11 Plan advice overhead (on air "our testing found some overhead from using advice ... around 10%"); replaces band strip 04
add('f11-advice', S(1883.0), 15, {'kind': 'stats', 'title': 'Plan advice is not free on very fast queries: about 13% in our test',
    'sub': 'pg_plan_advice and pg_stash_advice cost; small test host, rough',
    'stats': [{'big': 'about 13%', 'text': 'less throughput on a trivial query when advice is generated for every query (always_store_advice_details)'},
              {'big': '2.5 µs', 'text': 'more per planning with an active stash, flat from 0 to 100,000 entries', 'color': C['s3']},
              {'big': '0.47 → 0.28 ms', 'text': 'planning a 6-way join with full advice: it prunes the join search', 'color': C['s18']}],
    'footer': '4 clients, 20 s, 2 trials per setting, small test host only. Loaded and idle, the modules cost nothing visible.'}, 'TEXT brief v3.0 1.4 "Cost (small test host, rough)"')
items.sort(key=lambda x: x['outStart'])

out = 'export type Item = {id: string; comp: string; outStart: number; duration: number; placement: "center"; freezeSec: number; sfx: never[]; props: Record<string, unknown>; source?: string};\nexport const ITEMS: Item[] = ' + json.dumps(items, indent=1) + ';\n'
open(REC + '/final-overlays/tool/scripts/items-forge.ts', 'w').write(out)
print(len(items), 'items')

# The hosts move to a right-hand column while a card is up: write the "center" windows
# (same times as the cards) and the column places into the episode layout.json.
LP = os.path.join(HERE, '../layout.json')
lay = json.load(open(LP))
for k, y in (('nik', 300), ('michael', 500), ('kirk', 700)):
    lay['place'][k]['center'] = {'x': 1630, 'y': y, 'w': 266}
lay['center'] = [{'from': it['outStart'], 'to': round(it['outStart'] + it['duration'], 2)} for it in items]
lay['cuts'] = '<recording>/review/edited-v2.cuts.json'
json.dump(lay, open(LP, 'w'), indent=1)
print('layout.json: center windows', len(lay['center']))
