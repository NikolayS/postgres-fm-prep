#!/usr/bin/env python3
"""Raise Michael's speech in the edited body (his microphone is about 9 dB quieter than Nik's).

Usage: python3 michael-boost.py <recording dir> <in.mp4> <out.mp4> [dB]

Michael's turns come from the transcript speaker labels (speaker_0 in review/work/src.words.json).
They are mapped through edited-v2.cuts.json to output time. The audio gets +dB in his turns
(default 8), then a limiter and the same two-pass loudnorm as render.ts (-16 LUFS, TP -2).
The video stream is copied.
"""
import bisect, json, re, subprocess, sys
from pathlib import Path

rec, src, out = sys.argv[1:4]
db = float(sys.argv[4]) if len(sys.argv) > 4 else 8.0
here = Path(__file__).resolve().parent
W = [w for w in json.load(open(f"{rec}/review/work/src.words.json"))["words"] if w.get("type", "word") == "word"]
seg = json.load(open(here / "edited-v2.cuts.json"))["segmentTimes"]
MICHAEL = "speaker_0"

# Michael's turns in source time, padded but not into another speaker's words.
oth = [w for w in W if w["speaker"] != MICHAEL]
oe = sorted(w["end"] for w in oth); os_ = sorted(w["start"] for w in oth)
turns = []
for i, w in enumerate(W):
    if w["speaker"] != MICHAEL: continue
    if turns and w["start"] - turns[-1][1] < 1.5 and W[i - 1]["speaker"] == MICHAEL: turns[-1][1] = w["end"]
    else: turns.append([w["start"], w["end"]])
src_turns = []
for s, e in turns:
    j = bisect.bisect_right(oe, s + 0.01); prev = oe[j - 1] if j else 0
    k = bisect.bisect_left(os_, e - 0.01); nxt = os_[k] if k < len(os_) else 1e9
    a, b = max(s - 0.12, min(prev, s)), min(e + 0.25, max(nxt, e))
    if b - a > 0.05: src_turns.append((a, b))

# Map to output time through the kept segments.
outr = []
for a, b in src_turns:
    for g in seg:
        lo, hi = max(a, g["srcStart"]), min(b, g["srcEnd"])
        if hi > lo: outr.append((g["outStart"] + lo - g["srcStart"], g["outStart"] + hi - g["srcStart"]))
outr.sort()
merged = []
for a, b in outr:
    if merged and a - merged[-1][1] < 0.05: merged[-1][1] = max(merged[-1][1], b)
    else: merged.append([a, b])
print(f"{len(src_turns)} source turns -> {len(merged)} output ranges, {sum(b - a for a, b in merged):.0f} s, +{db} dB")

expr = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in merged)
lin = 10 ** (db / 20)
pre = f"volume='if({expr},{lin:.4f},1)':eval=frame,alimiter=limit=0.89:attack=5:release=50:level=false"
LN = "loudnorm=I=-16:TP=-2.0:LRA=11"
m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-vn", "-af", f"{pre},{LN}:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", m)[-1])
ln2 = f"{LN}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-af", f"{pre},{ln2},aresample=48000",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], check=True)
json.dump([[round(a, 3), round(b, 3)] for a, b in merged], open(Path(out).with_suffix(".michael.json"), "w"))
print(f"wrote {out}")
