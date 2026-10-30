#!/usr/bin/env python3
"""Two publication figures from measurements.csv / state.csv.

Values plotted are per-arm constants across three fresh restores where the
data say so; where ANALYZE sampling varies the estimate, the median is drawn
and the range is printed in the companion table (not here).
Usage: figures.py <out_dir>
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
ARMS = ["def-none", "def-analyze", "def-vacuum", "def-vacuum_analyze", "stats-none"]
ARM_LABEL = {
    "def-none": "default\nexport,\nnone",
    "def-analyze": "default\nexport,\nANALYZE",
    "def-vacuum": "default\nexport,\nVACUUM",
    "def-vacuum_analyze": "default\nexport,\nVACUUM\nANALYZE",
    "stats-none": "export with\n--statistics,\nnone",
}
# Chart palette
BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
INK, INK2, GRID, SURFACE = "#0b0b0b", "#52514e", "#e6e5e1", "#fcfcfb"

plt.rcParams.update({
    "font.family": "sans-serif", "font.size": 9, "axes.edgecolor": GRID,
    "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
    "axes.spines.top": False, "axes.spines.right": False, "figure.facecolor": SURFACE,
    "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
})

meas = list(csv.DictReader(open(f"{OUT}/measurements.csv")))
state = list(csv.DictReader(open(f"{OUT}/state.csv")))


def med(run, arm, query, mode, field, kind="measured"):
    vals = [float(r[field]) for r in meas
            if r["run"] == run and r["arm"] == arm and r["query"] == query
            and r["mode"] == mode and r["pass_kind"] == kind and r[field] != ""]
    return statistics.median(vals)


def vm_pct(run, arm, phase, rel="accounts"):
    rows = [s for s in state if s["run"] == run and s["arm"] == arm and s["phase"] == phase
            and s["kind"] == "vm" and s["relname"] == rel]
    return statistics.median(int(s["all_visible"]) / int(s["heap_blocks"]) * 100 for s in rows)


def vm_after_first_pass(run, arm):
    # vm_after_q1_p1 snapshot is attached to the pass-1 measurement rows
    vals = [float(r["vm_after_q1_p1_accounts_allvis"]) for r in meas
            if r["run"] == run and r["arm"] == arm and r["query"] == "q1" and r["mode"] == "natural"
            and r["pass_no"] == "1"]
    blocks = [int(s["heap_blocks"]) for s in state if s["run"] == run and s["arm"] == arm
              and s["kind"] == "vm" and s["relname"] == "accounts" and s["phase"] == "after_maint"]
    return statistics.median(vals) / statistics.median(blocks) * 100


def compact(v, _pos=None):
    if v >= 1_000_000:
        return f"{v/1e6:g}M"
    if v >= 1_000:
        return f"{v/1e3:g}K"
    return f"{v:g}"


def bars(ax, values, color, labels, fmt=compact, ymax=None):
    x = range(len(values))
    b = ax.bar(x, values, width=0.55, color=color, zorder=3)
    for rect in b:
        rect.set_linewidth(0)
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, fontsize=7.5, color=INK2)
    ax.yaxis.grid(True, color=GRID, linewidth=1, zorder=0)
    ax.set_axisbelow(True)
    ax.yaxis.set_major_formatter(FuncFormatter(compact))
    ax.set_ylim(0, ymax if ymax else max(values) * 1.18 if max(values) > 0 else 1)
    ax.tick_params(length=0)
    ax.spines["left"].set_visible(False)
    for rect, v in zip(b, values):
        ax.annotate(fmt(v), (rect.get_x() + rect.get_width() / 2, rect.get_height()),
                    xytext=(0, 3), textcoords="offset points", ha="center", va="bottom",
                    fontsize=8, color=INK)


def grouped(ax, series, colors, names, labels, ymax=None, fmt=compact, stagger=0):
    n = len(series)
    w = 0.36
    for i, (vals, c, name) in enumerate(zip(series, colors, names)):
        xs = [k + (i - (n - 1) / 2) * (w + 0.03) for k in range(len(vals))]
        b = ax.bar(xs, vals, width=w, color=c, label=name, zorder=3, linewidth=0)
        for rect, v in zip(b, vals):
            if stagger and i == 1:
                continue  # actual rows are constant; stated in the panel title instead
            ax.annotate(fmt(v), (rect.get_x() + rect.get_width() / 2, rect.get_height()),
                        xytext=(0, 3), textcoords="offset points", ha="center", va="bottom",
                        fontsize=7, color=INK)
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(labels, fontsize=7.5, color=INK2)
    ax.yaxis.grid(True, color=GRID, linewidth=1, zorder=0)
    ax.set_axisbelow(True)
    ax.yaxis.set_major_formatter(FuncFormatter(compact))
    top = max(max(s) for s in series)
    ax.set_ylim(0, ymax if ymax else top * 1.22)
    ax.tick_params(length=0)
    ax.spines["left"].set_visible(False)


labels = [ARM_LABEL[a] for a in ARMS]

# ---------------- Figure 1: skewed join (Q2), Postgres 18.6 ----------------
R = "pg18"
est = [med(R, a, "q2", "natural", "est_rows") for a in ARMS]
act = [med(R, a, "q2", "natural", "act_rows") for a in ARMS]
loops = [med(R, a, "q2", "natural", "max_loops") for a in ARMS]
bufs = [med(R, a, "q2", "natural", "root_buffers") for a in ARMS]
shapes = {a: sorted({r["root_node"] for r in meas if r["run"] == R and r["arm"] == a
                     and r["query"] == "q2" and r["mode"] == "natural" and r["pass_kind"] == "measured"})
          for a in ARMS}

fig, axes = plt.subplots(1, 3, figsize=(14, 4.6))
grouped(axes[0], [est, act], [ORANGE, BLUE], ["planner estimate", "actual rows"], labels, stagger=1, ymax=130000)
axes[0].set_title("Estimated vs actual rows\n(actual = 98,960 in every arm)", loc="left", fontsize=9, color=INK)
axes[0].legend(frameon=False, fontsize=8, loc="center right")
bars(axes[1], loops, BLUE, labels)
axes[1].set_title("Maximum loops of any plan node", loc="left", fontsize=9.5, color=INK)
bars(axes[2], bufs, BLUE, labels)
axes[2].set_title("Root shared buffer accesses (hit + read)", loc="left", fontsize=9.5, color=INK)
for ax, a_list in zip(axes, [ARMS] * 3):
    for k, a in enumerate(a_list):
        ax.text(k, -0.42, "/".join(shapes[a]).replace("Nested Loop", "Nested Loop\n+ Index Scan").replace("Hash Join", "Hash Join"),
                transform=ax.get_xaxis_transform(), ha="center", va="top", fontsize=6.8, color=INK2, style="italic")
fig.suptitle("Skewed join after pg_restore, Postgres 18.6: five arms, three fresh restores each (medians; buffer and loop values are identical across restores)",
             x=0.01, ha="left", fontsize=9.5, color=INK)
fig.text(0.01, 0.005, "orders (100,000 rows, status 99:1) joined to customers (200,000 rows), WHERE status = 'completed'. "
         "Buffer accesses are block accesses, not distinct pages, physical reads or time. Y axes start at 0.",
         fontsize=7.2, color=INK2)
fig.tight_layout(rect=(0, 0.05, 1, 0.93))
fig.savefig(f"{OUT}/fig1_skewed_join_pg18.png", dpi=200)
fig.savefig(f"{OUT}/fig1_skewed_join_pg18.svg")

# ---------------- Figure 2: covering range query (Q1), Postgres 18.6 vs 19rc1 ----------------
runs = ["pg18", "pg19"]
names = ["Postgres 18.6", "Postgres 19rc1"]
vm_maint = [[vm_pct(r, a, "after_maint") for a in ARMS] for r in runs]
vm_first = [[vm_after_first_pass(r, a) for a in ARMS] for r in runs]
nat = [[med(r, a, "q1", "natural", "root_buffers") for a in ARMS] for r in runs]
hf = [[med(r, a, "q1", "forced_ios", "heap_fetches", kind="diagnostic") for a in ARMS] for r in runs]
natplan = {(r, a): sorted({x["root_node"] for x in meas if x["run"] == r and x["arm"] == a and x["query"] == "q1"
                            and x["mode"] == "natural" and x["pass_kind"] == "measured"}) for r in runs for a in ARMS}

fig, axes = plt.subplots(2, 2, figsize=(13, 8.6))
pct = lambda v, _p=None: f"{v:.0f}%" if v == 0 or v >= 1 else f"{v:.1f}%"
grouped(axes[0, 0], vm_maint, [BLUE, ORANGE], names, labels, ymax=118, fmt=pct)
axes[0, 0].yaxis.set_major_formatter(FuncFormatter(pct))
axes[0, 0].set_title("All-visible heap pages of accounts after maintenance, before any query", loc="left", fontsize=9.5, color=INK)
axes[0, 0].legend(frameon=False, fontsize=8, loc="upper left")
grouped(axes[0, 1], vm_first, [BLUE, ORANGE], names, labels, ymax=118, fmt=pct)
axes[0, 1].yaxis.set_major_formatter(FuncFormatter(pct))
axes[0, 1].set_title("All-visible heap pages after the first execution of the range query", loc="left", fontsize=9.5, color=INK)
grouped(axes[1, 0], nat, [BLUE, ORANGE], names, labels)
axes[1, 0].set_title("Natural plan, measured passes: root shared buffer accesses (hit + read)", loc="left", fontsize=9.5, color=INK)
for k, a in enumerate(ARMS):
    axes[1, 0].text(k, -0.40, "/".join(natplan[("pg18", a)]).replace("Bitmap Heap Scan", "Bitmap Heap\nScan"),
                    transform=axes[1, 0].get_xaxis_transform(), ha="center", va="top", fontsize=6.8, color=INK2, style="italic")
grouped(axes[1, 1], hf, [BLUE, ORANGE], names, labels)
axes[1, 1].set_title("Diagnostic only: forced Index Only Scan, heap fetches", loc="left", fontsize=9.5, color=INK)
fig.suptitle("Covering-index range query after pg_restore: 200,000-row table in random heap order, 10,000 keys returned",
             x=0.01, ha="left", fontsize=9.5, color=INK)
fig.text(0.01, 0.005, "Natural plan is the planner's own choice; the forced scan is a separately labelled diagnostic, not a baseline. Medians over 3 fresh restores.\n"
         "Postgres 19rc1 set visibility-map bits during the first read in 8 of the 9 targets whose VM was empty; relallvisible in pg_class stayed 0 until ANALYZE or VACUUM. Y axes start at 0.",
         fontsize=7.2, color=INK2)
fig.tight_layout(rect=(0, 0.045, 1, 0.95))
fig.savefig(f"{OUT}/fig2_covering_query_pg18_pg19.png", dpi=200)
fig.savefig(f"{OUT}/fig2_covering_query_pg18_pg19.svg")
print("figure data:")
print("fig1 est", est, "act", act, "loops", loops, "bufs", bufs)
print("fig2 vm_maint", vm_maint, "vm_first", vm_first, "nat", nat, "hf", hf)
