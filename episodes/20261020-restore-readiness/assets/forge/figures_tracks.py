#!/usr/bin/env python3
"""Figures 3 and 4 for the additional tracks.
fig3: first read after restore — WAL bytes and pages dirtied by one SELECT.
fig4: stock autovacuum — seconds until all three tables were autovacuumed and
      autoanalyzed after each fresh restore (dots), per server.
Usage: figures_tracks.py <out_dir>   (reads tracks_measurements.csv there)
"""
import csv
import statistics
import sys
from collections import defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

OUT = sys.argv[1]
BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
INK, INK2, GRID, SURFACE = "#0b0b0b", "#52514e", "#e6e5e1", "#fcfcfb"
plt.rcParams.update({
    "font.family": "sans-serif", "font.size": 9, "axes.edgecolor": GRID,
    "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
    "axes.spines.top": False, "axes.spines.right": False, "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
})
rows = list(csv.DictReader(open(f"{OUT}/tracks_measurements.csv")))


def compact(v, _pos=None):
    if v >= 1_000_000:
        return f"{v/1e6:g}M"
    if v >= 1_000:
        return f"{v/1e3:g}K"
    return f"{v:g}"


def mib(v, _pos=None):
    return f"{v/1048576:g} MiB" if v else "0"


MIB = 1048576


def style(ax, fmt=compact, ymax=None, top=1.0):
    ax.yaxis.grid(True, color=GRID, linewidth=1, zorder=0)
    ax.set_axisbelow(True)
    ax.yaxis.set_major_formatter(FuncFormatter(fmt))
    ax.set_ylim(0, ymax if ymax else top * 1.25 if top > 0 else 1)
    ax.tick_params(length=0)
    ax.spines["left"].set_visible(False)


def grouped(ax, series, colors, names, labels, fmt=compact, ymax=None, labfmt=None):
    n = len(series)
    w = 0.8 / n
    for i, (vals, c, name) in enumerate(zip(series, colors, names)):
        xs = [k + (i - (n - 1) / 2) * (w + 0.02) for k in range(len(vals))]
        b = ax.bar(xs, vals, width=w, color=c, label=name, zorder=3, linewidth=0)
        for rect, v in zip(b, vals):
            ax.annotate((labfmt or fmt)(v), (rect.get_x() + rect.get_width() / 2, rect.get_height()),
                        xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=7, color=INK)
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, fontsize=7.5, color=INK2)
    style(ax, fmt, ymax, max(max(s) for s in series))


# ---------------- fig3: first-read cost ----------------
def med(run, arm, tag, field):
    v = [float(r[field]) for r in rows if r["track"] == "first_read" and r["run"] == run and r["arm"] == arm and r["tag"] == tag]
    return statistics.median(v) if v else 0


runs = [("frc2_pg18_checksums", "Postgres 18.6, checksums on (default)"),
        ("frc2_pg18_nochecksums_real", "Postgres 18.6, checksums off"),
        ("frc2_pg19_checksums", "Postgres 19rc1, checksums on")]
runs = [(r, n) for r, n in runs if any(x["run"] == r for x in rows)]
colors = [BLUE, AQUA, ORANGE][:len(runs)]
cases = [("none_ckpt", "seq_events_first", "SELECT count(*)\nindex-less table,\nafter checkpoint"),
         ("none_nockpt", "seq_events_first", "SELECT count(*)\nindex-less table,\nno checkpoint"),
         ("none_ckpt", "seq_accounts_first", "SELECT count(*)\nindexed table,\nafter range query"),
         ("none_ckpt", "q1_first", "range query\nindexed table,\nafter checkpoint"),
         ("vacuum_ckpt", "seq_events_first", "SELECT count(*)\nindex-less table,\nafter VACUUM")]
