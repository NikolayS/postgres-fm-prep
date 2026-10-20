"""Render the audit summary from the published JSON. Requires Pillow.
Run from any directory: python3 render_docs_audit.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
rows = json.loads((HERE.parent / 'restore-docs-audit.json').read_text())['pages']
n = len(rows)
a = sum(r['analyze_action'] for r in rows)
v = sum(r['post_restore_vacuum'] for r in rows)
m = sum(r['visibility_map_readiness'] for r in rows)
# These two documented links are the report's named sensitivity check.
linked = sum(r['analyze_action'] or r['id'] in ('azure', 'pgadmin') for r in rows)
BG, INK, MUTED, TEAL, EMPTY = '#F5F3ED', '#172B38', '#52636C', '#007E80', '#D9DFDD'
im = Image.new('RGB', (1600, 1120), BG)
d = ImageDraw.Draw(im)
def font(size, bold=False):
    names = (['DejaVuSans-Bold.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'] if bold else
             ['DejaVuSans.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf'])
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    raise RuntimeError('Install DejaVu Sans or Arial to render the chart.')
def text(x, y, value, size=26, color=INK, bold=False):
    d.text((x,y), value, font=font(size,bold), fill=color)
text(72, 40, 'POSTGRES.FM  /  RESTORE READINESS', 23, TEAL, True)
text(72, 90, 'The restore guide ends.', 58, bold=True)
text(72, 158, 'Is the database ready for queries?', 58, bold=True)
text(72, 244, '12 selected documentation pages · 11 publishers · 20 October 2026', 26, MUTED)
d.rounded_rectangle((72,306,1528,455), radius=18, fill=INK)
text(102, 327, f'{n-a}/{n}', 75, '#FFFFFF', True)
text(337, 337, 'omit direct advice to gather optimizer statistics', 34, '#FFFFFF', True)
text(337, 389, 'A page-level finding, not a verdict on an entire provider.', 25, '#D9E7E8')
text(72, 485, 'DIRECT GUIDANCE ON THE PAGE', 23, TEAL, True)
text(1060, 485, 'Each tile = one page', 23, MUTED)
for y, label, count in [(555,'ANALYZE / gather statistics',a),(644,'Post-restore VACUUM',v),(733,'Visibility-map readiness',m)]:
    text(72,y,label,29,bold=True)
    for j in range(n):
        x=620+j*62
        d.rounded_rectangle((x,y-2,x+48,y+42),radius=6,fill=TEAL if j<count else EMPTY)
    text(1400,y-3,f'{count}/{n}',33,bold=True)
text(620, 797, 'Filled = addressed   ·   Pale = no qualifying direct guidance',22,MUTED)
d.line((72,849,1528,849),fill='#CAD3D0',width=2)
text(72,874,f'Follow the links: statistics guidance rises from {a}/{n} to {linked}/{n}',31,bold=True)
text(72,923,'when crediting Azure’s companion guide and pgAdmin’s upstream link.',25,MUTED)
text(72,966,'Convenience sample; not a population estimate. Linked-page check is not exhaustive.',23,MUTED)
text(72,1000,'No blanket VACUUM recommendation follows from these counts.',23,MUTED)
text(72,1050,'Sources + method: github.com/NikolayS/postgres-fm-prep',22,TEAL)
im.save(HERE / 'restore-docs-audit-summary.png', optimize=True)
