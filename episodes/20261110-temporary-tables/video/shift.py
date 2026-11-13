# YouTube final v7 = cold open (montage) + v6: shift captions and description by the cold open length,
# and add cold-open cues from the word timings of the montage lines (final v6 seconds).
import json, re
SEG = [(1891.70, 1893.44), (1283.38, 1288.85), (1539.05, 1545.50), (1623.22, 1628.60), (2198.86, 2200.55)]
OFF = 20.84
toks = [t for c in json.load(open("40-youtube.en.cues.json")) for t in c.get("toks", [])]
def fmt(t, sep):
    ms = round(t * 1000); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}{sep}{ms:03}"
def lines(words, maxc=42):
    out = [""]
    for w in words:
        if out[-1] and len(out[-1]) + 1 + len(w) > maxc: out.append(w)
        else: out[-1] = (out[-1] + " " + w).strip()
    return out
co, base = [], 0.0
for a, b in SEG:
    ws = [t for t in toks if t["start"] >= a - 0.01 and t["end"] <= b + 0.01]
    ws[0] = dict(ws[0]); words = [t["text"] for t in ws]
    words[0] = words[0][0].upper() + words[0][1:]
    if ws[0]["text"].lower() == "you're": pass
    words[-1] = re.sub(r"[,]$", ".", words[-1])
    if a == 1891.70: words[-1] += "?"
    spk = ws[0]["speaker"]; ls = lines([f"{spk}:"] + words)
    # at most 2 lines per cue: split at the word nearest the middle of the line list
    groups = [ls[i:i + 2] for i in range(0, len(ls), 2)]
    n = sum(len(g) for g in groups); t0 = base + ws[0]["start"] - a; t1 = base + ws[-1]["end"] - a + 0.1
    acc = 0
    for g in groups:
        k = len(g); s = t0 + (t1 - t0) * acc / n; e = t0 + (t1 - t0) * (acc + k) / n; acc += k
        co.append((s, min(e, base + b - a), g))
    base += b - a
co[-1] = (co[-1][0], min(co[-1][1], OFF - 0.3), co[-1][2])
TS = re.compile(r"(\d\d):(\d\d):(\d\d)([,.])(\d\d\d)")
sh = lambda txt: TS.sub(lambda m: fmt(int(m[1])*3600+int(m[2])*60+int(m[3])+int(m[5])/1000+OFF, m[4]), txt)
blocks = open("40-youtube.en.srt").read().strip().split("\n\n")
out = [f"{fmt(s, ',')} --> {fmt(e, ',')}\n" + "\n".join(g) for s, e, g in co] + [sh("\n".join(b.split("\n")[1:])) for b in blocks]
open("42-youtube.en.srt", "w").write("\n\n".join(f"{i}\n{c}" for i, c in enumerate(out, 1)) + "\n")
head, body = open("40-youtube.en.vtt").read().split("\n\n", 1)
open("42-youtube.en.vtt", "w").write(head + "\n\n" + "\n\n".join(f"{fmt(s, '.')} --> {fmt(e, '.')}\n" + "\n".join(g) for s, e, g in co) + "\n\n" + sh(body))
# description: cold-open chapter, chapters and link times shifted
s = open("41-notes/youtube-description.txt").read()
MS = re.compile(r"(?<![\d:])(\d{1,2}):(\d\d)(?![\d:])")
def shm(m):
    t = round(int(m[1])*60 + int(m[2]) + OFF); return f"{t//60:02}:{t%60:02}" if len(m[1]) == 2 else f"{t//60}:{t%60:02}"
pre, rest = s.split("Chapters:\n", 1); ch, post = rest.split("\n\n", 1)
ch = "00:00 Cold open\n" + MS.sub(shm, ch)
kl, post2 = post.split("Related episodes:", 1)
kl = re.sub(r"\((\d{1,2}):(\d\d)\)", lambda m: "(" + shm(m) + ")", kl)
open("41-notes/youtube-description.v7.txt", "w").write(pre + "Chapters:\n" + ch + "\n\n" + kl + "Related episodes:" + post2)

# Hand-tuned cold-open breaks (2026-11-13): break at phrase ends, not mid-phrase.
for f in ('42-youtube.en.srt', '42-youtube.en.vtt'):
    s = open(f).read()
    for a, b in [("Nik: You're basically already falling from\nthe cliff and just lie down there on the", "Nik: You're basically already falling\nfrom the cliff"),
                 ("\nbottom.\n", "\nand just lie down there on the bottom.\n"),
                 ('Kirk: "Hey, just confirm that you know you\nhave to update your cache here, because', 'Kirk: "Hey, just confirm that you know\nyou have to update your cache here,'),
                 ('\nsomebody created a temp table."\n', '\nbecause somebody created a temp table."\n')]:
        s = s.replace(a, b, 1)
    open(f, 'w').write(s)