labels = [c[2] for c in cases]
fig, axes = plt.subplots(1, 2, figsize=(13, 4.8))
wal = [[med(r, a, t, "wal_bytes") for a, t, _ in cases] for r, _ in runs]
dirt = [[med(r, a, t, "dirtied") for a, t, _ in cases] for r, _ in runs]
grouped(axes[0], wal, colors, [n for _, n in runs], labels, fmt=mib, ymax=36 * MIB, labfmt=lambda v: f"{v/MIB:.1f}" if v else "0")
axes[0].set_yticks([0, 8 * MIB, 16 * MIB, 24 * MIB, 32 * MIB])
axes[0].set_title("WAL written by the statement itself (labels in MiB)", loc="left", fontsize=9.5, color=INK)
axes[0].legend(frameon=False, fontsize=8, loc="upper right")
grouped(axes[1], dirt, colors, [n for _, n in runs], labels)
axes[1].set_title("Shared blocks dirtied (heap plus other blocks)", loc="left", fontsize=9.5, color=INK)
fig.suptitle("Post-restore reads can write: hint bits (18.6) and visibility-map bits (19rc1)",
             x=0.01, ha="left", fontsize=9.5, color=INK)
fig.text(0.01, 0.025, "200,000-row tables, 27 MiB heap each. Indexed tables already had their hint bits set by CREATE INDEX during the restore.\n"
         "full_page_writes=on, wal_log_hints=off, wal_compression=off. Indexed count follows range query. Medians of 3 restores.",
         fontsize=7.2, color=INK2)
fig.tight_layout(rect=(0, 0.11, 1, 0.93))
fig.savefig(f"{OUT}/fig3_first_read_cost.png", dpi=200)
fig.savefig(f"{OUT}/fig3_first_read_cost.svg")

# ---------------- fig4: stock autovacuum arrival ----------------
fig, ax = plt.subplots(figsize=(8, 4))
srv = [("stock_pg18", "Postgres 18.6"), ("stock_pg19", "Postgres 19rc1")]
pts = defaultdict(list)
for r in csv.DictReader(open(f"{OUT}/stock-times.csv")):
    arm = r["target"].split("_", 1)[1]
    pts[(r["run"], arm)].append(float(r["elapsed_seconds"]))
xt, xl = [], []
k = 0
for run, name in srv:
    for arch, c in (("default", BLUE), ("stats", ORANGE)):
        ys = pts[(run, arch)]
        xs = [k + (i - (len(ys) - 1) / 2) * 0.12 for i in range(len(ys))]
        ax.scatter(xs, ys, s=60, color=c, zorder=3, edgecolors=SURFACE, linewidths=2)
        for x, y in zip(xs, ys):
            ax.annotate(f"{y:.1f}", (x, y), xytext=(0, 7), textcoords="offset points", ha="center", fontsize=7.5, color=INK)
        xt.append(k)
        xl.append(f"{name}\n{'default export' if arch == 'default' else 'export with --statistics'}")
        k += 1
ax.set_xticks(xt)
ax.set_xticklabels(xl, fontsize=7.5, color=INK2)
style(ax, fmt=lambda v, _p=None: f"{v:g} s", top=max(max(v) for v in pts.values()))
ax.axhline(60, color=GRID, linewidth=1, zorder=1)
ax.annotate("autovacuum_naptime = 60 s", (k - 0.5, 60), xytext=(0, 4), textcoords="offset points", ha="right", fontsize=7.5, color=INK2)
ax.set_title("Seconds from restore exit until autovacuum and autoanalyze had processed all three tables\n(one dot per fresh restore)",
             loc="left", fontsize=9, color=INK)
fig.text(0.01, 0.025, "Stock autovacuum settings, 63 MiB fixture. Immediate plans differed from plans observed after maintenance.\n"
         "Polling observations, not exact completion instants; not a production latency forecast. Y axis starts at 0.", fontsize=7.2, color=INK2)
fig.tight_layout(rect=(0, 0.12, 1, 1))
fig.savefig(f"{OUT}/fig4_stock_autovacuum_arrival.png", dpi=200)
fig.savefig(f"{OUT}/fig4_stock_autovacuum_arrival.svg")
print("fig3 wal", wal, "dirt", dirt)
print("fig4", dict(pts))
