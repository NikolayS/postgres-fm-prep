"""Render the audit infographic from published data. Requires Pillow.

Run from any directory: python3 render_docs_expanded.py
Each document glyph represents one inspected page; categories may overlap.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
rows = json.loads((HERE.parent / 'restore-docs-expanded.json').read_text())['pages']
n = len(rows)
counts = [sum(r[key] for r in rows) for key in
          ('analyze_action', 'post_restore_vacuum', 'visibility_map_readiness')]
BG, INK, MUTED = '#F5F3ED', '#172B38', '#52636C'
TEAL, EMPTY, WHITE = '#007E80', '#DCE2DF', '#FFFFFF'
im = Image.new('RGB', (1600, 1050), BG)
d = ImageDraw.Draw(im)


def font(size, bold=False):
    names = (['DejaVuSans-Bold.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf']
             if bold else ['DejaVuSans.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf'])
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    raise RuntimeError('Install DejaVu Sans or Arial to render the chart.')


def text(x, y, value, size=26, color=INK, bold=False):
    d.text((x, y), value, font=font(size, bold), fill=color)


def page(x, y, filled):
    color = TEAL if filled else EMPTY
    w, h, fold = 42, 55, 11
    d.polygon([(x, y), (x+w-fold, y), (x+w, y+fold),
               (x+w, y+h), (x, y+h)], fill=color)
    d.polygon([(x+w-fold, y), (x+w-fold, y+fold), (x+w, y+fold)],
              fill='#53A5A3' if filled else '#C2CECA')
    for dy in (24, 33, 42):
        d.line((x+9, y+dy, x+w-10, y+dy), fill=WHITE if filled else '#F1F4F2', width=2)


text(64, 36, 'POSTGRES.FM  /  RESTORE READINESS', 23, TEAL, True)
text(64, 92, 'What restore guides leave out', 66, bold=True)
text(67, 179, f'{n} selected pages  ·  21 publishers  ·  20 October 2026', 27, MUTED)

# One sentence carries the headline; the graphic carries the comparison.
d.rounded_rectangle((64, 244, 1536, 344), radius=18, fill=INK)
text(94, 258, f'{n-counts[0]} of {n}', 60, WHITE, True)
text(367, 274, 'omit advice to gather statistics', 39, WHITE, True)

labels = ['Gather statistics', 'Run VACUUM', 'Explain visibility maps']
for i, (label, count) in enumerate(zip(labels, counts)):
    x = 64 + i * 500
    d.rounded_rectangle((x, 383, x+472, 886), radius=20, fill=WHITE)
    text(x+28, 409, label, 31, bold=True)
    # Seven columns and four rows: every category shows all 28 pages.
    for j in range(n):
        page(x+33+(j%7)*58, 478+(j//7)*76, j<count)
    text(x+28, 797, str(count), 64, TEAL, True)
    offset = d.textlength(str(count), font=font(64, True))
    text(x+38+offset, 824, f'/ {n} pages', 29, MUTED)
    percent = f'{count/n:.0%}'
    width = d.textlength(percent, font=font(45, True))
    text(x+442-width, 808, percent, 45, INK, True)

# Keep the essential sampling qualification on the image; details live in the report.
d.rectangle((66, 919, 85, 938), fill=TEAL)
text(97, 915, 'Covered', 23, MUTED)
d.rectangle((234, 919, 253, 938), fill=EMPTY)
text(265, 915, 'Not covered', 23, MUTED)
text(510, 915, 'One icon = one page · Direct guidance only', 23, MUTED)
text(64, 967, 'Selected-page audit, not a representative survey.', 23, MUTED)
text(64, 1003, 'Sources + method: github.com/NikolayS/postgres-fm-prep', 22, TEAL)
im.save(HERE / 'restore-docs-expanded-summary.png', optimize=True)
